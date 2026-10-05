import React, { useState, useRef } from 'react';
import {
  Camera,
  ImagePlus,
  Trash2,
  X,
  UploadCloud,
  Check,
  Loader2,
  Link2,
  Eye,
  Sparkles
} from 'lucide-react';
import { Language } from '../../types';

interface ProductImagePickerProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  language?: Language;
  label?: string;
  className?: string;
}

export const ProductImagePicker: React.FC<ProductImagePickerProps> = ({
  value = '',
  onChange,
  language = 'en',
  label,
  className = '',
}) => {
  const isEn = language === 'en';
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Hidden inputs for camera and gallery
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Resize and compress image client-side before upload for speed & efficiency
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Upload file to server/storage
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Client-side compression
      const compressedDataUrl = await compressImage(file);

      // 2. Upload to /api/upload storage endpoint
      let uploadedUrl = compressedDataUrl;
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dataUrl: compressedDataUrl,
            filename: file.name,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.url) {
            uploadedUrl = result.url;
          }
        }
      } catch (networkErr) {
        console.warn('Backend upload fell back to local optimized data URL:', networkErr);
      }

      // 3. Link image URL to form state
      onChange(uploadedUrl);
      setIsSheetOpen(false);
    } catch (err: any) {
      console.error('Image upload failed:', err);
      setUploadError(
        isEn
          ? 'Failed to process image. Please try another file.'
          : 'Gagal memproses gambar. Sila cuba fail lain.'
      );
    } finally {
      setIsUploading(false);
      // Reset input values so same file can be re-selected if needed
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onChange(customUrl.trim());
    setIsSheetOpen(false);
    setCustomUrl('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-gray-700">
          {label}
        </label>
      )}

      {/* 1. VISUAL PREVIEW BOX */}
      <div className="flex items-start gap-4">
        <div
          id="product-image-preview-box"
          role="button"
          tabIndex={0}
          onClick={() => setIsSheetOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsSheetOpen(true);
            }
          }}
          className={`relative group w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden cursor-pointer transition-all border-2 select-none flex flex-col items-center justify-center text-center p-2 shrink-0 ${
            value
              ? 'border-emerald-300 hover:border-emerald-500 shadow-xs hover:shadow-md bg-gray-50'
              : 'border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50/80 hover:bg-emerald-50/40'
          }`}
          title={isEn ? 'Click to change or upload product photo' : 'Klik untuk tukar atau muat naik foto'}
        >
          {value ? (
            <>
              {/* Existing Live Image Thumbnail */}
              <img
                src={value}
                alt="Product Preview"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  // Fallback for broken links
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80';
                }}
              />

              {/* Hover / Active Overlay with Camera Icon */}
              <div className="absolute inset-0 bg-black/45 backdrop-blur-2xs opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white rounded-xl">
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] font-bold tracking-tight">
                  {isEn ? 'Change Photo' : 'Tukar Foto'}
                </span>
              </div>

              {/* Live Image Badge */}
              <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 pointer-events-none">
                <Check className="w-2.5 h-2.5 text-emerald-400" />
                <span>{isEn ? 'Photo Set' : 'Ada Foto'}</span>
              </div>

              {/* Quick Remove Button */}
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 hover:bg-red-50 hover:text-red-600 text-gray-600 shadow-sm border border-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                title={isEn ? 'Remove photo' : 'Padam foto'}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          ) : (
            /* Empty State: Placeholder with Camera Icon & "Tap to add image" */
            <div className="flex flex-col items-center justify-center text-center p-2 space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-gray-800 leading-tight">
                {isEn ? 'Tap to add image' : 'Ketik untuk tambah gambar'}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">
                {isEn ? 'Camera or Gallery' : 'Kamera atau Galeri'}
              </span>
            </div>
          )}
        </div>

        {/* Informative helper details next to the box */}
        <div className="flex-1 min-w-0 space-y-1.5 pt-1">
          <p className="text-xs text-gray-600 leading-relaxed">
            {isEn
              ? 'High-quality item photos increase sales by up to 45%. Supports direct camera snaps and gallery uploads.'
              : 'Foto barangan yang jelas meningkatkan jualan sehingga 45%. Sokong tangkapan kamera langsung & galeri.'}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsSheetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>{value ? (isEn ? 'Replace Photo' : 'Ganti Foto') : (isEn ? 'Upload Photo' : 'Muat Naik Foto')}</span>
            </button>
            {value && (
              <a
                href={value}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-emerald-700 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>{isEn ? 'View Full Size' : 'Lihat Saiz Penuh'}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      {/* 1. Camera Input (native capture) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* 2. Gallery / File System Input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* 2. INTERACTIVE IMAGE UPLOAD SHEET / ACTION MODAL */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                  <Camera className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white leading-tight">
                    {isEn ? 'Product Photo Picker' : 'Pilihan Foto Barangan'}
                  </h4>
                  <p className="text-[10px] text-emerald-200">
                    {isEn ? 'Select image source for this item' : 'Pilih sumber gambar untuk barangan ini'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isUploading && setIsSheetOpen(false)}
                disabled={isUploading}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sheet Body: Options */}
            <div className="p-4 space-y-3">
              {uploadError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {isUploading ? (
                /* Uploading progress indicator */
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-gray-900">
                      {isEn ? 'Uploading to Storage...' : 'Sedang Memuat Naik ke Storan...'}
                    </h5>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isEn ? 'Optimizing photo for fast supermarket loading' : 'Mengoptimumkan foto untuk muatan pantas'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Option A: Take Photo with Camera */}
                  <button
                    type="button"
                    id="btn-take-photo-camera"
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full flex items-center gap-3.5 p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-gray-900 group-hover:text-emerald-900">
                        {isEn ? 'Take Photo with Camera' : 'Ambil Foto dengan Kamera'}
                      </h5>
                      <p className="text-[11px] text-gray-500">
                        {isEn ? 'Use phone or tablet camera to snap item' : 'Guna kamera telefon/tablet untuk ambil foto'}
                      </p>
                    </div>
                  </button>

                  {/* Option B: Choose from Gallery / Files */}
                  <button
                    type="button"
                    id="btn-choose-from-gallery"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full flex items-center gap-3.5 p-3 rounded-xl border border-gray-200 hover:border-sky-500 hover:bg-sky-50/50 transition-all text-left group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-sky-600 group-hover:text-white transition-all shrink-0">
                      <ImagePlus className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-gray-900 group-hover:text-sky-900">
                        {isEn ? 'Choose from Gallery / Files' : 'Pilih daripada Galeri / Fail'}
                      </h5>
                      <p className="text-[11px] text-gray-500">
                        {isEn ? 'Select photo from your device storage' : 'Pilih foto daripada memori peranti anda'}
                      </p>
                    </div>
                  </button>

                  {/* Option C: Or Enter Image URL (Collapsible) */}
                  <div className="pt-2 border-t border-gray-100">
                    {!showUrlInput ? (
                      <button
                        type="button"
                        onClick={() => setShowUrlInput(true)}
                        className="w-full text-center text-xs text-gray-500 hover:text-emerald-700 py-1 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Or paste web image URL' : 'Atau tampal URL gambar web'}</span>
                      </button>
                    ) : (
                      <form onSubmit={handleApplyCustomUrl} className="space-y-2 animate-in fade-in">
                        <label className="block text-[11px] font-bold text-gray-700">
                          {isEn ? 'Direct Web Image URL (CDN / Unsplash):' : 'URL Gambar Web Langsung:'}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-700"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            {isEn ? 'Apply' : 'Guna'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sheet Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-150 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsSheetOpen(false)}
                disabled={isUploading}
                className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
