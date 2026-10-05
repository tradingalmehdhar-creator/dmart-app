import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Store,
  Lock,
  Bike,
  ShieldCheck,
  Cloud,
  Sparkles,
  Info,
  CreditCard,
  Building2,
  RefreshCw,
  Layout,
  Smartphone,
  Monitor,
  Heading,
  Tag
} from 'lucide-react';
import { StorefrontCopySettings, DEFAULT_STOREFRONT_COPY, Language } from '../../types';
import {
  saveStorefrontCopyToFirestore,
  getStorefrontCopyFromFirestore,
  subscribeToStorefrontCopy
} from '../../firebase_config';

interface AdminStorefrontCopyPanelProps {
  language: Language;
}

export const AdminStorefrontCopyPanel: React.FC<AdminStorefrontCopyPanelProps> = ({ language }) => {
  const isEn = language === 'en';

  const [formData, setFormData] = useState<StorefrontCopySettings>(() => {
    try {
      const local = localStorage.getItem('dmart_storefront_copy');
      if (local) return { ...DEFAULT_STOREFRONT_COPY, ...JSON.parse(local) };
    } catch {}
    return DEFAULT_STOREFRONT_COPY;
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');

  // Subscribe to live Firestore storefront_config
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToStorefrontCopy((cloudConfig) => {
      if (!isMounted) return;
      if (cloudConfig) {
        setFormData((prev) => ({ ...prev, ...cloudConfig }));
        setIsCloudSynced(true);
        if (cloudConfig.updatedAt) {
          setLastSavedAt(
            new Date(cloudConfig.updatedAt).toLocaleTimeString('en-MY', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          );
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleChange = (field: keyof StorefrontCopySettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveStorefrontCopyToFirestore(formData);
      setIsCloudSynced(true);
      const timeStr = new Date().toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedAt(timeStr);
      showToast(
        isEn
          ? 'Storefront hero, category headlines & copies successfully saved to Firestore!'
          : 'Banner hero, tajuk bahagian & salinan pasaraya berjaya disimpan ke Firestore!'
      );
    } catch (error) {
      console.error('Error saving Storefront copy config:', error);
      showToast(
        isEn
          ? 'Notice: Saved to local storage. Cloud sync will retry on connection.'
          : 'Notis: Disimpan ke storan tempatan. Sinkronisasi awan akan dicuba semula.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        isEn
          ? 'Reset all Storefront copies and headlines back to default D-mart values?'
          : 'Set semula semua teks Pengepala, Hero & Pengaki ke nilai lalai D-mart?'
      )
    ) {
      setFormData(DEFAULT_STOREFRONT_COPY);
      showToast(
        isEn
          ? 'Form reset to default D-mart values. Click "Save Changes" to publish to Firestore.'
          : 'Borang ditetapkan semula ke lalai D-mart. Klik "Simpan Perubahan" untuk terbitkan ke Firestore.'
      );
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex items-center justify-between text-xs text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-1.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner & Cloud Sync Indicator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-gray-900 text-base sm:text-lg">
                {isEn ? 'Banners & Copy Management' : 'Pengurusan Salinan & Banner'}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Cloud className="w-3 h-3 text-emerald-600" />
                Live Firestore
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              {isEn
                ? 'Dynamically configure customer storefront hero banners, department category section titles, announcement bar copies, and official footer statements with instant real-time synchronization.'
                : 'Urus teks banner hero pelanggan, tajuk jabatan kategori, salinan pengumuman, dan penyata pengaki rasmi dengan sinkronisasi masa nyata.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          {lastSavedAt && (
            <span className="text-[11px] text-gray-400 font-mono hidden sm:inline-block">
              {isEn ? `Synced: ${lastSavedAt}` : `Disimpan: ${lastSavedAt}`}
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isEn ? 'Reset to default D-mart copies' : 'Set semula ke salinan lalai'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEn ? 'Defaults' : 'Lalai'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Configuration Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveChanges} className="space-y-5">
            {/* Section 1: Hero Welcome Banner Copy */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {isEn ? '1. Storefront Hero Banner Headlines' : '1. Teks Banner Hero Utama'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {isEn ? 'Prominent hero card displayed directly under promotional banners' : 'Kad banner hero utama di bahagian atas katalog'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Hero Card
                </span>
              </div>

              {/* 1A: Hero Badge Tag */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Hero Badge Tag (English)' : 'Teks Tag Lencana Hero (Bahasa Inggeris)'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={formData.heroBadgeTag}
                    onChange={(e) => handleChange('heroBadgeTag', e.target.value)}
                    placeholder="e.g. Fresh Groceries Delivered in 2 Hours"
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                  />
                  <div className="px-2.5 py-1.5 bg-slate-900 text-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 border border-slate-700">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span className="truncate max-w-[130px]">{formData.heroBadgeTag || 'Badge'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Hero Badge Tag (Bahasa Malaysia - Optional)' : 'Teks Tag Lencana Hero (Bahasa Malaysia)'}
                </label>
                <input
                  type="text"
                  value={formData.heroBadgeTagMs || ''}
                  onChange={(e) => handleChange('heroBadgeTagMs', e.target.value)}
                  placeholder="e.g. Penghantaran Segar Dalam 2 Jam"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>

              {/* 1B: Hero Main Headline */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Hero Main Headline (English)' : 'Tajuk Utama Hero (Bahasa Inggeris)'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.heroMainHeadline}
                  onChange={(e) => handleChange('heroMainHeadline', e.target.value)}
                  placeholder="e.g. D-mart Supermarket Malaysia"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-black text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Hero Main Headline (Bahasa Malaysia - Optional)' : 'Tajuk Utama Hero (Bahasa Malaysia)'}
                </label>
                <input
                  type="text"
                  value={formData.heroMainHeadlineMs || ''}
                  onChange={(e) => handleChange('heroMainHeadlineMs', e.target.value)}
                  placeholder="e.g. Pasaraya D-mart Malaysia"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-black text-gray-900"
                />
              </div>

              {/* 1C: Hero Sub-headline / Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Hero Sub-headline / Description (English)' : 'Sari Kata / Keterangan Hero (Bahasa Inggeris)'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.heroSubHeadline}
                  onChange={(e) => handleChange('heroSubHeadline', e.target.value)}
                  placeholder="e.g. Farm-fresh vegetables, seafood, poultry, pantry staples, and daily home essentials."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Hero Sub-headline / Description (Bahasa Malaysia - Optional)' : 'Sari Kata / Keterangan Hero (Bahasa Malaysia)'}
                </label>
                <textarea
                  rows={2}
                  value={formData.heroSubHeadlineMs || ''}
                  onChange={(e) => handleChange('heroSubHeadlineMs', e.target.value)}
                  placeholder="e.g. Sayur-sayuran segar, makanan laut, ayam, beras & keperluan harian sekeluarga."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Section 2: Department Category Section Title */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {isEn ? '2. Department Category Section Header' : '2. Tajuk Bahagian Jabatan Kategori'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {isEn ? 'Header title displayed above supermarket category shortcut cards' : 'Tajuk utama di atas kad pintasan kategori pasaraya'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Section Header
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {isEn ? 'Category Section Title (English)' : 'Tajuk Bahagian Kategori (English)'}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.categorySectionTitle}
                    onChange={(e) => handleChange('categorySectionTitle', e.target.value)}
                    placeholder="e.g. Shop by Supermarket Department"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {isEn ? 'Category Section Title (Bahasa Malaysia)' : 'Tajuk Bahagian Kategori (Bahasa Malaysia)'}
                  </label>
                  <input
                    type="text"
                    value={formData.categorySectionTitleMs || ''}
                    onChange={(e) => handleChange('categorySectionTitleMs', e.target.value)}
                    placeholder="e.g. Beli Mengikut Jabatan Pasaraya"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Top Announcement Bar Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {isEn ? '3. Top Announcement Bar Text' : '3. Teks Bar Pengumuman Atas'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {isEn ? 'Prominent banner shown on top of the storefront header' : 'Sepanduk utama di bahagian paling atas skrin'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Header Top
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Announcement Bar Text (Primary / English)' : 'Teks Bar Pengumuman (Bahasa Inggeris)'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.announcementBarText}
                  onChange={(e) => handleChange('announcementBarText', e.target.value)}
                  placeholder="e.g. FREE Delivery on orders over RM 60 • Halal Certified Fresh Groceries"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Announcement Bar Text (Bahasa Malaysia - Optional)' : 'Teks Bar Pengumuman (Bahasa Malaysia)'}
                </label>
                <input
                  type="text"
                  value={formData.announcementBarTextMs || ''}
                  onChange={(e) => handleChange('announcementBarTextMs', e.target.value)}
                  placeholder="e.g. Penghantaran PERCUMA untuk pesanan melebihi RM 60 • Barangan Runcit Segar Halal"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                />
              </div>
            </div>

            {/* Section 4: Store Logo Badge Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {isEn ? '4. Store Badge Text Next to Logo' : '4. Teks Lencana Sebelah Logo'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {isEn ? 'Pill badge rendered beside the D-mart brand emblem' : 'Lencana bujur di sebelah nama D-mart'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  Brand Pill
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Store Badge Text' : 'Teks Lencana Logo'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={formData.storeBadgeText}
                    onChange={(e) => handleChange('storeBadgeText', e.target.value.toUpperCase())}
                    placeholder="e.g. PASARAYA"
                    className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-black tracking-wider uppercase font-mono"
                  />
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl shrink-0">
                    <span className="text-[10px] text-emerald-800 font-bold">Preview:</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-300 tracking-tight leading-none uppercase">
                      {formData.storeBadgeText || 'PASARAYA'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: Footer Brand Title & Subtitle */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {isEn ? '5. Footer Brand Title & Subtitle' : '5. Tajuk & Sari Kata Jenama Pengaki'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {isEn ? 'Primary branding line in the storefront footer' : 'Kenyataan jenama di bahagian pengaki laman'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Footer Brand
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {isEn ? 'Footer Brand Title' : 'Nama Jenama Pengaki'}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.footerBrandTitle}
                    onChange={(e) => handleChange('footerBrandTitle', e.target.value)}
                    placeholder="e.g. D-mart Malaysia"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {isEn ? 'Footer Subtitle / Tagline' : 'Sari Kata / Tagline Pengaki'}
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.footerBrandSubtitle}
                    onChange={(e) => handleChange('footerBrandSubtitle', e.target.value)}
                    placeholder="e.g. Your Neighbourhood Online Supermarket"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium text-gray-700"
                  />
                </div>
              </div>
            </div>

            {/* Section 6: Footer Payment Methods & Copyright */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {isEn ? '6. Footer Payment Methods & Copyright' : '6. Kaedah Pembayaran & Hak Cipta'}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {isEn ? 'Payment gateway disclosures and legal copyright notice' : 'Pendedahan pembayaran dan notis hak cipta undang-undang'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Legal & Payment
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Footer Payment Methods Text' : 'Teks Kaedah Pembayaran Pengaki'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.footerPaymentMethodsText}
                  onChange={(e) => handleChange('footerPaymentMethodsText', e.target.value)}
                  placeholder="Cash on Delivery (COD) • FPX Online Banking • Touch 'n Go eWallet • Google Maps Location"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isEn ? 'Footer Copyright Notice' : 'Notis Hak Cipta Pengaki'}
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.footerCopyrightNotice}
                  onChange={(e) => handleChange('footerCopyrightNotice', e.target.value)}
                  placeholder="© 2026 D-mart Supermarket Sdn. Bhd."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
                />
              </div>
            </div>

            {/* Protected System Controls Notice (Strict Requirement) */}
            <div className="bg-slate-900 text-white rounded-2xl p-4.5 border border-slate-800 shadow-md space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="uppercase tracking-wider">
                  {isEn ? 'Strict Security Requirement: Protected System Controls' : 'Keperluan Keselamatan Ketat: Butang Akses Dilindungi'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {isEn
                  ? 'The "Staff Access" (🔒 Staff Access) and "Rider Access" (🚲 Rider Access) action buttons at the bottom right of the storefront footer are strictly protected system controls. They are permanently hardcoded and locked for portal security and cannot be edited or removed from this console.'
                  : 'Butang "Staff Access" (🔒 Akses Staf) dan "Rider Access" (🚲 Akses Rider) pada pengaki bawah kanan adalah kawalan sistem yang dilindungi secara kekal demi keselamatan peranan dan tidak boleh diubah atau dibuang.'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-mono">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Staff Access: IMMUTABLE
                </span>
                <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-mono">
                  <Bike className="w-3 h-3 text-emerald-400" />
                  Rider Access: IMMUTABLE
                </span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isEn ? 'Publishing to Firestore...' : 'Menerbitkan ke Firestore...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{isEn ? 'Save Changes & Sync Storefront' : 'Simpan Perubahan & Segerak'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Real-time Live Customer Storefront Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Eye className="w-4 h-4" />
                <span>{isEn ? 'Live Storefront Simulation' : 'Simulasi Skrin Pelanggan Masa Nyata'}</span>
              </div>

              {/* Viewport switcher */}
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    previewViewport === 'desktop'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="w-3 h-3" />
                  <span className="hidden sm:inline">Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                    previewViewport === 'mobile'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3 h-3" />
                  <span className="hidden sm:inline">Mobile</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
              {isEn
                ? 'Review your updated hero welcome card, category section title, announcement banner, and footer in real-time.'
                : 'Semak paparan banner hero, tajuk bahagian kategori, bar pengumuman, dan pengaki secara langsung.'}
            </p>
          </div>

          <div className={`transition-all duration-300 ${previewViewport === 'mobile' ? 'max-w-[340px] mx-auto' : 'w-full'} space-y-4`}>
            {/* Simulation 1: Top Announcement Bar & Navbar Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Header & Announcement
                </span>
                <span className="text-[10px] text-gray-400">Live Navbar</span>
              </div>

              {/* Simulated Announcement Bar */}
              <div className="bg-emerald-600 text-white text-[11px] py-1.5 px-3 font-medium flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span className="truncate">
                    {formData.announcementBarText || DEFAULT_STOREFRONT_COPY.announcementBarText}
                  </span>
                </div>
                <span className="bg-emerald-700/70 px-1.5 py-0.2 rounded text-[9px] font-bold shrink-0">
                  🇲🇾 MY
                </span>
              </div>

              {/* Simulated Navbar Brand with Logo & Badge */}
              <div className="p-3 bg-white flex items-center justify-between border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-tight text-emerald-900 leading-none">
                      D<span className="text-emerald-500">-mart</span>
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-emerald-200 tracking-tight leading-none uppercase">
                      {formData.storeBadgeText || 'PASARAYA'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                  Active
                </span>
              </div>
            </div>

            {/* Simulation 2: Hero Welcome Banner & Category Section Title Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Heading className="w-3.5 h-3.5 text-emerald-600" />
                  Hero Banner & Section Header
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Responsive
                </span>
              </div>

              <div className="p-3.5 space-y-3.5">
                {/* Simulated Hero Card */}
                <div className="rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-3.5 shadow-xs relative overflow-hidden flex flex-col gap-2 border border-emerald-600/30">
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />

                  <div className="relative z-10 flex flex-col gap-2 min-w-0">
                    <div className="inline-flex items-center gap-1.5 bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-300 shrink-0 self-start border border-white/10">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>{formData.heroBadgeTag || DEFAULT_STOREFRONT_COPY.heroBadgeTag}</span>
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h1 className="text-sm font-black tracking-tight text-white leading-tight break-words">
                        {formData.heroMainHeadline || DEFAULT_STOREFRONT_COPY.heroMainHeadline}
                      </h1>
                      <p className="text-[11px] text-emerald-100 font-medium leading-relaxed break-words">
                        {formData.heroSubHeadline || DEFAULT_STOREFRONT_COPY.heroSubHeadline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Category Department Title */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xs sm:text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5 truncate">
                      <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        {formData.categorySectionTitle || DEFAULT_STOREFRONT_COPY.categorySectionTitle}
                      </span>
                    </h2>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0">
                      Explore →
                    </span>
                  </div>

                  {/* Micro mini-pills preview */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-900 flex items-center gap-1.5">
                      <span>🍎 Fresh</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
                      <span>🥫 Groceries</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation 3: Footer Preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
              <div className="px-3.5 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Storefront Footer Preview
                </span>
                <span className="text-[10px] text-gray-400">Desktop / Mobile</span>
              </div>

              <div className="p-3.5 bg-white space-y-3 text-xs text-gray-500">
                {/* Brand Title & Subtitle */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="w-5 h-5 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                    D
                  </div>
                  <span className="font-bold text-gray-900 truncate text-[11px]">
                    {formData.footerBrandTitle || DEFAULT_STOREFRONT_COPY.footerBrandTitle}
                  </span>
                  <span className="text-gray-400 text-[10px]">•</span>
                  <span className="text-[10px] text-gray-600 truncate">
                    {formData.footerBrandSubtitle || DEFAULT_STOREFRONT_COPY.footerBrandSubtitle}
                  </span>
                </div>

                {/* Payment Methods */}
                <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 text-[10px] text-gray-600 leading-snug break-words">
                  <span className="font-semibold text-gray-700 block text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">
                    Payment Channels:
                  </span>
                  <span>{formData.footerPaymentMethodsText || DEFAULT_STOREFRONT_COPY.footerPaymentMethodsText}</span>
                </div>

                {/* Copyright Notice and Protected Access Buttons */}
                <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5 text-[10px] text-gray-400">
                  <span className="truncate">
                    {formData.footerCopyrightNotice || DEFAULT_STOREFRONT_COPY.footerCopyrightNotice}
                  </span>

                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                      <Lock className="w-2.5 h-2.5 text-gray-400" />
                      <span>Staff Access</span>
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                      <Bike className="w-2.5 h-2.5 text-gray-400" />
                      <span>Rider Access</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-3.5 py-1.5 bg-emerald-50/50 border-t border-emerald-100 text-[10px] text-emerald-800 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Protected access buttons remain permanently intact.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
