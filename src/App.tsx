/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Sparkles,
  ShoppingBag,
  TrendingUp,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Bike,
  Search,
  Filter,
  ArrowUpDown,
  Tag,
  Store,
  PhoneCall,
  SlidersHorizontal,
  Apple,
  Carrot,
  Coffee,
  Fish,
  Dog,
  ArrowRight,
  PackageCheck,
  Navigation,
  Heart,
  Lock,
  Bell
} from 'lucide-react';
import {
  Language,
  MainCategory,
  SubCategory,
  Product,
  CartItem,
  UserProfile,
  DeliveryAddress,
  Order,
  CustomerFeedback,
  DeliveryPartnerApplication,
  DeliveryJobOrder,
  PromoConfig,
  SupportTicket,
  BusinessDocument,
  RiderPayout,
  ShippingSettings,
  StoreBankInfo,
  MarketingBanner,
  StorefrontCopySettings,
  DEFAULT_STOREFRONT_COPY,
  LoyaltyTransaction,
  GamificationBadge,
  OrderStatusNotification,
} from './types';
import { getStoredLoyaltyTransactions, saveLoyaltyTransactions } from './utils/loyaltyTransactions';
import { computeUserBadges } from './utils/gamificationBadges';
import { products, initialProducts, loadProducts, saveProducts, updateProductPrice, updateProductAvailability } from './data/products';
import { translations, mainCategoryConfig, MALAYSIAN_PRESET_LOCATIONS } from './data/translations';
import { AVAILABLE_VOUCHERS, defaultPromoConfig, loadPromoConfig, savePromoConfig } from './data/vouchers';
import { INITIAL_DELIVERY_ORDERS } from './data/deliveryOrders';
import { INITIAL_PAST_ORDERS } from './data/sampleOrders';
import {
  INITIAL_SAMPLE_APPLICATIONS,
  INITIAL_SUPPORT_TICKETS,
  INITIAL_BUSINESS_DOCUMENTS,
  INITIAL_RIDER_PAYOUTS,
  INITIAL_SHIPPING_SETTINGS,
  INITIAL_STORE_BANK_INFO,
  INITIAL_STORE_ORDERS,
} from './data/adminInitialData';
import { Navbar } from './components/Navbar';
import { SpecialVouchersTopBar } from './components/SpecialVouchersTopBar';
import { CategoryBar } from './components/CategoryBar';
import { ProductCard } from './components/ProductCard';
import { ProductGridSkeleton } from './components/ProductGridSkeleton';
import { FreshProductsDualWindows } from './components/FreshProductsDualWindows';
import { CartDrawer } from './components/CartDrawer';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { BuyerRegistrationModal } from './components/BuyerRegistrationModal';
import { DeliveryRegistrationModal } from './components/DeliveryRegistrationModal';
import { DeliveryApprovalStatusModal } from './components/DeliveryApprovalStatusModal';
import { DeliveryOrderDetailsModal } from './components/DeliveryOrderDetailsModal';
import { DeliveryMapPicker } from './components/DeliveryMapPicker';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { OrderHistoryView } from './components/OrderHistoryView';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { OrderStatusToastContainer } from './components/OrderStatusToastContainer';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { LiveDeliveryMapModal } from './components/LiveDeliveryMapModal';
import { SplashScreen } from './components/SplashScreen';
import { GeminiChatModal } from './components/GeminiChatModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ShareAppModal } from './components/ShareAppModal';
import { SideNavDrawer } from './components/SideNavDrawer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SlimOrderTrackingBar } from './components/SlimOrderTrackingBar';
import { AdminAuthModal } from './components/AdminAuthModal';
import { StorefrontBanners } from './components/StorefrontBanners';
import { LoyaltyPointsModal } from './components/LoyaltyPointsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { playNotificationChime } from './utils/audioChime';
import {
  setupFcmForegroundListener,
  triggerNativeBrowserNotification,
  getStoredNotifications,
  saveNotificationToHistory,
  clearStoredNotifications,
} from './services/fcmNotificationService';
import {
  testConnection,
  syncUserToFirestore,
  syncOrderToFirestore,
  updateOrderOtpVerificationInFirestore,
  subscribeToStorefrontBanners,
  subscribeToStorefrontCopy,
  subscribeToCatalogProducts,
  syncProductToFirestore,
  seedInitialProductsIfEmpty,
  executeStrictSignOut
} from './firebase_config';

