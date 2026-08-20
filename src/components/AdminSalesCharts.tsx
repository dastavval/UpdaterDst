import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, ShoppingCart, Factory, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const monthlySalesData: any[] = [];

const categoryData: any[] = [];

const factoryPerformanceData: any[] = [];

const toPersianNum = (n: number | string) => {
  if (n === undefined || n === null) return "";
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, x => farsiDigits[parseInt(x)]);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-2xl text-right">
        <p className="text-xs font-black text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`chart-tooltip-${entry.name}-${index}`} className="text-[11px] font-bold" style={{ color: entry.color }}>
            {entry.name === 'revenue' ? 'درآمد: ' : entry.name === 'orders' ? 'سفارشات: ' : ''}
            {toPersianNum(entry.value.toLocaleString())}
            {entry.name === 'revenue' ? ' میلیون تومان' : ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AdminSalesCharts: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" dir="rtl">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              ۰٪
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">درآمد کل سالانه</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{toPersianNum('۰')} تومان</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShoppingCart size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              ۰٪
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">کل سفارشات عمده</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{toPersianNum('۰')} سفارش</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Factory size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              ۰
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">کارخانجات همکار</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{toPersianNum('۰')} واحد تولیدی</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Package size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
              ۰٪
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">میانگین وزن هر پارت</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{toPersianNum('۰')} تن</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Area Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-black text-slate-900">روند فروش ماهانه و درآمد (میلیون تومان)</h4>
            <div className="flex gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-500">درآمد</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
            <span className="text-xs font-bold text-slate-400">دیتایی برای نمایش وجود ندارد</span>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-black text-slate-900">سهم دسته‌بندی‌ها از فروش کل (درصد)</h4>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
            <span className="text-xs font-bold text-slate-400">دیتایی برای نمایش وجود ندارد</span>
          </div>
        </div>

        {/* Factory Performance */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-black text-slate-900">تحلیل عملکرد ۵ کارخانه برتر (میلیارد ریال)</h4>
          </div>
          <div className="h-[350px] w-full flex items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200">
            <span className="text-xs font-bold text-slate-400">دیتایی برای نمایش وجود ندارد</span>
          </div>
        </div>
      </div>
    </div>
  );
};
