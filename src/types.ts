export type Language = 'en' | 'ms';

export type MainCategory =
  | 'all'
  | 'fresh_products'
  | 'daily_groceries'
  | 'snacks_and_drinks'
  | 'meats'
  | 'cleaning_products'
  | 'pet_foods';

export type SubCategory =
  // Fresh Products & Groceries sub-items
  | 'fruits'
  | 'vegetables'
  | 'side_by_side'
  // Daily Groceries
  | 'canned_foods'
  | 'rice_oil'
  | 'dairy_eggs'
  // Snacks & Drinks
  | 'drinks'
  | 'snacks'
  // Meats
  | 'poultry'
  | 'beef_lamb'
  | 'seafood'
  // Cleaning
  | 'dishwashing'
  | 'laundry'
  | 'disinfectant'
  | 'paper'
  // Pet Foods
  | 'cat_food'
  | 'dog_food'
  | 'pet_hygiene';

// Dynamic Product Model for centralized daily pricing & stock management (Firebase-ready)
export interface ProductModel {
  id: string;
  name: string;
  category: MainCategory | string;
  category_id?: string;
  categoryId?: string;
  price: number;
  old_price?: number | null;
  image_url: string;
  is_available: boolean;
  updated_at: string;
  // Multilingual and supermarket metadata
  name_ms?: string;
  sub_category?: SubCategory | string;
  secondary_categories?: (MainCategory | string)[];
  amount?: string;
  amount_ms?: string;
  unit?: string;
  unit_ms?: string;
  description?: string;
  description_ms?: string;
  stock_count?: number;
  halal?: boolean;
  featured?: boolean;
  badge?: string;
  badge_ms?: string;
  bundle_badge?: string;
  bundle_badge_ms?: string;
  bundle_type?: 'bogo' | 'combo' | 'value_pack' | 'multipack' | string;
  is_bundle?: boolean;
  barcode?: string; // Standard EAN-13 / UPC / Code-128 barcode number
  barcode_alt?: string[];
  batch_number?: string;
  batchNumber?: string;
  expiry_date?: string;
  expiryDate?: string;
  manufacturing_date?: string;
  manufacturingDate?: string;
  cost_price?: number;
  costPrice?: number;
  low_stock_threshold?: number;
  lowStockThreshold?: number;
  pointsReward?: number;
  points_reward?: number;
}

export interface PromoConfig {
  announcementBar: {
    enabled: boolean;
    textEn: string;
    textMs: string;
    minOrderAmount: number;
    highlightAmount: string;
    showRiderOrders?: boolean;
    showSplashPreview?: boolean;
  };
  orderStatusBanner: {
    enabled: boolean;
    status: string;
    statusTextEn: string;
    statusTextMs: string;
    estimatedDeliveryTime: string;
    showLiveMapButton?: boolean;
  };
  specialVouchers: Voucher[];
}

