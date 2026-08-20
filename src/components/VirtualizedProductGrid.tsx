import React from 'react';
import ProductCard from './ProductCard';
import { PremiumProductCard } from './PremiumProductCard';
import { Product } from '../types';

interface VirtualizedProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, quantityCartons: number) => void;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin' | string;
  user?: any;
  onRequireAuth?: () => void;
  onViewDetails?: (product: Product) => void;
  onCompare?: (product: Product) => void;
  comparisonList?: Product[];
  usePremiumCards?: boolean;
  toPersianNum?: (num: number | string) => string;
}

export const VirtualizedProductGrid: React.FC<VirtualizedProductGridProps> = ({
  products,
  onAddToCart,
  userBadge,
  user,
  onRequireAuth,
  onViewDetails,
  onCompare,
  comparisonList = [],
  usePremiumCards = false,
  toPersianNum = (n) => String(n)
}) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, idx) => {
        const isComparing = comparisonList.some(p => p.id === product.id);
        if (usePremiumCards) {
          return (
            <PremiumProductCard
              key={`prem-prod-${product.id || idx}-${idx}`}
              product={product}
              qty={product.min_order_cartons || 1}
              onIncrement={() => {}}
              onDecrement={() => {}}
              onAddToCart={(p, qty) => onAddToCart(p, qty)}
              onViewDetails={onViewDetails}
              toPersianNum={toPersianNum}
              user={user}
              onRequireAuth={onRequireAuth}
            />
          );
        }
        return (
          <ProductCard
            key={`std-prod-${product.id || idx}-${idx}`}
            product={product}
            index={idx}
            onAddToCart={onAddToCart}
            userBadge={userBadge as any}
            user={user}
            onRequireAuth={onRequireAuth}
            onViewDetails={onViewDetails}
            onCompare={onCompare}
            isComparing={isComparing}
          />
        );
      })}
    </div>
  );
};

export default VirtualizedProductGrid;
