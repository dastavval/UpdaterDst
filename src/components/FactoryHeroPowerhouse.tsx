import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  Package, 
  CheckCircle2,
  TrendingDown,
  Factory,
  Percent,
  Layers,
  ArrowUpRight,
  Flame
} from 'lucide-react';
import { Product } from '../types';

interface FactoryHeroPowerhouseProps {
  products?: Product[];
  onOrderClick?: () => void;
  onFactoryClick?: () => void;
  onBillboardClick?: () => void;
  onAgencyClick?: () => void;
  onAddToCart?: (product: Product, quantityCartons: number) => void;
}

export const FactoryHeroPowerhouse: React.FC<FactoryHeroPowerhouseProps> = ({
  products = [],
  onOrderClick,
  onFactoryClick,
  onBillboardClick,
  onAgencyClick,
  onAddToCart,
}) => {
  const [activeMode, setActiveMode] = useState<'under_market' | 'liquid' | 'featured'>('under_market');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian: Record<string, string> = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => persian[w] || w);
  };

  // 1. Process REAL products from database / props
  const { underMarketList, liquidList, featuredList } = useMemo(() => {
    if (!products || products.length === 0) {
      return { underMarketList: [], liquidList: [], featuredList: [] };
    }

    // Calculate real profit margin & discount for every product
    const processed = products.map((prod) => {
      const wholesaleUnitPrice = prod.bulk_price || prod.price;
      const marketUnitPrice = prod.consumer_price || Math.round(prod.price * 1.35);
      const discountPercent = marketUnitPrice > wholesaleUnitPrice 
        ? Math.round(((marketUnitPrice - wholesaleUnitPrice) / marketUnitPrice) * 100)
        : 25;
      
      const cartonWholesale = wholesaleUnitPrice * (prod.carton_pack_count || 1);
      const cartonMarket = marketUnitPrice * (prod.carton_pack_count || 1);
      const cartonSavings = cartonMarket - cartonWholesale;

      return {
        ...prod,
        wholesaleUnitPrice,
        marketUnitPrice,
        discountPercent,
        cartonWholesale,
        cartonMarket,
        cartonSavings,
        isLiquidStock: (prod.stock_quantity_cartons && prod.stock_quantity_cartons > 300) || (prod.min_order_cartons && prod.min_order_cartons <= 2)
      };
    });

    // Top discounted (Under Market Deals)
    const sortedByDiscount = [...processed].sort((a, b) => b.discountPercent - a.discountPercent);
    const underMarket = sortedByDiscount.slice(0, 4);

    // Liquid / Stagnant & High Stock items
    const liquid = [...processed]
      .sort((a, b) => (b.stock_quantity_cartons || 0) - (a.stock_quantity_cartons || 0))
      .slice(0, 4);

    // Featured / High reputation factories
    const featured = processed.filter(p => p.isFeatured || p.rating && p.rating >= 4.8).slice(0, 4);

    return {
      underMarketList: underMarket.length > 0 ? underMarket : processed.slice(0, 4),
      liquidList: liquid.length > 0 ? liquid : processed.slice(0, 4),
      featuredList: featured.length > 0 ? featured : processed.slice(0, 4)
    };
  }, [products]);

  const currentList = activeMode === 'under_market' 
    ? underMarketList 
    : activeMode === 'liquid' 
    ? liquidList 
    : featuredList;

  const currentProduct = currentList[selectedIndex] || currentList[0] || (products[0] as any);

  if (!currentProduct) {
    return null;
  }

  const handleQuickAdd = () => {
    if (onAddToCart && currentProduct) {
      onAddToCart(currentProduct, currentProduct.min_order_cartons || 2);
    } else if (onOrderClick) {
      onOrderClick();
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-lg transition-all p-4 sm:p-5 text-right relative overflow-hidden" dir="rtl">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black shrink-0">
            <Factory size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                فرصت‌های ویژه تامین مستقیم از خطوط تولید
              </h2>
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <Flame size={12} />
                <span>کالاهای فعال کارخانجات</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-bold mt-0.5">
              خرید واقعی اقلام کف قیمت بازار و بارهای مازاد کارخانجات با فاکتور رسمی و ضمانت امانی
            </p>
          </div>
        </div>

        {/* Tab Filters (Under Market vs Liquid vs Top Rated) */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start md:self-auto shrink-0">
          <button
            onClick={() => { setActiveMode('under_market'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'under_market'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingDown size={13} className="text-emerald-600" />
            <span>کف قیمت بازار ({toPersianNum(underMarketList.length)})</span>
          </button>

          <button
            onClick={() => { setActiveMode('liquid'); setSelectedIndex(0); }}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'liquid'
                ? 'bg-white text-amber-700 shadow-xs ring-1 ring-amber-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={13} className="text-amber-600" />
            <span>بار مازاد و رسوب ({toPersianNum(liquidList.length)})</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
        
        {/* Real Products Tabs (4 items) */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2">
          {currentList.map((prod: any, idx: number) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={prod.id || idx}
                onClick={() => setSelectedIndex(idx)}
                className={`p-2.5 rounded-2xl border text-right transition-all flex items-center gap-2 cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-emerald-50/80 border-emerald-500 text-slate-900 ring-1 ring-emerald-400 shadow-xs'
                    : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                  <img 
                    src={prod.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} 
                    alt={prod.name}
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="truncate flex-1">
                  <span className="text-[11px] font-black block truncate text-slate-900">{prod.name}</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] text-emerald-700 font-black bg-emerald-100/80 px-1.5 py-0.2 rounded-md">
                      {toPersianNum(prod.discountPercent || 30)}٪ تخفیف
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Active Product Info & Price Compare */}
        <div className="lg:col-span-4 bg-slate-50/80 rounded-2xl p-3 border border-slate-200 flex items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 truncate">
                {currentProduct.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
              <Building2 size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{currentProduct.factoryName || currentProduct.brand || 'کارخانه رسمی طرف قرارداد'}</span>
            </div>
            <div className="text-[9px] text-slate-400 font-bold">
              حداقل سفارش: {toPersianNum(currentProduct.min_order_cartons || 2)} کارتن ({toPersianNum(currentProduct.carton_pack_count || 24)} عددی)
            </div>
          </div>

          <div className="text-left space-y-1 shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[10px] text-slate-400 line-through">
                {toPersianNum((currentProduct.marketUnitPrice || currentProduct.price * 1.3).toLocaleString())}
              </span>
              <span className="text-[9px] bg-rose-100 text-rose-700 font-black px-1.5 py-0.2 rounded">بازار آزاد</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-sm font-black text-emerald-600">
                {toPersianNum((currentProduct.wholesaleUnitPrice || currentProduct.bulk_price || currentProduct.price).toLocaleString())}
              </span>
              <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded">کف کارخانه</span>
            </div>
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded block text-center">
              سود شما: {toPersianNum(currentProduct.discountPercent || 30)}٪
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="lg:col-span-3 flex sm:flex-col gap-2">
          <button
            onClick={handleQuickAdd}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 px-3 rounded-2xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Package size={14} />
            <span>ثبت سفارش مستقیم این کالا</span>
          </button>

          <button
            onClick={onBillboardClick}
            className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-black py-2 px-3 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <TrendingDown size={14} className="text-amber-600" />
            <span>مشاهده تالار بارهای زیر قیمت</span>
          </button>
        </div>

      </div>

      {/* Trust Micro-Footnote */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 font-bold">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-600">
            <ShieldCheck size={13} className="text-emerald-600" />
            تسویه امانی دست اول پس از تحویل بار
          </span>
          <span className="flex items-center gap-1 text-slate-600">
            <Truck size={13} className="text-amber-600" />
            بارنامه رسمی بیمه‌شده به ۳۱ استان
          </span>
        </div>
        <span className="text-emerald-700 font-black flex items-center gap-1 cursor-pointer hover:underline" onClick={onOrderClick}>
          <span>مشاهده کلیه {toPersianNum(products.length || 6)} محصول کارخانجات</span>
          <ArrowLeft size={12} />
        </span>
      </div>

    </div>
  );
};
