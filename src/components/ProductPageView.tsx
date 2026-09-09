import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowRight, 
  ShoppingCart, 
  Building2, 
  Truck, 
  ShieldCheck, 
  Award, 
  Share2, 
  Copy, 
  Check, 
  Heart, 
  Scale, 
  Sparkles, 
  Package, 
  PhoneCall, 
  ChevronLeft, 
  AlertCircle, 
  TrendingUp, 
  Layers, 
  Clock, 
  FileText, 
  Coins, 
  Flame, 
  Printer, 
  Percent, 
  ShieldAlert, 
  Star,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { getDisplayImageUrl } from '../lib/image-utils';
import { toPersianNum } from '../utils/persian-utils';
import { ProductImage } from './ProductImage';
import { getProductRolePricing } from '../lib/pricing';

interface ProductPageViewProps {
  product: Product;
  allProducts: Product[];
  onBack: () => void;
  onAddToCart: (product: Product, quantityCartons: number) => void;
  onSelectProduct?: (product: Product) => void;
  onOpenSafeBuy?: (product: Product) => void;
  onOpenConsultation?: (phone?: string) => void;
  b2bConfig?: any;
  user?: any;
  userBadge?: any;
}

export default function ProductPageView({
  product,
  allProducts,
  onBack,
  onAddToCart,
  onSelectProduct,
  onOpenSafeBuy,
  onOpenConsultation,
  b2bConfig,
  user,
  userBadge
}: ProductPageViewProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'tiers' | 'factory' | 'warranty'>('specs');
  const [addedToast, setAddedToast] = useState(false);

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Update document title for SEO & Torob
    const prevTitle = document.title;
    document.title = `${product.name} | خرید عمده از کارخانه ${product.brand || product.factoryName || ''} - دست اول`;
    return () => {
      document.title = prevTitle;
    };
  }, [product]);

  // Gallery Images
  const galleryImages = useMemo(() => {
    const images: string[] = [];
    if (product.image_url) images.push(product.image_url);
    if ((product as any).imageUrl) images.push((product as any).imageUrl);
    if (Array.isArray((product as any).galleryImages)) {
      (product as any).galleryImages.forEach((img: string) => {
        if (img && !images.includes(img)) images.push(img);
      });
    }
    return images.length > 0 ? images : ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80'];
  }, [product]);

  const unitsPerBox = Number(product.carton_pack_count) || Number((product as any).unitsPerBox) || 12;
  const unitWeightKg = Number((product as any).unit_weight_kg) || 0.040; // Default 40g per pack
  const cartonNetWeight = product.carton_net_weight_kg || (unitsPerBox * unitWeightKg);
  // Realistically, if net weight is over 40kg for a standard grocery carton, it's likely a data error
  const displayNetWeight = cartonNetWeight > 40 && unitWeightKg < 0.1 ? (unitsPerBox * unitWeightKg) : cartonNetWeight;
  const cartonGrossWeight = product.carton_gross_weight_kg || (displayNetWeight * 1.05); // +5% for packaging
  const displayGrossWeight = cartonGrossWeight > 45 && unitWeightKg < 0.1 ? (displayNetWeight * 1.08) : cartonGrossWeight;

  // Consistent Role-Based Pricing via getProductRolePricing
  const pricing = useMemo(() => getProductRolePricing(product, user, userBadge, b2bConfig), [product, user, userBadge, b2bConfig]);
  
  const consumerPrice = pricing.displayConsumerPrice;
  const baseWholesaleUnitPrice = pricing.unitWholesalePrice;
  const baseCartonPrice = pricing.pricePerCarton;
  
  const palletDiscountPercent = Number(product.discount_percent) || Number((product as any).palletDiscountPercent) || 5;
  const palletCartons = Number((product as any).palletCapacity) || 48;
  const trailerDiscountPercent = Number((product as any).trailerDiscountPercent) || (palletDiscountPercent > 0 ? palletDiscountPercent + 5 : 10);

  // Profit margins
  const unitProfitMargin = pricing.profitMarginPercent;
  const totalCartonProfit = pricing.profitPerCartonVsConsumer;

  // Current tier calculation based on selected cartons
  const currentDiscountPercent = useMemo(() => {
    if (quantity >= palletCartons * 4) return trailerDiscountPercent;
    if (quantity >= palletCartons) return palletDiscountPercent;
    return 0;
  }, [quantity, palletCartons, palletDiscountPercent, trailerDiscountPercent]);

  const finalUnitPrice = Math.round(baseWholesaleUnitPrice * (1 - currentDiscountPercent / 100));
  const finalCartonPrice = finalUnitPrice * unitsPerBox;
  const totalPrice = finalCartonPrice * quantity;

  // Related products from same category or factory
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter(p => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
      .slice(0, 4);
  }, [allProducts, product]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 pt-4" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between py-3 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 overflow-x-auto whitespace-nowrap">
            <button onClick={onBack} className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <span>صفحه اصلی</span>
            </button>
            <ChevronLeft size={14} className="text-slate-400" />
            <span className="text-slate-600">{product.category || 'کالای عمده'}</span>
            <ChevronLeft size={14} className="text-slate-400" />
            <span className="text-amber-700 font-extrabold truncate max-w-xs">{product.name}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all shadow-2xs cursor-pointer"
              title="کپی لینک مستقیم محصول"
            >
              {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} className="text-slate-500" />}
              <span>{copiedUrl ? 'لینک کپی شد' : 'اشتراک‌گذاری'}</span>
            </button>

            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <ArrowRight size={14} />
              <span>بازگشت</span>
            </button>
          </div>
        </div>

        {/* Main Product Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-xs mb-8">
          
          {/* Left / Gallery Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="relative w-full h-64 sm:h-72 lg:h-80 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-3">
              <ProductImage
                src={galleryImages[selectedImageIndex] || product.image_url || ''}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
              />

              {/* Status Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                {product.isKafBazaar && (
                  <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                    <Flame size={12} />
                    قیمت کف بازار
                  </span>
                )}
                {(product as any).isDirectSupply && (
                  <span className="bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                    <Building2 size={12} />
                    عرضه مستقیم کارخانه
                  </span>
                )}
                {product.hasHealthApple && (
                  <span className="bg-emerald-600 text-white border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                    🍏 دارای نشان سیب سلامت
                  </span>
                )}
              </div>

              {/* Discount Tag */}
              {unitProfitMargin > 0 && (
                <div className="absolute bottom-3 left-3 bg-emerald-500 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1">
                  <span>{toPersianNum(unitProfitMargin)}٪ سود فروشگاه</span>
                </div>
              )}
            </div>

            {/* Thumbnail list */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl border-2 p-1 bg-slate-50 shrink-0 transition-all cursor-pointer ${
                      selectedImageIndex === idx ? 'border-emerald-500 shadow-xs' : 'border-slate-200 hover:border-slate-300 opacity-70'
                    }`}
                  >
                    <img src={getDisplayImageUrl(img)} alt="" className="w-full h-full object-contain rounded-lg" />
                  </button>
                ))}
              </div>
            )}

            {/* Factory & Warranty Guarantee Card */}
            <div className="bg-gradient-to-br from-emerald-50/60 to-slate-50 border border-emerald-200/70 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between font-black text-slate-800">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  ضمانت اصالت و سلامت فیزیکی بار
                </span>
                <span className="text-amber-700 bg-emerald-100/80 px-2 py-0.5 rounded-md font-bold">دست اول</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                تحویل مستقیم از درب کارخانه یا انبار رسمی با فاکتور معتبر رسمی، بدون واسطه و با تضمین تاریخ انقضای معتبر و استاندارد ملی.
              </p>
            </div>
          </div>

          {/* Right / Product Details & Order Box (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Manufacturer, Brand & Code Header */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mb-2 gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Building2 size={14} className="text-emerald-600" />
                    مبدا بارگیری / کارخانه: <strong className="text-slate-900 font-black">{product.factoryName || product.brand || 'کارخانه همکار دست اول'}</strong>
                  </span>
                  {product.brand && (
                    <span className="flex items-center gap-1 font-bold text-slate-600">
                      برند: <strong className="text-slate-900 font-black">{product.brand}</strong>
                    </span>
                  )}
                  {product.supplierName && (
                    <span className="flex items-center gap-1 font-bold text-slate-600">
                      تأمین‌کننده: <strong className="text-slate-900 font-black">{product.supplierName}</strong>
                    </span>
                  )}
                </div>
                <span className="font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                  کد: {(product as any).code || product.id}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 leading-tight mb-3">
                {product.name}
              </h1>

              {/* Short Description */}
              {product.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* Key Quick Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block mb-0.5">تعداد در کارتن</span>
                  <strong className="text-sm font-black text-slate-900">{toPersianNum(unitsPerBox)} عدد</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block mb-0.5">ظرفیت هر پالت</span>
                  <strong className="text-sm font-black text-slate-900">{toPersianNum(palletCartons)} کارتن</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block mb-0.5">ارسال سفارش</span>
                  <strong className="text-sm font-black text-emerald-700">۱ الی ۳ روز کاری</strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                  <span className="text-[10px] text-slate-500 font-bold block mb-0.5">نوع تسویه</span>
                  <strong className="text-sm font-black text-slate-900">نقد / چک صیادی</strong>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 mb-6 shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 font-bold block mb-1">قیمت عمده کارخانه (هر عدد):</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl font-black text-amber-400">
                        {toPersianNum(finalUnitPrice.toLocaleString())}
                      </span>
                      <span className="text-xs font-bold text-slate-300">تومان</span>
                    </div>
                    {consumerPrice > finalUnitPrice && (
                      <span className="text-xs text-slate-400 line-through mt-1 block">
                        قیمت درج روی جلد (مصرف‌کننده): {toPersianNum(consumerPrice.toLocaleString())} تومان
                      </span>
                    )}
                  </div>

                  <div className="sm:text-left border-t sm:border-t-0 sm:border-r border-slate-800 pt-3 sm:pt-0 sm:pr-6 w-full sm:w-auto">
                    <span className="text-xs text-slate-400 font-bold block mb-1">قیمت هر کارتن ({toPersianNum(unitsPerBox)} عددی):</span>
                    <div className="flex items-baseline gap-2 sm:justify-end">
                      <span className="text-xl sm:text-2xl font-black text-emerald-400">
                        {toPersianNum(finalCartonPrice.toLocaleString())}
                      </span>
                      <span className="text-xs font-bold text-slate-300">تومان</span>
                    </div>
                    <span className="text-[11px] text-emerald-300/90 font-bold block mt-1">
                      💰 سود شما در هر کارتن: {toPersianNum(totalCartonProfit.toLocaleString())} تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wholesale Order Action Controls */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                
                {/* Quantity Controls */}
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="text-xs font-black text-slate-700">تعداد کارتن:</span>
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 text-center font-black text-sm text-slate-900 outline-none"
                    />
                    <button
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 font-bold hidden sm:block">
                    مجموع کالا: <strong className="text-slate-900 font-black">{toPersianNum(quantity * unitsPerBox)}</strong> عدد
                  </div>
                </div>

                {/* Total Calculated Price */}
                <div className="text-left">
                  <span className="text-[11px] text-slate-500 font-bold block">مبلغ کل پیش‌فاکتور:</span>
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className="text-xl font-black text-slate-950">
                      {toPersianNum(totalPrice.toLocaleString())}
                    </span>
                    <span className="text-xs font-bold text-slate-600">تومان</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-5 rounded-full flex items-center justify-center gap-2 transition-all duration-250 hover:shadow-lg shadow-md shadow-emerald-600/10 active:scale-[0.95] cursor-pointer"
                >
                  <ShoppingCart size={18} />
                  <span>افزودن به سبد خرید عمده</span>
                </button>

                {onOpenSafeBuy && (
                  <button
                    onClick={() => onOpenSafeBuy(product)}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <ShieldCheck size={18} />
                    <span>خرید با ضمانت امن و تسویه امانی</span>
                  </button>
                )}
              </div>

              {/* Added Toast Notification */}
              {addedToast && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    {toPersianNum(quantity)} کارتن {product.name} با موفقیت به سبد خرید اضافه شد.
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Tabs Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-xs mb-8">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'specs' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText size={15} />
              مشخصات فنی و استانداردهای کالا
            </button>

            <button
              onClick={() => setActiveTab('tiers')}
              className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'tiers' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Layers size={15} />
              جدول تخفیف‌های حجمی و تناژ
            </button>

            <button
              onClick={() => setActiveTab('factory')}
              className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'factory' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Building2 size={15} />
              درباره کارخانه و عاملیت‌ها
            </button>
          </div>

          {/* TAB 1: Specifications */}
          {activeTab === 'specs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">نام تجاری کالا:</span>
                <strong className="text-slate-900 font-black">{product.name}</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">تولیدکننده / برند:</span>
                <strong className="text-slate-900 font-black">{product.brand || product.factoryName || 'کارخانه رسمی'}</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">دسته‌بندی تخصصی:</span>
                <strong className="text-slate-900 font-black">{product.category || 'مواد غذایی و مصرفی'}</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">تعداد در هر کارتن:</span>
                <strong className="text-slate-900 font-black">{toPersianNum(unitsPerBox)} عدد در شیرینگ/کارتن</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">وزن خالص کارتن:</span>
                <strong className="text-slate-900 font-black">{toPersianNum(cartonNetWeight.toFixed(2))} کیلوگرم</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">وزن ناخالص کارتن:</span>
                <strong className="text-slate-900 font-black">{toPersianNum(cartonGrossWeight.toFixed(2))} کیلوگرم</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">مجوز و استاندارد:</span>
                <strong className="text-emerald-700 font-black">دارای استاندارد ملّی ایران و سیب سلامت</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">حداقل تاریخ انقضا:</span>
                <strong className="text-slate-900 font-black">تولید روز (حداقل ۱۲ تا ۱۸ ماه تاریخ اعتبار)</strong>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold">شهر انبار مبدا:</span>
                <strong className="text-slate-900 font-black">{(product as any).factoryCity || 'تهران / انبار مرکزی'}</strong>
              </div>
            </div>
          )}

          {/* TAB 2: Tiers */}
          {activeTab === 'tiers' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                    <th className="p-3 rounded-r-xl">حجم سفارش</th>
                    <th className="p-3">حداقل تیراژ (کارتن)</th>
                    <th className="p-3">درصد تخفیف</th>
                    <th className="p-3">قیمت هر کارتن (تومان)</th>
                    <th className="p-3 rounded-l-xl">نحوه حمل و بارگیری</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3">خرد و کارتنی (پخش محلی)</td>
                    <td className="p-3 font-mono">{toPersianNum('1')} کارتن به بالا</td>
                    <td className="p-3 text-slate-500">پایه کارخانه</td>
                    <td className="p-3 font-mono font-black text-slate-900">{toPersianNum(baseCartonPrice.toLocaleString())}</td>
                    <td className="p-3">وانت / باربری وطن و کالارسان</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-emerald-50/40">
                    <td className="p-3 text-amber-900 font-black">سفارش پالتی (بنکداری)</td>
                    <td className="p-3 font-mono">{toPersianNum(palletCartons)} کارتن (۱ پالت)</td>
                    <td className="p-3 text-emerald-700 font-black">{toPersianNum(palletDiscountPercent)}٪ تخفیف مازاد</td>
                    <td className="p-3 font-mono font-black text-emerald-700">{toPersianNum((baseCartonPrice * (1 - palletDiscountPercent / 100)).toLocaleString())}</td>
                    <td className="p-3">خاور مسقف دربستی با بارنامه دولتی</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-emerald-50/40">
                    <td className="p-3 text-slate-900 font-black">سفارش تریلی / ماشین کامل (نمایندگی)</td>
                    <td className="p-3 font-mono">{toPersianNum(palletCartons * 4)} کارتن به بالا</td>
                    <td className="p-3 text-emerald-700 font-black">{toPersianNum(trailerDiscountPercent)}٪ تخفیف مازاد</td>
                    <td className="p-3 font-mono font-black text-emerald-700">{toPersianNum((baseCartonPrice * (1 - trailerDiscountPercent / 100)).toLocaleString())}</td>
                    <td className="p-3">ارسال مستقیم از خط تولید با تریلی ترانزیت</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Factory */}
          {activeTab === 'factory' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <Building2 size={24} className="text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-black text-sm text-slate-900">{product.brand || product.factoryName || 'کارخانجات همکار سامانه ملّی دست اول'}</h4>
                  <p className="text-slate-500 mt-0.5">تولیدکننده رسمی با خطوط صنعتی پیشرفته و تاییدیه‌های سلامت و ایمنی غذا</p>
                </div>
              </div>
              <p>
                تمامی سفارش‌های ثبت شده در سامانه دست اول مستقیماً به پنل تجاری کارخانه و دپارتمان فروش سازمانی ارجاع داده شده و تخصیص سهمیه صورت می‌پذیرد. خریداران عمده و بنکداران محترم می‌توانند جهت عقد قراردادهای توزیع انحصاری در شهر خود درخواست نمایندگی ثبت فرمایند.
              </p>
            </div>
          )}

          {/* TAB 4: Custom Features / Specs */}
          {product.specifications && product.specifications.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <h3 className="font-black text-sm text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                ویژگی‌های فنی و سفارشی کالا
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {product.specifications.map((spec, i) => (
                  <div key={i} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold mb-1">{spec.key}</span>
                    <strong className="text-xs font-black text-slate-800">{spec.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-500" />
                کالاهای مشابه و مکمل عمده
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => onSelectProduct && onSelectProduct(rel)}
                  className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="aspect-square bg-slate-50 rounded-xl mb-3 flex items-center justify-center p-2">
                    <img src={getDisplayImageUrl((rel as any).imageUrl || rel.image_url || '')} alt={rel.name} className="max-h-full max-w-full object-contain" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-1">{rel.brand || rel.factoryName}</span>
                    <h4 className="font-black text-xs text-slate-900 line-clamp-2 mb-2">{rel.name}</h4>
                    <div className="flex items-baseline justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500">قیمت عمده:</span>
                      <strong className="text-emerald-600 font-black">{toPersianNum(Number(rel.price || 0).toLocaleString())} ت</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
