import React, { useState } from 'react';
import { 
  FileText, 
  Save, 
  Upload, 
  Building2, 
  Percent, 
  CreditCard, 
  CheckCircle2, 
  Eye, 
  Plus, 
  Trash2,
  Phone,
  MapPin,
  ShieldAlert
} from 'lucide-react';

interface AdminInvoiceSettingsProps {
  b2bConfig: any;
  onUpdateB2bConfig: (updatedConfig: any) => Promise<void>;
}

export default function AdminInvoiceSettings({ b2bConfig, onUpdateB2bConfig }: AdminInvoiceSettingsProps) {
  const currentInv = b2bConfig?.invoiceSettings || {};

  // Form states
  const [sellerTitle, setSellerTitle] = useState(currentInv.sellerTitle || b2bConfig?.appName || "صنایع غذایی و بازرگانی دست اول");
  const [sellerNationalId, setSellerNationalId] = useState(currentInv.sellerNationalId || "۱۰۱۰۳۴۸۲۹۱۰");
  const [sellerRegNumber, setSellerRegNumber] = useState(currentInv.sellerRegNumber || "۸۸۴۹۲");
  const [sellerEconomicCode, setSellerEconomicCode] = useState(currentInv.sellerEconomicCode || "۴۱۱۲۹۳۸۴۷۱");
  const [sellerPhone, setSellerPhone] = useState(currentInv.sellerPhone || "۰۲۱-۸۸۲۲۴۴۳۳");
  const [sellerMobile, setSellerMobile] = useState(currentInv.sellerMobile || "۰۹۰۴۴۵۰۲۹۰۰");
  const [sellerAddress, setSellerAddress] = useState(currentInv.sellerAddress || "آذربایجان شرقی، شبستر، شهرک صنعتی شندآباد، بلوار کارآفرینان");
  
  const [cashDiscountPercent, setCashDiscountPercent] = useState<number>(currentInv.cashDiscountPercent !== undefined ? currentInv.cashDiscountPercent : 5);
  const [chequeMarkupPerMonthPercent, setChequeMarkupPerMonthPercent] = useState<number>(currentInv.chequeMarkupPerMonthPercent !== undefined ? currentInv.chequeMarkupPerMonthPercent : 6);

  const [officialSealUrl, setOfficialSealUrl] = useState(currentInv.officialSealUrl || b2bConfig?.officialSealUrl || "");
  const [catalogPdfUrl, setCatalogPdfUrl] = useState(b2bConfig?.catalogPdfUrl || "");
  const [footerNotes, setFooterNotes] = useState(currentInv.footerNotes || "این پیش‌فاکتور به منزله تاییدیه قطعی سفارش و رزرو کالا در خط تولید می‌باشد. کلیه مرسولات دارای بیمه ترانزیت جاده‌ای هستند.");

  const [bankAccounts, setBankAccounts] = useState<any[]>(currentInv.bankAccounts || [
    {
      bankName: "بانک ملی ایران",
      accountNumber: "۰۱۰۲۹۳۸۴۷۵۰۰۱",
      cardNumber: "۶۰۳۷-۹۹۷۵-۸۸۳۴-۱۲۹۰",
      shabaNumber: "IR620170000000102938475001",
      ownerName: "پلتفرم بازرگانی دست اول"
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(false);

  const handleAddAccount = () => {
    setBankAccounts([...bankAccounts, {
      bankName: "بانک صادرات",
      accountNumber: "",
      cardNumber: "",
      shabaNumber: "IR",
      ownerName: sellerTitle
    }]);
  };

  const handleRemoveAccount = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const handleAccountChange = (index: number, field: string, value: string) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setBankAccounts(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");

    try {
      const updatedInvoiceSettings = {
        sellerTitle,
        sellerNationalId,
        sellerRegNumber,
        sellerEconomicCode,
        sellerPhone,
        sellerMobile,
        sellerAddress,
        cashDiscountPercent: Number(cashDiscountPercent),
        chequeMarkupPerMonthPercent: Number(chequeMarkupPerMonthPercent),
        officialSealUrl,
        footerNotes,
        bankAccounts
      };

      const updatedB2bConfig = {
        ...b2bConfig,
        officialSealUrl,
        catalogPdfUrl,
        invoiceSettings: updatedInvoiceSettings
      };

      await onUpdateB2bConfig(updatedB2bConfig);
      setSuccessMsg("تنظیمات و عناوین فاکتور رسمی با موفقیت ذخیره شد.");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30">
            <FileText size={14} />
            <span>مدیریت کامل فاکتور و مدارک رسمی</span>
          </div>
          <h2 className="text-xl font-black">تنظیمات عناوین، مشخصات حقوقی و مهر/امضا فاکتور</h2>
          <p className="text-xs text-slate-400 font-bold">
            تنظیم صد درصدی مشخصات صادرکننده، درصد تخفیف نقدی، کارمزد چکی، حساب‌های بانکی و آپلود مهر رسمی
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLivePreview(!showLivePreview)}
          className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
        >
          <Eye size={16} />
          <span>{showLivePreview ? "بستن پیش‌نمایش" : "پیش‌نمایش زنده فاکتور"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-black flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Seller Info */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="text-emerald-600" size={18} />
            مشخصات صادرکننده (شرکت / کارخانه / بازرگانی)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">نام رسمی صادرکننده فاکتور *</label>
              <input
                type="text"
                required
                value={sellerTitle}
                onChange={e => setSellerTitle(e.target.value)}
                placeholder="مثال: صنایع غذایی و بازرگانی دست اول"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">شناسه ملی / کد ملی *</label>
              <input
                type="text"
                value={sellerNationalId}
                onChange={e => setSellerNationalId(e.target.value)}
                placeholder="مثال: ۱۰۱۰۳۴۸۲۹۱۰"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">شماره ثبت شرکت</label>
              <input
                type="text"
                value={sellerRegNumber}
                onChange={e => setSellerRegNumber(e.target.value)}
                placeholder="مثال: ۸۸۴۹۲"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">کد اقتصادی</label>
              <input
                type="text"
                value={sellerEconomicCode}
                onChange={e => setSellerEconomicCode(e.target.value)}
                placeholder="مثال: ۴۱۱۲۹۳۸۴۷۱"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">شماره تلفن ثابت دفتر مرکزی</label>
              <input
                type="text"
                value={sellerPhone}
                onChange={e => setSellerPhone(e.target.value)}
                placeholder="مثال: ۰۲۱-۸۸۲۲۴۴۳۳"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">شماره همراه پشتیبانی / واتساپ</label>
              <input
                type="text"
                value={sellerMobile}
                onChange={e => setSellerMobile(e.target.value)}
                placeholder="مثال: ۰۹۰۴۴۵۰۲۹۰۰"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">آدرس رسمی کارخانه یا دفتر مرکزی</label>
            <input
              type="text"
              value={sellerAddress}
              onChange={e => setSellerAddress(e.target.value)}
              placeholder="مثال: آذربایجان شرقی، شبستر، شهرک صنعتی شندآباد..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">لینک دانلود کاتالوگ PDF یا آپلود فایل</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={catalogPdfUrl}
                onChange={e => setCatalogPdfUrl(e.target.value)}
                placeholder="https://... یا بارگذاری فایل PDF"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
              />
              <label className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-2xl text-xs font-black cursor-pointer shrink-0 transition-all flex items-center gap-1.5">
                <span>انتخاب PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (uploadEvent) => {
                        if (uploadEvent.target?.result) {
                          setCatalogPdfUrl(uploadEvent.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            {catalogPdfUrl && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-emerald-600 font-bold">✓ فایل کاتالوگ آماده دانلود است</span>
                <a href={catalogPdfUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold underline">پیش‌نمایش</a>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Financial Rules (Cash Discount % & Cheque Markup %) */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="text-amber-500" size={18} />
            تنظیمات نرخ تخفیف نقدی و کارمزد چکی
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/60 space-y-3">
              <label className="block text-xs font-black text-emerald-900">
                درصد تخفیف تسویه نقدی (نقدی)٪
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={cashDiscountPercent}
                  onChange={e => setCashDiscountPercent(Number(e.target.value))}
                  className="w-full bg-white border border-emerald-300 rounded-xl px-4 py-2.5 text-sm font-black text-emerald-900 outline-none"
                />
                <span className="text-xs font-bold text-emerald-700">%</span>
              </div>
              <p className="text-[10px] text-emerald-700 font-bold leading-relaxed">
                این درصد به صورت کسر تخفیف از مجموع فاکتور خریدارانی که پرداخت نقدی را انتخاب می‌کنند اعمال می‌شود.
              </p>
            </div>

            <div className="bg-indigo-50/60 p-5 rounded-2xl border border-indigo-200/60 space-y-3">
              <label className="block text-xs font-black text-indigo-900">
                درصد افزایش کارمزد به ازای هر ۱ ماه چک٪
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={chequeMarkupPerMonthPercent}
                  onChange={e => setChequeMarkupPerMonthPercent(Number(e.target.value))}
                  className="w-full bg-white border border-indigo-300 rounded-xl px-4 py-2.5 text-sm font-black text-indigo-900 outline-none"
                />
                <span className="text-xs font-bold text-indigo-700">% در ماه</span>
              </div>
              <p className="text-[10px] text-indigo-700 font-bold leading-relaxed">
                مثال: اگر ۶٪ باشد، برای چک ۲ ماهه ۱۲٪ و برای چک ۳ ماهه ۱۸٪ به مبلغ اقلام فاکتور اضافه خواهد شد.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Bank Accounts */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <CreditCard className="text-blue-600" size={18} />
              حساب‌های بانکی صادرکننده جهت واریز وجه
            </h3>
            <button
              type="button"
              onClick={handleAddAccount}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1"
            >
              <Plus size={14} />
              <span>افزودن حساب جدید</span>
            </button>
          </div>

          <div className="space-y-4">
            {bankAccounts.map((acc, idx) => (
              <div key={idx} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3 relative">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800">حساب شماره {idx + 1}</span>
                  {bankAccounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAccount(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      <span>حذف</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">نام بانک</label>
                    <input
                      type="text"
                      value={acc.bankName}
                      onChange={e => handleAccountChange(idx, 'bankName', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">نام صاحب حساب</label>
                    <input
                      type="text"
                      value={acc.ownerName}
                      onChange={e => handleAccountChange(idx, 'ownerName', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">شماره حساب</label>
                    <input
                      type="text"
                      value={acc.accountNumber}
                      onChange={e => handleAccountChange(idx, 'accountNumber', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">شماره کارت</label>
                    <input
                      type="text"
                      value={acc.cardNumber}
                      onChange={e => handleAccountChange(idx, 'cardNumber', e.target.value)}
                      placeholder="۶۰۳۷-..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">شماره شبا (IBAN)</label>
                    <input
                      type="text"
                      value={acc.shabaNumber}
                      onChange={e => handleAccountChange(idx, 'shabaNumber', e.target.value)}
                      placeholder="IR..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Official Stamp & Signature */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Upload className="text-purple-600" size={18} />
            مهر و امضای رسمی مدیر (جهت چاپ فاکتور)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-1">لینک یا آپلود تصویر مهر و امضا</label>
                <input
                  type="text"
                  value={officialSealUrl}
                  onChange={e => setOfficialSealUrl(e.target.value)}
                  placeholder="https://... یا آپلود فایل"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-mono text-slate-800 outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <input
                  type="file"
                  accept="image/*"
                  id="admin-seal-input"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const r = new FileReader();
                      r.onloadend = () => setOfficialSealUrl(r.result as string);
                      r.readAsDataURL(file);
                    }
                  }}
                />
                <label
                  htmlFor="admin-seal-input"
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer border border-slate-300 transition-colors w-max"
                >
                  <Upload size={14} />
                  <span>آپلود تصویر مهر و امضای دیجیتال</span>
                </label>
              </div>
            </div>

            {/* Seal Preview Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[140px]">
              <span className="text-[10px] font-black text-slate-400 mb-2">پیش‌نمایش مهر روی فاکتور:</span>
              {officialSealUrl ? (
                <div className="w-36 h-24 border border-slate-200 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1 shadow-sm">
                  <img src={officialSealUrl} alt="Seal Preview" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                </div>
              ) : (
                <div className="text-xs font-bold text-slate-300">هنوز مهری آپلود نشده است</div>
              )}
            </div>
          </div>
        </div>

        {/* Section 5: Footer Notes */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="text-teal-600" size={18} />
            توضیحات و قوانین ذیل فاکتور
          </h3>

          <div>
            <textarea
              rows={3}
              value={footerNotes}
              onChange={e => setFooterNotes(e.target.value)}
              placeholder="متن توضیحات و تعهدات ذیل فاکتور..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 leading-relaxed outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save size={18} />
            <span>{isSaving ? "در حال ذخیره..." : "ذخیره تغییرات فاکتور رسمی"}</span>
          </button>
        </div>
      </form>

      {/* Live Sample Invoice Preview Modal */}
      {showLivePreview && (
        <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-black text-slate-800">پیش‌نمایش زنده فاکتور نمونه با تنظیمات شما</h3>
              <button onClick={() => setShowLivePreview(false)} className="text-slate-400 hover:text-slate-600">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="border border-slate-300 p-6 rounded-2xl space-y-4 text-xs">
              <div className="flex justify-between border-b pb-3">
                <h4 className="font-black text-base text-slate-900">{sellerTitle}</h4>
                <div className="text-[10px] text-slate-500">شماره نمونه: DX-99201</div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-600">
                <div>شناسه ملی: {sellerNationalId} | ثبت: {sellerRegNumber}</div>
                <div>تلفن: {sellerPhone}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded text-[10px]">
                تخفیف نقدی: {cashDiscountPercent}٪ | کارمزد چکی: {chequeMarkupPerMonthPercent}٪ به ازای هر ماه
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-[10px] text-slate-400">{footerNotes}</div>
                {officialSealUrl && (
                  <div className="w-20 h-16">
                    <img src={officialSealUrl} alt="Seal" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
