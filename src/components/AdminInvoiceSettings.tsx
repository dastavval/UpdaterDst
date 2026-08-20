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
import WholesaleInvoiceView from './WholesaleInvoiceView';
import { Order } from '../types';

interface AdminInvoiceSettingsProps {
  b2bConfig: any;
  onUpdateB2bConfig: (updatedConfig: any) => Promise<void>;
}

export default function AdminInvoiceSettings({ b2bConfig, onUpdateB2bConfig }: AdminInvoiceSettingsProps) {
  const currentInv = b2bConfig?.invoiceSettings || {};

  // Form states
  const [sellerTitle, setSellerTitle] = useState(currentInv.sellerTitle || b2bConfig?.appName || "صنایع غذایی و بازرگانی دست اول");
  const [sellerNationalId, setSellerNationalId] = useState(currentInv.sellerNationalId || "");
  const [sellerRegNumber, setSellerRegNumber] = useState(currentInv.sellerRegNumber || "");
  const [sellerEconomicCode, setSellerEconomicCode] = useState(currentInv.sellerEconomicCode || "");
  const [sellerPhone, setSellerPhone] = useState(currentInv.sellerPhone || "");
  const [sellerMobile, setSellerMobile] = useState(currentInv.sellerMobile || "");
  const [sellerAddress, setSellerAddress] = useState(currentInv.sellerAddress || "");
  
  const [cashDiscountPercent, setCashDiscountPercent] = useState<number>(currentInv.cashDiscountPercent !== undefined ? currentInv.cashDiscountPercent : 5);
  const [chequeMarkupPerMonthPercent, setChequeMarkupPerMonthPercent] = useState<number>(currentInv.chequeMarkupPerMonthPercent !== undefined ? currentInv.chequeMarkupPerMonthPercent : 6);
  const [includeVatByDefault, setIncludeVatByDefault] = useState<boolean>(currentInv.includeVatByDefault !== undefined ? Boolean(currentInv.includeVatByDefault) : true);
  const [defaultDocType, setDefaultDocType] = useState<'proforma' | 'official'>(currentInv.defaultDocType === 'official' ? 'official' : 'proforma');

  const [officialSealUrl, setOfficialSealUrl] = useState(currentInv.officialSealUrl || b2bConfig?.officialSealUrl || "");
  const [catalogPdfUrl, setCatalogPdfUrl] = useState(b2bConfig?.catalogPdfUrl || "");
  const [footerNotes, setFooterNotes] = useState(currentInv.footerNotes || "این پیش‌فاکتور به منزله تاییدیه قطعی سفارش و رزرو کالا در خط تولید می‌باشد. کلیه مرسولات دارای بیمه ترانزیت جاده‌ای هستند.");

  const [bankAccounts, setBankAccounts] = useState<any[]>(currentInv.bankAccounts || []);

  const [quantityDiscountTiers, setQuantityDiscountTiers] = useState<any[]>(() => {
    if (b2bConfig?.quantityDiscountTiers && Array.isArray(b2bConfig.quantityDiscountTiers)) {
      return b2bConfig.quantityDiscountTiers;
    }
    return [];
  });

  const [volumeDiscountTiers, setVolumeDiscountTiers] = useState<any[]>(() => {
    if (b2bConfig?.volumeDiscountTiers && Array.isArray(b2bConfig.volumeDiscountTiers)) {
      return b2bConfig.volumeDiscountTiers;
    }
    return [];
  });

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
        includeVatByDefault: Boolean(includeVatByDefault),
        defaultDocType,
        officialSealUrl,
        footerNotes,
        bankAccounts
      };

      const updatedB2bConfig = {
        ...b2bConfig,
        officialSealUrl,
        catalogPdfUrl,
        quantityDiscountTiers: quantityDiscountTiers.map(t => ({
          threshold: Number(t.threshold),
          discountPercent: Number(t.discountPercent)
        })).sort((a, b) => a.threshold - b.threshold),
        volumeDiscountTiers: volumeDiscountTiers.map(t => ({
          threshold: Number(t.threshold),
          discountPercent: Number(t.discountPercent)
        })).sort((a, b) => a.threshold - b.threshold),
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
      <div className="bg-white border border-slate-200 text-slate-900 p-6 sm:p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
            <FileText size={14} />
            <span>مدیریت کامل فاکتور و مدارک رسمی</span>
          </div>
          <h2 className="text-xl font-black">تنظیمات عناوین، مشخصات حقوقی و مهر/امضا فاکتور</h2>
          <p className="text-xs text-slate-500 font-bold">
            تنظیم صد درصدی مشخصات صادرکننده، درصد تخفیف نقدی، کارمزد چکی، حساب‌های بانکی و آپلود مهر رسمی
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLivePreview(!showLivePreview)}
          className="bg-white hover:bg-slate-50 text-emerald-600 px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 border border-slate-200 shadow-sm transition-all cursor-pointer"
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
              <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl text-xs font-black cursor-pointer shrink-0 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5">
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

            {/* VAT 10% Administration Choice */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-900">
                  محاسبه ۱۰٪ مالیات بر ارزش افزوده در فاکتورها
                </label>
                <input
                  type="checkbox"
                  checked={includeVatByDefault}
                  onChange={e => setIncludeVatByDefault(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                {includeVatByDefault 
                  ? "✓ فعال است: ۱۰٪ مالیات ارزش افزوده به صورت رسمی در پیش‌فاکتورها و صورت‌حساب‌های صادرشده محاسبه می‌گردد."
                  : "✗ غیرفعال است: پیش‌فاکتورها بدون احتساب ۱۰٪ ارزش افزوده صادر می‌شوند."
                }
              </p>
            </div>

            {/* Default Document Type */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <label className="block text-xs font-black text-slate-900">
                عنوان پیش‌فرض سند
              </label>
              <select
                value={defaultDocType}
                onChange={e => setDefaultDocType(e.target.value as 'proforma' | 'official')}
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none"
              >
                <option value="proforma">پیش‌فاکتور رسمی فروش کالا و خدمات</option>
                <option value="official">صورت‌حساب رسمی فروش کالا و خدمات</option>
              </select>
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                عنوان استاندارد سربرگ اسناد صادر شده در خروجی چاپی و PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Section: Tiered Discounts Configuration */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Percent className="text-indigo-600" size={18} />
              مدیریت و پیکربندی تخفیف‌های پلکانی (تیراژ خرید و مبلغ کل)
            </h3>
            <p className="text-[11px] text-slate-500 font-bold mt-2">
              با تنظیم این پله‌ها، تخفیف به صورت کاملا اتوماتیک روی پیش‌فاکتور مشتریان نقدی محاسبه شده و در صورت انتخاب پرداخت چکی ملغی می‌گردد.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Quantity-based Tiers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-indigo-950">۱. تخفیف‌های پلکانی بر اساس تعداد کارتن (تیراژ)</h4>
                  <p className="text-[9px] text-slate-400 font-bold">کسر تخفیف در صورت خرید تعداد مشخصی کارتن به بالا</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuantityDiscountTiers([...quantityDiscountTiers, { threshold: 1, discountPercent: 1 }])}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>افزودن پله تیراژ</span>
                </button>
              </div>

              <div className="space-y-2">
                {quantityDiscountTiers.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">پله‌ای تعریف نشده است.</p>
                ) : (
                  quantityDiscountTiers.map((tier, index) => (
                    <div key={`admin-inv-qty-tier-${index}`} className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 animate-fade-in">
                      <div className="flex-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">حداقل تعداد:</span>
                        <input
                          type="number"
                          required
                          min="1"
                          value={tier.threshold}
                          onChange={(e) => {
                            const updated = [...quantityDiscountTiers];
                            updated[index].threshold = Number(e.target.value);
                            setQuantityDiscountTiers(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-black text-center"
                        />
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">کارتن</span>
                      </div>

                      <div className="flex-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">تخفیف:</span>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={tier.discountPercent}
                          onChange={(e) => {
                            const updated = [...quantityDiscountTiers];
                            updated[index].discountPercent = Number(e.target.value);
                            setQuantityDiscountTiers(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-black text-center"
                        />
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setQuantityDiscountTiers(quantityDiscountTiers.filter((_, i) => i !== index))}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="حذف پله"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Volume/Amount-based Tiers */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-amber-950">۲. تخفیف‌های پلکانی بر اساس مبلغ ناخالص (تومان)</h4>
                  <p className="text-[9px] text-slate-400 font-bold">کسر تخفیف در صورت رسیدن کل مبلغ ناخالص فاکتور به حدنصاب ریالی</p>
                </div>
                <button
                  type="button"
                  onClick={() => setVolumeDiscountTiers([...volumeDiscountTiers, { threshold: 10000000, discountPercent: 1 }])}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>افزودن پله ریالی</span>
                </button>
              </div>

              <div className="space-y-2">
                {volumeDiscountTiers.length === 0 ? (
                  <p className="text-xs text-slate-400 font-bold text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">پله‌ای تعریف نشده است.</p>
                ) : (
                  volumeDiscountTiers.map((tier, index) => (
                    <div key={`admin-inv-vol-tier-${index}`} className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 animate-fade-in">
                      <div className="flex-[1.5] flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">حداقل خرید:</span>
                        <input
                          type="number"
                          required
                          min="1"
                          step="100000"
                          value={tier.threshold}
                          onChange={(e) => {
                            const updated = [...volumeDiscountTiers];
                            updated[index].threshold = Number(e.target.value);
                            setVolumeDiscountTiers(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-black text-center"
                        />
                        <span className="text-[9px] text-slate-400 font-medium shrink-0">تومان</span>
                      </div>

                      <div className="flex-1 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">تخفیف:</span>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={tier.discountPercent}
                          onChange={(e) => {
                            const updated = [...volumeDiscountTiers];
                            updated[index].discountPercent = Number(e.target.value);
                            setVolumeDiscountTiers(updated);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-black text-center"
                        />
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setVolumeDiscountTiers(volumeDiscountTiers.filter((_, i) => i !== index))}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        title="حذف پله"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
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
              <div key={`admin-inv-bank-acc-${acc.accountNumber || idx}-${idx}`} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3 relative">
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
        <WholesaleInvoiceView
          order={{
            id: "SAMPLE-99201",
            buyerName: "مسئول خرید و تدارکات",
            buyerCompany: "فروشگاه و بنکداری نمونه البرز",
            buyerPhone: "",
            buyerAddress: "تهران، انبار مرکزی توزیع و پخش کالا",
            items: [
              {
                id: "sample-p1",
                productId: "sample-p1",
                name: "شکر سفید ۵۰ کیلویی درجه یک مستقیم کارخانه",
                quantityCartons: 20,
                unit: "کیسه ۵۰kg",
                pricePerCarton: 1950000,
                totalPrice: 39000000
              },
              {
                id: "sample-p2",
                productId: "sample-p2",
                name: "روغن سرخ‌کردنی حلب ۱۶ کیلوگرمی صنعتی",
                quantityCartons: 15,
                unit: "حلب ۱۶kg",
                pricePerCarton: 1120000,
                totalPrice: 16800000
              }
            ],
            totalAmount: 55800000,
            createdAt: new Date().toLocaleDateString('fa-IR'),
            trackingNumber: "DX-99201",
            status: "approved"
          } as unknown as Order}
          b2bConfig={{
            ...b2bConfig,
            invoiceSettings: {
              sellerTitle,
              sellerNationalId,
              sellerRegNumber,
              sellerEconomicCode,
              sellerPhone,
              sellerMobile,
              sellerAddress,
              cashDiscountPercent,
              chequeMarkupPerMonthPercent,
              includeVatByDefault,
              defaultDocType,
              officialSealUrl,
              footerNotes,
              bankAccounts
            }
          }}
          onClose={() => setShowLivePreview(false)}
          isAdmin={true}
        />
      )}
    </div>
  );
}
