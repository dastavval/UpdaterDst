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

export function getDisplayImageUrl(rawUrl?: string, fallbackTitle?: string, fallbackBrand?: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return getProductFallbackSvg(fallbackTitle, fallbackBrand);
  }
  
  let url = rawUrl.trim();
  if (!url) return getProductFallbackSvg(fallbackTitle, fallbackBrand);
  
  // Already proxied
  if (url.startsWith("/api/proxy-image") || url.startsWith("/php/api.php?action=proxy-image")) return url;
  
  // Relative path or local asset
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("blob:")) return url;

  // Handle protocol-relative URLs (e.g. //c102393.parspack.net/...)
  if (url.startsWith("//")) {
    url = "https:" + url;
  }
  
  // Basic URL validation
  try {
    new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch (e) {
    return getProductFallbackSvg(fallbackTitle, fallbackBrand);
  }
  
  const isParsPack = url.includes("parspack.net") || url.includes("parsstorage.com") || url.includes("storage");
  const isS3 = url.includes("s3.");
  const isHttp = url.startsWith("http://");

  // Prevent proxying self-hosted fully qualified URLs
  if (typeof window !== 'undefined' && url.includes(window.location.hostname)) {
    return url;
  }

  // Determine proxy URL path based on hosting environment
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.port === '3000' || window.location.hostname.includes('run.app') || window.location.hostname === 'localhost');
  const proxyPath = isDevelopment ? `/api/proxy-image?url=` : `/php/api.php?action=proxy-image&url=`;

  // Proxy external images for CORS, mixed-content, and ParsPack port 443 safety
  if (isParsPack || isS3 || isHttp || !url.includes("unsplash.com")) {
    return `${proxyPath}${encodeURIComponent(url)}`;
  }
  
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


