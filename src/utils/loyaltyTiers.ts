export type LoyaltyTierId = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierFeaturePill {
  iconType: 'truck' | 'sparkles' | 'ticket' | 'clock' | 'gift';
  label: { en: string; ms: string };
  highlight?: boolean;
}

export interface LoyaltyTier {
  id: LoyaltyTierId;
  name: {
    en: string;
    ms: string;
  };
  minPoints: number;
  maxPoints?: number;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconColor: string;
  gradient: string;
  multiplierText: string;
  featurePills: TierFeaturePill[];
  benefitsSummary: {
    en: string;
    ms: string;
  };
  keyPerks: {
    en: string[];
    ms: string[];
  };
  nextTier?: {
    id: LoyaltyTierId;
    name: {
      en: string;
      ms: string;
    };
    pointsNeeded: number;
  };
}

export function getLoyaltyTier(points: number = 0): LoyaltyTier {
  const safePoints = Math.max(0, points);

  if (safePoints >= 1000) {
    return {
      id: 'platinum',
      name: { en: 'Platinum VIP', ms: 'VIP Platinum' },
      minPoints: 1000,
      badgeBg: 'bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-100',
      badgeBorder: 'border-indigo-300',
      badgeText: 'text-indigo-900',
      iconColor: 'text-indigo-600',
      gradient: 'from-indigo-600 to-purple-600',
      multiplierText: '2.0x pts',
      featurePills: [
        { iconType: 'sparkles', label: { en: '2.0x Points Multiplier', ms: '2.0x Pengganda Mata' }, highlight: true },
        { iconType: 'truck', label: { en: 'Free Delivery (> RM 30)', ms: 'Penghantaran Percuma (> RM 30)' }, highlight: true },
        { iconType: 'gift', label: { en: 'VIP Concierge & Mega Hampers', ms: 'Khidmat VIP & Hamper Mega' } },
        { iconType: 'ticket', label: { en: 'Exclusive VIP Vouchers', ms: 'Baucar Eksklusif VIP' } },
      ],
      benefitsSummary: {
        en: 'Platinum VIP: Earn 2x bonus points, free delivery on orders > RM 30 & VIP member perks.',
        ms: 'VIP Platinum: 2x ganjaran mata, penghantaran percuma pesanan > RM 30 & keistimewaan VIP.',
      },
      keyPerks: {
        en: [
          'Earn 2x bonus points on every grocery purchase',
          'Free delivery on orders over RM 30',
          'Dedicated VIP support & priority order handling',
          'Exclusive access to seasonal mega flash deals',
        ],
        ms: [
          'Dapat 2x mata bonus setiap kali berbelanja',
          'Penghantaran percuma bagi pesanan lebih RM 30',
          'Sokongan VIP khusus & keutamaan penyediaan pesanan',
          'Akses eksklusif jualan kilat mega bermusim',
        ],
      },
    };
  }

  if (safePoints >= 500) {
    return {
      id: 'gold',
      name: { en: 'Gold', ms: 'Emas' },
      minPoints: 500,
      maxPoints: 999,
      badgeBg: 'bg-gradient-to-r from-amber-100 via-yellow-100 to-amber-200/90',
      badgeBorder: 'border-amber-400',
      badgeText: 'text-amber-950',
      iconColor: 'text-amber-700',
      gradient: 'from-amber-500 to-yellow-500',
      multiplierText: '1.5x pts',
      featurePills: [
        { iconType: 'sparkles', label: { en: '1.5x Points Multiplier', ms: '1.5x Pengganda Mata' }, highlight: true },
        { iconType: 'truck', label: { en: 'Monthly RM 5 Free Delivery', ms: 'Penghantaran Percuma RM 5 Bulanan' }, highlight: true },
        { iconType: 'clock', label: { en: 'Priority Order Picking', ms: 'Keutamaan Bungkus Pesanan' } },
        { iconType: 'gift', label: { en: 'Birthday Month 2x Booster', ms: 'Pemberat 2x Bulan Hari Lahir' } },
      ],
      benefitsSummary: {
        en: 'Gold Member: 1.5x points on all groceries, monthly RM 5 vouchers & priority packing.',
        ms: 'Ahli Emas: 1.5x mata untuk semua belian, baucar RM 5 bulanan & keutamaan pembungkusan.',
      },
      keyPerks: {
        en: [
          'Earn 1.5x points on every RM 1 spent',
          'Monthly RM 5 free delivery promo code',
          'Priority packing & speedier dispatch',
          'Birthday month double point booster',
        ],
        ms: [
          'Dapat 1.5x mata bagi setiap RM 1 dibelanjakan',
          'Kod promo diskaun RM 5 setiap bulan',
          'Pembungkusan dan penghantaran lebih pantas',
          'Ganjaran mata berganda pada bulan hari jadi',
        ],
      },
      nextTier: {
        id: 'platinum',
        name: { en: 'Platinum VIP', ms: 'VIP Platinum' },
        pointsNeeded: 1000 - safePoints,
      },
    };
  }

  if (safePoints >= 250) {
    return {
      id: 'silver',
      name: { en: 'Silver', ms: 'Perak' },
      minPoints: 250,
      maxPoints: 499,
      badgeBg: 'bg-gradient-to-r from-slate-100 via-gray-100 to-slate-200',
      badgeBorder: 'border-slate-300',
      badgeText: 'text-slate-800',
      iconColor: 'text-slate-600',
      gradient: 'from-slate-400 to-gray-500',
      multiplierText: '1.2x pts',
      featurePills: [
        { iconType: 'sparkles', label: { en: '1.2x Points Multiplier', ms: '1.2x Pengganda Mata' }, highlight: true },
        { iconType: 'ticket', label: { en: 'Weekly Member Flash Deals', ms: 'Jualan Kilat Ahli Mingguan' } },
        { iconType: 'clock', label: { en: 'Faster Support Response', ms: 'Bantuan Sokongan Pantas' } },
        { iconType: 'truck', label: { en: 'Priority Dispatch Routing', ms: 'Laluan Rider Diutamakan' } },
      ],
      benefitsSummary: {
        en: 'Silver Member: 1.2x bonus points, member flash deals & faster order fulfillment.',
        ms: 'Ahli Perak: 1.2x mata bonus, promosi kilat ahli & pemenuhan pesanan pantas.',
      },
      keyPerks: {
        en: [
          'Earn 1.2x points on all supermarket categories',
          'Exclusive access to weekly member flash sales',
          'Instant checkout discount redemption',
          'Faster customer support response',
        ],
        ms: [
          'Dapat 1.2x mata untuk semua kategori pasaraya',
          'Akses eksklusif diskaun kilat mingguan ahli',
          'Penebusan diskaun segera di skrin pembayaran',
          'Respons khidmat pelanggan lebih pantas',
        ],
      },
      nextTier: {
        id: 'gold',
        name: { en: 'Gold', ms: 'Emas' },
        pointsNeeded: 500 - safePoints,
      },
    };
  }

  // Default: Bronze
  return {
    id: 'bronze',
    name: { en: 'Bronze', ms: 'Gangsa' },
    minPoints: 0,
    maxPoints: 249,
    badgeBg: 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100',
    badgeBorder: 'border-orange-300/90',
    badgeText: 'text-amber-950',
    iconColor: 'text-orange-700',
    gradient: 'from-orange-500 to-amber-600',
    multiplierText: '1.0x pts',
    featurePills: [
      { iconType: 'sparkles', label: { en: '1.0x Base Points', ms: '1.0x Mata Asas' } },
      { iconType: 'ticket', label: { en: 'Instant Cash Redemption', ms: 'Penebusan Tunai Segera' } },
      { iconType: 'gift', label: { en: 'Stackable Promo Coupons', ms: 'Kupon Baucar Bertindan' } },
      { iconType: 'truck', label: { en: 'Standard Delivery Tracking', ms: 'Penjejakan Pesanan Standard' } },
    ],
    benefitsSummary: {
      en: 'Bronze Member: 1 point per RM 1 spent, instant checkout discounts & stackable promos.',
      ms: 'Ahli Gangsa: 1 mata setiap RM 1 dibelanja, diskaun pantas & baucar bertindan.',
    },
    keyPerks: {
      en: [
        'Earn 1 point for every RM 1 spent on groceries',
        'Instant cash discount redemption at checkout (100 pts = RM 1.00)',
        'Stack points with promo codes & free shipping vouchers',
      ],
      ms: [
        'Kumpul 1 mata setiap RM 1 dibelanja di pasaraya',
        'Penebusan diskaun tunai segera di checkout (100 mata = RM 1.00)',
        'Gabung mata ganjaran bersama baucar promosi & penghantaran',
      ],
    },
    nextTier: {
      id: 'silver',
      name: { en: 'Silver', ms: 'Perak' },
      pointsNeeded: 250 - safePoints,
    },
  };
}

