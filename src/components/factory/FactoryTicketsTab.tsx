import React, { useState } from "react";
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Paperclip, 
  FileText, 
  User, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  X,
  Headphones,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface FactoryTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  department: "logistics" | "commercial" | "finance" | "audit" | "general";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "answered" | "in_progress" | "closed";
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: "factory" | "support";
    senderName: string;
    text: string;
    date: string;
    attachmentUrl?: string;
  }[];
}

interface FactoryTicketsTabProps {
  user: any;
}

const DEPARTMENT_LABELS: Record<string, string> = {
  logistics: "ناوگان حمل و نقل و ترابری",
  commercial: "واحد بازرگانی و قراردادها",
  finance: "امور مالی و تسویه‌حساب",
  audit: "ممیزی کالا و پروانه‌ها",
  general: "پشتیبانی عمومی و فنی"
};

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "عادی", color: "bg-slate-100 text-slate-700" },
  medium: { label: "متوسط", color: "bg-blue-100 text-blue-800" },
  high: { label: "مهم", color: "bg-amber-100 text-amber-800" },
  urgent: { label: "فوری / آنی", color: "bg-rose-100 text-rose-800" }
};

export default function FactoryTicketsTab({ user }: FactoryTicketsTabProps) {
  const [tickets, setTickets] = useState<FactoryTicket[]>(() => {
    try {
      const saved = localStorage.getItem("dastavval_factory_tickets");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Initial sample factory ticket
    return [
      {
        id: "t-101",
        ticketNumber: "TK-84920",
        subject: "هماهنگی اعزام تریلی چادری جهت بارگیری ۵۰۰ کارتن",
        department: "logistics",
        priority: "high",
        status: "answered",
        createdAt: "۱۴۰۲/۰۸/۲۴ - ۱۰:۳۰",
        updatedAt: "۱۴۰۲/۰۸/۲۴ - ۱۱:۱۵",
        messages: [
          {
            id: "m-1",
            sender: "factory",
            senderName: user?.company || "مدیر انبار کارخانه",
            text: "با سلام، سفارش مربوط به کد CST-49021 آماده بارگیری در انبار کارخانه می‌باشد. لطفاً هماهنگی لازم جهت اعزام خودروی چادری به درب انبار مرکزی انجام گیرد.",
            date: "۱۴۰۲/۰۸/۲۴ - ۱۰:۳۰"
          },
          {
            id: "m-2",
            sender: "support",
            senderName: "پشتیبانی ترابری دست‌اول",
            text: "سلام و احترام. خودروی ترابری بارنامه شده و راننده فردا صبح ساعت ۹ الی ۱۰ جهت بارگیری در محل انبار شما حضور خواهد داشت. شماره تماس راننده در حواله قید گردیده است.",
            date: "۱۴۰۲/۰۸/۲۴ - ۱۱:۱۵"
          }
        ]
      }
    ];
  });

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  // New Ticket Form State
  const [newSubject, setNewSubject] = useState("");
  const [newDepartment, setNewDepartment] = useState<FactoryTicket['department']>("logistics");
  const [newPriority, setNewPriority] = useState<FactoryTicket['priority']>("medium");
  const [newMessage, setNewMessage] = useState("");

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  // Submit New Ticket
  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) {
      alert("لطفاً موضوع و متن پیام را وارد فرمایید.");
      return;
    }

    const newTicket: FactoryTicket = {
      id: "t-" + Date.now(),
      ticketNumber: "TK-" + Math.floor(10000 + Math.random() * 90000),
      subject: newSubject.trim(),
      department: newDepartment,
      priority: newPriority,
      status: "open",
      createdAt: new Date().toLocaleDateString('fa-IR') + " - " + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      updatedAt: new Date().toLocaleDateString('fa-IR') + " - " + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      messages: [
        {
          id: "m-" + Date.now(),
          sender: "factory",
          senderName: user?.company || user?.name || "کارخانه",
          text: newMessage.trim(),
          date: new Date().toLocaleDateString('fa-IR') + " - " + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    const updated = [newTicket, ...tickets];
    setTickets(updated);
    localStorage.setItem("dastavval_factory_tickets", JSON.stringify(updated));

    setIsNewTicketModalOpen(false);
    setNewSubject("");
    setNewMessage("");
    setActiveTicketId(newTicket.id);
  };

  // Submit Reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicketId) return;

    const replyMsg = {
      id: "m-" + Date.now(),
      sender: "factory" as const,
      senderName: user?.company || user?.name || "کارخانه",
      text: replyText.trim(),
      date: new Date().toLocaleDateString('fa-IR') + " - " + new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = tickets.map(t => {
      if (t.id === activeTicketId) {
        return {
          ...t,
          status: "in_progress" as const,
          updatedAt: replyMsg.date,
          messages: [...t.messages, replyMsg]
        };
      }
      return t;
    });

    setTickets(updated);
    localStorage.setItem("dastavval_factory_tickets", JSON.stringify(updated));
    setReplyText("");
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-right font-sans" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Headphones size={20} className="text-indigo-600" />
            <h3 className="text-base font-black text-slate-900">میز مکاتبات و تیکت‌های پشتیبانی کارخانه</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            ارتباط مستقیم و ثبت درخواست با دپارتمان‌های لجستیک و ترابری، امور مالی و تسویه‌حساب و واحد بازرگانی دست‌اول.
          </p>
        </div>

        <button
          onClick={() => setIsNewTicketModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus size={16} />
          <span>ثبت تیکت جدید</span>
        </button>
      </div>

      {/* Tickets Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Sidebar: Ticket List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-black text-slate-700 px-1">تیکت‌های شما ({tickets.length}):</div>

          {tickets.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-8 text-center text-xs text-slate-400 font-medium border border-slate-100">
              تیکتی ثبت نشده است
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {tickets.map((t) => {
                const isActive = t.id === activeTicketId;
                const priorityInfo = PRIORITY_LABELS[t.priority] || PRIORITY_LABELS.medium;

                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTicketId(t.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isActive 
                        ? "bg-indigo-50/80 border-indigo-300 shadow-2xs" 
                        : "bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-mono font-bold text-indigo-700">{t.ticketNumber}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${priorityInfo.color}`}>
                        {priorityInfo.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 line-clamp-1">{t.subject}</h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/50">
                      <span>{DEPARTMENT_LABELS[t.department]}</span>
                      <span>
                        {t.status === 'answered' ? '🟢 پاسخ داده شد' : t.status === 'in_progress' ? '🟡 در حال بررسی' : '⚪ باز'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Active Ticket Thread */}
        <div className="lg:col-span-2 bg-slate-50 rounded-3xl p-5 border border-slate-200 flex flex-col justify-between min-h-[450px]">
          {activeTicket ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Active Ticket Header */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {activeTicket.ticketNumber}
                    </span>
                    <h4 className="text-xs font-black text-slate-900">{activeTicket.subject}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{activeTicket.createdAt}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  دپارتمان: <strong>{DEPARTMENT_LABELS[activeTicket.department]}</strong>
                </div>
              </div>

              {/* Chat / Messages Thread */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] p-2">
                {activeTicket.messages.map((msg) => {
                  const isFactory = msg.sender === 'factory';
                  return (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${isFactory ? "items-start" : "items-end"}`}
                    >
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs space-y-1 shadow-2xs ${
                        isFactory 
                          ? "bg-white text-slate-900 border border-slate-200 rounded-br-xs" 
                          : "bg-indigo-600 text-white rounded-bl-xs"
                      }`}>
                        <div className="flex items-center justify-between gap-4 text-[10px] font-bold opacity-75">
                          <span>{msg.senderName}</span>
                          <span className="font-mono">{msg.date}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ یا توضیح تکمیلی خود را بنویسید..."
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:border-indigo-600"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                >
                  <Send size={14} />
                  <span>ارسال</span>
                </button>
              </form>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl">
                💬
              </div>
              <h4 className="text-xs font-black text-slate-700">یک تیکت را جهت مشاهده پیام‌ها انتخاب فرمایید</h4>
              <p className="text-[11px] text-slate-400">یا با فشردن دکمه «ثبت تیکت جدید» درخواست تازه‌ای ارسال کنید.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal: New Ticket */}
      <AnimatePresence>
        {isNewTicketModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Plus size={20} className="text-indigo-600" />
                  <h4 className="text-sm font-black text-slate-900">ثبت تیکت و درخواست جدید کارخانه</h4>
                </div>
                <button
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">موضوع تیکت:</label>
                  <input
                    type="text"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="مثال: هماهنگی تاریخ بارگیری سفارش #DX-38910"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">دپارتمان مربوطه:</label>
                    <select
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="logistics">ناوگان ترابری و بارگیری</option>
                      <option value="commercial">واحد بازرگانی و قراردادها</option>
                      <option value="finance">امور مالی و تسویه‌حساب</option>
                      <option value="audit">ممیزی کالا و سیب سلامت</option>
                      <option value="general">پشتیبانی عمومی</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-800 block">اولویت:</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      <option value="low">عادی</option>
                      <option value="medium">متوسط</option>
                      <option value="high">مهم</option>
                      <option value="urgent">فوری / آنی</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 block">شرح درخواست و پیام:</label>
                  <textarea
                    rows={4}
                    required
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="شرح کامل درخواست، شماره سفارش یا مشخصات مورد نظر..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-600 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsNewTicketModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-black cursor-pointer"
                  >
                    انصراف
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check size={16} />
                    <span>ارسال تیکت به واحد مربوطه</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
