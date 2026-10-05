import React, { useState, useRef } from 'react';
import {
  Tag,
  Plus,
  Send,
  Image,
  Bell,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  Eye,
  Sliders,
  AlertCircle,
  Percent,
  DollarSign,
  Truck,
  Smartphone,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  Upload,
  Camera,
  ImagePlus,
  Building2,
  Landmark,
  Wallet,
  ExternalLink,
  ShieldCheck,
  Zap,
  X,
  RotateCcw,
  Edit3
} from 'lucide-react';
import {
  PromoCoupon,
  MarketingBanner,
  PushNotificationBroadcast,
  Language,
  ManagedCategory,
  MerchantPartner,
  PartnerLedgerEntry
} from '../../types';
import { INITIAL_MERCHANT_PARTNERS, INITIAL_PARTNER_LEDGER_ENTRIES } from '../../data/adminInitialData';
import { saveBannerToFirestore, deleteBannerFromFirestore } from '../../firebase_config';

interface AdminMarketingTabProps {
  coupons: PromoCoupon[];
  onUpdateCoupons: (coupons: PromoCoupon[]) => void;
  banners: MarketingBanner[];
  onUpdateBanners: (banners: MarketingBanner[]) => void;
  broadcasts: PushNotificationBroadcast[];
  onUpdateBroadcasts: (broadcasts: PushNotificationBroadcast[]) => void;
  categories: ManagedCategory[];
  language: Language;
  partners?: MerchantPartner[];
  onUpdatePartners?: (partners: MerchantPartner[]) => void;
  partnerLedger?: PartnerLedgerEntry[];
  onRouteBannerSale?: (bannerId: string, amount: number) => void;
  onNavigateTab?: (tab: any) => void;
}

