import { LoyaltySummary, LoyaltyTier, LoyaltyTransaction, Order } from "../types";
import { getApiUrl } from "../utils/api-utils";

export const LOYALTY_CONFIG = {
  // هر ۱۰۰ هزار تومان خرید = ۱ امتیاز پایه
  TOMAN_PER_POINT_AWARD: 100000,
  // هر ۱ امتیاز = ۱,۰۰۰ تومان تخفیف نقدی در فاکتور بعدی
  TOMAN_PER_POINT_REDEEM: 1000,
  // حداکثر سقف استفاده از امتیاز در یک خرید (مثلا تا ۳۰٪ مبلغ کل سفارش)
  MAX_REDEEM_PERCENT: 30,
  // حداقل امتیاز برای شروع تبدیل به تخفیف
  MIN_POINTS_TO_REDEEM: 10,
  // پاداش عضویت و ثبت نام اولیه
  WELCOME_BONUS_POINTS: 50,
  // پاداش دعوت از همکاران (به ازای هر خرید موفق همکار)
  REFERRAL_BONUS_POINTS: 100,
  // پاداش تسویه نقدی کامل فاکتور
  CASH_SETTLEMENT_BONUS_POINTS: 30,
  
  TIERS: {
    bronze: {
      key: 'bronze' as LoyaltyTier,
      label: 'برنزی',
      minSpend: 0,
      multiplier: 1.0,
      color: 'from-amber-700 to-amber-900',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: '🥉',
      perks: [
        'کسب ۱ امتیاز به ازای هر ۱۰۰ هزار تومان خرید عمده',
        'امکان تبدیل امتیاز به تخفیف نقدی مستقیم در فاکتور',
        'دسترسی به حراجی‌ها و جشنواره‌های دوره‌ای'
      ]
    },
    silver: {
      key: 'silver' as LoyaltyTier,
      label: 'نقره‌ای',
      minSpend: 50000000, // ۵۰ میلیون تومان خرید تجمعی
      multiplier: 1.25,
      color: 'from-slate-400 to-slate-600',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
      icon: '🥈',
      perks: [
        '۲۵٪ امتیاز بیشتر (ضریب ۱.۲۵)',
        'اولویت در نوبت بسته‌بندی و بارگیری انبار مرکزی',
        'تخفیف ویژه در ترخیص کالاهای پای بار و کف بازار'
      ]
    },
    gold: {
      key: 'gold' as LoyaltyTier,
      label: 'طلایی',
      minSpend: 100000000, // ۱۰۰ میلیون تومان خرید تجمعی
      multiplier: 1.5,
      color: 'from-amber-400 to-yellow-600',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-400',
      icon: '🥇',
      perks: [
        '۵۰٪ امتیاز بیشتر (ضریب ۱.۵)',
        'بیمه رایگان باربری و تضمین سلامت ۱۰۰٪ تحویل کالا',
        'سهمیه ویژه کالاهای پرتقاضای شرکت‌های بزرگ',
        'امکان رزرو بار بدون بیعانه تا ۲۴ ساعت'
      ]
    },
    platinum: {
      key: 'platinum' as LoyaltyTier,
      label: 'پلاتینیوم (VIP)',
      minSpend: 250000000, // ۲۵۰ میلیون تومان خرید تجمعی
      multiplier: 2.0,
      color: 'from-indigo-600 to-purple-800',
      badgeBg: 'bg-purple-50 text-purple-900 border-purple-300',
      icon: '💎',
      perks: [
        '۲ برابر امتیاز در تمامی خریدها (ضریب ۲.۰)',
        'مدیر حساب اختصاصی و پشتیبانی اولویت‌دار مستقیم کارخانه',
        'اعطای خط اعتباری و خرید چکی با طولانی‌ترین مهلت تسویه',
        'ارسال هدایای سالانه و نمونه‌بارهای جدید رایگان'
      ]
    }
  }
};

/**
 * کلید محلی جهت ذخیره‌سازی ترنزکشن‌ها و امتیازهای کاربر
 */
function getStorageKey(userIdentifier: string): string {
  const clean = String(userIdentifier || "guest").replace(/\D/g, "") || String(userIdentifier || "guest");
  return `dastavval_loyalty_${clean}`;
}

