import { toPersianNum } from "./persian-utils";

export interface ChannelPost {
  id: string;
  title: string;
  content: string;
  category: 'festival' | 'urgent' | 'system' | 'info';
  actionLabel?: string;
  actionUrl?: string;
  createdAt: string;
  pinned?: boolean;
  isAuto?: boolean;
  metadata?: {
    productId?: string;
    productName?: string;
    price?: number;
    bulkPrice?: number;
    brand?: string;
    category?: string;
    flagType?: 'featured' | 'kafbazaar' | 'weekly_sale' | 'new_product' | 'bestseller' | 'surplus';
  };
}

const formatPrice = (num?: number): string => {
  if (!num) return "۰";
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "،");
};

/**
 * Publishes a new announcement to the Dastavval official channel (dastavval_announcements)
 * and dispatches events so that Navbar, Admin Channel, and all listeners update immediately.
 */
export const triggerAutoChannelPost = (
  title: string,
  content: string,
  category: 'festival' | 'urgent' | 'system' | 'info' = 'info',
  actionLabel?: string,
  actionUrl?: string,
  extra?: {
    pinned?: boolean;
    metadata?: any;
  }
): ChannelPost | null => {
  try {
    const saved = localStorage.getItem("dastavval_announcements");
    let currentPosts: ChannelPost[] = [];
    if (saved) {
      try {
        currentPosts = JSON.parse(saved);
        if (!Array.isArray(currentPosts)) currentPosts = [];
      } catch (e) {
        currentPosts = [];
      }
    }

    const todayPersian = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const newPost: ChannelPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      content: content.trim(),
      category,
      actionLabel: actionLabel?.trim() || undefined,
      actionUrl: actionUrl?.trim() || undefined,
      createdAt: todayPersian,
      pinned: !!extra?.pinned,
      isAuto: true,
      metadata: extra?.metadata
    };

    // Keep max 150 posts, prepend new
    currentPosts = [newPost, ...currentPosts].slice(0, 150);

    localStorage.setItem("dastavval_announcements", JSON.stringify(currentPosts));
    
    // Dispatch events for immediate UI update in Navbar and all open tabs
    window.dispatchEvent(new Event("dastavval_announcements_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_announcements_updated", { detail: newPost }));

    return newPost;
  } catch (e) {
    console.error("Auto channel post failed:", e);
    return null;
  }
};

/**
 * Broadcasts a Special Offer / Featured (فروش ویژه) product to the official channel
 */
export const postSpecialOfferToChannel = (product: {
  id?: string;
  name: string;
  brand?: string;
  factoryName?: string;
  supplierName?: string;
  category?: string;
  price?: number;
  bulk_price?: number;
  unit?: string;
  carton_pack_count?: number;
  min_order_cartons?: number;
  shipping_origin?: string;
  discount?: number;
}) => {
  const priceVal = product.bulk_price || product.price || 0;
  const priceFormatted = formatPrice(priceVal);
  const brandOrFactory = product.brand || product.factoryName || product.supplierName || "تولید ملی";
  const packInfo = product.carton_pack_count ? `کارتن ${toPersianNum(product.carton_pack_count)} عددی` : "بسته‌بندی کارخانه‌ای";
  const minOrder = product.min_order_cartons ? `${toPersianNum(product.min_order_cartons)} کارتن` : "۱ کارتن";

  const title = `⭐ فروش ویژه کارخانه‌ای: ${product.name}`;
  const content = `🔥 آفر ویژه و تخفیف‌دار کارخانه‌ای فعال شد!\n\n` +
    `🏷 نام محصول: ${product.name}\n` +
    `🏭 برند / واحد صنعتی: ${brandOrFactory}\n` +
    `💰 قیمت عمده دست اول: ${toPersianNum(priceFormatted)} تومان (هر ${product.unit || 'بسته'})\n` +
    `📦 بسته‌بندی: ${packInfo} | حداقل سفارش: ${minOrder}\n` +
    `✨ شرایط تسویه: تحویل مستقیم از خط تولید + امکان پرداخت چکی صیادی ۵۰٪`;

  return triggerAutoChannelPost(
    title,
    content,
    'festival',
    'مشاهده و ثبت سفارش ویژه',
    `#special-offers`,
    {
      pinned: true,
      metadata: {
        productId: product.id,
        productName: product.name,
        price: priceVal,
        bulkPrice: priceVal,
        brand: brandOrFactory,
        category: product.category,
        flagType: 'featured'
      }
    }
  );
};

