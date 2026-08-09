import { useState } from "react";
import { motion } from "motion/react";
import { Product } from "../types";
import { ShoppingCart, Plus, Minus, Package, ArrowLeftRight, Check, Info, ShieldCheck, Sparkles, Star } from "lucide-react";
import StarRating from "./StarRating";
import { PremiumProductCard } from "./PremiumProductCard";

interface WholesaleCatalogViewProps {
  products: Product[];
  activeCategory: string;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  onViewDetails?: (product: Product) => void;
}

export default function WholesaleCatalogView({ products, activeCategory, onAddToCart, userBadge, onViewDetails }: WholesaleCatalogViewProps) {
  // Store ordered carton quantities per product in local state
  const [cartonQuantities, setCartonQuantities] = useState<Record<string, number>>({});

  const getDiscountPercent = (badge?: string) => {
    switch (badge) {
      case 'silver': return 2;
      case 'gold': return 5;
      case 'vip': return 8;
      case 'admin': return 10;
      default: return 0;
    }
  };

  const getQuantity = (productId: string, minOrder: number) => {
    return cartonQuantities[productId] ?? minOrder;
  };

  const handleIncrement = (productId: string, minOrder: number) => {
    setCartonQuantities(prev => ({
      ...prev,
      [productId]: (prev[productId] ?? minOrder) + 1
    }));
  };

  const handleDecrement = (productId: string, minOrder: number) => {
    setCartonQuantities(prev => ({
      ...prev,
      [productId]: Math.max(minOrder, (prev[productId] ?? minOrder) - 1)
    }));
  };

  // Convert Persian numbers for authenticity
  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
  };

  // Sort products so Featured / Pinned / VIP products appear FIRST
  const displayProducts = [...products].sort((a, b) => {
    const aScore = (a.isFeatured || a.badge === "ویژه" || a.badge === "VIP" || a.badge === "منتخب" || a.isFavorite) ? 1 : 0;
    const bScore = (b.isFeatured || b.badge === "ویژه" || b.badge === "VIP" || b.badge === "منتخب" || b.isFavorite) ? 1 : 0;
    return bScore - aScore;
  });

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl text-right" dir="rtl">
      {/* Photo-accurate Top Header Block */}
      <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50/45 via-white to-emerald-50/5 flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Left Side: Info Box */}
        <div className="bg-slate-50/85 border border-slate-100 p-3.5 rounded-2xl w-full sm:w-auto text-right shadow-sm text-xs space-y-1.5 font-bold text-gray-700 min-w-[200px]">
          <div className="flex justify-between sm:block">
            <span className="text-gray-400">تاریخ مبادلات:</span>{" "}
            <span className="text-gray-900 font-mono">۱۳ تیر ۱۴۰۵</span>
          </div>
          <div className="flex justify-between sm:block">
            <span className="text-gray-400">دسته‌بندی:</span>{" "}
            <span className="text-emerald-600 font-black">{activeCategory}</span>
          </div>
          <div className="flex justify-between sm:block">
            <span className="text-gray-400">نوع قیمت مبنا:</span>{" "}
            <span className="text-slate-900 font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">قیمت مستقیم درب کارخانه</span>
          </div>
        </div>

        {/* Right Side: Title & Subtitle */}
        <div className="text-center sm flex items-center gap-3">
          <div className="flex flex-col">
            <h2 className="text-xl sm font-black text-gray-900 tracking-tight flex items-center gap-2 justify-end">
              <span className="text-emerald-700">بازرگانی دست اول</span>
            </h2>
            <p className="text-[11px] text-gray-400 font-bold mt-1">سامانه استعلام و مبادلات مستقیم تولیدات کارخانه</p>
          </div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-emerald-700 rounded-xl flex items-center justify-center text-white font-black text-xs sm shadow-md shadow-emerald-600/30">
            دست‌اول
          </div>
        </div>
      </div>

      {/* 1. Mobile-Optimized Product List (Premium Grid) */}
      <div className="md:hidden grid grid-cols-1 gap-6 p-4">
        {displayProducts.map((product) => (
          <PremiumProductCard 
            key={`mob-cat-${product.id}`}
            product={product}
            qty={getQuantity(product.id, product.min_order_cartons)}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
            toPersianNum={toPersianNum}
          />
        ))}
      </div>

      {/* 2. Desktop-Optimized Product Grid (Royal Bento Style) */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-8 p-8 bg-slate-50/30">
        {displayProducts.map((product) => (
          <PremiumProductCard 
            key={`desk-cat-${product.id}`}
            product={product}
            qty={getQuantity(product.id, product.min_order_cartons)}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
            toPersianNum={toPersianNum}
          />
        ))}
      </div>
    </div>
  );
}
