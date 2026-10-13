import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Globe, UserCheck, User, Store, Sparkles, Clock, Package, Heart, History, Bot, ScanBarcode, Menu, QrCode, Share2, Sliders, Bell } from 'lucide-react';
import { Language, UserProfile, DeliveryAddress, DeliveryPartnerApplication, PromoConfig, StorefrontCopySettings } from '../types';
import { translations } from '../data/translations';
import { getLoyaltyTier } from '../utils/loyaltyTiers';

interface NavbarProps {
  language: Language;
  onToggleLanguage: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  cartCount: number;
  deliveryAddress: DeliveryAddress;
  onOpenMapPicker: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  deliveryApplication?: DeliveryPartnerApplication | null;
  onRiderOrdersClick?: () => void;
  onOpenDeliveryRegistration?: () => void;
  onOpenDeliveryStatus?: () => void;
  onGoHome?: () => void;
  onOpenOrders?: () => void;
  onOpenOrderHistory?: () => void;
  activeOrderCount?: number;
  pastOrderCount?: number;
  currentView?: 'shop' | 'order_history' | 'admin';
  onReplaySplash?: () => void;
  favoritesCount?: number;
  showOnlyFavorites?: boolean;
  onToggleFavoritesFilter?: () => void;
  announcementBarConfig?: PromoConfig['announcementBar'];
  storefrontCopy?: StorefrontCopySettings;
  onOpenChatbot?: () => void;
  onOpenBarcodeScanner?: () => void;
  onOpenSideNav?: () => void;
  onOpenShareApp?: () => void;
  loyaltyPoints?: number;
  onOpenLoyaltyModal?: () => void;
  pointsNotification?: { id: number; points: number } | null;
  onOpenNotifications?: () => void;
  notificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onToggleLanguage,
  user,
  onOpenCart,
  cartCount,
  deliveryAddress,
  onOpenMapPicker,
  searchQuery,
  onSearchChange,
  deliveryApplication,
  onRiderOrdersClick,
  onOpenDeliveryRegistration,
  onOpenDeliveryStatus,
  onOpenAuth,
  onGoHome,
  onOpenOrders,
  onOpenOrderHistory,
  activeOrderCount = 0,
  pastOrderCount = 0,
  currentView = 'shop',
  onReplaySplash,
  favoritesCount = 0,
  showOnlyFavorites = false,
  onToggleFavoritesFilter,
  announcementBarConfig,
  storefrontCopy,
  onOpenChatbot,
  onOpenBarcodeScanner,
  onOpenSideNav,
  onOpenShareApp,
  loyaltyPoints = 150,
  onOpenLoyaltyModal,
  pointsNotification,
  onOpenNotifications,
  notificationCount = 0,
}) => {
  const t = translations[language];
  const currentTier = getLoyaltyTier(loyaltyPoints);
  const currentTierName = language === 'en' ? currentTier.name.en : currentTier.name.ms;

  // Subtle '+ points' animation trigger on item add
  const [animatingPoints, setAnimatingPoints] = useState<{ id: number; points: number } | null>(null);

  useEffect(() => {
    if (pointsNotification && pointsNotification.id) {
      setAnimatingPoints(pointsNotification);
      const timer = setTimeout(() => {
        setAnimatingPoints(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [pointsNotification]);
  const bannerText = storefrontCopy?.announcementBarText
    ? language === 'en'
      ? storefrontCopy.announcementBarText
      : (storefrontCopy.announcementBarTextMs || storefrontCopy.announcementBarText)
    : announcementBarConfig
    ? language === 'en'
      ? announcementBarConfig.textEn
      : announcementBarConfig.textMs
    : t.freeDeliveryBanner;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs w-full max-w-full">
      {/* Top Banner: flex layout with space-between on mobile & desktop */}
      {announcementBarConfig?.enabled !== false && (
        <div
          id="top-announcement-bar"
          className="w-full bg-emerald-600 text-white text-xs py-1 px-3 sm:px-4 font-medium border-b border-emerald-700/40"
          role="region"
          aria-label="Supermarket announcements"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 w-full">
            {/* Announcement banner text */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200 shrink-0 animate-pulse" />
              <span className="truncate text-[11px] sm:text-xs tracking-tight font-medium">
                {bannerText}
              </span>
            </div>

            {/* Desktop-only secondary badges and quick controls */}
            <div className="hidden md:flex items-center gap-2 text-emerald-100 shrink-0 ml-auto justify-end">
              <span className="whitespace-nowrap text-[11px]">{t.freshGuarantee}</span>
              {onReplaySplash && (
                <button
                  id="top-banner-splash-preview-btn"
                  type="button"
                  onClick={onReplaySplash}
                  aria-label={language === 'en' ? 'Preview App Splash Screen' : 'Lihat Skrin Pelancar Aplikasi'}
                  title={language === 'en' ? 'Preview App Splash Screen' : 'Lihat Skrin Pelancar'}
                  className="bg-emerald-700/80 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-emerald-500/50 shrink-0 whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                  <span>{language === 'en' ? 'Splash Preview' : 'Skrin Mula'}</span>
                </button>
              )}
              <span className="bg-emerald-700/60 px-1.5 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase whitespace-nowrap shrink-0">
                🇲🇾 MY
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 w-full">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 lg:gap-3 py-2 sm:py-2.5 w-full min-w-0">
          {/* Left on Mobile & Desktop: Hamburger Menu (≡) and Logo (D-mart) */}
          <div className="flex items-center shrink-0 gap-1 sm:gap-1.5">
            {/* Side Navigation Drawer Toggle Button (Hamburger ≡) */}
            {onOpenSideNav && (
              <button
                id="navbar-menu-drawer-btn"
                type="button"
                onClick={onOpenSideNav}
                aria-label={language === 'en' ? 'Open navigation drawer & menu' : 'Buka menu & laci navigasi'}
                title={language === 'en' ? 'Menu & Navigation' : 'Menu Navigasi'}
                className="p-1.5 rounded-xl text-emerald-900 hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-emerald-200/80 bg-emerald-50/70 shadow-2xs"
              >
                <Menu className="w-5 h-5 text-emerald-800" />
              </button>
            )}

            <button
              type="button"
              onClick={onGoHome}
              aria-label="D-mart Pasaraya - Home"
              title="D-mart Pasaraya - Home"
              className="flex items-center gap-1.5 sm:gap-2 shrink-0 text-left group transition-transform active:scale-95 cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 lg:w-9 lg:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-xs sm:shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Store className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-900 leading-none">
                  D<span className="text-emerald-500">-mart</span>
                </span>
                <span className="hidden xs:inline-block bg-emerald-100 text-emerald-800 text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-200 tracking-tight leading-none uppercase">
                  {storefrontCopy?.storeBadgeText || 'PASARAYA'}
                </span>
              </div>
            </button>
          </div>

          {/* Desktop & Tablet Navigation Buttons: Store, History, Track, Favorites */}
          <div
            id="top-nav-action-buttons-bar"
            className="hidden md:flex items-center flex-nowrap gap-1 lg:gap-1.5 shrink-0"
            role="toolbar"
            aria-label="Navigation controls"
          >
            {/* 1. Store / Shop Button */}
            <button
              id="top-nav-shop-btn"
              type="button"
              onClick={onGoHome}
              aria-label={language === 'en' ? 'Store - Browse Supermarket Products' : 'Pasaraya - Lihat Produk Pasaraya'}
              title={language === 'en' ? 'Store - Browse Products' : 'Pasaraya - Beli-belah'}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 md:px-2.5 lg:px-3 py-1.5 rounded-xl border font-bold text-xs shadow-2xs transition-all active:scale-95 shrink-0 whitespace-nowrap cursor-pointer touch-manipulation ${
                currentView === 'shop'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400/30'
                  : 'border-emerald-300/90 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-900'
              }`}
            >
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Store' : 'Pasaraya'}</span>
            </button>

            {/* 2. Order History Button */}
            {onOpenOrderHistory && (
              <button
                id="top-nav-history-btn"
                type="button"
                onClick={onOpenOrderHistory}
                aria-label={
                  language === 'en'
                    ? `Order History (${pastOrderCount} past orders)`
                    : `Sejarah Pesanan (${pastOrderCount} pesanan)`
                }
                title={language === 'en' ? 'Order History & Reorder' : 'Sejarah Pesanan & Beli Semula'}
                className={`flex items-center justify-center gap-1 sm:gap-1.5 px-2 md:px-2.5 lg:px-3 py-1.5 rounded-xl border font-bold text-xs shadow-2xs transition-all active:scale-95 relative shrink-0 whitespace-nowrap cursor-pointer touch-manipulation ${
                  currentView === 'order_history'
                    ? 'border-emerald-600 bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400/40'
                    : 'border-emerald-300/90 bg-white hover:bg-emerald-50 text-emerald-900'
                }`}
              >
                <History
                  className={`w-3.5 h-3.5 shrink-0 ${
                    currentView === 'order_history' ? 'text-white' : 'text-emerald-700'
                  }`}
                />
                <span>{language === 'en' ? 'History' : 'Sejarah'}</span>
                {pastOrderCount > 0 && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full leading-none border ${
                      currentView === 'order_history'
                        ? 'bg-emerald-900 text-emerald-100 border-emerald-500'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {pastOrderCount}
                  </span>
                )}
              </button>
            )}

            {/* 3. Active Live Orders Tracking Button */}
            <button
              id="top-nav-orders-btn"
              type="button"
              onClick={onOpenOrders}
              aria-label={
                language === 'en'
                  ? `Track Active Orders (${activeOrderCount} active orders)`
                  : `Jejak Pesanan Aktif (${activeOrderCount} pesanan aktif)`
              }
              title={language === 'en' ? 'Live Order Tracking' : 'Jejak Pesanan Langsung'}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 md:px-2.5 lg:px-3 py-1.5 rounded-xl border border-emerald-300/90 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs shadow-2xs transition-all active:scale-95 relative shrink-0 whitespace-nowrap cursor-pointer touch-manipulation"
            >
              <Package className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{language === 'en' ? 'Track' : 'Jejak'}</span>
              {activeOrderCount > 0 && (
                <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full leading-none animate-pulse">
                  {activeOrderCount}
                </span>
              )}
            </button>

            {/* Real-time Order Alerts & Push Notifications Bell Button */}
            {onOpenNotifications && (
              <button
                id="top-nav-notifications-btn"
                type="button"
                onClick={onOpenNotifications}
                aria-label={
                  language === 'en'
                    ? `Order Alerts & Notifications (${notificationCount} alerts)`
                    : `Pemberitahuan Pesanan (${notificationCount} amaran)`
                }
                title={language === 'en' ? 'Order Alerts & Push Notifications' : 'Pemberitahuan Pesanan & Amaran'}
                className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 md:px-2.5 lg:px-3 py-1.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-900 font-bold text-xs shadow-2xs transition-all active:scale-95 relative shrink-0 whitespace-nowrap cursor-pointer touch-manipulation"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="hidden sm:inline">{language === 'en' ? 'Alerts' : 'Amaran'}</span>
                {notificationCount > 0 && (
                  <span className="bg-amber-500 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full leading-none animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* 4. Favorites Quick Filter Button */}
            {onToggleFavoritesFilter && (
              <button
                id="navbar-favorites-button"
                onClick={onToggleFavoritesFilter}
                type="button"
                aria-label={
                  language === 'en'
                    ? `Favorites & Wishlist (${favoritesCount} items)`
                    : `Barangan Kegemaran (${favoritesCount} barangan)`
                }
                title={language === 'en' ? 'Favorites & Wishlist' : 'Barangan Kegemaran'}
                className={`relative flex items-center justify-center gap-1 sm:gap-1.5 px-2 md:px-2.5 lg:px-3 py-1.5 rounded-xl font-bold text-xs shadow-2xs transition-all active:scale-95 shrink-0 whitespace-nowrap border cursor-pointer touch-manipulation ${
                  showOnlyFavorites
                    ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400/30 shadow-xs'
                    : 'bg-rose-50/80 hover:bg-rose-100/90 text-rose-800 border-rose-200'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 shrink-0 ${
                    showOnlyFavorites
                      ? 'fill-white text-white'
                      : favoritesCount > 0
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-rose-600'
                  }`}
                />
                <span>{t.favorites}</span>
                {favoritesCount > 0 && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.2 rounded-full leading-none shadow-xs ${
                      showOnlyFavorites
                        ? 'bg-white text-rose-700'
                        : 'bg-rose-200 text-rose-900'
                    }`}
                  >
                    {favoritesCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Desktop Search Bar (visible on lg: 1024px+; on tablet md & mobile, search is cleanly stacked in sub-header to guarantee zero overcrowding) */}
          <div className="hidden lg:block flex-1 min-w-[90px] max-w-xs xl:max-w-md 2xl:max-w-lg relative mx-1.5 lg:mx-2 shrink">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-20 xl:pr-24 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 text-xs text-gray-900 placeholder:text-gray-400 outline-none transition-all shadow-2xs"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    aria-label="Clear search"
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
                {onOpenBarcodeScanner && (
                  <button
                    type="button"
                    id="desktop-search-barcode-btn"
                    onClick={onOpenBarcodeScanner}
                    title={t.scanBarcode}
                    aria-label={t.scanBarcode}
                    className="flex items-center gap-1 p-1 lg:px-1.5 xl:px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <ScanBarcode className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-[11px] hidden xl:inline">{language === 'ms' ? 'Imbas' : 'Scan'}</span>
                  </button>
                )}
                {onOpenChatbot && (
                  <button
                    type="button"
                    id="desktop-search-ai-btn"
                    onClick={onOpenChatbot}
                    aria-label={language === 'en' ? 'Open D-mart AI Assistant' : 'Buka Pembantu AI D-mart'}
                    title={language === 'en' ? 'D-mart AI Assistant (Gemini)' : 'Pembantu AI D-mart (Gemini)'}
                    className="flex items-center justify-center gap-1 px-1.5 xl:px-2 py-1 rounded-lg border border-emerald-400 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                    <span className="text-[11px]">AI</span>
                    <Sparkles className="w-2 h-2 text-amber-300 animate-pulse" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right on Mobile, Tablet & Desktop: Essential Controls (PTS Badge, Cart, Profile, and Language) */}
          <div
            id="top-header-right-controls"
            className="flex items-center shrink-0 gap-1 sm:gap-1.5 lg:gap-2 ml-auto lg:ml-0"
          >
            {/* Loyalty Points Balance Badge with floating '+ points' animation (visible across all breakpoints: mobile, tablet, desktop) */}
            <div className="relative inline-flex items-center shrink-0">
              <button
                id="top-header-loyalty-badge"
                type="button"
                onClick={onOpenLoyaltyModal || onOpenAuth}
                aria-label={
                  language === 'en'
                    ? `Loyalty Points: ${loyaltyPoints} PTS`
                    : `Mata Ganjaran: ${loyaltyPoints} MATA`
                }
                title={
                  language === 'en'
                    ? `${currentTierName} Tier: ${loyaltyPoints} PTS (RM ${(loyaltyPoints * 0.01).toFixed(2)}) - ${currentTier.benefitsSummary.en}`
                    : `Tahap ${currentTierName}: ${loyaltyPoints} MATA (Nilai RM ${(loyaltyPoints * 0.01).toFixed(2)}) - ${currentTier.benefitsSummary.ms}`
                }
                className={`relative flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 to-amber-100/80 hover:from-amber-100 hover:to-amber-200/90 text-amber-950 font-black text-xs shadow-2xs transition-all active:scale-95 shrink-0 whitespace-nowrap cursor-pointer select-none ${
                  animatingPoints ? 'animate-badge-glow ring-2 ring-amber-400' : ''
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500 shrink-0" />
                <span className="font-black text-amber-950 text-xs sm:text-xs tracking-tight leading-none">
                  {loyaltyPoints}
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-black text-amber-800 uppercase tracking-tight leading-none">
                  {language === 'en' ? 'PTS' : 'MATA'}
                </span>
              </button>

              {/* Floating '+ points' CSS Animation Bubble on Item Add */}
              {animatingPoints && (
                <div
                  key={`points-pop-${animatingPoints.id}`}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-points-pop"
                >
                  <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-amber-950 font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full shadow-md border border-white/70 tracking-tight whitespace-nowrap">
                    <Sparkles className="w-2.5 h-2.5 fill-amber-950 text-amber-950 shrink-0" />
                    <span>+{animatingPoints.points} {language === 'en' ? 'PTS' : 'MATA'}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Shopping Cart Button with Dynamic Item Count - directly adjacent to Points Badge */}
            <button
              id="navbar-cart-button"
              onClick={onOpenCart}
              type="button"
              aria-label={
                language === 'en'
                  ? `Shopping Cart (${cartCount} items)`
                  : `Troli Beli-belah (${cartCount} barangan)`
              }
              title={language === 'en' ? 'Shopping Cart' : 'Troli Beli-belah'}
              className="relative flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 shrink-0 whitespace-nowrap cursor-pointer px-2 sm:px-2.5 lg:px-3 py-1.5 gap-1 sm:gap-1.5"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline font-bold">{language === 'en' ? 'Cart' : 'Troli'}</span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none ${
                  cartCount > 0
                    ? 'bg-amber-400 text-emerald-950 ring-1 ring-white/60 animate-pulse'
                    : 'bg-emerald-800 text-emerald-100'
                }`}
              >
                {cartCount}
              </span>
            </button>

            {/* Profile / Account Login Button (Desktop & Tablet view shows name, mobile keeps it in hamburger menu) */}
            <div className="hidden md:flex items-center shrink-0">
              {user?.isLoggedIn ? (
                <button
                  id="navbar-profile-button"
                  onClick={onOpenAuth}
                  type="button"
                  aria-label={user.name}
                  title={`${user.name} (${currentTierName} Tier) • ${loyaltyPoints} ${language === 'en' ? 'PTS' : 'MATA'}`}
                  className="flex items-center justify-center rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer px-2 sm:px-2.5 py-1.5 gap-1.5"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-5 h-5 rounded-full border border-emerald-300 object-cover"
                    />
                  ) : (
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                  )}
                  <span className="text-xs font-bold max-w-[65px] lg:max-w-[85px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  id="navbar-profile-button"
                  onClick={onOpenAuth}
                  type="button"
                  aria-label={language === 'en' ? 'User Profile & Sign In' : 'Profil Pengguna & Log Masuk'}
                  title={language === 'en' ? 'User Profile & Sign In' : 'Profil Pengguna & Log Masuk'}
                  className="flex items-center justify-center rounded-xl bg-white hover:bg-gray-50 border border-gray-300 hover:border-emerald-300 text-gray-800 text-xs font-bold shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer px-2 sm:px-2.5 py-1.5 gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27A7.06 7.06 0 0 1 4.9 12c0-.79.14-1.56.38-2.27V6.58H1.26A11.967 11.967 0 0 0 0 12c0 1.92.45 3.74 1.26 5.42l4.02-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-xs font-bold whitespace-nowrap">
                    {language === 'en' ? 'Sign In' : 'Log Masuk'}
                  </span>
                </button>
              )}
            </div>

            {/* Language Selector Button (BM / EN) */}
            <button
              id="navbar-bm-button"
              onClick={onToggleLanguage}
              type="button"
              aria-label={
                language === 'en'
                  ? 'Switch language to Bahasa Malaysia (BM)'
                  : 'Tukar bahasa ke English (EN)'
              }
              title={
                language === 'en'
                  ? 'Switch to Bahasa Malaysia (BM)'
                  : 'Tukar ke English (EN)'
              }
              className="flex items-center justify-center rounded-xl border border-emerald-300 hover:border-emerald-500 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-900 font-black text-xs shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer px-2 sm:px-2.5 py-1.5 gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="tracking-wide uppercase text-xs font-black">
                {language === 'en' ? 'BM' : 'EN'}
              </span>
            </button>
          </div>
        </div>

        {/* Clean Sub-Header on Mobile & Tablet: Cleanly Stacked Full-Width Search Bar with Barcode Scanner & AI Assistant */}
        <div className="block lg:hidden pb-2.5 pt-0.5 w-full">
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="w-full pl-9 pr-24 py-2 rounded-xl bg-gray-50 hover:bg-gray-100/90 focus:bg-white border border-gray-200 focus:border-emerald-500 text-xs text-gray-900 placeholder:text-gray-400 outline-none shadow-2xs transition-colors"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search query"
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 cursor-pointer"
                >
                  ✕
                </button>
              )}
              {onOpenBarcodeScanner && (
                <button
                  type="button"
                  id="mobile-search-barcode-btn"
                  onClick={onOpenBarcodeScanner}
                  title={t.scanBarcode}
                  aria-label={t.scanBarcode}
                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-2xs"
                >
                  <ScanBarcode className="w-3.5 h-3.5 text-emerald-700" />
                </button>
              )}
              {onOpenChatbot && (
                <button
                  type="button"
                  id="mobile-search-ai-btn"
                  onClick={onOpenChatbot}
                  aria-label={language === 'en' ? 'Open D-mart AI Assistant' : 'Buka Pembantu AI D-mart'}
                  title={language === 'en' ? 'D-mart AI Assistant (Gemini)' : 'Pembantu AI D-mart (Gemini)'}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-emerald-400 bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                  <span>AI</span>
                  <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
