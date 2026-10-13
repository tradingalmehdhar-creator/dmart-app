import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Package,
  Bike,
  Home,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  Receipt,
  X,
  ShieldCheck,
  CreditCard,
  Banknote,
  Sparkles,
  Navigation,
  Compass,
  ExternalLink,
  Store,
  HeartHandshake,
  Copy,
  KeyRound,
  ShoppingBag,
  Truck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Order, Language, OrderReviewData } from '../types';
import { translations } from '../data/translations';
import { LiveDeliveryMapModal } from './LiveDeliveryMapModal';
import { OrderReview } from './OrderReview';
import { QRCodeShareBanner } from './QRCodeShareBanner';
import { OrderReceiptModal } from './OrderReceiptModal';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  language: Language;
  onUpdateOrder?: (updatedOrder: Order) => void;
  onOpenShareApp?: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  order,
  language,
  onUpdateOrder,
  onOpenShareApp,
}) => {
  const t = translations[language];

  // Initialize step based on order status or existing review
  const getInitialStep = () => {
    if (!order) return 1;
    if (order.status === 'delivered' || order.review) return 4;
    if (order.status === 'out_for_delivery') return 3;
    if (order.status === 'packing') return 2;
    return 1;
  };

  const [currentStep, setCurrentStep] = useState<number>(getInitialStep);
  const [isLiveMapOpen, setIsLiveMapOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);
  const [showItemsList, setShowItemsList] = useState<boolean>(false);

  const totalItemCount = order?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || order?.items?.length || 0;
  const uniqueProductCount = order?.items?.length || 0;

  // Sync step if order changes
  useEffect(() => {
    if (!isOpen || !order) return;
    if (order.status === 'delivered' || order.review) {
      setCurrentStep(4);
      return;
    }
    
    // Simulate real-time progress for customer satisfaction
    setCurrentStep(1);
    const timer1 = setTimeout(() => setCurrentStep(2), 3500);
    const timer2 = setTimeout(() => setCurrentStep(3), 8000);
    const timer3 = setTimeout(() => {
      setCurrentStep(4);
      if (onUpdateOrder && order.status !== 'delivered') {
        onUpdateOrder({ ...order, status: 'delivered' });
      }
    }, 14000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, order?.id, order?.status]);

  if (!isOpen) return null;

  if (!order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 p-6 sm:p-7 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
            <Package className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-1.5 tracking-tight">
            {language === 'en' ? 'No Active Orders' : 'Tiada Pesanan Aktif'}
          </h3>
          <p className="text-xs text-gray-600 mb-6 leading-relaxed">
            {language === 'en'
              ? 'You have not placed any orders yet. Add items to your cart and checkout to track real-time rider delivery here!'
              : 'Anda belum membuat sebarang pesanan. Tambah barangan ke troli dan daftar keluar untuk menjejaki status penghantaran rider di sini!'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95"
          >
            {language === 'en' ? 'Start Shopping' : 'Mula Beli-belah'}
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    {
      step: 1,
      title: language === 'en' ? 'Registration Submitted' : 'Pendaftaran Dihantar',
      desc: language === 'en' ? 'Received at D-mart Hub' : 'Diterima di Pusat D-mart',
      icon: CheckCircle2,
    },
    {
      step: 2,
      title: language === 'en' ? 'Picking & Packing' : 'Memilih & Membungkus',
      desc: language === 'en' ? 'Fresh items checked for quality' : 'Kualiti sayur & makanan diperiksa',
      icon: Package,
    },
    {
      step: 3,
      title: language === 'en' ? 'Rider On The Way' : 'Rider Dalam Perjalanan',
      desc: language === 'en' ? 'Heading to your pinned gate' : 'Menuju ke alamat anda',
      icon: Bike,
    },
    {
      step: 4,
      title: language === 'en' ? 'Delivered' : 'Selamat Diterima',
      desc: language === 'en' ? 'Doorstep delivery completed' : 'Sampai di pintu rumah',
      icon: Home,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Banner Alert: Delivery Registration Submitted! */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-green-600 text-white p-5 text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
            <CheckCircle2 className="w-8 h-8 text-white animate-bounce" />
          </div>
          <h3 className="text-xl font-black tracking-tight">
            {t.orderSubmittedTitle}
          </h3>
          <p className="text-xs text-emerald-100 mt-1 max-w-md mx-auto">
            {t.orderSubmittedDesc}
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider">
              <span>{t.orderNumber}:</span>
              <span className="text-amber-300">{order.orderNumber}</span>
            </div>

            {/* Small button for tracking delivery live map in page order */}
            <button
              id="order-page-top-live-map-btn"
              type="button"
              onClick={() => setIsLiveMapOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white hover:bg-amber-300 text-emerald-950 font-bold text-[11px] shadow-sm transition-all active:scale-95 border border-emerald-200 cursor-pointer"
              title={language === 'en' ? 'Open Live Delivery Map' : 'Buka Peta Penghantaran Langsung'}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
              </span>
              <Navigation className="w-3 h-3 text-emerald-700" />
              <span>{language === 'en' ? 'Live Map' : 'Peta Langsung'}</span>
            </button>

            {/* View Order Receipt button in top header bar */}
            <button
              id="order-page-top-receipt-btn"
              type="button"
              onClick={() => setIsReceiptOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold text-[11px] shadow-sm transition-all active:scale-95 border border-amber-300 cursor-pointer"
              title={language === 'en' ? 'View Order Receipt & Invoice' : 'Lihat Resit & Invois'}
            >
              <Receipt className="w-3 h-3 text-amber-950" />
              <span>{language === 'en' ? 'Receipt' : 'Resit'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Order Success QR Code Share Banner (Encourage customers to scan & invite friends) */}
          <QRCodeShareBanner
            language={language}
            variant="order-success"
            onOpenFullModal={onOpenShareApp}
          />

          {/* Secure Delivery OTP Verification Code Card */}
          <div
            id="order-delivery-otp-card"
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50/60 border-2 border-emerald-300 shadow-sm relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-amber-300 flex items-center justify-center shrink-0 shadow-md">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
                      <span>{language === 'en' ? 'Delivery Verification OTP' : 'Kod OTP Pengesahan Serahan'}</span>
                    </h4>
                    {order.status === 'delivered' || order.deliveryOtpVerified || currentStep === 4 ? (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'en' ? 'Verified & Completed' : 'Disahkan & Selesai'}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span>{language === 'en' ? 'Provide to Rider' : 'Berikan kepada Rider'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {language === 'en'
                      ? 'Please share this 4-digit code with your rider upon arrival to confirm safe delivery and release your groceries.'
                      : 'Sila berikan 4-digit kod ini kepada penghantar apabila tiba untuk mengesahkan penerimaan barangan anda.'}
                  </p>
                </div>
              </div>

              {/* OTP Code Box & Copy Action */}
              <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-inner">
                <div className="font-mono font-black text-2xl tracking-[0.25em] text-emerald-950 px-2 select-all">
                  {order.deliveryOtp || '4829'}
                </div>
                <button
                  type="button"
                  id="copy-delivery-otp-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(order.deliveryOtp || '4829');
                    setCopiedOtp(true);
                    setTimeout(() => setCopiedOtp(false), 2000);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  title={language === 'en' ? 'Copy Delivery OTP' : 'Salin Kod OTP'}
                >
                  {copiedOtp ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>{language === 'en' ? 'Copied' : 'Disalin'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white" />
                      <span>{language === 'en' ? 'Copy' : 'Salin'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Order Details Summary Card (Item Count, Delivery Fee, Total Price) */}
          <div
            id="order-details-summary-card"
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border-2 border-emerald-200/90 shadow-2xs space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Receipt className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-gray-900 leading-tight">
                    {language === 'en' ? 'Order Details Summary' : 'Ringkasan Butiran Pesanan'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {language === 'en'
                      ? `${totalItemCount} ${totalItemCount === 1 ? 'item' : 'items'} ordered from D-mart Supermarket`
                      : `${totalItemCount} barangan dipesan dari Pasaraya D-mart`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  #{order.orderNumber}
                </span>
              </div>
            </div>

            {/* 3 Metric Cards: Item Count, Delivery Fee, Total Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Metric 1: Item Count */}
              <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs flex sm:flex-col justify-between items-center sm:items-start gap-2">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                      {language === 'en' ? 'Total Items' : 'Jumlah Barangan'}
                    </span>
                    <span className="text-[10px] text-gray-400 block sm:hidden">
                      {uniqueProductCount} {language === 'en' ? 'products' : 'produk'}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-left">
                  <div className="flex items-baseline gap-1 justify-end sm:justify-start">
                    <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                      {totalItemCount}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {language === 'en' ? (totalItemCount === 1 ? 'item' : 'items') : 'unit'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 hidden sm:block mt-0.5">
                    {uniqueProductCount} {language === 'en' ? 'unique products' : 'jenis produk'}
                  </span>
                </div>
              </div>

              {/* Metric 2: Delivery Fee */}
              <div className="p-3 rounded-xl bg-white border border-emerald-100 shadow-2xs flex sm:flex-col justify-between items-center sm:items-start gap-2">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                      {language === 'en' ? 'Delivery Fee' : 'Caj Penghantaran'}
                    </span>
                    <span className="text-[10px] text-emerald-700 block sm:hidden font-semibold">
                      {order.deliveryFee === 0
                        ? (language === 'en' ? 'FREE' : 'Percuma')
                        : 'Express Runner'}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-left">
                  <div className="flex items-baseline gap-1 justify-end sm:justify-start">
                    {order.deliveryFee === 0 ? (
                      <span className="text-lg sm:text-xl font-black text-emerald-700 leading-tight">
                        {t.freeDelivery || (language === 'en' ? 'FREE' : 'Percuma')}
                      </span>
                    ) : (
                      <span className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                        RM {order.deliveryFee.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-700 hidden sm:block mt-0.5 font-medium">
                    {order.deliveryFee === 0
                      ? (language === 'en' ? 'Waived (Free Delivery Promo)' : 'Dikecualikan (Promosi)')
                      : (language === 'en' ? 'Doorstep Express Dispatch' : 'Hantaran Pintu Rumah')}
                  </span>
                </div>
              </div>

              {/* Metric 3: Total Price */}
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-2xs flex sm:flex-col justify-between items-center sm:items-start gap-2">
                <div className="flex items-center gap-1.5 text-emerald-100">
                  <div className="w-7 h-7 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
                    <Receipt className="w-4 h-4 text-amber-200" />
                  </div>
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">
                      {language === 'en' ? 'Total Price' : 'Jumlah Bayaran'}
                    </span>
                    <span className="text-[10px] text-emerald-200 block sm:hidden">
                      {order.paymentMethod === 'COD' ? 'COD' : 'Paid'}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-left">
                  <div className="flex items-baseline gap-1 justify-end sm:justify-start">
                    <span className="text-xl sm:text-2xl font-black text-white leading-tight">
                      RM {order.total.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-100 hidden sm:block mt-0.5 font-medium">
                    {order.paymentMethod === 'COD'
                      ? (language === 'en' ? '💵 Cash on Delivery (COD)' : '💵 Tunai Semasa Terima')
                      : (language === 'en' ? '✓ Paid & Confirmed' : '✓ Dibayar & Disahkan')}
                  </span>
                </div>
              </div>
            </div>

            {/* Expandable Ordered Items Itemization */}
            {order.items && order.items.length > 0 && (
              <div className="pt-2 border-t border-emerald-200/70">
                <button
                  type="button"
                  onClick={() => setShowItemsList((prev) => !prev)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white/90 hover:bg-white text-emerald-950 font-bold text-xs transition-colors border border-emerald-200 shadow-2xs cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-700" />
                    <span>
                      {showItemsList
                        ? (language === 'en' ? 'Hide Ordered Items Breakdown' : 'Sembunyikan Senarai Barangan')
                        : (language === 'en' ? `View Ordered Items Breakdown (${totalItemCount} items • ${uniqueProductCount} products)` : `Lihat Senarai Barangan (${totalItemCount} unit • ${uniqueProductCount} produk)`)}
                    </span>
                  </span>
                  {showItemsList ? (
                    <ChevronUp className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-emerald-700 shrink-0" />
                  )}
                </button>

                {showItemsList && (
                  <div className="mt-2.5 space-y-2 max-h-60 overflow-y-auto pr-1 animate-in fade-in duration-150">
                    {order.items.map((item, idx) => (
                      <div
                        key={item.product?.id || `item-${idx}`}
                        className="p-2 sm:p-2.5 rounded-xl bg-white border border-gray-100 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-400">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-gray-900 truncate">
                              {item.product?.name || (language === 'en' ? 'Grocery Item' : 'Barangan Runcit')}
                            </h5>
                            <p className="text-[11px] text-gray-500">
                              RM {item.product?.price?.toFixed(2) || '0.00'} / {item.product?.unit || 'unit'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            x{item.quantity}
                          </span>
                          <span className="block text-xs font-black text-gray-900 mt-0.5">
                            RM {((item.product?.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline Status */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                {language === 'en' ? 'Live Fulfillment Status' : 'Status Penghantaran Semasa'}
              </span>
              <div className="flex items-center gap-2">
                {/* Small button for tracking delivery live map */}
                <button
                  id="order-page-timeline-live-map-btn"
                  type="button"
                  onClick={() => setIsLiveMapOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs transition-all active:scale-95 cursor-pointer"
                  title={language === 'en' ? 'Track Delivery on Live Map' : 'Jejak Penghantaran di Peta Langsung'}
                >
                  <Navigation className="w-2.5 h-2.5 text-white" />
                  <span>{language === 'en' ? 'Live Map' : 'Peta Langsung'}</span>
                </button>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ⏱ {order.estimatedDeliveryTime}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative">
              {steps.map((s) => {
                const Icon = s.icon;
                const isPassed = currentStep >= s.step;
                const isCurrent = currentStep === s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      setCurrentStep(s.step);
                      if (s.step === 4 && onUpdateOrder && order.status !== 'delivered') {
                        onUpdateOrder({ ...order, status: 'delivered' });
                      }
                    }}
                    title={`Click to preview step ${s.step}: ${s.title}`}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                        : isPassed
                        ? 'bg-emerald-100/90 text-emerald-900 border-emerald-300 hover:bg-emerald-200/80'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                        isCurrent
                          ? 'bg-white text-emerald-700'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold leading-tight line-clamp-1">{s.title}</span>
                    <span
                      className={`text-[10px] mt-0.5 leading-tight ${
                        isCurrent ? 'text-emerald-100' : 'text-gray-500'
                      }`}
                    >
                      {s.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick action bar to mark as delivered immediately for testing review */}
            {currentStep < 4 && (
              <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px]">
                <span className="text-emerald-800">
                  {language === 'en'
                    ? 'Simulating express delivery in real-time...'
                    : 'Mensimulasikan penghantaran ekspres secara langsung...'}
                </span>
                <button
                  id="simulate-mark-delivered-btn"
                  type="button"
                  onClick={() => {
                    setCurrentStep(4);
                    if (onUpdateOrder) {
                      onUpdateOrder({ ...order, status: 'delivered' });
                    }
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  {language === 'en' ? 'Fast-forward to Delivered →' : 'Lompat ke Selamat Diterima →'}
                </button>
              </div>
            )}
          </div>

          {/* Customer Review Section (Activated once order is marked as Delivered) */}
          {currentStep === 4 && (
            <div id="order-review-section" className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <OrderReview
                orderNumber={order.orderNumber}
                language={language}
                existingReview={order.review}
                onSubmitReview={(reviewData) => {
                  if (onUpdateOrder) {
                    const existingFeedback = order.customerFeedback || [];
                    const newFeedback = {
                      id: `cf-${Date.now()}`,
                      rating: reviewData.rating,
                      comment: reviewData.comment,
                      createdAt: reviewData.submittedAt,
                    };
                    onUpdateOrder({
                      ...order,
                      status: 'delivered',
                      review: reviewData,
                      customerFeedback: [...existingFeedback, newFeedback],
                    });
                  }
                }}
              />
            </div>
          )}

          {/* Interactive Live Map Tracking Preview Card right in Page Order */}
          <div className="rounded-2xl border-2 border-emerald-500/30 bg-white overflow-hidden shadow-sm">
            <div className="bg-emerald-900 text-white px-3.5 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-xs font-black tracking-wide">
                  {language === 'en' ? 'Live Delivery Map' : 'Peta Penghantaran Langsung'}
                </span>
                <span className="hidden sm:inline-block text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.2 rounded font-mono">
                  GPS Active
                </span>
              </div>

              {/* Small button to expand live map */}
              <button
                id="order-page-expand-live-map-small-btn"
                type="button"
                onClick={() => setIsLiveMapOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
                title={language === 'en' ? 'Full Live Map View' : 'Paparan Peta Penuh'}
              >
                <Navigation className="w-3 h-3" />
                <span>{language === 'en' ? 'Open Live Map' : 'Buka Peta'}</span>
              </button>
            </div>

            {/* Clickable mini map preview banner */}
            <div
              onClick={() => setIsLiveMapOpen(true)}
              className="relative h-28 sm:h-32 bg-[#e8ece9] overflow-hidden cursor-pointer group"
              title={language === 'en' ? 'Click to open full live delivery map' : 'Klik untuk buka peta langsung penuh'}
              style={{
                backgroundImage: `
                  linear-gradient(to right, #cfd8dc 1px, transparent 1px),
                  linear-gradient(to bottom, #cfd8dc 1px, transparent 1px)
                `,
                backgroundSize: '28px 28px'
              }}
            >
              {/* Simulated Road Lines */}
              <div className="absolute top-1/2 left-0 right-0 h-4 bg-white/90 border-y border-gray-300 transform -rotate-6" />
              <div className="absolute top-0 bottom-0 left-1/3 w-3 bg-white/90 border-x border-gray-300 transform rotate-12" />

              {/* Origin Point Hub */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10 bg-white/90 px-2 py-1 rounded-lg shadow-xs border border-emerald-300">
                <Store className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-[10px] font-bold text-emerald-900">D-mart Hub</span>
              </div>

              {/* Destination Point Customer */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10 bg-white/90 px-2 py-1 rounded-lg shadow-xs border border-rose-300">
                <MapPin className="w-3.5 h-3.5 text-rose-600 fill-rose-100" />
                <span className="text-[10px] font-bold text-gray-900 truncate max-w-[90px]">
                  {order.deliveryAddress.recipientName || 'You'}
                </span>
              </div>

              {/* Moving Rider Motorbike in Center */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group-hover:scale-105 transition-transform">
                <div className="bg-emerald-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap mb-0.5 flex items-center gap-1 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Azman (Yamaha NVX) • 1.2 km away</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-400">
                  <Bike className="w-4 h-4 animate-pulse" />
                </div>
              </div>

              {/* Tap to expand overlay */}
              <div className="absolute bottom-1.5 right-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <ExternalLink className="w-2.5 h-2.5 text-emerald-300" />
                <span>{language === 'en' ? 'Tap to view live tracking' : 'Ketik untuk peta langsung'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Rider & Runner Card */}
          <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-800 text-sm shrink-0">
                🛵 Azman
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  {t.riderAssigned}
                </span>
                <p className="font-bold text-gray-900 text-sm truncate">Azman bin Razak (Yamaha NVX)</p>
                <p className="text-xs text-gray-500">⭐ 4.9 (1,240+ completed deliveries)</p>
              </div>
            </div>

            {/* Action Buttons in Rider Card: Live Status + Call + WhatsApp + View Order */}
            <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
              {/* Live Status / Map Button */}
              <button
                id="order-page-rider-card-live-map-btn"
                type="button"
                onClick={() => setIsLiveMapOpen(true)}
                className="px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title={language === 'en' ? 'Track Rider Live Status & GPS' : 'Jejak Status Rider & GPS'}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Live Status' : 'Status Langsung'}</span>
              </button>

              {/* Call Rider Button */}
              <a
                href="tel:0123456789"
                id="order-page-rider-card-call-btn"
                className="px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title={language === 'en' ? 'Call Rider' : 'Hubungi Rider'}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{language === 'en' ? 'Call' : 'Telefon'}</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/60123456789"
                id="order-page-rider-card-whatsapp-btn"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 sm:py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform cursor-pointer"
                title="WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {/* View Order Button */}
              <button
                id="order-page-rider-card-receipt-btn"
                type="button"
                onClick={() => setIsReceiptOpen(true)}
                className="px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title={language === 'en' ? 'View Order Details & Receipt' : 'Lihat Butiran & Resit Pesanan'}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'View Order' : 'Lihat Pesanan'}</span>
              </button>
            </div>
          </div>

          {/* Delivery & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Delivery address details */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 font-bold text-gray-800 text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'en' ? 'Registered Delivery Destination' : 'Destinasi Penghantaran'}</span>
                </div>
                {/* Small live map link */}
                <button
                  type="button"
                  onClick={() => setIsLiveMapOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                  title={language === 'en' ? 'View on map' : 'Lihat pada peta'}
                >
                  <Navigation className="w-3 h-3 text-emerald-600" />
                  <span>{language === 'en' ? 'Live Map' : 'Peta'}</span>
                </button>
              </div>
              <p className="font-bold text-gray-900 text-sm">
                {order.deliveryAddress.recipientName}
              </p>
              <p className="text-gray-700 leading-relaxed">
                {order.deliveryAddress.formattedAddress}
              </p>
              <p className="text-gray-500">
                📞 {order.deliveryAddress.phone}
              </p>
              {order.deliveryAddress.notes && (
                <p className="text-emerald-800 font-medium">
                  📝 {order.deliveryAddress.notes}
                </p>
              )}
              <div className="pt-2">
                <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  🕒 {language === 'en' ? order.deliverySlot : order.deliverySlotMs}
                </span>
              </div>
            </div>

            {/* Payment method registered */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-800 text-xs mb-1">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>{language === 'en' ? 'Payment Information' : 'Maklumat Bayaran'}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">
                    {order.paymentMethod === 'COD' && `💵 ${t.cod}`}
                    {order.paymentMethod === 'FPX' && `🏦 ${t.fpx} (${order.paymentDetails?.bankName || 'Maybank2u'})`}
                    {order.paymentMethod === 'TNG' && `📱 ${t.tng}`}
                  </span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {order.paymentMethod === 'COD'
                      ? (language === 'en' ? 'Pay upon arrival' : 'Bayar waktu sampai')
                      : (language === 'en' ? 'Confirmed' : 'Disahkan')}
                  </span>
                </div>
                {order.paymentMethod === 'TNG' && order.paymentDetails?.tngRef && (
                  <p className="text-[10px] text-gray-500 font-mono mt-1">
                    Ref: {order.paymentDetails.tngRef}
                  </p>
                )}
              </div>

              {/* Items summary */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-gray-600">
                  <span>
                    {t.subtotal} ({totalItemCount} {language === 'en' ? (totalItemCount === 1 ? 'item' : 'items') : 'unit'})
                  </span>
                  <span>RM {order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>{t.discount}</span>
                    <span>-RM {order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>{t.deliveryFee}</span>
                  <span>{order.deliveryFee === 0 ? t.freeDelivery : `RM ${order.deliveryFee.toFixed(2)}`}</span>
                </div>
                {order.tip && order.tip > 0 && (
                  <div className="flex justify-between text-amber-800 font-semibold bg-amber-100/60 -mx-1 px-1.5 py-0.5 rounded">
                    <span className="flex items-center gap-1">
                      <HeartHandshake className="w-3 h-3 text-amber-600" />
                      <span>{t.driverGratuity}</span>
                    </span>
                    <span>+RM {order.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-1 border-t border-gray-300 flex justify-between font-bold text-sm text-gray-900">
                  <span>{t.total}</span>
                  <span className="text-emerald-700 font-black">RM {order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            {language === 'en' ? 'Done / Back to Supermarket' : 'Selesai / Kembali ke Pasaraya'}
          </button>
        </div>
      </div>

      {/* Interactive Live Delivery Tracking Map Modal */}
      <LiveDeliveryMapModal
        isOpen={isLiveMapOpen}
        onClose={() => setIsLiveMapOpen(false)}
        order={order}
        language={language}
      />

      {/* Order Details / Tax Invoice Receipt Modal */}
      <OrderReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={order}
        language={language}
      />
    </div>
  );
};
