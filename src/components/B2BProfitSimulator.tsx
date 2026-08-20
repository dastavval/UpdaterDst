import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  TrendingUp, 
  Sparkles, 
  ShoppingBag, 
  ShieldCheck, 
  ArrowLeft, 
  Percent, 
  Package, 
  Repeat, 
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Product } from '../types';

interface B2BProfitSimulatorProps {
  products: Product[];
  onExploreProducts: () => void;
  onSelectCategory?: (category: string) => void;
  onAddToCart?: (product: Product, quantityCartons: number) => void;
}

export const B2BProfitSimulator: React.FC<B2BProfitSimulatorProps> = ({
  products,
  onExploreProducts,
  onSelectCategory,
  onAddToCart
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [monthlyCartons, setMonthlyCartons] = useState<number>(30);
  const [selectedSector, setSelectedSector] = useState<'chocolate' | 'cake' | 'sour' | 'drinks'>('chocolate');
  const [compoundHorizonMonths, setCompoundHorizonMonths] = useState<number>(12);
  const [reinvestRatio, setReinvestRatio] = useState<number>(80);

  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
  };

  // Sector metrics
  const sectorData = {
    chocolate: {
      name: "شکلات و تنقلات",
      avgCartonConsumerPrice: 480000,
      avgCartonFactoryPrice: 320000,
      avgMarketBrokerPrice: 395000,
      categoryName: "تنقلات و شکلات",
      turnoverDays: 14
    },
    cake: {
      name: "کیک و بیسکویت",
      avgCartonConsumerPrice: 420000,
      avgCartonFactoryPrice: 280000,
      avgMarketBrokerPrice: 345000,
      categoryName: "کیک، کلوچه و بیسکویت",
      turnoverDays: 10
    },
    sour: {
      name: "لواشک و ترشیجات",
      avgCartonConsumerPrice: 560000,
      avgCartonFactoryPrice: 370000,
      avgMarketBrokerPrice: 470000,
      categoryName: "مواد غذایی و کنسروجات",
      turnoverDays: 18
    },
    drinks: {
      name: "نوشیدنی و آبمیوه",
      avgCartonConsumerPrice: 510000,
      avgCartonFactoryPrice: 340000,
      avgMarketBrokerPrice: 420000,
      categoryName: "نوشیدنی‌ها",
      turnoverDays: 12
    }
  };

  const currentSector = sectorData[selectedSector];

  // Calculations
  const totalFactoryCost = monthlyCartons * currentSector.avgCartonFactoryPrice;
  const totalMarketBrokerCost = monthlyCartons * currentSector.avgMarketBrokerPrice;
  const totalConsumerRevenue = monthlyCartons * currentSector.avgCartonConsumerPrice;

  const directSavingsMonthly = totalMarketBrokerCost - totalFactoryCost;
  const totalNetProfitMonthly = totalConsumerRevenue - totalFactoryCost;
  
  const profitMarginPercent = totalFactoryCost > 0 ? Math.round((totalNetProfitMonthly / totalFactoryCost) * 100) : 0;

  const dailyProfit = Math.round(totalNetProfitMonthly / 30);
  const dailyDirectSavings = Math.round(directSavingsMonthly / 30);

  const monthlyRate = totalFactoryCost > 0 ? (totalNetProfitMonthly / totalFactoryCost) * (reinvestRatio / 100) : 0;
  const compoundFutureValue = Math.round(totalFactoryCost * Math.pow(1 + monthlyRate, compoundHorizonMonths));
  const compoundTotalProfit = compoundFutureValue - totalFactoryCost;
  
  const linearTotalProfit = totalNetProfitMonthly * compoundHorizonMonths;
  const compoundAdvantage = Math.max(0, compoundTotalProfit - linearTotalProfit);

  const sampleProduct = products.find(p => 
    p.category === currentSector.categoryName || 
    p.name.includes(currentSector.name)
  ) || products[0];

  return (
    <div className="w-full bg-linear-to-b from-white to-slate-50/50 border-2 border-emerald-500/20 hover:border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300" dir="rtl">
      {/* Accordion Toggle Header Banner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 sm:px-6 flex items-center justify-between gap-4 bg-linear-to-r from-emerald-900/5 to-transparent hover:from-emerald-900/10 transition-all text-right border-b border-slate-100 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold border border-emerald-400/20 shadow-md shadow-emerald-500/15 shrink-0 animate-pulse">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-[12px] sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <span>ماشین‌حساب هوشمند سود روزانه و مرکب بازرگانی دست اول</span>
              <span className="bg-emerald-600 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                بررسی سود تصاعدی
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              محاسبه کنید: با خرید مستقیم و گردش سرمایه چقدر سود مرکب به دست می‌آورید؟ (جهت نمایش کلیک کنید)
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp size={20} className="text-emerald-600" /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Accordion Collapsible Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-6 border-t border-slate-100">
              {/* Sector Tabs Inside */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-black text-slate-500 mr-2">انتخاب حوزه تجاری:</span>
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto no-scrollbar">
                  {[
                    { id: 'chocolate', label: '🍫 تنقلات و شکلات' },
                    { id: 'cake', label: '🍪 کیک و بیسکویت' },
                    { id: 'sour', label: '🥫 مواد غذایی و کنسرو' },
                    { id: 'drinks', label: '🧃 نوشیدنی‌ها' },
                  ].map((sec) => (
                    <button
                      key={sec.id}
                      onClick={() => setSelectedSector(sec.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-[10.5px] font-black whitespace-nowrap transition-all cursor-pointer ${
                        selectedSector === sec.id
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Matrix Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Inputs Column (5 cols) */}
                <div className="lg:col-span-5 space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  
                  {/* Monthly Volume */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                      <span className="flex items-center gap-1">
                        <Package size={14} className="text-emerald-600" />
                        حجم خرید ماهانه شما:
                      </span>
                      <span className="font-mono text-emerald-700 text-xs bg-emerald-50 px-2.5 py-0.5 rounded-lg font-black border border-emerald-100">
                        {toPersianNum(monthlyCartons)} کارتن در ماه
                      </span>
                    </div>

                    <input
                      type="range"
                      min="5"
                      max="200"
                      step="5"
                      value={monthlyCartons}
                      onChange={(e) => setMonthlyCartons(parseInt(e.target.value, 10))}
                      className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                    />

                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>۵ کارتن</span>
                      <span>۵۰ کارتن (بنکدار)</span>
                      <span>۲۰۰ کارتن (پخش)</span>
                    </div>
                  </div>

                  {/* Quick Scale Presets */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 block">انتخاب سریع بر اساس مقیاس:</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { count: 10, label: "خرده‌فروش (۱۰)" },
                        { count: 40, label: "بنکدار (۴۰)" },
                        { count: 120, label: "شرکت پخش (۱۲۰)" }
                      ].map(preset => (
                        <button
                          key={preset.count}
                          type="button"
                          onClick={() => setMonthlyCartons(preset.count)}
                          className={`py-1.5 px-1 text-center rounded-lg text-[9px] font-black border transition-all cursor-pointer ${
                            monthlyCartons === preset.count
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Compound Horizon Months */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs font-black text-slate-700">
                      <span className="flex items-center gap-1 text-amber-700">
                        <Repeat size={14} className="text-amber-500" />
                        مدت بازسرمایه‌گذاری (سود مرکب):
                      </span>
                      <span className="font-mono text-amber-700 text-xs bg-amber-50 px-2 rounded-lg font-black border border-amber-100">
                        {toPersianNum(compoundHorizonMonths)} ماهه
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { months: 3, label: '۳ ماهه (فصلی)' },
                        { months: 6, label: '۶ ماهه (نیم‌سال)' },
                        { months: 12, label: '۱۲ ماهه (۱ ساله)' }
                      ].map(item => (
                        <button
                          key={item.months}
                          onClick={() => setCompoundHorizonMonths(item.months)}
                          className={`py-1.5 text-center rounded-lg text-[9px] font-black border transition-all cursor-pointer ${
                            compoundHorizonMonths === item.months
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Comparison Info */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[10px] font-bold">
                    <div className="flex justify-between text-slate-400">
                      <span>خرید معادل از دلالان سنتی:</span>
                      <span className="line-through text-rose-500 font-mono">
                        {toPersianNum(totalMarketBrokerCost.toLocaleString())} ت
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-black">
                      <span>خرید مستقیم در دست اول:</span>
                      <span className="font-mono">
                        {toPersianNum(totalFactoryCost.toLocaleString())} ت
                      </span>
                    </div>
                  </div>

                </div>

                {/* Highlights and Compound Area (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    
                    {/* Daily Profit */}
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-100">
                          ⚡ سود روزانه شما
                        </span>
                        <Calendar size={12} className="text-cyan-500" />
                      </div>
                      <div>
                        <div className="text-sm font-black font-mono text-cyan-700">
                          +{toPersianNum(dailyProfit.toLocaleString())} <span className="text-[9px] text-slate-400 font-normal">تومان</span>
                        </div>
                        <p className="text-[8px] text-slate-400 leading-tight">
                          ذخیره نقدی: {toPersianNum(dailyDirectSavings.toLocaleString())} تومان/روز
                        </p>
                      </div>
                    </div>

                    {/* Monthly Profit */}
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          💰 سود ماهانه
                        </span>
                        <TrendingUp size={12} className="text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-sm font-black font-mono text-emerald-700">
                          +{toPersianNum(totalNetProfitMonthly.toLocaleString())} <span className="text-[9px] text-slate-400 font-normal">تومان</span>
                        </div>
                        <p className="text-[8px] text-slate-400 leading-tight">
                          صرفه‌جویی مستقیم: {toPersianNum(directSavingsMonthly.toLocaleString())} ت
                        </p>
                      </div>
                    </div>

                    {/* ROI */}
                    <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          📊 بازدهی (ROI)
                        </span>
                        <Percent size={12} className="text-amber-500" />
                      </div>
                      <div>
                        <div className="text-sm font-black font-mono text-amber-700">
                          ٪{toPersianNum(profitMarginPercent)} <span className="text-[9px] text-slate-400 font-normal">سود ناخالص</span>
                        </div>
                        <p className="text-[8px] text-slate-400 leading-tight">
                          چرخه گردش کالا: {toPersianNum(currentSector.turnoverDays)} روزه
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Compound Box */}
                  <div className="bg-linear-to-br from-emerald-50/40 via-teal-50/20 to-slate-50/50 p-4 rounded-xl border border-emerald-100/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100/50 pb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <Sparkles size={12} />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-slate-800 flex items-center gap-1">
                            <span>تاثیر شگفت‌انگیز سود مرکب در {toPersianNum(compoundHorizonMonths)} ماه</span>
                          </h4>
                          <p className="text-[8.5px] text-emerald-700/90 font-bold">
                            اگر سود خود را مجدداً وارد چرخه خرید عمده محصولات نمایید:
                          </p>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-[8px] text-slate-400 block font-bold">کل سرمایه + سود نهایی:</span>
                        <span className="text-xs sm:text-sm font-black font-mono text-emerald-700">
                          {toPersianNum(compoundFutureValue.toLocaleString())} تومان
                        </span>
                      </div>
                    </div>

                    {/* Chart details */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[8.5px] font-bold">
                      <div className="bg-white p-1.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block">سود خطی ساده:</span>
                        <span className="font-mono font-black text-slate-700">
                          {toPersianNum(linearTotalProfit.toLocaleString())} ت
                        </span>
                      </div>
                      <div className="bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100">
                        <span className="text-emerald-700 block">سود مرکب تصاعدی:</span>
                        <span className="font-mono font-black text-emerald-700">
                          {toPersianNum(compoundTotalProfit.toLocaleString())} ت
                        </span>
                      </div>
                      <div className="bg-amber-50/50 p-1.5 rounded-lg border border-amber-100">
                        <span className="text-amber-700 block">پاداش تصاعدی:</span>
                        <span className="font-mono font-black text-amber-700">
                          +{toPersianNum(compoundAdvantage.toLocaleString())} ت
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions inside collapsed content */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                      <ShieldCheck size={16} className="text-emerald-600" />
                      <span>تضمین اصالت بارگیری مستقیم از کارخانجات</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {sampleProduct && onAddToCart && (
                        <button
                          onClick={() => onAddToCart(sampleProduct, Math.max(5, sampleProduct.min_order_cartons || 5))}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag size={11} />
                          <span>سفارش نمونه ۵ کارتن</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (onSelectCategory) {
                            onSelectCategory(currentSector.categoryName);
                          }
                          onExploreProducts();
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[9px] font-black px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>دیدن کالاها</span>
                        <ArrowLeft size={11} />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
