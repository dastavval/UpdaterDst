import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  ShoppingCart, 
  Building2, 
  UserPlus, 
  PhoneCall, 
  MessageSquare, 
  Megaphone, 
  ShieldCheck, 
  ExternalLink, 
  X, 
  Check, 
  Phone, 
  ArrowLeft,
  Filter,
  Sparkles,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toPersianNum } from "../utils/persian-utils";

export interface AdminAlertItem {
  id: string;
  type: 'order' | 'dealership' | 'user' | 'callback' | 'ticket' | 'ad' | 'safebuy';
  typeLabel: string;
  title: string;
  requesterName: string;
  requesterPhone: string;
  requesterCompany?: string;
  requesterCity?: string;
  amountToman?: number;
  timeAgo: string;
  rawTimestamp: number;
  isUrgent: boolean;
  priorityLabel: string;
  targetTab: string;
  details?: any;
}

interface AdminAlertsCenterProps {
  orders: any[];
  representativesList: any[];
  callbackRequests: any[];
  supportTickets: any[];
  sponsoredAds: any[];
  rawMaterialAds?: any[];
  equipmentAds?: any[];
  serviceAds?: any[];
  safeBuyRequests: any[];
  registeredUsers?: any[];
  onNavigateTab: (tab: string, param?: any) => void;
  onQuickApproveOrder?: (orderId: string) => Promise<void>;
  onQuickApproveRep?: (repId: string) => void;
  onQuickHandleCallback?: (callbackId: string) => Promise<void>;
  onRefresh?: () => void;
}

