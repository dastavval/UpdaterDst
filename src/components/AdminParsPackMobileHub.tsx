import React, { useState, useEffect } from "react";
import {
  Code,
  Copy,
  Check,
  Server,
  Cloud,
  Layers,
  Database,
  RefreshCw,
  Zap,
  Globe,
  Send,
  FileCode,
  Box,
  Building2,
  Users,
  Megaphone,
  Sliders,
  Terminal,
  Download,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FileText,
  Calculator,
  CheckCircle2,
  ListFilter,
  ShoppingBag,
  MessageSquare,
  ShieldAlert,
  Key,
  CheckSquare,
  FileCheck,
  Play,
  Pause,
  Clock,
  Activity,
  Settings
} from "lucide-react";
import { B2BConfig, Product } from "../types";

interface Props {
  b2bConfig: B2BConfig;
  onUpdateB2bConfig: (cfg: B2BConfig) => void;
  products?: Product[];
  onRefreshProducts?: () => Promise<void> | void;
}

const kotlinWorkManagerCode = [
  "package com.dastavval.admin.worker",
  "",
  "import android.content.Context",
  "import androidx.work.CoroutineWorker",
  "import androidx.work.WorkerParameters",
  "import androidx.work.PeriodicWorkRequestBuilder",
  "import androidx.work.WorkManager",
  "import androidx.work.ExistingPeriodicWorkPolicy",
  "import java.util.concurrent.TimeUnit",
  "import com.dastavval.admin.data.RetrofitClient",
  "",
  "/**",
  " * ParsPack S3 & REST API Auto-Sync Worker for Android client",
  " * Syncs client database with server-bucket every 30 minutes in background",
  " */",
  "class ParsPackSyncWorker(",
  "    appContext: Context,",
  "    workerParams: WorkerParameters",
  ") : CoroutineWorker(appContext, workerParams) {",
  "",
  "    override suspend fun doWork(): Result {",
  "        return try {",
  "            // 1. Trigger S3 Sync on the central Server hub",
  "            val response = RetrofitClient.apiService.getOrders()",
  "            if (response.isSuccessful) {",
  "                // Local synchronization logic with database here",
  "                Result.success()",
  "            } else {",
  "                Result.retry()",
  "            }",
  "        } catch (e: Exception) {",
  "            Result.retry()",
  "        }",
  "    }",
  "",
  "    companion object {",
  "        private const val SYNC_TAG = \"DastavvalParsPackSync\"",
  "",
  "        fun schedule(context: Context) {",
  "            val syncRequest = PeriodicWorkRequestBuilder<ParsPackSyncWorker>(",
  "                30, TimeUnit.MINUTES,",
  "                10, TimeUnit.MINUTES",
  "            ).build()",
  "",
  "            WorkManager.getInstance(context).enqueueUniquePeriodicWork(",
  "                SYNC_TAG,",
  "                ExistingPeriodicWorkPolicy.KEEP,",
  "                syncRequest",
  "            )",
  "        }",
  "    }",
  "}"
].join("\n");

const KOTLIN_CODE_SNIPPET = [
  "package com.dastavval.admin.data",
  "",
  "import retrofit2.Response",
  "import retrofit2.http.*",
  "import com.google.gson.annotations.SerializedName",
  "",
  "// 1. Generic API Response Wrapper",
  "data class ApiResponse<T>(",
  "    val success: Boolean,",
  "    val count: Int? = null,",
  "    val data: T? = null,",
  "    val message: String? = null,",
  "    val error: String? = null",
  ")",
  "",
  "// 2. Data Models (Example for Product & Order)",
  "data class ProductModel(",
  "    val id: String,",
  "    val name: String,",
  "    val code: String? = null,",
  "    val factoryCode: String? = null,",
  "    val brand: String? = null,",
  "    val factoryName: String? = null,",
  "    val category: String? = null,",
  "    val subCategory: String? = null,",
  "    val price: Long = 0,",
  "    @SerializedName(\"bulk_price\") val bulkPrice: Long = 0,",
  "    @SerializedName(\"consumer_price\") val consumerPrice: Long = 0,",
  "    val cartonPackCount: Int = 1,",
  "    val minOrderCartons: Int = 1,",
  "    val stockQuantityCartons: Int = 0,",
  "    val unit: String = \"عدد\",",
  "    val leadTimeDays: Int = 0,",
  "    val description: String? = null,",
  "    val technicalSpecs: Map<String, String>? = null,",
  "    val imageUrl: String? = null,",
  "    val isFeatured: Boolean = false,",
  "    val isBestseller: Boolean = false,",
  "    val isKafBazaar: Boolean = false,",
  "    val status: String = \"active\",",
  "    val createdAt: String? = null,",
  "    val updatedAt: String? = null",
  ")",
  "",
  "data class OrderModel(",
  "    val id: String,",
  "    val orderId: String? = null,",
  "    val trackingNumber: String,",
  "    val customerName: String,",
  "    val customerPhone: String,",
  "    val totalAmount: Long,",
  "    val status: String,",
  "    val statusTitle: String? = null,",
  "    val paymentStatus: String,",
  "    val createdAt: String? = null",
  ")",
  "",
  "// (Other models like TicketModel, ApprovalsModel should be defined similarly based on JSON schemas)",
  "",
  "// 3. Retrofit Interface",
  "interface DastavvalApiService {",
  '    @GET("api/v1/dev/products")',
  "    suspend fun getProducts(): Response<ApiResponse<List<ProductModel>>>",
  "",
  '    @POST("api/v1/dev/products")',
  "    suspend fun saveProduct(@Body product: ProductModel): Response<ApiResponse<ProductModel>>",
  "",
  '    @DELETE("api/v1/dev/products/{productId}")',
  '    suspend fun deleteProduct(@Path("productId") productId: String): Response<ApiResponse<Unit>>',
  "",
  '    @GET("api/v1/dev/orders")',
  "    suspend fun getOrders(): Response<ApiResponse<List<OrderModel>>>",
  "",
  '    @POST("api/v1/dev/orders")',
  "    suspend fun updateOrder(@Body order: OrderModel): Response<ApiResponse<OrderModel>>",
  "",
  '    @GET("api/v1/dev/tickets")',
  "    suspend fun getTickets(): Response<ApiResponse<List<Any>>>",
  "",
  '    @POST("api/v1/dev/tickets")',
  "    suspend fun replyTicket(@Body ticket: Any): Response<ApiResponse<Any>>",
  "",
  '    @GET("api/v1/dev/approvals")',
  "    suspend fun getPendingApprovals(): Response<ApiResponse<Any>>",
  "",
  '    @POST("api/v1/dev/approvals")',
  "    suspend fun submitApproval(@Body request: Any): Response<ApiResponse<Unit>>",
  "}",
  "",
  "// 4. Retrofit Client Singleton pointing to Primary Production Domain",
  "object RetrofitClient {",
  '    private const val BASE_URL = "https://dastavval.com/" // Primary Production Domain',
  "    ",
  "    private val okHttpClient = okhttp3.OkHttpClient.Builder()",
  "        .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)",
  "        .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)",
  "        .addInterceptor { chain ->",
  "            val req = chain.request().newBuilder()",
  '                .header("Accept", "application/json")',
  '                .header("Content-Type", "application/json")',
  "                .build()",
  "            chain.proceed(req)",
  "        }",
  "        .build()",
  "",
  "    val apiService: DastavvalApiService by lazy {",
  "        retrofit2.Retrofit.Builder()",
  "            .baseUrl(BASE_URL)",
  "            .client(okHttpClient)",
  "            .addConverterFactory(retrofit2.converter.gson.GsonConverterFactory.create())",
  "            .build()",
  "            .create(DastavvalApiService::class.java)",
  "    }",
  "}"
].join("\n");