export interface Product extends ProductModel {
  nameEn: string;
  nameMs: string;
  mainCategory: MainCategory;
  subCategory: SubCategory;
  secondaryCategories?: MainCategory[]; // for cross-department listings like daily groceries containing meats and veggies
  originalPrice?: number;
  amountEn: string; // amount / packaging size e.g. "1kg", "Tray of 30", "Can 425g"
  amountMs: string;
  unitEn: string;
  unitMs: string;
  image: string;
  descriptionEn: string;
  descriptionMs: string;
  inStock: boolean;
  stockCount: number;
  halal: boolean;
  featured?: boolean;
  badge?: string;
  badgeMs?: string;
  bundleBadge?: string;
  bundleBadgeMs?: string;
  bundleType?: 'bogo' | 'combo' | 'value_pack' | 'multipack' | string;
  isBundle?: boolean;
  barcode?: string;
  barcodeAlt?: string[];
  batchNumber?: string;
  batch_number?: string;
  expiryDate?: string;
  expiry_date?: string;
  manufacturingDate?: string;
  manufacturing_date?: string;
  costPrice?: number;
  cost_price?: number;
  lowStockThreshold?: number;
  low_stock_threshold?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  phone: string;
  isLoggedIn: boolean;
  profileCompleted?: boolean;
  role?: 'admin' | 'buyer' | 'rider';
  loyaltyPoints?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DeliveryAddress {
  recipientName: string;
  phone: string;
  street: string;
  buildingUnit: string;
  postcode: string;
  city: string;
  state: string;
  notes: string;
  coordinates: Coordinates;
  formattedAddress: string;
}

export type PaymentMethodType = 'COD' | 'FPX' | 'TNG';

export interface Voucher {
  code: string;
  titleEn: string;
  titleMs: string;
  subtitleEn: string;
  subtitleMs: string;
  discountType: 'fixed' | 'percent' | 'free_delivery';
  discountValue: number;
  minSpend: number;
  badgeEn?: string;
  badgeMs?: string;
  expiresInTextEn: string;
  expiresInTextMs: string;
  colorTheme: 'emerald' | 'amber' | 'rose' | 'blue' | 'purple';
}

export interface OrderReviewData {
  rating: number; // 1 to 5
  comment: string;
  tags: string[];
  submittedAt: string;
}

export interface CustomerFeedback {
  id: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tip?: number;
  total: number;
  deliveryAddress: DeliveryAddress;
  deliverySlot: string;
  deliverySlotMs: string;
  paymentMethod: PaymentMethodType;
  paymentDetails?: {
    bankName?: string;
    tngPhone?: string;
    tngRef?: string;
  };
  status: 'submitted' | 'received' | 'packing' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled';
  orderStatus?: 'submitted' | 'received' | 'packing' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled';
  estimatedDeliveryTime: string;
  estimatedDeliveryTimestamp?: number;
  deliveryOtp?: string;
  deliveryOtpVerified?: boolean;
  review?: OrderReviewData;
  customerFeedback?: CustomerFeedback[];
  pointsRedeemed?: number;
  pointsDiscount?: number;
  pointsEarned?: number;
}

export interface DeliveryPartnerApplication {
  id: string;
  referenceNo: string;
  fullName: string;
  nationality?: string;
  idNumber: string; // ID / IC Number (رقم الهوية)
  phoneNumber: string;
  address: string;
  vehicleType: 'motorcycle' | 'car' | 'van' | 'bicycle';
  plateNumber: string; // Vehicle / Motorcycle Registration Number
  licenseDocName?: string;
  licenseDocUrl?: string;
  submittedAt: string;
  status: 'pending' | 'submitted_waiting_approval' | 'under_review' | 'approved' | 'rejected';
  // Rider Banking & Earnings Details:
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  iban?: string;
  availableBalance?: number;
  totalWithdrawn?: number;
  lastPayoutDate?: string; // YYYY-MM-DD format for 1-payout-per-day enforcement
}

export interface RiderPayoutRequest {
  id: string;
  riderId: string;
  riderName: string;
  riderPhone?: string;
  amount: number;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    iban?: string;
  };
  status: 'Pending' | 'Completed';
  requestedAt: string;
  requestDate: string; // YYYY-MM-DD
  processedAt?: string;
  notes?: string;
}

export interface RiderTransactionRecord {
  id: string;
  type: 'delivery_earning' | 'payout_withdrawal';
  amount: number;
  description: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Processing';
  referenceNo?: string;
}

export interface RiderLedgerOrderEntry {
  id: string;
  orderNumber: string;
  orderId?: string;
  customerName: string;
  customerPhone?: string;
  completedAt: string;
  paymentType: 'Cash on Delivery' | 'Online / Card Payment';
  paymentMethod: 'cod' | 'fpx' | 'tng' | 'card';
  grossOrderAmount: number;
  deliveryEarning: number;
  platformCommission: number;
  cashCollected: number; // Debited (cash in hand pocketed by rider)
  onlineEarnings: number; // Credited (owed to rider by platform)
  netAmountEffect: number; // Net amount credited (+) or debited (-)
  runningBalance: number;
  notes?: string;
  status: 'Completed' | 'Pending Settlement';
}

