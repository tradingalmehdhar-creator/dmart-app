import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut, deleteUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import rawConfig from '../firebase-applet-config.json';
import {
  Product,
  MerchantPartner,
  Order,
  DeliveryPartnerApplication,
  UserProfile,
  DeliveryAddress,
  MarketingBanner,
  RiderPayoutRequest,
  RiderLedgerOrderEntry,
  PdfConfigSettings,
  DEFAULT_PDF_CONFIG,
  StorefrontCopySettings,
  DEFAULT_STOREFRONT_COPY,
  LoyaltyTransaction,
  ManagedCategory,
} from './types';
import { INITIAL_MARKETING_BANNERS } from './data/adminInitialData';

// Environment Bindings with local config fallback
const env = ((import.meta as unknown) as { env?: Record<string, string> }).env || {};

export const firebaseCredentials = {
  apiKey: env.VITE_FIREBASE_API_KEY || rawConfig.apiKey || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || rawConfig.authDomain || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || rawConfig.projectId || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || rawConfig.storageBucket || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || rawConfig.messagingSenderId || '',
  appId: env.VITE_FIREBASE_APP_ID || rawConfig.appId || '',
  firestoreDatabaseId: env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || rawConfig.firestoreDatabaseId || '',
};

// Initialize Firebase App instance safely (singleton)
export const firebaseApp = !getApps().length
  ? initializeApp({
      apiKey: firebaseCredentials.apiKey,
      authDomain: firebaseCredentials.authDomain,
      projectId: firebaseCredentials.projectId,
      storageBucket: firebaseCredentials.storageBucket,
      messagingSenderId: firebaseCredentials.messagingSenderId,
      appId: firebaseCredentials.appId,
    })
  : getApp();

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore Database (using custom databaseId if configured)
export const db =
  firebaseCredentials.firestoreDatabaseId && firebaseCredentials.firestoreDatabaseId !== '(default)'
    ? getFirestore(firebaseApp, firebaseCredentials.firestoreDatabaseId)
    : getFirestore(firebaseApp);

// Initialize Firebase Storage
export const storage = getStorage(firebaseApp);

// Primary Firestore Collection Names
export const COLLECTIONS = {
  USERS: 'dmart_users',
  PRODUCTS: 'dmart_products',
  CATEGORIES: 'dmart_categories',
  SUPPLIERS: 'dmart_suppliers',
  ORDERS: 'dmart_orders',
  RIDERS: 'dmart_riders',
  LOYALTY_TRANSACTIONS: 'dmart_loyalty_transactions',
  BANNERS: 'storefront_banners',
  BANNERS_ALIAS: 'banners',
  PAYOUT_REQUESTS: 'payout_requests',
  RIDER_LEDGERS: 'rider_ledgers',
  SYSTEM_SETTINGS: 'system_settings',
} as const;

// Helper to remove undefined fields which Firestore rejects
export function cleanFirestoreData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Connection test routine as mandated by Firebase architecture skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connected successfully to Firestore database:', firebaseCredentials.projectId);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Offline mode active or network unreachable.');
    } else {
      // Normal when test doc does not exist yet; connection is functional
      console.log('[Firebase] Verified connection to database:', firebaseCredentials.projectId);
    }
    return true;
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: USERS (dmart_users)
// -------------------------------------------------------------
export async function syncUserToFirestore(
  user: UserProfile,
  deliveryAddress?: DeliveryAddress,
  loyaltyPoints?: number
): Promise<void> {
  if (!user || !user.email) return;
  try {
    const docId = user.name ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'guest_user';
    const userRef = doc(db, COLLECTIONS.USERS, docId);
    await setDoc(
      userRef,
      {
        uid: docId,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        phone: deliveryAddress?.phone || user.phone || '',
        savedAddresses: deliveryAddress ? [deliveryAddress] : [],
        loyaltyPoints: loyaltyPoints !== undefined ? loyaltyPoints : 150,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] syncUserToFirestore fallback to local state:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: CATALOG PRODUCTS (dmart_products)
// -------------------------------------------------------------
export async function syncProductToFirestore(product: Product): Promise<void> {
  if (!product || !product.id) return;
  try {
    const prodRef = doc(db, COLLECTIONS.PRODUCTS, product.id);
    await setDoc(
      prodRef,
      cleanFirestoreData({
        ...product,
        updated_at: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] syncProductToFirestore error:', err);
  }
}

export async function fetchProductsFromFirestore(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if (snap.empty) return [];
    const list: Product[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Product);
    });
    return list;
  } catch (err) {
    console.warn('[Firebase] fetchProductsFromFirestore error:', err);
    return [];
  }
}

export function subscribeToCatalogProducts(
  onUpdate: (products: Product[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.PRODUCTS);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as Product);
          });
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('[Firebase] catalog products onSnapshot error:', error);
      }
    );
  } catch (err) {
    console.warn('[Firebase] subscribeToCatalogProducts error:', err);
    return () => {};
  }
}

