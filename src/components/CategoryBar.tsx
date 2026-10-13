import React, { useState, useRef, useEffect } from 'react';
import {
  Store,
  Apple,
  ShoppingBag,
  Coffee,
  Fish,
  Sparkles,
  Dog,
  Heart,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  LayoutGrid
} from 'lucide-react';
import { MainCategory, SubCategory, Language } from '../types';
import { translations, mainCategoryConfig } from '../data/translations';

const parseEmojiAndText = (label: string): { emoji?: string; text: string } => {
  const match = label.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji})\s*(.*)$/u);
  if (match) {
    return { emoji: match[1], text: match[2] };
  }
  return { text: label };
};

interface CategoryBarProps {
  selectedCategory: MainCategory;
  onSelectCategory: (category: MainCategory) => void;
  selectedSubCategory: SubCategory | 'all';
  onSelectSubCategory: (subCategory: SubCategory | 'all') => void;
  language: Language;
  favoritesCount?: number;
  showOnlyFavorites?: boolean;
  onToggleFavoritesFilter?: () => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedSubCategory,
  onSelectSubCategory,
  language,
  favoritesCount = 0,
  showOnlyFavorites = false,
  onToggleFavoritesFilter,
}) => {
  const t = translations[language];
  const isEn = language === 'en';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Chips touch & pointer drag state for mobile & desktop swiping
  const isDraggingChipsRef = useRef(false);
  const chipsStartXRef = useRef(0);
  const chipsScrollLeftRef = useRef(0);
  const chipsHasMovedRef = useRef(false);

  const handleChipsMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDraggingChipsRef.current = true;
    chipsHasMovedRef.current = false;
    chipsStartXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    chipsScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleChipsMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingChipsRef.current || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - chipsStartXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      chipsHasMovedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = chipsScrollLeftRef.current - walk;
    checkScroll();
  };

  const handleChipsMouseUpOrLeave = () => {
    isDraggingChipsRef.current = false;
    setTimeout(() => {
      chipsHasMovedRef.current = false;
    }, 50);
  };

  const mainCategories: {
    id: MainCategory;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    color: string;
    badge?: string;
  }[] = [
    {
      id: 'all',
      name: t.allCategories,
      icon: Store,
      desc: isEn ? 'Browse full store catalog & all aisles' : 'Lihat semua barangan & lorong pasaraya',
      color: 'emerald',
    },
    {
      id: 'fresh_products',
      name: t.freshProducts,
      icon: Apple,
      desc: isEn ? 'Farm-fresh fruits & crisp vegetables' : 'Buah-buahan & sayur-sayuran segar terus dari ladang',
      color: 'emerald',
    },
    {
      id: 'daily_groceries',
      name: t.dailyGroceries,
      icon: ShoppingBag,
      desc: isEn ? 'Pantry staples, rice, oil, dairy & eggs' : 'Beras, minyak, makanan tin, tenusu & keperluan dapur',
      color: 'amber',
    },
    {
      id: 'snacks_and_drinks',
      name: t.snacksAndDrinks,
      icon: Coffee,
      desc: isEn ? 'Coffee, Milo, soft drinks, biscuits & chips' : 'Kopi, Milo, minuman ringan, biskut & kerepek',
      color: 'orange',
    },
    {
      id: 'meats',
      name: t.meatsCategory,
      icon: Fish,
      desc: isEn ? '100% Halal fresh chicken, beef & sea catch' : 'Ayam segar Halal, daging lembu & ikan laut segar',
      color: 'rose',
    },
    {
      id: 'cleaning_products',
      name: t.cleaningProducts,
      icon: Sparkles,
      desc: isEn ? 'Laundry detergent, dishwashing & paper wipes' : 'Sabun basuh baju, pencuci pinggan & tisu',
      color: 'sky',
    },
    {
      id: 'pet_foods',
      name: t.petFoods,
      icon: Dog,
      desc: isEn ? 'Nutritious cat & dog foods, treats & care' : 'Makanan kucing & anjing, snek & penjagaan',
      color: 'violet',
    },
  ];

  const activeCategoryConfig = mainCategoryConfig[selectedCategory];
  const subCategories = activeCategoryConfig?.subCategories || [];

  // Check scroll position for horizontal scrolling arrows
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Handle clicking outside or Escape key to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      const desktopMenu = document.getElementById('all-departments-dropdown-menu');
      if (desktopMenu && desktopMenu.contains(target)) {
        return;
      }
      const mobileDrawer = document.getElementById('mobile-departments-drawer');
      if (mobileDrawer && mobileDrawer.contains(target)) {
        return;
      }
      setIsDropdownOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleSelectFromDropdown = (catId: MainCategory) => {
    onSelectCategory(catId);
    onSelectSubCategory('all');
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-[69px] z-40 shadow-2xs w-full max-w-full overflow-visible">
      {/* Primary Department Navigation Bar */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-1.5 sm:py-2 w-full relative">
        <div className="relative flex items-center w-full">
          {/* Scroll Left Button (desktop/tablet helper) */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              className="absolute left-0 z-10 w-7 h-7 -ml-1 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 hidden sm:flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Unified Horizontal Scrollable Container (All Departments + Favorites + Categories in one seamless sequence) */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            onMouseDown={handleChipsMouseDown}
            onMouseMove={handleChipsMouseMove}
            onMouseUp={handleChipsMouseUpOrLeave}
            onMouseLeave={handleChipsMouseUpOrLeave}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide no-scrollbar scroll-smooth w-full touch-pan-x py-0.5 px-0.5 cursor-grab active:cursor-grabbing select-none"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              overscrollBehaviorX: 'contain',
            }}
          >
            {/* 1. All Departments Button (Inside scroll container, shrink-0, flows sequentially with other chips) */}
            <div className="shrink-0 flex items-center" ref={dropdownRef}>
              <button
                id="all-departments-dropdown-btn"
                type="button"
                onClick={() => {
                  if (chipsHasMovedRef.current) return;
                  onSelectCategory('all');
                  onSelectSubCategory('all');
                  setIsDropdownOpen((prev) => !prev);
                }}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  isDropdownOpen
                    ? 'bg-emerald-800 text-white border-emerald-800 ring-2 ring-emerald-400/40 shadow-sm'
                    : selectedCategory === 'all' && !showOnlyFavorites
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-700/20'
                    : 'bg-emerald-50 hover:bg-emerald-100/90 text-emerald-900 border-emerald-200 hover:border-emerald-300'
                }`}
              >
                <Store className={`w-3.5 h-3.5 ${selectedCategory === 'all' && !showOnlyFavorites ? 'text-white' : 'text-emerald-700'}`} />
                <span>{t.allCategories}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-amber-300' : 'text-emerald-700/70 group-hover:text-emerald-900'
                  }`}
                />
              </button>
            </div>

            {/* 2. Favorites Filter Tab Button */}
            {onToggleFavoritesFilter && (
              <button
                id="category-bar-favorites-filter-btn"
                type="button"
                onClick={() => {
                  if (chipsHasMovedRef.current) return;
                  onToggleFavoritesFilter();
                }}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border cursor-pointer ${
                  showOnlyFavorites
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/25 ring-2 ring-rose-400/30'
                    : 'bg-rose-50/70 hover:bg-rose-100/80 text-rose-800 border-rose-200 hover:border-rose-300'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-transform ${
                    showOnlyFavorites
                      ? 'fill-white text-white scale-110'
                      : favoritesCount > 0
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-rose-600'
                  }`}
                />
                <span>{t.favorites}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    showOnlyFavorites
                      ? 'bg-white/30 text-white'
                      : favoritesCount > 0
                      ? 'bg-rose-200 text-rose-900'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {favoritesCount}
                </span>
              </button>
            )}

            {/* 3. Individual Department Navigation Buttons (Excluding "all" which is handled above) */}
            {mainCategories
              .filter((cat) => cat.id !== 'all')
              .map((cat) => {
                const Icon = cat.icon;
                const isSelected = !showOnlyFavorites && selectedCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    id={`category-bar-${cat.id}-btn`}
                    type="button"
                    onClick={() => {
                      if (chipsHasMovedRef.current) return;
                      onSelectCategory(cat.id);
                      onSelectSubCategory('all');
                    }}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                        : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 border-gray-200'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                    <span>{cat.name}</span>
                    {cat.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {cat.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Scroll Right Button (desktop/tablet helper) */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              className="absolute right-0 z-10 w-7 h-7 -mr-1 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 hidden sm:flex items-center justify-center transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Desktop Overlay Dropdown List (Rendered above deals and banners with z-[100]) */}
        {isDropdownOpen && (
          <div
            id="all-departments-dropdown-menu"
            className="hidden sm:block absolute top-full left-2.5 sm:left-6 lg:left-8 mt-1 w-96 max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{ maxHeight: 'calc(80vh - 80px)' }}
          >
            {/* Dropdown Header */}
            <div className="p-3 sm:p-3.5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-tight leading-tight">
                    {isEn ? 'Supermarket Departments' : 'Jabatan Pasaraya D-mart'}
                  </h4>
                  <p className="text-[10px] text-emerald-200">
                    {isEn ? 'Select a department to browse directly' : 'Pilih jabatan untuk melihat barangan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-emerald-100 hover:text-white transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vertical List of All Store Categories */}
            <div className="p-2 space-y-1 overflow-y-auto max-h-[55vh] divide-y divide-gray-100">
              {mainCategories.map((cat) => {
                const Icon = cat.icon;
                const isCurrentActive = !showOnlyFavorites && selectedCategory === cat.id;

                const badgeColorMap: Record<string, string> = {
                  emerald: 'bg-emerald-100 text-emerald-800',
                  amber: 'bg-amber-100 text-amber-800',
                  orange: 'bg-orange-100 text-orange-800',
                  rose: 'bg-rose-100 text-rose-800',
                  sky: 'bg-sky-100 text-sky-800',
                  violet: 'bg-violet-100 text-violet-800',
                };

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectFromDropdown(cat.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer group pt-2.5 ${
                      isCurrentActive
                        ? 'bg-emerald-50/90 text-emerald-950 border border-emerald-300 shadow-2xs'
                        : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                          isCurrentActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : badgeColorMap[cat.color] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs font-bold leading-tight ${
                              isCurrentActive ? 'text-emerald-900' : 'text-gray-900'
                            }`}
                          >
                            {cat.name}
                          </span>
                          {isCurrentActive && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-200 text-emerald-900">
                              {isEn ? 'Active' : 'Aktif'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center pl-1">
                      {isCurrentActive ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Favorites Option inside Dropdown */}
              {onToggleFavoritesFilter && (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleFavoritesFilter();
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left cursor-pointer group ${
                      showOnlyFavorites
                        ? 'bg-rose-50 text-rose-950 border border-rose-300'
                        : 'hover:bg-rose-50/60 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          showOnlyFavorites
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            showOnlyFavorites || favoritesCount > 0 ? 'fill-current' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900">
                          {t.favorites}
                        </span>
                        <p className="text-[11px] text-gray-500">
                          {favoritesCount} {isEn ? 'items saved' : 'item disimpan'}
                        </p>
                      </div>
                    </div>

                    {showOnlyFavorites ? (
                      <div className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-rose-600" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Dropdown Footer */}
            <div className="px-3.5 py-2 bg-gray-50 border-t border-gray-150 flex items-center justify-between text-[11px] text-gray-500">
              <span>{mainCategories.length} {isEn ? 'Total Departments' : 'Jumlah Jabatan'}</span>
              <button
                type="button"
                onClick={() => handleSelectFromDropdown('all')}
                className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
              >
                {isEn ? 'View All Catalog' : 'Lihat Semua Katalog'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Overlay Fallback: Slide-over Bottom Sheet Drawer Modal */}
      {isDropdownOpen && (
        <div className="sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99] animate-in fade-in duration-200"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Sheet Drawer */}
          <div
            id="mobile-departments-drawer"
            className="fixed inset-x-0 bottom-0 z-[100] max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200 overflow-hidden"
          >
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto my-2.5 shrink-0" />

            {/* Drawer Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight leading-tight">
                    {isEn ? 'Supermarket Departments' : 'Jabatan Pasaraya D-mart'}
                  </h4>
                  <p className="text-[11px] text-emerald-200">
                    {isEn ? 'Tap any department to navigate instantly' : 'Pilih jabatan untuk terokai barangan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(false)}
                className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Categories List */}
            <div className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(85vh-130px)] divide-y divide-gray-100 touch-pan-y">
              {mainCategories.map((cat) => {
                const Icon = cat.icon;
                const isCurrentActive = !showOnlyFavorites && selectedCategory === cat.id;

                const badgeColorMap: Record<string, string> = {
                  emerald: 'bg-emerald-100 text-emerald-800',
                  amber: 'bg-amber-100 text-amber-800',
                  orange: 'bg-orange-100 text-orange-800',
                  rose: 'bg-rose-100 text-rose-800',
                  sky: 'bg-sky-100 text-sky-800',
                  violet: 'bg-violet-100 text-violet-800',
                };

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectFromDropdown(cat.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left cursor-pointer pt-3 ${
                      isCurrentActive
                        ? 'bg-emerald-50 text-emerald-950 border border-emerald-300 shadow-2xs'
                        : 'active:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-2">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isCurrentActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : badgeColorMap[cat.color] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-sm font-bold leading-tight ${
                              isCurrentActive ? 'text-emerald-950 font-black' : 'text-gray-900'
                            }`}
                          >
                            {cat.name}
                          </span>
                          {isCurrentActive && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-200 text-emerald-900">
                              {isEn ? 'Active' : 'Aktif'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                          {cat.desc}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center pl-1">
                      {isCurrentActive ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Favorites in Mobile Drawer */}
              {onToggleFavoritesFilter && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleFavoritesFilter();
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all text-left cursor-pointer ${
                      showOnlyFavorites
                        ? 'bg-rose-50 text-rose-950 border border-rose-300 shadow-2xs'
                        : 'active:bg-rose-50/60 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          showOnlyFavorites ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            showOnlyFavorites || favoritesCount > 0 ? 'fill-current' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-900">
                          {t.favorites}
                        </span>
                        <p className="text-xs text-gray-500">
                          {favoritesCount} {isEn ? 'saved items' : 'item disimpan'}
                        </p>
                      </div>
                    </div>

                    {showOnlyFavorites ? (
                      <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Drawer Footer */}
            <div className="p-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500 shrink-0">
              <span className="font-semibold">{mainCategories.length} {isEn ? 'Total Departments' : 'Jumlah Jabatan'}</span>
              <button
                type="button"
                onClick={() => handleSelectFromDropdown('all')}
                className="text-emerald-700 font-extrabold hover:underline"
              >
                {isEn ? 'View All Catalog' : 'Lihat Semua Katalog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Sub-Category Filter Pills (When any category with subcategories is selected) */}
      {selectedCategory !== 'all' && subCategories.length > 0 && (
        <div className="bg-white border-t border-gray-100 py-1">
          <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
            {/* Subcategory Filter Horizontal Scrollbar */}
            <div
              className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none scrollbar-hide no-scrollbar py-2 px-1 w-full touch-pan-x"
              style={{
                WebkitOverflowScrolling: 'touch',
                scrollBehavior: 'smooth',
                overscrollBehaviorX: 'contain',
              }}
            >
              {/* Label - Fixed & shrink-0 to maintain position */}
              <span className="text-xs font-semibold text-gray-500 flex-shrink-0">
                {language === 'en' ? 'Filter by subcategory:' : 'Tapis mengikut subkategori:'}
              </span>

              {/* Active / Inactive Subcategory Chips */}
              <button
                type="button"
                onClick={() => onSelectSubCategory('all')}
                className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedSubCategory === 'all'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {language === 'en' ? 'All in this Department' : 'Semua di Jabatan Ini'}
              </button>

              {subCategories.map((sub) => {
                const isSelected = selectedSubCategory === sub.id;
                const rawName = language === 'en' ? sub.en : sub.ms;
                const { emoji, text } = parseEmojiAndText(rawName);

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => onSelectSubCategory(sub.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {emoji && <span>{emoji}</span>}
                    <span>{text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

