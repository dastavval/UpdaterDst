import React, { useState, useMemo, useRef } from "react";
import { Order } from "../types";
import { 
  Printer, X, Check, Building2,
  Copy, Edit3, Plus, Trash2,
  Download, FileText, CheckCircle2,
  Image as ImageIcon, Loader2, ShieldCheck
} from "lucide-react";
import { toJpeg, toPng } from "html-to-image";
import jsPDF from "jspdf";
import { OfficialUnifiedSealSignature } from "./OfficialDigitalStamp";

interface WholesaleInvoiceViewProps {
  order: Order;
  b2bConfig?: any;
  onClose: () => void;
  isAdmin?: boolean;
  isBuyer?: boolean;
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const stringVal = String(num);
  const persian: Record<string, string> = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
  };
  return stringVal.replace(/[0-9]/g, (w) => persian[w] || w);
};

// Persian Number to Words Converter
function numToPersianWords(num: number): string {
  if (!num || isNaN(num) || num === 0) return "صفر";
  const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const hundreds = ["", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

  const chunkThree = (n: number): string => {
    const res: string[] = [];
    const h = Math.floor(n / 100);
    const rem = n % 100;
    if (h > 0) res.push(hundreds[h]);
    if (rem >= 10 && rem < 20) {
      res.push(teens[rem - 10]);
    } else {
      const t = Math.floor(rem / 10);
      const o = Math.floor(rem % 10);
      if (t > 0) res.push(tens[t]);
      if (o > 0) res.push(ones[o]);
    }
    return res.join(" و ");
  };

  const chunks: number[] = [];
  let temp = Math.floor(Math.abs(num));
  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i] > 0) {
      const chunkText = chunkThree(chunks[i]);
      const scaleText = scales[i];
      words.push(scaleText ? `${chunkText} ${scaleText}` : chunkText);
    }
  }

  return words.join(" و ");
}

