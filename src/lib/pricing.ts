import { Product, User, B2BConfig } from "../types";

export type UserRole = 'guest' | 'customer' | 'user' | 'marketer' | 'agent' | 'leader' | 'representative' | 'factory' | 'supplier' | 'admin';

export interface RolePricingInfo {
  userRole: UserRole;
  roleTitleFa: string;
  isRepresentative: boolean;
  isRepresentativeQualified: boolean; // Has >= 300M sales or manual admin approval
  isMarketer: boolean;
  isFactory: boolean;
  isCustomerOrGuest: boolean;
  
  // Per Unit Pricing
  floorFactoryUnitPrice: number; // قیمت کاتالوگ / نرخ کف نمایندگی
  unitWholesalePrice: number;    // قیمت پرداختی کاربر
  displayConsumerPrice: number;  // قیمت مصرف کننده
  pricePerCarton: number;        // قیمت هر کارتن بر اساس نقش
  
  // Discrepancy / Margins & Config
  customerMarkupPercent: number; // قابل تنظیم در ادمین (پیش‌فرض ۱۰٪)
  representativeDiscountPercent: number; // درصد تخفیف نماینده نسبت به مشتری
  repSavingsPerUnit: number;     // چقدر نماینده ارزان‌تر می‌خرد
  repSavingsPerCarton: number;   // سود نماینده در هر کارتن نسبت به خریدار
  marketerCommissionPercent: number; // قابل تنظیم در ادمین (پیش‌فرض ۵٪)
  marketerCommissionPerCarton: number; // پورسانت بازاریاب در هر کارتن
  repRegionalProfitSharePercent: number; // سهم سود نماینده از فروش سایت در شهر (پیش‌فرض ۵۰٪)
  
  // Profit vs Retail Consumer Price
  unitProfitVsConsumer: number;
  profitPerCartonVsConsumer: number;
  profitMarginPercent: number;
  
  // Loyalty Badge
  badgeDiscountPercent: number;
  
  // Sub-300M Warning / State
  requiresAdminApprovalForRepPrice: boolean;
  approvalWarningMessage?: string;
  
  // UI Presentation
  priceTagLabel: string;
  badgeLabel: string;
  badgeColor: string;
  tierComparisonNote: string;
}

/**
 * Helper to fetch dynamic B2B Config with fallback defaults
 */
export function getB2BPricingConfig(): {
  customerMarkupPercent: number;
  marketerCommissionPercent: number;
  repRegionalProfitSharePercent: number;
  requireRep300mPurchaseForFloorPrice: boolean;
} {
  try {
    const raw = localStorage.getItem("dastavval_b2b_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        customerMarkupPercent: typeof parsed.customerMarkupPercent === 'number' ? parsed.customerMarkupPercent : 10,
        marketerCommissionPercent: typeof parsed.marketerCommissionPercent === 'number' ? parsed.marketerCommissionPercent : 5,
        repRegionalProfitSharePercent: typeof parsed.repRegionalProfitSharePercent === 'number' ? parsed.repRegionalProfitSharePercent : 50,
        requireRep300mPurchaseForFloorPrice: parsed.requireRep300mPurchaseForFloorPrice !== false
      };
    }
  } catch (e) {
    console.warn("Could not read dastavval_b2b_config:", e);
  }
  return {
    customerMarkupPercent: 10,
    marketerCommissionPercent: 5,
    repRegionalProfitSharePercent: 50,
    requireRep300mPurchaseForFloorPrice: true
  };
}

/**
 * Core Dynamic Role-Based Pricing Calculator
 * 
 * Rules:
 * 1. Catalog Price is the Representative Floor Price (`product.bulk_price`).
 * 2. Customer / Retail Store buys at Catalog Price + Site Markup % (configurable in Admin, default 10%).
 * 3. Marketer Commission % is calculated on the customer price and credited to marketer (configurable in Admin, default 5%).
 * 4. Representative with < 300M purchases requires Admin Approval to unlock Catalog Floor Price.
 * 5. When site sells in Representative's region/city, Representative receives profit share % (configurable in Admin, default 50%).
 */
