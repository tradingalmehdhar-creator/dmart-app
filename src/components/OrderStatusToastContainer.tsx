import React, { useEffect, useState } from 'react';
import {
  Package,
  Bike,
  CheckCircle2,
  Bell,
  X,
  ExternalLink,
  Receipt,
  Navigation,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { OrderStatusNotification, Language } from '../types';

interface OrderStatusToastContainerProps {
  notifications: OrderStatusNotification[];
  onDismiss: (id: string) => void;
  onTrackOrder: (orderNumber: string) => void;
  onViewReceipt?: (orderNumber: string) => void;
  language: Language;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

export const OrderStatusToastContainer: React.FC<OrderStatusToastContainerProps> = ({
  notifications,
  onDismiss,
  onTrackOrder,
  onViewReceipt,
  language,
  soundEnabled = true,
  onToggleSound,
}) => {
  if (notifications.length === 0) return null;

  return (
    <aside
      aria-label="Order status notifications"
      className="fixed top-3 right-3 sm:top-5 sm:right-5 z-70 flex flex-col gap-2.5 max-w-[calc(100vw-24px)] w-[400px] pointer-events-none select-none"
    >
      {notifications.map((notif) => (
        <SingleOrderToast
          key={notif.id}
          notification={notif}
          onDismiss={() => onDismiss(notif.id)}
          onTrackOrder={() => onTrackOrder(notif.orderNumber)}
          onViewReceipt={onViewReceipt ? () => onViewReceipt(notif.orderNumber) : undefined}
          language={language}
          soundEnabled={soundEnabled}
          onToggleSound={onToggleSound}
        />
      ))}
    </aside>
  );
};

interface SingleOrderToastProps {
  notification: OrderStatusNotification;
  onDismiss: () => void;
  onTrackOrder: () => void;
  onViewReceipt?: () => void;
  language: Language;
  soundEnabled: boolean;
  onToggleSound?: () => void;
}

const SingleOrderToast: React.FC<SingleOrderToastProps> = ({
  notification,
  onDismiss,
  onTrackOrder,
  onViewReceipt,
  language,
  soundEnabled,
  onToggleSound,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const isEn = language === 'en';

  // Auto-dismiss in 8 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1.25; // ~8 seconds total
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, onDismiss]);

  const getTheme = () => {
    switch (notification.type) {
      case 'preparing':
        return {
          border: 'border-blue-400/80',
          bg: 'bg-white/98',
          shadow: 'shadow-blue-500/15',
          ring: 'ring-blue-500/20',
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
          iconBg: 'bg-blue-500 text-white shadow-blue-500/30',
          barColor: 'bg-blue-500',
          stepLabel: isEn ? 'STEP 2/4: PREPARING' : 'LANGKAH 2/4: DISEDIAKAN',
          icon: <Package className="w-5 h-5 animate-bounce" />,
        };
      case 'out_for_delivery':
        return {
          border: 'border-amber-400/90',
          bg: 'bg-white/98',
          shadow: 'shadow-amber-500/20',
          ring: 'ring-amber-400/30',
          badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
          iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-amber-500/30',
          barColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
          stepLabel: isEn ? 'STEP 3/4: OUT FOR DELIVERY' : 'LANGKAH 3/4: DALAM PENGHANTARAN',
          icon: <Bike className="w-5 h-5 animate-pulse" />,
        };
      case 'delivered':
        return {
          border: 'border-emerald-400/90',
          bg: 'bg-white/98',
          shadow: 'shadow-emerald-500/20',
          ring: 'ring-emerald-400/30',
          badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
          iconBg: 'bg-emerald-600 text-white shadow-emerald-500/30',
          barColor: 'bg-emerald-600',
          stepLabel: isEn ? 'STEP 4/4: DELIVERED' : 'LANGKAH 4/4: SELESAI DIHANTAR',
          icon: <CheckCircle2 className="w-5 h-5" />,
        };
      default:
        return {
          border: 'border-emerald-400/80',
          bg: 'bg-white/98',
          shadow: 'shadow-emerald-500/15',
          ring: 'ring-emerald-400/20',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          iconBg: 'bg-emerald-600 text-white shadow-emerald-500/30',
          barColor: 'bg-emerald-500',
          stepLabel: isEn ? 'ORDER UPDATE' : 'KEMAS KINI PESANAN',
          icon: <Bell className="w-5 h-5" />,
        };
    }
  };

  const theme = getTheme();
  const title = isEn ? notification.titleEn : notification.titleMs;
  const body = isEn ? notification.bodyEn : notification.bodyMs;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="alert"
      className={`pointer-events-auto relative overflow-hidden rounded-2xl border-2 ${theme.border} ${theme.bg} ${theme.shadow} shadow-2xl ring-2 ${theme.ring} backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in-50`}
    >
      {/* Top Countdown Progress Bar */}
      <div className="w-full bg-gray-100 h-1">
        <div
          className={`h-full transition-all duration-100 ${theme.barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-3.5 sm:p-4">
        {/* Header row: Status Step Badge, Order Number & Action icons */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${theme.badgeBg}`}
            >
              {theme.stepLabel}
            </span>
            <span className="text-[11px] font-bold text-gray-500 font-mono">
              #{notification.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-gray-500" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content row: Icon + Texts */}
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${theme.iconBg}`}
          >
            {theme.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-gray-950 leading-snug">
              {title}
            </h4>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5 leading-relaxed">
              {body}
            </p>

            {notification.eta && (
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-900 text-[10px] font-bold">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>{isEn ? 'Estimated Arrival:' : 'Anggaran Tiba:'} {notification.eta}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons row */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onTrackOrder}
            id={`toast-track-btn-${notification.orderNumber}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-xs transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isEn ? 'Track Live Map' : 'Jejak Peta Langsung'}</span>
          </button>

          {onViewReceipt && (
            <button
              type="button"
              onClick={onViewReceipt}
              id={`toast-receipt-btn-${notification.orderNumber}`}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-98 text-gray-700 font-bold text-xs transition-all cursor-pointer"
              title={isEn ? 'View Order Receipt' : 'Lihat Resit'}
            >
              <Receipt className="w-3.5 h-3.5 text-gray-600" />
              <span className="hidden sm:inline">{isEn ? 'Receipt' : 'Resit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