export interface RiderManualAdjustment {
  id: string;
  riderId: string;
  riderName?: string;
  type: 'credit' | 'debit';
  reason: 'cash_handover_settled' | 'commission_rebate' | 'bonus' | 'penalty_correction' | 'manual_adjustment';
  reasonLabel: string;
  amount: number;
  referenceNo: string;
  createdAt: string;
  adminName: string;
  notes?: string;
}

export interface RiderClearingSummary {
  riderId: string;
  riderName: string;
  riderPhone?: string;
  totalCashCollected: number;
  totalOnlineEarnings: number;
  totalCommissionFees: number;
  netLedgerBalance: number; // (Total Online Earnings) - (Platform Commissions) - (Total Cash Collected)
  totalWithdrawn: number;
  withdrawableBalance: number;
  isOwedToPlatform: boolean;
  amountOwedToPlatform: number;
}

export interface DeliveryOrderItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export interface DeliveryJobOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  buildingUnit?: string;
  city: string;
  postcode: string;
  dropoffNotes?: string;
  distanceKm: number;
  estimatedTimeMin: number;
  earningsPayout: number;
  itemsCount: number;
  itemsSummary: string;
  itemsList: DeliveryOrderItem[];
  orderTotal: number;
  paymentMethod: 'cod' | 'fpx' | 'tng';
  codAmountToCollect?: number;
  pickupHub: string;
  pickupAddress: string;
  deliverySlot: string;
  status: 'available' | 'accepted' | 'picked_up' | 'out_for_delivery' | 'delivered';
  urgency: 'express' | 'standard';
  deliveryOtp?: string;
  deliveryOtpVerified?: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export type GeminiModelId = 'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview' | 'gemini-3.8-flash';

export type ChatRolePersona = 'shopper' | 'chef' | 'budget' | 'halal';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  isDemoFallback?: boolean;
}

export type AdminTabType =
  | 'inventory'
  | 'dispatch'
  | 'marketing'
  | 'finance'
  | 'rider_ledger'
  | 'merchants'
  | 'fleet'
  | 'settings'
  | 'vault'
  | 'support'
  | 'analytics'
  | 'rbac';

export interface MerchantPartner {
  id: string;
  code?: string; // e.g. "MERCH-8821"
  name: string;
  businessType: 'farm_supplier' | 'bakery' | 'butchery' | 'wholesale_grocer' | 'fmcg_distributor';
  contactPerson: string;
  phone: string;
  email: string;
  commissionRate: number; // e.g. 10%
  payoutTerms: 'weekly' | 'net_15' | 'net_30';
  bankName: string;
  accountNumber: string;
  status: 'active' | 'inactive' | 'under_review' | 'contract_pending' | 'archived';
  totalSuppliedItems: number;
  totalSettlementDue: number;
  joinedDate: string;
  bannerRevenueRouted?: number;
  bannerOrdersCount?: number;
  replacementNotes?: string;
  replacedPartnerId?: string;
  replacedPartnerName?: string;
  archivedAt?: string;
}

export interface PartnerLedgerEntry {
  id: string;
  merchantCode: string;
  merchantName: string;
  bannerId?: string;
  bannerTitle?: string;
  date: string;
  timestamp: string;
  orderRef: string;
  description: string;
  grossAmount: number;
  commissionRate: number;
  platformFee: number;
  netPayableToPartner: number;
  status: 'routed' | 'settled' | 'pending';
  source: 'storefront_banner' | 'direct_product_sale' | 'b2b_wholesale';
}

