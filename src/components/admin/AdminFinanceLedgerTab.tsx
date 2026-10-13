import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Landmark,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  CreditCard,
  Download,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Plus,
  Building2,
  Receipt,
  FileCheck,
  Check,
  ShieldCheck,
  Clock,
  Printer,
  Wallet,
  ArrowDownLeft,
  Search,
  Filter,
  User,
  Coins,
  Scale,
  Bike,
  Sparkles,
  ChevronRight,
  Info,
  X,
  RefreshCw
} from 'lucide-react';
import {
  BusinessDocument,
  RiderPayout,
  StoreBankInfo,
  Language,
  Order,
  DailyClosureRecord,
  MerchantPartner,
  PartnerLedgerEntry,
  FleetRider,
  ManualLedgerTransaction,
  RiderPayoutRequest,
  DeliveryPartnerApplication
} from '../../types';
import {
  subscribeToAllPayoutRequests,
  updatePayoutRequestStatusInFirestore
} from '../../firebase_config';
import {
  seedPayoutLedgerMockData,
  fetchPartnerOrders,
  fetchPayoutLedgerRecords,
  calculateNetPayout,
  PartnerOrderDoc,
  PayoutLedgerDoc,
} from '../../services/seedPayoutLedger';
import {
  INITIAL_DAILY_CLOSURES,
  INITIAL_MERCHANT_PARTNERS,
  INITIAL_PARTNER_LEDGER_ENTRIES,
  INITIAL_FLEET_RIDERS
} from '../../data/adminInitialData';
import {
  exportRiderPayoutSummaryPDF,
  exportRiderPayoutsCSV,
  exportDailyClosurePDF,
  exportDailyClosuresCSV,
  exportOrdersReconciliationCSV
} from '../../utils/pdfGenerator';
import { AdminRiderFinancialAccountsTab } from './AdminRiderFinancialAccountsTab';

interface AdminFinanceLedgerTabProps {
  documents: BusinessDocument[];
  payouts: RiderPayout[];
  bankInfo: StoreBankInfo;
  onUpdatePayoutStatus: (payoutId: string, status: RiderPayout['status']) => void;
  onUpdateBankInfo: (info: StoreBankInfo) => void;
  orders: Order[];
  language: Language;
  partners?: MerchantPartner[];
  partnerLedger?: PartnerLedgerEntry[];
  onUpdatePartners?: (partners: MerchantPartner[]) => void;
  onUpdatePartnerLedger?: (entries: PartnerLedgerEntry[]) => void;
  applications?: DeliveryPartnerApplication[];
  onUpdateApplicationStatus?: (appId: string, status: DeliveryPartnerApplication['status']) => void;
  initialSubTab?: 'closures' | 'creditors' | 'rider_accounts' | 'ledger' | 'banking';
}

