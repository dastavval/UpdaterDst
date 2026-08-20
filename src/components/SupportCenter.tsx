import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Headphones, Smartphone, Phone, Send, MessageSquare, HelpCircle, 
  ChevronDown, CheckCircle2, AlertCircle, Mail, MapPin, Clock, ArrowRight 
} from "lucide-react";
import { db } from "../lib/firebase";
import { collection, addDoc } from "../lib/firebase-mock";

interface FAQItem {
  question: string;
  answer: string;
  category: "purchase" | "logistics" | "invoice" | "guarantee";
}

const FAQ_DATA: FAQItem[] = [
  {
    question: "روند خرید مستقیم از کارخانه به چه صورت است؟",
    answer: "بنکداران گرامی می‌توانند پس از ثبت‌نام و بررسی کاتالوگ محصولات، اقلام مورد نیاز خود را بر اساس کارتن یا پالت به سبد خرید اضافه کنند. پس از ثبت سفارش، پیش‌فاکتور مستقیم کارخانه صادر شده و بار به صورت مستقیم از خط تولید با هماهنگی به مقصد ارسال می‌گردد.",
    category: "purchase"
  },
  {
    question: "حداقل میزان سفارش برای دریافت قیمت کارخانه چقدر است؟",
    answer: "برای حفظ مزیت رقابتی و ترانزیت به‌صرفه، حداقل سفارش ثبت شده در سیستم ۵ کارتن یا حداقل مبلغ ۱۰ میلیون تومان است. سفارشات پالت یا خودروی کامل باربری از تخفیف‌های ویژه تیراژ و تسهیلات ترانزیت برخوردار خواهند شد.",
    category: "purchase"
  },
  {
    question: "آیا برای تمامی خریدها فاکتور رسمی صادر می‌شود؟",
    answer: "صدور فاکتور رسمی بستگی به ضوابط کارخانه انتخابی دارد. اکثر کارخانجات طرف قرارداد امکان صدور فاکتور رسمی قانونی همراه با کد شناسه کالا را دارا هستند و برخی نیز فاکتور مستقیم تولیدی صادر می‌کنند. این جزئیات در برگه مشخصات هر کارخانه و پیش از نهایی‌سازی سفارش قابل مشاهده و هماهنگی است.",
    category: "invoice"
  },
  {
    question: "سیستم تسویه امن و صندوق امانی دست اول چگونه کار می‌کند؟",
    answer: "جهت تضمین امنیت طرفین، مبالغ پرداختی بنکدار مستقیماً به حساب کارخانه واریز نمی‌شود بلکه در حساب امانی دست اول به صورت معلق نگهداری می‌شود. تنها پس از تحویل کامل، سالم و مطابقت بار در انبار مقصد و تایید انباردار، وجه آزاد خواهد شد.",
    category: "guarantee"
  },
  {
    question: "زمان تحویل و شیوه‌های لجستیک جاده‌ای به چه صورت است؟",
    answer: "حمل و نقل کالاها با همکاری شبکه لجستیک ترانزیت مسقف و بیمه تمام‌خطر جاده‌ای انجام می‌شود. به طور متوسط بارگیری بین ۲۴ الی ۴۸ ساعت پس از نهایی شدن پیش‌فاکتور انجام شده و ارسال به تمام نقاط کشور ظرف حداکثر ۳ روز کاری صورت می‌گیرد.",
    category: "logistics"
  },
  {
    question: "در صورت وجود مغایرت یا آسیب‌دیدگی بار چه اقدامی باید انجام داد؟",
    answer: "هنگام تخلیه بار، در صورت مشاهده هرگونه مغایرت تعدادی یا آسیب به کارتن‌ها، فورا مراتب را در بخش «تیکت‌های باربری» پورتال خود ثبت کرده و یا با پشتیبانی تماس بگیرید. وجه تا رفع کامل مغایرت و رضایت شما در صندوق امانی قفل خواهد ماند.",
    category: "guarantee"
  }
];

