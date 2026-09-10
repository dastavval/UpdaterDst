import React, { useState, useEffect } from 'react';
import { 
  Package, LayoutDashboard, Settings, RefreshCw, ShoppingCart, 
  Users, Ticket, BookOpen, AlertCircle, Building2, Flame, Award, Boxes,
  Menu, X, Code2, FileText, Zap
} from 'lucide-react';
import { Product, B2BConfig } from '../types';

import AdminParsPackMobileHub from "./AdminParsPackMobileHub";
import AdminSystemConfig from "./AdminSystemConfig";
import AdminProductsManagement from "./AdminProductsManagement";
import AdminOrders from "./AdminOrders";
import AdminCRM from "./AdminCRM";
import AdminArticles from "./AdminArticles";
import { AdminSalesCharts } from "./AdminSalesCharts";
import AdminTicketManagement from "./AdminTicketManagement";
import AdminCategoriesManagement from "./AdminCategoriesManagement";
import AdminBrandsManagement from "./AdminBrandsManagement";
import AdminFactoriesManagement from "./AdminFactoriesManagement";
import AdminUsersManagement from "./AdminUsersManagement";
import AdminSpecialOffersManagement from "./AdminSpecialOffersManagement";
import AdminCoupons from "./AdminCoupons";
import AdminAdsManagement from "./AdminAdsManagement";
import AdminPendingApprovals from "./AdminPendingApprovals";
import AdminRepresentatives from "./AdminRepresentatives";
import AdminJsonEndpointsTester from "./AdminJsonEndpointsTester";
import { fetchCRMCustomers } from "../lib/crm-helper";
import { fetchCallbackRequests, updateCallbackStatus } from "../lib/callback-helper";
import { addSystemLog } from "../lib/system-log-helper";
import { collection, addDoc, db } from "../lib/data-layer";
import AdminSystemLogs from "./AdminSystemLogs";

