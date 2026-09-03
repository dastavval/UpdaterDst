/**
 * DASTAVVAL B2B PLATFORM - Smart Universal JSON Catalog Importer & Network Fetcher
 * موتور پیشرفته و ۵ لایه دریافت و استخراج هوشمند فایل‌های JSON کاتالوگ محصولات
 */

import { getDisplayImageUrl } from "./image-utils";

export interface ParsedProductItem {
  id?: string | number;
  sku?: string;
  name: string;
  factoryPrice: number;
  sellPrice: number;
  consumerPrice: number;
  cartonPackCount: number;
  stockCartons: number;
  minOrderCartons: number;
  minStockAlert: number;
  unit: string;
  imageUrl: string;
  category: string;
  brand: string;
  description?: string;
  rawItem?: any;
}

// کاتالوگ پشتیبان و ایمن باکت پارس‌پک (در صورت قطعی تمام شبکه‌ها)
export const DEFAULT_PARSPACK_CATALOG_BACKUP = [
  {
    id: 84,
    sku: "PRD-84",
    barcode: "626840001001",
    name: "پهباد اسمارتیزی شانتیا",
    category: "تنقلات و شکلات",
    location: "کارخانه شانتیا",
    factoryPrice: 16000,
    wholesalePrice: 16000,
    consumerPrice: 35000,
    marketPrice: 35000,
    itemsPerUnit: 24,
    stock: 250,
    minimumStock: 20,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_84.webp",
    description: "کارتن ۲۴ عددی اسمارتیز اسباب‌بازی"
  },
  {
    id: 107,
    sku: "PRD-107",
    barcode: "626107000200",
    name: "آب‌نبات جرقه ای الهام",
    category: "تنقلات و شکلات",
    location: "کارخانه الهام",
    factoryPrice: 9000,
    wholesalePrice: 9000,
    consumerPrice: 20000,
    marketPrice: 20000,
    itemsPerUnit: 48,
    stock: 300,
    minimumStock: 30,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_107.webp",
    description: "کارتن ۴۸ عددی آب‌نبات جرقه‌ای"
  },
  {
    id: 101,
    sku: "محص-1575",
    barcode: "62628640066411",
    name: "آدامس ویویدنت ",
    category: "محصولات خارجی",
    location: "انبار جلفا  ",
    factoryPrice: 141600,
    wholesalePrice: 145000,
    consumerPrice: 145000,
    marketPrice: 145000,
    itemsPerUnit: 18,
    stock: 40,
    minimumStock: 5,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_101.webp",
    description: "تعداد در کارتن 18 عدد"
  },
  {
    id: 100,
    sku: "محص-2510",
    barcode: "62686639983132",
    name: "کیت کت",
    category: "محصولات خارجی",
    location: "قفسه ",
    factoryPrice: 81250,
    wholesalePrice: 85000,
    consumerPrice: 85000,
    marketPrice: 85000,
    itemsPerUnit: 240,
    stock: 35,
    minimumStock: 5,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_100.webp",
    description: "هر کارتن : 12 بسته 20 عددی"
  },
  {
    id: 99,
    sku: "محص-2372",
    barcode: "62648639900568",
    name: "چیپس پرینگلز",
    category: "محصولات خارجی",
    location: "قفسه ",
    factoryPrice: 284200,
    wholesalePrice: 300000,
    consumerPrice: 300000,
    marketPrice: 300000,
    itemsPerUnit: 19,
    stock: 30,
    minimumStock: 5,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_99.webp",
    description: "کارتن 19 عددی"
  },
  {
    id: 98,
    sku: "محص-5941",
    barcode: "62622639760291",
    name: "بيسکوئيت ال بنی ",
    category: "محصولات خارجی",
    location: "انبار جلفا  ",
    factoryPrice: 95800,
    wholesalePrice: 100000,
    consumerPrice: 100000,
    marketPrice: 100000,
    itemsPerUnit: 24,
    stock: 60,
    minimumStock: 10,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_98.webp",
    description: "کارتن 24 عددی"
  },
  {
    id: 97,
    sku: "محص-6605",
    barcode: "62636639657184",
    name: "ببتو پاستیل",
    category: "محصولات خارجی",
    location: "انبار جلفا  ",
    factoryPrice: 63800,
    wholesalePrice: 70000,
    consumerPrice: 70000,
    marketPrice: 70000,
    itemsPerUnit: 72,
    stock: 45,
    minimumStock: 8,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_97.webp",
    description: "6 بسته 12 عددی"
  },
  {
    id: 96,
    sku: "محص-7543",
    barcode: "62644639576386",
    name: "لاویوا ",
    category: "محصولات خارجی",
    location: "انبار جلفا  ",
    factoryPrice: 65970,
    wholesalePrice: 70000,
    consumerPrice: 70000,
    marketPrice: 70000,
    itemsPerUnit: 96,
    stock: 50,
    minimumStock: 10,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_96.webp",
    description: "6 جعبه 24 عددی"
  },
  {
    id: 94,
    sku: "محص-7061",
    barcode: "62689639436847",
    name: "مترو دوبل ",
    category: "محصولات خارجی",
    location: "انبار جلفا  ",
    factoryPrice: 55500,
    wholesalePrice: 60000,
    consumerPrice: 60000,
    marketPrice: 60000,
    itemsPerUnit: 108,
    stock: 80,
    minimumStock: 15,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_94.webp",
    description: "6 جعبه 18 عددی"
  },
  {
    id: 95,
    sku: "محص-2772",
    barcode: "62634639513523",
    name: "آل بنی دوبل ",
    category: "محصولات خارجی",
    location: "انبار جلفا  ",
    factoryPrice: 55500,
    wholesalePrice: 60000,
    consumerPrice: 60000,
    marketPrice: 60000,
    itemsPerUnit: 108,
    stock: 75,
    minimumStock: 10,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_95.webp",
    description: "6 جعبه 18 عددی"
  },
  {
    id: 93,
    sku: "محص-4773",
    barcode: "62634639365731",
    name: "هوبی 25 گرم ",
    category: "محصولات خارجی",
    location: "انبار جلفا  ",
    factoryPrice: 29200,
    wholesalePrice: 30500,
    consumerPrice: 30500,
    marketPrice: 30500,
    itemsPerUnit: 144,
    stock: 100,
    minimumStock: 20,
    minOrderCartons: 1,
    unit: "عدد",
    imageUrl: "https://c102393.parspack.net/c102393/products/prd_93.webp",
    description: "6 بسته 24 عددی"
  }
];

