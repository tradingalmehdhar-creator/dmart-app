import React from 'react';
import { Plus, Minus, Check, ShoppingBag, Award, Package2, Heart, Zap, Sparkles } from 'lucide-react';
import { Product, Language } from '../types';
import { translations } from '../data/translations';

interface ProductCardProps {
  product: Product;
  language: Language;
  quantityInCart: number;
  isFavorite?: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToggleFavorite?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  language,
  quantityInCart,
  isFavorite = false,
  onAddToCart,
  onUpdateQuantity,
  onToggleFavorite,
}) => {
  const t = translations[language];
  const name = language === 'en' ? product.nameEn : product.nameMs;
  const amount = language === 'en' ? (product.amountEn || product.unitEn) : (product.amountMs || product.unitMs);
  const badge = language === 'en' ? product.badge : product.badgeMs;

  // Bundle / Value Pack grouped offer detection
  const bundleText = language === 'en'
    ? (product.bundleBadge || (product.isBundle ? 'Value Pack' : null))
    : (product.bundleBadgeMs || product.bundleBadge || (product.isBundle ? 'Pek Nilai' : null));

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Loyalty Points earned on this product
  const pointsReward = product.pointsReward ?? Math.max(1, Math.round(product.price));

  return (
    <div className="group bg-white rounded-2xl border border-gray-200/90 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between h-auto">
      {/* Product Image & Badges */}
      <div className="relative pt-[78%] bg-emerald-50/30 overflow-hidden shrink-0">
        <img
          src={product.image}
          alt={name}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
            !product.inStock ? 'grayscale opacity-75' : ''
          }`}
        />

        {/* Top Badges (Left): Bundle / Value Pack, Discount %, Promo Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 max-w-[65%]">
          {bundleText && (
            <span
              id={`product-bundle-badge-${product.id}`}
              className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500/95 via-amber-400/95 to-orange-500/95 backdrop-blur-md text-amber-950 text-[8.5px] sm:text-[9.5px] font-black px-1.5 sm:px-2 py-0.5 rounded-lg shadow-2xs border border-amber-300/40 uppercase tracking-tight select-none truncate"
              title={bundleText}
            >
              <Zap className="w-2.5 h-2.5 fill-amber-950 text-amber-950 shrink-0" />
              <span className="truncate">{bundleText}</span>
            </span>
          )}

          {discountPercent && (
            <span className="inline-flex items-center bg-rose-600/90 backdrop-blur-md text-white text-[9px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded-md shadow-2xs border border-white/20 tracking-tight">
              -{discountPercent}%
            </span>
          )}

          {badge && !bundleText && (
            <span className="inline-flex items-center bg-emerald-700/85 backdrop-blur-md text-white text-[8.5px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-2xs border border-white/20 tracking-tight truncate max-w-full">
              {badge}
            </span>
          )}
        </div>

        {/* Top Actions & Badges (Right: Halal, Stock Status, Favorite Button) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 sm:gap-1.5 z-10">
          {product.halal && (
            <div className="bg-white/85 backdrop-blur-md text-emerald-800 text-[8.5px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-md border border-emerald-300/60 flex items-center gap-0.5 shadow-2xs">
              <Award className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
              <span>HALAL</span>
            </div>
          )}

          {!product.inStock && (
            <div className="bg-red-600/90 backdrop-blur-md text-white text-[8px] sm:text-[8.5px] font-black px-1.5 py-0.5 rounded-md border border-white/20 shadow-2xs flex items-center gap-0.5">
              <span>✕</span>
              <span>{t.outOfStock}</span>
            </div>
          )}

          {/* Favorite Heart Button */}
          {onToggleFavorite && (
            <button
              id={`favorite-btn-${product.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(product.id);
              }}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorite ? (language === 'en' ? 'Remove from favorites' : 'Buang dari kegemaran') : (language === 'en' ? 'Save to favorites' : 'Simpan ke kegemaran')}
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-200 active:scale-85 shadow-2xs cursor-pointer ${
                isFavorite
                  ? 'bg-rose-50/95 text-rose-600 border border-rose-200 hover:bg-rose-100'
                  : 'bg-white/85 hover:bg-white text-gray-400 hover:text-rose-500 border border-gray-200/60 backdrop-blur-md'
              }`}
            >
              <Heart
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform ${
                  isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : 'text-current'
                }`}
              />
            </button>
          )}
        </div>

        {/* Explicit Amount Tag on bottom corner of image */}
        <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-md text-white text-[9.5px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 border border-white/10 shadow-2xs">
          <Package2 className="w-2.5 h-2.5 text-emerald-300 shrink-0" />
          <span>{amount}</span>
        </div>
      </div>

      {/* Product Information */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 flex-1">
        <div className="space-y-1">
          {/* Stock / Size / Points reward row */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium gap-1 flex-wrap">
            <span className="text-emerald-700 font-semibold truncate text-[10px] sm:text-[11px]">
              {t.amountLabel}: {amount}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {/* Subtle Points Reward Tag */}
              <span
                id={`product-points-tag-${product.id}`}
                className="inline-flex items-center gap-0.5 text-[8.5px] sm:text-[9.5px] font-bold text-amber-800 bg-amber-50/90 border border-amber-200/80 px-1 sm:px-1.5 py-0.5 rounded-md shadow-2xs select-none"
                title={language === 'en' ? `Earn ${pointsReward} loyalty points on purchase` : `Dapat ${pointsReward} mata ganjaran`}
              >
                <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-400 shrink-0" />
                <span>{language === 'en' ? `Earn +${pointsReward} pts` : `Dapat +${pointsReward} mata`}</span>
              </span>

              {product.inStock ? (
                <span className="text-[9px] sm:text-[10px] text-emerald-700 font-bold bg-emerald-50/90 border border-emerald-200/60 px-1.5 py-0.5 rounded-md shrink-0">
                  ✓ {t.inStock}
                </span>
              ) : (
                <span className="text-[9px] sm:text-[10px] text-red-600 font-bold bg-red-50/90 border border-red-200/60 px-1.5 py-0.5 rounded-md shrink-0">
                  ✕ {t.outOfStock}
                </span>
              )}
            </div>
          </div>

          {/* Product Title (limit to max 2 lines with line-clamp-2) */}
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors break-words">
            {name}
          </h3>
        </div>

        {/* Price and Quantity Control action row */}
        <div className="pt-2 border-t border-gray-100 flex flex-row items-center justify-between gap-1.5 sm:gap-2 w-full overflow-hidden">
          {/* Price Section - vertically stacked when discounted price is present */}
          <div className="flex flex-col items-start min-w-0 pr-1">
            <span className="text-[9.5px] sm:text-[10px] text-gray-400 font-semibold block leading-tight">
              {t.priceLabel}
            </span>
            {product.originalPrice && product.originalPrice > product.price ? (
              <div className="flex flex-col items-start leading-none mt-0.5">
                {/* Top line / Main: Current Price */}
                <span className="text-xs sm:text-sm md:text-base font-black text-emerald-700 leading-tight whitespace-nowrap">
                  RM {product.price.toFixed(2)}
                </span>
                {/* Bottom line / Secondary: Strikethrough Old Price */}
                <span className="text-[9px] sm:text-[10px] md:text-[11px] text-gray-400 line-through leading-tight whitespace-nowrap">
                  RM {product.originalPrice.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xs sm:text-sm md:text-base font-black text-emerald-700 leading-tight whitespace-nowrap">
                  RM {product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-[9px] sm:text-[10px] text-gray-400 line-through leading-tight whitespace-nowrap">
                    RM {product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Button & Quantity Stepper Controls */}
          {quantityInCart > 0 ? (
            <div className="flex-shrink-0 shrink-0 flex items-center bg-emerald-50 border border-emerald-300 rounded-xl p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantityInCart - 1)}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-white hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold transition-all cursor-pointer shrink-0"
                title="Decrease"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="min-w-[1.125rem] sm:min-w-[1.375rem] px-0.5 sm:px-1 text-center text-xs font-black text-emerald-950 select-none shrink-0">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, quantityInCart + 1)}
                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                title="Increase"
                aria-label="Increase quantity"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="flex-shrink-0 shrink-0 inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span>{language === 'en' ? 'Add' : 'Tambah'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
