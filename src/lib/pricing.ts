import { Product, User, B2BConfig } from "../types";
import { calculateDealershipTier } from "../utils/dealershipCityTiers";

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
  customerPrice: number;         // قیمت خریدار عادی و مغازه‌دار
  representativeFloorPrice: number; // نرخ کف کارخانه برای نماینده
  consumerPrice: number;         // قیمت مصرف‌کننده مصوب
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
  specialOfferMarkupPercent: number;
  marketerCommissionPercent: number;
  repRegionalProfitSharePercent: number;
  requireRep300mPurchaseForFloorPrice: boolean;
} {
  try {
    const raw = localStorage.getItem("dastavval_b2b_config");
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        customerMarkupPercent: typeof parsed.customerMarkupPercent === 'number' ? parsed.customerMarkupPercent : 20,
        specialOfferMarkupPercent: typeof parsed.specialOfferMarkupPercent === 'number' ? parsed.specialOfferMarkupPercent : 10,
        marketerCommissionPercent: typeof parsed.marketerCommissionPercent === 'number' ? parsed.marketerCommissionPercent : 5,
        repRegionalProfitSharePercent: typeof parsed.repRegionalProfitSharePercent === 'number' ? parsed.repRegionalProfitSharePercent : 50,
        requireRep300mPurchaseForFloorPrice: parsed.requireRep300mPurchaseForFloorPrice !== false
      };
    }
  } catch (e) {
    console.warn("Could not read dastavval_b2b_config:", e);
  }
  return {
    customerMarkupPercent: 20,
    specialOfferMarkupPercent: 10,
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

  const rawRole = (user?.role || 'guest').toLowerCase();
  
  const isRepRole = 
    rawRole === 'representative' || 
    rawRole === 'agency' || 
    user?.isRepresentative === true || 
    user?.isRepresentativeActive === true || 
    user?.isRepresentativeApproved === true || 
    user?.agencyApproved === true || 
    user?.dealershipStatus === 'approved' || 
    userBadge === 'vip';

  const isMarketer = rawRole === 'marketer' || rawRole === 'agent' || rawRole === 'leader';
  const isFactory = rawRole === 'factory' || rawRole === 'supplier';
  const isAdmin = rawRole === 'admin' || userBadge === 'admin';

  // Check 60-day Inactivity Rule
  let isInactiveDueToTime = false;
  if (user?.lastOrderTimestamp || user?.lastOrderDate) {
    const lastDate = new Date(user.lastOrderTimestamp || user.lastOrderDate).getTime();
    if (!isNaN(lastDate)) {
      const daysSinceLastOrder = (Date.now() - lastDate) / (1000 * 60 * 60 * 24);
      if (daysSinceLastOrder > 60) {
        isInactiveDueToTime = true;
      }
    }
  }

  // Dynamic City Quota / Minimum Purchase Check:
  const cityData = calculateDealershipTier(user?.city, user?.province);
  const requiredMinPurchase = cityData.tier === 1 ? 300_000_000 : (cityData.monthlyQuotaCeilingToman || 80_000_000);

  const totalSales = Number(user?.totalSales || user?.totalPurchaseValue || 0);
  const isQuotaAchieved = totalSales >= requiredMinPurchase;
  const isExplicitlyApprovedByAdmin = 
    user?.isRepresentativeApproved === true || 
    user?.agencyApproved === true || 
    user?.manualFloorPriceApproved === true ||
    user?.isRepresentativeActive === true ||
    user?.dealershipStatus === 'approved' ||
    userBadge === 'vip' ||
    isRepRole;

  // Rep is fully qualified if they have rep role/approval and are not inactive
  const isRepresentativeQualified = isRepRole && !isInactiveDueToTime;
  
  const requiresAdminApprovalForRepPrice = false;

  const isRepresentative = isRepresentativeQualified;
  const isCustomerOrGuest = !isRepresentative && !isMarketer && !isFactory && !isAdmin;

  // Base Floor Price (قیمت کاتالوگ / کف نرخ کارخانه)
  const floorFactoryUnitPrice = Math.round(Math.max(1, product.bulk_price || product.price || 1));
  
  const packCount = Math.max(1, product.carton_pack_count || 1);
  const displayConsumerPrice = Math.max(floorFactoryUnitPrice, product.consumer_price || product.price || (floorFactoryUnitPrice * 1.25));

  // Partner Loyalty Badge Discounts
  let badgeDiscountPercent = 0;
  if (!isFactory) {
    if (userBadge === 'silver') badgeDiscountPercent = 2;
    else if (userBadge === 'gold') badgeDiscountPercent = 5;
    else if (userBadge === 'vip') badgeDiscountPercent = 8;
    else if (userBadge === 'admin') badgeDiscountPercent = 0; // 0% for Admin to display standard prices clearly
  }

  // 1. Calculate Base Wholesale Unit Price based on Role and Config
  const customerMarkupMultiplier = 1 + (config.customerMarkupPercent / 100);
  let baseUnitWholesale = floorFactoryUnitPrice;

  if (isRepresentative || isFactory) {
    // Representatives and Factories buy at exact Catalog Floor Price
    baseUnitWholesale = floorFactoryUnitPrice;
  } else {
    // Customers, Marketers, and Admins buy/view at Floor Price + Site Customer Markup % (e.g. 20%)
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
    priceTagLabel = "قیمت خرید مغازه و مشتری";
    badgeLabel = "نمای پیش‌فرض مدیریت";
    badgeColor = "bg-slate-100 text-slate-700 border-slate-200";
    tierComparisonNote = "سیستم در حال نمایش قیمت مشتریان عمومی (+۲۰٪ مارک‌آپ) است.";
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
    customerPrice: Math.round(floorFactoryUnitPrice * customerMarkupMultiplier),
    representativeFloorPrice: floorFactoryUnitPrice,
    consumerPrice: displayConsumerPrice,
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

export interface OfferPricingInfo {
  userRole: UserRole;
  isRepresentative: boolean;
  rawOfferDiscountPercent: number;
  appliedDiscountPercent: number;
  originalUnitPrice: number;
  discountedUnitPrice: number;
  discountedCartonPrice: number;
  itemsPerCarton: number;
  priceLabel: string;
  badgeText: string;
}

/**
 * Calculates Offer/Promotion Pricing safeguarding Dealership Margins:
 * - Representatives kafi is ALWAYS at least the representative floor price (floorFactoryUnitPrice). It never goes below it!
 * - For general customers/retail buyers, the price is calculated using a smaller configurable markup (specialOfferMarkupPercent, e.g. 10% instead of standard 20%)
 *   on top of the representative floor price. This gives general customers a discount without dropping to/below the representative's cost.
 */
export function getProductOfferPricing(
  product: Product,
  rawDiscountPercent: number = 0,
  user?: any,
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin',
  overrideConfig?: Partial<B2BConfig>
): OfferPricingInfo {
  const rolePricing = getProductRolePricing(product, user, userBadge, overrideConfig);
  const itemsPerCarton = Math.max(1, product.carton_pack_count || 1);
  const isRep = rolePricing.isRepresentative || rolePricing.isFactory;

  const config = {
    ...getB2BPricingConfig(),
    ...(overrideConfig || {})
  };

  const floorFactoryUnitPrice = rolePricing.floorFactoryUnitPrice;
  const standardCustomerUnitPrice = rolePricing.customerPrice;

  if (isRep) {
    // Representatives get the product at exactly the floor factory unit price (their standard representative price).
    // It should never be shown as less than the representative price.
    // To show the incentive, we can set the original price to the standard customer price,
    // and the discounted price to the representative price (floorFactoryUnitPrice).
    const originalUnitPrice = standardCustomerUnitPrice;
    const discountedUnitPrice = floorFactoryUnitPrice;
    const discountedCartonPrice = discountedUnitPrice * itemsPerCarton;
    
    // The discount percent is mathematically the markup percent that they are saving
    const appliedDiscountPercent = config.customerMarkupPercent;

    return {
      userRole: rolePricing.userRole,
      isRepresentative: true,
      rawOfferDiscountPercent: rawDiscountPercent,
      appliedDiscountPercent,
      originalUnitPrice,
      discountedUnitPrice,
      discountedCartonPrice,
      itemsPerCarton,
      priceLabel: "قیمت نمایندگی (کف کارخانه):",
      badgeText: `${toPersianDigits(appliedDiscountPercent)}٪ تخفیف انحصاری عاملیت`
    };
  }

  // Regular Customer / Retailer / Guest:
  // Instead of showing the representative price, we add a smaller markup (default 10%, configurable via specialOfferMarkupPercent)
  // on top of the representative floor price.
  const originalUnitPrice = standardCustomerUnitPrice;
  const offerMarkupPercent = typeof config.specialOfferMarkupPercent === 'number' ? config.specialOfferMarkupPercent : 10;
  const discountedUnitPrice = Math.round(floorFactoryUnitPrice * (1 + offerMarkupPercent / 100));
  const discountedCartonPrice = discountedUnitPrice * itemsPerCarton;

  // Calculate the actual discount percent shown to the customer (e.g. from 12000 to 11000 is ~8%)
  const appliedDiscountPercent = originalUnitPrice > discountedUnitPrice
    ? Math.round(((originalUnitPrice - discountedUnitPrice) / originalUnitPrice) * 100)
    : 0;

  return {
    userRole: rolePricing.userRole,
    isRepresentative: false,
    rawOfferDiscountPercent: rawDiscountPercent,
    appliedDiscountPercent,
    originalUnitPrice,
    discountedUnitPrice,
    discountedCartonPrice,
    itemsPerCarton,
    priceLabel: "قیمت ویژه خرید عمده:",
    badgeText: appliedDiscountPercent > 0 ? `${toPersianDigits(appliedDiscountPercent)}٪ تخفیف ویژه` : "تخفیف عمده"
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

export const toPersianNum = toPersianDigits;

