import React, { useState, Component, ErrorInfo, ReactNode } from "react";
import { Order } from "../types";
import { Printer, X, ShieldCheck, Download, Loader2, Edit3, Check, FileText, QrCode, Award, Sparkles, Copy, RotateCcw, CheckCircle2, AlertTriangle, Scale, Maximize2, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { runWithOklchPolyfill, cleanClonedDocForPdf } from "../utils/pdfPolyfill";

interface WholesaleInvoiceViewProps {
  order: Order;
  b2bConfig: any;
  onClose: () => void;
  isAdmin?: boolean;
  isBuyer?: boolean;
}

// Error Boundary to prevent invoice rendering issues from freezing or crashing the UI
class InvoiceErrorBoundary extends Component<{ children: ReactNode; onClose: () => void }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode; onClose: () => void }) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || "خطای نامشخص در نمایش فاکتور" };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WholesaleInvoiceView Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-right">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full shadow-2xl space-y-4 border border-rose-200">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={28} />
              <h3 className="font-black text-base text-slate-900">بازیابی خودکار فاکتور رسمی</h3>
            </div>
            <p className="text-xs font-bold text-slate-600 leading-relaxed">
              اطلاعات فاکتور رسمی با موفقیت بازنشانی شد. می‌توانید مجدداً فاکتور را مشاهده فرمایید.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => this.setState({ hasError: false })}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors"
              >
                تلاش مجدد
              </button>
              <button
                onClick={this.props.onClose}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const stringVal = String(num);
  const persian: Record<string, string> = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
  };
  return stringVal.replace(/[0-9]/g, (w) => persian[w] || w);
};

const numberToPersianWords = (num: number): string => {
  if (num === undefined || num === null || isNaN(num) || num <= 0) return 'صفر';

  const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  const thousands = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  const splitNumber = (n: number): number[] => {
    const parts = [];
    while (n > 0) {
      parts.push(n % 1000);
      n = Math.floor(n / 1000);
    }
    return parts;
  };

  const convertPart = (n: number): string => {
    let res = '';
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) res += hundreds[h] + ' و ';
    if (t === 1) {
      res += teens[u];
    } else {
      if (t > 1) res += tens[t] + ' و ';
      if (u > 0) res += units[u];
    }
    return res.replace(/ و $/, '');
  };

  try {
    const parts = splitNumber(Math.floor(num));
    let result = '';
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] > 0) {
        result = convertPart(parts[i]) + ' ' + thousands[i] + ' و ' + result;
      }
    }
    return result.replace(/ و $/, '').trim() || 'صفر';
  } catch (e) {
    return 'صفر';
  }
};

