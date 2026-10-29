import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Bike,
  Truck,
  Sliders,
  ShieldCheck,
  LifeBuoy,
  Store,
  Globe,
  Bell,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  AlertTriangle,
  Boxes,
  DollarSign,
  X,
  ExternalLink,
  ArrowRight,
  Activity,
  Shield,
  ChevronDown,
  ChevronUp,
  Check,
  Building2,
  Landmark,
  Receipt,
  Wallet,
  FileText,
  Menu,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { exportOrdersReconciliationCSV } from '../../utils/orderCsvExport';
import {
  Product,
  DeliveryPartnerApplication,
  Order,
  PromoConfig,
  ShippingSettings,
  StoreBankInfo,
  SupportTicket,
  BusinessDocument,
  RiderPayout,
  AdminTabType,
  Language,
  ManagedCategory,
  PromoCoupon,
  MarketingBanner,
  PushNotificationBroadcast,
  SubAdminProfile,
  MerchantPartner,
  PartnerLedgerEntry
} from '../../types';
import {
  INITIAL_MANAGED_CATEGORIES,
  INITIAL_PROMO_COUPONS,
  INITIAL_MARKETING_BANNERS,
  INITIAL_PUSH_BROADCASTS,
  INITIAL_SUBADMIN_PROFILES,
  INITIAL_MERCHANT_PARTNERS,
  INITIAL_PARTNER_LEDGER_ENTRIES
} from '../../data/adminInitialData';
import { AdminInventoryTab } from './AdminInventoryTab';
import { AdminFleetTab } from './AdminFleetTab';
import { AdminDispatchTab } from './AdminDispatchTab';
import { AdminPricingSettingsTab } from './AdminPricingSettingsTab';
import { AdminVaultTab } from './AdminVaultTab';
import { AdminSupportTab } from './AdminSupportTab';
import { AdminMarketingTab } from './AdminMarketingTab';
import { AdminFinanceLedgerTab } from './AdminFinanceLedgerTab';
import { AdminMerchantsTab } from './AdminMerchantsTab';
import { AdminComplianceSettingsTab } from './AdminComplianceSettingsTab';
import { AdminPdfSettingsPanel } from './AdminPdfSettingsPanel';
import {
  saveBannerToFirestore,
  deleteBannerFromFirestore,
  subscribeToStorefrontBanners,
  subscribeToCategories,
  syncCategoryToFirestore,
  deleteCategoryFromFirestore,
} from '../../firebase_config';

