import { collection, getDocs, addDoc, serverTimestamp, db } from "./data-layer";
import { Product, NewsArticle, FactoryProfile } from "../types";
import { REAL_PRODUCTS_CATALOG } from "../data/real-products";

export const INITIAL_NEWS: NewsArticle[] = [];

export const INITIAL_FACTORIES: FactoryProfile[] = [];

export const INITIAL_PRODUCTS: Product[] = REAL_PRODUCTS_CATALOG;

export const INITIAL_CATEGORIES = [];

export interface CacheStatus {
  isHealthy: boolean;
  itemCount: number;
  lastUpdate: string | null;
}

export async function getCacheStatus(): Promise<CacheStatus> {
  try {
    const raw = localStorage.getItem("dastavval_local_cache_meta");
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      isHealthy: true,
      itemCount: parsed?.itemCount || 0,
      lastUpdate: parsed?.lastUpdate || new Date().toISOString()
    };
  } catch (e) {
    return {
      isHealthy: false,
      itemCount: 0,
      lastUpdate: null
    };
  }
}

export async function clearAllCaches(): Promise<void> {
  try {
    sessionStorage.clear();
    const preserveKeys = [
      "dastavval_user",
      "dastavval_local_users",
      "dastavval_cart",
      "dastavval_b2b_config_v2",
      "dastavval_sponsored_ads_v2",
      "dastavval_wholesale_orders"
    ];
    const preserved: Record<string, string> = {};
    preserveKeys.forEach(k => {
      const v = localStorage.getItem(k);
      if (v) preserved[k] = v;
    });

    localStorage.clear();

    Object.entries(preserved).forEach(([k, v]) => {
      localStorage.setItem(k, v);
    });

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  } catch (e) {
    console.warn("Failed to clear cache:", e);
  }
}

export async function seedProductsIfEmpty(): Promise<void> {
  try {
    const q = collection(db, "products");
    const snapshot = await getDocs(q);
    if (snapshot.empty && INITIAL_PRODUCTS.length > 0) {
      for (const p of INITIAL_PRODUCTS) {
        await addDoc(collection(db, "products"), {
          ...p,
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (err) {
    console.warn("Seeding products check encountered issue:", err);
  }
}