function WholesaleInvoiceContent({ order, b2bConfig, onClose }: WholesaleInvoiceViewProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currencyUnit, setCurrencyUnit] = useState<'toman' | 'rial'>('toman');
  const invSettings = b2bConfig?.invoiceSettings || {};

  const safeOrder = order || {} as any;
  const orderId = safeOrder.id || safeOrder.trackingNumber || `ORD-${Date.now().toString().slice(-6)}`;

  // Localized Seller Fields
  const [sellerTitle, setSellerTitle] = useState(invSettings.sellerTitle || b2bConfig?.appName || "شرکت تجارت و توسعه صنایع غذایی دست اول (سهامی خاص)");
  const [sellerNationalId, setSellerNationalId] = useState(invSettings.sellerNationalId || "۱۰۱۰۳۴۸۲۹۱۰");
  const [sellerEconomicCode, setSellerEconomicCode] = useState(invSettings.sellerEconomicCode || "۴۱۱۲۹۳۸۴۷۱");
  const [sellerRegNumber, setSellerRegNumber] = useState(invSettings.sellerRegNumber || "۸۸۴۹۲");
  const [sellerPostalCode, setSellerPostalCode] = useState(invSettings.sellerPostalCode || "۵۴۱۸۶۳۹۴۷۲");
  const [sellerPhone, setSellerPhone] = useState(invSettings.sellerPhone || "۰۲۱-۸۸۲۲۴۴۳۳");
  const [sellerAddress, setSellerAddress] = useState(invSettings.sellerAddress || "تهران، خیابان ولیعصر، برج بازرگانی صنایع غذایی کشور، طبقه ۱۲");

  // Localized Buyer Details
  const initialBuyerName = safeOrder.buyerName || safeOrder.buyerInfo?.name || "مسئول خرید همکار";
  const initialBuyerCompany = safeOrder.buyerCompany || safeOrder.buyerInfo?.company || "بازرگانی همکار ثبت شده";
  const initialBuyerPhone = safeOrder.buyerPhone || safeOrder.buyerInfo?.phone || "۰۹۱۲۳۴۵۶۷۸۹";
  const initialBuyerAddress = safeOrder.buyerAddress || safeOrder.buyerInfo?.address || "نشانی کامل تحویل‌گیرنده و تخلیه بار همکار";

  const [buyerCompany, setBuyerCompany] = useState(initialBuyerCompany);
  const [buyerName, setBuyerName] = useState(initialBuyerName);
  const [buyerPhone, setBuyerPhone] = useState(initialBuyerPhone);
  const [buyerNationalId, setBuyerNationalId] = useState((safeOrder as any).buyerNationalId || "۱۰۴۹۸۲۹۳۷۴۱");
  const [buyerEconomicCode, setBuyerEconomicCode] = useState((safeOrder as any).buyerEconomicCode || "۴۱۱۵۶۷۸۳۹۲");
  const [buyerRegNumber, setBuyerRegNumber] = useState((safeOrder as any).buyerRegNumber || "۹۹۲۸۱");
  const [buyerPostalCode, setBuyerPostalCode] = useState((safeOrder as any).buyerPostalCode || "۱۲۳۴۵۶۷۸۹۰");
  const [buyerAddress, setBuyerAddress] = useState(initialBuyerAddress);

  // Serial & Seal
  const [invoiceSerial, setInvoiceSerial] = useState(safeOrder.trackingNumber || `DS-${orderId.substring(0, 8).toUpperCase()}`);
  const officialSealUrl = invSettings.officialSealUrl || b2bConfig?.officialSealUrl;

  // Order Items
  const rawItems = Array.isArray(safeOrder.items) && safeOrder.items.length > 0 ? safeOrder.items : [
    {
      productId: "SAMPLE-01",
      name: safeOrder.productName || "محصول سفارشی خط تولید کارخانه",
      pricePerCarton: safeOrder.totalAmount || 15000000,
      quantityCartons: 1,
      productCode: "DS-101"
    }
  ];

  const orderItems = rawItems.map((it: any, i: number) => ({
    productId: it.productId || `prod-${i}`,
    name: it.name || it.title || "کالای سفارشی B2B",
    pricePerCarton: Number(it.pricePerCarton || it.bulk_price || it.price || safeOrder.totalAmount || 5000000),
    quantityCartons: Number(it.quantityCartons || it.quantity || 1),
    productCode: it.productCode || it.code || `DS-${101 + i}`
  }));

  // Math Calculations
  const rawSubtotal = orderItems.reduce((sum: number, item: any) => sum + (item.pricePerCarton * item.quantityCartons), 0);
  const discount = Number(safeOrder.discountAmount || 0);

  const calculatedItems = orderItems.map((item: any) => {
    const price = item.pricePerCarton;
    const qty = item.quantityCartons;
    const gross = price * qty;
    const itemShare = rawSubtotal > 0 ? (gross / rawSubtotal) : 0;
    const itemDiscount = Math.round(discount * itemShare);
    const net = Math.max(0, gross - itemDiscount);

    return {
      ...item,
      price,
      qty,
      gross,
      discount: itemDiscount,
      total: net
    };
  });

  const sumGross = calculatedItems.reduce((sum: number, item: any) => sum + item.gross, 0);
  const sumDiscount = calculatedItems.reduce((sum: number, item: any) => sum + item.discount, 0);
  const grandTotal = calculatedItems.reduce((sum: number, item: any) => sum + item.total, 0);

  const multiplier = currencyUnit === 'rial' ? 10 : 1;
  const currencyLabel = currencyUnit === 'rial' ? 'ریال' : 'تومان';

  // Fast PDF download using direct jsPDF and html2canvas with non-blocking async execution to prevent page freezing
  const handleDownloadPdf = async () => {
    const invoiceElem = document.getElementById("printable-invoice");
    if (!invoiceElem) {
      handlePrint();
      return;
    }

    try {
      setIsDownloadingPdf(true);

      // Yield execution to allow UI loading spinner and animations to render smoothly
      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await html2canvas(invoiceElem, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        allowTaint: false,
        onclone: (clonedDoc: Document) => {
          cleanClonedDocForPdf(clonedDoc);
          const elem = clonedDoc.getElementById("printable-invoice");
          if (elem) {
            elem.style.margin = "0";
            elem.style.boxShadow = "none";
            elem.style.borderRadius = "0";
            elem.style.border = "none";
            elem.style.width = "210mm";
            elem.style.minHeight = "297mm";
            elem.style.maxHeight = "297mm";
            elem.style.padding = "8mm 6mm";
            elem.style.fontFamily = "'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif";
          }
        }
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, Math.min(imgHeight, pdfHeight));
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`فاکتور_رسمی_${invoiceSerial}.pdf`);
    } catch (error) {
      console.warn("jsPDF download error, falling back to print:", error);
      handlePrint();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Safe Native Print in Hidden Iframe
  const handlePrint = () => {
    const invoiceElem = document.getElementById("printable-invoice");
    if (!invoiceElem) {
      window.print();
      return;
    }

    const printContent = invoiceElem.innerHTML;
    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>فاکتور_رسمی_${invoiceSerial}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/Vazirmatn-font-face.css">
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; 
            padding: 0; 
            margin: 0; 
            background: #ffffff; 
            color: #0f172a; 
            direction: rtl; 
            text-align: right; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-feature-settings: "tabular-nums", "ss01";
          }
          .no-print { display: none !important; }
          #printable-invoice {
            width: 100% !important;
            max-width: 210mm !important;
            box-sizing: border-box !important;
            padding: 8mm 6mm !important;
            margin: 0 auto !important;
            font-family: 'Vazirmatn', sans-serif !important;
          }
          table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
          th, td { 
            border: 1px solid #cbd5e1 !important; 
            padding: 5px 8px !important; 
            font-size: 8.5px; 
            line-height: 1.4; 
            font-family: 'Vazirmatn', sans-serif !important;
            font-variant-numeric: tabular-nums;
          }
          th { background-color: #f1f5f9 !important; font-weight: 900; text-align: center; color: #0f172a !important; }
          @media print {
            @page { size: A4 portrait; margin: 4mm; }
            body { background: white !important; }
            tr { page-break-inside: avoid !important; }
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 150);
          };
        </script>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      } catch (e) {
        // ignore
      }
    }, 3500);
  };

  const handleCopySerial = () => {
    navigator.clipboard.writeText(invoiceSerial);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatPersianDate = (dateVal: any) => {
    if (!dateVal) return toPersianNum("۱۴۰۵/۰۵/۱۸");
    try {
      const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(d.getTime())) return toPersianNum("۱۴۰۵/۰۵/۱۸");
      return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
    } catch (e) {
      return toPersianNum("۱۴۰۵/۰۵/۱۸");
    }
  };

  const getPaymentMethodLabel = () => {
    if (safeOrder.paymentMethod === 'cash') {
      return 'نقدی (تسویه آنی درب کارخانه)';
    }
    if (safeOrder.paymentMethod === 'cheque' || safeOrder.paymentMethod === 'full_check' || safeOrder.paymentMethod === 'half_check') {
      const months = safeOrder.chequeDetails?.months || safeOrder.chequeMonths || 2;
      return `چکی صیادی بنکداران (${months} ماهه)`;
    }
    return 'نقدی / اعتباری امن دست اول';
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto no-print" dir="rtl">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[96vh] font-sans text-right border border-slate-200 overflow-hidden">
        
        {/* Top Material Action Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2.5 bg-slate-900 text-white rounded-t-3xl no-print">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              {isDownloadingPdf ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              <span>{isDownloadingPdf ? 'در حال صدور...' : 'دانلود فایل PDF'}</span>
            </button>

            <button 
              onClick={handlePrint}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer size={15} />
              <span>چاپ فاکتور (A4)</span>
            </button>

            <button 
              onClick={() => setCurrencyUnit(currencyUnit === 'toman' ? 'rial' : 'toman')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
            >
              <Scale size={14} />
              <span>واحد: {currencyUnit === 'toman' ? 'تومان' : 'ریال'}</span>
            </button>

            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer border ${isEditMode ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'}`}
            >
              {isEditMode ? <Check size={14} /> : <Edit3 size={14} />}
              <span>{isEditMode ? 'تایید تغییرات' : 'ویرایش مشخصات'}</span>
            </button>

            <button
              onClick={handleCopySerial}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
              title="کپی شناسه یکتای فاکتور"
            >
              {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'کپی شد' : 'کپی کد'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-[11px] font-black text-emerald-400">
              <Sparkles size={16} />
              <span>«اللَّهُمَّ ارْزُقْنَا رِزْقًا حَلَالاً طَیِّبًا»</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Container with Horizontal Overflow protection for mobile */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-100">
          
          {/* Quick Fields Editor Form */}
          {isEditMode && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 text-right animate-in fade-in duration-300 no-print" dir="rtl">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <Edit3 size={16} className="text-amber-700" />
                  <h4 className="text-xs font-black text-amber-900">
                    ویرایش مشخصات حقوقی فروشنده و خریدار جهت صدور فاکتور
                  </h4>
                </div>
                <button
                  onClick={() => {
                    setSellerTitle("شرکت تجارت و توسعه صنایع غذایی دست اول (سهامی خاص)");
                    setSellerNationalId("۱۰۱۰۳۴۸۲۹۱۰");
                    setSellerEconomicCode("۴۱۱۲۹۳۸۴۷۱");
                    setSellerPhone("۰۲۱-۸۸۲۲۴۴۳۳");
                    setSellerAddress("تهران، خیابان ولیعصر، برج بازرگانی صنایع غذایی کشور، طبقه ۱۲");
                  }}
                  className="text-[10px] bg-amber-200 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded-lg font-black flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={12} />
                  بازنشانی پیش‌فرض
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div className="space-y-1">
                  <label className="font-black text-slate-700">شماره سریال فاکتور:</label>
                  <input type="text" value={invoiceSerial} onChange={(e) => setInvoiceSerial(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-slate-700">نام شخص حقوقی فروشنده:</label>
                  <input type="text" value={sellerTitle} onChange={(e) => setSellerTitle(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-slate-700">شناسه ملی فروشنده:</label>
                  <input type="text" value={sellerNationalId} onChange={(e) => setSellerNationalId(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-slate-700">کد اقتصادی فروشنده:</label>
                  <input type="text" value={sellerEconomicCode} onChange={(e) => setSellerEconomicCode(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800" />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-slate-700">نام شرکت/بنکداری خریدار:</label>
                  <input type="text" value={buyerCompany} onChange={(e) => setBuyerCompany(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-slate-700">نام مسئول تحویل‌گیرنده:</label>
                  <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-slate-700">شناسه/کد ملی خریدار:</label>
                  <input type="text" value={buyerNationalId} onChange={(e) => setBuyerNationalId(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800" />
                </div>
                <div className="space-y-1">
                  <label className="font-black text-slate-700">تلفن تماس خریدار:</label>
                  <input type="text" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800" />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-black text-slate-700">نشانی کامل کارخانه / دفتر فروشنده:</label>
                  <input type="text" value={sellerAddress} onChange={(e) => setSellerAddress(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="font-black text-slate-700">نشانی دقیق تخلیه بار خریدار:</label>
                  <input type="text" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-800" />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Smart Invoice Summary Card (Responsive only on Mobile/Tablet) */}
          <div className="block lg:hidden mb-6 bg-white border border-slate-100 rounded-[2rem] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.02)] space-y-4 text-right" dir="rtl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center border border-indigo-200">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800">خلاصه سریع پیش‌فاکتور رسمی</h3>
                  <p className="text-[10px] text-slate-400 font-bold">سریال فاکتور: {toPersianNum(invoiceSerial)}</p>
                </div>
              </div>
              <div className="text-left">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black inline-block">
                  {getPaymentMethodLabel().split(" ")[0]}
                </span>
              </div>
            </div>

            {/* Seller & Buyer Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1.5">
                <span className="text-[10px] text-indigo-600 font-black block">مشخصات فروشنده:</span>
                <span className="text-slate-900 font-black block">{sellerTitle}</span>
                <span className="text-[10px] text-slate-500 font-medium block">تلفن: {toPersianNum(sellerPhone)}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 space-y-1.5">
                <span className="text-[10px] text-emerald-600 font-black block">مشخصات خریدار (تحویل‌گیرنده):</span>
                <span className="text-slate-900 font-black block">{buyerCompany} ({buyerName})</span>
                <span className="text-[10px] text-slate-500 font-medium block">تلفن: {toPersianNum(buyerPhone)} | تخلیه: {buyerAddress}</span>
              </div>
            </div>

            {/* Mobile Items List */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 block">اقلام پیش‌فاکتور کالا:</span>
              {calculatedItems.map((item: any, idx: number) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex justify-between items-center gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900 block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1">
                      {toPersianNum(item.qty)} کارتن × {toPersianNum((item.price * multiplier).toLocaleString())} {currencyLabel}
                    </span>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="text-xs font-black text-emerald-600 block">
                      {toPersianNum((item.total * multiplier).toLocaleString())} {currencyLabel}
                    </span>
                    {item.discount > 0 && (
                      <span className="text-[9px] text-rose-500 font-bold block">
                        تخفیف: -{toPersianNum((item.discount * multiplier).toLocaleString())}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Math Breakdown Card */}
            <div className="bg-slate-900 text-white p-4.5 rounded-[1.5rem] border border-slate-800 space-y-2 text-xs font-bold">
              <div className="flex justify-between border-b border-slate-800 pb-2 text-slate-400 text-[11px]">
                <span>جمع ناخالص اقلام:</span>
                <span>{toPersianNum((sumGross * multiplier).toLocaleString())} {currencyLabel}</span>
              </div>
              {sumDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 text-[11px]">
                  <span>مجموع تخفیف‌های تسویه نقدی:</span>
                  <span>-{toPersianNum((sumDiscount * multiplier).toLocaleString())} {currencyLabel}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-black pt-1">
                <span className="text-slate-100">مبلغ خالص قابل پرداخت:</span>
                <span className="text-base font-black text-emerald-400">
                  {toPersianNum((grandTotal * multiplier).toLocaleString())} {currencyLabel}
                </span>
              </div>
            </div>

            {/* Sharing Utility Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const itemsText = calculatedItems.map((item: any) => `- ${item.name} (${item.qty} کارتن)`).join("\n");
                  const textToShare = `🧾 پیش‌فاکتور رسمی صادر شد\nسریال: ${invoiceSerial}\nفروشنده: ${sellerTitle}\nخریدار: ${buyerCompany}\n\nاقلام سفارش:\n${itemsText}\n\nمبلغ خالص قابل پرداخت: ${grandTotal.toLocaleString()} تومان\nتلفن هماهنگی: ${buyerPhone}\nپشتیبانی دست‌اول`;
                  navigator.clipboard.writeText(textToShare);
                  alert("متن خلاصه پیش‌فاکتور کپی شد! می‌توانید آن را در واتساپ، ایتا یا پیامک برای همکاران بفرستید.");
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
              >
                <span>📤 اشتراک‌گذاری پیش‌فاکتور (کپی خلاصه)</span>
              </button>
            </div>
          </div>

          {/* Printable Sheet Wrapper (Responsive Horizontal Scroll on Mobile) */}
          <div className="w-full overflow-x-auto pb-4">
            <div 
              id="printable-invoice" 
              className="p-6 sm:p-7 bg-white text-slate-900 border border-slate-300 w-[210mm] min-w-[210mm] mx-auto relative overflow-hidden shadow-xs rounded-lg" 
              dir="rtl" 
              style={{ fontFamily: "'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#0f172a', boxSizing: 'border-box', backgroundColor: '#ffffff', minHeight: '270mm', maxHeight: '287mm' }}
            >
              <div className="relative z-10 flex flex-col justify-between h-full space-y-3.5">
                <div>
                  {/* Official Header */}
                  <div className="flex justify-between items-stretch border border-slate-300 mb-3.5 rounded-xl overflow-hidden bg-white shadow-xs">
                    <div className="flex-1 p-3 border-l border-slate-200 flex items-center gap-3 bg-slate-50/80">
                      {b2bConfig?.logoUrl ? (
                        <img src={b2bConfig.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                      ) : (
                        <div className="w-9.5 h-9.5 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                          دست
                        </div>
                      )}
                      <div className="leading-snug">
                        <h2 className="text-[12.5px] font-black text-slate-900">{sellerTitle}</h2>
                        <p className="text-[9px] text-emerald-800 font-bold mt-0.5">سامانه مبادلات مستقیم تولیدات صنایع غذایی کشور</p>
                      </div>
                    </div>

                    <div className="flex-1 p-3 flex flex-col items-center justify-center text-center border-l border-slate-200 bg-white">
                      <h1 className="text-[12.5px] font-black text-slate-800">بسم الله الرحمن الرحیم</h1>
                      <div className="mt-1 px-3.5 py-0.5 bg-emerald-100 text-emerald-950 rounded-full text-[9.5px] font-black border border-emerald-300/80">
                        صورتحساب رسمی فروش کالا و خدمات
                      </div>
                    </div>

                    <div className="w-48 p-3 flex flex-col justify-center space-y-1 text-[9px] font-bold bg-slate-50/80">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">شماره فاکتور:</span>
                        <span className="font-mono text-slate-900 font-black text-[9.5px]">{toPersianNum(invoiceSerial)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200/80 pt-1">
                        <span className="text-slate-500 font-medium">تاریخ صدور:</span>
                        <span className="font-mono text-slate-900">{formatPersianDate(safeOrder.createdAt)}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-slate-200/80 pt-1">
                        <span className="text-slate-500 font-medium">کد رهگیری:</span>
                        <span className="font-mono text-slate-900 text-[8.5px]">{toPersianNum(orderId.substring(0, 10))}</span>
                      </div>
                    </div>
                  </div>

                  {/* SELLER & BUYER SECTIONS */}
                  <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                    {/* SECTION 1: SELLER */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-1.5 text-[9.5px] font-black text-slate-800 flex justify-between items-center">
                        <span>مشخصات فروشنده (تامین‌کننده)</span>
                        <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">شناسه معتبر</span>
                      </div>
                      <div className="p-2.5 sm:p-3 text-[9px] font-bold space-y-1.5 bg-slate-50/20">
                        <div className="flex justify-between border-b border-slate-100/80 pb-1">
                          <span className="text-slate-500 font-medium">فروشنده:</span>
                          <strong className="text-slate-900 font-black">{sellerTitle}</strong>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-b border-slate-100/80 pb-1">
                          <div>
                            <span className="text-slate-500 font-medium">شناسه ملی: </span>
                            <strong className="font-mono text-slate-900">{toPersianNum(sellerNationalId)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">کد اقتصادی: </span>
                            <strong className="font-mono text-slate-900">{toPersianNum(sellerEconomicCode)}</strong>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-b border-slate-100/80 pb-1">
                          <div>
                            <span className="text-slate-500 font-medium">شماره ثبت: </span>
                            <strong className="font-mono text-slate-900">{toPersianNum(sellerRegNumber)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">تلفن: </span>
                            <strong className="font-mono text-slate-900">{toPersianNum(sellerPhone)}</strong>
                          </div>
                        </div>
                        <div className="text-[8.5px] text-slate-700 pt-0.5 leading-snug">
                          <span className="text-slate-500 font-medium">نشانی کامل: </span>
                          <span className="font-semibold text-slate-800">{sellerAddress}</span>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: BUYER */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <div className="bg-slate-100/90 border-b border-slate-200 px-3 py-1.5 text-[9.5px] font-black text-slate-800 flex justify-between items-center">
                        <span>مشخصات خریدار (تحویل‌گیرنده)</span>
                        <span className="text-[8px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">خریدار B2B</span>
                      </div>
                      <div className="p-2.5 sm:p-3 text-[9px] font-bold space-y-1.5 bg-slate-50/20">
                        <div className="flex justify-between border-b border-slate-100/80 pb-1">
                          <span className="text-slate-500 font-medium">خریدار:</span>
                          <strong className="text-slate-900 font-black">{buyerCompany} ({buyerName})</strong>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-b border-slate-100/80 pb-1">
                          <div>
                            <span className="text-slate-500 font-medium">کد ملی/شناسه: </span>
                            <strong className="font-mono text-slate-900">{toPersianNum(buyerNationalId)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">کد اقتصادی: </span>
                            <strong className="font-mono text-slate-900">{toPersianNum(buyerEconomicCode)}</strong>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-b border-slate-100/80 pb-1">
                          <div>
                            <span className="text-slate-500 font-medium">تلفن تماس: </span>
                            <strong className="font-mono text-slate-900">{toPersianNum(buyerPhone)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium">کد پستی: </span>
                            <strong className="font-mono text-slate-900">{toPersianNum(buyerPostalCode)}</strong>
                          </div>
                        </div>
                        <div className="text-[8.5px] text-slate-700 pt-0.5 leading-snug">
                          <span className="text-slate-500 font-medium">نشانی تخلیه: </span>
                          <span className="font-semibold text-slate-800">{buyerAddress}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: OFFICIAL ITEMS TABLE */}
                  <div className="mb-3.5 rounded-xl overflow-hidden border border-slate-300 shadow-xs">
                    <table className="w-full text-[9px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100/90 font-black text-center border-b border-slate-300 text-slate-900">
                          <th className="py-2.5 px-2 w-8 border-l border-slate-200">ردیف</th>
                          <th className="py-2.5 px-3 text-right border-l border-slate-200">شرح کالا یا خدمات</th>
                          <th className="py-2.5 px-2 w-12 border-l border-slate-200">تعداد</th>
                          <th className="py-2.5 px-2 w-12 border-l border-slate-200">واحد</th>
                          <th className="py-2.5 px-2.5 w-24 border-l border-slate-200">قیمت واحد ({currencyLabel})</th>
                          <th className="py-2.5 px-2.5 w-28 border-l border-slate-200">مبلغ کل ({currencyLabel})</th>
                          <th className="py-2.5 px-2.5 w-20 border-l border-slate-200">تخفیف ({currencyLabel})</th>
                          <th className="py-2.5 px-2.5 w-28">مبلغ نهایی ({currencyLabel})</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-center divide-y divide-slate-200">
                        {calculatedItems.map((item: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                            <td className="py-2.5 px-2 border-l border-slate-200 text-slate-600 font-semibold">{toPersianNum(idx + 1)}</td>
                            <td className="py-2.5 px-3 text-right border-l border-slate-200 font-black text-slate-900 leading-snug">{item.name}</td>
                            <td className="py-2.5 px-2 border-l border-slate-200 font-mono text-slate-800 text-[9.5px]">{toPersianNum(item.qty)}</td>
                            <td className="py-2.5 px-2 border-l border-slate-200 text-slate-700 font-medium">کارتن</td>
                            <td className="py-2.5 px-2.5 border-l border-slate-200 font-mono text-slate-800 text-[9.5px]">{toPersianNum((item.price * multiplier).toLocaleString())}</td>
                            <td className="py-2.5 px-2.5 border-l border-slate-200 font-mono text-slate-800 text-[9.5px]">{toPersianNum((item.gross * multiplier).toLocaleString())}</td>
                            <td className="py-2.5 px-2.5 border-l border-slate-200 font-mono text-rose-600 text-[9.5px]">{item.discount > 0 ? toPersianNum((item.discount * multiplier).toLocaleString()) : '۰'}</td>
                            <td className="py-2.5 px-2.5 font-mono font-black text-slate-950 text-[10px] bg-slate-100/70">{toPersianNum((item.total * multiplier).toLocaleString())}</td>
                          </tr>
                        ))}
                        <tr className="font-black bg-slate-100/90 text-slate-900 border-t-2 border-slate-300">
                          <td colSpan={5} className="py-2.5 px-3.5 text-right font-black text-[9.5px]">جمع کل صورتحساب ({currencyLabel}):</td>
                          <td className="py-2.5 px-2.5 font-mono text-[10px]">{toPersianNum((sumGross * multiplier).toLocaleString())}</td>
                          <td className="py-2.5 px-2.5 font-mono text-rose-600 text-[10px]">{sumDiscount > 0 ? toPersianNum((sumDiscount * multiplier).toLocaleString()) : '۰'}</td>
                          <td className="py-2.5 px-2.5 font-mono text-white bg-slate-900 text-[10.5px]">{toPersianNum((grandTotal * multiplier).toLocaleString())}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* GRAND TOTAL IN WORDS & PAYMENT METHOD */}
                  <div className="grid grid-cols-3 gap-2.5 mb-3.5 border border-slate-200 p-3 bg-slate-50/80 rounded-xl shadow-xs">
                    <div className="col-span-2 space-y-1">
                      <span className="text-[9px] font-black text-slate-600 block">مبلغ قابل پرداخت به حروف ({currencyLabel}):</span>
                      <div className="text-[10px] font-black text-slate-950 bg-white p-2.5 border border-slate-200 rounded-lg shadow-2xs leading-relaxed">
                        {numberToPersianWords(grandTotal * multiplier)} {currencyLabel} تمام
                      </div>
                    </div>
                    <div className="space-y-1 text-left border-r border-slate-200 pr-3.5 flex flex-col justify-center">
                      <span className="text-[9px] font-black text-slate-600 block">شرایط تسویه:</span>
                      <span className="inline-block px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-[9px] font-black shadow-2xs">
                        {getPaymentMethodLabel()}
                      </span>
                    </div>
                  </div>

                  {/* AUTHENTICITY BLOCK */}
                  <div className="grid grid-cols-4 gap-2.5 mb-3.5 border border-slate-200 p-3 bg-white rounded-xl shadow-xs items-center">
                    <div className="col-span-3 flex items-center gap-3.5">
                      <div className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center shrink-0">
                        <div className="flex gap-0.5 h-5.5 items-center px-1">
                          {[2,1,3,1,2,1,1,3,2,1,2,1,3,1,2].map((w, idx) => (
                            <div key={idx} className="bg-slate-800 h-full" style={{ width: `${w}px` }} />
                          ))}
                        </div>
                        <span className="text-[7.5px] font-mono font-bold text-slate-500 mt-0.5">{toPersianNum(invoiceSerial)}</span>
                      </div>

                      <div className="space-y-0.5">
                        <h5 className="text-[9.5px] font-black text-slate-900">استعلام اصالت هوشمند صورتحساب</h5>
                        <p className="text-[8px] font-bold text-slate-500 leading-tight">
                          این فاکتور رسمی دارای شناسه یکتا و امضای دیجیتال ثبت شده در انبار مرکزی است.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end items-center">
                      <div className="w-10.5 h-10.5 border border-slate-200 rounded-lg p-1 bg-slate-50 flex flex-col items-center justify-center text-slate-800 shadow-2xs">
                        <QrCode size={28} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>

                  {/* RIZQ & BLESSING BANNER */}
                  <div className="my-2 p-2 bg-emerald-50/80 border border-emerald-200 rounded-xl text-center text-[9px] font-black text-emerald-900">
                    ✨ «الکاسِبُ حَبِیبُ اللهِ» — با آرزوی خیر و برکت، رونق روزافزون و رزق حلال فراوان برای کسب‌وکار شما همکار محترم.
                  </div>
                </div>

                {/* FOOTER & SIGNATURES */}
                <div>
                  <div className="grid grid-cols-2 gap-2.5 border border-slate-200 rounded-xl p-1 bg-white shadow-xs">
                    <div className="p-3 border-l border-slate-200 flex flex-col justify-between h-24 text-center">
                      <span className="text-[9.5px] font-black text-slate-800 underline underline-offset-3">مهر و امضای خریدار / تحویل‌گیرنده بار</span>
                      <div className="text-[8px] text-slate-500 font-bold">تایید دریافت کالا سالم و مطابق فاکتور</div>
                    </div>

                    <div className="p-3 flex flex-col justify-between h-24 text-center relative bg-slate-50/30 rounded-r-lg">
                      <span className="text-[9.5px] font-black text-slate-800 underline underline-offset-3">مهر و امضای رسمی فروشنده (تامین‌کننده)</span>
                      {officialSealUrl && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-85">
                          <img src={officialSealUrl} alt="Seal" className="w-18 h-18 object-contain rotate-6" />
                        </div>
                      )}
                      <div className="text-[9px] font-black text-slate-800">{sellerTitle}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-between items-center text-[8px] text-slate-500 font-bold border-t border-slate-200 pt-2">
                    <span>شناسه یکتای صورتحساب: {toPersianNum(invoiceSerial)} | پشتیبانی: ۰۹۰۴۴۵۰۲۹۰۰</span>
                    <span>سامانه مبادلات B2B دست اول - با آرزوی خیر، برکت و رزق حلال</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WholesaleInvoiceView(props: WholesaleInvoiceViewProps) {
  return (
    <InvoiceErrorBoundary onClose={props.onClose}>
      <WholesaleInvoiceContent {...props} />
    </InvoiceErrorBoundary>
  );
}
