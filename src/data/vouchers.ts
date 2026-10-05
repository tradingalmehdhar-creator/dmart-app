import { Voucher, PromoConfig } from '../types';
import promoConfigJson from './promoConfig.json';

// Type assertion for central mock promo configuration
export const defaultPromoConfig: PromoConfig = promoConfigJson as PromoConfig;

// Central local storage key for pre-Firebase configuration testing & live updates
const LOCAL_STORAGE_PROMO_KEY = 'dmart_promo_config';

/**
 * Loads dynamic promo configuration (announcement bar, active order status banner, special vouchers)
 */
export function loadPromoConfig(): PromoConfig {
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(LOCAL_STORAGE_PROMO_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.announcementBar && parsed.specialVouchers) {
          return parsed;
        }
      } catch (e) {
        console.warn('Error reading promo config from localStorage:', e);
      }
    }
  }
  return defaultPromoConfig;
}

/**
 * Saves promo configuration locally (ready to be swapped with Firestore document update)
 */
export function savePromoConfig(newConfig: PromoConfig): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_PROMO_KEY, JSON.stringify(newConfig));
  }
}

// Available vouchers list sourced dynamically from central configuration
export const AVAILABLE_VOUCHERS: Voucher[] = defaultPromoConfig.specialVouchers;
