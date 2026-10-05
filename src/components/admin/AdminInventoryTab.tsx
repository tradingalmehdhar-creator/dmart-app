import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit3,
  Eye,
  EyeOff,
  Tag,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Save,
  X,
  ChevronRight,
  Info,
  DollarSign,
  Boxes,
  Calendar,
  Clock,
  Layers,
  Percent,
  SlidersHorizontal,
  ArrowDown,
  Check,
  Minus,
} from 'lucide-react';
import { Product, MainCategory, Language, ManagedCategory } from '../../types';
import { ProductImagePicker } from './ProductImagePicker';
import { INITIAL_MANAGED_CATEGORIES } from '../../data/adminInitialData';

interface AdminInventoryTabProps {
  products: Product[];
  onUpdateProducts: (updatedProducts: Product[]) => void;
  categories: ManagedCategory[];
  onUpdateCategories: (categories: ManagedCategory[]) => void;
  language: Language;
}

export const AdminInventoryTab: React.FC<AdminInventoryTabProps> = ({
  products,
  onUpdateProducts,
  categories,
  onUpdateCategories,
  language,
}) => {
  const [viewMode, setViewMode] = useState<'catalog' | 'batch_expiry'>('catalog');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [batchEditProduct, setBatchEditProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'critical' | 'expiring_soon' | 'healthy'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingDetailsProduct, setViewingDetailsProduct] = useState<Product | null>(null);
  const [quickStockEditId, setQuickStockEditId] = useState<string | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<number>(0);
  const [quickExpiryEditId, setQuickExpiryEditId] = useState<string | null>(null);
  const [quickExpiryValue, setQuickExpiryValue] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active store categories with fallback
  const activeCategoriesList =
    categories && categories.length > 0 ? categories : INITIAL_MANAGED_CATEGORIES;

  // Helper to reliably resolve category ID from product properties
  const getProductCategoryId = (p?: Partial<Product> | null): string => {
    if (!p) return '';
    const directId = (p as any).categoryId || (p as any).category_id;
    if (directId && activeCategoriesList.some((c) => c.id === directId)) {
      return directId;
    }
    const catVal = p.category || p.mainCategory;
    if (catVal) {
      const match = activeCategoriesList.find(
        (c) =>
          c.id === catVal ||
          (c.key && c.key === catVal) ||
          (c.slug && c.slug === catVal)
      );
      if (match) return match.id;
    }
    return '';
  };

  // New product form state
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    nameEn: '',
    nameMs: '',
    mainCategory: 'daily_groceries',
    category: 'daily_groceries',
    categoryId: 'cat-2',
    category_id: 'cat-2',
    subCategory: 'canned_foods',
    price: 4.50,
    originalPrice: 5.50,
    amountEn: '1 unit',
    amountMs: '1 unit',
    unitEn: 'unit',
    unitMs: 'unit',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80',
    descriptionEn: 'Freshly stocked high-quality grocery item.',
    descriptionMs: 'Barangan runcit segar dan berkualiti tinggi.',
    inStock: true,
    stockCount: 50,
    halal: true,
    badge: 'Popular',
    badgeMs: 'Pilihan Ramai',
  });

  // New Category Form State
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatNameEn, setNewCatNameEn] = useState('');
  const [newCatNameMs, setNewCatNameMs] = useState('');
  const [newCatColor, setNewCatColor] = useState('from-emerald-500 to-teal-600');
  const [selectedParentCatId, setSelectedParentCatId] = useState('');
  const [newSubCatNameEn, setNewSubCatNameEn] = useState('');
  const [newSubCatNameMs, setNewSubCatNameMs] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Expiry calculation normalized to start of day
  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return 999;
    const parts = expiryDate.split('-');
    let exp: Date;
    if (parts.length === 3) {
      exp = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      exp = new Date(expiryDate);
    }
    if (isNaN(exp.getTime())) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Helper to generate future ISO date string YYYY-MM-DD for quick expiry presets
  const getFutureDateString = (daysAhead: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Clearance discount applicator
  const handleApplyClearance = (productId: string, discountPercent: number = 25) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const original = p.originalPrice || p.old_price || p.price;
        const discounted = Number((p.price * (1 - discountPercent / 100)).toFixed(2));
        return {
          ...p,
          originalPrice: original,
          old_price: original,
          price: discounted,
          badge: `${discountPercent}% EXPIRY DEAL`,
          badgeMs: `DISKAUN ${discountPercent}%`,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    showToast(language === 'en' ? `Applied ${discountPercent}% clearance promo.` : `Harga lelongan ${discountPercent}% diaktifkan.`);
  };

  // Scrap / Write off product
  const handleScrapProduct = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stockCount: 0,
          stock_count: 0,
          inStock: false,
          is_available: false,
          badge: 'SCRAPPED',
          badgeMs: 'DILUPUSKAN',
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    showToast(language === 'en' ? 'Stock marked as scrapped / written off.' : 'Stok telah ditanda lupus.');
  };

  // Save Batch & Expiry edit
  const handleSaveBatchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchEditProduct) return;
    const updated = products.map((p) => (p.id === batchEditProduct.id ? batchEditProduct : p));
    onUpdateProducts(updated);
    setBatchEditProduct(null);
    showToast(language === 'en' ? 'Batch & shelf-life information updated.' : 'Maklumat kelompok dan tarikh luput dikemaskini.');
  };

  // Add Category Handler
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatSlug || !newCatNameEn) return;
    const newCat: ManagedCategory = {
      id: `cat-${Date.now().toString().slice(-4)}`,
      slug: newCatSlug.toLowerCase().replace(/\s+/g, '_'),
      nameEn: newCatNameEn,
      nameMs: newCatNameMs || newCatNameEn,
      iconName: 'Package',
      color: newCatColor,
      itemCount: 0,
      isActive: true,
      subCategories: [],
    };
    onUpdateCategories([...categories, newCat]);
    setNewCatSlug('');
    setNewCatNameEn('');
    setNewCatNameMs('');
    showToast(language === 'en' ? `Category "${newCat.nameEn}" added.` : `Kategori ditambah.`);
  };

  // Add SubCategory Handler
  const handleAddSubCategory = (catId: string) => {
    if (!newSubCatNameEn) return;
    const targetCat = categories.find((c) => c.id === catId);
    if (!targetCat) return;

    const newSub = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      slug: newSubCatNameEn.toLowerCase().replace(/\s+/g, '_'),
      nameEn: newSubCatNameEn,
      nameMs: newSubCatNameMs || newSubCatNameEn,
      itemCount: 0,
    };

    const updated = categories.map((c) =>
      c.id === catId ? { ...c, subCategories: [...c.subCategories, newSub] } : c
    );
    onUpdateCategories(updated);
    setNewSubCatNameEn('');
    setNewSubCatNameMs('');
    showToast(language === 'en' ? `Sub-category added to ${targetCat.nameEn}.` : `Sub-kategori ditambah.`);
  };

  // Toggle Category Status
  const handleToggleCategoryStatus = (catId: string) => {
    const updated = categories.map((c) =>
      c.id === catId ? { ...c, isActive: !c.isActive } : c
    );
    onUpdateCategories(updated);
    showToast(language === 'en' ? 'Category visibility toggled.' : 'Status kategori dikemaskini.');
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameMs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      p.mainCategory === selectedCategory ||
      p.category === selectedCategory ||
      p.categoryId === selectedCategory ||
      p.category_id === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = p.inStock;
    if (stockFilter === 'out_of_stock') matchesStock = !p.inStock;
    if (stockFilter === 'low_stock') matchesStock = p.inStock && (p.stockCount ?? 0) <= 10;

    let matchesExpiry = true;
    if (expiryFilter !== 'all') {
      const days = getDaysUntilExpiry(p.expiryDate || p.expiry_date);
      if (expiryFilter === 'critical') matchesExpiry = days <= 5;
      else if (expiryFilter === 'expiring_soon') matchesExpiry = days > 5 && days <= 14;
      else if (expiryFilter === 'healthy') matchesExpiry = days > 14;
    }

    return matchesSearch && matchesCategory && matchesStock && matchesExpiry;
  });

  // Metrics
  const totalSKUs = products.length;
  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.filter((p) => !p.inStock).length;
  const lowStockCount = products.filter((p) => p.inStock && (p.stockCount ?? 0) <= 10).length;

  // Single Item Toggle
  const handleToggleStock = (productId: string) => {
    const updated = products.map((p) => {
      if (p.id === productId) {
        const nextInStock = !p.inStock;
        return {
          ...p,
          inStock: nextInStock,
          stockCount: nextInStock ? (p.stockCount > 0 ? p.stockCount : 25) : 0,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    if (viewingDetailsProduct && viewingDetailsProduct.id === productId) {
      const match = updated.find((p) => p.id === productId);
      if (match) setViewingDetailsProduct(match);
    }
    showToast(language === 'en' ? 'Stock availability updated.' : 'Status stok telah dikemaskini.');
  };

  // Quick Stock Count Update
  const handleQuickStockSubmit = (productId: string, newQty: number) => {
    const validQty = Math.max(0, Math.floor(Number(newQty) || 0));
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          stockCount: validQty,
          stock_count: validQty,
          inStock: validQty > 0,
          is_available: validQty > 0,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    setQuickStockEditId(null);
    if (viewingDetailsProduct && viewingDetailsProduct.id === productId) {
      const match = updated.find((p) => p.id === productId);
      if (match) setViewingDetailsProduct(match);
    }
    showToast(
      language === 'en'
        ? `Stock level updated to ${validQty} units.`
        : `Paras stok dikemaskini ke ${validQty} unit.`
    );
  };

  // Quick Expiry Date Update
  const handleQuickExpirySubmit = (productId: string, newExpiryDate: string) => {
    if (!newExpiryDate) return;
    const updated = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          expiryDate: newExpiryDate,
          expiry_date: newExpiryDate,
          updated_at: new Date().toISOString(),
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    setQuickExpiryEditId(null);
    if (viewingDetailsProduct && viewingDetailsProduct.id === productId) {
      const match = updated.find((p) => p.id === productId);
      if (match) setViewingDetailsProduct(match);
    }
    showToast(
      language === 'en'
        ? `Expiry date updated to ${newExpiryDate}.`
        : `Tarikh luput dikemaskini ke ${newExpiryDate}.`
    );
  };

  // Bulk Updates
  const handleBulkToggleAll = (targetInStock: boolean) => {
    const updated = products.map((p) => {
      // If filtering by category, only apply to visible category
      if (selectedCategory !== 'all' && p.mainCategory !== selectedCategory) {
        return p;
      }
      return {
        ...p,
        inStock: targetInStock,
        stockCount: targetInStock ? (p.stockCount > 0 ? p.stockCount : 30) : 0,
      };
    });
    onUpdateProducts(updated);
    showToast(
      targetInStock
        ? language === 'en'
          ? `All ${selectedCategory === 'all' ? 'items' : selectedCategory} marked In Stock.`
          : 'Semua barangan ditanda Ada Stok.'
        : language === 'en'
        ? `All ${selectedCategory === 'all' ? 'items' : selectedCategory} marked Out of Stock.`
          : 'Semua barangan ditanda Habis Stok.'
    );
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    // Validate Category Selection (Mandatory)
    const resolvedCatId = getProductCategoryId(editingProduct);
    if (!resolvedCatId) {
      showToast(
        language === 'en'
          ? 'Category selection is mandatory. Please select a store category before saving.'
          : 'Pilihan kategori adalah wajib. Sila pilih kategori kedai sebelum menyimpan.'
      );
      return;
    }

    const matchedCategory = activeCategoriesList.find((c) => c.id === resolvedCatId);
    const categoryKey = matchedCategory?.key || matchedCategory?.slug || resolvedCatId;

    const toSave: Product = {
      ...editingProduct,
      category: categoryKey,
      mainCategory: categoryKey as MainCategory,
      categoryId: resolvedCatId,
      category_id: resolvedCatId,
      image_url: editingProduct.image || editingProduct.image_url || '',
      updated_at: new Date().toISOString(),
    };
    const updated = products.map((p) => (p.id === toSave.id ? toSave : p));
    onUpdateProducts(updated);
    if (viewingDetailsProduct && viewingDetailsProduct.id === toSave.id) {
      setViewingDetailsProduct(toSave);
    }
    setEditingProduct(null);
    showToast(language === 'en' ? `Updated "${editingProduct.nameEn}" successfully.` : `Barangan berjaya dikemaskini.`);
  };

  // Create Product
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nameEn) return;

    // Validate Category Selection (Mandatory)
    const resolvedCatId = getProductCategoryId(newProduct);
    if (!resolvedCatId) {
      showToast(
        language === 'en'
          ? 'Category selection is mandatory. Please select a store category before adding.'
          : 'Pilihan kategori adalah wajib. Sila pilih kategori sebelum menambah.'
      );
      return;
    }

    const matchedCategory = activeCategoriesList.find((c) => c.id === resolvedCatId);
    const categoryKey = matchedCategory?.key || matchedCategory?.slug || resolvedCatId;

    const finalImage =
      newProduct.image ||
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80';

    const created: Product = {
      id: `dm-sku-${Date.now().toString().slice(-5)}`,
      name: newProduct.nameEn || '',
      category: categoryKey,
      price: Number(newProduct.price) || 0,
      old_price: newProduct.originalPrice ? Number(newProduct.originalPrice) : null,
      image_url: finalImage,
      is_available: newProduct.inStock ?? true,
      updated_at: new Date().toISOString(),
      nameEn: newProduct.nameEn || '',
      nameMs: newProduct.nameMs || newProduct.nameEn || '',
      mainCategory: (categoryKey as MainCategory) || 'daily_groceries',
      subCategory: (newProduct.subCategory as any) || 'canned_foods',
      categoryId: resolvedCatId,
      category_id: resolvedCatId,
      originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
      amountEn: newProduct.amountEn || '1 unit',
      amountMs: newProduct.amountMs || '1 unit',
      unitEn: newProduct.unitEn || 'unit',
      unitMs: newProduct.unitMs || 'unit',
      image: finalImage,
      descriptionEn: newProduct.descriptionEn || '',
      descriptionMs: newProduct.descriptionMs || '',
      inStock: newProduct.inStock ?? true,
      stockCount: Number(newProduct.stockCount) || 30,
      halal: newProduct.halal ?? true,
      badge: newProduct.badge || undefined,
      badgeMs: newProduct.badgeMs || undefined,
    };

    onUpdateProducts([created, ...products]);
    setIsAddModalOpen(false);
    setNewProduct({
      nameEn: '',
      nameMs: '',
      mainCategory: 'daily_groceries',
      category: 'daily_groceries',
      categoryId: 'cat-2',
      category_id: 'cat-2',
      subCategory: 'canned_foods',
      price: 4.50,
      image: '',
    });
    showToast(language === 'en' ? `Added new SKU: ${created.nameEn}` : `SKU baru berjaya ditambah.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>{language === 'en' ? 'Total Catalog SKUs' : 'Jumlah Barangan SKU'}</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalSKUs}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>{language === 'en' ? 'Active / In Stock' : 'Aktif / Ada Stok'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{inStockCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200/80 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>{language === 'en' ? 'Out of Stock' : 'Habis Stok'}</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{outOfStockCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider mb-1">
            <span>{language === 'en' ? 'Low Stock Warning' : 'Amaran Stok Rendah'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{lowStockCount}</p>
        </div>
      </div>

      {/* Critical Low-Stock Replenishment Trigger Banner */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/70 to-rose-50 border border-amber-300 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950">
                  {language === 'en'
                    ? `Critical Replenishment Trigger: ${lowStockCount} SKUs Below Safety Threshold`
                    : `Pencetus Pengisian Semula: ${lowStockCount} Barangan Di Bawah Paras Selamat`}
                </h3>
                <p className="text-xs text-amber-800">
                  {language === 'en'
                    ? 'Automated inventory triggers prevent out-of-stock cancellations on express orders.'
                    : 'Pencetus inventori automatik mengelakkan pembatalan pesanan ekspres.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const updated = products.map((p) => {
                  const threshold = p.lowStockThreshold || p.low_stock_threshold || 12;
                  if ((p.stockCount ?? 0) <= threshold) {
                    const nextQty = (p.stockCount ?? 0) + 30;
                    return {
                      ...p,
                      stockCount: nextQty,
                      stock_count: nextQty,
                      inStock: true,
                      is_available: true,
                    };
                  }
                  return p;
                });
                onUpdateProducts(updated);
                showToast(language === 'en' ? 'All low-stock SKUs replenished (+30 units each)!' : 'Semua barangan stok rendah ditambah (+30 unit)!');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Replenish All Low Stock (+30 units)' : 'Isi Semua Stok Rendah (+30 unit)'}</span>
            </button>
          </div>

          {/* Low Stock Quick Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60">
            <span className="text-[11px] font-bold text-amber-900">Urgent items:</span>
            {products
              .filter((p) => p.inStock && (p.stockCount ?? 0) <= 12)
              .slice(0, 4)
              .map((p) => (
                <div
                  key={p.id}
                  className="bg-white/90 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-950 flex items-center gap-2 shadow-2xs"
                >
                  <span className="font-bold">{p.nameEn}</span>
                  <span className="font-black text-rose-600 font-mono">({p.stockCount} left)</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = products.map((item) =>
                        item.id === p.id
                          ? { ...item, stockCount: (item.stockCount ?? 0) + 25, stock_count: (item.stockCount ?? 0) + 25, inStock: true }
                          : item
                      );
                      onUpdateProducts(updated);
                      showToast(`Replenished +25 units for ${p.nameEn}`);
                    }}
                    className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer"
                  >
                    +25
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Module Navigation Switcher & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('catalog')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'catalog' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Standard Inventory Grid' : 'Grid Inventori Standard'}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('batch_expiry')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              viewMode === 'batch_expiry' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Batch & Expiry Inspection Hub' : 'Pemeriksaan Kelompok & Luput'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-black">
              Alerts
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>{language === 'en' ? 'Categories & Sub-Categories' : 'Kategori & Sub-Kategori'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'en' ? 'Add Grocery SKU' : 'Tambah Barangan'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Category, Bulk Actions, Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'en' ? 'Search groceries by SKU, name (English / Malay)...' : 'Cari barangan mengikut SKU, nama...'}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">{language === 'en' ? 'All Departments' : 'Semua Jabatan'}</option>
            {activeCategoriesList.map((cat) => (
              <option key={cat.id} value={cat.key || cat.slug || cat.id}>
                {language === 'en' ? cat.nameEn : cat.nameMs || cat.nameEn}
              </option>
            ))}
          </select>

          {/* Stock Filter Pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 text-xs">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                stockFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'All' : 'Semua'}
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('in_stock')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                stockFilter === 'in_stock' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'In Stock' : 'Ada Stok'}
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('out_of_stock')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                stockFilter === 'out_of_stock' ? 'bg-rose-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {language === 'en' ? 'Out of Stock' : 'Habis Stok'}
            </button>
          </div>
        </div>

        {/* Bulk Update Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {language === 'en'
                ? `Showing ${filteredProducts.length} of ${products.length} products`
                : `Menunjukkan ${filteredProducts.length} daripada ${products.length} barangan`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-semibold">{language === 'en' ? 'Bulk Actions:' : 'Tindakan Pukal:'}</span>
            <button
              type="button"
              onClick={() => handleBulkToggleAll(true)}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Mark All In Stock' : 'Tanda Semua Ada Stok'}
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggleAll(false)}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Mark All Out of Stock' : 'Tanda Semua Habis'}
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'catalog' ? (
        <>
          {/* Expiry Inspection Hub Quick Interactive Cards */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {language === 'en' ? 'Expiry Inspection Hub Filters:' : 'Penapis Pusat Pemeriksaan Luput:'}
                </span>
              </div>
              {expiryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setExpiryFilter('all')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3 h-3 text-emerald-600" />
                  <span>{language === 'en' ? 'Reset (Show All SKUs)' : 'Set Semula (Tunjuk Semua)'}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: Critical Expiry */}
              <button
                type="button"
                id="catalog-expiry-kpi-critical"
                data-testid="catalog-expiry-kpi-critical"
                role="button"
                aria-pressed={expiryFilter === 'critical'}
                onClick={() => setExpiryFilter((prev) => (prev === 'critical' ? 'all' : 'critical'))}
                className={`text-left rounded-2xl p-3.5 transition-all duration-200 cursor-pointer relative overflow-hidden focus:outline-hidden ${
                  expiryFilter === 'critical'
                    ? 'bg-rose-100/95 border-2 border-rose-600 shadow-md ring-4 ring-rose-400/30 scale-[1.01]'
                    : 'bg-rose-50 hover:bg-rose-100/70 border border-rose-200 hover:border-rose-300 shadow-xs hover:shadow-sm'
                }`}
                title={language === 'en' ? 'Click to filter critical expiry (≤ 5 days)' : 'Klik untuk tapis luput kritikal (≤ 5 hari)'}
              >
                <div className="flex items-center justify-between text-xs font-bold text-rose-700 uppercase">
                  <span>Critical Expiry (≤ 5 Days)</span>
                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-xl font-black text-rose-800">
                    {products.filter((p) => getDaysUntilExpiry(p.expiryDate || p.expiry_date) <= 5).length} SKUs
                  </p>
                  {expiryFilter === 'critical' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-rose-600 hover:underline">
                      Filter list &rarr;
                    </span>
                  )}
                </div>
              </button>

              {/* Card 2: Expiring Soon */}
              <button
                type="button"
                id="catalog-expiry-kpi-expiring-soon"
                data-testid="catalog-expiry-kpi-expiring-soon"
                role="button"
                aria-pressed={expiryFilter === 'expiring_soon'}
                onClick={() => setExpiryFilter((prev) => (prev === 'expiring_soon' ? 'all' : 'expiring_soon'))}
                className={`text-left rounded-2xl p-3.5 transition-all duration-200 cursor-pointer relative overflow-hidden focus:outline-hidden ${
                  expiryFilter === 'expiring_soon'
                    ? 'bg-amber-100/95 border-2 border-amber-600 shadow-md ring-4 ring-amber-400/30 scale-[1.01]'
                    : 'bg-amber-50 hover:bg-amber-100/70 border border-amber-200 hover:border-amber-300 shadow-xs hover:shadow-sm'
                }`}
                title={language === 'en' ? 'Click to filter expiring soon (6 - 14 days)' : 'Klik untuk tapis hampir luput (6 - 14 hari)'}
              >
                <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase">
                  <span>Expiring Soon (6 - 14 Days)</span>
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-xl font-black text-amber-800">
                    {products.filter((p) => {
                      const d = getDaysUntilExpiry(p.expiryDate || p.expiry_date);
                      return d > 5 && d <= 14;
                    }).length} SKUs
                  </p>
                  {expiryFilter === 'expiring_soon' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 hover:underline">
                      Filter list &rarr;
                    </span>
                  )}
                </div>
              </button>

              {/* Card 3: Healthy Shelf-Life */}
              <button
                type="button"
                id="catalog-expiry-kpi-healthy"
                data-testid="catalog-expiry-kpi-healthy"
                role="button"
                aria-pressed={expiryFilter === 'healthy'}
                onClick={() => setExpiryFilter((prev) => (prev === 'healthy' ? 'all' : 'healthy'))}
                className={`text-left rounded-2xl p-3.5 transition-all duration-200 cursor-pointer relative overflow-hidden focus:outline-hidden ${
                  expiryFilter === 'healthy'
                    ? 'bg-emerald-100/95 border-2 border-emerald-600 shadow-md ring-4 ring-emerald-400/30 scale-[1.01]'
                    : 'bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 hover:border-emerald-300 shadow-xs hover:shadow-sm'
                }`}
                title={language === 'en' ? 'Click to filter healthy shelf-life (> 14 days)' : 'Klik untuk tapis hayat simpanan sihat (> 14 hari)'}
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase">
                  <span>Healthy Shelf-Life (&gt; 14 Days)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-xl font-black text-emerald-800">
                    {products.filter((p) => getDaysUntilExpiry(p.expiryDate || p.expiry_date) > 14).length} SKUs
                  </p>
                  {expiryFilter === 'healthy' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700 hover:underline">
                      Filter list &rarr;
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Active Banner */}
            {expiryFilter !== 'all' && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-xs mt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  <span className="font-bold text-emerald-900">
                    {language === 'en' ? 'Filtered by Expiry:' : 'Ditapis mengikut Luput:'}
                  </span>
                  <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px]">
                    {expiryFilter === 'critical' && 'Critical Expiry (≤ 5 Days)'}
                    {expiryFilter === 'expiring_soon' && 'Expiring Soon (6 - 14 Days)'}
                    {expiryFilter === 'healthy' && 'Healthy Shelf-Life (> 14 Days)'}
                  </span>
                  <span className="text-emerald-700 font-medium">
                    ({filteredProducts.length} matching)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setExpiryFilter('all')}
                  className="px-2.5 py-0.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-bold text-[11px] cursor-pointer"
                >
                  {language === 'en' ? 'Show All' : 'Tunjuk Semua'}
                </button>
              </div>
            )}
          </div>

          {/* 1. MOBILE VIEW: Responsive Product Card Layout (Card-Based Layout for small screens) */}
      <div className="block md:hidden space-y-3" id="admin-inventory-mobile-card-list">
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-2xl border border-gray-200 text-gray-500 text-sm">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-gray-700">
              {language === 'en' ? 'No products match your criteria' : 'Tiada barangan dijumpai'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {language === 'en' ? 'Try adjusting your search query or filters.' : 'Cuba ubah carian atau penapis anda.'}
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isOutOfStock = !product.inStock || (product.stockCount ?? 0) === 0;
            const isLowStock = product.inStock && (product.stockCount ?? 0) > 0 && (product.stockCount ?? 0) <= 10;
            const isEditingStock = quickStockEditId === product.id;

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                onClick={() => setViewingDetailsProduct(product)}
                className={`rounded-2xl p-3.5 transition-all shadow-xs relative border cursor-pointer active:scale-[0.99] ${
                  isOutOfStock
                    ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                    : isLowStock
                    ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                    : 'bg-white border-gray-200/90 hover:border-emerald-300'
                }`}
              >
                {/* Visual Alert Banner for Low/Out of Stock */}
                {isOutOfStock && (
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-rose-800 bg-rose-100/90 px-2 py-0.5 rounded-md mb-2 w-fit border border-rose-200">
                    <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>{language === 'en' ? 'ATTENTION: OUT OF STOCK' : 'PERHATIAN: STOK HABIS'}</span>
                  </div>
                )}
                {isLowStock && (
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md mb-2 w-fit border border-amber-200">
                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>
                      {language === 'en'
                        ? `LOW STOCK ALERT: ${product.stockCount} LEFT`
                        : `AMARAN STOK RENDAH: BAKI ${product.stockCount}`}
                    </span>
                  </div>
                )}

                {/* Card Top Row: Thumbnail Image, Title, Price, Status Badge */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={product.image}
                      alt={product.nameEn}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-200/80 bg-gray-100 shadow-2xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                    {product.badge && (
                      <span className="absolute -top-1.5 -left-1.5 bg-amber-400 text-emerald-950 text-[9px] font-black px-1 rounded shadow-xs">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="font-bold text-sm text-gray-900 leading-snug line-clamp-1">
                        {language === 'en' ? product.nameEn : product.nameMs}
                      </h4>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    </div>

                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {language === 'en' ? product.nameMs : product.nameEn}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-emerald-700">
                          RM {product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-[11px] text-gray-400 line-through">
                            RM {product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono bg-white/80 px-1.5 py-0.2 rounded border border-gray-200">
                        {product.amountEn}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Middle Row: SKU & Stock Status Badge */}
                <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100/80 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500 font-mono text-[11px]">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <span>{product.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-800'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-900 font-black'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isOutOfStock ? (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>{language === 'en' ? 'Out of Stock' : 'Habis'}</span>
                        </>
                      ) : isLowStock ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>{product.stockCount} {language === 'en' ? 'units left' : 'unit baki'}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{product.stockCount} {language === 'en' ? 'in stock' : 'unit'}</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Inline Quick Actions on Card */}
                <div
                  className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-gray-100"
                  onClick={(e) => e.stopPropagation()} // Prevent opening details modal when tapping action buttons
                >
                  {/* Quick Stock Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleStock(product.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      product.inStock
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    }`}
                  >
                    {product.inStock ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{language === 'en' ? 'In Stock' : 'Ada Stok'}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                        <span>{language === 'en' ? 'Out of Stock' : 'Habis Stok'}</span>
                      </>
                    )}
                  </button>

                  {/* Quick Stock Count Update or Shortcut */}
                  {isEditingStock ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        value={quickStockValue}
                        onChange={(e) => setQuickStockValue(parseInt(e.target.value) || 0)}
                        className="w-16 px-1.5 py-1 text-xs border border-emerald-400 rounded-lg text-center font-bold"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickStockSubmit(product.id, quickStockValue)}
                        className="p-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickStockEditId(null)}
                        className="p-1 bg-gray-200 text-gray-700 rounded-lg text-xs"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setQuickStockEditId(product.id);
                        setQuickStockValue(product.stockCount ?? 0);
                      }}
                      className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title={language === 'en' ? 'Quick Update Stock Quantity' : 'Kemaskini Kuantiti Stok'}
                    >
                      <Boxes className="w-3.5 h-3.5 text-gray-500" />
                      <span>{language === 'en' ? 'Qty' : 'Kuantiti'}: {product.stockCount}</span>
                    </button>
                  )}

                  {/* Quick Edit Price / Edit Shortcut */}
                  <button
                    type="button"
                    onClick={() => setEditingProduct(product)}
                    className="py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Edit' : 'Ubah'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. TABLET & DESKTOP VIEW: Data Table (Hidden on mobile, fluid horizontally on tablet/ipad & desktop) */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Tablet Scroll Notice / Quick Summary (Shown on tablet / iPad viewports) */}
        <div className="flex md:flex xl:hidden items-center justify-between px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 text-xs text-emerald-900 font-medium">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {language === 'en'
                ? 'Tablet Mode: Scroll horizontally to view complete inventory metrics and actions'
                : 'Mod Tablet: Tatal ke tepi untuk melihat metrik inventori dan tindakan lengkap'}
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
            {filteredProducts.length} {language === 'en' ? 'SKUs' : 'Item'}
          </span>
        </div>

        {/* Responsive Table Scroll Container with Touch Momentum */}
        <div
          className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <table className="w-full min-w-[1180px] text-left text-sm border-separate border-spacing-0">
            <thead className="bg-gray-50/95 text-gray-700 font-bold text-xs uppercase tracking-wider">
              <tr>
                {/* Sticky Left Column: Product & SKU */}
                <th className="sticky left-0 z-20 bg-gray-50/95 backdrop-blur-xs py-3.5 px-4 min-w-[260px] max-w-[280px] w-[260px] border-b border-r border-gray-200 shadow-[3px_0_8px_-3px_rgba(0,0,0,0.06)] whitespace-nowrap">
                  {language === 'en' ? 'Product / SKU' : 'Barangan / SKU'}
                </th>
                <th className="py-3.5 px-3 min-w-[140px] whitespace-nowrap border-b border-gray-200">
                  {language === 'en' ? 'Department' : 'Jabatan'}
                </th>
                <th className="py-3.5 px-3 min-w-[110px] whitespace-nowrap border-b border-gray-200">
                  {language === 'en' ? 'Selling Price' : 'Harga Jualan'}
                </th>
                <th className="py-3.5 px-3 min-w-[170px] whitespace-nowrap border-b border-gray-200">
                  <div className="flex items-center gap-1 text-emerald-800">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Stock Qty (Quick Edit)' : 'Kuantiti Stok (Ubah Pantas)'}</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 min-w-[210px] whitespace-nowrap border-b border-gray-200">
                  <div className="flex items-center gap-1 text-emerald-800">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Expiry Date (Quick Edit)' : 'Tarikh Luput (Ubah Pantas)'}</span>
                  </div>
                </th>
                <th className="py-3.5 px-3 min-w-[130px] whitespace-nowrap border-b border-gray-200">
                  {language === 'en' ? 'Availability' : 'Ketersediaan'}
                </th>
                <th className="py-3.5 px-3 min-w-[120px] whitespace-nowrap border-b border-gray-200">
                  {language === 'en' ? 'Badge / Promo' : 'Lencana'}
                </th>
                <th className="py-3.5 px-4 min-w-[100px] text-right whitespace-nowrap border-b border-gray-200">
                  {language === 'en' ? 'Actions' : 'Tindakan'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const daysLeft = getDaysUntilExpiry(product.expiryDate || product.expiry_date);

                return (
                  <tr
                    key={product.id}
                    onClick={() => setViewingDetailsProduct(product)}
                    className="group hover:bg-emerald-50/40 transition-colors cursor-pointer"
                  >
                    {/* Sticky Product Details Column */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-emerald-50/80 transition-colors py-3 px-4 min-w-[260px] max-w-[280px] w-[260px] border-b border-r border-gray-100 shadow-[3px_0_8px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={product.image}
                          alt={product.nameEn}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0 bg-gray-100 shadow-2xs"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-bold text-gray-900 truncate text-sm max-w-[180px]"
                            title={product.nameEn}
                          >
                            {product.nameEn}
                          </p>
                          <p
                            className="text-xs text-gray-500 truncate max-w-[180px]"
                            title={product.nameMs}
                          >
                            {product.nameMs}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            <span
                              className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm shrink-0 truncate max-w-[110px]"
                              title={product.id}
                            >
                              {product.id}
                            </span>
                            <span
                              className="text-[10px] text-gray-400 truncate max-w-[90px]"
                              title={product.amountEn}
                            >
                              • {product.amountEn}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department Column */}
                    <td className="py-3 px-3 min-w-[140px] text-xs text-gray-600 font-medium whitespace-nowrap border-b border-gray-100">
                      <span
                        className="inline-block px-2.5 py-1 bg-gray-100 rounded-lg text-gray-700 font-semibold truncate max-w-[140px]"
                        title={product.mainCategory.replace(/_/g, ' ')}
                      >
                        {(() => {
                          const catId = getProductCategoryId(product);
                          const resolved = activeCategoriesList.find((c) => c.id === catId);
                          if (resolved) {
                            return language === 'en' ? resolved.nameEn : resolved.nameMs || resolved.nameEn;
                          }
                          return product.mainCategory.replace(/_/g, ' ');
                        })()}
                      </span>
                    </td>

                    {/* Price Column */}
                    <td className="py-3 px-3 min-w-[110px] whitespace-nowrap border-b border-gray-100">
                      <div className="font-black text-emerald-700 text-sm">RM {product.price.toFixed(2)}</div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-xs text-gray-400 line-through">
                          RM {product.originalPrice.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Stock Quantity Column with Inline Quick Edit */}
                    <td
                      className="py-3 px-3 min-w-[170px] whitespace-nowrap border-b border-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {quickStockEditId === product.id ? (
                        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border-2 border-emerald-500 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setQuickStockValue((v) => Math.max(0, v - 1))}
                            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                            title="Decrement stock"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={quickStockValue}
                            onChange={(e) => setQuickStockValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickStockSubmit(product.id, quickStockValue);
                              if (e.key === 'Escape') setQuickStockEditId(null);
                            }}
                            className="w-14 px-1 py-0.5 text-xs font-black text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setQuickStockValue((v) => v + 1)}
                            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                            title="Increment stock"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStockSubmit(product.id, quickStockValue)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                            title="Save stock level (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickStockEditId(null)}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 cursor-pointer"
                            title="Cancel (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/stock">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-md inline-flex items-center ${
                              !product.inStock
                                ? 'bg-rose-100 text-rose-700'
                                : (product.stockCount ?? 0) <= 10
                                ? 'bg-amber-100 text-amber-800 font-black'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {product.inStock ? `${product.stockCount} in stock` : '0 (Empty)'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickStockEditId(product.id);
                              setQuickStockValue(product.stockCount ?? 0);
                              setQuickExpiryEditId(null);
                            }}
                            className="opacity-70 group-hover/stock:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-emerald-700 transition-all cursor-pointer text-[11px] flex items-center gap-0.5"
                            title={language === 'en' ? 'Quick edit stock count' : 'Ubah pantas kuantiti stok'}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Expiry Date Column with Inline Quick Edit */}
                    <td
                      className="py-3 px-3 min-w-[210px] whitespace-nowrap border-b border-gray-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {quickExpiryEditId === product.id ? (
                        <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border-2 border-emerald-500 shadow-lg min-w-[210px] z-30 relative">
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              value={quickExpiryValue}
                              onChange={(e) => setQuickExpiryValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleQuickExpirySubmit(product.id, quickExpiryValue);
                                if (e.key === 'Escape') setQuickExpiryEditId(null);
                              }}
                              className="flex-1 px-2 py-0.5 text-xs font-bold border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleQuickExpirySubmit(product.id, quickExpiryValue)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                              title="Save Expiry Date (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryEditId(null)}
                              className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                              title="Cancel (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {/* Quick Extension Chips */}
                          <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
                            <span className="text-[10px] text-gray-400 font-semibold">Presets:</span>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(3))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                              title="Set 3 days ahead (Critical)"
                            >
                              +3d
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(7))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                              title="Set 7 days ahead (Soon)"
                            >
                              +7d
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(14))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                              title="Set 14 days ahead (Soon)"
                            >
                              +14d
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(30))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                              title="Set 30 days ahead (Healthy)"
                            >
                              +30d
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 group/exp">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>{product.expiryDate || product.expiry_date || '2026-10-15'}</span>
                            </span>
                            <span
                              className={`text-[10px] font-bold mt-0.5 ${
                                daysLeft <= 5
                                  ? 'text-rose-600 font-extrabold'
                                  : daysLeft <= 14
                                  ? 'text-amber-600 font-bold'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {daysLeft <= 5 ? `⚠️ ${daysLeft}d (Critical)` : `${daysLeft}d left`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickExpiryEditId(product.id);
                              setQuickExpiryValue(product.expiryDate || product.expiry_date || '2026-10-15');
                              setQuickStockEditId(null);
                            }}
                            className="opacity-70 group-hover/exp:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-emerald-700 transition-all cursor-pointer text-[11px] flex items-center gap-0.5"
                            title={language === 'en' ? 'Quick edit expiry date' : 'Ubah pantas tarikh luput'}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Availability Toggle Column */}
                    <td className="py-3 px-3 min-w-[130px] whitespace-nowrap border-b border-gray-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleToggleStock(product.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all ${
                          product.inStock
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                        }`}
                      >
                        {product.inStock ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-700" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-rose-600" />
                            <span>Hidden / Out</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Badge Column */}
                    <td className="py-3 px-3 min-w-[120px] whitespace-nowrap border-b border-gray-100">
                      {product.badge ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-md text-[11px] truncate max-w-[125px]"
                          title={product.badge}
                        >
                          <Tag className="w-3 h-3 shrink-0" />
                          <span className="truncate">{product.badge}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">—</span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 min-w-[100px] text-right whitespace-nowrap border-b border-gray-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Edit' : 'Ubah'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    /* BATCH & EXPIRY INSPECTION CONTROL HUB */
    <div className="space-y-4">
      {/* Expiry Overview Filter Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
            <span>
              {language === 'en' ? 'Filter Register by Shelf-Life Status:' : 'Tapis Daftar mengikut Status Jangka Hayat:'}
            </span>
          </div>
          {expiryFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setExpiryFilter('all')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3 h-3 text-emerald-600" />
              <span>{language === 'en' ? 'Reset (Show All SKUs)' : 'Set Semula (Tunjuk Semua)'}</span>
            </button>
          )}
        </div>

        {/* 3 Interactive KPI Filter Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Critical Expiry */}
          <button
            type="button"
            id="expiry-kpi-critical"
            data-testid="expiry-kpi-critical"
            role="button"
            aria-pressed={expiryFilter === 'critical'}
            onClick={() => setExpiryFilter((prev) => (prev === 'critical' ? 'all' : 'critical'))}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden focus:outline-hidden ${
              expiryFilter === 'critical'
                ? 'bg-rose-100/95 border-2 border-rose-600 shadow-md ring-4 ring-rose-400/30 scale-[1.01]'
                : 'bg-rose-50 hover:bg-rose-100/70 border border-rose-200 hover:border-rose-300 shadow-xs hover:shadow-sm'
            }`}
            title={language === 'en' ? 'Click to filter critical expiry (≤ 5 days)' : 'Klik untuk tapis luput kritikal (≤ 5 hari)'}
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-700 uppercase">
              <span className="flex items-center gap-1.5">
                <span>Critical Expiry (≤ 5 Days)</span>
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse shrink-0" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-rose-800">
                {products.filter((p) => getDaysUntilExpiry(p.expiryDate || p.expiry_date) <= 5).length} SKUs
              </p>
              {expiryFilter === 'critical' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>FILTER ACTIVE</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-rose-600 hover:underline">
                  Filter list &rarr;
                </span>
              )}
            </div>
            <p className="text-xs text-rose-600 mt-0.5">Immediate clearance or disposal required</p>
          </button>

          {/* Card 2: Expiring Soon */}
          <button
            type="button"
            id="expiry-kpi-expiring-soon"
            data-testid="expiry-kpi-expiring-soon"
            role="button"
            aria-pressed={expiryFilter === 'expiring_soon'}
            onClick={() => setExpiryFilter((prev) => (prev === 'expiring_soon' ? 'all' : 'expiring_soon'))}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden focus:outline-hidden ${
              expiryFilter === 'expiring_soon'
                ? 'bg-amber-100/95 border-2 border-amber-600 shadow-md ring-4 ring-amber-400/30 scale-[1.01]'
                : 'bg-amber-50 hover:bg-amber-100/70 border border-amber-200 hover:border-amber-300 shadow-xs hover:shadow-sm'
            }`}
            title={language === 'en' ? 'Click to filter expiring soon (6 - 14 days)' : 'Klik untuk tapis hampir luput (6 - 14 hari)'}
          >
            <div className="flex items-center justify-between text-xs font-bold text-amber-700 uppercase">
              <span>Expiring Soon (6 - 14 Days)</span>
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-amber-800">
                {products.filter((p) => {
                  const d = getDaysUntilExpiry(p.expiryDate || p.expiry_date);
                  return d > 5 && d <= 14;
                }).length} SKUs
              </p>
              {expiryFilter === 'expiring_soon' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>FILTER ACTIVE</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 hover:underline">
                  Filter list &rarr;
                </span>
              )}
            </div>
            <p className="text-xs text-amber-600 mt-0.5">Recommended for 25% clearance promotion</p>
          </button>

          {/* Card 3: Healthy Shelf-Life */}
          <button
            type="button"
            id="expiry-kpi-healthy"
            data-testid="expiry-kpi-healthy"
            role="button"
            aria-pressed={expiryFilter === 'healthy'}
            onClick={() => setExpiryFilter((prev) => (prev === 'healthy' ? 'all' : 'healthy'))}
            className={`text-left rounded-2xl p-4 transition-all duration-200 cursor-pointer relative overflow-hidden focus:outline-hidden ${
              expiryFilter === 'healthy'
                ? 'bg-emerald-100/95 border-2 border-emerald-600 shadow-md ring-4 ring-emerald-400/30 scale-[1.01]'
                : 'bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 hover:border-emerald-300 shadow-xs hover:shadow-sm'
            }`}
            title={language === 'en' ? 'Click to filter healthy shelf-life (> 14 days)' : 'Klik untuk tapis hayat simpanan sihat (> 14 hari)'}
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase">
              <span>Healthy Shelf-Life (&gt; 14 Days)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <p className="text-2xl font-black text-emerald-800">
                {products.filter((p) => getDaysUntilExpiry(p.expiryDate || p.expiry_date) > 14).length} SKUs
              </p>
              {expiryFilter === 'healthy' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>FILTER ACTIVE</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-700 hover:underline">
                  Filter list &rarr;
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-600 mt-0.5">Optimal rotation within warehouse stock</p>
          </button>
        </div>

        {/* Active Filter Notification Banner */}
        {expiryFilter !== 'all' && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span className="font-bold text-emerald-900">
                {language === 'en' ? 'Active Expiry Filter:' : 'Penapis Luput Aktif:'}
              </span>
              <span className="font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[11px]">
                {expiryFilter === 'critical' && 'Critical Expiry (≤ 5 Days)'}
                {expiryFilter === 'expiring_soon' && 'Expiring Soon (6 - 14 Days)'}
                {expiryFilter === 'healthy' && 'Healthy Shelf-Life (> 14 Days)'}
              </span>
              <span className="text-emerald-700 font-medium">
                ({filteredProducts.length} matching {filteredProducts.length === 1 ? 'item' : 'items'})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpiryFilter('all')}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'en' ? 'Clear Filter' : 'Kosongkan Penapis'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Batch Tracking Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              {language === 'en' ? 'Live Warehouse Batch & Shelf-Life Register' : 'Daftar Kelompok & Jangka Hayat Gudang'}
            </h3>
            <p className="text-xs text-gray-500">Track production batches, expiry countdowns, and gross margins</p>
          </div>
          <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0">
            {filteredProducts.length} {language === 'en' ? 'Batches' : 'Kelompok'}
          </span>
        </div>

        {/* Active Shelf-Life Filter Feedback Banner */}
        {expiryFilter !== 'all' && (
          <div className="px-4 py-2.5 bg-emerald-50/90 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-950 font-medium">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {expiryFilter === 'critical'
                    ? language === 'en' ? 'Filter Active: Critical Expiry (≤ 5 Days)' : 'Penapis Aktif: Luput Kritikal (≤ 5 Hari)'
                    : expiryFilter === 'expiring_soon'
                    ? language === 'en' ? 'Filter Active: Expiring Soon (6 - 14 Days)' : 'Penapis Aktif: Hampir Luput (6 - 14 Hari)'
                    : language === 'en' ? 'Filter Active: Healthy Shelf-Life (> 14 Days)' : 'Penapis Aktif: Jangka Hayat Sihat (> 14 Hari)'}
                </span>
              </span>
              <span className="bg-white text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-black">
                {filteredProducts.length} {language === 'en' ? 'SKUs match' : 'SKU sepadan'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpiryFilter('all')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <X className="w-3 h-3 text-emerald-600" />
              <span>{language === 'en' ? 'Show All' : 'Tunjuk Semua'}</span>
            </button>
          </div>
        )}

        {/* 1. Mobile Screen Card Layout (<640px) */}
        <div className="block sm:hidden p-3 space-y-3 bg-gray-50/50">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="font-bold text-sm text-gray-700">
                {language === 'en' ? 'No batch records found' : 'Tiada rekod kelompok ditemui'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {expiryFilter !== 'all'
                  ? language === 'en'
                    ? 'No products match the selected expiry filter. Click "Show All" to reset.'
                    : 'Tiada barangan menepati penapis tarikh luput. Klik "Tunjuk Semua" untuk set semula.'
                  : language === 'en'
                  ? 'Try adjusting your search or category filter'
                  : 'Cuba ubah carian atau penapis kategori anda'}
              </p>
              {expiryFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setExpiryFilter('all')}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Show All Products' : 'Tunjuk Semua Barangan'}</span>
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((p) => {
              const daysLeft = getDaysUntilExpiry(p.expiryDate || p.expiry_date);
              const batchCode = p.batchNumber || p.batch_number || `BATCH-${p.id.slice(-4)}`;
              const cost = p.costPrice || p.cost_price || Number((p.price * 0.65).toFixed(2));
              const margin = Math.round(((p.price - cost) / p.price) * 100);

              return (
                <div
                  key={p.id}
                  className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs space-y-3"
                >
                  {/* Card Header: Clickable to Edit */}
                  <div
                    className="flex items-start justify-between gap-2.5 cursor-pointer group"
                    onClick={() => setEditingProduct(p)}
                    title={language === 'en' ? 'Click to edit product' : 'Klik untuk ubah barangan'}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={p.image}
                        alt={p.nameEn}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-50 shrink-0 shadow-2xs group-hover:ring-2 group-hover:ring-emerald-500 transition-all"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors" title={p.nameEn}>
                          {p.nameEn}
                        </p>
                        <p className="text-xs text-gray-500 truncate" title={p.nameMs}>
                          {p.nameMs}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm inline-block">
                            {p.id}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>{language === 'en' ? 'Quick Edit' : 'Ubah Pantas'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Shelf Status Tag */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {daysLeft <= 5 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white">
                          CRITICAL
                        </span>
                      ) : daysLeft <= 14 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white">
                          CLEARANCE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                          HEALTHY
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          daysLeft <= 5
                            ? 'bg-rose-100 text-rose-800'
                            : daysLeft <= 14
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>{daysLeft}d left</span>
                      </span>
                    </div>
                  </div>

                  {/* Details Grid: Batch Code, Cost vs Retail & Margin */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                        Batch Code
                      </span>
                      <span className="font-mono font-bold text-gray-800 text-xs truncate block" title={batchCode}>
                        {batchCode}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                        Cost Price
                      </span>
                      <span className="font-semibold text-gray-700 text-xs">
                        RM {cost.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                        Retail Price & Margin
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-emerald-700 text-xs">
                          RM {p.price.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {margin}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">
                        Current Status
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {p.inStock ? 'Available in Store' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Inline Quick Edit Section for Stock Level & Expiry Date */}
                  <div className="space-y-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100" onClick={(e) => e.stopPropagation()}>
                    {/* 1. Direct Inline Stock Level Edit */}
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold flex items-center gap-1">
                          <Boxes className="w-3 h-3 text-emerald-600" />
                          <span>{language === 'en' ? 'Stock Level (Quick Edit)' : 'Paras Stok (Ubah Terus)'}</span>
                        </span>
                        {quickStockEditId !== p.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickStockEditId(p.id);
                              setQuickStockValue(p.stockCount ?? 0);
                              setQuickExpiryEditId(null);
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>{language === 'en' ? 'Edit' : 'Ubah'}</span>
                          </button>
                        )}
                      </div>

                      {quickStockEditId === p.id ? (
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setQuickStockValue((v) => Math.max(0, v - 1))}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={quickStockValue}
                            onChange={(e) => setQuickStockValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickStockSubmit(p.id, quickStockValue);
                              if (e.key === 'Escape') setQuickStockEditId(null);
                            }}
                            className="w-20 px-2 py-1 text-xs font-black text-center border-2 border-emerald-500 rounded-lg"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setQuickStockValue((v) => v + 1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold flex items-center justify-center text-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickStockSubmit(p.id, quickStockValue)}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setQuickStockEditId(null)}
                            className="p-1 bg-gray-100 text-gray-600 rounded-lg text-xs cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded-md ${
                              !p.inStock || (p.stockCount ?? 0) === 0
                                ? 'bg-rose-100 text-rose-800'
                                : (p.stockCount ?? 0) <= 10
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.stockCount ?? 0} {language === 'en' ? 'units in stock' : 'unit dalam stok'}
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {p.inStock ? 'Available' : 'Out of stock'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 2. Direct Inline Expiry Date Edit */}
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>{language === 'en' ? 'Expiry Date (Quick Edit)' : 'Tarikh Luput (Ubah Terus)'}</span>
                        </span>
                        {quickExpiryEditId !== p.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickExpiryEditId(p.id);
                              setQuickExpiryValue(p.expiryDate || p.expiry_date || getFutureDateString(14));
                              setQuickStockEditId(null);
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit3 className="w-2.5 h-2.5" />
                            <span>{language === 'en' ? 'Edit' : 'Ubah'}</span>
                          </button>
                        )}
                      </div>

                      {quickExpiryEditId === p.id ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={quickExpiryValue}
                              onChange={(e) => setQuickExpiryValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleQuickExpirySubmit(p.id, quickExpiryValue);
                                if (e.key === 'Escape') setQuickExpiryEditId(null);
                              }}
                              className="flex-1 px-2 py-1 text-xs font-bold border-2 border-emerald-500 rounded-lg"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleQuickExpirySubmit(p.id, quickExpiryValue)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryEditId(null)}
                              className="p-1 bg-gray-100 text-gray-600 rounded-lg text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {/* Quick Extension Chips */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[10px] text-gray-400 font-semibold">Presets:</span>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(3))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 cursor-pointer"
                              title="Set 3 days ahead (Critical)"
                            >
                              +3d
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(7))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer"
                              title="Set 7 days ahead (Soon)"
                            >
                              +7d
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(14))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer"
                              title="Set 14 days ahead (Soon)"
                            >
                              +14d
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(30))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer"
                              title="Set 30 days ahead (Healthy)"
                            >
                              +30d
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickExpiryValue(getFutureDateString(90))}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer"
                              title="Set 90 days ahead (Healthy)"
                            >
                              +90d
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{p.expiryDate || p.expiry_date || '2026-10-15'}</span>
                          </span>
                          <span className="text-[11px] text-gray-400">
                            {daysLeft} {language === 'en' ? 'days left' : 'hari tinggal'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons with Inline Quick Edit */}
                  <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(p)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                      title={language === 'en' ? 'Open Product Edit Modal' : 'Buka Modal Ubah Barangan'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Edit' : 'Ubah'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyClearance(p.id, 25)}
                      className="flex-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Apply 25% Clearance Discount"
                    >
                      <Percent className="w-3 h-3" />
                      <span>25% Off</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBatchEditProduct(p)}
                      className="py-1.5 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                      title="Edit Batch & Expiry"
                    >
                      <Boxes className="w-3 h-3 text-gray-600" />
                      <span>Batch</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleScrapProduct(p.id)}
                      className="py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      title="Scrap stock"
                    >
                      Scrap
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. Tablet & Desktop View (>=640px): Full Horizontal Scrolling Data Grid */}
        <div
          className="hidden sm:block relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <table className="w-full min-w-[1150px] text-left text-sm border-separate border-spacing-0">
            <thead className="bg-gray-50/95 text-gray-600 font-bold text-xs uppercase tracking-wider">
              <tr>
                <th className="sticky left-0 z-20 bg-gray-50/95 backdrop-blur-xs py-3 px-4 min-w-[240px] max-w-[260px] w-[240px] border-b border-r border-gray-200 shadow-[3px_0_8px_-3px_rgba(0,0,0,0.06)] whitespace-nowrap">
                  Item & SKU
                </th>
                <th className="py-3 px-3 min-w-[130px] whitespace-nowrap border-b border-gray-200">Batch Code</th>
                <th className="py-3 px-3 min-w-[170px] whitespace-nowrap border-b border-gray-200">
                  <div className="flex items-center gap-1 text-emerald-800">
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Stock Qty (Quick Edit)</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[220px] whitespace-nowrap border-b border-gray-200">
                  <div className="flex items-center gap-1 text-emerald-800">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Expiry Date (Quick Edit)</span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[130px] whitespace-nowrap border-b border-gray-200">Days Remaining</th>
                <th className="py-3 px-3 min-w-[120px] whitespace-nowrap border-b border-gray-200">Shelf Status</th>
                <th className="py-3 px-3 min-w-[140px] whitespace-nowrap border-b border-gray-200">Cost & Margin</th>
                <th className="py-3 px-4 min-w-[210px] text-right whitespace-nowrap border-b border-gray-200">Batch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 bg-white">
                    <Package className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="font-bold text-sm text-gray-700">
                      {language === 'en' ? 'No batch records match the active criteria' : 'Tiada rekod kelompok menepati kriteria aktif'}
                    </p>
                    {expiryFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setExpiryFilter('all')}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-700 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{language === 'en' ? 'Show All Products' : 'Tunjuk Semua Barangan'}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const daysLeft = getDaysUntilExpiry(p.expiryDate || p.expiry_date);
                  const batchCode = p.batchNumber || p.batch_number || `BATCH-${p.id.slice(-4)}`;
                  const cost = p.costPrice || p.cost_price || Number((p.price * 0.65).toFixed(2));
                  const margin = Math.round(((p.price - cost) / p.price) * 100);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setEditingProduct(p)}
                      className="group hover:bg-emerald-50/40 transition-colors cursor-pointer"
                      title={language === 'en' ? 'Click row to edit product' : 'Klik baris untuk ubah barangan'}
                    >
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-emerald-50/80 transition-colors py-3 px-4 min-w-[240px] max-w-[260px] w-[240px] border-b border-r border-gray-100 shadow-[3px_0_8px_-3px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={p.image} alt={p.nameEn} className="w-10 h-10 rounded-lg object-cover border border-gray-200 bg-gray-50 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-gray-900 truncate max-w-[160px] group-hover:text-emerald-700 transition-colors" title={p.nameEn}>{p.nameEn}</p>
                            <span className="text-[10px] font-mono text-gray-400 truncate block max-w-[160px]">{p.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-xs font-bold text-gray-700 whitespace-nowrap border-b border-gray-100 min-w-[130px]">
                        {batchCode}
                      </td>

                      {/* Stock Level Column with Inline Quick Edit */}
                      <td
                        className="py-3 px-3 whitespace-nowrap border-b border-gray-100 min-w-[170px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {quickStockEditId === p.id ? (
                          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border-2 border-emerald-500 shadow-sm">
                            <button
                              type="button"
                              onClick={() => setQuickStockValue((v) => Math.max(0, v - 1))}
                              className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                              title="Decrement stock"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={quickStockValue}
                              onChange={(e) => setQuickStockValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleQuickStockSubmit(p.id, quickStockValue);
                                if (e.key === 'Escape') setQuickStockEditId(null);
                              }}
                              className="w-14 px-1 py-0.5 text-xs font-black text-center border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setQuickStockValue((v) => v + 1)}
                              className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs cursor-pointer"
                              title="Increment stock"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickStockSubmit(p.id, quickStockValue)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                              title="Save stock level (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuickStockEditId(null)}
                              className="p-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-600 cursor-pointer"
                              title="Cancel (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/stock">
                            <span
                              className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                !p.inStock || (p.stockCount ?? 0) === 0
                                  ? 'bg-rose-100 text-rose-800'
                                  : (p.stockCount ?? 0) <= 10
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {p.stockCount ?? 0} {language === 'en' ? 'units' : 'unit'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickStockEditId(p.id);
                                setQuickStockValue(p.stockCount ?? 0);
                                setQuickExpiryEditId(null);
                              }}
                              className="opacity-70 group-hover/stock:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-emerald-700 transition-all cursor-pointer text-[11px] flex items-center gap-0.5"
                              title={language === 'en' ? 'Quick edit stock count' : 'Ubah pantas kuantiti stok'}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Expiry Date Column with Inline Quick Edit */}
                      <td
                        className="py-3 px-3 whitespace-nowrap border-b border-gray-100 min-w-[220px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {quickExpiryEditId === p.id ? (
                          <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border-2 border-emerald-500 shadow-lg min-w-[215px] z-30 relative">
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={quickExpiryValue}
                                onChange={(e) => setQuickExpiryValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickExpirySubmit(p.id, quickExpiryValue);
                                  if (e.key === 'Escape') setQuickExpiryEditId(null);
                                }}
                                className="flex-1 px-2 py-0.5 text-xs font-bold border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => handleQuickExpirySubmit(p.id, quickExpiryValue)}
                                className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
                                title="Save Expiry Date (Enter)"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickExpiryEditId(null)}
                                className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer"
                                title="Cancel (Esc)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {/* Preset extension chips */}
                            <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
                              <span className="text-[10px] text-gray-400 font-semibold">Presets:</span>
                              <button
                                type="button"
                                onClick={() => setQuickExpiryValue(getFutureDateString(3))}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                                title="Set 3 days ahead (Critical)"
                              >
                                +3d
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickExpiryValue(getFutureDateString(7))}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                                title="Set 7 days ahead (Soon)"
                              >
                                +7d
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickExpiryValue(getFutureDateString(14))}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer"
                                title="Set 14 days ahead (Soon)"
                              >
                                +14d
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickExpiryValue(getFutureDateString(30))}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                                title="Set 30 days ahead (Healthy)"
                              >
                                +30d
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuickExpiryValue(getFutureDateString(90))}
                                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                                title="Set 90 days ahead (Healthy)"
                              >
                                +90d
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 group/exp">
                            <span className="font-semibold text-gray-800 text-xs flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{p.expiryDate || p.expiry_date || '2026-10-15'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickExpiryEditId(p.id);
                                setQuickExpiryValue(p.expiryDate || p.expiry_date || '2026-10-15');
                                setQuickStockEditId(null);
                              }}
                              className="opacity-70 group-hover/exp:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-emerald-700 transition-all cursor-pointer text-[11px] flex items-center gap-0.5"
                              title={language === 'en' ? 'Quick edit expiry date' : 'Ubah pantas tarikh luput'}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap border-b border-gray-100 min-w-[130px]">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                            daysLeft <= 5
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : daysLeft <= 14
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{daysLeft} days</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap border-b border-gray-100 min-w-[120px]">
                        {daysLeft <= 5 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-500 text-white">
                            CRITICAL
                          </span>
                        ) : daysLeft <= 14 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-white">
                            CLEARANCE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white">
                            HEALTHY
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap border-b border-gray-100 min-w-[140px]">
                        <div className="text-xs">
                          <span className="text-gray-500">Cost: RM {cost.toFixed(2)}</span>
                          <div className="font-bold text-emerald-700">Retail: RM {p.price.toFixed(2)}</div>
                          <span className="text-[10px] font-semibold text-gray-400">{margin}% margin</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap border-b border-gray-100 min-w-[210px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                            title={language === 'en' ? 'Open Product Edit Modal' : 'Buka Modal Ubah Barangan'}
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{language === 'en' ? 'Edit' : 'Ubah'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyClearance(p.id, 25)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Apply 25% Clearance Discount"
                          >
                            <Percent className="w-3 h-3" />
                            <span>25% Off</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBatchEditProduct(p)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Edit Batch & Expiry"
                          >
                            <Boxes className="w-3 h-3 text-gray-600" />
                            <span>Batch</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScrapProduct(p.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Scrap stock"
                          >
                            Scrap
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* 3. INTERACTIVE PRODUCT DETAILS MODAL / SLIDE-UP DRAWER */}
      {viewingDetailsProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setViewingDetailsProduct(null)}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header with Close Button */}
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Info className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-black text-gray-900 truncate text-base">
                  {language === 'en' ? 'Product SKU Details' : 'Maklumat Terperinci SKU'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDetailsProduct(null)}
                className="p-1.5 rounded-full hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Product Hero: Image, Title, SKU */}
              <div className="flex gap-3.5 items-start">
                <img
                  src={viewingDetailsProduct.image}
                  alt={viewingDetailsProduct.nameEn}
                  className="w-20 h-20 rounded-2xl object-cover border border-gray-200 bg-gray-100 shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                    SKU: {viewingDetailsProduct.id}
                  </span>
                  <h4 className="font-black text-base text-gray-900 mt-1 leading-snug">
                    {viewingDetailsProduct.nameEn}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {viewingDetailsProduct.nameMs}
                  </p>
                  {viewingDetailsProduct.badge && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md">
                      <Tag className="w-2.5 h-2.5" />
                      {viewingDetailsProduct.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Stock Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 font-medium block">
                    {language === 'en' ? 'Current Selling Price' : 'Harga Jualan Semasa'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-black text-emerald-700">
                      RM {viewingDetailsProduct.price.toFixed(2)}
                    </span>
                    {viewingDetailsProduct.originalPrice && viewingDetailsProduct.originalPrice > viewingDetailsProduct.price && (
                      <span className="text-xs text-gray-400 line-through">
                        RM {viewingDetailsProduct.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 font-medium block">
                    {language === 'en' ? 'Exact Remaining Stock' : 'Baki Stok Tepat'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`text-sm font-black px-2 py-0.5 rounded-lg ${
                        !viewingDetailsProduct.inStock || viewingDetailsProduct.stockCount === 0
                          ? 'bg-rose-100 text-rose-800'
                          : viewingDetailsProduct.stockCount <= 10
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {viewingDetailsProduct.stockCount} {viewingDetailsProduct.unitEn || 'units'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Department, Subcategory, Packaging */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">{language === 'en' ? 'Department' : 'Jabatan'}:</span>
                  <span className="font-bold text-gray-900 uppercase">
                    {(() => {
                      const catId = getProductCategoryId(viewingDetailsProduct);
                      const resolved = activeCategoriesList.find((c) => c.id === catId);
                      if (resolved) {
                        return language === 'en' ? resolved.nameEn : resolved.nameMs || resolved.nameEn;
                      }
                      return (viewingDetailsProduct.mainCategory || viewingDetailsProduct.category || '').replace(/_/g, ' ');
                    })()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">{language === 'en' ? 'Subcategory / Shelf' : 'Subkategori'}:</span>
                  <span className="font-bold text-gray-900">
                    {viewingDetailsProduct.subCategory?.replace(/_/g, ' ') || 'General'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">{language === 'en' ? 'Packaging / Amount' : 'Pembungkusan'}:</span>
                  <span className="font-bold text-gray-900">
                    {viewingDetailsProduct.amountEn} ({viewingDetailsProduct.amountMs})
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium">{language === 'en' ? 'Halal Certified' : 'Pensijilan Halal'}:</span>
                  <span className="font-bold text-emerald-700">
                    {viewingDetailsProduct.halal ? '✓ JAKIM Halal' : '—'}
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-700 block">
                  {language === 'en' ? 'Full Description' : 'Penerangan Penuh'}
                </span>
                <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 leading-relaxed">
                  {language === 'en' ? viewingDetailsProduct.descriptionEn : viewingDetailsProduct.descriptionMs}
                </p>
              </div>

              {/* In Stock / Out of Stock Toggle */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    {language === 'en' ? 'Live Availability Status' : 'Status Ketersediaan'}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {viewingDetailsProduct.inStock
                      ? language === 'en' ? 'Item is visible to customers in store' : 'Barangan dipaparkan kepada pembeli'
                      : language === 'en' ? 'Item is marked Out of Stock / hidden' : 'Barangan ditandakan habis'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleStock(viewingDetailsProduct.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                    viewingDetailsProduct.inStock
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-rose-600 text-white hover:bg-rose-700'
                  }`}
                >
                  {viewingDetailsProduct.inStock ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'In Stock' : 'Ada Stok'}</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Out of Stock' : 'Habis'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Prominent Modal Bottom Quick Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const target = viewingDetailsProduct;
                  setViewingDetailsProduct(null);
                  setEditingProduct(target);
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>{language === 'en' ? 'Edit Product & Price' : 'Ubah Barangan & Harga'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const newQty = prompt(
                    language === 'en' ? 'Enter new exact stock count:' : 'Masukkan kuantiti stok baru:',
                    String(viewingDetailsProduct.stockCount)
                  );
                  if (newQty !== null) {
                    const parsed = parseInt(newQty, 10);
                    if (!isNaN(parsed)) {
                      handleQuickStockSubmit(viewingDetailsProduct.id, parsed);
                    }
                  }
                }}
                className="py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Boxes className="w-4 h-4 text-gray-600" />
                <span>{language === 'en' ? 'Update Stock' : 'Kemaskini Stok'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-gray-900">
                  {language === 'en' ? 'Edit Grocery Item' : 'Ubah Maklumat Barangan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameEn}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama (Bahasa Malaysia) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.nameMs}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameMs: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Dynamic Store Category Dropdown Field */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-product-category-selector" className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span>{language === 'en' ? 'Store Category / Department *' : 'Kategori / Jabatan Kedai *'}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                      {language === 'en' ? 'Required' : 'Wajib'}
                    </span>
                  </label>
                  <select
                    id="edit-product-category-selector"
                    required
                    value={getProductCategoryId(editingProduct)}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matched = activeCategoriesList.find((c) => c.id === selectedId);
                      if (matched) {
                        const catKey = matched.key || matched.slug || matched.id;
                        setEditingProduct({
                          ...editingProduct,
                          category: catKey,
                          mainCategory: catKey as MainCategory,
                          categoryId: matched.id,
                          category_id: matched.id,
                          subCategory: (matched.subCategories?.[0]?.key as any) || editingProduct.subCategory,
                        });
                      } else {
                        setEditingProduct({
                          ...editingProduct,
                          category: '',
                          mainCategory: '' as any,
                          categoryId: '',
                          category_id: '',
                        });
                      }
                    }}
                    className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 shadow-2xs"
                  >
                    <option value="" disabled>
                      {language === 'en' ? '-- Select Store Category (Required) --' : '-- Pilih Kategori Kedai (Wajib) --'}
                    </option>
                    {activeCategoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {language === 'en' ? cat.nameEn : cat.nameMs || cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-product-subcategory-selector" className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'en' ? 'Subcategory' : 'Sub-kategori'}
                  </label>
                  <select
                    id="edit-product-subcategory-selector"
                    value={editingProduct.subCategory || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subCategory: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 shadow-2xs"
                  >
                    {(() => {
                      const currentCatId = getProductCategoryId(editingProduct);
                      const currentCat = activeCategoriesList.find((c) => c.id === currentCatId);
                      if (currentCat?.subCategories && currentCat.subCategories.length > 0) {
                        return currentCat.subCategories.map((sub) => (
                          <option key={sub.id} value={sub.key || sub.slug || sub.id}>
                            {language === 'en' ? sub.nameEn : sub.nameMs || sub.nameEn}
                          </option>
                        ));
                      }
                      return (
                        <option value={editingProduct.subCategory || 'general'}>
                          {editingProduct.subCategory || (language === 'en' ? 'Standard / General' : 'Biasa / Am')}
                        </option>
                      );
                    })()}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Price (MYR)</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Original Price (Strike)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={editingProduct.stockCount}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Packaging / Unit (e.g. 1kg, Tray of 30)</label>
                  <input
                    type="text"
                    value={editingProduct.amountEn}
                    onChange={(e) => setEditingProduct({ ...editingProduct, amountEn: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Promo Badge Tag (e.g. Best Seller)</label>
                  <input
                    type="text"
                    value={editingProduct.badge || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value || undefined })}
                    placeholder="Hot Deal, Best Value..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <ProductImagePicker
                value={editingProduct.image}
                onChange={(imageUrl) =>
                  setEditingProduct({ ...editingProduct, image: imageUrl, image_url: imageUrl })
                }
                language={language}
                label={language === 'en' ? 'Product Photo' : 'Foto Barangan'}
              />

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.inStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                  />
                  <span>Mark as Available in Stock (Tersedia)</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!getProductCategoryId(editingProduct)}
                  title={!getProductCategoryId(editingProduct) ? (language === 'en' ? 'Category is required' : 'Kategori diperlukan') : undefined}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{language === 'en' ? 'Save Changes' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-300" />
                <h3 className="font-black text-white">
                  {language === 'en' ? 'Add New Supermarket Item' : 'Tambah Barangan Pasaraya Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Name (English) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Australian Avocado"
                    value={newProduct.nameEn}
                    onChange={(e) => setNewProduct({ ...newProduct, nameEn: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nama (Bahasa Malaysia) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Avokado Australia Segar"
                    value={newProduct.nameMs}
                    onChange={(e) => setNewProduct({ ...newProduct, nameMs: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category & Subcategory Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-product-category-selector" className="block text-xs font-bold text-gray-700 mb-1 flex items-center justify-between">
                    <span>{language === 'en' ? 'Store Category / Department *' : 'Kategori / Jabatan Kedai *'}</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                      {language === 'en' ? 'Required' : 'Wajib'}
                    </span>
                  </label>
                  <select
                    id="new-product-category-selector"
                    required
                    value={getProductCategoryId(newProduct)}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matched = activeCategoriesList.find((c) => c.id === selectedId);
                      if (matched) {
                        const catKey = matched.key || matched.slug || matched.id;
                        setNewProduct({
                          ...newProduct,
                          category: catKey,
                          mainCategory: catKey as MainCategory,
                          categoryId: matched.id,
                          category_id: matched.id,
                          subCategory: (matched.subCategories?.[0]?.key as any) || newProduct.subCategory,
                        });
                      } else {
                        setNewProduct({
                          ...newProduct,
                          category: '',
                          mainCategory: '' as any,
                          categoryId: '',
                          category_id: '',
                        });
                      }
                    }}
                    className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 shadow-2xs"
                  >
                    <option value="" disabled>
                      {language === 'en' ? '-- Select Store Category (Required) --' : '-- Pilih Kategori Kedai (Wajib) --'}
                    </option>
                    {activeCategoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {language === 'en' ? cat.nameEn : cat.nameMs || cat.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="new-product-subcategory-selector" className="block text-xs font-bold text-gray-700 mb-1">
                    {language === 'en' ? 'Subcategory' : 'Sub-kategori'}
                  </label>
                  <select
                    id="new-product-subcategory-selector"
                    value={newProduct.subCategory || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 shadow-2xs"
                  >
                    {(() => {
                      const currentCatId = getProductCategoryId(newProduct);
                      const currentCat = activeCategoriesList.find((c) => c.id === currentCatId);
                      if (currentCat?.subCategories && currentCat.subCategories.length > 0) {
                        return currentCat.subCategories.map((sub) => (
                          <option key={sub.id} value={sub.key || sub.slug || sub.id}>
                            {language === 'en' ? sub.nameEn : sub.nameMs || sub.nameEn}
                          </option>
                        ));
                      }
                      return (
                        <option value={newProduct.subCategory || 'general'}>
                          {newProduct.subCategory || (language === 'en' ? 'Standard / General' : 'Biasa / Am')}
                        </option>
                      );
                    })()}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (MYR) *</label>
                  <input
                    type="number"
                    step="0.05"
                    required
                    placeholder="8.90"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Original Price (Strike)</label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="9.90"
                    value={newProduct.originalPrice || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Initial Stock Count</label>
                  <input
                    type="number"
                    value={newProduct.stockCount}
                    onChange={(e) => setNewProduct({ ...newProduct, stockCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Packaging (e.g. 500g, Pack of 2)</label>
                  <input
                    type="text"
                    value={newProduct.amountEn}
                    onChange={(e) => setNewProduct({ ...newProduct, amountEn: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <ProductImagePicker
                value={newProduct.image}
                onChange={(imageUrl) =>
                  setNewProduct({ ...newProduct, image: imageUrl, image_url: imageUrl })
                }
                language={language}
                label={language === 'en' ? 'Product Photo' : 'Foto Barangan'}
              />

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!getProductCategoryId(newProduct)}
                  title={!getProductCategoryId(newProduct) ? (language === 'en' ? 'Category is required' : 'Kategori diperlukan') : undefined}
                  className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'en' ? 'Add to Supermarket Catalog' : 'Tambah ke Katalog Pasaraya'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY & SUB-CATEGORY ARCHITECTURE MANAGER MODAL */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-gray-900 text-base">
                  {language === 'en' ? 'Category & Sub-Category Hierarchy Manager' : 'Pengurus Hierarki Kategori & Sub-Kategori'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Add New Master Category */}
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4">
                <h4 className="text-xs font-black uppercase text-emerald-900 tracking-wider mb-2">
                  {language === 'en' ? '+ Create New Department / Category' : '+ Cipta Jabatan / Kategori Baru'}
                </h4>
                <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Slug (e.g. frozen_food)"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Name (English)"
                    value={newCatNameEn}
                    onChange={(e) => setNewCatNameEn(e.target.value)}
                    className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Name (Malay)"
                      value={newCatNameMs}
                      onChange={(e) => setNewCatNameMs(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl flex-1"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shrink-0 hover:bg-emerald-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Categories List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Active Departments ({categories.length})
                </h4>

                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${cat.color}`} />
                          <span className="font-bold text-sm text-gray-900">{cat.nameEn}</span>
                          <span className="text-xs text-gray-500 font-medium">({cat.nameMs})</span>
                          <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            {cat.slug}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryStatus(cat.id)}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                              cat.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-500 line-through'
                            }`}
                          >
                            {cat.isActive ? 'Active' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      {/* Sub-categories */}
                      <div className="pl-5 border-l-2 border-emerald-200 space-y-2">
                        <span className="text-[11px] font-bold text-gray-400">Sub-categories:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.subCategories.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">No sub-categories yet</span>
                          ) : (
                            cat.subCategories.map((sub) => (
                              <span
                                key={sub.id}
                                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1.5"
                              >
                                <span>{sub.nameEn}</span>
                                <span className="text-gray-400 text-[10px]">({sub.slug})</span>
                              </span>
                            ))
                          )}
                        </div>

                        {/* Quick add sub-category inline */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Add sub-category (e.g. Frozen Berries)"
                            value={selectedParentCatId === cat.id ? newSubCatNameEn : ''}
                            onFocus={() => setSelectedParentCatId(cat.id)}
                            onChange={(e) => {
                              setSelectedParentCatId(cat.id);
                              setNewSubCatNameEn(e.target.value);
                            }}
                            className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg w-52 bg-gray-50 focus:bg-white"
                          />
                          {selectedParentCatId === cat.id && (
                            <button
                              type="button"
                              onClick={() => handleAddSubCategory(cat.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                            >
                              + Add Sub
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH & EXPIRY EDIT MODAL */}
      {batchEditProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-gray-900 text-sm">
                  Edit Batch & Expiry: {batchEditProduct.nameEn}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBatchEditProduct(null)}
                className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Batch Code / Lot Number</label>
                <input
                  type="text"
                  required
                  value={batchEditProduct.batchNumber || batchEditProduct.batch_number || ''}
                  onChange={(e) =>
                    setBatchEditProduct({
                      ...batchEditProduct,
                      batchNumber: e.target.value,
                      batch_number: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Manufacturing Date</label>
                  <input
                    type="date"
                    value={batchEditProduct.manufacturingDate || batchEditProduct.manufacturing_date || ''}
                    onChange={(e) =>
                      setBatchEditProduct({
                        ...batchEditProduct,
                        manufacturingDate: e.target.value,
                        manufacturing_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={batchEditProduct.expiryDate || batchEditProduct.expiry_date || ''}
                    onChange={(e) =>
                      setBatchEditProduct({
                        ...batchEditProduct,
                        expiryDate: e.target.value,
                        expiry_date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cost Price (MYR)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={batchEditProduct.costPrice || batchEditProduct.cost_price || 0}
                    onChange={(e) =>
                      setBatchEditProduct({
                        ...batchEditProduct,
                        costPrice: parseFloat(e.target.value) || 0,
                        cost_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Low-Stock Alert Level</label>
                  <input
                    type="number"
                    value={batchEditProduct.lowStockThreshold || batchEditProduct.low_stock_threshold || 12}
                    onChange={(e) =>
                      setBatchEditProduct({
                        ...batchEditProduct,
                        lowStockThreshold: parseInt(e.target.value) || 12,
                        low_stock_threshold: parseInt(e.target.value) || 12,
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBatchEditProduct(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Save Batch Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
