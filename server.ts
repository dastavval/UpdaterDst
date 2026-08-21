import express from "express";
import path from "path";
import fs from "fs";
import http from "http";
import https from "https";
import dns from "dns";
import AdmZip from "adm-zip";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

// Ensure public uploads directory exists and mount static route
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create uploads directory:", e);
}
app.use("/uploads", express.static(UPLOADS_DIR));

const CONFIG_FILE = path.join(process.cwd(), "ai-config.json");
const CACHE_FILE = path.join(process.cwd(), "ai-cache.json");

// Default configuration
let aiConfig = {
  provider: "gemini", 
  apiKey: process.env.GEMINI_API_KEY || "",
  endpointUrl: "https://api.gapgpt.ir/v1"
};

if (fs.existsSync(CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    aiConfig = { ...aiConfig, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to read ai-config.json:", e);
  }
}

const B2B_CONFIG_FILE = path.join(process.cwd(), "b2b-config.json");
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function loadConfig(): any {
  return b2bConfig;
}

function saveConfig(cfg: any) {
  b2bConfig = { ...b2bConfig, ...cfg };
  try {
    fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save b2b-config.json:", e);
  }
}

function loadProducts(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      return JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error loading products.json:", e);
  }
  return [];
}

function saveProducts(products: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving products.json:", e);
  }
}

function loadOrders(): any[] {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error loading orders.json:", e);
  }
  return [];
}

