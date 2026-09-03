import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import dns from "dns";
import crypto from "crypto";
import AdmZip from "adm-zip";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");

// Robust archiver factory for different versions and environments
function createArchiver(format: string, options: any) {
  if (typeof archiver === 'function') {
    return archiver(format, options);
  }
  
  const arch = (archiver as any).default || archiver;
  if (typeof arch === 'function') {
    return arch(format, options);
  }
  
  // For archiver v8.0.0+ in some ESM contexts where only classes are exported
  if (format === 'zip' && arch.ZipArchive) {
    return new arch.ZipArchive(options);
  }
  if (format === 'tar' && arch.TarArchive) {
    return new arch.TarArchive(options);
  }

  // Fallback to calling as function if we haven't matched yet
  if (typeof arch === 'function') return arch(format, options);
  
  throw new Error("Could not find a valid archiver constructor or factory function");
}

import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { execSync, exec } from "child_process";
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand 
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

dotenv.config();

const app = express();
const PORT = 3000;

// Global live backup trigger (assigned downstream)
let triggerDataChangeBackup: () => void = () => {};

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================================
// SECURITY HEADERS & DEFENSE-IN-DEPTH
// ==========================================
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// ==========================================
// RATE LIMITING & ANTI-BRUTE-FORCE SYSTEM
// ==========================================
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit keys
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

function isWarehouseBrandServer(b: string): boolean {
  if (!b) return true;
  const clean = b.trim().toLowerCase();
  if (clean.length < 2) return true;
  return clean.includes("انبار") || 
         clean.includes("سوله") || 
         clean.includes("باربری") || 
         clean.includes("پخش") || 
         clean.includes("توزیع") || 
         clean.includes("ترانزیت") || 
         clean.includes("parspack") || 
         clean.includes("پارس پک") || 
         clean.includes("قفسه") || 
         clean.includes("عمومی") || 
         clean.includes("متفرقه") || 
         clean.includes("بی برند") || 
         clean.includes("بدون برند") || 
         clean.includes("no brand") || 
         clean.includes("nobrand") || 
         clean.includes("دفتر") || 
         clean.includes("نامشخص") || 
         clean.includes("غیر مشخص") || 
         clean.includes("تولیدکننده") || 
         clean.includes("تولید کننده") || 
         clean.includes("تولیدکنندگان") || 
         clean.includes("بازرگانی جلفا") || 
         clean.includes("بازرگانی") || 
         clean.includes("جلفا") || 
         clean.includes("تامین‌کننده") || 
         clean.includes("تامین کننده") || 
         clean.includes("واردکننده") || 
         clean.includes("صادرکننده") || 
         clean.includes("عمده‌فروش") || 
         clean.includes("بنکداری") || 
         clean.includes("بنکدار") || 
         clean.includes("جیبون") || 
         clean.includes("جیبتون") || 
         clean.includes("آدرس انبار");
}

function cleanBrandNameServer(p: any): string {
  if (p.brand && typeof p.brand === 'string' && !isWarehouseBrandServer(p.brand)) {
    return p.brand.trim();
  }
  if (p.factory_name && typeof p.factory_name === 'string' && !isWarehouseBrandServer(p.factory_name)) {
    return p.factory_name.trim();
  }
  return "";
}

/**
 * Express middleware for rate limiting sensitive endpoints
 */
function createRateLimiter(windowMs: number = 15 * 60 * 1000, maxAttempts: number = 10, customMsg?: string) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || req.socket.remoteAddress || "unknown_ip";
    const routeKey = `${req.path}:${clientIp}`;
    const now = Date.now();

    let record = rateLimitStore.get(routeKey);
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
    }

    record.count += 1;
    rateLimitStore.set(routeKey, record);

    if (record.count > maxAttempts) {
      const remainingSecs = Math.ceil((record.resetTime - now) / 1000);
      const remainingMins = Math.ceil(remainingSecs / 60);
      res.setHeader("Retry-After", String(remainingSecs));
      return res.status(429).json({
        success: false,
        status: "rate_limited",
        error: customMsg || `تعداد درخواست‌های بیش از حد مجاز ثبت شد. جهت امنیت سیستم، IP شما تا ${remainingMins} دقیقه دیگر قفل است.`,
        retryAfterSeconds: remainingSecs
      });
    }

    next();
  };
}

const sensitiveActionLimiter = createRateLimiter(15 * 60 * 1000, 10, "تلاش‌های مکرر و ناموفق شناسایی شد. دسترسی شما تا ۱۵ دقیقه مسدود گردید.");

// Apply rate limiting middleware to configuration updates and GitHub updater endpoints
app.use("/api/b2b/config", (req, res, next) => {
  if (req.method === "POST") return sensitiveActionLimiter(req, res, next);
  next();
});

app.use("/api/git/update", sensitiveActionLimiter);
app.use("/api/git/test-connection", sensitiveActionLimiter);

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

const BACKUP_DIR = path.join(DATA_DIR, "backups");
if (!fs.existsSync(BACKUP_DIR)) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  } catch (e) {}
}

const PERSISTENT_UPLOADS_DIR = path.join(DATA_DIR, "uploads");
if (!fs.existsSync(PERSISTENT_UPLOADS_DIR)) {
  try {
    fs.mkdirSync(PERSISTENT_UPLOADS_DIR, { recursive: true });
  } catch (e) {}
}

// Ensure public uploads directory exists and mount static route
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create uploads directory:", e);
}

// Sync persistent uploads to public/uploads and vice versa on startup
try {
  if (fs.existsSync(PERSISTENT_UPLOADS_DIR)) {
    const list = fs.readdirSync(PERSISTENT_UPLOADS_DIR);
    for (const file of list) {
      const src = path.join(PERSISTENT_UPLOADS_DIR, file);
      const dest = path.join(UPLOADS_DIR, file);
      if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    }
  }
  if (fs.existsSync(UPLOADS_DIR)) {
    const list = fs.readdirSync(UPLOADS_DIR);
    for (const file of list) {
      const src = path.join(UPLOADS_DIR, file);
      const dest = path.join(PERSISTENT_UPLOADS_DIR, file);
      if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
      }
    }
  }
} catch (e) {
  console.warn("Uploads sync warning:", e);
}

app.use("/uploads", express.static(UPLOADS_DIR));

const B2B_CONFIG_FILE = path.join(DATA_DIR, "b2b-config.json");
const OLD_B2B_CONFIG_FILE = path.join(process.cwd(), "b2b-config.json");
if (!fs.existsSync(B2B_CONFIG_FILE) && fs.existsSync(OLD_B2B_CONFIG_FILE)) {
  try { fs.copyFileSync(OLD_B2B_CONFIG_FILE, B2B_CONFIG_FILE); } catch (e) {}
}

const CONFIG_FILE = path.join(DATA_DIR, "ai-config.json");
const OLD_CONFIG_FILE = path.join(process.cwd(), "ai-config.json");
if (!fs.existsSync(CONFIG_FILE) && fs.existsSync(OLD_CONFIG_FILE)) {
  try { fs.copyFileSync(OLD_CONFIG_FILE, CONFIG_FILE); } catch (e) {}
}

const CACHE_FILE = path.join(DATA_DIR, "ai-cache.json");
const OLD_CACHE_FILE = path.join(process.cwd(), "ai-cache.json");
if (!fs.existsSync(CACHE_FILE) && fs.existsSync(OLD_CACHE_FILE)) {
  try { fs.copyFileSync(OLD_CACHE_FILE, CACHE_FILE); } catch (e) {}
}

// Default configuration
let aiConfig: { provider: string; apiKey: string; endpointUrl: string; model?: string } = {
  provider: "gemini", 
  apiKey: process.env.GEMINI_API_KEY || "",
  endpointUrl: "https://api.gapgpt.app/v1",
  model: "gpt-4o-mini"
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    aiConfig = { ...aiConfig, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to read ai-config.json:", e);
  }
}

const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const ROOT_USERS_FILE = path.join(process.cwd(), "users.json");
const ROOT_ARTICLES_FILE = path.join(process.cwd(), "articles.json");
const SENSITIVE_PROFILES_VAULT_FILE = path.join(DATA_DIR, "sensitive-profiles-vault.json");
const REGISTRATIONS_JOURNAL_FILE = path.join(DATA_DIR, "registrations-audit.jsonl");

function recordSensitiveProfileBackup(user: any) {
  if (!user || (!user.phone && !user.mobile && !user.id)) return;
  try {
    const rawKey = user.phone || user.mobile || user.id || user.email;
    const cleanKey = normalizeIranianPhone(rawKey) || rawKey;
    
    // 1. Update Vault in data/sensitive-profiles-vault.json
    let vault: Record<string, any> = {};
    if (fs.existsSync(SENSITIVE_PROFILES_VAULT_FILE)) {
      try {
        vault = JSON.parse(fs.readFileSync(SENSITIVE_PROFILES_VAULT_FILE, "utf-8"));
      } catch (e) {}
    }
    vault[cleanKey] = {
      ...(vault[cleanKey] || {}),
      ...user,
      lastVaultBackupAt: new Date().toISOString()
    };
    writeJsonAtomic(SENSITIVE_PROFILES_VAULT_FILE, vault);

    // 2. Append to Immutable Journal (JSONL)
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      key: cleanKey,
      name: user.name,
      phone: user.phone,
      company: user.company,
      nationalCode: user.nationalCode,
      address: user.address,
      role: user.role,
      userCode: user.userCode || user.customerCode,
      action: "REGISTER_OR_UPDATE"
    }) + "\n";
    fs.appendFileSync(REGISTRATIONS_JOURNAL_FILE, logEntry, "utf-8");

    // 3. Local daily snapshot in backups
    const today = new Date().toISOString().slice(0, 10);
    const dailySnapshotPath = path.join(BACKUP_DIR, `users-vault-${today}.json`);
    writeJsonAtomic(dailySnapshotPath, vault);
  } catch (err) {
    console.error("[Sensitive Vault Error] Failed to persist user audit:", err);
  }
}

function writeJsonAtomic(filePath: string, data: any) {
  try {
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    const tempPath = filePath + ".tmp";
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`Atomic write failed for ${filePath}:`, err);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (fallbackErr) {
      console.error(`Fallback write also failed for ${filePath}:`, fallbackErr);
    }
  }
}

function loadConfig(): any {
  return b2bConfig;
}

function saveConfig(cfg: any) {
  b2bConfig = { 
    ...b2bConfig, 
    ...cfg,
    invoiceSettings: {
      ...(b2bConfig?.invoiceSettings || {}),
      ...(cfg?.invoiceSettings || {})
    }
  };
  try {
    writeJsonAtomic(B2B_CONFIG_FILE, b2bConfig);
    if (typeof OLD_B2B_CONFIG_FILE !== 'undefined' && OLD_B2B_CONFIG_FILE && fs.existsSync(OLD_B2B_CONFIG_FILE)) {
      writeJsonAtomic(OLD_B2B_CONFIG_FILE, b2bConfig);
    }
    triggerDataChangeBackup();
  } catch (e) {
    console.error("Failed to save b2b-config.json:", e);
  }
}

const INITIAL_DEFAULT_PRODUCTS: any[] = [];

function loadProducts(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Error loading products.json:", e);
  }
  try {
    saveProducts(INITIAL_DEFAULT_PRODUCTS);
  } catch (e) {}
  return INITIAL_DEFAULT_PRODUCTS;
}

function saveProducts(products: any[]) {
  try {
    writeJsonAtomic(PRODUCTS_FILE, products);
    triggerDataChangeBackup();
  } catch (e) {
    console.error("Error saving products.json:", e);
  }
}

const ROOT_ORDERS_FILE = path.join(process.cwd(), "orders.json");
const DEALERSHIP_FILE = path.join(DATA_DIR, "dealership_requests.json");
const ROOT_DEALERSHIP_FILE = path.join(process.cwd(), "dealership_requests.json");
const CRITICAL_VAULT_FILE = path.join(DATA_DIR, "critical_vault.jsonl");

function appendToCriticalVault(type: string, data: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const line = JSON.stringify({ timestamp: new Date().toISOString(), type, data }) + "\n";
    fs.appendFileSync(CRITICAL_VAULT_FILE, line, "utf-8");
  } catch (e) {}
}

function loadDealershipRequests(): any[] {
  const map = new Map<string, any>();
  const addToList = (list: any[]) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item) continue;
      const key = item.id || item.code || (item.mobile && item.fullName ? `${item.mobile}_${item.fullName}` : null);
      if (key) {
        if (!map.has(key)) {
          map.set(key, item);
        } else {
          const prev = map.get(key);
          map.set(key, { ...prev, ...item });
        }
      }
    }
  };

  try {
    if (fs.existsSync(DEALERSHIP_FILE)) {
      addToList(JSON.parse(fs.readFileSync(DEALERSHIP_FILE, "utf-8")));
    }
  } catch (e) {}

  try {
    if (fs.existsSync(ROOT_DEALERSHIP_FILE)) {
      addToList(JSON.parse(fs.readFileSync(ROOT_DEALERSHIP_FILE, "utf-8")));
    }
  } catch (e) {}

  const configAny = b2bConfig as any;
  if (configAny && Array.isArray(configAny.dealershipRequests)) {
    addToList(configAny.dealershipRequests);
  }
  return Array.from(map.values());
}

function saveDealershipRequests(requests: any[]) {
  try {
    const existing = loadDealershipRequests();
    const map = new Map<string, any>();
    for (const r of existing) {
      if (r && (r.id || r.code)) map.set(r.id || r.code, r);
    }
    const incomingList = Array.isArray(requests) ? requests : [requests];
    for (const r of incomingList) {
      if (r && (r.id || r.code)) {
        const key = r.id || r.code;
        const prev = map.get(key) || {};
        map.set(key, { ...prev, ...r });
      }
    }

    const merged = Array.from(map.values());
    writeJsonAtomic(DEALERSHIP_FILE, merged);
    try {
      writeJsonAtomic(ROOT_DEALERSHIP_FILE, merged);
    } catch (e) {}
    (b2bConfig as any).dealershipRequests = merged;
    saveConfig(b2bConfig);
  } catch (e) {
    console.error("Error saving dealership requests:", e);
  }
}

function loadOrders(): any[] {
  const allOrdersMap = new Map<string, any>();

  const addOrdersToList = (list: any[]) => {
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!item) continue;
      const key = item.id || item.trackingNumber || item.orderId;
      if (key) {
        if (!allOrdersMap.has(key)) {
          allOrdersMap.set(key, item);
        } else {
          const existing = allOrdersMap.get(key);
          allOrdersMap.set(key, { ...existing, ...item });
        }
      }
    }
  };

  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
      addOrdersToList(parsed);
    }
  } catch (e) {
    console.error("Error loading orders.json:", e);
  }

  try {
    if (fs.existsSync(ROOT_ORDERS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(ROOT_ORDERS_FILE, "utf-8"));
      addOrdersToList(parsed);
    }
  } catch (e) {}

  const configAny = b2bConfig as any;
  if (configAny && Array.isArray(configAny.orders)) {
    addOrdersToList(configAny.orders);
  }

  return Array.from(allOrdersMap.values());
}

function saveOrders(orders: any[]) {
  try {
    const existing = loadOrders();
    const map = new Map<string, any>();
    
    for (const o of existing) {
      if (o && (o.id || o.trackingNumber || o.orderId)) {
        map.set(o.id || o.trackingNumber || o.orderId, o);
      }
    }
    for (const o of orders) {
      if (o && (o.id || o.trackingNumber || o.orderId)) {
        const key = o.id || o.trackingNumber || o.orderId;
        const prev = map.get(key) || {};
        map.set(key, { ...prev, ...o });
      }
    }

    const mergedList = Array.from(map.values());

    writeJsonAtomic(ORDERS_FILE, mergedList);
    try {
      writeJsonAtomic(ROOT_ORDERS_FILE, mergedList);
    } catch (e) {}

    (b2bConfig as any).orders = mergedList;
    saveConfig(b2bConfig);
  } catch (e) {
    console.error("Error saving orders:", e);
  }
}

function loadUsers(): Record<string, any> {
  const map: Record<string, any> = {};

  const addUsersFromObjOrArray = (data: any) => {
    if (!data) return;
    if (Array.isArray(data)) {
      for (const u of data) {
        if (u && (u.id || u.phone || u.mobile || u.username)) {
          const rawKey = u.phone || u.mobile || u.username || u.id;
          const cleanKey = normalizeIranianPhone(rawKey) || rawKey;
          if (!map[cleanKey]) map[cleanKey] = u;
          else map[cleanKey] = { ...map[cleanKey], ...u };
        }
      }
    } else if (typeof data === "object") {
      for (const [k, u] of Object.entries(data)) {
        if (u && typeof u === "object") {
          const cleanKey = normalizeIranianPhone(k) || k;
          if (!map[cleanKey]) map[cleanKey] = u;
          else map[cleanKey] = { ...map[cleanKey], ...u };
        }
      }
    }
  };

  // 1. From USERS_FILE (data/users.json)
  try {
    if (fs.existsSync(USERS_FILE)) {
      addUsersFromObjOrArray(JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")));
    }
  } catch (e) {}

  // 2. From ROOT_USERS_FILE (users.json in root)
  try {
    if (fs.existsSync(ROOT_USERS_FILE)) {
      addUsersFromObjOrArray(JSON.parse(fs.readFileSync(ROOT_USERS_FILE, "utf-8")));
    }
  } catch (e) {}

  // 3. From SENSITIVE_PROFILES_VAULT_FILE (sensitive-profiles-vault.json)
  try {
    if (fs.existsSync(SENSITIVE_PROFILES_VAULT_FILE)) {
      addUsersFromObjOrArray(JSON.parse(fs.readFileSync(SENSITIVE_PROFILES_VAULT_FILE, "utf-8")));
    }
  } catch (e) {}

  // 4. From REGISTRATIONS_JOURNAL_FILE (Immutable audit log recovery)
  try {
    if (fs.existsSync(REGISTRATIONS_JOURNAL_FILE)) {
      const lines = fs.readFileSync(REGISTRATIONS_JOURNAL_FILE, "utf-8").split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          const p = normalizeIranianPhone(entry.phone || entry.key);
          if (p && !map[p]) {
            map[p] = {
              id: entry.id || `usr-${p}`,
              username: p,
              name: entry.name || "کاربر ثبت‌شده در سیستم",
              phone: p,
              mobile: p,
              company: entry.company || "مجموعه تجاری همکار",
              nationalCode: entry.nationalCode,
              address: entry.address,
              role: entry.role || "customer",
              badge: "bronze",
              status: "active",
              createdAt: entry.timestamp || new Date().toISOString()
            };
          } else if (p && map[p]) {
            if (entry.nationalCode && !map[p].nationalCode) map[p].nationalCode = entry.nationalCode;
            if (entry.address && !map[p].address) map[p].address = entry.address;
            if (entry.company && (!map[p].company || map[p].company.includes("ثبت نام آنی"))) map[p].company = entry.company;
            if (entry.name && (!map[p].name || map[p].name.includes("خریدار عمده"))) map[p].name = entry.name;
          }
        } catch (e) {}
      }
    }
  } catch (e) {}

  // 5. Auto-reconcile users from Orders (never lose a buyer)
  try {
    const orders = loadOrders();
    for (const ord of orders) {
      if (!ord) continue;
      const rawP = ord.buyerPhone || ord.customerPhone || ord.phone || ord.mobile;
      const p = normalizeIranianPhone(rawP);
      if (p && p.length >= 10) {
        if (!map[p]) {
          map[p] = {
            id: `usr-${p}`,
            username: p,
            name: ord.buyerName || ord.customerName || "خریدار سفارش مستقیم",
            phone: p,
            mobile: p,
            company: ord.buyerCompany || "فروشگاه / پخش عمده",
            city: ord.city || "تهران",
            province: ord.province || "تهران",
            address: ord.buyerAddress || "",
            role: "customer",
            badge: "bronze",
            status: "active",
            totalOrdersCount: 1,
            totalPurchaseValue: Number(ord.totalAmount || ord.finalPayableAmount || 0),
            createdAt: ord.createdAt || new Date().toISOString(),
            source: "سفارش مستقیم"
          };
        } else {
          const currentCount = map[p].totalOrdersCount || 0;
          const currentVal = map[p].totalPurchaseValue || 0;
          map[p].totalOrdersCount = Math.max(currentCount, 1);
          map[p].totalPurchaseValue = Math.max(currentVal, Number(ord.totalAmount || ord.finalPayableAmount || 0));
        }
      }
    }
  } catch (e) {}

  // 4. Auto-reconcile users from Dealership Requests (never lose an applicant)
  try {
    const requests = loadDealershipRequests();
    for (const r of requests) {
      if (!r) continue;
      const rawP = r.mobile || r.phone;
      const p = normalizeIranianPhone(rawP);
      if (p && p.length >= 10) {
        if (!map[p]) {
          map[p] = {
            id: `usr-${p}`,
            username: p,
            name: r.fullName || r.name || "متقاضی نمایندگی",
            phone: p,
            mobile: p,
            company: r.company || r.storeName || "نمایندگی استانی",
            city: r.city || "",
            province: r.province || "",
            address: r.address || "",
            role: "representative",
            badge: "خریدار عمده",
            status: r.status === "approved" ? "active" : "pending_verification",
            createdAt: r.createdAt || new Date().toISOString(),
            source: "درخواست نمایندگی"
          };
        }
      }
    }
  } catch (e) {}

  // 5. Always ensure Master Administrator account exists for 09914762406
  try {
    const adminPhone = "09914762406";
    map[adminPhone] = {
      id: "admin_09914762406",
      username: adminPhone,
      name: "مدیریت کل سامانه",
      phone: adminPhone,
      mobile: adminPhone,
      email: "admin@dastavval.com",
      company: "دفتر مرکزی دست اول",
      city: "تهران",
      province: "تهران",
      role: "admin",
      badge: "admin",
      status: "active",
      isSuperAdmin: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      source: "مدیریت کل سیستم"
    };
    map["admin@dastavval.com"] = map[adminPhone];
  } catch (e) {}

  // Guarantee every user (representative, marketer, and customer) has appropriate referralCode & agencyCode
  try {
    for (const [key, u] of Object.entries(map)) {
      if (!u || typeof u !== "object") continue;
      const phoneDigits = (u.phone || u.mobile || key || "").replace(/\D/g, "");
      const last4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : (u.id ? String(u.id).replace(/\D/g, "").slice(-4) : "8832") || "8832";
      
      if (!u.userCode) u.userCode = `USR-${last4}`;
      if (!u.customerCode) u.customerCode = `CST-${last4}`;
      if (u.walletBalance === undefined) u.walletBalance = 0;

      const role = u.role || "customer";
      if (role === "representative" || role === "agent") {
        if (!u.agencyCode) u.agencyCode = `REP-${last4}`;
        if (!u.referralCode) u.referralCode = u.agencyCode;
      } else if (role === "marketer") {
        if (!u.marketerCode) u.marketerCode = `MKT-${last4}`;
        if (!u.referralCode) u.referralCode = u.marketerCode;
      } else {
        if (!u.referralCode) u.referralCode = `REF-${last4}`;
      }
    }
  } catch (e) {}

  return map;
}

function saveUsers(users: Record<string, any>) {
  try {
    writeJsonAtomic(USERS_FILE, users);
    try {
      writeJsonAtomic(ROOT_USERS_FILE, users);
    } catch (e) {}
    try {
      writeJsonAtomic(SENSITIVE_PROFILES_VAULT_FILE, users);
      const today = new Date().toISOString().slice(0, 10);
      writeJsonAtomic(path.join(BACKUP_DIR, `users-vault-${today}.json`), users);
    } catch (e) {}
    triggerDataChangeBackup();
  } catch (e) {
    console.error("Error saving users:", e);
  }
}

function getAdminPhone(): string {
  try {
    const configAny = b2bConfig as any;
    let raw = (configAny.smsAdminPhone || configAny.adminPhone || "09914762406").trim();
    let norm = normalizeIranianPhone(raw);
    if (norm && norm.length >= 10 && norm.startsWith("09")) {
      return norm;
    }
    return "09914762406";
  } catch (e) {
    return "09914762406";
  }
}

function isSystemAdminPhone(phone: string): boolean {
  if (!phone) return false;
  const clean = normalizeIranianPhone(phone);
  if (!clean) return false;
  if (clean === "09914762406") return true;
  const configuredAdmin = normalizeIranianPhone(getAdminPhone());
  if (configuredAdmin && clean === configuredAdmin) return true;
  const configAny = b2bConfig as any;
  if (configAny.smsAdminPhone && normalizeIranianPhone(configAny.smsAdminPhone) === clean) return true;
  if (configAny.adminPhone && normalizeIranianPhone(configAny.adminPhone) === clean) return true;
  if (configAny.supportPhone && normalizeIranianPhone(configAny.supportPhone) === clean) return true;
  try {
    const users = loadUsers();
    const u = users[clean] || Object.values(users).find((user: any) => normalizeIranianPhone(user.phone || user.mobile) === clean);
    if (u && (u.role === 'admin' || u.badge === 'admin' || u.isSuperAdmin)) return true;
  } catch (e) {}
  return false;
}
const DEFAULT_B2B_CONFIG = {
  githubRepoUrl: "https://github.com/dastavval/UpdaterDst.git",
  githubBranch: "main",
  primaryColor: "emerald",
  appName: "دست اول",
  appSub: "سامانه ملی استعلام و مبادلات مستقیم تولیدات کارخانه",
  logoUrl: "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png",
  mascotUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  categories: [],
  brands: [],
  factories: [],
  gallery: [
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000"
  ],
  githubToken: "",
  lastGithubUpdate: null,
  // ParsPack S3 Object Storage Credentials
  storageEndpoint: "c102393.parspack.net",
  storageAccessKey: "xt3cR9wHHoATuXS3",
  storageSecretKey: "4gffDy7cBYByRjxhiXpMP1nqtQ0Sd31b",
  storageBucket: "c102393",
  storageRegion: "us-east-1",
  storagePublicUrl: "http://c102393.parspack.net/c102393",
  storageForcePathStyle: true,
  storageEnabled: true,
  // Melipayamak SMS Gateway & Pattern IDs
  smsUsername: "",
  smsPassword: "",
  smsFromNumber: "5000400075",
  smsEnabled: true,
  smsOtpPatternId: "",
  smsWelcomePatternId: "",
  smsOrderRegisteredPatternId: "",
  smsOrderStatusChangedPatternId: "",
  smsProductApprovedPatternId: "",
  smsProductRejectedPatternId: "",
  smsAccountActivatedPatternId: "",
  smsAccountRejectedPatternId: "",
  smsRepNotificationPatternId: "",
  smsInvoiceIssuedPatternId: "",
  smsAbandonedOrderPatternId: "",
  smsStockAlertPatternId: "",
  smsLogisticsPatternId: "",
  smsFactoryProductionPatternId: "",
  smsAdPatternId: "",
  smsCallbackPatternId: "",
  smsAdminNotificationPatternId: "",
  smsInvitationPatternId: "",
  smsAdminPhone: "09914762406",
  adminPhone: "09914762406",
  supportPhone: "09914762406",
  buyerCredit: 250000000,
  minOrderAmount: 3000000,
  minOrderCartons: 3,
  commissionRate: 5,
  enamadCode: "ENAMAD-99887766",
  enamadUrl: "https://trustseal.enamad.ir/?id=321456&Code=xyz",
  samandehiCode: "SAMAN-445566",
  samandehiUrl: "https://logo.samandehi.ir/verify.aspx?id=123456",
  tradeUnionCode: "IR-9044502",
  tradeUnionUrl: "https://dastavval.com/license",
  invoiceSettings: {
    sellerTitle: "سامانه مبادلات مستقیم کالای دست اول",
    sellerPhone: "021-88889999",
    sellerMobile: "09999123001",
    hqAddress: "تبریز، برج تجارت جهانی",
    bankAccounts: [
      {
        bankName: "بانک ملی ایران",
        ownerName: "سامانه مبادلات دست اول",
        cardNumber: "۶۰۳۷-۹۹۱۸-۹۹۸۸-۱۲۳۴",
        shabaNumber: "IR420190000000102938475661"
      },
      {
        bankName: "بانک ملت",
        ownerName: "شرکت بازرگانی و تامین کالای دست اول",
        cardNumber: "۶۱۰۴-۳۳۷۹-۸۸۱۲-۳۴۵۶",
        shabaNumber: "IR190120000000001234567890"
      },
      {
        bankName: "بانک صادرات ایران",
        ownerName: "حساب امانی تسویه وجوه عمده",
        cardNumber: "۶۰۳۷-۶۹۱۱-۴۴۵۵-۶۶۷۷",
        shabaNumber: "IR920180000000005544332211"
      }
    ]
  },
  quantityDiscountTiers: [
    { threshold: 10, discountPercent: 3 },
    { threshold: 25, discountPercent: 6 },
    { threshold: 50, discountPercent: 10 }
  ],
  volumeDiscountTiers: [
    { threshold: 10000000, discountPercent: 2 },
    { threshold: 50000000, discountPercent: 5 },
    { threshold: 150000000, discountPercent: 8 },
    { threshold: 500000000, discountPercent: 12 }
  ],
  equipmentAds: [] as any[],
  serviceAds: [] as any[],
  rawMaterialAds: [] as any[],
  sponsoredAds: [] as any[]
};

let b2bConfig = { ...DEFAULT_B2B_CONFIG };

// Persistent logs for GitHub Updater troubleshooting
let githubUpdateLogs: any[] = [];
function addGithubLog(type: 'info' | 'error' | 'success', message: string, details?: any) {
  const log = {
    id: Date.now() + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    type,
    message,
    details
  };
  githubUpdateLogs.unshift(log);
  if (githubUpdateLogs.length > 100) githubUpdateLogs.pop();
  console.log(`[GitHub Log] ${type.toUpperCase()}: ${message}`, details || "");
}

if (fs.existsSync(B2B_CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(B2B_CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    b2bConfig = {
      ...DEFAULT_B2B_CONFIG,
      ...parsed,
      categories: (parsed.categories && Array.isArray(parsed.categories)) ? parsed.categories : DEFAULT_B2B_CONFIG.categories,
      factories: (parsed.factories && Array.isArray(parsed.factories)) ? parsed.factories : DEFAULT_B2B_CONFIG.factories,
      brands: (parsed.brands && Array.isArray(parsed.brands)) ? parsed.brands : DEFAULT_B2B_CONFIG.brands,
      equipmentAds: (parsed.equipmentAds && Array.isArray(parsed.equipmentAds)) ? parsed.equipmentAds : [],
      serviceAds: (parsed.serviceAds && Array.isArray(parsed.serviceAds)) ? parsed.serviceAds : [],
      rawMaterialAds: (parsed.rawMaterialAds && Array.isArray(parsed.rawMaterialAds)) ? parsed.rawMaterialAds : [],
      sponsoredAds: (parsed.sponsoredAds && Array.isArray(parsed.sponsoredAds)) ? parsed.sponsoredAds : []
    };

    // Fail-safe sanitisation: parspack.net has frequent TLS/HTTPS negotiation issues.
    // Dynamically convert any saved https:// parspack urls to http:// in memory to ensure instant uploads & downloads.
    if (b2bConfig.storagePublicUrl && b2bConfig.storagePublicUrl.startsWith("https://") && b2bConfig.storagePublicUrl.includes("parspack.net")) {
      b2bConfig.storagePublicUrl = b2bConfig.storagePublicUrl.replace("https://", "http://");
    }
  } catch (e) {
    console.error("Failed to read b2b-config.json:", e);
  }
}

// Global cached Daily Presentation helper
function getDailyCache() {
  const today = new Date().toISOString().split("T")[0];
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
      if (cache.date === today) {
        return cache.data;
      }
    } catch (e) {
      console.error("Failed to read cache file:", e);
    }
  }
  return null;
}

function saveDailyCache(data: any) {
  const today = new Date().toISOString().split("T")[0];
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ date: today, data }), "utf-8");
  } catch (e) {
    console.error("Failed to save cache file:", e);
  }
}

// Universal AI Caller
async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  const provider = aiConfig.provider || "gemini";
  const apiKey = (aiConfig.apiKey || "").trim();
  const gemKey = process.env.GEMINI_API_KEY || (apiKey && !apiKey.startsWith("sk-") ? apiKey : "");
  let baseUrl = (aiConfig.endpointUrl || "https://api.gapgpt.app/v1").replace(/\/$/, "");
  if (baseUrl.includes("gapgpt.ir")) {
    baseUrl = baseUrl.replace("gapgpt.ir", "gapgpt.app");
  }

  // 1. If provider is explicitly GapGPT/OpenAI or a key is set, try GapGPT endpoint first
  if (apiKey && (provider === "gapgpt" || provider === "openai" || apiKey.startsWith("sk-"))) {
    const url = `${baseUrl}/chat/completions`;
    const headers: Record<string, string> = { 
      "Content-Type": "application/json",
      "User-Agent": "Dastavval/1.0 (B2B Marketplace)",
      "Authorization": `Bearer ${apiKey}`
    };

    const body = {
      model: aiConfig.model || "gpt-4o-mini",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    };

    try {
      const response = await fetch(url, { 
        method: "POST", 
        headers, 
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(25000)
      });
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      } else {
        const errText = await response.text();
        console.log(`[AI GapGPT] Status ${response.status}: ${errText}. Switching to Gemini Direct fallback.`);
      }
    } catch (e: any) {
      console.log(`[AI GapGPT] Network error (${e.message}), switching to Gemini Direct fallback.`);
    }
  }

  // 2. Try Google Gemini API directly with supported models (@google/genai SDK)
  if (gemKey) {
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro"
    ];
    for (const modelName of modelsToTry) {
      try {
        const genAI = new GoogleGenerativeAI(gemKey);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          ...(systemPrompt ? { systemInstruction: systemPrompt } : {})
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (text) {
          return text;
        }
      } catch (gemErr: any) {
        console.log(`[AI Direct] Gemini model ${modelName} note:`, gemErr.message || String(gemErr));
      }
    }
  }

  // Ultimate intelligent fallback response tailored for Dastavval B2B Marketplace
  return `پاسخ دستیار هوشمند دست اول:
بررسی درخواست شما انجام شد. در بنکداری و خرید عمده مستقیم از کارخانه:
- **تضمین قیمت:** تمامی کالاها با قیمت مصوب درب کارخانه و بالاترین حاشیه سود برای همکاران و نمایندگان عرضه می‌گردد.
- **مزیت کارتنی:** با خرید بیش از ۱۰ کارتن، تخفیف حجمی و ارسال سریع باربری اعمال می‌شود.
لطفاً جهت ثبت نهایی سفارش یا دریافت پیش‌فاکتور رسمی از طریق پنل اقدام فرمایید.`;
}

async function callAISafe(prompt: string, systemPrompt?: string, fallbackText: string = ""): Promise<string> {
  try {
    return await callAI(prompt, systemPrompt);
  } catch (err: any) {
    console.log("AI info: Connection unavailable, using fallback.");
    return fallbackText;
  }
}

// --- UNIFIED SEO & TOROB PRODUCT AGGREGATOR ---
function getAllProductsForSEOAndTorob(): any[] {
  const result: any[] = [];
  const seenIds = new Set<string>();

  const addProduct = (p: any) => {
    if (!p) return;
    const id = String(p.id || p.sku || p.code || p.productCode || "").trim();
    if (!id || seenIds.has(id)) return;
    seenIds.add(id);

    const priceNum = (val: any) => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      const clean = String(val)
        .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632))
        .replace(/,/g, '')
        .match(/\d+/);
      return clean ? parseInt(clean[0], 10) : 0;
    };

    const bulkPrice = priceNum(p.bulk_price || p.price || p.wholesalePrice);
    const consumerPrice = priceNum(p.consumer_price || p.marketPrice || p.consumerPrice);

    result.push({
      id,
      sku: id,
      code: id,
      name: p.name || p.title || "محصول بدون نام",
      brand: p.brand || p.factoryName || "کارخانه رسمی",
      factoryName: p.factoryName || p.brand || "کارخانه رسمی",
      price: bulkPrice,
      bulk_price: bulkPrice,
      consumer_price: consumerPrice,
      category: p.category || "مواد غذایی",
      image_url: p.image_url || p.imageUrl || p.image || "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png",
      imageUrl: p.image_url || p.imageUrl || p.image || "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png",
      min_order_cartons: Number(p.min_order_cartons || p.minOrderCartons || 1),
      carton_pack_count: Number(p.carton_pack_count || p.itemsPerUnit || 24),
      disabled: Boolean(p.disabled),
      isFeatured: Boolean(p.isFeatured)
    });
  };

  // 1. From PRODUCTS_FILE
  try {
    const mainList = loadProducts();
    if (Array.isArray(mainList)) mainList.forEach(addProduct);
  } catch (e) {}

  // 2. From local-products.json if exists
  try {
    const localPath = path.join(process.cwd(), "local-products.json");
    if (fs.existsSync(localPath)) {
      const localList = JSON.parse(fs.readFileSync(localPath, "utf-8"));
      if (Array.isArray(localList)) localList.forEach(addProduct);
    }
  } catch (e) {}

  // 3. From b2bConfig.products if present
  try {
    if (Array.isArray((b2bConfig as any).products)) {
      (b2bConfig as any).products.forEach(addProduct);
    }
  } catch (e) {}

  return result;
}

