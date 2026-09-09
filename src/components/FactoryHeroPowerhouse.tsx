import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { getDisplayImageUrl } from '../lib/image-utils';
import { ProductImage } from './ProductImage';
import SpecialPriceBagIcon from './SpecialPriceBagIcon';
import { getProductRolePricing } from '../lib/pricing';

interface FactoryHeroPowerhouseProps {
  products?: Product[];
  onOrderClick?: () => void;
  onFactoryClick?: () => void;
  onBillboardClick?: () => void;
  onAgencyClick?: () => void;
  onAddToCart?: (product: Product, quantityCartons: number) => void;
  user?: any;
  userBadge?: string;
  b2bConfig?: any;
}

const initialAdsFallback: any[] = [];

export const FactoryHeroPowerhouse: React.FC<FactoryHeroPowerhouseProps> = ({
  products = [],
  onOrderClick,
  onFactoryClick,
  onBillboardClick,
  onAgencyClick,
  onAddToCart,
  user,
  userBadge,
  b2bConfig,
}) => {
  const [activeMode, setActiveMode] = useState<'kaf_bazaar' | 'sediment' | 'surplus'>('kaf_bazaar');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [ads, setAds] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const modeTheme = useMemo(() => {
    switch (activeMode) {
      case 'kaf_bazaar':
        return {
          primary: 'from-rose-600 to-amber-600',
          text: 'text-rose-600',
          bg: 'bg-rose-50',
          border: 'border-rose-200/60',
          lightText: 'text-rose-800',
          accentBg: 'bg-rose-100/80',
          buttonBg: 'bg-rose-600 hover:bg-rose-700',
        };
      case 'sediment':
        return {
          primary: 'from-amber-500 to-orange-600',
          text: 'text-amber-600',
          bg: 'bg-amber-50',
          border: 'border-amber-200/60',
          lightText: 'text-amber-800',
          accentBg: 'bg-amber-100/80',
          buttonBg: 'bg-amber-600 hover:bg-amber-700',
        };
      case 'surplus':
        return {
          primary: 'from-blue-600 to-indigo-600',
          text: 'text-blue-600',
          bg: 'bg-blue-50',
          border: 'border-blue-200/60',
          lightText: 'text-blue-800',
          accentBg: 'bg-blue-100/80',
          buttonBg: 'bg-blue-600 hover:bg-blue-700',
        };
    }
  }, [activeMode]);

  useEffect(() => {
    if (thumbnailsRef.current) {
      const activeElement = thumbnailsRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        thumbnailsRef.current.scrollTo({
          left: activeElement.offsetLeft - thumbnailsRef.current.offsetWidth / 2 + activeElement.offsetWidth / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

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
        customerPriceStr: wholesalePriceStr,
        repPriceStr: '',
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
      const rolePricing = getProductRolePricing(item, user, userBadge as any, b2bConfig);
      const userWholesalePrice = rolePricing.unitWholesalePrice;
      const customerPrice = rolePricing.customerPrice;
      const repFloorPrice = rolePricing.representativeFloorPrice;
      const consumerPrice = rolePricing.consumerPrice;
      const unitProfit = Math.max(0, consumerPrice - userWholesalePrice);
      const discountPercent = rolePricing.profitMarginPercent || 25;
      
      const wholesalePriceStr = userWholesalePrice.toLocaleString('fa-IR') + ' تومان';
      const customerPriceStr = customerPrice.toLocaleString('fa-IR') + ' تومان';
      const repPriceStr = repFloorPrice.toLocaleString('fa-IR') + ' تومان';
      const marketPriceStr = consumerPrice.toLocaleString('fa-IR') + ' تومان';
      const buyerProfitStr = discountPercent + '٪ سود بنکداری (' + unitProfit.toLocaleString('fa-IR') + ' ت سود واحد)';

      return {
        id: item.id,
        name: item.name,
        title: item.name,
        brand: item.brand || item.factoryName || 'کارخانه تولیدکننده رسمی',
        factoryName: item.factoryName || item.factory_name || item.brand || 'کارخانه تولیدکننده رسمی',
        description: item.description || '',
        imageUrl: item.imageUrl || item.image_url || 'https://c102393.parspack.net/c102393/products/prd_1.webp',
        image_url: item.imageUrl || item.image_url || 'https://c102393.parspack.net/c102393/products/prd_1.webp',
        wholesalePriceStr,
        customerPriceStr,
        repPriceStr,
        userWholesalePrice,
        customerPrice,
        repFloorPrice,
        consumerPrice,
        isRepresentative: rolePricing.isRepresentative,
        customerMarkupPercent: rolePricing.customerMarkupPercent || 20,
        badgeLabel: rolePricing.badgeLabel,
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

  const { kafBazaarList, sedimentList, surplusList } = useMemo(() => {
    const allAds = ads && ads.length > 0 ? ads : initialAdsFallback;
    const processedProducts = (products || []).map((prod) => normalizeItem(prod, false));

    // 1. کف بازار (Market Floor chosen by Admin or Factory)
    const matchedKafProducts = processedProducts.filter((p) => {
      const raw = p.rawProduct || {};
      return (
        raw.isFloorMarket === true || 
        raw.isKafBazar === true || 
        raw.isKafBazaar === true || 
        raw.isSpecial === true || 
        raw.isFeatured === true
      );
    });

    // 2. رسوب انبار (Sediment goods chosen by Admin or Factory)
    const matchedSedimentProducts = processedProducts.filter((p) => {
      const raw = p.rawProduct || {};
      return (
        raw.isSediment === true || 
        raw.isLiquid === true || 
        (raw.sedimentDiscountPercent && Number(raw.sedimentDiscountPercent) > 0)
      );
    });

    // 3. مازاد تولید (Surplus goods chosen by Admin or Factory)
    const matchedSurplusProducts = processedProducts.filter((p) => {
      const raw = p.rawProduct || {};
      return (
        raw.isSurplus === true || 
        (raw.surplusDiscountPercent && Number(raw.surplusDiscountPercent) > 0)
      );
    });

    return {
      kafBazaarList: matchedKafProducts,
      sedimentList: matchedSedimentProducts,
      surplusList: matchedSurplusProducts,
    };
  }, [products, ads, user, userBadge]);

  const currentList = useMemo(() => {
    const list = activeMode === 'kaf_bazaar' 
      ? kafBazaarList 
      : activeMode === 'sediment' 
      ? sedimentList 
      : surplusList;
    return list.length > 0 ? list : kafBazaarList;
  }, [activeMode, kafBazaarList, sedimentList, surplusList]);

  // Auto-cycle effect for products
  useEffect(() => {
    if (!isAutoPlaying || currentList.length <= 1) return;
    
    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % currentList.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, currentList.length]);

  const currentProduct = currentList[selectedIndex] || currentList[0];

  if (!currentProduct && (products.length > 0 || ads.length > 0)) {
    // If we have data but currentProduct is null for some reason, try to recover
    const fallback = kafBazaarList[0] || (products.length > 0 ? normalizeItem(products[0], false) : null);
    if (fallback) return <div className="hidden" />; // Return something to avoid crash but try to handle it gracefully
  }

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
      <div 
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        className="w-full bg-slate-50/45 backdrop-blur-[12px] rounded-3xl border border-slate-200/80 shadow-md hover:shadow-lg transition-all duration-350 p-4 sm:p-5 text-right relative overflow-hidden" 
        dir="rtl"
      >
        
        {/* Top Autoplay Progress Bar */}
        {isAutoPlaying && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 z-30 overflow-hidden" dir="ltr">
            <motion.div
              key={`${activeMode}-${selectedIndex}`}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
              className={`h-full bg-gradient-to-r ${modeTheme.primary}`}
            />
          </div>
        )}

        {/* Subtle Immersive Ambient Background Gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar: Title & 3 Options in Exactly One Single Responsive Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200/60 pb-3 mb-4 relative z-10">
          
          {/* Header Identity */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${modeTheme.primary} text-white flex items-center justify-center font-bold shrink-0 shadow-sm transition-all duration-300`}>
              <Factory size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  تالار معاملات مستقیم و بارهای مازاد کارخانجات
                </h2>
                <span className={`bg-gradient-to-r ${modeTheme.primary} text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-3xs transition-all duration-300`}>
                  <Flame size={10} className="text-white/80 animate-bounce" />
                  <span>عرضه مستقیم فعال</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold mt-0.5">
                تضمین پایین‌ترین قیمت کف بازار به صورت مستقیم بدون واسطه
              </p>
            </div>
          </div>
          
          {/* Unified 3 Options in Exact Order: 1. کف بازار, 2. رسوب, 3. مازاد */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/70 w-full lg:w-auto shrink-0">
            {/* 1. کف بازار */}
            <button
              onClick={() => { setActiveMode('kaf_bazaar'); setSelectedIndex(0); }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeMode === 'kaf_bazaar'
                  ? 'bg-white text-rose-900 shadow-sm border border-rose-100/80 font-black scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Flame size={13} className="text-rose-600 shrink-0" />
              <span>کف بازار ({toPersianNum(kafBazaarList.length)})</span>
            </button>

            {/* 2. رسوب */}
            <button
              onClick={() => { setActiveMode('sediment'); setSelectedIndex(0); }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeMode === 'sediment'
                  ? 'bg-white text-amber-900 shadow-sm border border-amber-100/80 font-black scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Package size={13} className="text-amber-600 shrink-0" />
              <span>رسوب ({toPersianNum(sedimentList.length)})</span>
            </button>

            {/* 3. مازاد */}
            <button
              onClick={() => { setActiveMode('surplus'); setSelectedIndex(0); }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                activeMode === 'surplus'
                  ? 'bg-white text-blue-900 shadow-sm border border-blue-100/80 font-black scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Layers size={13} className="text-blue-600 shrink-0" />
              <span>مازاد ({toPersianNum(surplusList.length)})</span>
            </button>
          </div>
        </div>

        {/* Compact & Responsive Main Showcase Card */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${activeMode}-${selectedIndex}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 relative z-10 items-stretch"
            >
              
              {/* Left Column: Square Image Frame & Badges (4 Cols on Desktop) */}
              <div className="lg:col-span-4 bg-slate-50/80 rounded-xl border border-slate-200/60 p-2.5 relative group overflow-hidden flex flex-col items-center justify-between gap-2 text-right">
                
                {/* Top Badge Tag Bar above Image */}
                <div className="w-full flex items-center justify-between gap-1">
                  <span className={`bg-gradient-to-r ${modeTheme.primary} text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-3xs flex items-center gap-1 shrink-0`}>
                    <Percent size={10} className="text-white/80" />
                    <span>{toPersianNum(currentProduct.discountPercent || 30)}٪ سود</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200/70 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                    {currentProduct.factoryName || currentProduct.brand || 'کارخانه رسمی'}
                  </span>
                </div>

                {/* Perfect Square Image Container */}
                <div 
                  onClick={() => setPreviewImage(currentProduct.imageUrl || currentProduct.image_url)}
                  className="aspect-square w-full max-w-[210px] sm:max-w-[240px] flex items-center justify-center p-2 cursor-pointer relative bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xs group"
                >
                  <ProductImage 
                    src={currentProduct.imageUrl || currentProduct.image_url} 
                    alt={currentProduct.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-all duration-200"
                  />

                  {/* Hover Quick Action */}
                  <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-30 rounded-xl">
                    <span className="bg-white text-slate-900 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <Eye size={12} className={`${modeTheme.text}`} />
                      <span>آنالیز کالا</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Source & Status Badge below Image */}
                <div className="w-full text-center text-[10px] text-slate-600 font-bold truncate flex items-center justify-center gap-1.5 bg-white py-1 px-2 rounded-lg border border-slate-200/60 shadow-3xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>مبدا بارگیری: <strong className="text-slate-900">{currentProduct.factoryName || currentProduct.brand}</strong></span>
                </div>
              </div>

              {/* Right Column: Details & Pricing (8 Cols on Desktop) */}
              <div className="lg:col-span-8 flex flex-col justify-between gap-2.5 bg-white rounded-xl p-3 sm:p-4 border border-slate-200/60 shadow-3xs text-right">
                
                {/* Header Tag & Product Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className={`inline-flex items-center gap-1 bg-emerald-50 ${modeTheme.lightText} text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-200/50`}>
                      <Sparkles size={10} className="animate-pulse" />
                      <span>تامین مستقیم با تسویه امانی</span>
                    </div>

                    {currentProduct.carton_pack_count && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        هر کارتن {toPersianNum(currentProduct.carton_pack_count)} عددی
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-sm sm:text-base lg:text-lg font-black text-slate-950 leading-snug">
                    {currentProduct.name}
                  </h3>
                </div>

                {/* Pricing Matrix Row */}
                <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/60 space-y-2">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    {/* Wholesale Price */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] sm:text-xs text-slate-500 font-black">
                        {currentProduct.isRepresentative ? "قیمت عاملیت (کف):" : "قیمت عمده مستقیم:"}
                      </span>
                      <span className={`text-sm sm:text-base lg:text-lg font-black ${modeTheme.text}`}>
                        {toPersianNum(currentProduct.wholesalePriceStr)}
                      </span>
                    </div>

                    {/* Consumer Price */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] sm:text-xs text-slate-400 font-bold">روی جلد (مصرف‌کننده):</span>
                      <span className="text-xs sm:text-sm text-slate-400 line-through font-bold">
                        {toPersianNum(currentProduct.marketPriceStr)}
                      </span>
                    </div>
                  </div>

                  {/* Profit Margin Highlight */}
                  {currentProduct.unitProfit > 0 && (
                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <div className="flex items-center gap-1">
                        <Coins size={12} className={`${modeTheme.text}`} />
                        <span>سود خالص هر کارتن:</span>
                      </div>
                      <span className={`font-black text-xs ${modeTheme.text}`}>
                        {toPersianNum((currentProduct.unitProfit * (currentProduct.carton_pack_count || 1)).toLocaleString())} تومان
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    onClick={handleQuickAdd}
                    className={`w-full bg-gradient-to-r ${modeTheme.primary} text-white text-xs sm:text-sm font-black py-2.5 px-3 rounded-xl transition-all shadow-3xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap`}
                  >
                    <SpecialPriceBagIcon size={14} showBadge={true} animated={true} />
                    <span>{currentProduct.isAd ? "معامله امن بار" : "ثبت سفارش مستقیم"}</span>
                  </button>

                  <button
                    onClick={onBillboardClick}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-bold py-2.5 px-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs whitespace-nowrap"
                  >
                    <TrendingDown size={14} className="text-slate-500" />
                    <span>تالار بارهای زیر قیمت</span>
                  </button>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom: Fast Interactive Product Thumbnails Selector with Smooth Kinetic Horizontal Scrolling */}
        <div className="border-t border-slate-200/60 pt-3 mt-3 text-right">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] sm:text-xs text-slate-500 font-bold flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500 animate-spin" style={{ animationDuration: "3s" }} />
              <span>سایر بارهای فعال:</span>
            </span>
            <button 
              onClick={onOrderClick}
              className="text-[10px] sm:text-xs text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-0.5 cursor-pointer"
            >
              <span>مشاهده همه</span>
              <ChevronLeft size={11} />
            </button>
          </div>

          <div 
            ref={thumbnailsRef}
            className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory scroll-smooth cursor-grab active:cursor-grabbing text-right"
          >
            {currentList.map((prod: any, idx: number) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={`hero-thumb-${prod.id || 'item'}-${idx}`}
                  onClick={() => setSelectedIndex(idx)}
                  className={`p-1.5 rounded-xl border text-right transition-all flex items-center gap-2 cursor-pointer relative overflow-hidden shrink-0 min-w-[150px] sm:min-w-[180px] snap-center ${
                    isSelected
                      ? 'bg-white border-2 text-slate-950 shadow-sm scale-[1.02]'
                      : 'bg-white/60 hover:bg-white border-slate-200/80 text-slate-700'
                  }`}
                  style={isSelected ? { borderColor: activeMode === 'kaf_bazaar' ? '#e11d48' : activeMode === 'sediment' ? '#f59e0b' : '#2563eb' } : {}}
                >
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-3xs">
                    <ProductImage 
                      src={prod.image_url || prod.imageUrl} 
                      alt={prod.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  <div className="truncate flex-1 min-w-0">
                    <span className="text-[11px] font-black block truncate text-slate-900">{prod.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold block truncate mt-0.5">
                      {prod.factoryName || prod.brand || 'کارخانه رسمی'}
                    </span>
                  </div>

                  {/* Active Micro Dot Indicator */}
                  {isSelected && (
                    <span className={`absolute top-1 left-1 w-2.5 h-2.5 rounded-full ${
                      activeMode === 'kaf_bazaar' ? 'bg-rose-500' : activeMode === 'sediment' ? 'bg-amber-500' : 'bg-blue-600'
                    } animate-ping`} />
                  )}
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
