import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { getApiUrl, isWarehouseBrand } from "../utils/api-utils";
import { getDisplayImageUrl, getRealImageDirectUrl, getProductFallbackSvg } from "../lib/image-utils";
import { 
  X, 
  Printer, 
  FileText, 
  Download, 
  ShieldCheck, 
  SlidersHorizontal, 
  Building2, 
  Tag, 
  Check, 
  Layers, 
  Sparkles,
  Search,
  PackageCheck,
  Eye,
  FileSpreadsheet,
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2,
  LayoutGrid,
  TableProperties,
  Sliders,
  Copy,
  BookOpen,
  QrCode,
  PhoneCall,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  ArrowDownToLine,
  Percent
} from "lucide-react";

interface CatalogDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  user?: any;
  initialMarkup?: number | null;
  autoPrint?: boolean;
}

export default function CatalogDownloadModal({ isOpen, onClose, products, user, initialMarkup, autoPrint }: CatalogDownloadModalProps) {
  const isAdmin = user?.role === 'admin';
  
  // Navigation tabs inside modal: 'settings' | 'preview' | 'downloads'
  const [activeTab, setActiveTab] = useState<'settings' | 'preview' | 'downloads'>('settings');

  // Mode selection: all, custom
  const [filterMode, setFilterMode] = useState<'all' | 'custom'>('all');
  
  // Layout style: 'cards' (Material 3 Cards) | 'table' (Official Price Matrix) | 'magazine' (Luxury Editorial Magazine)
  const [catalogLayout, setCatalogLayout] = useState<'cards' | 'table' | 'magazine'>('cards');

  // Custom selections
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Representative / Custom info
  const [catalogTitle, setCatalogTitle] = useState("کاتالوگ و لیست قیمت رسمی بازرگانی دست اول");
  const [distributorName, setDistributorName] = useState(user?.businessName || user?.name || "مرکز توزیع کشوری دست اول (تبریز)");
  const [distributorPhone, setDistributorPhone] = useState(user?.phone || "۰۹۰۴۴۵۰۲۹۰۰");
  const [customMarkupPercent, setCustomMarkupPercent] = useState<number>(0);
  
  // Catalog Options
  const [includePrices, setIncludePrices] = useState(true);
  const [includeConsumerPrices, setIncludeConsumerPrices] = useState(true);
  const [includeMargins, setIncludeMargins] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeCartonDetails, setIncludeCartonDetails] = useState(true);
  const [includeBarcodes, setIncludeBarcodes] = useState(true);
  const [sortBy, setSortBy] = useState<'category' | 'brand' | 'price-asc' | 'price-desc'>('category');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [popupError, setPopupError] = useState(false);

  // ParsPack PDF Catalog Upload / Download State
  const [catalogPdfUrl, setCatalogPdfUrl] = useState<string>("https://c102393.parspack.net/c102393/catalogs/dastavval-catalog.pdf");
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDownloadingCloudPdf, setIsDownloadingCloudPdf] = useState(false);

  // Helper Persian number conversion
  const toPersianDigits = (n: number | string | undefined | null): string => {
    if (n === undefined || n === null) return "";
    const pDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return n.toString().replace(/[0-9]/g, (d) => pDigits[parseInt(d, 10)]);
  };

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

  // Handle auto-initialization from props
  useEffect(() => {
    if (isOpen) {
      if (typeof initialMarkup === 'number') {
        setCustomMarkupPercent(initialMarkup);
      }
      if (autoPrint) {
        const timer = setTimeout(() => {
          handlePrint();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, initialMarkup, autoPrint]);

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
      const priceA = (a.bulk_price || a.price || 0);
      const priceB = (b.bulk_price || b.price || 0);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'brand') return (a.brand || '').localeCompare(b.brand || '', 'fa');
      return (a.category || '').localeCompare(b.category || '', 'fa');
    });
  }, [products, filterMode, selectedCategories, selectedBrands, searchQuery, sortBy]);

  if (!isOpen) return null;

  // Build complete HTML for Printing, Magazine Brochure, or Standalone File Download
  const generateFullCatalogHtml = (forStandaloneDownload = false) => {
    const persianDate = new Date().toLocaleDateString('fa-IR');
    const multiplier = 1 + (customMarkupPercent / 100);

    const activeFiltersDesc: string[] = [];
    if (filterMode === 'custom') {
      if (selectedCategories.length > 0) {
        activeFiltersDesc.push(`دسته‌بندی‌ها: ${selectedCategories.join('، ')}`);
      }
      if (selectedBrands.length > 0) {
        activeFiltersDesc.push(`کارخانجات: ${selectedBrands.join('، ')}`);
      }
    }
    if (activeFiltersDesc.length === 0) {
      activeFiltersDesc.push("شامل تمام محصولات فعال و کارخانجات معتبر کشور");
    }

    let itemsContent = "";

    if (catalogLayout === 'cards') {
      // 1. MATERIAL 3 CARDS LAYOUT
      const cardsHtml = filteredProducts.map((p, idx) => {
        const baseBulkPrice = Math.round((p.bulk_price || p.price || 0) * multiplier);
        const consumerPrice = p.consumer_price || p.consumerPrice || Math.round(baseBulkPrice * 1.4);
        const margin = consumerPrice > baseBulkPrice ? (((consumerPrice - baseBulkPrice) / baseBulkPrice) * 100).toFixed(0) : "0";
        
        const rawImg = p.image_url || p.imageUrl || "";
        const directUrl = getRealImageDirectUrl(rawImg);
        const proxiedUrl = getDisplayImageUrl(rawImg, p.name, p.brand);
        const fallbackSvg = getProductFallbackSvg(p.name, p.brand);
        
        const primaryImgUrl = forStandaloneDownload ? (directUrl || proxiedUrl || fallbackSvg) : (proxiedUrl || directUrl || fallbackSvg);
        const barcodeText = p.barcode || `626${String(p.id).padStart(8, '0')}`;
        const cartonUnits = p.carton_pack_count || p.itemsPerUnit || 1;
        const cartonPrice = baseBulkPrice * cartonUnits;
        const minCartons = Math.max(1, p.min_order_cartons || p.minOrderCartons || 1);

        return `
          <div class="product-card">
            <div class="card-image-wrap">
              <img 
                src="${primaryImgUrl}" 
                alt="${p.name}" 
                class="product-img" 
                onerror="this.onerror=null; this.src='${fallbackSvg}';" 
                loading="lazy"
              />
              <div class="brand-badge">${p.brand || 'کارخانه'}</div>
              ${includeMargins && Number(margin) > 0 ? `<div class="margin-badge">٪${toPersianDigits(margin)} سود</div>` : ''}
            </div>
            <div class="card-body">
              <h3 class="product-title">${p.name}</h3>
              <div class="product-meta">
                <span>دسته‌بندی: ${p.category || 'عمومی'}</span>
                ${includeBarcodes ? `<span>کد: ${p.sku || 'PRD-' + (p.id || idx + 1)}</span>` : ''}
              </div>

              ${includeCartonDetails ? `
                <div class="specs-box">
                  <div class="spec-item">
                    <span class="spec-label">بسته‌بندی در کارتن:</span>
                    <span class="spec-value font-bold">${toPersianDigits(cartonUnits)} ${p.unit || 'عدد'}</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">حداقل سفارش:</span>
                    <span class="spec-value">${toPersianDigits(minCartons)} کارتن</span>
                  </div>
                </div>
              ` : ''}

              <div class="price-container">
                ${includePrices ? `
                  <div class="price-row wholesale">
                    <span class="p-label">قیمت هر واحد (عمده):</span>
                    <span class="p-val font-bold">${toPersianDigits(baseBulkPrice.toLocaleString())} <small>تومان</small></span>
                  </div>
                  <div class="price-row carton-total">
                    <span class="p-label">قیمت کل کارتن:</span>
                    <span class="p-val">${toPersianDigits(cartonPrice.toLocaleString())} <small>تومان</small></span>
                  </div>
                ` : ''}
                ${includeConsumerPrices ? `
                  <div class="price-row consumer">
                    <span class="p-label">مصرف‌کننده روی جلد:</span>
                    <span class="p-val strike">${toPersianDigits(consumerPrice.toLocaleString())} <small>تومان</small></span>
                  </div>
                ` : ''}
              </div>

              ${includeBarcodes ? `
                <div class="barcode-footer">
                  <span class="barcode-num">بارکد: ${barcodeText}</span>
                  <span class="origin-tag">${p.location || 'ارسال از انبار مرکزی'}</span>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join("");

      itemsContent = `<div class="cards-grid">${cardsHtml}</div>`;
    } else if (catalogLayout === 'magazine') {
      // 2. LUXURY EDITORIAL MAGAZINE WITH COVER & FEATURED TILES
      const magazineCover = `
        <div class="magazine-cover-page">
          <div class="magazine-header-badge">بازرگانی و پخش سراسری صنایع غذایی دست اول</div>
          <div class="magazine-hero-title">${catalogTitle}</div>
          <p class="magazine-hero-sub">لیست قیمت مرجع مستقیم از خطوط تولید کارخانجات، تخفیفات ویژه نقدی و شرایط تسویه اعتباری</p>
          
          <div class="magazine-meta-grid">
            <div class="magazine-meta-item">
              <span class="label">مرکز صدور و عاملیت:</span>
              <span class="val">${distributorName}</span>
            </div>
            <div class="magazine-meta-item">
              <span class="label">شماره هماهنگی و سفارشات:</span>
              <span class="val">${distributorPhone}</span>
            </div>
            <div class="magazine-meta-item">
              <span class="label">تاریخ صدور و اعتبار:</span>
              <span class="val">${persianDate}</span>
            </div>
            <div class="magazine-meta-item">
              <span class="label">تعداد کل اقلام فعال:</span>
              <span class="val">${toPersianDigits(filteredProducts.length)} محصول</span>
            </div>
          </div>

          <div class="magazine-security-note">
            🛡️ تمامی قیمت‌های این کاتالوگ با ضمانت پایین‌ترین نرخ مستقیم کارخانه ارائه می‌گردند و بارنامه رسمی ارسال از انبار مرکزی صادر خواهد شد.
          </div>
        </div>
        <div class="page-break"></div>
      `;

      const cardsHtml = filteredProducts.map((p, idx) => {
        const baseBulkPrice = Math.round((p.bulk_price || p.price || 0) * multiplier);
        const consumerPrice = p.consumer_price || p.consumerPrice || Math.round(baseBulkPrice * 1.4);
        const margin = consumerPrice > baseBulkPrice ? (((consumerPrice - baseBulkPrice) / baseBulkPrice) * 100).toFixed(0) : "0";
        
        const rawImg = p.image_url || p.imageUrl || "";
        const directUrl = getRealImageDirectUrl(rawImg);
        const proxiedUrl = getDisplayImageUrl(rawImg, p.name, p.brand);
        const fallbackSvg = getProductFallbackSvg(p.name, p.brand);
        const primaryImgUrl = forStandaloneDownload ? (directUrl || proxiedUrl || fallbackSvg) : (proxiedUrl || directUrl || fallbackSvg);
        const cartonUnits = p.carton_pack_count || p.itemsPerUnit || 1;
        const cartonPrice = baseBulkPrice * cartonUnits;
        const minCartons = Math.max(1, p.min_order_cartons || p.minOrderCartons || 1);

        return `
          <div class="magazine-item-card">
            <div class="magazine-thumb-box">
              <img src="${primaryImgUrl}" alt="${p.name}" class="magazine-img" onerror="this.onerror=null; this.src='${fallbackSvg}';" loading="lazy" />
              <span class="mag-badge">${p.brand || 'کارخانه'}</span>
            </div>
            <div class="magazine-item-info">
              <div class="mag-cat-tag">${p.category || 'مواد غذایی'}</div>
              <h4 class="mag-title">${p.name}</h4>
              <div class="mag-specs-line">
                <span>📦 ${toPersianDigits(cartonUnits)} عددی در هر کارتن</span>
                <span>⚡ حداقل: ${toPersianDigits(minCartons)} کارتن</span>
              </div>
              <div class="mag-price-box">
                <div class="mag-bulk-price">
                  <span class="lbl">قیمت عمده:</span>
                  <span class="num">${toPersianDigits(baseBulkPrice.toLocaleString())} تومان</span>
                </div>
                <div class="mag-carton-price">
                  <span class="lbl">قیمت کارتن:</span>
                  <span class="num">${toPersianDigits(cartonPrice.toLocaleString())} تومان</span>
                </div>
                ${includeConsumerPrices ? `
                  <div class="mag-consumer-price">
                    <span class="lbl">مصرف‌کننده:</span>
                    <span class="num strike">${toPersianDigits(consumerPrice.toLocaleString())} تومان</span>
                    ${includeMargins && Number(margin) > 0 ? `<span class="mag-margin-pill">٪${toPersianDigits(margin)} سود</span>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join("");

      itemsContent = magazineCover + `<div class="magazine-grid">${cardsHtml}</div>`;
    } else {
      // 3. OFFICIAL TABLE MATRIX LAYOUT
      const tableRows = filteredProducts.map((p, idx) => {
        const baseBulkPrice = Math.round((p.bulk_price || p.price || 0) * multiplier);
        const consumerPrice = p.consumer_price || p.consumerPrice || Math.round(baseBulkPrice * 1.4);
        const margin = consumerPrice > baseBulkPrice ? (((consumerPrice - baseBulkPrice) / baseBulkPrice) * 100).toFixed(0) : "0";
        
        const rawImg = p.image_url || p.imageUrl || "";
        const directUrl = getRealImageDirectUrl(rawImg);
        const proxiedUrl = getDisplayImageUrl(rawImg, p.name, p.brand);
        const fallbackSvg = getProductFallbackSvg(p.name, p.brand);
        const primaryImgUrl = forStandaloneDownload ? (directUrl || proxiedUrl || fallbackSvg) : (proxiedUrl || directUrl || fallbackSvg);

        const cartonUnits = p.carton_pack_count || p.itemsPerUnit || 1;
        const cartonPrice = baseBulkPrice * cartonUnits;
        const minCartons = Math.max(1, p.min_order_cartons || p.minOrderCartons || 1);

        return `
          <tr class="table-row">
            <td class="td-num">${toPersianDigits(idx + 1)}</td>
            <td class="td-product">
              <div class="td-prod-flex">
                ${includeImages ? `<img src="${primaryImgUrl}" class="td-thumb" onerror="this.onerror=null; this.src='${fallbackSvg}';" loading="lazy" />` : ''}
                <div>
                  <div class="td-brand-line">
                    <span class="brand-text">${p.brand || 'کارخانه'}</span>
                    <span class="cat-pill">${p.category || 'مواد غذایی'}</span>
                  </div>
                  <div class="prod-name-text">${p.name}</div>
                  <div class="code-sub">کد: ${p.sku || 'DAST-' + (p.id || idx + 1)} ${p.barcode ? `| بارکد: ${p.barcode}` : ''}</div>
                </div>
              </div>
            </td>
            ${includeCartonDetails ? `
              <td class="td-pack">
                <div class="pack-bold">${toPersianDigits(cartonUnits)} ${p.unit || 'عدد'}</div>
                <div class="moq-sub">حداقل: ${toPersianDigits(minCartons)} کارتن</div>
              </td>
            ` : ''}
            ${includePrices ? `
              <td class="td-price-unit">
                <div class="price-main">${toPersianDigits(baseBulkPrice.toLocaleString())} ت</div>
                <div class="carton-sub">کارتن: ${toPersianDigits(cartonPrice.toLocaleString())} ت</div>
              </td>
            ` : ''}
            ${includeConsumerPrices ? `
              <td class="td-price-consumer">${toPersianDigits(consumerPrice.toLocaleString())} ت</td>
            ` : ''}
            ${includeMargins ? `
              <td class="td-margin"><span class="margin-pill">٪${toPersianDigits(margin)}</span></td>
            ` : ''}
            <td class="td-location">${p.location || 'ارسال از انبار مرکزی تبریز'}</td>
          </tr>
        `;
      }).join("");

      itemsContent = `
        <table class="editorial-table">
          <thead>
            <tr>
              <th style="width: 35px; text-align: center;">#</th>
              <th>شرح کالا و برند</th>
              ${includeCartonDetails ? `<th style="width: 95px; text-align: center;">بسته‌بندی</th>` : ''}
              ${includePrices ? `<th style="width: 135px; text-align: right;">قیمت عمده (واحد/کارتن)</th>` : ''}
              ${includeConsumerPrices ? `<th style="width: 105px; text-align: right;">مصرف‌کننده روی جلد</th>` : ''}
              ${includeMargins ? `<th style="width: 75px; text-align: center;">سود فروشگاه</th>` : ''}
              <th style="width: 110px;">محل ارسال / تامین</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      `;
    }

    return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${catalogTitle} - بازرگانی دست اول</title>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Vazirmatn', Tahoma, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding: 20px;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @page {
      size: A4 portrait;
      margin: 10mm 10mm;
    }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .product-card, .table-row, .magazine-item-card {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .page-break {
        page-break-after: always;
        break-after: page;
      }
    }

    .container {
      max-width: 1100px;
      margin: 0 auto;
      background: #ffffff;
      padding: 24px;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }

    /* Standalone action bar */
    .standalone-action-bar {
      background: linear-gradient(135deg, #065f46 0%, #0f172a 100%);
      color: white;
      padding: 14px 20px;
      border-radius: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 12px rgba(6, 95, 70, 0.25);
    }

    .action-btn {
      background: #10b981;
      color: #064e3b;
      border: none;
      padding: 9px 18px;
      border-radius: 12px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 900;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #34d399;
      transform: translateY(-1px);
    }

    /* Header */
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 18px;
      border-bottom: 3px solid #059669;
      margin-bottom: 18px;
    }

    .brand-title-box h1 {
      font-size: 20px;
      font-weight: 900;
      color: #065f46;
      margin-bottom: 4px;
    }

    .brand-title-box p {
      font-size: 11px;
      color: #475569;
      font-weight: 700;
    }

    .header-meta-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 8px 14px;
      font-size: 10.5px;
      color: #166534;
      text-align: right;
      min-width: 260px;
    }

    .header-meta-card div {
      margin-bottom: 3px;
    }

    .header-meta-card div:last-child {
      margin-bottom: 0;
    }

    /* Filter banner */
    .filter-banner {
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      padding: 8px 14px;
      border-radius: 10px;
      font-size: 10.5px;
      color: #334155;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }

    @media (max-width: 900px) {
      .cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .product-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
      position: relative;
    }

    .card-image-wrap {
      position: relative;
      width: 100%;
      height: 150px;
      background: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .product-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 8px;
    }

    .brand-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(15, 23, 42, 0.85);
      color: #ffffff;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 6px;
      backdrop-filter: blur(4px);
    }

    .margin-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: #059669;
      color: #ffffff;
      font-size: 9px;
      font-weight: 900;
      padding: 2px 8px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(5, 150, 105, 0.3);
    }

    .card-body {
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .product-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.4;
      margin-bottom: 4px;
      min-height: 32px;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748b;
      margin-bottom: 8px;
    }

    .specs-box {
      background: #f8fafc;
      border: 1px solid #f1f5f9;
      border-radius: 8px;
      padding: 5px 8px;
      margin-bottom: 8px;
      font-size: 9.5px;
    }

    .spec-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .spec-item:last-child {
      margin-bottom: 0;
    }

    .spec-label {
      color: #64748b;
    }

    .spec-value {
      color: #0f172a;
      font-weight: 800;
    }

    .price-container {
      margin-top: auto;
      background: #f0fdf4;
      border: 1px solid #dcfce7;
      border-radius: 8px;
      padding: 6px 8px;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2px;
    }

    .price-row:last-child {
      margin-bottom: 0;
    }

    .price-row.wholesale {
      font-size: 11.5px;
      color: #166534;
      font-weight: 900;
    }

    .price-row.carton-total {
      font-size: 9.5px;
      color: #065f46;
    }

    .price-row.consumer .p-label {
      color: #64748b;
      font-size: 9.5px;
    }

    .price-row.consumer .p-val.strike {
      color: #94a3b8;
      text-decoration: line-through;
      font-size: 10px;
    }

    .barcode-footer {
      margin-top: 6px;
      padding-top: 5px;
      border-top: 1px dashed #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 8.5px;
      color: #94a3b8;
    }

    /* Magazine Brochure Styles */
    .magazine-cover-page {
      background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%);
      color: white;
      padding: 40px 30px;
      border-radius: 20px;
      margin-bottom: 30px;
      text-align: center;
      position: relative;
    }

    .magazine-header-badge {
      display: inline-block;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      color: #6ee7b7;
      font-size: 11px;
      font-weight: 900;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 16px;
    }

    .magazine-hero-title {
      font-size: 26px;
      font-weight: 900;
      margin-bottom: 10px;
      color: #ffffff;
    }

    .magazine-hero-sub {
      font-size: 12px;
      color: #cbd5e1;
      max-width: 650px;
      margin: 0 auto 24px auto;
      line-height: 1.6;
    }

    .magazine-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      max-width: 600px;
      margin: 0 auto 20px auto;
      background: rgba(255,255,255,0.06);
      padding: 14px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.1);
      text-align: right;
    }

    .magazine-meta-item .label {
      display: block;
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 2px;
    }

    .magazine-meta-item .val {
      font-size: 12px;
      font-weight: 900;
      color: #ffffff;
    }

    .magazine-security-note {
      font-size: 10.5px;
      color: #a7f3d0;
      background: rgba(16, 185, 129, 0.15);
      padding: 8px 14px;
      border-radius: 8px;
      display: inline-block;
    }

    .magazine-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    .magazine-item-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .magazine-thumb-box {
      width: 100px;
      height: 100px;
      background: #f8fafc;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .magazine-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .mag-badge {
      position: absolute;
      bottom: 4px;
      right: 4px;
      background: #0f172a;
      color: white;
      font-size: 8px;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 4px;
    }

    .magazine-item-info {
      flex: 1;
    }

    .mag-cat-tag {
      font-size: 9px;
      color: #059669;
      font-weight: 800;
      margin-bottom: 2px;
    }

    .mag-title {
      font-size: 12px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .mag-specs-line {
      font-size: 9.5px;
      color: #64748b;
      display: flex;
      gap: 10px;
      margin-bottom: 6px;
    }

    .mag-price-box {
      background: #f0fdf4;
      padding: 6px 8px;
      border-radius: 8px;
      font-size: 10.5px;
    }

    .mag-bulk-price {
      display: flex;
      justify-content: space-between;
      color: #166534;
      font-weight: 900;
    }

    .mag-carton-price {
      display: flex;
      justify-content: space-between;
      color: #047857;
      font-size: 9.5px;
    }

    .mag-consumer-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #64748b;
      font-size: 9px;
      margin-top: 2px;
    }

    .mag-margin-pill {
      background: #059669;
      color: white;
      font-size: 8.5px;
      font-weight: 900;
      padding: 1px 5px;
      border-radius: 4px;
    }

    /* Table Matrix */
    .editorial-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }

    .editorial-table th {
      background: #047857;
      color: #ffffff;
      padding: 8px 6px;
      font-weight: 800;
      text-align: right;
    }

    .table-row {
      border-bottom: 1px solid #e2e8f0;
    }

    .table-row:nth-child(even) {
      background: #f8fafc;
    }

    .editorial-table td {
      padding: 8px 6px;
      vertical-align: middle;
    }

    .td-num {
      text-align: center;
      color: #64748b;
      font-weight: 800;
    }

    .td-prod-flex {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .td-thumb {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      object-fit: contain;
      border: 1px solid #cbd5e1;
      flex-shrink: 0;
      background: #fff;
    }

    .td-brand-line {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 2px;
    }

    .brand-text {
      color: #047857;
      font-weight: 800;
      font-size: 10.5px;
    }

    .cat-pill {
      background: #f1f5f9;
      color: #475569;
      font-size: 8.5px;
      padding: 1px 5px;
      border-radius: 4px;
    }

    .prod-name-text {
      font-size: 11.5px;
      font-weight: 800;
      color: #0f172a;
    }

    .code-sub {
      font-size: 8.5px;
      color: #94a3b8;
    }

    .td-pack {
      text-align: center;
    }

    .pack-bold {
      font-weight: 800;
      color: #0f172a;
    }

    .moq-sub {
      font-size: 8.5px;
      color: #64748b;
    }

    .td-price-unit {
      text-align: right;
    }

    .price-main {
      font-weight: 900;
      color: #166534;
      font-size: 11px;
    }

    .carton-sub {
      font-size: 8.5px;
      color: #059669;
    }

    .td-price-consumer {
      color: #64748b;
      text-decoration: line-through;
      font-size: 10px;
      text-align: right;
    }

    .td-margin {
      text-align: center;
    }

    .margin-pill {
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #a7f3d0;
      font-size: 9.5px;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 6px;
      display: inline-block;
    }

    .td-location {
      font-size: 9.5px;
      color: #475569;
    }

    /* Footer */
    .catalog-footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }

    .terms-box {
      margin-top: 18px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 9.5px;
      color: #334155;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    ${forStandaloneDownload ? `
      <div class="standalone-action-bar no-print">
        <div>
          <h2 style="font-size: 15px; font-weight: 900;">📄 کاتالوگ و بروشور چندرسانه‌ای بازرگانی دست اول</h2>
          <p style="font-size: 10.5px; opacity: 0.9;">قابلیت ذخیره آفلاین و چاپ مستقیم برگه استاندارد A4</p>
        </div>
        <button onclick="window.print()" class="action-btn">
          🖨️ چاپ مستقیم / ذخیره PDF
        </button>
      </div>
    ` : ''}

    <div class="header-container">
      <div class="brand-title-box">
        <h1>${catalogTitle}</h1>
        <p>مرجع دست اول توزیع مستقیم محصولات با نرخ مصوب کارخانجات کشور</p>
      </div>
      <div class="header-meta-card">
        <div><strong>مرکز صدور:</strong> ${distributorName}</div>
        <div><strong>شماره هماهنگی و پشتیبانی:</strong> ${distributorPhone}</div>
        <div><strong>تاریخ صدور:</strong> ${persianDate} | <strong>تعداد اقلام:</strong> ${toPersianDigits(filteredProducts.length)} قلم کالا</div>
      </div>
    </div>

    <div class="filter-banner">
      <div><strong>🔎 دامنه اقلام:</strong> ${activeFiltersDesc.join(' | ')}</div>
      ${customMarkupPercent > 0 ? `<div><strong>حاشیه سود سفارشی اعمال شده:</strong> ٪${toPersianDigits(customMarkupPercent)}</div>` : ''}
    </div>

    ${itemsContent}

    <div class="terms-box">
      <strong>⚠️ ضوابط و شرایط سفارش تجاری:</strong> تمامی قیمت‌های مندرج پلمپ درب کارخانه بوده و کالاها مشمول ضمانت سلامت فیزیکی بارنامه رسمی و بارگیری سریع از خطوط تولید می‌باشند. ثبت سفارشات رسمی و درخواست پیش‌فاکتور از طریق سامانه دست اول به نشانی dastavval.com انجام می‌پذیرد.
    </div>

    <div class="catalog-footer">
      <div>تولید شده توسط موتور کاتالوگ‌ساز هوشمند بازرگانی دست اول | Dastavval.com</div>
      <div>پشتیبانی سفارشات عمده: ${distributorPhone}</div>
    </div>
  </div>
</body>
</html>`;
  };

  // Robust Print trigger with multi-level fallback
  const handlePrint = () => {
    setPopupError(false);
    setIsGenerating(true);

    try {
      const htmlContent = generateFullCatalogHtml(false);

      // 1. Try hidden iframe printing first (no popup block)
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

      const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();

        setTimeout(() => {
          setIsGenerating(false);
          if (printIframe.contentWindow) {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
          }
        }, 600);
        return;
      }

      // 2. Fallback to popup window if iframe is not allowed
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          setIsGenerating(false);
          printWindow.focus();
          printWindow.print();
        }, 500);
      } else {
        setIsGenerating(false);
        setPopupError(true);
      }
    } catch (e) {
      setIsGenerating(false);
      setPopupError(true);
    }
  };

  // Standalone offline HTML/PDF Interactive Catalog File Download
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateFullCatalogHtml(true);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `dastavval_catalog_${catalogLayout}_${dateStr}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Excel CSV Export with UTF-8 BOM
  const handleDownloadCSV = () => {
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "ردیف,نام کالا,برند,دسته‌بندی,تعداد در کارتن,واحد,حداقل سفارش کارتن,قیمت واحد عمده (تومان),قیمت هر کارتن (تومان),قیمت مصرف‌کننده (تومان),حاشیه سود خالص (%),بارکد,مبدا ارسال\n";
    
    const multiplier = 1 + (customMarkupPercent / 100);

    filteredProducts.forEach((p, idx) => {
      const baseBulkPrice = Math.round((p.bulk_price || p.price || 0) * multiplier);
      const cartonUnits = p.carton_pack_count || p.itemsPerUnit || 1;
      const cartonPrice = baseBulkPrice * cartonUnits;
      const consumerPrice = p.consumer_price || p.consumerPrice || Math.round(baseBulkPrice * 1.4);
      const margin = consumerPrice > baseBulkPrice ? (((consumerPrice - baseBulkPrice) / baseBulkPrice) * 100).toFixed(1) : "0";
      const minCartons = Math.max(1, p.min_order_cartons || p.minOrderCartons || 1);

      const row = [
        idx + 1,
        `"${(p.name || '').replace(/"/g, '""')}"`,
        `"${(p.brand || '').replace(/"/g, '""')}"`,
        `"${(p.category || '').replace(/"/g, '""')}"`,
        cartonUnits,
        `"${(p.unit || 'عدد').replace(/"/g, '""')}"`,
        minCartons,
        baseBulkPrice,
        cartonPrice,
        consumerPrice,
        `${margin}%`,
        `"${p.barcode || ''}"`,
        `"${(p.location || 'انبار مرکزی تبریز').replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `dastavval_price_list_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Secure Cloud PDF Download Handler with automatic fallback
  const handleDownloadCloudPdf = async () => {
    setIsDownloadingCloudPdf(true);
    try {
      const safeUrl = catalogPdfUrl.trim();
      const proxyDownloadUrl = `/api/storage/proxy-download?url=${encodeURIComponent(safeUrl)}&filename=dastavval-official-catalog.pdf`;
      
      // Test if server proxy can serve it
      const checkRes = await fetch(proxyDownloadUrl, { method: "HEAD" });
      if (checkRes.ok) {
        window.location.href = proxyDownloadUrl;
      } else {
        // If not found in remote bucket, generate the pristine offline HTML/PDF print version
        handlePrint();
      }
    } catch (e) {
      handlePrint();
    } finally {
      setIsDownloadingCloudPdf(false);
    }
  };

  const handleCopyShareLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://dastavval.com';
    const shareUrl = `${origin}/catalog-view?agent=${user?.agencyCode || 'REP-7012'}&margin=${customMarkupPercent}&name=${encodeURIComponent(distributorName)}&phone=${encodeURIComponent(distributorPhone)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-2 sm:p-4 text-right" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white rounded-3xl border border-slate-200/90 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-600/25 shrink-0">
              <Printer size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">کاتالوگ‌ساز و بروشور رسمی بازرگانی دست اول</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                  چاپ و خروجی A4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                تولید کاتالوگ تصویری، لیست قیمت رسمی، بروشور ژورنالی، خروجی PDF و اکسل مستقیم
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 px-4 sm:px-6 bg-slate-50/70 gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? "border-emerald-600 text-emerald-700 bg-white rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <SlidersHorizontal size={14} />
            <span>تنظیمات و شخصی‌سازی کاتالوگ</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-4 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? "border-emerald-600 text-emerald-700 bg-white rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye size={14} />
            <span>پیش‌نمایش زنده برگه ({toPersianDigits(filteredProducts.length)} کالا)</span>
          </button>

          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-3 px-4 text-xs font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'downloads'
                ? "border-emerald-600 text-emerald-700 bg-white rounded-t-xl"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Download size={14} />
            <span>دانلود فایل‌ها و خروجی‌های چاپی</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 bg-slate-50/30">
          
          {/* TAB 1: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Layout Mode Selector (Cards vs Table vs Magazine) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <LayoutGrid size={15} className="text-emerald-600" />
                  <span>قالب گرافیکی و چیدمان کاتالوگ خروجی:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setCatalogLayout('cards')}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      catalogLayout === 'cards'
                        ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 font-black shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <LayoutGrid size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">کارت‌های تصویری متریال</div>
                      <div className="text-[9.5px] text-slate-500 font-medium">مناسب خریداران و فروشگاه‌ها</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatalogLayout('table')}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      catalogLayout === 'table'
                        ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 font-black shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <TableProperties size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">جدول رسمی ماتریس قیمت</div>
                      <div className="text-[9.5px] text-slate-500 font-medium">مناسب بنکداران و حسابداری</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCatalogLayout('magazine')}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      catalogLayout === 'magazine'
                        ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 font-black shadow-xs"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900">بروشور ژورنالی با جلد رسمی</div>
                      <div className="text-[9.5px] text-slate-500 font-medium">طرح لوکس با صفحه معرفی</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Filter Scope (All vs Custom) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Layers size={15} className="text-emerald-600" />
                  <span>دامنه انتخاب محصولات:</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterMode('all');
                      setSelectedCategories([]);
                      setSelectedBrands([]);
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      filterMode === 'all'
                        ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 font-black"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${filterMode === 'all' ? 'border-emerald-600' : 'border-slate-300'}`}>
                      {filterMode === 'all' && <div className="w-2 h-2 bg-emerald-600 rounded-full" />}
                    </div>
                    <div>
                      <div className="text-xs font-black">کاتالوگ جامع (کل اقلام)</div>
                      <div className="text-[10px] text-slate-500 font-medium">{toPersianDigits(products.length)} محصول فعال</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterMode('custom')}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      filterMode === 'custom'
                        ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 font-black"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 font-bold"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${filterMode === 'custom' ? 'border-emerald-600' : 'border-slate-300'}`}>
                      {filterMode === 'custom' && <div className="w-2 h-2 bg-emerald-600 rounded-full" />}
                    </div>
                    <div>
                      <div className="text-xs font-black">انتخاب دسته‌ها و برندها</div>
                      <div className="text-[10px] text-slate-500 font-medium">سفارشی بر اساس نیاز مشتری</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Conditional Category/Brand picker */}
              {filterMode === 'custom' && (
                <div className="space-y-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  {/* Categories */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Tag size={14} className="text-emerald-600" />
                        <span>انتخاب دسته‌بندی‌ها:</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSelectAllCategories}
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 cursor-pointer"
                      >
                        {selectedCategories.length === allCategories.length ? "لغو همه" : "انتخاب همه"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                      {allCategories.map((cat, idx) => {
                        const isSelected = selectedCategories.includes(cat);
                        return (
                          <button
                            key={`cat-btn-${cat}-${idx}`}
                            type="button"
                            onClick={() => handleToggleCategory(cat)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all border flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                            <span>{cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Brands */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Building2 size={14} className="text-emerald-600" />
                        <span>انتخاب کارخانجات و برندها:</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSelectAllBrands}
                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 cursor-pointer"
                      >
                        {selectedBrands.length === allBrands.length ? "لغو همه" : "انتخاب همه"}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-slate-50 rounded-xl border border-slate-200">
                      {allBrands.map((b, idx) => {
                        const isSelected = selectedBrands.includes(b);
                        return (
                          <button
                            key={`b-btn-${b}-${idx}`}
                            type="button"
                            onClick={() => handleToggleBrand(b)}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all border flex items-center gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                            <span>{b}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Personalization: Title, Phone & Custom Margin */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                  <Sliders size={14} className="text-emerald-600" />
                  <span>شخصی‌سازی سربرگ و اطلاعات نماینده / پخش‌کننده:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1">عنوان کاتالوگ:</label>
                    <input 
                      type="text"
                      value={catalogTitle}
                      onChange={(e) => setCatalogTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-600 mb-1">شماره تماس پشتیبانی روی کاتالوگ:</label>
                    <input 
                      type="text"
                      value={distributorPhone}
                      onChange={(e) => setDistributorPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-black text-slate-700">
                      افزایش حاشیه سود دلخواه روی قیمت‌های پایه (مخصوص بازاریابی):
                    </label>
                    <span className="text-xs font-black text-emerald-700">
                      ٪{toPersianDigits(customMarkupPercent)}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={customMarkupPercent}
                    onChange={(e) => setCustomMarkupPercent(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Display Options Toggles */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-xs text-slate-900 mb-2">فیلدهای فعال در خروجی چاپی:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={includePrices} onChange={(e) => setIncludePrices(e.target.checked)} className="rounded text-emerald-600 accent-emerald-600" />
                    <span>قیمت عمده واحد و کارتن</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={includeConsumerPrices} onChange={(e) => setIncludeConsumerPrices(e.target.checked)} className="rounded text-emerald-600 accent-emerald-600" />
                    <span>قیمت مصرف‌کننده روی جلد</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={includeMargins} onChange={(e) => setIncludeMargins(e.target.checked)} className="rounded text-emerald-600 accent-emerald-600" />
                    <span>درصد سود فروشگاه</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={includeCartonDetails} onChange={(e) => setIncludeCartonDetails(e.target.checked)} className="rounded text-emerald-600 accent-emerald-600" />
                    <span>جزییات کارتن و حداقل سفارش</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={includeBarcodes} onChange={(e) => setIncludeBarcodes(e.target.checked)} className="rounded text-emerald-600 accent-emerald-600" />
                    <span>بارکد و کد کالا</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={includeImages} onChange={(e) => setIncludeImages(e.target.checked)} className="rounded text-emerald-600 accent-emerald-600" />
                    <span>تصاویر کالا</span>
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <Sparkles size={16} className="text-emerald-600 shrink-0" />
                  <span>پیش‌نمایش شبیه‌سازی‌شده صفحه چاپی استاندارد A4 ({toPersianDigits(filteredProducts.length)} محصول انتخاب شده)</span>
                </div>
                <button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Printer size={14} />
                  <span>چاپ فوری این برگه</span>
                </button>
              </div>

              {/* Simulated Paper A4 Canvas */}
              <div className="bg-slate-200/70 p-4 sm:p-6 rounded-2xl border border-slate-300 max-h-[60vh] overflow-y-auto">
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl max-w-3xl mx-auto border border-slate-200 font-sans">
                  
                  {/* Paper Header */}
                  <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4 mb-4">
                    <div>
                      <h2 className="text-lg font-black text-emerald-800">{catalogTitle}</h2>
                      <p className="text-[11px] text-slate-500 font-bold mt-0.5">مرکز توزیع کشوری دست اول | پخش مستقیم از درب کارخانجات</p>
                    </div>
                    <div className="text-left text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div><strong>تاریخ:</strong> {new Date().toLocaleDateString('fa-IR')}</div>
                      <div><strong>تلفن:</strong> {distributorPhone}</div>
                      <div><strong>اقلام:</strong> {toPersianDigits(filteredProducts.length)} ردیف کالا</div>
                    </div>
                  </div>

                  {/* Products Grid Preview */}
                  {filteredProducts.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-bold text-xs">
                      هیچ کالایی با فیلترهای انتخابی یافت نشد.
                    </div>
                  ) : catalogLayout === 'cards' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {filteredProducts.slice(0, 18).map((p, idx) => {
                        const baseBulkPrice = Math.round((p.bulk_price || p.price || 0) * (1 + customMarkupPercent / 100));
                        const consumerPrice = p.consumer_price || p.consumerPrice || Math.round(baseBulkPrice * 1.4);
                        const margin = consumerPrice > baseBulkPrice ? (((consumerPrice - baseBulkPrice) / baseBulkPrice) * 100).toFixed(0) : "0";
                        const imgUrl = getDisplayImageUrl(p.image_url || p.imageUrl, p.name, p.brand);
                        const fallbackSvg = getProductFallbackSvg(p.name, p.brand);

                        return (
                          <div key={`prev-card-${p.id || idx}`} className="border border-slate-200 rounded-xl p-2.5 bg-white shadow-xs flex flex-col justify-between">
                            <div>
                              <div className="w-full h-24 bg-slate-50 rounded-lg overflow-hidden relative mb-2 flex items-center justify-center p-1 border border-slate-100">
                                <img 
                                  src={imgUrl} 
                                  alt={p.name} 
                                  className="w-full h-full object-contain" 
                                  referrerPolicy="no-referrer"
                                  onError={(e) => { (e.target as HTMLImageElement).src = fallbackSvg; }}
                                />
                                <span className="absolute top-1 right-1 bg-slate-900/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                  {p.brand}
                                </span>
                                {Number(margin) > 0 && (
                                  <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                    ٪{toPersianDigits(margin)} سود
                                  </span>
                                )}
                              </div>
                              <h5 className="font-black text-slate-900 text-xs line-clamp-1">{p.name}</h5>
                              <p className="text-[9px] text-slate-400 font-medium">{p.category} | {p.carton_pack_count || p.itemsPerUnit || 1} عددی</p>
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-100 bg-emerald-50/50 p-1.5 rounded-lg text-left">
                              <div className="text-xs font-black text-emerald-800 font-mono">
                                {toPersianDigits(baseBulkPrice.toLocaleString())} <small className="text-[8px] font-sans">تومان</small>
                              </div>
                              <div className="text-[9px] text-slate-400 line-through">
                                مصرف: {toPersianDigits(consumerPrice.toLocaleString())} ت
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : catalogLayout === 'magazine' ? (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-4 rounded-xl text-center">
                        <div className="text-xs font-black text-emerald-300">طرح بروشور و ژورنال لوکس</div>
                        <div className="text-sm font-black text-white mt-1">{catalogTitle}</div>
                        <div className="text-[10px] text-slate-300 mt-0.5">{distributorName} | {distributorPhone}</div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredProducts.slice(0, 8).map((p, idx) => {
                          const baseBulkPrice = Math.round((p.bulk_price || p.price || 0) * (1 + customMarkupPercent / 100));
                          const consumerPrice = p.consumer_price || p.consumerPrice || Math.round(baseBulkPrice * 1.4);
                          const imgUrl = getDisplayImageUrl(p.image_url || p.imageUrl, p.name, p.brand);
                          return (
                            <div key={`mag-prev-${p.id || idx}`} className="border border-slate-200 rounded-xl p-2 bg-white flex gap-3 items-center">
                              <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center p-1 border">
                                <img src={imgUrl} alt={p.name} className="w-full h-full object-contain" />
                              </div>
                              <div className="flex-1 text-xs">
                                <div className="font-black text-slate-900 line-clamp-1">{p.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold">{p.brand} | {p.carton_pack_count || 1} عددی</div>
                                <div className="text-emerald-700 font-black mt-1">{toPersianDigits(baseBulkPrice.toLocaleString())} تومان</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-emerald-700 text-white text-[11px]">
                            <th className="p-2 text-right">#</th>
                            <th className="p-2 text-right">نام کالا و برند</th>
                            <th className="p-2 text-center">کارتن</th>
                            <th className="p-2 text-left">قیمت عمده</th>
                            <th className="p-2 text-left">مصرف‌کننده</th>
                            <th className="p-2 text-center">سود</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredProducts.slice(0, 15).map((p, idx) => {
                            const baseBulkPrice = Math.round((p.bulk_price || p.price || 0) * (1 + customMarkupPercent / 100));
                            const consumerPrice = p.consumer_price || p.consumerPrice || Math.round(baseBulkPrice * 1.4);
                            const margin = consumerPrice > baseBulkPrice ? (((consumerPrice - baseBulkPrice) / baseBulkPrice) * 100).toFixed(0) : "0";

                            return (
                              <tr key={`prev-tbl-${p.id || idx}`} className="hover:bg-slate-50">
                                <td className="p-2 text-slate-400 font-mono text-center">{idx + 1}</td>
                                <td className="p-2 font-bold text-slate-900">
                                  <span>[{p.brand}]</span> {p.name}
                                </td>
                                <td className="p-2 text-center font-bold text-slate-600">{p.carton_pack_count || 1} عددی</td>
                                <td className="p-2 text-left font-black text-emerald-700">{toPersianDigits(baseBulkPrice.toLocaleString())} ت</td>
                                <td className="p-2 text-left text-slate-400">{toPersianDigits(consumerPrice.toLocaleString())} ت</td>
                                <td className="p-2 text-center font-black text-emerald-600">٪{toPersianDigits(margin)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {filteredProducts.length > 18 && (
                    <div className="text-center text-[10px] text-slate-400 font-bold mt-4 pt-3 border-t border-slate-100">
                      و {toPersianDigits(filteredProducts.length - 18)} محصول دیگر که در خروجی نهایی چاپ و دانلود می‌شوند...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOWNLOADS & EXPORT HUB */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              
              {popupError && (
                <div className="p-3 text-xs text-amber-900 bg-amber-50 rounded-2xl border border-amber-200 font-black flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-600 shrink-0" />
                  <span>پنجره پرینت مرورگر باز نشد. می‌توانید از دکمه «دانلود مستقیم فایل آفلاین کاتالوگ» یا «فایل اکسل» استفاده نمایید.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Direct Print / PDF Save */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-all">
                  <div className="space-y-2">
                    <div className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                      <Printer size={22} />
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">چاپ مستقیم و ذخیره استاندارد PDF</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      ارسال به پرینتر یا ذخیره به صورت فایل PDF برگه A4 از طریق پنجره پرینت مرورگر با طراحی متریال.
                    </p>
                  </div>
                  <button
                    onClick={handlePrint}
                    disabled={isGenerating || filteredProducts.length === 0}
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Printer size={16} />
                    <span>{isGenerating ? "در حال پردازش..." : `چاپ / خروجی PDF (${toPersianDigits(filteredProducts.length)} کالا)`}</span>
                  </button>
                </div>

                {/* 2. Standalone HTML/PDF Interactive Document */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-teal-500 transition-all">
                  <div className="space-y-2">
                    <div className="w-11 h-11 bg-teal-600 text-white rounded-xl flex items-center justify-center">
                      <Download size={22} />
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">دانلود فایل کاتالوگ آفلاین چندرسانه‌ای</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      فایل خودکفا و سبک (.html) شامل تمامی تصاویر، قیمت‌ها و دکمه چاپ که در هر گوشی یا سیستمی بدون نیاز به اینترنت باز می‌شود.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadStandaloneHtml}
                    disabled={filteredProducts.length === 0}
                    className="mt-4 w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-teal-600/20 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>دانلود مستقیم فایل آفلاین کاتالوگ</span>
                  </button>
                </div>

                {/* 3. Excel Spreadsheet (CSV) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-emerald-500 transition-all">
                  <div className="space-y-2">
                    <div className="w-11 h-11 bg-emerald-700 text-white rounded-xl flex items-center justify-center">
                      <FileSpreadsheet size={22} />
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">خروجی رسمی اکسل و جدول قیمت (CSV)</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      شامل قیمت‌های عمده، مصرف‌کننده، بارکد و حاشیه سود با انکودینگ UTF-8 BOM جهت باز شدن بدون به‌هم‌ریختگی در اکسل.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadCSV}
                    disabled={filteredProducts.length === 0}
                    className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer"
                  >
                    <FileSpreadsheet size={16} />
                    <span>دانلود فایل اکسل لیست قیمت</span>
                  </button>
                </div>

                {/* 4. Shareable Live Catalog Web Link */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-500 transition-all">
                  <div className="space-y-2">
                    <div className="w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                      <Share2 size={22} />
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">لینک آنلاین کاتالوگ هوشمند اختصاصی</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      ارسال لینک کاتالوگ دیجیتال به مشتریان در واتساپ و تلگرام با اطلاعات تماس و حاشیه سود شما.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyShareLink}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    {copySuccess ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    <span>{copySuccess ? "لینک کپی شد!" : "کپی لینک اختصاصی کاتالوگ"}</span>
                  </button>
                </div>

              </div>

              {/* Cloud PDF File Section (Bucket Fixed & Proxied) */}
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-700/40 shadow-lg space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white">فایل رسمی و جامع کاتالوگ کارخانجات (نسخه ابری باکت پارس‌پک)</h4>
                      <p className="text-[11px] text-slate-300">نسخه تایید شده با تمامی گواهینامه‌ها، استانداردها و شرایط توزیع سراسری</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadCloudPdf}
                      disabled={isDownloadingCloudPdf}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl transition-all inline-flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-500/25 cursor-pointer"
                    >
                      {isDownloadingCloudPdf ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                      <span>دانلود فایل جامع PDF</span>
                    </button>
                  </div>
                </div>

                {isAdmin && (
                  <div className="pt-3 border-t border-emerald-800/60 space-y-2">
                    <div className="text-[10px] font-black text-emerald-300">
                      🔒 کنترل پنل ادمین: بارگذاری نسخه به‌روزشده فایل PDF در سرور ابری پارس‌پک
                    </div>
                    <div className="relative border border-dashed border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/40 rounded-xl p-3 text-center transition-all cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        disabled={isUploadingPdf}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-200">
                        {isUploadingPdf ? <RefreshCw size={16} className="animate-spin text-emerald-400" /> : <CloudUpload size={16} className="text-emerald-400" />}
                        <span>{isUploadingPdf ? "در حال آپلود در باکت پارس‌پک..." : "برای انتخاب و جایگزینی فایل PDF کلیک نمایید"}</span>
                      </div>
                    </div>
                    {uploadMsg && (
                      <div className={`p-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${uploadMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}`}>
                        {uploadMsg.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                        <span>{uploadMsg.text}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Global Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>آماده صدور: <strong className="text-slate-800">{toPersianDigits(filteredProducts.length)}</strong> قلم کالا</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab !== 'downloads' && (
              <button
                onClick={() => setActiveTab('downloads')}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
              >
                <Download size={15} />
                <span>دریافت خروجی‌ها (PDF / HTML / اکسل)</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              بستن
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
