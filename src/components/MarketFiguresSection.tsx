import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Award, ShieldCheck, CheckCircle2, Phone, MapPin, 
  Briefcase, Star, FileText, Sparkles, X, ExternalLink, 
  Plus, Settings, Trash2, Eye, ShieldAlert, Check,
  ChevronRight, Upload, Building, User, Info, CheckCircle,
  Crown, Gem, Medal, Image as ImageIcon
} from "lucide-react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "../lib/data-layer";

export type BadgeType = "crown" | "blue_check" | "diamond" | "shield" | "medal" | "trust" | "conquest" | "honor" | "honesty";

export interface MarketFigure {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  experience: string; // e.g. "۱۵ سال سابقه صنفی"
  reputation: number; // e.g. 98 (trust rate)
  address: string; 
  phone?: string;
  specialty: string; 
  badgeType: BadgeType;
  resume: string;
  isApproved: boolean;
  userId?: string;
  docFile?: string; // simulator file name
  stats: {
    verifiedDeals: string;
    activeClients: string;
    satisfactionRate: string;
  };
}

const BADGE_CONFIGS: Record<string, {
  name: string;
  shortLabel: string;
  description: string;
  color: string;
  textColor: string;
  bgLight: string;
  icon: string;
  theme: "gold" | "blue" | "teal" | "emerald" | "orange";
}> = {
  crown: {
    name: "نشان تاج زرین بازار",
    shortLabel: "تاج زرین",
    description: "پیشکسوت و امین ارشد صنف با بالاترین درجه وثوق و اعتبار بازار",
    color: "bg-amber-50 text-amber-900 border-amber-300",
    textColor: "text-amber-800",
    bgLight: "bg-amber-50/70",
    icon: "Crown",
    theme: "gold"
  },
  blue_check: {
    name: "نشان تیک آبی رسمی",
    shortLabel: "تیک آبی",
    description: "هویت، سابقه و پروانه کسب احراز شده با تیک آبی رسمی سامانه دست اول",
    color: "bg-blue-50 text-blue-900 border-blue-300",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50/70",
    icon: "CheckCircle2",
    theme: "blue"
  },
  diamond: {
    name: "نشان الماس تامین و صادرات",
    shortLabel: "الماس برتر",
    description: "تامین‌کننده تراز اول با توان زنجیره توزیع و صادرات کلان محصولات",
    color: "bg-teal-50 text-teal-900 border-teal-300",
    textColor: "text-teal-700",
    bgLight: "bg-teal-50/70",
    icon: "Gem",
    theme: "teal"
  },
  shield: {
    name: "نشان سپر امنیت معامله",
    shortLabel: "سپر امین",
    description: "ضامن حسن انجام مبادلات عمده و تعهدات مالی بدون واسطه",
    color: "bg-emerald-50 text-emerald-900 border-emerald-300",
    textColor: "text-emerald-700",
    bgLight: "bg-emerald-50/70",
    icon: "ShieldCheck",
    theme: "emerald"
  },
  medal: {
    name: "مدال افتخار کارآفرینی",
    shortLabel: "مدال افتخار",
    description: "تولیدکننده و کارآفرین نمونه دست اول کشور با استانداردسازی کیفی",
    color: "bg-orange-50 text-orange-900 border-orange-300",
    textColor: "text-orange-800",
    bgLight: "bg-orange-50/70",
    icon: "Medal",
    theme: "orange"
  },
  // Backward compatibility mappings
  trust: {
    name: "نشان سپر امنیت معامله",
    shortLabel: "سپر امین",
    description: "ضامن حسن انجام مبادلات عمده و تعهدات مالی بدون واسطه",
    color: "bg-emerald-50 text-emerald-900 border-emerald-300",
    textColor: "text-emerald-700",
    bgLight: "bg-emerald-50/70",
    icon: "ShieldCheck",
    theme: "emerald"
  },
  conquest: {
    name: "نشان تاج زرین بازار",
    shortLabel: "تاج زرین",
    description: "پیشکسوت و امین ارشد صنف با بالاترین درجه وثوق و اعتبار بازار",
    color: "bg-amber-50 text-amber-900 border-amber-300",
    textColor: "text-amber-800",
    bgLight: "bg-amber-50/70",
    icon: "Crown",
    theme: "gold"
  },
  honor: {
    name: "مدال افتخار کارآفرینی",
    shortLabel: "مدال افتخار",
    description: "تولیدکننده و کارآفرین نمونه دست اول کشور با استانداردسازی کیفی",
    color: "bg-orange-50 text-orange-900 border-orange-300",
    textColor: "text-orange-800",
    bgLight: "bg-orange-50/70",
    icon: "Medal",
    theme: "orange"
  },
  honesty: {
    name: "نشان تیک آبی رسمی",
    shortLabel: "تیک آبی",
    description: "هویت، سابقه و پروانه کسب احراز شده با تیک آبی رسمی سامانه دست اول",
    color: "bg-blue-50 text-blue-900 border-blue-300",
    textColor: "text-blue-700",
    bgLight: "bg-blue-50/70",
    icon: "CheckCircle2",
    theme: "blue"
  }
};