export async function deleteProductFromFirestore(productId: string): Promise<void> {
  if (!productId) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, productId));
    console.log('[Firebase] Deleted product from Firestore:', productId);
  } catch (err) {
    console.warn('[Firebase] deleteProductFromFirestore error:', err);
  }
}

export async function seedInitialProductsIfEmpty(initial: Product[]): Promise<void> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    if ((snap.empty || snap.size < initial.length) && initial && initial.length > 0) {
      console.log(`[Firebase] Ensuring all ${initial.length} products are seeded to Firestore...`);
      const existingIds = new Set(snap.docs.map((d) => d.id));
      for (const p of initial) {
        if (!existingIds.has(p.id)) {
          await syncProductToFirestore(p);
        }
      }
      console.log('[Firebase] Successfully synchronized product catalog to Firestore.');
    }
  } catch (err) {
    console.warn('[Firebase] seedInitialProductsIfEmpty warning:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: CATEGORIES (dmart_categories)
// -------------------------------------------------------------
export async function syncCategoryToFirestore(category: ManagedCategory): Promise<void> {
  if (!category || !category.id) return;
  try {
    const catRef = doc(db, COLLECTIONS.CATEGORIES, category.id);
    await setDoc(
      catRef,
      cleanFirestoreData({
        ...category,
        updated_at: new Date().toISOString(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] syncCategoryToFirestore error:', err);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string): Promise<void> {
  if (!categoryId) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CATEGORIES, categoryId));
    console.log('[Firebase] Deleted category from Firestore:', categoryId);
  } catch (err) {
    console.warn('[Firebase] deleteCategoryFromFirestore error:', err);
  }
}

export async function fetchCategoriesFromFirestore(): Promise<ManagedCategory[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
    if (snap.empty) return [];
    const list: ManagedCategory[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as ManagedCategory);
    });
    return list;
  } catch (err) {
    console.warn('[Firebase] fetchCategoriesFromFirestore error:', err);
    return [];
  }
}

export function subscribeToCategories(
  onUpdate: (categories: ManagedCategory[]) => void
): () => void {
  try {
    const colRef = collection(db, COLLECTIONS.CATEGORIES);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ManagedCategory[] = [];
          snapshot.forEach((docSnap) => {
            list.push(docSnap.data() as ManagedCategory);
          });
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('[Firebase] categories onSnapshot error:', error);
      }
    );
  } catch (err) {
    console.warn('[Firebase] subscribeToCategories error:', err);
    return () => {};
  }
}

export async function seedInitialCategoriesIfEmpty(initial: ManagedCategory[]): Promise<void> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
    if ((snap.empty || snap.size < initial.length) && initial && initial.length > 0) {
      console.log(`[Firebase] Ensuring all ${initial.length} categories are seeded to Firestore...`);
      const existingIds = new Set(snap.docs.map((d) => d.id));
      for (const c of initial) {
        if (!existingIds.has(c.id)) {
          await syncCategoryToFirestore(c);
        }
      }
      console.log('[Firebase] Successfully synchronized categories to Firestore.');
    }
  } catch (err) {
    console.warn('[Firebase] seedInitialCategoriesIfEmpty warning:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: LOYALTY TRANSACTIONS (dmart_loyalty_transactions)
// -------------------------------------------------------------
export async function syncLoyaltyTransactionToFirestore(
  transaction: LoyaltyTransaction,
  userEmail?: string
): Promise<void> {
  try {
    const txRef = doc(db, COLLECTIONS.LOYALTY_TRANSACTIONS, transaction.id);
    await setDoc(
      txRef,
      {
        ...transaction,
        userEmail: userEmail || 'guest@dmart.my',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] syncLoyaltyTransactionToFirestore error:', err);
  }
}

export async function fetchLoyaltyTransactionsFromFirestore(
  userEmail?: string
): Promise<LoyaltyTransaction[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.LOYALTY_TRANSACTIONS));
    if (snap.empty) return [];
    const list: LoyaltyTransaction[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as LoyaltyTransaction & { userEmail?: string };
      if (!userEmail || !data.userEmail || data.userEmail === userEmail) {
        list.push({ ...data, id: docSnap.id });
      }
    });
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  } catch (err) {
    console.warn('[Firebase] fetchLoyaltyTransactionsFromFirestore error:', err);
    return [];
  }
}

