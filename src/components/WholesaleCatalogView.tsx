import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Product } from "../types";
import { ShoppingCart, Plus, Minus, Package, ArrowLeftRight, Check, Info, ShieldCheck, Sparkles, Star, Search, Filter, Flame } from "lucide-react";
import StarRating from "./StarRating";
import { PremiumProductCard } from "./PremiumProductCard";

interface WholesaleCatalogViewProps {
  products: Product[];
  activeCategory: string;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  userBadge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  onViewDetails?: (product: Product) => void;
  interfaceMode?: 'simple' | 'advanced';
}

export default function WholesaleCatalogView({ products, activeCategory, onAddToCart, userBadge, onViewDetails, interfaceMode }: WholesaleCatalogViewProps) {
  // Store ordered carton quantities per product in local state
  const [cartonQuantities, setCartonQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'bestselling' | 'new' | 'featured'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default');

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

  // Filter and sort products
  const displayProducts = useMemo(() => {
    let list = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.brand.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Type filter
    if (filterType === 'bestselling') {
      list = list.filter(p => p.isFeatured || p.badge === "پرفروش" || p.badge === "ویژه" || (p.rating && p.rating >= 4.5));
    } else if (filterType === 'new') {
      list = list.filter(p => p.isNew || p.badge === "جدید");
    } else if (filterType === 'featured') {
      list = list.filter(p => p.isFeatured || p.badge === "VIP" || p.badge === "منتخب");
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'price-asc') {
        return (a.bulk_price || a.price) - (b.bulk_price || b.price);
      } else if (sortBy === 'price-desc') {
        return (b.bulk_price || b.price) - (a.bulk_price || a.price);
      } else if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else {
        // Default: featured/bestselling first
        const aScore = (a.isFeatured || a.badge === "ویژه" || a.badge === "VIP" || a.badge === "منتخب" || a.isFavorite) ? 1 : 0;
        const bScore = (b.isFeatured || b.badge === "ویژه" || b.badge === "VIP" || b.badge === "منتخب" || b.isFavorite) ? 1 : 0;
        return bScore - aScore;
      }
    });

    return list;
  }, [products, searchQuery, filterType, sortBy]);

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

      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام کالا یا برند..."
            className="w-full bg-white border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-xs transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            همه محصولات
          </button>
          <button
            onClick={() => setFilterType('bestselling')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'bestselling'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame size={13} className="text-amber-400" />
            پرفروش‌ترین‌ها
          </button>
          <button
            onClick={() => setFilterType('new')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'new'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            جدیدترین‌ها
          </button>
          <button
            onClick={() => setFilterType('featured')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === 'featured'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            ویژه / VIP
          </button>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-xs"
          >
            <option value="default">مرتب‌سازی: پیش‌فرض</option>
            <option value="price-asc">ارزان‌ترین قیمت</option>
            <option value="price-desc">گران‌ترین قیمت</option>
            <option value="rating">بالاترین امتیاز</option>
          </select>
        </div>
      </div>

      {/* Product Count Indicator */}
      <div className="px-6 py-2.5 bg-emerald-50/50 border-b border-emerald-100/60 flex items-center justify-between text-[11px] font-bold text-slate-600">
        <span>نمایش {toPersianNum(displayProducts.length)} محصول در این دسته</span>
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")} 
            className="text-emerald-700 hover:underline font-black cursor-pointer"
          >
            پاک کردن جستجو (×)
          </button>
        )}
      </div>

      {displayProducts.length === 0 ? (
        <div className="p-16 text-center space-y-3">
          <Package size={40} className="mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-500">هیچ محصولی با معیارهای جستجوی شما یافت نشد.</p>
          <button 
            onClick={() => { setSearchQuery(""); setFilterType('all'); }} 
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm hover:bg-emerald-700"
          >
            نمایش همه محصولات
          </button>
        </div>
      ) : (
        <>
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
                interfaceMode={interfaceMode}
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
                interfaceMode={interfaceMode}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