/**
 * Broadcasts a Market Floor (کف بازار - زیر قیمت کارخانه) deal to the official channel
 */
export const postKafBazaarToChannel = (product: {
  id?: string;
  name: string;
  brand?: string;
  factoryName?: string;
  supplierName?: string;
  category?: string;
  price?: number;
  bulk_price?: number;
  unit?: string;
  carton_pack_count?: number;
  min_order_cartons?: number;
  shipping_origin?: string;
}) => {
  const priceVal = product.bulk_price || product.price || 0;
  const priceFormatted = formatPrice(priceVal);
  const brandOrFactory = product.factoryName || product.brand || product.supplierName || "کارخانه همکار";
  const origin = product.shipping_origin ? `\n🚚 مبدأ بارگیری: ${product.shipping_origin}` : "";

  const title = `🔥 حراج فوری کف بازار: ${product.name}`;
  const content = `⚡ فرصت استثنایی خرید به قیمت کف بازار (زیر نرخ مصوب کارخانه)!\n\n` +
    `🏷 نام کالا: ${product.name}\n` +
    `🏭 تولیدکننده / تأمین: ${brandOrFactory}\n` +
    `📉 قیمت نقدی کف بازار: ${toPersianNum(priceFormatted)} تومان (هر ${product.unit || 'بسته'})\n` +
    `🚨 توجه: سهمیه و موجودی این پارت محدود است و اولویت بارگیری با سفارشات نقدی بنکداری می‌باشد.${origin}`;

  return triggerAutoChannelPost(
    title,
    content,
    'urgent',
    'ورود به تالار معاملات کف بازار',
    `#kafbazaar`,
    {
      pinned: true,
      metadata: {
        productId: product.id,
        productName: product.name,
        price: priceVal,
        bulkPrice: priceVal,
        brand: brandOrFactory,
        category: product.category,
        flagType: 'kafbazaar'
      }
    }
  );
};

/**
 * Broadcasts a Weekly Sale (حراج هفتگی کارخانجات) to the official channel
 */
export const postWeeklySaleToChannel = (product: {
  id?: string;
  name: string;
  brand?: string;
  factoryName?: string;
  supplierName?: string;
  price?: number;
  bulk_price?: number;
  weeklySalePrice?: number;
  weeklySaleDiscount?: number;
  weeklySaleDay?: string;
  weeklySaleQuota?: number;
  unit?: string;
}) => {
  const discountPercent = product.weeklySaleDiscount || 15;
  const originalPrice = product.bulk_price || product.price || 0;
  const salePrice = product.weeklySalePrice || Math.round(originalPrice * (1 - discountPercent / 100));
  const brandOrFactory = product.brand || product.factoryName || "کارخانه همکار";

  const title = `📅 حراج هفتگی کارخانجات: ${product.name} (${toPersianNum(discountPercent)}٪ تخفیف)`;
  const content = `🎉 سهمیه حراج هفتگی در سامانه سراسری دست اول کلید خورد!\n\n` +
    `🏷 نام محصول: ${product.name}\n` +
    `🏭 برند / تولیدکننده: ${brandOrFactory}\n` +
    `💵 قیمت حراج هفتگی: ${toPersianNum(formatPrice(salePrice))} تومان (قیمت پایه: ${toPersianNum(formatPrice(originalPrice))} تومان)\n` +
    `📦 سهمیه تخصیص یافته: ${toPersianNum(product.weeklySaleQuota || 200)} کارتن\n` +
    `⏳ روز عرضه حراج: ${product.weeklySaleDay || 'همه روزهای هفته'}`;

  return triggerAutoChannelPost(
    title,
    content,
    'system',
    'مشاهده برنامه حراج هفتگی',
    `#weekly-sales`,
    {
      pinned: false,
      metadata: {
        productId: product.id,
        productName: product.name,
        price: salePrice,
        bulkPrice: originalPrice,
        brand: brandOrFactory,
        flagType: 'weekly_sale'
      }
    }
  );
};

/**
 * Broadcasts newly created regular product to the channel
 */