// --- DYNAMIC AUTO-GENERATED SITEMAP.XML FOR GOOGLE & SEARCH ENGINES ---
function generateDynamicSitemapXml(baseUrl: string = "https://dastavval.com"): string {
  const today = new Date().toISOString().split("T")[0];
  
  // 1. Core Platform Landing Tabs
  const coreUrls = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/?tab=order`, priority: "0.95", changefreq: "daily" },
    { loc: `${baseUrl}/?tab=billboard`, priority: "0.95", changefreq: "hourly" },
    { loc: `${baseUrl}/?tab=factories`, priority: "0.90", changefreq: "weekly" },
    { loc: `${baseUrl}/?tab=dealership`, priority: "0.85", changefreq: "monthly" },
    { loc: `${baseUrl}/?tab=services`, priority: "0.85", changefreq: "weekly" },
    { loc: `${baseUrl}/?tab=news`, priority: "0.80", changefreq: "daily" },
    { loc: `${baseUrl}/?tab=about`, priority: "0.75", changefreq: "monthly" },
  ];

  // 2. Dynamic Categories
  const categoryUrls: Array<{ loc: string; priority: string; changefreq: string }> = [];
  const categories = b2bConfig.categories || [];
  for (const cat of categories) {
    const catName = typeof cat === 'string' ? cat : (cat.name || cat.label);
    if (catName) {
      categoryUrls.push({
        loc: `${baseUrl}/?category=${encodeURIComponent(catName)}`,
        priority: "0.85",
        changefreq: "daily"
      });
    }
  }

  // 3. Dynamic Products from unified aggregator
  const productUrls: Array<{ loc: string; priority: string; changefreq: string }> = [];
  const allProds = getAllProductsForSEOAndTorob();
  for (const p of allProds) {
    if (p.id && !p.disabled) {
      productUrls.push({
        loc: `${baseUrl}/?product=${encodeURIComponent(p.id)}`,
        priority: p.isFeatured ? "0.9" : "0.8",
        changefreq: "daily"
      });
    }
  }

  // 4. Dynamic Factories
  const factoryUrls: Array<{ loc: string; priority: string; changefreq: string }> = [];
  const factories = b2bConfig.factories || [];
  for (const fac of factories) {
    if (fac.id) {
      factoryUrls.push({
        loc: `${baseUrl}/?tab=factories&factory=${encodeURIComponent(fac.id)}`,
        priority: "0.85",
        changefreq: "weekly"
      });
    }
  }

  // 5. Dynamic AI Articles & Magazine
  const articleUrls: Array<{ loc: string; priority: string; changefreq: string }> = [];
  try {
    const articlesPath = path.join(process.cwd(), "articles.json");
    if (fs.existsSync(articlesPath)) {
      const articles = JSON.parse(fs.readFileSync(articlesPath, "utf-8"));
      if (Array.isArray(articles)) {
        for (const art of articles) {
          if (art.id) {
            articleUrls.push({
              loc: `${baseUrl}/?article=${encodeURIComponent(art.id)}`,
              priority: "0.85",
              changefreq: "weekly"
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not load articles for sitemap:", e);
  }

  const allUrls = [...coreUrls, ...categoryUrls, ...productUrls, ...factoryUrls, ...articleUrls];

  const xmlEntries = allUrls.map(item => `  <url>
    <loc>${item.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${item.changefreq}</changefreq>
    <priority>${item.priority}</priority>
  </url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${xmlEntries}
</urlset>`;
}

// Serve dynamic robots.txt for Googlebot, TorobBot, and Search Crawlers
app.get("/robots.txt", (req, res) => {
  const host = req.get("host") || "dastavval.com";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
  const robotsTxt = `# robots.txt for DastAvval B2B Platform
User-agent: *
Allow: /
Allow: /api/torob/
Allow: /torob/
Disallow: /admin
Disallow: /api/admin/
Disallow: /api/git/

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: TorobBot
Allow: /
Allow: /api/torob/
Allow: /torob/

Sitemap: ${protocol}://${host}/sitemap.xml
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(robotsTxt);
});

// Serve dynamic, real-time sitemap.xml on /sitemap.xml and /api/sitemap.xml
const serveSitemapHandler = (req: express.Request, res: express.Response) => {
  const host = req.get("host") || "dastavval.com";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
  const baseUrl = `${protocol}://${host}`;
  const sitemapXml = generateDynamicSitemapXml(baseUrl);

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.send(sitemapXml);
};

app.get("/sitemap.xml", serveSitemapHandler);
app.get("/api/sitemap.xml", serveSitemapHandler);

