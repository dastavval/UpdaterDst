/**
 * High-CTR Dynamic SEO & Meta Tags Manager for DastAvval
 * Automatically sets page titles, meta descriptions, canonical URLs,
 * secondary keywords, OpenGraph tags, and JSON-LD Rich Snippets per route/tab.
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  schema?: any;
}

export const SEO_TAB_CONFIGS: Record<string, SEOMetadata> = {
  presentation: {
    title: "دست اول | سامانه ملی خرید عمده مواد غذایی و استعلام مستقیم از کارخانه",
    description: "مرکز خرید مستقیم مواد غذایی و تنقلات از درب کارخانه با قیمت کف بازار. صدور پیش‌فاکتور رسمی، تخفیف عمده‌فروشی بنکداری و ضمانت پرداخت امن.",
    keywords: [
      "خرید عمده مواد غذایی",
      "استعلام قیمت کارخانه",
      "کف بازار بنکداری",
      "خرید عمده شکلات و بیسکویت",
      "خرید مستقیم از کارخانه",
      "پلتفرم B2B صنایع غذایی",
      "سامانه دست اول"
    ],
    canonicalUrl: "https://dastavval.com/",
    schema: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "دست اول",
      "url": "https://dastavval.com",
      "description": "سامانه ملی خرید عمده، استعلام مستقیم و تالار کف بازار صنایع غذایی"
    }
  },
  order: {
    title: "کاتالوگ جامع خرید عمده و سفارش آنلاین کارخانجات | دست اول",
    description: "لیست قیمت روز و خرید کارتنی انواع محصولات غذایی، کیک، نوشیدنی، شوینده و کنسروجات با تحویل مستقیم باربری از درب کارخانجات با ضمانت بازگشت وجه.",
    keywords: [
      "کاتالوگ خرید عمده مواد غذایی",
      "قیمت عمده شکلات چی‌توز و مزمز",
      "خرید کارتنی آبمیوه",
      "خرید عمده رب و کنسرو",
      "سفارش عمده سوپرمارکت",
      "پخش عمده مواد غذایی ارزان"
    ],
    canonicalUrl: "https://dastavval.com/?tab=order",
    schema: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "کاتالوگ جامع محصولات عمده دست اول",
      "description": "خرید عمده مستقیم از تولیدکنندگان با صدور پیش‌فاکتور رسمی و گواهی اصالت"
    }
  },
  billboard: {
    title: "تالار کف بازار و آگهی‌های بار عمده فوری | دست اول",
    description: "خرید فوری مازاد تولید کارخانجات، خریدهای زیر قیمت بازار، و پیشنهادات شگفت‌انگیز عمده‌فروشی صنایع غذایی با تخفیف‌های استثنایی و پرداخت امن.",
    keywords: [
      "کف بازار عمده",
      "فروش فوری مازاد تولید کارخانه",
      "مزایده بار مواد غذایی",
      "خرید زیر قیمت بازار",
      "تخفیف تناژ بالا",
      "آگهی عمده فروشی فوری"
    ],
    canonicalUrl: "https://dastavval.com/?tab=billboard"
  },
  factories: {
    title: "بانک اطلاعات کارخانجات و تولیدکنندگان صنایع غذایی ایران | دست اول",
    description: "مشاهده پروفایل رسمی، ظرفیت تولید، استانداردهای بهداشتی و ارتباط مستقیم با مدیران فروش برترین کارخانجات صنایع غذایی و بهداشتی کشور.",
    keywords: [
      "کارخانجات صنایع غذایی ایران",
      "لیست تولیدکنندگان مواد غذایی",
      "تماس با کارخانه چی‌توز و مزمز",
      "تولیدکنندگان شیرینی و شکلات",
      "تامین مستقیم از خط تولید"
    ],
    canonicalUrl: "https://dastavval.com/?tab=factories"
  },
  dealership: {
    title: "اعطای نمایندگی انحصاری و عاملیت فروش کارخانجات | دست اول",
    description: "ثبت تقاضای نمایندگی استانی، عاملیت پخش و بنکداری انحصاری برندهای معتبر صنایع غذایی با شرایط اعتباری و پورسانت ویژه در سراسر ایران.",
    keywords: [
      "اخذ نمایندگی مواد غذایی",
      "عاملیت پخش انحصاری کارخانه",
      "اعطای نمایندگی استانی",
      "شراکت بنکداری و پخش مویرگی",
      "فرصت نمایندگی انحصاری"
    ],
    canonicalUrl: "https://dastavval.com/?tab=dealership"
  },
  services: {
    title: "تامین مواد اولیه کارخانجات و خدمات صنعتی B2B | دست اول",
    description: "مرجع تخصصی خرید و فروش عمده مواد اولیه صنایع غذایی، بسته‌بندی، گلوکز، شکر صنعتی، روغن بالک و خدمات آزمایشگاهی و ترابری کارخانجات.",
    keywords: [
      "خرید مواد اولیه صنایع غذایی",
      "شکر و گلوکز صنعتی عمده",
      "روغن بالک کارخانجات",
      "فیلم و سلفون بسته‌بندی",
      "خدمات ترانزیت و باربری کارخانجات"
    ],
    canonicalUrl: "https://dastavval.com/?tab=services"
  },
  news: {
    title: "اخبار تنظیم بازار، تعرفه‌ها و رویدادهای صنایع غذایی | دست اول",
    description: "تازه‌ترین ابلاغیه‌های بنکداری، تحلیل قیمت مواد اولیه، گزارش خطوط تولید جدید کارخانجات و بخشنامه‌های دولتی صنایع غذایی.",
    keywords: [
      "اخبار صنایع غذایی",
      "تحلیل بازار عمده فروشی",
      "تعرفه‌های حمل بار کارخانجات",
      "ابلاغیه تنظیم بازار",
      "گزارش خطوط تولید کارخانجات"
    ],
    canonicalUrl: "https://dastavval.com/?tab=news"
  },
  about: {
    title: "درباره سامانه ملی دست اول | پلتفرم مبادلات B2B صنایع غذایی",
    description: "آشنایی با اهداف، ضمانت‌های تجاری، مجوزهای قانونی و تیم پشتیبانی پلتفرم ملی دست اول برای حذف واسطه‌ها و اتصال مستقیم تولید به مصرف.",
    keywords: [
      "درباره دست اول",
      "مجوزهای سامانه دست اول",
      "پلتفرم امن معاملات عمده",
      "ضمانت پرداخت امانی کارخانجات"
    ],
    canonicalUrl: "https://dastavval.com/?tab=about"
  }
};

/**
 * Updates DOM meta tags and document title dynamically for search engine crawlers and browser tabs
 */
