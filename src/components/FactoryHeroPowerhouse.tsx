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

const initialAdsFallback = [
  {
    id: "ad-1",
    title: "قند شکسته درجه یک ۵ کیلویی مازاد خط تولید (بدون افشای برند)",
    description: "تعداد ۵۰ تن بار مازاد قند کله شکسته درجه یک در بسته‌بندی‌های نایلونی ۵ کیلویی استاندارد با سیب سلامت بدون ذکر برند جهت ممانعت از تنش قیمتی در بازار مصرف.",
    factoryName: "صنایع قند و شکر مرودشت",
    contactPerson: "مهندس رسولی",
    contactPhone: "۰۹۱۲۳۴۵۶۷۸۹",
    badgeText: "📉 زیر قیمت بازار",
    category: "under_market",
    quantity: "۵۰ تن",
    wholesalePrice: "۳۸,۰۰۰ تومان",
    marketPrice: "۵۴,۰۰۰ تومان",
    buyerProfit: "۳۰٪ سود ناخالص (۱۶,۰۰۰ تومان حاشیه سود)",
    isSponsored: true,
    date: "۱۴۰۵/۰۵/۲۲",
    imageUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&q=80&w=400",
    status: "approved"
  },
  {
    id: "ad-2",
    title: "روغن سویا مصارف صنعتی حلب ۱۶ کیلویی استاندارد",
    description: "روغن مایع خوراکی تصفیه شده سویا حلب فلزی ۱۶ کیلویی با فاکتور رسمی مستقیم کارخانه شیراز بدون نام برند انحصاری جهت حفظ ثبات و اعتبار تجاری کارخانه.",
    factoryName: "کشت و صنعت روغن شمال",
    contactPerson: "حاج علی رحیمی",
    contactPhone: "۰۹۱۲۹۹۹۸۸۷۷",
    badgeText: "🔥 حراج مفت کارخانه",
    category: "liquid",
    quantity: "۱۵ تن",
    wholesalePrice: "۶۲۰,۰۰۰ تومان",
    marketPrice: "۸۴۰,۰۰۰ تومان",
    buyerProfit: "۲۶٪ حاشیه سود واقعی (۲۲۰,۰۰۰ تومان صرفه‌جویی)",
    isSponsored: true,
    date: "۱۴۰۵/۰۵/۲۱",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400",
    status: "approved"
  },
  {
    id: "ad-3",
    title: "رب گوجه فرنگی قوطی ۸۰۰ گرمی صادراتی بریکس ۲۷",
    description: "بار مازاد ۴۰ هزار قوطی رب گوجه فرنگی غلیظ با کیفیت استثنایی و رنگ فوق‌العاده. به جهت حفظ ثبات قیمت بازار، برند کالا محرمانه مانده و تحویل از طریق واسطه امین انجام می‌پذیرد.",
    factoryName: "توسعه صنایع غذایی دشت شیراز",
    contactPerson: "مهندس سلیمانی",
    contactPhone: "۰۹۱۷۳۳۳۴۴۵۵",
    badgeText: "📉 کف قیمت بازار",
    category: "under_market",
    quantity: "۴۰,۰۰۰ قوطی",
    wholesalePrice: "۳۲,۰۰۰ تومان",
    marketPrice: "۴۹,۰۰0 تومان",
    buyerProfit: "۳۵٪ سود تضمینی (۱۷,۰۰۰ تومان اختلاف قیمت)",
    isSponsored: true,
    date: "۱۴۰۵/۰۵/۲۰",
    imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400",
    status: "approved"
  }
];

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
  const [ads, setAds] = useState<any[]>([]);

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

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian: Record<string, string> = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => persian[w] || w);
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
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
        image_url: item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
        wholesalePriceStr,
        marketPriceStr,
        buyerProfitStr,
        discountPercent,
        min_order_cartons: 1,
        carton_pack_count: 1,
        isAd: true,
        quantity: item.quantity || 'نامشخص',
        rawAd: item
      };
    } else {
      const wholesaleUnitPrice = item.bulk_price || item.price;
      const marketUnitPrice = item.consumer_price || Math.round(item.price * 1.35);
      const discountPercent = marketUnitPrice > wholesaleUnitPrice 
        ? Math.round(((marketUnitPrice - wholesaleUnitPrice) / marketUnitPrice) * 100)
        : 25;
      
      const wholesalePriceStr = wholesaleUnitPrice.toLocaleString('fa-IR') + ' تومان';
      const marketPriceStr = marketUnitPrice.toLocaleString('fa-IR') + ' تومان';
      const buyerProfitStr = discountPercent + '٪ حاشیه سود';

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
        min_order_cartons: item.min_order_cartons || 2,
        carton_pack_count: item.carton_pack_count || 24,
        isAd: false
      };
    }
  };

  // 1. Process REAL products from database / props / localStorage ads
  const { underMarketList, liquidList, featuredList } = useMemo(() => {
    const activeAds = ads.length > 0 ? ads : initialAdsFallback;
    const approvedAds = activeAds.filter((ad: any) => ad.status === 'approved' || !ad.status);

    // Filter under_market ads
    const underMarketAds = approvedAds
      .filter((ad: any) => ad.category === 'under_market')
      .map((ad: any) => normalizeItem(ad, true));

    // Filter liquid ads
    const liquidAds = approvedAds
      .filter((ad: any) => ad.category === 'liquid')
      .map((ad: any) => normalizeItem(ad, true));

    // Process Catalog Products
    const processedProducts = (products || []).map((prod) => normalizeItem(prod, false));

    // Fallbacks if ads of specific category are empty
    const finalUnderMarket = underMarketAds.length > 0 
      ? underMarketAds.slice(0, 4)
      : processedProducts.sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 4);

    const finalLiquid = liquidAds.length > 0 
      ? liquidAds.slice(0, 4)
      : processedProducts.sort((a, b) => b.discountPercent - a.discountPercent).slice(0, 4);

    // Featured / High reputation factories (from catalog products)
    const featured = processedProducts
      .filter(p => p.isFeatured || (p.rating && p.rating >= 4.8))
      .slice(0, 4);
    const finalFeatured = featured.length > 0 ? featured : processedProducts.slice(0, 4);

    return {
      underMarketList: finalUnderMarket,
      liquidList: finalLiquid,
      featuredList: finalFeatured
    };
  }, [products, ads]);

  const currentList = activeMode === 'under_market' 
    ? underMarketList 
    : activeMode === 'liquid' 
    ? liquidList 
    : featuredList;

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
      if (onAddToCart && currentProduct) {
        onAddToCart(currentProduct, currentProduct.min_order_cartons || 2);
      } else if (onOrderClick) {
        onOrderClick();
      }
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
              {currentProduct.isAd ? (
                <>مقدار موجود: {toPersianNum(currentProduct.quantity)}</>
              ) : (
                <>حداقل سفارش: {toPersianNum(currentProduct.min_order_cartons)} کارتن ({toPersianNum(currentProduct.carton_pack_count)} عددی)</>
              )}
            </div>
          </div>

          <div className="text-left space-y-1 shrink-0">
            <div className="flex items-center gap-1 justify-end">
              <span className="text-[10px] text-slate-400 line-through">
                {currentProduct.isAd ? (
                  toPersianNum(currentProduct.marketPriceStr)
                ) : (
                  toPersianNum(currentProduct.marketPriceStr)
                )}
              </span>
              <span className="text-[9px] bg-rose-100 text-rose-700 font-black px-1.5 py-0.2 rounded">بازار آزاد</span>
            </div>
            <div className="flex items-center gap-1 justify-end">
              <span className="text-sm font-black text-emerald-600">
                {currentProduct.isAd ? (
                  toPersianNum(currentProduct.wholesalePriceStr)
                ) : (
                  toPersianNum(currentProduct.wholesalePriceStr)
                )}
              </span>
              <span className="text-[9px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded">کف کارخانه</span>
            </div>
            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded block text-center truncate max-w-[130px]">
              {currentProduct.isAd ? (
                toPersianNum(currentProduct.buyerProfitStr)
              ) : (
                <>سود شما: {toPersianNum(currentProduct.discountPercent)}٪</>
              )}
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
            <span>{currentProduct.isAd ? "شروع معامله امن" : "ثبت سفارش مستقیم این کالا"}</span>
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
