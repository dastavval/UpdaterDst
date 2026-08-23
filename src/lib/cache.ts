import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'b2b-platform-cache';
const DB_VERSION = 1;
const STORE_NAME = 'app-data';

interface CacheData {
  id: string;
  data: any;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export const initDB = () => {
  if (typeof window === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const saveToCache = async (id: string, data: any) => {
  const db = await initDB();
  if (!db) return;
  
  await db.put(STORE_NAME, {
    id,
    data,
    timestamp: Date.now()
  });
};

export const getFromCache = async (id: string, maxAgeMs: number = 3600000) => {
  const db = await initDB();
  if (!db) return null;
  
  const entry = await db.get(STORE_NAME, id) as CacheData | undefined;
  
  if (!entry) return null;
  
  // Optional: Check expiration
  if (Date.now() - entry.timestamp > maxAgeMs) {
    return null;
  }
  
  return entry.data;
};

export const clearCache = async () => {
  const db = await initDB();
  if (!db) return;
  await db.clear(STORE_NAME);
};
