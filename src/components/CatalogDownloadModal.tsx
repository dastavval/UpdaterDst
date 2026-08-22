import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { getApiUrl, isWarehouseBrand } from "../utils/api-utils";
import { 
  X, 
  Printer, 
  FileText, 
  CheckSquare, 
  Square, 
  Download, 
  ShieldCheck, 
  Info, 
  SlidersHorizontal, 
  Building2, 
  Tag, 
  Check, 
  Layers, 
  Sparkles,
  Search,
  Filter,
  PackageCheck,
  Eye,
  FileSpreadsheet,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface CatalogDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  user?: any;
}

export default function CatalogDownloadModal({ isOpen, onClose, products, user }: CatalogDownloadModalProps) {
  const isAdmin = user?.role === 'admin';
  // Mode selection: all, custom
  const [filterMode, setFilterMode] = useState<'all' | 'custom'>('all');
  
  // Custom selections
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Catalog Options
  const [includePrices, setIncludePrices] = useState(true);
  const [includeConsumerPrices, setIncludeConsumerPrices] = useState(true);
  const [includeMargins, setIncludeMargins] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeCartonDetails, setIncludeCartonDetails] = useState(true);
  const [catalogTitle, setCatalogTitle] = useState("کاتالوگ و لیست قیمت رسمی بازرگانی دست اول");
  const [sortBy, setSortBy] = useState<'category' | 'brand' | 'price-asc' | 'price-desc'>('category');
  
  const [popupError, setPopupError] = useState(false);

  // ParsPack PDF Catalog Upload State
  const [catalogPdfUrl, setCatalogPdfUrl] = useState<string>("http://c102393.parspack.net/c102393/catalogs/dastavval-catalog.pdf");
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch latest config on mount
  useEffect(() => {
    fetch(getApiUrl("/api/admin/b2b-config"))
      .then(res => res.json())
      .then(data => {
        if (data && data.catalogPdfUrl) {
          setCatalogPdfUrl(data.catalogPdfUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf')) {
      setUploadMsg({ type: 'error', text: 'لطفاً فقط فایل PDF انتخاب نمایید.' });
      return;
    }

    setIsUploadingPdf(true);
    setUploadMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const base64Data = evt.target?.result as string;
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
            setCatalogPdfUrl(data.url);
            setUploadMsg({ type: 'success', text: `فایل ${file.name} با موفقیت در باکت پارس‌پک آپلود شد!` });
          } else {
            setUploadMsg({ type: 'error', text: "خطا در آپلود: " + (data.error || "خطای نا مشخص") });
          }
        } catch (err: any) {
          setUploadMsg({ type: 'error', text: "خطا در برقراری ارتباط با باکت: " + err.message });
        } finally {
          setIsUploadingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadMsg({ type: 'error', text: "خطا در خواندن فایل: " + err.message });
      setIsUploadingPdf(false);
    }
  };

  // Extract all unique categories and brands from available products
  const allCategories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
  }, [products]);

  const allBrands = useMemo(() => {
    return Array.from(new Set(products.map(p => p.brand).filter(Boolean))).filter(b => !isWarehouseBrand(b)) as string[];
  }, [products]);

  // Handle Category Toggles
  const handleToggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(prev => prev.filter(c => c !== cat));
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === allCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([...allCategories]);
    }
  };

  // Handle Brand Toggles
  const handleToggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(prev => prev.filter(b => b !== brand));
    } else {
      setSelectedBrands(prev => [...prev, brand]);
    }
  };

  const handleSelectAllBrands = () => {
    if (selectedBrands.length === allBrands.length) {
      setSelectedBrands([]);
    } else {
      setSelectedBrands([...allBrands]);
    }
  };

  // Filtered Products computation
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => !p.disabled);

    if (filterMode === 'custom') {
      if (selectedCategories.length > 0) {
        result = result.filter(p => selectedCategories.includes(p.category));
      }
      if (selectedBrands.length > 0) {
        result = result.filter(p => selectedBrands.includes(p.brand));
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'price-asc') return (a.bulk_price || 0) - (b.bulk_price || 0);
      if (sortBy === 'price-desc') return (b.bulk_price || 0) - (a.bulk_price || 0);
      if (sortBy === 'brand') return (a.brand || '').localeCompare(b.brand || '', 'fa');
      return (a.category || '').localeCompare(b.category || '', 'fa');
    });
  }, [products, filterMode, selectedCategories, selectedBrands, searchQuery, sortBy]);

  if (!isOpen) return null;

  const handlePrint = () => {
    setPopupError(false);
    
    // Create a hidden iframe for printing to bypass window.open popup block
    let printIframe = document.getElementById("print-iframe") as HTMLIFrameElement;
    if (!printIframe) {
      printIframe = document.createElement("iframe");
      printIframe.id = "print-iframe";
      printIframe.style.position = "fixed";
      printIframe.style.right = "0";
      printIframe.style.bottom = "0";
      printIframe.style.width = "0";
      printIframe.style.height = "0";
      printIframe.style.border = "none";
      document.body.appendChild(printIframe);
    }

    const persianDate = new Date().toLocaleDateString('fa-IR');
    
    // Group criteria descriptions
    const activeFiltersDesc = [];
    if (filterMode === 'custom') {
      if (selectedCategories.length > 0) {
        activeFiltersDesc.push(`دسته‌بندی‌ها: ${selectedCategories.join('، ')}`);
      }
      if (selectedBrands.length > 0) {
        activeFiltersDesc.push(`برندها: ${selectedBrands.join('، ')}`);
      }
    }
    if (activeFiltersDesc.length === 0) {
      activeFiltersDesc.push("شامل کلیه دسته‌بندی‌ها و کارخانجات تراز اول");
    }

    const productRows = filteredProducts.map((p, idx) => {
      const margin = (((p.consumer_price || p.bulk_price * 1.5) - p.bulk_price) / p.bulk_price * 100).toFixed(1);
      const imgUrl = p.image_url || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=200";

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-family: Tahoma, Vazirmatn, sans-serif; font-size: 11px; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 10px 8px; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
          <td style="padding: 10px 8px; font-weight: bold; color: #0f172a;">
            <div style="display: flex; align-items: center; gap: 10px;">
              ${includeImages ? `<img src="${imgUrl}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; flex-shrink: 0;" />` : ''}
              <div>
                <div style="font-size: 11px; color: #047857; font-weight: 800; display: flex; align-items: center; gap: 4px;">
                  <span>${p.brand || 'کارخانه'}</span>
                  ${p.category ? `<span style="font-size: 9px; color: #64748b; font-weight: normal; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${p.category}</span>` : ''}
                </div>
                <div style="font-size: 12px; margin-top: 3px; color: #0f172a; font-weight: 800;">${p.name}</div>
                <div style="font-size: 9px; color: #94a3b8; margin-top: 2px;">کد کالا: DAST-${p.id.slice(0,6)}</div>
              </div>
            </div>
          </td>
          ${includeCartonDetails ? `
            <td style="padding: 10px 8px; text-align: center; color: #334155; font-weight: bold;">
              <div>${p.carton_pack_count} ${p.unit || 'عدد'}</div>
              <div style="font-size: 9px; color: #64748b;">حداقل سفارش: ${Math.max(5, p.min_order_cartons || 5)} کارتن</div>
            </td>
          ` : ""}
          ${includePrices ? `
            <td style="padding: 10px 8px; font-weight: 800; font-size: 12px; text-align: right; color: #047857;">${p.bulk_price.toLocaleString()} تومان</td>
          ` : ""}
          ${includeConsumerPrices ? `
            <td style="padding: 10px 8px; font-size: 11px; text-align: right; color: #64748b;">${(p.consumer_price || Math.round(p.bulk_price * 1.3)).toLocaleString()} تومان</td>
          ` : ""}
          ${includeMargins ? `
            <td style="padding: 10px 8px; text-align: center; font-weight: 800; color: #059669; background: #ecfdf5; border-radius: 6px;">٪${margin}</td>
          ` : ""}
          <td style="padding: 10px 8px; color: #475569; font-size: 10px;">${p.pack_description || p.shipping_origin || "تحویل درب انبار اصلی کارخانه"}</td>
        </tr>
      `;
    }).join("");

    const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (!iframeDoc) {
      setPopupError(true);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <html dir="rtl">
        <head>
          <title>${catalogTitle} - بازرگانی دست اول</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 1.2cm;
            }
            @media print {
              body { margin: 0; }
              .no-break { page-break-inside: avoid; }
            }
            body {
              font-family: Tahoma, Vazirmatn, system-ui, sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              padding: 10px;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              border-bottom: 3px solid #047857;
              padding-bottom: 15px;
            }
            .title {
              font-size: 20px;
              font-weight: 900;
              color: #047857;
              margin: 0;
            }
            .subtitle {
              font-size: 11px;
              color: #64748b;
              margin-top: 5px;
            }
            .info-box {
              border: 1px solid #e2e8f0;
              padding: 10px 14px;
              background-color: #f8fafc;
              font-size: 11px;
              border-radius: 8px;
              text-align: right;
            }
            .filter-badge-box {
              margin-bottom: 15px;
              background: #f0fdf4;
              border: 1px dashed #86efac;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 10px;
              color: #166534;
            }
            .product-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .product-table th {
              background-color: #047857;
              color: #ffffff;
              padding: 10px 8px;
              font-size: 11px;
              font-weight: bold;
              text-align: right;
            }
            .product-table th.center {
              text-align: center;
            }
            .footer {
              margin-top: 35px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px dashed #cbd5e1;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="text-align: right; vertical-align: middle;">
                <h1 class="title">${catalogTitle}</h1>
                <div class="subtitle">کاتالوگ سفارشی قیمت همکاری محصولات مستقیم از درب کارخانجات کشور</div>
              </td>
              <td style="text-align: left; vertical-align: middle; width: 260px;">
                <div class="info-box">
                  <div style="margin-bottom: 4px;"><strong>تاریخ صدور:</strong> ${persianDate}</div>
                  <div style="margin-bottom: 4px;"><strong>تعداد اقلام انتخابی:</strong> ${filteredProducts.length} ردیف کالا</div>
                  <div><strong>مرجع توزیع:</strong> پایگاه کشوری دست اول (انبار شبستر)</div>
                </div>
              </td>
            </tr>
          </table>

          <div class="filter-badge-box">
            <strong>🔎 دامنه اقلام کاتالوگ:</strong> ${activeFiltersDesc.join(' | ')}
          </div>

          <table class="product-table">
            <thead>
              <tr>
                <th class="center" style="width: 30px;">#</th>
                <th>نام برند و کالا</th>
                ${includeCartonDetails ? `<th class="center" style="width: 100px;">بسته‌بندی و کارتن</th>` : ""}
                ${includePrices ? `<th style="width: 120px; text-align: right;">قیمت همکاری (عمده)</th>` : ""}
                ${includeConsumerPrices ? `<th style="width: 110px; text-align: right;">مصرف‌کننده روی جلد</th>` : ""}
                ${includeMargins ? `<th class="center" style="width: 80px;">سود فروشنده</th>` : ""}
                <th>توضیحات و ارسال</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <div style="margin-top: 25px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; font-size: 10.5px; line-height: 1.6; color: #334155;" class="no-break">
            <strong>⚠️ ضوابط و شرایط خرید بازرگانی:</strong> ثبت سفارشات کاتالوگ فوق منحصراً از طریق وب‌سایت یا اپلیکیشن تجاری "دست اول" (Dastavval.com) صورت می‌گیرد. نرخ‌های همکاری قید شده پلمپ بوده و کلیه بارها شامل تضمین سلامت بار، اصالت برند و پشتیبانی ترابری کشوری می‌باشند.
          </div>

          <div class="footer">
            این کاتالوگ تجاری سفارشی به طور خودکار از پرتال بازرگانی دست اول (Dastavval.com) صادر گردیده است. | تلفن پشتیبانی و سفارشات: ۰۹۰۴۴۵۰۲۹۰۰
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();

    // Trigger printing
    setTimeout(() => {
      if (printIframe.contentWindow) {
        printIframe.contentWindow.focus();
        printIframe.contentWindow.print();
      } else {
        setPopupError(true);
      }
    }, 500);
  };

  const handleDownloadCSV = () => {
    // Generate CSV content with UTF-8 BOM so Excel opens Persian characters correctly
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "ردیف,نام کالا,برند,دسته بندی,تعداد در کارتن,واحد,حداقل کارتن,قیمت عمده (تومان),قیمت مصرف کننده (تومان),حاشیه سود خالص,مبدا ارسال,توضیحات\n";
    
    filteredProducts.forEach((p, idx) => {
      const margin = (((p.consumer_price || p.bulk_price * 1.5) - p.bulk_price) / p.bulk_price * 100).toFixed(1);
      const row = [
        idx + 1,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.brand || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        p.carton_pack_count || 1,
        `"${(p.unit || 'عدد').replace(/"/g, '""')}"`,
        Math.max(5, p.min_order_cartons || 5),
        p.bulk_price || 0,
        p.consumer_price || Math.round(p.bulk_price * 1.3),
        `${margin}%`,
        `"${(p.shipping_origin || "ارسال مستقیم").replace(/"/g, '""')}"`,
        `"${(p.pack_description || "").replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const brandSuffix = selectedBrands.length === 1 ? `_${selectedBrands[0]}` : '';
    const catSuffix = selectedCategories.length === 1 ? `_${selectedCategories[0]}` : '';
    link.setAttribute("download", `dastavval_custom_catalog${brandSuffix}${catSuffix}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-400/50 backdrop-blur-sm z-[120] flex items-center justify-center p-3 sm:p-4 text-right" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white rounded-3xl border border-slate-200/80 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Printer size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">تولید کاتالوگ اختصاصی و بروشور قیمت</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                  سفارشی‌ساز هوشمند
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                تولید خروجی PDF و اکسل تفکیک‌شده بر اساس دسته‌بندی‌ها و کارخانجات منتخب
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings and Customization Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* Step 1: Filter Mode (All vs Custom Selected) */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Layers size={15} className="text-emerald-600" />
              <span>دامنه تولید کاتالوگ:</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('all');
                  setSelectedCategories([]);
                  setSelectedBrands([]);
                }}
                className={`p-3.5 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                  filterMode === 'all'
                    ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-black shadow-xs"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${filterMode === 'all' ? 'border-emerald-600' : 'border-slate-300'}`}>
                  {filterMode === 'all' && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}
                </div>
                <div>
                  <div className="text-xs font-black">کاتالوگ جامع و سراسری</div>
                  <div className="text-[10px] text-slate-500 font-medium">شامل تمام محصولات فعال ({products.length} کالا)</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('custom')}
                className={`p-3.5 rounded-2xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                  filterMode === 'custom'
                    ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-black shadow-xs"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${filterMode === 'custom' ? 'border-emerald-600' : 'border-slate-300'}`}>
                  {filterMode === 'custom' && <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full" />}
                </div>
                <div>
                  <div className="text-xs font-black">کاتالوگ سفارشی و فیلترشده</div>
                  <div className="text-[10px] text-slate-500 font-medium">انتخاب دسته‌ها یا کارخانجات خاص</div>
                </div>
              </button>
            </div>
          </div>

          {/* Conditional: Category & Brand Pickers when Custom Mode */}
          {filterMode === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-5 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/90"
            >
              {/* Category Multi-select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Tag size={14} className="text-emerald-600" />
                    <span>انتخاب دسته‌بندی‌های مورد نظر:</span>
                    {selectedCategories.length > 0 && (
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                        {selectedCategories.length} دسته انتخاب شده
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    {selectedCategories.length === allCategories.length ? "لغو انتخاب همه" : "انتخاب همه دسته‌ها"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                  {allCategories.map((cat, idx) => {
                    const isSelected = selectedCategories.includes(cat);
                    const count = products.filter(p => p.category === cat).length;
                    return (
                      <button
                        key={`cat-dl-modal-${cat}-${idx}`}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all border flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{cat}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded ${isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200/80 text-slate-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Multi-select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Building2 size={14} className="text-indigo-600" />
                    <span>انتخاب برندها و کارخانجات مورد نظر:</span>
                    {selectedBrands.length > 0 && (
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded-md">
                        {selectedBrands.length} برند انتخاب شده
                      </span>
                    )}
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllBrands}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    {selectedBrands.length === allBrands.length ? "لغو انتخاب همه" : "انتخاب همه کارخانه‌ها"}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                  {allBrands.map((brand, idx) => {
                    const isSelected = selectedBrands.includes(brand);
                    const count = products.filter(p => p.brand === brand).length;
                    return (
                      <button
                        key={`brand-dl-modal-${brand}-${idx}`}
                        type="button"
                        onClick={() => handleToggleBrand(brand)}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all border flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        {isSelected && <Check size={12} />}
                        <span>{brand}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200/80 text-slate-500'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Search & Sort Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black text-slate-600 mb-1">جستجوی سریع درون کاتالوگ:</label>
              <div className="relative">
                <Search size={14} className="absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی نام کالا، برند یا کد..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  dir="rtl"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-600 mb-1">مرتب‌سازی اقلام در کاتالوگ:</label>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="category">بر اساس دسته‌بندی کالاها</option>
                <option value="brand">بر اساس نام کارخانه و برند</option>
                <option value="price-asc">قیمت عمده: از ارزان به گران</option>
                <option value="price-desc">قیمت عمده: از گران به ارزان</option>
              </select>
            </div>
          </div>

          {/* Print & Presentation Columns Configuration */}
          <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100/60 space-y-3">
            <h4 className="font-black text-xs text-emerald-900 flex items-center gap-1.5">
              <SlidersHorizontal size={14} className="text-emerald-700" />
              <span>ستون‌ها و گزینه‌های نمایش در بروشور/PDF:</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-emerald-100/60 hover:bg-emerald-50/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={includePrices} 
                  onChange={e => setIncludePrices(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <span>درج قیمت عمده و همکاری کارخانه</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-emerald-100/60 hover:bg-emerald-50/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={includeConsumerPrices} 
                  onChange={e => setIncludeConsumerPrices(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <span>درج قیمت مصرف‌کننده روی جلد</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-emerald-100/60 hover:bg-emerald-50/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={includeMargins} 
                  onChange={e => setIncludeMargins(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <span>نمایش حاشیه سود تخمینی فروشنده (%)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none bg-white p-2.5 rounded-xl border border-emerald-100/60 hover:bg-emerald-50/50 transition-colors">
                <input 
                  type="checkbox" 
                  checked={includeImages} 
                  onChange={e => setIncludeImages(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                />
                <span>نمایش تصویر رسمی کالا در ردیف‌ها</span>
              </label>
            </div>
          </div>

          {/* Catalog Live Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <PackageCheck size={14} className="text-emerald-600" />
                <span>پیش‌نمایش اقلام موجود در این کاتالوگ سفارشی ({filteredProducts.length} کالا):</span>
              </label>
              <span className="text-[10px] text-slate-500 font-bold">
                {filteredProducts.length === 0 ? "هیچ کالایی مطابق با فیلترها نیست" : "آماده صدور و چاپ"}
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs font-bold text-slate-700 bg-slate-50/50">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  هیچ محصولی با معیارهای انتخاب شده منطبق نیست. لطفاً دسته‌ها یا برندها را بازبینی کنید.
                </div>
              ) : (
                filteredProducts.map((p, i) => (
                  <div key={`cat-dl-prod-${p.id || i}-${i}`} className="p-2.5 sm:p-3 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="text-slate-400 font-mono text-[10px] w-5 text-center">#{i+1}</span>
                      {includeImages && (
                        <img 
                          src={p.image_url || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=100"} 
                          alt={p.name}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-700 font-black text-[11px]">[{p.brand}]</span>
                          <span className="text-slate-900 font-black text-xs">{p.name}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          دسته‌بندی: {p.category || 'صنایع غذایی'} | حداقل: {Math.max(5, p.min_order_cartons || 5)} کارتن
                        </div>
                      </div>
                    </div>

                    <div className="text-left font-mono">
                      {includePrices && (
                        <span className="text-xs font-black text-emerald-700">
                          {p.bulk_price.toLocaleString()} ت
                        </span>
                      )}
                      <span className="block text-[9px] text-slate-400 font-sans">
                        {p.carton_pack_count} {p.unit || 'عدد'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-3">
          {popupError && (
            <div className="p-3 text-[11px] text-amber-800 bg-amber-50 rounded-xl border border-amber-200/60 font-black text-center animate-fade-in mb-1">
              ⚠ چاپ از طریق پنجره پرینت درون‌برنامه‌ای آغاز شد. در صورت عدم نمایش، دکمه دانلود مستقیم اکسل را امتحان کنید.
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              disabled={filteredProducts.length === 0}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer size={16} />
              <span>چاپ کاتالوگ سفارشی / خروجی PDF ({filteredProducts.length} کالا)</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={filteredProducts.length === 0}
              className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <FileSpreadsheet size={16} />
              <span>دانلود فایل اکسل سفارشی (CSV)</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer"
            >
              انصراف
            </button>
          </div>

          {/* PARSPACK S3 PDF CATALOG DOWNLOAD & ADMIN UPLOAD BOX */}
          <div className="mt-2 pt-4 border-t border-slate-200/80 bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    {isAdmin ? "دانلود و مدیریت فایل کاتالوگ PDF رسمی در باکت پارس‌پک" : "دانلود فایل رسمی کاتالوگ جامع (نسخه کامل PDF)"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isAdmin 
                      ? "فایل کاتالوگ ذخیره‌شده روی سرور ابری پارس‌پک (`c102393.parspack.net`)" 
                      : "دریافت آخرین نسخه تایید شده کاتالوگ و لیست قیمت جامع کارخانجات"}
                  </p>
                </div>
              </div>

              {catalogPdfUrl && (
                <a
                  href={catalogPdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all inline-flex items-center gap-1.5 shrink-0 shadow-md shadow-indigo-600/20"
                >
                  <Download size={14} className="text-amber-400" />
                  <span>دانلود فایل کاتالوگ PDF</span>
                </a>
              )}
            </div>

            {/* Upload Zone - ADMIN ONLY */}
            {isAdmin && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[10px] font-black text-indigo-700 flex items-center gap-1">
                  <span>🔒 بخش مدیریت: جایگزینی و آپلود فایل PDF جدید کاتالوگ</span>
                </div>
                <div className="relative border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-xl p-3 text-center transition-all cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    disabled={isUploadingPdf}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-700">
                    {isUploadingPdf ? <RefreshCw size={16} className="animate-spin text-emerald-600" /> : <CloudUpload size={16} className="text-emerald-600" />}
                    <span>
                      {isUploadingPdf ? "در حال ارسال فایل PDF به باکت پارس‌پک..." : "برای آپلود کاتالوگ PDF جدید کلیک کنید (مخصوص ادمین)"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && uploadMsg && (
              <div className={`p-2.5 rounded-xl text-xs font-black flex items-center gap-2 ${
                uploadMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {uploadMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{uploadMsg.text}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
