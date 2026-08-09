import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, MessageSquare, Send, X, Smartphone, Headphones } from "lucide-react";

export default function FloatingSupport() {
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    {
      id: "mobile",
      label: "تلفن همراه",
      value: "۰۹۹۹۹۱۲۳۰۰۱",
      href: "tel:09999123001",
      icon: <Smartphone className="text-emerald-600" size={16} />,
      bgColor: "bg-emerald-50",
    },
    {
      id: "landline",
      label: "تلفن ثابت",
      value: "۰۴۱۴۷۸۲۲۰۰۰",
      href: "tel:04147822000",
      icon: <Phone className="text-emerald-600" size={16} />,
      bgColor: "bg-emerald-50",
    },
    {
      id: "telegram",
      label: "پشتیبانی تلگرام",
      value: "@dastavval_support",
      href: "https://t.me/dastavval_support",
      icon: <Send className="text-sky-500 rotate-180" size={16} />,
      bgColor: "bg-sky-50",
    },
    {
      id: "whatsapp",
      label: "پشتیبانی واتساپ",
      value: "۰۹۰۴۴۵۰۲۹۰۰",
      href: "https://wa.me/989044502900",
      icon: <MessageSquare className="text-green-600" size={16} />,
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="fixed bottom-28 lg:bottom-28 right-4 lg:right-6 z-[9999] flex flex-col items-end font-sans" dir="rtl">
      {/* Expanded Support Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mb-4 w-72 bg-white/95 backdrop-blur-md rounded-[2rem] shadow-2xl border border-emerald-500/10 p-4 space-y-2.5 ring-1 ring-black/5"
          >
            {contactOptions.map((opt) => (
              <a
                key={opt.id}
                href={opt.href}
                target={opt.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl hover transition-all border border-transparent hover"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${opt.bgColor} shrink-0 shadow-inner`}>
                    {opt.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black text-slate-800 leading-tight">
                      {opt.label}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wide">
                      {opt.value}
                    </p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                  🡠
                </div>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping z-0" />
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover transition-all transform active:scale-95 cursor-pointer ring-4 ring-white"
        >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={24} className="font-black" />
            </motion.div>
          ) : (
            <motion.div
              key="support"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              <Headphones size={24} className="animate-pulse text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      </div>
    </div>
  );
}
