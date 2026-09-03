import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Handshake, Search, Phone, Calendar, Check, X, Eye, RefreshCw,
  User, ClipboardList, Filter, MapPin, Building2, MessageSquare, AlertCircle, Trash2
} from "lucide-react";
import { toPersianNum } from "../utils/persian-utils";

interface AdminRfqsProps {
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
}

export default function AdminRfqs({ 
  setSuccessMsg, 
  setErrorMsg
}: AdminRfqsProps) {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [rfqFilter, setRfqFilter] = useState<'all' | 'raw_material' | 'equipment' | 'service'>('all');
  const [rfqStatusFilter, setRfqStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRfqDetail, setSelectedRfqDetail] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  // Edit RFQ Form States
  const [editTitle, setEditTitle] = useState("");
  const [editRequester, setEditRequester] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const loadRfqs = () => {
    try {
      const saved = localStorage.getItem("dastavval_raw_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRfqs(parsed);
          return;
        }
      }
    } catch (e) {
      console.error("Error reading rfqs", e);
    }
    setRfqs([]);
  };

  useEffect(() => {
    loadRfqs();
    
    // Sync when other parts update raw orders
    const handleSync = () => {
      loadRfqs();
    };
    window.addEventListener("dastavval_orders_updated", handleSync);
    window.addEventListener("dastavval_ads_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("dastavval_orders_updated", handleSync);
      window.removeEventListener("dastavval_ads_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const saveRfqsToStorage = (updatedList: any[]) => {
    setRfqs(updatedList);
    try {
      localStorage.setItem("dastavval_raw_orders", JSON.stringify(updatedList));
    } catch (e) {}
    // Dispatch sync events
    window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
  };

  const handlePurgeAllFakeRfqs = () => {
    if (!window.confirm("آیا از پاکسازی درخواست‌های تستی و بدون اطلاعات تماس مطمئن هستید؟")) return;
    const cleaned = rfqs.filter(r => r && (r.buyerPhone || r.phone) && !String(r.materialName || r.title || "").includes("تست") && !String(r.buyerFactoryName || r.requester || "").includes("تست"));
    saveRfqsToStorage(cleaned);
    setSelectedRfqDetail(null);
    setSuccessMsg("درخواست‌های تستی و فیک با موفقیت پاکسازی شدند.");
  };

  const handleClearAllRfqs = () => {
    if (!window.confirm("هشدار: آیا از ریست و حذف کامل تمام استعلام‌ها مطمئن هستید؟")) return;
    saveRfqsToStorage([]);
    setSelectedRfqDetail(null);
    setSuccessMsg("تمامی درخواست‌های استعلام با موفقیت پاکسازی و صفر شدند.");
  };

  // Update RFQ Status directly
  const handleUpdateRfqStatus = (rfqId: string, nextStatus: string) => {
    if (!rfqId) return;
    
    setRfqs(prev => {
      const updated = prev.map(r => {
        if (String(r.id) === String(rfqId)) {
          return { ...r, status: nextStatus, updatedAt: new Date().toISOString() };
        }
        return r;
      });
      
      // Save to storage inside the setter to ensure we have the latest list
      try {
        localStorage.setItem("dastavval_raw_orders", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
      } catch (e) {}
      
      return updated;
    });
    
    if (selectedRfqDetail && String(selectedRfqDetail.id) === String(rfqId)) {
      setSelectedRfqDetail(prev => prev ? { ...prev, status: nextStatus } : null);
    }
    setSuccessMsg("وضعیت استعلام خرید با موفقیت بروزرسانی شد.");
  };

  // Delete RFQ
  const handleDeleteRfq = (rfqId: string) => {
    if (!rfqId) return;
    if (!window.confirm("آیا از حذف این درخواست استعلام و تمام پیشنهادهای تامین آن مطمئن هستید؟")) return;
    
    setRfqs(prev => {
      const updated = prev.filter(r => String(r.id) !== String(rfqId));
      try {
        localStorage.setItem("dastavval_raw_orders", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
      } catch (e) {}
      return updated;
    });
    
    setSelectedRfqDetail(null);
    setIsProposalModalOpen(false);
    setSuccessMsg("درخواست استعلام خرید با موفقیت حذف گردید.");
  };

  // Update Supplier Bid Approval Status
  const handleToggleBidApproval = (rfqId: string, bidId: string, approvalStatus: 'approved' | 'rejected' | 'pending') => {
    if (!rfqId || !bidId) return;

    setRfqs(prev => {
      const updated = prev.map(r => {
        if (String(r.id) === String(rfqId)) {
          const bids = (r.bids || []).map((b: any) => {
            if (String(b.id) === String(bidId)) {
              return {
                ...b,
                status: approvalStatus,
                approved: approvalStatus === 'approved'
              };
            }
            return b;
          });
          return { ...r, bids };
        }
        return r;
      });

      try {
        localStorage.setItem("dastavval_raw_orders", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
      } catch (e) {}

      // Refresh selected detail safely
      const targetRfq = updated.find(r => String(r.id) === String(rfqId));
      if (targetRfq && selectedRfqDetail && String(selectedRfqDetail.id) === String(rfqId)) {
        setSelectedRfqDetail(targetRfq);
      }

      return updated;
    });

    if (approvalStatus === 'approved') {
      setSuccessMsg("پیشنهاد تامین‌کننده تایید شد و هم‌اکنون در تالار عمومی RFQ قابل مشاهده است.");
    } else if (approvalStatus === 'rejected') {
      setSuccessMsg("پیشنهاد تامین‌کننده رد شد و از انتشار آن جلوگیری گردید.");
    } else {
      setSuccessMsg("پیشنهاد به حالت در انتظار بررسی بازگردانده شد.");
    }
  };

  // Open Edit RFQ Modal
  const openEditModal = (rfq: any) => {
    setEditTitle(rfq.materialName || rfq.title || "");
    setEditRequester(rfq.buyerFactoryName || rfq.requester || "");
    setEditPhone(rfq.buyerPhone || "");
    setEditCity(rfq.buyerCity || "");
    setEditNotes(rfq.buyerNotes || "");
    setEditStatus(rfq.status || "در حال دریافت پیشنهاد");
    setIsEditModalOpen(true);
  };

  // Submit Edit RFQ Form
  const handleSaveRfqEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRfqDetail) return;

    const updated = rfqs.map(r => {
      if (String(r.id) === String(selectedRfqDetail.id)) {
        return {
          ...r,
          materialName: editTitle,
          title: editTitle,
          buyerFactoryName: editRequester,
          requester: editRequester,
          buyerPhone: editPhone,
          buyerCity: editCity,
          buyerNotes: editNotes,
          status: editStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });

    saveRfqsToStorage(updated);
    
    const refreshed = updated.find(r => String(r.id) === String(selectedRfqDetail.id));
    if (refreshed) setSelectedRfqDetail(refreshed);

    setIsEditModalOpen(false);
    setSuccessMsg("جزئیات درخواست استعلام با موفقیت ویرایش و ذخیره شد.");
  };

  // Filter & Search Logic
  const filteredRfqs = rfqs.filter(r => {
    // Type filter
    if (rfqFilter !== 'all' && r.type !== rfqFilter) return false;

    // Status category filter
    if (rfqStatusFilter === 'pending' && r.status !== 'در حال بررسی' && r.status !== 'در حال بررسی و قیمت‌دهی تامین‌کننده') return false;
    if (rfqStatusFilter === 'approved' && r.status !== 'در حال دریافت پیشنهاد' && r.status !== 'تایید شده') return false;
    if (rfqStatusFilter === 'rejected' && r.status !== 'رد شده' && r.status !== 'خاتمه یافته') return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = (r.materialName || r.title || "").toLowerCase().includes(q);
    const requesterMatch = (r.buyerFactoryName || r.requester || "").toLowerCase().includes(q);
    const phoneMatch = (r.buyerPhone || "").toLowerCase().includes(q);
    const codeMatch = String(r.id || "").toLowerCase().includes(q);

    return titleMatch || requesterMatch || phoneMatch || codeMatch;
  });

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Tab Header Card */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Handshake className="text-emerald-600" size={22} />
            <span>مدیریت تالار استعلام قیمت و پروپوزال‌ها (RFQs)</span>
          </h2>
          <p className="text-xs text-slate-500 font-bold">
            در این بخش می‌توانید کلیه درخواست‌های استعلام مواد اولیه، تجهیزات صنعتی، خدمات و پیشنهادهای تامین‌کنندگان را مدیریت نمایید.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={handlePurgeAllFakeRfqs}
            className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer border border-amber-200"
            title="حذف درخواست‌های تستی یا بدون شماره"
          >
            <Filter size={14} />
            <span>پاکسازی درخواست‌های فیک/تستی</span>
          </button>
          <button 
            onClick={handleClearAllRfqs}
            className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer border border-rose-200"
            title="حذف و صفر کردن همه درخواست‌ها"
          >
            <Trash2 size={14} />
            <span>حذف کلی همه درخواست‌ها</span>
          </button>
          <button 
            onClick={loadRfqs}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer border border-slate-200"
          >
            <RefreshCw size={14} />
            <span>بروزرسانی لیست</span>
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 bg-emerald-600 text-white rounded-xl">
            <ClipboardList size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400">کل درخواست‌ها</div>
            <div className="text-lg font-black text-slate-950 mt-0.5">{toPersianNum(rfqs.length)} مورد</div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 bg-emerald-50 text-amber-700 rounded-xl">
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400">در انتظار تایید/بررسی</div>
            <div className="text-lg font-black text-slate-950 mt-0.5">
              {toPersianNum(rfqs.filter(r => r.status?.includes("بررسی")).length)} مورد
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 bg-emerald-600 text-white rounded-xl">
            <Check className="size-5" />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400">کل پیشنهادهای ثبت‌شده تامین‌کنندگان</div>
            <div className="text-lg font-black text-slate-950 mt-0.5">
              {toPersianNum(rfqs.reduce((acc, curr) => acc + (curr.bids?.length || 0), 0))} پروپوزال
            </div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 flex items-center gap-3.5 shadow-2xs">
          <div className="p-3 bg-pink-50 text-pink-700 rounded-xl">
            <MessageSquare size={22} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-400">پیشنهادهای در انتظار تایید</div>
            <div className="text-lg font-black text-slate-950 mt-0.5">
              {toPersianNum(rfqs.reduce((acc, curr) => acc + (curr.bids || []).filter((b: any) => b.status === 'pending' || !b.status).length, 0))} پروپوزال
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="جستجو در شناسه استعلام، نام کالا/تجهیز، کارخانه خریدار یا شماره تماس..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-sans text-xs bg-slate-50/50"
            />
          </div>

          {/* Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-black flex items-center gap-1 shrink-0">
              <Filter size={13} />
              <span>دسته‌بندی:</span>
            </span>
            <div className="flex gap-1.5 overflow-x-auto">
              <button
                onClick={() => setRfqFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  rfqFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                همه
              </button>
              <button
                onClick={() => setRfqFilter('raw_material')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  rfqFilter === 'raw_material' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                مواد اولیه
              </button>
              <button
                onClick={() => setRfqFilter('equipment')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  rfqFilter === 'equipment' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                تجهیزات صنعتی
              </button>
              <button
                onClick={() => setRfqFilter('service')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  rfqFilter === 'service' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                خدمات صنعتی
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-black">وضعیت استعلام:</span>
          <button
            onClick={() => setRfqStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              rfqStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            همه وضعیت‌ها
          </button>
          <button
            onClick={() => setRfqStatusFilter('pending')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              rfqStatusFilter === 'pending' ? 'bg-emerald-100 text-amber-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            در انتظار بررسی/تایید ({toPersianNum(rfqs.filter(r => r.status?.includes("بررسی")).length)})
          </button>
          <button
            onClick={() => setRfqStatusFilter('approved')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              rfqStatusFilter === 'approved' ? 'bg-emerald-600 text-white border border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            تایید شده و در حال دریافت پیشنهاد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RFQs List (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800">لیست درخواست‌های استعلام قیمت (RFQs)</h3>

          {filteredRfqs.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <ClipboardList className="mx-auto text-slate-300" size={36} />
              <p className="text-xs text-slate-500 font-black">هیچ درخواست منطبقی یافت نشد.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {filteredRfqs.map((rfq, idx) => {
                const bidsCount = rfq.bids?.length || 0;
                const pendingBids = (rfq.bids || []).filter((b: any) => b.status === 'pending' || !b.status).length;
                const isSelected = selectedRfqDetail?.id === rfq.id;

                let typeLabel = "مواد اولیه";
                let typeColor = "bg-emerald-600 text-white border-emerald-100";
                if (rfq.type === "equipment") {
                  typeLabel = "تجهیزات صنعتی";
                  typeColor = "bg-blue-50 text-blue-700 border-blue-100";
                } else if (rfq.type === "service") {
                  typeLabel = "خدمات صنعتی";
                  typeColor = "bg-teal-50 text-teal-700 border-teal-100";
                }

                return (
                  <div 
                    key={`admin-rfq-${rfq.id || idx}-${idx}`}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/10 shadow-md' 
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                    }`}
                    onClick={() => {
                      setSelectedRfqDetail(rfq);
                      setIsProposalModalOpen(true);
                    }}
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          #{rfq.id}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${typeColor}`}>
                          {typeLabel}
                        </span>
                        <span className="text-[10px] font-black bg-emerald-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded-full">
                          {rfq.status || "در حال بررسی"}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 leading-snug">
                        {rfq.materialName || rfq.title || "استعلام قیمت بدون عنوان"}
                      </h4>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 size={12} className="text-slate-400" />
                          <span>{rfq.buyerFactoryName || rfq.requester || "خریدار ناشناس"}</span>
                        </span>
                        {rfq.buyerCity && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            <span>{rfq.buyerCity}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span className="font-mono">{rfq.createdAt || "۱۴۰۳/۰۶/۰۱"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100 pt-2.5 md:pt-0 gap-2">
                      <div className="text-left">
                        <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-full text-[10px] font-black shadow-inner">
                          <span>{toPersianNum(bidsCount)} پروپوزال</span>
                          {pendingBids > 0 && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          )}
                        </span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRfqDetail(rfq);
                          setIsProposalModalOpen(true);
                        }}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-150 shadow-2xs"
                      >
                        <Eye size={12} />
                        <span>بررسی و پروپوزال‌ها</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected RFQ & Proposals Detail (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-100 p-5 shadow-sm">
          {!selectedRfqDetail ? (
            <div className="py-24 text-center text-slate-400 space-y-3">
              <ClipboardList className="mx-auto text-slate-300" size={44} />
              <p className="text-xs font-black">جهت بررسی پیشنهادها، یکی از درخواست‌های استعلام لیست مقابل را انتخاب کنید.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="border-b border-slate-100 pb-4.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black bg-slate-100 text-slate-800 px-3 py-1 rounded-xl border border-slate-200">
                    شناسه استعلام: #{selectedRfqDetail.id}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(selectedRfqDetail)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black transition-all cursor-pointer border border-emerald-200"
                    >
                      ویرایش اطلاعات
                    </button>
                    <button
                      onClick={() => handleDeleteRfq(selectedRfqDetail.id)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all cursor-pointer border border-rose-150"
                      title="حذف کامل استعلام"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-900 leading-snug">
                  {selectedRfqDetail.materialName || selectedRfqDetail.title}
                </h3>

                {/* Quick actions for status */}
                <div className="bg-slate-50 p-3 rounded-2xl space-y-2 border border-slate-100">
                  <div className="text-[10px] font-black text-slate-500">تغییر سریع وضعیت استعلام خرید:</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleUpdateRfqStatus(selectedRfqDetail.id, "در حال دریافت پیشنهاد")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        selectedRfqDetail.status === "در حال دریافت پیشنهاد" ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      انتشار و دریافت آفر
                    </button>
                    <button
                      onClick={() => handleUpdateRfqStatus(selectedRfqDetail.id, "در حال بررسی و تایید")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        selectedRfqDetail.status?.includes("بررسی") ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      در انتظار تایید ادمین
                    </button>
                    <button
                      onClick={() => handleUpdateRfqStatus(selectedRfqDetail.id, "خاتمه یافته / تامین شده")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        selectedRfqDetail.status?.includes("خاتمه") || selectedRfqDetail.status?.includes("تامین") ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      خاتمه یافته
                    </button>
                    <button
                      onClick={() => handleUpdateRfqStatus(selectedRfqDetail.id, "رد شده")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        selectedRfqDetail.status === "رد شده" ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      رد آگهی
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-600">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    <div className="text-[10px] text-slate-400 font-bold">شرکت/کارخانه متقاضی:</div>
                    <div className="font-black text-slate-900 mt-0.5">{selectedRfqDetail.buyerFactoryName || selectedRfqDetail.requester}</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                    <div className="text-[10px] text-slate-400 font-bold">موبایل خریدار:</div>
                    <a href={`tel:${selectedRfqDetail.buyerPhone}`} className="font-mono font-black text-indigo-650 flex items-center gap-1 mt-0.5" dir="ltr">
                      <Phone size={11} />
                      <span>{selectedRfqDetail.buyerPhone}</span>
                    </a>
                  </div>
                </div>

                {selectedRfqDetail.buyerNotes && (
                  <div className="bg-emerald-50/30 p-3 rounded-xl border border-emerald-100 text-xs text-slate-700 leading-relaxed font-medium">
                    <div className="text-[10px] font-black text-indigo-900 mb-1">شرح درخواست خریدار:</div>
                    {selectedRfqDetail.buyerNotes}
                  </div>
                )}
              </div>

              {/* Proposals/Bids management list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Handshake size={15} className="text-emerald-600" />
                    <span>پیشنهادهای تامین‌کنندگان (Bids)</span>
                  </h4>
                  <span className="text-[10px] font-black bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                    {toPersianNum(selectedRfqDetail.bids?.length || 0)} مورد ثبت‌شده
                  </span>
                </div>

                {(!selectedRfqDetail.bids || selectedRfqDetail.bids.length === 0) ? (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <MessageSquare className="mx-auto text-slate-300 mb-1.5" size={24} />
                    <p className="text-[11px] text-slate-500 font-black">تاکنون هیچ پیشنهاد تامینی از سمت تامین‌کنندگان برای این درخواست ثبت نشده است.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[45vh] overflow-y-auto pr-1">
                    {selectedRfqDetail.bids.map((bid: any, bIdx: number) => {
                      const isApproved = bid.approved === true || bid.status === 'approved';
                      const isRejected = bid.status === 'rejected';
                      const isPending = !isApproved && !isRejected;

                      return (
                        <div 
                          key={bid.id || bIdx}
                          className={`p-3.5 rounded-xl border space-y-3 transition-all ${
                            isApproved 
                              ? 'bg-emerald-50/40 border-emerald-300' 
                              : isRejected 
                                ? 'bg-emerald-50/20 border-emerald-200 opacity-80' 
                                : 'bg-emerald-50/20 border-amber-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-slate-900">{bid.supplierName}</span>
                                {isApproved && (
                                  <span className="text-[9px] font-bold bg-emerald-600 text-white border border-emerald-200 px-1.5 py-0.5 rounded-full">تایید و منتشر شده</span>
                                )}
                                {isRejected && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-rose-800 border border-emerald-200 px-1.5 py-0.5 rounded-full">رد شده</span>
                                )}
                                {isPending && (
                                  <span className="text-[9px] font-bold bg-emerald-100 text-amber-900 border border-emerald-200 px-1.5 py-0.5 rounded-full">در انتظار بررسی</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-bold">
                                تحویل: <strong className="text-slate-700">{bid.deliveryDays}</strong> | قیمت: <strong className="text-emerald-700 font-mono text-xs">{bid.proposedPrice}</strong>
                              </div>
                            </div>

                            <a 
                              href={`tel:${bid.supplierPhone}`}
                              className="p-1.5 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 rounded-xl transition-all cursor-pointer"
                              title="تماس تلفنی با تامین کننده"
                              dir="ltr"
                            >
                              <Phone size={13} />
                            </a>
                          </div>

                          {bid.notes && (
                            <p className="text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-100 leading-relaxed font-medium">
                              توضیحات: {bid.notes}
                            </p>
                          )}

                          {/* Approval / Rejection direct buttons */}
                          <div className="flex items-center justify-end gap-2 border-t border-slate-100/60 pt-2.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleToggleBidApproval(selectedRfqDetail.id, bid.id, 'rejected')}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black text-[10px] rounded-lg transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1"
                                >
                                  <X size={12} />
                                  <span>عدم تایید پیشنهاد</span>
                                </button>
                                <button
                                  onClick={() => handleToggleBidApproval(selectedRfqDetail.id, bid.id, 'approved')}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <Check size={12} />
                                  <span>تایید و انتشار عمومی</span>
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                onClick={() => handleToggleBidApproval(selectedRfqDetail.id, bid.id, 'pending')}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer border border-slate-200"
                              >
                                بازگرداندن به حالت در انتظار تایید
                              </button>
                            )}

                            {isRejected && (
                              <button
                                onClick={() => handleToggleBidApproval(selectedRfqDetail.id, bid.id, 'pending')}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer border border-slate-200"
                              >
                                بررسی مجدد پیشنهاد
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit RFQ Info Modal & Proposals Detail Modal */}
      <AnimatePresence>
        {isProposalModalOpen && selectedRfqDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProposalModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-[2.5rem] max-w-2xl w-full p-6 shadow-2xl relative border border-slate-100 z-10 space-y-6 text-right max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Handshake size={20} className="text-emerald-600 animate-pulse" />
                  <span>بررسی و تایید پیشنهادهای استعلام قیمت #{selectedRfqDetail.id}</span>
                </h3>
                <button 
                  onClick={() => setIsProposalModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* RFQ Main Info inside Modal */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black bg-emerald-600 text-white px-2.5 py-1 rounded-lg border border-emerald-100">
                      عنوان استعلام: {selectedRfqDetail.materialName || selectedRfqDetail.title}
                    </span>
                    <span className="text-xs font-mono bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg">
                      وضعیت کنونی: {selectedRfqDetail.status || "در حال بررسی"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 font-bold block text-[10px]">شرکت متقاضی خریدار:</span>
                      <strong className="text-slate-900 mt-0.5 block">{selectedRfqDetail.buyerFactoryName || selectedRfqDetail.requester}</strong>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-slate-400 font-bold block text-[10px]">تلفن تماس خریدار:</span>
                      <a href={`tel:${selectedRfqDetail.buyerPhone}`} className="font-mono font-black text-emerald-600 block mt-0.5" dir="ltr">
                        {selectedRfqDetail.buyerPhone}
                      </a>
                    </div>
                  </div>

                  {selectedRfqDetail.buyerNotes && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-medium">
                      <span className="text-slate-400 font-black block text-[10px] mb-1">شرح درخواست خریدار:</span>
                      {selectedRfqDetail.buyerNotes}
                    </div>
                  )}
                </div>

                {/* Change RFQ status */}
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-800">تغییر وضعیت کلی آگهی استعلام:</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateRfqStatus(selectedRfqDetail.id, "در حال دریافت پیشنهاد")}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        selectedRfqDetail.status === "در حال دریافت پیشنهاد" ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      انتشار و دریافت آفر
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateRfqStatus(selectedRfqDetail.id, "در حال بررسی و تایید")}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        selectedRfqDetail.status?.includes("بررسی") ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      در انتظار تایید ادمین
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateRfqStatus(selectedRfqDetail.id, "خاتمه یافته / تامین شده")}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer ${
                        selectedRfqDetail.status?.includes("خاتمه") || selectedRfqDetail.status?.includes("تامین") ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      تامین و خاتمه یافته
                    </button>
                  </div>
                </div>

                {/* Supplier proposals inside Modal */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-t border-slate-150 pt-4">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <ClipboardList size={16} className="text-emerald-600" />
                      <span>پیشنهادهای تامین‌کنندگان برای این استعلام ({toPersianNum(selectedRfqDetail.bids?.length || 0)})</span>
                    </h4>
                  </div>

                  {(!selectedRfqDetail.bids || selectedRfqDetail.bids.length === 0) ? (
                    <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                      <MessageSquare className="mx-auto text-slate-300" size={32} />
                      <p className="text-xs text-slate-500 font-black">هنوز هیچ تامین‌کننده‌ای پیشنهادی ثبت نکرده است.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                      {selectedRfqDetail.bids.map((bid: any, bIdx: number) => {
                        const isApproved = bid.approved === true || bid.status === 'approved';
                        const isRejected = bid.status === 'rejected';
                        const isPending = !isApproved && !isRejected;

                        return (
                          <div 
                            key={bid.id || bIdx}
                            className={`p-4 rounded-xl border space-y-3 transition-all ${
                              isApproved 
                                ? 'bg-emerald-50/40 border-emerald-300' 
                                : isRejected 
                                  ? 'bg-emerald-50/20 border-emerald-200' 
                                  : 'bg-emerald-50/30 border-amber-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-xs text-slate-900">{bid.supplierName}</span>
                                  {isApproved && (
                                    <span className="text-[9px] font-bold bg-emerald-600 text-white border border-emerald-200 px-1.5 py-0.5 rounded-full">تایید و منتشر شده</span>
                                  )}
                                  {isRejected && (
                                    <span className="text-[9px] font-bold bg-emerald-100 text-rose-800 border border-emerald-200 px-1.5 py-0.5 rounded-full">رد شده</span>
                                  )}
                                  {isPending && (
                                    <span className="text-[9px] font-bold bg-emerald-100 text-amber-900 border border-emerald-200 px-1.5 py-0.5 rounded-full">در انتظار بررسی</span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-500 font-bold">
                                  تحویل: <strong className="text-slate-700">{bid.deliveryDays}</strong> | قیمت پیشنهادی تامین‌کننده: <strong className="text-emerald-700 font-mono text-xs">{bid.proposedPrice}</strong>
                                </div>
                              </div>

                              <a 
                                href={`tel:${bid.supplierPhone}`}
                                className="p-2 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                                dir="ltr"
                              >
                                <Phone size={12} />
                                <span>{bid.supplierPhone}</span>
                              </a>
                            </div>

                            {bid.notes && (
                              <p className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-lg border border-slate-150 leading-relaxed font-medium">
                                <span className="text-slate-400 font-bold block text-[9px] mb-0.5">توضیحات و مشخصات کالا:</span>
                                {bid.notes}
                              </p>
                            )}

                            {/* Approval buttons inside Modal */}
                            <div className="flex items-center justify-end gap-2 border-t border-slate-100/60 pt-3">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBidApproval(selectedRfqDetail.id, bid.id, 'rejected')}
                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-black text-[10px] rounded-lg transition-colors cursor-pointer border border-emerald-200 flex items-center gap-1"
                                  >
                                    <X size={12} />
                                    <span>عدم تایید پیشنهاد</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleBidApproval(selectedRfqDetail.id, bid.id, 'approved')}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Check size={12} />
                                    <span>تایید و انتشار پروپوزال</span>
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleBidApproval(selectedRfqDetail.id, bid.id, 'pending')}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer border border-slate-200"
                                >
                                  بازگرداندن به حالت در انتظار تایید
                                </button>
                              )}

                              {isRejected && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleBidApproval(selectedRfqDetail.id, bid.id, 'pending')}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer border border-slate-200"
                                >
                                  بررسی مجدد پیشنهاد
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  بستن پنجره بررسی
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {isEditModalOpen && selectedRfqDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white rounded-[2.5rem] max-w-lg w-full p-6 shadow-2xl relative border border-slate-100 z-10 space-y-4 text-right"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ClipboardList size={18} className="text-emerald-600" />
                  <span>ویرایش درخواست استعلام قیمت #{selectedRfqDetail.id}</span>
                </h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveRfqEdit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">عنوان کالا / تجهیز استعلام شده:</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold font-sans focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">شرکت / کارخانه متقاضی:</label>
                    <input 
                      type="text" 
                      value={editRequester}
                      onChange={(e) => setEditRequester(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold font-sans focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">تلفن تماس:</label>
                    <input 
                      type="text" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold font-sans text-left focus:outline-none focus:border-emerald-500"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">شهر / محل تحویل:</label>
                    <input 
                      type="text" 
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold font-sans focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-500">وضعیت استعلام:</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold font-sans bg-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="در حال دریافت پیشنهاد">در حال دریافت پیشنهاد</option>
                      <option value="در حال بررسی">در حال بررسی</option>
                      <option value="تایید شده">تایید شده</option>
                      <option value="خاتمه یافته">خاتمه یافته</option>
                      <option value="رد شده">رد شده</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-500">شرح درخواست و جزئیات استعلام خریدار:</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium font-sans focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
                >
                  ذخیره تغییرات استعلام
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
