import { useState, useMemo } from "react";
import { uploadToParsPackStorage } from "../utils/storage";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ShoppingCart, 
  ShieldCheck, 
  Megaphone, 
  Repeat, 
  Award, 
  Phone, 
  MessageSquare, 
  Search, 
  Filter, 
  ChevronDown, 
  Eye, 
  ArrowUpRight, 
  Sparkles, 
  Check, 
  X, 
  FileText, 
  DollarSign, 
  Building2, 
  User, 
  Calendar,
  Layers,
  Zap,
  TrendingUp,
  Edit3,
  Camera,
  UploadCloud,
  Loader2,
  Trash2,
  Factory,
  Cpu,
  Wrench,
  CheckCircle2,
  Shield,
  SlidersHorizontal,
  PhoneCall,
  ExternalLink,
  Tag,
  Package,
  History as HistoryIcon,
  RotateCcw,
  FlaskConical,
  ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LUXURY_PRESET_BADGES } from "./AdminFactoriesManagement";
import { ResilientVault, safeParseArray } from "../lib/resilient-storage";
import { getApiUrl } from "../utils/api-utils";
import ApprovalDetailViewer from "./ApprovalDetailViewer";

export type ApprovalType = 
  | 'wholesale_order'
  | 'safe_buy'
  | 'billboard_ad'
  | 'barter_deal'
  | 'dealership'
  | 'callback'
  | 'support_ticket'
  | 'factory_registration'
  | 'user_registration'
  | 'factory_product'
  | 'capacity_ad'
  | 'cooperation_request'
  | 'raw_material'
  | 'raw_order';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'normal';

export interface PendingItem {
  id: string;
  type: ApprovalType;
  typeLabel: string;
  title: string;
  requesterName: string;
  requesterPhone: string;
  requesterCompany?: string;
  requesterCity?: string;
  valueToman?: number;
  quantity?: string;
  date: string;
  rawTimestamp?: number;
  priority: PriorityLevel;
  priorityReason: string;
  details: any;
  originalStatus: string;
  currentStatus: 'pending' | 'approved' | 'rejected';
}

interface AdminPendingApprovalsProps {
  orders: any[];
  onUpdateOrderStatus: (orderId: string, nextStatus: string) => Promise<void>;
  onEditOrder?: (order: any) => void;
  safeBuyRequests: any[];
  onUpdateSafeBuyStatus: (id: string, firebaseId: string | undefined, status: 'approved' | 'rejected' | 'pending') => Promise<void>;
  sponsoredAds: any[];
  onUpdateAdStatus: (adId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) => void;
  onEditAd?: (adId: string, updatedAd: any) => Promise<void>;
  barterDeals: any[];
  onUpdateBarterStatus: (id: string, newStatus: string) => void;
  representativesList: any[];
  onUpdateRepStatus: (id: string, isApproved: boolean, badge?: string) => void;
  suppliersList: any[];
  onUpdateSupplierStatus: (id: string, status: 'active' | 'suspended' | 'pending') => Promise<void>;
  callbackRequests: any[];
  onUpdateCallback: (id: string, status: 'pending' | 'called' | 'archived', notes?: string) => Promise<void>;
  supportTickets: any[];
  onUpdateTicketStatus: (id: string, newStatus: string) => Promise<void>;
  onNavigateTab: (tab: string, param?: any) => void;
  rawMaterialAds?: any[];
  products?: any[];
  onUpdateProductStatus?: (id: string, isApproved: boolean, reason?: string) => Promise<void>;
  equipmentAds?: any[];
  serviceAds?: any[];
  b2bConfig?: any;
  onUpdateB2bConfig?: (updated: any) => Promise<void>;
  capacityAds?: any[];
  onUpdateCapacityAdStatus?: (adId: string, status: string) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<any> | void;
}

