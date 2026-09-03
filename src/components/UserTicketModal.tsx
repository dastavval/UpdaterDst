import React, { useState, useEffect } from "react";
import { 
  X, 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  Building2, 
  Layers, 
  Package, 
  Headphones, 
  AlertCircle, 
  Sparkles,
  ChevronRight,
  ArrowRight,
  Inbox,
  Copy,
  Check,
  Trash2,
  FileText,
  CreditCard,
  Truck,
  Building
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  SupportTicket, 
  fetchAllTickets, 
  createNewTicket, 
  addMessageToTicket,
  deleteTicketFromStore
} from "../lib/tickets-helper";
import { toPersianDigits } from "../lib/pricing";

interface UserTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProduct?: {
    id: string;
    name: string;
    brand?: string;
  } | null;
  currentUserPhone?: string;
  currentUserName?: string;
}

const CATEGORIES = [
  { id: "استعلام قیمت تامین‌کننده و کف کارخانه", label: "استعلام قیمت تامین‌کننده و کف کارخانه", icon: "🏢" },
  { id: "مذاکره تناژ و خرید با چک صیادی", label: "مذاکره تناژ و خرید با چک صیادی", icon: "📑" },
  { id: "پیگیری سفارش و بارنامه ترانزیت", label: "پیگیری سفارش و بارنامه ترانزیت", icon: "🚚" },
  { id: "مشاوره تخصصی حاشیه سود و سبد پخش", label: "مشاوره تخصصی حاشیه سود و سبد پخش", icon: "📊" },
  { id: "گزارش عدم تطابق یا نظارت دست‌اول", label: "گزارش عدم تطابق یا نظارت دست‌اول", icon: "🛡️" },
  { id: "پیام مستقیم به مدیریت ارشد", label: "پیام مستقیم به مدیریت ارشد", icon: "👑" }
];

const QUICK_TEMPLATES = [
  {
    title: "استعلام قیمت کف تناژ",
    category: "استعلام قیمت تامین‌کننده و کف کارخانه",
    subject: "استعلام قیمت کف تناژ و شرایط تحویل",
    message: "سلام و احترام، لطفاً قیمت کف نهایی، حداقل مقدار سفارش و شرایط تخفیف نقدی برای خرید تناژ را اعلام بفرمایید.",
    icon: Building
  },
  {
    title: "خرید با چک صیادی بنفش",
    category: "مذاکره تناژ و خرید با چک صیادی",
    subject: "درخواست بررسی خرید اعتباری با چک صیادی",
    message: "با سلام، تمایل به خرید عمده با شرایط پرداخت چک صیادی معتبر ۴۵ الی ۶۰ روزه داریم. لطفاً شرایط استعلام و اعتبارسنجی را بفرمایید.",
    icon: CreditCard
  },
  {
    title: "پیگیری بارنامه و ارسال بار",
    category: "پیگیری سفارش و بارنامه ترانزیت",
    subject: "درخواست شماره بارنامه و زمان تحویل حواله",
    message: "سلام، بابت سفارش ثبت‌شده قبلی، لطفاً وضعیت بارگیری، شماره بارنامه ترانزیت و شماره راننده را اعلام فرمایید.",
    icon: Truck
  },
  {
    title: "درخواست پیش‌فاکتور رسمی",
    category: "استعلام قیمت تامین‌کننده و کف کارخانه",
    subject: "درخواست صدور پیش‌فاکتور رسمی شرکتی با ارزش افزوده",
    message: "با سلام و احترام، لطفاً پیش‌فاکتور رسمی دارای شماره ثبت و شناسه ملی جهت تایید امور مالی برای اقلام درخواستی صادر فرمایید.",
    icon: FileText
  }
];