export interface DailyClosureRecord {
  id: string;
  closureDate: string;
  registerId?: string;
  shift?: string;
  cashOpening: number;
  cashSales: number;
  fpxSales: number;
  tngSales: number;
  cardSales: number;
  totalGrossSales: number;
  totalDiscounts: number;
  deliveryFeesCollected: number;
  cogs?: number;
  netRevenue: number;
  netProfit?: number;
  drawerExpectedCash: number;
  drawerActualCash: number;
  variance: number;
  closedBy: string;
  verifiedBy: string;
  status: 'balanced' | 'flagged_variance' | 'pending_audit';
  notes: string;
}

export interface ManualLedgerTransaction {
  id: string;
  type: 'manual_payout' | 'incoming_settlement';
  entityType: 'store_merchant' | 'supplier' | 'rider';
  entityId: string;
  entityName: string;
  entityCode?: string;
  amount: number;
  paymentMethod: string;
  referenceNo: string;
  notes: string;
  timestamp: string;
  recordedBy: string;
  status: 'completed' | 'pending_audit';
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderNumber: string;
  issueType: 'missing_item' | 'late_delivery' | 'damaged_goods' | 'wrong_item' | 'refund_request';
  subject: string;
  description: string;
  priority: 'urgent' | 'high' | 'normal';
  status: 'open' | 'investigating' | 'resolved' | 'refunded';
  createdAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  refundAmount?: number;
  refundTxId?: string;
  refundWalletCredited?: boolean;
}

export interface BusinessDocument {
  id: string;
  title: string;
  documentType: 'ssm_registration' | 'jakim_halal' | 'dbkl_premise_license' | 'insurance_policy' | 'food_safety_cert';
  regNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  status: 'active' | 'renewal_pending' | 'verified';
  fileName: string;
  fileSize: string;
  notes: string;
}

export interface RiderPayout {
  id: string;
  riderId: string;
  riderName: string;
  riderPhone: string;
  vehiclePlate: string;
  bankName: string;
  accountNumber: string;
  totalDeliveries: number;
  basePay: number;
  tipsCollected: number;
  performanceBonus: number;
  totalPayout: number;
  period: string;
  status: 'paid' | 'processing' | 'ready_for_payout';
  paidAt?: string;
}

export interface ShippingSettings {
  baseFee: number;
  perKmRate: number;
  freeDeliveryThreshold: number;
  surgeMultiplier: number;
  expressDeliveryFee: number;
  maxDeliveryRadiusKm: number;
}

export interface StoreBankInfo {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  swiftBic: string;
  branch: string;
  payoutFrequency: 'daily' | 'weekly' | 'bi-weekly';
}

export interface ManagedSubCategory {
  id: string;
  key?: string;
  slug?: string;
  nameEn: string;
  nameMs: string;
  itemCount: number;
}

export interface ManagedCategory {
  id: string;
  key?: string;
  slug?: string;
  nameEn: string;
  nameMs: string;
  descriptionEn?: string;
  descriptionMs?: string;
  icon?: string;
  iconName?: string;
  color: string;
  itemCount: number;
  isActive: boolean;
  subCategories: ManagedSubCategory[];
}

export interface FleetRider {
  id: string;
  name: string;
  phone: string;
  plate: string;
  vehicleType: 'motorcycle' | 'car' | 'van';
  status: 'idle' | 'assigned' | 'picked_up' | 'delivering' | 'en_route_hub' | 'offline';
  currentOrderId?: string;
  currentOrderNumber?: string;
  destination: string;
  etaMin: number;
  lat: number;
  lng: number;
  battery: string;
  speed: string;
  walletBalance: number;
  codCollected: number;
  rating: number;
  completedDeliveries: number;
}

export interface RiderWalletTransaction {
  id: string;
  riderId: string;
  riderName: string;
  type: 'delivery_payout' | 'cod_settlement' | 'incentive_bonus' | 'withdrawal' | 'credit' | 'deduction';
  amount: number;
  notes: string;
  createdAt: string;
  referenceNo: string;
}

