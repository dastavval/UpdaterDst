import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, Package, PieChart, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Language, t } from '../lib/translations';

interface ReportsViewProps {
  language: Language;
  user?: any;
  userBadge?: string;
}

const ReportsView: React.FC<ReportsViewProps> = ({ language, user, userBadge }) => {
  // Mock data for sales volume (Daily)
  const salesData = [
    { name: '۱۴۰۲/۰۵/۰۱', volume: 45, revenue: 12500000 },
    { name: '۱۴۰۲/۰۵/۰۲', volume: 52, revenue: 15800000 },
    { name: '۱۴۰۲/۰۵/۰۳', volume: 38, revenue: 11200000 },
    { name: '۱۴۰۲/۰۵/۰۴', volume: 65, revenue: 19500000 },
    { name: '۱۴۰۲/۰۵/۰۵', volume: 48, revenue: 14200000 },
    { name: '۱۴۰۲/۰۵/۰۶', volume: 59, revenue: 17600000 },
    { name: '۱۴۰۲/۰۵/۰۷', volume: 72, revenue: 22100000 },
  ];

  // Mock data for profit trends (Daily)
  const profitData = [
    { name: '۱۴۰۲/۰۵/۰۱', profit: 1800000, margin: 15 },
    { name: '۱۴۰۲/۰۵/۰۲', profit: 2200000, margin: 16 },
    { name: '۱۴۰۲/۰۵/۰۳', profit: 1500000, margin: 14 },
    { name: '۱۴۰۲/۰۵/۰۴', profit: 2800000, margin: 18 },
    { name: '۱۴۰۲/۰۵/۰۵', profit: 2100000, margin: 16 },
    { name: '۱۴۰۲/۰۵/۰۶', profit: 2500000, margin: 17 },
    { name: '۱۴۰۲/۰۵/۰۷', profit: 3200000, margin: 19 },
  ];

  const isAdmin = userBadge === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={12} />
              ۱۲٪
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold block">{t(isAdmin ? "کل فروش پلتفرم (۳۰ روز)" : "مجموع فروش شما (۳۰ روز)", language)}</span>
          <span className="text-xl font-black text-slate-900 font-mono">
            {isAdmin ? "۱,۴۵۰,۰۰۰,۰۰۰" : "۱۱۴,۹۰۰,۰۰۰"} <span className="text-xs font-normal text-slate-500">{t("تومان", language)}</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ArrowUpRight size={12} />
              ۸٪
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold block">{t(isAdmin ? "سود ناخالص مرکزی" : "سود خالص تخمینی شما", language)}</span>
          <span className="text-xl font-black text-slate-900 font-mono">
            {isAdmin ? "۲۱۰,۰۰۰,۰۰۰" : "۱۸,۶۰۰,۰۰۰"} <span className="text-xs font-normal text-slate-500">{t("تومان", language)}</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Package size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              <ArrowDownRight size={12} />
              ۳٪
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold block">{t("تعداد کارتن معامله شده", language)}</span>
          <span className="text-xl font-black text-slate-900 font-mono">
            {isAdmin ? "۱۲,۵۰۰" : "۳۸۴"} <span className="text-xs font-normal text-slate-500">{t("کارتن", language)}</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <PieChart size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-400">{t("تارگت ماهانه", language)}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold block">{t("درصد تحقق اهداف فروش", language)}</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full w-[۷۵٪]" style={{ width: '75%' }} />
            </div>
            <span className="text-xs font-black text-slate-700">۷۵٪</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Volume Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar size={16} className="text-emerald-600" />
                {t("روند حجم فروش روزانه (کارتن)", language)}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">{t("نمودار میله‌ای توزیع حجم خروجی در ۷ روز گذشته", language)}</p>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    fontWeight: 900,
                    textAlign: 'right',
                    direction: 'rtl'
                  }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32}
                  name={t("تعداد کارتن", language)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                {t("روند سود خالص و حاشیه سود", language)}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">{t("تحلیل نوسانات سودآوری روزانه بر اساس قیمت خرید و مصرف‌کننده", language)}</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontSize: '11px',
                    fontWeight: 900,
                    textAlign: 'right',
                    direction: 'rtl'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                  name={t("سود (تومان)", language)}
                />
                <Area 
                  type="monotone" 
                  dataKey="margin" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent"
                  name={t("حاشیه سود (٪)", language)}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-indigo-600 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400">{t("پرفروش‌ترین دسته‌بندی", language)}</h4>
            <div className="text-lg font-black">{t("تنقلات و چیپس", language)}</div>
            <div className="text-[10px] text-emerald-400 font-bold">۳۴٪ از کل فروش</div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400">{t("میانگین زمان تسویه", language)}</h4>
            <div className="text-lg font-black">{t("۱۲ روز", language)}</div>
            <div className="text-[10px] text-amber-400 font-bold">بهبود ۵ روزه نسبت به ماه قبل</div>
          </div>
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-400">{t("نرخ بازگشت مشتری", language)}</h4>
            <div className="text-lg font-black">۸۹٪</div>
            <div className="text-[10px] text-blue-400 font-bold">سطح رضایتمندی: عالی</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