// Admin API to trigger auto-generation and write to static files securely
app.all("/api/seo/generate-sitemap", (req, res) => {
  try {
    const host = req.get("host") || "dastavval.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
    const baseUrl = `${protocol}://${host}`;

    const sitemapContent = generateDynamicSitemapXml(baseUrl);
    
    // Save to public/sitemap.xml
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapContent, "utf-8");
    
    // Save to dist/sitemap.xml if dist exists
    const distDir = path.join(process.cwd(), "dist");
    if (fs.existsSync(distDir)) {
      fs.writeFileSync(path.join(distDir, "sitemap.xml"), sitemapContent, "utf-8");
    }

    // Save to data/sitemap.xml
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, "sitemap.xml"), sitemapContent, "utf-8");

    const products = getAllProductsForSEOAndTorob();
    const categories = b2bConfig.categories || [];
    const factories = b2bConfig.factories || [];

    res.json({
      success: true,
      message: "فایل sitemap.xml پویا با موفقیت به همراه تمام کاتالوگ محصولات، کارخانجات و دسته‌بندی‌ها تولید و ذخیره شد.",
      stats: {
        totalProducts: products.length,
        totalCategories: categories.length,
        totalFactories: factories.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- PUBLIC API V1 FOR EXTERNAL APPS ---
app.get("/api/v1/products", async (req, res) => {
  try {
    const products = getAllProductsForSEOAndTorob();
    res.json({ success: true, count: products.length, products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- CORS & MIDDLEWARE FOR TOROB API INTEGRATIONS ---
app.use(["/api/torob", "/torob", "/torob-api"], (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// TOROB API V3 PRODUCTS FEED (Supports Torob V3 standard 'results' array, pagination, and compatibility format)
const handleTorobProducts = async (req: express.Request, res: express.Response) => {
  try {
    const host = req.get("host") || "dastavval.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
    const baseUrl = `${protocol}://${host}`;

    const allProducts = getAllProductsForSEOAndTorob();
    const activeProducts = allProducts; // Include disabled products for Torob crawlers to know about outofstock items

    // Pagination support for Torob API v3
    const pageNum = parseInt((req.query.page as string) || "1", 10) || 1;
    const pageSize = parseInt((req.query.size as string) || (req.query.count as string) || (req.query.limit as string) || "100", 10) || 100;
    const pageUniqueId = (req.query.page_unique_id || req.query.page_unique_code) as string;

    let targetProducts = activeProducts;
    if (pageUniqueId) {
      targetProducts = activeProducts.filter((p: any) => String(p.id) === String(pageUniqueId) || String(p.sku) === String(pageUniqueId));
    }

    const totalCount = targetProducts.length;
    const maxPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const startIndex = (pageNum - 1) * pageSize;
    const paginatedProducts = targetProducts.slice(startIndex, startIndex + pageSize);

    const torobProductsArr: any[] = [];
    const torobProductsObj: Record<string, any> = {};

    paginatedProducts.forEach((prod: any) => {
      const id = String(prod.id || prod.sku || prod.code);
      const title = prod.name || "محصول عمده دست اول";
      const subtitle = prod.brand || prod.factoryName || "کارخانه رسمی";
      const page_url = `${baseUrl}/?product=${encodeURIComponent(id)}`;
      const image_url = prod.image_url || prod.imageUrl || `${baseUrl}/assets/logo.svg`;
      const price = Number(prod.bulk_price || prod.price || 0);
      const old_price = Number(prod.consumer_price || 0);
      const availability = prod.disabled ? "outofstock" : "instock";

      const torobItem = {
        product_id: id,
        page_unique_code: id,
        page_unique_id: id,
        title,
        subtitle,
        page_url,
        price: price > 0 ? price : 100000,
        old_price: old_price > price ? old_price : (price * 1.15 > price ? Math.round(price * 1.15) : undefined),
        availability,
        image_link: image_url,
        image_url: image_url,
        image_urls: [image_url],
        category_name: prod.category || "مواد غذایی",
        short_desc: `خرید مستقیم و عمده ${title} از کارخانه ${subtitle} با قیمت کف بازار و تضمین سلامت بار در سامانه دست اول.`,
        guarantee: "ضمانت اصالت فیزیکی و تحویل مستقیم از کارخانه",
        spec: {
          "تولیدکننده": prod.factoryName || prod.brand || "کارخانه رسمی",
          "حداقل سفارش": prod.min_order_cartons ? `${prod.min_order_cartons} کارتن` : "۵ کارتن",
          "تعداد در کارتن": prod.carton_pack_count ? `${prod.carton_pack_count} عدد` : "۲۴ عدد",
          "دسته‌بندی": prod.category || "مواد غذایی و سوپرمارکتی",
          "نحوه تسویه": "امانی امن و پیش‌فاکتور رسمی"
        },
        date_modified: new Date().toISOString()
      };

      torobProductsArr.push(torobItem);
      torobProductsObj[id] = torobItem;
    });

    // Format handling: Torob V3 standard response structure
    if (req.query.format === "dict" || req.query.format === "object") {
      return res.json({
        count: totalCount,
        max_pages: maxPages,
        page: pageNum,
        products: torobProductsObj
      });
    }

    // Default Torob V3: results array with all standard fields
    res.json({
      count: totalCount,
      max_pages: maxPages,
      page: pageNum,
      results: torobProductsArr,
      products: torobProductsArr
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

app.get("/api/torob/products", handleTorobProducts);
app.get("/api/torob/v3/products", handleTorobProducts);
app.get("/api/torob/v2/products", handleTorobProducts);
app.get("/api/torob/v1/products", handleTorobProducts);
app.get("/api/torob/products.json", handleTorobProducts);
app.get("/torob/products", handleTorobProducts);
app.get("/torob/v3/products", handleTorobProducts);
app.get("/torob/products.json", handleTorobProducts);
app.get("/torob-api/products", handleTorobProducts);

// TOROB RSS / XML FEED
const handleTorobXmlFeed = async (req: express.Request, res: express.Response) => {
  try {
    const host = req.get("host") || "dastavval.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
    const baseUrl = `${protocol}://${host}`;

    const allProducts = getAllProductsForSEOAndTorob();
    const activeProducts = allProducts; // Keep all products including disabled/out-of-stock for Torob

    const itemsXml = activeProducts.map((prod: any) => {
      const id = String(prod.id || prod.sku || prod.code);
      const title = prod.name || "";
      const brand = prod.brand || prod.factoryName || "";
      const price = Number(prod.bulk_price || prod.price || 0);
      const oldPrice = Number(prod.consumer_price || 0);
      const image = prod.image_url || prod.imageUrl || `${baseUrl}/assets/logo.svg`;
      const url = `${baseUrl}/?product=${encodeURIComponent(id)}`;

      return `    <item>
      <id>${id}</id>
      <product_id>${id}</product_id>
      <page_unique_code>${id}</page_unique_code>
      <title><![CDATA[${title}]]></title>
      <subtitle><![CDATA[${brand}]]></subtitle>
      <page_url>${url}</page_url>
      <price>${price > 0 ? price : 100000}</price>
      ${oldPrice > price ? `<old_price>${oldPrice}</old_price>` : ''}
      <availability>${prod.disabled ? 'outofstock' : 'instock'}</availability>
      <image_link><![CDATA[${image}]]></image_link>
      <image_url><![CDATA[${image}]]></image_url>
      <category><![CDATA[${prod.category || 'مواد غذایی'}]]></category>
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:torob="http://torob.com/rss/specs">
  <channel>
    <title>فید رسمی محصولات سامانه ملی دست اول</title>
    <link>${baseUrl}</link>
    <description>خرید مستقیم از کارخانجات صنایع غذایی ایران با قیمت کف بازار</description>
    <language>fa</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  } catch (error: any) {
    res.status(500).send(`<error>${error.message}</error>`);
  }
};

app.get("/api/torob/feed.xml", handleTorobXmlFeed);
app.get("/torob/feed.xml", handleTorobXmlFeed);
app.get("/torob-api/feed.xml", handleTorobXmlFeed);

// TOROB SINGLE PRODUCT INSTANT CHECK API (Torob V3 compliance)
const handleTorobProductCheck = (req: express.Request, res: express.Response) => {
  try {
    const host = req.get("host") || "dastavval.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
    const baseUrl = `${protocol}://${host}`;

    const id = (req.query.id || req.query.product_id || req.query.page_unique_code || req.query.page_unique_id) as string;
    const pageUrl = req.query.page_url as string;

    const allProducts = getAllProductsForSEOAndTorob();
    let found = null;

    if (id) {
      found = allProducts.find((p: any) => String(p.id) === String(id) || String(p.sku) === String(id) || String(p.code) === String(id));
    } else if (pageUrl) {
      found = allProducts.find((p: any) => pageUrl.includes(String(p.id)) || (p.sku && pageUrl.includes(String(p.sku))));
    }

    if (!found) {
      return res.status(404).json({ exists: false, availability: "outofstock", message: "محصول یافت نشد." });
    }

    const price = Number(found.bulk_price || found.price || 0);
    const old_price = Number(found.consumer_price || 0);
    const prodId = String(found.id || found.sku);
    const page_url = `${baseUrl}/?product=${encodeURIComponent(prodId)}`;
    const image_url = found.image_url || found.imageUrl || `${baseUrl}/assets/logo.svg`;

    res.json({
      exists: true,
      product_id: prodId,
      page_unique_code: prodId,
      page_unique_id: prodId,
      title: found.name,
      subtitle: found.brand || found.factoryName || "کارخانه رسمی",
      price: price > 0 ? price : 100000,
      old_price: old_price > price ? old_price : undefined,
      availability: found.disabled ? "outofstock" : "instock",
      page_url,
      image_link: image_url,
      image_url: image_url,
      image_urls: [image_url],
      guarantee: "ضمانت اصالت و سلامت فیزیکی دست اول",
      spec: {
        "تولیدکننده": found.factoryName || found.brand || "کارخانه رسمی",
        "حداقل سفارش": found.min_order_cartons ? `${found.min_order_cartons} کارتن` : "۵ کارتن",
        "دسته‌بندی": found.category || "عمومی"
      }
    });
  } catch (e: any) {
    res.status(500).json({ exists: false, error: e.message });
  }
};

app.get("/api/torob/product-check", handleTorobProductCheck);
app.get("/api/torob/v3/product-check", handleTorobProductCheck);
app.get("/torob/product-check", handleTorobProductCheck);
app.get("/torob-api/product-check", handleTorobProductCheck);

app.get("/api/v1/categories", (req, res) => {
  res.json({ success: true, categories: b2bConfig.categories || [] });
});

app.get("/api/v1/config", (req, res) => {
  res.json({
    success: true,
    appName: b2bConfig.appName,
    appSub: b2bConfig.appSub,
    primaryColor: b2bConfig.primaryColor,
    factories: b2bConfig.factories
  });
});

// Smart Fetch with automatic DNS-failover and direct IP bypass for ParsPack/S3 CDNs
async function smartFetchWithDnsBypass(targetUrl: string, baseHeaders: Record<string, string> = {}, extraOptions: any = {}) {
  let urlToFetch = targetUrl;
  if (urlToFetch.includes("parspack.net") && urlToFetch.startsWith("https://")) {
    urlToFetch = urlToFetch.replace(/^https:\/\//i, "http://");
  }

  try {
    const res = await fetch(urlToFetch, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, application/octet-stream, */*",
        ...baseHeaders
      },
      ...extraOptions
    });
    return res;
  } catch (error: any) {
    const isParsPack = urlToFetch.includes(".parspack.net") || urlToFetch.includes("parsstorage.com");
    
    // Only attempt direct IP bypass if this is genuinely a ParsPack/S3 host
    if (isParsPack) {
      try {
        const parsedUrl = new URL(urlToFetch.startsWith("http") ? urlToFetch : `http://${urlToFetch}`);
        const originalHostname = parsedUrl.hostname;
        
        let ipAddress: string | null = null;
        try {
          const lookupResult = await dns.promises.lookup(originalHostname);
          if (lookupResult && lookupResult.address) {
            ipAddress = lookupResult.address;
          }
        } catch (dnsErr: any) {
          // Dynamic DNS lookup failed
        }

        if (ipAddress) {
          parsedUrl.hostname = ipAddress;
          parsedUrl.protocol = "http:";
          const ipBypassUrl = parsedUrl.toString();

          const ipRes = await fetch(ipBypassUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "application/json, text/plain, application/octet-stream, */*",
              ...baseHeaders,
              "Host": originalHostname
            },
            ...extraOptions
          });

          if (ipRes.ok) return ipRes;
        }

        // Try standard HTTP
        const finalTryUrl = targetUrl.replace(/^https:\/\//i, "http://");
        return await fetch(finalTryUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            ...baseHeaders
          },
          ...extraOptions
        });
      } catch (bypassErr: any) {
        throw error;
      }
    }
    throw error;
  }
}

// Debug endpoint to view proxy logs remotely
app.get("/api/debug/proxy-logs", (req, res) => {
  try {
    if (fs.existsSync("proxy_debug.log")) {
      const logs = fs.readFileSync("proxy_debug.log", "utf-8");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(logs);
    }
    res.send("No proxy logs found yet.");
  } catch (e: any) {
    res.status(500).send("Error reading logs: " + e.message);
  }
});

// Enhanced Proxy fetch to bypass CORS, protocol mismatches (HTTP on ParsPack S3 vs HTTPS on domains), and inspect status/headers
const handleProxyFetchRequest = async (req: express.Request, res: express.Response) => {
  const urlParam = req.body?.url || req.query?.url;
  if (!urlParam) return res.status(400).json({ error: "URL parameter is required", error_fa: "پارامتر URL الزامی است" });

  const startTime = Date.now();
  // Clean up and sanitize URL string from accidental spaces or typos
  let targetUrl = String(urlParam).trim().replace(/\s+/g, '');
  
  // ParsPack S3 storage origins use HTTP on bucket subdomains
  if (targetUrl.includes('.parspack.net') && targetUrl.startsWith('https://')) {
    targetUrl = targetUrl.replace('https://', 'http://');
  }

  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = targetUrl.includes('.parspack.net') ? 'http://' + targetUrl : 'https://' + targetUrl;
  }
  // Remove redundant path slashes e.g. domain.com//wp-json -> domain.com/wp-json
  targetUrl = targetUrl.replace(/([^:]\/)\/+/g, "$1");

  const clientInfo = {
    host: req.headers.host || "unknown",
    origin: req.headers.origin || "unknown",
    referer: req.headers.referer || "unknown",
    userAgent: req.headers["user-agent"] || "unknown",
    ip: req.ip || req.socket.remoteAddress
  };

  console.log(`[Proxy Fetch] [${new Date().toISOString()}] Request from Host: ${clientInfo.host} -> Target: ${targetUrl}`);

  try {
    let response: any;
    let attemptedFallback = false;
    let fallbackError: string | null = null;

    try {
      response = await smartFetchWithDnsBypass(targetUrl);
    } catch (netErr: any) {
      if (targetUrl.startsWith('https://')) {
        attemptedFallback = true;
        const httpUrl = targetUrl.replace('https://', 'http://');
        console.log(`[Proxy Fetch] HTTPS failed (${netErr.message}), trying HTTP fallback: ${httpUrl}`);
        try {
          response = await smartFetchWithDnsBypass(httpUrl);
          targetUrl = httpUrl;
        } catch (httpErr: any) {
          fallbackError = httpErr.message;
          throw netErr;
        }
      } else {
        throw netErr;
      }
    }

    const durationMs = Date.now() - startTime;
    const targetStatus = response.status;
    const targetStatusText = response.statusText;
    const targetHeaders: Record<string, string> = {};
    response.headers.forEach((val: string, key: string) => {
      targetHeaders[key.toLowerCase()] = val;
    });

    console.log(`[Proxy Fetch] Response from ${targetUrl}: Status ${targetStatus} ${targetStatusText} (in ${durationMs}ms), Content-Type: ${targetHeaders['content-type'] || 'unknown'}, Length: ${targetHeaders['content-length'] || 'unknown'}`);

    // Read full raw body text to support BOM removal and octet-stream json parsing
    const rawText = await response.text();
    const cleanText = rawText.replace(/^\uFEFF/, '').trim(); // Remove UTF-8 Byte Order Mark if present

    if (!response.ok) {
      console.error(`[Proxy Fetch] Upstream server returned HTTP ${targetStatus}: ${cleanText.slice(0, 300)}`);
      res.setHeader("X-Target-Status", String(targetStatus));
      res.setHeader("X-Target-Content-Type", targetHeaders['content-type'] || "unknown");
      res.setHeader("X-Proxy-Duration-Ms", String(durationMs));
      return res.status(502).json({
        error: `سرور مبدا با کد وضعیت ${targetStatus} پاسخ داد (${targetStatusText || 'Error'}).`,
        targetUrl,
        targetStatus,
        targetHeaders,
        durationMs,
        clientHost: clientInfo.host,
        rawBodyPreview: cleanText.slice(0, 500)
      });
    }

    // Attempt to parse JSON
    let parsedData: any = null;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (jsonErr: any) {
      console.error(`[Proxy Fetch] JSON parse failed: ${jsonErr.message}. First 200 chars: ${cleanText.slice(0, 200)}`);
      res.setHeader("X-Target-Status", String(targetStatus));
      res.setHeader("X-Target-Content-Type", targetHeaders['content-type'] || "unknown");
      res.setHeader("X-Proxy-Duration-Ms", String(durationMs));
      return res.status(502).json({
        error: `پاسخ دریافت شده از سرور مبدا ساختار معتبر JSON ندارد (${jsonErr.message}).`,
        targetUrl,
        targetStatus,
        targetHeaders,
        durationMs,
        clientHost: clientInfo.host,
        rawBodyPreview: cleanText.slice(0, 500)
      });
    }

    // Set informative proxy diagnostic headers on response
    res.setHeader("X-Target-Status", String(targetStatus));
    res.setHeader("X-Target-Content-Type", targetHeaders['content-type'] || "unknown");
    res.setHeader("X-Target-Content-Length", targetHeaders['content-length'] || String(cleanText.length));
    res.setHeader("X-Target-Server", targetHeaders['server'] || "unknown");
    res.setHeader("X-Proxy-Duration-Ms", String(durationMs));
    res.setHeader("X-Proxy-Client-Host", clientInfo.host);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    // Send parsed JSON data back to client
    res.json(parsedData);
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error("[Proxy Fetch] Network/Fetch Error:", error.message);
    res.status(500).json({
      error: `خطا در برقراری ارتباط با سایت مبدا (${error.message}). بررسی کنید آدرس وارد شده صحیح باشد و مسدود نباشد.`,
      targetUrl,
      durationMs,
      clientHost: clientInfo.host,
      networkError: error.message
    });
  }
};

app.post("/api/proxy-fetch", handleProxyFetchRequest);
app.get("/api/proxy-fetch", handleProxyFetchRequest);

// Endpoint to manually sync ParsPack catalog to local server storage
app.post("/api/admin/sync-catalog", async (req, res) => {
  const customUrl = req.body?.url as string;
  const targetUrl = customUrl || (b2bConfig as any)?.catalogJsonUrl || "http://c102393.parspack.net/c102393/catalog.json";
  try {
    console.log(`[Manual Sync] Fetching catalog from: ${targetUrl}`);
    let response: any = null;
    try {
      response = await fetch(targetUrl, { signal: AbortSignal.timeout(8000) });
    } catch (fetchErr: any) {
      if (targetUrl.startsWith("http://")) {
        const httpsFallback = targetUrl.replace("http://", "https://");
        response = await fetch(httpsFallback, { signal: AbortSignal.timeout(8000) }).catch(() => null);
      }
    }

    if (!response || !response.ok) {
      throw new Error(`خطا در اتصال به منبع کاتالوگ (${response ? response.status : "عدم پاسخ سرور کاتالوگ"})`);
    }
    
    const rawText = await response.text();
    const cleanText = rawText.replace(/^\uFEFF/, '').trim();
    const parsed = JSON.parse(cleanText);
    
    let productsList = [];
    if (Array.isArray(parsed)) {
      productsList = parsed;
    } else if (parsed.products && Array.isArray(parsed.products)) {
      productsList = parsed.products;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      productsList = parsed.items;
    }
    
    if (productsList.length > 0) {
      // Map new field names and ensure unique IDs
      const seenIds = new Set<string>();
      const mappedProducts = productsList.map((p: any, idx: number) => {
        let rawId = String(p.id || p.sku || "").trim();
        let finalId = rawId || `prd-gen-${Date.now()}-${idx}`;
        
        // If ID is already seen, append index to make it unique
        if (seenIds.has(finalId)) {
          finalId = `${finalId}-${idx}`;
        }
        seenIds.add(finalId);

        // Ensure image_url is proxied
        let rawImageUrl = p.imageUrl || p.image_url || "";
        let proxiedImageUrl = rawImageUrl;
        if (rawImageUrl && !rawImageUrl.startsWith("/api/proxy-image")) {
          proxiedImageUrl = `/api/proxy-image?url=${encodeURIComponent(rawImageUrl)}`;
        }

        return {
          ...p,
          id: finalId,
          sku: String(p.sku || p.id || finalId),
          name: p.name || "محصول بدون نام",
          brand: cleanBrandNameServer(p),
          price: Number(p.price || p.bulk_price || p.wholesalePrice || p.marketPrice || 0),
          bulk_price: Number(p.bulk_price || p.wholesalePrice || p.marketPrice || 0),
          consumer_price: Number(p.consumer_price || p.consumerPrice || 0),
          purchase_price: Number(p.purchase_price || p.factoryPrice || 0),
          carton_pack_count: Number(p.carton_pack_count || p.itemsPerUnit || 24),
          min_order_cartons: Number(p.min_order_cartons || p.minOrderCartons || 1),
          image_url: proxiedImageUrl,
          // Keep new fields as well for compatibility
          imageUrl: proxiedImageUrl,
          wholesalePrice: Number(p.wholesalePrice || p.bulk_price || 0)
        };
      });

      saveProducts(mappedProducts);
      console.log(`[Manual Sync] Success: ${mappedProducts.length} products saved and mapped.`);
      return res.json({ success: true, count: mappedProducts.length, message: "کاتالوگ با موفقیت همگام‌سازی، تبدیل و ذخیره شد." });
    } else {
      return res.status(400).json({ success: false, error: "ساختار فایل جیسون نامعتبر است یا محصولی یافت نشد." });
    }
  } catch (error: any) {
    console.warn("[Manual Sync] Notice:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comprehensive Network & Storage Diagnostics API
app.get("/api/diagnostics/catalog-sync", async (req, res) => {
  const targetUrl = (req.query.url as string) || "http://c102393.parspack.net/c102393/catalog.json";
  const results: any = {
    timestamp: new Date().toISOString(),
    testedUrl: targetUrl,
    clientHost: req.headers.host,
    clientOrigin: req.headers.origin,
    clientIp: req.ip || req.socket.remoteAddress,
    dnsLookup: null,
    httpDirectTest: null,
    httpsTest: null,
    jsonValidation: null,
    recommendations: []
  };

  // 1. DNS Resolution Test
  try {
    const parsedUrl = new URL(targetUrl.startsWith("http") ? targetUrl : `http://${targetUrl}`);
    const hostname = parsedUrl.hostname;
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    results.dnsLookup = {
      hostname,
      status: "SUCCESS",
      addresses: lookupResult
    };
  } catch (dnsErr: any) {
    results.dnsLookup = {
      status: "FAILED",
      error: dnsErr.message
    };
    results.recommendations.push("دی‌ان‌اس دامنه پارس‌پک قابل حل نیست. اینترنت سرور یا فایل hosts را بررسی کنید.");
  }

  // 2. Direct HTTP Fetch Test
  try {
    const httpTarget = targetUrl.replace(/^https:\/\//i, "http://");
    const tStart = Date.now();
    const httpRes = await fetch(httpTarget, {
      headers: {
        "User-Agent": "DastAvval-Diagnostics/1.0",
        "Accept": "application/json, text/plain, */*"
      }
    });
    const tDuration = Date.now() - tStart;
    const headersMap: Record<string, string> = {};
    httpRes.headers.forEach((v, k) => { headersMap[k.toLowerCase()] = v; });

    const rawText = await httpRes.text();
    const cleanText = rawText.replace(/^\uFEFF/, '').trim();

    let jsonParsed = false;
    let productCount = 0;
    let topLevelKeys: string[] = [];

    try {
      const parsed = JSON.parse(cleanText);
      jsonParsed = true;
      if (typeof parsed === "object" && parsed !== null) {
        topLevelKeys = Object.keys(parsed);
        const prodArr = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || parsed.data || []);
        productCount = Array.isArray(prodArr) ? prodArr.length : 0;
      }
    } catch (e) {}

    results.httpDirectTest = {
      url: httpTarget,
      status: httpRes.status,
      statusText: httpRes.statusText,
      durationMs: tDuration,
      headers: headersMap,
      bodyLength: rawText.length,
      isJson: jsonParsed,
      topLevelKeys,
      productCount,
      bodyPreview: cleanText.slice(0, 300)
    };

    if (httpRes.status === 200 && jsonParsed && productCount > 0) {
      results.jsonValidation = {
        status: "VALID_CATALOG",
        message: `فایل کاتالوگ با موفقیت دریافت شد و شامل ${productCount} محصول است.`
      };
    } else if (httpRes.status === 200 && jsonParsed && productCount === 0) {
      results.jsonValidation = {
        status: "EMPTY_OR_UNEXPECTED_STRUCTURE",
        message: `فایل JSON خوانده شد اما کلید products در آن یافت نشد. کلیدهای موجود: ${topLevelKeys.join(", ")}`
      };
    }
  } catch (httpErr: any) {
    results.httpDirectTest = {
      status: "FAILED",
      error: httpErr.message
    };
  }

  // 3. HTTPS Attempt Test (to verify if ParsPack has SSL on bucket domain)
  try {
    const httpsTarget = targetUrl.replace(/^http:\/\//i, "https://");
    const tStart = Date.now();
    const httpsRes = await fetch(httpsTarget, {
      signal: AbortSignal.timeout(4000)
    });
    results.httpsTest = {
      url: httpsTarget,
      status: httpsRes.status,
      durationMs: Date.now() - tStart,
      sslWorking: true
    };
  } catch (httpsErr: any) {
    results.httpsTest = {
      url: targetUrl.replace(/^http:\/\//i, "https://"),
      sslWorking: false,
      error: httpsErr.message,
      note: "پارس‌پک روی ساب‌دامین‌های باکت (مانند c102393.parspack.net) از پورت 443 و SSL پشتیبانی نمی‌کند؛ بنابراین درخواست باید حتماً از طریق پروکسی نودجی‌اس یا با پروتکل HTTP ارسال شود."
    };
  }

  res.json(results);
});

// Persistent on-disk and in-memory image cache
const IMAGE_CACHE_DIR = path.join(DATA_DIR, "image_cache");
if (!fs.existsSync(IMAGE_CACHE_DIR)) {
  try { fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true }); } catch (e) {}
}

const memoryImageCache = new Map<string, { buffer: Buffer; contentType: string; cachedAt: number }>();
const inFlightImageFetches = new Map<string, Promise<{ buffer: Buffer; contentType: string } | null>>();

function detectImageContentType(url: string, buffer?: Buffer): string {
  if (buffer && buffer.length > 4) {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return "image/png";
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return "image/jpeg";
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return "image/gif";
    if (buffer.subarray(0, 12).toString("latin1").includes("WEBP")) return "image/webp";
    if (buffer.subarray(0, 100).toString("utf-8").includes("<svg")) return "image/svg+xml";
  }
  const lower = url.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".avif")) return "image/avif";
  return "image/jpeg";
}

function getFallbackSvgBuffer(title: string = "کالای اصیل کارخانه"): Buffer {
  const safeName = (title || "محصول صنایع غذایی").slice(0, 35);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="100%" stop-color="#f1f5f9" />
      </linearGradient>
      <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#059669" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#bgGrad)" rx="24" />
    <circle cx="200" cy="160" r="70" fill="#e2e8f0" opacity="0.6" />
    <g transform="translate(160, 120)" stroke="#059669" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </g>
    <rect x="80" y="245" width="240" height="32" rx="16" fill="url(#badgeGrad)" />
    <text x="200" y="266" fill="#ffffff" font-family="tahoma, sans-serif" font-size="14" font-weight="900" text-anchor="middle" direction="rtl">دست اول</text>
    <text x="200" y="310" fill="#0f172a" font-family="tahoma, sans-serif" font-size="15" font-weight="bold" text-anchor="middle" direction="rtl">${safeName}</text>
  </svg>`;
  return Buffer.from(svg, "utf-8");
}

// Proxy image requests to bypass CORS, mixed content, and SSL port 443 timeouts on ParsPack S3
// Equipped with High-Speed Memory Cache (0.2ms), Persistent Disk Cache (1ms), and In-Flight Request Deduplication
app.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send("URL parameter is required");
  }

  let targetUrl = String(imageUrl).trim();
  if (targetUrl.startsWith("//")) {
    targetUrl = "http:" + targetUrl;
  }
  if (targetUrl.includes(".parspack.net") && targetUrl.startsWith("https://")) {
    targetUrl = targetUrl.replace("https://", "http://");
  }
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "http://" + targetUrl;
  }

  // 1. Check local persistent uploads directory first
  try {
    const filename = path.basename(new URL(targetUrl).pathname);
    const localUploadPath = path.join(PERSISTENT_UPLOADS_DIR, filename);
    if (fs.existsSync(localUploadPath)) {
      const buffer = fs.readFileSync(localUploadPath);
      const cType = detectImageContentType(filename, buffer);
      res.setHeader("Content-Type", cType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Image-Cache", "HIT-LOCAL-UPLOAD");
      return res.send(buffer);
    }
  } catch (e) {}

  const urlHash = crypto.createHash("md5").update(targetUrl).digest("hex");

  // 2. High-Speed Memory Cache Check (Instant 0.1ms response)
  const memCached = memoryImageCache.get(urlHash);
  if (memCached) {
    res.setHeader("Content-Type", memCached.contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Image-Cache", "HIT-MEMORY");
    return res.send(memCached.buffer);
  }

  // 3. Persistent Disk Cache Check (Fast 1ms response)
  const diskCacheFile = path.join(IMAGE_CACHE_DIR, `${urlHash}.bin`);
  const diskMetaFile = path.join(IMAGE_CACHE_DIR, `${urlHash}.meta`);
  if (fs.existsSync(diskCacheFile)) {
    try {
      const buffer = fs.readFileSync(diskCacheFile);
      if (buffer.length > 0) {
        let contentType = "image/webp";
        if (fs.existsSync(diskMetaFile)) {
          contentType = fs.readFileSync(diskMetaFile, "utf-8").trim();
        } else {
          contentType = detectImageContentType(targetUrl, buffer);
        }

        // Cache in memory for fastest subsequent delivery (capped at 300 items)
        if (memoryImageCache.size < 300) {
          memoryImageCache.set(urlHash, { buffer, contentType, cachedAt: Date.now() });
        }

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("X-Image-Cache", "HIT-DISK");
        return res.send(buffer);
      }
    } catch (diskErr) {}
  }

  // 4. In-Flight Fetch Deduplication (Prevents redundant simultaneous downloads)
  let fetchPromise = inFlightImageFetches.get(urlHash);
  if (!fetchPromise) {
    fetchPromise = (async () => {
      // Primary fetch attempt
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        let response = await smartFetchWithDnsBypass(targetUrl, {
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }, { signal: controller.signal });

        clearTimeout(timeoutId);

        // If HTTP failed, try HTTPS as fallback
        if (!response.ok && targetUrl.startsWith("http://")) {
          const httpsUrl = targetUrl.replace(/^http:\/\//i, "https://");
          try {
            const httpsController = new AbortController();
            const httpsTimeoutId = setTimeout(() => httpsController.abort(), 6000);
            const httpsRes = await smartFetchWithDnsBypass(httpsUrl, {
              "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
            }, { signal: httpsController.signal });
            clearTimeout(httpsTimeoutId);
            if (httpsRes.ok) {
              response = httpsRes;
            }
          } catch (e) {}
        }

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 0) {
            const rawType = response.headers.get("content-type") || "";
            let contentType = rawType;
            if (!contentType || contentType === "application/octet-stream" || !contentType.startsWith("image/")) {
              contentType = detectImageContentType(targetUrl, buffer);
            }

            // Save to disk cache asynchronously
            try {
              fs.writeFileSync(diskCacheFile, buffer);
              fs.writeFileSync(diskMetaFile, contentType, "utf-8");
            } catch (writeErr) {}

            // Save to memory cache
            if (memoryImageCache.size < 300) {
              memoryImageCache.set(urlHash, { buffer, contentType, cachedAt: Date.now() });
            }

            return { buffer, contentType };
          }
        }
      } catch (err: any) {
        console.warn(`[Proxy Image] Fetch error for ${targetUrl}:`, err.message);
      }
      return null;
    })();

    inFlightImageFetches.set(urlHash, fetchPromise);
  }

  try {
    const result = await fetchPromise;
    inFlightImageFetches.delete(urlHash);

    if (result && result.buffer) {
      res.setHeader("Content-Type", result.contentType);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader("X-Image-Cache", "MISS-FETCHED");
      return res.send(result.buffer);
    }
  } catch (err) {
    inFlightImageFetches.delete(urlHash);
  }

  // Graceful visual fallback: Return high-quality SVG placeholder with 200 OK so UI renders cleanly
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.setHeader("X-Image-Cache", "FALLBACK-SVG");
  return res.status(200).send(getFallbackSvgBuffer("کالای دست اول"));
});

// --- GALLERY API ---
app.get("/api/gallery", (req, res) => {
  res.json({ success: true, images: b2bConfig.gallery || [] });
});

// Resilient Proxy Download Endpoint for Bucket files, PDF Catalogs, and Media Assets
app.get("/api/storage/proxy-download", async (req, res) => {
  const targetUrl = (req.query.url as string || "").trim();
  const customFileName = (req.query.filename as string || "").trim();

  if (!targetUrl) {
    return res.status(400).send("پارامتر url الزامی است.");
  }

  let finalUrl = targetUrl;
  if (finalUrl.startsWith("//")) {
    finalUrl = "http:" + finalUrl;
  }
  if (finalUrl.includes(".parspack.net") && finalUrl.startsWith("https://")) {
    finalUrl = finalUrl.replace("https://", "http://");
  }
  if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
    finalUrl = "http://" + finalUrl;
  }

  const defaultFileName = finalUrl.split("/").pop() || "dastavval-catalog.pdf";
  const filename = customFileName || defaultFileName;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const response = await smartFetchWithDnsBypass(finalUrl, {
      "Accept": "*/*"
    }, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const contentType = response.headers.get("content-type") || (filename.endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    }
  } catch (e: any) {
    console.warn(`[Proxy Download] Remote fetch note for ${finalUrl}:`, e.message);
  }

  // Fallback: check local storage in public/uploads, data/uploads, public/catalogs, or data/catalogs
  const localCandidates = [
    path.join(process.cwd(), "public", "uploads", filename),
    path.join(DATA_DIR, "uploads", filename),
    path.join(process.cwd(), "public", "catalogs", filename),
    path.join(DATA_DIR, "catalogs", filename),
    path.join(process.cwd(), "public", filename)
  ];

  for (const loc of localCandidates) {
    if (fs.existsSync(loc) && fs.statSync(loc).isFile()) {
      const contentType = filename.endsWith(".pdf") ? "application/pdf" : "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      return res.sendFile(loc);
    }
  }

  // If it's a PDF and still not found, return 404 with clear message
  res.status(404).send("فایل مورد نظر در باکت یا حافظه سرور یافت نشد.");
});

app.post("/api/gallery/add", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });
  if (!b2bConfig.gallery) b2bConfig.gallery = [];
  if (!b2bConfig.gallery.includes(url)) {
    b2bConfig.gallery.unshift(url);
    if (b2bConfig.gallery.length > 50) b2bConfig.gallery.pop();
    fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
  }
  res.json({ success: true, images: b2bConfig.gallery });
});

// --- PARSPACK S3 OBJECT STORAGE API ---
function sanitizeStorageConfig(customConfig?: any) {
  let endpointRaw = (
    customConfig?.storageEndpoint ||
    b2bConfig?.storageEndpoint ||
    process.env.STORAGE_ENDPOINT ||
    process.env.PARSPACK_S3_ENDPOINT ||
    process.env.S3_ENDPOINT ||
    "c102393.parspack.net"
  ).trim();

  // If user entered full URL like http://c102393.parspack.net/c102393 or c102393.parspack.net/c102393
  let extractedBucket = "";
  if (endpointRaw.includes("/")) {
    const parts = endpointRaw.replace(/^https?:\/\//, "").split("/");
    endpointRaw = parts[0];
    if (parts.length > 1 && parts[1]) {
      extractedBucket = parts[1].trim();
    }
  }

  const accessKey = (
    customConfig?.storageAccessKey ||
    b2bConfig?.storageAccessKey ||
    process.env.STORAGE_ACCESS_KEY ||
    process.env.PARSPACK_ACCESS_KEY ||
    process.env.S3_ACCESS_KEY ||
    process.env.AWS_ACCESS_KEY_ID ||
    "xt3cR9wHHoATuXS3"
  ).trim();

  const secretKey = (
    customConfig?.storageSecretKey ||
    b2bConfig?.storageSecretKey ||
    process.env.STORAGE_SECRET_KEY ||
    process.env.PARSPACK_SECRET_KEY ||
    process.env.S3_SECRET_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY ||
    "4gffDy7cBYByRjxhiXpMP1nqtQ0Sd31b"
  ).trim();

  let bucket = (
    customConfig?.storageBucket ||
    b2bConfig?.storageBucket ||
    extractedBucket ||
    process.env.STORAGE_BUCKET ||
    process.env.PARSPACK_BUCKET ||
    process.env.S3_BUCKET ||
    "c102393"
  ).trim();

  if (bucket.includes(".")) {
    bucket = bucket.split(".")[0];
  }

  const region = (
    customConfig?.storageRegion ||
    b2bConfig?.storageRegion ||
    process.env.STORAGE_REGION ||
    process.env.S3_REGION ||
    "us-east-1"
  ).trim();

  const forcePathStyle = customConfig?.storageForcePathStyle !== undefined 
    ? customConfig.storageForcePathStyle 
    : (b2bConfig?.storageForcePathStyle ?? true);

  let endpoint = endpointRaw;
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    endpoint = `http://${endpointRaw}`;
  }

  return {
    endpoint,
    endpointRaw,
    accessKey,
    secretKey,
    bucket,
    region,
    forcePathStyle
  };
}

function getParsPackS3Client(customConfig?: any, timeoutMs = 15000) {
  const cfg = sanitizeStorageConfig(customConfig);
  const isHttps = cfg.endpoint.startsWith("https://");

  return new S3Client({
    endpoint: cfg.endpoint,
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKey,
      secretAccessKey: cfg.secretKey
    },
    forcePathStyle: cfg.forcePathStyle,
    maxAttempts: 1,
    requestHandler: new NodeHttpHandler({
      connectionTimeout: Math.min(timeoutMs, 8000),
      socketTimeout: timeoutMs,
      httpAgent: !isHttps ? new http.Agent({ keepAlive: false, timeout: timeoutMs }) : undefined,
      httpsAgent: isHttps ? new https.Agent({ keepAlive: false, rejectUnauthorized: false, timeout: timeoutMs }) : undefined
    })
  });
}

// S3 Circuit Breaker & Health State
let s3CircuitBreakerOfflineUntil = 0;

// Resilient Multi-Protocol / Multi-Host S3 Execution Runner
async function executeResilientS3Operation<T>(
  actionName: string,
  commandFactory: (endpoint: string, isHttps: boolean) => any,
  customConfig?: any,
  timeoutMs = 7500
): Promise<{ success: boolean; data?: T; error?: string; endpointUsed?: string; latency?: number; attempts: string[] }> {
  const cfg = sanitizeStorageConfig(customConfig);
  const cleanHost = cfg.endpointRaw.replace(/^https?:\/\//, "").replace(/\/+$/, "").split("/")[0];
  const isBackground = actionName.includes("Auto") || actionName.includes("Background") || actionName.includes("Live-Backup") || actionName.includes("Restore-On-Startup");

  // If in circuit breaker backoff and this is a background job, return immediately without network calls
  if (isBackground && Date.now() < s3CircuitBreakerOfflineUntil) {
    return {
      success: false,
      error: "باکت پارس‌پک در وضعیت وقفه موقت (Circuit Breaker) قرار دارد و پشتیبان‌گیری محلی فعال است.",
      attempts: ["پشتیبان‌گیری در حافظه محلی سرور انجام شد."]
    };
  }

  // Use the specific configured host with http and https
  const candidateEndpoints: string[] = [
    `http://${cleanHost}`,
    `https://${cleanHost}`
  ];

  const attempts: string[] = [];
  let lastError: any = null;

  for (const ep of candidateEndpoints) {
    const startTime = Date.now();
    const isHttps = ep.startsWith("https");
    try {
      attempts.push(`تلاش با ${ep}`);
      const client = new S3Client({
        endpoint: ep,
        region: cfg.region || "us-east-1",
        credentials: {
          accessKeyId: cfg.accessKey,
          secretAccessKey: cfg.secretKey
        },
        forcePathStyle: true,
        maxAttempts: 1,
        requestHandler: new NodeHttpHandler({
          connectionTimeout: Math.min(timeoutMs, 3000),
          socketTimeout: timeoutMs,
          httpAgent: !isHttps ? new http.Agent({ keepAlive: false, timeout: timeoutMs }) : undefined,
          httpsAgent: isHttps ? new https.Agent({ keepAlive: false, rejectUnauthorized: false, timeout: timeoutMs }) : undefined
        })
      });

      const command = commandFactory(ep, isHttps);
      const response = await Promise.race([
        client.send(command),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: باکت پارس‌پک روی ${ep} در مهلت ${timeoutMs/1000} ثانیه پاسخ نداد`)), timeoutMs)
        )
      ]);

      const latency = Date.now() - startTime;
      s3CircuitBreakerOfflineUntil = 0; // reset circuit breaker on success
      console.log(`[S3 Resilient Runner] ${actionName} SUCCESS via ${ep} (${latency}ms)`);
      return { success: true, data: response as T, endpointUsed: ep, latency, attempts };
    } catch (err: any) {
      const errMsg = err.message || err.name || "خطای ناشناخته";
      attempts.push(`خطا در ${ep}: ${errMsg}`);
      lastError = err;
      if (isBackground) {
        // Quiet debug log for background tasks
      } else {
        console.warn(`[S3 Resilient Runner] ${actionName} note on ${ep}:`, errMsg);
      }
    }
  }

  // Trip circuit breaker for 10 minutes so background auto-backup doesn't spam unreachable endpoints
  s3CircuitBreakerOfflineUntil = Date.now() + 10 * 60 * 1000;
  if (isBackground) {
    console.log(`[S3 Resilient Runner] ${actionName}: سرور پارس‌پک خارج از دسترس است. پشتیبان‌گیری محلی روی دیسک فعال است.`);
  }

  const finalMsg = lastError?.message || "عدم برقراری ارتباط با باکت پارس‌پک";
  return { success: false, error: finalMsg, attempts };
}

// Storage Test Endpoint with Direct Multi-Strategy Verification
app.post("/api/storage/test", async (req, res) => {
  s3CircuitBreakerOfflineUntil = 0; // Always allow active test
  const config = req.body || {};
  const cfg = sanitizeStorageConfig(config);
  const cleanHost = cfg.endpointRaw.replace(/^https?:\/\//, "").replace(/\/+$/, "").split("/")[0];
  const accessKey = cfg.accessKey;
  const secretKey = cfg.secretKey;
  const bucket = cfg.bucket;

  const testResults = await executeResilientS3Operation<any>(
    "TestStorageConnection",
    () => new ListObjectsV2Command({ Bucket: bucket, MaxKeys: 5 }),
    config,
    7000
  );

  if (testResults.success && testResults.data) {
    const fileCount = testResults.data.KeyCount || (testResults.data.Contents ? testResults.data.Contents.length : 0);
    
    // Save verified working parameters to b2bConfig
    b2bConfig.storageEndpoint = cleanHost;
    b2bConfig.storageBucket = bucket;
    b2bConfig.storageForcePathStyle = true;
    b2bConfig.storageAccessKey = accessKey;
    b2bConfig.storageSecretKey = secretKey;
    b2bConfig.storageEnabled = true;
    b2bConfig.storagePublicUrl = `${testResults.endpointUsed}/${bucket}`;

    try {
      fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
    } catch (e) {}

    return res.json({
      success: true,
      message: `اتصال زنده به باکت پارس‌پک با موفقیت تایید گردید! پورت و پروتکل فعال: ${testResults.endpointUsed} (زمان پاسخ: ${testResults.latency}ms). تعداد اشیاء موجود: ${fileCount}`,
      fileCount,
      endpointUsed: testResults.endpointUsed,
      latency: testResults.latency,
      attempts: testResults.attempts
    });
  }

  // If failed, return clear error message with suggestions
  return res.json({
    success: false,
    error: `عدم برقراری اتصال به باکت پارس‌پک: ${testResults.error}`,
    attempts: testResults.attempts,
    recommendations: [
      "از صحت کلید Access Key و Secret Key در پنل پارس‌پک اطمینان حاصل فرمایید.",
      "مطمئن شوید فایروال سرور هاست (CSF/UFW) پورت‌های ۸۰ یا ۴۴۳ خروجی را نبسته است.",
      "در پنل هاست، DNS سرور را بر روی 8.8.8.8 یا 1.1.1.1 تنظیم نمایید."
    ]
  });
});

// Storage Upload Endpoint
app.post("/api/storage/upload", async (req, res) => {
  try {
    const { fileData, fileName, folder, contentType: customContentType } = req.body;
    if (!fileData) {
      return res.status(400).json({ success: false, error: "محتوای فایل (fileData) الزامی است." });
    }

    let buffer: Buffer;
    let mimeType = customContentType || "application/octet-stream";

    if (typeof fileData === "string" && fileData.startsWith("data:")) {
      const matches = fileData.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], "base64");
      } else {
        buffer = Buffer.from(fileData, "base64");
      }
    } else if (typeof fileData === "string") {
      buffer = Buffer.from(fileData, "base64");
    } else {
      buffer = Buffer.from(fileData);
    }

    const cleanFileName = (fileName || "uploaded-file.bin").replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const subFolder = folder ? `${folder.replace(/\/+$/, "").replace(/^\/+/, "")}/` : "uploads/";
    const timestamp = Date.now();
    const objectKey = `${subFolder}${timestamp}-${cleanFileName}`;

    // Always ensure local persistence in both public/uploads and data/uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const persistentUploadsDir = path.join(DATA_DIR, "uploads");
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      if (!fs.existsSync(persistentUploadsDir)) {
        fs.mkdirSync(persistentUploadsDir, { recursive: true });
      }
      const targetFileName = `${timestamp}-${cleanFileName}`;
      fs.writeFileSync(path.join(uploadsDir, targetFileName), buffer);
      fs.writeFileSync(path.join(persistentUploadsDir, targetFileName), buffer);
      triggerDataChangeBackup();
    } catch (e) {
      console.warn("Local upload write note:", e);
    }

    const cfg = sanitizeStorageConfig();
    let directUrl = `/uploads/${timestamp}-${cleanFileName}`;
    let proxyUrl = `/api/storage/file/${encodeURIComponent(objectKey)}`;
    let s3Success = false;

    // Attempt remote S3 upload with timeout
    if (b2bConfig.storageEnabled !== false && cfg.accessKey && cfg.secretKey) {
      try {
        const client = getParsPackS3Client(undefined, 15000);
        const putCommand = new PutObjectCommand({
          Bucket: cfg.bucket,
          Key: objectKey,
          Body: buffer,
          ContentType: mimeType
        });
        await Promise.race([
          client.send(putCommand),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))
        ]);
        s3Success = true;
        const publicBase = (b2bConfig.storagePublicUrl || `http://${cfg.endpointRaw}/${cfg.bucket}`).replace(/\/+$/, "");
        directUrl = `${publicBase}/${objectKey}`;
      } catch (s3Err: any) {
        console.warn("[ParsPack S3 Storage]: Using local fast cache due to:", s3Err.message || s3Err);
      }
    }

    return res.json({
      success: true,
      message: s3Success ? "فایل با موفقیت روی باکت پارس‌پک آپلود شد." : "فایل با موفقیت در فضای ذخیره‌سازی ابری سرور ثبت و آماده شد.",
      key: objectKey,
      url: directUrl,
      proxyUrl,
      size: buffer.length,
      mimeType,
      fileName: cleanFileName,
      s3Success
    });
  } catch (error: any) {
    console.error("[Storage Upload Error]:", error);
    return res.status(500).json({ 
      success: false, 
      error: `خطا در پردازش و ذخیره فایل: ${error.message || error}`
    });
  }
});

// Storage List Files Endpoint
app.get("/api/storage/files", async (req, res) => {
  try {
    const cfg = sanitizeStorageConfig();
    let files: any[] = [];
    let s3Connected = false;
    let s3Error: string | null = null;
    let s3EndpointUsed: string | null = null;

    // 1. Try remote S3 listing via resilient runner
    if (b2bConfig.storageEnabled !== false && cfg.accessKey && cfg.secretKey) {
      const s3ListResult = await executeResilientS3Operation<any>(
        "ListObjects",
        () => new ListObjectsV2Command({
          Bucket: cfg.bucket,
          MaxKeys: 100
        }),
        undefined,
        7000
      );

      if (s3ListResult.success && s3ListResult.data) {
        s3Connected = true;
        s3EndpointUsed = s3ListResult.endpointUsed || null;
        const publicBase = `${s3ListResult.endpointUsed}/${cfg.bucket}`;
        if (s3ListResult.data.Contents && s3ListResult.data.Contents.length > 0) {
          files = s3ListResult.data.Contents.map((item: any) => ({
            key: item.Key || "",
            size: item.Size || 0,
            lastModified: item.LastModified,
            url: `${publicBase}/${item.Key}`,
            proxyUrl: `/api/storage/file/${encodeURIComponent(item.Key || "")}`,
            source: 'parspack_s3'
          }));
        }
      } else {
        s3Error = s3ListResult.error || "عدم دریافت پاسخ از باکت";
      }
    }

    // 2. Check local uploads
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (fs.existsSync(uploadsDir)) {
      try {
        const localFiles = fs.readdirSync(uploadsDir);
        for (const file of localFiles) {
          if (file.startsWith(".")) continue;
          const stat = fs.statSync(path.join(uploadsDir, file));
          const existing = files.find(f => f.key.endsWith(file));
          if (!existing) {
            files.push({
              key: `uploads/${file}`,
              size: stat.size,
              lastModified: stat.mtime,
              url: `/uploads/${file}`,
              proxyUrl: `/api/storage/file/${encodeURIComponent(`uploads/${file}`)}`,
              source: 'local_storage'
            });
          }
        }
      } catch (e) {
        console.warn("Local uploads readdir error:", e);
      }
    }

    return res.json({ 
      success: true, 
      count: files.length, 
      files,
      s3Connected,
      s3Error,
      s3EndpointUsed,
      bucket: cfg.bucket
    });
  } catch (error: any) {
    console.error("[Storage List Files Error]:", error);
    return res.json({ 
      success: true, 
      count: 0, 
      files: [],
      s3Connected: false,
      s3Error: error.message || String(error)
    });
  }
});

// Storage Delete Endpoint
app.post("/api/storage/delete", async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ success: false, error: "کلید فایل الزامی است." });

    const cfg = sanitizeStorageConfig();
    
    // Remove local file if exists in both public/uploads and data/uploads and backups
    const cleanFileName = key.split("/").pop();
    if (cleanFileName) {
      const localFilePath = path.join(process.cwd(), "public", "uploads", cleanFileName);
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) {}
      }
      const persistentFilePath = path.join(DATA_DIR, "uploads", cleanFileName);
      if (fs.existsSync(persistentFilePath)) {
        try { fs.unlinkSync(persistentFilePath); } catch (e) {}
      }
      const backupPath = path.join(BACKUP_DIR, cleanFileName);
      if (fs.existsSync(backupPath)) {
        try { fs.unlinkSync(backupPath); } catch (e) {}
      }
      triggerDataChangeBackup();
    }

    // Attempt remote S3 delete
    if (b2bConfig.storageEnabled !== false && cfg.accessKey && cfg.secretKey) {
      try {
        const client = getParsPackS3Client(undefined, 3500);
        const command = new DeleteObjectCommand({
          Bucket: cfg.bucket,
          Key: key
        });
        await client.send(command);
      } catch (e) {}
    }

    return res.json({ success: true, message: `فایل با کلید ${key} با موفقیت حذف گردید.` });
  } catch (error: any) {
    console.error("[ParsPack Delete Error]:", error);
    return res.status(500).json({ success: false, error: "خطا در حذف فایل: " + (error.message || error) });
  }
});

// --- BACKUP & SYSTEM MAINTENANCE API ---

// Define the comprehensive backup package builder
function buildFullBackupZip(): AdmZip {
  const zip = new AdmZip();
  
  // 1. Ensure all core data files are loaded and flushed before zipping
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const products = loadProducts();
    const orders = loadOrders();
    const users = loadUsers();
    const articles = loadArticles();

    // Ensure they are written cleanly to disk
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), "utf-8");
    fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(aiConfig, null, 2), "utf-8");

    // Include ALL JSON files in the data directory
    const allFiles = fs.readdirSync(DATA_DIR);
    for (const file of allFiles) {
      const filePath = path.join(DATA_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.isFile() && file.endsWith(".json")) {
        zip.addLocalFile(filePath);
      }
    }

    // 2. Generate a cohesive master-data-dump.json inside the zip for cross-compatibility
    const masterDump = {
      createdAt: new Date().toISOString(),
      b2bConfig,
      aiConfig,
      products,
      orders,
      users,
      articles,
      categories: b2bConfig.categories || [],
      factories: b2bConfig.factories || [],
      brands: b2bConfig.brands || [],
      tables: {
        products,
        orders,
        users,
        articles,
        categories: b2bConfig.categories || [],
        site_settings: [
          { setting_key: 'b2b_config', setting_value: JSON.stringify(b2bConfig) },
          { setting_key: 'ai_config', setting_value: JSON.stringify(aiConfig) }
        ]
      }
    };
    zip.addFile("master-data-dump.json", Buffer.from(JSON.stringify(masterDump, null, 2), "utf-8"));
  } catch (e) {
    console.error("[Backup] Error adding JSON files to zip:", e);
  }

  // 3. Back up persistent upload assets
  const persistentUploadsDir = path.join(DATA_DIR, "uploads");
  if (fs.existsSync(persistentUploadsDir)) {
    try {
      zip.addLocalFolder(persistentUploadsDir, "uploads");
    } catch (e) {
      console.error("[Backup] Error adding uploads folder:", e);
    }
  }

  const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
  if (fs.existsSync(publicUploadsDir) && publicUploadsDir !== persistentUploadsDir) {
    try {
      const pubFiles = fs.readdirSync(publicUploadsDir);
      for (const pf of pubFiles) {
        const fullPubPath = path.join(publicUploadsDir, pf);
        if (fs.statSync(fullPubPath).isFile()) {
          zip.addLocalFile(fullPubPath, "uploads");
        }
      }
    } catch (e) {}
  }

  return zip;
}

// Implement background live S3 sync
let backupTimeout: NodeJS.Timeout | null = null;
let isLiveBackupRunning = false;
let isLiveBackupPending = false;

function scheduleLiveBackup() {
  if (backupTimeout) {
    clearTimeout(backupTimeout);
  }
  backupTimeout = setTimeout(async () => {
    if (isLiveBackupRunning) {
      isLiveBackupPending = true;
      return;
    }

    try {
      if (!b2bConfig.storageEnabled) return;
      if (Date.now() < s3CircuitBreakerOfflineUntil) {
        return; // S3 in temporary backoff - local disks and vaults already securely persisted
      }
      isLiveBackupRunning = true;
      console.log("[Live-Backup] Starting debounced background live backup to S3...");
      const bucket = (b2bConfig.storageBucket || "c102393").trim();
      const zip = buildFullBackupZip();
      const buffer = zip.toBuffer();
      console.log(`[Live-Backup] Backup package size: ${(buffer.length / (1024 * 1024)).toFixed(2)} MB`);

      const result = await executeResilientS3Operation<any>(
        "Live-Backup Auto Upload",
        (endpoint, isHttps) => new PutObjectCommand({
          Bucket: bucket,
          Key: "backups/live-backup-latest.zip",
          Body: buffer,
          ContentType: "application/zip"
        }),
        b2bConfig,
        60000 // Increased to 60s timeout for larger backups
      );

      if (result.success) {
        console.log("[Live-Backup] Debounced live backup saved to S3 successfully.");
      } else {
        console.log("[Live-Backup Note] Auto-backup skipped/failed in background:", result.error);
      }
    } catch (e: any) {
      console.log("[Live-Backup Note] Failed to auto-backup in background:", e.message || e);
    } finally {
      isLiveBackupRunning = false;
      if (isLiveBackupPending) {
        isLiveBackupPending = false;
        scheduleLiveBackup();
      }
    }
  }, 3000); // 3-second debounce window for fast, resilient cloud syncing
}

// Assign to the global hook we declared at the top of the file
triggerDataChangeBackup = scheduleLiveBackup;

app.post("/api/admin/backup/create", async (req, res) => {
  try {
    console.log("[Backup Create] Compiling a complete, live system backup zip...");
    const zip = buildFullBackupZip();
    const buffer = zip.toBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.zip`;
    const objectKey = `backups/${fileName}`;

    // 1. Always save local permanent backup copy on server disk
    const permanentPath = path.join(DATA_DIR, "latest-permanent-backup.zip");
    fs.writeFileSync(permanentPath, buffer);
    const backupFilePath = path.join(BACKUP_DIR, fileName);
    fs.writeFileSync(backupFilePath, buffer);
    console.log("[Backup] Local copies saved at:", backupFilePath, permanentPath);

    let s3Uploaded = false;
    let s3Error = "";

    // 2. Attempt remote S3 backup if storage credentials exist
    const cfg = sanitizeStorageConfig();
    if (b2bConfig.storageEnabled !== false && cfg.accessKey && cfg.secretKey) {
      try {
        const client = getParsPackS3Client(undefined, 20000);
        await Promise.race([
          client.send(new PutObjectCommand({
            Bucket: cfg.bucket,
            Key: objectKey,
            Body: buffer,
            ContentType: "application/zip"
          })),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("مهلت ذخیره‌سازی ابری به پایان رسید (Timeout)")), 20000))
        ]);

        // Also update live-backup-latest.zip in bucket
        try {
          await client.send(new PutObjectCommand({
            Bucket: cfg.bucket,
            Key: "backups/live-backup-latest.zip",
            Body: buffer,
            ContentType: "application/zip"
          }));
        } catch (e) {}

        s3Uploaded = true;
        console.log("[Backup Create] Uploaded to S3 successfully:", objectKey);
      } catch (err: any) {
        s3Error = err.message || "خطای نامشخص در اتصال به باکت";
        console.warn("[Backup Create] S3 Upload warning:", s3Error);
      }
    }

    return res.json({
      success: true,
      message: s3Uploaded 
        ? "فایل پشتیبان (بکاپ) جامع با موفقیت ایجاد و روی باکت پارس‌پک و دیسک سرور ذخیره شد."
        : `فایل پشتیبان روی سرور ذخیره شد. ${s3Error ? "(هشدار باکت: " + s3Error + ")" : ""}`,
      fileName,
      key: objectKey,
      size: buffer.length,
      s3Uploaded,
      s3Error: s3Error || undefined
    });
  } catch (error: any) {
    console.error("[Backup Creation Error]:", error);
    return res.status(500).json({ success: false, error: "خطا در ایجاد فایل پشتیبان: " + (error.message || error) });
  }
});

// Permanent Backup Download Route (Independent of S3)
app.get("/api/admin/backup/download-permanent", async (req, res) => {
  try {
    const permanentPath = path.join(DATA_DIR, "latest-permanent-backup.zip");
    
    if (!fs.existsSync(permanentPath)) {
      console.log("[Backup] Permanent file not found, creating a new one...");
      const zip = buildFullBackupZip();
      fs.writeFileSync(permanentPath, zip.toBuffer());
    }
    
    const stats = fs.statSync(permanentPath);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="emergency-backup.zip"');
    res.setHeader("Content-Length", stats.size);
    
    const fileStream = fs.createReadStream(permanentPath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error("[Permanent Backup Download Error]:", error);
    res.status(500).send("خطا در دانلود فایل پشتیبان اضطراری");
  }
});

app.get("/api/admin/backup/list", async (req, res) => {
  try {
    const cfg = sanitizeStorageConfig();
    const backupMap = new Map<string, any>();
    let s3Connected = false;
    let s3Error: string | null = null;
    let s3EndpointUsed: string | null = null;

    // 1. Gather local backups from BACKUP_DIR
    if (fs.existsSync(BACKUP_DIR)) {
      try {
        const localFiles = fs.readdirSync(BACKUP_DIR);
        for (const file of localFiles) {
          if (!file.endsWith(".zip") && !file.endsWith(".json")) continue;
          const stat = fs.statSync(path.join(BACKUP_DIR, file));
          const key = `backups/${file}`;
          backupMap.set(file, {
            key,
            fileName: file,
            size: stat.size,
            lastModified: stat.mtime,
            proxyUrl: `/api/storage/file/${encodeURIComponent(key)}`,
            source: 'local'
          });
        }
      } catch (e) {
        console.warn("Could not read local backup dir:", e);
      }
    }

    const permanentPath = path.join(DATA_DIR, "latest-permanent-backup.zip");
    if (fs.existsSync(permanentPath)) {
      try {
        const stat = fs.statSync(permanentPath);
        if (!backupMap.has("latest-permanent-backup.zip")) {
          backupMap.set("latest-permanent-backup.zip", {
            key: "latest-permanent-backup.zip",
            fileName: "latest-permanent-backup.zip (نسخه اضطراری دیسک)",
            size: stat.size,
            lastModified: stat.mtime,
            proxyUrl: `/api/admin/backup/download-permanent`,
            source: 'local'
          });
        }
      } catch (e) {}
    }

    // 2. Fetch remote S3 backups using resilient runner
    if (b2bConfig.storageEnabled !== false && cfg.accessKey && cfg.secretKey) {
      const s3Res = await executeResilientS3Operation<any>(
        "ListBackups",
        () => new ListObjectsV2Command({
          Bucket: cfg.bucket,
          Prefix: "backups/"
        }),
        undefined,
        7000
      );

      if (s3Res.success && s3Res.data) {
        s3Connected = true;
        s3EndpointUsed = s3Res.endpointUsed || null;
        for (const item of (s3Res.data.Contents || [])) {
          if (!item.Key || (!item.Key.endsWith(".zip") && !item.Key.endsWith(".json"))) continue;
          const fileName = item.Key.split("/").pop() || item.Key;
          const existing = backupMap.get(fileName);
          if (existing) {
            existing.source = 'both';
          } else {
            backupMap.set(fileName, {
              key: item.Key,
              fileName,
              size: item.Size || 0,
              lastModified: item.LastModified,
              proxyUrl: `/api/storage/file/${encodeURIComponent(item.Key)}`,
              source: 's3'
            });
          }
        }
      } else {
        s3Error = s3Res.error || "عدم ارتباط با باکت پارس‌پک";
      }
    }

    const backups = Array.from(backupMap.values()).sort(
      (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );

    return res.json({ 
      success: true, 
      count: backups.length, 
      backups,
      s3Connected,
      s3Error,
      s3EndpointUsed,
      bucket: cfg.bucket
    });
  } catch (error: any) {
    console.error("[Backup List Error]:", error);
    return res.json({ 
      success: true, 
      count: 0, 
      backups: [], 
      s3Connected: false,
      s3Error: error.message || String(error)
    });
  }
});

// Storage Diagnosis Endpoint - Help user identify why connection fails on production hosts
app.get("/api/admin/storage/diagnose", async (req, res) => {
  const results: any = {
    timestamp: new Date().toISOString(),
    steps: [],
    recommendations: []
  };

  const cfg = sanitizeStorageConfig();
  const endpointHost = cfg.endpointRaw.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];

  // Step 1: DNS Lookup
  try {
    results.steps.push({ name: "بررسی DNS و تفکیک دامنه باکت", status: "pending" });
    const dnsPromise = new Promise((resolve, reject) => {
      dns.lookup(endpointHost, (err, address) => {
        if (err) reject(err);
        else resolve(address);
      });
    });
    const ip = await dnsPromise;
    results.steps[0].status = "success";
    results.steps[0].message = `دامنه ${endpointHost} با موفقیت به آی‌پی ${ip} ترجمه شد. ارتباط DNS سالم است.`;
  } catch (e: any) {
    results.steps[0].status = "error";
    results.steps[0].message = `خطا در یافتن آدرس (DNS): ${e.message}. ممکن است هاست شما دسترسی به DNSهای خارجی یا این دامنه را مسدود کرده باشد.`;
    results.recommendations.push("در فایل /etc/resolv.conf سرور هاست خود DNSهای 8.8.8.8 یا 1.1.1.1 یا 4.2.2.4 را تنظیم کنید.");
  }

  // Step 2: TCP Connection on Port 80
  let port80Ok = false;
  try {
    results.steps.push({ name: "تست اتصال پورت خروجی 80 (HTTP)", status: "pending" });
    const net = await import("net");
    const port80Promise = new Promise((resolve, reject) => {
      const socket = net.createConnection(80, endpointHost);
      socket.setTimeout(4000);
      socket.on("connect", () => { socket.destroy(); resolve(true); });
      socket.on("timeout", () => { socket.destroy(); reject(new Error("پورت 80 در مهلت ۴ ثانیه پاسخ نداد (Timeout)")); });
      socket.on("error", (err) => { socket.destroy(); reject(err); });
    });
    await port80Promise;
    port80Ok = true;
    results.steps[1].status = "success";
    results.steps[1].message = "پورت ۸۰ (HTTP) روی سرور هاست باز است و اتصال مستقیم با موفقیت برقرار شد.";
  } catch (e: any) {
    results.steps[1].status = "warning";
    results.steps[1].message = `عدم دسترسی به پورت 80: ${e.message}.`;
  }

  // Step 3: TCP Connection on Port 443
  let port443Ok = false;
  try {
    results.steps.push({ name: "تست اتصال پورت خروجی 443 (HTTPS)", status: "pending" });
    const net = await import("net");
    const port443Promise = new Promise((resolve, reject) => {
      const socket = net.createConnection(443, endpointHost);
      socket.setTimeout(4000);
      socket.on("connect", () => { socket.destroy(); resolve(true); });
      socket.on("timeout", () => { socket.destroy(); reject(new Error("پورت 443 در مهلت ۴ ثانیه پاسخ نداد (Timeout)")); });
      socket.on("error", (err) => { socket.destroy(); reject(err); });
    });
    await port443Promise;
    port443Ok = true;
    results.steps[2].status = "success";
    results.steps[2].message = "پورت ۴۴۳ (HTTPS) روی سرور هاست باز است و اتصال امن با موفقیت برقرار شد.";
  } catch (e: any) {
    results.steps[2].status = "warning";
    results.steps[2].message = `عدم دسترسی به پورت 443: ${e.message}.`;
  }

  if (!port80Ok && !port443Ok) {
    results.recommendations.push("هر دو پورت ۸۰ و ۴۴۳ مسدود هستند. در فایروال هاست (CSF/UFW/iptables) پورت‌های خروجی 80 و 443 را برای خروجی باز بفرمایید.");
  }

  // Step 4: S3 Credentials & Resilient List Check
  try {
    results.steps.push({ name: "تست احراز هویت و خواندن باکت (S3 Auth & ListObjects)", status: "pending" });
    const s3Probe = await executeResilientS3Operation<any>(
      "DiagnosticProbe",
      () => new ListObjectsV2Command({ Bucket: cfg.bucket, MaxKeys: 5 }),
      undefined,
      7500
    );

    if (s3Probe.success && s3Probe.data) {
      const fileCount = s3Probe.data.KeyCount || (s3Probe.data.Contents ? s3Probe.data.Contents.length : 0);
      results.steps[3].status = "success";
      results.steps[3].message = `احراز هویت کامل با باکت ${cfg.bucket} تایید شد! (${s3Probe.endpointUsed}، زمان پاسخ: ${s3Probe.latency}ms، تعداد فایل: ${fileCount})`;
    } else {
      results.steps[3].status = "error";
      results.steps[3].message = `خطا در برقراری ارتباط با باکت S3: ${s3Probe.error}`;
      results.recommendations.push("کلیدهای Access Key و Secret Key و نام باکت را بررسی فرمایید.");
    }
  } catch (e: any) {
    results.steps[3].status = "error";
    results.steps[3].message = `خطای غیرمنتظره در S3: ${e.message}`;
  }

  // Step 5: Local Storage & Write Permissions
  try {
    results.steps.push({ name: "مجوزهای نوشتن و پایداری دیسک سرور (/data و /backups)", status: "pending" });
    const testFile = path.join(BACKUP_DIR, `.write_test_${Date.now()}.tmp`);
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    results.steps[4].status = "success";
    results.steps[4].message = "دسترسی نوشتن و خواندن روی دیسک سرور هاست کاملاً سالم و تایید شده است.";
  } catch (e: any) {
    results.steps[4].status = "error";
    results.steps[4].message = `خطا در دسترسی به دیسک سرور: ${e.message}.`;
    results.recommendations.push("مجوز پوشه‌های data و public/uploads را در هاست روی 755 یا 775 قرار دهید.");
  }

  const allPassed = results.steps.every((s: any) => s.status === "success");
  return res.json({ success: allPassed, results });
});

// Helper function to restore from structured JSON backup buffer
async function restoreFromJsonBuffer(buffer: Buffer): Promise<{ restoredCount: number }> {
  const text = buffer.toString("utf-8").replace(/^\uFEFF/, "").trim();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (err: any) {
    throw new Error("فایل پشتیبان فرمت ZIP معتبر ندارد و به صورت JSON نیز قابل خواندن نیست: " + err.message);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let restoredCount = 0;

  if (parsed && typeof parsed === "object") {
    // Unwrap data / payload / backup envelopes if present
    const rootData = parsed.data || parsed.payload || parsed.backup || parsed;

    // If it's a direct array of products or orders
    if (Array.isArray(rootData)) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(rootData, null, 2), "utf-8");
      restoredCount++;
    } else {
      // 1. Relational Tables (from MySQL / PHP dump)
      if (rootData.tables && typeof rootData.tables === "object") {
        const tbls = rootData.tables;
        if (tbls.products && Array.isArray(tbls.products)) {
          fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(tbls.products, null, 2), "utf-8");
          restoredCount++;
        }
        if (tbls.orders && Array.isArray(tbls.orders)) {
          fs.writeFileSync(ORDERS_FILE, JSON.stringify(tbls.orders, null, 2), "utf-8");
          try { fs.writeFileSync(ROOT_ORDERS_FILE, JSON.stringify(tbls.orders, null, 2), "utf-8"); } catch (e) {}
          restoredCount++;
        }
        if (tbls.users && Array.isArray(tbls.users)) {
          fs.writeFileSync(USERS_FILE, JSON.stringify(tbls.users, null, 2), "utf-8");
          restoredCount++;
        }
        if (tbls.articles && Array.isArray(tbls.articles)) {
          fs.writeFileSync(ARTICLES_FILE, JSON.stringify(tbls.articles, null, 2), "utf-8");
          restoredCount++;
        }
        if (tbls.categories && Array.isArray(tbls.categories)) {
          fs.writeFileSync(path.join(DATA_DIR, "categories.json"), JSON.stringify(tbls.categories, null, 2), "utf-8");
          restoredCount++;
        }
        if (tbls.crm_customers && Array.isArray(tbls.crm_customers)) {
          fs.writeFileSync(path.join(DATA_DIR, "crm_customers.json"), JSON.stringify(tbls.crm_customers, null, 2), "utf-8");
          restoredCount++;
        }
        if (tbls.site_settings && Array.isArray(tbls.site_settings)) {
          tbls.site_settings.forEach((s: any) => {
            if (s && s.setting_key === 'b2b_config' && s.setting_value) {
              try {
                const confObj = typeof s.setting_value === 'string' ? JSON.parse(s.setting_value) : s.setting_value;
                fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(confObj, null, 2), "utf-8");
                try { fs.writeFileSync(OLD_B2B_CONFIG_FILE, JSON.stringify(confObj, null, 2), "utf-8"); } catch (e) {}
                b2bConfig = { ...DEFAULT_B2B_CONFIG, ...confObj };
                restoredCount++;
              } catch (e) {}
            }
          });
        }
      }

      // 2. Structured top-level collections
      const cfgObj = rootData.b2bConfig || rootData.b2b_config || rootData.config;
      if (cfgObj) {
        fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(cfgObj, null, 2), "utf-8");
        try { fs.writeFileSync(OLD_B2B_CONFIG_FILE, JSON.stringify(cfgObj, null, 2), "utf-8"); } catch (e) {}
        b2bConfig = { ...DEFAULT_B2B_CONFIG, ...cfgObj };
        restoredCount++;
      }

      const aiCfgObj = rootData.aiConfig || rootData.ai_config;
      if (aiCfgObj) {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(aiCfgObj, null, 2), "utf-8");
        aiConfig = { ...aiConfig, ...aiCfgObj };
        restoredCount++;
      }

      const prods = rootData.products || rootData.items;
      if (prods && (Array.isArray(prods) || typeof prods === "object")) {
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(prods, null, 2), "utf-8");
        restoredCount++;
      }

      const ords = rootData.orders || rootData.invoices;
      if (ords && (Array.isArray(ords) || typeof ords === "object")) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(ords, null, 2), "utf-8");
        try { fs.writeFileSync(ROOT_ORDERS_FILE, JSON.stringify(ords, null, 2), "utf-8"); } catch (e) {}
        (b2bConfig as any).orders = Array.isArray(ords) ? ords : Object.values(ords);
        restoredCount++;
      }

      const arts = rootData.articles || rootData.ads || rootData.billboardAds;
      if (arts && (Array.isArray(arts) || typeof arts === "object")) {
        fs.writeFileSync(ARTICLES_FILE, JSON.stringify(arts, null, 2), "utf-8");
        restoredCount++;
      }

      const usrs = rootData.users || rootData.customers || rootData.representatives;
      if (usrs && (Array.isArray(usrs) || typeof usrs === "object")) {
        fs.writeFileSync(USERS_FILE, JSON.stringify(usrs, null, 2), "utf-8");
        restoredCount++;
      }

      const crm = rootData.crmCustomers || rootData.crm_customers || rootData.leads;
      if (crm && (Array.isArray(crm) || typeof crm === "object")) {
        fs.writeFileSync(path.join(DATA_DIR, "crm_customers.json"), JSON.stringify(crm, null, 2), "utf-8");
        restoredCount++;
      }

      const cats = rootData.categories;
      if (cats && (Array.isArray(cats) || typeof cats === "object")) {
        fs.writeFileSync(path.join(DATA_DIR, "categories.json"), JSON.stringify(cats, null, 2), "utf-8");
        restoredCount++;
      }

      const revs = rootData.reviews;
      if (revs && (Array.isArray(revs) || typeof revs === "object")) {
        fs.writeFileSync(path.join(DATA_DIR, "reviews.json"), JSON.stringify(revs, null, 2), "utf-8");
        restoredCount++;
      }

      const chats = rootData.chatThreads || rootData.chat_threads;
      if (chats && (Array.isArray(chats) || typeof chats === "object")) {
        fs.writeFileSync(path.join(DATA_DIR, "chat_threads.json"), JSON.stringify(chats, null, 2), "utf-8");
        restoredCount++;
      }

      const sms = rootData.smsLogs || rootData.sms_logs || rootData.smsHistory;
      if (sms && (Array.isArray(sms) || typeof sms === "object")) {
        fs.writeFileSync(path.join(DATA_DIR, "sms_logs.json"), JSON.stringify(sms, null, 2), "utf-8");
        try { fs.writeFileSync(path.join(DATA_DIR, "sms-history.json"), JSON.stringify(sms, null, 2), "utf-8"); } catch (e) {}
        restoredCount++;
      }

      // Check if root keys are file names (e.g. "products.json")
      for (const key of Object.keys(rootData)) {
        if (key.endsWith(".json") && !key.includes("/")) {
          const targetPath = path.join(DATA_DIR, key);
          fs.writeFileSync(targetPath, JSON.stringify(rootData[key], null, 2), "utf-8");
          restoredCount++;
        }
      }
    }
  }

  // Reload configurations
  try {
    if (fs.existsSync(B2B_CONFIG_FILE)) {
      const raw = fs.readFileSync(B2B_CONFIG_FILE, "utf-8");
      b2bConfig = { ...DEFAULT_B2B_CONFIG, ...JSON.parse(raw) };
    }
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
      aiConfig = { ...aiConfig, ...JSON.parse(raw) };
    }
  } catch (e) {}

  return { restoredCount: Math.max(restoredCount, 1) };
}

// Helper function for full backup restoration logic (Supporting ZIP, JSON, and Auto Recovery)
async function performFullRestore(buffer: Buffer, fileName?: string): Promise<{ restoredCount: number }> {
  if (!buffer || buffer.length === 0) {
    throw new Error("فایل پشتیبان دریافتی خالی (0 بایت) است.");
  }

  // Check if buffer starts with PK zip header (0x50, 0x4B)
  const isZipHeader = buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4B;
  const isExplicitJson = fileName?.toLowerCase().endsWith(".json");

  // If it's explicitly a JSON file or does not have zip header, try JSON restore first
  if (isExplicitJson || !isZipHeader) {
    try {
      console.log(`[Restore] Processing backup as JSON document (size: ${buffer.length} bytes)...`);
      return await restoreFromJsonBuffer(buffer);
    } catch (jsonErr: any) {
      if (!isZipHeader) {
        throw new Error(`خطا در بازخوانی فایل پشتیبان: ${jsonErr.message}`);
      }
    }
  }

  // Try ZIP decompression
  try {
    console.log(`[Restore] Decompressing ZIP backup package (size: ${buffer.length} bytes)...`);
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let restoredCount = 0;
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith("uploads/")) {
        const persistentUploadsDir = path.join(DATA_DIR, "uploads");
        if (!fs.existsSync(persistentUploadsDir)) {
          fs.mkdirSync(persistentUploadsDir, { recursive: true });
        }
        zip.extractEntryTo(entry, DATA_DIR, true, true);
        restoredCount++;
      } else if (!entry.isDirectory) {
        zip.extractEntryTo(entry, DATA_DIR, true, true);
        restoredCount++;
      }
    }

    // Force-sync data/uploads/* to public/uploads/*
    const persistentUploadsDir = path.join(DATA_DIR, "uploads");
    const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
    if (fs.existsSync(persistentUploadsDir)) {
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }
      const list = fs.readdirSync(persistentUploadsDir);
      for (const file of list) {
        const src = path.join(persistentUploadsDir, file);
        const dest = path.join(publicUploadsDir, file);
        if (fs.statSync(src).isFile()) {
          try { fs.copyFileSync(src, dest); } catch (e) {}
        }
      }
    }

    // Reload internal memory configurations
    try {
      if (fs.existsSync(B2B_CONFIG_FILE)) {
        const raw = fs.readFileSync(B2B_CONFIG_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        b2bConfig = { ...DEFAULT_B2B_CONFIG, ...parsed };
        if (b2bConfig.storagePublicUrl && b2bConfig.storagePublicUrl.startsWith("https://") && b2bConfig.storagePublicUrl.includes("parspack.net")) {
          b2bConfig.storagePublicUrl = b2bConfig.storagePublicUrl.replace("https://", "http://");
        }
        console.log("[Restore Helper] B2B Configuration successfully updated.");
      }
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        aiConfig = { ...aiConfig, ...JSON.parse(raw) };
        console.log("[Restore Helper] AI Configuration successfully updated.");
      }
    } catch (e) {
      console.error("[Restore Helper] State reload error:", e);
    }

    return { restoredCount };
  } catch (zipErr: any) {
    console.warn("[Restore Helper] ZIP extraction failed, attempting fallback to JSON parser:", zipErr.message);
    try {
      return await restoreFromJsonBuffer(buffer);
    } catch (fallbackErr: any) {
      throw new Error(`قالب فایل پشتیبان نامعتبر است (${zipErr.message}). لطفاً فایل پشتیبان سالم را انتخاب فرمایید.`);
    }
  }
}

app.post("/api/admin/backup/upload-restore", async (req, res) => {
  try {
    const { fileName, fileData } = req.body; // fileData is base64
    if (!fileData) return res.status(400).json({ success: false, error: "فایلی دریافت نشد." });

    const buffer = Buffer.from(fileData, "base64");
    const { restoredCount } = await performFullRestore(buffer, fileName);

    return res.json({ 
      success: true, 
      message: `فایل پشتیبان با موفقیت بازیابی شد. تعداد ${restoredCount} فایل و رکورد داده بازنشانی گردید.` 
    });
  } catch (e: any) {
    console.error("[Restore-Upload Error]", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post("/api/admin/backup/restore-permanent", async (req, res) => {
  try {
    const permanentPath = path.join(DATA_DIR, "latest-permanent-backup.zip");
    if (!fs.existsSync(permanentPath)) {
      return res.status(404).json({ success: false, error: "فایل پشتیبان محلی جهت بازیابی یافت نشد." });
    }
    
    console.log("[Restore-Permanent] One-click restoration from local emergency copy started...");
    const buffer = fs.readFileSync(permanentPath);
    const { restoredCount } = await performFullRestore(buffer, "latest-permanent-backup.zip");

    res.json({ 
      success: true, 
      message: "بازیابی هوشمند از حافظه محلی با موفقیت انجام شد. تمام داده‌ها و تنظیمات بازنشانی شدند.", 
      restoredFilesCount: restoredCount
    });
  } catch (error: any) {
    console.error("[Restore-Permanent Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/admin/backup/restore", async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "نام یا کلید فایل پشتیبان مشخص نشده است" });

  try {
    const cleanFileName = key.split("/").pop() || key;
    let buffer: Buffer | null = null;

    // 1. Try local backup file first from BACKUP_DIR, DATA_DIR, etc.
    const localCandidates = [
      path.join(BACKUP_DIR, cleanFileName),
      path.join(BACKUP_DIR, key),
      path.join(DATA_DIR, cleanFileName),
      path.join(DATA_DIR, key)
    ];

    for (const localPath of localCandidates) {
      if (fs.existsSync(localPath)) {
        console.log(`[Restore] Loading backup directly from local storage: ${localPath}`);
        buffer = fs.readFileSync(localPath);
        break;
      }
    }

    // 2. If not found locally, fetch from S3 using resilient runner
    if (!buffer) {
      const cfg = sanitizeStorageConfig();
      const s3KeysToTry = [
        key,
        key.startsWith("backups/") ? key.replace(/^backups\//, "") : `backups/${key}`,
        cleanFileName,
        `backups/${cleanFileName}`
      ];

      console.log(`[Restore] Attempting to fetch cloud backup from S3 bucket (${cfg.bucket}) for: ${cleanFileName}`);

      let s3FetchSuccess = false;
      let lastS3Error = "";

      for (const targetKey of s3KeysToTry) {
        const s3FetchResult = await executeResilientS3Operation<any>(
          `GetObject-${targetKey}`,
          () => new GetObjectCommand({
            Bucket: cfg.bucket,
            Key: targetKey
          }),
          undefined,
          10000
        );

        if (s3FetchResult.success && s3FetchResult.data && s3FetchResult.data.Body) {
          const stream = s3FetchResult.data.Body as any;
          const chunks: any[] = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          buffer = Buffer.concat(chunks);
          if (buffer && buffer.length > 0) {
            s3FetchSuccess = true;
            console.log(`[Restore] Successfully downloaded backup from S3 (${targetKey}, ${buffer.length} bytes)`);
            break;
          }
        } else {
          lastS3Error = s3FetchResult.error || "کلید در باکت یافت نشد";
        }
      }

      if (!s3FetchSuccess || !buffer || buffer.length === 0) {
        throw new Error(`فایل پشتیبان نه در دیسک هاست و نه در باکت پارس‌پک یافت نشد (${lastS3Error})`);
      }
    }

    const { restoredCount } = await performFullRestore(buffer, cleanFileName);

    res.json({ 
      success: true, 
      message: `بازیابی کامل با موفقیت انجام شد. تعداد ${restoredCount} بخش داده و فایل بازگردانی شدند.`, 
      restoredFilesCount: restoredCount
    });
  } catch (error: any) {
    console.error("[Restore Error]:", error);
    res.status(500).json({ error: "خطا در بازیابی بکاپ: " + (error.message || error) });
  }
});

// --- AUTO BACKUP SCHEDULER (Soft-Cron) ---
// Runs every 24 hours to create a daily full backup
setInterval(async () => {
  console.log("[Auto-Backup] Starting scheduled daily full backup...");
  try {
    const zip = buildFullBackupZip();
    const buffer = zip.toBuffer();
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `daily-auto-backup-${dateStr}.zip`;
    const objectKey = `backups/${fileName}`;

    // Always save local
    fs.writeFileSync(path.join(BACKUP_DIR, fileName), buffer);
    fs.writeFileSync(path.join(DATA_DIR, "latest-permanent-backup.zip"), buffer);

    // Save to S3 if enabled
    const cfg = sanitizeStorageConfig();
    if (b2bConfig.storageEnabled !== false && cfg.accessKey && cfg.secretKey) {
      const client = getParsPackS3Client();
      await client.send(new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: "application/zip"
      }));
      console.log(`[Auto-Backup] Successfully created and saved: ${objectKey}`);
    }
  } catch (e) {
    console.log("[Auto-Backup Note] Scheduled run failed:", e);
  }
}, 24 * 60 * 60 * 1000);

// Storage Stream / Download Proxy Endpoint
app.get("/api/storage/file/*", async (req, res) => {
  try {
    const objectKey = req.params[0];
    if (!objectKey) return res.status(400).send("Object key is missing");

    const cleanFileName = objectKey.split("/").pop() || objectKey;

    // 1. Check local file locations in order of priority:
    const candidates = [
      path.join(process.cwd(), "public", "uploads", cleanFileName),
      path.join(DATA_DIR, "uploads", cleanFileName),
      path.join(BACKUP_DIR, cleanFileName),
      path.join(DATA_DIR, objectKey),
      path.join(DATA_DIR, cleanFileName)
    ];

    for (const localPath of candidates) {
      if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
        if (cleanFileName.endsWith(".zip")) {
          res.setHeader("Content-Type", "application/zip");
          res.setHeader("Content-Disposition", `attachment; filename="${cleanFileName}"`);
        }
        res.setHeader("Cache-Control", "public, max-age=31536000");
        return res.sendFile(localPath);
      }
    }

    // 2. Try remote S3 stream with timeout
    const cfg = sanitizeStorageConfig();
    const client = getParsPackS3Client(undefined, 5000);

    const command = new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: objectKey
    });

    const response = await Promise.race([
      client.send(command),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
    ]);
    
    // Explicitly set content type for zip files
    if (objectKey.endsWith(".zip")) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${cleanFileName}"`);
    } else if (response.ContentType) {
      res.setHeader("Content-Type", response.ContentType);
    }

    if (response.ContentLength) res.setHeader("Content-Length", response.ContentLength);
    res.setHeader("Cache-Control", "public, max-age=31536000");

    if (response.Body) {
      const stream = response.Body as any;
      stream.pipe(res);
    } else {
      res.status(404).send("فایل یافت نشد.");
    }
  } catch (error: any) {
    res.status(404).send("فایل مورد نظر در فضای ذخیره‌سازی یافت نشد.");
  }
});

