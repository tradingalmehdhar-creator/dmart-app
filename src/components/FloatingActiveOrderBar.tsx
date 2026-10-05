import React, { useState, useEffect, useMemo } from 'react';
import {
  Bike,
  Clock,
  Navigation,
  Sparkles,
  ChevronRight,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { Order, Language, PromoConfig } from '../types';

interface FloatingActiveOrderBarProps {
  order: Order;
  bannerConfig: PromoConfig['orderStatusBanner'];
  language: Language;
  onOpenTracking: () => void;
  onOpenLiveMap: () => void;
  onUpdateOrder?: (updated: Order) => void;
}

export const FloatingActiveOrderBar: React.FC<FloatingActiveOrderBarProps> = ({
  order,
  bannerConfig,
  language,
  onOpenTracking,
  onOpenLiveMap,
  onUpdateOrder,
}) => {
  const isEn = language === 'en';

  // Determine or compute initial target timestamp
  const targetTimestamp = useMemo(() => {
    if (order.estimatedDeliveryTimestamp && order.estimatedDeliveryTimestamp > Date.now() - 1000 * 60 * 60) {
      return order.estimatedDeliveryTimestamp;
    }

    // Check createdAt
    if (order.createdAt) {
      const createdMs = new Date(order.createdAt).getTime();
      const now = Date.now();
      // If created within the past 40 minutes, target is 30 mins from creation
      if (now - createdMs < 40 * 60 * 1000 && now - createdMs > 0) {
        const est = createdMs + 30 * 60 * 1000;
        if (est > now) return est;
      }
    }

    // Default realistic delivery countdown: 18 minutes from now
    const defaultTarget = Date.now() + 18 * 60 * 1000;
    return defaultTarget;
  }, [order.id, order.estimatedDeliveryTimestamp, order.createdAt]);

  // Current active target time, allowing interactive preview of the < 5 min threshold
  const [activeTarget, setActiveTarget] = useState<number>(targetTimestamp);

  useEffect(() => {
    setActiveTarget(targetTimestamp);
  }, [targetTimestamp]);

  // Calculate seconds remaining, updating every second
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return Math.max(0, Math.floor((activeTarget - Date.now()) / 1000));
  });

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((activeTarget - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeTarget]);

  // Threshold logic: Less than 5 minutes remain (< 300 seconds)
  const isArrivingSoon = secondsRemaining > 0 && secondsRemaining < 300;
  const isArrived = secondsRemaining === 0;

  // Format time remaining
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const formattedCountdown = useMemo(() => {
    if (hours > 0) {
      return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${minutes}m ${pad(seconds)}s`;
  }, [hours, minutes, seconds]);

  // Interactive quick demo toggle between standard countdown and < 5 mins "Arriving soon" state
  const handleSetFastPreview = (mins: number) => {
    const newTarget = Date.now() + mins * 60 * 1000 + 45 * 1000;
    setActiveTarget(newTarget);
    if (onUpdateOrder) {
      onUpdateOrder({
        ...order,
        estimatedDeliveryTimestamp: newTarget,
      });
    }
  };

  return (
    <aside
      id="floating-active-order-alert-bar"
      aria-label="Active order delivery alert bar"
      className={`transition-colors duration-500 py-2.5 px-3 sm:px-4 shadow-md text-xs w-full max-w-full overflow-hidden border-b ${
        isArrivingSoon
          ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 border-amber-600 text-white'
          : isArrived
          ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 border-emerald-600 text-white'
          : 'bg-emerald-800 border-emerald-700 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-2.5">
        {/* Left: Order Info & Status */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 w-full md:w-auto">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-inner ${
              isArrivingSoon
                ? 'bg-amber-400 text-amber-950 animate-bounce'
                : 'bg-emerald-700 text-amber-300'
            }`}
          >
            <Bike className="w-4 h-4 shrink-0" />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0 text-xs">
            <button
              type="button"
              id="floating-bar-order-number-btn"
              onClick={onOpenTracking}
              className="font-bold underline decoration-white/40 hover:decoration-white cursor-pointer hover:text-amber-200 transition-colors shrink-0"
              title={isEn ? 'Click to view full order tracking' : 'Klik untuk lihat penjejakan pesanan'}
            >
              {order.orderNumber}
            </button>
            <span className="text-white/60 hidden sm:inline">•</span>
            <span className="truncate font-medium text-white/95">
              {isEn ? bannerConfig.statusTextEn : bannerConfig.statusTextMs}
            </span>
            <span className="text-white/60 text-[11px] hidden lg:inline">
              ({order.estimatedDeliveryTime || bannerConfig.estimatedDeliveryTime})
            </span>
            {order.deliveryOtp && order.status !== 'delivered' && !order.deliveryOtpVerified && (
              <span className="inline-flex items-center gap-1 bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded text-[11px] shadow-xs">
                <span>OTP:</span>
                <span className="font-mono tracking-wider">{order.deliveryOtp}</span>
              </span>
            )}
          </div>
        </div>

        {/* Center / Right: Dynamic Countdown Timer & Action Controls */}
        <div className="flex items-center flex-wrap justify-between sm:justify-end gap-2 w-full md:w-auto shrink-0">
          {/* Dynamic Countdown Display */}
          <div
            id="floating-bar-countdown-timer-container"
            className="flex items-center gap-1.5"
            aria-live="polite"
          >
            {isArrived ? (
              <div
                id="floating-bar-countdown-arrived"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 font-bold text-xs shadow-xs"
              >
                <PackageCheck className="w-3.5 h-3.5 text-emerald-950" />
                <span>{isEn ? 'Arriving now' : 'Tiba sekarang'}</span>
              </div>
            ) : isArrivingSoon ? (
              /* DYNAMIC UPDATE WHEN LESS THAN 5 MINUTES REMAIN */
              <div
                id="floating-bar-countdown-arriving-soon"
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-extrabold text-xs shadow-md ring-2 ring-amber-300/60 animate-pulse"
                title={
                  isEn
                    ? `Estimated delivery in ${formattedCountdown}`
                    : `Anggaran penghantaran dalam ${formattedCountdown}`
                }
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-900 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-950" />
                </span>
                <span className="uppercase tracking-wide">
                  {isEn ? 'Arriving soon' : 'Akan tiba tidak lama lagi'}
                </span>
                <span className="font-mono text-[11px] font-black bg-amber-950/15 px-1.5 py-0.5 rounded">
                  {formattedCountdown}
                </span>
              </div>
            ) : (
              /* STANDARD COUNTDOWN TIMER (> 5 MINUTES) */
              <div
                id="floating-bar-countdown-standard"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/85 border border-emerald-600/50 text-emerald-100 font-mono text-xs shadow-inner"
                title={
                  isEn
                    ? `Countdown to estimated delivery: ${formattedCountdown}`
                    : `Kiraan detik ke masa penghantaran: ${formattedCountdown}`
                }
              >
                <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="font-semibold text-white/90">
                  {isEn ? 'Delivery in' : 'Penghantaran dalam'}
                </span>
                <span className="font-bold text-amber-300 font-mono tracking-tight">
                  {formattedCountdown}
                </span>
              </div>
            )}
          </div>

          {/* Quick Simulation / Testing Controls (Pills to test > 5m and < 5m) */}
          <div
            id="floating-bar-demo-controls"
            className="flex items-center gap-1 bg-black/25 p-0.5 rounded-lg border border-white/10 text-[10px]"
            title={isEn ? 'Preview countdown thresholds' : 'Pratonton ambang kiraan detik'}
          >
            <button
              type="button"
              id="countdown-preview-18m-btn"
              onClick={() => handleSetFastPreview(18)}
              className={`px-1.5 py-0.5 rounded font-mono font-medium transition-colors cursor-pointer ${
                secondsRemaining >= 300 ? 'bg-white/20 text-white font-bold' : 'text-white/70 hover:text-white'
              }`}
              title={isEn ? 'Set to 18 mins (Standard countdown)' : 'Tetapkan 18 min'}
            >
              18m
            </button>
            <button
              type="button"
              id="countdown-preview-4m-btn"
              onClick={() => handleSetFastPreview(4)}
              className={`px-1.5 py-0.5 rounded font-mono font-medium transition-colors cursor-pointer ${
                isArrivingSoon ? 'bg-amber-400 text-amber-950 font-bold' : 'text-white/70 hover:text-white'
              }`}
              title={isEn ? 'Set to 4 mins (Preview "Arriving soon" <5m)' : 'Tetapkan 4 min (Uji <5m)'}
            >
              {isEn ? '4m (<5m)' : '4m (<5m)'}
            </button>
          </div>

          {/* Actions: Live Map & Track Details */}
          <div className="flex items-center gap-1.5 shrink-0">
            {bannerConfig.showLiveMapButton && (
              <button
                id="floating-bar-live-map-small-btn"
                type="button"
                onClick={onOpenLiveMap}
                className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold px-2.5 py-1 rounded-lg text-xs leading-tight transition-all active:scale-95 shadow-sm cursor-pointer whitespace-nowrap"
                title={isEn ? 'Open Live Delivery Map' : 'Buka Peta Penghantaran Langsung'}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-950 animate-ping" />
                <Navigation className="w-3 h-3 text-emerald-950" />
                <span>{isEn ? 'Live Map' : 'Peta Langsung'}</span>
              </button>
            )}

            <button
              id="floating-bar-view-details-btn"
              type="button"
              onClick={onOpenTracking}
              className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-semibold px-2 py-1 rounded-lg text-xs leading-tight transition-all active:scale-95 border border-white/20 cursor-pointer whitespace-nowrap"
              title={isEn ? 'Track Order Details' : 'Perincian Pesanan'}
            >
              <span>{isEn ? 'Track' : 'Jejak'}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
