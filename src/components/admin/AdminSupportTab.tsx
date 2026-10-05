import React, { useState } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Gift,
  Send,
  Phone,
  Mail,
  Search,
  Filter,
  PackageX,
  CreditCard,
  Truck,
  Table as TableIcon,
  LayoutGrid,
  Eye,
  Zap,
  Wallet,
  X
} from 'lucide-react';
import { SupportTicket, Language } from '../../types';

interface AdminSupportTabProps {
  tickets: SupportTicket[];
  onUpdateTicket: (ticketId: string, updates: Partial<SupportTicket>) => void;
  language: Language;
}

export const AdminSupportTab: React.FC<AdminSupportTabProps> = ({
  tickets,
  onUpdateTicket,
  language,
}) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    tickets.length > 0 ? tickets[0] : null
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'investigating' | 'resolved' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState<'table' | 'cards'>('table');
  const [resolutionToast, setResolutionToast] = useState<string | null>(null);

  // One-Tap Wallet Refund Modal State
  const [walletRefundTicket, setWalletRefundTicket] = useState<SupportTicket | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>('18.50');
  const [refundReason, setRefundReason] = useState<string>('Damaged / Missing Fresh Produce');
  const [refundChannel, setRefundChannel] = useState<'tng_ewallet' | 'dmart_cash_wallet'>('tng_ewallet');

  const showToast = (msg: string) => {
    setResolutionToast(msg);
    setTimeout(() => setResolutionToast(null), 4000);
  };

  // One-Tap Instant Wallet Refund Handler
  const handleConfirmWalletRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletRefundTicket) return;

    const parsedAmt = parseFloat(refundAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast(language === 'en' ? 'Please enter a valid refund amount.' : 'Sila masukkan jumlah bayaran balik yang sah.');
      return;
    }

    const txId = `WAL-REF-${Date.now().toString().slice(-6)}`;
    const channelName = refundChannel === 'tng_ewallet' ? "Touch 'n Go eWallet" : 'D-mart Customer Wallet';
    const notes = `One-tap instant refund of RM ${parsedAmt.toFixed(2)} disbursed directly to ${walletRefundTicket.customerName}'s ${channelName}. Reason: ${refundReason}. TxID: ${txId}. Linked Order: ${walletRefundTicket.orderNumber}.`;

    const updates: Partial<SupportTicket> = {
      status: 'refunded',
      refundAmount: parsedAmt,
      refundTxId: txId,
      refundWalletCredited: true,
      resolvedAt: new Date().toLocaleString(),
      resolutionNotes: notes,
    };

    onUpdateTicket(walletRefundTicket.id, updates);

    if (selectedTicket?.id === walletRefundTicket.id) {
      setSelectedTicket({
        ...selectedTicket,
        ...updates,
      });
    }

    showToast(
      language === 'en'
        ? `⚡ Instant Wallet Refund of RM ${parsedAmt.toFixed(2)} credited to ${walletRefundTicket.customerName} (${channelName})!`
        : `⚡ Bayaran balik dompet segera RM ${parsedAmt.toFixed(2)} berjaya dikreditkan kepada ${walletRefundTicket.customerName}!`
    );

    setWalletRefundTicket(null);
  };

  // Quick Action Handlers
  const handleIssueRefund = (ticket: SupportTicket) => {
    const notes = `Issued full FPX refund for order ${ticket.orderNumber} via D-mart merchant gateway. Ref: RFND-${Date.now().toString().slice(-6)}`;
    onUpdateTicket(ticket.id, {
      status: 'refunded',
      resolvedAt: new Date().toLocaleString(),
      resolutionNotes: notes,
    });
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({
        ...ticket,
        status: 'refunded',
        resolvedAt: new Date().toLocaleString(),
        resolutionNotes: notes,
      });
    }
    showToast(language === 'en' ? `Full refund issued to ${ticket.customerName}.` : `Bayaran balik penuh telah diproses.`);
  };

  const handleDispatchReplacement = (ticket: SupportTicket) => {
    const notes = `Immediate replacement grocery dispatch generated with high priority courier for order ${ticket.orderNumber}.`;
    onUpdateTicket(ticket.id, {
      status: 'investigating',
      resolutionNotes: notes,
    });
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({
        ...ticket,
        status: 'investigating',
        resolutionNotes: notes,
      });
    }
    showToast(language === 'en' ? `Replacement dispatch created for ${ticket.orderNumber}.` : `Penghantaran gantian segera telah dibuat.`);
  };

  const handleCreditVoucher = (ticket: SupportTicket) => {
    const voucherCode = `CARE${Math.floor(1000 + Math.random() * 9000)}`;
    const notes = `Credited RM 10.00 apology store voucher (${voucherCode}) to customer account.`;
    onUpdateTicket(ticket.id, {
      status: 'resolved',
      resolvedAt: new Date().toLocaleString(),
      resolutionNotes: notes,
    });
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({
        ...ticket,
        status: 'resolved',
        resolvedAt: new Date().toLocaleString(),
        resolutionNotes: notes,
      });
    }
    showToast(language === 'en' ? `Voucher code ${voucherCode} sent via SMS to customer.` : `Kod baucar ${voucherCode} telah dihantar kepada pelanggan.`);
  };

  const handleMarkResolved = (ticket: SupportTicket) => {
    const notes = `Issue resolved with customer satisfaction confirmation.`;
    onUpdateTicket(ticket.id, {
      status: 'resolved',
      resolvedAt: new Date().toLocaleString(),
      resolutionNotes: notes,
    });
    if (selectedTicket?.id === ticket.id) {
      setSelectedTicket({
        ...ticket,
        status: 'resolved',
        resolvedAt: new Date().toLocaleString(),
        resolutionNotes: notes,
      });
    }
    showToast(language === 'en' ? `Ticket marked as resolved.` : `Tiket sokongan telah diselesaikan.`);
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openTicketsCount = tickets.filter((t) => t.status === 'open' || t.status === 'investigating').length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {resolutionToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{resolutionToast}</span>
        </div>
      )}

      {/* Top Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Total Tickets
          </span>
          <span className="text-2xl font-black text-gray-900">{tickets.length}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block mb-1">
            Open & Investigating
          </span>
          <span className="text-2xl font-black text-amber-600">{openTicketsCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-1">
            Resolved Satisfied
          </span>
          <span className="text-2xl font-black text-emerald-600">
            {tickets.filter((t) => t.status === 'resolved').length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block mb-1">
            Avg Resolution Time
          </span>
          <span className="text-2xl font-black text-blue-600">18 min</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search by ticket #, order #, customer name...' : 'Cari tiket, no. pesanan, nama pelanggan...'}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'open' ? 'bg-amber-500 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'resolved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Resolved
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('refunded')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'refunded' ? 'bg-purple-600 text-white shadow-xs' : 'text-gray-600'
              }`}
            >
              Refunded
            </button>
          </div>

          {/* Layout Toggle: Table vs Cards */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'table' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Data Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('cards')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                viewLayout === 'cards' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Card Inspector View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Inspector</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Responsive Data Table OR Split Card Inspector */}
      {viewLayout === 'table' ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {/* Mobile Horizontal Swipe Instruction Banner */}
          <div className="md:hidden flex items-center justify-between px-3.5 py-2 bg-emerald-50/80 border-b border-emerald-100 text-emerald-950 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="animate-pulse">↔️</span>
              <span>{language === 'en' ? 'Swipe horizontally to view all ticket columns' : 'Leret ke sisi untuk melihat semua maklumat tiket'}</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
              {filteredTickets.length} tickets
            </span>
          </div>

          <div className="overflow-x-auto no-scrollbar sm:overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="bg-gray-50/80 text-gray-600 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 min-w-[140px]">{language === 'en' ? 'Ticket # / Date' : 'No. Tiket / Tarikh'}</th>
                  <th className="py-3 px-3 min-w-[160px]">{language === 'en' ? 'Customer & Phone' : 'Pelanggan & Telefon'}</th>
                  <th className="py-3 px-3 whitespace-nowrap">{language === 'en' ? 'Order Number' : 'No. Pesanan'}</th>
                  <th className="py-3 px-3 min-w-[200px]">{language === 'en' ? 'Category & Subject' : 'Kategori & Aduan'}</th>
                  <th className="py-3 px-3 whitespace-nowrap">{language === 'en' ? 'Status' : 'Status'}</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">{language === 'en' ? 'Quick Resolution' : 'Tindakan'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                      {language === 'en' ? 'No support tickets match your filter.' : 'Tiada tiket sokongan yang sepadan.'}
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const isOpen = ticket.status === 'open';
                    const isInvestigating = ticket.status === 'investigating';
                    const isResolved = ticket.status === 'resolved';

                    return (
                      <tr key={ticket.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Ticket Number */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-gray-900 block">{ticket.ticketNumber}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{ticket.createdAt}</span>
                        </td>

                        {/* Customer */}
                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-900 truncate">{ticket.customerName}</p>
                          <span className="text-xs font-mono text-gray-500">{ticket.customerPhone}</span>
                        </td>

                        {/* Order */}
                        <td className="py-3 px-3 whitespace-nowrap font-mono text-xs font-bold text-emerald-700">
                          {ticket.orderNumber}
                        </td>

                        {/* Subject */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded">
                              {ticket.issueType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 text-xs truncate max-w-[240px]">
                            {ticket.subject}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[240px]">
                            {ticket.description}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                              isOpen
                                ? 'bg-rose-100 text-rose-800 animate-pulse'
                                : isInvestigating
                                ? 'bg-amber-100 text-amber-800'
                                : isResolved
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </td>

                        {/* Quick Resolution Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                          {!isResolved && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setWalletRefundTicket(ticket);
                                  setRefundAmount(ticket.issueType === 'missing_item' ? '4.50' : '18.50');
                                  setRefundReason(`One-tap refund for ${ticket.subject}`);
                                }}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="One-Tap Instant Wallet Refund"
                              >
                                <Zap className="w-3 h-3 text-amber-300" />
                                <span>Wallet Refund</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleIssueRefund(ticket)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Issue Refund"
                              >
                                Refund
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCreditVoucher(ticket)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                title="Send RM10 Voucher"
                              >
                                RM10
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkResolved(ticket)}
                                className="px-2 py-1 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setViewLayout('cards');
                            }}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                            title="Inspect Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      /* Main Grid: Tickets Queue + Resolution Detail Inspector */
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets Queue */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-emerald-600" />
              <span>{language === 'en' ? 'Customer Support Queue' : 'Peti Aduan & Sokongan Pelanggan'}</span>
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              {filteredTickets.length} tickets
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => {
              const isSelected = selectedTicket?.id === ticket.id;
              const isOpen = ticket.status === 'open';
              const isInvestigating = ticket.status === 'investigating';
              const isResolved = ticket.status === 'resolved';

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 transition-all cursor-pointer hover:bg-gray-50/80 ${
                    isSelected ? 'bg-emerald-50/60 border-l-4 border-emerald-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-gray-500">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-bold text-emerald-700">
                          Order: {ticket.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isOpen
                              ? 'bg-rose-100 text-rose-800 animate-pulse'
                              : isInvestigating
                              ? 'bg-amber-100 text-amber-800'
                              : isResolved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>

                      <h4 className="font-bold text-gray-900 text-sm">{ticket.subject}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{ticket.description}</p>

                      {ticket.refundWalletCredited && (
                        <div className="mt-1.5 p-1.5 bg-emerald-50 rounded-lg text-[11px] text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>⚡ Wallet Refunded RM {ticket.refundAmount?.toFixed(2)} • {ticket.refundTxId}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2">
                        <span>{ticket.customerName}</span>
                        <span>•</span>
                        <span>{ticket.customerPhone}</span>
                      </div>
                    </div>

                    <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {ticket.createdAt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Resolution Actions & Customer Chat History */}
        <div className="lg:col-span-5 sticky top-6">
          {selectedTicket ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                    {selectedTicket.ticketNumber}
                  </span>
                  <h3 className="font-black text-gray-900 text-base mt-1 leading-snug">
                    {selectedTicket.subject}
                  </h3>
                </div>
              </div>

              {/* Customer Contact Card */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Customer Name:</span>
                  <span className="font-bold text-gray-800">{selectedTicket.customerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Phone Number:</span>
                  <span className="font-semibold text-gray-800">{selectedTicket.customerPhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Linked Order Number:</span>
                  <span className="font-bold text-emerald-700">{selectedTicket.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Issue Category:</span>
                  <span className="font-semibold text-gray-800 capitalize">
                    {selectedTicket.issueType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Issue Description */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-700">Customer Description:</span>
                <p className="text-xs text-gray-600 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
                  "{selectedTicket.description}"
                </p>
              </div>

              {/* Resolution Notes if any */}
              {selectedTicket.resolutionNotes && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-800">Resolution Record:</span>
                  <p className="text-xs text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200 leading-relaxed">
                    {selectedTicket.resolutionNotes}
                  </p>
                </div>
              )}

              {/* Quick Action Resolution Buttons */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="text-xs font-bold text-gray-700 block mb-1">
                  {language === 'en' ? 'One-Click Resolution Actions:' : 'Tindakan Penyelesaian Segera:'}
                </span>

                {/* Prominent One-Tap Wallet Refund Button */}
                <button
                  type="button"
                  onClick={() => {
                    setWalletRefundTicket(selectedTicket);
                    setRefundAmount(selectedTicket.issueType === 'missing_item' ? '4.50' : '18.50');
                    setRefundReason(`One-tap wallet refund for ${selectedTicket.subject}`);
                  }}
                  className="w-full p-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>One-Tap Instant Wallet Refund</span>
                </button>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleIssueRefund(selectedTicket)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Direct Gateway Refund</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDispatchReplacement(selectedTicket)}
                    className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Dispatch Replace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCreditVoucher(selectedTicket)}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Credit RM10 Voucher</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkResolved(selectedTicket)}
                    className="p-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Resolved</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Select a support ticket to review and issue resolutions.</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ONE-TAP INSTANT WALLET REFUND MODAL */}
      {walletRefundTicket && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-300 animate-bounce" />
                <div>
                  <h3 className="font-black text-sm">One-Tap Instant Wallet Refund</h3>
                  <span className="text-[10px] text-emerald-200 font-mono">
                    Ticket: {walletRefundTicket.ticketNumber} • Order: {walletRefundTicket.orderNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWalletRefundTicket(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmWalletRefund} className="p-5 space-y-4 text-xs">
              {/* Customer summary */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Customer: {walletRefundTicket.customerName}</span>
                  <span className="text-emerald-800 font-mono">{walletRefundTicket.customerPhone}</span>
                </div>
                <p className="text-gray-600 text-[11px]">
                  Issue: <strong className="text-gray-900">{walletRefundTicket.subject}</strong>
                </p>
                <p className="text-gray-500 text-[11px] italic">
                  "{walletRefundTicket.description}"
                </p>
              </div>

              {/* Refund Channel Selection */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  Select Payout Destination:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => setRefundChannel('tng_ewallet')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      refundChannel === 'tng_ewallet'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                      TNG
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Touch 'n Go eWallet</p>
                      <span className="text-[10px] text-gray-500">Linked to {walletRefundTicket.customerPhone}</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setRefundChannel('dmart_cash_wallet')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      refundChannel === 'dmart_cash_wallet'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      D
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">D-mart Shopper Credit</p>
                      <span className="text-[10px] text-gray-500">Immediate in-app store balance</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Refund Amount (RM):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-gray-400">RM</span>
                  <input
                    type="number"
                    step="0.10"
                    min="0.50"
                    required
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full pl-12 pr-3 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-500 font-black text-base outline-none"
                  />
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Audit Notes / Reason for Customer:
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g., 3 cracked eggs refunded instantly"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:border-emerald-500 text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setWalletRefundTicket(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Disburse RM {parseFloat(refundAmount || '0').toFixed(2)} Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
