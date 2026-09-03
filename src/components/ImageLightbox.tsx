import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Eye, Building2 } from "lucide-react";

interface ImageLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  subtitle?: string;
  footerRight?: string;
}

export default function ImageLightbox({ 
  isOpen, 
  onClose, 
  imageUrl, 
  title, 
  subtitle, 
  footerRight 
}: ImageLightboxProps) {
  if (!isOpen || !imageUrl) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
        dir="rtl"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-3xl p-5 max-w-2xl w-full shadow-2xl relative border border-slate-200 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3 text-right">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                <Eye size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{title || "پیش‌نمایش تصویر"}</h3>
                {subtitle && <p className="text-[10px] text-slate-500 font-bold">{subtitle}</p>}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="w-full aspect-square bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-slate-100 overflow-hidden shadow-inner">
            <img 
              src={imageUrl} 
              alt={title || "Full view"} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-emerald-600" />
              <span>سامانه دست‌اول</span>
            </div>
            {footerRight && (
              <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-black">
                {footerRight}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
