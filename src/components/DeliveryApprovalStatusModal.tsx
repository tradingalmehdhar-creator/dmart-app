import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  MapPin,
  Bike,
  Car,
  X,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Store,
  Sparkles,
  Zap,
  Filter,
  Check,
  RotateCcw,
  Wallet,
  Package,
  UserCog,
  LogOut,
  Compass,
  Save,
  Menu,
  ChevronDown,
  ChevronRight,
  Banknote,
  Building2
} from 'lucide-react';
import { DeliveryPartnerApplication, DeliveryJobOrder, Language } from '../types';
import { DeliveryOrderCard } from './DeliveryOrderCard';
import { RiderEarningsDashboard } from './RiderEarningsDashboard';
import { syncRiderToFirestore, updateRiderLandingPreferenceInFirestore } from '../firebase_config';

interface DeliveryApprovalStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: DeliveryPartnerApplication | null;
  language: Language;
  onApproveApplication: () => void;
  onToggleStatus: () => void;
  deliveryOrders: DeliveryJobOrder[];
  onAcceptOrder: (order: DeliveryJobOrder) => void;
  onViewOrderDetails: (order: DeliveryJobOrder) => void;
  onUpdateApplication?: (updated: DeliveryPartnerApplication) => void;
  onRiderSignOut?: () => void;
}

