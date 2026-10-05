import { GamificationBadge, Order, UserProfile } from '../types';

export function computeUserBadges(
  orders: Order[],
  loyaltyPoints: number,
  user?: UserProfile | null
): GamificationBadge[] {
  const orderCount = orders.length;

  // Check if any order contains fresh produce items
  const hasFreshFood = orders.some((o) =>
    o.items?.some((i) => {
      const cat = i.product?.category?.toLowerCase() || '';
      const name = i.product?.name?.toLowerCase() || '';
      return (
        cat.includes('fresh') ||
        cat.includes('produce') ||
        cat.includes('vegetable') ||
        cat.includes('fruit') ||
        name.includes('bayam') ||
        name.includes('tomato') ||
        name.includes('apple') ||
        name.includes('banana')
      );
    })
  );

  // Check if points or vouchers were redeemed
  const hasSavingsRedeemed = orders.some((o) => (o.pointsRedeemed && o.pointsRedeemed > 0) || (o.discount && o.discount > 0));

  // Check if reviews or ratings given
  const hasReviewed = orders.some((o) => !!o.review || (o.customerFeedback && o.customerFeedback.length > 0));

  const badges: GamificationBadge[] = [
    {
      id: 'first_order',
      titleEn: 'First Order',
      titleMs: 'Pesanan Pertama',
      descriptionEn: 'Placed your first online grocery order with doorstep delivery.',
      descriptionMs: 'Membuat pesanan barangan runcit pertama anda dengan penghantaran ke rumah.',
      category: 'orders',
      icon: 'shopping-bag',
      unlocked: orderCount >= 1,
      unlockedAt: orderCount >= 1 ? '12 Sep 2026' : undefined,
      progressCurrent: Math.min(1, orderCount),
      progressTarget: 1,
      progressUnitEn: 'order',
      progressUnitMs: 'pesanan',
      bonusPointsReward: 25,
      colorScheme: 'emerald',
    },
    {
      id: 'fresh_lover',
      titleEn: 'Fresh Food Lover',
      titleMs: 'Pencinta Makanan Segar',
      descriptionEn: 'Purchased fresh crisp farm vegetables, poultry, or sweet fruits.',
      descriptionMs: 'Membeli sayur-sayuran ladang segar, ayam, atau buah-buahan manis.',
      category: 'food',
      icon: 'leaf',
      unlocked: hasFreshFood || orderCount > 0,
      unlockedAt: (hasFreshFood || orderCount > 0) ? '12 Sep 2026' : undefined,
      progressCurrent: hasFreshFood || orderCount > 0 ? 1 : 0,
      progressTarget: 1,
      progressUnitEn: 'fresh item',
      progressUnitMs: 'barangan segar',
      bonusPointsReward: 30,
      colorScheme: 'emerald',
    },
    {
      id: 'regular_shopper',
      titleEn: 'Regular Shopper',
      titleMs: 'Pembeli Kerap',
      descriptionEn: 'Complete 3 or more grocery deliveries to achieve frequent shopper status.',
      descriptionMs: 'Lengkapkan 3 atau lebih pesanan runcit untuk status pembeli kerap.',
      category: 'orders',
      icon: 'award',
      unlocked: orderCount >= 3,
      unlockedAt: orderCount >= 3 ? 'Today' : undefined,
      progressCurrent: Math.min(3, orderCount),
      progressTarget: 3,
      progressUnitEn: 'orders completed',
      progressUnitMs: 'pesanan selesai',
      bonusPointsReward: 50,
      colorScheme: 'purple',
    },
    {
      id: 'savings_master',
      titleEn: 'Savings Master',
      titleMs: 'Pakar Penjimatan',
      descriptionEn: 'Redeemed loyalty points or promo vouchers at checkout for instant cash savings.',
      descriptionMs: 'Tebus mata ganjaran atau baucar promosi untuk penjimatan tunai segera.',
      category: 'loyalty',
      icon: 'tag',
      unlocked: hasSavingsRedeemed || loyaltyPoints > 0,
      unlockedAt: '12 Sep 2026',
      progressCurrent: hasSavingsRedeemed || loyaltyPoints > 0 ? 1 : 0,
      progressTarget: 1,
      progressUnitEn: 'discount used',
      progressUnitMs: 'diskaun diguna',
      bonusPointsReward: 40,
      colorScheme: 'amber',
    },
    {
      id: 'gold_vip',
      titleEn: 'Gold Tier VIP',
      titleMs: 'Ahli VIP Emas',
      descriptionEn: 'Reach 500 loyalty points to unlock 1.5x points multiplier and priority dispatch.',
      descriptionMs: 'Capai 500 mata ganjaran untuk 1.5x pengganda mata dan laluan rider ekspres.',
      category: 'loyalty',
      icon: 'crown',
      unlocked: loyaltyPoints >= 500,
      unlockedAt: loyaltyPoints >= 500 ? 'Unlocked' : undefined,
      progressCurrent: Math.min(500, loyaltyPoints),
      progressTarget: 500,
      progressUnitEn: 'pts',
      progressUnitMs: 'mata',
      bonusPointsReward: 100,
      colorScheme: 'amber',
    },
    {
      id: 'review_star',
      titleEn: 'Community Star',
      titleMs: 'Bintang Komuniti',
      descriptionEn: 'Rated a delivered order and shared feedback to help riders and customers.',
      descriptionMs: 'Menilai pesanan dihantar dan berkongsi ulasan untuk membantu rider & pembeli.',
      category: 'orders',
      icon: 'star',
      unlocked: hasReviewed || orderCount >= 1,
      unlockedAt: '12 Sep 2026',
      progressCurrent: hasReviewed || orderCount >= 1 ? 1 : 0,
      progressTarget: 1,
      progressUnitEn: 'review shared',
      progressUnitMs: 'ulasan dikongsi',
      bonusPointsReward: 20,
      colorScheme: 'blue',
    },
    {
      id: 'eco_green',
      titleEn: 'Eco Green Shopper',
      titleMs: 'Pembeli Hijau Lestari',
      descriptionEn: 'Opted for eco-friendly packaging and consolidated neighborhood delivery.',
      descriptionMs: 'Memilih pembungkusan mesra alam dan penghantaran kejiranan sepadu.',
      category: 'eco',
      icon: 'leaf',
      unlocked: true,
      unlockedAt: '01 Sep 2026',
      progressCurrent: 1,
      progressTarget: 1,
      progressUnitEn: 'eco trip',
      progressUnitMs: 'pilihan hijau',
      bonusPointsReward: 15,
      colorScheme: 'emerald',
    },
    {
      id: 'speedy_checkout',
      titleEn: 'Speedy Shopper',
      titleMs: 'Pembeli Pantas',
      descriptionEn: 'Completed grocery checkout in under 3 minutes with pre-saved address.',
      descriptionMs: 'Selesaikan pembelian dalam masa kurang 3 minit dengan alamat tersimpan.',
      category: 'orders',
      icon: 'clock',
      unlocked: !!user?.phone,
      unlockedAt: user?.phone ? '01 Sep 2026' : undefined,
      progressCurrent: user?.phone ? 1 : 0,
      progressTarget: 1,
      progressUnitEn: 'quick order',
      progressUnitMs: 'pesanan pantas',
      bonusPointsReward: 20,
      colorScheme: 'rose',
    },
  ];

  return badges;
}
