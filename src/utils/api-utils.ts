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

  return `/php/api.php?action=${cleanPath}`;
}
