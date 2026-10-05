import React, { useState, useRef, useEffect } from 'react';
import {
  Bike,
  Car,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  ArrowRight,
  X,
  AlertCircle,
  FileCheck,
  Trash2,
  Sparkles,
  Eye
} from 'lucide-react';
import { DeliveryPartnerApplication, Language, UserProfile } from '../types';

interface DeliveryRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  user: UserProfile | null;
  onSubmitSuccess: (application: DeliveryPartnerApplication) => void;
}

export const DeliveryRegistrationModal: React.FC<DeliveryRegistrationModalProps> = ({
  isOpen,
  onClose,
  language,
  user,
  onSubmitSuccess,
}) => {
  const isEn = language === 'en';

  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [address, setAddress] = useState('No. 18, Jalan Desa Bakti, Taman Desa, 58100 Kuala Lumpur');
  const [idNumber, setIdNumber] = useState('950412-14-5391');
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'car'>('motorcycle');
  const [plateNumber, setPlateNumber] = useState('WXX 8492');

  // Driver's License Document Upload state
  const [licenseDocName, setLicenseDocName] = useState<string>('JPJ-License-B2-Faiz.jpg');
  const [licenseDocUrl, setLicenseDocUrl] = useState<string>(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80'
  );
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with user profile when modal opens or user logs in
  useEffect(() => {
    if (user?.name && !fullName) {
      setFullName(user.name);
    }
    if (user?.phone && !phoneNumber) {
      setPhoneNumber(user.phone);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setValidationError(null);
    setLicenseDocName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setLicenseDocUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAttachSampleLicense = () => {
    setValidationError(null);
    setLicenseDocName('JPJ-Driver-License-Class-B2-Official.png');
    setLicenseDocUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80');
  };

  const handleClearLicense = () => {
    setLicenseDocName('');
    setLicenseDocUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate mandatory fields
    if (!fullName.trim()) {
      setValidationError(isEn ? 'Full Name is required.' : 'Nama Penuh diperlukan.');
      return;
    }
    if (!phoneNumber.trim()) {
      setValidationError(isEn ? 'Phone Number is required.' : 'Nombor Telefon diperlukan.');
      return;
    }
    if (!address.trim()) {
      setValidationError(isEn ? 'Residential Address is required.' : 'Alamat Kediaman diperlukan.');
      return;
    }
    if (!idNumber.trim()) {
      setValidationError(isEn ? 'ID / IC Number (رقم الهوية) is required.' : 'No. Kad Pengenalan (رقم الهوية) diperlukan.');
      return;
    }
    if (!plateNumber.trim()) {
      setValidationError(isEn ? 'Vehicle / Motorcycle Registration Number is required.' : 'Nombor Pendaftaran Kenderaan diperlukan.');
      return;
    }
    if (!licenseDocUrl) {
      setValidationError(
        isEn
          ? "Driver's License Document Upload is required. Please upload your license photo or use sample."
          : 'Muat naik Dokumen Lesen Memandu adalah wajib. Sila muat naik foto lesen anda atau gunakan contoh dokumen.'
      );
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const refNo = 'DMART-RIDER-' + Math.floor(10000 + Math.random() * 90000);
      const newApp: DeliveryPartnerApplication = {
        id: 'del-app-' + Date.now(),
        referenceNo: refNo,
        fullName: fullName.trim(),
        nationality: 'Malaysian',
        idNumber: idNumber.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        vehicleType,
        plateNumber: plateNumber.trim().toUpperCase(),
        licenseDocName: licenseDocName || 'driver_license.png',
        licenseDocUrl,
        submittedAt: new Date().toISOString(),
        status: 'pending', // Explicitly saved with status: "pending" flag
      };

      setIsSubmitting(false);
      onSubmitSuccess(newApp);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-xs">
              <Bike className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/30">
                  {isEn ? 'D-mart Fleet Partner' : 'Rakan Rider D-mart'}
                </span>
                <span className="bg-emerald-700/80 text-emerald-100 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {isEn ? 'Rider Onboarding' : 'Pendaftaran Rider'}
                </span>
              </div>
              <h3 className="font-black text-lg sm:text-xl leading-tight">
                {isEn ? 'Delivery Partner Registration' : 'Pendaftaran Rakan Penghantar'}
              </h3>
              <p className="text-xs text-emerald-200">
                {isEn
                  ? 'Complete the mandatory rider details to join our express delivery fleet'
                  : 'Lengkapkan maklumat wajib rider untuk menyertai armada penghantaran pantas'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Info Box */}
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div className="leading-snug">
              <span className="font-bold">
                {isEn ? 'Direct Supermarket Dispatch Orders' : 'Pesanan Penghantaran Terus Pasaraya'}
              </span>
              <span className="block text-emerald-800 text-[11px]">
                {isEn
                  ? 'Earn RM 8 - RM 15+ per drop-off from Mid Valley & Klang Valley hubs. Free flexible hours.'
                  : 'Pendapatan RM 8 - RM 15+ setiap penghantaran dari hab Mid Valley & Lembah Klang. Masa fleksibel.'}
              </span>
            </div>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Mandatory Field 1: Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Full Name' : 'Nama Penuh'}</span>
                <span className="text-red-500 font-bold">*</span>
              </span>
              <span className="text-[10px] text-gray-500 font-normal">
                {isEn ? 'As per National ID' : 'Seperti dalam Kad Pengenalan'}
              </span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isEn ? 'e.g. Ahmad Faiz bin Azlan' : 'cth. Ahmad Faiz bin Azlan'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
            />
          </div>

          {/* Mandatory Field 2: Phone Number */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Phone Number' : 'Nombor Telefon'}</span>
                <span className="text-red-500 font-bold">*</span>
              </span>
              <span className="text-[10px] text-gray-500 font-normal">
                {isEn ? 'For dispatcher & customer calls' : 'Untuk panggilan hub & pelanggan'}
              </span>
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 012-8492019"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
            />
          </div>

          {/* Mandatory Field 3: Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Address' : 'Alamat Kediaman'}</span>
                <span className="text-red-500 font-bold">*</span>
              </span>
              <span className="text-[10px] text-gray-500 font-normal">
                {isEn ? 'Home / base dispatch location' : 'Lokasi pangkalan / rumah'}
              </span>
            </label>
            <textarea
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={
                isEn
                  ? 'e.g. No. 18, Jalan Desa Bakti, Taman Desa, 58100 Kuala Lumpur'
                  : 'cth. No. 18, Jalan Desa Bakti, Taman Desa, 58100 Kuala Lumpur'
              }
              className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all resize-none"
            />
          </div>

          {/* Mandatory Field 4: ID / IC Number (رقم الهوية) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>ID / IC Number (رقم الهوية)</span>
                <span className="text-red-500 font-bold">*</span>
              </span>
              <span className="text-[10px] text-gray-500 font-normal">
                {isEn ? 'MyKad / National ID / Passport' : 'MyKad / Pasport'}
              </span>
            </label>
            <input
              type="text"
              required
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="e.g. 950412-14-5391"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all font-mono"
            />
          </div>

          {/* Mandatory Field 5: Vehicle / Motorcycle Registration Number */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Vehicle / Motorcycle Registration Number' : 'No. Pendaftaran Kenderaan / Motosikal'}</span>
                <span className="text-red-500 font-bold">*</span>
              </span>
              <span className="text-[10px] text-gray-500 font-normal">
                {isEn ? 'Road tax verified' : 'Disahkan cukai jalan'}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setVehicleType('motorcycle')}
                className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  vehicleType === 'motorcycle'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    vehicleType === 'motorcycle' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black">{isEn ? 'Motorcycle' : 'Motosikal'}</div>
                  <div className="text-[10px] text-gray-500">{isEn ? 'Express delivery' : 'Hantaran pantas'}</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setVehicleType('car')}
                className={`p-2.5 rounded-xl border-2 flex items-center gap-2.5 text-left transition-all cursor-pointer ${
                  vehicleType === 'car'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold shadow-2xs'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    vehicleType === 'car' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black">{isEn ? 'Car / Van' : 'Kereta / Van'}</div>
                  <div className="text-[10px] text-gray-500">{isEn ? 'Bulky orders' : 'Pesanan pukal'}</div>
                </div>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                placeholder={isEn ? 'Plate Number, e.g. WXX 8492' : 'No. Plat, cth. WXX 8492'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-mono font-bold tracking-wider uppercase outline-none transition-all"
              />
            </div>
          </div>

          {/* Mandatory Field 6: Driver's License Document Upload */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? "Driver's License Document Upload" : 'Muat Naik Dokumen Lesen Memandu'}</span>
                <span className="text-red-500 font-bold">*</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {isEn ? 'JPJ Class B2 / D' : 'Lesen JPJ B2 / D'}
              </span>
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Area / Preview Card */}
            {licenseDocUrl ? (
              <div className="p-3 bg-emerald-50/70 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-300 bg-white shrink-0 flex items-center justify-center">
                    <img
                      src={licenseDocUrl}
                      alt="Driver's License Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-emerald-950 truncate block">
                        {licenseDocName || "Driver_License_Document.jpg"}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {isEn ? 'Document attached & ready for review' : 'Dokumen dilampirkan & sedia disemak'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 rounded-lg border border-gray-200 transition-colors cursor-pointer"
                  >
                    {isEn ? 'Change' : 'Tukar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLicense}
                    title="Remove document"
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-600 bg-emerald-50/80 scale-[1.01]'
                    : 'border-gray-300 hover:border-emerald-500 bg-gray-50/80 hover:bg-emerald-50/30'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-800">
                  {isEn ? "Click to upload Driver's License or drag & drop" : 'Klik untuk muat naik Lesen Memandu atau seret fail ke sini'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {isEn ? 'Supports JPG, PNG, PDF up to 10MB' : 'Menyokong JPG, PNG, PDF sehingga 10MB'}
                </p>

                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAttachSampleLicense();
                    }}
                    className="text-[10px] font-bold bg-white hover:bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{isEn ? 'Attach Sample License (1-Click)' : 'Lampirkan Contoh Lesen (1-Klik)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Terms & Verification Disclaimer */}
          <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
            {isEn
              ? 'By submitting, your application will be saved with pending status for administrative verification.'
              : 'Dengan menghantar, permohonan anda akan disimpan dengan status menunggu kelulusan pentadbiran.'}
          </p>

          {/* Submit Button at the bottom */}
          <div className="pt-2 sticky bottom-0 bg-white/95 backdrop-blur-xs py-2 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              id="rider-submit-application-btn"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{isEn ? 'Saving Application...' : 'Menyimpan Permohonan...'}</span>
              ) : (
                <>
                  <span>{isEn ? 'Submit' : 'Hantar Permohonan'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
