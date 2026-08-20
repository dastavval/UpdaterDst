// Regional Leads, Delivery Hub & Guarantees Store
import { RepresentativeGuarantee, GuaranteeStatus, GuaranteeType, Order } from "../types";
import { getB2BPricingConfig } from "./pricing";

export interface RegionalLead {
  id: string;
  orderId?: string;
  customerName: string;
  storeName: string;
  phone: string;
  address?: string;
  city: string;
  province?: string;
  requestedProduct: string;
  quantityCartons: number;
  totalEstimatedAmount: number;
  totalOrderAmount?: number;
  siteProfitAmount?: number; // کل سود مارک‌آپ سایت از این سفارش
  representativeProfitShare?: number; // سهم سود نماینده (مثلاً ۵۰٪ از سود سایت)
  deliveryHubStatus?: 'pending_hub' | 'arrived_at_hub' | 'inspected_approved' | 'out_for_delivery' | 'delivered_confirmed' | 'disputed';
  deliveryConfirmationCode?: string;
  repDeliveryNotes?: string;
  createdAt: string;
  expiresAt: string; // 24h SLA timestamp
  status: 'pending_rep_action' | 'fulfilled_by_rep' | 'routed_to_factory' | 'expired_routed_to_factory' | 'negotiating';
  representativeId?: string;
  representativeCommissionEarned?: number; // 2.5% override
  representativeProfitEarned?: number; // Local fulfillment margin
  notes?: string[];
}

const STORAGE_KEY = 'dastavval_crm_leads';
const COMMISSION_KEY = 'dastavval_rep_commissions';
const GUARANTEES_KEY = 'dastavval_rep_guarantees';

export const INITIAL_LEADS: RegionalLead[] = [];

export function getRegionalLeads(): RegionalLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
      return INITIAL_LEADS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_LEADS;
  }
}

export function saveRegionalLeads(leads: RegionalLead[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error("Failed to save regional leads:", e);
  }
}

/**
 * Automatically create regional notification and delivery task when an order is placed on the site
 */
export function registerRegionalOrderFromCheckout(order: {
  orderId?: string;
  buyerName?: string;
  buyerCompany?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  city?: string;
  province?: string;
  items?: any[];
  totalAmount?: number;
  originalAmount?: number;
}) {
  const config = getB2BPricingConfig();
  const leads = getRegionalLeads();
  
  const totalAmount = Number(order.totalAmount || 0);
  const totalCartons = (order.items || []).reduce((acc, it) => acc + (Number(it.quantityCartons || it.quantity) || 1), 0);
  const prodSummary = (order.items || []).map(i => `${i.name} (${i.quantityCartons || i.quantity || 1} کارتن)`).join('، ') || "سفارش عمده مواد غذایی";

  // Calculate Site Profit and Rep Profit Share
  // If Customer Markup is 10%, Floor Cost = Total / 1.10 -> Markup Profit = Total - Floor Cost
  const markupMultiplier = 1 + (config.customerMarkupPercent / 100);
  const estimatedFloorCost = Math.round(totalAmount / markupMultiplier);
  const siteProfitAmount = Math.max(0, totalAmount - estimatedFloorCost);
  const representativeProfitShare = Math.round(siteProfitAmount * (config.repRegionalProfitSharePercent / 100));

  const confirmationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const newLead: RegionalLead = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    orderId: order.orderId,
    customerName: order.buyerName || "خریدار مستقیم سایت",
    storeName: order.buyerCompany || "فروشگاه متقاضی در شهر",
    phone: order.buyerPhone || "09150000000",
    address: order.buyerAddress || "آدرس ثبت شده در فاکتور سفارش",
    city: order.city || "مشهد",
    province: order.province || "خراسان رضوی",
    requestedProduct: prodSummary,
    quantityCartons: totalCartons,
    totalEstimatedAmount: totalAmount,
    totalOrderAmount: totalAmount,
    siteProfitAmount,
    representativeProfitShare,
    deliveryHubStatus: 'pending_hub',
    deliveryConfirmationCode: confirmationCode,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending_rep_action',
    representativeCommissionEarned: 0,
    representativeProfitEarned: representativeProfitShare
  };

  leads.unshift(newLead);
  saveRegionalLeads(leads);

  // Also trigger regional alert event for UI listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('regional-order-placed', { detail: newLead }));
  }

  return newLead;
}

