export function cleanUnitName(unitStr?: string): string {
  if (!unitStr) return "عدد";
  let cleaned = String(unitStr).replace(/\(عدد\)|\(وزنی\)|\(پاکت\)|\(بسته\)|\(کیلوگرم\)/gi, "").trim();
  return cleaned || "عدد";
}

export function getDisplayImageUrl(rawUrl?: string): string {
  const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=300";
  
  if (!rawUrl || typeof rawUrl !== 'string') return FALLBACK_IMAGE;
  
  let url = rawUrl.trim();
  if (!url) return FALLBACK_IMAGE;
  
  // Already proxied
  if (url.startsWith("/api/proxy-image")) return url;
  
  // Relative path or local asset
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (url.startsWith("data:")) return url;
  if (url.startsWith("blob:")) return url;

  // Handle protocol-relative URLs (e.g. //c102393.parspack.net/...)
  if (url.startsWith("//")) {
    url = "https:" + url; // Default to https for safety, proxy will handle downgrade if needed
  }
  
  // Basic URL validation
  try {
    new URL(url.startsWith('http') ? url : 'https://' + url);
  } catch (e) {
    return FALLBACK_IMAGE;
  }
  
  const isParsPack = url.includes("parspack.net") || url.includes("parsstorage.com");
  const isS3 = url.includes("s3.");
  const isHttp = url.startsWith("http://");

  // Proxy most external images, especially if they are HTTP or from known troublesome domains
  if (isParsPack || isS3 || isHttp || url.includes("storage") || !url.includes("unsplash.com")) {
    return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  
  return url;
}

