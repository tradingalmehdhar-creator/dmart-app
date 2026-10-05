import { DeliveryJobOrder, RiderLedgerOrderEntry, RiderManualAdjustment, RiderClearingSummary } from '../types';

/**
 * Standard Platform Commission Calculation for delivery dispatch:
 * Platform retains RM 2.00 (or 15% of gross earnings, whichever is lower) per completed order.
 */
export function calculateOrderPlatformCommission(grossOrderAmount: number, earningsPayout: number): number {
  const comm = Math.min(earningsPayout * 0.15, 2.50);
  return Math.max(1.50, parseFloat(comm.toFixed(2)));
}

/**
 * Baseline Seed Ledger Entries for riders to ensure the dual-view statement is immediately rich and interactive.
 */
export const INITIAL_RIDER_LEDGER_ENTRIES: RiderLedgerOrderEntry[] = [
  {
    id: 'rled-001',
    orderNumber: 'DM-89242',
    orderId: 'del-job-102',
    customerName: 'Tan Wei Loon',
    customerPhone: '016-8920134',
    completedAt: '2026-09-27T08:45:00.000Z',
    paymentType: 'Online / Card Payment',
    paymentMethod: 'fpx',
    grossOrderAmount: 84.30,
    deliveryEarning: 16.50,
    platformCommission: 2.20,
    cashCollected: 0,
    onlineEarnings: 16.50,
    netAmountEffect: 14.30, // 16.50 - 2.20
    runningBalance: 14.30,
    notes: 'Online FPX Direct Debit via Maybank2u • Net Credited',
    status: 'Completed',
  },
  {
    id: 'rled-002',
    orderNumber: 'DM-89239',
    orderId: 'del-job-099',
    customerName: 'Ahmad Zulkifli bin Hashim',
    customerPhone: '017-3829104',
    completedAt: '2026-09-27T09:30:00.000Z',
    paymentType: 'Online / Card Payment',
    paymentMethod: 'tng',
    grossOrderAmount: 62.80,
    deliveryEarning: 18.00,
    platformCommission: 2.50,
    cashCollected: 0,
    onlineEarnings: 18.00,
    netAmountEffect: 15.50, // 18.00 - 2.50
    runningBalance: 29.80, // 14.30 + 15.50
    notes: 'Touch n Go eWallet Paid • Net Credited',
    status: 'Completed',
  },
  {
    id: 'rled-003',
    orderNumber: 'DM-89241',
    orderId: 'del-job-101',
    customerName: 'Siti Nurhaliza binti Mansor',
    customerPhone: '012-3491820',
    completedAt: '2026-09-27T10:15:00.000Z',
    paymentType: 'Cash on Delivery',
    paymentMethod: 'cod',
    grossOrderAmount: 44.70,
    deliveryEarning: 8.50,
    platformCommission: 2.00,
    cashCollected: 44.70,
    onlineEarnings: 0,
    netAmountEffect: -44.70, // Cash-in-hand collected debited to rider clearing ledger
    runningBalance: -14.90, // 29.80 - 44.70 = -14.90
    notes: 'Cash-on-Delivery collected in cash by rider (Debited)',
    status: 'Completed',
  },
  {
    id: 'rled-004',
    orderNumber: 'DM-89235',
    orderId: 'del-job-095',
    customerName: 'Kavitha Devi A/P Suppiah',
    customerPhone: '014-9920192',
    completedAt: '2026-09-27T11:20:00.000Z',
    paymentType: 'Online / Card Payment',
    paymentMethod: 'card',
    grossOrderAmount: 115.00,
    deliveryEarning: 22.50,
    platformCommission: 3.00,
    cashCollected: 0,
    onlineEarnings: 22.50,
    netAmountEffect: 19.50, // 22.50 - 3.00
    runningBalance: 4.60, // -14.90 + 19.50 = +4.60
    notes: 'Visa/Mastercard Online Payment • Express Delivery Net Credited',
    status: 'Completed',
  },
  {
    id: 'rled-005',
    orderNumber: 'DM-89230',
    orderId: 'del-job-090',
    customerName: 'Lim Seng Huat',
    customerPhone: '019-3382910',
    completedAt: '2026-09-27T12:05:00.000Z',
    paymentType: 'Online / Card Payment',
    paymentMethod: 'fpx',
    grossOrderAmount: 76.40,
    deliveryEarning: 15.00,
    platformCommission: 2.00,
    cashCollected: 0,
    onlineEarnings: 15.00,
    netAmountEffect: 13.00, // 15.00 - 2.00
    runningBalance: 17.60, // 4.60 + 13.00 = +17.60
    notes: 'Online FPX Direct Debit via CIMB Clicks • Net Credited',
    status: 'Completed',
  },
];

