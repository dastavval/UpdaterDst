import React, { useState } from "react";
import { 
  ShoppingCart, 
  Truck, 
  Zap, 
  Calculator, 
  Sparkles, 
  PhoneCall, 
  ChevronUp, 
  ChevronDown, 
  FileText,
  Building2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface B2BFloatingActionBarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenQuickOrder: () => void;
  onOpenLogistics: () => void;
  onOpenProfitSimulator: () => void;
  onOpenLoyalty: () => void;
  loyaltyPoints?: number;
  supportPhone?: string;
}

export default function B2BFloatingActionBar({
  cartCount,
  onOpenCart,
  onOpenQuickOrder,
  onOpenLogistics,
  onOpenProfitSimulator,
  onOpenLoyalty,
  loyaltyPoints = 0,
  supportPhone = "02191000000"
}: B2BFloatingActionBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[95vw] px-2">
      <AnimatePresence>
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 flex items-center gap-1.5 sm:gap-2 text-white"
          >
            {/* Quick Bulk Order Matrix */}
            <button
              onClick={onOpenQuickOrder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-amber-700 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 whitespace-nowrap"
              title="ثبت سریع سفارش ردیفی عمده"
            >
              <Zap size={15} className="fill-slate-950" />
              <span className="hidden sm:inline">سفارش سریع</span>
              <span className="sm:hidden">سفارش</span>
            </button>

            {/* Logistics Freight Estimator */}
            <button
              onClick={onOpenLogistics}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-xs border border-emerald-500/30 transition-all active:scale-95 whitespace-nowrap"
              title="استعلام کرایه باربری و لجستیک سراسری"
            >
              <Truck size={15} className="text-indigo-400" />
              <span className="hidden md:inline">استعلام باربری</span>
              <span className="md:hidden">باربری</span>
            </button>

            {/* Profit Margin Simulator */}
            <button
              onClick={onOpenProfitSimulator}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all active:scale-95 whitespace-nowrap"
              title="محاسبه‌گر سود بنکداری و حاشیه سود"
            >
              <Calculator size={15} className="text-emerald-400" />
              <span>محاسبه سود</span>
            </button>

            {/* Loyalty & Rewards */}
            <button
              onClick={onOpenLoyalty}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-amber-300 font-bold text-xs border border-emerald-500/30 transition-all active:scale-95 whitespace-nowrap"
              title="باشگاه مشتریان و امتیازات خرید"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span className="hidden sm:inline font-sans">{loyaltyPoints > 0 ? `${loyaltyPoints.toLocaleString('fa-IR')} امتیاز` : 'باشگاه پاداش'}</span>
            </button>

            {/* Cart & Proforma Invoice */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md active:scale-95 whitespace-nowrap"
              title="مشاهده پیش‌فاکتور رسمی و سبد خرید"
            >
              <ShoppingCart size={15} />
              <span className="hidden sm:inline">پیش‌فاکتور</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white font-sans text-[11px] font-black flex items-center justify-center border-2 border-slate-900 animate-bounce">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Fast Phone Support */}
            <a
              href={`tel:${supportPhone}`}
              className="w-8 h-8 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-colors"
              title={`تماس مستقیم با واحد فروش کارخانه: ${supportPhone}`}
            >
              <PhoneCall size={14} />
            </a>

            {/* Collapse toggle */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors mr-1"
              title="بستن نوار ابزار"
            >
              <ChevronDown size={16} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setIsCollapsed(false)}
            className="bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs font-bold hover:bg-slate-800 transition-all"
          >
            <Zap size={14} className="text-amber-400" />
            <span>نوار ابزار معاملات عمده</span>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <ChevronUp size={14} className="text-slate-400 mr-1" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
