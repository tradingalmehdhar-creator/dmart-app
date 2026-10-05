import React, { useState, useMemo } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  Truck,
  Check,
  Sparkles
} from 'lucide-react';
import { CartItem, Language, Product } from '../types';
import { translations } from '../data/translations';
import { AVAILABLE_VOUCHERS } from '../data/vouchers';
import { QRCodeShareBanner } from './QRCodeShareBanner';
import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether';
import { getBundledCartItemIds } from '../utils/frequentlyBoughtTogether';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  onApplyVoucher: (code: string) => { success: boolean; message: string };
  voucherCode: string;
  onProceedToCheckout: () => void;
  onOpenShareApp?: () => void;
  onAddToCart?: (product: Product) => void;
  catalogProducts?: Product[];
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  language,
  items,
  onUpdateQuantity,
  onClearCart,
  subtotal,
  deliveryFee,
  discount,
  total,
  onApplyVoucher,
  voucherCode,
  onProceedToCheckout,
  onOpenShareApp,
  onAddToCart,
  catalogProducts,
}) => {
  const t = translations[language];
  const [inputCode, setInputCode] = useState(voucherCode);
  const [voucherMsg, setVoucherMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Identify which items in the cart are frequently bought together with each other
  const bundledItemIds = useMemo(() => {
    return getBundledCartItemIds(items);
  }, [items]);

  const handleAddToCartItem = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      const existing = items.find((i) => i.product.id === product.id);
      onUpdateQuantity(product.id, (existing?.quantity || 0) + 1);
    }
  };

  if (!isOpen) return null;

  const freeDeliveryThreshold = 60;
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
  const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = onApplyVoucher(inputCode.trim());
    setVoucherMsg({ success: res.success, text: res.message });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col">
        {/* Cart Header */}
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-base">
              {t.cart} ({items.reduce((sum, item) => sum + item.quantity, 0)} {t.items})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-emerald-200 hover:text-white underline p-1 cursor-pointer"
              >
                {language === 'en' ? 'Clear' : 'Kosongkan'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Free Delivery Bar */}
        <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-xs">
          <div className="flex items-center justify-between font-semibold text-emerald-900 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              {remainingForFree > 0
                ? (language === 'en'
                    ? `Add RM ${remainingForFree.toFixed(2)} more for FREE Delivery!`
                    : `Tambah RM ${remainingForFree.toFixed(2)} lagi untuk Penghantaran PERCUMA!`)
                : (language === 'en' ? '🎉 You unlocked FREE Delivery!' : '🎉 Anda layak Penghantaran PERCUMA!')}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-emerald-200/70 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cart Items List & Frequently Bought Together Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="space-y-4">
              <div className="py-12 text-center text-gray-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-gray-800 text-base">{t.emptyCartTitle}</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  {t.emptyCartDesc}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  {t.startShopping}
                </button>
              </div>

              {/* Popular Starter Essentials when cart is empty */}
              <div className="pt-2">
                <FrequentlyBoughtTogether
                  cartItems={items}
                  catalogProducts={catalogProducts}
                  language={language}
                  onAddToCart={handleAddToCartItem}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active Bundle Discount Pairing Notification Banner */}
              {bundledItemIds.size > 0 && (
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-400/20 via-amber-300/25 to-orange-400/20 border border-amber-300/90 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      ⚡
                    </span>
                    <p className="text-[11px] font-extrabold text-amber-950 truncate">
                      {language === 'en'
                        ? `${bundledItemIds.size} cart items paired with Bundle Discount savings!`
                        : `${bundledItemIds.size} barangan dipadankan dengan penjimatan Diskaun Kombo!`}
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase text-amber-950 bg-amber-300 px-2 py-0.5 rounded-md border border-amber-400 shadow-2xs shrink-0">
                    {language === 'en' ? 'Active' : 'Aktif'}
                  </span>
                </div>
              )}

              {items.map((item) => {
                const name = language === 'en' ? item.product.nameEn : item.product.nameMs;
                const unit = language === 'en' ? item.product.unitEn : item.product.unitMs;
                const isBundled = bundledItemIds.has(item.product.id);

                return (
                  <div
                    key={item.product.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      isBundled
                        ? 'border-amber-300/80 bg-gradient-to-r from-amber-50/30 via-white to-white shadow-2xs'
                        : 'border-gray-100 hover:border-emerald-200 bg-white shadow-2xs'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={item.product.image}
                        alt={name}
                        className="w-16 h-16 rounded-lg object-cover bg-emerald-50 border border-gray-100"
                      />
                      {isBundled && (
                        <span
                          className="absolute -top-1.5 -left-1.5 inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-amber-950 font-black text-[7.5px] px-1 py-0.2 rounded shadow-xs uppercase tracking-tight border border-amber-500/30"
                          title={language === 'en' ? 'Frequently bought together bundle pairing' : 'Padanan kombo belian kerap'}
                        >
                          <Sparkles className="w-2 h-2 text-amber-900 fill-amber-900 shrink-0" />
                          <span>{language === 'en' ? 'Bundle' : 'Kombo'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-xs leading-snug line-clamp-1">
                          {name}
                        </h4>
                        {isBundled && (
                          <span
                            id={`cart-item-bundle-badge-${item.product.id}`}
                            className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-amber-950 font-black text-[8px] sm:text-[8.5px] px-1.5 py-0.2 rounded uppercase tracking-tight border border-amber-500/25 shadow-2xs shrink-0"
                          >
                            <Sparkles className="w-2 h-2 text-amber-900 fill-amber-900 shrink-0" />
                            <span>{language === 'en' ? 'Bundle Discount' : 'Diskaun Kombo'}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 block">{unit}</span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xs font-black text-emerald-700 block">
                          RM {item.product.price.toFixed(2)}
                        </span>
                        {isBundled && (
                          <span className="text-[9.5px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-1 py-0.2 rounded">
                            {language === 'en' ? '• Pair savings' : '• Jimat kombo'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs transition-colors cursor-pointer"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="w-5 text-center text-xs font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Dynamic Frequently Bought Together Section */}
              <div className="pt-2">
                <FrequentlyBoughtTogether
                  cartItems={items}
                  catalogProducts={catalogProducts}
                  language={language}
                  onAddToCart={handleAddToCartItem}
                />
              </div>
            </div>
          )}
        </div>

        {/* Voucher & Pricing Footer */}
        {items.length > 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
            {/* Voucher code form */}
            <form onSubmit={handleApply} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder={t.voucherPlaceholder}
                  className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-white border border-gray-200 focus:border-emerald-500 text-xs font-semibold uppercase outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shrink-0"
              >
                {t.applyVoucher}
              </button>
            </form>

            {/* Quick Available Vouchers Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                {language === 'en' ? 'Quick Deals:' : 'Tawaran:'}
              </span>
              {AVAILABLE_VOUCHERS.map((v) => {
                const isSelected = (voucherCode || inputCode).toUpperCase() === v.code;
                return (
                  <button
                    key={v.code}
                    type="button"
                    onClick={() => {
                      setInputCode(v.code);
                      const res = onApplyVoucher(v.code);
                      setVoucherMsg({ text: res.message, success: res.success });
                    }}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap transition-colors border ${
                      isSelected
                        ? 'bg-amber-400 text-emerald-950 border-amber-400 font-black'
                        : 'bg-white hover:bg-emerald-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {v.code} ({language === 'en' ? v.titleEn : v.titleMs})
                  </button>
                );
              })}
            </div>

            {voucherMsg && (
              <p className={`text-[11px] font-semibold ${voucherMsg.success ? 'text-emerald-700' : 'text-red-600'}`}>
                {voucherMsg.text}
              </p>
            )}

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-gray-600 pt-1">
              <div className="flex justify-between">
                <span>{t.subtotal}</span>
                <span className="font-semibold text-gray-800">RM {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{t.discount}</span>
                  <span>-RM {discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{t.deliveryFee}</span>
                <span className="font-semibold text-emerald-700">
                  {deliveryFee === 0 ? t.freeDelivery : `RM ${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-900">
                <span>{t.total}</span>
                <span className="text-lg text-emerald-700 font-black">RM {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              type="button"
              onClick={onProceedToCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <span>{t.checkout}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Compact QR Code Banner at the bottom of Side Drawer */}
            <div className="pt-2">
              <QRCodeShareBanner
                language={language}
                variant="compact"
                onOpenFullModal={onOpenShareApp}
              />
            </div>
          </div>
        )}

        {/* If cart is empty, also show compact QR share banner at drawer bottom */}
        {items.length === 0 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100">
            <QRCodeShareBanner
              language={language}
              variant="compact"
              onOpenFullModal={onOpenShareApp}
            />
          </div>
        )}
      </div>
    </div>
  );
};
