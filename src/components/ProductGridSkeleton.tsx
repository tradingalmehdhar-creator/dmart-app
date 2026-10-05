import React from 'react';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface ProductGridSkeletonProps {
  count?: number;
  className?: string;
  id?: string;
}

export const ProductGridSkeleton: React.FC<ProductGridSkeletonProps> = ({
  count = 10,
  className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4',
  id = 'products-grid-skeleton',
}) => {
  return (
    <div
      id={id}
      data-testid="product-grid-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading products"
      className={`w-full ${className}`}
    >
      <span className="sr-only">Loading products...</span>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={`product-skeleton-${index}`} />
      ))}
    </div>
  );
};
