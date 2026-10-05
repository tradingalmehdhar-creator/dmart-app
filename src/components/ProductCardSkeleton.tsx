import React from 'react';

interface ProductCardSkeletonProps {
  className?: string;
}

export const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({ className = '' }) => {
  return (
    <div
      data-testid="product-card-skeleton"
      aria-hidden="true"
      className={`bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden flex flex-col justify-between h-auto select-none relative ${className}`}
    >
      {/* Product Image & Badges Placeholder */}
      <div className="relative pt-[78%] bg-gradient-to-br from-gray-100 via-gray-200/60 to-gray-100 overflow-hidden shrink-0">
        {/* Shimmer sweep effect */}
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

        {/* Top Badges (Left placeholder: Discount/Badge) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
          <div className="h-4 w-10 bg-gray-300/80 rounded-md animate-pulse" />
        </div>

        {/* Top Badges (Right placeholder: Halal + Favorite Button) */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
          <div className="h-5 w-12 bg-white/90 rounded-full border border-gray-200/80 shadow-2xs animate-pulse" />
          <div className="w-7 h-7 bg-white/90 rounded-full border border-gray-200/80 shadow-2xs animate-pulse" />
        </div>

        {/* Bottom Left: Amount / Weight Tag Placeholder */}
        <div className="absolute bottom-2 left-2 h-4 w-14 bg-black/35 backdrop-blur-xs rounded-md animate-pulse" />
      </div>

      {/* Product Information Placeholder */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between gap-2.5 flex-1">
        <div className="space-y-1">
          {/* Amount label & stock badge row */}
          <div className="flex items-center justify-between gap-1">
            <div className="h-3 w-16 bg-gray-200/80 rounded-md animate-pulse" />
            <div className="flex items-center gap-1">
              <div className="h-3.5 w-14 bg-amber-100/80 rounded-md animate-pulse" />
              <div className="h-3.5 w-10 bg-emerald-100/80 rounded-md animate-pulse" />
            </div>
          </div>

          {/* Title lines */}
          <div className="space-y-1 mt-1">
            <div className="h-3.5 w-11/12 bg-gray-200/90 rounded-md animate-pulse" />
            <div className="h-3.5 w-7/12 bg-gray-200/80 rounded-md animate-pulse" />
          </div>
        </div>

        {/* Dedicated Responsive Bottom Row Container */}
        <div className="pt-2 border-t border-gray-100 flex flex-row items-center justify-between gap-1.5 sm:gap-2 w-full overflow-hidden">
          {/* Price placeholder */}
          <div className="flex-shrink-0">
            <div className="h-2.5 w-8 bg-gray-200/70 rounded mb-0.5 animate-pulse" />
            <div className="h-4 w-16 bg-gray-200/90 rounded-md animate-pulse" />
          </div>

          {/* Add button placeholder */}
          <div className="h-7 w-16 bg-emerald-100/80 rounded-xl animate-pulse shrink-0" />
        </div>
      </div>
    </div>
  );
};