export default function AdminAlertsCenter({
  orders = [],
  representativesList = [],
  callbackRequests = [],
  supportTickets = [],
  sponsoredAds = [],
  rawMaterialAds = [],
  equipmentAds = [],
  serviceAds = [],
  safeBuyRequests = [],
  registeredUsers = [],
  onNavigateTab,
  onQuickApproveOrder,
  onQuickApproveRep,
  onQuickHandleCallback,
  onRefresh
}: AdminAlertsCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Compute time difference in Persian
  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return "لحظاتی پیش";
    if (diffMins < 60) return `${toPersianNum(diffMins)} دقیقه پیش`;
    if (diffHours < 24) return `${toPersianNum(diffHours)} ساعت پیش`;
    if (diffDays < 7) return `${toPersianNum(diffDays)} روز پیش`;
    return new Date(timestamp).toLocaleDateString('fa-IR');
  };

  // 1. Gather all live actionable alerts across the entire platform
  const allAlerts: AdminAlertItem[] = useMemo(() => {
    const list: AdminAlertItem[] = [];

    // A. Pending & New Wholesale Orders
    orders.forEach(o => {
      const isPending = !o.status || o.status === 'pending' || o.status === 'order_received' || o.status === 'awaiting_approval';
      if (isPending) {
        const rawDate = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : (o.createdAt ? new Date(o.createdAt).getTime() : Date.now() - 300000);
        const amount = Number(o.totalAmount || o.finalTotal || o.total || 0);
        list.push({
          id: `ord_${o.id || o.trackingNumber}`,
          type: 'order',
          typeLabel: 'سفارش خرید عمده',
          title: `سفارش فاکتور #${(o.trackingNumber || o.id || '').slice(-6).toUpperCase()}`,
          requesterName: o.buyerName || o.customerName || o.userFullName || 'مشتری همکار',
          requesterPhone: o.buyerPhone || o.customerPhone || o.phone || o.mobile || 'ثبت نشده',
          requesterCompany: o.buyerCompany || o.storeName || '',
          requesterCity: o.buyerAddress?.split('،')[0] || o.city || '',
          amountToman: amount,
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: amount > 50000000,
          priorityLabel: amount > 100000000 ? 'فوری (تناژ سنگین)' : 'نیازمند بررسی',
          targetTab: 'orders',
          details: o
        });
      }
    });

    // B. Pending Dealership / Representative Applications
    representativesList.forEach(r => {
      const isPendingRep = r.isApproved === false || r.status === 'pending' || r.status === 'pending_verification';
      if (isPendingRep) {
        const rawDate = r.createdAt ? new Date(r.createdAt).getTime() : Date.now() - 1800000;
        list.push({
          id: `rep_${r.id || r.agencyCode}`,
          type: 'dealership',
          typeLabel: 'تقاضای عاملیت و نمایندگی',
          title: `درخواست نمایندگی استان ${r.city || r.province || 'سراسری'}`,
          requesterName: r.name || 'مدیر پخش استانی',
          requesterPhone: r.phone || r.tel || 'ثبت نشده',
          requesterCompany: r.company || r.agencyName || 'شرکت پخش',
          requesterCity: r.city || '',
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: true,
          priorityLabel: 'درخواست اولویت‌دار',
          targetTab: 'representatives',
          details: r
        });
      }
    });

    // C. Urgent Callback Requests
    callbackRequests.forEach(c => {
      if (c.status === 'pending' || !c.status) {
        const rawDate = c.createdAt?.seconds ? c.createdAt.seconds * 1000 : (c.createdAt ? new Date(c.createdAt).getTime() : Date.now() - 600000);
        list.push({
          id: `cb_${c.id}`,
          type: 'callback',
          typeLabel: 'تماس و استعلام فوری',
          title: `درخواست تماس کارشناسی خرید`,
          requesterName: c.name || 'مدیر خرید',
          requesterPhone: c.phone || '',
          requesterCity: c.city || '',
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: true,
          priorityLabel: 'SLA فوری (زیر ۳۰ دقیقه)',
          targetTab: 'crm',
          details: c
        });
      }
    });

    // D. Open Support Tickets
    supportTickets.forEach(t => {
      if (t.status === 'pending' || t.status === 'open' || !t.status) {
        const rawDate = t.createdAt?.seconds ? t.createdAt.seconds * 1000 : (t.createdAt ? new Date(t.createdAt).getTime() : Date.now() - 1200000);
        list.push({
          id: `tk_${t.id}`,
          type: 'ticket',
          typeLabel: 'تیکت پشتیبانی',
          title: t.subject || t.title || 'پیگیری وضعیت سفارش',
          requesterName: t.userName || t.name || 'کاربر سامانه',
          requesterPhone: t.userPhone || t.phone || '',
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: t.priority === 'high',
          priorityLabel: t.priority === 'high' ? 'ضروری' : 'عادی',
          targetTab: 'crm',
          details: t
        });
      }
    });

    // E. Pending Advertisements (KafBazaar, Raw Materials, Equipment, Services)
    sponsoredAds.forEach(a => {
      if (a.status === 'pending') {
        const rawDate = a.createdAt ? new Date(a.createdAt).getTime() : Date.now() - 3600000;
        list.push({
          id: `ad_${a.id}`,
          type: 'ad',
          typeLabel: 'آگهی کف بازار',
          title: `آگهی: ${a.title || 'فروش بار مازاد'}`,
          requesterName: a.sellerName || a.factoryName || 'تولیدکننده / بنکدار',
          requesterPhone: a.sellerPhone || a.phone || '',
          requesterCompany: a.factoryName || '',
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: false,
          priorityLabel: 'بررسی اصالت و قیمت',
          targetTab: 'ads',
          details: a
        });
      }
    });

    rawMaterialAds.forEach(rm => {
      if (rm.isPendingApproval || rm.status === 'pending' || !rm.status || rm.status === 'در حال بررسی') {
        const rawDate = rm.createdAt ? new Date(rm.createdAt).getTime() : Date.now() - 3600000;
        list.push({
          id: `rm_${rm.id}`,
          type: 'ad',
          typeLabel: 'مواد اولیه صنعتی',
          title: `ماده اولیه: ${rm.title || rm.name}`,
          requesterName: rm.supplierName || 'تامین‌کننده',
          requesterPhone: rm.phone || rm.supplierPhone || rm.contactPhone || '',
          requesterCompany: rm.supplierName || '',
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: false,
          priorityLabel: 'تایید کیفیت صنعتی',
          targetTab: 'ads',
          details: rm
        });
      }
    });

    equipmentAds.forEach(eq => {
      if (eq.isPendingApproval || eq.status === 'pending' || !eq.status || eq.status === 'در حال بررسی') {
        const rawDate = eq.createdAt ? new Date(eq.createdAt).getTime() : Date.now() - 3600000;
        list.push({
          id: `eq_${eq.id}`,
          type: 'ad',
          typeLabel: 'ماشین‌آلات صنعتی',
          title: `تجهیزات: ${eq.title || eq.name}`,
          requesterName: eq.contactPerson || eq.factoryName || 'فروشنده',
          requesterPhone: eq.contactPhone || eq.phone || '',
          requesterCompany: eq.factoryName || '',
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: false,
          priorityLabel: 'تایید اصالت دستگاه',
          targetTab: 'ads',
          details: eq
        });
      }
    });

    serviceAds.forEach(srv => {
      if (srv.isPendingApproval || srv.status === 'pending' || !srv.status || srv.status === 'در حال بررسی') {
        const rawDate = srv.createdAt ? new Date(srv.createdAt).getTime() : Date.now() - 3600000;
        list.push({
          id: `srv_${srv.id}`,
          type: 'ad',
          typeLabel: 'خدمات صنعتی',
          title: `خدمت: ${srv.title}`,
          requesterName: srv.providerName || 'پیمانکار',
          requesterPhone: srv.phone || srv.contactPhone || '',
          requesterCompany: srv.providerName || '',
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: false,
          priorityLabel: 'تایید مدارک پیمانکاری',
          targetTab: 'ads',
          details: srv
        });
      }
    });

    // F. Pending Safe Buy Requests
    safeBuyRequests.forEach(s => {
      if (s.status === 'pending') {
        const rawDate = s.createdAt ? new Date(s.createdAt).getTime() : Date.now() - 7200000;
        list.push({
          id: `sb_${s.id}`,
          type: 'safebuy',
          typeLabel: 'خرید امن کف بازار',
          title: `تامین مستقیم: ${s.productTitle || s.productName || 'کالای سفارشی'}`,
          requesterName: s.buyerName || 'خریدار عمده',
          requesterPhone: s.buyerPhone || '',
          timeAgo: formatTimeAgo(rawDate),
          rawTimestamp: rawDate,
          isUrgent: true,
          priorityLabel: 'ودیعه امانی در انتظار تایید',
          targetTab: 'safe_buy',
          details: s
        });
      }
    });

    // G. Registered New Users from local storage or props
    try {
      const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
      const userList = Object.values(localUsers) as any[];
      userList.forEach((u: any) => {
        if (u && (u.role === 'representative' && !u.isRepresentativeApproved) || u.status === 'pending_verification') {
          const rawDate = u.createdAt ? new Date(u.createdAt).getTime() : Date.now() - 86400000;
          if (!list.some(item => item.requesterPhone === u.phone || item.id.includes(u.phone))) {
            list.push({
              id: `usr_${u.phone || u.userCode || u.email}`,
              type: 'user',
              typeLabel: 'ثبت‌نام کاربر جدید',
              title: `ثبت‌نام خریدار / متقاضی جدید (${u.role === 'representative' ? 'نماینده' : 'خریدار عمده'})`,
              requesterName: u.name || 'کاربر جدید',
              requesterPhone: u.phone || u.email || '',
              requesterCompany: u.company || '',
              requesterCity: u.city || '',
              timeAgo: formatTimeAgo(rawDate),
              rawTimestamp: rawDate,
              isUrgent: true,
              priorityLabel: 'کاربر جدید منتظر تایید دسترسی',
              targetTab: u.role === 'representative' ? 'representatives' : 'crm',
              details: u
            });
          }
        }
      });
    } catch (e) {}

    // Sort newest / most urgent first
    return list.sort((a, b) => b.rawTimestamp - a.rawTimestamp);
  }, [orders, representativesList, callbackRequests, supportTickets, sponsoredAds, safeBuyRequests, registeredUsers]);

  const filteredAlerts = useMemo(() => {
    if (selectedFilter === "all") return allAlerts;
    if (selectedFilter === "orders") return allAlerts.filter(a => a.type === 'order');
    if (selectedFilter === "reps") return allAlerts.filter(a => a.type === 'dealership' || a.type === 'user');
    if (selectedFilter === "callbacks") return allAlerts.filter(a => a.type === 'callback' || a.type === 'ticket');
    if (selectedFilter === "ads") return allAlerts.filter(a => a.type === 'ad' || a.type === 'safebuy');
    return allAlerts;
  }, [allAlerts, selectedFilter]);

  const unreadCount = allAlerts.length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart size={16} className="text-emerald-600" />;
      case 'dealership':
      case 'user':
        return <Building2 size={16} className="text-emerald-600" />;
      case 'callback':
        return <PhoneCall size={16} className="text-emerald-600" />;
      case 'ticket':
        return <MessageSquare size={16} className="text-purple-600" />;
      case 'ad':
        return <Megaphone size={16} className="text-emerald-600" />;
      case 'safebuy':
        return <ShieldCheck size={16} className="text-teal-600" />;
      default:
        return <Bell size={16} className="text-slate-600" />;
    }
  };

  const handleQuickAction = async (alert: AdminAlertItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(alert.id);
    try {
      if (alert.type === 'order' && onQuickApproveOrder && alert.details?.id) {
        await onQuickApproveOrder(alert.details.id);
      } else if (alert.type === 'dealership' && onQuickApproveRep && (alert.details?.id || alert.details?.agencyCode)) {
        onQuickApproveRep(alert.details.id || alert.details.agencyCode);
      } else if (alert.type === 'callback' && onQuickHandleCallback && alert.details?.id) {
        await onQuickHandleCallback(alert.details.id);
      } else {
        onNavigateTab(alert.targetTab);
        setIsOpen(false);
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Trigger Button */}
      <button
        type="button"
        id="admin-alerts-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 sm:p-3 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-2xl border border-slate-200 shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        title="مرکز اعلان‌ها و رویدادهای زنده"
      >
        <div className="relative">
          <Bell size={20} className={unreadCount > 0 ? "text-emerald-600 animate-bounce" : "text-slate-500"} />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600 text-white text-[9px] font-black items-center justify-center font-mono">
                {unreadCount > 99 ? "+۹۹" : toPersianNum(unreadCount)}
              </span>
            </span>
          )}
        </div>
        <span className="hidden xl:inline text-xs font-black text-slate-800">
          رویدادها و درخواست‌ها
        </span>
        {unreadCount > 0 && (
          <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-amber-900 border border-emerald-200">
            {toPersianNum(unreadCount)} مورد جدید
          </span>
        )}
      </button>

      {/* Dropdown / Drawer Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div 
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="fixed sm:absolute left-2 right-2 sm:left-0 sm:right-auto top-16 sm:top-full sm:mt-2 sm:w-[460px] md:w-[500px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[640px] text-right"
              dir="rtl"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-amber-400 flex items-center justify-center font-black">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black">مرکز رویدادها و درخواست‌های زنده</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black font-mono">
                          {toPersianNum(unreadCount)} اقدام فوری
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 font-bold mt-0.5">
                      درخواست‌های مشتریان، ثبت‌نام‌ها و سفارشات جدید نیازمند تایید
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onRefresh && (
                    <button
                      onClick={onRefresh}
                      className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="بروزرسانی داده‌ها"
                    >
                      <RefreshCw size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-3 bg-slate-50 border-b border-slate-100 overflow-x-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                    selectedFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200/80"
                  }`}
                >
                  همه ({toPersianNum(allAlerts.length)})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFilter("orders")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedFilter === "orders"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200/80"
                  }`}
                >
                  <ShoppingCart size={13} />
                  <span>سفارشات ({toPersianNum(allAlerts.filter(a => a.type === 'order').length)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFilter("reps")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedFilter === "reps"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200/80"
                  }`}
                >
                  <Building2 size={13} />
                  <span>نمایندگان و ثبت‌نام ({toPersianNum(allAlerts.filter(a => a.type === 'dealership' || a.type === 'user').length)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedFilter("callbacks")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    selectedFilter === "callbacks"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200/80"
                  }`}
                >
                  <PhoneCall size={13} />
                  <span>تماس و تیکت ({toPersianNum(allAlerts.filter(a => a.type === 'callback' || a.type === 'ticket').length)})</span>
                </button>
              </div>

              {/* Alerts List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar divide-y divide-slate-100">
                {filteredAlerts.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-3">
                    <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
                      <CheckCircle2 size={28} />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-slate-800">هیچ درخواست یا رویداد معلقی وجود ندارد</h5>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        تمام سفارشات، ثبت‌نام‌ها و پیام‌های خریداران به روزرسانی و بررسی شده‌اند.
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredAlerts.map(alert => (
                    <div
                      key={`alert-item-${alert.id}`}
                      onClick={() => {
                        onNavigateTab(alert.targetTab);
                        setIsOpen(false);
                      }}
                      className="pt-2.5 first:pt-0 bg-white hover:bg-slate-50/80 p-3 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                            {getAlertIcon(alert.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                                {alert.title}
                              </span>
                              <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[9px] font-black">
                                {alert.typeLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {alert.timeAgo}
                              </span>
                              {alert.priorityLabel && (
                                <span className={`font-black ${alert.isUrgent ? "text-emerald-600" : "text-emerald-600"}`}>
                                  • {alert.priorityLabel}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount or Value */}
                        {alert.amountToman ? (
                          <div className="text-left shrink-0">
                            <span className="text-xs font-black text-emerald-700 font-mono">
                              {toPersianNum(alert.amountToman.toLocaleString())}
                            </span>
                            <span className="text-[9px] text-slate-400 mr-0.5">تومان</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Requester Contact Info */}
                      <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-slate-800">{alert.requesterName}</span>
                          {alert.requesterCompany && (
                            <span className="text-slate-400 truncate">({alert.requesterCompany})</span>
                          )}
                          {alert.requesterCity && (
                            <span className="text-slate-400">| {alert.requesterCity}</span>
                          )}
                        </div>

                        {alert.requesterPhone && (
                          <a
                            href={`tel:${alert.requesterPhone}`}
                            onClick={e => e.stopPropagation()}
                            className="text-emerald-700 font-mono font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 shrink-0 transition-colors"
                            dir="ltr"
                          >
                            <Phone size={10} />
                            <span>{toPersianNum(alert.requesterPhone)}</span>
                          </a>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 group-hover:text-slate-600 transition-colors">
                          <span>برای مشاهده و مدیریت کلیک کنید</span>
                          <ArrowLeft size={11} />
                        </span>

                        <div className="flex items-center gap-1.5">
                          {(alert.type === 'order' || alert.type === 'dealership' || alert.type === 'callback') && (
                            <button
                              type="button"
                              disabled={processingId === alert.id}
                              onClick={(e) => handleQuickAction(alert, e)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <Check size={11} />
                              <span>{alert.type === 'callback' ? 'ثبت تماس' : 'تایید فوری'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              onNavigateTab(alert.targetTab);
                              setIsOpen(false);
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink size={11} />
                            <span>باز کردن</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('approvals');
                    setIsOpen(false);
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>رفتن به صف جامع تاییدیه و کارتابل</span>
                  <ArrowLeft size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 text-[11px] font-bold transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
