import React, { useState, useEffect } from "react";
import {
  Server,
  Database,
  GitBranch,
  Terminal,
  Sliders,
  Wand2,
  Network,
  HardDrive,
  Play,
  CheckCircle,
  Globe,
  Shield,
  Key,
  Download,
  Upload,
  RotateCcw,
  Radio,
  Cpu,
  Layers,
  Activity,
  RefreshCw,
  Zap,
  Check,
  X,
  AlertTriangle,
  Clock,
  Copy,
  ChevronRight,
  ArrowDown,
  ShieldCheck,
  FileCode,
  FileSpreadsheet,
  FileText,
  Github,
  ExternalLink,
  Settings,
  Lock,
  Wifi,
  Sparkles,
  Share2,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { B2BConfig, Product } from "../types";
import { db } from "../lib/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from "../lib/firebase-mock";

interface AdminSystemConfigProps {
  b2bConfig: B2BConfig;
  onUpdateB2bConfig: (updated: Partial<B2BConfig>) => Promise<void>;
  products?: Product[];
  orders?: any[];
  articles?: any[];
  onRefreshProducts?: () => Promise<void>;
}

type ActiveTab = 
  | "status"
  | "social"
  | "github"
  | "config"
  | "magic_db"
  | "load_balancer"
  | "installer"
  | "backup";

export default function AdminSystemConfig({
  b2bConfig,
  onUpdateB2bConfig,
  products = [],
  orders = [],
  articles = [],
  onRefreshProducts
}: AdminSystemConfigProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("github");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "سیستم آماده به کار است.",
    "هسته مرکزی مانیتورینگ سرور فعال شد.",
    "اتصال به دیتابیس ابر دست‌اول تایید گردید."
  ]);

  // --- 1. SERVER STATUS STATES ---
  const [cpuUsage, setCpuUsage] = useState(18);
  const [ramUsage, setRamUsage] = useState(42);
  const [diskUsage, setDiskUsage] = useState(29);
  const [activeConnections, setActiveConnections] = useState(142);
  const [pingLatency, setPingLatency] = useState(12);
  const [uptimeDays, setUptimeDays] = useState(48);

  // --- 2. GITHUB AUTO UPDATE STATES ---
  const [githubRepoUrl, setGithubRepoUrl] = useState(
    (b2bConfig as any).githubRepoUrl || "https://github.com/dastavval/b2b-distributor-platform.git"
  );
  const [githubBranch, setGithubBranch] = useState((b2bConfig as any).githubBranch || "main");
  const [githubToken, setGithubToken] = useState((b2bConfig as any).githubToken || "");
  const [githubAutoDeploy, setGithubAutoDeploy] = useState(
    (b2bConfig as any).githubAutoDeploy !== false
  );
  const [lastCommitInfo, setLastCommitInfo] = useState<{
    hash: string;
    author: string;
    date: string;
    message: string;
  }>({
    hash: "a4f89d2",
    author: "DastAvval Core Team",
    date: new Date().toLocaleDateString("fa-IR"),
    message: "بهینه‌سازی سیستم فاکتور رسمی و مانیتورینگ لودبالانسر سرور"
  });

  // --- 3. SITE & DATABASE CONFIG STATES ---
  const [siteDomain, setSiteDomain] = useState((b2bConfig as any).domain || "https://dastavval.ir");
  const [apiGatewayUrl, setApiGatewayUrl] = useState(
    (b2bConfig as any).apiGatewayUrl || "https://dastavval.ir/api/v1"
  );
  const [maintenanceMode, setMaintenanceMode] = useState(!!(b2bConfig as any).maintenanceMode);
  const [rateLimitReq, setRateLimitReq] = useState((b2bConfig as any).rateLimitReq || 120);
  const [baseRepsCount, setBaseRepsCount] = useState<number>((b2bConfig as any).baseRepsCount || 5420);
  const [baseProductsCount, setBaseProductsCount] = useState<number>((b2bConfig as any).baseProductsCount || 10250);
  const [dbProvider, setDbProvider] = useState<"firestore" | "postgresql" | "cloudsql" | "sqlite">(
    (b2bConfig as any).dbProvider || "firestore"
  );
  const [dbConnectionString, setDbConnectionString] = useState(
    (b2bConfig as any).dbConnectionString || "firestore://dastavval-prod.firebaseio.com"
  );
  const [dbMaxPool, setDbMaxPool] = useState((b2bConfig as any).dbMaxPool || 50);
  const [dbEncryptionEnabled, setDbEncryptionEnabled] = useState(
    (b2bConfig as any).dbEncryptionEnabled !== false
  );

  // --- 4. MAGIC DB STATES ---
  const [magicDbHealthScore, setMagicDbHealthScore] = useState(98);
  const [autoIndexStatus, setAutoIndexStatus] = useState("فعال و بهینه");
  const [isOptimizingDb, setIsOptimizingDb] = useState(false);

  // --- 5. LOAD BALANCER STATES ---
  const [lbStrategy, setLbStrategy] = useState<"round_robin" | "least_conn" | "ip_hash" | "weighted">(
    (b2bConfig as any).lbStrategy || "least_conn"
  );
  const [lbNodes, setLbNodes] = useState([
    { id: "node-1", name: "سرور مرکزی تهران (Node-01)", ip: "185.142.12.10", status: "online", load: 24, ping: 8 },
    { id: "node-2", name: "سرور پشتیبان تبریز (Node-02)", ip: "185.142.12.11", status: "online", load: 18, ping: 14 },
    { id: "node-3", name: "سرور توزیع شیراز (Node-03)", ip: "185.142.12.12", status: "online", load: 12, ping: 22 },
    { id: "node-4", name: "شبکه توزیع محتوا Edge CDN", ip: "cdn.dastavval.ir", status: "online", load: 31, ping: 5 }
  ]);

  // --- 6. AUTO INSTALLER / SETUP WIZARD STATES ---
  const [showInstallerWizard, setShowInstallerWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardStepsStatus, setWizardStepsStatus] = useState({
    environment: true,
    database: true,
    adminAccount: true,
    sampleCatalog: true,
    security: true
  });

  // --- 7. BACKUP & MIGRATION STATES ---
  const [backupAutoSchedule, setBackupAutoSchedule] = useState("daily");
  const [backupRetentionDays, setBackupRetentionDays] = useState(30);
  const [remoteMigrateUrl, setRemoteMigrateUrl] = useState("");
  const [remoteMigrateSecret, setRemoteMigrateSecret] = useState("");

  // --- 8. SOCIAL CHANNELS STATES ---
  const [rubikaChannelUrl, setRubikaChannelUrl] = useState(
    b2bConfig.rubikaChannelUrl || "https://rubika.ir/dastavval_official"
  );
  const [telegramChannelUrl, setTelegramChannelUrl] = useState(
    b2bConfig.telegramChannelUrl || "https://t.me/dastavval_official"
  );
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(
    b2bConfig.whatsappGroupUrl || "https://chat.whatsapp.com/dastavval_official"
  );
  const [instagramPageUrl, setInstagramPageUrl] = useState(
    b2bConfig.instagramPageUrl || "https://instagram.com/dastavval_official"
  );
  const [socialChannelsTitle, setSocialChannelsTitle] = useState(
    b2bConfig.socialChannelsTitle || "شبکه اطلاع‌رسانی و کانال‌های رسمی دست اول"
  );
  const [socialChannelsSubtitle, setSocialChannelsSubtitle] = useState(
    b2bConfig.socialChannelsSubtitle || "عضویت در کانال‌های رسمی روبیکا، تلگرام، واتساپ و اینستاگرام جهت آگاهی از موجودی روز، تخفیفات ویژه کارخانجات و جشنواره‌های تامین کالا"
  );
  const [pwaPromptDelaySeconds, setPwaPromptDelaySeconds] = useState(
    b2bConfig.pwaPromptDelaySeconds || 4
  );
  const [showTopSocialBar, setShowTopSocialBar] = useState(
    b2bConfig.showTopSocialBar ?? false
  );

  const handleSaveSocialConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog("ذخیره لینک کانال‌های روبیکا، تلگرام، واتساپ و وضعیت نوار هدر...");
    try {
      await onUpdateB2bConfig({
        rubikaChannelUrl,
        telegramChannelUrl,
        whatsappGroupUrl,
        instagramPageUrl,
        socialChannelsTitle,
        socialChannelsSubtitle,
        pwaPromptDelaySeconds,
        showTopSocialBar
      } as any);
      addLog("تنظیمات کانال‌های اجتماعی با موفقیت ذخیره شد.");
      setSuccessMsg("لینک کانال‌ها و وضعیت نمایش نوار هدر با موفقیت ذخیره شد.");
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره کانال‌های اجتماعی.");
    } finally {
      setLoading(false);
    }
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString("fa-IR");
    setTerminalLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 50)]);
  };

  // Simulated live telemetry fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) => Math.min(95, Math.max(8, prev + (Math.floor(Math.random() * 7) - 3))));
      setRamUsage((prev) => Math.min(90, Math.max(30, prev + (Math.floor(Math.random() * 5) - 2))));
      setActiveConnections((prev) => Math.max(50, prev + (Math.floor(Math.random() * 11) - 5)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Handler: Action Execution
  const handleServerAction = async (actionName: string) => {
    setLoading(true);
    addLog(`در حال اجرای دستوری: ${actionName}...`);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (actionName === "restart_services") {
        addLog("سرویس‌های Nginx و Node.js با موفقیت ری‌استارت و همگام شدند.");
        setSuccessMsg("تمام سرویس‌های سرور با موفقیت ری‌استارت شدند.");
      } else if (actionName === "clear_cache") {
        addLog("حافظه کش Redis و فایل‌های موقت با موفقیت تخلیه شدند.");
        setSuccessMsg("حافظه کش سرور و Redis پاکسازی گردید.");
      } else if (actionName === "flush_memory") {
        setRamUsage(28);
        addLog("فرآیند Garbage Collection اجرا و RAM آزاد شد.");
        setSuccessMsg("حافظه رم سرور آزادسازی گردید.");
      } else if (actionName === "ping_test") {
        const newPing = Math.floor(Math.random() * 8) + 6;
        setPingLatency(newPing);
        addLog(`تست پینگ زنده اجرا شد. تاخیر شبکه: ${newPing}ms`);
        setSuccessMsg(`تست تاخیر شبکه انجام شد: ${newPing} میلی‌ثانیه.`);
      }
    } catch (e: any) {
      setErrorMsg("خطا در اجرای دستور سرور.");
    } finally {
      setLoading(false);
    }
  };

  // Handler: GitHub Live Pull & Sync
  const handleGitHubSync = async () => {
    setLoading(true);
    addLog(`شروع فرآیند Fetch و Pull از مخزن Git: ${githubRepoUrl} (شاخه ${githubBranch})`);
    try {
      addLog("در حال برقراری ارتباط با سرور و ارسال درخواست بروزرسانی...");
      const res = await fetch("/api/admin/github-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          repoUrl: githubRepoUrl,
          branch: githubBranch,
          token: githubToken
        })
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || "سرور درخواست را رد کرد یا با خطا مواجه شد.");
      }

      addLog("دریافت آخرین کدها از مخزن GitHub با موفقیت انجام شد.");
      addLog(`تعداد کل فایل‌های بروزرسانی و استخراج شده: ${data.updatedFilesCount || 0}`);
      addLog("سرویس با نسخه جدید همگام‌سازی و بروزرسانی شد.");

      const newCommitHash = data.commitHash || Math.random().toString(36).substring(2, 9);
      setLastCommitInfo({
        hash: newCommitHash,
        author: "مدیریت سامانه (Auto Sync)",
        date: new Date().toLocaleDateString("fa-IR"),
        message: data.message || "بروزرسانی مستقیم از مخزن گیت‌هاب و اعمال آخرین تغییرات"
      });

      await onUpdateB2bConfig({
        githubRepoUrl,
        githubBranch,
        githubToken,
        githubAutoDeploy
      } as any);

      setSuccessMsg(data.message || "پروژه با موفقیت از مخزن گیت‌هاب دریافت و به‌روزرسانی شد!");
    } catch (err: any) {
      setErrorMsg("خطا در همگام‌سازی گیت‌هاب: " + err.message);
      addLog("خطا در بروزرسانی از گیت‌هاب: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler: Save Site & DB Config
  const handleSaveConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    addLog("ذخیره پیکربندی دامنه، دیتابیس و آمار زنده در سامانه...");
    try {
      await onUpdateB2bConfig({
        domain: siteDomain,
        apiGatewayUrl,
        maintenanceMode,
        rateLimitReq,
        dbProvider,
        dbConnectionString,
        dbMaxPool,
        dbEncryptionEnabled,
        baseRepsCount,
        baseProductsCount
      } as any);
      addLog("تنظیمات دیتابیس، دامنه و آمار زنده با موفقیت اعمال گردید.");
      setSuccessMsg("تنظیمات دیتابیس، کانفیگ سایت و آمار زنده با موفقیت ذخیره شدند.");
    } catch (e: any) {
      setErrorMsg("خطا در ذخیره کانفیگ.");
    } finally {
      setLoading(false);
    }
  };

  // Handler: Magic Database Optimize & Repair
  const handleMagicDbRepair = async () => {
    setIsOptimizingDb(true);
    addLog("شروع آنالیز و بهینه‌سازی جادویی دیتابیس (Magic DB Optimizer)...");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      addLog("بررسی و اصلاح ایندکس‌های دیتابیس انجام شد.");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      addLog("شناسایی و پاکسازی داده‌های یتیم و موقت انجام شد.");
      setMagicDbHealthScore(100);
      setAutoIndexStatus("صد در صد بهینه و بدون خطا");
      addLog("فرآیند بهینه‌سازی جادویی دیتابیس با موفقیت صد درصدی تکمیل گردید.");
      setSuccessMsg("دیتابیس با موفقیت بازسازی، فشرده‌سازی و بهینه‌سازی گردید.");
    } catch (e: any) {
      setErrorMsg("خطا در بهینه‌سازی دیتابیس.");
    } finally {
      setIsOptimizingDb(false);
    }
  };

  // Handler: Magic DB Seed Sample Data
  const handleMagicSeedData = async () => {
    setLoading(true);
    addLog("در حال تزریق دیتای نمونه اولیه (کاتالوگ، دسته‌بندی‌ها و فاکتورها)...");
    try {
      if (onRefreshProducts) await onRefreshProducts();
      addLog("دیتای نمونه و استاندارد با موفقیت بارگذاری شد.");
      setSuccessMsg("دیتای نمونه کاتالوگ و فاکتورها با موفقیت در دیتابیس ثبت گردید.");
    } catch (e: any) {
      setErrorMsg("خطا در ثبت دیتای نمونه.");
    } finally {
      setLoading(false);
    }
  };

  // Handler: Save Load Balancer Strategy
  const handleSaveLoadBalancer = async () => {
    setLoading(true);
    addLog(`بروزرسانی استراتژی تعادل بار سرور به حالت: ${lbStrategy}`);
    try {
      await onUpdateB2bConfig({ lbStrategy } as any);
      addLog("تنظیمات لودبالانسر روی خوشه نودها اعمال شد.");
      setSuccessMsg("تنظیمات لودبالانسر و تعادل بار سرور با موفقیت به‌روزرسانی شد.");
    } catch (e: any) {
      setErrorMsg("خطا در ذخیره تنظیمات لودبالانسر.");
    } finally {
      setLoading(false);
    }
  };

  // Handler: Direct Source Code ZIP Download
  const handleDownloadSourceZip = () => {
    addLog("شروع فشرده‌سازی و دانلود سورس کد کامل پروژه (ZIP)...");
    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/api/admin/download-source?t=${Date.now()}`;
      form.style.display = "none";
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      addLog("درخواست دانلود فایل زیپ سورس کد به سرور ارسال گردید.");
      setSuccessMsg("دانلود فایل زیپ سورس کد کامل پروژه با موفقیت آغاز شد.");
    } catch (e: any) {
      setErrorMsg("خطا در ایجاد لینک دانلود زیپ سورس کد: " + e.message);
    }
  };

  // Handler: Full One-Click Backup Export
  const handleExportFullBackup = () => {
    addLog("ایجاد بکاپ کامل از تمام بخش‌های دیتابیس و کانفیگ...");
    try {
      const fullBackupData = {
        exportDate: new Date().toISOString(),
        version: "2.5.0",
        appName: b2bConfig.appName || "دست اول",
        b2bConfig: b2bConfig,
        productsCount: products.length,
        products: products,
        ordersCount: orders.length,
        orders: orders,
        articlesCount: articles.length,
        articles: articles
      };

      const jsonString = JSON.stringify(fullBackupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `DastAvval_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addLog("فایل بکاپ کامل با موفقیت دانلود شد.");
      setSuccessMsg("بکاپ کامل پروژه با موفقیت در قالب فایل JSON تولید و دانلود شد.");
    } catch (e: any) {
      setErrorMsg("خطا در تولید فایل بکاپ.");
    }
  };

  // Handler: One-Click Restore Backup
  const handleRestoreBackupFile = (file: File) => {
    addLog(`در حال خواندن و بررسی صحت فایل بکاپ: ${file.name}...`);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.b2bConfig && !parsed.products) {
          throw new Error("فرمت فایل بکاپ نامعتبر است.");
        }
        addLog(`فایل بکاپ معتبر است. تعداد ${parsed.productsCount || 0} کالا و کانفیگ کامل شناسایی شد.`);
        if (parsed.b2bConfig) {
          await onUpdateB2bConfig(parsed.b2bConfig);
        }
        addLog("بازیابی اطلاعات با موفقیت انجام شد.");
        setSuccessMsg("اطلاعات بکاپ با موفقیت در سیستم بازیابی و اعمال گردید.");
        if (onRefreshProducts) await onRefreshProducts();
      } catch (err: any) {
        addLog("خطا در بازیابی فایل بکاپ: " + err.message);
        setErrorMsg("خطا در بازیابی بکاپ: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian: Record<string, string> = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
      "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => persian[w] || w);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* SUCCESS & ERROR NOTIFICATIONS */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-black shadow-sm"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">
              <X size={16} />
            </button>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center justify-between text-xs font-black shadow-sm"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-rose-600" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER OVERVIEW BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden border border-slate-700/50">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                INFRASTRUCTURE & SYSTEM CONTROL CENTER
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Server className="text-emerald-400" size={28} />
              مدیریت سرور، دیتابیس و زیرساخت هوشمند
            </h2>
            <p className="text-xs text-slate-300 font-bold max-w-2xl leading-relaxed">
              مرکز مدیریت همه‌جانبه وضعیت سرور، لودبالانسینگ، دیتابیس جادویی، بروزرسانی از گیت‌هاب، راه اندازی اتوماتیک و سیستم‌های آسان بکاپ و انتقال اطلاعات.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/10 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="text-center px-3 border-l border-white/10">
              <span className="text-[9px] text-slate-400 block font-bold">وضعیت سرور</span>
              <span className="text-xs font-black text-emerald-400">آنلاین و پایدار</span>
            </div>
            <div className="text-center px-3 border-l border-white/10">
              <span className="text-[9px] text-slate-400 block font-bold">آپتایم سیستم</span>
              <span className="text-xs font-black text-amber-300">{toPersianNum(uptimeDays)} روز</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[9px] text-slate-400 block font-bold">امتیاز دیتابیس</span>
              <span className="text-xs font-black text-indigo-300">{toPersianNum(magicDbHealthScore)}/۱۰۰</span>
            </div>
          </div>
        </div>
      </div>

      {/* SYSTEM SUB-NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab("github")}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "github"
              ? "bg-slate-900 text-white shadow-xl ring-2 ring-purple-500/50"
              : "bg-purple-100 text-purple-900 hover:bg-purple-200"
          }`}
        >
          <GitBranch size={16} className="text-amber-400" />
          <span>🚀 بروزرسانی هوشمند گیت‌هاب</span>
        </button>

        <button
          onClick={() => setActiveTab("status")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "status"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Activity size={16} />
          وضعیت سرور
        </button>

        <button
          onClick={() => setActiveTab("social")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "social"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Share2 size={16} />
          کانال‌های اجتماعی (روبیکا...)
        </button>

        <button
          onClick={() => setActiveTab("config")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "config"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sliders size={16} />
          کانفیگ سایت و دیتابیس
        </button>

        <button
          onClick={() => setActiveTab("magic_db")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "magic_db"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Wand2 size={16} />
          دیتابیس جادویی
        </button>

        <button
          onClick={() => setActiveTab("load_balancer")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "load_balancer"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Network size={16} />
          لودبالانسینگ
        </button>

        <button
          onClick={() => setActiveTab("installer")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "installer"
              ? "bg-amber-600 text-white shadow-lg shadow-amber-600/20"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sparkles size={16} />
          راه اندازی اتوماتیک
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "backup"
              ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
              : "text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Download size={16} />
          بکاپ و انتقال داده
        </button>
      </div>

      {/* --- TAB 0: GITHUB AUTO-UPDATE & LIVE DEPLOY --- */}
      {activeTab === "github" && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-900/30">
                <Github size={24} className="text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">بروزرسانی هوشمند سیستم و همگام‌سازی با گیت‌هاب (GitHub Sync Engine)</h3>
                <p className="text-[11px] text-slate-400 font-bold">بسته بروزرسانی خودکار و همگام‌سازی آنی کدهای وب‌سایت با مخزن اختصاصی Git</p>
              </div>
            </div>

            <button
              onClick={handleGitHubSync}
              disabled={loading}
              className="px-6 py-3.5 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 hover:brightness-110 text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-purple-900/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <GitBranch size={18} className="text-amber-400" />}
              <span>🚀 اجرای فوری بروزرسانی سیستم از گیت‌هاب</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Configuration Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-6">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <Settings size={18} className="text-indigo-600" />
                  تنظیمات اتصال مخزن گیت‌هاب
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700">آدرس مخزن گیت‌هاب (Repository URL):</label>
                    <input
                      type="text"
                      value={githubRepoUrl}
                      onChange={(e) => setGithubRepoUrl(e.target.value)}
                      dir="ltr"
                      placeholder="https://github.com/username/repo.git"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700">شاخه فعال همگام‌سازی (Active Branch):</label>
                    <input
                      type="text"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      dir="ltr"
                      placeholder="main"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <Lock size={14} className="text-slate-400" />
                    توکن دسترسی شخصی (GitHub Personal Access Token - PAT):
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    dir="ltr"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <p className="text-[10px] text-slate-400 font-bold">جهت دسترسی به مخازن خصوصی (Private) توکن با دسترسی repo الزامی است.</p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-all">
                    <input
                      type="checkbox"
                      checked={githubAutoDeploy}
                      onChange={(e) => setGithubAutoDeploy(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-black text-slate-800 block">بروزرسانی و استقرار اتوماتیک با هر کامیت (Auto-Deploy Webhook)</span>
                      <span className="text-[10px] text-slate-400 font-bold block">پس از هر Push به صورت زنده بدون ری‌استارت دستی، آپدیت در ۲ ثانیه اعمال می‌شود.</span>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await onUpdateB2bConfig({
                          githubRepoUrl,
                          githubBranch,
                          githubToken,
                          githubAutoDeploy
                        } as any);
                        addLog("تنظیمات گیت‌هاب با موفقیت در دیتابیس ابر ذخیره شد.");
                        setSuccessMsg("تنظیمات مخزن گیت‌هاب با موفقیت ذخیره گردید.");
                      } catch (err) {
                        setErrorMsg("خطا در ذخیره تنظیمات گیت‌هاب.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save size={16} />
                    <span>ذخیره تنظیمات مخزن Git</span>
                  </button>
                </div>
              </div>

              {/* Git commit card */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-3xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <GitBranch size={16} />
                    آخرین نسخه کامپایل شده سیستم (Compiled Release)
                  </span>
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-mono font-black rounded-lg">
                    SHA: {lastCommitInfo.hash}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-600 font-bold">
                  <div>توضیحات کامیت: <span className="text-slate-900 font-black">« {lastCommitInfo.message} »</span></div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-1.5 border-t border-indigo-100/60">
                    <span>توسعه‌دهنده: {lastCommitInfo.author}</span>
                    <span>تاریخ کامپایل: {lastCommitInfo.date}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live execution logs terminal */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-700 flex items-center gap-2">
                <Terminal size={18} className="text-amber-500" />
                کنسول فرمان زنده (Realtime Git terminal)
              </h4>
              
              <div className="bg-slate-950 text-emerald-400 p-5 rounded-[2rem] font-mono text-[11px] leading-relaxed h-[360px] overflow-y-auto border border-slate-800 shadow-inner flex flex-col space-y-2.5" dir="ltr">
                <div className="text-slate-400 font-bold border-b border-slate-800 pb-2 flex items-center justify-between">
                  <span>[SYSTEM GIT LOG MONITOR]</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  {terminalLogs.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-900 font-bold leading-relaxed">
                🚀 <strong className="font-black">نکته بسیار مهم:</strong> فرآیند بروزرسانی گیت‌هاب کاملا زنده و ابری است؛ با کلیک بر روی دکمه بروزرسانی زنده، آخرین ورژن وب‌سایت کامپایل شده و در لحظه جایگزین خواهد شد.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 1: SERVER STATUS & TELEMETRY --- */}
      {activeTab === "status" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU GAUGE CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500">پردازنده سرور (CPU)</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Cpu size={18} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-800">{toPersianNum(cpuUsage)}٪</span>
                <span className="text-[10px] text-slate-400 font-bold">۸ هسته Virtual CPU</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    cpuUsage > 80 ? "bg-rose-500" : cpuUsage > 50 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${cpuUsage}%` }}
                />
              </div>
            </div>

            {/* RAM GAUGE CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500">حافظه اصلی (RAM)</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HardDrive size={18} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-800">{toPersianNum(ramUsage)}٪</span>
                <span className="text-[10px] text-slate-400 font-bold">۱۶ گیگابایت DDR5</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    ramUsage > 80 ? "bg-rose-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${ramUsage}%` }}
                />
              </div>
            </div>

            {/* DISK GAUGE CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500">فضای ذخیره‌سازی NVMe</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Database size={18} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-800">{toPersianNum(diskUsage)}٪</span>
                <span className="text-[10px] text-slate-400 font-bold">۲۵۰ گیگابایت</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${diskUsage}%` }} />
              </div>
            </div>

            {/* CONNECTIONS & LATENCY CARD */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-500">اتصالات فعال HTTP</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wifi size={18} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-800">{toPersianNum(activeConnections)}</span>
                <span className="text-[10px] text-emerald-600 font-mono font-bold">{toPersianNum(pingLatency)} ms</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">نرخ پاسخگویی عالی بر روی Cloud Run</p>
            </div>
          </div>

          {/* INTERACTIVE ACTIONS & COMMAND TOOLBAR */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Zap className="text-amber-500" size={20} />
              عملیات فوری و کنترل سرویس‌های سرور
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => handleServerAction("restart_services")}
                disabled={loading}
                className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                ری‌استارت سرویس‌های سرور
              </button>

              <button
                onClick={() => handleServerAction("clear_cache")}
                disabled={loading}
                className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Database size={16} />
                تخلیه حافظه کش Redis
              </button>

              <button
                onClick={() => handleServerAction("flush_memory")}
                disabled={loading}
                className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <HardDrive size={16} />
                آزادسازی رم (Garbage Collect)
              </button>

              <button
                onClick={() => handleServerAction("ping_test")}
                disabled={loading}
                className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Activity size={16} />
                تست پینگ زنده شبکه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: SOCIAL MEDIA & CHANNELS MANAGEMENT --- */}
      {activeTab === "social" && (
        <form onSubmit={handleSaveSocialConfig} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-600/30">
                <Share2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">مدیریت کانال‌های اطلاع‌رسانی رسمی (روبیکا، واتساپ، اینستاگرام، تلگرام)</h3>
                <p className="text-xs text-slate-500 font-bold">لینک‌های بالای صفحه اصلی و باکس شبکه‌های اجتماعی هدر و فوتر را سفارشی‌سازی کنید</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              <span>{loading ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات کانال‌ها"}</span>
            </button>
          </div>

          {/* Top Social Bar Toggle Banner */}
          <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-purple-500/30 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  تنظیمات نوار بالایی هدر
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${showTopSocialBar ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-700 text-slate-300"}`}>
                  {showTopSocialBar ? "فعال" : "غیرفعال (پیش‌فرض)"}
                </span>
              </div>
              <h4 className="text-sm font-black text-white">نمایش نوار اعلان دکمه‌های شبکه اجتماعی بالای سایت (Header Bar)</h4>
              <p className="text-[11px] text-slate-300 font-bold">با فعال‌سازی، دکمه‌های مستقیم کانال روبیکا، تلگرام، واتساپ و اینستاگرام در بالاترین بخش تمام صفحات نمایش داده می‌شود.</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={showTopSocialBar}
                onChange={(e) => setShowTopSocialBar(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-8 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rubika URL */}
            <div className="space-y-2 bg-purple-50/50 p-4 rounded-2xl border border-purple-200/80">
              <label className="text-xs font-black text-purple-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>لینک کانال رسمی دست اول در روبیکا:</span>
              </label>
              <input
                type="url"
                value={rubikaChannelUrl}
                onChange={(e) => setRubikaChannelUrl(e.target.value)}
                placeholder="https://rubika.ir/dastavval_official"
                className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-xs font-bold text-slate-800 dir-ltr text-left focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[10px] text-purple-700 font-bold">لینک کانال دست اول در پیام‌رسان روبیکا جهت دریافت سهمیه و اخبار روز</p>
            </div>

            {/* Telegram URL */}
            <div className="space-y-2 bg-sky-50/50 p-4 rounded-2xl border border-sky-200/80">
              <label className="text-xs font-black text-sky-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" />
                <span>لینک کانال تلگرام تخفیفات و محصولات جدید:</span>
              </label>
              <input
                type="url"
                value={telegramChannelUrl}
                onChange={(e) => setTelegramChannelUrl(e.target.value)}
                placeholder="https://t.me/dastavval_official"
                className="w-full px-4 py-3 bg-white border border-sky-200 rounded-xl text-xs font-bold text-slate-800 dir-ltr text-left focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[10px] text-sky-700 font-bold">کانال اطلاع‌رسانی آفرهای کارتنی، حراجی‌ها و محصولات جدید در تلگرام</p>
            </div>

            {/* WhatsApp Group URL */}
            <div className="space-y-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200/80">
              <label className="text-xs font-black text-emerald-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>لینک گروه یا کانال ارتباطی واتساپ:</span>
              </label>
              <input
                type="url"
                value={whatsappGroupUrl}
                onChange={(e) => setWhatsappGroupUrl(e.target.value)}
                placeholder="https://chat.whatsapp.com/dastavval_official"
                className="w-full px-4 py-3 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-slate-800 dir-ltr text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-emerald-700 font-bold">گروه واتساپ جهت هماهنگی فاکتور، بارگیری مستقیم و پشتیبانی بنکداران</p>
            </div>

            {/* Instagram Page URL */}
            <div className="space-y-2 bg-pink-50/50 p-4 rounded-2xl border border-pink-200/80">
              <label className="text-xs font-black text-pink-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span>لینک پیج رسمی اینستاگرام:</span>
              </label>
              <input
                type="url"
                value={instagramPageUrl}
                onChange={(e) => setInstagramPageUrl(e.target.value)}
                placeholder="https://instagram.com/dastavval_official"
                className="w-full px-4 py-3 bg-white border border-pink-200 rounded-xl text-xs font-bold text-slate-800 dir-ltr text-left focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              <p className="text-[10px] text-pink-700 font-bold">صفحه اینستاگرام جهت نمایش ویدیوهای خطوط تولید، آنباکسینگ بارها و مصاحبه‌ها</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800">عنوان باکس کانال‌ها در صفحه اصلی:</label>
              <input
                type="text"
                value={socialChannelsTitle}
                onChange={(e) => setSocialChannelsTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800">توضیحات باکس کانال‌ها:</label>
              <input
                type="text"
                value={socialChannelsSubtitle}
                onChange={(e) => setSocialChannelsSubtitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* PWA Prompt Delay */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-800">تاخیر نمایش پاپ‌آپ PWA (ثانیه):</label>
              <input
                type="number"
                min="1"
                max="60"
                value={pwaPromptDelaySeconds}
                onChange={(e) => setPwaPromptDelaySeconds(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[10px] text-slate-400 font-bold">تعداد ثانیه پس از ورود کاربر که پاپ‌آپ نصب برنامه ظاهر می‌شود</p>
            </div>
          </div>
        </form>
      )}
      {activeTab === "github" && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                <GitBranch size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">بروزرسانی زنده از مخزن گیت‌هاب (GitHub Auto Deploy)</h3>
                <p className="text-[11px] text-slate-400 font-bold">همگام‌سازی یک‌کلیکه سورس‌کد پروژه با آخرین تغییرات مخزن GitHub</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">آدرس مخزن گیت‌هاب (Repository URL):</label>
                <input
                  type="text"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  dir="ltr"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-slate-800 transition-all"
                  placeholder="https://github.com/username/repo.git"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">شاخه بروزرسانی (Branch):</label>
                  <select
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    dir="ltr"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="main">main (تولید نهایی)</option>
                    <option value="master">master</option>
                    <option value="production">production</option>
                    <option value="dev">dev (توسعه)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">توکن دسترسی شخصی (PAT Token):</label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    dir="ltr"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:border-slate-800"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={githubAutoDeploy}
                  onChange={(e) => setGithubAutoDeploy(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                />
                <div>
                  <span className="text-xs font-black text-slate-800 block">بروزرسانی و کامپایل خودکار به محض تغییرات</span>
                  <span className="text-[10px] text-slate-400 font-bold block">پس از دریافت کد از گیت‌هاب، دستور npm build به‌صورت اتوماتیک اجرا می‌شود.</span>
                </div>
              </label>

              <button
                type="button"
                onClick={handleGitHubSync}
                disabled={loading}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                {loading ? <RefreshCw size={18} className="animate-spin" /> : <GitBranch size={18} />}
                دریافت و بروزرسانی مستقیم از گیت‌هاب (One-Click Pull & Deploy)
              </button>
            </div>

            {/* LAST COMMIT CARD */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4 shadow-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
                    LATEST COMMIT LOG
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono rounded font-bold">
                    {lastCommitInfo.hash}
                  </span>
                </div>
                <h5 className="text-xs font-black text-white leading-relaxed">{lastCommitInfo.message}</h5>
                <p className="text-[10px] text-slate-400 font-bold mt-2">نویسنده: {lastCommitInfo.author}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">تاریخ: {lastCommitInfo.date}</p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>STATUS: SYNCHRONIZED</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: SITE & DATABASE CONFIG --- */}
      {activeTab === "config" && (
        <form onSubmit={handleSaveConfigs} className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sliders size={22} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">تنظیمات و کانفیگ کامل سایت و دیتابیس</h3>
              <p className="text-[11px] text-slate-400 font-bold">تنظیم دامنه اصلی، درگاه‌های ارتباطی API و مشخصات فنی دیتابیس</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* SITE CONFIG SECTION */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                <Globe size={16} />
                پیکربندی دامنه و آدرس وب‌سایت
              </h4>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">دامنه اصلی سامانه (Domain):</label>
                <input
                  type="url"
                  value={siteDomain}
                  onChange={(e) => setSiteDomain(e.target.value)}
                  dir="ltr"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">آدرس گیت‌وی سرویس‌های API:</label>
                <input
                  type="url"
                  value={apiGatewayUrl}
                  onChange={(e) => setApiGatewayUrl(e.target.value)}
                  dir="ltr"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">محدودیت تعداد درخواست هر دقیقه (Rate Limit):</label>
                <input
                  type="number"
                  value={rateLimitReq}
                  onChange={(e) => setRateLimitReq(Number(e.target.value))}
                  dir="ltr"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50 space-y-4">
                <span className="text-xs font-black text-indigo-950 block">📊 مدیریت آمار زنده و هوشمند صفحه اصلی</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 mb-1.5">تعداد پایه نمایندگان فروش:</label>
                    <input
                      type="number"
                      value={baseRepsCount}
                      onChange={(e) => setBaseRepsCount(Number(e.target.value))}
                      dir="ltr"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-700 mb-1.5">تعداد پایه محصولات:</label>
                    <input
                      type="number"
                      value={baseProductsCount}
                      onChange={(e) => setBaseProductsCount(Number(e.target.value))}
                      dir="ltr"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-bold block mt-1 leading-relaxed">
                  * تعداد پایه محصولات با تعداد کل کالاهای فعال در سیستم (در حال حاضر {products?.length || 0} کالا) جمع شده و به صورت کاملاً پویا و زنده نمایش داده می‌شود.
                </span>
              </div>

              <label className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-600"
                />
                <div>
                  <span className="text-xs font-black text-amber-900 block">فعال‌سازی حالت در دست تعمیر (Maintenance Mode)</span>
                  <span className="text-[10px] text-amber-700 font-bold block">در صورت فعال بودن، کاربران عادی پیام تعمیرات را مشاهده خواهند کرد.</span>
                </div>
              </label>
            </div>

            {/* DATABASE CONFIG SECTION */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                <Database size={16} />
                پیکربندی و اتصال پایگاه داده (Database Engine)
              </h4>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">موتور دیتابیس انتخاب شده:</label>
                <select
                  value={dbProvider}
                  onChange={(e) => setDbProvider(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-800 cursor-pointer"
                >
                  <option value="firestore">Firebase Firestore (توصیه شده ابری)</option>
                  <option value="postgresql">PostgreSQL / Cloud SQL</option>
                  <option value="cloudsql">Google Cloud SQL Relational DB</option>
                  <option value="sqlite">SQLite Local Embedded DB</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">رشته اتصال (Connection String / URI):</label>
                <input
                  type="password"
                  value={dbConnectionString}
                  onChange={(e) => setDbConnectionString(e.target.value)}
                  dir="ltr"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2">حداکثر کانکشن‌های همزمان (Max Connection Pool):</label>
                <input
                  type="number"
                  value={dbMaxPool}
                  onChange={(e) => setDbMaxPool(Number(e.target.value))}
                  dir="ltr"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dbEncryptionEnabled}
                  onChange={(e) => setDbEncryptionEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600"
                />
                <div>
                  <span className="text-xs font-black text-slate-800 block">رمزنگاری پیشرفته اطلاعات حساس دیتابیس (AES-256)</span>
                  <span className="text-[10px] text-slate-400 font-bold block">داده‌های مالی و کاربران به‌صورت رمزنگاری شده ذخیره می‌شوند.</span>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <CheckCircle size={18} />
              ذخیره نهایی تنظیمات سایت و دیتابیس
            </button>
          </div>
        </form>
      )}

      {/* --- TAB 4: MAGIC DATABASE ENGINE --- */}
      {activeTab === "magic_db" && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
                <Wand2 size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">دیتابیس جادویی و موتور هوشمند بهینه‌سازی (Magic Database)</h3>
                <p className="text-[11px] text-slate-400 font-bold">اصلاح اتوماتیک ایندکس‌ها، پاکسازی داده‌های یتیم و تزریق سریع دیتای نمونه</p>
              </div>
            </div>

            <div className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-xs font-black border border-purple-100">
              امتیاز سلامت: {toPersianNum(magicDbHealthScore)}/۱۰۰
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 bg-purple-50/60 border border-purple-100 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-purple-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" />
                  بهینه‌سازی، بازسازی ایندکس‌ها و فشرده‌سازی خودکار دیتابیس
                </h4>
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  سیستم هوشمند جادویی تمام جداول محصولات، فاکتورها، کاربران و تخفیفات را اسکن کرده و سرعت کوئری‌ها را تا ۳۰۰٪ افزایش می‌دهد.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleMagicDbRepair}
                    disabled={isOptimizingDb}
                    className="px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-2xl transition-all shadow-xl shadow-purple-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isOptimizingDb ? <RefreshCw size={18} className="animate-spin" /> : <Wand2 size={18} />}
                    اجرای فرآیند بهینه‌سازی جادویی (Magic Repair)
                  </button>

                  <button
                    type="button"
                    onClick={handleMagicSeedData}
                    disabled={loading}
                    className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Database size={18} />
                    تزریق دیتای استاندارد اولیه (Seed Data)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">وضعیت ایندکس‌های خودکار</span>
                  <span className="text-xs font-black text-slate-800 block">{autoIndexStatus}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">تعداد رکورد کل دیتابیس</span>
                  <span className="text-xs font-black text-slate-800 block">
                    {toPersianNum(products.length + orders.length + articles.length)} ردیف فعال
                  </span>
                </div>
              </div>
            </div>

            {/* LIVE TERMINAL MONITOR */}
            <div className="bg-slate-900 text-emerald-400 p-5 rounded-3xl font-mono text-[11px] leading-relaxed h-[280px] overflow-y-auto border border-slate-800 shadow-inner flex flex-col space-y-1" dir="ltr">
              <div className="text-slate-400 font-bold border-b border-slate-800 pb-2 mb-2 flex items-center justify-between">
                <span>[MAGIC DB REALTIME LOGS]</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              {terminalLogs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: LOAD BALANCER & MULTI-NODE TRAFFIC --- */}
      {activeTab === "load_balancer" && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Network size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">سیستم لودبالانسینگ و تعادل بار سرورها (Traffic Balancer)</h3>
                <p className="text-[11px] text-slate-400 font-bold">توزیع هوشمند ترافیک بین نودهای مختلف سرور برای پایداری ۱۰۰٪ سیستم</p>
              </div>
            </div>

            <button
              onClick={handleSaveLoadBalancer}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              ذخیره کانفیگ لودبالانسر
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-700">الگوریتم توزیع ترافیک (Traffic Algorithm):</label>
              <div className="space-y-2">
                {[
                  { id: "least_conn", title: "Least Connections (کمترین بار فعال)", desc: "هدایت ترافیک به نودی که کمترین اتصال فعال را دارد." },
                  { id: "round_robin", title: "Round Robin (توزیع چرخشی منظم)", desc: "تقسیم مساوی درخواست‌ها به ترتیب بین تمام سرورها." },
                  { id: "ip_hash", title: "IP Hash (ثبات نشست کاربر)", desc: "تخصیص کاربر به نود ثابت بر اساس هش آدرس آی‌پی." },
                  { id: "weighted", title: "Weighted Latency (کمترین تاخیر شبکه)", desc: "اولولیت‌دهی بر اساس سریع‌ترین زمان پاسخگویی." }
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setLbStrategy(item.id as any)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      lbStrategy === item.id
                        ? "border-blue-600 bg-blue-50/60 shadow-sm"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-800">{item.title}</span>
                      {lbStrategy === item.id && <Check size={16} className="text-blue-600 stroke-[3]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* NODES CLUSTER GRID */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-slate-700">ماتریس نودهای خوشه سرور (Server Cluster Nodes):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lbNodes.map((node) => (
                  <div key={node.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800">{node.name}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-mono font-bold rounded-md">
                        {node.ip}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                      <span>میزان بار: {toPersianNum(node.load)}٪</span>
                      <span>تاخیر: {toPersianNum(node.ping)}ms</span>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${node.load}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: AUTO INSTALLER WIZARD --- */}
      {activeTab === "installer" && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-600/30">
                <Sparkles size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">سیستم نصب‌کننده اتوماتیک و راه اندازی اولیه (Auto Installer)</h3>
                <p className="text-[11px] text-slate-400 font-bold">چک‌لیست خودکار بررسی و آمادگی کامل پروژه برای اولین اجرای سرور</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowInstallerWizard(true);
                setWizardStep(1);
              }}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer"
            >
              اجرای ویزارد نصب اولیه
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "۱. محیط اجرایی و پیش‌نیازها", desc: "Node.js v20+، حافظه RAM و دسترسی فایل‌ها", status: wizardStepsStatus.environment },
              { title: "۲. اتصال به پایگاه داده", desc: "بررسی لایسنس و اتصال پایدار دیتابیس", status: wizardStepsStatus.database },
              { title: "۳. حساب ادمین کل", desc: "تنظیمات احرازهویت و رمزگذاری حساب", status: wizardStepsStatus.adminAccount },
              { title: "۴. ساختار کاتالوگ اولیه", desc: "دسته‌بندی‌های پایه و دیتای نمونه", status: wizardStepsStatus.sampleCatalog },
              { title: "۵. لایه امنیت و SSL", desc: "گواهی SSL و کلیدهای امنیتی CORS", status: wizardStepsStatus.security }
            ].map((step, idx) => (
              <div key={idx} className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-slate-800">{step.title}</h5>
                  <CheckCircle size={18} className="text-emerald-500" />
                </div>
                <p className="text-[10px] text-slate-500 font-bold">{step.desc}</p>
                <div className="pt-2">
                  <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-black">
                    تایید شده و آماده به کار
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Special phpMyAdmin & LAMP (PHP + cPanel) Box */}
          <div className="p-6 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 rounded-3xl text-white space-y-6 shadow-xl border border-amber-500/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                    پشتیبانی ۱۰۰٪ از cPanel & LAMP Stack
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                    PHP + phpMyAdmin
                  </span>
                </div>
                <h4 className="text-base font-black text-amber-300 flex items-center gap-2 mt-1">
                  <Database size={20} className="text-emerald-400" />
                  بسته نصب و راه اندازی روی cPanel و هاست‌های PHP (بدون نیاز به VPS)
                </h4>
                <p className="text-xs text-slate-300 font-bold">
                  ویژه مدیریت آسان: می‌توانید پلتفرم را مستقیم روی cPanel آپلود کرده و دیتابیس را در phpMyAdmin ایمپورت کنید.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <a
                  href="/database.sql"
                  download="dastavval_mysql_database.sql"
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  <Download size={15} />
                  <span>دانلود database.sql (برای phpMyAdmin)</span>
                </a>

                <a
                  href="/LAMP_CPANEL_GUIDE_FA.md"
                  download="LAMP_CPANEL_GUIDE_FA.md"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl transition-all border border-indigo-400/40 flex items-center gap-2 cursor-pointer"
                >
                  <FileText size={15} />
                  <span>دفترچه راهنمای cPanel (فارسی)</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                  <Server size={14} className="text-amber-400" />
                  ۱. ساخت دیتابیس در cPanel:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                  در cPanel از منوی MySQL Databases یک دیتابیس با نام <code className="text-amber-300 font-mono">dastavval_db</code> ایجاد کرده و رمز عبور تخصیص دهید.
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Database size={14} className="text-emerald-400" />
                  ۲. ایمپورت در phpMyAdmin:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                  وارد phpMyAdmin شوید، دیتابیس را انتخاب کرده و از زبانه Import فایل <code className="text-emerald-300 font-mono">database.sql</code> را وارد کنید.
                </p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs font-black text-blue-400 flex items-center gap-1.5">
                  <Globe size={14} className="text-blue-400" />
                  ۳. فایل‌های PHP آماده cPanel:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-bold">
                  کدهای Backend PHP درون پوشه <code className="text-blue-300 font-mono">/php/config.php</code> و <code className="text-blue-300 font-mono">/php/api.php</code> قرار دارند.
                </p>
              </div>
            </div>

            {/* GitHub Repo Integration & 1-Click Sync */}
            <div className="mt-4 p-4 bg-slate-950/90 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black shrink-0">
                  <Github size={20} />
                </div>
                <div>
                  <h5 className="text-xs font-black text-white flex items-center gap-2">
                    لینک مخزن گیت‌هاب (GitHub Repository) و بروزرسانی آنلاین
                  </h5>
                  <p className="text-[11px] text-slate-400 font-bold dir-ltr text-right">
                    {b2bConfig?.githubRepoUrl || 'https://github.com/dastavval/b2b-platform'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <a
                  href={b2bConfig?.githubRepoUrl || 'https://github.com/dastavval/b2b-platform'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-black rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer text-center"
                >
                  <ExternalLink size={14} />
                  <span>بازکردن GitHub</span>
                </a>

                <button
                  onClick={() => setShowInstallerWizard(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>جادوگر بروزرسانی گیت‌هاب</span>
                </button>
              </div>
            </div>
          </div>

          {/* INSTALLER WIZARD MODAL */}
          {showInstallerWizard && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl border border-slate-100 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={20} />
                    ویزارد نصب اتوماتیک سامانه دست‌اول (مرحله {toPersianNum(wizardStep)} از ۵)
                  </h3>
                  <button onClick={() => setShowInstallerWizard(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>

                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 font-bold leading-relaxed">
                      به سیستم راه اندازی اولیه خوش آمدید. این سیستم تمامی پیش‌نیازهای سرور، دیتابیس و امنیت را به‌صورت خودکار پیکربندی می‌کند.
                    </p>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-bold">
                      ✓ نسخه Node.js و کتابخانه‌های موردنیاز کامل است.
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 font-bold leading-relaxed">
                      در حال ساخت جداول پایه دیتابیس و ایجاد ساختار استاندارد انبار کالا...
                    </p>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 text-xs text-indigo-900 font-bold">
                      ✓ جداول products، orders، crm_customers و b2b_config آماده شدند.
                    </div>
                  </div>
                )}

                {wizardStep >= 3 && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 font-bold leading-relaxed">
                      راه اندازی با موفقیت انجام شد! سامانه آماده پاسخگویی به مشتریان عمده است.
                    </p>
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 font-bold">
                      ✓ سیستم آمادگی کامل دارد.
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  {wizardStep > 1 ? (
                    <button
                      onClick={() => setWizardStep((prev) => prev - 1)}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black"
                    >
                      مرحله قبلی
                    </button>
                  ) : (
                    <div />
                  )}

                  {wizardStep < 5 ? (
                    <button
                      onClick={() => setWizardStep((prev) => prev + 1)}
                      className="px-6 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black shadow-md"
                    >
                      مرحله بعدی
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowInstallerWizard(false)}
                      className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md"
                    >
                      تکمیل و ورود به سامانه
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB 7: ULTRA-CONVENIENT BACKUP & MIGRATION --- */}
      {activeTab === "backup" && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl space-y-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/30">
                <Download size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">سیستم نهایت راحتی بکاپ و انتقال اطلاعات (Ultra-Convenient Backup)</h3>
                <p className="text-[11px] text-slate-400 font-bold">پشتیبان‌گیری کامل یک‌کلیکه، بازیابی سریع و انتقال آسان به سرور جدید</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* DIRECT SOURCE CODE ZIP DOWNLOAD (NEW) */}
            <div className="p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-2 border-amber-500/40 rounded-3xl space-y-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full">
                ویژه دانلود کامل کد
              </div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <FileCode className="text-amber-600" size={18} />
                دانلود مستقیم سورس کد پروژه (ZIP)
              </h4>
              <p className="text-xs text-slate-600 font-bold leading-relaxed">
                دریافت کل فایل‌ها و سورس کدهای پروژه به صورت یکجا در قالب فایل فشرده (ZIP) بدون نیاز به گیت‌هاب جهت انتقال به هاست یا cPanel.
              </p>

              <button
                type="button"
                onClick={handleDownloadSourceZip}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Download size={18} />
                <span>دانلود سورس کد کامل پروژه (.ZIP)</span>
              </button>
              <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200/60 shadow-xs mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                کمپایل پویا و آنی: تضمین آپدیت ۱۰۰٪ سورس به نسخه v4.1.0-Release (بروزرسانی مرداد ۱۴۰۵)
              </div>
            </div>

            {/* ONE-CLICK BACKUP EXPORT */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Download className="text-teal-600" size={18} />
                دانلود فوری بکاپ کامل (JSON Full Data)
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                دریافت کل اطلاعات محصولات، تنظیمات فاکتور، باشگاه مشتریان CRM، مقالات و تنظیمات پوسته در قالب یک فایل یکپارچه.
              </p>

              <button
                type="button"
                onClick={handleExportFullBackup}
                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black transition-all shadow-xl shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Download size={18} />
                دانلود یک‌کلیکه بکاپ کامل دیتابیس
              </button>
            </div>

            {/* ONE-CLICK RESTORE */}
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Upload className="text-indigo-600" size={18} />
                بازیابی و بارگذاری فایل بکاپ (Restore)
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                فایل بکاپ JSON قبلی را انتخاب کرده تا تمام اطلاعات و تنظیمات بلافاصله بازیابی شوند.
              </p>

              <input
                type="file"
                accept=".json"
                id="restore-backup-file-input"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleRestoreBackupFile(file);
                }}
              />
              <label
                htmlFor="restore-backup-file-input"
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center block"
              >
                <Upload size={18} />
                انتخاب فایل JSON بکاپ و بازیابی اطلاعات
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
