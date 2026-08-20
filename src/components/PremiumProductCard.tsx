import React from "react";
import { Product } from "../types";
import { Plus, Minus, Sparkles, Factory, MapPin, Package, Star, TrendingUp, ShieldCheck, Lock, Award, Percent, Tag, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { getProductRolePricing, toPersianDigits } from "../lib/pricing";

interface PremiumProductCardProps {
  product: Product;
  qty: number;
  onIncrement: (id: string, min: number) => void;
  onDecrement: (id: string, min: number) => void;
  onAddToCart: (product: Product, qty: number) => void;
  onViewDetails?: (product: Product) => void;
  toPersianNum: (num: any) => string;
  interfaceMode?: 'simple' | 'advanced';
  user?: any;
  onRequireAuth?: () => void;
}

export const PremiumProductCard: React.FC<PremiumProductCardProps> = ({
  product,
  qty,
  onIncrement,
  onDecrement,
  onAddToCart,
  onViewDetails,
  toPersianNum: propToPersianNum,
  interfaceMode = 'advanced',
  user,
  onRequireAuth
}) => {
  const toPersianNum = (n: any) => toPersianDigits(n);
  const pricing = getProductRolePricing(product, user);
  const consumerPrice = pricing.displayConsumerPrice;
  const profitMargin = pricing.profitMarginPercent;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "100px" }}
      transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
      whileHover={{ y: -8 }}
      className="group relative bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col h-full"
    >
      {/* Top Badge Overlay */}
      <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-2">
          {profitMargin > 0 && (
            <div className="bg-emerald-600/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg border border-white/20 text-[10px] font-black flex items-center gap-1.5">
              <TrendingUp size={12} className="animate-pulse" />
              سود خالص: {toPersianNum(profitMargin)}٪
            </div>
          )}
        </div>
        <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black border shadow-xs ${pricing.badgeColor}`}>
          {pricing.badgeLabel}
        </div>
      </div>

      {/* Image Section */}
      <div className="aspect-square relative overflow-hidden bg-white group-hover:bg-emerald-50/20 transition-colors duration-500 flex items-center justify-center">
        <img 
          src={product.image_url} 
          alt={product.name}
          className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        
        {/* Quick Action Overlay */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-6">
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
            <Factory size={12} />
            <span>{product.brand}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span>{product.category}</span>
          </div>
          <h4 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {product.name}
          </h4>
        </div>

        {/* Pricing Multi-Tier Box */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold block">{pricing.priceTagLabel}:</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-slate-900 tracking-tighter font-mono">
                  {toPersianNum(pricing.unitWholesalePrice.toLocaleString())}
                </span>
                <span className="text-[10px] font-bold text-slate-500">تومان</span>
              </div>
            </div>
            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-[9px] text-emerald-600 font-black block leading-none mb-1">سود هر کارتن</span>
              <span className="text-xs font-black text-emerald-700 leading-none font-mono">
                +{toPersianNum(pricing.profitPerCartonVsConsumer.toLocaleString())} ت
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-[10px] text-slate-500 font-bold">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} className="text-indigo-500" />
              <span>مصرف‌کننده: {toPersianNum(consumerPrice.toLocaleString())} ت</span>
            </span>
            <span className="text-slate-400 text-[9.5px]">
              {pricing.isRepresentative ? "⭐ ۱۰٪ تخفیف عاملیت" : "🏷️ قیمت هر کارتن: " + toPersianNum(pricing.pricePerCarton.toLocaleString()) + " ت"}
            </span>
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
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={16} />
            </button>
            <span className="w-12 text-center font-black text-sm font-mono text-slate-800">
              {toPersianNum(qty)}
            </span>
            <button 
              disabled={qty <= product.min_order_cartons}
              onClick={() => onDecrement(product.id, product.min_order_cartons)}
              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
            >
              <Minus size={16} />
            </button>
          </div>

          <button 
            onClick={() => onAddToCart(product, qty)}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[12px] font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            <ShoppingCart size={18} />
            <span>ثبت در سبد سفارش</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
