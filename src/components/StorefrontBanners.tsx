import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  Store,
  Tag,
  LayoutGrid,
  Sliders,
  Play,
  Pause,
} from 'lucide-react';
import { MarketingBanner, Language, MainCategory } from '../types';
import { subscribeToStorefrontBanners } from '../firebase_config';

interface StorefrontBannersProps {
  language: Language;
  onSelectCategory: (category: MainCategory) => void;
  banners?: MarketingBanner[];
}

export const StorefrontBanners: React.FC<StorefrontBannersProps> = ({
  language,
  onSelectCategory,
  banners: propBanners,
}) => {
  const [banners, setBanners] = useState<MarketingBanner[]>(propBanners || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');
  const [isLoading, setIsLoading] = useState(!propBanners || propBanners.length === 0);

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const touchStartTimeRef = useRef<number>(0);
  const isMouseDownRef = useRef<boolean>(false);

  const isEn = language === 'en';
  const AUTOPLAY_INTERVAL = 3500; // 3.5 seconds auto-slide

  // Real-time synchronization with Firestore banners & storefront_banners collections
  useEffect(() => {
    if (propBanners && propBanners.length > 0) {
      setBanners(propBanners.filter((b) => b.isActive !== false));
      setIsLoading(false);
    }

    const unsubscribe = subscribeToStorefrontBanners((liveBanners) => {
      const activeOnly = liveBanners.filter((b) => b.isActive !== false);
      setBanners(activeOnly);
      setIsLoading(false);
      setCurrentIndex((prev) => (prev >= activeOnly.length ? 0 : prev));
    }, true);

    return () => {
      unsubscribe();
    };
  }, [propBanners]);

  // Navigate to Next slide (Infinite loop)
  const handleNext = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  // Navigate to Previous slide (Infinite loop)
  const handlePrev = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-play timer implementation: runs every 3.5s, pauses on hover or touch/drag
  useEffect(() => {
    if (viewMode !== 'carousel' || isHovered || isDragging || banners.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [banners.length, isHovered, isDragging, viewMode, handleNext]);

  // Banner click handler with category routing & smooth scroll
  const handleBannerClick = (banner: MarketingBanner) => {
    const rawTarget = banner.targetCategory || 'fresh_products';
    const validCats: MainCategory[] = [
      'all',
      'fresh_products',
      'daily_groceries',
      'snacks_and_drinks',
      'meats',
      'cleaning_products',
      'pet_foods',
    ];
    const target: MainCategory = validCats.includes(rawTarget as MainCategory)
      ? (rawTarget as MainCategory)
      : 'fresh_products';

    onSelectCategory(target);
    const targetElement = document.getElementById('product-catalog') || document.getElementById('supermarket-catalog-section');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (banners.length <= 1 || viewMode !== 'carousel') return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    touchStartTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || banners.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Detect horizontal vs vertical scroll on first significant movement
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      // Prevent default page scroll when swiping carousel horizontally
      setDragOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    const swipeThreshold = 45; // Pixels required to trigger slide change
    if (isHorizontalSwipeRef.current && Math.abs(dragOffset) > swipeThreshold) {
      if (dragOffset < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setDragOffset(0);
    setIsDragging(false);
    isHorizontalSwipeRef.current = null;
  };

  // Mouse drag handlers for desktop interactivity
  const handleMouseDown = (e: React.MouseEvent) => {
    if (banners.length <= 1 || viewMode !== 'carousel') return;
    isMouseDownRef.current = true;
    touchStartXRef.current = e.clientX;
    touchStartTimeRef.current = Date.now();
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || banners.length <= 1) return;
    const diffX = e.clientX - touchStartXRef.current;
    setDragOffset(diffX);
  };

  const handleMouseUp = (e: React.MouseEvent, banner: MarketingBanner) => {
    if (!isMouseDownRef.current) return;
    const dragDistance = Math.abs(dragOffset);
    const duration = Date.now() - touchStartTimeRef.current;
    isMouseDownRef.current = false;
    setIsDragging(false);

    if (dragDistance > 45) {
      if (dragOffset < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else if (dragDistance < 6 && duration < 300) {
      // Clean click detected without drag
      handleBannerClick(banner);
    }
    setDragOffset(0);
  };

  const handleMouseLeaveContainer = () => {
    setIsHovered(false);
    if (isMouseDownRef.current) {
      isMouseDownRef.current = false;
      setIsDragging(false);
      setDragOffset(0);
    }
  };

  const getCategoryBadgeLabel = (banner: MarketingBanner) => {
    // 1. Check if admin explicitly set a custom category / badge label
    const custom = banner.categoryLabel || (banner as any).category_label || (banner as any).target_category_label;
    if (custom && custom.trim()) {
      return custom.trim();
    }

    // 2. Target Category key
    const cat = banner.targetCategory || (banner as any).target_category;
    if (!cat) return '';

    switch (cat) {
      case 'fresh_products':
        return isEn ? 'Fresh Produce' : 'Sayur & Buah';
      case 'daily_groceries':
        return isEn ? 'Daily Groceries' : 'Runcit Harian';
      case 'snacks_and_drinks':
        return isEn ? 'Snacks & Drinks' : 'Minuman & Snek';
      case 'meats':
        return isEn ? 'Fresh Meats & Seafood' : 'Ayam & Makanan Laut';
      case 'cleaning_products':
      case 'household':
      case 'household_essentials':
        return isEn ? 'Household Essentials' : 'Keperluan Rumah';
      case 'pet_foods':
        return isEn ? 'Pet Foods' : 'Makanan Haiwan';
      case 'frozen':
        return isEn ? 'Frozen Foods' : 'Makanan Sejuk Beku';
      default:
        return cat.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  if (isLoading && banners.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 w-full">
        <div className="w-full h-44 sm:h-56 md:h-64 rounded-3xl bg-gray-200 animate-pulse border border-gray-300/60" />
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div
      id="storefront-banners-section"
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 w-full"
    >
      {/* Top Header Row: Live cloud status indicator, banner count & view toggle */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>{isEn ? 'FEATURED STOREFRONT DEALS' : 'TAWARAN PILIHAN PASARAYA'}</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <span>{banners.length} {isEn ? 'Live Deals' : 'Promosi Aktif'}</span>
          </span>
        </div>

        {/* View Mode Switcher (Carousel vs Grid) */}
        {banners.length > 1 && (
          <div className="flex items-center gap-1 bg-gray-100/90 p-0.5 rounded-xl border border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'carousel'
                  ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title={isEn ? 'Interactive Slider (Auto-play)' : 'Slider Interaktif (Auto-gerak)'}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title={isEn ? 'Grid Overview' : 'Paparan Grid'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 1. AUTO-PLAY INTERACTIVE CAROUSEL SLIDER VIEW */}
      {viewMode === 'carousel' ? (
        <div
          ref={containerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeaveContainer}
          className="relative w-full overflow-hidden rounded-3xl shadow-md border border-gray-200/70 bg-gray-100 group select-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Track with smooth CSS transform & touch drag follow */}
          <div
            className="flex w-full"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              transition: isDragging ? 'none' : 'transform 500ms cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            {banners.map((banner, idx) => {
              const bannerTitle = isEn
                ? (banner.titleEn || (banner as any).title || '')
                : (banner.titleMs || banner.titleEn || (banner as any).title || '');
              const bannerSubtitle = isEn
                ? (banner.subtitleEn || (banner as any).subtitle || '')
                : (banner.subtitleMs || banner.subtitleEn || (banner as any).subtitle || '');
              const bannerImage = banner.imageUrl || (banner as any).image_url || '';
              const categoryBadge = getCategoryBadgeLabel(banner);
              const bannerCtaText = isEn
                ? (banner.ctaTextEn?.trim() || (banner as any).ctaText?.trim() || (banner as any).cta_text?.trim() || 'Shop Now')
                : (banner.ctaTextMs?.trim() || banner.ctaTextEn?.trim() || (banner as any).ctaText?.trim() || 'Beli Sekarang');

              // Hard conditional checks strictly evaluating boolean flags first (Clean Image Mode & toggle sync)
              const showBadgeTag = (banner.showBadges !== false && banner.showBadgeTag !== false && banner.showBadge !== false) && Boolean((isEn ? banner.badgeEn : (banner.badgeMs || banner.badgeEn))?.trim());
              const showCategoryBadge = (banner.showBadges !== false && banner.showCategoryBadge !== false) && Boolean(categoryBadge?.trim());
              const showTitle = banner.showTitle !== false && Boolean(bannerTitle?.trim());
              const showSubtitle = banner.showSubtitle !== false && Boolean(bannerSubtitle?.trim());
              const showCtaButton = (banner.showCTA !== false && banner.showCtaButton !== false && banner.showCta !== false) && Boolean(bannerCtaText?.trim());

              const hasAnyTextOverlay = showBadgeTag || showCategoryBadge || showTitle || showSubtitle || showCtaButton;
              const showMerchantBadge = Boolean(banner.merchantName?.trim()) && hasAnyTextOverlay;
              const hasAnyBadges = (banner.showBadges !== false) && (showBadgeTag || showCategoryBadge || showMerchantBadge);
              const hasAnyOverlay = hasAnyTextOverlay;

              return (
                <div
                  key={banner.id || idx}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={(e) => handleMouseUp(e, banner)}
                  onClick={() => handleBannerClick(banner)}
                  className="relative min-w-full w-full shrink-0 min-h-[200px] sm:min-h-[240px] md:min-h-[280px] lg:min-h-[300px] flex items-center overflow-hidden cursor-pointer"
                >
                  {/* Background Image - 100% Crisp, Bright, and completely free of darkening overlays */}
                  <div className="absolute inset-0 z-0 overflow-hidden bg-gray-100">
                    <img
                      src={bannerImage}
                      alt={bannerTitle || 'Storefront Banner'}
                      className="w-full h-full object-cover object-center transform transition-transform duration-700 ease-out group-hover:scale-105"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      draggable={false}
                    />
                  </div>

                  {/* Conditional Text Overlay (Hidden entirely in Clean Image Mode) */}
                  {hasAnyOverlay && (
                    <div className="relative z-10 p-5 sm:p-7 md:p-9 ml-6 sm:ml-10 md:ml-12 max-w-sm sm:max-w-md md:max-w-lg space-y-2 sm:space-y-3 text-white pointer-events-auto">
                      {/* Floating Badges */}
                      {hasAnyBadges && (
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          {showBadgeTag && (
                            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                              <Flame className="w-3 h-3 text-red-600 fill-red-600" />
                              <span>
                                {isEn
                                  ? banner.badgeEn || 'HOT DEAL'
                                  : banner.badgeMs || 'PROMOSI HEBAT'}
                              </span>
                            </span>
                          )}

                          {showCategoryBadge && (
                            <span className="inline-flex items-center gap-1 bg-black/40 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border border-white/30 shadow-md">
                              <Tag className="w-3 h-3 text-emerald-300" />
                              <span>{categoryBadge}</span>
                            </span>
                          )}

                          {showMerchantBadge && (
                            <span className="hidden md:inline-flex items-center gap-1 bg-black/40 backdrop-blur-xs text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 shadow-md">
                              <Store className="w-2.5 h-2.5 text-emerald-300" />
                              <span>{banner.merchantName}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Title (Dual-layer text-shadow for razor-sharp contrast directly over any image) */}
                      {(banner.showTitle !== false && showTitle) && (
                        <h2
                          style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.9), 0 1px 3px rgba(0, 0, 0, 0.95)' }}
                          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight line-clamp-2 drop-shadow-md"
                        >
                          {bannerTitle}
                        </h2>
                      )}

                      {/* Subtitle (Crisp drop text shadow directly over image) */}
                      {(banner.showSubtitle !== false && showSubtitle) && (
                        <p
                          style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.9), 0 1px 2px rgba(0, 0, 0, 0.95)' }}
                          className="text-xs sm:text-sm md:text-base text-white/95 font-medium leading-relaxed max-w-md line-clamp-2 drop-shadow-sm"
                        >
                          {bannerSubtitle}
                        </p>
                      )}

                      {/* Action CTA Button */}
                      {(banner.showCTA !== false && banner.showCta !== false && banner.showCtaButton !== false && showCtaButton) && (
                        <div className="pt-1 flex items-center gap-2.5 sm:gap-3 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBannerClick(banner);
                            }}
                            className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl drop-shadow-md flex items-center gap-1.5 cursor-pointer group/btn"
                          >
                            <span>{bannerCtaText}</span>
                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                          </button>

                          <span
                            style={{ textShadow: '0 1px 6px rgba(0, 0, 0, 0.95)' }}
                            className="text-[11px] sm:text-xs text-white/95 hidden sm:inline-flex items-center gap-1.5 font-semibold"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-300 drop-shadow-sm" />
                            <span>{isEn ? '2-Hour Doorstep Delivery' : 'Hantar Pintu Rumah 2 Jam'}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Optional Side Arrow Controls */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 border border-white/20 cursor-pointer shadow-lg"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/45 hover:bg-black/80 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 border border-white/20 cursor-pointer shadow-lg"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Subtle Active Page Indicator Dots (Pagination Dots) at Bottom Center */}
          {banners.length > 1 && (
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-md">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    currentIndex === idx
                      ? 'w-6 h-2 bg-emerald-400 shadow-xs'
                      : 'w-2 h-2 bg-white/50 hover:bg-white/90'
                  }`}
                  aria-label={`Jump to banner ${idx + 1}`}
                />
              ))}

              {/* Subtle Auto-play Pause/Play Indicator */}
              <div
                className="ml-1 pl-1.5 border-l border-white/20 text-white/70"
                title={isHovered ? (isEn ? 'Paused on hover' : 'Dijeda semasa tatal') : (isEn ? 'Auto-sliding every 3.5s' : 'Auto-bergerak setiap 3.5s')}
              >
                {isHovered ? (
                  <Pause className="w-2.5 h-2.5 text-amber-300" />
                ) : (
                  <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400 animate-pulse" />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 2. GRID PROMOTIONAL OVERVIEW VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {banners.map((banner) => {
            const bannerTitle = isEn
              ? (banner.titleEn || (banner as any).title || '')
              : (banner.titleMs || banner.titleEn || (banner as any).title || '');
            const bannerSubtitle = isEn
              ? (banner.subtitleEn || (banner as any).subtitle || '')
              : (banner.subtitleMs || banner.subtitleEn || (banner as any).subtitle || '');
            const bannerImage = banner.imageUrl || (banner as any).image_url || '';
            const bannerCategory = banner.targetCategory || (banner as any).target_category || 'fresh_products';
            const categoryBadgeLabel = getCategoryBadgeLabel(banner);

            const showBadgeTag = (banner.showBadges !== false && banner.showBadgeTag !== false && banner.showBadge !== false) && Boolean((isEn ? banner.badgeEn : (banner.badgeMs || banner.badgeEn))?.trim());
            const showCategoryBadge = (banner.showBadges !== false && banner.showCategoryBadge !== false) && Boolean(categoryBadgeLabel?.trim());
            const showTitle = banner.showTitle !== false && Boolean(bannerTitle?.trim());
            const showSubtitle = banner.showSubtitle !== false && Boolean(bannerSubtitle?.trim());
            const showCtaButton = (banner.showCTA !== false && banner.showCtaButton !== false && banner.showCta !== false) && Boolean((isEn ? banner.ctaTextEn : banner.ctaTextMs)?.trim() || (banner as any).ctaText);

            const hasAnyOverlay = showBadgeTag || showCategoryBadge || showTitle || showSubtitle || showCtaButton;

            return (
              <div
                key={banner.id}
                onClick={() => handleBannerClick(banner)}
                className="relative overflow-hidden rounded-2xl shadow-sm border border-gray-200 bg-white hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
              >
                {!hasAnyOverlay ? (
                  /* Clean Full Graphic Image Mode */
                  <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-gray-100">
                    <img
                      src={bannerImage}
                      alt={bannerTitle || 'Storefront Banner'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      draggable={false}
                    />
                  </div>
                ) : (
                  <>
                    {/* Image banner thumb */}
                    <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                      <img
                        src={bannerImage}
                        alt={bannerTitle || 'Storefront Banner'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        draggable={false}
                      />
                      {(banner.showBadges !== false && (showBadgeTag || showCategoryBadge)) && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                      )}
                      {(banner.showBadges !== false && showBadgeTag) && (
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                            {isEn ? banner.badgeEn || 'PROMO' : banner.badgeMs || 'PROMOSI'}
                          </span>
                        </div>
                      )}
                      {(banner.showBadges !== false && showCategoryBadge && categoryBadgeLabel) && (
                        <div className="absolute bottom-2 left-2.5 right-2.5">
                          <span className="text-[10px] font-bold text-emerald-200 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
                            {categoryBadgeLabel}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Text & CTA */}
                    {(showTitle || showSubtitle || showCtaButton) && (
                      <div className="p-3.5 flex flex-col justify-between flex-1">
                        <div>
                          {(banner.showTitle !== false && showTitle) && (
                            <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                              {bannerTitle}
                            </h3>
                          )}
                          {(banner.showSubtitle !== false && showSubtitle) && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                              {bannerSubtitle}
                            </p>
                          )}
                        </div>

                        {(banner.showCTA !== false && banner.showCta !== false && banner.showCtaButton !== false && showCtaButton) && (
                          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                            <span>
                              {isEn
                                ? (banner.ctaTextEn?.trim() || (banner as any).ctaText?.trim() || 'Shop Now')
                                : (banner.ctaTextMs?.trim() || banner.ctaTextEn?.trim() || 'Beli Sekarang')}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