/**
 * تعیین سطح وفاداری مشتری بر اساس مجموع خریدهای قبلی
 */
export function determineLoyaltyTier(totalSpentToman: number): LoyaltyTier {
  if (totalSpentToman >= LOYALTY_CONFIG.TIERS.platinum.minSpend) return 'platinum';
  if (totalSpentToman >= LOYALTY_CONFIG.TIERS.gold.minSpend) return 'gold';
  if (totalSpentToman >= LOYALTY_CONFIG.TIERS.silver.minSpend) return 'silver';
  return 'bronze';
}

/**
 * محاسبه امتیاز دریافتی برای یک سفارش با احتساب ضریب سطح مشتری
 */
export function calculatePointsForOrder(orderAmountToman: number, tier: LoyaltyTier = 'bronze'): number {
  if (!orderAmountToman || orderAmountToman <= 0) return 0;
  const basePoints = Math.floor(orderAmountToman / LOYALTY_CONFIG.TOMAN_PER_POINT_AWARD);
  const multiplier = LOYALTY_CONFIG.TIERS[tier]?.multiplier || 1.0;
  return Math.max(1, Math.round(basePoints * multiplier));
}

/**
 * محاسبه ارزش ریالی امتیاز جهت اعمال تخفیف
 */
export function calculateDiscountFromPoints(points: number): number {
  if (!points || points <= 0) return 0;
  return points * LOYALTY_CONFIG.TOMAN_PER_POINT_REDEEM;
}

/**
 * محاسبه سقف امتیاز قابل استفاده برای یک سفارش
 */
export function calculateMaxRedeemablePoints(availablePoints: number, orderTotalAmount: number): {
  maxPoints: number;
  maxDiscountToman: number;
} {
  if (!availablePoints || availablePoints < LOYALTY_CONFIG.MIN_POINTS_TO_REDEEM || !orderTotalAmount) {
    return { maxPoints: 0, maxDiscountToman: 0 };
  }

  // سقف مجاز تخفیف بر اساس درصد سفارش (۳۰٪)
  const maxAllowedDiscountToman = Math.floor((orderTotalAmount * LOYALTY_CONFIG.MAX_REDEEM_PERCENT) / 100);
  const maxPointsAllowedByOrder = Math.floor(maxAllowedDiscountToman / LOYALTY_CONFIG.TOMAN_PER_POINT_REDEEM);

  const usablePoints = Math.min(availablePoints, maxPointsAllowedByOrder);
  const usableDiscountToman = usablePoints * LOYALTY_CONFIG.TOMAN_PER_POINT_REDEEM;

  return {
    maxPoints: usablePoints,
    maxDiscountToman: usableDiscountToman
  };
}

/**
 * دریافت گزارش کامل باشگاه مشتریان کاربر شامل امتیاز فعلی، سطح، سوابق و وضعیت گام بعدی
 */