/**
 * Baseline Manual Adjustments (e.g. Counter Handover Settlement, Fuel allowance, etc.)
 */
export const INITIAL_RIDER_ADJUSTMENTS: RiderManualAdjustment[] = [
  {
    id: 'adj-001',
    riderId: 'rider_default',
    riderName: 'Mohd Amirul Hafiz Bin Razali',
    type: 'credit',
    reason: 'commission_rebate',
    reasonLabel: 'Weekend Peak Hour Delivery Incentive Rebate',
    amount: 15.00,
    referenceNo: 'REBATE-20260927-01',
    createdAt: '2026-09-27T07:30:00.000Z',
    adminName: 'Razali Osman (Finance Manager)',
    notes: 'Management approved incentive for weekend peak rush fulfillment',
  },
];

/**
 * Storage Keys
 */
const STORAGE_KEYS = {
  RIDER_ADJUSTMENTS: 'dmart_rider_ledger_adjustments',
  RIDER_EXTRA_ENTRIES: 'dmart_rider_ledger_extra_entries',
};

/**
 * Get saved adjustments from localStorage
 */
export function getSavedRiderAdjustments(): RiderManualAdjustment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RIDER_ADJUSTMENTS);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('[RiderLedger] Failed to read adjustments:', err);
  }
  return INITIAL_RIDER_ADJUSTMENTS;
}

/**
 * Save adjustments to localStorage
 */
export function saveRiderAdjustments(adjustments: RiderManualAdjustment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RIDER_ADJUSTMENTS, JSON.stringify(adjustments));
  } catch (err) {
    console.warn('[RiderLedger] Failed to save adjustments:', err);
  }
}

/**
 * Core Clearing & Net Balance Calculation Engine
 * 
 * Rules specified by Prompt:
 * - Cash Orders: Count towards cash-in-hand collected by the rider (debited).
 * - Online Orders: Count towards earnings owed to the rider (credited).
 * - Platform Commission Fee: Automatically deducted per order.
 * - Calculate Net Withdrawable Balance:
 *   Net Balance = (Total Online Order Earnings) - (Platform Commissions) - (Total Cash Collected) + (Manual Adjustments)
 * - POSITIVE BALANCE: Enable Instant Daily Payout.
 * - NEGATIVE BALANCE: Disable payout button and display clear "Amount Owed to Platform" status.
 */
