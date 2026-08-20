import { motion } from "motion/react";
import { Phone } from "lucide-react";

interface AIAdvisorProps {
  mascotUrl?: string; // Kept to prevent TypeScript prop mismatch in App.tsx
}

export default function AIAdvisor({ mascotUrl }: AIAdvisorProps) {
  const supportPhone = "09999123001";

  const handleCall = () => {
    window.location.href = `tel:${supportPhone}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none mb-20 lg:mb-0" dir="rtl">
      {/* Floating Call Button with Soft Pulse Animation */}
      <div className="relative pointer-events-auto">
        <span className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping z-0" />
        <button
          onClick={handleCall}
          className="relative z-10 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group border-4 border-white"
          title="تماس مستقیم با پشتیبانی دست اول"
        >
          <Phone size={24} className="text-white animate-pulse" />
        </button>

        {/* Floating Tooltip Label */}
        <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-white text-slate-800 text-[10px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap shadow-md border border-slate-100 hidden sm:flex items-center gap-1.5 pointer-events-none">
          <Phone size={12} className="text-emerald-600" />
          <span>تماس با پشتیبانی: {supportPhone}</span>
        </div>
      </div>
    </div>
  );
}
