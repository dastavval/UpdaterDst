import React from "react";
import { Product } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import { motion, AnimatePresence } from "motion/react";
import { X, Scale, Check, Minus, Package } from "lucide-react";

interface ProductComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  theme: "light" | "dark" | "classic";
}

export default function ProductComparison({ isOpen, onClose, products, theme }: ProductComparisonProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-50/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden ${
            theme === "dark" ? "bg-white border border-slate-800" : "bg-white border border-slate-100"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Scale size={20} />
              </div>
              <div>
                <h2 className={`text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                  مقایسه تخصصی محصولات
                </h2>
                <p className="text-[10px] font-bold text-slate-400">تحلیل فنی و قیمتی کالاهای منتخب جهت تصمیم‌گیری بنکداری</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <div className="p-6 overflow-x-auto">
            {products.length === 0 ? (
              <div className="py-20 text-center">
                <Scale size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-sm font-black text-slate-400">محصولی برای مقایسه انتخاب نشده است.</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">ویژگی فنی</th>
                    {products.map((p, idx) => (
                      <th key={`cmp-head-${p.id || idx}-${idx}`} className="p-4 min-w-[220px]">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-24 h-24 bg-slate-100/80 rounded-3xl p-2 flex flex-col items-center justify-center overflow-hidden">
                            {p.image_url ? (
                              <img 
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                                src={getDisplayImageUrl(p.image_url)} 
                                alt={p.name} 
                                className="w-full h-full object-contain" 
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-slate-400">
                                <Package size={28} className="stroke-[1.5]" />
                                <span className="text-[9px] font-black">بدون تصویر</span>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <h3 className={`text-xs font-black ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{p.name}</h3>
                            <span className="text-[10px] text-slate-400 font-bold">{p.brand}</span>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`text-xs ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                  <tr className="border-t border-slate-100">
                    <td className="p-4 font-black">قیمت مصرف‌کننده (تومان)</td>
                    {products.map((p, idx) => (
                      <td key={`cmp-cons-price-${p.id || idx}-${idx}`} className="p-4 text-center font-bold">{(p.consumer_price || 0).toLocaleString('fa-IR')}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-100 bg-slate-50/50">
                    <td className="p-4 font-black">قیمت بنکداری / واحد (تومان)</td>
                    {products.map((p, idx) => (
                      <td key={`cmp-bulk-price-${p.id || idx}-${idx}`} className="p-4 text-center font-black text-emerald-600">{(p.bulk_price).toLocaleString('fa-IR')}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-4 font-black">حاشیه سود داروخانه / مغازه</td>
                    {products.map((p, idx) => {
                      const margin = p.consumer_price ? Math.round(((p.consumer_price - p.bulk_price) / p.consumer_price) * 100) : 0;
                      return (
                        <td key={`cmp-margin-${p.id || idx}-${idx}`} className="p-4 text-center">
                          <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-black text-[10px]">
                            {margin}% سود خالص
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-4 font-black">تعداد در کارتن</td>
                    {products.map((p, idx) => (
                      <td key={`cmp-pack-count-${p.id || idx}-${idx}`} className="p-4 text-center font-bold">{p.carton_pack_count} {p.unit}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-4 font-black">حداقل سفارش (کارتن)</td>
                    {products.map((p, idx) => (
                      <td key={`cmp-min-order-${p.id || idx}-${idx}`} className="p-4 text-center font-bold text-amber-600">{Math.max(5, p.min_order_cartons || 5)}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-4 font-black">زمان تامین (روز کاری)</td>
                    {products.map((p, idx) => (
                      <td key={`cmp-lead-time-${p.id || idx}-${idx}`} className="p-4 text-center font-bold">
                        {p.production_lead_time_days <= 2 ? 'فوری' : `${p.production_lead_time_days} روز`}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-slate-100">
                    <td className="p-4 font-black">ارسال مستقیم کارخانه</td>
                    {products.map((p, idx) => (
                      <td key={`cmp-direct-send-${p.id || idx}-${idx}`} className="p-4 text-center">
                        <div className="flex justify-center">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Check size={14} />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-2.5 rounded-2xl text-xs font-black text-slate-500 hover transition-all">
              انصراف
            </button>
            <button 
              onClick={() => window.print()}
              className="px-8 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>چاپ کاتالوگ مقایسه‌ای (PDF)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
