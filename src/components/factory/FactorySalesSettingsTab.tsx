import React, { useState } from "react";
import { 
  SlidersHorizontal, 
  MapPin, 
  Power, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Info, 
  Save, 
  Truck, 
  Clock, 
  PackageX, 
  Boxes,
  Percent,
  DollarSign
} from "lucide-react";

export interface FactorySalesSettings {
  isSalesEnabled: boolean; // توقف موقت / فعال‌سازی فروش
  salesPauseReason?: string;
  allowAllProvinces: boolean; // ارسال به سراسر کشور یا محدود به استان‌های خاص
  allowedProvinces: string[]; // لیست استان‌های مجاز
  isSedimentDisabled: boolean; // غیرفعال‌سازی رسوب بار در انبار کارخانه
  minOrderTotalAmount?: number; // حداقل مبلغ کل سفارش (تومان)
  loadingLeadTimeDays: number; // زمان آماده‌سازی بار (روز کاری)
  directPickupAllowed: boolean; // امکان بارگیری مستقیم با ناوگان اعزامی دست‌اول
  acceptsOverCapacityOrders: boolean; // پذیرش سفارش‌های فراتر از ظرفیت با هماهنگی
  autoAcceptOrders: boolean; // تایید خودکار سفارش‌های با قیمت مصوب
}

interface FactorySalesSettingsTabProps {
  user: any;
  onUpdateUser?: (updatedUser: any) => void;
}

const IRAN_PROVINCES = [
  "تهران", "خراسان رضوی", "اصفهان", "فارس", "آذربایجان شرقی",
  "مازندران", "خوزستان", "گیلان", "کرمان", "البرز",
  "قم", "مرکزی", "همدان", "یزد", "قزوین",
  "آذربایجان غربی", "کرمانشاه", "گلستان", "لرستان", "هرمزگان",
  "اردبیل", "سیستان و بلوچستان", "کردستان", "بوشهر", "زنجان",
  "چهارمحال و بختیاری", "سمنان", "خراسان جنوبی", "ایلام", "کهگیلویه و بویراحمد",
  "خراسان شمالی"
];