export const AdminMarketingTab: React.FC<AdminMarketingTabProps> = ({
  coupons,
  onUpdateCoupons,
  banners,
  onUpdateBanners,
  broadcasts,
  onUpdateBroadcasts,
  categories,
  language,
  partners,
  onUpdatePartners,
  partnerLedger,
  onRouteBannerSale,
  onNavigateTab,
}) => {
  const [subTab, setSubTab] = useState<'coupons' | 'banners' | 'broadcast'>('coupons');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File Upload & Camera Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageFileMeta, setImageFileMeta] = useState<{ name: string; size: string } | null>(null);
  const [selectedLedgerBanner, setSelectedLedgerBanner] = useState<MarketingBanner | null>(null);

  const partnersList = partners || INITIAL_MERCHANT_PARTNERS;
  const ledgerList = partnerLedger || INITIAL_PARTNER_LEDGER_ENTRIES;

  // Coupon Creation Modal State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<PromoCoupon>>({
    code: '',
    descriptionEn: '',
    descriptionMs: '',
    discountType: 'percentage',
    discountValue: 15,
    minSpend: 30,
    maxDiscount: 10,
    usageLimit: 500,
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    status: 'active',
  });

  // Banner Creation & Editing Modal State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [newBanner, setNewBanner] = useState<Partial<MarketingBanner>>({
    titleEn: '',
    titleMs: '',
    subtitleEn: '',
    subtitleMs: '',
    badgeEn: 'SPECIAL PROMO',
    badgeMs: 'PROMOSI KHAS',
    categoryLabel: '',
    imageUrl: '',
    themeColor: 'emerald',
    ctaTextEn: 'Shop Now',
    ctaTextMs: 'Beli Sekarang',
    targetCategory: 'fresh_products',
    isActive: true,
    showCTA: true,
    showCta: true,
    showCtaButton: true,
    showTitle: true,
    showSubtitle: true,
    showBadges: true,
    showBadge: true,
    showBadgeTag: true,
    showCategoryBadge: true,
    priority: banners.length + 1,
    merchantCode: '',
    merchantName: undefined,
  });

  // Broadcast Composer State
  const [broadcastTitleEn, setBroadcastTitleEn] = useState('');
  const [broadcastTitleMs, setBroadcastTitleMs] = useState('');
  const [broadcastBodyEn, setBroadcastBodyEn] = useState('');
  const [broadcastBodyMs, setBroadcastBodyMs] = useState('');
  const [broadcastAudience, setBroadcastAudience] = useState<PushNotificationBroadcast['targetAudience']>('all_shoppers');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Image Processing Helpers
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setNewBanner((prev) => ({ ...prev, imageUrl: result }));
        setImageFileMeta({
          name: file.name,
          size: `${(file.size / 1024).toFixed(1)} KB`,
        });
        showToast(language === 'en' ? 'Banner image loaded successfully!' : 'Imej sepanduk berjaya dimuat naik!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Coupon Handlers
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;

    const formattedCode = newCoupon.code.toUpperCase().trim();
    const created: PromoCoupon = {
      id: `cpn-${Date.now().toString().slice(-6)}`,
      code: formattedCode,
      descriptionEn: newCoupon.descriptionEn || `${newCoupon.discountValue}% OFF on orders above RM ${newCoupon.minSpend}`,
      descriptionMs: newCoupon.descriptionMs || `Diskaun ${newCoupon.discountValue}% untuk pesanan melebihi RM ${newCoupon.minSpend}`,
      discountType: newCoupon.discountType || 'percentage',
      discountValue: Number(newCoupon.discountValue) || 10,
      minSpend: Number(newCoupon.minSpend) || 25,
      maxDiscount: newCoupon.maxDiscount ? Number(newCoupon.maxDiscount) : undefined,
      usageLimit: Number(newCoupon.usageLimit) || 500,
      usageCount: 0,
      startDate: newCoupon.startDate || new Date().toISOString().slice(0, 10),
      expiryDate: newCoupon.expiryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'active',
      targetCategory: newCoupon.targetCategory,
    };

    onUpdateCoupons([created, ...coupons]);
    setIsCouponModalOpen(false);
    setNewCoupon({
      code: '',
      descriptionEn: '',
      descriptionMs: '',
      discountType: 'percentage',
      discountValue: 15,
      minSpend: 30,
      maxDiscount: 10,
      usageLimit: 500,
      startDate: new Date().toISOString().slice(0, 10),
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'active',
    });
    showToast(language === 'en' ? `Coupon "${formattedCode}" created successfully!` : `Kupon "${formattedCode}" berjaya dicipta!`);
  };

  const handleToggleCouponStatus = (id: string) => {
    const updated = coupons.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status: (c.status === 'active' ? 'paused' : 'active') as PromoCoupon['status'],
        };
      }
      return c;
    });
    onUpdateCoupons(updated);
    showToast(language === 'en' ? 'Coupon status toggled.' : 'Status kupon dikemaskini.');
  };

  const handleDeleteCoupon = (id: string) => {
    onUpdateCoupons(coupons.filter((c) => c.id !== id));
    showToast(language === 'en' ? 'Coupon deleted.' : 'Kupon telah dipadam.');
  };

  // Banner Handlers (Create, Edit & Real-Time Sync)
  const handleOpenAddBanner = () => {
    setEditingBannerId(null);
    setNewBanner({
      titleEn: '',
      titleMs: '',
      subtitleEn: '',
      subtitleMs: '',
      badgeEn: 'SPECIAL PROMO',
      badgeMs: 'PROMOSI KHAS',
      categoryLabel: '',
      imageUrl: '',
      themeColor: 'emerald',
      ctaTextEn: 'Shop Now',
      ctaTextMs: 'Beli Sekarang',
      targetCategory: 'fresh_products',
      isActive: true,
      showCTA: true,
      showCta: true,
      showCtaButton: true,
      showTitle: true,
      showSubtitle: true,
      showBadges: true,
      showBadge: true,
      showBadgeTag: true,
      showCategoryBadge: true,
      priority: banners.length + 1,
      merchantCode: '',
      merchantName: undefined,
      commissionRate: 10,
    });
    setImageFileMeta(null);
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (banner: MarketingBanner) => {
    setEditingBannerId(banner.id);
    const existingTitle = banner.titleEn || (banner as any).title || '';
    const existingSubtitle = banner.subtitleEn || (banner as any).subtitle || '';
    const existingImage = banner.imageUrl || (banner as any).image_url || '';
    const existingCategory = banner.targetCategory || (banner as any).target_category || 'fresh_products';
    const existingCategoryLabel = banner.categoryLabel || (banner as any).category_label || '';
    const existingCtaText = banner.ctaTextEn || (banner as any).ctaText || (banner as any).cta_text || 'Shop Now';
    const existingActive = banner.isActive !== false && (banner as any).is_active !== false;

    const existingShowBadge = banner.showBadges !== false && banner.showBadge !== false && banner.showBadgeTag !== false;
    const existingShowCategory = banner.showBadges !== false && banner.showCategoryBadge !== false;
    const existingShowTitle = banner.showTitle !== false;
    const existingShowSubtitle = banner.showSubtitle !== false;
    const existingShowCta = banner.showCTA !== false && banner.showCta !== false && banner.showCtaButton !== false;

    setNewBanner({
      id: banner.id,
      titleEn: existingTitle,
      titleMs: banner.titleMs || existingTitle,
      subtitleEn: existingSubtitle,
      subtitleMs: banner.subtitleMs || existingSubtitle,
      badgeEn: banner.badgeEn || 'PROMO',
      badgeMs: banner.badgeMs || 'PROMOSI',
      categoryLabel: existingCategoryLabel,
      imageUrl: existingImage,
      themeColor: banner.themeColor || 'emerald',
      ctaTextEn: existingCtaText,
      ctaTextMs: banner.ctaTextMs || 'Beli Sekarang',
      targetCategory: existingCategory,
      isActive: existingActive,
      showCTA: existingShowCta,
      showCta: existingShowCta,
      showCtaButton: existingShowCta,
      showTitle: existingShowTitle,
      showSubtitle: existingShowSubtitle,
      showBadges: existingShowBadge || existingShowCategory,
      showBadge: existingShowBadge,
      showBadgeTag: existingShowBadge,
      showCategoryBadge: existingShowCategory,
      priority: banner.priority || 1,
      merchantCode: banner.merchantCode || '',
      merchantName: banner.merchantName,
      commissionRate: banner.commissionRate || 10,
    });
    setImageFileMeta(
      existingImage ? { name: 'Current Active Image', size: 'HD 1200w' } : null
    );
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const title = (newBanner.titleEn || (newBanner as any).title || '').trim();
    const image = (newBanner.imageUrl || (newBanner as any).image_url || '').trim();

    if (!image) {
      showToast('Please upload or provide a banner image.');
      return;
    }

    const cleanCode = newBanner.merchantCode?.trim().toUpperCase();
    let partnerName = newBanner.merchantName;
    let partnerCommission = newBanner.commissionRate || 10;

    if (cleanCode) {
      const matched = partnersList.find(
        (p) => (p.code && p.code.toUpperCase() === cleanCode) || p.id.toUpperCase() === cleanCode
      );
      if (matched) {
        partnerName = matched.name;
        partnerCommission = matched.commissionRate;
      } else {
        // Auto-register partner account if code is new
        partnerName = `${cleanCode} Merchant Partner`;
        if (onUpdatePartners) {
          const newPartner: MerchantPartner = {
            id: `mch-${Date.now()}`,
            code: cleanCode,
            name: partnerName,
            businessType: 'farm_supplier',
            contactPerson: 'Account Manager',
            phone: '012-8889921',
            email: `settlement@${cleanCode.toLowerCase()}.my`,
            commissionRate: 10,
            payoutTerms: 'weekly',
            bankName: 'Maybank',
            accountNumber: '5140 8821 9901',
            status: 'active',
            totalSuppliedItems: 1,
            totalSettlementDue: 0,
            joinedDate: new Date().toISOString().split('T')[0],
            bannerRevenueRouted: 0,
            bannerOrdersCount: 0,
          };
          onUpdatePartners([newPartner, ...partnersList]);
        }
      }
    }

    const ctaTextClean = (newBanner.ctaTextEn || '').trim() || 'Shop Now';
    const categoryLabelClean = (newBanner.categoryLabel || '').trim();
    const rawShowBadges = newBanner.showBadges !== false;
    const rawShowBadge = newBanner.showBadge !== false && newBanner.showBadgeTag !== false;
    const rawShowCategoryBadge = newBanner.showCategoryBadge !== false;
    const showBadgeVal = rawShowBadges && rawShowBadge;
    const showCategoryBadgeVal = rawShowBadges && rawShowCategoryBadge;
    const showBadgesVal = rawShowBadges && (rawShowBadge || rawShowCategoryBadge);
    const showTitleVal = newBanner.showTitle !== false;
    const showSubtitleVal = newBanner.showSubtitle !== false;
    const showCtaVal = newBanner.showCTA !== false && newBanner.showCta !== false && newBanner.showCtaButton !== false;

    if (editingBannerId) {
      // 1. UPDATE EXISTING BANNER
      const existing = banners.find((b) => b.id === editingBannerId);
      const updated: MarketingBanner = {
        ...(existing || {}),
        id: editingBannerId,
        titleEn: title,
        titleMs: newBanner.titleMs || title,
        subtitleEn: newBanner.subtitleEn || '',
        subtitleMs: newBanner.subtitleMs || newBanner.subtitleEn || '',
        badgeEn: newBanner.badgeEn || 'PROMO',
        badgeMs: newBanner.badgeMs || 'PROMOSI',
        categoryLabel: categoryLabelClean,
        category_label: categoryLabelClean,
        imageUrl: image,
        themeColor: newBanner.themeColor || 'emerald',
        ctaText: ctaTextClean,
        cta_text: ctaTextClean,
        ctaTextEn: ctaTextClean,
        ctaTextMs: newBanner.ctaTextMs || 'Beli Sekarang',
        targetCategory: newBanner.targetCategory || 'fresh_products',
        isActive: newBanner.isActive !== false,
        showCTA: Boolean(showCtaVal),
        showCta: Boolean(showCtaVal),
        showCtaButton: Boolean(showCtaVal),
        showTitle: Boolean(showTitleVal),
        showSubtitle: Boolean(showSubtitleVal),
        showBadges: Boolean(showBadgesVal),
        showBadge: Boolean(showBadgeVal),
        showBadgeTag: Boolean(showBadgeVal),
        showCategoryBadge: Boolean(showCategoryBadgeVal),
        priority: newBanner.priority || (existing ? existing.priority : 1),
        merchantCode: cleanCode || undefined,
        merchantName: cleanCode ? partnerName : undefined,
        commissionRate: cleanCode ? partnerCommission : undefined,
        revenueRouted: existing?.revenueRouted || 0,
        salesCount: existing?.salesCount || 0,
        commissionEarned: existing?.commissionEarned || 0,
        netSettlementDue: existing?.netSettlementDue || 0,
        settlementStatus: existing?.settlementStatus,
        updatedAt: new Date().toISOString(),
      };

      // Instantly update Firestore document in both 'banners' and 'storefront_banners'
      saveBannerToFirestore(updated);
      onUpdateBanners(banners.map((b) => (b.id === editingBannerId ? updated : b)));
      setIsBannerModalOpen(false);
      setEditingBannerId(null);
      showToast(language === 'en' ? 'Banner updated in Firestore in real time!' : 'Sepanduk dikemaskini dalam Firestore!');
    } else {
      // 2. CREATE NEW BANNER
      const created: MarketingBanner = {
        id: `ban-${Date.now().toString().slice(-6)}`,
        titleEn: title,
        titleMs: newBanner.titleMs || title,
        subtitleEn: newBanner.subtitleEn || '',
        subtitleMs: newBanner.subtitleMs || newBanner.subtitleEn || '',
        badgeEn: newBanner.badgeEn || 'PROMO',
        badgeMs: newBanner.badgeMs || 'PROMOSI',
        categoryLabel: categoryLabelClean,
        category_label: categoryLabelClean,
        imageUrl: image,
        themeColor: newBanner.themeColor || 'emerald',
        ctaText: ctaTextClean,
        cta_text: ctaTextClean,
        ctaTextEn: ctaTextClean,
        ctaTextMs: newBanner.ctaTextMs || 'Beli Sekarang',
        targetCategory: newBanner.targetCategory || 'fresh_products',
        isActive: newBanner.isActive !== false, // Active status by default or as selected
        showCTA: Boolean(showCtaVal),
        showCta: Boolean(showCtaVal),
        showCtaButton: Boolean(showCtaVal),
        showTitle: Boolean(showTitleVal),
        showSubtitle: Boolean(showSubtitleVal),
        showBadges: Boolean(showBadgesVal),
        showBadge: Boolean(showBadgeVal),
        showBadgeTag: Boolean(showBadgeVal),
        showCategoryBadge: Boolean(showCategoryBadgeVal),
        priority: banners.length + 1,
        merchantCode: cleanCode || undefined,
        merchantName: cleanCode ? partnerName : undefined,
        commissionRate: cleanCode ? partnerCommission : undefined,
        revenueRouted: 0,
        salesCount: 0,
        commissionEarned: 0,
        netSettlementDue: 0,
        settlementStatus: cleanCode ? 'pending' : undefined,
      };

      // Instantly write the banner document into the root Firestore collections ('banners' and 'storefront_banners')
      saveBannerToFirestore(created);
      onUpdateBanners([created, ...banners]);
      setIsBannerModalOpen(false);
      setEditingBannerId(null);

      showToast(
        cleanCode
          ? (language === 'en'
              ? `Banner published to Firestore! Revenue routed to ${cleanCode} Partner Ledger.`
              : `Sepanduk diterbitkan ke Firestore! Hasil disalurkan ke Lejar Rakan ${cleanCode}.`)
          : (language === 'en' ? 'Promotional storefront banner published to Firestore.' : 'Sepanduk promosi berjaya diterbitkan ke Firestore.')
      );
    }

    setNewBanner({
      titleEn: '',
      titleMs: '',
      subtitleEn: '',
      subtitleMs: '',
      badgeEn: 'SPECIAL PROMO',
      badgeMs: 'PROMOSI KHAS',
      imageUrl: '',
      themeColor: 'emerald',
      ctaTextEn: 'Shop Now',
      ctaTextMs: 'Beli Sekarang',
      targetCategory: 'fresh_products',
      isActive: true,
      priority: banners.length + 2,
      merchantCode: '',
      merchantName: undefined,
    });
    setImageFileMeta(null);
  };

  const handleToggleBanner = (id: string) => {
    const updated = banners.map((b) => {
      if (b.id === id) {
        const next = { ...b, isActive: !b.isActive };
        saveBannerToFirestore(next);
        return next;
      }
      return b;
    });
    onUpdateBanners(updated);
    showToast(language === 'en' ? 'Banner status updated in Firestore.' : 'Status sepanduk dikemaskini dalam Firestore.');
  };

  const handleDeleteBanner = (id: string) => {
    deleteBannerFromFirestore(id);
    onUpdateBanners(banners.filter((b) => b.id !== id));
    showToast(language === 'en' ? 'Banner removed from Firestore.' : 'Sepanduk telah dipadam dari Firestore.');
  };

  // Simulate banner order & direct financial routing
  const handleSimulateBannerOrder = (banner: MarketingBanner) => {
    if (!banner.merchantCode) return;
    if (onRouteBannerSale) {
      onRouteBannerSale(banner.id, 120.00);
    } else {
      const amount = 120.00;
      const rate = banner.commissionRate || 10;
      const fee = Number((amount * (rate / 100)).toFixed(2));
      const net = Number((amount - fee).toFixed(2));

      const updated = banners.map((b) => {
        if (b.id === banner.id) {
          return {
            ...b,
            revenueRouted: Number(((b.revenueRouted || 0) + amount).toFixed(2)),
            salesCount: (b.salesCount || 0) + 1,
            commissionEarned: Number(((b.commissionEarned || 0) + fee).toFixed(2)),
            netSettlementDue: Number(((b.netSettlementDue || 0) + net).toFixed(2)),
          };
        }
        return b;
      });
      onUpdateBanners(updated);
    }
    showToast(
      language === 'en'
        ? `⚡ RM 120.00 routed from banner "${banner.titleEn}" to ${banner.merchantCode} Settlement Ledger!`
        : `⚡ RM 120.00 disalurkan dari sepanduk ke Lejar Penyelesaian ${banner.merchantCode}!`
    );
  };

  // Broadcast Handlers
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitleEn || !broadcastBodyEn) return;

    setIsSendingBroadcast(true);
    setTimeout(() => {
      const recipientCount =
        broadcastAudience === 'all_shoppers'
          ? 5280
          : broadcastAudience === 'fresh_produce_buyers'
          ? 1840
          : broadcastAudience === 'cart_abandoners'
          ? 620
          : 980;

      const created: PushNotificationBroadcast = {
        id: `bc-${Date.now().toString().slice(-6)}`,
        titleEn: broadcastTitleEn,
        titleMs: broadcastTitleMs || broadcastTitleEn,
        bodyEn: broadcastBodyEn,
        bodyMs: broadcastBodyMs || broadcastBodyEn,
        targetAudience: broadcastAudience,
        scheduledAt: 'Just now',
        sentAt: 'Just now',
        status: 'sent',
        recipientCount: recipientCount,
        openRateEstimated: Number((28 + Math.random() * 12).toFixed(1)),
      };

      onUpdateBroadcasts([created, ...broadcasts]);
      setIsSendingBroadcast(false);
      setBroadcastTitleEn('');
      setBroadcastTitleMs('');
      setBroadcastBodyEn('');
      setBroadcastBodyMs('');
      showToast(
        language === 'en'
          ? `Push broadcast sent to ${recipientCount.toLocaleString()} shoppers!`
          : `Notifikasi telah dihantar kepada ${recipientCount.toLocaleString()} pembeli!`
      );
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-500/40 text-xs font-bold animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
          <button
            type="button"
            id="tab-btn-coupons"
            onClick={() => setSubTab('coupons')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              subTab === 'coupons' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Promo Codes & Vouchers' : 'Kod Promo & Baucar'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-black">
              {coupons.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-btn-banners"
            onClick={() => setSubTab('banners')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              subTab === 'banners' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Storefront Banners' : 'Sepanduk Kedai'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-black">
              {banners.length}
            </span>
          </button>

          <button
            type="button"
            id="tab-btn-broadcast"
            onClick={() => setSubTab('broadcast')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              subTab === 'broadcast' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Push Broadcasts' : 'Notifikasi Siaran'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-black">
              {broadcasts.length}
            </span>
          </button>
        </div>

        {/* Action Button */}
        {subTab === 'coupons' && (
          <button
            type="button"
            id="btn-create-new-coupon"
            onClick={() => setIsCouponModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'Create Promo Code' : 'Cipta Kod Promo'}</span>
          </button>
        )}

        {subTab === 'banners' && (
          <button
            type="button"
            id="btn-create-new-banner"
            onClick={handleOpenAddBanner}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'Add Storefront Banner' : 'Tambah Sepanduk'}</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: COUPONS & VOUCHERS */}
      {subTab === 'coupons' && (
        <div className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Total Promo Codes</span>
              <p className="text-lg font-black text-gray-900 mt-1">{coupons.length}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200">
              <span className="text-xs text-emerald-700 font-medium">Active Codes</span>
              <p className="text-lg font-black text-emerald-700 mt-1">
                {coupons.filter((c) => c.status === 'active').length}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200">
              <span className="text-xs text-blue-700 font-medium">Total Redemptions</span>
              <p className="text-lg font-black text-blue-700 mt-1">
                {coupons.reduce((acc, c) => acc + c.usageCount, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-gray-200">
              <span className="text-xs text-amber-700 font-medium">Avg. Discount Est.</span>
              <p className="text-lg font-black text-amber-700 mt-1">RM 7.50</p>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">{language === 'en' ? 'Coupon Code' : 'Kod Baucar'}</th>
                    <th className="py-3 px-3">{language === 'en' ? 'Discount Type & Value' : 'Jenis & Nilai'}</th>
                    <th className="py-3 px-3">{language === 'en' ? 'Min Spend' : 'Belanja Min'}</th>
                    <th className="py-3 px-3">{language === 'en' ? 'Usage Limit & Redeemed' : 'Had & Digunakan'}</th>
                    <th className="py-3 px-3">{language === 'en' ? 'Valid Period' : 'Tempoh'}</th>
                    <th className="py-3 px-3">{language === 'en' ? 'Status' : 'Status'}</th>
                    <th className="py-3 px-4 text-right">{language === 'en' ? 'Actions' : 'Tindakan'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons.map((coupon) => {
                    const isActive = coupon.status === 'active';
                    const usagePercent = Math.min(100, Math.round((coupon.usageCount / coupon.usageLimit) * 100));

                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {coupon.code}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(coupon.code)}
                              className="text-gray-400 hover:text-gray-700 p-1"
                              title="Copy code"
                            >
                              {copiedCode === coupon.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{coupon.descriptionEn}</p>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-gray-900">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.discountValue}% OFF`
                              : coupon.discountType === 'fixed'
                              ? `RM ${coupon.discountValue.toFixed(2)} OFF`
                              : 'Free Delivery (RM 5)'}
                          </span>
                          {coupon.maxDiscount && (
                            <span className="text-[10px] text-gray-400 block">
                              Max RM {coupon.maxDiscount}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-mono font-bold text-gray-700 text-xs">
                            RM {coupon.minSpend.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="space-y-1 min-w-[120px]">
                            <div className="flex justify-between text-[11px] font-bold text-gray-700">
                              <span>{coupon.usageCount} used</span>
                              <span className="text-gray-400">/ {coupon.usageLimit}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  usagePercent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                          <div>Exp: {coupon.expiryDate}</div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleCouponStatus(coupon.id)}
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {isActive ? '● Active' : '○ Paused'}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: STOREFRONT BANNERS */}
      {subTab === 'banners' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-xs">
                  {language === 'en' ? 'Hero Card & Category Headlines Sync' : 'Sinkronisasi Banner Hero & Tajuk Kategori'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {language === 'en'
                    ? 'Manage your live Hero Badge Tag, Main Headline, Sub-headline, and Category Section Title under App Settings > "Banners & Copy Management".'
                    : 'Urus Tag Lencana Hero, Tajuk Utama, Keterangan, dan Tajuk Kategori di bawah Tetapan Aplikasi > "Pengurusan Salinan & Banner".'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300 self-start sm:self-center shrink-0">
              Live Firestore Sync
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                {/* Banner Visual Preview */}
                <div className="relative h-36 w-full overflow-hidden bg-gray-100">
                  <img
                    src={banner.imageUrl}
                    alt={banner.titleEn}
                    className="w-full h-full object-cover"
                  />
                  {(() => {
                    const isCleanMode =
                      banner.showTitle === false &&
                      banner.showSubtitle === false &&
                      (banner.showBadges === false || ((banner.showBadge === false || banner.showBadgeTag === false) && banner.showCategoryBadge === false)) &&
                      (banner.showCTA === false || banner.showCta === false || banner.showCtaButton === false);

                    if (isCleanMode) {
                      return (
                        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/75 backdrop-blur-xs text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Clean Graphic Mode
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              banner.isActive ? 'bg-emerald-500/90 text-white' : 'bg-gray-700/90 text-gray-200'
                            }`}
                          >
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-3.5 flex flex-col justify-between text-white pointer-events-none">
                        <div className="flex items-center justify-between">
                          {banner.showBadges !== false && banner.showBadge !== false && banner.showBadgeTag !== false && Boolean(banner.badgeEn?.trim()) ? (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-xs">
                              {banner.badgeEn}
                            </span>
                          ) : (
                            <span />
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              banner.isActive ? 'bg-emerald-500/90 text-white' : 'bg-gray-700/90 text-gray-200'
                            }`}
                          >
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {(banner.showTitle !== false && Boolean(banner.titleEn?.trim())) || (banner.showSubtitle !== false && Boolean(banner.subtitleEn?.trim())) ? (
                          <div className="bg-black/35 backdrop-blur-xs p-2 rounded-lg border border-white/10">
                            {banner.showTitle !== false && Boolean(banner.titleEn?.trim()) && (
                              <h4 className="font-black text-sm text-white line-clamp-1 drop-shadow-xs">{banner.titleEn}</h4>
                            )}
                            {banner.showSubtitle !== false && Boolean(banner.subtitleEn?.trim()) && (
                              <p className="text-[11px] text-gray-200 line-clamp-1 drop-shadow-xs">{banner.subtitleEn}</p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>

                {/* Banner Details & Controls */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-gray-500">
                      <span>Category / Badge Label:</span>
                      <span className="font-bold text-gray-800 capitalize">
                        {banner.categoryLabel || banner.targetCategory?.replace(/_/g, ' ') || 'General Deals'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-500">
                      <span>CTA Button:</span>
                      <span className="font-bold text-emerald-700">{banner.ctaTextEn || (banner as any).ctaText || 'Shop Now'}</span>
                    </div>

                    {/* Merchant Partner Financial Routing Indicator */}
                    {banner.merchantCode ? (
                      <div className="mt-2 pt-2 border-t border-emerald-100 bg-emerald-50/60 p-2.5 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="truncate max-w-[150px]">{banner.merchantName || 'Merchant Partner'}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-emerald-800 border border-emerald-200">
                            {banner.merchantCode}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] border-t border-emerald-200/50">
                          <div>
                            <span className="text-gray-500 block">Routed Gross</span>
                            <span className="font-bold font-mono text-gray-900">
                              RM {(banner.revenueRouted || 0).toFixed(0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Fee ({banner.commissionRate || 10}%)</span>
                            <span className="font-bold font-mono text-gray-700">
                              RM {((banner.revenueRouted || 0) * ((banner.commissionRate || 10) / 100)).toFixed(0)}
                            </span>
                          </div>
                          <div>
                            <span className="text-emerald-700 font-semibold block">Net Payable</span>
                            <span className="font-bold font-mono text-emerald-800">
                              RM {((banner.revenueRouted || 0) * (1 - (banner.commissionRate || 10) / 100)).toFixed(0)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Financial Routing Actions */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSimulateBannerOrder(banner)}
                            className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            title="Simulate a customer order routed through this banner"
                          >
                            <Zap className="w-3 h-3 text-amber-300" />
                            <span>Route Sale (+RM 120)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedLedgerBanner(banner)}
                            className="py-1 px-2 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            title="View partner account ledger transactions"
                          >
                            Ledger Statement
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 pt-1.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Merchant Routing:</span>
                        <span className="italic">Direct Storefront Promo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                    {/* Publish / Pause Toggle Switch */}
                    <button
                      type="button"
                      id={`btn-toggle-banner-${banner.id}`}
                      onClick={() => handleToggleBanner(banner.id)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        banner.isActive
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={
                        banner.isActive
                          ? (language === 'en' ? 'Click to Pause / Unpublish' : 'Klik untuk Jeda / Nyahterbit')
                          : (language === 'en' ? 'Click to Publish' : 'Klik untuk Terbitkan')
                      }
                    >
                      <div
                        className={`w-7 h-3.5 rounded-full transition-colors relative flex items-center p-0.5 ${
                          banner.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`w-2.5 h-2.5 rounded-full bg-white shadow-xs transition-transform transform ${
                            banner.isActive ? 'translate-x-3.5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                      <span className="text-[11px]">
                        {banner.isActive
                          ? (language === 'en' ? 'Publish' : 'Terbit')
                          : (language === 'en' ? 'Paused' : 'Dijeda')}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        type="button"
                        id={`btn-edit-banner-${banner.id}`}
                        onClick={() => handleOpenEditBanner(banner)}
                        className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title={language === 'en' ? 'Edit banner content & routing' : 'Sunting kandungan sepanduk & laluan'}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Edit' : 'Sunting'}</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        id={`btn-delete-banner-${banner.id}`}
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title={language === 'en' ? 'Delete banner' : 'Padam sepanduk'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PUSH BROADCAST LAUNCHER */}
      {subTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Push Broadcast Composer */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-gray-900">Broadcast Push Notification</h3>
                <p className="text-[11px] text-gray-500">Send real-time alerts to customer devices</p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Target Audience</label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value as any)}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="all_shoppers">All Active Shoppers (~5,280 users)</option>
                  <option value="fresh_produce_buyers">Fresh Produce Shoppers (~1,840 users)</option>
                  <option value="cart_abandoners">Cart Abandoners in 24h (~620 users)</option>
                  <option value="inactive_7d">Inactive &gt; 7 Days (~980 users)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Strawberries Just Arrived! 🍓"
                  value={broadcastTitleEn}
                  onChange={(e) => setBroadcastTitleEn(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Title (Bahasa Melayu - Optional)</label>
                <input
                  type="text"
                  placeholder="cth. Strawberi Segar Baru Sampai! 🍓"
                  value={broadcastTitleMs}
                  onChange={(e) => setBroadcastTitleMs(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Message Body (English)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Sweet, farm-harvested strawberries now available with 2-hour delivery."
                  value={broadcastBodyEn}
                  onChange={(e) => setBroadcastBodyEn(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Message Body (Bahasa Melayu - Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Strawberi manis dari Cameron Highlands tersedia untuk dihantar dalam 2 jam."
                  value={broadcastBodyMs}
                  onChange={(e) => setBroadcastBodyMs(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Push Preview Box */}
              <div className="bg-gray-900 text-white p-3 rounded-xl border border-gray-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-gray-400">
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <Smartphone className="w-3 h-3" /> D-MART APP
                  </span>
                  <span>Now</span>
                </div>
                <p className="font-bold text-xs text-white line-clamp-1">
                  {broadcastTitleEn || 'Headline Preview'}
                </p>
                <p className="text-[11px] text-gray-300 line-clamp-2">
                  {broadcastBodyEn || 'Body copy preview will appear here as users see it on their mobile notifications.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isSendingBroadcast || !broadcastTitleEn || !broadcastBodyEn}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingBroadcast ? 'Launching Broadcast...' : 'Launch Broadcast Now'}</span>
              </button>
            </form>
          </div>

          {/* Broadcast History Log */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-black text-sm text-gray-900">Push Notification Broadcast History</h3>
              <span className="text-xs text-gray-400 font-mono">{broadcasts.length} campaigns</span>
            </div>

            <div className="space-y-3">
              {broadcasts.map((bc) => (
                <div
                  key={bc.id}
                  className="p-3.5 rounded-xl border border-gray-200 hover:border-purple-300 transition-colors bg-gray-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-xs text-gray-900">{bc.titleEn}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{bc.sentAt || bc.scheduledAt}</span>
                  </div>

                  <p className="text-xs text-gray-600">{bc.bodyEn}</p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/60">
                    <span className="capitalize bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded">
                      Audience: {bc.targetAudience.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>
                        Recipients: <strong className="text-gray-900">{bc.recipientCount.toLocaleString()}</strong>
                      </span>
                      <span>
                        Est. Open Rate:{' '}
                        <strong className="text-emerald-700">{bc.openRateEstimated}%</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-600" />
                <span>Create New Promo Code</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Coupon Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASHWEEKEND"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as any })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-medium outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (RM)</option>
                    <option value="free_delivery">Free Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount Value</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Min Spend (RM)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newCoupon.minSpend}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minSpend: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newCoupon.usageLimit}
                    onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newCoupon.expiryDate}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Target Category (Optional)</label>
                  <select
                    value={newCoupon.targetCategory || ''}
                    onChange={(e) => setNewCoupon({ ...newCoupon, targetCategory: e.target.value || undefined })}
                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.key} value={cat.key}>
                        {cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Description (English)</label>
                <input
                  type="text"
                  placeholder="e.g. 15% OFF your fresh produce basket"
                  value={newCoupon.descriptionEn}
                  onChange={(e) => setNewCoupon({ ...newCoupon, descriptionEn: e.target.value })}
                  className="w-full p-2 bg-gray-50 border border-gray-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Save & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT BANNER MODAL */}
      {isBannerModalOpen && (() => {
        const previewShowBadge =
          newBanner.showBadges !== false &&
          newBanner.showBadge !== false &&
          newBanner.showBadgeTag !== false &&
          Boolean(newBanner.badgeEn?.trim());

        const previewShowCategory =
          newBanner.showBadges !== false &&
          newBanner.showCategoryBadge !== false &&
          Boolean((newBanner.categoryLabel || newBanner.targetCategory)?.trim());

        const previewShowTitle =
          newBanner.showTitle !== false && Boolean(newBanner.titleEn?.trim());

        const previewShowSubtitle =
          newBanner.showSubtitle !== false && Boolean(newBanner.subtitleEn?.trim());

        const previewShowCta =
          newBanner.showCTA !== false &&
          newBanner.showCta !== false &&
          newBanner.showCtaButton !== false &&
          Boolean(newBanner.ctaTextEn?.trim());

        const previewHasAnyOverlay =
          previewShowBadge ||
          previewShowCategory ||
          previewShowTitle ||
          previewShowSubtitle ||
          previewShowCta;

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-emerald-600" />
                <span>
                  {editingBannerId
                    ? (language === 'en' ? 'Edit Storefront Banner' : 'Sunting Sepanduk Pasaraya')
                    : (language === 'en' ? 'Add Storefront Banner' : 'Tambah Sepanduk Pasaraya')}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsBannerModalOpen(false);
                  setEditingBannerId(null);
                }}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Hidden File Inputs for Gallery and Camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              {/* 1. Direct Image URL input */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Banner Graphic Image URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  id="input-banner-image-url"
                  name="imageUrl"
                  required
                  placeholder="https://images.unsplash.com/... (or choose/upload below)"
                  value={newBanner.imageUrl || ''}
                  onChange={(e) => {
                    setNewBanner({ ...newBanner, imageUrl: e.target.value });
                    setImageFileMeta({ name: 'Web Image URL', size: 'Remote Link' });
                  }}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 focus:border-emerald-500 focus:bg-white rounded-xl outline-none font-mono text-xs transition-all"
                />
              </div>

              {/* INTERACTIVE IMAGE UPLOAD AREA ("Upload Banner Image") */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload Banner Image</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">PNG, JPG, WebP (Landscape)</span>
                </div>

                {newBanner.imageUrl ? (
                  /* Instant Preview Thumbnail Box (Live Real-Time Sync) */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>INSTANT PREVIEW (Live Storefront Sync)</span>
                      </span>
                      {!previewHasAnyOverlay ? (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          Clean Image Mode Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <Eye className="w-3 h-3 text-blue-600" />
                          Overlay Active ({[previewShowBadge, previewShowCategory, previewShowTitle, previewShowSubtitle, previewShowCta].filter(Boolean).length}/5)
                        </span>
                      )}
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-gray-900 group">
                      <img
                        src={newBanner.imageUrl}
                        alt="Uploaded Banner Preview"
                        className="w-full h-44 object-cover"
                      />

                      {/* If Clean Image Mode (all overlays OFF or empty), render solely as clean full-width graphic */}
                      {!previewHasAnyOverlay ? (
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-xs text-emerald-300 border border-emerald-400/40 px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Clean Graphic Display (No Overlays)
                          </span>
                        </div>
                      ) : (
                        /* Dark text background overlay rendered ONLY when text elements are active */
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3.5 flex flex-col justify-between text-white pointer-events-none">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              Instant Preview Active
                            </span>
                            {imageFileMeta && (
                              <span className="text-[10px] font-mono text-emerald-200 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs">
                                {imageFileMeta.size}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            {/* Badges row */}
                            {(previewShowBadge || previewShowCategory) && (
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                {previewShowBadge && (
                                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full inline-block shadow-xs">
                                    {newBanner.badgeEn?.trim() || 'SPECIAL PROMO'}
                                  </span>
                                )}
                                {previewShowCategory && (
                                  <span className="text-[10px] font-bold text-emerald-200 bg-black/60 border border-white/20 px-2 py-0.5 rounded-full inline-block shadow-xs">
                                    {newBanner.categoryLabel?.trim() || newBanner.targetCategory?.replace(/_/g, ' ') || 'Category'}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Title */}
                            {previewShowTitle && (
                              <h4 className="font-black text-sm text-white line-clamp-1 drop-shadow-sm">
                                {newBanner.titleEn?.trim()}
                              </h4>
                            )}

                            {/* Subtitle */}
                            {previewShowSubtitle && (
                              <p className="text-[11px] text-gray-200 line-clamp-1 drop-shadow-xs">
                                {newBanner.subtitleEn?.trim()}
                              </p>
                            )}

                            {/* CTA */}
                            {previewShowCta && (
                              <div className="pt-0.5">
                                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-xs">
                                  {newBanner.ctaTextEn?.trim() || 'Shop Now'} →
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Controls to re-select or capture */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 min-w-[140px] py-2 px-3 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 border border-emerald-300 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Upload from Gallery/Device</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 min-w-[140px] py-2 px-3 bg-white hover:bg-blue-50 hover:text-blue-800 text-gray-700 border border-blue-300 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Capture directly from Camera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewBanner({ ...newBanner, imageUrl: '' });
                          setImageFileMeta(null);
                        }}
                        className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 border border-gray-200 rounded-xl transition-colors cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Interactive Dropzone Box */
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingImage(true);
                    }}
                    onDragLeave={() => setIsDraggingImage(false)}
                    onDrop={handleDropImage}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                      isDraggingImage
                        ? 'border-emerald-500 bg-emerald-100/50 scale-[1.01]'
                        : 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-500'
                    }`}
                  >
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                      <ImagePlus className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-xs text-gray-800">
                      Drag &amp; drop your banner graphic here, or select an option:
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Supports direct camera capture &amp; local gallery image selection
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3.5 max-w-md mx-auto">
                      <button
                        type="button"
                        id="btn-upload-gallery"
                        onClick={() => fileInputRef.current?.click()}
                        className="py-2.5 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border-2 border-emerald-600 rounded-xl font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-emerald-600" />
                        <span>Upload from Gallery/Device</span>
                      </button>
                      <button
                        type="button"
                        id="btn-capture-camera"
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture directly from Camera</span>
                      </button>
                    </div>

                    {/* Quick template chips */}
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-500 font-semibold">Or pick template:</span>
                      {[
                        { name: '🥬 Cameron Farm', url: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=1200&auto=format&fit=crop&q=80' },
                        { name: '🍗 Halal Poultry', url: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=1200&auto=format&fit=crop&q=80' },
                        { name: '🍓 Fresh Berries', url: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=1200&auto=format&fit=crop&q=80' },
                        { name: '🥖 Bakery Craft', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop&q=80' }
                      ].map((tpl) => (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => {
                            setNewBanner({ ...newBanner, imageUrl: tpl.url });
                            setImageFileMeta({ name: `${tpl.name} Template`, size: 'HD 1200w' });
                          }}
                          className="text-[10px] bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 text-gray-600 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {tpl.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. MERCHANT FINANCIAL CODE FIELD & FINANCIAL LOGIC */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Merchant Account Code (Optional)</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Settlement Routing Active
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="input-merchant-account-code"
                    placeholder="e.g., MERCH-8821"
                    value={newBanner.merchantCode || ''}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      const matched = partnersList.find(
                        (p) => (p.code && p.code.toUpperCase() === code) || p.id.toUpperCase() === code
                      );
                      setNewBanner({
                        ...newBanner,
                        merchantCode: code,
                        merchantName: matched ? matched.name : undefined,
                        commissionRate: matched ? matched.commissionRate : 10,
                      });
                    }}
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 focus:border-emerald-500 focus:bg-white rounded-xl font-mono uppercase text-xs tracking-wider outline-none transition-all"
                  />
                  {newBanner.merchantCode && (
                    <button
                      type="button"
                      onClick={() => setNewBanner({ ...newBanner, merchantCode: '', merchantName: undefined })}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick-Select Registered Merchant Codes */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-gray-400 font-semibold">Registered Codes:</span>
                  {partnersList.map((p) => {
                    const pCode = p.code || p.id.toUpperCase();
                    const isSelected = newBanner.merchantCode === pCode;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setNewBanner({
                            ...newBanner,
                            merchantCode: pCode,
                            merchantName: p.name,
                            commissionRate: p.commissionRate,
                          })
                        }
                        className={`text-[10px] px-2 py-0.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                            : 'bg-gray-100 hover:bg-emerald-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {pCode}
                      </button>
                    );
                  })}
                </div>

                {/* Matched Partner Feedback */}
                {newBanner.merchantCode && (
                  <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-xl text-xs space-y-1 animate-in fade-in-50">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-emerald-700" />
                        {newBanner.merchantName || `New Merchant Partner (${newBanner.merchantCode})`}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                        {newBanner.commissionRate || 10}% Commission
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      Revenue routed directly to <strong>{newBanner.merchantName || newBanner.merchantCode}</strong> Settlement Ledger Account.
                    </p>
                  </div>
                )}

                {/* Financial Logic Guidance Box */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Financial Logic:</strong> When a Merchant Code is assigned, automatically route all financial revenue, sales metrics, and commission ledger entries generated through this banner directly to that partner's <strong>Financial Ledger &amp; Settlement Account (Partner Account Ledger)</strong>.
                  </p>
                </div>
              </div>

              {/* 2. OVERLAY ELEMENTS & CLEAN IMAGE MODE TOGGLES */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-black text-xs text-gray-900 block">
                        Overlay Visibility &amp; Clean Image Mode Toggles
                      </span>
                      <span className="text-[11px] text-gray-600">
                        Toggle each element ON/OFF or leave empty. Clean mode displays pure edge-to-edge graphic design.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      id="btn-clean-mode-all-off"
                      onClick={() => {
                        setNewBanner({
                          ...newBanner,
                          showCTA: false,
                          showCta: false,
                          showCtaButton: false,
                          showTitle: false,
                          showSubtitle: false,
                          showBadges: false,
                          showBadge: false,
                          showBadgeTag: false,
                          showCategoryBadge: false,
                        });
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Disable All Overlays
                    </button>
                    <button
                      type="button"
                      id="btn-clean-mode-all-on"
                      onClick={() => {
                        setNewBanner({
                          ...newBanner,
                          showCTA: true,
                          showCta: true,
                          showCtaButton: true,
                          showTitle: true,
                          showSubtitle: true,
                          showBadges: true,
                          showBadge: true,
                          showBadgeTag: true,
                          showCategoryBadge: true,
                        });
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Enable All
                    </button>
                  </div>
                </div>

                {/* 1. Badge Tag / Label ("SPECIAL PROMO") */}
                <div className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Badge Tag / Label ("SPECIAL PROMO")</span>
                      <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <button
                      type="button"
                      id="btn-toggle-badge"
                      onClick={() => {
                        const isCurrentlyActive = newBanner.showBadges !== false && newBanner.showBadge !== false && newBanner.showBadgeTag !== false;
                        const next = !isCurrentlyActive;
                        setNewBanner({
                          ...newBanner,
                          showBadge: next,
                          showBadgeTag: next,
                          showBadges: next || newBanner.showCategoryBadge !== false,
                        });
                      }}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        newBanner.showBadges !== false && newBanner.showBadge !== false && newBanner.showBadgeTag !== false
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-3.5 rounded-full relative flex items-center p-0.5 transition-colors ${
                        newBanner.showBadges !== false && newBanner.showBadge !== false && newBanner.showBadgeTag !== false ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                          newBanner.showBadges !== false && newBanner.showBadge !== false && newBanner.showBadgeTag !== false ? 'translate-x-2.5' : 'translate-x-0'
                        }`} />
                      </div>
                      <span>{newBanner.showBadges !== false && newBanner.showBadge !== false && newBanner.showBadgeTag !== false ? 'Show' : 'Hide'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      id="input-banner-badge-en"
                      placeholder="Badge Text (English), e.g. SPECIAL PROMO"
                      value={newBanner.badgeEn || ''}
                      disabled={newBanner.showBadges === false || newBanner.showBadge === false || newBanner.showBadgeTag === false}
                      onChange={(e) => setNewBanner({ ...newBanner, badgeEn: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl font-bold outline-none transition-all ${
                        newBanner.showBadges === false || newBanner.showBadge === false || newBanner.showBadgeTag === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                    <input
                      type="text"
                      id="input-banner-badge-ms"
                      placeholder="Badge Text (Bahasa Malaysia), e.g. PROMOSI KHAS"
                      value={newBanner.badgeMs || ''}
                      disabled={newBanner.showBadges === false || newBanner.showBadge === false || newBanner.showBadgeTag === false}
                      onChange={(e) => setNewBanner({ ...newBanner, badgeMs: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl font-bold outline-none transition-all ${
                        newBanner.showBadges === false || newBanner.showBadge === false || newBanner.showBadgeTag === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* 2. Target Category Badge ("Snacks & Beverages") */}
                <div className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Target Category Badge ("Snacks &amp; Beverages")</span>
                      <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <button
                      type="button"
                      id="btn-toggle-category-badge"
                      onClick={() => {
                        const isCurrentlyActive = newBanner.showBadges !== false && newBanner.showCategoryBadge !== false;
                        const next = !isCurrentlyActive;
                        setNewBanner({
                          ...newBanner,
                          showCategoryBadge: next,
                          showBadges: next || (newBanner.showBadge !== false && newBanner.showBadgeTag !== false),
                        });
                      }}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        newBanner.showBadges !== false && newBanner.showCategoryBadge !== false
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-3.5 rounded-full relative flex items-center p-0.5 transition-colors ${
                        newBanner.showBadges !== false && newBanner.showCategoryBadge !== false ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                          newBanner.showBadges !== false && newBanner.showCategoryBadge !== false ? 'translate-x-2.5' : 'translate-x-0'
                        }`} />
                      </div>
                      <span>{newBanner.showBadges !== false && newBanner.showCategoryBadge !== false ? 'Show' : 'Hide'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      id="input-banner-category-label"
                      placeholder="Category Badge Label, e.g. Snacks & Beverages"
                      value={newBanner.categoryLabel || ''}
                      disabled={newBanner.showBadges === false || newBanner.showCategoryBadge === false}
                      onChange={(e) => setNewBanner({ ...newBanner, categoryLabel: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl font-semibold outline-none transition-all ${
                        newBanner.showBadges === false || newBanner.showCategoryBadge === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                    <select
                      value={newBanner.targetCategory}
                      onChange={(e) => {
                        const selectedCat = e.target.value;
                        const matchedCat = categories.find((c) => c.key === selectedCat);
                        setNewBanner({
                          ...newBanner,
                          targetCategory: selectedCat,
                          categoryLabel: newBanner.categoryLabel || (matchedCat ? matchedCat.nameEn : ''),
                        });
                      }}
                      className="w-full p-2 bg-white border border-gray-300 focus:border-emerald-500 rounded-xl outline-none transition-all"
                    >
                      {categories.map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {cat.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Banner Title ("BOH tea") */}
                <div className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Banner Title (e.g. "BOH Tea Cameron Selection")</span>
                      <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <button
                      type="button"
                      id="btn-toggle-title"
                      onClick={() => {
                        const next = newBanner.showTitle === false;
                        setNewBanner({ ...newBanner, showTitle: next });
                      }}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        newBanner.showTitle !== false
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-3.5 rounded-full relative flex items-center p-0.5 transition-colors ${
                        newBanner.showTitle !== false ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                          newBanner.showTitle !== false ? 'translate-x-2.5' : 'translate-x-0'
                        }`} />
                      </div>
                      <span>{newBanner.showTitle !== false ? 'Show' : 'Hide'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      id="input-banner-title-en"
                      placeholder="Title (English), e.g. BOH Tea Cameron Selection"
                      value={newBanner.titleEn || ''}
                      disabled={newBanner.showTitle === false}
                      onChange={(e) => setNewBanner({ ...newBanner, titleEn: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl font-bold outline-none transition-all ${
                        newBanner.showTitle === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                    <input
                      type="text"
                      id="input-banner-title-ms"
                      placeholder="Title (Bahasa Malaysia, optional)"
                      value={newBanner.titleMs || ''}
                      disabled={newBanner.showTitle === false}
                      onChange={(e) => setNewBanner({ ...newBanner, titleMs: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl font-bold outline-none transition-all ${
                        newBanner.showTitle === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* 4. Banner Subtitle / Description */}
                <div className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Banner Subtitle / Description</span>
                      <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <button
                      type="button"
                      id="btn-toggle-subtitle"
                      onClick={() => {
                        const next = newBanner.showSubtitle === false;
                        setNewBanner({ ...newBanner, showSubtitle: next });
                      }}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        newBanner.showSubtitle !== false
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-3.5 rounded-full relative flex items-center p-0.5 transition-colors ${
                        newBanner.showSubtitle !== false ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                          newBanner.showSubtitle !== false ? 'translate-x-2.5' : 'translate-x-0'
                        }`} />
                      </div>
                      <span>{newBanner.showSubtitle !== false ? 'Show' : 'Hide'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      id="input-banner-subtitle-en"
                      placeholder="Subtitle (English), e.g. Highland aromatic blends & daily pantry essentials"
                      value={newBanner.subtitleEn || ''}
                      disabled={newBanner.showSubtitle === false}
                      onChange={(e) => setNewBanner({ ...newBanner, subtitleEn: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl outline-none transition-all ${
                        newBanner.showSubtitle === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                    <input
                      type="text"
                      id="input-banner-subtitle-ms"
                      placeholder="Subtitle (Bahasa Malaysia, optional)"
                      value={newBanner.subtitleMs || ''}
                      disabled={newBanner.showSubtitle === false}
                      onChange={(e) => setNewBanner({ ...newBanner, subtitleMs: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl outline-none transition-all ${
                        newBanner.showSubtitle === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>

                {/* 5. CTA Button ("Shop Now ->") */}
                <div className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-700 text-xs flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
                      <span>CTA Button ("Shop Now →")</span>
                      <span className="text-gray-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <button
                      type="button"
                      id="btn-toggle-cta"
                      onClick={() => {
                        const isCurrentlyActive = newBanner.showCTA !== false && newBanner.showCta !== false && newBanner.showCtaButton !== false;
                        const next = !isCurrentlyActive;
                        setNewBanner({
                          ...newBanner,
                          showCTA: next,
                          showCta: next,
                          showCtaButton: next,
                        });
                      }}
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        newBanner.showCTA !== false && newBanner.showCta !== false && newBanner.showCtaButton !== false
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-gray-100 text-gray-500 border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-3.5 rounded-full relative flex items-center p-0.5 transition-colors ${
                        newBanner.showCTA !== false && newBanner.showCta !== false && newBanner.showCtaButton !== false ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}>
                        <div className={`w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                          newBanner.showCTA !== false && newBanner.showCta !== false && newBanner.showCtaButton !== false ? 'translate-x-2.5' : 'translate-x-0'
                        }`} />
                      </div>
                      <span>{newBanner.showCTA !== false && newBanner.showCta !== false && newBanner.showCtaButton !== false ? 'Show' : 'Hide'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      id="input-banner-cta-text-en"
                      placeholder="CTA Button Text (English), e.g. Shop Now"
                      value={newBanner.ctaTextEn || ''}
                      disabled={newBanner.showCTA === false || newBanner.showCta === false || newBanner.showCtaButton === false}
                      onChange={(e) => setNewBanner({ ...newBanner, ctaTextEn: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl font-bold outline-none transition-all ${
                        newBanner.showCTA === false || newBanner.showCta === false || newBanner.showCtaButton === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                    <input
                      type="text"
                      id="input-banner-cta-text-ms"
                      placeholder="CTA Button Text (Bahasa Malaysia), e.g. Beli Sekarang"
                      value={newBanner.ctaTextMs || ''}
                      disabled={newBanner.showCTA === false || newBanner.showCta === false || newBanner.showCtaButton === false}
                      onChange={(e) => setNewBanner({ ...newBanner, ctaTextMs: e.target.value })}
                      className={`w-full p-2 bg-white border border-gray-300 rounded-xl font-bold outline-none transition-all ${
                        newBanner.showCTA === false || newBanner.showCta === false || newBanner.showCtaButton === false ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'focus:border-emerald-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Publish / Pause Toggle Switch */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 block text-xs">
                    {language === 'en' ? 'Publishing Status' : 'Status Penerbitan'}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {newBanner.isActive
                      ? (language === 'en' ? 'Active on client storefront banner carousel' : 'Aktif pada carousel sepanduk pelanggan')
                      : (language === 'en' ? 'Paused / Draft (hidden from client storefront)' : 'Dijeda / Draf (tersembunyi dari pelanggan)')}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-modal-toggle-publish"
                  onClick={() => setNewBanner({ ...newBanner, isActive: !newBanner.isActive })}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    newBanner.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <div
                    className={`w-8 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                      newBanner.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white shadow-xs transition-transform transform ${
                        newBanner.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <span>{newBanner.isActive ? (language === 'en' ? 'Published' : 'Terbit') : (language === 'en' ? 'Paused' : 'Dijeda')}</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsBannerModalOpen(false);
                    setEditingBannerId(null);
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold cursor-pointer"
                >
                  {language === 'en' ? 'Cancel' : 'Batal'}
                </button>
                <button
                  type="submit"
                  id="btn-submit-save-banner"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingBannerId
                      ? (language === 'en' ? 'Save Changes & Sync Live' : 'Simpan Perubahan & Segerak')
                      : (language === 'en' ? 'Publish Banner to Storefront' : 'Terbitkan Sepanduk ke Pasaraya')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
        );
      })()}

      {/* PARTNER SETTLEMENT LEDGER DETAILS MODAL */}
      {selectedLedgerBanner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900">Partner Account Ledger &amp; Settlement</h3>
                  <p className="text-xs text-gray-500">
                    {selectedLedgerBanner.merchantName || 'Partner'} ({selectedLedgerBanner.merchantCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLedgerBanner(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-semibold block">Gross Revenue Routed</span>
                <span className="text-base font-black text-emerald-950 font-mono">
                  RM {(selectedLedgerBanner.revenueRouted || 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  {selectedLedgerBanner.salesCount || 0} customer orders
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[11px] text-gray-600 font-semibold block">
                  Platform Commission ({selectedLedgerBanner.commissionRate || 10}%)
                </span>
                <span className="text-base font-black text-gray-900 font-mono">
                  RM {((selectedLedgerBanner.revenueRouted || 0) * ((selectedLedgerBanner.commissionRate || 10) / 100)).toFixed(2)}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Retained platform fee</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] text-amber-800 font-semibold block">Net Settlement Due</span>
                <span className="text-base font-black text-amber-950 font-mono">
                  RM {((selectedLedgerBanner.revenueRouted || 0) * (1 - (selectedLedgerBanner.commissionRate || 10) / 100)).toFixed(2)}
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Payable to partner bank</span>
              </div>
            </div>

            {/* Itemized Transactions */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-gray-700">Real-Time Ledger Transactions:</h4>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Date / Ref</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 font-mono text-right">Gross</th>
                      <th className="p-2.5 font-mono text-right">Fee</th>
                      <th className="p-2.5 font-mono text-right">Net Payable</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledgerList
                      .filter(
                        (l) =>
                          l.merchantCode === selectedLedgerBanner.merchantCode ||
                          l.bannerId === selectedLedgerBanner.id
                      )
                      .map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50/70">
                          <td className="p-2.5 font-mono font-bold text-gray-900">
                            <div>{entry.orderRef}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{entry.timestamp}</div>
                          </td>
                          <td className="p-2.5 text-gray-700 max-w-xs truncate">{entry.description}</td>
                          <td className="p-2.5 font-mono text-right font-bold text-gray-900">
                            RM {entry.grossAmount.toFixed(2)}
                          </td>
                          <td className="p-2.5 font-mono text-right text-gray-500">
                            -RM {entry.platformFee.toFixed(2)}
                          </td>
                          <td className="p-2.5 font-mono text-right font-bold text-emerald-700">
                            RM {entry.netPayableToPartner.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    {ledgerList.filter(
                      (l) =>
                        l.merchantCode === selectedLedgerBanner.merchantCode ||
                        l.bannerId === selectedLedgerBanner.id
                    ).length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-400">
                          No orders routed yet. Use the "⚡ Route Test Order" button to generate a ledger transaction.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleSimulateBannerOrder(selectedLedgerBanner)}
                className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Customer Order (+RM 120)</span>
              </button>

              <div className="flex items-center gap-2">
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLedgerBanner(null);
                      onNavigateTab('finance');
                    }}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Financial Ledger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLedgerBanner(null)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
