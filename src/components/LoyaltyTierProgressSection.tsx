import React, { useRef } from 'react';
import {
  Award,
  Crown,
  ShieldCheck,
  Sparkles,
  Truck,
  Ticket,
  Clock,
  Gift,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Language } from '../types';
import {
  getAllLoyaltyTiers,
  getLoyaltyTier,
  calculateTierProgress,
  LoyaltyTier,
  TierFeaturePill,
} from '../utils/loyaltyTiers';

interface LoyaltyTierProgressSectionProps {
  points?: number;
  language?: Language;
  showCards?: boolean;
  className?: string;
  onExploreTiersClick?: () => void;
}

export const LoyaltyTierProgressSection: React.FC<LoyaltyTierProgressSectionProps> = ({
  points = 0,
  language = 'en',
  showCards = true,
  className = '',
}) => {
  const isEn = language === 'en';
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    currentTier,
    nextTier,
    percentageInTier,
    pointsNeeded,
  } = calculateTierProgress(points);

  const allTiers = getAllLoyaltyTiers();

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 260;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const renderTierIcon = (tierId: string, className = 'w-4 h-4') => {
    switch (tierId) {
      case 'platinum':
        return <Crown className={`${className} text-indigo-500 fill-indigo-200`} />;
      case 'gold':
        return <Crown className={`${className} text-amber-500 fill-amber-300`} />;
      case 'silver':
        return <ShieldCheck className={`${className} text-slate-500 fill-slate-200`} />;
      case 'bronze':
      default:
        return <Award className={`${className} text-orange-600 fill-orange-200`} />;
    }
  };

  const renderPillIcon = (iconType: TierFeaturePill['iconType']) => {
    switch (iconType) {
      case 'truck':
        return <Truck className="w-3 h-3 text-emerald-600 shrink-0" />;
      case 'sparkles':
        return <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />;
      case 'ticket':
        return <Ticket className="w-3 h-3 text-purple-600 shrink-0" />;
      case 'clock':
        return <Clock className="w-3 h-3 text-blue-600 shrink-0" />;
      case 'gift':
      default:
        return <Gift className="w-3 h-3 text-rose-500 shrink-0" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Sleek Tier Progress Bar Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-900 via-slate-900 to-emerald-950 text-white shadow-md border border-gray-800 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Current Tier Header & Status */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                {isEn ? 'Membership Status' : 'Status Keahlian'}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Zap className="w-2.5 h-2.5 fill-amber-300" />
                {currentTier.multiplierText}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/15 shadow-2xs">
                {renderTierIcon(currentTier.id, 'w-4 h-4')}
              </div>
              <h4 className="text-base sm:text-lg font-black tracking-tight text-white">
                {isEn ? `${currentTier.name.en} Member` : `Ahli ${currentTier.name.ms}`}
              </h4>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-400 block font-semibold">
              {isEn ? 'Total Points' : 'Jumlah Mata'}
            </span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black text-amber-400 leading-none">
                {points}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase">
                {isEn ? 'PTS' : 'MATA'}
              </span>
            </div>
          </div>
        </div>

        {/* Next Tier Target & Points Needed */}
        <div className="mt-3.5 pt-3 border-t border-gray-800/80 relative z-10">
          <div className="flex items-center justify-between text-xs mb-1.5 flex-wrap gap-1">
            {nextTier ? (
              <>
                <span className="text-gray-300 text-[11px] font-medium flex items-center gap-1">
                  <span>{isEn ? 'Next Milestone:' : 'Sasaran Seterusnya:'}</span>
                  <strong className="text-white font-bold inline-flex items-center gap-1">
                    {renderTierIcon(nextTier.id, 'w-3 h-3')}
                    {isEn ? nextTier.name.en : nextTier.name.ms}
                  </strong>
                  <span className="text-amber-400 font-bold">({nextTier.multiplierText})</span>
                </span>
                <span className="text-[11px] font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/40">
                  {isEn ? `${pointsNeeded} pts needed` : `${pointsNeeded} mata lagi`}
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                <Crown className="w-3.5 h-3.5 fill-amber-300" />
                <span>{isEn ? 'Top Tier Achieved! Maximum 2.0x Benefits Unlocked' : 'Tahap Tertinggi Dicapai! Faedah 2.0x Aktif'}</span>
              </div>
            )}
          </div>

          {/* Progress Track */}
          <div className="relative w-full bg-gray-800/90 rounded-full h-2.5 overflow-hidden border border-gray-700/50 shadow-inner">
            <div
              className={`h-full bg-gradient-to-r ${currentTier.gradient} rounded-full transition-all duration-700 relative`}
              style={{ width: `${Math.max(8, percentageInTier)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>

          {/* Multi-Milestone Node Indicators */}
          <div className="flex justify-between items-center mt-2.5 px-1 text-[10px] text-gray-400 font-bold select-none">
            {allTiers.map((t) => {
              const isPastOrCurrent = points >= t.minPoints;
              const isCurrent = currentTier.id === t.id;
              return (
                <div
                  key={t.id}
                  className={`flex flex-col items-center gap-0.5 ${
                    isCurrent
                      ? 'text-amber-300 scale-105'
                      : isPastOrCurrent
                      ? 'text-gray-300'
                      : 'text-gray-500'
                  }`}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full border transition-all ${
                      isCurrent
                        ? 'bg-amber-400 border-white ring-2 ring-amber-400/40'
                        : isPastOrCurrent
                        ? 'bg-emerald-500 border-emerald-300'
                        : 'bg-gray-700 border-gray-600'
                    }`}
                  />
                  <span className="text-[9.5px] leading-tight">
                    {isEn ? t.name.en.split(' ')[0] : t.name.ms.split(' ')[0]}
                  </span>
                  <span className="text-[8.5px] opacity-75 font-normal">
                    {t.minPoints}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Tier Benefit Cards (Horizontal Scrollable with Snap & Action Buttons) */}
      {showCards && (
        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-600" />
                <span>{isEn ? 'Membership Tier Benefits' : 'Faedah Tahap Keahlian'}</span>
              </h4>
              <p className="text-[11px] text-gray-500">
                {isEn ? 'Swipe horizontally to compare tier perks' : 'Leret untuk bandingkan keistimewaan tahap'}
              </p>
            </div>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-6 h-6 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 px-0.5 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-200"
            style={{ scrollbarWidth: 'thin' }}
          >
            {allTiers.map((tier) => {
              const isCurrent = tier.id === currentTier.id;
              const isUnlocked = points >= tier.minPoints;

              return (
                <div
                  key={tier.id}
                  className={`w-64 sm:w-72 shrink-0 snap-start rounded-2xl p-4 flex flex-col justify-between border transition-all duration-200 ${
                    isCurrent
                      ? 'bg-gradient-to-b from-amber-50/90 via-white to-amber-50/40 border-amber-300 ring-2 ring-amber-400/30 shadow-md'
                      : isUnlocked
                      ? 'bg-white border-gray-200 shadow-2xs hover:border-gray-300'
                      : 'bg-gray-50/80 border-gray-200/90 opacity-90'
                  }`}
                >
                  {/* Card Header: Tier Badge & Tag */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-2xs border ${tier.badgeBg} ${tier.badgeBorder}`}>
                          {renderTierIcon(tier.id, 'w-3.5 h-3.5')}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-gray-900 leading-none">
                            {isEn ? tier.name.en : tier.name.ms}
                          </h5>
                          <span className="text-[10px] text-gray-400 font-semibold">
                            {tier.minPoints === 0 ? '0 - 249 pts' : tier.maxPoints ? `${tier.minPoints} - ${tier.maxPoints} pts` : `${tier.minPoints}+ pts`}
                          </span>
                        </div>
                      </div>

                      {/* Status Tag */}
                      {isCurrent ? (
                        <span className="text-[9px] font-black text-amber-950 bg-amber-300 px-2 py-0.5 rounded-full border border-amber-400 shadow-2xs uppercase tracking-tight">
                          {isEn ? 'Current Tier' : 'Tahap Anda'}
                        </span>
                      ) : isUnlocked ? (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                          {isEn ? 'Unlocked' : 'Dibuka'}
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-gray-500 bg-gray-200/80 px-1.5 py-0.5 rounded-full">
                          {isEn ? `${tier.minPoints - points} pts to unlock` : `${tier.minPoints - points} mata lagi`}
                        </span>
                      )}
                    </div>

                    {/* Multiplier Highlight Badge */}
                    <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 mb-3 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-700">
                        {isEn ? 'Point Multiplier:' : 'Pengganda Mata:'}
                      </span>
                      <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeText}`}>
                        {tier.multiplierText}
                      </span>
                    </div>

                    {/* Benefit Feature Pills */}
                    <div className="space-y-1.5 mb-3">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                        {isEn ? 'Key Benefits:' : 'Faedah Utama:'}
                      </span>
                      {tier.featurePills.map((pill, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-2 p-1.5 rounded-lg text-[11px] ${
                            pill.highlight
                              ? 'bg-amber-50/80 border border-amber-200/70 text-amber-950 font-bold'
                              : 'text-gray-700 bg-white border border-gray-100'
                          }`}
                        >
                          {renderPillIcon(pill.iconType)}
                          <span className="truncate">{pill.label[language]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Perks Bullet List */}
                    <div className="space-y-1 border-t border-gray-100 pt-2.5">
                      {tier.keyPerks[language].map((perk, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-[10.5px] text-gray-600 leading-snug">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom status indicator */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 text-center">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800">
                        <Check className="w-3.5 h-3.5 text-amber-600 stroke-[3]" />
                        <span>{isEn ? 'Active Benefits Applied' : 'Faedah Aktif Digunakan'}</span>
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-[11px] font-semibold text-emerald-700">
                        ✓ {isEn ? 'Eligible for all perks' : 'Layak semua keistimewaan'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                        <span>{isEn ? `Earn ${tier.minPoints - points} pts to unlock` : `Kumpul ${tier.minPoints - points} mata lagi`}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
