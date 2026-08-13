import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Sparkles, Building2, Phone, Calendar, CheckCircle2, Eye, FileText, Search, ShieldCheck, Megaphone, ArrowLeftRight, ChevronLeft, Info, X, ArrowUpRight, Upload } from "lucide-react";

export interface AdItem {
  id: string;
  title: string;
  description: string;
  factoryName: string;
  contactPerson: string;
  contactPhone: string;
  badgeText: string;
  category: "barter" | "buy" | "sell";
  quantity: string;
  isSponsored?: boolean;
  date: string;
  imageUrl?: string;
  status?: "pending" | "approved" | "rejected";
}

export const getAdFallbackImage = (title: string, category: string): string => {
  const norm = title.toLowerCase();
  if (norm.includes("روغن")) {
    return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("شکر") || norm.includes("قند")) {
    return "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("نشاسته") || norm.includes("آرد") || norm.includes("گلوتن")) {
    return "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("کارتن") || norm.includes("جعبه") || norm.includes("بسته") || norm.includes("سلفون")) {
    return "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400";
  }
  if (norm.includes("سیب") || norm.includes("کنسانتره") || norm.includes("پوره") || norm.includes("میوه")) {
    return "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=400";
  }
  if (category === "barter") {
    return "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400";
  }
  if (category === "buy") {
    return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400";
  }
  return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400";
};

interface AdBoardProps {
  onTriggerPayment?: (paymentInfo: {
    amount: number;
    description: string;
    callback: (success: boolean) => void;
  }) => void;
  isMini?: boolean;
  onNavigateToBillboard?: () => void;
}

