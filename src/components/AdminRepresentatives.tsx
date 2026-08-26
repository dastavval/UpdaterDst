import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building2, ShieldAlert, Plus, MapPin, Users, Phone, 
  Award, Check, Edit3, Trash2, X, Save, AlertCircle, Search,
  UserCheck, Link as LinkIcon, Copy, ExternalLink, ShieldCheck,
  CreditCard, Eye, FileText, Camera, CheckCircle2, Clock, RotateCcw
} from "lucide-react";
import { db, doc, updateDoc, addDoc, collection, deleteDoc } from "../lib/data-layer";
import { 
  RepresentativeKycData, 
  getAllRepresentativeKycs, 
  getRepresentativeKyc, 
  updateRepresentativeKycStatus,
  isValidIranianNationalCode
} from "../lib/kyc-helper";

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
        if (editingRep?.id && !editingRep.id.startsWith("REP-")) {
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
          if (u && (u.phone === repPhone || u.email === repPhone)) {
            localUsers[key] = {
              ...u,
              role: 'representative',
              isRepresentativeApproved: true,
              agencyApproved: true,
              agencyCode: generatedAgencyCode,
              city: repCity || u.city,
              address: repAddress || u.address
            };
            userUpdated = true;
          }
        });
        if (userUpdated) {
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
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
      await updateDoc(doc(db, "representatives", rep.id), { isApproved: true });
      setSuccessMsg("نماینده تایید گردید.");
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
            className="px-5 py-3 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 border border-amber-200"
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

      {/* Search & KYC Status Filters */}
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
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
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
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
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
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
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

            return (
              <div
                key={`rep-card-${rep.id || idx}`}
                className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 text-[9px] font-black border border-teal-500/15">
                        {rep.badge || "نماینده فعال"}
                      </span>

                      {/* KYC Status Badge */}
                      {kycStatus === 'verified' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          احراز هویت شده
                        </span>
                      )}
                      {kycStatus === 'pending' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-black border border-amber-300 flex items-center gap-1 animate-pulse">
                          <Clock size={10} />
                          کارت ملی در صف تایید
                        </span>
                      )}
                      {kycStatus === 'rejected' && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[9px] font-black border border-rose-200 flex items-center gap-1">
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

                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      {rep.name}
                    </h4>
                    {rep.agencyCode && (
                      <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                        <span className="text-slate-400">کد نمایندگی:</span>
                        <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-black text-indigo-700">{rep.agencyCode}</span>
                      </p>
                    )}
                    <p className="text-xs font-mono font-black text-emerald-600 flex items-center gap-1.5">
                      <Phone size={13} className="text-emerald-500" />
                      {rep.phone}
                    </p>

                    {/* National Code if available */}
                    {(kyc?.nationalCode || rep.nationalCode) && (
                      <p className="text-[11px] font-mono font-bold text-slate-600 flex items-center gap-1.5">
                        <CreditCard size={13} className="text-indigo-500" />
                        <span>کد ملی:</span>
                        <span className="font-black text-slate-900">{kyc?.nationalCode || rep.nationalCode}</span>
                      </p>
                    )}

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
                        className="w-full px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200/60 flex items-center justify-between transition-all cursor-pointer group"
                        title="کپی لینک اختصاصی بازاریابی این نماینده"
                      >
                        <span className="flex items-center gap-1.5 font-mono">
                          <LinkIcon size={12} className="text-indigo-500" />
                          <span>{rep.agencyCode || 'لینک ارجاع'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-black text-indigo-800 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
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
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-900/20 animate-pulse'
                            : kycStatus === 'verified'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
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
                          <span key={`rep-admin-brand-${b}-${bIdx}`} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
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
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
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
                      className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer"
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
                        const userVal = u.phone || u.email || u.userCode || u.id;
                        return (
                          <option key={`user-opt-${userVal || uIdx}`} value={userVal}>
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
                      repBrands.map(b => (
                        <button
                          key={`modal-brand-${b}`}
                          onClick={() => handleRemoveRepBrand(b)}
                          className="px-3 py-1 bg-white border border-teal-200 text-teal-700 rounded-lg text-[10px] font-black hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all flex items-center gap-1.5 cursor-pointer group"
                        >
                          {b}
                          <X size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))
                    )}
                  </div>
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
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-900/30">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>بررسی و اعتبارسنجی مدارک هویتی نماینده</span>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/20 text-indigo-100 font-mono">
                        {selectedRepForKyc.name}
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200 font-medium mt-0.5">
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
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
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
                  <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                      <span>نشانی انبار و محل تخلیه بار:</span>
                      <span className="text-[11px] font-bold text-indigo-700">
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
                    <FileText size={15} className="text-indigo-600" />
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
                          <span className="text-[10px] text-rose-500 font-bold">ارسال نشده</span>
                        )}
                      </div>
                      {activeKycData?.nationalCardFrontUrl ? (
                        <div
                          onClick={() => setPreviewImage(activeKycData.nationalCardFrontUrl)}
                          className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/10] cursor-pointer hover:border-indigo-500 transition-all flex items-center justify-center"
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
                          className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/10] cursor-pointer hover:border-indigo-500 transition-all flex items-center justify-center"
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
                          className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/10] cursor-pointer hover:border-indigo-500 transition-all flex items-center justify-center"
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
                          className="relative group rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/10] cursor-pointer hover:border-indigo-500 transition-all flex items-center justify-center"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:border-indigo-500 outline-none"
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
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer"
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