export function getProductRolePricing(
  product: Product,
  user?: any,
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin',
  overrideConfig?: Partial<B2BConfig>
): RolePricingInfo {
  const config = {
    ...getB2BPricingConfig(),
    ...(overrideConfig || {})
  };

  const rawRole = (user?.role || 'guest').toLowerCase() as UserRole;
  
  const isRepRole = rawRole === 'representative';
  const isMarketer = rawRole === 'marketer' || rawRole === 'agent' || rawRole === 'leader';
  const isFactory = rawRole === 'factory' || rawRole === 'supplier';
  const isAdmin = rawRole === 'admin' || userBadge === 'admin';

  // Check 300M Rule & Admin Approval Status for Representative
  const totalSales = Number(user?.totalSales || 0);
  const is300mAchieved = totalSales >= 300_000_000;
  const isExplicitlyApprovedByAdmin = 
    user?.isRepresentativeApproved === true || 
    user?.agencyApproved === true || 
    user?.manualFloorPriceApproved === true ||
    user?.isRepresentativeActive === true;

  // Rep is fully qualified if: 
  // (Not enforcing 300M rule) OR (Sales >= 300M) OR (Admin explicitly approved them)
  const isRepresentativeQualified = isRepRole && (!config.requireRep300mPurchaseForFloorPrice || is300mAchieved || isExplicitlyApprovedByAdmin);
  
  // Requires approval if they are marked as rep but haven't reached 300M and don't have admin approval
  const requiresAdminApprovalForRepPrice = isRepRole && !is300mAchieved && !isExplicitlyApprovedByAdmin;

  const isRepresentative = isRepresentativeQualified;
  const isCustomerOrGuest = !isRepresentative && !isMarketer && !isFactory && !isAdmin;

  // Base Floor Price (قیمت کاتالوگ / کف نرخ کارخانه)
  // New products (and potentially all products per user request context) get a 10% base markup
  const basePriceMarkupMultiplier = 1.1; 
  const floorFactoryUnitPrice = Math.round(Math.max(1, product.bulk_price || product.price || 1) * basePriceMarkupMultiplier);
  
  const packCount = Math.max(1, product.carton_pack_count || 1);
  const displayConsumerPrice = Math.max(floorFactoryUnitPrice, product.consumer_price || product.price || (floorFactoryUnitPrice * 1.25));

  // Partner Loyalty Badge Discounts
  let badgeDiscountPercent = 0;
  if (!isFactory) {
    if (userBadge === 'silver') badgeDiscountPercent = 2;
    else if (userBadge === 'gold') badgeDiscountPercent = 5;
    else if (userBadge === 'vip') badgeDiscountPercent = 8;
    else if (userBadge === 'admin') badgeDiscountPercent = 10;
  }

  // 1. Calculate Base Wholesale Unit Price based on Role and Config
  const customerMarkupMultiplier = 1 + (config.customerMarkupPercent / 100);
  let baseUnitWholesale = floorFactoryUnitPrice;

  if (isRepresentative || isFactory || isAdmin) {
    // Representatives buy at floorFactoryUnitPrice (which already has 10% markup)
    // and we want them to "buy with 10% discount" relative to the customer price.
    // Since Customer = Floor * 1.1, then Representative = Customer * 0.909 (approx 10% discount)
    baseUnitWholesale = floorFactoryUnitPrice;
  } else {
    // Customers, Marketers buy at Floor * 1.1 (Total markup is 1.1 * 1.1 = 1.21 from raw base)
    baseUnitWholesale = Math.round(floorFactoryUnitPrice * customerMarkupMultiplier);
  }

  // Apply badge discount on the calculated price
  const unitWholesalePrice = badgeDiscountPercent > 0
    ? Math.round(baseUnitWholesale * (1 - badgeDiscountPercent / 100))
    : baseUnitWholesale;

  const pricePerCarton = unitWholesalePrice * packCount;

  // Profit vs Retail Consumer Price
  const unitProfitVsConsumer = Math.max(0, displayConsumerPrice - unitWholesalePrice);
  const profitPerCartonVsConsumer = unitProfitVsConsumer * packCount;
  const profitMarginPercent = unitWholesalePrice > 0 
    ? Math.round((unitProfitVsConsumer / unitWholesalePrice) * 100) 
    : 0;

  // Representative Spread / Advantage
  const customerStandardUnit = Math.round(floorFactoryUnitPrice * customerMarkupMultiplier);
  const repSavingsPerUnit = Math.max(0, customerStandardUnit - floorFactoryUnitPrice);
  const repSavingsPerCarton = repSavingsPerUnit * packCount;

  // Marketer Commission (Configurable, e.g. 5%)
  const customerCartonTotal = customerStandardUnit * packCount;
  const marketerCommissionPerCarton = Math.round(customerCartonTotal * (config.marketerCommissionPercent / 100));

  // Determine Persian Labels and Styling
  let roleTitleFa = "خریدار و مغازه‌دار";
  let priceTagLabel = "قیمت خرید مغازه و مشتری";
  let badgeLabel = `قیمت عمده (${config.customerMarkupPercent}٪ مارک‌آپ)`;
  let badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
  let tierComparisonNote = `تخفیف ${config.customerMarkupPercent}٪ ویژه نمایندگان رسمی پس از احراز خرید ۳۰۰M`;
  let approvalWarningMessage: string | undefined = undefined;

  if (requiresAdminApprovalForRepPrice) {
    roleTitleFa = "متقاضی عاملیت (در انتظار تایید ۳۰۰M)";
    priceTagLabel = "قیمت خرید موقت (نرخ مشتری)";
    badgeLabel = "نیازمند تأیید ۳۰۰M ادمین";
    badgeColor = "bg-amber-50 text-amber-800 border-amber-300";
    tierComparisonNote = "برای خرید با نرخ کف کارخانه، احراز حداقل ۳۰۰ میلیون خرید نقدی یا تأیید اختصاصی مدیریت الزامی است.";
    approvalWarningMessage = "توجه: نرخ کف نمایندگی منوط به سقف خرید ۳۰۰ میلیون یا تأیید مستقیم مدیریت در پنل ادمین می‌باشد.";
  } else if (isRepresentative) {
    roleTitleFa = "نماینده رسمی و انحصاری";
    priceTagLabel = "قیمت کاتالوگ (کف نرخ نمایندگی)";
    badgeLabel = `کف قیمت کارخانه (${config.customerMarkupPercent}٪ تخفیف عاملیت)`;
    badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
    tierComparisonNote = `${config.customerMarkupPercent}٪ ارزان‌تر از قیمت خرید مغازه‌داران و بنکداران عادی`;
  } else if (isMarketer) {
    roleTitleFa = "بازاریاب و ویزیتور فعال";
    priceTagLabel = "قیمت فروش به مشتری";
    badgeLabel = `پورسانت شما: ${config.marketerCommissionPercent}٪ نقدی`;
    badgeColor = "bg-purple-50 text-purple-800 border-purple-200";
    tierComparisonNote = `با هر سفارش، مبلغ ${marketerCommissionPerCarton.toLocaleString('fa-IR')} تومان در هر کارتن به اعتبارتان واریز می‌شود`;
  } else if (isFactory) {
    roleTitleFa = "تامین‌کننده و کارخانه";
    priceTagLabel = "نرخ پایه درب کارخانه";
    badgeLabel = "تامین‌کننده اصلی";
    badgeColor = "bg-blue-50 text-blue-800 border-blue-200";
    tierComparisonNote = "قیمت مصوب خط تولید کاتالوگ";
  } else if (isAdmin) {
    roleTitleFa = "مدیریت ارشد سامانه";
    priceTagLabel = "نرخ کاتالوگ و مدیریت";
    badgeLabel = "دسترسی ادمین (کف قیمت)";
    badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
    tierComparisonNote = "دسترسی با نرخ کف کاتالوگ";
  }

  return {
    userRole: rawRole,
    roleTitleFa,
    isRepresentative,
    isRepresentativeQualified,
    isMarketer,
    isFactory,
    isCustomerOrGuest,
    floorFactoryUnitPrice,
    unitWholesalePrice,
    displayConsumerPrice,
    pricePerCarton,
    customerMarkupPercent: config.customerMarkupPercent,
    representativeDiscountPercent: config.customerMarkupPercent,
    repSavingsPerUnit,
    repSavingsPerCarton,
    marketerCommissionPercent: config.marketerCommissionPercent,
    marketerCommissionPerCarton,
    repRegionalProfitSharePercent: config.repRegionalProfitSharePercent,
    unitProfitVsConsumer,
    profitPerCartonVsConsumer,
    profitMarginPercent,
    badgeDiscountPercent,
    requiresAdminApprovalForRepPrice,
    approvalWarningMessage,
    priceTagLabel,
    badgeLabel,
    badgeColor,
    tierComparisonNote
  };
}

/**
 * Persian number formatter
 */
export function toPersianDigits(num: number | string | undefined | null): string {
  if (num === undefined || num === null) return "";
  const persianDigits: Record<string, string> = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
    "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
  };
  return num.toString().replace(/[0-9]/g, (w) => persianDigits[w] || w);
}

