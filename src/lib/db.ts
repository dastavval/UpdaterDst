
export interface CacheStatus {
  isHealthy: boolean;
  itemCount: number;
  lastUpdate: number | null;
}

const DB_NAME = 'dastavval_cache';
const DB_VERSION = 1;
const STORE_NAME = 'products';

export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function cacheProducts(products: any[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Clear old data
    store.clear();

    products.forEach(p => {
      store.put({ ...p, _cachedAt: Date.now() });
    });

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCachedProducts(): Promise<any[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCacheStatus(): Promise<CacheStatus> {
  try {
    const db = await initDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const countRequest = store.count();
    const allRequest = store.getAll(); // To check last update time

    return new Promise((resolve) => {
      let count = 0;
      let lastUpdate: number | null = null;

      countRequest.onsuccess = () => {
        count = countRequest.result;
      };

      allRequest.onsuccess = () => {
        const items = allRequest.result;
        if (items.length > 0) {
          lastUpdate = Math.max(...items.map((i: any) => i._cachedAt || 0));
        }
        resolve({
          isHealthy: true,
          itemCount: count,
          lastUpdate
        });
      };

      transaction.onerror = () => resolve({ isHealthy: false, itemCount: 0, lastUpdate: null });
    });
  } catch (e) {
    return { isHealthy: false, itemCount: 0, lastUpdate: null };
  }
}
