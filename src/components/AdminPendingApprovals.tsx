import { useState, useMemo } from "react";
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
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ApprovalType = 
  | 'wholesale_order'
  | 'safe_buy'
  | 'billboard_ad'
  | 'barter_deal'
  | 'dealership'
  | 'callback'
  | 'support_ticket'
  | 'factory_registration';

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
}

interface AdminPendingApprovalsProps {
  orders: any[];
  onUpdateOrderStatus: (orderId: string, nextStatus: string) => Promise<void>;
  safeBuyRequests: any[];
  onUpdateSafeBuyStatus: (id: string, firebaseId: string | undefined, status: 'approved' | 'rejected' | 'pending') => Promise<void>;
  sponsoredAds: any[];
  onUpdateAdStatus: (adId: string, status: 'approved' | 'rejected' | 'pending', rejectionReason?: string) => void;
  barterDeals: any[];
  onUpdateBarterStatus: (id: string, newStatus: string) => void;
  representativesList: any[];
  onUpdateRepStatus: (id: string, isApproved: boolean) => void;
  suppliersList: any[];
  onUpdateSupplierStatus: (id: string, status: 'active' | 'suspended' | 'pending') => Promise<void>;
  callbackRequests: any[];
  onUpdateCallback: (id: string, status: 'pending' | 'called' | 'archived', notes?: string) => Promise<void>;
  supportTickets: any[];
  onUpdateTicketStatus: (id: string, newStatus: string) => Promise<void>;
  onNavigateTab: (tab: string, param?: any) => void;
}