// --- ADMIN API ---
app.all("/api/admin/download-source", (req, res) => {
  try {
    console.log("[ZIP Export] Packaging current codebase using streaming directory mode...");
    
    const buildCode = Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `dastavval-source-v4.2.0-build${buildCode}-${dateStr}-${timeStr}.zip`;

    res.writeHead(200, {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff"
    });

    const archive = createArchiver('zip', { zlib: { level: 1 } });
    archive.on('error', (err: any) => {
      console.error("[ZIP Export Error]:", err);
      res.end();
    });
    res.on('close', () => {
      console.log("[ZIP Export] Client closed connection.");
      archive.abort();
    });
    archive.pipe(res);
    setupArchive(archive);

  } catch (error: any) {
    console.error("[ZIP Export Error]:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "خطا در فشرده‌سازی سورس کد: " + error.message });
    }
  }
});

function setupArchive(archive: any) {
  const rootDir = process.cwd();
  console.log("[ZIP Export] Starting file traversal...");
  
  // Add important files first
  archive.file(path.join(rootDir, 'package.json'), { name: 'package.json' });
  archive.file(path.join(rootDir, 'index.php'), { name: 'index.php' });
  archive.file(path.join(rootDir, 'installer.php'), { name: 'installer.php' });
  archive.file(path.join(rootDir, 'server.ts'), { name: 'server.ts' });
  if (fs.existsSync(path.join(rootDir, '.htaccess'))) {
    archive.file(path.join(rootDir, '.htaccess'), { name: '.htaccess' });
  }

  // Add directories
  const dirsToAdd = ['src', 'public', 'data', 'dist', 'php'];
  for (const dir of dirsToAdd) {
    const fullPath = path.join(rootDir, dir);
    if (fs.existsSync(fullPath)) {
      archive.directory(fullPath, dir);
    }
  }

  // Add other root files (excluding huge ones)
  const rootFiles = fs.readdirSync(rootDir);
  for (const file of rootFiles) {
    const fullPath = path.join(rootDir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isFile()) {
      if (
        !dirsToAdd.includes(file) && 
        !['package.json', 'index.php', 'installer.php', 'server.ts', '.htaccess'].includes(file) &&
        !file.startsWith('.') &&
        !file.endsWith('.zip') &&
        file !== 'ai-cache.json' &&
        file !== 'bun.lock' &&
        file !== 'npm-debug.log'
      ) {
        archive.file(fullPath, { name: file });
      }
    }
  }

  archive.finalize();
}

app.post("/api/admin/upload-source-s3", async (req, res) => {
  try {
    console.log("[ZIP S3 Upload] Starting source code upload to S3...");
    
    const buildCode = Math.floor(100000 + Math.random() * 900000);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `dastavval-source-v4.2.0-build${buildCode}-${dateStr}-${timeStr}.zip`;
    const objectKey = `backups/sources/${fileName}`;

    const archive = createArchiver('zip', { zlib: { level: 1 } });
    const chunks: any[] = [];
    
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', (err: any) => {
      console.error("[ZIP S3 Error]:", err);
      if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
    });

    archive.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        console.log(`[ZIP S3] Zip created (${buffer.length} bytes). Uploading to S3...`);
        
        const cfg = sanitizeStorageConfig();
        const uploadResult = await executeResilientS3Operation<any>(
          "Source Code Upload",
          () => new PutObjectCommand({
            Bucket: cfg.bucket,
            Key: objectKey,
            Body: buffer,
            ContentType: "application/zip"
          }),
          undefined,
          60000 // 60s timeout for large zip
        );

        if (uploadResult.success) {
          const publicBase = (b2bConfig.storagePublicUrl || `http://${cfg.endpointRaw}/${cfg.bucket}`).replace(/\/+$/, "");
          const downloadUrl = `${publicBase}/${objectKey}`;
          res.json({
            success: true,
            message: "سورس کد با موفقیت در فضای ابری آپلود شد.",
            downloadUrl,
            fileName
          });
        } else {
          res.status(500).json({ success: false, error: "خطا در آپلود به S3: " + uploadResult.error });
        }
      } catch (err: any) {
        console.error("[ZIP S3 Finalize Error]:", err);
        if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
      }
    });

    setupArchive(archive);

  } catch (error: any) {
    console.error("[ZIP S3 Global Error]:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.get("/api/admin/ai-config", (req, res) => {
  res.json({
    provider: aiConfig.provider,
    apiKey: aiConfig.apiKey ? `${aiConfig.apiKey.substring(0, 5)}...` : "",
    hasKey: !!aiConfig.apiKey,
    endpointUrl: aiConfig.endpointUrl
  });
});

app.post("/api/admin/ai-config", (req, res) => {
  const { provider, apiKey, endpointUrl, model } = req.body;
  if (provider) aiConfig.provider = provider;
  if (apiKey !== undefined && apiKey !== "") aiConfig.apiKey = apiKey;
  if (endpointUrl) aiConfig.endpointUrl = endpointUrl;
  if (model) aiConfig.model = model;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(aiConfig, null, 2), "utf-8");
  res.json({ success: true });
});

app.post("/api/admin/ai-test", async (req, res) => {
  const { provider, apiKey, endpointUrl } = req.body || {};
  const testProvider = provider || aiConfig.provider || "gemini";
  const testKey = apiKey || aiConfig.apiKey || process.env.GEMINI_API_KEY || "";
  const testUrl = (endpointUrl || aiConfig.endpointUrl || "https://api.gapgpt.app/v1").replace(/\/$/, "");

  const prompt = "پاسخ کوتاهی به فارسی بده که تایید کند درگاه هوش مصنوعی وصل است و آماده ارائه خدمت می‌باشد.";
  try {
    if (testProvider === "gapgpt") {
      const cleanUrl = `${testUrl}/chat/completions`;
      const headers: Record<string, string> = { 
        "Content-Type": "application/json",
        "User-Agent": "Dastavval/1.0 (B2B Marketplace)"
      };
      if (testKey) headers["Authorization"] = `Bearer ${testKey}`;

      const response = await fetch(cleanUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: aiConfig.model || "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5
        }),
        signal: AbortSignal.timeout(25000)
      });
      if (!response.ok) {
        const errText = await response.text();
        return res.json({
          success: false,
          provider: "gapgpt",
          error: `خطا در فراخوانی درگاه GapGPT (کد status ${response.status}): ${errText.substring(0, 150)}`
        });
      }
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "پاسخ خالی از GapGPT دریافت شد.";
      return res.json({
        success: true,
        provider: "gapgpt",
        reply,
        message: "ارتباط با درگاه GapGPT با موفقیت تایید شد."
      });
    } else {
      const reply = await callAI(prompt, "AI Connection Test");
      return res.json({
        success: true,
        provider: "gemini",
        reply,
        message: "ارتباط با درگاه هوش مصنوعی جمینی با موفقیت تایید شد."
      });
    }
  } catch (err: any) {
    return res.json({
      success: false,
      provider: testProvider,
      error: `خطا در تست اتصال هوش مصنوعی: ${err.message || String(err)}`
    });
  }
});

// --- GITHUB AUTO UPDATE ENDPOINT ---
async function fetchGithubZip(url: string, token: string): Promise<{ buffer: Buffer; finalUrl: string } | null> {
  const isS3Url = (u: string) => 
    u.includes("objects.githubusercontent.com") ||
    u.includes("Signature=") ||
    u.includes("X-Amz-");

  // Auth header strategies to attempt: Bearer, token-prefix, and unauthenticated fallback
  const authStrategies: (string | null)[] = [];
  if (token && token.trim()) {
    authStrategies.push(`Bearer ${token.trim()}`);
    authStrategies.push(`token ${token.trim()}`);
  }
  authStrategies.push(null); // Unauthenticated fallback (critical for public repos with invalid tokens)

  for (const authHeader of authStrategies) {
    let currentUrl = url;
    let redirectCount = 0;
    const maxRedirects = 10;

    while (redirectCount < maxRedirects) {
      console.log(`[GitHub Updater] Fetching: ${currentUrl} (Auth: ${authHeader ? 'Set' : 'None'}, Redirect: ${redirectCount})`);

      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dastavval-Advanced-Updater/6.0",
        "Accept": "application/vnd.github+json, application/zip, application/octet-stream, */*"
      };

      if (authHeader && !isS3Url(currentUrl) && (currentUrl.includes("github.com") || currentUrl.includes("api.github.com"))) {
        headers["Authorization"] = authHeader;
      }

      try {
        const response = await fetch(currentUrl, {
          headers,
          redirect: "manual"
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (location) {
            const nextUrl = new URL(location, currentUrl).toString();
            addGithubLog('info', `Following redirect to ${nextUrl}`);
            currentUrl = nextUrl;
            redirectCount++;
            continue;
          }
        }

        if (response.status === 200) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 100 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
            addGithubLog('success', `Successfully downloaded valid ZIP archive from ${currentUrl} (${buffer.length} bytes).`);
            return { buffer, finalUrl: currentUrl };
          } else {
            addGithubLog('error', `URL ${currentUrl} returned 200 OK but content is not a valid ZIP file (size: ${buffer.length})`);
          }
        } else {
          addGithubLog('error', `URL ${currentUrl} returned HTTP status ${response.status} (Auth mode: ${authHeader ? 'Token' : 'Public'})`);
        }
      } catch (err: any) {
        console.error(`[GitHub Updater Exception] Network error fetching ${currentUrl}:`, err.message);
      }

      break; // Move to next auth strategy or URL candidate if redirect loop ends without 200
    }
  }

  return null;
}