export function updatePageSEO(metadata: SEOMetadata) {
  if (typeof document === 'undefined') return;

  // 1. Title
  document.title = metadata.title;

  // 2. Helper to set or update meta tag
  const setMeta = (attrName: string, attrVal: string, content: string) => {
    let tag = document.querySelector(`meta[${attrName}="${attrVal}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attrName, attrVal);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // Standard SEO tags
  setMeta('name', 'title', metadata.title);
  setMeta('name', 'description', metadata.description);
  
  if (metadata.keywords && metadata.keywords.length > 0) {
    setMeta('name', 'keywords', metadata.keywords.join(', '));
  }

  // OpenGraph tags
  setMeta('property', 'og:title', metadata.title);
  setMeta('property', 'og:description', metadata.description);
  if (metadata.ogImage) {
    setMeta('property', 'og:image', metadata.ogImage);
  }
  if (metadata.canonicalUrl) {
    setMeta('property', 'og:url', metadata.canonicalUrl);
    
    // Canonical link tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', metadata.canonicalUrl);
  }

  // Twitter tags
  setMeta('name', 'twitter:title', metadata.title);
  setMeta('name', 'twitter:description', metadata.description);

  // Dynamic JSON-LD Structured Data Injection
  if (metadata.schema) {
    let scriptTag = document.getElementById('dynamic-page-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'dynamic-page-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(metadata.schema);
  }
}

/**
 * Generates custom SEO metadata for a specific Product Modal or Share link
 */
export function getProductSEOMetadata(product: {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  bulk_price?: number;
  price?: number;
  image_url?: string;
  description?: string;
  carton_pack_count?: number;
}): SEOMetadata {
  const priceFormatted = product.bulk_price
    ? new Intl.NumberFormat('fa-IR').format(product.bulk_price) + " تومان"
    : "استعلام قیمت مستقیم";

  const cleanDesc = product.description
    ? product.description.slice(0, 160)
    : `خرید عمده و کارتنی ${product.name} برند ${product.brand || 'معتبر'} در دسته‌بندی ${product.category || 'صنایع غذایی'}. تحویل مستقیم با بارنامه رسمی.`;

  return {
    title: `خرید عمده ${product.name} (${product.brand || 'کارخانه'}) | استعلام قیمت کف بازار | دست اول`,
    description: `خرید مستقیم ${product.name} با قیمت عمده ${priceFormatted} به ازای هر کارتن (${product.carton_pack_count || 12} عددی). ${cleanDesc}`,
    keywords: [
      `خرید عمده ${product.name}`,
      `قیمت کارخانه ${product.name}`,
      `عمده فروشی ${product.brand || ''}`,
      `خرید کارتنی ${product.name}`,
      `پخش عمده ${product.category || 'مواد غذایی'}`
    ],
    canonicalUrl: `https://dastavval.com/?product=${product.id}`,
    ogImage: product.image_url,
    ogType: 'product',
    schema: {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": product.image_url ? [product.image_url] : [],
      "description": cleanDesc,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "تولیدکننده صنایع غذایی"
      },
      "category": product.category || "صنایع غذایی",
      "offers": {
        "@type": "Offer",
        "url": `https://dastavval.com/?product=${product.id}`,
        "priceCurrency": "IRR",
        "price": product.bulk_price ? product.bulk_price * 10 : 0, // In Rials
        "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "سامانه ملی دست اول"
        }
      }
    }
  };
}

/**
 * Generates custom SEO metadata for a Category view
 */
export function getCategorySEOMetadata(categoryName: string): SEOMetadata {
  return {
    title: `خرید عمده ${categoryName} از کارخانجات سراسر کشور | دست اول`,
    description: `مشاهده لیست کامل و استعلام قیمت روز خرید عمده انواع ${categoryName} مستقیماً از خط تولید کارخانجات، بنکداری کف بازار با تخفیف تناژ بالا و ارسال فوری.`,
    keywords: [
      `خرید عمده ${categoryName}`,
      `قیمت روز ${categoryName}`,
      `کارخانجات تولید ${categoryName}`,
      `فروش عمده ${categoryName}`,
      `بنکداری ${categoryName}`
    ],
    canonicalUrl: `https://dastavval.com/?category=${encodeURIComponent(categoryName)}`
  };
}
