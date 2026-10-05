import React, { useState, useEffect } from 'react';
import {
  Star,
  X,
  CheckCircle2,
  Package,
  Calendar,
  MessageSquare,
  Sparkles,
  Send,
  ThumbsUp,
  Clock,
  MapPin
} from 'lucide-react';
import { Order, Language, CustomerFeedback } from '../types';

interface RateOrderModalProps {
  isOpen: boolean;
  order: Order | null;
  language: Language;
  onClose: () => void;
  onSubmitFeedback: (orderId: string, feedback: CustomerFeedback) => void;
}

export const RateOrderModal: React.FC<RateOrderModalProps> = ({
  isOpen,
  order,
  language,
  onClose,
  onSubmitFeedback,
}) => {
  const isEn = language === 'en';

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Initialize form when an order is opened
  useEffect(() => {
    if (order) {
      if (order.customerFeedback && order.customerFeedback.length > 0) {
        const latest = order.customerFeedback[order.customerFeedback.length - 1];
        setRating(latest.rating || 5);
        setComment(latest.comment || '');
      } else if (order.review) {
        setRating(order.review.rating || 5);
        setComment(order.review.comment || '');
      } else {
        setRating(5);
        setComment('');
      }
      setIsSubmitting(false);
      setShowSuccessToast(false);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const starLabelsEn = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
  const starLabelsMs = ['Kurang Memuaskan', 'Sederhana', 'Baik', 'Sangat Baik', 'Cemerlang!'];
  const activeRating = hoverRating !== null ? hoverRating : rating;
  const ratingDescription = isEn
    ? starLabelsEn[Math.max(0, activeRating - 1)]
    : starLabelsMs[Math.max(0, activeRating - 1)];

  const quickChips = isEn
    ? [
        '⚡ Super fast delivery',
        '🥦 Extremely fresh vegetables & fruits',
        '📦 Neat & careful packing',
        '😊 Polite & friendly rider',
        '💯 Accurate order items'
      ]
    : [
        '⚡ Penghantaran sangat pantas',
        '🥦 Sayur & buah sangat segar',
        '📦 Bungkusan kemas & selamat',
        '😊 Rider ramah & bersopan',
        '💯 Barangan pesanan tepat'
      ];

  const handleQuickChipClick = (chipText: string) => {
    setComment((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return chipText;
      if (trimmed.includes(chipText)) return trimmed;
      return `${trimmed}. ${chipText}`;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;

    setIsSubmitting(true);

    const newFeedback: CustomerFeedback = {
      id: `cf-${Date.now()}`,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    setTimeout(() => {
      onSubmitFeedback(order.id, newFeedback);
      setIsSubmitting(false);
      setShowSuccessToast(true);

      setTimeout(() => {
        onClose();
        setShowSuccessToast(false);
      }, 1400);
    }, 400);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat(isEn ? 'en-MY' : 'ms-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      id="rate-order-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="rate-order-modal-container"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-inner shrink-0">
                <Star className="w-5 h-5 fill-amber-950 text-amber-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg tracking-tight text-white">
                    {isEn ? 'Rate Delivered Order' : 'Nilai Pesanan Selesai'}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    {isEn ? 'Delivered' : 'Dihantar'}
                  </span>
                </div>
                <p className="text-xs text-emerald-100 mt-0.5">
                  <span className="font-bold text-white">{order.orderNumber}</span> • {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="rate-order-close-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 text-gray-800 text-xs">
          {/* Success Notification Banner */}
          {showSuccessToast && (
            <div
              id="rate-order-success-banner"
              className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-bold text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm">
                  {isEn ? 'Rating Recorded Successfully!' : 'Penilaian Berjaya Disimpan!'}
                </p>
                <p className="text-[11px] text-emerald-700 font-normal mt-0.5">
                  {isEn
                    ? `Feedback stored in customerFeedback array for ${order.orderNumber}.`
                    : `Maklum balas disimpan dalam pesanan ${order.orderNumber}.`}
                </p>
              </div>
            </div>
          )}

          {/* Purchased Items Mini Strip */}
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-semibold text-gray-700 truncate">
                {order.items.length} {isEn ? 'items in order' : 'barangan pesanan'}
              </span>
              <span className="text-gray-300">•</span>
              <span className="font-bold text-emerald-800 shrink-0">
                RM {order.total.toFixed(2)}
              </span>
            </div>
            <div className="flex -space-x-2 overflow-hidden shrink-0">
              {order.items.slice(0, 4).map((it, idx) => (
                <img
                  key={idx}
                  src={it.product.image}
                  alt={it.product.nameEn}
                  className="w-7 h-7 rounded-full object-cover border-2 border-white shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 5-Star Rating Selector */}
            <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 text-center space-y-2.5">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                {isEn ? 'Select your 5-star rating' : 'Pilih penilaian 5-bintang anda'}
              </span>

              {/* Stars Interactive Row */}
              <div
                id="rate-order-stars-group"
                className="flex items-center justify-center gap-2 sm:gap-3 py-1"
                role="radiogroup"
                aria-label="Order rating stars"
              >
                {[1, 2, 3, 4, 5].map((starIndex) => {
                  const isFilled = starIndex <= activeRating;
                  return (
                    <button
                      key={starIndex}
                      type="button"
                      id={`rate-star-${starIndex}-btn`}
                      onClick={() => setRating(starIndex)}
                      onMouseEnter={() => setHoverRating(starIndex)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-xl transition-transform hover:scale-125 active:scale-95 focus:outline-hidden cursor-pointer"
                      aria-label={`${starIndex} Star${starIndex > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-8 h-8 sm:w-9 sm:h-9 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                            : 'text-gray-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Rating Label */}
              <div className="flex items-center justify-center gap-2">
                <span className="font-black text-amber-950 text-sm sm:text-base font-mono">
                  {activeRating}.0 / 5.0
                </span>
                <span className="text-gray-300">•</span>
                <span className="font-bold text-xs bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full">
                  {ratingDescription}
                </span>
              </div>
            </div>

            {/* Brief Comment Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="rate-order-comment-input"
                  className="font-bold text-xs text-gray-800 flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{isEn ? 'Brief Customer Comment' : 'Ulasan Ringkas Pelanggan'}</span>
                </label>
                <span className="text-[10px] text-gray-400">
                  {comment.length} / 300 {isEn ? 'characters' : 'aksara'}
                </span>
              </div>

              <textarea
                id="rate-order-comment-input"
                rows={3}
                maxLength={300}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isEn
                    ? 'Tell us what you liked about this delivery, fresh groceries, or packaging...'
                    : 'Kongsi pengalaman anda tentang barangan segar, kelajuan penghantaran atau bungkusan...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-xs text-gray-900 placeholder:text-gray-400 resize-none transition-all outline-hidden bg-white shadow-2xs"
              />

              {/* Quick suggestion tags */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">
                  {isEn ? 'Quick comments (tap to insert):' : 'Cadangan ulasan pantas:'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickChips.map((chip, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleQuickChipClick(chip)}
                      className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-200 text-gray-600 text-[10px] font-medium border border-gray-200 transition-colors cursor-pointer text-left active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Existing Feedback History (if any recorded in customerFeedback array) */}
            {order.customerFeedback && order.customerFeedback.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                  <span>
                    {isEn ? 'Previous Feedback in customerFeedback:' : 'Maklum Balas Terdahulu:'}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                    {order.customerFeedback.length} {isEn ? 'entry/entries' : 'rekod'}
                  </span>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {order.customerFeedback.map((fb, idx) => (
                    <div
                      key={fb.id || idx}
                      className="p-2 bg-white rounded-lg border border-gray-100 text-[11px] flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= fb.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="font-bold text-gray-800 ml-1">{fb.rating}.0</span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {formatDate(fb.createdAt)}
                        </span>
                      </div>
                      {fb.comment && (
                        <p className="text-gray-600 italic text-[11px]">"{fb.comment}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="rate-order-cancel-btn"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>

              <button
                type="submit"
                id="submit-order-rating-btn"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-60"
              >
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span>
                  {isSubmitting
                    ? isEn
                      ? 'Saving Feedback...'
                      : 'Menyimpan Maklum Balas...'
                    : isEn
                    ? 'Submit Rating'
                    : 'Hantar Penilaian'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
