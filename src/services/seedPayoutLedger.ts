import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

export interface PartnerOrderDoc {
  id?: string;
  partnerCode: string;
  amount: number;
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  createdAt?: any;
  items: string[];
}

export interface PayoutLedgerDoc {
  id?: string;
  advertiserId: string;
  partnerName: string;
  commissionRate: number; // e.g. 0.10 for 10%
  settlementStatus: 'UNSETTLED' | 'SETTLED';
  periodStart: string;
  periodEnd: string;
  lastUpdated?: any;
}

export interface PayoutCalculationResult {
  grossCompletedSales: number;
  commissionDeducted: number;
  netPayoutPayable: number;
  pendingAmountExcluded: number;
  cancelledAmountIgnored: number;
  completedOrderCount: number;
  pendingOrderCount: number;
  cancelledOrderCount: number;
}

/**
 * Seeds mock orders and payout ledger summary for partner PARTNER_TEST_01 (Almehdhar Trading Co.)
 */
export const seedPayoutLedgerMockData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const mockPartnerId = 'PARTNER_TEST_01';

    // 1. Completed Order #1 ($100 RM)
    await addDoc(collection(db, 'orders'), {
      partnerCode: mockPartnerId,
      amount: 100.0,
      status: 'COMPLETED',
      createdAt: serverTimestamp(),
      items: ['Jasmine Super Special Rice 10kg'],
    });

    // 2. Completed Order #2 ($200 RM)
    await addDoc(collection(db, 'orders'), {
      partnerCode: mockPartnerId,
      amount: 200.0,
      status: 'COMPLETED',
      createdAt: serverTimestamp(),
      items: ['Ayam Brand Tuna', 'Campbell Soup'],
    });

    // 3. Pending Order ($50 RM) - Should be excluded from current net payout
    await addDoc(collection(db, 'orders'), {
      partnerCode: mockPartnerId,
      amount: 50.0,
      status: 'PENDING',
      createdAt: serverTimestamp(),
      items: ['Fresh Produce'],
    });

    // 4. Cancelled Order ($75 RM) - Should be ignored entirely
    await addDoc(collection(db, 'orders'), {
      partnerCode: mockPartnerId,
      amount: 75.0,
      status: 'CANCELLED',
      createdAt: serverTimestamp(),
      items: ['Sardines Can'],
    });

    // 5. Payout Ledger Summary Record
    await addDoc(collection(db, 'payout_ledger'), {
      advertiserId: mockPartnerId,
      partnerName: 'Almehdhar Trading Co.',
      commissionRate: 0.1, // 10% commission
      settlementStatus: 'UNSETTLED',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-31',
      lastUpdated: serverTimestamp(),
    });

    console.log('Mock data successfully seeded for Payout Ledger testing.');
    return {
      success: true,
      message: 'Mock data successfully seeded to Firestore for PARTNER_TEST_01 (Almehdhar Trading Co.).',
    };
  } catch (error) {
    console.error('Error seeding mock data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error seeding mock data',
    };
  }
};

/**
 * Fetch partner orders from Firestore
 */
export const fetchPartnerOrders = async (partnerCode = 'PARTNER_TEST_01'): Promise<PartnerOrderDoc[]> => {
  try {
    const q = query(collection(db, 'orders'), where('partnerCode', '==', partnerCode));
    const snapshot = await getDocs(q);
    const list: PartnerOrderDoc[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...(doc.data() as Omit<PartnerOrderDoc, 'id'>) });
    });
    return list;
  } catch (err) {
    console.warn('fetchPartnerOrders fallback:', err);
    return [];
  }
};

/**
 * Fetch payout ledger records from Firestore
 */
export const fetchPayoutLedgerRecords = async (advertiserId = 'PARTNER_TEST_01'): Promise<PayoutLedgerDoc[]> => {
  try {
    const q = query(collection(db, 'payout_ledger'), where('advertiserId', '==', advertiserId));
    const snapshot = await getDocs(q);
    const list: PayoutLedgerDoc[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...(doc.data() as Omit<PayoutLedgerDoc, 'id'>) });
    });
    return list;
  } catch (err) {
    console.warn('fetchPayoutLedgerRecords fallback:', err);
    return [];
  }
};

/**
 * Calculate net payout from partner orders and ledger settings
 */
export const calculateNetPayout = (
  orders: PartnerOrderDoc[],
  commissionRate = 0.1
): PayoutCalculationResult => {
  let grossCompletedSales = 0;
  let pendingAmountExcluded = 0;
  let cancelledAmountIgnored = 0;
  let completedOrderCount = 0;
  let pendingOrderCount = 0;
  let cancelledOrderCount = 0;

  orders.forEach((ord) => {
    const amt = Number(ord.amount) || 0;
    if (ord.status === 'COMPLETED') {
      grossCompletedSales += amt;
      completedOrderCount += 1;
    } else if (ord.status === 'PENDING') {
      pendingAmountExcluded += amt;
      pendingOrderCount += 1;
    } else if (ord.status === 'CANCELLED') {
      cancelledAmountIgnored += amt;
      cancelledOrderCount += 1;
    }
  });

  const commissionDeducted = Number((grossCompletedSales * commissionRate).toFixed(2));
  const netPayoutPayable = Number((grossCompletedSales - commissionDeducted).toFixed(2));

  return {
    grossCompletedSales,
    commissionDeducted,
    netPayoutPayable,
    pendingAmountExcluded,
    cancelledAmountIgnored,
    completedOrderCount,
    pendingOrderCount,
    cancelledOrderCount,
  };
};
