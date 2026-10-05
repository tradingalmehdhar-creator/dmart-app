import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Landmark,
  Percent,
  Package,
  DollarSign,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  MoreVertical,
  Pencil,
  ArrowLeftRight,
  Trash2,
  Archive,
  Power,
  FileSpreadsheet,
  X,
  Calendar,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import { MerchantPartner, Language, PartnerLedgerEntry, Product } from '../../types';
import { INITIAL_MERCHANT_PARTNERS, INITIAL_PARTNER_LEDGER_ENTRIES } from '../../data/adminInitialData';
import {
  saveSupplierToFirestore,
  deleteSupplierFromFirestore,
  fetchSuppliersFromFirestore,
} from '../../firebase_config';

interface AdminMerchantsTabProps {
  language: Language;
  partners?: MerchantPartner[];
  onUpdatePartners?: (partners: MerchantPartner[]) => void;
  partnerLedger?: PartnerLedgerEntry[];
  products?: Product[];
}

export const AdminMerchantsTab: React.FC<AdminMerchantsTabProps> = ({
  language,
  partners: propPartners,
  onUpdatePartners,
  partnerLedger = INITIAL_PARTNER_LEDGER_ENTRIES,
  products = [],
}) => {
  const [localPartners, setLocalPartners] = useState<MerchantPartner[]>(() => {
    try {
      const saved = localStorage.getItem('dmart_suppliers') || localStorage.getItem('dmart_merchant_partners');
      return saved ? JSON.parse(saved) : INITIAL_MERCHANT_PARTNERS;
    } catch {
      return INITIAL_MERCHANT_PARTNERS;
    }
  });

  const partners = propPartners || localPartners;

  const setPartners = (newPartners: MerchantPartner[]) => {
    try {
      localStorage.setItem('dmart_suppliers', JSON.stringify(newPartners));
      localStorage.setItem('dmart_merchant_partners', JSON.stringify(newPartners));
    } catch {}

    // Direct Firestore sync
    newPartners.forEach((p) => {
      saveSupplierToFirestore(p);
    });

    if (onUpdatePartners) {
      onUpdatePartners(newPartners);
    } else {
      setLocalPartners(newPartners);
    }
  };

  // Sync with Firestore collection at launch
  useEffect(() => {
    fetchSuppliersFromFirestore().then((remote) => {
      if (remote && remote.length > 0) {
        setLocalPartners(remote);
        if (onUpdatePartners) onUpdatePartners(remote);
      } else {
        INITIAL_MERCHANT_PARTNERS.forEach((p) => saveSupplierToFirestore(p));
      }
    });
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'farm_supplier' | 'butchery' | 'wholesale_grocer' | 'bakery' | 'fmcg_distributor'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');

  // Modals & Active Controls State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [editingPartner, setEditingPartner] = useState<MerchantPartner | null>(null);
  const [replacingPartner, setReplacingPartner] = useState<MerchantPartner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<MerchantPartner | null>(null);
  const [selectedLedgerPartner, setSelectedLedgerPartner] = useState<MerchantPartner | null>(null);
  const [catalogPartner, setCatalogPartner] = useState<MerchantPartner | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Partner Form State
  const [newPartner, setNewPartner] = useState({
    code: '',
    name: '',
    businessType: 'farm_supplier' as MerchantPartner['businessType'],
    contactPerson: '',
    phone: '',
    email: '',
    commissionRate: 10,
    payoutTerms: 'weekly' as MerchantPartner['payoutTerms'],
    bankName: 'Maybank',
    accountNumber: '',
  });

  // Replacement Form State
  const [replacementForm, setReplacementForm] = useState({
    name: '',
    code: '',
    businessType: 'farm_supplier' as MerchantPartner['businessType'],
    contactPerson: '',
    phone: '',
    email: '',
    bankName: 'Maybank',
    accountNumber: '',
    commissionRate: 10,
    joinedDate: new Date().toISOString().split('T')[0],
    carryOverSettlement: true,
    customSettlementDue: 0,
    reason: 'Concessionaire contract renewal & direct supplier changeover',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleGlobalClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Quick Inline Status Toggle
  const handleToggleStatus = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = partners.find((p) => p.id === id);
    if (!target) return;

    const nextStatus: MerchantPartner['status'] =
      target.status === 'active' ? 'inactive' : 'active';

    const updated = partners.map((p) =>
      p.id === id ? { ...p, status: nextStatus } : p
    );
    setPartners(updated);
    showToast(
      language === 'en'
        ? `${target.name} status updated to ${nextStatus.toUpperCase()}.`
        : `Status ${target.name} dikemaskini kepada ${nextStatus.toUpperCase()}.`
    );
  };

  // Add Partner Handler
  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.contactPerson || !newPartner.phone) {
      showToast(language === 'en' ? 'Please fill in required fields.' : 'Sila lengkapkan maklumat yang diperlukan.');
      return;
    }

    const created: MerchantPartner = {
      id: `mch-${Date.now()}`,
      code: newPartner.code.trim().toUpperCase() || `MERCH-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newPartner.name,
      businessType: newPartner.businessType,
      contactPerson: newPartner.contactPerson,
      phone: newPartner.phone,
      email: newPartner.email || 'partner@d-mart.my',
      commissionRate: Number(newPartner.commissionRate) || 10,
      payoutTerms: newPartner.payoutTerms,
      bankName: newPartner.bankName,
      accountNumber: newPartner.accountNumber || '1234 5678 90',
      status: 'active',
      totalSuppliedItems: 4,
      totalSettlementDue: 0,
      bannerRevenueRouted: 0,
      bannerOrdersCount: 0,
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setPartners([created, ...partners]);
    setIsAddModalOpen(false);
    showToast(`${created.name} onboarded successfully.`);
    setNewPartner({
      code: '',
      name: '',
      businessType: 'farm_supplier',
      contactPerson: '',
      phone: '',
      email: '',
      commissionRate: 10,
      payoutTerms: 'weekly',
      bankName: 'Maybank',
      accountNumber: '',
    });
  };

  // Save Edited Partner
  const handleSaveEditedPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    const updated = partners.map((p) =>
      p.id === editingPartner.id ? { ...editingPartner } : p
    );
    setPartners(updated);
    showToast(`Supplier ${editingPartner.name} updated successfully.`);
    setEditingPartner(null);
  };

  // Open Replace Partner Modal
  const openReplaceModal = (partner: MerchantPartner) => {
    setReplacingPartner(partner);
    setReplacementForm({
      name: '',
      code: `MERCH-${Math.floor(1000 + Math.random() * 9000)}`,
      businessType: partner.businessType,
      contactPerson: '',
      phone: '',
      email: '',
      bankName: 'Maybank',
      accountNumber: '',
      commissionRate: partner.commissionRate,
      joinedDate: new Date().toISOString().split('T')[0],
      carryOverSettlement: true,
      customSettlementDue: 0,
      reason: 'Concessionaire supplier transition with preserved catalog SKUs.',
    });
  };

  // Confirm Replace Partner
  const handleConfirmReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingPartner || !replacementForm.name.trim()) {
      showToast('Please enter the new supplier name.');
      return;
    }

    const effectiveSettlementDue = replacementForm.carryOverSettlement
      ? replacingPartner.totalSettlementDue
      : Number(replacementForm.customSettlementDue) || 0;

    const replacedRecord: MerchantPartner = {
      id: `mch-${Date.now()}`,
      code: replacementForm.code.trim().toUpperCase() || `MERCH-${Math.floor(1000 + Math.random() * 9000)}`,
      name: replacementForm.name.trim(),
      businessType: replacementForm.businessType,
      contactPerson: replacementForm.contactPerson || 'Store Concessionaire',
      phone: replacementForm.phone || '012-0000000',
      email: replacementForm.email || 'supplier@d-mart.my',
      commissionRate: Number(replacementForm.commissionRate) || replacingPartner.commissionRate,
      payoutTerms: replacingPartner.payoutTerms,
      bankName: replacementForm.bankName,
      accountNumber: replacementForm.accountNumber || '1234 5678 90',
      status: 'active',
      totalSuppliedItems: replacingPartner.totalSuppliedItems,
      totalSettlementDue: effectiveSettlementDue,
      joinedDate: replacementForm.joinedDate,
      bannerRevenueRouted: replacingPartner.bannerRevenueRouted,
      bannerOrdersCount: replacingPartner.bannerOrdersCount,
      replacedPartnerId: replacingPartner.id,
      replacedPartnerName: replacingPartner.name,
      replacementNotes: replacementForm.reason,
    };

    // Replace the specific partner in place
    const updated = partners.map((p) =>
      p.id === replacingPartner.id ? replacedRecord : p
    );
    setPartners(updated);
    showToast(`${replacingPartner.name} replaced by ${replacedRecord.name}.`);
    setReplacingPartner(null);
  };

  // Archive Partner
  const handleArchivePartner = () => {
    if (!deletingPartner) return;
    const updated = partners.map((p) =>
      p.id === deletingPartner.id
        ? { ...p, status: 'archived' as const, archivedAt: new Date().toISOString() }
        : p
    );
    setPartners(updated);
    showToast(`${deletingPartner.name} archived.`);
    setDeletingPartner(null);
  };

  // Permanently Delete Partner
  const handleDeletePartnerPermanently = () => {
    if (!deletingPartner) return;
    deleteSupplierFromFirestore(deletingPartner.id);
    const updated = partners.filter((p) => p.id !== deletingPartner.id);
    setPartners(updated);
    showToast(`${deletingPartner.name} permanently removed.`);
    setDeletingPartner(null);
  };

  // Filter logic
  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' || p.businessType === selectedCategoryFilter;

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? p.status === 'active'
        : statusFilter === 'inactive'
        ? p.status === 'inactive' || p.status === 'contract_pending'
        : p.status === 'archived';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalSKUs = partners.reduce((acc, p) => acc + p.totalSuppliedItems, 0);
  const totalSettlement = partners.reduce((acc, p) => acc + p.totalSettlementDue, 0);
  const activeCount = partners.filter((p) => p.status === 'active').length;

  // Catalog item lookup for the selected catalog partner
  const getCatalogItems = () => {
    if (!catalogPartner) return [];
    
    // Map businessType to category keywords
    const categoryKeywords: Record<string, string[]> = {
      farm_supplier: ['fresh_products', 'vegetables', 'fruits', 'organic', 'farm', 'sayur', 'buah'],
      butchery: ['meats', 'poultry', 'beef_lamb', 'seafood', 'halal', 'daging', 'ayam', 'ikan'],
      wholesale_grocer: ['daily_groceries', 'rice_oil', 'canned_foods', 'dairy_eggs', 'beras', 'minyak'],
      bakery: ['snacks_and_drinks', 'snacks', 'bread', 'roti', 'cake', 'pastry'],
      fmcg_distributor: ['cleaning_products', 'daily_groceries', 'pet_foods', 'household'],
    };

    const keywords = categoryKeywords[catalogPartner.businessType] || [];

    // Filter products from available store inventory
    const matched = products.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const subCat = (p.sub_category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const nameMs = (p.name_ms || '').toLowerCase();

      return (
        keywords.some(
          (k) =>
            cat.includes(k) ||
            subCat.includes(k) ||
            name.includes(k) ||
            nameMs.includes(k)
        )
      );
    });

    // If query in catalog modal
    if (!catalogSearch) {
      return matched.length > 0 ? matched : products.slice(0, 6);
    }

    const q = catalogSearch.toLowerCase();
    return matched.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.name_ms && item.name_ms.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.includes(q))
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'en' ? 'Active Partners & Suppliers' : 'Rakan Niaga & Pembekal'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{activeCount} / {partners.length}</p>
          <p className="text-xs text-emerald-700 font-semibold mt-2">100% Halal & SSM verified</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'en' ? 'Supplied Product SKUs' : 'SKU Barangan Dibekal'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{totalSKUs} SKUs</p>
          <p className="text-xs text-blue-700 font-semibold mt-2">Managed in central catalog</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'en' ? 'Outstanding Settlements' : 'Penyelesaian Belum Bayar'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            RM {totalSettlement.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-amber-700 font-semibold mt-2">Weekly & Net-15 scheduled payouts</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'en' ? 'Avg. Take Rate / Cut' : 'Kadar Komisen Purata'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {partners.length > 0 ? (partners.reduce((sum, p) => sum + p.commissionRate, 0) / partners.length).toFixed(1) : '10.0'}%
          </p>
          <p className="text-xs text-purple-700 font-semibold mt-2">D-mart platform margin</p>
        </div>
      </div>

      {/* Control Bar: Search, Category Filter, Status Filter, and Onboard Button */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                language === 'en'
                  ? 'Search by partner name, ID, contact, phone...'
                  : 'Cari mengikut nama, ID, orang dihubungi, telefon...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 focus:bg-white transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {(
              [
                { id: 'all', label: 'All Categories' },
                { id: 'farm_supplier', label: 'Fresh Agro' },
                { id: 'butchery', label: 'Halal Butchery' },
                { id: 'wholesale_grocer', label: 'Wholesale' },
                { id: 'bakery', label: 'Bakery' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategoryFilter === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Filter Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200 text-xs shrink-0">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'inactive', label: 'Inactive' },
                { id: 'archived', label: 'Archived' },
              ] as const
            ).map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'en' ? 'Onboard New Partner' : 'Daftar Rakan Niaga'}</span>
        </button>
      </div>

      {/* Partner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPartners.map((partner) => {
          const isActive = partner.status === 'active';
          const isArchived = partner.status === 'archived';

          return (
            <div
              key={partner.id}
              className={`bg-white rounded-2xl border transition-all flex flex-col justify-between space-y-4 p-5 relative ${
                isArchived
                  ? 'border-dashed border-gray-300 opacity-75 hover:opacity-100'
                  : isActive
                  ? 'border-gray-200 shadow-xs hover:border-emerald-400 hover:shadow-md'
                  : 'border-gray-200 shadow-xs bg-gray-50/40'
              }`}
            >
              <div className="space-y-3">
                {/* Header with Code, Interactive Status Toggle, and 3-dots Menu */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : isArchived
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      {partner.code && (
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 border border-gray-200">
                          {partner.code}
                        </span>
                      )}
                      {partner.replacedPartnerName && (
                        <span className="block text-[10px] text-blue-600 font-medium mt-0.5">
                          Replaced: {partner.replacedPartnerName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Toggle & 3-dots Menu */}
                  <div className="flex items-center gap-1.5">
                    {/* Clickable Status Badge */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(partner.id, e)}
                      title="Click to toggle status (Active / Inactive)"
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer hover:shadow-xs active:scale-95 ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                          : partner.status === 'under_review'
                          ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                          : isArchived
                          ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive
                            ? 'bg-emerald-600'
                            : partner.status === 'under_review'
                            ? 'bg-amber-600'
                            : isArchived
                            ? 'bg-purple-600'
                            : 'bg-gray-500'
                        }`}
                      />
                      <span>{partner.status.replace(/_/g, ' ')}</span>
                    </button>

                    {/* 3-Dots Context Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === partner.id ? null : partner.id);
                        }}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
                        title="Partner options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Popover */}
                      {openDropdownId === partner.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-9 z-30 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 text-xs divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100"
                        >
                          <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Partner Controls
                          </div>
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPartner({ ...partner });
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <Pencil className="w-3.5 h-3.5 text-gray-400" />
                              <span>Edit Details</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                openReplaceModal(partner);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-blue-700 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-500" />
                              <span>Replace Partner</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                handleToggleStatus(partner.id, e);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <Power className="w-3.5 h-3.5 text-amber-500" />
                              <span>Mark as {isActive ? 'Inactive' : 'Active'}</span>
                            </button>
                          </div>

                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedLedgerPartner(partner);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                              <span>View Ledger</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCatalogPartner(partner);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-gray-50 hover:text-emerald-700 flex items-center gap-2 cursor-pointer font-medium"
                            >
                              <Package className="w-3.5 h-3.5 text-indigo-500" />
                              <span>View Catalog</span>
                            </button>
                          </div>

                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingPartner(partner);
                                setOpenDropdownId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Delete / Archive</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Partner Name & Subtitle */}
                <div>
                  <h4 className="font-bold text-gray-900 text-sm leading-snug">{partner.name}</h4>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {partner.businessType.replace(/_/g, ' ')} • Joined {partner.joinedDate}
                  </p>
                </div>

                {/* Contact & Banking Info Box */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{partner.phone} ({partner.contactPerson})</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{partner.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Landmark className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="font-mono truncate">{partner.bankName} - {partner.accountNumber}</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                    <span className="text-[10px] text-gray-500 font-bold block">Commission</span>
                    <span className="font-bold text-emerald-800 font-mono">{partner.commissionRate}%</span>
                  </div>
                  <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-100">
                    <span className="text-[10px] text-gray-500 font-bold block">Settlement Due</span>
                    <span className="font-bold text-amber-900 font-mono">RM {partner.totalSettlementDue.toFixed(2)}</span>
                  </div>
                </div>

                {/* Banner Sales Metric */}
                {(partner.bannerRevenueRouted !== undefined && partner.bannerRevenueRouted > 0) && (
                  <div className="p-2 bg-blue-50/60 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-blue-700 font-bold block">Storefront Banner Sales</span>
                      <span className="font-bold font-mono text-blue-950">RM {partner.bannerRevenueRouted.toFixed(2)}</span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded-full border border-blue-200 font-mono">
                      {partner.bannerOrdersCount || 0} orders
                    </span>
                  </div>
                )}
              </div>

              {/* Card Footer: SKU count, Quick Shortcuts (Ledger, Catalog, Edit) */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 font-medium">
                  {partner.totalSuppliedItems} active SKUs
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedLedgerPartner(partner)}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                    <span>Ledger</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatalogPartner(partner)}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Package className="w-3 h-3 text-gray-500" />
                    <span>Catalog</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingPartner({ ...partner })}
                    className="p-1 hover:bg-gray-100 text-gray-500 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                    title="Edit Partner"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredPartners.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
            <Building2 className="w-10 h-10 text-gray-300 mx-auto" />
            <h4 className="font-bold text-gray-700 text-sm">No suppliers found</h4>
            <p className="text-xs text-gray-400">
              Try adjusting your search terms or filter selection.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. EDIT PARTNER DETAILS MODAL                                             */}
      {/* ========================================================================= */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Edit Partner / Supplier Details</h3>
                  <p className="text-xs text-gray-500">
                    {editingPartner.code || editingPartner.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPartner(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedPartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">Company / Supplier Name *</label>
                  <input
                    type="text"
                    required
                    value={editingPartner.name}
                    onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">Merchant Account Code</label>
                  <input
                    type="text"
                    value={editingPartner.code || ''}
                    onChange={(e) => setEditingPartner({ ...editingPartner, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-xl font-mono uppercase focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category / Business Type</label>
                  <select
                    value={editingPartner.businessType}
                    onChange={(e) => setEditingPartner({ ...editingPartner, businessType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="farm_supplier">Fresh Farm Produce</option>
                    <option value="butchery">Halal Poultry & Meat</option>
                    <option value="wholesale_grocer">Wholesale Grocery</option>
                    <option value="bakery">Artisanal Bakery</option>
                    <option value="fmcg_distributor">FMCG Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Join Date</label>
                  <input
                    type="date"
                    value={editingPartner.joinedDate || ''}
                    onChange={(e) => setEditingPartner({ ...editingPartner, joinedDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    value={editingPartner.contactPerson}
                    onChange={(e) => setEditingPartner({ ...editingPartner, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editingPartner.phone}
                    onChange={(e) => setEditingPartner({ ...editingPartner, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editingPartner.email}
                  onChange={(e) => setEditingPartner({ ...editingPartner, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={editingPartner.bankName}
                    onChange={(e) => setEditingPartner({ ...editingPartner, bankName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={editingPartner.accountNumber}
                    onChange={(e) => setEditingPartner({ ...editingPartner, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingPartner.commissionRate}
                    onChange={(e) => setEditingPartner({ ...editingPartner, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Settlement Due (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPartner.totalSettlementDue}
                    onChange={(e) => setEditingPartner({ ...editingPartner, totalSettlementDue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">Status</label>
                  <select
                    value={editingPartner.status}
                    onChange={(e) => setEditingPartner({ ...editingPartner, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="under_review">Under Review</option>
                    <option value="contract_pending">Contract Pending</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. REPLACE PARTNER MODAL                                                  */}
      {/* ========================================================================= */}
      {replacingPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Replace Supplier / Merchant Partner</h3>
                  <p className="text-xs text-gray-500">
                    Concessionaire Transition &amp; Record Handover
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplacingPartner(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Supplier Summary Banner */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900">Current Partner Being Replaced:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded text-amber-950 border border-amber-300">
                  {replacingPartner.code || replacingPartner.id}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{replacingPartner.name}</p>
              <div className="flex items-center justify-between text-gray-600 text-[11px] pt-1">
                <span>Active SKUs: {replacingPartner.totalSuppliedItems}</span>
                <span>Outstanding Settlement: RM {replacingPartner.totalSettlementDue.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmReplace} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">New Supplier Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cameron Valley Produce Sdn Bhd"
                    value={replacementForm.name}
                    onChange={(e) => setReplacementForm({ ...replacementForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-gray-700 mb-1">New Merchant Code</label>
                  <input
                    type="text"
                    value={replacementForm.code}
                    onChange={(e) => setReplacementForm({ ...replacementForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-xl font-mono uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category / Business Type</label>
                  <select
                    value={replacementForm.businessType}
                    onChange={(e) => setReplacementForm({ ...replacementForm, businessType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="farm_supplier">Fresh Farm Produce</option>
                    <option value="butchery">Halal Poultry & Meat</option>
                    <option value="wholesale_grocer">Wholesale Grocery</option>
                    <option value="bakery">Artisanal Bakery</option>
                    <option value="fmcg_distributor">FMCG Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    value={replacementForm.joinedDate}
                    onChange={(e) => setReplacementForm({ ...replacementForm, joinedDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="New Representative"
                    value={replacementForm.contactPerson}
                    onChange={(e) => setReplacementForm({ ...replacementForm, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="012-XXXXXXX"
                    value={replacementForm.phone}
                    onChange={(e) => setReplacementForm({ ...replacementForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={replacementForm.bankName}
                    onChange={(e) => setReplacementForm({ ...replacementForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bank Account No.</label>
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={replacementForm.accountNumber}
                    onChange={(e) => setReplacementForm({ ...replacementForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Settlement Transfer Option */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={replacementForm.carryOverSettlement}
                    onChange={(e) => setReplacementForm({ ...replacementForm, carryOverSettlement: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Carry forward outstanding settlement due (RM {replacingPartner.totalSettlementDue.toFixed(2)})</span>
                </label>

                {!replacementForm.carryOverSettlement && (
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Custom Starting Settlement Due (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={replacementForm.customSettlementDue}
                      onChange={(e) => setReplacementForm({ ...replacementForm, customSettlementDue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 border rounded-lg font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Replacement Reason / Transition Note</label>
                <textarea
                  rows={2}
                  value={replacementForm.reason}
                  onChange={(e) => setReplacementForm({ ...replacementForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for concessionaire transfer..."
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplacingPartner(null)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs transition-colors"
                >
                  Confirm Replacement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE / ARCHIVE CONFIRMATION MODAL                                    */}
      {/* ========================================================================= */}
      {deletingPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-900">Remove or Archive Partner?</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Action required for <strong className="text-gray-800">{deletingPartner.name}</strong> ({deletingPartner.code || deletingPartner.id}).
                </p>
              </div>
            </div>

            {/* Impact Details */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5 text-gray-600">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-bold text-gray-900 capitalize">{deletingPartner.businessType.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Catalog SKUs:</span>
                <span className="font-bold text-gray-900">{deletingPartner.totalSuppliedItems} items</span>
              </div>
              <div className="flex justify-between">
                <span>Outstanding Settlement:</span>
                <span className="font-bold text-amber-700 font-mono">RM {deletingPartner.totalSettlementDue.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              <strong>Archive (Recommended):</strong> Hides the supplier from operational catalog routines while maintaining full historical ledger entries.<br />
              <strong>Permanently Delete:</strong> Completely removes this card from the local registry.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleArchivePartner}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <Archive className="w-4 h-4" />
                <span>Archive Partner (Safe)</span>
              </button>

              <button
                type="button"
                onClick={handleDeletePartnerPermanently}
                className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete Card</span>
              </button>

              <button
                type="button"
                onClick={() => setDeletingPartner(null)}
                className="w-full py-2 px-4 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-xs font-bold cursor-pointer mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUPPLIER CATALOG MODAL                                                 */}
      {/* ========================================================================= */}
      {catalogPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    Supplier Catalog: {catalogPartner.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Merchant ID: <span className="font-mono font-bold text-gray-700">{catalogPartner.code || catalogPartner.id}</span> • {catalogPartner.businessType.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCatalogPartner(null);
                  setCatalogSearch('');
                }}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Catalog Info Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-500 font-bold block">Active SKUs</span>
                <span className="font-bold text-gray-900 text-sm">{catalogPartner.totalSuppliedItems} SKUs</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-bold block">Halal Verification</span>
                <span className="font-bold text-emerald-900 text-sm">JAKIM / Halal Certified</span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-800 font-bold block">Commission Split</span>
                <span className="font-bold text-blue-900 text-sm">{catalogPartner.commissionRate}% Take-rate</span>
              </div>
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-800 font-bold block">Payout Model</span>
                <span className="font-bold text-amber-900 text-sm uppercase">{catalogPartner.payoutTerms.replace(/_/g, ' ')}</span>
              </div>
            </div>

            {/* Catalog Search & Controls */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products in this supplier's catalog by name or barcode..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Products List */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-gray-700">Supplied Inventory Items:</h4>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl max-h-72 overflow-y-auto">
                {getCatalogItems().map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-11 h-11 rounded-lg object-cover border border-gray-200 shrink-0"
                        onError={(e) => {
                          // Fallback placeholder image
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">{item.name}</p>
                        {item.name_ms && (
                          <p className="text-[11px] text-gray-500 truncate">{item.name_ms}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {item.barcode || `SKU-${item.id.slice(0, 6)}`}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Halal Certified
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div>
                        <div className="font-mono font-bold text-xs text-gray-900">
                          RM {item.price.toFixed(2)}
                        </div>
                        {item.cost_price && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            Cost: RM {item.cost_price.toFixed(2)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.is_available
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.is_available ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <span className="text-[10px] text-gray-500 mt-0.5 font-mono">
                          {item.stock_count !== undefined ? `${item.stock_count} units` : '45 units'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {getCatalogItems().length === 0 && (
                  <div className="p-8 text-center text-xs text-gray-400">
                    No products matched your catalog search.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                Catalog linked to Merchant Code: <strong className="font-mono text-gray-800">{catalogPartner.code || catalogPartner.id}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCatalogPartner(null);
                  setCatalogSearch('');
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close Catalog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: ONBOARD NEW PARTNER                                             */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-base">Onboard New Merchant Partner</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Company / Farm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cameron Organic Agro Sdn Bhd"
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Merchant Account Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MERCH-8821"
                    value={newPartner.code}
                    onChange={(e) => setNewPartner({ ...newPartner, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={newPartner.businessType}
                    onChange={(e) => setNewPartner({ ...newPartner, businessType: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    <option value="farm_supplier">Fresh Farm Produce</option>
                    <option value="butchery">Halal Poultry & Meat</option>
                    <option value="wholesale_grocer">Wholesale Grocery</option>
                    <option value="bakery">Artisanal Bakery</option>
                    <option value="fmcg_distributor">FMCG Distributor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={newPartner.commissionRate}
                    onChange={(e) => setNewPartner({ ...newPartner, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmad Razali"
                    value={newPartner.contactPerson}
                    onChange={(e) => setNewPartner({ ...newPartner, contactPerson: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="012-XXXXXXX"
                    value={newPartner.phone}
                    onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="Maybank / CIMB"
                    value={newPartner.bankName}
                    onChange={(e) => setNewPartner({ ...newPartner, bankName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Bank Account No.</label>
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={newPartner.accountNumber}
                    onChange={(e) => setNewPartner({ ...newPartner, accountNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  Onboard Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. PARTNER SETTLEMENT LEDGER DETAILS MODAL                                */}
      {/* ========================================================================= */}
      {selectedLedgerPartner && (
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
                    {selectedLedgerPartner.name} ({selectedLedgerPartner.code || selectedLedgerPartner.id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLedgerPartner(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-800 font-semibold block">Banner Revenue Routed</span>
                <span className="text-base font-black text-emerald-950 font-mono">
                  RM {(selectedLedgerPartner.bannerRevenueRouted || 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  {selectedLedgerPartner.bannerOrdersCount || 0} direct orders
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[11px] text-gray-600 font-semibold block">
                  Commission Rate
                </span>
                <span className="text-base font-black text-gray-900 font-mono">
                  {selectedLedgerPartner.commissionRate}%
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Platform service cut</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] text-amber-800 font-semibold block">Total Settlement Due</span>
                <span className="text-base font-black text-amber-950 font-mono">
                  RM {selectedLedgerPartner.totalSettlementDue.toFixed(2)}
                </span>
                <span className="text-[10px] text-amber-700 block mt-0.5">Payable to {selectedLedgerPartner.bankName}</span>
              </div>
            </div>

            {/* Itemized Transactions from partnerLedger */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-gray-700">Financial Ledger Entries:</h4>
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
                    {partnerLedger
                      .filter(
                        (l) =>
                          l.merchantCode === selectedLedgerPartner.code ||
                          l.merchantCode === selectedLedgerPartner.id
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
                    {partnerLedger.filter(
                      (l) =>
                        l.merchantCode === selectedLedgerPartner.code ||
                        l.merchantCode === selectedLedgerPartner.id
                    ).length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-gray-400">
                          No direct banner transactions recorded for this merchant yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedLedgerPartner(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
