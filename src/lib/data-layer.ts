const MEMORY_DB: Record<string, any[]> = {};

export function clearLocalCache(): void {
  for (const key in MEMORY_DB) {
    delete MEMORY_DB[key];
  }
}

function getCollectionKey(path: string): string {
  return `app_db_${path.replace(/\//g, '_')}`;
}

function loadCollection(path: string): any[] {
  if (MEMORY_DB[path] !== undefined) {
    return MEMORY_DB[path];
  }
  
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(getCollectionKey(path));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          MEMORY_DB[path] = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
  }
  MEMORY_DB[path] = [];
  return MEMORY_DB[path];
}

export function saveCollection(path: string, items: any[]): void {
  MEMORY_DB[path] = items;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getCollectionKey(path), JSON.stringify(items));
      
      // Sync with server in background
      const apiPath = path === "products" ? "/api/b2b/products" : 
                      path === "orders" ? "/api/b2b/orders" : 
                      path === "users" ? "/api/b2b/users" : null;
      
      if (apiPath) {
        fetch(apiPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(items)
        }).catch(err => console.warn(`Failed to sync ${path} to server:`, err));
      }
    } catch (e) {
      console.error("Error writing to localStorage:", e);
    }
  }
}

// Persistent Data Access API
export const collection = (db: any, path: string) => ({ path });
export const doc = (dbOrColl: any, pathOrId?: string, maybeId?: string) => {
  if (maybeId) return { path: pathOrId, id: maybeId };
  if (dbOrColl && dbOrColl.path && pathOrId) return { path: dbOrColl.path, id: pathOrId };
  return { path: pathOrId || "unknown", id: maybeId || Math.random().toString(36).substr(2, 9) };
};

export const getDocs = async (collOrQuery: any) => {
  const path = collOrQuery?.path || collOrQuery?.collectionPath || "products";
  const apiPath = path === "products" ? "/api/b2b/products" : 
                  path === "orders" ? "/api/b2b/orders" : 
                  path === "users" ? "/api/b2b/users" : null;
  
  let items = loadCollection(path);
  
  if (apiPath) {
    try {
      const res = await fetch(apiPath);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          items = data;
          MEMORY_DB[path] = items;
          if (typeof window !== "undefined") {
            localStorage.setItem(getCollectionKey(path), JSON.stringify(items));
          }
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch ${path} from server:`, err);
    }
  }
  
  return {
    docs: items.map((item, idx) => ({
      id: item.id || `doc_${path}_${idx}`,
      data: () => item
    })),
    empty: items.length === 0,
    size: items.length,
    forEach: (cb: (doc: any) => void) => {
      items.map((item, idx) => ({
        id: item.id || `doc_${path}_${idx}`,
        data: () => item
      })).forEach(cb);
    }
  };
};

export const addDoc = async (coll: any, data: any) => {
  const path = coll?.path || "products";
  const items = loadCollection(path);
  const id = data.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const newItem = { ...data, id };
  items.push(newItem);
  saveCollection(path, items);
  return { id };
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const path = docRef?.path || "products";
  const id = docRef?.id || data.id || `doc_${Date.now()}`;
  const items = loadCollection(path);
  const index = items.findIndex(i => i.id === id);
  if (index >= 0) {
    items[index] = options?.merge ? { ...items[index], ...data } : { ...data, id };
  } else {
    items.push({ ...data, id });
  }
  saveCollection(path, items);
};

export const updateDoc = async (docRef: any, updatedFields: any) => {
  const path = docRef?.path || "products";
  const id = docRef?.id;
  if (!id) return;
  const items = loadCollection(path);
  const index = items.findIndex(i => i.id === id);
  if (index >= 0) {
    items[index] = { ...items[index], ...updatedFields };
    saveCollection(path, items);
  }
};

export const deleteDoc = async (docRef: any) => {
  const path = docRef?.path || "products";
  const id = docRef?.id;
  if (!id) return;
  const items = loadCollection(path);
  const filtered = items.filter(i => i.id !== id);
  saveCollection(path, filtered);
};

export const batchDelete = async (path: string, ids: string[]) => {
  if (!ids || ids.length === 0) return;
  const items = loadCollection(path);
  const idsSet = new Set(ids);
  const filtered = items.filter(i => !idsSet.has(i.id));
  saveCollection(path, filtered);
};

export const getDocFromServer = async (docRef: any) => {
  return { exists: () => true, data: () => ({ status: 'online' }) };
};

export const serverTimestamp = () => new Date().toISOString();
export const query = (coll: any, ...args: any[]) => ({ path: coll?.path || "products" });
export const orderBy = (...args: any[]) => ({});
export const where = (...args: any[]) => ({});
export const onSnapshot = (...args: any[]) => () => {};

// Authentication API
export const db = {} as any;
export const auth = {
  currentUser: null,
  onAuthStateChanged: (cb: any) => cb(null),
} as any;

export const signInWithEmailAndPassword = async (...args: any[]) => {
  const emailOrPhone = args[1]?.toLowerCase().trim() || "";
  const password = args[2] || "";

  if ((emailOrPhone === '09914762406' || emailOrPhone === 'admin@dastaval.ir') && password === '@Ali3360') {
    return {
      user: { uid: 'admin_uid', email: emailOrPhone, displayName: 'مدیریت کل سامانه' }
    };
  }

  // Check server for users (or use localStorage fallback)
  let localUsers: Record<string, any> = {};
  try {
    const res = await fetch("/api/b2b/users");
    if (res.ok) {
      localUsers = await res.json();
    } else if (typeof window !== "undefined") {
      localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
    }
  } catch (e) {
    if (typeof window !== "undefined") {
      localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
    }
  }

  let foundUser = Object.values(localUsers).find(
    (u: any) => 
      u.email?.toLowerCase().trim() === emailOrPhone || 
      u.phone?.trim() === emailOrPhone
  );

  if (!foundUser) throw new Error("کاربری با این مشخصات یافت نشد.");
  if (foundUser.password !== password) throw new Error("رمز عبور اشتباه است.");
  if (foundUser.status === 'pending') throw new Error("حساب کاربری شما در انتظار تایید مدیریت است.");

  return {
    user: {
      uid: foundUser.id || foundUser.userCode || `uid_${Date.now()}`,
      email: foundUser.email || emailOrPhone,
      displayName: foundUser.name || 'کاربر گرامی'
    }
  };
};

export const createUserWithEmailAndPassword = async (...args: any[]) => ({
  user: { uid: `uid_${Date.now()}`, email: args[1], displayName: 'کاربر گرامی' }
});

export const signOut = async (...args: any[]) => {};
export const updateProfile = async (...args: any[]) => {};
export const updatePassword = async (...args: any[]) => {};