export default function FactorySalesSettingsTab({ user, onUpdateUser }: FactorySalesSettingsTabProps) {
  const currentSettings: FactorySalesSettings = user?.salesSettings || {
    isSalesEnabled: user?.isSalesActive ?? true,
    salesPauseReason: "",
    allowAllProvinces: true,
    allowedProvinces: IRAN_PROVINCES,
    isSedimentDisabled: false,
    minOrderTotalAmount: 0,
    loadingLeadTimeDays: 2,
    directPickupAllowed: true,
    acceptsOverCapacityOrders: false,
    autoAcceptOrders: true
  };

  const [isSalesEnabled, setIsSalesEnabled] = useState(currentSettings.isSalesEnabled);
  const [salesPauseReason, setSalesPauseReason] = useState(currentSettings.salesPauseReason || "");
  const [allowAllProvinces, setAllowAllProvinces] = useState(currentSettings.allowAllProvinces);
  const [allowedProvinces, setAllowedProvinces] = useState<string[]>(currentSettings.allowedProvinces || IRAN_PROVINCES);
  const [isSedimentDisabled, setIsSedimentDisabled] = useState(currentSettings.isSedimentDisabled);
  const [minOrderTotalAmount, setMinOrderTotalAmount] = useState(currentSettings.minOrderTotalAmount ? String(currentSettings.minOrderTotalAmount) : "");
  const [loadingLeadTimeDays, setLoadingLeadTimeDays] = useState(String(currentSettings.loadingLeadTimeDays || 2));
  const [directPickupAllowed, setDirectPickupAllowed] = useState(currentSettings.directPickupAllowed ?? true);
  const [acceptsOverCapacityOrders, setAcceptsOverCapacityOrders] = useState(currentSettings.acceptsOverCapacityOrders ?? false);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(currentSettings.autoAcceptOrders ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Toggle province selection
  const handleToggleProvince = (prov: string) => {
    if (allowedProvinces.includes(prov)) {
      setAllowedProvinces(allowedProvinces.filter(p => p !== prov));
    } else {
      setAllowedProvinces([...allowedProvinces, prov]);
    }
  };

  // Select/Deselect all provinces
  const handleSelectAllProvinces = () => {
    setAllowedProvinces(IRAN_PROVINCES);
  };
  const handleClearAllProvinces = () => {
    setAllowedProvinces([]);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    const cleanMinOrder = parseInt(minOrderTotalAmount.replace(/[^0-9]/g, ""), 10) || 0;
    const cleanLeadTime = parseInt(loadingLeadTimeDays, 10) || 2;

    const updatedSettings: FactorySalesSettings = {
      isSalesEnabled,
      salesPauseReason: salesPauseReason.trim(),
      allowAllProvinces,
      allowedProvinces: allowAllProvinces ? IRAN_PROVINCES : allowedProvinces,
      isSedimentDisabled,
      minOrderTotalAmount: cleanMinOrder,
      loadingLeadTimeDays: cleanLeadTime,
      directPickupAllowed,
      acceptsOverCapacityOrders,
      autoAcceptOrders
    };

    const updatedUser = {
      ...user,
      salesSettings: updatedSettings,
      isSalesActive: isSalesEnabled
    };

    localStorage.setItem("dastavval_user", JSON.stringify(updatedUser));

    const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
    if (user?.email && localUsers[user.email]) {
      localUsers[user.email] = {
        ...localUsers[user.email],
        ...updatedUser
      };
      localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
    }

    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }

    setTimeout(() => {
      setIsSaving(false);
      setSuccessMessage("تنظیمات فروش و توزیع کارخانه با موفقیت ذخیره و اعمال گردید.");
      setTimeout(() => setSuccessMessage(null), 4000);
    }, 400);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8 text-right font-sans" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">تنظیمات پیشرفته فروش و محدوده توزیع کارخانه</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            مدیریت وضعیت فعال/غیرفعال بودن فروش، محدودسازی مناطق ارسال، رسوب انبار و زمان‌بندی بارگیری.
          </p>
        </div>
      </div>

      {/* Official Price Policy Clarification Banner */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-3xl p-5 space-y-2">
        <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
          <Info size={18} className="text-indigo-600 shrink-0" />
          <span>شفاف‌سازی و خط‌مشی قیمت‌گذاری در سامانه دست‌اول:</span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          نرخ‌های ثبت‌شده توسط کارخانه در این پنل، <strong>«قیمت خالص مصوب تحویل درب کارخانه»</strong> بوده و تسویه حساب‌های مالی شما دقیقاً بر مبنای همین نرخ و بدون هیچ‌گونه کسری انجام می‌پذیرد. تعیین درصد نهایی، هزینه بازاریابی و قیمت مصرف‌کننده در ویترین سایت بر عهده مدیریت بازرگانی دست‌اول است و شما هر زمان مایل باشید می‌توانید نرخ پایه عمده خود را تغییر دهید.
        </p>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* 1. Global Sales Pause/Active Switch */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Power size={18} className="text-indigo-600" />
            <h4 className="text-xs font-black text-slate-900">۱. وضعیت کلی فروش و سفارش‌گیری پنل کارخانه</h4>
          </div>

          <div className={`p-4 rounded-3xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isSalesEnabled ? "bg-emerald-50/50 border-emerald-200" : "bg-rose-50/60 border-rose-200"
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isSalesEnabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                <span className="text-xs font-black text-slate-900">
                  {isSalesEnabled ? "فروش و سفارش‌گیری کارخانه: فعال است" : "فروش و سفارش‌گیری کارخانه: موقتاً متوقف شده است"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {isSalesEnabled 
                  ? "محصولات تایید شده شما در ویترین بنکداران در دسترس بوده و خریداران می‌توانند سفارش ثبت کنند."
                  : "سفارش‌گیری تمام محصولات این کارخانه در سایت متوقف شده و به حالت مرخصی/اورهال درمی‌آید."
                }
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSalesEnabled(!isSalesEnabled)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isSalesEnabled 
                  ? "bg-rose-600 hover:bg-rose-700 text-white" 
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <Power size={15} />
              <span>{isSalesEnabled ? "توقف موقت فروش کارخانه" : "فعال‌سازی مجدد فروش"}</span>
            </button>
          </div>

          {!isSalesEnabled && (
            <div className="space-y-1 pt-2">
              <label className="text-xs font-black text-slate-800 block">علت توقف موقت فروش (جهت اطلاع واحد بازرگانی):</label>
              <input
                type="text"
                value={salesPauseReason}
                onChange={(e) => setSalesPauseReason(e.target.value)}
                placeholder="مثال: تعمیرات دوره‌ای خط تولید، اورهال سالانه انبار، اتمام مقطعی مواد اولیه..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-rose-600 text-xs font-bold text-slate-900"
              />
            </div>
          )}
        </div>

        {/* 2. Sediment / Stale Inventory Holding Setting (غیرفعال‌سازی رسوب بار) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <PackageX size={18} className="text-indigo-600" />
            <h4 className="text-xs font-black text-slate-900">۲. سیاست رسوب انبار و نگهداری کالا</h4>
          </div>

          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSedimentDisabled}
                onChange={(e) => setIsSedimentDisabled(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-900 block">
                  غیرفعال‌سازی رسوب بار (فقط تولید و بارگیری بی‌درنگ بر اساس سفارش قطعی)
                </span>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  با فعال کردن این گزینه، کارخانه تعهدی در قبال نگهداری طولانی‌مدت بار یا رسوب موجودی در انبارهای واسطه نخواهد داشت و سفارش‌ها مستقیماً پس از تولید در بازه زمانی تعیین‌شده بارگیری و اعزام می‌شوند.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 3. Sales Territory & Province Restrictions (محدود کردن منطقه فروش) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-indigo-600" />
              <h4 className="text-xs font-black text-slate-900">۳. محدوده جغرافیایی و استان‌های مجاز برای فروش</h4>
            </div>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              {allowAllProvinces ? "کل کشور (۳۱ استان)" : `${allowedProvinces.length} استان منتخب`}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-800">
                <input
                  type="radio"
                  name="provinceMode"
                  checked={allowAllProvinces}
                  onChange={() => setAllowAllProvinces(true)}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                />
                <span>ارسال و فروش به سراسر کشور (بدون محدودیت)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-black text-slate-800">
                <input
                  type="radio"
                  name="provinceMode"
                  checked={!allowAllProvinces}
                  onChange={() => setAllowAllProvinces(false)}
                  className="w-4 h-4 text-indigo-600 cursor-pointer"
                />
                <span>محدود کردن فروش به استان‌های منتخب</span>
              </label>
            </div>

            {!allowAllProvinces && (
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-600">استان‌هایی که کارخانه قادر به ارسال بار است را علامت بزنید:</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllProvinces}
                      className="text-indigo-600 hover:text-indigo-800 font-black text-[11px] cursor-pointer"
                    >
                      انتخاب همه
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllProvinces}
                      className="text-slate-500 hover:text-rose-600 font-black text-[11px] cursor-pointer"
                    >
                      پاک کردن
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                  {IRAN_PROVINCES.map((prov) => {
                    const isSelected = allowedProvinces.includes(prov);
                    return (
                      <button
                        key={prov}
                        type="button"
                        onClick={() => handleToggleProvince(prov)}
                        className={`p-2 rounded-xl text-xs font-bold text-right transition-all flex items-center justify-between cursor-pointer border ${
                          isSelected 
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-black shadow-2xs" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>{prov}</span>
                        {isSelected && <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Logistics & Loading Lead Time */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Truck size={18} className="text-indigo-600" />
            <h4 className="text-xs font-black text-slate-900">۴. شرایط لجستیک و زمان‌بندی بارگیری</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 block">زمان آماده‌سازی و بارگیری از انبار کارخانه (روز کاری):</label>
              <select
                value={loadingLeadTimeDays}
                onChange={(e) => setLoadingLeadTimeDays(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 text-xs font-bold text-slate-900 cursor-pointer"
              >
                <option value="1">۱ روز کاری (بارگیری فوری)</option>
                <option value="2">۲ روز کاری (استاندارد)</option>
                <option value="3">۳ روز کاری</option>
                <option value="5">۵ روز کاری (تولید سفارشی)</option>
                <option value="7">۷ روز کاری</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-slate-800 block">حداقل مبلغ سفارش از کارخانه (تومان - اختیاری):</label>
              <input
                type="text"
                value={minOrderTotalAmount}
                onChange={(e) => setMinOrderTotalAmount(e.target.value)}
                placeholder="مثال: 50000000 (بدون محدودیت خالی بگذارید)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={directPickupAllowed}
                onChange={(e) => setDirectPickupAllowed(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">امکان بارگیری مستقیم توسط ناوگان حمل و نقل دست‌اول</span>
            </label>

            <label className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoAcceptOrders}
                onChange={(e) => setAutoAcceptOrders(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800">تایید خودکار صدور حواله برای سفارش‌های منطبق بر قیمت مصوب</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save size={16} />
            <span>{isSaving ? "در حال ذخیره تنظیمات..." : "ذخیره تنظیمات فروش کارخانه"}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
