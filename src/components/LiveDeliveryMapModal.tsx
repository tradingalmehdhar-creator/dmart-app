import React, { useState, useEffect } from 'react';
import {
  X,
  Navigation,
  MapPin,
  Bike,
  Phone,
  MessageSquare,
  Compass,
  ExternalLink,
  Store,
  Clock,
  ShieldCheck,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Receipt,
} from 'lucide-react';
import { Order, Language } from '../types';
import { OrderReceiptModal } from './OrderReceiptModal';

interface LiveDeliveryMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  language: Language;
}

export const LiveDeliveryMapModal: React.FC<LiveDeliveryMapModalProps> = ({
  isOpen,
  onClose,
  order,
  language,
}) => {
  const isEn = language === 'en';

  // Rider animated progress between Hub (0%) and Customer (100%)
  const [progress, setProgress] = useState<number>(45);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'normal' | 'satellite'>('normal');
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Realistic simulation of rider movement
  useEffect(() => {
    if (!isOpen || !isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return 96; // Stay close to destination
        return Number((prev + 0.8).toFixed(1));
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  // Waypoint calculation along a curved delivery trajectory
  // Start: Hub (18%, 78%), End: Customer (76%, 24%)
  const startX = 20;
  const startY = 75;
  const endX = 78;
  const endY = 22;

  // Mid control arc for bezier
  const tNorm = progress / 100;
  // Curve: (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
  const ctrlX = 42;
  const ctrlY = 28;

  const currentX = Math.round(
    Math.pow(1 - tNorm, 2) * startX +
    2 * (1 - tNorm) * tNorm * ctrlX +
    Math.pow(tNorm, 2) * endX
  );
  const currentY = Math.round(
    Math.pow(1 - tNorm, 2) * startY +
    2 * (1 - tNorm) * tNorm * ctrlY +
    Math.pow(tNorm, 2) * endY
  );

  const remainingDistKm = Math.max(0.2, Number(((100 - progress) * 0.032).toFixed(1)));
  const etaMinutes = Math.max(2, Math.round((100 - progress) * 0.25));

  const openGoogleMaps = () => {
    const dest = encodeURIComponent(order.deliveryAddress.formattedAddress || `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  };

  const recipientName = order.deliveryAddress.recipientName || 'Customer';
  const recipientStreet = order.deliveryAddress.street || 'Delivery Address';
  const recipientCity = order.deliveryAddress.city || 'Kuala Lumpur';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-3.5 sm:p-4 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shadow-inner text-amber-300">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/80 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-ping" />
                  {isEn ? 'Live GPS Tracking' : 'Jejak GPS Langsung'}
                </span>
                <span className="text-emerald-200 text-xs font-mono font-bold">
                  #{order.orderNumber}
                </span>
              </div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                {isEn ? 'Rider Delivery Live Map' : 'Peta Penghantaran Rider Langsung'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openGoogleMaps}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors"
              title={isEn ? 'Open in Google Maps' : 'Buka dalam Google Maps'}
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-emerald-200" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Close Map"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Map Canvas Screen */}
        <div className="relative flex-1 min-h-[240px] sm:min-h-[320px] md:min-h-[380px] bg-[#e6e4df] overflow-hidden select-none">
          {/* Base Vector Road Map Background */}
          <div
            className={`absolute inset-0 transition-transform duration-300 ${
              viewMode === 'satellite' ? 'bg-[#2b3a32]' : 'bg-[#e8ece9]'
            }`}
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'center center',
              backgroundImage: viewMode === 'satellite'
                ? 'radial-gradient(circle at 50% 50%, #1e2e25 10%, #15221b 90%)'
                : `
                  linear-gradient(to right, #cfd8dc 1px, transparent 1px),
                  linear-gradient(to bottom, #cfd8dc 1px, transparent 1px),
                  radial-gradient(circle at 40% 40%, #e2f0d9 20%, transparent 60%)
                `,
              backgroundSize: '36px 36px, 36px 36px, 100% 100%',
            }}
          >
            {/* SVG Roads and Delivery Trajectory Curve */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Major Highway simulation roads */}
              <line x1="5%" y1="90%" x2="95%" y2="15%" stroke="#ffffff" strokeWidth="18" strokeLinecap="round" opacity="0.9" />
              <line x1="5%" y1="90%" x2="95%" y2="15%" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" opacity="0.8" />

              {/* Secondary avenues */}
              <line x1="20%" y1="10%" x2="80%" y2="90%" stroke="#ffffff" strokeWidth="12" strokeLinecap="round" opacity="0.85" />
              <line x1="10%" y1="40%" x2="90%" y2="60%" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" opacity="0.85" />

              {/* Klang River simulation ribbon */}
              <path
                d="M 0,150 Q 200,90 400,220 T 800,180"
                fill="none"
                stroke="#bfdbfe"
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.75"
              />

              {/* Active Delivery Route Arc */}
              <path
                d={`M ${startX * 6.5} ${startY * 4.5} Q ${ctrlX * 6.5} ${ctrlY * 4.5} ${endX * 6.5} ${endY * 4.5}`}
                fill="none"
                stroke="#047857"
                strokeWidth="6"
                strokeDasharray="8 6"
                className="animate-pulse"
              />
            </svg>

            {/* Neighborhood Labels */}
            <div className="absolute top-10 left-10 text-[10px] font-bold text-gray-500 bg-white/70 px-2 py-0.5 rounded shadow-xs pointer-events-none">
              Bukit Bintang Corridor
            </div>
            <div className="absolute top-16 right-16 text-[10px] font-bold text-gray-500 bg-white/70 px-2 py-0.5 rounded shadow-xs pointer-events-none">
              Jalan Ampang / KLCC Zone
            </div>
            <div className="absolute bottom-16 left-16 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded shadow-xs pointer-events-none">
              🏬 D-mart Central Hub
            </div>

            {/* Point A: Origin / D-mart Hub */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${startX}%`, top: `${startY}%` }}
            >
              <div className="bg-emerald-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap mb-1 border border-white">
                🏬 D-mart Hub Ampang
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-500/30">
                <Store className="w-4 h-4" />
              </div>
            </div>

            {/* Point B: Destination / Customer Home */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${endX}%`, top: `${endY}%` }}
            >
              <div className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap mb-1 border border-white flex items-center gap-1">
                <span>📍</span>
                <span className="truncate max-w-[120px]">{recipientName}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-4 ring-rose-500/20">
                <MapPin className="w-4 h-4 fill-white" />
              </div>
            </div>

            {/* Live Moving Rider Motorbike */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 transition-all duration-500 ease-out"
              style={{ left: `${currentX}%`, top: `${currentY}%` }}
            >
              {/* Floating ETA & Speed Badge */}
              <div className="bg-emerald-950/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-xl border border-emerald-400/80 whitespace-nowrap mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Azman (Yamaha NVX)</span>
                <span className="text-amber-300 font-mono font-bold">• {remainingDistKm} km</span>
              </div>

              {/* Motorbike Marker with Pulse Waves */}
              <div className="relative">
                <div className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-green-500 text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-emerald-500/40 transform hover:scale-110 transition-transform">
                  <Bike className="w-5 h-5 animate-bounce" />
                </div>
              </div>
            </div>
          </div>

          {/* Map Top Floating Overlay Controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-30">
            {/* Live ETA Card */}
            <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-gray-200/80 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Clock className="w-4 h-4 text-emerald-700 animate-spin" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  {isEn ? 'Estimated Arrival' : 'Anggaran Tiba'}
                </div>
                <div className="text-xs sm:text-sm font-black text-emerald-900 flex items-center gap-1">
                  <span>~{etaMinutes} {isEn ? 'mins' : 'minit'}</span>
                  <span className="text-gray-400 text-xs font-normal">({remainingDistKm} km)</span>
                </div>
              </div>
            </div>

            {/* Map Action Tools */}
            <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1 rounded-2xl shadow-md border border-gray-200">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.15))}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-700"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-700"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode((m) => (m === 'normal' ? 'satellite' : 'normal'))}
                className="px-2 py-1 rounded-xl hover:bg-gray-100 text-gray-700 text-[10px] font-bold"
                title="Toggle Satellite"
              >
                {viewMode === 'normal' ? 'Sat' : 'Map'}
              </button>
            </div>
          </div>

          {/* Bottom Left Watermark */}
          <div className="absolute bottom-2 left-2 bg-white/85 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-gray-600 flex items-center gap-1 shadow-xs pointer-events-none">
            <span className="text-blue-500">G</span>
            <span className="text-red-500">o</span>
            <span className="text-amber-500">o</span>
            <span className="text-blue-500">g</span>
            <span className="text-green-500">l</span>
            <span className="text-red-500">e</span>
            <span className="text-gray-500 ml-1">Maps Live Navigation</span>
          </div>

          {/* Bottom Right Live Telemetry */}
          <div className="absolute bottom-2 right-2 bg-black/75 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[10px] font-mono flex items-center gap-2 pointer-events-none">
            <span className="text-emerald-400">● 34 km/h</span>
            <span>|</span>
            <span>GPS: 3.1592° N, 101.7144° E</span>
          </div>
        </div>

        {/* Bottom Details & Quick Contact Bar */}
        <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Rider Identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center font-black text-emerald-900 text-sm shadow-xs shrink-0">
                🛵
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-black text-sm text-gray-900 truncate">Azman bin Razak</h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
                    Yamaha NVX • WXV 8492
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate max-w-xs sm:max-w-md">
                  {isEn ? 'Delivering to: ' : 'Hantar ke: '}
                  <span className="font-semibold text-gray-800">{recipientStreet}, {recipientCity}</span>
                </p>
              </div>
            </div>

            {/* Bottom Action Button Bar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-1 lg:pt-0">
              {/* Live Status Button */}
              <button
                type="button"
                id="live-map-status-btn"
                onClick={() => setIsPlaying((p) => !p)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title={isEn ? 'Toggle Live Simulation Status' : 'Togol Status Simulasi Langsung'}
              >
                {isPlaying ? <Clock className="w-3.5 h-3.5 text-emerald-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                <span>{isPlaying ? (isEn ? 'Live Status' : 'Status Langsung') : (isEn ? 'Paused' : 'Dijeda')}</span>
              </button>

              {/* Restart Simulation Button */}
              <button
                type="button"
                onClick={() => setProgress(20)}
                className="p-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-600 shadow-2xs transition-all active:scale-95 cursor-pointer"
                title={isEn ? 'Restart Movement' : 'Mula Semula Simulasi'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Call Button */}
              <a
                href="tel:0123456789"
                id="live-map-call-btn"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                title={isEn ? 'Call Rider' : 'Hubungi Rider'}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isEn ? 'Call' : 'Telefon'}</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href="https://wa.me/60123456789"
                id="live-map-whatsapp-btn"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                title="WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              {/* View Order Action Button */}
              <button
                type="button"
                id="live-map-view-order-receipt-btn"
                onClick={() => setIsReceiptOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                title={isEn ? 'View Order Receipt & Invoice' : 'Lihat Resit & Invois Pesanan'}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>{isEn ? 'View Order' : 'Lihat Pesanan'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

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
