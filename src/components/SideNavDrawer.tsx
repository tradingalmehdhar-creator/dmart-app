import React from 'react';
import {
  X,
  Store,
  History,
  Package,
  Heart,
  Bot,
  Globe,
  UserCheck,
  User,
  Share2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Language, UserProfile, DeliveryPartnerApplication } from '../types';
import { QRCodeShareBanner } from './QRCodeShareBanner';
import { LoyaltyTierBadge } from './LoyaltyTierBadge';

interface SideNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onToggleLanguage: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  currentView: 'shop' | 'order_history' | 'admin';
  onGoHome: () => void;
  onOpenOrderHistory: () => void;
  onOpenOrders: () => void;
  activeOrderCount: number;
  pastOrderCount: number;
  favoritesCount: number;
  onToggleFavoritesFilter?: () => void;
  showOnlyFavorites?: boolean;
  deliveryApplication: DeliveryPartnerApplication | null;
  onRiderOrdersClick: () => void;
  onOpenChatbot?: () => void;
  onOpenShareApp: () => void;
  onReplaySplash?: () => void;
  onOpenAdminAuth?: () => void;
  storeBadgeText?: string;
  loyaltyPoints?: number;
  onOpenLoyaltyModal?: () => void;
}

export const SideNavDrawer: React.FC<SideNavDrawerProps> = ({
  isOpen,
  onClose,
  language,
  onToggleLanguage,
  user,
  onOpenAuth,
  currentView,
  onGoHome,
  onOpenOrderHistory,
  onOpenOrders,
  activeOrderCount,
  pastOrderCount,
  favoritesCount,
  onToggleFavoritesFilter,
  showOnlyFavorites,
  deliveryApplication,
  onRiderOrdersClick,
  onOpenChatbot,
  onOpenShareApp,
  onReplaySplash,
  onOpenAdminAuth,
  storeBadgeText,
  loyaltyPoints = 150,
  onOpenLoyaltyModal,
}) => {
  const isEn = language === 'en';

  if (!isOpen) return null;

  const isRiderApproved = deliveryApplication?.status === 'approved';
  const isRiderPending =
    deliveryApplication &&
    (deliveryApplication.status === 'pending' ||
      deliveryApplication.status === 'submitted_waiting_approval');

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        id="side-nav-drawer-panel"
        className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250"
      >
        {/* Top Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center font-black text-lg border border-white/20 shadow-xs">
              D
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-black text-lg tracking-tight">
                  D<span className="text-emerald-300">-mart</span>
                </span>
                <span className="bg-emerald-600/80 text-emerald-100 text-[8px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                  {storeBadgeText || 'PASARAYA'}
                </span>
              </div>
              <p className="text-[10px] text-emerald-200">
                {isEn ? 'Your Neighbourhood Supermarket' : 'Pasaraya Runcit Kejiranan'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Bar */}
        <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-2">
          {user?.isLoggedIn ? (
            <div
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-emerald-400 object-cover shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                  <LoyaltyTierBadge
                    points={loyaltyPoints}
                    language={language}
                    size="xs"
                    showTooltip={true}
                  />
                </div>
                <p className="text-[10px] text-emerald-700 truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="flex items-center gap-2 cursor-pointer flex-1"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-200 text-emerald-800 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-gray-900 block">
                  {isEn ? 'Welcome to D-mart' : 'Selamat Datang'}
                </span>
                <span className="text-[10px] text-emerald-700">
                  {isEn ? 'Tap to Sign In' : 'Ketik untuk Log Masuk'}
                </span>
              </div>
            </div>
          )}

          {/* Quick Language Toggle */}
          <button
            type="button"
            onClick={onToggleLanguage}
            className="px-2 py-1 rounded-lg border border-emerald-300 bg-white text-emerald-900 text-xs font-bold shadow-2xs hover:bg-emerald-50 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            title={isEn ? 'Switch to Bahasa Malaysia' : 'Tukar ke English'}
          >
            <Globe className="w-3 h-3 text-emerald-700" />
            <span className="uppercase text-[10px]">{language === 'en' ? 'BM' : 'EN'}</span>
          </button>
        </div>

        {/* Loyalty Points Balance Bar */}
        <div
          onClick={() => {
            onClose();
            if (onOpenLoyaltyModal) onOpenLoyaltyModal();
          }}
          className="px-3.5 py-2.5 bg-gradient-to-r from-amber-50/90 via-orange-50/80 to-amber-50/90 border-b border-amber-200/80 flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition-colors select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-amber-950 block leading-tight">
                  {isEn ? 'Loyalty Rewards' : 'Ganjaran Kesetiaan'}
                </span>
                <LoyaltyTierBadge
                  points={loyaltyPoints}
                  language={language}
                  size="xs"
                  showTooltip={true}
                />
              </div>
              <span className="text-[10px] text-amber-800 block truncate">
                {isEn ? `Worth RM ${(loyaltyPoints * 0.01).toFixed(2)} at checkout` : `Nilai RM ${(loyaltyPoints * 0.01).toFixed(2)} semasa bayaran`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-xs font-black text-amber-950 bg-amber-200/90 border border-amber-300 px-2 py-0.5 rounded-lg shadow-2xs">
              {loyaltyPoints} {isEn ? 'pts' : 'mata'}
            </span>
          </div>
        </div>

        {/* Navigation Menu Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-sm">
          {/* 1. Shop */}
          <button
            type="button"
            onClick={() => {
              onGoHome();
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
              currentView === 'shop'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <Store className="w-4 h-4 shrink-0" />
            <span className="flex-1">{isEn ? 'Shop Products' : 'Beli-belah Barangan'}</span>
          </button>

          {/* 2. Order History */}
          <button
            type="button"
            onClick={() => {
              onOpenOrderHistory();
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
              currentView === 'order_history'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 shrink-0" />
              <span>{isEn ? 'Order History & Reorder' : 'Sejarah Pesanan'}</span>
            </div>
            {pastOrderCount > 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.2 rounded-full">
                {pastOrderCount}
              </span>
            )}
          </button>

          {/* 3. Live Tracking */}
          <button
            type="button"
            onClick={() => {
              onOpenOrders();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 transition-all text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{isEn ? 'Track Active Orders' : 'Jejak Pesanan Aktif'}</span>
            </div>
            {activeOrderCount > 0 && (
              <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse">
                {activeOrderCount}
              </span>
            )}
          </button>

          {/* 4. Wishlist / Favorites */}
          {onToggleFavoritesFilter && (
            <button
              type="button"
              onClick={() => {
                onToggleFavoritesFilter();
                onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                showOnlyFavorites
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'text-gray-700 hover:bg-rose-50/60 hover:text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Heart
                  className={`w-4 h-4 shrink-0 ${
                    showOnlyFavorites
                      ? 'fill-rose-600 text-rose-600'
                      : favoritesCount > 0
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-rose-600'
                  }`}
                />
                <span>{isEn ? 'Saved Favorites' : 'Barangan Kegemaran'}</span>
              </div>
              {favoritesCount > 0 && (
                <span className="text-[10px] bg-rose-100 text-rose-800 font-black px-1.5 py-0.2 rounded-full">
                  {favoritesCount}
                </span>
              )}
            </button>
          )}

          {/* 5. AI Assistant */}
          {onOpenChatbot && (
            <button
              type="button"
              onClick={() => {
                onOpenChatbot();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-950 hover:bg-emerald-100 transition-all text-left border border-emerald-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{isEn ? 'D-mart AI Assistant' : 'Pembantu AI D-mart'}</span>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            </button>
          )}
        </div>

        {/* BOTTOM SECTION: Compact QR Code Banner labeled "Scan to Share D-mart" */}
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <QRCodeShareBanner
            language={language}
            variant="compact"
            onOpenFullModal={() => {
              onClose();
              onOpenShareApp();
            }}
          />
        </div>
      </div>
    </div>
  );
};
