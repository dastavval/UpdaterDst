import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClipboardList, 
  Search, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Building2, 
  Phone, 
  MapPin, 
  Printer, 
  Copy, 
  Check, 
  Edit3, 
  ShoppingCart, 
  Eye, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  CreditCard, 
  Package, 
  Activity, 
  User, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  ExternalLink,
  Handshake,
  Percent
} from "lucide-react";
import { toPersianNum } from "../utils/persian-utils";

interface AdminOrdersProps {
  orders: any[];
  ordersLoading: boolean;
  ordersSearch: string;
  setOrdersSearch: (val: string) => void;
  fetchOrders: () => void;
  handleUpdateOrderStatus: (orderId: string, status: string) => Promise<void>;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onBatchDeleteOrders?: (ids: string[]) => Promise<void>;
  panelRole?: string;
  formatOrderDate: (dateVal: any) => string;
  getStatusLabel: (status: string) => { text: string; color: string };
  setLoading?: (val: boolean) => void;
  setSuccessMsg?: (msg: string | null) => void;
  setErrorMsg?: (msg: string | null) => void;
  confirmAction?: (title: string, message: string, onConfirm: () => void) => void;
  setShowPrintInvoice: (order: any) => void;
}

export default function AdminOrders({
  orders = [],
  ordersLoading,
  ordersSearch,
  setOrdersSearch,
  fetchOrders,
  handleUpdateOrderStatus,
  onDeleteOrder,
  onBatchDeleteOrders,
  panelRole,
  formatOrderDate,
  getStatusLabel,
  setLoading,
  setSuccessMsg,
  setErrorMsg,
  confirmAction,
  setShowPrintInvoice
}: AdminOrdersProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<any | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Editing state
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editBuyerName, setEditBuyerName] = useState("");
  const [editBuyerPhone, setEditBuyerPhone] = useState("");
  const [editBuyerCompany, setEditBuyerCompany] = useState("");
  const [editBuyerAddress, setEditBuyerAddress] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("pending");
  const [editOrderItems, setEditOrderItems] = useState<any[]>([]);
  const [editTotalAmount, setEditTotalAmount] = useState<number>(0);

  // Status Tabs calculation
  const statusTabs = useMemo(() => {
    const counts = {
      all: orders.length,
      pending: orders.filter(o => !o.status || o.status === "pending" || o.status === "order_received" || o.status === "awaiting_approval" || o.status === "pending_payment").length,
      processing: orders.filter(o => o.status === "processing" || o.status === "confirmed" || o.status === "paid" || o.status === "payment_verified").length,
      shipped: orders.filter(o => o.status === "shipped" || o.status === "in_transit").length,
      delivered: orders.filter(o => o.status === "delivered" || o.status === "completed").length,
      cancelled: orders.filter(o => o.status === "cancelled" || o.status === "rejected").length,
    };

    return [
      { key: "all", label: "همه سفارشات", count: counts.all },
      { key: "pending", label: "در انتظار بررسی", count: counts.pending },
      { key: "processing", label: "تایید و آماده‌سازی انبار", count: counts.processing },
      { key: "shipped", label: "تحویل باربری / ترابری", count: counts.shipped },
      { key: "delivered", label: "تحویل نهایی شد", count: counts.delivered },
      { key: "cancelled", label: "لغو شده", count: counts.cancelled },
    ];
  }, [orders]);

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          const isPending = !o.status || o.status === "pending" || o.status === "order_received" || o.status === "awaiting_approval" || o.status === "pending_payment";
          if (!isPending) return false;
        } else if (statusFilter === "processing") {
          const isProcessing = o.status === "processing" || o.status === "confirmed" || o.status === "paid" || o.status === "payment_verified";
          if (!isProcessing) return false;
        } else if (statusFilter === "shipped") {
          const isShipped = o.status === "shipped" || o.status === "in_transit";
          if (!isShipped) return false;
        } else if (statusFilter === "delivered") {
          const isDelivered = o.status === "delivered" || o.status === "completed";
          if (!isDelivered) return false;
        } else if (statusFilter === "cancelled") {
          const isCancelled = o.status === "cancelled" || o.status === "rejected";
          if (!isCancelled) return false;
        } else if (o.status !== statusFilter) {
          return false;
        }
      }

      // Search filter
      if (!ordersSearch.trim()) return true;
      const q = ordersSearch.toLowerCase().trim();
      const track = String(o.trackingNumber || o.id || "").toLowerCase();
      const name = String(o.buyerName || o.customerName || o.userFullName || o.name || "").toLowerCase();
      const phone = String(o.buyerPhone || o.customerPhone || o.phone || o.mobile || "").toLowerCase();
      const company = String(o.buyerCompany || o.storeName || "").toLowerCase();
      const address = String(o.buyerAddress || o.address || "").toLowerCase();
      return track.includes(q) || name.includes(q) || phone.includes(q) || company.includes(q) || address.includes(q);
    });
  }, [orders, statusFilter, ordersSearch]);

  // Start editing order
  const handleStartEditOrder = (o: any) => {
    setEditingOrder(o);
    setEditBuyerName(o.buyerName || o.customerName || o.userFullName || o.name || "");
    setEditBuyerPhone(o.buyerPhone || o.customerPhone || o.phone || o.mobile || "");
    setEditBuyerCompany(o.buyerCompany || o.storeName || "");
    setEditBuyerAddress(o.buyerAddress || o.address || "");
    setEditPaymentStatus(o.paymentStatus || "pending");
    
    const items = Array.isArray(o.items) ? o.items.map((it: any) => ({
      productId: it.productId || it.id || Math.random().toString(),
      name: it.name || it.productName || it.title || "کالای عمده",
      quantityCartons: Number(it.quantityCartons || it.quantity || 1),
      pricePerCarton: Number(it.pricePerCarton || it.bulk_price || it.price || 0),
      totalItems: Number(it.totalItems || 0),
      brand: it.brand || ""
    })) : [];

    setEditOrderItems(items);
    setEditTotalAmount(Number(o.totalAmount || o.finalTotal || o.total || 0));
  };

  // Save Order Edit
  const handleSaveOrderEdit = async () => {
    if (!editingOrder) return;
    try {
      const orderId = editingOrder.id || editingOrder.trackingNumber;
      const updatedData = {
        ...editingOrder,
        buyerName: editBuyerName,
        buyerPhone: editBuyerPhone,
        buyerCompany: editBuyerCompany,
        buyerAddress: editBuyerAddress,
        paymentStatus: editPaymentStatus,
        items: editOrderItems,
        totalAmount: editTotalAmount,
        updatedAt: new Date().toISOString()
      };

      // 1. Update in local storage caches
      try {
        const cached = JSON.parse(localStorage.getItem("dastavval_orders_cache") || "[]");
        const nextCached = cached.map((c: any) => (c.id === orderId || c.trackingNumber === orderId) ? { ...c, ...updatedData } : c);
        localStorage.setItem("dastavval_orders_cache", JSON.stringify(nextCached));

        const raw = JSON.parse(localStorage.getItem("dastavval_raw_orders") || "[]");
        const nextRaw = raw.map((c: any) => (c.id === orderId || c.trackingNumber === orderId) ? { ...c, ...updatedData } : c);
        localStorage.setItem("dastavval_raw_orders", JSON.stringify(nextRaw));
      } catch (err) {}

      // 2. Refresh parent list
      fetchOrders();
      if (selectedOrderDetail && (selectedOrderDetail.id === orderId || selectedOrderDetail.trackingNumber === orderId)) {
        setSelectedOrderDetail(updatedData);
      }
      setEditingOrder(null);
      if (setSuccessMsg) setSuccessMsg("تغییرات فاکتور و اقلام با موفقیت ذخیره و اعمال گردید.");
    } catch (e: any) {
      if (setErrorMsg) setErrorMsg("خطا در ذخیره ویرایش فاکتور: " + (e.message || ""));
    }
  };

  // Get pre-configured platform commission rate from system config
  const getPlatformCommissionRate = (): number => {
    try {
      const saved = localStorage.getItem("dastavval_b2b_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.commissionRate === 'number') return parsed.commissionRate;
        if (typeof parsed.commissionPercent === 'number') return parsed.commissionPercent;
      }
    } catch (e) {}
    return 5;
  };

  // Toggle approval / rejection of RFQ bids by Admin
  const handleToggleBidApproval = (orderId: string, bidId: string, newStatus: 'approved' | 'rejected') => {
    if (!selectedOrderDetail) return;

    const updatedBids = (selectedOrderDetail.bids || []).map((bid: any) => {
      if (String(bid.id) === String(bidId)) {
        return {
          ...bid,
          status: newStatus,
          approved: newStatus === 'approved',
          updatedAt: new Date().toISOString()
        };
      }
      return bid;
    });

    const updatedOrder = {
      ...selectedOrderDetail,
      bids: updatedBids,
      updatedAt: new Date().toISOString()
    };

    setSelectedOrderDetail(updatedOrder);

    try {
      const rawSaved = localStorage.getItem("dastavval_raw_orders");
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (Array.isArray(parsed)) {
          const nextRaw = parsed.map((o: any) => (String(o.id) === String(orderId) || String(o.trackingNumber) === String(orderId)) ? updatedOrder : o);
          localStorage.setItem("dastavval_raw_orders", JSON.stringify(nextRaw));
        }
      }

      const mockSaved = localStorage.getItem("mock_db_orders") || localStorage.getItem("dastavval_orders");
      if (mockSaved) {
        const parsed = JSON.parse(mockSaved);
        if (Array.isArray(parsed)) {
          const nextMock = parsed.map((o: any) => (String(o.id) === String(orderId) || String(o.trackingNumber) === String(orderId)) ? updatedOrder : o);
          localStorage.setItem("mock_db_orders", JSON.stringify(nextMock));
        }
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
    window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));

    if (fetchOrders) fetchOrders();

    if (setSuccessMsg) {
      if (newStatus === 'approved') {
        setSuccessMsg("پیشنهاد تامین با موفقیت تایید و در تالار عمومی RFQ منتشر گردید.");
      } else {
        setSuccessMsg("پیشنهاد تامین رد شد و از انتشار عمومی منع گردید.");
      }
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Copy invoice shareable link
  const handleCopyInvoiceLink = (o: any) => {
    const trackCode = o.trackingNumber || (o.id ? String(o.id || "").slice(-6).toUpperCase() : "");
    const url = `${window.location.origin}/?track=${encodeURIComponent(trackCode)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInvoiceId(o.id || o.trackingNumber);
      setTimeout(() => setCopiedInvoiceId(null), 3000);
      if (setSuccessMsg) setSuccessMsg(`لینک پیگیری پیش‌فاکتور #${trackCode} در کلیپ‌بورد کپی شد.`);
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id || o.trackingNumber));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (!onBatchDeleteOrders || selectedOrderIds.length === 0) return;
    if (confirm(`آیا از حذف گروهی ${selectedOrderIds.length} فاکتور مطمئن هستید؟`)) {
      await onBatchDeleteOrders(selectedOrderIds);
      setSelectedOrderIds([]);
    }
  };

  // Status helper mapping
  const resolveStatusBadge = (statusStr: string) => {
    const s = String(statusStr || "pending").toLowerCase();
    if (s === "pending" || s === "order_received" || s === "awaiting_approval" || s === "pending_payment") {
      return { text: "در انتظار بررسی", bg: "bg-emerald-50 text-amber-800 border-emerald-200", dot: "bg-emerald-500" };
    }
    if (s === "processing" || s === "confirmed" || s === "paid" || s === "payment_verified") {
      return { text: "تایید مالی / آماده‌سازی", bg: "bg-blue-50 text-blue-800 border-blue-200", dot: "bg-emerald-500" };
    }
    if (s === "shipped" || s === "in_transit") {
      return { text: "تحویل به باربری", bg: "bg-purple-50 text-purple-800 border-purple-200", dot: "bg-purple-500" };
    }
    if (s === "delivered" || s === "completed") {
      return { text: "تحویل نهایی شد", bg: "bg-emerald-600 text-white border-emerald-200", dot: "bg-emerald-500" };
    }
    if (s === "cancelled" || s === "rejected") {
      return { text: "لغو شده", bg: "bg-emerald-50 text-rose-800 border-emerald-200", dot: "bg-emerald-500" };
    }
    return { text: statusStr, bg: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-right flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">کل فاکتورهای عمده</span>
            <h4 className="text-2xl font-black text-slate-900 font-mono">{toPersianNum(orders.length)} <span className="text-xs font-bold text-slate-500 font-sans">سفارش</span></h4>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center border border-blue-100">
            <ClipboardList size={22} />
          </div>
        </div>

        {/* Card 2: Total Turnover */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-right flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">ارزش کل مبادلات</span>
            <h4 className="text-xl font-black text-emerald-700 font-mono">
              {toPersianNum(orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.finalTotal || o.total) || 0), 0).toLocaleString())} <span className="text-xs font-bold text-slate-500 font-sans">تومان</span>
            </h4>
          </div>
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center border border-emerald-100">
            <CreditCard size={22} />
          </div>
        </div>

        {/* Card 3: Pending Orders */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-right flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">در انتظار بررسی فوری</span>
            <h4 className="text-2xl font-black text-emerald-600 font-mono">
              {toPersianNum(orders.filter(o => !o.status || o.status === 'pending' || o.status === 'order_received' || o.status === 'awaiting_approval').length)} <span className="text-xs font-bold text-slate-500 font-sans">سفارش</span>
            </h4>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-amber-700 rounded-2xl flex items-center justify-center border border-emerald-100">
            <Clock size={22} />
          </div>
        </div>

        {/* Card 4: Shipped / Active Logistics */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs text-right flex items-center justify-between hover:border-slate-300 transition-all">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">تحویل باربری و ترابری</span>
            <h4 className="text-2xl font-black text-purple-700 font-mono">
              {toPersianNum(orders.filter(o => o.status === 'shipped' || o.status === 'in_transit').length)} <span className="text-xs font-bold text-slate-500 font-sans">در راه</span>
            </h4>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center border border-purple-100">
            <Truck size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1 text-right">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="text-emerald-700" size={20} />
              مدیریت و پیگیری جامع سفارشات عمده و فاکتورها
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              مشاهده اقلام، صدور پیش‌فاکتور رسمی، تغییر وضعیت، ویرایش مشخصات خریدار و ارسال به ترابری
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="جستجوی کد سفارش، نام خریدار، تلفن، شرکت..."
                value={ordersSearch}
                onChange={e => setOrdersSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-right font-bold"
              />
            </div>

            <button 
              onClick={fetchOrders}
              disabled={ordersLoading}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs shrink-0 active:scale-95"
              title="بروزرسانی داده‌ها"
            >
              <RefreshCw size={15} className={ordersLoading ? "animate-spin" : ""} />
              <span>بروزرسانی</span>
            </button>

            {onDeleteOrder && orders.length > 0 && (
              <button 
                onClick={async () => {
                  if (confirm("آیا از پاکسازی تمام فاکتورهای خالی یا ناقص (بدون نام خریدار یا اقلام) مطمئن هستید؟")) {
                    const toDelete = orders.filter(o => !o.buyerName && (!o.items || o.items.length === 0));
                    if (toDelete.length > 0 && onBatchDeleteOrders) {
                      const ids = toDelete.map(o => o.id || o.trackingNumber).filter(Boolean) as string[];
                      if (ids.length > 0) await onBatchDeleteOrders(ids);
                    }
                  }
                }}
                className="px-4 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-black rounded-2xl transition-all border border-rose-100 flex items-center gap-2 cursor-pointer text-xs shrink-0"
              >
                <Trash2 size={15} />
                <span>پاکسازی ناقص‌ها</span>
              </button>
            )}

            {onBatchDeleteOrders && selectedOrderIds.length > 0 && (
              <button 
                onClick={handleBatchDelete}
                className="px-4 py-2.5 bg-rose-600 text-white hover:bg-rose-700 font-black rounded-2xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer text-xs shrink-0"
              >
                <Trash2 size={15} />
                <span>حذف گروهی ({toPersianNum(selectedOrderIds.length)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar border-t border-slate-100 pt-3">
          {statusTabs.map((tab, tIdx) => (
            <button
              key={`admin-order-tab-${tab.key}-${tIdx}`}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${
                statusFilter === tab.key ? "bg-slate-800 text-emerald-300" : "bg-white text-slate-600 border border-slate-200"
              }`}>
                {toPersianNum(tab.count)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-black">
                <th className="p-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-center w-12">جزئیات</th>
                <th className="p-4">کد پیگیری سفارش</th>
                <th className="p-4">مشخصات خریدار و تماس</th>
                <th className="p-4">تاریخ ثبت</th>
                <th className="p-4">مبلغ فاکتور (تومان)</th>
                <th className="p-4">وضعیت سفارش</th>
                <th className="p-4 text-center">عملیات و اسناد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold">
              {ordersLoading ? (
                [1, 2, 3, 4].map(i => (
                  <tr key={`adminorders-skeleton-${i}`} className="animate-pulse">
                    <td colSpan={7} className="p-6 h-16 bg-slate-50/40"></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-slate-400 font-bold space-y-3">
                    <Activity size={40} className="mx-auto text-slate-300" />
                    <p className="text-sm text-slate-600">هیچ سفارشی مطابق با فیلترهای انتخابی یافت نشد.</p>
                    <p className="text-xs text-slate-400">می‌توانید فیلتر وضعیت را روی «همه سفارشات» قرار دهید یا جستجو را پاک کنید.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o, oIdx) => {
                    const orderId = o.id || o.trackingNumber || `ERR-${oIdx}`;
                    const isExpanded = expandedOrderId === orderId;
                    const orderItems = Array.isArray(o.items) ? o.items : [];
                    const totalCartons = orderItems.reduce((s: number, it: any) => s + (Number(it.quantityCartons || it.quantity || 1)), 0);
                    const badgeInfo = resolveStatusBadge(o.status);
                    const orderAmount = Number(o.totalAmount || o.finalTotal || o.total || 0);
                    
                    const isCorrupted = !o.buyerName && (!o.items || o.items.length === 0);

                    return (
                      <React.Fragment key={`admin-order-row-${orderId}-${oIdx}`}>
                        <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? "bg-emerald-50/20" : ""} ${selectedOrderIds.includes(orderId) ? "bg-blue-50/40" : ""} ${isCorrupted ? "bg-rose-50/10" : ""}`}>
                          <td className="p-4 text-center">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              checked={selectedOrderIds.includes(orderId)}
                              onChange={() => toggleSelectOrder(orderId)}
                            />
                          </td>
                          {/* Expand Toggle Button */}
                          <td className="p-4 text-center">
                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : orderId)}
                              className="p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition-all cursor-pointer"
                              title={isExpanded ? "بستن جزئیات" : "مشاهده اقلام خریداری‌شده"}
                            >
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </td>

                          {/* Tracking Code */}
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="font-mono text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 w-fit">
                                #{o.trackingNumber || (o.id ? String(o.id || "").slice(-6).toUpperCase() : "MISSING-ID")}
                              </span>
                              {isCorrupted && (
                                <span className="text-[9px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg border border-rose-200 w-fit">
                                  دیتای ناقص / خطا
                                </span>
                              )}
                              {o.type === "equipment" && (
                                <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-200 w-fit">
                                  خرید تجهیزات صنعتی
                                </span>
                              )}
                              {o.isCatalogOrder && (
                                <span className="text-[9px] font-black bg-purple-50 text-purple-700 px-2 py-0.5 rounded-lg border border-purple-200 w-fit flex items-center gap-1">
                                  <ExternalLink size={10} />
                                  ثبت از کاتالوگ الکترونیک
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500 font-bold">
                                {toPersianNum(orderItems.length)} ردیف کالا ({toPersianNum(totalCartons)} کارتن)
                              </span>
                          </div>
                        </td>

                        {/* Buyer Details */}
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-black text-slate-900 text-sm">
                              {o.buyerName || o.customerName || o.userFullName || o.buyer || (o.items && o.items.length > 0 ? "خریدار نامشخص" : "فاکتور خالی / سیستمی")}
                            </span>
                            {o.buyerCompany && (
                              <span className="text-[11px] text-slate-600 flex items-center gap-1">
                                <Building2 size={12} className="text-slate-400" />
                                {o.buyerCompany}
                              </span>
                            )}
                            {(o.buyerPhone || o.customerPhone || o.phone || o.mobile) && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <a 
                                  href={`tel:${o.buyerPhone || o.customerPhone || o.phone || o.mobile}`}
                                  className="font-mono text-[11px] font-black text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 transition-colors border border-emerald-200"
                                  dir="ltr"
                                  title="تماس مستقیم با خریدار"
                                >
                                  <Phone size={11} />
                                  {toPersianNum(o.buyerPhone || o.customerPhone || o.phone || o.mobile)}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-4 text-slate-600 font-bold whitespace-nowrap">
                          {formatOrderDate(o.createdAt)}
                        </td>

                        {/* Amount */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-black text-emerald-700 font-mono text-sm">
                            {toPersianNum(orderAmount.toLocaleString())}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal mr-1">تومان</span>
                        </td>

                        {/* Status */}
                        <td className="p-4 whitespace-nowrap">
                          <div className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 border ${badgeInfo.bg}`}>
                            <span className={`w-2 h-2 rounded-full ${badgeInfo.dot}`}></span>
                            {badgeInfo.text}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Detailed View Modal Trigger */}
                            <button
                              onClick={() => setSelectedOrderDetail(o)}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 border border-emerald-200 cursor-pointer"
                              title="مشاهده پرونده کامل سفارش"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">مشاهده کامل</span>
                            </button>

                            {/* Status Selector Dropdown */}
                            <select 
                              value={o.status || 'pending'}
                              onChange={(e) => handleUpdateOrderStatus(o.id || o.trackingNumber, e.target.value)}
                              className="text-xs font-black bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 outline-none focus:border-emerald-600 transition-all cursor-pointer text-slate-800"
                              title="تغییر وضعیت سفارش"
                            >
                              <option value="pending">در انتظار بررسی</option>
                              <option value="processing">تایید و آماده‌سازی</option>
                              <option value="shipped">تحویل به باربری</option>
                              <option value="delivered">تحویل نهایی شد</option>
                              <option value="cancelled">لغو سفارش</option>
                            </select>

                            {/* Print / View Proforma Invoice */}
                            <button 
                              onClick={() => setShowPrintInvoice(o)}
                              className="p-2 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 rounded-xl transition-all cursor-pointer border border-slate-200"
                              title="چاپ و صدور پیش‌فاکتور رسمی"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Copy Public Link */}
                            <button 
                              onClick={() => handleCopyInvoiceLink(o)}
                              className="p-2 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 rounded-xl transition-all cursor-pointer border border-slate-200"
                              title="کپی لینک پیگیری مشتری"
                            >
                              {copiedInvoiceId === (o.id || o.trackingNumber) ? (
                                <Check size={15} className="text-emerald-600" />
                              ) : (
                                <Copy size={15} />
                              )}
                            </button>

                            {/* Edit items */}
                            <button 
                              onClick={() => handleStartEditOrder(o)}
                              className="p-2 text-slate-700 hover:bg-slate-100 hover:text-blue-700 rounded-xl transition-all cursor-pointer border border-slate-200"
                              title="ویرایش فاکتور و اقلام"
                            >
                              <Edit3 size={15} />
                            </button>

                            {/* Delete Order */}
                            {onDeleteOrder && (
                              <button 
                                onClick={() => {
                                  if (confirm(`آیا از حذف کامل فاکتور #${o.trackingNumber || o.id} مطمئن هستید؟ این عمل غیرقابل بازگشت است.`)) {
                                    onDeleteOrder(o.id || o.trackingNumber);
                                  }
                                }}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-rose-100"
                                title="حذف دائمی فاکتور"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Accordion Preview */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={8} className="p-4">
                            <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-xs">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                                <h5 className="font-black text-slate-900 flex items-center gap-2 text-xs">
                                  <ShoppingCart size={16} className="text-emerald-700" />
                                  لیست اقلام سفارش داده شده ({toPersianNum(orderItems.length)} قلم کالا):
                                </h5>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setShowPrintInvoice(o)}
                                    className="text-xs font-black text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-emerald-200 cursor-pointer"
                                  >
                                    <Printer size={13} />
                                    چاپ پیش‌فاکتور رسمی
                                  </button>
                                  <button
                                    onClick={() => setSelectedOrderDetail(o)}
                                    className="text-xs font-black text-blue-800 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer"
                                  >
                                    <Eye size={13} />
                                    مشاهده پرونده کامل
                                  </button>
                                </div>
                              </div>

                              {/* Items Grid */}
                              {orderItems.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">اقلام سفارش ثبت نشده است.</p>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {orderItems.map((it: any, itemIdx: number) => {
                                    const qCartons = Number(it.quantityCartons || it.quantity || 1);
                                    const pCarton = Number(it.pricePerCarton || it.bulk_price || it.price || 0);
                                    const rowSubtotal = qCartons * pCarton;
                                    return (
                                      <div 
                                        key={`expanded-item-${itemIdx}`}
                                        className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs"
                                      >
                                        <div className="space-y-1">
                                          <p className="font-black text-slate-900">{it.name || it.productName || "کالای عمده"}</p>
                                          <p className="text-[11px] text-slate-500 font-bold">
                                            {it.brand ? `برند: ${it.brand} | ` : ''}
                                            {toPersianNum(qCartons)} کارتن × {toPersianNum(pCarton.toLocaleString())} تومان
                                          </p>
                                        </div>
                                        <div className="text-left shrink-0">
                                          <span className="font-black font-mono text-emerald-800">
                                            {toPersianNum(rowSubtotal.toLocaleString())}
                                          </span>
                                          <span className="text-[10px] text-slate-400 mr-1 font-bold">تومان</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Address & Note */}
                              {(o.buyerAddress || o.address || o.notes || o.description) && (
                                <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-700 font-bold">
                                  {(o.buyerAddress || o.address) && (
                                    <div className="flex items-center gap-1.5">
                                      <MapPin size={14} className="text-emerald-500 shrink-0" />
                                      <span><strong>آدرس تحویل:</strong> {o.buyerAddress || o.address}</span>
                                    </div>
                                  )}
                                  {(o.notes || o.description) && (
                                    <div className="flex items-center gap-1.5">
                                      <FileText size={14} className="text-slate-400 shrink-0" />
                                      <span><strong>توضیحات خریدار:</strong> {o.notes || o.description}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL ORDER DETAIL MODAL (مشاهده کامل، اصولی و شفاف سفارش) */}
      <AnimatePresence>
        {selectedOrderDetail && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden text-right border border-slate-200 flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/30">
                    <ClipboardList size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black">
                        پرونده جامع سفارش #{selectedOrderDetail.trackingNumber || (selectedOrderDetail.id ? String(selectedOrderDetail.id || "").slice(-6).toUpperCase() : "")}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${resolveStatusBadge(selectedOrderDetail.status).bg}`}>
                        {resolveStatusBadge(selectedOrderDetail.status).text}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-bold mt-0.5">
                      ثبت شده در: {formatOrderDate(selectedOrderDetail.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowPrintInvoice(selectedOrderDetail)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer size={15} />
                    <span>چاپ پیش‌فاکتور رسمی</span>
                  </button>
                  <button 
                    onClick={() => setSelectedOrderDetail(null)} 
                    className="p-2 hover:bg-white/10 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold">
                {/* Workflow Stepper */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold block mb-3">مراحل پیشرفت فرآیند تامین و ترابری:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: "pending", label: "۱. ثبت و استعلام", icon: Clock, active: true },
                      { key: "processing", label: "۲. تایید مالی و انبار", icon: CheckCircle2, active: selectedOrderDetail.status !== 'pending' && selectedOrderDetail.status !== 'cancelled' },
                      { key: "shipped", label: "۳. تحویل به باربری", icon: Truck, active: selectedOrderDetail.status === 'shipped' || selectedOrderDetail.status === 'delivered' },
                      { key: "delivered", label: "۴. تحویل نهایی خریدار", icon: Package, active: selectedOrderDetail.status === 'delivered' },
                    ].map((step, sIdx) => {
                      const StepIcon = step.icon;
                      return (
                        <div 
                          key={`stepper-step-${sIdx}`}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                            step.active 
                              ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
                              : "bg-white text-slate-400 border-slate-200 opacity-60"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            step.active ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                          }`}>
                            <StepIcon size={14} />
                          </div>
                          <span className="text-xs font-black">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Buyer & Logistics Overview Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Buyer Profile */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                      <User size={15} className="text-emerald-700" />
                      مشخصات خریدار و فاکتور
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">نام و نام خانوادگی:</span>
                        <span className="font-black text-slate-900">{selectedOrderDetail.buyerName || selectedOrderDetail.customerName || selectedOrderDetail.buyer || "ثبت نشده"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">شرکت / فروشگاه:</span>
                        <span className="font-black text-slate-900">{selectedOrderDetail.buyerCompany || "شخصی / همکار"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">تلفن تماس:</span>
                        {(selectedOrderDetail.buyerPhone || selectedOrderDetail.phone) ? (
                          <a 
                            href={`tel:${selectedOrderDetail.buyerPhone || selectedOrderDetail.phone}`}
                            className="font-mono text-xs font-black text-emerald-800 bg-emerald-100/60 px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 border border-emerald-200"
                            dir="ltr"
                          >
                            <Phone size={11} />
                            {toPersianNum(selectedOrderDetail.buyerPhone || selectedOrderDetail.phone)}
                          </a>
                        ) : (
                          <span className="text-slate-400">ثبت نشده</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-bold">وضعیت تأدیه و تسویه:</span>
                        <span className="font-black text-xs px-2 py-0.5 rounded-md border font-sans inline-block"
                          style={{
                            backgroundColor: selectedOrderDetail.paymentStatus === 'paid' ? '#ecfdf5' : selectedOrderDetail.paymentStatus === 'partial_paid' ? '#eff6ff' : selectedOrderDetail.paymentStatus === 'cheque' ? '#fdf4ff' : '#fffbeb',
                            color: selectedOrderDetail.paymentStatus === 'paid' ? '#047857' : selectedOrderDetail.paymentStatus === 'partial_paid' ? '#1d4ed8' : selectedOrderDetail.paymentStatus === 'cheque' ? '#7e22ce' : '#b45309',
                            borderColor: selectedOrderDetail.paymentStatus === 'paid' ? '#a7f3d0' : selectedOrderDetail.paymentStatus === 'partial_paid' ? '#bfdbfe' : selectedOrderDetail.paymentStatus === 'cheque' ? '#f5d0fe' : '#fde68a',
                          }}
                        >
                          {selectedOrderDetail.paymentStatus === 'paid' ? '✔ تسویه کامل (نقدی)' : 
                           selectedOrderDetail.paymentStatus === 'partial_paid' ? '💳 تأدیه ۵۰٪ (بیعانه امانی)' :
                           selectedOrderDetail.paymentStatus === 'cheque' ? '📜 تسویه چکی (صیادی)' :
                           selectedOrderDetail.paymentStatus === 'unpaid' ? '❌ پرداخت‌نشده / معوق' : 
                           '⏳ در انتظار تأدیه و واریز'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Delivery Address */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
                      <MapPin size={15} className="text-emerald-600" />
                      آدرس و مشخصات ترابری
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-bold block mb-1">نشانی دقیق دریافت بار:</span>
                        <p className="font-black text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] leading-relaxed">
                          {selectedOrderDetail.buyerAddress || selectedOrderDetail.address || "آدرس توسط مشتری ثبت نشده است (تحویل درب کارخانه/انبار مرکزی)."}
                        </p>
                      </div>
                      {selectedOrderDetail.notes && (
                        <div>
                          <span className="text-slate-500 font-bold block mb-1">توضیحات و هماهنگی باربری:</span>
                          <p className="font-bold text-slate-700 bg-emerald-50/60 p-2 rounded-xl border border-emerald-200 text-[11px]">
                            {selectedOrderDetail.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <ShoppingCart size={15} className="text-emerald-700" />
                      اقلام فاکتور رسمی ({toPersianNum((selectedOrderDetail.items || []).length)} ردیف)
                    </h4>
                    <button
                      onClick={() => {
                        handleStartEditOrder(selectedOrderDetail);
                      }}
                      className="text-xs font-black text-blue-700 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>ویرایش اقلام یا قیمت‌ها</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-black">
                        <tr>
                          <th className="p-3">ردیف</th>
                          <th className="p-3">عنوان محصول</th>
                          <th className="p-3">برند / دسته‌بندی</th>
                          <th className="p-3 text-center">تعداد کارتن</th>
                          <th className="p-3 text-center">قیمت فی کارتن (تومان)</th>
                          <th className="p-3 text-left">مبلغ کل (تومان)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold">
                        {(selectedOrderDetail.items || []).map((it: any, itIdx: number) => {
                          const qCartons = Number(it.quantityCartons || it.quantity || 1);
                          const pCarton = Number(it.pricePerCarton || it.bulk_price || it.price || 0);
                          const rowSubtotal = qCartons * pCarton;
                          return (
                            <tr key={`detail-item-${itIdx}`} className="hover:bg-slate-50/60">
                              <td className="p-3 text-slate-400 font-mono">{toPersianNum(itIdx + 1)}</td>
                              <td className="p-3 text-slate-900 font-black">{it.name || it.productName || "کالای عمده"}</td>
                              <td className="p-3 text-slate-500">{it.brand || "دست‌اول"}</td>
                              <td className="p-3 text-center font-mono font-black text-emerald-800">{toPersianNum(qCartons)}</td>
                              <td className="p-3 text-center font-mono">{toPersianNum(pCarton.toLocaleString())}</td>
                              <td className="p-3 text-left font-mono font-black text-emerald-700">{toPersianNum(rowSubtotal.toLocaleString())}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pre-configured System Commission Notice */}
                <div className="bg-emerald-50/80 border border-emerald-100 p-3.5 rounded-2xl flex items-center justify-between text-xs text-indigo-950 font-bold">
                  <div className="flex items-center gap-2">
                    <Percent size={16} className="text-emerald-600" />
                    <span>نرخ کارمزد و کمیسیون پیش‌تنظیم‌شده سامانه (تنظیم‌شده در تنظیمات سیستم):</span>
                  </div>
                  <span className="bg-emerald-600 text-white font-mono font-black px-3 py-1 rounded-xl text-xs">
                    ٪{toPersianNum(getPlatformCommissionRate())}
                  </span>
                </div>

                {/* RFQ Supplier Proposals Box for Admin */}
                {Array.isArray(selectedOrderDetail.bids) && selectedOrderDetail.bids.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <Handshake size={16} className="text-emerald-600" />
                        <span>مدیریت پیشنهادهای تامین‌کنندگان (RFQs) جهت انتشار در سایت:</span>
                      </h4>
                      <span className="text-[10px] font-black bg-slate-900 text-white px-2.5 py-1 rounded-full">
                        {toPersianNum(selectedOrderDetail.bids.length)} پیشنهاد ثبت‌شده
                      </span>
                    </div>

                    <div className="space-y-3">
                      {selectedOrderDetail.bids.map((bid: any, bIdx: number) => {
                        const isApproved = bid.approved === true || bid.status === 'approved';
                        const isRejected = bid.status === 'rejected';
                        const isPending = !isApproved && !isRejected;

                        return (
                          <div 
                            key={`admin-bid-${bid.id || bIdx}`} 
                            className={`bg-white p-3.5 rounded-2xl border transition-all ${
                              isApproved ? 'border-emerald-300 ring-1 ring-emerald-500/20' : isRejected ? 'border-emerald-200 opacity-75' : 'border-amber-300 bg-emerald-50/30'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="space-y-1.5 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-black text-slate-900 text-sm">{bid.supplierName}</span>
                                  <span className="font-mono text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                                    قیمت: {bid.proposedPrice}
                                  </span>

                                  {/* Status Badge */}
                                  {isApproved && (
                                    <span className="text-[10px] font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                      <CheckCircle2 size={12} className="text-emerald-600" />
                                      <span>تاییدشده و منتشر در تالار</span>
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="text-[10px] font-black bg-emerald-100 text-rose-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                      <AlertCircle size={12} className="text-emerald-600" />
                                      <span>رد شده</span>
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="text-[10px] font-black bg-emerald-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                      <Clock size={12} className="text-emerald-600" />
                                      <span>در انتظار تایید ادمین</span>
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500 font-medium">
                                  زمان تحویل: <strong className="text-slate-700">{bid.deliveryDays}</strong> | تاریخ ثبت: <span className="font-mono">{bid.createdAt}</span>
                                </div>

                                {bid.notes && (
                                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium leading-relaxed">
                                    توضیحات: {bid.notes}
                                  </p>
                                )}
                              </div>

                              {/* Action Buttons for Admin */}
                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                {bid.supplierPhone && (
                                  <a
                                    href={`tel:${bid.supplierPhone}`}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl flex items-center gap-1 border border-slate-200 transition-colors"
                                    dir="ltr"
                                    title="تماس تلفنی"
                                  >
                                    <Phone size={13} />
                                    <span>{toPersianNum(bid.supplierPhone)}</span>
                                  </a>
                                )}

                                {!isApproved && (
                                  <button
                                    onClick={() => handleToggleBidApproval(selectedOrderDetail.id, bid.id, 'approved')}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                                  >
                                    <Check size={14} />
                                    <span>تایید و انتشار</span>
                                  </button>
                                )}

                                {!isRejected && (
                                  <button
                                    onClick={() => handleToggleBidApproval(selectedOrderDetail.id, bid.id, 'rejected')}
                                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs rounded-xl flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                                  >
                                    <X size={14} />
                                    <span>رد</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Financial Summary */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 text-center sm:text-right">
                    <span className="text-xs text-slate-400 font-bold">مبلغ نهایی قابل پرداخت فاکتور:</span>
                    <h3 className="text-2xl font-black text-emerald-400 font-mono">
                      {toPersianNum((Number(selectedOrderDetail.totalAmount || selectedOrderDetail.finalTotal || selectedOrderDetail.total) || 0).toLocaleString())}
                      <span className="text-xs text-slate-300 font-sans mr-1.5 font-bold">تومان</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={selectedOrderDetail.status || 'pending'}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        handleUpdateOrderStatus(selectedOrderDetail.id || selectedOrderDetail.trackingNumber, newStatus);
                        setSelectedOrderDetail({ ...selectedOrderDetail, status: newStatus });
                      }}
                      className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-black outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="pending">تغییر به: در انتظار بررسی</option>
                      <option value="processing">تغییر به: تایید و آماده‌سازی انبار</option>
                      <option value="shipped">تغییر به: تحویل به باربری</option>
                      <option value="delivered">تغییر به: تحویل نهایی شد</option>
                      <option value="cancelled">تغییر به: لغو سفارش</option>
                    </select>

                    <button
                      onClick={() => setShowPrintInvoice(selectedOrderDetail)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer size={16} />
                      <span>چاپ پیش‌فاکتور</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                <button
                  onClick={() => handleCopyInvoiceLink(selectedOrderDetail)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedInvoiceId === (selectedOrderDetail.id || selectedOrderDetail.trackingNumber) ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>کپی لینک پیگیری مشتری</span>
                </button>

                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Editing Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden text-right border border-slate-200 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      ویرایش فاکتور رسمی #{editingOrder.id ? String(editingOrder.id || "").slice(-6).toUpperCase() : ""}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold">
                      امکان تغییر نام کالا، تعداد کارتن، قیمت فی و مشخصات خریدار
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingOrder(null)} 
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs font-bold">
                {/* Buyer Info Form */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <User size={14} className="text-emerald-700" />
                    <span>اطلاعات تحویل‌گیرنده و فاکتور:</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">نام خریدار / مسئول سفارش</label>
                      <input 
                        value={editBuyerName} 
                        onChange={e => setEditBuyerName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">نام فروشگاه / شرکت</label>
                      <input 
                        value={editBuyerCompany} 
                        onChange={e => setEditBuyerCompany(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">شماره تماس مستقیم</label>
                      <input 
                        value={editBuyerPhone} 
                        onChange={e => setEditBuyerPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">وضعیت تأدیه و تسویه فاکتور</label>
                      <select
                        value={editPaymentStatus}
                        onChange={e => setEditPaymentStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600 font-bold"
                      >
                        <option value="pending">⏳ در انتظار تأدیه / واریز</option>
                        <option value="paid">✔ تسویه کامل (نقدی)</option>
                        <option value="partial_paid">💳 تأدیه ۵۰٪ (بیعانه امانی)</option>
                        <option value="cheque">📜 تسویه چکی (صیادی)</option>
                        <option value="unpaid">❌ عدم تأدیه / پرداخت نشده</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">آدرس دقیق تحویل و باربری</label>
                    <textarea 
                      value={editBuyerAddress} 
                      onChange={e => setEditBuyerAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600 font-bold"
                    />
                  </div>
                </div>

                {/* Editable Items Table Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <ShoppingCart size={14} className="text-emerald-700" />
                      <span>اقلام و قیمت کالاها:</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const total = editOrderItems.reduce((sum, it) => sum + ((Number(it.quantityCartons) || 0) * (Number(it.pricePerCarton) || 0)), 0);
                        setEditTotalAmount(total);
                      }}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 text-white rounded-xl text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer border border-emerald-200"
                    >
                      <RefreshCw size={12} />
                      <span>محاسبه خودکار جمع کل</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {editOrderItems.map((item, idx) => (
                      <div 
                        key={`admin-orders-edit-item-${item.productId || idx}-${idx}`} 
                        className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5"
                      >
                        {/* Item Name Input */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name || ""}
                            placeholder="نام کامل محصول"
                            onChange={e => {
                              const next = [...editOrderItems];
                              next[idx].name = e.target.value;
                              setEditOrderItems(next);
                            }}
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600 font-bold"
                          />
                        </div>

                        {/* Item Quantity Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500 font-bold">تعداد:</span>
                          <input 
                            type="number" 
                            min={1}
                            value={item.quantityCartons || 1} 
                            onChange={e => {
                              const next = [...editOrderItems];
                              next[idx].quantityCartons = Math.max(1, Number(e.target.value));
                              setEditOrderItems(next);
                            }}
                            className="w-16 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-mono font-black text-center text-emerald-700 outline-none focus:border-emerald-600"
                          />
                          <span className="text-[11px] text-slate-500 font-bold">کارتن</span>
                        </div>

                        {/* Item Price Per Carton Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500 font-bold">فی (تومان):</span>
                          <input 
                            type="number" 
                            min={0}
                            step={1000}
                            value={item.pricePerCarton || 0} 
                            onChange={e => {
                              const next = [...editOrderItems];
                              next[idx].pricePerCarton = Number(e.target.value);
                              setEditOrderItems(next);
                            }}
                            className="w-28 bg-white border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-mono font-black text-center text-slate-900 outline-none focus:border-emerald-600"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="text-left min-w-[90px]">
                          <span className="text-[11px] font-black text-emerald-800 font-mono">
                            {toPersianNum(((Number(item.quantityCartons) || 0) * (Number(item.pricePerCarton) || 0)).toLocaleString())}
                          </span>
                        </div>

                        {/* Delete button */}
                        <button 
                          type="button"
                          onClick={() => setEditOrderItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                          title="حذف ردیف"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}

                    <button 
                      type="button"
                      onClick={() => {
                        setEditOrderItems(prev => [
                          ...prev, 
                          { productId: `manual_${Date.now()}`, name: 'کالای جدید', quantityCartons: 1, pricePerCarton: 0, totalItems: 0 }
                        ]);
                      }}
                      className="w-full py-2.5 border border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl text-xs font-black text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>+ افزودن ردیف کالای جدید به فاکتور</span>
                    </button>
                  </div>
                </div>

                {/* Total Amount Input */}
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-0.5">مبلغ نهایی قابل پرداخت (تومان):</label>
                    <p className="text-[11px] text-slate-500 font-bold">
                      می‌توانید جمع اقلام را محاسبه یا دستی ویرایش نمایید.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={editTotalAmount} 
                      onChange={e => setEditTotalAmount(Number(e.target.value))}
                      className="w-44 bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-black text-emerald-800 outline-none focus:border-emerald-600 font-mono text-center shadow-xs"
                    />
                    <span className="text-xs font-black text-slate-700">تومان</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
                <button
                  onClick={handleSaveOrderEdit}
                  disabled={ordersLoading}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 rounded-2xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Save size={16} />
                  <span>ذخیره تغییرات فاکتور</span>
                </button>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-5 bg-white border border-slate-200 text-slate-700 font-black py-2.5 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer text-xs"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
