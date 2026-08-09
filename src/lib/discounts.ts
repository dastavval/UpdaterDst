
export interface DiscountTier {
  threshold: number; // In currency units (Toman) or Quantity
  discountPercent: number;
}

export const VOLUME_DISCOUNT_TIERS: DiscountTier[] = [
  { threshold: 10000000, discountPercent: 2 },  // 10 Million Toman -> 2%
  { threshold: 50000000, discountPercent: 5 },  // 50 Million Toman -> 5%
  { threshold: 150000000, discountPercent: 8 }, // 150 Million Toman -> 8%
  { threshold: 500000000, discountPercent: 12 }, // 500 Million Toman -> 12%
];

export const QUANTITY_DISCOUNT_TIERS: DiscountTier[] = [
  { threshold: 50, discountPercent: 3 },   // 50 Cartons -> 3%
  { threshold: 200, discountPercent: 7 },  // 200 Cartons -> 7%
  { threshold: 1000, discountPercent: 15 }, // 1000 Cartons -> 15%
];

export function calculateVolumeDiscount(totalAmount: number): number {
  let applicableDiscount = 0;
  for (const tier of VOLUME_DISCOUNT_TIERS) {
    if (totalAmount >= tier.threshold) {
      applicableDiscount = tier.discountPercent;
    }
  }
  return applicableDiscount;
}

export function calculateQuantityDiscount(totalQuantity: number): number {
  let applicableDiscount = 0;
  for (const tier of QUANTITY_DISCOUNT_TIERS) {
    if (totalQuantity >= tier.threshold) {
      applicableDiscount = tier.discountPercent;
    }
  }
  return applicableDiscount;
}

export function getBestDiscount(totalAmount: number, totalQuantity: number): { percent: number; type: 'volume' | 'quantity' | 'none' } {
  const volumeDiscount = calculateVolumeDiscount(totalAmount);
  const quantityDiscount = calculateQuantityDiscount(totalQuantity);

  if (volumeDiscount >= quantityDiscount && volumeDiscount > 0) {
    return { percent: volumeDiscount, type: 'volume' };
  } else if (quantityDiscount > volumeDiscount) {
    return { percent: quantityDiscount, type: 'quantity' };
  }
  
  return { percent: 0, type: 'none' };
}
