import React, { useState, useMemo } from "react";
import { getDisplayImageUrl } from "../lib/image-utils";
import { SmartJsonCatalogModal } from "./SmartJsonCatalogModal";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Search, 
  Filter, 
  Upload, 
  FileText, 
  ExternalLink, 
  Package, 
  CloudCheck, 
  CloudUpload, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  Database, 
  Check, 
  Sparkles,
  Download,
  FileSpreadsheet,
  Layers,
  Building2,
  Trash2,
  Copy,
  Info,
  Globe,
  Link as LinkIcon,
  Zap,
  DownloadCloud
} from "lucide-react";
import { Product } from "../types";

interface ProductSyncStatusViewProps {
  products: Product[];
  onUpdateProducts?: (updatedProducts: Product[]) => void;
  b2bConfig?: any;
  onSaveB2bConfig?: (newConfig: any) => Promise<void>;
}

export const ProductSyncStatusView: React.FC<ProductSyncStatusViewProps> = ({
  products,
  onUpdateProducts,
  b2bConfig,
  onSaveB2bConfig
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'updated' | 'pending' | 'error' | 's3_image'>('all');
  const [categoryFilter, setCategoryFilter] = useState("all");

  // JSON Import & Sync State
  const [jsonInput, setJsonInput] = useState("");
  const [jsonUrl, setJsonUrl] = useState<string>("http://c102393.parspack.net/c102393/catalog.json");
  const [syncMode, setSyncMode] = useState<'url' | 'json_paste'>('url');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [urlFetchMsg, setUrlFetchMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncSummary, setSyncSummary] = useState<{ updated: number; added: number; unchanged: number } | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  // Network & Server Diagnostics State
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<any>(null);
  const [showDiagModal, setShowDiagModal] = useState(false);

  const runNetworkDiagnostics = async (urlToCheck?: string) => {
    const target = (urlToCheck || jsonUrl).trim();
    setDiagLoading(true);
    setDiagResult(null);
    setShowDiagModal(true);
    try {
      const res = await fetch(`/api/diagnostics/catalog-sync?url=${encodeURIComponent(target)}`);
      const data = await res.json();
      setDiagResult(data);
    } catch (err: any) {
      setDiagResult({
        error: "ارتباط با سرور نودجی‌اس یا مسیر تست عیب‌یابی برقرار نشد: " + err.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setDiagLoading(false);
    }
  };

  // PDF Catalog Upload State
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState<string | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);
  const [activeCatalogPdfUrl, setActiveCatalogPdfUrl] = useState<string>(
    b2bConfig?.catalogPdfUrl || "http://c102393.parspack.net/c102393/catalogs/dastavval-catalog.pdf"
  );
  const [copiedLink, setCopiedLink] = useState(false);

  // Extract categories for filtering
  const allCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  }, [products]);

  // Handle Sync from JSON URL
  const handleSyncFromUrl = async (urlToFetch?: string) => {
    let targetUrl = (urlToFetch || jsonUrl).trim();
    if (targetUrl.includes("parspack.net") && targetUrl.startsWith("https://")) {
      targetUrl = targetUrl.replace(/^https:\/\//i, "http://");
    }
    if (!targetUrl) {
      alert("لطفاً لینک مستقیم فایل JSON محصولات را وارد نمایید.");
      return;
    }

    setIsSyncing(true);
    setIsFetchingUrl(true);
    setUrlFetchMsg(null);
    setSyncLogs([]);
    const logs: string[] = [];
    const clientHost = typeof window !== 'undefined' ? window.location.host : 'unknown';
    const clientProto = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    
    logs.push(`🌐 دامنه مبدا درخواست: ${clientProto}//${clientHost}`);
    logs.push(`🚀 شروع دریافت اطلاعات و همگام‌سازی محصولات از لینک باکت:\n${targetUrl}`);

    try {
      let rawData: any = null;
      let usedMethod: 'proxy' | 'direct' = 'proxy';
      let proxyStatusCode: number | null = null;
      let targetStatusCode: string | null = null;
      let targetContentType: string | null = null;
      let proxyDuration: string | null = null;

      // Attempt 1: Fetch via backend proxy endpoint (bypasses CORS & mixed-content on HTTPS domains)
      try {
        logs.push(`📡 ارسال درخواست به اندپوینت پروکسی سرور (/api/proxy-fetch)...`);
        const startTime = Date.now();
        const res = await fetch("/api/proxy-fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl })
        });
        
        proxyStatusCode = res.status;
        targetStatusCode = res.headers.get("X-Target-Status");
        targetContentType = res.headers.get("X-Target-Content-Type");
        proxyDuration = res.headers.get("X-Proxy-Duration-Ms") || String(Date.now() - startTime);

        logs.push(`📊 وضعیت پاسخ پروکسی: HTTP ${res.status} ${res.statusText} (${proxyDuration}ms) | وضعیت سرور باکت: ${targetStatusCode || res.status} | نوع محتوا: ${targetContentType || 'نامشخص'}`);

        if (res.ok) {
          rawData = await res.json();
          logs.push("✅ ارتباط موفق با پروکسی سرور برقرار شد و محتوای پاسخ دریافت گردید.");
          
          // Verify if response is a default PHP ping/status response instead of target catalog JSON
          if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
            const hasProducts = Array.isArray(rawData.products) || Array.isArray(rawData.items) || Array.isArray(rawData.data) || Array.isArray(rawData.catalog) || Array.isArray(rawData.result) || Array.isArray(rawData.goods) || Array.isArray(rawData.rows) || (rawData.data && Array.isArray(rawData.data.products));
            if (!hasProducts && (rawData.platform || rawData.status === 'online')) {
              logs.push("⚠️ پاسخ دریافت شده مربوط به پینگ موتور PHP بود. در حال تلاش مجدد با اکشن صریح PHP proxy-fetch...");
              rawData = null;
            }
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || errData.error_fa || `پروکسی با وضعیت ${res.status} پاسخ داد.`;
          logs.push(`⚠️ هشدار پروکسی: ${errMsg}`);
          if (errData.rawBodyPreview) {
            logs.push(`📄 پیش‌نمایش پاسخ سرور مبدا: ${errData.rawBodyPreview.slice(0, 150)}...`);
          }
        }
      } catch (proxyErr: any) {
        logs.push(`⚠️ خطا در اتصال به پروکسی داخلی: ${proxyErr.message}`);
      }

      // Attempt 2: Explicit PHP API Proxy Route for cPanel hosting
      if (!rawData) {
        try {
          logs.push("📡 ارسال درخواست به اکشن پروکسی cPanel PHP (/php/api.php?action=proxy-fetch)...");
          const phpRes = await fetch(`/php/api.php?action=proxy-fetch&url=${encodeURIComponent(targetUrl)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: targetUrl })
          });
          if (phpRes.ok) {
            rawData = await phpRes.json();
            logs.push("✅ پاسخ موفقیت‌آمیز از سرویس پروکسی PHP دریافت گردید.");
          }
        } catch (phpErr: any) {
          logs.push(`⚠️ تلاش اکشن PHP ناموفق بود: ${phpErr.message}`);
        }
      }

      // Attempt 3: Direct fetch fallback (works if user is on HTTP or CORS permits)
      if (!rawData) {
        if (clientProto === 'https:' && targetUrl.startsWith('http://')) {
          logs.push("⚠️ توجه: با توجه به اینکه دامنه شما HTTPS است، درخواست مستقیم HTTP توسط مرورگر (Mixed Content) مسدود می‌شود.");
        }
        logs.push("در حال تلاش برای دریافت مستقیم از باکت...");
        try {
          const directRes = await fetch(targetUrl);
          logs.push(`📊 کد وضعیت دریافت مستقیم: HTTP ${directRes.status} ${directRes.statusText}`);
          if (directRes.ok) {
            rawData = await directRes.json();
            usedMethod = 'direct';
            logs.push("✅ فایل به صورت مستقیم از باکت دانلود شد.");
          } else {
            throw new Error(`پاسخ سرور باکت با کد وضعیت ${directRes.status}`);
          }
        } catch (dirErr: any) {
          logs.push(`❌ دریافت مستقیم نیز ناموفق بود: ${dirErr.message}`);
        }
      }

      if (!rawData) {
        throw new Error(`امکان خواندن فایل JSON از لینک فوق وجود ندارد. وضعیت پروکسی: ${proxyStatusCode || 'نامشخص'}, وضعیت باکت: ${targetStatusCode || 'نامشخص'}. دکمه «تست و عیب‌یابی شبکه» را بزنید.`);
      }

      // Handle raw string or JSON wrap
      if (typeof rawData === 'string') {
        try {
          rawData = JSON.parse(rawData.replace(/^\uFEFF/, '').trim());
        } catch (e) {
          logs.push("⚠️ متن دریافتی به عنوان رشته دریافت شد اما فرمت JSON ندارد.");
        }
      }

      // Inspect received object keys for debugging
      if (typeof rawData === 'object' && rawData !== null && !Array.isArray(rawData)) {
        const keys = Object.keys(rawData);
        logs.push(`🔍 ساختار کلیدهای شیء دریافتی: [${keys.join(", ")}]`);
        if (rawData.error) {
          logs.push(`❌ خطای گزارش‌شده داخل پاسخ: ${rawData.error}`);
        }
      }

      // Resilient extraction of products array
      let incomingProducts: any[] = [];
      if (Array.isArray(rawData)) {
        incomingProducts = rawData;
      } else if (rawData && typeof rawData === 'object') {
        if (Array.isArray(rawData.products)) incomingProducts = rawData.products;
        else if (Array.isArray(rawData.items)) incomingProducts = rawData.items;
        else if (Array.isArray(rawData.data)) incomingProducts = rawData.data;
        else if (rawData.data && Array.isArray(rawData.data.products)) incomingProducts = rawData.data.products;
        else if (Array.isArray(rawData.catalog)) incomingProducts = rawData.catalog;
        else if (Array.isArray(rawData.result)) incomingProducts = rawData.result;
        else if (Array.isArray(rawData.goods)) incomingProducts = rawData.goods;
        else if (Array.isArray(rawData.rows)) incomingProducts = rawData.rows;
      }

      if (!incomingProducts || incomingProducts.length === 0) {
        const keysFound = (rawData && typeof rawData === 'object') ? Object.keys(rawData).join(", ") : typeof rawData;
        throw new Error(`فایل JSON دریافت شد اما هیچ آرایه‌ای از محصولات داخل آن وجود ندارد. (کلیدهای شناسایی‌شده در پاسخ: ${keysFound})`);
      }

      logs.push(`📦 تعداد ${incomingProducts.length} محصول معتبر در فایل JSON شناسایی شد.`);

      let updatedCount = 0;
      let addedCount = 0;
      let unchangedCount = 0;

      const currentProductsCopy = [...products];

      incomingProducts.forEach((incItem: any, idx: number) => {
        const sku = incItem.sku || String(incItem.id) || `PRD-${idx + 1}`;
        const existingIdx = currentProductsCopy.findIndex(p => p.sku === sku || String(p.id) === String(incItem.id) || p.sku === String(incItem.id) || p.name === incItem.name);

        // Price Mapping:
        // factoryPrice / wholesalePrice = قیمت خرید دست اول از کارخانه (مثلاً 750,000 تومان)
        // sellPrice / marketPrice = قیمت فروش عمده دست اول به خریدار (مثلاً 780,000 تومان)
        // consumerPrice = قیمت درج‌شده روی جلد مصرف‌کننده (مثلاً 1,000,000 تومان)
        const factoryBuyPrice = Number(incItem.factoryPrice || incItem.wholesalePrice || incItem.price || 0);
        const dastAvvalSellPrice = Number(incItem.sellPrice || incItem.marketPrice || incItem.bulk_price || (factoryBuyPrice ? Math.round(factoryBuyPrice * 1.04) : 0));
        const consumerRetailPrice = Number(incItem.consumerPrice || incItem.consumer_price || incItem.retailPrice || 0);

        const rawImageUrl = incItem.imageUrl || incItem.image_url || incItem.image;
        const processedImage = getDisplayImageUrl(rawImageUrl);

        const itemsPerCarton = Number(incItem.itemsPerUnit || incItem.carton_pack_count || incItem.pack_count || 1);
        const stockCartons = Number(incItem.stock !== undefined ? incItem.stock : incItem.stock_quantity_cartons || 10);
        const minOrderCartons = Number(incItem.min_order_cartons || incItem.minOrder || 1) || 1;
        const safetyThreshold = Number(incItem.minimumStock || incItem.min_stock_alert || 5);
        const brandName = incItem.location || incItem.factoryName || incItem.brand || "انبار دست اول";

        if (existingIdx >= 0) {
          // Update existing product
          currentProductsCopy[existingIdx] = {
            ...currentProductsCopy[existingIdx],
            name: incItem.name || currentProductsCopy[existingIdx].name,
            price: factoryBuyPrice || currentProductsCopy[existingIdx].price,
            bulk_price: dastAvvalSellPrice || currentProductsCopy[existingIdx].bulk_price,
            consumer_price: consumerRetailPrice || currentProductsCopy[existingIdx].consumer_price,
            carton_pack_count: itemsPerCarton || currentProductsCopy[existingIdx].carton_pack_count,
            stock_quantity_cartons: stockCartons,
            min_order_cartons: minOrderCartons,
            min_stock_alert: safetyThreshold,
            unit: incItem.unit || currentProductsCopy[existingIdx].unit || "عدد",
            image_url: processedImage || currentProductsCopy[existingIdx].image_url,
            category: incItem.category || currentProductsCopy[existingIdx].category,
            brand: brandName || currentProductsCopy[existingIdx].brand,
            sellerName: brandName || currentProductsCopy[existingIdx].sellerName,
            description: incItem.description || currentProductsCopy[existingIdx].description,
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          };
          updatedCount++;
          logs.push(`✅ بروزرسانی قیمت و مشخصات [${sku}]: ${incItem.name}`);
        } else {
          // Add new product
          const newProd: Product = {
            id: sku,
            sku: sku,
            name: incItem.name || "محصول جدید کاتالوگ",
            brand: brandName,
            category: incItem.category || "صنایع عمومی",
            price: factoryBuyPrice || 750000,
            bulk_price: dastAvvalSellPrice || 780000,
            consumer_price: consumerRetailPrice || 1000000,
            carton_pack_count: itemsPerCarton,
            min_order_cartons: minOrderCartons,
            stock_quantity_cartons: stockCartons,
            min_stock_alert: safetyThreshold,
            unit: incItem.unit || "عدد",
            sellerId: "factory-android",
            sellerName: brandName,
            production_lead_time_days: 1,
            image_url: processedImage,
            description: incItem.description || "واردشده مستقیم از لینک JSON باکت پارس‌پک",
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          };
          currentProductsCopy.unshift(newProd);
          addedCount++;
          logs.push(`➕ افزودن محصول جدید به کاتالوگ [${sku}]: ${incItem.name}`);
        }
      });

      if (onUpdateProducts) {
        onUpdateProducts(currentProductsCopy);
      }

      setSyncSummary({ updated: updatedCount, added: addedCount, unchanged: unchangedCount });
      const successText = `همگام‌سازی کامل شد! ${updatedCount} محصول بروزرسانی شد و ${addedCount} محصول جدید از لینک JSON اضافه گردید.`;
      setUrlFetchMsg({ type: 'success', text: successText });
      logs.push(`🎉 ${successText}`);
    } catch (err: any) {
      const errorText = `خطا در دریافت یا همگام‌سازی فایل JSON: ${err.message}`;
      setUrlFetchMsg({ type: 'error', text: errorText });
      logs.push(`❌ ${errorText}`);
    } finally {
      setIsSyncing(false);
      setIsFetchingUrl(false);
      setSyncLogs(logs);
    }
  };

  // Compute sync statuses for products
  const productStatuses = useMemo(() => {
    return products.map(p => {
      const hasS3Image = !!(p.image_url && (p.image_url.includes("parspack.net") || p.image_url.includes("parsstorage.com") || p.image_url.includes("s3.")));
      const isComplete = !!(p.name && p.bulk_price > 0 && p.sku);
      
      // Simulated or tracked sync status
      let syncStatus: 'updated' | 'pending' | 'error' = 'updated';
      if (!isComplete || p.bulk_price <= 0) {
        syncStatus = 'error';
      } else if (!p.updated_at && !hasS3Image) {
        syncStatus = 'pending';
      }

      return {
        ...p,
        syncStatus,
        hasS3Image,
        lastSyncDate: p.updated_at || "۱۴۰۵/۰۵/۲۵ - ۱۴:۳۰",
        priceFormatted: p.bulk_price ? p.bulk_price.toLocaleString('fa-IR') + ' تومان' : 'تعیین‌نشده',
        marketPriceFormatted: p.consumer_price ? p.consumer_price.toLocaleString('fa-IR') + ' تومان' : 'تعیین‌نشده',
      };
    });
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productStatuses.filter(item => {
      // Search
      const matchSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchCategory = categoryFilter === 'all' || item.category === categoryFilter;

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'updated') matchStatus = item.syncStatus === 'updated';
      if (statusFilter === 'pending') matchStatus = item.syncStatus === 'pending';
      if (statusFilter === 'error') matchStatus = item.syncStatus === 'error';
      if (statusFilter === 's3_image') matchStatus = item.hasS3Image;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [productStatuses, searchQuery, categoryFilter, statusFilter]);

  // Summary Counts
  const counts = useMemo(() => {
    const total = productStatuses.length;
    const updated = productStatuses.filter(p => p.syncStatus === 'updated').length;
    const pending = productStatuses.filter(p => p.syncStatus === 'pending').length;
    const error = productStatuses.filter(p => p.syncStatus === 'error').length;
    const s3ImageCount = productStatuses.filter(p => p.hasS3Image).length;
    return { total, updated, pending, error, s3ImageCount };
  }, [productStatuses]);

  // Handle PDF Upload to ParsPack S3
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      setPdfUploadError("لطفاً فقط فایل با فرمت PDF انتخاب کنید.");
      return;
    }

    setIsUploadingPdf(true);
    setPdfUploadError(null);
    setPdfUploadSuccess(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result as string;
          const res = await fetch("/api/storage/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: file.name,
              folder: "catalogs",
              contentType: "application/pdf"
            })
          });

          const data = await res.json();
          if (data.success && data.url) {
            setActiveCatalogPdfUrl(data.url);
            setPdfUploadSuccess(`فایل کاتالوگ ${file.name} با موفقیت در باکت پارس‌پک ذخیره شد!`);
            
            // Save to b2bConfig
            if (onSaveB2bConfig) {
              await onSaveB2bConfig({
                ...b2bConfig,
                catalogPdfUrl: data.url
              });
            }
          } else {
            setPdfUploadError("خطا در آپلود کاتالوگ: " + (data.error || "پاسخ نامعتبر از سرور"));
          }
        } catch (err: any) {
          setPdfUploadError("خطا در ارتباط با باکت پارس‌پک: " + err.message);
        } finally {
          setIsUploadingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setPdfUploadError("خطا در خواندن فایل PDF: " + err.message);
      setIsUploadingPdf(false);
    }
  };

  // Handle Android JSON Import Sync
  const handleSyncJson = () => {
    if (!jsonInput.trim()) {
      alert("لطفاً محتوای فایل JSON خروجی اپلیکیشن اندروید را وارد کنید.");
      return;
    }

    setIsSyncing(true);
    setSyncLogs([]);
    const logs: string[] = [];
    logs.push("شروع خواندن و اعتبارسنجی ساختار فایل JSON اندروید...");

    try {
      const parsed = JSON.parse(jsonInput);
      const incomingProducts = Array.isArray(parsed) ? parsed : (parsed.products || parsed.items || []);

      if (!incomingProducts || incomingProducts.length === 0) {
        throw new Error("هیچ آرایه‌ای از محصولات در فایل JSON یافت نشد.");
      }

      logs.push(`تعداد ${incomingProducts.length} محصول در فایل خروجی شناسایی شد.`);

      let updatedCount = 0;
      let addedCount = 0;
      let unchangedCount = 0;

      const currentProductsCopy = [...products];

      incomingProducts.forEach((incItem: any, idx: number) => {
        const sku = incItem.sku || String(incItem.id) || `PRD-${idx + 1}`;
        const existingIdx = currentProductsCopy.findIndex(p => p.sku === sku || String(p.id) === String(incItem.id) || p.sku === String(incItem.id) || p.name === incItem.name);

        const factoryBuyPrice = Number(incItem.factoryPrice || incItem.wholesalePrice || incItem.price || 0);
        const dastAvvalSellPrice = Number(incItem.sellPrice || incItem.marketPrice || incItem.bulk_price || (factoryBuyPrice ? Math.round(factoryBuyPrice * 1.04) : 0));
        const consumerRetailPrice = Number(incItem.consumerPrice || incItem.consumer_price || incItem.retailPrice || 0);

        const rawImageUrl = incItem.imageUrl || incItem.image_url || incItem.image;
        const processedImage = getDisplayImageUrl(rawImageUrl);

        const itemsPerCarton = Number(incItem.itemsPerUnit || incItem.carton_pack_count || incItem.pack_count || 1);
        const stockCartons = Number(incItem.stock !== undefined ? incItem.stock : incItem.stock_quantity_cartons || 10);
        const minOrderCartons = Number(incItem.min_order_cartons || incItem.minOrder || 1) || 1;
        const safetyThreshold = Number(incItem.minimumStock || incItem.min_stock_alert || 5);
        const brandName = incItem.location || incItem.factoryName || incItem.brand || "انبار دست اول";

        if (existingIdx >= 0) {
          // Update existing
          currentProductsCopy[existingIdx] = {
            ...currentProductsCopy[existingIdx],
            name: incItem.name || currentProductsCopy[existingIdx].name,
            price: factoryBuyPrice || currentProductsCopy[existingIdx].price,
            bulk_price: dastAvvalSellPrice || currentProductsCopy[existingIdx].bulk_price,
            consumer_price: consumerRetailPrice || currentProductsCopy[existingIdx].consumer_price,
            carton_pack_count: itemsPerCarton || currentProductsCopy[existingIdx].carton_pack_count,
            stock_quantity_cartons: stockCartons,
            min_order_cartons: minOrderCartons,
            min_stock_alert: safetyThreshold,
            unit: incItem.unit || currentProductsCopy[existingIdx].unit || "عدد",
            image_url: processedImage || currentProductsCopy[existingIdx].image_url,
            category: incItem.category || currentProductsCopy[existingIdx].category,
            brand: brandName || currentProductsCopy[existingIdx].brand,
            sellerName: brandName || currentProductsCopy[existingIdx].sellerName,
            description: incItem.description || currentProductsCopy[existingIdx].description,
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          };
          updatedCount++;
          logs.push(`✅ بروزرسانی محصول [${sku}]: ${incItem.name}`);
        } else {
          // Add new
          const newProd: Product = {
            id: sku,
            sku: sku,
            name: incItem.name || "محصول جدید اندروید",
            brand: brandName,
            category: incItem.category || "صنایع عمومی",
            price: factoryBuyPrice || 750000,
            bulk_price: dastAvvalSellPrice || 780000,
            consumer_price: consumerRetailPrice || 1000000,
            carton_pack_count: itemsPerCarton,
            min_order_cartons: minOrderCartons,
            stock_quantity_cartons: stockCartons,
            min_stock_alert: safetyThreshold,
            unit: incItem.unit || "عدد",
            sellerId: "factory-android",
            sellerName: brandName,
            production_lead_time_days: 1,
            image_url: processedImage,
            description: incItem.description || "واردشده از اپلیکیشن اندروید کاتالوگ‌ساز",
            updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
          };
          currentProductsCopy.unshift(newProd);
          addedCount++;
          logs.push(`➕ افزودن محصول جدید [${sku}]: ${incItem.name}`);
        }
      });

      if (onUpdateProducts) {
        onUpdateProducts(currentProductsCopy);
      }

      setSyncSummary({ updated: updatedCount, added: addedCount, unchanged: unchangedCount });
      logs.push(`🎉 همگام‌سازی کامل شد! ${updatedCount} محصول به‌روزرسانی شد و ${addedCount} محصول جدید اضافه گردید.`);
    } catch (err: any) {
      logs.push(`❌ خطای اعتبارسنجی JSON: ${err.message}`);
    } finally {
      setSyncLogs(logs);
      setIsSyncing(false);
    }
  };

  // Handle Multi-channel Smart Catalog Application
  const handleApplyImportedProducts = (newItems: any[], mode: 'merge' | 'replace') => {
    setIsSyncing(true);
    let updatedCount = 0;
    let addedCount = 0;
    
    const currentProductsCopy = mode === 'replace' ? [] : [...products];
    
    newItems.forEach((incItem: any, idx: number) => {
      const sku = incItem.sku || String(incItem.id) || `PRD-${idx + 1}`;
      const existingIdx = currentProductsCopy.findIndex(p => p.sku === sku || String(p.id) === String(incItem.id) || p.sku === String(incItem.id) || p.name === incItem.name);
      
      const processedImage = getDisplayImageUrl(incItem.imageUrl);
      
      if (existingIdx >= 0) {
        currentProductsCopy[existingIdx] = {
          ...currentProductsCopy[existingIdx],
          name: incItem.name || currentProductsCopy[existingIdx].name,
          price: incItem.factoryPrice || currentProductsCopy[existingIdx].price,
          bulk_price: incItem.sellPrice || currentProductsCopy[existingIdx].bulk_price,
          consumer_price: incItem.consumerPrice || currentProductsCopy[existingIdx].consumer_price,
          carton_pack_count: incItem.cartonPackCount || currentProductsCopy[existingIdx].carton_pack_count,
          stock_quantity_cartons: incItem.stockCartons,
          min_order_cartons: incItem.minOrderCartons,
          min_stock_alert: incItem.minStockAlert,
          unit: incItem.unit || currentProductsCopy[existingIdx].unit || "عدد",
          image_url: processedImage || currentProductsCopy[existingIdx].image_url,
          category: incItem.category || currentProductsCopy[existingIdx].category,
          brand: incItem.brand || currentProductsCopy[existingIdx].brand,
          sellerName: incItem.brand || currentProductsCopy[existingIdx].sellerName,
          description: incItem.description || currentProductsCopy[existingIdx].description,
          updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
        updatedCount++;
      } else {
        const newProd: Product = {
          id: String(sku),
          sku: sku,
          name: incItem.name || "محصول کاتالوگ",
          brand: incItem.brand || "انبار دست اول",
          category: incItem.category || "محصولات غذایی",
          price: incItem.factoryPrice || 750000,
          bulk_price: incItem.sellPrice || 780000,
          consumer_price: incItem.consumerPrice || 1000000,
          carton_pack_count: incItem.cartonPackCount || 1,
          min_order_cartons: incItem.minOrderCartons || 1,
          stock_quantity_cartons: incItem.stockCartons || 10,
          min_stock_alert: incItem.minStockAlert || 5,
          unit: incItem.unit || "عدد",
          sellerId: "factory-json",
          sellerName: incItem.brand || "انبار دست اول",
          production_lead_time_days: 1,
          image_url: processedImage,
          description: incItem.description || "واردشده از موتور هوشمند کاتالوگ‌ساز",
          updated_at: new Date().toLocaleDateString('fa-IR') + ' - ' + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        };
        currentProductsCopy.unshift(newProd);
        addedCount++;
      }
    });

    if (onUpdateProducts) {
      onUpdateProducts(currentProductsCopy);
    }

    setSyncSummary({ updated: updatedCount, added: addedCount, unchanged: 0 });
    setIsSyncing(false);
  };

  const copyPdfLink = () => {
    navigator.clipboard.writeText(activeCatalogPdfUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Banner & Quick Controls */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-400/30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 mb-3">
              <Database size={14} />
              <span>پایش لحظه‌ای انبار و همگام‌سازی اتوماتیک باکت پارس‌پک</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              وضعیت بروزرسانی و سلامت کاتالوگ محصولات
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-1.5 max-w-2xl leading-relaxed">
              بررسی لحظه‌ای محصولات همگام‌شده از لینک JSON، باکت پارس‌پک (`c102393.parspack.net`) و مدیریت فایل‌های کاتالوگ رسمی PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => handleSyncFromUrl("https://c102393.parspack.net/c102393/catalog.json")}
              disabled={isSyncing}
              className="flex-1 lg:flex-none px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <Zap size={16} />}
              <span>همگام‌سازی از catalog.json باکت</span>
            </button>

            <button
              onClick={() => setShowJsonModal(true)}
              className="flex-1 lg:flex-none px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Globe size={16} />
              <span>تنظیمات و واردسازی لینک JSON</span>
            </button>
            
            <a
              href="#pdf-uploader-section"
              className="flex-1 lg:flex-none px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20 backdrop-blur-sm"
            >
              <FileText size={16} />
              <span>مدیریت کاتالوگ PDF باکت</span>
            </a>
          </div>
        </div>
      </div>

      {/* SECTION: Direct JSON URL Sync Tool Card */}
      <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-3xl border border-emerald-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-md shadow-emerald-500/20">
              <Globe size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  همگام‌سازی و بروزرسانی مستقیم محصولات از لینک JSON باکت
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">
                  ParsPack CDN Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                فراخوانی اتوماتیک کاتالوگ محصولات از فایل JSON آنلاین ذخیره‌شده روی هاست ابری پارس‌پک و بروزرسانی یکباره قیمت‌ها و تصاویر.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSyncFromUrl()}
            disabled={isSyncing}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
            <span>{isSyncing ? "در حال دریافت و همگام‌سازی..." : "شروع بروزرسانی از لینک JSON"}</span>
          </button>
        </div>

        {/* Input & Quick Link Controls */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon size={16} />
              </div>
              <input
                type="text"
                value={jsonUrl}
                onChange={(e) => setJsonUrl(e.target.value)}
                placeholder="https://c102393.parspack.net/c102393/catalog.json"
                className="w-full pr-10 pl-4 py-3 bg-white border border-slate-300 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dir-ltr text-left font-semibold shadow-xs"
              />
            </div>

            <button
              onClick={() => {
                setJsonUrl("https://c102393.parspack.net/c102393/catalog.json");
              }}
              className="px-3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl transition-all cursor-pointer whitespace-nowrap"
              title="بازنشانی به لینک اصلی پارس‌پک"
            >
              لینک پیش‌فرض پارس‌پک
            </button>

            <button
              onClick={() => runNetworkDiagnostics()}
              disabled={diagLoading}
              className="px-3.5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-cyan-600/20"
              title="تست کامل وضعیت شبکه، هدرهای پاسخ و کد وضعیت ارتباطی سرور با پارس‌پک"
            >
              <Zap size={14} className={diagLoading ? "animate-spin" : ""} />
              <span>{diagLoading ? "در حال عیب‌یابی..." : "عیب‌یابی شبکه و سرور"}</span>
            </button>

            <a
              href={jsonUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shadow-md shadow-indigo-600/20"
            >
              <ExternalLink size={14} />
              <span>مشاهده مستقیم</span>
            </a>
          </div>

          {/* Network Diagnostics Results Modal/Card */}
          {showDiagModal && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-xl space-y-3 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-cyan-400" />
                  <span className="text-xs font-black text-cyan-400">گزارش عیب‌یابی شبکه و هدرهای سرور (Network & Headers Diagnostic)</span>
                </div>
                <button
                  onClick={() => setShowDiagModal(false)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-800 rounded-lg cursor-pointer"
                >
                  بستن
                </button>
              </div>

              {diagLoading ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                  <RefreshCw size={24} className="animate-spin text-cyan-400" />
                  <span>در حال ارسال پکت‌های تست، بررسی DNS، هدرهای پاسخ و ساختار JSON...</span>
                </div>
              ) : diagResult ? (
                <div className="space-y-3 text-xs">
                  {diagResult.error ? (
                    <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl">
                      {diagResult.error}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 block font-bold">میزبان کلاینت (Host)</span>
                          <span className="text-xs font-mono font-bold text-amber-300">{diagResult.clientHost || window.location.host}</span>
                        </div>
                        <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 block font-bold">وضعیت DNS پارس‌پک</span>
                          <span className={`text-xs font-bold ${diagResult.dnsLookup?.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {diagResult.dnsLookup?.status === 'SUCCESS' ? `✅ متصل (${diagResult.dnsLookup?.addresses?.[0]?.address || 'IP OK'})` : '❌ خطا در DNS'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                          <span className="text-[10px] text-slate-400 block font-bold">تعداد محصولات شناسایی‌شده</span>
                          <span className="text-xs font-bold text-cyan-300 font-mono">
                            {diagResult.httpDirectTest?.productCount || 0} عدد کالا
                          </span>
                        </div>
                      </div>

                      {/* HTTP Status & Headers Table */}
                      {diagResult.httpDirectTest && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex justify-between items-center font-mono text-[11px]">
                            <span className="text-slate-400">کد وضعیت پاسخ سرور (HTTP Status):</span>
                            <span className={`px-2 py-0.5 rounded font-black ${diagResult.httpDirectTest.status === 200 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
                              HTTP {diagResult.httpDirectTest.status} {diagResult.httpDirectTest.statusText} ({diagResult.httpDirectTest.durationMs}ms)
                            </span>
                          </div>
                          
                          <div className="text-[11px] font-mono space-y-1 pt-1 border-t border-slate-900 dir-ltr text-left text-slate-300 max-h-32 overflow-y-auto">
                            <div><strong className="text-cyan-400">Content-Type:</strong> {diagResult.httpDirectTest.headers?.['content-type'] || 'نامشخص'}</div>
                            <div><strong className="text-cyan-400">Content-Length:</strong> {diagResult.httpDirectTest.headers?.['content-length'] || 'نامشخص'} بایت</div>
                            <div><strong className="text-cyan-400">Server:</strong> {diagResult.httpDirectTest.headers?.['server'] || 'نامشخص'}</div>
                            <div><strong className="text-cyan-400">Access-Control-Allow-Origin:</strong> {diagResult.httpDirectTest.headers?.['access-control-allow-origin'] || 'ندارد'}</div>
                            <div><strong className="text-cyan-400">Top Level Keys:</strong> [{diagResult.httpDirectTest.topLevelKeys?.join(", ")}]</div>
                          </div>
                        </div>
                      )}

                      {/* Diagnostic Status Message */}
                      {diagResult.jsonValidation && (
                        <div className={`p-3 rounded-xl text-xs font-bold border ${diagResult.jsonValidation.status === 'VALID_CATALOG' ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' : 'bg-amber-950/60 border-amber-700 text-amber-300'}`}>
                          {diagResult.jsonValidation.message}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {urlFetchMsg && (
            <div className={`p-3.5 rounded-2xl text-xs font-black flex items-center gap-2.5 ${
              urlFetchMsg.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-rose-100 text-rose-900 border border-rose-200'
            }`}>
              {urlFetchMsg.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-rose-600 shrink-0" />}
              <span>{urlFetchMsg.text}</span>
            </div>
          )}

          {syncLogs.length > 0 && (
            <div className="p-3.5 bg-slate-50 text-slate-800 font-mono text-[11px] rounded-2xl max-h-40 overflow-y-auto space-y-1 dir-ltr text-left border border-slate-200 shadow-inner">
              {syncLogs.map((log, idx) => (
                <div key={`sync-log-${idx}`} className="leading-relaxed">{log}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        
        {/* Total Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-[11px] font-black text-slate-500">کل محصولات</span>
            <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
              <Package size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-slate-900">{counts.total}</span>
            <span className="text-[10px] text-slate-400 font-bold">کالا</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">موجود در کاتالوگ فعال</div>
        </div>

        {/* Updated Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-xs flex flex-col justify-between bg-emerald-50/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-black text-emerald-800">🟢 بروزرسانی موفق</span>
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{counts.updated}</span>
            <span className="text-[10px] text-emerald-600 font-bold">کالا</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-600 font-bold">کاملاً همگام و دارای قیمت</div>
        </div>

        {/* Pending Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-xs flex flex-col justify-between bg-amber-50/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-black text-amber-800">🟡 در انتظار همگام‌سازی</span>
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <Clock size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-amber-700">{counts.pending}</span>
            <span className="text-[10px] text-amber-600 font-bold">کالا</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-600 font-bold">نیازمند به بروزرسانی اخیر</div>
        </div>

        {/* Failed / Error Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-xs flex flex-col justify-between bg-rose-50/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-black text-rose-800">🔴 نیازمند اصلاح</span>
            <div className="p-2 bg-rose-100 rounded-xl text-rose-700">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-rose-700">{counts.error}</span>
            <span className="text-[10px] text-rose-600 font-bold">کالا</span>
          </div>
          <div className="mt-2 text-[10px] text-rose-600 font-bold">بدون قیمت یا مشخصات ناقص</div>
        </div>

        {/* S3 ParsPack Images */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-xs flex flex-col justify-between bg-sky-50/30 col-span-2 sm:col-span-1">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-black text-sky-800">☁️ عکس باکت پارس‌پک</span>
            <div className="p-2 bg-sky-100 rounded-xl text-sky-700">
              <CloudCheck size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-sky-700">{counts.s3ImageCount}</span>
            <span className="text-[10px] text-sky-600 font-bold">تصویر S3</span>
          </div>
          <div className="mt-2 text-[10px] text-sky-600 font-bold">هاست‌شده در پارس‌پک c102393</div>
        </div>

      </div>

      {/* SECTION: PDF Catalog Upload & Management on ParsPack Bucket */}
      <div id="pdf-uploader-section" className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                مدیریت کاتالوگ PDF رسمی در باکت پارس‌پک (`c102393.parspack.net`)
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                آپلود مستقیم فایل PDF جدید کاتالوگ محصولات جهت دانلود توسط بنکداران و خریداران عمده.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activeCatalogPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
            >
              <Eye size={14} />
              <span>مشاهده و دانلود کاتالوگ فعلی</span>
            </a>
          </div>
        </div>

        {/* Current Active PDF Status Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0 font-black text-xs">PDF</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 truncate">فایل کاتالوگ رسمی متصل به باکت</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-md">
                  فعال روی ParsPack S3
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5 dir-ltr text-right">
                {activeCatalogPdfUrl}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={copyPdfLink}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedLink ? "لینک کپی شد!" : "کپی لینک S3"}</span>
            </button>
            
            <a
              href={activeCatalogPdfUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>دانلود مستقیم</span>
            </a>
          </div>
        </div>

        {/* PDF Drag & Drop Upload Zone */}
        <div className="relative border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-6 text-center transition-all cursor-pointer">
          <input
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            disabled={isUploadingPdf}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
              {isUploadingPdf ? <RefreshCw size={24} className="animate-spin" /> : <CloudUpload size={24} />}
            </div>
            <div>
              <p className="text-xs font-black text-slate-900">
                {isUploadingPdf ? "در حال آپلود و ذخیره‌سازی فایل PDF کاتالوگ در باکت پارس‌پک..." : "برای آپلود فایل کاتالوگ PDF جدید، اینجا کلیک کنید یا فایل را بکشید و رها کنید"}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">
                فرمت مجاز: فقط PDF | ذخیره‌سازی خودکار در پوشه `catalogs/` باکت پارس‌پک
              </p>
            </div>
          </div>
        </div>

        {pdfUploadSuccess && (
          <div className="p-3 bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-black rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={16} />
            <span>{pdfUploadSuccess}</span>
          </div>
        )}

        {pdfUploadError && (
          <div className="p-3 bg-rose-100/80 border border-rose-200 text-rose-800 text-xs font-black rounded-xl flex items-center gap-2 animate-fade-in">
            <AlertCircle size={16} />
            <span>{pdfUploadError}</span>
          </div>
        )}
      </div>

      {/* Main Filter & Search Control Panel for Products */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با نام کالا، کد SKU، برند کارخانه..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            
            {/* Status Filter Badges */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto max-w-full">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                همه ({counts.total})
              </button>
              <button
                onClick={() => setStatusFilter('updated')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'updated' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                🟢 بروزرسانی موفق ({counts.updated})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                🟡 در انتظار ({counts.pending})
              </button>
              <button
                onClick={() => setStatusFilter('error')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'error' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-rose-700'
                }`}
              >
                🔴 نیازمند اصلاح ({counts.error})
              </button>
              <button
                onClick={() => setStatusFilter('s3_image')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 's3_image' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-500 hover:text-sky-700'
                }`}
              >
                ☁️ عکس باکت ({counts.s3ImageCount})
              </button>
            </div>

            {/* Category Dropdown */}
            {allCategories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">تمام دسته‌بندی‌ها</option>
                {allCategories.map((cat, idx) => (
                  <option key={`sync-cat-opt-${cat}-${idx}`} value={cat}>{cat}</option>
                ))}
              </select>
            )}

          </div>

        </div>

        {/* Detailed Products Status Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-black border-b border-slate-200/80">
                <th className="p-3.5 text-center w-12">#</th>
                <th className="p-3.5">تصویر & S3</th>
                <th className="p-3.5">کد SKU و نام محصول</th>
                <th className="p-3.5">دسته‌بندی / کارخانه</th>
                <th className="p-3.5">قیمت عمده (فروشگاه)</th>
                <th className="p-3.5">قیمت مصرف‌کننده (بازار)</th>
                <th className="p-3.5 text-center">وضعیت همگام‌سازی</th>
                <th className="p-3.5 text-center">آخرین بروزرسانی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    هیچ محصولی مطابق با فیلترها و عبارت جستجو پیدا نشد.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item, idx) => (
                  <tr key={`sync-status-item-${item.id || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                    
                    {/* Image & S3 status */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={item.image_url || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=100"}
                          alt={item.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                        />
                        {item.hasS3Image ? (
                          <span className="px-1.5 py-0.5 bg-sky-100 text-sky-700 text-[9px] font-black rounded-md border border-sky-200 flex items-center gap-1 shrink-0" title="ذخیره‌شده در باکت پارس‌پک">
                            <CloudCheck size={10} />
                            <span>S3</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-bold rounded-md shrink-0">
                            عادی
                          </span>
                        )}
                      </div>
                    </td>

                    {/* SKU & Title */}
                    <td className="p-3.5">
                      <div>
                        <div className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">
                          SKU: {item.sku || item.id}
                        </div>
                      </div>
                    </td>

                    {/* Category & Factory */}
                    <td className="p-3.5">
                      <div>
                        <span className="text-slate-800 font-bold block">{item.category || 'عمومی'}</span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{item.brand || 'کارخانه دست اول'}</span>
                      </div>
                    </td>

                    {/* Wholesale price */}
                    <td className="p-3.5">
                      <span className="font-black text-slate-900">{item.priceFormatted}</span>
                    </td>

                    {/* Market price */}
                    <td className="p-3.5">
                      <span className="font-bold text-slate-500">{item.marketPriceFormatted}</span>
                    </td>

                    {/* Sync Status Badge */}
                    <td className="p-3.5 text-center">
                      {item.syncStatus === 'updated' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>بروزرسانی موفق</span>
                        </span>
                      )}
                      {item.syncStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full border border-amber-200">
                          <Clock size={12} />
                          <span>در انتظار همگام‌سازی</span>
                        </span>
                      )}
                      {item.syncStatus === 'error' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 text-[10px] font-black rounded-full border border-rose-200">
                          <AlertCircle size={12} />
                          <span>نیازمند اصلاح قیمت</span>
                        </span>
                      )}
                    </td>

                    {/* Last Sync Timestamp */}
                    <td className="p-3.5 text-center text-[10px] font-mono text-slate-500 font-bold">
                      {item.lastSyncDate}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* JSON Import Modal */}
      <SmartJsonCatalogModal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        onApplyProducts={handleApplyImportedProducts}
        defaultUrl={jsonUrl}
      />

    </div>
  );
};

export default ProductSyncStatusView;
