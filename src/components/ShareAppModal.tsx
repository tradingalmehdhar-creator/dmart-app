import React, { useState, useRef } from 'react';
import {
  X,
  QrCode,
  Share2,
  Download,
  Copy,
  Check,
  Smartphone,
  Sparkles,
  ExternalLink,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Language } from '../types';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  storeBadgeText?: string;
}

// Crisp inline SVG data URI for the D-mart center logo inside the QR code
// Safe for canvas export (no CORS / tainting issues)
export const DMART_QR_LOGO_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="18" fill="#047857"/>
  <rect x="4" y="4" width="72" height="72" rx="14" fill="#065f46" stroke="#10b981" stroke-width="2"/>
  <path d="M28 32V24a12 12 0 0 1 24 0v8" fill="none" stroke="#fbbf24" stroke-width="5" stroke-linecap="round"/>
  <rect x="18" y="32" width="44" height="34" rx="8" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
  <text x="40" y="55" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" text-anchor="middle" fill="#ffffff">D</text>
</svg>
`);

export const OFFICIAL_APP_DOWNLOAD_URL = 'https://dmart-app.com/download';

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  language,
  storeBadgeText,
}) => {
  const isEn = language === 'en';
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const qrWrapperRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(OFFICIAL_APP_DOWNLOAD_URL);
      } else {
        // Fallback for older browsers / iframes
        const input = document.createElement('input');
        input.value = OFFICIAL_APP_DOWNLOAD_URL;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

      // Attempt native Web Share API if available and user is on mobile
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: 'D-mart Supermarket App',
            text: isEn
              ? 'Shop fresh groceries, meat & pantry essentials on D-mart with fast delivery!'
              : 'Beli barangan runcit segar, daging & keperluan dapur di D-mart dengan penghantaran pantas!',
            url: OFFICIAL_APP_DOWNLOAD_URL,
          });
        } catch {
          // User dismissed native share sheet; clipboard copy already succeeded
        }
      }
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveQR = () => {
    try {
      const canvas = qrWrapperRef.current?.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = 'dmart-app-qr-code.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to download QR code image:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="share-app-modal"
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header with D-mart Gradient */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-4 sm:p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shadow-xs border border-white/20">
              <QrCode className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/30">
                  D-mart Official
                </span>
                <span className="bg-emerald-600/80 text-emerald-100 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  {isEn ? 'Mobile App' : 'Aplikasi Mudah Alih'}
                </span>
              </div>
              <h3 className="font-black text-lg sm:text-xl leading-tight">
                {isEn ? 'Share D-mart App' : 'Kongsi Aplikasi D-mart'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 flex flex-col items-center text-center">
          {/* Main QR Card with Rounded Corners, Subtle Shadows and D-mart Branding */}
          <div
            id="dmart-qr-presentation-card"
            className="w-full max-w-[320px] bg-gradient-to-b from-emerald-50/70 via-white to-emerald-50/40 rounded-3xl p-5 border-2 border-emerald-500/30 shadow-lg shadow-emerald-900/5 flex flex-col items-center relative"
          >
            {/* D-mart Logo directly above the QR Code */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                D
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-emerald-950 leading-none">
                  D<span className="text-emerald-600">-mart</span>
                </div>
                <span className="text-[9px] font-extrabold text-emerald-700 tracking-wider uppercase">
                  {storeBadgeText || 'PASARAYA'}
                </span>
              </div>
              <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                ⭐ 4.9 App
              </span>
            </div>

            {/* QR Code Container with Center Logo */}
            <div
              ref={qrWrapperRef}
              className="p-3.5 bg-white rounded-2xl shadow-md border border-emerald-200/80 transition-transform duration-200 hover:scale-[1.02] relative"
            >
              <QRCodeCanvas
                id="dmart-official-qr-canvas"
                value={OFFICIAL_APP_DOWNLOAD_URL}
                size={190}
                level="H"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#064e3b" // Deep D-mart emerald
                imageSettings={{
                  src: DMART_QR_LOGO_DATA_URI,
                  height: 38,
                  width: 38,
                  excavate: true,
                }}
              />
            </div>

            {/* Clear Text Below QR Code */}
            <p className="text-xs font-bold text-gray-800 mt-3 max-w-[240px] leading-snug">
              {isEn
                ? 'Scan to download or share the D-mart app'
                : 'Imbas untuk muat turun atau kongsi aplikasi D-mart'}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>
                {isEn
                  ? 'Works on iOS, Android & Mobile Web'
                  : 'Sokongan iOS, Android & Pelayar Mudah Alih'}
              </span>
            </p>
          </div>

          {/* Official Payload Link Box */}
          <div className="w-full max-w-[340px] p-2.5 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 pl-1">
              <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-mono font-medium text-gray-700 truncate">
                {OFFICIAL_APP_DOWNLOAD_URL}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-700" />
                  <span>{isEn ? 'Copied' : 'Disalin'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-emerald-700" />
                  <span>{isEn ? 'Copy' : 'Salin'}</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons: Share Link & Save QR Image */}
          <div className="w-full max-w-[340px] grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              id="qr-share-link-btn"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? (isEn ? 'Link Copied!' : 'Pautan Disalin!') : (isEn ? 'Share Link' : 'Kongsi Pautan')}</span>
            </button>

            <button
              type="button"
              id="qr-save-image-btn"
              onClick={handleSaveQR}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 active:scale-[0.98] text-emerald-900 font-bold text-xs border border-emerald-300 shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>{savedSuccess ? (isEn ? 'Saved PNG!' : 'Disimpan!') : (isEn ? 'Save QR Image' : 'Simpan Imej QR')}</span>
            </button>
          </div>

          {/* Benefits summary badge */}
          <div className="w-full max-w-[340px] p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-2.5 text-left text-xs text-emerald-950">
            <Users className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="leading-tight">
              <span className="font-bold block">
                {isEn ? 'Invite Friends & Neighbours' : 'Jemput Rakan & Jiran'}
              </span>
              <span className="text-[11px] text-emerald-800">
                {isEn
                  ? 'Help your community get fresh groceries delivered in 30 mins.'
                  : 'Bantu komuniti anda menikmati barangan segar dihantar dalam 30 minit.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-5">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEn ? 'Official D-mart Portal' : 'Portal Rasmi D-mart'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-gray-700 hover:text-emerald-700 cursor-pointer"
          >
            {isEn ? 'Close' : 'Tutup'}
          </button>
        </div>
      </div>
    </div>
  );
};
