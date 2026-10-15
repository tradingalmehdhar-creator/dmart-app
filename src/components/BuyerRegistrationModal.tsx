import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Sparkles,
  X,
  ArrowRight,
  Home,
  Check,
  Building,
  Mail,
  Lock,
  ArrowLeft
} from 'lucide-react';
import { Language, UserProfile, DeliveryAddress } from '../types';
import { MALAYSIAN_PRESET_LOCATIONS } from '../data/translations';

interface BuyerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  currentUser: UserProfile | null;
  currentAddress: DeliveryAddress;
  onGoogleSignInSuccess?: (user: UserProfile) => void;
  onCompleteRegistration: (user: UserProfile, address: DeliveryAddress) => void;
  onOpenDeliveryPartnerRegistration: () => void;
  onOpenMapPicker?: () => void;
}

export const BuyerRegistrationModal: React.FC<BuyerRegistrationModalProps> = ({
  isOpen,
  onClose,
  language,
  currentUser,
  currentAddress,
  onGoogleSignInSuccess,
  onCompleteRegistration,
  onOpenDeliveryPartnerRegistration,
  onOpenMapPicker,
}) => {
  const isEn = language === 'en';

  // Step state: 'google_auth' -> 'profile_completion'
  const [step, setStep] = useState<'google_auth' | 'profile_completion'>('google_auth');

  // Google Sign-In state (Clean guest defaults)
  const defaultEmail = currentUser?.email || '';
  const [googleEmail, setGoogleEmail] = useState(defaultEmail);
  const [googleName, setGoogleName] = useState(currentUser?.name || '');
  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // Profile completion state
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phone || currentAddress.phone || '');

  // Address inputs (Clean Malaysian defaults)
  const [street, setStreet] = useState(currentAddress.street || 'Jalan Ampang, KLCC');
  const [buildingUnit, setBuildingUnit] = useState(currentAddress.buildingUnit || '');
  const [postcode, setPostcode] = useState(currentAddress.postcode || '50088');
  const [city, setCity] = useState(currentAddress.city || 'Kuala Lumpur');
  const [state, setState] = useState(currentAddress.state || 'Wilayah Persekutuan Kuala Lumpur');
  const [notes, setNotes] = useState(currentAddress.notes || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state when modal opens or currentUser changes
  useEffect(() => {
    if (isOpen) {
      if (currentUser?.isLoggedIn) {
        setStep('profile_completion');
        if (currentUser.name) setFullName(currentUser.name);
        if (currentUser.email) setGoogleEmail(currentUser.email);
        if (currentUser.phone) setPhoneNumber(currentUser.phone);
      } else {
        setStep('google_auth');
      }
      setValidationError(null);
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Handle Google Sign-In (Firebase / Google Auth gate)
  const handleGoogleSignIn = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSigningInGoogle(true);
    setValidationError(null);

    setTimeout(() => {
      const authenticatedUser: UserProfile = {
        id: currentUser?.id || 'usr-google-' + Date.now(),
        name: (googleName.trim() || 'Google Shopper'),
        email: (googleEmail.trim() || 'shopper@gmail.com'),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleName.trim() || 'Google Shopper')}&backgroundColor=10b981`,
        phone: phoneNumber.trim(),
        isLoggedIn: true,
      };

      if (onGoogleSignInSuccess) {
        onGoogleSignInSuccess(authenticatedUser);
      }

      setFullName(authenticatedUser.name);
      setGoogleEmail(authenticatedUser.email);
      setIsSigningInGoogle(false);
      // Automatically advance to Step 2: Mandatory Profile Completion
      setStep('profile_completion');
    }, 550);
  };

  // Handle Mandatory Profile & Address Submission
  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation: Full Name, Phone Number, and Delivery Address are mandatory
    if (!fullName.trim()) {
      setValidationError(isEn ? 'Full Name is required.' : 'Nama Penuh diperlukan.');
      return;
    }
    if (!phoneNumber.trim()) {
      setValidationError(isEn ? 'Phone Number is required for rider delivery contact.' : 'Nombor Telefon diperlukan untuk penghantaran rider.');
      return;
    }
    if (!street.trim() || !postcode.trim() || !city.trim()) {
      setValidationError(isEn ? 'Please fill in your delivery street, postcode, and city.' : 'Sila isikan jalan, poskod, dan bandar penghantaran anda.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const updatedUser: UserProfile = {
        id: currentUser?.id || 'usr-google-' + Date.now(),
        name: fullName.trim(),
        email: googleEmail.trim(),
        avatar: currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}&backgroundColor=10b981`,
        phone: phoneNumber.trim(),
        isLoggedIn: true,
        profileCompleted: true,
      };

      const updatedAddress: DeliveryAddress = {
        ...currentAddress,
        recipientName: fullName.trim(),
        phone: phoneNumber.trim(),
        street: street.trim(),
        buildingUnit: buildingUnit.trim(),
        postcode: postcode.trim(),
        city: city.trim(),
        state: state.trim(),
        notes: notes.trim(),
        formattedAddress: `${buildingUnit.trim() ? buildingUnit.trim() + ', ' : ''}${street.trim()}, ${postcode.trim()} ${city.trim()}, ${state.trim()}`,
      };

      setIsSubmitting(false);
      onCompleteRegistration(updatedUser, updatedAddress);
    }, 450);
  };

  const handleApplyPreset = (preset: (typeof MALAYSIAN_PRESET_LOCATIONS)[0]) => {
    setStreet(preset.street);
    setPostcode(preset.postcode);
    setCity(preset.city);
    setState(preset.state);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-xs shrink-0">
              {step === 'google_auth' ? (
                <ShieldCheck className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {currentUser?.isLoggedIn
                    ? (isEn ? 'Personal Details & Address' : 'Maklumat Peribadi & Alamat')
                    : (isEn ? 'Guest Checkout Gate' : 'Laluan Pembayaran Tetamu')}
                </span>
                {!currentUser?.isLoggedIn && (
                  <span className="text-emerald-100 text-xs font-semibold">
                    {step === 'google_auth'
                      ? (isEn ? 'Step 1 of 2: Sign In' : 'Langkah 1 drpd 2: Log Masuk')
                      : (isEn ? 'Step 2 of 2: Profile Completion' : 'Langkah 2 drpd 2: Lengkapkan Profil')}
                  </span>
                )}
              </div>
              <h3 className="font-black text-lg sm:text-xl leading-tight">
                {currentUser?.isLoggedIn
                  ? (isEn ? 'Customer Profile & Addresses' : 'Profil Pengguna & Alamat')
                  : step === 'google_auth'
                  ? (isEn ? 'Sign in with Google to Checkout' : 'Log Masuk dengan Google untuk Bayar')
                  : (isEn ? 'Complete Your Delivery Profile' : 'Lengkapkan Maklumat Penghantaran')}
              </h3>
              <p className="text-xs text-emerald-100">
                {currentUser?.isLoggedIn
                  ? (isEn
                      ? 'Personal account details & doorstep delivery addresses'
                      : 'Maklumat akaun peribadi & alamat penghantaran pintu rumah')
                  : step === 'google_auth'
                  ? (isEn ? 'Authenticate with Google to secure your grocery order' : 'Sahkan dengan Google untuk melindungi pesanan runcit anda')
                  : (isEn ? 'Mandatory contact & doorstep address for rider drop-off' : 'Nama, nombor telefon, dan alamat untuk penghantaran rider')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar (Hidden when logged-in user is editing profile) */}
        {!currentUser?.isLoggedIn && (
          <div className="bg-emerald-50/70 border-b border-emerald-100 px-5 py-2.5 flex items-center justify-between text-xs">
            {/* Step 1 Chip */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 'google_auth'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                {currentUser?.isLoggedIn ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span
                className={`font-bold ${
                  step === 'google_auth' ? 'text-emerald-900 font-black' : 'text-gray-600'
                }`}
              >
                {isEn ? '1. Google Sign-In' : '1. Log Masuk Google'}
              </span>
            </div>

            <div className="h-0.5 w-8 bg-emerald-200" />

            {/* Step 2 Chip */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === 'profile_completion'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
              <span
                className={`font-bold ${
                  step === 'profile_completion' ? 'text-emerald-900 font-black' : 'text-gray-500'
                }`}
              >
                {isEn ? '2. Mandatory Profile' : '2. Lengkapkan Profil'}
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: GOOGLE AUTHENTICATION */}
          {/* ========================================================================= */}
          {step === 'google_auth' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gray-50 border border-gray-200 mb-2.5 shadow-xs">
                  <svg className="w-9 h-9" viewBox="0 0 24 24">
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
                </div>
                <h4 className="text-base font-black text-gray-900">
                  {isEn ? 'Google Authentication Required' : 'Pengesahan Google Diperlukan'}
                </h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  {isEn
                    ? 'To protect your grocery delivery and enable live runner tracking, please sign in with your Google account.'
                    : 'Untuk melindungi penghantaran runcit dan mengaktifkan penjejakan rider, sila log masuk dengan akaun Google anda.'}
                </p>
              </div>

              {/* 1-Tap Quick Google Sign-In Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    {isEn ? 'Recommended 1-Click Sign-In' : 'Log Masuk Pantas Disyorkan'}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-black px-2 py-0.5 rounded-full">
                    Instant
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {googleName.trim().charAt(0).toUpperCase() || 'G'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {googleName.trim() || (isEn ? 'Google Account' : 'Akaun Google')}
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                    <span className="text-[11px] text-gray-500 block truncate">
                      {googleEmail.trim() || (isEn ? 'Instant 1-Click Verification' : 'Pengesahan Pantas 1-Klik')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleSignIn()}
                  disabled={isSigningInGoogle}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSigningInGoogle ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isEn ? 'Connecting with Google...' : 'Menyambung dengan Google...'}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#FFFFFF"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
                        />
                      </svg>
                      <span>
                        {googleName.trim()
                          ? (isEn ? `Continue as ${googleName.trim()}` : `Teruskan sebagai ${googleName.trim()}`)
                          : (isEn ? 'Continue with Google' : 'Teruskan dengan Google')}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Custom Google Account Alternative */}
              <div className="pt-1">
                {!showCustomGoogleInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(true)}
                    className="w-full text-center text-xs font-semibold text-gray-500 hover:text-emerald-700 transition-colors py-1"
                  >
                    {isEn ? 'Use another Google account →' : 'Gunakan akaun Google lain →'}
                  </button>
                ) : (
                  <form onSubmit={handleGoogleSignIn} className="space-y-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                    <span className="text-xs font-bold text-gray-800 block">
                      {isEn ? 'Enter Google Account Details' : 'Masukkan Maklumat Akaun Google'}
                    </span>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Google Email
                      </label>
                      <input
                        type="email"
                        required
                        value={googleEmail}
                        onChange={(e) => setGoogleEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        {isEn ? 'Display Name' : 'Nama Paparan'}
                      </label>
                      <input
                        type="text"
                        required
                        value={googleName}
                        onChange={(e) => setGoogleName(e.target.value)}
                        placeholder="e.g. Siti Aminah"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSigningInGoogle}
                      className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {isSigningInGoogle ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>{isEn ? 'Sign In with This Google Account' : 'Log Masuk dengan Akaun Ini'}</span>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Trust & Security Notes */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                  <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isEn ? 'Secure Firebase OAuth' : 'OAuth Firebase Selamat'}</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isEn ? 'No Passwords Required' : 'Tiada Kata Laluan'}</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: MANDATORY PROFILE COMPLETION */}
          {/* ========================================================================= */}
          {step === 'profile_completion' && (
            <form onSubmit={handleSubmitProfile} className="space-y-4">
              {/* Connected Google Account Header Pill */}
              <div className="p-3 bg-gradient-to-r from-gray-50 to-emerald-50/50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-2xs shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 truncate">{googleEmail}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-md">
                        ✓ Verified
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 block">
                      {isEn ? 'Google Account Connected' : 'Akaun Google Disahkan'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('google_auth')}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline shrink-0"
                >
                  {isEn ? 'Change' : 'Tukar'}
                </button>
              </div>

              {/* Full Name & Phone Number (MANDATORY) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isEn ? 'Full Name' : 'Nama Penuh'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      {isEn ? 'Mandatory' : 'Wajib'}
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isEn ? "e.g. Ahmad Razak" : "cth. Ahmad Razak"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isEn ? 'Phone Number (WhatsApp)' : 'Nombor Telefon'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      {isEn ? 'Mandatory' : 'Wajib'}
                    </span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 012-3456789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
                  />
                  <span className="text-[10px] text-gray-500 block">
                    {isEn ? 'Used by rider for doorstep delivery arrival calls' : 'Digunakan rider untuk panggilan ketibaan pesanan'}
                  </span>
                </div>
              </div>

              {/* Delivery Address Section (MANDATORY) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isEn ? 'Delivery Address' : 'Alamat Penghantaran'}</span>
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                      {isEn ? '(Mandatory)' : '(Wajib)'}
                    </span>
                  </label>

                  {onOpenMapPicker && (
                    <button
                      type="button"
                      onClick={onOpenMapPicker}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 underline"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{isEn ? 'Pin on Google Map' : 'Pilih di Peta'}</span>
                    </button>
                  )}
                </div>

                {/* Street & Building / Unit */}
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder={isEn ? 'Street name / residential area (e.g. Jalan Tun Razak)' : 'Nama jalan / kawasan perumahan'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={buildingUnit}
                      onChange={(e) => setBuildingUnit(e.target.value)}
                      placeholder={isEn ? 'Unit / House No. (e.g. B-12-05)' : 'No. Rumah / Unit'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
                    />

                    <input
                      type="text"
                      required
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value)}
                      placeholder={isEn ? 'Postcode (e.g. 55100)' : 'Poskod'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
                    />

                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={isEn ? 'City (e.g. Kuala Lumpur)' : 'Bandar'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
                    />
                  </div>

                  {/* Delivery drop-off notes */}
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={isEn ? 'Delivery instructions (e.g. Leave at guardhouse / Ring bell)' : 'Arahan penghantaran (cth: Tinggalkan di pondok guard)'}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-emerald-500 focus:bg-white text-xs font-medium outline-none transition-all"
                  />
                </div>

                {/* Quick preset locations */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                  <span className="text-[10px] text-gray-400 font-semibold shrink-0">
                    {isEn ? 'Quick Cities:' : 'Bandar Pantas:'}
                  </span>
                  {MALAYSIAN_PRESET_LOCATIONS.slice(0, 4).map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleApplyPreset(p)}
                      className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-emerald-50 text-[10px] text-gray-700 hover:text-emerald-700 font-medium whitespace-nowrap border border-gray-200 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Profile & Proceed to Checkout */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>{isEn ? 'Saving Profile & Address...' : 'Menyimpan Profil & Alamat...'}</span>
                  ) : (
                    <>
                      <span>{isEn ? 'Save Profile & Proceed to Checkout' : 'Simpan Profil & Teruskan Pesanan'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
