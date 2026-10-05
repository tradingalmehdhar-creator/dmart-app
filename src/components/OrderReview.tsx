import React, { useState } from 'react';
import { Star, CheckCircle2, ThumbsUp, MessageSquare, Send, Sparkles, Edit3 } from 'lucide-react';
import { Language, OrderReviewData } from '../types';
import { translations } from '../data/translations';

interface OrderReviewProps {
  orderNumber: string;
  language: Language;
  existingReview?: OrderReviewData;
  onSubmitReview: (review: OrderReviewData) => void;
}

export const OrderReview: React.FC<OrderReviewProps> = ({
  orderNumber,
  language,
  existingReview,
  onSubmitReview,
}) => {
  const t = translations[language];
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(existingReview?.tags || []);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(!!existingReview);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const starLabelsEn = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
  const starLabelsMs = ['Kurang Memuaskan', 'Sederhana', 'Baik', 'Sangat Baik', 'Cemerlang!'];
  const labels = language === 'en' ? starLabelsEn : starLabelsMs;

  const quickTags = t.quickFeedbackTags || [];

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reviewData: OrderReviewData = {
      rating,
      comment: comment.trim(),
      tags: selectedTags,
      submittedAt: new Date().toISOString(),
    };
    onSubmitReview(reviewData);
    setIsSubmitted(true);
    setIsEditing(false);
  };

  if (isSubmitted && !isEditing) {
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50/80 border border-emerald-200/90 space-y-3 animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>{t.reviewSubmittedTitle}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.2 rounded-full">
                  Verified
                </span>
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                {t.reviewSubmittedDesc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white/90 hover:bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t.editReview}</span>
          </button>
        </div>

        {/* Displayed Rating */}
        <div className="bg-white/90 backdrop-blur-xs p-3 rounded-xl border border-emerald-100 space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-4 h-4 ${
                    s <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-black text-gray-900">
              {rating}.0 / 5.0
            </span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.2 rounded-md">
              {labels[rating - 1]}
            </span>
          </div>

          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {comment && (
            <p className="text-xs text-gray-700 italic border-t border-gray-100 pt-1.5 leading-relaxed">
              "{comment}"
            </p>
          )}
        </div>
      </div>
    );
  }

  const currentDisplayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-yellow-50/60 border border-amber-200/90 shadow-xs space-y-3.5 animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Star className="w-4 h-4 fill-white" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>{t.rateDeliveryExperience}</span>
              <span className="text-[10px] bg-amber-200/80 text-amber-900 font-black px-1.5 py-0.2 rounded-full">
                {orderNumber}
              </span>
            </h4>
            <p className="text-[11px] text-amber-800 mt-0.5">
              {t.ratePrompt}
            </p>
          </div>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-[11px] text-gray-500 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {/* 1-5 Star Interactive Selector */}
      <div className="bg-white/80 backdrop-blur-xs p-3 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((starValue) => {
            const isFilled = starValue <= currentDisplayRating;
            return (
              <button
                key={starValue}
                id={`review-star-btn-${starValue}`}
                type="button"
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(null)}
                aria-label={`Rate ${starValue} stars`}
                className="p-1 rounded-lg hover:scale-115 active:scale-95 transition-all duration-150 cursor-pointer focus:outline-hidden"
              >
                <Star
                  className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                      : 'text-gray-300 hover:text-amber-200'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="text-center sm:text-right">
          <span className="text-xs font-black text-gray-900 block">
            {currentDisplayRating}.0 / 5.0
          </span>
          <span className="text-[11px] font-bold text-amber-800">
            {labels[currentDisplayRating - 1]}
          </span>
        </div>
      </div>

      {/* Quick Feedback Tags */}
      <div>
        <label className="text-[11px] font-bold text-gray-700 block mb-1.5">
          {language === 'en' ? 'Quick Highlights (tap to select):' : 'Sorotan Pantas (tekan untuk pilih):'}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {quickTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`text-xs px-2.5 py-1 rounded-xl font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs font-semibold'
                    : 'bg-white hover:bg-amber-100/50 text-gray-700 border-amber-200'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Comment / Written Feedback Textarea */}
      <div>
        <div className="relative">
          <textarea
            id="review-comment-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder={t.ratingFeedbackPlaceholder}
            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-amber-200 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-hidden resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-2 pt-0.5">
        <button
          id="submit-order-review-btn"
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{t.submitReview}</span>
        </button>
      </div>
    </form>
  );
};
