import React, { useState } from 'react';
import { Download, Share2, PlusSquare, X, CheckCircle2, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types';

interface PWAInstallButtonProps {
  language?: Language;
  variant?: 'compact' | 'full' | 'banner' | 'nav';
  className?: string;
  onInstalled?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language = 'en',
  variant = 'full',
  className = '',
  onInstalled,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running inside installed standalone PWA, hide install trigger
  if (isInstalled) {
    return null;
  }

  // If neither Chromium prompt nor iOS is ready, hide or show subtle fallback in banner mode
  if (!isInstallable && !isIOS && variant !== 'banner') {
    return null;
  }

  const isEn = language === 'en';

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    if (isInstallable) {
      setIsInstalling(true);
      const success = await install();
      setIsInstalling(false);
      if (success && onInstalled) {
        onInstalled();
      }
    }
  };

  return (
    <>
      {variant === 'compact' && (
        <button
          type="button"
          id="pwa-install-compact-btn"
          data-testid="pwa-install-compact-btn"
          onClick={handleInstallClick}
          aria-label={isEn ? 'Install D-Mart App' : 'Pasang Aplikasi D-Mart'}
          title={isEn ? 'Install D-Mart App on Home Screen' : 'Pasang Aplikasi D-Mart di Skrin Utama'}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
            isIOS
              ? 'bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-400/40'
              : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 border border-amber-300'
          } ${className}`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>{isEn ? 'Install App' : 'Pasang App'}</span>
        </button>
      )}

      {variant === 'nav' && (
        <button
          type="button"
          id="pwa-install-nav-btn"
          data-testid="pwa-install-nav-btn"
          onClick={handleInstallClick}
          aria-label={isEn ? 'Install D-Mart App' : 'Pasang Aplikasi D-Mart'}
          title={isEn ? 'Install D-Mart App on Home Screen' : 'Pasang Aplikasi D-Mart di Skrin Utama'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 border ${
            isIOS
              ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900'
              : 'bg-amber-400 hover:bg-amber-300 border-amber-500 text-slate-950'
          } ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{isEn ? 'Install App' : 'Pasang App'}</span>
        </button>
      )}

      {variant === 'full' && (
        <button
          type="button"
          id="pwa-install-full-btn"
          data-testid="pwa-install-full-btn"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer border ${
            isIOS
              ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
          } ${className}`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>
            {isInstalling
              ? isEn
                ? 'Installing...'
                : 'Sedang Memasang...'
              : isEn
              ? 'Install D-Mart on Device'
              : 'Pasang D-Mart pada Peranti'}
          </span>
        </button>
      )}

      {variant === 'banner' && (
        <div
          id="pwa-install-banner"
          data-testid="pwa-install-banner"
          className={`p-3 rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 text-white border border-emerald-700/50 shadow-md ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-extrabold text-white leading-tight">
                {isEn ? 'Get the D-Mart App' : 'Dapatkan Aplikasi D-Mart'}
              </h4>
              <p className="text-[11px] text-emerald-200 truncate">
                {isEn ? 'Fast, offline-ready grocery shopping' : 'Beli-belah pantas, sedia luar talian'}
              </p>
            </div>
            <button
              type="button"
              id="pwa-banner-install-btn"
              data-testid="pwa-banner-install-btn"
              onClick={handleInstallClick}
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              {isEn ? 'Install' : 'Pasang'}
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Guided Install Modal */}
      {showIOSModal && (
        <div
          id="pwa-ios-guide-modal"
          data-testid="pwa-ios-guide-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black">
                  D
                </div>
                <h3 className="font-extrabold text-gray-900 text-base">
                  {isEn ? 'Install on iPhone / iPad' : 'Pasang pada iPhone / iPad'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {isEn
                ? 'Apple iOS Safari requires adding to Home Screen manually in 2 simple steps:'
                : 'Apple iOS Safari memerlukan penambahan ke Skrin Utama secara manual dalam 2 langkah mudah:'}
            </p>

            <div className="space-y-2.5 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs text-gray-800">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <div>
                  <span className="font-bold">{isEn ? 'Tap the Share button' : 'Tekan butang Kongsi (Share)'}</span>
                  <p className="text-[11px] text-gray-500">
                    {isEn ? 'Located at the bottom of Safari' : 'Terletak di bahagian bawah Safari'}
                  </p>
                </div>
                <Share2 className="w-4 h-4 text-blue-600 shrink-0 ml-auto" />
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <div>
                  <span className="font-bold">
                    {isEn ? 'Tap "Add to Home Screen"' : 'Tekan "Add to Home Screen"'}
                  </span>
                  <p className="text-[11px] text-gray-500">
                    {isEn ? 'Scroll down the share menu' : 'Tatal ke bawah menu perkongsian'}
                  </p>
                </div>
                <PlusSquare className="w-4 h-4 text-emerald-600 shrink-0 ml-auto" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm"
            >
              {isEn ? 'Got It' : 'Faham'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
