import { Product } from "../types";

export interface CategoryDiscountRule {
  category: string;
  discountPercent: number;
  active: boolean;
  notes?: string;
  appliedDate?: string;
}

export interface DayDiscountRule {
  day: string; // "شنبه" | "یکشنبه" | "دوشنبه" | "سه‌شنبه" | "چهارشنبه" | "پنجشنبه"
  defaultCategory: string;
  discountPercent: number;
  active: boolean;
  label: string;
}

export interface GlobalDiscountConfig {
  globalDiscountActive: boolean;
  globalDiscountPercent: number; // e.g. 5 for 5%
  globalDiscountTarget: "all" | "category" | "day_based";
  selectedTargetCategory: string;
  todayDiscountNote: string;
  categoryRules: Record<string, CategoryDiscountRule>;
  dayRules: Record<string, DayDiscountRule>;
  lastUpdated: string;
}

const STORAGE_KEY = "dastavval_global_discount_rules_v2";

export const DEFAULT_DAY_RULES: Record<string, DayDiscountRule> = {
  "شنبه": {
    day: "شنبه",
    defaultCategory: "تنقلات، کیک و بیسکویت",
    discountPercent: 8,
    active: true,
    label: "شنبه‌های طلایی تنقلات و بیسکویت"
  },
  "یکشنبه": {
    day: "یکشنبه",
    defaultCategory: "شوینده، بهداشتی و سلولزی",
    discountPercent: 12,
    active: true,
    label: "یکشنبه‌های پاکیزگی و شوینده"
  },
  "دوشنبه": {
    day: "دوشنبه",
    defaultCategory: "کنسرویجات، رب و روغن",
    discountPercent: 15,
    active: true,
    label: "دوشنبه‌های کنسرو، رب و روغن"
  },
  "سه‌شنبه": {
    day: "سه‌شنبه",
    defaultCategory: "لبنیات و نوشیدنی‌ها",
    discountPercent: 10,
    active: true,
    label: "سه‌شنبه‌های لبنیات و پروتئینی"
  },
  "چهارشنبه": {
    day: "چهارشنبه",
    defaultCategory: "شیرینی، شکلات و قهوه",
    discountPercent: 10,
    active: true,
    label: "چهارشنبه‌های شکلات و قهوه"
  },
  "پنجشنبه": {
    day: "پنجشنبه",
    defaultCategory: "همه دسته‌ها",
    discountPercent: 15,
    active: true,
    label: "حراج پایان هفته کارخانجات (پنجشنبه و جمعه)"
  }
};

export const DEFAULT_DISCOUNT_CONFIG: GlobalDiscountConfig = {
  globalDiscountActive: true,
  globalDiscountPercent: 5,
  globalDiscountTarget: "category",
  selectedTargetCategory: "لبنیات و نوشیدنی‌ها",
  todayDiscountNote: "۵٪ تخفیف ویژه امروز روی گروه محصولات منتخب صنایع غذایی و لبنیات",
  categoryRules: {
    "لبنیات و نوشیدنی‌ها": {
      category: "لبنیات و نوشیدنی‌ها",
      discountPercent: 5,
      active: true,
      notes: "تخفیف روزانه کارخانه‌ای"
    },
    "کنسرویجات، رب و روغن": {
      category: "کنسرویجات، رب و روغن",
      discountPercent: 8,
      active: true,
      notes: "تخفیف تناژ رب و روغن"
    },
    "شوینده، بهداشتی و سلولزی": {
      category: "شوینده، بهداشتی و سلولزی",
      discountPercent: 10,
      active: true,
      notes: "تخفیف پخش شوینده"
    },
    "تنقلات، کیک و بیسکویت": {
      category: "تنقلات، کیک و بیسکویت",
      discountPercent: 7,
      active: true,
      notes: "تخفیف ویژه کارتن‌بندی بیسکویت"
    }
  },
  dayRules: DEFAULT_DAY_RULES,
  lastUpdated: new Date().toLocaleDateString("fa-IR")
};

export function getGlobalDiscountConfig(): GlobalDiscountConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_DISCOUNT_CONFIG,
        ...parsed,
        categoryRules: { ...DEFAULT_DISCOUNT_CONFIG.categoryRules, ...(parsed.categoryRules || {}) },
        dayRules: { ...DEFAULT_DAY_RULES, ...(parsed.dayRules || {}) }
      };
    }
  } catch (e) {}
  return DEFAULT_DISCOUNT_CONFIG;
}

export function saveGlobalDiscountConfig(config: Partial<GlobalDiscountConfig>): GlobalDiscountConfig {
  const current = getGlobalDiscountConfig();
  const updated: GlobalDiscountConfig = {
    ...current,
    ...config,
    lastUpdated: new Date().toLocaleDateString("fa-IR") + " - " + new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("dastavval-discount-rules-changed", { detail: updated }));
  } catch (e) {}

  return updated;
}

/**
 * Calculates the final effective discount percentage and discounted price for a product
 * taking into account:
 * 1. Base product discount
 * 2. Category-specific rule discount
 * 3. Global active discount percentage
 */
export function calculateEffectiveProductPricing(
  product: Product,
  config?: GlobalDiscountConfig
): {
  effectiveDiscountPercent: number;
  discountedPrice: number;
  originalPrice: number;
  isCustomDiscountApplied: boolean;
  appliedRuleLabel?: string;
} {
  const cfg = config || getGlobalDiscountConfig();
  const originalPrice = product.bulk_price || product.price || 0;
  let baseDiscount = product.discount_percent || product.weeklySaleDiscount || 0;
  let appliedRuleLabel: string | undefined;
  let isCustomDiscountApplied = false;

  // 1. Check if Category rule is active
  if (product.category && cfg.categoryRules[product.category]?.active) {
    const catRule = cfg.categoryRules[product.category];
    if (catRule.discountPercent > 0) {
      baseDiscount = Math.max(baseDiscount, catRule.discountPercent);
      appliedRuleLabel = `تخفیف گروه ${product.category} (٪${catRule.discountPercent})`;
      isCustomDiscountApplied = true;
    }
  }

  // 2. Check Global Discount
  if (cfg.globalDiscountActive && cfg.globalDiscountPercent > 0) {
    if (cfg.globalDiscountTarget === "all") {
      baseDiscount = Math.max(baseDiscount, cfg.globalDiscountPercent);
      appliedRuleLabel = `تخفیف سراسری دست اول (٪${cfg.globalDiscountPercent})`;
      isCustomDiscountApplied = true;
    } else if (
      cfg.globalDiscountTarget === "category" &&
      product.category === cfg.selectedTargetCategory
    ) {
      baseDiscount = Math.max(baseDiscount, cfg.globalDiscountPercent);
      appliedRuleLabel = `تخفیف ویژه امروز گروه ${product.category} (٪${cfg.globalDiscountPercent})`;
      isCustomDiscountApplied = true;
    }
  }

  const effectiveDiscountPercent = Math.min(60, Math.max(0, baseDiscount));
  const discountedPrice = effectiveDiscountPercent > 0
    ? Math.round(originalPrice * (1 - effectiveDiscountPercent / 100))
    : originalPrice;

  return {
    effectiveDiscountPercent,
    discountedPrice,
    originalPrice,
    isCustomDiscountApplied,
    appliedRuleLabel
  };
}
