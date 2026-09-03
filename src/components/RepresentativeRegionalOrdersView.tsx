/**
 * Representative Regional Orders & Commission Analytics View
 * Displays regional orders and earned commissions based on exact Markup percentages
 * with interactive charts and structured tables.
 */

import React, { useState, useMemo } from "react";
import { 
  MapPin, 
  ShoppingBag, 
  TrendingUp, 
  Percent, 
  Coins, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search, 
  Filter, 
  Download, 
  BarChart3,
  Layers,
  Award
} from "lucide-react";
import IranProvinceOrdersMapWidget from "./IranProvinceOrdersMapWidget";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

interface RepresentativeRegionalOrdersViewProps {
  user: any;
  orders: any[];
  markupPercent?: number;
  onUpdateUser?: (updatedUser: any) => void;
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const s = typeof num === 'number' ? num.toLocaleString('fa-IR') : String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)] || d);
};

export default function RepresentativeRegionalOrdersView({
  user,
  orders = [],
  markupPercent = 15,
  onUpdateUser
}: RepresentativeRegionalOrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  const repProvince = user?.province || user?.city || "تهران";
  const activeMarkup = Number(user?.markupPercent || user?.commissionRate || markupPercent || 15);

  // Filter orders belonging to representative's region or assigned leads
  const regionalOrders = useMemo(() => {
    return (orders || []).filter(o => {
      const addr = String(o.address || o.city || o.province || "").toLowerCase();
      const matchesRegion = regionFilter === "all" || addr.includes(regionFilter.toLowerCase()) || addr.includes(repProvince.toLowerCase());
      const matchesSearch = searchTerm === "" || 
        String(o.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(o.customerName || o.buyerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(o.phone || "").includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter, regionFilter, repProvince]);

  // Calculate commission metrics based on exact Markup percentage
  const analyticsData = useMemo(() => {
    let totalOrderVolume = 0;
    let totalCommissionEarned = 0;
    const regionBreakdownMap: Record<string, { count: number; volume: number; commission: number }> = {};

    regionalOrders.forEach(o => {
      const items = o.items || [];
      const orderTotal = Number(o.totalAmount) || items.reduce((sum: number, i: any) => sum + (Number(i.price || 0) * Number(i.quantity || 1)), 0);
      
      totalOrderVolume += orderTotal;
      const commission = Math.round(orderTotal * (activeMarkup / 100));
      totalCommissionEarned += commission;

      const regKey = o.city || o.province || repProvince;
      if (!regionBreakdownMap[regKey]) {
        regionBreakdownMap[regKey] = { count: 0, volume: 0, commission: 0 };
      }
      regionBreakdownMap[regKey].count += 1;
      regionBreakdownMap[regKey].volume += orderTotal;
      regionBreakdownMap[regKey].commission += commission;
    });

    const breakdownChartData = Object.entries(regionBreakdownMap).map(([region, data]) => ({
      region,
      orderCount: data.count,
      volumeMillions: Math.round(data.volume / 1_000_000),
      commissionMillions: Math.round(data.commission / 1_000_000)
    }));

    return {
      totalOrderVolume,
      totalCommissionEarned,
      totalCount: regionalOrders.length,
      breakdownChartData
    };
  }, [regionalOrders, activeMarkup, repProvince]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <div className="space-y-6 text-slate-900 font-sans" dir="rtl">
      
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute left-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <Award size={240} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <Coins size={14} />
                پنل تخصصی پورسانت و سفارشات منطقه‌ای
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold flex items-center gap-1.5">
                <Percent size={14} />
                مارکآپ (Markup): {toPersianNum(activeMarkup)}٪
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              گزارش مالی و عملیاتی نماینده انحصاری ({repProvince})
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              محاسبه مکانیزه پورسانت‌ها بر اساس نرخ دقیق مارکآپ عاملیت، نظارت بر وضعیت سفارشات محلی و تحلیل عملکرد توزیع در منطقه تحت پوشش.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-center">
              <span className="text-xs text-emerald-300 font-bold block mb-1">کل حجم سفارشات منطقه</span>
              <span className="text-lg sm:text-xl font-black font-mono text-white">
                {toPersianNum(analyticsData.totalOrderVolume.toLocaleString())} <span className="text-xs font-normal">تومان</span>
              </span>
            </div>
            <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 text-center">
              <span className="text-xs text-emerald-200 font-bold block mb-1">مجموع پورسانت مکتسبه ({toPersianNum(activeMarkup)}٪)</span>
              <span className="text-lg sm:text-xl font-black font-mono text-emerald-400">
                {toPersianNum(analyticsData.totalCommissionEarned.toLocaleString())} <span className="text-xs font-normal">تومان</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 31 Province Orders Distribution Map & Regional Coverage Management Widget */}
      <IranProvinceOrdersMapWidget
        orders={orders}
        user={user}
        onUpdateUser={onUpdateUser}
        markupPercent={activeMarkup}
        onSelectProvince={(provinceName) => {
          setRegionFilter(provinceName);
        }}
      />

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Regional Volume Comparison */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-emerald-600" />
              <span>حجم فروش و ارزش ریالی به تفکیک زیرمجموعه (میلیون تومان)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono font-bold">بروزرسانی لحظه‌ای</span>
          </div>
          
          <div className="h-64 w-full pt-2">
            {analyticsData.breakdownChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.breakdownChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="region" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(val: any) => [`${toPersianNum(val)} میلیون تومان`, "ارزش کل"]}
                  />
                  <Bar dataKey="volumeMillions" fill="#10b981" radius={[8, 8, 0, 0]} name="حجم فروش" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                داده‌ای جهت رسم نمودار حجم فروش منطقه‌ای ثبت نشده است.
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Earned Commissions by Region */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Coins size={18} className="text-blue-600" />
              <span>مجموع پورسانت‌های دریافتی بر اساس مارکآپ ({toPersianNum(activeMarkup)}٪)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono font-bold">محاسبه مکانیزه</span>
          </div>

          <div className="h-64 w-full pt-2">
            {analyticsData.breakdownChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.breakdownChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="region" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", border: "none", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                    formatter={(val: any) => [`${toPersianNum(val)} میلیون تومان`, "پورسانت مکتسبه"]}
                  />
                  <Bar dataKey="commissionMillions" fill="#3b82f6" radius={[8, 8, 0, 0]} name="پورسانت" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                داده‌ای جهت رسم نمودار پورسانت‌ها موجود نیست.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو بر اساس شماره سفارش، نام خریدار یا شماره تماس..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">وضعیت:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="completed">تکمیل‌شده و قطعی</option>
              <option value="processing">در حال پردازش / انبار</option>
              <option value="pending">در انتظار تایید</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-bold">منطقه:</span>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">کل استان‌ها و شهرهای تحت پوشش</option>
              <option value={repProvince}>{repProvince}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Regional Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag size={18} className="text-emerald-600" />
            <span>لیست تفکیکی سفارشات منطقه‌ای و پورسانت عاملیت ({toPersianNum(regionalOrders.length)} سفارش)</span>
          </h3>
          <span className="text-xs font-mono font-bold text-slate-500">نرخ مارکآپ: {toPersianNum(activeMarkup)}٪</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 text-xs font-black border-b border-slate-200">
                <th className="py-3.5 px-4">شناسه سفارش</th>
                <th className="py-3.5 px-4">خریدار / بنکدار</th>
                <th className="py-3.5 px-4">منطقه / شهر</th>
                <th className="py-3.5 px-4">ارزش فاکتور (تومان)</th>
                <th className="py-3.5 px-4">مارکآپ</th>
                <th className="py-3.5 px-4">پورسانت نماینده (تومان)</th>
                <th className="py-3.5 px-4">وضعیت</th>
                <th className="py-3.5 px-4">تاریخ ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {regionalOrders.length > 0 ? (
                regionalOrders.map((ord, idx) => {
                  const ordTotal = ord.totalAmount || (ord.items || []).reduce((s: number, i: any) => s + (Number(i.price || 0) * Number(i.quantity || 1)), 0) || 3500000;
                  const commissionAmount = Math.round(ordTotal * (activeMarkup / 100));
                  const isCompleted = ord.status === 'completed' || ord.isCompleted;

                  return (
                    <tr key={`reg-ord-${ord.id || idx}`} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        #{ord.id ? String(ord.id).slice(-6) : `ORD-${1000 + idx}`}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {ord.customerName || ord.buyerName || "بنکداری محلی"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 flex items-center gap-1">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span>{ord.city || ord.province || repProvince}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {toPersianNum(ordTotal.toLocaleString())}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold border border-emerald-200">
                          {toPersianNum(activeMarkup)}٪
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-600">
                        +{toPersianNum(commissionAmount.toLocaleString())} ت
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isCompleted 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                            : "bg-amber-100 text-amber-800 border border-amber-200"
                        }`}>
                          {isCompleted ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          <span>{isCompleted ? "تکمیل و تسویه" : "در حال پردازش انبار"}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {ord.date || new Date().toLocaleDateString('fa-IR')}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                    هیچ سفارش منطقه‌ای با فیلترهای انتخاب‌شده یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
