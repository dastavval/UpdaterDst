export function cleanUnitName(unitStr?: string): string {
  if (!unitStr) return "عدد";
  let cleaned = String(unitStr).replace(/\(عدد\)|\(وزنی\)|\(پاکت\)|\(بسته\)|\(کیلوگرم\)/gi, "").trim();
  return cleaned || "عدد";
}

export function getDisplayImageUrl(rawUrl?: string): string {
  if (!rawUrl) return "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=300";
  const url = String(rawUrl).trim();
  if (url.startsWith("/api/proxy-image")) return url;
  if (
    url.includes("parspack.net") ||
    url.includes("parsstorage.com") ||
    url.includes("s3.") ||
    url.startsWith("http://")
  ) {
    const httpUrl = url.replace(/^https:\/\//i, "http://");
    return `/api/proxy-image?url=${encodeURIComponent(httpUrl)}`;
  }
  return url;
}

