import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe, Upload, FileCode, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw,
  X, Layers, PackageCheck, Eye, Sparkles, FileJson, ArrowLeft, Database, Trash2
} from 'lucide-react';
import {
  smartFetchJsonWithMultiProxy, extractProductsFromRawData,
  normalizeProductItems, DEFAULT_PARSPACK_CATALOG_BACKUP, ParsedProductItem
} from '../lib/jsonCatalogImporter';
const toPersianNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null) return "";
  const persianDigits: Record<string, string> = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
    "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
  };
  return num.toString().replace(/[0-9]/g, (w) => persianDigits[w] || w);
};

interface SmartJsonCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProducts: (newProducts: ParsedProductItem[], importMode: 'merge' | 'replace') => void;
  defaultUrl?: string;
}

export const SmartJsonCatalogModal: React.FC<SmartJsonCatalogModalProps> = ({
  isOpen,
  onClose,
  onApplyProducts,
  defaultUrl = "http://c102393.parspack.net/c102393/catalog.json"
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'upload' | 'paste' | 'preset'>('url');
  const [jsonUrl, setJsonUrl] = useState(defaultUrl);
  const [pastedJson, setPastedJson] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Extracted preview state
  const [previewProducts, setPreviewProducts] = useState<ParsedProductItem[]>([]);
  const [detectedMethod, setDetectedMethod] = useState<string>("");
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  if (!isOpen) return null;

  // Channel 1: Fetch via Multi-Proxy URL
  const handleFetchFromUrl = async () => {
    if (!jsonUrl.trim()) {
      setErrorMsg("لطفاً آدرس صحیح فایل JSON کاتالوگ را وارد کنید.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setStatusLogs([]);
    setPreviewProducts([]);

    try {
      const result = await smartFetchJsonWithMultiProxy(jsonUrl, (msg) => {
        setStatusLogs(prev => [...prev, msg]);
      });

      const rawItems = extractProductsFromRawData(result.rawData);
      if (!rawItems || rawItems.length === 0) {
        throw new Error("فایل JSON دریافت گردید اما هیچ اطلاعات محصولی در آن شناسایی نشد.");
      }

      const normalized = normalizeProductItems(rawItems);
      setPreviewProducts(normalized);
      setDetectedMethod(result.method);
      setSuccessMsg(`تعداد ${normalized.length} محصول با موفقیت از طریق (${result.method}) شناسایی گردید.`);
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در دریافت و استخراج اطلاعات فایل JSON");
    } finally {
      setIsLoading(false);
    }
  };

  // Channel 2: File Upload (Drag & Drop / Picker)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewProducts([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsedData = JSON.parse(text.replace(/^\uFEFF/, '').trim());
        const rawItems = extractProductsFromRawData(parsedData);

        if (!rawItems || rawItems.length === 0) {
          throw new Error("فایل JSON انتخاب‌شده معتبر است اما ساختار محصولی در آن یافت نشد.");
        }

        const normalized = normalizeProductItems(rawItems);
        setPreviewProducts(normalized);
        setDetectedMethod(`مستقیم از فایل کامپیوتر/گوشی (${file.name})`);
        setSuccessMsg(`تعداد ${normalized.length} محصول از فایل local شناسایی شد.`);
      } catch (err: any) {
        setErrorMsg(`خطا در خواندن فایل JSON: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg("خطا در خواندن فایل از حافظه.");
      setIsLoading(false);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Channel 3: Paste JSON Text
  const handleParsePastedText = () => {
    if (!pastedJson.trim()) {
      setErrorMsg("لطفاً کدهای JSON را در کادر پیست نمایید.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewProducts([]);

    try {
      const parsedData = JSON.parse(pastedJson.replace(/^\uFEFF/, '').trim());
      const rawItems = extractProductsFromRawData(parsedData);

      if (!rawItems || rawItems.length === 0) {
        throw new Error("متن واردشده ساختار JSON معتبر دارد اما هیچ لیست محصولی درون آن یافت نشد.");
      }

      const normalized = normalizeProductItems(rawItems);
      setPreviewProducts(normalized);
      setDetectedMethod("متن پیست‌شده متنی (Direct Paste)");
      setSuccessMsg(`تعداد ${normalized.length} محصول از کدهای پیست‌شده با موفقیت پردازش شد.`);
    } catch (err: any) {
      setErrorMsg(`خطا در پارس کدهای JSON: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Channel 4: Load Default Preset Backup
  const handleLoadBackupPreset = () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setPreviewProducts([]);

    setTimeout(() => {
      const rawItems = extractProductsFromRawData(DEFAULT_PARSPACK_CATALOG_BACKUP);
      const normalized = normalizeProductItems(rawItems);
      setPreviewProducts(normalized);
      setDetectedMethod("کاتالوگ پیش‌فرض باکت پارس‌پک (نسخه پشتیبان محلی)");
      setSuccessMsg(`تعداد ${normalized.length} محصول اصلی باکت پارس‌پک آماده بارگذاری است.`);
      setIsLoading(false);
    }, 200);
  };

  // Final Action: Apply to Store
  const handleConfirmImport = () => {
    if (previewProducts.length === 0) return;
    onApplyProducts(previewProducts, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] my-auto text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FileJson size={24} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                موتور هوشمند همگام‌سازی و بارگذاری کاتالوگ JSON
                <span className="text-[10px] font-black bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">نسخه ۵ پروکسی</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                دریافت آنلاین کاتالوگ محصولات باکت یا بارگذاری آفلاین فایل
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Globe size={15} />
            لینک آنلاین باکت (URL)
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Upload size={15} />
            آپلود فایل JSON
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCode size={15} />
            پیست مستقیم متن JSON
          </button>

          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'preset'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShieldCheck size={15} />
            کاتالوگ پشتیبان ایمن
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Messages */}
          {errorMsg && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-3">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <div>{successMsg}</div>
            </div>
          )}

          {/* TAB 1: URL Fetch */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-xs font-black text-slate-700">
                  آدرس دقیق لینک مستقیم فایل کاتالوگ JSON (پارس‌پک یا هوم‌سرور):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={jsonUrl}
                    onChange={(e) => setJsonUrl(e.target.value)}
                    dir="ltr"
                    placeholder="http://c102393.parspack.net/c102393/catalog.json"
                    className="flex-1 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none transition-all"
                  />
                  <button
                    onClick={handleFetchFromUrl}
                    disabled={isLoading}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        در حال همگام‌سازی...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        همگام‌سازی و استخراج
                      </>
                    )}
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                  <span>لینک‌های سریع تست:</span>
                  <button
                    type="button"
                    onClick={() => setJsonUrl("http://c102393.parspack.net/c102393/catalog.json")}
                    className="text-indigo-600 hover:underline font-bold font-mono text-[10px]"
                  >
                    c102393.parspack.net (اصلی باکت)
                  </button>
                </div>
              </div>

              {/* Status logs */}
              {statusLogs.length > 0 && (
                <div className="bg-slate-900 text-slate-300 p-4 rounded-2xl font-mono text-[11px] space-y-1.5 max-h-40 overflow-y-auto">
                  <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">گزارش لحظه‌ای لایه‌های پروکسی:</div>
                  {statusLogs.map((log, idx) => (
                    <div key={idx} className="leading-tight">{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: File Upload */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/50 hover:bg-indigo-50 rounded-3xl p-8 text-center flex flex-col items-center justify-center cursor-pointer transition-all space-y-3">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                  <Upload size={28} />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">انتخاب یا درگ&دراپ فایل JSON از کامپیوتر</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    در صورت قطعی شبکه، فایل catalog.json یا هر فایل محصولات را اینجا آپلود کنید (بدون نیاز به اینترنت)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* TAB 3: Paste Text */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700">
                  متن کدهای JSON را مستقیماً اینجا پیست (Paste) کنید:
                </label>
                <textarea
                  rows={6}
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  dir="ltr"
                  placeholder='[ { "name": "روغن سونار", "factoryPrice": 2000000, ... } ]'
                  className="w-full bg-slate-50 border border-slate-300 focus:border-indigo-500 rounded-2xl p-4 text-xs font-mono text-slate-800 outline-none transition-all"
                />
              </div>
              <button
                onClick={handleParsePastedText}
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FileCode size={16} />
                استخراج محصولات از متن
              </button>
            </div>
          )}

          {/* TAB 4: Preset Backup */}
          {activeTab === 'preset' && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-3xl p-6 space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">کاتالوگ پشتیبان و ایمن باکت دست‌اول</h4>
                <p className="text-xs text-slate-600 font-medium max-w-lg mx-auto mt-1 leading-relaxed">
                  نسخه کامل کالاهای استاندارد باکت پارس‌پک به‌صورت پیش‌فرض در حافظه سیستم ذخیره شده است. اگر سرور مبدا کاملاً قطع باشد، می‌توانید با یک کلیک این کاتالوگ را بارگذاری کنید.
                </p>
              </div>
              <button
                onClick={handleLoadBackupPreset}
                disabled={isLoading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Database size={16} />
                بارگذاری فوری کاتالوگ ایمن باکت
              </button>
            </div>
          )}

          {/* PREVIEW OF DETECTED PRODUCTS */}
          {previewProducts.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/80 p-4 rounded-2xl border border-indigo-150">
                <div>
                  <div className="text-xs font-black text-indigo-950 flex items-center gap-2">
                    <PackageCheck size={18} className="text-indigo-600" />
                    تعداد {toPersianNum(previewProducts.length)} محصول آماده وارد کردن به انبار
                  </div>
                  {detectedMethod && (
                    <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                      روش استخراج: <span className="font-bold">{detectedMethod}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">حالت وارد کردن:</span>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as any)}
                    className="bg-white border border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 outline-none"
                  >
                    <option value="merge">به‌روزرسانی و ادغام (Merge)</option>
                    <option value="replace">جایگزینی کامل انبار (Replace)</option>
                  </select>
                </div>
              </div>

              {/* Table Preview */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white max-h-60 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-black sticky top-0 z-10">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">تصویر & نام</th>
                      <th className="p-3">دسته‌بندی / انبار</th>
                      <th className="p-3">قیمت کارخانه</th>
                      <th className="p-3">قیمت فروش عمده</th>
                      <th className="p-3">موجودی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-400 font-mono">{i + 1}</td>
                        <td className="p-3 flex items-center gap-2">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover border" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-slate-100 border flex items-center justify-center text-[10px]">عکس</div>
                          )}
                          <span className="font-bold text-slate-900">{p.name}</span>
                        </td>
                        <td className="p-3 text-slate-600">{p.category} • {p.brand}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{toPersianNum(p.factoryPrice.toLocaleString())} تومان</td>
                        <td className="p-3 font-mono font-bold text-emerald-700">{toPersianNum(p.sellPrice.toLocaleString())} تومان</td>
                        <td className="p-3 font-mono font-bold text-indigo-700">{toPersianNum(p.stockCartons)} کارتن</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            انصراف
          </button>

          {previewProducts.length > 0 && (
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              تایید و اعمال {toPersianNum(previewProducts.length)} محصول به انبار دست‌اول
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
