/**
 * Intelligent S3 Bucket & Storage Preload Service (Cache-First & IndexedDB)
 * Extracts stable S3 bucket endpoints, factory logos, and product image URLs from B2B settings
 * and preloads/optimizes them prior to final component rendering to eliminate any placeholder flashing.
 * Pulls critical cached datasets directly from IndexedDB / LocalStorage Cache-First before render.
 */

import { getDisplayImageUrl } from "./image-utils";

interface PreloadOptions {
  enableLinkPreload?: boolean;
  maxPreloadCount?: number;
}

class S3PreloadService {
  private preloadedUrls = new Set<string>();
  private isInitialized = false;
  private cachedProductsPromise: Promise<any[]> | null = null;

  /**
   * Cache-First getter for critical products from IndexedDB / LocalStorage before App render
   */
  public async loadCriticalDataCacheFirst(): Promise<{ products: any[]; b2bConfig: any }> {
    if (typeof window === 'undefined') return { products: [], b2bConfig: {} };

    let cachedProducts: any[] = [];
    let cachedConfig: any = {};

    // 1. Try LocalStorage Cache first (instant)
    try {
      const lsProds = localStorage.getItem("app_db_products") || localStorage.getItem("mock_db_products");
      if (lsProds) {
        const parsed = JSON.parse(lsProds);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cachedProducts = parsed;
        }
      }
      const lsConfig = localStorage.getItem("dastavval_b2b_config");
      if (lsConfig) {
        cachedConfig = JSON.parse(lsConfig);
      }
    } catch (e) {
      console.warn("S3PreloadService: LocalStorage cache read warning", e);
    }

    // 2. Try IndexedDB Cache-First if IDB is available
    if (cachedProducts.length === 0 && window.indexedDB) {
      try {
        const dbPromise = new Promise<any[]>((resolve) => {
          const req = indexedDB.open('DastavvalResilientVault', 1);
          req.onsuccess = (e: any) => {
            const db = e.target.result;
            if (db.objectStoreNames.contains('products')) {
              const tx = db.transaction('products', 'readonly');
              const store = tx.objectStore('products');
              const allReq = store.getAll();
              allReq.onsuccess = () => resolve(allReq.result || []);
              allReq.onerror = () => resolve([]);
            } else {
              resolve([]);
            }
          };
          req.onerror = () => resolve([]);
        });
        const idbProds = await Promise.race([
          dbPromise,
          new Promise<any[]>((res) => setTimeout(() => res([]), 400)) // timeout safeguard
        ]);
        if (Array.isArray(idbProds) && idbProds.length > 0) {
          cachedProducts = idbProds;
        }
      } catch (err) {
        console.warn("S3PreloadService: IndexedDB preload read warning", err);
      }
    }

    // 3. Trigger background asset warmup for preloaded products
    if (cachedProducts.length > 0) {
      this.preloadBucketAssets(cachedProducts, { enableLinkPreload: true });
    }

    return { products: cachedProducts, b2bConfig: cachedConfig };
  }

  /**
   * Initializes preloading of bucket assets and product catalog images
   */
  public async preloadBucketAssets(products: Array<{ imageUrl?: string; image_url?: string; logoUrl?: string }>, options: PreloadOptions = {}): Promise<void> {
    if (typeof window === 'undefined') return;

    const maxCount = options.maxPreloadCount || 50;
    const urlsToPreload: string[] = [];

    // 1. Gather product images
    for (const prod of (products || []).slice(0, maxCount)) {
      const rawImg = prod.imageUrl || prod.image_url;
      if (rawImg) {
        const optimizedUrl = getDisplayImageUrl(rawImg);
        if (optimizedUrl && !this.preloadedUrls.has(optimizedUrl)) {
          urlsToPreload.push(optimizedUrl);
          this.preloadedUrls.add(optimizedUrl);
        }
      }
    }

    // 2. Fetch B2B config for bucket endpoints and gallery items
    try {
      const res = await fetch("/api/b2b/config");
      if (res.ok) {
        const config = await res.json();
        
        // Add logo / mascot
        if (config.logoUrl) {
          const optLogo = getDisplayImageUrl(config.logoUrl);
          if (optLogo && !this.preloadedUrls.has(optLogo)) {
            urlsToPreload.push(optLogo);
            this.preloadedUrls.add(optLogo);
          }
        }
        if (config.mascotUrl) {
          const optMascot = getDisplayImageUrl(config.mascotUrl);
          if (optMascot && !this.preloadedUrls.has(optMascot)) {
            urlsToPreload.push(optMascot);
            this.preloadedUrls.add(optMascot);
          }
        }

        // Add gallery / banner items from bucket
        if (Array.isArray(config.gallery)) {
          for (const item of config.gallery.slice(0, 20)) {
            const optGallery = getDisplayImageUrl(typeof item === 'string' ? item : item.url);
            if (optGallery && !this.preloadedUrls.has(optGallery)) {
              urlsToPreload.push(optGallery);
              this.preloadedUrls.add(optGallery);
            }
          }
        }
      }
    } catch (err) {
      console.warn("S3PreloadService: Failed to fetch B2B config for asset preloading", err);
    }

    // 3. Execute preloading via Image objects and optional Link preloads
    urlsToPreload.forEach((url) => {
      // Background Image object instantiation to warm browser cache
      const img = new Image();
      img.src = url;

      // Optional DOM Link Preload
      if (options.enableLinkPreload) {
        try {
          const existingLink = document.querySelector(`link[href="${url}"]`);
          if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = url;
            document.head.appendChild(link);
          }
        } catch (e) {
          // Ignore DOM insertion errors
        }
      }
    });

    this.isInitialized = true;
    console.log(`[S3PreloadService] Cache-First preloading successfully initiated for ${urlsToPreload.length} optimized bucket assets.`);
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export const s3PreloadService = new S3PreloadService();

