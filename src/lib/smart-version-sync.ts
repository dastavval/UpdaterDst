/**
 * Smart Version Sync System
 * Checks version.json on app boot, fetches updated catalogs and prices asynchronously if version changed,
 * and updates IndexedDB without requiring a full page reload.
 */

import { cacheProducts } from './db';

const CURRENT_VERSION_KEY = 'dastavval_app_version';

export async function checkAndSyncAppVersion(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;

    const remoteVersionData = await res.json();
    const localVersionStr = localStorage.getItem(CURRENT_VERSION_KEY);
    
    let localVersionData: any = null;
    try {
      localVersionData = localVersionStr ? JSON.parse(localVersionStr) : null;
    } catch {
      localVersionData = null;
    }

    // If version changed or first load
    if (!localVersionData || localVersionData.version !== remoteVersionData.version || localVersionData.catalogHash !== remoteVersionData.catalogHash) {
      console.log('🔄 New app version detected:', remoteVersionData.version, 'Syncing catalog & prices asynchronously...');

      try {
        const catalogRes = await fetch('/api/products?t=' + Date.now()).catch(() => null);
        if (catalogRes && catalogRes.ok) {
          const products = await catalogRes.json();
          if (Array.isArray(products) && products.length > 0) {
            await cacheProducts(products);
            localStorage.setItem("app_db_products_v4.0", JSON.stringify(products));
          }
        }
      } catch (err) {
        console.warn('Catalog async sync warning:', err);
      }

      // Save new version info locally
      localStorage.setItem(CURRENT_VERSION_KEY, JSON.stringify(remoteVersionData));
      window.dispatchEvent(new CustomEvent('dastavval_version_updated', { detail: remoteVersionData }));
    }
  } catch (e) {
    console.warn('Smart version sync check skipped:', e);
  }
}
