import { Product, CartItem, SubCategory, MainCategory } from '../types';

/**
 * High-affinity product pairs curated for realistic Malaysian supermarket grocery shopping.
 * Key: Product ID -> Array of complementary Product IDs
 */
export const PRODUCT_AFFINITY_MAP: Record<string, string[]> = {
  // Fresh Cabbage / Sawi / Broccoli -> Cooking oil, Fresh Whole Chicken, Grade A Eggs, Jasmine Rice, Onions
  'fp-veg-1': ['groc-rp-2', 'meat-1', 'groc-de-2', 'fp-veg-5', 'groc-rp-1'],
  'fp-veg-2': ['groc-rp-2', 'meat-1', 'groc-de-2', 'fp-veg-5'],
  'fp-veg-3': ['groc-de-2', 'groc-rp-2', 'meat-1', 'fp-veg-5'],
  'fp-veg-4': ['fp-veg-3', 'groc-de-2', 'groc-rp-2'],
  'fp-veg-5': ['groc-rp-2', 'meat-1', 'groc-rp-1', 'fp-veg-1'],
  'fp-veg-6': ['meat-2', 'groc-rp-2', 'groc-de-2', 'fp-veg-5'],

  // Fresh Fruits -> Fresh Milk, Yogurt/Eggs, Drinks
  'fp-frt-1': ['groc-de-1', 'groc-de-2', 'snd-drk-1', 'fp-frt-2'],
  'fp-frt-2': ['fp-frt-1', 'fp-frt-3', 'groc-de-1'],
  'fp-frt-3': ['fp-frt-2', 'fp-frt-1', 'snd-drk-3'],
  'fp-frt-4': ['fp-frt-5', 'fp-frt-1', 'groc-de-1'],
  'fp-frt-5': ['fp-frt-4', 'fp-frt-1', 'snd-drk-3'],

  // Fresh Meats (Chicken, Beef, Seafood) -> Cooking Oil, Rice, Onions, Cabbage, Eggs
  'meat-1': ['groc-rp-2', 'groc-rp-1', 'fp-veg-5', 'groc-de-2', 'fp-veg-1'],
  'meat-2': ['groc-rp-2', 'groc-rp-1', 'fp-veg-6', 'fp-veg-5', 'groc-de-2'],
  'meat-3': ['groc-rp-2', 'fp-veg-5', 'groc-rp-1', 'groc-can-2'],
  'meat-4': ['groc-rp-2', 'fp-veg-5', 'groc-rp-1', 'meat-5'],
  'meat-5': ['groc-rp-2', 'fp-veg-5', 'groc-rp-1', 'meat-4'],

  // Daily Groceries (Rice, Cooking Oil, Maggi, Eggs, Milk)
  'groc-rp-1': ['groc-rp-2', 'groc-de-2', 'meat-1', 'groc-can-1', 'fp-veg-5'],
  'groc-rp-2': ['groc-rp-1', 'groc-de-2', 'meat-1', 'fp-veg-1', 'fp-veg-5'],
  'groc-rp-3': ['groc-de-2', 'groc-can-1', 'snd-drk-3'],
  'groc-de-1': ['snd-drk-1', 'snd-snk-1', 'groc-de-2', 'fp-frt-1'],
  'groc-de-2': ['groc-rp-2', 'groc-rp-1', 'groc-de-1', 'meat-1', 'fp-veg-1'],
  'groc-can-1': ['groc-rp-1', 'groc-rp-2', 'fp-veg-5', 'groc-de-2'],
  'groc-can-2': ['snd-snk-1', 'groc-de-1', 'meat-2'],
  'groc-can-3': ['groc-de-1', 'snd-snk-1', 'fp-veg-4'],

  // Snacks & Drinks -> Drinks pair with snacks and vice-versa
  'snd-drk-1': ['groc-de-1', 'snd-snk-1', 'snd-snk-3', 'groc-de-2'],
  'snd-drk-2': ['snd-snk-1', 'snd-snk-3', 'groc-de-1'],
  'snd-drk-3': ['snd-snk-2', 'snd-snk-1', 'snd-snk-3'],
  'snd-snk-1': ['snd-drk-1', 'snd-drk-2', 'snd-drk-3'],
  'snd-snk-2': ['snd-drk-3', 'snd-drk-1', 'snd-snk-1'],
  'snd-snk-3': ['groc-de-1', 'snd-drk-1', 'snd-drk-2'],

  // Cleaning Products -> Dishwashing pairs with Tissues, Detergent, Disinfectant
  'cln-1': ['cln-2', 'cln-5', 'cln-3', 'cln-4'],
  'cln-2': ['cln-5', 'cln-1', 'cln-3', 'cln-4'],
  'cln-3': ['cln-4', 'cln-5', 'cln-2'],
  'cln-4': ['cln-3', 'cln-2', 'cln-5'],
  'cln-5': ['cln-2', 'cln-1', 'cln-3'],

  // Pet Foods -> Cat food pairs with Treats and Cat Litter
  'pet-1': ['pet-4', 'pet-5', 'pet-2'],
  'pet-2': ['pet-1', 'pet-4', 'pet-5'],
  'pet-3': ['pet-1', 'cln-3'],
  'pet-4': ['pet-1', 'pet-2', 'pet-5'],
  'pet-5': ['pet-1', 'pet-4', 'cln-3'],
};

