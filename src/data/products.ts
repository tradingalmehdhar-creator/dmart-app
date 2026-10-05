import { Product, ProductModel, MainCategory, SubCategory } from '../types';
import productsJson from './productsData.json';

/**
 * Maps raw JSON product item into a fully typed Product model with both
 * snake_case dynamic fields and legacy camelCase properties.
 */
export function mapJsonToProduct(item: any): Product {
  const price = Number(item.price);
  const oldPrice =
    item.old_price !== null && item.old_price !== undefined
      ? Number(item.old_price)
      : undefined;

  const isAvailable =
    item.is_available !== undefined ? Boolean(item.is_available) : true;

  const name = item.name || '';
  const nameMs = item.name_ms || item.name || '';
  const image = item.image_url || item.image || '';

  return {
    // Dynamic Product Model specification fields
    id: item.id,
    name: name,
    category: (item.category || 'daily_groceries') as MainCategory,
    price: price,
    old_price: oldPrice ?? null,
    image_url: image,
    is_available: isAvailable,
    updated_at: item.updated_at || '2026-09-17T08:00:00.000Z',

    // Multilingual & Supermarket specific metadata
    nameEn: name,
    nameMs: nameMs,
    mainCategory: (item.category || 'daily_groceries') as MainCategory,
    subCategory: (item.sub_category || 'vegetables') as SubCategory,
    secondaryCategories: (item.secondary_categories || []) as MainCategory[],
    originalPrice: oldPrice,
    amountEn: item.amount || '1 pack',
    amountMs: item.amount_ms || item.amount || '1 pek',
    amount: item.amount || '1 pack',
    amount_ms: item.amount_ms || item.amount || '1 pek',
    unitEn: item.unit || item.amount || '1 pack',
    unitMs: item.unit_ms || item.amount_ms || '1 pek',
    unit: item.unit || item.amount || '1 pack',
    unit_ms: item.unit_ms || item.amount_ms || '1 pek',
    image: image,
    descriptionEn: item.description || '',
    descriptionMs: item.description_ms || item.description || '',
    description: item.description || '',
    description_ms: item.description_ms || item.description || '',
    inStock: isAvailable,
    stockCount: item.stock_count ?? 50,
    stock_count: item.stock_count ?? 50,
    halal: item.halal !== false,
    featured: Boolean(item.featured),
    badge: item.badge || undefined,
    badgeMs: item.badge_ms || undefined,
    badge_ms: item.badge_ms || undefined,
    bundleBadge:
      item.bundle_badge ||
      item.bundleBadge ||
      (item.id === 'cln-5'
        ? 'Buy 1 Free 1'
        : item.id === 'groc-rp-3'
        ? 'Combo Saver'
        : item.id === 'snd-snk-3'
        ? 'Value Pack'
        : item.id === 'groc-de-2'
        ? 'Value Pack'
        : item.id === 'snd-drk-2'
        ? 'Twin Pack'
        : undefined),
    bundleBadgeMs:
      item.bundle_badge_ms ||
      item.bundleBadgeMs ||
      (item.id === 'cln-5'
        ? 'Beli 1 Percuma 1'
        : item.id === 'groc-rp-3'
        ? 'Jimat Kombo'
        : item.id === 'snd-snk-3'
        ? 'Pek Nilai'
        : item.id === 'groc-de-2'
        ? 'Pek Nilai'
        : item.id === 'snd-drk-2'
        ? 'Pek Kembar'
        : undefined),
    bundle_badge:
      item.bundle_badge ||
      item.bundleBadge ||
      (item.id === 'cln-5'
        ? 'Buy 1 Free 1'
        : item.id === 'groc-rp-3'
        ? 'Combo Saver'
        : item.id === 'snd-snk-3'
        ? 'Value Pack'
        : item.id === 'groc-de-2'
        ? 'Value Pack'
        : item.id === 'snd-drk-2'
        ? 'Twin Pack'
        : undefined),
    bundle_badge_ms:
      item.bundle_badge_ms ||
      item.bundleBadgeMs ||
      (item.id === 'cln-5'
        ? 'Beli 1 Percuma 1'
        : item.id === 'groc-rp-3'
        ? 'Jimat Kombo'
        : item.id === 'snd-snk-3'
        ? 'Pek Nilai'
        : item.id === 'groc-de-2'
        ? 'Pek Nilai'
        : item.id === 'snd-drk-2'
        ? 'Pek Kembar'
        : undefined),
    isBundle: Boolean(
      item.is_bundle ||
      item.isBundle ||
      item.bundle_badge ||
      item.bundleBadge ||
      item.id === 'cln-5' ||
      item.id === 'groc-rp-3' ||
      item.id === 'snd-snk-3' ||
      item.id === 'groc-de-2' ||
      item.id === 'snd-drk-2'
    ),
    is_bundle: Boolean(
      item.is_bundle ||
      item.isBundle ||
      item.bundle_badge ||
      item.bundleBadge ||
      item.id === 'cln-5' ||
      item.id === 'groc-rp-3' ||
      item.id === 'snd-snk-3' ||
      item.id === 'groc-de-2' ||
      item.id === 'snd-drk-2'
    ),
    barcode: item.barcode || undefined,
    barcode_alt: item.barcode_alt || undefined,
    barcodeAlt: item.barcode_alt || undefined,

    // Enterprise Batch & Expiry Control metadata
    batch_number: item.batch_number || item.batchNumber || `BATCH-2609-${item.id.slice(-4).toUpperCase()}`,
    batchNumber: item.batchNumber || item.batch_number || `BATCH-2609-${item.id.slice(-4).toUpperCase()}`,
    expiry_date:
      item.expiry_date ||
      item.expiryDate ||
      (item.category === 'fresh_products'
        ? '2026-09-27'
        : item.category === 'meats'
        ? '2026-09-25'
        : item.category === 'daily_groceries' && item.sub_category === 'dairy_eggs'
        ? '2026-09-28'
        : '2027-04-15'),
    expiryDate:
      item.expiryDate ||
      item.expiry_date ||
      (item.category === 'fresh_products'
        ? '2026-09-27'
        : item.category === 'meats'
        ? '2026-09-25'
        : item.category === 'daily_groceries' && item.sub_category === 'dairy_eggs'
        ? '2026-09-28'
        : '2027-04-15'),
    manufacturingDate: item.manufacturingDate || item.manufacturing_date || '2026-09-15',
    manufacturing_date: item.manufacturing_date || item.manufacturingDate || '2026-09-15',
    lowStockThreshold: item.lowStockThreshold || item.low_stock_threshold || 12,
    low_stock_threshold: item.low_stock_threshold || item.lowStockThreshold || 12,
    costPrice: item.costPrice || item.cost_price || Number((price * 0.72).toFixed(2)),
    cost_price: item.cost_price || item.costPrice || Number((price * 0.72).toFixed(2)),
  };
}

