import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, ShieldAlert, Plus, MapPin, Users, Phone, 
  Award, Check, Edit3, Trash2, X, Save, AlertCircle, Search,
  UserCheck, Link as LinkIcon, Copy, ExternalLink, ShieldCheck,
  CreditCard, Eye, FileText, Camera, CheckCircle2, Clock, RotateCcw,
  Crown
} from "lucide-react";
import { db, doc, updateDoc, addDoc, collection, deleteDoc } from "../lib/data-layer";
import { 
  RepresentativeKycData, 
  getAllRepresentativeKycs, 
  getRepresentativeKyc, 
  updateRepresentativeKycStatus,
  isValidIranianNationalCode
} from "../lib/kyc-helper";
import { 
  calculateDealershipTier, 
  formatTomanCurrency, 
  CityTierData 
} from "../utils/dealershipCityTiers";
import { getApiUrl } from "../utils/api-utils";

interface AdminRepresentativesProps {
  representativesList: any[];
  allAvailableBrandsList: string[];
  setLoading: (val: boolean) => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
  setSelectedRepForCertificate: (rep: any) => void;
  onUpdateReps?: () => Promise<void>;
}

export default function AdminRepresentatives({
  representativesList,
  allAvailableBrandsList,
  setLoading,
  setSuccessMsg,
  setErrorMsg,
  confirmAction,
  setSelectedRepForCertificate,
  onUpdateReps
}: AdminRepresentativesProps) {
  // Local State
  const [showRepModal, setShowRepModal] = useState(false);
  const [editingRep, setEditingRep] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'metropolis' | 'provincial' | 'small_town'>('all');

  // KYC Review Modal State
  const [selectedRepForKyc, setSelectedRepForKyc] = useState<any | null>(null);
  const [activeKycData, setActiveKycData] = useState<RepresentativeKycData | null>(null);
  const [kycRejectionReason, setKycRejectionReason] = useState("");
  const [kycReviewerNotes, setKycReviewerNotes] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [allKycs, setAllKycs] = useState<Record<string, RepresentativeKycData>>(() => getAllRepresentativeKycs());

  const refreshKycs = () => {
    setAllKycs(getAllRepresentativeKycs());
  };
  
  // Form State
  const [repCity, setRepCity] = useState("");
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repTel, setRepTel] = useState("");
  const [repAddress, setRepAddress] = useState("");
  const [repBadge, setRepBadge] = useState("نماینده فعال");
  const [repIsApproved, setRepIsApproved] = useState(true);
  const [repAgencyCode, setRepAgencyCode] = useState("");
  const [repBrands, setRepBrands] = useState<string[]>([]);
  const [newRepBrandInput, setNewRepBrandInput] = useState("");

  // Registered Site Users
  const siteUsers = useMemo<any[]>(() => {
    try {
      const raw = localStorage.getItem("dastavval_local_users") || "{}";
      const obj = JSON.parse(raw);
      return Object.values(obj) as any[];
    } catch {
      return [];
    }
  }, [showRepModal]);

  const handleOpenKycReview = (rep: any) => {
    setSelectedRepForKyc(rep);
    const identifier = rep.phone || rep.agencyCode || rep.id;
    const kyc = getRepresentativeKyc(identifier);
    setActiveKycData(kyc);
    setKycRejectionReason(kyc?.rejectionReason || "عدم وضوح تصویر روی کارت ملی یا عدم تطابق نام");
    setKycReviewerNotes(kyc?.reviewerNotes || "");
  };

  const handleApproveKyc = (rep: any) => {
    const identifier = rep.phone || rep.agencyCode || rep.id;
    updateRepresentativeKycStatus(identifier, 'verified', kycReviewerNotes);
    refreshKycs();
    handleFastApproveRep(rep);
    setSelectedRepForKyc(null);
    setSuccessMsg(`احراز هویت و مدارک نماینده (${rep.name}) با موفقیت تأیید و مجوز رسمی عاملیت صادر شد.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleRejectKyc = (rep: any) => {
    if (!kycRejectionReason.trim()) {
      setErrorMsg("لطفاً علت رد مدارک هویتی را بنویسید تا نماینده نسبت به اصلاح آن اقدام نماید.");
      return;
    }
    const identifier = rep.phone || rep.agencyCode || rep.id;
    updateRepresentativeKycStatus(identifier, 'rejected', kycReviewerNotes, kycRejectionReason.trim());
    refreshKycs();
    setSelectedRepForKyc(null);

    // Send SMS notice to applicant
    if (rep.phone || rep.mobile) {
      try {
        fetch(getApiUrl("/api/sms/send-dealership-status-sms"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: rep.phone || rep.mobile,
            fullName: rep.name,
            agencyCode: rep.agencyCode,
            status: "rejected"
          })
        }).catch(() => {});
      } catch (e) {}
    }

    setSuccessMsg(`مدارک نماینده (${rep.name}) جهت اصلاح برگشت داده شد.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleOpenRepModal = (rep?: any) => {
    if (rep) {
      setEditingRep(rep);
      setRepCity(rep.city || "");
      setRepName(rep.name || "");
      setRepPhone(rep.phone || "");
      setRepTel(rep.tel || "");
      setRepAddress(rep.address || "");
      setRepBadge(rep.badge || "نماینده فعال");
      setRepIsApproved(rep.isApproved !== false);
      setRepAgencyCode(rep.agencyCode || "");
      setRepBrands(Array.isArray(rep.brands) ? rep.brands : (typeof rep.brands === 'string' ? rep.brands.split(',').map((s: string) => s.trim()).filter(Boolean) : []));
    } else {
      setEditingRep(null);
      setRepCity("");
      setRepName("");
      setRepPhone("");
      setRepTel("");
      setRepAddress("");
      setRepBadge("نماینده فعال");
      setRepIsApproved(true);
      setRepAgencyCode("");
      setRepBrands([]);
    }
    setNewRepBrandInput("");
    setShowRepModal(true);
  };

  const handleSaveRepresentative = async () => {
    if (!repCity || !repName || !repPhone) {
      setErrorMsg("لطفاً شهر، نام و موبایل نماینده را وارد کنید.");
      return;
    }

    setLoading(true);
    try {
      const generatedAgencyCode = repAgencyCode || (editingRep?.agencyCode) || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload = {
        id: editingRep?.id || `REP-${Date.now()}`,
        city: repCity,
        name: repName,
        phone: repPhone,
        tel: repTel,
        address: repAddress,
        badge: repBadge,
        isApproved: repIsApproved,
        agencyCode: generatedAgencyCode,
        brands: repBrands,
        updatedAt: new Date().toISOString()
      };

      try {
        if (editingRep?.id && typeof editingRep.id === 'string' && !editingRep.id.startsWith("REP-")) {
          await updateDoc(doc(db, "representatives", editingRep.id), payload);
        } else {
          await addDoc(collection(db, "representatives"), {
            ...payload,
            createdAt: new Date().toISOString()
          });
        }
      } catch (dbErr) {
        console.warn("Firestore save fallback to local state for rep:", dbErr);
      }

      // Update local storage dastavval_representatives directly
      try {
        const savedReps = JSON.parse(localStorage.getItem("dastavval_representatives") || "[]");
        const existingIdx = savedReps.findIndex((r: any) => r.phone === repPhone || r.agencyCode === generatedAgencyCode);
        if (existingIdx >= 0) {
          savedReps[existingIdx] = { ...savedReps[existingIdx], ...payload };
        } else {
          savedReps.push(payload);
        }
        localStorage.setItem("dastavval_representatives", JSON.stringify(savedReps));
      } catch (err) {
        console.warn("Local storage rep update warning:", err);
      }

      // Promote / Update site registered user in dastavval_local_users
      try {
        const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
        let userUpdated = false;
        Object.keys(localUsers).forEach(key => {
          const u = localUsers[key];
          if (u && (u.phone === repPhone || u.email === repPhone || u.userCode === payload.id)) {
            localUsers[key] = {
              ...u,
              role: 'representative',
              isRepresentativeApproved: repIsApproved,
              agencyApproved: repIsApproved,
              agencyCode: generatedAgencyCode,
              city: repCity || u.city,
              address: repAddress || u.address
            };
            userUpdated = true;
          }
        });
        if (userUpdated) {
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
          try {
            fetch("/api/b2b/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localUsers)
            }).catch(() => {});
          } catch (e) {}
        }
      } catch (err) {
        console.warn("User promotion sync error:", err);
      }

      setSuccessMsg(editingRep ? "اطلاعات نماینده بروزرسانی شد." : "نماینده جدید با موفقیت ثبت گردید و لینک ارجاع فعال شد.");
      setShowRepModal(false);
      if (onUpdateReps) await onUpdateReps();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره اطلاعات نماینده.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRepresentative = (id: string) => {
    confirmAction(
      "حذف نماینده",
      "آیا از حذف این نماینده از لیست سراسری اطمینان دارید؟",
      async () => {
        setLoading(true);
        try {
          await deleteDoc(doc(db, "representatives", id));
          setSuccessMsg("نماینده با موفقیت حذف شد.");
          if (onUpdateReps) await onUpdateReps();
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
          setErrorMsg("خطا در حذف نماینده.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleFastApproveRep = async (rep: any) => {
    setLoading(true);
    try {
      try {
        await updateDoc(doc(db, "representatives", rep.id), { isApproved: true });
      } catch (e) {}

      // Update local storage
      try {
        const savedReps = JSON.parse(localStorage.getItem("dastavval_representatives") || "[]");
        const idx = savedReps.findIndex((r: any) => r.id === rep.id || r.agencyCode === rep.agencyCode || r.phone === rep.phone);
        if (idx >= 0) {
          savedReps[idx] = { ...savedReps[idx], isApproved: true, status: 'active' };
          localStorage.setItem("dastavval_representatives", JSON.stringify(savedReps));
        }
      } catch (e) {}

      // Synchronize in users collection
      try {
        const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
        let userUpdated = false;
        Object.keys(localUsers).forEach(key => {
          const u = localUsers[key];
          if (u && (u.phone === rep.phone || u.email === rep.phone || u.userCode === rep.id)) {
            localUsers[key] = {
              ...u,
              role: 'representative',
              isRepresentativeApproved: true,
              agencyApproved: true,
              agencyCode: rep.agencyCode || u.agencyCode,
              status: 'active'
            };
            userUpdated = true;
          }
        });
        if (userUpdated) {
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
          try {
            fetch("/api/b2b/users", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localUsers)
            }).catch(() => {});
          } catch (e) {}
        }
      } catch (e) {}

      // Dispatch SMS to representative
      if (rep.phone || rep.mobile) {
        try {
          fetch(getApiUrl("/api/sms/send-dealership-status-sms"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: rep.phone || rep.mobile,
              fullName: rep.name,
              agencyCode: rep.agencyCode,
              status: "approved"
            })
          }).catch(() => {});
        } catch (e) {}
      }

      setSuccessMsg("نماینده با موفقیت تایید و وضعیت دسترسی فعال شد.");
      if (onUpdateReps) await onUpdateReps();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در تایید نماینده.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuditReps = () => {
    setSuccessMsg("گزارش حسابرسی خرید نمایندگان در صف تولید قرار گرفت. بزودی از طریق اعلان مطلع خواهید شد.");
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleAddRepBrand = () => {
    if (!newRepBrandInput.trim()) return;
    if (repBrands.includes(newRepBrandInput.trim())) {
      setNewRepBrandInput("");
      return;
    }
    setRepBrands([...repBrands, newRepBrandInput.trim()]);
    setNewRepBrandInput("");
  };

  const handleRemoveRepBrand = (brand: string) => {
    setRepBrands(repBrands.filter(b => b !== brand));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/15 text-teal-600 flex items-center justify-center shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">مدیریت دفاتر و نمایندگان سراسری</h3>
            <p className="text-xs text-slate-400 font-bold mt-0.5">مشخصات، تلفن و آدرس نمایندگان رسمی توزیع در استان‌های کشور را ویرایش و مدیریت کنید.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAuditReps}
            className="px-5 py-3 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-amber-900 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 border border-emerald-200"
          >
            <ShieldAlert size={16} />
            <span>حسابرسی ۳ ماهه خریدها</span>
          </button>

          <button
            onClick={() => handleOpenRepModal()}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/20 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>افزودن نماینده جدید</span>
          </button>
        </div>
      </div>

      {/* Fair Distribution Quota Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-teal-800/50 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <ShieldAlert size={20} />
            </span>
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <span>قانون توزیع عادلانه کالا بر اساس رتبه‌بندی و جمعیت شهری</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black">
                  مصوبه صیانت بازار
                </span>
              </h4>
              <p className="text-[11px] text-teal-200/80 font-bold mt-0.5">
                تخصیص سهمیه ماهانه خریداران متناسب با کشش بازار و جمعیت شهر جهت جلوگیری از انحصار، احتکار و انباشت غیرعادلانه.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-teal-300 font-black block">🏛️ کلان‌شهرها (سطح ۱)</span>
            <span className="font-mono font-black text-white text-[11px] mt-0.5 block">سقف: ۲.۵ میلیارد تومان</span>
            <span className="text-[9px] text-slate-300 font-bold block mt-0.5">۱,۰۰۰ تا ۳,۰۰۰ کارتن (پهنه‌بندی ۵ گانه)</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-teal-300 font-black block">🏢 مراکز استان (سطح ۲)</span>
            <span className="font-mono font-black text-white text-[11px] mt-0.5 block">سقف: ۸۵۰ میلیون تومان</span>
            <span className="text-[9px] text-slate-300 font-bold block mt-0.5">۳۰۰ تا ۸۰۰ کارتن</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-[10px] text-teal-300 font-black block">🏙️ شهرهای متوسط (سطح ۳)</span>
            <span className="font-mono font-black text-white text-[11px] mt-0.5 block">سقف: ۱۸۰ میلیون تومان</span>
            <span className="text-[9px] text-slate-300 font-bold block mt-0.5">۵۰ تا ۱۵۰ کارتن</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 bg-amber-500/10 border-amber-500/20">
            <span className="text-[10px] text-amber-300 font-black block">🏡 شهرهای کوچک (سطح ۴)</span>
            <span className="font-mono font-black text-amber-200 text-[11px] mt-0.5 block">سقف محدود: ۸۰ میلیون تومان</span>
            <span className="text-[9px] text-amber-100/70 font-bold block mt-0.5">۲۰ تا ۵۰ کارتن (توزیع عادلانه)</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* KYC Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setKycFilter('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                kycFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              همه ({representativesList.length})
            </button>
            <button
              onClick={() => setKycFilter('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                kycFilter === 'pending'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-emerald-50 text-amber-800 hover:bg-emerald-100'
              }`}
            >
              <Clock size={13} />
              <span>در انتظار تأیید کارت ملی ({representativesList.filter(r => {
                const k = getRepresentativeKyc(r.phone || r.agencyCode || r.id);
                return k?.status === 'pending';
              }).length})</span>
            </button>
            <button
              onClick={() => setKycFilter('verified')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                kycFilter === 'verified'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white hover:bg-emerald-100'
              }`}
            >
              <ShieldCheck size={13} />
              <span>احراز هویت شده ({representativesList.filter(r => {
                const k = getRepresentativeKyc(r.phone || r.agencyCode || r.id);
                return k?.status === 'verified' || r.isRepresentativeApproved;
              }).length})</span>
            </button>
            <button
              onClick={() => setKycFilter('rejected')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                kycFilter === 'rejected'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-rose-800 hover:bg-emerald-100'
              }`}
            >
              <AlertCircle size={13} />
              <span>رد شده ({representativesList.filter(r => {
                const k = getRepresentativeKyc(r.phone || r.agencyCode || r.id);
                return k?.status === 'rejected';
              }).length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام، تلفن، شهر، کد..."
              className="w-full pr-10 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-500 outline-none"
            />
          </div>
        </div>

        {/* City Tier Filters */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-bold shrink-0">فیلتر سقف خرید شهری:</span>
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
              tierFilter === 'all' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            همه سطوح
          </button>
          <button
            onClick={() => setTierFilter('metropolis')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
              tierFilter === 'metropolis' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🏛️ کلان‌شهرها (سقف ۲.۵ میلیارد تومان)</span>
          </button>
          <button
            onClick={() => setTierFilter('provincial')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
              tierFilter === 'provincial' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🏢 مراکز استان (سقف ۸۵۰ میلیون تومان)</span>
          </button>
          <button
            onClick={() => setTierFilter('small_town')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition-all flex items-center gap-1 ${
              tierFilter === 'small_town' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🏡 شهرهای کوچک و متوسط (سقف محدود)</span>
          </button>
        </div>
      </div>

      {/* Representatives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {representativesList
          .filter(rep => {
            const kyc = getRepresentativeKyc(rep.phone || rep.agencyCode || rep.id);
            const status = kyc?.status || (rep.isRepresentativeApproved ? 'verified' : 'unsubmitted');
            if (kycFilter === 'pending' && status !== 'pending') return false;
            if (kycFilter === 'verified' && status !== 'verified') return false;
            if (kycFilter === 'rejected' && status !== 'rejected') return false;

            const tierData = calculateDealershipTier(rep.city || "", rep.province);
            if (tierFilter === 'metropolis' && tierData.tier !== 1) return false;
            if (tierFilter === 'provincial' && tierData.tier !== 2) return false;
            if (tierFilter === 'small_town' && tierData.tier < 3) return false;

            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const nameMatch = (rep.name || "").toLowerCase().includes(q);
              const phoneMatch = (rep.phone || "").toLowerCase().includes(q);
              const cityMatch = (rep.city || "").toLowerCase().includes(q);
              const codeMatch = (rep.agencyCode || "").toLowerCase().includes(q);
              return nameMatch || phoneMatch || cityMatch || codeMatch;
            }
            return true;
          })
          .map((rep, idx) => {
            const repIdentifier = rep.phone || rep.agencyCode || rep.id;
            const kyc = getRepresentativeKyc(repIdentifier);
            const kycStatus = kyc?.status || (rep.isRepresentativeApproved ? 'verified' : 'unsubmitted');
            const tierData = calculateDealershipTier(rep.city || "تهران", rep.province);

            return (
              <div
                key={`rep-card-${rep.id || idx}-${idx}`}
                className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {rep.badge === "برند دست اول" ? (
                        <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-[9px] font-black border border-amber-500 flex items-center gap-1 shadow-sm">
                          <Crown size={10} className="fill-slate-950" />
                          برند دست اول (بالاترین اعتبار)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 text-[9px] font-black border border-teal-500/15">
                          {rep.badge || "نماینده فعال"}
                        </span>
                      )}

                      {/* KYC Status Badge */}
                      {kycStatus === 'verified' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-black border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          احراز هویت شده
                        </span>
                      )}
                      {kycStatus === 'pending' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-amber-900 text-[9px] font-black border border-amber-300 flex items-center gap-1 animate-pulse">
                          <Clock size={10} />
                          کارت ملی در صف تایید
                        </span>
                      )}
                      {kycStatus === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-rose-800 text-[9px] font-black border border-emerald-200 flex items-center gap-1">
                          <AlertCircle size={10} />
                          مدارک رد شده
                        </span>
                      )}
                      {kycStatus === 'unsubmitted' && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black border border-slate-200">
                          بدون مدارک هویتی
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                      <MapPin size={13} className="text-teal-600" />
                      {rep.city}
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      {rep.name}
                    </h4>
                    {rep.agencyCode && (
                      <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                        <span className="text-slate-400">کد نمایندگی:</span>
                        <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-black text-emerald-700">{rep.agencyCode}</span>
                      </p>
                    )}
                    <p className="text-xs font-mono font-black text-emerald-600 flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-500" />
                      {rep.phone}
                    </p>

                    {/* National Code if available */}
                    {(kyc?.nationalCode || rep.nationalCode) && (
                      <p className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1.5">
                        <CreditCard size={13} className="text-emerald-500" />
                        <span>کد ملی:</span>
                        <span className="font-black text-slate-900">{kyc?.nationalCode || rep.nationalCode}</span>
                      </p>
                    )}

                    {/* Fair Distribution Quota Box */}
                    <div className={`p-3 rounded-2xl border space-y-1.5 ${
                      tierData.tier === 1 
                        ? 'bg-teal-50/70 border-teal-200/80 text-teal-950'
                        : tierData.tier === 2
                        ? 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950'
                        : tierData.tier === 3
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-amber-50/80 border-amber-200/90 text-amber-950'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] font-black">
                        <span className="flex items-center gap-1">
                          <span>⚖️ سهمیه ماهانه:</span>
                          <span className="font-mono font-black text-emerald-800">{tierData.monthlyQuotaCeilingFormatted}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                          tierData.tier === 1 ? 'bg-teal-700 text-white' :
                          tierData.tier === 2 ? 'bg-indigo-700 text-white' :
                          tierData.tier === 3 ? 'bg-slate-700 text-white' : 'bg-amber-700 text-white'
                        }`}>
                          سطح {tierData.tier}: {tierData.tier === 1 ? 'کلان‌شهر' : tierData.tier === 2 ? 'مرکز استان' : tierData.tier === 3 ? 'شهر متوسط' : 'شهر کوچک (محدود)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 font-bold">
                        <span>ظرفیت کارتنی: <span className="font-mono font-black text-slate-800">{tierData.monthlyCartons}</span></span>
                        <span>کف ورودی: <span className="font-mono font-black text-slate-800">{tierData.initialMinOrderFormatted}</span></span>
                      </div>

                      {/* Quota Indicator Bar */}
                      <div className="space-y-1 pt-1 border-t border-black/5">
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              tierData.tier === 1 ? 'w-[100%] bg-teal-600' :
                              tierData.tier === 2 ? 'w-[60%] bg-indigo-600' :
                              tierData.tier === 3 ? 'w-[30%] bg-slate-600' : 'w-[15%] bg-amber-600'
                            }`}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-black text-slate-500">
                          <span>توزیع عادلانه کالا</span>
                          <span className={tierData.tier === 4 ? "text-amber-800 font-black" : ""}>
                            {tierData.tier === 1 ? "حجم بسیار بالا (پهنه‌ای)" : tierData.tier === 4 ? "سقف محدود صیانت بازار" : "سقف متناسب استانی"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Referral Link */}
                    <div className="pt-2 pb-1">
                      <button
                        onClick={() => {
                          const refCode = rep.agencyCode || rep.phone;
                          const link = `${window.location.origin}/?ref=${encodeURIComponent(refCode)}`;
                          navigator.clipboard.writeText(link);
                          setSuccessMsg(`لینک اختصاصی ارجاع نماینده (${refCode}) کپی گردید.`);
                          setTimeout(() => setSuccessMsg(null), 3500);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 flex items-center justify-between transition-all cursor-pointer group"
                        title="کپی لینک اختصاصی بازاریابی این نماینده"
                      >
                        <span className="flex items-center gap-1.5 font-mono">
                          <LinkIcon size={12} className="text-emerald-500" />
                          <span>{rep.agencyCode || 'لینک ارجاع'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-black text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                          <Copy size={11} />
                          <span>کپی لینک</span>
                        </span>
                      </button>
                    </div>

                    {/* Review KYC Button */}
                    <div className="pt-1">
                      <button
                        onClick={() => handleOpenKycReview(rep)}
                        className={`w-full py-2 px-3 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                          kycStatus === 'pending'
                            ? 'bg-gradient-to-r from-emerald-500 to-orange-600 hover:from-emerald-600 hover:to-orange-700 text-white shadow-amber-900/20 animate-pulse'
                            : kycStatus === 'verified'
                            ? 'bg-emerald-50 hover:bg-emerald-600 text-white border border-emerald-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-indigo-800 border border-emerald-200'
                        }`}
                      >
                        <ShieldCheck size={14} />
                        <span>
                          {kycStatus === 'pending'
                            ? '🔍 بررسی و تأیید کارت ملی و مدارک'
                            : kycStatus === 'verified'
                            ? 'مشاهده مدارک هویتی تأیید شده'
                            : 'ثبت و بررسی مدارک هویتی نماینده'}
                        </span>
                      </button>
                    </div>

                    {rep.address && (
                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed pt-1">
                        آدرس: {rep.address}
                      </p>
                    )}
                    
                    {rep.brands && Array.isArray(rep.brands) && rep.brands.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        <span className="text-[10px] text-slate-400 font-bold block w-full">برندهای تحت عاملیت:</span>
                        {rep.brands.map((b: string, bIdx: number) => (
                          <span key={`rep-admin-brand-${b}-${bIdx}`} className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold border border-emerald-200">
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 gap-2">
                  <div className="flex items-center gap-1">
                    {rep.isApproved !== false ? (
                      <button
                        onClick={() => setSelectedRepForCertificate(rep)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Award size={13} />
                        <span>برگه نمایندگی</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFastApproveRep(rep)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Check size={13} />
                        <span>تایید فوری</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenRepModal(rep)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>ویرایش</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRepresentative(rep.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Representative Modal */}
      <AnimatePresence>
        {showRepModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRepModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20">
                    {editingRep ? <Edit3 size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {editingRep ? "ویرایش اطلاعات نماینده" : "ثبت نماینده سراسری جدید"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">مدیریت زنجیره توزیع و عاملیت‌های استانی</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRepModal(false)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto space-y-6">
                {!editingRep && (
                  <div className="bg-teal-50 border border-teal-200/80 p-4 rounded-2xl space-y-2">
                    <label className="text-xs font-black text-teal-900 flex items-center gap-2">
                      <UserCheck size={18} className="text-teal-600" />
                      <span>انتخاب از کاربران ثبت‌نام شده سایت (ارتقا به نماینده):</span>
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) return;
                        const selectedUser = siteUsers.find((u: any) => (u.phone || u.email || u.userCode || u.id) === val);
                        if (selectedUser) {
                          setRepName(selectedUser.name || selectedUser.company || selectedUser.email || "نماینده جدید");
                          setRepPhone(selectedUser.phone || selectedUser.password || "");
                          setRepCity(selectedUser.city || "تهران");
                          setRepAddress(selectedUser.address || "");
                          setRepAgencyCode(selectedUser.agencyCode || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`);
                        }
                      }}
                      className="w-full bg-white border border-teal-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/30"
                    >
                      <option value="">-- برای تکمیل خودکار، کاربر مورد نظر را انتخاب نمایید ({siteUsers.length} کاربر ثبت نام شده) --</option>
                      {siteUsers.map((u: any, uIdx: number) => {
                        const userVal = u.phone || u.email || u.userCode || u.id || `user-${uIdx}`;
                        return (
                          <option key={`user-opt-${u.id || userVal}-${uIdx}`} value={userVal}>
                            {u.name || u.company || 'کاربر سایت'} | {u.phone || u.email || 'بدون همراه'} | {u.city || 'شهر مشخص نشده'} {u.role === 'representative' ? ' (★ نماینده فعلی)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <p className="text-[10px] text-teal-700 font-bold"> با انتخاب کاربر و ذخیره، نقش کاربر به نماینده رسمی تبدیل می‌شود.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-500 mr-2 uppercase tracking-wider">نام کامل نماینده / شرکت</label>
                    <div className="relative">
                      <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                        placeholder="مثال: بازرگانی محمدی"
                        className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-500 mr-2 uppercase tracking-wider">شهر محل فعالیت</label>
                    <div className="relative">
                      <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={repCity}
                        onChange={(e) => setRepCity(e.target.value)}
                        placeholder="مثال: تهران / اصفهان"
                        className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Dynamic Fair Distribution Quota Calculator Card for Modal */}
                  {repCity && (
                    (() => {
                      const modalTier = calculateDealershipTier(repCity);
                      return (
                        <div className={`col-span-1 md:col-span-2 p-4 rounded-2xl border space-y-2 text-xs transition-all ${
                          modalTier.tier === 1 
                            ? 'bg-teal-50/80 border-teal-200 text-teal-950' 
                            : modalTier.tier === 2
                            ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                            : modalTier.tier === 3
                            ? 'bg-slate-50 border-slate-200 text-slate-900'
                            : 'bg-amber-50/90 border-amber-300 text-amber-950'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-black flex items-center gap-1.5">
                              <span>⚖️ محاسبات هوشمند سهمیه توزیع عادلانه ({modalTier.cityName}):</span>
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                              modalTier.tier === 1 ? 'bg-teal-700 text-white' :
                              modalTier.tier === 2 ? 'bg-indigo-700 text-white' :
                              modalTier.tier === 3 ? 'bg-slate-700 text-white' : 'bg-amber-700 text-white'
                            }`}>
                              {modalTier.tierLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-black/5 text-[11px]">
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block">سقف خرید مجاز ماهانه:</span>
                              <span className="font-mono font-black text-emerald-800">{modalTier.monthlyQuotaCeilingFormatted}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block">ظرفیت کارتنی ماهانه:</span>
                              <span className="font-mono font-black text-slate-800">{modalTier.monthlyCartons}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 font-bold block">کف حداقل سفارش ورود:</span>
                              <span className="font-mono font-black text-slate-800">{modalTier.initialMinOrderFormatted}</span>
                            </div>
                          </div>

                          <p className="text-[10px] font-bold text-slate-600 pt-1 flex items-center gap-1">
                            <ShieldAlert size={13} className={modalTier.tier === 1 ? "text-teal-600" : "text-amber-600"} />
                            <span>
                              {modalTier.tier === 1 
                                ? "کلان‌شهر: به دلیل جمعیت بالا، حجم خرید مجاز بسیار بالا بوده و امکان انتخاب پهنه‌های ۵ گانه وجود دارد."
                                : modalTier.tier === 4
                                ? "شهر کوچک: برای توزیع عادلانه کالا و جلوگیری از احتکار محلی، سقف خرید بر روی ۸۰ میلیون تومان (۲۰ تا ۵۰ کارتن) تنظیم گردیده است."
                                : "سهمیه خرید ماهانه متناسب با جمعیت و کشش بازار این شهرستان به شکل خودکار تنظیم شد."}
                            </span>
                          </p>
                        </div>
                      );
                    })()
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-500 mr-2 uppercase tracking-wider">شماره همراه (ورود به پنل)</label>
                    <div className="relative">
                      <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        type="text"
                        value={repPhone}
                        onChange={(e) => setRepPhone(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full pr-11 pl-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-teal-500/20 transition-all outline-none text-left font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-black text-slate-500 mr-2 uppercase tracking-wider">کد نمایندگی (اختیاری)</label>
                    <input
                      type="text"
                      value={repAgencyCode}
                      onChange={(e) => setRepAgencyCode(e.target.value)}
                      placeholder="AGN-1405-XXXX"
                      className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-black focus:ring-2 focus:ring-teal-500/20 transition-all outline-none text-left font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-500 mr-2 uppercase tracking-wider">آدرس دقیق دفتر توزیع</label>
                  <textarea
                    value={repAddress}
                    onChange={(e) => setRepAddress(e.target.value)}
                    placeholder="خیابان، کوچه، پلاک، واحد..."
                    rows={2}
                    className="w-full px-4 py-3.5 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-teal-500/20 transition-all outline-none"
                  />
                </div>

                <div className="p-5 bg-slate-50 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-700">برندهای تحت عاملیت (کلیک برای حذف):</label>
                    <div className="flex items-center gap-2">
                      <input
                        list="brand-suggestions"
                        value={newRepBrandInput}
                        onChange={(e) => setNewRepBrandInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddRepBrand()}
                        placeholder="افزودن برند..."
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none focus:border-teal-500"
                      />
                      <datalist id="brand-suggestions">
                        {allAvailableBrandsList.map((b, bIdx) => <option key={`brand-sugg-${b}-${bIdx}`} value={b} />)}
                      </datalist>
                      <button
                        onClick={handleAddRepBrand}
                        className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {repBrands.length === 0 ? (
                      <span className="text-[10px] text-slate-400 font-bold">هیچ برندی ثبت نشده است.</span>
                    ) : (
                      repBrands.map((b, bIdx) => (
                        <button
                          key={`modal-brand-${b}-${bIdx}`}
                          onClick={() => handleRemoveRepBrand(b)}
                          className="px-3 py-1 bg-white border border-teal-200 text-teal-700 rounded-lg text-[10px] font-black hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all flex items-center gap-1.5 cursor-pointer group"
                        >
                          {b}
                          <X size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* نشان و سطح اعتباری عاملیت */}
                <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-amber-600" />
                    <label className="text-xs font-black text-amber-900">تعیین نشان رسمی و سطح اعتبار عاملیت (تخصیص قدرت):</label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-800 font-bold block">انتخاب از نمادهای پیش‌فرض:</span>
                      <select
                        value={["نماینده فعال", "برند دست اول", "نماینده رسمی انحصاری", "عاملیت ارشد استانی", "تامین‌کننده تاییدشده", "بنکدار مرجع"].includes(repBadge) ? repBadge : "custom"}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val !== "custom") {
                            setRepBadge(val);
                          } else {
                            setRepBadge("");
                          }
                        }}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/30"
                      >
                        <option value="نماینده فعال">نماینده فعال (پیش‌فرض)</option>
                        <option value="برند دست اول">برند دست اول (👑 بالاترین اعتبار کل سایت)</option>
                        <option value="نماینده رسمی انحصاری">نماینده رسمی انحصاری</option>
                        <option value="عاملیت ارشد استانی">عاملیت ارشد استانی</option>
                        <option value="تامین‌کننده تاییدشده">تامین‌کننده تاییدشده</option>
                        <option value="بنکدار مرجع">بنکدار مرجع</option>
                        <option value="custom">-- برچسب سفارشی دلخواه --</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-amber-800 font-bold block">متن نشان سفارشی (در صورت انتخاب گزینه سفارشی):</span>
                      <input
                        type="text"
                        value={repBadge}
                        onChange={(e) => setRepBadge(e.target.value)}
                        placeholder="مثال: نماینده طلایی درجه یک"
                        className="w-full px-3.5 py-2.5 bg-white border border-amber-200 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {repBadge === "برند دست اول" && (
                    <div className="bg-amber-500/10 border border-amber-300 p-3 rounded-xl flex items-start gap-2.5 text-[10px] text-amber-950 font-bold">
                      <Crown size={16} className="text-amber-600 shrink-0 fill-amber-500/20 animate-bounce" />
                      <div>
                        <span className="font-black text-amber-800 block mb-0.5">👑 نشان برند دست اول (ویژه بالاترین قدرت و اعتبار):</span>
                        این نشان ویژه و انحصاری است. دارنده این نماد به عنوان بزرگترین، معتبرترین و پرقدرت‌ترین تامین‌کننده در کل سایت شناخته شده و با علامت تاج طلایی به تمام کاربران نمایش داده می‌شود.
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl border border-teal-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-teal-600">
                      <AlertCircle size={18} />
                    </div>
                    <span className="text-xs font-black text-teal-900">نماینده مجاز به فعالیت در سامانه باشد؟</span>
                  </div>
                  <button
                    onClick={() => setRepIsApproved(!repIsApproved)}
                    className={`w-14 h-7 rounded-full relative transition-colors duration-300 ${repIsApproved ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${repIsApproved ? 'right-8' : 'right-1'}`} />
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setShowRepModal(false)}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-black hover:bg-slate-100 transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={handleSaveRepresentative}
                  className="px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-teal-600/20 cursor-pointer active:scale-95"
                >
                  <Save size={16} />
                  <span>{editingRep ? "بروزرسانی نماینده" : "ثبت و تایید نهایی"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KYC Document Review & Verification Modal */}
      <AnimatePresence>
        {selectedRepForKyc && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRepForKyc(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-900/30">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>بررسی و اعتبارسنجی مدارک هویتی نماینده</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 font-mono">
                        {selectedRepForKyc.name}
                      </span>
                    </h3>
                    <p className="text-xs text-emerald-200 font-medium mt-0.5">
                      تطبیق کد ملی، استعلام پروانه کسب و تأیید مدارک رسمی انبار و عاملیت
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRepForKyc(null)}
                  className="w-10 h-10 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body Content */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
                {/* Summary Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">نام و نام خانوادگی</span>
                    <span className="text-xs font-black text-slate-900 mt-1 block">
                      {activeKycData?.fullName || selectedRepForKyc.name}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">کد ملی (الگوریتم ۱۰ رقم)</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-mono font-black text-slate-900">
                        {activeKycData?.nationalCode || selectedRepForKyc.nationalCode || "ثبت نشده"}
                      </span>
                      {activeKycData?.nationalCode && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          isValidIranianNationalCode(activeKycData.nationalCode)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-100 text-rose-800'
                        }`}>
                          {isValidIranianNationalCode(activeKycData.nationalCode) ? 'معتبر' : 'نامعتبر'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">شماره همراه و ورود</span>
                    <span className="text-xs font-mono font-bold text-slate-900 mt-1 block" dir="ltr">
                      {activeKycData?.mobile || selectedRepForKyc.phone}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <span className="text-[10px] text-slate-400 font-bold block">استان و شهر</span>
                    <span className="text-xs font-bold text-slate-900 mt-1 block">
                      {activeKycData?.province || selectedRepForKyc.province || ""} - {activeKycData?.city || selectedRepForKyc.city}
                    </span>
                  </div>
                </div>

                {/* Logistics & Address Info */}
                {(activeKycData?.warehouseAddress || selectedRepForKyc.address) && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                      <span>نشانی انبار و محل تخلیه بار:</span>
                      <span className="text-[11px] font-bold text-emerald-700">
                        کد پستی: {activeKycData?.postalCode || "نامشخص"} | متراژ: {activeKycData?.warehouseAreaM2 || "200"} متر | ناوگان: {activeKycData?.distributionVehiclesCount || "1"} دستگاه
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {activeKycData?.warehouseAddress || selectedRepForKyc.address}
                    </p>
                  </div>
                )}

                {/* Uploaded Documents Grid */}
                <div>
                  <h4 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-1.5">
                    <FileText size={15} className="text-emerald-600" />
                    <span>مدارک هویتی و ثبتی ارسالی (برای بزرگ‌نمایی کلیک فرمایید):</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Front of National Card */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>🪪 روی کارت ملی</span>
                        {activeKycData?.nationalCardFrontUrl ? (
                          <span className="text-[10px] text-emerald-700 font-bold">موجود</span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-bold">ارسال نشده</span>
                        )}
                      </div>
                      {activeKycData?.nationalCardFrontUrl ? (
                        <div
                          onClick={() => setPreviewImage(activeKycData.nationalCardFrontUrl)}
                          className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/10] cursor-pointer hover:border-emerald-500 transition-all flex items-center justify-center"
                        >
                          <img
                            src={activeKycData.nationalCardFrontUrl}
                            alt="Front National ID"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black transition-opacity">
                            <Eye size={16} className="ml-1" /> بزرگ‌نمایی
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 aspect-[16/10] flex items-center justify-center text-slate-400 text-xs">
                          تصویر کارت ملی ثبت نشده
                        </div>
                      )}
                    </div>

                    {/* Back of National Card */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>🪪 پشت کارت ملی</span>
                        {activeKycData?.nationalCardBackUrl ? (
                          <span className="text-[10px] text-emerald-700 font-bold">موجود</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">ارسال نشده</span>
                        )}
                      </div>
                      {activeKycData?.nationalCardBackUrl ? (
                        <div
                          onClick={() => setPreviewImage(activeKycData.nationalCardBackUrl!)}
                          className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/10] cursor-pointer hover:border-emerald-500 transition-all flex items-center justify-center"
                        >
                          <img
                            src={activeKycData.nationalCardBackUrl}
                            alt="Back National ID"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black transition-opacity">
                            <Eye size={16} className="ml-1" /> بزرگ‌نمایی
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 aspect-[16/10] flex items-center justify-center text-slate-400 text-xs">
                          اختیاری / ثبت نشده
                        </div>
                      )}
                    </div>

                    {/* Business License / Warehouse Deed / Selfie */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-slate-700">
                        <span>📜 جواز کسب / سلفی</span>
                        {(activeKycData?.businessLicenseUrl || activeKycData?.selfieWithIdUrl) ? (
                          <span className="text-[10px] text-emerald-700 font-bold">موجود</span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">ارسال نشده</span>
                        )}
                      </div>
                      {activeKycData?.businessLicenseUrl ? (
                        <div
                          onClick={() => setPreviewImage(activeKycData.businessLicenseUrl!)}
                          className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/10] cursor-pointer hover:border-emerald-500 transition-all flex items-center justify-center"
                        >
                          <img
                            src={activeKycData.businessLicenseUrl}
                            alt="Business License"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black transition-opacity">
                            <Eye size={16} className="ml-1" /> جواز کسب
                          </div>
                        </div>
                      ) : activeKycData?.selfieWithIdUrl ? (
                        <div
                          onClick={() => setPreviewImage(activeKycData.selfieWithIdUrl!)}
                          className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/10] cursor-pointer hover:border-emerald-500 transition-all flex items-center justify-center"
                        >
                          <img
                            src={activeKycData.selfieWithIdUrl}
                            alt="Selfie with ID"
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black transition-opacity">
                            <Eye size={16} className="ml-1" /> تطبیق چهره
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 aspect-[16/10] flex items-center justify-center text-slate-400 text-xs">
                          اختیاری / ثبت نشده
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rejection / Note Input */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <label className="text-xs font-black text-slate-700 block">
                    توضیحات و بازخورد کارشناس (در صورت رد یا تایید مشروط):
                  </label>
                  <input
                    type="text"
                    value={kycRejectionReason}
                    onChange={(e) => setKycRejectionReason(e.target.value)}
                    placeholder="مثال: تصویر کارت ملی ناخوانا است یا انقضای کارت گذشته است..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRepForKyc(null)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-black hover:bg-slate-100 cursor-pointer"
                >
                  بستن
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleRejectKyc(selectedRepForKyc)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <AlertCircle size={15} />
                    <span>رد مدارک و درخواست اصلاح</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproveKyc(selectedRepForKyc)}
                    className="flex-1 sm:flex-initial px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 size={16} />
                    <span>تأیید نهایی احراز هویت و صدور مجوز</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] p-2 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 left-3 p-2 rounded-xl bg-black/70 text-white hover:bg-black cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Document Preview"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
