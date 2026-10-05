import React, { useState } from 'react';
import { X, Sparkles, Award, ShoppingBag, ArrowRight, History, ShieldAlert, Check } from 'lucide-react';
import { Language, LoyaltyTransaction, GamificationBadge } from '../types';
import { LoyaltyTierBadge } from './LoyaltyTierBadge';
import { getLoyaltyTier } from '../utils/loyaltyTiers';
import { LoyaltyTierProgressSection } from './LoyaltyTierProgressSection';
import { LoyaltyHistoryView } from './LoyaltyHistoryView';
import { GamificationBadgesSection } from './GamificationBadgesSection';
import { INITIAL_LOYALTY_TRANSACTIONS } from '../utils/loyaltyTransactions';

interface LoyaltyPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  loyaltyPoints: number;
  onStartShopping?: () => void;
  initialTab?: 'tiers' | 'history' | 'badges';
  transactions?: LoyaltyTransaction[];
  badges?: GamificationBadge[];
  onViewOrder?: (orderReference: string) => void;
}

export const LoyaltyPointsModal: React.FC<LoyaltyPointsModalProps> = ({
  isOpen,
  onClose,
  language,
  loyaltyPoints,
  onStartShopping,
  initialTab = 'tiers',
  transactions = INITIAL_LOYALTY_TRANSACTIONS,
  badges = [],
  onViewOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'history' | 'badges'>(initialTab);

  if (!isOpen) return null;

  const isEn = language === 'en';
  const ringgitValue = (loyaltyPoints * 0.01).toFixed(2);
  const currentTier = getLoyaltyTier(loyaltyPoints);
  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md sm:max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 fill-amber-200 text-amber-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {isEn ? 'D-mart Loyalty & Rewards' : 'Ganjaran Kesetiaan D-mart'}
              </h3>
              <p className="text-xs text-amber-100">
                {isEn ? 'Earn points on every ringgit, redeem for instant discounts' : 'Kumpul mata setiap ringgit, tebus diskaun segera'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="bg-gray-100/90 border-b border-gray-200 p-1.5 flex items-center gap-1 shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'tiers'
                ? 'bg-white text-amber-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>{isEn ? 'Tiers & Benefits' : 'Tahap & Faedah'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-amber-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>{isEn ? 'Points History' : 'Sejarah Mata'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800">
              {transactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-white text-amber-950 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>{isEn ? 'Badges' : 'Lencana'}</span>
            {badges.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800">
                {unlockedBadgesCount}/{badges.length}
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Balance & Active Tier Card - Visible across all tabs for instant context */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border border-amber-300/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                  {isEn ? 'Available Points Balance' : 'Baki Mata Ganjaran Tersedia'}
                </span>
                <LoyaltyTierBadge
                  points={loyaltyPoints}
                  language={language}
                  size="sm"
                  showTooltip={true}
                />
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-black text-amber-950">{loyaltyPoints}</span>
                <span className="text-sm font-bold text-amber-700">{isEn ? 'pts' : 'mata'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-gray-500 font-semibold block">
                {isEn ? 'Cash Equivalent' : 'Nilai Tunai'}
              </span>
              <span className="text-xl font-black text-emerald-700 block mt-0.5">
                RM {ringgitValue}
              </span>
              <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full mt-1">
                {isEn ? '100 pts = RM 1.00' : '100 mata = RM 1.00'}
              </span>
            </div>
          </div>

          {/* TAB 1: Tiers & Benefits */}
          {activeTab === 'tiers' && (
            <div className="space-y-4">
              {/* 1. Sleek Tier Progress Bar & 2. Horizontal Scrollable Benefit Cards */}
              <LoyaltyTierProgressSection
                points={loyaltyPoints}
                language={language}
                showCards={true}
              />

              {/* How It Works Guide */}
              <div className="pt-2 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>{isEn ? 'How Points & Rewards Work' : 'Cara Mata & Ganjaran Berfungsi'}</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {isEn ? 'Earn on every purchase' : 'Kumpul setiap kali membeli'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {isEn
                          ? 'Get up to 2x points for every RM 1 spent based on your loyalty tier.'
                          : 'Dapatkan sehingga 2x mata bagi setiap RM 1 yang dibelanjakan mengikut tahap anda.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {isEn ? 'Instant checkout cash discount' : 'Tebus mudah semasa pembayaran'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {isEn
                          ? 'Toggle "Use Loyalty Points for Discount" during checkout to instantly reduce your payable total.'
                          : 'Aktifkan pilihan "Guna Mata Ganjaran untuk Diskaun" di skrin semakan untuk potongan segera.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {isEn ? 'Stackable vouchers & perks' : 'Boleh digabung bersama baucar'}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {isEn
                          ? 'Use your points together with store discount vouchers and free delivery offers.'
                          : 'Gunakan mata ganjaran anda bersama kod baucar diskaun dan promosi penghantaran percuma.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Loyalty Points History */}
          {activeTab === 'history' && (
            <LoyaltyHistoryView
              transactions={transactions}
              language={language}
              onViewOrder={onViewOrder}
            />
          )}

          {/* TAB 3: Gamification Badges */}
          {activeTab === 'badges' && (
            <GamificationBadgesSection
              badges={badges}
              language={language}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 font-semibold text-xs transition-colors cursor-pointer"
          >
            {isEn ? 'Close' : 'Tutup'}
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onStartShopping) onStartShopping();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{isEn ? 'Shop & Earn Points' : 'Beli & Kumpul Mata'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
