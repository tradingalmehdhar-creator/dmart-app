import { LoyaltyTransaction } from '../types';

export const INITIAL_LOYALTY_TRANSACTIONS: LoyaltyTransaction[] = [
  {
    id: 'tx-init-1',
    type: 'bonus',
    amount: 150,
    titleEn: 'Member Welcome Bonus',
    titleMs: 'Bonus Selamat Datang Ahli',
    date: '2026-09-01T09:00:00.000Z',
    notesEn: 'Welcome reward for creating a verified D-mart shopper account',
    notesMs: 'Ganjaran alu-aluan bagi pendaftaran akaun pembeli D-mart',
    balanceAfter: 150,
  },
  {
    id: 'tx-init-2',
    type: 'earned',
    amount: 27,
    titleEn: 'Order Cashback Points',
    titleMs: 'Mata Ganjaran Pesanan',
    orderReference: 'DMART-782419',
    date: '2026-09-12T14:22:00.000Z',
    notesEn: 'Earned 1x points on grocery purchase (RM 26.70)',
    notesMs: 'Mata ganjaran 1x belian barangan runcit (RM 26.70)',
    balanceAfter: 177,
  },
  {
    id: 'tx-init-3',
    type: 'spent',
    amount: -27,
    titleEn: 'Redeemed at Checkout Discount',
    titleMs: 'Tebus Diskaun Semakan Keluar',
    orderReference: 'DMART-782419',
    date: '2026-09-12T14:23:00.000Z',
    notesEn: 'Instant checkout cart deduction (-RM 0.27)',
    notesMs: 'Potongan segera bakul belian (-RM 0.27)',
    balanceAfter: 150,
  },
  {
    id: 'tx-init-4',
    type: 'bonus',
    amount: 50,
    titleEn: 'Fresh Harvest Weekend Promo',
    titleMs: 'Bonus Hujung Minggu Sayur Segar',
    date: '2026-09-20T10:15:00.000Z',
    notesEn: 'Special seasonal promotion points reward',
    notesMs: 'Ganjaran mata promosi bermusim hujung minggu',
    balanceAfter: 200,
  },
  {
    id: 'tx-init-5',
    type: 'spent',
    amount: -50,
    titleEn: 'Points Redeemed for Discount',
    titleMs: 'Mata Ditebus untuk Diskaun',
    orderReference: 'DMART-391820',
    date: '2026-09-25T16:40:00.000Z',
    notesEn: 'Instant grocery checkout savings (-RM 0.50)',
    notesMs: 'Penjimatan segera belian runcit (-RM 0.50)',
    balanceAfter: 150,
  },
];

export function getStoredLoyaltyTransactions(): LoyaltyTransaction[] {
  try {
    const raw = localStorage.getItem('dmart_loyalty_transactions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse loyalty transactions:', err);
  }
  return INITIAL_LOYALTY_TRANSACTIONS;
}

export function saveLoyaltyTransactions(transactions: LoyaltyTransaction[]): void {
  try {
    localStorage.setItem('dmart_loyalty_transactions', JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save loyalty transactions:', err);
  }
}