export interface PromoCoupon {
  id: string;
  code: string;
  descriptionEn: string;
  descriptionMs: string;
  discountType: 'fixed' | 'percent' | 'percentage' | 'free_shipping' | 'free_delivery';
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  usageLimit: number;
  usageCount: number;
  startDate: string;
  endDate?: string;
  expiryDate?: string;
  targetCategory?: string;
  isActive?: boolean;
  status?: 'active' | 'expired' | 'disabled';
  categoryScope?: string;
}

export interface MarketingBanner {
  id: string;
  titleEn: string;
  titleMs: string;
  subtitleEn: string;
  subtitleMs: string;
  imageUrl: string;
  ctaTextEn: string;
  ctaTextMs: string;
  targetCategory?: string;
  badgeEn?: string;
  badgeMs?: string;
  categoryLabel?: string;
  category_label?: string;
  ctaText?: string;
  cta_text?: string;
  backgroundColor?: string;
  themeColor?: string;
  priority?: number;
  isActive: boolean;
  displayOrder?: number;
  // Aliases and flexible Firestore fields
  title?: string;
  subtitle?: string;
  image_url?: string;
  target_category?: string;
  is_active?: boolean;
  status?: string;
  created_at?: any;
  createdAt?: string;
  updated_at?: any;
  updatedAt?: string;
  // Financial Routing & Settlement Ledger fields:
  merchantCode?: string; // e.g., 'MERCH-8821'
  merchantName?: string;
  revenueRouted?: number;
  salesCount?: number;
  commissionRate?: number; // Platform commission % (e.g., 10%)
  commissionEarned?: number;
  netSettlementDue?: number;
  settlementStatus?: 'pending' | 'settled' | 'processing';
  // Overlay Visibility Toggles & Clean Image Banner Mode
  showCTA?: boolean;
  showCta?: boolean;
  showCtaButton?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showBadges?: boolean;
  showBadge?: boolean;
  showBadgeTag?: boolean;
  showCategoryBadge?: boolean;
}

export interface PushNotificationBroadcast {
  id: string;
  titleEn: string;
  titleMs: string;
  bodyEn: string;
  bodyMs: string;
  targetAudience: 'all' | 'all_shoppers' | 'inactive_7d' | 'high_value' | 'riders' | 'fresh_produce_buyers' | 'cart_abandoners';
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent';
  reachCount?: number;
  recipientCount?: number;
  clickCount?: number;
  openRateEstimated?: string | number;
}

export type AdminRoleType =
  | 'super_admin'
  | 'warehouse_manager'
  | 'fleet_operator'
  | 'marketing_specialist'
  | 'support_agent'
  | 'financial_auditor';

export interface AdminPermissionSet {
  canManageInventory: boolean;
  canManageBatches: boolean;
  canViewFleetMap: boolean;
  canReassignOrders: boolean;
  canManageRiderWallets: boolean;
  canManagePromotions: boolean;
  canLaunchPushBroadcasts: boolean;
  canViewSalesAnalytics: boolean;
  canExportFinancialReports: boolean;
  canProcessRefunds: boolean;
  canCloseTickets: boolean;
  canManageSubAdmins: boolean;
  canChangeAppSettings: boolean;
}

export interface SubAdminProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: AdminRoleType;
  department: string;
  status: 'active' | 'suspended' | 'invited';
  lastActive: string;
  permissions: AdminPermissionSet;
}