export default function MarketFiguresSection() {
  const [figures, setFigures] = useState<MarketFigure[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Modals & Tabs State
  const [selectedFigure, setSelectedFigure] = useState<MarketFigure | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState<"pending" | "add_direct" | "manage">("add_direct");
  const [editingFigureId, setEditingFigureId] = useState<string | null>(null);
  const [showInquirySent, setShowInquirySent] = useState(false);

  // Apply Form State
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [badgeType, setBadgeType] = useState<BadgeType>("crown");
  const [resume, setResume] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Directly Add Form State (Admin Only - No Phone Number, Gallery Image Support)
  const [directName, setDirectName] = useState("");
  const [directTitle, setDirectTitle] = useState("");
  const [directCompany, setDirectCompany] = useState("");
  const [directExperience, setDirectExperience] = useState("");
  const [directSpecialty, setDirectSpecialty] = useState("");
  const [directAddress, setDirectAddress] = useState("");
  const [directBadgeType, setDirectBadgeType] = useState<BadgeType>("crown");
  const [directResume, setDirectResume] = useState("");
  const [directAvatar, setDirectAvatar] = useState("");

  // Load user session and market figures
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("dastavval_user");
      if (cached) {
        try {
          const u = JSON.parse(cached);
          setCurrentUser(u);
          if (u) {
            setName(u.name || "");
            setPhone(u.phone || u.mobile || "");
            setCompany(u.company || "");
            setAvatarUrl(u.logoUrl || u.avatar || "");
          }
        } catch (e) {
          console.error("Error parsing cached user:", e);
        }
      }
    }
    loadMarketFigures();
  }, [showApplyModal]);

  const loadMarketFigures = async () => {
    setLoading(true);
    try {
      const colRef = collection(null as any, "market_figures");
      const snap = await getDocs(colRef);
      const list: MarketFigure[] = [];
      snap.forEach((docSnap: any) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          ...d
        } as MarketFigure);
      });
      
      setFigures(list);
    } catch (e) {
      console.error("Error loading market figures:", e);
    } finally {
      setLoading(false);
    }
  };

  // Submit Application Form
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !title || !specialty) {
      alert("لطفاً فیلدهای ضروری را تکمیل نمایید.");
      return;
    }

    const newApp: Partial<MarketFigure> = {
      name,
      title,
      company: company || "شخصی",
      experience: experience || "سابقه آزاد در صنف",
      reputation: 95 + Math.floor(Math.random() * 6), // 95 to 100
      specialty,
      phone: "", // Privacy-first: no phone broadcast
      address: address || "ثبت نشده",
      badgeType,
      resume: resume || "سابقه فعالیت خوداظهاری در سیستم پخش کالا",
      isApproved: false,
      userId: currentUser?.id || currentUser?.phone || "anonymous",
      avatar: avatarUrl.trim() || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      docFile: docName || "پروانه_کسب_پیوست.pdf",
      stats: {
        verifiedDeals: "+۱۰۰ معامله اولیه",
        activeClients: "تحت پوشش شبکه توزیع",
        satisfactionRate: "۹۸٪ تعامل تجاری"
      }
    };

    try {
      const colRef = collection(null as any, "market_figures");
      await addDoc(colRef, newApp);
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setShowApplyModal(false);
        // Clear form
        setName("");
        setTitle("");
        setCompany("");
        setExperience("");
        setSpecialty("");
        setPhone("");
        setAddress("");
        setResume("");
        setDocName("");
        loadMarketFigures();
      }, 2000);
    } catch (e) {
      console.error("Error submitting application:", e);
    }
  };

  // Direct Creation or Editing by Admin (No Phone, Gallery Avatar Support)
  const handleDirectAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directName || !directTitle || !directSpecialty) {
      alert("لطفاً نام، عنوان تجاری و رسته کالای معتمد را وارد فرمایید.");
      return;
    }

    const payload: Partial<MarketFigure> = {
      name: directName,
      title: directTitle,
      company: directCompany || "مستقل در بازار",
      experience: directExperience || "سابقه در صنف",
      specialty: directSpecialty,
      phone: "", // No phone number broadcasted to avoid direct advertising
      address: directAddress || "تهران، بازار بزرگ",
      badgeType: directBadgeType,
      resume: directResume || "فعال و معتمد تایید شده در شبکه مبادلات عمده دست اول",
      avatar: directAvatar.trim() || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    };

    try {
      const colRef = collection(null as any, "market_figures");
      if (editingFigureId) {
        const docRef = doc(colRef, editingFigureId);
        await updateDoc(docRef, payload);
        alert("اطلاعات معتمد بازار با موفقیت بروزرسانی شد!");
      } else {
        const newFig = {
          ...payload,
          reputation: 98 + Math.floor(Math.random() * 3), // 98 to 100
          isApproved: true,
          stats: {
            verifiedDeals: `+${200 + Math.floor(Math.random() * 10000)} معامله موفق`,
            activeClients: `${100 + Math.floor(Math.random() * 2000)} مشتری رسمی`,
            satisfactionRate: "۱۰۰٪ رضایت کامل"
          }
        };
        await addDoc(colRef, newFig);
        alert("معتمد جدید مستقیماً ثبت و با نشان معتبر منتشر شد!");
      }

      setDirectName("");
      setDirectTitle("");
      setDirectCompany("");
      setDirectExperience("");
      setDirectSpecialty("");
      setDirectAddress("");
      setDirectResume("");
      setDirectAvatar("");
      setEditingFigureId(null);
      setActiveAdminTab("manage");
      loadMarketFigures();
    } catch (e) {
      console.error("Error saving direct figure:", e);
    }
  };

  const startEditing = (fig: MarketFigure) => {
    setEditingFigureId(fig.id);
    setDirectName(fig.name);
    setDirectTitle(fig.title);
    setDirectCompany(fig.company);
    setDirectExperience(fig.experience);
    setDirectSpecialty(fig.specialty);
    setDirectAddress(fig.address);
    setDirectBadgeType(fig.badgeType || "crown");
    setDirectAvatar(fig.avatar);
    setDirectResume(fig.resume);
    setActiveAdminTab("add_direct");
  };

  const cancelEditing = () => {
    setEditingFigureId(null);
    setDirectName("");
    setDirectTitle("");
    setDirectCompany("");
    setDirectExperience("");
    setDirectSpecialty("");
    setDirectAddress("");
    setDirectBadgeType("crown");
    setDirectAvatar("");
    setDirectResume("");
    setActiveAdminTab("manage");
  };

  // Approve pending figures
  const handleApprove = async (id: string) => {
    try {
      const colRef = collection(null as any, "market_figures");
      const docRef = doc(colRef, id);
      await updateDoc(docRef, { isApproved: true });
      alert("نشان با موفقیت تایید و معتمد بازار منتشر شد.");
      loadMarketFigures();
    } catch (e) {
      console.error("Error approving figure:", e);
    }
  };

  // Delete/Reject figure
  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این مورد اطمینان دارید؟")) return;
    try {
      setFigures(prev => prev.filter(f => f.id !== id));
      const colRef = collection(null as any, "market_figures");
      const docRef = doc(colRef, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Error deleting figure:", e);
      loadMarketFigures();
    }
  };

  // Clear all figures completely
  const handleClearAll = async () => {
    if (!confirm("آیا از حذف کامل تمامی معتمدین اطمینان دارید؟ کل لیست خالی خواهد شد.")) return;
    try {
      setFigures([]);
      const colRef = collection(null as any, "market_figures");
      const snap = await getDocs(colRef);
      const idsToDelete: string[] = [];
      snap.forEach((docSnap: any) => {
        idsToDelete.push(docSnap.id);
      });
      for (const id of idsToDelete) {
        await deleteDoc(doc(colRef, id));
      }
    } catch (e) {
      console.error("Error clearing all figures:", e);
      loadMarketFigures();
    }
  };

  const getBadgeIcon = (badgeType?: string, size = 12) => {
    switch (badgeType) {
      case "crown":
      case "conquest":
        return <Crown size={size} className="text-amber-500 fill-amber-400 shrink-0" />;
      case "blue_check":
      case "honesty":
        return <CheckCircle2 size={size} className="text-blue-500 fill-blue-50 shrink-0" />;
      case "diamond":
        return <Gem size={size} className="text-teal-500 fill-teal-400 shrink-0" />;
      case "shield":
      case "trust":
        return <ShieldCheck size={size} className="text-emerald-600 fill-emerald-50 shrink-0" />;
      case "medal":
      case "honor":
        return <Medal size={size} className="text-orange-500 fill-orange-400 shrink-0" />;
      default:
        return <Crown size={size} className="text-amber-500 fill-amber-400 shrink-0" />;
    }
  };

  const renderAvatarBadge = (badgeType?: string) => {
    switch (badgeType) {
      case "crown":
      case "conquest":
        return (
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md ring-1 ring-amber-300/60" title="نشان تاج زرین">
            <Crown size={11} className="fill-slate-950 text-slate-950" />
          </span>
        );
      case "blue_check":
      case "honesty":
        return (
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md" title="نشان تیک آبی رسمی">
            <Check size={11} strokeWidth={3} />
          </span>
        );
      case "diamond":
        return (
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md" title="نشان الماس صادرات">
            <Gem size={10} className="fill-teal-200" />
          </span>
        );
      case "shield":
      case "trust":
        return (
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md" title="نشان سپر امین">
            <ShieldCheck size={11} className="fill-emerald-200" />
          </span>
        );
      case "medal":
      case "honor":
        return (
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md" title="مدال افتخار کارآفرینی">
            <Medal size={11} className="fill-orange-200" />
          </span>
        );
      default:
        return (
          <span className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md">
            <Crown size={10} className="fill-amber-200" />
          </span>
        );
    }
  };

  const approvedFigures = figures.filter(f => f.isApproved);
  const pendingFigures = figures.filter(f => !f.isApproved);
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="w-full mt-6 mb-10 text-right font-sans font-medium" dir="rtl" id="market-figures-container">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between border-b border-slate-150/80 pb-3 mb-5">
        <div className="space-y-0.5 text-right">
          <div className="flex items-center gap-2">
            <div className="w-2 h-5 bg-amber-500 rounded-sm shrink-0" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              چهره‌های سرشناس و معتمدین بازار
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed pr-4">
            معرفی پیشکسوتان، تولیدکنندگان و فعالان تایید شده صنف
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel(true)}
              className="text-[10.5px] font-black text-slate-800 bg-white hover:bg-slate-50/80 px-3.5 py-2 rounded-xl border border-slate-200/80 shrink-0 flex items-center gap-1.5 cursor-pointer shadow-3xs hover:shadow-2xs transition-all duration-200"
            >
              <Settings size={13} className="text-slate-500 animate-spin-slow" />
              <span>مدیریت معتمدین {pendingFigures.length > 0 && `(${pendingFigures.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* FIGURES CONTENT */}
      {loading ? (
        <div className="bg-white border border-slate-100 rounded-2xl py-12 text-center text-xs font-bold text-slate-400">
          در حال بارگذاری لیست معتمدین بازار...
        </div>
      ) : approvedFigures.length === 0 ? (
        /* CREATIVE EMPTY STATE DESIGN */
        <div className="bg-white border border-slate-150 rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto space-y-3.5 shadow-3xs">
          <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200/60">
            <Award size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-800">
              لیست معتمدین و صاحب‌نشانان بازار خالی است
            </h4>
            <p className="text-[10.5px] text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
              لیست چهره‌های سرشناس و فعالان امین بازار به زودی پس از تایید نهایی توسط مدیریت در این بخش منتشر خواهد شد.
            </p>
          </div>
        </div>
      ) : (
        /* HORIZONTAL SCROLL LIST OF SQUARE LUXURY CARDS */
        <div className="flex items-stretch gap-3.5 sm:gap-4.5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
          {approvedFigures.map((fig) => {
            const b = BADGE_CONFIGS[fig.badgeType || "crown"] || BADGE_CONFIGS.crown;
            return (
              <div
                key={fig.id}
                onClick={() => {
                  setSelectedFigure(fig);
                  setShowInquirySent(false);
                }}
                className="snap-start shrink-0 w-[180px] h-[215px] sm:w-[205px] sm:h-[235px] bg-white hover:bg-slate-50/50 border border-slate-200 hover:border-amber-400 rounded-3xl p-3 sm:p-3.5 flex flex-col items-center justify-between text-center group shadow-3xs hover:shadow-md transition-all duration-300 cursor-pointer relative overflow-hidden select-none"
              >
                {/* Top Model Badge & Rating */}
                <div className="w-full flex items-center justify-between">
                  <span className="text-[8.5px] font-black text-slate-500 group-hover:text-amber-700 transition-colors flex items-center gap-1">
                    {getBadgeIcon(fig.badgeType, 11)}
                    <span className="truncate max-w-[85px]">{b.shortLabel}</span>
                  </span>
                  <span className="text-[8px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-0.5 shrink-0">
                    <Star size={8} className="fill-amber-400 text-amber-400" />
                    {fig.reputation}٪
                  </span>
                </div>

                {/* Avatar with distinctive badge model */}
                <div className="relative shrink-0 my-0.5">
                  <div className={`p-0.5 rounded-full border-2 transition-all duration-300 ${
                    fig.badgeType === 'crown' || fig.badgeType === 'conquest' ? 'border-amber-400 group-hover:shadow-amber-100 group-hover:shadow-md' :
                    fig.badgeType === 'blue_check' || fig.badgeType === 'honesty' ? 'border-blue-500 group-hover:shadow-blue-100 group-hover:shadow-md' :
                    fig.badgeType === 'diamond' ? 'border-teal-500 group-hover:shadow-teal-100 group-hover:shadow-md' :
                    fig.badgeType === 'shield' || fig.badgeType === 'trust' ? 'border-emerald-500 group-hover:shadow-emerald-100 group-hover:shadow-md' :
                    'border-orange-400 group-hover:shadow-orange-100 group-hover:shadow-md'
                  }`}>
                    <img
                      src={fig.avatar}
                      alt={fig.name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {renderAvatarBadge(fig.badgeType)}
                </div>

                {/* Figure Information */}
                <div className="w-full min-w-0 space-y-0.5">
                  <h4 className="text-xs sm:text-[12.5px] font-black text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                    {fig.name}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold truncate">
                    {fig.title}
                  </p>
                  <p className="text-[8.5px] text-slate-600 font-bold truncate bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">
                    {fig.specialty}
                  </p>
                </div>

                {/* Bottom Pill - Luxury Action */}
                <div className="w-full pt-2 border-t border-slate-100/90 flex items-center justify-between text-[9px] text-slate-400 font-bold">
                  <span className="truncate text-[8.5px]">{fig.experience}</span>
                  <span className="text-[8.5px] font-black text-amber-600 group-hover:text-amber-800 flex items-center gap-0.5 shrink-0">
                    کارت ویزیت
                    <ChevronRight size={10} className="rotate-180" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DYNAMIC CARD VIEW MODAL */}
      <AnimatePresence>
        {selectedFigure && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-2xl text-slate-800 text-right flex flex-col font-sans"
            >
              {/* Premium Gradient Header */}
              <div className="absolute top-0 inset-x-0 h-44 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-[10px] bg-white/10 text-amber-400 px-3 py-1 rounded-full font-black border border-white/5 backdrop-blur-xs flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-400 animate-spin" />
                    کارت ویزیت هوشمند معتمد بازار
                  </span>
                  
                  <button
                    onClick={() => {
                      setSelectedFigure(null);
                      setShowInquirySent(false);
                    }}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="relative z-10 flex items-center gap-4 mt-4">
                  <div className="relative shrink-0">
                    <img
                      src={selectedFigure.avatar}
                      alt={selectedFigure.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-slate-700 shadow-md"
                    />
                    {renderAvatarBadge(selectedFigure.badgeType)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h2
                      className="text-base sm:text-lg font-black leading-tight text-white drop-shadow-sm"
                      style={{ color: "#ffffff" }}
                    >
                      {selectedFigure.name}
                    </h2>
                    <p
                      className="text-xs font-black text-amber-300"
                      style={{ color: "#fcd34d" }}
                    >
                      {selectedFigure.title}
                    </p>
                    <p
                      className="text-[11px] font-bold text-slate-200 truncate"
                      style={{ color: "#e2e8f0" }}
                    >
                      {selectedFigure.company}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD DETAILS */}
              <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-none">
                {/* Badge Explanations */}
                {selectedFigure.badgeType && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg border text-xs font-black shrink-0 ${BADGE_CONFIGS[selectedFigure.badgeType].color}`}>
                        {getBadgeIcon(selectedFigure.badgeType)}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">
                          {BADGE_CONFIGS[selectedFigure.badgeType].name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold font-sans">تایید شده توسط شورای مرکزی بازار</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed pr-8">
                      {BADGE_CONFIGS[selectedFigure.badgeType].description}
                    </p>
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50/40 border border-emerald-100 p-2.5 rounded-xl text-center">
                    <span className="block text-[9px] text-slate-400 font-bold">تجربه کاری</span>
                    <span className="block text-xs font-black text-emerald-800 mt-0.5">{selectedFigure.experience}</span>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-100 p-2.5 rounded-xl text-center">
                    <span className="block text-[9px] text-slate-400 font-bold">معاملات</span>
                    <span className="block text-xs font-black text-slate-800 mt-0.5">{selectedFigure.stats?.verifiedDeals || "+۱۰۰ مورد"}</span>
                  </div>
                  <div className="bg-slate-50/80 border border-slate-100 p-2.5 rounded-xl text-center">
                    <span className="block text-[9px] text-slate-400 font-bold">نرخ رضایت</span>
                    <span className="block text-xs font-black text-slate-800 mt-0.5">{selectedFigure.stats?.satisfactionRate || "۹۹٪"}</span>
                  </div>
                </div>

                {/* Biography */}
                <div className="space-y-1.5">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                    <FileText size={14} className="text-emerald-600" />
                    شرح رزومه تجاری و زمینه کاری
                  </span>
                  <p className="text-[11.5px] text-slate-600 font-bold leading-relaxed bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 text-justify">
                    {selectedFigure.resume}
                  </p>
                </div>

                {/* Product specialties */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-black block">محصولات و رسته تخصصی</span>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs font-black text-slate-700">
                    🛍️ {selectedFigure.specialty}
                  </div>
                </div>

                {/* Business address & authenticity */}
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                    <MapPin size={14} className="text-emerald-600" />
                    محل فعالیت و نشانی حضور در بازار
                  </span>
                  <div className="bg-slate-50 rounded-2xl p-3 space-y-2 border border-slate-100 text-[11.5px] font-bold">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span>{selectedFigure.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 text-[10.5px]">
                      <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                      <span>تایید اصالت هویت و سوابق صنفی در سامانه دست اول</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS - PURE DISPLAY / SHOWCASE (NO REQUESTS) */}
              <div className="p-4 sm:p-5 border-t border-slate-150/80 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck size={17} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-black text-slate-800 truncate">
                      معتمد رسمی و تایید شده صنف بازار
                    </span>
                    <span className="block text-[9.5px] font-bold text-slate-400 truncate">
                      صفحه بیوگرافی و رزومه تجاری (صرفاً جهت نمایش)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFigure(null)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-3xs transition-all shrink-0"
                >
                  بستن کارت
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: APPLY FORM FOR USERS */}
      <AnimatePresence>
        {showApplyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-emerald-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    ثبت مدارک صنفی و درخواست نشان بازار
                  </h3>
                </div>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleApplySubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-none">
                {formSuccess ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <CheckCircle size={24} />
                    </div>
                    <h4 className="text-sm font-black text-slate-900">مدارک شما با موفقیت ثبت شد</h4>
                    <p className="text-[11px] text-slate-500 font-bold">
                      درخواست شما در وضعیت در انتظار بررسی قرار گرفت. پس از بررسی شورای بازار، نشان مربوطه روی کارت ویزیت شما فعال خواهد شد.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="bg-amber-50/50 text-amber-900 border border-amber-200/50 p-3 rounded-xl flex items-start gap-2 text-[10.5px] font-bold">
                      <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <p>با ارسال مدارک تاییدیه شامل پروانه کسب یا کارت بازرگانی، عضویت شما در بخش معتمدین پس از بررسی فیزیکی توسط ادمین فعال می‌گردد.</p>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">نام و نام‌خانوادگی *</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: حاج محمد علوی"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">عنوان تجاری / سمت *</label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="مثال: بنکدار ارشد روغن"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">نام شرکت / فروشگاه</label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="مثال: بازرگانی علوی"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">سابقه صنفی (سال) *</label>
                        <input
                          type="text"
                          required
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="مثال: ۱۸ سال"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">رسته و کالای اصلی *</label>
                        <input
                          type="text"
                          required
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="مثال: پخش عمده حبوبات و برنج"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">تلفن مستقیم *</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="مثال: 02155600000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">نشانی فیزیکی حجره/دفتر</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="مثال: تهران، بازار بزرگ، سرای امین، پلاک ۱۲"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">نشان پیشنهادی درخواستی</label>
                      <select
                        value={badgeType}
                        onChange={(e: any) => setBadgeType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      >
                        <option value="trust">نشان معتمد و امین بازار (سپر سبز)</option>
                        <option value="conquest">نشان فتح بازار / قهرمان صادرات (جام طلا)</option>
                        <option value="honor">نشان افتخار و جهاد تولید (ستاره درخشان)</option>
                        <option value="honesty">نشان سلامت و صداقت مالی (تیک آبی)</option>
                      </select>
                    </div>

                    {/* Dynamic Avatar Selector and Account Photo Sync */}
                    <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-slate-500 font-black block">تصویر پرتره / آواتار معتمد بازار</label>
                        {currentUser && (currentUser.logoUrl || currentUser.avatar) && (
                          <button
                            type="button"
                            onClick={() => setAvatarUrl(currentUser.logoUrl || currentUser.avatar || "")}
                            className="text-[10px] text-emerald-600 hover:text-emerald-700 font-black flex items-center gap-1 transition-all"
                          >
                            <span>👤 استفاده از عکس حساب کاربری</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                            alt="Avatar Preview"
                            className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs"
                          />
                        </div>

                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap gap-1.5 justify-start">
                            {[
                              { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", label: "تیپ ۱" },
                              { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200", label: "تیپ ۲" },
                              { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200", label: "تیپ ۳" },
                              { url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200", label: "تیپ ۴" },
                            ].map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setAvatarUrl(preset.url)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-black border transition-all ${
                                  avatarUrl === preset.url
                                    ? "bg-emerald-600 text-white border-emerald-500"
                                    : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                          <input
                            type="url"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            placeholder="یا آدرس پیوند تصویر دلخواه خود را وارد کنید..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10px] font-bold focus:border-emerald-500 outline-none animate-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Doc Upload Simulator */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">آپلود جواز کسب / سند ملک تجاری *</label>
                      <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-4 text-center cursor-pointer hover:bg-slate-100/50 hover:border-emerald-400 transition-all flex flex-col items-center justify-center gap-1.5 relative">
                        <Upload size={20} className="text-slate-400" />
                        <span className="text-[10.5px] font-black text-slate-700">کلیک کنید یا فایل سند را اینجا بکشید</span>
                        <span className="text-[9px] text-slate-400 font-bold">فرمت‌های مجاز: PDF, JPG (حداکثر ۵ مگابایت)</span>
                        <input 
                          type="file" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setDocName(e.target.files[0].name);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                        />
                      </div>
                      {docName && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 flex items-center justify-between text-[10px] text-emerald-800 font-black mt-1">
                          <span>✓ فایل آماده بارگذاری: {docName}</span>
                          <button type="button" onClick={() => setDocName("")} className="text-red-500 text-xs">حذف</button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">شرح رزومه تجاری و معرفی خود</label>
                      <textarea
                        value={resume}
                        onChange={(e) => setResume(e.target.value)}
                        placeholder="درباره سوابق خود در بازار، حجم معاملات و تاریخچه فعالیت‌ها بنویسید..."
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-center text-xs font-black shadow-md cursor-pointer transition-all"
                    >
                      ثبت درخواست تایید و تاییدیه مدارک
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ADMIN PORTAL */}
      <AnimatePresence>
        {showAdminPanel && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-amber-400 animate-spin" />
                  <h3 className="text-xs sm:text-sm font-black text-white">
                    پنل مدیریت مرکزی معتمدین بازار دست‌اول
                  </h3>
                </div>
                <button
                  onClick={() => setShowAdminPanel(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div className="bg-slate-100 p-2 flex flex-wrap sm:flex-nowrap items-center gap-1.5 border-b border-slate-200 shrink-0">
                <button
                  onClick={() => {
                    setActiveAdminTab("pending");
                    setEditingFigureId(null);
                  }}
                  className={`flex-1 py-2 text-[10.5px] sm:text-xs font-black rounded-xl cursor-pointer text-center transition-all ${
                    activeAdminTab === "pending"
                      ? "bg-white text-slate-900 shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  بررسی درخواست‌ها ({pendingFigures.length})
                </button>
                <button
                  onClick={() => {
                    setActiveAdminTab("manage");
                    setEditingFigureId(null);
                  }}
                  className={`flex-1 py-2 text-[10.5px] sm:text-xs font-black rounded-xl cursor-pointer text-center transition-all ${
                    activeAdminTab === "manage"
                      ? "bg-white text-slate-900 shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  مدیریت فعالان ({approvedFigures.length})
                </button>
                <button
                  onClick={() => {
                    setActiveAdminTab("add_direct");
                    if (!editingFigureId) {
                      setDirectName("");
                      setDirectTitle("");
                      setDirectCompany("");
                      setDirectExperience("");
                      setDirectSpecialty("");
                      setDirectAddress("");
                      setDirectResume("");
                      setDirectAvatar("");
                    }
                  }}
                  className={`flex-1 py-2 text-[10.5px] sm:text-xs font-black rounded-xl cursor-pointer text-center transition-all ${
                    activeAdminTab === "add_direct"
                      ? "bg-white text-slate-900 shadow-3xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {editingFigureId ? "✏️ ویرایش معتمد" : "+ افزودن مستقیم"}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 sm:p-6 overflow-y-auto max-h-[65vh] scrollbar-none space-y-4">
                {activeAdminTab === "pending" ? (
                  pendingFigures.length === 0 ? (
                    <div className="py-12 text-center text-xs font-bold text-slate-400">
                      هیچ درخواست یا ارسال مدارک در انتظار بررسی ثبت نشده است.
                    </div>
                  ) : (
                    pendingFigures.map((fig) => {
                      const b = BADGE_CONFIGS[fig.badgeType || "trust"];
                      return (
                        <div key={fig.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-right">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2.5">
                              <img src={fig.avatar} alt={fig.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                              <div>
                                <h4 className="text-xs sm:text-sm font-black text-slate-900">{fig.name}</h4>
                                <p className="text-[10px] text-slate-500 font-bold">{fig.title} | {fig.company}</p>
                              </div>
                            </div>
                            <span className={`text-[9.5px] font-black border px-2 py-0.5 rounded-lg ${b.color}`}>
                              {b.name}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-600 text-right">
                            <div>رسته: {fig.specialty}</div>
                            <div>تلفن: {fig.phone}</div>
                            <div>آدرس: {fig.address}</div>
                            <div>سابقه: {fig.experience}</div>
                          </div>

                          <div className="bg-slate-100 rounded-xl p-2.5 text-[10.5px] text-slate-600 text-right">
                            <strong>شرح فعالیت: </strong> {fig.resume}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span>📎 فایل پیوست مدارک: <strong className="text-emerald-700">{fig.docFile || "پروانه_کسب.pdf"}</strong></span>
                            
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelete(fig.id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-black cursor-pointer"
                              >
                                رد درخواست
                              </button>
                              <button
                                onClick={() => handleApprove(fig.id)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={11} />
                                ✓ تایید مدارک و اعطای نشان
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )
                ) : activeAdminTab === "manage" ? (
                  /* MANAGE ACTIVE TRUSTED FIGURES LIST WITH EDIT/DELETE */
                  approvedFigures.length === 0 ? (
                    <div className="py-12 text-center text-xs font-bold text-slate-400">
                      هیچ معتمد یا فعال صنفی فعالی در سیستم تایید نشده است.
                    </div>
                  ) : (
                    <div className="space-y-3 text-right">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] text-slate-500 font-bold">
                          لیست معتمدین و فعالان تایید شده جهت ویرایش مشخصات یا سلب نشان:
                        </p>
                        <button
                          type="button"
                          onClick={handleClearAll}
                          className="text-[10px] text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-xl font-black cursor-pointer transition-all flex items-center gap-1 shrink-0"
                        >
                          <Trash2 size={12} />
                          <span>حذف و پاکسازی همه</span>
                        </button>
                      </div>
                      {approvedFigures.map((fig) => {
                        const b = BADGE_CONFIGS[fig.badgeType || "trust"];
                        return (
                          <div key={fig.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-3xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img src={fig.avatar} alt={fig.name} className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">{fig.name}</h4>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] text-slate-500 font-bold truncate">{fig.title} | {fig.company}</span>
                                  <span className={`text-[8px] font-black border px-1.5 py-0.2 rounded-md ${b.color}`}>
                                    {b.name}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => startEditing(fig)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[10px] font-black cursor-pointer transition-all"
                              >
                                ویرایش
                              </button>
                              <button
                                onClick={() => handleDelete(fig.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-[10px] font-black cursor-pointer transition-all"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Add or Edit Direct Figure Form */
                  <form onSubmit={handleDirectAdd} className="space-y-4 text-right">
                    {editingFigureId && (
                      <div className="bg-amber-50 border border-amber-200/60 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-800">
                        <span>⚠️ در حال ویرایش اطلاعات معتمد: {directName}</span>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="px-2 py-1 bg-white hover:bg-amber-100 text-slate-800 border border-slate-200 rounded-lg text-[10px] font-black cursor-pointer"
                        >
                          انصراف از ویرایش
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">نام و نام خانوادگی *</label>
                        <input
                          type="text"
                          required
                          value={directName}
                          onChange={(e) => setDirectName(e.target.value)}
                          placeholder="مثال: سید ابوالفضل موسوی"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">عنوان تجاری / سمت صنفی *</label>
                        <input
                          type="text"
                          required
                          value={directTitle}
                          onChange={(e) => setDirectTitle(e.target.value)}
                          placeholder="مثال: رئیس صنف بنکداران شیراز"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">نام فروشگاه / شرکت</label>
                        <input
                          type="text"
                          value={directCompany}
                          onChange={(e) => setDirectCompany(e.target.value)}
                          placeholder="مثال: بازرگانی موسوی"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 font-black block">سابقه صنفی (سال)</label>
                        <input
                          type="text"
                          value={directExperience}
                          onChange={(e) => setDirectExperience(e.target.value)}
                          placeholder="مثال: ۳۰ سال سابقه"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">رسته و کالاهای اصلی *</label>
                      <input
                        type="text"
                        required
                        value={directSpecialty}
                        onChange={(e) => setDirectSpecialty(e.target.value)}
                        placeholder="مثال: تامین دست‌اول برنج ایرانی، روغن خوراکی، قند و شکر"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">نشانی حجره / محل فعالیت تجاری در بازار</label>
                      <input
                        type="text"
                        value={directAddress}
                        onChange={(e) => setDirectAddress(e.target.value)}
                        placeholder="تهران، بازار بزرگ، سرای حاج حسن"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {/* Model Badge Selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">مدل نشان اعتباری معتمد *</label>
                      <select
                        value={directBadgeType}
                        onChange={(e: any) => setDirectBadgeType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="crown">👑 نشان تاج زرین بازار (پیشکسوت و امین ارشد)</option>
                        <option value="blue_check">🔹 نشان تیک آبی رسمی (احراز هویت و فعال تایید شده)</option>
                        <option value="diamond">💎 نشان الماس تامین و صادرات (تامین‌کننده کلان کشوری)</option>
                        <option value="shield">🛡️ نشان سپر امنیت معامله (ضامن مبادلات و اعتبار امانی)</option>
                        <option value="medal">🏅 مدال افتخار کارآفرینی (تولیدکننده نمونه دست‌اول)</option>
                      </select>
                    </div>

                    {/* Profile Photo - Gallery Upload & Presets */}
                    <div className="space-y-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] text-slate-700 font-black block flex items-center gap-1.5">
                          <ImageIcon size={13} className="text-amber-500" />
                          <span>انتخاب عکس پروفایل از گالری یا تصاویر پیش‌فرض</span>
                        </label>
                        {directAvatar && (
                          <button
                            type="button"
                            onClick={() => setDirectAvatar("")}
                            className="text-[9.5px] text-red-600 font-black hover:underline cursor-pointer"
                          >
                            حذف عکس
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={directAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"}
                            alt="پیش‌نمایش آواتار"
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                          />
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Native Gallery / File input button */}
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10.5px] font-black rounded-xl transition-all shadow-3xs">
                              <Upload size={13} className="text-amber-400" />
                              <span>انتخاب از گالری گوشی / کامپیوتر</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                      if (event.target?.result) {
                                        setDirectAvatar(event.target.result as string);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {/* Fast luxury presets */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9.5px] text-slate-400 font-bold">نمونه‌ها:</span>
                            {[
                              { url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200", label: "پیشکسوت" },
                              { url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200", label: "بانوی صنعت" },
                              { url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200", label: "بازرگان" },
                              { url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200", label: "مدیر ارشد" },
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setDirectAvatar(preset.url)}
                                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                  directAvatar === preset.url
                                    ? "bg-amber-500 text-slate-950 border-amber-500 font-black"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 font-black block">رزومه و شرح دقیق تجاری</label>
                      <textarea
                        value={directResume}
                        onChange={(e) => setDirectResume(e.target.value)}
                        placeholder="رزومه تجاری کامل معتمد را وارد کنید..."
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-center text-xs font-black shadow-md cursor-pointer transition-all"
                    >
                      {editingFigureId ? "✓ ثبت تغییرات و بروزرسانی نهایی" : "ثبت مستقیم معتمد و انتشار آنی"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
