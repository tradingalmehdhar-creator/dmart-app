import React from 'react';
import { Product, Language } from '../types';
import { translations } from '../data/translations';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface FreshProductsDualWindowsProps {
  products: Product[];
  language: Language;
  cart: { [productId: string]: number };
  favorites?: string[];
  isLoading?: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToggleFavorite?: (productId: string) => void;
}

export const FreshProductsDualWindows: React.FC<FreshProductsDualWindowsProps> = ({
  products,
  language,
  cart,
  favorites = [],
  isLoading = false,
  onAddToCart,
  onUpdateQuantity,
  onToggleFavorite,
}) => {
  const t = translations[language];

  const fruitProducts = products.filter((p) => p.subCategory === 'fruits');
  const veggieProducts = products.filter((p) => p.subCategory === 'vegetables');

  return (
    <div className="space-y-4">
      {/* SIDE-BY-SIDE TWO WINDOWS LAYOUT (Clean dual columns without large hero header) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WINDOW 1: FRUITS WINDOW */}
        <div className="bg-amber-50/40 border-2 border-amber-200/80 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-amber-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-amber-500/20">
                🍎
              </div>
              <div>
                <h3 className="text-base font-black text-amber-950 tracking-tight flex items-center gap-2">
                  <span>{language === 'en' ? 'Fresh Fruits' : 'Buah-buahan Segar'}</span>
                  <span className="text-[11px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                    {fruitProducts.length} {t.items}
                  </span>
                </h3>
                <p className="text-[11px] text-amber-800">
                  {language === 'en'
                    ? 'Sweet bananas, apples, oranges, papaya & watermelon'
                    : 'Pisang manis, epal, oren, betik sekaki & tembikai'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
            {isLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <ProductCardSkeleton key={`skeleton-fruit-${idx}`} />
                ))
              : fruitProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    quantityInCart={cart[product.id] || 0}
                    isFavorite={favorites.includes(product.id)}
                    onAddToCart={onAddToCart}
                    onUpdateQuantity={onUpdateQuantity}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
          </div>
        </div>

        {/* WINDOW 2: VEGETABLES WINDOW */}
        <div className="bg-emerald-50/40 border-2 border-emerald-200/80 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-200">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-600/20">
                🥦
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-950 tracking-tight flex items-center gap-2">
                  <span>{language === 'en' ? 'Farm Vegetables' : 'Sayur-sayuran Segar'}</span>
                  <span className="text-[11px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                    {veggieProducts.length} {t.items}
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-800">
                  {language === 'en'
                    ? 'Crisp spinach, farm tomatoes, carrots, cabbage & cucumber'
                    : 'Bayam hijau, tomato ladang, lobak merah, kubis & timun'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1">
            {isLoading
              ? Array.from({ length: 4 }).map((_, idx) => (
                  <ProductCardSkeleton key={`skeleton-veggie-${idx}`} />
                ))
              : veggieProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    language={language}
                    quantityInCart={cart[product.id] || 0}
                    isFavorite={favorites.includes(product.id)}
                    onAddToCart={onAddToCart}
                    onUpdateQuantity={onUpdateQuantity}
                    onToggleFavorite={onToggleFavorite}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};
