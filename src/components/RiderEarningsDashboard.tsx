import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Send,
  X,
  History,
  ShieldCheck,
  Edit3,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Banknote,
  Receipt,
  FileSpreadsheet,
  Coins,
  Scale,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Filter,
  Check
} from 'lucide-react';
import {
  DeliveryPartnerApplication,
  DeliveryJobOrder,
  Language,
  RiderPayoutRequest,
  RiderTransactionRecord,
  RiderLedgerOrderEntry,
  RiderManualAdjustment
} from '../types';
import {
  subscribeToRiderPayoutRequests,
  createPayoutRequestInFirestore,
  syncRiderToFirestore
} from '../firebase_config';
import {
  calculateRiderClearingSummary,
  getSavedRiderAdjustments,
  saveRiderAdjustments
} from '../data/riderLedgerData';

interface RiderEarningsDashboardProps {
  application: DeliveryPartnerApplication;
  deliveryOrders: DeliveryJobOrder[];
  language: Language;
  onUpdateApplication?: (updated: DeliveryPartnerApplication) => void;
  onOpenEditProfile: () => void;
  onSwitchToOrders: () => void;
}

export const RiderEarningsDashboard: React.FC<RiderEarningsDashboardProps> = ({
  application,
  deliveryOrders,
  language,
  onUpdateApplication,
  onOpenEditProfile,
  onSwitchToOrders,
}) => {
  const isEn = language === 'en';
  const riderId = application.id || application.referenceNo || 'rider_default';
  const todayStr = new Date().toISOString().slice(0, 10);

  // Live Payout Requests from Firestore
  const [payoutRequests, setPayoutRequests] = useState<RiderPayoutRequest[]>([]);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmountInput, setPayoutAmountInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // View state & filters
  const [activeLedgerView, setActiveLedgerView] = useState<'statement' | 'payouts'>('statement');
  const [statementFilter, setStatementFilter] = useState<'all' | 'online' | 'cod' | 'adjustments'>('all');
  const [selectedLedgerOrder, setSelectedLedgerOrder] = useState<RiderLedgerOrderEntry | null>(null);

  // Interactive Deficit / Surplus Scenario Toggle for Testing Clearing Logic
  const [isSimulateDeficit, setIsSimulateDeficit] = useState(false);

  // Saved adjustments from localStorage
  const [adjustments, setAdjustments] = useState<RiderManualAdjustment[]>(() => getSavedRiderAdjustments());

  // Bank Info Defaults if not yet set in profile
  const savedBankName = application.bankName || 'Maybank (Malayan Banking Berhad)';
  const savedAccountNumber = application.accountNumber || '5140 8821 9402';
  const savedAccountHolder = application.accountHolder || application.fullName || 'Muhammad Faiz bin Kamarudin';
  const savedIban = application.iban || 'MY24MBBE514088219402';

  // Real-time synchronization with Firestore 'payout_requests'
  useEffect(() => {
    const unsub = subscribeToRiderPayoutRequests(riderId, (livePayouts) => {
      setPayoutRequests(livePayouts);
    });
    return () => unsub();
  }, [riderId]);

  // Total Withdrawn: sum of live payout requests from Firestore plus any persisted withdrawn amount
  const liveTotalWithdrawn = payoutRequests.reduce((sum, p) => sum + p.amount, 0);
  const totalWithdrawn = Math.max(application.totalWithdrawn || 0, liveTotalWithdrawn);

  // Extra entries if simulating high COD deficit
  const extraSimulatedEntries: RiderLedgerOrderEntry[] = useMemo(() => {
    if (!isSimulateDeficit) return [];
    return [
      {
        id: 'rled-sim-cod-1',
        orderNumber: 'DM-89299-COD',
        orderId: 'sim-cod-1',
        customerName: 'Dato Seri Azman (High Value Grocery)',
        customerPhone: '012-9988112',
        completedAt: new Date(Date.now() - 3600000).toISOString(),
        paymentType: 'Cash on Delivery',
        paymentMethod: 'cod',
        grossOrderAmount: 185.00,
        deliveryEarning: 15.00,
        platformCommission: 2.50,
        cashCollected: 185.00, // Massive cash in hand debited
        onlineEarnings: 0,
        netAmountEffect: -185.00,
        runningBalance: 0,
        notes: 'Bulk Supermarket Cash Delivery • Cash in hand pocketed by rider',
        status: 'Completed',
      },
    ];
  }, [isSimulateDeficit]);

  // Core Clearing Calculation using the automated engine:
  // Net Balance = (Total Online Order Earnings) - (Platform Commissions) - (Total Cash Collected) + Adjustments
  const { summary, ledgerEntries } = useMemo(() => {
    return calculateRiderClearingSummary(
      riderId,
      application.fullName,
      application.phoneNumber,
      deliveryOrders,
      adjustments,
      totalWithdrawn,
      extraSimulatedEntries
    );
  }, [riderId, application.fullName, application.phoneNumber, deliveryOrders, adjustments, totalWithdrawn, extraSimulatedEntries]);

  const {
    totalCashCollected,
    totalOnlineEarnings,
    totalCommissionFees,
    netLedgerBalance,
    withdrawableBalance,
    isOwedToPlatform,
    amountOwedToPlatform,
  } = summary;

  // Once-per-day restriction check:
  const hasRequestedToday =
    payoutRequests.some((p) => p.requestDate === todayStr) ||
    application.lastPayoutDate === todayStr;

  // Payout Button Validation logic:
  // Strictly disabled if:
  // 1. Negative Balance (Amount Owed to Platform)
  // 2. Available Withdrawable Balance <= RM 0
  // 3. Already requested once today
  // 4. In submission
  const isPayoutDisabled =
    isOwedToPlatform ||
    withdrawableBalance <= 0 ||
    hasRequestedToday ||
    isSubmitting;

  // Filtered Statement Entries
  const filteredLedgerEntries = ledgerEntries.filter((entry) => {
    if (statementFilter === 'online') return entry.paymentType === 'Online / Card Payment';
    if (statementFilter === 'cod') return entry.paymentType === 'Cash on Delivery';
    return true;
  });

  const handleOpenPayoutModal = () => {
    if (isPayoutDisabled) return;
    setPayoutAmountInput(withdrawableBalance.toFixed(2));
    setIsPayoutModalOpen(true);
  };

  const handleConfirmPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmountInput);

    if (isNaN(amountNum) || amountNum <= 0) {
      alert(isEn ? 'Please enter a valid payout amount.' : 'Sila masukkan jumlah pembayaran yang sah.');
      return;
    }
    if (amountNum > withdrawableBalance) {
      alert(
        isEn
          ? `Requested amount exceeds withdrawable balance of RM ${withdrawableBalance.toFixed(2)}`
          : `Jumlah melebihi baki boleh dikeluarkan iaitu RM ${withdrawableBalance.toFixed(2)}`
      );
      return;
    }
    if (hasRequestedToday) {
      alert(
        isEn
          ? 'Daily payout limit reached: 1 payout request permitted per calendar day.'
          : 'Had pengeluaran harian dicapai: 1 permohonan dibenarkan setiap hari.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payoutId = `payout-${Date.now().toString().slice(-6)}`;
      const bankDetailsObj = {
        bankName: savedBankName,
        accountNumber: savedAccountNumber,
        accountHolder: savedAccountHolder,
        iban: savedIban,
      };

      const newPayoutRequest: RiderPayoutRequest = {
        id: payoutId,
        riderId,
        riderName: application.fullName,
        riderPhone: application.phoneNumber,
        amount: amountNum,
        bankDetails: bankDetailsObj,
        status: 'Pending',
        requestedAt: new Date().toISOString(),
        requestDate: todayStr,
      };

      const updatedBalances = {
        availableBalance: Math.max(0, withdrawableBalance - amountNum),
        totalWithdrawn: totalWithdrawn + amountNum,
        lastPayoutDate: todayStr,
      };

      // 1. Write to Firestore 'payout_requests' collection and update rider profile
      await createPayoutRequestInFirestore(newPayoutRequest, updatedBalances);

      // 2. Update local rider application state and localStorage
      const updatedApplication: DeliveryPartnerApplication = {
        ...application,
        bankName: savedBankName,
        accountNumber: savedAccountNumber,
        accountHolder: savedAccountHolder,
        iban: savedIban,
        availableBalance: updatedBalances.availableBalance,
        totalWithdrawn: updatedBalances.totalWithdrawn,
        lastPayoutDate: todayStr,
      };

      try {
        localStorage.setItem('dmart_rider_app', JSON.stringify(updatedApplication));
      } catch {}

      if (onUpdateApplication) {
        onUpdateApplication(updatedApplication);
      }
      syncRiderToFirestore(updatedApplication);

      // 3. Close modal & show toast
      setIsPayoutModalOpen(false);
      setSuccessToast(
        isEn
          ? `Instant Payout of RM ${amountNum.toFixed(2)} submitted! Transferred to ${savedBankName} (${savedAccountNumber}).`
          : `Permohonan RM ${amountNum.toFixed(2)} berjaya dihantar ke ${savedBankName} (${savedAccountNumber}).`
      );

      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err) {
      console.error('Failed to submit payout request:', err);
      alert(isEn ? 'Failed to submit payout request. Please try again.' : 'Gagal menghantar permohonan payout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to simulate cashier counter cash handover settlement
  const handleSimulateCashHandover = () => {
    if (totalCashCollected <= 0) return;
    const handoverAmount = isSimulateDeficit ? 185.00 : totalCashCollected;
    const newAdj: RiderManualAdjustment = {
      id: `adj-handover-${Date.now()}`,
      riderId,
      riderName: application.fullName,
      type: 'credit',
      reason: 'cash_handover_settled',
      reasonLabel: 'Cash Handover Settled at Counter',
      amount: handoverAmount,
      referenceNo: `HO-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString(),
      adminName: 'Siti Aminah (Cashier Lead)',
      notes: `Cash collected from customer orders physically handed over to cashier register`,
    };

    const updated = [newAdj, ...adjustments];
    setAdjustments(updated);
    saveRiderAdjustments(updated);
    setIsSimulateDeficit(false);
    setSuccessToast(
      isEn
        ? `Cash Handover of RM ${handoverAmount.toFixed(2)} verified! Debits cleared from ledger.`
        : `Penyerahan tunai RM ${handoverAmount.toFixed(2)} disahkan! Baki lejar dikemaskini.`
    );
    setTimeout(() => setSuccessToast(null), 5000);
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Toast Notification Alert */}
      {successToast && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-emerald-950 animate-in fade-in slide-in-from-top-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-xs">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* QUICK TESTING SCENARIO TOGGLE BANNER */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-3 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">
                {isEn ? 'Dual-View Clearing & Ledger Engine' : 'Sistem Lejar & Akaun Penjelasan Dual-View'}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                isOwedToPlatform ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
              }`}>
                {isOwedToPlatform ? (isEn ? 'Status: NEGATIVE BALANCE' : 'Status: BAKI NEGATIF') : (isEn ? 'Status: POSITIVE SURPLUS' : 'Status: LEBIHAN POSITIF')}
              </span>
            </div>
            <p className="text-[10px] text-gray-300">
              {isEn
                ? 'Automated live clearing: Cash Orders (Debited) • Online Orders (Credited) • Platform Fees (Deducted)'
                : 'Pembersihan automatik: Pesanan Tunai (Didebit) • Pesanan Atas Talian (Dikredit) • Komisen'}
            </p>
          </div>
        </div>

        {/* Interactive Scenario Buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setIsSimulateDeficit(!isSimulateDeficit)}
            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isSimulateDeficit
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
            }`}
            title="Toggle high cash collection to test negative balance and payout button disablement"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>{isSimulateDeficit ? (isEn ? 'Deficit Active (COD Owed)' : 'Mod Defisit Aktif') : (isEn ? 'Simulate Cash Deficit' : 'Uji Defisit Tunai')}</span>
          </button>

          {isOwedToPlatform && (
            <button
              type="button"
              onClick={handleSimulateCashHandover}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Settle Cash Handover at Counter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Settle Cash Handover' : 'Serah Tunai Kaunter'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. FINANCIAL BREAKDOWN & CLEARING ACCOUNT KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Available Withdrawable Balance (Hero) */}
        <div className={`rounded-2xl p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between transition-all ${
          isOwedToPlatform
            ? 'bg-gradient-to-br from-rose-700 via-rose-800 to-rose-900 border border-rose-600'
            : 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700'
        }`}>
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-15 pointer-events-none">
            <Wallet className="w-24 h-24" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-amber-300" />
                <span>{isEn ? 'Available Balance' : 'Baki Boleh Dikeluarkan'}</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isOwedToPlatform ? 'bg-rose-950/60 text-rose-200' : 'bg-white/20 text-white'
              }`}>
                {isOwedToPlatform ? (isEn ? 'RM 0.00 Limit' : 'Had RM 0.00') : (isEn ? 'Withdrawable' : 'Boleh Dipohon')}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1">
              RM {withdrawableBalance.toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-emerald-100/90 mt-2">
            {isOwedToPlatform
              ? (isEn ? 'Withdrawals locked: Settle cash collection first' : 'Pengeluaran dikunci: Selesaikan tunai')
              : (isEn ? 'Ready for instant daily withdrawal to bank' : 'Sedia untuk pengeluaran ke bank')}
          </p>
        </div>

        {/* Net Clearing Ledger Balance (Formula Result) */}
        <div className="rounded-2xl bg-white border border-gray-200 p-4 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span>{isEn ? 'Net Clearing Balance' : 'Baki Bersih Lejar'}</span>
              </span>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                isOwedToPlatform
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {isOwedToPlatform ? (isEn ? 'Debit' : 'Debit') : (isEn ? 'Credit' : 'Kredit')}
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 ${
              isOwedToPlatform ? 'text-rose-600' : 'text-gray-900'
            }`}>
              {netLedgerBalance < 0 ? '-' : ''}RM {Math.abs(netLedgerBalance).toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 flex items-center justify-between">
            <span>{isEn ? 'Online - Commissions - Cash' : 'Online - Komisen - Tunai'}</span>
            <span className="font-semibold text-gray-700">{ledgerEntries.length} {isEn ? 'orders' : 'pesanan'}</span>
          </p>
        </div>

        {/* Total Cash Collected (Debited) */}
        <div className="rounded-2xl bg-white border border-amber-200 p-4 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-amber-600" />
                <span>{isEn ? 'Cash Collected' : 'Tunai Dikutip'}</span>
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-full">
                {isEn ? 'Debited' : 'Didebit'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-700 mt-1">
              RM {totalCashCollected.toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {isEn ? 'Cash-in-hand collected from COD drops' : 'Tunai di tangan daripada pesanan COD'}
          </p>
        </div>

        {/* Online Order Earnings (Credited) */}
        <div className="rounded-2xl bg-white border border-teal-200 p-4 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                <span>{isEn ? 'Online Earnings' : 'Gaji Atas Talian'}</span>
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded-full">
                {isEn ? 'Credited' : 'Dikredit'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-teal-700 mt-1">
              RM {totalOnlineEarnings.toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {isEn ? `Less RM ${totalCommissionFees.toFixed(2)} platform fee` : `Tolak komisen RM ${totalCommissionFees.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* 2. CLEARING FORMULA STATEMENT & STATUS BANNER */}
      <div className={`rounded-2xl p-4 border transition-all ${
        isOwedToPlatform
          ? 'bg-rose-50 border-rose-300 text-rose-950'
          : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              isOwedToPlatform ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {isOwedToPlatform ? <AlertTriangle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-black text-sm">
                  {isOwedToPlatform
                    ? (isEn ? `AMOUNT OWED TO PLATFORM: RM ${amountOwedToPlatform.toFixed(2)}` : `JUMLAH TERHUTANG KEPADA PLATFORM: RM ${amountOwedToPlatform.toFixed(2)}`)
                    : (isEn ? `CLEARING SURPLUS: RM ${withdrawableBalance.toFixed(2)} WITHDRAWABLE` : `LEBIHAN BERSIH: RM ${withdrawableBalance.toFixed(2)} BOLEH DIKELUARKAN`)}
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isOwedToPlatform ? 'bg-rose-200 text-rose-900' : 'bg-emerald-200 text-emerald-900'
                }`}>
                  {isOwedToPlatform ? (isEn ? 'Deficit' : 'Defisit') : (isEn ? 'Surplus' : 'Lebihan')}
                </span>
              </div>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                {isOwedToPlatform
                  ? (isEn
                      ? `Your cash-on-delivery collections (RM ${totalCashCollected.toFixed(2)}) exceed your online delivery earnings. Payout withdrawal is locked until cash is surrendered to the supermarket counter or offset by online deliveries.`
                      : `Kutipan tunai COD anda (RM ${totalCashCollected.toFixed(2)}) melebihi pendapatan atas talian. Pengeluaran dikunci sehingga tunai diserahkan ke kaunter pasar raya atau diimbangi oleh pesanan online.`)
                  : (isEn
                      ? `Your online delivery earnings exceed all cash collections and platform fees. You are eligible for instant daily withdrawal directly to your saved bank account.`
                      : `Pendapatan atas talian anda melebihi semua kutipan tunai dan komisen platform. Anda layak untuk pengeluaran harian segera ke akaun bank.`)}
              </p>
            </div>
          </div>

          {/* Quick clearing formula visualization */}
          <div className="bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-gray-200 font-mono text-[11px] shrink-0 self-stretch md:self-auto flex items-center justify-between md:justify-center gap-2">
            <div className="text-gray-600">
              <span className="text-teal-700 font-bold">+RM {totalOnlineEarnings.toFixed(2)}</span>
              <span className="mx-1 text-gray-400">-</span>
              <span className="text-rose-600 font-bold">RM {totalCommissionFees.toFixed(2)}</span>
              <span className="mx-1 text-gray-400">-</span>
              <span className="text-amber-700 font-bold">RM {totalCashCollected.toFixed(2)}</span>
              <span className="mx-1 text-gray-400">=</span>
              <strong className={isOwedToPlatform ? 'text-rose-700' : 'text-emerald-700'}>
                {netLedgerBalance < 0 ? '-' : ''}RM {Math.abs(netLedgerBalance).toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SAVED BANK ACCOUNT INFO (IBAN / Bank Account Details configured in Rider Profile) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                {isEn ? 'Configured Bank Account & IBAN Details' : 'Maklumat Akaun Bank & IBAN Yang Disimpan'}
              </h4>
              <p className="text-[11px] text-gray-500">
                {isEn ? 'Direct transfer destination for your daily payout disbursements' : 'Destinasi pindahan wang untuk pembayaran gaji harian'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenEditProfile}
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-gray-200 cursor-pointer shadow-2xs"
            title={isEn ? 'Configure Bank Account & IBAN in Profile' : 'Ubah Maklumat Bank & IBAN'}
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEn ? 'Edit Bank Info' : 'Ubah Bank'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 bg-gray-50/80 rounded-xl p-3 border border-gray-100 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">{isEn ? 'Bank Name' : 'Nama Bank'}</span>
            <span className="font-bold text-gray-900 truncate block mt-0.5">{savedBankName}</span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">{isEn ? 'Account Holder' : 'Pemegang Akaun'}</span>
            <span className="font-bold text-gray-900 truncate block mt-0.5">{savedAccountHolder}</span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">{isEn ? 'Account Number' : 'No. Akaun Bank'}</span>
            <span className="font-mono font-bold text-emerald-800 block mt-0.5">{savedAccountNumber}</span>
          </div>

          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-semibold">{isEn ? 'IBAN / SWIFT Code' : 'Kod IBAN / SWIFT'}</span>
            <span className="font-mono font-bold text-gray-900 block mt-0.5 truncate">{savedIban}</span>
          </div>
        </div>
      </div>

      {/* 4. INSTANT DAILY PAYOUT REQUEST SECTION & STRICT RESTRICTION LOGIC */}
      <div className="bg-gradient-to-r from-gray-50 via-emerald-50/40 to-gray-50 rounded-2xl border border-emerald-200/80 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" />
            <div>
              <h4 className="font-bold text-sm text-gray-900">
                {isEn ? 'Instant Daily Payout Request' : 'Permohonan Pengeluaran Gaji Harian Segera'}
              </h4>
              <p className="text-[11px] text-gray-600">
                {isEn ? 'Withdraw cleared delivery earnings directly to your bank account' : 'Keluarkan baki pendapatan bersih terus ke akaun bank anda'}
              </p>
            </div>
          </div>

          {/* Validation Status Indicator */}
          {isOwedToPlatform ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 shadow-2xs">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>{isEn ? `RM ${amountOwedToPlatform.toFixed(2)} Owed to Platform` : `RM ${amountOwedToPlatform.toFixed(2)} Terhutang`}</span>
            </span>
          ) : hasRequestedToday ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>{isEn ? '1 Payout / Day Limit Reached' : 'Had 1 Payout / Hari'}</span>
            </span>
          ) : withdrawableBalance > 0 ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{isEn ? 'Daily Request Ready' : 'Sedia Untuk Payout'}</span>
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-700">
              {isEn ? 'RM 0.00 Balance' : 'Baki RM 0.00'}
            </span>
          )}
        </div>

        {/* Dynamic Context Notice */}
        {isOwedToPlatform ? (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-950 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{isEn ? 'Negative Clearing Lock:' : 'Kunci Baki Negatif:'}</strong>{' '}
              {isEn
                ? `You have a negative balance of RM ${amountOwedToPlatform.toFixed(2)} due to customer cash-on-delivery collections in hand. Payout requests are strictly disabled. Please hand over cash to the supermarket cashier desk or complete online orders to return to positive balance.`
                : `Anda mempunyai baki negatif RM ${amountOwedToPlatform.toFixed(2)} kerana kutipan tunai COD di tangan. Permohonan payout dikunci sehingga tunai diserahkan.`}
            </p>
          </div>
        ) : hasRequestedToday ? (
          <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>{isEn ? 'Daily Restriction Notice:' : 'Notis Had Harian:'}</strong>{' '}
              {isEn
                ? `You have already triggered a payout request today (${todayStr}). To ensure orderly bank clearing, riders are permitted 1 withdrawal per calendar day. Your next window opens tomorrow.`
                : `Anda telah membuat permohonan payout hari ini (${todayStr}). Had pengeluaran adalah 1 kali sehari. Pengeluaran seterusnya boleh dipohon esok.`}
            </p>
          </div>
        ) : withdrawableBalance <= 0 ? (
          <div className="p-3 rounded-xl bg-gray-100 border border-gray-200 text-[11px] text-gray-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1">
              <span>
                {isEn
                  ? 'Your Available Balance is RM 0.00. Accept and deliver supermarket orders to accumulate dispatch earnings.'
                  : 'Baki anda adalah RM 0.00. Selesaikan pesanan penghantaran untuk menambah baki pendapatan.'}
              </span>
              <button
                type="button"
                onClick={onSwitchToOrders}
                className="ml-2 font-bold text-emerald-700 hover:underline cursor-pointer inline-flex items-center gap-0.5"
              >
                <span>{isEn ? 'View Dispatch Orders →' : 'Lihat Pesanan Dihantar →'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-[11px] text-emerald-950 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isEn
                ? `You have RM ${withdrawableBalance.toFixed(2)} eligible for immediate transfer to ${savedBankName}. Daily payout requests are routed directly to your account via D-mart FastPay.`
                : `Anda mempunyai RM ${withdrawableBalance.toFixed(2)} sedia dipindahkan ke ${savedBankName}. Pindahan diproses melalui D-mart FastPay.`}
            </p>
          </div>
        )}

        {/* PROMINENT REQUEST PAYOUT BUTTON (Bottom of Earnings section) */}
        <div className="pt-1">
          <button
            type="button"
            id="btn-rider-request-payout"
            disabled={isPayoutDisabled}
            onClick={handleOpenPayoutModal}
            className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
              isPayoutDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75 shadow-none'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white shadow-emerald-600/25 cursor-pointer'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>
              {isOwedToPlatform
                ? (isEn ? `Payout Disabled (RM ${amountOwedToPlatform.toFixed(2)} Owed to Platform)` : `Payout Dikunci (RM ${amountOwedToPlatform.toFixed(2)} Terhutang)`)
                : hasRequestedToday
                ? (isEn ? 'Daily Payout Limit Reached (1 Payout / Day)' : 'Had Payout Harian Dicapai (1 Kali / Hari)')
                : withdrawableBalance <= 0
                ? (isEn ? 'Available Balance is RM 0.00' : 'Baki Boleh Dikeluarkan RM 0.00')
                : (isEn ? `Request Payout (RM ${withdrawableBalance.toFixed(2)})` : `Mohon Payout (RM ${withdrawableBalance.toFixed(2)})`)}
            </span>
            {!isPayoutDisabled && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 5. RIDER FINANCIAL LEDGER & STATEMENT (AUTOMATED RUNNING STATEMENT OF ACCOUNT) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
        {/* Header & View Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <div>
              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                {isEn ? 'Running Financial Ledger & Statement of Account' : 'Penyata Akaun & Lejar Berjalan Penghantar'}
              </h4>
              <p className="text-[10px] text-gray-500">
                {isEn ? 'Itemized breakdown of completed deliveries, commissions, and running clearing balance.' : 'Pecahan lengkap pesanan selesai, komisen ditolak, dan baki penyelesaian.'}
              </p>
            </div>
          </div>

          {/* Sub-tab view toggle */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveLedgerView('statement')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeLedgerView === 'statement' ? 'bg-white text-emerald-800 shadow-2xs font-black' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isEn ? 'Order Statement' : 'Penyata Pesanan'}</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-full">
                {ledgerEntries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveLedgerView('payouts')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeLedgerView === 'payouts' ? 'bg-white text-blue-800 shadow-2xs font-black' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{isEn ? 'Payout Requests' : 'Sejarah Payout'}</span>
              <span className="text-[9px] bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded-full">
                {payoutRequests.length}
              </span>
            </button>
          </div>
        </div>

        {/* Filter Pills for Statement View */}
        {activeLedgerView === 'statement' && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setStatementFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statementFilter === 'all' ? 'bg-gray-900 text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isEn ? 'All Transactions' : 'Semua Transaksi'} ({ledgerEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setStatementFilter('online')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  statementFilter === 'online' ? 'bg-teal-700 text-white font-bold' : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                }`}
              >
                <CreditCard className="w-3 h-3" />
                <span>{isEn ? 'Online Orders (+ Credited)' : 'Pesanan Online (+ Kredit)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStatementFilter('cod')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  statementFilter === 'cod' ? 'bg-amber-700 text-white font-bold' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Banknote className="w-3 h-3" />
                <span>{isEn ? 'Cash on Delivery (- Debited)' : 'Tunai COD (- Debit)'}</span>
              </button>
            </div>

            <span className="text-[10px] text-gray-500 font-mono">
              {isEn ? 'Audited Clearing Ledger' : 'Lejar Sah Terverifikasi'}
            </span>
          </div>
        )}

        {/* STATEMENT TABLE (RIDER VIEW) */}
        {activeLedgerView === 'statement' ? (
          filteredLedgerEntries.length === 0 ? (
            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
              <Receipt className="w-6 h-6 text-gray-400 mx-auto mb-1" />
              <p className="font-semibold text-xs">{isEn ? 'No ledger statement entries match the selected filter' : 'Tiada rekod lejar ditemui'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                    <th className="p-2.5">{isEn ? 'Order & Time' : 'Pesanan & Masa'}</th>
                    <th className="p-2.5">{isEn ? 'Payment Type' : 'Jenis Pembayaran'}</th>
                    <th className="p-2.5 text-right">{isEn ? 'Gross Order' : 'Jumlah Kasar'}</th>
                    <th className="p-2.5 text-right">{isEn ? 'Commission Fee' : 'Komisen Platform'}</th>
                    <th className="p-2.5 text-right">{isEn ? 'Net Amount' : 'Kesan Bersih'}</th>
                    <th className="p-2.5 text-right">{isEn ? 'Running Balance' : 'Baki Berjalan'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {filteredLedgerEntries.map((entry) => {
                    const isCod = entry.paymentType === 'Cash on Delivery';
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedLedgerOrder(entry)}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                      >
                        {/* Order & Time */}
                        <td className="p-2.5">
                          <div className="font-mono font-bold text-gray-900 flex items-center gap-1.5">
                            <span>#{entry.orderNumber}</span>
                            <span className="text-[9px] font-sans font-semibold bg-gray-100 text-gray-600 px-1 py-0.2 rounded">
                              {entry.customerName}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 block">
                            {new Date(entry.completedAt).toLocaleTimeString(isEn ? 'en-MY' : 'ms-MY', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </td>

                        {/* Payment Type */}
                        <td className="p-2.5">
                          {isCod ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              <Banknote className="w-3 h-3 text-amber-600" />
                              <span>Cash on Delivery</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-200">
                              <CreditCard className="w-3 h-3 text-teal-700" />
                              <span>Online / Card</span>
                            </span>
                          )}
                        </td>

                        {/* Gross Order Amount */}
                        <td className="p-2.5 text-right font-mono font-bold text-gray-800">
                          RM {entry.grossOrderAmount.toFixed(2)}
                        </td>

                        {/* Platform Commission Fee (automatically deducted) */}
                        <td className="p-2.5 text-right font-mono text-gray-600">
                          <span className="text-rose-600 font-semibold">-RM {entry.platformCommission.toFixed(2)}</span>
                          <span className="text-[9px] text-gray-400 block font-sans">{isEn ? 'Auto deducted' : 'Ditolak auto'}</span>
                        </td>

                        {/* Net Amount Credited/Debited to Rider Ledger */}
                        <td className="p-2.5 text-right">
                          <span
                            className={`font-mono font-black text-xs inline-block px-1.5 py-0.5 rounded ${
                              entry.netAmountEffect >= 0
                                ? 'text-emerald-700 bg-emerald-50'
                                : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {entry.netAmountEffect >= 0 ? '+' : ''}RM {entry.netAmountEffect.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-gray-500 block">
                            {isCod
                              ? (isEn ? 'Cash Debited' : 'Tunai Didebit')
                              : (isEn ? 'Net Credited' : 'Dikredit Bersih')}
                          </span>
                        </td>

                        {/* Running Balance */}
                        <td className="p-2.5 text-right font-mono font-black text-gray-900">
                          <span className={entry.runningBalance < 0 ? 'text-rose-600' : 'text-emerald-700'}>
                            {entry.runningBalance < 0 ? '-' : ''}RM {Math.abs(entry.runningBalance).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* PAYOUT REQUESTS HISTORY */
          <div className="space-y-2">
            {payoutRequests.length === 0 ? (
              <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                <History className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="font-semibold text-xs">{isEn ? 'No payout requests submitted yet' : 'Tiada permohonan payout dihantar lagi'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {payoutRequests.map((p) => {
                  const isCompleted = p.status === 'Completed';
                  return (
                    <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 font-mono text-xs">{p.id}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                              isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {p.bankDetails?.bankName} (Acc: ...{p.bankDetails?.accountNumber?.slice(-4) || '9402'}) •{' '}
                            {new Date(p.requestedAt).toLocaleString(isEn ? 'en-MY' : 'ms-MY')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-blue-700">
                          -RM {p.amount.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 block font-mono">
                          {p.requestDate}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: ORDER DETAILS BREAKDOWN (Itemized popup from ledger row click) */}
      {selectedLedgerOrder && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h4 className="font-black text-sm text-gray-900">
                  {isEn ? 'Order Financial Statement' : 'Penyata Kewangan Pesanan'} #{selectedLedgerOrder.orderNumber}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLedgerOrder(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">{isEn ? 'Customer Name:' : 'Pelanggan:'}</span>
                <span className="font-bold text-gray-900">{selectedLedgerOrder.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">{isEn ? 'Payment Type:' : 'Kaedah Bayaran:'}</span>
                <span className="font-bold text-gray-900">{selectedLedgerOrder.paymentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">{isEn ? 'Gross Order Amount:' : 'Jumlah Kasar Pesanan:'}</span>
                <span className="font-mono font-bold text-gray-900">RM {selectedLedgerOrder.grossOrderAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">{isEn ? 'Platform Commission Fee:' : 'Komisen Platform:'}</span>
                <span className="font-mono text-rose-600 font-bold">-RM {selectedLedgerOrder.platformCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">
                  {selectedLedgerOrder.paymentType === 'Cash on Delivery'
                    ? (isEn ? 'Cash Collected in Hand (Debited):' : 'Tunai Dikutip (Didebit):')
                    : (isEn ? 'Online Earnings (Credited):' : 'Gaji Atas Talian (Dikredit):')}
                </span>
                <span className="font-mono font-black text-gray-900">
                  RM {(selectedLedgerOrder.paymentType === 'Cash on Delivery' ? selectedLedgerOrder.cashCollected : selectedLedgerOrder.onlineEarnings).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 bg-gray-50 px-3 rounded-xl border border-gray-100 font-bold">
                <span className="text-gray-700">{isEn ? 'Net Amount Effect:' : 'Kesan Bersih Lejar:'}</span>
                <span className={`font-mono text-sm ${selectedLedgerOrder.netAmountEffect >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {selectedLedgerOrder.netAmountEffect >= 0 ? '+' : ''}RM {selectedLedgerOrder.netAmountEffect.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedLedgerOrder(null)}
              className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl cursor-pointer transition-colors"
            >
              {isEn ? 'Close Statement' : 'Tutup Penyata'}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM PAYOUT MODAL */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
                  <Wallet className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">
                    {isEn ? 'Confirm Daily Payout Request' : 'Sahkan Permohonan Payout Harian'}
                  </h4>
                  <p className="text-[10px] text-emerald-100 font-mono">
                    {isEn ? 'Instant Transfer via D-mart FastPay' : 'Pindahan Segera D-mart FastPay'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayout} className="p-4 sm:p-5 space-y-3.5 text-xs">
              {/* Withdrawal Amount Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Withdrawal Amount (RM)' : 'Jumlah Pengeluaran (RM)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500 font-mono text-sm">
                    RM
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={withdrawableBalance}
                    required
                    value={payoutAmountInput}
                    onChange={(e) => setPayoutAmountInput(e.target.value)}
                    className="w-full pl-11 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-300 font-mono font-black text-lg text-emerald-800 focus:bg-white focus:border-emerald-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-gray-500">
                  <span>{isEn ? 'Max Available:' : 'Baki Maksimum:'} <strong>RM {withdrawableBalance.toFixed(2)}</strong></span>
                  <button
                    type="button"
                    onClick={() => setPayoutAmountInput(withdrawableBalance.toFixed(2))}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    {isEn ? 'Withdraw All (100%)' : 'Keluarkan Semua (100%)'}
                  </button>
                </div>
              </div>

              {/* Destination Bank Details Card */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-1.5 text-xs">
                <span className="text-[10px] font-black uppercase text-gray-500 block">
                  {isEn ? 'Destination Bank Account' : 'Akaun Bank Penerima'}
                </span>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isEn ? 'Bank:' : 'Bank:'}</span>
                  <span className="font-bold text-gray-900">{savedBankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isEn ? 'Account No:' : 'No. Akaun:'}</span>
                  <span className="font-mono font-bold text-emerald-800">{savedAccountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isEn ? 'Account Holder:' : 'Pemegang:'}</span>
                  <span className="font-bold text-gray-900">{savedAccountHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isEn ? 'IBAN / Swift:' : 'IBAN / Swift:'}</span>
                  <span className="font-mono text-gray-800 truncate max-w-[180px]">{savedIban}</span>
                </div>
              </div>

              {/* Payout Processing Terms Notice */}
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[10px] text-blue-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.2" />
                <p className="leading-relaxed">
                  <strong>{isEn ? '1-Payout Daily Rule:' : 'Peraturan 1 Pengeluaran Sehari:'}</strong>{' '}
                  {isEn
                    ? 'Submitting this request will utilize your daily quota for today. Your balance will be updated instantly.'
                    : 'Pengeluaran ini akan menggunakan kuota harian anda hari ini. Baki akan dikemaskini serta-merta.'}
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{isEn ? 'Submitting...' : 'Menghantar...'}</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Confirm Payout' : 'Sahkan Pengeluaran'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