export function updateRegionalDeliveryStatus(
  leadId: string, 
  newStatus: 'pending_hub' | 'arrived_at_hub' | 'inspected_approved' | 'out_for_delivery' | 'delivered_confirmed' | 'disputed',
  notes?: string
) {
  const leads = getRegionalLeads();
  const index = leads.findIndex(l => l.id === leadId);
  if (index > -1) {
    leads[index].deliveryHubStatus = newStatus;
    if (notes) {
      leads[index].repDeliveryNotes = notes;
    }
    if (newStatus === 'delivered_confirmed') {
      leads[index].status = 'fulfilled_by_rep';
      // Automatically add commission / profit share
      const profit = leads[index].representativeProfitShare || 0;
      if (profit > 0) {
        addRepCommission(profit, `سهم سود تحویل موفق سفارش منطقه‌ای (${leads[index].id})`, leadId);
      }
    }
    saveRegionalLeads(leads);
    return leads[index];
  }
  return null;
}

export function addLeadFromRegistration(user: { name: string; company?: string; city?: string; phone?: string; mobile?: string }) {
  const leads = getRegionalLeads();
  const newLead: RegionalLead = {
    id: `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: user.name || "خریدار جدید",
    storeName: user.company || "فروشگاه مواد غذایی",
    phone: user.phone || user.mobile || "0915***0000",
    city: user.city || "مشهد",
    requestedProduct: "استعلام نرخ عمده و درخواست کاتالوگ کارخانجات",
    quantityCartons: 25,
    totalEstimatedAmount: 14_000_000,
    totalOrderAmount: 14_000_000,
    siteProfitAmount: 1_400_000,
    representativeProfitShare: 700_000,
    deliveryHubStatus: 'pending_hub',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending_rep_action',
    representativeCommissionEarned: 0,
    representativeProfitEarned: 700_000
  };
  leads.unshift(newLead);
  saveRegionalLeads(leads);
  return newLead;
}

export function getRepCommissions(): { totalCommission: number; history: any[] } {
  try {
    const raw = localStorage.getItem(COMMISSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { totalCommission: 0, history: [] };
}

export function addRepCommission(amount: number, reason: string, leadId: string) {
  const current = getRepCommissions();
  const updated = {
    totalCommission: current.totalCommission + amount,
    history: [
      {
        id: `COMM-${Date.now()}`,
        amount,
        reason,
        leadId,
        date: new Date().toLocaleDateString('fa-IR'),
        timestamp: new Date().toISOString()
      },
      ...current.history
    ]
  };
  try {
    localStorage.setItem(COMMISSION_KEY, JSON.stringify(updated));
  } catch (e) {}
  return updated;
}

// =========================================================================
// Performance Guarantees Store (ضمانت‌نامه‌های حسن انجام کار نماینده)
// =========================================================================

export const INITIAL_GUARANTEES: RepresentativeGuarantee[] = [];

export function getRepresentativeGuarantees(repId?: string): RepresentativeGuarantee[] {
  try {
    const raw = localStorage.getItem(GUARANTEES_KEY);
    let list: RepresentativeGuarantee[] = [];
    if (!raw) {
      localStorage.setItem(GUARANTEES_KEY, JSON.stringify(INITIAL_GUARANTEES));
      list = INITIAL_GUARANTEES;
    } else {
      list = JSON.parse(raw);
    }

    if (repId) {
      return list.filter(g => g.representativeId === repId || g.representativePhone === repId);
    }
    return list;
  } catch (e) {
    return INITIAL_GUARANTEES;
  }
}

export function saveRepresentativeGuarantee(guarantee: Omit<RepresentativeGuarantee, 'id' | 'createdAt'>): RepresentativeGuarantee {
  const all = getRepresentativeGuarantees();
  const newGuarantee: RepresentativeGuarantee = {
    ...guarantee,
    id: `GRN-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString()
  };
  all.unshift(newGuarantee);
  try {
    localStorage.setItem(GUARANTEES_KEY, JSON.stringify(all));
  } catch (e) {
    console.error("Could not save guarantee:", e);
  }
  return newGuarantee;
}

export function updateGuaranteeStatus(id: string, status: GuaranteeStatus, adminNotes?: string) {
  const all = getRepresentativeGuarantees();
  const idx = all.findIndex(g => g.id === id);
  if (idx > -1) {
    all[idx].status = status;
    if (adminNotes) all[idx].adminNotes = adminNotes;
    if (status === 'verified_approved') {
      all[idx].verifiedAt = new Date().toLocaleDateString('fa-IR');
    }
    try {
      localStorage.setItem(GUARANTEES_KEY, JSON.stringify(all));
    } catch (e) {}
    return all[idx];
  }
  return null;
}

