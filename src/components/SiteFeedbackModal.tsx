import React, { useState } from "react";
import { X, Lightbulb, Bug, MessageSquare, Send, CheckCircle2 } from "lucide-react";

interface SiteFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPhone?: string;
}

export default function SiteFeedbackModal({ isOpen, onClose, userPhone }: SiteFeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<"idea" | "bug" | "other">("idea");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState(userPhone || "");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newFeedback = {
      type: feedbackType,
      description,
      contactInfo,
      date: new Date().toLocaleString("fa-IR"),
      status: "بررسی نشده"
    };

    try {
      const existing = JSON.parse(localStorage.getItem("dastavval_site_feedback") || "[]");
      localStorage.setItem("dastavval_site_feedback", JSON.stringify([newFeedback, ...existing]));
    } catch (err) {
      console.error(err);
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDescription("");
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-black text-slate-900">گزارش یا ایده شما با موفقیت ثبت شد</h3>
            <p className="text-xs text-slate-600 font-bold max-w-sm mx-auto">
              از مشارکت شما در بهبود پلتفرم دست اول سپاسگزاریم. نظرات شما به صورت مستقیم به تیم مهندسی و مدیریت ارشد ارسال گردید.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                <Lightbulb size={20} />
              </div>
              <div className="text-right">
                <h3 className="text-base font-black text-slate-900">ارسال ایده، پیشنهاد یا گزارش اشکال سایت 💡</h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">هرگونه نظر، ایده نوآورانه یا باگ در استفاده از سایت را با ما در میان بگذارید.</p>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <label className="text-xs font-black text-slate-700">نوع بازخورد شما:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackType("idea")}
                  className={`p-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    feedbackType === "idea"
                      ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Lightbulb size={15} />
                  <span>ایده و پیشنهاد</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType("bug")}
                  className={`p-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    feedbackType === "bug"
                      ? "bg-rose-600 text-white border-rose-700 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Bug size={15} />
                  <span>گزارش اشکال / باگ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType("other")}
                  className={`p-2.5 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    feedbackType === "other"
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <MessageSquare size={15} />
                  <span>سایر نظرات</span>
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-black text-slate-700">شرح ایده یا اشکال مشاهده شده:</label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="متن کامل ایده، پیشنهاد یا جزئیات باگ و نحوه رخ دادن آن را بنویسید..."
                className="w-full p-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold text-slate-800 outline-none resize-none"
              />
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-xs font-black text-slate-700">شماره تماس یا ایمیل (اختیاری جهت پیگیری):</label>
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                placeholder="مثال: 09123456789"
                className="w-full p-3 rounded-2xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Send size={15} />
                <span>ارسال گزارش به تیم فنی</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