export default function WholesaleInvoiceView({ order, b2bConfig, onClose, isAdmin }: WholesaleInvoiceViewProps) {
  const invSettings = b2bConfig?.invoiceSettings || {};
  
  const [docType] = useState<'proforma' | 'invoice'>('proforma');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Buyer Info
  const buyerInfoAny = (order?.buyerInfo || {}) as any;
  const [buyerCompany, setBuyerCompany] = useState(buyerInfoAny.company || order?.buyerCompany || "فروشگاه / خریدار محترم");
  const [buyerName, setBuyerName] = useState(buyerInfoAny.name || order?.buyerName || "مسئول خرید");
  const [buyerPhone, setBuyerPhone] = useState(buyerInfoAny.phone || order?.buyerPhone || "۰۹۱۲۳۴۵۶۷۸۹");
  const [buyerAddress, setBuyerAddress] = useState(buyerInfoAny.address || order?.buyerAddress || "انبار مرکزی توزیع و پخش کالا");
  const [buyerProvinceCity] = useState(buyerInfoAny.city ? `${buyerInfoAny.province || 'تهران'} - ${buyerInfoAny.city}` : "تهران - بازار بزرگ");

  // Shipping & Invoice serial
  const [invoiceSerial] = useState<string>(() => {
    if (order?.trackingNumber) return order.trackingNumber;
    return order?.id ? `DX-${order.id.slice(-6).toUpperCase()}` : `DX-${Math.floor(100000 + Math.random() * 900000)}`;
  });

  // Items State (No Product Code column, simplified for extreme clarity)
  const [items, setItems] = useState<any[]>(() => {
    if (Array.isArray(order?.items) && order.items.length > 0) {
      return order.items.map((it: any, index: number) => ({
        id: it.id || it.productId || `item-${index + 1}`,
        name: it.name || "کالای عمده سفارش داده شده",
        quantityCartons: Number(it.quantityCartons || it.quantity || 1),
        unit: it.unit || "کارتن",
        pricePerCarton: Number(it.pricePerCarton || (it.price ? it.price * (it.carton_pack_count || 1) : 480000)),
        discountPercent: Number(it.discountPercent || 0)
      }));
    }
    return [
      {
        id: "p-sample-1",
        name: "شکر تصفیه شده ۵۰ کیلویی درجه یک مستقیم کارخانه",
        quantityCartons: 20,
        unit: "کیسه ۵۰kg",
        pricePerCarton: 1950000,
        discountPercent: 0
      },
      {
        id: "p-sample-2",
        name: "روغن سرخ‌کردنی حلب ۱۶ کیلوگرمی صنعتی",
        quantityCartons: 15,
        unit: "حلب ۱۶kg",
        pricePerCarton: 1120000,
        discountPercent: 0
      }
    ];
  });

  const dateStr = order?.createdAt 
    ? (typeof order.createdAt === 'string' ? order.createdAt : new Date().toLocaleDateString('fa-IR'))
    : new Date().toLocaleDateString('fa-IR');

  const sellerTitle = invSettings.sellerTitle || b2bConfig?.appName || "صنایع غذایی و بازرگانی دست اول";
  const sellerPhone = invSettings.sellerPhone || "۰۲۱-۸۸۲۲۴۴۳۳";
  const sellerMobile = invSettings.sellerMobile || "۰۹۰۴۴۵۰۲۹۰۰";
  const sellerAddress = invSettings.sellerAddress || b2bConfig?.hqAddress || "آذربایجان شرقی، شبستر، شهرک صنعتی شندآباد، مجتمع پخش و بنکداری مرکزی دست اول";

  // Calculations (Clean, simple, no tax)
  const itemsCalculation = useMemo(() => {
    return items.map(item => {
      const grossTotal = Number(item.pricePerCarton || 0) * Number(item.quantityCartons || 0);
      const discountVal = (grossTotal * Number(item.discountPercent || 0)) / 100;
      const netTotal = grossTotal - discountVal;
      return {
        ...item,
        grossTotal,
        discountVal,
        netTotal
      };
    });
  }, [items]);

  const totalGross = useMemo(() => {
    return itemsCalculation.reduce((sum, it) => sum + it.grossTotal, 0);
  }, [itemsCalculation]);

  const grandTotal = useMemo(() => {
    return itemsCalculation.reduce((sum, it) => sum + it.netTotal, 0);
  }, [itemsCalculation]);

  const totalQuantity = useMemo(() => {
    return itemsCalculation.reduce((sum, it) => sum + Number(it.quantityCartons || 0), 0);
  }, [itemsCalculation]);

  const grandTotalInWords = numToPersianWords(grandTotal);

  // Helper to reliably render invoice element to Image DataURL via html-to-image (native browser engine, 100% OKLCH compatible)
  const captureInvoiceDataUrl = async (): Promise<string | null> => {
    if (!invoiceRef.current) return null;
    const element = invoiceRef.current;

    try {
      // First try toJpeg with pixelRatio: 2 for ultra crisp text and small file size
      const dataUrl = await toJpeg(element, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
        skipFonts: true,
      });
      return dataUrl;
    } catch (err1) {
      console.warn("toJpeg failed, trying toPng fallback:", err1);
      try {
        const dataUrl = await toPng(element, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
          cacheBust: true,
          skipFonts: true,
        });
        return dataUrl;
      } catch (err2) {
        console.error("html-to-image capture error:", err2);
        return null;
      }
    }
  };

  // 1. Direct High-Resolution PDF Download (Native browser rendering, zero OKLCH issues)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setDownloadSuccessMessage(null);

    try {
      const imgData = await captureInvoiceDataUrl();
      if (!imgData) throw new Error("Canvas rendering failed");

      // Load image to get true pixel aspect ratio
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true);
        img.onerror = reject;
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 6;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);

      const imgWidth = availableWidth;
      const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;

      pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, Math.min(imgHeight, availableHeight));
      pdf.save(`Pishfaktor-${invoiceSerial}.pdf`);

      setDownloadSuccessMessage("فایل PDF پیش‌فاکتور رسمی با موفقیت دانلود شد.");
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error generating PDF:", err);
      try {
        window.print();
      } catch (e) {
        console.error("Print fallback error", e);
      }
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 2. High-Resolution Full-Page JPG Download (Native browser rendering, zero OKLCH issues)
  const handleDownloadImage = async () => {
    setIsGeneratingImage(true);
    setDownloadSuccessMessage(null);

    try {
      const dataUrl = await captureInvoiceDataUrl();
      if (!dataUrl) throw new Error("Image capture failed");

      const link = document.createElement("a");
      link.download = `Pishfaktor-${invoiceSerial}.jpg`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccessMessage("تصویر واضح و کامل پیش‌فاکتور ذخیره شد.");
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err) {
      console.error("Error generating Image:", err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 3. Direct Print handler
  const handlePrint = () => {
    try {
      window.print();
    } catch (e) {
      handleDownloadPdf();
    }
  };

  // 4. Quick Text Copy
  const handleCopyText = () => {
    const title = docType === 'proforma' ? 'پیش‌فاکتور فروش کالا' : 'فاکتور فروش کالا';
    const text = `🧾 ${title} - ${sellerTitle}
شماره فاکتور: ${toPersianNum(invoiceSerial)}
تاریخ: ${toPersianNum(dateStr)}
فروشنده: ${sellerTitle} (تلفن: ${toPersianNum(sellerPhone)} / ${toPersianNum(sellerMobile)})
خریدار: ${buyerCompany} - ${buyerName} (تلفن: ${toPersianNum(buyerPhone)})
مقصد تحویل: ${buyerProvinceCity} - ${buyerAddress}
----------------------------------------
تعداد کل اقلام: ${toPersianNum(totalQuantity)} واحد
هزینه باربری: ۰ تومان (پس‌کرایه به عهده خریدار در مقصد)
----------------------------------------
مبلغ کل فاکتور: ${toPersianNum(grandTotal.toLocaleString())} تومان
(${grandTotalInWords} تومان)`;
    
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleQuantityChange = (idx: number, newQty: number) => {
    if (newQty < 1) return;
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], quantityCartons: newQty };
      return copy;
    });
  };

  const handlePriceChange = (idx: number, newPrice: number) => {
    if (newPrice < 0) return;
    setItems(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], pricePerCarton: newPrice };
      return copy;
    });
  };

  const handleDeleteItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `p-item-${Date.now()}`,
        name: "کالای جدید",
        quantityCartons: 10,
        unit: "کارتن",
        pricePerCarton: 500000,
        discountPercent: 0
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible" dir="rtl">
      
      {/* Top Control Bar (Hidden on Print) */}
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 p-2.5 mb-2 shadow-xl print:hidden sticky top-2 z-[210] flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>پیش‌فاکتور رسمی فروش کالا</span>
                <span className="text-[9.5px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                  تک‌صفحه‌ای A4
                </span>
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                شماره: <span className="font-mono text-slate-900 font-bold">{toPersianNum(invoiceSerial)}</span> | تاریخ: {toPersianNum(dateStr)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            
            {/* Download PDF Button */}
            <button
              id="btn-download-pdf-invoice"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              title="دانلود فایل PDF پیش‌فاکتور"
            >
              {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>دانلود PDF</span>
            </button>

            {/* Print Button */}
            <button
              id="btn-print-official-invoice"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
              title="چاپ مستقیم فاکتور"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">چاپ</span>
            </button>

            {/* Download JPG Image Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
              title="دانلود عکس کامل برای واتساپ/ایتا/تلگرام"
            >
              {isGeneratingImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
              <span>دانلود عکس</span>
            </button>

            {/* Copy Text Button */}
            <button
              onClick={handleCopyText}
              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
              title="کپی متن خلاصه فاکتور"
            >
              {copiedText ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span className="hidden sm:inline">کپی</span>
            </button>

            {/* Admin Edit Controls */}
            {isAdmin && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                  isEditing 
                    ? 'bg-amber-500 text-white border-amber-600' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                <Edit3 size={13} />
                <span>{isEditing ? 'ذخیره' : 'ویرایش'}</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              title="بستن"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {downloadSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold p-1.5 rounded-lg flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {isAdmin && isEditing && (
          <div className="flex items-center justify-end border-t border-slate-200 pt-1.5">
            <button
              onClick={handleAddItem}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>افزودن ردیف کالا</span>
            </button>
          </div>
        )}
      </div>

      {/* COMPACT, HIGH-CONTRAST INVOICE CONTAINER (Refined Iranian typography & font sizing) */}
      <div 
        ref={invoiceRef}
        id="printable-invoice"
        className="w-full max-w-3xl bg-white text-slate-900 border border-slate-900 p-3 sm:p-4 rounded-none mb-6 flex flex-col print:border-none print:m-0 print:p-0 print:w-full print:max-w-none text-right relative shadow-xl print:shadow-none box-border font-sans"
        style={{ fontFamily: "'Vazirmatn', Tahoma, Arial, sans-serif" }}
      >
        
        {/* Printable CSS Rules */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            html, body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Vazirmatn', Tahoma, Arial, sans-serif !important;
              font-size: 8.5pt !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #printable-invoice {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .a4-table {
              border-collapse: collapse !important;
              width: 100% !important;
              table-layout: fixed !important;
            }
            .a4-table th, .a4-table td {
              border: 1px solid #000000 !important;
              padding: 2px 4px !important;
              color: #000000 !important;
              font-size: 8pt !important;
            }
            .a4-table th {
              background-color: #f8fafc !important;
              font-weight: 900 !important;
            }
            .a4-box {
              border: 1px solid #1e293b !important;
            }
            .a4-header-bg {
              background-color: #f8fafc !important;
              color: #000000 !important;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}} />

        {/* 1. TOP HEADER (سربرگ رسمی با فونت متناسب) */}
        <div className="border border-slate-200 p-3 mb-2 bg-slate-50/50 a4-box rounded-xl">
          <div className="grid grid-cols-3 items-center">
            {/* Right: Seller Title */}
            <div className="text-right space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">۱</div>
                <span className="text-xs sm:text-[12px] font-black text-slate-900">{sellerTitle}</span>
              </div>
              <span className="text-[8px] text-slate-500 font-medium block">توزیع مستقیم از کارخانجات صنایع غذایی و مواد اولیه</span>
            </div>

            {/* Center: Main Title */}
            <div className="text-center">
              <h1 className="text-xs sm:text-[13px] font-black text-slate-900 tracking-tight">
                {docType === 'proforma' ? 'پیش‌فاکتور فروش کالا' : 'فاکتور رسمی فروش کالا'}
              </h1>
              <span className="text-[8px] text-slate-500 font-medium block mt-0.5">
                (سند تجاری معتبر / تحویل مستقیم از انبار)
              </span>
            </div>

            {/* Left: Invoice Number & Date */}
            <div className="text-left space-y-0.5 text-[9px] sm:text-[9.5px]">
              <div>
                <span className="text-slate-400 font-medium font-sans">شماره: </span>
                <span className="font-mono font-bold text-slate-900">{toPersianNum(invoiceSerial)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium font-sans">تاریخ صدور: </span>
                <span className="font-mono font-bold text-slate-900">{toPersianNum(dateStr)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SIDE-BY-SIDE SELLER & BUYER DETAILS (2 Columns horizontal layout) */}
        <div className="border border-slate-200 mb-2 a4-box bg-white overflow-hidden rounded-xl">
          <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-200">
            
            {/* Right Half: Seller Info */}
            <div className="p-2 text-[9px] sm:text-[9.5px] space-y-0.5 bg-white leading-snug">
              <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-black text-[9px] text-slate-800 a4-header-bg flex items-center justify-between">
                <span>مشخصات فروشنده (تامین‌کننده)</span>
                <span className="text-[7.5px] text-slate-500 font-normal">پخش عمده</span>
              </div>
              <div className="pt-1 space-y-1 text-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">نام واحد: </span>
                  <span className="font-bold text-slate-900">{sellerTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">تلفن تماس: </span>
                  <span className="font-mono font-bold">{toPersianNum(sellerPhone)} - {toPersianNum(sellerMobile)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">نشانی: </span>
                  <span className="text-slate-600 text-[8.5px] sm:text-[9px]">{sellerAddress}</span>
                </div>
              </div>
            </div>

            {/* Left Half: Buyer Info */}
            <div className="p-2 text-[9px] sm:text-[9.5px] space-y-0.5 bg-white leading-snug">
              <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-black text-[9px] text-slate-800 a4-header-bg flex items-center justify-between">
                <span>مشخصات خریدار (تحویل‌گیرنده)</span>
                {isEditing && <span className="text-[7px] bg-amber-200 text-amber-950 px-1 rounded font-bold print:hidden">ویرایش</span>}
              </div>

              {isEditing ? (
                <div className="space-y-1 pt-1 print:hidden">
                  <input
                    type="text"
                    value={buyerCompany}
                    onChange={(e) => setBuyerCompany(e.target.value)}
                    placeholder="نام خریدار یا فروشگاه"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[9px] font-medium"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="مسئول خرید"
                      className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[9px] font-medium"
                    />
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="شماره تماس"
                      className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[9px] font-medium font-mono"
                    />
                  </div>
                  <input
                    type="text"
                    value={buyerAddress}
                    onChange={(e) => setBuyerAddress(e.target.value)}
                    placeholder="نشانی محل تخلیه بار"
                    className="w-full bg-slate-50 border border-slate-300 rounded px-1 py-0.5 text-[9px] font-medium"
                  />
                </div>
              ) : null}

              <div className={`pt-1 space-y-1 text-slate-800 ${isEditing ? 'hidden sm:block' : ''}`}>
                <div>
                  <span className="text-slate-400 font-medium">خریدار / واحد: </span>
                  <span className="font-bold text-slate-900">{buyerCompany} {buyerName ? `(${buyerName})` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">تلفن تماس: </span>
                  <span className="font-mono font-bold">{toPersianNum(buyerPhone)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">مقصد تخلیه: </span>
                  <span className="text-slate-600 text-[8.5px] sm:text-[9px]">{buyerProvinceCity} - {buyerAddress}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3. ITEMS TABLE (5 Clear Columns, NO product code, 100% table-fixed responsive) */}
        <div className="border border-slate-200 mb-2 a4-box bg-white overflow-hidden rounded-xl">
          <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-[9px] text-slate-800 flex items-center justify-between a4-header-bg">
            <span>مشخصات اقلام سفارش داده شده</span>
            <span className="text-[8px] text-slate-500 font-normal">مبالغ به تومان</span>
          </div>

          <table className="w-full border-collapse text-right text-[9px] sm:text-[9.5px] a4-table table-fixed">
            <thead>
              <tr className="bg-slate-50 text-slate-800 font-extrabold border-b border-slate-200 a4-header-bg">
                <th className="p-1.5 text-center w-[6%] border-l border-slate-200">ردیف</th>
                <th className="p-1.5 text-right w-[46%] border-l border-slate-200">شرح کالا</th>
                <th className="p-1.5 text-center w-[16%] border-l border-slate-200">تعداد و واحد</th>
                <th className="p-1.5 text-center w-[16%] border-l border-slate-200">قیمت واحد (تومان)</th>
                <th className="p-1.5 text-left w-[16%]">مبلغ کل (تومان)</th>
                {isEditing && <th className="p-1 text-center w-5 print:hidden">حذف</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {itemsCalculation.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-1.5 text-center font-mono border-l border-slate-200 text-slate-500">
                    {toPersianNum(idx + 1)}
                  </td>
                  <td className="p-1.5 text-right border-l border-slate-200 break-words">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const copy = [...items];
                          copy[idx].name = e.target.value;
                          setItems(copy);
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded px-1 text-[9px] font-medium"
                      />
                    ) : (
                      <span className="text-slate-900 font-bold text-[9.5px] sm:text-[10px]">{item.name}</span>
                    )}
                  </td>
                  <td className="p-1.5 text-center border-l border-slate-200 whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1 print:hidden">
                        <button 
                          onClick={() => handleQuantityChange(idx, (item.quantityCartons || 1) - 1)}
                          className="w-3.5 h-3.5 bg-slate-200 rounded text-slate-800 font-bold flex items-center justify-center text-[9px]"
                        >
                          -
                        </button>
                        <span className="font-mono text-[9px]">{toPersianNum(item.quantityCartons)}</span>
                        <button 
                          onClick={() => handleQuantityChange(idx, (item.quantityCartons || 1) + 1)}
                          className="w-3.5 h-3.5 bg-slate-200 rounded text-slate-800 font-bold flex items-center justify-center text-[9px]"
                        >
                          +
                        </button>
                        <span className="text-[8px] text-slate-600">{item.unit || "کارتن"}</span>
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-slate-900">
                        {toPersianNum(item.quantityCartons)} <span className="text-[8px] font-sans text-slate-500">{item.unit || "کارتن"}</span>
                      </span>
                    )}
                  </td>
                  <td className="p-1.5 text-center font-mono border-l border-slate-200 text-slate-700 font-medium">
                    {isEditing ? (
                      <input
                        type="number"
                        value={item.pricePerCarton}
                        onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                        className="w-18 bg-slate-50 border border-slate-300 rounded px-1 text-[9px] font-mono text-center"
                      />
                    ) : (
                      toPersianNum(item.pricePerCarton.toLocaleString())
                    )}
                  </td>
                  <td className="p-1.5 text-left font-mono font-bold text-slate-900">
                    {toPersianNum(item.netTotal.toLocaleString())}
                  </td>
                  {isEditing && (
                    <td className="p-1 text-center print:hidden">
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        className="text-rose-600 hover:text-rose-800 p-0.5 cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {/* Subtotal Row */}
              <tr className="bg-slate-50/50 font-bold border-t border-slate-200 a4-header-bg">
                <td colSpan={2} className="p-1.5 text-center border-l border-slate-200 text-[9px]">
                  جمع کل سفارش ({toPersianNum(items.length)} قلم کالا)
                </td>
                <td className="p-1.5 text-center font-mono border-l border-slate-200 text-slate-900">
                  {toPersianNum(totalQuantity)} <span className="text-[7.5px] font-sans text-slate-500">واحد</span>
                </td>
                <td className="p-1.5 text-center border-l border-slate-200 text-slate-400">-</td>
                <td className="p-1.5 text-left font-mono font-black text-slate-950 text-[10px] sm:text-[10.5px]">
                  {toPersianNum(grandTotal.toLocaleString())}
                </td>
                {isEditing && <td className="print:hidden"></td>}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. FINANCIAL SUMMARY & DELIVERY TERMS */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          
          {/* Delivery & Terms Box */}
          <div className="border border-slate-200 p-2 bg-white a4-box space-y-1 text-[8.5px] sm:text-[9px] leading-snug rounded-xl">
            <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-slate-800 a4-header-bg flex items-center justify-between">
              <span>شرایط تحویل و ارسال بار:</span>
              <span className="text-[7.5px] text-slate-500">بارگیری مستقیم</span>
            </div>

            <div className="p-1.5 border border-slate-100 bg-slate-50 rounded-lg space-y-1">
              <div className="flex justify-between items-center font-bold text-slate-800">
                <span>هزینه حمل و باربری:</span>
                <span className="font-mono font-bold text-slate-900">۰ تومان (پس‌کرایه در مقصد)</span>
              </div>
              <p className="text-[7.5px] text-slate-400 font-normal leading-tight">
                * بارگیری مستقیم از انبار کارخانه انجام شده و کرایه باربری در هنگام تخلیه توسط خریدار به باربری پرداخت می‌شود.
              </p>
            </div>

            <div className="text-[8px] text-slate-600 space-y-0.5 pt-0.5">
              <div>• نحوه تسویه: <span className="font-bold text-slate-800">تسویه نقدی پای بارنامه یا واریز به حساب کارخانه</span></div>
              <div>• ضمانت کیفیت: <span className="font-bold text-slate-800">تضمین ۱۰۰٪ اصالت و تاریخ تولید به روز</span></div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="border border-slate-200 p-2 bg-white a4-box space-y-1 text-[8.5px] sm:text-[9px] leading-snug rounded-xl">
            <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-bold text-slate-800 a4-header-bg flex justify-between">
              <span>خلاصه حساب فاکتور</span>
              <span className="font-mono text-[7.5px] text-slate-500">تومان</span>
            </div>

            <div className="space-y-1 text-slate-800 pt-0.5">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">جمع کل اقلام:</span>
                <span className="font-mono font-bold text-slate-700">{toPersianNum(totalGross.toLocaleString())} تومان</span>
              </div>

              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-400 font-medium">کرایه حمل و نقل:</span>
                <span className="font-mono font-medium text-slate-500">۰ تومان (پس‌کرایه)</span>
              </div>

              <div className="flex justify-between items-center pt-1 text-[9.5px] sm:text-[10px] font-black bg-slate-50 p-1.5 border border-slate-200 a4-header-bg mt-1 rounded-lg">
                <span>مبلغ نهایی فاکتور:</span>
                <span className="font-mono text-slate-900 font-black text-xs">
                  {toPersianNum(grandTotal.toLocaleString())} تومان
                </span>
              </div>

              <div className="text-[8px] text-slate-500 font-medium pt-0.5 text-center">
                مبلغ به حروف: <span className="font-bold text-slate-800">{grandTotalInWords} تومان</span>
              </div>
            </div>
          </div>

        </div>

        {/* 5. OFFICIAL DIGITAL STAMP & SIGNATURE (Authentic Signature Overlapping the Official Square QR Stamp) */}
        <div className="border border-slate-200 p-3 bg-white a4-box rounded-xl mt-1">
          <div className="grid grid-cols-2 gap-3 items-center text-center">
            
            {/* Buyer Confirmation Area */}
            <div className="flex flex-col items-center justify-between min-h-[85px] border-l border-slate-200 pl-2">
              <span className="text-[9px] font-bold text-slate-800">مهر و امضاء خریدار / متقاضی</span>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[8px] text-slate-400 font-medium border border-dashed border-slate-200 px-3 py-1.5 rounded-lg">
                  محل امضاء و تایید خریدار
                </span>
              </div>
              <span className="text-[7px] text-slate-400">تایید دریافت پیش‌فاکتور و ثبت سفارش</span>
            </div>

            {/* Seller Official Unified Stamp & Signature (Single, official, authentic overlap) */}
            <div className="flex flex-col items-center justify-center min-h-[85px] pr-2 relative">
              <span className="text-[9px] font-bold text-slate-800 mb-0.5">
                مهر و امضای الکترونیکی بازرگانی دست اول
              </span>
              
              {/* Unified Overlapping Stamp + Signature */}
              <div className="relative w-44 h-24 flex items-center justify-center">
                <OfficialUnifiedSealSignature className="w-full h-full" />
              </div>

              <div className="flex items-center gap-1 text-[7px] text-slate-400 font-bold">
                <ShieldCheck size={10} className="text-blue-800" />
                <span>تاییدیه دیجیتال رسمی مدیریت | کد ثبتی: ۳۳۶۰</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-2 text-center text-[7.5px] text-slate-400 font-medium border-t border-slate-100 pt-1">
          صفحه ۱ از ۱ | پیش‌فاکتور رسمی و تجاری بازرگانی دست اول | استعلام اصالت سند: Dastavval.com
        </div>

      </div>
    </div>
  );
}
