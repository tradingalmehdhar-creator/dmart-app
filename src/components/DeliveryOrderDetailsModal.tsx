import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Clock,
  Package,
  Bike,
  Car,
  ShieldCheck,
  AlertCircle,
  Banknote,
  Store,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Lock,
  KeyRound
} from 'lucide-react';
import { DeliveryJobOrder, Language } from '../types';
import { LiveDeliveryMapModal } from './LiveDeliveryMapModal';

interface DeliveryOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: DeliveryJobOrder | null;
  language: Language;
  onUpdateOrderStatus: (orderId: string, newStatus: DeliveryJobOrder['status']) => void;
  onBackToList: () => void;
}

export const DeliveryOrderDetailsModal: React.FC<DeliveryOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  language,
  onUpdateOrderStatus,
  onBackToList,
}) => {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [isCompletedSuccess, setIsCompletedSuccess] = useState(order?.status === 'delivered');
  const [isLiveMapOpen, setIsLiveMapOpen] = useState<boolean>(false);

  // Delivery OTP Verification States
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpVerified, setIsOtpVerified] = useState<boolean>(
    order?.status === 'delivered' || !!order?.deliveryOtpVerified
  );
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Sync state whenever the order or its deliveryOtp status changes
  useEffect(() => {
    if (!order) return;
    setIsCompletedSuccess(order.status === 'delivered');
    setIsOtpVerified(order.status === 'delivered' || !!order.deliveryOtpVerified);
    setEnteredOtp('');
    setOtpError(null);
  }, [order?.id, order?.status, order?.deliveryOtpVerified]);

  if (!isOpen || !order) return null;

  const isEn = language === 'en';

  const toggleItemCheck = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleVerifyOtp = (codeToCheck?: string) => {
    const rawCode = codeToCheck !== undefined ? codeToCheck : enteredOtp;
    const code = rawCode.trim();
    setOtpError(null);

    if (!code) {
      setOtpError(
        isEn
          ? 'Please enter the 4-digit Delivery OTP from the customer.'
          : 'Sila masukkan kod OTP 4-digit daripada pelanggan.'
      );
      return;
    }

    const expectedOtp = (order.deliveryOtp || '4829').trim();
    setIsValidating(true);

    setTimeout(() => {
      setIsValidating(false);
      if (code === expectedOtp) {
        setIsOtpVerified(true);
        setOtpError(null);
        // Instant Validation & Order Completion
        onUpdateOrderStatus(order.id, 'delivered');
        setIsCompletedSuccess(true);
      } else {
        setOtpError(
          isEn
            ? 'Invalid OTP Code. Please verify with the customer and try again.'
            : 'Kod OTP Tidak Sah. Sila semak semula dengan pelanggan dan cuba lagi.'
        );
      }
    }, 350);
  };

  const handleProgress = () => {
    if (order.status === 'available' || order.status === 'accepted') {
      onUpdateOrderStatus(order.id, 'picked_up');
    } else if (order.status === 'picked_up') {
      onUpdateOrderStatus(order.id, 'out_for_delivery');
    } else if (order.status === 'out_for_delivery') {
      // Disallow completion if OTP is not verified
      if (!isOtpVerified) {
        setOtpError(
          isEn
            ? 'Action Blocked: You must enter and verify the customer Delivery OTP before marking as delivered.'
            : 'Tindakan Disekat: Anda mesti memasukkan dan mengesahkan Kod OTP Pelanggan sebelum menamatkan penghantaran.'
        );
        return;
      }
      onUpdateOrderStatus(order.id, 'delivered');
      setIsCompletedSuccess(true);
    }
  };

  const openGoogleMaps = () => {
    const query = encodeURIComponent(`${order.deliveryAddress}, ${order.city}, ${order.postcode}, Malaysia`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Bar */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToList}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1 text-xs font-bold"
              title={isEn ? 'Back to Orders List' : 'Kembali ke Senarai Pesanan'}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isEn ? 'Orders List' : 'Senarai Pesanan'}</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  #{order.orderNumber}
                </span>
                <button
                  id="rider-order-header-live-map-small-btn"
                  type="button"
                  onClick={() => setIsLiveMapOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/80 hover:bg-emerald-400 text-white font-black text-[10px] tracking-wide cursor-pointer transition-colors shadow-xs"
                  title={isEn ? 'Live GPS Tracking Map' : 'Peta Jejak GPS Langsung'}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-200 animate-ping" />
                  <Navigation className="w-3 h-3 text-amber-300" />
                  <span>{isEn ? 'Live Map' : 'Peta Langsung'}</span>
                </button>
                <span className="text-emerald-200 text-xs font-mono">
                  {order.urgency === 'express' ? (isEn ? '⚡ Express 45-Min' : '⚡ Hantaran Ekspres') : 'Standard 2-Hour'}
                </span>
              </div>
              <h3 className="font-black text-lg sm:text-xl leading-tight">
                {isEn ? 'Order Delivery Details' : 'Butiran Penghantaran Pesanan'}
              </h3>
            </div>
          </div>

          {/* Earnings Badge */}
          <div className="text-right bg-white/15 px-3 py-1.5 rounded-2xl backdrop-blur-xs border border-white/20">
            <div className="text-[10px] text-emerald-200 font-semibold uppercase">{isEn ? 'Your Payout' : 'Gaji Anda'}</div>
            <div className="text-base sm:text-lg font-black font-mono text-amber-300">
              +RM {order.earningsPayout.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Completion celebratory state */}
          {isCompletedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/80 flex items-center gap-3.5 animate-in zoom-in-95 duration-200">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-emerald-950 text-sm">
                  {isEn ? 'Order Successfully Delivered!' : 'Pesanan Berjaya Dihantar!'}
                </h4>
                <p className="text-xs text-emerald-800">
                  {isEn
                    ? `Great job! +RM ${order.earningsPayout.toFixed(2)} has been credited to your D-mart runner wallet.`
                    : `Hebat! +RM ${order.earningsPayout.toFixed(2)} telah dikreditkan ke dompet penghantar D-mart anda.`}
                </p>
              </div>
            </div>
          )}

          {/* Delivery Runner Progress Stepper */}
          <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 border border-gray-200/80">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-3">
              {isEn ? 'Delivery Status Checklist' : 'Status Penghantaran Semasa'}
            </h4>
            
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {/* Step 1: Accepted / Pickup */}
              <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                order.status === 'accepted' || order.status === 'picked_up' || order.status === 'out_for_delivery' || order.status === 'delivered'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px]">{isEn ? '1. Accepted' : '1. Diterima'}</span>
              </div>

              {/* Step 2: Picked Up */}
              <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                order.status === 'picked_up' || order.status === 'out_for_delivery' || order.status === 'delivered'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}>
                <Store className={`w-4 h-4 ${order.status === 'picked_up' ? 'text-amber-600 animate-bounce' : 'text-emerald-600'}`} />
                <span className="text-[11px]">{isEn ? '2. Picked Up' : '2. Diambil di Hab'}</span>
              </div>

              {/* Step 3: Out for Delivery / Completed */}
              <div className={`p-2 rounded-xl border flex flex-col items-center gap-1 ${
                order.status === 'out_for_delivery' || order.status === 'delivered'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}>
                <Bike className={`w-4 h-4 ${order.status === 'out_for_delivery' ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`} />
                <span className="text-[11px]">{isEn ? '3. Delivered' : '3. Selesai Hantar'}</span>
              </div>
            </div>
          </div>

          {/* Supermarket Pickup Hub Info */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Supermarket Pickup Point' : 'Pusat Pengambilan Pasar Raya'}</span>
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {isEn ? 'Ready for Pickup' : 'Sedia Diambil'}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">{order.pickupHub}</h4>
              <p className="text-xs text-gray-500">{order.pickupAddress}</p>
            </div>
          </div>

          {/* Customer Destination & Contact Details */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>{isEn ? 'Customer Delivery Drop-off' : 'Alamat Hantaran Pelanggan'}</span>
              </span>
              <span className="text-xs font-bold text-gray-900 font-mono">
                {order.distanceKm} km • ~{order.estimatedTimeMin} mins
              </span>
            </div>

            {/* Customer Info Card */}
            <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between gap-3">
              <div>
                <h5 className="font-bold text-sm text-gray-900">{order.customerName}</h5>
                <p className="text-xs font-mono text-gray-600">{order.customerPhone}</p>
              </div>

              {/* Quick Communication Buttons */}
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Call' : 'Telefon'}</span>
                </a>

                <a
                  href={`https://wa.me/6${order.customerPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-transform active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Full Address */}
            <div className="text-xs space-y-1">
              <div className="font-bold text-gray-900">
                {order.buildingUnit ? `${order.buildingUnit}, ` : ''}{order.deliveryAddress}
              </div>
              <div className="text-gray-500">{order.postcode} {order.city}, Malaysia</div>
              {order.dropoffNotes && (
                <div className="p-2.5 bg-amber-50 rounded-lg text-amber-900 border border-amber-200 mt-2">
                  <span className="font-bold">{isEn ? 'Customer Instructions: ' : 'Arahan Pelanggan: '}</span>
                  <span>{order.dropoffNotes}</span>
                </div>
              )}
            </div>

            {/* Map & GPS Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                id="rider-order-action-live-map-small-btn"
                type="button"
                onClick={() => setIsLiveMapOpen(true)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title={isEn ? 'Live Delivery Map Tracking' : 'Peta Jejak Penghantaran Langsung'}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{isEn ? 'Live Delivery Map' : 'Peta Penghantaran Langsung'}</span>
              </button>

              <button
                type="button"
                onClick={openGoogleMaps}
                className="py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                <span>Google Maps</span>
              </button>
            </div>
          </div>

          {/* Payment & Cash Collection Notice */}
          <div className="rounded-2xl p-4 border flex items-start gap-3.5 bg-white">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              order.paymentMethod === 'cod' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <Banknote className="w-5 h-5" />
            </div>

            <div className="flex-1 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-gray-900">
                  {order.paymentMethod === 'cod'
                    ? (isEn ? 'Cash on Delivery (COD)' : 'Bayaran Tunai Waktu Terima (COD)')
                    : (isEn ? 'Prepaid Online Order' : 'Pesanan Dibayar Atas Talian')}
                </span>
                <span className="font-bold font-mono text-xs">
                  {order.paymentMethod === 'cod' ? (
                    <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-black">
                      Collect RM {order.codAmountToCollect?.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {isEn ? 'Paid via FPX / TnG' : 'Telah Dibayar'}
                    </span>
                  )}
                </span>
              </div>
              <p className="text-gray-500">
                {order.paymentMethod === 'cod'
                  ? (isEn
                      ? 'Please collect exact cash from customer before handing over the grocery bags.'
                      : 'Sila kutip wang tunai secukupnya daripada pelanggan sebelum menyerahkan beg barangan runcit.')
                  : (isEn
                      ? 'Customer has already paid online. Do NOT ask or collect cash.'
                      : 'Pelanggan telah membayar secara dalam talian. Jangan minta bayaran tunai.')}
              </p>
            </div>
          </div>

          {/* Rider Delivery OTP Verification Gate */}
          <div
            id="rider-otp-verification-gate"
            className={`rounded-2xl p-4 sm:p-5 border-2 transition-all ${
              isOtpVerified || order.status === 'delivered'
                ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
                : order.status === 'out_for_delivery'
                ? 'bg-gradient-to-r from-amber-50 via-orange-50/50 to-emerald-50/40 border-amber-400 shadow-md ring-2 ring-amber-400/20'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isOtpVerified || order.status === 'delivered'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-emerald-950'
                  }`}
                >
                  {isOtpVerified || order.status === 'delivered' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-sm text-gray-900 flex items-center gap-1.5 flex-wrap">
                    <span>{isEn ? 'Delivery OTP Verification Gate' : 'Pengesahan Kod OTP Penghantaran'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                      {isEn ? 'Required to Deliver' : 'Wajib Untuk Selesai'}
                    </span>
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {isEn
                      ? 'Upon doorstep arrival, ask customer for their 4-digit OTP shown in their app.'
                      : 'Semasa tiba di hadapan pintu, minta 4-digit kod OTP yang tertera di aplikasi pelanggan.'}
                  </p>
                </div>
              </div>

              {isOtpVerified || order.status === 'delivered' ? (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isEn ? 'OTP Verified' : 'OTP Disahkan'}</span>
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-300 flex items-center gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>{isEn ? 'Gate Active' : 'Pintu Aktif'}</span>
                </span>
              )}
            </div>

            {/* If already verified */}
            {isOtpVerified || order.status === 'delivered' ? (
              <div className="bg-white/80 rounded-xl p-3 border border-emerald-300 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {isEn
                      ? 'Customer identity authenticated. Handover confirmed & delivery marked complete.'
                      : 'Identiti pelanggan disahkan. Penyerahan barangan berjaya disahkan.'}
                  </span>
                </div>
                <span className="font-mono font-black text-emerald-800 text-xs bg-emerald-100 px-2.5 py-1 rounded-lg shrink-0">
                  OTP: ••••
                </span>
              </div>
            ) : (
              /* OTP Input Gate */
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      id="rider-delivery-otp-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setEnteredOtp(val);
                        if (otpError) setOtpError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerifyOtp();
                        }
                      }}
                      placeholder={isEn ? 'Enter 4-digit Customer OTP' : 'Masukkan 4-digit Kod OTP'}
                      className={`w-full py-2.5 px-3.5 rounded-xl border text-center font-mono font-black text-lg tracking-[0.25em] bg-white transition-all shadow-inner focus:outline-hidden ${
                        otpError
                          ? 'border-red-500 ring-2 ring-red-500/20 text-red-900'
                          : 'border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-gray-900'
                      }`}
                    />
                  </div>

                  <button
                    id="rider-verify-otp-btn"
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={isValidating || !enteredOtp.trim()}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:active:scale-100 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    {isValidating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{isEn ? 'Verifying...' : 'Mengesahkan...'}</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Verify & Complete' : 'Sahkan & Selesai'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Error Message */}
                {otpError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-300 flex items-center gap-2 text-xs font-bold text-red-800 animate-in shake duration-200">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{otpError}</span>
                  </div>
                )}

                {/* Development & Demo Testing Helper */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                  <span>
                    {isEn ? 'Demo Helper (Customer OTP):' : 'Bantuan Demo (OTP Pelanggan):'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const code = order.deliveryOtp || '4829';
                      setEnteredOtp(code);
                      handleVerifyOtp(code);
                    }}
                    className="font-mono font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                    title="Click to automatically fill and verify demo OTP"
                  >
                    {order.deliveryOtp || '4829'} ⚡ {isEn ? 'Auto-fill & Verify' : 'Auto-isi & Sahkan'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Grocery Package Items Checklist */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isEn ? 'Grocery Items to Deliver' : 'Barangan Runcit Untuk Dihantar'}</span>
              </span>
              <span className="text-xs text-gray-500 font-medium">
                {order.itemsList.length} {isEn ? 'items package' : 'jenis barangan'}
              </span>
            </div>

            <div className="space-y-2">
              {order.itemsList.map((item, idx) => {
                const isChecked = checkedItems[idx] || false;
                return (
                  <div
                    key={idx}
                    onClick={() => toggleItemCheck(idx)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                      isChecked ? 'bg-emerald-50/70 border-emerald-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300'
                      }`}>
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold truncate ${isChecked ? 'text-emerald-950 line-through' : 'text-gray-900'}`}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {item.quantity} × {item.unit}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-gray-700 shrink-0">
                      RM {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onBackToList}
            className="py-3 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition-colors"
          >
            {isEn ? '← Back to Orders' : '← Kembali ke Senarai'}
          </button>

          {order.status === 'accepted' && (
            <button
              type="button"
              onClick={handleProgress}
              className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>{isEn ? 'Mark Picked Up from Supermarket Hub' : 'Tanda Sudah Diambil di Hab'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {order.status === 'picked_up' && (
            <button
              type="button"
              onClick={handleProgress}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Bike className="w-4 h-4" />
              <span>{isEn ? 'Start Delivery to Customer (On The Way)' : 'Mula Menghantar ke Pelanggan'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {order.status === 'out_for_delivery' && (
            !isOtpVerified ? (
              <button
                type="button"
                onClick={() => {
                  setOtpError(
                    isEn
                      ? 'Please enter and verify the customer Delivery OTP above before completing this order.'
                      : 'Sila masukkan dan sahkan Kod OTP Pelanggan di atas sebelum menamatkan pesanan ini.'
                  );
                  const inputEl = document.getElementById('rider-delivery-otp-input');
                  inputEl?.focus();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-200 hover:bg-gray-300/80 border border-gray-300 text-gray-500 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                title={isEn ? 'OTP verification required to complete delivery' : 'Pengesahan OTP diperlukan untuk selesai'}
              >
                <Lock className="w-4 h-4 text-amber-600" />
                <span>{isEn ? 'Enter Delivery OTP to Complete' : 'Masukkan Kod OTP untuk Selesai'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleProgress}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEn ? 'Confirm Delivered & Complete (+RM ' + order.earningsPayout.toFixed(2) + ')' : 'Sahkan Selesai Hantar'}</span>
              </button>
            )
          )}

          {order.status === 'delivered' && (
            <button
              type="button"
              onClick={onBackToList}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEn ? 'Completed • Take Next Order' : 'Selesai • Ambil Pesanan Seterusnya'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Live Delivery Tracking Map Modal */}
      <LiveDeliveryMapModal
        isOpen={isLiveMapOpen}
        onClose={() => setIsLiveMapOpen(false)}
        order={{
          orderNumber: order.orderNumber,
          deliveryAddress: {
            recipientName: order.customerName,
            street: order.deliveryAddress,
            city: order.city,
            formattedAddress: `${order.buildingUnit ? order.buildingUnit + ', ' : ''}${order.deliveryAddress}, ${order.postcode} ${order.city}`
          }
        }}
        language={language}
      />
    </div>
  );
};