export default function AdminPendingApprovals({
  orders = [],
  onUpdateOrderStatus,
  safeBuyRequests = [],
  onUpdateSafeBuyStatus,
  sponsoredAds = [],
  onUpdateAdStatus,
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
  onNavigateTab
}: AdminPendingApprovalsProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<'priority' | 'date_desc' | 'value_desc'>('priority');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [viewingDetailItem, setViewingDetailItem] = useState<PendingItem | null>(null);
  const [rejectionModalItem, setRejectionModalItem] = useState<PendingItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // 1. Normalize and Aggregate all pending items from across the platform
  const aggregatedPendingItems: PendingItem[] = useMemo(() => {
    const items: PendingItem[] = [];

    // A. Wholesale Orders needing review/approval
    for (const ord of orders) {
      const isPendingOrder = 
        !ord.status || 
        ord.status === 'order_received' || 
        ord.status === 'pending' || 
        ord.status === 'awaiting_approval';

      if (isPendingOrder) {
        const totalAmount = Number(ord.finalTotal || ord.total || 0);
        let priority: PriorityLevel = 'high';
        let reason = 'سفارش خرید عمده جدید';

        if (totalAmount > 100000000) {
          priority = 'critical';
          reason = 'سفارش تناژ سنگین (بالای ۱۰۰ میلیون تومان)';
        } else if (totalAmount > 30000000) {
          priority = 'high';
          reason = 'ارزش مالی بالا نیازمند تخصیص سریع انبار';
        } else {
          priority = 'medium';
          reason = 'سفارش خرید استاندارد';
        }

        const rawDate = ord.createdAt?.seconds ? ord.createdAt.seconds * 1000 : (ord.createdAt ? new Date(ord.createdAt).getTime() : Date.now());

        items.push({
          id: `order_${ord.id}`,
          type: 'wholesale_order',
          typeLabel: 'سفارش خرید عمده',
          title: `سفارش فاکتور #${ord.id.slice(-6).toUpperCase()} (${(ord.items || []).length} قلم کالا)`,
          requesterName: ord.customerName || ord.buyerName || ord.userFullName || 'مشتری بنکداری',
          requesterPhone: ord.customerPhone || ord.buyerPhone || ord.phone || 'ثبت نشده',
          requesterCompany: ord.companyName || ord.storeName || 'فروشگاه / بنکداری',
          requesterCity: ord.city || ord.destinationCity || ord.shippingAddress?.split('،')[0] || 'تهران',
          valueToman: totalAmount,
          quantity: `${(ord.items || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)} کارتن / بسته`,
          date: ord.date || new Date(rawDate).toLocaleDateString('fa-IR'),
          rawTimestamp: rawDate,
          priority,
          priorityReason: reason,
          details: ord,
          originalStatus: ord.status || 'order_received'
        });
      }
    }

    // B. Safe Buy Requests (خرید امن کف بازار)
    for (const sb of safeBuyRequests) {
      if (sb.status === 'pending') {
        const rawDate = sb.createdAt ? new Date(sb.createdAt).getTime() : Date.now() - 3600000;
        const numPrice = typeof sb.wholesalePrice === 'string' 
          ? parseInt(sb.wholesalePrice.replace(/[^0-9]/g, '')) || 0 
          : Number(sb.wholesalePrice) || 0;

        items.push({
          id: `safebuy_${sb.id}`,
          type: 'safe_buy',
          typeLabel: 'خرید امن کف بازار',
          title: `درخواست تامین مستقیم: ${sb.productTitle || sb.productName || 'کالای سفارشی'}`,
          requesterName: sb.buyerName || 'خریدار عمده کف بازار',
          requesterPhone: sb.buyerPhone || '',
          requesterCity: sb.buyerCity || 'انبار متقاضی',
          valueToman: numPrice,
          quantity: sb.quantity || 'سفارش عمده',
          date: sb.date || new Date(rawDate).toLocaleDateString('fa-IR'),
          rawTimestamp: rawDate,
          priority: 'high',
          priorityReason: 'درخواست خرید امن با ودیعه نقدی امانی',
          details: sb,
          originalStatus: sb.status
        });
      }
    }

    // C. Sponsored Ads & Billboard items pending review
    for (const ad of sponsoredAds) {
      if (ad.status === 'pending') {
        const rawDate = ad.createdAt ? new Date(ad.createdAt).getTime() : Date.now() - 7200000;
        let priority: PriorityLevel = 'high';
        if (ad.category === 'liquid' || ad.category === 'under_market') {
          priority = 'critical';
        }

        items.push({
          id: `ad_${ad.id}`,
          type: 'billboard_ad',
          typeLabel: 'آگهی تالار کف بازار',
          title: `آگهی فروش مازاد: ${ad.title}`,
          requesterName: ad.sellerName || ad.factoryName || 'تولیدکننده / بنکدار',
          requesterPhone: ad.sellerPhone || ad.phone || 'ثبت در آگهی',
          requesterCompany: ad.factoryName || 'کارخانه صنایع غذایی',
          requesterCity: ad.city || ad.province || 'انبار کارخانه',
          valueToman: Number(ad.totalValue || ad.price || 0),
          quantity: ad.quantity || ad.packCount || 'موجودی انبار',
          date: ad.date || new Date(rawDate).toLocaleDateString('fa-IR'),
          rawTimestamp: rawDate,
          priority,
          priorityReason: ad.category === 'liquid' ? 'فروش فوری بار زیر قیمت' : 'بررسی اصالت پروانه و قیمت مصوب',
          details: ad,
          originalStatus: ad.status
        });
      }
    }

    // D. Barter Deals pending contract/document review
    for (const b of barterDeals) {
      if (b.status === 'در انتظار تایید مدارک' || b.status === 'pending') {
        const rawDate = Date.now() - 14400000;
        const totalVal = Number(b.totalMaterialValue || 0);

        items.push({
          id: `barter_${b.id}`,
          type: 'barter_deal',
          typeLabel: 'تهاتر و تامین مواد اولیه',
          title: `مبادله ${b.materialName} با ${b.requestedProductName}`,
          requesterName: b.supplierName || 'تامین‌کننده مواد اولیه',
          requesterPhone: b.supplierPhone || '',
          requesterCompany: b.factoryName,
          requesterCity: 'کارخانه طرف قرارداد',
          valueToman: totalVal,
          quantity: `${b.materialQty} ${b.materialUnit || 'کیلو'} ⇄ ${b.requestedQtyCartons || 0} کارتن`,
          date: b.dealDate || new Date(rawDate).toLocaleDateString('fa-IR'),
          rawTimestamp: rawDate,
          priority: totalVal > 5000000000 ? 'critical' : 'high',
          priorityReason: 'قرارداد کلان تامین مواد اولیه صنعتی کارخانجات',
          details: b,
          originalStatus: b.status
        });
      }
    }

    // E. Dealership & Representative applications pending
    for (const rep of representativesList) {
      if (rep.isApproved === false || rep.status === 'pending' || rep.status === 'pending_verification') {
        const rawDate = rep.createdAt ? new Date(rep.createdAt).getTime() : Date.now() - 86400000;

        items.push({
          id: `rep_${rep.id || rep.agencyCode}`,
          type: 'dealership',
          typeLabel: 'تقاضای اخذ نمایندگی',
          title: `عاملیت فروش انحصاری استان ${rep.city || rep.province || 'سراسری'}`,
          requesterName: rep.name || 'مدیر پخش استانی',
          requesterPhone: rep.phone || rep.tel || 'ثبت نشده',
          requesterCompany: rep.company || rep.agencyName || 'شرکت پخش مویرگی',
          requesterCity: rep.city || 'مرکز استان',
          quantity: rep.badge || 'عاملیت استانی',
          date: rep.date || new Date(rawDate).toLocaleDateString('fa-IR'),
          rawTimestamp: rawDate,
          priority: 'high',
          priorityReason: 'تخصیص انحصار فروش استانی و استعلام سوابق تجاری',
          details: rep,
          originalStatus: 'pending'
        });
      }
    }

    // F. Callback Requests pending
    for (const cb of callbackRequests) {
      if (cb.status === 'pending') {
        const rawDate = cb.createdAt?.seconds ? cb.createdAt.seconds * 1000 : (cb.createdAt ? new Date(cb.createdAt).getTime() : Date.now() - 1800000);

        items.push({
          id: `callback_${cb.id}`,
          type: 'callback',
          typeLabel: 'استعلام فوری و تماس',
          title: `درخواست تماس کارشناسی خرید: ${cb.phone}`,
          requesterName: cb.name || 'مدیر خرید بنکداری',
          requesterPhone: cb.phone,
          requesterCity: cb.city || 'نامشخص',
          quantity: cb.productInterest || 'استعلام قیمت روز کاتالوگ',
          date: new Date(rawDate).toLocaleDateString('fa-IR'),
          rawTimestamp: rawDate,
          priority: 'high',
          priorityReason: 'SLA تماس فوری زیر ۳۰ دقیقه با خریدار عمده',
          details: cb,
          originalStatus: cb.status
        });
      }
    }

    // G. Support Tickets pending / open
    for (const tk of supportTickets) {
      if (tk.status === 'pending' || tk.status === 'open' || !tk.status) {
        const rawDate = tk.createdAt?.seconds ? tk.createdAt.seconds * 1000 : (tk.createdAt ? new Date(tk.createdAt).getTime() : Date.now() - 3600000);

        items.push({
          id: `ticket_${tk.id}`,
          type: 'support_ticket',
          typeLabel: 'تیکت پشتیبانی و حل اختلاف',
          title: tk.subject || tk.title || 'پیگیری سفارش و باربری',
          requesterName: tk.userName || tk.name || 'کاربر سامانه',
          requesterPhone: tk.userPhone || tk.phone || 'درج شده در پنل',
          requesterCity: 'پیگیری لجستیک',
          quantity: tk.department || 'پشتیبانی فروش',
          date: new Date(rawDate).toLocaleDateString('fa-IR'),
          rawTimestamp: rawDate,
          priority: tk.priority === 'high' ? 'critical' : 'medium',
          priorityReason: tk.message?.slice(0, 50) || 'پیگیری وضعیت سفارش و بارنامه',
          details: tk,
          originalStatus: tk.status || 'pending'
        });
      }
    }

    // H. Factory/Supplier registrations pending approval
    for (const sup of suppliersList) {
      if (sup.status === 'pending' || !sup.status) {
        const rawDate = sup.createdAt?.seconds ? sup.createdAt.seconds * 1000 : (sup.createdAt ? new Date(sup.createdAt).getTime() : Date.now() - 43200000);
        
        items.push({
          id: `supplier_${sup.id || sup.email}`,
          type: 'factory_registration',
          typeLabel: 'ثبت‌نام کارخانه جدید',
          title: `تقاضای پنل تامین‌کننده: ${sup.company || sup.name}`,
          requesterName: sup.name || 'مدیر واحد تولیدی',
          requesterPhone: sup.phone || 'ثبت نشده',
          requesterCompany: sup.company || 'کارخانه صنایع غذایی',
          requesterCity: sup.city || 'نامشخص',
          quantity: sup.category || 'تولیدکننده',
          date: new Date(rawDate).toLocaleDateString('fa-IR'),
          rawTimestamp: rawDate,
          priority: 'high',
          priorityReason: 'احراز هویت واحد تولیدی و بررسی پروانه بهره‌برداری',
          details: sup,
          originalStatus: sup.status || 'pending'
        });
      }
    }

    return items;
  }, [orders, safeBuyRequests, sponsoredAds, barterDeals, representativesList, callbackRequests, supportTickets, suppliersList]);

  // 2. Metrics & KPI Summary
  const metrics = useMemo(() => {
    const total = aggregatedPendingItems.length;
    const critical = aggregatedPendingItems.filter(i => i.priority === 'critical').length;
    const high = aggregatedPendingItems.filter(i => i.priority === 'high').length;
    const medium = aggregatedPendingItems.filter(i => i.priority === 'medium' || i.priority === 'normal').length;
    
    const totalPipelineValue = aggregatedPendingItems.reduce((acc, curr) => acc + (curr.valueToman || 0), 0);

    return { total, critical, high, medium, totalPipelineValue };
  }, [aggregatedPendingItems]);

  // 3. Filter and Sort
  const filteredItems = useMemo(() => {
    return aggregatedPendingItems.filter(item => {
      // Type filter
      if (filterType !== 'all' && item.type !== filterType) return false;

      // Priority filter
      if (filterPriority !== 'all' && item.priority !== filterPriority) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchName = item.requesterName.toLowerCase().includes(q);
        const matchPhone = item.requesterPhone.toLowerCase().includes(q);
        const matchCompany = (item.requesterCompany || '').toLowerCase().includes(q);
        const matchCity = (item.requesterCity || '').toLowerCase().includes(q);
        if (!matchTitle && !matchName && !matchPhone && !matchCompany && !matchCity) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        const weight: Record<PriorityLevel, number> = { critical: 4, high: 3, medium: 2, normal: 1 };
        const diff = weight[b.priority] - weight[a.priority];
        if (diff !== 0) return diff;
        return (b.rawTimestamp || 0) - (a.rawTimestamp || 0);
      } else if (sortBy === 'value_desc') {
        return (b.valueToman || 0) - (a.valueToman || 0);
      } else {
        return (b.rawTimestamp || 0) - (a.rawTimestamp || 0);
      }
    });
  }, [aggregatedPendingItems, filterType, filterPriority, searchQuery, sortBy]);

  // Execute approval based on item type
  const handleApproveItem = async (item: PendingItem) => {
    setActionLoadingId(item.id);
    try {
      if (item.type === 'wholesale_order') {
        await onUpdateOrderStatus(item.details.id, 'payment_verified');
        showToast(`سفارش خرید عمده #${item.details.id.slice(-6)} با موفقیت تایید و به مرحله تخصیص انبار رفت.`);
      } else if (item.type === 'safe_buy') {
        await onUpdateSafeBuyStatus(item.details.id, item.details.firebaseId, 'approved');
        showToast(`درخواست خرید امن ${item.details.id} تایید شد.`);
      } else if (item.type === 'billboard_ad') {
        onUpdateAdStatus(item.details.id, 'approved');
        showToast(`آگهی "${item.details.title}" تایید و در تالار کف بازار منتشر گردید.`);
      } else if (item.type === 'barter_deal') {
        onUpdateBarterStatus(item.details.id, 'تایید نهایی شده');
        showToast(`قرارداد تهاتر با کارخانه ${item.details.factoryName} تایید نهایی شد.`);
      } else if (item.type === 'dealership') {
        onUpdateRepStatus(item.details.id || item.details.agencyCode, true);
        showToast(`درخواست نمایندگی استانی تایید و صادر گردید.`);
      } else if (item.type === 'callback') {
        await onUpdateCallback(item.details.id, 'called', 'تماس کارشناسی با موفقیت انجام شد');
        showToast(`وضعیت تماس با ${item.requesterPhone} به انجام شده تغییر کرد.`);
      } else if (item.type === 'support_ticket') {
        await onUpdateTicketStatus(item.details.id, 'closed');
        showToast(`تیکت پشتیبانی بررسی و بسته شد.`);
      } else if (item.type === 'factory_registration') {
        await onUpdateSupplierStatus(item.details.id || item.details.email, 'active');
        showToast(`پنل کارخانه ${item.details.company || item.details.name} با موفقیت تایید و فعال گردید.`);
      }
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
      if (item.type === 'wholesale_order') {
        await onUpdateOrderStatus(item.details.id, 'cancelled');
        showToast(`سفارش خرید #${item.details.id.slice(-6)} لغو گردید.`);
      } else if (item.type === 'safe_buy') {
        await onUpdateSafeBuyStatus(item.details.id, item.details.firebaseId, 'rejected');
        showToast(`درخواست خرید امن رد شد.`);
      } else if (item.type === 'billboard_ad') {
        onUpdateAdStatus(item.details.id, 'rejected', reason);
        showToast(`آگهی به علت "${reason || 'عدم انطباق شرایط'}" رد شد.`);
      } else if (item.type === 'barter_deal') {
        onUpdateBarterStatus(item.details.id, 'رد شده');
        showToast(`قرارداد تهاتر رد شد.`);
      } else if (item.type === 'dealership') {
        onUpdateRepStatus(item.details.id || item.details.agencyCode, false);
        showToast(`تقاضای نمایندگی رد شد.`);
      } else if (item.type === 'callback') {
        await onUpdateCallback(item.details.id, 'archived', reason);
        showToast(`درخواست تماس بایگانی شد.`);
      } else if (item.type === 'support_ticket') {
        await onUpdateTicketStatus(item.details.id, 'rejected');
        showToast(`تیکت رد شد.`);
      } else if (item.type === 'factory_registration') {
        await onUpdateSupplierStatus(item.details.id || item.details.email, 'suspended');
        showToast(`درخواست ثبت‌نام کارخانه رد و به حالت تعلیق درآمد.`);
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
    }
  };

  // Batch approve selected
  const handleBatchApprove = async () => {
    if (selectedItemIds.length === 0) return;
    const itemsToProcess = aggregatedPendingItems.filter(i => selectedItemIds.includes(i.id));
    
    for (const it of itemsToProcess) {
      await handleApproveItem(it);
    }
    setSelectedItemIds([]);
    showToast(`${itemsToProcess.length} درخواست انتخابی به صورت دسته‌جمعی تایید شدند.`);
  };

  const getTypeIcon = (type: ApprovalType) => {
    switch (type) {
      case 'wholesale_order':
        return <ShoppingCart size={16} className="text-blue-600" />;
      case 'safe_buy':
        return <ShieldCheck size={16} className="text-emerald-600" />;
      case 'billboard_ad':
        return <Megaphone size={16} className="text-amber-600" />;
      case 'barter_deal':
        return <Repeat size={16} className="text-purple-600" />;
      case 'dealership':
        return <Award size={16} className="text-indigo-600" />;
      case 'callback':
        return <Phone size={16} className="text-teal-600" />;
      case 'support_ticket':
        return <MessageSquare size={16} className="text-rose-600" />;
      case 'factory_registration':
        return <Building2 size={16} className="text-amber-700" />;
      default:
        return <Layers size={16} className="text-slate-600" />;
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            بحرانی / فوری 🔥
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            اولویت بالا ⚡
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            اولویت عادی ⏱️
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600">
            معمولی
          </span>
        );
    }
  };

  const toPersianNum = (n: any) => {
    if (n === null || n === undefined) return '';
    return n.toString().replace(/\d/g, (d: string) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d)]);
  };

  return (
    <div className="space-y-6" dir="rtl" id="pending-approvals-hub">
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white text-slate-900 px-6 py-3 rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-3 text-xs font-bold"
          >
            <CheckCircle size={18} className="text-emerald-400" />
            <span>{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER & METRICS BAR */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-emerald-600 text-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-indigo-400/30 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
                <Zap size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    صف درخواست‌های خرید و خدمات معوق (نیاز به تایید ادمین)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    {toPersianNum(metrics.total)} مورد در صف
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  لیست متمرکز و اولویت‌بندی شده هوشمند تمامی سفارش‌های خرید عمده، درخواست‌های تامین کف بازار، آگهی‌ها، تهاتر و عاملیت‌ها
                </p>
              </div>
            </div>

            {selectedItemIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-bold">
                  {toPersianNum(selectedItemIds.length)} مورد انتخاب شده
                </span>
                <button
                  type="button"
                  onClick={handleBatchApprove}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <CheckCircle size={15} />
                  <span>تایید دسته‌جمعی اقلام</span>
                </button>
              </div>
            )}
          </div>

          {/* METRIC PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-black text-slate-400">
                <span>کل موارد معوق</span>
                <Clock size={14} className="text-amber-400" />
              </div>
              <p className="text-xl font-black text-white mt-2">
                {toPersianNum(metrics.total)} <span className="text-xs font-bold text-slate-400">درخواست</span>
              </p>
            </div>

            <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-black text-rose-400">
                <span>فوریت بحرانی (P1)</span>
                <AlertTriangle size={14} className="text-rose-400" />
              </div>
              <p className="text-xl font-black text-rose-200 mt-2">
                {toPersianNum(metrics.critical)} <span className="text-xs font-bold text-rose-400">مورد فوری</span>
              </p>
            </div>

            <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-black text-amber-400">
                <span>اولویت بالا (P2)</span>
                <Zap size={14} className="text-amber-400" />
              </div>
              <p className="text-xl font-black text-amber-200 mt-2">
                {toPersianNum(metrics.high)} <span className="text-xs font-bold text-amber-400">مورد</span>
              </p>
            </div>

            <div className="p-4 bg-emerald-950/30 border border-emerald-800/40 rounded-2xl">
              <div className="flex items-center justify-between text-[11px] font-black text-emerald-400">
                <span>ارزش معاملات در صف</span>
                <DollarSign size={14} className="text-emerald-400" />
              </div>
              <p className="text-lg font-black text-emerald-200 mt-2 truncate">
                {toPersianNum(metrics.totalPipelineValue.toLocaleString())} <span className="text-xs font-bold text-emerald-400">تومان</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در متقاضی، کارخانه، شماره تماس، کد سفارش یا شرح درخواست..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white transition-all placeholder:text-slate-400"
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
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
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
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="priority">مرتب‌سازی: بالاترین اولویت</option>
              <option value="value_desc">مرتب‌سازی: بیشترین ارزش مالی</option>
              <option value="date_desc">مرتب‌سازی: جدیدترین درخواست</option>
            </select>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 pt-3">
          {[
            { id: 'all', label: 'همه درخواست‌ها', count: aggregatedPendingItems.length },
            { id: 'wholesale_order', label: 'سفارش‌های خرید عمده', count: aggregatedPendingItems.filter(i => i.type === 'wholesale_order').length },
            { id: 'safe_buy', label: 'خرید امن کف بازار', count: aggregatedPendingItems.filter(i => i.type === 'safe_buy').length },
            { id: 'billboard_ad', label: 'آگهی‌های تالار و مازاد', count: aggregatedPendingItems.filter(i => i.type === 'billboard_ad').length },
            { id: 'barter_deal', label: 'تهاتر و مواد اولیه', count: aggregatedPendingItems.filter(i => i.type === 'barter_deal').length },
            { id: 'dealership', label: 'اخذ عاملیت و نمایندگی', count: aggregatedPendingItems.filter(i => i.type === 'dealership').length },
            { id: 'callback', label: 'استعلام فوری و تماس', count: aggregatedPendingItems.filter(i => i.type === 'callback').length },
            { id: 'support_ticket', label: 'تیکت پشتیبانی و بار', count: aggregatedPendingItems.filter(i => i.type === 'support_ticket').length },
            { id: 'factory_registration', label: 'ثبت‌نام کارخانجات جدید', count: aggregatedPendingItems.filter(i => i.type === 'factory_registration').length },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                filterType === tab.id ? 'bg-slate-800 text-amber-400' : 'bg-white text-slate-600'
              }`}>
                {toPersianNum(tab.count)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* PRIORITIZED LIST CARDS */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">
              🎉
            </div>
            <h4 className="text-sm font-black text-slate-800">تمامی درخواست‌ها رسیدگی شده‌اند!</h4>
            <p className="text-xs text-slate-400 font-bold max-w-md mx-auto">
              هیچ درخواست خرید، آگهی، تهاتر یا تماس معوقی با فیلترهای انتخابی یافت نشد. تمام سفارش‌ها و استعلام‌ها به‌روز هستند.
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isSelected = selectedItemIds.includes(item.id);
            const isActionLoading = actionLoadingId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                  item.priority === 'critical'
                    ? 'border-rose-300 bg-rose-50/20'
                    : item.priority === 'high'
                      ? 'border-amber-200/90'
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
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 mt-1 sm:mt-0 cursor-pointer"
                  />

                  {/* Priority Rank indicator */}
                  <div className="flex flex-col items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-black shrink-0">
                    {toPersianNum(idx + 1)}
                  </div>

                  {/* Icon box */}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getTypeIcon(item.type)}
                  </div>

                  {/* Content Meta */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(item.priority)}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black">
                        {item.typeLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar size={11} />
                        {toPersianNum(item.date)}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-slate-800 truncate">
                      {item.title}
                    </h4>

                    {/* Sub info */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 font-bold">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-slate-400" />
                        {item.requesterName}
                        {item.requesterCompany ? ` (${item.requesterCompany})` : ''}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone size={12} className="text-slate-400" />
                        {toPersianNum(item.requesterPhone)}
                      </span>
                      {item.requesterCity && (
                        <span className="text-slate-400">
                          موقعیت: {item.requesterCity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: Financial Value / Quantity summary */}
                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto lg:min-w-[160px] border-t lg:border-t-0 border-slate-100 pt-2 lg:pt-0 shrink-0">
                  {item.valueToman && item.valueToman > 0 ? (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">مبلغ برآوردی</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-600">
                        {toPersianNum(item.valueToman.toLocaleString())} تومان
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">حجم درخواستی</span>
                      <span className="text-xs font-black text-slate-700">
                        {toPersianNum(item.quantity || '-')}
                      </span>
                    </div>
                  )}
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold mt-1 max-w-[200px] truncate text-left">
                    {item.priorityReason}
                  </span>
                </div>

                {/* Left: Action Buttons */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* View Details */}
                  <button
                    type="button"
                    onClick={() => setViewingDetailItem(item)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                    title="مشاهده جزئیات کامل و مدارک"
                  >
                    <Eye size={15} />
                    <span className="hidden sm:inline">بررسی جزئیات</span>
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
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                    title="تایید فوری درخواست"
                  >
                    <Check size={15} />
                    <span>تایید سریع</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {viewingDetailItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                    {getTypeIcon(viewingDetailItem.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{viewingDetailItem.title}</h3>
                    <p className="text-[11px] text-slate-500 font-bold">
                      {viewingDetailItem.typeLabel} • تاریخ ثبت: {toPersianNum(viewingDetailItem.date)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingDetailItem(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
                {/* Status and Priority Callout */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-amber-800 font-black">شاخص اولویت هوشمند:</span>
                    <p className="text-xs font-bold text-amber-950">{viewingDetailItem.priorityReason}</p>
                  </div>
                  {getPriorityBadge(viewingDetailItem.priority)}
                </div>

                {/* Requester Contact Info */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900">مشخصات متقاضی و اطلاعات تماس:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">نام شخص / مدیر:</span>
                      <span className="font-black text-slate-800">{viewingDetailItem.requesterName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">شماره تماس مستقیم:</span>
                      <a href={`tel:${viewingDetailItem.requesterPhone}`} className="font-black text-blue-600 hover:underline dir-ltr inline-block">
                        {toPersianNum(viewingDetailItem.requesterPhone)}
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">شهر و استان:</span>
                      <span className="font-black text-slate-800">{viewingDetailItem.requesterCity || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Custom Content by Type */}
                {viewingDetailItem.type === 'wholesale_order' && viewingDetailItem.details.items && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900">اقلام فاکتور خرید عمده:</h4>
                    <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                      {viewingDetailItem.details.items.map((it: any, i: number) => (
                        <div key={`admin-pend-appr-item-${it.id || it.productName || i}-${i}`} className="p-3 bg-white flex items-center justify-between">
                          <div>
                            <span className="font-black text-slate-800">{it.name || it.productName}</span>
                            <span className="text-[10px] text-slate-400 block">برند: {it.brand || 'معتبر'}</span>
                          </div>
                          <div className="text-left">
                            <span className="font-black text-slate-900">{toPersianNum(it.quantity)} کارتن</span>
                            <span className="text-[10px] text-emerald-600 block">
                              فی: {toPersianNum((it.bulk_price || it.price || 0).toLocaleString())} تومان
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Message / Description */}
                {(viewingDetailItem.details.buyerMessage || viewingDetailItem.details.description || viewingDetailItem.details.message) && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black text-slate-900">توضیحات و یادداشت متقاضی:</h4>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold leading-relaxed">
                      {viewingDetailItem.details.buyerMessage || viewingDetailItem.details.description || viewingDetailItem.details.message}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
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
                    else if (t === 'callback' || t === 'support_ticket') onNavigateTab('crm');
                  }}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <ArrowUpRight size={14} />
                  <span>انتقال به برگه تخصصی</span>
                </button>

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
                    <span>تایید نهایی و صدور مجوز</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4"
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
                  دلیل رد جهت ثبت در سوابق و اطلاع متقاضی:
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: عدم تطابق موجودی انبار، نقص در مدارک پروانه بهداشتی، یا عدم پاسخگویی به تماس کارشناس..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500 transition-all"
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
