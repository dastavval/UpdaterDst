import React from "react";
import { Product } from "../types";
import { Plus, Minus, Sparkles, Building2, MapPin, Package, Star, TrendingUp, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

interface PremiumProductCardProps {
  product: Product;
  qty: number;
  onIncrement: (id: string, min: number) => void;
  onDecrement: (id: string, min: number) => void;
  onAddToCart: (product: Product, qty: number) => void;
  onViewDetails?: (product: Product) => void;
  toPersianNum: (num: any) => string;
  interfaceMode?: 'simple' | 'advanced';
}

export const PremiumProductCard: React.FC<PremiumProductCardProps> = ({
  product,
  qty,
  onIncrement,
  onDecrement,
  onAddToCart,
  onViewDetails,
  toPersianNum,
  interfaceMode = 'advanced'
}) => {
  const consumerPrice = product.consumer_price || product.price || 0;
  const profitMargin = consumerPrice > 0 
    ? Math.round(((consumerPrice - product.bulk_price) / consumerPrice) * 100) 
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -8 }}
      className="group relative bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col h-full"
    >
      {/* Top Badge Overlay */}
      <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2">
          {product.isFavorite && (
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg text-amber-500 flex items-center gap-1.5 border border-amber-100">
              <Sparkles size={12} fill="currentColor" />
              <span className="text-[10px] font-black">منتخب بازرگانان</span>
            </div>
          )}
          {(product.isFeatured || product.badge === "ویژه") && (
            <div className="bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg text-[9px] font-black tracking-widest uppercase">
              PREMIUM
            </div>
          )}
        </div>
        <div className="bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg text-[10px] font-black flex items-center gap-1">
          <ShieldCheck size={12} />
          <span>اصالت تضمین شده</span>
        </div>
      </div>

      {/* Image Section */}
      <div className="aspect-square relative overflow-hidden bg-slate-50 group-hover:bg-emerald-50/50 transition-colors duration-500">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-full object-contain p-6 group-hover:scale-108 transition-transform duration-700 ease-out"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        
        {/* Quick Action Overlay */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
          <button 
            onClick={() => onViewDetails?.(product)}
            className="w-full py-3 bg-white text-slate-900 rounded-2xl text-[11px] font-black shadow-2xl hover:bg-emerald-50 transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 cursor-pointer"
          >
            مشاهده کاتالوگ و آنالیز حاشیه سود
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col gap-4 text-right">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px]">
            <Building2 size={12} />
            <span>{product.brand}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span>{product.category}</span>
          </div>
          <h4 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h4>
        </div>

        {/* Pricing Royal Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">قیمت واحد (ویژه همکار):</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 tracking-tighter">{toPersianNum(product.bulk_price.toLocaleString())}</span>
                <span className="text-[10px] font-bold text-slate-500">تومان</span>
              </div>
            </div>
            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-[9px] text-emerald-600 font-black block leading-none mb-1">سود خالص</span>
              <span className="text-sm font-black text-emerald-700 leading-none">٪{toPersianNum(profitMargin)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50 text-[10px] text-slate-500 font-bold">
            <TrendingUp size={12} className="text-indigo-500" />
            <span>ارزش مصرف‌کننده: {toPersianNum(consumerPrice.toLocaleString())} تومان</span>
          </div>
        </div>

        {/* Logistics Detail */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">
          <Package size={14} className="text-indigo-400" />
          <span>{toPersianNum(product.carton_pack_count)} {product.unit} در کارتن</span>
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-auto" />
          <MapPin size={14} className="text-indigo-400" />
          <span>{product.shipping_origin || "کارخانه مرکزی"}</span>
        </div>

        {/* Advanced B2B Telemetry */}
        {interfaceMode === 'advanced' && (
          <div className="grid grid-cols-2 gap-2 text-[10px] bg-gradient-to-r from-purple-500/5 to-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10 text-slate-600 font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-purple-600">⚡</span>
              <span>ظرفیت خط: {toPersianNum((product as any).production_capacity || "۱۵,۰۰۰")} کارتن</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-indigo-600">🛡️</span>
              <span>تحویل لجستیک: {toPersianNum((product as any).lead_time_hours || "۳۶")} ساعت</span>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-auto pt-2 flex items-center gap-3">
          <div className="flex items-center border-2 border-slate-100 rounded-2xl bg-white p-1 shadow-sm">
            <button 
              onClick={() => onIncrement(product.id, product.min_order_cartons)}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
            >
              <Plus size={16} />
            </button>
            <span className="w-12 text-center font-black text-sm font-mono text-slate-800">
              {toPersianNum(qty)}
            </span>
            <button 
              disabled={qty <= product.min_order_cartons}
              onClick={() => onDecrement(product.id, product.min_order_cartons)}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-30"
            >
              <Minus size={16} />
            </button>
          </div>

          <button 
            onClick={() => onAddToCart(product, qty)}
            className="flex-1 py-3.5 bg-slate-900 text-white rounded-2xl text-[12px] font-black flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 cursor-pointer"
          >
            <Package size={18} />
            <span>ثبت در پیش‌فاکتور</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
