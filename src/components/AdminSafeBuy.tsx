import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, Search, ShieldAlert, Phone, 
  Calendar, Activity, ClipboardList, Check, X, Eye, RefreshCw,
  User, ShoppingCart, ShoppingBag, TrendingDown
} from "lucide-react";
import { db, collection, getDocs, doc, updateDoc, query, addDoc } from "../lib/data-layer";
import { toPersianNum } from "../utils/persian-utils";
import { Product } from "../types";

interface AdminSafeBuyProps {
  products: Product[];
  sponsoredAds: any[];
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  setLoading: (val: boolean) => void;
}

export default function AdminSafeBuy({ 
  products, 
  sponsoredAds, 
  setSuccessMsg, 
  setErrorMsg,
  setLoading: setGlobalLoading
}: AdminSafeBuyProps) {
  const [safeBuyRequests, setSafeBuyRequests] = useState<any[]>([]);
  const [safeBuyFilter, setSafeBuyFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedSafeBuyDetail, setSelectedSafeBuyDetail] = useState<any | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const fetchSafeBuyRequests = async () => {
    setLocalLoading(true);
    try {
      const q = query(collection(db, "safe_buy_requests"));
      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];
      querySnapshot.forEach((docSnap) => {
        fetched.push({ firebaseId: docSnap.id, ...docSnap.data() });
      });
      
      if (fetched.length > 0) {
        fetched.sort((a, b) => {
          const idA = a.id || '';
          const idB = b.id || '';
          return idB.localeCompare(idA);
        });
        setSafeBuyRequests(fetched);
        localStorage.setItem("dastavval_safe_buy_requests", JSON.stringify(fetched));
      } else {
        const local = localStorage.getItem("dastavval_safe_buy_requests");
        if (local) {
          try {
            const parsed = JSON.parse(local);
            setSafeBuyRequests(parsed);
          } catch (err) {}
        }
      }
    } catch (e) {
      console.error("Error fetching safe buy requests:", e);
      const local = localStorage.getItem("dastavval_safe_buy_requests");
      if (local) {
        try { setSafeBuyRequests(JSON.parse(local)); } catch (err) {}
      }
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    fetchSafeBuyRequests();
  }, []);

  const handleUpdateSafeBuyStatus = async (reqId: string, firebaseId: string | undefined, nextStatus: 'approved' | 'rejected' | 'pending') => {
    setGlobalLoading(true);
    try {
      if (firebaseId) {
        const docRef = doc(db, "safe_buy_requests", firebaseId);
        await updateDoc(docRef, { status: nextStatus });
      } else {
        const q = query(collection(db, "safe_buy_requests"));
        const snapshot = await getDocs(q);
        let foundId = "";
        snapshot.forEach((docSnap) => {
          if (docSnap.data().id === reqId) foundId = docSnap.id;
        });
        if (foundId) {
          await updateDoc(doc(db, "safe_buy_requests", foundId), { status: nextStatus });
        }
      }
      
      setSuccessMsg(`وضعیت درخواست به «${nextStatus === 'approved' ? 'تایید شده' : nextStatus === 'rejected' ? 'رد شده' : 'در انتظار'}» تغییر یافت.`);
      fetchSafeBuyRequests();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e) {
      setErrorMsg("خطا در بروزرسانی وضعیت خرید امن.");
    } finally {
      setGlobalLoading(false);
    }
  };

  const filteredRequests = safeBuyRequests.filter(req => 
    safeBuyFilter === 'all' ? true : req.status === safeBuyFilter
  );

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="space-y-2 text-right">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 justify-end">
            مدیریت معاملات «خرید امن» (Safe Buy)
            <ShieldCheck className="text-emerald-500 w-8 h-8" />
          </h3>
          <p className="text-xs text-slate-400 font-bold leading-relaxed">
            بررسی و نظارت بر تراکنش‌های مشکوک، احراز هویت خریداران عمده و تایید نهایی حواله‌های جابجا شده در سیستم ضمانت دست‌اول
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchSafeBuyRequests}
            disabled={localLoading}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-slate-150 transition-all flex items-center gap-2 font-black text-xs cursor-pointer"
          >
            <RefreshCw size={18} className={localLoading ? "animate-spin" : ""} />
            بروزرسانی داده‌ها
          </button>
          
          <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-150 flex gap-1">
            <button 
              onClick={() => setSafeBuyFilter('all')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${safeBuyFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
            >
              همه
            </button>
            <button 
              onClick={() => setSafeBuyFilter('pending')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${safeBuyFilter === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
            >
              در انتظار
            </button>
            <button 
              onClick={() => setSafeBuyFilter('approved')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${safeBuyFilter === 'approved' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
            >
              تایید شده
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {localLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={`safebuy-skel-${i}`} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 animate-pulse h-64"></div>
          ))
        ) : filteredRequests.length === 0 ? (
          <div className="col-span-full bg-white p-24 rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
             <Activity className="w-16 h-16 text-slate-200 mx-auto" />
             <p className="text-xs font-black text-slate-400">هیچ درخواستی در این وضعیت یافت نشد.</p>
          </div>
        ) : (
          filteredRequests.map((req, rIdx) => (
            <motion.div 
              key={`admin-safebuy-req-${req.id || rIdx}-${rIdx}`}
              className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group"
            >
              <div className="p-6 flex items-start justify-between border-b border-gray-50 bg-slate-50/30">
                <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-3xl bg-white border border-slate-100 shadow-inner flex items-center justify-center text-2xl">
                     🤝
                   </div>
                   <div className="text-right">
                     <h4 className="text-sm font-black text-slate-800">{req.buyerName || "خریدار ناشناس"}</h4>
                     <p className="text-[10px] text-slate-400 font-bold">درخواست خرید امن #{req.id?.slice(-5)}</p>
                   </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black ${
                  req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  req.status === 'rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                  'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                  {req.status === 'approved' ? 'تایید شده' : req.status === 'rejected' ? 'رد شده' : 'در انتظار بررسی'}
                </div>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4 text-right">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black">شماره تماس خریدار:</span>
                  <div className="flex items-center gap-1.5 justify-end text-xs font-black text-slate-700 font-mono">
                    {toPersianNum(req.buyerPhone || "---")}
                    <Phone size={12} className="text-slate-300" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black">مبلغ تراکنش (تومان):</span>
                  <div className="text-xs font-black text-emerald-600">
                    {toPersianNum((req.totalAmount || 0).toLocaleString())} تومان
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black">تاریخ ثبت درخواست:</span>
                  <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-slate-500">
                    {toPersianNum(req.createdAt || "نامعلوم")}
                    <Calendar size={12} className="text-slate-300" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-400 font-black">تعداد اقلام سبد:</span>
                  <div className="text-xs font-black text-slate-800">
                    {toPersianNum(req.items?.length || 0)} قلم کالا
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-2">
                <button 
                  onClick={() => setSelectedSafeBuyDetail(req)}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-black py-3 rounded-2xl text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Eye size={16} />
                  مشاهده جزئیات و اقلام
                </button>
                {req.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handleUpdateSafeBuyStatus(req.id, req.firebaseId, 'approved')}
                      className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all cursor-pointer border border-emerald-100"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => handleUpdateSafeBuyStatus(req.id, req.firebaseId, 'rejected')}
                      className="p-3 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-600 hover:text-white transition-all cursor-pointer border border-rose-100"
                    >
                      <X size={18} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSafeBuyDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-right font-sans"
              dir="rtl"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner">
                     🛡️
                   </div>
                   <div>
                     <h3 className="text-base font-black text-slate-900">جزئیات درخواست خرید امن</h3>
                     <p className="text-[10px] text-slate-400 font-bold">کد سیستمی: {selectedSafeBuyDetail.id}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedSafeBuyDetail(null)} 
                  className="p-3 hover:bg-slate-200 rounded-2xl transition-all cursor-pointer text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                {/* Buyer & Summary Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 space-y-3">
                    <h5 className="text-[10px] font-black text-indigo-600 flex items-center gap-1.5">
                      <User size={14} /> مشخصات خریدار
                    </h5>
                    <div className="space-y-2">
                      <p className="text-xs font-black text-slate-800">{selectedSafeBuyDetail.buyerName}</p>
                      <p className="text-[11px] font-bold text-slate-500 font-mono" dir="ltr">{toPersianNum(selectedSafeBuyDetail.buyerPhone)}</p>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed">{selectedSafeBuyDetail.buyerAddress || "آدرس ثبت نشده"}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-emerald-50/50 rounded-3xl border border-emerald-100 space-y-3">
                    <h5 className="text-[10px] font-black text-emerald-600 flex items-center gap-1.5">
                      <Activity size={14} /> خلاصه مالی
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold">مبلغ نهایی فاکتور:</span>
                        <span className="text-xs font-black text-emerald-600">{toPersianNum((selectedSafeBuyDetail.totalAmount || 0).toLocaleString())} تومان</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold">وضعیت فعلی:</span>
                        <span className="text-[10px] font-black text-slate-700">{selectedSafeBuyDetail.status === 'approved' ? 'تایید نهایی' : 'در انتظار'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  <h5 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <ShoppingCart size={16} className="text-indigo-600" />
                    لیست کالاهای درخواستی ({toPersianNum(selectedSafeBuyDetail.items?.length || 0)} مورد)
                  </h5>
                  <div className="space-y-2">
                    {selectedSafeBuyDetail.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 p-1 flex items-center justify-center shrink-0">
                          {item.image ? (
                             <img src={item.image} className="w-full h-full object-contain rounded-lg" />
                          ) : (
                             <ShoppingBag className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h6 className="text-[11px] font-black text-slate-800">{item.name || item.productName}</h6>
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                             <span>تعداد: {toPersianNum(item.quantity)} {item.unit || "عدد"}</span>
                             <span>فی: {toPersianNum((item.price || 0).toLocaleString())} تومان</span>
                          </div>
                        </div>
                        <div className="text-left">
                           <span className="text-xs font-black text-slate-700">{toPersianNum(((item.price || 0) * (item.quantity || 1)).toLocaleString())}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-gray-100 flex gap-3">
                {selectedSafeBuyDetail.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => {
                        handleUpdateSafeBuyStatus(selectedSafeBuyDetail.id, selectedSafeBuyDetail.firebaseId, 'approved');
                        setSelectedSafeBuyDetail(null);
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      <Check size={18} />
                      تایید و نهایی‌سازی معامله
                    </button>
                    <button 
                      onClick={() => {
                        handleUpdateSafeBuyStatus(selectedSafeBuyDetail.id, selectedSafeBuyDetail.firebaseId, 'rejected');
                        setSelectedSafeBuyDetail(null);
                      }}
                      className="px-8 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white font-black py-4 rounded-2xl text-xs transition-all border border-rose-100 cursor-pointer"
                    >
                      <X size={18} />
                      رد درخواست
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSelectedSafeBuyDetail(null)}
                  className="px-8 bg-white border border-slate-200 text-slate-500 font-black py-4 rounded-2xl text-xs hover:bg-slate-100 transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