/**
 * بررسی عمیق و هوشمند برای کشف و استخراج آرایه محصولات از هر ساختار JSON
 */
export function extractProductsFromRawData(rawData: any): any[] {
  if (!rawData) return [];

  if (typeof rawData === 'string') {
    try {
      rawData = JSON.parse(rawData.replace(/^\uFEFF/, '').trim());
    } catch (e) {
      return [];
    }
  }

  // ۱. اگر خود خروجی آرایه باشد
  if (Array.isArray(rawData)) {
    return rawData;
  }

  if (typeof rawData !== 'object' || rawData === null) {
    return [];
  }

  // ۲. بررسی کلیدهای متداول اصلی
  const priorityKeys = [
    'products', 'items', 'data', 'catalog', 'result', 'results',
    'goods', 'rows', 'list', 'payload', 'records', 'inventory', 'articles'
  ];

  for (const k of priorityKeys) {
    if (Array.isArray(rawData[k]) && rawData[k].length > 0) {
      return rawData[k];
    }
  }

  // ۳. بررسی حالت data.products یا result.items
  if (rawData.data && typeof rawData.data === 'object') {
    for (const k of priorityKeys) {
      if (Array.isArray(rawData.data[k]) && rawData.data[k].length > 0) {
        return rawData.data[k];
      }
    }
    if (Array.isArray(rawData.data)) {
      return rawData.data;
    }
  }

  // ۴. اگر شیء با کلیدهای عددی باشد: { "0": {...}, "1": {...} }
  const keys = Object.keys(rawData);
  const values = Object.values(rawData);
  const isNumericDict = keys.length > 0 && keys.every(k => !isNaN(Number(k)));
  if (isNumericDict && values.length > 0) {
    return values;
  }

  // ۵. جستجوی عمیق و بازگشتی (Deep Recursive Crawler) برای یافتن بزرگ‌ترین آرایه از اشیاء کالا
  let bestCandidateArray: any[] = [];

  function searchDeep(obj: any, depth = 0) {
    if (depth > 3 || !obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      if (obj.length > bestCandidateArray.length) {
        // چک کن آیا عضو اول شباهتی به محصول دارد
        const sample = obj[0];
        if (sample && typeof sample === 'object') {
          const hasProductProps = sample.name || sample.title || sample.price || sample.factoryPrice || sample.wholesalePrice || sample.sku || sample.imageUrl;
          if (hasProductProps) {
            bestCandidateArray = obj;
          }
        }
      }
      return;
    }

    for (const key of Object.keys(obj)) {
      const child = obj[key];
      if (child && typeof child === 'object') {
        searchDeep(child, depth + 1);
      }
    }
  }

  searchDeep(rawData, 0);

  return bestCandidateArray;
}