export const AdminFinanceLedgerTab: React.FC<AdminFinanceLedgerTabProps> = ({
  documents,
  payouts,
  bankInfo,
  onUpdatePayoutStatus,
  onUpdateBankInfo,
  orders,
  language,
  partners = INITIAL_MERCHANT_PARTNERS,
  partnerLedger = INITIAL_PARTNER_LEDGER_ENTRIES,
  onUpdatePartners,
  onUpdatePartnerLedger,
  applications = [],
  onUpdateApplicationStatus,
  initialSubTab,
}) => {
  // Navigation Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'closures' | 'creditors' | 'rider_accounts' | 'ledger' | 'banking'>(
    initialSubTab || 'closures'
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Daily Closures State (persisted to localStorage)
  const [dailyClosures, setDailyClosures] = useState<DailyClosureRecord[]>(() => {
    const saved = localStorage.getItem('dmart_daily_closures');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_CLOSURES;
  });

  // Partner Payout Ledger Testing State (PARTNER_TEST_01 / Almehdhar Trading Co.)
  const [partnerTestOrders, setPartnerTestOrders] = useState<PartnerOrderDoc[]>([]);
  const [partnerTestLedgers, setPartnerTestLedgers] = useState<PayoutLedgerDoc[]>([]);
  const [isSeedingPayoutLedger, setIsSeedingPayoutLedger] = useState(false);
  const [isFetchingPartnerData, setIsFetchingPartnerData] = useState(false);
  const [seedSuccessNotice, setSeedSuccessNotice] = useState<string | null>(null);

  const refreshPartnerTestData = async () => {
    setIsFetchingPartnerData(true);
    try {
      const [ordersList, ledgersList] = await Promise.all([
        fetchPartnerOrders('PARTNER_TEST_01'),
        fetchPayoutLedgerRecords('PARTNER_TEST_01'),
      ]);
      setPartnerTestOrders(ordersList);
      setPartnerTestLedgers(ledgersList);
    } finally {
      setIsFetchingPartnerData(false);
    }
  };

  useEffect(() => {
    refreshPartnerTestData();
  }, []);

  const handleSeedPayoutLedger = async () => {
    setIsSeedingPayoutLedger(true);
    try {
      const res = await seedPayoutLedgerMockData();
      if (res.success) {
        setSeedSuccessNotice(res.message);
        setTimeout(() => setSeedSuccessNotice(null), 6000);
        await refreshPartnerTestData();
      }
    } finally {
      setIsSeedingPayoutLedger(false);
    }
  };

  const partnerCalculation = calculateNetPayout(
    partnerTestOrders,
    partnerTestLedgers[0]?.commissionRate ?? 0.1
  );

  // Fleet Riders State for Creditor/Debtor tracking (wallet balance = Creditor, COD cash = Debtor)
  const [fleetRiders, setFleetRiders] = useState<FleetRider[]>(() => {
    const saved = localStorage.getItem('dmart_fleet_riders_finance');
    return saved ? JSON.parse(saved) : INITIAL_FLEET_RIDERS;
  });

  // Manual Ledger Transactions (Payouts & Incoming settlements audit trail)
  const [manualTransactions, setManualTransactions] = useState<ManualLedgerTransaction[]>(() => {
    const saved = localStorage.getItem('dmart_manual_ledger_tx');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'tx-man-001',
        type: 'manual_payout',
        entityType: 'supplier',
        entityId: 'mch-01',
        entityName: 'Cameron Highlands Organic Agro Farm',
        entityCode: 'MERCH-8821',
        amount: 1200.00,
        paymentMethod: 'Maybank2E Corporate GIRO',
        referenceNo: 'GIRO-202609-8812',
        notes: 'Weekly fresh harvest produce supply settlement',
        timestamp: '2026-09-22 15:30',
        recordedBy: 'Razali Osman (Manager)',
        status: 'completed',
      },
      {
        id: 'tx-man-002',
        type: 'incoming_settlement',
        entityType: 'rider',
        entityId: 'f-3',
        entityName: 'Raveen A/L Ganesan',
        entityCode: 'BRP 9014',
        amount: 120.50,
        paymentMethod: 'Cash at Cashier Desk',
        referenceNo: 'COD-COL-9014',
        notes: 'End of shift Cash-on-Delivery collections handover',
        timestamp: '2026-09-22 18:45',
        recordedBy: 'Nurul Huda (Cashier)',
        status: 'completed',
      },
      {
        id: 'tx-man-003',
        type: 'manual_payout',
        entityType: 'rider',
        entityId: 'f-1',
        entityName: 'Muhammad Haziq Bin Yusof',
        entityCode: 'WXY 8912',
        amount: 150.00,
        paymentMethod: 'Instant DuitNow',
        referenceNo: 'DN-PAY-202609-01',
        notes: 'Mid-week wallet earnings cash withdrawal',
        timestamp: '2026-09-21 16:00',
        recordedBy: 'Razali Osman (Manager)',
        status: 'completed',
      },
    ];
  });

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live Order Sales Journal Filters & Reconciliation CSV State
  const [journalSearch, setJournalSearch] = useState('');
  const [journalStatusFilter, setJournalStatusFilter] = useState('all');
  const [journalPaymentFilter, setJournalPaymentFilter] = useState('all');

  const filteredJournalOrders = orders.filter((ord) => {
    if (journalSearch.trim()) {
      const q = journalSearch.toLowerCase();
      const matchNo = (ord.orderNumber || '').toLowerCase().includes(q);
      const matchCust = (ord.deliveryAddress?.recipientName || '').toLowerCase().includes(q);
      const matchPhone = (ord.deliveryAddress?.phone || '').toLowerCase().includes(q);
      if (!matchNo && !matchCust && !matchPhone) return false;
    }
    if (journalStatusFilter !== 'all') {
      const s = (ord.status || '').toLowerCase();
      if (journalStatusFilter === 'delivered' && s !== 'delivered' && s !== 'completed') return false;
      if (journalStatusFilter === 'out_for_delivery' && s !== 'out_for_delivery') return false;
      if (journalStatusFilter === 'packing' && s !== 'packing' && s !== 'preparing') return false;
      if (journalStatusFilter === 'submitted' && s !== 'submitted' && s !== 'received') return false;
    }
    if (journalPaymentFilter !== 'all') {
      if ((ord.paymentMethod || '').toUpperCase() !== journalPaymentFilter.toUpperCase()) return false;
    }
    return true;
  });

  const journalTotalCredited = filteredJournalOrders.reduce((acc, o) => acc + (o.total || 0), 0);

  const handleExportJournalCSV = () => {
    if (filteredJournalOrders.length === 0) {
      showToast(language === 'en' ? 'No orders match criteria to export.' : 'Tiada pesanan sepadan untuk dieksport.');
      return;
    }
    const res = exportOrdersReconciliationCSV(filteredJournalOrders, {
      statusFilter: journalStatusFilter,
      paymentFilter: journalPaymentFilter,
      searchQuery: journalSearch,
    });
    showToast(
      language === 'en'
        ? `Exported ${res.count} orders (RM ${res.totalAmount.toFixed(2)}) for reconciliation.`
        : `Berjaya memuat turun ${res.count} pesanan (RM ${res.totalAmount.toFixed(2)}) untuk penyelarasan.`
    );
  };

  // Live Firestore Payout Requests (Admin Audit & Treasury)
  const [livePayoutRequests, setLivePayoutRequests] = useState<RiderPayoutRequest[]>([]);

  useEffect(() => {
    const unsub = subscribeToAllPayoutRequests((requests) => {
      setLivePayoutRequests(requests);
    });
    return () => unsub();
  }, []);

  const handleApproveLivePayoutRequest = async (payoutId: string) => {
    try {
      await updatePayoutRequestStatusInFirestore(payoutId, 'Completed');
      showToast(
        language === 'en'
          ? 'Payout request marked as Completed / Disbursed.'
          : 'Permohonan payout ditandakan selesai.'
      );
    } catch (err) {
      console.error(err);
      showToast('Error updating payout status.');
    }
  };

  // Corporate bank editing
  const [editingBank, setEditingBank] = useState<StoreBankInfo>(bankInfo);

  // Modals visibility
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [selectedClosureForZReport, setSelectedClosureForZReport] = useState<DailyClosureRecord | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [selectedEntityForStatement, setSelectedEntityForStatement] = useState<{
    id: string;
    code?: string;
    name: string;
    type: 'store_merchant' | 'supplier' | 'rider';
    balance: number;
    balanceType: 'creditor' | 'debtor';
    bankName?: string;
    accountNumber?: string;
  } | null>(null);

  // Filter states for Creditor/Debtor balances
  const [entityCategoryFilter, setEntityCategoryFilter] = useState<'all' | 'merchants' | 'suppliers' | 'riders'>('all');
  const [balanceDirectionFilter, setBalanceDirectionFilter] = useState<'all' | 'creditors' | 'debtors'>('all');
  const [partnerSearchQuery, setPartnerSearchQuery] = useState('');

  // Daily Closure Form State
  const [closureForm, setClosureForm] = useState({
    registerId: 'POS-01 (Main Supermarket Counter)',
    shift: 'Evening Shift (15:00 - 23:00)',
    cashOpening: 500,
    cashSales: 1640,
    fpxSales: 4720,
    tngSales: 3180,
    cardSales: 1890,
    drawerActualCash: 2140,
    totalDiscounts: 420,
    cogs: 7100,
    deliveryFeesCollected: 450,
    closedBy: 'Razali Osman (Manager)',
    verifiedBy: 'Dato’ Farhan Al-Mehdhar',
    notes: 'Shift terminal batches balanced cleanly. Cash verified and stored in drop safe.',
  });

  // Manual Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    entityType: 'supplier' as 'store_merchant' | 'supplier' | 'rider',
    entityId: partners[0]?.id || '',
    amount: '',
    paymentMethod: 'Maybank2E Corporate GIRO',
    referenceNo: `GIRO-${Date.now().toString().slice(-6)}`,
    notes: 'Scheduled partner trade payout disbursement',
  });

  // Incoming Settlement Form State
  const [settlementForm, setSettlementForm] = useState({
    settlementType: 'rider_cod_handover' as 'rider_cod_handover' | 'merchant_shelf_fee' | 'wholesale_b2b_payment' | 'supplier_rebate',
    entityId: fleetRiders[0]?.id || '',
    amount: '',
    paymentMode: 'Cash at Cashier Desk',
    referenceNo: `SETTLE-${Date.now().toString().slice(-6)}`,
    receivedBy: 'Nurul Huda (Cashier)',
    notes: 'Daily Cash-on-Delivery collection handover at cashier counter',
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('dmart_daily_closures', JSON.stringify(dailyClosures));
  }, [dailyClosures]);

  useEffect(() => {
    localStorage.setItem('dmart_fleet_riders_finance', JSON.stringify(fleetRiders));
  }, [fleetRiders]);

  useEffect(() => {
    localStorage.setItem('dmart_manual_ledger_tx', JSON.stringify(manualTransactions));
  }, [manualTransactions]);

  // Overall Financial Calculations
  const totalGrossSales = orders.reduce((acc, o) => acc + o.total, 0) + 34891.00;
  const totalDisbursedThisWeek = payouts.reduce((acc, p) => acc + p.totalPayout, 0);

  // ==========================================
  // 1. Partner Ledger & Balances Calculations
  // ==========================================
  // Separate partners into Store Merchants vs Suppliers
  const storeMerchants = partners.filter(
    (p) => p.businessType === 'bakery' || p.businessType === 'fmcg_distributor'
  );
  const suppliers = partners.filter(
    (p) => p.businessType === 'farm_supplier' || p.businessType === 'butchery' || p.businessType === 'wholesale_grocer'
  );

  // Creditors (We Owe):
  // 1. Store Merchants settlement due
  const merchantCreditorTotal = storeMerchants.reduce((sum, m) => sum + (m.totalSettlementDue || 0), 0);
  // 2. Direct farm & butchery suppliers settlement due
  const supplierCreditorTotal = suppliers.reduce((sum, s) => sum + (s.totalSettlementDue || 0), 0);
  // 3. Fleet riders wallet balances (earned delivery commissions store owes riders)
  const riderWalletCreditorTotal = fleetRiders.reduce((sum, r) => sum + (r.walletBalance || 0), 0);
  const totalCreditors = merchantCreditorTotal + supplierCreditorTotal + riderWalletCreditorTotal;

  // Debtors (Owed to Store):
  // 1. Fleet riders Cash-on-Delivery collections carried by riders in transit
  const riderCodDebtorTotal = fleetRiders.reduce((sum, r) => sum + (r.codCollected || 0), 0);
  // 2. Corporate B2B wholesale debtors (consignment / cafe credit accounts)
  const corporateB2BDebtorTotal = 1450.00;
  const totalDebtors = riderCodDebtorTotal + corporateB2BDebtorTotal;
  const netPartnerExposure = totalCreditors - totalDebtors;

  // Combined Entity Balance Records for interactive display
  interface EntityBalanceItem {
    id: string;
    name: string;
    code: string;
    category: 'store_merchant' | 'supplier' | 'rider' | 'wholesale_client';
    categoryLabel: string;
    creditorBalance: number; // Store owes them
    debtorBalance: number;   // They owe store
    paymentTerms: string;
    bankName: string;
    accountNumber: string;
    phone: string;
    status: string;
  }

  const combinedEntities: EntityBalanceItem[] = [
    // Store Merchants
    ...storeMerchants.map((m) => ({
      id: m.id,
      name: m.name,
      code: m.code || `MERCH-${m.id.slice(-4)}`,
      category: 'store_merchant' as const,
      categoryLabel: 'Storefront Merchant',
      creditorBalance: m.totalSettlementDue,
      debtorBalance: 0,
      paymentTerms: m.payoutTerms.replace('_', ' ').toUpperCase(),
      bankName: m.bankName,
      accountNumber: m.accountNumber,
      phone: m.phone,
      status: m.status,
    })),
    // Farm & Fresh Suppliers
    ...suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code || `SUPP-${s.id.slice(-4)}`,
      category: 'supplier' as const,
      categoryLabel: s.businessType === 'farm_supplier' ? 'Agro Produce Farm' : s.businessType === 'butchery' ? 'Halal Butchery Supplier' : 'Wholesale Supplier',
      creditorBalance: s.totalSettlementDue,
      debtorBalance: 0,
      paymentTerms: s.payoutTerms.replace('_', ' ').toUpperCase(),
      bankName: s.bankName,
      accountNumber: s.accountNumber,
      phone: s.phone,
      status: s.status,
    })),
    // Fleet Riders
    ...fleetRiders.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.plate,
      category: 'rider' as const,
      categoryLabel: `Fleet Driver (${r.vehicleType})`,
      creditorBalance: r.walletBalance,
      debtorBalance: r.codCollected,
      paymentTerms: 'WEEKLY GIRO',
      bankName: 'Maybank / DuitNow',
      accountNumber: r.phone,
      phone: r.phone,
      status: r.status,
    })),
    // Corporate Wholesale Client (Debtor)
    {
      id: 'deb-b2b-01',
      name: 'Al-Madinah Catering & Event Kitchens',
      code: 'B2B-KL-0442',
      category: 'wholesale_client' as const,
      categoryLabel: 'Wholesale B2B Account',
      creditorBalance: 0,
      debtorBalance: 1450.00,
      paymentTerms: 'NET 15 DAYS',
      bankName: 'CIMB Bank',
      accountNumber: '8009 1142 88',
      phone: '019-3329102',
      status: 'active',
    },
  ];

  // Filtered entities list
  const filteredEntities = combinedEntities.filter((item) => {
    // Category filter
    if (entityCategoryFilter === 'merchants' && item.category !== 'store_merchant') return false;
    if (entityCategoryFilter === 'suppliers' && item.category !== 'supplier') return false;
    if (entityCategoryFilter === 'riders' && item.category !== 'rider') return false;

    // Balance direction filter
    if (balanceDirectionFilter === 'creditors' && item.creditorBalance <= 0) return false;
    if (balanceDirectionFilter === 'debtors' && item.debtorBalance <= 0) return false;

    // Search
    if (partnerSearchQuery.trim()) {
      const q = partnerSearchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.bankName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ==========================================
  // 2. Daily Closures Calculations
  // ==========================================
  // Latest or aggregated summary
  const latestClosure = dailyClosures[0];
  const dailyGrossRevenue = dailyClosures.reduce((sum, c) => sum + c.totalGrossSales, 0) / (dailyClosures.length || 1);
  const dailyNetProfit = dailyClosures.reduce((sum, c) => sum + (c.netProfit || (c.netRevenue * 0.32)), 0) / (dailyClosures.length || 1);
  
  // Pending Discrepancies
  const flaggedClosures = dailyClosures.filter((c) => c.status === 'flagged_variance' || Math.abs(c.variance) > 0.5);
  const totalVarianceDiscrepancy = flaggedClosures.reduce((sum, c) => sum + c.variance, 0);

  // Handle Save Corporate Bank
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBankInfo(editingBank);
    showToast(language === 'en' ? 'Corporate Merchant Bank account configuration saved.' : 'Konfigurasi Akaun Bank Korporat disimpan.');
  };

  // Handle Create Daily Closure
  const handleCreateClosure = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = closureForm.cashOpening + closureForm.cashSales;
    const variance = closureForm.drawerActualCash - expected;
    const totalGross = closureForm.cashSales + closureForm.fpxSales + closureForm.tngSales + closureForm.cardSales;
    const netRev = totalGross - closureForm.totalDiscounts;
    const calculatedProfit = netRev - closureForm.cogs;

    const newRecord: DailyClosureRecord = {
      id: `cls-${Date.now()}`,
      closureDate: new Date().toISOString().split('T')[0],
      registerId: closureForm.registerId,
      shift: closureForm.shift,
      cashOpening: closureForm.cashOpening,
      cashSales: closureForm.cashSales,
      fpxSales: closureForm.fpxSales,
      tngSales: closureForm.tngSales,
      cardSales: closureForm.cardSales,
      totalGrossSales: totalGross,
      totalDiscounts: closureForm.totalDiscounts,
      deliveryFeesCollected: closureForm.deliveryFeesCollected,
      cogs: closureForm.cogs,
      netRevenue: netRev,
      netProfit: calculatedProfit,
      drawerExpectedCash: expected,
      drawerActualCash: closureForm.drawerActualCash,
      variance: variance,
      closedBy: closureForm.closedBy,
      verifiedBy: closureForm.verifiedBy,
      status: Math.abs(variance) < 1 ? 'balanced' : 'flagged_variance',
      notes: closureForm.notes,
    };

    setDailyClosures([newRecord, ...dailyClosures]);
    setIsClosureModalOpen(false);
    showToast(
      language === 'en'
        ? `Daily Store Closure completed successfully (${newRecord.status === 'balanced' ? 'Balanced' : 'Flagged Variance'}).`
        : `Penutupan Harian Kedai berjaya disimpan (${newRecord.status === 'balanced' ? 'Seimbang' : 'Varian Dicatat'}).`
    );
  };

  // Handle Record Manual Payout
  const handleRecordPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmount = parseFloat(payoutForm.amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast('Please enter a valid payout amount.');
      return;
    }

    const targetEntity = combinedEntities.find((e) => e.id === payoutForm.entityId);
    const entityName = targetEntity ? targetEntity.name : 'Partner';
    const entityCode = targetEntity ? targetEntity.code : 'PARTNER';

    // 1. If merchant or supplier, deduct from partners totalSettlementDue
    if (payoutForm.entityType === 'store_merchant' || payoutForm.entityType === 'supplier') {
      const updatedPartners = partners.map((p) => {
        if (p.id === payoutForm.entityId) {
          const newBal = Math.max(0, p.totalSettlementDue - payAmount);
          return { ...p, totalSettlementDue: newBal };
        }
        return p;
      });
      if (onUpdatePartners) {
        onUpdatePartners(updatedPartners);
      }
    }

    // 2. If rider, deduct from fleet rider walletBalance
    if (payoutForm.entityType === 'rider') {
      const updatedRiders = fleetRiders.map((r) => {
        if (r.id === payoutForm.entityId) {
          return { ...r, walletBalance: Math.max(0, r.walletBalance - payAmount) };
        }
        return r;
      });
      setFleetRiders(updatedRiders);
    }

    // 3. Append to manual transactions ledger
    const newTx: ManualLedgerTransaction = {
      id: `tx-payout-${Date.now()}`,
      type: 'manual_payout',
      entityType: payoutForm.entityType,
      entityId: payoutForm.entityId,
      entityName,
      entityCode,
      amount: payAmount,
      paymentMethod: payoutForm.paymentMethod,
      referenceNo: payoutForm.referenceNo,
      notes: payoutForm.notes,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      recordedBy: 'Razali Osman (Manager)',
      status: 'completed',
    };
    setManualTransactions([newTx, ...manualTransactions]);

    // 4. Also append to partnerLedger entries if applicable
    if (onUpdatePartnerLedger && (payoutForm.entityType === 'store_merchant' || payoutForm.entityType === 'supplier')) {
      const newLedgerEntry: PartnerLedgerEntry = {
        id: `led-pay-${Date.now()}`,
        merchantCode: entityCode,
        merchantName: entityName,
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        orderRef: payoutForm.referenceNo,
        description: `Manual Payout Disbursed via ${payoutForm.paymentMethod}`,
        grossAmount: payAmount,
        commissionRate: 0,
        platformFee: 0,
        netPayableToPartner: -payAmount,
        status: 'settled',
        source: 'b2b_wholesale',
      };
      onUpdatePartnerLedger([newLedgerEntry, ...partnerLedger]);
    }

    setIsPayoutModalOpen(false);
    setPayoutForm({
      entityType: 'supplier',
      entityId: partners[0]?.id || '',
      amount: '',
      paymentMethod: 'Maybank2E Corporate GIRO',
      referenceNo: `GIRO-${Date.now().toString().slice(-6)}`,
      notes: 'Scheduled partner trade payout disbursement',
    });
    showToast(`RM ${payAmount.toFixed(2)} payout recorded for ${entityName}.`);
  };

  // Handle Record Incoming Settlement
  const handleRecordSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    const settleAmount = parseFloat(settlementForm.amount);
    if (isNaN(settleAmount) || settleAmount <= 0) {
      showToast('Please enter a valid settlement amount.');
      return;
    }

    const targetEntity = combinedEntities.find((e) => e.id === settlementForm.entityId);
    const entityName = targetEntity ? targetEntity.name : 'Debtor';
    const entityCode = targetEntity ? targetEntity.code : 'DEBTOR';

    // 1. If rider COD collection handover, reduce rider codCollected
    if (settlementForm.settlementType === 'rider_cod_handover') {
      const updatedRiders = fleetRiders.map((r) => {
        if (r.id === settlementForm.entityId) {
          return { ...r, codCollected: Math.max(0, r.codCollected - settleAmount) };
        }
        return r;
      });
      setFleetRiders(updatedRiders);
    }

    // 2. Append to manual transactions ledger
    const newTx: ManualLedgerTransaction = {
      id: `tx-settle-${Date.now()}`,
      type: 'incoming_settlement',
      entityType: settlementForm.settlementType === 'rider_cod_handover' ? 'rider' : 'store_merchant',
      entityId: settlementForm.entityId,
      entityName,
      entityCode,
      amount: settleAmount,
      paymentMethod: settlementForm.paymentMode,
      referenceNo: settlementForm.referenceNo,
      notes: settlementForm.notes,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      recordedBy: settlementForm.receivedBy,
      status: 'completed',
    };
    setManualTransactions([newTx, ...manualTransactions]);

    setIsSettlementModalOpen(false);
    setSettlementForm({
      settlementType: 'rider_cod_handover',
      entityId: fleetRiders[0]?.id || '',
      amount: '',
      paymentMode: 'Cash at Cashier Desk',
      referenceNo: `SETTLE-${Date.now().toString().slice(-6)}`,
      receivedBy: 'Nurul Huda (Cashier)',
      notes: 'Daily Cash-on-Delivery collection handover at cashier counter',
    });
    showToast(`RM ${settleAmount.toFixed(2)} settlement received from ${entityName}.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Primary Financial Sub-Navigation Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200 shadow-xs gap-3">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1.5 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('closures')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'closures'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>{language === 'en' ? 'Daily Cashier & Store Closure' : 'Penutupan Harian & Laporan Z'}</span>
            {flaggedClosures.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${activeSubTab === 'closures' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800'}`}>
                {flaggedClosures.length} Flagged
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('creditors')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'creditors'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>{language === 'en' ? 'Partner Ledger & Balances' : 'Lejar Rakan & Baki'}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${activeSubTab === 'creditors' ? 'bg-emerald-800 text-emerald-100' : 'bg-gray-200 text-gray-700'}`}>
              RM {totalCreditors.toFixed(0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('rider_accounts')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'rider_accounts'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{language === 'en' ? 'Rider Financial Accounts' : 'Lejar Akaun Rider'}</span>
            {livePayoutRequests.some((p) => p.status === 'Pending') && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'rider_accounts' ? 'bg-amber-400 text-amber-950 font-black' : 'bg-amber-100 text-amber-800'
              }`}>
                {livePayoutRequests.filter((p) => p.status === 'Pending').length} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ledger')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'ledger'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{language === 'en' ? 'Sales Journal' : 'Jurnal Jualan'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('banking')}
            className={`px-3.5 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSubTab === 'banking'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>{language === 'en' ? 'Corporate Bank & Rider Payouts' : 'Bank Korporat & Rider Payout'}</span>
          </button>
        </div>

        {/* Global Action Shortcut */}
        <div className="flex items-center gap-2">
          {activeSubTab === 'closures' ? (
            <button
              type="button"
              onClick={() => setIsClosureModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Perform Daily Closure' : 'Laksana Penutupan Harian'}</span>
            </button>
          ) : activeSubTab === 'creditors' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{language === 'en' ? 'Record Payout' : 'Rekod Payout'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(true)}
                className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{language === 'en' ? 'Record Settlement' : 'Rekod Penyata'}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DAILY CASHIER & STORE CLOSURE                                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'closures' && (
        <div className="space-y-6">
          {/* Top Summary Cards: Daily Gross Revenue, Net Profit, Pending Discrepancies */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* KPI 1: Daily Gross Revenue */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {language === 'en' ? 'Daily Gross Revenue' : 'Hasil Kasar Harian'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight font-mono">
                RM {(latestClosure ? latestClosure.totalGrossSales : dailyGrossRevenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-xs text-emerald-700 font-semibold bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span className="truncate">Cash: RM {latestClosure?.cashSales.toFixed(2)} • Digital: RM {((latestClosure?.fpxSales || 0) + (latestClosure?.tngSales || 0) + (latestClosure?.cardSales || 0)).toFixed(2)}</span>
              </div>
            </div>

            {/* KPI 2: Net Profit */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {language === 'en' ? 'Daily Net Profit' : 'Keuntungan Bersih Harian'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight font-mono">
                RM {(latestClosure?.netProfit || dailyNetProfit).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2.5 flex items-center gap-2 text-xs text-blue-700 font-semibold bg-blue-50/70 p-1.5 rounded-lg border border-blue-100">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                <span>
                  {latestClosure?.totalGrossSales
                    ? `${(((latestClosure.netProfit || dailyNetProfit) / latestClosure.totalGrossSales) * 100).toFixed(1)}% net profit margin (after COGS)`
                    : '34.5% net profit margin'}
                </span>
              </div>
            </div>

            {/* KPI 3: Pending Discrepancies */}
            <div className={`bg-white rounded-2xl border p-5 shadow-xs relative overflow-hidden ${
              flaggedClosures.length > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {language === 'en' ? 'Pending Discrepancies' : 'Percanggahan Menunggu Audit'}
                </span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  flaggedClosures.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl sm:text-3xl font-black tracking-tight font-mono text-gray-900">
                  {flaggedClosures.length} {language === 'en' ? 'Shift Discrepancies' : 'Syif Tertangguh'}
                </p>
              </div>
              <div className={`mt-2.5 flex items-center gap-2 text-xs font-semibold p-1.5 rounded-lg border ${
                flaggedClosures.length > 0 ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
              }`}>
                <span className={`w-2 h-2 rounded-full ${flaggedClosures.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'} shrink-0`}></span>
                <span>
                  {flaggedClosures.length > 0
                    ? `Net variance: ${totalVarianceDiscrepancy < 0 ? '-' : '+'}RM ${Math.abs(totalVarianceDiscrepancy).toFixed(2)} requiring cashier review`
                    : '100% Cash drawers & payment terminals reconciled'}
                </span>
              </div>
            </div>
          </div>

          {/* Daily Closures & Z-Reports Register */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">
                    {language === 'en' ? 'Terminal Daily Closures & Z-Reports' : 'Penutupan Harian Terminal & Laporan Z'}
                  </h3>
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold border border-emerald-200">
                    LHDN E-Invoice Audit Compliant
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  End-of-day register reconciliation, cash drawer physical counts, digital gateway summaries, and verified Z-reports.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportDailyClosuresCSV(dailyClosures)}
                  className="px-3 py-1.5 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{language === 'en' ? 'Export CSV' : 'Eksport CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsClosureModalOpen(true)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Perform Daily Closure' : 'Laksana Penutupan'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Date &amp; Shift</th>
                    <th className="p-3.5 font-mono text-right">Gross Revenue</th>
                    <th className="p-3.5 font-mono text-right">Net Profit</th>
                    <th className="p-3.5">Payment Channels</th>
                    <th className="p-3.5 font-mono text-right">Drawer Cash (Exp / Act)</th>
                    <th className="p-3.5 text-center">Variance</th>
                    <th className="p-3.5">Verification</th>
                    <th className="p-3.5 text-right">Z-Report Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {dailyClosures.map((cls) => {
                    const isBalanced = cls.variance === 0 || Math.abs(cls.variance) < 0.01;
                    return (
                      <tr key={cls.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold font-mono text-gray-900 text-xs">{cls.closureDate}</div>
                          <div className="text-[10px] text-gray-500 font-medium">
                            {cls.shift || 'Evening Shift'} • <span className="font-mono text-emerald-800">{cls.registerId || 'POS-01'}</span>
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-bold text-gray-900 font-mono">
                          RM {cls.totalGrossSales.toFixed(2)}
                        </td>

                        <td className="p-3.5 text-right font-bold text-emerald-700 font-mono">
                          RM {(cls.netProfit || (cls.netRevenue * 0.32)).toFixed(2)}
                        </td>

                        <td className="p-3.5 text-[11px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-mono">
                              Cash: RM {cls.cashSales.toFixed(0)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                              FPX: RM {cls.fpxSales.toFixed(0)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono">
                              TNG: RM {cls.tngSales.toFixed(0)}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono">
                              Card: RM {cls.cardSales.toFixed(0)}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-right">
                          <span className="text-gray-500">RM {cls.drawerExpectedCash.toFixed(2)}</span>
                          <span className="text-gray-400 mx-1">/</span>
                          <span className="font-bold text-gray-900">RM {cls.drawerActualCash.toFixed(2)}</span>
                        </td>

                        <td className="p-3.5 text-center">
                          {isBalanced ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" /> Balanced
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {cls.variance < 0 ? '-' : '+'}RM {Math.abs(cls.variance).toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="text-gray-900 font-semibold text-xs">{cls.verifiedBy}</div>
                          <div className="text-[10px] text-gray-400 font-normal">Closed: {cls.closedBy}</div>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedClosureForZReport(cls)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                              title="Preview & Print Official Thermal Z-Report"
                            >
                              <Printer className="w-3 h-3 text-emerald-700" />
                              <span>Z-Report</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => exportDailyClosurePDF(cls)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
                              title="Download PDF Archive"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PARTNER LEDGER & BALANCES (CREDITORS / DEBTORS)                */}
      {/* ========================================================================= */}
      {activeSubTab === 'creditors' && (
        <div className="space-y-6">
          {/* Top Summary Banner: Creditor vs Debtor breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Creditor Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {language === 'en' ? 'Total Creditor Payables (We Owe)' : 'Jumlah Pemiutang (Akaun Kena Bayar)'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-950 font-mono tracking-tight">
                RM {totalCreditors.toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                <div className="flex justify-between">
                  <span>Farm &amp; Fresh Suppliers:</span>
                  <span className="font-bold font-mono">RM {supplierCreditorTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Store Merchants &amp; Bakery:</span>
                  <span className="font-bold font-mono">RM {merchantCreditorTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fleet Riders Commission Wallets:</span>
                  <span className="font-bold font-mono">RM {riderWalletCreditorTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Debtor Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {language === 'en' ? 'Total Debtor Receivables (Owed to Store)' : 'Jumlah Penghutang (Akaun Belum Terima)'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-blue-950 font-mono tracking-tight">
                RM {totalDebtors.toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-gray-600 space-y-0.5">
                <div className="flex justify-between">
                  <span>Rider COD Cash in Hand:</span>
                  <span className="font-bold font-mono text-amber-700">RM {riderCodDebtorTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>B2B Wholesale Invoiced Clients:</span>
                  <span className="font-bold font-mono">RM {corporateB2BDebtorTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Active Collection Tills:</span>
                  <span>4 Riders Active</span>
                </div>
              </div>
            </div>

            {/* Net Financial Position Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {language === 'en' ? 'Net Partner Exposure' : 'Dedahan Bersih Rakan'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-950 font-mono tracking-tight">
                RM {netPartnerExposure.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Net liability after matching incoming COD cash receipts with pending trade remittances.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(true)}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Record Payout
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(true)}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  Record Settlement
                </button>
              </div>
            </div>
          </div>

          {/* Partner Payout Ledger Mock Data Testing & Verification (Firestore: PARTNER_TEST_01 / Almehdhar Trading Co.) */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-emerald-500/30">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-500/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 text-emerald-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      Firestore Payout Ledger Integration
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-200">
                      PARTNER_TEST_01
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-0.5">
                    Almehdhar Trading Co. — Net Payout Ledger Settlement
                  </h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Automated 10% commission deduction on completed sales, excluding pending and cancelled transactions.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  id="seed-payout-ledger-btn"
                  onClick={handleSeedPayoutLedger}
                  disabled={isSeedingPayoutLedger}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSeedingPayoutLedger ? 'Seeding to Firestore...' : 'Seed Payout Ledger Mock Data'}</span>
                </button>

                <button
                  type="button"
                  onClick={refreshPartnerTestData}
                  disabled={isFetchingPartnerData}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/10 transition-all cursor-pointer"
                  title="Refresh from Firestore"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingPartnerData ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Success Notification Alert */}
            {seedSuccessNotice && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{seedSuccessNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSeedSuccessNotice(null)}
                  className="text-emerald-300 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Financial Metrics Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Gross Completed Sales
                </span>
                <p className="text-lg font-black font-mono text-white mt-1">
                  RM {partnerCalculation.grossCompletedSales.toFixed(2)}
                </p>
                <span className="text-[10px] text-gray-400">
                  {partnerCalculation.completedOrderCount} Completed Orders (RM 100 + RM 200)
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  Commission Deducted (10%)
                </span>
                <p className="text-lg font-black font-mono text-rose-400 mt-1">
                  -RM {partnerCalculation.commissionDeducted.toFixed(2)}
                </p>
                <span className="text-[10px] text-rose-300/80">
                  Platform Fee (10% of RM {partnerCalculation.grossCompletedSales.toFixed(2)})
                </span>
              </div>

              <div className="bg-emerald-500/15 rounded-2xl p-3 border border-emerald-400/40 ring-1 ring-emerald-400/30">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Net Payout Payable
                </span>
                <p className="text-xl font-black font-mono text-emerald-300 mt-1">
                  RM {partnerCalculation.netPayoutPayable.toFixed(2)}
                </p>
                <span className="text-[10px] text-emerald-200/90 font-medium">
                  Net Remittance Due to Partner
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Excluded from Payout
                </span>
                <p className="text-lg font-black font-mono text-amber-400 mt-1">
                  RM {(partnerCalculation.pendingAmountExcluded + partnerCalculation.cancelledAmountIgnored).toFixed(2)}
                </p>
                <span className="text-[10px] text-gray-400">
                  Pending: RM {partnerCalculation.pendingAmountExcluded.toFixed(2)} | Cancelled: RM {partnerCalculation.cancelledAmountIgnored.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Firestore Orders Itemized Table & Ledger Metadata */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left 2 Cols: Itemized Orders in Firestore */}
              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Firestore Partner Orders (`orders` collection)
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {partnerTestOrders.length} records found
                  </span>
                </div>

                {partnerTestOrders.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center text-xs text-gray-400">
                    No partner orders found in Firestore. Click &ldquo;Seed Payout Ledger Mock Data&rdquo; above to write the 4 test orders and payout ledger summary.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 text-xs">
                    {partnerTestOrders.map((ord, idx) => (
                      <div
                        key={ord.id || idx}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                              ord.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : ord.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {ord.status}
                          </span>
                          <span className="text-gray-200 font-medium">
                            {Array.isArray(ord.items) ? ord.items.join(', ') : 'Order Items'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <span className="font-mono font-bold text-white">
                            RM {Number(ord.amount).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {ord.status === 'COMPLETED'
                              ? '(Included)'
                              : ord.status === 'PENDING'
                              ? '(Pending Excluded)'
                              : '(Ignored)'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Col: Payout Ledger Summary Record in Firestore */}
              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                  Firestore Ledger Summary (`payout_ledger`)
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-gray-400">Advertiser ID:</span>
                    <span className="font-mono font-bold text-white">
                      {partnerTestLedgers[0]?.advertiserId || 'PARTNER_TEST_01'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-gray-400">Partner Name:</span>
                    <span className="font-bold text-emerald-300">
                      {partnerTestLedgers[0]?.partnerName || 'Almehdhar Trading Co.'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-gray-400">Commission Rate:</span>
                    <span className="font-mono font-bold text-white">
                      {((partnerTestLedgers[0]?.commissionRate ?? 0.1) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-gray-400">Period:</span>
                    <span className="font-mono text-gray-200">
                      {partnerTestLedgers[0]?.periodStart || '2026-10-01'} ~ {partnerTestLedgers[0]?.periodEnd || '2026-10-31'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Settlement Status:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {partnerTestLedgers[0]?.settlementStatus || 'UNSETTLED'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filtering and Search Toolbar */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs font-bold">
                <span className="text-gray-500 mr-1 text-[11px] uppercase">Entity:</span>
                <button
                  type="button"
                  onClick={() => setEntityCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    entityCategoryFilter === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Entities ({combinedEntities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEntityCategoryFilter('merchants')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    entityCategoryFilter === 'merchants'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Store Merchants ({storeMerchants.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEntityCategoryFilter('suppliers')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    entityCategoryFilter === 'suppliers'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Suppliers ({suppliers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEntityCategoryFilter('riders')}
                  className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    entityCategoryFilter === 'riders'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Fleet Riders ({fleetRiders.length})
                </button>
              </div>

              {/* Balance Direction Filter */}
              <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
                <span className="text-gray-500 text-[11px] uppercase">Balance:</span>
                <button
                  type="button"
                  onClick={() => setBalanceDirectionFilter('all')}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer ${
                    balanceDirectionFilter === 'all' ? 'bg-emerald-100 text-emerald-900 font-black' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceDirectionFilter('creditors')}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer ${
                    balanceDirectionFilter === 'creditors' ? 'bg-rose-100 text-rose-900 font-black' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Creditors (We Owe)
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceDirectionFilter('debtors')}
                  className={`px-2.5 py-1.5 rounded-lg cursor-pointer ${
                    balanceDirectionFilter === 'debtors' ? 'bg-blue-100 text-blue-900 font-black' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Debtors (Owed to Store)
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={partnerSearchQuery}
                onChange={(e) => setPartnerSearchQuery(e.target.value)}
                placeholder="Search by partner name, merchant code (MERCH-8821), vehicle plate, or bank account..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              {partnerSearchQuery && (
                <button
                  type="button"
                  onClick={() => setPartnerSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Combined Partner, Supplier & Rider Ledger Cards / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntities.map((item) => {
              const hasCreditor = item.creditorBalance > 0;
              const hasDebtor = item.debtorBalance > 0;

              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-2xl p-4 bg-white shadow-xs space-y-3 hover:border-gray-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                            {item.code}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{item.categoryLabel}</p>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        item.status === 'active' || item.status === 'approved' || item.status === 'delivering'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    {/* Financial Balances Breakdown */}
                    <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-xs space-y-2">
                      {/* Creditor balance (We Owe) */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>Creditor Due (We Owe):</span>
                        </span>
                        <span className={`font-mono font-bold ${hasCreditor ? 'text-rose-700' : 'text-gray-400'}`}>
                          RM {item.creditorBalance.toFixed(2)}
                        </span>
                      </div>

                      {/* Debtor balance (Owed to Us) */}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          <span>Debtor Due (Owed to Store):</span>
                        </span>
                        <span className={`font-mono font-bold ${hasDebtor ? 'text-blue-700' : 'text-gray-400'}`}>
                          RM {item.debtorBalance.toFixed(2)}
                        </span>
                      </div>

                      {/* Bank & Payout info */}
                      <div className="pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[11px] text-gray-500">
                        <span>{item.bankName}</span>
                        <span className="font-mono text-gray-700">{item.accountNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    {hasCreditor && (
                      <button
                        type="button"
                        onClick={() => {
                          setPayoutForm({
                            entityType: item.category === 'rider' ? 'rider' : item.category === 'store_merchant' ? 'store_merchant' : 'supplier',
                            entityId: item.id,
                            amount: item.creditorBalance.toFixed(2),
                            paymentMethod: 'Maybank2E Corporate GIRO',
                            referenceNo: `GIRO-${Date.now().toString().slice(-6)}`,
                            notes: `Trade payout disbursement to ${item.name}`,
                          });
                          setIsPayoutModalOpen(true);
                        }}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        Payout Due
                      </button>
                    )}

                    {hasDebtor && (
                      <button
                        type="button"
                        onClick={() => {
                          setSettlementForm({
                            settlementType: item.category === 'rider' ? 'rider_cod_handover' : 'wholesale_b2b_payment',
                            entityId: item.id,
                            amount: item.debtorBalance.toFixed(2),
                            paymentMode: item.category === 'rider' ? 'Cash at Cashier Desk' : 'Corporate Bank Transfer',
                            referenceNo: `SETTLE-${Date.now().toString().slice(-6)}`,
                            receivedBy: 'Nurul Huda (Cashier)',
                            notes: `Incoming settlement remittance from ${item.name}`,
                          });
                          setIsSettlementModalOpen(true);
                        }}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                      >
                        Collect Settlement
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEntityForStatement({
                          id: item.id,
                          code: item.code,
                          name: item.name,
                          type: item.category === 'rider' ? 'rider' : item.category === 'store_merchant' ? 'store_merchant' : 'supplier',
                          balance: item.creditorBalance > 0 ? item.creditorBalance : item.debtorBalance,
                          balanceType: item.creditorBalance > 0 ? 'creditor' : 'debtor',
                          bankName: item.bankName,
                          accountNumber: item.accountNumber,
                        });
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Statement
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit History of Manual Payouts & Incoming Settlements */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {language === 'en' ? 'Manual Payout & Settlement Audit Journal' : 'Jurnal Audit Pembayaran & Penyata Manual'}
                </h4>
                <p className="text-xs text-gray-500">
                  Real-time record of all verified disbursements, rider COD cash handovers, and B2B receipts.
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400">Total Entries: {manualTransactions.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px]">
                    <th className="p-3">Ref No / Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Entity Name</th>
                    <th className="p-3">Payment Channel</th>
                    <th className="p-3">Remarks / Purpose</th>
                    <th className="p-3 font-mono text-right">Amount</th>
                    <th className="p-3">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {manualTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/70">
                      <td className="p-3">
                        <div className="font-mono font-bold text-gray-900">{tx.referenceNo}</div>
                        <div className="text-[10px] text-gray-400">{tx.timestamp}</div>
                      </td>
                      <td className="p-3">
                        {tx.type === 'manual_payout' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Payout Out
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <ArrowDownLeft className="w-3 h-3" /> Settlement In
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-gray-900">
                        {tx.entityName}
                        {tx.entityCode && <span className="ml-1 text-[10px] font-mono text-gray-500">({tx.entityCode})</span>}
                      </td>
                      <td className="p-3 text-gray-700">{tx.paymentMethod}</td>
                      <td className="p-3 text-gray-600 max-w-xs truncate">{tx.notes}</td>
                      <td className={`p-3 font-mono font-bold text-right ${
                        tx.type === 'manual_payout' ? 'text-rose-700' : 'text-emerald-700'
                      }`}>
                        {tx.type === 'manual_payout' ? '-' : '+'}RM {tx.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-gray-500 text-[11px]">{tx.recordedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2.5: RIDER FINANCIAL ACCOUNTS & CLEARING LEDGERS                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'rider_accounts' && (
        <AdminRiderFinancialAccountsTab
          language={language}
          applications={applications}
          onUpdateApplicationStatus={onUpdateApplicationStatus}
          fleetRiders={fleetRiders}
          livePayoutRequests={livePayoutRequests}
          onUpdatePayoutRequestStatus={handleApproveLivePayoutRequest}
          orders={orders}
          showToast={showToast}
        />
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: SALES JOURNAL (SUB-TAB 2)                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>{language === 'en' ? 'Live Order Sales Journal & Reconciliation' : 'Jurnal Jualan Pesanan & Penyelarasan'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  {filteredJournalOrders.length} {language === 'en' ? 'filtered' : 'ditapis'}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {language === 'en'
                  ? 'Real-time ledger entries credited from supermarket transactions. Export to CSV for audit reconciliation.'
                  : 'Entri lejar masa nyata dikreditkan daripada transaksi pasar raya. Eksport ke CSV untuk audit.'}
              </p>
            </div>
            
            <button
              type="button"
              id="export-journal-orders-csv-btn"
              data-testid="export-journal-orders-csv-btn"
              onClick={handleExportJournalCSV}
              disabled={filteredJournalOrders.length === 0}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
              title="Export currently filtered journal orders to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'en' ? `Export Reconciliation CSV (${filteredJournalOrders.length})` : `Eksport CSV Penyelarasan (${filteredJournalOrders.length})`}</span>
            </button>
          </div>

          {/* Filter Bar for Sales Journal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                placeholder={language === 'en' ? 'Search order ref, customer...' : 'Cari rujukan pesanan, pelanggan...'}
                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div>
              <select
                value={journalStatusFilter}
                onChange={(e) => setJournalStatusFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">{language === 'en' ? 'All Order Statuses' : 'Semua Status'}</option>
                <option value="delivered">{language === 'en' ? 'Delivered / Settled' : 'Dihantar'}</option>
                <option value="out_for_delivery">{language === 'en' ? 'Out for Delivery' : 'Dalam Penghantaran'}</option>
                <option value="packing">{language === 'en' ? 'Packing' : 'Dibungkus'}</option>
                <option value="submitted">{language === 'en' ? 'Submitted' : 'Dihantar Pelanggan'}</option>
              </select>
            </div>
            <div>
              <select
                value={journalPaymentFilter}
                onChange={(e) => setJournalPaymentFilter(e.target.value)}
                className="w-full py-1.5 px-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">{language === 'en' ? 'All Payment Methods' : 'Semua Kaedah Bayaran'}</option>
                <option value="FPX">DuitNow / FPX</option>
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="TNG">Touch &apos;n Go eWallet</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              {language === 'en' ? 'Showing' : 'Menunjukkan'} <strong className="text-gray-800">{filteredJournalOrders.length}</strong> {language === 'en' ? 'orders' : 'pesanan'}
            </span>
            <span>
              {language === 'en' ? 'Total Credited Volume:' : 'Jumlah Jumlah Dikreditkan:'}{' '}
              <strong className="text-emerald-700 font-mono">RM {journalTotalCredited.toFixed(2)}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px]">
                  <th className="p-3">Order Ref</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">Delivery Fee</th>
                  <th className="p-3">Total Credited</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJournalOrders.slice(0, 50).map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/70">
                    <td className="p-3 font-mono font-bold text-gray-900">{ord.orderNumber}</td>
                    <td className="p-3 text-gray-800">{ord.deliveryAddress.recipientName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800">
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 font-mono">RM {ord.subtotal.toFixed(2)}</td>
                    <td className="p-3 font-mono text-gray-500">RM {ord.deliveryFee.toFixed(2)}</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">RM {ord.total.toFixed(2)}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {ord.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: CORPORATE BANK & PAYOUTS (SUB-TAB 4)                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'banking' && (
        <div className="space-y-6">
          {/* Store Bank Account Configuration */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-gray-900 text-sm">
                  {language === 'en' ? 'Official Corporate Merchant Bank Account' : 'Akaun Bank Pedagang Korporat Rasmi'}
                </h4>
              </div>
              <span className="text-xs text-gray-400 font-medium">Maybank Corporate GIRO</span>
            </div>

            <form onSubmit={handleSaveBank} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={editingBank.bankName}
                  onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Corporate Account Holder</label>
                <input
                  type="text"
                  value={editingBank.accountHolder}
                  onChange={(e) => setEditingBank({ ...editingBank, accountHolder: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={editingBank.accountNumber}
                  onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Branch / Location</label>
                <input
                  type="text"
                  value={editingBank.branch}
                  onChange={(e) => setEditingBank({ ...editingBank, branch: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">SWIFT / BIC Code</label>
                <input
                  type="text"
                  value={editingBank.swiftBic}
                  onChange={(e) => setEditingBank({ ...editingBank, swiftBic: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Save Bank Account Info
                </button>
              </div>
            </form>
          </div>

          {/* Rider Payouts Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  {language === 'en' ? 'Rider Weekly Commission Payouts' : 'Pembayaran Komisen Mingguan Rider'}
                </h4>
                <p className="text-xs text-gray-500">Direct GIRO disbursements for completed deliveries.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportRiderPayoutsCSV(payouts)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (payouts.length > 0) {
                      exportRiderPayoutSummaryPDF(payouts[0]);
                    }
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF Summary</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px]">
                    <th className="p-3">Rider Name</th>
                    <th className="p-3">Bank Details</th>
                    <th className="p-3">Deliveries</th>
                    <th className="p-3">Base Pay</th>
                    <th className="p-3">Tips</th>
                    <th className="p-3">Bonus</th>
                    <th className="p-3">Total Payout</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.map((p) => {
                    const isReady = p.status === 'ready_for_payout';
                    const isPaid = p.status === 'paid';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/70">
                        <td className="p-3 font-semibold text-gray-900">{p.riderName}</td>
                        <td className="p-3 font-mono text-gray-600">
                          {p.bankName} - {p.accountNumber}
                        </td>
                        <td className="p-3 font-mono">{p.totalDeliveries} drops</td>
                        <td className="p-3 font-mono">RM {p.basePay.toFixed(2)}</td>
                        <td className="p-3 font-mono">RM {p.tipsCollected.toFixed(2)}</td>
                        <td className="p-3 font-mono text-emerald-700">+RM {p.performanceBonus.toFixed(2)}</td>
                        <td className="p-3 font-mono font-bold text-gray-900">RM {p.totalPayout.toFixed(2)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : isReady
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {p.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {isReady && (
                            <button
                              type="button"
                              onClick={() => onUpdatePayoutStatus(p.id, 'paid')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            >
                              Disburse GIRO
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rider Instant Daily Payout Requests (Live Firestore Audit Trail) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden mt-6">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50 via-emerald-50/30 to-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm">
                      {language === 'en'
                        ? 'Rider Daily Instant Payout Requests'
                        : 'Permohonan Pengeluaran Gaji Harian Rider'}
                    </h4>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      Firestore: payout_requests
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {language === 'en'
                      ? 'Live real-time audit ledger of delivery rider daily withdrawals & bank disbursements.'
                      : 'Audit langsung permohonan pengeluaran gaji harian penghantar.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 bg-white px-2.5 py-1 rounded-xl border border-gray-200">
                  {livePayoutRequests.length} {language === 'en' ? 'Total Requests' : 'Jumlah Permohonan'}
                </span>
                {livePayoutRequests.some((p) => p.status === 'Pending') && (
                  <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl border border-amber-200 animate-pulse">
                    {livePayoutRequests.filter((p) => p.status === 'Pending').length} Pending
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold uppercase text-[11px]">
                    <th className="p-3">Reference / Date</th>
                    <th className="p-3">Rider Name</th>
                    <th className="p-3">Transfer Bank Details</th>
                    <th className="p-3">IBAN / Swift</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {livePayoutRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        <Wallet className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                        <p className="font-semibold text-xs">
                          {language === 'en'
                            ? 'No instant daily payout requests recorded in Firestore yet'
                            : 'Tiada permohonan pengeluaran harian direkodkan'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    livePayoutRequests.map((req) => {
                      const isPending = req.status === 'Pending';
                      return (
                        <tr key={req.id} className="hover:bg-gray-50/70">
                          <td className="p-3">
                            <span className="font-mono font-bold text-gray-900 block">{req.id}</span>
                            <span className="text-[10px] text-gray-500 block">
                              {new Date(req.requestedAt).toLocaleString(language === 'en' ? 'en-MY' : 'ms-MY')}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-gray-900 block">{req.riderName}</span>
                            <span className="text-[10px] text-emerald-700 font-mono block">{req.riderPhone}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-gray-800 block">{req.bankDetails?.bankName}</span>
                            <span className="font-mono text-gray-600 text-[11px] block">
                              Acc: {req.bankDetails?.accountNumber} ({req.bankDetails?.accountHolder})
                            </span>
                          </td>
                          <td className="p-3 font-mono text-gray-700">
                            {req.bankDetails?.iban || '-'}
                          </td>
                          <td className="p-3 font-mono font-black text-sm text-emerald-700">
                            RM {req.amount.toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                req.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {isPending ? (
                              <button
                                type="button"
                                onClick={() => handleApproveLivePayoutRequest(req.id)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>{language === 'en' ? 'Mark Completed' : 'Sahkan Selesai'}</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-medium">Disbursed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: PERFORM DAILY CLOSURE                                            */}
      {/* ========================================================================= */}
      {isClosureModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">Perform Daily Cashier &amp; Store Closure</h3>
                  <p className="text-xs text-gray-500">Official POS Register Reconciliation &amp; Audit Z-Report</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClosureModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClosure} className="space-y-4 text-xs">
              {/* Register & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">POS Checkout Register</label>
                  <select
                    value={closureForm.registerId}
                    onChange={(e) => setClosureForm({ ...closureForm, registerId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                  >
                    <option value="POS-01 (Main Supermarket Counter)">POS-01 (Main Supermarket Counter)</option>
                    <option value="POS-02 (Fresh Produce & Butchery)">POS-02 (Fresh Produce & Butchery)</option>
                    <option value="POS-03 (Express Checkout Mart)">POS-03 (Express Checkout Mart)</option>
                    <option value="POS-04 (Online Dispatch Fulfillment)">POS-04 (Online Dispatch Fulfillment)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Operating Shift</label>
                  <select
                    value={closureForm.shift}
                    onChange={(e) => setClosureForm({ ...closureForm, shift: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                  >
                    <option value="Morning Shift (07:00 - 15:00)">Morning Shift (07:00 - 15:00)</option>
                    <option value="Evening Shift (15:00 - 23:00)">Evening Shift (15:00 - 23:00)</option>
                    <option value="Full Day Store Close">Full Day Store Close (Full Audit)</option>
                  </select>
                </div>
              </div>

              {/* Physical Cash Drawer Section */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                <span className="font-black text-emerald-950 block text-xs">1. Physical Cash Drawer Reconciliation</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Opening Cash Float (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={closureForm.cashOpening}
                      onChange={(e) => setClosureForm({ ...closureForm, cashOpening: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">POS Cash Sales (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={closureForm.cashSales}
                      onChange={(e) => setClosureForm({ ...closureForm, cashSales: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Actual Cash in Till (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={closureForm.drawerActualCash}
                      onChange={(e) => setClosureForm({ ...closureForm, drawerActualCash: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border-2 border-emerald-600 rounded-xl font-mono font-bold bg-white text-emerald-900"
                    />
                  </div>
                </div>

                {/* Live Drawer Variance Preview */}
                {(() => {
                  const expected = closureForm.cashOpening + closureForm.cashSales;
                  const variance = closureForm.drawerActualCash - expected;
                  const isZero = Math.abs(variance) < 0.01;
                  return (
                    <div className={`p-2.5 rounded-lg flex items-center justify-between text-xs font-bold ${
                      isZero ? 'bg-emerald-100/70 text-emerald-900' : 'bg-rose-100 text-rose-900'
                    }`}>
                      <span>Expected in Drawer: <span className="font-mono">RM {expected.toFixed(2)}</span></span>
                      <span>
                        Drawer Variance: <span className="font-mono">{variance >= 0 ? '+' : ''}RM {variance.toFixed(2)}</span> {isZero ? '(Balanced)' : '(Discrepancy)'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Digital Sales Channels */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                <span className="font-black text-gray-900 block text-xs">2. Digital Payment Gateways Reconciliation</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">FPX Online Gateway (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={closureForm.fpxSales}
                      onChange={(e) => setClosureForm({ ...closureForm, fpxSales: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Touch 'n Go &amp; DuitNow (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={closureForm.tngSales}
                      onChange={(e) => setClosureForm({ ...closureForm, tngSales: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Card Terminals (Visa/MC) (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={closureForm.cardSales}
                      onChange={(e) => setClosureForm({ ...closureForm, cardSales: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-xl font-mono font-bold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* COGS & Discounts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Cost of Goods Sold (Supplier COGS) (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={closureForm.cogs}
                    onChange={(e) => setClosureForm({ ...closureForm, cogs: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Vouchers &amp; Member Discounts (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={closureForm.totalDiscounts}
                    onChange={(e) => setClosureForm({ ...closureForm, totalDiscounts: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl font-mono bg-white"
                  />
                </div>
              </div>

              {/* Sign-Off & Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Closed By (Cashier)</label>
                  <input
                    type="text"
                    value={closureForm.closedBy}
                    onChange={(e) => setClosureForm({ ...closureForm, closedBy: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Verified By (Duty Manager)</label>
                  <input
                    type="text"
                    value={closureForm.verifiedBy}
                    onChange={(e) => setClosureForm({ ...closureForm, verifiedBy: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Audit Reconciliation Notes</label>
                <textarea
                  rows={2}
                  value={closureForm.notes}
                  onChange={(e) => setClosureForm({ ...closureForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              {/* Live Gross & Net Profit Preview Banner */}
              {(() => {
                const totalGross = closureForm.cashSales + closureForm.fpxSales + closureForm.tngSales + closureForm.cardSales;
                const netRev = totalGross - closureForm.totalDiscounts;
                const profit = netRev - closureForm.cogs;
                return (
                  <div className="p-3 bg-gray-900 text-white rounded-xl flex items-center justify-between font-mono text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px]">TOTAL GROSS REVENUE</span>
                      <span className="text-emerald-400 font-black text-sm">RM {totalGross.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">ESTIMATED NET PROFIT</span>
                      <span className="text-blue-400 font-black text-sm">RM {profit.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClosureModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Lock &amp; Confirm Daily Closure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD MANUAL PAYOUT                                             */}
      {/* ========================================================================= */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">Record Manual Payout (Disbursement)</h3>
                  <p className="text-xs text-gray-500">Pay out creditor balances to merchants, suppliers, or riders</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="space-y-3.5">
              {/* Entity Type */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Entity Category</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutForm({ ...payoutForm, entityType: 'supplier', entityId: suppliers[0]?.id || '' });
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold cursor-pointer ${
                      payoutForm.entityType === 'supplier'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Supplier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutForm({ ...payoutForm, entityType: 'store_merchant', entityId: storeMerchants[0]?.id || '' });
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold cursor-pointer ${
                      payoutForm.entityType === 'store_merchant'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Merchant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayoutForm({ ...payoutForm, entityType: 'rider', entityId: fleetRiders[0]?.id || '' });
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-center font-bold cursor-pointer ${
                      payoutForm.entityType === 'rider'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Fleet Rider
                  </button>
                </div>
              </div>

              {/* Target Entity Dropdown */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Select Beneficiary</label>
                <select
                  value={payoutForm.entityId}
                  onChange={(e) => {
                    const selected = combinedEntities.find((c) => c.id === e.target.value);
                    setPayoutForm({
                      ...payoutForm,
                      entityId: e.target.value,
                      amount: selected ? selected.creditorBalance.toFixed(2) : payoutForm.amount,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                >
                  {combinedEntities
                    .filter((e) => {
                      if (payoutForm.entityType === 'supplier') return e.category === 'supplier';
                      if (payoutForm.entityType === 'store_merchant') return e.category === 'store_merchant';
                      if (payoutForm.entityType === 'rider') return e.category === 'rider';
                      return true;
                    })
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.code}) — Due: RM {item.creditorBalance.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Payout Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700">Disbursement Amount (RM)</label>
                  {(() => {
                    const cur = combinedEntities.find((c) => c.id === payoutForm.entityId);
                    return cur ? (
                      <button
                        type="button"
                        onClick={() => setPayoutForm({ ...payoutForm, amount: cur.creditorBalance.toFixed(2) })}
                        className="text-emerald-700 font-bold text-[11px] hover:underline cursor-pointer"
                      >
                        Pay Full Due (RM {cur.creditorBalance.toFixed(2)})
                      </button>
                    ) : null;
                  })()}
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl font-mono text-sm font-bold focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Disbursement Channel</label>
                <select
                  value={payoutForm.paymentMethod}
                  onChange={(e) => setPayoutForm({ ...payoutForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                >
                  <option value="Maybank2E Corporate GIRO">Maybank2E Corporate GIRO</option>
                  <option value="CIMB BizChannel Direct">CIMB BizChannel Direct</option>
                  <option value="Instant DuitNow Transfer">Instant DuitNow Transfer</option>
                  <option value="Physical Cash from Till">Physical Cash from Till</option>
                  <option value="Corporate Cheque">Corporate Cheque</option>
                </select>
              </div>

              {/* Ref No */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment Reference No</label>
                <input
                  type="text"
                  required
                  value={payoutForm.referenceNo}
                  onChange={(e) => setPayoutForm({ ...payoutForm, referenceNo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  value={payoutForm.notes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Confirm &amp; Disburse Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD INCOMING SETTLEMENT                                       */}
      {/* ========================================================================= */}
      {isSettlementModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-gray-900">Record Incoming Settlement (Receivable)</h3>
                  <p className="text-xs text-gray-500">Collect Rider COD cash handover, merchant fees, or B2B receivables</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettlementModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="space-y-3.5">
              {/* Settlement Type */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Settlement Category</label>
                <select
                  value={settlementForm.settlementType}
                  onChange={(e) => setSettlementForm({ ...settlementForm, settlementType: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                >
                  <option value="rider_cod_handover">Rider Cash-on-Delivery (COD) Handover</option>
                  <option value="wholesale_b2b_payment">Wholesale B2B Account Payment</option>
                  <option value="merchant_shelf_fee">Merchant Listing / Shelf Rental Fee</option>
                  <option value="supplier_rebate">Supplier Trade Volume Rebate</option>
                </select>
              </div>

              {/* Target Entity */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  {settlementForm.settlementType === 'rider_cod_handover' ? 'Select Fleet Rider' : 'Select Account / Debtor'}
                </label>
                <select
                  value={settlementForm.entityId}
                  onChange={(e) => {
                    const sel = combinedEntities.find((c) => c.id === e.target.value);
                    setSettlementForm({
                      ...settlementForm,
                      entityId: e.target.value,
                      amount: sel && sel.debtorBalance > 0 ? sel.debtorBalance.toFixed(2) : settlementForm.amount,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                >
                  {settlementForm.settlementType === 'rider_cod_handover'
                    ? fleetRiders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.plate}) — COD in Hand: RM {r.codCollected.toFixed(2)}
                        </option>
                      ))
                    : combinedEntities.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.code})
                        </option>
                      ))}
                </select>
              </div>

              {/* Settlement Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-gray-700">Remitted Amount (RM)</label>
                  {settlementForm.settlementType === 'rider_cod_handover' && (() => {
                    const curRider = fleetRiders.find((r) => r.id === settlementForm.entityId);
                    return curRider && curRider.codCollected > 0 ? (
                      <button
                        type="button"
                        onClick={() => setSettlementForm({ ...settlementForm, amount: curRider.codCollected.toFixed(2) })}
                        className="text-blue-700 font-bold text-[11px] hover:underline cursor-pointer"
                      >
                        Full Handover (RM {curRider.codCollected.toFixed(2)})
                      </button>
                    ) : null;
                  })()}
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settlementForm.amount}
                  onChange={(e) => setSettlementForm({ ...settlementForm, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl font-mono text-sm font-bold focus:border-blue-600 focus:outline-none"
                />
              </div>

              {/* Remittance Mode */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Payment / Receipt Mode</label>
                <select
                  value={settlementForm.paymentMode}
                  onChange={(e) => setSettlementForm({ ...settlementForm, paymentMode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                >
                  <option value="Cash at Cashier Desk">Physical Cash at Cashier Desk (Drawer Cash-In)</option>
                  <option value="DuitNow QR Instant">DuitNow QR Instant Remittance</option>
                  <option value="Corporate Bank Transfer">Direct Bank Transfer to Maybank Corporate</option>
                  <option value="Bank Cheque">Bank Cheque</option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Remittance Reference No</label>
                <input
                  type="text"
                  required
                  value={settlementForm.referenceNo}
                  onChange={(e) => setSettlementForm({ ...settlementForm, referenceNo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>

              {/* Received by */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">Received &amp; Verified By (Cashier)</label>
                <input
                  type="text"
                  value={settlementForm.receivedBy}
                  onChange={(e) => setSettlementForm({ ...settlementForm, receivedBy: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Confirm &amp; Deposit Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: AUTHENTIC PRINTABLE Z-REPORT SLIP PREVIEW & PRINT                */}
      {/* ========================================================================= */}
      {selectedClosureForZReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-gray-900">Official Daily Store Closure Z-Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClosureForZReport(null)}
                className="text-gray-400 hover:text-gray-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Thermal Slip Simulation */}
            <div
              id="printable-z-report-slip"
              className="border border-gray-300 rounded-xl p-5 bg-stone-50 font-mono text-xs space-y-3 shadow-inner"
            >
              <div className="text-center border-b border-dashed border-gray-400 pb-3 space-y-0.5">
                <h4 className="font-black text-sm tracking-wider uppercase text-gray-900">D-MART HALAL SUPERMARKET</h4>
                <p className="text-[11px] text-gray-600">KL SOUTH CENTRAL RETAIL HUB</p>
                <p className="text-[10px] text-gray-500">SSM: 202301048821 (1542109-M) • JAKIM HALAL</p>
                <p className="font-bold text-[11px] text-emerald-900 mt-1">*** DAILY REGISTER Z-REPORT ***</p>
              </div>

              <div className="text-[11px] space-y-0.5 border-b border-dashed border-gray-300 pb-2">
                <div className="flex justify-between">
                  <span>Report ID:</span>
                  <span className="font-bold">{selectedClosureForZReport.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date / Time:</span>
                  <span>{selectedClosureForZReport.closureDate} 23:00</span>
                </div>
                <div className="flex justify-between">
                  <span>Register ID:</span>
                  <span>{selectedClosureForZReport.registerId || 'POS-01 (Main Counter)'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operating Shift:</span>
                  <span>{selectedClosureForZReport.shift || 'Full Day'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier / Verifier:</span>
                  <span>{selectedClosureForZReport.closedBy}</span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
                <div className="font-bold text-gray-800 uppercase mb-1">--- PAYMENT TENDERS ---</div>
                <div className="flex justify-between">
                  <span>Cash Register Sales:</span>
                  <span className="font-bold">RM {selectedClosureForZReport.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>FPX Online Transfers:</span>
                  <span>RM {selectedClosureForZReport.fpxSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Touch 'n Go eWallet:</span>
                  <span>RM {selectedClosureForZReport.tngSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit/Debit Cards:</span>
                  <span>RM {selectedClosureForZReport.cardSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-gray-900">
                  <span>TOTAL GROSS SALES:</span>
                  <span className="text-emerald-800">RM {selectedClosureForZReport.totalGrossSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Member Discounts:</span>
                  <span>-RM {selectedClosureForZReport.totalDiscounts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Cost of Goods (COGS):</span>
                  <span>-RM {(selectedClosureForZReport.cogs || (selectedClosureForZReport.totalGrossSales * 0.65)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-900 border-t border-gray-300 pt-1">
                  <span>NET PROFIT:</span>
                  <span>RM {(selectedClosureForZReport.netProfit || (selectedClosureForZReport.netRevenue * 0.32)).toFixed(2)}</span>
                </div>
              </div>

              {/* Cash Drawer Audit */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-gray-300 pb-2">
                <div className="font-bold text-gray-800 uppercase mb-1">--- CASH DRAWER AUDIT ---</div>
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span>RM {selectedClosureForZReport.cashOpening.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales Received:</span>
                  <span>RM {selectedClosureForZReport.cashSales.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Expected in Drawer:</span>
                  <span>RM {selectedClosureForZReport.drawerExpectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Actual Counted:</span>
                  <span>RM {selectedClosureForZReport.drawerActualCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black pt-1 border-t border-gray-300">
                  <span>NET VARIANCE:</span>
                  <span className={selectedClosureForZReport.variance === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                    {selectedClosureForZReport.variance >= 0 ? '+' : ''}RM {selectedClosureForZReport.variance.toFixed(2)} ({selectedClosureForZReport.variance === 0 ? 'BALANCED' : 'VARIANCE'})
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-2 text-[10px] space-y-4">
                <div>
                  <p className="font-bold">Manager Notes:</p>
                  <p className="text-gray-600">{selectedClosureForZReport.notes}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-300">
                  <div>
                    <div className="border-b border-gray-400 pb-6"></div>
                    <p className="text-center font-bold mt-1">Cashier Signature</p>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 pb-6"></div>
                    <p className="text-center font-bold mt-1">Manager Signature</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => exportDailyClosurePDF(selectedClosureForZReport)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Save Official PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Z-Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: PARTNER / RIDER ITEMISED STATEMENT DETAILS                       */}
      {/* ========================================================================= */}
      {selectedEntityForStatement && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900">Partner Financial Statement</h3>
                  <p className="text-xs text-gray-500">
                    {selectedEntityForStatement.name} ({selectedEntityForStatement.code})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntityForStatement(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Balances Banner */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[11px] text-gray-600 font-semibold block">Account Classification</span>
                <span className="text-base font-black text-gray-900 uppercase">
                  {selectedEntityForStatement.balanceType === 'creditor' ? 'Creditor (Payable)' : 'Debtor (Receivable)'}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Bank: {selectedEntityForStatement.bankName} - {selectedEntityForStatement.accountNumber}
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${
                selectedEntityForStatement.balanceType === 'creditor'
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <span className="text-[11px] font-semibold block text-gray-700">Current Outstanding Balance</span>
                <span className={`text-base font-black font-mono ${
                  selectedEntityForStatement.balanceType === 'creditor' ? 'text-rose-900' : 'text-blue-900'
                }`}>
                  RM {selectedEntityForStatement.balance.toFixed(2)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  Ready for reconciliation
                </span>
              </div>
            </div>

            {/* Itemized Transactions */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-gray-700">Itemized Financial Ledger &amp; Banner Transactions:</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Date / Ref</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 font-mono text-right">Amount (RM)</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {/* Filter manual transactions and partner ledger entries for this entity */}
                    {manualTransactions
                      .filter((tx) => tx.entityId === selectedEntityForStatement.id || tx.entityCode === selectedEntityForStatement.code)
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50/70">
                          <td className="p-2.5 font-mono font-bold text-gray-900">
                            <div>{entry.referenceNo}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{entry.timestamp}</div>
                          </td>
                          <td className="p-2.5 text-gray-700 max-w-xs truncate">{entry.notes}</td>
                          <td className={`p-2.5 font-mono text-right font-bold ${
                            entry.type === 'manual_payout' ? 'text-rose-700' : 'text-emerald-700'
                          }`}>
                            {entry.type === 'manual_payout' ? '-' : '+'}RM {entry.amount.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                    {partnerLedger
                      .filter((l) => l.merchantCode === selectedEntityForStatement.code || l.merchantCode === selectedEntityForStatement.id)
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50/70">
                          <td className="p-2.5 font-mono font-bold text-gray-900">
                            <div>{entry.orderRef}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{entry.timestamp}</div>
                          </td>
                          <td className="p-2.5 text-gray-700 max-w-xs truncate">{entry.description}</td>
                          <td className="p-2.5 font-mono text-right font-bold text-emerald-700">
                            +RM {entry.netPayableToPartner.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedEntityForStatement(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
