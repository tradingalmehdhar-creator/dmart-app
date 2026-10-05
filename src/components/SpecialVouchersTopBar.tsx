import React, { useState, useEffect, useRef } from 'react';
import {
  Ticket,
  Clock,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  Flame,
  Tag,
  ShoppingBag
} from 'lucide-react';
import { Voucher, Language } from '../types';
import { AVAILABLE_VOUCHERS } from '../data/vouchers';

interface SpecialVouchersTopBarProps {
  language: Language;
  activeVoucherCode: string;
  cartSubtotal: number;
  onApplyVoucher: (code: string) => { success: boolean; message: string };
  onOpenCart?: () => void;
  vouchers?: Voucher[];
}

export const SpecialVouchersTopBar: React.FC<SpecialVouchersTopBarProps> = ({
  language,
  activeVoucherCode,
  cartSubtotal,
  onApplyVoucher,
  onOpenCart,
  vouchers,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const voucherList = vouchers && vouchers.length > 0 ? vouchers : AVAILABLE_VOUCHERS;

  // Touch & Pointer Drag State for effortless scrolling
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    // reset after small delay so click handlers can check if dragged
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 50);
  };

  // Live countdown timer to midnight
  const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
    hours: '08',
    minutes: '45',
    seconds: '12',
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = Math.max(0, midnight.getTime() - now.getTime());

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        hours: h.toString().padStart(2, '0'),
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0'),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = (voucher: Voucher) => {
    if (hasMovedRef.current) return;
    const result = onApplyVoucher(voucher.code);
    setToastMessage(result.message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMovedRef.current) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const isEn = language === 'en';

  const themeStyles = {
    emerald: {
      cardBg: 'bg-gradient-to-r from-emerald-600 to-teal-700',
      border: 'border-emerald-400/40',
      btn: 'bg-white text-emerald-950 hover:bg-emerald-50',
      appliedRing: 'ring-2 ring-amber-300 shadow-md',
      notchBg: 'bg-emerald-950',
    },
    blue: {
      cardBg: 'bg-gradient-to-r from-sky-600 to-blue-700',
      border: 'border-sky-400/40',
      btn: 'bg-white text-blue-950 hover:bg-sky-50',
      appliedRing: 'ring-2 ring-amber-300 shadow-md',
      notchBg: 'bg-emerald-950',
    },
    amber: {
      cardBg: 'bg-gradient-to-r from-amber-600 to-orange-600',
      border: 'border-amber-400/40',
      btn: 'bg-white text-amber-950 hover:bg-amber-50',
      appliedRing: 'ring-2 ring-amber-300 shadow-md',
      notchBg: 'bg-emerald-950',
    },
    rose: {
      cardBg: 'bg-gradient-to-r from-rose-600 to-red-700',
      border: 'border-rose-400/40',
      btn: 'bg-white text-rose-950 hover:bg-rose-50',
      appliedRing: 'ring-2 ring-amber-300 shadow-md',
      notchBg: 'bg-emerald-950',
    },
    purple: {
      cardBg: 'bg-gradient-to-r from-purple-600 to-indigo-700',
      border: 'border-purple-400/40',
      btn: 'bg-white text-purple-950 hover:bg-purple-50',
      appliedRing: 'ring-2 ring-amber-300 shadow-md',
      notchBg: 'bg-emerald-950',
    },
  };

  return (
    <section className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white py-2 sm:py-2.5 border-b border-emerald-800/80 shadow-xs relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        {/* Compact Header & Row Toolbar */}
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-amber-400 text-emerald-950 flex items-center justify-center font-bold shrink-0">
              <Ticket className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold tracking-tight text-white sm:text-sm flex items-center gap-1.5">
              <span>{isEn ? 'Special Vouchers' : 'Baucar Khas'}</span>
              <Flame className="w-3.5 h-3.5 text-amber-400 hidden xs:inline" />
            </span>
            <span className="hidden md:inline text-[11px] text-emerald-300">
              {isEn ? '• Tap Claim to apply savings' : '• Tekan Tuntut untuk jimat'}
            </span>
          </div>

          {/* Right side: Countdown clock */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-emerald-200 bg-black/30 px-2 py-0.5 rounded-md border border-white/10 font-mono">
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">{isEn ? 'Ends in:' : 'Tamat:'}</span>
              <span className="text-white font-bold">{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}</span>
            </div>

            {/* Desktop scroll arrows */}
            <div className="hidden lg:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Smaller Horizontal Row of Voucher Cards (Smooth Horizontal Scroll & Snap Touch Drag) */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          className="flex items-center gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide no-scrollbar py-1.5 scroll-smooth touch-pan-x overscroll-x-contain cursor-grab active:cursor-grabbing w-full max-w-full select-none"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {voucherList.map((voucher) => {
            const isApplied = activeVoucherCode === voucher.code;
            const title = isEn ? voucher.titleEn : voucher.titleMs;
            const theme = themeStyles[voucher.colorTheme] || themeStyles.emerald;

            return (
              <div
                key={voucher.code}
                className={`snap-start h-[58px] min-w-[220px] sm:min-w-[245px] max-w-[260px] rounded-xl ${theme.cardBg} ${theme.border} border shadow-xs flex items-center justify-between px-2.5 relative overflow-hidden transition-all shrink-0 select-none ${
                  isApplied ? theme.appliedRing : 'hover:brightness-105'
                }`}
              >
                {/* Micro Ticket Cutout Notches */}
                <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${theme.notchBg} border-r border-white/20`} />
                <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${theme.notchBg} border-l border-white/20`} />

                {/* Left details */}
                <div className="flex-1 min-w-0 pr-1.5">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="text-xs sm:text-[13px] font-black tracking-tight text-white truncate">
                      {title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-emerald-100 font-medium truncate">
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(voucher.code, e)}
                      title={isEn ? 'Copy code' : 'Salin kod'}
                      className="inline-flex items-center gap-0.5 font-mono font-bold bg-black/25 hover:bg-black/40 text-amber-300 px-1.5 py-0.5 rounded text-[9.5px] border border-white/10"
                    >
                      <span>{voucher.code}</span>
                      {copiedCode === voucher.code ? (
                        <Check className="w-2.5 h-2.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-white/50" />
                      )}
                    </button>
                    <span className="text-[9.5px] opacity-85">
                      Min RM{voucher.minSpend}
                    </span>
                  </div>
                </div>

                {/* Dashed vertical separator */}
                <div className="h-7 border-r border-dashed border-white/30 mr-2 shrink-0" />

                {/* Right Action Button */}
                <button
                  type="button"
                  onClick={() => handleClaim(voucher)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold shrink-0 transition-all active:scale-95 shadow-xs ${
                    isApplied
                      ? 'bg-amber-400 text-emerald-950 font-black'
                      : theme.btn
                  }`}
                >
                  {isApplied ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span className="hidden xs:inline">{isEn ? 'Applied' : 'Aktif'}</span>
                    </span>
                  ) : (
                    <span>{isEn ? 'Claim' : 'Tuntut'}</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Active Applied Voucher Inline Chip (Compact) */}
        {activeVoucherCode && (
          <div className="mt-1.5 bg-black/25 border border-emerald-500/30 rounded-lg py-1 px-2.5 flex items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-emerald-200 font-medium">
                {isEn ? 'Applied:' : 'Digunakan:'}
              </span>
              <strong className="text-amber-300 font-mono font-bold">
                {activeVoucherCode}
              </strong>
              <span className="text-white/80 hidden sm:inline">
                {isEn ? 'discount active on cart' : 'diskaun aktif dalam troli'}
              </span>
            </div>

            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="text-[11px] font-bold text-amber-300 hover:text-amber-200 underline flex items-center gap-1 shrink-0 ml-auto"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>{isEn ? 'Cart →' : 'Troli →'}</span>
              </button>
            )}
          </div>
        )}

        {/* Toast confirmation */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white border border-emerald-400 px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
            <span className="text-amber-400 font-bold">🎉</span>
            <span className="font-semibold text-emerald-100">{toastMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
};
