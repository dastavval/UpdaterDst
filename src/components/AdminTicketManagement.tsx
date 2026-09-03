import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  User,
  Phone,
  Building2,
  Package,
  ShieldCheck,
  Tag,
  AlertCircle,
  RefreshCw,
  Trash2,
  Lock,
  ChevronLeft,
  X,
  FileText,
  Smartphone,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  SupportTicket,
  fetchAllTickets,
  addMessageToTicket,
  updateTicketStatusInStore,
  deleteTicketFromStore
} from "../lib/tickets-helper";
import { toPersianDigits } from "../lib/pricing";

interface AdminTicketManagementProps {
  setLoading?: (l: boolean) => void;
  setSuccessMsg?: (msg: string | null) => void;
  setErrorMsg?: (msg: string | null) => void;
}

const QUICK_RESPONSES = [
  "سلام و احترام، استعلام قیمت کف از واحد فروش کارخانه گرفته شد. برای سفارش بالای حداقل تناژ، تخفیف درخواستی شما منظور خواهد شد.",
  "سلام و درود، درخواست شما با واحد بازرگانی بررسی و پیش‌فاکتور رسمی صادر گردید. می‌توانید از بخش پیش‌فاکتور آن را دانلود نمایید.",
  "سلام، حواله بارگیری شما صادر گردید. شماره بارنامه و تماس راننده تریلی از طریق پیامک به اطلاع شما رسید.",
  "با سلام، پرداخت با چک صیادی بنفش پس از استعلام اعتبارسنجی بانکی تایید شد. لطفاً تصویر چک را بارگذاری فرمایید.",
  "سلام، این کالا مستقیماً از خط تولید کارخانه با ضمانت اصالت و سلامت فیزیکی ارسال می‌شود."
];

