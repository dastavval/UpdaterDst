import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  ArrowLeft, 
  Package, 
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Factory,
  Percent,
  Layers,
  ArrowUpRight,
  Flame,
  ZoomIn,
  Eye,
  X,
  Coins,
  ChevronLeft
} from 'lucide-react';
import { Product } from '../types';
import { getDisplayImageUrl } from '../lib/image-utils';
import { ProductImage } from './ProductImage';
import SpecialPriceBagIcon from './SpecialPriceBagIcon';

interface FactoryHeroPowerhouseProps {
  products?: Product[];
  onOrderClick?: () => void;
  onFactoryClick?: () => void;
  onBillboardClick?: () => void;
  onAgencyClick?: () => void;
  onAddToCart?: (product: Product, quantityCartons: number) => void;
}

const initialAdsFallback: any[] = [];

export const FactoryHeroPowerhouse: React.FC<FactoryHeroPowerhouseProps> = ({
  products = [],
  onOrderClick,
  onFactoryClick,
  onBillboardClick,
  onAgencyClick,
  onAddToCart,
}) => {
  const [activeMode, setActiveMode] = useState<'under_market' | 'liquid' | 'high_margin'>('under_market');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [ads, setAds] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const savedAds = localStorage.getItem("dastavval_sponsored_ads_v2");
    if (savedAds) {
      try {
        setAds(JSON.parse(savedAds));
      } catch (e) {
        console.error("Error reading ads in hero powerhouse", e);
      }
    }
  }, []);

  const toPersianNum = (num: number | string | undefined | null) => {
    if (num === undefined || num === null || num === "") return "۰";
    const persian: Record<string, string> = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return String(num).replace(/[0-9]/g, (w) => persian[w] || w);
  };

  const normalizeItem = (item: any, isAd: boolean): any => {
    if (isAd) {
      const wholesalePriceStr = item.wholesalePrice || 'توافقی';
      const marketPriceStr = item.marketPrice || 'نامشخص';
      const buyerProfitStr = item.buyerProfit || '۱۲٪ سود ناخالص';
      
      const extractPercent = (str: string) => {
        if (!str) return 30;
        const englishDigits = str.replace(/[۰-۹]/g, (w) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(w)));
        const match = englishDigits.match(/(\d+)\s*%/ ) || englishDigits.match(/(\d+)\s*٪/);
        if (match) return parseInt(match[1]);
        const anyNum = englishDigits.match(/\d+/);
        if (anyNum) {
          const val = parseInt(anyNum[0]);
          if (val > 0 && val < 100) return val;
        }
        return 30;
      };
      
      const discountPercent = extractPercent(buyerProfitStr);

      return {
        id: item.id,
        name: item.title || 'کالای زیر قیمت بازار',
        title: item.title || 'کالای زیر قیمت بازار',
        brand: item.factoryName || 'تامین‌کننده معتبر',
        factoryName: item.factoryName || 'تامین‌کننده معتبر',
        description: item.description || '',
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
        image_url: item.imageUrl || 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&q=80&w=800',
        wholesalePriceStr,
        marketPriceStr,
        buyerProfitStr,
        discountPercent,
        unitProfit: 0,
        min_order_cartons: 1,
        carton_pack_count: 1,
        isAd: true,
        quantity: item.quantity || 'نامشخص',
        rawAd: item
      };
    } else {
      const wholesaleUnitPrice = item.bulk_price || item.price || 10000;
      const marketUnitPrice = item.consumer_price || Math.round(wholesaleUnitPrice * 1.35);
      const unitProfit = Math.max(0, marketUnitPrice - wholesaleUnitPrice);
      const discountPercent = marketUnitPrice > wholesaleUnitPrice 
        ? Math.round(((marketUnitPrice - wholesaleUnitPrice) / marketUnitPrice) * 100)
        : 25;
      
      const wholesalePriceStr = wholesaleUnitPrice.toLocaleString('fa-IR') + ' تومان';
      const marketPriceStr = marketUnitPrice.toLocaleString('fa-IR') + ' تومان';
      const buyerProfitStr = discountPercent + '٪ سود بنکداری (' + unitProfit.toLocaleString('fa-IR') + ' ت سود واحد)';

      return {
        id: item.id,
        name: item.name,
        title: item.name,
        brand: item.brand || item.factoryName || 'کارخانه تولیدکننده رسمی',
        factoryName: item.factoryName || item.factory_name || item.brand || 'کارخانه تولیدکننده رسمی',
        description: item.description || '',
        imageUrl: item.image_url,
        image_url: item.image_url,
        wholesalePriceStr,
        marketPriceStr,
        buyerProfitStr,
        discountPercent,
        unitProfit,
        min_order_cartons: item.min_order_cartons || 2,
        carton_pack_count: item.carton_pack_count || 12,
        isAd: false,
        rawProduct: item
      };
    }
  };

  const { underMarketList, liquidList, highMarginList } = useMemo(() => {
    const allAds = ads && ads.length > 0 ? ads : initialAdsFallback;
    
    // Process Ads
    const underMarketAds = allAds
      .filter((ad: any) => ad.category === 'under_market' && ad.status === 'approved')
      .map((ad: any) => normalizeItem(ad, true));

    const liquidAds = allAds
      .filter((ad: any) => ad.category === 'liquid' && ad.status === 'approved')
      .map((ad: any) => normalizeItem(ad, true));

    // Process Catalog Products
    const processedProducts = (products || []).map((prod) => normalizeItem(prod, false));

    // Under Market
    const finalUnderMarket = underMarketAds.length > 0 
      ? underMarketAds.slice(0, 4)
      : processedProducts.sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 4);

    // Liquid / Clearance
    const finalLiquid = liquidAds.length > 0 
      ? liquidAds.slice(0, 4)
      : processedProducts.sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 4);

    // High Margin: sorted by unit profit margin and discount percent
    const highMarginSorted = [...processedProducts]
      .sort((a, b) => {
        const profitA = (a.unitProfit || 0) * (a.discountPercent || 1);
        const profitB = (b.unitProfit || 0) * (b.discountPercent || 1);
        return profitB - profitA;
      })
      .slice(0, 4);

    return {
      underMarketList: finalUnderMarket,
      liquidList: finalLiquid,
      highMarginList: highMarginSorted.length > 0 ? highMarginSorted : finalUnderMarket
    };
  }, [products, ads]);

  const currentList = activeMode === 'under_market' 
    ? underMarketList 
    : activeMode === 'liquid' 
    ? liquidList 
    : highMarginList;

  const currentProduct = currentList[selectedIndex] || currentList[0];

  if (!currentProduct) {
    return null;
  }

  const handleQuickAdd = () => {
    if (currentProduct.isAd) {
      if (onBillboardClick) {
        onBillboardClick();
      }
    } else {
      if (onAddToCart && currentProduct.rawProduct) {
        onAddToCart(currentProduct.rawProduct, currentProduct.min_order_cartons || 2);
      } else if (onOrderClick) {
        onOrderClick();
      }
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 p-4 sm:p-5 text-right relative overflow-hidden" dir="rtl">
        
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar: Title & 3 Options in Exactly One Single Responsive Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-slate-100 pb-3.5 mb-4 relative z-10">
          
          {/* Header Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 via-teal-600 to-emerald-500 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-emerald-500/15">
              <Factory size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-950 tracking-tight">
                  تالار معاملات مستقیم و بارهای مازاد کارخانجات
                </h2>
                <span className="bg-linear-to-r from-orange-600 via-rose-600 to-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                  <Flame size={11} className="text-amber-200" />
                  <span>عرضه مستقیم</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                خرید مستقیم از کارخانه
              </p>
            </div>
          </div>
          
          {/* Unified 3 Options in ONE Single Clean Line (3 تا گزینه تو یه خط) */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200/70 w-full lg:w-auto shrink-0 shadow-2xs">
            <button
              onClick={() => { setActiveMode('under_market'); setSelectedIndex(0); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeMode === 'under_market'
                  ? 'bg-white text-emerald-950 shadow-xs border border-slate-200/60 font-black scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <TrendingDown size={13} className="text-emerald-600 shrink-0" />
              <span>زیر قیمت ({toPersianNum(underMarketList.length)})</span>
            </button>

            <button
              onClick={() => { setActiveMode('liquid'); setSelectedIndex(0); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeMode === 'liquid'
                  ? 'bg-white text-orange-950 shadow-xs border border-slate-200/60 font-black scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers size={13} className="text-orange-600 shrink-0" />
              <span>مازاد خط ({toPersianNum(liquidList.length)})</span>
            </button>

            <button
              onClick={() => { setActiveMode('high_margin'); setSelectedIndex(0); }}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeMode === 'high_margin'
                  ? 'bg-linear-to-r from-amber-500 to-emerald-600 text-white shadow-xs border border-amber-400 font-black scale-[1.02]'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
              }`}
            >
              <Coins size={13} className={activeMode === 'high_margin' ? 'text-amber-100 shrink-0' : 'text-amber-600 shrink-0'} />
              <span>بیشترین سود ({toPersianNum(highMarginList.length)})</span>
            </button>
          </div>
        </div>

        {/* Compact & Creative Main Showcase: 2-Column Balanced Side-by-Side View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative z-10 items-stretch">
          
          {/* Left / Visual Image Frame Podium (5 Cols on Desktop) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 flex flex-col justify-between relative group overflow-hidden shadow-2xs">
            
            {/* Square Clean Image taking the entire box space with minimal padding */}
            <div 
              onClick={() => setPreviewImage(currentProduct.imageUrl || currentProduct.image_url)}
              className="w-full h-72 sm:h-80 lg:h-full min-h-[280px] lg:min-h-[340px] flex items-center justify-center p-0 cursor-pointer relative group transition-all duration-500 bg-white"
            >
              {/* Top Floating Badges Overlaid Directly on Image */}
              <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2 z-20 pointer-events-none">
                <span className="bg-linear-to-r from-emerald-600 to-teal-700 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 pointer-events-auto">
                  <Percent size={11} className="text-emerald-200" />
                  <span>{toPersianNum(currentProduct.discountPercent || 30)}٪ سود بنکداری</span>
                </span>
              </div>

              <div className="absolute inset-x-8 bottom-4 h-8 bg-indigo-600/10 blur-2xl rounded-full transition-all duration-500 group-hover:bg-emerald-500/20" />

              <ProductImage 
                src={currentProduct.imageUrl || currentProduct.image_url} 
                alt={currentProduct.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 relative z-10"
              />

              {/* Hover Quick Action */}
              <div className="absolute inset-0 bg-slate-400/50 backdrop-blur-sm[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-30 rounded-2xl">
                <span className="bg-white/95 text-slate-950 text-[11px] font-black px-4 py-2 rounded-xl shadow-xl flex items-center gap-1.5">
                  <Eye size={14} className="text-emerald-600" />
                  <span>مشاهده آنالیز کالا</span>
                </span>
              </div>

              {/* Bottom Floating Factory Source Badge */}
              <div className="absolute bottom-2.5 inset-x-3 text-center text-[10px] text-slate-600 font-bold bg-white/90 backdrop-blur-xs py-1 px-2 rounded-lg border border-slate-100 shadow-2xs z-20">
                مبدا بارگیری: <strong className="text-slate-900">{currentProduct.factoryName || currentProduct.brand}</strong>
              </div>
            </div>
          </div>

          {/* Right / Product Details & Commercial Matrix (7 Cols on Desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-3 bg-slate-50/70 rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            
            {/* Title & Description */}
            <div className="space-y-1.5 text-right">
              <div className="inline-flex items-center gap-1 bg-emerald-100/80 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                <Sparkles size={11} className="text-emerald-700" />
                <span>تامین مستقیم با تسویه امانی</span>
              </div>
              
              <h3 className="text-sm sm:text-base font-black text-slate-950 leading-snug">
                {currentProduct.name}
              </h3>

              {currentProduct.description && (
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed bg-white/80 p-2.5 rounded-xl border border-slate-200/60 shadow-2xs line-clamp-2">
                  {currentProduct.description}
                </p>
              )}
            </div>

            {/* Pricing Matrix Block */}
            <div className="grid grid-cols-2 gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 block font-bold">قیمت مصرف‌کننده</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 line-through font-mono font-bold">
                    {toPersianNum(currentProduct.marketPriceStr)}
                  </span>
                  <span className="text-[8px] bg-rose-50 text-rose-700 font-black px-1 rounded">مصوب</span>
                </div>
              </div>

              <div className="text-left space-y-0.5 border-r border-slate-100 pr-3">
                <span className="text-[10px] text-slate-500 block font-bold">قیمت خرید عمده (کف)</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-sm sm:text-base font-black text-emerald-600 font-mono">
                    {toPersianNum(currentProduct.wholesalePriceStr)}
                  </span>
                  <SpecialPriceBagIcon size={14} animated={true} showBadge={false} />
                </div>
              </div>
            </div>

            {/* Live Margin Calculation Pill */}
            {currentProduct.unitProfit > 0 && (
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200/80 flex items-center justify-between text-[11px] font-bold text-emerald-900">
                <div className="flex items-center gap-1.5">
                  <Coins size={14} className="text-emerald-600" />
                  <span>سود خالص هر کارتن به نفع خریدار:</span>
                </div>
                <span className="font-mono font-black text-emerald-800 text-xs">
                  {toPersianNum((currentProduct.unitProfit * (currentProduct.carton_pack_count || 1)).toLocaleString())} تومان
                </span>
              </div>
            )}

            {/* Action Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleQuickAdd}
                className="w-full bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black py-2.5 px-3 rounded-xl transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <SpecialPriceBagIcon size={15} showBadge={true} animated={true} />
                <span>{currentProduct.isAd ? "شروع معامله امن این بار" : "ثبت سفارش مستقیم"}</span>
              </button>

              <button
                onClick={onBillboardClick}
                className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-black py-2.5 px-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <TrendingDown size={14} className="text-emerald-600" />
                <span>تالار بارهای زیر قیمت</span>
              </button>
            </div>

          </div>

        </div>

        {/* Bottom: Fast Interactive Product Thumbnails Selector */}
        <div className="border-t border-slate-100 pt-3 mt-3 text-right">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-500 font-black flex items-center gap-1">
              <Sparkles size={12} className="text-emerald-600" />
              <span>انتخاب سریع سایر بارهای ویژه و کارخانجات فعال:</span>
            </span>
            <button 
              onClick={onOrderClick}
              className="text-[10px] text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-0.5 cursor-pointer"
            >
              <span>مشاهده همه محصولات</span>
              <ChevronLeft size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {currentList.map((prod: any, idx: number) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={`hero-thumb-${prod.id || 'item'}-${idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-2 rounded-xl border text-right transition-all flex items-center gap-2 cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-500 text-slate-950 ring-1.5 ring-emerald-400 shadow-2xs scale-[1.01]'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200/80 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                    <ProductImage 
                      src={prod.image_url || prod.imageUrl} 
                      alt={prod.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="truncate flex-1 min-w-0">
                    <span className="text-[11px] font-black block truncate text-slate-900">{prod.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold block truncate">
                      {prod.factoryName || prod.brand || 'کارخانه رسمی'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-400/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
          dir="rtl"
        >
          <div 
            className="bg-white rounded-2xl p-4 max-w-lg w-full shadow-2xl relative border border-slate-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-900">{currentProduct.name}</span>
              <button 
                onClick={() => setPreviewImage(null)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
            
            <div className="w-full h-72 bg-slate-50 rounded-xl flex items-center justify-center p-2 border border-slate-100 overflow-hidden">
              <img 
                src={previewImage} 
                alt="Product Preview" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-600 pt-1">
              <span>کارخانه: {currentProduct.factoryName || currentProduct.brand}</span>
              <span className="text-emerald-700 font-black">{currentProduct.wholesalePriceStr}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FactoryHeroPowerhouse;