export function getLoyaltySummary(userIdentifier: string, userOrders: Order[] = []): LoyaltySummary {
  const cleanId = String(userIdentifier || "").trim();
  let transactions: LoyaltyTransaction[] = [];

  if (typeof window !== "undefined" && cleanId) {
    try {
      const stored = localStorage.getItem(getStorageKey(cleanId));
      if (stored) {
        transactions = JSON.parse(stored);
      }
    } catch (e) {
      console.warn("Error reading local loyalty transactions:", e);
    }
  }

  // محاسبه مجموع خریدهای کاربر
  const userPhoneClean = cleanId.replace(/\D/g, "");
  const relevantOrders = userOrders.filter(o => {
    const oPhone = String(o.buyerPhone || o.buyerInfo?.phone || "").replace(/\D/g, "");
    return (userPhoneClean && oPhone && oPhone === userPhoneClean) || o.userId === cleanId;
  });

  const totalSpentFromOrders = relevantOrders.reduce((sum, o) => {
    if (o.status !== 'cancelled') {
      return sum + (Number(o.totalAmount) || 0);
    }
    return sum;
  }, 0);

  // اگر تراکنش اولیه‌ای وجود ندارد اما کاربر لاگین است، ۵۰ امتیاز خوش‌آمدگویی هدیه داده می‌شود
  if (transactions.length === 0 && cleanId) {
    const welcomeTx: LoyaltyTransaction = {
      id: `ltx_welcome_${Date.now()}`,
      userId: cleanId,
      userPhone: cleanId,
      points: LOYALTY_CONFIG.WELCOME_BONUS_POINTS,
      type: 'bonus_welcome',
      description: 'هدیه خوش‌آمدگویی و فعال‌سازی باشگاه مشتریان دست‌اول',
      createdAt: new Date().toISOString()
    };
    transactions.push(welcomeTx);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(getStorageKey(cleanId), JSON.stringify(transactions));
      } catch (e) {}
    }
  }

  // محاسبه امتیاز کل فعال و مجموع به دست آمده
  let currentPoints = 0;
  let lifetimePoints = 0;

  for (const tx of transactions) {
    currentPoints += tx.points;
    if (tx.points > 0) {
      lifetimePoints += tx.points;
    }
  }

  currentPoints = Math.max(0, currentPoints);

  const tier = determineLoyaltyTier(totalSpentFromOrders);
  const tierInfo = LOYALTY_CONFIG.TIERS[tier];

  // محاسبه پیشرفت به سطح بعدی
  let nextTierInfo: LoyaltySummary['nextTier'] = null;
  if (tier === 'bronze') {
    const target = LOYALTY_CONFIG.TIERS.silver.minSpend;
    const progress = Math.min(100, Math.round((totalSpentFromOrders / target) * 100));
    nextTierInfo = {
      tier: 'silver',
      label: LOYALTY_CONFIG.TIERS.silver.label,
      requiredSpend: target,
      currentProgressPercent: progress,
      remainingSpend: Math.max(0, target - totalSpentFromOrders)
    };
  } else if (tier === 'silver') {
    const target = LOYALTY_CONFIG.TIERS.gold.minSpend;
    const progress = Math.min(100, Math.round(((totalSpentFromOrders - LOYALTY_CONFIG.TIERS.silver.minSpend) / (target - LOYALTY_CONFIG.TIERS.silver.minSpend)) * 100));
    nextTierInfo = {
      tier: 'gold',
      label: LOYALTY_CONFIG.TIERS.gold.label,
      requiredSpend: target,
      currentProgressPercent: progress,
      remainingSpend: Math.max(0, target - totalSpentFromOrders)
    };
  } else if (tier === 'gold') {
    const target = LOYALTY_CONFIG.TIERS.platinum.minSpend;
    const progress = Math.min(100, Math.round(((totalSpentFromOrders - LOYALTY_CONFIG.TIERS.gold.minSpend) / (target - LOYALTY_CONFIG.TIERS.gold.minSpend)) * 100));
    nextTierInfo = {
      tier: 'platinum',
      label: LOYALTY_CONFIG.TIERS.platinum.label,
      requiredSpend: target,
      currentProgressPercent: progress,
      remainingSpend: Math.max(0, target - totalSpentFromOrders)
    };
  }

  return {
    userId: cleanId,
    userPhone: cleanId,
    currentPoints,
    lifetimePoints,
    totalSpent: totalSpentFromOrders,
    tier,
    tierLabel: tierInfo.label,
    tierBadgeColor: tierInfo.badgeBg,
    pointMultiplier: tierInfo.multiplier,
    redeemableTomanValue: currentPoints * LOYALTY_CONFIG.TOMAN_PER_POINT_REDEEM,
    nextTier: nextTierInfo,
    transactions: [...transactions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  };
}

/**
 * اضافه کردن امتیاز به حساب مشتری پس از ثبت سفارش
 */
