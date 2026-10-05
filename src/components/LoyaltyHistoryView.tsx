import React, { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  ShoppingBag,
  Filter,
  Calendar,
  Gift,
  Search,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { LoyaltyTransaction, Language } from '../types';

interface LoyaltyHistoryViewProps {
  transactions: LoyaltyTransaction[];
  language: Language;
  onViewOrder?: (orderReference: string) => void;
  compact?: boolean;
}

export const LoyaltyHistoryView: React.FC<LoyaltyHistoryViewProps> = ({
  transactions,
  language,
  onViewOrder,
  compact = false,
}) => {
  const isEn = language === 'en';
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate totals
  const totalEarned = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = Math.abs(
    transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const filtered = transactions.filter((t) => {
    if (filter === 'earned' && t.amount <= 0) return false;
    if (filter === 'spent' && t.amount >= 0) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const title = (isEn ? t.titleEn : t.titleMs).toLowerCase();
      const orderRef = (t.orderReference || '').toLowerCase();
      const notes = ((isEn ? t.notesEn : t.notesMs) || '').toLowerCase();
      return title.includes(term) || orderRef.includes(term) || notes.includes(term);
    }

    return true;
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isEn ? 'en-MY' : 'ms-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-900 block">
              {isEn ? 'Total Points Earned' : 'Jumlah Mata Dikumpul'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-emerald-700">+{totalEarned}</span>
              <span className="text-[10px] font-bold text-emerald-800">{isEn ? 'pts' : 'mata'}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-900 block">
              {isEn ? 'Total Points Redeemed' : 'Jumlah Mata Ditebus'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-amber-700">-{totalSpent}</span>
              <span className="text-[10px] font-bold text-amber-800">{isEn ? 'pts' : 'mata'}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {isEn ? 'All' : 'Semua'} ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('earned')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'earned'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-emerald-700'
            }`}
          >
            {isEn ? 'Earned (+)' : 'Dikumpul (+)'}
          </button>
          <button
            type="button"
            onClick={() => setFilter('spent')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'spent'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-gray-500 hover:text-amber-700'
            }`}
          >
            {isEn ? 'Spent (-)' : 'Ditebus (-)'}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-0 sm:w-48">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isEn ? 'Search history...' : 'Cari transaksi...'}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-gray-500">
            <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs font-semibold">
              {isEn ? 'No loyalty transactions found' : 'Tiada rekod transaksi dijumpai'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {isEn
                ? 'Earn points by ordering groceries or completing shopper quests!'
                : 'Kumpul mata dengan membeli barangan runcit atau selesaikan misi!'}
            </p>
          </div>
        ) : (
          filtered.map((tx) => {
            const isPositive = tx.amount > 0;

            return (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 shadow-2xs transition-all flex items-center justify-between gap-3"
              >
                {/* Left icon and details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isPositive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5 className="text-xs font-bold text-gray-900 leading-snug">
                        {isEn ? tx.titleEn : tx.titleMs}
                      </h5>
                      {tx.orderReference && (
                        <button
                          type="button"
                          onClick={() => onViewOrder && onViewOrder(tx.orderReference!)}
                          className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 transition-colors cursor-pointer"
                        >
                          <span>#{tx.orderReference}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                      {isEn ? tx.notesEn : tx.notesMs}
                    </p>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(tx.date)}
                      </span>
                      {tx.balanceAfter !== undefined && (
                        <span>
                          • {isEn ? 'Bal:' : 'Baki:'} {tx.balanceAfter} {isEn ? 'pts' : 'mata'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Point Change Badge */}
                <div className="text-right shrink-0">
                  <span
                    className={`inline-block text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg border ${
                      isPositive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {isPositive ? `+${tx.amount}` : tx.amount} {isEn ? 'PTS' : 'MATA'}
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5 font-medium">
                    {isPositive
                      ? isEn
                        ? 'Earned'
                        : 'Dikumpul'
                      : isEn
                      ? 'Redeemed'
                      : 'Ditebus'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
