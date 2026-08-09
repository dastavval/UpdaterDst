import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Package, Truck, Printer, X, ArrowRight } from 'lucide-react';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  amount: number;
  onPrintInvoice?: () => void;
}

export default function OrderSuccessModal({ isOpen, onClose, trackingNumber, amount, onPrintInvoice }: OrderSuccessModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir="rtl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-white/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden text-right"
          >
            {/* Header / Banner */}
            <div className="bg-emerald-600 p-8 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-full -ml-12 -mb-12 blur-xl" />
              
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-700/20"
              >
                <CheckCircle2 size={40} className="text-emerald-600" />
              </motion.div>
              
              <h2 className="text-2xl font-black mb-1">سفارش با موفقیت ثبت شد!</h2>
              <p className="text-emerald-100 text-xs font-bold opacity-90">در حال پردازش و آماده‌سازی جهت بارگیری از کارخانه</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Order Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">کد رهگیری بارنامه</span>
                  <span className="text-lg font-black text-slate-800 font-mono">{trackingNumber}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">مبلغ نهایی فاکتور</span>
                  <span className="text-lg font-black text-emerald-600 font-mono">
                    {amount.toLocaleString()} <span className="text-[10px] font-normal">تومان</span>
                  </span>
                </div>
              </div>

              {/* Status Timeline Placeholder */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-200">
                    <Package size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black text-slate-800">تایید نهایی و صدور حواله</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">در انتظار تایید حسابداری و صدور حواله خروج از انبار</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 opacity-40">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200">
                    <Truck size={16} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-black text-slate-800">بارگیری و اعزام خودرو</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">بارگیری محصولات و پلمپ تریلر حمل بار کشوری</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                <p className="text-[11px] text-blue-800 leading-relaxed font-bold text-center">
                  💡 پیش‌فاکتور مستقیم شما صادر گردیده و در پنل کاربری قابل استعلام و بارگیری است. در صورت تمایل کارخانه، فاکتور رسمی نیز صادر و همراه بار فیزیکی ارسال خواهد شد.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={onClose}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <ArrowRight size={16} />
                  بازگشت به بازارگاه
                </button>
                <button 
                  onClick={() => {
                    if (onPrintInvoice) {
                      onPrintInvoice();
                    } else {
                      window.print();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Printer size={16} className="text-emerald-600" />
                  مشاهده و دانلود فاکتور کارخانه
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
