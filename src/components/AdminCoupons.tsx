import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ticket, Plus, Search, Check, Copy, Trash2, Edit3, 
  Percent, DollarSign, AlertCircle, Sparkles, RefreshCw,
  Clock, ShieldCheck, CheckCircle2, X, Filter, ToggleLeft, ToggleRight
} from 'lucide-react';
import { DiscountCoupon } from '../types';
import { 
  getStoredCoupons, 
  saveCoupons, 
  INITIAL_DEFAULT_COUPONS 
} from '../lib/coupon-service';

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === '') return '۰';
  const stringVal = typeof num === 'number' ? num.toLocaleString() : String(num);
  const persian: Record<string, string> = {
    '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹'
  };
  return stringVal.replace(/[0-9]/g, (w) => persian[w] || w);
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>(() => getStoredCoupons());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'percentage' | 'fixed_amount'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<DiscountCoupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'percentage' | 'fixed_amount'>('percentage');
  const [formValue, setFormValue] = useState<number>(10);
  const [formMinOrder, setFormMinOrder] = useState<string>('');
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('');
  const [formUsageLimit, setFormUsageLimit] = useState<string>('');
  const [formExpiresAt, setFormExpiresAt] = useState<string>('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDescription, setFormDescription] = useState('');

  useEffect(() => {
    saveCoupons(coupons);
  }, [coupons]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopiedCode(code);
    showToast(`کد تخفیف «${code}» در کلیپ‌بورد کپی شد.`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleOpenCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormTitle('');
    setFormType('percentage');
    setFormValue(10);
    setFormMinOrder('');
    setFormMaxDiscount('');
    setFormUsageLimit('');
    setFormExpiresAt('');
    setFormIsActive(true);
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: DiscountCoupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormTitle(coupon.title);
    setFormType(coupon.type);
    setFormValue(coupon.value);
    setFormMinOrder(coupon.minOrderAmount ? String(coupon.minOrderAmount) : '');
    setFormMaxDiscount(coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : '');
    setFormUsageLimit(coupon.usageLimit ? String(coupon.usageLimit) : '');
    setFormExpiresAt(coupon.expiresAt || '');
    setFormIsActive(coupon.isActive);
    setFormDescription(coupon.description || '');
    setIsModalOpen(true);
  };

  const handleGenerateRandomCode = () => {
    const prefixes = ['OFF', 'DAST', 'VIP', 'BONUS', 'DEAL', 'GIFT'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setFormCode(`${prefix}${num}`);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      showToast('لطفاً کد تخفیف را وارد نمایید.');
      return;
    }
    if (!formTitle.trim()) {
      showToast('لطفاً عنوان کد تخفیف را وارد نمایید.');
      return;
    }
    if (!formValue || formValue <= 0) {
      showToast('لطفاً مقدار تخفیف معتبر وارد نمایید.');
      return;
    }

    const cleanCode = formCode.trim().toUpperCase();

    // Check duplicate code
    const existing = coupons.find(
      c => c.code.toUpperCase() === cleanCode && (!editingCoupon || c.id !== editingCoupon.id)
    );
    if (existing) {
      showToast('این کد تخفیف قبلاً تعریف شده است. لطفاً کد دیگری انتخاب فرمایید.');
      return;
    }

    const couponData: DiscountCoupon = {
      id: editingCoupon ? editingCoupon.id : `coup-${Date.now()}`,
      code: cleanCode,
      title: formTitle.trim(),
      type: formType,
      value: Number(formValue),
      minOrderAmount: formMinOrder ? Number(formMinOrder) : undefined,
      maxDiscountAmount: (formType === 'percentage' && formMaxDiscount) ? Number(formMaxDiscount) : undefined,
      usageLimit: formUsageLimit ? Number(formUsageLimit) : undefined,
      usedCount: editingCoupon ? (editingCoupon.usedCount || 0) : 0,
      expiresAt: formExpiresAt.trim() || undefined,
      isActive: formIsActive,
      description: formDescription.trim() || undefined,
      createdAt: editingCoupon?.createdAt || new Date().toLocaleDateString('fa-IR')
    };

    if (editingCoupon) {
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? couponData : c));
      showToast(`کد تخفیف «${couponData.code}» با موفقیت ویرایش شد.`);
    } else {
      setCoupons(prev => [couponData, ...prev]);
      showToast(`کد تخفیف جدید «${couponData.code}» با موفقیت ایجاد گردید.`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: string) => {
    setCoupons(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = !c.isActive;
        showToast(`وضعیت کد «${c.code}» به ${nextStatus ? 'فعال' : 'غیرفعال'} تغییر یافت.`);
        return { ...c, isActive: nextStatus };
      }
      return c;
    }));
  };

  const handleDeleteCoupon = (id: string, code: string) => {
    if (window.confirm(`آیا از حذف کد تخفیف «${code}» اطمینان دارید؟`)) {
      setCoupons(prev => prev.filter(c => c.id !== id));
      showToast(`کد تخفیف «${code}» حذف شد.`);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('آیا مایلید کدهای تخفیف به حالت پیش‌فرض اولیه بازنشانی شوند؟')) {
      setCoupons(INITIAL_DEFAULT_COUPONS);
      showToast('کدهای تخفیف پیش‌فرض بارگذاری شدند.');
    }
  };

  // Filtered list
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchQuery = 
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchType = 
        filterType === 'all' ? true : c.type === filterType;

      const matchStatus = 
        filterStatus === 'all' ? true : 
        filterStatus === 'active' ? c.isActive : !c.isActive;

      return matchQuery && matchType && matchStatus;
    });
  }, [coupons, searchQuery, filterType, filterStatus]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter(c => c.isActive).length;
    const totalUsed = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);
    const percentageCount = coupons.filter(c => c.type === 'percentage').length;
    const fixedCount = coupons.filter(c => c.type === 'fixed_amount').length;
    return { total, active, totalUsed, percentageCount, fixedCount };
  }, [coupons]);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-[300] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full -ml-20 -mb-20 blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <Ticket size={22} className="text-amber-300" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black">مدیریت کوپن‌ها و کدهای تخفیف</h2>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium max-w-2xl leading-relaxed">
              تعریف و صدور کدهای تخفیف درصدی و مبلغی برای خریداران، اعمال خودکار در بخش ثبت سفارش و پیش‌فاکتور با قابلیت تعیین سقف تخفیف، حداقل مبلغ سبد و محدودیت دفعات استفاده.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-3 bg-white hover:bg-emerald-50 text-emerald-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>ایجاد کد تخفیف جدید</span>
            </button>
            <button
              onClick={handleResetToDefaults}
              className="px-3.5 py-3 bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-600/50 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="بازنشانی کدهای پیش‌فرض اولیه"
            >
              <RefreshCw size={14} />
              <span className="hidden sm:inline">بازنشانی پیش‌فرض‌ها</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">کل کدهای تعریف‌شده</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-slate-900 font-mono">{toPersianNum(metrics.total)}</span>
            <Ticket size={18} className="text-emerald-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">کدهای فعال آماده استفاده</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-emerald-600 font-mono">{toPersianNum(metrics.active)}</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">تعداد دفعات استفاده‌شده</span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-black text-indigo-600 font-mono">{toPersianNum(metrics.totalUsed)} <span className="text-[10px] font-normal text-slate-400">مرتبه</span></span>
            <Sparkles size={18} className="text-indigo-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] text-slate-500 font-bold block mb-1">تفکیک درصدی / مبلغی</span>
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-amber-600 font-mono">{toPersianNum(metrics.percentageCount)} درصدی</span>
            <span className="text-slate-300">|</span>
            <span className="text-teal-700 font-mono">{toPersianNum(metrics.fixedCount)} مبلغی</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در کد، عنوان یا توضیحات کوپن..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-600 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              همه انواع
            </button>
            <button
              onClick={() => setFilterType('percentage')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'percentage' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'}`}
            >
              درصدی (%)
            </button>
            <button
              onClick={() => setFilterType('fixed_amount')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterType === 'fixed_amount' ? 'bg-white text-teal-800 shadow-xs' : 'text-slate-600'}`}
            >
              مبلغ ثابت
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
            >
              همه وضعیت‌ها
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'active' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'}`}
            >
              فعال
            </button>
            <button
              onClick={() => setFilterStatus('inactive')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${filterStatus === 'inactive' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600'}`}
            >
              غیرفعال
            </button>
          </div>
        </div>
      </div>

      {/* Coupons Table / Cards */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        {filteredCoupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Ticket size={28} />
            </div>
            <p className="text-sm font-black text-slate-700">هیچ کد تخفیفی با مشخصات جستجو یافت نشد.</p>
            <p className="text-xs text-slate-400">می‌توانید با کلیک روی دکمه «ایجاد کد تخفیف جدید» اولین کوپن را ثبت نمایید.</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} />
              <span>ایجاد اولین کد تخفیف</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black text-slate-600">
                  <th className="p-4 w-44">کد تخفیف</th>
                  <th className="p-4">عنوان و توضیحات</th>
                  <th className="p-4 text-center">نوع و مقدار تخفیف</th>
                  <th className="p-4 text-center">شرایط حداقل سفارش / سقف</th>
                  <th className="p-4 text-center">دفعات استفاده</th>
                  <th className="p-4 text-center">وضعیت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
                {filteredCoupons.map((coupon) => {
                  const isPercentage = coupon.type === 'percentage';
                  const usagePercent = coupon.usageLimit 
                    ? Math.min(100, Math.round(((coupon.usedCount || 0) / coupon.usageLimit) * 100))
                    : 0;

                  return (
                    <tr key={coupon.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Code Badge */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span 
                            dir="ltr" 
                            className="bg-slate-100 border border-slate-300 text-slate-900 font-mono font-black text-xs px-2.5 py-1.5 rounded-xl select-all tracking-wider shadow-2xs"
                          >
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1.5 text-slate-400 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            title="کپی کد تخفیف"
                          >
                            {copiedCode === coupon.code ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          </button>
                        </div>
                        {coupon.createdAt && (
                          <span className="text-[10px] text-slate-400 block mt-1">ثبت: {coupon.createdAt}</span>
                        )}
                      </td>

                      {/* Title & Description */}
                      <td className="p-4 max-w-xs">
                        <span className="text-xs font-black text-slate-900 block">{coupon.title}</span>
                        {coupon.description && (
                          <span className="text-[11px] text-slate-500 font-normal line-clamp-2 mt-0.5 leading-relaxed">
                            {coupon.description}
                          </span>
                        )}
                      </td>

                      {/* Type & Value */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {isPercentage ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-black flex items-center gap-1">
                              <Percent size={12} />
                              <span>{toPersianNum(coupon.value)}٪ تخفیف</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5">درصدی</span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-black flex items-center gap-1">
                              <DollarSign size={12} />
                              <span>{toPersianNum(coupon.value.toLocaleString())} تومان</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal mt-0.5">مبلغ ثابت نقدی</span>
                          </div>
                        )}
                      </td>

                      {/* Conditions */}
                      <td className="p-4 text-center text-[11px] space-y-1">
                        {coupon.minOrderAmount ? (
                          <div className="text-slate-700">
                            حداقل سفارش: <span className="font-mono font-black">{toPersianNum(coupon.minOrderAmount.toLocaleString())}</span> تومان
                          </div>
                        ) : (
                          <div className="text-slate-400 font-normal">بدون حداقل سفارش</div>
                        )}

                        {isPercentage && coupon.maxDiscountAmount && (
                          <div className="text-amber-700 font-bold text-[10.5px]">
                            سقف تخفیف: <span className="font-mono font-black">{toPersianNum(coupon.maxDiscountAmount.toLocaleString())}</span> تومان
                          </div>
                        )}
                        {coupon.expiresAt && (
                          <div className="text-slate-400 font-normal text-[10px] flex items-center justify-center gap-1">
                            <Clock size={11} />
                            <span>انقضا: {coupon.expiresAt}</span>
                          </div>
                        )}
                      </td>

                      {/* Usage */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="font-mono text-xs font-black text-slate-800">
                            {toPersianNum(coupon.usedCount || 0)}
                            {coupon.usageLimit ? ` / ${toPersianNum(coupon.usageLimit)}` : ' مرتبه'}
                          </span>
                          {coupon.usageLimit && (
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                              <div 
                                className={`h-full rounded-full ${usagePercent >= 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${usagePercent}%` }} 
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Active Status */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(coupon.id)}
                          className="inline-flex items-center gap-1.5 cursor-pointer"
                          title={coupon.isActive ? 'کلیک جهت غیرفعال‌سازی' : 'کلیک جهت فعال‌سازی'}
                        >
                          {coupon.isActive ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-[11px] font-black flex items-center gap-1">
                              <CheckCircle2 size={12} className="text-emerald-600" />
                              <span>فعال</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1">
                              <X size={12} className="text-slate-400" />
                              <span>غیرفعال</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(coupon)}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="ویرایش کد تخفیف"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف کد تخفیف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-right max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket size={20} className="text-amber-400" />
                <h3 className="text-sm sm:text-base font-black">
                  {editingCoupon ? `ویرایش کد تخفیف «${editingCoupon.code}»` : 'تعریف کد تخفیف جدید (کوپن)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveCoupon} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              {/* Code + Generator */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  کد تخفیف (لاتین و بدون فاصله): <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="مثال: OFF10 یا NOOROOZ1403"
                    dir="ltr"
                    required
                    className="flex-1 bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-3.5 py-2 text-sm font-mono font-black text-slate-900 outline-none uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomCode}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shrink-0 cursor-pointer flex items-center gap-1 border border-slate-300"
                  >
                    <Sparkles size={13} className="text-amber-500" />
                    <span>کد رندوم</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  عنوان / مناسبت کد تخفیف: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: تخفیف ۱۰٪ سفارش اول بنکداران"
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              {/* Type Selection (Percentage vs Fixed) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  نوع محاسبه تخفیف:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('percentage')}
                    className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formType === 'percentage'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Percent size={16} />
                    <span>تخفیف درصدی (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('fixed_amount')}
                    className={`p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      formType === 'fixed_amount'
                        ? 'bg-teal-50 border-teal-400 text-teal-900 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign size={16} />
                    <span>مبلغ ثابت نقدی (تومان)</span>
                  </button>
                </div>
              </div>

              {/* Value Input */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  {formType === 'percentage' ? 'درصد تخفیف (۱ تا ۱۰۰):' : 'مبلغ تخفیف به تومان:'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={formType === 'percentage' ? 100 : 1000000000}
                    value={formValue || ''}
                    onChange={(e) => setFormValue(Number(e.target.value))}
                    required
                    placeholder={formType === 'percentage' ? 'مثال: ۱۰' : 'مثال: ۵۰۰۰۰۰'}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-3.5 py-2 text-sm font-mono font-black text-slate-900 outline-none"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {formType === 'percentage' ? 'درصد (%)' : 'تومان'}
                  </span>
                </div>
                {formType === 'fixed_amount' && formValue > 0 && (
                  <span className="text-[11px] text-teal-700 font-bold block mt-1">
                    معادل: {toPersianNum(formValue.toLocaleString())} تومان
                  </span>
                )}
              </div>

              {/* Minimum Order & Maximum Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    حداقل مبلغ سفارش (تومان - اختیاری):
                  </label>
                  <input
                    type="number"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    placeholder="مثال: ۲۰۰۰۰۰۰ (۲ میلیون)"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                  {formMinOrder && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {toPersianNum(Number(formMinOrder).toLocaleString())} تومان
                    </span>
                  )}
                </div>

                {formType === 'percentage' ? (
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      سقف تخفیف (تومان - اختیاری):
                    </label>
                    <input
                      type="number"
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(e.target.value)}
                      placeholder="مثال: ۳۰۰۰۰۰۰ (۳ میلیون)"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                    {formMaxDiscount && (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        حداکثر {toPersianNum(Number(formMaxDiscount).toLocaleString())} تومان
                      </span>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      سقف دفعات استفاده کل:
                    </label>
                    <input
                      type="number"
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(e.target.value)}
                      placeholder="مثال: ۱۰۰ (بدون محدودیت خالی بگذارید)"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Usage Limit & Expiry */}
              {formType === 'percentage' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      سقف دفعات استفاده کل:
                    </label>
                    <input
                      type="number"
                      value={formUsageLimit}
                      onChange={(e) => setFormUsageLimit(e.target.value)}
                      placeholder="مثال: ۱۰۰"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1">
                      تاریخ انقضا (اختیاری):
                    </label>
                    <input
                      type="text"
                      value={formExpiresAt}
                      onChange={(e) => setFormExpiresAt(e.target.value)}
                      placeholder="مثال: 1403/12/29"
                      className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">
                  توضیحات و شرایط استفاده:
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="توضیحات اختیاری جهت یادداشت شرایط اختصاصی کد تخفیف..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 rounded-xl p-3 text-xs font-medium text-slate-900 outline-none"
                />
              </div>

              {/* Is Active Toggle */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-black text-slate-800 block">فعال بودن کد تخفیف</span>
                  <span className="text-[10px] text-slate-500 font-normal">در صورت غیرفعال بودن، امکان استفاده از این کد در سبد خرید وجود نخواهد داشت.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${formIsActive ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <Check size={15} />
                  <span>{editingCoupon ? 'ذخیره تغییرات' : 'ثبت و فعال‌سازی کد تخفیف'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
