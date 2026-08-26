/**
 * DASTAVVAL B2B PLATFORM - API Routing Utility
 * این ابزار تضمین می‌کند که آدرس‌های API در محیط توسعه و محیط هاست واقعی (cPanel) به درستی لود شوند.
 * با هدایت مستقیم درخواست‌ها به فایل PHP، دیگر وابستگی به فایل htaccess. وجود ندارد و تغییر پوشه‌ها تنظیمات را خراب نمی‌کند.
 */

export function getApiUrl(path: string): string {
  const isDev = typeof window !== "undefined" && 
    (window.location.port === '3000' || 
     window.location.hostname.includes('run.app') || 
     window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  if (isDev) {
    return path;
  }

  // Convert B2B/Admin config aliases to direct PHP actions
  let cleanPath = path;
  if (cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.replace(/^\/api\//, "");
  } else if (cleanPath.startsWith("api/")) {
    cleanPath = cleanPath.replace(/^api\//, "");
  } else {
    return path; // Already a relative or absolute external URL
  }

  // Map configuration aliases to the unified B2B config action in PHP
  if (cleanPath === "admin/b2b-config") {
    cleanPath = "b2b/config";
  }

  // Detect base pathname if installed in a subdirectory (e.g. /app/ or /portal/)
  let basePath = "";
  if (typeof window !== "undefined" && window.location) {
    const rawPathname = window.location.pathname || "";
    // Remove filename like index.php or index.html if present
    basePath = rawPathname.replace(/\/[^/]+\.(html|php)$/i, '').replace(/\/+$/, '');
  }

  return `${basePath}/php/api.php?action=${encodeURIComponent(cleanPath).replace(/%2F/g, '/')}`;
}

export function isWarehouseBrand(b: string): boolean {
  if (!b) return true;
  const clean = b.trim().toLowerCase();
  if (clean.length < 2) return true;
  
  return clean.includes("انبار") || 
         clean.includes("سوله") || 
         clean.includes("باربری") || 
         clean.includes("پخش") || 
         clean.includes("توزیع") || 
         clean.includes("ترانزیت") || 
         clean.includes("parspack") || 
         clean.includes("پارس پک") || 
         clean.includes("پارس‌پک") ||
         clean.includes("قفسه") ||
         clean.includes("عمومی") ||
         clean.includes("متفرقه") ||
         clean.includes("بی برند") ||
         clean.includes("بدون برند") ||
         clean.includes("no brand") ||
         clean.includes("nobrand") ||
         clean.includes("دفتر") ||
         clean.includes("نامشخص") ||
         clean.includes("غیر مشخص") ||
         clean.includes("تولیدکننده") ||
         clean.includes("تولید کننده") ||
         clean.includes("تولیدکنندگان") ||
         clean.includes("بازرگانی جلفا") ||
         clean.includes("بازرگانی") ||
         clean.includes("جلفا") ||
         clean.includes("تامین‌کننده") ||
         clean.includes("تامین کننده") ||
         clean.includes("تامین کنندگان") ||
         clean.includes("واردکننده") ||
         clean.includes("صادرکننده") ||
         clean.includes("عمده‌فروش") ||
         clean.includes("بنکداری") ||
         clean.includes("بنکدار") ||
         clean.includes("جیبون") ||
         clean.includes("جیبتون") ||
         clean.includes("آدرس انبار");
}

/**
 * Returns effective SEO tags for a product (uses existing product tags or auto-generates tags).
 */
export function getEffectiveProductTags(product: {
  name?: string;
  brand?: string;
  category?: string;
  tags?: string[];
  hasHealthApple?: boolean;
  isOrganic?: boolean;
  isNatural?: boolean;
  unit?: string;
}): string[] {
  if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
    return Array.from(new Set(product.tags.map(t => t.trim()).filter(Boolean)));
  }

  const generatedTags = new Set<string>();

  if (product.name) {
    const parts = product.name.split(/\s+/).filter(p => p.length >= 3);
    parts.forEach(p => generatedTags.add(p));
  }

  if (product.brand && !isWarehouseBrand(product.brand)) {
    generatedTags.add(product.brand);
    generatedTags.add(`برند ${product.brand}`);
    generatedTags.add(`محصولات ${product.brand}`);
  }

  if (product.category) {
    generatedTags.add(product.category);
    generatedTags.add(`خرید عمده ${product.category}`);
  }

  if (product.hasHealthApple) generatedTags.add("سیب سلامت");
  if (product.isOrganic) generatedTags.add("ارگانیک");
  if (product.isNatural) generatedTags.add("۱۰۰٪ طبیعی");

  generatedTags.add("خرید عمده");
  generatedTags.add("قیمت کارخانه");
  generatedTags.add("استعلام مستقیم");
  generatedTags.add("کف بازار");

  return Array.from(generatedTags).slice(0, 8);
}
