import React, { useState, useMemo, useRef } from "react";
import { Order } from "../types";
import { 
  Printer, X, Check, Building2,
  Copy, Edit3, Plus, Trash2,
  Download, FileText, CheckCircle2,
  Image as ImageIcon, Loader2, ShieldCheck,
  Truck
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
  isFactoryView?: boolean;
  factoryName?: string;
  factoryCode?: string;
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

export default function WholesaleInvoiceView({ 
  order, 
  b2bConfig, 
  onClose, 
  isAdmin,
  isBuyer,
  isFactoryView,
  factoryName,
  factoryCode
}: WholesaleInvoiceViewProps) {
  const invSettings = b2bConfig?.invoiceSettings || {};
  
  const [docType] = useState<'proforma' | 'invoice'>('proforma');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Buyer Info (Confidential for factory view, authentic fallback)
  const buyerInfoAny = (order?.buyerInfo || {}) as any;
  const initialBuyerCompany = isFactoryView
    ? "خریدار معتبر سامانه دست‌اول (تایید هویت شده)"
    : (buyerInfoAny.company || order?.buyerCompany || (order?.buyerName ? `مشتری: ${order.buyerName}` : "خریدار ثبت شده سامانه"));
  
  const initialBuyerName = isFactoryView
    ? `کد مشتری: ${buyerInfoAny.customerCode || (order?.id ? `CST-${order.id.slice(-5).toUpperCase()}` : 'CST-2048')}`
    : (buyerInfoAny.name || order?.buyerName || "مسئول خرید");

  const initialBuyerPhone = isFactoryView
    ? "محرمانه (پشتیبانی و هماهنگی ترابری دست‌اول)"
    : (buyerInfoAny.phone || order?.buyerPhone || "ثبت نشده");

  const initialBuyerAddress = isFactoryView
    ? `مقصد تحویل: استان ${buyerInfoAny.province || 'مقصد'} - شهر ${buyerInfoAny.city || order?.city || 'مقصد'} (آدرس دقیق در بارنامه حمل)`
    : (buyerInfoAny.address || order?.buyerAddress || "ثبت نشده در سفارش");

  const [buyerCompany, setBuyerCompany] = useState(initialBuyerCompany);
  const [buyerName, setBuyerName] = useState(initialBuyerName);
  const [buyerPhone, setBuyerPhone] = useState(initialBuyerPhone);
  const [buyerAddress, setBuyerAddress] = useState(initialBuyerAddress);
  const [buyerProvinceCity] = useState(buyerInfoAny.city ? `${buyerInfoAny.province || ''} - ${buyerInfoAny.city}`.trim().replace(/^-\s*/, '') : (order?.city || "ثبت نشده"));

  // Shipping & Invoice serial
  const [invoiceSerial] = useState<string>(() => {
    if (order?.trackingNumber) return order.trackingNumber;
    return order?.id ? `DX-${order.id.slice(-6).toUpperCase()}` : `DX-${Math.floor(100000 + Math.random() * 900000)}`;
  });

  // Filter Items strictly for factory if isFactoryView
  const [items, setItems] = useState<any[]>(() => {
    if (Array.isArray(order?.items) && order.items.length > 0) {
      let rawItems = order.items;
      if (isFactoryView && (factoryName || factoryCode)) {
        const comp = (factoryName || "").toLowerCase().trim();
        const fCode = (factoryCode || "").toLowerCase().trim();
        const filtered = rawItems.filter((it: any) => {
          const itemFact = (it.factoryName || it.factory_name || it.brand || it.sellerName || "").toLowerCase().trim();
          const sellerId = (it.sellerId || "").toLowerCase().trim();
          return (fCode && sellerId === fCode) || (comp && (itemFact.includes(comp) || comp.includes(itemFact)));
        });
        if (filtered.length > 0) rawItems = filtered;
      }

      return rawItems.map((it: any, index: number) => ({
        id: it.id || it.productId || `item-${index + 1}`,
        name: it.name || "کالای سفارش داده شده",
        quantityCartons: Number(it.quantityCartons || it.quantity || 1),
        unitsPerCarton: Number(it.unitsPerCarton || it.carton_pack_count || 24),
        totalItems: Number(it.totalItems || (Number(it.quantityCartons || it.quantity || 1) * Number(it.unitsPerCarton || it.carton_pack_count || 24))),
        unit: it.unit || "کارتن",
        pricePerCarton: Number(it.pricePerCarton || (it.price ? it.price * (it.carton_pack_count || 1) : 0)),
        discountPercent: Number(it.discountPercent || 0),
        weight: it.weight || "",
        brand: it.brand || it.factoryName || ""
      }));
    }
    return [];
  });

  const dateStr = order?.createdAt 
    ? (typeof order.createdAt === 'string' ? order.createdAt : new Date().toLocaleDateString('fa-IR'))
    : new Date().toLocaleDateString('fa-IR');

  const sellerTitle = factoryName || invSettings.sellerTitle || b2bConfig?.appName || "سامانه مبادلات کالای دست اول";
  const sellerPhone = invSettings.sellerPhone || b2bConfig?.phone || "پشتیبانی مرکزی سامانه";
  const sellerMobile = invSettings.sellerMobile || b2bConfig?.supportPhone || "";
  const sellerAddress = invSettings.sellerAddress || b2bConfig?.hqAddress || "دفتر هماهنگی و بارگیری ترابری سراسری";

  // Calculations (Clean, simple, with volume tier & cash discount breakdown)
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

  const totalQuantity = useMemo(() => {
    return itemsCalculation.reduce((sum, it) => sum + Number(it.quantityCartons || 0), 0);
  }, [itemsCalculation]);

  // Volume Tier Discount (فقط در پرداخت نقدی و تیراژ بالای ۱۰ کارتن اعمال می‌شود)
  const tierDiscountInfo = useMemo(() => {
    if (order?.discountBreakdown?.tier !== undefined) {
      return {
        amount: Number(order.discountBreakdown.tier || 0),
        percent: Number(order.discountBreakdown.tierPercent || 0),
        label: order.discountBreakdown.tierLabel || ""
      };
    }
    const isCheque = order?.paymentMethod === 'cheque';
    if (isCheque) {
      return { amount: 0, percent: 0, label: "" };
    }

    let percent = 0;
    let label = "";
    if (totalQuantity >= 50) {
      percent = 10;
      label = "تخفیف طلایی ۱۰٪ (تیراژ ۵۰ کارتن+)";
    } else if (totalQuantity >= 25) {
      percent = 6;
      label = "تخفیف ۶٪ (تیراژ ۲۵ تا ۴۹ کارتن)";
    } else if (totalQuantity >= 10) {
      percent = 3;
      label = "تخفیف ۳٪ (تیراژ ۱۰ تا ۲۴ کارتن)";
    }
    const amount = Math.round(totalGross * (percent / 100));
    return { amount, percent, label };
  }, [order, totalQuantity, totalGross]);

  // Cash Discount (اگر تخفیف پلکانی فعال باشد، تخفیف ۵٪ نقدی حذف می‌شود)
  const cashDiscountInfo = useMemo(() => {
    if (order?.discountBreakdown?.cash !== undefined) {
      return {
        amount: Number(order.discountBreakdown.cash || 0),
        percent: Number(order.discountBreakdown.cashPercent || 0)
      };
    }
    const isCheque = order?.paymentMethod === 'cheque';
    if (isCheque || tierDiscountInfo.percent > 0) {
      return { amount: 0, percent: 0 };
    }
    const percent = 5;
    const amount = Math.round(totalGross * (percent / 100));
    return { amount, percent };
  }, [order, totalGross, tierDiscountInfo.percent]);

  // Badge / Partner Discount
  const badgeDiscountAmount = useMemo(() => {
    return Number(order?.discountBreakdown?.badge || 0);
  }, [order]);

  // Cheque Markup
  const chequeMarkupAmount = useMemo(() => {
    return Number(order?.discountBreakdown?.chequeMarkup || 0);
  }, [order]);

  const totalDiscounts = tierDiscountInfo.amount + cashDiscountInfo.amount + badgeDiscountAmount;

  const grandTotal = useMemo(() => {
    if (isFactoryView) {
      return Math.max(0, totalGross - totalDiscounts + chequeMarkupAmount);
    }
    if (order?.totalAmount && order.totalAmount > 0) {
      return Number(order.totalAmount);
    }
    return Math.max(0, totalGross - totalDiscounts + chequeMarkupAmount);
  }, [order, totalGross, totalDiscounts, chequeMarkupAmount, isFactoryView]);

  const grandTotalInWords = numToPersianWords(grandTotal);

  // Helper to reliably render invoice element to Image DataURL via html-to-image with ultra-high resolution
  const captureInvoiceDataUrl = async (preferredFormat: 'png' | 'jpeg' = 'png', scale = 3.2): Promise<string | null> => {
    if (!invoiceRef.current) return null;
    const element = invoiceRef.current;

    // Ensure all web fonts and images are ready before snapshot
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
    } catch (e) {}

    try {
      if (preferredFormat === 'png') {
        const dataUrl = await toPng(element, {
          quality: 1.0,
          pixelRatio: scale,
          backgroundColor: "#ffffff",
          cacheBust: true,
          style: {
            margin: '0',
          }
        });
        return dataUrl;
      } else {
        const dataUrl = await toJpeg(element, {
          quality: 0.99,
          pixelRatio: scale,
          backgroundColor: "#ffffff",
          cacheBust: true,
        });
        return dataUrl;
      }
    } catch (err1) {
      console.warn("High-res capture initial attempt failed, trying fallback:", err1);
      try {
        const dataUrl = await toPng(element, {
          pixelRatio: 2.2,
          backgroundColor: "#ffffff",
          cacheBust: true,
        });
        return dataUrl;
      } catch (err2) {
        console.error("html-to-image capture error:", err2);
        return null;
      }
    }
  };

  // 1. Direct Ultra-High-Resolution PDF Download (Crystal Clear 300 DPI Rendering)
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setDownloadSuccessMessage(null);

    try {
      const imgData = await captureInvoiceDataUrl('png', 3.2);
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
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 5;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);

      const imgWidth = availableWidth;
      const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;

      pdf.addImage(imgData, "PNG", margin, margin, imgWidth, Math.min(imgHeight, availableHeight), undefined, 'FAST');
      pdf.save(`Pishfaktor-${invoiceSerial}.pdf`);

      setDownloadSuccessMessage("فایل PDF پیش‌فاکتور با بالاترین کیفیت (HD) با موفقیت دانلود شد.");
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

  // 2. Ultra High-Resolution Full-Page Image Download (Crisp HD PNG)
  const handleDownloadImage = async () => {
    setIsGeneratingImage(true);
    setDownloadSuccessMessage(null);

    try {
      const dataUrl = await captureInvoiceDataUrl('png', 3.5);
      if (!dataUrl) throw new Error("Image capture failed");

      const link = document.createElement("a");
      link.download = `Pishfaktor-${invoiceSerial}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccessMessage("تصویر فوق‌العاده باکیفیت و شفاف (HD) پیش‌فاکتور ذخیره شد.");
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
    <div className="fixed inset-0 z-[200] bg-slate-200/80 backdrop-blur-xs flex flex-col items-center justify-start overflow-y-auto p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible" dir="rtl">
      
      {/* Top Control Bar (Hidden on Print) */}
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 p-2.5 mb-2 shadow-xl print:hidden sticky top-2 z-[210] flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold shadow-xs shrink-0">
              {isFactoryView ? <Truck size={16} /> : <FileText size={16} />}
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>{isFactoryView ? "حواله خروج و بارگیری انبار کارخانه" : "پیش‌فاکتور رسمی فروش کالا"}</span>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${isFactoryView ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {isFactoryView ? "نسخه انبار و ترابری" : "تک‌صفحه‌ای A4"}
                </span>
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                {isFactoryView ? "شناسه بارگیری: " : "شماره: "}
                <span className="font-mono text-slate-900 font-bold">{toPersianNum(invoiceSerial)}</span> | تاریخ: {toPersianNum(dateStr)}
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
              className={`px-3 py-1.5 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 ${
                isFactoryView ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
              title={isFactoryView ? "دانلود حواله خروج انبار" : "دانلود فایل PDF پیش‌فاکتور"}
            >
              {isGeneratingPdf ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>دانلود PDF</span>
            </button>

            {/* Print Button */}
            <button
              id="btn-print-official-invoice"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer active:scale-95"
              title="چاپ مستقیم فاکتور"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">چاپ</span>
            </button>

            {/* Download JPG Image Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isGeneratingImage}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1"
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

            {/* Admin Edit Controls (Disabled in Factory View) */}
            {isAdmin && !isFactoryView && (
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

        {isAdmin && !isFactoryView && isEditing && (
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
        className="w-full max-w-3xl bg-white text-slate-900 border border-slate-200 p-3 sm:p-4 rounded-none mb-6 flex flex-col print:border-none print:m-0 print:p-0 print:w-full print:max-w-none text-right relative shadow-xl print:shadow-none box-border font-sans"
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
              border: 1px solid #e2e8f0 !important;
              padding: 2px 4px !important;
              color: #000000 !important;
              font-size: 8pt !important;
            }
            .a4-table th {
              background-color: #f8fafc !important;
              font-weight: 900 !important;
            }
            .a4-box {
              border: 1px solid #e2e8f0 !important;
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
            {/* Right: Origin / Seller Title */}
            <div className="text-right space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded ${isFactoryView ? 'bg-indigo-700' : 'bg-slate-700'} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}>
                  {isFactoryView ? "🏭" : "۱"}
                </div>
                <span className="text-xs sm:text-[12px] font-black text-slate-900">{sellerTitle}</span>
              </div>
              <span className="text-[8px] text-slate-500 font-medium block">
                {isFactoryView ? "مبدا بارگیری: انبار و خط تولید کارخانه" : "توزیع مستقیم از کارخانجات صنایع غذایی و مواد اولیه"}
              </span>
            </div>

            {/* Center: Main Title */}
            <div className="text-center">
              <h1 className="text-xs sm:text-[13px] font-black text-slate-900 tracking-tight">
                {isFactoryView 
                  ? "حواله خروج و بارگیری انبار کارخانه" 
                  : (docType === 'proforma' ? 'پیش‌فاکتور فروش کالا' : 'فاکتور رسمی فروش کالا')}
              </h1>
              <span className="text-[8px] text-slate-500 font-medium block mt-0.5">
                {isFactoryView 
                  ? "(دستور تحویل به ناوگان حمل و ترابری دست‌اول - اعزام خودرو به درب کارخانه)" 
                  : "(سند تجاری معتبر / تحویل مستقیم از انبار)"}
              </span>
            </div>

            {/* Left: Invoice Number & Date */}
            <div className="text-left space-y-0.5 text-[9px] sm:text-[9.5px]">
              <div>
                <span className="text-slate-400 font-medium font-sans">{isFactoryView ? "شناسه بارگیری: " : "شماره: "}</span>
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
            
            {/* Right Half: Seller / Factory Origin Info */}
            <div className="p-2 text-[9px] sm:text-[9.5px] space-y-0.5 bg-white leading-snug">
              <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-black text-[9px] text-slate-800 a4-header-bg flex items-center justify-between">
                <span>{isFactoryView ? "مبدا بارگیری (کارخانه تامین‌کننده)" : "مشخصات فروشنده (تامین‌کننده)"}</span>
                <span className="text-[7.5px] text-slate-500 font-normal">{isFactoryView ? "انبار مبدا" : "پخش عمده"}</span>
              </div>
              <div className="pt-1 space-y-1 text-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">نام واحد / کارخانه: </span>
                  <span className="font-bold text-slate-900">{sellerTitle}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">هماهنگی بارگیری: </span>
                  <span className="font-mono font-bold">{toPersianNum(sellerPhone)} {sellerMobile ? `- ${toPersianNum(sellerMobile)}` : ''}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">محل کارخانه: </span>
                  <span className="text-slate-600 text-[8.5px] sm:text-[9px]">{sellerAddress}</span>
                </div>
              </div>
            </div>

            {/* Left Half: Consignee & Logistics Info (Confidential for Factory) */}
            <div className="p-2 text-[9px] sm:text-[9.5px] space-y-0.5 bg-white leading-snug">
              <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 font-black text-[9px] text-slate-800 a4-header-bg flex items-center justify-between">
                <span>{isFactoryView ? "تحویل‌گیرنده (ناوگان ترابری سامانه)" : "مشخصات خریدار (تحویل‌گیرنده)"}</span>
                {isEditing && !isFactoryView && <span className="text-[7px] bg-amber-200 text-amber-950 px-1 rounded font-bold print:hidden">ویرایش</span>}
              </div>

              {isEditing && !isFactoryView ? (
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

              <div className={`pt-1 space-y-1 text-slate-800 ${isEditing && !isFactoryView ? 'hidden sm:block' : ''}`}>
                {isFactoryView ? (
                  <>
                    <div>
                      <span className="text-slate-400 font-medium">ناوگان حمل: </span>
                      <span className="font-bold text-indigo-900">ترابری و لجستیک رسمی دست‌اول (اعزام خودروی باربری به کارخانه)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">کد خریدار: </span>
                      <span className="font-mono font-bold text-slate-900">{buyerName}</span>
                      <span className="text-[7.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold mr-1">🔒 اطلاعات تماس محرمانه</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">مقصد تخلیه بار: </span>
                      <span className="text-slate-800 font-bold text-[8.5px] sm:text-[9px]">{buyerProvinceCity} (آدرس انبار خریدار در بارنامه راننده)</span>
                    </div>
                  </>
                ) : (
                  <>
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
                      <span className="text-slate-600 text-[8.5px] sm:text-[9px]">{buyerProvinceCity} {buyerAddress ? `- ${buyerAddress}` : ''}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 3. ITEMS TABLE (Factory Warehouse Loading Mode vs Normal Buyer Proforma) */}
        {isFactoryView ? (
          /* ========================================================= */
          /* FACTORY WAREHOUSE DISPATCH TABLE (NO SELLING PRICES SHOWN) */
          /* ========================================================= */
          <div className="border border-slate-200 mb-2 a4-box bg-white overflow-hidden rounded-xl">
            <div className="bg-indigo-50 px-2 py-1.5 border-b border-slate-200 font-bold text-[9.5px] text-indigo-950 flex items-center justify-between a4-header-bg">
              <span>اقلام آماده‌سازی و بارگیری از خط تولید این کارخانه</span>
              <span className="text-[8px] text-indigo-700 font-bold">تعداد کل کارتن: {toPersianNum(totalQuantity)} کارتن</span>
            </div>

            <table className="w-full border-collapse text-right text-[9px] sm:text-[9.5px] a4-table table-fixed">
              <thead>
                <tr className="bg-slate-50 text-slate-800 font-extrabold border-b border-slate-200 a4-header-bg">
                  <th className="p-1.5 text-center w-[6%] border-l border-slate-200">ردیف</th>
                  <th className="p-1.5 text-right w-[46%] border-l border-slate-200">شرح کالای تولیدی</th>
                  <th className="p-1.5 text-center w-[16%] border-l border-slate-200">تعداد کارتن درخواستی</th>
                  <th className="p-1.5 text-center w-[16%] border-l border-slate-200">تعداد در هر کارتن</th>
                  <th className="p-1.5 text-center w-[16%]">مجموع کل (بسته/واحد)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400 text-xs font-medium">
                      هیچ کالایی از این کارخانه در این سفارش ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const cartonQty = Number(item.quantityCartons || 1);
                    const packCount = Number(item.unitsPerCarton || 24);
                    const totalUnits = cartonQty * packCount;

                    return (
                      <tr key={`inv-fact-item-${item.id || idx}-${idx}`} className="hover:bg-slate-50/50">
                        <td className="p-1.5 text-center font-mono border-l border-slate-200 text-slate-500">
                          {toPersianNum(idx + 1)}
                        </td>
                        <td className="p-1.5 text-right border-l border-slate-200 break-words">
                          <span className="text-slate-900 font-bold text-[9.5px] sm:text-[10px]">{item.name}</span>
                          {item.weight && (
                            <span className="text-[8px] text-slate-400 block font-normal mt-0.5">وزن بسته: {item.weight}</span>
                          )}
                        </td>
                        <td className="p-1.5 text-center border-l border-slate-200 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            {toPersianNum(cartonQty)} <span className="text-[8px] font-sans text-slate-500">{item.unit || "کارتن"}</span>
                          </span>
                        </td>
                        <td className="p-1.5 text-center font-mono border-l border-slate-200 text-slate-700 font-medium">
                          {toPersianNum(packCount)} عدد
                        </td>
                        <td className="p-1.5 text-center font-mono font-black text-indigo-900 text-xs">
                          {toPersianNum(totalUnits.toLocaleString('fa-IR'))} واحد
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Subtotal Row */}
                {items.length > 0 && (
                  <tr className="bg-indigo-50/50 font-bold border-t border-slate-200 a4-header-bg">
                    <td colSpan={2} className="p-1.5 text-center border-l border-slate-200 text-[9px] font-black text-slate-800">
                      مجموع کل اقلام بارگیری این کارخانه ({toPersianNum(items.length)} ردیف)
                    </td>
                    <td className="p-1.5 text-center font-mono border-l border-slate-200 text-slate-950 font-black text-xs">
                      {toPersianNum(totalQuantity)} کارتن
                    </td>
                    <td className="p-1.5 text-center border-l border-slate-200 text-slate-400">-</td>
                    <td className="p-1.5 text-center font-mono font-black text-indigo-950 text-xs">
                      {toPersianNum(items.reduce((s, it) => s + (Number(it.quantityCartons || 1) * Number(it.unitsPerCarton || 24)), 0).toLocaleString('fa-IR'))} واحد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================= */
          /* NORMAL BUYER & ADMIN PROFORMA TABLE (WITH FINANCIAL DETAILS) */
          /* ========================================================= */
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
                  <tr key={`inv-calc-item-${item.id || idx}-${idx}`} className="hover:bg-slate-50/50">
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
        )}

        {/* 4. FOOTER & WAREHOUSE INSTRUCTIONS vs FINANCIAL SUMMARY */}
        {isFactoryView ? (
          /* ========================================================= */
          /* FACTORY LOADING INSTRUCTIONS & LOGISTICS DISPATCH TERMS   */
          /* ========================================================= */
          <div className="space-y-2 mb-2">
            <div className="border border-slate-200 p-2.5 bg-slate-50 a4-box rounded-xl space-y-1.5 text-[8.5px] sm:text-[9px] leading-snug">
              <div className="flex items-center gap-1.5 font-black text-indigo-950 pb-1 border-b border-slate-200">
                <Truck size={14} className="text-indigo-700" />
                <span>دستورالعمل آماده‌سازی و تحویل بار به ناوگان دست‌اول:</span>
              </div>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                <li>
                  <strong>پالت‌بندی و سلفون‌کشی:</strong> لطفاً اقلام فوق را بر اساس استاندارد بارگیری و حمل، پالت‌بندی نموده و در محوطه بارانداز کارخانه آماده فرمایید.
                </li>
                <li>
                  <strong>هماهنگی اعزام خودرو:</strong> خودروی باربری ناوگان ترابری دست‌اول طبق هماهنگی قبلی به محل کارخانه مراجعه و با تطبیق شناسه بارگیری، محموله را تحویل خواهد گرفت.
                </li>
                <li>
                  <strong>کنترل کیفیت و انقضا:</strong> تایید تاریخ تولید به‌روز و پلمپ بودن کارتن‌ها پیش از بارگیری بر عهده مسئول محترم کنترل کیفیت کارخانه می‌باشد.
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* BUYER / ADMIN FINANCIAL SUMMARY & DELIVERY TERMS          */
          /* ========================================================= */
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
                <div>• نحوه تسویه: <span className="font-bold text-slate-800">تسویه نقدی پای بارنامه یا واریز به حساب امانی سامانه</span></div>
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
                  <span className="text-slate-500 font-medium">جمع کل ناخالص اقلام:</span>
                  <span className="font-mono font-bold text-slate-800">{toPersianNum(totalGross.toLocaleString())} تومان</span>
                </div>

                {tierDiscountInfo.amount > 0 && (
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-amber-700 font-bold">
                    <span>تخفیف پلکانی تیراژ ({toPersianNum(tierDiscountInfo.percent)}٪):</span>
                    <span className="font-mono">-{toPersianNum(tierDiscountInfo.amount.toLocaleString())} تومان</span>
                  </div>
                )}

                {cashDiscountInfo.amount > 0 && (
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-emerald-700 font-bold">
                    <span>تخفیف تسویه نقدی ({toPersianNum(cashDiscountInfo.percent)}٪):</span>
                    <span className="font-mono">-{toPersianNum(cashDiscountInfo.amount.toLocaleString())} تومان</span>
                  </div>
                )}

                {badgeDiscountAmount > 0 && (
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-purple-700 font-bold">
                    <span>تخفیف رتبه همکاری:</span>
                    <span className="font-mono">-{toPersianNum(badgeDiscountAmount.toLocaleString())} تومان</span>
                  </div>
                )}

                {chequeMarkupAmount > 0 && (
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100 text-indigo-700 font-bold">
                    <span>کارمزد تسویه چکی:</span>
                    <span className="font-mono">+{toPersianNum(chequeMarkupAmount.toLocaleString())} تومان</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">کرایه حمل و نقل:</span>
                  <span className="font-mono font-medium text-slate-500">۰ تومان (پس‌کرایه)</span>
                </div>

                <div className="flex justify-between items-center pt-1 text-[9.5px] sm:text-[10px] font-black bg-slate-50 p-1.5 border border-slate-200 a4-header-bg mt-1 rounded-lg">
                  <span>مبلغ خالص نهایی فاکتور:</span>
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
        )}

        {/* Bank Account Info (Only for Buyer Proforma) */}
        {!isFactoryView && (() => {
          const accounts = (invSettings.bankAccounts && invSettings.bankAccounts.length > 0) 
            ? invSettings.bankAccounts 
            : [
                {
                  bankName: "بانک صادرات ایران (حساب امانی سامانه)",
                  ownerName: "بازرگانی دست اول",
                  accountNumber: "۰۱۰۲۳۴۵۶۷۸۰۰۱",
                  cardNumber: "۶۰۳۷-۹۹۷۵-۸۸۲۱-۳۳۶۰",
                  sheba: "IR45 0190 0000 0010 2345 6780 01"
                }
              ];
          const acc = accounts[0];
          if (!acc) return null;
          return (
            <div className="border border-emerald-300 px-2 py-1.5 bg-emerald-50/60 a4-box rounded-lg mb-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[8px] sm:text-[8.5px]">
              <div className="flex items-center gap-1.5 shrink-0">
                <Building2 size={13} className="text-emerald-700" />
                <span className="font-black text-slate-900">حساب واریز وجه ({acc.bankName} - {acc.ownerName}):</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-mono text-[8px] sm:text-[8.5px]">
                {acc.accountNumber && (
                  <div>
                    <span className="text-slate-500 font-sans ml-1">حساب:</span>
                    <span className="font-bold text-slate-900">{toPersianNum(acc.accountNumber)}</span>
                  </div>
                )}
                {acc.cardNumber && (
                  <div>
                    <span className="text-slate-500 font-sans ml-1">کارت:</span>
                    <span className="font-bold text-slate-900">{toPersianNum(acc.cardNumber)}</span>
                  </div>
                )}
                {(acc.sheba || acc.shabaNumber) && (
                  <div>
                    <span className="text-slate-500 font-sans ml-1">شبا:</span>
                    <span className="font-bold text-emerald-800">{toPersianNum(acc.sheba || acc.shabaNumber)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* 5. OFFICIAL DIGITAL STAMP & SIGNATURE */}
        <div className="border border-slate-200 p-3 bg-white a4-box rounded-xl mt-1">
          <div className="grid grid-cols-2 gap-3 items-center text-center">
            
            {/* Right: Warehouse Manager Signature Area */}
            <div className="flex flex-col items-center justify-between min-h-[85px] border-l border-slate-200 pl-2">
              <span className="text-[9px] font-bold text-slate-800">
                {isFactoryView ? "مهر و امضای مسئول انبار کارخانه" : "مهر و امضاء خریدار / متقاضی"}
              </span>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-[8px] text-slate-400 font-medium border border-dashed border-slate-200 px-3 py-1.5 rounded-lg">
                  {isFactoryView ? "محل امضای تایید خروج و بارگیری کالا" : "محل امضاء و تایید خریدار"}
                </span>
              </div>
              <span className="text-[7px] text-slate-400">
                {isFactoryView ? "تایید صحت تعداد کارتن و سلامت فیزیکی بار" : "تایید دریافت پیش‌فاکتور و ثبت سفارش"}
              </span>
            </div>

            {/* Left: Logistics Dispatch Stamp & Signature */}
            <div className="flex flex-col items-center justify-center min-h-[85px] pr-2 relative">
              <span className="text-[9px] font-bold text-slate-800 mb-0.5">
                {isFactoryView ? "مهر و تاییدیه ترابری و لجستیک دست‌اول" : "مهر و امضای الکترونیکی بازرگانی دست اول"}
              </span>
              
              {/* Unified Overlapping Stamp + Signature */}
              <div className="relative w-44 h-24 flex items-center justify-center">
                <OfficialUnifiedSealSignature className="w-full h-full" />
              </div>

              <div className="flex items-center gap-1 text-[7px] text-slate-400 font-bold">
                <ShieldCheck size={10} className="text-blue-800" />
                <span>{isFactoryView ? "تاییدیه رسمی اعزام ناوگان حمل به کارخانه" : "تاییدیه رسمی اصالت و صدور فاکتور"}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-2 text-center text-[7.5px] text-slate-400 font-medium border-t border-slate-100 pt-1">
          {isFactoryView ? "حواله رسمی خروج و بارگیری انبار کارخانه | سامانه هوشمند ترابری و بازرگانی دست‌اول | استعلام اصالت سند: Dastavval.com" : "صفحه ۱ از ۱ | پیش‌فاکتور رسمی و تجاری بازرگانی دست اول | استعلام اصالت سند: Dastavval.com"}
        </div>

      </div>
    </div>
  );
}
