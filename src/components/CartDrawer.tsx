import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  Truck,
  Check,
  Sparkles,
  MapPin,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
} from 'lucide-react';
import {
  CartItem,
  Language,
  Product,
  Order,
  PaymentMethodType,
  UserProfile,
  DeliveryAddress,
} from '../types';
import { translations, MALAYSIAN_BANKS } from '../data/translations';
import { AVAILABLE_VOUCHERS } from '../data/vouchers';
import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether';
import { getBundledCartItemIds } from '../utils/frequentlyBoughtTogether';

export interface CartDrawerProps {
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
  onProceedToCheckout?: () => void;
  onOpenShareApp?: () => void;
  onAddToCart?: (product: Product) => void;
  catalogProducts?: Product[];
  user?: UserProfile | null;
  deliveryAddress?: DeliveryAddress;
  onOpenMapPicker?: () => void;
  onOrderSuccess?: (order: Order) => void;
  onRequireAuth?: () => void;
  loyaltyPoints?: number;
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
  onAddToCart,
  catalogProducts,
  user,
  deliveryAddress: parentDeliveryAddress,
  onOpenMapPicker,
  onOrderSuccess,
  loyaltyPoints = 150,
}) => {
  const t = translations[language];
  const isEn = language === 'en';

  // Navigation state within full-page view: 'cart' | 'checkout'
  const [currentStep, setCurrentStep] = useState<'cart' | 'checkout'>('cart');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Voucher state
  const [inputCode, setInputCode] = useState(voucherCode);
  const [voucherMsg, setVoucherMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Checkout Payment & Delivery states
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('COD');
  const [selectedBank, setSelectedBank] = useState<string>('mb2u');
  const [tngPhone, setTngPhone] = useState(user?.phone || '012-3849120');
  const [deliverySlot, setDeliverySlot] = useState<'express' | 'evening' | 'tomorrow'>('express');
  const [selectedTip, setSelectedTip] = useState<number>(2);
  const [customTipInput, setCustomTipInput] = useState<string>('');
  const [isCustomTipActive, setIsCustomTipActive] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scrolling when full-page Cart & Checkout is active
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Reset to cart step on fresh open
      setCurrentStep('cart');
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Sync voucher code
  useEffect(() => {
    setInputCode(voucherCode);
  }, [voucherCode]);

  // Fallback default delivery address
  const deliveryAddress: DeliveryAddress = parentDeliveryAddress || {
    recipientName: user?.name || 'Al-Mehdhar',
    phone: user?.phone || '012-3849120',
    street: 'Jalan Kerinchi, Bangsar South',
    buildingUnit: 'Unit B-12-05, The Horizon',
    postcode: '59200',
    city: 'Kuala Lumpur',
    state: 'Wilayah Persekutuan Kuala Lumpur',
    notes: 'Sila serahkan di kaunter lobi / Leave at guardhouse',
    coordinates: { lat: 3.1116, lng: 101.6669 },
    formattedAddress: 'Unit B-12-05, The Horizon, Jalan Kerinchi, Bangsar South, 59200 Kuala Lumpur',
  };

  // Bundled recommendations in cart
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

  // Calculations for Checkout
  const effectiveTip = isCustomTipActive
    ? Math.max(0, parseFloat(customTipInput) || 0)
    : selectedTip;

  const maxRedeemablePoints = Math.min(
    loyaltyPoints,
    Math.floor(Math.max(0, subtotal - discount) * 100)
  );
  const pointsUsed = useLoyaltyPoints && maxRedeemablePoints > 0 ? maxRedeemablePoints : 0;
  const pointsMonetaryDiscount = +(pointsUsed / 100).toFixed(2);

  const pointsToEarn = items.reduce(
    (acc, item) =>
      acc + (item.product.pointsReward ?? Math.max(1, Math.round(item.product.price))) * item.quantity,
    0
  );

  const payableSubtotal = Math.max(0, subtotal - discount - pointsMonetaryDiscount);
  const finalTotalWithTip = +(payableSubtotal + deliveryFee + effectiveTip).toFixed(2);

  if (!isOpen) return null;

  const freeDeliveryThreshold = 60;
  const progressPercent = Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100));
  const remainingForFree = Math.max(0, freeDeliveryThreshold - subtotal);
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleApplyVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const res = onApplyVoucher(inputCode.trim());
    setVoucherMsg({ success: res.success, text: res.message });
  };

  const handleTopBack = () => {
    if (currentStep === 'checkout') {
      setCurrentStep('cart');
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      onClose();
    }
  };

  const handleProceedToCheckoutStep = () => {
    if (onProceedToCheckout && !onOrderSuccess) {
      onProceedToCheckout();
    } else {
      setCurrentStep('checkout');
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePlaceOrder = () => {
    if (!onOrderSuccess) {
      if (onProceedToCheckout) {
        onProceedToCheckout();
      }
      return;
    }

    setIsSubmitting(true);

    const slotEn =
      deliverySlot === 'express'
        ? 'Super Express (Within 2 Hours)'
        : deliverySlot === 'evening'
        ? 'Today Evening (5:00 PM - 8:00 PM)'
        : 'Tomorrow Morning (9:00 AM - 1:00 PM)';

    const slotMs =
      deliverySlot === 'express'
        ? 'Super Ekspres (Dalam 2 Jam)'
        : deliverySlot === 'evening'
        ? 'Petang Ini (5:00 PM - 8:00 PM)'
        : 'Pagi Esok (9:00 AM - 1:00 PM)';

    const orderNumber = 'DMART-' + Math.floor(100000 + Math.random() * 900000);
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const bankObj = MALAYSIAN_BANKS.find((b) => b.id === selectedBank);

    setTimeout(() => {
      const newOrder: Order = {
        id: 'ord-' + Date.now(),
        orderNumber,
        createdAt: new Date().toISOString(),
        items,
        subtotal,
        discount: discount + pointsMonetaryDiscount,
        deliveryFee,
        tip: effectiveTip,
        total: finalTotalWithTip,
        pointsRedeemed: pointsUsed,
        pointsDiscount: pointsMonetaryDiscount,
        pointsEarned: pointsToEarn,
        deliveryAddress,
        deliverySlot: slotEn,
        deliverySlotMs: slotMs,
        paymentMethod,
        paymentDetails: {
          bankName: paymentMethod === 'FPX' ? bankObj?.name : undefined,
          tngPhone: paymentMethod === 'TNG' ? tngPhone : undefined,
          tngRef: paymentMethod === 'TNG' ? 'TNG-' + Math.floor(10000000 + Math.random() * 90000000) : undefined,
        },
        status: 'submitted',
        deliveryOtp,
        deliveryOtpVerified: false,
        estimatedDeliveryTime:
          deliverySlot === 'express'
            ? `${isEn ? 'In 45 - 90 minutes' : 'Dalam 45 - 90 minit'}`
            : '5:00 PM - 8:00 PM',
        estimatedDeliveryTimestamp: Date.now() + (deliverySlot === 'express' ? 35 * 60 * 1000 : 90 * 60 * 1000),
      };

      setIsSubmitting(false);
      onClose();
      onOrderSuccess(newOrder);
    }, 850);
  };

  return (
    <div
      id="dmart-fullscreen-cart-page"
      className="fixed inset-0 z-50 bg-gray-50 flex flex-col w-full h-full min-h-screen overflow-hidden animate-in fade-in duration-200"
    >
      {/* 1. TOP BAR NAVIGATION */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 sm:px-8 shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Prominent Back Navigation Arrow */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleTopBack}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-800 hover:text-emerald-700 font-bold text-sm transition-all border border-gray-200 hover:border-emerald-300 cursor-pointer shadow-2xs group"
              aria-label={currentStep === 'checkout' ? 'Back to Cart' : 'Back to Store'}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 group-hover:text-emerald-700 transition-colors" />
              <span className="hidden sm:inline">
                {currentStep === 'checkout'
                  ? (isEn ? 'Back to Cart' : 'Kembali ke Troli')
                  : (isEn ? 'Back to Store' : 'Kembali Membeli-belah')}
              </span>
              <span className="sm:hidden">{isEn ? 'Back' : 'Kembali'}</span>
            </button>

            <div className="h-6 w-px bg-gray-200 hidden sm:block" />

            {/* D-Mart Branding & Page Title */}
            <div className="flex items-center gap-2.5">
              <img src="/icon.svg" alt="D-Mart" className="w-7 h-7 rounded-lg shadow-xs hidden sm:block" />
              <div>
                <h1 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">
                  {currentStep === 'checkout'
                    ? (isEn ? 'Checkout & Delivery' : 'Pembayaran & Penghantaran')
                    : (isEn ? 'Shopping Cart' : 'Troli Membeli-belah')}
                </h1>
                <p className="text-[11px] text-gray-500 hidden sm:block">
                  {currentStep === 'checkout'
                    ? (isEn ? 'Step 2 of 2: Confirm address, timeslot & payment' : 'Langkah 2: Sahkan alamat, masa & pembayaran')
                    : `${totalQuantity(items)} ${isEn ? 'items in cart' : 'barang dalam troli'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action: Clear Cart or Halal Badge */}
          <div className="flex items-center gap-3">
            {currentStep === 'cart' && items.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="text-xs text-gray-500 hover:text-red-600 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer"
                title={isEn ? 'Clear all items in cart' : 'Kosongkan troli'}
              >
                <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
                <span className="hidden sm:inline">{isEn ? 'Clear Cart' : 'Kosongkan'}</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isEn ? '100% Halal & Fresh' : '100% Segar & Halal'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. MAIN SCROLLABLE CONTENT AREA */}
      <main
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto w-full bg-gray-50 p-4 sm:p-6 lg:p-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* EMPTY CART VIEW */}
          {items.length === 0 && (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 sm:p-12 bg-white rounded-3xl border border-gray-200 shadow-sm max-w-xl mx-auto my-8">
              <div className="w-24 h-24 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-inner">
                <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                {isEn ? 'Your Cart is Empty' : 'Troli Anda Kosong'}
              </h2>
              <p className="text-sm text-gray-500 max-w-md mb-8">
                {isEn
                  ? 'Looks like you have not added any fresh groceries yet. Explore our daily market items, seasonal fruits, and household essentials!'
                  : 'Nampaknya anda belum menambah barangan runcit. Terokai pilihan pasar segar, sayur-sayuran, dan barangan harian kami!'}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{isEn ? 'Start Shopping Groceries' : 'Mula Membeli-belah'}</span>
              </button>
            </div>
          )}

          {/* ACTIVE CART VIEW (STEP 1: REVIEW ITEMS) */}
          {items.length > 0 && currentStep === 'cart' && (
            <div className="space-y-6">
              {/* Free Delivery Target Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="flex items-center gap-1.5 text-emerald-900">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    {subtotal >= freeDeliveryThreshold ? (
                      <span className="text-emerald-700 font-black">
                        🎉 {isEn ? 'Congratulations! FREE Delivery Unlocked!' : 'Tahniah! Penghantaran PERCUMA Diaktifkan!'}
                      </span>
                    ) : (
                      <span>
                        {isEn
                          ? `Add RM ${remainingForFree.toFixed(2)} more for FREE Delivery (min. RM 60)`
                          : `Tambah RM ${remainingForFree.toFixed(2)} lagi untuk Penghantaran PERCUMA`}
                      </span>
                    )}
                  </span>
                  <span className="text-emerald-700 font-extrabold">{progressPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-emerald-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out shadow-xs"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 2-Column Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Left Column: Items List & Frequently Bought Together (7 cols on lg) */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                  <div className="bg-white rounded-3xl border border-gray-200 shadow-xs divide-y divide-gray-100 overflow-hidden">
                    <div className="p-4 sm:p-5 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-black text-gray-700 uppercase tracking-wider">
                        {isEn ? 'Item Details' : 'Maklumat Barangan'} ({totalQuantity(items)})
                      </span>
                      <span className="text-xs font-bold text-gray-500">
                        {isEn ? 'Price / Quantity' : 'Harga / Kuantiti'}
                      </span>
                    </div>

                    {items.map((item) => {
                      const isBundled = bundledItemIds.has(item.product.id);
                      return (
                        <div
                          key={item.product.id}
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200/70 shadow-2xs">
                              <img
                                src={item.product.image}
                                alt={isEn ? item.product.nameEn : item.product.nameMs}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback product SVG placeholder
                                  (e.target as HTMLImageElement).src =
                                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f3f4f6"/><text x="40" y="44" fill="%239ca3af" font-size="12" font-family="sans-serif" text-anchor="middle">D-mart</text></svg>';
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 truncate">
                                {isEn ? item.product.nameEn : item.product.nameMs}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {item.product.unit} • RM {item.product.price.toFixed(2)}
                              </p>
                              {isBundled && (
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-700" />
                                  <span>{isEn ? 'Bundle Saver' : 'Pakej Jimat'}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stepper & Line Item Subtotal */}
                          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                            <div className="text-right hidden sm:block">
                              <span className="text-xs text-gray-400 block">{isEn ? 'Subtotal' : 'Jumlah'}</span>
                              <span className="font-black text-sm text-gray-900">
                                RM {(item.product.price * item.quantity).toFixed(2)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 bg-gray-100/80 border border-gray-300/80 rounded-xl p-1 shadow-inner">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-white hover:bg-red-50 text-gray-700 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                                aria-label="Decrease quantity"
                              >
                                {item.quantity === 1 ? (
                                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                ) : (
                                  <Minus className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <span className="w-7 text-center text-xs sm:text-sm font-black text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Frequently Bought Together recommendations */}
                  <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs">
                    <FrequentlyBoughtTogether
                      cartItems={items}
                      catalogProducts={catalogProducts}
                      language={language}
                      onAddToCart={handleAddToCartItem}
                    />
                  </div>
                </div>

                {/* Right Column: Sticky Summary & Checkout Card (5 cols on lg) */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-24">
                  {/* Voucher Card */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span>{isEn ? 'Supermarket Voucher' : 'Baucar Pasaraya'}</span>
                    </h3>

                    <form onSubmit={handleApplyVoucherSubmit} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                          placeholder={t.voucherPlaceholder}
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-bold uppercase outline-none transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
                      >
                        {t.applyVoucher}
                      </button>
                    </form>

                    {/* Quick Available Vouchers Chips */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-gray-400 font-bold block">
                        {isEn ? 'Available Coupons:' : 'Kupon Sedia Ada:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
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
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-400 text-emerald-950 border-amber-400 font-black shadow-xs'
                                  : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 border-gray-200'
                              }`}
                            >
                              {v.code} ({isEn ? v.titleEn : v.titleMs})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {voucherMsg && (
                      <p className={`text-xs font-bold ${voucherMsg.success ? 'text-emerald-700' : 'text-red-600'}`}>
                        {voucherMsg.text}
                      </p>
                    )}
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-sm text-gray-900">
                      {isEn ? 'Order Summary' : 'Ringkasan Pesanan'}
                    </h3>

                    <div className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>{t.subtotal}</span>
                        <span className="font-bold text-gray-900">RM {subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>{t.discount}</span>
                          <span>-RM {discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>{t.deliveryFee}</span>
                        <span className="font-bold text-emerald-700">
                          {deliveryFee === 0 ? t.freeDelivery : `RM ${deliveryFee.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-base sm:text-lg font-black text-gray-900">
                        <span>{t.total}</span>
                        <span className="text-xl sm:text-2xl text-emerald-700">RM {total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Smooth CTA to Checkout */}
                    <button
                      type="button"
                      onClick={handleProceedToCheckoutStep}
                      className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 transition-all cursor-pointer group"
                    >
                      <span>{isEn ? 'Proceed to Checkout' : 'Teruskan ke Pembayaran'}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="text-[11px] text-center text-gray-400">
                      {isEn ? 'Guaranteed 2-Hour Express Delivery in Malaysia' : 'Penghantaran Ekspres 2 Jam Dijamin di Malaysia'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHECKOUT & PAYMENT VIEW (STEP 2: FULL-PAGE CHECKOUT) */}
          {items.length > 0 && currentStep === 'checkout' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Stepper Header indicator */}
              <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg text-gray-900">
                      {isEn ? 'Complete Your Malaysian Order' : 'Lengkapkan Pesanan Malaysia Anda'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {isEn
                        ? 'Select payment method, delivery time slot, and confirm delivery address'
                        : 'Pilih kaedah bayaran, masa penghantaran dan sahkan alamat anda'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep('cart')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  {isEn ? 'Edit Cart Items' : 'Ubah Barangan'}
                </button>
              </div>

              {/* Section 1: Pinned Delivery Address */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>{isEn ? 'Delivery Address' : 'Alamat Penghantaran'}</span>
                  </h3>
                  {onOpenMapPicker && (
                    <button
                      type="button"
                      onClick={onOpenMapPicker}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      {isEn ? 'Change Pin / Map' : 'Tukar Pin / Peta'}
                    </button>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-col sm:flex-row justify-between gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="font-black text-gray-900 block text-sm">
                      {deliveryAddress.recipientName} ({deliveryAddress.phone})
                    </span>
                    <p className="text-gray-600 mt-1">
                      {deliveryAddress.buildingUnit ? `${deliveryAddress.buildingUnit}, ` : ''}
                      {deliveryAddress.street}, {deliveryAddress.postcode} {deliveryAddress.city},{' '}
                      {deliveryAddress.state}
                    </p>
                    {deliveryAddress.notes && (
                      <p className="text-emerald-800 italic mt-1.5 font-medium">
                        📝 {deliveryAddress.notes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex items-center">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-[11px]">
                      ✓ Verified Location
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery Slot */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>{isEn ? 'Delivery Time Slot' : 'Waktu Penghantaran'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliverySlot('express')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      deliverySlot === 'express'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs sm:text-sm text-emerald-950">
                        ⚡ {isEn ? 'Super Express' : 'Super Ekspres'}
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                        FAST
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      {isEn ? 'Arrives in 45-90 mins' : 'Sampai dalam 45-90 min'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySlot('evening')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      deliverySlot === 'evening'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="font-extrabold text-xs sm:text-sm text-gray-900 block mb-1">
                      🌅 {isEn ? 'Today Evening' : 'Petang Ini'}
                    </span>
                    <p className="text-[11px] text-gray-500 font-medium">5:00 PM - 8:00 PM</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySlot('tomorrow')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      deliverySlot === 'tomorrow'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="font-extrabold text-xs sm:text-sm text-gray-900 block mb-1">
                      ☀️ {isEn ? 'Tomorrow Morning' : 'Pagi Esok'}
                    </span>
                    <p className="text-[11px] text-gray-500 font-medium">9:00 AM - 1:00 PM</p>
                  </button>
                </div>
              </div>

              {/* Section 3: Payment Method Selection */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{isEn ? 'Payment Method' : 'Kaedah Pembayaran'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      paymentMethod === 'COD'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-bold">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        {isEn ? 'Cash / QR' : 'Tunai / QR'}
                      </span>
                    </div>
                    <div>
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900 block">
                        {isEn ? 'Cash on Delivery' : 'Bayar Semasa Terima'}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {isEn ? 'Pay cash or DuitNow to rider upon delivery' : 'Bayar tunai atau DuitNow kepada rider'}
                      </span>
                    </div>
                  </button>

                  {/* FPX */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('FPX')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      paymentMethod === 'FPX'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 font-black text-xs">
                        FPX
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        Banks
                      </span>
                    </div>
                    <div>
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900 block">
                        {isEn ? 'Online Banking' : 'Perbankan FPX'}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        Maybank2u, CIMB Clicks, Public Bank & more
                      </span>
                    </div>
                  </button>

                  {/* TNG */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TNG')}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                      paymentMethod === 'TNG'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-xs">
                        TnG
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        eWallet
                      </span>
                    </div>
                    <div>
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900 block">
                        Touch &apos;n Go eWallet
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {isEn ? 'Fast payment via TnG phone number' : 'Bayar pantas melalui telefon TnG'}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Sub-inputs based on payment selection */}
                {paymentMethod === 'FPX' && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 mt-3">
                    <label className="text-xs font-bold text-gray-700 block">
                      {isEn ? 'Select Malaysian Bank:' : 'Pilih Bank Malaysia:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {MALAYSIAN_BANKS.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBank(b.id)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                            selectedBank === b.id
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-black'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {b.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {paymentMethod === 'TNG' && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 mt-3">
                    <label className="text-xs font-bold text-gray-700 block">
                      {isEn ? 'Touch n Go Registered Mobile Number:' : 'Nombor Telefon Berdaftar TnG:'}
                    </label>
                    <input
                      type="text"
                      value={tngPhone}
                      onChange={(e) => setTngPhone(e.target.value)}
                      placeholder="012-3456789"
                      className="w-full sm:w-64 px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Section 4: Driver Appreciation Tip & Loyalty Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tip */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <span>{isEn ? 'Rider Appreciation Tip' : 'Tip Penghargaan Rider'}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[0, 2, 5, 10].map((tipAmt) => (
                      <button
                        key={tipAmt}
                        type="button"
                        onClick={() => {
                          setIsCustomTipActive(false);
                          setSelectedTip(tipAmt);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          !isCustomTipActive && selectedTip === tipAmt
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-gray-50 hover:bg-emerald-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {tipAmt === 0 ? (isEn ? 'No Tip' : 'Tiada') : `+RM ${tipAmt}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Loyalty Points */}
                <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-3">
                  <h3 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{isEn ? 'D-mart Loyalty Points' : 'Mata Ganjaran D-mart'}</span>
                  </h3>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                    <div>
                      <span className="text-xs font-black text-amber-950 block">
                        {loyaltyPoints} {isEn ? 'points available' : 'mata sedia ada'}
                      </span>
                      <span className="text-[11px] text-amber-800">
                        {maxRedeemablePoints > 0
                          ? isEn
                            ? `Save RM ${(maxRedeemablePoints / 100).toFixed(2)} instantly`
                            : `Jimat RM ${(maxRedeemablePoints / 100).toFixed(2)} serta-merta`
                          : isEn
                          ? 'Min. 100 points to redeem'
                          : 'Min. 100 mata untuk tebus'}
                      </span>
                    </div>
                    {maxRedeemablePoints > 0 && (
                      <input
                        type="checkbox"
                        checked={useLoyaltyPoints}
                        onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded-md cursor-pointer accent-emerald-600"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Final Order Summary & Place Order */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-5">
                <h3 className="text-base font-black text-gray-900">
                  {isEn ? 'Final Payment Breakdown' : 'Pecahan Bayaran Akhir'}
                </h3>

                <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t.subtotal}</span>
                    <span className="font-bold text-gray-900">RM {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>{t.discount}</span>
                      <span>-RM {discount.toFixed(2)}</span>
                    </div>
                  )}
                  {pointsMonetaryDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>{isEn ? 'Loyalty Points Discount' : 'Diskaun Mata Ganjaran'}</span>
                      <span>-RM {pointsMonetaryDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>{t.deliveryFee}</span>
                    <span className="font-bold text-emerald-700">
                      {deliveryFee === 0 ? t.freeDelivery : `RM ${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  {effectiveTip > 0 && (
                    <div className="flex justify-between text-gray-700 font-medium">
                      <span>{isEn ? 'Rider Appreciation Tip' : 'Tip Rider'}</span>
                      <span>+RM {effectiveTip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-lg sm:text-2xl font-black text-gray-900">
                    <span>{t.total}</span>
                    <span className="text-emerald-700">RM {finalTotalWithTip.toFixed(2)}</span>
                  </div>
                </div>

                {/* Final Submit Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handlePlaceOrder}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-75 text-white font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-600/25 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isEn ? 'Processing Order...' : 'Memproses Pesanan...'}</span>
                    </div>
                  ) : (
                    <>
                      <span>{isEn ? 'Confirm & Place Order' : 'Sahkan & Hantar Pesanan'}</span>
                      <span className="bg-emerald-700/80 px-3 py-1 rounded-xl text-sm font-black">
                        RM {finalTotalWithTip.toFixed(2)}
                      </span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 font-medium pt-2">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Halal Certified</span>
                  </span>
                  <span>•</span>
                  <span>D-Mart Fresh Guarantee</span>
                  <span>•</span>
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

function totalQuantity(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
