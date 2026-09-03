import { db, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "./data-layer";
import { CRMCustomer, addCRMCustomer, updateCRMCustomer } from "./crm-helper";

export interface ManagedUser {
  id: string;
  name: string;
  phone: string;
  mobile?: string;
  nationalCode?: string;
  company?: string;
  city?: string;
  province?: string;
  address?: string;
  role: 'customer' | 'representative' | 'marketer' | 'factory' | 'admin' | 'ad_poster';
  badge?: 'bronze' | 'silver' | 'gold' | 'vip';
  status: 'active' | 'pending_verification' | 'suspended';
  totalOrdersCount: number;
  totalPurchaseValue: number;
  walletBalance?: number;
  creditLimit?: number;
  notes?: string;
  createdAt?: string;
  lastOrderDate?: string;
  source?: string;
  avatarUrl?: string;
  password?: string;
}

export const cleanIranianPhone = (phone: string | undefined | null): string => {
  if (!phone) return "";
  let p = String(phone).trim()
    .replace(/[۰-۹]/g, d => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
    .replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)])
    .replace(/\D/g, "");
  if (p.startsWith("98")) p = "0" + p.substring(2);
  else if (p.startsWith("9") && p.length === 10) p = "0" + p;
  return p;
};

/**
 * Ensures a user is registered and updated whenever an order, RFQ, or direct inquiry is placed.
 */
export async function syncUserFromOrder(order: {
  buyerName?: string;
  buyerPhone?: string;
  buyerCompany?: string;
  buyerAddress?: string;
  city?: string;
  province?: string;
  totalAmount?: number;
  finalPayableAmount?: number;
  customerPhone?: string;
  customerName?: string;
  phone?: string;
  mobile?: string;
}): Promise<ManagedUser | null> {
  const rawPhone = order.buyerPhone || order.customerPhone || order.phone || order.mobile;
  const phone = cleanIranianPhone(rawPhone);
  if (!phone) return null;

  const name = order.buyerName || order.customerName || "خریدار سفارش مستقیم";
  const company = order.buyerCompany || "فروشگاه / پخش عمده";
  const address = order.buyerAddress || "";
  const city = order.city || "تهران";
  const province = order.province || "تهران";
  const amount = Number(order.totalAmount || order.finalPayableAmount || 0);

  // 1. Update localStorage dastavval_local_users
  let localUsersMap: Record<string, ManagedUser> = {};
  try {
    const raw = localStorage.getItem("dastavval_local_users");
    if (raw) localUsersMap = JSON.parse(raw);
  } catch (e) {}

  const userId = `usr-${phone}`;
  const existing = localUsersMap[userId] || localUsersMap[phone];

  let badge: 'bronze' | 'silver' | 'gold' | 'vip' = 'bronze';
  const newTotalOrders = (existing?.totalOrdersCount || 0) + 1;
  const newTotalValue = (existing?.totalPurchaseValue || 0) + amount;

  if (newTotalValue >= 300000000) badge = 'vip';
  else if (newTotalValue >= 100000000) badge = 'gold';
  else if (newTotalValue >= 40000000) badge = 'silver';

  const userObj: ManagedUser = {
    id: existing?.id || userId,
    name: name || existing?.name || "خریدار سفارش مستقیم",
    phone: phone,
    mobile: phone,
    company: company || existing?.company || "فروشگاه / پخش عمده",
    city: city || existing?.city || "تهران",
    province: province || existing?.province || "تهران",
    address: address || existing?.address || "",
    role: existing?.role || "customer",
    badge: existing?.badge && existing.badge !== 'bronze' ? existing.badge : badge,
    status: existing?.status || "active",
    totalOrdersCount: newTotalOrders,
    totalPurchaseValue: newTotalValue,
    walletBalance: existing?.walletBalance || 0,
    creditLimit: existing?.creditLimit || 250000000,
    createdAt: existing?.createdAt || new Date().toLocaleDateString('fa-IR'),
    lastOrderDate: new Date().toLocaleDateString('fa-IR'),
    source: existing?.source || "سفارش مستقیم پورتال",
    notes: existing?.notes || "ثبت خودکار از طریق سفارش مستقیم کالا"
  };

  localUsersMap[userId] = userObj;
  try {
    localStorage.setItem("dastavval_local_users", JSON.stringify(localUsersMap));
  } catch (e) {}

  // 2. Sync to CRM
  try {
    const savedCrm = localStorage.getItem("dastavval_crm_customers");
    let crmList: CRMCustomer[] = savedCrm ? JSON.parse(savedCrm) : [];
    const crmIdx = crmList.findIndex(c => cleanIranianPhone(c.phone) === phone);
    if (crmIdx >= 0) {
      crmList[crmIdx] = {
        ...crmList[crmIdx],
        totalOrdersCount: newTotalOrders,
        totalPurchaseValue: newTotalValue,
        badge,
        company: company || crmList[crmIdx].company,
        name: name || crmList[crmIdx].name
      };
    } else {
      crmList.unshift({
        id: `crm-${phone}`,
        name,
        phone,
        company,
        establishedYear: 1405,
        badge,
        totalOrdersCount: newTotalOrders,
        totalPurchaseValue: newTotalValue,
        city,
        status: "active",
        notes: "ثبت خودکار از طریق سفارش مستقیم پورتال",
        role: "customer"
      });
    }
    localStorage.setItem("dastavval_crm_customers", JSON.stringify(crmList));
  } catch (e) {}

  // 3. Post to Server /api/b2b/users and /api/admin/users
  try {
    fetch("/api/b2b/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(localUsersMap)
    }).catch(() => {});
  } catch (e) {}

  // 4. Dispatch global events
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dastavval_users_updated", { detail: userObj }));
    window.dispatchEvent(new CustomEvent("dastavval_user_registered", { detail: userObj }));
  }

  return userObj;
}

