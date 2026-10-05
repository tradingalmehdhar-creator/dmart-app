import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Phone,
  MapPin,
  Sparkles,
  Cloud,
  FileCheck,
  Eye,
  Info
} from 'lucide-react';
import { PdfConfigSettings, DEFAULT_PDF_CONFIG, Language } from '../../types';
import {
  savePdfConfigToFirestore,
  getPdfConfigFromFirestore,
  subscribeToPdfConfig
} from '../../firebase_config';
import {
  getGlobalPdfConfig,
  setGlobalPdfConfig,
  exportSamplePdfPreview
} from '../../utils/pdfGenerator';

interface AdminPdfSettingsPanelProps {
  language: Language;
}

export const AdminPdfSettingsPanel: React.FC<AdminPdfSettingsPanelProps> = ({ language }) => {
  const isEn = language === 'en';

  const [formData, setFormData] = useState<PdfConfigSettings>(() => getGlobalPdfConfig());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Subscribe to live Firestore pdf_config
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToPdfConfig((cloudConfig) => {
      if (!isMounted) return;
      if (cloudConfig) {
        setFormData(cloudConfig);
        setGlobalPdfConfig(cloudConfig);
        setIsCloudSynced(true);
        if (cloudConfig.updatedAt) {
          setLastSavedAt(new Date(cloudConfig.updatedAt).toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }));
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleChange = (field: keyof PdfConfigSettings, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Instant in-memory sync for preview and exports
      setGlobalPdfConfig(updated);
      return updated;
    });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await savePdfConfigToFirestore(formData);
      setGlobalPdfConfig(formData);
      setIsCloudSynced(true);
      const timeStr = new Date().toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedAt(timeStr);
      showToast(
        isEn
          ? 'PDF & Statement settings successfully saved to Firestore!'
          : 'Tetapan PDF & Penyata berjaya disimpan ke Firestore!'
      );
    } catch (error) {
      console.error('Error saving PDF config:', error);
      showToast(
        isEn
          ? 'Failed to save to Firestore. Saved locally.'
          : 'Gagal simpan ke Firestore. Disimpan secara setempat.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        isEn
          ? 'Reset all PDF and statement branding to system defaults?'
          : 'Tetapkan semula semua penjenamaan PDF dan penyata kepada lalai sistem?'
      )
    ) {
      setFormData(DEFAULT_PDF_CONFIG);
      setGlobalPdfConfig(DEFAULT_PDF_CONFIG);
      showToast(
        isEn ? 'Form reset to default official settings' : 'Borang ditetapkan semula kepada tetapan lalai'
      );
    }
  };

  const handleTestDownload = () => {
    try {
      exportSamplePdfPreview(formData);
      showToast(
        isEn
          ? 'Sample test PDF downloaded with current settings!'
          : 'Sampel PDF berjaya dimuat turun dengan tetapan semasa!'
      );
    } catch (err) {
      console.error('Error exporting sample PDF:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-500/50 text-xs font-bold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                {isEn ? 'PDF & Financial Statement Branding Console' : 'Konsol Penjenamaan PDF & Penyata Kewangan'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-emerald-600" />
                {isCloudSynced ? 'Firestore Live Synced' : 'Local Storage Mode'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              {isEn
                ? 'Configure official company identity, SSM registration number, header titles, and legal disclaimers dynamically injected into all generated Admin, Rider, Payout, and Closure PDF statements.'
                : 'Konfigurasi identiti rasmi syarikat, nombor pendaftaran SSM, tajuk pengepala, dan penafian undang-undang yang dijana secara automatik ke dalam semua PDF Admin, Rider, Payout, dan Penutupan Harian.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleTestDownload}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Download test PDF with current settings"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEn ? 'Download Test PDF' : 'Muat Turun Sampel'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Real-Time Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveChanges} className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-black text-sm text-gray-900">
                  {isEn ? 'Corporate Identity & Official Header' : 'Identiti Korporat & Pengepala Rasmi'}
                </h3>
              </div>
              {lastSavedAt && (
                <span className="text-[10px] text-gray-400 font-mono">
                  {isEn ? `Saved at ${lastSavedAt}` : `Disimpan pada ${lastSavedAt}`}
                </span>
              )}
            </div>

            {/* Field 1: Company Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <span>{isEn ? 'Official Company / Brand Name' : 'Nama Syarikat / Jenama Rasmi'}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleChange('companyName', 'D-mart Supermarket & Retail Logistics')}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Preset 1
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleChange('companyName', 'D-mart Retail (Malaysia) Sdn. Bhd.')}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Preset 2
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="e.g. D-mart Supermarket & Retail Logistics"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {isEn
                  ? 'Displays as the primary bold title on top of every generated PDF statement.'
                  : 'Dipaparkan sebagai tajuk utama di bahagian atas setiap penyata PDF yang dijana.'}
              </p>
            </div>

            {/* Field 2: SSM Registration Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1.5">
                  <span>{isEn ? 'Legal Entity / SSM Reg. Number' : 'No. Pendaftaran Syarikat (SSM)'}</span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ssmRegistrationNumber}
                  onChange={(e) => handleChange('ssmRegistrationNumber', e.target.value)}
                  placeholder="e.g. 202301048821 (1542109-M)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {isEn ? 'Statutory registration number registered with SSM Malaysia.' : 'No. pendaftaran SSM sah di Malaysia.'}
                </p>
              </div>

              {/* Field 5: Support Contact Info */}
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1.5">
                  <span>{isEn ? 'Official Support Contact & Email' : 'Maklumat Sokongan & E-mel'}</span>
                </label>
                <input
                  type="text"
                  value={formData.supportContact}
                  onChange={(e) => handleChange('supportContact', e.target.value)}
                  placeholder="e.g. Phone: +60 3-8912 8820 • Email: treasury-ops@d-mart.my"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {isEn ? 'Included in header metadata and footer certificate stamp.' : 'Disertakan dalam pengepala dan meterai sijil.'}
                </p>
              </div>
            </div>

            {/* Field 3: PDF Header Subtitle / Slogan */}
            <div>
              <label className="text-xs font-black text-gray-800 block mb-1.5">
                <span>{isEn ? 'PDF Header Subtitle / Slogan' : 'Sari Kata / Slogan Pengepala PDF'}</span>
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.headerSubtitle}
                onChange={(e) => handleChange('headerSubtitle', e.target.value)}
                placeholder="e.g. FLEET LOGISTICS & COURIER DISPATCH • OFFICIAL TREASURY CLEARING & STATEMENTS"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {isEn
                  ? 'Subheading printed right beneath the company name on the primary green banner.'
                  : 'Sari kata dicetak tepat di bawah nama syarikat pada sepanduk hijau utama.'}
              </p>
            </div>

            {/* Field 4: Official Address */}
            <div>
              <label className="text-xs font-black text-gray-800 block mb-1.5">
                <span>{isEn ? 'Registered Corporate Headquarters Address' : 'Alamat Pejabat Korporat Berdaftar'}</span>
              </label>
              <textarea
                rows={2}
                value={formData.officialAddress}
                onChange={(e) => handleChange('officialAddress', e.target.value)}
                placeholder="e.g. Level 8, Menara D-mart, Bangsar South, 59200 Kuala Lumpur, Malaysia"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
              />
            </div>

            {/* Section Divider */}
            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <h3 className="font-black text-sm text-gray-900">
                {isEn ? 'Footer Certificate & Legal Disclaimer' : 'Meterai Penafian & Pensijilan Pengaki'}
              </h3>
            </div>

            {/* Field 6: Footer Disclaimer */}
            <div>
              <label className="text-xs font-black text-gray-800 block mb-1.5">
                <span>{isEn ? 'Footer Disclaimer & Statutory Legal Text' : 'Teks Penafian Statutori & Akta Undang-undang'}</span>
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.footerDisclaimer}
                onChange={(e) => handleChange('footerDisclaimer', e.target.value)}
                placeholder="e.g. This official statement is generated directly from the D-mart Supermarket Retail & Fleet Operations Portal. Certified valid under the Malaysian Digital Signature Act 1997."
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {isEn
                  ? 'Guarantees compliance under the Malaysian Digital Signature Act 1997.'
                  : 'Menjamin pematuhan di bawah Akta Tandatangan Digital Malaysia 1997.'}
              </p>
            </div>

            {/* Field 7: Certificate & Audit Text */}
            <div>
              <label className="text-xs font-black text-gray-800 block mb-1.5">
                <span>{isEn ? 'Certificate Seal / Audit Header' : 'Meterai Pensijilan / Tajuk Audit'}</span>
              </label>
              <input
                type="text"
                value={formData.certificateText}
                onChange={(e) => handleChange('certificateText', e.target.value)}
                placeholder="e.g. OFFICIALLY AUDITED & CERTIFIED • D-MART RETAIL HOLDINGS SDN. BHD."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
              />
            </div>

            {/* Form Actions */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>{isEn ? 'Reset to Defaults' : 'Tetapkan Semula'}</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? (isEn ? 'Saving to Firestore...' : 'Menyimpan...') : (isEn ? 'Save Changes' : 'Simpan Perubahan')}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Real-Time Live Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-700" />
                <h3 className="font-black text-sm text-gray-900">
                  {isEn ? 'Real-Time PDF Header & Footer Preview' : 'Pratonton Sebenar Pengepala & Pengaki PDF'}
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Preview
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              {isEn
                ? 'Below is the exact visual representation of how your official PDF header, credentials, and legal footer stamp will render across all exported documents.'
                : 'Di bawah adalah paparan visual sebenar bagaimana pengepala PDF rasmi, butiran dan meterai undang-undang akan dipaparkan.'}
            </p>

            {/* Mock PDF Sheet Simulation */}
            <div className="border border-gray-300 rounded-2xl shadow-md overflow-hidden bg-white text-gray-900 select-none font-sans">
              {/* Header Box (Deep Emerald) */}
              <div className="bg-[#064e3b] text-white p-4 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-base sm:text-lg font-black tracking-wide leading-tight truncate">
                      {formData.companyName.toUpperCase() || 'D-MART SUPERMARKET & RETAIL LOGISTICS'}
                    </h4>
                    <p className="text-[10px] text-emerald-100 uppercase tracking-tight mt-0.5 leading-snug">
                      {formData.headerSubtitle || 'FLEET LOGISTICS & COURIER DISPATCH • OFFICIAL TREASURY CLEARING'}
                    </p>
                    <p className="text-[9px] text-emerald-300/90 font-mono mt-1">
                      SSM: {formData.ssmRegistrationNumber || '202301048821 (1542109-M)'} &bull; {formData.supportContact}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-200 text-[9px] font-mono border border-emerald-400/30">
                      OFFICIALLY AUDITED
                    </span>
                    <p className="text-[9px] text-emerald-300/80 font-mono mt-1">
                      {new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mock Content Body */}
              <div className="p-4 bg-gray-50/60 space-y-3 text-[11px]">
                {/* Rider Profile Card */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase">
                    <span>1. RIDER PROFILE CREDENTIALS</span>
                    <span className="text-emerald-700">STATUS: ACTIVE APPROVED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                      <span className="text-gray-400 text-[10px] block">Driver Full Name:</span>
                      <span className="font-black text-gray-800">Muhammad Haziq Bin Yusof</span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] block">Vehicle Plate:</span>
                      <span className="font-black text-emerald-800 font-mono">WXY 8912 (Motorcycle)</span>
                    </div>
                  </div>
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                    <span className="text-[8px] text-gray-400 block font-bold">FLOAT</span>
                    <span className="text-[11px] font-black text-emerald-800 font-mono">RM 245.50</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                    <span className="text-[8px] text-gray-400 block font-bold">COD HELD</span>
                    <span className="text-[11px] font-black text-amber-800 font-mono">RM 85.00</span>
                  </div>
                  <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                    <span className="text-[8px] text-gray-400 block font-bold">ONLINE</span>
                    <span className="text-[11px] font-black text-teal-800 font-mono">RM 320.00</span>
                  </div>
                  <div className="bg-emerald-900 text-white p-1.5 rounded-lg border border-emerald-800">
                    <span className="text-[8px] text-emerald-200 block font-bold">NET BAL</span>
                    <span className="text-[11px] font-black font-mono">RM 160.50</span>
                  </div>
                </div>

                {/* Sample Transaction Item */}
                <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center justify-between text-[10px]">
                  <div>
                    <span className="font-bold text-gray-800 block">Completed 6 grocery dropoffs</span>
                    <span className="text-gray-400 text-[9px] font-mono">Ref: DM-ORD-99120 &bull; 10:15 AM</span>
                  </div>
                  <span className="font-black text-emerald-700 font-mono">+RM 48.50</span>
                </div>
              </div>

              {/* Official Footer Box (Simulated Certificate Seal) */}
              <div className="bg-gray-100 p-3.5 border-t border-gray-300 space-y-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-[#064e3b] text-[10px] tracking-wide uppercase">
                    {formData.certificateText || 'OFFICIALLY AUDITED & CERTIFIED • D-MART RETAIL HOLDINGS SDN. BHD.'}
                  </h5>
                  <span className="text-[9px] font-mono text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded-xs">
                    VERIFIED-OK
                  </span>
                </div>
                <p className="text-gray-600 text-[9.5px] leading-snug">
                  {formData.footerDisclaimer || 'This official statement is generated directly from the D-mart Supermarket Retail & Fleet Operations Portal.'}
                </p>
                <div className="pt-1 border-t border-gray-200 text-[9px] text-gray-500 font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  <span>SSM: {formData.ssmRegistrationNumber}</span>
                  <span className="truncate max-w-[220px]">Address: {formData.officialAddress}</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/80 flex items-start gap-2 text-xs text-emerald-800">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {isEn
                  ? 'All PDF downloads from Admin, Rider Wallet, and Fleet Dispatch automatically apply these branding parameters without requiring a server reboot.'
                  : 'Semua muat turun PDF daripada Admin, Dompet Rider, dan Penghantaran Armada mengaplikasikan parameter penjenamaan ini secara langsung.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