export function getAllLoyaltyTiers(): LoyaltyTier[] {
  return [
    getLoyaltyTier(0),
    getLoyaltyTier(250),
    getLoyaltyTier(500),
    getLoyaltyTier(1000),
  ];
}

export function calculateTierProgress(points: number = 0): {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  percentageInTier: number;
  overallPercentage: number;
  pointsNeeded: number;
  pointsInCurrentTier: number;
  tierTotalSpan: number;
} {
  const safePoints = Math.max(0, points);
  const currentTier = getLoyaltyTier(safePoints);
  const tiers = getAllLoyaltyTiers();

  const nextTierIndex = tiers.findIndex((t) => t.id === currentTier.id) + 1;
  const nextTier = nextTierIndex < tiers.length ? tiers[nextTierIndex] : null;

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      percentageInTier: 100,
      overallPercentage: 100,
      pointsNeeded: 0,
      pointsInCurrentTier: safePoints - currentTier.minPoints,
      tierTotalSpan: 0,
    };
  }

  const tierTotalSpan = nextTier.minPoints - currentTier.minPoints;
  const pointsInCurrentTier = safePoints - currentTier.minPoints;
  const percentageInTier = Math.min(100, Math.max(0, Math.round((pointsInCurrentTier / tierTotalSpan) * 100)));
  const overallPercentage = Math.min(100, Math.max(0, Math.round((safePoints / 1000) * 100)));
  const pointsNeeded = nextTier.minPoints - safePoints;

  return {
    currentTier,
    nextTier,
    percentageInTier,
    overallPercentage,
    pointsNeeded,
    pointsInCurrentTier,
    tierTotalSpan,
  };
}