export default function AdminTicketManagement({
  setLoading,
  setSuccessMsg,
  setErrorMsg
}: AdminTicketManagementProps) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [replyText, setReplyText] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAllTickets();
      setTickets(data);
      if (!selectedTicketId && data.length > 0) {
        setSelectedTicketId(data[0].id);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("dastavval-tickets-updated", handler);
    return () => window.removeEventListener("dastavval-tickets-updated", handler);
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  useEffect(() => {
    if (selectedTicket) {
      setAdminNotes(selectedTicket.adminNotes || "");
    }
  }, [selectedTicketId]);

  const filteredTickets = tickets.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (t.userName || "").toLowerCase().includes(q);
      const matchPhone = (t.userPhone || "").includes(q);
      const matchSubject = (t.subject || "").toLowerCase().includes(q);
      const matchCode = (t.trackingCode || "").toLowerCase().includes(q);
      const matchCompany = (t.userCompany || "").toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchSubject && !matchCode && !matchCompany) return false;
    }
    return true;
  });

  const handleSendAdminReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setIsSending(true);
    try {
      await addMessageToTicket(
        selectedTicket.id,
        replyText.trim(),
        "admin",
        "مدیریت بازرگانی دست اول"
      );

      // Also update admin notes if changed
      if (adminNotes !== selectedTicket.adminNotes) {
        await updateTicketStatusInStore(selectedTicket.id, "answered", adminNotes);
      }

      setReplyText("");
      if (setSuccessMsg) setSuccessMsg("پاسخ تیکت با موفقیت ارسال و ثبت گردید.");
      await loadData();
    } catch (err) {
      if (setErrorMsg) setErrorMsg("خطا در ارسال پاسخ تیکت.");
    } finally {
      setIsSending(false);
    }
  };

  const handleChangeStatus = async (newStatus: SupportTicket["status"]) => {
    if (!selectedTicket) return;
    try {
      await updateTicketStatusInStore(selectedTicket.id, newStatus, adminNotes);
      if (setSuccessMsg) setSuccessMsg(`وضعیت تیکت به «${newStatus}» تغییر یافت.`);
      await loadData();
    } catch (err) {
      if (setErrorMsg) setErrorMsg("خطا در تغییر وضعیت تیکت.");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    try {
      await updateTicketStatusInStore(selectedTicket.id, selectedTicket.status, adminNotes);
      if (setSuccessMsg) setSuccessMsg("یادداشت محرمانه ادمین ذخیره شد.");
      await loadData();
    } catch (err) {}
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm("آیا از حذف کامل این تیکت اطمینان دارید؟")) {
      try {
        await deleteTicketFromStore(ticketId);
        if (selectedTicketId === ticketId) {
          setSelectedTicketId(null);
        }
        if (setSuccessMsg) setSuccessMsg("تیکت با موفقیت حذف گردید.");
        await loadData();
      } catch (err) {
        if (setErrorMsg) setErrorMsg("خطا در حذف تیکت.");
      }
    }
  };

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === "open").length;
  const answeredCount = tickets.filter(t => t.status === "answered").length;
  const closedCount = tickets.filter(t => t.status === "closed").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      
      {/* TOP HEADER */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare size={22} className="text-emerald-400" />
            <h2 className="text-lg font-black text-white">مرکز پشتیبانی تیکتی و گفتگوی مستقیم با مشتریان</h2>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              تیکتینگ زنده
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium">
            پاسخگویی مستقیم و ثبت استعلام‌های قیمت، مذاکرات تناژ، پیش‌فاکتورها و پیگیری سفارشات خریداران عمده و کارخانجات.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>بروزرسانی تیکت‌ها</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">کل تیکت‌ها</span>
            <span className="text-xl font-black text-slate-900 font-mono mt-0.5 block">{toPersianDigits(totalCount)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <MessageSquare size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between bg-amber-50/20">
          <div>
            <span className="text-[11px] font-bold text-amber-600 block">در انتظار پاسخ (جدید)</span>
            <span className="text-xl font-black text-amber-700 font-mono mt-0.5 block">{toPersianDigits(openCount)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between bg-emerald-50/20">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 block">پاسخ داده شده</span>
            <span className="text-xl font-black text-emerald-700 font-mono mt-0.5 block">{toPersianDigits(answeredCount)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">بسته شده / تکمیل</span>
            <span className="text-xl font-black text-slate-700 font-mono mt-0.5 block">{toPersianDigits(closedCount)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      {/* MAIN DUAL-PANEL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: TICKET LIST (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xs p-4 space-y-4">
          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو با نام، موبایل، کد یا موضوع..."
                className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: "all", label: "همه" },
                { id: "open", label: "جدید / بدون پاسخ" },
                { id: "answered", label: "پاسخ داده شده" },
                { id: "closed", label: "بسته شده" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    filterStatus === f.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Items List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-0.5">
            {filteredTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold space-y-1">
                <p className="text-xs">تیکتی با این مشخصات یافت نشد.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const isAnswered = t.status === "answered";
                const isOpenStatus = t.status === "open";

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-emerald-50/50 border-emerald-500 shadow-md ring-1 ring-emerald-500/30"
                        : "bg-slate-50 hover:bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {t.trackingCode}
                        </span>
                        <span className="text-xs font-black text-slate-900 line-clamp-1">
                          {t.userName}
                        </span>
                      </div>
                      <div>
                        {isAnswered ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-300">
                            پاسخ داده شده
                          </span>
                        ) : isOpenStatus ? (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-300 animate-pulse">
                            نیاز به پاسخ
                          </span>
                        ) : (
                          <span className="bg-slate-200 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded-full">
                            بسته شده
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-700 line-clamp-1">
                      {t.subject}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/50">
                      <span className="font-mono">{t.userPhone}</span>
                      <span>{t.updatedAt || t.createdAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL & CONVERSATION THREAD (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
          {selectedTicket ? (
            <div className="space-y-4">
              
              {/* Ticket Top Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                        {selectedTicket.trackingCode}
                      </span>
                      <h3 className="text-sm font-black text-slate-900">{selectedTicket.subject}</h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-bold mt-1 block">
                      دپارتمان: {selectedTicket.category}
                    </span>
                  </div>

                  {/* Status Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleChangeStatus("open")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        selectedTicket.status === "open"
                          ? "bg-amber-500 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-amber-50"
                      }`}
                    >
                      جدید / باز
                    </button>
                    <button
                      onClick={() => handleChangeStatus("answered")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        selectedTicket.status === "answered"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50"
                      }`}
                    >
                      پاسخ داده شده
                    </button>
                    <button
                      onClick={() => handleChangeStatus("closed")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                        selectedTicket.status === "closed"
                          ? "bg-slate-700 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      بستن تیکت
                    </button>

                    <button
                      onClick={() => handleDeleteTicket(selectedTicket.id)}
                      className="px-2 py-1 rounded-lg text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center gap-1 mr-1"
                      title="حذف تیکت"
                    >
                      <Trash2 size={12} />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>

                {/* User Credentials & Context */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                    <User size={13} className="text-emerald-600" />
                    <span>{selectedTicket.userName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                    <Phone size={13} className="text-emerald-600" />
                    <span className="font-mono">{selectedTicket.userPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                    <Building2 size={13} className="text-emerald-600" />
                    <span className="truncate">{selectedTicket.userCompany || "پخش و بنکداری"}</span>
                  </div>
                </div>

                {/* Product context banner if associated */}
                {selectedTicket.productContext && (
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-emerald-900 font-bold">
                      کالای استعلام شده: <strong>{selectedTicket.productContext.productName}</strong> ({selectedTicket.productContext.brand || "تولیدکننده"})
                    </span>
                    <span className="text-[10px] font-black bg-white text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      محرمانه 🔒
                    </span>
                  </div>
                )}
              </div>

              {/* Chat Thread History */}
              <div className="space-y-3 max-h-80 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                {selectedTicket.messages.map((m, idx) => {
                  const isAdminMsg = m.sender === "admin";
                  return (
                    <div
                      key={m.id || idx}
                      className={`flex flex-col ${isAdminMsg ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-black text-slate-500">
                          {isAdminMsg ? "پاسخ مدیریت بازرگانی دست اول (Admin)" : `${selectedTicket.userName} (مشتری)`}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">{m.createdAt}</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed ${
                          isAdminMsg
                            ? "bg-slate-900 text-white rounded-tl-none shadow-md"
                            : "bg-white text-slate-900 border border-slate-200 rounded-tr-none shadow-xs"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Response Templates */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-black text-slate-700 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>پاسخ‌های آماده و سریع ادمین:</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_RESPONSES.map((qr, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => setReplyText(qr)}
                      className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer text-right line-clamp-1 max-w-xs"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Reply Input Box */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-slate-700">ارسال پاسخ رسمی به کاربر (تیکتی و پیامکی):</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="متن پاسخ رسمی مدیریت را وارد فرمایید..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold">
                    🔔 پاسخ در پنل کاربر نمایش داده شده و اطلاع‌رسانی پیامکی ارسال می‌شود.
                  </span>
                  <button
                    onClick={handleSendAdminReply}
                    disabled={isSending || !replyText.trim()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send size={14} />
                    <span>{isSending ? "در حال ارسال..." : "ثبت و ارسال پاسخ"}</span>
                  </button>
                </div>
              </div>

              {/* Confidential Admin Notes */}
              <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="یادداشت محرمانه داخلی ادمین برای این تیکت (مشتری نمی‌بیند)..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
                />
                <button
                  onClick={handleSaveNotes}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  ذخیره یادداشت
                </button>
              </div>

            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 font-bold space-y-2">
              <MessageSquare size={32} className="mx-auto text-slate-300" />
              <p className="text-xs">لطفاً یک تیکت را از لیست سمت راست انتخاب نمایید.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
