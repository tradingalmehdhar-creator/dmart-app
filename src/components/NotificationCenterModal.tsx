import React, { useState } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Bike,
  Package,
  Clock,
  Volume2,
  VolumeX,
  Trash2,
  Navigation,
  Receipt,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { OrderStatusNotification, Language } from '../types';
import { requestPushNotificationPermission } from '../services/fcmNotificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: OrderStatusNotification[];
  onClearAll: () => void;
  onTrackOrder: (orderNumber: string) => void;
  onViewReceipt: (orderNumber: string) => void;
  language: Language;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSimulateTransition: (status: 'packing' | 'out_for_delivery' | 'delivered') => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onTrackOrder,
  onViewReceipt,
  language,
  soundEnabled,
  onToggleSound,
  onSimulateTransition,
}) => {
  const [permissionStatus, setPermissionStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  if (!isOpen) return null;

  const isEn = language === 'en';

  const handleRequestPush = async () => {
    setIsRequestingPermission(true);
    try {
      const res = await requestPushNotificationPermission();
      setPermissionStatus(res);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-emerald-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 id="notification-center-title" className="text-base font-black text-gray-900">
                {isEn ? 'Order Alerts & Notifications' : 'Pemberitahuan Pesanan & Status'}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                {isEn ? 'Real-time order transitions & push alerts' : 'Kemas kini pesanan masa nyata & amaran tolak'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute notification chimes' : 'Unmute notification chimes'}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-white border border-gray-200/80 transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Push Notification Setup Banner */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-gray-900">
                    {isEn ? 'Firebase Cloud Messaging (FCM)' : 'Pemberitahuan Tolak Firebase (FCM)'}
                  </span>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                      permissionStatus === 'granted'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {permissionStatus === 'granted' ? (isEn ? 'Active' : 'Aktif') : (isEn ? 'Disabled' : 'Mati')}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {permissionStatus === 'granted'
                    ? (isEn ? 'Device registered for instant background and lockscreen delivery alerts.' : 'Peranti didaftarkan untuk amaran penghantaran masa nyata.')
                    : (isEn ? 'Enable browser push notifications to get alerts when app is in the background.' : 'Aktifkan amaran tolak penyemak imbas untuk menerima status bila aplikasi di latar belakang.')}
                </p>
              </div>
            </div>

            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPush}
                disabled={isRequestingPermission}
                id="enable-fcm-push-btn"
                className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                {isRequestingPermission ? (isEn ? 'Enabling...' : 'Mengaktifkan...') : (isEn ? 'Enable Push' : 'Aktifkan')}
              </button>
            )}
          </div>
        </div>

        {/* Live Simulation Testing Bar (Developer & User Demo Tool) */}
        <div className="p-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
              {isEn ? 'Live Transition Simulation Bar' : 'Bar Simulasi Peralihan Langsung'}
            </span>
            <span className="text-[10px] font-medium text-gray-400">
              {isEn ? 'Triggers toast + sound + push' : 'Mencetuskan toast + bunyi + tolak'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => onSimulateTransition('packing')}
              id="simulate-packing-btn"
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-[11px] transition-all active:scale-95 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEn ? 'Preparing' : 'Disediakan'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSimulateTransition('out_for_delivery')}
              id="simulate-dispatch-btn"
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-950 font-bold text-[11px] transition-all active:scale-95 cursor-pointer"
            >
              <Bike className="w-3.5 h-3.5 text-amber-600" />
              <span>{isEn ? 'Out for Delivery' : 'Dihantar'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSimulateTransition('delivered')}
              id="simulate-delivered-btn"
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-950 font-bold text-[11px] transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? 'Delivered' : 'Selesai'}</span>
            </button>
          </div>
        </div>

        {/* Notifications List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-gray-700">
                {isEn ? 'No notifications yet' : 'Tiada pemberitahuan lagi'}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                {isEn
                  ? 'When your order transitions status (e.g. Preparing or Out for Delivery), alerts will appear here.'
                  : 'Apabila status pesanan anda bertukar (contohnya Sedang Disediakan atau Dihantar), amaran akan dipaparkan di sini.'}
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const notifTitle = isEn ? notif.titleEn : notif.titleMs;
              const notifBody = isEn ? notif.bodyEn : notif.bodyMs;

              return (
                <div
                  key={notif.id}
                  className="p-3.5 rounded-2xl border border-gray-200/90 bg-white hover:border-emerald-300 transition-all shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'preparing'
                          ? 'bg-blue-100 text-blue-700'
                          : notif.type === 'out_for_delivery'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {notif.type === 'preparing' ? (
                        <Package className="w-4 h-4" />
                      ) : notif.type === 'out_for_delivery' ? (
                        <Bike className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black text-gray-400 font-mono">
                          #{notif.orderNumber}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-gray-900 mt-0.5">
                        {notifTitle}
                      </h4>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                        {notifBody}
                      </p>

                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onTrackOrder(notif.orderNumber);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>{isEn ? 'Live Tracking' : 'Jejak Peta'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onViewReceipt(notif.orderNumber);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 hover:text-gray-900"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>{isEn ? 'Receipt' : 'Resit'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              {notifications.length} {isEn ? 'recent alerts' : 'amaran terkini'}
            </span>
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isEn ? 'Clear History' : 'Kosongkan Sejarah'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
