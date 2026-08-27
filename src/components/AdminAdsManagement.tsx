import { useState, useMemo } from "react";
import { 
  Megaphone, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Plus, 
  Phone, 
  User, 
  Building2, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles,
  Layers,
  Zap,
  Loader2,
  RefreshCw,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { uploadToParsPackStorage } from "../utils/storage";

interface AdminAdsManagementProps {
  sponsoredAds: any[];
  onUpdateAdStatus: (adId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) => Promise<void> | void;
  onEditAd: (adId: string, updatedFields: any) => Promise<void> | void;
  onUpdateB2bConfig: (cfg: any) => Promise<void>;
  b2bConfig: any;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
}

export default function AdminAdsManagement({
  sponsoredAds = [],
  onUpdateAdStatus,
  onEditAd,
  onUpdateB2bConfig,
  b2bConfig,
  setSuccessMsg,
  setErrorMsg
}: AdminAdsManagementProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit Modal State
  const [adToEdit, setAdToEdit] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // New Ad Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newFactory, setNewFactory] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCategory, setNewCategory] = useState<'under_market' | 'liquid' | 'direct_supply'>('under_market');
  const [newQuantity, setNewQuantity] = useState('');
  const [newWholesalePrice, setNewWholesalePrice] = useState('');
  const [newMarketPrice, setNewMarketPrice] = useState('');
  const [newBuyerProfit, setNewBuyerProfit] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered ads
  const filteredAds = useMemo(() => {
    return sponsoredAds.filter(ad => {
      const matchesStatus = filterStatus === 'all' || ad.status === filterStatus || (filterStatus === 'pending' && (!ad.status || ad.status === 'pending' || ad.status === 'در حال بررسی'));
      const matchesCategory = categoryFilter === 'all' || ad.category === categoryFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        (ad.title && ad.title.toLowerCase().includes(q)) ||
        (ad.factoryName && ad.factoryName.toLowerCase().includes(q)) ||
        (ad.contactPhone && ad.contactPhone.toLowerCase().includes(q)) ||
        (ad.contactPerson && ad.contactPerson.toLowerCase().includes(q));
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [sponsoredAds, filterStatus, categoryFilter, searchQuery]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadToParsPackStorage(file, "ads");
      if (res.success && res.url) {
        setUploadedImage(res.url);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setUploadedImage(reader.result as string);
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newWholesalePrice || !newMarketPrice || !newPhone) {
      setErrorMsg("لطفاً عنوان، قیمت کف، قیمت بازار و شماره تماس را تکمیل کنید.");
      return;
    }
    setIsSubmitting(true);
    try {
      let finalBadge = "📉 زیر قیمت بازار";
      if (newCategory === "liquid") finalBadge = "🔥 حراج عمده";
      else if (newCategory === "direct_supply") finalBadge = "📦 تامین مستقیم";

      const newAd = {
        id: `ad-${Date.now()}`,
        title: newTitle,
        description: newDescription || "ثبت آگهی مستقیم کف قیمت / تهاتر کالا توسط مدیریت.",
        factoryName: newFactory || "تأمین‌کننده / انبار مرکزی",
        contactPerson: newContactPerson || "مدیریت ارشد",
        contactPhone: newPhone,
        badgeText: finalBadge,
        category: newCategory,
        quantity: newQuantity || "توافقی",
        wholesalePrice: newWholesalePrice.includes("تومان") ? newWholesalePrice : `${newWholesalePrice} تومان`,
        marketPrice: newMarketPrice.includes("تومان") ? newMarketPrice : `${newMarketPrice} تومان`,
        buyerProfit: newBuyerProfit || "۲۰٪ سود ناخالص",
        isSponsored: false,
        date: new Date().toLocaleDateString("fa-IR"),
        imageUrl: uploadedImage || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400",
        imageUrls: uploadedImage ? [uploadedImage] : [],
        status: "approved"
      };

      const updated = [newAd, ...sponsoredAds];
      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

      if (onUpdateB2bConfig && b2bConfig) {
        await onUpdateB2bConfig({
          ...b2bConfig,
          sponsoredAds: updated
        });
      }

      setSuccessMsg("آگهی جدید با موفقیت ثبت و در تالار منتشر شد.");
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewFactory('');
      setNewContactPerson('');
      setNewPhone('');
      setNewQuantity('');
      setNewWholesalePrice('');
      setNewMarketPrice('');
      setNewBuyerProfit('');
      setUploadedImage(null);
    } catch (err: any) {
      setErrorMsg("خطا در ثبت آگهی: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm("آیا از حذف این آگهی اطمینان دارید؟")) return;
    const updated = sponsoredAds.filter(a => a.id !== adId);
    localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
    if (onUpdateB2bConfig && b2bConfig) {
      await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: updated });
    }
    setSuccessMsg("آگهی با موفقیت حذف شد.");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adToEdit) return;
    await onEditAd(adToEdit.id, editForm);
    setAdToEdit(null);
    setEditForm(null);
    setSuccessMsg("تغییرات آگهی با موفقیت ذخیره شد.");
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-[2.5rem] text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl border border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-black">
            <Megaphone size={12} />
            <span>مدیریت متمرکز بیلبورد و کف قیمت بازار</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            مدیریت آگهی‌های کف قیمت بازار و تهاتر کالا
          </h2>
          <p className="text-xs text-slate-300 font-bold max-w-2xl">
            تمامی آگهی‌های ثبت‌شده در سایت در این بخش متمرکز شده‌اند. کف قیمت بازار و تهاتر کالا منحصراً در اینجا مدیریت، تایید، ویرایش و حذف می‌شوند.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
        >
          <Plus size={16} />
          <span>ثبت آگهی جدید (مدیریت)</span>
        </button>
      </div>

      {/* FILTER & STATS BAR */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === 'all'
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            همه آگهی‌ها ({sponsoredAds.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === 'pending'
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            در انتظار تأیید ({sponsoredAds.filter(a => !a.status || a.status === 'pending' || a.status === 'در حال بررسی').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === 'approved'
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            تأییدشده ({sponsoredAds.filter(a => a.status === 'approved').length})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterStatus === 'rejected'
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            ردشده ({sponsoredAds.filter(a => a.status === 'rejected').length})
          </button>
        </div>

        {/* SEARCH & CATEGORY FILTER */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="دسته‌بندی آگهی‌ها"
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">همه دسته‌ها</option>
            <option value="under_market">📉 کف قیمت بازار</option>
            <option value="liquid">🔥 حراج عمده / مازاد</option>
            <option value="direct_supply">📦 تامین مستقیم کارخانه</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در عنوان، کارخانه، تلفن..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="جستجو در عنوان، کارخانه، تلفن..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* ADS GRID / LIST */}
      {filteredAds.length === 0 ? (
        <div className="bg-white p-16 rounded-[2.5rem] border border-slate-200 text-center space-y-3">
          <Megaphone size={48} className="mx-auto text-slate-300" />
          <h4 className="text-base font-black text-slate-800">هیچ آگهی با این مشخصات یافت نشد</h4>
          <p className="text-xs text-slate-400 font-bold">می توانید با استفاده از دکمه بالا آگهی جدیدی ثبت کنید یا فیلترها را تغییر دهید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAds.map((ad, idx) => {
            const isPending = !ad.status || ad.status === 'pending' || ad.status === 'در حال بررسی';
            const isApproved = ad.status === 'approved';
            const isRejected = ad.status === 'rejected';

            return (
              <div 
                key={`admin-ad-${ad.id || idx}`}
                className={`bg-white rounded-[2rem] border p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
                  isPending ? "border-amber-300 ring-2 ring-amber-400/20" : isApproved ? "border-slate-200" : "border-rose-200 bg-rose-50/20"
                }`}
              >
                {/* Status Badge Top Left */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5">
                  {isPending && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                      <Clock size={11} /> در انتظار تایید
                    </span>
                  )}
                  {isApproved && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle size={11} /> منتشرشده
                    </span>
                  )}
                  {isRejected && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-3 py-1 rounded-full border border-rose-200 flex items-center gap-1">
                      <XCircle size={11} /> ردشده
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Category & Date */}
                  <div className="flex items-center gap-2 pr-1">
                    <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-2.5 py-1 rounded-lg">
                      {ad.badgeText || 'کف قیمت'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{ad.date}</span>
                  </div>

                  {/* Image & Title */}
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      <img src={ad.imageUrl || ad.imageUrls?.[0]} alt={ad.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h3 className="font-black text-sm text-slate-900 line-clamp-2 leading-snug">{ad.title}</h3>
                      <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                        <Building2 size={12} className="text-slate-400" />
                        <span>{ad.factoryName || 'تأمین‌کننده'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 font-medium line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {ad.description}
                  </p>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/60 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px]">شخص رابط:</span>
                      <strong className="text-slate-800 font-black">{ad.contactPerson || 'نامشخص'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">تلفن تماس:</span>
                      <strong className="text-indigo-700 font-black" dir="ltr">{ad.contactPhone || 'درج نشده'}</strong>
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex justify-between items-center bg-emerald-50/80 px-3 py-2 rounded-xl border border-emerald-100">
                      <span className="text-slate-600 text-[11px]">قیمت کف عمده:</span>
                      <strong className="text-emerald-700 font-black">{ad.wholesalePrice}</strong>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[11px]">قیمت بازار:</span>
                      <strong className="text-slate-700 font-black">{ad.marketPrice}</strong>
                    </div>
                    <div className="flex justify-between items-center bg-amber-50/80 px-3 py-2 rounded-xl border border-amber-100">
                      <span className="text-amber-800 text-[11px]">سود خریدار:</span>
                      <strong className="text-amber-900 font-black">{ad.buyerProfit}</strong>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-5 mt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => onUpdateAdStatus(ad.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Check size={14} />
                          <span>تأیید</span>
                        </button>
                        <button
                          onClick={() => onUpdateAdStatus(ad.id, 'rejected', 'عدم انطباق با ضوابط معامله امن')}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          رد
                        </button>
                      </>
                    ) : isApproved ? (
                      <button
                        onClick={() => onUpdateAdStatus(ad.id, 'pending')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        تبدیل به در انتظار
                      </button>
                    ) : (
                      <button
                        onClick={() => onUpdateAdStatus(ad.id, 'approved')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        انتشار مجدد
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setAdToEdit(ad);
                        setEditForm({ ...ad });
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                      title="ویرایش آگهی"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteAd(ad.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer"
                      title="حذف آگهی"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {adToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">ویرایش آگهی کف قیمت بازار / تهاتر</h3>
              <button onClick={() => setAdToEdit(null)} className="p-2 text-slate-400 hover:text-slate-700 rounded-full"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">عنوان کالا / آگهی</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  aria-label="عنوان کالا / آگهی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">نام کارخانه / تأمین‌کننده</label>
                  <input
                    type="text"
                    value={editForm.factoryName || ''}
                    onChange={(e) => setEditForm({ ...editForm, factoryName: e.target.value })}
                    aria-label="نام کارخانه / تأمین‌کننده"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">تلفن تماس (محفوظ)</label>
                  <input
                    type="text"
                    value={editForm.contactPhone || ''}
                    onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    aria-label="تلفن تماس (محفوظ)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">قیمت کف عمده</label>
                  <input
                    type="text"
                    value={editForm.wholesalePrice || ''}
                    onChange={(e) => setEditForm({ ...editForm, wholesalePrice: e.target.value })}
                    aria-label="قیمت کف عمده"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">قیمت بازار</label>
                  <input
                    type="text"
                    value={editForm.marketPrice || ''}
                    onChange={(e) => setEditForm({ ...editForm, marketPrice: e.target.value })}
                    aria-label="قیمت بازار"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">سود خریدار</label>
                  <input
                    type="text"
                    value={editForm.buyerProfit || ''}
                    onChange={(e) => setEditForm({ ...editForm, buyerProfit: e.target.value })}
                    aria-label="سود خریدار"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">لینک تصویر آگهی یا آپلود</label>
                <div className="flex items-center gap-3">
                  {editForm.imageUrl && (
                    <img src={editForm.imageUrl} alt="Ad Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                  )}
                  <input
                    type="text"
                    value={editForm.imageUrl || ''}
                    onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value, imageUrls: [e.target.value] })}
                    placeholder="آدرس اینترنتی تصویر یا آپلود فایل"
                    aria-label="لینک تصویر آگهی یا آپلود"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    dir="ltr"
                  />
                  <label className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black cursor-pointer shrink-0 transition-colors flex items-center gap-1.5">
                    <Upload size={14} />
                    <span>آپلود عکس</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const res = await uploadToParsPackStorage(file, "ads");
                        if (res.success && res.url) {
                          setEditForm({ ...editForm, imageUrl: res.url, imageUrls: [res.url] });
                        } else {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const resUrl = reader.result as string;
                            setEditForm({ ...editForm, imageUrl: resUrl, imageUrls: [resUrl] });
                          };
                          reader.readAsDataURL(file);
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }} />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">توضیحات و شرایط عرضه</label>
                <textarea
                  rows={3}
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  aria-label="توضیحات و شرایط عرضه"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdToEdit(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 shadow-md cursor-pointer"
                >
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CREATE NEW AD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] border border-slate-200 p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl text-right"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900">ثبت آگهی جدید در کف قیمت بازار</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-full"><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateAd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">عنوان کالا / آگهی *</label>
                <input
                  type="text"
                  placeholder="مثال: قوطی تن ماهی ۵۰ کارتن زیر قیمت کارخانه"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  aria-label="عنوان کالا / آگهی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">نام کارخانه / تأمین‌کننده</label>
                  <input
                    type="text"
                    placeholder="مثال: صنایع غذایی گلستان"
                    value={newFactory}
                    onChange={(e) => setNewFactory(e.target.value)}
                    aria-label="نام کارخانه / تأمین‌کننده"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">تلفن تماس (محفوظ) *</label>
                  <input
                    type="text"
                    placeholder="09123456789"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    required
                    dir="ltr"
                    aria-label="تلفن تماس (محفوظ)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">دسته‌بندی</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    aria-label="دسته‌بندی آگهی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="under_market">📉 کف قیمت بازار</option>
                    <option value="liquid">🔥 حراج عمده / مازاد</option>
                    <option value="direct_supply">📦 تامین مستقیم</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">قیمت کف عمده *</label>
                  <input
                    type="text"
                    placeholder="مثال: ۴۵۰,۰۰۰ تومان"
                    value={newWholesalePrice}
                    onChange={(e) => setNewWholesalePrice(e.target.value)}
                    required
                    aria-label="قیمت کف عمده"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">قیمت بازار *</label>
                  <input
                    type="text"
                    placeholder="مثال: ۵۸۰,۰۰۰ تومان"
                    value={newMarketPrice}
                    onChange={(e) => setNewMarketPrice(e.target.value)}
                    required
                    aria-label="قیمت بازار"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">میزان / تناژ</label>
                  <input
                    type="text"
                    placeholder="مثال: ۲۰۰ کارتن"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(e.target.value)}
                    aria-label="میزان / تناژ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">سود خریدار</label>
                  <input
                    type="text"
                    placeholder="مثال: ۲۲٪ سود ناخالص"
                    value={newBuyerProfit}
                    onChange={(e) => setNewBuyerProfit(e.target.value)}
                    aria-label="سود خریدار"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">تصویر کالا</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    aria-label="تصویر کالا"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 file:ml-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-emerald-50 file:text-emerald-700 cursor-pointer"
                  />
                  {isUploading && <Loader2 className="animate-spin text-emerald-600" size={20} />}
                </div>
                {uploadedImage && (
                  <div className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden mt-2">
                    <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700">توضیحات و شرایط عرضه</label>
                <textarea
                  rows={3}
                  placeholder="توضیحات کامل درباره بار، تاریخ انقضا و شرایط تحویل..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  aria-label="توضیحات و شرایط عرضه"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black hover:bg-emerald-500 shadow-md cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>ثبت و انتشار آگهی</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
