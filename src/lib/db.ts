import { openDB, IDBPDatabase } from 'idb';

export interface CacheStatus {
  isHealthy: boolean;
  itemCount: number;
  lastUpdate: number | null;
}

const DB_NAME = 'dastavval_cache_v3';
const DB_VERSION = 1;
const PRODUCTS_STORE = 'products';
const CONFIG_STORE = 'b2b_config';

let dbPromise: Promise<IDBPDatabase> | null = null;

export async function initDB() {
  if (typeof window === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PRODUCTS_STORE)) {
          db.createObjectStore(PRODUCTS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(CONFIG_STORE)) {
          db.createObjectStore(CONFIG_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheProducts(products: any[]): Promise<void> {
  const db = await initDB();
  if (!db) return;

  const tx = db.transaction(PRODUCTS_STORE, 'readwrite');
  const store = tx.objectStore(PRODUCTS_STORE);
  
  await store.clear();
  const timestamp = Date.now();
  
  for (const p of products) {
    await store.put({ ...p, _cachedAt: timestamp });
  }
  
  await tx.done;
}

export async function getCachedProducts(): Promise<any[]> {
  const db = await initDB();
  if (!db) return [];
  return db.getAll(PRODUCTS_STORE);
}

export async function getCacheStatus(): Promise<CacheStatus> {
  try {
    const db = await initDB();
    if (!db) return { isHealthy: false, itemCount: 0, lastUpdate: null };

    const items = await db.getAll(PRODUCTS_STORE);
    const count = items.length;
    let lastUpdate: number | null = null;
    
    if (count > 0) {
      lastUpdate = Math.max(...items.map((i: any) => i._cachedAt || 0));
    }

    return {
      isHealthy: true,
      itemCount: count,
      lastUpdate
    };
  } catch (e) {
    return { isHealthy: false, itemCount: 0, lastUpdate: null };
  }
}

export async function cacheB2bConfig(config: any): Promise<void> {
  const db = await initDB();
  if (!db) return;

  const tx = db.transaction(CONFIG_STORE, 'readwrite');
  const store = tx.objectStore(CONFIG_STORE);
  
  await store.clear();
  await store.put({ id: 'main_config', data: config, _cachedAt: Date.now() });
  
  await tx.done;
}

export async function getCachedB2bConfig(): Promise<any | null> {
  const db = await initDB();
  if (!db) return null;
  
  const result = await db.get(CONFIG_STORE, 'main_config');
  return result ? result.data : null;
}
