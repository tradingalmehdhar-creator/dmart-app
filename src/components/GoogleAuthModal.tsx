import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Mail, User, Phone, LogOut, Bike, Trash2, AlertTriangle, Sparkles, History, Award } from 'lucide-react';
import { UserProfile, Language, DeliveryPartnerApplication, Order, GamificationBadge } from '../types';
import { LoyaltyTierBadge } from './LoyaltyTierBadge';
import { LoyaltyTierProgressSection } from './LoyaltyTierProgressSection';
import { GamificationBadgesSection } from './GamificationBadgesSection';
import { computeUserBadges } from '../utils/gamificationBadges';
import { translations } from '../data/translations';
import { deleteUserAccountFromFirestore, executeStrictSignOut } from '../firebase_config';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  user: UserProfile | null;
  onLogin: (profile: UserProfile) => void;
  onLogout: () => void;
  defaultEmail?: string;
  deliveryApplication?: DeliveryPartnerApplication | null;
  onOpenDeliveryPartnerRegistration?: () => void;
  onOpenDeliveryStatus?: () => void;
  onOpenBuyerProfile?: () => void;
  onOpenShareApp?: () => void;
  isRiderIntent?: boolean;
  onOpenAdminAuth?: () => void;
  loyaltyPoints?: number;
  onOpenLoyaltyModal?: () => void;
  onOpenLoyaltyHistory?: () => void;
  orders?: Order[];
  badges?: GamificationBadge[];
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  language,
  user,
  onLogin,
  onLogout,
  defaultEmail = 'tradingalmehdhar@gmail.com',
  deliveryApplication,
  onOpenDeliveryPartnerRegistration,
  onOpenDeliveryStatus,
  onOpenBuyerProfile,
  onOpenShareApp,
  isRiderIntent = false,
  onOpenAdminAuth,
  loyaltyPoints = 150,
  onOpenLoyaltyModal,
  onOpenLoyaltyHistory,
  orders = [],
  badges,
}) => {
  const t = translations[language];
  const isEn = language === 'en';
  const effectiveBadges = badges || computeUserBadges(orders, loyaltyPoints, user);
  const [selectedEmail, setSelectedEmail] = useState(defaultEmail);
  const [customName, setCustomName] = useState('Al-Mehdhar');
  const [phone, setPhone] = useState('012-3849120');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    setTimeout(() => {
      onLogin({
        id: 'usr-google-' + Date.now(),
        name: customName.trim() || 'Google Shopper',
        email: selectedEmail.trim(),
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName || 'User')}&backgroundColor=10b981`,
        phone: phone.trim(),
        isLoggedIn: true
      });
      setIsSigningIn(false);
      onClose();
    }, 600);
  };

  const handleStrictSignOut = async () => {
    await executeStrictSignOut();
    onLogout();
    onClose();
  };

  const handlePermanentAccountDeletion = async () => {
    if (!user?.email) return;
    setIsDeletingAccount(true);
    await deleteUserAccountFromFirestore(user.email);
    await executeStrictSignOut();
    setIsDeletingAccount(false);
    setShowDeleteModal(false);
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md sm:max-w-xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {user?.isLoggedIn
                  ? (isEn ? 'Customer Profile & Addresses' : 'Profil Pengguna & Alamat')
                  : t.signInWithGoogle}
              </h3>
              <p className="text-xs text-emerald-100">
                {user?.isLoggedIn
                  ? (isEn
                      ? 'Personal account details & doorstep delivery addresses'
                      : 'Maklumat akaun peribadi & alamat penghantaran pintu rumah')
                  : t.googleSignInDesc}
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {user?.isLoggedIn ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-14 h-14 rounded-full border-2 border-emerald-500 shadow-sm"
                />
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-base">{user.name}</h4>
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <LoyaltyTierBadge
                      points={loyaltyPoints}
                      language={language}
                      size="xs"
                      showTooltip={true}
                    />
                  </div>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    📞 {user.phone || '012-3849120'}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">
                  {isEn ? 'Verified Account Benefits:' : 'Faedah Akaun Disahkan:'}
                </p>
                <p>• {isEn ? 'Fast 1-click delivery checkout' : 'Pembayaran pantas 1-klik'}</p>
                <p>• {isEn ? 'Live GPS runner tracking' : 'Penjejakan rider GPS masa nyata'}</p>
                <p>• {isEn ? 'Direct Cash on Delivery (COD) eligible' : 'Layak untuk bayaran tunai waktu terima (COD)'}</p>
              </div>

              {/* D-mart Loyalty Rewards Points Card with Visual Tier Badge */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50 rounded-xl border border-amber-200/90 flex flex-col gap-2.5 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                      <Sparkles className="w-5 h-5 fill-white text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-amber-950 block truncate">
                          {isEn ? 'D-mart Loyalty Points' : 'Mata Ganjaran D-mart'}
                        </span>
                        <LoyaltyTierBadge
                          points={loyaltyPoints}
                          language={language}
                          size="xs"
                          showTooltip={true}
                        />
                      </div>
                      <span className="text-[11px] text-amber-800 block truncate">
                        {isEn
                          ? `Worth RM ${(loyaltyPoints * 0.01).toFixed(2)} at checkout`
                          : `Nilai RM ${(loyaltyPoints * 0.01).toFixed(2)} semasa bayaran`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-950 block leading-tight">
                        {loyaltyPoints} <span className="text-[10px] font-bold text-amber-700">{isEn ? 'pts' : 'mata'}</span>
                      </span>
                      <span className="text-[9.5px] font-semibold text-emerald-700">
                        {isEn ? 'Redeemable' : 'Boleh Ditebus'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onOpenLoyaltyHistory && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenLoyaltyHistory();
                          }}
                          className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 font-bold text-[11px] rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <History className="w-3 h-3 text-blue-600" />
                          <span>{isEn ? 'History' : 'Sejarah'}</span>
                        </button>
                      )}
                      {onOpenLoyaltyModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenLoyaltyModal();
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg transition-colors shadow-2xs cursor-pointer"
                        >
                          {isEn ? 'Perks' : 'Faedah'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tier quick benefit indicator banner */}
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[10.5px] text-amber-900">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-950">
                      {isEn ? 'Member Tier:' : 'Tahap Keahlian:'}
                    </span>
                    <LoyaltyTierBadge
                      points={loyaltyPoints}
                      language={language}
                      size="sm"
                      showTooltip={true}
                    />
                  </div>
                  <span className="text-[10px] text-amber-800 hidden xs:inline">
                    {isEn ? 'Tap badge for tier perks ℹ️' : 'Ketik lencana untuk faedah ℹ️'}
                  </span>
                </div>
              </div>

              {/* 1. Sleek Tier Progress Bar & 2. Tier Benefit Cards */}
              <LoyaltyTierProgressSection
                points={loyaltyPoints}
                language={language}
                showCards={true}
              />

              {/* 3. Achievement Badges & Quests Section */}
              <div className="p-3.5 bg-white rounded-xl border border-gray-200/90 shadow-2xs">
                <GamificationBadgesSection
                  badges={effectiveBadges}
                  language={language}
                  compact={false}
                />
              </div>

              {/* Customer Profile & Address Settings Card */}
              {onOpenBuyerProfile && (
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      {isEn ? 'Customer Profile & Addresses' : 'Profil Pengguna & Alamat'}
                    </span>
                    <span className="text-[11px] text-emerald-700 block">
                      {isEn
                        ? 'Personal account details & doorstep delivery addresses'
                        : 'Maklumat peribadi & alamat penghantaran pintu rumah'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBuyerProfile();
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
                  >
                    {isEn ? 'Edit Profile' : 'Ubah Profil'}
                  </button>
                </div>
              )}

              {/* Action Buttons: Continue, Sign Out, Delete Account */}
              <div className="pt-2 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer"
                  >
                    {isEn ? 'Continue Shopping' : 'Teruskan Membeli-belah'}
                  </button>
                  <button
                    type="button"
                    onClick={handleStrictSignOut}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors cursor-pointer"
                    title={isEn ? 'Sign Out & Clear Session' : 'Log Keluar & Kosongkan Sesi'}
                  >
                    <LogOut className="w-4 h-4 text-gray-600" />
                    <span>{t.signOut}</span>
                  </button>
                </div>

                {/* Account Deletion Compliance Button (Apple App Store / Google Play Compliance) */}
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>{isEn ? 'Delete Account (Permanent)' : 'Padam Akaun (Kekal)'}</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              {isRiderIntent && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5 text-xs text-amber-950 font-bold shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center shrink-0">
                    <Bike className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-amber-950 font-extrabold">
                      {isEn ? 'Rider Orders Access' : 'Akses Pesanan Rider'}
                    </span>
                    <span className="text-[11px] font-normal text-amber-900">
                      {isEn
                        ? 'Sign in with Google to continue to Rider Registration & Orders.'
                        : 'Log masuk Google untuk teruskan ke Pendaftaran & Pesanan Rider.'}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-center pb-2">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gray-50 border border-gray-100 mb-2">
                  <svg className="w-8 h-8" viewBox="0 0 24 24">
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
                <h4 className="text-base font-bold text-gray-900">
                  {isEn ? 'Register with your Google Account' : 'Daftar dengan Akaun Google'}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {isEn
                    ? 'No passwords needed. One click to access delivery registration and orders.'
                    : 'Pantas & selamat tanpa perlu kata laluan rumit.'}
                </p>
              </div>

              {/* Account Quick Select */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      Google Email
                    </span>
                  </label>
                  <input
                    type="email"
                    required
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-gray-900 outline-none"
                    placeholder="name@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {isEn ? 'Your Name' : 'Nama Anda'}
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-gray-900 outline-none"
                    placeholder="e.g. Al-Mehdhar"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {t.recipientPhone}
                    </span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm text-gray-900 outline-none"
                    placeholder="012-3849120"
                  />
                </div>
              </div>

              {/* Submit Google Login */}
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full mt-2 flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all disabled:opacity-75 cursor-pointer"
              >
                {isSigningIn ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
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
                )}
                <span>
                  {isSigningIn
                    ? (isEn ? 'Signing in with Google...' : 'Mendaftar dengan Google...')
                    : (isEn ? 'Continue with Google' : 'Teruskan dengan Google')}
                </span>
              </button>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-center text-xs">
                <span className="text-[11px] text-gray-400">
                  🔒 {isEn ? 'Secured by Google & Firebase' : 'Dilindungi oleh Google & Firebase'}
                </span>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-base">
                  {isEn ? 'Permanently Delete Account?' : 'Padam Akaun Secara Kekal?'}
                </h4>
                <p className="text-[11px] text-gray-500">
                  {isEn ? 'This action cannot be undone.' : 'Tindakan ini tidak boleh diundur.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              {isEn
                ? 'Your personal profile, phone number, saved delivery addresses, and cached data will be permanently wiped from Firebase Auth and Firestore.'
                : 'Profil peribadi, nombor telefon, alamat penghantaran, dan data anda akan dipadam sepenuhnya daripada Firebase dan storan setempat.'}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={handlePermanentAccountDeletion}
                disabled={isDeletingAccount}
                className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isEn ? 'Confirm Delete' : 'Sahkan Padam'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