export default function AdBoard({ onTriggerPayment, isMini = false, onNavigateToBillboard }: AdBoardProps) {
  const [ads, setAds] = useState<AdItem[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedAdDetail, setSelectedAdDetail] = useState<AdItem | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"all" | "barter" | "buy" | "sell">("all");

  // Form states (100% free admin approval submission)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState<"barter" | "buy" | "sell">("buy");
  const [badgeText, setBadgeText] = useState("خرید فوری");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const initialAds: AdItem[] = [
    {
      id: "ad-1",
      title: "تهاتر روغن حلب صنف و صنعت ۱۶ کیلویی با کنسانتره سیب غلیظ",
      description: "آمادگی کارخانه کشت و صنعت شمال جهت تهاتر کلان میزان ۲۰ تن روغن جامد سویا حلب با کنسانتره سیب صادراتی (بریکس ۷۰) جهت تامین مواد اولیه خط تولید لواشک و مارمالاد کارخانجات مرتبط.",
      factoryName: "صنایع کشت و صنعت شمال",
      contactPerson: "مهندس علیزاده (بخش بازرگانی تامین)",
      contactPhone: "۰۹۱۴۴۷۱۳۴۰۵",
      badgeText: "تهاتر کلان صنایع",
      category: "barter",
      quantity: "۲۰ تن",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۲",
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "ad-2",
      title: "تقاضای خرید نقدی تناژ بالا شکر سفید استاندارد کارخانه‌ای",
      description: "صنایع بیسکویت‌سازی تبریز خریدار نقدی شکر سفید درجه یک کیسه ۵۰ کیلویی استاندارد با تسویه فوری نقدی و بارگیری از درب کارخانه قند سراسر کشور.",
      factoryName: "صنایع غذایی شونیز تبریز",
      contactPerson: "حاج علی رسولی (تامین مواد اولیه)",
      contactPhone: "۰۹۱۴۴۷۱۳۴۰۵",
      badgeText: "خرید نقدی عمده",
      category: "buy",
      quantity: "۵۰ تن",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۱",
      imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "ad-3",
      title: "تامین عمده نشاسته گندم فوق تصفیه مجهز به سیب سلامت",
      description: "فروش مستقیم و بی واسطه نشاسته گندم و گلوتن فعال با رطوبت استاندارد جهت مصرف کارخانجات نان صنعتی، سوسیس و کالباس و فرآورده‌های حجیم شده غلات.",
      factoryName: "توسعه صنایع گلوکز و نشاسته ایران زمین",
      contactPerson: "دکتر مهدوی (واحد فروش عمده)",
      contactPhone: "۰۹۱۴۴۷۱۳۴۰۵",
      badgeText: "تامین بی واسطه",
      category: "sell",
      quantity: "نامحدود",
      isSponsored: true,
      date: "۱۴۰۵/۰۵/۲۰",
      imageUrl: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=400"
    },
    {
      id: "ad-4",
      title: "تهاتر کارتن بسته‌بندی ۵ لایه و سلفون چاپدار با شکر سفید یا آرد نول",
      description: "صنایع چاپ و بسته‌بندی برتر آمادگی دارد سفارشات جعبه‌های لمینتی و سلفون‌های دولایه کارخانجات غذایی را به صورت تهاتر با شکر، آرد نول درجه یک تبریز یا نشاسته گندم انجام دهد.",
      factoryName: "صنایع بسته‌بندی و کارتن‌سازی برتر",
      contactPerson: "مهندس خسروی (مدیر بازرگانی)",
      contactPhone: "۰۹۱۲۳۴۵۶۷۸۹",
      badgeText: "تهاتر ملزومات بسته‌بندی",
      category: "barter",
      quantity: "۱۰۰ هزار عدد",
      isSponsored: false,
      date: "۱۴۰۵/۰۵/۱۹",
      imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=400"
    }
  ];

  useEffect(() => {
    const savedAds = localStorage.getItem("dastavval_sponsored_ads");
    if (savedAds) {
      try {
        setAds(JSON.parse(savedAds));
      } catch (e) {
        setAds(initialAds);
      }
    } else {
      setAds(initialAds);
      localStorage.setItem("dastavval_sponsored_ads", JSON.stringify(initialAds));
    }
  }, []);

  const saveAdsToStorage = (newAds: AdItem[]) => {
    setAds(newAds);
    localStorage.setItem("dastavval_sponsored_ads", JSON.stringify(newAds));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateAdAdminApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !factoryName || !contactPhone) return;

    const newAd: AdItem = {
      id: `ad-${Date.now()}`,
      title,
      description,
      factoryName,
      contactPerson: contactPerson || "مدیریت بازرگانی",
      contactPhone,
      badgeText: badgeText || (category === "barter" ? "تهاتر صنعتی" : category === "buy" ? "تقاضای خرید" : "فروش بی واسطه"),
      category,
      quantity: quantity || "توافقی",
      isSponsored: true,
      date: new Date().toLocaleDateString("fa-IR"),
      imageUrl: uploadedImage || getAdFallbackImage(title, category),
      status: "pending"
    };

    const updated = [newAd, ...ads];
    saveAdsToStorage(updated);
    
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setIsSubmitModalOpen(false);
      // Reset form fields
      setTitle("");
      setDescription("");
      setFactoryName("");
      setContactPerson("");
      setContactPhone("");
      setQuantity("");
      setCategory("buy");
      setBadgeText("خرید فوری");
      setUploadedImage(null);
    }, 4000); // Increased timeout to let user read the success message
  };

  const filteredAds = ads.filter((ad) => {
    const isApproved = ad.status !== "pending" && ad.status !== "rejected"; // Existing default ads without status are considered approved
    
    const matchesSearch = 
      ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ad.factoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategoryFilter === "all" || ad.category === activeCategoryFilter;
    
    return isApproved && matchesSearch && matchesCategory;
  });

  // Material Design Card Palette (Pure White with elegant shadow)
  const cardClassName = "bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-6px_rgba(0,0,0,0.06)] transition-all duration-300 text-right";

  const renderDetailModal = () => (
    <AnimatePresence>
      {selectedAdDetail && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto"
          onClick={() => setSelectedAdDetail(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-lg border border-slate-100 text-right relative overflow-y-auto max-h-[90vh]"
          >
            <button
              onClick={() => setSelectedAdDetail(null)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X size={16} />
            </button>

            <div className="space-y-5 flex flex-col justify-between mt-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-md">
                    👑 تایید اصالت کاتالوگ
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Calendar size={11} />
                    ثبت در {selectedAdDetail.date}
                  </span>
                </div>

                {/* Main Ad Image Banner */}
                <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-50 relative shrink-0">
                  <img
                    src={selectedAdDetail.imageUrl || getAdFallbackImage(selectedAdDetail.title, selectedAdDetail.category)}
                    alt={selectedAdDetail.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-indigo-600 font-black block mb-1">
                    🏢 کارخانه ثبت‌کننده: {selectedAdDetail.factoryName}
                  </span>
                  <h4 className="font-black text-sm md:text-base text-slate-900 leading-relaxed">
                    {selectedAdDetail.title}
                  </h4>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 block">مشخصات دقیق پیشنهاد صنعتی:</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-bold whitespace-pre-line">
                    {selectedAdDetail.description}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">حجم مبادله یا تحویل:</span>
                  <span className="text-xs font-black text-slate-800 block bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    📦 میزان کالا: {selectedAdDetail.quantity}
                  </span>
                </div>
              </div>

              {/* Contact Info Card */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2.5 mt-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <ShieldCheck size={16} />
                  <span className="text-[11px] font-black">اطلاعات تماس مستقیم بدون واسطه:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-800">
                  <div>
                    <span className="text-[8px] text-slate-400 block">مسئول هماهنگی:</span>
                    <span>{selectedAdDetail.contactPerson}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 block">تلفن تماس:</span>
                    <span className="font-mono">{selectedAdDetail.contactPhone}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isMini) {
    return (
      <div className="w-full mt-6 mb-12 max-w-7xl mx-auto px-4" id="ad-board-mini-container" dir="rtl">
        {/* Billboard Styled Header */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <Megaphone size={22} className="animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-lg">بیلبورد تجاری</span>
                <h3 className="font-black text-sm text-slate-800">جدیدترین آگهی‌های بیلبورد تبلیغات تجاری و تقاضای کالا</h3>
              </div>
              <p className="text-[11px] text-slate-500 font-bold leading-relaxed max-w-2xl">
                اطلاعیه‌ها، آگهی‌های رسمی خرید نقدی و تبادلات مستقیم مواد اولیه کارخانجات بزرگ صنایع غذایی کشور.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-end">
            <button
              onClick={onNavigateToBillboard}
              className="bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <span>ورود به صفحه بیلبورد ({ads.length} آگهی)</span>
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-black px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              <Plus size={14} />
              <span>ثبت رایگان آگهی</span>
            </button>
          </div>
        </div>

        {/* 3 Columns Displaying Latest Items with Beautiful Material Styling */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {ads.slice(0, 3).map((ad) => {
            const adImg = ad.imageUrl || getAdFallbackImage(ad.title, ad.category);
            return (
              <div
                key={ad.id}
                onClick={() => setSelectedAdDetail(ad)}
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_-6px_rgba(0,0,0,0.06)] transition-all duration-300 text-right cursor-pointer group flex flex-col justify-between h-[360px] relative"
              >
                {/* Image Banner */}
                <div className="h-32 w-full overflow-hidden bg-slate-50 relative shrink-0">
                  <img
                    src={adImg}
                    alt={ad.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[9px] font-black text-slate-800 shadow-sm flex items-center gap-1">
                    <span>{ad.category === "barter" ? "🔄 تهاتر" : ad.category === "buy" ? "📥 خرید نقدی" : "📤 تامین کالا"}</span>
                  </div>
                </div>

                {/* Card Content with padded text */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 font-black">{ad.date}</span>
                      <span className="bg-slate-50 text-slate-600 text-[9px] font-black px-2 py-0.5 rounded-lg border border-slate-100">
                        {ad.badgeText}
                      </span>
                    </div>

                    <h4 className="font-black text-xs text-slate-800 leading-relaxed group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {ad.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed line-clamp-2">
                      {ad.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-bold">
                    <span className="text-indigo-600 font-black">{ad.factoryName}</span>
                    <span className="flex items-center gap-0.5 text-slate-500 group-hover:text-indigo-600 transition-colors">
                      <span>اطلاعات تماس</span>
                      <Phone size={11} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Modal for isMini Mode */}
        <AnimatePresence>
          {isSubmitModalOpen && renderSubmitModal()}
        </AnimatePresence>
      </div>
    );
  }

  // FULL PAGE / TAB MODE
  return (
    <div className="w-full mt-6 mb-12 max-w-7xl mx-auto px-4" id="ad-board-full-container" dir="rtl">
      {/* Upper Brand Billboard Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6 text-right mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Megaphone size={22} />
          </div>
          <div className="space-y-1">
            <h2 className="font-black text-base text-slate-800">صفحه اختصاصی بیلبورد تبلیغات تجاری و اعلام خرید نقدی کارخانجات</h2>
            <p className="text-[11px] text-slate-500 font-bold">
              فرصت‌های ناب تجاری، تامین فوری ملزومات و مواد اولیه بدون واسطه را در بیلبورد سراسری دست‌اول رصد کنید.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-6 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-md shadow-indigo-600/10 cursor-pointer w-full md:w-auto justify-center"
        >
          <Plus size={14} />
          <span>ثبت رایگان آگهی در بیلبورد</span>
        </button>
      </div>

      {/* Searching and Categorization */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی عنوان کالا یا نام کارخانه..."
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pr-9 pl-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-slate-850"
          />
          <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { value: "all", label: "همه آگهی‌های بیلبورد" },
            { value: "barter", label: "🔄 تهاتری" },
            { value: "buy", label: "📥 تقاضای خرید نقدی" },
            { value: "sell", label: "📤 عرضه مستقیم کالا" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveCategoryFilter(filter.value as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeCategoryFilter === filter.value
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="w-full max-w-4xl mx-auto space-y-4">
        {filteredAds.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold bg-white border border-slate-100 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
            هیچ آگهی معتبری در این دسته‌بندی یافت نشد.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredAds.map((ad) => {
              const adImg = ad.imageUrl || getAdFallbackImage(ad.title, ad.category);
              const isSelected = selectedAdDetail?.id === ad.id;
              return (
                <div
                  key={ad.id}
                  onClick={() => setSelectedAdDetail(ad)}
                  className={`p-4 rounded-3xl border text-right flex gap-4 h-auto md:h-[150px] transition-all cursor-pointer overflow-hidden bg-white border-slate-100 hover:border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] group`}
                >
                  {/* Compact Image Thumbnail */}
                  <div className="w-24 md:w-32 h-24 md:h-full rounded-2xl overflow-hidden shrink-0 bg-slate-50 relative">
                    <img
                      src={adImg}
                      alt={ad.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className={`absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black text-white shadow-sm ${
                      ad.category === "barter" 
                        ? "bg-amber-600/90" 
                        : ad.category === "buy" 
                          ? "bg-emerald-600/90" 
                          : "bg-indigo-600/90"
                    }`}>
                      {ad.category === "barter" ? "🔄 تهاتر" : ad.category === "buy" ? "📥 خرید" : "📤 عرضه"}
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-black">{ad.date}</span>
                        <span className="text-[10px] text-slate-500 font-black flex items-center gap-1 max-w-[150px] truncate">
                          <Building2 size={11} className="text-slate-400 shrink-0" />
                          {ad.factoryName}
                        </span>
                      </div>
                      <h5 className="font-black text-xs md:text-sm text-slate-800 leading-relaxed truncate group-hover:text-indigo-600 transition-colors">
                        {ad.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-bold leading-relaxed line-clamp-2">
                        {ad.description}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 mt-auto border-t border-slate-100/70 text-[10px]">
                      <span className="text-slate-400">میزان: <strong className="text-slate-700">{ad.quantity}</strong></span>
                      <span className="text-indigo-600 font-black flex items-center gap-1">
                        <span>مشاهده جزئیات و تماس</span>
                        <ArrowUpRight size={12} className="rotate-90" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Submit Modal inside Full Page Mode */}
      <AnimatePresence>
        {isSubmitModalOpen && renderSubmitModal()}
      </AnimatePresence>
    </div>
  );

  // Reusable Material Design Modal
  function renderSubmitModal() {
    return (
      <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-lg rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-2xl relative text-right"
          dir="rtl"
        >
          <button
            onClick={() => setIsSubmitModalOpen(false)}
            className="absolute top-5 left-5 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>

          {submitSuccess ? (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 animate-bounce">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-black text-slate-800 text-sm">آگهی بیلبورد با موفقیت ثبت گردید</h4>
              <p className="text-xs text-slate-500 font-bold max-w-sm leading-relaxed">
                اطلاعات آگهی تجاری شما ثبت گردید و پس از تایید نهایی مدیران پلتفرم دست‌اول (حداکثر تا ۲ ساعت آینده) بر روی بیلبورد عمومی قرار خواهد گرفت.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreateAdAdminApproval} className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Sparkles className="text-indigo-600 animate-pulse" size={18} />
                <h4 className="font-black text-slate-800 text-sm">ثبت آگهی جدید در بیلبورد تجاری و اعلام تقاضای کالا</h4>
              </div>

              <div className="space-y-3.5">
                {/* Category Selection */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5">نوع درخواست معامله:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "barter", label: "🔄 تهاتری" },
                      { value: "buy", label: "📥 خرید نقدی" },
                      { value: "sell", label: "📤 اعلام فروش" },
                    ].map((opt) => (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => {
                          setCategory(opt.value as any);
                          setBadgeText(opt.value === "barter" ? "تهاتر خط تولید" : opt.value === "buy" ? "خرید نقدی فوری" : "عرضه مستقیم");
                        }}
                        className={`py-2 rounded-xl text-[10px] font-black border cursor-pointer transition-all ${
                          category === opt.value
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-600 border-slate-150"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Factory Name */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5">نام کارخانه یا هلدینگ تجاری:</label>
                  <input
                    type="text"
                    required
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    placeholder="مثال: کارخانجات مینو"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5">مسئول پیگیری / سمت:</label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="مثال: مهندس احمدی"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5">شماره تماس مستقیم (موبایل):</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 font-mono text-left"
                    />
                  </div>
                </div>

                {/* Title & Quantity */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5">تیتر آگهی:</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: خرید عمده شکر چغندری"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5">میزان / تناژ:</label>
                    <input
                      type="text"
                      required
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="مثال: ۵۰ تن"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5">تصویر آگهی (اختیاری):</label>
                  <label className="cursor-pointer flex items-center justify-center gap-2 w-full bg-slate-50 border border-slate-200 border-dashed rounded-xl px-3.5 py-4 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:border-indigo-400 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                    {uploadedImage ? (
                      <div className="flex items-center gap-2">
                        <img src={uploadedImage} alt="preview" className="w-8 h-8 rounded-md object-cover" />
                        <span className="text-emerald-600">تصویر با موفقیت انتخاب شد</span>
                      </div>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>برای آپلود عکس کلیک کنید</span>
                      </>
                    )}
                  </label>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 mb-1.5">شرح مشخصات فنی و شرایط دقیق معامله:</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="جزئیات فنی کالا، آنالیز آزمایشگاهی، محل تخلیه یا تهاتر را قید بفرمایید..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-600 resize-none"
                  />
                </div>
              </div>

              {/* Submission buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  <FileText size={13} />
                  <span>ثبت آگهی بیلبورد</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    );
  }
}