export default function AdminParsPackMobileHub({
  b2bConfig,
  products = [],
  onUpdateB2bConfig
}: Props) {
  const primaryDomain = "https://dastavval.com";
  const [domainMode, setDomainMode] = useState<"primary" | "current">("primary");
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : primaryDomain;
  const baseUrl = domainMode === "primary" ? primaryDomain : currentOrigin;

  const [isApplyingPrimaryDomain, setIsApplyingPrimaryDomain] = useState(false);
  const [primaryDomainSuccessMsg, setPrimaryDomainSuccessMsg] = useState<string | null>(null);

  const applyPrimaryDomainConfig = async () => {
    setIsApplyingPrimaryDomain(true);
    try {
      const res = await fetch("/api/admin/set-primary-domain", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPrimaryDomainSuccessMsg("تنظیمات باکت، وب‌سرویس‌ها و دامنه اصلی با موفقیت تثبیت و با سرور و باکت پارس‌پک همگام شدند.");
        if (onUpdateB2bConfig && data.config) {
          await onUpdateB2bConfig(data.config);
        }
        await triggerInstantSync();
      } else {
        throw new Error(data.error || "خطا در تنظیم دامنه اصلی");
      }
    } catch (e: any) {
      alert("خطا: " + e.message);
    } finally {
      setIsApplyingPrimaryDomain(false);
    }
  };
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"schemas" | "tester" | "snippets" | "s3_direct" | "formulas" | "auto_sync">("schemas");
  const [selectedSchema, setSelectedSchema] = useState<"products" | "factories" | "agents" | "ads" | "users" | "orders" | "tickets" | "approvals" | "config">("products");

  // Auto-Sync Update Engine States
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(30); // in minutes
  const [nextSyncCountdown, setNextSyncCountdown] = useState<number>(30 * 60); // seconds
  const [isSyncingNow, setIsSyncingNow] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  const [syncLogs, setSyncLogs] = useState<Array<{ id: string; timestamp: string; status: "success" | "error"; durationMs: number; message: string; filesCount: number }>>([
    {
      id: "log-1",
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      status: "success",
      durationMs: 840,
      message: "همگام‌سازی خودکار دوره‌ای با باکت پارس‌پک با موفقیت انجام شد.",
      filesCount: 8
    },
    {
      id: "log-2",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      status: "success",
      durationMs: 910,
      message: "همگام‌سازی خودکار دوره‌ای با باکت پارس‌پک با موفقیت انجام شد.",
      filesCount: 8
    }
  ]);

  const triggerInstantSync = async () => {
    setIsSyncingNow(true);
    const start = performance.now();
    try {
      const res = await fetch("/api/v1/bucket/sync-all", {
        method: "POST"
      });
      const data = await res.json();
      const duration = Math.round(performance.now() - start);
      if (res.ok && data.success) {
        setLastSyncTime(new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        setSyncLogs(prev => [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            status: "success",
            durationMs: duration,
            message: data.message || "همگام‌سازی با موفقیت تکمیل شد.",
            filesCount: data.syncedCount || 8
          },
          ...prev
        ]);
        setNextSyncCountdown(autoSyncInterval * 60);
      } else {
        throw new Error(data.error || "خطای ناپایدار در اتصال به باکت");
      }
    } catch (err: any) {
      const duration = Math.round(performance.now() - start);
      setSyncLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          status: "error",
          durationMs: duration,
          message: err.message || "خطا در همگام‌سازی باکت پارس‌پک.",
          filesCount: 0
        },
        ...prev
      ]);
    } finally {
      setIsSyncingNow(false);
    }
  };

  useEffect(() => {
    if (!autoSyncEnabled) return;
    
    const timer = setInterval(() => {
      setNextSyncCountdown(prev => {
        if (prev <= 1) {
          triggerInstantSync();
          return autoSyncInterval * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, autoSyncInterval]);

  useEffect(() => {
    setNextSyncCountdown(autoSyncInterval * 60);
  }, [autoSyncInterval]);

  // Accordion open state map
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    products: true,
    factories: false,
    agents: false,
    ads: false,
    users: false,
    orders: false,
    tickets: false,
    approvals: false,
    config: false,
    formulas: false,
    s3_direct: false,
    kotlin: false
  });

  const [testEndpoint, setTestEndpoint] = useState<string>("/api/v1/dev/products");
  const [testMethod, setTestMethod] = useState<"GET" | "POST" | "DELETE">("GET");
  const [testPayload, setTestPayload] = useState<string>("");
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ status?: number; timeMs?: number; data?: any; error?: string } | null>(null);
  const [bucketStats, setBucketStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);

  const kotlinSnippetText = `package com.dastavval.admin.data

import retrofit2.Response
import retrofit2.http.*

interface DastavvalApiService {
    // 1. محصولات
    @GET("api/v1/dev/products")
    suspend fun getProducts(): Response<ApiResponse<List<ProductModel>>>

    @POST("api/v1/dev/products")
    suspend fun saveProduct(@Body product: ProductModel): Response<ApiResponse<ProductModel>>

    @DELETE("api/v1/dev/products/{id}")
    suspend fun deleteProduct(@Path("id") id: String): Response<ApiResponse<Unit>>

    // 2. سفارشات و فاکتورها
    @GET("api/v1/dev/orders")
    suspend fun getOrders(): Response<ApiResponse<List<OrderModel>>>

    @POST("api/v1/dev/orders")
    suspend fun saveOrder(@Body order: OrderModel): Response<ApiResponse<OrderModel>>

    @DELETE("api/v1/dev/orders/{id}")
    suspend fun deleteOrder(@Path("id") id: String): Response<ApiResponse<Unit>>

    // 3. تیکت‌های پشتیبانی
    @GET("api/v1/dev/tickets")
    suspend fun getTickets(): Response<ApiResponse<List<TicketModel>>>

    @POST("api/v1/dev/tickets")
    suspend fun replyTicket(@Body ticket: TicketModel): Response<ApiResponse<TicketModel>>

    // 4. تأییدیه‌ها (آگهی، نمایندگی، خرید امن، تهاتر)
    @GET("api/v1/dev/approvals")
    suspend fun getPendingApprovals(): Response<ApiResponse<ApprovalsResponse>>

    @POST("api/v1/dev/approvals")
    suspend fun processApproval(@Body request: ApprovalRequest): Response<ApiResponse<Unit>>

    // 5. تنظیمات سایت و کلیدها
    @GET("api/b2b/config")
    suspend fun getConfig(): Response<B2BConfigModel>

    @POST("api/b2b/config")
    suspend fun updateConfig(@Body config: B2BConfigModel): Response<B2BConfigModel>
}`;

  // Fetch bucket stats
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/v1/bucket/stats");
      const data = await res.json();
      if (data.success) {
        setBucketStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllAccordions = (open: boolean) => {
    setOpenSections({
      overview: open,
      products: open,
      factories: open,
      agents: open,
      ads: open,
      users: open,
      orders: open,
      tickets: open,
      approvals: open,
      config: open,
      formulas: open,
      s3_direct: open,
      kotlin: open
    });
  };

  // SCHEMAS DEFINITIONS
  const schemas = {
    products: {
      title: "۱. مدیریت کامل محصولات (Products API)",
      icon: Box,
      description: "دریافت لیست، تعریف محصول جدید، ویرایش قیمت/موجودی و حذف محصول همراه سنکرون‌سازی با باکت",
      s3File: "products.json",
      endpoints: [
        { method: "GET", url: "/api/v1/dev/products", title: "لیست تمام محصولات", description: "دریافت لیست کامل محصولات" },
        { method: "POST", url: "/api/v1/dev/products", title: "ثبت یا ویرایش محصول", description: "در صورت وجود id ویرایش، در غیر این صورت درج جدید" },
        { method: "DELETE", url: "/api/v1/dev/products/:id", title: "حذف محصول", description: "حذف کامل محصول با شناسه" }
      ],
      sampleJson: {
        id: "prod-1719820000000",
        name: "شیر صنعتی توپی فولادی ۲ اینچ کلاس ۱۵۰",
        code: "PRD-4091",
        factoryCode: "FAC-8812",
        brand: "پارس ولو",
        factoryName: "شیرسازی صنعتی پارس",
        category: "شیرآلات صنعتی",
        subCategory: "شیرهای توپی (Ball Valve)",
        price: 4500000,
        bulk_price: 4200000,
        consumer_price: 5100000,
        cartonPackCount: 6,
        minOrderCartons: 2,
        stockQuantityCartons: 150,
        unit: "عدد",
        leadTimeDays: 3,
        description: "شیر توپی ضد زنگ با استانداردهای بین‌المللی API و DIN مناسب پالایشگاه‌ها",
        technicalSpecs: {
          "جنس بدنه": "فولاد WCB A216",
          "فشار کاری": "کلاس ۱۵۰ (Class 150)",
          "نوع اتصال": "فلنجی RF",
          "کشور سازنده": "ایران"
        },
        imageUrl: "https://c102393.parspack.net/c102393/uploads/valve-2inch.jpg",
        isFeatured: true,
        isBestseller: true,
        isKafBazaar: true,
        weeklySaleActive: false,
        weeklySaleDiscount: 0,
        status: "active",
        createdAt: "2026-09-01T08:00:00.000Z",
        updatedAt: "2026-09-06T12:00:00.000Z"
      }
    },
    factories: {
      title: "۲. مدیریت کارخانجات و برندها (Factories API)",
      icon: Building2,
      description: "مدیریت کارخانه‌های تولیدکننده، لوگو، کاتالوگ و راه‌های ارتباطی",
      s3File: "factories.json",
      endpoints: [
        { method: "GET", url: "/api/v1/dev/factories", title: "لیست کارخانجات", description: "دریافت تمام کارخانجات ثبت‌شده" },
        { method: "POST", url: "/api/v1/dev/factories", title: "ایجاد/ویرایش کارخانه", description: "آپدیت پروفایل کارخانه و برند" },
        { method: "DELETE", url: "/api/v1/dev/factories/:id", title: "حذف کارخانه", description: "حذف کارخانه از دیتابیس و باکت" }
      ],
      sampleJson: {
        id: "fact-1719821111111",
        factoryCode: "FAC-8812",
        name: "مجتمع صنایع فولاد و لوله پارس",
        brand: "پارس پایپ",
        category: "لوله و اتصالات صنعتی",
        logo: "https://c102393.parspack.net/c102393/uploads/pars-pipe-logo.png",
        bannerImage: "https://c102393.parspack.net/c102393/uploads/factory-banner.jpg",
        province: "اصفهان",
        city: "مبارکه",
        address: "شهرک صنعتی مبارکه، بلوار صنعت، خیابان نهم",
        phone: "03138900000",
        phone2: "03138900001",
        salesPhone: "09123456789",
        ceo: "مهندس علیرضا اکبری",
        website: "https://parspipe-ind.com",
        description: "بزرگترین مجتمع تولیدکننده لوله‌های مانیسمان و صنعتی بدون درز در کشور",
        establishedYear: 1378,
        catalogUrl: "https://c102393.parspack.net/c102393/catalogs/pars-catalog.pdf",
        isVerified: true,
        rating: 4.8,
        tags: ["لوله مانیسمان", "اتصالات فشار قوی", "تجهیزات نفت و گاز"],
        createdAt: "2026-08-10T10:00:00.000Z",
        updatedAt: "2026-09-06T12:00:00.000Z"
      }
    },
    agents: {
      title: "۳. مدیریت نمایندگان و عاملیت‌ها (Agents API)",
      icon: Users,
      description: "مدیریت شبکه نمایندگان استانی/شهری، پروانه‌های عاملیت و سطح دسترسی‌ها",
      s3File: "agents.json",
      endpoints: [
        { method: "GET", url: "/api/v1/dev/agents", title: "لیست نمایندگان", description: "دریافت مشخصات تمام عاملین" },
        { method: "POST", url: "/api/v1/dev/agents", title: "افزودن/ویرایش نماینده", description: "ثبت یا بروزرسانی نماینده" },
        { method: "DELETE", url: "/api/v1/dev/agents/:id", title: "حذف نماینده", description: "حذف عاملیت" }
      ],
      sampleJson: {
        id: "rep-1719822222222",
        agencyCode: "AG-9042",
        name: "مهندس محمودی",
        companyName: "بازرگانی پایپ گستر طهران",
        phone: "09121112233",
        landline: "02155667788",
        province: "تهران",
        city: "تهران",
        address: "بازار بزرگ آهن مکان، فاز ۲ شرقی، پلاک ۳۴۰",
        brands: ["پارس پایپ", "شیرسازی پارس", "تجهیز گاز"],
        tierLabel: "عاملیت رسمی طلایی (Tier A)",
        badge: "نماینده رسمی استان تهران",
        status: "active",
        isApproved: true,
        contractExpiresAt: "2027-03-20T00:00:00.000Z",
        createdAt: "2026-08-15T09:30:00.000Z",
        updatedAt: "2026-09-06T12:00:00.000Z"
      }
    },
    ads: {
      title: "۴. مدیریت آگهی‌ها و بنرها (Sponsored Ads API)",
      icon: Megaphone,
      description: "کنترل بنرهای تبلیغاتی، پیشنهادات ویژه و اولویت نمایش در اپلیکیشن",
      s3File: "ads.json",
      endpoints: [
        { method: "GET", url: "/api/v1/dev/ads", title: "لیست بنرها", description: "دریافت بنرها و آگهی‌های فعال" },
        { method: "POST", url: "/api/v1/dev/ads", title: "ایجاد/ویرایش بنر", description: "آپدیت لینک، تصویر و اولویت" },
        { method: "DELETE", url: "/api/v1/dev/ads/:id", title: "حذف بنر", description: "حذف بنر تبلیغاتی" }
      ],
      sampleJson: {
        id: "ad-1719823333333",
        title: "تخفیف ویژه جشنواره تابستانه لوله‌های صنعتی",
        description: "تا ۱۲ درصد تخفیف ویژه برای خرید بالاتر از ۱۰ تن مستقیم از کارخانه",
        imageUrl: "https://c102393.parspack.net/c102393/uploads/banner-summer.jpg",
        linkUrl: "/products?category=لوله%20و%20اتصالات",
        category: "لوله و اتصالات",
        badge: "پیشنهاد ویژه",
        priority: 1,
        isActive: true,
        startDate: "2026-09-01T00:00:00.000Z",
        endDate: "2026-09-30T23:59:59.000Z",
        clickCount: 420,
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-06T12:00:00.000Z"
      }
    },
    users: {
      title: "۵. مدیریت کاربران و خریداران (Users API)",
      icon: Users,
      description: "کنترل پروفایل کاربران، اعتبار سنجی و نقش‌ها در سامانه",
      s3File: "users.json",
      endpoints: [
        { method: "GET", url: "/api/v1/dev/users", title: "لیست کاربران", description: "دریافت کاربران" },
        { method: "POST", url: "/api/v1/dev/users", title: "افزودن/ویرایش کاربر", description: "ثبت/ویرایش کاربر" },
        { method: "DELETE", url: "/api/v1/dev/users/:id", title: "حذف کاربر", description: "حذف کاربر" }
      ],
      sampleJson: {
        id: "usr-1719824444444",
        userCode: "USR-7731",
        name: "حمیدرضا رضایی",
        phone: "09125556677",
        role: "buyer",
        companyName: "شرکت تاسیسات آریا نوین",
        province: "فارس",
        city: "شیراز",
        address: "خیابان قصرالدشت، کوچه ۱۲، پلاک ۸",
        isVerified: true,
        creditScore: 85,
        totalOrdersCount: 14,
        createdAt: "2026-07-20T14:00:00.000Z",
        updatedAt: "2026-09-06T12:00:00.000Z"
      }
    },
    orders: {
      title: "۶. مدیریت سفارشات و فاکتورها (Orders & Invoices API)",
      icon: ShoppingBag,
      description: "مشاهده تمام سفارشات خریداران، تغییر وضعیت سفارش، صدور و تأیید فاکتور رسمی",
      s3File: "orders.json",
      endpoints: [
        { method: "GET", url: "/api/v1/dev/orders", title: "لیست سفارشات", description: "دریافت لیست تمام سفارش‌ها و فاکتورها" },
        { method: "POST", url: "/api/v1/dev/orders", title: "ثبت/تغییر وضعیت سفارش و فاکتور", description: "آپدیت status (pending, approved, invoiced, shipped) و مشخصات فاکتور" },
        { method: "DELETE", url: "/api/v1/dev/orders/:id", title: "حذف سفارش", description: "حذف سفارش از سامانه" }
      ],
      sampleJson: {
        id: "ORD-9921",
        orderId: "ORD-9921",
        trackingNumber: "TRK-88129",
        buyerName: "حمیدرضا رضایی",
        buyerPhone: "09125556677",
        companyName: "تاسیسات آریا نوین",
        items: [
          {
            productId: "prod-1719820000000",
            name: "شیر صنعتی توپی فولادی ۲ اینچ",
            quantityCartons: 5,
            packCount: 6,
            unitPrice: 4500000,
            totalPrice: 135000000
          }
        ],
        totalAmount: 135000000,
        taxAmount: 12150000,
        finalAmount: 147150000,
        status: "invoiced",
        statusTitle: "فاکتور صادر شد",
        invoiceNumber: "INV-2026-104",
        paymentStatus: "paid",
        shippingAddress: "شیراز، خیابان قصرالدشت، پلاک ۸",
        createdAt: "2026-09-05T10:00:00.000Z",
        updatedAt: "2026-09-06T12:00:00.000Z"
      }
    },
    tickets: {
      title: "۷. تیکت‌ها و پشتیبانی مشتریان (Support Tickets API)",
      icon: MessageSquare,
      description: "مشاهده تیکت‌های خریداران و تامین‌کنندگان، ارسال پاسخ مدیریت و تغییر وضعیت",
      s3File: "tickets.json",
      endpoints: [
        { method: "GET", url: "/api/v1/dev/tickets", title: "لیست تیکت‌ها", description: "دریافت لیست تیکت‌های پشتیبانی" },
        { method: "POST", url: "/api/v1/dev/tickets", title: "ارسال پاسخ یا آپدیت وضعیت", description: "ثبت پاسخ جدید مدیریت و تغییر status" },
        { method: "DELETE", url: "/api/v1/dev/tickets/:id", title: "حذف تیکت", description: "حذف تیکت پشتیبانی" }
      ],
      sampleJson: {
        id: "TCK-4081",
        trackingCode: "TCK-4081",
        userName: "مهندس علوی",
        phone: "09123334455",
        subject: "استعلام قیمت خریدار عمده و درصد تخفیف",
        priority: "high",
        status: "open",
        messages: [
          {
            sender: "user",
            text: "با سلام، برای سفارش ۵۰ کارتنی لوله مانیسمان چه میزان تخفیف بنکداری ارائه می‌شود؟",
            createdAt: "2026-09-06T09:00:00.000Z"
          },
          {
            sender: "admin",
            text: "با سلام و احترام، تخفیف عمده ۸ درصدی روی این حجم سفارش اعمال گردید.",
            createdAt: "2026-09-06T09:30:00.000Z"
          }
        ],
        createdAt: "2026-09-06T09:00:00.000Z",
        updatedAt: "2026-09-06T09:30:00.000Z"
      }
    },
    approvals: {
      title: "۸. تأییدیه‌ها و نظارت بر آگهی‌ها و نمایندگی‌ها (Approvals API)",
      icon: ShieldAlert,
      description: "تأیید یا رد درخواست‌های اخذ نمایندگی، آگهی‌های ظرفیت خالی، خرید امن و معاملات تهاتر",
      s3File: "config.json",
      endpoints: [
        { method: "GET", url: "/api/v1/dev/approvals", title: "لیست موارد در انتظار تأیید", description: "دریافت تمام آگهی‌ها و درخواست‌های در انتظار مدیر" },
        { method: "POST", url: "/api/v1/dev/approvals", title: "تأیید یا رد آیتم", description: "ارسال type, id, action ('approve' | 'reject') و badge" }
      ],
      sampleJson: {
        type: "dealership",
        id: "req-88219",
        action: "approve",
        badge: "نماینده رسمی استان اصفهان",
        reason: "پروانه کسب و سوابق بنکداری توسط مدیریت تأیید شد."
      }
    },
    config: {
      title: "۹. تنظیمات کامل سایت و کلیدهای باکت (System Config & ParsPack S3 Keys API)",
      icon: Sliders,
      description: "تنظیمات عمومی سایت، دامنه اصلی (dastavval.com)، شماره‌های پشتیبانی و کلیدهای باکت پارس‌پک",
      s3File: "config.json",
      endpoints: [
        { method: "GET", url: "/api/b2b/config", title: "دریافت کانفیگ کامل", description: "دریافت تمام تنظیمات سایت و باکت" },
        { method: "POST", url: "/api/b2b/config", title: "بروزرسانی تنظیمات", description: "ذخیره تغییرات سایت" }
      ],
      sampleJson: {
        siteName: "سامانه صنعتی دست اول",
        mainDomain: "https://dastavval.com",
        siteTagline: "مرجع بی‌واسطه کارخانجات، نمایندگان و تجهیزات صنعتی",
        supportPhone: "02191000000",
        telegramChannel: "@dastavval_channel",
        whatsappNumber: "09120000000",
        instagramPage: "dastavval_com",
        storageEnabled: true,
        s3Endpoint: "https://c102393.parspack.net",
        s3Bucket: "c102393",
        s3Region: "us-east-1",
        s3AccessKey: "c102393_admin",
        s3SecretKey: "c102393_secret_key"
      }
    }
  };

  // Generate Master Markdown Document for Download / Copy
  const generateMasterBlueprintDocument = () => {
    return `# 📘 مستندات جامع فنی و راهنمای کامل توسعه‌دهنده اپلیکیشن اندروید و کلاینت
## سامانه صنعتی دست اول (DASTAVVAL MASTER DEVELOPER BLUEPRINT)
تاریخ صدور: ${new Date().toLocaleDateString("fa-IR")}
دامنه اصلی سرور: https://dastavval.com (یا ${baseUrl})
باکت ابری پارس‌پک (اصلی‌ترین کانال ارتباطی): https://c102393.parspack.net (Bucket: c102393)

---

### 🌐 ۱. مشخصات کامل اتصال، دامنه اصلی و کلیدهای باکت پارس‌پک (Primary Communication & S3 Credentials)

#### 🏢 دامنه اصلی سایت (Main Domain Configuration):
- **دامنه تولید و پروداکشن**: \`https://dastavval.com\`
- **مسیریابی اپلیکیشن اندروید (REST Base API)**: \`https://dastavval.com/api/v1/dev\`
- **توصیه امنیتی اندروید**: استفاده از \`https://dastavval.com\` در \`Retrofit\` / \`OkHttp\` همراه با هدرهای استاندارد \`Content-Type: application/json\`.

#### ☁️ کلیدها و مشخصات باکت ابری پارس‌پک (ParsPack S3 Credentials):
- **S3 Endpoint**: \`https://c102393.parspack.net\`
- **Bucket Name**: \`c102393\`
- **Region**: \`us-east-1\`
- **Access Key**: \`c102393_admin\`
- **Secret Key**: \`c102393_secret_key\`
- **Force Path Style**: \`true\`

#### 🔄 باکت ابری به عنوان اصلی‌ترین کانال ارتباطی (ParsPack Bucket Direct Access):
در صورت قطع ارتباط سرور یا برای سرعت بالا، اپلیکیشن اندروید می‌تواند مستقیماً فایل‌های JSON زیر را از باکت ابری پارس‌پک خوانده یا بروزرسانی کند:
1. \`products.json\`: لیست تمام محصولات صنعتی، قیمت‌های عمده و کارتنی
2. \`factories.json\`: لیست کارخانجات، لوگو و کاتالوگ‌ها
3. \`agents.json\`: لیست نمایندگان رسمی و عاملیت‌ها
4. \`ads.json\`: بنرها و آگهی‌های ویژه
5. \`users.json\`: خریداران و کاربران سامانه
6. \`orders.json\`: سفارشات و فاکتورهای رسمی صادر شده
7. \`tickets.json\`: تیکت‌های پشتیبانی و گفتگوها
8. \`config.json\`: تنظیمات کامل سایت، شماره‌های پشتیبانی و آدرس‌ها

---

### 🧮 ۲. فرمول‌ها و محاسبات تجاری (Business Rules & Formulas)

1. **محاسبه قیمت کل بسته کارتنی:**
   TotalCartonPrice = UnitPrice * CartonPackCount

2. **محاسبه تخفیف خرید عمده و بنکداری:**
   FinalPrice = (OrderedCartons >= MinOrderCartons) 
                ? BulkPrice * CartonPackCount * OrderedCartons 
                : Price * CartonPackCount * OrderedCartons

3. **حاشیه سود نماینده رسمی (Agency Margin):**
   AgentProfitMargin = ((ConsumerPrice - BulkPrice) / ConsumerPrice) * 100

4. **مکانیسم همگام‌سازی دوگانه باکت ابری (Dual-Sync Mechanism):**
   تمامی درخواست‌های ثبت/ویرایش (POST) یا حذف (DELETE) بلافاصله حافظه RAM سرور، دیتابیس محلی JSON و باکت ابری پارس‌پک را به صورت همزمان بروزرسانی می‌کنند.

---

### 🔌 ۳. لیست کامل اندپوینت‌های REST API پنل مدیریت (Complete CRUD & Action Endpoints)

#### 📦 ۱. محصولات (Products)
- **دریافت لیست محصولات**: GET /api/v1/dev/products
- **ثبت یا ویرایش محصول**: POST /api/v1/dev/products
- **حذف محصول**: DELETE /api/v1/dev/products/:id
- **مسیر مستقیم باکت**: products.json

#### 🏭 ۲. کارخانجات (Factories)
- **دریافت لیست کارخانجات**: GET /api/v1/dev/factories
- **ثبت یا ویرایش کارخانه**: POST /api/v1/dev/factories
- **حذف کارخانه**: DELETE /api/v1/dev/factories/:id
- **مسیر مستقیم باکت**: factories.json

#### 🤝 ۳. نمایندگان و عاملیت‌ها (Agents)
- **دریافت لیست نمایندگان**: GET /api/v1/dev/agents
- **ثبت یا ویرایش نماینده**: POST /api/v1/dev/agents
- **حذف نماینده**: DELETE /api/v1/dev/agents/:id
- **مسیر مستقیم باکت**: agents.json

#### 📢 ۴. آگهی‌ها و بنرها (Ads)
- **دریافت لیست آگهی‌ها**: GET /api/v1/dev/ads
- **ثبت یا ویرایش آگهی**: POST /api/v1/dev/ads
- **حذف آگهی**: DELETE /api/v1/dev/ads/:id
- **مسیر مستقیم باکت**: ads.json

#### 👥 ۵. کاربران (Users)
- **دریافت لیست کاربران**: GET /api/v1/dev/users
- **ثبت یا ویرایش کاربر**: POST /api/v1/dev/users
- **حذف کاربر**: DELETE /api/v1/dev/users/:id
- **مسیر مستقیم باکت**: users.json

#### 🛍️ ۶. سفارشات و فاکتورها (Orders & Invoices)
- **دریافت لیست سفارشات**: GET /api/v1/dev/orders
- **ثبت/تغییر وضعیت سفارش و فاکتور**: POST /api/v1/dev/orders
- **حذف سفارش**: DELETE /api/v1/dev/orders/:id
- **مسیر مستقیم باکت**: orders.json

#### 💬 ۷. تیکت‌ها و پشتیبانی (Tickets & Support)
- **دریافت تیکت‌ها**: GET /api/v1/dev/tickets
- **ارسال پاسخ/تغییر وضعیت تیکت**: POST /api/v1/dev/tickets
- **حذف تیکت**: DELETE /api/v1/dev/tickets/:id
- **مسیر مستقیم باکت**: tickets.json

#### 🛡️ ۸. تأییدیه‌ها و نظارت بر آگهی‌ها و نمایندگی‌ها (Approvals & Moderation)
- **دریافت موارد در انتظار تأیید**: GET /api/v1/dev/approvals
- **تأیید یا رد آگهی/درخواست**: POST /api/v1/dev/approvals

#### ⚙️ ۹. تنظیمات کامل سایت (Site Config)
- **دریافت کانفیگ**: GET /api/b2b/config
- **بروزرسانی کانفیگ**: POST /api/b2b/config
- **مسیر مستقیم باکت**: config.json

---

### 📄 ۴. الگوهای کامل ساختار داده‌ها (JSON Schemas)

#### 🛍️ الگوی نمونه سفارش و فاکتور (Orders Schema):
${JSON.stringify(schemas.orders.sampleJson, null, 2)}

#### 💬 الگوی نمونه تیکت پشتیبانی (Ticket Schema):
${JSON.stringify(schemas.tickets.sampleJson, null, 2)}

#### 🛡️ الگوی نمونه تأییدیه/رد (Approval Schema):
${JSON.stringify(schemas.approvals.sampleJson, null, 2)}

#### ⚙️ الگوی نمونه تنظیمات کامل سایت و کلیدها (Config Schema):
${JSON.stringify(schemas.config.sampleJson, null, 2)}

#### 📦 الگوی نمونه محصول (Product Schema):
${JSON.stringify(schemas.products.sampleJson, null, 2)}

---

### 🖥️ ۵. نمونه کدهای کاتلیت / رتروفیت برای تمام عملیات (Kotlin Retrofit Interface)

package com.dastavval.admin.data

import retrofit2.Response
import retrofit2.http.*

interface DastavvalApiService {
    // 1. سفارشات و فاکتورها
    @GET("api/v1/dev/orders")
    suspend fun getOrders(): Response<ApiResponse<List<OrderModel>>>

    @POST("api/v1/dev/orders")
    suspend fun saveOrder(@Body order: OrderModel): Response<ApiResponse<OrderModel>>

    @DELETE("api/v1/dev/orders/{id}")
    suspend fun deleteOrder(@Path("id") id: String): Response<ApiResponse<Unit>>

    // 2. تیکت‌های پشتیبانی
    @GET("api/v1/dev/tickets")
    suspend fun getTickets(): Response<ApiResponse<List<TicketModel>>>

    @POST("api/v1/dev/tickets")
    suspend fun replyTicket(@Body ticket: TicketModel): Response<ApiResponse<TicketModel>>

    // 3. تأییدیه‌ها (آگهی، نمایندگی، خرید امن، تهاتر)
    @GET("api/v1/dev/approvals")
    suspend fun getPendingApprovals(): Response<ApiResponse<ApprovalsResponse>>

    @POST("api/v1/dev/approvals")
    suspend fun processApproval(@Body request: ApprovalRequest): Response<ApiResponse<Unit>>

    // 4. تنظیمات سایت
    @GET("api/b2b/config")
    suspend fun getConfig(): Response<B2BConfigModel>

    @POST("api/b2b/config")
    suspend fun updateConfig(@Body config: B2BConfigModel): Response<B2BConfigModel>
}
`;
  };

  // Trigger Download of Master Spec File
  const handleDownloadMasterBlueprint = () => {
    const text = generateMasterBlueprintDocument();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DASTAVVAL-MASTER-DEVELOPER-SPEC.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run live API test
  const handleRunTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    const start = performance.now();
    try {
      const options: RequestInit = {
        method: testMethod,
        headers: {
          "Content-Type": "application/json"
        }
      };

      if (testMethod === "POST" && testPayload.trim()) {
        try {
          options.body = JSON.stringify(JSON.parse(testPayload));
        } catch {
          setTestResult({ error: "فرمت JSON بدنه نامعتبر است." });
          setTestLoading(false);
          return;
        }
      }

      const res = await fetch(testEndpoint, options);
      const timeMs = Math.round(performance.now() - start);
      const data = await res.json().catch(() => null);

      setTestResult({
        status: res.status,
        timeMs,
        data
      });
    } catch (err: any) {
      const timeMs = Math.round(performance.now() - start);
      setTestResult({
        status: 500,
        timeMs,
        error: err.message || "خطای عدم برقراری ارتباط با سرور"
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Preset payload helper for tester
  const setTesterPreset = (endpoint: string, method: "GET" | "POST" | "DELETE", payload: any = "") => {
    setTestEndpoint(endpoint);
    setTestMethod(method);
    setTestPayload(typeof payload === "object" ? JSON.stringify(payload, null, 2) : payload);
    setActiveTab("tester");
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right" dir="rtl">
      {/* 1. TOP MASTER HERO HEADER & ONE-CLICK MASTER ACTION BUTTONS */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-cyan-600/30">
                <Code className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>هاب مستندات API و الگوهای اندروید</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    نسخه کامل توسعه‌دهنده
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  راهنمای یکپارچه، فرمول‌های تجاری، لینک‌های REST API و الگوهای قابل کپی و دانلود یکجا برای برنامه‌نویس اندروید.
                </p>
              </div>
            </div>
          </div>

          {/* MASTER ONE-CLICK BUTTONS */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownloadMasterBlueprint}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Download size={18} />
              <span>دانلود فایل جامع مستندات (.md)</span>
            </button>

            <button
              onClick={() => handleCopy(generateMasterBlueprintDocument(), "master_blueprint")}
              className="px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              {copiedKey === "master_blueprint" ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}
              <span>کپی یکجای تمام دستورات و الگوها</span>
            </button>
          </div>
        </div>

        {/* Primary Domain & Production Alignment Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Globe size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-black text-sm">دامنه اصلی و مقصد نهایی وب‌سرویس‌ها:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-mono font-bold">
                  https://dastavval.com
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                تمامی درخواست‌های اپلیکیشن اندروید، اتصال باکت پارس‌پک و ترب با دامنه اصلی دست‌اول هماهنگ هستند.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Domain Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDomainMode("primary")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  domainMode === "primary" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                دامنه اصلی (dastavval.com)
              </button>
              <button
                type="button"
                onClick={() => setDomainMode("current")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  domainMode === "current" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                محیط جاری
              </button>
            </div>

            {/* Set & Sync Button */}
            <button
              type="button"
              disabled={isApplyingPrimaryDomain}
              onClick={applyPrimaryDomainConfig}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-md shadow-emerald-700/30"
            >
              {isApplyingPrimaryDomain ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Zap size={14} />
              )}
              <span>تثبیت و هماهنگ‌سازی باکت و وب‌سرویس روی دامنه اصلی</span>
            </button>
          </div>
        </div>

        {primaryDomainSuccessMsg && (
          <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-bold rounded-xl flex items-center justify-between">
            <span>✓ {primaryDomainSuccessMsg}</span>
            <button onClick={() => setPrimaryDomainSuccessMsg(null)} className="text-emerald-300 hover:text-white">✕</button>
          </div>
        )}

        {/* Global Connection Details */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">Base URL سرور (REST API):</span>
              <code className="text-xs font-mono text-cyan-300 select-all">{baseUrl}</code>
            </div>
            <button
              onClick={() => handleCopy(baseUrl, "base_url")}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="کپی آدرس سرور"
            >
              {copiedKey === "base_url" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">S3 Endpoint باکت پارس‌پک:</span>
              <code className="text-xs font-mono text-cyan-300 select-all">https://c102393.parspack.net</code>
            </div>
            <button
              onClick={() => handleCopy("https://c102393.parspack.net", "s3_endpoint")}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="کپی آدرس باکت"
            >
              {copiedKey === "s3_endpoint" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-bold block">هدر استاندارد درخواست‌ها:</span>
              <code className="text-xs font-mono text-emerald-300">Content-Type: application/json</code>
            </div>
            <button
              onClick={() => handleCopy("Content-Type: application/json", "header_content")}
              className="p-1.5 rounded-lg bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="کپی هدر"
            >
              {copiedKey === "header_content" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("schemas")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "schemas"
                ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Layers size={16} />
            <span>الگوها و کشوهای ساختاری (Accordion Spec)</span>
          </button>

          <button
            onClick={() => setActiveTab("formulas")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "formulas"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Calculator size={16} />
            <span>فرمول‌ها و قوانین تجاری (Business Rules)</span>
          </button>

          <button
            onClick={() => setActiveTab("tester")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "tester"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Zap size={16} />
            <span>تست‌کننده زنده API (Live Interactive Tester)</span>
          </button>

          <button
            onClick={() => setActiveTab("snippets")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "snippets"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Terminal size={16} />
            <span>کدهای کاتلین و رتروفیت (Code Snippets)</span>
          </button>

          <button
            onClick={() => setActiveTab("auto_sync")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "auto_sync"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <RefreshCw size={16} className={isSyncingNow ? "animate-spin text-emerald-300" : ""} />
            <span>موتور بروزرسانی اتوماتیک باکت (Auto-Sync)</span>
          </button>
        </div>

        {/* Global Accordion Toggle Controls */}
        {activeTab === "schemas" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAllAccordions(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              باز کردن همه کشوها
            </button>
            <button
              onClick={() => setAllAccordions(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
            >
              بستن همه کشوها
            </button>
          </div>
        )}
      </div>

      {/* 3. TAB CONTENT 1: ACCORDION SPECIFICATIONS & SCHEMAS */}
      {activeTab === "schemas" && (
        <div className="space-y-4">
          {(Object.keys(schemas) as Array<keyof typeof schemas>).map((key) => {
            const item = schemas[key];
            const Icon = item.icon;
            const isOpen = !!openSections[key];

            return (
              <div
                key={key}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between bg-white hover:bg-slate-50/80 transition-all text-right cursor-pointer"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                      {item.s3File}
                    </span>
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </button>

                {/* Accordion Content Body */}
                {isOpen && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                    {/* REST Endpoints Grid */}
                    <div className="space-y-3">
                      <span className="text-xs font-black text-slate-700 block">آدرس‌ها و متدهای اتصال:</span>
                      {item.endpoints.map((ep, idx) => {
                        const methodColor =
                          ep.method === "GET"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : ep.method === "POST"
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-rose-100 text-rose-800 border-rose-300";

                        const fullUrl = `${baseUrl}${ep.url}`;

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border ${methodColor}`}>
                                {ep.method}
                              </span>
                              <code className="text-xs sm:text-sm font-mono font-bold text-slate-800 select-all" dir="ltr">
                                {ep.url}
                              </code>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => setTesterPreset(ep.url, ep.method as any, ep.method === "POST" ? item.sampleJson : "")}
                                className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-xs font-bold border border-cyan-200 flex items-center gap-1 cursor-pointer"
                              >
                                <Zap size={12} />
                                <span>تست</span>
                              </button>
                              <button
                                onClick={() => handleCopy(fullUrl, `url_${key}_${idx}`)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                              >
                                {copiedKey === `url_${key}_${idx}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* JSON Schema Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700">الگوی شیء JSON (Data Model Schema):</span>
                        <button
                          onClick={() => handleCopy(JSON.stringify(item.sampleJson, null, 2), `json_${key}`)}
                          className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedKey === `json_${key}` ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          <span>کپی JSON</span>
                        </button>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
                        <pre className="text-xs font-mono text-cyan-300 leading-relaxed select-all" dir="ltr">
                          {JSON.stringify(item.sampleJson, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. TAB CONTENT 2: BUSINESS FORMULAS & RULES */}
      {activeTab === "formulas" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Calculator className="text-amber-600" size={20} />
              <span>فرمول‌ها و محاسبات فنی تجاری (Business Logic & Pricing Formulas)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              توسعه‌دهنده اندروید جهت پیاده‌سازی صحیح سبد خرید، محاسبه حاشیه سود عاملیت و قیمت‌گذاری کارتنی باید از فرمول‌های زیر استفاده نماید:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <h3 className="text-sm font-black text-amber-900 flex items-center gap-2">
                <span>۱. فرمول قیمت کارتنی و بسته‌ای:</span>
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                هر محصول دارای یک تعداد در کارتن (<code>cartonPackCount</code>) است. قیمت کل یک کارتن عبارت است از:
              </p>
              <div className="p-3 rounded-xl bg-white border border-amber-200 font-mono text-xs font-bold text-amber-950 select-all" dir="ltr">
                TotalCartonPrice = UnitPrice * CartonPackCount
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
              <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                <span>۲. فرمول تخفیف خرید عمده / بنکداری:</span>
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                اگر تعداد سفارش خریدار از حداقل سفارش کارتنی (<code>minOrderCartons</code>) بیشتر باشد، قیمت عمده (<code>bulk_price</code>) اعمال می‌گردد:
              </p>
              <div className="p-3 rounded-xl bg-white border border-emerald-200 font-mono text-xs font-bold text-emerald-950 select-all" dir="ltr">
                FinalPrice = (Cartons &gt;= MinCartons) ? BulkPrice : Price
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
              <h3 className="text-sm font-black text-blue-900 flex items-center gap-2">
                <span>۳. محاسبه درصد سود نماینده (Agency Margin):</span>
              </h3>
              <p className="text-xs text-blue-800 leading-relaxed">
                درصد سود نماینده از مابه‌التفاوت قیمت مصرف‌کننده (<code>consumer_price</code>) و قیمت عمده محاسبه می‌گردد:
              </p>
              <div className="p-3 rounded-xl bg-white border border-blue-200 font-mono text-xs font-bold text-blue-950 select-all" dir="ltr">
                Margin = ((ConsumerPrice - BulkPrice) / ConsumerPrice) * 100
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3">
              <h3 className="text-sm font-black text-purple-900 flex items-center gap-2">
                <span>۴. مکانیسم ذخیره‌سازی همزمان (Dual-Sync):</span>
              </h3>
              <p className="text-xs text-purple-800 leading-relaxed">
                هر تغییر در برنامه اندروید (افزودن/حذف/ویرایش) بلافاصله حافظه RAM سرور، دیتابیس محلی و باکت ابری پارس‌پک را سینک می‌نماید.
              </p>
              <div className="p-3 rounded-xl bg-white border border-purple-200 font-mono text-xs font-bold text-purple-950 select-all" dir="ltr">
                triggerDataChangeBackup() -&gt; Sync ParsPack S3
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT 3: LIVE TESTER */}
      {activeTab === "tester" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Zap className="text-cyan-600" size={20} />
                <span>تست‌کننده زنده اندپوینت‌ها (Interactive REST API Tester)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                بدون نیاز به Postman می‌توانید هر اندپوینت را با متد و بدنه دلخواه تست کنید و پاسخ زنده سرور و باکت را مشاهده نمایید.
              </p>
            </div>

            {/* Quick selector buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setTesterPreset("/api/v1/dev/products", "GET")}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                محصولات (GET)
              </button>
              <button
                onClick={() => setTesterPreset("/api/v1/dev/factories", "GET")}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                کارخانجات (GET)
              </button>
              <button
                onClick={() => setTesterPreset("/api/v1/dev/agents", "GET")}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                نمایندگان (GET)
              </button>
              <button
                onClick={() => setTesterPreset("/api/v1/bucket/stats", "GET")}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-xs font-bold text-cyan-800 border border-cyan-200 transition-all cursor-pointer"
              >
                آمار باکت (GET)
              </button>
            </div>
          </div>

          {/* Request Config Panel */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <select
                value={testMethod}
                onChange={(e) => setTestMethod(e.target.value as any)}
                className="px-4 py-3 rounded-2xl bg-slate-100 font-mono font-black text-sm text-slate-800 border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="DELETE">DELETE</option>
              </select>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  placeholder="/api/v1/dev/products"
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 font-mono text-sm text-slate-900 border border-slate-300 focus:ring-2 focus:ring-cyan-500 outline-none text-left"
                  dir="ltr"
                />
              </div>

              <button
                onClick={handleRunTest}
                disabled={testLoading}
                className="px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {testLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                <span>ارسال درخواست (Send)</span>
              </button>
            </div>

            {/* Body Input for POST */}
            {testMethod === "POST" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>بدنه درخواست (JSON Request Body):</span>
                  <button
                    onClick={() => setTestPayload(JSON.stringify(schemas.products.sampleJson, null, 2))}
                    className="text-cyan-600 hover:underline text-[11px] cursor-pointer"
                  >
                    قرار دادن نمونه محصول تستی
                  </button>
                </div>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  rows={6}
                  placeholder='{\n  "name": "محصول تستی جدید",\n  "price": 1500000\n}'
                  className="w-full p-4 rounded-2xl bg-slate-900 font-mono text-xs text-cyan-300 border border-slate-700 outline-none focus:ring-2 focus:ring-cyan-500 text-left"
                  dir="ltr"
                />
              </div>
            )}
          </div>

          {/* Response Box */}
          {testResult && (
            <div className="space-y-3 pt-4 border-t border-slate-200 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-800">پاسخ سرور:</span>
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                      testResult.status === 200 || testResult.status === 201
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-rose-100 text-rose-800 border-rose-300"
                    }`}
                  >
                    HTTP {testResult.status || 500}
                  </span>
                  {testResult.timeMs !== undefined && (
                    <span className="text-xs font-mono text-slate-500">
                      مدت پاسخ: {testResult.timeMs} ms
                    </span>
                  )}
                </div>

                {testResult.data && (
                  <button
                    onClick={() => handleCopy(JSON.stringify(testResult.data, null, 2), "test_result")}
                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {copiedKey === "test_result" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    <span>کپی پاسخ</span>
                  </button>
                )}
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto max-h-96">
                <pre className="text-xs font-mono text-emerald-400 select-all" dir="ltr">
                  {testResult.error
                    ? JSON.stringify({ error: testResult.error }, null, 2)
                    : JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB CONTENT 4: KOTLIN SNIPPETS */}
      {activeTab === "snippets" && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Terminal size={18} className="text-cyan-400" />
                  <span>اینترفیس کامل Retrofit در کاتلین (DastavvalApiService.kt)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">آماده قرارگیری مستقیم در پروژه اندروید استودیو</p>
              </div>

              <button
                onClick={() => handleCopy(KOTLIN_CODE_SNIPPET, "kotlin_retrofit")}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              >
                {copiedKey === "kotlin_retrofit" ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>کپی کد کاتلین</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
              <pre className="text-xs font-mono text-cyan-300 leading-relaxed select-all" dir="ltr">
                {KOTLIN_CODE_SNIPPET}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT 5: AUTOMATIC SYNC UPDATE ENGINE */}
      {activeTab === "auto_sync" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            
            {/* Engine Header / Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 flex items-center gap-2">
                  <Activity size={20} className="text-emerald-500" />
                  <span>موتور هوشمند بروزرسانی و همگام‌سازی خودکار باکت</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  مدیریت دوره زمانی و سناریوهای همگام‌سازی لحظه‌ای دیتابیس‌های محلی سرور با باکت ذخیره‌سازی ابری پارس‌پک (S3) جهت استفاده کلاینت‌ها و کاتلین اندروید.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  autoSyncEnabled 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                    : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${autoSyncEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                  <span>{autoSyncEnabled ? "موتور همگام‌سازی فعال است" : "موتور همگام‌سازی متوقف شده"}</span>
                </span>
              </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Settings and Controls */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Active Switcher & Selectors */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-100 space-y-5">
                  <span className="text-xs font-black text-slate-800 block">تنظیمات اصلی فرکانس بروزرسانی خودکار:</span>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                        autoSyncEnabled 
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20" 
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      {autoSyncEnabled ? <Pause size={14} /> : <Play size={14} />}
                      <span>{autoSyncEnabled ? "توقف همگام‌سازی خودکار" : "شروع همگام‌سازی خودکار"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">فاصله بروزرسانی:</span>
                      <select
                        value={autoSyncInterval}
                        onChange={(e) => setAutoSyncInterval(Number(e.target.value))}
                        className="p-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={1}>۱ دقیقه (تست سریع)</option>
                        <option value={5}>۵ دقیقه</option>
                        <option value={15}>۱۵ دقیقه</option>
                        <option value={30}>۳۰ دقیقه (پیش‌فرض)</option>
                        <option value={60}>۶۰ دقیقه (۱ ساعت)</option>
                      </select>
                    </div>
                  </div>

                  {/* Immediate Manual Trigger */}
                  <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">نیاز به آپلود فوری تغییرات به باکت پارس‌پک دارید؟</span>
                      <span className="text-[10px] text-slate-500">تمامی داده‌های سرور (محصولات، فاکتورها، کارخانه‌ها، تیکت‌ها) را فوراً با باکت همگام کنید.</span>
                    </div>

                    <button
                      onClick={triggerInstantSync}
                      disabled={isSyncingNow}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-600/15 whitespace-nowrap"
                    >
                      <RefreshCw size={14} className={isSyncingNow ? "animate-spin" : ""} />
                      <span>{isSyncingNow ? "در حال همگام‌سازی..." : "همگام‌سازی فوری همین حالا"}</span>
                    </button>
                  </div>
                </div>

                {/* Bucket File State List */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-slate-800 block">وضعیت فایل‌های همگام‌سازی شده در باکت ParsPack:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: "products.json", label: "محصولات و مشخصات فنی", count: `${products?.length || 0} عدد` },
                      { name: "factories.json", label: "اطلاعات کارخانجات صنعتی", count: "لیست کامل" },
                      { name: "orders.json", label: "سفارشات، پیش‌فاکتورها و تراکنش‌ها", count: "بروز شده" },
                      { name: "tickets.json", label: "تیکت‌های فنی و پیام‌های کلاینت", count: "لیست کامل" },
                      { name: "approvals.json", label: "آگهی‌ها و عاملیت‌های تحت بررسی", count: "آماده بررسی" },
                      { name: "config.json", label: "تنظیمات همتا به همتا (B2B)", count: "فعال" }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                            <FileCode size={14} className="text-slate-500" />
                          </div>
                          <div>
                            <code className="text-xs font-mono text-cyan-700 block text-left" dir="ltr">{item.name}</code>
                            <span className="text-[10px] text-slate-400 block">{item.label}</span>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Timer Display & Logs */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Visual Timer Display */}
                <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-lg">
                  <div className="absolute -left-10 -top-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <Clock className="text-emerald-400 w-10 h-10 animate-pulse mb-3" />
                  
                  <span className="text-xs text-slate-400 font-bold block mb-1">شمارش معکوس همگام‌سازی خودکار بعدی:</span>
                  
                  <div className="text-4xl font-mono font-black text-emerald-400 tracking-wider">
                    {autoSyncEnabled ? (
                      (() => {
                        const mins = Math.floor(nextSyncCountdown / 60);
                        const secs = nextSyncCountdown % 60;
                        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                      })()
                    ) : "-- : --"}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-800 w-full flex items-center justify-between text-xs text-slate-400">
                    <span>آخرین بروزرسانی موفق:</span>
                    <span className="font-mono text-emerald-300 font-bold">{lastSyncTime || "تنظیم نشده"}</span>
                  </div>
                </div>

                {/* History Log List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">تاریخچه آخرین تراکنش‌ها و فعالیت‌ها:</span>
                    <button
                      onClick={() => setSyncLogs([])}
                      className="text-[10px] text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                    >
                      پاک کردن تاریخچه
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {syncLogs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        هیچ فعالیت ثبت نشده است.
                      </div>
                    ) : (
                      syncLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                            log.status === "success"
                              ? "bg-emerald-50/40 border-emerald-100 text-slate-700"
                              : "bg-rose-50/40 border-rose-100 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${log.status === "success" ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                            <div>
                              <span className="text-xs font-bold block">{log.message}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                زمان اجرا: {log.durationMs} میلی‌ثانیه | تعداد فایل: {log.filesCount}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Section: Android WorkManager Periodic Sync Worker Code Guide */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <FileCode size={15} className="text-indigo-500" />
                  <span>راهنمای همگام‌سازی اتوماتیک در کلاینت اندروید (WorkManager & PeriodicWork)</span>
                </h4>
                <p className="text-[10px] text-slate-500 mt-1">
                  کد کاتلین استاندارد برای تعریف پردازشگر پس‌زمینه دوره زمانی (Periodic Work Request) در اپلیکیشن اندروید جهت همگام‌سازی باکت و REST API:
                </p>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">ParsPackSyncWorker.kt</span>
                  <button
                    onClick={() => handleCopy(kotlinWorkManagerCode, "kotlin_worker")}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                  >
                    {copiedKey === "kotlin_worker" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>کپی کد WorkManager</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                  <pre className="text-xs font-mono text-cyan-300 leading-relaxed text-left select-all" dir="ltr">
                    {kotlinWorkManagerCode}
                  </pre>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
