import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, ShieldCheck, MapPin, Search, Plus, Download, 
  RefreshCw, Edit3, Trash2, Phone, FileText, X, AlertCircle, Send, Minus
} from "lucide-react";
import { toPersianNum } from "../utils/persian-utils";
import { CRMCustomer, updateCRMCustomer, addCRMCustomer, deleteCRMCustomer } from "../lib/crm-helper";
import { db, addDoc, collection, serverTimestamp } from "../lib/data-layer";

interface AdminCRMProps {
  crmCustomers: CRMCustomer[];
  crmLoading: boolean;
  products: any[];
  setLoading: (val: boolean) => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
  loadCrmCustomers: () => Promise<void>;
  onUpdateOrders?: () => Promise<void>;
}

export default function AdminCRM({
  crmCustomers,
  crmLoading,
  products,
  setLoading,
  setSuccessMsg,
  setErrorMsg,
  confirmAction,
  loadCrmCustomers,
  onUpdateOrders
}: AdminCRMProps) {
  // Local UI State
  const [crmSearch, setCrmSearch] = useState("");
  const [crmBadgeFilter, setCrmBadgeFilter] = useState("all");
  const [crmRoleFilter, setCrmRoleFilter] = useState<any>("all");
  const [selectedCrmIds, setSelectedCrmIds] = useState<string[]>([]);

  // Modal Visibility States
  const [showCrmModal, setShowCrmModal] = useState(false);
  const [editingCrmCustomer, setEditingCrmCustomer] = useState<CRMCustomer | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState<CRMCustomer | null>(null);
  const [showCrmBatchEditModal, setShowCrmBatchEditModal] = useState(false);
  const [showDirectInvoiceModal, setShowDirectInvoiceModal] = useState<CRMCustomer | null>(null);

  // CRM Form States
  const [crmName, setCrmName] = useState("");
  const [crmPhone, setCrmPhone] = useState("");
  const [crmCompany, setCrmCompany] = useState("");
  const [crmCity, setCrmCity] = useState("تهران");
  const [crmYear, setCrmYear] = useState(1400);
  const [crmBadge, setCrmBadge] = useState<'bronze' | 'silver' | 'gold' | 'vip'>("bronze");
  const [crmStatus, setCrmStatus] = useState<'active' | 'pending_verification' | 'suspended'>("active");
  const [crmNotes, setCrmNotes] = useState("");
  const [crmTotalOrders, setCrmTotalOrders] = useState(0);
  const [crmTotalPurchase, setCrmTotalPurchase] = useState(0);
  const [crmRole, setCrmRole] = useState<'customer' | 'representative' | 'marketer' | 'factory'>("customer");

  // Notification Form States
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationBody, setNotificationBody] = useState("");

  // Batch Edit States
  const [batchCrmBadge, setBatchCrmBadge] = useState("");
  const [batchCrmStatus, setBatchCrmStatus] = useState("");
  const [batchCrmCity, setBatchCrmCity] = useState("");

  // Direct Invoice States
  const [directPaymentStatus, setDirectPaymentStatus] = useState("pending");
  const [directShippingMethod, setDirectShippingMethod] = useState("barbari");
  const [directAddress, setDirectAddress] = useState("");
  const [directInvoiceItems, setDirectInvoiceItems] = useState<any[]>([]);

  // Handlers
  const filteredCrmList = crmCustomers.filter(c => {
    const matchesSearch = 
      (c.name || '').toLowerCase().includes(crmSearch.toLowerCase()) || 
      (c.company || '').toLowerCase().includes(crmSearch.toLowerCase()) || 
      (c.phone || '').toLowerCase().includes(crmSearch.toLowerCase()) ||
      (c.city || '').toLowerCase().includes(crmSearch.toLowerCase());
    
    const matchesBadge = crmBadgeFilter === 'all' || c.badge === crmBadgeFilter;
    const matchesRole = crmRoleFilter === 'all' || c.role === crmRoleFilter || (!c.role && crmRoleFilter === 'customer');
    return matchesSearch && matchesBadge && matchesRole;
  });

  const handleToggleSelectCrm = (id: string) => {
    setSelectedCrmIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllCrm = () => {
    const filteredIds = filteredCrmList.map(c => c.id);
    const allSelected = filteredIds.every(id => selectedCrmIds.includes(id));
    if (allSelected) {
      setSelectedCrmIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedCrmIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleAddCrmClick = () => {
    setEditingCrmCustomer(null);
    setCrmName("");
    setCrmPhone("");
    setCrmCompany("");
    setCrmCity("تهران");
    setCrmYear(1400);
    setCrmBadge("bronze");
    setCrmStatus("active");
    setCrmNotes("");
    setCrmTotalOrders(0);
    setCrmTotalPurchase(0);
    setCrmRole("customer");
    setShowCrmModal(true);
  };

  const handleEditCrmClick = (c: CRMCustomer) => {
    setEditingCrmCustomer(c);
    setCrmName(c.name || "");
    setCrmPhone(c.phone || "");
    setCrmCompany(c.company || "");
    setCrmCity(c.city || "تهران");
    setCrmYear(c.establishedYear || 1400);
    setCrmBadge(c.badge || "bronze");
    setCrmStatus(c.status as any || "active");
    setCrmNotes(c.notes || "");
    setCrmTotalOrders(c.totalOrdersCount || 0);
    setCrmTotalPurchase(c.totalPurchaseValue || 0);
    setCrmRole(c.role || "customer");
    setShowCrmModal(true);
  };

  const handleCrmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        name: crmName,
        phone: crmPhone,
        company: crmCompany,
        city: crmCity,
        establishedYear: Number(crmYear),
        badge: crmBadge,
        status: crmStatus,
        notes: crmNotes,
        totalOrdersCount: Number(crmTotalOrders),
        totalPurchaseValue: Number(crmTotalPurchase),
        role: crmRole
      };

      if (editingCrmCustomer) {
        await updateCRMCustomer(editingCrmCustomer.id, payload);
        setSuccessMsg("اطلاعات کاربر با موفقیت بروزرسانی شد.");
      } else {
        await addCRMCustomer(payload);
        setSuccessMsg("کاربر جدید با موفقیت اضافه شد.");
      }
      setShowCrmModal(false);
      setEditingCrmCustomer(null);
      await loadCrmCustomers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره اطلاعات مشتری.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrmCustomer = async (id: string) => {
    confirmAction(
      "حذف بنکدار",
      "آیا از حذف این بنکدار از باشگاه مشتریان اطمینان دارید؟",
      async () => {
        setLoading(true);
        try {
          await deleteCRMCustomer(id);
          setSuccessMsg("بنکدار با موفقیت از سیستم حذف شد.");
          await loadCrmCustomers();
          setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err: any) {
          setErrorMsg("خطا در حذف بنکدار.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleBatchDeleteCrm = async () => {
    if (selectedCrmIds.length === 0) return;
    confirmAction(
      "حذف گروهی بنکداران",
      `آیا از حذف ${selectedCrmIds.length} بنکدار انتخاب شده از باشگاه مشتریان اطمینان دارید؟ این عمل غیرقابل بازگشت است.`,
      async () => {
        setLoading(true);
        try {
          for (const id of selectedCrmIds) {
            await deleteCRMCustomer(id);
          }
          setSuccessMsg(`تعداد ${selectedCrmIds.length} بنکدار با موفقیت حذف شدند.`);
          setSelectedCrmIds([]);
          await loadCrmCustomers();
          setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err) {
          setErrorMsg("خطا در حذف گروهی بنکداران.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleBatchUpdateCrm = async () => {
    if (selectedCrmIds.length === 0) return;
    setLoading(true);
    try {
      const updates: Partial<CRMCustomer> = {};
      if (batchCrmBadge) updates.badge = batchCrmBadge as any;
      if (batchCrmStatus) updates.status = batchCrmStatus as any;
      if (batchCrmCity) updates.city = batchCrmCity;

      for (const id of selectedCrmIds) {
        await updateCRMCustomer(id, updates);
      }

      setSuccessMsg(`اطلاعات ${selectedCrmIds.length} بنکدار با موفقیت ویرایش گروهی شد.`);
      setSelectedCrmIds([]);
      setShowCrmBatchEditModal(false);
      setBatchCrmBadge("");
      setBatchCrmStatus("");
      setBatchCrmCity("");
      await loadCrmCustomers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setErrorMsg("خطا در ویرایش گروهی بنکداران.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCrmCsv = () => {
    if (filteredCrmList.length === 0) {
      alert("هیچ بنکداری برای خروجی گرفتن وجود ندارد.");
      return;
    }
    const headers = ["نام بنکدار", "نام شرکت / فروشگاه", "شماره تماس", "شهر", "وضعیت", "رتبه/نشان", "تعداد سفارشات", "مجموع خرید (تومان)"];
    const rows = filteredCrmList.map(c => [
      `"${c.name || ''}"`,
      `"${c.company || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.city || ''}"`,
      `"${c.status || ''}"`,
      `"${c.badge || ''}"`,
      c.totalOrdersCount || 0,
      c.totalPurchaseValue || 0
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `dastavval_crm_export_${new Date().toLocaleDateString('fa-IR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendNotificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showNotificationModal) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "notifications"), {
        customerId: showNotificationModal.id,
        customerName: showNotificationModal.name,
        company: showNotificationModal.company,
        title: notificationTitle,
        body: notificationBody,
        createdAt: new Date(),
        isRead: false
      });
      setSuccessMsg(`اعلان با موفقیت برای شرکت «${showNotificationModal.company}» ارسال و ثبت شد.`);
      setShowNotificationModal(null);
      setNotificationTitle("");
      setNotificationBody("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("خطا در ارسال اعلان.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (directInvoiceItems.length === 0) {
      alert("لطفا حداقل یک کالا به فاکتور اضافه کنید.");
      return;
    }
    if (!showDirectInvoiceModal) return;
    setLoading(true);
    try {
      const orderItems = directInvoiceItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantityCartons: item.quantity,
        pricePerCarton: item.product.bulkPrice || item.product.price,
        totalItems: item.quantity * (item.product.cartonPackCount || 24)
      }));

      const totalSum = orderItems.reduce((sum, item) => sum + (item.pricePerCarton * item.quantityCartons), 0);
      const firstProduct = directInvoiceItems[0].product;

      const newOrder = {
        trackingNumber: `DO-${Math.floor(100000 + Math.random() * 900000)}`,
        buyerName: showDirectInvoiceModal.name,
        buyerPhone: showDirectInvoiceModal.phone,
        buyerCompany: showDirectInvoiceModal.company,
        buyerAddress: directAddress || showDirectInvoiceModal.city,
        sellerName: firstProduct.sellerName || "دفتر فروش مرکزی",
        sellerId: firstProduct.sellerId || "factory_direct",
        items: orderItems,
        totalAmount: totalSum,
        status: 'order_received',
        paymentStatus: directPaymentStatus,
        shippingMethod: directShippingMethod,
        isDirectFactoryInvoice: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "orders"), newOrder);
      setSuccessMsg("فاکتور کارخانه‌ای با موفقیت صادر و به لیست سفارشات افزوده شد.");
      setShowDirectInvoiceModal(null);
      setDirectInvoiceItems([]);
      setDirectAddress("");
      if (onUpdateOrders) await onUpdateOrders();
    } catch (err) {
      setErrorMsg("خطا در صدور فاکتور.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDirectItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = directInvoiceItems.find(i => i.product.id === productId);
    if (existing) {
      setDirectInvoiceItems(directInvoiceItems.map(i => i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setDirectInvoiceItems([...directInvoiceItems, { product, quantity: 1 }]);
    }
  };

  const handleRemoveDirectItem = (productId: string) => {
    setDirectInvoiceItems(directInvoiceItems.filter(i => i.product.id !== productId));
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* CRM Quick Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">کل بنکداران ثبت‌شده</span>
            <span className="text-xl font-black text-slate-900">{toPersianNum(crmCustomers.length)} نفر</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">اعضای ویژه & طلایی</span>
            <span className="text-xl font-black text-amber-600">
              {toPersianNum(crmCustomers.filter(c => c.badge === 'vip' || c.badge === 'gold').length)} نفر
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            ⭐
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block mb-0.5">وضعیت فعال تاییدشده</span>
            <span className="text-xl font-black text-emerald-600">
              {toPersianNum(crmCustomers.filter(c => c.status === 'active').length)} نفر
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <ShieldCheck size={20} />
          </div>
        </div>
      </div>

      {/* CRM Tools Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={crmSearch}
              onChange={e => setCrmSearch(e.target.value)}
              placeholder="جستجو در نام، شرکت، موبایل یا شهر..." 
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select 
            value={crmBadgeFilter}
            onChange={e => setCrmBadgeFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black outline-none cursor-pointer"
          >
            <option value="all">همه رتبه‌ها</option>
            <option value="vip">VIP</option>
            <option value="gold">طلایی</option>
            <option value="silver">نقره‌ای</option>
            <option value="bronze">برنزی</option>
          </select>
          <select 
            value={crmRoleFilter}
            onChange={e => setCrmRoleFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-black outline-none cursor-pointer"
          >
            <option value="all">همه نقش‌ها</option>
            <option value="customer">مشتری</option>
            <option value="representative">نماینده</option>
            <option value="marketer">بازاریاب</option>
            <option value="factory">تولیدکننده</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {selectedCrmIds.length > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
              <button 
                onClick={handleBatchDeleteCrm}
                className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black border border-rose-100 hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-2"
              >
                <Trash2 size={14} />
                حذف گروهی ({toPersianNum(selectedCrmIds.length)})
              </button>
              <button 
                onClick={() => setShowCrmBatchEditModal(true)}
                className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 hover:bg-indigo-100 transition-all cursor-pointer flex items-center gap-2"
              >
                <Edit3 size={14} />
                ویرایش گروهی
              </button>
            </div>
          )}
          <button 
            onClick={handleExportCrmCsv}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <Download size={14} />
            خروجی CSV
          </button>
          <button 
            onClick={handleAddCrmClick}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            <Plus size={14} />
            افزودن بنکدار
          </button>
        </div>
      </div>

      {/* CRM Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4">
                <input 
                  type="checkbox" 
                  checked={filteredCrmList.length > 0 && filteredCrmList.every(c => selectedCrmIds.includes(c.id))}
                  onChange={handleToggleSelectAllCrm}
                  className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer" 
                />
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">مشخصات بنکدار</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">شهر / منطقه</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">وضعیت</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">حجم خرید کل</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {crmLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="animate-spin text-indigo-500" size={32} />
                    <p className="text-xs font-black text-slate-400">در حال بارگذاری لیست مشتریان...</p>
                  </div>
                </td>
              </tr>
            ) : filteredCrmList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <p className="text-xs font-black text-slate-400">هیچ بنکداری با این مشخصات یافت نشد.</p>
                </td>
              </tr>
            ) : (
              filteredCrmList.map((c, cIdx) => (
                <tr key={`crm-row-${c.id || cIdx}-${cIdx}`} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedCrmIds.includes(c.id)}
                      onChange={() => handleToggleSelectCrm(c.id)}
                      className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer" 
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-slate-100 ${
                        c.badge === 'vip' ? 'bg-amber-50 text-amber-600' : 
                        c.badge === 'gold' ? 'bg-amber-50 text-amber-600' :
                        c.badge === 'silver' ? 'bg-slate-50 text-slate-500' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {c.badge === 'vip' ? '👑' : c.badge === 'gold' ? '🥇' : c.badge === 'silver' ? '🥈' : '🥉'}
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{c.company}</h5>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{c.name} • {toPersianNum(c.phone)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-300" />
                      <span className="text-xs font-black text-slate-700">{c.city}</span>
                    </div>
                    {c.establishedYear && (
                      <p className="text-[9px] text-slate-400 font-bold mt-1">تاسیس: {toPersianNum(c.establishedYear)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border ${
                      c.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      c.status === 'suspended' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                      {c.status === 'active' ? 'فعال' : c.status === 'suspended' ? 'مسدود' : 'در انتظار'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-xs font-black text-slate-800">{toPersianNum(c.totalPurchaseValue.toLocaleString())} تومان</p>
                    <p className="text-[9px] text-indigo-500 font-bold mt-1">{toPersianNum(c.totalOrdersCount)} سفارش موفق</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setShowNotificationModal(c)}
                        className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all cursor-pointer" 
                        title="ارسال اعلان"
                      >
                        <Send size={14} />
                      </button>
                      <button 
                        onClick={() => setShowDirectInvoiceModal(c)}
                        className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" 
                        title="صدور فاکتور"
                      >
                        <FileText size={14} />
                      </button>
                      <button 
                        onClick={() => handleEditCrmClick(c)}
                        className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer" 
                        title="ویرایش"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCrmCustomer(c.id)}
                        className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer" 
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CRM Modals Container (Integrated into sub-component) */}
      <AnimatePresence>
        {/* CRM Form Modal */}
        {showCrmModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCrmModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {editingCrmCustomer ? "ویرایش اطلاعات بنکدار" : "افزودن بنکدار به باشگاه مشتریان"}
                    </h3>
                  </div>
                </div>
                <button onClick={() => setShowCrmModal(false)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCrmSubmit} className="p-8 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">نام کامل بنکدار / نماینده:</label>
                    <input type="text" required value={crmName} onChange={e => setCrmName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">نام شرکت / پخش:</label>
                    <input type="text" required value={crmCompany} onChange={e => setCrmCompany(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">شماره تلفن همراه:</label>
                    <input type="text" required value={crmPhone} onChange={e => setCrmPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono outline-none text-left font-bold" dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">شهر محل فعالیت:</label>
                    <input type="text" required value={crmCity} onChange={e => setCrmCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">سال تاسیس:</label>
                    <input type="number" required value={crmYear} onChange={e => setCrmYear(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">نقش کاربر:</label>
                    <select value={crmRole} onChange={e => setCrmRole(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                      <option value="customer">👥 مشتری (بنکدار)</option>
                      <option value="representative">🛡️ نماینده رسمی فروش</option>
                      <option value="marketer">📣 بازاریاب و معرف</option>
                      <option value="factory">🏭 کارخانه / تولیدکننده</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">سطح وفاداری:</label>
                    <select value={crmBadge} onChange={e => setCrmBadge(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                      <option value="vip">تاج طلایی (VIP)</option>
                      <option value="gold">رتبه عالی (طلا)</option>
                      <option value="silver">رتبه همکار (نقره)</option>
                      <option value="bronze">عضو جدید (برنز)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">وضعیت حساب:</label>
                    <select value={crmStatus} onChange={e => setCrmStatus(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all">
                      <option value="active">فعال و تایید شده</option>
                      <option value="pending_verification">در انتظار احراز مدارک</option>
                      <option value="suspended">مسدود شده</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">یادداشت اداری:</label>
                  <textarea rows={3} value={crmNotes} onChange={e => setCrmNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowCrmModal(false)} className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black transition-all cursor-pointer">انصراف</button>
                  <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer">ذخیره اطلاعات</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotificationModal(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800">🔔 ارسال اعلان به {showNotificationModal.company}</h3>
                <button onClick={() => setShowNotificationModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
              </div>
              <form onSubmit={handleSendNotificationSubmit} className="p-8 space-y-4">
                <input type="text" required value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)} placeholder="عنوان اعلان..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <textarea rows={4} required value={notificationBody} onChange={e => setNotificationBody(e.target.value)} placeholder="متن پیام..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <button type="submit" className="w-full py-3.5 bg-amber-500 text-white font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 cursor-pointer">ارسال سریع اعلان</button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Direct Invoice Modal */}
        {showDirectInvoiceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDirectInvoiceModal(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">🧾 صدور فاکتور برای {showDirectInvoiceModal.company}</h3>
                <button onClick={() => setShowDirectInvoiceModal(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
              </div>
              <form onSubmit={handleCreateDirectInvoice} className="p-8 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">وضعیت تسویه:</label>
                    <select value={directPaymentStatus} onChange={e => setDirectPaymentStatus(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="pending">در انتظار پرداخت</option>
                      <option value="paid">نقدی تسویه شده</option>
                      <option value="unpaid">امانی / چک</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400">روش ارسال:</label>
                    <select value={directShippingMethod} onChange={e => setDirectShippingMethod(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20">
                      <option value="barbari">باربری سراسری</option>
                      <option value="tipax">تیپاکس / پست</option>
                      <option value="direct">تحویل حضوری انبار</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <label className="block text-[11px] font-black text-slate-500">افزودن کالا به فاکتور:</label>
                  <div className="flex gap-2">
                    <select id="direct-product-select" className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black outline-none focus:border-emerald-500">
                      <option value="">انتخاب محصول از انبار...</option>
                      {products.map((p, pIdx) => <option key={`crm-prod-opt-${p.id || pIdx}-${pIdx}`} value={p.id}>{p.name} ({p.brand})</option>)}
                    </select>
                    <button type="button" onClick={() => {
                      const sel = document.getElementById('direct-product-select') as HTMLSelectElement;
                      if (sel.value) handleAddDirectItem(sel.value);
                    }} className="px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer"><Plus size={18} /></button>
                  </div>

                  <div className="space-y-2 mt-4">
                    {directInvoiceItems.map((item, itemIdx) => (
                      <div key={`crm-invoice-item-${item.product.id || itemIdx}-${itemIdx}`} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={item.product.imageUrl} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="text-[10px] font-black text-slate-800">{item.product.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{toPersianNum(item.product.bulkPrice?.toLocaleString() || item.product.price?.toLocaleString())} تومان / کارتن</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <button type="button" onClick={() => setDirectInvoiceItems(directInvoiceItems.map(i => i.product.id === item.product.id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="text-slate-400 hover:text-slate-600"><Minus size={14} /></button>
                            <span className="text-xs font-black w-6 text-center">{toPersianNum(item.quantity)}</span>
                            <button type="button" onClick={() => setDirectInvoiceItems(directInvoiceItems.map(i => i.product.id === item.product.id ? { ...i, quantity: i.quantity + 1 } : i))} className="text-slate-400 hover:text-slate-600"><Plus size={14} /></button>
                          </div>
                          <button type="button" onClick={() => handleRemoveDirectItem(item.product.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold">مجموع مبلغ فاکتور:</p>
                    <p className="text-lg font-black text-emerald-600">{toPersianNum(directInvoiceItems.reduce((s, i) => s + (i.quantity * (i.product.bulkPrice || i.product.price)), 0).toLocaleString())} تومان</p>
                  </div>
                  <button type="submit" className="px-10 py-3.5 bg-emerald-600 text-white font-black rounded-2xl text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all cursor-pointer">تایید و صدور فاکتور</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Batch Edit Modal */}
        {showCrmBatchEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCrmBatchEditModal(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800">✏️ ویرایش گروهی ({toPersianNum(selectedCrmIds.length)} بنکدار)</h3>
                <button onClick={() => setShowCrmBatchEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">نشان بنکداری:</label>
                  <select value={batchCrmBadge} onChange={e => setBatchCrmBadge(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">-- بدون تغییر --</option>
                    <option value="bronze">🥉 برنزی</option>
                    <option value="silver">🥈 نقره‌ای</option>
                    <option value="gold">🥇 طلایی</option>
                    <option value="vip">👑 VIP</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400">وضعیت تایید:</label>
                  <select value={batchCrmStatus} onChange={e => setBatchCrmStatus(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <option value="">-- بدون تغییر --</option>
                    <option value="active">فعال</option>
                    <option value="pending_verification">در انتظار</option>
                    <option value="suspended">مسدود</option>
                  </select>
                </div>
                <button onClick={handleBatchUpdateCrm} className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-600/20 cursor-pointer">اعمال تغییرات گروهی</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