/**
 * Complementary Subcategory Mappings
 */
export const COMPLEMENTARY_SUBCATEGORIES: Record<string, string[]> = {
  vegetables: ['rice_oil', 'poultry', 'dairy_eggs', 'seafood', 'canned_foods'],
  fruits: ['dairy_eggs', 'drinks', 'snacks', 'vegetables'],
  poultry: ['vegetables', 'rice_oil', 'dairy_eggs', 'canned_foods'],
  beef_lamb: ['vegetables', 'rice_oil', 'canned_foods'],
  seafood: ['vegetables', 'rice_oil', 'canned_foods', 'dairy_eggs'],
  rice_oil: ['poultry', 'dairy_eggs', 'vegetables', 'canned_foods', 'seafood'],
  canned_foods: ['rice_oil', 'dairy_eggs', 'vegetables', 'drinks'],
  dairy_eggs: ['rice_oil', 'vegetables', 'drinks', 'snacks', 'poultry'],
  snacks: ['drinks', 'dairy_eggs', 'fruits'],
  drinks: ['snacks', 'dairy_eggs', 'fruits'],
  laundry: ['dishwashing', 'paper', 'disinfectant'],
  dishwashing: ['paper', 'laundry', 'disinfectant'],
  disinfectant: ['paper', 'dishwashing', 'laundry'],
  paper: ['dishwashing', 'laundry', 'disinfectant'],
  cat_food: ['pet_hygiene', 'snacks'],
  dog_food: ['pet_hygiene', 'snacks'],
  pet_hygiene: ['cat_food', 'dog_food'],
};

/**
 * Complementary Main Category Mappings
 */
export const COMPLEMENTARY_MAIN_CATEGORIES: Record<string, string[]> = {
  fresh_products: ['daily_groceries', 'meats', 'snacks_and_drinks'],
  meats: ['daily_groceries', 'fresh_products'],
  daily_groceries: ['fresh_products', 'meats', 'snacks_and_drinks'],
  snacks_and_drinks: ['daily_groceries', 'fresh_products'],
  cleaning_products: ['daily_groceries', 'cleaning_products'],
  pet_foods: ['cleaning_products', 'pet_foods'],
};

/**
 * Universal household staple IDs that customers frequently add together
 */
export const TOP_STAPLE_IDS = [
  'groc-de-2', // NutriPlus Grade A Eggs
  'groc-rp-2', // Saji Cooking Oil
  'groc-de-1', // Farm Fresh Milk
  'fp-frt-1',  // Cavendish Bananas
  'groc-rp-1', // Jasmine Fragrant Rice
  'fp-veg-5',  // Red Onions
  'meat-1',    // Whole Chicken
  'cln-5',     // Premier Soft Tissues
];

/**
 * Intelligent recommendation algorithm to retrieve complementary products
 * for the current cart items.
 */