/**
 * تبدیل آیتم‌های خام شناسایی‌شده به مدل استاندارد محصول
 */
export function normalizeProductItems(rawProducts: any[]): ParsedProductItem[] {
  return rawProducts.map((incItem, idx) => {
    const factoryBuyPrice = Number(incItem.factoryPrice || incItem.factory_price || incItem.buy_price || incItem.purchase_price || incItem.wholesalePrice || incItem.price || 0);
    const dastAvvalSellPrice = Number(incItem.sellPrice || incItem.marketPrice || incItem.bulk_price || incItem.base_price || (factoryBuyPrice ? Math.round(factoryBuyPrice * 1.04) : 0));
    const consumerRetailPrice = Number(incItem.consumerPrice || incItem.consumer_price || incItem.retailPrice || incItem.market_price || 0);

    const itemsPerCarton = Number(incItem.itemsPerUnit || incItem.carton_pack_count || incItem.pack_count || incItem.pack_size || 1);
    const stockCartons = Number(incItem.stock !== undefined ? incItem.stock : incItem.stock_quantity_cartons || incItem.inventory || 10);
    const minOrderCartons = Number(incItem.min_order_cartons || incItem.minOrder || incItem.moq || 1) || 1;
    const safetyThreshold = Number(incItem.minimumStock || incItem.min_stock_alert || 5);
    const brandName = incItem.location || incItem.factoryName || incItem.factory_name || incItem.brand || incItem.manufacturer || "انبار دست اول";

    const rawImageUrl = incItem.imageUrl || incItem.image_url || incItem.image || incItem.pic || incItem.photo || incItem.picture || incItem.thumb || incItem.thumbnail || incItem.src;

    return {
      id: incItem.id || incItem._id || incItem.pk || `INC-${idx + 1}`,
      sku: incItem.sku || incItem.code || incItem.productCode || String(incItem.id) || `PRD-${idx + 1}`,
      name: incItem.name || incItem.title || incItem.subject || `محصول ${idx + 1}`,
      factoryPrice: factoryBuyPrice,
      sellPrice: dastAvvalSellPrice,
      consumerPrice: consumerRetailPrice,
      cartonPackCount: itemsPerCarton,
      stockCartons,
      minOrderCartons,
      minStockAlert: safetyThreshold,
      unit: incItem.unit || incItem.measure || "عدد",
      imageUrl: getDisplayImageUrl(rawImageUrl),
      category: incItem.category || incItem.group || incItem.cat || "محصولات غذایی",
      brand: brandName,
      description: incItem.description || incItem.info || incItem.body || "",
      rawItem: incItem
    };
  });
}

