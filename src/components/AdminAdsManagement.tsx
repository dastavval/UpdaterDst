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
  Upload,
  Boxes,
  Wrench,
  Briefcase,
  Eye,
  Repeat,
  RotateCcw,
  ArrowLeftRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { uploadToParsPackStorage } from "../utils/storage";
import ImageLightbox from "./ImageLightbox";
import StrictCityProvinceSelector from "./StrictCityProvinceSelector";

interface AdminAdsManagementProps {
  sponsoredAds: any[];
  rawMaterialAds?: any[];
  equipmentAds?: any[];
  serviceAds?: any[];
  barterDeals?: any[];
  onUpdateAdStatus: (adId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) => Promise<void> | void;
  onEditAd: (adId: string, updatedFields: any) => Promise<void> | void;
  onUpdateB2bConfig: (cfg: any) => Promise<void>;
  b2bConfig: any;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
}

export default function AdminAdsManagement({
  sponsoredAds = [],
  rawMaterialAds = [],
  equipmentAds = [],
  serviceAds = [],
  barterDeals = [],
  onUpdateAdStatus,
  onEditAd,
  onUpdateB2bConfig,
  b2bConfig,
  setSuccessMsg,
  setErrorMsg
}: AdminAdsManagementProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'special_requests'>('pending');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection reason modal state
  const [rejectingAdId, setRejectingAdId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

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
  const [newCity, setNewCity] = useState('تهران');
  const [newProvince, setNewProvince] = useState('تهران');
  const [newBuyerProfit, setNewBuyerProfit] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<{url: string, title: string} | null>(null);

  // Combine ALL Ad Categories into a unified list
  const allCombinedAds = useMemo(() => {
    const list: any[] = [];

    // 1. Sponsored / Floor Market / Surplus Ads
    (sponsoredAds || []).forEach(ad => {
      const normStatus = ad.status === 'approved' ? 'approved' : (ad.status === 'rejected' ? 'rejected' : 'pending');
      list.push({
        ...ad,
        adCategoryGroup: 'sponsored',
        typeLabel: ad.category === 'liquid' ? '🔥 حراج مازاد' : ad.category === 'direct_supply' ? '📦 تامین مستقیم' : '📉 کف قیمت بازار',
        typeColor: ad.category === 'liquid' ? 'bg-emerald-50 text-amber-700 border-emerald-200' : ad.category === 'direct_supply' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-600 text-white border-emerald-200',
        displayTitle: ad.title || 'آگهی تالار کف بازار',
        displayCompany: ad.factoryName || 'تولیدکننده / انبار',
        displayContact: ad.contactPerson || ad.userName || 'ثبت‌کننده',
        displayPhone: ad.contactPhone || ad.phone || ad.sellerPhone || 'ثبت نشده',
        displayCategory: ad.category === 'liquid' ? 'حراج مازاد' : ad.category === 'direct_supply' ? 'تامین مستقیم' : 'کف قیمت',
        displayPrice: ad.wholesalePrice || 'توافقی',
        normalizedStatus: normStatus
      });
    });

    // 2. Raw Material Ads
    (rawMaterialAds || []).forEach(rm => {
      const isPending = rm.isPendingApproval || !rm.status || rm.status === 'pending' || rm.status === 'در حال بررسی';
      const isAppr = rm.status === 'approved' || (!rm.isPendingApproval && rm.status !== 'pending' && rm.status !== 'rejected');
      const isRej = rm.status === 'rejected';
      const normStatus = isAppr ? 'approved' : (isRej ? 'rejected' : 'pending');

      list.push({
        ...rm,
        adCategoryGroup: 'raw_material',
        typeLabel: '🧪 مواد اولیه صنعتی',
        typeColor: 'bg-emerald-600 text-white border-emerald-200',
        displayTitle: rm.name || rm.title || 'ماده اولیه صنعتی',
        displayCompany: rm.supplierName || 'تامین‌کننده',
        displayContact: rm.supplierName || 'مدیر تامین',
        displayPhone: rm.contactPhone || rm.phone || rm.supplierPhone || 'ثبت نشده',
        displayCategory: rm.category || 'مواد اولیه',
        displayPrice: rm.priceEstimate ? (rm.priceEstimate + " تومان") : (rm.wholesalePrice || 'استعلام قیمت'),
        normalizedStatus: normStatus
      });
    });

    // 3. Equipment Ads
    (equipmentAds || []).forEach(eq => {
      const isPending = eq.isPendingApproval || !eq.status || eq.status === 'pending' || eq.status === 'در حال بررسی';
      const isAppr = eq.status === 'approved' || (!eq.isPendingApproval && eq.status !== 'pending' && eq.status !== 'rejected');
      const isRej = eq.status === 'rejected';
      const normStatus = isAppr ? 'approved' : (isRej ? 'rejected' : 'pending');

      list.push({
        ...eq,
        adCategoryGroup: 'equipment',
        typeLabel: '🏭 دستگاه و ماشین‌آلات',
        typeColor: 'bg-emerald-600 text-white border-emerald-200',
        displayTitle: eq.title || eq.name || 'تجهیزات صنعتی',
        displayCompany: eq.factoryName || 'کارخانه / مالک',
        displayContact: eq.contactPerson || 'فروشنده',
        displayPhone: eq.contactPhone || eq.phone || 'ثبت نشده',
        displayCategory: eq.category || 'ماشین‌آلات',
        displayPrice: eq.wholesalePrice || (eq.price ? (eq.price + " تومان") : 'توافقی'),
        normalizedStatus: normStatus
      });
    });

    // 4. Service Ads
    (serviceAds || []).forEach(srv => {
      const isPending = srv.isPendingApproval || !srv.status || srv.status === 'pending' || srv.status === 'در حال بررسی';
      const isAppr = srv.status === 'approved' || (!srv.isPendingApproval && srv.status !== 'pending' && srv.status !== 'rejected');
      const isRej = srv.status === 'rejected';
      const normStatus = isAppr ? 'approved' : (isRej ? 'rejected' : 'pending');

      list.push({
        ...srv,
        adCategoryGroup: 'service',
        typeLabel: '🛠 خدمات صنعتی',
        typeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        displayTitle: srv.title || 'خدمات صنعتی',
        displayCompany: srv.providerName || 'کارگزار خدمات',
        displayContact: srv.providerName || 'پیمانکار',
        displayPhone: srv.phone || srv.contactPhone || 'ثبت نشده',
        displayCategory: srv.category || 'خدمات',
        displayPrice: srv.rate ? (srv.rate + " تومان") : 'توافقی',
        normalizedStatus: normStatus
      });
    });

    // 5. Barter Deals
    (barterDeals || []).forEach(bt => {
      const isPending = bt.status === 'pending' || !bt.status;
      const isAppr = bt.status === 'active' || bt.status === 'approved';
      const isRej = bt.status === 'rejected';
      const normStatus = isAppr ? 'approved' : (isRej ? 'rejected' : 'pending');

      list.push({
        ...bt,
        adCategoryGroup: 'barter',
        typeLabel: '🔄 تهاتر صنعتی',
        typeColor: 'bg-teal-50 text-teal-800 border-teal-200',
        displayTitle: bt.title || 'پیشنهاد تهاتر و معاوضه',
        displayCompany: bt.companyName || 'مجموعه صنعتی',
        displayContact: bt.contactPerson || 'مسئول تهاتر',
        displayPhone: bt.phone || 'ثبت نشده',
        displayCategory: 'تهاتر کالا با کالا',
        displayPrice: bt.offeredValue || 'معاوضه کالا',
        normalizedStatus: normStatus
      });
    });

    return list;
  }, [sponsoredAds, rawMaterialAds, equipmentAds, serviceAds, barterDeals]);

  // Counts
  const pendingCount = useMemo(() => allCombinedAds.filter(a => a.normalizedStatus === 'pending').length, [allCombinedAds]);
  const approvedCount = useMemo(() => allCombinedAds.filter(a => a.normalizedStatus === 'approved').length, [allCombinedAds]);
  const rejectedCount = useMemo(() => allCombinedAds.filter(a => a.normalizedStatus === 'rejected').length, [allCombinedAds]);
  const specialRequestsCount = useMemo(() => allCombinedAds.filter(a => a.specialPaymentStatus === 'pending').length, [allCombinedAds]);

  // Filtered ads
  const filteredAds = useMemo(() => {
    return allCombinedAds.filter(ad => {
      if (filterStatus === 'special_requests') {
        return ad.specialPaymentStatus === 'pending';
      }
      const matchesStatus = filterStatus === 'all' || ad.normalizedStatus === filterStatus;
      const matchesGroup = groupFilter === 'all' || ad.adCategoryGroup === groupFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (ad.displayTitle && ad.displayTitle.toLowerCase().includes(q)) ||
        (ad.displayCompany && ad.displayCompany.toLowerCase().includes(q)) ||
        (ad.displayPhone && ad.displayPhone.toLowerCase().includes(q)) ||
        (ad.displayContact && ad.displayContact.toLowerCase().includes(q));
      return matchesStatus && matchesGroup && matchesSearch;
    });
  }, [allCombinedAds, filterStatus, groupFilter, searchQuery]);

  // Helper: Convert numbers to Persian Digits
  const toPersianNum = (num: number | string | undefined | null) => {
    if (num === undefined || num === null || num === "") return "۰";
    const s = String(num);
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
  };

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

  // 🌟 Toggle Special (Featured) Ad
  const handleToggleSpecialAd = async (ad: any) => {
    try {
      const nextIsSpecial = !(ad.isSpecial || ad.plan === 'vip' || ad.isSponsored);
      const updateData = {
        ...ad,
        isSpecial: nextIsSpecial,
        plan: nextIsSpecial ? 'vip' : 'standard',
        isSponsored: nextIsSpecial,
        updatedAt: new Date().toISOString()
      };

      // Call API directly
      await fetch(`/api/v1/dev/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      }).catch(() => {});

      if (onEditAd) {
        await onEditAd(ad.id, updateData);
      }
      if (b2bConfig && onUpdateB2bConfig) {
        const updatedAds = (b2bConfig.sponsoredAds || []).map((a: any) => 
          String(a.id) === String(ad.id) ? { ...a, ...updateData } : a
        );
        await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: updatedAds });
      }
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
      setSuccessMsg(`وضعیت آگهی "${ad.displayTitle || ad.title}" به ${nextIsSpecial ? 'ویژه 🌟' : 'عادی'} تغییر یافت.`);
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در تغییر وضعیت ویژه");
    }
  };

  // 🔥 Toggle Floor Market Ad
  const handleToggleFloorMarketAd = async (ad: any) => {
    try {
      const nextIsFloor = !(ad.isFloorMarket || ad.isKafBazar || ad.category === 'under_market');
      const updateData = {
        ...ad,
        isFloorMarket: nextIsFloor,
        isKafBazar: nextIsFloor,
        category: nextIsFloor ? 'under_market' : 'direct_supply',
        updatedAt: new Date().toISOString()
      };

      // Call API directly
      await fetch(`/api/v1/dev/ads/${ad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      }).catch(() => {});

      if (onEditAd) {
        await onEditAd(ad.id, updateData);
      }
      if (b2bConfig && onUpdateB2bConfig) {
        const updatedAds = (b2bConfig.sponsoredAds || []).map((a: any) => 
          String(a.id) === String(ad.id) ? { ...a, ...updateData } : a
        );
        await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: updatedAds });
      }
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
      setSuccessMsg(`آگهی "${ad.displayTitle || ad.title}" ${nextIsFloor ? 'به کف بازار 🔥 اضافه شد.' : 'از کف بازار حذف شد.'}`);
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در تغییر وضعیت کف بازار");
    }
  };

  const handleApproveSpecial = (ad: any) => {
    onEditAd(ad.id, {
      isSponsored: true,
      specialPaymentStatus: 'approved'
    });
    setSuccessMsg("آگهی با موفقیت به وضعیت ویژه ارتقا یافت.");
  };

  // ⚡ Refresh Single Ad (بروزرسانی آگهی)
  const handleBumpAd = (ad: any) => {
    const todayPersian = new Date().toLocaleDateString("fa-IR");
    onEditAd(ad.id, {
      date: todayPersian,
      updatedAt: new Date().toISOString(),
      bumpedAt: new Date().toISOString()
    });

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
    window.dispatchEvent(new CustomEvent("dastavval-ads-sync"));

    setSuccessMsg(`⚡ آگهی «${ad.displayTitle || ad.title}» با موفقیت بروزرسانی و به صدر تالار منتقل گردید.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ⚡ Refresh All Active Ads (بروزرسانی همگانی آگهی‌ها)
  const handleBumpAllAds = () => {
    const todayPersian = new Date().toLocaleDateString("fa-IR");
    allCombinedAds.forEach(ad => {
      if (ad.normalizedStatus === 'approved' || !ad.status) {
        onEditAd(ad.id, {
          date: todayPersian,
          updatedAt: new Date().toISOString(),
          bumpedAt: new Date().toISOString()
        });
      }
    });

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
    window.dispatchEvent(new CustomEvent("dastavval-ads-sync"));

    setSuccessMsg(`⚡ کلیه آگهی‌های فعال با موفقیت بروزرسانی زنده شدند.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // ✅ Bulk Approve All Pending Ads (تایید دسته جمعی آگهی‌های در انتظار)
  const handleBulkApprovePendingAds = () => {
    const pendingList = allCombinedAds.filter(ad => ad.normalizedStatus === 'pending');
    if (pendingList.length === 0) {
      setSuccessMsg("هیچ آگهی جدیدی در صف تایید وجود ندارد.");
      setTimeout(() => setSuccessMsg(null), 3000);
      return;
    }

    pendingList.forEach(ad => {
      onUpdateAdStatus(ad.id, 'approved');
    });

    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
    window.dispatchEvent(new CustomEvent("dastavval-ads-sync"));

    setSuccessMsg(`✅ تعداد ${pendingList.length} آگهی با موفقیت در یک مرحله تایید و منتشر گردیدند.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRejectSpecial = (ad: any) => {
    onEditAd(ad.id, {
      specialPaymentStatus: 'rejected'
    });
    setErrorMsg("درخواست آگهی ویژه رد شد.");
  };

  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

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
        id: "ad-" + Date.now(),
        title: newTitle,
        description: newDescription || "ثبت آگهی مستقیم کف قیمت / تهاتر کالا توسط مدیریت.",
        factoryName: newFactory || "تأمین‌کننده / انبار مرکزی",
        contactPerson: newContactPerson || "مدیریت ارشد",
        contactPhone: newPhone,
        badgeText: finalBadge,
        category: newCategory,
        quantity: newQuantity || "توافقی",
        wholesalePrice: newWholesalePrice.includes("تومان") ? newWholesalePrice : (newWholesalePrice + " تومان"),
        marketPrice: newMarketPrice.includes("تومان") ? newMarketPrice : (newMarketPrice + " تومان"),
        buyerProfit: newBuyerProfit || "۲۰٪ سود ناخالص",
        isSponsored: false,
        city: newCity,
        province: newProvince,
        date: new Date().toLocaleDateString("fa-IR"),
        imageUrl: uploadedImage || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400",
        imageUrls: uploadedImage ? [uploadedImage] : [],
        status: "approved"
      };

      const updated = [newAd, ...sponsoredAds];
      localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
      window.dispatchEvent(new CustomEvent("dastavval-ads-sync"));

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
      setNewCity('تهران');
      setNewProvince('تهران');
      setNewBuyerProfit('');
      setUploadedImage(null);
    } catch (err: any) {
      setErrorMsg("خطا در ثبت آگهی: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAd = async (ad: any) => {
    if (!window.confirm("آیا از حذف آگهی " + (ad.displayTitle || ad.title) + " اطمینان دارید؟")) return;
    try {
      const adId = String(ad.id);
      if (ad.adCategoryGroup === 'raw_material' || rawMaterialAds.some(a => String(a.id) === adId)) {
        const updated = rawMaterialAds.filter(a => String(a.id) !== adId);
        localStorage.setItem("dastavval_raw_materials", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, rawMaterialAds: updated });
      } else if (ad.adCategoryGroup === 'equipment' || equipmentAds.some(a => String(a.id) === adId)) {
        const updated = equipmentAds.filter(a => String(a.id) !== adId);
        localStorage.setItem("dastavval_industrial_equipment", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, equipmentAds: updated });
      } else if (ad.adCategoryGroup === 'service' || serviceAds.some(a => String(a.id) === adId)) {
        const updated = serviceAds.filter(a => String(a.id) !== adId);
        localStorage.setItem("dastavval_industrial_services", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, serviceAds: updated });
      } else if (ad.adCategoryGroup === 'barter' || (barterDeals && barterDeals.some(a => String(a.id) === adId))) {
        const updated = (barterDeals || []).filter(a => String(a.id) !== adId);
        localStorage.setItem("dastavval_official_barters_v2", JSON.stringify(updated));
        localStorage.setItem("dastavval_barter_deals", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("dastavval_barter_updated"));
      } else {
        const updated = sponsoredAds.filter(a => String(a.id) !== adId);
        localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updated));
        if (onUpdateB2bConfig && b2bConfig) await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: updated });
      }
      window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
      window.dispatchEvent(new CustomEvent("dastavval-ads-sync"));
      setSuccessMsg("آگهی با موفقیت حذف شد.");
    } catch (err: any) {
      setErrorMsg("خطا در حذف آگهی: " + err.message);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingAdId) return;
    await onUpdateAdStatus(rejectingAdId, 'rejected', rejectionReasonInput || 'عدم رعایت ضوابط انتشار آگهی');
    setRejectingAdId(null);
    setRejectionReasonInput('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-rose-800/30">
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-rose-400/30 text-rose-300 text-xs font-bold">
              <Megaphone size={14} />
              <span>پیشخوان مدیریت و تایید آگهی‌های دست‌اول</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              مدیریت و تایید آگهی‌ها (کف بازار، خدمات، ماشین‌آلات و مواد اولیه)
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed font-medium">
              تمام آگهی‌های ثبت‌شده توسط کاربران ابتدا در این پیشخوان قرار می‌گیرند و تنها پس از بررسی و تایید شما در سایت عمومی منتشر خواهند شد.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleBumpAllAds}
              className="px-4 py-3 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 text-white text-xs font-black transition-all flex items-center justify-center gap-2 border border-purple-400/40 cursor-pointer shrink-0 active:scale-95 shadow-md shadow-purple-900/20"
              title="بروزرسانی زنده تاریخ و وضعیت کلیه آگهی‌های فعال در صفحه"
            >
              <RotateCcw size={16} className="text-purple-300" />
              <span>⚡ بروزرسانی همگانی</span>
            </button>

            <button
              onClick={handleBulkApprovePendingAds}
              className="px-4 py-3 rounded-2xl bg-emerald-600/30 hover:bg-emerald-600/50 text-white text-xs font-black transition-all flex items-center justify-center gap-2 border border-emerald-400/40 cursor-pointer shrink-0 active:scale-95 shadow-md shadow-emerald-900/20"
              title="تایید یک‌باره کلیه آگهی‌های در انتظار بررسی"
            >
              <CheckCircle size={16} className="text-emerald-300" />
              <span>✅ تایید دسته‌جمعی</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>ثبت آگهی مستقیم مدیر</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Tabs Section */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 space-y-4 shadow-sm">
        {/* Top Bar: Status Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterStatus('pending')}
              className={"px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer " + (
                filterStatus === 'pending'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 font-black scale-[1.02]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <Clock size={15} className={filterStatus === 'pending' ? "text-slate-950" : "text-emerald-500"} />
              <span>در انتظار بررسی ({pendingCount})</span>
            </button>

            <button
              onClick={() => setFilterStatus('approved')}
              className={"px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer " + (
                filterStatus === 'approved'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black scale-[1.02]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <CheckCircle size={15} className={filterStatus === 'approved' ? "text-white" : "text-emerald-500"} />
              <span>تأییدشده و فعال ({approvedCount})</span>
            </button>

            <button
              onClick={() => setFilterStatus('rejected')}
              className={"px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer " + (
                filterStatus === 'rejected'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black scale-[1.02]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <XCircle size={15} className={filterStatus === 'rejected' ? "text-white" : "text-emerald-500"} />
              <span>ردشده ({rejectedCount})</span>
            </button>

            <button
              onClick={() => setFilterStatus('special_requests')}
              className={"px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer " + (
                filterStatus === 'special_requests'
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 font-black scale-[1.02]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <Sparkles size={15} className={filterStatus === 'special_requests' ? "text-white" : "text-emerald-500"} />
              <span>درخواست ویژه ({toPersianNum(specialRequestsCount)})</span>
            </button>

            <button
              onClick={() => setFilterStatus('all')}
              className={"px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer " + (
                filterStatus === 'all'
                  ? "bg-slate-900 text-white shadow-md font-black scale-[1.02]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              <Layers size={15} />
              <span>همه آگهی‌ها ({allCombinedAds.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو بر اساس عنوان، کارخانه، شماره تماس..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Group Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-400 ml-2 flex items-center gap-1">
            <Filter size={12} />
            <span>دسته‌بندی:</span>
          </span>

          <button
            onClick={() => setGroupFilter('all')}
            className={"px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer " + (
              groupFilter === 'all'
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            همه دسته‌ها
          </button>

          <button
            onClick={() => setGroupFilter('sponsored')}
            className={"px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 " + (
              groupFilter === 'sponsored'
                ? "bg-emerald-500 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Zap size={13} className="text-amber-400" />
            <span>کف قیمت و حراج</span>
          </button>

          <button
            onClick={() => setGroupFilter('raw_material')}
            className={"px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 " + (
              groupFilter === 'raw_material'
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Boxes size={13} />
            <span>مواد اولیه</span>
          </button>

          <button
            onClick={() => setGroupFilter('equipment')}
            className={"px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 " + (
              groupFilter === 'equipment'
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Wrench size={13} />
            <span>دستگاه و ماشین‌آلات</span>
          </button>

          <button
            onClick={() => setGroupFilter('service')}
            className={"px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 " + (
              groupFilter === 'service'
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Briefcase size={13} />
            <span>خدمات صنعتی</span>
          </button>

          <button
            onClick={() => setGroupFilter('barter')}
            className={"px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 " + (
              groupFilter === 'barter'
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            <Repeat size={13} />
            <span>تهاتر و معاوضه</span>
          </button>
        </div>
      </div>

      {/* Grid of Ads */}
      {filteredAds.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Megaphone size={28} />
          </div>
          <h3 className="text-sm font-black text-slate-800">هیچ آگهی در این بخش یافت نشد</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
            {filterStatus === 'pending'
              ? "در حال حاضر هیچ آگهی در انتظار تاییدی وجود ندارد."
              : "با فیلترها و کلمات دیگر مجدداً جستجو کنید."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAds.map((ad, idx) => {
            const isPending = ad.normalizedStatus === 'pending';
            const isApproved = ad.normalizedStatus === 'approved';
            const isRejected = ad.normalizedStatus === 'rejected';

            return (
              <motion.div
                key={`admin-ads-mgmt-ad-${ad.id || idx}-${idx}`}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image & Header Overlay */}
                  <div 
                    className="relative h-44 bg-slate-100 overflow-hidden border-b border-slate-100 cursor-zoom-in"
                    onClick={() => setPreviewImage({ url: ad.imageUrl || (ad.imageUrls && ad.imageUrls[0]) || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600", title: ad.displayTitle })}
                  >
                    <img
                      src={ad.imageUrl || (ad.imageUrls && ad.imageUrls[0]) || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600"}
                      alt={ad.displayTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Special / Floor Market Badges */}
                    {(ad.isSpecial || ad.plan === 'vip' || ad.isSponsored) && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 border border-amber-300 shadow-md flex items-center gap-1 z-10">
                        <Sparkles size={11} className="fill-slate-950" />
                        ویژه شده 🌟
                      </span>
                    )}

                    {(ad.isFloorMarket || ad.isKafBazar) && (
                      <span className="absolute top-10 left-3 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white border border-rose-400 shadow-md flex items-center gap-1 z-10">
                        <Zap size={11} className="fill-white" />
                        کف بازار 🔥
                      </span>
                    )}

                    {/* Category Tag */}
                    <span className={"absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black border backdrop-blur-md shadow-xs " + ad.typeColor}>
                      {ad.typeLabel}
                    </span>

                    {/* Status Badge */}
                    <span className={"absolute bottom-3 right-3 px-3 py-1 rounded-xl text-[10px] font-black backdrop-blur-md shadow-sm border flex items-center gap-1.5 " + (
                      isPending
                        ? "bg-emerald-500/95 text-slate-950 border-amber-300 font-black"
                        : isApproved
                        ? "bg-emerald-600/95 text-white border-emerald-400 font-black"
                        : "bg-emerald-600/95 text-white border-rose-400 font-black"
                    )}>
                      {isPending && <Clock size={12} className="animate-pulse" />}
                      {isApproved && <CheckCircle size={12} />}
                      {isRejected && <XCircle size={12} />}
                      <span>
                        {isPending && "⏳ در انتظار بررسی مدیر"}
                        {isApproved && "✓ منتشر شده در سایت"}
                        {isRejected && "✕ ردشده"}
                      </span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3.5">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-2">
                        {ad.displayTitle}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium mt-1.5 line-clamp-2 leading-relaxed">
                        {ad.description || "توضیحات تکمیلی ثبت نشده است."}
                      </p>
                    </div>

                    {/* Details Pill Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{ad.displayCompany}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{ad.displayContact}</span>
                      </div>
                      <div className="flex items-center gap-1.5 col-span-2 text-emerald-600 font-black border-t border-slate-200/60 pt-2 mt-0.5">
                        <Phone size={13} className="text-emerald-500 shrink-0" />
                        <span className="dir-ltr text-right">{ad.displayPhone}</span>
                      </div>
                      {(ad.city || ad.province) && (
                        <div className="flex items-center gap-1.5 col-span-2 text-indigo-700 bg-indigo-50/60 border border-indigo-100 rounded-lg p-1.5 font-black">
                          <span>📍 محل بارگیری:</span>
                          <span>{ad.province || "تهران"} - {ad.city || "تهران"}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Category info */}
                    <div className="flex items-center justify-between text-[11px] font-black border-t border-slate-100 pt-3">
                      <span className="text-slate-400 font-bold">قیمت / ارزیابی:</span>
                      <span className="text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        {ad.displayPrice}
                      </span>
                    </div>

                    {ad.specialPaymentStatus === 'pending' && ad.specialReceiptUrl && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-indigo-900">درخواست ارتقا به ویژه</span>
                          <button 
                            onClick={() => setViewingReceiptUrl(ad.specialReceiptUrl)}
                            className="text-[10px] text-emerald-600 font-black flex items-center gap-1 hover:underline"
                          >
                            <Eye size={12} />
                            مشاهده فیش
                          </button>
                        </div>
                        <div className="flex gap-2 pt-1 border-t border-emerald-100">
                          <button
                            onClick={() => handleApproveSpecial(ad)}
                            className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-all shadow-xs"
                          >
                            تایید فیش و ویژه کردن
                          </button>
                          <button
                            onClick={() => handleRejectSpecial(ad)}
                            className="flex-1 py-1.5 bg-emerald-600 text-white border border-emerald-200 text-[10px] font-black rounded-lg hover:bg-emerald-100 transition-all"
                          >
                            رد فیش
                          </button>
                        </div>
                      </div>
                    )}

                    {ad.rejectionReason && (
                      <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-[10px] font-bold text-rose-800 space-y-1">
                        <span className="font-black text-rose-900 block">علت عدم تایید:</span>
                        <p className="text-emerald-700">{ad.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {/* 🌟 Special Toggle Button */}
                  <button
                    onClick={() => handleToggleSpecialAd(ad)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95 ${
                      ad.isSpecial || ad.plan === 'vip' || ad.isSponsored
                        ? "bg-amber-500 text-slate-950 border border-amber-400 font-black shadow-amber-500/20"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                    }`}
                    title="ویژه کردن آگهی جهت نمایش برجسته با نشان طلایی در بالای سایت"
                  >
                    <Sparkles size={13} className={ad.isSpecial || ad.plan === 'vip' ? "fill-slate-950" : "text-amber-600"} />
                    <span>{ad.isSpecial || ad.plan === 'vip' || ad.isSponsored ? "ویژه شده 🌟" : "ویژه کردن"}</span>
                  </button>

                  {/* 🔥 Floor Market Toggle Button */}
                  <button
                    onClick={() => handleToggleFloorMarketAd(ad)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95 ${
                      ad.isFloorMarket || ad.isKafBazar
                        ? "bg-rose-600 text-white border border-rose-500 font-black shadow-rose-600/20"
                        : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                    title="علامت‌گذاری به‌عنوان آگهی کف بازار و حراجی زیر قیمت"
                  >
                    <Zap size={13} className={ad.isFloorMarket || ad.isKafBazar ? "fill-white" : "text-rose-600"} />
                    <span>{ad.isFloorMarket || ad.isKafBazar ? "کف بازار 🔥" : "کف آگهی"}</span>
                  </button>

                  {/* ⚡ Refresh Ad Button */}
                  <button
                    onClick={() => handleBumpAd(ad)}
                    className="py-2 px-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                    title="بروزرسانی زنده تاریخ و انتقال این آگهی به صدر تالار بورس و بازار"
                  >
                    <RotateCcw size={13} className="text-purple-600" />
                    <span>بروزرسانی</span>
                  </button>

                  {/* Approve Button */}
                  {isPending || isRejected ? (
                    <button
                      onClick={() => onUpdateAdStatus(ad.id, 'approved')}
                      className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center justify-center gap-1 shadow-sm shadow-emerald-600/20 cursor-pointer"
                    >
                      <Check size={14} />
                      <span>تأیید</span>
                    </button>
                  ) : null}

                  {/* Reject Button */}
                  {isPending || isApproved ? (
                    <button
                      onClick={() => {
                        setRejectingAdId(ad.id);
                        setRejectionReasonInput('');
                      }}
                      className="py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-amber-800 border border-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X size={14} />
                      <span>رد آگهی</span>
                    </button>
                  ) : null}

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteAd(ad)}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 text-xs transition-all cursor-pointer shrink-0"
                    title="حذف کامل آگهی"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Receipt Preview Modal */}
      <AnimatePresence>
        {viewingReceiptUrl && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingReceiptUrl(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-[2.5rem] p-4 w-full max-w-xl border border-slate-200 shadow-2xl relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setViewingReceiptUrl(null)}
                className="absolute -top-12 right-0 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all backdrop-blur-md"
              >
                <X size={24} />
              </button>
              <div className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
                <img src={viewingReceiptUrl} alt="فیش واریزی" className="w-full h-auto max-h-[80vh] object-contain" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs font-black text-slate-500">تصویر رسید ارسالی توسط کاربر</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {rejectingAdId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <XCircle size={18} className="text-emerald-500" />
                  <span>ثبت دلیل عدم تایید آگهی</span>
                </h3>
                <button onClick={() => setRejectingAdId(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  لطفاً علت رد آگهی را برای اطلاع کاربر بنویسید:
                </label>
                <textarea
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="مثال: اطلاعات تماس نامعتبر است / قیمت غیرواقعی درج شده است..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingAdId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                >
                  تایید و رد آگهی
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create New Ad Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-xl w-full my-8 space-y-5 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Megaphone size={20} />
                  <h3 className="text-base font-black text-slate-900">ثبت مستقیم آگهی جدید توسط مدیریت</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateAd} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">عنوان آگهی *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: فروش فوری ۱۰۰ تن شکر سفید برزیلی"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">نوع آگهی</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-rose-400 outline-none"
                    >
                      <option value="under_market">📉 کف قیمت بازار</option>
                      <option value="liquid">🔥 حراج مازاد خط</option>
                      <option value="direct_supply">📦 تامین مستقیم کارخانه</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">نام کارخانه / تامین‌کننده</label>
                    <input
                      type="text"
                      value={newFactory}
                      onChange={(e) => setNewFactory(e.target.value)}
                      placeholder="مثال: صنایع غذایی بهپک"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">نام مسئول تماس</label>
                    <input
                      type="text"
                      value={newContactPerson}
                      onChange={(e) => setNewContactPerson(e.target.value)}
                      placeholder="مثال: مهندس حسینی"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">شماره تماس *</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="۰۹۱۲..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-bold dir-ltr text-right"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">قیمت کف (تومان) *</label>
                    <input
                      type="text"
                      value={newWholesalePrice}
                      onChange={(e) => setNewWholesalePrice(e.target.value)}
                      placeholder="۴۵,۰۰۰"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">قیمت بازار (تومان) *</label>
                    <input
                      type="text"
                      value={newMarketPrice}
                      onChange={(e) => setNewMarketPrice(e.target.value)}
                      placeholder="۵۲,۰۰۰"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">حجم / مقدار</label>
                    <input
                      type="text"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(e.target.value)}
                      placeholder="۱۰ تن"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">توضیحات تکمیلی</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="مشخصات فنی، شرایط تحویل، تسویه امانی..."
                    rows={3}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-rose-400 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-800 block">استان و شهر محل بارگیری کالا / انبار:</label>
                  <StrictCityProvinceSelector
                    selectedCity={newCity}
                    selectedProvince={newProvince}
                    onSelect={(c, p) => {
                      setNewCity(c);
                      setNewProvince(p);
                    }}
                    variant="button"
                    className="w-full text-right bg-white border border-slate-200"
                    placeholder="کلیک کنید تا استان و شهر بارگیری را انتخاب کنید"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">تصویر آگهی</label>
                  <div className="flex items-center gap-3">
                    <label className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-all flex items-center gap-2 border border-slate-200">
                      <Upload size={15} />
                      <span>{isUploading ? "در حال آپلود..." : "انتخاب تصویر"}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    {uploadedImage && (
                      <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                        <Check size={14} /> تصویر بارگذاری شد
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    <span>انتشار فوری آگهی</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageLightbox
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || null}
        title={previewImage?.title || "پیش‌نمایش تصویر"}
        subtitle="پیش‌نمایش"
      />
    </div>
  );
}
