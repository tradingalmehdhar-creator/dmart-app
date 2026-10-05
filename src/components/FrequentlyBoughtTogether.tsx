import React, { useMemo, useState } from 'react';
import { Sparkles, Plus, Check, Tag, Zap } from 'lucide-react';
import { Product, CartItem, Language } from '../types';
import {
  getFrequentlyBoughtTogether,
  isFrequentPurchasePairing,
} from '../utils/frequentlyBoughtTogether';
import { products as fallbackProducts } from '../data/products';

interface FrequentlyBoughtTogetherProps {
  cartItems: CartItem[];
  catalogProducts?: Product[];
  language: Language;
  onAddToCart: (product: Product) => void;
  className?: string;
}

export const FrequentlyBoughtTogether: React.FC<FrequentlyBoughtTogetherProps> = ({
  cartItems,
  catalogProducts,
  language,
  onAddToCart,
  className = '',
}) => {
  const isEn = language === 'en';
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Derive top complementary recommendations based on items in the cart
  const recommendations = useMemo(() => {
    const productsPool = catalogProducts && catalogProducts.length > 0
      ? catalogProducts
      : fallbackProducts;
    return getFrequentlyBoughtTogether(cartItems, productsPool, 6);
  }, [cartItems, catalogProducts]);

  if (recommendations.length === 0) {
    return null;
  }

  const handleQuickAdd = (product: Product) => {
    onAddToCart(product);
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId((current) => (current === product.id ? null : current));
    }, 1200);
  };

  return (
    <section
      id="frequently-bought-together-section"
      aria-label={isEn ? 'Frequently Bought Together' : 'Kerap Dibeli Bersama'}
      className={`rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border border-emerald-200/70 p-3 sm:p-3.5 shadow-xs transition-all ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight">
              {isEn ? 'Frequently Bought Together' : 'Kerap Dibeli Bersama'}
            </h4>
            <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium leading-tight">
              {isEn
                ? 'Complementary items customers often add'
                : 'Barangan pelengkap yang sering ditambah pelanggan'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
          {recommendations.length} {isEn ? 'Picks' : 'Cadangan'}
        </span>
      </div>

      {/* Horizontal Carousel of Recommendations */}
      <div className="flex items-stretch gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar snap-x snap-mandatory -mx-1 px-1">
        {recommendations.map((product) => {
          const name = isEn ? product.nameEn : product.nameMs;
          const unit = isEn
            ? (product.amountEn || product.unitEn)
            : (product.amountMs || product.unitMs);
          const isAdded = justAddedId === product.id;
          const isBundlePair = isFrequentPurchasePairing(product, cartItems);
          const bundleText = isEn
            ? (product.bundleBadge || (isBundlePair ? 'Bundle Discount' : (product.isBundle ? 'Value Pack' : null)))
            : (product.bundleBadgeMs || product.bundleBadge || (isBundlePair ? 'Diskaun Kombo' : (product.isBundle ? 'Pek Nilai' : null)));
          const discountPercent = product.originalPrice
            ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
            : null;

          return (
            <div
              key={`rec-${product.id}`}
              className={`w-36 sm:w-40 shrink-0 snap-start rounded-xl p-2 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between group ${
                bundleText || isBundlePair
                  ? 'bg-gradient-to-b from-amber-50/30 via-white to-white border border-amber-300/80 hover:border-amber-400'
                  : 'bg-white border border-gray-200/90 hover:border-emerald-400'
              }`}
            >
              {/* Product Thumbnail with discount/bundle badge */}
              <div className="relative w-full h-24 rounded-lg overflow-hidden bg-emerald-50/40 mb-1.5 shrink-0 border border-gray-100">
                <img
                  src={product.image}
                  alt={name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Top Left Badges: Distinct Subtle Bundle / Value Pack Discount & Percentage */}
                <div className="absolute top-1 left-1 flex flex-col gap-1 items-start z-10 max-w-[92%]">
                  {bundleText && (
                    <span
                      id={`badge-bundle-${product.id}`}
                      className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-400/95 via-amber-300/95 to-orange-400/95 backdrop-blur-md text-amber-950 font-black text-[8px] sm:text-[8.5px] px-1.5 py-0.5 rounded-md shadow-2xs uppercase tracking-tight border border-amber-500/25 truncate"
                      title={bundleText}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-900 fill-amber-900 shrink-0" />
                      <span className="truncate">{bundleText}</span>
                    </span>
                  )}

                  {discountPercent && !bundleText && (
                    <span className="inline-flex items-center bg-rose-600/90 backdrop-blur-md text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs border border-white/20">
                      -{discountPercent}%
                    </span>
                  )}
                  {discountPercent && bundleText && (
                    <span className="inline-flex items-center bg-rose-600/90 backdrop-blur-md text-white text-[8px] font-black px-1 py-0.2 rounded shadow-2xs border border-white/20">
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                {product.halal && (
                  <span className="absolute bottom-1 right-1 bg-white/95 text-emerald-800 text-[8px] font-bold px-1 py-0.2 rounded border border-emerald-200">
                    HALAL
                  </span>
                )}
              </div>

              {/* Title & Unit info */}
              <div className="min-w-0 flex-1">
                <h5
                  className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1 leading-snug"
                  title={name}
                >
                  {name}
                </h5>
                <span className="text-[10px] text-gray-500 font-medium block truncate mt-0.5">
                  {unit}
                </span>

                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className="text-[8.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200/70 px-1 py-0.2 rounded flex items-center gap-0.5">
                    <Sparkles className="w-2 h-2 text-amber-600 fill-amber-500" />
                    <span>+{product.pointsReward ?? Math.max(1, Math.round(product.price))} {isEn ? 'pts' : 'mata'}</span>
                  </span>
                  {isBundlePair && (
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-100 text-amber-900 text-[8.5px] font-bold">
                      <Tag className="w-2 h-2 text-amber-700 shrink-0" />
                      <span>{isEn ? 'Pair' : 'Padanan'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Quick Add Button Row */}
              <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between gap-1 w-full">
                <div className="flex-shrink-0">
                  <span className="text-xs font-black text-emerald-700 leading-tight block whitespace-nowrap">
                    RM {product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-[9px] text-gray-400 line-through leading-none block whitespace-nowrap">
                      RM {product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  id={`btn-fbt-add-${product.id}`}
                  onClick={() => handleQuickAdd(product)}
                  disabled={isAdded}
                  className={`flex-shrink-0 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg font-bold text-[11px] shadow-2xs transition-all cursor-pointer active:scale-95 ${
                    isAdded
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : isBundlePair
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                  title={isEn ? `Add ${name} to cart` : `Tambah ${name} ke troli`}
                  aria-label={isEn ? `Add ${name} to cart` : `Tambah ${name} ke troli`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />
                      <span>{isEn ? 'Added' : 'Tambah'}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3 shrink-0" />
                      <span>{isEn ? 'Add' : 'Tambah'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
