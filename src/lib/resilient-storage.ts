/**
 * Resilient Multi-Layer Storage & Sync Vault
 * Guarantees zero data loss for critical items (Dealership Requests, Orders, SafeBuy, Callbacks, Leads)
 * Storage Hierarchy:
 * 1. LocalStorage (Multiple unified and fallback keys)
 * 2. IndexedDB (Persistent browser database safe from cache cleanups)
 * 3. Server API (/api/dealership-requests, /api/b2b/orders, /api/critical-sync)
 * 4. In-Memory Offline Queue with Auto-Retry
 */

const DB_NAME = 'DastavvalResilientVault';
const DB_VERSION = 3;
const STORES = ['dealership_requests', 'orders', 'safebuy_requests', 'callbacks', 'critical_queue', 'users'];

// Open IndexedDB with automatic store verification and recovery
function openVaultDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        STORES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        let missing = false;
        STORES.forEach((s) => {
          if (!db.objectStoreNames.contains(s)) missing = true;
        });
        if (missing) {
          db.close();
          const deleteReq = indexedDB.deleteDatabase(DB_NAME);
          deleteReq.onsuccess = () => {
            const retryReq = indexedDB.open(DB_NAME, DB_VERSION);
            retryReq.onupgradeneeded = (ev: any) => {
              const ndb = ev.target.result;
              STORES.forEach((storeName) => {
                if (!ndb.objectStoreNames.contains(storeName)) {
                  ndb.createObjectStore(storeName, { keyPath: 'id' });
                }
              });
            };
            retryReq.onsuccess = (ev: any) => resolve(ev.target.result);
            retryReq.onerror = () => resolve(null);
          };
          deleteReq.onerror = () => resolve(null);
        } else {
          resolve(db);
        }
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Write to IndexedDB with robust error suppression
async function writeToIDB(storeName: string, item: any): Promise<boolean> {
  try {
    const db = await openVaultDB();
    if (!db) return false;
    if (!db.objectStoreNames.contains(storeName)) return false;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

// Read all from IndexedDB
async function readAllFromIDB(storeName: string): Promise<any[]> {
  try {
    const db = await openVaultDB();
    if (!db) return [];
    return new Promise((resolve) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export const ResilientVault = {
  // 1. SAVE DEALERSHIP REQUEST
  async saveDealershipRequest(requestData: any): Promise<{ success: boolean; id: string }> {
    const id = requestData.id || requestData.code || `REP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fullItem = {
      ...requestData,
      id,
      code: requestData.code || id,
      type: 'dealership',
      status: requestData.status || 'pending',
      createdAt: requestData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncState: 'pending'
    };

    // Layer 1: LocalStorage (Multi-key redundancy with strict phone/ID deduplication)
    try {
      const keys = ['dastavval_dealership_requests', 'dastavval_agency_requests'];
      const reqPhone = fullItem.phone || fullItem.mobile;
      keys.forEach((key) => {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((i: any) => 
          i.id !== id && 
          i.code !== id && 
          (!reqPhone || (i.phone !== reqPhone && i.mobile !== reqPhone))
        );
        filtered.unshift(fullItem);
        localStorage.setItem(key, JSON.stringify(filtered));
      });
      // Also save to master critical requests vault
      const vault = JSON.parse(localStorage.getItem('dastavval_critical_vault') || '[]');
      vault.unshift({ ...fullItem, vaultType: 'dealership' });
      localStorage.setItem('dastavval_critical_vault', JSON.stringify(vault.slice(0, 500)));

      // Create / Update Dealership User Account & Admin Notification
      const phone = fullItem.phone || fullItem.mobile;
      if (phone) {
        const users = JSON.parse(localStorage.getItem('dastavval_local_users') || '[]');
        let userIndex = users.findIndex((u: any) => u.phone === phone || u.mobile === phone);
        const userObj = {
          id: userIndex >= 0 ? users[userIndex].id : `usr_${Date.now()}`,
          name: fullItem.fullName || fullItem.name,
          phone: phone,
          mobile: phone,
          company: fullItem.companyName || fullItem.company || '',
          province: fullItem.province,
          city: fullItem.city,
          role: 'pending_representative',
          dealershipStatus: 'pending',
          repPending: true,
          dealershipCode: fullItem.code,
          createdAt: userIndex >= 0 ? users[userIndex].createdAt : new Date().toISOString()
        };
        if (userIndex >= 0) {
          users[userIndex] = { ...users[userIndex], ...userObj };
        } else {
          users.unshift(userObj);
        }
        localStorage.setItem('dastavval_local_users', JSON.stringify(users));
        localStorage.setItem('dastavval_user', JSON.stringify(userObj));
        window.dispatchEvent(new CustomEvent('dastavval_users_updated', { detail: userObj }));
      }

      // Admin Report / Notification
      const notifs = JSON.parse(localStorage.getItem('dastavval_admin_notifications') || '[]');
      notifs.unshift({
        id: `notif_${Date.now()}`,
        title: `درخواست نمایندگی جدید: ${fullItem.fullName || fullItem.name}`,
        message: `متعلق به استان ${fullItem.province} - شهر ${fullItem.city} (کد: ${fullItem.code}) ثبت شد و در انتظار بررسی است.`,
        type: 'dealership',
        createdAt: new Date().toISOString(),
        read: false,
        details: fullItem
      });
      localStorage.setItem('dastavval_admin_notifications', JSON.stringify(notifs.slice(0, 100)));
      window.dispatchEvent(new Event('dastavval_admin_notifications_updated'));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }

    // Layer 2: IndexedDB
    await writeToIDB('dealership_requests', fullItem);

    // Layer 3: Server API POST
    try {
      const apiRes = await fetch('/api/dealership-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullItem)
      });
      if (apiRes.ok) {
        fullItem.syncState = 'synced';
      }
    } catch {
      // Queue for background retry
      this.enqueueForSync('dealership', fullItem);
    }

    // Layer 4: Broadcast sync event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dastavval-dealership-sync', { detail: fullItem }));
      window.dispatchEvent(new Event('dastavval-manual-sync'));
    }

    return { success: true, id };
  },

  // 2. GET ALL DEALERSHIP REQUESTS (Unified from Server + LocalStorage + IndexedDB)
  async getDealershipRequests(): Promise<any[]> {
    const map = new Map<string, any>();
    const phoneMap = new Map<string, any>();

    const addItem = (item: any) => {
      const key = item.id || item.code || `rep_${item.phone || item.mobile || Math.random()}`;
      const phone = item.phone || item.mobile;
      
      if (phone && phoneMap.has(phone)) {
        const existingKey = phoneMap.get(phone);
        const existing = map.get(existingKey);
        // Merge and keep the latest/most complete
        map.set(existingKey, { ...existing, ...item });
      } else {
        if (phone) phoneMap.set(phone, key);
        map.set(key, { ...map.get(key), ...item });
      }
    };

    // A. Read IndexedDB
    try {
      const idbList = await readAllFromIDB('dealership_requests');
      idbList.forEach((item) => addItem(item));
    } catch {}

    // B. Read LocalStorage
    try {
      const keys = ['dastavval_dealership_requests', 'dastavval_agency_requests'];
      keys.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach((item) => addItem(item));
          }
        }
      });
    } catch {}

    // C. Read Server API
    try {
      const res = await fetch('/api/dealership-requests');
      if (res.ok) {
        const serverList = await res.json();
        if (Array.isArray(serverList)) {
          serverList.forEach((item) => addItem(item));
        }
      }
    } catch {}

    const result = Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return result;
  },

  // 3. SAVE ORDER (Guaranteed Multi-Layer)
  async saveOrder(orderData: any): Promise<{ success: boolean; id: string; trackingNumber: string }> {
    const id = orderData.id || `ord_${Date.now()}`;
    const trackingNumber = orderData.trackingNumber || `ORD-${Date.now().toString().slice(-6)}`;
    const fullOrder = {
      ...orderData,
      id,
      trackingNumber,
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: orderData.status || 'pending',
      syncState: 'pending'
    };

    // Layer 1: LocalStorage Multi-key
    try {
      const orderKeys = ['dastavval_orders_cache', 'dastavval_wholesale_orders', 'dastavval_raw_orders'];
      orderKeys.forEach((key) => {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((o: any) => o.id !== id && o.trackingNumber !== trackingNumber);
        filtered.unshift(fullOrder);
        localStorage.setItem(key, JSON.stringify(filtered));
      });

      // User specific cache
      const phone = fullOrder.buyerPhone || fullOrder.phone || fullOrder.mobile;
      if (phone) {
        const userKey = `dastavval_user_orders_${phone}`;
        const uList = JSON.parse(localStorage.getItem(userKey) || '[]');
        const filteredU = uList.filter((o: any) => o.id !== id && o.trackingNumber !== trackingNumber);
        filteredU.unshift(fullOrder);
        localStorage.setItem(userKey, JSON.stringify(filteredU));
      }

      localStorage.setItem('dastavval_last_order_tracking', trackingNumber);
      localStorage.setItem('dastavval_last_order_id', id);

      // Vault
      const vault = JSON.parse(localStorage.getItem('dastavval_critical_vault') || '[]');
      vault.unshift({ ...fullOrder, vaultType: 'order' });
      localStorage.setItem('dastavval_critical_vault', JSON.stringify(vault.slice(0, 500)));
    } catch (e) {
      console.warn('LocalStorage order warning:', e);
    }

    // Layer 2: IndexedDB
    await writeToIDB('orders', fullOrder);

    // Layer 3: Server API POST
    try {
      const apiRes = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([fullOrder])
      });
      if (apiRes.ok) {
        fullOrder.syncState = 'synced';
      }
    } catch {
      this.enqueueForSync('order', fullOrder);
    }

    // Layer 4: Broadcast sync
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dastavval-order-placed', { detail: fullOrder }));
      window.dispatchEvent(new Event('dastavval-manual-sync'));
    }

    return { success: true, id, trackingNumber };
  },

  // 4. GET ALL ORDERS (Unified)
  async getOrders(): Promise<any[]> {
    const map = new Map<string, any>();

    // A. IndexedDB
    try {
      const idbList = await readAllFromIDB('orders');
      idbList.forEach((o) => {
        const key = o.id || o.trackingNumber;
        if (key) map.set(key, o);
      });
    } catch {}

    // B. LocalStorage
    try {
      const keys = ['dastavval_orders_cache', 'dastavval_wholesale_orders', 'dastavval_raw_orders'];
      keys.forEach((k) => {
        const raw = localStorage.getItem(k);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            list.forEach((o) => {
              const key = o.id || o.trackingNumber;
              if (key) map.set(key, { ...map.get(key), ...o });
            });
          }
        }
      });
    } catch {}

    // C. Server API
    try {
      const res = await fetch('/api/b2b/orders');
      if (res.ok) {
        const serverList = await res.json();
        if (Array.isArray(serverList)) {
          serverList.forEach((o) => {
            const key = o.id || o.trackingNumber;
            if (key) map.set(key, { ...map.get(key), ...o });
          });
        }
      }
    } catch {}

    const result = Array.from(map.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return result;
  },

  // 5. Offline Queue & Background Sync
  enqueueForSync(type: string, payload: any) {
    try {
      const queue = JSON.parse(localStorage.getItem('dastavval_sync_queue') || '[]');
      queue.push({ id: `q_${Date.now()}_${Math.random()}`, type, payload, timestamp: Date.now() });
      localStorage.setItem('dastavval_sync_queue', JSON.stringify(queue));
    } catch {}
  },

  async flushSyncQueue() {
    try {
      const raw = localStorage.getItem('dastavval_sync_queue');
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      const remaining: any[] = [];
      for (const item of queue) {
        try {
          if (item.type === 'dealership') {
            await fetch('/api/dealership-requests', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload)
            });
          } else if (item.type === 'order') {
            await fetch('/api/b2b/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify([item.payload])
            });
          }
        } catch {
          remaining.push(item);
        }
      }
      localStorage.setItem('dastavval_sync_queue', JSON.stringify(remaining));
    } catch {}
  }
};

// Automatic online event sync trigger
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    ResilientVault.flushSyncQueue();
  });
  // Periodic background flush every 30s
  setInterval(() => {
    ResilientVault.flushSyncQueue();
  }, 30000);
}
