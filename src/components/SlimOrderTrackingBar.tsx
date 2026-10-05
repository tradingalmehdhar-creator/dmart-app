import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Navigation, ArrowRight } from 'lucide-react';
import { Order, Language } from '../types';

interface SlimOrderTrackingBarProps {
  order: Order;
  language: Language;
  onOpenLiveMap: () => void;
  onOpenTracking: () => void;
}

export const SlimOrderTrackingBar: React.FC<SlimOrderTrackingBarProps> = ({
  order,
  language,
  onOpenLiveMap,
  onOpenTracking,
}) => {
  const isEn = language === 'en';

  // Target timestamp for real-time live delivery countdown
  const targetTimestamp = useMemo(() => {
    if (
      order.estimatedDeliveryTimestamp &&
      order.estimatedDeliveryTimestamp > Date.now() - 1000 * 60 * 60
    ) {
      return order.estimatedDeliveryTimestamp;
    }

    if (order.createdAt) {
      const createdMs = new Date(order.createdAt).getTime();
      const now = Date.now();
      if (now - createdMs < 45 * 60 * 1000 && now - createdMs > 0) {
        const est = createdMs + 25 * 60 * 1000;
        if (est > now) return est;
      }
    }

    // Default dynamic estimate (e.g. 11m 03s from current time)
    return Date.now() + 11 * 60 * 1000 + 3 * 1000;
  }, [order.id, order.estimatedDeliveryTimestamp, order.createdAt]);

  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
  });

  useEffect(() => {
    const updateCountdown = () => {
      setSecondsRemaining(Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000)));
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const formattedCountdown =
    secondsRemaining === 0
      ? isEn
        ? 'Arriving now'
        : 'Tiba sekarang'
      : `${minutes}m ${pad(seconds)}s`;

  // Short status formatting (e.g., "Out for delivery", "Preparing")
  const getShortStatus = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'out_for_delivery':
        return isEn ? 'Out for delivery' : 'Sedang dihantar';
      case 'preparing':
      case 'packing':
        return isEn ? 'Preparing order' : 'Sedang dibungkus';
      case 'picked_up':
      case 'accepted':
        return isEn ? 'Rider on the way' : 'Rider menuju pasaraya';
      case 'submitted':
      case 'received':
      default:
        return isEn ? 'Order confirmed' : 'Pesanan disahkan';
    }
  };

  const shortStatus = getShortStatus(order.status);
  const displayOrderNumber = order.orderNumber || order.id;

  return (
    <div
      id="slim-order-tracking-bar"
      onClick={onOpenLiveMap}
      role="region"
      aria-label="Active order delivery status"
      className="w-full rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm border border-emerald-500/30 hover:border-emerald-400/60 transition-all cursor-pointer flex items-center justify-between gap-2.5 sm:gap-4 select-none group"
    >
      {/* Left: Animated Pulse Dot + Order ID & Short Status */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>

        <span className="font-mono font-extrabold text-white text-xs sm:text-sm tracking-tight shrink-0 group-hover:text-emerald-300 transition-colors">
          {displayOrderNumber}
        </span>

        <span className="text-emerald-400/60 text-xs shrink-0 font-bold">•</span>

        <span className="text-emerald-100/90 text-xs sm:text-sm font-semibold truncate">
          {shortStatus}
        </span>
      </div>

      {/* Middle: Estimated Time countdown */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-black/40 border border-white/10 text-amber-300 font-mono text-xs font-bold shrink-0 shadow-inner"
        title={isEn ? 'Estimated delivery time' : 'Anggaran masa penghantaran'}
      >
        <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span>{formattedCountdown}</span>
      </div>

      {/* Right: Single Compact Action Button / Clickable Arrow */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          id="btn-open-live-map-compact"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLiveMap();
          }}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs transition-all shadow-xs cursor-pointer group/btn"
          title={isEn ? 'Open live map and driver tracking' : 'Buka peta langsung'}
        >
          <Navigation className="w-3.5 h-3.5 text-slate-950 shrink-0" />
          <span className="hidden sm:inline font-bold">
            {isEn ? 'Live Map' : 'Peta Langsung'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-950 group-hover/btn:translate-x-0.5 transition-transform shrink-0" />
        </button>
      </div>
    </div>
  );
};
