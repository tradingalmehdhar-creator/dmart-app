import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  Scale,
  Receipt,
  Banknote,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Search,
  Filter,
  Download,
  Building2,
  Check,
  RotateCcw,
  Edit3,
  Bike,
  Car,
  FileSpreadsheet,
  Eye,
  AlertTriangle,
  X,
  Send,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import {
  Language,
  DeliveryPartnerApplication,
  FleetRider,
  RiderPayoutRequest,
  Order,
  RiderLedgerOrderEntry,
  RiderManualAdjustment,
  RiderClearingSummary,
  RiderWalletTransaction
} from '../../types';
import {
  calculateRiderClearingSummary,
  getSavedRiderAdjustments,
  saveRiderAdjustments,
  INITIAL_RIDER_LEDGER_ENTRIES
} from '../../data/riderLedgerData';
import {
  subscribeToAllRiderLedgers,
  saveRiderLedgerEntryToFirestore,
  seedInitialRiderLedgersIfEmpty
} from '../../firebase_config';
import { exportRiderPayoutSummaryPDF, exportRiderWalletStatementPDF } from '../../utils/pdfGenerator';

interface AdminRiderFinancialAccountsTabProps {
  language: Language;
  applications?: DeliveryPartnerApplication[];
  onUpdateApplicationStatus?: (appId: string, status: DeliveryPartnerApplication['status']) => void;
  fleetRiders: FleetRider[];
  livePayoutRequests: RiderPayoutRequest[];
  onUpdatePayoutRequestStatus: (payoutId: string, status: 'Pending' | 'Completed') => Promise<void>;
  orders: Order[];
  showToast: (msg: string) => void;
}

interface UnifiedRiderAccount {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  plate: string;
  status: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    iban: string;
  };
  summary: RiderClearingSummary;
  ledgerEntries: RiderLedgerOrderEntry[];
  riderPayoutRequests: RiderPayoutRequest[];
}

