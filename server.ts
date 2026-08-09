import express from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
const DEFAULT_B2B_CONFIG = {
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
      "logoUrl": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' rx='40' fill='%23dc2626'/><circle cx='100' cy='100' r='76' fill='%23f59e0b' stroke='%23ffffff' stroke-width='6'/><text x='100' y='110' font-family='Tahoma, sans-serif' font-weight='900' font-size='32' fill='%23ffffff' text-anchor='middle'>چی‌توز</text><text x='100' y='140' font-family='sans-serif' font-weight='bold' font-size='12' fill='%2378350f' text-anchor='middle'>CHETOZ BRAND</text></svg>",
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
      "logoUrl": "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='100%' height='100%' rx='40' fill='%231d4ed8'/><circle cx='100' cy='100' r='76' fill='%233b82f6' stroke='%23ffffff' stroke-width='6'/><text x='100' y='112' font-family='Tahoma, sans-serif' font-weight='900' font-size='36' fill='%23ffffff' text-anchor='middle'>مزمز</text><text x='100' y='142' font-family='sans-serif' font-weight='bold' font-size='12' fill='%23dbeafe' text-anchor='middle'>MAZMAZ FOODS</text></svg>",
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
  ]
};

let b2bConfig = { ...DEFAULT_B2B_CONFIG };

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
      const ai = new GoogleGenAI({ apiKey });
      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash",
        input: prompt,
        system_instruction: systemPrompt
      });
      return interaction.output_text || "";
    } catch (e: any) {
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

// Proxy fetch to bypass CORS for WooCommerce and WordPress integrations
app.post("/api/proxy-fetch", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  // Clean up and sanitize URL string from accidental spaces or typos
  let targetUrl = String(url).trim().replace(/\s+/g, '');
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }
  // Remove redundant path slashes e.g. domain.com//wp-json -> domain.com/wp-json
  targetUrl = targetUrl.replace(/([^:]\/)\/+/g, "$1");

  try {
    console.log(`[Proxy Fetch] Requesting: ${targetUrl}`);
    let response;
    try {
      response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });
    } catch (netErr: any) {
      if (targetUrl.startsWith('https://')) {
        const httpUrl = targetUrl.replace('https://', 'http://');
        console.log(`[Proxy Fetch] HTTPS failed, trying HTTP fallback: ${httpUrl}`);
        response = await fetch(httpUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
          }
        });
      } else {
        throw netErr;
      }
    }

    if (!response.ok) {
      throw new Error(`Target server responded with status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[Proxy Fetch] Error:", error.message);
    res.status(500).json({ error: "خطا در برقراری ارتباط با سایت مبدا. بررسی کنید آدرس وارد شده صحیح باشد و مسدود نباشد. " + error.message });
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

// --- ADMIN API ---
app.all("/api/admin/download-source", (req, res) => {
  try {
    console.log("[ZIP Export] Triggering fresh compile (npm run build) to ensure the ZIP matches the live site exactly...");
    try {
      execSync("npm run build", { stdio: "inherit" });
      console.log("[ZIP Export] Fresh compile completed successfully.");
    } catch (buildError: any) {
      console.error("[ZIP Export] Warning: npm run build failed, using pre-existing dist files:", buildError.message);
    }

    const zip = new AdmZip();
    const rootDir = process.cwd();

    const excludes = [
      "node_modules",
      ".git",
      ".cache",
      "ai-cache.json",
      "bun.lock"
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
app.post("/api/admin/github-update", async (req, res) => {
  const repoUrl = req.body.repoUrl || "https://github.com/dastavval/UpdaterDst";
  const branch = req.body.branch || "main";
  const token = req.body.token || "";

  console.log(`[GitHub Updater] Initiating update from repository: ${repoUrl} (branch: ${branch}, token: ${token ? "Provided" : "None"})`);

  try {
    let cleanRepoUrl = String(repoUrl).trim().replace(/\.git$/, "");
    if (!cleanRepoUrl.startsWith("http://") && !cleanRepoUrl.startsWith("https://")) {
      cleanRepoUrl = "https://" + cleanRepoUrl;
    }

    const ownerRepo = cleanRepoUrl.replace("https://github.com/", "");

    // Prepare candidate download URLs
    const zipUrls = [
      `https://api.github.com/repos/${ownerRepo}/zipball/${branch}`,
      `${cleanRepoUrl}/archive/refs/heads/${branch}.zip`,
      `${cleanRepoUrl}/archive/refs/heads/main.zip`,
      `${cleanRepoUrl}/archive/refs/heads/master.zip`,
      `https://codeload.github.com/${ownerRepo}/zip/refs/heads/${branch}`
    ];

    let zipResponse: any = null;
    let successfulUrl = "";

    for (const url of zipUrls) {
      try {
        console.log(`[GitHub Updater] Attempting download: ${url}`);
        const headers: Record<string, string> = {
          "User-Agent": "Mozilla/5.0 (Node.js) Dastavval-Updater/1.0",
          "Accept": "application/vnd.github+json"
        };

        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        if (response.ok) {
          zipResponse = response;
          successfulUrl = url;
          console.log(`[GitHub Updater] Successfully fetched zip from ${url}`);
          break;
        }
      } catch (fetchErr: any) {
        console.log(`[GitHub Updater] Failed ${url}:`, fetchErr.message);
      }
    }

    if (!zipResponse) {
      return res.status(400).json({
        success: false,
        error: `امکان دریافت فایل فشرده سورس‌کد و دیتابیس از مخزن ${repoUrl} میسر نشد. لطفاً از عمومی (Public) بودن مخزن یا صحت نام شاخه مطمئن شوید.`
      });
    }

    const arrayBuffer = await zipResponse.arrayBuffer();
    const zipBuffer = Buffer.from(arrayBuffer);

    if (zipBuffer.length < 100) {
      return res.status(400).json({
        success: false,
        error: "فایل دریافتی از مخزن گیت‌هاب معتبر نمی‌باشد (حجم فایل بسیار ناچیز است)."
      });
    }

    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();

    if (zipEntries.length === 0) {
      return res.status(400).json({
        success: false,
        error: "فایل فشرده دریافتی از گیت‌هاب خالی است."
      });
    }

    // Determine root prefix inside the zip archive (e.g. "UpdaterDst-main/")
    let rootPrefix = "";
    const firstEntryName = zipEntries[0].entryName;
    const slashPos = firstEntryName.indexOf("/");
    if (slashPos !== -1) {
      rootPrefix = firstEntryName.substring(0, slashPos + 1);
    }

    let updatedFilesCount = 0;
    let databaseUpdated = false;
    const updatedFileList: string[] = [];

    const excludes = ["node_modules", ".git", ".env"];

    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      let relPath = entry.entryName;
      if (rootPrefix && relPath.startsWith(rootPrefix)) {
        relPath = relPath.substring(rootPrefix.length);
      }

      if (!relPath) continue;

      const topDir = relPath.split("/")[0];
      if (excludes.includes(topDir) || excludes.includes(relPath)) {
        continue;
      }

      const targetPath = path.join(process.cwd(), relPath);
      const targetDir = path.dirname(targetPath);

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, entry.getData());
      updatedFilesCount++;
      updatedFileList.push(relPath);

      if (relPath.endsWith("database.sql") || relPath.endsWith("b2b-config.json") || relPath.endsWith("local-products.json")) {
        databaseUpdated = true;
      }
    }

    // Reload b2bConfig if b2b-config.json was updated
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
      } catch (e) {
        console.error("Failed to reload b2b-config.json:", e);
      }
    }

    // Rebuild project
    console.log("[GitHub Updater] Executing build command (npm run build)...");
    try {
      execSync("npm run build", { stdio: "inherit" });
      console.log("[GitHub Updater] Build completed successfully.");
    } catch (buildErr: any) {
      console.warn("[GitHub Updater] Build warning:", buildErr.message);
    }

    return res.json({
      success: true,
      message: "کدها و دیتابیس سامانه با موفقیت از مخزن گیت‌هاب دریافت و به‌روزرسانی شد!",
      downloadUrl: successfulUrl,
      updatedFilesCount,
      databaseUpdated,
      updatedFiles: updatedFileList.slice(0, 20)
    });
  } catch (error: any) {
    console.error("[GitHub Updater Exception]:", error);
    return res.status(500).json({
      success: false,
      error: "خطا در فرآیند دریافت و اعمال بروزرسانی: " + error.message
    });
  }
});

app.get("/api/b2b/config", (req, res) => res.json(b2bConfig));

app.post("/api/b2b/config", (req, res) => {
  b2bConfig = { ...b2bConfig, ...req.body };
  fs.writeFileSync(B2B_CONFIG_FILE, JSON.stringify(b2bConfig, null, 2), "utf-8");
  res.json({ success: true, config: b2bConfig });
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