export default function AdminPanel({
  products = [],
  b2bConfig,
  onUpdateB2bConfig,
  onRefreshProducts,
  onApplyJsonImportedProducts,
  articles = [],
  onUpdateArticles,
  onUpdateProduct
}: any) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");

  // CRM State
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);

  // Callbacks State
  const [callbackRequests, setCallbackRequests] = useState<any[]>([]);
  const [callbackLoading, setCallbackLoading] = useState(false);

  // General Notification / Alert State
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedRepForCert, setSelectedRepForCert] = useState<any>(null);

  // Toast Auto-clear
  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const t = setTimeout(() => setErrorMsg(null), 6000);
      return () => clearTimeout(t);
    }
  }, [errorMsg]);

  // Fetch Orders
  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/orders");
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.orders || []);
        setOrders(list);
      } else {
        // Fallback to /api/b2b/orders
        const resB2b = await fetch("/api/b2b/orders");
        const ctB2b = resB2b.headers.get("content-type");
        if (resB2b.ok && ctB2b && ctB2b.includes("application/json")) {
          const dataB2b = await resB2b.json();
          setOrders(Array.isArray(dataB2b) ? dataB2b : (dataB2b?.orders || []));
        } else {
          const raw = localStorage.getItem("dastavval_wholesale_orders") || localStorage.getItem("dastavval_raw_orders");
          if (raw) setOrders(JSON.parse(raw));
        }
      }
    } catch (e: any) {
      console.error("Error fetching orders:", e);
      try {
        const raw = localStorage.getItem("dastavval_wholesale_orders") || localStorage.getItem("dastavval_raw_orders");
        if (raw) setOrders(JSON.parse(raw));
      } catch (err) {}
    } finally {
      setOrdersLoading(false);
    }
  };

  // Fetch CRM Customers
  const loadCrmCustomers = async () => {
    setCrmLoading(true);
    try {
      let initialList: any[] = [];
      try {
        initialList = await fetchCRMCustomers();
      } catch (err) {}

      const res = await fetch("/api/users");
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.includes("application/json")) {
        const data = await res.json();
        const serverUsers: any[] = Array.isArray(data) ? data : Object.values(data || {});
        
        const map = new Map<string, any>();
        initialList.forEach(c => {
          if (c && (c.phone || c.id)) map.set(c.phone || c.id, c);
        });
        serverUsers.forEach((u: any) => {
          if (u && (u.phone || u.id)) {
            const key = u.phone || u.id;
            const existing = map.get(key) || {};
            map.set(key, {
              id: u.id || existing.id || `crm-${Date.now()}`,
              name: u.name || existing.name || "کاربر سامانه",
              phone: u.phone || u.mobile || existing.phone || "",
              company: u.company || u.companyName || existing.company || "-",
              city: u.city || existing.city || "تهران",
              badge: u.badge || existing.badge || "bronze",
              status: u.status || existing.status || "active",
              establishedYear: u.establishedYear || existing.establishedYear || 1400,
              totalOrdersCount: u.totalOrdersCount || existing.totalOrdersCount || 0,
              totalPurchaseValue: u.totalPurchaseValue || existing.totalPurchaseValue || 0,
              notes: u.notes || existing.notes || "",
              role: u.role || existing.role || "customer",
              ...existing,
              ...u
            });
          }
        });
        const combined = Array.from(map.values());
        setCrmCustomers(combined.length > 0 ? combined : initialList);
      } else {
        setCrmCustomers(initialList);
      }
    } catch (e: any) {
      console.error("Error loading CRM:", e);
      try {
        const fallback = await fetchCRMCustomers();
        setCrmCustomers(fallback);
      } catch (err) {}
    } finally {
      setCrmLoading(false);
    }
  };

  const loadCallbackRequests = async () => {
    setCallbackLoading(true);
    try {
      const fetched = await fetchCallbackRequests();
      setCallbackRequests(fetched || []);
    } catch (e: any) {
      console.error("Error fetching callback requests:", e);
    } finally {
      setCallbackLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    loadCrmCustomers();
    loadCallbackRequests();
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSuccessMsg(`وضعیت سفارش ${orderId} با موفقیت بروزرسانی شد.`);
        await fetchOrders();
      } else {
        throw new Error("خطا در تغییر وضعیت سفارش");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در تغییر وضعیت");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (res.ok) {
        setSuccessMsg(`سفارش ${orderId} با موفقیت حذف شد.`);
        await fetchOrders();
      } else {
        throw new Error("خطا در حذف سفارش");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در حذف سفارش");
    }
  };

  const handleBatchDeleteOrders = async (ids: string[]) => {
    try {
      const res = await fetch("/api/orders/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        setSuccessMsg(`${ids.length} سفارش با موفقیت حذف گردید.`);
        await fetchOrders();
      } else {
        throw new Error("خطا در حذف گروهی سفارشات");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در حذف گروهی سفارشات");
    }
  };

  // Approval & Audit Action Handlers
  const handleApprovalAction = async (type: string, id: string, action: 'approve' | 'reject', reason?: string, badge?: string) => {
    try {
      if (type === 'callback') {
        const status = action === 'approve' ? 'called' : 'archived';
        await updateCallbackStatus(id, status, reason || "");

        const rawId = String(id).replace(/^callback_/, '');
        const cbItem = callbackRequests.find(cb => String(cb.id) === rawId);
        if (cbItem && action === 'approve') {
          const isMarketerReg = cbItem.factoryName?.includes("بازاریاب");
          const isRepReg = cbItem.factoryName?.includes("نماینده");
          const isFactoryReg = cbItem.factoryName?.includes("تولیدکننده");

          let role: 'customer' | 'representative' | 'marketer' | 'factory' = 'customer';
          if (isMarketerReg) role = 'marketer';
          else if (isRepReg) role = 'representative';
          else if (isFactoryReg) role = 'factory';

          if (role !== 'customer') {
            let name = cbItem.name || "کاربر نقشه راه";
            let company = cbItem.company || "مجموعه نقشه راه";
            let city = cbItem.city || "تهران";

            const matchName = cbItem.factoryName?.match(/نام:\s*([^|]+)/);
            if (matchName) name = matchName[1].trim();

            const matchStore = cbItem.factoryName?.match(/فروشگاه\/مجموعه:\s*([^|]+)/);
            if (matchStore) company = matchStore[1].trim();

            const matchCity = cbItem.factoryName?.match(/شهر:\s*([^|]+)/);
            if (matchCity) city = matchCity[1].trim();

            const cleanPhone = cbItem.phone;
            const userId = `usr-${cleanPhone}`;

            const newUserObj = {
              id: userId,
              name,
              phone: cleanPhone,
              mobile: cleanPhone,
              company,
              city,
              province: city,
              role,
              status: "active",
              badge: "bronze",
              totalOrdersCount: 0,
              totalPurchaseValue: 0,
              createdAt: new Date().toLocaleDateString('fa-IR'),
              source: `ثبت‌نام نقشه راه (${role === 'marketer' ? 'بازاریاب' : role === 'representative' ? 'نماینده' : 'تولیدکننده'})`
            };

            let localUsers: Record<string, any> = {};
            try {
              const raw = localStorage.getItem("dastavval_local_users");
              if (raw) localUsers = JSON.parse(raw);
            } catch (e) {}
            localUsers[userId] = newUserObj;
            localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));

            try {
              await fetch("/api/b2b/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(localUsers)
              });
            } catch (e) {}

            let crmList: any[] = [];
            try {
              const savedCrm = localStorage.getItem("dastavval_crm_customers");
              if (savedCrm) crmList = JSON.parse(savedCrm);
            } catch (e) {}
            crmList.unshift({
              id: `crm-${cleanPhone}`,
              name,
              phone: cleanPhone,
              company,
              establishedYear: 1405,
              badge: "bronze",
              totalOrdersCount: 0,
              totalPurchaseValue: 0,
              city,
              status: "active",
              notes: "ثبت‌نام خودکار تأیید شده نقشه راه",
              role
            });
            localStorage.setItem("dastavval_crm_customers", JSON.stringify(crmList));

            await addSystemLog({
              category: "user",
              action: "create",
              title: "عضویت خودکار کاربر از نقشه راه",
              details: `کاربر با شماره ${cleanPhone} به عنوان ${role === 'marketer' ? 'بازاریاب' : role === 'representative' ? 'نماینده' : 'تولیدکننده'} با تایید درخواست عضویت به صورت خودکار به سیستم اضافه شد.`,
              userPhone: cleanPhone,
              userName: name
            });

            window.dispatchEvent(new CustomEvent("dastavval_users_updated"));
            window.dispatchEvent(new CustomEvent("dastavval_crm_added"));
          }
        }
        await loadCallbackRequests();
      }

      // Update local storage and b2bConfig directly for older/previous source compatibility and instant publishing
      try {
        const targetIdStr = String(id).replace(/^(agency_req_|rep_list_|order_|safebuy_|billboard_|barter_|callback_|ticket_|ad_|prod_|raw_mat_|raw_order_|capacity_|fac_reg_)/, '');
        
        if (type === 'raw_material') {
          const rawId = String(id).replace(/^raw_mat_/, '');
          try {
            const list = JSON.parse(localStorage.getItem("dastavval_raw_materials") || "[]");
            const updated = list.map((m: any) => 
              String(m.id) === String(rawId) || String(m.id) === targetIdStr
                ? { ...m, isVerified: action === 'approve', isPendingApproval: false, status: action === 'approve' ? 'approved' : 'rejected', rejectionReason: reason || null } 
                : m
            );
            localStorage.setItem("dastavval_raw_materials", JSON.stringify(updated));
            const pending = JSON.parse(localStorage.getItem("dastavval_pending_raw_materials") || "[]");
            const filteredPending = pending.filter((m: any) => String(m.id) !== String(rawId) && String(m.id) !== targetIdStr);
            localStorage.setItem("dastavval_pending_raw_materials", JSON.stringify(filteredPending));
          } catch (e) {}

          if (b2bConfig) {
            const updatedRaw = (b2bConfig.rawMaterialAds || []).map((m: any) =>
              String(m.id) === String(rawId) || String(m.id) === targetIdStr
                ? { ...m, isVerified: action === 'approve', isPendingApproval: false, status: action === 'approve' ? 'approved' : 'rejected', rejectionReason: reason || null }
                : m
            );
            b2bConfig.rawMaterialAds = updatedRaw;
          }
        }

        if (type === 'ad' || type === 'billboard_ad' || type === 'sponsored') {
          const adId = String(id).replace(/^(ad_|billboard_)/, '');
          if (b2bConfig) {
            const updatedAds = (b2bConfig.sponsoredAds || []).map((ad: any) => 
              String(ad.id) === adId || String(ad.id) === String(id) || String(ad.id) === targetIdStr
                ? { ...ad, status: action === 'approve' ? 'approved' : 'rejected', isApproved: action === 'approve', isPending: false }
                : ad
            );
            b2bConfig.sponsoredAds = updatedAds;
          }
          try {
            const list = JSON.parse(localStorage.getItem("dastavval_sponsored_ads_v2") || "[]");
            const updated = list.map((ad: any) => 
              String(ad.id) === adId || String(ad.id) === String(id) || String(ad.id) === targetIdStr
                ? { ...ad, status: action === 'approve' ? 'approved' : 'rejected', isApproved: action === 'approve', isPending: false }
                : ad
            );
            localStorage.setItem("dastavval_sponsored_ads_v2", JSON.stringify(updated));
          } catch (e) {}
        }

        if (type === 'barter' || type === 'barter_deal') {
          const barterId = String(id).replace(/^barter_/, '');
          if (b2bConfig) {
            const updatedBarters = (b2bConfig.barterDeals || []).map((b: any) => 
              String(b.id) === barterId || String(b.id) === String(id) || String(b.id) === targetIdStr
                ? { ...b, status: action === 'approve' ? 'approved' : 'rejected' }
                : b
            );
            b2bConfig.barterDeals = updatedBarters;
          }
        }

        if (type === 'safeBuy' || type === 'safe_buy') {
          const sbId = String(id).replace(/^safebuy_/, '');
          if (b2bConfig) {
            const updatedSbs = (b2bConfig.safeBuyRequests || []).map((sb: any) => 
              String(sb.id) === sbId || String(sb.id) === String(id) || String(sb.id) === targetIdStr
                ? { ...sb, status: action === 'approve' ? 'approved' : 'rejected' }
                : sb
            );
            b2bConfig.safeBuyRequests = updatedSbs;
          }
        }

        if (type === 'capacityAd' || type === 'capacity_ad') {
          const capId = String(id).replace(/^capacity_/, '');
          if (b2bConfig) {
            const updatedCaps = (b2bConfig.capacityAds || []).map((cap: any) => 
              String(cap.id) === capId || String(cap.id) === String(id) || String(cap.id) === targetIdStr
                ? { ...cap, status: action === 'approve' ? 'approved' : 'rejected', isVerified: action === 'approve', isPending: false }
                : cap
            );
            b2bConfig.capacityAds = updatedCaps;
          }
          try {
            const list = JSON.parse(localStorage.getItem("dastavval_capacity_ads") || "[]");
            const updated = list.map((cap: any) => 
              String(cap.id) === capId || String(cap.id) === String(id) || String(cap.id) === targetIdStr
                ? { ...cap, status: action === 'approve' ? 'approved' : 'rejected', isVerified: action === 'approve', isPending: false }
                : cap
            );
            localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
          } catch (e) {}
        }

        if (type === 'representative' || type === 'dealership') {
          const repId = String(id).replace(/^(agency_req_|rep_list_)/, '');
          if (b2bConfig) {
            const updatedReps = (b2bConfig.representatives || []).map((rep: any) => 
              String(rep.id) === repId || String(rep.id) === String(id) || String(rep.id) === targetIdStr || String(rep.phone) === repId
                ? { ...rep, isApproved: action === 'approve', status: action === 'approve' ? 'approved' : 'rejected', badge: badge || 'نماینده رسمی' }
                : rep
            );
            b2bConfig.representatives = updatedReps;
          }
        }

        if (type === 'supplier' || type === 'factory_registration') {
          const supId = String(id).replace(/^fac_reg_/, '');
          if (b2bConfig) {
            const updatedSups = (b2bConfig.factories || []).map((f: any) => 
              String(f.id) === supId || String(f.id) === String(id) || String(f.id) === targetIdStr
                ? { ...f, status: action === 'approve' ? 'active' : 'suspended', isActive: action === 'approve' }
                : f
            );
            b2bConfig.factories = updatedSups;
          }
          try {
            const list = JSON.parse(localStorage.getItem("dastavval_factories") || "[]");
            const updated = list.map((f: any) => 
              String(f.id) === supId || String(f.id) === String(id) || String(f.id) === targetIdStr
                ? { ...f, status: action === 'approve' ? 'active' : 'suspended', isActive: action === 'approve' }
                : f
            );
            localStorage.setItem("dastavval_factories", JSON.stringify(updated));
          } catch (e) {}
        }

        if (type === 'product' || type === 'factory_product') {
          const prodId = String(id).replace(/^prod_/, '');
          try {
            const list = JSON.parse(localStorage.getItem("dastavval_products") || "[]");
            const updated = list.map((p: any) => 
              String(p.id) === prodId || String(p.id) === String(id) || String(p.id) === targetIdStr
                ? { ...p, isApproved: action === 'approve', disabled: action !== 'approve', approvalStatus: action === 'approve' ? 'approved' : 'rejected' }
                : p
            );
            localStorage.setItem("dastavval_products", JSON.stringify(updated));
          } catch (e) {}
        }

        // Save updated b2bConfig back to localStorage and trigger state updates
        if (b2bConfig && onUpdateB2bConfig) {
          localStorage.setItem("dastavval_b2b_config", JSON.stringify(b2bConfig));
          await onUpdateB2bConfig(b2bConfig);
        }
      } catch (e) {
        console.error("Local sync error inside handleApprovalAction:", e);
      }

      const res = await fetch('/api/v1/dev/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, action, reason, badge })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || `درخواست ${type} با موفقیت ${action === 'approve' ? 'تأیید' : 'رد'} گردید.`);
        if (onRefreshProducts) await onRefreshProducts();

        await addSystemLog({
          category: "approval",
          action,
          title: `ممیزی [${type}]`,
          details: `درخواست [${type}] با شناسه ${id} با موفقیت ${action === 'approve' ? 'تأیید' : 'رد'} شد. ${reason ? `علت: ${reason}` : ""}`,
        });
      } else {
        throw new Error(data.error || "خطا در ثبت ممیزی");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "خطا در ارتباط با سرور");
    }
  };

  const handleUpdateAdStatus = async (id: string, status: 'approved' | 'rejected') => {
    await handleApprovalAction('ad', id, status === 'approved' ? 'approve' : 'reject');
  };

  const handleEditAd = async (id: string, updateData: any) => {
    try {
      const currentAds = b2bConfig?.sponsoredAds || [];
      const updatedAds = currentAds.map((a: any) => String(a.id) === String(id) ? { ...a, ...updateData } : a);
      if (onUpdateB2bConfig) {
        await onUpdateB2bConfig({ ...b2bConfig, sponsoredAds: updatedAds });
        setSuccessMsg("آگهی با موفقیت بروزرسانی شد.");
      }
    } catch (e: any) {
      setErrorMsg(e.message || "خطا در ویرایش آگهی");
    }
  };

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    if (typeof window !== "undefined" && window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  };

  const formatOrderDate = (dateVal: any) => {
    try {
      if (!dateVal) return "-";
      return new Date(dateVal).toLocaleDateString("fa-IR");
    } catch {
      return String(dateVal || "-");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return { text: "تکمیل شده", color: "bg-emerald-100 text-emerald-800" };
      case "processing":
        return { text: "در حال پردازش", color: "bg-blue-100 text-blue-800" };
      case "cancelled":
        return { text: "لغو شده", color: "bg-rose-100 text-rose-800" };
      default:
        return { text: "در انتظار بررسی", color: "bg-amber-100 text-amber-800" };
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close mobile menu when a tab is selected
  };

  return (
    <div className="relative flex h-[calc(100vh-140px)] min-h-[600px] bg-slate-50 overflow-hidden font-iranyekan rounded-2xl shadow-xl border border-slate-200" dir="rtl">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="absolute inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`absolute inset-y-0 right-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col h-full overflow-y-auto transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <Package className="text-emerald-500" /> دست‌اول
            </h1>
            <p className="text-xs text-slate-500 mt-1">پنل مدیریت یکپارچه</p>
          </div>
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => handleTabChange("dashboard")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "dashboard" ? "bg-emerald-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <LayoutDashboard size={18} /> داشبورد آماری
          </button>
          
          <div className="pt-4 pb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3">مدیریت فروشگاه</span>
          </div>
          <button onClick={() => handleTabChange("products")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "products" ? "bg-indigo-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Boxes size={18} /> محصولات
          </button>
          <button onClick={() => handleTabChange("categories")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "categories" ? "bg-slate-700 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <LayoutDashboard size={18} /> دسته‌بندی‌ها
          </button>
          <button onClick={() => handleTabChange("brands")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "brands" ? "bg-slate-700 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Award size={18} /> برندها
          </button>
          <button onClick={() => handleTabChange("factories")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "factories" ? "bg-slate-700 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Building2 size={18} /> کارخانجات
          </button>
          
          <div className="pt-4 pb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3">فروش و بازاریابی</span>
          </div>
          <button onClick={() => handleTabChange("orders")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "orders" ? "bg-blue-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <ShoppingCart size={18} /> سفارشات و فاکتورها
          </button>
          <button onClick={() => handleTabChange("approvals")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "approvals" ? "bg-rose-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <AlertCircle size={18} /> ممیزی و تأییدیه‌ها
          </button>
          <button onClick={() => handleTabChange("special_offers")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "special_offers" ? "bg-amber-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Flame size={18} /> فروش ویژه
          </button>
          <button onClick={() => handleTabChange("coupons")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "coupons" ? "bg-emerald-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Ticket size={18} /> کدهای تخفیف
          </button>
          <button onClick={() => handleTabChange("ads")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "ads" ? "bg-fuchsia-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <LayoutDashboard size={18} /> آگهی‌ها
          </button>
          
          <div className="pt-4 pb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3">کاربران و نمایندگان</span>
          </div>
          <button onClick={() => handleTabChange("users_management")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "users_management" ? "bg-purple-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Users size={18} /> کاربران
          </button>
          <button onClick={() => handleTabChange("reps")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "reps" ? "bg-cyan-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Award size={18} /> نمایندگان
          </button>
          <button onClick={() => handleTabChange("crm")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "crm" ? "bg-slate-700 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Users size={18} /> مدیریت ارتباط با مشتری (CRM)
          </button>
          
          <div className="pt-4 pb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3">محتوا و پشتیبانی</span>
          </div>
          <button onClick={() => handleTabChange("articles")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "articles" ? "bg-amber-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <BookOpen size={18} /> مقالات و اخبار
          </button>
          <button onClick={() => handleTabChange("tickets")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "tickets" ? "bg-rose-600 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Ticket size={18} /> تیکت‌های پشتیبانی
          </button>
          
          <div className="pt-4 pb-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-3">زیرساخت ابری و سیستم</span>
          </div>
          <button onClick={() => handleTabChange("json_tester")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-black transition-all ${activeTab === "json_tester" ? "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400" : "bg-indigo-950/20 text-indigo-400 hover:bg-slate-800"}`}>
            <Zap size={18} className="text-indigo-400" /> 🧹 پاکسازی کش و افزایش سرعت
          </button>
          
          {/* THE REQUESTED CONSOLIDATED CLOUD HUB */}
          <button onClick={() => handleTabChange("parspack_hub")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-black transition-all ${activeTab === "parspack_hub" ? "bg-cyan-600 text-white ring-2 ring-cyan-400" : "bg-cyan-950/30 text-cyan-400 hover:bg-slate-800"}`}>
            <RefreshCw size={18} className={activeTab === "parspack_hub" ? "animate-spin-slow" : ""} /> مرکز ابری و API
          </button>
          
          <button onClick={() => handleTabChange("system_logs")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-black transition-all ${activeTab === "system_logs" ? "bg-indigo-600 text-white ring-2 ring-indigo-400" : "bg-indigo-950/20 text-indigo-400 hover:bg-slate-800"}`}>
            <FileText size={18} /> گزارش رویدادهای سیستم (لاگ)
          </button>

          <button onClick={() => handleTabChange("system")} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${activeTab === "system" ? "bg-slate-700 text-white" : "hover:bg-slate-800 hover:text-white"}`}>
            <Settings size={18} /> تنظیمات سیستم
          </button>
        </nav>
      </aside>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Package className="text-emerald-600" size={24} />
            <span className="font-black text-slate-800">دست‌اول</span>
          </div>
          <button 
            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Notification Toasts */}
          {successMsg && (
            <div className="m-4 mb-0 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span>✓ {successMsg}</span>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-black">✕</button>
            </div>
          )}
          {errorMsg && (
            <div className="m-4 mb-0 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-bold flex items-center justify-between shadow-sm animate-fade-in">
              <span>⚠ {errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900 text-xs font-black">✕</button>
            </div>
          )}

          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === "dashboard" && <AdminSalesCharts />}
            {activeTab === "products" && (
              <AdminProductsManagement
                products={products}
                onRefreshProducts={onRefreshProducts}
                onUpdateProduct={onUpdateProduct}
                onApplyJsonImportedProducts={onApplyJsonImportedProducts}
              />
            )}
            {activeTab === "categories" && (
              <AdminCategoriesManagement
                b2bConfig={b2bConfig}
                onUpdateB2bConfig={onUpdateB2bConfig}
                products={products}
              />
            )}
            {activeTab === "brands" && (
              <AdminBrandsManagement
                b2bConfig={b2bConfig}
                products={products}
                onUpdateB2bConfig={onUpdateB2bConfig}
                onRefreshProducts={onRefreshProducts}
              />
            )}
            {activeTab === "factories" && (
              <AdminFactoriesManagement
                b2bConfig={b2bConfig}
                products={products}
                onUpdateB2bConfig={onUpdateB2bConfig}
                onUpdateProduct={onUpdateProduct}
                onRefreshProducts={onRefreshProducts}
              />
            )}
            {activeTab === "orders" && (
              <AdminOrders
                orders={orders}
                ordersLoading={ordersLoading}
                ordersSearch={ordersSearch}
                setOrdersSearch={setOrdersSearch}
                fetchOrders={fetchOrders}
                handleUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onBatchDeleteOrders={handleBatchDeleteOrders}
                formatOrderDate={formatOrderDate}
                getStatusLabel={getStatusLabel}
                setShowPrintInvoice={() => {}}
                setLoading={setLoading}
                setSuccessMsg={setSuccessMsg}
                setErrorMsg={setErrorMsg}
                confirmAction={confirmAction}
              />
            )}
            {activeTab === "approvals" && (
              <AdminPendingApprovals
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                safeBuyRequests={b2bConfig?.safeBuyRequests || []}
                onUpdateSafeBuyStatus={async (id, _fbId, status) => 
                  handleApprovalAction('safeBuy', id, status === 'approved' ? 'approve' : 'reject')
                }
                sponsoredAds={b2bConfig?.sponsoredAds || []}
                onUpdateAdStatus={(id, action) => 
                  handleApprovalAction('ad', id, action === 'approved' ? 'approve' : 'reject')
                }
                barterDeals={b2bConfig?.barterDeals || []}
                onUpdateBarterStatus={(id, action) => 
                  handleApprovalAction('barter', id, action === 'approved' ? 'approve' : 'reject')
                }
                representativesList={b2bConfig?.representatives || []}
                onUpdateRepStatus={(id, isApproved, badge) => 
                  handleApprovalAction('representative', id, isApproved ? 'approve' : 'reject', undefined, badge)
                }
                suppliersList={b2bConfig?.suppliers || []}
                onUpdateSupplierStatus={async (id, status) => 
                  handleApprovalAction('supplier', id, status === 'active' ? 'approve' : 'reject')
                }
                callbackRequests={[...(b2bConfig?.callbackRequests || []), ...callbackRequests]}
                onUpdateCallback={async (id, status) => 
                  handleApprovalAction('callback', id, status === 'called' ? 'approve' : 'reject')
                }
                supportTickets={b2bConfig?.tickets || []}
                onUpdateTicketStatus={async (id, status) => 
                  handleApprovalAction('ticket', id, (status === 'resolved' || status === 'closed') ? 'approve' : 'reject')
                }
                rawMaterialAds={b2bConfig?.rawMaterialAds || []}
                products={products}
                onUpdateProductStatus={async (id, isApproved, reason) => {
                  await handleApprovalAction('product', id, isApproved ? 'approve' : 'reject', reason);
                }}
                equipmentAds={b2bConfig?.equipmentAds || []}
                serviceAds={b2bConfig?.serviceAds || []}
                capacityAds={b2bConfig?.capacityAds || []}
                b2bConfig={b2bConfig}
                onUpdateB2bConfig={onUpdateB2bConfig}
                onNavigateTab={(tab) => handleTabChange(tab)}
              />
            )}
            {activeTab === "special_offers" && (
              <AdminSpecialOffersManagement
                products={products}
                b2bConfig={b2bConfig}
                onUpdateB2bConfig={onUpdateB2bConfig}
                onUpdateProduct={onUpdateProduct}
              />
            )}
            {activeTab === "coupons" && <AdminCoupons />}
            {activeTab === "ads" && (
              <AdminAdsManagement
                sponsoredAds={b2bConfig?.sponsoredAds || []}
                rawMaterialAds={b2bConfig?.rawMaterialAds || []}
                equipmentAds={b2bConfig?.equipmentAds || []}
                serviceAds={b2bConfig?.serviceAds || []}
                barterDeals={b2bConfig?.barterDeals || []}
                b2bConfig={b2bConfig}
                onUpdateB2bConfig={onUpdateB2bConfig}
                setSuccessMsg={setSuccessMsg}
                setErrorMsg={setErrorMsg}
                onUpdateAdStatus={handleUpdateAdStatus}
                onEditAd={handleEditAd}
              />
            )}
            {activeTab === "json_tester" && (
              <AdminJsonEndpointsTester />
            )}
            {activeTab === "users_management" && (
              <AdminUsersManagement
                orders={orders}
                setLoading={setLoading}
                setSuccessMsg={setSuccessMsg}
                setErrorMsg={setErrorMsg}
                confirmAction={confirmAction}
                b2bConfig={b2bConfig}
              />
            )}
            {activeTab === "reps" && (
              <AdminRepresentatives
                representativesList={b2bConfig?.representatives || []}
                allAvailableBrandsList={products.map((p: any) => p.brand).filter(Boolean)}
                setLoading={setLoading}
                setSuccessMsg={setSuccessMsg}
                setErrorMsg={setErrorMsg}
                confirmAction={confirmAction}
                setSelectedRepForCertificate={setSelectedRepForCert}
              />
            )}
            {activeTab === "crm" && (
              <AdminCRM
                crmCustomers={crmCustomers}
                crmLoading={crmLoading}
                products={products}
                setLoading={setLoading}
                setSuccessMsg={setSuccessMsg}
                setErrorMsg={setErrorMsg}
                confirmAction={confirmAction}
                loadCrmCustomers={loadCrmCustomers}
                onUpdateOrders={fetchOrders}
              />
            )}
            {activeTab === "articles" && (
              <AdminArticles
                articles={articles}
                products={products}
                b2bConfig={b2bConfig}
                setLoading={setLoading}
                setSuccessMsg={setSuccessMsg}
                setErrorMsg={setErrorMsg}
                confirmAction={confirmAction}
                onUpdateArticles={onUpdateArticles}
                onUpdateB2bConfig={onUpdateB2bConfig}
              />
            )}
            {activeTab === "tickets" && (
              <AdminTicketManagement
                setLoading={setLoading}
                setSuccessMsg={setSuccessMsg}
                setErrorMsg={setErrorMsg}
              />
            )}
            {activeTab === "system" && (
              <AdminSystemConfig
                b2bConfig={b2bConfig}
                onUpdateB2bConfig={onUpdateB2bConfig}
              />
            )}
            {activeTab === "system_logs" && (
              <AdminSystemLogs />
            )}
            {activeTab === "parspack_hub" && (
              <AdminParsPackMobileHub
                b2bConfig={b2bConfig}
                products={products}
                onUpdateB2bConfig={onUpdateB2bConfig}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
