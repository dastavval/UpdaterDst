const MEMORY_DB: Record<string, any[]> = {};

function getCollectionKey(path: string): string {
  return `mock_db_${path.replace(/\//g, '_')}`;
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
      console.error("Error reading localStorage for mock db:", e);
    }
  }
  MEMORY_DB[path] = [];
  return MEMORY_DB[path];
}

function saveCollection(path: string, items: any[]): void {
  MEMORY_DB[path] = items;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getCollectionKey(path), JSON.stringify(items));
    } catch (e) {
      console.error("Error writing to localStorage for mock db:", e);
    }
  }
}

export const collection = (db: any, path: string) => {
  return { path };
};

export const doc = (dbOrColl: any, pathOrId?: string, maybeId?: string) => {
  if (maybeId) {
    return { path: pathOrId, id: maybeId };
  }
  if (dbOrColl && dbOrColl.path && pathOrId) {
    return { path: dbOrColl.path, id: pathOrId };
  }
  return { path: pathOrId || "unknown", id: maybeId || Math.random().toString(36).substr(2, 9) };
};

export const getDocs = async (collOrQuery: any) => {
  const path = collOrQuery?.path || collOrQuery?.collectionPath || "products";
  const items = loadCollection(path);
  
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

export const signInWithEmailAndPassword = async (...args: any[]) => ({
  user: {
    uid: '123',
    email: args[1] || 'user@example.com',
    displayName: 'کاربر گرامی'
  }
});

export const createUserWithEmailAndPassword = async (...args: any[]) => ({
  user: {
    uid: '123',
    email: args[1] || 'user@example.com',
    displayName: 'کاربر گرامی'
  }
});

export const signOut = async (...args: any[]) => {};
export const updateProfile = async (...args: any[]) => {};
export const updatePassword = async (...args: any[]) => {};