export interface PdfConfigSettings {
  companyName: string;
  ssmRegistrationNumber: string;
  headerSubtitle: string;
  officialAddress: string;
  supportContact: string;
  footerDisclaimer: string;
  certificateText: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PDF_CONFIG: PdfConfigSettings = {
  companyName: 'D-mart Supermarket & Retail Logistics',
  ssmRegistrationNumber: '202301048821 (1542109-M)',
  headerSubtitle: 'FLEET LOGISTICS & COURIER DISPATCH • OFFICIAL TREASURY CLEARING & STATEMENTS',
  officialAddress: 'Level 8, Menara D-mart, Bangsar South, 59200 Kuala Lumpur, Malaysia',
  supportContact: 'Phone: +60 3-8912 8820 • Email: treasury-ops@d-mart.my',
  footerDisclaimer: 'This official statement is generated directly from the D-mart Supermarket Retail & Fleet Operations Portal. Certified valid under the Malaysian Digital Signature Act 1997.',
  certificateText: 'OFFICIALLY AUDITED & CERTIFIED • D-MART RETAIL HOLDINGS SDN. BHD.',
};

export interface StorefrontCopySettings {
  announcementBarText: string;
  announcementBarTextMs?: string;
  storeBadgeText: string;
  footerBrandTitle: string;
  footerBrandSubtitle: string;
  footerPaymentMethodsText: string;
  footerCopyrightNotice: string;
  // Hero & Category Section Headlines
  heroBadgeTag: string;
  heroBadgeTagMs?: string;
  heroMainHeadline: string;
  heroMainHeadlineMs?: string;
  heroSubHeadline: string;
  heroSubHeadlineMs?: string;
  categorySectionTitle: string;
  categorySectionTitleMs?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_STOREFRONT_COPY: StorefrontCopySettings = {
  announcementBarText: 'FREE Delivery on orders over RM 60 • Halal Certified Fresh Groceries',
  announcementBarTextMs: 'Penghantaran PERCUMA untuk pesanan melebihi RM 60 • Barangan Runcit Segar Disahkan Halal',
  storeBadgeText: 'PASARAYA',
  footerBrandTitle: 'D-mart Malaysia',
  footerBrandSubtitle: 'Your Neighbourhood Online Supermarket',
  footerPaymentMethodsText: "Cash on Delivery (COD) • FPX Online Banking • Touch 'n Go eWallet • Google Maps Location",
  footerCopyrightNotice: '© 2026 D-mart Supermarket Sdn. Bhd.',
  heroBadgeTag: 'Fresh Groceries Delivered in 2 Hours',
  heroBadgeTagMs: 'Penghantaran Segar Dalam 2 Jam',
  heroMainHeadline: 'D-mart Supermarket Malaysia',
  heroMainHeadlineMs: 'Pasaraya D-mart Malaysia',
  heroSubHeadline: 'Farm-fresh vegetables, seafood, poultry, pantry staples, and daily home essentials.',
  heroSubHeadlineMs: 'Sayur-sayuran segar, makanan laut, ayam, beras & keperluan harian sekeluarga.',
  categorySectionTitle: 'Shop by Supermarket Department',
  categorySectionTitleMs: 'Beli Mengikut Jabatan Pasaraya',
};

export type LoyaltyTransactionType = 'earned' | 'spent' | 'bonus' | 'refund';

export interface LoyaltyTransaction {
  id: string;
  type: LoyaltyTransactionType;
  amount: number; // positive (e.g. +35) or negative (e.g. -50)
  titleEn: string;
  titleMs: string;
  orderReference?: string;
  date: string;
  notesEn?: string;
  notesMs?: string;
  balanceAfter?: number;
}

export type GamificationBadgeCategory = 'orders' | 'loyalty' | 'food' | 'eco';

export interface GamificationBadge {
  id: string;
  titleEn: string;
  titleMs: string;
  descriptionEn: string;
  descriptionMs: string;
  category: GamificationBadgeCategory;
  icon: 'shopping-bag' | 'sparkles' | 'award' | 'leaf' | 'crown' | 'star' | 'clock' | 'heart' | 'tag';
  unlocked: boolean;
  unlockedAt?: string;
  progressCurrent: number;
  progressTarget: number;
  progressUnitEn: string;
  progressUnitMs: string;
  bonusPointsReward?: number;
  colorScheme: 'emerald' | 'amber' | 'purple' | 'blue' | 'rose' | 'orange';
}