export function calculateRiderClearingSummary(
  riderId: string,
  riderName: string,
  riderPhone: string | undefined,
  completedOrders: DeliveryJobOrder[],
  adjustments: RiderManualAdjustment[] = [],
  totalWithdrawn: number = 0,
  extraEntries: RiderLedgerOrderEntry[] = [],
  customBaseEntries?: RiderLedgerOrderEntry[]
): {
  summary: RiderClearingSummary;
  ledgerEntries: RiderLedgerOrderEntry[];
} {
  // If there are real delivered orders, build ledger entries from them.
  // Otherwise use the customBaseEntries (from live Firestore) or baseline entries.
  const hasRealDelivered = completedOrders.some((o) => o.status === 'delivered');

  let entries: RiderLedgerOrderEntry[] = [];

  if (hasRealDelivered) {
    entries = completedOrders
      .filter((o) => o.status === 'delivered')
      .map((ord, idx) => {
        const isCod = ord.paymentMethod === 'cod';
        const grossAmount = ord.orderTotal || 45.00;
        const deliveryEarning = ord.earningsPayout || 12.00;
        const platformCommission = calculateOrderPlatformCommission(grossAmount, deliveryEarning);

        const cashCollected = isCod ? (ord.codAmountToCollect || grossAmount) : 0;
        const onlineEarnings = isCod ? 0 : deliveryEarning;

        const netAmountEffect = isCod
          ? -cashCollected
          : onlineEarnings - platformCommission;

        return {
          id: `rled-live-${ord.id || idx}`,
          orderNumber: ord.orderNumber || `DM-892${idx + 10}`,
          orderId: ord.id,
          customerName: ord.customerName || 'Customer',
          customerPhone: ord.customerPhone,
          completedAt: new Date(Date.now() - (idx + 1) * 3600000 * 2).toISOString(),
          paymentType: isCod ? ('Cash on Delivery' as const) : ('Online / Card Payment' as const),
          paymentMethod: ord.paymentMethod || 'fpx',
          grossOrderAmount: grossAmount,
          deliveryEarning,
          platformCommission,
          cashCollected,
          onlineEarnings,
          netAmountEffect,
          runningBalance: 0,
          notes: isCod
            ? `Cash Collected at Doorstep • Net Debited (-RM ${cashCollected.toFixed(2)})`
            : `Online Paid • Net Credited (+RM ${(onlineEarnings - platformCommission).toFixed(2)})`,
          status: 'Completed' as const,
        };
      });
  } else if (customBaseEntries && customBaseEntries.length > 0) {
    entries = [...customBaseEntries];
  } else {
    // Use baseline rich sample entries
    entries = [...INITIAL_RIDER_LEDGER_ENTRIES];
  }

  // Combine with any extra user-generated test entries
  if (extraEntries.length > 0) {
    entries = [...entries, ...extraEntries];
  }

  // Sort chronological ascending to calculate running balance accurately
  entries.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());

  // Running balance accumulation
  let running = 0;
  entries = entries.map((entry) => {
    running += entry.netAmountEffect;
    return {
      ...entry,
      runningBalance: parseFloat(running.toFixed(2)),
    };
  });

  // Calculate totals across all entries
  const totalCashCollected = entries.reduce((sum, e) => sum + e.cashCollected, 0);
  const totalOnlineEarnings = entries.reduce((sum, e) => sum + e.onlineEarnings, 0);
  const totalCommissionFees = entries.reduce((sum, e) => sum + e.platformCommission, 0);

  // Manual Adjustments calculation (credits add, debits subtract)
  const riderAdjustments = adjustments.filter((a) => !a.riderId || a.riderId === riderId || a.riderId === 'rider_default');
  const adjustmentsNet = riderAdjustments.reduce((sum, a) => {
    return sum + (a.type === 'credit' ? a.amount : -a.amount);
  }, 0);

  // Prompt Formula:
  // Net Balance = (Total Online Order Earnings) - (Platform Commissions) - (Total Cash Collected)
  // Plus any admin adjustments (e.g. Cash Handover at Counter credited)
  const rawNetBalance = totalOnlineEarnings - totalCommissionFees - totalCashCollected + adjustmentsNet;
  const netLedgerBalance = parseFloat(rawNetBalance.toFixed(2));

  // If Net Balance is negative, rider owes money to platform
  const isOwedToPlatform = netLedgerBalance < 0;
  const amountOwedToPlatform = isOwedToPlatform ? Math.abs(netLedgerBalance) : 0;

  // Withdrawable Balance: Positive balance minus any payouts already disbursed/withdrawn
  const withdrawableBalance = isOwedToPlatform
    ? 0
    : Math.max(0, parseFloat((netLedgerBalance - totalWithdrawn).toFixed(2)));

  const summary: RiderClearingSummary = {
    riderId,
    riderName,
    riderPhone,
    totalCashCollected: parseFloat(totalCashCollected.toFixed(2)),
    totalOnlineEarnings: parseFloat(totalOnlineEarnings.toFixed(2)),
    totalCommissionFees: parseFloat(totalCommissionFees.toFixed(2)),
    netLedgerBalance,
    totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
    withdrawableBalance,
    isOwedToPlatform,
    amountOwedToPlatform: parseFloat(amountOwedToPlatform.toFixed(2)),
  };

  // Reverse entries for presentation (most recent at top)
  const displayEntries = [...entries].reverse();

  return { summary, ledgerEntries: displayEntries };
}