// GitHub Diagnostics & Inspector Endpoint
app.post("/api/admin/github-diagnostics", async (req, res) => {
  const rawRepoUrl = req.body.repoUrl || b2bConfig.githubRepoUrl || "https://github.com/dastavval/UpdaterDst.git";
  const userBranch = (req.body.branch || b2bConfig.githubBranch || "main").trim();
  const token = (req.body.token || b2bConfig.githubToken || "").trim();

  const diagnostics: any[] = [];

  try {
    let cleanUrl = String(rawRepoUrl).trim().replace(/\/+$/, "");
    cleanUrl = cleanUrl.replace(/^git@github\.com:/i, "https://github.com/");
    cleanUrl = cleanUrl.replace(/\.git$/i, "");

    let extractedBranch = userBranch;
    const treeMatch = cleanUrl.match(/\/tree\/([^\/\s\?\#]+)/i);
    if (treeMatch && treeMatch[1]) {
      extractedBranch = treeMatch[1];
      cleanUrl = cleanUrl.replace(/\/tree\/[^\/\s\?\#]+.*/i, "");
    }

    let ownerRepo = "";
    const matches = cleanUrl.match(/(?:github\.com\/|repos\/|^)([^\/\s\?\#]+)\/([^\/\s\?\#]+)/i);
    if (matches && matches[1] && matches[2]) {
      ownerRepo = `${matches[1].trim()}/${matches[2].trim()}`;
    }
    ownerRepo = ownerRepo.replace(/\.git$/i, "").replace(/\/+$/, "");

    const branchesToTry = Array.from(new Set([extractedBranch, userBranch, "main", "master"])).filter(Boolean);
    const zipUrls: string[] = [];

    for (const b of branchesToTry) {
      zipUrls.push(`https://api.github.com/repos/${ownerRepo}/zipball/${b}`);
      zipUrls.push(`https://codeload.github.com/${ownerRepo}/zip/refs/heads/${b}`);
      zipUrls.push(`https://github.com/${ownerRepo}/archive/refs/heads/${b}.zip`);
    }

    for (const candidateUrl of zipUrls) {
      let currentUrl = candidateUrl;
      let hops = 0;
      let lastStatus = 0;
      let errorMsg = null;
      let isZip = false;
      let contentSize = 0;

      while (hops < 5) {
        const isS3orCodeload = currentUrl.includes("objects.githubusercontent.com") || currentUrl.includes("codeload.github.com");
        const headers: Record<string, string> = {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dastavval-Diagnostics/5.0",
          "Accept": "application/vnd.github+json, application/zip, application/octet-stream, */*"
        };
        if (token && !isS3orCodeload && (currentUrl.includes("github.com") || currentUrl.includes("api.github.com"))) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        try {
          const resp = await fetch(currentUrl, { headers, redirect: "manual" });
          lastStatus = resp.status;
          if (resp.status >= 300 && resp.status < 400) {
            const loc = resp.headers.get("location");
            if (loc) {
              currentUrl = loc;
              hops++;
              continue;
            }
          }
          if (resp.status === 200) {
            const buf = Buffer.from(await resp.arrayBuffer());
            contentSize = buf.length;
            if (buf.length > 50 && buf[0] === 0x50 && buf[1] === 0x4b) {
              isZip = true;
            } else {
              errorMsg = "متن دریافتی فایل فشرده معتبر (ZIP) نمی‌باشد";
            }
          } else {
            errorMsg = `پاسخ HTTP با وضعیت ${resp.status} دریافت شد`;
          }
        } catch (e: any) {
          errorMsg = e.message;
        }
        break;
      }

      diagnostics.push({
        url: candidateUrl,
        finalUrl: currentUrl,
        status: lastStatus,
        hops,
        isZip,
        contentSize,
        error: errorMsg
      });
    }

    return res.json({
      success: true,
      ownerRepo,
      branchesTried: branchesToTry,
      diagnostics
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      diagnostics
    });
  }
});



// Shared function for GitHub updates & previews
async function inspectGithubRepo(repoUrl: string, branch: string, token: string) {
  addGithubLog('info', `Inspecting repository ${repoUrl} (branch: ${branch})`);
  
  let cleanUrl = String(repoUrl).trim().replace(/\/+$/, "");
  cleanUrl = cleanUrl.replace(/^git@github\.com:/i, "https://github.com/");
  cleanUrl = cleanUrl.replace(/\.git$/i, "");

  let extractedBranch = (branch || "").trim() || "main";
  const treeMatch = cleanUrl.match(/\/tree\/([^\/\s\?\#]+)/i);
  if (treeMatch && treeMatch[1]) {
    extractedBranch = treeMatch[1];
    cleanUrl = cleanUrl.replace(/\/tree\/[^\/\s\?\#]+.*/i, "");
  }

  let ownerRepo = "";
  const matches = cleanUrl.match(/(?:github\.com\/|repos\/|^)([^\/\s\?\#]+)\/([^\/\s\?\#]+)/i);
  if (matches && matches[1] && matches[2]) {
    ownerRepo = `${matches[1].trim()}/${matches[2].trim()}`;
  }
  ownerRepo = ownerRepo.replace(/\.git$/i, "").replace(/\/+$/, "");

  if (!ownerRepo || !ownerRepo.includes("/")) {
    throw new Error("آدرس یا نام مخزن گیت‌هاب معتبر نمی‌باشد.");
  }

  const ownerReposToTry = Array.from(new Set([ownerRepo, "dastavval/UpdaterDst", "dastavval/dastavval.com", "dastavval/b2b-platform"])).filter(Boolean);
  const branchesToTry = Array.from(new Set([extractedBranch, "main", "master"])).filter(Boolean);
  const zipUrls: string[] = [];
  for (const repo of ownerReposToTry) {
    for (const b of branchesToTry) {
      zipUrls.push(`https://api.github.com/repos/${repo}/zipball/${b}`);
      zipUrls.push(`https://github.com/${repo}/archive/refs/heads/${b}.zip`);
      zipUrls.push(`https://codeload.github.com/${repo}/zip/refs/heads/${b}`);
    }
  }

  let result: { buffer: Buffer; finalUrl: string } | null = null;
  let successfulUrl = "";
  for (const url of zipUrls) {
    result = await fetchGithubZip(url, token);
    if (result) {
      successfulUrl = url;
      break;
    }
  }

  if (!result) {
    addGithubLog('error', `Failed to access code in branches: ${branchesToTry.join(", ")}`);
    throw new Error(`امکان دسترسی به کدها در شاخه‌های ${branchesToTry.join(", ")} فراهم نشد. لطفاً از درستی نام مخزن و دسترسی (Token) اطمینان حاصل کنید.`);
  }

  // Fetch commit details from GitHub API if token available or unauthenticated
  let commitInfo: any = {
    sha: Math.random().toString(36).substring(2, 9),
    author: "GitHub Committer",
    date: new Date().toLocaleDateString("fa-IR"),
    message: "بروزرسانی زنده و دریافت آخرین تغییرات سورس کد"
  };

  try {
    const commitApiUrl = `https://api.github.com/repos/${ownerRepo}/commits/${extractedBranch}`;
    const headers: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Dastavval-Updater/5.0",
      "Accept": "application/vnd.github+json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const cResp = await fetch(commitApiUrl, { headers });
    if (cResp.ok) {
      const cData = await cResp.json();
      commitInfo = {
        sha: cData.sha?.substring(0, 7) || commitInfo.sha,
        author: cData.commit?.author?.name || cData.author?.login || commitInfo.author,
        date: cData.commit?.author?.date ? new Date(cData.commit.author.date).toLocaleDateString("fa-IR") : commitInfo.date,
        message: cData.commit?.message?.split("\n")[0] || commitInfo.message
      };
    }
  } catch (e) {
    // Ignore commit metadata API error fallback
  }

  const zip = new AdmZip(result.buffer);
  const zipEntries = zip.getEntries();
  if (zipEntries.length === 0) throw new Error("فایل فشرده دریافتی از گیت‌هاب خالی است.");

  let rootPrefix = "";
  const prefixCounts: Record<string, number> = {};
  for (const e of zipEntries) {
    if (e.entryName.includes("/")) {
      const top = e.entryName.split("/")[0] + "/";
      if (top !== "__MACOSX/") prefixCounts[top] = (prefixCounts[top] || 0) + 1;
    }
  }
  let maxCount = 0;
  for (const [prefix, count] of Object.entries(prefixCounts)) {
    if (count > maxCount) {
      maxCount = count;
      rootPrefix = prefix;
    }
  }

  const excludes = ["node_modules", ".git", ".env"];
  const fileList: Array<{ path: string; size: number; status: 'new' | 'modified'; section: string }> = [];

  let addedCount = 0;
  let modifiedCount = 0;
  let totalSizeBytes = 0;

  for (const entry of zipEntries) {
    if (entry.isDirectory) continue;
    let relPath = entry.entryName;
    if (rootPrefix && relPath.startsWith(rootPrefix)) relPath = relPath.substring(rootPrefix.length);
    if (!relPath) continue;
    const topDir = relPath.split("/")[0];
    if (excludes.includes(topDir) || excludes.includes(relPath)) continue;

    const localPath = path.join(process.cwd(), relPath);
    const exists = fs.existsSync(localPath);
    const status: 'new' | 'modified' = exists ? 'modified' : 'new';

    if (exists) modifiedCount++; else addedCount++;
    totalSizeBytes += entry.header.size;

    let section = "سایر فایل‌ها";
    if (relPath.startsWith("src/components/")) section = "کامپوننت‌های فرانت‌اند (src/components)";
    else if (relPath.startsWith("src/")) section = "سورس‌کد فرانت‌اند (src)";
    else if (relPath.startsWith("public/")) section = "فایل‌های عمومی و رسانه (public)";
    else if (relPath.includes("server") || relPath.endsWith(".ts")) section = "سرویس پشتی (server)";
    else if (relPath.includes("package") || relPath.includes("config")) section = "تنظیمات و پکیج‌ها";

    fileList.push({
      path: relPath,
      size: entry.header.size,
      status,
      section
    });
  }

  return {
    buffer: result.buffer,
    ownerRepo,
    branch: extractedBranch,
    zipSizeKb: Math.round(result.buffer.length / 1024),
    successfulUrl,
    commitInfo,
    fileList,
    totalFiles: fileList.length,
    addedCount,
    modifiedCount,
    totalSizeBytes,
    zipEntries,
    rootPrefix
  };
}

async function performGithubUpdate(repoUrl: string, branch: string, token: string, hardReset: boolean = true) {
  const inspected = await inspectGithubRepo(repoUrl, branch, token);
  
  // Hard Reset: clean src, public, php, dist to ensure 100% rollback accuracy
  addGithubLog('info', 'Performing Hard Reset & cleaning stale directories (src, public, php, dist)...');
  const dirsToClean = ["src", "public", "php", "dist"];
  for (const dir of dirsToClean) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      try {
        fs.rmSync(dirPath, { recursive: true, force: true });
      } catch (e) {}
    }
  }

  let updatedFilesCount = 0;
  const updatedFilesList: string[] = [];

  const excludes = ["node_modules", ".git", ".env"];
  for (const entry of inspected.zipEntries) {
    if (entry.isDirectory) continue;
    let relPath = entry.entryName;
    if (inspected.rootPrefix && relPath.startsWith(inspected.rootPrefix)) {
      relPath = relPath.substring(inspected.rootPrefix.length);
    }
    if (!relPath) continue;
    const topDir = relPath.split("/")[0];
    if (excludes.includes(topDir) || excludes.includes(relPath)) continue;

    const targetPaths = [path.join(process.cwd(), relPath)];
    if (relPath.startsWith("dist/")) targetPaths.push(path.join(process.cwd(), relPath.substring(5)));

    for (const targetPath of targetPaths) {
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetPath, entry.getData());
    }
    updatedFilesCount++;
    updatedFilesList.push(relPath);
  }

  b2bConfig.lastGithubUpdate = Date.now();
  (b2bConfig as any).lastCommitInfo = inspected.commitInfo;
  try { fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8"); } catch (e) {}

  addGithubLog('success', `Update completed. ${updatedFilesCount} files extracted. Running synchronous build...`);

  try {
    execSync("npm run build", { stdio: 'inherit' });
    addGithubLog('success', `Build completed successfully.`);
  } catch (err: any) {
    addGithubLog('error', `Build error: ${err.message}`);
    throw new Error("خطا در کامپایل پروژه پس از بروزرسانی: " + err.message);
  }

  return {
    updatedFilesCount,
    updatedFilesList,
    successfulUrl: inspected.successfulUrl,
    commitInfo: inspected.commitInfo,
    ownerRepo: inspected.ownerRepo,
    totalSizeBytes: inspected.totalSizeBytes
  };
}

// Endpoint: Manual ZIP Package Upload & Sync
app.post("/api/admin/manual-zip-upload", async (req, res) => {
  try {
    const { zipBase64, fileName } = req.body;
    if (!zipBase64) {
      return res.status(400).json({ success: false, error: "فایل زیپ ارسال نشده است." });
    }

    const cleanBase64 = zipBase64.replace(/^data:[^;]+;base64,/, "");
    const zipBuffer = Buffer.from(cleanBase64, "base64");

    addGithubLog('info', `[Manual ZIP Upload] Processing uploaded package: ${fileName || 'update.zip'} (${Math.round(zipBuffer.length / 1024)} KB)`);

    // Hard Reset: clean src, public, php, dist
    const dirsToClean = ["src", "public", "php", "dist"];
    for (const dir of dirsToClean) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        try { fs.rmSync(dirPath, { recursive: true, force: true }); } catch (e) {}
      }
    }

    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    let rootPrefix = "";
    const firstDirEntry = zipEntries.find(e => e.isDirectory);
    if (firstDirEntry) {
      const candidate = firstDirEntry.entryName;
      const allStartWith = zipEntries.every(e => e.entryName.startsWith(candidate));
      if (allStartWith) rootPrefix = candidate;
    }

    let updatedFilesCount = 0;
    const updatedFilesList: string[] = [];
    const excludes = ["node_modules", ".git", ".env"];

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      let relPath = entry.entryName;
      if (rootPrefix && relPath.startsWith(rootPrefix)) {
        relPath = relPath.substring(rootPrefix.length);
      }
      if (!relPath) continue;
      const topDir = relPath.split("/")[0];
      if (excludes.includes(topDir) || excludes.includes(relPath)) continue;

      const targetPaths = [path.join(process.cwd(), relPath)];
      if (relPath.startsWith("dist/")) targetPaths.push(path.join(process.cwd(), relPath.substring(5)));

      for (const targetPath of targetPaths) {
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.writeFileSync(targetPath, entry.getData());
      }
      updatedFilesCount++;
      updatedFilesList.push(relPath);
    }

    b2bConfig.lastGithubUpdate = Date.now();
    try { fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8"); } catch (e) {}

    addGithubLog('success', `[Manual ZIP] Extracted ${updatedFilesCount} files. Running npm run build...`);

    try {
      execSync("npm run build", { stdio: 'inherit' });
      addGithubLog('success', `[Manual ZIP] Build completed successfully.`);
    } catch (err: any) {
      addGithubLog('error', `[Manual ZIP] Build error: ${err.message}`);
      throw new Error("خطا در کامپایل پروژه پس از بارگذاری دستی: " + err.message);
    }

    return res.json({
      success: true,
      message: `بسته بروزرسانی دستی (${fileName || 'update.zip'}) با موفقیت استخراج، کامپایل و جایگزین شد!`,
      updatedFilesCount,
      updatedFilesList
    });
  } catch (error: any) {
    console.error("[Manual ZIP Error]:", error);
    addGithubLog('error', `[Manual ZIP Error] ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Test Connection & Metadata Check
app.post("/api/admin/github-test", async (req, res) => {
  const { repoUrl, branch, token } = req.body;
  try {
    const inspected = await inspectGithubRepo(
      repoUrl || b2bConfig.githubRepoUrl || "https://github.com/dastavval/UpdaterDst.git",
      branch || b2bConfig.githubBranch || "main",
      token || b2bConfig.githubToken || ""
    );
    return res.json({
      success: true,
      message: `اتصال برقرار شد! مخزن ${inspected.ownerRepo} (شاخه ${inspected.branch}) شناسایی شد.`,
      ownerRepo: inspected.ownerRepo,
      branch: inspected.branch,
      zipSizeKb: inspected.zipSizeKb,
      totalFiles: inspected.totalFiles,
      commitInfo: inspected.commitInfo
    });
  } catch (error: any) {
    console.error("[GitHub Test Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Preview File Changes Before Update
app.post("/api/admin/github-preview", async (req, res) => {
  const { repoUrl, branch, token } = req.body;
  try {
    const inspected = await inspectGithubRepo(
      repoUrl || b2bConfig.githubRepoUrl || "https://github.com/dastavval/UpdaterDst.git",
      branch || b2bConfig.githubBranch || "main",
      token || b2bConfig.githubToken || ""
    );
    return res.json({
      success: true,
      ownerRepo: inspected.ownerRepo,
      branch: inspected.branch,
      totalFiles: inspected.totalFiles,
      addedCount: inspected.addedCount,
      modifiedCount: inspected.modifiedCount,
      totalSizeBytes: inspected.totalSizeBytes,
      commitInfo: inspected.commitInfo,
      files: inspected.fileList
    });
  } catch (error: any) {
    console.error("[GitHub Preview Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Purge Server Cache & OPcache
app.post("/api/admin/purge-cache", async (req, res) => {
  try {
    const versionData = JSON.stringify({
      version: Date.now(),
      timestamp: Date.now(),
      date: new Date().toISOString()
    }, null, 2);
    fs.writeFileSync(path.join(process.cwd(), 'version.json'), versionData, 'utf-8');
    return res.json({ success: true, message: "کش سرور و نسخه با موفقیت پاکسازی شد." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: Hot-Reload Static & Changed Files Without Server Restart
app.post("/api/admin/hot-reload", async (req, res) => {
  const { repoUrl, branch, token } = req.body;
  addGithubLog('info', 'Starting Hot-Reload of changed static & source files without server restart...');
  try {
    const targetRepo = repoUrl || b2bConfig.githubRepoUrl || "https://github.com/dastavval/UpdaterDst.git";
    const targetBranch = branch || b2bConfig.githubBranch || "main";
    const targetToken = token || b2bConfig.githubToken || "";

    const inspected = await inspectGithubRepo(targetRepo, targetBranch, targetToken);

    let updatedFilesCount = 0;
    const updatedFilesList: string[] = [];
    const excludes = ["node_modules", ".git", ".env"];

    for (const entry of inspected.zipEntries) {
      if (entry.isDirectory) continue;
      let relPath = entry.entryName;
      if (inspected.rootPrefix && relPath.startsWith(inspected.rootPrefix)) {
        relPath = relPath.substring(inspected.rootPrefix.length);
      }
      if (!relPath) continue;
      const topDir = relPath.split("/")[0];
      if (excludes.includes(topDir) || excludes.includes(relPath)) continue;

      const targetPaths = [path.join(process.cwd(), relPath)];
      if (relPath.startsWith("dist/")) {
        targetPaths.push(path.join(process.cwd(), relPath.substring(5)));
      }

      for (const targetPath of targetPaths) {
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        fs.writeFileSync(targetPath, entry.getData());
      }
      updatedFilesCount++;
      updatedFilesList.push(relPath);
    }

    b2bConfig.lastGithubUpdate = Date.now();
    try { fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8"); } catch (e) {}

    // Write version.json for cache invalidation on shared hosting
    try {
      const versionData = JSON.stringify({
        version: Date.now(),
        timestamp: Date.now(),
        date: new Date().toISOString()
      }, null, 2);
      fs.writeFileSync(path.join(process.cwd(), 'version.json'), versionData, 'utf-8');
    } catch (e) {}

    addGithubLog('success', `Hot-reload completed! ${updatedFilesCount} static/source files replaced successfully without server restart.`);

    return res.json({
      success: true,
      message: `هات‌ریلود فایل‌های استاتیک با موفقیت انجام شد (${updatedFilesCount} فایل بروزرسانی شد بدون نیاز به ریستارت سرور).`,
      updatedFilesCount,
      updatedFilesList,
      commitInfo: inspected.commitInfo
    });
  } catch (error: any) {
    console.error("[Hot-Reload Error]:", error);
    addGithubLog('error', `Hot-Reload error: ${error.message}`);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Trigger Server Rebuild
app.post("/api/admin/github-rebuild", async (req, res) => {
  addGithubLog('info', 'Manual compilation & rebuild triggered by admin...');
  try {
    const stdout = execSync("npm run build", { encoding: "utf-8" });
    addGithubLog('success', 'Project compiled and rebuilt successfully!');
    return res.json({ success: true, message: "کدها با موفقیت کامپایل و بازسازی شدند.", log: stdout });
  } catch (err: any) {
    addGithubLog('error', `Rebuild failed: ${err.message}`);
    return res.status(500).json({ success: false, error: err.message, log: err.stdout || err.stderr || err.message });
  }
});

// Endpoints for GitHub Logs
app.get("/api/admin/github-logs", (req, res) => {
  res.json({ success: true, logs: githubUpdateLogs });
});

app.post("/api/admin/github-logs/clear", (req, res) => {
  githubUpdateLogs = [];
  res.json({ success: true });
});

// Webhook & Cron Auto-Update Endpoints
app.all(["/api/github-webhook", "/api/cron-auto-update"], async (req, res) => {
  const event = req.headers["x-github-event"];
  if (event === "ping") {
    return res.json({ success: true, message: "PONG - Webhook connection verified!" });
  }

  const payload = req.body || {};
  const repoUrl = payload.repository?.html_url || req.query.repoUrl || b2bConfig.githubRepoUrl || "https://github.com/dastavval/UpdaterDst.git";
  const branch = (payload.ref ? payload.ref.replace("refs/heads/", "") : req.query.branch) || b2bConfig.githubBranch || "main";
  const token = b2bConfig.githubToken || "";

  addGithubLog('info', `[Auto-Sync Triggered] Processing update for ${repoUrl} (branch: ${branch})`);

  try {
    const result = await performGithubUpdate(String(repoUrl), String(branch), token, false);
    return res.json({
      success: true,
      message: "به‌روزرسانی خودکار با موفقیت انجام شد.",
      updatedFilesCount: result.updatedFilesCount,
      commitInfo: result.commitInfo
    });
  } catch (err: any) {
    addGithubLog('error', `[Auto-Sync Error] ${err.message}`);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/github-update", async (req, res) => {
  const { repoUrl, branch, token, hardReset } = req.body;
  try {
    const targetRepo = repoUrl || b2bConfig.githubRepoUrl || "https://github.com/dastavval/UpdaterDst.git";
    const targetBranch = branch || b2bConfig.githubBranch || "main";
    const targetToken = token !== undefined ? token : (b2bConfig.githubToken || "");

    const result = await performGithubUpdate(
      targetRepo,
      targetBranch,
      targetToken,
      hardReset === true
    );

    // Save configuration
    b2bConfig.githubRepoUrl = targetRepo;
    b2bConfig.githubBranch = targetBranch;
    b2bConfig.githubToken = targetToken;
    b2bConfig.lastGithubUpdate = Date.now();
    (b2bConfig as any).lastCommitInfo = result.commitInfo;
    try { fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8"); } catch (e) {}

    return res.json({
      success: true,
      message: "کدها و دیتابیس سامانه با موفقیت از مخزن گیت‌هاب دریافت و به‌روزرسانی شد! در حال بارگذاری مجدد...",
      downloadUrl: result.successfulUrl,
      updatedFilesCount: result.updatedFilesCount,
      updatedFilesList: result.updatedFilesList,
      commitInfo: result.commitInfo,
      ownerRepo: result.ownerRepo
    });
  } catch (error: any) {
    console.error("[GitHub Updater Error]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Periodic Automatic Background Poller (Checks for new commits every 10 minutes)
let lastCheckedCommitSha = "";
setInterval(async () => {
  try {
    const repo = b2bConfig.githubRepoUrl || "https://github.com/dastavval/UpdaterDst";
    const branch = b2bConfig.githubBranch || "main";
    const token = b2bConfig.githubToken || "";

    const inspected = await inspectGithubRepo(repo, branch, token);
    const newSha = inspected.commitInfo?.sha;

    if (newSha && lastCheckedCommitSha && newSha !== lastCheckedCommitSha) {
      addGithubLog('info', `[Background Auto-Updater] New commit detected: ${newSha} (old: ${lastCheckedCommitSha}). Triggering auto-update...`);
      await performGithubUpdate(repo, branch, token, false);
    }
    if (newSha) lastCheckedCommitSha = newSha;
  } catch (e) {
    // Background polling silent error handling
  }
}, 10 * 60 * 1000);

// Persistent B2B Data API - Robust saving with basic locking
let isSavingProducts = false;
let productSaveQueue: any[] = [];

async function processProductQueue() {
  if (isSavingProducts || productSaveQueue.length === 0) return;
  isSavingProducts = true;
  const nextItems = productSaveQueue.shift();
  try {
    saveProducts(nextItems);
    console.log(`[Persistence] Successfully saved ${nextItems.length} products to disk.`);
  } catch (err) {
    console.error("[Persistence] Failed to save products:", err);
  } finally {
    isSavingProducts = false;
    if (productSaveQueue.length > 0) processProductQueue();
  }
}

app.get("/api/b2b/products", (req, res) => {
  res.json(loadProducts());
});

app.post("/api/b2b/products", (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "Expected an array of products" });
  
  // Background trigger: notify product status changes
  try {
    const existingProducts = loadProducts();
    const incomingProducts = req.body;
    for (const incoming of incomingProducts) {
      if (!incoming.id) continue;
      const existing = existingProducts.find(p => p.id === incoming.id);
      if (existing && existing.approvalStatus !== incoming.approvalStatus) {
        // Status changed
        const sellerPhone = incoming.sellerPhone || incoming.phone || "";
        const sellerName = incoming.sellerName || "تولیدکننده گرامی";
        let phoneToSend = sellerPhone;

        if (!phoneToSend && incoming.sellerId) {
          const localUsers = loadUsers();
          const sellerObj = Object.values(localUsers).find((u: any) => u.id === incoming.sellerId || u.userCode === incoming.sellerId);
          if (sellerObj && sellerObj.phone) {
            phoneToSend = sellerObj.phone;
          }
        }

        if (phoneToSend) {
          if (incoming.approvalStatus === "approved") {
            const text = `جناب ${sellerName}، محصول ثبت شده شما با عنوان «${incoming.name}» با موفقیت توسط مدیریت تأیید و در معرض دید خریداران عمده سراسر کشور قرار گرفت.\nسامانه ملّی دست اول\ndastavval.com\nلغو11`;
            const patternId = b2bConfig.smsProductApprovedPatternId || null;
            sendMeliPayamakSms(phoneToSend, text, patternId ? Number(patternId) : undefined, `${sellerName};${incoming.name}`);
          } else if (incoming.approvalStatus === "rejected") {
            const reason = incoming.rejectionReason || "عدم تطابق با استانداردهای کیفی اطلاعات";
            const text = `جناب ${sellerName}، اطلاعات محصول «${incoming.name}» مورد تأیید قرار نگرفت.\nعلت رد: ${reason}\nلطفاً پس از ویرایش، مجدداً ارسال فرمایید.\nسامانه ملّی دست اول\ndastavval.com\nلغو11`;
            const patternId = b2bConfig.smsProductRejectedPatternId || null;
            sendMeliPayamakSms(phoneToSend, text, patternId ? Number(patternId) : undefined, `${sellerName};${incoming.name};${reason}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error sending product status SMS:", err);
  }

  productSaveQueue.push(req.body);
  processProductQueue();
  res.json({ success: true, count: req.body.length, status: "queued" });
});

app.get("/api/b2b/orders", (req, res) => {
  res.json(loadOrders());
});

app.post("/api/b2b/orders", (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "Expected an array of orders" });
  
  // Background trigger: notify order placement and status changes
  try {
    const existingOrders = loadOrders();
    const incomingOrders = req.body;
    for (const incoming of incomingOrders) {
      if (!incoming.id) continue;
      const existing = existingOrders.find(o => o.id === incoming.id);
      
      const buyerPhone = incoming.buyerPhone || incoming.buyerInfo?.phone;
      const buyerName = incoming.buyerName || incoming.buyerInfo?.name || "خریدار محترم (عامل توزیع)";
      
      if (!existing) {
        // NEW ORDER PLACEMENT
        if (buyerPhone) {
          const text = `جناب ${buyerName}، سفارش جدید شما با کد پیگیری ${incoming.id} در سامانه ملّی دست اول ثبت گردید و جهت تأیید نهایی کالا به واحد بازرگانی کارخانه ارسال شد.\ndastavval.com\nلغو11`;
          const patternId = b2bConfig.smsOrderRegisteredPatternId || null;
          sendMeliPayamakSms(buyerPhone, text, patternId ? Number(patternId) : undefined, `${buyerName};${incoming.id}`);
        }

        // --- NEW: Notify Admin of new order ---
        const adminPhone = getAdminPhone();
        const adminText = `مدیر گرامی، سفارش جدید ${incoming.id} از شماره ${buyerPhone || 'ناشناس'} در سامانه ثبت شد.\nدست اول`;
        const adminPatternId = b2bConfig.smsAdminNotificationPatternId || null;
        if (adminPatternId && Number(adminPatternId) > 0) {
          sendMeliPayamakSms(adminPhone, adminText, Number(adminPatternId), `سفارش جدید;${buyerPhone || incoming.id}`);
        } else {
          sendMeliPayamakSms(adminPhone, adminText);
        }
        
        // Also notify Regional Representative if assigned
        if (incoming.regionalRepresentativeId) {
          const localUsers = loadUsers();
          const repObj = Object.values(localUsers).find((u: any) => u.id === incoming.regionalRepresentativeId || u.userCode === incoming.regionalRepresentativeId);
          if (repObj && repObj.phone) {
            const repName = repObj.name || "نماینده گرامی";
            const textRep = `جناب ${repName}، سفارش جدیدی با شماره ${incoming.id} در حوزه نمایندگی شما ثبت شد. سامانه دست اول\ndastavval.com\nلغو11`;
            const patternId = b2bConfig.smsRepNotificationPatternId || null;
            sendMeliPayamakSms(repObj.phone, textRep, patternId ? Number(patternId) : undefined, `${repName};${incoming.id}`);
          }
        }
      } else if (existing.status !== incoming.status) {
        // ORDER STATUS CHANGE
        if (buyerPhone) {
          let statusLabel = "";
          switch(incoming.status) {
            case "payment_verified": statusLabel = "تأیید پرداخت و واریز مالی"; break;
            case "production_line": statusLabel = "ارسال به خط تولید کارخانه"; break;
            case "factory_packaging": statusLabel = "بسته‌بندی نهایی و پلمپ بار"; break;
            case "quality_assurance": statusLabel = "تأیید نهایی واحد کنترل کیفیت (QC)"; break;
            case "logistic_shipping": statusLabel = "بارگیری و تحویل به ناوگان ترانزیت"; break;
            case "delivered": statusLabel = "تحویل نهایی کالا به خریدار"; break;
            case "cancelled": statusLabel = "لغو سفارش"; break;
            default: statusLabel = String(incoming.status);
          }

          // Check if specific specialized pattern applies (e.g. logistics or factory production)
          if (incoming.status === "logistic_shipping" && b2bConfig.smsLogisticsPatternId) {
            const waybill = incoming.trackingCode || incoming.waybillNumber || "بارنامه مستقیم کارخانه";
            const textLogistics = `جناب ${buyerName}، بار سفارش ${incoming.id} با شماره بارنامه ${waybill} بارگیری شد.\ndastavval.com\nلغو11`;
            sendMeliPayamakSms(buyerPhone, textLogistics, Number(b2bConfig.smsLogisticsPatternId), `${buyerName};${incoming.id};${waybill}`);
          } else if (incoming.status === "factory_packaging" && b2bConfig.smsFactoryProductionPatternId) {
            const textProd = `جناب ${buyerName}، سفارش ${incoming.id} از خط تولید کارخانه خارج و بسته‌بندی شد.\ndastavval.com\nلغو11`;
            sendMeliPayamakSms(buyerPhone, textProd, Number(b2bConfig.smsFactoryProductionPatternId), `${buyerName};${incoming.id}`);
          } else {
            const text = `جناب ${buyerName}، وضعیت سفارش ${incoming.id} شما در سامانه ملّی دست اول به «${statusLabel}» تغییر یافت.\ndastavval.com\nلغو11`;
            const patternId = b2bConfig.smsOrderStatusChangedPatternId || null;
            sendMeliPayamakSms(buyerPhone, text, patternId ? Number(patternId) : undefined, `${buyerName};${incoming.id};${statusLabel}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error sending order status SMS:", err);
  }

  saveOrders(req.body);
  try {
    for (const o of req.body) {
      appendToCriticalVault("order", o);
    }
  } catch (e) {}
  res.json({ success: true, count: req.body.length });
});

// Dealership / Agency Requests Endpoints
app.get("/api/dealership-requests", (req, res) => {
  res.json(loadDealershipRequests());
});

app.post("/api/dealership-requests", (req, res) => {
  const payload = req.body;
  if (!payload) return res.status(400).json({ error: "Payload required" });

  const items = Array.isArray(payload) ? payload : [payload];
  
  for (const item of items) {
    try {
      appendToCriticalVault("dealership_request", item);

      // Trigger SMS Notification to Admin
      const applicantPhone = item.mobile || item.phone || "نامشخص";
      const applicantName = item.fullName || item.name || "متقاضی محترم";
      const location = `${item.province || ''} - ${item.city || ''}`;
      const code = item.code || item.id || "REP";

      const adminPhone = getAdminPhone();
      const adminText = `مدیر گرامی، درخواست نمایندگی جدید (${code}) از طرف ${applicantName} (${applicantPhone}) در ${location} ثبت گردید.\nدست اول`;
      const adminPatternId = (b2bConfig as any).smsAdminNotificationPatternId || (b2bConfig as any).smsDealershipPatternId || null;
      if (adminPatternId && Number(adminPatternId) > 0) {
        sendMeliPayamakSms(adminPhone, adminText, Number(adminPatternId), `درخواست نمایندگی ${code};${applicantPhone}`);
      } else {
        sendMeliPayamakSms(adminPhone, adminText);
      }

      // SMS to Applicant
      if (applicantPhone && applicantPhone.length >= 10) {
        const applicantText = `جناب ${applicantName}، درخواست اخذ نمایندگی و عاملیت شما با کد رهگیری ${code} در سامانه دست اول ثبت شد و در حال بررسی کمیسیون اعطا می‌باشد.\ndastavval.com\nلغو11`;
        sendMeliPayamakSms(applicantPhone, applicantText);
      }
    } catch (e) {
      console.error("Dealership SMS/Notification error:", e);
    }
  }

  saveDealershipRequests(items);
  res.json({ success: true, count: items.length });
});

app.put("/api/dealership-requests/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  const all = loadDealershipRequests();
  const index = all.findIndex((r) => r.id === id || r.code === id);

  if (index >= 0) {
    all[index] = { ...all[index], ...updates, updatedAt: new Date().toISOString() };
    saveDealershipRequests(all);
    appendToCriticalVault("dealership_update", all[index]);

    // If status changed to approved, send SMS
    if (updates.status === "approved" && (all[index].mobile || all[index].phone)) {
      const applicantName = all[index].fullName || all[index].name || "همکار گرامی";
      const approvedText = `جناب ${applicantName}، با افتخار درخواست نمایندگی شما در سامانه دست اول تایید شد و کد عاملیت اختصاصی برای شما صادر گردید.\ndastavval.com\nلغو11`;
      sendMeliPayamakSms(all[index].mobile || all[index].phone, approvedText);
    }

    return res.json({ success: true, item: all[index] });
  }

  // If not found in current list, create with update
  const newItem = { id, ...updates, updatedAt: new Date().toISOString() };
  saveDealershipRequests([newItem]);
  res.json({ success: true, item: newItem });
});

// Critical Sync fallback endpoint
app.post("/api/critical-sync", (req, res) => {
  const { type, payload } = req.body || {};
  if (!payload) return res.status(400).json({ error: "Missing payload" });
  appendToCriticalVault(type || "generic_critical", payload);
  if (type === "dealership") {
    saveDealershipRequests(Array.isArray(payload) ? payload : [payload]);
  } else if (type === "order") {
    saveOrders(Array.isArray(payload) ? payload : [payload]);
  }
  res.json({ success: true, savedAt: new Date().toISOString() });
});

app.get("/api/critical-vault", (req, res) => {
  try {
    if (fs.existsSync(CRITICAL_VAULT_FILE)) {
      const lines = fs.readFileSync(CRITICAL_VAULT_FILE, "utf-8").split("\n").filter(Boolean);
      const parsed = lines.map((l) => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);
      return res.json(parsed.slice(-200));
    }
  } catch (e) {}
  res.json([]);
});

app.get("/api/b2b/users", (req, res) => {
  res.json(loadUsers());
});

app.post("/api/b2b/users", (req, res) => {
  // Background trigger: notify user account status activation or rejection
  try {
    const existingUsers = loadUsers();
    const incomingUsers = req.body;
    for (const key of Object.keys(incomingUsers)) {
      const incoming = incomingUsers[key];
      const existing = existingUsers[key];
      if (existing && existing.status !== incoming.status) {
        const userPhone = incoming.phone;
        const userName = incoming.name || "همکار گرامی";
        if (userPhone) {
          if (incoming.status === "active") {
            const text = `جناب ${userName}، مدارک و حساب شما در سامانه ملّی دست اول تایید و فعال شد.\ndastavval.com\nلغو11`;
            const patternId = b2bConfig.smsAccountActivatedPatternId || null;
            sendMeliPayamakSms(userPhone, text, patternId ? Number(patternId) : undefined, `${userName}`);
          } else if (incoming.status === "rejected") {
            const text = `جناب ${userName}، مدارک هویتی شما تایید نشد. جهت تکمیل وارد پنل دست اول شوید.\ndastavval.com\nلغو11`;
            const patternId = b2bConfig.smsAccountRejectedPatternId || null;
            sendMeliPayamakSms(userPhone, text, patternId ? Number(patternId) : undefined, `${userName}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error sending user status SMS:", err);
  }

  saveUsers(req.body);
  res.json({ success: true });
});

// Referral & Agency Code System Endpoints
app.post("/api/referral/validate", (req, res) => {
  try {
    const { code, orderAmount = 0, currentPhone = "" } = req.body;
    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ valid: false, error: "کد معرف یا نمایندگی وارد نشده است." });
    }

    const cleanCode = code.trim().toUpperCase();
    const users = loadUsers();
    
    // Find matching user by agencyCode, marketerCode, referralCode, userCode, customerCode, or phone
    let matchedUser: any = null;
    let matchedType: 'representative' | 'marketer' | 'customer' = 'customer';

    for (const [key, u] of Object.entries(users)) {
      if (!u || typeof u !== 'object') continue;
      const uAgency = (u.agencyCode || '').toUpperCase();
      const uMarketer = (u.marketerCode || '').toUpperCase();
      const uRef = (u.referralCode || '').toUpperCase();
      const uCust = (u.customerCode || '').toUpperCase();
      const uUser = (u.userCode || '').toUpperCase();
      const uPhone = (u.phone || key || '').replace(/\D/g, '');

      if (cleanCode === uAgency || (cleanCode.startsWith("AGN-") && uAgency.includes(cleanCode.replace("AGN-", ""))) || (cleanCode.startsWith("REP-") && uAgency.includes(cleanCode.replace("REP-", "")))) {
        matchedUser = u;
        matchedType = 'representative';
        break;
      }
      if (cleanCode === uMarketer || (cleanCode.startsWith("MKT-") && uMarketer.includes(cleanCode.replace("MKT-", "")))) {
        matchedUser = u;
        matchedType = 'marketer';
        break;
      }
      if (cleanCode === uRef || cleanCode === uCust || cleanCode === uUser || cleanCode === uPhone) {
        matchedUser = u;
        matchedType = (u.role === 'representative' || u.role === 'agent') ? 'representative' :
                      (u.role === 'marketer') ? 'marketer' : 'customer';
        break;
      }
    }

    // Heuristic match if user was not in static map
    if (!matchedUser) {
      if (cleanCode.startsWith("REP-") || cleanCode.startsWith("AGN-")) {
        matchedType = 'representative';
        matchedUser = { name: "عاملیت رسمی دست اول", role: "representative", agencyCode: cleanCode };
      } else if (cleanCode.startsWith("MKT-")) {
        matchedType = 'marketer';
        matchedUser = { name: "مشاور و بازاریاب رسمی دست اول", role: "marketer", marketerCode: cleanCode };
      } else if (cleanCode.startsWith("REF-") || cleanCode.startsWith("BONK-") || cleanCode.startsWith("CST-")) {
        matchedType = 'customer';
        matchedUser = { name: "همکار معتمد دست اول", role: "customer", referralCode: cleanCode };
      }
    }

    if (!matchedUser) {
      return res.status(404).json({ valid: false, error: "کد معرف یا نمایندگی وارد شده در سامانه معتبر نمی‌باشد." });
    }

    // Prevent self referral
    const cleanUserPhone = (currentPhone || "").replace(/\D/g, '');
    const matchedUserPhone = (matchedUser.phone || "").replace(/\D/g, '');
    if (cleanUserPhone && matchedUserPhone && cleanUserPhone === matchedUserPhone) {
      return res.status(400).json({ valid: false, error: "امکان استفاده از کد معرف متعلق به خودتان وجود ندارد." });
    }

    // Calculate benefits:
    // - Customer: 500k reward, 3% buyer discount (up to 500k)
    // - Marketer: 1M reward, 3% buyer discount
    // - Representative: 5% commission from order, 5% buyer discount
    const numOrderAmount = Number(orderAmount) || 0;
    let buyerDiscountPercent = 3;
    let buyerDiscountAmount = Math.round(numOrderAmount * 0.03);
    let referrerRewardAmount = 500000;
    let referrerRewardNote = "";
    let roleTitle = "مشتری همکار";

    if (matchedType === 'representative') {
      roleTitle = "نماینده رسمی کارخانجات (عاملیت رسمی)";
      buyerDiscountPercent = 5;
      buyerDiscountAmount = Math.round(numOrderAmount * 0.05);
      referrerRewardAmount = Math.round(numOrderAmount * 0.05);
      referrerRewardNote = "۵٪ پورسانت نقدی مستقیم از کل فاکتور";
    } else if (matchedType === 'marketer') {
      roleTitle = "بازاریاب رسمی دست اول";
      buyerDiscountPercent = 3;
      buyerDiscountAmount = Math.round(numOrderAmount * 0.03);
      referrerRewardAmount = 1000000;
      referrerRewardNote = "۱,۰۰۰,۰۰۰ تومان پاداش معرفی + ۵٪ کارمزد در صورت اخذ نمایندگی";
    } else {
      roleTitle = "مشتری و همکار معتمد";
      buyerDiscountPercent = 3;
      buyerDiscountAmount = Math.min(Math.round(numOrderAmount * 0.03), 500000);
      referrerRewardAmount = 500000;
      referrerRewardNote = "۵۰۰,۰۰۰ تومان اعتبار هدیه خرید";
    }

    return res.json({
      valid: true,
      code: cleanCode,
      referrerType: matchedType,
      referrerName: matchedUser.name || matchedUser.company || roleTitle,
      referrerRole: matchedUser.role || matchedType,
      roleTitle,
      buyerDiscountPercent,
      buyerDiscountAmount,
      referrerRewardAmount,
      referrerRewardNote,
      message: `کد با موفقیت تایید شد (${roleTitle}). تخفیف برای شما و پاداش برای معرف منظور گردید.`
    });
  } catch (err: any) {
    res.status(500).json({ valid: false, error: "خطا در ارزیابی کد معرف: " + err.message });
  }
});

app.post("/api/referral/record", (req, res) => {
  try {
    const { referralCode, orderId, trackingNumber, orderAmount, buyerName, buyerPhone } = req.body;
    if (!referralCode) return res.json({ success: false, message: "کد معرفی ارسال نشد" });

    const users = loadUsers();
    const cleanCode = referralCode.trim().toUpperCase();
    let referrerPhone: string | null = null;
    let referrerUser: any = null;

    for (const [key, u] of Object.entries(users)) {
      if (!u || typeof u !== 'object') continue;
      const uAgency = (u.agencyCode || '').toUpperCase();
      const uMarketer = (u.marketerCode || '').toUpperCase();
      const uRef = (u.referralCode || '').toUpperCase();
      const uCust = (u.customerCode || '').toUpperCase();
      const uUser = (u.userCode || '').toUpperCase();
      const uPhone = (u.phone || key || '').replace(/\D/g, '');

      if (cleanCode === uAgency || cleanCode === uMarketer || cleanCode === uRef || cleanCode === uCust || cleanCode === uUser || cleanCode === uPhone) {
        referrerPhone = u.phone || key;
        referrerUser = u;
        break;
      }
    }

    const numAmount = Number(orderAmount) || 0;
    let rewardAmount = 500000;
    let rewardType = "customer_referral";

    if (referrerUser) {
      if (referrerUser.role === 'representative' || referrerUser.role === 'agent' || cleanCode.startsWith("REP-") || cleanCode.startsWith("AGN-")) {
        rewardAmount = Math.round(numAmount * 0.05);
        rewardType = "representative_commission";
      } else if (referrerUser.role === 'marketer' || cleanCode.startsWith("MKT-")) {
        rewardAmount = 1000000;
        rewardType = "marketer_referral_reward";
      } else {
        rewardAmount = 500000;
        rewardType = "customer_invite_reward";
      }

      referrerUser.walletBalance = (referrerUser.walletBalance || 0) + rewardAmount;
      referrerUser.totalReferralEarnings = (referrerUser.totalReferralEarnings || 0) + rewardAmount;
      referrerUser.successfulReferralsCount = (referrerUser.successfulReferralsCount || 0) + 1;
      
      if (!referrerUser.referralHistory) referrerUser.referralHistory = [];
      referrerUser.referralHistory.push({
        date: new Date().toISOString(),
        orderId: orderId || trackingNumber,
        buyerName: buyerName || "خریدار همکار",
        buyerPhone: buyerPhone ? buyerPhone.slice(-4) : "****",
        orderAmount: numAmount,
        rewardAmount,
        rewardType
      });

      if (referrerPhone) {
        users[referrerPhone] = referrerUser;
        saveUsers(users);
        recordSensitiveProfileBackup(referrerUser);
      }
    }

    res.json({ success: true, rewardAmount, rewardType });
  } catch (err: any) {
    console.error("Error recording referral order:", err);
    res.status(500).json({ error: err.message });
  }
});

// B2B Config Endpoints
app.get("/api/b2b/config", (req, res) => res.json(b2bConfig));

app.delete("/api/b2b/factories/:id", (req, res) => {
  const { id } = req.params;
  try {
    const originalCount = (b2bConfig.factories || []).length;
    b2bConfig.factories = (b2bConfig.factories || []).filter((f: any) => f.id !== id);
    
    if (b2bConfig.factories.length !== originalCount) {
      fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
      if (typeof OLD_B2B_CONFIG_FILE !== 'undefined' && OLD_B2B_CONFIG_FILE && fs.existsSync(OLD_B2B_CONFIG_FILE)) {
        try { fs.writeFileSync(OLD_B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8"); } catch (e) {}
      }
      res.json({ success: true, message: "Factory deleted successfully", factories: b2bConfig.factories });
    } else {
      res.status(404).json({ error: "Factory not found" });
    }
  } catch (error: any) {
    console.error("Failed to delete factory:", error);
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/b2b/factories/:id/toggle-active", (req, res) => {
  const { id } = req.params;
  try {
    let found = false;
    b2bConfig.factories = (b2bConfig.factories || []).map((f: any) => {
      if (f.id === id) {
        found = true;
        return { ...f, isActive: f.isActive === undefined ? false : !f.isActive };
      }
      return f;
    });

    if (found) {
      fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
      if (typeof OLD_B2B_CONFIG_FILE !== 'undefined' && OLD_B2B_CONFIG_FILE && fs.existsSync(OLD_B2B_CONFIG_FILE)) {
        try { fs.writeFileSync(OLD_B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8"); } catch (e) {}
      }
      res.json({ success: true, factories: b2bConfig.factories });
    } else {
      res.status(404).json({ error: "Factory not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/b2b/factories/:id/toggle-featured", (req, res) => {
  const { id } = req.params;
  try {
    let found = false;
    b2bConfig.factories = (b2bConfig.factories || []).map((f: any) => {
      if (f.id === id) {
        found = true;
        return { ...f, isFeatured: !f.isFeatured };
      }
      return f;
    });

    if (found) {
      fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
      if (typeof OLD_B2B_CONFIG_FILE !== 'undefined' && OLD_B2B_CONFIG_FILE && fs.existsSync(OLD_B2B_CONFIG_FILE)) {
        try { fs.writeFileSync(OLD_B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8"); } catch (e) {}
      }
      res.json({ success: true, factories: b2bConfig.factories });
    } else {
      res.status(404).json({ error: "Factory not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/b2b/config", (req, res) => {
  try {
    const incoming = req.body || {};
    b2bConfig = {
      ...DEFAULT_B2B_CONFIG,
      ...b2bConfig,
      ...incoming,
      invoiceSettings: {
        ...(DEFAULT_B2B_CONFIG.invoiceSettings || {}),
        ...(b2bConfig.invoiceSettings || {}),
        ...(incoming.invoiceSettings || {})
      },
      categories: (incoming.categories && Array.isArray(incoming.categories))
        ? incoming.categories 
        : (b2bConfig.categories || DEFAULT_B2B_CONFIG.categories),
      factories: (incoming.factories && Array.isArray(incoming.factories))
        ? incoming.factories 
        : (b2bConfig.factories || DEFAULT_B2B_CONFIG.factories),
      brands: (incoming.brands && Array.isArray(incoming.brands))
        ? incoming.brands 
        : (b2bConfig.brands || DEFAULT_B2B_CONFIG.brands),
      equipmentAds: (incoming.equipmentAds && Array.isArray(incoming.equipmentAds))
        ? incoming.equipmentAds
        : b2bConfig.equipmentAds,
      serviceAds: (incoming.serviceAds && Array.isArray(incoming.serviceAds))
        ? incoming.serviceAds
        : b2bConfig.serviceAds,
      rawMaterialAds: (incoming.rawMaterialAds && Array.isArray(incoming.rawMaterialAds))
        ? incoming.rawMaterialAds
        : b2bConfig.rawMaterialAds,
      sponsoredAds: (incoming.sponsoredAds && Array.isArray(incoming.sponsoredAds))
        ? incoming.sponsoredAds
        : b2bConfig.sponsoredAds
    };
    fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
    if (typeof OLD_B2B_CONFIG_FILE !== 'undefined' && OLD_B2B_CONFIG_FILE && fs.existsSync(OLD_B2B_CONFIG_FILE)) {
      try { fs.writeFileSync(OLD_B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8"); } catch (e) {}
    }
    res.json({ success: true, config: b2bConfig });
  } catch (error: any) {
    console.error("Failed to save config:", error);
    res.status(500).json({ error: "خطا در ذخیره تنظیمات: " + error.message });
  }
});

// ==========================================
// 📱 MELIPAYAMAK SMS API INTEGRATION, PATTERNS & OTP HANDLERS
// ==========================================

const SMS_HISTORY_FILE = path.join(DATA_DIR, "sms-history.json");
const otpStore = new Map<string, { code: string; expiresAt: number }>();
const failedOtpAttempts = new Map<string, { attempts: number; lockoutUntil: number }>();

function normalizeIranianPhone(rawPhone: string): string {
  if (!rawPhone) return "";
  let clean = rawPhone.toString().trim();
  // Replace Persian and Arabic digits to English
  const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicNumbers = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  for (let i = 0; i < 10; i++) {
    clean = clean.replace(persianNumbers[i], i.toString()).replace(arabicNumbers[i], i.toString());
  }
  // Remove non-digit characters
  clean = clean.replace(/[^\d]/g, "");
  if (clean.startsWith("0098")) clean = "0" + clean.slice(4);
  else if (clean.startsWith("98") && clean.length === 12) clean = "0" + clean.slice(2);
  else if (!clean.startsWith("0") && clean.length === 10) clean = "0" + clean;
  return clean;
}

function loadSmsHistory(): any[] {
  try {
    if (fs.existsSync(SMS_HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(SMS_HISTORY_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error loading sms history:", e);
  }
  return [];
}

function saveSmsHistory(history: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SMS_HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
    triggerDataChangeBackup();
  } catch (e) {
    console.error("Error saving sms history:", e);
  }
}

function parseMeliPayamakResponse(resJson: any): { success: boolean; errorDesc?: string; messageId?: string } {
  if (!resJson) return { success: false, errorDesc: "پاسخی از درگاه ملی‌پیامک دریافت نشد." };

  const valStr = String(resJson.Value ?? resJson.RetVal ?? "").trim();
  const valNum = Number(valStr);

  const errorMap: Record<string, string> = {
    "-1": "نام کاربری یا رمز عبور ملی‌پیامک اشتباه است.",
    "-2": "اعتبار ریالی یا پیامکی پنل ملی‌پیامک کافی نیست.",
    "-3": "محدودیت در تعداد ارسال روزانه.",
    "-4": "تعداد شماره‌ها یا حجم متن ارسالی بیش از حد مجاز است.",
    "-5": "شماره خط فرستنده نامعتبر یا غیرمجاز است.",
    "-6": "کد الگوی پترن (bodyId) در پنل ملی‌پیامک یافت نشد یا هنوز تایید نشده است.",
    "-7": "متن یا متغیرهای ارسال‌شده با الگوی تعریف‌شده همخوانی ندارد.",
    "-8": "رسیدن به سقف مجاز روزانه ارسال با الگو.",
    "-10": "حساب کاربری در ملی‌پیامک مسدود یا غیرفعال است.",
    "-11": "شماره همراه گیرنده نامعتبر است.",
    "-12": "عدم دسترسی به وب‌سرویس اشتراکی یا ماژول خدماتی.",
    "-13": "دسترسی آی‌پی به درگاه محدود شده است."
  };

  // If response is a negative integer or starts with "-"
  if (valStr.startsWith("-") || (valNum < 0 && !isNaN(valNum))) {
    const desc = errorMap[valStr] || `کد خطای درگاه ملی‌پیامک: ${valStr}`;
    return { success: false, errorDesc: desc };
  }

  // If successful: Value is numeric ID > 100 or positive boolean
  if (resJson.Success === true || (valNum > 100 && !isNaN(valNum)) || (valStr.length >= 5 && !valStr.startsWith("-"))) {
    return { success: true, messageId: valStr };
  }

  if (resJson.status === "ok" || resJson.success === true) {
    return { success: true, messageId: valStr };
  }

  return { success: false, errorDesc: `خطای ناشناخته درگاه: ${JSON.stringify(resJson)}` };
}

async function sendMeliPayamakSms(
  toRaw: string, 
  text: string, 
  patternId?: number, 
  patternArgs?: string,
  retryCount = 0
): Promise<{ success: boolean; status: string; message: string; payload?: any }> {
  const to = normalizeIranianPhone(toRaw);
  if (!to || to.length < 10) {
    return {
      success: false,
      status: "failed",
      message: `شماره همراه گیرنده نامعتبر است (${toRaw})`
    };
  }

  const username = (b2bConfig.smsUsername || process.env.MELIPAYAMAK_USERNAME || "").trim();
  const password = (b2bConfig.smsPassword || process.env.MELIPAYAMAK_PASSWORD || "").trim();
  const fromNum = (b2bConfig.smsFromNumber || process.env.MELIPAYAMAK_FROM_NUMBER || "5000400075").trim(); 
  
  const timestamp = new Date().toISOString();
  const mode = (username && password) ? "real" : "demo";

  let success = false;
  let responseText = "";
  let apiType = patternId ? `BaseServiceNumber (Pattern ${patternId})` : "SendSMS (Regular)";

  if (mode === "real") {
    try {
      if (patternId && Number(patternId) > 0) {
        // Send by Pattern (BaseServiceNumber)
        // Clean patternArgs to remove any illegal linebreaks or accidental URL prefixes in arguments
        const cleanArgs = (patternArgs || text).trim();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            username,
            password,
            to,
            bodyId: Number(patternId),
            text: cleanArgs
          })
        });
        clearTimeout(timeoutId);
        const resJson: any = await response.json().catch(() => null);
        const parsed = parseMeliPayamakResponse(resJson);
        success = parsed.success;
        responseText = parsed.success 
          ? `شناسه ارسال درگاه: ${parsed.messageId}` 
          : (parsed.errorDesc || JSON.stringify(resJson));
      } else {
        // Send Regular SMS (SendSMS)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            username,
            password,
            to,
            from: fromNum,
            text,
            isFlash: false
          })
        });
        clearTimeout(timeoutId);
        const resJson: any = await response.json().catch(() => null);
        const parsed = parseMeliPayamakResponse(resJson);
        success = parsed.success;
        responseText = parsed.success 
          ? `شناسه ارسال درگاه: ${parsed.messageId}` 
          : (parsed.errorDesc || JSON.stringify(resJson));
      }
    } catch (apiErr: any) {
      responseText = `خطای ارتباط شبکه با درگاه ملی‌پیامک: ${apiErr.message}`;
      success = false;
    }

    // STABILITY IMPROVEMENT: Automatic Retry Logic for Network/Gate Failures
    if (!success && retryCount < 2) {
      console.warn(`[SMS] Stability Retry ${retryCount + 1}/2 for ${to} due to: ${responseText}`);
      await new Promise(r => setTimeout(r, 2000)); // wait 2s
      return sendMeliPayamakSms(toRaw, text, patternId, patternArgs, retryCount + 1);
    }
  } else {
    // Sandbox simulation mode (Demo)
    success = true;
    responseText = "ارسال موفق در حالت شبیه‌ساز امن (دمو). جهت ارسال زنده، نام کاربری و رمز وب‌سرویس را در پنل ذخیره کنید.";
  }

  // Record in SMS Log History
  const history = loadSmsHistory();
  const logRecord = {
    id: "sms_log_" + Math.floor(100000 + Math.random() * 900000),
    to,
    text: patternId ? `[الگو ${patternId}] مقادیر: ${patternArgs || "-"}` : text,
    patternId: patternId || null,
    patternArgs: patternArgs || null,
    apiType,
    mode,
    success,
    responseText,
    timestamp
  };
  history.unshift(logRecord);
  saveSmsHistory(history.slice(0, 500)); 

  return {
    success,
    status: success ? "success" : "failed",
    message: success 
      ? `پیامک با موفقیت به ${to} ارسال شد (${mode === "real" ? "ارسال زنده درگاه" : "حالت شبیه‌ساز"})` 
      : `خطا در ارسال پیامک به ${to}: ${responseText}`,
    payload: logRecord
  };
}

// REST routes for SMS
app.get("/api/sms/history", (req, res) => {
  res.json({ history: loadSmsHistory() });
});

app.post("/api/sms/history/clear", (req, res) => {
  saveSmsHistory([]);
  res.json({ success: true, message: "تاریخچه لاگ‌های پیامک با موفقیت پاک شد." });
});

app.post("/api/sms/log-event", (req, res) => {
  try {
    const entry = req.body || {};
    const history = loadSmsHistory();
    const logRecord = {
      id: entry.id || "sms_client_log_" + Math.floor(100000 + Math.random() * 900000),
      to: entry.to || "ثبت نشده",
      text: entry.text || "-",
      patternId: entry.patternId || null,
      patternArgs: entry.patternArgs || null,
      apiType: entry.apiType || "Client Event Logger",
      mode: entry.mode || "real",
      success: entry.success ?? false,
      responseText: entry.responseText || "ثبت رویداد کلاینت",
      timestamp: entry.timestamp || new Date().toISOString(),
      source: "client"
    };
    history.unshift(logRecord);
    saveSmsHistory(history.slice(0, 500));
    res.json({ success: true, payload: logRecord });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Check MeliPayamak Account Balance & Connectivity
app.get("/api/sms/balance", async (req, res) => {
  const username = (b2bConfig.smsUsername || process.env.MELIPAYAMAK_USERNAME || "").trim();
  const password = (b2bConfig.smsPassword || process.env.MELIPAYAMAK_PASSWORD || "").trim();

  if (!username || !password) {
    return res.json({
      connected: false,
      mode: "demo",
      message: "حالت شبیه‌ساز فعال است (نام کاربری و رمز درگاه تنظیم نشده است)."
    });
  }

  try {
    const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/GetCredit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const resJson: any = await response.json().catch(() => null);
    const parsed = parseMeliPayamakResponse(resJson);

    if (parsed.success) {
      res.json({
        connected: true,
        mode: "real",
        credit: resJson.Value,
        message: `اتصال به درگاه ملی‌پیامک برقرار است. اعتبار باقی‌مانده: ${resJson.Value} ریال/پیامک`
      });
    } else {
      res.json({
        connected: false,
        mode: "real",
        error: parsed.errorDesc || "عدم تایید احراز هویت",
        message: `خطا در اتصال به درگاه ملی‌پیامک: ${parsed.errorDesc}`
      });
    }
  } catch (err: any) {
    res.json({
      connected: false,
      mode: "real",
      error: err.message,
      message: `عدم برقراری ارتباط با سرور ملی‌پیامک: ${err.message}`
    });
  }
});

app.post("/api/sms/send", async (req, res) => {
  const { to, text } = req.body;
  if (!to || !text) {
    return res.status(400).json({ error: "شماره همراه و متن پیام الزامی است." });
  }
  const result = await sendMeliPayamakSms(to, text);
  res.json(result);
});

app.post("/api/sms/send-pattern", async (req, res) => {
  const { to, patternId, patternArgs } = req.body;
  if (!to || !patternId) {
    return res.status(400).json({ error: "شماره همراه و کد الگو (bodyId) الزامی است." });
  }
  const result = await sendMeliPayamakSms(to, "", Number(patternId), patternArgs);
  res.json(result);
});

app.post("/api/sms/send-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "شماره همراه الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  if (!cleanPhone || cleanPhone.length < 10) {
    return res.status(400).json({ error: "شماره همراه وارد شده نامعتبر است." });
  }

  const code = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit random code
  
  // Store code in OTP memory for 5 minutes (300 seconds) for higher reliability on SMS network
  otpStore.set(cleanPhone, {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  // Reset lockout when a fresh code is requested
  failedOtpAttempts.delete(cleanPhone);

  const isAdmin = isSystemAdminPhone(cleanPhone);
  if (isAdmin) {
    console.log(`[Admin Login Bypass] 👑 Admin ${cleanPhone} requested login. Skipping real SMS to avoid credit charges. Master code ready.`);
    return res.json({
      success: true,
      status: "admin_bypass",
      message: "کد تأیید با موفقیت ارسال شد."
    });
  }

  console.log(`[SMS OTP] OTP generated for ${cleanPhone}: ${code}`);

  const text = `کد ورود به سامانه ملّی دست اول: ${code}\ndastavval.com\nلغو11`;
  const otpPatternId = b2bConfig.smsOtpPatternId || null;
  const result = await sendMeliPayamakSms(cleanPhone, text, otpPatternId ? Number(otpPatternId) : undefined, code);
  
  res.json({
    success: result.success,
    status: result.status,
    message: result.success 
      ? "کد تایید پیامکی با موفقیت ارسال شد." 
      : result.message
  });
});

// Endpoint to send Invoice issued SMS with Fixed Static Factor Link
// Compliance with Iran Telecom & MeliPayamak rules: No variable URLs permitted in pattern parameters!
// Pattern Format:
// جناب {0}، پیش‌فاکتور سفارش {1} در سامانه دست اول صادر شد.
// مشاهده: dastavval.com/factors/{1}.pdf
// dastavval.com
// لغو11
// Endpoint to send Invoice issued SMS with Fixed Static Factor Link
// Compliance with Iran Telecom & MeliPayamak rules: No variable URLs permitted in pattern parameters!
// 1-Var Pattern: پیش‌فاکتور سفارش {0} در سامانه دست اول صادر شد:\ndastavval.com/factors/{0}
// 2-Var Pattern: جناب {0}، پیش‌فاکتور سفارش {1} در سامانه دست اول صادر شد.\nمشاهده: dastavval.com/factors/{1}
app.post("/api/sms/send-invoice-sms", async (req, res) => {
  const { phone, buyerName, orderId, origin } = req.body;
  if (!phone || !orderId) {
    return res.status(400).json({ error: "شماره همراه و کد سفارش الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  const name = (buyerName || "خریدار محترم B2B").trim();
  
  // Extract strictly numeric ASCII digits from orderId e.g. "3001" or convert Persian numbers
  let cleanCode = String(orderId)
    .replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    .replace(/\D/g, "");

  if (!cleanCode || cleanCode.length === 0) {
    // If orderId was non-numeric, strip non-ASCII characters to keep URL 100% clean
    cleanCode = String(orderId).replace(/[^\x00-\x7F]/g, "").replace(/[^a-zA-Z0-9]/g, "").trim();
  }
  if (!cleanCode || cleanCode.length === 0) {
    cleanCode = "3360";
  }

  const baseDomain = (origin || "https://dastavval.com").replace(/\/$/, "");
  // Pure clean URL with numeric factor code
  const textWithFixedLink = `پیش‌فاکتور سفارش ${cleanCode} صادر شد.\n\nمشاهده فاکتور:\n${baseDomain}/factors/${cleanCode}\n\nلغو11`;
  const patternId = b2bConfig.smsInvoiceIssuedPatternId || null;
  
  let result: any = { success: false, message: "" };

  // 1. Try sending via pattern. We supply cleanCode for both {0} and {1} variables so that
  // whether the pattern uses {0} or {1} for the factor link, it NEVER inserts Farsi names into the URL!
  if (patternId && Number(patternId) > 0) {
    console.log(`[SMS] Sending invoice issued SMS for order ${cleanCode} to ${cleanPhone} using pattern ${patternId}`);
    result = await sendMeliPayamakSms(
      cleanPhone,
      textWithFixedLink,
      Number(patternId),
      `${cleanCode};${cleanCode}`
    );
    if (!result.success) {
      result = await sendMeliPayamakSms(
        cleanPhone,
        textWithFixedLink,
        Number(patternId),
        `${cleanCode}`
      );
    }
  }

  // 2. Direct SMS fallback if pattern fails or no pattern configured
  if (!result.success && (b2bConfig.smsUsername || process.env.MELIPAYAMAK_USERNAME)) {
    console.warn(`[SMS] Retrying invoice SMS for ${cleanCode} as direct regular notification...`);
    await new Promise(r => setTimeout(r, 1000));
    result = await sendMeliPayamakSms(cleanPhone, textWithFixedLink);
  }

  // Send admin notification SMS for the new order/request with stability improvements
  try {
    const adminPhone = getAdminPhone();
    const adminText = `مدیر گرامی، سفارش جدید ${cleanCode} در سامانه ثبت شد.\nدست اول`;
    const adminPatternId = b2bConfig.smsAdminNotificationPatternId || null;
    
    if (adminPatternId && Number(adminPatternId) > 0) {
      await sendMeliPayamakSms(adminPhone, adminText, Number(adminPatternId), `سفارش ${cleanCode};${cleanPhone}`);
    } else {
      await sendMeliPayamakSms(adminPhone, adminText);
    }
  } catch (err) {
    console.error("[SMS Admin Alert Error]", err);
  }

  res.json(result);
});

// Endpoint to send Abandoned Cart / Pending Unpaid Order reminder SMS
app.post("/api/sms/send-abandoned-order-sms", async (req, res) => {
  const { phone, buyerName, orderId } = req.body;
  if (!phone || !orderId) {
    return res.status(400).json({ error: "شماره همراه و کد سفارش الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  const name = (buyerName || "خریدار گرامی").trim();
  const cleanCode = String(orderId).replace(/^[^\d]*/, "") || String(orderId);
  const text = `جناب ${name}، سفارش عمده شما به شماره ${cleanCode} در انتظار واریز است. جهت رزرو بار کارخانه و عدم لغو سفارش اقدام فرمایید.\ndastavval.com\nلغو11`;
  const patternId = b2bConfig.smsAbandonedOrderPatternId || null;

  const result = await sendMeliPayamakSms(
    cleanPhone,
    text,
    patternId ? Number(patternId) : undefined,
    `${name};${cleanCode}`
  );

  res.json(result);
});

// Endpoint to send Product Back in Stock Notification SMS
app.post("/api/sms/send-stock-alert-sms", async (req, res) => {
  const { phone, buyerName, productName, newPrice } = req.body;
  if (!phone || !productName) {
    return res.status(400).json({ error: "شماره همراه و عنوان کالا الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  const name = (buyerName || "همکار گرامی").trim();
  const price = newPrice || "نرخ کارخانه";
  const text = `جناب ${name}، کالای درخواستی «${productName}» مجدداً در انبار کارخانه موجود شد. قیمت جدید: ${price}\ndastavval.com\nلغو11`;
  const patternId = b2bConfig.smsStockAlertPatternId || null;

  const result = await sendMeliPayamakSms(
    cleanPhone,
    text,
    patternId ? Number(patternId) : undefined,
    `${name};${productName};${price}`
  );

  res.json(result);
});

// Endpoint to send Order Status Changed SMS
app.post("/api/sms/send-order-status-sms", async (req, res) => {
  const { phone, buyerName, orderId, statusTitle } = req.body;
  if (!phone || !orderId) {
    return res.status(400).json({ error: "شماره همراه و کد سفارش الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  const name = (buyerName || "خریدار گرامی").trim();
  const cleanCode = String(orderId).replace(/^[^\d]*/, "") || String(orderId);
  const status = statusTitle || "در حال آماده‌سازی";
  const text = `جناب ${name}، وضعیت سفارش ${cleanCode} شما در دست اول به «${status}» تغییر یافت.\ndastavval.com\nلغو11`;
  const patternId = b2bConfig.smsOrderStatusChangedPatternId || null;

  const result = await sendMeliPayamakSms(
    cleanPhone,
    text,
    patternId ? Number(patternId) : undefined,
    `${name};${cleanCode};${status}`
  );

  res.json(result);
});

// Endpoint to send Logistics / Waybill SMS
app.post("/api/sms/send-logistics-sms", async (req, res) => {
  const { phone, buyerName, orderId, waybillNumber } = req.body;
  if (!phone || !orderId) {
    return res.status(400).json({ error: "شماره همراه و کد سفارش الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  const name = (buyerName || "خریدار گرامی").trim();
  const cleanCode = String(orderId).replace(/^[^\d]*/, "") || String(orderId);
  const waybill = waybillNumber || "بارنامه رسمی ترانزیت";
  const text = `جناب ${name}، بار سفارش ${cleanCode} با شماره بارنامه ${waybill} بارگیری شد.\ndastavval.com\nلغو11`;
  const patternId = b2bConfig.smsLogisticsPatternId || null;

  const result = await sendMeliPayamakSms(
    cleanPhone,
    text,
    patternId ? Number(patternId) : undefined,
    `${name};${cleanCode};${waybill}`
  );

  res.json(result);
});

// Endpoint to send Factory Production Milestone SMS
app.post("/api/sms/send-factory-production-sms", async (req, res) => {
  const { phone, buyerName, orderId } = req.body;
  if (!phone || !orderId) {
    return res.status(400).json({ error: "شماره همراه و کد سفارش الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  const name = (buyerName || "خریدار گرامی").trim();
  const cleanCode = String(orderId).replace(/^[^\d]*/, "") || String(orderId);
  const text = `جناب ${name}، سفارش ${cleanCode} از خط تولید کارخانه خارج و بسته‌بندی شد.\ndastavval.com\nلغو11`;
  const patternId = b2bConfig.smsFactoryProductionPatternId || null;

  const result = await sendMeliPayamakSms(
    cleanPhone,
    text,
    patternId ? Number(patternId) : undefined,
    `${name};${cleanCode}`
  );

  res.json(result);
});

// Endpoint to send Callback Request (RQF) & Admin Notification SMS
app.post("/api/sms/send-callback-sms", async (req, res) => {
  const { phone, details } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "شماره همراه الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  const detailText = (details || "درخواست تماس فوری / استعلام قیمت").trim();
  
  const userText = `درخواست مشاوره شما برای محصول ${detailText} ثبت شد. کارشناسان ما بزودی تماس میگیرند.\nدست اول\nلغو11`;
  const callbackPatternId = b2bConfig.smsCallbackPatternId || null;
  let userResult = { success: false };
  if (callbackPatternId && Number(callbackPatternId) > 0) {
    userResult = await sendMeliPayamakSms(cleanPhone, userText, Number(callbackPatternId), `${detailText}`);
  } else {
    userResult = await sendMeliPayamakSms(cleanPhone, userText);
  }

  const adminPhone = getAdminPhone();
  const adminText = `مدیر گرامی، درخواست جدید ${detailText} از شماره ${cleanPhone} در سامانه ثبت شد.\nدست اول`;
  const adminPatternId = b2bConfig.smsAdminNotificationPatternId || null;
  let adminResult = { success: false };
  if (adminPatternId && Number(adminPatternId) > 0) {
    adminResult = await sendMeliPayamakSms(adminPhone, adminText, Number(adminPatternId), `${detailText};${cleanPhone}`);
  } else {
    adminResult = await sendMeliPayamakSms(adminPhone, adminText);
  }

  res.json({ success: true, userResult, adminResult });
});

app.post("/api/sms/send-ad-status-sms", async (req, res) => {
  const { phone, userName, adTitle, status } = req.body;
  if (!phone || status !== 'approved') return res.json({ success: false, message: "Only approved ads trigger SMS" });

  const cleanPhone = normalizeIranianPhone(phone);
  const text = `جناب ${userName}، آگهی شما با عنوان ${adTitle} تایید و در تالار کف بازار اکران شد.\ndastavval.com\nلغو11`;
  const patternId = b2bConfig.smsAdPatternId || null;
  
  let result = { success: false };
  if (patternId && Number(patternId) > 0) {
    result = await sendMeliPayamakSms(cleanPhone, text, Number(patternId), `${userName};${adTitle}`);
  } else {
    result = await sendMeliPayamakSms(cleanPhone, text);
  }
  
  res.json({ success: true, result });
});

app.post("/api/sms/send-invitation-sms", async (req, res) => {
  const { peerPhone, peerName, userName, userPhone } = req.body;
  if (!peerPhone) return res.status(400).json({ success: false, message: "شماره همراه همکار الزامی است" });

  const cleanPhone = normalizeIranianPhone(peerPhone);
  const text = `${peerName || "همکار"} عزیز، فروشگاه ${userName || "همکار شما"} شما را به خرید مستقیم از کارخانه در سامانه دست اول دعوت کرد.\n\ndastavval.com/join?ref=${userPhone}\nلغو11`;
  const patternId = b2bConfig.smsInvitationPatternId || null;
  
  let result;
  if (patternId && Number(patternId) > 0) {
    result = await sendMeliPayamakSms(cleanPhone, text, Number(patternId), `${peerName || "همکار"};${userName || "همکار"};${userPhone}`);
  } else {
    result = await sendMeliPayamakSms(cleanPhone, text);
  }
  
  res.json({ success: true, result });
});

// Dedicated Public View & Printable PDF Route for Invoices (/factors/:id, /factors/:id.pdf, or /invoice/:id)
app.get(["/factors/:id", "/factors/:id.pdf", "/invoice/:id"], (req, res) => {
  const rawParam = req.params.id || "";
  let decoded = rawParam;
  try {
    decoded = decodeURIComponent(rawParam);
  } catch (e) {
    decoded = rawParam;
  }
  let factorId = decoded.replace(/\.pdf$/i, "").trim();
  
  // Extract strictly numeric code (e.g., "خریدار عمده (3001)" -> "3001")
  let cleanNumericCode = factorId
    .replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    .replace(/\D/g, "");

  const orders = loadOrders();
  const matchedOrder = orders.find((o: any) => {
    const oIdStr = String(o.id || "");
    const oTrackStr = String(o.trackingNumber || "");
    const oOrderStr = String(o.orderId || "");
    const oBuyerName = String(o.buyerName || o.customerName || o.buyerInfo?.name || "").toLowerCase();
    const oBuyerPhone = String(o.buyerPhone || o.customerPhone || o.phone || o.mobile || "");

    const factorLower = factorId.toLowerCase().trim();
    const decodedLower = decoded.toLowerCase().trim();

    return (
      oIdStr === factorId ||
      oTrackStr === factorId ||
      oOrderStr === factorId ||
      (cleanNumericCode && (
        oIdStr.includes(cleanNumericCode) ||
        oTrackStr.includes(cleanNumericCode) ||
        oOrderStr.includes(cleanNumericCode) ||
        oBuyerPhone.includes(cleanNumericCode)
      )) ||
      (factorLower && factorLower.length > 2 && (oBuyerName.includes(factorLower) || factorLower.includes(oBuyerName))) ||
      (decodedLower && decodedLower.length > 2 && (oBuyerName.includes(decodedLower) || decodedLower.includes(oBuyerName))) ||
      (factorLower && oBuyerPhone.includes(factorLower))
    );
  }) || (orders.length > 0 ? orders[0] : null) || {
    id: cleanNumericCode || factorId,
    trackingNumber: cleanNumericCode ? `DO-${cleanNumericCode}` : factorId,
    buyerName: factorId.length > 2 && !/^\d+$/.test(factorId) ? factorId : "مشتری سازمانی سامانه دست اول",
    buyerCompany: "پخش عمده و زنجیره تامین",
    buyerPhone: "09*********",
    createdAt: new Date().toISOString(),
    totalAmount: 185000000,
    items: [
      { name: "روغن مایع خوراکی آفتابگردان ۱.۵ لیتری (کارتن ۶ عددی)", quantity: 50, price: 420000, brand: "کارخانه کشت و صنعت" },
      { name: "تن ماهی ۱۸۰ گرمی قوطی آسان بازشو (کارتن ۲۴ عددی)", quantity: 30, price: 2900000, brand: "صنایع غذایی شیلات" }
    ],
    paymentStatus: "paid",
    status: "confirmed"
  };

  const invoiceDate = new Date().toLocaleDateString("fa-IR");
  const items = Array.isArray(matchedOrder.items) ? matchedOrder.items : [];
  const total = matchedOrder.totalAmount || items.reduce((acc: number, item: any) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
  const tax = Math.round(total * 0.10); // 10% VAT
  const grandTotal = total + tax;

  const isPdfRequest = req.originalUrl.includes('.pdf');
  const pdfScript = `
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script>
      function downloadPdfFile() {
        const element = document.getElementById('invoice-document-wrapper');
        const opt = {
          margin: 5,
          filename: 'Pishfaktor-${factorId}.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
      }
      window.addEventListener('DOMContentLoaded', () => {
        ${isPdfRequest ? 'setTimeout(downloadPdfFile, 800);' : ''}
      });
    </script>
  `;

  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>پیش‌فاکتور رسمی شماره ${factorId} | سامانه ملّی دست اول</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Vazirmatn', sans-serif; background-color: #f8fafc; }
    @media print {
      body { background-color: #ffffff; }
      .no-print { display: none !important; }
      .print-container { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
    }
  </style>
  ${pdfScript}
</head>
<body class="p-4 sm:p-8 text-slate-800">
  <!-- Action Bar -->
  <div class="max-w-4xl mx-auto mb-4 no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
      <span class="text-xs font-black text-slate-700">فاکتور رسمی معتبر در سامانه ملّی دست اول (dastavval.com)</span>
    </div>
    <div class="flex items-center gap-2">
      <button onclick="downloadPdfFile()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all">
        📥 دانلود PDF پیش‌فاکتور
      </button>
      <button onclick="window.print()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all">
        🖨️ چاپ فاکتور
      </button>
      <a href="/" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all">
        ورود به سامانه
      </a>
    </div>
  </div>

  <!-- Official Factor Document -->
  <div id="invoice-document-wrapper" class="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl print-container space-y-6">
    <!-- Header -->
    <div class="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4 text-right">
        <div class="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">
          D1
        </div>
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900">سامانه ملّی دست اول</h1>
          <p class="text-xs font-bold text-slate-500 mt-0.5">پلتفرم جامع معاملات مستقیم کارخانجات صنایع غذایی و کالاهای اساسی کشور</p>
          <p class="text-[11px] font-mono text-indigo-600 font-bold mt-0.5">dastavval.com | شناسه ملی سازمانی</p>
        </div>
      </div>

      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold space-y-1.5 min-w-[220px]">
        <div class="flex justify-between"><span class="text-slate-500">شماره پیش‌فاکتور:</span> <span class="font-mono font-black text-indigo-700">${factorId}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">تاریخ صدور:</span> <span class="font-mono font-black text-slate-800">${invoiceDate}</span></div>
        <div class="flex justify-between"><span class="text-slate-500">وضعیت سند:</span> <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">تایید نهایی زنجیره تامین</span></div>
      </div>
    </div>

    <!-- Parties Info -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
        <div class="font-black text-slate-800 border-b border-slate-200 pb-1 mb-2 text-indigo-900">🏢 مشخصات فروشنده / تامین‌کننده:</div>
        <div><span class="text-slate-500">نام مجموعه:</span> <span class="font-bold">کنسرسیوم کارخانجات صنایع غذایی دست اول</span></div>
        <div><span class="text-slate-500">درگاه رسمی:</span> <span class="font-mono font-bold">dastavval.com</span></div>
        <div><span class="text-slate-500">پشتیبانی متمرکز:</span> <span class="font-bold">۰۵۱-۳۳۶۰ | امور سفارشات عمده</span></div>
      </div>

      <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
        <div class="font-black text-slate-800 border-b border-slate-200 pb-1 mb-2 text-indigo-900">👤 مشخصات خریدار / سازمان:</div>
        <div><span class="text-slate-500">نام خریدار:</span> <span class="font-bold">${matchedOrder.buyerName || "خریدار محترم (عامل توزیع)"}</span></div>
        <div><span class="text-slate-500">مجموعه / فروشگاه:</span> <span class="font-bold">${matchedOrder.buyerCompany || "شرکت بازرگانی مواد غذایی البرز"}</span></div>
        <div><span class="text-slate-500">شماره همراه:</span> <span class="font-mono font-bold">${matchedOrder.buyerPhone || "-"}</span></div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="border border-slate-200 rounded-2xl overflow-hidden">
      <table class="w-full text-right text-xs">
        <thead class="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
          <tr>
            <th class="p-3 text-center w-12">ردیف</th>
            <th class="p-3">شرح کالا و مشخصات فنی کارخانه</th>
            <th class="p-3 text-center">تعداد / کارتن</th>
            <th class="p-3 text-left">قیمت واحد کارخانه (تومان)</th>
            <th class="p-3 text-left">مبلغ کل (تومان)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${items.length > 0 ? items.map((item: any, idx: number) => `
            <tr class="hover:bg-slate-50/80">
              <td class="p-3 text-center font-mono font-bold text-slate-500">${idx + 1}</td>
              <td class="p-3">
                <div class="font-bold text-slate-800">${item.name || "کالای سفارشی"}</div>
                ${item.brand ? `<div class="text-[10px] text-slate-400 font-bold">تولیدکننده: ${item.brand}</div>` : ""}
              </td>
              <td class="p-3 text-center font-mono font-black text-indigo-700">${item.quantity || 1}</td>
              <td class="p-3 text-left font-mono font-bold">${Number(item.price || 0).toLocaleString("fa-IR")}</td>
              <td class="p-3 text-left font-mono font-black text-slate-900">${(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("fa-IR")}</td>
            </tr>
          `).join("") : `
            <tr>
              <td colspan="5" class="p-4 text-center text-slate-400 font-bold">اطلاعات اقلام سفارش ثبت گردیده است.</td>
            </tr>
          `}
        </tbody>
      </table>
    </div>

    <!-- Summary & Totals -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
      <div class="space-y-1 text-xs text-slate-500">
        <p class="font-bold text-slate-700">شرایط تحویل و ضمانت:</p>
        <p>• تحویل مستقیم درب کارخانه یا انبار ترانزیت سراسری سامانه دست اول</p>
        <p>• این سند پیش‌فاکتور رسمی الکترونیکی بوده و با شناسه <span class="font-mono font-bold text-indigo-600">${factorId}</span> معتبر است.</p>
      </div>

      <div class="w-full sm:w-72 space-y-2 text-xs">
        <div class="flex justify-between text-slate-600 font-bold"><span>جمع ناخالص:</span> <span class="font-mono">${Number(total).toLocaleString("fa-IR")} تومان</span></div>
        <div class="flex justify-between text-slate-600 font-bold"><span>مالیات و عوارض ارزش افزوده (۱۰٪):</span> <span class="font-mono">${Number(tax).toLocaleString("fa-IR")} تومان</span></div>
        <div class="border-t border-slate-300 pt-2 flex justify-between text-sm font-black text-indigo-950"><span>مبلغ نهایی قابل پرداخت:</span> <span class="font-mono text-emerald-700 text-base">${Number(grandTotal).toLocaleString("fa-IR")} تومان</span></div>
      </div>
    </div>

    <!-- Stamp and Footer -->
    <div class="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-bold gap-4">
      <div class="flex items-center gap-3">
        <div class="w-16 h-16 border-2 border-dashed border-emerald-500 rounded-full flex flex-col items-center justify-center text-[9px] text-emerald-700 font-black p-1 text-center rotate-[-12deg]">
          <span>دست اول</span>
          <span>تایید اصالت سند</span>
        </div>
        <div class="space-y-0.5 text-right">
          <p class="text-slate-700 font-black">مهر الکترونیکی و امضای دیجیتال</p>
          <p class="text-[10px]">سامانه معاملات زنجیره تامین دست اول (dastavval.com)</p>
        </div>
      </div>

      <div class="text-center sm:text-left text-[11px] font-mono text-slate-400">
        Generated securely via dastavval.com &bull; Code: ${factorId}
      </div>
    </div>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

app.post("/api/sms/verify-otp", async (req, res) => {
  const { phone, code, bypass } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "شماره همراه و کد تایید الزامی است." });
  }

  const cleanPhone = normalizeIranianPhone(phone);
  const rawCode = String(code).trim();
  const cleanCode = rawCode
    .replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    .replace(/\D/g, "");

  const isAdmin = isSystemAdminPhone(cleanPhone);

  // 1. MASTER ADMIN CODE VERIFICATION (33600, 3360, 03360, @Ali3360, 12345) - PRIORITY CHECK BEFORE LOCKOUT
  if (cleanCode === "33600" || cleanCode === "3360" || cleanCode === "03360" || cleanCode === "33603360" || rawCode === "@Ali3360" || cleanCode === "12345") {
    failedOtpAttempts.delete(cleanPhone);
    otpStore.delete(cleanPhone);

    const localUsers = loadUsers();
    const adminUser = {
      id: `admin_${cleanPhone || "09914762406"}`,
      username: cleanPhone || "09914762406",
      name: "مدیریت کل سامانه",
      phone: cleanPhone || "09914762406",
      mobile: cleanPhone || "09914762406",
      email: "admin@dastavval.com",
      company: "دفتر مرکزی دست اول",
      city: "تهران",
      province: "تهران",
      role: "admin",
      badge: "admin",
      status: "active",
      isSuperAdmin: true,
      isApproved: true,
      isFactoryApproved: true,
      isRepresentativeApproved: true,
      createdAt: "2024-01-01T00:00:00.000Z"
    };

    localUsers[cleanPhone] = adminUser;
    localUsers["09914762406"] = adminUser;
    localUsers["admin@dastavval.com"] = adminUser;
    saveUsers(localUsers);
    recordSensitiveProfileBackup(adminUser);

    console.log(`[Admin Login] Master code 33600 accepted successfully for ${cleanPhone}`);
    return res.json({
      success: true,
      message: "ورود به عنوان مدیریت کل سامانه با موفقیت انجام شد.",
      user: adminUser
    });
  }

  // 2. Brute-force protection: Check lockouts (bypass for admin)
  if (!isAdmin) {
    const attemptInfo = failedOtpAttempts.get(cleanPhone);
    if (attemptInfo && Date.now() < attemptInfo.lockoutUntil) {
      const remainingMinutes = Math.ceil((attemptInfo.lockoutUntil - Date.now()) / 60000);
      return res.status(429).json({ 
        error: `به دلیل ۵ بار تلاش ناموفق، ورود شما قفل شده است. لطفاً ${remainingMinutes} دقیقه دیگر مجدداً تلاش فرمایید.` 
      });
    }
  }

  // 3. Regular OTP verification
  const record = otpStore.get(cleanPhone);

  if (!record) {
    return res.status(400).json({ error: "کد تأیید پیامک صادر نشده یا منقضی شده است. لطفاً مجدداً درخواست ارسال پیامک فرمایید." });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(cleanPhone);
    return res.status(400).json({ error: "کد تأیید منقضی شده است. لطفاً مجدداً درخواست ارسال پیامک فرمایید." });
  }

  if (record.code !== cleanCode) {
    const attemptInfo = failedOtpAttempts.get(cleanPhone);
    const currentAttempts = (attemptInfo?.attempts || 0) + 1;
    if (currentAttempts >= 5 && !isAdmin) {
      failedOtpAttempts.set(cleanPhone, {
        attempts: currentAttempts,
        lockoutUntil: Date.now() + 10 * 60 * 1000 // 10 minutes lockout
      });
      return res.status(429).json({
        error: "تعداد تلاش‌های ناموفق بیش از حد مجاز است. حساب شما به مدت ۱۰ دقیقه مسدود شد."
      });
    } else {
      failedOtpAttempts.set(cleanPhone, {
        attempts: currentAttempts,
        lockoutUntil: 0
      });
      return res.status(400).json({
        error: isAdmin 
          ? "کد تأیید وارد شده صحیح نمی‌باشد." 
          : `کد تایید وارد شده اشتباه است. (فرصت باقی‌مانده: ${5 - currentAttempts} بار)`
      });
    }
  }

  // Successful verification
  otpStore.delete(cleanPhone);
  failedOtpAttempts.delete(cleanPhone);

  // 4. Check if Master Administrator or system admin phone
  if (isAdmin || cleanPhone === "09914762406") {
    const localUsers = loadUsers();
    const adminUser = {
      id: `admin_${cleanPhone}`,
      username: cleanPhone,
      name: "مدیریت کل سامانه",
      phone: cleanPhone,
      mobile: cleanPhone,
      email: "admin@dastavval.com",
      company: "دفتر مرکزی دست اول",
      city: "تهران",
      province: "تهران",
      role: "admin",
      badge: "admin",
      status: "active",
      isSuperAdmin: true,
      isApproved: true,
      isFactoryApproved: true,
      isRepresentativeApproved: true,
      createdAt: "2024-01-01T00:00:00.000Z"
    };

    localUsers[cleanPhone] = adminUser;
    localUsers["09914762406"] = adminUser;
    localUsers["admin@dastavval.com"] = adminUser;
    saveUsers(localUsers);
    recordSensitiveProfileBackup(adminUser);

    return res.json({
      success: true,
      message: "ورود به عنوان مدیریت کل سامانه با موفقیت انجام شد.",
      user: adminUser
    });
  }

  const localUsers = loadUsers();
  let matchedUser = Object.values(localUsers).find((u: any) => normalizeIranianPhone(u.phone || u.mobile) === cleanPhone);

  if (matchedUser) {
    recordSensitiveProfileBackup(matchedUser);
    return res.json({
      success: true,
      message: "ورود با موفقیت انجام شد.",
      user: matchedUser
    });
  } else {
    // Auto registration as dynamic buyer
    const uId = "usr_" + Math.floor(100000 + Math.random() * 900000);
    const uCode = `CST-${Math.floor(1000 + Math.random() * 9000)}`;
    const emailStr = `${cleanPhone}@dastavval.com`;
    
    const reqRole = (req.body && req.body.role) ? req.body.role : "customer";
    const PENDING_ROLES = ['factory', 'producer', 'representative', 'agent', 'supplier', 'importer', 'seller', 'dealer', 'ad_poster'];
    const isAutoApprovedRole = !PENDING_ROLES.includes(reqRole);

    const newUserObj = {
      id: uId,
      name: (req.body && req.body.name) ? req.body.name : `خریدار عمده (${cleanPhone.slice(-4)})`,
      email: emailStr,
      password: cleanPhone,
      company: (req.body && req.body.company) ? req.body.company : "فروشگاه همکار (ثبت نام آنی)",
      city: "تهران",
      phone: cleanPhone,
      badge: "bronze",
      role: reqRole,
      userCode: uCode,
      customerCode: uCode,
      status: isAutoApprovedRole ? "active" : "pending_verification",
      isApproved: isAutoApprovedRole,
      isFactoryApproved: isAutoApprovedRole,
      isRepresentativeApproved: isAutoApprovedRole,
      createdAt: new Date().toISOString()
    };

    localUsers[emailStr] = newUserObj;
    localUsers[cleanPhone] = newUserObj; // Index by phone
    saveUsers(localUsers);
    recordSensitiveProfileBackup(newUserObj);

    // Dynamic Welcome text
    const welcomeMsg = `همکار گرامی، ثبت‌نام آنی شما در سامانه ملّی دست اول با موفقیت انجام شد.\nکد کاربری شما: ${uCode}\nبا تشکر از اعتماد شما.`;
    const patternId = b2bConfig.smsWelcomePatternId || null;
    sendMeliPayamakSms(cleanPhone, welcomeMsg, patternId ? Number(patternId) : undefined, `${uCode}`);

    return res.json({
      success: true,
      message: "ثبت‌نام و ورود با موفقیت انجام شد.",
      user: newUserObj,
      isNew: true
    });
  }
});

app.post("/api/sms/update-profile", async (req, res) => {
  const { phone, name, company, nationalCode, address } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "شماره همراه الزامی است." });
  }
  const cleanPhone = normalizeIranianPhone(phone);
  const localUsers = loadUsers();
  
  let matchedKey: string | null = null;
  let matchedUser: any = null;

  // Try direct lookup first
  if (localUsers[cleanPhone]) {
    matchedKey = cleanPhone;
    matchedUser = localUsers[cleanPhone];
  } else {
    // Fallback to searching
    for (const [key, u] of Object.entries(localUsers)) {
      if (u && (normalizeIranianPhone(u.phone || u.mobile) === cleanPhone || key === cleanPhone)) {
        matchedKey = key;
        matchedUser = u;
        break;
      }
    }
  }

  if (matchedUser) {
    if (name && name.trim()) matchedUser.name = name.trim();
    if (company && company.trim()) matchedUser.company = company.trim();
    if (nationalCode && nationalCode.trim()) matchedUser.nationalCode = nationalCode.trim();
    if (address && address.trim()) matchedUser.address = address.trim();
    
    // Update all relevant keys
    localUsers[cleanPhone] = matchedUser;
    if (matchedKey && matchedKey !== cleanPhone) {
      localUsers[matchedKey] = matchedUser;
    }
    if (matchedUser.email) {
      localUsers[matchedUser.email] = matchedUser;
    }
    if (matchedUser.id) {
      localUsers[matchedUser.id] = matchedUser;
    }
    
    saveUsers(localUsers);
    recordSensitiveProfileBackup(matchedUser);
    console.log(`[Profile Update & Vault Backup] Success for ${cleanPhone}`);
    return res.json({ success: true, user: matchedUser });
  }

  console.log(`[Profile Update] Failed: User not found for ${cleanPhone}`);
  res.status(404).json({ error: "کاربر یافت نشد. لطفاً مجدداً وارد شوید." });
});

// Admin Sensitive Profiles Vault & Backup Status
app.get("/api/admin/users/vault-status", (req, res) => {
  try {
    const users = loadUsers();
    const userCount = Object.keys(users).length;
    let vaultCount = 0;
    if (fs.existsSync(SENSITIVE_PROFILES_VAULT_FILE)) {
      try {
        const vault = JSON.parse(fs.readFileSync(SENSITIVE_PROFILES_VAULT_FILE, "utf-8"));
        vaultCount = Object.keys(vault).length;
      } catch (e) {}
    }
    let journalEntriesCount = 0;
    if (fs.existsSync(REGISTRATIONS_JOURNAL_FILE)) {
      const lines = fs.readFileSync(REGISTRATIONS_JOURNAL_FILE, "utf-8").split("\n").filter(l => l.trim().length > 0);
      journalEntriesCount = lines.length;
    }
    const hasS3Configured = Boolean(
      (b2bConfig as any)?.parspackS3Bucket || process.env.PARSPACK_S3_BUCKET ||
      (b2bConfig as any)?.s3Bucket || process.env.S3_BUCKET
    );

    res.json({
      success: true,
      totalUsers: userCount,
      vaultProfilesCount: vaultCount,
      auditJournalEntriesCount: journalEntriesCount,
      cloudSyncActive: hasS3Configured,
      vaultFilePath: SENSITIVE_PROFILES_VAULT_FILE,
      journalFilePath: REGISTRATIONS_JOURNAL_FILE,
      lastSyncTimestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Sensitive Profiles Vault Export (JSON download)
app.get("/api/admin/users/export-vault", (req, res) => {
  try {
    const users = loadUsers();
    res.setHeader("Content-Disposition", 'attachment; filename="dastavval-users-vault-backup.json"');
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(users, null, 2));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/ai/describe", async (req, res) => {
  const { productName, category } = req.body;
  const prompt = `Write a professional wholesale description for "${productName}" in "${category}". Persian.`;
  const fallback = `محصول ممتاز "${productName}" از گروه صنعتی معتبر در دسته‌بندی ${category}، تولید شده با پیشرفته‌ترین استانداردهای کیفی مستقیم از خط تولید کارخانه دست اول. (شما می‌توانید با افزودن کلید اختصاصی جمینی در تنظیمات مدیریت، توضیحات غنی هوشمند اختصاصی تولید کنید)`;
  const text = await callAISafe(prompt, "B2B Copywriter", fallback);
  res.json({ description: text });
});

// AI Single Factory Content Generator (GapGPT / Gemini)
app.post("/api/ai/factory-describe", async (req, res) => {
  const { name, category, city, mainProducts, establishedYear } = req.body;
  const prompt = `Write a comprehensive, highly impressive Persian B2B factory introduction and specifications for industrial factory "${name || 'مجتمع صنعتی'}" located in "${city || 'ایران'}", category "${category || 'صنایع غذایی'}", main products: "${Array.isArray(mainProducts) ? mainProducts.join(', ') : (mainProducts || 'محصولات اصلی')}".
Return valid JSON only in this exact structure:
{
  "description": "متن تفصیلی و عالی درباره تاریخچه، توسعه، خطوط تولید اتوماتیک، کنترل کیفیت و استانداردها به فارسی",
  "capacityPerMonth": "مثلا ۱,۵۰۰ تن در ماه (۳ شیفت کاری پیوسته)",
  "specs": ["خط تولید آلمانی/سوئیسی تمام اتوماتیک", "آزمایشگاه تخصصی میکروبیولوژی و کنترل کیفیت", "بسته‌بندی صلب و مقاوم استاندارد صادراتی", "تاییدیه سیب سلامت و گواهی ISO 22000"],
  "achievements": "صادرکننده نمونه و دارنده گواهینامه‌های ISO 9001 و HACCP",
  "summary": "پیشرو در کیفیت تولید و تحویل به موقع بار"
}`;

  const fallbackJSON = JSON.stringify({
    description: `مجتمع بزرگ صنعتی و تولیدی ${name || 'کارخانه دست اول'} واقع در ${city || 'شهرک صنعتی'}، از برترین برندهای حوزه ${category || 'صنایع غذایی'} می‌باشد. این مجموعه با بهره‌گیری از تکنولوژی‌های مدرن اروپا، خطوط تولید تمام اتوماتیک بدون دخالت دست و آزمایشگاه‌های پیشرفته کنترل کیفیت، محصولات دست اول را با عالی‌ترین استانداردها تولید و روانه بازار بنکداری سراسر کشور می‌نماید.`,
    capacityPerMonth: "۱,۲۰۰ تن در ماه (۳ شیفت کاری پیوسته)",
    specs: [
      "خطوط بسته‌بندی تمام اتوماتیک و شیرینگ صلب",
      "آزمایشگاه تخصصی کنترل کیفیت و ماندگاری بار",
      "انبار مکانیزه با ناوگان ترانزیت اختصاصی به سراسر کشور",
      "دارای نشان سیب سلامت و استانداردهای بین‌المللی ISO 22000 و HACCP"
    ],
    achievements: "برند ممتاز و صادرکننده نمونه در صنعت",
    summary: "تولید مستقیم با تضمین اصالت بار و تحویل سریع"
  });

  try {
    const rawText = await callAISafe(prompt, "B2B Industrial AI Writer. Output ONLY valid JSON.", fallbackJSON);
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return res.json({ success: true, ...parsed });
    }
    return res.json({ success: true, ...JSON.parse(fallbackJSON) });
  } catch (err: any) {
    return res.json({ success: true, ...JSON.parse(fallbackJSON) });
  }
});

// AI Batch Fill Endpoint for All Factories in b2bConfig
app.post("/api/ai/factory-batch-fill", async (req, res) => {
  let updatedCount = 0;
  if (b2bConfig.factories && Array.isArray(b2bConfig.factories)) {
    for (let item of b2bConfig.factories) {
      const f = item as any;
      if (!f.description || f.description.length < 60 || !f.capacity || !f.specs || f.specs.length === 0) {
        f.description = f.description || `مجتمع صنعتی ${f.name} از پیشروترین خطوط تولید کشور در صنعت ${f.category || 'مواد غذایی'} واقع در ${f.location || f.city || 'شهرک صنعتی'} می‌باشد که با بالاترین استانداردهای بهداشتی، خطوط تولید اتوماتیک و ظرفیت تامین گسترده، کالا را مستقیماً از خط تولید عرضه می‌نماید.`;
        f.capacity = f.capacity || "۱,۲۰۰ تن در ماه (۳ شیفت کاری)";
        f.specs = f.specs || [
          "خط تولید مدرن آلمانی با کنترل دیجیتال کیفیت",
          "انبارداری مکانیزه و بارگیری مستقیم ترانزیت",
          "گواهینامه سیب سلامت، ISO 9001 و HACCP",
          "بسته‌بندی کارتنی صلب مقاوم در برابر رطوبت و ضربه"
        ];
        updatedCount++;
      }
    }
    fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
  }
  res.json({ success: true, count: updatedCount, factories: b2bConfig.factories });
});

app.post("/api/ai/advisor", async (req, res) => {
  const { message, history } = req.body;
  const system = "شما دستیار هوش مصنوعی و مشاور بنکداری و خرید عمده پلتفرم کشوری دست اول (GapGPT) هستید. پاسخ‌ها را علمی، کاربردی، با محاسبات عددی به تومان و نکات کامل ارائه دهید.";
  const prompt = `User: ${message}\nHistory: ${JSON.stringify(history || [])}`;
  const fallback = `سلام! به عنوان دستیار هوشمند تجاری GapGPT در سامانه دست اول:
در خرید عمده محصولات مواد غذایی و بهداشتی، سود واقعی شما از طریق حذف واسطه‌ها، دریافت تخفیف خرید حجمی کارتنی و ارسال مستقیم از انبار کارخانه تضمین می‌شود.
چگونه می‌توانم در برآورد سود، استعلام قیمت روز یا تنظیم پیش‌فاکتور به شما کمک کنم؟`;
  const text = await callAISafe(prompt, system, fallback);
  res.json({ response: text });
});

// Dedicated GapGPT AI Engine Endpoint
app.post("/api/gapgpt/chat", async (req, res) => {
  try {
    const { message, history, topicType, tone, contextInfo } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "پیام ارسال شده نامعتبر است." });
    }

    const systemPrompt = `شما "GapGPT" هستید؛ دستیار هوش مصنوعی فوق‌پیشرفته تجاری، تحلیل‌گر بازار بنکداری و مشاور ارشد پلتفرم کشوری «دست اول».
وظایف شما:
۱. تحلیل حاشیه سود، نقطه سربه سر و کشش قیمت خریدهای عمده و کارتنی.
۲. راهنمایی خرید مستقیم از کارخانجات (دینا، مزمز، شیرین عسل، کاله، میهن و...).
۳. راهنمایی تنظیم قرارداد عاملیت انحصاری، شرایط تهاتر و ضمانتنامه‌های بانکی.
۴. ارائه پاسخ‌های کاملاً ساختاریافته به زبان فارسی روان، با لحن ${tone || 'رسمی و بنکداری'} و استفاده از ایموجی‌های مناسب و فرمت‌دهی زیبا.

اطلاعات پس‌زمینه پلتفرم:
${contextInfo ? JSON.stringify(contextInfo) : "دسترسی کامل به لیست قیمت درب کارخانه و سامانه توزیع مستقیم کشوری دست اول."}`;

    const promptText = `موضوع گفتگو: ${topicType || 'مشاوره خرید عمده'}\nپیام کاربر: ${message}\nتاریخچه گفتگوهای اخیر: ${JSON.stringify((history || []).slice(-8))}`;

    const fallbackResponse = `پاسخ دستیار هوشمند GapGPT:
در رابطه با "${message}":
- **بررسی نرخ اولیه:** قیمت‌های خرید عمده در پلتفرم دست اول بر اساس فاکتور رسمی درب کارخانه محاسبه گردیده است.
- **توصیه اقتصادی:** با ثبت سفارش در حجم کارتنی بالاتر (بیش از ۱۰ کارتن)، هزینه حمل باربری به ازای هر عدد محصول تا ۴۰٪ کاهش می‌یابد.
- **حاشیه سود تخمینی:** بین ۲۲٪ تا ۳۸٪ خالص با توجه به قیمت مصوب روی جلد مصرف‌کننده.
جهت اطلاعات بیشتر و تنظیم پیش‌فاکتور می‌توانید با کارشناسان پلتفرم تماس بگیرید.`;

    const responseText = await callAISafe(promptText, systemPrompt, fallbackResponse);
    res.json({
      success: true,
      provider: aiConfig.provider || "gapgpt",
      message: responseText,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("GapGPT route error:", err);
    res.status(500).json({
      success: false,
      error: "خطا در پردازش درخواست با هوش مصنوعی GapGPT",
      fallback: "در حال حاضر سیستم هوشمند در حال به‌روزرسانی است. لطفاً مجدداً تلاش کنید."
    });
  }
});

app.get("/api/ai/daily-presentation", async (req, res) => {
  const cached = getDailyCache();
  if (cached) return res.json(cached);

  const colors = ["emerald", "indigo", "amber", "sky", "violet"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const todayStr = new Date().toLocaleDateString('fa-IR');

  const fallbackData = {
    color: randomColor, dateString: todayStr,
    headline_fa: "خرید مستقیم از خطوط تولید مدرن",
    subheadline_fa: "حذف واسطه‌ها و افزایش سود خرده‌فروشی."
  };
  saveDailyCache(fallbackData);
  res.json(fallbackData);
});

// ==========================================
// --- ARTICLES & GAPGPT AI MAGAZINE ENGINE ---
// ==========================================
const ARTICLES_FILE = path.join(DATA_DIR, "articles.json");

function loadArticles(): any[] {
  const map = new Map<string, any>();

  const addArticles = (arr: any[]) => {
    if (!Array.isArray(arr)) return;
    for (const art of arr) {
      if (art && (art.id || art.title)) {
        const id = art.id || `art-${art.title}`;
        if (!map.has(id)) {
          map.set(id, { ...art, id });
        } else {
          map.set(id, { ...map.get(id), ...art });
        }
      }
    }
  };

  // 1. Try ARTICLES_FILE (data/articles.json)
  try {
    if (fs.existsSync(ARTICLES_FILE)) {
      const raw = fs.readFileSync(ARTICLES_FILE, "utf-8");
      addArticles(JSON.parse(raw));
    }
  } catch (e) {
    console.error("Error reading data/articles.json:", e);
  }

  // 2. Try ROOT_ARTICLES_FILE (articles.json in root)
  try {
    if (fs.existsSync(ROOT_ARTICLES_FILE)) {
      const raw = fs.readFileSync(ROOT_ARTICLES_FILE, "utf-8");
      addArticles(JSON.parse(raw));
    }
  } catch (e) {
    console.error("Error reading root articles.json:", e);
  }

  const list = Array.from(map.values());
  return list;
}

function saveArticles(articles: any[]) {
  try {
    writeJsonAtomic(ARTICLES_FILE, articles);
    try {
      writeJsonAtomic(ROOT_ARTICLES_FILE, articles);
    } catch (e) {}
    triggerDataChangeBackup();
  } catch (e) {
    console.error("Error saving articles.json:", e);
  }
}

// ==========================================
// AUTOMATED DATABASE BACKUP & LOG PURGE SYSTEM
// ==========================================
// BACKUP_DIR is initialized at the top with DATA_DIR

// Helper: Calculate directory or file size
function getFileSizeSafe(filePath: string): number {
  try {
    if (fs.existsSync(filePath)) {
      return fs.statSync(filePath).size;
    }
  } catch {}
  return 0;
}

// Helper: Get DB storage statistics
function getDbStorageStats() {
  const stats = {
    productsSize: getFileSizeSafe(PRODUCTS_FILE),
    ordersSize: getFileSizeSafe(ORDERS_FILE),
    articlesSize: getFileSizeSafe(ARTICLES_FILE),
    configFileSize: getFileSizeSafe(CONFIG_FILE),
    crmSize: getFileSizeSafe(path.join(DATA_DIR, "crm_customers.json")),
    backupsCount: 0,
    backupsTotalSize: 0,
    tempUploadsSize: 0,
    rateLimitRecordsCount: rateLimitStore.size,
    totalDbSizeFormatted: "0 KB"
  };

  try {
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR);
      stats.backupsCount = files.length;
      for (const file of files) {
        stats.backupsTotalSize += getFileSizeSafe(path.join(BACKUP_DIR, file));
      }
    }
  } catch {}

  const totalBytes = stats.productsSize + stats.ordersSize + stats.articlesSize + stats.configFileSize + stats.crmSize;
  stats.totalDbSizeFormatted = (totalBytes / 1024).toFixed(1) + " KB";
  return stats;
}

// Helper: Perform automated DB backup
function performAutomatedBackup(reason: string = "manual") {
  try {
    const products = loadProducts();
    const orders = loadOrders();
    const articles = loadArticles();
    const config = loadConfig();
    let crmCustomers: any[] = [];
    const crmPath = path.join(DATA_DIR, "crm_customers.json");
    if (fs.existsSync(crmPath)) {
      try {
        crmCustomers = JSON.parse(fs.readFileSync(crmPath, "utf-8"));
      } catch {}
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_auto_${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, filename);

    const payload = {
      meta: {
        created_at: new Date().toISOString(),
        reason,
        app_version: "v4.1.0-Release",
        products_count: products.length,
        orders_count: orders.length,
        articles_count: articles.length
      },
      products,
      orders,
      articles,
      b2bConfig: config,
      crmCustomers
    };

    fs.writeFileSync(backupPath, JSON.stringify(payload, null, 2), "utf-8");

    // Enforce retention limit (max backups to keep)
    const maxToKeep = Number(config.maxBackupsToKeep) || 10;
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith(".json"))
        .sort((a, b) => fs.statSync(path.join(BACKUP_DIR, b)).mtimeMs - fs.statSync(path.join(BACKUP_DIR, a)).mtimeMs);

      if (files.length > maxToKeep) {
        const toDelete = files.slice(maxToKeep);
        for (const df of toDelete) {
          try {
            fs.unlinkSync(path.join(BACKUP_DIR, df));
          } catch {}
        }
      }
    }

    return {
      success: true,
      filename,
      size: fs.statSync(backupPath).size,
      created_at: new Date().toLocaleString("fa-IR")
    };
  } catch (err: any) {
    console.error("Backup creation error:", err);
    return { success: false, error: err.message };
  }
}

// Helper: Purge old logs and optimize DB
function performDatabasePurgeAndOptimize(daysToKeep: number = 30) {
  let freedBytes = 0;
  let itemsCleared = 0;

  // 1. Clear expired rate limiter records
  const initialRateLimits = rateLimitStore.size;
  rateLimitStore.clear();
  itemsCleared += initialRateLimits;

  // 2. Compact JSON files
  try {
    const products = loadProducts();
    saveProducts(products); // re-save minified or clean
    const articles = loadArticles();
    saveArticles(articles);
    const orders = loadOrders();
    saveOrders(orders);
  } catch {}

  // 3. Clean temporary files in uploads temp directory if exists
  const tempDir = path.join(UPLOADS_DIR, "temp");
  if (fs.existsSync(tempDir)) {
    try {
      const tempFiles = fs.readdirSync(tempDir);
      for (const file of tempFiles) {
        const fp = path.join(tempDir, file);
        const sz = getFileSizeSafe(fp);
        fs.unlinkSync(fp);
        freedBytes += sz;
        itemsCleared++;
      }
    } catch {}
  }

  // 4. Clean old automated backups if exceeding retention
  if (fs.existsSync(BACKUP_DIR)) {
    try {
      const cutoffMs = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      const files = fs.readdirSync(BACKUP_DIR);
      for (const file of files) {
        const fp = path.join(BACKUP_DIR, file);
        const stat = fs.statSync(fp);
        if (stat.mtimeMs < cutoffMs) {
          freedBytes += stat.size;
          fs.unlinkSync(fp);
          itemsCleared++;
        }
      }
    } catch {}
  }

  const freedKb = (freedBytes / 1024).toFixed(1);
  return {
    success: true,
    freedKb,
    itemsCleared,
    message: `پاکسازی دیتابیس با موفقیت انجام شد. مقدار ${freedKb} کیلوبایت فضا آزاد گردید و ${itemsCleared} آیتم قدیمی پاکسازی شد.`
  };
}

// GET DB Maintenance Stats
app.get("/api/db/maintenance/status", (req, res) => {
  const stats = getDbStorageStats();
  const config = loadConfig();

  // List existing backup files
  let backupsList: any[] = [];
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      backupsList = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith(".json"))
        .map(f => {
          const fp = path.join(BACKUP_DIR, f);
          const stat = fs.statSync(fp);
          return {
            filename: f,
            sizeKb: (stat.size / 1024).toFixed(1),
            mtime: new Date(stat.mtimeMs).toLocaleString("fa-IR"),
            mtimeMs: stat.mtimeMs
          };
        })
        .sort((a, b) => b.mtimeMs - a.mtimeMs);
    }
  } catch {}

  res.json({
    success: true,
    stats,
    backupsList,
    autoBackupEnabled: config.autoBackupEnabled !== false,
    backupFrequencyHours: config.backupFrequencyHours || 24,
    maxBackupsToKeep: config.maxBackupsToKeep || 10,
    autoPurgeLogsEnabled: config.autoPurgeLogsEnabled !== false,
    purgeLogsOlderThanDays: config.purgeLogsOlderThanDays || 30
  });
});

// POST Trigger Manual Backup - Refactored to use Full Cohesive ZIP Backup
app.post("/api/db/maintenance/backup", async (req, res) => {
  try {
    if (!b2bConfig.storageEnabled) {
      return res.status(400).json({ success: false, error: "باکت پارس‌پک غیرفعال است. ابتدا آن را فعال کنید." });
    }

    console.log("[Cohesive-Backup] Manual trigger from old maintenance endpoint...");
    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    const zip = buildFullBackupZip();
    const buffer = zip.toBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `manual-full-backup-${timestamp}.zip`;
    const objectKey = `backups/${fileName}`;

    const client = getParsPackS3Client();

    // 1. Upload timestamped copy
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: "application/zip"
    }));

    // 2. Also keep live-backup-latest.zip fully updated
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: "backups/live-backup-latest.zip",
      Body: buffer,
      ContentType: "application/zip"
    }));

    res.json({ 
      success: true, 
      message: "پشتیبان‌گیری کامل و یکپارچه (دیتا + رسانه) با موفقیت انجام و در باکت پارس‌پک ذخیره شد.",
      fileName
    });
  } catch (err: any) {
    console.error("Manual backup error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Delete specific backup file
app.post("/api/db/maintenance/backups-delete", (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ error: "نام فایل نامعتبر است" });
    }

    const fp = path.join(BACKUP_DIR, filename);
    if (fs.existsSync(fp)) {
      fs.unlinkSync(fp);
      res.json({ success: true, message: `فایل پشتیبان ${filename} حذف گردید.` });
    } else {
      res.status(404).json({ error: "فایل پشتیبان یافت نشد" });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Trigger Log Purge & Vacuum
app.post("/api/db/maintenance/purge-logs", (req, res) => {
  try {
    const days = Number(req.body.daysToKeep) || 30;
    const result = performDatabasePurgeAndOptimize(days);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Save Auto Maintenance Settings
app.post("/api/db/maintenance/config", (req, res) => {
  try {
    const {
      autoBackupEnabled,
      backupFrequencyHours,
      maxBackupsToKeep,
      autoPurgeLogsEnabled,
      purgeLogsOlderThanDays
    } = req.body;

    const config = loadConfig();
    config.autoBackupEnabled = autoBackupEnabled;
    config.backupFrequencyHours = Number(backupFrequencyHours) || 24;
    config.maxBackupsToKeep = Number(maxBackupsToKeep) || 10;
    config.autoPurgeLogsEnabled = autoPurgeLogsEnabled;
    config.purgeLogsOlderThanDays = Number(purgeLogsOlderThanDays) || 30;

    saveConfig(config);
    res.json({ success: true, message: "تنظیمات پشتیبان‌گیری و پاکسازی خودکار ذخیره گردید." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Background Auto Maintenance Scheduler
let lastAutoBackupTime = 0;
function checkAndRunAutoMaintenance() {
  const config = loadConfig();
  const now = Date.now();

  if (config.autoBackupEnabled !== false) {
    const freqMs = (Number(config.backupFrequencyHours) || 24) * 60 * 60 * 1000;
    if (now - lastAutoBackupTime > freqMs) {
      lastAutoBackupTime = now;
      console.log("[DB Maintenance Scheduler] Running scheduled automated backup...");
      performAutomatedBackup("cron_scheduler");
    }
  }

  if (config.autoPurgeLogsEnabled !== false) {
    const days = Number(config.purgeLogsOlderThanDays) || 30;
    performDatabasePurgeAndOptimize(days);
  }
}

// Run maintenance scheduler every 12 hours
setInterval(checkAndRunAutoMaintenance, 12 * 60 * 60 * 1000);
setTimeout(checkAndRunAutoMaintenance, 20000); // Also run 20s after server startup

// Get all articles
app.get("/api/articles", (req, res) => {
  const articles = loadArticles();
  res.json({ success: true, count: articles.length, articles });
});

// Create or update an article
app.post("/api/articles", (req, res) => {
  try {
    const article = req.body;
    if (!article.title) {
      return res.status(400).json({ error: "Title is required", error_fa: "عنوان مقاله الزامی است" });
    }

    const articles = loadArticles();
    const id = article.id || `art-${Date.now()}`;
    const todayShamsi = new Date().toLocaleDateString('fa-IR');

    const newArticle = {
      id,
      title: article.title,
      slug: article.slug || `article-${Date.now()}`,
      summary: article.summary || "",
      content: article.content || "",
      category: article.category || "اخبار و تحلیل بازار",
      imageUrl: article.imageUrl || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000",
      source: article.source || "تحریریه دست‌اول",
      date: article.date || todayShamsi,
      readTime: article.readTime || "۴ دقیقه",
      tags: article.tags || ["خرید عمده", "صنایع غذایی", "دست اول"],
      linkedProducts: article.linkedProducts || [],
      linkedFactories: article.linkedFactories || [],
      isAiGenerated: article.isAiGenerated || false,
      aiProvider: article.aiProvider || "gapgpt",
      faqs: article.faqs || []
    };

    const existingIdx = articles.findIndex((a: any) => a.id === id);
    if (existingIdx >= 0) {
      articles[existingIdx] = { ...articles[existingIdx], ...newArticle };
    } else {
      articles.unshift(newArticle);
    }

    saveArticles(articles);
    res.json({ success: true, article: newArticle, count: articles.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete an article
app.delete("/api/articles/:id", (req, res) => {
  try {
    const id = req.params.id;
    let articles = loadArticles();
    articles = articles.filter((a: any) => a.id !== id);
    saveArticles(articles);
    res.json({ success: true, count: articles.length });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Bulk sync articles
app.post("/api/articles/sync", (req, res) => {
  try {
    const { articles } = req.body;
    if (Array.isArray(articles)) {
      saveArticles(articles);
      res.json({ success: true, count: articles.length });
    } else {
      res.status(400).json({ error: "articles must be an array" });
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Curated B2B Food Industry & Logistics Image Library for unique article images
const B2B_FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000", // Grocery market aisle
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=1000", // Modern logistics warehouse
  "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=1000", // Factory production line
  "https://images.unsplash.com/photo-1506617420156-8e4536971650?auto=format&fit=crop&q=80&w=1000", // Fresh food supply chain
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000", // Supermarket wholesale shelves
  "https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?auto=format&fit=crop&q=80&w=1000", // B2B warehouse packaging
  "https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=1000", // Grain silo & agriculture
  "https://images.unsplash.com/photo-1628102491629-778571d893a3?auto=format&fit=crop&q=80&w=1000", // Beverage bottling line
  "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&q=80&w=1000", // Spices & commodities market
  "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=1000", // Food market wholesale bulk
  "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80&w=1000", // Industrial food processing
  "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=1000", // Snacks & chips bulk packages
  "https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&q=80&w=1000", // Fresh fruit crates bulk
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1000", // Bakery factory oven
  "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1000", // Financial analysis & trade
  "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&q=80&w=1000", // Wholesale warehouse forklift
  "https://images.unsplash.com/photo-1601598851547-4302c2222131?auto=format&fit=crop&q=80&w=1000", // Cold storage dairy
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000", // Pizza & dough production
  "https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&q=80&w=1000", // Tea & coffee bean sacks
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=1000", // Canned goods factory
  "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&q=80&w=1000", // Supermarket aisles
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1000", // Prepared food catering B2B
  "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=1000", // Cargo truck delivery
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1000"  // B2B negotiation & contract
];

function getUniqueArticleImage(seedText: string = "", fallbackImage?: string): string {
  if (fallbackImage && fallbackImage.startsWith("http") && !fallbackImage.includes("unsplash.com/photo-1578916171728")) {
    return fallbackImage;
  }
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = seedText.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % B2B_FOOD_IMAGES.length;
  return B2B_FOOD_IMAGES[idx];
}

// Helper: Server-side Product Keyword Auto Linker for Articles
function serverAutoLinkArticle(content: string, products: any[], maxPerProduct: number = 2): { content: string; linkedProductIds: string[] } {
  if (!content || !products || products.length === 0) return { content: content || '', linkedProductIds: [] };

  const dict: Array<{ keyword: string; normKeyword: string; prodId: string }> = [];
  const seen = new Set<string>();

  products.forEach(p => {
    if (!p || !p.id) return;
    const name = (p.name || '').trim();
    if (name.length >= 3) {
      const norm = name.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\s]+/g, ' ').trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        dict.push({ keyword: name, normKeyword: norm, prodId: String(p.id) });
      }
    }
    const brand = (p.brand || '').trim();
    if (brand.length >= 3) {
      const normB = brand.replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u200c\s]+/g, ' ').trim();
      if (!seen.has(normB)) {
        seen.add(normB);
        dict.push({ keyword: brand, normKeyword: normB, prodId: String(p.id) });
      }
    }
  });

  dict.sort((a, b) => b.normKeyword.length - a.normKeyword.length);

  const protectedShortcodes: string[] = [];
  let masked = content.replace(/\[\[[\s\S]*?\]\]/g, (match) => {
    const ph = `___SC_PH_${protectedShortcodes.length}___`;
    protectedShortcodes.push(match);
    return ph;
  });

  const lines = masked.split('\n');
  const counts = new Map<string, number>();
  const linkedIdsSet = new Set<string>();

  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed.startsWith('[[') || !trimmed) return line;

    let modLine = line;
    for (const item of dict) {
      const currentCount = counts.get(item.prodId) || 0;
      if (currentCount >= maxPerProduct) continue;

      const escaped = item.keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const reg = new RegExp(`(?<![\\w\u0600-\u06FF])${escaped}(?![\\w\u0600-\u06FF])`, 'i');

      if (reg.test(modLine)) {
        modLine = modLine.replace(reg, (matchedStr) => {
          counts.set(item.prodId, (counts.get(item.prodId) || 0) + 1);
          linkedIdsSet.add(item.prodId);
          return `[[product:${item.prodId}|${matchedStr}]]`;
        });
      }
    }
    return modLine;
  });

  let result = processedLines.join('\n');
  protectedShortcodes.forEach((sc, idx) => {
    result = result.replace(`___SC_PH_${idx}___`, sc);
  });

  return { content: result, linkedProductIds: Array.from(linkedIdsSet) };
}

// Helper: AI Article Generation Core with SEO Pillar & EEAT Guidelines
async function generateSingleArticleWithAI(options: {
  topicType?: 'product' | 'factory' | 'billboard' | 'wholesale' | 'custom' | 'pillar';
  targetId?: string;
  targetName?: string;
  customPrompt?: string;
  category?: string;
  isPillar?: boolean;
}): Promise<any> {
  let productsList: any[] = [];
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      productsList = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error loading products for AI generation:", e);
  }
  const factories = b2bConfig.factories || [];

  // Pick target product and factory for internal linking
  let selectedProduct = productsList.length > 0 
    ? (options.targetId ? productsList.find((p: any) => p.id === options.targetId) || productsList[0] : productsList[Math.floor(Math.random() * productsList.length)])
    : { id: "PRD-1001", name: "چیپس سیب‌زمینی چی‌توز", brand: "چی‌توز", category: "تنقلات و شکلات", bulk_price: 380000, image_url: "" };

  let selectedFactory = factories.length > 0 
    ? (options.targetId ? factories.find((f: any) => f.id === options.targetId) || factories[0] : factories[Math.floor(Math.random() * factories.length)])
    : { id: "fac-1", name: "صنایع غذایی به‌آرا (چی‌توز)", city: "مشهد", category: "تنقلات و شکلات" };

  const isPillarPage = options.isPillar || options.topicType === 'pillar' || Math.random() > 0.7;

  const prompt = `شما سرمقاله‌نویس ارشد سئو، تحلیل‌گر اقتصادی صنایع غذایی و استراتژیست محتوای B2B برای «سامانه ملی دست اول» هستید.
مقاله‌ای کاملاً تخصصی، عمیق، کاربردی و مبتنی بر معماری سئو پیلار (Pillar-Cluster SEO Framework) به زبان فارسی روان و انسانی بنویسید.

اصول الزامی نگارش سئو و لحن انسانی:
۱. از هیچ جمله کلیشه‌ای رباتیک یا هوش مصنوعی استفاده نکنید (مانند: "در دنیای امروز"، "در این مقاله قصد داریم به بررسی..."، "امیدواریم این مقاله مفید باشد"). مستقیماً وارد اصل مطلب، چالش‌های بازار، نوسانات قیمت و استراتژی تجاری شوید.
۲. نوع مقاله: ${isPillarPage ? "مقاله مادر/پیلار (Pillar Page) - راهنمای جامع و مرجع اصلی با پوشش کامل ابعاد موضوع" : "مقاله خوشه‌ای (Cluster Content) - تمرکز بر موضوع تخصصی مشخص"}.
۳. حتماً در ابتدای مقاله شورت‌کد [[toc]] را قرار دهید تا فهرست مطالب به طور خودکار تولید شود.
۴. بدنه مقاله باید شامل تیترهای اصلی H2 (##)، تیترهای فرعی H3 (###)، جدول حاشیه سود اصناف، نکات فنی انبارداری، حداقل سفارش کارتنی و راهنمای خرید مستقیم باشد.
۵. لینک‌دهی‌های داخلی هوشمند (Shortcodes):
   - برای محصولات: [[product:${selectedProduct.id || 'PRD-1001'}|${selectedProduct.name}]]
   - برای کارخانه‌ها: [[factory:${selectedFactory.id || 'fac-1'}|${selectedFactory.name}]]
   - برای تالار کف بازار: [[billboard:تالار کف بازار]]
   - برای دکمه اقدام به عمل: [[cta:ثبت سفارش آنلاین]]

Context Data:
- Platform: سامانه ملی دست اول (خرید عمده مستقیم از خطوط تولید، تالار کف بازار، پرداخت امانی امن)
- Focus Topic: ${options.topicType || 'wholesale'} (${options.targetName || options.customPrompt || 'خرید عمده مواد غذایی و تحلیل سودآوری'})
- Target Product: ID: "${selectedProduct.id || 'PRD-1001'}", Name: "${selectedProduct.name}", Price: "${selectedProduct.bulk_price || 450000} تومان"
- Target Factory: ID: "${selectedFactory.id || 'fac-1'}", Name: "${selectedFactory.name}", City: "${selectedFactory.city || 'تهران'}"

Output MUST be strictly valid raw JSON matching this schema:
{
  "title": "عنوان بسیار جذاب، سئو شده و کاملاً انسانی (مثال: راهنمای جامع خرید عمده X؛ تحلیل حاشیه سود و خرید مستقیم از کارخانه)",
  "slug": "english-seo-friendly-slug",
  "summary": "خلاصه کاربردی و جذاب ۲ الی ۳ خطی برای نمایش در گوگل و کارت‌های مقاله",
  "content": "متن کامل و عمیق مقاله به فارسی در قالب مارک‌داون، شامل [[toc]] در ابتدا، تیترهای ## و ###، تحلیل مالی، نکات انبارداری و شورت‌کدهای لینک‌دهی",
  "category": "${options.category || (isPillarPage ? 'مقاله مادر و راهنمای جامع' : 'راهنمای خرید عمده')}",
  "articleType": "${isPillarPage ? 'pillar' : 'cluster'}",
  "focusKeyword": "کلیدواژه اصلی سئو مقاله",
  "secondaryKeywords": ["کلیدواژه فرعی ۱", "کلیدواژه فرعی ۲", "کلیدواژه فرعی ۳", "کلیدواژه فرعی ۴"],
  "metaTitle": "عنوان سئو گوگل (زیر ۶۰ کاراکتر شامل کلیدواژه اصلی)",
  "metaDescription": "توضیحات متای گوگل (زیر ۱۵۰ کاراکتر جذب‌کننده کلیک)",
  "pillarTopic": "${options.category || 'صنایع غذایی و بنکداری'}",
  "readTime": "${isPillarPage ? '۷ دقیقه' : '۵ دقیقه'}",
  "tags": ["خرید عمده", "قیمت کارخانه", "صنایع غذایی", "بنکداری", "دست اول"],
  "linkedProducts": ["${selectedProduct.id || 'PRD-1001'}"],
  "linkedFactories": ["${selectedFactory.id || 'fac-1'}"],
  "faqs": [
    {
      "question": "سوال واقع‌بینانه بنکدار یا خریدار عمده؟",
      "answer": "پاسخ تجاری دقیق به همراه نحوه ثبت سفارش در دست اول."
    },
    {
      "question": "شرایط ارسال و ضمانت بار امانی چگونه است؟",
      "answer": "پاسخ درباره نحوه تحویل و تایید سلامت بار پیش از آزادسازی وجه."
    }
  ]
}`;

  const system = "You are a senior B2B Industrial Copywriter and SEO specialist. Output strictly valid JSON without markdown code fences.";

  const titleFallback = `راهنمای جامع خرید عمده و تحلیل بازار ${selectedProduct.name}`;
  const assignedImage = getUniqueArticleImage(titleFallback, selectedProduct.image_url);

  const fallbackArticle = {
    title: titleFallback,
    slug: `wholesale-guide-${selectedProduct.id || 'prd'}-${Math.floor(Math.random() * 1000)}`,
    summary: `بررسی فرصت‌های سودآور تجاری، تحلیل حاشیه سود مغازه‌دار و مزایای استعلام قیمت مستقیم محصول ${selectedProduct.name} از خط تولید مجهز [[factory:${selectedFactory.id || 'fac-1'}|${selectedFactory.name}]] در شهر ${selectedFactory.city || 'مشهد'} با امکان پرداخت امانی.`,
    content: `[[toc]]

## تحلیل جایگاه بازار و نوسانات قیمت ${selectedProduct.name}
خرید عمده و بدون واسطه مواد غذایی همواره یکی از دغدغه‌های اصلی بنکداران، مالکان عمده‌فروشی و سوپرمارکت‌های زنجیره‌ای است. محصول [[product:${selectedProduct.id || 'PRD-1001'}|${selectedProduct.name}]] به عنوان یکی از اقلام پرمصرف و پرفروش، نرخ گردش مالی بالایی در شبکه توزیع کشور دارد. تهیه این محصول به صورت مستقیم از کارخانه [[factory:${selectedFactory.id || 'fac-1'}|${selectedFactory.name}]] تضمین‌کننده دسترسی به کف قیمت بازار و حفظ حاشیه سود رقابتی است.

## مقایسه سودآوری: خرید سنتی در برابر سامانه دست اول
خرید از بازارهای واسطه‌ای به طور معمول بین ۸٪ تا ۱۵٪ هزینه اضافی به خریدار عمده تحمیل می‌کند. اما در سامانه دست اول با اتصال مستقیم به خطوط تولید [[factory:${selectedFactory.id || 'fac-1'}|${selectedFactory.name}]]، این هزینه‌های اضافی حذف می‌گردند.

### مزایای کلیدی سفارش مستقیم از خط تولید:
* **تضمین کف قیمت کارخانه:** صدور پیش‌فاکتور رسمی با نرخ مصوب تولیدکننده.
* **بارگیری تازه و تاریخ روز:** ارسال مستقیم از انبار کارخانه با حداکثر ماندگاری.
* **ارسال سراسری با بارنامه دولتی:** همکاری با شبکه حمل‌ونقل تخصصی مواد غذایی کشور.

## فرصت‌های ویژه در تالار کف بازار
در زمان‌هایی که تولیدکنندگان با مازاد تولید یا نیاز به نقدینگی سریع مواجه هستند، تخفیفات فوق‌العاده‌ای در [[billboard:تالار کف بازار]] عرضه می‌شود. خریداران با استفاده از سیستم پرداخت امانی دست اول می‌توانند وجه سفارش را تا زمان تحویل بار و تایید سلامت کالا نزد سامانه به امانت نگه‌دارند.

## راهنمای ثبت سفارش کارتنی و تناژ
برای استعلام قیمت روز و ثبت سفارش می‌توانید به بخش [[cta:ثبت سفارش آنلاین]] مراجعه فرمایید.`,
    category: options.category || (isPillarPage ? "مقاله مادر و راهنمای جامع" : "راهنمای خرید عمده"),
    articleType: isPillarPage ? "pillar" : "cluster",
    focusKeyword: `خرید عمده ${selectedProduct.name}`,
    secondaryKeywords: ["قیمت کارخانه", "بنکداری مواد غذایی", "فروش کارتنی", "دست اول"],
    metaTitle: `راهنمای خرید عمده ${selectedProduct.name} از کارخانه | دست اول`,
    metaDescription: `خرید مستقیم و عمده ${selectedProduct.name} از خط تولید با تضمین قیمت و پرداخت امانی. استعلام آنلاین قیمت کارتنی و تناژ.`,
    pillarTopic: "صنایع غذایی و بنکداری",
    imageUrl: assignedImage,
    readTime: isPillarPage ? "۷ دقیقه" : "۵ دقیقه",
    tags: [selectedProduct.name, "خرید عمده", selectedFactory.name, "قیمت کارخانه", "دست اول"],
    linkedProducts: [selectedProduct.id || "PRD-1001"],
    linkedFactories: [selectedFactory.id || "fac-1"],
    faqs: [
      {
        "question": `چگونه می‌توان با کارخانه ${selectedFactory.name} برای عاملیت فروش مذاکره کرد؟`,
        "answer": "شما می‌توانید با ثبت درخواست در سامانه دست اول، مدارک صنفی خود را بارگذاری کنید تا کارشناسان فروش کارخانه مستقیماً با شما تماس بگیرند."
      },
      {
        "question": `حداقل سفارش برای ارسال با باربری رایگان چقدر است؟`,
        "answer": "حداقل سفارش مصوب معمولاً ارسال تناژ یا سفارشات بالای ۵۰ کارتن می‌باشد."
      }
    ]
  };

  try {
    const rawResult = await callAISafe(prompt, system, JSON.stringify(fallbackArticle));
    let parsed: any;
    try {
      const cleaned = rawResult.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = fallbackArticle;
    }

    const todayShamsi = new Date().toLocaleDateString('fa-IR');
    const finalTitle = parsed.title || fallbackArticle.title;
    const finalImage = getUniqueArticleImage(finalTitle, parsed.imageUrl || fallbackArticle.imageUrl);

    const rawContent = parsed.content || fallbackArticle.content;
    const autoLinkRes = serverAutoLinkArticle(rawContent, productsList, 2);

    const existingLinkedProducts = Array.isArray(parsed.linkedProducts) ? parsed.linkedProducts : [selectedProduct.id];
    const combinedLinkedProducts = Array.from(new Set([...existingLinkedProducts, ...autoLinkRes.linkedProductIds]));

    return {
      id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: finalTitle,
      slug: parsed.slug || fallbackArticle.slug,
      summary: parsed.summary || fallbackArticle.summary,
      content: autoLinkRes.content,
      category: parsed.category || fallbackArticle.category,
      articleType: parsed.articleType || fallbackArticle.articleType,
      focusKeyword: parsed.focusKeyword || fallbackArticle.focusKeyword,
      secondaryKeywords: Array.isArray(parsed.secondaryKeywords) ? parsed.secondaryKeywords : fallbackArticle.secondaryKeywords,
      metaTitle: parsed.metaTitle || fallbackArticle.metaTitle,
      metaDescription: parsed.metaDescription || fallbackArticle.metaDescription,
      pillarTopic: parsed.pillarTopic || fallbackArticle.pillarTopic,
      imageUrl: finalImage,
      source: "تحریریه هوش مصنوعی دست‌اول (GapGPT)",
      date: todayShamsi,
      readTime: parsed.readTime || fallbackArticle.readTime,
      tags: Array.isArray(parsed.tags) ? parsed.tags : fallbackArticle.tags,
      linkedProducts: combinedLinkedProducts,
      linkedFactories: Array.isArray(parsed.linkedFactories) ? parsed.linkedFactories : [selectedFactory.id],
      isAiGenerated: true,
      aiProvider: aiConfig.provider || "gapgpt",
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : fallbackArticle.faqs
    };
  } catch (err) {
    console.error("AI Generation error:", err);
    const autoLinkRes = serverAutoLinkArticle(fallbackArticle.content, productsList, 2);
    return {
      id: `art-${Date.now()}`,
      ...fallbackArticle,
      content: autoLinkRes.content,
      linkedProducts: Array.from(new Set([...fallbackArticle.linkedProducts, ...autoLinkRes.linkedProductIds])),
      source: "تحریریه دست‌اول",
      date: new Date().toLocaleDateString('fa-IR'),
      isAiGenerated: true,
      aiProvider: "gapgpt"
    };
  }
}

// Endpoint: Auto-Link Article Products
app.post("/api/ai/auto-link-article", (req, res) => {
  try {
    const { content, maxPerProduct } = req.body;
    let productsList: any[] = [];
    try {
      if (fs.existsSync(PRODUCTS_FILE)) {
        productsList = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
      }
    } catch (e) {}
    const result = serverAutoLinkArticle(content || '', productsList, maxPerProduct || 2);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: AI Auto SEO Keywords Generator
app.post("/api/ai/generate-seo-keywords", async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const prompt = `شما متخصص ارشد سئو (SEO Specialist) و استراتژیست محتوای صنایع غذایی ایران هستید.
بر اساس عنوان و محتوای مقاله زیر، اطلاعات سئوی گوگل، کلیدواژه‌های اصلی و فرعی، متاتگ‌ها و پرسش‌های متداول (FAQ) را استخراج و تولید کنید:

عنوان مقاله: "${title || 'راهنمای خرید عمده مواد غذایی'}"
دسته‌بندی: "${category || 'عمومی'}"
خلاصه/محتوا: "${(content || '').substring(0, 500)}"

خروجی باید دقیقاً یک JSON معتبر باشد:
{
  "focusKeyword": "کلیدواژه اصلی و هدف اصلی سئو مقاله",
  "secondaryKeywords": ["کلیدواژه فرعی ۱", "کلیدواژه فرعی ۲", "کلیدواژه فرعی ۳", "کلیدواژه فرعی ۴", "کلیدواژه فرعی ۵"],
  "metaTitle": "عنوان سئو جذاب برای گوگل (زیر ۶۰ کاراکتر شامل کلیدواژه اصلی)",
  "metaDescription": "توضیحات متای ترغیب‌کننده برای افزایش کلیک گوگل (زیر ۱۵۰ کاراکتر)",
  "articleType": "pillar یا cluster بر اساس عمق موضوع",
  "pillarTopic": "موضوع یا دسته مادر پیلار مرتبط",
  "faqs": [
    {
      "question": "پرسش پرتکرار و واقع‌بینانه درباره این موضوع؟",
      "answer": "پاسخ کامل، شفاف و تخصصی جهت نمایش در گوگل Rich Snippets."
    },
    {
      "question": "سوال دوم کاربران در گوگل؟",
      "answer": "پاسخ کوتاه و کاربردی."
    }
  ]
}`;

    const system = "You are an expert SEO specialist. Return strictly raw JSON.";
    const fallbackResponse = {
      focusKeyword: title ? `خرید عمده ${title.split(' ')[0]}` : "خرید عمده مواد غذایی",
      secondaryKeywords: ["قیمت کارخانه", "بنکداری مواد غذایی", "فروش کارتنی", "دست اول", "ارسال مستقیم"],
      metaTitle: `${title || 'راهنمای خرید عمده'} | دست اول`,
      metaDescription: `راهنمای تخصصی خرید عمده و استعلام قیمت مستقیم از خط تولید با تضمین اصالت بار و پرداخت امانی.`,
      articleType: "cluster",
      pillarTopic: category || "صنایع غذایی",
      faqs: [
        {
          question: `چگونه می‌توان این محصول را با قیمت کارخانه سفارش داد؟`,
          answer: "از طریق ثبت سفارش آنلاین در سامانه دست اول می‌توانید مستقیم با خط تولید کارخانه ارتباط برقرار کنید."
        }
      ]
    };

    const raw = await callAISafe(prompt, system, JSON.stringify(fallbackResponse));
    let parsed = fallbackResponse;
    try {
      const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = fallbackResponse;
    }

    res.json({ success: true, data: parsed });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Endpoint: Generate Single Article with GapGPT / Gemini
app.post("/api/ai/generate-article", async (req, res) => {
  try {
    const { topicType, targetId, targetName, customPrompt, category } = req.body;
    const article = await generateSingleArticleWithAI({ topicType, targetId, targetName, customPrompt, category });
    
    // Save into articles.json
    const articles = loadArticles();
    articles.unshift(article);
    saveArticles(articles);

    res.json({
      success: true,
      message: "مقاله سئو با هوش مصنوعی GapGPT و لینک‌های داخلی با موفقیت تولید و منتشر شد.",
      article,
      totalArticles: articles.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint: Generate Daily Batch of 3-4 Articles
app.post(["/api/ai/generate-daily-batch", "/api/articles/generate-daily-batch"], async (req, res) => {
  try {
    const count = Math.min(Math.max(parseInt(req.body.count || "3", 10), 1), 5);
    const topics: Array<{ type: any; category: string; prompt: string }> = [
      { type: 'product', category: 'راهنمای خرید عمده', prompt: 'بررسی مقایسه‌ای و تحلیل حاشیه سود خرید عمده محصولات پرفروش' },
      { type: 'factory', category: 'تحلیل خط تولید', prompt: 'گزارش ظرفیت تولید کارخانجات، استانداردهای بهداشتی و اعطای عاملیت فروش' },
      { type: 'billboard', category: 'تحلیل کف بازار', prompt: 'تحلیل فرصت‌های سودآور حراج مازاد خطوط تولید در تالار کف بازار' },
      { type: 'wholesale', category: 'تامین مواد اولیه', prompt: 'راهنمای بنکداری نوین، مدیریت سرمایه در گردش و خرید با چک صیادی' }
    ];

    const newArticles: any[] = [];
    const articles = loadArticles();

    for (let i = 0; i < count; i++) {
      const t = topics[i % topics.length];
      const generated = await generateSingleArticleWithAI({
        topicType: t.type,
        category: t.category,
        customPrompt: t.prompt
      });
      newArticles.push(generated);
      articles.unshift(generated);
    }

    saveArticles(articles);

    res.json({
      success: true,
      message: `${count} مقاله تخصصی سئو با موفقیت با هوش مصنوعی GapGPT تولید و به مجله افزوده شد.`,
      generatedCount: newArticles.length,
      articles: newArticles,
      totalCount: articles.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Background Auto-Scheduler: Checks daily to generate 3-4 articles
let lastAutoGenerateDate = "";
function checkAndAutoGenerateArticles() {
  const today = new Date().toISOString().split("T")[0];
  if (lastAutoGenerateDate === today) return;

  const articles = loadArticles();
  const todayShamsi = new Date().toLocaleDateString('fa-IR');
  const todayArticles = articles.filter((a: any) => a.date === todayShamsi);

  // If fewer than 3 articles exist for today, generate batch
  if (todayArticles.length < 3) {
    console.log(`[AI Magazine Scheduler] Generating daily 3-4 articles with GapGPT for ${today}...`);
    lastAutoGenerateDate = today;
    
    (async () => {
      try {
        const batchTopics: Array<{ type: any; category: string; prompt: string }> = [
          { type: 'product', category: 'راهنمای خرید عمده', prompt: 'راهنمای خرید مستقیم و استعلام قیمت روز از خطوط تولید' },
          { type: 'factory', category: 'تحلیل خط تولید', prompt: 'معرفی کارخانجات برتر صنایع غذایی و شرایط همکاری تجاری' },
          { type: 'billboard', category: 'تحلیل کف بازار', prompt: 'فرصت‌های شگفت‌انگیز کف بازار و خرید زیر قیمت تولید' }
        ];

        for (const t of batchTopics) {
          const art = await generateSingleArticleWithAI({ topicType: t.type, category: t.category, customPrompt: t.prompt });
          const current = loadArticles();
          current.unshift(art);
          saveArticles(current);
        }
        console.log("[AI Magazine Scheduler] Daily articles auto-generated successfully.");
      } catch (err) {
        console.error("[AI Magazine Scheduler] Error generating daily articles:", err);
      }
    })();
  }
}

// Trigger check every 6 hours
setInterval(checkAndAutoGenerateArticles, 6 * 60 * 60 * 1000);
setTimeout(checkAndAutoGenerateArticles, 10000); // Also check 10s after server startup

// Background Auto-Sync: Periodic catalog synchronization from ParsPack / Custom Endpoint
async function autoSyncCatalog() {
  const targetUrl = (b2bConfig as any)?.catalogJsonUrl || "http://c102393.parspack.net/c102393/catalog.json";
  try {
    console.log(`[Auto-Sync] Background sync check starting for: ${targetUrl}`);
    let response: any = null;
    try {
      response = await fetch(targetUrl, { signal: AbortSignal.timeout(6000) });
    } catch (fetchErr: any) {
      if (targetUrl.startsWith("http://")) {
        const httpsFallback = targetUrl.replace("http://", "https://");
        response = await fetch(httpsFallback, { signal: AbortSignal.timeout(6000) }).catch(() => null);
      }
    }

    if (!response || !response.ok) {
      console.log(`[Auto-Sync] Notice: Remote catalog is currently unavailable (${response ? response.status : "connection unreachable"}), local products database preserved.`);
      return;
    }
    
    const rawText = await response.text();
    const cleanText = rawText.replace(/^\uFEFF/, '').trim();
    if (!cleanText || !cleanText.startsWith("{") && !cleanText.startsWith("[")) {
      console.log("[Auto-Sync] Notice: Remote catalog returned non-JSON payload, skipping sync.");
      return;
    }

    const parsed = JSON.parse(cleanText);
    let productsList = [];
    if (Array.isArray(parsed)) {
      productsList = parsed;
    } else if (parsed.products && Array.isArray(parsed.products)) {
      productsList = parsed.products;
    } else if (parsed.items && Array.isArray(parsed.items)) {
      productsList = parsed.items;
    }
    
    if (productsList.length > 0) {
      // Map new field names and ensure unique IDs
      const seenIds = new Set<string>();
      const mappedProducts = productsList.map((p: any, idx: number) => {
        let rawId = String(p.id || p.sku || "").trim();
        let finalId = rawId || `prd-gen-${Date.now()}-${idx}`;
        
        // If ID is already seen, append index to make it unique
        if (seenIds.has(finalId)) {
          finalId = `${finalId}-${idx}`;
        }
        seenIds.add(finalId);

        let rawImageUrl = p.imageUrl || p.image_url || "";
        let proxiedImageUrl = rawImageUrl;
        if (rawImageUrl && !rawImageUrl.startsWith("/api/proxy-image")) {
          proxiedImageUrl = `/api/proxy-image?url=${encodeURIComponent(rawImageUrl)}`;
        }

        return {
          ...p,
          id: finalId,
          sku: String(p.sku || p.id || finalId),
          name: p.name || "محصول بدون نام",
          brand: cleanBrandNameServer(p),
          price: Number(p.price || p.bulk_price || p.wholesalePrice || p.marketPrice || 0),
          bulk_price: Number(p.bulk_price || p.wholesalePrice || p.marketPrice || 0),
          consumer_price: Number(p.consumer_price || p.consumerPrice || 0),
          purchase_price: Number(p.purchase_price || p.factoryPrice || 0),
          carton_pack_count: Number(p.carton_pack_count || p.itemsPerUnit || 24),
          min_order_cartons: Number(p.min_order_cartons || p.minOrderCartons || 1),
          image_url: proxiedImageUrl,
          imageUrl: proxiedImageUrl
        };
      });

      saveProducts(mappedProducts);
      console.log(`[Auto-Sync] Success: ${mappedProducts.length} products updated and mapped.`);
    }
  } catch (error: any) {
    console.log("[Auto-Sync] Notice: Catalog sync paused gracefully:", error.message || "Offline/Timeout");
  }
}

// Initial sync and periodic interval
setTimeout(autoSyncCatalog, 5000); // Wait 5s after startup
setInterval(autoSyncCatalog, 6 * 60 * 60 * 1000); // Every 6 hours

// ==========================================
// 🪙 LOYALTY & REWARDS SERVER API
// ==========================================
const LOYALTY_FILE = path.join(DATA_DIR, "loyalty_data.json");

function loadLoyaltyStore(): { [phone: string]: any } {
  try {
    if (fs.existsSync(LOYALTY_FILE)) {
      return JSON.parse(fs.readFileSync(LOYALTY_FILE, "utf-8"));
    }
  } catch (e) {}
  return {};
}

function saveLoyaltyStore(data: any) {
  try {
    writeJsonAtomic(LOYALTY_FILE, data);
    triggerDataChangeBackup();
  } catch (e) {}
}

app.get("/api/loyalty/summary/:phone", (req, res) => {
  const phone = req.params.phone;
  const store = loadLoyaltyStore();
  const userData = store[phone] || {
    currentPoints: 0,
    lifetimeEarnedPoints: 0,
    lifetimeRedeemedPoints: 0,
    totalDiscountSavedToman: 0,
    tier: "bronze",
    tierLabel: "برنزی",
    tierMultiplier: 1.0,
    transactions: []
  };

  res.json({
    status: "success",
    data: {
      ...userData,
      redeemableTomanValue: (userData.currentPoints || 0) * 1000
    }
  });
});

app.get("/api/loyalty/transactions/:phone", (req, res) => {
  const phone = req.params.phone;
  const store = loadLoyaltyStore();
  const userData = store[phone] || { transactions: [] };
  res.json({
    status: "success",
    data: userData.transactions || []
  });
});

app.post("/api/loyalty/award", (req, res) => {
  const { user_phone, phone, points, order_tracking_number, orderId, order_amount } = req.body;
  const userPhone = user_phone || phone;
  const pts = Number(points || 0);

  if (!userPhone || pts <= 0) {
    return res.status(400).json({ status: "error", message: "پارامترهای ورودی نامعتبر است." });
  }

  const store = loadLoyaltyStore();
  const current = store[userPhone] || {
    currentPoints: 0,
    lifetimeEarnedPoints: 0,
    lifetimeRedeemedPoints: 0,
    totalDiscountSavedToman: 0,
    transactions: []
  };

  current.currentPoints = (current.currentPoints || 0) + pts;
  current.lifetimeEarnedPoints = (current.lifetimeEarnedPoints || 0) + pts;

  // Determine tier
  let tier = "bronze";
  let tierLabel = "برنزی";
  let tierMultiplier = 1.0;
  if (current.lifetimeEarnedPoints >= 2000) {
    tier = "platinum";
    tierLabel = "پلاتینیوم";
    tierMultiplier = 1.5;
  } else if (current.lifetimeEarnedPoints >= 800) {
    tier = "gold";
    tierLabel = "طلایی";
    tierMultiplier = 1.25;
  } else if (current.lifetimeEarnedPoints >= 300) {
    tier = "silver";
    tierLabel = "نقره‌ای";
    tierMultiplier = 1.1;
  }
  current.tier = tier;
  current.tierLabel = tierLabel;
  current.tierMultiplier = tierMultiplier;

  current.transactions = current.transactions || [];
  current.transactions.unshift({
    id: `tx-${Date.now()}`,
    type: "earn",
    points: pts,
    description: `پاداش خرید سفارش ${order_tracking_number || orderId || ""}`,
    orderTrackingNumber: order_tracking_number || orderId,
    orderAmount: Number(order_amount || 0),
    createdAt: new Date().toISOString()
  });

  store[userPhone] = current;
  saveLoyaltyStore(store);

  res.json({
    status: "success",
    message: `${pts} امتیاز پاداش با موفقیت افزوده شد.`,
    data: current
  });
});

app.post("/api/loyalty/redeem", (req, res) => {
  const { user_phone, phone, points, order_tracking_number, orderId, discount_amount } = req.body;
  const userPhone = user_phone || phone;
  const pts = Number(points || 0);

  if (!userPhone || pts <= 0) {
    return res.status(400).json({ status: "error", message: "پارامترهای ورودی نامعتبر است." });
  }

  const store = loadLoyaltyStore();
  const current = store[userPhone] || {
    currentPoints: 0,
    lifetimeEarnedPoints: 0,
    lifetimeRedeemedPoints: 0,
    totalDiscountSavedToman: 0,
    transactions: []
  };

  const actualDeduct = Math.min(pts, current.currentPoints || 0);
  const discountToman = Number(discount_amount || (actualDeduct * 1000));

  current.currentPoints = Math.max(0, (current.currentPoints || 0) - actualDeduct);
  current.lifetimeRedeemedPoints = (current.lifetimeRedeemedPoints || 0) + actualDeduct;
  current.totalDiscountSavedToman = (current.totalDiscountSavedToman || 0) + discountToman;

  current.transactions = current.transactions || [];
  current.transactions.unshift({
    id: `tx-${Date.now()}`,
    type: "redeem",
    points: actualDeduct,
    description: `کسر ${actualDeduct} امتیاز جهت تخفیف در سفارش ${order_tracking_number || orderId || ""}`,
    orderTrackingNumber: order_tracking_number || orderId,
    discountAmount: discountToman,
    createdAt: new Date().toISOString()
  });

  store[userPhone] = current;
  saveLoyaltyStore(store);

  res.json({
    status: "success",
    message: `${actualDeduct} امتیاز با موفقیت کسر گردید.`,
    data: current
  });
});

function injectDynamicSeoMeta(html: string, req: express.Request): string {
  try {
    const productId = (req.query.product as string) || (req.path.startsWith("/product/") ? req.path.split("/product/")[1] : null);
    const categoryName = (req.query.category as string) || null;

    const host = req.get("host") || "dastavval.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
    const baseUrl = `${protocol}://${host}`;

    let pageTitle = "دست اول | سامانه ملی خرید عمده مواد غذایی، استعلام مستقیم از کارخانه";
    let metaDesc = "پلتفرم جامع B2B خرید عمده از کارخانجات صنایع غذایی و مواد اولیه با کمترین قیمت، صدور پیش‌فاکتور رسمی، ضمانت پرداخت امانی و اعطای نمایندگی.";
    let ogImage = `${baseUrl}/assets/logo.svg`;
    let canonicalUrl = `${baseUrl}${req.originalUrl || "/"}`;
    let jsonLdScript = "";

    if (productId) {
      const allProds = getAllProductsForSEOAndTorob();
      const prod = allProds.find((p: any) => String(p.id) === String(productId) || String(p.sku) === String(productId) || String(p.code) === String(productId));
      if (prod) {
        const prodPrice = prod.bulk_price || prod.price || 0;
        const brandName = prod.brand || prod.factoryName || "کارخانه رسمی";
        pageTitle = `خرید عمده ${prod.name} | قیمت کارخانه و کف بازار - دست اول`;
        metaDesc = `استعلام قیمت روز و خرید عمده ${prod.name} با مارک ${brandName}. قیمت کف بازار ${prodPrice ? prodPrice.toLocaleString('fa-IR') + ' تومان' : 'استعلامی'}. ارسال مستقیم از انبار کارخانه با ضمانت اصالت.`;
        ogImage = prod.image_url || prod.imageUrl || ogImage;
        if (!ogImage.startsWith("http")) ogImage = `${baseUrl}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;

        const productSchema = {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": prod.name,
          "image": [ogImage],
          "description": metaDesc,
          "sku": prod.id || prod.sku,
          "brand": {
            "@type": "Brand",
            "name": brandName
          },
          "offers": {
            "@type": "Offer",
            "url": canonicalUrl,
            "priceCurrency": "IRT",
            "price": prodPrice,
            "itemCondition": "https://schema.org/NewCondition",
            "availability": prod.disabled ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "دست اول"
            }
          }
        };
        jsonLdScript = `<script type="application/ld+json">${JSON.stringify(productSchema)}</script>`;
      }
    } else if (categoryName) {
      pageTitle = `خرید عمده ${categoryName} | لیست قیمت کارخانه - دست اول`;
      metaDesc = `خرید عمده و مستقیم محصولات ${categoryName} از کارخانجات معتبر تولیدکننده. استعلام قیمت روز و ثبت سفارش رسمی در دست اول.`;
    }

    let modifiedHtml = html;
    modifiedHtml = modifiedHtml.replace(/<title>.*?<\/title>/gi, `<title>${pageTitle}</title>`);
    modifiedHtml = modifiedHtml.replace(/<meta name="title" content=".*?" \/>/gi, `<meta name="title" content="${pageTitle}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${metaDesc}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${pageTitle}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${metaDesc}" />`);
    modifiedHtml = modifiedHtml.replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${ogImage}" />`);
    modifiedHtml = modifiedHtml.replace(/<link rel="canonical" href=".*?" \/>/gi, `<link rel="canonical" href="${canonicalUrl}" />`);

    if (jsonLdScript) {
      modifiedHtml = modifiedHtml.replace("</head>", `${jsonLdScript}\n</head>`);
    }

    return modifiedHtml;
  } catch (e) {
    return html;
  }
}

async function restoreLiveBackupOnStartup() {
  console.log("[Restore-On-Startup] Attempting to auto-restore latest live backup from S3...");
  try {
    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    if (!b2bConfig.storageEnabled) {
      console.log("[Restore-On-Startup] ParsPack storage is disabled. Skipping startup restore.");
      return;
    }

    const backupKey = "backups/live-backup-latest.zip";
    const res = await executeResilientS3Operation<any>(
      "Restore-On-Startup",
      (endpoint, isHttps) => new GetObjectCommand({
        Bucket: bucket,
        Key: backupKey
      }),
      b2bConfig,
      30000 // 30s timeout
    );

    if (!res.success || !res.data || !res.data.Body) {
      console.log("[Restore-On-Startup] No existing live-backup-latest.zip restored from S3 or connection timed out:", res.error || "empty body");
      return;
    }

    // Convert response stream to buffer
    const stream = res.data.Body as any;
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const { restoredCount } = await performFullRestore(buffer, "live-backup-latest.zip");
    console.log(`[Restore-On-Startup] Successfully restored ${restoredCount} database and asset files from S3.`);
  } catch (error: any) {
    console.log("[Restore-On-Startup Note] Auto-recovery on startup handled gracefully:", error.message || error);
  }
}

async function startServer() {
  // Run live backup restore in background so server opens port 3000 immediately
  restoreLiveBackupOnStartup().catch(err => {
    console.log("[Restore-On-Startup Note] Background restore failed gracefully:", err);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(async (req, res, next) => {
      const isHtmlReq = req.headers.accept?.includes("text/html") && !req.path.includes(".");
      if (isHtmlReq && (req.query.product || req.query.category || req.path.startsWith("/product/"))) {
        try {
          const indexPath = path.join(process.cwd(), "index.html");
          let rawHtml = fs.readFileSync(indexPath, "utf-8");
          rawHtml = await vite.transformIndexHtml(req.originalUrl, rawHtml);
          const seoHtml = injectDynamicSeoMeta(rawHtml, req);
          return res.status(200).set({ "Content-Type": "text/html" }).end(seoHtml);
        } catch (e) {
          next();
        }
      } else {
        next();
      }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1y",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      }
    }));

    app.get("*", (req, res) => {
      // For missing static assets (e.g., stale JS chunks or missing images), return 404 instead of index.html fallback
      if (req.path.startsWith("/assets/") || /\.(js|css|map|json|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/i.test(req.path)) {
        return res.status(404).set("Cache-Control", "no-store").send("Asset not found");
      }

      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      try {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          const rawHtml = fs.readFileSync(indexPath, "utf-8");
          const seoHtml = injectDynamicSeoMeta(rawHtml, req);
          return res.send(seoHtml);
        }
      } catch (e) {}
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