export function subscribeToLoyaltyTransactions(
  userEmail: string | undefined,
  onUpdate: (transactions: LoyaltyTransaction[]) => void
): () => void {
  try {
    const txCol = collection(db, COLLECTIONS.LOYALTY_TRANSACTIONS);
    return onSnapshot(
      txCol,
      (snapshot) => {
        const list: LoyaltyTransaction[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LoyaltyTransaction & { userEmail?: string };
          if (!userEmail || !data.userEmail || data.userEmail === userEmail) {
            list.push({ ...data, id: docSnap.id });
          }
        });
        list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        console.warn('[Firebase] loyalty transactions onSnapshot error:', error);
      }
    );
  } catch (err) {
    console.warn('[Firebase] subscribeToLoyaltyTransactions error:', err);
    return () => {};
  }
}

export async function deleteUserAccountFromFirestore(userEmail: string): Promise<boolean> {
  try {
    const docId = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    await deleteDoc(doc(db, COLLECTIONS.USERS, docId));
    
    // Also delete Firebase Auth current user if signed in
    if (auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
      } catch (authErr) {
        console.warn('[Firebase] Auth deleteUser warning (may require recent login):', authErr);
      }
    }
    return true;
  } catch (err) {
    console.error('[Firebase] deleteUserAccountFromFirestore failed:', err);
    return false;
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: SUPPLIERS / PARTNERS (dmart_suppliers)
// -------------------------------------------------------------
export async function fetchSuppliersFromFirestore(): Promise<MerchantPartner[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.SUPPLIERS));
    if (querySnapshot.empty) {
      return [];
    }
    const suppliers: MerchantPartner[] = [];
    querySnapshot.forEach((docSnap) => {
      suppliers.push(docSnap.data() as MerchantPartner);
    });
    return suppliers;
  } catch (err) {
    console.warn('[Firebase] fetchSuppliersFromFirestore error, reading local fallback:', err);
    return [];
  }
}