export default function UserTicketModal({
  isOpen,
  onClose,
  initialProduct,
  currentUserPhone,
  currentUserName
}: UserTicketModalProps) {
  const [activeTab, setActiveTab] = useState<"new" | "history" | "thread">("new");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [userName, setUserName] = useState(() => {
    return currentUserName || localStorage.getItem("dastavval_user_name") || "";
  });
  const [userPhone, setUserPhone] = useState(() => {
    return currentUserPhone || localStorage.getItem("dastavval_user_phone") || "";
  });
  const [userCompany, setUserCompany] = useState(() => {
    return localStorage.getItem("dastavval_user_company") || "";
  });
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  // Follow-up Reply State
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Prefill when opened with product
  useEffect(() => {
    if (initialProduct) {
      setSubject(`استعلام قیمت و شرایط خرید عمده: ${initialProduct.name}`);
      setCategory("استعلام قیمت تامین‌کننده و کف کارخانه");
      setMessage(`سلام و احترام، لطفاً قیمت کف نهایی، حداقل سفارش و شرایط پرداخت اعتباری/چکی برای کالای «${initialProduct.name}» (تامین‌کننده: ${initialProduct.brand || "کارخانه عضو سامانه"}) را اعلام بفرمایید.`);
      setActiveTab("new");
    }

    const handleOpenWithProduct = (e: any) => {
      const p = e.detail;
      if (p) {
        setSubject(`استعلام قیمت و شرایط خرید عمده: ${p.productName || p.name}`);
        setCategory("استعلام قیمت تامین‌کننده و کف کارخانه");
        setMessage(`سلام و احترام، لطفاً قیمت کف نهایی، حداقل سفارش و شرایط پرداخت اعتباری/چکی برای کالای «${p.productName || p.name}» (تامین‌کننده: ${p.brand || "کارخانه عضو سامانه"}) را اعلام بفرمایید.`);
        setActiveTab("new");
      }
    };
    window.addEventListener("dastavval-open-ticket-with-product", handleOpenWithProduct);
    return () => window.removeEventListener("dastavval-open-ticket-with-product", handleOpenWithProduct);
  }, [initialProduct, isOpen]);

  // Load Tickets
  const loadTickets = async () => {
    try {
      const all = await fetchAllTickets();
      setTickets(all);
      if (selectedTicket) {
        const refreshed = all.find(t => t.id === selectedTicket.id);
        if (refreshed) setSelectedTicket(refreshed);
      }
    } catch (e) {
      console.warn("Could not load tickets:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTickets();
      const handler = () => loadTickets();
      window.addEventListener("dastavval-tickets-updated", handler);
      return () => window.removeEventListener("dastavval-tickets-updated", handler);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: typeof QUICK_TEMPLATES[0]) => {
    setCategory(tmpl.category);
    setSubject(tmpl.subject);
    setMessage(tmpl.message);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmitNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim() || !message.trim()) {
      alert("لطفاً نام، شماره تماس و متن پیام را وارد فرمایید.");
      return;
    }

    // Persist details for user convenience
    try {
      localStorage.setItem("dastavval_user_name", userName.trim());
      localStorage.setItem("dastavval_user_phone", userPhone.trim());
      if (userCompany) localStorage.setItem("dastavval_user_company", userCompany.trim());
    } catch (e) {}

    setLoading(true);
    try {
      const created = await createNewTicket({
        userName: userName.trim(),
        userPhone: userPhone.trim(),
        userCompany: userCompany.trim() || "پخش و بنکداری مواد غذایی",
        category,
        subject: subject.trim() || `استعلام ${category}`,
        initialMessage: message.trim(),
        priority: initialProduct ? "high" : "normal",
        productContext: initialProduct ? {
          productId: initialProduct.id,
          productName: initialProduct.name,
          brand: initialProduct.brand
        } : undefined
      });

      setSelectedTicket(created);
      setActiveTab("thread");
      setMessage("");
      setSubject("");
      await loadTickets();
    } catch (err) {
      console.error(err);
      alert("خطایی در ثبت پیام رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const updated = await addMessageToTicket(
        selectedTicket.id,
        replyText.trim(),
        "user",
        userName || selectedTicket.userName || "کاربر"
      );
      if (updated) {
        setSelectedTicket(updated);
        setReplyText("");
        await loadTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteTicket = async (tckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("آیا از حذف این تیکت از تاریخچه خود اطمینان دارید؟")) {
      await deleteTicketFromStore(tckId);
      if (selectedTicket?.id === tckId) {
        setSelectedTicket(null);
        setActiveTab("history");
      }
      await loadTickets();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Headphones size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">سامانه تیکت و پشتیبانی اختصاصی بازرگانی</h3>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  پاسخگویی سریع
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-1">
                <Lock size={11} className="text-amber-400" />
                <span>ارتباط مستقیم، امن و بدون واسطه با کارشناسان مدیریت و بازرگانی</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="بستن"
          >
            <X size={16} />
          </button>
        </div>

        {/* TOP TAB SWITCHER */}
        <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-2">
          <button
            onClick={() => { setActiveTab("new"); setSelectedTicket(null); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "new"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <MessageSquare size={14} />
            <span>ثبت استعلام و پیام جدید</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
              activeTab === "history" || activeTab === "thread"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <Inbox size={14} />
            <span>تیکت‌های من</span>
            <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
              tickets.length > 0 ? "bg-emerald-500 text-slate-950" : "bg-slate-300 text-slate-700"
            }`}>
              {toPersianDigits(tickets.length)}
            </span>
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: CREATE NEW TICKET */}
          {activeTab === "new" && (
            <form onSubmit={handleSubmitNewTicket} className="space-y-4">
              
              {/* Product Context Banner (if pre-selected) */}
              {initialProduct && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Package size={16} />
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 font-bold block">موضوع استعلام امن برای محصول:</span>
                      <span className="text-xs font-black text-slate-900">{initialProduct.name}</span>
                      <span className="text-[10px] text-slate-500 mr-2 font-bold font-mono">({initialProduct.brand || "کارخانه عضو دست‌اول"})</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-white text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-xs">
                    محرمانه 🔒
                  </span>
                </div>
              )}

              {/* Quick Template Chips */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-600 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-amber-500" />
                  <span>انتخاب سریع موضوع و قالب استعلام (یک کلیک):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {QUICK_TEMPLATES.map((tmpl, idx) => {
                    const IconComp = tmpl.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="p-2 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-right transition-all group cursor-pointer flex flex-col justify-between"
                      >
                        <div className="flex items-center gap-1.5 text-slate-700 group-hover:text-emerald-700 font-black text-[11px]">
                          <IconComp size={13} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
                          <span className="truncate">{tmpl.title}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">تکمیل خودکار پیام</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Info Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">نام و نام خانوادگی / مسئول خرید *</label>
                  <div className="relative">
                    <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="مثال: آقای حسینی"
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">شماره همراه (جهت دریافت پیامک وضعیت) *</label>
                  <div className="relative">
                    <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      dir="ltr"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="0912xxxxxxx"
                      className="w-full pr-3 pl-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 text-left focus:bg-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">نام فروشگاه / بنکداری / مجموعه</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userCompany}
                      onChange={(e) => setUserCompany(e.target.value)}
                      placeholder="مثال: پخش مواد غذایی ایرانیان"
                      className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">دپارتمان / موضوع استعلام</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">عنوان تیکت / خلاصه درخواست *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثال: استعلام خرید تناژ رب گوجه و بررسی پرداخت چکی ۴۵ روزه"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">شرح پیام و توضیحات درخواستی *</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="شرح درخواست خود را به طور کامل بنویسید (تعداد یا تناژ مورد نیاز، شهر مقصد، شرایط پرداخت و...)"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>پاسخ رسمی ظرف ۲ ساعت کاری از طریق پیامک ارسال می‌شود.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{loading ? "در حال ثبت..." : "ارسال پیام و دریافت کد رهگیری"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: TICKET LIST HISTORY (CLEAN, NO MOCK TICKETS) */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {tickets.length === 0 ? (
                <div className="py-12 px-4 text-center bg-slate-50 rounded-3xl border border-slate-200/80 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 border border-emerald-100 shadow-sm flex items-center justify-center mx-auto">
                    <MessageSquare size={26} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800">صندوق تیکت‌های شما خالی است</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      هنوز پیامی در سامانه ثبت نکرده‌اید. با ثبت اولین تیکت، می‌توانید روند استعلام قیمت کف، چک صیادی و پیش‌فاکتور رسمی را پیگیری فرمایید.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("new")}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md hover:bg-emerald-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <MessageSquare size={14} />
                    <span>ثبت اولین استعلام یا تیکت</span>
                  </button>
                </div>
              ) : (
                tickets.map((t) => {
                  const isAnswered = t.status === "answered";
                  const isOpenStatus = t.status === "open";
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTicket(t);
                        setActiveTab("thread");
                      }}
                      className="bg-white hover:bg-emerald-50/30 p-4 rounded-2xl border border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col gap-2.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-800 bg-slate-100 group-hover:bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                            {t.trackingCode}
                          </span>
                          <span className="text-xs font-black text-slate-900 line-clamp-1">
                            {t.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAnswered ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 size={11} />
                              <span>پاسخ داده شده ✅</span>
                            </span>
                          ) : isOpenStatus ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                              <Clock size={11} />
                              <span>در انتظار بررسی ⏳</span>
                            </span>
                          ) : (
                            <span className="bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                              بسته شده
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleDeleteTicket(t.id, e)}
                            className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                            title="حذف از تاریخچه"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1.5 border-t border-slate-100">
                        <span className="truncate max-w-md text-slate-600">
                          {t.messages[t.messages.length - 1]?.text || "متن پیام"}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono shrink-0 mr-2">
                          <Clock size={11} />
                          <span>{t.updatedAt || t.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: THREAD CHAT VIEW */}
          {activeTab === "thread" && selectedTicket && (
            <div className="space-y-4">
              <div className="bg-slate-100 p-3 rounded-2xl flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab("history")}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <ArrowRight size={14} />
                  <span>بازگشت به لیست تیکت‌ها</span>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">کد پیگیری:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(selectedTicket.trackingCode)}
                    className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-300 hover:border-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
                    title="کپی کد رهگیری"
                  >
                    <span>{selectedTicket.trackingCode}</span>
                    {copiedCode === selectedTicket.trackingCode ? (
                      <Check size={11} className="text-emerald-600" />
                    ) : (
                      <Copy size={11} className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Ticket Subject & Product context info */}
              <div className="border border-slate-200 rounded-2xl p-3.5 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900">{selectedTicket.subject}</h4>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                    {selectedTicket.category}
                  </span>
                </div>

                {selectedTicket.productContext && (
                  <div className="text-[11px] bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <span>کالای مرتبط: <strong>{selectedTicket.productContext.productName}</strong></span>
                    <span className="text-[10px] text-slate-500 font-bold">🔒 هویت مستقیم تامین‌کننده محرمانه</span>
                  </div>
                )}
              </div>

              {/* Chat Message Bubble History */}
              <div className="space-y-3 max-h-72 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                {selectedTicket.messages.map((m, idx) => {
                  const isAdminMsg = m.sender === "admin";
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${isAdminMsg ? "items-start" : "items-end"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-black text-slate-600">
                          {isAdminMsg ? "مدیریت بازرگانی و پشتیبانی دست‌اول ✅" : m.senderName || "شما"}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">{m.createdAt}</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed ${
                          isAdminMsg
                            ? "bg-slate-900 text-white rounded-tr-none shadow-md border border-slate-800"
                            : "bg-emerald-600 text-white rounded-tl-none shadow-md shadow-emerald-600/10"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send Follow-up Message Box */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="پاسخ یا سوال تکمیلی خود را اینجا بنویسید..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={isSendingReply || !replyText.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSendingReply ? "..." : "ارسال"}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 text-emerald-700 font-bold">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>پلتفرم امن معاملات عمده صنایع غذایی دست‌اول</span>
          </div>
          <span className="font-mono text-[10px]">مرکز تماس و استعلام: ۰۲۱۹۱۰۰۰۰۰۰</span>
        </div>
      </motion.div>
    </div>
  );
}
