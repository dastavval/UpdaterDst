import { getApiUrl } from "../utils/api-utils";

const MEMORY_DB: Record<string, any[]> = {};

const DEFAULT_PRODUCTS_SEED = [
  {
    id: "prod-105",
    sku: "PRD-3210",
    name: "روغن سرخ‌کردنی و پخت‌وپز سونار",
    brand: "سونار",
    description: "روغن گیاهی خالص، مقاوم در برابر حرارت بالا، مناسب مصارف خانگی و صنعتی",
    bulk_price: 2000000,
    price: 2150000,
    consumer_price: 2300000,
    carton_pack_count: 4,
    min_order_cartons: 1,
    stock_quantity_cartons: 50,
    category: "مواد غذایی و کنسروجات",
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    unit: "کارتن",
    sellerId: "factory_cheetoz",
    sellerName: "بازرگانی جلفا",
    production_lead_time_days: 2,
    badge: "کف بازار",
    isFeatured: true,
    isKafBazaar: true,
    rating: 4.8
  },
  {
    id: "prod-103",
    sku: "PRD-9620",
    name: "شکلات مغزدار اسنیکرز کارتن عمده",
    brand: "اسنیکرز",
    description: "شکلات شیری با مغز بادام‌زمینی و کارامل، انرژی‌زا و محبوب",
    bulk_price: 105000,
    price: 112000,
    consumer_price: 125000,
    carton_pack_count: 48,
    min_order_cartons: 2,
    stock_quantity_cartons: 120,
    category: "تنقلات و شکلات",
    image_url: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=600",
    unit: "بسته",
    sellerId: "factory_cheetoz",
    sellerName: "صنایع غذایی به‌آرا (چی‌توز)",
    production_lead_time_days: 1,
    badge: "ویژه",
    isFeatured: true,
    isKafBazaar: true,
    rating: 4.9
  },
  {
    id: "prod-101",
    sku: "PRD-1575",
    name: "آدامس نعنایی بدون قند ویویدنت",
    brand: "ویویدنت",
    description: "بسته ۱۸ عددی آدامس باکیفیت بدون شکر با طعم نعناع خنک",
    bulk_price: 141600,
    price: 150000,
    consumer_price: 165000,
    carton_pack_count: 18,
    min_order_cartons: 3,
    stock_quantity_cartons: 85,
    category: "تنقلات و شکلات",
    image_url: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&q=80&w=600",
    unit: "بسته",
    sellerId: "factory_cheetoz",
    sellerName: "گروه کارخانجات مزمز",
    production_lead_time_days: 2,
    badge: "پرفروش",
    isFeatured: true,
    isKafBazaar: true,
    rating: 4.7
  },
  {
    id: "prod-100",
    sku: "PRD-2510",
    name: "ویفر و شکلات کیت‌کت انگشتی",
    brand: "کیت‌کت",
    description: "ویفر ترد پوشیده از شکلات شیری مرغوب",
    bulk_price: 81250,
    price: 88000,
    consumer_price: 98000,
    carton_pack_count: 24,
    min_order_cartons: 2,
    stock_quantity_cartons: 90,
    category: "تنقلات و شکلات",
    image_url: "https://images.unsplash.com/photo-1548848221-0c2eefb5a3dd?auto=format&fit=crop&q=80&w=600",
    unit: "بسته",
    sellerId: "factory_cheetoz",
    sellerName: "صنایع غذایی به‌آرا (چی‌توز)",
    production_lead_time_days: 2,
    badge: "VIP",
    isFeatured: true,
    isKafBazaar: true,
    rating: 4.9
  },
  {
    id: "prod-106",
    sku: "PRD-4412",
    name: "چیپس سیب‌زمینی نمکی چی‌توز",
    brand: "چی‌توز",
    description: "چیپس ترد سیب‌زمینی با نمک دریایی طبیعی، بسته کارتن عمده",
    bulk_price: 450000,
    price: 480000,
    consumer_price: 540000,
    carton_pack_count: 24,
    min_order_cartons: 5,
    stock_quantity_cartons: 200,
    category: "تنقلات و شکلات",
    image_url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=600",
    unit: "کارتن",
    sellerId: "factory_cheetoz",
    sellerName: "صنایع غذایی به‌آرا (چی‌توز)",
    production_lead_time_days: 1,
    badge: "کف بازار",
    isFeatured: true,
    isKafBazaar: true,
    rating: 5.0
  },
  {
    id: "prod-107",
    sku: "PRD-5520",
    name: "پفک نمکی طلایی اصیل چی‌توز",
    brand: "چی‌توز",
    description: "اسنک هوادهی شده ذرت با پنیر طبیعی و فرمول انحصاری",
    bulk_price: 380000,
    price: 410000,
    consumer_price: 460000,
    carton_pack_count: 30,
    min_order_cartons: 4,
    stock_quantity_cartons: 150,
    category: "تنقلات و شکلات",
    image_url: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&q=80&w=600",
    unit: "کارتن",
    sellerId: "factory_cheetoz",
    sellerName: "صنایع غذایی به‌آرا (چی‌توز)",
    production_lead_time_days: 1,
    badge: "پرفروش",
    isFeatured: true,
    isKafBazaar: true,
    rating: 4.9
  },
  {
    id: "prod-108",
    sku: "PRD-6630",
    name: "نوشابه انرژی‌زا های‌پ کعبه‌ای",
    brand: "های‌پ",
    description: "نوشیدنی انرژی‌زا حاوی ویتامین‌های گروه B و کافئین",
    bulk_price: 650000,
    price: 690000,
    consumer_price: 780000,
    carton_pack_count: 24,
    min_order_cartons: 2,
    stock_quantity_cartons: 110,
    category: "نوشیدنی‌ها",
    image_url: "https://images.unsplash.com/photo-1622597467827-43f0553ad9fe?auto=format&fit=crop&q=80&w=600",
    unit: "کارتن",
    sellerId: "factory_cheetoz",
    sellerName: "گروه کارخانجات مزمز",
    production_lead_time_days: 2,
    badge: "ویژه",
    isFeatured: true,
    isKafBazaar: true,
    rating: 4.8
  },
  {
    id: "prod-109",
    sku: "PRD-7740",
    name: "کیک اسفنجی کاکائویی روکش‌دار",
    brand: "شیرین عسل",
    description: "کیک تازه روز با مغزی کرم شکلات و روکش کاکائو",
    bulk_price: 290000,
    price: 310000,
    consumer_price: 350000,
    carton_pack_count: 24,
    min_order_cartons: 3,
    stock_quantity_cartons: 130,
    category: "کیک، کلوچه و بیسکویت",
    image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=600",
    unit: "کارتن",
    sellerId: "factory_cheetoz",
    sellerName: "گروه صنایع شیرین عسل",
    production_lead_time_days: 2,
    badge: "کف بازار",
    isFeatured: true,
    isKafBazaar: true,
    rating: 4.7
  }
];

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          MEMORY_DB[path] = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading localStorage:", e);
    }
  }

  // Auto-seed authoritative defaults if empty or cache cleared
  if (path === "products") {
    MEMORY_DB[path] = DEFAULT_PRODUCTS_SEED;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(getCollectionKey(path), JSON.stringify(DEFAULT_PRODUCTS_SEED));
      } catch (e) {}
    }
    return MEMORY_DB[path];
  }

  MEMORY_DB[path] = [];
  return MEMORY_DB[path];
}

function getB2BApiPath(path: string): string | null {
  if (path === "products") {
    return getApiUrl("/api/b2b/products");
  }
  if (path === "orders") {
    return getApiUrl("/api/b2b/orders");
  }
  if (path === "users") {
    return getApiUrl("/api/b2b/users");
  }
  return null;
}

export function saveCollection(path: string, items: any[]): void {
  MEMORY_DB[path] = items;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getCollectionKey(path), JSON.stringify(items));
      
      // Sync with server in background
      const apiPath = getB2BApiPath(path);
      
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
  const apiPath = getB2BApiPath(path);
  
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

  if ((emailOrPhone === '09914762406' || emailOrPhone === 'admin@dastavval.com' || emailOrPhone === 'admin@dastaval.ir') && password === '@Ali3360') {
    return {
      user: { uid: 'admin_uid', email: emailOrPhone, displayName: 'مدیریت کل سامانه' }
    };
  }

  // Check server for users (or use localStorage fallback)
  let localUsers: Record<string, any> = {};
  try {
    const apiPath = getB2BApiPath("users") || "/api/b2b/users";
    const res = await fetch(apiPath);
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
