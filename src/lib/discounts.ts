
export interface DiscountTier {
  threshold: number; // In currency units (Toman) or Quantity
  discountPercent: number;
}

export function getVolumeDiscountTiers(): DiscountTier[] {
  try {
    const saved = localStorage.getItem("dastavval_b2b_config");
    if (saved) {
      const config = JSON.parse(saved);
      if (config && config.volumeDiscountTiers && Array.isArray(config.volumeDiscountTiers)) {
        return config.volumeDiscountTiers;
      }
    }
  } catch (e) {}
  return [
    { threshold: 10000000, discountPercent: 2 },  // 10 Million Toman -> 2%
    { threshold: 50000000, discountPercent: 5 },  // 50 Million Toman -> 5%
    { threshold: 150000000, discountPercent: 8 }, // 150 Million Toman -> 8%
    { threshold: 500000000, discountPercent: 12 }, // 500 Million Toman -> 12%
  ];
}

export function getQuantityDiscountTiers(): DiscountTier[] {
  try {
    const saved = localStorage.getItem("dastavval_b2b_config");
    if (saved) {
      const config = JSON.parse(saved);
      if (config && config.quantityDiscountTiers && Array.isArray(config.quantityDiscountTiers)) {
        return config.quantityDiscountTiers;
      }
    }
  } catch (e) {}
  return [
    { threshold: 10, discountPercent: 3 },   // 10 Cartons -> 3%
    { threshold: 25, discountPercent: 6 },   // 25 Cartons -> 6%
    { threshold: 50, discountPercent: 10 },  // 50 Cartons -> 10%
  ];
}

export function calculateVolumeDiscount(totalAmount: number): number {
  let applicableDiscount = 0;
  const tiers = getVolumeDiscountTiers();
  for (const tier of tiers) {
    if (totalAmount >= tier.threshold) {
      applicableDiscount = tier.discountPercent;
    }
  }
  return applicableDiscount;
}

export function calculateQuantityDiscount(totalQuantity: number): number {
  let applicableDiscount = 0;
  const tiers = getQuantityDiscountTiers();
  for (const tier of tiers) {
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

