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

const monthlySalesData = [
  { name: 'فروردین', revenue: 4500, orders: 120 },
  { name: 'اردیبهشت', revenue: 5200, orders: 145 },
  { name: 'خرداد', revenue: 4800, orders: 130 },
  { name: 'تیر', revenue: 6100, orders: 180 },
  { name: 'مرداد', revenue: 7500, orders: 210 },
  { name: 'شهریور', revenue: 8900, orders: 250 },
  { name: 'مهر', revenue: 8200, orders: 230 },
  { name: 'آبان', revenue: 9500, orders: 280 },
  { name: 'آذر', revenue: 11000, orders: 320 },
  { name: 'دی', revenue: 10500, orders: 300 },
  { name: 'بهمن', revenue: 12500, orders: 360 },
  { name: 'اسفند', revenue: 14000, orders: 410 },
];

const categoryData = [
  { name: 'مواد غذایی', value: 45, color: '#10b981' },
  { name: 'شوینده', value: 25, color: '#3b82f6' },
  { name: 'بهداشتی', value: 15, color: '#f59e0b' },
  { name: 'آرایشی', value: 10, color: '#8b5cf6' },
  { name: 'سایر', value: 5, color: '#64748b' },
];

const factoryPerformanceData = [
  { name: 'زرین‌نام', sales: 450, growth: 15 },
  { name: 'پاکسان', sales: 380, growth: 10 },
  { name: 'تبرک', sales: 320, growth: -5 },
  { name: 'نامی‌نو', sales: 290, growth: 8 },
  { name: 'گلستان', sales: 250, growth: 12 },
];

const toPersianNum = (n: number | string) => {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, x => farsiDigits[parseInt(x)]);
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-2xl text-right">
        <p className="text-xs font-black text-slate-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-[11px] font-bold" style={{ color: entry.color }}>
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
              ۱۲٪+
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">درآمد کل سالانه</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{toPersianNum('۸۴۵,۰۰۰,۰۰۰')} تومان</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShoppingCart size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              ۸٪+
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">کل سفارشات عمده</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{toPersianNum('۳,۴۵۰')} سفارش</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Factory size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              <ArrowUpRight size={12} />
              ۴+
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">کارخانجات همکار</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{toPersianNum('۴۸')} واحد تولیدی</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Package size={20} />
            </div>
            <span className="flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
              <ArrowDownRight size={12} />
              ۲٪-
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">میانگین وزن هر پارت</p>
          <h3 className="text-xl font-black text-slate-900 mt-1">{toPersianNum('۴.۸')} تن</h3>
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
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlySalesData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                  tickFormatter={(val) => toPersianNum(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-black text-slate-900">سهم دسته‌بندی‌ها از فروش کل (درصد)</h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ right: 30, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 'black', fill: '#1e293b' }}
                  width={80}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-black">
                          {toPersianNum(payload[0].value as number)}٪ سهم بازار
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Factory Performance */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-sm font-black text-slate-900">تحلیل عملکرد ۵ کارخانه برتر (میلیارد ریال)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factoryPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 'black', fill: '#1e293b' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                    tickFormatter={(val) => toPersianNum(val)}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-2xl text-right">
                            <p className="text-[11px] font-black text-slate-900">{payload[0].payload.name}</p>
                            <p className="text-xs font-bold text-emerald-600 mt-1">
                              فروش: {toPersianNum(payload[0].value as number)} میلیارد ریال
                            </p>
                            <p className={`text-[10px] font-black mt-0.5 ${payload[0].payload.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              رشد: {toPersianNum(payload[0].payload.growth)}٪ نسبت به ماه قبل
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="sales" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="md:col-span-5 space-y-4">
              <h5 className="text-xs font-black text-slate-500 mb-4">جزئیات رشد کارخانجات</h5>
              {factoryPerformanceData.map((factory, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[11px] font-black border border-slate-100 shadow-xs">
                      {toPersianNum(idx + 1)}
                    </div>
                    <span className="text-[11px] font-black text-slate-900">{factory.name}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-[11px] font-black ${factory.growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {factory.growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {toPersianNum(Math.abs(factory.growth))}٪
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
