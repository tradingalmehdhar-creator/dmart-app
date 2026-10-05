import React, { useState, useRef, useEffect } from 'react';
import { Award, Crown, ShieldCheck, Sparkles, Info, Check, ArrowRight, X } from 'lucide-react';
import { Language } from '../types';
import { getLoyaltyTier, LoyaltyTier } from '../utils/loyaltyTiers';

interface LoyaltyTierBadgeProps {
  points?: number;
  language?: Language;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

export const LoyaltyTierBadge: React.FC<LoyaltyTierBadgeProps> = ({
  points = 0,
  language = 'en',
  size = 'md',
  showTooltip = true,
  className = '',
  onClick,
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tier: LoyaltyTier = getLoyaltyTier(points);
  const isEn = language === 'en';
  const tierName = isEn ? tier.name.en : tier.name.ms;

  // Handle click outside to close tooltip
  useEffect(() => {
    if (!isTooltipOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsTooltipOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTooltipOpen]);

  // Size specific styling
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[9px] gap-0.5 rounded-md',
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-lg',
    md: 'px-2.5 py-1 text-xs gap-1.5 rounded-xl',
    lg: 'px-3 py-1.5 text-sm gap-2 rounded-xl font-black',
  };

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  // Render tier icon
  const renderTierIcon = () => {
    switch (tier.id) {
      case 'platinum':
        return <Crown className={`${iconSizes[size]} ${tier.iconColor} fill-indigo-200 shrink-0`} />;
      case 'gold':
        return <Crown className={`${iconSizes[size]} ${tier.iconColor} fill-amber-300 shrink-0`} />;
      case 'silver':
        return <ShieldCheck className={`${iconSizes[size]} ${tier.iconColor} fill-slate-300 shrink-0`} />;
      case 'bronze':
      default:
        return <Award className={`${iconSizes[size]} ${tier.iconColor} fill-orange-200 shrink-0`} />;
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
    if (showTooltip) {
      e.stopPropagation();
      setIsTooltipOpen((prev) => !prev);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => showTooltip && setIsTooltipOpen(true)}
      onMouseLeave={() => showTooltip && setIsTooltipOpen(false)}
    >
      <button
        type="button"
        onClick={handleToggle}
        id={`loyalty-tier-badge-${tier.id}`}
        aria-label={`${tierName} Tier Benefits`}
        aria-expanded={isTooltipOpen}
        title={tier.benefitsSummary[language]}
        className={`inline-flex items-center font-black border shadow-2xs transition-all active:scale-95 cursor-pointer select-none whitespace-nowrap ${
          sizeClasses[size]
        } ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeText}`}
      >
        {renderTierIcon()}
        <span className="tracking-tight">{tierName}</span>
        {size !== 'xs' && (
          <span className="opacity-80 text-[8.5px] font-bold bg-white/70 px-1 py-0.2 rounded">
            {tier.multiplierText}
          </span>
        )}
        {showTooltip && (
          <Info className="w-2.5 h-2.5 opacity-60 hover:opacity-100 transition-opacity ml-0.5 shrink-0" />
        )}
      </button>

      {/* Floating Benefits Tooltip */}
      {showTooltip && isTooltipOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 bg-gray-900/95 text-white rounded-2xl shadow-xl backdrop-blur-md border border-gray-700/80 animate-in fade-in zoom-in-95 duration-150 text-left cursor-default select-text"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tooltip Arrow Pointer */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-gray-900 border-r border-b border-gray-700/80 rotate-45" />

          {/* Tooltip Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-800">
            <div className="flex items-center gap-1.5">
              <span className={`p-1 rounded-lg bg-gradient-to-r ${tier.gradient} text-white shadow-2xs`}>
                {renderTierIcon()}
              </span>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">
                  {tierName} {isEn ? 'Member Tier' : 'Tahap Ahli'}
                </span>
                <span className="text-[10px] text-amber-300 font-semibold block">
                  {tier.multiplierText} • {points} {isEn ? 'pts balance' : 'baki mata'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsTooltipOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Close tooltip"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Benefits Summary */}
          <p className="text-[11px] text-gray-300 mt-2 leading-relaxed">
            {tier.benefitsSummary[language]}
          </p>

          {/* Key Perks Bullets */}
          <div className="mt-2.5 space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              {isEn ? 'Current Tier Privileges:' : 'Keistimewaan Tahap Semasa:'}
            </span>
            {tier.keyPerks[language].map((perk, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[10.5px] text-gray-200 leading-snug">
                <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5 stroke-[2.5]" />
                <span>{perk}</span>
              </div>
            ))}
          </div>

          {/* Next Tier Progress Bar (if not at top tier) */}
          {tier.nextTier && (
            <div className="mt-3 pt-2.5 border-t border-gray-800">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-gray-400">
                  {isEn ? 'Next Tier:' : 'Tahap Seterusnya:'} <strong className="text-white">{isEn ? tier.nextTier.name.en : tier.nextTier.name.ms}</strong>
                </span>
                <span className="text-amber-300 font-bold">
                  {isEn ? `${tier.nextTier.pointsNeeded} pts to unlock` : `${tier.nextTier.pointsNeeded} mata lagi`}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${tier.gradient} rounded-full`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        10,
                        ((points - tier.minPoints) / ((tier.maxPoints || 1000) - tier.minPoints)) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
