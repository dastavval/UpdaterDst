import React, { useState, useMemo } from "react";
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  Edit3, 
  Eye, 
  DollarSign, 
  Check, 
  X, 
  TrendingUp, 
  Tag, 
  ShieldCheck, 
  FileText, 
  Percent, 
  Layers, 
  Boxes, 
  AlertTriangle, 
  Save, 
  Trash2, 
  Power,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";

interface AdminFactoryProductAuditProps {
  products: Product[];
  onUpdateProduct: (productId: string, updatedFields: Partial<Product>) => Promise<void> | void;
  onDeleteProduct?: (productId: string) => Promise<void> | void;
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const s = String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

export default function AdminFactoryProductAudit({
  products = [],
  onUpdateProduct,
  onDeleteProduct
}: AdminFactoryProductAuditProps) {
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'rejected' | 'disabled' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Rejection Modal State
  const [rejectionModalProd, setRejectionModalProd] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Edit Price Modal State
  const [editingPriceProd, setEditingPriceProd] = useState<Product | null>(null);
  const [newSitePrice, setNewSitePrice] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filter Factory-submitted products
  const factoryProducts = useMemo(() => {
    return products.filter(p => {
      // Must be submitted by a factory/seller or have factory info
      const hasFactoryOrigin = !!(p.factoryName || p.factory_name || (p.sellerId && p.sellerId !== 'admin'));
      return hasFactoryOrigin;
    });
  }, [products]);

  // Apply status & search filters
  const filteredProducts = useMemo(() => {
    return factoryProducts.filter(p => {
      const matchesSearch = !searchQuery || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.factoryName || p.factory_name || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;

      const status = p.approvalStatus || (p.isApproved ? 'approved' : 'pending');
      const isDisabled = p.disabled === true;

      let matchesStatus = true;
      if (filterStatus === 'pending') matchesStatus = status === 'pending' && !isDisabled;
      else if (filterStatus === 'approved') matchesStatus = status === 'approved' && !isDisabled;
      else if (filterStatus === 'rejected') matchesStatus = status === 'rejected' && !isDisabled;
      else if (filterStatus === 'disabled') matchesStatus = isDisabled;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [factoryProducts, searchQuery, selectedCategory, filterStatus]);

  // Unique Categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    factoryProducts.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [factoryProducts]);

  // Counts for Badges
  const counts = useMemo(() => {
    let pending = 0, approved = 0, rejected = 0, disabled = 0;
    factoryProducts.forEach(p => {
      if (p.disabled) disabled++;
      else {
        const st = p.approvalStatus || (p.isApproved ? 'approved' : 'pending');
        if (st === 'approved') approved++;
        else if (st === 'rejected') rejected++;
        else pending++;
      }
    });
    return { pending, approved, rejected, disabled, total: factoryProducts.length };
  }, [factoryProducts]);

  // Approve and Publish
  const handleApproveAndPublish = async (product: Product, customPrice?: number) => {
    setIsSubmitting(true);
    try {
      const finalPrice = customPrice || product.price || product.bulk_price;
      await onUpdateProduct(product.id, {
        approvalStatus: 'approved',
        isApproved: true,
        disabled: false,
        price: finalPrice,
        rejectionReason: undefined
      });
      setSuccessNotice(`محصول «${product.name}» با موفقیت تایید و با قیمت ${finalPrice.toLocaleString('fa-IR')} تومان منتشر گردید.`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      alert("خطا در انتشار محصول: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
      setEditingPriceProd(null);
    }
  };

  // Open Rejection Modal
  const handleOpenRejectModal = (product: Product) => {
    setRejectionModalProd(product);
    setRejectionReason((product as any).rejectionReason || "عدم تطابق قیمت پایه یا اطلاعات پروانه بهداشت");
  };

  // Submit Rejection
  const handleSubmitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalProd) return;
    setIsSubmitting(true);
    try {
      await onUpdateProduct(rejectionModalProd.id, {
        approvalStatus: 'rejected',
        isApproved: false,
        disabled: true,
        rejectionReason: rejectionReason.trim()
      } as any);

      setSuccessNotice(`محصول «${rejectionModalProd.name}» رد شد و علت آن به کارخانه ارسال گردید.`);
      setTimeout(() => setSuccessNotice(null), 4000);
      setRejectionModalProd(null);
    } catch (err: any) {
      alert("خطا در رد محصول: " + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active/Disabled status
  const handleToggleDisabled = async (product: Product) => {
    const nextDisabled = !product.disabled;
    try {
      await onUpdateProduct(product.id, {
        disabled: nextDisabled
      });
      setSuccessNotice(`وضعیت انتشار «${product.name}» به ${nextDisabled ? 'غیرفعال (تعلیق)' : 'فعال'} تغییر یافت.`);
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      alert("خطا در تغییر وضعیت: " + (err.message || err));
    }
  };

  // Helper for Margin Calculation
  const calculateMargin = (factoryPrice: number, sitePrice: number) => {
    if (!factoryPrice || factoryPrice <= 0) return 0;
    return Math.round(((sitePrice - factoryPrice) / factoryPrice) * 100);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-right font-sans" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-50 to-indigo-50 border border-amber-200/80 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
              🏭
            </span>
            <h2 className="text-base font-black text-slate-900">کارتابل ممیزی و تایید کالاهای کارخانجات</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            بررسی تخصصی اصالت، تغییر و تعیین قیمت فروش ویترین، تایید انتشار یا رد محصولات ثبت‌شده توسط تولیدکنندگان.
          </p>
        </div>

        {/* Quick Counters */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <div className="bg-amber-100/80 text-amber-900 px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 border border-amber-200">
            <Clock size={14} className="text-amber-700 animate-spin" />
            <span>نیازمند ممیزی: {toPersianNum(counts.pending)} کالا</span>
          </div>
          <div className="bg-emerald-100/80 text-emerald-900 px-3.5 py-1.5 rounded-2xl text-xs font-black flex items-center gap-1.5 border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-700" />
            <span>منتشر شده: {toPersianNum(counts.approved)}</span>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs font-black flex items-center gap-2 border border-emerald-200 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        
        {/* Status Filter Pills */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              filterStatus === 'pending'
                ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Clock size={15} />
            <span>در انتظار ممیزی</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.2 rounded-full font-black">
              {toPersianNum(counts.pending)}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              filterStatus === 'approved'
                ? "bg-emerald-600 text-white font-black shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <CheckCircle2 size={15} />
            <span>تایید و منتشر شده</span>
            <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.2 rounded-full font-black">
              {toPersianNum(counts.approved)}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              filterStatus === 'rejected'
                ? "bg-rose-600 text-white font-black shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <XCircle size={15} />
            <span>رد شده با علت</span>
            <span className="bg-rose-100 text-rose-900 text-[10px] px-2 py-0.2 rounded-full font-black">
              {toPersianNum(counts.rejected)}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('disabled')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              filterStatus === 'disabled'
                ? "bg-slate-800 text-white font-black shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Power size={15} />
            <span>غیرفعال / تعلیق شده</span>
            <span className="bg-slate-200 text-slate-800 text-[10px] px-2 py-0.2 rounded-full font-black">
              {toPersianNum(counts.disabled)}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? "bg-indigo-600 text-white font-black shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <span>همه کالاهای کارخانه</span>
            <span className="bg-indigo-100 text-indigo-900 text-[10px] px-2 py-0.2 rounded-full font-black">
              {toPersianNum(counts.total)}
            </span>
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام کالا، برند یا نام کارخانه..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 cursor-pointer"
          >
            <option value="all">همه دسته‌بندی‌ها</option>
            {categoriesList.map(cat => (
              <option key={`audit-cat-opt-${cat}`} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Audit List */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-200 space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <h4 className="text-xs font-black text-slate-700">هیچ کالایی متناسب با این فیلتر یافت نشد</h4>
          <p className="text-[11px] text-slate-400">می‌توانید فیلتر یا عبارت جستجو را تغییر دهید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((prod) => {
            const factoryPrice = prod.bulk_price || prod.price || 0;
            const sitePrice = prod.price || factoryPrice;
            const marginPercent = calculateMargin(factoryPrice, sitePrice);
            const status = prod.approvalStatus || (prod.isApproved ? 'approved' : 'pending');
            const factoryName = prod.factoryName || prod.factory_name || prod.brand || "کارخانه تولیدی";

            return (
              <div 
                key={prod.id}
                className={`bg-white rounded-3xl p-5 border transition-all space-y-4 shadow-2xs hover:shadow-xs ${
                  status === 'pending'
                    ? "border-amber-300/80 ring-2 ring-amber-400/20"
                    : status === 'rejected'
                    ? "border-rose-200 bg-rose-50/20"
                    : prod.disabled
                    ? "border-slate-200 opacity-75"
                    : "border-slate-200/90"
                }`}
              >
                {/* Top Bar: Factory Origin Badge & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  
                  {/* Factory Origin Info */}
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px] font-black px-3 py-1 rounded-xl flex items-center gap-1.5">
                      <Building2 size={14} className="text-indigo-600" />
                      <span>تولید کارخانه: <strong>{factoryName}</strong></span>
                    </span>

                    {prod.healthLicense && (
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-emerald-200/60 font-mono">
                        سیب سلامت: {prod.healthLicense}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {status === 'pending' && !prod.disabled && (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-3 py-1 rounded-xl flex items-center gap-1">
                        <Clock size={14} className="text-amber-700 animate-spin" />
                        <span>در انتظار ممیزی ادمین</span>
                      </span>
                    )}

                    {status === 'approved' && !prod.disabled && (
                      <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black px-3 py-1 rounded-xl flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-emerald-700" />
                        <span>منتشر شده و فعال در سایت</span>
                      </span>
                    )}

                    {status === 'rejected' && !prod.disabled && (
                      <span className="bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-black px-3 py-1 rounded-xl flex items-center gap-1">
                        <XCircle size={14} className="text-rose-700" />
                        <span>رد شده توسط ممیزی</span>
                      </span>
                    )}

                    {prod.disabled && (
                      <span className="bg-slate-200 text-slate-800 text-[11px] font-black px-3 py-1 rounded-xl flex items-center gap-1">
                        <Power size={14} className="text-slate-600" />
                        <span>غیرفعال / تعلیق شده</span>
                      </span>
                    )}
                  </div>

                </div>

                {/* Main Product Info & Pricing Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  
                  {/* Image & Title (Col 5) */}
                  <div className="lg:col-span-5 flex items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-contain" />
                      ) : (
                        <Boxes className="text-slate-300" size={32} />
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold block">{prod.category} • برند {prod.brand}</span>
                      <h3 className="text-xs font-black text-slate-900">{prod.name}</h3>
                      <div className="text-[11px] text-slate-500 font-medium">
                        بسته‌بندی: <strong>{toPersianNum(prod.carton_pack_count)} عدد در کارتن</strong> | حداقل سفارش: <strong>{toPersianNum(prod.min_order_cartons)} کارتن</strong>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown (Col 4) */}
                  <div className="lg:col-span-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">قیمت اعلامی کارخانه (درب کارخانه):</span>
                      <span className="font-mono font-black text-slate-900">
                        {toPersianNum(factoryPrice.toLocaleString('fa-IR'))} تومان
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-indigo-900 font-black">قیمت فروش در ویترین سایت:</span>
                      <span className="font-mono font-black text-indigo-700 text-sm">
                        {toPersianNum(sitePrice.toLocaleString('fa-IR'))} تومان
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-slate-500 font-bold">مارجین / سود بازاریابی سایت:</span>
                      <span className={`font-black px-2 py-0.2 rounded-md ${
                        marginPercent > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                      }`}>
                        +{toPersianNum(marginPercent)}٪ سود
                      </span>
                    </div>
                  </div>

                  {/* Quick Admin Actions (Col 3) */}
                  <div className="lg:col-span-3 flex flex-col gap-2">
                    
                    {/* Approve / Edit Price Button */}
                    <button
                      onClick={() => {
                        setEditingPriceProd(prod);
                        setNewSitePrice(String(prod.price || prod.bulk_price || ""));
                      }}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <DollarSign size={15} />
                      <span>{status === 'approved' ? "تغییر قیمت فروش سایت" : "تعیین قیمت و انتشار کالا"}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Reject Button */}
                      <button
                        onClick={() => handleOpenRejectModal(prod)}
                        className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <XCircle size={13} />
                        <span>رد کالا</span>
                      </button>

                      {/* Deactivate/Active Switch */}
                      <button
                        onClick={() => handleToggleDisabled(prod)}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                          prod.disabled 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                      >
                        <Power size={13} />
                        <span>{prod.disabled ? "فعال‌سازی" : "غیرفعال"}</span>
                      </button>
                    </div>

                  </div>

                </div>

                {/* Show rejection reason if exists */}
                {(prod as any).rejectionReason && status === 'rejected' && (
                  <div className="bg-rose-100/70 text-rose-900 p-3 rounded-2xl text-xs font-medium border border-rose-200 flex items-start gap-2">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-black">علت رد شده قبلی: </strong>
                      <span>{(prod as any).rejectionReason}</span>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Edit Price & Approve/Publish */}
      <AnimatePresence>
        {editingPriceProd && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-indigo-600" />
                  <h4 className="text-sm font-black text-slate-900">تعیین قیمت فروش سایت و انتشار کالا</h4>
                </div>
                <button
                  onClick={() => setEditingPriceProd(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs space-y-1">
                  <div className="font-black text-slate-900">{editingPriceProd.name}</div>
                  <div className="text-[11px] text-slate-500">
                    قیمت اعلامی کارخانه: <strong className="text-slate-900 font-mono">{toPersianNum((editingPriceProd.bulk_price || editingPriceProd.price || 0).toLocaleString('fa-IR'))} تومان</strong>
                  </div>
                </div>

                {/* Quick Margin Calculators */}
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">افزودن سریع مارجین سود سایت:</label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((margin) => {
                      const basePrice = editingPriceProd.bulk_price || editingPriceProd.price || 0;
                      const calculated = Math.round(basePrice * (1 + margin / 100));
                      return (
                        <button
                          key={margin}
                          type="button"
                          onClick={() => setNewSitePrice(String(calculated))}
                          className="flex-1 py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-[11px] font-black border border-indigo-200 cursor-pointer"
                        >
                          +{toPersianNum(margin)}٪ سود
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">قیمت نهایی فروش در ویترین (تومان):</label>
                  <input
                    type="text"
                    value={newSitePrice}
                    onChange={(e) => setNewSitePrice(e.target.value)}
                    placeholder="مثال: 480000"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 text-xs font-bold text-slate-900 font-mono text-left"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPriceProd(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    const priceNum = parseInt(newSitePrice.replace(/[^0-9]/g, ""), 10);
                    if (!priceNum || priceNum <= 0) {
                      alert("لطفاً قیمت معتبر وارد فرمایید.");
                      return;
                    }
                    handleApproveAndPublish(editingPriceProd, priceNum);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check size={16} />
                  <span>تایید و انتشار در ویترین</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal 2: Rejection Reason */}
      <AnimatePresence>
        {rejectionModalProd && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-right"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <XCircle size={20} className="text-rose-600" />
                  <h4 className="text-sm font-black text-slate-900">ثبت عدم تایید و رد محصول کارخانه</h4>
                </div>
                <button
                  onClick={() => setRejectionModalProd(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitRejection} className="space-y-4">
                <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-xs text-rose-900 font-medium">
                  کالای «{rejectionModalProd.name}» غیرفعال شده و علت رد به کارخانه اطلاع داده خواهد شد.
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">علت رد کالا (جهت اطلاع کارخانه):</label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="مثال: قیمت پایه نامتعارف، عدم تطابق تصویر کالا با سیب سلامت..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-rose-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRejectionModalProd(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <XCircle size={16} />
                    <span>تایید و ثبت رد کالا</span>
                  </button>
                </div>
              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
