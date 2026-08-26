import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Package, Truck, Printer, X, ArrowRight, Sparkles, UserCheck, ExternalLink, Copy, Check } from 'lucide-react';
import { generateInvoiceUrl } from '../lib/invoice-url-helper';

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackingNumber: string;
  amount: number;
  onPrintInvoice?: () => void;
  autoCreatedAccount?: { username: string; password: string } | null;
}

export default function OrderSuccessModal({ isOpen, onClose, trackingNumber, amount, onPrintInvoice, autoCreatedAccount }: OrderSuccessModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = () => {
    const url = generateInvoiceUrl(trackingNumber);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

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
            className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden text-right max-h-[92vh] overflow-y-auto"
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

              {/* Direct English Invoice Preview Link Box */}
              <div className="bg-white text-slate-800 p-4 rounded-2xl space-y-3 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-black flex items-center gap-1.5">
                    <span>🧾</span>
                    <span>لینک آنلاین پیش‌فاکتور:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onPrintInvoice) {
                        onPrintInvoice();
                      }
                    }}
                    className="text-xs font-black text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>👁️ مشاهده آنی پیش‌فاکتور</span>
                    <ExternalLink size={13} />
                  </button>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-800 dir-ltr overflow-hidden">
                  <span className="truncate pr-2">{generateInvoiceUrl(trackingNumber)}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-[11px] font-sans font-bold bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg shrink-0 border border-slate-300 cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    {copiedLink ? (
                      <>
                        <Check size={12} className="text-emerald-600" />
                        <span className="text-emerald-700">کپی شد</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} className="text-slate-500" />
                        <span>کپی لینک</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <p className="text-xs text-slate-700 leading-relaxed font-bold text-center">
                  💡 پیش‌فاکتور مستقیم شما صادر گردیده و در پنل کاربری قابل استعلام، چاپ و دانلود می‌باشد. همراه بار فیزیکی نیز فاکتور معتبر ارسال خواهد شد.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button 
                  onClick={onClose}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <ArrowRight size={16} />
                  <span>🏪 بازگشت به بازارگاه</span>
                </button>
                <button 
                  onClick={() => {
                    if (onPrintInvoice) {
                      onPrintInvoice();
                    } else {
                      window.print();
                    }
                  }}
                  className="flex-1 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Printer size={16} className="text-emerald-600" />
                  <span>📄 مشاهده و دانلود پیش‌فاکتور</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
