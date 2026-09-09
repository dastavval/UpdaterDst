import React, { useState } from "react";
import { Product } from "../types";
import { cleanUnitName, getDisplayImageUrl, getProductFallbackSvg } from "../lib/image-utils";
import { Plus, Minus, Sparkles, Factory, MapPin, Package, Star, TrendingUp, ShieldCheck, Lock, Award, Percent, Tag, ShoppingCart, Heart, CheckCircle2, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  index?: number;
}

export const PremiumProductCard: React.FC<PremiumProductCardProps> = React.memo(({
  product,
  qty,
  onIncrement,
  onDecrement,
  onAddToCart,
  onViewDetails,
  toPersianNum: propToPersianNum,
  interfaceMode = 'advanced',
  user,
  onRequireAuth,
  index = 0
}) => {
  const toPersianNum = (n: any) => toPersianDigits(n);
  const pricing = getProductRolePricing(product, user);
  const consumerPrice = pricing.displayConsumerPrice;
  const profitMargin = pricing.profitMarginPercent;

  const [isBookmarked, setIsBookmarked] = React.useState(false);

  const checkBookmark = React.useCallback(() => {
    try {
      const saved = localStorage.getItem("dastavval_wishlist");
      if (saved) {
        const list = JSON.parse(saved);
        setIsBookmarked(list.includes(product.id));
      } else {
        setIsBookmarked(false);
      }
    } catch (e) {
      setIsBookmarked(false);
    }
  }, [product.id]);

  React.useEffect(() => {
    checkBookmark();
    window.addEventListener("dastavval-wishlist-changed", checkBookmark);
    return () => {
      window.removeEventListener("dastavval-wishlist-changed", checkBookmark);
    };
  }, [product.id, checkBookmark]);

  const [flyingParticles, setFlyingParticles] = useState<{ id: number }[]>([]);

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const saved = localStorage.getItem("dastavval_wishlist");
      let list = saved ? JSON.parse(saved) : [];
      if (list.includes(product.id)) {
        list = list.filter((id: string) => id !== product.id);
        setIsBookmarked(false);
      } else {
        list.push(product.id);
        setIsBookmarked(true);
      }
      localStorage.setItem("dastavval_wishlist", JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("dastavval-wishlist-changed"));
    } catch (err) {}
  };

  const handleAddToCartWithParticles = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, qty);
    const newId = Date.now();
    setFlyingParticles(prev => [...prev, { id: newId }]);

    try {
      window.dispatchEvent(new CustomEvent("dastavval_cart_item_added"));
    } catch (err) {}

    setTimeout(() => {
      setFlyingParticles(prev => prev.filter(p => p.id !== newId));
    }, 900);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-30px", amount: 0.05 }}
      transition={{ 
        duration: 0.35, 
        ease: [0.16, 1, 0.3, 1],
        delay: Math.min((index % 4) * 0.04, 0.16)
      }}
      whileHover={{ y: -6 }}
      style={{ willChange: "transform, opacity" }}
      className="group relative bg-white border border-slate-200/60 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 flex flex-col h-full transform-gpu"
    >
  {/* Top Badge Overlay */}
      <div className="absolute top-4 inset-x-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {((product as any).isSpecial || product.isFeatured || (product as any).discountPercent >= 15 || (product as any).discount_percent >= 15 || (product as any).badge === 'ویژه' || (product as any).badge === 'VIP' || (product as any).badge === 'منتخب') && (
            <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-xl shadow-lg border border-emerald-500 text-[10px] font-black flex items-center gap-1.5">
              <Sparkles size={12} className="fill-white text-white" />
              <span>ویژه 🌟</span>
            </div>
          )}
          {((product as any).isFloorMarket || (product as any).isKafBazar) && (
            <div className="bg-rose-600 text-white px-2.5 py-1 rounded-xl shadow-lg border border-rose-500 text-[10px] font-black flex items-center gap-1.5">
              <Flame size={12} className="fill-white text-white" />
              <span>کف بازار 🔥</span>
            </div>
          )}
          {profitMargin > 0 ? (
            <div className="bg-emerald-600/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg border border-white/20 text-[10px] font-black flex items-center gap-1.5">
              <TrendingUp size={12} className="animate-pulse" />
              سود خالص: {toPersianNum(profitMargin)}٪
            </div>
          ) : (
            <div className="bg-emerald-600/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl shadow-lg border border-white/20 text-[10px] font-black flex items-center gap-1.5">
              <ShieldCheck size={12} />
              قیمت مصوب کارخانه
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleToggleBookmark}
            className={`w-8 h-8 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center border ${
              isBookmarked
                ? "bg-rose-500 text-white border-rose-400"
                : "bg-white/90 backdrop-blur-md text-slate-600 hover:bg-rose-500 hover:text-white border-slate-100"
            }`}
            title={isBookmarked ? "حذف از نشان‌شده‌ها" : "نشان‌گذاری کالا"}
          >
            <Heart size={13} className={isBookmarked ? "fill-white" : ""} />
          </button>
          <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black border shadow-xs ${pricing.badgeColor}`}>
            {pricing.badgeLabel}
          </div>
        </div>
      </div>

      {/* Image Section */}
      <div className="aspect-square relative overflow-hidden bg-white group-hover:bg-emerald-50/20 transition-colors duration-500 flex items-center justify-center p-2">
        <img 
          src={getDisplayImageUrl(product.image_url || product.imageUrl, product.name, product.brand)} 
          alt={product.name}
          className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500 ease-out"
          loading={index < 4 ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => { (e.target as HTMLImageElement).src = getProductFallbackSvg(product.name, product.brand); }}
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
          <h4 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
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
              <span className="text-[9px] text-emerald-600 font-black block leading-none mb-1">
                {pricing.profitPerCartonVsConsumer > 0 ? "سود هر کارتن" : "شرایط تامین"}
              </span>
              <span className="text-xs font-black text-emerald-700 leading-none font-mono">
                {pricing.profitPerCartonVsConsumer > 0
                  ? `+${toPersianNum(pricing.profitPerCartonVsConsumer.toLocaleString())} ت`
                  : "قیمت تمام‌شده"}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 text-[10px] text-slate-500 font-bold">
            <span className="flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span>مصرف‌کننده: {toPersianNum(consumerPrice.toLocaleString())} ت</span>
            </span>
            <span className="text-slate-400 text-[9.5px]">
              {pricing.isRepresentative ? `⭐ ${toPersianNum(pricing.customerMarkupPercent)}٪ تخفیف عاملیت` : "🏷️ کارتن: " + toPersianNum(pricing.pricePerCarton.toLocaleString()) + " ت"}
            </span>
          </div>
        </div>

        {/* Logistics Detail */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold bg-emerald-50/30 p-3 rounded-xl border border-emerald-100/50">
          <Package size={14} className="text-indigo-400" />
          <span>{toPersianNum(product.carton_pack_count)} {cleanUnitName(product.unit)} در کارتن</span>
          <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mx-auto" />
          <MapPin size={14} className="text-indigo-400" />
          <span>{product.shipping_origin || "کارخانه مرکزی"}</span>
        </div>

        {/* Advanced B2B Telemetry */}
        {interfaceMode === 'advanced' && (
          <div className="grid grid-cols-2 gap-2 text-[10px] bg-gradient-to-r from-purple-500/5 to-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 text-slate-600 font-bold">
            <div className="flex items-center gap-1.5">
              <span className="text-purple-600">⚡</span>
              <span>ظرفیت خط: {toPersianNum((product as any).production_capacity || "۱۵,۰۰۰")} کارتن</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600">🛡️</span>
              <span>تحویل لجستیک: {toPersianNum((product as any).lead_time_hours || "۳۶")} ساعت</span>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-auto pt-2 flex items-center gap-3">
          <div className="flex items-center border-2 border-slate-100 rounded-2xl bg-white p-1 shadow-sm">
            <button 
              onClick={() => onIncrement(product.id, product.min_order_cartons)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={16} />
            </button>
            <span className="w-12 text-center font-black text-sm font-mono text-slate-800">
              {toPersianNum(qty)}
            </span>
            <button 
              disabled={qty <= product.min_order_cartons}
              onClick={() => onDecrement(product.id, product.min_order_cartons)}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
            >
              <Minus size={16} />
            </button>
          </div>

          <button 
            onClick={handleAddToCartWithParticles}
            className="relative flex-1 py-3 sm:py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[12px] font-black flex items-center justify-center gap-2 transition-all duration-250 active:scale-[0.94] hover:scale-[1.01] hover:shadow-lg shadow-md shadow-emerald-600/10 cursor-pointer"
          >
            <ShoppingCart size={18} />
            <span>ثبت در سبد سفارش</span>

            {/* Fly-To-Cart Particle Animation */}
            <AnimatePresence>
              {flyingParticles.map((particle) => (
                <motion.div
                  key={`fly-prem-${particle.id}`}
                  initial={{ opacity: 1, scale: 0.9, x: 0, y: 0 }}
                  animate={{
                    opacity: [1, 1, 0],
                    scale: [1, 1.4, 0.4],
                    x: [-10, -40, -120],
                    y: [-10, -90, -180],
                    rotate: [0, -20, -45]
                  }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 pointer-events-none flex items-center justify-center z-50"
                >
                  <div className="flex items-center justify-center gap-1 bg-emerald-600 text-white p-2 rounded-2xl shadow-xl border border-amber-300 ring-2 ring-emerald-400">
                    <ShoppingCart size={16} className="fill-white animate-pulse" />
                    <span className="text-[10px] font-black font-mono">+{qty}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.div>
  );
});
