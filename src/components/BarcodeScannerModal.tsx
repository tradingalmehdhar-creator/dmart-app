import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  ScanBarcode,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Zap,
  ArrowRight,
  Sparkles,
  Search,
  Check,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Product, Language } from '../types';
import { translations } from '../data/translations';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onOpenCart?: () => void;
  products: Product[];
  language: Language;
}

// Quick Pantry Staples for 1-tap rapid testing or fallback
interface PantrySample {
  barcode: string;
  nameEn: string;
  nameMs: string;
  category: string;
  price: number;
}

const POPULAR_PANTRY_BARCODES: PantrySample[] = [
  {
    barcode: '9556123001015',
    nameEn: 'Jasmine Super Special White Rice 10kg',
    nameMs: 'Beras Putih Super Special Jasmine 10kg',
    category: 'Pantry Staples',
    price: 38.5,
  },
  {
    barcode: '9556012002028',
    nameEn: 'Saji Minyak Masak Tulen 5kg',
    nameMs: 'Minyak Masak Saji 5kg',
    category: 'Cooking Essentials',
    price: 28.9,
  },
  {
    barcode: '9556001100104',
    nameEn: 'Maggi 2-Minit Kari (Multipack 5s)',
    nameMs: 'Maggi 2-Minit Kari (Pek 5)',
    category: 'Instant Noodles',
    price: 5.4,
  },
  {
    barcode: '9556018001018',
    nameEn: 'Ayam Brand Sardines in Tomato Sauce 425g',
    nameMs: 'Sardin Ayam Brand Sos Tomato 425g',
    category: 'Canned Food',
    price: 9.8,
  },
  {
    barcode: '9556001211107',
    nameEn: 'Milo Activ-Go Chocolate Malt Powder 1kg',
    nameMs: 'Milo Activ-Go Serbuk Coklat Malt 1kg',
    category: 'Beverages',
    price: 21.9,
  },
  {
    barcode: '9556055001231',
    nameEn: 'Farm Fresh Pure Fresh Milk 1 Litre',
    nameMs: 'Susu Segar Farm Fresh 1 Liter',
    category: 'Dairy',
    price: 7.9,
  },
  {
    barcode: '9556077002341',
    nameEn: 'NutriPlus Grade A Omega Eggs (30s)',
    nameMs: 'Telur Ayam Gred A NutriPlus (30 Biji)',
    category: 'Daily Staples',
    price: 18.5,
  },
  {
    barcode: '8886467000102',
    nameEn: 'Sunlight Lime Dishwashing Liquid 900ml',
    nameMs: 'Pencuci Pinggan Sunlight Limau Nipis 900ml',
    category: 'Household Cleaning',
    price: 6.9,
  },
];

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onAddToCart,
  onOpenCart,
  products,
  language,
}) => {
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanIntervalRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorchCapability, setHasTorchCapability] = useState(false);

  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [recentlyAddedProduct, setRecentlyAddedProduct] = useState<Product | null>(null);
  const [scannedSessionItems, setScannedSessionItems] = useState<{ product: Product; time: string }[]>([]);
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(true);

  // Play realistic supermarket beep
  const playBeep = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch crisp scan tone
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio context might be restricted before interaction
    }

    if (navigator.vibrate) {
      try {
        navigator.vibrate(60);
      } catch {
        // Ignore vibration errors
      }
    }
  }, []);

  // Barcode product lookup
  const handleBarcodeIdentified = useCallback(
    (barcodeText: string) => {
      const cleanCode = barcodeText.trim().replace(/[^0-9a-zA-Z_-]/g, '');
      if (!cleanCode) return;

      // Prevent re-scanning the exact same code within 2.5 seconds
      if (lastScannedCode === cleanCode) {
        return;
      }

      setLastScannedCode(cleanCode);
      setTimeout(() => {
        setLastScannedCode(null);
      }, 2500);

      // Match product by exact barcode, alt barcodes, or id
      const matched = products.find(
        (p) =>
          p.barcode === cleanCode ||
          p.barcode_alt?.includes(cleanCode) ||
          p.barcodeAlt?.includes(cleanCode) ||
          p.id.toLowerCase() === cleanCode.toLowerCase()
      );

      if (matched) {
        playBeep();
        onAddToCart(matched);
        setRecentlyAddedProduct(matched);
        setNotFoundCode(null);
        setScannedSessionItems((prev) => [
          { product: matched, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev,
        ]);
      } else {
        setNotFoundCode(cleanCode);
      }
    },
    [lastScannedCode, onAddToCart, playBeep, products]
  );

  // Stop current camera stream
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        language === 'ms'
          ? 'Kamera tidak disokong pada pelayar ini. Sila gunakan imbasan manual atau pilih barangan dapur di bawah.'
          : 'Camera API not supported in this browser. Please use manual code entry or tap sample pantry staples below.'
      );
      setHasCameraPermission(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setHasCameraPermission(true);

      // Check flashlight/torch capability
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        setHasTorchCapability(Boolean(capabilities?.torch));
      }

      // Initialize BarcodeDetector API if available
      if ('BarcodeDetector' in window) {
        try {
          detectorRef.current = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });
        } catch {
          detectorRef.current = null;
        }
      }

      // Start continuous scan loop
      scanIntervalRef.current = window.setInterval(async () => {
        if (!isScanningActive || !videoRef.current || !detectorRef.current) return;
        if (videoRef.current.readyState < 2) return;

        try {
          const detected = await detectorRef.current.detect(videoRef.current);
          if (detected && detected.length > 0) {
            const rawValue = detected[0].rawValue;
            if (rawValue) {
              handleBarcodeIdentified(rawValue);
            }
          }
        } catch {
          // ignore detection frame errors
        }
      }, 400);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setHasCameraPermission(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          language === 'ms'
            ? 'Kebenaran kamera ditolak. Sila benarkan akses kamera atau gunakan butang pilihan pantas di bawah.'
            : 'Camera permission denied. Please allow camera access in browser settings or use the quick pantry staple buttons below.'
        );
      } else {
        setCameraError(
          language === 'ms'
            ? 'Kamera tidak dapat dimulakan. Sila gunakan nombor kod bar atau butang barangan pantas di bawah.'
            : 'Unable to start camera stream. Please use manual barcode entry or select from pantry staples below.'
        );
      }
    }
  }, [facingMode, handleBarcodeIdentified, isScanningActive, language, stopCamera]);

  // Toggle Torch/Flash
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch failed:', e);
    }
  };

  // Switch between front/back cameras
  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeIdentified(manualCode);
    setManualCode('');
  };

  // Mount/unmount camera lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setRecentlyAddedProduct(null);
      setNotFoundCode(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="barcode-scanner-title"
    >
      <div
        id="barcode-scanner-modal-card"
        className="bg-neutral-900 text-white w-full max-w-lg rounded-2xl shadow-2xl border border-emerald-500/30 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <header className="px-4 py-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-between border-b border-emerald-700/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <ScanBarcode className="w-4 h-4" />
            </div>
            <div>
              <h2 id="barcode-scanner-title" className="text-sm sm:text-base font-extrabold tracking-tight">
                {t.barcodeScannerTitle}
              </h2>
              <p className="text-[11px] text-emerald-200/90 truncate">
                {language === 'ms'
                  ? 'Imbas kod bar bungkusan untuk tambah ke troli serta-merta'
                  : 'Scan pantry product barcodes for instant 1-tap cart addition'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {hasTorchCapability && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  torchOn ? 'bg-amber-400 text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={language === 'ms' ? 'Lampu Suluh' : 'Flashlight'}
                aria-label="Toggle Torch"
              >
                <Zap className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSwitchCamera}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
              title={language === 'ms' ? 'Tukar Kamera Depan/Belakang' : 'Switch Camera'}
              aria-label="Switch Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer ml-1"
              aria-label="Close Scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scanner Viewfinder / Camera Screen */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-black overflow-hidden flex items-center justify-center shrink-0">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />

          {/* Camera Viewfinder Overlay with Reticle & Laser */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Dark vignette borders */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Target Reticle Frame */}
            <div className="relative w-[260px] sm:w-[320px] h-[160px] sm:h-[190px] border-2 border-emerald-400/40 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center overflow-hidden bg-transparent">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />

              {/* Animated scanning laser line */}
              <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse transition-all duration-700" />

              {/* Center subtle barcode watermark guide */}
              <div className="opacity-20 text-white flex flex-col items-center gap-1">
                <ScanBarcode className="w-12 h-12" />
                <span className="text-[9px] font-mono tracking-widest uppercase">EAN-13 / UPC</span>
              </div>
            </div>

            <p className="absolute bottom-3 text-center text-xs font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
              {t.barcodeScannerDesc}
            </p>
          </div>

          {/* Camera Permission or Error State Overlay */}
          {(!hasCameraPermission || cameraError) && (
            <div className="absolute inset-0 bg-neutral-900/95 flex flex-col items-center justify-center p-6 text-center z-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <div className="max-w-xs space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {language === 'ms' ? 'Kamera Disediakan Untuk Anda' : 'Camera Ready For Scanning'}
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {cameraError || t.cameraPermissionPrompt}
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'ms' ? 'Cuba Akses Kamera' : 'Retry Camera Access'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Toast Card: Scanned & Added Notification */}
          {recentlyAddedProduct && (
            <aside aria-label="Product Scan Notification" className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 animate-in slide-in-from-top-3 duration-200">
              <div className="bg-emerald-600/95 text-white p-2.5 sm:p-3 rounded-xl shadow-xl backdrop-blur-xs border border-emerald-400/50 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={recentlyAddedProduct.image}
                    alt={recentlyAddedProduct.nameEn}
                    className="w-10 h-10 rounded-lg object-cover bg-white shrink-0 border border-white/20"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-100 uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{t.itemAddedToCart}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">
                      {language === 'ms' ? recentlyAddedProduct.nameMs : recentlyAddedProduct.nameEn}
                    </h4>
                    <p className="text-[11px] font-black text-amber-200">
                      RM {recentlyAddedProduct.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(recentlyAddedProduct);
                      playBeep();
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Add another unit (+1)"
                  >
                    <Plus className="w-3 h-3" />
                    <span>1</span>
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* Not Found Warning */}
          {notFoundCode && (
            <aside aria-label="Barcode Search Warning" className="absolute top-3 inset-x-3 sm:inset-x-6 z-20 animate-in slide-in-from-top-3 duration-200">
              <div className="bg-amber-600/95 text-white p-2.5 rounded-xl shadow-xl backdrop-blur-xs border border-amber-400/50 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-100 shrink-0" />
                <div className="text-xs min-w-0 flex-1">
                  <span className="font-bold">
                    {language === 'ms' ? 'Kod bar tidak dikenali: ' : 'Unrecognized Barcode: '}
                  </span>
                  <span className="font-mono text-amber-100">{notFoundCode}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotFoundCode(null)}
                  className="text-white/80 hover:text-white text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
            </aside>
          )}
        </div>

        {/* Middle: Manual Barcode Input */}
        <div className="p-3 bg-neutral-800 border-b border-neutral-700/80 shrink-0">
          <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={t.manualBarcodeInput}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-emerald-500 text-xs sm:text-sm text-white placeholder:text-neutral-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 text-white disabled:text-neutral-500 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ms' ? 'Tambah' : 'Add Item'}</span>
            </button>
          </form>
        </div>

        {/* Bottom Section: Quick Pantry Staples Tap-to-Scan & Session History */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-neutral-900">
          {/* Quick Pantry Staples Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-300 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.quickPantryScan}</span>
              </div>
              <span className="text-[10px] text-neutral-400">
                {language === 'ms' ? 'Ketik untuk imbas serta-merta' : 'Tap to simulate instant barcode scan'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {POPULAR_PANTRY_BARCODES.map((item) => (
                <button
                  key={item.barcode}
                  type="button"
                  onClick={() => handleBarcodeIdentified(item.barcode)}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700/60 hover:border-emerald-500/60 transition-all text-left group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors truncate">
                      {language === 'ms' ? item.nameMs : item.nameEn}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-neutral-400 tracking-wider">
                        {item.barcode}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-black">
                        RM {item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 group-hover:bg-emerald-600 text-emerald-400 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Session Scanned List */}
          {scannedSessionItems.length > 0 && (
            <div className="pt-2 border-t border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  {language === 'ms'
                    ? `Barangan Berjaya Diimbas (${scannedSessionItems.length})`
                    : `Scanned In This Session (${scannedSessionItems.length})`}
                </span>
                <span className="text-[11px] font-bold text-neutral-300">
                  Total: RM{' '}
                  {scannedSessionItems
                    .reduce((sum, item) => sum + item.product.price, 0)
                    .toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 no-scrollbar">
                {scannedSessionItems.map((entry, idx) => (
                  <div
                    key={`${entry.product.id}-${idx}`}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-800/60 border border-neutral-700/40 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={entry.product.image}
                        alt=""
                        className="w-6 h-6 rounded object-cover bg-white shrink-0"
                      />
                      <span className="truncate text-neutral-200">
                        {language === 'ms' ? entry.product.nameMs : entry.product.nameEn}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-emerald-400">
                        RM {entry.product.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-neutral-400">{entry.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {language === 'ms' ? 'Tutup Pengimbas' : 'Close Scanner'}
          </button>

          {onOpenCart && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCart();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.viewCart}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
