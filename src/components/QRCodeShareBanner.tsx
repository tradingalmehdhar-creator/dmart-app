import React, { useState, useRef } from 'react';
import {
  QrCode,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  Users,
  Smartphone,
  Maximize2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Language } from '../types';
import {
  OFFICIAL_APP_DOWNLOAD_URL,
  DMART_QR_LOGO_DATA_URI,
} from './ShareAppModal';

interface QRCodeShareBannerProps {
  language: Language;
  variant?: 'compact' | 'order-success' | 'card';
  onOpenFullModal?: () => void;
  className?: string;
}

export const QRCodeShareBanner: React.FC<QRCodeShareBannerProps> = ({
  language,
  variant = 'compact',
  onOpenFullModal,
  className = '',
}) => {
  const isEn = language === 'en';
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(OFFICIAL_APP_DOWNLOAD_URL);
      } else {
        const input = document.createElement('input');
        input.value = OFFICIAL_APP_DOWNLOAD_URL;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);

      // Web Share API on mobile
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: 'D-mart Supermarket',
            text: isEn
              ? 'Scan to download or share the D-mart app for fast fresh grocery deliveries!'
              : 'Imbas untuk muat turun atau kongsi aplikasi D-mart bagi penghantaran runcit pantas!',
            url: OFFICIAL_APP_DOWNLOAD_URL,
          });
        } catch {
          // ignore share dismissal
        }
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSaveQR = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const canvas = qrRef.current?.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'dmart-app-qr-code.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2200);
      }
    } catch (err) {
      console.error('Failed to save QR image:', err);
    }
  };

  // 1. Compact Drawer / Bottom Navigation Banner
  if (variant === 'compact') {
    return (
      <div
        id="side-drawer-qr-banner"
        className={`p-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-teal-50 border border-emerald-200 shadow-xs flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            ref={qrRef}
            onClick={onOpenFullModal}
            className="w-12 h-12 bg-white rounded-xl p-1 border border-emerald-300 shadow-2xs shrink-0 cursor-pointer flex items-center justify-center hover:scale-105 transition-transform"
            title={isEn ? 'Click to view QR Code' : 'Klik untuk lihat Kod QR'}
          >
            <QRCodeCanvas
              value={OFFICIAL_APP_DOWNLOAD_URL}
              size={40}
              level="M"
              bgColor="#ffffff"
              fgColor="#064e3b"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-black text-emerald-950 truncate block">
                {isEn ? 'Scan to Share D-mart' : 'Imbas untuk Kongsi D-mart'}
              </span>
              <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
            </div>
            <p className="text-[10px] text-gray-600 truncate leading-tight">
              {isEn
                ? 'Scan to download or share the D-mart app'
                : 'Imbas untuk muat turun atau kongsi'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title={isEn ? 'Copy download link' : 'Salin pautan muat turun'}
            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-emerald-700" />
            )}
          </button>
          {onOpenFullModal && (
            <button
              type="button"
              onClick={onOpenFullModal}
              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Maximize2 className="w-3 h-3" />
              <span>{isEn ? 'QR' : 'Kod'}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Order Success Screen Banner
  return (
    <div
      id="order-success-qr-banner"
      className={`rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 shadow-lg shadow-emerald-950/15 border-2 border-emerald-500/40 relative overflow-hidden ${className}`}
    >
      {/* Subtle Background Elements */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="bg-amber-400 text-emerald-950 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
          {isEn ? 'Invite & Share' : 'Jemput & Kongsi'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 relative z-10">
        {/* QR Code Presentation Card */}
        <div
          ref={qrRef}
          onClick={onOpenFullModal}
          className="bg-white p-3 rounded-2xl shadow-md border-2 border-emerald-300 flex flex-col items-center shrink-0 cursor-pointer group hover:scale-[1.02] transition-transform"
        >
          {/* D-mart Logo directly above the QR Code */}
          <div className="flex items-center gap-1 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center text-white text-[10px] font-black">
              D
            </div>
            <span className="text-[11px] font-black text-emerald-950">D-mart</span>
          </div>

          <QRCodeCanvas
            value={OFFICIAL_APP_DOWNLOAD_URL}
            size={120}
            level="H"
            bgColor="#ffffff"
            fgColor="#064e3b"
            imageSettings={{
              src: DMART_QR_LOGO_DATA_URI,
              height: 26,
              width: 26,
              excavate: true,
            }}
          />

          <span className="text-[9px] font-extrabold text-emerald-800 mt-1.5 flex items-center gap-0.5 group-hover:text-emerald-950">
            <Maximize2 className="w-2.5 h-2.5" />
            <span>{isEn ? 'Tap to Enlarge' : 'Ketik untuk Besarkan'}</span>
          </span>
        </div>

        {/* Banner Copy & Action Controls */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-black uppercase tracking-wider mb-0.5">
              <Users className="w-3.5 h-3.5" />
              <span>
                {isEn
                  ? 'Love D-mart? Share with Friends!'
                  : 'Suka D-mart? Kongsi dengan Rakan!'}
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white leading-snug">
              {isEn
                ? 'Scan to download or share the D-mart app'
                : 'Imbas untuk muat turun atau kongsi aplikasi D-mart'}
            </h4>
            <p className="text-xs text-emerald-100 mt-0.5 leading-relaxed">
              {isEn
                ? 'Tell neighbours and family about our 30-minute doorstep grocery delivery.'
                : 'Kongsikan bersama jiran dan keluarga untuk penghantaran runcit 30 minit.'}
            </p>
          </div>

          {/* Quick Action Buttons: Share Link & Save QR Image */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-950" />
                  <span>{isEn ? 'Link Copied!' : 'Pautan Disalin!'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-950" />
                  <span>{isEn ? 'Share Link' : 'Kongsi Pautan'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveQR}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs border border-white/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>{savedSuccess ? (isEn ? 'Saved PNG!' : 'Disimpan!') : (isEn ? 'Save QR Image' : 'Simpan Imej QR')}</span>
            </button>

            {onOpenFullModal && (
              <button
                type="button"
                onClick={onOpenFullModal}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 text-xs font-semibold border border-emerald-600/60 transition-colors cursor-pointer flex items-center gap-1"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden xs:inline">{isEn ? 'Full QR' : 'Penuh'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
