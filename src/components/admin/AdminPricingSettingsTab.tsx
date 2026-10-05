import React, { useState } from 'react';
import {
  DollarSign,
  Truck,
  Volume2,
  Megaphone,
  Save,
  CheckCircle2,
  Percent,
  Sliders,
  Bell,
  Sparkles,
  Play,
  RotateCcw
} from 'lucide-react';
import { PromoConfig, ShippingSettings, Language } from '../../types';
import { playNotificationChime, ChimeSoundType } from '../../utils/audioChime';

interface AdminPricingSettingsTabProps {
  promoSettings: PromoConfig;
  onUpdatePromoSettings: (updated: PromoConfig) => void;
  shippingSettings: ShippingSettings;
  onUpdateShippingSettings: (updated: ShippingSettings) => void;
  language: Language;
}

export const AdminPricingSettingsTab: React.FC<AdminPricingSettingsTabProps> = ({
  promoSettings,
  onUpdatePromoSettings,
  shippingSettings,
  onUpdateShippingSettings,
  language,
}) => {
  const [shipping, setShipping] = useState<ShippingSettings>(shippingSettings);
  const [promo, setPromo] = useState<PromoConfig>(promoSettings);
  const [selectedChime, setSelectedChime] = useState<ChimeSoundType>('cash_register');
  const [isSavedToast, setIsSavedToast] = useState(false);

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateShippingSettings(shipping);
    onUpdatePromoSettings(promo);
    setIsSavedToast(true);
    playNotificationChime(selectedChime);
    setTimeout(() => setIsSavedToast(false), 3500);
  };

  const handleTestChime = (sound: ChimeSoundType) => {
    setSelectedChime(sound);
    playNotificationChime(sound);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      {/* Toast Alert */}
      {isSavedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">
            {language === 'en' ? 'Pricing & App settings saved successfully.' : 'Tetapan harga & aplikasi berjaya disimpan.'}
          </span>
        </div>
      )}

      {/* Header with Save Button */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Delivery Pricing & App Configuration' : 'Kadar Penghantaran & Konfigurasi Aplikasi'}</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'en' ? 'Manage real-time shipping calculation rules, banner announcements, and order sound alerts.' : 'Urus kadar penghantaran masa nyata, banner pengumuman & bunyi notifikasi.'}
          </p>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{language === 'en' ? 'Save All Settings' : 'Simpan Semua Tetapan'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Dynamic Shipping Rates */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">
                {language === 'en' ? 'Dynamic Delivery Fee Rules' : 'Kadar Penghantaran Dinamik'}
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
              MYR Currency
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Base Delivery Fee (RM)
              </label>
              <input
                type="number"
                step="0.50"
                value={shipping.baseFee}
                onChange={(e) => setShipping({ ...shipping, baseFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Default minimum fee for up to 5km</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Per-Kilometer Charge (RM/km)
              </label>
              <input
                type="number"
                step="0.10"
                value={shipping.perKmRate}
                onChange={(e) => setShipping({ ...shipping, perKmRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Calculated beyond base radius</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Free Delivery Threshold (RM)
              </label>
              <input
                type="number"
                step="5.00"
                value={shipping.freeDeliveryThreshold}
                onChange={(e) => setShipping({ ...shipping, freeDeliveryThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Orders above this qualify for RM 0 shipping</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Surge Multiplier (Peak / Rain)
              </label>
              <select
                value={shipping.surgeMultiplier}
                onChange={(e) => setShipping({ ...shipping, surgeMultiplier: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
              >
                <option value={1.0}>1.0x (Standard Normal)</option>
                <option value={1.2}>1.2x (Slight Peak)</option>
                <option value={1.35}>1.35x (Heavy Rain / Storm)</option>
                <option value={1.5}>1.5x (Festive Rush)</option>
              </select>
              <span className="text-[10px] text-gray-400 mt-1 block">Dynamic multiplier during rush hours</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Express Priority 1-Hour Surcharge (RM)
              </label>
              <input
                type="number"
                step="0.50"
                value={shipping.expressDeliveryFee}
                onChange={(e) => setShipping({ ...shipping, expressDeliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Max Delivery Radius (km)
              </label>
              <input
                type="number"
                value={shipping.maxDeliveryRadiusKm}
                onChange={(e) => setShipping({ ...shipping, maxDeliveryRadiusKm: parseInt(e.target.value) || 25 })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Module 2: Notification Chimes & Sound Alerts */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Volume2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">
                {language === 'en' ? 'Custom Notification Chimes' : 'Bunyi Notifikasi Pesanan'}
              </h4>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Web Audio Synthesizer</span>
          </div>

          <p className="text-xs text-gray-500">
            Select the audio chime sound played when new customer orders are placed or rider dispatch alerts arrive:
          </p>

          <div className="space-y-2">
            {[
              { id: 'cash_register', name: 'Supermarket Cash Register ("Cha-Ching")', desc: 'Classic retail register chime for high energy' },
              { id: 'bell_chime', name: 'Harmonic Grocery Bell Chime', desc: 'Pleasant multi-tone acoustic bell' },
              { id: 'digital_ping', name: 'Modern Digital Dispatch Ping', desc: 'Minimalist crisp dispatch beep' },
              { id: 'bicycle_bell', name: 'Fleet Bicycle Double-Bell', desc: 'Friendly courier bell sound' },
            ].map((sound) => (
              <div
                key={sound.id}
                onClick={() => setSelectedChime(sound.id as ChimeSoundType)}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  selectedChime === sound.id
                    ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100/60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900">{sound.name}</p>
                  <p className="text-[11px] text-gray-500">{sound.desc}</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestChime(sound.id as ChimeSoundType);
                  }}
                  className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0 ml-2"
                >
                  <Play className="w-3 h-3 text-amber-600" />
                  <span>Test Audio</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Module 3: Top Announcement Bar UI Copy */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-900 text-sm">
                {language === 'en' ? 'Store Frontpage Announcement Bar & Banners' : 'Teks Banner & Pengumuman Utama'}
              </h4>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={promo.announcementBar.enabled}
                onChange={(e) =>
                  setPromo({
                    ...promo,
                    announcementBar: { ...promo.announcementBar, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <span>Enable Announcement Banner</span>
            </label>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {language === 'en'
                  ? 'Tip: You can also manage top announcements, store logo badges, and complete footer copies in the dedicated "Header & Footer Copy" tab with live Firestore synchronization.'
                  : 'Tip: Anda juga boleh mengurus pengumuman atas, lencana logo kedai, dan salinan pengaki lengkap dalam tab "Salinan Pengepala & Pengaki" dengan sinkronisasi langsung ke Firestore.'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Announcement Copy (English)
              </label>
              <input
                type="text"
                value={promo.announcementBar.textEn}
                onChange={(e) =>
                  setPromo({
                    ...promo,
                    announcementBar: { ...promo.announcementBar, textEn: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Teks Pengumuman (Bahasa Malaysia)
              </label>
              <input
                type="text"
                value={promo.announcementBar.textMs}
                onChange={(e) =>
                  setPromo({
                    ...promo,
                    announcementBar: { ...promo.announcementBar, textMs: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Order Tracking Banner Text (English)
              </label>
              <input
                type="text"
                value={promo.orderStatusBanner.statusTextEn}
                onChange={(e) =>
                  setPromo({
                    ...promo,
                    orderStatusBanner: { ...promo.orderStatusBanner, statusTextEn: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Teks Status Pesanan (Bahasa Malaysia)
              </label>
              <input
                type="text"
                value={promo.orderStatusBanner.statusTextMs}
                onChange={(e) =>
                  setPromo({
                    ...promo,
                    orderStatusBanner: { ...promo.orderStatusBanner, statusTextMs: e.target.value },
                  })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
