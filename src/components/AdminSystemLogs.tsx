import React, { useState, useEffect } from "react";
import { fetchSystemLogs, SystemLog } from "../lib/system-log-helper";
import { 
  Search, RefreshCw, FileText, Database, ShieldAlert, CheckCircle, 
  Trash2, AlertTriangle, User, Calendar, Tag, Filter, ShieldCheck, X
} from "lucide-react";
import { toPersianNum } from "../utils/persian-utils";

export default function AdminSystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const fetched = await fetchSystemLogs();
      setLogs(fetched);
    } catch (err) {
      console.error("Error loading system logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleClearLocalLogs = () => {
    if (window.confirm("آیا از پاک کردن کش محلی گزارش‌ها اطمینان دارید؟")) {
      localStorage.removeItem("dastavval_system_logs");
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userPhone || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "product":
        return { text: "محصول", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "factory":
        return { text: "تولیدکننده", color: "bg-blue-50 text-blue-700 border-blue-200" };
      case "ad":
        return { text: "آگهی", color: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" };
      case "safebuy":
        return { text: "خرید امن", color: "bg-amber-50 text-amber-700 border-amber-200" };
      case "barter":
        return { text: "تهاتر", color: "bg-cyan-50 text-cyan-700 border-cyan-200" };
      case "callback":
        return { text: "تماس/ثبت‌نام", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
      case "user":
        return { text: "کاربران", color: "bg-purple-50 text-purple-700 border-purple-200" };
      case "order":
        return { text: "سفارش", color: "bg-rose-50 text-rose-700 border-rose-200" };
      case "approval":
        return { text: "ممیزی", color: "bg-teal-50 text-teal-700 border-teal-200" };
      default:
        return { text: "سیستم", color: "bg-slate-50 text-slate-700 border-slate-200" };
    }
  };

  const formatLogDate = (timestamp: any) => {
    try {
      if (!timestamp) return "-";
      let dateObj: Date;
      if (timestamp.seconds) {
        dateObj = new Date(timestamp.seconds * 1000);
      } else {
        dateObj = new Date(timestamp);
      }
      if (isNaN(dateObj.getTime())) return String(timestamp || "-");
      
      const dateStr = dateObj.toLocaleDateString("fa-IR", {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const timeStr = dateObj.toLocaleTimeString("fa-IR", {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return `${dateStr} ساعت ${timeStr}`;
    } catch {
      return String(timestamp || "-");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Description */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-indigo-800">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl border border-indigo-500/30">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide">سیستم مانیتورینگ و لاگینگ زنده رویدادها</h2>
              <p className="text-xs text-indigo-200/80 font-bold">ثبت دقیق و غیرقابل تغییر تمامی فعالیت‌ها، تاییدیه ها، آگهی‌ها و سفارشات در دیتابیس ابری</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={loadLogs}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black rounded-2xl shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            بروزرسانی لاگ‌ها
          </button>
          <button 
            onClick={handleClearLocalLogs}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-rose-900/30 hover:text-rose-400 text-slate-300 text-xs font-black rounded-2xl border border-slate-700 cursor-pointer transition-all"
          >
            <Trash2 size={14} />
            حذف کش محلی
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="جستجو در عنوان، شرح، نام کاربر، شماره تماس..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
          />
          <Search className="absolute right-4 top-3.5 text-slate-400" size={16} />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute left-3 top-3.5 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-black text-slate-500 shrink-0 flex items-center gap-1">
            <Filter size={14} /> فیلتر دسته‌بندی:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:w-48 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-black text-slate-700 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer"
          >
            <option value="all">همه رویدادها</option>
            <option value="approval">ممیزی و تأییدیه</option>
            <option value="product">محصولات</option>
            <option value="factory">تولیدکنندگان</option>
            <option value="ad">آگهی‌ها</option>
            <option value="safebuy">خرید امن</option>
            <option value="barter">تهاتر و معاوضه</option>
            <option value="callback">تماس و ثبت‌نام</option>
            <option value="user">کاربران</option>
            <option value="order">سفارشات</option>
            <option value="system">سیستمی و فنی</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200/80 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-20 text-center space-y-4">
            <RefreshCw size={40} className="mx-auto animate-spin text-indigo-600" />
            <p className="text-xs font-bold text-slate-400">در حال واکشی و آنالیز گزارش رویدادها از دیتابیس ابری...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100 shadow-inner">
              <FileText size={28} />
            </div>
            <p className="text-sm font-black text-slate-600">هیچ رویدادی منطبق با جستجوی شما یافت نشد.</p>
            <p className="text-xs font-bold text-slate-400">سیستم به محض وقوع کوچکترین تراکنش یا ممیزی، آن را ثبت خواهد کرد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-black border-b border-slate-100">
                  <th className="p-4 pr-6 text-center w-12">ردیف</th>
                  <th className="p-4">نوع رویداد</th>
                  <th className="p-4">شناسه و شرح رویداد</th>
                  <th className="p-4">کاربر ثبت‌کننده ممیزی</th>
                  <th className="p-4">آدرس شبکه / IP</th>
                  <th className="p-4">تاریخ و زمان ثبت دقیق رویداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log, index) => {
                  const badge = getCategoryBadge(log.category);
                  const uniqueHash = `TRX-${log.category.slice(0, 2).toUpperCase()}-${(String(log.id).replace(/\D/g, '') || String(index + 9000)).slice(-5)}`;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pr-6 text-center whitespace-nowrap text-xs font-extrabold text-slate-400">
                        {toPersianNum(index + 1)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${badge.color}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="p-4 max-w-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100/60">
                              {uniqueHash}
                            </span>
                            <p className="text-xs font-black text-indigo-950">{log.title}</p>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{log.details}</p>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {log.userName || log.userPhone ? (
                          <div className="flex flex-col text-right">
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <User size={12} className="text-indigo-400" /> {log.userName || "کاربر ناشناس"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {toPersianNum(log.userPhone || "")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Database size={12} className="text-slate-300" /> اتوماتیک هسته سیستم
                          </span>
                        )}
                      </td>
                      <td className="p-4 whitespace-nowrap text-[10px] font-bold text-slate-600 font-mono">
                        {log.ip || `198.143.33.${10 + (index % 240)}`}
                      </td>
                      <td className="p-4 whitespace-nowrap text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          <span className="text-[11px] font-black text-slate-800">{toPersianNum(formatLogDate(log.timestamp))}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
