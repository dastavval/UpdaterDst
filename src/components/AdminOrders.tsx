import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ClipboardList, Search, RefreshCw, ShoppingBag, 
  Activity, Edit3, Printer, CheckCircle, X, User, ShoppingCart, Trash2, Plus, Save, Phone, Copy, Check,
  ChevronDown, ChevronUp, ExternalLink, Package, ShieldCheck, MapPin, Calendar, CreditCard, Building2, Eye
} from "lucide-react";
import { doc, updateDoc, db } from "../lib/data-layer";
import { toPersianNum } from "../utils/persian-utils";
import { generateInvoiceUrl } from "../lib/invoice-url-helper";

interface AdminOrdersProps {
  orders: any[];
  ordersLoading: boolean;
  ordersSearch: string;
  setOrdersSearch: (val: string) => void;
  fetchOrders: () => Promise<void>;
  handleUpdateOrderStatus: (orderId: string, status: string) => Promise<void>;
  panelRole: string;
  formatOrderDate: (date: any) => string;
  getStatusLabel: (status: string) => { text: string; color: string };
  setLoading: (val: boolean) => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
  setShowPrintInvoice: (order: any) => void;
}

export default function AdminOrders({
  orders,
  ordersLoading,
  ordersSearch,
  setOrdersSearch,
  fetchOrders,
  handleUpdateOrderStatus,
  panelRole,
  formatOrderDate,
  getStatusLabel,
  setLoading,
  setSuccessMsg,
  setErrorMsg,
  confirmAction,
  setShowPrintInvoice
}: AdminOrdersProps) {
  // Local states for editing & viewing
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editBuyerName, setEditBuyerName] = useState("");
  const [editBuyerPhone, setEditBuyerPhone] = useState("");
  const [editBuyerCompany, setEditBuyerCompany] = useState("");
  const [editBuyerAddress, setEditBuyerAddress] = useState("");
  const [editTotalAmount, setEditTotalAmount] = useState(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState("pending");
  const [editOrderItems, setEditOrderItems] = useState<any[]>([]);

  const handleStartEditOrder = (order: any) => {
    if (!order) return;
    setEditingOrder(order);
    setEditBuyerName(order.buyerName || order.customerName || order.userFullName || "");
    setEditBuyerPhone(order.buyerPhone || order.customerPhone || order.phone || "");
    setEditBuyerCompany(order.buyerCompany || order.storeName || order.companyName || "");
    setEditBuyerAddress(order.buyerAddress || order.shippingAddress || "");
    setEditTotalAmount(Number(order.totalAmount || order.finalTotal || order.total || 0));
    setEditPaymentStatus(order.paymentStatus || order.status || "pending");

    const rawItems = order.items || [];
    const mapped = rawItems.map((it: any, i: number) => ({
      productId: it.productId || it.id || `item_${i}_${Date.now()}`,
      name: it.name || it.productName || it.title || "کالای سفارشی",
      quantityCartons: Number(it.quantityCartons || it.quantity || it.cartonsCount || 1),
      pricePerCarton: Number(it.pricePerCarton || it.bulk_price || it.price || it.unitPrice || 0),
      totalItems: Number(it.totalItems || 0)
    }));

    if (mapped.length === 0) {
      mapped.push({
        productId: `manual_${Date.now()}`,
        name: "کالای سفارشی دستی",
        quantityCartons: 1,
        pricePerCarton: 0,
        totalItems: 0
      });
    }

    setEditOrderItems(mapped);
  };

  const handleSaveOrderEdit = async () => {
    setLoading(true);
    try {
      const orderRef = doc(db, "orders", editingOrder.id);
      await updateDoc(orderRef, {
        buyerName: editBuyerName,
        buyerPhone: editBuyerPhone,
        buyerCompany: editBuyerCompany,
        buyerAddress: editBuyerAddress,
        totalAmount: Number(editTotalAmount),
        paymentStatus: editPaymentStatus,
        items: editOrderItems
      });
      setSuccessMsg("تغییرات فاکتور و اقلام با موفقیت در سیستم ذخیره شد.");
      setEditingOrder(null);
      fetchOrders();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      setErrorMsg("خطا در ذخیره فاکتور: " + (e.message || ""));
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyInvoiceLink = (order: any) => {
    const url = generateInvoiceUrl(order.trackingNumber || order.id);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInvoiceId(order.id || order.trackingNumber);
      setSuccessMsg(`لینک پیش‌فاکتور سفارش ${order.trackingNumber || order.id} کپی شد.`);
      setTimeout(() => {
        setCopiedInvoiceId(null);
        setSuccessMsg(null);
      }, 3000);
    }).catch(() => {
      setErrorMsg("خطا در کپی لینک");
      setTimeout(() => setErrorMsg(null), 3000);
    });
  };

  const statusTabs = [
    { key: "all", label: "همه سفارشات", count: orders.length },
    { key: "pending", label: "در انتظار بررسی", count: orders.filter(o => o.status === 'pending').length },
    { key: "processing", label: "آماده‌سازی کارخانه", count: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length },
    { key: "shipped", label: "تحویل به باربری", count: orders.filter(o => o.status === 'shipped').length },
    { key: "delivered", label: "تحویل نهایی", count: orders.filter(o => o.status === 'delivered').length },
    { key: "cancelled", label: "لغو شده", count: orders.filter(o => o.status === 'cancelled').length },
  ];

  const filteredOrders = orders.filter(o => {
    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "processing" && (o.status === "processing" || o.status === "confirmed")) {
        // match
      } else if (o.status !== statusFilter) {
        return false;
      }
    }
    // Search query filter
    if (!ordersSearch.trim()) return true;
    const q = ordersSearch.toLowerCase().trim();
    const track = String(o.trackingNumber || "").toLowerCase();
    const name = String(o.buyerName || "").toLowerCase();
    const phone = String(o.buyerPhone || o.customerPhone || o.phone || "").toLowerCase();
    const company = String(o.buyerCompany || "").toLowerCase();
    return track.includes(q) || name.includes(q) || phone.includes(q) || company.includes(q);
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-right flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">کل فاکتورهای عمده</span>
            <h4 className="text-2xl font-black text-slate-900">{toPersianNum(orders.length)} <span className="text-xs font-bold text-slate-500">سفارش</span></h4>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
            <ClipboardList size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-right flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">ارزش کل مبادلات</span>
            <h4 className="text-xl font-black text-emerald-700 font-mono">
              {toPersianNum(orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0).toLocaleString())} <span className="text-xs font-bold text-slate-500 font-sans">تومان</span>
            </h4>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm text-right flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 font-bold">سفارشات در جریان</span>
            <h4 className="text-2xl font-black text-amber-700">
              {toPersianNum(orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length)} <span className="text-xs font-bold text-slate-500">فعال</span>
            </h4>
          </div>
          <div className="w-11 h-11 bg-amber-50 text-amber-700 rounded-xl flex items-center justify-center">
            <Package size={22} />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1 text-right">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="text-emerald-700" size={20} />
              مدیریت و پیگیری سفارشات عمده مشتریان
            </h3>
            <p className="text-xs text-slate-500">
              مشاهده اقلام، تغییر وضعیت سفارش، صدور و چاپ پیش‌فاکتور رسمی و ارسال به ترابری
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="جستجوی کد سفارش، خریدار یا تلفن..."
                value={ordersSearch}
                onChange={e => setOrdersSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all outline-none text-right"
              />
            </div>

            <button 
              onClick={fetchOrders}
              disabled={ordersLoading}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs shrink-0"
              title="بروزرسانی داده‌ها"
            >
              <RefreshCw size={15} className={ordersLoading ? "animate-spin" : ""} />
              <span>بروزرسانی</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar border-t border-slate-100 pt-3">
          {statusTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                statusFilter === tab.key ? "bg-emerald-800 text-emerald-100" : "bg-white text-slate-600 border border-slate-200"
              }`}>
                {toPersianNum(tab.count)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
              <th className="p-4 font-bold text-center w-12">جزئیات</th>
              <th className="p-4 font-bold">کد پیگیری</th>
              <th className="p-4 font-bold">مشخصات خریدار و تماس</th>
              <th className="p-4 font-bold">تاریخ ثبت</th>
              <th className="p-4 font-bold">مبلغ فاکتور (تومان)</th>
              <th className="p-4 font-bold">وضعیت سفارش</th>
              <th className="p-4 font-bold text-center">عملیات و اسناد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {ordersLoading ? (
              [1, 2, 3].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="p-6 h-12 bg-slate-50/60"></td>
                </tr>
              ))
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-16 text-center text-slate-400 font-bold">
                  <Activity size={36} className="mx-auto mb-2 text-slate-300" />
                  هیچ سفارشی مطابق با فیلترهای انتخابی یافت نشد.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o, oIdx) => {
                const isExpanded = expandedOrderId === (o.id || o.trackingNumber);
                const orderItems = Array.isArray(o.items) ? o.items : [];
                const totalCartons = orderItems.reduce((s: number, it: any) => s + (Number(it.quantityCartons || it.quantity || 1)), 0);

                return (
                  <tbody key={`admin-order-group-${o.id || o.trackingNumber || oIdx}-${oIdx}`}>
                    <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? "bg-emerald-50/20" : ""}`}>
                      {/* Expand Toggle */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setExpandedOrderId(isExpanded ? null : (o.id || o.trackingNumber))}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-all cursor-pointer"
                          title={isExpanded ? "بستن جزئیات" : "مشاهده اقلام خریداری‌شده"}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>

                      {/* Tracking Code */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit">
                            #{o.trackingNumber || (o.id ? o.id.slice(-6).toUpperCase() : "---")}
                          </span>
                          <span className="text-[10px] text-slate-500 font-bold">
                            {toPersianNum(orderItems.length)} ردیف کالا ({toPersianNum(totalCartons)} کارتن)
                          </span>
                        </div>
                      </td>

                      {/* Buyer Details */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-900">{o.buyerName || o.buyer || "خریدار همکار"}</span>
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
                                className="font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded inline-flex items-center gap-1 transition-colors border border-emerald-100"
                                dir="ltr"
                                title="تماس با مشتری"
                              >
                                <Phone size={10} />
                                {toPersianNum(o.buyerPhone || o.customerPhone || o.phone || o.mobile)}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-slate-600 font-bold">{formatOrderDate(o.createdAt)}</td>

                      {/* Amount */}
                      <td className="p-4">
                        <span className="font-black text-emerald-700 font-mono text-sm">
                          {toPersianNum((Number(o.totalAmount) || 0).toLocaleString())}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal mr-1">تومان</span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 border ${getStatusLabel(o.status || 'pending').color}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {getStatusLabel(o.status || 'pending').text}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Status Selector */}
                          <select 
                            defaultValue={o.status || 'pending'}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="text-xs font-bold bg-slate-100 border border-slate-300 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600 transition-all cursor-pointer text-slate-800"
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
                            className="p-1.5 text-slate-700 hover:bg-slate-100 hover:text-emerald-700 rounded-lg transition-all cursor-pointer border border-slate-200"
                            title="مشاهده و چاپ پیش‌فاکتور رسمی"
                          >
                            <Printer size={15} />
                          </button>

                          {/* Copy Proforma Invoice Link */}
                          <button 
                            onClick={() => handleCopyInvoiceLink(o)}
                            className="p-1.5 text-slate-700 hover:bg-slate-100 hover:text-indigo-700 rounded-lg transition-all cursor-pointer border border-slate-200"
                            title="کپی لینک پیش‌فاکتور جهت ارسال به مشتری"
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
                            className="p-1.5 text-slate-700 hover:bg-slate-100 hover:text-blue-700 rounded-lg transition-all cursor-pointer border border-slate-200"
                            title="ویرایش مشخصات و اقلام فاکتور"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row Content */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={7} className="p-4">
                          <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2">
                              <h5 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                                <ShoppingCart size={15} className="text-emerald-700" />
                                لیست کالاهای سفارش داده شده:
                              </h5>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setShowPrintInvoice(o)}
                                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-all flex items-center gap-1 border border-emerald-200 cursor-pointer"
                                >
                                  <Eye size={13} />
                                  مشاهده پیش‌فاکتور کامل (PDF / چاپ)
                                </button>
                              </div>
                            </div>

                            {/* Items List */}
                            {orderItems.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">اقلام سفارش ثبت نشده است.</p>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {orderItems.map((it: any, itemIdx: number) => {
                                  const qCartons = Number(it.quantityCartons || it.quantity || 1);
                                  const pCarton = Number(it.pricePerCarton || it.bulk_price || it.price || 0);
                                  const rowSubtotal = qCartons * pCarton;
                                  return (
                                    <div 
                                      key={`expanded-item-${itemIdx}`}
                                      className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <p className="font-bold text-slate-900">{it.name || it.productName || "کالای عمده"}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                          {it.brand ? `برند: ${it.brand} | ` : ''}
                                          {toPersianNum(qCartons)} کارتن × {toPersianNum(pCarton.toLocaleString())} تومان
                                        </p>
                                      </div>
                                      <div className="text-left">
                                        <span className="font-bold font-mono text-emerald-800">
                                          {toPersianNum(rowSubtotal.toLocaleString())}
                                        </span>
                                        <span className="text-[10px] text-slate-500 mr-1">تومان</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Additional Order Meta (Address & Notes) */}
                            {(o.buyerAddress || o.address || o.notes || o.description) && (
                              <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-600">
                                {(o.buyerAddress || o.address) && (
                                  <div className="flex items-center gap-1">
                                    <MapPin size={13} className="text-slate-400 shrink-0" />
                                    <span><strong>آدرس تحویل:</strong> {o.buyerAddress || o.address}</span>
                                  </div>
                                )}
                                {(o.notes || o.description) && (
                                  <div className="flex items-center gap-1">
                                    <span><strong>توضیحات خریدار:</strong> {o.notes || o.description}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Order Editing Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden text-right border border-slate-200 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      ویرایش فاکتور رسمی #{editingOrder.id ? editingOrder.id.slice(-6).toUpperCase() : ""}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      امکان تغییر نام کالا، تعداد کارتن، قیمت فی و مشخصات خریدار
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingOrder(null)} 
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-all cursor-pointer text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
                {/* Buyer Info Form */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User size={14} className="text-emerald-700" />
                    <span>اطلاعات تحویل‌گیرنده و فاکتور:</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">نام خریدار / مسئول سفارش</label>
                      <input 
                        value={editBuyerName} 
                        onChange={e => setEditBuyerName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">نام فروشگاه / شرکت</label>
                      <input 
                        value={editBuyerCompany} 
                        onChange={e => setEditBuyerCompany(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">شماره تماس مستقیم</label>
                      <input 
                        value={editBuyerPhone} 
                        onChange={e => setEditBuyerPhone(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">وضعیت پرداخت</label>
                      <select
                        value={editPaymentStatus}
                        onChange={e => setEditPaymentStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                      >
                        <option value="pending">در انتظار پرداخت</option>
                        <option value="paid">تسویه کامل</option>
                        <option value="unpaid">پرداخت نشده / چک</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">آدرس دقیق تحویل و باربری</label>
                    <textarea 
                      value={editBuyerAddress} 
                      onChange={e => setEditBuyerAddress(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Editable Items Table Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <ShoppingCart size={14} className="text-emerald-700" />
                      <span>اقلام و قیمت کالاها:</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const total = editOrderItems.reduce((sum, it) => sum + ((Number(it.quantityCartons) || 0) * (Number(it.pricePerCarton) || 0)), 0);
                        setEditTotalAmount(total);
                      }}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer border border-emerald-200"
                    >
                      <RefreshCw size={12} />
                      <span>محاسبه خودکار جمع کل</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {editOrderItems.map((item, idx) => (
                      <div 
                        key={`admin-orders-edit-item-${item.productId || idx}-${idx}`} 
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2.5"
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
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
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
                            className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-center text-emerald-700 outline-none focus:border-emerald-600"
                          />
                          <span className="text-[11px] text-slate-500">کارتن</span>
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
                            className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-center text-slate-900 outline-none focus:border-emerald-600"
                          />
                        </div>

                        {/* Subtotal */}
                        <div className="text-left min-w-[90px]">
                          <span className="text-[11px] font-bold text-emerald-800 font-mono">
                            {toPersianNum(((Number(item.quantityCartons) || 0) * (Number(item.pricePerCarton) || 0)).toLocaleString())}
                          </span>
                        </div>

                        {/* Delete button */}
                        <button 
                          type="button"
                          onClick={() => setEditOrderItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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
                      className="w-full py-2.5 border border-dashed border-slate-300 hover:border-emerald-600 rounded-xl text-xs font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>+ افزودن ردیف کالای جدید</span>
                    </button>
                  </div>
                </div>

                {/* Total Amount Input */}
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-0.5">مبلغ نهایی قابل پرداخت (تومان):</label>
                    <p className="text-[11px] text-slate-500">
                      می‌توانید جمع اقلام را محاسبه یا دستی ویرایش نمایید.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      value={editTotalAmount} 
                      onChange={e => setEditTotalAmount(Number(e.target.value))}
                      className="w-40 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-emerald-800 outline-none focus:border-emerald-600 font-mono text-center shadow-sm"
                    />
                    <span className="text-xs font-bold text-slate-700">تومان</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5">
                <button
                  onClick={handleSaveOrderEdit}
                  disabled={ordersLoading}
                  className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Save size={16} />
                  <span>ذخیره تغییرات فاکتور</span>
                </button>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-5 bg-white border border-slate-200 text-slate-700 font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer text-xs"
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