// Initialized product catalog directly sourced from central productsData.json
export const initialProducts: Product[] = (productsJson as any[]).map(mapJsonToProduct);

// Local persistence storage key (enabling real-time updates pre-Firebase)
const LOCAL_STORAGE_PRODUCTS_KEY = 'dmart_products_store';

/**
 * Loads products from localStorage if user or manager has made dynamic edits,
 * falling back to central productsData.json.
 */
export function loadProducts(): Product[] {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(mapJsonToProduct);
        }
      } catch (e) {
        console.warn('Error reading products from localStorage:', e);
      }
    }
  }
  return initialProducts;
}

/**
 * Saves updated product pricing, discounts, or stock availability.
 */
export function saveProducts(newProducts: Product[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(newProducts));
  }
}

/**
 * Helper to update a product's price and old_price seamlessly
 */
export function updateProductPrice(
  productsList: Product[],
  productId: string,
  newPrice: number,
  oldPrice?: number | null
): Product[] {
  const updated = productsList.map((p) => {
    if (p.id === productId) {
      return {
        ...p,
        price: newPrice,
        old_price: oldPrice !== undefined ? oldPrice : p.price,
        originalPrice: oldPrice !== undefined && oldPrice !== null ? oldPrice : p.price,
        updated_at: new Date().toISOString(),
      };
    }
    return p;
  });
  saveProducts(updated);
  return updated;
}

/**
 * Helper to toggle or update product availability
 */
export function updateProductAvailability(
  productsList: Product[],
  productId: string,
  isAvailable: boolean
): Product[] {
  const updated = productsList.map((p) => {
    if (p.id === productId) {
      return {
        ...p,
        is_available: isAvailable,
        inStock: isAvailable,
        updated_at: new Date().toISOString(),
      };
    }
    return p;
  });
  saveProducts(updated);
  return updated;
}

// Export default static-compatible array so existing consumers function without modifications
export const products: Product[] = loadProducts();
