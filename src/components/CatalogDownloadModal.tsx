import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { X, Printer, FileText, CheckSquare, Square, Download, ShieldCheck, Info } from "lucide-react";

interface CatalogDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

export default function CatalogDownloadModal({ isOpen, onClose, products }: CatalogDownloadModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["همه"]);
  const [includePrices, setIncludePrices] = useState(true);
  const [includeMargins, setIncludeMargins] = useState(true);
  const [popupError, setPopupError] = useState(false);

  if (!isOpen) return null;

  const dynamicCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const categories = ["همه", ...dynamicCategories];

  const handleToggleCategory = (cat: string) => {
    if (cat === "همه") {
      setSelectedCategories(["همه"]);
    } else {
      let next = selectedCategories.filter(c => c !== "همه");
      if (next.includes(cat)) {
        next = next.filter(c => c !== cat);
        if (next.length === 0) next = ["همه"];
      } else {
        next.push(cat);
      }
      setSelectedCategories(next);
    }
  };

  const filteredProducts = selectedCategories.includes("همه")
    ? products
    : products.filter(p => selectedCategories.includes(p.category));

  const handlePrint = () => {
    setPopupError(false);
    // Generate a beautiful, print-optimized document window and invoke print
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
    const productRows = filteredProducts.map((p, idx) => {
      const margin = (((p.consumer_price || p.bulk_price * 1.5) - p.bulk_price) / p.bulk_price * 100).toFixed(1);
      const imgUrl = p.image_url || "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&q=80&w=200";

      return `
        <tr style="border-bottom: 1px solid #cbd5e1; font-family: Tahoma, Vazirmatn, sans-serif; font-size: 11px; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding: 8px; text-align: center; font-weight: bold; color: #475569;">${idx + 1}</td>
          <td style="padding: 8px; font-weight: bold; color: #1e293b;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <img src="${imgUrl}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff;" />
              <div>
                <div style="font-size: 11px; color: #047857; font-weight: 800;">${p.brand || 'کارخانه'}</div>
                <div style="font-size: 12px; margin-top: 2px; color: #0f172a;">${p.name}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 2px;">کد کالا: DAST-${p.id.slice(0,6)}</div>
              </div>
            </div>
          </td>
          <td style="padding: 8px; text-align: center; color: #334155; font-weight: bold;">${p.carton_pack_count} ${p.unit || 'عدد'} در کارتن</td>
          ${includePrices ? `
            <td style="padding: 8px; font-weight: 800; font-size: 12px; text-align: right; color: #047857;">${p.bulk_price.toLocaleString()} تومان</td>
            <td style="padding: 8px; font-size: 11px; text-align: right; color: #64748b;">${(p.consumer_price || Math.round(p.bulk_price * 1.3)).toLocaleString()} تومان</td>
          ` : ""}
          ${includeMargins ? `
            <td style="padding: 8px; text-align: center; font-weight: 800; color: #059669; background: #ecfdf5; border-radius: 6px;">٪${margin}</td>
          ` : ""}
          <td style="padding: 8px; color: #475569; font-size: 10px;">${p.pack_description || "تحویل درب انبار اصلی کارخانه"}</td>
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
          <title>کاتالوگ رسمی بازرگانی دست اول</title>
          <style>
            @media print {
              body { margin: 1cm; }
            }
            body {
              font-family: Tahoma, sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              padding: 20px;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              border-bottom: 3px solid #047857;
              padding-bottom: 15px;
            }
            .title {
              font-size: 24px;
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
              padding: 10px;
              background-color: #f8fafc;
              font-size: 11px;
              border-radius: 8px;
              width: 250px;
            }
            .product-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .product-table th {
              background-color: #047857;
              color: #ffffff;
              padding: 12px 10px;
              font-size: 12px;
              font-weight: bold;
              text-align: right;
            }
            .product-table th.center {
              text-align: center;
            }
            .footer {
              margin-top: 50px;
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
                <h1 class="title">بازرگانی دست اول</h1>
                <div class="subtitle">کاتالوگ رسمی قیمت همکاری محصولات مستقیم از درب کارخانجات کشور</div>
              </td>
              <td style="text-align: left; vertical-align: middle;">
                <div class="info-box">
                  <div style="margin-bottom: 4px;"><strong>تاریخ کاتالوگ:</strong> ${persianDate}</div>
                  <div style="margin-bottom: 4px;"><strong>مرجع توزیع:</strong> پایگاه کشوری دست اول</div>
                  <div><strong>نوع قیمت‌گذاری:</strong> خرید کارتنی مستقیم</div>
                </div>
              </td>
            </tr>
          </table>

          <table class="product-table">
            <thead>
              <tr>
                <th class="center" style="width: 30px;">#</th>
                <th>نام برند و کالا</th>
                <th class="center" style="width: 100px;">تعداد در کارتن</th>
                ${includePrices ? `
                  <th style="width: 120px; text-align: right;">قیمت عمده (همکاری)</th>
                  <th style="width: 120px; text-align: right;">قیمت مصرف‌کننده روی جلد</th>
                ` : ""}
                ${includeMargins ? `
                  <th class="center" style="width: 80px;">سود فروشنده</th>
                ` : ""}
                <th>توضیحات و ارسال</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <div style="margin-top: 30px; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 12px; font-size: 11px; line-height: 1.6; color: #166534;">
            <strong>⚠️ ضوابط و قوانین خرید:</strong> ثبت سفارشات کاتالوگ فوق منحصراً از طریق وب‌سایت یا اپلیکیشن تجاری "دست اول" صورت می‌گیرد. نرخ‌های همکاری قید شده پلمپ بوده و شامل تضمین اصالت و گارانتی مرجوعی بار به واسطه آسیب حمل و نقل می‌باشند.
          </div>

          <div class="footer">
            این کاتالوگ تجاری به طور خودکار از پرتال بازرگانی دست اول (Dastavval.com) صادر گردیده است.
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
    csvContent += "ردیف,نام کالا,برند,دسته بندی,تعداد در کارتن,واحد,قیمت عمده (تومان),قیمت مصرف کننده (تومان),حاشیه سود خالص,مبدا ارسال\n";
    
    filteredProducts.forEach((p, idx) => {
      const margin = (((p.consumer_price || p.bulk_price * 1.5) - p.bulk_price) / p.bulk_price * 100).toFixed(1);
      const row = [
        idx + 1,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.brand.replace(/"/g, '""')}"`,
        `"${(p.category || "").replace(/"/g, '""')}"`,
        p.carton_pack_count,
        p.unit,
        p.bulk_price,
        p.consumer_price || p.bulk_price * 1.5,
        `${margin}%`,
        `"${(p.shipping_origin || "ارسال مستقیم").replace(/"/g, '""')}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dastavval_catalog_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4 text-right" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl border border-gray-100 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg">دانلود کاتالوگ و پی‌دی‌اف محصولات</h3>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">صادرات بروشور رسمی قیمت‌ها جهت ارائه به بنکداران و توزیع‌کنندگان</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover rounded-full transition-all text-gray-400 hover">
            <X size={18} />
          </button>
        </div>

        {/* Settings Form Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Options */}
          <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100/30 space-y-3">
            <h4 className="font-black text-xs text-emerald-800 flex items-center gap-1.5">
              <Info size={14} />
              تنظیمات کاتالوگ چاپی
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-gray-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={includePrices} 
                  onChange={e => setIncludePrices(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus border-gray-300 rounded"
                />
                <span>درج ستون قیمت همکاری پایه (عمده)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={includeMargins} 
                  onChange={e => setIncludeMargins(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus border-gray-300 rounded"
                />
                <span>نمایش حاشیه سود تخمینی فروشندگان</span>
              </label>
            </div>
          </div>

          {/* Categories Selector */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-2">فیلتر دسته‌بندی‌های موجود در کاتالوگ:</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => handleToggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-gray-500 border-gray-200 hover"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog Preview Box */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-2">
              پیش‌نمایش اقلام بروشور رسمی ({filteredProducts.length} کالا):
            </label>
            <div className="border border-gray-200 rounded-2xl max-h-48 overflow-y-auto divide-y divide-gray-100 text-xs font-bold text-gray-700 bg-slate-50/50">
              {filteredProducts.map((p, i) => (
                <div key={p.id} className="p-3 flex justify-between items-center bg-white hover">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300 font-mono text-[10px]">#{i+1}</span>
                    <span className="text-emerald-700 font-black">[{p.brand}]</span>
                    <span className="text-gray-900">{p.name}</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{p.carton_pack_count} {p.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-gray-100 bg-slate-50 flex flex-col gap-3">
          {popupError && (
            <div className="p-3 text-[11px] text-amber-800 bg-amber-50 rounded-xl border border-amber-200/40 font-black text-center animate-fade-in mb-1">
              ⚠ چاپ از طریق پنجره پرینت درون‌برنامه‌ای آغاز شد. در صورت عدم نمایش، دکمه دانلود مستقیم اکسل را امتحان کنید.
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Printer size={16} />
              چاپ بروشور / خروجی PDF
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download size={16} />
              دانلود مستقیم فایل اکسل (CSV)
            </button>
            <button
              onClick={onClose}
              className="px-5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
