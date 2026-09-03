import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ShieldAlert,
  Stamp,
  Palette,
  UserCheck,
  Sparkles,
  Image as ImageIcon,
  Camera,
  PenTool,
  Loader2
} from 'lucide-react';
import WholesaleInvoiceView from './WholesaleInvoiceView';
import { OfficialUnifiedSealSignature } from './OfficialDigitalStamp';
import SealSignatureCaptureModal from './SealSignatureCaptureModal';
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
  const [maxSedimentDiscountPercent, setMaxSedimentDiscountPercent] = useState<number>(currentInv.maxSedimentDiscountPercent !== undefined ? currentInv.maxSedimentDiscountPercent : (b2bConfig?.maxSedimentDiscountPercent ?? 5.0));
  const [includeVatByDefault, setIncludeVatByDefault] = useState<boolean>(currentInv.includeVatByDefault !== undefined ? Boolean(currentInv.includeVatByDefault) : true);
  const [defaultDocType, setDefaultDocType] = useState<'proforma' | 'official'>(currentInv.defaultDocType === 'official' ? 'official' : 'proforma');

  // Stamp & Signature Dynamic States
  const [sealType, setSealType] = useState<"dynamic_vector" | "custom_image" | "signature_only" | "stamp_only">(
    currentInv.sealType || (currentInv.officialSealUrl || b2bConfig?.officialSealUrl ? "custom_image" : "dynamic_vector")
  );
  const [sealColor, setSealColor] = useState<string>(currentInv.sealColor || "#1e40af");
  const [signerName, setSignerName] = useState<string>(currentInv.signerName || "مهندس علیرضا اکبری");
  const [signerTitle, setSignerTitle] = useState<string>(currentInv.signerTitle || "مدیرعامل و رییس هیات‌مدیره");
  const [officialSealUrl, setOfficialSealUrl] = useState(currentInv.officialSealUrl || b2bConfig?.officialSealUrl || "");
  const [officialSignatureUrl, setOfficialSignatureUrl] = useState(currentInv.officialSignatureUrl || b2bConfig?.officialSignatureUrl || "");
  
  const [catalogPdfUrl, setCatalogPdfUrl] = useState(b2bConfig?.catalogPdfUrl || "");
  const [footerNotes, setFooterNotes] = useState(currentInv.footerNotes || "این پیش‌فاکتور به منزله تاییدیه قطعی سفارش و رزرو کالا در خط تولید می‌باشد. کلیه مرسولات دارای بیمه ترانزیت جاده‌ای هستند.");

  const [bankAccounts, setBankAccounts] = useState<any[]>(currentInv.bankAccounts || []);

  const [quantityDiscountTiers, setQuantityDiscountTiers] = useState<any[]>(() => {
    if (b2bConfig?.quantityDiscountTiers && Array.isArray(b2bConfig.quantityDiscountTiers) && b2bConfig.quantityDiscountTiers.length > 0) {
      return b2bConfig.quantityDiscountTiers;
    }
    return [
      { threshold: 10, discountPercent: 3 },
      { threshold: 25, discountPercent: 6 },
      { threshold: 50, discountPercent: 10 }
    ];
  });

  const [volumeDiscountTiers, setVolumeDiscountTiers] = useState<any[]>(() => {
    if (b2bConfig?.volumeDiscountTiers && Array.isArray(b2bConfig.volumeDiscountTiers) && b2bConfig.volumeDiscountTiers.length > 0) {
      return b2bConfig.volumeDiscountTiers;
    }
    return [
      { threshold: 10000000, discountPercent: 2 },
      { threshold: 50000000, discountPercent: 5 },
      { threshold: 150000000, discountPercent: 8 },
      { threshold: 500000000, discountPercent: 12 }
    ];
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [captureTarget, setCaptureTarget] = useState<'seal' | 'signature'>('seal');

  useEffect(() => {
    if (b2bConfig?.invoiceSettings) {
      const inv = b2bConfig.invoiceSettings;
      if (inv.sellerTitle !== undefined) setSellerTitle(inv.sellerTitle);
      if (inv.sellerNationalId !== undefined) setSellerNationalId(inv.sellerNationalId);
      if (inv.sellerRegNumber !== undefined) setSellerRegNumber(inv.sellerRegNumber);
      if (inv.sellerEconomicCode !== undefined) setSellerEconomicCode(inv.sellerEconomicCode);
      if (inv.sellerPhone !== undefined) setSellerPhone(inv.sellerPhone);
      if (inv.sellerMobile !== undefined) setSellerMobile(inv.sellerMobile);
      if (inv.sellerAddress !== undefined) setSellerAddress(inv.sellerAddress);
      if (inv.cashDiscountPercent !== undefined) setCashDiscountPercent(inv.cashDiscountPercent);
      if (inv.chequeMarkupPerMonthPercent !== undefined) setChequeMarkupPerMonthPercent(inv.chequeMarkupPerMonthPercent);
      if (inv.maxSedimentDiscountPercent !== undefined) setMaxSedimentDiscountPercent(inv.maxSedimentDiscountPercent);
      if (inv.includeVatByDefault !== undefined) setIncludeVatByDefault(Boolean(inv.includeVatByDefault));
      if (inv.defaultDocType !== undefined) setDefaultDocType(inv.defaultDocType);
      if (inv.sealType !== undefined) setSealType(inv.sealType);
      if (inv.sealColor !== undefined) setSealColor(inv.sealColor);
      if (inv.signerName !== undefined) setSignerName(inv.signerName);
      if (inv.signerTitle !== undefined) setSignerTitle(inv.signerTitle);
      if (inv.officialSealUrl !== undefined) setOfficialSealUrl(inv.officialSealUrl);
      if (inv.officialSignatureUrl !== undefined) setOfficialSignatureUrl(inv.officialSignatureUrl);
      if (inv.footerNotes !== undefined) setFooterNotes(inv.footerNotes);
      if (inv.bankAccounts && Array.isArray(inv.bankAccounts)) setBankAccounts(inv.bankAccounts);
    }
  }, [b2bConfig]);

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
    setSaveProgress(10);
    setSuccessMsg("");

    try {
      // Simulate progress for "precision" feel
      const progressTimer = setInterval(() => {
        setSaveProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

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
        maxSedimentDiscountPercent: Number(maxSedimentDiscountPercent),
        includeVatByDefault: Boolean(includeVatByDefault),
        defaultDocType,
        officialSealUrl,
        officialSignatureUrl,
        sealType,
        sealColor,
        signerName,
        signerTitle,
        footerNotes,
        bankAccounts
      };

      const updatedB2bConfig = {
        ...b2bConfig,
        officialSealUrl,
        officialSignatureUrl,
        catalogPdfUrl,
        maxSedimentDiscountPercent: Number(maxSedimentDiscountPercent),
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
      clearInterval(progressTimer);
      setSaveProgress(100);
      
      setTimeout(() => {
        setSuccessMsg("تنظیمات و عناوین فاکتور با دقت تمام ذخیره و تثبیت شد.");
        setIsSaving(false);
        setSaveProgress(0);
      }, 500);

    } catch (err) {
      console.error(err);
      setIsSaving(false);
      setSaveProgress(0);
    }
  };

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 text-slate-900 p-6 sm:p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
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
              <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-2xl text-xs font-black cursor-pointer shrink-0 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5">
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
                <a href={catalogPdfUrl} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 font-bold underline">پیش‌نمایش</a>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Financial Rules (Cash Discount % & Cheque Markup %) */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="text-emerald-500" size={18} />
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
                  step="any"
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

            <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200/60 space-y-3">
              <label className="block text-xs font-black text-amber-900">
                سقف درصد تخفیف طرح رسوب‌زدایی و انباشت انبار٪
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="any"
                  value={maxSedimentDiscountPercent}
                  onChange={e => setMaxSedimentDiscountPercent(Number(e.target.value))}
                  className="w-full bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-sm font-black text-amber-900 outline-none"
                />
                <span className="text-xs font-bold text-amber-700">%</span>
              </div>
              <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                حداکثر تخفیف قابل تخصیص برای کالاهای دارای رسوب در انبار جهت جلوگیری از ضرر مالی تامین‌کنندگان و کارخانه‌ها.
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
              <Percent className="text-emerald-600" size={18} />
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
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
                          step="any"
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
                          step="any"
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
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
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
                  className="bg-emerald-600 hover:bg-amber-700 text-white text-[10px] font-black px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
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
                          step="any"
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
                          step="any"
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
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
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
              <CreditCard className="text-emerald-600" size={18} />
              حساب‌های بانکی صادرکننده جهت واریز وجه
            </h3>
            <button
              type="button"
              onClick={handleAddAccount}
              className="bg-emerald-600 hover:bg-blue-700 text-white text-xs font-black px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1"
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
                      className="text-emerald-500 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Stamp className="text-purple-600" size={18} />
              تنظیمات هوشمند و سفارشی‌سازی مهر و امضای رسمی فاکتور
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              تغییرات فوراً در پیش‌نمایش و فاکتور چاپی اعمال می‌شود
            </span>
          </div>

          {/* NEW: Webcam & Live Capture Hero Action Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-950/20 border border-purple-800/30">
            <div className="flex items-center gap-3.5 text-right w-full md:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                <Camera size={24} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>عکاسی مستقیم مهر و امضا با وبکم / دوربین</span>
                  <span className="text-[10px] bg-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full border border-purple-400/30 font-mono">
                    NEW WEBCAM AI
                  </span>
                </h4>
                <p className="text-[11px] text-purple-200/80 font-medium mt-0.5 leading-relaxed">
                  مهر یا امضای خود را مقابل دوربین بگیرید؛ سیستم به صورت خودکار سفیدی کاغذ را شفاف کرده و روی فاکتور قرار می‌دهد.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCaptureTarget('seal');
                  setIsCaptureModalOpen(true);
                }}
                className="flex-1 md:flex-none px-4 py-2.5 bg-white hover:bg-purple-50 text-purple-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Camera size={15} className="text-purple-600" />
                <span>عکاسی وبکم مهر</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCaptureTarget('signature');
                  setIsCaptureModalOpen(true);
                }}
                className="flex-1 md:flex-none px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-purple-400/40 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <PenTool size={15} />
                <span>رسم دیجیتال / اسکن امضا</span>
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'dynamic_vector', label: 'مهر و امضای وکتور هوشمند', desc: 'تولید خودکار با QR و نام شرکت', icon: <Sparkles size={14} /> },
              { id: 'custom_image', label: 'تصویر اختصاصی (آپلود PNG)', desc: 'مهر و امضای اسکن‌شده کارخانه', icon: <ImageIcon size={14} /> },
              { id: 'signature_only', label: 'فقط امضای خوشنویسی', desc: 'بدون کادر مهر مربعی', icon: <UserCheck size={14} /> },
              { id: 'stamp_only', label: 'فقط مهر رسمی QR', desc: 'بدون امضای دست‌نویس', icon: <Stamp size={14} /> },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSealType(m.id as any)}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  sealType === m.id
                    ? 'border-purple-600 bg-purple-50/70 text-purple-950 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">{m.label}</span>
                  <span className={sealType === m.id ? 'text-purple-600' : 'text-slate-400'}>{m.icon}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{m.desc}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
            
            {/* Left Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Color Selector for Vector Stamp */}
              {(sealType === 'dynamic_vector' || sealType === 'stamp_only' || sealType === 'signature_only') && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                    <Palette size={14} className="text-purple-600" />
                    <span>رنگ جوهر مهر و امضای رسمی:</span>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { hex: '#1e40af', label: 'آبی بانکی (استاندارد)' },
                      { hex: '#1e293b', label: 'سرمه‌ای / مشکی اداری' },
                      { hex: '#0f766e', label: 'سبز یشمی / بازرگانی' },
                      { hex: '#991b1b', label: 'قرمز رسمی ثبت اسناد' },
                    ].map((c, cIdx) => (
                      <button
                        key={`seal-col-${c.hex}-${cIdx}`}
                        type="button"
                        onClick={() => setSealColor(c.hex)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          sealColor === c.hex
                            ? 'border-slate-800 bg-white shadow-xs font-black'
                            : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: c.hex }} />
                        <span>{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Signer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10.5px] font-black text-slate-600 mb-1">نام شخص امضاکننده</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    placeholder="مثال: مهندس علیرضا اکبری"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-black text-slate-600 mb-1">سمت رسمی ذیل امضا</label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={e => setSignerTitle(e.target.value)}
                    placeholder="مثال: مدیرعامل و رییس هیات‌مدیره"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Custom Image Uploaders (for custom_image mode or fallback) */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-700 block">
                    بارگذاری یا عکاسی تصویر مهر رسمی (PNG شفاف):
                  </label>
                  {officialSealUrl && (
                    <button
                      type="button"
                      onClick={() => setOfficialSealUrl("")}
                      className="text-[10px] text-emerald-600 hover:underline font-bold"
                    >
                      حذف تصویر مهر
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureTarget('seal');
                      setIsCaptureModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-purple-200 transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    <Camera size={14} className="text-purple-600" />
                    <span>عکاسی وبکم</span>
                  </button>

                  <label className="w-full sm:w-auto px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 transition-colors shrink-0 shadow-2xs">
                    <Upload size={14} className="text-slate-600" />
                    <span>انتخاب فایل</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onloadend = () => {
                            setOfficialSealUrl(r.result as string);
                            setSealType("custom_image");
                          };
                          r.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <input
                    type="text"
                    value={officialSealUrl}
                    onChange={e => setOfficialSealUrl(e.target.value)}
                    placeholder="یا درج آدرس اینترنتی: https://.../seal.png"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none"
                    dir="ltr"
                  />
                </div>

                <div className="border-t border-slate-200/80 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-slate-700 block">
                      بارگذاری، عکاسی یا رسم امضای مدیریت (PNG شفاف):
                    </label>
                    {officialSignatureUrl && (
                      <button
                        type="button"
                        onClick={() => setOfficialSignatureUrl("")}
                        className="text-[10px] text-emerald-600 hover:underline font-bold"
                      >
                        حذف تصویر امضا
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCaptureTarget('signature');
                        setIsCaptureModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border border-purple-200 transition-colors shrink-0 shadow-2xs cursor-pointer"
                    >
                      <PenTool size={14} className="text-purple-600" />
                      <span>رسم / وبکم</span>
                    </button>

                    <label className="w-full sm:w-auto px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 transition-colors shrink-0 shadow-2xs">
                      <Upload size={14} className="text-slate-600" />
                      <span>انتخاب فایل</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const r = new FileReader();
                            r.onloadend = () => setOfficialSignatureUrl(r.result as string);
                            r.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      value={officialSignatureUrl}
                      onChange={e => setOfficialSignatureUrl(e.target.value)}
                      placeholder="یا درج لینک تصویر امضا: https://.../sign.png"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Live Preview Card (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100 p-5 rounded-3xl border border-slate-200 flex flex-col items-center justify-center min-h-[260px] text-center relative overflow-hidden shadow-inner">
              <div className="absolute top-3 right-3 text-[10px] font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200">
                پیش‌نمایش زنده در فاکتور رسمی
              </div>

              <div className="w-full max-w-[240px] bg-white p-4 rounded-2xl border border-slate-200/90 shadow-md flex flex-col items-center justify-center mt-4">
                <span className="text-[9px] font-black text-slate-800 mb-2 border-b border-slate-100 pb-1 w-full">
                  مهر و امضای الکترونیکی {sellerTitle || "بازرگانی دست اول"}
                </span>

                <div className="w-44 h-28 flex items-center justify-center">
                  <OfficialUnifiedSealSignature
                    className="w-full h-full"
                    sealUrl={officialSealUrl}
                    signatureUrl={officialSignatureUrl}
                    sealType={sealType}
                    companyTitle={sellerTitle}
                    regNumber={sellerRegNumber || "3360"}
                    sealColor={sealColor}
                    signerName={signerName}
                    signerTitle={signerTitle}
                  />
                </div>

                <div className="flex items-center justify-center gap-1 text-[7.5px] text-slate-400 font-bold border-t border-slate-100 pt-1 mt-1 w-full">
                  <ShieldAlert size={10} className="text-purple-600" />
                  <span>تاییدیه رسمی اصالت و صدور فاکتور</span>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 font-bold mt-3">
                این مهر و امضا با همین جزئیات روی پیش‌فاکتور مشتریان و خروجی PDF درج می‌شود.
              </span>
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

      {/* Saving Progress Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-6"
            >
              <div className="relative w-24 h-24 mx-auto">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-emerald-100 border-t-emerald-600 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Save className="text-emerald-600 animate-pulse" size={32} />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900">در حال ذخیره با نهایت دقت...</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  سیستم در حال ثبت و تثبیت اطلاعات صادرکننده، حساب‌ها و مهر/امضا جهت صدور فاکتورهای رسمی شماست.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-black text-slate-400">
                  <span>پیشرفت فرآیند</span>
                  <span>{saveProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${saveProgress}%` }}
                    className="h-full bg-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <Loader2 size={14} className="animate-spin" />
                  <span>امنیت ثبت اطلاعات برقرار است</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              officialSignatureUrl,
              sealType,
              sealColor,
              signerName,
              signerTitle,
              footerNotes,
              bankAccounts
            }
          }}
          onClose={() => setShowLivePreview(false)}
          isAdmin={true}
        />
      )}

      {/* Official Seal & Signature Webcam Capture Modal */}
      <SealSignatureCaptureModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        defaultTarget={captureTarget}
        companyTitle={sellerTitle}
        onSave={(dataUrl, target) => {
          if (target === 'seal') {
            setOfficialSealUrl(dataUrl);
            setSealType('custom_image');
          } else {
            setOfficialSignatureUrl(dataUrl);
            if (sealType === 'dynamic_vector' || sealType === 'stamp_only') {
              // keep sealType or set to custom_image if both exist
            }
          }
        }}
      />
    </div>
  );
}
