import React, { useState } from 'react';
import {
  Package,
  Bike,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  MapPin,
  Navigation,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Radio,
  BatteryCharging,
  Maximize2,
  Table as TableIcon,
  Wallet,
  DollarSign,
  Plus,
  Minus,
  RefreshCw,
  Search,
  Star,
  UserCheck,
  History,
  X,
  Send,
  Zap,
  Download,
  FileSpreadsheet,
  Filter,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { Order, Language, FleetRider, RiderWalletTransaction } from '../../types';
import { INITIAL_FLEET_RIDERS, INITIAL_WALLET_TRANSACTIONS } from '../../data/adminInitialData';
import { exportRiderWalletStatementPDF } from '../../utils/pdfGenerator';
import { exportOrdersReconciliationCSV } from '../../utils/orderCsvExport';

interface AdminDispatchTabProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  language: Language;
}

export const AdminDispatchTab: React.FC<AdminDispatchTabProps> = ({
  orders,
  onUpdateOrderStatus,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'live_fleet' | 'wallets' | 'table'>('pipeline');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fleet Riders State with local storage persistence
  const [fleetRiders, setFleetRiders] = useState<FleetRider[]>(() => {
    try {
      const stored = localStorage.getItem('dmart_fleet_riders');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load fleet riders', e);
    }
    return INITIAL_FLEET_RIDERS;
  });

  // Wallet Transactions Ledger
  const [walletTransactions, setWalletTransactions] = useState<RiderWalletTransaction[]>(() => {
    try {
      const stored = localStorage.getItem('dmart_rider_wallet_tx');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to load wallet transactions', e);
    }
    return INITIAL_WALLET_TRANSACTIONS;
  });

  // Reassignment Modal State
  const [reassignOrder, setReassignOrder] = useState<Order | null>(null);
  const [targetRiderId, setTargetRiderId] = useState<string>('');

  // Selected Rider for Map Inspector
  const [selectedRiderOnMap, setSelectedRiderOnMap] = useState<FleetRider | null>(null);

  // Wallet Action Modal State (Top-up or Deduct)
  const [walletModalRider, setWalletModalRider] = useState<FleetRider | null>(null);
  const [walletModalType, setWalletModalType] = useState<'credit' | 'deduction'>('credit');
  const [walletAmount, setWalletAmount] = useState<string>('50.00');
  const [walletNotes, setWalletNotes] = useState<string>('');
  const [walletTxRef, setWalletTxRef] = useState<string>('');

  // Rider Ledger Modal
  const [viewLedgerRider, setViewLedgerRider] = useState<FleetRider | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const saveRiders = (updated: FleetRider[]) => {
    setFleetRiders(updated);
    try {
      localStorage.setItem('dmart_fleet_riders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const saveTransactions = (updated: RiderWalletTransaction[]) => {
    setWalletTransactions(updated);
    try {
      localStorage.setItem('dmart_rider_wallet_tx', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // Execute Reassignment
  const handleConfirmReassign = () => {
    if (!reassignOrder || !targetRiderId) return;

    const chosenRider = fleetRiders.find((r) => r.id === targetRiderId);
    if (!chosenRider) return;

    const updatedRiders = fleetRiders.map((r) => {
      // If previously assigned to another rider, clear it
      if (r.currentOrderId === reassignOrder.id) {
        return {
          ...r,
          currentOrderId: undefined,
          currentOrderNumber: undefined,
          status: 'idle' as const,
        };
      }
      // Assign to the selected rider
      if (r.id === targetRiderId) {
        return {
          ...r,
          currentOrderId: reassignOrder.id,
          currentOrderNumber: reassignOrder.orderNumber,
          destination: reassignOrder.deliveryAddress?.formattedAddress || reassignOrder.deliveryAddress?.street || 'Customer Location',
          status: 'delivering' as const,
          etaMin: 15,
        };
      }
      return r;
    });

    saveRiders(updatedRiders);

    // If order was in packing/received, automatically mark out_for_delivery
    if (reassignOrder.status === 'submitted' || reassignOrder.status === 'received' || reassignOrder.status === 'packing') {
      onUpdateOrderStatus(reassignOrder.id, 'out_for_delivery');
    }

    showToast(
      language === 'en'
        ? `Order ${reassignOrder.orderNumber} successfully reassigned to ${chosenRider.name}.`
        : `Pesanan ${reassignOrder.orderNumber} berjaya diagihkan semula kepada ${chosenRider.name}.`
    );

    setReassignOrder(null);
    setTargetRiderId('');
  };

  // Execute Wallet Adjustment (Top-up or Deduct)
  const handleConfirmWalletAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletModalRider) return;

    const parsedAmt = parseFloat(walletAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast(language === 'en' ? 'Please enter a valid amount.' : 'Sila masukkan jumlah yang sah.');
      return;
    }

    const isCredit = walletModalType === 'credit';
    const delta = isCredit ? parsedAmt : -parsedAmt;
    const newBalance = Math.max(0, walletModalRider.walletBalance + delta);

    const ref = walletTxRef || `REF-${Date.now().toString().slice(-6)}`;
    const newTx: RiderWalletTransaction = {
      id: 'tx-' + Date.now(),
      riderId: walletModalRider.id,
      riderName: walletModalRider.name,
      type: isCredit ? 'credit' : 'deduction',
      amount: delta,
      notes: walletNotes || (isCredit ? 'Manual credit float top-up' : 'COD cash settlement / float deduction'),
      createdAt: new Date().toLocaleString(),
      referenceNo: ref,
    };

    const updatedRiders = fleetRiders.map((r) =>
      r.id === walletModalRider.id ? { ...r, walletBalance: newBalance } : r
    );

    saveRiders(updatedRiders);
    saveTransactions([newTx, ...walletTransactions]);

    showToast(
      language === 'en'
        ? `${isCredit ? 'Credited' : 'Deducted'} RM ${parsedAmt.toFixed(2)} for ${walletModalRider.name}. New Balance: RM ${newBalance.toFixed(2)}`
        : `${isCredit ? 'Ditambah' : 'Ditolak'} RM ${parsedAmt.toFixed(2)} untuk ${walletModalRider.name}. Baki Baru: RM ${newBalance.toFixed(2)}`
    );

    setWalletModalRider(null);
    setWalletAmount('50.00');
    setWalletNotes('');
    setWalletTxRef('');
  };

  // Group orders by pipeline stage
  const submittedOrders = orders.filter((o) => o.status === 'submitted' || o.status === 'received');
  const packingOrders = orders.filter((o) => o.status === 'packing');
  const outOrders = orders.filter((o) => o.status === 'out_for_delivery');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered' || o.status === 'completed');

  // Stats for wallets
  const totalFleetBalance = fleetRiders.reduce((acc, r) => acc + r.walletBalance, 0);
  const totalCodHeld = fleetRiders.reduce((acc, r) => acc + (r.codCollected || 0), 0);
  const activeRidersCount = fleetRiders.filter((r) => r.status !== 'offline').length;

  // Filter States for Orders Manifest & Financial Reconciliation
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('all');
  const [orderDateFilter, setOrderDateFilter] = useState<'all' | 'today' | 'yesterday' | '7days' | '30days'>('all');
  const [orderSortBy, setOrderSortBy] = useState<'newest' | 'oldest' | 'highest_value' | 'lowest_value'>('newest');

  // Filter Matching Helper
  const isDateMatching = (createdAt: string | undefined, filter: typeof orderDateFilter) => {
    if (filter === 'all' || !createdAt) return true;
    try {
      const orderDate = new Date(createdAt);
      if (isNaN(orderDate.getTime())) return true;
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (filter === 'today') {
        return orderDate >= startOfToday;
      }
      if (filter === 'yesterday') {
        return orderDate >= startOfYesterday && orderDate < startOfToday;
      }
      if (filter === '7days') {
        return orderDate >= sevenDaysAgo;
      }
      if (filter === '30days') {
        return orderDate >= thirtyDaysAgo;
      }
    } catch {
      return true;
    }
    return true;
  };

  const filteredOrders = orders.filter((order) => {
    // Search filter
    if (orderSearchTerm.trim()) {
      const term = orderSearchTerm.toLowerCase().trim();
      const matchOrderNum = (order.orderNumber || '').toLowerCase().includes(term);
      const matchCustomer = (order.deliveryAddress?.recipientName || '').toLowerCase().includes(term);
      const matchPhone = (order.deliveryAddress?.phone || '').toLowerCase().includes(term);
      const matchStreet = (order.deliveryAddress?.street || '').toLowerCase().includes(term);
      const matchCity = (order.deliveryAddress?.city || '').toLowerCase().includes(term);
      const matchItems = order.items.some((item) =>
        (item.product?.nameEn || item.product?.nameMs || '').toLowerCase().includes(term)
      );
      if (!matchOrderNum && !matchCustomer && !matchPhone && !matchStreet && !matchCity && !matchItems) {
        return false;
      }
    }

    // Status filter
    if (orderStatusFilter !== 'all') {
      const s = (order.status || '').toLowerCase();
      if (orderStatusFilter === 'delivered' && (s !== 'delivered' && s !== 'completed')) return false;
      if (orderStatusFilter === 'out_for_delivery' && s !== 'out_for_delivery') return false;
      if (orderStatusFilter === 'packing' && (s !== 'packing' && s !== 'preparing')) return false;
      if (orderStatusFilter === 'submitted' && (s !== 'submitted' && s !== 'received')) return false;
      if (orderStatusFilter === 'cancelled' && s !== 'cancelled') return false;
    }

    // Payment method filter
    if (orderPaymentFilter !== 'all') {
      if ((order.paymentMethod || '').toUpperCase() !== orderPaymentFilter.toUpperCase()) {
        return false;
      }
    }

    // Date filter
    if (!isDateMatching(order.createdAt, orderDateFilter)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (orderSortBy === 'highest_value') {
      return (b.total || 0) - (a.total || 0);
    }
    if (orderSortBy === 'lowest_value') {
      return (a.total || 0) - (b.total || 0);
    }
    if (orderSortBy === 'oldest') {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    // newest (default)
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const filteredTotalAmount = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const isFilterActive =
    orderSearchTerm.trim() !== '' ||
    orderStatusFilter !== 'all' ||
    orderPaymentFilter !== 'all' ||
    orderDateFilter !== 'all';

  const handleResetFilters = () => {
    setOrderSearchTerm('');
    setOrderStatusFilter('all');
    setOrderPaymentFilter('all');
    setOrderDateFilter('all');
    setOrderSortBy('newest');
  };

  const handleExportFilteredOrders = () => {
    if (filteredOrders.length === 0) {
      showToast(
        language === 'en'
          ? 'No filtered orders available to export.'
          : 'Tiada pesanan ditapis untuk dimuat turun.'
      );
      return;
    }

    const result = exportOrdersReconciliationCSV(filteredOrders, {
      statusFilter: orderStatusFilter,
      paymentFilter: orderPaymentFilter,
      dateFilter: orderDateFilter,
      searchQuery: orderSearchTerm,
    });

    showToast(
      language === 'en'
        ? `Successfully exported ${result.count} filtered orders (RM ${result.totalAmount.toFixed(2)}) to CSV for financial reconciliation.`
        : `Berjaya memuat turun ${result.count} pesanan (RM ${result.totalAmount.toFixed(2)}) ke CSV untuk penyelarasan kewangan.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Tab Switcher: Pipeline Kanban vs Live Fleet GPS Hub vs Rider Wallets vs Orders Data Table */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
          {/* Tab 1: Pipeline Kanban */}
          <button
            type="button"
            onClick={() => setActiveTab('pipeline')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pipeline'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Pipeline Kanban' : 'Saluran Pesanan'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full">
              {orders.length}
            </span>
          </button>

          {/* Tab 2: Live Fleet GPS Hub */}
          <button
            type="button"
            onClick={() => setActiveTab('live_fleet')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'live_fleet'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{language === 'en' ? 'Live Map Hub' : 'Pusat Peta Langsung'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full">
              {fleetRiders.length}
            </span>
          </button>

          {/* Tab 3: Rider Wallets & Earnings */}
          <button
            type="button"
            onClick={() => setActiveTab('wallets')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'wallets'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Rider Wallets & Float' : 'Dompet & Baki Pemandu'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full font-mono">
              RM {totalFleetBalance.toFixed(0)}
            </span>
          </button>

          {/* Tab 4: All Orders Table */}
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'table'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TableIcon className="w-4 h-4 text-emerald-600" />
            <span>{language === 'en' ? 'Orders Table' : 'Jadual Pesanan'}</span>
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded-full">
              {orders.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-500 font-medium px-2">
          <button
            type="button"
            id="quick-export-orders-csv-btn"
            data-testid="quick-export-orders-csv-btn"
            onClick={handleExportFilteredOrders}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title={language === 'en' ? 'Export currently filtered orders to CSV for reconciliation' : 'Muat turun pesanan ditapis ke CSV untuk penyelarasan kewangan'}
          >
            <Download className="w-3.5 h-3.5 text-emerald-100" />
            <span className="hidden sm:inline">{language === 'en' ? 'Export Orders CSV' : 'Eksport CSV'}</span>
            <span className="sm:hidden font-mono text-[11px]">CSV</span>
          </button>
          <span className="hidden sm:inline">•</span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="font-bold text-emerald-700">{activeRidersCount} Active Riders</span>
          </span>
          <span className="hidden lg:inline">•</span>
          <span className="hidden lg:inline">Bangsar South Central Hub</span>
        </div>
      </div>

      {/* VIEW 1: PIPELINE KANBAN */}
      {activeTab === 'pipeline' && (
        <div className="space-y-3">
          <div className="md:hidden flex items-center justify-between px-3 py-1.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-950 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="animate-pulse">↔️</span>
              <span>{language === 'en' ? 'Swipe sideways to view all pipeline stages' : 'Leret ke sisi untuk melihat peringkat saluran'}</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">4 stages</span>
          </div>

          <div
            className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto no-scrollbar pb-2 items-start overscroll-x-contain"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Column 1: Received / Submitted */}
            <div className="min-w-[280px] md:min-w-0 flex-1 shrink-0 md:shrink bg-gray-50/80 rounded-2xl border border-gray-200/90 p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Received</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-black rounded-full">
                  {submittedOrders.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {submittedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-400 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900">{order.orderNumber}</span>
                      <span className="text-[11px] font-bold text-emerald-700">RM {order.total.toFixed(2)}</span>
                    </div>

                    <p className="text-xs text-gray-600 font-medium truncate">
                      {order.deliveryAddress?.recipientName} • {order.items.length} items
                    </p>

                    <div className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{order.deliveryAddress?.city || 'Kuala Lumpur'}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'packing')}
                        className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span>Pack SKU</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReassignOrder(order);
                          setTargetRiderId(fleetRiders[0]?.id || '');
                        }}
                        className="px-2 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Reassign Rider"
                      >
                        <Bike className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {submittedOrders.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 italic">No orders in received queue</p>
                )}
              </div>
            </div>

            {/* Column 2: Packing / Picking */}
            <div className="min-w-[280px] md:min-w-0 flex-1 shrink-0 md:shrink bg-gray-50/80 rounded-2xl border border-gray-200/90 p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span>Packing & Bagging</span>
                </div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-black rounded-full">
                  {packingOrders.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {packingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs hover:border-amber-400 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-gray-900">{order.orderNumber}</span>
                      <span className="text-[11px] font-bold text-emerald-700">RM {order.total.toFixed(2)}</span>
                    </div>

                    <p className="text-xs text-gray-600 font-medium truncate">
                      {order.deliveryAddress?.recipientName} • {order.items.length} items
                    </p>

                    <div className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{order.deliveryAddress?.street}</span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(order.id, 'out_for_delivery')}
                        className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Bike className="w-3.5 h-3.5 text-amber-600" />
                        <span>Dispatch Rider</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setReassignOrder(order);
                          setTargetRiderId(fleetRiders[0]?.id || '');
                        }}
                        className="px-2 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        title="Reassign Rider"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {packingOrders.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 italic">No orders currently packing</p>
                )}
              </div>
            </div>

            {/* Column 3: Out for Delivery */}
            <div className="min-w-[280px] md:min-w-0 flex-1 shrink-0 md:shrink bg-purple-50/50 rounded-2xl border border-purple-200/90 p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 uppercase tracking-wider">
                  <Bike className="w-4 h-4 text-purple-600 animate-bounce" />
                  <span>Out for Delivery</span>
                </div>
                <span className="px-2 py-0.5 bg-purple-200 text-purple-900 text-xs font-black rounded-full animate-pulse">
                  {outOrders.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {outOrders.map((order) => {
                  const assignedRider = fleetRiders.find(
                    (r) => r.currentOrderId === order.id || r.currentOrderNumber === order.orderNumber
                  );

                  return (
                    <div
                      key={order.id}
                      className="bg-white p-3 rounded-xl border border-purple-200 shadow-xs hover:border-purple-400 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-900">{order.orderNumber}</span>
                        <span className="text-[11px] font-bold text-emerald-700">RM {order.total.toFixed(2)}</span>
                      </div>

                      <p className="text-xs text-gray-600 font-medium truncate">
                        {order.deliveryAddress?.recipientName} • {order.items.length} items
                      </p>

                      {assignedRider ? (
                        <div className="p-1.5 bg-purple-50 rounded-lg text-[11px] text-purple-900 flex items-center justify-between font-bold border border-purple-200">
                          <span className="truncate">🛵 {assignedRider.name.split(' ')[0]} ({assignedRider.plate})</span>
                          <span className="text-[10px] text-purple-700 font-mono shrink-0">{assignedRider.speed}</span>
                        </div>
                      ) : (
                        <div className="p-1.5 bg-amber-50 rounded-lg text-[11px] text-amber-900 font-bold border border-amber-200 flex items-center justify-between">
                          <span>🛵 Central Pool Courier</span>
                          <span className="text-[10px] text-amber-700">Auto-pool</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReassignOrder(order);
                            setTargetRiderId(assignedRider?.id || fleetRiders[0]?.id || '');
                          }}
                          className="px-2 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          title="Reassign to another rider"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {outOrders.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 italic">No active deliveries on the road</p>
                )}
              </div>
            </div>

            {/* Column 4: Delivered / Completed */}
            <div className="min-w-[280px] md:min-w-0 flex-1 shrink-0 md:shrink bg-emerald-50/50 rounded-2xl border border-emerald-200/90 p-3 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Delivered</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full">
                  {deliveredOrders.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {deliveredOrders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs space-y-1.5 opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">{order.orderNumber}</span>
                      <span className="text-[11px] font-bold text-emerald-700">RM {order.total.toFixed(2)}</span>
                    </div>

                    <p className="text-xs text-gray-500 truncate">
                      {order.deliveryAddress?.recipientName} • {order.items.length} items
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                      <span>{order.paymentMethod}</span>
                      <span className="text-emerald-700 font-bold">Successfully Delivered</span>
                    </div>
                  </div>
                ))}

                {deliveredOrders.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 italic">No completed orders yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INTERACTIVE LIVE MAP HUB */}
      {activeTab === 'live_fleet' && (
        <div className="space-y-4">
          <div className="bg-gray-950 rounded-2xl overflow-hidden border border-gray-800 shadow-xl text-white">
            {/* Map Header Controls */}
            <div className="p-4 bg-gray-900 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Klang Valley Metro Fleet Dispatch Hub</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                      LIVE GPS TELEMETRY
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Central Distribution Point: 3.1116° N, 101.6669° E (Mid Valley / Bangsar South Hub)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-700">
                  Active Ongoing Deliveries: <strong className="text-amber-400">{outOrders.length}</strong>
                </span>
              </div>
            </div>

            {/* Interactive Simulated Map Canvas */}
            <div className="relative w-full h-96 bg-slate-950 overflow-hidden flex items-center justify-center p-6 select-none">
              {/* SVG Map Grid & Connecting Pathways */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#059669" strokeWidth="0.5" strokeOpacity="0.2" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Hub Radar Rings */}
                <circle cx="50%" cy="50%" r="90" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" className="animate-spin origin-center" style={{ animationDuration: '30s' }} />
                <circle cx="50%" cy="50%" r="160" fill="none" stroke="#10b981" strokeWidth="0.5" strokeOpacity="0.3" />

                {/* Transit paths connecting to riders */}
                <line x1="50%" y1="50%" x2="68%" y2="28%" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" />
                <line x1="50%" y1="50%" x2="34%" y2="65%" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4" />
                <line x1="50%" y1="50%" x2="24%" y2="40%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="6 4" />
              </svg>

              {/* Central D-mart Hub Node */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-2xl border-2 border-white ring-4 ring-emerald-500/40">
                  <Package className="w-7 h-7" />
                </div>
                <div className="bg-black/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-black text-emerald-300 mt-2 border border-emerald-500/50 shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>D-mart Central Hub</span>
                </div>
              </div>

              {/* Rider 1 Pin (Haziq) */}
              <div
                onClick={() => setSelectedRiderOnMap(fleetRiders[0])}
                className="absolute top-[28%] left-[68%] flex flex-col items-center z-20 cursor-pointer hover:scale-110 transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-2 ring-amber-400/40 animate-pulse">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="bg-gray-900/95 px-2.5 py-1 rounded-md text-[11px] font-bold text-amber-300 mt-1 border border-white/20 whitespace-nowrap shadow-lg flex items-center gap-1">
                  <span>Haziq</span>
                  <span className="text-[9px] text-gray-400">({fleetRiders[0]?.speed || '38 km/h'})</span>
                </div>
              </div>

              {/* Rider 2 Pin (Tan Chee Keong) */}
              <div
                onClick={() => setSelectedRiderOnMap(fleetRiders[1])}
                className="absolute top-[65%] left-[34%] flex flex-col items-center z-20 cursor-pointer hover:scale-110 transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-2 ring-blue-400/40">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="bg-gray-900/95 px-2.5 py-1 rounded-md text-[11px] font-bold text-blue-300 mt-1 border border-white/20 whitespace-nowrap shadow-lg flex items-center gap-1">
                  <span>Ah Keong</span>
                  <span className="text-[9px] text-gray-400">({fleetRiders[1]?.speed || '42 km/h'})</span>
                </div>
              </div>

              {/* Rider 3 Pin (Raveen) */}
              <div
                onClick={() => setSelectedRiderOnMap(fleetRiders[2])}
                className="absolute top-[40%] left-[24%] flex flex-col items-center z-20 cursor-pointer hover:scale-110 transition-transform"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center shadow-xl border-2 border-white ring-2 ring-purple-400/40">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="bg-gray-900/95 px-2.5 py-1 rounded-md text-[11px] font-bold text-purple-300 mt-1 border border-white/20 whitespace-nowrap shadow-lg flex items-center gap-1">
                  <span>Raveen</span>
                  <span className="text-[9px] text-gray-400">({fleetRiders[2]?.status.replace(/_/g, ' ')})</span>
                </div>
              </div>

              {/* Order Destination Pin (The Horizon) */}
              <div className="absolute top-[20%] left-[78%] flex flex-col items-center z-15 pointer-events-none opacity-80">
                <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md border border-white text-xs font-bold">
                  📍
                </div>
                <div className="bg-black/80 px-2 py-0.5 rounded text-[10px] text-rose-300 mt-0.5 whitespace-nowrap">
                  Order DM-98214 (8 min ETA)
                </div>
              </div>
            </div>

            {/* Rider Telemetry Cards with Reassignment Quick Trigger */}
            <div className="p-4 bg-gray-900 border-t border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Active Fleet Drivers On Road
                </h4>
                <span className="text-xs text-emerald-400 font-bold">
                  Click any driver to inspect or reassign order
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {fleetRiders.map((rider) => (
                  <div
                    key={rider.id}
                    onClick={() => setSelectedRiderOnMap(rider)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedRiderOnMap?.id === rider.id
                        ? 'bg-gray-800 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-gray-800/60 border-gray-700/80 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                          {rider.vehicleType === 'car' ? '🚗' : '🛵'}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white truncate">{rider.name}</p>
                          <span className="text-[10px] font-mono text-gray-400">{rider.plate}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/20">
                        {rider.speed}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-gray-700/50 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-gray-300">
                        <span className="text-gray-400 text-[11px]">Current Job:</span>
                        <span className="font-bold text-amber-400">
                          {rider.currentOrderNumber || 'Available / Standby'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span className="text-gray-400 text-[11px]">Destination:</span>
                        <span className="text-[11px] truncate max-w-[170px] text-gray-300">
                          {rider.destination || 'Bangsar South Hub'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-700/50 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-300">
                        <BatteryCharging className="w-3.5 h-3.5" />
                        <span>{rider.battery}</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const activeOrd = orders.find((o) => o.status === 'out_for_delivery' || o.status === 'packing') || orders[0];
                          if (activeOrd) {
                            setReassignOrder(activeOrd);
                            setTargetRiderId(rider.id);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Reassign Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: RIDER WALLETS & FLOAT MANAGEMENT */}
      {activeTab === 'wallets' && (
        <div className="space-y-5">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                  Total Fleet Float Balance
                </span>
                <h4 className="text-2xl font-black text-emerald-700 mt-1">
                  RM {totalFleetBalance.toFixed(2)}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Across {fleetRiders.length} registered riders</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                  Cash COD Held by Drivers
                </span>
                <h4 className="text-2xl font-black text-amber-700 mt-1">
                  RM {totalCodHeld.toFixed(2)}
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Pending safe drop-off at hub teller</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                  Fleet Fulfillment Rate
                </span>
                <h4 className="text-2xl font-black text-blue-700 mt-1">
                  99.4%
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Average customer rating 4.92 / 5.0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Star className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Riders Wallet Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>Rider Wallet Balances & Cash Settlements</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage driver float allowances, top up performance bonuses, and settle cash on delivery.
                </p>
              </div>

              <div className="text-xs text-gray-500 font-mono">
                {fleetRiders.length} Fleet Drivers Enrolled
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rider & Vehicle</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Wallet Balance</th>
                    <th className="py-3 px-3">COD Cash Held</th>
                    <th className="py-3 px-3">Rating & Deliveries</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Wallet Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {fleetRiders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                            {rider.vehicleType === 'car' ? '🚗' : '🛵'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{rider.name}</p>
                            <span className="text-[11px] font-mono text-gray-500">{rider.plate}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-gray-700">{rider.phone}</span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-black text-emerald-700 text-sm">
                          RM {rider.walletBalance.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className={`font-bold ${rider.codCollected > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                          RM {rider.codCollected.toFixed(2)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{rider.rating}</span>
                          <span className="text-gray-400 text-[10px]">({rider.completedDeliveries} jobs)</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            rider.status === 'delivering'
                              ? 'bg-purple-100 text-purple-800'
                              : rider.status === 'picked_up'
                              ? 'bg-blue-100 text-blue-800'
                              : rider.status === 'idle'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {rider.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setWalletModalRider(rider);
                            setWalletModalType('credit');
                            setWalletAmount('50.00');
                            setWalletNotes('Fuel allowance & performance bonus');
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Credit Float / Bonus"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Credit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setWalletModalRider(rider);
                            setWalletModalType('deduction');
                            setWalletAmount(rider.codCollected > 0 ? rider.codCollected.toFixed(2) : '30.00');
                            setWalletNotes('Settle COD cash collected at Hub Teller');
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Settle COD or Deduct Float"
                        >
                          <Minus className="w-3 h-3" />
                          <span>Deduct</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setViewLedgerRider(rider)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="View Ledger Statements"
                        >
                          <History className="w-3 h-3" />
                          <span>Ledger</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: ALL ORDERS TABLE & FINANCIAL RECONCILIATION */}
      {activeTab === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden space-y-0">
          {/* Header & Export Action */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/80 via-white to-emerald-50/20">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                  <TableIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-sm sm:text-base flex items-center gap-2">
                    <span>{language === 'en' ? 'Full Store Orders Manifest & Reconciliation' : 'Manifes & Penyelarasan Pesanan Kedai'}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300/60">
                      Audit CSV
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {language === 'en'
                      ? 'Filter orders by status, payment method, date or keywords, and export to CSV for financial reconciliation.'
                      : 'Tapis pesanan mengikut status, kaedah pembayaran, tarikh atau kata kunci, dan eksport ke CSV untuk penyelarasan.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Export Currently Filtered Orders Button */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="export-filtered-orders-csv-btn"
                data-testid="export-filtered-orders-csv-btn"
                onClick={handleExportFilteredOrders}
                disabled={filteredOrders.length === 0}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                title={
                  language === 'en'
                    ? `Export ${filteredOrders.length} currently filtered orders into CSV for financial reconciliation`
                    : `Eksport ${filteredOrders.length} pesanan ditapis ke CSV`
                }
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>
                  {language === 'en'
                    ? `Export Filtered Orders (${filteredOrders.length} CSV)`
                    : `Eksport Pesanan Ditapis (${filteredOrders.length} CSV)`}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Filter Toolbar */}
          <div className="p-4 bg-gray-50/70 border-b border-gray-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* 1. Search Query Input */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  id="orders-search-input"
                  data-testid="orders-search-input"
                  value={orderSearchTerm}
                  onChange={(e) => setOrderSearchTerm(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'Search Order ID, customer, phone, street, product...'
                      : 'Cari No Pesanan, pelanggan, telefon, jalan, produk...'
                  }
                  className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 shadow-2xs font-medium"
                />
                {orderSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setOrderSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* 2. Order Status Filter */}
              <div>
                <select
                  id="orders-status-filter"
                  data-testid="orders-status-filter"
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 shadow-2xs font-bold cursor-pointer"
                >
                  <option value="all">{language === 'en' ? 'All Statuses' : 'Semua Status'}</option>
                  <option value="submitted">{language === 'en' ? 'Received / Submitted' : 'Diterima'}</option>
                  <option value="packing">{language === 'en' ? 'Packing / In Prep' : 'Sedang Dibungkus'}</option>
                  <option value="out_for_delivery">{language === 'en' ? 'Out for Delivery' : 'Dalam Penghantaran'}</option>
                  <option value="delivered">{language === 'en' ? 'Delivered / Settled' : 'Selesai Dihantar'}</option>
                  <option value="cancelled">{language === 'en' ? 'Cancelled / Void' : 'Dibatalkan'}</option>
                </select>
              </div>

              {/* 3. Payment Method Filter */}
              <div>
                <select
                  id="orders-payment-filter"
                  data-testid="orders-payment-filter"
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 shadow-2xs font-bold cursor-pointer"
                >
                  <option value="all">{language === 'en' ? 'All Payment Types' : 'Semua Kaedah Bayaran'}</option>
                  <option value="FPX">DuitNow / FPX Online Banking</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="TNG">Touch &apos;n Go eWallet</option>
                </select>
              </div>

              {/* 4. Date Range Filter & Sort */}
              <div className="flex gap-2">
                <select
                  id="orders-date-filter"
                  data-testid="orders-date-filter"
                  value={orderDateFilter}
                  onChange={(e) => setOrderDateFilter(e.target.value as any)}
                  className="flex-1 py-2 px-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 shadow-2xs font-bold cursor-pointer"
                >
                  <option value="all">{language === 'en' ? 'All Time' : 'Semua Masa'}</option>
                  <option value="today">{language === 'en' ? 'Today' : 'Hari Ini'}</option>
                  <option value="yesterday">{language === 'en' ? 'Yesterday' : 'Semalam'}</option>
                  <option value="7days">{language === 'en' ? 'Past 7 Days' : '7 Hari Lalu'}</option>
                  <option value="30days">{language === 'en' ? 'Past 30 Days' : '30 Hari Lalu'}</option>
                </select>

                <select
                  id="orders-sort-filter"
                  data-testid="orders-sort-filter"
                  value={orderSortBy}
                  onChange={(e) => setOrderSortBy(e.target.value as any)}
                  className="py-2 px-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 shadow-2xs font-bold cursor-pointer"
                  title="Sort orders"
                >
                  <option value="newest">{language === 'en' ? 'Newest' : 'Terbaharu'}</option>
                  <option value="oldest">{language === 'en' ? 'Oldest' : 'Terlama'}</option>
                  <option value="highest_value">{language === 'en' ? 'RM High' : 'RM Tinggi'}</option>
                  <option value="lowest_value">{language === 'en' ? 'RM Low' : 'RM Rendah'}</option>
                </select>
              </div>
            </div>

            {/* Reconciliation Filter Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-700">
                  {language === 'en' ? 'Showing' : 'Menunjukkan'}{' '}
                  <span className="text-emerald-700 font-black">{filteredOrders.length}</span> {language === 'en' ? 'of' : 'daripada'}{' '}
                  <span className="text-gray-900 font-bold">{orders.length}</span> {language === 'en' ? 'total orders' : 'jumlah pesanan'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">
                  {language === 'en' ? 'Reconciliation Total:' : 'Jumlah Penyelarasan:'}{' '}
                  <span className="font-black text-emerald-700 font-mono text-sm">
                    RM {filteredTotalAmount.toFixed(2)}
                  </span>
                </span>

                {isFilterActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">
                    <Filter className="w-3 h-3" />
                    <span>{language === 'en' ? 'Filters Active' : 'Tapisan Aktif'}</span>
                  </span>
                )}
              </div>

              {isFilterActive && (
                <button
                  type="button"
                  id="reset-orders-filters-btn"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-gray-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Reset Filters' : 'Tetapkan Semula'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            {filteredOrders.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3 bg-gray-50/50">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-gray-800 text-sm">
                    {language === 'en' ? 'No orders match selected criteria' : 'Tiada pesanan sepadan dengan tapisan'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                    {language === 'en'
                      ? 'Try clearing your search keyword, changing the payment method filter, or expanding the date range.'
                      : 'Cuba kosongkan kata kunci carian, tukar kaedah pembayaran atau luaskan julat tarikh.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {language === 'en' ? 'Reset All Filters' : 'Set Semula Semua Tapisan'}
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Order Ref / ID</th>
                    <th className="py-3 px-3">Customer & Phone</th>
                    <th className="py-3 px-3">Delivery Address</th>
                    <th className="py-3 px-3">Items</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3">Gross Total</th>
                    <th className="py-3 px-3">Order Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredOrders.map((order) => {
                    const isDelivered = order.status === 'delivered' || order.status === 'completed';
                    const isOut = order.status === 'out_for_delivery';
                    const isPacking = order.status === 'packing';
                    const isSubmitted = order.status === 'submitted' || order.status === 'received';
                    const isCancelled = order.status === 'cancelled';

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-black text-gray-900 block font-mono">{order.orderNumber || order.id}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-900 truncate">
                            {order.deliveryAddress?.recipientName || 'Customer'}
                          </p>
                          <span className="text-xs font-mono text-gray-500">
                            {order.deliveryAddress?.phone || '—'}
                          </span>
                        </td>

                        <td className="py-3 px-3 max-w-[200px]">
                          <p className="text-xs text-gray-800 line-clamp-1">
                            {order.deliveryAddress?.street || 'Central Klang Valley'}
                          </p>
                          <span className="text-[11px] text-gray-400 block truncate">
                            {order.deliveryAddress?.city || 'Kuala Lumpur'} {order.deliveryAddress?.postcode ? `(${order.deliveryAddress.postcode})` : ''}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-xs inline-block">
                            {order.items.length} {language === 'en' ? 'items' : 'item'}
                          </span>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {order.paymentMethod || 'FPX'}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-black text-emerald-700 text-sm font-mono block">
                            RM {order.total.toFixed(2)}
                          </span>
                          {order.deliveryFee > 0 && (
                            <span className="text-[10px] text-gray-400 block font-mono">
                              fee: RM {order.deliveryFee.toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                              isDelivered
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOut
                                ? 'bg-purple-100 text-purple-800 animate-pulse'
                                : isPacking
                                ? 'bg-amber-100 text-amber-800'
                                : isCancelled
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                          {isSubmitted && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'packing')}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Pack
                            </button>
                          )}
                          {isPacking && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'out_for_delivery')}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Dispatch
                            </button>
                          )}
                          {isOut && (
                            <button
                              type="button"
                              onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setReassignOrder(order);
                              setTargetRiderId(fleetRiders[0]?.id || '');
                            }}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            title="Reassign Rider"
                          >
                            Reassign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: MANUAL ORDER REASSIGNMENT MODAL */}
      {reassignOrder && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm">
                  {language === 'en' ? 'Manual Order Reassignment' : 'Agihan Semula Pesanan Manual'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReassignOrder(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Target Order Summary */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Order: {reassignOrder.orderNumber}</span>
                  <span>RM {reassignOrder.total.toFixed(2)}</span>
                </div>
                <p className="text-gray-600 text-[11px]">
                  Customer: {reassignOrder.deliveryAddress?.recipientName} ({reassignOrder.deliveryAddress?.phone})
                </p>
                <p className="text-gray-600 text-[11px] truncate">
                  Address: {reassignOrder.deliveryAddress?.street}, {reassignOrder.deliveryAddress?.city}
                </p>
              </div>

              {/* Rider Selector */}
              <div>
                <label className="block font-bold text-gray-800 mb-2">
                  Select Active Rider for Reassignment:
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {fleetRiders.map((rider) => {
                    const isSelected = targetRiderId === rider.id;

                    return (
                      <div
                        key={rider.id}
                        onClick={() => setTargetRiderId(rider.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-sm">
                            {rider.vehicleType === 'car' ? '🚗' : '🛵'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{rider.name}</p>
                            <span className="text-[11px] text-gray-500 font-mono">
                              {rider.plate} • {rider.speed}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              rider.status === 'idle'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {rider.status.replace(/_/g, ' ')}
                          </span>
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            {rider.completedDeliveries} jobs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReassignOrder(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReassign}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Confirm Reassignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WALLET ADJUSTMENT MODAL (TOP-UP / DEDUCT) */}
      {walletModalRider && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className={`p-4 text-white flex items-center justify-between ${
              walletModalType === 'credit' ? 'bg-emerald-800' : 'bg-amber-800'
            }`}>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                <h3 className="font-black text-sm">
                  {walletModalType === 'credit' ? 'Top-Up Rider Float / Bonus' : 'Deduct Float / COD Settlement'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWalletModalRider(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmWalletAdjustment} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900">{walletModalRider.name}</p>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  Plate: {walletModalRider.plate} • Current Balance: <strong className="text-emerald-700">RM {walletModalRider.walletBalance.toFixed(2)}</strong>
                </p>
                {walletModalRider.codCollected > 0 && (
                  <p className="text-[11px] text-amber-800 font-bold mt-1">
                    Cash COD Held: RM {walletModalRider.codCollected.toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Adjustment Amount (RM):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">RM</span>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    required
                    value={walletAmount}
                    onChange={(e) => setWalletAmount(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 rounded-xl border border-gray-300 focus:border-emerald-500 font-bold text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Reason / Ledger Notes:
                </label>
                <input
                  type="text"
                  required
                  value={walletNotes}
                  onChange={(e) => setWalletNotes(e.target.value)}
                  placeholder="e.g., Performance incentive bonus or cash deposited"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-emerald-500 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Reference No. (Optional):
                </label>
                <input
                  type="text"
                  value={walletTxRef}
                  onChange={(e) => setWalletTxRef(e.target.value)}
                  placeholder="e.g., TELLER-SAFE-891"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-emerald-500 font-mono text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setWalletModalRider(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs ${
                    walletModalType === 'credit'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Confirm {walletModalType === 'credit' ? 'Credit' : 'Deduction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RIDER TRANSACTION LEDGER */}
      {viewLedgerRider && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-sm">{viewLedgerRider.name} - Wallet Statements</h3>
                  <span className="text-[10px] text-gray-400 font-mono">{viewLedgerRider.plate}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewLedgerRider(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Account Summary Table / Grid */}
              {(() => {
                const riderTxs = walletTransactions.filter((t) => t.riderId === viewLedgerRider.id);
                const creditTxs = riderTxs.filter((t) => t.amount > 0);
                const totalCredits = creditTxs.reduce((sum, t) => sum + t.amount, 0);
                const totalOnlineEarnings = totalCredits > 0 ? totalCredits : viewLedgerRider.walletBalance + 85.0;
                const netLedgerBalance = viewLedgerRider.walletBalance - viewLedgerRider.codCollected;

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="bg-white p-2.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] uppercase font-bold text-emerald-800 block">Floating Balance</span>
                      <h4 className="text-base font-black text-emerald-900 font-mono mt-0.5">
                        RM {viewLedgerRider.walletBalance.toFixed(2)}
                      </h4>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] uppercase font-bold text-amber-800 block">COD Cash Held</span>
                      <h4 className="text-base font-black text-amber-900 font-mono mt-0.5">
                        RM {viewLedgerRider.codCollected.toFixed(2)}
                      </h4>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-gray-100">
                      <span className="text-[10px] uppercase font-bold text-teal-800 block">Online Earnings</span>
                      <h4 className="text-base font-black text-teal-900 font-mono mt-0.5">
                        RM {totalOnlineEarnings.toFixed(2)}
                      </h4>
                    </div>
                    <div
                      className={`p-2.5 rounded-lg border ${
                        netLedgerBalance >= 0
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold block">Net Balance</span>
                      <h4 className="text-base font-black font-mono mt-0.5">
                        {netLedgerBalance < 0 ? '-' : ''}RM {Math.abs(netLedgerBalance).toFixed(2)}
                      </h4>
                    </div>
                  </div>
                );
              })()}

              <div className="max-h-64 overflow-y-auto space-y-2 divide-y divide-gray-100">
                {walletTransactions
                  .filter((t) => t.riderId === viewLedgerRider.id)
                  .map((tx) => (
                    <div key={tx.id} className="pt-2 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{tx.notes}</span>
                          <span className="text-[10px] font-mono text-gray-400">Ref: {tx.referenceNo}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block">{tx.createdAt}</span>
                      </div>

                      <span
                        className={`font-black text-sm ${
                          tx.amount >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {tx.amount >= 0 ? `+RM ${tx.amount.toFixed(2)}` : `-RM ${Math.abs(tx.amount).toFixed(2)}`}
                      </span>
                    </div>
                  ))}

                {walletTransactions.filter((t) => t.riderId === viewLedgerRider.id).length === 0 && (
                  <p className="text-center py-6 text-gray-400 italic">No prior transactions on record for this rider.</p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[10px] text-gray-400 font-mono">
                  D-mart Fleet Treasury &bull; Audited
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      exportRiderWalletStatementPDF(viewLedgerRider, walletTransactions);
                      showToast(`Downloaded PDF Statement for ${viewLedgerRider.name}`);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    title="Download Official PDF Statement"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Statement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewLedgerRider(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Close Ledger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
