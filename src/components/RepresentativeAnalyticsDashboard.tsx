import React, { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Target, 
  Award, 
  Clock, 
  Zap, 
  CheckCircle2, 
  ArrowUpRight, 
  HelpCircle,
  Sparkles,
  ChevronLeft
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface RepresentativeAnalyticsDashboardProps {
  currentSales: number;
  activeTier: {
    levelNumber: number;
    title: string;
    badgeLabel: string;
    minSales: number;
  };
  tiers: Array<{
    levelNumber: number;
    id: string;
    title: string;
    minSales: number;
    minSalesFormatted: string;
    badgeLabel: string;
  }>;
  onUpdateSimulatedSales?: (amount: number) => void;
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const s = String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
};

export default function RepresentativeAnalyticsDashboard({
  currentSales,
  activeTier,
  tiers,
  onUpdateSimulatedSales
}: RepresentativeAnalyticsDashboardProps) {
  
  // Find next tier target
  const nextTier = tiers.find(t => t.minSales > currentSales) || tiers[tiers.length - 1];
  const isMaxTier = currentSales >= tiers[tiers.length - 1].minSales;

  // Selected Target for Circular Chart Analysis (defaults to next tier target)
  const [selectedTargetId, setSelectedTargetId] = useState<string>(nextTier.id);

  const selectedTierTarget = tiers.find(t => t.id === selectedTargetId) || nextTier;
  const targetAmount = selectedTierTarget.minSales;

  // Calculate Achieved vs Remaining Distance
  const achievedAmount = Math.min(currentSales, targetAmount);
  const remainingAmount = Math.max(0, targetAmount - currentSales);
  const completionPercentage = Math.min(100, Math.round((currentSales / targetAmount) * 100));

  // Circular Donut Chart Data
  const pieData = [
    { name: "فروش محقق‌شده", value: achievedAmount, color: "#10b981" }, // Emerald 500
    { name: "فاصله تا ارتقا", value: remainingAmount, color: "#e2e8f0" }   // Slate 200
  ];

  // Bar Chart Data comparing sales against all 4 milestones
  const barData = tiers.map(t => ({
    name: t.title,
    target: t.minSales / 1_000_000, // Millions Toman
    achieved: Math.min(currentSales, t.minSales) / 1_000_000,
    isReached: currentSales >= t.minSales
  }));

  // 4-Month Comparative Sales Data (3 past months + current month)
  const pastMonth1Sales = 750_000_000;   // اردیبهشت
  const pastMonth2Sales = 880_000_000;   // خرداد
  const pastMonth3Sales = 1_020_000_000; // تیر (ماه گذشته)

  const past3MonthsAvg = Math.round((pastMonth1Sales + pastMonth2Sales + pastMonth3Sales) / 3);
  const growthVsLastMonth = Math.round(((currentSales - pastMonth3Sales) / pastMonth3Sales) * 100);
  const growthVsAvg = Math.round(((currentSales - past3MonthsAvg) / past3MonthsAvg) * 100);

  const comparativeBarData = [
    { month: "اردیبهشت", sales: pastMonth1Sales / 1_000_000, formattedSales: pastMonth1Sales, isCurrent: false },
    { month: "خرداد", sales: pastMonth2Sales / 1_000_000, formattedSales: pastMonth2Sales, isCurrent: false },
    { month: "تیر", sales: pastMonth3Sales / 1_000_000, formattedSales: pastMonth3Sales, isCurrent: false },
    { month: "مرداد (جاری)", sales: currentSales / 1_000_000, formattedSales: currentSales, isCurrent: true }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8 font-sans text-right" dir="rtl">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Target size={22} className="text-emerald-600" />
            <span>داشبورد مدیریتی تحلیلی فروش و اهداف ماهانه</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            تحلیل هوشمند فاصله تا ارتقا به سطح بعدی نمایندگی (اهداف ۳۰۰M، ۱B، ۲B و ۵B)
          </p>
        </div>

        {/* Target Level Quick Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 bg-slate-50 p-1 rounded-2xl border border-slate-200">
          {tiers.map(t => {
            const isSelected = selectedTargetId === t.id;
            const isReached = currentSales >= t.minSales;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTargetId(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  isSelected 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                <span>{t.title}</span>
                {isReached && <CheckCircle2 size={12} className="text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: 4-MONTH COMPARATIVE BAR CHART (NEW FEATURE) */}
      <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 space-y-6">
        
        {/* Header & Growth Insight Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <span className="text-[11px] font-black text-slate-500 block">نمودار میله‌ای مقایسه‌ای:</span>
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 pt-0.5">
              <BarChart3 size={18} className="text-blue-600" />
              <span>مقایسه عملکرد فروش ماه جاری با ۳ ماه گذشته</span>
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {growthVsLastMonth >= 0 ? (
              <span className="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xs">
                <TrendingUp size={16} className="text-emerald-600" />
                <span>{toPersianNum(Math.abs(growthVsLastMonth))}٪ رشد نسبت به ماه گذشته</span>
              </span>
            ) : (
              <span className="text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 px-3.5 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xs">
                <TrendingDown size={16} className="text-amber-600" />
                <span>{toPersianNum(Math.abs(growthVsLastMonth))}٪ افت نسبت به ماه گذشته</span>
              </span>
            )}
          </div>
        </div>

        {/* RECHARTS BAR CHART */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparativeBarData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${toPersianNum(val)} M`}
              />
              <Tooltip 
                formatter={(val: any) => [`${toPersianNum(Number(val).toLocaleString('fa-IR'))} میلیون تومان`, "فروش نقد"]}
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '16px', borderColor: '#e2e8f0', color: '#0f172a', fontSize: '12px', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="sales" radius={[12, 12, 0, 0]} maxBarSize={55}>
                {comparativeBarData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isCurrent ? "#059669" : "#94a3b8"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3 STAT BADGES BREAKDOWN */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold block">فروش ثبت‌شده ماه جاری (مرداد):</span>
            <div className="text-sm font-black text-emerald-800 font-mono">
              {toPersianNum(currentSales.toLocaleString('fa-IR'))} <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold block">میانگین فروش ۳ ماه گذشته:</span>
            <div className="text-sm font-black text-slate-900 font-mono">
              {toPersianNum(past3MonthsAvg.toLocaleString('fa-IR'))} <span className="text-xs font-normal text-slate-500">تومان</span>
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-bold block">روند نسبت به میانگین دوره:</span>
            <div className="text-sm font-black font-mono flex items-center gap-1">
              {growthVsAvg >= 0 ? (
                <span className="text-emerald-700 font-black">+{toPersianNum(growthVsAvg)}٪ بالاتر از میانگین</span>
              ) : (
                <span className="text-amber-700 font-black">-{toPersianNum(Math.abs(growthVsAvg))}٪ پایین‌تر از میانگین</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 2-COLUMN MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COLUMN 1: CIRCULAR PIE / DONUT CHART (7 cols) */}
        <div className="lg:col-span-7 bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 flex flex-col justify-between space-y-6">
          
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
            <div>
              <span className="text-[11px] font-black text-slate-500 block">نمودار دایره‌ای تحلیل هدف:</span>
              <h3 className="text-sm font-black text-slate-900 pt-0.5">
                فاصله تا هدف «{selectedTierTarget.title}» ({selectedTierTarget.minSalesFormatted})
              </h3>
            </div>

            <span className="text-xs font-black font-mono bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300">
              {toPersianNum(completionPercentage)}٪ تحقق هدف
            </span>
          </div>

          {/* CIRCULAR DONUT CHART DISPLAY */}
          <div className="relative h-64 sm:h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius="68%"
                  outerRadius="90%"
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any) => `${toPersianNum(Number(val).toLocaleString('fa-IR'))} تومان`}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Inner Donut Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-0.5 pointer-events-none">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">میزان تحقق</span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
                {toPersianNum(completionPercentage)}٪
              </div>
              <span className="text-[11px] font-bold text-slate-600 max-w-[120px] truncate">
                {currentSales >= targetAmount ? "🎯 هدف محقق شده" : `تا ${selectedTierTarget.title}`}
              </span>
            </div>
          </div>

          {/* Legend / Key Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/80 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>فروش نقد محقق‌شده:</span>
              </div>
              <div className="text-sm font-black text-slate-900 font-mono">
                {toPersianNum(currentSales.toLocaleString('fa-IR'))} <span className="text-xs font-normal text-slate-500">تومان</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                <span>فاصله باقی‌مانده تا هدف:</span>
              </div>
              <div className="text-sm font-black text-slate-900 font-mono">
                {remainingAmount === 0 ? (
                  <span className="text-emerald-700 font-black">هدف تکمیل شد!</span>
                ) : (
                  <>
                    {toPersianNum(remainingAmount.toLocaleString('fa-IR'))} <span className="text-xs font-normal text-slate-500">تومان</span>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 2: ANALYTICAL METRICS & MILESTONES (5 cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Card 1: Next Target Highlight (White & Minimal) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-amber-800 font-black flex items-center gap-1 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Sparkles size={13} className="text-amber-600" />
                <span>هدف سطح بعدی ارتقا</span>
              </span>
              <span className="text-slate-500 font-mono font-bold">سطح {toPersianNum(nextTier.levelNumber)}</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">{nextTier.badgeLabel}</h3>
              <p className="text-xs text-slate-600 font-medium">
                سقف هدف ماهانه: <strong className="text-slate-900 font-mono">{toPersianNum(nextTier.minSalesFormatted)}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <span className="text-slate-500 block font-medium">فاصله دقیق تا دریافت لوح {nextTier.title}:</span>
              <div className="text-base font-black text-slate-900 font-mono">
                {currentSales >= nextTier.minSales ? (
                  <span className="text-emerald-700 font-black">🌟 احراز شده است!</span>
                ) : (
                  <>
                    {toPersianNum((nextTier.minSales - currentSales).toLocaleString('fa-IR'))} <span className="text-xs font-normal text-slate-500">تومان</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Visual Milestones Comparison */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/80 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-slate-900">سنجش مقایسه‌ای با اهداف ۴ گانه:</h4>
              <p className="text-[11px] text-slate-500 font-medium">
                مقایسه فروش نقد با حد نصاب‌های ۳۰۰M، ۱B، ۲B و ۵B
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {tiers.map(t => {
                const percent = Math.min(100, Math.round((currentSales / t.minSales) * 100));
                const isPassed = currentSales >= t.minSales;

                return (
                  <div key={t.id} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[11px] font-bold">
                      <span className={isPassed ? "text-emerald-800 font-black" : "text-slate-700"}>
                        {t.title} ({toPersianNum(t.minSalesFormatted)})
                      </span>
                      <span className="font-mono text-slate-900 font-black">{toPersianNum(percent)}٪</span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isPassed ? "bg-emerald-500" : "bg-blue-600"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200/80 text-[10px] text-slate-500 font-medium flex items-center gap-1">
              <Clock size={12} className="text-blue-600 shrink-0" />
              <span>محاسبه تا انتهای دوره فروش ماه خورشیدی جاری</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
