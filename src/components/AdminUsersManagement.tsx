import { useState, useMemo, useEffect } from "react";
import { 
  Users, Search, Plus, Filter, Download, RefreshCw, 
  Edit3, Trash2, Phone, Building2, MapPin, ShieldCheck, 
  ShoppingBag, CheckCircle2, AlertCircle, X, ShieldAlert,
  Calendar, Eye, ArrowUpDown, DollarSign, Wallet, Send,
  UserCheck, UserX, FileText, ChevronDown, Check, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianNum } from "../utils/persian-utils";
import { ManagedUser, fetchUnifiedUsers, syncUserFromOrder, cleanIranianPhone } from "../lib/user-sync-helper";
import { IRAN_PROVINCES_AND_CITIES } from "../utils/dealershipCityTiers";

interface AdminUsersManagementProps {
  orders: any[];
  setLoading: (val: boolean) => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
  b2bConfig?: any;
}

export default function AdminUsersManagement({
  orders,
  setLoading,
  setSuccessMsg,
  setErrorMsg,
  confirmAction,
  b2bConfig
}: AdminUsersManagementProps) {
  const [usersList, setUsersList] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<'date' | 'purchases' | 'orders'>('date');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [viewingOrdersUser, setViewingOrdersUser] = useState<ManagedUser | null>(null);
  const [showSmsModal, setShowSmsModal] = useState<ManagedUser | null>(null);
  const [smsText, setSmsText] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);

  // Form State for Add / Edit
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formNationalCode, setFormNationalCode] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formCity, setFormCity] = useState("تهران");
  const [formProvince, setFormProvince] = useState("تهران");
  const [formAddress, setFormAddress] = useState("");
  const [formRole, setFormRole] = useState<'customer' | 'representative' | 'marketer' | 'factory' | 'admin' | 'ad_poster'>("customer");
  const [formBadge, setFormBadge] = useState<'bronze' | 'silver' | 'gold' | 'vip'>("bronze");
  const [formStatus, setFormStatus] = useState<'active' | 'pending_verification' | 'suspended'>("active");
  const [formCreditLimit, setFormCreditLimit] = useState<number>(250000000);
  const [formNotes, setFormNotes] = useState("");

  const loadAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const list = await fetchUnifiedUsers();
      setUsersList(list);
    } catch (e) {
      console.error("Error loading users:", e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadAllUsers();

    const handleUsersUpdated = () => loadAllUsers();
    window.addEventListener("dastavval_users_updated", handleUsersUpdated);
    window.addEventListener("dastavval_orders_updated", handleUsersUpdated);
    return () => {
      window.removeEventListener("dastavval_users_updated", handleUsersUpdated);
      window.removeEventListener("dastavval_orders_updated", handleUsersUpdated);
    };
  }, []);

  // Reconcile and extract users from all orders with one click
  const handleReconcileFromOrders = async () => {
    setLoading(true);
    try {
      let allOrdersToScan = [...(orders || [])];
      try {
        const rawW = localStorage.getItem("dastavval_wholesale_orders");
        if (rawW) allOrdersToScan = [...allOrdersToScan, ...JSON.parse(rawW)];
        const rawR = localStorage.getItem("dastavval_raw_orders");
        if (rawR) allOrdersToScan = [...allOrdersToScan, ...JSON.parse(rawR)];
      } catch (e) {}

      let countAdded = 0;
      for (const ord of allOrdersToScan) {
        if (ord.buyerPhone || ord.customerPhone || ord.phone || ord.mobile) {
          await syncUserFromOrder(ord);
          countAdded++;
        }
      }
      await loadAllUsers();
      setSuccessMsg(`همگام‌سازی کامل شد! مشخصات ${toPersianNum(countAdded)} سفارش با بانک کاربران تطبیق داده شد.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg("خطا در همگام‌سازی کاربران از سفارشات: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormName("");
    setFormPhone("");
    setFormNationalCode("");
    setFormCompany("");
    setFormCity("تهران");
    setFormProvince("تهران");
    setFormAddress("");
    setFormRole("customer");
    setFormBadge("bronze");
    setFormStatus("active");
    setFormCreditLimit(250000000);
    setFormNotes("");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (u: ManagedUser) => {
    setEditingUser(u);
    setFormName(u.name || "");
    setFormPhone(u.phone || u.mobile || "");
    setFormNationalCode(u.nationalCode || "");
    setFormCompany(u.company || "");
    setFormCity(u.city || "تهران");
    setFormProvince(u.province || "تهران");
    setFormAddress(u.address || "");
    setFormRole(u.role || "customer");
    setFormBadge(u.badge || "bronze");
    setFormStatus(u.status || "active");
    setFormCreditLimit(u.creditLimit || 250000000);
    setFormNotes(u.notes || "");
    setShowAddModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = cleanIranianPhone(formPhone);
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg("لطفاً شماره موبایل معتبر (۱۱ رقمی) وارد فرمایید.");
      return;
    }

    setLoading(true);
    try {
      const userId = editingUser ? editingUser.id : `usr-${cleanPhone}`;
      const updatedUser: ManagedUser = {
        id: userId,
        name: formName || "کاربر سامانه",
        phone: cleanPhone,
        mobile: cleanPhone,
        nationalCode: formNationalCode,
        company: formCompany || "فروشگاه / پخش عمده",
        city: formCity,
        province: formProvince,
        address: formAddress,
        role: formRole,
        badge: formBadge,
        status: formStatus,
        creditLimit: Number(formCreditLimit),
        totalOrdersCount: editingUser?.totalOrdersCount || 0,
        totalPurchaseValue: editingUser?.totalPurchaseValue || 0,
        walletBalance: editingUser?.walletBalance || 0,
        createdAt: editingUser?.createdAt || new Date().toLocaleDateString('fa-IR'),
        lastOrderDate: editingUser?.lastOrderDate,
        notes: formNotes,
        source: editingUser?.source || "ثبت دستی توسط مدیریت"
      };

      // 1. Update localStorage
      let localUsers: Record<string, ManagedUser> = {};
      try {
        const raw = localStorage.getItem("dastavval_local_users");
        if (raw) localUsers = JSON.parse(raw);
      } catch (e) {}
      localUsers[userId] = updatedUser;
      localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));

      // 2. Post to backend
      try {
        await fetch("/api/b2b/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localUsers)
        });
      } catch (e) {}

      // 3. Refresh list
      await loadAllUsers();
      setShowAddModal(false);
      setSuccessMsg(editingUser ? "مشخصات کاربر با موفقیت ویرایش شد." : "کاربر جدید با موفقیت ثبت گردید.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره اطلاعات کاربر: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Refresh Individual User (بروزرسانی کاربر)
  const handleBumpUser = async (u: ManagedUser) => {
    setLoading(true);
    try {
      let localUsers: Record<string, ManagedUser> = {};
      try {
        const raw = localStorage.getItem("dastavval_local_users");
        if (raw) localUsers = JSON.parse(raw);
      } catch (e) {}

      const nowStr = new Date().toISOString();
      const target = localUsers[u.id] || localUsers[u.phone] || { ...u };
      target.updatedAt = nowStr;
      target.lastActiveAt = nowStr;
      target.bumpedAt = nowStr;
      localUsers[u.id] = target;
      if (u.phone) localUsers[u.phone] = target;

      localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));

      await fetch("/api/b2b/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localUsers)
      }).catch(() => {});

      await loadAllUsers();
      setSuccessMsg(`⚡ اطلاعات کاربر «${u.name || u.phone}» با موفقیت بروزرسانی زنده گردید.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در بروزرسانی کاربر: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⚡ Refresh All Users (بروزرسانی همگانی)
  const handleBumpAllUsers = async () => {
    setLoading(true);
    try {
      let localUsers: Record<string, ManagedUser> = {};
      try {
        const raw = localStorage.getItem("dastavval_local_users");
        if (raw) localUsers = JSON.parse(raw);
      } catch (e) {}

      const nowStr = new Date().toISOString();
      Object.keys(localUsers).forEach(k => {
        if (localUsers[k]) {
          localUsers[k].updatedAt = nowStr;
          localUsers[k].lastActiveAt = nowStr;
          localUsers[k].bumpedAt = nowStr;
        }
      });

      localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));

      await fetch("/api/b2b/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localUsers)
      }).catch(() => {});

      await loadAllUsers();
      setSuccessMsg(`⚡ تمام کاربران با موفقیت بروزرسانی زنده شدند.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در بروزرسانی همگانی: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Bulk Upgrade Users to VIP / Gold
  const handleBulkUpgradeVip = async () => {
    setLoading(true);
    try {
      let localUsers: Record<string, ManagedUser> = {};
      try {
        const raw = localStorage.getItem("dastavval_local_users");
        if (raw) localUsers = JSON.parse(raw);
      } catch (e) {}

      let count = 0;
      Object.keys(localUsers).forEach(k => {
        if (localUsers[k] && localUsers[k].status === 'active') {
          localUsers[k].badge = 'vip';
          count++;
        }
      });

      localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));

      await fetch("/api/b2b/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localUsers)
      }).catch(() => {});

      await loadAllUsers();
      setSuccessMsg(`⭐ سطح ${toPersianNum(count)} کاربر فعال با موفقیت به VIP ارتقا یافت.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در ارتقای گروهی: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = (u: ManagedUser) => {
    const nextStatus = u.status === 'active' ? 'suspended' : 'active';
    const actionLabel = nextStatus === 'active' ? 'فعال‌سازی' : 'مسدود و تعلیق‌سازی';

    confirmAction(
      `${actionLabel} کاربر`,
      `آیا از ${actionLabel} دسترسی حساب «${u.name}» (${u.phone}) اطمینان دارید؟`,
      async () => {
        setLoading(true);
        try {
          let localUsers: Record<string, ManagedUser> = {};
          try {
            const raw = localStorage.getItem("dastavval_local_users");
            if (raw) localUsers = JSON.parse(raw);
          } catch (e) {}

          const target = localUsers[u.id] || localUsers[u.phone] || u;
          target.status = nextStatus;
          localUsers[u.id] = target;
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));

          await fetch("/api/b2b/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localUsers)
          }).catch(() => {});

          await loadAllUsers();
          setSuccessMsg(`وضعیت حساب با موفقیت به «${nextStatus === 'active' ? 'فعال' : 'معلق'}» تغییر یافت.`);
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
          setErrorMsg("خطا در تغییر وضعیت: " + err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleDeleteUser = (u: ManagedUser) => {
    confirmAction(
      "حذف کاربر از سیستم",
      `آیا از حذف کامل حساب کاربری «${u.name}» (${u.phone}) اطمینان دارید؟ این عملیات غیرقابل بازگشت است.`,
      async () => {
        setLoading(true);
        try {
          let localUsers: Record<string, ManagedUser> = {};
          try {
            const raw = localStorage.getItem("dastavval_local_users");
            if (raw) localUsers = JSON.parse(raw);
          } catch (e) {}

          delete localUsers[u.id];
          delete localUsers[u.phone];
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));

          await fetch("/api/b2b/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(localUsers)
          }).catch(() => {});

          await loadAllUsers();
          setSuccessMsg("حساب کاربری با موفقیت حذف گردید.");
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
          setErrorMsg("خطا در حذف کاربر: " + err.message);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleSendDirectSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSmsModal || !smsText.trim()) return;

    setIsSendingSms(true);
    try {
      const res = await fetch("/api/sms/send-direct-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: showSmsModal.phone,
          message: smsText
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`پیامک با موفقیت به شماره ${showSmsModal.phone} ارسال شد.`);
        setShowSmsModal(null);
        setSmsText("");
      } else {
        setErrorMsg("خطا در ارسال پیامک: " + (data.error || "خطای سامانه پیامک"));
      }
    } catch (err: any) {
      setErrorMsg("خطا در برقراری ارتباط با درگاه پیامک: " + err.message);
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleExportCsv = () => {
    try {
      const headers = ["شناسه", "نام و نام خانوادگی", "شماره موبایل", "کد ملی", "نام فروشگاه/شرکت", "نقش", "سطح مشتری", "وضعیت", "تعداد سفارشات", "مجموع خرید (تومان)", "شهر", "تاریخ ثبت نام"];
      const rows = filteredUsers.map(u => [
        `"${u.id}"`,
        `"${u.name || ''}"`,
        `"${u.phone || ''}"`,
        `"${u.nationalCode || ''}"`,
        `"${u.company || ''}"`,
        `"${u.role === 'customer' ? 'خریدار عمده' : (u.role === 'factory' ? 'کارخانه' : (u.role === 'representative' ? 'نماینده' : (u.role === 'marketer' ? 'بازاریاب' : 'مدیر')))}"`,
        `"${u.badge || 'bronze'}"`,
        `"${u.status === 'active' ? 'فعال' : (u.status === 'suspended' ? 'معلق' : 'در انتظار')}"`,
        `"${u.totalOrdersCount || 0}"`,
        `"${u.totalPurchaseValue || 0}"`,
        `"${u.city || ''}"`,
        `"${u.createdAt || ''}"`
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `dastavval-users-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMsg("فایل اکسل/CSV کاربران با موفقیت دانلود شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg("خطا در استخراج فایل: " + e.message);
    }
  };

  // User Orders filtering
  const getUserOrders = (userPhone: string) => {
    const clean = cleanIranianPhone(userPhone);
    let allOrd = [...(orders || [])];
    try {
      const rawW = localStorage.getItem("dastavval_wholesale_orders");
      if (rawW) allOrd = [...allOrd, ...JSON.parse(rawW)];
      const rawR = localStorage.getItem("dastavval_raw_orders");
      if (rawR) allOrd = [...allOrd, ...JSON.parse(rawR)];
    } catch (e) {}

    // Deduplicate by ID
    const uniqueMap = new Map<string, any>();
    allOrd.forEach(o => {
      const oPhone = cleanIranianPhone(o.buyerPhone || o.customerPhone || o.phone || o.mobile);
      if (oPhone === clean) {
        uniqueMap.set(o.id || o.trackingNumber, o);
      }
    });
    return Array.from(uniqueMap.values());
  };

  // Available cities for filter based on selected province filter
  const filterCitiesList = useMemo(() => {
    if (provinceFilter === "all") {
      const allC = new Set<string>();
      IRAN_PROVINCES_AND_CITIES.forEach(p => p.cities.forEach(c => allC.add(c)));
      return Array.from(allC);
    }
    const match = IRAN_PROVINCES_AND_CITIES.find(p => p.province === provinceFilter);
    return match ? match.cities : [];
  }, [provinceFilter]);

  // Available cities for form based on formProvince
  const formCitiesList = useMemo(() => {
    const match = IRAN_PROVINCES_AND_CITIES.find(p => p.province === formProvince);
    return match ? match.cities : [formCity];
  }, [formProvince, formCity]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    return usersList
      .filter(u => {
        const matchesSearch = 
          (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.phone || "").includes(searchQuery) ||
          (u.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.nationalCode || "").includes(searchQuery) ||
          (u.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.province || "").toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        const matchesStatus = statusFilter === "all" || u.status === statusFilter;
        
        const matchesProvince = provinceFilter === "all" || 
          u.province === provinceFilter || 
          (!u.province && IRAN_PROVINCES_AND_CITIES.find(p => p.province === provinceFilter)?.cities.includes(u.city || ""));
          
        const matchesCity = cityFilter === "all" || u.city === cityFilter;

        return matchesSearch && matchesRole && matchesStatus && matchesProvince && matchesCity;
      })
      .sort((a, b) => {
        if (sortBy === 'purchases') return (b.totalPurchaseValue || 0) - (a.totalPurchaseValue || 0);
        if (sortBy === 'orders') return (b.totalOrdersCount || 0) - (a.totalOrdersCount || 0);
        return (b.createdAt || "").localeCompare(a.createdAt || "");
      });
  }, [usersList, searchQuery, roleFilter, statusFilter, provinceFilter, cityFilter, sortBy]);

  // Metrics
  const totalUsersCount = usersList.length;
  const activeUsersCount = usersList.filter(u => u.status === 'active').length;
  const directBuyersCount = usersList.filter(u => (u.totalOrdersCount || 0) > 0).length;
  const factoriesCount = usersList.filter(u => u.role === 'factory').length;
  const totalVolume = usersList.reduce((sum, u) => sum + (u.totalPurchaseValue || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-right" dir="rtl">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 rounded-3xl text-white shadow-material-lg">
            <Users size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">لیست و مدیریت جامع کاربران</h3>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                {toPersianNum(totalUsersCount)} کاربر
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-1">
              مشاهده، ویرایش مشخصات، سطح‌بندی، تاریخچه سفارشات مستقیم و مدیریت دسترسی کلیه خریداران، کارخانجات و نمایندگان
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleBumpAllUsers}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-2xl text-xs font-black transition-all border border-purple-200 cursor-pointer shadow-xs active:scale-95"
            title="بروزرسانی زنده تاریخچه و وضعیت کلیه کاربران در لیست"
          >
            <RefreshCw size={15} className="text-purple-600" />
            <span>⚡ بروزرسانی همگانی</span>
          </button>

          <button
            onClick={handleBulkUpgradeVip}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-2xl text-xs font-black transition-all border border-amber-300 cursor-pointer shadow-xs active:scale-95"
            title="ارتقای گروهی کلیه کاربران فعال به سطح طلایی / VIP"
          >
            <ShieldCheck size={15} className="text-amber-600" />
            <span>⭐ ارتقای گروهی VIP</span>
          </button>

          <a
            href="/api/admin/users/export-vault"
            download="dastavval-users-vault-backup.json"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl text-xs font-black transition-all border border-slate-200 cursor-pointer shadow-xs"
            title="دانلود نسخه پشتیبان کامل از مخزن امن اطلاعات کاربران، شماره‌ها، کدهای ملی و آدرس‌ها"
          >
            <Download size={15} className="text-slate-600" />
            <span>بکاپ JSON</span>
          </a>

          <button
            onClick={handleReconcileFromOrders}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-xs font-black transition-all border border-indigo-200 cursor-pointer shadow-xs"
            title="بررسی تمام فاکتورها و اضافه کردن خریداران سفارش مستقیم به این لیست"
          >
            <UserCheck size={15} />
            <span>همگام‌سازی از سفارشات</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <FileText size={15} />
            <span>خروجی اکسل</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all shadow-material-md active:scale-95 cursor-pointer"
          >
            <UserPlus size={16} />
            <span>ثبت کاربر جدید</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">کل کاربران و خریداران</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{toPersianNum(totalUsersCount)}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
            <UserCheck size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">کاربران فعال</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{toPersianNum(activeUsersCount)}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <ShoppingBag size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">خریداران دارای سفارش</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{toPersianNum(directBuyersCount)}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">کارخانجات و برندها</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{toPersianNum(factoriesCount)}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <DollarSign size={22} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400">مجموع خرید کاربران</div>
            <div className="text-sm font-black text-slate-900 mt-0.5 truncate max-w-[140px]">
              {toPersianNum(totalVolume.toLocaleString())} <span className="text-[10px] font-normal text-slate-400">تومان</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو بر اساس نام، شماره موبایل، شرکت، کدملی یا شهر..."
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Province Filter */}
          <div>
            <select
              value={provinceFilter}
              onChange={(e) => {
                setProvinceFilter(e.target.value);
                setCityFilter("all");
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">همه استان‌ها (۳۱ استان)</option>
              {IRAN_PROVINCES_AND_CITIES.map((p, pIdx) => (
                <option key={`filter-prov-${p.province}-${pIdx}`} value={p.province}>{p.province}</option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">{provinceFilter === "all" ? "همه شهرستان‌ها" : `همه شهرهای ${provinceFilter}`}</option>
              {filterCitiesList.map((c, cIdx) => (
                <option key={`filter-city-${c}-${cIdx}`} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">همه نقش‌ها</option>
              <option value="customer">خریدار عمده (مشتری)</option>
              <option value="factory">تولیدکننده / کارخانه</option>
              <option value="representative">نماینده منطقه‌ای</option>
              <option value="marketer">بازاریاب / رابط تجاری</option>
              <option value="admin">مدیر سیستم</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فعال</option>
              <option value="pending_verification">در انتظار احراز هویت</option>
              <option value="suspended">معلق / مسدود شده</option>
            </select>
          </div>
        </div>

        {/* Sort & Quick Filter Chips */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>تعداد نتایج فیلتر شده:</span>
            <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl font-black border border-emerald-200">
              {toPersianNum(filteredUsers.length)} کاربر
            </span>
            {provinceFilter !== "all" && (
              <button
                onClick={() => { setProvinceFilter("all"); setCityFilter("all"); }}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-bold underline cursor-pointer mr-2"
              >
                پاک‌کردن فیلتر استان ({provinceFilter})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date">جدیدترین ثبت‌نام</option>
              <option value="purchases">بیشترین حجم خرید</option>
              <option value="orders">بیشترین تعداد سفارش</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoadingUsers ? (
          <div className="p-12 text-center text-slate-400 font-bold flex items-center justify-center gap-3">
            <RefreshCw className="animate-spin text-emerald-600" size={24} />
            <span>در حال بارگذاری لیست کاربران...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Users size={32} />
            </div>
            <h4 className="text-base font-bold text-slate-700">کاربری یافت نشد</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              با فیلترها و عبارت جستجوی فعلی نتیجه‌ای پیدا نشد، یا می‌توانید دکمه «همگام‌سازی از سفارشات مستقیم» را بزنید.
            </p>
            <button
              onClick={handleReconcileFromOrders}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer hover:bg-emerald-700 transition-all"
            >
              همگام‌سازی و بازیابی کاربران از سفارشات
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 font-black">
                <tr>
                  <th className="py-4 px-4">کاربر / نام و نشان</th>
                  <th className="py-4 px-4">شماره موبایل</th>
                  <th className="py-4 px-4">شرکت / فروشگاه</th>
                  <th className="py-4 px-4">شهر / استان</th>
                  <th className="py-4 px-4">نقش و سطح</th>
                  <th className="py-4 px-4">تعداد سفارشات</th>
                  <th className="py-4 px-4">مجموع خرید</th>
                  <th className="py-4 px-4">وضعیت</th>
                  <th className="py-4 px-4 text-center">عملیات مدیریت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-bold">
                {filteredUsers.map((u, idx) => {
                  const userOrders = getUserOrders(u.phone);
                  return (
                    <tr key={`usr-row-${u.id || idx}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-xs shrink-0 border border-emerald-200">
                            {u.name ? u.name.substring(0, 1) : "ک"}
                          </div>
                          <div>
                            <div className="font-black text-slate-900">{u.name || "خریدار سفارش مستقیم"}</div>
                            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                              ثبت: {u.createdAt || "اخیر"} {u.source ? `• ${u.source}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono font-black text-slate-800 dir-ltr text-right">
                        {toPersianNum(u.phone)}
                      </td>

                      {/* Company */}
                      <td className="py-3.5 px-4 text-slate-700">
                        {u.company || "فروشگاه / پخش عمده"}
                      </td>

                      {/* City */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {u.city || "تهران"}
                      </td>

                      {/* Role & Badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                            u.role === 'factory' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'representative' ? 'bg-blue-100 text-blue-800' :
                            u.role === 'marketer' ? 'bg-amber-100 text-amber-800' :
                            u.role === 'admin' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {u.role === 'factory' ? '🏭 کارخانه' :
                             u.role === 'representative' ? '🎖️ نماینده' :
                             u.role === 'marketer' ? '💼 بازاریاب' :
                             u.role === 'admin' ? '👑 مدیر' : '📦 خریدار عمده'}
                          </span>

                          {u.badge && u.badge !== 'bronze' && (
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                              u.badge === 'vip' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs' :
                              u.badge === 'gold' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {u.badge === 'vip' ? 'VIP' : u.badge === 'gold' ? 'طلایی' : 'نقره‌ای'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4">
                        {userOrders.length > 0 ? (
                          <button
                            onClick={() => setViewingOrdersUser(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black border border-emerald-200 transition-all cursor-pointer"
                          >
                            <ShoppingBag size={12} />
                            <span>{toPersianNum(userOrders.length)} سفارش</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-normal">بدون سفارش</span>
                        )}
                      </td>

                      {/* Purchase Value */}
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {u.totalPurchaseValue && u.totalPurchaseValue > 0 ? (
                          <span>{toPersianNum(u.totalPurchaseValue.toLocaleString())} <span className="text-[10px] text-slate-400 font-normal">تومان</span></span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black ${
                          u.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          u.status === 'suspended' ? 'bg-rose-100 text-rose-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {u.status === 'active' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                          {u.status === 'active' ? 'فعال' : u.status === 'suspended' ? 'معلق / مسدود' : 'در انتظار تایید'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* ⚡ Refresh User Button */}
                          <button
                            onClick={() => handleBumpUser(u)}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-black shadow-2xs active:scale-95"
                            title="بروزرسانی زنده اطلاعات این کاربر"
                          >
                            <RefreshCw size={12} className="text-purple-600" />
                            <span>بروزرسانی</span>
                          </button>

                          {/* View Orders */}
                          <button
                            onClick={() => setViewingOrdersUser(u)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
                            title="مشاهده تاریخچه سفارشات و فاکتورها"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Send SMS */}
                          <button
                            onClick={() => { setShowSmsModal(u); setSmsText(`جناب ${u.name || 'همکار گرامی'}، `); }}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all cursor-pointer"
                            title="ارسال پیامک مستقیم"
                          >
                            <Send size={14} />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all cursor-pointer"
                            title="ویرایش مشخصات و نقش"
                          >
                            <Edit3 size={14} />
                          </button>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${
                              u.status === 'active' ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={u.status === 'active' ? 'مسدودسازی دسترسی' : 'فعال‌سازی مجدد'}
                          >
                            {u.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-700 rounded-xl transition-all cursor-pointer"
                            title="حذف کاربر"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* Modal: Add or Edit User */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {editingUser ? `ویرایش کاربر: ${editingUser.name}` : "ثبت کاربر جدید در سامانه"}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                      اطلاعات هویتی، دسترسی و نقش کاربری
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="مثال: علی حسینی"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">شماره موبایل:</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 dir-ltr text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* National Code */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">کد ملی / شناسه ملی:</label>
                    <input
                      type="text"
                      value={formNationalCode}
                      onChange={(e) => setFormNationalCode(e.target.value)}
                      placeholder="۱۰ رقمی"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 dir-ltr text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Company / Store */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نام فروشگاه / شرکت / بنکداری:</label>
                    <input
                      type="text"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="مثال: پخش مواد غذایی حسینی"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نقش کاربری:</label>
                    <select
                      value={formRole}
                      onChange={(e: any) => setFormRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="customer">📦 خریدار عمده / مشتری</option>
                      <option value="factory">🏭 تولیدکننده / صاحب کارخانه</option>
                      <option value="representative">🎖️ نماینده منطقه‌ای</option>
                      <option value="marketer">💼 بازاریاب و رابط فروش</option>
                      <option value="admin">👑 مدیر کل سامانه</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">وضعیت دسترسی:</label>
                    <select
                      value={formStatus}
                      onChange={(e: any) => setFormStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="active">✅ فعال</option>
                      <option value="pending_verification">⏳ در انتظار احراز هویت</option>
                      <option value="suspended">🚫 معلق / مسدود شده</option>
                    </select>
                  </div>

                  {/* Province */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>استان محل فعالیت:</span>
                      <span className="text-[10px] text-emerald-700 font-bold">۳۱ استان کشور</span>
                    </label>
                    <select
                      value={formProvince}
                      onChange={(e) => {
                        const newProv = e.target.value;
                        setFormProvince(newProv);
                        const match = IRAN_PROVINCES_AND_CITIES.find(p => p.province === newProv);
                        if (match && match.cities.length > 0) {
                          setFormCity(match.capital || match.cities[0]);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {IRAN_PROVINCES_AND_CITIES.map((p, pIdx) => (
                        <option key={`form-prov-opt-${p.province}-${pIdx}`} value={p.province}>{p.province}</option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>شهرستان / شهر:</span>
                      <span className="text-[10px] text-emerald-700 font-bold">انتخاب از لیست رسمی</span>
                    </label>
                    <select
                      value={formCitiesList.includes(formCity) ? formCity : (formCitiesList[0] || formCity)}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {formCitiesList.map((c, cIdx) => (
                        <option key={`form-city-opt-${c}-${cIdx}`} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Badge */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">سطح خریدار (نشان تجاری):</label>
                    <select
                      value={formBadge}
                      onChange={(e: any) => setFormBadge(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="bronze">برنزی (عادی)</option>
                      <option value="silver">نقره‌ای</option>
                      <option value="gold">طلایی</option>
                      <option value="vip">VIP ویژه</option>
                    </select>
                  </div>

                  {/* Credit Limit */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">سقف اعتبار خرید چکی (تومان):</label>
                    <input
                      type="number"
                      value={formCreditLimit}
                      onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                      placeholder="250000000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">آدرس کامل انبار / فروشگاه:</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    placeholder="خیابان، پلاک، طبقه..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">یادداشت مدیریت:</label>
                  <textarea
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="نکات اعتباری، تماس‌های پیگیری..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-material-md cursor-pointer"
                  >
                    {editingUser ? "ذخیره تغییرات" : "ثبت نهایی کاربر"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: View User Orders History */}
      <AnimatePresence>
        {viewingOrdersUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 overflow-y-auto max-h-[90vh] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      تاریخچه سفارشات کاربر: {viewingOrdersUser.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">
                      شماره تماس: {toPersianNum(viewingOrdersUser.phone)} • شرکت: {viewingOrdersUser.company || "عمده فروشی"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingOrdersUser(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Order List */}
              {(() => {
                const userOrders = getUserOrders(viewingOrdersUser.phone);
                if (userOrders.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 font-bold space-y-2">
                      <ShoppingBag size={32} className="mx-auto text-slate-300" />
                      <p>هیچ سفارشی برای این شماره ثبت نشده است.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {userOrders.map((ord: any, idx: number) => {
                      const amount = Number(ord.totalAmount || ord.finalPayableAmount || 0);
                      const itemsCount = ord.items ? (Array.isArray(ord.items) ? ord.items.length : 1) : 1;
                      return (
                        <div 
                          key={`usr-ord-${ord.id || ord.trackingNumber || idx}-${idx}`}
                          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-emerald-300 transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-emerald-800 text-xs bg-emerald-100 px-2.5 py-1 rounded-lg">
                                {ord.trackingNumber || ord.id || "ORD-000"}
                              </span>
                              <span className="text-xs font-bold text-slate-700">
                                {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('fa-IR') : "سفارش مستقیم"}
                              </span>
                              <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                                {toPersianNum(itemsCount)} ردیف کالا
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 font-bold mt-1.5">
                              روش پرداخت: {ord.paymentMethod === 'cash' ? 'نقد' : (ord.paymentMethod === 'full_check' || ord.paymentMethod === 'cheque' ? 'چک صیادی' : 'ترکیبی')} • کارخانه: {ord.sellerName || "تولیدکننده مستقیم"}
                            </div>
                          </div>

                          <div className="text-left flex items-center md:flex-col items-end gap-1">
                            <div className="text-sm font-black text-slate-900">
                              {toPersianNum(amount.toLocaleString())} <span className="text-[10px] text-slate-400 font-normal">تومان</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              {ord.status === 'delivered' ? 'تحویل داده شده' : 'ثبت سفارش'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  onClick={() => setViewingOrdersUser(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Send Direct SMS */}
      <AnimatePresence>
        {showSmsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Send size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">ارسال پیامک به {showSmsModal.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{toPersianNum(showSmsModal.phone)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSmsModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSendDirectSms} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">متن پیامک:</label>
                  <textarea
                    value={smsText}
                    onChange={(e) => setSmsText(e.target.value)}
                    placeholder="متن پیام خود را اینجا وارد کنید..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 h-28"
                    required
                  />
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">
                    ارسال از طریق سرشماره ملی پیامک سامانه‌ای
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSmsModal(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingSms}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-material-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSendingSms ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>ارسال پیامک</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