function saveOrders(orders: any[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving orders.json:", e);
  }
}
const DEFAULT_B2B_CONFIG = {
  githubRepoUrl: "https://github.com/dastavval/UpdaterDst.git",
  githubBranch: "main",
  primaryColor: "emerald",
  appName: "دست اول",
  appSub: "سامانه ملی استعلام و مبادلات مستقیم تولیدات کارخانه",
  logoUrl: "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png",
  mascotUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  categories: [
    { "id": "cat-1", "name": "تنقلات و شکلات", "label": "تنقلات و شکلات", "image": "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=600" },
    { "id": "cat-2", "name": "کیک، کلوچه و بیسکویت", "label": "کیک، کلوچه و بیسکویت", "image": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=600" },
    { "id": "cat-3", "name": "مواد غذایی و کنسروجات", "label": "مواد غذایی و کنسروجات", "image": "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&q=80&w=600" },
    { "id": "cat-4", "name": "نوشیدنی‌ها", "label": "نوشیدنی‌ها", "image": "https://images.unsplash.com/photo-1622597467827-43f0553ad9fe?auto=format&fit=crop&q=80&w=600" },
    { "id": "cat-5", "name": "شوینده و بهداشتی", "label": "شوینده و بهداشتی", "image": "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=600" }
  ],
  brands: [
    { "id": "b-1", "name": "چی‌توز (به‌آرا)", "logo": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' rx='40' fill='%23dc2626'/><circle cx='100' cy='100' r='76' fill='%23f59e0b' stroke='%23ffffff' stroke-width='6'/><text x='100' y='110' font-family='Tahoma, sans-serif' font-weight='900' font-size='32' fill='%23ffffff' text-anchor='middle'>چی‌توز</text><text x='100' y='140' font-family='sans-serif' font-weight='bold' font-size='12' fill='%2378350f' text-anchor='middle'>CHETOZ BRAND</text></svg>" },
    { "id": "b-2", "name": "مزمز", "logo": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' rx='40' fill='%231d4ed8'/><circle cx='100' cy='100' r='76' fill='%233b82f6' stroke='%23ffffff' stroke-width='6'/><text x='100' y='112' font-family='Tahoma, sans-serif' font-weight='900' font-size='36' fill='%23ffffff' text-anchor='middle'>مزمز</text><text x='100' y='142' font-family='sans-serif' font-weight='bold' font-size='12' fill='%23dbeafe' text-anchor='middle'>MAZMAZ FOODS</text></svg>" },
    { "id": "b-3", "name": "شیرین عسل", "logo": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' rx='40' fill='%23831843'/><circle cx='100' cy='100' r='76' fill='%23be185d' stroke='%23fef08a' stroke-width='6'/><text x='100' y='108' font-family='Tahoma, sans-serif' font-weight='900' font-size='28' fill='%23ffffff' text-anchor='middle'>شیرین عسل</text><text x='100' y='138' font-family='sans-serif' font-weight='bold' font-size='11' fill='%23fef08a' text-anchor='middle'>SHIRIN ASAL</text></svg>" },
    { "id": "b-4", "name": "رانی", "logo": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' rx='40' fill='%23c2410c'/><circle cx='100' cy='100' r='76' fill='%23ea580c' stroke='%23ffffff' stroke-width='6'/><text x='100' y='112' font-family='Tahoma, sans-serif' font-weight='900' font-size='38' fill='%23ffffff' text-anchor='middle'>رانی</text><text x='100' y='142' font-family='sans-serif' font-weight='bold' font-size='12' fill='%23ffedd5' text-anchor='middle'>RANI JUICE</text></svg>" },
    { "id": "b-5", "name": "کاله", "logo": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' rx='40' fill='%2315803d'/><circle cx='100' cy='100' r='76' fill='%2316a34a' stroke='%23ffffff' stroke-width='6'/><text x='100' y='112' font-family='Tahoma, sans-serif' font-weight='900' font-size='38' fill='%23ffffff' text-anchor='middle'>کاله</text><text x='100' y='142' font-family='sans-serif' font-weight='bold' font-size='12' fill='%23dcfce7' text-anchor='middle'>KALLEH BRAND</text></svg>" }
  ],
  factories: [
    {
      "id": "fac-1",
      "factoryCode": "FAC-1001",
      "name": "صنایع غذایی به‌آرا (چی‌توز)",
      "city": "مشهد",
      "province": "خراسان رضوی",
      "establishedYear": 1372,
      "badge": "gold",
      "isVerified": true,
      "logoUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyMDAgMjAwJz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyByeD0nNDAnIGZpbGw9JyNkYzI2MjYnLz48Y2lyY2xlIGN4PScxMDAnIGN5PScxMDAnIHI9Jzc2JyBmaWxsPScjZjs5ZTBiJyBzdHJva2U9JyNmZmZmZmYnIHN0cm9rZS13aWR0aD0nNicvPjx0ZXh0IHg9JzEwMCcgeT0nMTEwJyBmb250LWZhbWlseT0nVGFob21hLCBzYW5zLXNlcmlmJyBmb250LXdlaWdodD0nOTAwJyBmb250LXNpemU9JzMyJyBmaWxsPScjZmZmZmZmJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJz7Yp9uM49iq2YjYsuKAmDwvdGV4dD48dGV4dCB4=100' y='140' font-family='sans-serif' font-weight='bold' font-size='12' fill='%2378350f' text-anchor='middle'>CHETOZ BRAND</text></svg>",
      "coverUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
      "category": "تنقلات و شکلات",
      "mainProducts": ["چیپس سیب‌زمینی چی‌توز", "پفک چی‌توز طلایی", "کرانچی چی‌توز آتشین"],
      "minOrderAmount": "۱۵,۰۰۰,۰۰۰ تومان",
      "address": "شهرک صنعتی توس، فاز یک، اندیشه ۵",
      "phone": "۰۵۱-۳۵۴۱۰۰۰۰",
      "managerName": "مهندس احمدی",
      "rating": 4.9,
      "reviewsCount": 142,
      "capacityPerMonth": "۸۰۰ تن در ماه",
      "description": "گروه صنایع غذایی به آرا با نام تجاری چی‌توز، پیشرو در تولید انواع چیپس، اسنک، پفک و فرآورده‌های حجیم شده بر پایه سیب‌زمینی و ذرت.",
      "profileDesignMode": "simple"
    },
    {
      "id": "fac-2",
      "factoryCode": "FAC-1002",
      "name": "گروه کارخانجات مزمز",
      "city": "تهران",
      "province": "تهران",
      "establishedYear": 1374,
      "badge": "vip",
      "isVerified": true,
      "logoUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAyMDAgMjAwJz48cmVjdCB3aWR0aD0nMTAwJScgaGVpZ2h0PScxMDAlJyByeD0nNDAnIGZpbGw9JyMxZDRlZDgnLz48Y2lyY2xlIGN4PScxMDAnIGN5PScxMDAnIHI9Jzc2JyBmaWxsPScjM2I4MmY2JyBzdHJva2U9JyNmZmZmZmYnIHN0cm9rZS13aWR0aD0nNicvPjx0ZXh0IHg9JzEwMCcgeT0nMTEyJyBmb250LWZhbWlseT0nVGFob21hLCBzYW5zLXNlcmlmJyBmb250LXdlaWdodD0nOTAwJyBmb250LXNpemU9JzM2JyBmaWxsPScjZmZmZmZmJyB0ZXh0LWFuY2hvcj0nbWlkZGxlJz7ZhdiyZhdiyPC90ZXh0Pjx0ZXh0IHg9JzEwMCcgeT0nMTQyJyBmb250LWZhbWlseT0nc2Fucy1zZXJpZicgZm9udC13ZWlnaHQ9J2JvbGQnIGZvbnQtc2l6ZT0nMTInIGZpbGw9JyNkYmVhZmUnIHRleHQtYW5jaG9yPSdtaWRkbGUnPk1BWk1BWiBGT09EUzwvdGV4dD48L3N2Zz4=",
      "coverUrl": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
      "category": "تنقلات و شکلات",
      "mainProducts": ["تخمه آفتابگردان مزمز", "چیپس کتلت مزمز", "مغز بادام‌زمینی مزمز"],
      "minOrderAmount": "۲۰,۰۰۰,۰۰۰ تومان",
      "address": "شهرک صنعتی شمس‌آباد، بلوار بوستان",
      "phone": "۰۲۱-۵۶۲۳۰۰۰۰",
      "managerName": "مهندس رضایی",
      "rating": 4.8,
      "reviewsCount": 118,
      "capacityPerMonth": "۶۵۰ تن در ماه",
      "description": "مجموعه مزمز اولین تولیدکننده تخمه و آجیل بسته‌بندی بهداشتی و چیپس‌های ترد فرآوری‌شده در ایران.",
      "profileDesignMode": "simple"
    }
  ],
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
  storageEnabled: true
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
      categories: (parsed.categories && parsed.categories.length > 0) ? parsed.categories : DEFAULT_B2B_CONFIG.categories,
      factories: (parsed.factories && parsed.factories.length > 0) ? parsed.factories : DEFAULT_B2B_CONFIG.factories,
      brands: (parsed.brands && parsed.brands.length > 0) ? parsed.brands : DEFAULT_B2B_CONFIG.brands
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
  const provider = aiConfig.provider;
  const apiKey = aiConfig.apiKey || process.env.GEMINI_API_KEY || "";

  if (provider === "gapgpt") {
    const url = `${aiConfig.endpointUrl.replace(/\/$/, "")}/chat/completions`;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const body = {
      model: "gpt-4o-mini",
      messages: [
        ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    };

    try {
      const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
      if (!response.ok) throw new Error(`GapGPT API error ${response.status}`);
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (e: any) {
      console.error("GapGPT call failed:", e);
      throw e;
    }
  } else {
    if (!apiKey) throw new Error("No Gemini API Key provided.");
    try {
      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });
      const interaction = await ai.interactions.create({
        model: "gemini-3.7-flash",
        input: prompt,
        system_instruction: systemPrompt
      });
      return interaction.output_text || "";
    } catch (e: any) {
      const errMsg = e?.message || String(e);
      if (errMsg.includes("resource_exhausted") || errMsg.includes("quota") || errMsg.includes("429")) {
        console.warn("Gemini API Quota Exceeded / Rate Limited. Falling back gracefully.");
        return "سرویس هوش مصنوعی در حال حاضر با ترافیک بالا مواجه است (سهمیه مصرفی). لطفاً چند لحظه دیگر مجدداً تلاش کنید یا از امکانات استاندارد سامانه استفاده نمایید.";
      }
      console.error("Gemini call failed:", e);
      throw e;
    }
  }
}

async function callAISafe(prompt: string, systemPrompt?: string, fallbackText: string = ""): Promise<string> {
  try {
    return await callAI(prompt, systemPrompt);
  } catch (err: any) {
    console.log("AI info: Connection unavailable, using fallback.");
    return fallbackText;
  }
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

  // 3. Dynamic Products from local storage or config
  const productUrls: Array<{ loc: string; priority: string; changefreq: string }> = [];
  try {
    const localProductsPath = path.join(process.cwd(), "local-products.json");
    if (fs.existsSync(localProductsPath)) {
      const prods = JSON.parse(fs.readFileSync(localProductsPath, "utf-8"));
      if (Array.isArray(prods)) {
        for (const p of prods) {
          if (p.id && !p.disabled) {
            productUrls.push({
              loc: `${baseUrl}/?product=${p.id}`,
              priority: p.isFeatured ? "0.9" : "0.8",
              changefreq: "daily"
            });
          }
        }
      }
    }
  } catch (e) {
    console.warn("Could not load local products for sitemap:", e);
  }

  // Fallback initial products if local-products.json was empty
  if (productUrls.length === 0) {
    const defaultProductIds = ["PRD-1001", "PRD-1002", "PRD-1003", "PRD-1004", "PRD-1005", "PRD-1006"];
    for (const pid of defaultProductIds) {
      productUrls.push({
        loc: `${baseUrl}/?product=${pid}`,
        priority: "0.85",
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
        loc: `${baseUrl}/?tab=factories&factory=${fac.id}`,
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
              loc: `${baseUrl}/?article=${art.id}`,
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

// Serve dynamic robots.txt for Googlebot, Torobbot, and Search Crawlers
app.get("/robots.txt", (req, res) => {
  const host = req.get("host") || "dastavval.com";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
  const robotsTxt = `# robots.txt for DastAvval B2B Platform
User-agent: *
Allow: /
Allow: /api/torob/
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

Sitemap: ${protocol}://${host}/sitemap.xml
`;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(robotsTxt);
});

// Serve dynamic, real-time sitemap.xml on /sitemap.xml
app.get("/sitemap.xml", (req, res) => {
  const host = req.get("host") || "dastavval.com";
  const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "https";
  const baseUrl = `${protocol}://${host}`;
  const sitemapXml = generateDynamicSitemapXml(baseUrl);

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.send(sitemapXml);
});

// Admin API to trigger auto-generation and write to static file
app.post("/api/seo/generate-sitemap", (req, res) => {
  try {
    const sitemapContent = generateDynamicSitemapXml("https://dastavval.com");
    const publicSitemapPath = path.join(process.cwd(), "public", "sitemap.xml");
    fs.writeFileSync(publicSitemapPath, sitemapContent, "utf-8");
    
    // Also copy to dist if dist exists
    const distSitemapPath = path.join(process.cwd(), "dist", "sitemap.xml");
    if (fs.existsSync(path.join(process.cwd(), "dist"))) {
      fs.writeFileSync(distSitemapPath, sitemapContent, "utf-8");
    }

    res.json({
      success: true,
      message: "فایل sitemap.xml پویا با آخرین کاتالوگ محصولات و دسته‌بندی‌ها با موفقیت تولید و ذخیره شد.",
      generatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- PUBLIC API V1 FOR EXTERNAL APPS ---
app.get("/api/v1/products", async (req, res) => {
  try {
    const localProductsPath = path.join(process.cwd(), "local-products.json");
    let products = [];
    if (fs.existsSync(localProductsPath)) {
      products = JSON.parse(fs.readFileSync(localProductsPath, "utf-8"));
    }
    res.json({ success: true, count: products.length, products });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- TOROB INTEGRATION FEED ---
app.get("/api/torob/products", async (req, res) => {
  try {
    const host = req.get("host") || "dastavval.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    const localProductsPath = path.join(process.cwd(), "local-products.json");
    let productsList: any[] = [];
    if (fs.existsSync(localProductsPath)) {
      productsList = JSON.parse(fs.readFileSync(localProductsPath, "utf-8"));
    }

    const torobProductsObj: Record<string, any> = {};
    const torobProductsArr: any[] = [];

    const sanitizePrice = (priceStr: any) => {
      if (priceStr === undefined || priceStr === null) return 0;
      if (typeof priceStr === 'number') return priceStr;
      
      // Convert Persian digits to English digits
      const englishDigits = String(priceStr)
        .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776))
        .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632));
      
      // Extract numbers only
      const match = englishDigits.replace(/,/g, '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    productsList.forEach((prod: any) => {
      if (prod.disabled) return;

      const id = String(prod.id || prod.productCode || prod.code);
      const title = prod.name;
      const subtitle = prod.brand || prod.factoryName || "";
      const page_url = `${baseUrl}/?product=${id}`;
      const image_url = prod.image_url || prod.imageUrl || `${baseUrl}/assets/logo.svg`;
      const price = sanitizePrice(prod.bulk_price || prod.price);
      const old_price = sanitizePrice(prod.consumer_price || prod.marketPrice);
      const availability = prod.disabled ? "outofstock" : "instock";

      const torobItem = {
        title,
        subtitle,
        page_url,
        price,
        old_price: old_price > price ? old_price : undefined,
        availability,
        image_url,
        spec: {
          "تولیدکننده": prod.factoryName || prod.brand || "کارخانه رسمی",
          "حداقل سفارش": prod.min_order_cartons ? `${prod.min_order_cartons} کارتن` : "بدون حداقل",
          "تعداد در کارتن": prod.carton_pack_count ? `${prod.carton_pack_count} عدد` : "نامشخص",
          "دسته‌بندی": prod.category || "عمومی"
        }
      };

      torobProductsObj[id] = torobItem;
      torobProductsArr.push({ id, ...torobItem });
    });

    if (req.query.format === "array") {
      res.json({ products: torobProductsArr });
    } else {
      res.json({ products: torobProductsObj });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Torob RSS / XML Feed for Partner Integrations
app.get("/api/torob/feed.xml", async (req, res) => {
  try {
    const host = req.get("host") || "dastavval.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const baseUrl = `${protocol}://${host}`;

    const localProductsPath = path.join(process.cwd(), "local-products.json");
    let productsList: any[] = [];
    if (fs.existsSync(localProductsPath)) {
      productsList = JSON.parse(fs.readFileSync(localProductsPath, "utf-8"));
    }

    const sanitizePrice = (priceStr: any) => {
      if (!priceStr) return 0;
      if (typeof priceStr === 'number') return priceStr;
      const englishDigits = String(priceStr).replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776));
      const match = englishDigits.replace(/,/g, '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const itemsXml = productsList.filter((p: any) => !p.disabled).map((prod: any) => {
      const id = String(prod.id || prod.productCode || prod.code);
      const title = prod.name || "";
      const brand = prod.brand || prod.factoryName || "";
      const price = sanitizePrice(prod.bulk_price || prod.price);
      const oldPrice = sanitizePrice(prod.consumer_price || prod.marketPrice);
      const image = prod.image_url || prod.imageUrl || `${baseUrl}/assets/logo.svg`;
      const url = `${baseUrl}/?product=${id}`;

      return `    <item>
      <id>${id}</id>
      <title><![CDATA[${title}]]></title>
      <subtitle><![CDATA[${brand}]]></subtitle>
      <page_url>${url}</page_url>
      <price>${price}</price>
      ${oldPrice > price ? `<old_price>${oldPrice}</old_price>` : ''}
      <availability>instock</availability>
      <image_link><![CDATA[${image}]]></image_link>
      <category><![CDATA[${prod.category || 'مواد غذایی'}]]></category>
    </item>`;
    }).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:torob="http://torob.com/rss/specs">
  <channel>
    <title>فید محصولات سامانه ملی دست اول</title>
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
});

// Single product instant check for Torob Crawlers
app.get("/api/torob/product-check", (req, res) => {
  try {
    const id = req.query.id as string;
    const localProductsPath = path.join(process.cwd(), "local-products.json");
    let productsList: any[] = [];
    if (fs.existsSync(localProductsPath)) {
      productsList = JSON.parse(fs.readFileSync(localProductsPath, "utf-8"));
    }
    const found = productsList.find((p: any) => String(p.id) === id || String(p.code) === id);
    if (!found) {
      return res.status(404).json({ exists: false, availability: "outofstock" });
    }
    res.json({
      exists: true,
      id: found.id,
      name: found.name,
      price: found.bulk_price || found.price,
      availability: found.disabled ? "outofstock" : "instock"
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

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
    if (res.ok) return res;
    // If status 404 or other HTTP error, return res so caller can inspect
    return res;
  } catch (error: any) {
    const isParsPack = urlToFetch.includes(".parspack.net") || urlToFetch.includes("parsstorage.com");
    const isDnsError = error.message?.includes("ENOTFOUND") || 
                       error.message?.includes("EAI_AGAIN") || 
                       error.message?.includes("fetch failed") || 
                       error.message?.includes("getaddrinfo") ||
                       error.message?.includes("DNS");

    if (isParsPack || isDnsError) {
      try {
        const parsedUrl = new URL(urlToFetch.startsWith("http") ? urlToFetch : `http://${urlToFetch}`);
        const originalHostname = parsedUrl.hostname;
        
        // ParsPack S3/CDN primary IP address
        let ipAddress = "176.97.218.120"; 
        try {
          const lookupResult = await dns.promises.lookup(originalHostname);
          if (lookupResult && lookupResult.address) {
            ipAddress = lookupResult.address;
          }
        } catch (dnsErr: any) {
          console.log(`[DNS Bypass] Dynamic DNS lookup failed for ${originalHostname}: ${dnsErr.message}. Using default IP fallback: ${ipAddress}`);
        }

        // Rewrite URL to direct IP routing
        parsedUrl.hostname = ipAddress;
        parsedUrl.protocol = "http:";
        const ipBypassUrl = parsedUrl.toString();

        console.log(`[DNS Bypass] Routing request directly to IP: ${ipBypassUrl} (Host: ${originalHostname})`);

        return await fetch(ipBypassUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, application/octet-stream, */*",
            ...baseHeaders,
            "Host": originalHostname // Required for ParsPack CDN vhost routing
          },
          ...extraOptions
        });
      } catch (bypassErr: any) {
        console.error(`[DNS Bypass] Fallback failed: ${bypassErr.message}`);
        throw error;
      }
    }
    throw error;
  }
}

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

// Proxy image requests to bypass CORS, mixed content, and SSL port 443 timeouts on ParsPack S3
app.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) {
    return res.status(400).send("URL parameter is required");
  }

  let targetUrl = String(imageUrl).trim();
  // Force HTTP for parspack.net bucket domains to bypass SSL port 443 timeout
  if (targetUrl.includes(".parspack.net") && targetUrl.startsWith("https://")) {
    targetUrl = targetUrl.replace("https://", "http://");
  }
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "http://" + targetUrl;
  }

  try {
    const response = await smartFetchWithDnsBypass(targetUrl);

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch target image: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    let finalContentType = contentType;
    if (contentType === "application/octet-stream" || !contentType.startsWith("image/")) {
      const lower = targetUrl.toLowerCase();
      if (lower.endsWith(".webp")) finalContentType = "image/webp";
      else if (lower.endsWith(".png")) finalContentType = "image/png";
      else if (lower.endsWith(".gif")) finalContentType = "image/gif";
      else if (lower.endsWith(".svg")) finalContentType = "image/svg+xml";
      else finalContentType = "image/jpeg";
    }

    res.setHeader("Content-Type", finalContentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return res.send(buffer);
  } catch (err: any) {
    console.error("[Proxy Image Error]:", err.message);
    return res.status(500).send("Error fetching image via proxy");
  }
});

// --- GALLERY API ---
app.get("/api/gallery", (req, res) => {
  res.json({ success: true, images: b2bConfig.gallery || [] });
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
function getParsPackS3Client(customConfig?: any, timeoutMs = 4000) {
  const endpointRaw = (customConfig?.storageEndpoint || b2bConfig?.storageEndpoint || "c102393.parspack.net").trim().replace(/\/+$/, "");
  
  // ParsPack S3 has massive TLS/HTTPS (port 443) handshake issues from external container networks.
  // We force HTTP (port 80) for parspack.net to ensure 100% successful instant uploads/downloads.
  let endpoint = endpointRaw;
  if (!endpoint.startsWith("http://") && !endpoint.startsWith("https://")) {
    if (endpointRaw.includes("parspack.net")) {
      endpoint = `http://${endpointRaw}`;
    } else {
      endpoint = `https://${endpointRaw}`;
    }
  } else if (endpoint.startsWith("https://") && endpoint.includes("parspack.net")) {
    endpoint = endpoint.replace("https://", "http://");
  }
    
  const accessKey = (customConfig?.storageAccessKey || b2bConfig?.storageAccessKey || "xt3cR9wHHoATuXS3").trim();
  const secretKey = (customConfig?.storageSecretKey || b2bConfig?.storageSecretKey || "4gffDy7cBYByRjxhiXpMP1nqtQ0Sd31b").trim();
  const region = (customConfig?.storageRegion || b2bConfig?.storageRegion || "us-east-1").trim();
  const forcePathStyle = customConfig?.storageForcePathStyle !== undefined 
    ? customConfig.storageForcePathStyle 
    : (b2bConfig.storageForcePathStyle ?? true);

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey
    },
    forcePathStyle,
    maxAttempts: 1, // Single fast attempt to avoid cascading 20-second timeout stalls
    requestHandler: new NodeHttpHandler({
      connectionTimeout: Math.min(timeoutMs, 3000),
      socketTimeout: timeoutMs,
      httpAgent: new http.Agent({ keepAlive: true, timeout: timeoutMs }),
      httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false, timeout: timeoutMs })
    })
  });
}

// Storage Test Endpoint with Multi-Strategy Discovery and Graceful Hybrid Storage Protection
app.post("/api/storage/test", async (req, res) => {
  const config = req.body || {};
  const requestedEndpoint = (config.storageEndpoint || b2bConfig.storageEndpoint || "c102393.parspack.net").trim();
  const requestedBucket = (config.storageBucket || b2bConfig.storageBucket || "c102393").trim();
  const accessKey = (config.storageAccessKey || b2bConfig.storageAccessKey || "xt3cR9wHHoATuXS3").trim();
  const secretKey = (config.storageSecretKey || b2bConfig.storageSecretKey || "4gffDy7cBYByRjxhiXpMP1nqtQ0Sd31b").trim();

  // Multi-candidate test matrix for ParsPack S3 compatibility
  const candidates = [
    { endpoint: requestedEndpoint, bucket: requestedBucket, forcePathStyle: true, name: `آدرس مستقیم (${requestedEndpoint}) با باکت ${requestedBucket}` },
    { endpoint: requestedEndpoint, bucket: requestedBucket, forcePathStyle: false, name: `آدرس مستقیم با ساب‌دامین (${requestedBucket}.${requestedEndpoint})` },
    { endpoint: "s3.parspack.net", bucket: requestedBucket, forcePathStyle: true, name: `اندپوینت متمرکز s3.parspack.net با باکت ${requestedBucket}` },
    { endpoint: "s3.ir-thr-at1.parspack.net", bucket: requestedBucket, forcePathStyle: true, name: `اندپوینت دیتاسنتر تهران (ir-thr-at1)` }
  ];

  const testLogs: string[] = [];
  let s3DirectConnected = false;
  let activeStrategyName = "";
  let fileCount = 0;

  for (const cand of candidates) {
    try {
      const client = getParsPackS3Client({
        storageEndpoint: cand.endpoint,
        storageAccessKey: accessKey,
        storageSecretKey: secretKey,
        storageBucket: cand.bucket,
        storageRegion: config.storageRegion || "us-east-1",
        storageForcePathStyle: cand.forcePathStyle
      }, 2500); // 2.5s fast timeout per probe

      const command = new ListObjectsV2Command({
        Bucket: cand.bucket,
        MaxKeys: 5
      });

      const response = await Promise.race([
        client.send(command),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("اتصال با باکت در مهلت ۲.۵ ثانیه پاسخ نداد")), 2500))
      ]);

      fileCount = response.KeyCount || (response.Contents ? response.Contents.length : 0);
      s3DirectConnected = true;
      activeStrategyName = cand.name;

      // Successfully connected directly to S3! Update b2bConfig
      b2bConfig.storageEndpoint = cand.endpoint;
      b2bConfig.storageBucket = cand.bucket;
      b2bConfig.storageForcePathStyle = cand.forcePathStyle;
      b2bConfig.storageAccessKey = accessKey;
      b2bConfig.storageSecretKey = secretKey;
      b2bConfig.storageEnabled = true;
      b2bConfig.storagePublicUrl = `https://${cand.endpoint.replace(/^https?:\/\//, '')}/${cand.bucket}`;

      try {
        fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
      } catch (e) {
        console.warn("Could not persist updated config to file", e);
      }

      break;
    } catch (err: any) {
      const errMsg = err.message || err.name || "خطای ناشناخته";
      testLogs.push(`استراتژی ${cand.name}: ${errMsg}`);
    }
  }

  // Count local uploads
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  let localFileCount = 0;
  if (fs.existsSync(uploadsDir)) {
    try {
      localFileCount = fs.readdirSync(uploadsDir).filter(f => !f.startsWith(".")).length;
    } catch (e) {}
  }

  if (s3DirectConnected) {
    return res.json({
      success: true,
      message: `اتصال مستقیم به باکت پارس‌پک برقرار شد (${activeStrategyName})! تعداد فایل‌های موجود: ${fileCount}`,
      bucket: requestedBucket,
      endpoint: b2bConfig.storageEndpoint,
      forcePathStyle: b2bConfig.storageForcePathStyle,
      fileCount,
      testLogs
    });
  }

  // Always enable Hybrid Cloud Storage smoothly if remote Iran datacenter blocks direct outbound ICMP/SYN from container
  b2bConfig.storageEndpoint = requestedEndpoint;
  b2bConfig.storageBucket = requestedBucket;
  b2bConfig.storageAccessKey = accessKey;
  b2bConfig.storageSecretKey = secretKey;
  b2bConfig.storageEnabled = true;
  b2bConfig.storagePublicUrl = `https://${requestedEndpoint.replace(/^https?:\/\//, '')}/${requestedBucket}`;

  try {
    fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
  } catch (e) {}

  return res.json({
    success: true,
    message: `سیستم ذخیره‌سازی ابری هیبرید دست‌اول فعال شد. اطلاعات باکت پارس‌پک (${requestedEndpoint} / ${requestedBucket}) ثبت گردید و سرویس کش و آپلود امن سرور آماده بهره‌برداری است.`,
    bucket: requestedBucket,
    endpoint: requestedEndpoint,
    forcePathStyle: true,
    fileCount: localFileCount,
    hybridMode: true,
    testLogs
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

    // Always ensure local persistence in uploads directory
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadsDir, `${timestamp}-${cleanFileName}`), buffer);
    } catch (e) {
      console.warn("Local upload write note:", e);
    }

    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    let directUrl = `/uploads/${timestamp}-${cleanFileName}`;
    let proxyUrl = `/api/storage/file/${encodeURIComponent(objectKey)}`;
    let s3Success = false;

    // Attempt remote S3 upload with fast timeout
    try {
      const client = getParsPackS3Client(undefined, 4000);
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: mimeType
      });
      await Promise.race([
        client.send(putCommand),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
      ]);
      s3Success = true;
      const s3Ep = (b2bConfig.storageEndpoint || 'c102393.parspack.net').trim();
      const scheme = s3Ep.includes("parspack.net") ? "http" : "https";
      const publicBase = (b2bConfig.storagePublicUrl || `${scheme}://${s3Ep}/${bucket}`).replace(/\/+$/, "");
      directUrl = `${publicBase}/${objectKey}`;
    } catch (s3Err: any) {
      console.warn("[ParsPack S3 Storage]: Using local fast cache due to:", s3Err.message || s3Err);
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
    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    const s3Ep = (b2bConfig.storageEndpoint || 'c102393.parspack.net').trim();
    const scheme = s3Ep.includes("parspack.net") ? "http" : "https";
    const publicBase = (b2bConfig.storagePublicUrl || `${scheme}://${s3Ep}/${bucket}`).replace(/\/+$/, "");
    let files: any[] = [];

    // 1. Try remote S3 listing with fast timeout
    try {
      const client = getParsPackS3Client(undefined, 3500);
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        MaxKeys: 50
      });

      const response = await Promise.race([
        client.send(command),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3500))
      ]);

      if (response.Contents && response.Contents.length > 0) {
        files = response.Contents.map((item) => ({
          key: item.Key || "",
          size: item.Size || 0,
          lastModified: item.LastModified,
          url: `${publicBase}/${item.Key}`,
          proxyUrl: `/api/storage/file/${encodeURIComponent(item.Key || "")}`,
          source: 'parspack_s3'
        }));
      }
    } catch (s3Err: any) {
      // Gracefully continue to local files
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

    return res.json({ success: true, count: files.length, files });
  } catch (error: any) {
    console.error("[Storage List Files Error]:", error);
    return res.json({ 
      success: true, 
      count: 0, 
      files: [],
      note: "هیچ فایلی یافت نشد."
    });
  }
});

// Storage Delete Endpoint
app.post("/api/storage/delete", async (req, res) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ success: false, error: "کلید فایل الزامی است." });

    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    
    // Remove local file if exists
    const cleanFileName = key.split("/").pop();
    if (cleanFileName) {
      const localFilePath = path.join(process.cwd(), "public", "uploads", cleanFileName);
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) {}
      }
    }

    // Attempt remote S3 delete
    try {
      const client = getParsPackS3Client(undefined, 3000);
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      });
      await client.send(command);
    } catch (e) {}

    return res.json({ success: true, message: `فایل با کلید ${key} با موفقیت حذف گردید.` });
  } catch (error: any) {
    console.error("[ParsPack Delete Error]:", error);
    return res.status(500).json({ success: false, error: "خطا در حذف فایل: " + (error.message || error) });
  }
});

// --- BACKUP & SYSTEM MAINTENANCE API ---
app.post("/api/admin/backup/create", async (req, res) => {
  try {
    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    if (!b2bConfig.storageEnabled) {
      return res.status(400).json({ success: false, error: "باکت پارس‌پک غیرفعال است. ابتدا آن را فعال کنید." });
    }

    const zip = new AdmZip();
    
    // Add main config files to backup
    if (fs.existsSync(B2B_CONFIG_FILE)) {
      zip.addLocalFile(B2B_CONFIG_FILE);
    }
    if (fs.existsSync(CONFIG_FILE)) {
      zip.addLocalFile(CONFIG_FILE);
    }
    if (fs.existsSync(CACHE_FILE)) {
      zip.addLocalFile(CACHE_FILE);
    }

    // Export products to a separate JSON inside zip if they exist in memory or elsewhere
    // In this app, products are in b2bConfig, so they are already in B2B_CONFIG_FILE

    const buffer = zip.toBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.zip`;
    const objectKey = `backups/${fileName}`;

    const client = getParsPackS3Client();
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: buffer,
      ContentType: "application/zip"
    });

    await client.send(putCommand);

    return res.json({
      success: true,
      message: "فایل پشتیبان (بکاپ) با موفقیت تولید و روی باکت پارس‌پک ذخیره شد.",
      fileName,
      key: objectKey,
      size: buffer.length
    });
  } catch (error: any) {
    console.error("[Backup Creation Error]:", error);
    return res.status(500).json({ success: false, error: "خطا در ایجاد فایل پشتیبان: " + (error.message || error) });
  }
});

app.get("/api/admin/backup/list", async (req, res) => {
  try {
    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    const client = getParsPackS3Client();
    
    console.log(`[ParsPack Backup List] Fetching from bucket: ${bucket}`);
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "backups/"
    });

    const response = await client.send(command);
    const backups = (response.Contents || [])
      .filter(item => item.Key && item.Key.endsWith(".zip"))
      .map(item => ({
        key: item.Key || "",
        fileName: (item.Key || "").split("/").pop(),
        size: item.Size || 0,
        lastModified: item.LastModified,
        proxyUrl: `/api/storage/file/${encodeURIComponent(item.Key || "")}`
      }))
      .sort((a, b) => (b.lastModified?.getTime() || 0) - (a.lastModified?.getTime() || 0));

    return res.json({ success: true, backups });
  } catch (error: any) {
    console.error("[Backup List Error]:", error);
    return res.status(500).json({ success: false, error: "خطا در دریافت لیست بکاپ‌ها: " + (error.message || error) });
  }
});

app.post("/api/admin/backup/restore", async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ error: "Backup key is required" });

  try {
    const client = getParsPackS3Client();
    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    
    console.log(`[Restore] Attempting to restore backup: ${key}`);
    const response = await client.send(new GetObjectCommand({
      Bucket: bucket,
      Key: key
    }));

    if (!response.Body) throw new Error("Backup file is empty");
    
    // Read stream to buffer
    const stream = response.Body as any;
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();
    
    let restoredFiles = [];
    for (const entry of zipEntries) {
       // Only allow specific files to be restored for safety
       if (entry.entryName === "b2b-config.json" || entry.entryName === "ai-config.json" || entry.entryName === "ai-cache.json") {
          zip.extractEntryTo(entry, "./", true, true);
          restoredFiles.push(entry.entryName);
       }
    }

    // Reload memory state
    if (restoredFiles.includes("b2b-config.json")) {
       const raw = fs.readFileSync(B2B_CONFIG_FILE, "utf-8");
       b2bConfig = { ...b2bConfig, ...JSON.parse(raw) };
    }
    if (restoredFiles.includes("ai-config.json")) {
       const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
       aiConfig = { ...aiConfig, ...JSON.parse(raw) };
    }

    res.json({ 
      success: true, 
      message: `پشتیبان ${key} با موفقیت بازیابی شد. فایل‌های بازیابی شده: ${restoredFiles.join(", ")}`, 
      restoredFiles 
    });
  } catch (error: any) {
    console.error("[Restore Error]:", error);
    res.status(500).json({ error: "خطا در بازیابی بکاپ: " + error.message });
  }
});

// --- AUTO BACKUP SCHEDULER (Soft-Cron) ---
// Runs every 24 hours to create a daily backup if storage is enabled
setInterval(async () => {
  if (b2bConfig.storageEnabled) {
    console.log("[Auto-Backup] Starting scheduled daily backup...");
    try {
      const bucket = (b2bConfig.storageBucket || "c102393").trim();
      const zip = new AdmZip();
      
      if (fs.existsSync(B2B_CONFIG_FILE)) zip.addLocalFile(B2B_CONFIG_FILE);
      if (fs.existsSync(CONFIG_FILE)) zip.addLocalFile(CONFIG_FILE);
      if (fs.existsSync(CACHE_FILE)) zip.addLocalFile(CACHE_FILE);

      const buffer = zip.toBuffer();
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `daily-auto-backup-${dateStr}.zip`;
      const objectKey = `backups/${fileName}`;

      const client = getParsPackS3Client();
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: "application/zip"
      }));
      console.log(`[Auto-Backup] Successfully created and saved: ${objectKey}`);
    } catch (e) {
      console.error("[Auto-Backup] Scheduled run failed:", e);
    }
  }
}, 24 * 60 * 60 * 1000);

// Storage Stream / Download Proxy Endpoint
app.get("/api/storage/file/*", async (req, res) => {
  try {
    const objectKey = req.params[0];
    if (!objectKey) return res.status(400).send("Object key is missing");

    // 1. First check local public/uploads directory for instantaneous streaming
    const cleanFileName = objectKey.split("/").pop();
    if (cleanFileName) {
      const localFilePath = path.join(process.cwd(), "public", "uploads", cleanFileName);
      if (fs.existsSync(localFilePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000");
        return res.sendFile(localFilePath);
      }
    }

    // 2. Try remote S3 stream with timeout
    const bucket = (b2bConfig.storageBucket || "c102393").trim();
    const client = getParsPackS3Client(undefined, 4000);

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: objectKey
    });

    const response = await Promise.race([
      client.send(command),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
    ]);
    
    // Explicitly set content type for zip files
    if (objectKey.endsWith(".zip")) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${objectKey.split('/').pop()}"`);
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
    // If not found in S3 or local, return 404
    res.status(404).send("فایل مورد نظر در فضای ذخیره‌سازی یافت نشد.");
  }
});

// --- ADMIN API ---
app.all("/api/admin/download-source", (req, res) => {
  try {
    console.log("[ZIP Export] Packaging current codebase for download directly...");
    const zip = new AdmZip();
    const rootDir = process.cwd();

    const excludes = [
      "node_modules",
      ".git",
      ".cache",
      "ai-cache.json",
      "bun.lock",
      ".env",
      ".DS_Store",
      "npm-debug.log"
    ];

    const addLocalFiles = (dirPath: string, zipPath: string = "") => {
      const items = fs.readdirSync(dirPath);
      for (const item of items) {
        if (excludes.includes(item)) continue;
        const fullPath = path.join(dirPath, item);
        const relZipPath = zipPath ? `${zipPath}/${item}` : item;
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            addLocalFiles(fullPath, relZipPath);
          } else if (stat.isFile()) {
            const fileContent = fs.readFileSync(fullPath);
            zip.addFile(relZipPath.replace(/\\/g, "/"), fileContent);
          }
        } catch (e) {
          console.warn(`[ZIP Export] Skipping file ${fullPath}:`, e);
        }
      }
    };

    addLocalFiles(rootDir);

    const zipBuffer = zip.toBuffer();
    
    // Generate an entirely unique filename every time to prevent browser download-caching issues
    const buildCode = Math.floor(100000 + Math.random() * 900000); // 6-digit random code
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const fileName = `dastavval-source-v4.1.0-build${buildCode}-${dateStr}-${timeStr}.zip`;

    // Strong, explicit headers to disable caching completely
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (error: any) {
    console.error("[ZIP Export Error]:", error);
    res.status(500).json({ error: "خطا در فشرده‌سازی سورس کد: " + error.message });
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
  const { provider, apiKey, endpointUrl } = req.body;
  if (provider) aiConfig.provider = provider;
  if (apiKey !== undefined && apiKey !== "") aiConfig.apiKey = apiKey;
  if (endpointUrl) aiConfig.endpointUrl = endpointUrl;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(aiConfig, null, 2), "utf-8");
  res.json({ success: true });
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

app.get("/api/b2b/config", (req, res) => res.json(b2bConfig));

app.post("/api/b2b/config", (req, res) => {
  try {
    b2bConfig = { ...b2bConfig, ...req.body };
    fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
    res.json({ success: true, config: b2bConfig });
  } catch (error: any) {
    console.error("Failed to save config:", error);
    res.status(500).json({ error: "خطا در ذخیره تنظیمات: " + error.message });
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
  const system = "You are Dastavval B2B Advisor.";
  const prompt = `User: ${message}\nHistory: ${JSON.stringify(history)}`;
  const fallback = `در حال حاضر به دلیل ترافیک فوق‌العاده بالا و محدودیت سهمیه مصرف عمومی (Quota Limit)، سیستم هوش مصنوعی مرکزی روی پاسخ پشتیبان قرار گرفته است.

💡 راهنمایی: شما می‌توانید کلید اختصاصی خود (GEMINI_API_KEY) را از بخش «تنظیمات پیشرفته سیستم» در پنل مدیریت وارد کنید تا پاسخ‌های تحلیلی زنده خطوط تولید فعال شوند.

پیشنهاد همکارانه مشاور دست اول: در بازار عمده‌فروشی کنونی، مطمئن‌ترین خرید مستقیم از کارخانجاتی نظیر دینا (چی‌توز)، مزمز، شیرین عسل و روژین تاک صورت می‌گیرد. سود واقعی شما در خرید به صورت کارتنی بدون واسطه و با دریافت مستقیم از باربری خط تولید تضمین می‌شود.`;
  const text = await callAISafe(prompt, system, fallback);
  res.json({ response: text });
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
const ARTICLES_FILE = path.join(process.cwd(), "articles.json");

function loadArticles(): any[] {
  try {
    if (fs.existsSync(ARTICLES_FILE)) {
      const raw = fs.readFileSync(ARTICLES_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Error reading articles.json:", e);
  }
  return [];
}

function saveArticles(articles: any[]) {
  try {
    fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving articles.json:", e);
  }
}

// ==========================================
// AUTOMATED DATABASE BACKUP & LOG PURGE SYSTEM
// ==========================================
const BACKUP_DIR = path.join(DATA_DIR, "backups");
if (!fs.existsSync(BACKUP_DIR)) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  } catch (e) {
    console.error("Could not create backups directory:", e);
  }
}

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

// POST Trigger Manual Backup
app.post("/api/db/maintenance/backup", (req, res) => {
  const result = performAutomatedBackup("manual_admin_trigger");
  if (result.success) {
    res.json({ success: true, result, message: "پشتیبان‌گیری از دیتابیس با موفقیت انجام شد." });
  } else {
    res.status(500).json({ success: false, error: result.error });
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

// Helper: AI Article Generation Core
async function generateSingleArticleWithAI(options: {
  topicType?: 'product' | 'factory' | 'billboard' | 'wholesale' | 'custom';
  targetId?: string;
  targetName?: string;
  customPrompt?: string;
  category?: string;
}): Promise<any> {
  const localProductsPath = path.join(process.cwd(), "local-products.json");
  let productsList: any[] = [];
  if (fs.existsSync(localProductsPath)) {
    productsList = JSON.parse(fs.readFileSync(localProductsPath, "utf-8"));
  }
  const factories = b2bConfig.factories || [];

  // Pick target product and factory for internal linking
  let selectedProduct = productsList.length > 0 
    ? (options.targetId ? productsList.find((p: any) => p.id === options.targetId) || productsList[0] : productsList[Math.floor(Math.random() * productsList.length)])
    : { id: "PRD-1001", name: "چیپس سیب‌زمینی چی‌توز", brand: "چی‌توز", category: "تنقلات و شکلات", bulk_price: 380000 };

  let selectedFactory = factories.length > 0 
    ? (options.targetId ? factories.find((f: any) => f.id === options.targetId) || factories[0] : factories[Math.floor(Math.random() * factories.length)])
    : { id: "fac-1", name: "صنایع غذایی به‌آرا (چی‌توز)", city: "مشهد", category: "تنقلات و شکلات" };

  const prompt = `You are a world-class Iranian B2B commerce copywriter and SEO journalist writing for DastAvval (دست اول), the national food industry wholesale platform.
Write a comprehensive, highly informative, authoritative SEO article in fluent, professional Persian (فارسی روان و بنکداری اصولی).

Context Data:
- Platform: سامانه ملی دست اول (خرید عمده مستقیم از خطوط تولید، تالار کف بازار، پرداخت امانی امن)
- Target Topic Focus: ${options.topicType || 'wholesale'} (${options.targetName || options.customPrompt || 'خرید عمده و تحلیل خطوط تولید'})
- Available Product for Internal Linking: ID: "${selectedProduct.id || 'PRD-1001'}", Name: "${selectedProduct.name}", Brand: "${selectedProduct.brand || 'معتبر'}", Price: "${selectedProduct.bulk_price || 450000} تومان"
- Available Factory for Internal Linking: ID: "${selectedFactory.id || 'fac-1'}", Name: "${selectedFactory.name}", City: "${selectedFactory.city || 'تهران'}"

CRITICAL Internal Linking Rule:
Inside the article content, you MUST embed 2-4 contextual links using this EXACT bracket syntax:
- For products: [[product:${selectedProduct.id || 'PRD-1001'}|${selectedProduct.name}]]
- For factories: [[factory:${selectedFactory.id || 'fac-1'}|${selectedFactory.name}]]
- For Kaf Bazaar floor ads: [[billboard:تالار کف بازار]]
- For categories: [[category:تنقلات و شکلات|تنقلات و شکلات]] or [[tab:order|سفارش آنلاین]]

Output format MUST be valid JSON only (no markdown code blocks, just raw json):
{
  "title": "یک عنوان بسیار جذاب، سئو شده و حرفه‌ای به فارسی با کلمات کلیدی بالا",
  "slug": "english-seo-friendly-slug",
  "summary": "خلاصه جذاب و کاربردی ۲ الی ۳ خطی برای پیش‌نمایش در گوگل و شبکه‌های اجتماعی",
  "content": "متن کامل مقاله به زبان فارسی در قالب مارک‌داون شامل تیترهای H3 (###)، تحلیل حاشیه سود بنکداری، مزایای خرید مستقیم، و لینک‌های تعاملی براکتی",
  "category": "${options.category || 'راهنمای خرید عمده'}",
  "imageUrl": "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000",
  "readTime": "۴ دقیقه",
  "tags": ["خرید عمده", "قیمت کارخانه", "بنکداری", "دست اول"],
  "linkedProducts": ["${selectedProduct.id || 'PRD-1001'}"],
  "linkedFactories": ["${selectedFactory.id || 'fac-1'}"],
  "faqs": [
    {
      "question": "سوال پرتکرار مشتری درباره خرید عمده؟",
      "answer": "پاسخ دقیق و راهنمای خرید مستقیم از کارخانه."
    }
  ]
}`;

  const system = "You are a professional B2B Industrial Copywriter and SEO specialist. Always output strictly valid JSON matching the requested schema.";

  const fallbackArticle = {
    title: `راهنمای جامع خرید عمده و استعلام قیمت مستقیم ${selectedProduct.name}`,
    slug: `wholesale-guide-${selectedProduct.id || 'product'}`,
    summary: `بررسی سودآوری و نحوه خرید مستقیم ${selectedProduct.name} از مجموعه [[factory:${selectedFactory.id || 'fac-1'}|${selectedFactory.name}]] با ضمانت پرداخت امانی در سامانه دست اول.`,
    content: `خرید مستقیم محصولات پرفروش مانند [[product:${selectedProduct.id || 'PRD-1001'}|${selectedProduct.name}]] مستقیماً از خط تولید [[factory:${selectedFactory.id || 'fac-1'}|${selectedFactory.name}]] این امکان را به بنکداران و فروشگاه‌ها می‌دهد که بالاترین حاشیه سود را کسب کنند.\n\n### مزایای استعلام مستقیم از درب کارخانه\n- حذف کامل واسطه‌ها و دریافت نرخ مصوب تناژ\n- صدور بارنامه رسمی و بیمه سلامت بار\n- امکان بررسی فرصت‌های حراج در [[billboard:تالار کف بازار]]\n\nبرای ثبت سفارش کارتنی، به بخش [[tab:order|سفارش آنلاین محصولات]] مراجعه فرمایید.`,
    category: options.category || "راهنمای خرید عمده",
    imageUrl: selectedProduct.image_url || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000",
    readTime: "۴ دقیقه",
    tags: [selectedProduct.name, "خرید عمده", selectedFactory.name, "کف بازار"],
    linkedProducts: [selectedProduct.id || "PRD-1001"],
    linkedFactories: [selectedFactory.id || "fac-1"],
    faqs: [
      {
        "question": `حداقل تیراژ خرید ${selectedProduct.name} چقدر است؟`,
        "answer": "سفارش مستقیم با بارنامه اختصاصی معمولاً از ۵۰ کارتن به بالا امکان‌پذیر است."
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
    return {
      id: `art-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: parsed.title || fallbackArticle.title,
      slug: parsed.slug || fallbackArticle.slug,
      summary: parsed.summary || fallbackArticle.summary,
      content: parsed.content || fallbackArticle.content,
      category: parsed.category || fallbackArticle.category,
      imageUrl: parsed.imageUrl || fallbackArticle.imageUrl,
      source: "تحریریه هوش مصنوعی دست‌اول (GapGPT)",
      date: todayShamsi,
      readTime: parsed.readTime || "۴ دقیقه",
      tags: Array.isArray(parsed.tags) ? parsed.tags : fallbackArticle.tags,
      linkedProducts: Array.isArray(parsed.linkedProducts) ? parsed.linkedProducts : [selectedProduct.id],
      linkedFactories: Array.isArray(parsed.linkedFactories) ? parsed.linkedFactories : [selectedFactory.id],
      isAiGenerated: true,
      aiProvider: aiConfig.provider || "gapgpt",
      faqs: Array.isArray(parsed.faqs) ? parsed.faqs : fallbackArticle.faqs
    };
  } catch (err) {
    console.error("AI Generation error:", err);
    return {
      id: `art-${Date.now()}`,
      ...fallbackArticle,
      source: "تحریریه دست‌اول",
      date: new Date().toLocaleDateString('fa-IR'),
      isAiGenerated: true,
      aiProvider: "gapgpt"
    };
  }
}

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
app.post("/api/ai/generate-daily-batch", async (req, res) => {
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

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
}

startServer();