interface AdminDashboardProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  categories?: ManagedCategory[];
  onUpdateCategories?: (categories: ManagedCategory[]) => void;
  applications: DeliveryPartnerApplication[];
  onUpdateApplicationStatus: (appId: string, status: DeliveryPartnerApplication['status']) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  promoSettings: PromoConfig;
  onUpdatePromoSettings: (promo: PromoConfig) => void;
  shippingSettings: ShippingSettings;
  onUpdateShippingSettings: (shipping: ShippingSettings) => void;
  bankInfo: StoreBankInfo;
  onUpdateBankInfo: (bank: StoreBankInfo) => void;
  documents: BusinessDocument[];
  onUpdateDocuments?: (documents: BusinessDocument[]) => void;
  payouts: RiderPayout[];
  onUpdatePayoutStatus: (payoutId: string, status: RiderPayout['status']) => void;
  tickets: SupportTicket[];
  onUpdateTicket: (ticketId: string, updates: Partial<SupportTicket>) => void;
  banners?: MarketingBanner[];
  onUpdateBanners?: (banners: MarketingBanner[]) => void;
  language: Language;
  onToggleLanguage: () => void;
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onUpdateProducts,
  categories: propCategories,
  onUpdateCategories: propOnUpdateCategories,
  applications,
  onUpdateApplicationStatus,
  orders,
  onUpdateOrderStatus,
  promoSettings,
  onUpdatePromoSettings,
  shippingSettings,
  onUpdateShippingSettings,
  bankInfo,
  onUpdateBankInfo,
  documents,
  onUpdateDocuments,
  payouts,
  onUpdatePayoutStatus,
  tickets,
  onUpdateTicket,
  banners: propBanners,
  onUpdateBanners: propOnUpdateBanners,
  language,
  onToggleLanguage,
  onBackToStore,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabType>('inventory');
  const [categories, setCategories] = useState<ManagedCategory[]>(propCategories || INITIAL_MANAGED_CATEGORIES);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
    }
  }, [propCategories]);

  // Sync real-time with Firestore dmart_categories
  useEffect(() => {
    const unsubscribe = subscribeToCategories((liveCats) => {
      if (liveCats && liveCats.length > 0) {
        setCategories(liveCats);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateCategories = (newCategories: ManagedCategory[]) => {
    // Detect deletions and delete from Firestore
    const newIds = new Set(newCategories.map((c) => c.id));
    categories.forEach((oldC) => {
      if (!newIds.has(oldC.id)) {
        deleteCategoryFromFirestore(oldC.id);
      }
    });

    // Save/update in Firestore
    newCategories.forEach((c) => {
      syncCategoryToFirestore(c);
    });

    setCategories(newCategories);
    if (propOnUpdateCategories) {
      propOnUpdateCategories(newCategories);
    }
  };

  const [coupons, setCoupons] = useState<PromoCoupon[]>(INITIAL_PROMO_COUPONS);
  const [banners, setBanners] = useState<MarketingBanner[]>(propBanners || INITIAL_MARKETING_BANNERS);

  // Sync real-time with Firestore storefront_banners (include inactive for Admin management)
  useEffect(() => {
    const unsubscribe = subscribeToStorefrontBanners((liveBanners) => {
      if (liveBanners && liveBanners.length > 0) {
        setBanners(liveBanners);
      }
    }, false);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUpdateBanners = (newBanners: MarketingBanner[]) => {
    // Detect deletions and delete from Firestore
    const newIds = new Set(newBanners.map((b) => b.id));
    banners.forEach((oldB) => {
      if (!newIds.has(oldB.id)) {
        deleteBannerFromFirestore(oldB.id);
      }
    });

    // Save/update in Firestore
    newBanners.forEach((b) => {
      saveBannerToFirestore(b);
    });

    setBanners(newBanners);
    if (propOnUpdateBanners) {
      propOnUpdateBanners(newBanners);
    }
  };
  const [broadcasts, setBroadcasts] = useState<PushNotificationBroadcast[]>(INITIAL_PUSH_BROADCASTS);
  const [subAdmins, setSubAdmins] = useState<SubAdminProfile[]>(INITIAL_SUBADMIN_PROFILES);
  const [activeProfile, setActiveProfile] = useState<SubAdminProfile>(INITIAL_SUBADMIN_PROFILES[0]);
  const [merchantPartners, setMerchantPartners] = useState<MerchantPartner[]>(() => {
    try {
      const saved = localStorage.getItem('dmart_merchant_partners');
      return saved ? JSON.parse(saved) : INITIAL_MERCHANT_PARTNERS;
    } catch {
      return INITIAL_MERCHANT_PARTNERS;
    }
  });
  const [partnerLedger, setPartnerLedger] = useState<PartnerLedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem('dmart_partner_ledger');
      return saved ? JSON.parse(saved) : INITIAL_PARTNER_LEDGER_ENTRIES;
    } catch {
      return INITIAL_PARTNER_LEDGER_ENTRIES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dmart_merchant_partners', JSON.stringify(merchantPartners));
    } catch {}
  }, [merchantPartners]);

  useEffect(() => {
    try {
      localStorage.setItem('dmart_partner_ledger', JSON.stringify(partnerLedger));
    } catch {}
  }, [partnerLedger]);

  const handleRouteBannerSale = (bannerId: string, amount: number) => {
    const banner = banners.find((b) => b.id === bannerId);
    if (!banner || !banner.merchantCode) return;

    const commissionRate = banner.commissionRate || 10;
    const platformFee = Number((amount * (commissionRate / 100)).toFixed(2));
    const netPayable = Number((amount - platformFee).toFixed(2));

    const newLedgerEntry: PartnerLedgerEntry = {
      id: `led-${banner.merchantCode}-${Date.now().toString().slice(-4)}`,
      merchantCode: banner.merchantCode,
      merchantName: banner.merchantName || 'Partner',
      bannerId: banner.id,
      bannerTitle: banner.titleEn,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      orderRef: `DM-BNR-${Date.now().toString().slice(-5)}`,
      description: `Storefront Banner Direct Checkout: ${banner.titleEn}`,
      grossAmount: amount,
      commissionRate: commissionRate,
      platformFee: platformFee,
      netPayableToPartner: netPayable,
      status: 'routed',
      source: 'storefront_banner',
    };

    setPartnerLedger((prev) => [newLedgerEntry, ...prev]);

    setMerchantPartners((prev) =>
      prev.map((p) => {
        if (p.code === banner.merchantCode || p.id === banner.merchantCode) {
          return {
            ...p,
            totalSettlementDue: Number(((p.totalSettlementDue || 0) + netPayable).toFixed(2)),
            bannerRevenueRouted: Number(((p.bannerRevenueRouted || 0) + amount).toFixed(2)),
            bannerOrdersCount: (p.bannerOrdersCount || 0) + 1,
          };
        }
        return p;
      })
    );

    setBanners((prev) =>
      prev.map((b) => {
        if (b.id === bannerId) {
          return {
            ...b,
            revenueRouted: Number(((b.revenueRouted || 0) + amount).toFixed(2)),
            salesCount: (b.salesCount || 0) + 1,
            commissionEarned: Number(((b.commissionEarned || 0) + platformFee).toFixed(2)),
            netSettlementDue: Number(((b.netSettlementDue || 0) + netPayable).toFixed(2)),
          };
        }
        return b;
      })
    );
  };

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isNavDropdownOpen, setIsNavDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const alertDropdownRef = useRef<HTMLDivElement>(null);
  const navDropdownRef = useRef<HTMLDivElement>(null);

  // Close alert dropdown and navigation dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        alertDropdownRef.current &&
        !alertDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAlertsOpen(false);
      }
      if (
        navDropdownRef.current &&
        !navDropdownRef.current.contains(event.target as Node)
      ) {
        setIsNavDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Expiry calculation helper
  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return 999;
    const exp = new Date(expiryDate).getTime();
    const today = new Date().getTime();
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  };

  // Operational alert metrics
  const lowStockProducts = products.filter(
    (p) => (p.stockCount ?? p.stock_count ?? 20) <= 10
  );
  const criticalExpiryProducts = products.filter(
    (p) => getDaysUntilExpiry(p.expiryDate || p.expiry_date) <= 5
  );
  const pendingPayoutsList = payouts.filter((p) => p.status === 'ready_for_payout');
  const pendingAppsCount = applications.filter(
    (a) => a.status === 'pending' || a.status === 'submitted_waiting_approval'
  ).length;
  const activeOrdersCount = orders.filter(
    (o) => o.status === 'submitted' || o.status === 'packing' || o.status === 'out_for_delivery'
  ).length;
  const openTicketsCount = tickets.filter(
    (t) => t.status === 'open' || t.status === 'investigating'
  ).length;

  const totalAlertsCount =
    lowStockProducts.length +
    criticalExpiryProducts.length +
    pendingPayoutsList.length +
    pendingAppsCount +
    openTicketsCount;

  // Core 7 Admin & Accounting Sections
  const tabsConfig = [
    {
      id: 'inventory' as AdminTabType,
      num: 1,
      label: 'Inventory & Catalog',
      displayTitle: '1. Inventory & Catalog',
      subLabel: language === 'en' ? 'Stock count, batch registry & freshness' : 'Kiraan stok, kelompok & kesegaran',
      shortLabel: language === 'en' ? 'Inventory' : 'Inventori',
      icon: Package,
      badge: products.length,
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'dispatch' as AdminTabType,
      num: 2,
      label: 'Live Orders & Dispatch',
      displayTitle: '2. Live Orders & Dispatch',
      subLabel: language === 'en' ? 'Live queue & fleet delivery dispatch' : 'Pesanan langsung & penghantaran armada',
      shortLabel: language === 'en' ? 'Dispatch' : 'Penghantaran',
      icon: Truck,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-emerald-400 text-slate-950 font-black',
    },
    {
      id: 'marketing' as AdminTabType,
      num: 3,
      label: 'Marketing & Holiday Banners',
      displayTitle: '3. Marketing & Holiday Banners',
      subLabel: language === 'en' ? 'Banner scheduler, promos & push' : 'Penjadual sepanduk, promosi & siaran',
      shortLabel: language === 'en' ? 'Marketing' : 'Pemasaran',
      icon: Sparkles,
      badge: banners.filter((b) => b.isActive).length,
      badgeColor: 'bg-purple-400 text-slate-950 font-black',
    },
    {
      id: 'finance' as AdminTabType,
      num: 4,
      label: 'Financial Ledger & Closures',
      displayTitle: '4. Financial Ledger & Closures',
      subLabel: language === 'en' ? 'Daily Z-reports, creditors & bank payout' : 'Laporan Z harian, pemiutang & akaun bank',
      shortLabel: language === 'en' ? 'Finance' : 'Kewangan',
      icon: Landmark,
      badge: pendingPayoutsList.length > 0 ? pendingPayoutsList.length : undefined,
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
    },
    {
      id: 'rider_ledger' as AdminTabType,
      num: 5,
      label: 'Rider Financial Accounts',
      displayTitle: '5. Rider Financial Accounts',
      subLabel: language === 'en' ? 'Rider ledgers, cash collection & statements' : 'Lejar penghantar, kutipan tunai & penyata',
      shortLabel: language === 'en' ? 'Riders Ledger' : 'Lejar Rider',
      icon: Wallet,
      badge: pendingPayoutsList.length > 0 ? pendingPayoutsList.length : undefined,
      badgeColor: 'bg-emerald-400 text-slate-950 font-black',
    },
    {
      id: 'merchants' as AdminTabType,
      num: 6,
      label: 'Merchants & Store Partners',
      displayTitle: '6. Merchants & Store Partners',
      subLabel: language === 'en' ? 'Supplier onboarding, terms & catalog' : 'Pendaftaran pembekal, terma & katalog',
      shortLabel: language === 'en' ? 'Merchants' : 'Rakan Niaga',
      icon: Building2,
      badge: 5,
      badgeColor: 'bg-blue-400 text-slate-950 font-black',
    },
    {
      id: 'fleet' as AdminTabType,
      num: 7,
      label: 'Rider & Fleet Approvals',
      displayTitle: '7. Rider & Fleet Approvals',
      subLabel: language === 'en' ? 'Driver verification & fleet management' : 'Pengesahan pemandu & pengurusan armada',
      shortLabel: language === 'en' ? 'Fleet' : 'Armada',
      icon: Bike,
      badge: pendingAppsCount > 0 ? pendingAppsCount : undefined,
      badgeColor: 'bg-amber-400 text-slate-950 font-black animate-pulse',
    },
    {
      id: 'settings' as AdminTabType,
      num: 8,
      label: 'System Settings & Compliance',
      displayTitle: '8. System Settings & Compliance',
      subLabel: language === 'en' ? 'Pricing rules, RBAC & regulatory licenses' : 'Harga, kawalan peranan & lesen berkanun',
      shortLabel: language === 'en' ? 'Settings' : 'Tetapan',
      icon: ShieldCheck,
      badge: documents.length,
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'pdf_settings' as AdminTabType,
      num: 9,
      label: language === 'en' ? 'PDF Settings' : 'Tetapan PDF',
      displayTitle: language === 'en' ? '9. PDF Settings' : '9. Tetapan PDF',
      subLabel: language === 'en' ? 'Header, footer & PDF page layouts' : 'Pengepala, pengaki & susun atur PDF',
      shortLabel: language === 'en' ? 'PDF Settings' : 'Tetapan PDF',
      icon: FileText,
      badge: 'Live',
      badgeColor: 'bg-emerald-400 text-slate-950 font-black',
    },
  ];

  const currentTabConfig = tabsConfig.find((t) => t.id === activeTab) || tabsConfig[0];
  const CurrentTabIcon = currentTabConfig.icon;

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-gray-900 flex flex-col font-sans">
      {/* Executive Admin Top Header */}
      <header className="bg-slate-950 text-white sticky top-0 z-40 shadow-xl border-b border-emerald-900/60">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[58px] sm:h-18 py-2 sm:py-2.5 gap-2 sm:gap-4">
            {/* Left: Admin Portal Identity & Status Badge */}
            <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
              {/* Sidebar Menu Toggle Button */}
              <button
                type="button"
                id="admin-sidebar-toggle-btn"
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-emerald-500/50"
                title={language === 'en' ? 'Toggle Sidebar Menu' : 'Buka Menu Sisi'}
                aria-label="Toggle Sidebar Menu"
              >
                <Menu className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline font-bold">{language === 'en' ? 'Menu' : 'Menu'}</span>
              </button>

              {/* Logo / Control Center Emblem */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 flex items-center justify-center text-white shrink-0 shadow-md ring-1 ring-emerald-400/30">
                <Shield className="w-5 h-5 text-emerald-200" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-black text-sm sm:text-base md:text-lg tracking-tight text-white truncate">
                    D-mart Control Center
                  </h1>
                  {/* Status Badge */}
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="hidden xs:inline">LIVE PRODUCTION</span>
                    <span className="xs:hidden">LIVE</span>
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-emerald-300/80 truncate hidden xs:block">
                  {language === 'en'
                    ? 'Supermarket Fleet, Batch Inventory & Executive Suite'
                    : 'Suite Kawalan Pasaraya, Armada & Inventori'}
                </p>
              </div>
            </div>

            {/* Right: Reconciliation CSV Export, Operational Alert Bell, Language Switcher, & Preview Customer Store */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Quick Header Export Orders Reconciliation CSV Button */}
              <button
                type="button"
                id="header-export-orders-csv-btn"
                data-testid="header-export-orders-csv-btn"
                onClick={() => exportOrdersReconciliationCSV(orders)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:border-emerald-500/50"
                title={
                  language === 'en'
                    ? `Export all ${orders.length} orders into CSV for financial reconciliation`
                    : `Eksport ${orders.length} pesanan ke CSV untuk penyelarasan kewangan`
                }
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>{language === 'en' ? 'Export Orders CSV' : 'Eksport CSV'}</span>
              </button>

              {/* Operational Alert Notification Bell */}
              <div className="relative" ref={alertDropdownRef}>
                <button
                  type="button"
                  id="admin-alert-bell-btn"
                  onClick={() => setIsAlertsOpen((prev) => !prev)}
                  className={`relative p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer border ${
                    isAlertsOpen
                      ? 'bg-emerald-900/90 text-white border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-800'
                  }`}
                  title={
                    language === 'en'
                      ? `${totalAlertsCount} Operational Alerts`
                      : `${totalAlertsCount} Makluman Operasi`
                  }
                  aria-label="Operational Alerts"
                  aria-expanded={isAlertsOpen}
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  {totalAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] text-[10px] font-black rounded-full bg-rose-600 text-white flex items-center justify-center ring-2 ring-slate-950 animate-pulse">
                      {totalAlertsCount}
                    </span>
                  )}
                </button>

                {/* Operational Alert Center Dropdown Panel */}
                {isAlertsOpen && (
                  <div
                    id="admin-alert-center-dropdown"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    {/* Header */}
                    <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-white">
                            {language === 'en' ? 'Operational Alerts' : 'Makluman Operasi'}
                          </h3>
                          <p className="text-[10px] text-slate-400">
                            {language === 'en'
                              ? `${totalAlertsCount} items requiring action`
                              : `${totalAlertsCount} perkara perlu tindakan`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAlertsOpen(false)}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        aria-label="Close Alerts"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Alerts List */}
                    <div className="p-3 max-h-[70vh] overflow-y-auto space-y-2.5 text-xs">
                      {/* Alert 1: Critical Expiry */}
                      {criticalExpiryProducts.length > 0 && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-rose-900">
                                {language === 'en'
                                  ? `${criticalExpiryProducts.length} Critical Expiry SKUs`
                                  : `${criticalExpiryProducts.length} SKU Tamat Tempoh Kritikal`}
                              </p>
                              <p className="text-[11px] text-rose-700 leading-snug">
                                {language === 'en'
                                  ? 'Stock expiring in 5 days or less. Immediate discount or clearance recommended.'
                                  : 'Stok tamat tempoh dalam masa 5 hari atau kurang. Diskaun atau pelupusan segera dicadangkan.'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('inventory');
                              setIsAlertsOpen(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                          >
                            {language === 'en' ? 'Review' : 'Semak'}
                          </button>
                        </div>
                      )}

                      {/* Alert 2: Low Stock */}
                      {lowStockProducts.length > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Boxes className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-amber-900">
                                {language === 'en'
                                  ? `${lowStockProducts.length} Low Stock SKUs`
                                  : `${lowStockProducts.length} SKU Stok Rendah`}
                              </p>
                              <p className="text-[11px] text-amber-700 leading-snug">
                                {language === 'en'
                                  ? 'Items have 10 units or less remaining in active warehouse inventory.'
                                  : 'Barangan mempunyai baki 10 unit atau kurang di inventori gudang aktif.'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('inventory');
                              setIsAlertsOpen(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                          >
                            {language === 'en' ? 'Restock' : 'Tambah'}
                          </button>
                        </div>
                      )}

                      {/* Alert 3: Pending Rider Payouts */}
                      {pendingPayoutsList.length > 0 && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                              <DollarSign className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-emerald-900">
                                {language === 'en'
                                  ? `${pendingPayoutsList.length} Payouts Ready`
                                  : `${pendingPayoutsList.length} Pembayaran Sedia`}
                              </p>
                              <p className="text-[11px] text-emerald-700 leading-snug">
                                {language === 'en'
                                  ? `RM ${pendingPayoutsList.reduce((acc, p) => acc + p.totalPayout, 0).toFixed(2)} in rider commissions waiting for bank disbursement.`
                                  : `RM ${pendingPayoutsList.reduce((acc, p) => acc + p.totalPayout, 0).toFixed(2)} komisen rider sedia untuk pembayaran.`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('vault');
                              setIsAlertsOpen(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                          >
                            {language === 'en' ? 'Disburse' : 'Bayar'}
                          </button>
                        </div>
                      )}

                      {/* Alert 4: Pending Rider Onboarding */}
                      {pendingAppsCount > 0 && (
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Bike className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-blue-900">
                                {language === 'en'
                                  ? `${pendingAppsCount} Rider Applications`
                                  : `${pendingAppsCount} Permohonan Rider`}
                              </p>
                              <p className="text-[11px] text-blue-700 leading-snug">
                                {language === 'en'
                                  ? 'New delivery partner registrations awaiting IC & driving license verification.'
                                  : 'Pendaftaran rakan penghantar baharu menunggu pengesahan IC & lesen memandu.'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('fleet');
                              setIsAlertsOpen(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                          >
                            {language === 'en' ? 'Verify' : 'Sahkan'}
                          </button>
                        </div>
                      )}

                      {/* Alert 5: Open Support Tickets */}
                      {openTicketsCount > 0 && (
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                              <LifeBuoy className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-purple-900">
                                {language === 'en'
                                  ? `${openTicketsCount} Open Support Cases`
                                  : `${openTicketsCount} Kes Aduan Terbuka`}
                              </p>
                              <p className="text-[11px] text-purple-700 leading-snug">
                                {language === 'en'
                                  ? 'Customer complaints regarding delivery delays or damaged packaging.'
                                  : 'Aduan pelanggan berkaitan kelewatan penghantaran atau kerosakan bungkusan.'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('support');
                              setIsAlertsOpen(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] shrink-0 transition-colors cursor-pointer shadow-2xs"
                          >
                            {language === 'en' ? 'Resolve' : 'Selesaikan'}
                          </button>
                        </div>
                      )}

                      {/* All Clear State */}
                      {totalAlertsCount === 0 && (
                        <div className="py-6 px-4 text-center">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <p className="font-bold text-gray-800 text-sm">
                            {language === 'en' ? 'All Clear!' : 'Semua Bersih!'}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {language === 'en'
                              ? 'No critical stock, expiry, or pending payout alerts.'
                              : 'Tiada amaran stok kritikal, tamat tempoh, atau pembayaran tertunda.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Switcher (EN / BM) */}
              <button
                type="button"
                id="admin-language-switcher-btn"
                onClick={onToggleLanguage}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-800 shadow-2xs hover:border-emerald-600/50"
                aria-label="Toggle language"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-black">{language === 'en' ? 'EN' : 'BM'}</span>
              </button>

              {/* Preview Customer Store Toggle Button */}
              <button
                type="button"
                id="admin-preview-customer-store-btn"
                onClick={onBackToStore}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 sm:gap-2 shadow-md cursor-pointer border border-emerald-400/30 shrink-0 touch-manipulation active:scale-95"
                title={
                  language === 'en'
                    ? 'Exit Admin and Preview Live Customer Storefront'
                    : 'Keluar Admin dan Pratonton Kedai Pelanggan'
                }
              >
                <Store className="w-4 h-4 text-emerald-100 shrink-0" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'Preview Customer Store' : 'Pratonton Kedai'}
                </span>
                <span className="sm:hidden">{language === 'en' ? 'Store' : 'Kedai'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-200 hidden sm:inline" />
              </button>
            </div>
          </div>

          {/* Core Navigation Bar: Navigation Dropdown & Section Tabs */}
          <div className="py-2.5 border-t border-slate-800/80 relative" ref={navDropdownRef}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              
              {/* Navigation Dropdown Component (Interactive on all screen sizes) */}
              <div className="relative shrink-0">
                <div className="flex items-center justify-between gap-2 mb-1 px-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {language === 'en' ? 'Navigation Dropdown' : 'Menu Pilihan Navigasi'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'en' ? 'All 9 Core Sections' : 'Semua 9 Modul Utama'}
                  </span>
                </div>

                {/* Primary Navigation Dropdown Trigger Button */}
                <button
                  type="button"
                  id="navigation-dropdown-trigger"
                  data-testid="navigation-dropdown-trigger"
                  onClick={() => setIsNavDropdownOpen((prev) => !prev)}
                  className={`w-full lg:w-80 px-3.5 py-2.5 rounded-xl bg-slate-900 border flex items-center justify-between gap-3 text-xs font-bold transition-all shadow-md active:scale-[0.99] cursor-pointer touch-manipulation min-h-[50px] ${
                    isNavDropdownOpen
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  aria-expanded={isNavDropdownOpen}
                  aria-haspopup="listbox"
                  aria-label="Navigation Dropdown menu"
                  title="Admin Navigation Dropdown"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <CurrentTabIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-emerald-400 font-mono font-black">
                          #{currentTabConfig.num}
                        </span>
                        <span className="truncate block font-black text-white text-xs sm:text-sm leading-tight">
                          {currentTabConfig.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium truncate block">
                        {currentTabConfig.subLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentTabConfig.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black ${currentTabConfig.badgeColor}`}
                      >
                        {currentTabConfig.badge}
                      </span>
                    )}
                    {isNavDropdownOpen ? (
                      <ChevronUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expandable Navigation Dropdown Menu (Lists all 7 core Admin sections) */}
                {isNavDropdownOpen && (
                  <div
                    id="navigation-dropdown-menu"
                    data-testid="navigation-dropdown-menu"
                    className="absolute left-0 right-0 lg:right-auto lg:w-96 top-full mt-2 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[75vh] overflow-y-auto"
                    role="listbox"
                    aria-label="Core Admin Sections"
                  >
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase tracking-wider font-black text-slate-400 flex items-center justify-between">
                      <span>{language === 'en' ? 'Select Admin Section' : 'Pilih Modul Admin'}</span>
                      <span className="text-emerald-400 font-mono">1 - 9</span>
                    </div>

                    {tabsConfig.map((tab) => {
                      const TabIcon = tab.icon;
                      const isSelected = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          id={`nav-dropdown-option-${tab.num}`}
                          data-testid={`nav-dropdown-option-${tab.num}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsNavDropdownOpen(false);
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between gap-3 text-xs transition-all cursor-pointer min-h-[48px] touch-manipulation ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 font-black shadow-md ring-1 ring-emerald-400/50'
                              : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-slate-950/20 text-slate-950'
                                  : 'bg-slate-800 text-emerald-400'
                              }`}
                            >
                              <TabIcon className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0 flex flex-col">
                              <span className={`truncate text-xs ${isSelected ? 'font-black' : 'font-bold'}`}>
                                {tab.displayTitle}
                              </span>
                              <span
                                className={`text-[10px] truncate ${
                                  isSelected ? 'text-slate-900/80 font-semibold' : 'text-slate-400'
                                }`}
                              >
                                {tab.subLabel}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {tab.badge !== undefined && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                  isSelected
                                    ? 'bg-slate-950 text-emerald-300'
                                    : tab.badgeColor
                                }`}
                              >
                                {tab.badge}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-4 h-4 text-slate-950 shrink-0 stroke-[2.5]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Accessible native select for direct automated DOM selection & screen readers */}
              <div className="sr-only">
                <label htmlFor="admin-navigation-dropdown">
                  Admin Navigation Dropdown
                </label>
                <select
                  id="admin-navigation-dropdown"
                  name="adminNavigationDropdown"
                  aria-label="Navigation Dropdown menu"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value as AdminTabType)}
                >
                  {tabsConfig.map((tab) => (
                    <option key={tab.id} value={tab.id}>
                      {tab.displayTitle}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tablet & Desktop Horizontal Tab Bar (Screens >= 1024px or scrollable on md) */}
              <div
                id="admin-dashboard-tab-bar"
                className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5 text-xs font-bold scroll-smooth overscroll-x-contain"
                role="tablist"
                aria-label="Admin operations tabs"
              >
                {tabsConfig.map((tab) => {
                  const TabIcon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      id={`tab-btn-${tab.id}`}
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer touch-manipulation min-h-[40px] select-none active:scale-98 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-md ring-2 ring-emerald-400/50'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-700'
                      }`}
                    >
                      <TabIcon className="w-4 h-4 shrink-0" />
                      <span>{tab.displayTitle}</span>
                      {tab.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-black shrink-0 ${
                            isSelected
                              ? 'bg-slate-950 text-emerald-300'
                              : tab.badgeColor
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Sidebar Drawer Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div
            id="admin-mobile-sidebar-drawer"
            className="fixed inset-y-0 left-0 max-w-xs w-full bg-slate-900 border-r border-slate-800 text-white p-4 shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200 overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">D-mart Admin</h3>
                  <p className="text-[10px] text-slate-400">Sidebar Menu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="space-y-1.5 flex-1" aria-label="Mobile Sidebar Menu">
              {tabsConfig.map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    id={`mobile-sidebar-item-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-emerald-400'
                        }`}
                      >
                        <TabIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="truncate block font-black">{tab.label}</span>
                        <span className={`text-[10px] truncate block ${isSelected ? 'text-slate-900/80 font-medium' : 'text-slate-400'}`}>
                          {tab.subLabel}
                        </span>
                      </div>
                    </div>
                    {tab.badge !== undefined && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isSelected ? 'bg-slate-950 text-emerald-300' : tab.badgeColor}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Drawer Quick Export Orders Reconciliation Button */}
            <div className="pt-3 mt-3 border-t border-slate-800">
              <button
                type="button"
                id="mobile-export-orders-reconciliation-btn"
                data-testid="mobile-export-orders-reconciliation-btn"
                onClick={() => {
                  exportOrdersReconciliationCSV(orders);
                  setIsSidebarOpen(false);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-between transition-colors cursor-pointer border border-slate-700/80"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <span>{language === 'en' ? 'Export Orders CSV' : 'Eksport CSV'}</span>
                </div>
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport Container with Dedicated Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col lg:flex-row gap-6 items-start">
        {/* Dedicated Admin Dashboard Sidebar Menu */}
        <aside
          id="admin-dashboard-sidebar"
          data-testid="admin-dashboard-sidebar"
          className="hidden lg:block w-64 xl:w-72 shrink-0 space-y-4 sticky top-28"
          aria-label="Admin Dashboard Sidebar Menu"
        >
          <div className="bg-white rounded-3xl border border-gray-200/90 p-3.5 shadow-xs">
            <div className="flex items-center justify-between px-2.5 pb-3 mb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-700">
                  {language === 'en' ? 'Sidebar Menu' : 'Menu Sisi'}
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono">
                9 {language === 'en' ? 'Sections' : 'Modul'}
              </span>
            </div>

            <nav className="space-y-1" aria-label="Admin Sidebar Navigation">
              {tabsConfig.map((tab) => {
                const TabIcon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    id={`sidebar-item-${tab.id}`}
                    data-testid={`sidebar-item-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-3 py-2.5 rounded-2xl text-left flex items-center justify-between gap-2.5 text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white font-black shadow-xs ring-1 ring-emerald-500/50'
                        : 'text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-950 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-black'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <TabIcon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <span className="truncate block text-xs leading-tight">
                          {tab.label}
                        </span>
                        <span
                          className={`text-[10px] truncate block font-medium ${
                            isSelected ? 'text-emerald-300' : 'text-gray-400'
                          }`}
                        >
                          {tab.subLabel}
                        </span>
                      </div>
                    </div>
                    {tab.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-black shrink-0 ${
                          isSelected ? 'bg-emerald-400 text-slate-950' : tab.badgeColor
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Export Orders for Financial Reconciliation Card */}
            <div className="mt-3.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                id="sidebar-export-orders-reconciliation-btn"
                data-testid="sidebar-export-orders-reconciliation-btn"
                onClick={() => exportOrdersReconciliationCSV(orders)}
                className="w-full p-2.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 text-emerald-950 transition-all flex items-center justify-between gap-2 text-xs font-bold shadow-2xs group cursor-pointer"
                title={language === 'en' ? 'Export orders manifest to CSV for financial reconciliation' : 'Eksport pesanan ke CSV untuk penyelarasan kewangan'}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left min-w-0">
                    <span className="block text-xs font-black truncate">{language === 'en' ? 'Export Orders CSV' : 'Eksport CSV Pesanan'}</span>
                    <span className="block text-[10px] text-emerald-700 truncate font-mono">
                      {orders.length} {language === 'en' ? 'audit records' : 'rekod audit'}
                    </span>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-emerald-700 shrink-0 group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 w-full">
          {/* 1. Inventory & Catalog */}
          {activeTab === 'inventory' && (
            <AdminInventoryTab
              products={products}
              onUpdateProducts={onUpdateProducts}
              categories={categories}
              onUpdateCategories={handleUpdateCategories}
              language={language}
            />
          )}

          {/* 2. Live Orders & Dispatch Management */}
          {activeTab === 'dispatch' && (
            <AdminDispatchTab
              orders={orders}
              onUpdateOrderStatus={onUpdateOrderStatus}
              language={language}
            />
          )}

          {/* 3. Marketing & Holiday Banners */}
          {activeTab === 'marketing' && (
            <AdminMarketingTab
              coupons={coupons}
              onUpdateCoupons={setCoupons}
              banners={banners}
              onUpdateBanners={handleUpdateBanners}
              broadcasts={broadcasts}
              onUpdateBroadcasts={setBroadcasts}
              categories={categories}
              language={language}
              partners={merchantPartners}
              onUpdatePartners={setMerchantPartners}
              partnerLedger={partnerLedger}
              onRouteBannerSale={handleRouteBannerSale}
              onNavigateTab={setActiveTab}
            />
          )}

          {/* 4. Financial Ledger & Closures & 5. Rider Financial Accounts */}
          {(activeTab === 'finance' || activeTab === 'vault' || activeTab === 'rider_ledger') && (
            <AdminFinanceLedgerTab
              documents={documents}
              payouts={payouts}
              bankInfo={bankInfo}
              onUpdatePayoutStatus={onUpdatePayoutStatus}
              onUpdateBankInfo={onUpdateBankInfo}
              orders={orders}
              language={language}
              partners={merchantPartners}
              partnerLedger={partnerLedger}
              onUpdatePartners={setMerchantPartners}
              onUpdatePartnerLedger={setPartnerLedger}
              applications={applications}
              onUpdateApplicationStatus={onUpdateApplicationStatus}
              initialSubTab={activeTab === 'rider_ledger' ? 'rider_accounts' : undefined}
            />
          )}

          {/* 5. Merchants & Store Partners */}
          {activeTab === 'merchants' && (
            <AdminMerchantsTab
              language={language}
              partners={merchantPartners}
              onUpdatePartners={setMerchantPartners}
              partnerLedger={partnerLedger}
              products={products}
            />
          )}

          {/* 6. Rider & Fleet Approvals */}
          {activeTab === 'fleet' && (
            <AdminFleetTab
              applications={applications}
              onUpdateApplicationStatus={onUpdateApplicationStatus}
              language={language}
            />
          )}

          {/* 7. System Settings & Compliance */}
          {activeTab === 'settings' && (
            <AdminComplianceSettingsTab
              promoSettings={promoSettings}
              onUpdatePromoSettings={onUpdatePromoSettings}
              shippingSettings={shippingSettings}
              onUpdateShippingSettings={onUpdateShippingSettings}
              documents={documents}
              onUpdateDocuments={onUpdateDocuments}
              subAdmins={subAdmins}
              onUpdateSubAdmins={setSubAdmins}
              activeProfile={activeProfile}
              onChangeActiveProfile={setActiveProfile}
              language={language}
            />
          )}

          {/* 8. Dedicated PDF Settings */}
          {activeTab === 'pdf_settings' && (
            <AdminPdfSettingsPanel language={language} />
          )}

          {/* Dedicated Support Desk view */}
          {activeTab === 'support' && (
            <AdminSupportTab
              tickets={tickets}
              onUpdateTicket={onUpdateTicket}
              language={language}
            />
          )}
        </main>
      </div>
    </div>
  );
};