export const AdminRiderFinancialAccountsTab: React.FC<AdminRiderFinancialAccountsTabProps> = ({
  language,
  applications = [],
  onUpdateApplicationStatus,
  fleetRiders,
  livePayoutRequests,
  onUpdatePayoutRequestStatus,
  orders,
  showToast,
}) => {
  const isEn = language === 'en';

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'positive' | 'negative' | 'pending_payout'>('all');

  // Manual Adjustments State
  const [adjustments, setAdjustments] = useState<RiderManualAdjustment[]>(() => getSavedRiderAdjustments());

  // Real-time Synced Firestore rider_ledgers state
  const [firestoreLedgers, setFirestoreLedgers] = useState<RiderLedgerOrderEntry[]>([]);

  useEffect(() => {
    // Seed initial ledger transactions to Firestore collection 'rider_ledgers' if empty
    seedInitialRiderLedgersIfEmpty(INITIAL_RIDER_LEDGER_ENTRIES);

    // Subscribe to real-time onSnapshot updates from 'rider_ledgers'
    const unsub = subscribeToAllRiderLedgers((liveEntries) => {
      if (liveEntries && liveEntries.length > 0) {
        setFirestoreLedgers(liveEntries);
      }
    });

    return () => unsub();
  }, []);

  // Modal States
  const [selectedRiderForAudit, setSelectedRiderForAudit] = useState<UnifiedRiderAccount | null>(null);
  const [selectedRiderForAdjust, setSelectedRiderForAdjust] = useState<UnifiedRiderAccount | null>(null);

  // Manual Adjustment Form
  const [adjustForm, setAdjustForm] = useState<{
    type: 'credit' | 'debit';
    reason: RiderManualAdjustment['reason'];
    reasonLabel: string;
    amount: string;
    referenceNo: string;
    notes: string;
  }>({
    type: 'credit',
    reason: 'cash_handover_settled',
    reasonLabel: 'Cash Handover Settled at Counter',
    amount: '',
    referenceNo: `ADJ-${Date.now().toString().slice(-6)}`,
    notes: 'Cash collected by rider surrendered to cashier desk',
  });

  // Build unified list of riders combining registered applications and fleet records
  const unifiedRiderAccounts: UnifiedRiderAccount[] = useMemo(() => {
    // 1. First, check active rider from localStorage or standard list
    let savedLocalRider: DeliveryPartnerApplication | null = null;
    try {
      const raw = localStorage.getItem('dmart_rider_app');
      if (raw) savedLocalRider = JSON.parse(raw);
    } catch {}

    const pool: Array<{
      id: string;
      name: string;
      phone: string;
      vehicleType: string;
      plate: string;
      status: string;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      iban: string;
    }> = [];

    // Add logged-in active rider if available
    if (savedLocalRider) {
      pool.push({
        id: savedLocalRider.id || savedLocalRider.referenceNo || 'rider_default',
        name: savedLocalRider.fullName || 'Muhammad Faiz bin Kamarudin',
        phone: savedLocalRider.phoneNumber || '012-3849120',
        vehicleType: savedLocalRider.vehicleType || 'motorcycle',
        plate: savedLocalRider.plateNumber || 'WXY 8912',
        status: savedLocalRider.status || 'approved',
        bankName: savedLocalRider.bankName || 'Maybank (Malayan Banking Berhad)',
        accountNumber: savedLocalRider.accountNumber || '5140 8821 9402',
        accountHolder: savedLocalRider.accountHolder || savedLocalRider.fullName || 'Muhammad Faiz bin Kamarudin',
        iban: savedLocalRider.iban || 'MY24MBBE514088219402',
      });
    }

    // Add registered applications
    applications.forEach((app) => {
      const exists = pool.some((p) => p.id === app.id || p.name === app.fullName);
      if (!exists) {
        pool.push({
          id: app.id,
          name: app.fullName,
          phone: app.phoneNumber,
          vehicleType: app.vehicleType,
          plate: app.plateNumber || 'KL-MTR',
          status: app.status,
          bankName: app.bankName || 'CIMB Bank Berhad',
          accountNumber: app.accountNumber || '7012 9940 1822',
          accountHolder: app.accountHolder || app.fullName,
          iban: app.iban || 'MY18CIMB701299401822',
        });
      }
    });

    // Add fleet riders if not present
    fleetRiders.forEach((fr) => {
      const exists = pool.some((p) => p.name.toLowerCase() === fr.name.toLowerCase() || p.plate === fr.plate);
      if (!exists) {
        pool.push({
          id: fr.id,
          name: fr.name,
          phone: fr.phone,
          vehicleType: fr.vehicleType,
          plate: fr.plate,
          status: fr.status,
          bankName: 'Public Bank Berhad',
          accountNumber: '4819 2011 3829',
          accountHolder: fr.name,
          iban: 'MY32PBB481920113829',
        });
      }
    });

    // Calculate Clearing Statement & Ledger for each rider
    return pool.map((rider, index) => {
      // Find payout requests for this rider
      const riderPayoutRequests = livePayoutRequests.filter(
        (p) => p.riderId === rider.id || p.riderName.toLowerCase() === rider.name.toLowerCase()
      );
      const totalWithdrawn = riderPayoutRequests.reduce((sum, p) => sum + p.amount, 0);

      // Rider specific seed orders: if default rider, use standard baseline; else distribute sample
      const { summary, ledgerEntries } = calculateRiderClearingSummary(
        rider.id,
        rider.name,
        rider.phone,
        [], // uses rich seed baseline
        adjustments,
        totalWithdrawn,
        [],
        firestoreLedgers
      );

      // Add a small deterministic variance per rider if index > 0 for realistic multi-rider table
      if (index === 1) {
        // High COD deficit rider
        summary.totalCashCollected = 168.50;
        summary.totalOnlineEarnings = 72.00;
        summary.totalCommissionFees = 11.20;
        summary.netLedgerBalance = parseFloat((72.00 - 11.20 - 168.50).toFixed(2)); // -RM 107.70
        summary.isOwedToPlatform = true;
        summary.amountOwedToPlatform = 107.70;
        summary.withdrawableBalance = 0;
      } else if (index === 2) {
        // High surplus rider
        summary.totalCashCollected = 22.00;
        summary.totalOnlineEarnings = 195.00;
        summary.totalCommissionFees = 24.50;
        summary.netLedgerBalance = parseFloat((195.00 - 24.50 - 22.00).toFixed(2)); // +RM 148.50
        summary.isOwedToPlatform = false;
        summary.amountOwedToPlatform = 0;
        summary.withdrawableBalance = parseFloat((summary.netLedgerBalance - totalWithdrawn).toFixed(2));
      }

      return {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        vehicleType: rider.vehicleType,
        plate: rider.plate,
        status: rider.status,
        bankDetails: {
          bankName: rider.bankName,
          accountNumber: rider.accountNumber,
          accountHolder: rider.accountHolder,
          iban: rider.iban,
        },
        summary,
        ledgerEntries,
        riderPayoutRequests,
      };
    });
  }, [applications, fleetRiders, livePayoutRequests, adjustments]);

  // Overall Fleet KPI Calculations
  const totalFleetCashCollected = unifiedRiderAccounts.reduce((sum, r) => sum + r.summary.totalCashCollected, 0);
  const totalFleetOnlineEarnings = unifiedRiderAccounts.reduce((sum, r) => sum + r.summary.totalOnlineEarnings, 0);
  const totalFleetCommissions = unifiedRiderAccounts.reduce((sum, r) => sum + r.summary.totalCommissionFees, 0);
  const totalFleetNetBalance = unifiedRiderAccounts.reduce((sum, r) => sum + r.summary.netLedgerBalance, 0);
  const totalPendingPayoutsCount = livePayoutRequests.filter((p) => p.status === 'Pending').length;
  const totalPendingPayoutsAmount = livePayoutRequests
    .filter((p) => p.status === 'Pending')
    .reduce((sum, p) => sum + p.amount, 0);

  // Filtered Riders List
  const filteredRiders = unifiedRiderAccounts.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.bankDetails.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.bankDetails.accountNumber.includes(searchQuery);

    if (!matchesSearch) return false;

    if (balanceFilter === 'positive') return !r.summary.isOwedToPlatform;
    if (balanceFilter === 'negative') return r.summary.isOwedToPlatform;
    if (balanceFilter === 'pending_payout') return r.riderPayoutRequests.some((p) => p.status === 'Pending');

    return true;
  });

  // Handle Create Manual Ledger Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRiderForAdjust) return;

    const amountNum = parseFloat(adjustForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast(isEn ? 'Please enter a valid adjustment amount.' : 'Sila masukkan jumlah pelarasan yang sah.');
      return;
    }

    const newAdj: RiderManualAdjustment = {
      id: `adj-${Date.now()}`,
      riderId: selectedRiderForAdjust.id,
      riderName: selectedRiderForAdjust.name,
      type: adjustForm.type,
      reason: adjustForm.reason,
      reasonLabel: adjustForm.reasonLabel || adjustForm.reason.replace(/_/g, ' '),
      amount: amountNum,
      referenceNo: adjustForm.referenceNo || `ADJ-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      adminName: 'Razali Osman (Finance Admin)',
      notes: adjustForm.notes,
    };

    const updated = [newAdj, ...adjustments];
    setAdjustments(updated);
    saveRiderAdjustments(updated);

    // Persist adjustment to Firestore 'rider_ledgers' collection for real-time syncing
    const newLedgerDoc: RiderLedgerOrderEntry = {
      id: newAdj.id,
      orderNumber: newAdj.referenceNo,
      customerName: `Adjustment: ${newAdj.reasonLabel}`,
      completedAt: newAdj.createdAt,
      paymentType: newAdj.type === 'credit' ? 'Online / Card Payment' : 'Cash on Delivery',
      paymentMethod: 'card',
      grossOrderAmount: amountNum,
      deliveryEarning: newAdj.type === 'credit' ? amountNum : 0,
      platformCommission: 0,
      cashCollected: newAdj.type === 'debit' ? amountNum : 0,
      onlineEarnings: newAdj.type === 'credit' ? amountNum : 0,
      netAmountEffect: newAdj.type === 'credit' ? amountNum : -amountNum,
      runningBalance: 0,
      notes: newAdj.notes,
      status: 'Completed',
    };
    saveRiderLedgerEntryToFirestore(newLedgerDoc);

    // Refresh selected rider audit modal if open
    if (selectedRiderForAudit && selectedRiderForAudit.id === selectedRiderForAdjust.id) {
      setSelectedRiderForAudit({
        ...selectedRiderForAudit,
        summary: {
          ...selectedRiderForAudit.summary,
          netLedgerBalance:
            adjustForm.type === 'credit'
              ? selectedRiderForAudit.summary.netLedgerBalance + amountNum
              : selectedRiderForAudit.summary.netLedgerBalance - amountNum,
        },
      });
    }

    setIsAdjustmentModalOpen(false);
    setSelectedRiderForAdjust(null);
    setAdjustForm({
      type: 'credit',
      reason: 'cash_handover_settled',
      reasonLabel: 'Cash Handover Settled at Counter',
      amount: '',
      referenceNo: `ADJ-${Date.now().toString().slice(-6)}`,
      notes: 'Cash collected by rider surrendered to cashier desk',
    });

    showToast(
      isEn
        ? `Ledger adjusted: ${adjustForm.type === 'credit' ? '+RM' : '-RM'} ${amountNum.toFixed(2)} for ${selectedRiderForAdjust.name}`
        : `Pelarasan lejar berjaya direkodkan.`
    );
  };

  // Quick Counter Settle Cash Handover
  const handleQuickSettleCash = (rider: UnifiedRiderAccount) => {
    if (rider.summary.totalCashCollected <= 0) {
      showToast(isEn ? 'No outstanding cash collections to settle.' : 'Tiada kutipan tunai tertunggak.');
      return;
    }

    const settleAmount = rider.summary.totalCashCollected;
    const newAdj: RiderManualAdjustment = {
      id: `adj-settle-${Date.now()}`,
      riderId: rider.id,
      riderName: rider.name,
      type: 'credit',
      reason: 'cash_handover_settled',
      reasonLabel: 'Cash Handover Settled at Counter',
      amount: settleAmount,
      referenceNo: `SETTLE-HO-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      adminName: 'Nurul Huda (Cashier Supervisor)',
      notes: `Cash collection of RM ${settleAmount.toFixed(2)} received at Cashier Register POS-01`,
    };

    const updated = [newAdj, ...adjustments];
    setAdjustments(updated);
    saveRiderAdjustments(updated);

    showToast(
      isEn
        ? `Cash handover of RM ${settleAmount.toFixed(2)} settled for ${rider.name}. Cash collection cleared.`
        : `Kutipan tunai RM ${settleAmount.toFixed(2)} bagi ${rider.name} telah diserahkan di kaunter.`
    );
  };

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* 1. REAL-TIME FLEET FINANCIAL CLEARING KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Net Fleet Clearing Balance */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-15 pointer-events-none">
            <Scale className="w-24 h-24" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>{isEn ? 'Net Fleet Balance' : 'Baki Bersih Fleet'}</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                totalFleetNetBalance >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {totalFleetNetBalance >= 0 ? (isEn ? 'Creditor (Owed)' : 'Pemiutang') : (isEn ? 'Debtor (Owes)' : 'Penghutang')}
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-1 ${
              totalFleetNetBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {totalFleetNetBalance < 0 ? '-' : ''}RM {Math.abs(totalFleetNetBalance).toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-300 mt-2">
            {isEn ? 'Net balance across all active riders' : 'Baki bersih keseluruhan penghantar'}
          </p>
        </div>

        {/* Total Cash Collected by Fleet (Debited) */}
        <div className="rounded-2xl bg-white border border-amber-200 p-4 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-amber-600" />
                <span>{isEn ? 'Fleet COD Cash' : 'Tunai COD Fleet'}</span>
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded-full">
                {isEn ? 'In-Hand Debited' : 'Didebit'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-700 mt-1">
              RM {totalFleetCashCollected.toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {isEn ? 'Cash-on-delivery collections carried by riders' : 'Tunai kutipan pelanggan dipegang rider'}
          </p>
        </div>

        {/* Total Online Order Earnings (Credited) */}
        <div className="rounded-2xl bg-white border border-teal-200 p-4 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                <span>{isEn ? 'Online Earnings' : 'Gaji Online Owed'}</span>
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded-full">
                {isEn ? 'Gross Credited' : 'Dikredit'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-teal-700 mt-1">
              RM {totalFleetOnlineEarnings.toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {isEn ? 'Earnings owed from card & FPX orders' : 'Pendapatan daripada pesanan online'}
          </p>
        </div>

        {/* Platform Commissions Retained */}
        <div className="rounded-2xl bg-white border border-rose-200 p-4 shadow-xs flex flex-col justify-between hover:border-rose-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-rose-600" />
                <span>{isEn ? 'Platform Fees' : 'Komisen Platform'}</span>
              </span>
              <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-1.5 py-0.5 rounded-full">
                {isEn ? 'Retained' : 'Ditolak'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-700 mt-1">
              RM {totalFleetCommissions.toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {isEn ? 'Automatically deducted per delivery order' : 'Ditolak automatik setiap pesanan selesai'}
          </p>
        </div>

        {/* Daily Payout Requests Pending Review */}
        <div className="rounded-2xl bg-white border border-blue-200 p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>{isEn ? 'Pending Payouts' : 'Payout Menunggu'}</span>
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                totalPendingPayoutsCount > 0 ? 'bg-amber-100 text-amber-900 animate-pulse' : 'bg-gray-100 text-gray-700'
              }`}>
                {totalPendingPayoutsCount} {isEn ? 'Reqs' : 'Permohonan'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-blue-700 mt-1">
              RM {totalPendingPayoutsAmount.toFixed(2)}
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {isEn ? 'Daily instant withdrawal requests in audit queue' : 'Permohonan pengeluaran sedia disahkan'}
          </p>
        </div>
      </div>

      {/* 2. RIDER FINANCIAL DIRECTORY & REAL-TIME LEDGER MANAGEMENT TABLE */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50 via-emerald-50/20 to-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-gray-900">
                  {isEn ? 'Rider Financial Accounts & Dual-View Clearing Ledgers' : 'Akaun Kewangan & Lejar Penjelasan Penghantar'}
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Real-Time Audit
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {isEn
                  ? 'Dual-view clearing statement breakdown: Cash in hand, Online earnings, Commissions, Net balance, and Payout requests.'
                  : 'Pengurusan lejar lengkap: Tunai dikutip, gaji online, komisen, dan permohonan payout.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search rider, plate, phone, bank...' : 'Cari rider, plat, bank...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Manual Adjustment trigger */}
            <button
              type="button"
              onClick={() => {
                setSelectedRiderForAdjust(unifiedRiderAccounts[0] || null);
                setIsAdjustmentModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? 'Manual Adjust' : 'Pelarasan Lejar'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-4 py-2 bg-gray-50/60 border-b border-gray-100 flex items-center gap-2 overflow-x-auto text-[11px] font-semibold">
          <span className="text-gray-500 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>{isEn ? 'Filter:' : 'Tapis:'}</span>
          </span>
          <button
            type="button"
            onClick={() => setBalanceFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              balanceFilter === 'all' ? 'bg-gray-900 text-white font-bold' : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            {isEn ? 'All Accounts' : 'Semua Akaun'} ({unifiedRiderAccounts.length})
          </button>
          <button
            type="button"
            onClick={() => setBalanceFilter('positive')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              balanceFilter === 'positive' ? 'bg-emerald-700 text-white font-bold' : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{isEn ? 'Positive Surplus (Withdrawable)' : 'Lebihan Boleh Keluar'}</span>
          </button>
          <button
            type="button"
            onClick={() => setBalanceFilter('negative')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              balanceFilter === 'negative' ? 'bg-rose-700 text-white font-bold' : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>{isEn ? 'Negative Balance (Owed to Platform)' : 'Baki Negatif (Hutang Platform)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setBalanceFilter('pending_payout')}
            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
              balanceFilter === 'pending_payout' ? 'bg-blue-700 text-white font-bold' : 'bg-white text-blue-800 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{isEn ? 'Has Pending Payout' : 'Ada Payout Menunggu'}</span>
          </button>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                <th className="p-3">{isEn ? 'Rider Identity' : 'Maklumat Penghantar'}</th>
                <th className="p-3">{isEn ? 'Bank Destination & IBAN' : 'Maklumat Bank & IBAN'}</th>
                <th className="p-3 text-right">{isEn ? 'Cash Collected' : 'Tunai COD Dikutip'}</th>
                <th className="p-3 text-right">{isEn ? 'Online Earnings' : 'Gaji Atas Talian'}</th>
                <th className="p-3 text-right">{isEn ? 'Commissions' : 'Komisen'}</th>
                <th className="p-3 text-right">{isEn ? 'Net Ledger Balance' : 'Baki Bersih Lejar'}</th>
                <th className="p-3">{isEn ? 'Payout Requests' : 'Permohonan Payout'}</th>
                <th className="p-3 text-right">{isEn ? 'Admin Actions' : 'Tindakan'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredRiders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    <Scale className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="font-semibold text-xs">{isEn ? 'No rider accounts match the filter criteria.' : 'Tiada rekod penghantar ditemui.'}</p>
                  </td>
                </tr>
              ) : (
                filteredRiders.map((rider) => {
                  const hasPending = rider.riderPayoutRequests.some((p) => p.status === 'Pending');
                  const isNegative = rider.summary.isOwedToPlatform;

                  return (
                    <tr key={rider.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Rider Identity */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                            {rider.vehicleType === 'car' ? <Car className="w-3.5 h-3.5" /> : <Bike className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block">{rider.name}</span>
                            <span className="font-mono text-[10px] text-gray-500 block">
                              {rider.plate} • {rider.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Bank Destination & IBAN */}
                      <td className="p-3">
                        <span className="font-semibold text-gray-900 block">{rider.bankDetails.bankName}</span>
                        <span className="font-mono text-emerald-800 text-[11px] block">
                          {rider.bankDetails.accountNumber} ({rider.bankDetails.accountHolder})
                        </span>
                        <span className="font-mono text-[10px] text-gray-400 block truncate max-w-[150px]">
                          IBAN: {rider.bankDetails.iban}
                        </span>
                      </td>

                      {/* Total Cash Collected (Debited) */}
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-amber-700 block">
                          RM {rider.summary.totalCashCollected.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 block uppercase">{isEn ? 'Debited' : 'Didebit'}</span>
                      </td>

                      {/* Online Earnings (Credited) */}
                      <td className="p-3 text-right">
                        <span className="font-mono font-bold text-teal-700 block">
                          RM {rider.summary.totalOnlineEarnings.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 block uppercase">{isEn ? 'Credited' : 'Dikredit'}</span>
                      </td>

                      {/* Commissions */}
                      <td className="p-3 text-right">
                        <span className="font-mono font-semibold text-rose-600 block">
                          -RM {rider.summary.totalCommissionFees.toFixed(2)}
                        </span>
                        <span className="text-[9px] text-gray-400 block uppercase">{isEn ? 'Platform Fee' : 'Komisen'}</span>
                      </td>

                      {/* Net Ledger Balance */}
                      <td className="p-3 text-right">
                        <div className="inline-block">
                          <span
                            className={`font-mono font-black text-xs px-2 py-0.5 rounded-full inline-block ${
                              isNegative
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {rider.summary.netLedgerBalance < 0 ? '-' : '+'}RM {Math.abs(rider.summary.netLedgerBalance).toFixed(2)}
                          </span>
                          <span className={`text-[9px] font-bold block mt-0.5 ${
                            isNegative ? 'text-rose-700' : 'text-emerald-700'
                          }`}>
                            {isNegative
                              ? (isEn ? 'Owed to Platform' : 'Hutang Platform')
                              : (isEn ? 'Withdrawable Surplus' : 'Boleh Keluar')}
                          </span>
                        </div>
                      </td>

                      {/* Payout Requests */}
                      <td className="p-3">
                        {hasPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{rider.riderPayoutRequests.filter((p) => p.status === 'Pending').length} Pending</span>
                          </span>
                        ) : rider.riderPayoutRequests.length > 0 ? (
                          <span className="text-[10px] text-gray-600 font-mono">
                            {rider.riderPayoutRequests.length} Disbursed (RM {rider.summary.totalWithdrawn.toFixed(2)})
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">None</span>
                        )}
                      </td>

                      {/* Admin Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Full Statement / Audit Details Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedRiderForAudit(rider)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 hover:text-emerald-950 rounded-xl text-xs font-bold transition-all cursor-pointer border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95"
                            title={isEn ? "View Full Statement & Audit Details" : "Lihat Penyata Penuh & Butiran Audit"}
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{isEn ? 'View Full Statement' : 'Penyata Penuh'}</span>
                          </button>

                          {/* Quick Settle Cash Handover */}
                          {rider.summary.totalCashCollected > 0 && (
                            <button
                              type="button"
                              onClick={() => handleQuickSettleCash(rider)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-amber-200 inline-flex items-center gap-1 shadow-2xs"
                              title="Settle Cash Handover at Counter"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-600" />
                              <span>{isEn ? 'Settle' : 'Serah'}</span>
                            </button>
                          )}

                          {/* Manual Adjust Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRiderForAdjust(rider);
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 cursor-pointer"
                            title="Manual Ledger Adjustment"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: INDIVIDUAL RIDER STATEMENT & AUDIT DRAWER                          */}
      {/* ========================================================================= */}
      {selectedRiderForAudit && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-gray-900">
                      {isEn ? 'Rider Statement of Account & Audit Ledger' : 'Penyata Akaun & Audit Lejar Penghantar'}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedRiderForAudit.summary.isOwedToPlatform
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {selectedRiderForAudit.summary.isOwedToPlatform
                        ? (isEn ? 'Negative Balance' : 'Baki Negatif')
                        : (isEn ? 'Positive Surplus' : 'Lebihan Bersih')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {selectedRiderForAudit.name} • {selectedRiderForAudit.phone} • {selectedRiderForAudit.plate}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRiderForAdjust(selectedRiderForAudit);
                    setIsAdjustmentModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isEn ? 'Record Adjustment' : 'Pelarasan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRiderForAudit(null)}
                  className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Rider Banking & Clearing Formula Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Destination Bank Details Card */}
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  {isEn ? 'Destination Bank Account Details' : 'Akaun Bank Penerima'}
                </span>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isEn ? 'Bank Name:' : 'Bank:'}</span>
                  <span className="font-bold text-gray-900">{selectedRiderForAudit.bankDetails.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isEn ? 'Account Number:' : 'No. Akaun:'}</span>
                  <span className="font-mono font-bold text-emerald-800">{selectedRiderForAudit.bankDetails.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isEn ? 'Account Holder:' : 'Nama Pemegang:'}</span>
                  <span className="font-bold text-gray-900">{selectedRiderForAudit.bankDetails.accountHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{isEn ? 'IBAN / Swift:' : 'IBAN / Swift:'}</span>
                  <span className="font-mono text-gray-700">{selectedRiderForAudit.bankDetails.iban}</span>
                </div>
              </div>

              {/* Clearing Formula Card */}
              <div className={`rounded-2xl p-3.5 border text-xs flex flex-col justify-between ${
                selectedRiderForAudit.summary.isOwedToPlatform
                  ? 'bg-rose-50 border-rose-200 text-rose-950'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    {isEn ? 'Clearing Balance Formula' : 'Formula Penjelasan Baki'}
                  </span>
                  <div className="font-mono text-[11px] mt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span>{isEn ? 'Total Online Earnings (Credited):' : 'Gaji Online (Dikredit):'}</span>
                      <strong className="text-teal-700">+RM {selectedRiderForAudit.summary.totalOnlineEarnings.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{isEn ? 'Platform Commission Fees (Deducted):' : 'Komisen Platform (Ditolak):'}</span>
                      <strong className="text-rose-600">-RM {selectedRiderForAudit.summary.totalCommissionFees.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>{isEn ? 'Total Cash Collected (Debited in hand):' : 'Tunai COD Dikutip (Didebit):'}</span>
                      <strong className="text-amber-700">-RM {selectedRiderForAudit.summary.totalCashCollected.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-black/10 font-bold">
                  <span>{isEn ? 'Net Withdrawable Balance:' : 'Baki Bersih Boleh Keluar:'}</span>
                  <span className={`font-mono text-base ${
                    selectedRiderForAudit.summary.isOwedToPlatform ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {selectedRiderForAudit.summary.netLedgerBalance < 0 ? '-' : ''}RM {Math.abs(selectedRiderForAudit.summary.netLedgerBalance).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Daily Payout Requests Section for this Rider */}
            {selectedRiderForAudit.riderPayoutRequests.length > 0 && (
              <div className="bg-white rounded-2xl border border-blue-200 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isEn ? 'Daily Payout Requests (Instant Withdrawals)' : 'Permohonan Payout Harian'}</span>
                  </h4>
                  <span className="text-[10px] text-blue-700 font-mono">
                    Firestore: payout_requests
                  </span>
                </div>

                <div className="divide-y divide-gray-100 text-xs">
                  {selectedRiderForAudit.riderPayoutRequests.map((req) => {
                    const isPending = req.status === 'Pending';
                    return (
                      <div key={req.id} className="py-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-gray-900">{req.id}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded-full ${
                              req.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-500 block">
                            {new Date(req.requestedAt).toLocaleString(isEn ? 'en-MY' : 'ms-MY')} • {req.bankDetails?.bankName} ({req.bankDetails?.accountNumber})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-sm text-emerald-700">
                            RM {req.amount.toFixed(2)}
                          </span>
                          {isPending && (
                            <button
                              type="button"
                              onClick={async () => {
                                await onUpdatePayoutRequestStatus(req.id, 'Completed');
                                showToast(isEn ? `Payout ${req.id} marked as Completed!` : `Payout ${req.id} disahkan selesai!`);
                                // update local modal copy
                                const updatedReqs = selectedRiderForAudit.riderPayoutRequests.map((p) =>
                                  p.id === req.id ? { ...p, status: 'Completed' as const } : p
                                );
                                setSelectedRiderForAudit({ ...selectedRiderForAudit, riderPayoutRequests: updatedReqs });
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isEn ? 'Mark Completed' : 'Sahkan Selesai'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RUNNING ORDER LEDGER TABLE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isEn ? 'Running Ledger & Order Statement Breakdown' : 'Pecahan Lejar & Penyata Pesanan Berjalan'}</span>
                </h4>
                <span className="text-[10px] text-gray-500 font-mono">
                  {selectedRiderForAudit.ledgerEntries.length} {isEn ? 'completed orders' : 'pesanan selesai'}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                      <th className="p-2.5">{isEn ? 'Order & Time' : 'Pesanan'}</th>
                      <th className="p-2.5">{isEn ? 'Payment Type' : 'Kaedah'}</th>
                      <th className="p-2.5 text-right">{isEn ? 'Gross Order' : 'Kasar'}</th>
                      <th className="p-2.5 text-right">{isEn ? 'Commission Fee' : 'Komisen'}</th>
                      <th className="p-2.5 text-right">{isEn ? 'Net Amount' : 'Kesan Bersih'}</th>
                      <th className="p-2.5 text-right">{isEn ? 'Running Balance' : 'Baki Berjalan'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {selectedRiderForAudit.ledgerEntries.map((entry) => {
                      const isCod = entry.paymentType === 'Cash on Delivery';
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50/70">
                          <td className="p-2.5">
                            <span className="font-mono font-bold text-gray-900 block">#{entry.orderNumber}</span>
                            <span className="text-[10px] text-gray-500 block">
                              {entry.customerName} • {new Date(entry.completedAt).toLocaleTimeString(isEn ? 'en-MY' : 'ms-MY', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {isCod ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                                <Banknote className="w-3 h-3 text-amber-600" />
                                <span>COD (Cash)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900">
                                <CreditCard className="w-3 h-3 text-teal-700" />
                                <span>Online Paid</span>
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-gray-800">
                            RM {entry.grossOrderAmount.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-rose-600 font-semibold">
                            -RM {entry.platformCommission.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right">
                            <span className={`font-mono font-black text-xs ${
                              entry.netAmountEffect >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {entry.netAmountEffect >= 0 ? '+' : ''}RM {entry.netAmountEffect.toFixed(2)}
                            </span>
                          </td>
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
            </div>

            {/* Actions footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-mono">
                D-mart Fleet Clearing Engine • Audited
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const riderFleetObj: FleetRider = {
                      id: selectedRiderForAudit.id,
                      name: selectedRiderForAudit.name,
                      phone: selectedRiderForAudit.phone,
                      plate: selectedRiderForAudit.plate,
                      vehicleType: (selectedRiderForAudit.vehicleType === 'car' || selectedRiderForAudit.vehicleType === 'van' ? selectedRiderForAudit.vehicleType : 'motorcycle'),
                      status: (selectedRiderForAudit.status === 'delivering' ? 'delivering' : 'idle'),
                      destination: 'KL Central Hub',
                      etaMin: 12,
                      lat: 3.1118,
                      lng: 101.6644,
                      battery: '94%',
                      speed: '32 km/h',
                      walletBalance: selectedRiderForAudit.summary.netLedgerBalance,
                      codCollected: selectedRiderForAudit.summary.totalCashCollected,
                      currentOrderId: undefined,
                      rating: 4.9,
                      completedDeliveries: selectedRiderForAudit.ledgerEntries.length,
                    };
                    const convertedTxs: RiderWalletTransaction[] = selectedRiderForAudit.ledgerEntries.map((e) => ({
                      id: e.id,
                      riderId: selectedRiderForAudit.id,
                      riderName: selectedRiderForAudit.name,
                      type: e.netAmountEffect >= 0 ? 'delivery_payout' : 'cod_settlement',
                      amount: e.netAmountEffect,
                      notes: e.notes || `${e.paymentType} • Order #${e.orderNumber}`,
                      createdAt: e.completedAt,
                      referenceNo: e.orderNumber,
                    }));
                    exportRiderWalletStatementPDF(riderFleetObj, convertedTxs);
                    showToast(`Downloaded PDF Statement for ${selectedRiderForAudit.name}`);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{isEn ? 'Download PDF Statement' : 'Muat Turun Penyata PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRiderForAudit(null)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  {isEn ? 'Close Audit View' : 'Tutup Audit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL LEDGER ADJUSTMENT                                           */}
      {/* ========================================================================= */}
      {isAdjustmentModalOpen && selectedRiderForAdjust && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900">
                    {isEn ? 'Manual Rider Ledger Adjustment' : 'Pelarasan Lejar Penghantar Manual'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-mono">
                    {selectedRiderForAdjust.name} ({selectedRiderForAdjust.plate})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdjustmentModalOpen(false);
                  setSelectedRiderForAdjust(null);
                }}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-3.5 text-xs">
              {/* Target Rider Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Select Rider Account' : 'Pilih Akaun Penghantar'}
                </label>
                <select
                  value={selectedRiderForAdjust.id}
                  onChange={(e) => {
                    const found = unifiedRiderAccounts.find((r) => r.id === e.target.value);
                    if (found) setSelectedRiderForAdjust(found);
                  }}
                  className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                >
                  {unifiedRiderAccounts.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.plate}) — Net: RM {r.summary.netLedgerBalance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Adjustment Type (Credit vs Debit) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Adjustment Direction' : 'Jenis Pelarasan'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'credit' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      adjustForm.type === 'credit'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-2xs font-black'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Credit Rider</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'debit' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      adjustForm.type === 'debit'
                        ? 'bg-rose-50 text-rose-800 border-rose-500 shadow-2xs font-black'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    <span>- Debit Rider</span>
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Adjustment Category / Reason' : 'Sebab Pelarasan'}
                </label>
                <select
                  value={adjustForm.reason}
                  onChange={(e) => {
                    const r = e.target.value as RiderManualAdjustment['reason'];
                    const labels: Record<string, string> = {
                      cash_handover_settled: 'Cash Handover Settled at Counter',
                      commission_rebate: 'Platform Commission Rebate / Incentive',
                      bonus: 'Performance & Fuel Allowance Bonus',
                      penalty_correction: 'Order Discrepancy / Shortage Correction',
                      manual_adjustment: 'General Financial Audit Adjustment',
                    };
                    setAdjustForm({
                      ...adjustForm,
                      reason: r,
                      reasonLabel: labels[r] || r,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                >
                  <option value="cash_handover_settled">Cash Handover Settled at Counter (Surrender COD)</option>
                  <option value="commission_rebate">Platform Commission Rebate / Peak Hour Subsidy</option>
                  <option value="bonus">Delivery Speed Bonus / Fuel Allowance</option>
                  <option value="penalty_correction">Cash Shortage / Item Return Correction</option>
                  <option value="manual_adjustment">General Reconciliation Adjustment</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Adjustment Amount (RM)' : 'Jumlah Pelarasan (RM)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-500">
                    RM
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.10"
                    required
                    value={adjustForm.amount}
                    onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-11 pr-3 py-2 border rounded-xl font-mono font-bold text-base bg-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Reference No & Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Reference Number' : 'Nombor Rujukan'}
                </label>
                <input
                  type="text"
                  required
                  value={adjustForm.referenceNo}
                  onChange={(e) => setAdjustForm({ ...adjustForm, referenceNo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {isEn ? 'Audit Notes' : 'Nota Audit'}
                </label>
                <textarea
                  rows={2}
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
                  placeholder="Reason for manual adjustment..."
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustmentModalOpen(false);
                    setSelectedRiderForAdjust(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs cursor-pointer"
                >
                  {isEn ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Apply Adjustment' : 'Laksana Pelarasan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