export function getFrequentlyBoughtTogether(
  cartItems: CartItem[],
  allProducts: Product[],
  limit: number = 6
): Product[] {
  if (!allProducts || allProducts.length === 0) {
    return [];
  }

  const inCartIds = new Set(cartItems.map((item) => item.product.id));

  // Filter out products currently in cart, or unavailable/out of stock
  const candidates = allProducts.filter(
    (product) =>
      !inCartIds.has(product.id) &&
      product.inStock !== false &&
      product.is_available !== false
  );

  if (candidates.length === 0) {
    return [];
  }

  // If cart is empty, suggest top universal staples
  if (cartItems.length === 0) {
    return candidates
      .filter((p) => TOP_STAPLE_IDS.includes(p.id) || p.featured)
      .slice(0, limit);
  }

  // Calculate score for each candidate product based on cart composition
  const scored = candidates.map((candidate) => {
    let score = 0;

    for (const item of cartItems) {
      const cartP = item.product;

      // 1. Direct Curated Affinity Map (Highest priority match: 60 pts)
      const affinities = PRODUCT_AFFINITY_MAP[cartP.id];
      if (affinities && affinities.includes(candidate.id)) {
        const affinityIndex = affinities.indexOf(candidate.id);
        score += Math.max(30, 60 - affinityIndex * 6);
      }

      // 2. Subcategory Complementarity (30 pts)
      const compSub = COMPLEMENTARY_SUBCATEGORIES[cartP.subCategory];
      if (compSub && compSub.includes(candidate.subCategory)) {
        const subIndex = compSub.indexOf(candidate.subCategory);
        score += Math.max(15, 30 - subIndex * 4);
      }

      // 3. Main Category Cross-Department Complementarity (15 pts)
      const compMain = COMPLEMENTARY_MAIN_CATEGORIES[cartP.mainCategory];
      if (compMain && compMain.includes(candidate.mainCategory)) {
        score += 15;
      }

      // 4. Secondary Categories matching (10 pts)
      if (
        candidate.secondaryCategories?.includes(cartP.mainCategory as MainCategory) ||
        cartP.secondaryCategories?.includes(candidate.mainCategory as MainCategory)
      ) {
        score += 10;
      }

      // 5. Cross-subcategory within same main department (variety addition: 8 pts)
      if (
        candidate.mainCategory === cartP.mainCategory &&
        candidate.subCategory !== cartP.subCategory
      ) {
        score += 8;
      }
    }

    // 6. Universal staple baseline bonus
    if (TOP_STAPLE_IDS.includes(candidate.id)) {
      score += 8;
    }

    // 7. Featured & Discounted bonus
    if (candidate.featured) {
      score += 4;
    }
    if (candidate.originalPrice && candidate.originalPrice > candidate.price) {
      score += 4;
    }

    return { product: candidate, score };
  });

  // Sort descending by calculated score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((s) => s.product);
}

/**
 * Checks if a given candidate product is part of an active frequent purchase pairing
 * with any item currently in the cart.
 */
export function isFrequentPurchasePairing(
  candidate: Product,
  cartItems: CartItem[]
): boolean {
  if (!cartItems || cartItems.length === 0) return false;

  for (const item of cartItems) {
    // 1. Direct Curated Affinity Pair (e.g. Chicken + Rice/Oil/Eggs, Chips + Drinks)
    const directAffinities = PRODUCT_AFFINITY_MAP[item.product.id];
    if (directAffinities && directAffinities.includes(candidate.id)) {
      return true;
    }

    // 2. High-affinity complementary subcategory match
    const compSub = COMPLEMENTARY_SUBCATEGORIES[item.product.subCategory];
    if (compSub && compSub.includes(candidate.subCategory)) {
      return true;
    }
  }

  return false;
}

/**
 * Identifies all product IDs in the cart that form a frequent purchase pairing
 * with at least one other item currently in the cart.
 */
export function getBundledCartItemIds(cartItems: CartItem[]): Set<string> {
  const ids = new Set<string>();
  if (!cartItems || cartItems.length < 2) return ids;

  for (let i = 0; i < cartItems.length; i++) {
    for (let j = 0; j < cartItems.length; j++) {
      if (i === j) continue;
      const pA = cartItems[i].product;
      const pB = cartItems[j].product;

      // 1. Direct Curated Affinity Pair
      const affinities = PRODUCT_AFFINITY_MAP[pA.id];
      if (affinities && affinities.includes(pB.id)) {
        ids.add(pA.id);
        ids.add(pB.id);
        continue;
      }

      // 2. High-affinity complementary subcategory match
      const compSub = COMPLEMENTARY_SUBCATEGORIES[pA.subCategory];
      if (compSub && compSub.includes(pB.subCategory)) {
        ids.add(pA.id);
        ids.add(pB.id);
      }
    }
  }

  return ids;
}