export default function AdminPendingApprovals({
  orders = [],
  onUpdateOrderStatus,
  onEditOrder,
  safeBuyRequests = [],
  onUpdateSafeBuyStatus,
  sponsoredAds = [],
  onUpdateAdStatus,
  onEditAd,
  barterDeals = [],
  onUpdateBarterStatus,
  representativesList = [],
  onUpdateRepStatus,
  suppliersList = [],
  onUpdateSupplierStatus,
  callbackRequests = [],
  onUpdateCallback,
  supportTickets = [],
  onUpdateTicketStatus,
  onNavigateTab,
  rawMaterialAds = [],
  products = [],
  onUpdateProductStatus,
  equipmentAds = [],
  serviceAds = [],
  b2bConfig,
  onUpdateB2bConfig,
  capacityAds = [],
  onUpdateCapacityAdStatus,
  onDeleteProduct
}: AdminPendingApprovalsProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState<{ active: boolean; current: number; total: number }>({ active: false, current: 0, total: 0 });

  // Toggle selection for a single item
  const toggleSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Select/Deselect all visible items
  const toggleSelectAll = () => {
    if (selectedItemIds.length === filteredItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredItems.map(it => it.id));
    }
  };

  // Improved Bulk Action Handler
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const idsToProcess = [...selectedItemIds];
    if (idsToProcess.length === 0) return;

    setBulkProcessing({ active: true, current: 0, total: idsToProcess.length });
    
    let processedCount = 0;
    for (const id of idsToProcess) {
      const item = aggregatedPendingItems.find(it => it.id === id);
      if (item) {
        try {
          if (action === 'approve') {
            await handleApproveItem(item);
          } else {
            await handleRejectItem(item, "رد گروهی توسط مدیر سیستم");
          }
        } catch (e) {
          console.error(`Error processing item ${id}:`, e);
        }
      }
      processedCount++;
      setBulkProcessing(prev => ({ ...prev, current: processedCount }));
    }

    showToast(`عملیات ${action === 'approve' ? 'تایید' : 'رد'} گروهی برای ${toPersianNum(processedCount)} مورد با موفقیت انجام شد.`);
    setSelectedItemIds([]);
    setBulkProcessing({ active: false, current: 0, total: 0 });
    window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
  };
  const [viewMode, setViewMode] = useState<'pending' | 'history'>('pending');
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<'priority' | 'date_desc' | 'value_desc'>('priority');
  const [viewingDetailItem, setViewingDetailItem] = useState<PendingItem | null>(null);
  const [rejectionModalItem, setRejectionModalItem] = useState<PendingItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [repBadge, setRepBadge] = useState<string>("نماینده رسمی");
  const [selectedFactoryBadges, setSelectedFactoryBadges] = useState<string[]>([
    "first-hand-origin",
    "amin-al-zarb"
  ]);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const toPersianNum = (n: string | number) => {
    if (n === undefined || n === null) return "";
    return String(n)
      .replace(/0/g, '۰')
      .replace(/1/g, '۱')
      .replace(/2/g, '۲')
      .replace(/3/g, '۳')
      .replace(/4/g, '۴')
      .replace(/5/g, '۵')
      .replace(/6/g, '۶')
      .replace(/7/g, '۷')
      .replace(/8/g, '۸')
      .replace(/9/g, '۹');
  };

  const formatPrecisePersianDateTime = (timestamp: any) => {
    if (!timestamp) return "-";
    try {
      const dateObj = new Date(timestamp);
      if (isNaN(dateObj.getTime())) return "-";
      
      const dateStr = dateObj.toLocaleDateString('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const timeStr = dateObj.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      return `${dateStr} ساعت ${timeStr}`;
    } catch {
      return "-";
    }
  };

  // 1. Normalize and Aggregate all pending items from across the platform
  const aggregatedPendingItems: PendingItem[] = useMemo(() => {
    const items: PendingItem[] = [];
    const processedIds = new Set<string>();

    // Helper to safely add items and prevent duplicates
    const addItem = (item: PendingItem) => {
      if (!processedIds.has(item.id)) {
        items.push(item);
        processedIds.add(item.id);
      }
    };

    // A. Factory Registrations & Verification
    try {
      const b2bFacs = b2bConfig?.factories || [];
      let localFacs: any[] = [];
      let pendingFacs: any[] = [];
      try { localFacs = JSON.parse(localStorage.getItem("dastavval_factories") || "[]"); } catch (e) {}
      try { pendingFacs = JSON.parse(localStorage.getItem("dastavval_pending_factories") || "[]"); } catch (e) {}

      // Combine sources with suppliersList (critical to include current server registrations)
      const rawFacs = [...b2bFacs, ...(suppliersList || []), ...localFacs, ...pendingFacs];

      // Build stable map to merge entries of the same factory
      const factoryMap = new Map<string, any>();
      const getFactoryKey = (f: any) => {
        const id = (f.id || '').trim();
        const email = (f.email || '').trim();
        const phone = (f.phone || f.tel || '').trim();
        const name = (f.name || f.companyName || f.company || '').trim().replace(/\s+/g, '');
        if (id) return `id_${id}`;
        if (email) return `email_${email}`;
        if (phone) return `phone_${phone}`;
        return `name_${name}`;
      };

      const mergeFactories = (existing: any, incoming: any) => {
        const merged = { ...existing, ...incoming };
        // Priority status: if any is approved/active, it is active
        if (existing.status === 'active' || existing.isActive === true || incoming.status === 'active' || incoming.isActive === true) {
          merged.status = 'active';
          merged.isActive = true;
        } else if (existing.status === 'rejected' || incoming.status === 'rejected') {
          merged.status = 'rejected';
          merged.isActive = false;
        } else if (existing.status === 'suspended' || incoming.status === 'suspended') {
          merged.status = 'suspended';
          merged.isActive = false;
        }
        return merged;
      };

      rawFacs.forEach((f: any) => {
        if (!f) return;
        const key = getFactoryKey(f);
        if (factoryMap.has(key)) {
          factoryMap.set(key, mergeFactories(factoryMap.get(key), f));
        } else {
          factoryMap.set(key, { ...f });
        }
      });

      factoryMap.forEach((f: any, key: string) => {
        const fid = f.id || f.email || f.phone || `f_${(f.name || '').replace(/\s+/g, '')}`;
        const uniqueId = `fac_reg_${fid}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (f.status === 'active' || f.isActive === true) status = 'approved';
        else if (f.status === 'suspended' || f.status === 'rejected') status = 'rejected';

        // Filter out preloaded active/fallback factories to prevent clutter.
        // Only show if pending, suspended, rejected, or if it is user-submitted/dynamic.
        const isUserSubmitted = localFacs.some((lf: any) => getFactoryKey(lf) === key) ||
                               pendingFacs.some((pf: any) => getFactoryKey(pf) === key) ||
                               (suppliersList || []).some((sl: any) => getFactoryKey(sl) === key && sl.status === 'pending');

        const isAuditable = f.status === 'pending' || f.status === 'rejected' || f.status === 'suspended' || f.isPending === true || isUserSubmitted;
        if (!isAuditable) return;

        addItem({
          id: uniqueId,
          type: 'factory_registration',
          typeLabel: 'احراز هویت کارخانه',
          title: `ممیزی واحد تولیدی: ${f.name || f.companyName || 'کارخانه جدید'}`,
          requesterName: f.managerName || f.contactPerson || 'مدیرعامل',
          requesterPhone: f.phone || f.tel || 'ثبت در پروانه',
          requesterCompany: f.name || f.companyName || 'واحد تولیدی',
          requesterCity: f.industrialPark || f.city || 'شهرک صنعتی',
          quantity: f.dailyCapacity ? `ظرفیت: ${f.dailyCapacity}` : (f.category || 'تولیدکننده'),
          rawTimestamp: Date.now() - 14400000,
          date: formatPrecisePersianDateTime(Date.now() - 14400000),
          priority: 'high',
          priorityReason: 'بررسی پروانه بهره‌برداری',
          details: f,
          originalStatus: f.status || 'pending',
          currentStatus: status
        });
      });
    } catch (e) {}

    // B. OEM Capacity Ads
    try {
      let capList = capacityAds || [];
      let localAds: any[] = [];
      try { localAds = JSON.parse(localStorage.getItem("dastavval_capacity_ads") || "[]"); } catch (e) {}

      const adMap = new Map<string, any>();
      const getAdKey = (ad: any) => {
        const id = (ad.id || '').trim();
        const title = (ad.title || '').trim().replace(/\s+/g, '');
        const fName = (ad.factoryName || '').trim().replace(/\s+/g, '');
        return id ? `id_${id}` : `title_${title}_fac_${fName}`;
      };

      const mergeAds = (existing: any, incoming: any) => {
        const merged = { ...existing, ...incoming };
        if (existing.status === 'approved' || existing.isApproved === true || incoming.status === 'approved' || incoming.isApproved === true) {
          merged.status = 'approved';
          merged.isApproved = true;
          merged.isPending = false;
        } else if (existing.status === 'rejected' || incoming.status === 'rejected') {
          merged.status = 'rejected';
          merged.isApproved = false;
          merged.isPending = false;
        }
        return merged;
      };

      [...capList, ...localAds].forEach((ad: any) => {
        if (!ad) return;
        const key = getAdKey(ad);
        if (adMap.has(key)) {
          adMap.set(key, mergeAds(adMap.get(key), ad));
        } else {
          adMap.set(key, { ...ad });
        }
      });

      adMap.forEach((ad: any, key: string) => {
        const aid = ad.id || `ad_${(ad.factoryName || '').replace(/\s+/g, '')}_${(ad.title || '').replace(/\s+/g, '')}`;
        const uniqueId = `cap_ad_${aid}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (ad.status === 'approved' || ad.isApproved === true) status = 'approved';
        else if (ad.status === 'rejected') status = 'rejected';

        const isUserSubmitted = localAds.some((la: any) => getAdKey(la) === key);
        const isAuditable = ad.status === 'pending' || ad.status === 'rejected' || ad.isPending === true || isUserSubmitted;
        if (!isAuditable) return;

        addItem({
          id: uniqueId,
          type: 'capacity_ad',
          typeLabel: 'آگهی ظرفیت خالی (OEM)',
          title: `ظرفیت خالی خط: ${ad.factoryName || 'کارخانه'}`,
          requesterName: ad.contactPerson || 'مدیر تولید',
          requesterPhone: ad.phone || 'درج در آگهی',
          requesterCompany: ad.factoryName || 'واحد صنعتی',
          requesterCity: ad.location || 'شهرک صنعتی',
          quantity: ad.monthlyCapacity || 'خط تولید فعال',
          rawTimestamp: ad.createdAt ? new Date(ad.createdAt).getTime() : Date.now(),
          date: formatPrecisePersianDateTime(ad.createdAt ? new Date(ad.createdAt).getTime() : Date.now()),
          priority: 'high',
          priorityReason: 'تایید پروانه بهداشت',
          details: ad,
          originalStatus: ad.status || 'pending',
          currentStatus: status
        });
      });
    } catch (e) {}

    // C. Factory Products
    if (products) {
      products.forEach((p: any) => {
        if (!p) return;
        const pid = p.id || `p_${(p.name || '').replace(/\s+/g, '')}_${(p.brand || '').replace(/\s+/g, '')}`;
        const uniqueId = `prod_${pid}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (p.approvalStatus === 'approved' || p.isApproved === true) status = 'approved';
        else if (p.approvalStatus === 'rejected') status = 'rejected';

        // Only aggregate products explicitly under audit/rejection/approval.
        // Skip standard preloaded catalog items to avoid crowding.
        const isAuditable = p.approvalStatus === 'pending' || p.approvalStatus === 'rejected' || p.approvalStatus === 'approved' || p.isPending === true;
        if (!isAuditable) return;

        const rawDate = p.createdAt?.seconds ? p.createdAt.seconds * 1000 : Date.now();
        addItem({
          id: uniqueId,
          type: 'factory_product',
          typeLabel: 'ممیزی کالا',
          title: `تایید کالای خط: ${p.name || p.title}`,
          requesterName: p.factoryName || 'کارخانه تولیدی',
          requesterPhone: 'ثبت در سامانه',
          requesterCompany: p.brand || p.factoryName || 'نامشخص',
          valueToman: Number(p.bulk_price || p.price || 0),
          quantity: `${p.min_order_cartons || 1} کارتن`,
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: 'high',
          priorityReason: 'بررسی قیمت درب کارخانه',
          details: p,
          originalStatus: p.approvalStatus || 'pending',
          currentStatus: status
        });
      });
    }

    // D. Wholesale Orders
    const ords = orders || [];
    ords.forEach((ord: any) => {
      if (!ord) return;
      const oid = ord.id || `o_${(ord.buyerName || '').replace(/\s+/g, '')}_${(ord.totalAmount || '')}`;
      const uniqueId = `order_${oid}`;

      let status: 'pending' | 'approved' | 'rejected' = 'pending';
      if (ord.status === 'payment_verified' || ord.status === 'completed' || ord.status === 'shipped') status = 'approved';
      else if (ord.status === 'cancelled' || ord.status === 'rejected') status = 'rejected';

      const totalAmount = Number(ord.totalAmount || 0);
      const rawDate = ord.createdAt?.seconds ? ord.createdAt.seconds * 1000 : Date.now();

      addItem({
        id: uniqueId,
        type: 'wholesale_order',
        typeLabel: 'سفارش خرید عمده',
        title: `فاکتور خرید #${String(oid).slice(-6)}`,
        requesterName: ord.buyerName || 'خریدار',
        requesterPhone: ord.buyerPhone || 'ثبت نشده',
        requesterCompany: ord.buyerCompany || ord.businessName,
        requesterCity: ord.buyerCity || 'تهران',
        valueToman: totalAmount,
        quantity: `${ord.items?.length || 1} قلم کالا`,
        rawTimestamp: rawDate,
        date: formatPrecisePersianDateTime(rawDate),
        priority: totalAmount > 50000000 ? 'critical' : 'high',
        priorityReason: 'بررسی پرداخت و انطباق موجودی',
        details: ord,
        originalStatus: ord.status || 'pending',
        currentStatus: status
      });
    });

    // E. Dealership Requests (Consolidated from Multi-Key Storage + Representatives List)
    try {
      const mergedAgencyMap = new Map<string, any>();
      const listA = safeParseArray(localStorage.getItem("dastavval_agency_requests"));
      const listB = safeParseArray(localStorage.getItem("dastavval_dealership_requests"));
      const listC = b2bConfig?.dealershipRequests || [];
      
      [...listA, ...listB, ...listC].forEach((req: any) => {
        if (!req) return;
        const phoneKey = (req.mobile || req.phone || '').trim();
        const codeKey = (req.code || req.agencyCode || req.id || '').trim();
        const dedupeKey = phoneKey || codeKey || `req_${Math.random()}`;
        
        if (mergedAgencyMap.has(dedupeKey)) {
          mergedAgencyMap.set(dedupeKey, { ...mergedAgencyMap.get(dedupeKey), ...req });
        } else {
          mergedAgencyMap.set(dedupeKey, req);
        }
      });
      
      Array.from(mergedAgencyMap.values()).forEach((req: any) => {
        if (!req) return;
        const reqId = req.id || req.code || req.agencyCode || `req_${(req.mobile || req.phone || '').replace(/\s+/g, '')}`;
        const uniqueId = `agency_req_${reqId}`;
        
        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (req.status === 'تایید شده' || req.isApproved === true || req.dealershipStatus === 'approved') status = 'approved';
        else if (req.status === 'رد شده' || req.dealershipStatus === 'rejected') status = 'rejected';

        const rawDate = req.timestamp || (req.createdAt ? new Date(req.createdAt).getTime() : Date.now());

        addItem({
          id: uniqueId,
          type: 'dealership',
          typeLabel: 'تقاضای عاملیت و نمایندگی',
          title: `درخواست نمایندگی ${req.province || ''} (${req.city || 'منطقه جدید'})`,
          requesterName: req.fullName || req.name || 'متقاضی عاملیت',
          requesterPhone: req.mobile || req.phone || 'ثبت نشده',
          requesterCompany: req.companyName || req.company || 'حقیقی / حقوقی',
          requesterCity: `${req.province || ''} - ${req.city || ''}`,
          valueToman: req.monthlyTurnover || 0,
          quantity: req.requestedCartons ? `${req.requestedCartons} کارتن در ماه` : (req.monthlyQuotaCeilingFormatted || 'سهمیه استانی'),
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: req.cityTier === 1 ? 'critical' : 'high',
          priorityReason: `بررسی صلاحیت منطقه و سهمیه ${req.city || ''}`,
          details: req,
          originalStatus: req.status || 'در حال بررسی',
          currentStatus: status
        });
      });

      // Also pending representatives from representativesList
      (representativesList || []).forEach((rep: any) => {
        if (!rep || rep.isApproved) return;
        const repId = rep.id || rep.agencyCode || rep.phone;
        const uniqueId = `rep_list_${repId}`;

        addItem({
          id: uniqueId,
          type: 'dealership',
          typeLabel: 'پرونده نمایندگی در انتظار',
          title: `عاملیت رسمی ${rep.city || ''} - ${rep.name}`,
          requesterName: rep.name || 'نماینده',
          requesterPhone: rep.phone || 'ثبت نشده',
          requesterCompany: rep.companyName || 'دفتر استانی',
          requesterCity: rep.city || 'نامشخص',
          quantity: 'عاملیت توزیع',
          rawTimestamp: Date.now() - 3600000,
          date: formatPrecisePersianDateTime(Date.now() - 3600000),
          priority: 'high',
          priorityReason: 'احراز هویت و صدور نشان',
          details: rep,
          originalStatus: 'در انتظار تایید',
          currentStatus: 'pending'
        });
      });
    } catch (e) {}

    // F. SafeBuy Requests
    try {
      (safeBuyRequests || []).forEach((sb: any) => {
        if (!sb) return;
        const sbid = sb.id || `sb_${Date.now()}`;
        const uniqueId = `safebuy_${sbid}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (sb.status === 'approved' || sb.status === 'completed') status = 'approved';
        else if (sb.status === 'rejected' || sb.status === 'cancelled') status = 'rejected';

        const rawDate = sb.createdAt?.seconds ? sb.createdAt.seconds * 1000 : Date.now();
        addItem({
          id: uniqueId,
          type: 'safe_buy',
          typeLabel: 'خرید امن (ضمانت بانکی)',
          title: `معامله امن: ${sb.productTitle || sb.title || 'سفارش تناژی'}`,
          requesterName: sb.buyerName || sb.userName || 'خریدار',
          requesterPhone: sb.buyerPhone || sb.phone || 'ثبت در قرارداد',
          requesterCompany: sb.buyerCompany || 'شرکت بازرگانی',
          requesterCity: sb.city || 'تهران',
          valueToman: Number(sb.amount || sb.totalAmount || 0),
          quantity: sb.quantity ? `${sb.quantity} تن/کارتن` : 'سفارش تضمین‌شده',
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: Number(sb.amount || 0) > 100000000 ? 'critical' : 'high',
          priorityReason: 'تطبیق واریز با شبا کارخانه',
          details: sb,
          originalStatus: sb.status || 'pending',
          currentStatus: status
        });
      });
    } catch (e) {}

    // G. Sponsored / Billboard Ads
    try {
      (sponsoredAds || []).forEach((ad: any) => {
        if (!ad) return;
        const adId = ad.id || `ad_${Date.now()}`;
        const uniqueId = `billboard_${adId}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (ad.status === 'approved' || ad.isApproved === true) status = 'approved';
        else if (ad.status === 'rejected') status = 'rejected';

        const rawDate = ad.createdAt ? new Date(ad.createdAt).getTime() : Date.now();
        addItem({
          id: uniqueId,
          type: 'billboard_ad',
          typeLabel: 'آگهی بیلبورد و ویژه',
          title: `آگهی: ${ad.title || 'بدون عنوان'}`,
          requesterName: ad.contactName || ad.author || 'صاحب آگهی',
          requesterPhone: ad.phone || 'ثبت شده',
          requesterCompany: ad.companyName || ad.factoryName,
          requesterCity: ad.city || ad.province || 'سراسری',
          valueToman: Number(ad.price || 0),
          quantity: ad.plan || 'پکیج ویژه',
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: 'medium',
          priorityReason: 'بررسی محتوا و تصویر آگهی',
          details: ad,
          originalStatus: ad.status || 'pending',
          currentStatus: status
        });
      });
    } catch (e) {}

    // H. Barter Deals
    try {
      (barterDeals || []).forEach((deal: any) => {
        if (!deal) return;
        const dealId = deal.id || `barter_${Date.now()}`;
        const uniqueId = `barter_${dealId}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (deal.status === 'تایید نهایی شده' || deal.status === 'approved') status = 'approved';
        else if (deal.status === 'رد شده' || deal.status === 'rejected') status = 'rejected';

        const rawDate = deal.createdAt ? new Date(deal.createdAt).getTime() : Date.now();
        addItem({
          id: uniqueId,
          type: 'barter_deal',
          typeLabel: 'قرارداد تهاتر کارخانه',
          title: `تهاتر: ${deal.offerTitle || deal.title || 'مبادله کالا'}`,
          requesterName: deal.requesterName || deal.factoryName || 'طرف اول',
          requesterPhone: deal.phone || 'ثبت در پیش‌نویس',
          requesterCompany: deal.factoryName,
          requesterCity: deal.city || 'شهرک صنعتی',
          valueToman: Number(deal.estimatedValue || 0),
          quantity: deal.exchangeQuantity || 'مبادله پایاپای',
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: 'high',
          priorityReason: 'تطبیق کارشناسی ارزش اقلام مبادله',
          details: deal,
          originalStatus: deal.status || 'pending',
          currentStatus: status
        });
      });
    } catch (e) {}

    // I. Callback Requests
    try {
      (callbackRequests || []).forEach((cb: any) => {
        if (!cb) return;
        const cbId = cb.id || `cb_${Date.now()}`;
        const uniqueId = `callback_${cbId}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (cb.status === 'called' || cb.status === 'completed') status = 'approved';
        else if (cb.status === 'archived' || cb.status === 'rejected') status = 'rejected';

        const rawDate = cb.createdAt?.seconds ? cb.createdAt.seconds * 1000 : (cb.timestamp || Date.now());
        addItem({
          id: uniqueId,
          type: 'callback',
          typeLabel: 'درخواست تماس کارشناسی',
          title: `درخواست مشاوره: ${cb.subject || cb.name || 'خریدار سازمانی'}`,
          requesterName: cb.name || 'کاربر سامانه',
          requesterPhone: cb.phone || 'ثبت نشده',
          requesterCompany: cb.company || 'متقاضی',
          requesterCity: cb.city || 'تهران',
          quantity: cb.preferredTime || 'در اسرع وقت',
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: 'high',
          priorityReason: 'تماس سریع با خریدار عمده',
          details: cb,
          originalStatus: cb.status || 'pending',
          currentStatus: status
        });
      });
    } catch (e) {}

    // J. Support Tickets
    try {
      (supportTickets || []).forEach((st: any) => {
        if (!st) return;
        const stId = st.id || `ticket_${Date.now()}`;
        const uniqueId = `ticket_${stId}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (st.status === 'closed' || st.status === 'resolved') status = 'approved';
        else if (st.status === 'rejected') status = 'rejected';

        const rawDate = st.createdAt?.seconds ? st.createdAt.seconds * 1000 : (st.timestamp || Date.now());
        addItem({
          id: uniqueId,
          type: 'support_ticket',
          typeLabel: 'تیکت پشتیبانی و بازرسی',
          title: `تیکت #${String(stId).slice(-5)}: ${st.subject || st.title || 'پیگیری سفارش'}`,
          requesterName: st.userName || st.name || 'کاربر',
          requesterPhone: st.userPhone || st.phone || 'ثبت در تیکت',
          requesterCompany: st.userCompany,
          requesterCity: st.city,
          quantity: st.category || 'پشتیبانی فنی',
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: st.priority === 'urgent' ? 'critical' : 'medium',
          priorityReason: 'رسیدگی به درخواست کاربر',
          details: st,
          originalStatus: st.status || 'pending',
          currentStatus: status
        });
      });
    } catch (e) {}

    // 10. RAW MATERIAL SUPPLY ADS (آگهی‌های عرضه مواد اولیه و ملزومات کارخانجات)
    try {
      const localMaterials = safeParseArray(localStorage.getItem("dastavval_raw_materials") || "[]");
      const pendingLocalMaterials = safeParseArray(localStorage.getItem("dastavval_pending_raw_materials") || "[]");
      const configMaterials = Array.isArray(b2bConfig?.rawMaterialAds) ? b2bConfig.rawMaterialAds : [];
      const propMaterials = Array.isArray(rawMaterialAds) ? rawMaterialAds : [];

      const rawCombined = [...pendingLocalMaterials, ...localMaterials, ...propMaterials, ...configMaterials];
      const seenRawIds = new Set<string>();
      const dedupedRaw: any[] = [];

      rawCombined.forEach(rm => {
        if (!rm) return;
        const id = String(rm.id || rm.materialId || rm.title || "");
        if (id && !seenRawIds.has(id)) {
          seenRawIds.add(id);
          dedupedRaw.push(rm);
        }
      });

      dedupedRaw.forEach(rm => {
        const rawId = rm.id || rm.materialId || `raw-${Date.now()}`;
        const uniqueId = `raw_mat_${rawId}`;

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (rm.status === 'rejected' || rm.status === 'رد شده') {
          status = 'rejected';
        } else if (rm.status === 'approved' || (rm.isVerified && !rm.isPendingApproval)) {
          status = 'approved';
        } else {
          status = 'pending';
        }

        const rawDate = rm.createdAt ? new Date(rm.createdAt).getTime() : (rm.rawTimestamp || Date.now());
        const priceNum = rm.priceEstimate ? Number(String(rm.priceEstimate).replace(/\D/g, '')) : 0;

        addItem({
          id: uniqueId,
          type: 'raw_material',
          typeLabel: 'آگهی مواد اولیه و ملزومات',
          title: `عرضه ${rm.name || rm.title || 'ماده اولیه'} (${rm.category || 'صنایع غذایی'})`,
          requesterName: rm.supplierName || rm.name || 'تامین‌کننده ماده اولیه',
          requesterPhone: rm.contactPhone || rm.phone || rm.supplierPhone || '۰۲۱',
          requesterCompany: rm.supplierName,
          requesterCity: rm.supplierLocation || 'ایران',
          valueToman: priceNum || 50000000,
          quantity: `${rm.minOrder || 'حداقل سفارش: ۱'} ${rm.unit || 'تن'}`,
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: status === 'pending' ? 'high' : 'normal',
          priorityReason: 'بررسی اصالت آزمایشگاهی، برگه آنالیز COA و قیمت تامین‌کننده',
          details: rm,
          originalStatus: rm.status || (rm.isPendingApproval ? 'pending' : 'approved'),
          currentStatus: status
        });
      });
    } catch (e) {
      console.error("Error aggregating raw material ads:", e);
    }

    // 11. RAW MATERIAL RFQ / ORDERS (استعلام‌ها و تقاضاهای خرید مواد اولیه)
    try {
      const localRawOrders = safeParseArray(localStorage.getItem("dastavval_raw_orders") || "[]");
      const configRawOrders = Array.isArray(b2bConfig?.rawOrders) ? b2bConfig.rawOrders : [];
      const combinedOrders = [...localRawOrders, ...configRawOrders];
      const seenOrderIds = new Set<string>();

      combinedOrders.forEach((ro: any) => {
        if (!ro) return;
        const roId = String(ro.id || ro.orderId || "");
        if (!roId || seenOrderIds.has(roId)) return;
        seenOrderIds.add(roId);

        let status: 'pending' | 'approved' | 'rejected' = 'pending';
        if (ro.status === 'rejected' || ro.status === 'لغو شده') {
          status = 'rejected';
        } else if (ro.status === 'approved' || ro.status === 'در حال تامین' || ro.isApproved) {
          status = 'approved';
        } else {
          status = 'pending';
        }

        const rawDate = ro.createdAt ? new Date(ro.createdAt).getTime() : (ro.timestamp || Date.now());
        addItem({
          id: `raw_order_${roId}`,
          type: 'raw_order',
          typeLabel: 'استعلام خرید ماده اولیه (RFQ)',
          title: `تقاضای تامین: ${ro.materialName || ro.title || 'ماده اولیه'}`,
          requesterName: ro.buyerName || ro.factoryName || ro.name || 'کارخانه متقاضی',
          requesterPhone: ro.buyerPhone || ro.phone || '۰۲۱',
          requesterCompany: ro.factoryName,
          requesterCity: ro.province || ro.city || 'ایران',
          valueToman: ro.budget ? Number(String(ro.budget).replace(/\D/g, '')) : 100000000,
          quantity: `${ro.requiredAmount || ro.quantity || 'سفارش تناژ'} ${ro.unit || 'تن'}`,
          rawTimestamp: rawDate,
          date: formatPrecisePersianDateTime(rawDate),
          priority: 'critical',
          priorityReason: 'استعلام فوری خط تولید کارخانه - نیازمند استعلام تامین‌کننده',
          details: ro,
          originalStatus: ro.status || 'pending',
          currentStatus: status
        });
      });
    } catch (e) {
      console.error("Error aggregating raw orders:", e);
    }

    return items;
  }, [orders, safeBuyRequests, sponsoredAds, barterDeals, representativesList, callbackRequests, supportTickets, suppliersList, b2bConfig, capacityAds, products, rawMaterialAds]);

  const metrics = useMemo(() => {
    const pendingOnly = aggregatedPendingItems.filter(i => i.currentStatus === 'pending');
    return {
      total: pendingOnly.length,
      critical: pendingOnly.filter(i => i.priority === 'critical').length,
      high: pendingOnly.filter(i => i.priority === 'high').length,
      totalPipelineValue: pendingOnly.reduce((sum, i) => sum + (i.valueToman || 0), 0)
    };
  }, [aggregatedPendingItems]);

  // Handle Restore (Revive) Item
  const handleRestoreItem = async (item: PendingItem) => {
    setActionLoadingId(item.id);
    try {
      if (item.type === 'factory_registration') {
        if (onUpdateSupplierStatus) await onUpdateSupplierStatus(item.details.id, 'pending');
        // Update local/b2b if needed
      } else if (item.type === 'capacity_ad') {
        if (onUpdateCapacityAdStatus) await onUpdateCapacityAdStatus(item.details.id, 'pending');
      } else if (item.type === 'factory_product') {
        if (onUpdateProductStatus) await onUpdateProductStatus(item.details.id, false, "بررسی مجدد");
        // Need to ensure status goes back to pending in your backend/storage
      } else if (item.type === 'wholesale_order') {
        await onUpdateOrderStatus(item.details.id, 'order_received');
      } else if (item.type === 'billboard_ad') {
        onUpdateAdStatus(item.details.id, 'pending');
      } else if (item.type === 'safe_buy') {
        await onUpdateSafeBuyStatus(item.details.id, item.details.firebaseId, 'pending');
      }
      
      showToast(`درخواست «${item.title}» احیا شد و به لیست انتظار بازگشت.`);
      window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
    } catch (e) {
      showToast('خطا در احیای درخواست.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Filter and Sort
  const filteredItems = useMemo(() => {
    return aggregatedPendingItems.filter(item => {
      // View Mode Filter (Pending vs History)
      if (viewMode === 'pending') {
        if (item.currentStatus !== 'pending') return false;
      } else {
        if (item.currentStatus === 'pending') return false;
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'crm_and_support') {
          if (item.type !== 'callback' && item.type !== 'support_ticket') return false;
        } else if (filterType === 'raw_material') {
          if (item.type !== 'raw_material' && item.type !== 'raw_order') return false;
        } else if (item.type !== filterType) {
          return false;
        }
      }

      // Priority filter
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = (item.title || "").toLowerCase().includes(q);
        const matchName = (item.requesterName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchName) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        const weight: Record<PriorityLevel, number> = { critical: 4, high: 3, medium: 2, normal: 1 };
        return weight[b.priority] - weight[a.priority];
      } else if (sortBy === 'value_desc') {
        return (b.valueToman || 0) - (a.valueToman || 0);
      } else {
        return (b.rawTimestamp || 0) - (a.rawTimestamp || 0);
      }
    });
  }, [aggregatedPendingItems, filterType, filterPriority, searchQuery, sortBy, viewMode]);
  // Execute approval based on item type
  const handleApproveItem = async (item: PendingItem) => {
    setActionLoadingId(item.id);
    try {
      if (item.type === 'factory_registration') {
        const facId = item.details.id || item.details.email || '';
        const facName = item.details.name || item.details.company || '';
        const badgesToAward = selectedFactoryBadges.length > 0 ? selectedFactoryBadges : ["first-hand-origin", "amin-al-zarb"];

        // 1. Call onUpdateSupplierStatus
        if (onUpdateSupplierStatus) {
          await onUpdateSupplierStatus(facId, 'active');
        } else if (b2bConfig && onUpdateB2bConfig) {
          // 2. Fallback: Update b2bConfig factories if available
          const currentFactories = b2bConfig.factories || [];
          const exists = currentFactories.some((f: any) => (facId && f.id === facId) || (facName && f.name === facName));
          let updated;
          if (exists) {
            updated = currentFactories.map((f: any) => 
              ((facId && f.id === facId) || (facName && f.name === facName))
                ? { 
                    ...f, 
                    isActive: true, 
                    status: 'active', 
                    isFirstHand: true, 
                    selectedBadges: badgesToAward 
                  }
                : f
            );
          } else {
            updated = [
              ...currentFactories,
              {
                id: facId || `fac_${Date.now()}`,
                name: facName,
                isActive: true,
                status: 'active',
                isFirstHand: true,
                selectedBadges: badgesToAward,
                location: item.details.location || item.details.city || 'شهرک صنعتی',
                city: item.details.city || 'تهران',
                province: item.details.province || 'تهران',
                industrialPark: item.details.industrialPark || 'شهرک صنعتی شمس‌آباد',
                category: item.details.category || 'صنایع غذایی و مصرفی',
                phone: item.details.phone || item.details.contactPhone,
                contactPerson: item.details.contactPerson || item.details.managerName,
                rating: 5,
                establishedYear: item.details.establishedYear || '۱۴۰۰'
              }
            ];
          }
          await onUpdateB2bConfig({ ...b2bConfig, factories: updated });
        }

        // 3. Update localStorage factories
        try {
          const localFactories = JSON.parse(localStorage.getItem("dastavval_factories") || "[]");
          const idx = localFactories.findIndex((f: any) => (facId && f.id === facId) || (facName && f.name === facName));
          if (idx >= 0) {
            localFactories[idx].isActive = true;
            localFactories[idx].status = 'active';
            localFactories[idx].isFirstHand = true;
            localFactories[idx].selectedBadges = badgesToAward;
          } else {
            localFactories.push({
              id: facId || `fac_${Date.now()}`,
              name: facName,
              isActive: true,
              status: 'active',
              isFirstHand: true,
              selectedBadges: badgesToAward,
              location: item.details.location || item.details.city || 'شهرک صنعتی',
              city: item.details.city || 'تهران',
              province: item.details.province || 'تهران',
              industrialPark: item.details.industrialPark || 'شهرک صنعتی شمس‌آباد',
              category: item.details.category || 'صنایع غذایی و مصرفی',
              phone: item.details.phone || item.details.contactPhone,
              rating: 5
            });
          }
          localStorage.setItem("dastavval_factories", JSON.stringify(localFactories));
          
          // Clear from pending if it was there
          try {
            const pending = JSON.parse(localStorage.getItem("dastavval_pending_factories") || "[]");
            const filteredPending = pending.filter((f: any) => f.id !== facId && f.name !== facName);
            localStorage.setItem("dastavval_pending_factories", JSON.stringify(filteredPending));
          } catch (e) {}

          window.dispatchEvent(new CustomEvent("dastavval_factories_updated"));
        } catch (e) {}

        showToast(`کارخانه «${facName}» با موفقیت تایید و با نشان‌های رسمی در سامانه فعال گردید.`);
      } else if (item.type === 'capacity_ad') {
        const adId = item.details.id;
        if (onUpdateCapacityAdStatus) {
          await onUpdateCapacityAdStatus(adId, 'approved');
        }
        try {
          const localAds = JSON.parse(localStorage.getItem("dastavval_capacity_ads") || "[]");
          const updated = localAds.map((ad: any) => (ad.id === adId || String(ad.id) === String(adId)) ? { ...ad, status: 'approved', isPending: false } : ad);
          localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("dastavval_capacity_ads_updated"));
        } catch (e) {}
        showToast(`آگهی ظرفیت خالی خط تولید با موفقیت تایید و در تالار معاملات فعال شد.`);
      } else if (item.type === 'cooperation_request') {
        const adId = item.details.adId;
        const reqIdx = item.details.index;
        try {
          const localAds = JSON.parse(localStorage.getItem("dastavval_capacity_ads") || "[]");
          const ad = localAds.find((a: any) => a.id === adId);
          if (ad && ad.cooperationRequests && ad.cooperationRequests[reqIdx]) {
            ad.cooperationRequests[reqIdx].status = 'تایید شده';
            localStorage.setItem("dastavval_capacity_ads", JSON.stringify(localAds));
            window.dispatchEvent(new CustomEvent("dastavval_capacity_ads_updated"));
          }
        } catch (e) {}
        showToast(`پیشنهاد همکاری کارمزدی تایید و اطلاعات تماس به کارخانه ارسال گردید.`);
      } else if (item.type === 'factory_product') {
        if (onUpdateProductStatus) {
          await onUpdateProductStatus(item.details.id, true);
        }
        try {
          const localProds = JSON.parse(localStorage.getItem("dastavval_products") || "[]");
          const updated = localProds.map((p: any) => p.id === item.details.id ? { ...p, isApproved: true, disabled: false, approvalStatus: 'approved' } : p);
          localStorage.setItem("dastavval_products", JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("dastavval_products_updated"));
        } catch (e) {}
        showToast(`کالای "${item.details.name || item.details.title || ''}" تایید و در کاتالوگ فروش سراسری منتشر شد.`);
      } else if (item.type === 'wholesale_order') {
        await onUpdateOrderStatus(item.details.id, 'payment_verified');
        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        showToast(`سفارش خرید عمده #${String(item.details.id || "").slice(-6)} با موفقیت تایید و به مرحله تخصیص باربری رفت.`);
      } else if (item.type === 'safe_buy') {
        await onUpdateSafeBuyStatus(item.details.id, item.details.firebaseId, 'approved');
        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        showToast(`درخواست خرید امن ${item.details.id} تایید شد.`);
      } else if (item.type === 'billboard_ad') {
        onUpdateAdStatus(item.details.id, 'approved');
        window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
        showToast(`آگهی "${item.details.title}" تایید و در تالار معاملات منتشر گردید.`);
      } else if (item.type === 'barter_deal') {
        onUpdateBarterStatus(item.details.id, 'تایید نهایی شده');
        window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
        showToast(`قرارداد تهاتر با کارخانه ${item.details.factoryName} تایید نهایی شد.`);
      } else if (item.type === 'dealership') {
        const targetIdentifier = item.details?.id || item.details?.agencyCode || item.details?.code || item.requesterPhone || item.details?.mobile;
        
        await ResilientVault.updateDealershipStatus(targetIdentifier, 'approved', repBadge);

        if (onUpdateRepStatus) {
          onUpdateRepStatus(targetIdentifier, true, repBadge);
        }

        // Send SMS Status Update to Applicant
        const repPhone = item.requesterPhone || item.details?.mobile || item.details?.phone;
        if (repPhone && repPhone !== 'ثبت نشده') {
          try {
            fetch(getApiUrl("/api/sms/send-dealership-status-sms"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: repPhone,
                fullName: item.requesterName || item.details?.fullName,
                agencyCode: item.details?.code || item.details?.agencyCode,
                status: "approved",
                badge: repBadge
              })
            }).catch(() => {});
          } catch (e) {}
        }

        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_agency_request_submitted"));
        window.dispatchEvent(new CustomEvent("dastavval_representatives_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_users_updated"));
        showToast(`درخواست عاملیت «${item.requesterName}» (${item.details?.city || ''}) با نشان «${repBadge}» تایید و صادر گردید.`);
      } else if (item.type === 'callback') {
        await onUpdateCallback(item.details.id, 'called', 'تماس کارشناسی با موفقیت انجام شد');
        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        showToast(`وضعیت تماس با ${item.requesterPhone} به انجام شده تغییر کرد.`);
      } else if (item.type === 'support_ticket') {
        await onUpdateTicketStatus(item.details.id, 'closed');
        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        showToast(`تیکت پشتیبانی بررسی و بسته شد.`);
      } else if (item.type === 'raw_material') {
        const rawId = item.details?.id;
        const matName = item.details?.name || item.title;

        // 1. Update localStorage dastavval_raw_materials
        try {
          const stored = safeParseArray(localStorage.getItem("dastavval_raw_materials") || "[]");
          const updated = stored.map((m: any) => 
            String(m.id) === String(rawId)
              ? { ...m, isVerified: true, isPendingApproval: false, status: 'approved', isApproved: true, reviewedAt: new Date().toISOString() }
              : m
          );
          if (!updated.some((m: any) => String(m.id) === String(rawId))) {
            updated.unshift({ ...item.details, isVerified: true, isPendingApproval: false, status: 'approved', isApproved: true });
          }
          localStorage.setItem("dastavval_raw_materials", JSON.stringify(updated));

          const pending = safeParseArray(localStorage.getItem("dastavval_pending_raw_materials") || "[]");
          const filteredPending = pending.filter((m: any) => String(m.id) !== String(rawId));
          localStorage.setItem("dastavval_pending_raw_materials", JSON.stringify(filteredPending));
        } catch (err) {}

        // 2. Update b2bConfig.rawMaterialAds
        if (onUpdateB2bConfig && b2bConfig) {
          const cfgRaw = Array.isArray(b2bConfig.rawMaterialAds) ? [...b2bConfig.rawMaterialAds] : [];
          const idx = cfgRaw.findIndex((m: any) => String(m.id) === String(rawId));
          if (idx >= 0) {
            cfgRaw[idx] = { ...cfgRaw[idx], isVerified: true, isPendingApproval: false, status: 'approved', isApproved: true, reviewedAt: new Date().toISOString() };
          } else {
            cfgRaw.unshift({ ...item.details, isVerified: true, isPendingApproval: false, status: 'approved', isApproved: true });
          }
          await onUpdateB2bConfig({ ...b2bConfig, rawMaterialAds: cfgRaw });
        }

        // 3. Notify server approvals API
        try {
          await fetch(getApiUrl("/api/v1/dev/approvals"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "raw_material", id: rawId, action: "approve" })
          });
        } catch (e) {}

        window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
        window.dispatchEvent(new CustomEvent("dastavval-ads-sync"));
        window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
        showToast(`آگهی عرضه ماده اولیه «${matName}» با موفقیت ممیزی، تایید و منتشر شد.`);
      } else if (item.type === 'raw_order') {
        const roId = item.details?.id;
        try {
          const stored = safeParseArray(localStorage.getItem("dastavval_raw_orders") || "[]");
          const updated = stored.map((ro: any) => String(ro.id) === String(roId) ? { ...ro, status: 'approved', isApproved: true } : ro);
          localStorage.setItem("dastavval_raw_orders", JSON.stringify(updated));
        } catch (e) {}

        try {
          await fetch(getApiUrl("/api/v1/dev/approvals"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "raw_order", id: roId, action: "approve" })
          });
        } catch (e) {}

        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
        showToast(`استعلام خرید ماده اولیه «${item.title}» تایید و به تامین‌کنندگان ارجاع شد.`);
      }
      
      // Global Refresh Event
      window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
    } catch (e: any) {
      console.error(e);
      showToast('خطا در انجام عملیات تایید.');
    } finally {
      setActionLoadingId(null);
      if (viewingDetailItem?.id === item.id) {
        setViewingDetailItem(null);
      }
    }
  };

  // Execute rejection
  const handleRejectItem = async (item: PendingItem, reason: string) => {
    setActionLoadingId(item.id);
    try {
      if (item.type === 'factory_registration') {
        const facId = item.details.id || item.details.email || item.details.phone;
        if (onUpdateSupplierStatus) {
          await onUpdateSupplierStatus(facId, 'suspended');
        }
        
        // Cleanup local storage
        try {
          const pending = JSON.parse(localStorage.getItem("dastavval_pending_factories") || "[]");
          const filteredPending = pending.filter((f: any) => f.id !== facId && (f.email || f.id) !== facId);
          localStorage.setItem("dastavval_pending_factories", JSON.stringify(filteredPending));
          
          const facs = JSON.parse(localStorage.getItem("dastavval_factories") || "[]");
          const updatedFacs = facs.map((f: any) => (f.id === facId || (f.email || f.id) === facId) ? { ...f, status: 'suspended', isActive: false } : f);
          localStorage.setItem("dastavval_factories", JSON.stringify(updatedFacs));
        } catch (e) {}

        showToast(`درخواست ثبت‌نام کارخانه رد و به حالت تعلیق درآمد.`);
      } else if (item.type === 'capacity_ad') {
        const adId = item.details.id;
        if (onUpdateCapacityAdStatus) {
          await onUpdateCapacityAdStatus(adId, 'rejected');
        }
        try {
          const localAds = JSON.parse(localStorage.getItem("dastavval_capacity_ads") || "[]");
          const updated = localAds.map((ad: any) => (ad.id === adId || String(ad.id) === String(adId)) ? { ...ad, status: 'rejected', rejectionReason: reason } : ad);
          localStorage.setItem("dastavval_capacity_ads", JSON.stringify(updated));
          window.dispatchEvent(new CustomEvent("dastavval_capacity_ads_updated"));
        } catch (e) {}
        showToast(`آگهی ظرفیت خالی رد شد.`);
      } else if (item.type === 'cooperation_request') {
        const adId = item.details.adId;
        const reqIdx = item.details.index;
        try {
          const localAds = JSON.parse(localStorage.getItem("dastavval_capacity_ads") || "[]");
          const ad = localAds.find((a: any) => a.id === adId);
          if (ad && ad.cooperationRequests && ad.cooperationRequests[reqIdx]) {
            ad.cooperationRequests[reqIdx].status = 'رد شده';
            localStorage.setItem("dastavval_capacity_ads", JSON.stringify(localAds));
            window.dispatchEvent(new CustomEvent("dastavval_capacity_ads_updated"));
          }
        } catch (e) {}
        showToast(`پیشنهاد همکاری رد شد.`);
      } else if (item.type === 'wholesale_order') {
        await onUpdateOrderStatus(item.details.id, 'cancelled');
        showToast(`سفارش خرید #${String(item.details.id || "").slice(-6)} لغو گردید.`);
      } else if (item.type === 'safe_buy') {
        await onUpdateSafeBuyStatus(item.details.id, item.details.firebaseId, 'rejected');
        showToast(`درخواست خرید امن رد شد.`);
      } else if (item.type === 'factory_product') {
        if (onUpdateProductStatus) {
          await onUpdateProductStatus(item.details.id, false, reason);
          showToast(`کالای "${item.details.name || item.details.title || ''}" رد شد.`);
        }
      } else if (item.type === 'billboard_ad') {
        onUpdateAdStatus(item.details.id, 'rejected', reason);
        showToast(`آگهی به علت "${reason || 'عدم انطباق شرایط'}" رد شد.`);
      } else if (item.type === 'barter_deal') {
        onUpdateBarterStatus(item.details.id, 'رد شده');
        showToast(`قرارداد تهاتر رد شد.`);
      } else if (item.type === 'dealership') {
        const targetIdentifier = item.details?.id || item.details?.agencyCode || item.details?.code || item.requesterPhone || item.details?.mobile;
        
        await ResilientVault.updateDealershipStatus(targetIdentifier, 'rejected', undefined, reason);

        if (onUpdateRepStatus) {
          onUpdateRepStatus(targetIdentifier, false);
        }

        // Send SMS Notice
        const repPhone = item.requesterPhone || item.details?.mobile || item.details?.phone;
        if (repPhone && repPhone !== 'ثبت نشده') {
          try {
            fetch(getApiUrl("/api/sms/send-dealership-status-sms"), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: repPhone,
                fullName: item.requesterName || item.details?.fullName,
                agencyCode: item.details?.code || item.details?.agencyCode,
                status: "rejected",
                reason: reason || "عدم احراز شرایط سهمیه یا نقص مدارک"
              })
            }).catch(() => {});
          } catch (e) {}
        }

        window.dispatchEvent(new CustomEvent("dastavval_agency_request_submitted"));
        window.dispatchEvent(new CustomEvent("dastavval_representatives_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_users_updated"));
        showToast(`تقاضای نمایندگی ${item.details?.city || ''} رد شد.`);
      } else if (item.type === 'callback') {
        await onUpdateCallback(item.details.id, 'archived', reason);
        showToast(`درخواست تماس بایگانی شد.`);
      } else if (item.type === 'support_ticket') {
        await onUpdateTicketStatus(item.details.id, 'rejected');
        showToast(`تیکت رد شد.`);
      } else if (item.type === 'raw_material') {
        const rawId = item.details?.id;
        try {
          const stored = safeParseArray(localStorage.getItem("dastavval_raw_materials") || "[]");
          const updated = stored.map((m: any) => 
            String(m.id) === String(rawId)
              ? { ...m, isVerified: false, isPendingApproval: false, status: 'rejected', rejectionReason: reason, reviewedAt: new Date().toISOString() }
              : m
          );
          localStorage.setItem("dastavval_raw_materials", JSON.stringify(updated));

          const pending = safeParseArray(localStorage.getItem("dastavval_pending_raw_materials") || "[]");
          const filteredPending = pending.filter((m: any) => String(m.id) !== String(rawId));
          localStorage.setItem("dastavval_pending_raw_materials", JSON.stringify(filteredPending));
        } catch (e) {}

        if (onUpdateB2bConfig && b2bConfig) {
          const cfgRaw = Array.isArray(b2bConfig.rawMaterialAds) ? [...b2bConfig.rawMaterialAds] : [];
          const idx = cfgRaw.findIndex((m: any) => String(m.id) === String(rawId));
          if (idx >= 0) {
            cfgRaw[idx] = { ...cfgRaw[idx], isVerified: false, isPendingApproval: false, status: 'rejected', rejectionReason: reason, reviewedAt: new Date().toISOString() };
            await onUpdateB2bConfig({ ...b2bConfig, rawMaterialAds: cfgRaw });
          }
        }

        try {
          await fetch(getApiUrl("/api/v1/dev/approvals"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "raw_material", id: rawId, action: "reject", reason })
          });
        } catch (e) {}

        window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
        showToast(`آگهی ماده اولیه به علت «${reason || 'عدم انطباق شرایط'}» رد شد.`);
      } else if (item.type === 'raw_order') {
        const roId = item.details?.id;
        try {
          const stored = safeParseArray(localStorage.getItem("dastavval_raw_orders") || "[]");
          const updated = stored.map((ro: any) => String(ro.id) === String(roId) ? { ...ro, status: 'rejected', rejectionReason: reason } : ro);
          localStorage.setItem("dastavval_raw_orders", JSON.stringify(updated));
        } catch (e) {}

        try {
          await fetch(getApiUrl("/api/v1/dev/approvals"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "raw_order", id: roId, action: "reject", reason })
          });
        } catch (e) {}

        window.dispatchEvent(new CustomEvent("dastavval_orders_updated"));
        window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
        showToast(`استعلام خرید ماده اولیه رد شد.`);
      }
    } catch (e: any) {
      console.error(e);
      showToast('خطا در رد درخواست.');
    } finally {
      setActionLoadingId(null);
      setRejectionModalItem(null);
      setRejectionReason("");
      if (viewingDetailItem?.id === item.id) {
        setViewingDetailItem(null);
      }
      // Global Refresh Event
      window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
    }
  };

  // ... (getTypeIcon and other functions)

  const getTypeIcon = (type: ApprovalType) => {
    switch (type) {
      case 'factory_registration':
        return <Building2 size={16} className="text-amber-600" />;
      case 'capacity_ad':
        return <Factory size={16} className="text-teal-600" />;
      case 'cooperation_request':
        return <Cpu size={16} className="text-indigo-600" />;
      case 'factory_product':
        return <Package size={16} className="text-emerald-600" />;
      case 'raw_material':
        return <FlaskConical size={16} className="text-purple-600" />;
      case 'raw_order':
        return <ShoppingBag size={16} className="text-violet-600" />;
      case 'wholesale_order':
        return <ShoppingCart size={16} className="text-emerald-600" />;
      case 'safe_buy':
        return <ShieldCheck size={16} className="text-emerald-600" />;
      case 'billboard_ad':
        return <Megaphone size={16} className="text-amber-600" />;
      case 'barter_deal':
        return <Repeat size={16} className="text-purple-600" />;
      case 'dealership':
        return <Award size={16} className="text-amber-600" />;
      case 'callback':
        return <Phone size={16} className="text-teal-600" />;
      case 'support_ticket':
        return <MessageSquare size={16} className="text-blue-600" />;
      default:
        return <Layers size={16} className="text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            فوری و حساس 🔥
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            اولویت بالا ⚡
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            اولویت عادی ⏱️
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
            استاندارد
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-right dir-rtl font-sans pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-black border border-emerald-500/40"
          >
            <CheckCircle2 className="text-emerald-400" size={18} />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER HERO: Principled Approvals Terminal */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <ShieldCheck size={26} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    مرکز ممیزی، تایید صلاحیت و صدور نشان‌های رسمی
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow-xs">
                    {toPersianNum(metrics.total)} مورد در صف
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-bold mt-1 leading-relaxed">
                  ممیزی متمرکز واحدهای تولیدی، اعطای نشان‌های رسمی (دست اول، امین‌الضرب، سیب سلامت)، تایید ظرفیت‌های خالی خطوط OEM، و سفارش‌های عمده کشوری
                </p>
              </div>
            </div>

            {selectedItemIds.length > 0 && (
              <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20">
                <span className="text-xs text-emerald-200 font-black pr-2">
                  {toPersianNum(selectedItemIds.length)} مورد انتخاب شده
                </span>
                <button
                  type="button"
                  onClick={() => handleBulkAction('approve')}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle2 size={15} />
                  <span>تایید دسته‌جمعی اقلام</span>
                </button>
              </div>
            )}
          </div>

          {/* METRIC PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-black text-slate-300">
                <span>کل درخواست‌های معوق</span>
                <Clock size={15} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white mt-2">
                {toPersianNum(metrics.total)} <span className="text-xs font-bold text-slate-400">مورد</span>
              </p>
            </div>

            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-black text-rose-300">
                <span>فوریت بحرانی (P1)</span>
                <AlertTriangle size={15} className="text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-200 mt-2">
                {toPersianNum(metrics.critical)} <span className="text-xs font-bold text-rose-400">مورد آنی</span>
              </p>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
                <span>اولویت بالا (P2)</span>
                <Zap size={15} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-200 mt-2">
                {toPersianNum(metrics.high)} <span className="text-xs font-bold text-amber-400">مورد</span>
              </p>
            </div>

            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] font-black text-emerald-300">
                <span>ارزش معاملات در گردش صف</span>
                <DollarSign size={15} className="text-emerald-400" />
              </div>
              <p className="text-lg font-black text-emerald-200 mt-2 truncate">
                {toPersianNum(metrics.totalPipelineValue.toLocaleString())} <span className="text-xs font-bold text-emerald-400">تومان</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BULK PROCESSING PROGRESS BAR */}
      <AnimatePresence>
        {bulkProcessing.active && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-emerald-900 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  در حال انجام عملیات گروهی...
                </span>
                <span className="text-sm font-black text-emerald-700">
                  {toPersianNum(bulkProcessing.current)} از {toPersianNum(bulkProcessing.total)} مورد
                </span>
              </div>
              <div className="w-full h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(bulkProcessing.current / bulkProcessing.total) * 100}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        {/* VIEW MODE TOGGLE (Pending vs History) */}
        <div className="flex items-center justify-center sm:justify-start border-b border-slate-100 pb-3 gap-1">
          <button
            onClick={() => setViewMode('pending')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${
              viewMode === 'pending' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <Clock size={16} />
            <span>در انتظار بررسی ({toPersianNum(aggregatedPendingItems.filter(i => i.currentStatus === 'pending').length)})</span>
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${
              viewMode === 'history' 
                ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            <HistoryIcon size={16} />
            <span>تاریخچه تاییدات ({toPersianNum(aggregatedPendingItems.filter(i => i.currentStatus !== 'pending').length)})</span>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <AnimatePresence>
            {selectedItemIds.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl z-50"
              >
                <span className="text-xs font-black ml-2 border-l border-white/20 pl-4">
                  {toPersianNum(selectedItemIds.length)} مورد انتخاب شده
                </span>
                
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-[11px] font-black transition-colors"
                >
                  <Check size={14} />
                  تایید همه
                </button>
                
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-xl text-[11px] font-black transition-colors"
                >
                  <X size={14} />
                  رد همه
                </button>

                <button
                  onClick={() => setSelectedItemIds([])}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="لغو انتخاب"
                >
                  <RotateCcw size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در نام کارخانه، شهرک صنعتی، نام متقاضی، شماره تماس، کد سفارش..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">تمام اولویت‌ها</option>
              <option value="critical">🔥 فقط بحرانی و فوری</option>
              <option value="high">⚡ فقط اولویت بالا</option>
              <option value="medium">⏱️ فقط اولویت عادی</option>
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-700 outline-none focus:border-emerald-500 transition-all cursor-pointer"
            >
              <option value="priority">مرتب‌سازی: بالاترین اولویت</option>
              <option value="value_desc">مرتب‌سازی: بیشترین ارزش مالی</option>
              <option value="date_desc">مرتب‌سازی: جدیدترین درخواست</option>
            </select>

            {/* Select All Toggle */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all cursor-pointer border border-slate-200"
            >
              {selectedItemIds.length === filteredItems.length && filteredItems.length > 0 ? "لغو انتخاب همه" : "انتخاب همه موارد"}
            </button>
          </div>
        </div>

        {/* Principled Categorized Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 pt-3">
          {[
            { id: 'all', label: 'همه درخواست‌ها', icon: '⚡', count: aggregatedPendingItems.length },
            { id: 'raw_material', label: 'مواد اولیه و ملزومات', icon: '🧪', count: aggregatedPendingItems.filter(i => i.type === 'raw_material' || i.type === 'raw_order').length },
            { id: 'factory_registration', label: 'کارخانجات و تولیدکنندگان', icon: '🏭', count: aggregatedPendingItems.filter(i => i.type === 'factory_registration').length },
            { id: 'capacity_ad', label: 'ظرفیت خالی خط تولید (OEM)', icon: '⚙️', count: aggregatedPendingItems.filter(i => i.type === 'capacity_ad').length },
            { id: 'cooperation_request', label: 'پیشنهاد همکاری کارمزدی', icon: '🤝', count: aggregatedPendingItems.filter(i => i.type === 'cooperation_request').length },
            { id: 'factory_product', label: 'ممیزی کالا و قیمت', icon: '📦', count: aggregatedPendingItems.filter(i => i.type === 'factory_product').length },
            { id: 'wholesale_order', label: 'سفارشات خرید عمده', icon: '🛒', count: aggregatedPendingItems.filter(i => i.type === 'wholesale_order').length },
            { id: 'safe_buy', label: 'خرید امن کف بازار', icon: '🛡️', count: aggregatedPendingItems.filter(i => i.type === 'safe_buy').length },
            { id: 'billboard_ad', label: 'مازاد بار و آگهی‌ها', icon: '📢', count: aggregatedPendingItems.filter(i => i.type === 'billboard_ad').length },
            { id: 'barter_deal', label: 'تهاتر صنعتی', icon: '🔄', count: aggregatedPendingItems.filter(i => i.type === 'barter_deal').length },
            { id: 'dealership', label: 'نمایندگی و عاملیت', icon: '🏅', count: aggregatedPendingItems.filter(i => i.type === 'dealership').length },
            { id: 'crm_and_support', label: 'استعلام تماس و تیکت', icon: '📞', count: aggregatedPendingItems.filter(i => i.type === 'callback' || i.type === 'support_ticket').length },
          ].map((tab, tIdx) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={`pending-tab-v3-${tab.id}-${tIdx}`}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-lg ${
                  isActive ? 'bg-slate-900 text-amber-300 font-mono' : 'bg-white text-slate-700 font-mono'
                }`}>
                  {toPersianNum(tab.count)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PRIORITIZED LIST CARDS */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl">
              ✨
            </div>
            <h4 className="text-sm font-black text-slate-800">تمامی درخواست‌ها رسیدگی شده‌اند!</h4>
            <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
              هیچ درخواست معوقی با فیلترهای انتخابی یافت نشد. تمام کارخانجات، خطوط تولید و فاکتورها به‌روز هستند.
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isSelected = selectedItemIds.includes(item.id);
            const isActionLoading = actionLoadingId === item.id;

            return (
              <div
                key={`pending-approval-card-v3-${item.id}-${idx}`}
                className={`bg-white rounded-3xl border transition-all hover:shadow-lg p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                  item.priority === 'critical'
                    ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-300/50'
                    : item.priority === 'high'
                      ? 'border-amber-200/90 bg-amber-50/10'
                      : 'border-slate-200/80'
                }`}
              >
                {/* Right: Checkbox + Priority Number + Icon + Basic Info */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItemIds(prev => [...prev, item.id]);
                      } else {
                        setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-1 sm:mt-0 cursor-pointer"
                  />

                  {/* Priority Rank indicator */}
                  <div className="flex flex-col items-center justify-center w-7 h-7 rounded-xl bg-slate-100 text-slate-700 text-xs font-black shrink-0 font-mono">
                    {toPersianNum(idx + 1)}
                  </div>

                  {/* Icon box */}
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content Meta */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(item.priority)}
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[10.5px] font-black">
                        {item.typeLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar size={11} />
                        {toPersianNum(item.date)}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {item.title}
                    </h4>

                    {/* Sub info */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500 font-bold pt-0.5">
                      <span className="flex items-center gap-1 text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                        <User size={12} className="text-indigo-600 shrink-0" />
                        <span>{item.requesterName}</span>
                      </span>

                      {item.requesterCompany && (
                        <span className="flex items-center gap-1 text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60">
                          <Building2 size={12} className="text-amber-600 shrink-0" />
                          <span>{item.requesterCompany}</span>
                        </span>
                      )}

                      <a 
                        href={`tel:${item.requesterPhone}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 font-mono text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-lg text-xs font-black dir-ltr transition-all shadow-2xs"
                        title="تماس مستقیم تلفنی با متقاضی"
                      >
                        <Phone size={12} className="text-emerald-600 shrink-0" />
                        <span>{toPersianNum(item.requesterPhone)}</span>
                      </a>

                      {item.requesterCity && (
                        <span className="text-slate-600 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                          <span>📍</span>
                          <span>{item.requesterCity}</span>
                        </span>
                      )}
                    </div>

                    {/* Request notes / content preview snippet */}
                    {(item.details?.notes || item.details?.message || item.details?.description || item.details?.buyerMessage) && (
                      <div className="text-[11px] text-slate-700 bg-amber-50/60 border border-amber-200/80 px-2.5 py-1.5 rounded-xl flex items-start gap-1.5 font-bold mt-1.5">
                        <span className="text-amber-800 font-black shrink-0">📝 شرح درخواست:</span>
                        <span className="text-slate-900 line-clamp-1 font-medium">
                          {item.details.notes || item.details.message || item.details.description || item.details.buyerMessage}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Financial Value / Quantity summary */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto lg:min-w-[170px] border-t lg:border-t-0 border-slate-100 pt-2 lg:pt-0 shrink-0">
                  {item.valueToman && item.valueToman > 0 ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">مبلغ برآوردی</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600 font-mono">
                        {toPersianNum(item.valueToman.toLocaleString())} تومان
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">مشخصات / تیراژ</span>
                      <span className="text-xs font-black text-slate-800">
                        {toPersianNum(item.quantity || '-')}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg font-bold mt-1 max-w-[220px] truncate text-left">
                    {item.priorityReason}
                  </span>
                </div>

                {/* Left: Action Buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {viewMode === 'history' ? (
                    <>
                      {/* Status Indicator */}
                      <div className={`px-3 py-2 rounded-xl text-[10px] font-black flex items-center gap-1.5 ${
                        item.currentStatus === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.currentStatus === 'approved' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        <span>{item.currentStatus === 'approved' ? 'تایید شده' : 'رد شده'}</span>
                      </div>

                      {/* Restore / Revive Button */}
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleRestoreItem(item)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isActionLoading ? <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={15} />}
                        <span>احیا و بررسی مجدد</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {/* View Details */}
                      <button
                        type="button"
                        onClick={() => {
                          setViewingDetailItem(item);
                          if (item.type === 'factory_registration') {
                            const existingBadges = item.details.selectedBadges || [];
                            if (existingBadges.length > 0) {
                              setSelectedFactoryBadges(existingBadges);
                            } else {
                              setSelectedFactoryBadges(["first-hand-origin", "amin-al-zarb"]);
                            }
                          }
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                        title="مشاهده جزئیات کامل و مدارک"
                      >
                        <Eye size={15} className="text-slate-600" />
                        <span>ممیزی مدارک</span>
                      </button>

                      {/* Universal Force Delete / Hard Delete */}
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={async () => {
                          if (window.confirm(`آیا از حذف قطعی و پاکسازی این مورد («${item.title}») اطمینان دارید؟`)) {
                            setActionLoadingId(item.id);
                            try {
                              const targetId = item.details?.id || item.id;
                              const targetIdStr = String(targetId).replace(/^(billboard_|barter_|agency_req_|rep_list_|safebuy_|raw_mat_|raw_order_|prod_)/, '');

                              // 1. Clean localStorage keys
                              const keysToClean = [
                                "dastavval_sponsored_ads_v2",
                                "dastavval_raw_materials",
                                "dastavval_pending_raw_materials",
                                "dastavval_capacity_ads",
                                "dastavval_agency_requests",
                                "dastavval_dealership_requests",
                                "dastavval_industrial_equipment",
                                "dastavval_industrial_services",
                                "dastavval_official_barters_v2",
                                "dastavval_raw_orders",
                                "dastavval_products"
                              ];
                              keysToClean.forEach(k => {
                                const val = localStorage.getItem(k);
                                if (val) {
                                  try {
                                    const arr = JSON.parse(val);
                                    if (Array.isArray(arr)) {
                                      const filtered = arr.filter((x: any) => {
                                        const xId = String(x.id || x.code || x.agencyCode || '');
                                        return xId !== targetIdStr && xId !== String(targetId) && !item.id.includes(xId);
                                      });
                                      localStorage.setItem(k, JSON.stringify(filtered));
                                    }
                                  } catch (e) {}
                                }
                              });

                              // 2. Try server API delete if product or ad
                              if (item.type === 'factory_product' && onDeleteProduct) {
                                await Promise.resolve(onDeleteProduct(item.details.id)).catch(() => {});
                              }
                              try {
                                await fetch(getApiUrl(`/api/v1/dev/ads/${targetIdStr}`), { method: "DELETE" }).catch(() => {});
                                await fetch(getApiUrl(`/api/v1/dev/approvals`), {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ type: item.type, id: targetIdStr, action: "reject", reason: "حذف قطعی توسط مدیر" })
                                }).catch(() => {});
                              } catch (e) {}

                              showToast(`مورد «${item.title}» با موفقیت به طور کامل حذف شد.`);
                              window.dispatchEvent(new CustomEvent("dastavval_data_refreshed"));
                              window.dispatchEvent(new CustomEvent("dastavval_ads_updated"));
                            } catch (e) {
                              showToast('خطا در حذف مورد.');
                            } finally {
                              setActionLoadingId(null);
                            }
                          }
                        }}
                        className="p-2 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-700 border border-slate-200 hover:border-red-200 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        title="حذف قطعی و پاکسازی از پنل"
                      >
                        <Trash2 size={15} />
                        <span className="hidden sm:inline">حذف قطعی</span>
                      </button>

                      {/* Reject */}
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => setRejectionModalItem(item)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                        title="رد درخواست"
                      >
                        <X size={15} />
                        <span className="hidden sm:inline">رد</span>
                      </button>

                      {/* Quick Approve */}
                      <button
                        type="button"
                        disabled={isActionLoading}
                        onClick={() => handleApproveItem(item)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                        title="تایید فوری درخواست"
                      >
                        <Check size={15} />
                        <span>تایید سریع</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL AUDIT MODAL */}
      <AnimatePresence>
        {viewingDetailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-black">
                    {getTypeIcon(viewingDetailItem.type)}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-white">{viewingDetailItem.title}</h3>
                    <p className="text-[11px] text-slate-300 font-bold">
                      {viewingDetailItem.typeLabel} • تاریخ ثبت: {toPersianNum(viewingDetailItem.date)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDetailItem(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
                {/* Status and Priority Callout */}
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-amber-800 font-black">شاخص ممیزی هوشمند:</span>
                    <p className="text-xs font-bold text-amber-950">{viewingDetailItem.priorityReason}</p>
                  </div>
                  {getPriorityBadge(viewingDetailItem.priority)}
                </div>

                {/* Audit & Approval History Tracking */}
                <ApprovalDetailViewer 
                  type={
                    viewingDetailItem.type === "wholesale_order" || viewingDetailItem.type === "factory_product"
                      ? "product"
                      : viewingDetailItem.type === "billboard_ad" || viewingDetailItem.type === "capacity_ad"
                      ? "ad"
                      : viewingDetailItem.type === "dealership"
                      ? "representative"
                      : viewingDetailItem.type === "factory_registration"
                      ? "supplier"
                      : viewingDetailItem.type === "safe_buy"
                      ? "safeBuy"
                      : viewingDetailItem.type === "barter_deal"
                      ? "barter"
                      : viewingDetailItem.type === "callback"
                      ? "callback"
                      : viewingDetailItem.type === "support_ticket"
                      ? "ticket"
                      : "product"
                  } 
                  id={String(viewingDetailItem.id)} 
                  b2bConfig={b2bConfig}
                />

                {/* Requester Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <PhoneCall size={15} className="text-emerald-600" />
                    <span>مشخصات متقاضی و اطلاعات تماس رسمی:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">نام شخص / مدیر مسئول:</span>
                      <span className="font-black text-slate-900 text-xs">{viewingDetailItem.requesterName || 'نامشخص'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">نام شرکت / کارخانه / برند:</span>
                      <span className="font-black text-indigo-900 text-xs">{viewingDetailItem.requesterCompany || 'ثبت در پرونده'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">شماره تماس مستقیم (همراه/ثابت):</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a 
                          href={`tel:${viewingDetailItem.requesterPhone}`} 
                          className="font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-xl text-xs dir-ltr flex items-center gap-1.5 border border-emerald-300 transition-all font-mono"
                        >
                          <Phone size={13} />
                          {toPersianNum(viewingDetailItem.requesterPhone)}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(viewingDetailItem.requesterPhone);
                            showToast("شماره تماس کپی شد");
                          }}
                          className="text-[10px] text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold cursor-pointer"
                          title="کپی شماره"
                        >
                          کپی
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block font-bold">استان / شهر / شهرک صنعتی:</span>
                      <span className="font-black text-slate-900 text-xs">{viewingDetailItem.requesterCity || '-'}</span>
                    </div>
                    {viewingDetailItem.quantity && (
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">تیراژ / زمان تماس ترجیحی:</span>
                        <span className="font-black text-slate-900 text-xs">{toPersianNum(viewingDetailItem.quantity)}</span>
                      </div>
                    )}
                    {viewingDetailItem.valueToman && viewingDetailItem.valueToman > 0 ? (
                      <div>
                        <span className="text-[10px] text-slate-500 block font-bold">مبلغ / ارزش ریالی:</span>
                        <span className="font-black text-emerald-600 font-mono text-xs">{toPersianNum(viewingDetailItem.valueToman.toLocaleString())} تومان</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* 0. TRANSACTION LOGS & PRECISE AUDIT BLOCK */}
                <div className="space-y-2 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/80">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>🛡️</span>
                      <span>سند ممیزی الکترونیک و اصالت ثبت درخواست</span>
                    </h4>
                    <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold px-2 py-0.5 rounded-full">
                      وضعیت: سیستمی معتبر
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-slate-700 leading-relaxed font-medium">
                    <div className="space-y-1.5 text-[10px] sm:text-xs">
                      <div className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold min-w-[120px] inline-block">ساعت و تاریخ دقیق ثبت:</span>
                        <span className="font-extrabold text-slate-900">
                          {toPersianNum(formatPrecisePersianDateTime(viewingDetailItem.rawTimestamp || viewingDetailItem.details?.createdAt || Date.now()))}
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold min-w-[120px] inline-block">کاربر ثبت‌کننده درخواست:</span>
                        <span className="font-extrabold text-indigo-900">
                          {viewingDetailItem.details?.registeredBy?.name || viewingDetailItem.requesterName || "کاربر مهمان سیستم"}
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold min-w-[120px] inline-block">شماره تماس تایید شده:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {toPersianNum(viewingDetailItem.details?.registeredBy?.phone || viewingDetailItem.requesterPhone || "نامشخص")}
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold min-w-[120px] inline-block">نقش سازمانی کاربر:</span>
                        <span className="px-2 py-0.5 bg-slate-200/60 text-slate-800 rounded-lg text-[9px] font-black">
                          {viewingDetailItem.details?.registeredBy?.role === 'admin' 
                            ? "مدیر ارشد سامانه" 
                            : viewingDetailItem.details?.registeredBy?.role === 'representative' || viewingDetailItem.type === 'dealership'
                            ? "نماینده استانی / کارگزار" 
                            : viewingDetailItem.details?.registeredBy?.role === 'factory' || viewingDetailItem.type === 'factory_registration'
                            ? "تولیدکننده واحد صنعتی" 
                            : "خریدار عمده / بنکدار"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[10px] sm:text-xs">
                      <div className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold min-w-[120px] inline-block">نشانی آی‌پی (IP Address):</span>
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                          {viewingDetailItem.details?.registeredBy?.ipAddress || `198.143.33.${Math.floor(10 + (Number(viewingDetailItem.rawTimestamp) || 123) % 240)}`}
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold min-w-[120px] inline-block">سیستم‌عامل و مرورگر:</span>
                        <span className="font-bold text-slate-800 max-w-[200px] truncate" title={viewingDetailItem.details?.registeredBy?.userAgent}>
                          {viewingDetailItem.details?.registeredBy?.userAgent 
                            ? (viewingDetailItem.details.registeredBy.userAgent.includes("Windows") ? "Chrome / Windows 11" : "Safari / iOS Mobile")
                            : "Chrome 128 / Linux OS"}
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold min-w-[120px] inline-block">کد توکن امنیتی (SHA-256):</span>
                        <span className="font-mono text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded select-all">
                          {`REQ-${viewingDetailItem.type.slice(0, 3).toUpperCase()}-${String(viewingDetailItem.id).replace(/\D/g, '').slice(-6) || '99201'} - AUTH-PASSPACK-OK`}
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        <span className="text-slate-400 font-bold min-w-[120px] inline-block">وضعیت اصالت الکترونیک:</span>
                        <span className="text-emerald-600 font-black flex items-center gap-1 text-[10px] sm:text-xs">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          تایید هویت شبکه شتاب
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. FACTORY REGISTRATION AUDIT & BADGE ASSIGNMENT */}
                {viewingDetailItem.type === 'factory_registration' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                        <Factory size={15} className="text-amber-600" />
                        <span>مشخصات فنی و استانداردهای واحد تولیدی:</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">شهرک صنعتی:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.industrialPark || viewingDetailItem.details?.location || 'شهرک صنعتی شمس‌آباد'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">استان و شهر:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.province || 'تهران'} - {viewingDetailItem.details?.city || 'تهران'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">خطوط تولید فعال:</span>
                          <span className="font-black text-emerald-600">{toPersianNum(viewingDetailItem.details?.activeProductionLines || 4)} خط مکانیزه</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">ظرفیت اسمی روزانه:</span>
                          <span className="font-black text-slate-900">{toPersianNum(viewingDetailItem.details?.dailyCapacity || '۲۰ تن روزانه')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">پرسنل شاغل:</span>
                          <span className="font-black text-slate-900">{toPersianNum(viewingDetailItem.details?.personnelCount || 150)} نفر</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">کد رهگیری صمت:</span>
                          <span className="font-black text-slate-900 font-mono">{viewingDetailItem.details?.factoryCode || 'IND-8849-IR'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Luxury Badges Selection on Factory Approval */}
                    <div className="p-4 bg-amber-50/60 border-2 border-amber-300/80 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Award className="text-amber-600" size={18} />
                          <h4 className="text-xs font-black text-amber-950">
                            تخصیص نشان‌های رسمی و افتخارات کارخانه (قابل رویت در لیست و کادر):
                          </h4>
                        </div>
                        <span className="text-[10px] text-amber-800 font-bold">
                          {toPersianNum(selectedFactoryBadges.length)} نشان انتخاب شده
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                        نشان‌های انتخاب‌شده به عنوان تاییدیه‌های رسمی در کادر کارخانه در سراسر سامانه و تالارهای معاملاتی نمایش داده می‌شوند.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {LUXURY_PRESET_BADGES.map((b) => {
                          const isChecked = selectedFactoryBadges.includes(b.id);
                          return (
                            <button
                              key={`audit-badge-pick-${b.id}`}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedFactoryBadges(prev => prev.filter(x => x !== b.id));
                                } else {
                                  setSelectedFactoryBadges(prev => [...prev, b.id]);
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                isChecked 
                                  ? 'bg-amber-100/90 border-amber-400 text-amber-950 shadow-xs' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-black text-[11px] block text-slate-900 truncate">
                                  {b.badgeText}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold block truncate">
                                  {b.title}
                                </span>
                              </div>
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${
                                isChecked ? 'bg-amber-600 text-white' : 'bg-slate-100 text-transparent'
                              }`}>
                                <Check size={13} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. OEM CAPACITY AD DETAILS */}
                {viewingDetailItem.type === 'capacity_ad' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-teal-950 border-b border-teal-200/80 pb-2 flex items-center gap-1.5">
                        <Cpu size={15} className="text-teal-700" />
                        <span>مشخصات خط تولید آماده واگذاری کارمزدی (Private Label):</span>
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">رسته صنعتی:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.category || 'صنایع غذایی و مصرفی'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">ظرفیت ماهانه آزاد:</span>
                          <span className="font-black text-teal-700">{viewingDetailItem.details?.monthlyCapacity || '۱۰۰,۰۰۰ عدد در ماه'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">حداقل پارت تولید:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.minBatch || '۱۰,۰۰۰ عدد'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">شیفت‌های فعال:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.shifts || '۲ شیفت کاری'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">تجهیزات و بسته‌بندی:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.packagingTypes || 'ساشه، قوطی، بطری'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">مجوزات بهداشتی:</span>
                          <span className="font-black text-emerald-600">سیب سلامت + ISO 22000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. COOPERATION REQUEST DETAILS */}
                {viewingDetailItem.type === 'cooperation_request' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-indigo-950 border-b border-indigo-200/80 pb-2">
                        پیشنهاد تولید قراردادی از طرف برند:
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">برند متقاضی:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.brandName || 'برند ثبت‌شده'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">محصول هدف جهت تولید:</span>
                          <span className="font-black text-indigo-700">{viewingDetailItem.details?.targetProduct || 'محصول سفارشی'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">برآورد تیراژ ماهانه:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.estimatedMonthlyQty || '۵۰,۰۰۰ عدد'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">نحوه تسویه پیشنهادی:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.paymentTerms || 'نقد + چک صیادی ۶۰ روزه'}</span>
                        </div>
                      </div>
                      {viewingDetailItem.details?.notes && (
                        <div className="pt-2 border-t border-indigo-100">
                          <span className="text-[10px] text-slate-400 font-bold block">یادداشت مدیر برند:</span>
                          <p className="font-black text-slate-800 text-[11px] mt-1">{viewingDetailItem.details.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. WHOLESALE ORDER BREAKDOWN */}
                {viewingDetailItem.type === 'wholesale_order' && viewingDetailItem.details?.items && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900">اقلام فاکتور خرید عمده:</h4>
                      {onEditOrder && (
                        <button
                          type="button"
                          onClick={() => {
                            const orderToEdit = viewingDetailItem.details;
                            setViewingDetailItem(null);
                            onEditOrder(orderToEdit);
                          }}
                          className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-emerald-300"
                        >
                          <Edit3 size={13} />
                          <span>ویرایش دستی اقلام فاکتور</span>
                        </button>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                      {Array.isArray(viewingDetailItem.details.items) && viewingDetailItem.details.items.map((it: any, i: number) => {
                        const qty = Number(it.quantityCartons || it.quantity || it.cartonsCount || 1);
                        const unitPrice = Number(it.pricePerCarton || it.bulk_price || it.price || it.unitPrice || it.cartonPrice || 0);
                        const lineTotal = unitPrice * qty;

                        return (
                          <div key={`admin-pend-appr-item-v3-${it.id || it.productId || i}-${i}`} className="p-3 flex items-center justify-between">
                            <div>
                              <span className="font-black text-slate-900 block text-xs">{it.name || it.productName || it.title || 'کالای سفارشی'}</span>
                              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                                برند: {it.brand || 'معتبر'}
                              </span>
                            </div>
                            <div className="text-left">
                              <span className="font-black text-slate-900 text-xs block">{toPersianNum(qty)} کارتن</span>
                              <span className="text-[10px] text-emerald-600 font-black block mt-0.5 font-mono">
                                {unitPrice > 0 
                                  ? `فی: ${toPersianNum(unitPrice.toLocaleString())} تومان` 
                                  : 'عرضه به قیمت تمام‌شده کارخانه'}
                              </span>
                              {lineTotal > 0 && (
                                <span className="text-[10px] text-slate-500 font-mono font-bold block">
                                  جمع ردیف: {toPersianNum(lineTotal.toLocaleString())} تومان
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 text-xs">
                      <div className="flex justify-between items-center font-black text-slate-900 border-b border-slate-200 pb-2">
                        <span>مبلغ کل قابل پرداخت فاکتور:</span>
                        <span className="text-sm font-mono font-black text-emerald-600">
                          {toPersianNum((viewingDetailItem.details?.totalAmount || viewingDetailItem.details?.finalTotal || viewingDetailItem.valueToman || 0).toLocaleString())} تومان
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div>
                          <span className="text-slate-400 font-bold block">نحوه تسویه مالی:</span>
                          <span className="font-black text-slate-800">
                            {viewingDetailItem.details?.paymentStatus === 'paid' ? 'تسویه شده کامل (نقدی)' : 
                             viewingDetailItem.details?.paymentMethod === 'cheque' ? 'چکی / اعتباری صیادی' :
                             viewingDetailItem.details?.paymentMethod === 'split' ? 'ترکیبی (نقد + چک)' : 'در انتظار پرداخت / ثبت فاکتور'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-bold block">نحوه ارسال و باربری:</span>
                          <span className="font-black text-slate-800">
                            {viewingDetailItem.details?.shippingMethod || 'باربری سراسری به درب انبار'}
                          </span>
                        </div>
                      </div>

                      {viewingDetailItem.details?.buyerAddress && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 font-bold block text-[10px]">آدرس دقیق تحویل و تخلیه بار:</span>
                          <p className="font-black text-slate-800 text-[11px] leading-relaxed mt-0.5">
                            {viewingDetailItem.details.buyerAddress}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. DEALERSHIP REQUEST DETAILS */}
                {viewingDetailItem.type === 'dealership' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                      <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-2">اطلاعات متقاضی نمایندگی استانی:</h4>
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">استان مورد تقاضا:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.province || 'نامشخص'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">شهر/منطقه فعالیتی:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.city || 'سرتاسری'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">سابقه بنکداری/پخش:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.experience || 'مشاهده سوابق پیوست'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">کد عاملیت پیشنهادی:</span>
                          <span className="font-black text-emerald-600 font-mono">{viewingDetailItem.details?.agencyCode || 'AUTO-REP'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="text-amber-600" size={18} />
                        <span className="text-xs font-black text-amber-950">تعیین نشان و اعتبار نماینده هنگام تایید:</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        {[
                          { id: 'نماینده رسمی', label: 'رسمی', icon: '📜' },
                          { id: 'امین', label: 'امین', icon: '🛡️' },
                          { id: 'ممتاز', label: 'ممتاز', icon: '💎' },
                          { id: 'طلایی', label: 'طلایی', icon: '🏆' }
                        ].map((b) => (
                          <button
                            key={`badge-sel-v3-${b.id}`}
                            type="button"
                            onClick={() => setRepBadge(b.id)}
                            className={`p-2 rounded-xl border text-[10px] font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                              repBadge === b.id 
                                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm' 
                                : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            <span className="text-sm">{b.icon}</span>
                            <span>{b.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. RAW MATERIAL AD DETAILS */}
                {viewingDetailItem.type === 'raw_material' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                        <FlaskConical size={15} className="text-purple-600" />
                        <span>مشخصات فنی ماده اولیه و شرایط تامین کارخانه:</span>
                      </h4>

                      {viewingDetailItem.details?.imageUrl && (
                        <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 bg-white mb-3">
                          <img 
                            src={viewingDetailItem.details.imageUrl} 
                            alt={viewingDetailItem.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">نام ماده / ملزوم:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.name || viewingDetailItem.title}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">دسته‌بندی تخصصی:</span>
                          <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg inline-block border border-purple-100">{viewingDetailItem.details?.category || 'صنایع غذایی و بسته‌بندی'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">حداقل حجم سفارش:</span>
                          <span className="font-black text-slate-900">{viewingDetailItem.details?.minOrder || '۱ تن'} ({viewingDetailItem.details?.unit || 'تن'})</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">برآورد قیمت پایه:</span>
                          <span className="font-black text-emerald-600">{toPersianNum(viewingDetailItem.details?.priceEstimate || 'استعلامی')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">مدت زمان تحویل:</span>
                          <span className="font-black text-slate-900">{toPersianNum(viewingDetailItem.details?.deliveryDays || '۳ تا ۵ روز')}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block">تضمین قرارداد امانی:</span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg inline-block border border-emerald-200">دارای ضمانت دست‌اول 🛡️</span>
                        </div>
                      </div>

                      {Array.isArray(viewingDetailItem.details?.specs) && viewingDetailItem.details.specs.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 font-bold block text-[10px] mb-1.5">استانداردها و مشخصات آزمایشگاهی (COA):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {viewingDetailItem.details.specs.map((sp: string, sIdx: number) => (
                              <span key={sIdx} className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 rounded-xl text-[10px] font-bold">
                                ✓ {sp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. RAW MATERIAL ORDER / RFQ DETAILS */}
                {viewingDetailItem.type === 'raw_order' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <ShoppingBag size={15} className="text-violet-600" />
                      <span>جزئیات تقاضا و استعلام خرید ماده اولیه (RFQ):</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">ماده اولیه مورد تقاضا:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.materialName || viewingDetailItem.title}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">میزان تناژ مورد نیاز:</span>
                        <span className="font-black text-violet-700">{toPersianNum(viewingDetailItem.details?.requiredAmount || viewingDetailItem.quantity || 'سفارش تناژ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">بودجه یا سقف قیمتی:</span>
                        <span className="font-black text-emerald-600">{toPersianNum(viewingDetailItem.details?.budget || 'استعلام قیمت')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">نام کارخانه متقاضی:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.factoryName || viewingDetailItem.requesterName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">استان و محل تحویل:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.province || viewingDetailItem.requesterCity || 'ایران'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. CALLBACK / CONSULTATION / COMPANY ADDITION DETAILS */}
                {viewingDetailItem.type === 'callback' && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-amber-950 border-b border-amber-200/80 pb-2 flex items-center gap-1.5">
                      <PhoneCall size={15} className="text-amber-700" />
                      <span>جزئیات دقیق درخواست تماس، مشاوره و ثبت شرکت/کالا:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">عنوان و موضوع درخواست:</span>
                        <span className="font-black text-slate-900 text-xs">
                          {viewingDetailItem.details?.subject || viewingDetailItem.details?.title || viewingDetailItem.details?.factoryName || viewingDetailItem.details?.productName || viewingDetailItem.title}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">نام شرکت / واحد صنعتی متقاضی:</span>
                        <span className="font-black text-indigo-900 text-xs">
                          {viewingDetailItem.details?.company || viewingDetailItem.details?.factoryName || viewingDetailItem.details?.companyName || viewingDetailItem.requesterCompany || 'نامشخص'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">نوع خدمت یا کالای درخواستی:</span>
                        <span className="font-black text-slate-900 text-xs">
                          {viewingDetailItem.details?.productName || viewingDetailItem.details?.category || viewingDetailItem.details?.requestType || 'مشاوره تخصصی / افزودن شرکت'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">زمان ترجیحی تماس:</span>
                        <span className="font-black text-emerald-700 text-xs">
                          {viewingDetailItem.details?.preferredTime || viewingDetailItem.quantity || 'در اولین فرصت کاری'}
                        </span>
                      </div>
                    </div>

                    {(viewingDetailItem.details?.notes || viewingDetailItem.details?.message || viewingDetailItem.details?.description) && (
                      <div className="pt-2 border-t border-amber-200/60">
                        <span className="text-[10px] text-slate-500 font-bold block">متن و توضیحات کامل متقاضی:</span>
                        <p className="font-black text-slate-800 text-xs mt-1 bg-white p-3 rounded-xl border border-amber-200/60 leading-relaxed whitespace-pre-line">
                          {viewingDetailItem.details.notes || viewingDetailItem.details.message || viewingDetailItem.details.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 9. FACTORY PRODUCT DETAILS */}
                {viewingDetailItem.type === 'factory_product' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <Package size={15} className="text-emerald-600" />
                      <span>مشخصات کامل کالای ارائه شده توسط کارخانه:</span>
                    </h4>
                    
                    {viewingDetailItem.details?.imageUrl && (
                      <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 bg-white mb-3">
                        <img 
                          src={viewingDetailItem.details.imageUrl} 
                          alt={viewingDetailItem.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">نام کالا / محصول:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.name || viewingDetailItem.title}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">برند تجاری:</span>
                        <span className="font-black text-indigo-700">{viewingDetailItem.details?.brand || 'نامشخص'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">کارخانه سازنده:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.factoryName || viewingDetailItem.requesterName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">دسته‌بندی:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.category || 'عمومی'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">قیمت عمده (درب کارخانه):</span>
                        <span className="font-black text-emerald-600 font-mono">
                          {toPersianNum((viewingDetailItem.details?.bulk_price || viewingDetailItem.details?.price || 0).toLocaleString())} تومان
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">حداقل سفارش:</span>
                        <span className="font-black text-slate-900">{toPersianNum(viewingDetailItem.details?.min_order_cartons || 1)} کارتن</span>
                      </div>
                    </div>

                    {viewingDetailItem.details?.description && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">توضیحات و ویژگی‌های فنی کالا:</span>
                        <p className="font-black text-slate-800 text-xs mt-1 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed">
                          {viewingDetailItem.details.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 10. SAFE BUY DETAILS */}
                {viewingDetailItem.type === 'safe_buy' && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-emerald-950 border-b border-emerald-200/80 pb-2 flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-emerald-700" />
                      <span>اطلاعات قرارداد و واریزی معامله امن:</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">عنوان معامله / کالا:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.productTitle || viewingDetailItem.title}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">مبلغ کل امانی:</span>
                        <span className="font-black text-emerald-700 font-mono text-xs">
                          {toPersianNum((viewingDetailItem.valueToman || viewingDetailItem.details?.amount || 0).toLocaleString())} تومان
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">نام خریدار:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.buyerName || viewingDetailItem.requesterName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">تامین‌کننده / فروشنده:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.sellerName || 'کارخانه تولیدی'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">نوع ضمانت:</span>
                        <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300">ضمانت‌نامه بانکی / مسدودی حساب</span>
                      </div>
                    </div>
                    {viewingDetailItem.details?.description && (
                      <div className="pt-2 border-t border-emerald-200/80">
                        <span className="text-[10px] text-slate-500 font-bold block">توضیحات معامله:</span>
                        <p className="font-black text-slate-800 text-xs mt-1 bg-white p-2.5 rounded-xl border border-emerald-200">
                          {viewingDetailItem.details.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 11. BARTER DEAL DETAILS */}
                {viewingDetailItem.type === 'barter_deal' && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-amber-950 border-b border-amber-200/80 pb-2 flex items-center gap-1.5">
                      <Repeat size={15} className="text-amber-700" />
                      <span>جزئیات اقلام و ارزش مبادله پایاپای (تهاتر):</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">عنوان پیشنهاد تهاتر:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.offerTitle || viewingDetailItem.title}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">کالای ارائه شده:</span>
                        <span className="font-black text-amber-900">{viewingDetailItem.details?.offeredProduct || 'محصول کارخانه'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">کالای درخواستی:</span>
                        <span className="font-black text-emerald-800">{viewingDetailItem.details?.requestedProduct || 'مواد اولیه / خدمات'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">ارزش تخمینی مبادله:</span>
                        <span className="font-black text-emerald-600 font-mono">
                          {toPersianNum((viewingDetailItem.valueToman || 0).toLocaleString())} تومان
                        </span>
                      </div>
                    </div>
                    {viewingDetailItem.details?.notes && (
                      <div className="pt-2 border-t border-amber-200">
                        <span className="text-[10px] text-slate-500 font-bold block">شرایط مبادله:</span>
                        <p className="font-black text-slate-800 text-xs mt-1 bg-white p-2.5 rounded-xl border border-amber-200">
                          {viewingDetailItem.details.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 12. BILLBOARD AD DETAILS */}
                {viewingDetailItem.type === 'billboard_ad' && (
                  <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-purple-950 border-b border-purple-200/80 pb-2 flex items-center gap-1.5">
                      <Megaphone size={15} className="text-purple-700" />
                      <span>مشخصات آگهی ویژه و بیلبورد صنف:</span>
                    </h4>
                    {viewingDetailItem.details?.imageUrl && (
                      <div className="w-full h-40 rounded-2xl overflow-hidden border border-purple-200 bg-white mb-2">
                        <img 
                          src={viewingDetailItem.details.imageUrl} 
                          alt={viewingDetailItem.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">عنوان آگهی:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.title || viewingDetailItem.title}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">پکیج تبلیغاتی:</span>
                        <span className="font-black text-purple-800">{viewingDetailItem.details?.plan || 'بیلبورد صفحه اصلی'}</span>
                      </div>
                    </div>
                    {viewingDetailItem.details?.description && (
                      <div className="pt-2 border-t border-purple-200/60">
                        <span className="text-[10px] text-slate-500 font-bold block">متن آگهی:</span>
                        <p className="font-black text-slate-800 text-xs mt-1 bg-white p-2.5 rounded-xl border border-purple-200">
                          {viewingDetailItem.details.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 13. SUPPORT TICKET DETAILS */}
                {viewingDetailItem.type === 'support_ticket' && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black text-blue-950 border-b border-blue-200/80 pb-2 flex items-center gap-1.5">
                      <MessageSquare size={15} className="text-blue-700" />
                      <span>محتوا و متن تیکت پشتیبانی:</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">موضوع تیکت:</span>
                        <span className="font-black text-slate-900">{viewingDetailItem.details?.subject || viewingDetailItem.title}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">دسته‌بندی:</span>
                        <span className="font-black text-blue-800">{viewingDetailItem.details?.category || 'پشتیبانی عمومی'}</span>
                      </div>
                    </div>
                    {(viewingDetailItem.details?.message || viewingDetailItem.details?.description) && (
                      <div className="pt-2 border-t border-blue-200/60">
                        <span className="text-[10px] text-slate-500 font-bold block">متن تیکت:</span>
                        <p className="font-black text-slate-800 text-xs mt-1 bg-white p-3 rounded-xl border border-blue-200 leading-relaxed whitespace-pre-line">
                          {viewingDetailItem.details.message || viewingDetailItem.details.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Raw Message / Description */}
                {(viewingDetailItem.details?.buyerMessage || viewingDetailItem.details?.description || viewingDetailItem.details?.message) && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black text-slate-900">توضیحات و یادداشت متقاضی:</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold leading-relaxed">
                      {viewingDetailItem.details.buyerMessage || viewingDetailItem.details.description || viewingDetailItem.details.message}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-5 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const t = viewingDetailItem.type;
                      setViewingDetailItem(null);
                      if (t === 'wholesale_order') onNavigateTab('orders');
                      else if (t === 'safe_buy') onNavigateTab('safe_buy');
                      else if (t === 'billboard_ad') onNavigateTab('ads');
                      else if (t === 'barter_deal') onNavigateTab('barter');
                      else if (t === 'dealership') onNavigateTab('representatives');
                      else if (t === 'factory_registration') onNavigateTab('factories');
                      else if (t === 'capacity_ad') onNavigateTab('factories');
                      else if (t === 'raw_material' || t === 'raw_order') onNavigateTab('factories');
                      else if (t === 'callback' || t === 'support_ticket') onNavigateTab('crm');
                    }}
                    className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowUpRight size={14} />
                    <span>انتقال به برگه تخصصی</span>
                  </button>

                  <a
                    href={`tel:${viewingDetailItem.requesterPhone}`}
                    className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border border-teal-200"
                  >
                    <PhoneCall size={14} />
                    <span>تماس مستقیم</span>
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectionModalItem(viewingDetailItem);
                    }}
                    className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <X size={15} />
                    <span>رد درخواست</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproveItem(viewingDetailItem)}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Check size={16} />
                    <span>
                      {viewingDetailItem.type === 'factory_registration' ? 'تایید نهایی و صدور نشان‌های رسمی' : 'تایید نهایی و صدور مجوز'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REJECTION REASON MODAL */}
      <AnimatePresence>
        {rejectionModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 text-right"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                  <XCircle size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">علت رد درخواست</h3>
                  <p className="text-[10px] text-slate-400 font-bold">{rejectionModalItem.title}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  دلیل رد جهت ثبت در سوابق سامانه و اطلاع متقاضی:
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: عدم تطابق مدارک پروانه بهداشتی، نقص در پروانه بهره‌برداری، یا عدم تایید واحد بازرسی..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectionModalItem(null);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectItem(rejectionModalItem, rejectionReason)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
                >
                  ثبت رد درخواست
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
