export function cleanUnitName(unitStr?: string): string {
  if (!unitStr) return "عدد";
  let cleaned = String(unitStr).replace(/\(عدد\)|\(وزنی\)|\(پاکت\)|\(بسته\)|\(کیلوگرم\)/gi, "").trim();
  return cleaned || "عدد";
}

/**
 * Extracts the direct original source URL from a proxied or raw image string.
 * This is crucial for offline standalone catalogs and downloads where relative
 * /api/proxy-image URLs cannot resolve on a user's local disk.
 */
export function getRealImageDirectUrl(rawUrl?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return "";
  let url = rawUrl.trim();
  if (!url) return "";

  // If it's already a proxied URL, extract the target URL parameter
  if (url.includes("/api/proxy-image?url=") || url.includes("/php/api.php?action=proxy-image&url=")) {
    try {
      const match = url.match(/[?&]url=([^&]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        if (decoded.startsWith("//")) return "https:" + decoded;
        return decoded;
      }
    } catch (e) {
      // ignore
    }
  }

  if (url.startsWith("//")) {
    return "https:" + url;
  }

  return url;
}

/**
 * Generate a pristine vector SVG placeholder with authentic Iranian product branding
 * when an image is loading or fails. Never uses random unrelated stock photography.
 */
export function getProductFallbackSvg(name: string = "محصول صنایع غذایی", brand: string = "دست اول"): string {
  const safeName = (name || "کالای اصیل کارخانه").slice(0, 35);
  const safeBrand = (brand || "بازرگانی دست اول").slice(0, 25);
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#f1f5f9" />
      </linearGradient>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bgGrad)" rx="24" />
    <circle cx="200" cy="160" r="70" fill="#e2e8f0" opacity="0.6" />
    <g transform="translate(160, 120)" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </g>
    <rect x="80" y="245" width="240" height="32" rx="16" fill="url(#badgeGrad)" />
    <text x="200" y="266" fill="#ffffff" font-family="tahoma, sans-serif" font-size="14" font-weight="900" text-anchor="middle" direction="rtl">${safeBrand}</text>
    <text x="200" y="310" fill="#0f172a" font-family="tahoma, sans-serif" font-size="15" font-weight="bold" text-anchor="middle" direction="rtl">${safeName}</text>
    <text x="200" y="340" fill="#64748b" font-family="tahoma, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" direction="rtl">صنایع غذایی و بهداشتی اصیل</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function optimizeUnsplashUrl(url: string, width: number = 600, quality: number = 75): string {
  if (!url || !url.includes("unsplash.com")) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    parsed.searchParams.set("w", String(width));
    parsed.searchParams.set("q", String(quality));
    parsed.searchParams.set("fm", "webp");
    return parsed.toString();
  } catch (e) {
    if (!url.includes("?")) {
      return `${url}?auto=format&fit=crop&w=${width}&q=${quality}&fm=webp`;
    }
    return url;
  }
}

const DISPLAY_URL_MEMO = new Map<string, string>();

export function getDisplayImageUrl(rawUrl?: string, fallbackTitle?: string, fallbackBrand?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return getProductFallbackSvg(fallbackTitle, fallbackBrand);
  }
  
  let url = rawUrl.trim();
  if (!url) return getProductFallbackSvg(fallbackTitle, fallbackBrand);

  const memoKey = `${url}|${fallbackTitle || ''}|${fallbackBrand || ''}`;
  const cached = DISPLAY_URL_MEMO.get(memoKey);
  if (cached) return cached;
  
  // Force all images to be served entirely from the official ParsPack bucket
  if (url.includes("unsplash.com")) {
    url = "http://c102393.parspack.net/c102393/products/prd_1.webp";
  }

  // If it's already a proxied URL, unwrap to direct CDN URL
  if (url.includes("/api/proxy-image?url=") || url.includes("/php/api.php?action=proxy-image&url=")) {
    try {
      const match = url.match(/[?&]url=([^&]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        url = decoded.startsWith("//") ? "https:" + decoded : decoded;
      }
    } catch (e) {
      // ignore
    }
  }

  // Upgrade http to https for ParsPack CDN
  if (url.startsWith("http://c102393.parspack.net")) {
    url = url.replace("http://c102393.parspack.net", "https://c102393.parspack.net");
  } else if (url.startsWith("http://") && (url.includes("parspack.net") || url.includes("parsstorage.com"))) {
    url = url.replace("http://", "https://");
  }
  
  // Relative path or local asset
  if (url.startsWith("/") && !url.startsWith("//")) {
    DISPLAY_URL_MEMO.set(memoKey, url);
    return url;
  }
  if (url.startsWith("data:")) {
    DISPLAY_URL_MEMO.set(memoKey, url);
    return url;
  }
  if (url.startsWith("blob:")) {
    DISPLAY_URL_MEMO.set(memoKey, url);
    return url;
  }

  // Handle protocol-relative URLs (e.g. //c102393.parspack.net/...)
  if (url.startsWith("//")) {
    url = "https:" + url;
  }
  
  // Basic URL validation
  try {
    new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch (e) {
    const fallback = getProductFallbackSvg(fallbackTitle, fallbackBrand);
    DISPLAY_URL_MEMO.set(memoKey, fallback);
    return fallback;
  }
  
  // Direct ParsPack & direct HTTPS bucket URLs load directly with CDN edge speed
  const isDirectBucket = url.includes("parspack.net") || url.includes("parsstorage.com") || url.includes("storage.iran") || url.startsWith("https://");
  if (isDirectBucket) {
    DISPLAY_URL_MEMO.set(memoKey, url);
    return url;
  }

  // Prevent proxying self-hosted fully qualified URLs
  if (typeof window !== 'undefined' && url.includes(window.location.hostname)) {
    DISPLAY_URL_MEMO.set(memoKey, url);
    return url;
  }

  // Fallback direct URL
  DISPLAY_URL_MEMO.set(memoKey, url);
  return url;
}

/**
 * Universal product image extractor that checks all common field names
 */
export function getProductImage(product: any): string {
  if (!product) return getProductFallbackSvg();
  const raw = product.image_url || product.imageUrl || product.image || (product.galleryUrls && product.galleryUrls[0]) || "";
  return getDisplayImageUrl(raw, product.name, product.brand);
}