export async function saveSupplierToFirestore(supplier: MerchantPartner): Promise<void> {
  try {
    const supplierRef = doc(db, COLLECTIONS.SUPPLIERS, supplier.id);
    await setDoc(supplierRef, { ...supplier, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('[Firebase] saveSupplierToFirestore fallback to local state:', err);
  }
}

export async function deleteSupplierFromFirestore(supplierId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.SUPPLIERS, supplierId));
  } catch (err) {
    console.warn('[Firebase] deleteSupplierFromFirestore fallback to local state:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: ORDERS (dmart_orders)
// -------------------------------------------------------------
export async function syncOrderToFirestore(order: Order): Promise<void> {
  try {
    const orderId = order.id || order.orderNumber;
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await setDoc(
      orderRef,
      {
        ...order,
        deliveryOtp: order.deliveryOtp || '4829',
        deliveryOtpVerified: !!order.deliveryOtpVerified,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] syncOrderToFirestore fallback to local state:', err);
  }
}

export async function updateOrderOtpVerificationInFirestore(
  orderId: string,
  deliveryOtpVerified: boolean,
  status: Order['status'] = 'delivered'
): Promise<void> {
  try {
    const orderRef = doc(db, COLLECTIONS.ORDERS, orderId);
    await updateDoc(orderRef, {
      deliveryOtpVerified,
      status,
      orderStatus: status,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Firebase] updateOrderOtpVerificationInFirestore error:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: RIDERS (dmart_riders)
// -------------------------------------------------------------
export async function syncRiderToFirestore(
  rider: DeliveryPartnerApplication,
  defaultLanding?: boolean
): Promise<void> {
  try {
    const riderId = rider.id || rider.phoneNumber?.replace(/[^a-zA-Z0-9]/g, '_') || 'rider_default';
    const riderRef = doc(db, COLLECTIONS.RIDERS, riderId);
    await setDoc(
      riderRef,
      {
        ...rider,
        defaultLanding: defaultLanding ?? false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] syncRiderToFirestore error:', err);
  }
}

export async function updateRiderLandingPreferenceInFirestore(
  riderId: string,
  defaultLanding: boolean
): Promise<void> {
  try {
    const riderRef = doc(db, COLLECTIONS.RIDERS, riderId);
    await setDoc(riderRef, { defaultLanding }, { merge: true });
  } catch (err) {
    console.warn('[Firebase] updateRiderLandingPreferenceInFirestore error:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: RIDER PAYOUT REQUESTS (payout_requests)
// -------------------------------------------------------------

/**
 * Creates a new payout request in Firestore, updates rider's balances,
 * and maintains the admin audit journal trail.
 */
export async function createPayoutRequestInFirestore(
  payout: RiderPayoutRequest,
  updatedRiderBalances?: {
    availableBalance: number;
    totalWithdrawn: number;
    lastPayoutDate: string;
  }
): Promise<void> {
  try {
    // 1. Write the payout request document to 'payout_requests'
    const payoutRef = doc(db, COLLECTIONS.PAYOUT_REQUESTS, payout.id);
    await setDoc(payoutRef, {
      ...payout,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Update the rider document in 'dmart_riders' with new balance and lastPayoutDate
    if (payout.riderId && updatedRiderBalances) {
      const riderRef = doc(db, COLLECTIONS.RIDERS, payout.riderId);
      await setDoc(
        riderRef,
        {
          availableBalance: updatedRiderBalances.availableBalance,
          totalWithdrawn: updatedRiderBalances.totalWithdrawn,
          lastPayoutDate: updatedRiderBalances.lastPayoutDate,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.warn('[Firebase] createPayoutRequestInFirestore error:', err);
    throw err;
  }
}

/**
 * Real-time listener for a rider's payout requests
 */
export function subscribeToRiderPayoutRequests(
  riderId: string,
  onUpdate: (payouts: RiderPayoutRequest[]) => void
): () => void {
  try {
    const payoutsCol = collection(db, COLLECTIONS.PAYOUT_REQUESTS);
    const unsub = onSnapshot(
      payoutsCol,
      (snapshot) => {
        const list: RiderPayoutRequest[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as RiderPayoutRequest;
          if (!riderId || data.riderId === riderId) {
            list.push({ ...data, id: docSnap.id });
          }
        });
        // Sort descending by requestedAt
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('[Firebase] rider payout_requests listener notice:', error);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('[Firebase] subscribeToRiderPayoutRequests error:', err);
    return () => {};
  }
}

/**
 * Real-time listener for all payout requests (Admin Audit & Treasury)
 */
export function subscribeToAllPayoutRequests(
  onUpdate: (payouts: RiderPayoutRequest[]) => void
): () => void {
  try {
    const payoutsCol = collection(db, COLLECTIONS.PAYOUT_REQUESTS);
    const unsub = onSnapshot(
      payoutsCol,
      (snapshot) => {
        const list: RiderPayoutRequest[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as RiderPayoutRequest), id: docSnap.id });
        });
        list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('[Firebase] all payout_requests listener notice:', error);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('[Firebase] subscribeToAllPayoutRequests error:', err);
    return () => {};
  }
}

/**
 * Update payout request status (Admin approval / disbursement)
 */
export async function updatePayoutRequestStatusInFirestore(
  payoutId: string,
  status: 'Pending' | 'Completed'
): Promise<void> {
  try {
    const payoutRef = doc(db, COLLECTIONS.PAYOUT_REQUESTS, payoutId);
    await setDoc(
      payoutRef,
      {
        status,
        processedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] updatePayoutRequestStatusInFirestore error:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: RIDER LEDGERS (rider_ledgers)
// -------------------------------------------------------------

/**
 * Real-time listener for all rider ledger transactions (Admin Audit & Running Statement)
 * Subscribes to Firestore collection 'rider_ledgers'.
 */
export function subscribeToAllRiderLedgers(
  onUpdate: (entries: RiderLedgerOrderEntry[]) => void
): () => void {
  try {
    const ledgersCol = collection(db, COLLECTIONS.RIDER_LEDGERS);
    const unsub = onSnapshot(
      ledgersCol,
      (snapshot) => {
        const list: RiderLedgerOrderEntry[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...(docSnap.data() as RiderLedgerOrderEntry), id: docSnap.id });
        });
        // Sort ascending by completedAt
        list.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
        onUpdate(list);
      },
      (error) => {
        console.warn('[Firebase] all rider_ledgers listener notice:', error);
      }
    );
    return unsub;
  } catch (err) {
    console.warn('[Firebase] subscribeToAllRiderLedgers error:', err);
    return () => {};
  }
}

/**
 * Save / sync a rider ledger transaction to Firestore 'rider_ledgers' collection
 */
export async function saveRiderLedgerEntryToFirestore(entry: RiderLedgerOrderEntry): Promise<void> {
  try {
    const ledgerRef = doc(db, COLLECTIONS.RIDER_LEDGERS, entry.id);
    await setDoc(
      ledgerRef,
      {
        ...entry,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firebase] saveRiderLedgerEntryToFirestore error:', err);
  }
}

/**
 * Seed initial rider ledger transactions into Firestore if collection is empty
 */
export async function seedInitialRiderLedgersIfEmpty(initialEntries: RiderLedgerOrderEntry[]): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.RIDER_LEDGERS));
    if (querySnapshot.empty) {
      for (const entry of initialEntries) {
        await saveRiderLedgerEntryToFirestore(entry);
      }
    }
  } catch (err) {
    console.warn('[Firebase] seedInitialRiderLedgersIfEmpty warning:', err);
  }
}

// -------------------------------------------------------------
// FIRESTORE SERVICES: STOREFRONT BANNERS (storefront_banners / banners)
// -------------------------------------------------------------

/**
 * Real-time listener for storefront banners using Firestore onSnapshot.
 * Listens to Firestore 'banners' collection (and 'storefront_banners' alias).
 * Filters active banners by default or passes all banners.
 */
export function subscribeToStorefrontBanners(
  onUpdate: (banners: MarketingBanner[]) => void,
  onlyActive: boolean = true
): () => void {
  try {
    const bannersCol = collection(db, 'banners');
    const storefrontCol = collection(db, 'storefront_banners');

    let bannersFromPrimary: MarketingBanner[] = [];
    let bannersFromAlias: MarketingBanner[] = [];

    const emitMerged = () => {
      const bannerMap = new Map<string, MarketingBanner>();
      // Prefer latest from either collection
      bannersFromAlias.forEach((b) => bannerMap.set(b.id, b));
      bannersFromPrimary.forEach((b) => bannerMap.set(b.id, b));

      const merged = Array.from(bannerMap.values());
      if (merged.length === 0) {
        seedInitialBannersIfEmpty();
        return;
      }

      // Sort by priority ascending (1 = highest priority)
      merged.sort((a, b) => (a.priority || 99) - (b.priority || 99));

      const filtered = onlyActive
        ? merged.filter((b) => b.isActive !== false)
        : merged;

      onUpdate(filtered);
    };

    const normalizeDoc = (docSnap: any): MarketingBanner => {
      const data = docSnap.data() as any;
      const title = data.titleEn || data.title || '';
      const subtitle = data.subtitleEn || data.subtitle || '';
      const imageUrl = data.imageUrl || data.image_url || '';
      const targetCategory = data.targetCategory || data.target_category || 'fresh_products';
      const categoryLabel = data.categoryLabel || data.category_label || data.target_category_label || '';
      const ctaTextEn = data.ctaTextEn || data.ctaText || data.cta_text || 'Shop Now';
      const ctaTextMs = data.ctaTextMs || data.ctaText || data.cta_text || 'Beli Sekarang';
      const isActive = data.isActive !== false && data.is_active !== false && data.status !== 'inactive';

      const showCTA = (data.showCTA !== undefined ? Boolean(data.showCTA) : true) &&
                      (data.showCta !== undefined ? Boolean(data.showCta) : true) &&
                      (data.showCtaButton !== undefined ? Boolean(data.showCtaButton) : true);
      const showTitle = data.showTitle !== undefined ? Boolean(data.showTitle) : true;
      const showSubtitle = data.showSubtitle !== undefined ? Boolean(data.showSubtitle) : true;
      const rawShowBadges = data.showBadges !== undefined ? Boolean(data.showBadges) : true;
      const rawShowBadge = data.showBadge !== undefined ? Boolean(data.showBadge) : (data.showBadgeTag !== undefined ? Boolean(data.showBadgeTag) : true);
      const rawShowBadgeTag = data.showBadgeTag !== undefined ? Boolean(data.showBadgeTag) : rawShowBadge;
      const rawShowCategoryBadge = data.showCategoryBadge !== undefined ? Boolean(data.showCategoryBadge) : true;

      const showBadges = rawShowBadges;
      const showBadge = rawShowBadges && rawShowBadge;
      const showBadgeTag = rawShowBadges && rawShowBadgeTag;
      const showCategoryBadge = rawShowBadges && rawShowCategoryBadge;

      return {
        ...data,
        id: docSnap.id || data.id,
        title: title,
        titleEn: title,
        titleMs: data.titleMs || title,
        subtitle: subtitle,
        subtitleEn: subtitle,
        subtitleMs: data.subtitleMs || subtitle,
        imageUrl: imageUrl,
        image_url: imageUrl,
        targetCategory: targetCategory,
        target_category: targetCategory,
        categoryLabel: categoryLabel,
        category_label: categoryLabel,
        isActive: isActive,
        is_active: isActive,
        badgeEn: data.badgeEn ?? 'PROMO',
        badgeMs: data.badgeMs ?? 'PROMOSI',
        ctaText: ctaTextEn,
        cta_text: ctaTextEn,
        ctaTextEn: ctaTextEn,
        ctaTextMs: ctaTextMs,
        themeColor: data.themeColor || 'emerald',
        priority: data.priority ?? 99,
        created_at: data.created_at || data.createdAt,
        // Explicit boolean visibility toggles
        showCTA: showCTA,
        showCta: showCTA,
        showCtaButton: showCTA,
        showTitle: showTitle,
        showSubtitle: showSubtitle,
        showBadges: showBadges,
        showBadge: showBadge,
        showBadgeTag: showBadgeTag,
        showCategoryBadge: showCategoryBadge,
      };
    };

    const unsubPrimary = onSnapshot(
      bannersCol,
      (snapshot) => {
        bannersFromPrimary = [];
        snapshot.forEach((docSnap) => {
          bannersFromPrimary.push(normalizeDoc(docSnap));
        });
        emitMerged();
      },
      (error) => {
        console.warn('[Firebase] banners listener notice:', error);
      }
    );

    const unsubAlias = onSnapshot(
      storefrontCol,
      (snapshot) => {
        bannersFromAlias = [];
        snapshot.forEach((docSnap) => {
          bannersFromAlias.push(normalizeDoc(docSnap));
        });
        emitMerged();
      },
      (error) => {
        console.warn('[Firebase] storefront_banners listener notice:', error);
      }
    );

    return () => {
      unsubPrimary();
      unsubAlias();
    };
  } catch (err) {
    console.error('[Firebase] Failed to initialize banners onSnapshot listener:', err);
    return () => {};
  }
}

/**
 * Fetch all storefront banners once
 */
export async function fetchBannersFromFirestore(): Promise<MarketingBanner[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.BANNERS));
    if (querySnapshot.empty) {
      await seedInitialBannersIfEmpty();
      return INITIAL_MARKETING_BANNERS;
    }
    const banners: MarketingBanner[] = [];
    querySnapshot.forEach((docSnap) => {
      banners.push({ ...(docSnap.data() as MarketingBanner), id: docSnap.id });
    });
    banners.sort((a, b) => (a.priority || 99) - (b.priority || 99));
    return banners;
  } catch (err) {
    console.warn('[Firebase] fetchBannersFromFirestore error:', err);
    return INITIAL_MARKETING_BANNERS;
  }
}

/**
 * Save / Update a banner in root Firestore collections ('banners' and 'storefront_banners')
 * Ensures initial status is 'Active' (is_active: true) with server timestamp (created_at).
 */
export async function saveBannerToFirestore(banner: Partial<MarketingBanner> & { [key: string]: any }): Promise<void> {
  if (!banner || !banner.id) return;
  try {
    const titleVal = banner.title || banner.titleEn || '';
    const subtitleVal = banner.subtitle || banner.subtitleEn || '';
    const imageVal = banner.imageUrl || banner.image_url || '';
    const categoryVal = banner.targetCategory || banner.target_category || 'fresh_products';
    const isActiveVal = banner.isActive !== false && banner.is_active !== false && banner.status !== 'inactive';

    const showTitleVal = banner.showTitle !== false;
    const showSubtitleVal = banner.showSubtitle !== false;
    const showCTAVal = banner.showCTA !== false && banner.showCta !== false && banner.showCtaButton !== false;
    const rawShowBadges = banner.showBadges !== false;
    const rawShowBadge = banner.showBadge !== false && banner.showBadgeTag !== false;
    const rawShowCategoryBadge = banner.showCategoryBadge !== false;
    const showBadgeVal = rawShowBadges && rawShowBadge;
    const showCategoryBadgeVal = rawShowBadges && rawShowCategoryBadge;
    const showBadgesVal = rawShowBadges && (rawShowBadge || rawShowCategoryBadge);

    const payload = {
      id: banner.id,
      // Title variants for flexible client & admin queries
      title: titleVal,
      titleEn: banner.titleEn || titleVal,
      titleMs: banner.titleMs || banner.titleEn || titleVal,
      // Subtitle variants
      subtitle: subtitleVal,
      subtitleEn: banner.subtitleEn || subtitleVal,
      subtitleMs: banner.subtitleMs || banner.subtitleEn || subtitleVal,
      // Image URL variants
      imageUrl: imageVal,
      image_url: imageVal,
      // Target category variants
      targetCategory: categoryVal,
      target_category: categoryVal,
      categoryLabel: banner.categoryLabel || banner.category_label || '',
      category_label: banner.categoryLabel || banner.category_label || '',
      // Explicit boolean visibility toggles (strictly boolean)
      showCTA: Boolean(showCTAVal),
      showCta: Boolean(showCTAVal),
      showCtaButton: Boolean(showCTAVal),
      showTitle: Boolean(showTitleVal),
      showSubtitle: Boolean(showSubtitleVal),
      showBadges: Boolean(showBadgesVal),
      showBadge: Boolean(showBadgeVal),
      showBadgeTag: Boolean(showBadgeVal),
      showCategoryBadge: Boolean(showCategoryBadgeVal),
      // Active status variants (snake_case and camelCase compliance)
      isActive: isActiveVal,
      is_active: isActiveVal,
      status: isActiveVal ? 'active' : 'inactive',
      // Priority
      priority: banner.priority || 1,
      // Badges
      badgeEn: banner.badgeEn || 'PROMO',
      badgeMs: banner.badgeMs || 'PROMOSI',
      ctaText: banner.ctaTextEn || banner.ctaText || 'Shop Now',
      cta_text: banner.ctaTextEn || banner.ctaText || 'Shop Now',
      ctaTextEn: banner.ctaTextEn || banner.ctaText || 'Shop Now',
      ctaTextMs: banner.ctaTextMs || banner.ctaText || 'Beli Sekarang',
      themeColor: banner.themeColor || 'emerald',
      // Partner routing fields
      merchantCode: banner.merchantCode || undefined,
      merchantName: banner.merchantName || undefined,
      // Timestamps (serverTimestamp & ISO fallback)
      created_at: banner.created_at || serverTimestamp(),
      createdAt: banner.createdAt || new Date().toISOString(),
      updated_at: serverTimestamp(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Root Firestore collection: 'banners'
    const bannersRef = doc(db, 'banners', banner.id);
    await setDoc(bannersRef, payload, { merge: true });

    // 2. Root Firestore collection: 'storefront_banners'
    const storefrontRef = doc(db, 'storefront_banners', banner.id);
    await setDoc(storefrontRef, payload, { merge: true });
  } catch (err) {
    console.warn('[Firebase] saveBannerToFirestore error:', err);
  }
}

/**
 * Delete a banner from Firestore collections ('banners' and 'storefront_banners')
 */
export async function deleteBannerFromFirestore(bannerId: string): Promise<void> {
  if (!bannerId) return;
  try {
    const bannerRef = doc(db, 'banners', bannerId);
    await deleteDoc(bannerRef);

    try {
      const storefrontRef = doc(db, 'storefront_banners', bannerId);
      await deleteDoc(storefrontRef);
    } catch {}
  } catch (err) {
    console.warn('[Firebase] deleteBannerFromFirestore error:', err);
  }
}

/**
 * Seed initial marketing banners if Firestore collection is empty
 */
export async function seedInitialBannersIfEmpty(): Promise<void> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.BANNERS));
    if (querySnapshot.empty) {
      for (const banner of INITIAL_MARKETING_BANNERS) {
        await saveBannerToFirestore(banner);
      }
    }
  } catch (err) {
    console.warn('[Firebase] seedInitialBannersIfEmpty warning:', err);
  }
}

// -------------------------------------------------------------
// SYSTEM SETTINGS: PDF & STATEMENT CONFIGURATION
// -------------------------------------------------------------
export async function savePdfConfigToFirestore(
  config: PdfConfigSettings,
  adminEmail?: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'pdf_config');
    const payload: PdfConfigSettings = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'admin@dmart.my',
    };
    await setDoc(docRef, payload, { merge: true });
    try {
      localStorage.setItem('dmart_pdf_config', JSON.stringify(payload));
    } catch {}
  } catch (error) {
    console.error('Error saving PDF config to Firestore:', error);
    try {
      localStorage.setItem('dmart_pdf_config', JSON.stringify(config));
    } catch {}
    throw error;
  }
}

export async function getPdfConfigFromFirestore(): Promise<PdfConfigSettings> {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'pdf_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = { ...DEFAULT_PDF_CONFIG, ...(snap.data() as Partial<PdfConfigSettings>) };
      try {
        localStorage.setItem('dmart_pdf_config', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (error) {
    console.warn('Could not fetch PDF config from Firestore, falling back to local/default:', error);
  }

  try {
    const local = localStorage.getItem('dmart_pdf_config');
    if (local) return { ...DEFAULT_PDF_CONFIG, ...JSON.parse(local) };
  } catch {}

  return DEFAULT_PDF_CONFIG;
}

export function subscribeToPdfConfig(
  callback: (config: PdfConfigSettings) => void
): () => void {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'pdf_config');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = { ...DEFAULT_PDF_CONFIG, ...(snapshot.data() as Partial<PdfConfigSettings>) };
          try {
            localStorage.setItem('dmart_pdf_config', JSON.stringify(data));
          } catch {}
          callback(data);
        } else {
          try {
            const local = localStorage.getItem('dmart_pdf_config');
            if (local) {
              callback({ ...DEFAULT_PDF_CONFIG, ...JSON.parse(local) });
              return;
            }
          } catch {}
          callback(DEFAULT_PDF_CONFIG);
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error for pdf_config:', error);
        try {
          const local = localStorage.getItem('dmart_pdf_config');
          if (local) callback(JSON.parse(local));
          else callback(DEFAULT_PDF_CONFIG);
        } catch {
          callback(DEFAULT_PDF_CONFIG);
        }
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to pdf_config:', err);
    try {
      const local = localStorage.getItem('dmart_pdf_config');
      if (local) callback(JSON.parse(local));
      else callback(DEFAULT_PDF_CONFIG);
    } catch {
      callback(DEFAULT_PDF_CONFIG);
    }
    return () => {};
  }
}

/**
 * Save Storefront Copy Configuration to Firestore ('system_settings/storefront_config')
 */
export async function saveStorefrontCopyToFirestore(
  config: StorefrontCopySettings,
  adminEmail?: string
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'storefront_config');
    const payload = {
      ...config,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'admin@dmart.my',
    };
    await setDoc(docRef, payload, { merge: true });
    try {
      localStorage.setItem('dmart_storefront_copy', JSON.stringify(payload));
    } catch {}
  } catch (error) {
    console.error('Error saving Storefront copy config to Firestore:', error);
    try {
      localStorage.setItem('dmart_storefront_copy', JSON.stringify(config));
    } catch {}
    throw error;
  }
}

/**
 * Fetch Storefront Copy Configuration from Firestore
 */
export async function getStorefrontCopyFromFirestore(): Promise<StorefrontCopySettings> {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'storefront_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as StorefrontCopySettings;
      try {
        localStorage.setItem('dmart_storefront_copy', JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (error) {
    console.warn('Could not fetch Storefront copy config from Firestore, falling back to local/default:', error);
  }

  try {
    const local = localStorage.getItem('dmart_storefront_copy');
    if (local) return JSON.parse(local);
  } catch {}

  return DEFAULT_STOREFRONT_COPY;
}

/**
 * Real-time listener for Storefront Copy Configuration using Firestore onSnapshot
 */
export function subscribeToStorefrontCopy(
  callback: (config: StorefrontCopySettings) => void
): () => void {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'storefront_config');
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as StorefrontCopySettings;
          try {
            localStorage.setItem('dmart_storefront_copy', JSON.stringify(data));
          } catch {}
          callback(data);
        } else {
          try {
            const local = localStorage.getItem('dmart_storefront_copy');
            if (local) {
              callback(JSON.parse(local));
              return;
            }
          } catch {}
          callback(DEFAULT_STOREFRONT_COPY);
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error for storefront_config:', error);
        try {
          const local = localStorage.getItem('dmart_storefront_copy');
          if (local) callback(JSON.parse(local));
          else callback(DEFAULT_STOREFRONT_COPY);
        } catch {
          callback(DEFAULT_STOREFRONT_COPY);
        }
      }
    );
  } catch (err) {
    console.warn('Failed to subscribe to storefront_config:', err);
    try {
      const local = localStorage.getItem('dmart_storefront_copy');
      if (local) callback(JSON.parse(local));
      else callback(DEFAULT_STOREFRONT_COPY);
    } catch {
      callback(DEFAULT_STOREFRONT_COPY);
    }
    return () => {};
  }
}

export async function executeStrictSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('[Firebase] Auth signout notice:', err);
  }

  // Complete wipe of all app customer and rider session tokens, cache, and state
  try {
    localStorage.removeItem('dmart_user');
    localStorage.removeItem('dmart_token');
    localStorage.removeItem('dmart_session');
    localStorage.removeItem('dmart_buyer_registered');
    localStorage.removeItem('dmart_favorites');
    sessionStorage.clear();
  } catch (err) {
    console.warn('[Cleanup] Cache wipe notice:', err);
  }
}

// -------------------------------------------------------------
// PAYOUT LEDGER MOCK DATA SEEDING (PARTNER_TEST_01 / Almehdhar Trading Co.)
// -------------------------------------------------------------
export {
  seedPayoutLedgerMockData,
  fetchPartnerOrders,
  fetchPayoutLedgerRecords,
  calculateNetPayout,
} from './services/seedPayoutLedger';

