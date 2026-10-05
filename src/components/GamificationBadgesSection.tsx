import React, { useState } from 'react';
import {
  ShoppingBag,
  Leaf,
  Award,
  Tag,
  Crown,
  Star,
  Clock,
  Lock,
  CheckCircle2,
  Sparkles,
  Info,
  Gift,
  ChevronRight,
  X,
} from 'lucide-react';
import { GamificationBadge, Language } from '../types';

interface GamificationBadgesSectionProps {
  badges: GamificationBadge[];
  language: Language;
  onBadgeClick?: (badge: GamificationBadge) => void;
  compact?: boolean;
}

export const GamificationBadgesSection: React.FC<GamificationBadgesSectionProps> = ({
  badges,
  language,
  onBadgeClick,
  compact = false,
}) => {
  const isEn = language === 'en';
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedBadge, setSelectedBadge] = useState<GamificationBadge | null>(null);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount = badges.length;
  const unlockPercentage = Math.round((unlockedCount / totalCount) * 100);

  const filteredBadges = badges.filter((b) => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  });

  const getBadgeIcon = (icon: GamificationBadge['icon'], className: string) => {
    switch (icon) {
      case 'shopping-bag':
        return <ShoppingBag className={className} />;
      case 'leaf':
        return <Leaf className={className} />;
      case 'award':
        return <Award className={className} />;
      case 'tag':
        return <Tag className={className} />;
      case 'crown':
        return <Crown className={className} />;
      case 'star':
        return <Star className={className} />;
      case 'clock':
        return <Clock className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  const getColorClasses = (scheme: GamificationBadge['colorScheme'], unlocked: boolean) => {
    if (!unlocked) {
      return {
        cardBg: 'bg-gray-50/80 border-gray-200/80 hover:border-gray-300',
        iconBg: 'bg-gray-200 text-gray-400',
        badgePill: 'bg-gray-100 text-gray-500 border-gray-200',
        title: 'text-gray-600',
        progressFill: 'bg-gray-400',
      };
    }

    switch (scheme) {
      case 'emerald':
        return {
          cardBg: 'bg-gradient-to-br from-emerald-50/90 to-teal-50/50 border-emerald-200 hover:border-emerald-300 shadow-2xs',
          iconBg: 'bg-emerald-500 text-white shadow-emerald-200 shadow-xs',
          badgePill: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          title: 'text-emerald-950 font-bold',
          progressFill: 'bg-emerald-500',
        };
      case 'purple':
        return {
          cardBg: 'bg-gradient-to-br from-purple-50/90 to-indigo-50/50 border-purple-200 hover:border-purple-300 shadow-2xs',
          iconBg: 'bg-purple-600 text-white shadow-purple-200 shadow-xs',
          badgePill: 'bg-purple-100 text-purple-800 border-purple-300',
          title: 'text-purple-950 font-bold',
          progressFill: 'bg-purple-600',
        };
      case 'blue':
        return {
          cardBg: 'bg-gradient-to-br from-blue-50/90 to-sky-50/50 border-blue-200 hover:border-blue-300 shadow-2xs',
          iconBg: 'bg-blue-600 text-white shadow-blue-200 shadow-xs',
          badgePill: 'bg-blue-100 text-blue-800 border-blue-300',
          title: 'text-blue-950 font-bold',
          progressFill: 'bg-blue-600',
        };
      case 'rose':
        return {
          cardBg: 'bg-gradient-to-br from-rose-50/90 to-pink-50/50 border-rose-200 hover:border-rose-300 shadow-2xs',
          iconBg: 'bg-rose-500 text-white shadow-rose-200 shadow-xs',
          badgePill: 'bg-rose-100 text-rose-800 border-rose-300',
          title: 'text-rose-950 font-bold',
          progressFill: 'bg-rose-500',
        };
      case 'amber':
      default:
        return {
          cardBg: 'bg-gradient-to-br from-amber-50/90 to-yellow-50/50 border-amber-200 hover:border-amber-300 shadow-2xs',
          iconBg: 'bg-amber-500 text-white shadow-amber-200 shadow-xs',
          badgePill: 'bg-amber-100 text-amber-800 border-amber-300',
          title: 'text-amber-950 font-bold',
          progressFill: 'bg-amber-500',
        };
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with unlock progress counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-600 shrink-0" />
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">
              {isEn ? 'Achievement Badges & Quests' : 'Lencana Pencapaian & Misi'}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {unlockedCount}/{totalCount} {isEn ? 'Unlocked' : 'Dibuka'}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {isEn
              ? 'Complete grocery milestones to unlock badges and earn bonus loyalty perks'
              : 'Selesaikan misi belian untuk buka lencana dan ganjaran mata bonus'}
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 self-start sm:self-auto bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-[11px]">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {isEn ? 'All' : 'Semua'} ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unlocked')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
              filter === 'unlocked'
                ? 'bg-emerald-500 text-white shadow-2xs'
                : 'text-gray-500 hover:text-emerald-700'
            }`}
          >
            {isEn ? 'Unlocked' : 'Dibuka'} ({unlockedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('locked')}
            className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
              filter === 'locked'
                ? 'bg-gray-700 text-white shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {isEn ? 'In Progress' : 'Sedang Berjalan'} ({totalCount - unlockedCount})
          </button>
        </div>
      </div>

      {/* Progress Bar of Badges */}
      <div className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-100/90 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="w-4 h-4 fill-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-purple-950">
              {isEn ? 'Badge Mastery Progress' : 'Kemajuan Penguasaan Lencana'}
            </span>
            <span className="font-extrabold text-purple-700">{unlockPercentage}%</span>
          </div>
          <div className="w-full bg-purple-200/70 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${unlockPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid of Badges */}
      <div
        className={`grid gap-2.5 ${
          compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2'
        }`}
      >
        {filteredBadges.map((badge) => {
          const colors = getColorClasses(badge.colorScheme, badge.unlocked);
          const percent = Math.min(
            100,
            Math.round((badge.progressCurrent / badge.progressTarget) * 100)
          );

          return (
            <div
              key={badge.id}
              onClick={() => {
                setSelectedBadge(badge);
                if (onBadgeClick) onBadgeClick(badge);
              }}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${colors.cardBg}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${colors.iconBg}`}
                    >
                      {getBadgeIcon(badge.icon, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0">
                      <h5 className={`text-xs font-bold leading-tight truncate ${colors.title}`}>
                        {isEn ? badge.titleEn : badge.titleMs}
                      </h5>
                      <span className="text-[10px] text-gray-500 capitalize">
                        {isEn ? badge.category : badge.category}
                      </span>
                    </div>
                  </div>

                  {/* Unlock indicator badge */}
                  {badge.unlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{isEn ? 'Unlocked' : 'Dibuka'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 border border-gray-300 shrink-0">
                      <Lock className="w-3 h-3 text-gray-500" />
                      <span>{isEn ? 'Locked' : 'Terkunci'}</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed mb-2.5">
                  {isEn ? badge.descriptionEn : badge.descriptionMs}
                </p>
              </div>

              {/* Bottom status & progress */}
              <div className="pt-2 border-t border-gray-100/80 mt-auto">
                {badge.unlocked ? (
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {isEn ? `Earned: ${badge.unlockedAt || 'Recently'}` : `Dicapai: ${badge.unlockedAt || 'Baru ini'}`}
                    </span>
                    {badge.bonusPointsReward && (
                      <span className="font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded text-[10px]">
                        +{badge.bonusPointsReward} PTS
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span>
                        {isEn ? 'Requirement Progress' : 'Kemajuan Syarat'}
                      </span>
                      <span className="font-bold text-gray-700">
                        {badge.progressCurrent} / {badge.progressTarget}{' '}
                        {isEn ? badge.progressUnitEn : badge.progressUnitMs}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`${colors.progressFill} h-full rounded-full transition-all duration-300`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal / Popup */}
      {selectedBadge && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 relative">
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center pt-2">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-md ${
                  getColorClasses(selectedBadge.colorScheme, selectedBadge.unlocked).iconBg
                }`}
              >
                {getBadgeIcon(selectedBadge.icon, 'w-8 h-8')}
              </div>

              <div className="mb-2">
                {selectedBadge.unlocked ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 mb-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isEn ? 'Achievement Unlocked!' : 'Lencana Telah Dibuka!'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-300 mb-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-500" />
                    <span>{isEn ? 'Achievement In Progress' : 'Sedang Diusahakan'}</span>
                  </span>
                )}
              </div>

              <h4 className="text-base font-bold text-gray-900 mb-1">
                {isEn ? selectedBadge.titleEn : selectedBadge.titleMs}
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed mb-4 px-2">
                {isEn ? selectedBadge.descriptionEn : selectedBadge.descriptionMs}
              </p>

              {/* Progress & Reward stats */}
              <div className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2 mb-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">{isEn ? 'Milestone Progress' : 'Kemajuan Misi'}</span>
                  <span className="font-bold text-gray-800">
                    {selectedBadge.progressCurrent} / {selectedBadge.progressTarget}{' '}
                    {isEn ? selectedBadge.progressUnitEn : selectedBadge.progressUnitMs}
                  </span>
                </div>
                {selectedBadge.bonusPointsReward && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{isEn ? 'Bonus Points Reward' : 'Ganjaran Mata Bonus'}</span>
                    <span className="font-extrabold text-amber-700">
                      +{selectedBadge.bonusPointsReward} PTS
                    </span>
                  </div>
                )}
                {selectedBadge.unlocked && selectedBadge.unlockedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">{isEn ? 'Unlocked Date' : 'Tarikh Dibuka'}</span>
                    <span className="font-semibold text-emerald-700">{selectedBadge.unlockedAt}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedBadge(null)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {isEn ? 'Awesome, Got It!' : 'Faham & Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
