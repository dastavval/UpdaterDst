import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
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

const INITIAL_BATCH_SIZE = 12;
const BATCH_INCREMENT = 12;

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
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_BATCH_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visibleCount whenever the product list source changes (e.g. search / category switch)
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH_SIZE);
  }, [products]);

  // Memoized slice of currently visible products to avoid unnecessary DOM bloating
  const visibleProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    return products.slice(0, visibleCount);
  }, [products, visibleCount]);

  const hasMore = visibleProducts.length < (products?.length || 0);

  // Load next chunk smoothly
  const loadNextBatch = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    // Request animation frame to guarantee zero main-thread freeze
    requestAnimationFrame(() => {
      setVisibleCount(prev => Math.min(prev + BATCH_INCREMENT, products.length));
      setIsLoadingMore(false);
    });
  }, [isLoadingMore, hasMore, products.length]);

  // IntersectionObserver for auto-infinite loading when user scrolls near the bottom
  useEffect(() => {
    if (!hasMore) return;

    const currentSentinel = sentinelRef.current;
    if (!currentSentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNextBatch();
        }
      },
      {
        root: null,
        rootMargin: '400px 0px', // Preload next batch 400px before reaching bottom
        threshold: 0.05
      }
    );

    observer.observe(currentSentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadNextBatch]);

  if (!products || products.length === 0) {
    return null;
  }

  // Pre-calculate comparison lookup set for O(1) membership check
  const comparisonSet = new Set(comparisonList.map(p => p.id));

  return (
    <div className="w-full space-y-6">
      {/* Product Grid with GPU-accelerated styling */}
      <motion.div 
        layout="position"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6"
      >
        {visibleProducts.map((product, idx) => {
          const isComparing = comparisonSet.has(product.id);
          return (
            <div
              key={`grid-item-${product.id || idx}-${idx}`}
              className="product-card-intrinsic transform-gpu h-full flex flex-col"
              style={{
                contentVisibility: "auto",
                containIntrinsicSize: "280px 450px"
              }}
            >
              {usePremiumCards ? (
                <PremiumProductCard
                  product={product}
                  qty={product.min_order_cartons || 1}
                  onIncrement={() => {}}
                  onDecrement={() => {}}
                  onAddToCart={(p, qty) => onAddToCart(p, qty)}
                  onViewDetails={onViewDetails}
                  toPersianNum={toPersianNum}
                  user={user}
                  onRequireAuth={onRequireAuth}
                  index={idx}
                />
              ) : (
                <ProductCard
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
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Sentinel for IntersectionObserver to append next batch smoothly */}
      {hasMore && (
        <div ref={sentinelRef} className="w-full py-4 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-500 bg-slate-100/90 border border-slate-200/80 px-4 py-2 rounded-2xl shadow-2xs">
            {isLoadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin text-emerald-600" />
                <span>در حال بارگذاری اقلام بیشتر...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} className="text-amber-500" />
                <span>
                  نمایش {toPersianNum(visibleProducts.length)} از {toPersianNum(products.length)} کالا
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setVisibleCount(products.length)}
            className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-4 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <ChevronDown size={14} />
            <span>نمایش یکجای تمام {toPersianNum(products.length)} کالا</span>
          </button>
        </div>
      )}

      {/* Completion indicator if all items in a large list are rendered */}
      {!hasMore && products.length > INITIAL_BATCH_SIZE && (
        <div className="pt-4 pb-2 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full">
            <CheckCircle2 size={13} className="text-emerald-500" />
            <span>تمام {toPersianNum(products.length)} محصول نمایش داده شدند</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedProductGrid;

