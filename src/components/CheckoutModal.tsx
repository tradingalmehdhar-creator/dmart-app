import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Truck,
  HeartHandshake,
  Sparkles
} from 'lucide-react';
import {
  CartItem,
  DeliveryAddress,
  Language,
  Order,
  PaymentMethodType,
  UserProfile
} from '../types';
import { translations, MALAYSIAN_BANKS } from '../data/translations';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  user: UserProfile | null;
  deliveryAddress: DeliveryAddress;
  onOpenMapPicker: () => void;
  onOrderSuccess: (order: Order) => void;
  onRequireAuth?: () => void;
  loyaltyPoints?: number;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  language,
  items,
  subtotal,
  deliveryFee,
  discount,
  total,
  user,
  deliveryAddress,
  onOpenMapPicker,
  onOrderSuccess,
  onRequireAuth,
  loyaltyPoints = 150,
}) => {
  const t = translations[language];

  // Loyalty points redemption state
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState<boolean>(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('COD');
  const [selectedBank, setSelectedBank] = useState<string>('mb2u');
  const [tngPhone, setTngPhone] = useState(user?.phone || '012-3849120');

  // Delivery slot state
  const [deliverySlot, setDeliverySlot] = useState<'express' | 'evening' | 'tomorrow'>('express');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delivery partner gratuity / tip state
  const [selectedTip, setSelectedTip] = useState<number>(2); // Default RM 2.00 appreciation
  const [customTipInput, setCustomTipInput] = useState<string>('');
  const [isCustomTipActive, setIsCustomTipActive] = useState<boolean>(false);

  const effectiveTip = isCustomTipActive
    ? Math.max(0, parseFloat(customTipInput) || 0)
    : selectedTip;

  // Loyalty points calculation: 100 pts = RM 1.00
  const maxRedeemablePoints = Math.min(
    loyaltyPoints,
    Math.floor(Math.max(0, subtotal - discount) * 100)
  );
  const pointsUsed = useLoyaltyPoints && maxRedeemablePoints > 0 ? maxRedeemablePoints : 0;
  const pointsMonetaryDiscount = +(pointsUsed / 100).toFixed(2);
  const remainingPoints = loyaltyPoints - pointsUsed;

  // Points to earn from this order
  const pointsToEarn = items.reduce(
    (acc, item) =>
      acc + (item.product.pointsReward ?? Math.max(1, Math.round(item.product.price))) * item.quantity,
    0
  );

  const payableSubtotal = Math.max(0, subtotal - discount - pointsMonetaryDiscount);
  const finalTotalWithTip = +(payableSubtotal + deliveryFee + effectiveTip).toFixed(2);

  if (!isOpen) return null;

  // Checkout gate safeguard: if user is not authenticated, trigger auth gate
  if (!user || !user.isLoggedIn) {
    if (onRequireAuth) {
      onRequireAuth();
      return null;
    }
  }

  const handleSubmitRegistrationAndOrder = () => {
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
    // Generate secure 4-digit Delivery OTP code assigned specifically to this order
    const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

    const bankObj = MALAYSIAN_BANKS.find((b) => b.id === selectedBank);

    setTimeout(() => {
      const newOrder: Order = {
        id: 'ord-' + Date.now(),
        orderNumber,
        createdAt: new Date().toISOString(),
        items,
        subtotal,
        discount: +(discount + pointsMonetaryDiscount).toFixed(2),
        deliveryFee,
        tip: effectiveTip > 0 ? effectiveTip : undefined,
        total: finalTotalWithTip,
        pointsRedeemed: pointsUsed > 0 ? pointsUsed : undefined,
        pointsDiscount: pointsMonetaryDiscount > 0 ? pointsMonetaryDiscount : undefined,
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
            ? `${language === 'en' ? 'In 45 - 90 minutes' : 'Dalam 45 - 90 minit'}`
            : '5:00 PM - 8:00 PM',
        estimatedDeliveryTimestamp: Date.now() + (deliverySlot === 'express' ? 35 * 60 * 1000 : 90 * 60 * 1000),
      };

      setIsSubmitting(false);
      onOrderSuccess(newOrder);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {t.deliveryRegistration}
              </h3>
              <p className="text-xs text-emerald-100">
                {language === 'en'
                  ? 'Confirm Malaysian address, delivery slot & payment'
                  : 'Sahkan alamat Malaysia, waktu & bayaran'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Section 1: Pinned Delivery Location on Map */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 w-full p-4 border border-emerald-200 bg-emerald-50/70 rounded-xl">
            <div className="flex gap-3 w-full sm:w-auto flex-1">
              <div className="shrink-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center mt-0.5 shadow-2xs">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-xs text-emerald-800 uppercase tracking-wider">
                  📍 {language === 'en' ? 'GOOGLE MAP PINNED LOCATION' : 'LOKASI DITANDAI PETA GOOGLE'}
                </p>
                <h4 className="font-bold text-sm text-gray-900 break-words mt-0.5">
                  {deliveryAddress.recipientName || 'Al-Mehdhar'} ({deliveryAddress.phone || '012-3849120'})
                </h4>
                <p className="text-xs text-gray-600 break-words mt-1 leading-relaxed">
                  {deliveryAddress.formattedAddress || `${deliveryAddress.buildingUnit ? deliveryAddress.buildingUnit + ', ' : ''}${deliveryAddress.street}, ${deliveryAddress.postcode} ${deliveryAddress.city}, ${deliveryAddress.state}`}
                </p>
                {deliveryAddress.notes && (
                  <p className="text-[11px] text-emerald-800 italic mt-1">
                    📝 {deliveryAddress.notes}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenMapPicker}
              className="shrink-0 self-end sm:self-start px-3 py-1.5 text-xs font-bold bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Change Pin / Edit' : 'Tukar Pin / Edit'}
            </button>
          </div>

          {/* Section 2: Delivery Time Slot */}
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              {t.deliverySlot}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDeliverySlot('express')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliverySlot === 'express'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-emerald-950">
                    ⚡ {language === 'en' ? 'Super Express' : 'Super Ekspres'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                    FAST
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  {language === 'en' ? 'Within 45 - 90 mins' : 'Dalam 45 - 90 minit'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySlot('evening')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliverySlot === 'evening'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-gray-900">
                    {language === 'en' ? 'Today Evening' : 'Petang Ini'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">5:00 PM - 8:00 PM</p>
              </button>

              <button
                type="button"
                onClick={() => setDeliverySlot('tomorrow')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  deliverySlot === 'tomorrow'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-gray-900">
                    {language === 'en' ? 'Tomorrow Morning' : 'Pagi Esok'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">9:00 AM - 1:00 PM</p>
              </button>
            </div>
          </div>

          {/* Section 3: Payment Method (COD, FPX, TnG) */}
          <div>
            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {t.paymentMethod}
            </label>

            <div className="space-y-2.5">
              {/* Option 1: Cash on Delivery (COD) */}
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{t.cod}</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          Popular
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{t.codDesc}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600"
                  />
                </div>
              </div>

              {/* Option 2: FPX Online Banking */}
              <div
                onClick={() => setPaymentMethod('FPX')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'FPX'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      FPX
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{t.fpx}</h4>
                        <span className="text-[10px] font-semibold text-gray-500">
                          Maybank, CIMB, PBB, RHB...
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{t.fpxDesc}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'FPX'}
                    onChange={() => setPaymentMethod('FPX')}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600"
                  />
                </div>

                {/* FPX Bank Selector Dropdown */}
                {paymentMethod === 'FPX' && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 animate-in fade-in duration-150">
                    <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                      {t.selectBank}:
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-semibold text-gray-900 outline-none"
                    >
                      {MALAYSIAN_BANKS.map((bank) => (
                        <option key={bank.id} value={bank.id}>
                          🇲🇾 {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Option 3: Touch 'n Go eWallet (TnG) */}
              <div
                onClick={() => setPaymentMethod('TNG')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'TNG'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#005ba4] text-white flex items-center justify-center font-bold text-xs tracking-tighter">
                      TnG
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{t.tng}</h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                          eWallet
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">{t.tngDesc}</p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'TNG'}
                    onChange={() => setPaymentMethod('TNG')}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600"
                  />
                </div>

                {paymentMethod === 'TNG' && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200">
                      <div className="w-16 h-16 bg-white p-1 rounded-lg border border-gray-200 shrink-0 flex items-center justify-center shadow-xs">
                        {/* Simulated DuitNow / TnG QR */}
                        <div className="w-full h-full bg-slate-800 rounded flex flex-col items-center justify-center text-white text-[8px] text-center p-0.5">
                          <span className="font-black text-[9px] text-[#ffc800]">TnG</span>
                          <span>DuitNow QR</span>
                        </div>
                      </div>
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-gray-900">
                          {language === 'en' ? 'Touch \'n Go eWallet Mobile QR' : 'Imbas Kod QR Touch \'n Go'}
                        </p>
                        <p className="text-gray-500 text-[11px] mt-0.5">
                          {language === 'en'
                            ? 'Instant verification on submit with D-mart Merchant ID'
                            : 'Pengesahan segera selepas penghantaran dibuat'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Tipping / Delivery Partner Gratuity Option */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/90 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    <span>{t.tipDeliveryPartner}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-1.5 py-0.2 rounded-full border border-amber-300">
                      100% to Rider
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {t.tipDesc}
                  </p>
                </div>
              </div>
            </div>

            {/* Tip Preset Pills */}
            <div className="grid grid-cols-5 gap-2">
              {/* Option: No Tip */}
              <button
                id="tip-option-0"
                type="button"
                onClick={() => {
                  setSelectedTip(0);
                  setIsCustomTipActive(false);
                  setCustomTipInput('');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !isCustomTipActive && selectedTip === 0
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-gray-700 border-amber-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                {t.noTip}
              </button>

              {/* Preset 1: RM 1 */}
              <button
                id="tip-option-1"
                type="button"
                onClick={() => {
                  setSelectedTip(1);
                  setIsCustomTipActive(false);
                  setCustomTipInput('');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !isCustomTipActive && selectedTip === 1
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-white text-gray-800 border-amber-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                RM 1.00
              </button>

              {/* Preset 2: RM 2 (Popular) */}
              <button
                id="tip-option-2"
                type="button"
                onClick={() => {
                  setSelectedTip(2);
                  setIsCustomTipActive(false);
                  setCustomTipInput('');
                }}
                className={`relative py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !isCustomTipActive && selectedTip === 2
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-white text-gray-800 border-amber-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                <span className="block">RM 2.00</span>
                <span className="text-[8px] font-black uppercase text-amber-200 block leading-none mt-0.5">
                  ⭐ Popular
                </span>
              </button>

              {/* Preset 3: RM 5 */}
              <button
                id="tip-option-5"
                type="button"
                onClick={() => {
                  setSelectedTip(5);
                  setIsCustomTipActive(false);
                  setCustomTipInput('');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  !isCustomTipActive && selectedTip === 5
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-white text-gray-800 border-amber-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                RM 5.00
              </button>

              {/* Option: Custom Tip */}
              <button
                id="tip-option-custom"
                type="button"
                onClick={() => {
                  setIsCustomTipActive(true);
                  if (!customTipInput) setCustomTipInput('3.00');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isCustomTipActive
                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30'
                    : 'bg-white text-gray-800 border-amber-200 hover:border-amber-300 hover:bg-amber-50/50'
                }`}
              >
                {t.customTip}
              </button>
            </div>

            {/* Custom Tip Input field when activated */}
            {isCustomTipActive && (
              <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
                <span className="text-xs font-bold text-amber-900 shrink-0">
                  {language === 'en' ? 'Enter Amount:' : 'Masukkan Jumlah:'}
                </span>
                <div className="relative flex-1 max-w-[140px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                    RM
                  </span>
                  <input
                    id="custom-tip-amount-input"
                    type="number"
                    min="0"
                    step="0.5"
                    value={customTipInput}
                    onChange={(e) => setCustomTipInput(e.target.value)}
                    placeholder="3.00"
                    className="w-full pl-9 pr-2 py-1.5 rounded-lg bg-white border border-amber-300 text-gray-900 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden"
                  />
                </div>
                <span className="text-[11px] text-amber-800 italic">
                  {effectiveTip > 0
                    ? `(RM ${effectiveTip.toFixed(2)} added)`
                    : '(RM 0.00)'}
                </span>
              </div>
            )}

            {effectiveTip > 0 && (
              <p className="text-[11px] text-amber-800 font-semibold flex items-center gap-1.5 pt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{t.thankYouRider}</span>
              </p>
            )}
          </div>

          {/* Section 4.5: Use Loyalty Points for Discount */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border border-amber-300/80 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-4 h-4 fill-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      {t.useLoyaltyPoints}
                    </h4>
                    <span className="text-[10px] bg-amber-200/90 text-amber-950 font-black px-1.5 py-0.2 rounded-full border border-amber-300">
                      {loyaltyPoints} {language === 'en' ? 'pts' : 'mata'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    {loyaltyPoints > 0
                      ? language === 'en'
                        ? `Available: ${loyaltyPoints} pts (Worth RM ${(loyaltyPoints * 0.01).toFixed(2)})`
                        : `Tersedia: ${loyaltyPoints} mata (Nilai RM ${(loyaltyPoints * 0.01).toFixed(2)})`
                      : language === 'en'
                        ? 'Earn points on this order to redeem on your next visit!'
                        : 'Kumpul mata dengan pesanan ini untuk tebus seterusnya!'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              {loyaltyPoints > 0 && maxRedeemablePoints > 0 ? (
                <button
                  type="button"
                  role="switch"
                  id="checkout-use-loyalty-points-toggle"
                  aria-checked={useLoyaltyPoints}
                  onClick={() => setUseLoyaltyPoints((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    useLoyaltyPoints ? 'bg-amber-600' : 'bg-gray-200'
                  }`}
                >
                  <span className="sr-only">Use Loyalty Points</span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      useLoyaltyPoints ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              ) : (
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                  {language === 'en' ? '0 pts' : '0 mata'}
                </span>
              )}
            </div>

            {/* Calculated Discount Breakdown when Active */}
            {useLoyaltyPoints && pointsMonetaryDiscount > 0 && (
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <span className="text-amber-900 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    {language === 'en'
                      ? `Redeeming ${pointsUsed} pts (-RM ${pointsMonetaryDiscount.toFixed(2)})`
                      : `Menebus ${pointsUsed} mata (-RM ${pointsMonetaryDiscount.toFixed(2)})`}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-amber-800">
                  {language === 'en'
                    ? `Remaining: ${remainingPoints} pts`
                    : `Baki: ${remainingPoints} mata`}
                </span>
              </div>
            )}

            {/* Points to Earn From Current Order info */}
            <div className="flex items-center justify-between text-[10.5px] text-amber-800 pt-1 font-medium">
              <span>{language === 'en' ? 'Points to earn from this order:' : 'Mata ganjaran dari pesanan ini:'}</span>
              <span className="font-extrabold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                +{pointsToEarn} {language === 'en' ? 'pts' : 'mata'}
              </span>
            </div>
          </div>

          {/* Section 5: Items & Order Summary */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
            <span className="font-bold text-gray-700 block uppercase tracking-wider">
              {language === 'en' ? 'Order Summary' : 'Ringkasan Pesanan'} ({items.length} {t.items})
            </span>
            <div className="flex justify-between text-gray-600">
              <span>{t.subtotal}</span>
              <span className="font-semibold text-gray-800">RM {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>{t.discount}</span>
                <span className="font-semibold">-RM {discount.toFixed(2)}</span>
              </div>
            )}
            {pointsMonetaryDiscount > 0 && (
              <div className="flex justify-between text-amber-800 font-semibold bg-amber-100/60 -mx-1 px-1.5 py-0.5 rounded">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                  <span>{t.loyaltyDiscount} ({pointsUsed} {language === 'en' ? 'pts' : 'mata'})</span>
                </span>
                <span>-RM {pointsMonetaryDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>{t.deliveryFee}</span>
              <span className="font-semibold text-emerald-700">
                {deliveryFee === 0 ? t.freeDelivery : `RM ${deliveryFee.toFixed(2)}`}
              </span>
            </div>
            {effectiveTip > 0 && (
              <div className="flex justify-between text-amber-800 font-semibold bg-amber-100/60 -mx-1 px-1.5 py-0.5 rounded">
                <span className="flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3 text-amber-600" />
                  <span>{t.driverGratuity}</span>
                </span>
                <span>+RM {effectiveTip.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-900">
              <span>{t.total}</span>
              <span className="text-lg text-emerald-700">RM {finalTotalWithTip.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-gray-500 block">{t.total}:</span>
            <span className="text-base font-black text-emerald-700">RM {finalTotalWithTip.toFixed(2)}</span>
            {effectiveTip > 0 && (
              <span className="text-[10px] text-amber-700 font-medium block leading-tight">
                (incl. RM {effectiveTip.toFixed(2)} tip)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSubmitRegistrationAndOrder}
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-75"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            )}
            <span>
              {isSubmitting
                ? (language === 'en' ? 'Submitting Registration...' : 'Menghantar Pendaftaran...')
                : t.confirmAndSubmit}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
