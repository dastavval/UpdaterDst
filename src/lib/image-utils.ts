export function cleanUnitName(unitStr?: string): string {
  if (!unitStr) return "عدد";
  let cleaned = String(unitStr).replace(/\(عدد\)|\(وزنی\)|\(پاکت\)|\(بسته\)|\(کیلوگرم\)/gi, "").trim();
  return cleaned || "عدد";
}

export function getDisplayImageUrl(rawUrl?: string): string {
  if (!rawUrl) return "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=300";
  let url = String(rawUrl).trim();
  
  if (url.startsWith("/api/proxy-image")) return url;
  
  // Handle protocol-relative URLs (e.g. //c102393.parspack.net/...)
  if (url.startsWith("//")) {
    url = "http:" + url;
  }
  
  const isParsPack = url.includes("parspack.net") || url.includes("parsstorage.com");
  const isS3 = url.includes("s3.");
  const isHttp = url.startsWith("http://");

  if (isParsPack || isS3 || isHttp) {
    // Force HTTP for ParsPack/S3 to bypass SSL issues if needed, 
    // and proxy all HTTP/S3 images to bypass CORS/Mixed-Content
    const targetUrl = url.replace(/^https:\/\//i, "http://");
    return `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
  }
  
  return url;
}