export async function awardLoyaltyPointsForOrder(
  userIdentifier: string,
  orderTrackingNumber: string,
  orderAmountToman: number,
  customPoints?: number
): Promise<{ pointsEarned: number; newTotal: number }> {
  const cleanId = String(userIdentifier || "").trim();
  if (!cleanId) return { pointsEarned: 0, newTotal: 0 };

  const summary = getLoyaltySummary(cleanId);
  const earned = customPoints !== undefined ? customPoints : calculatePointsForOrder(orderAmountToman, summary.tier);

  if (earned <= 0) return { pointsEarned: 0, newTotal: summary.currentPoints };

  const newTx: LoyaltyTransaction = {
    id: `ltx_earn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: cleanId,
    userPhone: cleanId,
    points: earned,
    type: 'earned_purchase',
    description: `کسب امتیاز از ثبت موفق سفارش عمده #${orderTrackingNumber}`,
    orderTrackingNumber,
    orderAmount: orderAmountToman,
    createdAt: new Date().toISOString()
  };

  const key = getStorageKey(cleanId);
  let list: LoyaltyTransaction[] = [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) list = JSON.parse(stored);
  } catch (e) {}

  list.unshift(newTx);
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("dastavval-loyalty-updated", { detail: { userIdentifier: cleanId } }));
  } catch (e) {}

  // ذخیره در سرور PHP / MySQL به صورت موازی
  try {
    fetch(getApiUrl("/api/loyalty/award"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIdentifier: cleanId,
        orderTrackingNumber,
        orderAmount: orderAmountToman,
        points: earned,
        description: newTx.description
      })
    }).catch(() => {});
  } catch (e) {}

  return { pointsEarned: earned, newTotal: summary.currentPoints + earned };
}

/**
 * کسر امتیاز و اعمال تخفیف در فاکتور سفارش
 */
export async function redeemLoyaltyPoints(
  userIdentifier: string,
  pointsToRedeem: number,
  orderTrackingNumber: string,
  discountToman: number
): Promise<{ success: boolean; newTotal: number }> {
  const cleanId = String(userIdentifier || "").trim();
  if (!cleanId || pointsToRedeem <= 0) return { success: false, newTotal: 0 };

  const summary = getLoyaltySummary(cleanId);
  if (summary.currentPoints < pointsToRedeem) {
    return { success: false, newTotal: summary.currentPoints };
  }

  const newTx: LoyaltyTransaction = {
    id: `ltx_redeem_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: cleanId,
    userPhone: cleanId,
    points: -Math.abs(pointsToRedeem),
    type: 'redeemed_discount',
    description: `استفاده از ${pointsToRedeem} امتیاز برای دریافت ${discountToman.toLocaleString('fa-IR')} تومان تخفیف در فاکتور #${orderTrackingNumber}`,
    orderTrackingNumber,
    discountAmount: discountToman,
    createdAt: new Date().toISOString()
  };

  const key = getStorageKey(cleanId);
  let list: LoyaltyTransaction[] = [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) list = JSON.parse(stored);
  } catch (e) {}

  list.unshift(newTx);
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("dastavval-loyalty-updated", { detail: { userIdentifier: cleanId } }));
  } catch (e) {}

  // ارسال به سرور
  try {
    fetch(getApiUrl("/api/loyalty/redeem"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIdentifier: cleanId,
        orderTrackingNumber,
        points: pointsToRedeem,
        discountAmount: discountToman
      })
    }).catch(() => {});
  } catch (e) {}

  return { success: true, newTotal: summary.currentPoints - pointsToRedeem };
}

/**
 * اعطای امتیاز دستی یا پاداش از طرف مدیریت / سیستم
 */
export async function addManualBonusPoints(
  userIdentifier: string,
  points: number,
  reason: string,
  type: LoyaltyTransaction['type'] = 'admin_gift'
): Promise<number> {
  const cleanId = String(userIdentifier || "").trim();
  if (!cleanId || points === 0) return 0;

  const newTx: LoyaltyTransaction = {
    id: `ltx_manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: cleanId,
    userPhone: cleanId,
    points,
    type,
    description: reason || (points > 0 ? 'اعطای امتیاز هدیه از طرف مدیریت' : 'کسر امتیاز انضباطی'),
    createdAt: new Date().toISOString()
  };

  const key = getStorageKey(cleanId);
  let list: LoyaltyTransaction[] = [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) list = JSON.parse(stored);
  } catch (e) {}

  list.unshift(newTx);
  try {
    localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("dastavval-loyalty-updated", { detail: { userIdentifier: cleanId } }));
  } catch (e) {}

  return points;
}
