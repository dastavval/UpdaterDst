import { DiscountCoupon } from '../types';

const COUPONS_STORAGE_KEY = 'dastavval_discount_coupons_v1';

export const INITIAL_DEFAULT_COUPONS: DiscountCoupon[] = [
  {
    id: 'coup-welcome-10',
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    title: 'تخفیف ۱۰٪ سفارش اول بنکداران',
    minOrderAmount: 2000000,
    maxDiscountAmount: 3000000,
    usageLimit: 100,
    usedCount: 14,
    isActive: true,
    description: 'تخفیف ۱۰ درصدی ویژه اولین خرید عمده از سامانه دست‌اول تا سقف ۳ میلیون تومان',
    createdAt: '1403/06/01'
  },
  {
    id: 'coup-fixed-500k',
    code: 'VIP500K',
    type: 'fixed_amount',
    value: 500000,
    title: 'هدیه ۵۰۰ هزار تومانی کارخانجات',
    minOrderAmount: 5000000,
    usageLimit: 50,
    usedCount: 8,
    isActive: true,
    description: 'تخفیف نقدی ۵۰۰,۰۰۰ تومانی برای فاکتورهای بالای ۵ میلیون تومان',
    createdAt: '1403/06/01'
  },
  {
    id: 'coup-fest-15',
    code: 'DASTAVVAL15',
    type: 'percentage',
    value: 15,
    title: 'تخفیف طلایی ۱۵٪ همکاری سازمانی',
    minOrderAmount: 10000000,
    maxDiscountAmount: 5000000,
    usageLimit: 30,
    usedCount: 5,
    isActive: true,
    description: 'تخفیف سازمانی ۱۵ درصدی برای خریدهای تیراژ بالا تا سقف ۵ میلیون تومان',
    createdAt: '1403/06/01'
  },
  {
    id: 'coup-fest-100k',
    code: 'BONUS100',
    type: 'fixed_amount',
    value: 100000,
    title: 'تخفیف ۱۰۰ هزار تومانی ثبت سریع',
    minOrderAmount: 1000000,
    usageLimit: 200,
    usedCount: 32,
    isActive: true,
    description: 'تخفیف سریع ۱۰۰,۰۰۰ تومانی برای تمامی سفارش‌های بالای ۱ میلیون تومان',
    createdAt: '1403/06/01'
  }
];

export function getStoredCoupons(): DiscountCoupon[] {
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read coupons from localStorage', e);
  }
  // Initialize with defaults if empty
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_COUPONS));
  } catch (e) {}
  return INITIAL_DEFAULT_COUPONS;
}

export function saveCoupons(coupons: DiscountCoupon[]): void {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
    // Also try to sync with server in background if endpoint exists
    fetch('/api/b2b/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupons })
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to save coupons', e);
  }
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  coupon?: DiscountCoupon;
  discountAmount?: number;
  discountPercent?: number;
}

export function validateCouponCode(
  code: string,
  grossAmount: number
): CouponValidationResult {
  if (!code || !code.trim()) {
    return { valid: false, message: 'لطفاً کد تخفیف را وارد فرمایید.' };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupons = getStoredCoupons();
  const found = coupons.find(c => c.code.trim().toUpperCase() === cleanCode);

  if (!found) {
    return { valid: false, message: 'کد تخفیف وارد شده معتبر نمی‌باشد.' };
  }

  if (!found.isActive) {
    return { valid: false, message: 'این کد تخفیف در حال حاضر غیرفعال می‌باشد.' };
  }

  if (found.usageLimit && found.usedCount && found.usedCount >= found.usageLimit) {
    return { valid: false, message: 'ظرفیت استفاده از این کد تخفیف به پایان رسیده است.' };
  }

  if (found.minOrderAmount && grossAmount < found.minOrderAmount) {
    return { 
      valid: false, 
      message: `این کد تخفیف برای حداقل مبلغ ${found.minOrderAmount.toLocaleString('fa-IR')} تومان قابل اعمال است.` 
    };
  }

  // Calculate discount amount
  let discountAmount = 0;
  let discountPercent = 0;

  if (found.type === 'percentage') {
    discountPercent = Number(found.value) || 0;
    discountAmount = Math.round(grossAmount * (discountPercent / 100));
    if (found.maxDiscountAmount && discountAmount > found.maxDiscountAmount) {
      discountAmount = found.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(grossAmount, Number(found.value) || 0);
  }

  return {
    valid: true,
    message: `کد تخفیف «${found.title}» با موفقیت اعمال گردید.`,
    coupon: found,
    discountAmount,
    discountPercent: found.type === 'percentage' ? found.value : undefined
  };
}

export function incrementCouponUsage(couponIdOrCode: string): void {
  try {
    const coupons = getStoredCoupons();
    const clean = couponIdOrCode.trim().toUpperCase();
    const updated = coupons.map(c => {
      if (c.id === couponIdOrCode || c.code.trim().toUpperCase() === clean) {
        return {
          ...c,
          usedCount: (c.usedCount || 0) + 1
        };
      }
      return c;
    });
    saveCoupons(updated);
  } catch (e) {
    console.error('Failed to increment coupon usage', e);
  }
}