export default function App() {
  // Language State (en / ms)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('dmart_lang');
    return (saved as Language) || 'en';
  });

  // User Authentication State (Google) - Guest-First by default
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('dmart_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Guest Browsing: start as guest (null) so user freely browses & adds to cart without forced sign-in
    return null;
  });

  // Delivery Address & Google Map State (Default: Kuala Lumpur, Malaysia)
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(() => {
    const saved = localStorage.getItem('dmart_address');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      recipientName: 'Al-Mehdhar',
      phone: '012-3849120',
      street: 'Jalan Kerinchi, Bangsar South',
      buildingUnit: 'Unit B-12-05, The Horizon',
      postcode: '59200',
      city: 'Kuala Lumpur',
      state: 'Wilayah Persekutuan Kuala Lumpur',
      notes: 'Sila serahkan di kaunter lobi / Leave at guardhouse',
      coordinates: { lat: 3.1116, lng: 101.6669 },
      formattedAddress: 'Unit B-12-05, The Horizon, Jalan Kerinchi, Bangsar South, 59200 Kuala Lumpur'
    };
  });

  // Dynamic Central Promo Configuration State (Pre-Firebase Firestore listener pattern)
  const [promoSettings, setPromoSettings] = useState<PromoConfig>(() => loadPromoConfig());

  // Dynamic Central Products Catalog State (Pre-Firebase Firestore collection pattern)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() => loadProducts());

  // Cart State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('dmart_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    // Initial starter groceries for instant supermarket satisfaction
    const initialPool = catalogProducts && catalogProducts.length > 16 ? catalogProducts : products;
    return [
      { product: initialPool[0], quantity: 1 }, // Cabbage
      { product: initialPool[6], quantity: 1 }, // Bananas
      { product: initialPool[11], quantity: 1 }, // Fresh Chicken
      { product: initialPool[16], quantity: 1 }, // Jasmine Rice
    ];
  });

  // Category, Search & Favorites Filtering
  const [selectedCategory, setSelectedCategory] = useState<MainCategory>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc'>('default');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Skeleton Loading & Perceived Performance States
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const isFirstRender = useRef(true);

  // Initial products fetch simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Filter/Sort/Search change skeleton indicator to improve perceived performance
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedSubCategory, searchQuery, sortBy, showOnlyFavorites]);

  const isProductsLoading = isInitialLoading || isFiltering;

  // Favorites state (persisted in localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('dmart_favorites');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['prod-1', 'prod-7', 'prod-12']; // default favorites (cabbage, banana, chicken)
      }
    }
    return ['prod-1', 'prod-7', 'prod-12'];
  });

  const handleToggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(productId);
      const next = isFav ? prev.filter((id) => id !== productId) : [...prev, productId];
      return next;
    });
  };

  // Voucher state
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [activeVoucherCode, setActiveVoucherCode] = useState('');

  // Modals visibility
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isLiveMapOpen, setIsLiveMapOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isShareAppOpen, setIsShareAppOpen] = useState(false);
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);

  // Loyalty Points State (Default 150 points for demo & active shopping, persisted in localStorage)
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(() => {
    const saved = localStorage.getItem('dmart_loyalty_points');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return user?.loyaltyPoints ?? 150;
  });

  // Transient '+ points' animation notification for header loyalty badge
  const [pointsNotification, setPointsNotification] = useState<{ id: number; points: number } | null>(null);

  // Loyalty Point Transactions History (Earned/Spent/Bonus, persisted in localStorage)
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(() => {
    return getStoredLoyaltyTransactions();
  });

  // Current active tab when opening Loyalty Points Modal: 'tiers' | 'history' | 'badges'
  const [loyaltyModalTab, setLoyaltyModalTab] = useState<'tiers' | 'history' | 'badges'>('tiers');

  useEffect(() => {
    saveLoyaltyTransactions(loyaltyTransactions);
  }, [loyaltyTransactions]);

  const handleOpenLoyaltyModal = (tab: 'tiers' | 'history' | 'badges' = 'tiers') => {
    setLoyaltyModalTab(tab);
    setIsLoyaltyModalOpen(true);
  };

  // Buyer & Delivery Partner Registration Modals
  const [isBuyerRegistrationOpen, setIsBuyerRegistrationOpen] = useState(false);
  const [isDeliveryRegistrationOpen, setIsDeliveryRegistrationOpen] = useState(false);
  const [isDeliveryApprovalStatusOpen, setIsDeliveryApprovalStatusOpen] = useState(false);
  const [isRiderAuthPrompt, setIsRiderAuthPrompt] = useState(false);
  const [storefrontBanners, setStorefrontBanners] = useState<MarketingBanner[]>([]);
  const [storefrontCopy, setStorefrontCopy] = useState<StorefrontCopySettings>(() => {
    try {
      const saved = localStorage.getItem('dmart_storefront_copy');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STOREFRONT_COPY;
  });

  // Track whether buyer registration has been completed on first ordering
  const [hasRegisteredBuyer, setHasRegisteredBuyer] = useState<boolean>(() => {
    return localStorage.getItem('dmart_buyer_registered') === 'true';
  });

  // Delivery Partner Application state (persisted)
  const [deliveryApplication, setDeliveryApplication] = useState<DeliveryPartnerApplication | null>(() => {
    const saved = localStorage.getItem('dmart_rider_app');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Active / Submitted Order State (null by default if no active order exists)
  const [activeOrder, setActiveOrder] = useState<Order | null>(() => {
    const saved = localStorage.getItem('dmart_active_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const s = (parsed?.status || '').toLowerCase();
        const isActive =
          (s === 'out_for_delivery' ||
            s === 'preparing' ||
            s === 'packing' ||
            s === 'submitted' ||
            s === 'received' ||
            s === 'picked_up' ||
            s === 'accepted') &&
          s !== 'delivered' &&
          s !== 'completed' &&
          s !== 'cancelled';
        if (parsed && parsed.id !== 'ord-active-live' && isActive) {
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return null;
  });

  // Customer Past Completed Orders History State
  const [orderHistory, setOrderHistory] = useState<Order[]>(() => {
    const saved = localStorage.getItem('dmart_order_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_PAST_ORDERS;
      }
    }
    return INITIAL_PAST_ORDERS;
  });

  // Gamification achievement badges computed dynamically from orders and points
  const userBadges = useMemo(() => {
    return computeUserBadges(orderHistory, loyaltyPoints, user);
  }, [orderHistory, loyaltyPoints, user]);

  // Determine if the current logged-in user (or active session) has an active order
  const userActiveOrder = useMemo(() => {
    const isActiveStatus = (status?: string) => {
      if (!status) return false;
      const s = status.toLowerCase();
      return (
        s === 'out_for_delivery' ||
        s === 'preparing' ||
        s === 'packing' ||
        s === 'submitted' ||
        s === 'received' ||
        s === 'picked_up' ||
        s === 'accepted'
      );
    };

    if (activeOrder && isActiveStatus(activeOrder.status)) {
      if (user) {
        const matchesUser =
          !activeOrder.deliveryAddress?.recipientName ||
          activeOrder.deliveryAddress.recipientName === user.name ||
          (user.phone && activeOrder.deliveryAddress?.phone === user.phone) ||
          (user.email && (activeOrder as any).customerEmail === user.email);
        return matchesUser ? activeOrder : null;
      }
      return activeOrder;
    }

    if (user) {
      const activeInHistory = orderHistory.find(
        (o) =>
          isActiveStatus(o.status) &&
          ((user.phone && o.deliveryAddress?.phone === user.phone) ||
            (user.email && (o as any).customerEmail === user.email) ||
            o.deliveryAddress?.recipientName === user.name)
      );
      if (activeInHistory) return activeInHistory;
    }

    return null;
  }, [activeOrder, user, orderHistory]);

  // Current Main View: 'shop', 'order_history', or 'admin'
  const [currentView, setCurrentView] = useState<'shop' | 'order_history' | 'admin'>('shop');

  // Admin Module Datasets & State Management
  const [adminApplications, setAdminApplications] = useState<DeliveryPartnerApplication[]>(() => {
    const saved = localStorage.getItem('dmart_admin_apps');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_SAMPLE_APPLICATIONS;
  });

  const [adminTickets, setAdminTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('dmart_admin_tickets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_SUPPORT_TICKETS;
  });

  const [adminDocuments, setAdminDocuments] = useState<BusinessDocument[]>(() => {
    return INITIAL_BUSINESS_DOCUMENTS;
  });

  const [adminPayouts, setAdminPayouts] = useState<RiderPayout[]>(() => {
    const saved = localStorage.getItem('dmart_admin_payouts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_RIDER_PAYOUTS;
  });

  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(() => {
    const saved = localStorage.getItem('dmart_shipping_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_SHIPPING_SETTINGS;
  });

  const [storeBankInfo, setStoreBankInfo] = useState<StoreBankInfo>(() => {
    const saved = localStorage.getItem('dmart_store_bank');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_STORE_BANK_INFO;
  });

  const [storeOrders, setStoreOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('dmart_all_store_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_STORE_ORDERS;
  });

  // Selected Order for Tracking Modal
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(activeOrder);

  // Delivery Orders List for Approved Delivery Partners / Drivers
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryJobOrder[]>(() => {
    const saved = localStorage.getItem('dmart_delivery_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_DELIVERY_ORDERS;
      }
    }
    return INITIAL_DELIVERY_ORDERS;
  });

  // Selected Order for the Details Order Page
  const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState<DeliveryJobOrder | null>(null);
  const [isDeliveryOrderDetailsOpen, setIsDeliveryOrderDetailsOpen] = useState(false);

  // Real-time Push Notifications & In-App Toast Alerts state (Firebase Cloud Messaging)
  const [orderNotifications, setOrderNotifications] = useState<OrderStatusNotification[]>(() => {
    return getStoredNotifications();
  });
  const [activeToasts, setActiveToasts] = useState<OrderStatusNotification[]>([]);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('dmart_sound_enabled') !== 'false';
  });
  const previousStatusRef = useRef<Record<string, Order['status']>>({});

  // Direct Order Receipt Modal state
  const [receiptModalOrder, setReceiptModalOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Translations helper
  const t = translations[language];

  // Trigger order status transition alert
  const triggerOrderTransitionAlert = useCallback(
    (order: Order, previousStatus?: Order['status'], newStatus?: Order['status']) => {
      const status = newStatus || order.status;
      const orderNumber = order.orderNumber || order.id;

      let titleEn = 'Order Status Updated';
      let titleMs = 'Status Pesanan Dikemaskini';
      let bodyEn = `Order #${orderNumber} is now ${status.replace(/_/g, ' ')}.`;
      let bodyMs = `Pesanan #${orderNumber} kini berstatus ${status.replace(/_/g, ' ')}.`;
      let sound: 'bell_chime' | 'bicycle_bell' | 'cash_register' | 'digital_ping' = 'digital_ping';
      let type: OrderStatusNotification['type'] = 'info';
      let eta: string | undefined = undefined;

      if (status === 'packing' || status === 'preparing') {
        type = 'preparing';
        titleEn = 'Order Preparing / Packing 📦';
        titleMs = 'Pesanan Sedang Disediakan 📦';
        bodyEn = `Order #${orderNumber} is being packed with fresh grocery items at our fulfillment store.`;
        bodyMs = `Pesanan #${orderNumber} sedang dibungkus dengan barangan segar di pusat penyediaan kami.`;
        sound = 'bell_chime';
      } else if (status === 'out_for_delivery' || status === 'picked_up') {
        type = 'out_for_delivery';
        titleEn = 'Rider Out For Delivery! 🛵';
        titleMs = 'Rider Sedang Menghantar! 🛵';
        bodyEn = `Order #${orderNumber} has been dispatched with our rider and is on the way!`;
        bodyMs = `Pesanan #${orderNumber} telah dihantar bersama rider kami dan dalam perjalanan!`;
        sound = 'bicycle_bell';
        eta = '~15 - 20 mins';
      } else if (status === 'delivered') {
        type = 'delivered';
        titleEn = 'Order Delivered Successfully! ✅';
        titleMs = 'Pesanan Selamat Dihantar! ✅';
        bodyEn = `Order #${orderNumber} has arrived at your address. Enjoy your fresh groceries!`;
        bodyMs = `Pesanan #${orderNumber} telah selamat tiba di alamat anda. Selamat menikmati barangan segar anda!`;
        sound = 'cash_register';
      }

      const notif: OrderStatusNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        orderId: order.id,
        orderNumber,
        previousStatus,
        newStatus: status,
        titleEn,
        titleMs,
        bodyEn,
        bodyMs,
        timestamp: new Date().toISOString(),
        sound,
        type,
        eta,
      };

      // 1. Play audio chime if sound is enabled
      if (notificationSoundEnabled) {
        playNotificationChime(sound);
      }

      // 2. Trigger native OS / browser notification if permitted
      const alertTitle = language === 'en' ? titleEn : titleMs;
      const alertBody = language === 'en' ? bodyEn : bodyMs;
      triggerNativeBrowserNotification(alertTitle, alertBody, orderNumber);

      // 3. Trigger In-App floating toast
      setActiveToasts((prev) => [notif, ...prev.slice(0, 2)]);

      // 4. Save to notification log
      setOrderNotifications((prev) => {
        const updated = saveNotificationToHistory(notif);
        return updated.length > 0 ? updated : [notif, ...prev];
      });
    },
    [language, notificationSoundEnabled]
  );

  // Real-time FCM message listener
  useEffect(() => {
    let cleanup: (() => void) | null = null;
    setupFcmForegroundListener((payload) => {
      const orderNum = payload.data?.orderNumber || activeOrder?.orderNumber || 'DM-ORDER';
      const status = (payload.data?.status || 'packing') as Order['status'];
      const dummyOrder = (activeOrder && activeOrder.orderNumber === orderNum ? activeOrder : {
        id: orderNum,
        orderNumber: orderNum,
        status,
      }) as Order;
      triggerOrderTransitionAlert(dummyOrder, undefined, status);
    }).then((unsub) => {
      cleanup = unsub;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [activeOrder, triggerOrderTransitionAlert]);

  // Track activeOrder transitions in real-time
  useEffect(() => {
    if (!activeOrder) return;
    const orderKey = activeOrder.id || activeOrder.orderNumber;
    const prev = previousStatusRef.current[orderKey];
    const curr = activeOrder.status;

    if (prev && prev !== curr) {
      triggerOrderTransitionAlert(activeOrder, prev, curr);
    }
    previousStatusRef.current[orderKey] = curr;
  }, [activeOrder, triggerOrderTransitionAlert]);

  // Sound preference persistence
  useEffect(() => {
    localStorage.setItem('dmart_sound_enabled', notificationSoundEnabled.toString());
  }, [notificationSoundEnabled]);

  const handleSimulateTransition = (simulatedStatus: 'packing' | 'out_for_delivery' | 'delivered') => {
    const target = activeOrder || INITIAL_PAST_ORDERS[0];
    if (target) {
      const updatedOrder = {
        ...target,
        status: simulatedStatus,
        orderStatus: simulatedStatus,
      };
      if (activeOrder) {
        setActiveOrder(updatedOrder);
        setTrackingOrder(updatedOrder);
        localStorage.setItem('dmart_active_order', JSON.stringify(updatedOrder));
      }
      triggerOrderTransitionAlert(updatedOrder, target.status, simulatedStatus);
    }
  };

  const handleOpenReceiptForOrder = (orderNumber: string) => {
    const found = [activeOrder, ...orderHistory, ...storeOrders].find(
      (o) => o && (o.orderNumber === orderNumber || o.id === orderNumber)
    );
    if (found) {
      setReceiptModalOrder(found);
      setIsReceiptModalOpen(true);
    } else if (activeOrder) {
      setReceiptModalOrder(activeOrder);
      setIsReceiptModalOpen(true);
    }
  };

  const handleTrackOrderFromAlert = (orderNumber: string) => {
    const found = [activeOrder, ...orderHistory, ...storeOrders].find(
      (o) => o && (o.orderNumber === orderNumber || o.id === orderNumber)
    );
    if (found) {
      setTrackingOrder(found);
    }
    setIsTrackingOpen(true);
  };

  // Connection test to Firestore database & rider default landing check on startup
  useEffect(() => {
    testConnection();
    try {
      const isRiderDefault = localStorage.getItem('dmart_rider_default_landing') === 'true';
      const riderSaved = localStorage.getItem('dmart_rider_app');
      if (isRiderDefault && riderSaved) {
        const parsed = JSON.parse(riderSaved);
        if (parsed.status === 'approved') {
          setIsDeliveryApprovalStatusOpen(true);
        }
      }
    } catch {}
  }, []);

  // Real-time listener for storefront banners using Firestore onSnapshot
  useEffect(() => {
    const unsubscribe = subscribeToStorefrontBanners((liveBanners) => {
      const activeBanners = liveBanners.filter((b) => b.isActive !== false);
      setStorefrontBanners(activeBanners);
    }, true);

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time listener for storefront copy (announcement bar, badge, footer) using Firestore onSnapshot
  useEffect(() => {
    const unsubscribe = subscribeToStorefrontCopy((cloudConfig) => {
      if (cloudConfig) {
        setStorefrontCopy(cloudConfig);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Real-time catalog products synchronization with Firestore
  useEffect(() => {
    // Seed initial product catalog to Firestore if collection is empty
    seedInitialProductsIfEmpty(initialProducts);

    const unsubscribe = subscribeToCatalogProducts((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setCatalogProducts(liveProducts);
        saveProducts(liveProducts);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync user profile changes to Firestore
  useEffect(() => {
    if (user && user.isLoggedIn) {
      syncUserToFirestore(user, deliveryAddress);
    }
  }, [user, deliveryAddress]);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('dmart_lang', language);
  }, [language]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('dmart_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('dmart_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('dmart_address', JSON.stringify(deliveryAddress));
  }, [deliveryAddress]);

  useEffect(() => {
    localStorage.setItem('dmart_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('dmart_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (activeOrder) {
      localStorage.setItem('dmart_active_order', JSON.stringify(activeOrder));
    }
  }, [activeOrder]);

  useEffect(() => {
    localStorage.setItem('dmart_order_history', JSON.stringify(orderHistory));
  }, [orderHistory]);

  useEffect(() => {
    localStorage.setItem('dmart_admin_apps', JSON.stringify(adminApplications));
  }, [adminApplications]);

  useEffect(() => {
    localStorage.setItem('dmart_admin_tickets', JSON.stringify(adminTickets));
  }, [adminTickets]);

  useEffect(() => {
    localStorage.setItem('dmart_admin_payouts', JSON.stringify(adminPayouts));
  }, [adminPayouts]);

  useEffect(() => {
    localStorage.setItem('dmart_shipping_settings', JSON.stringify(shippingSettings));
  }, [shippingSettings]);

  useEffect(() => {
    localStorage.setItem('dmart_store_bank', JSON.stringify(storeBankInfo));
  }, [storeBankInfo]);

  useEffect(() => {
    localStorage.setItem('dmart_all_store_orders', JSON.stringify(storeOrders));
  }, [storeOrders]);

  // Admin Module Callback Handlers
  const handleUpdateApplicationStatus = (appId: string, status: DeliveryPartnerApplication['status']) => {
    setAdminApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status } : app))
    );
    if (deliveryApplication && (deliveryApplication.id === appId || deliveryApplication.idNumber === appId)) {
      const updated: DeliveryPartnerApplication = { ...deliveryApplication, status };
      setDeliveryApplication(updated);
      localStorage.setItem('dmart_rider_app', JSON.stringify(updated));
    }
  };

  const handleUpdateCatalogProducts = (updatedProducts: Product[]) => {
    setCatalogProducts(updatedProducts);
    saveProducts(updatedProducts);
    // Real-time synchronization to Firestore
    updatedProducts.forEach((p) => {
      syncProductToFirestore(p);
    });
  };

  const handleUpdatePromoSettings = (updatedConfig: PromoConfig) => {
    setPromoSettings(updatedConfig);
    savePromoConfig(updatedConfig);
  };

  const handleUpdateShippingSettings = (updatedSettings: ShippingSettings) => {
    setShippingSettings(updatedSettings);
  };

  const handleUpdateStoreBankInfo = (updatedBank: StoreBankInfo) => {
    setStoreBankInfo(updatedBank);
  };

  const handleUpdatePayoutStatus = (payoutId: string, status: RiderPayout['status']) => {
    setAdminPayouts((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? { ...p, status, paidAt: status === 'paid' ? new Date().toISOString() : p.paidAt }
          : p
      )
    );
  };

  const handleUpdateAdminTicket = (ticketId: string, updates: Partial<SupportTicket>) => {
    setAdminTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, ...updates } : t))
    );
  };

  const handleUpdateStoreOrderStatus = (orderId: string, status: Order['status']) => {
    const targetOrder = storeOrders.find((ord) => ord.id === orderId) || (activeOrder?.id === orderId ? activeOrder : null);
    if (targetOrder && targetOrder.status !== status) {
      triggerOrderTransitionAlert(targetOrder, targetOrder.status, status);
    }
    setStoreOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status, orderStatus: status } : ord))
    );
    if (activeOrder && activeOrder.id === orderId) {
      const updated = { ...activeOrder, status, orderStatus: status };
      setActiveOrder(updated);
      localStorage.setItem('dmart_active_order', JSON.stringify(updated));
    }
    setOrderHistory((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status, orderStatus: status } : ord))
    );
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // Delivery fee waived on orders >= RM60 or when FREEDEL voucher is active
  const deliveryFee = useMemo(() => {
    if (subtotal === 0) return 0;
    if (subtotal >= 60) return 0;
    if (activeVoucherCode === 'FREEDEL') return 0;
    return 5.0;
  }, [subtotal, activeVoucherCode]);

  // Recalculate voucher discount dynamically based on active voucher and cart contents
  useEffect(() => {
    if (!activeVoucherCode) {
      setVoucherDiscount(0);
      return;
    }
    const voucher = promoSettings.specialVouchers.find((v) => v.code === activeVoucherCode);
    if (!voucher) {
      setVoucherDiscount(0);
      return;
    }

    if (voucher.discountType === 'fixed') {
      setVoucherDiscount(voucher.discountValue);
    } else if (voucher.discountType === 'percent') {
      const freshSubtotal = cart
        .filter((item) => item.product.mainCategory === 'fresh_products')
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      const calculated = freshSubtotal > 0
        ? Math.round(freshSubtotal * 0.15 * 100) / 100
        : Math.round(subtotal * 0.15 * 100) / 100;
      setVoucherDiscount(Math.max(calculated, 4.0));
    } else if (voucher.discountType === 'free_delivery') {
      // Free delivery provides RM5 shipping waiver
      setVoucherDiscount(0);
    }
  }, [activeVoucherCode, cart, subtotal]);

  const total = Math.max(0, subtotal - voucherDiscount + deliveryFee);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Fast Cart Quantity Map for O(1) lookups
  const cartMap = useMemo(() => {
    const map: { [productId: string]: number } = {};
    for (const item of cart) {
      map[item.product.id] = item.quantity;
    }
    return map;
  }, [cart]);

  // Cart Actions
  const handleAddToCart = (product: Product) => {
    // Trigger subtle '+ points' CSS animation on loyalty badge in header
    const earned = product.pointsReward ?? Math.max(1, Math.round(product.price));
    setPointsNotification({ id: Date.now(), points: earned });

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (existing && quantity > existing.quantity) {
        const earned = existing.product.pointsReward ?? Math.max(1, Math.round(existing.product.price));
        setPointsNotification({ id: Date.now(), points: earned });
      }

      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setVoucherDiscount(0);
    setActiveVoucherCode('');
  };

  const handleApplyVoucher = (code: string): { success: boolean; message: string } => {
    const cleanCode = code.trim().toUpperCase();
    const found = promoSettings.specialVouchers.find((v) => v.code === cleanCode);

    if (!found) {
      return {
        success: false,
        message:
          language === 'en'
            ? `Invalid voucher code "${code}". Try DMART10, FREEDEL, SEGAR15, or JIMAT5.`
            : `Kod baucar "${code}" tidak sah. Cuba DMART10, FREEDEL, SEGAR15, atau JIMAT5.`
      };
    }

    setActiveVoucherCode(found.code);

    let calculatedDiscount = 0;
    if (found.discountType === 'fixed') {
      calculatedDiscount = found.discountValue;
    } else if (found.discountType === 'percent') {
      const freshSubtotal = cart
        .filter((item) => item.product.mainCategory === 'fresh_products')
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      calculatedDiscount = freshSubtotal > 0
        ? Math.round(freshSubtotal * 0.15 * 100) / 100
        : Math.round(subtotal * 0.15 * 100) / 100;
      if (calculatedDiscount === 0) calculatedDiscount = 4.0;
    } else if (found.discountType === 'free_delivery') {
      calculatedDiscount = 5.0;
    }

    setVoucherDiscount(calculatedDiscount);

    return {
      success: true,
      message:
        language === 'en'
          ? `🎉 Voucher ${found.code} applied! Saving RM ${calculatedDiscount.toFixed(2)} on your order.`
          : `🎉 Baucar ${found.code} digunakan! Anda jimat RM ${calculatedDiscount.toFixed(2)} untuk pesanan ini.`
    };
  };

  // Filtered Products for Standard Views
  const filteredProducts = useMemo(() => {
    let list = catalogProducts.filter((p) => {
      // If user toggled Favorites filter mode, filter to only favorite items
      if (showOnlyFavorites) {
        if (!favorites.includes(p.id)) {
          return false;
        }
      }

      // Main category check
      let matchesCategory = false;
      if (selectedCategory === 'all' || showOnlyFavorites) {
        matchesCategory = true;
      } else if (selectedCategory === 'daily_groceries') {
        matchesCategory =
          p.mainCategory === 'daily_groceries' ||
          p.secondaryCategories?.includes('daily_groceries') === true;
      } else {
        matchesCategory = p.mainCategory === selectedCategory;
      }

      // Sub-category check
      let matchesSubCategory = true;
      if (selectedSubCategory !== 'all' && selectedSubCategory !== 'side_by_side' && !showOnlyFavorites) {
        matchesSubCategory = p.subCategory === selectedSubCategory;
      }

      // Search query check
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.nameEn.toLowerCase().includes(q) ||
        p.nameMs.toLowerCase().includes(q) ||
        p.descriptionEn.toLowerCase().includes(q) ||
        p.descriptionMs.toLowerCase().includes(q) ||
        p.amountEn.toLowerCase().includes(q) ||
        p.amountMs.toLowerCase().includes(q);

      return matchesCategory && matchesSubCategory && matchesSearch;
    });

    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    }
    return list;
  }, [selectedCategory, selectedSubCategory, searchQuery, sortBy, showOnlyFavorites, favorites, catalogProducts]);

  // Handle Order Success
  const handleOrderSuccess = (newOrder: Order) => {
    setActiveOrder(newOrder);
    setTrackingOrder(newOrder);
    setOrderHistory((prev) => [newOrder, ...prev]);
    setStoreOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setVoucherDiscount(0);
    setActiveVoucherCode('');
    setIsCheckoutOpen(false);
    setIsTrackingOpen(true);

    // Direct Sync Customer Order to Firestore
    syncOrderToFirestore(newOrder);

    // Update loyalty points balance on redemption and earning
    if (newOrder.pointsRedeemed || newOrder.pointsEarned) {
      const redeemed = newOrder.pointsRedeemed || 0;
      const earned = newOrder.pointsEarned || 0;
      setLoyaltyPoints((prev) => {
        const next = Math.max(0, prev - redeemed + earned);
        localStorage.setItem('dmart_loyalty_points', next.toString());
        return next;
      });

      // Record transaction history entries for points spent and points earned
      const newTxs: LoyaltyTransaction[] = [];
      let running = loyaltyPoints;
      if (redeemed > 0) {
        running = Math.max(0, running - redeemed);
        newTxs.push({
          id: 'tx-' + Date.now() + '-spent',
          type: 'spent',
          amount: -redeemed,
          titleEn: 'Points Redeemed at Checkout',
          titleMs: 'Mata Ditebus Semasa Pembayaran',
          orderReference: newOrder.orderNumber,
          date: new Date().toISOString(),
          notesEn: `Instant cart discount applied (-RM ${(redeemed * 0.01).toFixed(2)})`,
          notesMs: `Potongan diskaun segera bakul (-RM ${(redeemed * 0.01).toFixed(2)})`,
          balanceAfter: running,
        });
      }

      if (earned > 0) {
        running += earned;
        newTxs.push({
          id: 'tx-' + Date.now() + '-earned',
          type: 'earned',
          amount: earned,
          titleEn: 'Order Cashback Points',
          titleMs: 'Mata Ganjaran Pesanan',
          orderReference: newOrder.orderNumber,
          date: new Date().toISOString(),
          notesEn: `Cashback earned on grocery order #${newOrder.orderNumber}`,
          notesMs: `Ganjaran mata atas belian barangan runcit #${newOrder.orderNumber}`,
          balanceAfter: running,
        });
      }

      if (newTxs.length > 0) {
        setLoyaltyTransactions((prev) => [...newTxs, ...prev]);
      }
    }

    // Also dispatch this new customer grocery order to delivery partners list
    const newDeliveryJob: DeliveryJobOrder = {
      id: 'del-job-' + Date.now(),
      orderNumber: newOrder.orderNumber,
      customerName: user?.name || 'Valued Customer',
      customerPhone: user?.phone || '012-3456789',
      deliveryAddress: `${newOrder.deliveryAddress.buildingUnit ? newOrder.deliveryAddress.buildingUnit + ', ' : ''}${newOrder.deliveryAddress.street}`,
      city: newOrder.deliveryAddress.city,
      postcode: newOrder.deliveryAddress.postcode,
      dropoffNotes: newOrder.deliveryAddress.notes || 'Leave at door / front gate.',
      distanceKm: 2.8,
      estimatedTimeMin: 16,
      earningsPayout: Math.max(8.00, Number((newOrder.deliveryFee * 1.5 + 4).toFixed(2))),
      itemsCount: newOrder.items.reduce((s, i) => s + i.quantity, 0),
      itemsSummary: newOrder.items.slice(0, 3).map((i) => i.product.nameEn).join(', ') + (newOrder.items.length > 3 ? '...' : ''),
      itemsList: newOrder.items.map((i) => ({
        name: i.product.nameEn,
        quantity: i.quantity,
        unit: i.product.amountEn,
        price: i.product.price,
      })),
      orderTotal: newOrder.total,
      paymentMethod: (newOrder.paymentMethod.toLowerCase() === 'cod' ? 'cod' : newOrder.paymentMethod.toLowerCase() === 'tng' ? 'tng' : 'fpx'),
      codAmountToCollect: newOrder.paymentMethod.toUpperCase() === 'COD' ? newOrder.total : 0,
      pickupHub: 'D-mart Supermarket - Mid Valley Hub',
      pickupAddress: 'LG Floor, Mid Valley Megamall, Lingkaran Syed Putra, KL',
      deliverySlot: newOrder.deliverySlot,
      status: 'available',
      urgency: 'express',
      deliveryOtp: newOrder.deliveryOtp,
      deliveryOtpVerified: false,
      coordinates: newOrder.deliveryAddress.coordinates,
    };
    setDeliveryOrders((prev) => {
      const updated = [newDeliveryJob, ...prev];
      localStorage.setItem('dmart_delivery_orders', JSON.stringify(updated));
      return updated;
    });
  };

  // Complete Buyer Registration on First-Time Ordering
  const handleCompleteBuyerRegistration = (updatedUser: UserProfile, updatedAddress: DeliveryAddress) => {
    setUser(updatedUser);
    setDeliveryAddress(updatedAddress);
    setHasRegisteredBuyer(true);
    localStorage.setItem('dmart_user', JSON.stringify(updatedUser));
    localStorage.setItem('dmart_address', JSON.stringify(updatedAddress));
    localStorage.setItem('dmart_buyer_registered', 'true');
    setIsBuyerRegistrationOpen(false);
    setIsCheckoutOpen(true);
  };

  // Submit Delivery Partner Application
  const handleDeliverySubmitSuccess = (app: DeliveryPartnerApplication) => {
    setDeliveryApplication(app);
    localStorage.setItem('dmart_rider_app', JSON.stringify(app));
    setAdminApplications((prev) => [app, ...prev.filter((a) => a.id !== app.id)]);
    setIsDeliveryRegistrationOpen(false);
    setIsDeliveryApprovalStatusOpen(true);
  };

  // Delivery Partner Actions
  const handleAcceptDeliveryOrder = (order: DeliveryJobOrder) => {
    const updated = deliveryOrders.map((o) =>
      o.id === order.id ? { ...o, status: 'accepted' as const } : o
    );
    setDeliveryOrders(updated);
    localStorage.setItem('dmart_delivery_orders', JSON.stringify(updated));
    setSelectedDeliveryOrder({ ...order, status: 'accepted' });
    setIsDeliveryApprovalStatusOpen(false);
    setIsDeliveryOrderDetailsOpen(true);
  };

  const handleViewDeliveryOrderDetails = (order: DeliveryJobOrder) => {
    setSelectedDeliveryOrder(order);
    setIsDeliveryApprovalStatusOpen(false);
    setIsDeliveryOrderDetailsOpen(true);
  };

  const handleUpdateDeliveryOrderStatus = (orderId: string, newStatus: DeliveryJobOrder['status']) => {
    const targetOrder = deliveryOrders.find((o) => o.id === orderId);
    const updated = deliveryOrders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          deliveryOtpVerified: newStatus === 'delivered' ? true : o.deliveryOtpVerified,
          codAmountToCollect: newStatus === 'delivered' ? 0 : o.codAmountToCollect,
        };
      }
      return o;
    });
    setDeliveryOrders(updated);
    localStorage.setItem('dmart_delivery_orders', JSON.stringify(updated));
    if (selectedDeliveryOrder && selectedDeliveryOrder.id === orderId) {
      setSelectedDeliveryOrder({
        ...selectedDeliveryOrder,
        status: newStatus,
        deliveryOtpVerified: newStatus === 'delivered' ? true : selectedDeliveryOrder.deliveryOtpVerified,
        codAmountToCollect: newStatus === 'delivered' ? 0 : selectedDeliveryOrder.codAmountToCollect,
      });
    }

    // When order is marked as delivered, synchronize customer active order & orderHistory state
    if (newStatus === 'delivered' && targetOrder) {
      const matchOrderNumber = targetOrder.orderNumber;
      if (activeOrder && (activeOrder.orderNumber === matchOrderNumber || activeOrder.id === matchOrderNumber)) {
        const updatedActive: Order = {
          ...activeOrder,
          status: 'delivered',
          orderStatus: 'delivered',
          deliveryOtpVerified: true,
        };
        setActiveOrder(updatedActive);
        setTrackingOrder(updatedActive);
        localStorage.setItem('dmart_active_order', JSON.stringify(updatedActive));
      }
      setOrderHistory((prev) => {
        const updatedHistory = prev.map((ord) =>
          ord.orderNumber === matchOrderNumber || ord.id === matchOrderNumber
            ? { ...ord, status: 'delivered' as const, orderStatus: 'delivered' as const, deliveryOtpVerified: true }
            : ord
        );
        localStorage.setItem('dmart_order_history', JSON.stringify(updatedHistory));
        return updatedHistory;
      });

      // Synchronize delivery OTP completion in Firestore
      updateOrderOtpVerificationInFirestore(
        targetOrder.id || matchOrderNumber,
        true,
        'delivered'
      );
    }
  };

  // Rider Orders Header Button Handler
  const handleRiderOrdersClick = () => {
    // 1. Access & Sign-In: Prompt Google Sign-In authentication if not logged in
    if (!user?.isLoggedIn) {
      setIsRiderAuthPrompt(true);
      setIsAuthOpen(true);
      return;
    }

    // 4. Rider Dashboard: If already approved, direct straight to available delivery orders
    if (deliveryApplication?.status === 'approved') {
      setIsDeliveryApprovalStatusOpen(true);
      return;
    }

    // 3. Status Button: If pending approval, open status verification modal
    if (
      deliveryApplication &&
      (deliveryApplication.status === 'pending' || deliveryApplication.status === 'submitted_waiting_approval')
    ) {
      setIsDeliveryApprovalStatusOpen(true);
      return;
    }

    // 2. Rider Onboarding Form: If not yet an approved rider, display registration form
    setIsDeliveryRegistrationOpen(true);
  };

  const handleApproveApplication = () => {
    if (!deliveryApplication) {
      const demoApp: DeliveryPartnerApplication = {
        id: 'del-app-' + Date.now(),
        referenceNo: 'DMART-RIDER-8921',
        fullName: user?.name || 'Ahmad Faiz bin Azlan',
        nationality: 'Malaysian',
        idNumber: '950412-14-5391',
        phoneNumber: user?.phone || '012-8492019',
        address: 'No. 18, Jalan Desa Bakti, Taman Desa, 58100 Kuala Lumpur',
        vehicleType: 'motorcycle',
        plateNumber: 'WXX 8492',
        licenseDocName: 'JPJ-Driver-License-Faiz.jpg',
        licenseDocUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        submittedAt: new Date().toISOString(),
        status: 'approved',
      };
      setDeliveryApplication(demoApp);
      localStorage.setItem('dmart_rider_app', JSON.stringify(demoApp));
      return;
    }
    const updated: DeliveryPartnerApplication = {
      ...deliveryApplication,
      status: 'approved',
    };
    setDeliveryApplication(updated);
    localStorage.setItem('dmart_rider_app', JSON.stringify(updated));
  };

  const handleToggleApplicationStatus = () => {
    if (!deliveryApplication) {
      handleApproveApplication();
      return;
    }
    const newStatus = deliveryApplication.status === 'approved' ? 'pending' : 'approved';
    const updated: DeliveryPartnerApplication = {
      ...deliveryApplication,
      status: newStatus,
    };
    setDeliveryApplication(updated);
    localStorage.setItem('dmart_rider_app', JSON.stringify(updated));
  };

  const handleOpenDeliveryStatus = () => {
    handleRiderOrdersClick();
  };

  // Handle Reorder from Order History
  const handleReorder = (orderToReorder: Order) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      orderToReorder.items.forEach((orderItem) => {
        const existingIdx = newCart.findIndex((ci) => ci.product.id === orderItem.product.id);
        if (existingIdx > -1) {
          newCart[existingIdx] = {
            ...newCart[existingIdx],
            quantity: newCart[existingIdx].quantity + orderItem.quantity,
          };
        } else {
          newCart.push({
            product: orderItem.product,
            quantity: orderItem.quantity,
          });
        }
      });
      return newCart;
    });
    // Open cart drawer so user sees items added
    setIsCartOpen(true);
  };

  // Handle Customer 5-Star Feedback for delivered orders in customerFeedback array
  const handleRateOrder = (orderId: string, feedback: CustomerFeedback) => {
    setOrderHistory((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const currentFeedback = ord.customerFeedback || [];
          return {
            ...ord,
            customerFeedback: [...currentFeedback, feedback],
            review: {
              rating: feedback.rating,
              comment: feedback.comment,
              tags: ord.review?.tags || ['⭐ Customer Feedback'],
              submittedAt: feedback.createdAt,
            },
          };
        }
        return ord;
      })
    );

    if (activeOrder && activeOrder.id === orderId) {
      const currentFeedback = activeOrder.customerFeedback || [];
      const updatedActive: Order = {
        ...activeOrder,
        customerFeedback: [...currentFeedback, feedback],
        review: {
          rating: feedback.rating,
          comment: feedback.comment,
          tags: activeOrder.review?.tags || ['⭐ Customer Feedback'],
          submittedAt: feedback.createdAt,
        },
      };
      setActiveOrder(updatedActive);
    }

    if (trackingOrder && trackingOrder.id === orderId) {
      const currentFeedback = trackingOrder.customerFeedback || [];
      setTrackingOrder({
        ...trackingOrder,
        customerFeedback: [...currentFeedback, feedback],
        review: {
          rating: feedback.rating,
          comment: feedback.comment,
          tags: trackingOrder.review?.tags || ['⭐ Customer Feedback'],
          submittedAt: feedback.createdAt,
        },
      });
    }

    setStoreOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const currentFeedback = ord.customerFeedback || [];
          return {
            ...ord,
            customerFeedback: [...currentFeedback, feedback],
            review: {
              rating: feedback.rating,
              comment: feedback.comment,
              tags: ord.review?.tags || ['⭐ Customer Feedback'],
              submittedAt: feedback.createdAt,
            },
          };
        }
        return ord;
      })
    );
  };

  // Current active category metadata
  const currentCategoryConfig = mainCategoryConfig[selectedCategory];

  return (
    <div className={`min-h-screen ${currentView === 'admin' ? 'bg-[#f4f6f5]' : 'bg-[#f8faf9] pb-12 sm:pb-16'} text-gray-900 flex flex-col font-sans selection:bg-emerald-200 w-full max-w-full overflow-x-hidden`}>
      {/* Consumer Navbar Header (Hidden in Admin Control Center) */}
      {currentView !== 'admin' && (
        <Navbar
          language={language}
          onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'ms' : 'en'))}
          user={user}
          onOpenAuth={() => {
            if (!hasRegisteredBuyer || !user?.isLoggedIn) {
              setIsBuyerRegistrationOpen(true);
            } else {
              setIsAuthOpen(true);
            }
          }}
          onOpenCart={() => setIsCartOpen(true)}
          cartCount={totalItemsCount}
          deliveryAddress={deliveryAddress}
          onOpenMapPicker={() => setIsMapPickerOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          deliveryApplication={deliveryApplication}
          onRiderOrdersClick={handleRiderOrdersClick}
          onOpenDeliveryRegistration={handleRiderOrdersClick}
          onOpenDeliveryStatus={handleRiderOrdersClick}
          onGoHome={() => {
            setCurrentView('shop');
            setSelectedCategory('all');
            setSelectedSubCategory('all');
            setShowOnlyFavorites(false);
            setSearchQuery('');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenOrders={() => {
            setTrackingOrder(userActiveOrder || activeOrder);
            setIsTrackingOpen(true);
          }}
          onOpenOrderHistory={() => {
            setCurrentView('order_history');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeOrderCount={userActiveOrder ? 1 : 0}
          pastOrderCount={orderHistory.length}
          currentView={currentView}
          onReplaySplash={() => setShowSplash(true)}
          favoritesCount={favorites.length}
          showOnlyFavorites={showOnlyFavorites}
          onToggleFavoritesFilter={() => {
            setShowOnlyFavorites((prev) => !prev);
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }}
          announcementBarConfig={promoSettings.announcementBar}
          storefrontCopy={storefrontCopy}
          onOpenChatbot={() => setIsChatOpen(true)}
          onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
          onOpenSideNav={() => setIsSideNavOpen(true)}
          onOpenShareApp={() => setIsShareAppOpen(true)}
          loyaltyPoints={loyaltyPoints}
          onOpenLoyaltyModal={() => handleOpenLoyaltyModal('tiers')}
          pointsNotification={pointsNotification}
          onOpenNotifications={() => setIsNotificationCenterOpen(true)}
          notificationCount={orderNotifications.filter((n) => !n.read).length + activeToasts.length}
        />
      )}

      {/* CONDITIONAL MAIN VIEW: Admin Dashboard or Order History View or Supermarket Shopping Catalog */}
      {currentView === 'admin' ? (
        <div className="flex-1 w-full">
          <AdminDashboard
            products={catalogProducts}
            onUpdateProducts={handleUpdateCatalogProducts}
            applications={adminApplications}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            orders={storeOrders}
            onUpdateOrderStatus={handleUpdateStoreOrderStatus}
            promoSettings={promoSettings}
            onUpdatePromoSettings={handleUpdatePromoSettings}
            shippingSettings={shippingSettings}
            onUpdateShippingSettings={handleUpdateShippingSettings}
            bankInfo={storeBankInfo}
            onUpdateBankInfo={handleUpdateStoreBankInfo}
            documents={adminDocuments}
            onUpdateDocuments={setAdminDocuments}
            payouts={adminPayouts}
            onUpdatePayoutStatus={handleUpdatePayoutStatus}
            tickets={adminTickets}
            onUpdateTicket={handleUpdateAdminTicket}
            banners={storefrontBanners}
            onUpdateBanners={setStorefrontBanners}
            language={language}
            onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'ms' : 'en'))}
            onBackToStore={() => {
              setCurrentView('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      ) : currentView === 'order_history' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
          <OrderHistoryView
            orders={orderHistory}
            language={language}
            onReorder={handleReorder}
            onRateOrder={handleRateOrder}
            onViewOrderTracking={(order) => {
              setTrackingOrder(order);
              setIsTrackingOpen(true);
            }}
            onGoHome={() => {
              setCurrentView('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
      ) : (
        <>
          {/* TOP OF PAGE: SPECIAL VOUCHERS SECTION */}
          <SpecialVouchersTopBar
            language={language}
            activeVoucherCode={activeVoucherCode}
            cartSubtotal={subtotal}
            onApplyVoucher={handleApplyVoucher}
            onOpenCart={() => setIsCartOpen(true)}
            vouchers={promoSettings.specialVouchers}
          />

          {/* Category Navigation Bar with Department Tabs & Subcategory Pills */}
          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedSubCategory('all');
              setShowOnlyFavorites(false);
            }}
            selectedSubCategory={selectedSubCategory}
            onSelectSubCategory={setSelectedSubCategory}
            language={language}
            favoritesCount={favorites.length}
            showOnlyFavorites={showOnlyFavorites}
            onToggleFavoritesFilter={() => {
              setShowOnlyFavorites((prev) => !prev);
            }}
          />

          {/* Dynamic Storefront Banners Section (Real-Time Firestore onSnapshot) */}
          <StorefrontBanners
            language={language}
            banners={storefrontBanners}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedSubCategory('all');
              setShowOnlyFavorites(false);
            }}
          />

          {/* Hero Welcome Bar - Dynamic Firestore Strings OR Conditional Slim Active Order Tracking Widget */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2 w-full">
            {userActiveOrder ? (
              <SlimOrderTrackingBar
                order={userActiveOrder}
                language={language}
                onOpenLiveMap={() => {
                  setTrackingOrder(userActiveOrder);
                  setIsLiveMapOpen(true);
                }}
                onOpenTracking={() => {
                  setTrackingOrder(userActiveOrder);
                  setIsTrackingOpen(true);
                }}
              />
            ) : (
              <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-3 sm:p-4 shadow-xs relative overflow-hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 border border-emerald-600/30">
                <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5 min-w-0 flex-1">
                  {/* Hero Badge Tag */}
                  <div className="inline-flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-amber-300 shrink-0 self-start sm:self-auto border border-white/10 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-300 shrink-0" />
                    <span className="leading-none whitespace-normal sm:whitespace-nowrap break-words">
                      {language === 'en'
                        ? (storefrontCopy.heroBadgeTag || 'Fresh Groceries Delivered in 2 Hours')
                        : (storefrontCopy.heroBadgeTagMs || storefrontCopy.heroBadgeTag || 'Penghantaran Segar Dalam 2 Jam')}
                    </span>
                  </div>

                  {/* Hero Main Headline & Sub-headline */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 flex-wrap">
                      <h1 className="text-sm sm:text-base font-black tracking-tight text-white leading-tight break-words">
                        {language === 'en'
                          ? (storefrontCopy.heroMainHeadline || 'D-mart Supermarket Malaysia')
                          : (storefrontCopy.heroMainHeadlineMs || storefrontCopy.heroMainHeadline || 'Pasaraya D-mart Malaysia')}
                      </h1>
                      <span className="hidden md:inline text-emerald-300/80 text-xs shrink-0">•</span>
                      <p className="text-[11px] sm:text-xs text-emerald-100 font-medium leading-relaxed break-words">
                        {language === 'en'
                          ? (storefrontCopy.heroSubHeadline || 'Farm-fresh vegetables, seafood, poultry, pantry staples, and daily home essentials.')
                          : (storefrontCopy.heroSubHeadlineMs || storefrontCopy.heroSubHeadline || 'Sayur-sayuran segar, makanan laut, ayam, beras & keperluan harian sekeluarga.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Catalog / Department Section */}
          <main id="product-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full space-y-6 overflow-x-hidden">
        {/* DEPARTMENT SHORTCUT CARDS (Shown when viewing "All Departments" and not searching or filtering favorites) */}
        {selectedCategory === 'all' && !searchQuery && !showOnlyFavorites && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight flex items-center gap-2 break-words">
                <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {language === 'en'
                    ? (storefrontCopy.categorySectionTitle || 'Shop by Supermarket Department')
                    : (storefrontCopy.categorySectionTitleMs || storefrontCopy.categorySectionTitle || 'Beli Mengikut Jabatan Pasaraya')}
                </span>
              </h2>
              <span className="text-[11px] sm:text-xs text-gray-500 font-semibold shrink-0">
                {language === 'en' ? 'Click to explore products' : 'Klik untuk terokai barangan'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Fresh Products with dual windows */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('fresh_products');
                  setSelectedSubCategory('all');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100/70 border border-emerald-200 text-left hover:shadow-md hover:border-emerald-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    🍎
                  </div>
                  <h3 className="font-bold text-xs text-emerald-950 leading-tight">
                    {t.freshProducts}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {language === 'en' ? 'Fruits & Veggies' : 'Buah & Sayur'} →
                </span>
              </button>

              {/* Daily Groceries */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('daily_groceries');
                  setSelectedSubCategory('all');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/70 border border-amber-200 text-left hover:shadow-md hover:border-amber-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-lg mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    🥫
                  </div>
                  <h3 className="font-bold text-xs text-amber-950 leading-tight">
                    {t.dailyGroceries}
                  </h3>
                  <p className="text-[10px] text-amber-800 mt-1 line-clamp-2">
                    {language === 'en' ? 'Canned, Rice & Pantry' : 'Makanan Tin, Beras & Rencah'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-800 mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {language === 'en' ? 'Explore' : 'Terokai'} →
                </span>
              </button>

              {/* Snacks & Drinks */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('snacks_and_drinks');
                  setSelectedSubCategory('all');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100/70 border border-orange-200 text-left hover:shadow-md hover:border-orange-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    🥤
                  </div>
                  <h3 className="font-bold text-xs text-orange-950 leading-tight">
                    {t.snacksAndDrinks}
                  </h3>
                  <p className="text-[10px] text-orange-800 mt-1 line-clamp-2">
                    {language === 'en' ? 'Milo, Coffee, Crisps' : 'Milo, Kopi & Biskut'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-orange-800 mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {language === 'en' ? 'Explore' : 'Terokai'} →
                </span>
              </button>

              {/* Meats & Seafood */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('meats');
                  setSelectedSubCategory('all');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-100/70 border border-rose-200 text-left hover:shadow-md hover:border-rose-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    🍗
                  </div>
                  <h3 className="font-bold text-xs text-rose-950 leading-tight">
                    {t.meatsCategory}
                  </h3>
                  <p className="text-[10px] text-rose-800 mt-1 line-clamp-2">
                    {language === 'en' ? 'Halal Chicken, Beef & Fish' : 'Ayam, Daging & Makanan Laut'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-rose-800 mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {language === 'en' ? 'Explore' : 'Terokai'} →
                </span>
              </button>

              {/* Cleaning Products */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('cleaning_products');
                  setSelectedSubCategory('all');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-sky-100/70 border border-blue-200 text-left hover:shadow-md hover:border-blue-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    🧼
                  </div>
                  <h3 className="font-bold text-xs text-blue-950 leading-tight">
                    {t.cleaningProducts}
                  </h3>
                  <p className="text-[10px] text-blue-800 mt-1 line-clamp-2">
                    {language === 'en' ? 'Dynamo, Sunlight, Dettol' : 'Pencuci Pinggan & Detergen'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-blue-800 mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {language === 'en' ? 'Explore' : 'Terokai'} →
                </span>
              </button>

              {/* Pet Foods */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('pet_foods');
                  setSelectedSubCategory('all');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-100/70 border border-purple-200 text-left hover:shadow-md hover:border-purple-400 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    🐱
                  </div>
                  <h3 className="font-bold text-xs text-purple-950 leading-tight">
                    {t.petFoods}
                  </h3>
                  <p className="text-[10px] text-purple-800 mt-1 line-clamp-2">
                    {language === 'en' ? 'Whiskas, Pedigree, Litter' : 'Makanan Kucing & Anjing'}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-purple-800 mt-2 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  {language === 'en' ? 'Explore' : 'Terokai'} →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* DEDICATED VIEW: FRESH PRODUCTS DUAL WINDOWS (When Side-by-Side View chip is selected) */}
        {selectedCategory === 'fresh_products' && selectedSubCategory === 'side_by_side' && !searchQuery && !showOnlyFavorites ? (
          <FreshProductsDualWindows
            products={catalogProducts.filter((p) => p.mainCategory === 'fresh_products')}
            language={language}
            cart={cartMap}
            favorites={favorites}
            isLoading={isProductsLoading}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          /* STANDARD PRODUCTS CATALOG VIEW (For Daily Groceries, Snacks & Drinks, Meats, Cleaning, Pet, and All) */
          <div className="space-y-4">
            {/* Header controls: Title & Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                    {showOnlyFavorites ? (
                      <>
                        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                        <span>{t.favorites}</span>
                      </>
                    ) : (
                      <span>
                        {selectedCategory === 'all'
                          ? t.allCategories
                          : currentCategoryConfig
                          ? language === 'en'
                            ? currentCategoryConfig.en
                            : currentCategoryConfig.ms
                          : selectedCategory}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center min-w-[3.5rem] justify-center">
                      {isProductsLoading ? (
                        <span className="inline-block w-8 h-3 bg-emerald-200/90 rounded animate-pulse" />
                      ) : (
                        `${filteredProducts.length} ${t.resultsCount}`
                      )}
                    </span>
                  </h2>
                </div>

                <p className="text-xs text-gray-500 mt-0.5">
                  {showOnlyFavorites
                    ? t.favoritesDesc
                    : searchQuery
                    ? `${language === 'en' ? 'Results for:' : 'Hasil carian:'} "${searchQuery}"`
                    : currentCategoryConfig
                    ? language === 'en'
                      ? currentCategoryConfig.descriptionEn
                      : currentCategoryConfig.descriptionMs
                    : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {t.sortBy}:
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-xs font-semibold bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:border-emerald-500 outline-none text-gray-800 shadow-2xs"
                >
                  <option value="default">{language === 'en' ? 'Featured / Popular' : 'Pilihan Utama'}</option>
                  <option value="price_asc">{t.priceLowHigh}</option>
                  <option value="price_desc">{t.priceHighLow}</option>
                </select>
              </div>
            </div>

            {/* Products Grid: Showing skeleton while fetching or filtering to improve perceived performance */}
            {isProductsLoading ? (
              <ProductGridSkeleton count={10} />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
                {filteredProducts.map((product) => {
                  const quantityInCart = cartMap[product.id] || 0;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      language={language}
                      quantityInCart={quantityInCart}
                      isFavorite={favorites.includes(product.id)}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  );
                })}
              </div>
            ) : showOnlyFavorites ? (
              <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-gray-200">
                <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
                  <Heart className="w-7 h-7 fill-rose-100 text-rose-500" />
                </div>
                <h3 className="text-base font-bold text-gray-800">{t.noFavoritesTitle}</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {t.noFavoritesDesc}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowOnlyFavorites(false);
                    setSelectedCategory('all');
                    setSelectedSubCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  {t.browseProducts}
                </button>
              </div>
            ) : (
              <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-gray-200">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-800">{t.noProductsFound}</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  {language === 'en'
                    ? 'Try searching with simpler grocery terms or switch to another supermarket category.'
                    : 'Cuba cari menggunakan kata kunci lebih ringkas atau tukar kategori pasaraya.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedSubCategory('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                >
                  {t.resetFilter}
                </button>
              </div>
            )}
          </div>
        )}

      </main>
      </>
      )}

      {/* Footer */}
      {currentView !== 'admin' && (
        <footer id="app-footer" className="mt-12 bg-white border-t border-gray-200 py-8 text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="footer-dmart-logo-btn"
                onClick={() => setIsAdminAuthOpen(true)}
                className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white text-xs font-black transition-colors cursor-pointer"
                title={storefrontCopy.footerBrandTitle || 'D-mart Malaysia'}
                aria-label="D-mart"
              >
                D
              </button>
              <span className="font-bold text-gray-900">{storefrontCopy.footerBrandTitle || 'D-mart Malaysia'}</span>
              <span>• {storefrontCopy.footerBrandSubtitle || t.tagline}</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-center sm:text-left">
              <span>{storefrontCopy.footerPaymentMethodsText}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap justify-center sm:justify-end">
              <span>{storefrontCopy.footerCopyrightNotice}</span>
              <span className="text-gray-300">•</span>
              {/* Privacy Policy Link */}
              <a
                href="/privacy.html"
                id="footer-privacy-policy-link"
                data-testid="footer-privacy-policy-link"
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
                    e.preventDefault();
                    setIsPrivacyPolicyOpen(true);
                  }
                }}
                className="hover:underline text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer"
                title={language === 'en' ? 'D-Mart Privacy Policy' : 'Dasar Privasi D-Mart'}
              >
                {language === 'en' ? 'Privacy Policy' : 'Dasar Privasi'}
              </a>
              <span className="text-gray-300">•</span>
              {/* Discrete Admin Entry Point */}
              <button
                type="button"
                id="footer-admin-access-btn"
                onClick={() => setIsAdminAuthOpen(true)}
                className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer group"
                title={language === 'en' ? 'Staff Portal' : 'Portal Staf'}
                aria-label={language === 'en' ? 'Staff Access' : 'Akses Staf'}
              >
                <Lock className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                <span className="hover:underline text-[10px]">
                  {language === 'en' ? 'Staff Access' : 'Akses Staf'}
                </span>
              </button>
              <span className="text-gray-300">•</span>
              {/* Discrete Rider Access Entry Point */}
              {(() => {
                const isRiderApproved = deliveryApplication?.status === 'approved';
                const isRiderPending =
                  deliveryApplication &&
                  (deliveryApplication.status === 'pending' ||
                    deliveryApplication.status === 'submitted_waiting_approval');

                if (isRiderApproved) {
                  return (
                    <button
                      type="button"
                      id="footer-rider-access-btn"
                      onClick={handleRiderOrdersClick}
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors cursor-pointer group"
                      title={language === 'en' ? 'Rider Orders Portal (Approved)' : 'Portal Pesanan Rider (Diluluskan)'}
                      aria-label="Rider Access"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      <Bike className="w-3 h-3 text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                      <span className="hover:underline text-[10px]">
                        {language === 'en' ? 'Rider Access' : 'Akses Rider'}
                      </span>
                    </button>
                  );
                }

                if (isRiderPending) {
                  return (
                    <button
                      type="button"
                      id="footer-rider-access-btn"
                      onClick={handleRiderOrdersClick}
                      className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 font-medium transition-colors cursor-pointer group"
                      title={language === 'en' ? 'Rider Application Pending' : 'Permohonan Rider Menunggu'}
                      aria-label="Rider Access"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
                      <Bike className="w-3 h-3 text-red-500 group-hover:text-red-600 transition-colors" />
                      <span className="hover:underline text-[10px]">
                        {language === 'en' ? 'Rider Access' : 'Akses Rider'}
                      </span>
                    </button>
                  );
                }

                // Regular Customer / Unregistered: exact same subtle, low-contrast grey font as Staff Access
                return (
                  <button
                    type="button"
                    id="footer-rider-access-btn"
                    onClick={handleRiderOrdersClick}
                    className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer group"
                    title={language === 'en' ? 'Rider / Delivery Registration' : 'Pendaftaran Rider / Penghantaran'}
                    aria-label="Rider Access"
                  >
                    <Bike className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    <span className="hover:underline text-[10px]">
                      {language === 'en' ? 'Rider Access' : 'Akses Rider'}
                    </span>
                  </button>
                );
              })()}
            </div>
          </div>
        </footer>
      )}

      {/* Dedicated Full-Page Cart & Checkout View */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        language={language}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onAddToCart={handleAddToCart}
        catalogProducts={catalogProducts}
        onClearCart={handleClearCart}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        discount={voucherDiscount}
        total={total}
        onApplyVoucher={handleApplyVoucher}
        voucherCode={activeVoucherCode}
        onOpenShareApp={() => setIsShareAppOpen(true)}
        user={user}
        deliveryAddress={deliveryAddress}
        onOpenMapPicker={() => {
          setIsCartOpen(false);
          setIsMapPickerOpen(true);
        }}
        onOrderSuccess={handleOrderSuccess}
        loyaltyPoints={loyaltyPoints}
      />

      {/* Buyer Registration & Checkout Gate Modal (Step 1: Google Auth, Step 2: Mandatory Profile) */}
      <BuyerRegistrationModal
        isOpen={isBuyerRegistrationOpen}
        onClose={() => setIsBuyerRegistrationOpen(false)}
        language={language}
        currentUser={user}
        currentAddress={deliveryAddress}
        onGoogleSignInSuccess={(authenticatedUser) => {
          setUser(authenticatedUser);
          localStorage.setItem('dmart_user', JSON.stringify(authenticatedUser));
        }}
        onCompleteRegistration={handleCompleteBuyerRegistration}
        onOpenDeliveryPartnerRegistration={() => {
          setIsBuyerRegistrationOpen(false);
          setIsDeliveryRegistrationOpen(true);
        }}
        onOpenMapPicker={() => {
          setIsBuyerRegistrationOpen(false);
          setIsMapPickerOpen(true);
        }}
      />

      {/* Delivery Partner / Rider Registration Modal */}
      <DeliveryRegistrationModal
        isOpen={isDeliveryRegistrationOpen}
        onClose={() => setIsDeliveryRegistrationOpen(false)}
        language={language}
        user={user}
        onSubmitSuccess={handleDeliverySubmitSuccess}
      />

      {/* Delivery Application Status & Approved Partner Orders Modal */}
      <DeliveryApprovalStatusModal
        isOpen={isDeliveryApprovalStatusOpen}
        onClose={() => setIsDeliveryApprovalStatusOpen(false)}
        application={deliveryApplication}
        language={language}
        onApproveApplication={handleApproveApplication}
        onToggleStatus={handleToggleApplicationStatus}
        deliveryOrders={deliveryOrders}
        onAcceptOrder={handleAcceptDeliveryOrder}
        onViewOrderDetails={handleViewDeliveryOrderDetails}
        onUpdateApplication={(updated) => {
          setDeliveryApplication(updated);
          localStorage.setItem('dmart_rider_app', JSON.stringify(updated));
        }}
        onRiderSignOut={() => {
          setDeliveryApplication(null);
          localStorage.removeItem('dmart_rider_app');
          localStorage.removeItem('dmart_rider_default_landing');
        }}
      />

      {/* Details Order Page / Modal for Delivery Partners */}
      <DeliveryOrderDetailsModal
        isOpen={isDeliveryOrderDetailsOpen}
        onClose={() => setIsDeliveryOrderDetailsOpen(false)}
        order={selectedDeliveryOrder}
        language={language}
        onUpdateOrderStatus={handleUpdateDeliveryOrderStatus}
        onBackToList={() => {
          setIsDeliveryOrderDetailsOpen(false);
          setIsDeliveryApprovalStatusOpen(true);
        }}
      />

      {/* Google Authentication Modal */}
      <GoogleAuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setIsRiderAuthPrompt(false);
        }}
        language={language}
        user={user}
        isRiderIntent={isRiderAuthPrompt}
        onLogin={(profile) => {
          setUser(profile);
          localStorage.setItem('dmart_user', JSON.stringify(profile));
          if (isRiderAuthPrompt) {
            setIsRiderAuthPrompt(false);
            setIsAuthOpen(false);
            if (deliveryApplication?.status === 'approved') {
              setIsDeliveryApprovalStatusOpen(true);
            } else if (
              deliveryApplication &&
              (deliveryApplication.status === 'pending' || deliveryApplication.status === 'submitted_waiting_approval')
            ) {
              setIsDeliveryApprovalStatusOpen(true);
            } else {
              setIsDeliveryRegistrationOpen(true);
            }
          }
        }}
        onLogout={async () => {
          await executeStrictSignOut();
          setUser(null);
          setHasRegisteredBuyer(false);
          localStorage.removeItem('dmart_user');
          localStorage.removeItem('dmart_buyer_registered');
          setIsAuthOpen(true);
        }}
        defaultEmail="tradingalmehdhar@gmail.com"
        deliveryApplication={deliveryApplication}
        onOpenDeliveryPartnerRegistration={() => {
          setIsAuthOpen(false);
          handleRiderOrdersClick();
        }}
        onOpenDeliveryStatus={() => {
          setIsAuthOpen(false);
          handleRiderOrdersClick();
        }}
        onOpenBuyerProfile={() => {
          setIsAuthOpen(false);
          setIsBuyerRegistrationOpen(true);
        }}
        onOpenShareApp={() => {
          setIsAuthOpen(false);
          setIsShareAppOpen(true);
        }}
        onOpenAdminAuth={() => {
          setIsAuthOpen(false);
          setIsAdminAuthOpen(true);
        }}
        loyaltyPoints={loyaltyPoints}
        onOpenLoyaltyModal={() => handleOpenLoyaltyModal('tiers')}
        onOpenLoyaltyHistory={() => handleOpenLoyaltyModal('history')}
        orders={orderHistory}
        badges={userBadges}
      />

      {/* Delivery Map Location Picker */}
      <DeliveryMapPicker
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        language={language}
        currentAddress={deliveryAddress}
        onSelectAddress={(addr) => setDeliveryAddress(addr)}
      />

      {/* Checkout & Delivery Registration Submission Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        language={language}
        items={cart}
        subtotal={subtotal}
        deliveryFee={deliveryFee}
        discount={voucherDiscount}
        total={total}
        user={user}
        deliveryAddress={deliveryAddress}
        onOpenMapPicker={() => {
          setIsCheckoutOpen(false);
          setIsMapPickerOpen(true);
        }}
        onOrderSuccess={handleOrderSuccess}
        onRequireAuth={() => {
          setIsCheckoutOpen(false);
          setIsBuyerRegistrationOpen(true);
        }}
        loyaltyPoints={loyaltyPoints}
      />

      {/* D-mart Loyalty Rewards Modal */}
      <LoyaltyPointsModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        language={language}
        loyaltyPoints={loyaltyPoints}
        initialTab={loyaltyModalTab}
        transactions={loyaltyTransactions}
        badges={userBadges}
        onViewOrder={(orderRef) => {
          setIsLoyaltyModalOpen(false);
          const found = orderHistory.find(
            (o) => o.orderNumber === orderRef || o.id === orderRef
          );
          if (found) {
            setTrackingOrder(found);
            setIsTrackingOpen(true);
          } else {
            setCurrentView('order_history');
          }
        }}
        onStartShopping={() => {
          setIsLoyaltyModalOpen(false);
          setCurrentView('shop');
        }}
      />

      {/* Order Tracking & Delivery Registration Submitted Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        order={trackingOrder || activeOrder}
        language={language}
        onOpenShareApp={() => setIsShareAppOpen(true)}
        onUpdateOrder={(updated) => {
          if (activeOrder && activeOrder.id === updated.id) {
            setActiveOrder(updated);
            localStorage.setItem('dmart_active_order', JSON.stringify(updated));
          }
          setTrackingOrder(updated);
          setOrderHistory((prev) =>
            prev.map((o) => (o.id === updated.id ? updated : o))
          );
        }}
      />

      {/* Direct Live Delivery Map Modal */}
      {(trackingOrder || userActiveOrder || activeOrder) && (
        <LiveDeliveryMapModal
          isOpen={isLiveMapOpen}
          onClose={() => setIsLiveMapOpen(false)}
          order={(trackingOrder || userActiveOrder || activeOrder)!}
          language={language}
        />
      )}

      {/* Multi-turn Gemini AI Chatbot Modal */}
      <GeminiChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        language={language}
        cartCount={cart.length}
        cartSummary={cart.map((c) => `${c.product.nameEn} (x${c.quantity})`).join(', ')}
      />

      {/* App Launch Splash Screen */}
      {showSplash && (
        <SplashScreen
          language={language}
          onFinish={() => setShowSplash(false)}
          autoDismiss={true}
        />
      )}

      {/* Barcode Scanner Modal for Quick Pantry Staple Scanning */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onAddToCart={handleAddToCart}
        onOpenCart={() => setIsCartOpen(true)}
        products={catalogProducts}
        language={language}
      />

      {/* Side Navigation Drawer with QR Code Banner at bottom */}
      <SideNavDrawer
        isOpen={isSideNavOpen}
        onClose={() => setIsSideNavOpen(false)}
        language={language}
        onToggleLanguage={() => setLanguage((l) => (l === 'en' ? 'ms' : 'en'))}
        user={user}
        onOpenAuth={() => {
          if (!hasRegisteredBuyer || !user?.isLoggedIn) {
            setIsBuyerRegistrationOpen(true);
          } else {
            setIsAuthOpen(true);
          }
        }}
        currentView={currentView}
        onGoHome={() => {
          setCurrentView('shop');
          setSelectedCategory('all');
          setSelectedSubCategory('all');
          setShowOnlyFavorites(false);
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOrderHistory={() => {
          setCurrentView('order_history');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOrders={() => {
          setTrackingOrder(activeOrder);
          setIsTrackingOpen(true);
        }}
        activeOrderCount={activeOrder ? 1 : 0}
        pastOrderCount={orderHistory.length}
        favoritesCount={favorites.length}
        onToggleFavoritesFilter={() => {
          setShowOnlyFavorites((prev) => !prev);
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }}
        showOnlyFavorites={showOnlyFavorites}
        deliveryApplication={deliveryApplication}
        onRiderOrdersClick={handleRiderOrdersClick}
        onOpenChatbot={() => setIsChatOpen(true)}
        onOpenShareApp={() => setIsShareAppOpen(true)}
        onReplaySplash={() => {
          setShowSplash(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        storeBadgeText={storefrontCopy.storeBadgeText}
        loyaltyPoints={loyaltyPoints}
        onOpenLoyaltyModal={() => handleOpenLoyaltyModal('tiers')}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        notificationCount={orderNotifications.filter((n) => !n.read).length + activeToasts.length}
      />

      {/* Share App QR Code Modal with Download link and PNG Export */}
      <ShareAppModal
        isOpen={isShareAppOpen}
        onClose={() => setIsShareAppOpen(false)}
        language={language}
        storeBadgeText={storefrontCopy.storeBadgeText}
      />

      {/* Secure Admin Passcode Authorization Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={() => {
          setIsAdminAuthOpen(false);
          setCurrentView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        language={language}
        currentUser={user}
      />

      {/* Real-time In-App Toast Alerts Stack for Order Status Transitions */}
      <OrderStatusToastContainer
        notifications={activeToasts}
        onDismiss={(id) => setActiveToasts((prev) => prev.filter((t) => t.id !== id))}
        onTrackOrder={handleTrackOrderFromAlert}
        onViewReceipt={handleOpenReceiptForOrder}
        language={language}
        soundEnabled={notificationSoundEnabled}
        onToggleSound={() => setNotificationSoundEnabled((prev) => !prev)}
      />

      {/* Real-time Order Alerts & Push Notifications Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={orderNotifications}
        onClearAll={() => {
          clearStoredNotifications();
          setOrderNotifications([]);
          setActiveToasts([]);
        }}
        onTrackOrder={handleTrackOrderFromAlert}
        onViewReceipt={handleOpenReceiptForOrder}
        language={language}
        soundEnabled={notificationSoundEnabled}
        onToggleSound={() => setNotificationSoundEnabled((prev) => !prev)}
        onSimulateTransition={handleSimulateTransition}
      />

      {/* Standalone Order Receipt Modal (Accessible from any Toast or Notification alert) */}
      {receiptModalOrder && (
        <OrderReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setReceiptModalOrder(null);
          }}
          order={receiptModalOrder}
          language={language}
        />
      )}

      {/* D-Mart Privacy Policy Modal (Bilingual PDPA 2010 Compliance) */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
        language={language}
      />
    </div>
  );
}