/**
 * Fetches all aggregated users from local, server, CRM, and orders.
 */
export async function fetchUnifiedUsers(): Promise<ManagedUser[]> {
  const usersMap: Record<string, ManagedUser> = {};

  // 1. From localStorage dastavval_local_users
  try {
    const raw = localStorage.getItem("dastavval_local_users");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((u: any) => {
          const ph = cleanIranianPhone(u.phone || u.mobile);
          if (ph) usersMap[ph] = { ...u, phone: ph, id: u.id || `usr-${ph}` };
        });
      } else if (typeof parsed === "object") {
        Object.values(parsed).forEach((u: any) => {
          const ph = cleanIranianPhone(u.phone || u.mobile);
          if (ph) usersMap[ph] = { ...u, phone: ph, id: u.id || `usr-${ph}` };
        });
      }
    }
  } catch (e) {}

  // 2. From Server /api/b2b/users
  try {
    const res = await fetch("/api/b2b/users");
    if (res.ok) {
      const srvUsers = await res.json();
      if (srvUsers && typeof srvUsers === "object") {
        Object.values(srvUsers).forEach((u: any) => {
          const ph = cleanIranianPhone(u.phone || u.mobile);
          if (ph) {
            usersMap[ph] = {
              ...(usersMap[ph] || {}),
              ...u,
              phone: ph,
              id: u.id || `usr-${ph}`
            };
          }
        });
      }
    }
  } catch (e) {}

  // 3. From CRM Customers
  try {
    const crmRaw = localStorage.getItem("dastavval_crm_customers");
    if (crmRaw) {
      const crmList = JSON.parse(crmRaw);
      if (Array.isArray(crmList)) {
        crmList.forEach((c: any) => {
          const ph = cleanIranianPhone(c.phone);
          if (ph) {
            if (!usersMap[ph]) {
              usersMap[ph] = {
                id: c.id || `usr-${ph}`,
                name: c.name || "خریدار همکار",
                phone: ph,
                company: c.company || "پخش و توزیع",
                city: c.city || "تهران",
                role: c.role || "customer",
                badge: c.badge || "bronze",
                status: c.status === "suspended" ? "suspended" : (c.status === "pending_verification" ? "pending_verification" : "active"),
                totalOrdersCount: c.totalOrdersCount || 0,
                totalPurchaseValue: c.totalPurchaseValue || 0,
                createdAt: c.createdAt || new Date().toLocaleDateString('fa-IR'),
                source: "سیستم CRM",
                notes: c.notes || ""
              };
            }
          }
        });
      }
    }
  } catch (e) {}

  // 4. Scan all orders to ensure no buyer is missed!
  try {
    const ordersRaw = localStorage.getItem("dastavval_wholesale_orders") || localStorage.getItem("dastavval_raw_orders") || localStorage.getItem("dastavval_orders_cache");
    if (ordersRaw) {
      const orders = JSON.parse(ordersRaw);
      if (Array.isArray(orders)) {
        orders.forEach((o: any) => {
          const ph = cleanIranianPhone(o.buyerPhone || o.customerPhone || o.phone || o.mobile);
          if (ph) {
            const amt = Number(o.totalAmount || o.finalPayableAmount || 0);
            if (!usersMap[ph]) {
              usersMap[ph] = {
                id: `usr-${ph}`,
                name: o.buyerName || o.customerName || "خریدار سفارش مستقیم",
                phone: ph,
                company: o.buyerCompany || "فروشگاه / پخش عمده",
                city: o.city || "تهران",
                address: o.buyerAddress || "",
                role: "customer",
                badge: amt >= 100000000 ? "vip" : amt >= 40000000 ? "gold" : "bronze",
                status: "active",
                totalOrdersCount: 1,
                totalPurchaseValue: amt,
                walletBalance: 0,
                creditLimit: 250000000,
                createdAt: o.createdAt ? new Date(o.createdAt).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR'),
                lastOrderDate: new Date().toLocaleDateString('fa-IR'),
                source: "سفارش مستقیم فاکتور",
                notes: "استخراج شده از فاکتورهای ثبت شده"
              };
            } else {
              // Ensure order metrics are populated if missing
              if (!usersMap[ph].totalOrdersCount || usersMap[ph].totalOrdersCount === 0) {
                usersMap[ph].totalOrdersCount = 1;
              }
              if (!usersMap[ph].totalPurchaseValue || usersMap[ph].totalPurchaseValue === 0) {
                usersMap[ph].totalPurchaseValue = amt;
              }
            }
          }
        });
      }
    }
  } catch (e) {}

  return Object.values(usersMap);
}

/**
 * Reconciles and merges all orders into the user database.
 */
export async function reconcileAllUsersFromOrders(orders: any[]): Promise<ManagedUser[]> {
  for (const o of orders) {
    await syncUserFromOrder(o);
  }
  return fetchUnifiedUsers();
}