/**
 * دریافت چندلایه‌ای هوشمند از لینک باکت با پروکسی‌های ۵ گانه
 */
export async function smartFetchJsonWithMultiProxy(targetUrl: string, onLog?: (msg: string) => void): Promise<{ rawData: any; method: string; logs: string[] }> {
  const logs: string[] = [];
  const addLog = (msg: string) => {
    logs.push(msg);
    if (onLog) onLog(msg);
  };

  const cleanUrl = targetUrl.trim();
  addLog(`🌐 شروع عملیات دریافت کاتالوگ از آدرس: ${cleanUrl}`);

  let rawData: any = null;
  let usedMethod = "";

  // لایه ۱: پروکسی اختصاصی Express (/api/proxy-fetch - POST)
  try {
    addLog(`📡 [لایه ۱] ارسال به پروکسی سرور نودجی‌اس (/api/proxy-fetch - POST)...`);
    const res1 = await fetch("/api/proxy-fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: cleanUrl })
    });
    if (res1.ok) {
      const data = await res1.json();
      const extracted = extractProductsFromRawData(data);
      if (extracted.length > 0) {
        rawData = data;
        usedMethod = "Node Express Proxy (POST)";
        addLog(`✅ [لایه ۱ موفق] تعداد ${extracted.length} محصول با موفقیت دریافت گردید.`);
      } else {
        addLog(`⚠️ [لایه ۱] پاسخ دریافتی حاوی محصولات نبود.`);
      }
    }
  } catch (e: any) {
    addLog(`⚠️ [لایه ۱ ناموفق]: ${e.message}`);
  }

  // لایه ۲: پروکسی اختصاصی Express (/api/proxy-fetch?url=... - GET)
  if (!rawData) {
    try {
      addLog(`📡 [لایه ۲] ارسال به پروکسی سرور نودجی‌اس (/api/proxy-fetch - GET)...`);
      const res2 = await fetch(`/api/proxy-fetch?url=${encodeURIComponent(cleanUrl)}`);
      if (res2.ok) {
        const data = await res2.json();
        const extracted = extractProductsFromRawData(data);
        if (extracted.length > 0) {
          rawData = data;
          usedMethod = "Node Express Proxy (GET)";
          addLog(`✅ [لایه ۲ موفق] تعداد ${extracted.length} محصول دریافت شد.`);
        }
      }
    } catch (e: any) {
      addLog(`⚠️ [لایه ۲ ناموفق]: ${e.message}`);
    }
  }

  // لایه ۳: پروکسی PHP cPanel (/php/api.php?action=proxy-fetch)
  if (!rawData) {
    try {
      addLog(`📡 [لایه ۳] ارسال به اکشن پروکسی cPanel PHP (/php/api.php?action=proxy-fetch)...`);
      const res3 = await fetch(`/php/api.php?action=proxy-fetch&url=${encodeURIComponent(cleanUrl)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl })
      });
      if (res3.ok) {
        const data = await res3.json();
        const extracted = extractProductsFromRawData(data);
        if (extracted.length > 0) {
          rawData = data;
          usedMethod = "PHP cPanel Engine Proxy";
          addLog(`✅ [لایه ۳ موفق] پاسخ معتبر از موتور PHP دریافت گردید (${extracted.length} محصول).`);
        }
      }
    } catch (e: any) {
      addLog(`⚠️ [لایه ۳ ناموفق]: ${e.message}`);
    }
  }

  // لایه ۴: پروکسی جهانی CORS 1 (CorsProxy.io)
  if (!rawData) {
    try {
      const publicCorsUrl = `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`;
      addLog(`📡 [لایه ۴] ارسال به پروکسی جهانی CORS (CorsProxy.io)...`);
      const res4 = await fetch(publicCorsUrl);
      if (res4.ok) {
        const data = await res4.json();
        const extracted = extractProductsFromRawData(data);
        if (extracted.length > 0) {
          rawData = data;
          usedMethod = "Global CORS Proxy (corsproxy.io)";
          addLog(`✅ [لایه ۴ موفق] اطلاعات کاتالوگ از پروکسی جهانی دریافت شد.`);
        }
      }
    } catch (e: any) {
      addLog(`⚠️ [لایه ۴ ناموفق]: ${e.message}`);
    }
  }

  // لایه ۵: پروکسی جهانی CORS 2 (AllOrigins)
  if (!rawData) {
    try {
      const allOriginsUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`;
      addLog(`📡 [لایه ۵] ارسال به پروکسی جهانی CORS (AllOrigins)...`);
      const res5 = await fetch(allOriginsUrl);
      if (res5.ok) {
        const data = await res5.json();
        const extracted = extractProductsFromRawData(data);
        if (extracted.length > 0) {
          rawData = data;
          usedMethod = "Global CORS Proxy (allorigins.win)";
          addLog(`✅ [لایه ۵ موفق] اطلاعات دریافت شد.`);
        }
      }
    } catch (e: any) {
      addLog(`⚠️ [لایه ۵ ناموفق]: ${e.message}`);
    }
  }

  // لایه ۶: دریافت مستقیم بدون پروکسی
  if (!rawData) {
    try {
      addLog(`📡 [لایه ۶] ارسال درخواست مستقیم مرورگر به باکت...`);
      const directRes = await fetch(cleanUrl);
      if (directRes.ok) {
        const data = await directRes.json();
        const extracted = extractProductsFromRawData(data);
        if (extracted.length > 0) {
          rawData = data;
          usedMethod = "Direct Browser Fetch";
          addLog(`✅ [لایه ۶ موفق] دانلود مستقیم باکت موفق بود.`);
        }
      }
    } catch (e: any) {
      addLog(`⚠️ [لایه ۶ ناموفق - احتمالا بلاک CORS/MixedContent]: ${e.message}`);
    }
  }

  // لایه ۷: تلاش از طریق اندپوینت ذخیره‌سازی سرور (/api/storage/proxy-download)
  if (!rawData) {
    try {
      addLog(`📡 [لایه ۷] دریافت از طریق درگاه پروکسی فایل سرور (/api/storage/proxy-download)...`);
      const res7 = await fetch(`/api/storage/proxy-download?url=${encodeURIComponent(cleanUrl)}`);
      if (res7.ok) {
        const data = await res7.json();
        const extracted = extractProductsFromRawData(data);
        if (extracted.length > 0) {
          rawData = data;
          usedMethod = "Server Storage Stream Proxy";
          addLog(`✅ [لایه ۷ موفق] اطلاعات کاتالوگ با موفقیت بارگذاری شد.`);
        }
      }
    } catch (e: any) {
      addLog(`⚠️ [لایه ۷ ناموفق]: ${e.message}`);
    }
  }

  // لایه ۸: بارگذاری خودکار از نسخه پشتیبان معتبر باکت در سیستم (Fallback Backup)
  if (!rawData) {
    addLog(`🛡️ [لایه اضطراری] فعال‌سازی نسخه پایدار کاتالوگ پشتیبان باکت پارس‌پک...`);
    rawData = DEFAULT_PARSPACK_CATALOG_BACKUP;
    usedMethod = "ParsPack Resilient Offline Catalog";
    addLog(`✅ [موفق] تعداد ${DEFAULT_PARSPACK_CATALOG_BACKUP.length} محصول استاندارد کاتالوگ با موفقیت بارگذاری شد.`);
  }

  return { rawData, method: usedMethod, logs };
}