export const postNewProductToChannel = (product: {
  id?: string;
  name: string;
  brand?: string;
  factoryName?: string;
  category?: string;
  bulk_price?: number;
  price?: number;
  unit?: string;
}) => {
  const priceFormatted = formatPrice(product.bulk_price || product.price || 0);
  const brandOrFactory = product.brand || product.factoryName || "دست اول";

  const title = `📦 عرضه مستقیم محصول جدید: ${product.name}`;
  const content = `یک کالای جدید به سبد عرضه مستقیم کارخانجات پلتفرم دست اول اضافه شد:\n\n` +
    `🏷 نام کالا: ${product.name}\n` +
    `🏭 برند / سازنده: ${brandOrFactory}\n` +
    `💰 قیمت عمده: ${toPersianNum(priceFormatted)} تومان (هر ${product.unit || 'بسته'})\n` +
    `📂 دسته‌بندی: ${product.category || 'کالاهای کارخانه‌ای'}`;

  return triggerAutoChannelPost(
    title,
    content,
    'info',
    'مشاهده و سفارش کالا',
    `#catalog`,
    {
      pinned: false,
      metadata: {
        productId: product.id,
        productName: product.name,
        brand: brandOrFactory,
        category: product.category,
        flagType: 'new_product'
      }
    }
  );
};

/**
 * Broadcasts a Bestseller product to the channel
 */
export const postBestsellerToChannel = (product: {
  id?: string;
  name: string;
  brand?: string;
  factoryName?: string;
  supplierName?: string;
  category?: string;
  bulk_price?: number;
  price?: number;
  unit?: string;
  bestsellerRank?: number;
  bestsellerMonthlySales?: number;
}) => {
  const priceVal = product.bulk_price || product.price || 0;
  const priceFormatted = formatPrice(priceVal);
  const brandOrFactory = product.factoryName || product.brand || "کارخانه همکار";
  const rankText = product.bestsellerRank ? ` (رتبه #${toPersianNum(product.bestsellerRank)})` : '';

  const title = `🏆 کالای منتخب بنکداری و پرفروش بازار: ${product.name}${rankText}`;
  const content = `🔥 این کالا به دلیل بیشترین حجم تقاضا و تیراژ سفارش مجدد مغازه‌داران در رتبه پرفروش‌ترین‌ها قرار گرفت:\n\n` +
    `🏷 نام کالا: ${product.name}\n` +
    `🏭 برند / تولیدکننده: ${brandOrFactory}\n` +
    `💰 قیمت عمده دست اول: ${toPersianNum(priceFormatted)} تومان (هر ${product.unit || 'بسته'})\n` +
    `📦 تأمین مستقیم و تضمین اصالت و حاشیه سود مغازه‌دار.`;

  return triggerAutoChannelPost(
    title,
    content,
    'festival',
    'مشاهده لیست پرفروش‌ترین‌ها',
    `#bestsellers`,
    {
      pinned: false,
      metadata: {
        productId: product.id,
        productName: product.name,
        price: priceVal,
        bulkPrice: priceVal,
        brand: brandOrFactory,
        category: product.category,
        flagType: 'bestseller'
      }
    }
  );
};

/**
 * Broadcasts factory surplus line approval to the channel
 */
export const postSurplusApprovedToChannel = (product: {
  id?: string;
  name: string;
  brand?: string;
  factoryName?: string;
  category?: string;
  bulk_price?: number;
  price?: number;
  surplusPrice?: number;
  surplusDiscountPercent?: number;
  surplusQuantityCartons?: number;
  unit?: string;
}) => {
  const priceVal = product.surplusPrice || product.bulk_price || product.price || 0;
  const priceFormatted = formatPrice(priceVal);
  const discount = product.surplusDiscountPercent || 20;
  const brandOrFactory = product.factoryName || product.brand || "کارخانه همکار";

  const title = `📉 مازاد خط تولید کارخانه تایید شد: ${product.name} (تخفیف ٪${toPersianNum(discount)})`;
  const content = `🚨 حراج بار مازاد خط تولید با تایید کارشناسان مدیریت سایت منتشر شد:\n\n` +
    `🏷 نام محصول: ${product.name}\n` +
    `🏭 کارخانه مبدأ: ${brandOrFactory}\n` +
    `📉 قیمت نهایی مازاد: ${toPersianNum(priceFormatted)} تومان (تخفیف ${toPersianNum(discount)}٪)\n` +
    `📦 حجم بار عرضه شده: ${toPersianNum(product.surplusQuantityCartons || 50)} کارتن\n` +
    `⚡ تحویل فوری از انبار مرکزی یا درب کارخانه.`;

  return triggerAutoChannelPost(
    title,
    content,
    'urgent',
    'خرید مازاد خط تولید',
    `#kafbazaar`,
    {
      pinned: true,
      metadata: {
        productId: product.id,
        productName: product.name,
        price: priceVal,
        bulkPrice: priceVal,
        brand: brandOrFactory,
        category: product.category,
        flagType: 'surplus'
      }
    }
  );
};
