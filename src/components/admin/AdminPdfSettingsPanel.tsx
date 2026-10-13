import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Cloud,
  Eye,
  Info,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  EyeOff,
  Layers,
  FileSpreadsheet,
  Receipt,
  Check,
  FileCheck,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { PdfConfigSettings, DEFAULT_PDF_CONFIG, Language, PdfLogoPosition } from '../../types';
import {
  savePdfConfigToFirestore,
  subscribeToPdfConfig
} from '../../firebase_config';
import {
  getGlobalPdfConfig,
  setGlobalPdfConfig,
  exportSamplePdfPreview
} from '../../utils/pdfGenerator';

interface AdminPdfSettingsPanelProps {
  language: Language;
}

export const AdminPdfSettingsPanel: React.FC<AdminPdfSettingsPanelProps> = ({ language }) => {
  const isEn = language === 'en';

  const [formData, setFormData] = useState<PdfConfigSettings>(() => getGlobalPdfConfig());
  const [savedConfig, setSavedConfig] = useState<PdfConfigSettings>(() => getGlobalPdfConfig());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'invoice' | 'statement' | 'report'>('invoice');
  const [isLivePreviewEnabled, setIsLivePreviewEnabled] = useState<boolean>(true);

  // Check if live preview reflects uncommitted draft adjustments
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(savedConfig);

  // Subscribe to live Firestore pdf_config
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = subscribeToPdfConfig((cloudConfig) => {
      if (!isMounted) return;
      if (cloudConfig) {
        setFormData(cloudConfig);
        setSavedConfig(cloudConfig);
        setGlobalPdfConfig(cloudConfig);
        setIsCloudSynced(true);
        if (cloudConfig.updatedAt) {
          setLastSavedAt(new Date(cloudConfig.updatedAt).toLocaleTimeString('en-MY', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }));
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleChange = <K extends keyof PdfConfigSettings>(field: K, value: PdfConfigSettings[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Instant in-memory sync for preview and exports
      setGlobalPdfConfig(updated);
      return updated;
    });
  };

  const handleRevertChanges = () => {
    setFormData(savedConfig);
    setGlobalPdfConfig(savedConfig);
    showToast(
      isEn
        ? 'Reverted live preview to last saved template configuration'
        : 'Pratonton langsung dikembalikan kepada tetapan terakhir disimpan'
    );
  };

  const handleSaveChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await savePdfConfigToFirestore(formData);
      setSavedConfig(formData);
      setGlobalPdfConfig(formData);
      setIsCloudSynced(true);
      const timeStr = new Date().toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSavedAt(timeStr);
      showToast(
        isEn
          ? 'PDF Template settings successfully saved and deployed!'
          : 'Tetapan Templat PDF berjaya disimpan dan digunapakai!'
      );
    } catch (error) {
      console.error('Error saving PDF config:', error);
      showToast(
        isEn
          ? 'Saved locally to browser cache. Cloud sync will retry.'
          : 'Disimpan secara setempat. Penyelarasan awan akan dicuba semula.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        isEn
          ? 'Reset all PDF template settings, layout margins, and text to system defaults?'
          : 'Tetapkan semula semua tetapan templat PDF, margin susun atur, dan teks kepada lalai sistem?'
      )
    ) {
      setFormData(DEFAULT_PDF_CONFIG);
      setGlobalPdfConfig(DEFAULT_PDF_CONFIG);
      showToast(
        isEn ? 'Settings reset to default template configuration' : 'Tetapan ditetapkan semula kepada konfigurasi lalai'
      );
    }
  };

  const handleApplyPreset = (preset: 'standard' | 'compact' | 'spacious') => {
    if (preset === 'standard') {
      setFormData((prev) => {
        const u: PdfConfigSettings = { ...prev, topMargin: 12, bottomMargin: 14, pagePadding: 14, sectionSpacing: 6 };
        setGlobalPdfConfig(u);
        return u;
      });
      showToast(isEn ? 'Applied Standard spacing preset (12mm / 14mm / 6mm)' : 'Gaya Standard diaplikasikan');
    } else if (preset === 'compact') {
      setFormData((prev) => {
        const u: PdfConfigSettings = { ...prev, topMargin: 8, bottomMargin: 10, pagePadding: 10, sectionSpacing: 4 };
        setGlobalPdfConfig(u);
        return u;
      });
      showToast(isEn ? 'Applied Compact spacing preset (8mm / 10mm / 4mm)' : 'Gaya Kompak diaplikasikan');
    } else {
      setFormData((prev) => {
        const u: PdfConfigSettings = { ...prev, topMargin: 16, bottomMargin: 18, pagePadding: 18, sectionSpacing: 8 };
        setGlobalPdfConfig(u);
        return u;
      });
      showToast(isEn ? 'Applied Spacious layout preset (16mm / 18mm / 8mm)' : 'Gaya Luas diaplikasikan');
    }
  };

  const handleDownloadTestPdf = (type: 'statement' | 'invoice' | 'report') => {
    try {
      exportSamplePdfPreview(formData, type);
      const label = type === 'invoice' ? 'Invoice' : type === 'report' ? 'Z-Report' : 'Statement';
      showToast(
        isEn
          ? `Sample ${label} PDF exported with active settings!`
          : `Sampel ${label} PDF berjaya dieksport!`
      );
    } catch (err) {
      console.error('Error exporting sample PDF:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const logoOptions: { id: PdfLogoPosition; label: string; icon: React.ReactNode }[] = [
    { id: 'left', label: isEn ? 'Left (Default)' : 'Kiri (Lalai)', icon: <AlignLeft className="w-4 h-4" /> },
    { id: 'center', label: isEn ? 'Center' : 'Tengah', icon: <AlignCenter className="w-4 h-4" /> },
    { id: 'right', label: isEn ? 'Right' : 'Kanan', icon: <AlignRight className="w-4 h-4" /> },
    { id: 'hidden', label: isEn ? 'Hidden / None' : 'Sorokkan', icon: <EyeOff className="w-4 h-4" /> },
  ];

  return (
    <div id="admin-pdf-template-settings-panel" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-500/50 text-xs font-bold animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                {isEn ? 'PDF Template Settings Console' : 'Konsol Tetapan Templat PDF'}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Cloud className="w-3 h-3 text-emerald-600" />
                {isCloudSynced ? 'Firestore Live Synced' : 'Local Storage Mode'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              {isEn
                ? 'Customize document header/footer text, logo positioning, top/bottom margins, page padding, and section spacing. Toggle visibility for legal disclaimers, SSM registration info, and computer-generated signature notes across Invoices, Driver Statements, and Reports.'
                : 'Sesuaikan teks pengepala/pengaki, posisi logo, margin atas/bawah, padding halaman, dan jarak seksyen. Tukar keterlihatan penafian undang-undang, info SSM, dan nota tandatangan komputer untuk Invois, Penyata Rider, dan Laporan.'}
            </p>
          </div>
        </div>

        {/* Quick Test Export Actions & Live Preview Toggle */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {/* Header Live Preview Toggle Button */}
          <button
            type="button"
            id="live-preview-header-toggle-btn"
            data-testid="live-preview-header-toggle-btn"
            onClick={() => setIsLivePreviewEnabled((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer border shadow-2xs ${
              isLivePreviewEnabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
            }`}
            title={isEn ? 'Toggle Live Preview' : 'Tukar Pratonton Langsung'}
          >
            {isLivePreviewEnabled ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>{isEn ? 'Live Preview: ON' : 'Pratonton: AKTIF'}</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>{isEn ? 'Live Preview: OFF' : 'Pratonton: TUTUP'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="download-test-invoice-btn"
            onClick={() => handleDownloadTestPdf('invoice')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download test Invoice PDF"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isEn ? 'Test Invoice' : 'Invois Ujian'}</span>
          </button>
          <button
            type="button"
            id="download-test-statement-btn"
            onClick={() => handleDownloadTestPdf('statement')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download test Statement PDF"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{isEn ? 'Test Statement' : 'Penyata Ujian'}</span>
          </button>
          <button
            type="button"
            id="download-test-report-btn"
            onClick={() => handleDownloadTestPdf('report')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Download test Z-Report PDF"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isEn ? 'Test Z-Report' : 'Laporan Z'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Real-Time Dynamic Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveChanges} className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-6">
            {/* Header Status & Title */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-700" />
                <h3 className="font-black text-sm text-gray-900">
                  {isEn ? '1. Top Header Text & Company Logo Positioning' : '1. Pengepala & Kedudukan Logo Syarikat'}
                </h3>
              </div>
              {lastSavedAt && (
                <span className="text-[10px] text-gray-400 font-mono">
                  {isEn ? `Saved at ${lastSavedAt}` : `Disimpan pada ${lastSavedAt}`}
                </span>
              )}
            </div>

            {/* Field 1: Company / Brand Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                  <span>{isEn ? 'Official Company / Brand Name (Top Header)' : 'Nama Syarikat / Jenama (Pengepala)'}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleChange('companyName', 'D-mart Supermarket & Retail Logistics')}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Preset 1
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleChange('companyName', 'D-mart Retail (Malaysia) Sdn. Bhd.')}
                    className="text-emerald-700 hover:underline cursor-pointer"
                  >
                    Preset 2
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="e.g. D-mart Supermarket & Retail Logistics"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
              />
            </div>

            {/* Field: Header Subtitle / Slogan */}
            <div>
              <label className="text-xs font-black text-gray-800 block mb-1.5">
                <span>{isEn ? 'Header Subtitle / Department Slogan' : 'Sari Kata Pengepala / Slogan'}</span>
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={formData.headerSubtitle}
                onChange={(e) => handleChange('headerSubtitle', e.target.value)}
                placeholder="e.g. FLEET LOGISTICS & COURIER DISPATCH • OFFICIAL TREASURY CLEARING & STATEMENTS"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
              />
            </div>

            {/* Field: Custom Top Header Text / Tagline */}
            <div>
              <label className="text-xs font-black text-gray-800 block mb-1.5">
                <span>{isEn ? 'Custom Top Header Tagline / Notice' : 'Teks Pengepala Tersuai / Slogan Tambahan'}</span>
              </label>
              <input
                type="text"
                value={formData.customHeaderText || ''}
                onChange={(e) => handleChange('customHeaderText', e.target.value)}
                placeholder="e.g. Fresh Grocery Logistics & Express Doorstep Delivery"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
              />
            </div>

            {/* Logo Positioning Selector */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-black text-emerald-950 block">
                    {isEn ? 'Company Logo Positioning' : 'Kedudukan Logo Syarikat'}
                  </label>
                  <p className="text-[11px] text-emerald-800/80">
                    {isEn
                      ? 'Controls where the official D-mart emblem renders on generated document banners.'
                      : 'Kawal kedudukan lambang rasmi syarikat pada sepanduk dokumen.'}
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900">
                  <input
                    type="checkbox"
                    checked={formData.showCompanyLogo}
                    onChange={(e) => handleChange('showCompanyLogo', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span>{isEn ? 'Show Logo' : 'Papar Logo'}</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {logoOptions.map((opt) => {
                  const isActive = formData.logoPosition === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`logo-position-btn-${opt.id}`}
                      onClick={() => handleChange('logoPosition', opt.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-50/50'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-[11px]">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SSM Registration & Support Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1.5">
                  <span>{isEn ? 'SSM Registration Number' : 'No. Pendaftaran SSM'}</span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ssmRegistrationNumber}
                  onChange={(e) => handleChange('ssmRegistrationNumber', e.target.value)}
                  placeholder="e.g. 202301048821 (1542109-M)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                />
              </div>

              <div>
                <label className="text-xs font-black text-gray-800 block mb-1.5">
                  <span>{isEn ? 'Support Contact Phone & Email' : 'Maklumat Sokongan & E-mel'}</span>
                </label>
                <input
                  type="text"
                  value={formData.supportContact}
                  onChange={(e) => handleChange('supportContact', e.target.value)}
                  placeholder="e.g. Phone: +60 3-8912 8820 • Email: treasury-ops@d-mart.my"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Section 2: Layout Margins, Page Padding & Section Spacing */}
            <div className="pt-3 border-t border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-black text-sm text-gray-900">
                    {isEn ? '2. Margins, Padding & Section Spacing Engine' : '2. Margin, Padding & Jarak Seksyen'}
                  </h3>
                </div>
                {/* Presets */}
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span className="text-gray-400 mr-1">{isEn ? 'Presets:' : 'Pratetap:'}</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('compact')}
                    className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                  >
                    {isEn ? 'Compact' : 'Kompak'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('standard')}
                    className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer"
                  >
                    {isEn ? 'Standard' : 'Standard'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('spacious')}
                    className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                  >
                    {isEn ? 'Spacious' : 'Luas'}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                {isEn
                  ? 'Dynamically calibrates page boundary clearance and section gaps to prevent table collision and text overlap across long documents.'
                  : 'Tentukur kelegaan sempadan halaman dan jarak antara seksyen bagi mengelakkan pertindihan teks dalam dokumen panjang.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Top Margin */}
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-gray-800">{isEn ? 'Top Margin' : 'Margin Atas'}</span>
                    <span className="font-mono font-bold text-emerald-700">{formData.topMargin} mm</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="26"
                    step="1"
                    value={formData.topMargin}
                    onChange={(e) => handleChange('topMargin', Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">{isEn ? 'Header clearance from top page edge' : 'Jarak pengepala dari sempadan atas'}</p>
                </div>

                {/* Bottom Margin */}
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-gray-800">{isEn ? 'Bottom Margin' : 'Margin Bawah'}</span>
                    <span className="font-mono font-bold text-emerald-700">{formData.bottomMargin} mm</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="30"
                    step="1"
                    value={formData.bottomMargin}
                    onChange={(e) => handleChange('bottomMargin', Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">{isEn ? 'Reserved clearance for footer and legal text' : 'Ruang rizab untuk pengaki dan teks undang-undang'}</p>
                </div>

                {/* Page Padding (Horizontal) */}
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-gray-800">{isEn ? 'Page Padding (Left & Right)' : 'Padding Halaman (Kiri & Kanan)'}</span>
                    <span className="font-mono font-bold text-emerald-700">{formData.pagePadding} mm</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="24"
                    step="1"
                    value={formData.pagePadding}
                    onChange={(e) => handleChange('pagePadding', Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">{isEn ? 'Side margins to keep content centered' : 'Margin sisi agar kandungan teratur rapi'}</p>
                </div>

                {/* Section Spacing */}
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-gray-800">{isEn ? 'Section Spacing (Gaps)' : 'Jarak Antara Seksyen'}</span>
                    <span className="font-mono font-bold text-emerald-700">{formData.sectionSpacing} mm</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="16"
                    step="1"
                    value={formData.sectionSpacing}
                    onChange={(e) => handleChange('sectionSpacing', Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">{isEn ? 'Vertical space between cards & tables' : 'Jarak menegak mengelakkan pertindihan jadual'}</p>
                </div>
              </div>
            </div>

            {/* Section 3: Visibility Toggles */}
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="font-black text-sm text-gray-900">
                  {isEn ? '3. Statutory Visibility Toggles' : '3. Kawalan Keterlihatan Statutori'}
                </h3>
              </div>

              <div className="space-y-2.5">
                {/* Toggle 1: Legal Disclaimers */}
                <label className="flex items-start justify-between p-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="pr-4">
                    <span className="text-xs font-black text-gray-900 block">
                      {isEn ? 'Display Statutory Legal Disclaimers' : 'Papar Penafian Statutori Undang-undang'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {isEn
                        ? 'Includes the Malaysian Digital Signature Act 1997 statutory certificate text in the document footer.'
                        : 'Menyertakan teks Akta Tandatangan Digital Malaysia 1997 di pengaki dokumen.'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-show-legal-disclaimer"
                    checked={formData.showLegalDisclaimer}
                    onChange={(e) => handleChange('showLegalDisclaimer', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                </label>

                {/* Toggle 2: SSM Registration Info */}
                <label className="flex items-start justify-between p-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="pr-4">
                    <span className="text-xs font-black text-gray-900 block">
                      {isEn ? 'Display SSM Registration Number & Info' : 'Papar Nombor & Maklumat Pendaftaran SSM'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {isEn
                        ? 'Prints official SSM statutory registration number across header banners and footer stamps.'
                        : 'Mencetak nombor pendaftaran SSM pada sepanduk atas dan meterai pengaki.'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-show-ssm-registration"
                    checked={formData.showSsmRegistration}
                    onChange={(e) => handleChange('showSsmRegistration', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                </label>

                {/* Toggle 3: Computer-Generated Signature Notes */}
                <label className="flex items-start justify-between p-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="pr-4">
                    <span className="text-xs font-black text-gray-900 block">
                      {isEn ? 'Display Computer-Generated Signature Note' : 'Papar Nota Dokumen Dijana Komputer'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {isEn
                        ? 'Confirms document is digitally produced and certified without physical signature required.'
                        : 'Mengesahkan dokumen dijana secara komputer tanpa memerlukan tandatangan fizikal.'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="toggle-show-signature-note"
                    checked={formData.showSignatureNote}
                    onChange={(e) => handleChange('showSignatureNote', e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                </label>
              </div>
            </div>

            {/* Section 4: Bottom Footer Text & Certificate Notes */}
            <div className="pt-3 border-t border-gray-100 space-y-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="font-black text-sm text-gray-900">
                  {isEn ? '4. Bottom Footer & Certificate Notes' : '4. Teks Pengaki & Meterai Sijil'}
                </h3>
              </div>

              {/* Signature Note Text */}
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1.5">
                  <span>{isEn ? 'Computer-Generated Signature Note Text' : 'Teks Nota Tandatangan Komputer'}</span>
                </label>
                <input
                  type="text"
                  value={formData.signatureNoteText}
                  onChange={(e) => handleChange('signatureNoteText', e.target.value)}
                  placeholder="e.g. This is a computer-generated document. No physical signature is required."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                />
              </div>

              {/* Footer Legal Disclaimer Text */}
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1.5">
                  <span>{isEn ? 'Statutory Legal Disclaimer Text' : 'Teks Penafian Statutori'}</span>
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.footerDisclaimer}
                  onChange={(e) => handleChange('footerDisclaimer', e.target.value)}
                  placeholder="e.g. This official statement is generated directly from the D-mart Supermarket Retail & Fleet Operations Portal. Certified valid under the Malaysian Digital Signature Act 1997."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                />
              </div>

              {/* Certificate & Audit Header */}
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1.5">
                  <span>{isEn ? 'Certificate Seal / Audit Statement' : 'Meterai Sijil / Tajuk Audit'}</span>
                </label>
                <input
                  type="text"
                  value={formData.certificateText}
                  onChange={(e) => handleChange('certificateText', e.target.value)}
                  placeholder="e.g. OFFICIALLY AUDITED & CERTIFIED • D-MART RETAIL HOLDINGS SDN. BHD."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                />
              </div>

              {/* Custom Footer Text */}
              <div>
                <label className="text-xs font-black text-gray-800 block mb-1.5">
                  <span>{isEn ? 'Custom Footer Line / Website URL' : 'Teks Baris Pengaki / Laman Web'}</span>
                </label>
                <input
                  type="text"
                  value={formData.customFooterText || ''}
                  onChange={(e) => handleChange('customFooterText', e.target.value)}
                  placeholder="e.g. Thank you for choosing D-mart Malaysia • https://d-mart.my"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50/50"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                id="reset-pdf-settings-defaults-btn"
                onClick={handleResetDefaults}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>{isEn ? 'Reset to Defaults' : 'Tetapkan Semula'}</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="submit"
                  id="save-pdf-template-settings-btn"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? (isEn ? 'Saving to Firestore...' : 'Menyimpan...') : (isEn ? 'Save Template Settings' : 'Simpan Tetapan Templat')}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Real-Time Multi-Document Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Live Preview Card Header with Dedicated Toggle Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isLivePreviewEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isLivePreviewEnabled ? (
                    <Eye className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900 leading-tight">
                    {isEn ? 'Live Document Preview' : 'Pratonton Dokumen Langsung'}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    {isLivePreviewEnabled
                      ? isEn
                        ? 'Real-time rendered layout before saving'
                        : 'Paparan masa nyata susun atur sebelum disimpan'
                      : isEn
                      ? 'Preview rendering paused'
                      : 'Pratonton dijeda'}
                  </p>
                </div>
              </div>

              {/* Dedicated Live Preview Toggle Switch */}
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-gray-600 select-none">
                  {isEn ? 'Live Preview' : 'Pratonton'}
                </span>
                <button
                  type="button"
                  id="live-preview-toggle-switch"
                  data-testid="live-preview-toggle-switch"
                  role="switch"
                  aria-checked={isLivePreviewEnabled}
                  onClick={() => setIsLivePreviewEnabled((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isLivePreviewEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                  title={isEn ? 'Toggle Live Preview on or off' : 'Hidupkan atau matikan Pratonton Langsung'}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isLivePreviewEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* When Live Preview is Enabled */}
            {isLivePreviewEnabled ? (
              <>
                {/* Unsaved Changes Banner */}
                {hasUnsavedChanges && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate text-[11px] font-bold">
                        {isEn
                          ? 'Draft preview: unsaved changes active'
                          : 'Pratonton draf: perubahan belum disimpan'}
                      </span>
                    </div>
                    <button
                      type="button"
                      id="revert-draft-btn"
                      onClick={handleRevertChanges}
                      className="px-2 py-0.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-800 text-[10px] font-black shrink-0 cursor-pointer shadow-2xs"
                    >
                      {isEn ? 'Revert' : 'Kembalikan'}
                    </button>
                  </div>
                )}

                {/* Preview Document Switcher */}
                <div className="flex items-center p-1 rounded-xl bg-gray-100 text-[11px] font-bold">
                  <button
                    type="button"
                    id="preview-tab-invoice"
                    onClick={() => setPreviewTab('invoice')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      previewTab === 'invoice'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Receipt className="w-3 h-3" />
                    <span>{isEn ? 'Invoice' : 'Invois'}</span>
                  </button>
                  <button
                    type="button"
                    id="preview-tab-statement"
                    onClick={() => setPreviewTab('statement')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      previewTab === 'statement'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Download className="w-3 h-3" />
                    <span>{isEn ? 'Statement' : 'Penyata'}</span>
                  </button>
                  <button
                    type="button"
                    id="preview-tab-report"
                    onClick={() => setPreviewTab('report')}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      previewTab === 'report'
                        ? 'bg-white text-emerald-800 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>{isEn ? 'Z-Report' : 'Laporan Z'}</span>
                  </button>
                </div>

            {/* Mock Sheet Container with Dynamic Margins & Spacing */}
            <div
              className="border border-gray-300 rounded-2xl shadow-md overflow-hidden bg-white text-gray-900 select-none font-sans text-xs transition-all"
              style={{
                paddingTop: `${Math.max(0, (formData.topMargin - 12) * 0.5)}px`,
                paddingBottom: `${Math.max(0, (formData.bottomMargin - 14) * 0.5)}px`,
              }}
            >
              {/* Header Banner (Emerald) */}
              <div
                className="bg-[#064e3b] text-white p-4 transition-all"
                style={{
                  paddingLeft: `${Math.max(10, formData.pagePadding)}px`,
                  paddingRight: `${Math.max(10, formData.pagePadding)}px`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left Logo */}
                  {formData.showCompanyLogo && formData.logoPosition === 'left' && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 border border-white/60 flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[11px] font-black leading-none text-white">D</span>
                      <span className="text-[5px] font-bold tracking-tight text-emerald-100">MART</span>
                    </div>
                  )}

                  {/* Title and Tagline */}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-black tracking-wide leading-tight truncate">
                      {formData.companyName.toUpperCase() || 'D-MART SUPERMARKET & RETAIL LOGISTICS'}
                    </h4>
                    <p className="text-[9.5px] text-emerald-100 uppercase tracking-tight mt-0.5 leading-snug">
                      {formData.headerSubtitle || 'FLEET LOGISTICS & COURIER DISPATCH • OFFICIAL TREASURY'}
                    </p>
                    {formData.customHeaderText && (
                      <p className="text-[8.5px] text-emerald-200/90 mt-0.5 font-medium">
                        {formData.customHeaderText}
                      </p>
                    )}
                    {formData.showSsmRegistration && (
                      <p className="text-[8.5px] text-emerald-300/90 font-mono mt-0.5">
                        SSM: {formData.ssmRegistrationNumber || '202301048821'}
                      </p>
                    )}
                  </div>

                  {/* Center Logo */}
                  {formData.showCompanyLogo && formData.logoPosition === 'center' && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 border border-white/60 flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[11px] font-black leading-none text-white">D</span>
                      <span className="text-[5px] font-bold tracking-tight text-emerald-100">MART</span>
                    </div>
                  )}

                  {/* Right Meta Info or Logo */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div className="text-right">
                      <span className="inline-block px-1.5 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-200 text-[8px] font-mono border border-emerald-400/30">
                        {previewTab === 'invoice' ? 'TAX INVOICE' : previewTab === 'report' ? 'Z-REPORT' : 'OFFICIAL'}
                      </span>
                      <p className="text-[8px] text-emerald-300/80 font-mono mt-0.5">
                        {new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {formData.showCompanyLogo && formData.logoPosition === 'right' && (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 border border-white/60 flex flex-col items-center justify-center shrink-0 shadow-xs">
                        <span className="text-[11px] font-black leading-none text-white">D</span>
                        <span className="text-[5px] font-bold tracking-tight text-emerald-100">MART</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mock Content Body with Section Spacing */}
              <div
                className="bg-gray-50/70 text-[10px]"
                style={{
                  padding: `${Math.max(10, formData.pagePadding)}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: `${Math.max(4, formData.sectionSpacing)}px`,
                }}
              >
                {previewTab === 'invoice' && (
                  <>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase">
                        <span>DELIVERY DESTINATION</span>
                        <span className="text-emerald-700">STATUS: DELIVERED</span>
                      </div>
                      <div className="pt-1 text-gray-800">
                        <div className="font-bold">Datin Seri Nurul Huda</div>
                        <div className="text-gray-500 text-[9px]">No. 24, Jalan Kerinchi 2, Bangsar South, 59200 KL</div>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 space-y-1">
                      <div className="flex justify-between font-bold text-gray-700 border-b pb-1 text-[9px]">
                        <span>ITEM DESCRIPTION</span>
                        <span>TOTAL</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Jasmine Super Special Rice 10kg x 2</span>
                        <span className="font-mono">RM 77.00</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Dutch Lady Milk 1L x 4</span>
                        <span className="font-mono">RM 28.80</span>
                      </div>
                      <div className="flex justify-between font-black text-emerald-800 pt-1 border-t text-[10px]">
                        <span>GRAND TOTAL</span>
                        <span className="font-mono">RM 105.80</span>
                      </div>
                    </div>
                  </>
                )}

                {previewTab === 'statement' && (
                  <>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase">
                        <span>1. RIDER PROFILE CREDENTIALS</span>
                        <span className="text-emerald-700">ACTIVE APPROVED</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[9px]">
                        <div>
                          <span className="text-gray-400 block text-[8px]">Driver:</span>
                          <span className="font-bold text-gray-800">Muhammad Haziq Yusof</span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[8px]">Vehicle Plate:</span>
                          <span className="font-bold text-emerald-800 font-mono">WXY 8912 (Motorcycle)</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1 text-center">
                      <div className="bg-white p-1 rounded-lg border border-gray-200">
                        <span className="text-[7px] text-gray-400 block font-bold">FLOAT</span>
                        <span className="text-[9px] font-black text-emerald-800 font-mono">RM 245.50</span>
                      </div>
                      <div className="bg-white p-1 rounded-lg border border-gray-200">
                        <span className="text-[7px] text-gray-400 block font-bold">COD HELD</span>
                        <span className="text-[9px] font-black text-amber-800 font-mono">RM 85.00</span>
                      </div>
                      <div className="bg-white p-1 rounded-lg border border-gray-200">
                        <span className="text-[7px] text-gray-400 block font-bold">ONLINE</span>
                        <span className="text-[9px] font-black text-teal-800 font-mono">RM 320.00</span>
                      </div>
                      <div className="bg-emerald-900 text-white p-1 rounded-lg border border-emerald-800">
                        <span className="text-[7px] text-emerald-200 block font-bold">NET BAL</span>
                        <span className="text-[9px] font-black font-mono">RM 160.50</span>
                      </div>
                    </div>
                  </>
                )}

                {previewTab === 'report' && (
                  <>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase">
                        <span>DAILY REVENUE SUMMARY</span>
                        <span className="text-emerald-700 font-mono">POS-01 (BALANCED)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[9px]">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Gross Sales:</span>
                          <span className="font-bold font-mono">RM 9,090.00</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Net Profit:</span>
                          <span className="font-bold text-emerald-700 font-mono">RM 2,950.00</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-gray-200 text-[9px] text-gray-600">
                      <span>Physical Drawer Cash Count: </span>
                      <strong className="text-gray-800 font-mono">RM 1,550.00 (Zero Variance)</strong>
                    </div>
                  </>
                )}
              </div>

              {/* Official Footer Box (Dynamic Toggles Applied) */}
              <div
                className="bg-gray-100 p-3 border-t border-gray-300 space-y-1 text-[9px]"
                style={{
                  paddingLeft: `${Math.max(10, formData.pagePadding)}px`,
                  paddingRight: `${Math.max(10, formData.pagePadding)}px`,
                }}
              >
                {/* Certificate Text Seal */}
                <div className="flex items-center justify-between">
                  <h5 className="font-black text-[#064e3b] text-[9px] tracking-wide uppercase">
                    {formData.certificateText || 'OFFICIALLY AUDITED & CERTIFIED'}
                  </h5>
                  <span className="text-[8px] font-mono text-emerald-800 font-bold bg-emerald-100 px-1 py-0.2 rounded-xs">
                    VERIFIED-OK
                  </span>
                </div>

                {/* Signature Note */}
                {formData.showSignatureNote && (
                  <p className="text-gray-700 font-semibold text-[8.5px] leading-tight">
                    {formData.signatureNoteText}
                  </p>
                )}

                {/* Legal Disclaimer */}
                {formData.showLegalDisclaimer && (
                  <p className="text-gray-500 text-[8px] leading-snug">
                    {formData.footerDisclaimer}
                  </p>
                )}

                {/* Footer Metadata Line */}
                <div className="pt-0.5 border-t border-gray-200 text-[8px] text-gray-500 font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                  {formData.showSsmRegistration && (
                    <span>SSM: {formData.ssmRegistrationNumber}</span>
                  )}
                  {formData.customFooterText && (
                    <span className="truncate max-w-[200px]">{formData.customFooterText}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Action Toolbar */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <button
                type="button"
                id="preview-export-active-btn"
                data-testid="preview-export-active-btn"
                onClick={() => handleDownloadTestPdf(previewTab)}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Download active preview as PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-700" />
                <span>
                  {isEn
                    ? `Export Draft ${previewTab === 'invoice' ? 'Invoice' : previewTab === 'report' ? 'Report' : 'Statement'} PDF`
                    : `Muat Turun PDF Draf`}
                </span>
              </button>

              <button
                type="button"
                id="preview-apply-save-btn"
                data-testid="preview-apply-save-btn"
                onClick={() => handleSaveChanges()}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ml-auto"
                title="Commit current preview settings to Firestore"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {isSaving
                    ? isEn
                      ? 'Saving...'
                      : 'Menyimpan...'
                    : isEn
                    ? 'Apply & Save Settings'
                    : 'Guna & Simpan Tetapan'}
                </span>
              </button>
            </div>
          </>
        ) : (
          /* When Live Preview is Disabled */
          <div
            id="live-preview-disabled-state"
            data-testid="live-preview-disabled-state"
            className="border-2 border-dashed border-gray-200 rounded-3xl p-8 text-center space-y-4 bg-gray-50/70 animate-in fade-in duration-200"
          >
            <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-gray-200 text-gray-400 mx-auto flex items-center justify-center">
              <EyeOff className="w-7 h-7 text-gray-400" />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-gray-900 text-sm">
                {isEn ? 'Live Preview is Paused' : 'Pratonton Langsung Dijedakan'}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                {isEn
                  ? 'Toggle Live Preview on to view a real-time rendered version of the invoice or ledger statement before applying changes to the layout.'
                  : 'Hidupkan suis Pratonton Langsung di atas untuk melihat invois dan penyata lejar dijana dalam masa nyata sebelum mengaplikasikan perubahan susun atur.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                id="enable-live-preview-btn"
                data-testid="enable-live-preview-btn"
                onClick={() => setIsLivePreviewEnabled(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                <span>{isEn ? 'Turn On Live Preview' : 'Hidupkan Pratonton Langsung'}</span>
              </button>
            </div>
          </div>
        )}

            {/* Information Callout */}
            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/80 flex items-start gap-2 text-xs text-emerald-800">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                {isEn
                  ? 'All PDF downloads from Customer Invoices, Rider Statements, and Financial Reports automatically apply these rules without requiring a page refresh.'
                  : 'Semua muat turun PDF daripada Invois Pelanggan, Penyata Rider, dan Laporan Kewangan mengaplikasikan tetapan ini secara serta-merta.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