export default function SupportCenter({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>("all");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  // Ticket Form States
  const [ticketName, setTicketName] = useState("");
  const [ticketPhone, setTicketPhone] = useState("");
  const [ticketCategory, setTicketCategory] = useState("ثبت شکایت رسمی و پیگیری حقوقی");
  const [ticketMessage, setTicketMessage] = useState("");
  const [formError, setFormError] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [ticketId, setTicketId] = useState("");

  const contactOptions = [
    {
      label: "تلفن همراه پشتیبانی",
      value: "۰۹۹۹ ۹۱۲ ۳۰۰۱",
      href: "tel:09999123001",
      icon: <Smartphone className="text-emerald-600" size={18} />,
      bgColor: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "خط مستقیم دفتر تهران",
      value: "۰۲۱ ۸۸۴۵ ۳۰۰۰",
      href: "tel:02188453000",
      icon: <Phone className="text-emerald-600" size={18} />,
      bgColor: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "پشتیبانی فوری تلگرام",
      value: "dastavval_support@",
      href: "https://t.me/dastavval_support",
      icon: <Send className="text-sky-500 rotate-180" size={18} />,
      bgColor: "bg-sky-50 text-sky-600",
    },
    {
      label: "پشتیبانی شبانه‌روزی واتساپ",
      value: "۰۹۰۴ ۴۵۰ ۲۹۰۰",
      href: "https://wa.me/989044502900",
      icon: <MessageSquare className="text-green-650" size={18} />,
      bgColor: "bg-green-50 text-green-700",
    },
  ];

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!ticketName.trim() || !ticketPhone.trim() || !ticketMessage.trim()) {
      setFormError("لطفاً تمامی فیلدهای الزامی (نام، شماره تماس و متن درخواست) را به طور کامل وارد نمایید.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const docRef = await addDoc(collection(db, "tickets"), {
        name: ticketName,
        phone: ticketPhone,
        category: ticketCategory,
        message: ticketMessage,
        status: "open",
        createdAt: new Date().toISOString(),
        source: "support_form"
      });

      setTicketId(docRef.id.substring(0, 8).toUpperCase());
      setSubmitStatus('success');
      setFormError("");
      // Reset form
      setTicketName("");
      setTicketPhone("");
      setTicketMessage("");
    } catch (error) {
      console.error("Error creating support ticket:", error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFaqs = activeFaqCategory === "all" 
    ? FAQ_DATA 
    : FAQ_DATA.filter(item => item.category === activeFaqCategory);

  return (
    <div className="space-y-10 py-4 text-right" dir="rtl">
      {/* Banner / Hero Section */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 border border-indigo-800/30 p-6 sm:p-10 overflow-hidden shadow-2xl text-white">
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-550/30 border border-indigo-500/35 px-4 py-1.5 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-wider">
              <Headphones size={14} className="animate-pulse" />
              مرکز پشتیبانی مرکزی و امور مشترکان
            </div>

            <h1 className="text-2xl sm:text-3xl font-black leading-tight">
              همواره در کنار شما؛ <br />
              پاسخگویی سریع و <span className="text-amber-400">تضمین امنیت</span> معاملات
            </h1>

            <p className="text-slate-355 text-xs sm:text-sm font-bold leading-relaxed">
              کارشناسان پلتفرم دست اول به صورت ۲۴ ساعته جهت تسهیل روند خرید کارخانه‌ای، پیگیری مکاتبات مالی و صادر شدن پلمپ باربری در خدمت شما هستند.
            </p>
          </div>
          
          <div className="hidden md:flex justify-center shrink-0">
            <span className="text-[6.5rem] select-none filter drop-shadow-lg">📞</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Contacts & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Right side: Quick Call & Channels (Col: 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-[2rem] p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900">راه‌های ارتباطی و پاسخگویی فوری</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">جهت تماس سریع، روی دکمه‌های زیر ضربه بزنید</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {contactOptions.map((opt, idx) => (
                <a
                  key={`sup-contact-${opt.href || idx}-${idx}`}
                  href={opt.href}
                  target={opt.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-500/30 hover:bg-slate-100/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${opt.bgColor} shrink-0 shadow-inner`}>
                      {opt.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-700 leading-tight group-hover:text-emerald-700 transition-colors">
                        {opt.label}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 tracking-wide">
                        {opt.value}
                      </p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-xs text-slate-400 font-black group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    🡠
                  </div>
                </a>
              ))}
            </div>

            {/* Support details / hours */}
            <div className="pt-4 border-t border-slate-100 space-y-3 text-[11px] text-slate-500 font-bold">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-indigo-600 shrink-0" />
                <span>ساعات پاسخگویی تلفنی: همه‌روزه از ۸:۰۰ الی ۲۲:۰۰</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-indigo-600 shrink-0" />
                <span>تهران، خیابان ولیعصر، برج بازرگانی صنایع غذایی کشور، طبقه ۱۲</span>
              </div>
            </div>
          </div>
        </div>

        {/* Left side: Interactive Ticket Submission (Col: 7) */}
        <div className="lg:col-span-7">
          <div className="bg-white/85 backdrop-blur-xl border border-slate-200/80 rounded-[2rem] p-6 sm:p-8 shadow-xl">
            <div>
              <h3 className="text-sm font-black text-slate-900">ارسال تیکت پشتیبانی و استعلام رسمی</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">مشکل یا درخواست خود را بنویسید؛ واحد مربوطه به زودی با شما تماس خواهد گرفت.</p>
            </div>

            <form onSubmit={handleTicketSubmit} className="mt-6 space-y-4">
              <AnimatePresence mode="wait">
                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-800 text-xs font-bold space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>تیکت پشتیبانی شما با موفقیت در سامانه ثبت گردید.</span>
                    </div>
                    <p className="text-[10px] text-emerald-700/90 leading-relaxed">
                      کد پیگیری تیکت شما: <strong className="text-emerald-900 select-all font-mono">{ticketId}</strong> است. کارشناسان ما حداکثر تا ۲ ساعت کاری با شما تماس برقرار خواهند کرد.
                    </p>
                  </motion.div>
                )}

                {submitStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2"
                  >
                    <AlertCircle size={16} className="text-rose-600 shrink-0" />
                    <span>خطا در ارسال تیکت! لطفاً اتصال اینترنت خود را چک کرده و مجدداً تلاش کنید.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400">نام و نام خانوادگی / شرکت:</label>
                  <input
                    type="text"
                    required
                    value={ticketName}
                    onChange={(e) => setTicketName(e.target.value)}
                    placeholder="مثال: بازرگانی محمدی"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400">شماره تلفن تماس:</label>
                  <input
                    type="tel"
                    required
                    value={ticketPhone}
                    onChange={(e) => setTicketPhone(e.target.value)}
                    placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400">دپارتمان و موضوع تیکت:</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all text-right cursor-pointer"
                >
                  <option value="مالی و فاکتور رسمی">بخش مالی، ارزش افزوده و صادر شدن فاکتور رسمی</option>
                  <option value="لجستیک و حمل و نقل">بخش لجستیک، رانندگان و زمان ارسال باربری</option>
                  <option value="تضمین بار و کیفیت">بخش کیفیت محصولات و تایید انباردار مقصد</option>
                  <option value="همکاری با کارخانجات">بخش درخواست همکاری، تامین و تهاتر کارخانه</option>
                  <option value="سایر موارد">پشتیبانی متفرقه و عمومی پلتفرم</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400">متن کامل درخواست یا مشکل:</label>
                <textarea
                  required
                  rows={4}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="مشکل خود یا مشخصات بار درخواستی را به همراه جزییات بنویسید..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-right resize-none"
                />
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[11px] font-black leading-relaxed">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "در حال ثبت اطلاعات..." : "ارسال نهایی تیکت به واحد پشتیبانی"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* FAQs Accordion */}
      <section className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-[2.5rem] p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full text-[10px] font-black text-rose-600">
              <HelpCircle size={14} />
              سوالات متداول کاربران پلتفرم
            </div>
            <h3 className="text-base font-black text-slate-900">راهنمای قدم به قدم و سوالات متداول بنکداران</h3>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
            {[
              { id: "all", label: "همه سوالات" },
              { id: "purchase", label: "ثبت سفارش و خرید" },
              { id: "invoice", label: "فاکتور رسمی و صدور بارنامه" },
              { id: "guarantee", label: "صندوق امانی و کیفیت" },
              { id: "logistics", label: "لجستیک و حمل و نقل" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveFaqCategory(cat.id);
                  setOpenFaqIndex(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all shrink-0 cursor-pointer ${
                  activeFaqCategory === cat.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={`sup-faq-item-${faq.id || index}-${index}`}
                className="border border-slate-100 rounded-2xl overflow-hidden transition-all duration-350 bg-slate-50/50"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 font-black text-xs text-slate-800 hover:bg-slate-150/40 text-right cursor-pointer"
                >
                  <span className="leading-relaxed">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 ml-2 text-indigo-650"
                  >
                    <ChevronDown size={16} />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden bg-white border-t border-slate-100"
                    >
                      <p className="p-4 text-[11px] text-slate-600 font-bold leading-relaxed">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