export const DeliveryApprovalStatusModal: React.FC<DeliveryApprovalStatusModalProps> = ({
  isOpen,
  onClose,
  application,
  language,
  onApproveApplication,
  onToggleStatus,
  deliveryOrders,
  onAcceptOrder,
  onViewOrderDetails,
  onUpdateApplication,
  onRiderSignOut,
}) => {
  const [currentView, setCurrentView] = useState<'orders' | 'earnings'>('orders');
  const [isMenuDropdownOpen, setIsMenuDropdownOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'express' | 'cod'>('all');
  const [showApplicationDetails, setShowApplicationDetails] = useState(false);
  const [isDefaultLanding, setIsDefaultLanding] = useState<boolean>(() => {
    return localStorage.getItem('dmart_rider_default_landing') === 'true';
  });

  // Rider Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState(application?.fullName || '');
  const [editPhone, setEditPhone] = useState(application?.phoneNumber || '');
  const [editVehicleType, setEditVehicleType] = useState<DeliveryPartnerApplication['vehicleType']>(
    application?.vehicleType || 'motorcycle'
  );
  const [editPlateNumber, setEditPlateNumber] = useState(application?.plateNumber || '');
  // Bank Account & IBAN Details Configured in Rider Profile
  const [editBankName, setEditBankName] = useState(application?.bankName || 'Maybank (Malayan Banking Berhad)');
  const [editAccountHolder, setEditAccountHolder] = useState(
    application?.accountHolder || application?.fullName || 'Muhammad Faiz bin Kamarudin'
  );
  const [editAccountNumber, setEditAccountNumber] = useState(application?.accountNumber || '5140 8821 9402');
  const [editIban, setEditIban] = useState(application?.iban || 'MY24MBBE514088219402');

  useEffect(() => {
    if (application) {
      setEditFullName(application.fullName || '');
      setEditPhone(application.phoneNumber || '');
      setEditVehicleType(application.vehicleType || 'motorcycle');
      setEditPlateNumber(application.plateNumber || '');
      setEditBankName(application.bankName || 'Maybank (Malayan Banking Berhad)');
      setEditAccountHolder(application.accountHolder || application.fullName || 'Muhammad Faiz bin Kamarudin');
      setEditAccountNumber(application.accountNumber || '5140 8821 9402');
      setEditIban(application.iban || 'MY24MBBE514088219402');
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const isEn = language === 'en';
  const isApproved = application.status === 'approved';

  // Available orders for the approved rider
  const filteredOrders = deliveryOrders.filter((o) => {
    if (activeFilter === 'express') return o.urgency === 'express';
    if (activeFilter === 'cod') return o.paymentMethod === 'cod';
    return true;
  });

  const availableCount = deliveryOrders.filter((o) => o.status === 'available').length;
  const acceptedOrders = deliveryOrders.filter((o) => o.status === 'accepted' || o.status === 'picked_up' || o.status === 'out_for_delivery');
  const completedOrders = deliveryOrders.filter((o) => o.status === 'delivered');
  const totalEarnings = completedOrders.reduce((sum, o) => sum + o.earningsPayout, 0);

  const handleToggleDefaultLanding = () => {
    const nextVal = !isDefaultLanding;
    setIsDefaultLanding(nextVal);
    try {
      localStorage.setItem('dmart_rider_default_landing', nextVal ? 'true' : 'false');
    } catch {}
    updateRiderLandingPreferenceInFirestore(application.id, nextVal);
  };

  const handleSaveRiderProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: DeliveryPartnerApplication = {
      ...application,
      fullName: editFullName.trim() || application.fullName,
      phoneNumber: editPhone.trim() || application.phoneNumber,
      vehicleType: editVehicleType,
      plateNumber: editPlateNumber.trim().toUpperCase() || application.plateNumber,
      bankName: editBankName.trim() || application.bankName,
      accountHolder: editAccountHolder.trim() || application.accountHolder,
      accountNumber: editAccountNumber.trim() || application.accountNumber,
      iban: editIban.trim() || application.iban,
    };
    try {
      localStorage.setItem('dmart_rider_app', JSON.stringify(updated));
    } catch {}
    syncRiderToFirestore(updated, isDefaultLanding);
    if (onUpdateApplication) {
      onUpdateApplication(updated);
    }
    setIsEditProfileOpen(false);
  };

  const handleRiderExit = () => {
    try {
      localStorage.removeItem('dmart_rider_app');
      localStorage.removeItem('dmart_rider_default_landing');
    } catch {}
    if (onRiderSignOut) {
      onRiderSignOut();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={`p-4 sm:p-5 text-white flex items-center justify-between transition-colors ${
          isApproved
            ? 'bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800'
            : 'bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-xs shrink-0">
              {isApproved ? (
                <Bike className="w-6 h-6 text-amber-300" />
              ) : (
                <Clock className="w-6 h-6 text-white animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {isEn ? 'D-mart Fleet Partner' : 'Rakan Penghantar D-mart'}
                </span>
                <span className="text-amber-200 text-xs font-mono">{application.referenceNo}</span>
                {isApproved && (
                  <span className="bg-emerald-400/30 text-emerald-100 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300/40">
                    🟢 {isEn ? 'Approved & Active' : 'Diluluskan & Aktif'}
                  </span>
                )}
              </div>
              <h3 className="font-black text-lg sm:text-xl leading-tight">
                {isApproved
                  ? (isEn ? 'Delivery Partner Portal' : 'Portal Rakan Penghantar')
                  : (isEn ? 'Application Submitted' : 'Permohonan Dihantar')}
              </h3>
              <p className="text-xs text-white/90">
                {isApproved
                  ? (isEn ? `Ready to accept dispatch orders • Plate: ${application.plateNumber}` : `Sedia terima pesanan • No Plat: ${application.plateNumber}`)
                  : (isEn ? 'Waiting for Fleet Management Approval' : 'Menunggu Kelulusan Pihak Pengurusan Fleet')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            {isApproved && (
              <>
                {/* Delivery Portal Menu Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    id="btn-rider-portal-menu"
                    onClick={() => setIsMenuDropdownOpen(!isMenuDropdownOpen)}
                    className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-xl transition-colors border border-white/25 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title={isEn ? 'Portal Menu & Navigation' : 'Menu & Navigasi Portal'}
                  >
                    <Menu className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Portal Menu' : 'Menu Portal'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isMenuDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu Popup */}
                  {isMenuDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-1.5 z-50 text-gray-800 animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setIsMenuDropdownOpen(false)}
                    >
                      {/* Menu item 1: Dispatch Orders */}
                      <button
                        type="button"
                        onClick={() => setCurrentView('orders')}
                        className={`w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                          currentView === 'orders' ? 'bg-emerald-50 text-emerald-900 font-black' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{isEn ? 'Dispatch Orders' : 'Senarai Pesanan'}</div>
                          <span className="text-[10px] text-gray-400 font-normal">
                            {deliveryOrders.length} {isEn ? 'orders available' : 'pesanan sedia'}
                          </span>
                        </div>
                        {currentView === 'orders' && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>

                      {/* Menu item 2 (Requested): "My Earnings & Payouts" */}
                      <button
                        type="button"
                        id="menu-item-my-earnings-payouts"
                        onClick={() => setCurrentView('earnings')}
                        className={`w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                          currentView === 'earnings' ? 'bg-amber-50 text-amber-950 font-black' : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Wallet className="w-4 h-4 text-amber-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 truncate">
                            {isEn ? 'My Earnings & Payouts' : 'Gaji & Pengeluaran Saya'}
                          </div>
                          <span className="text-[10px] text-emerald-700 font-mono font-bold">
                            RM {totalEarnings.toFixed(2)}
                          </span>
                        </div>
                        {currentView === 'earnings' && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      </button>

                      <div className="my-1 border-t border-gray-100" />

                      {/* Edit Profile & Saved Bank Details */}
                      <button
                        type="button"
                        onClick={() => setIsEditProfileOpen(true)}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-gray-50 text-gray-700 flex items-center gap-2.5 cursor-pointer"
                      >
                        <UserCog className="w-4 h-4 text-gray-500 shrink-0" />
                        <span className="truncate">{isEn ? 'Edit Profile & Bank Info' : 'Ubah Profil & Maklumat Bank'}</span>
                      </button>

                      {/* Toggle Default Landing */}
                      <button
                        type="button"
                        onClick={handleToggleDefaultLanding}
                        className="w-full px-3.5 py-2 text-left text-xs font-semibold hover:bg-gray-50 text-gray-700 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Compass className="w-4 h-4 text-gray-500 shrink-0" />
                          <span className="truncate">{isEn ? 'Default Landing' : 'Laman Utama'}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isDefaultLanding ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isDefaultLanding ? 'ON' : 'OFF'}
                        </span>
                      </button>

                      <div className="my-1 border-t border-gray-100" />

                      {/* Sign Out */}
                      <button
                        type="button"
                        onClick={handleRiderExit}
                        className="w-full px-3.5 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                        <span>{isEn ? 'Sign Out Rider' : 'Log Keluar Rider'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit Profile Button */}
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(true)}
                  className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-2.5 py-1.5 rounded-xl transition-colors border border-white/25 hidden md:flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title={isEn ? 'Edit Driver Profile & Vehicle' : 'Ubah Profil & Kenderaan'}
                >
                  <UserCog className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isEn ? 'Edit Profile' : 'Ubah Profil'}</span>
                </button>

                {/* Set as Default Landing Page Toggle */}
                <button
                  type="button"
                  onClick={handleToggleDefaultLanding}
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all border hidden lg:flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isDefaultLanding
                      ? 'bg-amber-400 text-emerald-950 border-amber-300 ring-2 ring-amber-300/40'
                      : 'bg-white/15 hover:bg-white/25 text-white border-white/25'
                  }`}
                  title={
                    isEn
                      ? 'Toggle whether D-mart opens directly to Rider Portal on startup'
                      : 'Buka terus ke Portal Rider semasa app dimulakan'
                  }
                >
                  <Compass className={`w-3.5 h-3.5 ${isDefaultLanding ? 'text-emerald-950' : 'text-amber-200'}`} />
                  <span className="hidden xl:inline">
                    {isEn ? 'Default Landing:' : 'Laman Utama:'}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded-full ${
                    isDefaultLanding ? 'bg-emerald-900 text-white' : 'bg-white/30 text-white'
                  }`}>
                    {isDefaultLanding ? 'ON' : 'OFF'}
                  </span>
                </button>

                {/* Dedicated Rider Sign Out Button */}
                <button
                  type="button"
                  onClick={handleRiderExit}
                  className="text-xs bg-red-500/80 hover:bg-red-600 text-white font-bold px-2.5 py-1.5 rounded-xl transition-colors border border-red-300/50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title={isEn ? 'Sign Out & End Rider Session' : 'Log Keluar Sesi Rider'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isEn ? 'Sign Out' : 'Keluar'}</span>
                </button>
              </>
            )}

            {/* Status toggle for easy testing */}
            <button
              type="button"
              onClick={onToggleStatus}
              title={isEn ? 'Toggle status for testing' : 'Tukar status untuk ujian'}
              className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-bold px-2 py-1 rounded-lg transition-colors border border-white/25 hidden lg:flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isApproved ? (isEn ? 'Test Pending' : 'Uji Menunggu') : (isEn ? 'Instant Approve' : 'Luluskan Segera')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= APPROVED DELIVERY PARTNER VIEW ================= */}
        {isApproved ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Driver Summary & Earnings Card */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/80 border border-emerald-200 p-3.5 sm:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                  {application.vehicleType === 'motorcycle' ? <Bike className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-900">{application.fullName}</h4>
                    <span className="font-mono text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                      {application.plateNumber}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    {isEn ? 'Dispatch Hub: Mid Valley / KL Central' : 'Hab Penghantaran: Mid Valley / KL Central'}
                  </p>
                </div>
              </div>

              {/* Wallet / Earnings badge (clickable to switch to My Earnings & Payouts) */}
              <button
                type="button"
                onClick={() => setCurrentView('earnings')}
                className={`text-right px-3 py-1.5 rounded-xl border shadow-xs transition-all cursor-pointer ${
                  currentView === 'earnings'
                    ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-300'
                    : 'bg-white hover:bg-emerald-50 border-emerald-100 text-gray-900'
                }`}
                title={isEn ? 'View My Earnings & Payouts' : 'Lihat Gaji & Pengeluaran Saya'}
              >
                <div className={`text-[10px] font-semibold uppercase flex items-center justify-end gap-1 ${
                  currentView === 'earnings' ? 'text-emerald-100' : 'text-gray-500'
                }`}>
                  <span>{isEn ? 'Today Earnings' : 'Gaji Hari Ini'}</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </div>
                <div className={`font-black text-sm font-mono ${
                  currentView === 'earnings' ? 'text-white' : 'text-emerald-700'
                }`}>
                  RM {totalEarnings.toFixed(2)}
                </div>
              </button>
            </div>

            {/* View Switcher Navigation Tabs */}
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl border border-gray-200">
              <button
                type="button"
                onClick={() => setCurrentView('orders')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  currentView === 'orders'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Package className="w-4 h-4 text-emerald-600" />
                <span>{isEn ? 'Dispatch Orders' : 'Senarai Pesanan'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  currentView === 'orders' ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-200 text-gray-700'
                }`}>
                  {deliveryOrders.length}
                </span>
              </button>

              <button
                type="button"
                id="tab-btn-earnings-payouts"
                onClick={() => setCurrentView('earnings')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  currentView === 'earnings'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Wallet className="w-4 h-4 text-amber-500" />
                <span>{isEn ? 'My Earnings & Payouts' : 'Gaji & Pengeluaran Saya'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                  currentView === 'earnings' ? 'bg-amber-100 text-amber-900' : 'bg-amber-200/60 text-amber-900'
                }`}>
                  RM {totalEarnings.toFixed(2)}
                </span>
              </button>
            </div>

            {/* View 1: My Earnings & Instant Payouts Dashboard */}
            {currentView === 'earnings' ? (
              <RiderEarningsDashboard
                application={application}
                deliveryOrders={deliveryOrders}
                language={language}
                onUpdateApplication={(updated) => {
                  if (onUpdateApplication) onUpdateApplication(updated);
                }}
                onOpenEditProfile={() => setIsEditProfileOpen(true)}
                onSwitchToOrders={() => setCurrentView('orders')}
              />
            ) : (
              /* View 2: Dispatch Orders & Active Trips */
              <div className="space-y-4">
                {/* Active Accepted Trips Alert (if any) */}
                {acceptedOrders.length > 0 && (
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>{isEn ? `You have ${acceptedOrders.length} Active Accepted Order(s)` : `Anda mempunyai ${acceptedOrders.length} Pesanan Aktif`}</span>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                        {isEn ? 'In Progress' : 'Sedang Diproses'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {acceptedOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="bg-white rounded-xl p-2.5 border border-amber-200 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-mono font-black text-gray-900">#{ord.orderNumber}</span>
                            <span className="text-gray-500 mx-1.5">•</span>
                            <span className="text-gray-700 font-medium truncate">{ord.customerName} ({ord.deliveryAddress})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => onViewOrderDetails(ord)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 shadow-xs"
                          >
                            {isEn ? 'View Order Page →' : 'Lihat Halaman Pesanan →'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Orders Filter Tabs */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        activeFilter === 'all'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isEn ? 'All Orders' : 'Semua Pesanan'} ({deliveryOrders.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveFilter('express')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                        activeFilter === 'express'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Zap className="w-3 h-3" />
                      <span>{isEn ? 'Express' : 'Ekspres'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveFilter('cod')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        activeFilter === 'cod'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isEn ? 'Cash on Delivery' : 'Tunai COD'}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowApplicationDetails(!showApplicationDetails)}
                    className="text-[11px] text-gray-500 hover:text-emerald-700 underline font-medium"
                  >
                    {showApplicationDetails
                      ? (isEn ? 'Hide My Details' : 'Tutup Maklumat')
                      : (isEn ? 'My Profile' : 'Profil Saya')}
                  </button>
                </div>

                {/* Collapsible Application Details Card */}
                {showApplicationDetails && (
                  <div className="bg-gray-50 rounded-2xl p-3 border border-gray-200 text-xs space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex justify-between text-gray-600">
                      <span>{isEn ? 'Driver Name' : 'Nama Penghantar'}:</span>
                      <span className="font-bold text-gray-900">{application.fullName}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{isEn ? 'Phone Number' : 'Nombor Telefon'}:</span>
                      <span className="font-mono font-bold text-emerald-700">{application.phoneNumber}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{isEn ? 'Vehicle & Plate' : 'Kenderaan & Plat'}:</span>
                      <span className="font-bold text-gray-900 capitalize">{application.vehicleType} • {application.plateNumber}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{isEn ? 'MyKad / ID' : 'No. Pengenalan'}:</span>
                      <span className="font-mono text-gray-800">{application.idNumber}</span>
                    </div>
                  </div>
                )}

                {/* THE LIST OF SMALL COMPONENT ORDERS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isEn ? 'Available Supermarket Dispatch Orders' : 'Senarai Pesanan Pasar Raya Untuk Dihantar'}</span>
                    </h4>
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {filteredOrders.length} {isEn ? 'Ready for Pickup' : 'Sedia Diambil'}
                    </span>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-200">
                      <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-700">
                        {isEn ? 'No orders matching this filter' : 'Tiada pesanan untuk tapisan ini'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveFilter('all')}
                        className="mt-2 text-xs text-emerald-600 font-bold underline"
                      >
                        {isEn ? 'View all orders' : 'Lihat semua pesanan'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {filteredOrders.map((order) => {
                        const isAccepted = order.status === 'accepted' || order.status === 'picked_up' || order.status === 'out_for_delivery';
                        return (
                          <DeliveryOrderCard
                            key={order.id}
                            order={order}
                            language={language}
                            onAcceptOrder={onAcceptOrder}
                            onViewDetails={onViewOrderDetails}
                            isAcceptedByMe={isAccepted}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================= WAITING FOR APPROVAL VIEW ================= */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Status Highlight Banner */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-amber-950 text-sm">
                    {isEn ? 'Status: Waiting for Approval' : 'Status: Menunggu Kelulusan'}
                  </h4>
                  <span className="bg-amber-200/80 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {isEn ? 'Under Review' : 'Dalam Semakan'}
                  </span>
                </div>
                <p className="text-xs text-amber-900/85 leading-relaxed">
                  {isEn
                    ? 'Thank you for registering as a D-mart delivery partner! Your application and vehicle information have been submitted to our dispatch hub team. Review usually takes 24 to 48 hours.'
                    : 'Terima kasih kerana mendaftar sebagai rakan penghantar D-mart! Permohonan dan maklumat kenderaan anda telah dihantar ke hab operasi. Semakan biasanya mengambil masa 24 hingga 48 jam.'}
                </p>
              </div>
            </div>

            {/* Instant Demo Approval Fast-Track Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-emerald-950">
                    {isEn ? 'Test Driver Experience? Approve Application' : 'Uji Pengalaman Penghantar? Luluskan Segera'}
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    {isEn
                      ? 'Click below to approve status and browse available orders list with (Accept Order) button.'
                      : 'Klik di bawah untuk luluskan dan lihat senarai pesanan dengan butang Terima Pesanan.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onApproveApplication}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isEn ? 'Approve Application Now' : 'Luluskan Sekarang'}</span>
              </button>
            </div>

            {/* Verification Progress Steps */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                {isEn ? 'Onboarding & Verification Steps' : 'Langkah Pengesahan & Kemasukan'}
              </h4>

              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3.5">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">
                      {isEn ? '1. Application Form & Details' : '1. Borang Permohonan & Butiran'}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {isEn ? 'Submitted successfully on ' : 'Berjaya dihantar pada '}
                      {new Date(application.submittedAt).toLocaleDateString(isEn ? 'en-MY' : 'ms-MY', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-amber-950">
                      {isEn ? '2. ID & Driving License Verification' : '2. Pengesahan MyKad / ID & Lesen'}
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium">
                      {isEn ? 'In progress by D-mart Fleet Team' : 'Sedang diproses oleh Pasukan Fleet'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-3 opacity-60">
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-800">
                      {isEn ? '3. Vehicle Road Tax & Hub Assignment' : '3. Cukai Jalan Kenderaan & Hab Penghantaran'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {isEn ? 'Pending step 2 completion' : 'Menunggu selesai langkah 2'}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-center gap-3 opacity-60">
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black">4</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-800">
                      {isEn ? '4. Thermal Bag Handover & Active Dispatch' : '4. Penyerahan Beg Penebat & Mula Menghantar'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {isEn ? 'SMS & WhatsApp invite will be sent' : 'Jemputan SMS & WhatsApp akan dihantar'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submitted Information Card */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                {isEn ? 'Registered Details' : 'Maklumat Yang Didaftarkan'}
              </h4>

              <div className="bg-white rounded-2xl p-4 border border-gray-200 divide-y divide-gray-100 text-xs space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">{isEn ? 'Full Name' : 'Nama Penuh'}:</span>
                  <span className="font-bold text-gray-900">{application.fullName}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">{isEn ? 'Nationality' : 'Warganegara'}:</span>
                  <span className="font-bold text-gray-900">{application.nationality}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">{isEn ? 'ID / IC Number (رقم الهوية)' : 'No. Kad Pengenalan (رقم الهوية)'}:</span>
                  <span className="font-mono font-bold text-gray-900">{application.idNumber}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">{isEn ? 'Phone Number' : 'Nombor Telefon'}:</span>
                  <span className="font-mono font-bold text-emerald-700">{application.phoneNumber}</span>
                </div>
                <div className="flex items-start justify-between py-1 gap-2">
                  <span className="text-gray-500 shrink-0">{isEn ? 'Address' : 'Alamat'}:</span>
                  <span className="font-medium text-gray-800 text-right">{application.address}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">{isEn ? 'Vehicle / Motorcycle Registration' : 'No. Pendaftaran Kenderaan'}:</span>
                  <span className="font-mono font-black text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300">
                    {application.plateNumber} ({application.vehicleType === 'motorcycle' ? (isEn ? 'Motorcycle' : 'Motosikal') : (isEn ? 'Car' : 'Kereta')})
                  </span>
                </div>
                {application.licenseDocUrl && (
                  <div className="flex items-center justify-between py-1.5 gap-2">
                    <span className="text-gray-500 shrink-0">{isEn ? "Driver's License Document" : 'Dokumen Lesen Memandu'}:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border border-emerald-300 bg-gray-50 shrink-0">
                        <img
                          src={application.licenseDocUrl}
                          alt="License Document"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium text-[11px] text-emerald-800 max-w-[140px] truncate">
                        {application.licenseDocName || "JPJ_License.jpg"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Store className="w-4 h-4" />
            <span>{isEn ? 'Back to Supermarket Shopping' : 'Kembali Membeli-belah di D-mart'}</span>
          </button>
        </div>
      </div>

      {/* Edit Driver Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <UserCog className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">
                    {isEn ? 'Edit Driver Profile & Vehicle' : 'Ubah Profil & Kenderaan Rider'}
                  </h4>
                  <p className="text-[10px] text-emerald-100">
                    {isEn ? 'Update dispatch information & vehicle documents' : 'Kemaskini maklumat penghantar & kenderaan'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRiderProfile} className="p-4 sm:p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Full Name' : 'Nama Penuh'}
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Contact Phone Number' : 'Nombor Telefon'}
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isEn ? 'Vehicle Type' : 'Jenis Kenderaan'}
                  </label>
                  <select
                    value={editVehicleType}
                    onChange={(e) =>
                      setEditVehicleType(e.target.value as DeliveryPartnerApplication['vehicleType'])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
                  >
                    <option value="motorcycle">{isEn ? 'Motorcycle' : 'Motosikal'}</option>
                    <option value="car">{isEn ? 'Car' : 'Kereta'}</option>
                    <option value="van">{isEn ? 'Van' : 'Van'}</option>
                    <option value="bicycle">{isEn ? 'Bicycle' : 'Basikal'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isEn ? 'Plate Number' : 'Nombor Plat'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editPlateNumber}
                    onChange={(e) => setEditPlateNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-900 uppercase focus:bg-white focus:border-emerald-500 outline-none"
                    placeholder="WXY 1234"
                  />
                </div>
              </div>

              {/* Banking & Payout Details Section */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-xs text-gray-800">
                    {isEn ? 'Bank Account & IBAN (For Instant Payouts)' : 'Maklumat Bank & IBAN (Untuk Payout Harian)'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isEn ? 'Bank Name' : 'Nama Bank'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editBankName}
                    onChange={(e) => setEditBankName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
                    placeholder="Maybank, CIMB Bank, Public Bank, etc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isEn ? 'Account Holder' : 'Pemegang Akaun'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editAccountHolder}
                      onChange={(e) => setEditAccountHolder(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isEn ? 'Account Number' : 'Nombor Akaun'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editAccountNumber}
                      onChange={(e) => setEditAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-900 focus:bg-white focus:border-emerald-500 outline-none"
                      placeholder="5140 8821 9402"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isEn ? 'IBAN / SWIFT Code' : 'Kod IBAN / SWIFT'}
                  </label>
                  <input
                    type="text"
                    value={editIban}
                    onChange={(e) => setEditIban(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-900 uppercase focus:bg-white focus:border-emerald-500 outline-none"
                    placeholder="MY24MBBE514088219402"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Save Changes' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
