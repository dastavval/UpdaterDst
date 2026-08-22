import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  CreditCard, 
  DollarSign, 
  FileText, 
  MapPin, 
  Upload, 
  Truck, 
  ShieldCheck, 
  PhoneCall,
  Trash2, 
  Plus, 
  Minus, 
  Receipt, 
  Calendar, 
  Building,
  Check,
  Loader2,
  AlertCircle,
  Package,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from '../lib/data-layer';
import { db } from '../lib/data-layer';
import { recordCRMOrder } from '../lib/crm-helper';
import { CartItem, Product, User } from '../types';
import { getDisplayImageUrl } from '../lib/image-utils';
import ChequeCharterModal from './ChequeCharterModal';

interface CheckoutWizardProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onAddToCart?: (product: Product, quantityCartons: number) => void;
  onUpdateQuantity: (productId: string, newCartons: number) => void;
  onRemoveItem: (productId: string) => void;
  totalAmount: number;
  user: User | null;
  userBadge: string;
  b2bConfig: any;
  onOrderSuccess: (orderData: any) => void;
  setShowAuthModal: (show: boolean) => void;
  products: Product[];
  userCity?: string;
  userProvince?: string;
  cityAgency?: any;
}

export default function CheckoutWizard({
  isOpen,
  onClose,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  totalAmount,
  user,
  userBadge,
  b2bConfig,
  onOrderSuccess,
  setShowAuthModal,
  products,
  userCity = "تهران",
  userProvince = "تهران",
  cityAgency
}: CheckoutWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [showCharterModal, setShowCharterModal] = useState(false);

  // Delivery & Shipping Form State
  const [buyerName, setBuyerName] = useState(user?.name || "");
  const [buyerPhone, setBuyerPhone] = useState(user?.mobile || user?.phone || "");
  const [buyerCompany, setBuyerCompany] = useState(user?.company || "");
  const [buyerAddress, setBuyerAddress] = useState(user?.address || "");
  const [shippingMethod, setShippingMethod] = useState("barbari");

  // Auto-fill user profile and saved delivery info when wizard opens or user changes
  useEffect(() => {
    let savedInfo: any = {};
    try {
      const stored = localStorage.getItem('dast1_saved_delivery_info');
      if (stored) savedInfo = JSON.parse(stored);
    } catch (e) {
      // ignore
    }

    if (user?.name) setBuyerName(user.name);
    else if (!buyerName && savedInfo.name) setBuyerName(savedInfo.name);

    if (user?.mobile || user?.phone) setBuyerPhone(user.mobile || user.phone || "");
    else if (!buyerPhone && savedInfo.phone) setBuyerPhone(savedInfo.phone);

    if (user?.company) setBuyerCompany(user.company);
    else if (!buyerCompany && savedInfo.company) setBuyerCompany(savedInfo.company);

    if (user?.address) setBuyerAddress(user.address);
    else if (!buyerAddress && savedInfo.address) setBuyerAddress(savedInfo.address);
  }, [user, isOpen]);

  // Persist delivery info when user types
  useEffect(() => {
    if (buyerName || buyerPhone || buyerAddress) {
      try {
        localStorage.setItem('dast1_saved_delivery_info', JSON.stringify({
          name: buyerName,
          phone: buyerPhone,
          company: buyerCompany,
          address: buyerAddress
        }));
      } catch (e) {
        // ignore
      }
    }
  }, [buyerName, buyerPhone, buyerCompany, buyerAddress]);

  // Payment Method State
  const cartProducts = cart.map(item => {
    return products.find(p => p.id === item.productId || p.productCode === item.productId);
  });
  const hasNonChequeProducts = cartProducts.some(p => p && p.chequeAllowed === false);
  const nonChequeProductsNames = cartProducts
    .filter(p => p && p.chequeAllowed === false)
    .map(p => p!.name);

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque'>('cash');

  useEffect(() => {
    if (hasNonChequeProducts && paymentMethod === 'cheque') {
      setPaymentMethod('cash');
    }
  }, [hasNonChequeProducts, paymentMethod]);

  const [paymentReceiptImage, setPaymentReceiptImage] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  // Cheque & Split Cash/Cheque Settlement State
  const [splitCashPercent, setSplitCashPercent] = useState<number>(50); // Default 50% Cash / 50% Cheque
  const [chequeSayadiNo, setChequeSayadiNo] = useState("");
  const [chequeBankName, setChequeBankName] = useState("بانک ملی");
  const [chequeDays, setChequeDays] = useState<number>(60); // Default 60 days (2 months)
  const [chequeMonths, setChequeMonths] = useState<number>(2); // Default 2 months
  const [chequeDueDate, setChequeDueDate] = useState("");
  const [chequeImage, setChequeImage] = useState("");

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDeliveryInfoComplete = buyerName && buyerPhone && buyerAddress;

  const handleQuickCheckout = async () => {
    if (!isDeliveryInfoComplete) return;
    setStep(3); // Go straight to payment
  };

  // Helper to resolve REAL product image safely
  const getProductImage = (item: CartItem) => {
    const prod = products.find(p => p.id === item.productId || p.name === item.name);
    if (prod?.image_url && prod.image_url.trim() !== '') {
      return getDisplayImageUrl(prod.image_url);
    }
    if (item.image_url && item.image_url.trim() !== '' && !item.image_url.includes('unsplash.com/photo-1558961363')) {
      return getDisplayImageUrl(item.image_url);
    }
    return getDisplayImageUrl(prod?.image_url || item.image_url || "");
  };

  // Quick Add handler for suggested items
  const handleQuickAdd = (product: Product, cartons: number = 5) => {
    const existing = cart.find(c => c.productId === product.id);
    if (onAddToCart) {
      onAddToCart(product, cartons);
    } else {
      const newQty = (existing?.quantityCartons || 0) + cartons;
      onUpdateQuantity(product.id, newQty);
    }

    setJustAddedId(product.id);
    setQuickNotice(`«${product.name}» با موفقیت (+${cartons} کارتن) به سبد خرید اضافه شد`);
    
    setTimeout(() => {
      setJustAddedId(null);
    }, 2000);

    setTimeout(() => {
      setQuickNotice(null);
    }, 4000);
  };

  // Config values
  const invSettings = b2bConfig?.invoiceSettings || {};
  const cashDiscountPercent = invSettings.cashDiscountPercent !== undefined ? invSettings.cashDiscountPercent : 5;
  const chequeMarkupPerMonth = invSettings.chequeMarkupPerMonthPercent !== undefined ? invSettings.chequeMarkupPerMonthPercent : 6;
  const minOrderAmount = b2bConfig?.minOrderAmount || 10000000;
  const minOrderCartons = b2bConfig?.minOrderCartons || 5;

  const totalCartons = cart.reduce((sum, item) => sum + item.quantityCartons, 0);
  const totalUnits = cart.reduce((sum, item) => sum + item.totalItems, 0);
  
  // Weight estimation: average 10-14kg per carton
  const estimatedWeightKg = totalCartons * 12;

  // 1. Volume Tier Discount (تخفیف پلکانی تیراژ کارتن - منحصراً در تسویه نقدی فعال است و در خرید چکی اعمال نمی‌شود)
  let tierDiscountPercent = 0;
  let tierLabel = "";
  if (paymentMethod === 'cash') {
    if (totalCartons >= 50) {
      tierDiscountPercent = 10;
      tierLabel = "تخفیف طلایی ۱۰٪ (تیراژ ۵۰ کارتن و بالاتر)";
    } else if (totalCartons >= 25) {
      tierDiscountPercent = 6;
      tierLabel = "تخفیف ۶٪ (تیراژ ۲۵ تا ۴۹ کارتن)";
    } else if (totalCartons >= 10) {
      tierDiscountPercent = 3;
      tierLabel = "تخفیف ۳٪ (تیراژ ۱۰ تا ۲۴ کارتن)";
    }
  }
  const tierDiscountAmount = Math.round(totalAmount * (tierDiscountPercent / 100));

  // 2. User Badge / Partner Discount
  const badgeDiscountPercent = userBadge === 'gold' ? 3 : userBadge === 'vip' ? 5 : userBadge === 'silver' ? 1 : 0;
  const badgeDiscountAmount = Math.round(totalAmount * (badgeDiscountPercent / 100));

  // 3. Cash Discount (اگر تخفیف پلکانی فعال شده باشد، تخفیف نقدی ۵٪ غیرفعال می‌شود تا هم‌پوشانی نداشته باشند)
  const effectiveCashDiscountPercent = (paymentMethod === 'cash' && tierDiscountPercent === 0) ? cashDiscountPercent : 0;
  const cashDiscountAmount = Math.round(totalAmount * (effectiveCashDiscountPercent / 100));

  // 4. Cheque & Split Calculations (حداقل ۵۰٪ نقد + ۵۰٪ چک صیادی جهت کاهش ریسک و تضمین کارخانه)
  const effectiveCashPercent = paymentMethod === 'cash' ? 100 : splitCashPercent;
  const effectiveChequePercent = paymentMethod === 'cash' ? 0 : (100 - splitCashPercent);

  // Total discounts applied
  const totalDiscounts = tierDiscountAmount + badgeDiscountAmount + cashDiscountAmount;
  const basePayableAmount = Math.max(0, totalAmount - totalDiscounts);

  // Split Breakdown
  const cashPortionAmount = paymentMethod === 'cash' ? basePayableAmount : Math.round(basePayableAmount * (effectiveCashPercent / 100));
  const chequeBasePortion = paymentMethod === 'cash' ? 0 : Math.round(basePayableAmount * (effectiveChequePercent / 100));
  
  const chequeMarkupPercent = paymentMethod === 'cheque' ? chequeMonths * chequeMarkupPerMonth : 0;
  const chequeMarkupAmount = paymentMethod === 'cheque' ? Math.round(chequeBasePortion * (chequeMarkupPercent / 100)) : 0;
  const chequePortionAmount = chequeBasePortion + chequeMarkupAmount;
  
  const finalPayableAmount = cashPortionAmount + chequePortionAmount;

  // Exact Persian Due Date
  const computedDueDate = new Date(Date.now() + chequeDays * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR');
  const computedDueDateLong = new Date(Date.now() + chequeDays * 24 * 60 * 60 * 1000).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const rawBankAcc = (invSettings.bankAccounts && invSettings.bankAccounts.length > 0)
    ? invSettings.bankAccounts[0]
    : {
        bankName: "بانک ملی ایران",
        accountNumber: "۰۱۰۲۹۳۸۴۷۵۰۰۱",
        cardNumber: "۶۰۳۷-۹۹۷۵-۸۸۳۴-۱۲۹۰",
        shabaNumber: "IR620170000000102938475001",
        ownerName: "پلتفرم بازرگانی دست اول"
      };

  const bankAccount = {
    ...rawBankAcc,
    shabaNumber: rawBankAcc.shabaNumber || rawBankAcc.sheba,
    sheba: rawBankAcc.sheba || rawBankAcc.shabaNumber
  };

  const handleNextFromStep1 = () => {
    setErrorMessage("");
    if (cart.length === 0) {
      setErrorMessage("سبد خرید شما خالی است.");
      return;
    }
    const meetsMinOrder = totalAmount >= minOrderAmount || totalCartons >= minOrderCartons;
    if (!meetsMinOrder) {
      setErrorMessage(`حداقل سفارش برای ثبت، ۵ کارتن یا حداقل ۱۰,۰۰۰,۰۰۰ تومان می‌باشد. (سبد فعلی: ${totalCartons} کارتن - ${totalAmount.toLocaleString()} تومان)`);
      return;
    }
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setErrorMessage("");
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerAddress.trim()) {
      setErrorMessage("لطفاً نام تحویل‌گیرنده، شماره تماس و آدرس دقیق را وارد کنید.");
      return;
    }
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    setErrorMessage("");
    if (paymentMethod === 'cheque') {
      const allowedCredit = Number((user as any)?.buyerCredit ?? (b2bConfig?.buyerCredit ?? 250000000));
      if (chequePortionAmount > allowedCredit) {
        setErrorMessage(`مبلغ چک (${chequePortionAmount.toLocaleString()} تومان) بیشتر از سقف اعتبار چکی مجاز شما (${allowedCredit.toLocaleString()} تومان) می‌باشد.`);
        return;
      }
      if (!chequeSayadiNo.trim() && !chequeImage) {
        setErrorMessage("لطفاً شماره صیادی ۱۶ رقمی یا تصویر چک صیادی را وارد/آپلود نمایید.");
        return;
      }
    }
    setStep(4);
  };

  const handleFinalSubmit = async () => {
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const trackingNumber = `DX-${Math.floor(10000 + Math.random() * 90000)}`;
      const firstProd = products.find(p => p.id === cart[0]?.productId);
      const sellerId = firstProd?.sellerId || "factory_central";
      const sellerName = firstProd?.sellerName || "گروه صنایع غذایی و بازرگانی دست اول";

      const orderData = {
        buyerName,
        buyerPhone,
        buyerAddress,
        buyerCompany: buyerCompany || "فروشگاه / پخش عمده",
        items: cart,
        totalAmount: finalPayableAmount,
        originalAmount: totalAmount,
        discountAmount: totalDiscounts,
        discountBreakdown: {
          tier: tierDiscountAmount,
          tierPercent: tierDiscountPercent,
          tierLabel: tierLabel || "بدون تخفیف پلکانی",
          badge: badgeDiscountAmount,
          badgePercent: badgeDiscountPercent,
          cash: cashDiscountAmount,
          cashPercent: effectiveCashDiscountPercent,
          chequeMarkup: chequeMarkupAmount,
          chequeMonths: paymentMethod === 'cheque' ? chequeMonths : 0,
          chequeDays: paymentMethod === 'cheque' ? chequeDays : 0,
          chequeMarkupPercent
        },
        paymentMethod,
        settlementBreakdown: {
          cashPercent: effectiveCashPercent,
          chequePercent: effectiveChequePercent,
          cashAmount: cashPortionAmount,
          chequeAmount: chequePortionAmount,
          chequeBaseAmount: chequeBasePortion,
          chequeMarkupAmount,
          chequeDays: paymentMethod === 'cheque' ? chequeDays : 0,
          chequeMonths: paymentMethod === 'cheque' ? chequeMonths : 0,
          chequeDueDate: paymentMethod === 'cheque' ? (chequeDueDate || computedDueDate) : null,
          chequeDueDateLong: paymentMethod === 'cheque' ? computedDueDateLong : null
        },
        receiptUrl: paymentReceiptImage || null,
        receiptNumber: receiptNumber || null,
        chequeDetails: paymentMethod === 'cheque' ? {
          sayadiNumber: chequeSayadiNo,
          bankName: chequeBankName,
          months: chequeMonths,
          days: chequeDays,
          amount: chequePortionAmount,
          dueDate: chequeDueDate || computedDueDate,
          dueDateLong: computedDueDateLong,
          chequeImageUrl: chequeImage || null
        } : null,
        shippingMethod,
        status: 'order_received',
        paymentStatus: paymentMethod === 'cash' && paymentReceiptImage ? 'paid' : 'pending',
        sellerId,
        sellerName,
        createdAt: serverTimestamp(),
        trackingNumber
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      await recordCRMOrder(buyerName, buyerPhone, buyerCompany || "پخش عمده", finalPayableAmount);

      const createdOrder = { ...orderData, id: docRef.id, createdAt: new Date() };

      setIsSubmitting(false);
      onOrderSuccess(createdOrder);
    } catch (err: any) {
      console.error("Order error:", err);
      setIsSubmitting(false);
      setErrorMessage("خطا در ثبت سفارش. لطفاً مجدداً تلاش نمایید.");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" dir="rtl">
        {/* Soft Background Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-400/40 backdrop-blur-sm"
        />

        {/* Pure White Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden text-right flex flex-col max-h-[92vh] font-sans border border-slate-200/90"
        >
          {/* Toast / Notification banner for instant feedback */}
          <AnimatePresence>
            {quickNotice && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-2 inset-x-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-200 shrink-0" />
                  <span>{quickNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickNotice(null)}
                  className="p-1 hover:bg-emerald-700/50 rounded-lg text-emerald-100 transition-colors"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Clean Pure White Header */}
          <div className="bg-white border-b border-slate-200/80 p-4 sm:p-5 space-y-3.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-xs">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">پیش‌فاکتور و ثبت سفارش عمده کارخانه</h2>
                  <p className="text-[11px] text-slate-500 font-bold">فرآیند ۴ مرحله‌ای شفاف و مستقیم با خط تولید</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a
                  href="tel:09999123001"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-black transition-all shadow-xs group cursor-pointer"
                  title="تماس تلفنی با پشتیبانی مشتریان"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <PhoneCall size={10} className="animate-pulse" />
                  </div>
                  <span>پشتیبانی سفارشات</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title="بستن"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Step Wizard Tabs Bar (Clean White / Emerald Theme) */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1 border-t border-slate-100">
              {[
                { id: 1, label: "۱. سبد خرید" },
                { id: 2, label: "۲. تحویل و آدرس" },
                { id: 3, label: "۳. روش تسویه" },
                { id: 4, label: "۴. تایید فاکتور" }
              ].map((s, sIdx) => (
                <button
                  key={`checkout-step-tab-${s.id}-${sIdx}`}
                  type="button"
                  onClick={() => {
                    if (s.id < step) setStep(s.id as any);
                  }}
                  className={`py-2 px-1 text-center rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                    step === s.id
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : step > s.id
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100"
                      : "bg-slate-50 text-slate-400 border border-slate-200/60"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-white">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: CART REVIEW */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <span>بررسی اقلام سفارش عمده</span>
                    <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded-md font-mono font-bold">
                      {cart.length} قلم کالا
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span>مجموع: <span className="text-slate-900 font-mono font-black">{totalCartons}</span> کارتن</span>
                    <span className="text-slate-300">|</span>
                    <span>وزن: <span className="text-emerald-700 font-mono font-black">{estimatedWeightKg}</span> ک‌گ</span>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <ShoppingBag size={48} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-600">سبد خرید شما در حال حاضر خالی است.</p>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-sm hover:bg-emerald-700 transition-colors"
                    >
                      <span>مشاهده و انتخاب کالاها از کاتالوگ</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {cart.map((item, idx) => {
                      const realImage = getProductImage(item);
                      const matchedProd = products.find(p => p.id === item.productId || p.name === item.name);
                      const packCount = matchedProd?.carton_pack_count || item.unitsPerCarton || 24;
                      const unitPrice = Math.round(item.pricePerCarton / packCount);

                      return (
                        <div
                          key={`wizard-cart-${item.productId || idx}-${idx}`}
                          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {realImage ? (
                              <img
                                src={realImage}
                                alt={item.name}
                                className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0 bg-white shadow-xs"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0 text-slate-500">
                                <Package size={18} className="text-slate-400 stroke-[1.5]" />
                                <span className="text-[8px] font-black text-slate-400 mt-0.5">بدون تصویر</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-1">
                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2 py-0.5 rounded-md font-mono">
                                  {item.pricePerCarton.toLocaleString()} ت/کارتن
                                </span>
                                <span>({packCount} عدد در کارتن - عددی {unitPrice.toLocaleString()} ت)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-xs">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.productId, item.quantityCartons + 1)}
                                className="p-1 hover:bg-white text-slate-700 hover:text-emerald-700 rounded-lg cursor-pointer transition-colors"
                                title="افزایش یک کارتن"
                              >
                                <Plus size={14} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantityCartons}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  if (!isNaN(val) && val > 0) {
                                    onUpdateQuantity(item.productId, val);
                                  }
                                }}
                                className="w-16 text-center text-xs font-black font-mono text-slate-900 bg-transparent border-none focus:ring-0"
                              />
                              <span className="text-[10px] text-slate-500 font-bold">کارتن</span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantityCartons > 1) {
                                    onUpdateQuantity(item.productId, item.quantityCartons - 1);
                                  } else {
                                    onRemoveItem(item.productId);
                                  }
                                }}
                                className="p-1 hover:bg-white text-slate-700 hover:text-rose-700 rounded-lg cursor-pointer transition-colors"
                                title="کاهش کارتن"
                              >
                                <Minus size={14} />
                              </button>
                            </div>

                            <div className="text-left font-mono">
                              <span className="text-xs font-black text-emerald-600 block">
                                {(item.pricePerCarton * item.quantityCartons).toLocaleString()} <span className="text-[9px] font-normal">تومان</span>
                              </span>
                              <span className="text-[9px] text-slate-400 font-bold block">
                                ({item.quantityCartons * packCount} عدد کل)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.productId)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف از سبد"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TEMPTING VOLUME TIER & DISCOUNT NUDGES (تخفیفات پلکانی وسوسه‌کننده) */}
                {cart.length > 0 && (() => {
                  const tiers = [
                    { cartons: 10, discount: 3, label: "تخفیف ۳٪ خرید ۱۰ کارتن", bonusGift: "ارسال اولویت‌دار" },
                    { cartons: 25, discount: 6, label: "تخفیف ۶٪ خرید ۲۵ کارتن", bonusGift: "بیمه کامل رایگان" },
                    { cartons: 50, discount: 10, label: "تخفیف طلایی ۱۰٪ تیراژ بالا (۵۰ کارتن)", bonusGift: "یک کارتن هدیه + ارسال رایگان انبار" },
                  ];
                  
                  const nextTier = tiers.find(t => t.cartons > totalCartons);
                  const cartonsNeeded = nextTier ? nextTier.cartons - totalCartons : 0;
                  const currentSavingsPotential = totalAmount > 0 && nextTier ? Math.round(totalAmount * (nextTier.discount / 100)) : 0;

                  return (
                    <div className="bg-linear-to-r from-amber-50/90 via-orange-50/60 to-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🎁</span>
                          <div>
                            <span className="text-xs font-black text-amber-950 block">طرح ویژه تخفیف پلکانی و جوایز بنکداری</span>
                            {nextTier ? (
                              <span className="text-[11px] text-amber-800 font-bold">
                                فقط <strong className="font-mono text-amber-950 text-xs">{cartonsNeeded} کارتن دیگر</strong> تا فعال‌سازی {nextTier.label}! (سود اضافی: +{currentSavingsPotential.toLocaleString()} تومان)
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-800 font-bold">
                                🌟 تبریک! سفارش شما مشمول بالاترین پله تخفیف و جوایز ویژه بنکداری ممتاز گردید.
                              </span>
                            )}
                          </div>
                        </div>

                        {nextTier && (
                          <div className="text-left font-mono font-black text-amber-900 text-xs bg-amber-100/90 px-3 py-1.5 rounded-xl border border-amber-300/60 shrink-0">
                            {totalCartons}/{nextTier.cartons} کارتن
                          </div>
                        )}
                      </div>

                      {/* Progress bar to next tier */}
                      {nextTier && (
                        <div className="w-full bg-amber-200/80 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-linear-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.round((totalCartons / nextTier.cartons) * 100))}%` }}
                          />
                        </div>
                      )}

                      {/* Suggested Additions Section with Working +5 Add Button and Feedback */}
                      <div className="pt-1.5 border-t border-amber-200/60">
                        <div className="text-[11px] font-black text-amber-950 mb-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Sparkles size={13} className="text-amber-600" />
                            کالاهای پرفروش پیشنهادی جهت تکمیل ظرفیت بار و دریافت تخفیف:
                          </span>
                          <button 
                            type="button"
                            onClick={onClose}
                            className="text-emerald-700 hover:text-emerald-800 underline text-[10px] font-black cursor-pointer"
                          >
                            + کاتالوگ کامل
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {products
                            .slice(0, 4)
                            .map((suggested, sIdx) => {
                              const inCartItem = cart.find(c => c.productId === suggested.id);
                              const isJustAdded = justAddedId === suggested.id;
                              const cartonPrice = suggested.bulk_price * suggested.carton_pack_count;

                              return (
                                <div 
                                  key={`sug-${suggested.id || sIdx}-${sIdx}`} 
                                  className={`bg-white p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 shadow-xs ${
                                    isJustAdded 
                                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40" 
                                      : inCartItem 
                                      ? "border-emerald-200 bg-emerald-50/20" 
                                      : "border-slate-200 hover:border-amber-300"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {suggested.image_url ? (
                                      <img 
                                        src={getDisplayImageUrl(suggested.image_url)} 
                                        alt={suggested.name} 
                                        className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0 bg-white shadow-xs" 
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 text-xs">📦</div>
                                    )}
                                    <div className="min-w-0">
                                      <span className="text-[11px] font-black text-slate-900 block truncate">{suggested.name}</span>
                                      <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                                        {cartonPrice.toLocaleString()} ت/کارتن
                                      </span>
                                      {inCartItem && (
                                        <span className="text-[9px] text-emerald-600 font-black flex items-center gap-0.5">
                                          <Check size={10} /> در سبد ({inCartItem.quantityCartons} کارتن)
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="shrink-0 flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleQuickAdd(suggested, 5)}
                                      className={`text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 flex items-center gap-1 ${
                                        isJustAdded 
                                          ? "bg-emerald-700 text-white scale-105" 
                                          : inCartItem 
                                          ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                                      }`}
                                    >
                                      {isJustAdded ? (
                                        <>
                                          <Check size={12} />
                                          <span>اضافه شد!</span>
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={12} />
                                          <span>+ ۵ کارتن</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Specs & Vehicle Estimation Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between text-xs font-bold text-slate-700 shadow-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-600">قیمت مصوب خط تولید:</span>
                      <span className="font-black text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        ۱۰۰٪ مستقیم کارخانه
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      کلیه فاکتورها مستقیماً با قیمت درب کارخانه بدون واسطه صادر می‌گردند.
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between text-xs font-bold text-slate-700 shadow-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-600">تخمین خودرو ترابری:</span>
                      <span className="font-black text-indigo-700">
                        {estimatedWeightKg < 1500 ? "وانت / نیسان بار" : estimatedWeightKg < 5000 ? "کامیونت خاور ۶ تنی" : "کامیون تک / جفت ۲۰ تنی"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      وزن ناخالص مرسوله: حدود <strong className="font-mono font-black text-slate-800">{estimatedWeightKg}</strong> کیلوگرم ({totalUnits} عدد کالا)
                    </div>
                  </div>
                </div>

                {/* Min Order Notice */}
                <div className={`p-3.5 rounded-2xl text-[11px] font-bold flex justify-between items-center border transition-all ${
                  (totalAmount >= minOrderAmount || totalCartons >= minOrderCartons)
                    ? "bg-emerald-50/70 text-emerald-800 border-emerald-200"
                    : "bg-amber-50/70 text-amber-800 border-amber-200"
                }`}>
                  <span className="flex items-center gap-1.5 font-black">
                    <Package size={14} className={totalAmount >= minOrderAmount || totalCartons >= minOrderCartons ? "text-emerald-600" : "text-amber-600"} />
                    شرایط حداقل سفارش عمده:
                  </span>
                  <span>حداقل ۵ کارتن یا حداقل ۱۰,۰۰۰,۰۰۰ تومان</span>
                </div>
              </div>
            )}

            {/* STEP 2: DELIVERY & SHIPPING INFO (Clean White Form) */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-600" />
                    مشخصات خریدار و آدرس دقیق تخلیه بار
                  </h3>
                  { (user?.name || user?.phone || user?.address) && (
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      فراخوانی خودکار از حساب
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1.5">نام و نام خانوادگی تحویل‌گیرنده *</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      placeholder="مثال: علی رضایی"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 mb-1.5">شماره تماس (جهت هماهنگی راننده باربری) *</label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={e => setBuyerPhone(e.target.value)}
                      placeholder="مثال: 09121111111"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold font-mono text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">نام بنکداری / فروشگاه / شرکت</label>
                  <input
                    type="text"
                    value={buyerCompany}
                    onChange={e => setBuyerCompany(e.target.value)}
                    placeholder="مثال: بازرگانی البرز"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-black text-slate-700">آدرس کامل و دقیق انبار یا مغازه جهت تخلیه بار *</label>
                    <button
                      type="button"
                      onClick={() => {
                        const prefix = `استان ${userProvince}، شهر ${userCity}، `;
                        if (!buyerAddress.includes(prefix)) {
                          setBuyerAddress(prefix + buyerAddress);
                        }
                      }}
                      className="text-[10px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-2.5 py-1 rounded-lg font-black transition-all cursor-pointer"
                    >
                      📍 درج خودکار «{userCity}» در آدرس
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={buyerAddress}
                    onChange={e => setBuyerAddress(e.target.value)}
                    placeholder="مثال: تهران، خیابان خیام، پلاک ۱۲۰، انبار مرکزی توزیع..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                  />
                </div>

                {cityAgency && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} className="text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-[11px] font-black text-emerald-900">
                          عاملیت مجاز توزیع در {userProvince} ({userCity})
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          سفارش شما جهت ارسال و پشتیبانی در سریع‌ترین زمان به این نماینده ارجاع خواهد شد.
                        </div>
                      </div>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200/50 shadow-xs flex flex-col items-center shrink-0 w-full sm:w-auto">
                      <span className="text-[9px] text-slate-400 font-black">نام نماینده/شرکت:</span>
                      <span className="text-[11px] text-slate-800 font-black">{cityAgency.company || cityAgency.agencyName || cityAgency.name || 'نماینده دست اول'}</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <label className="block text-[11px] font-black text-slate-700">روش ارسال و ترابری جاده‌ای</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'barbari', name: 'باربری جاده‌ای', icon: '🚛' },
                      { id: 'khavar', name: 'کامیونت / خاور', icon: '🚚' },
                      { id: 'deka', name: 'اکسپرس (دکا)', icon: '📦' },
                      { id: 'personal', name: 'تحویل حضوری انبار', icon: '🏭' }
                    ].map((m, mIdx) => (
                      <button
                        key={`ship-method-opt-${m.id}-${mIdx}`}
                        type="button"
                        onClick={() => setShippingMethod(m.id)}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                          shippingMethod === m.id
                            ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20 font-black"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-bold"
                        }`}
                      >
                        <span className="text-xl block mb-1">{m.icon}</span>
                        <span className="text-[10px]">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT & DOCUMENTS (Clean White Form) */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <CreditCard size={16} className="text-emerald-600" />
                    انتخاب روش تسویه و مدارک پرداخت
                  </h3>
                  <span className="text-[11px] font-black text-slate-500">
                    مبلغ قابل تسویه: <strong className="font-mono text-slate-900">{basePayableAmount.toLocaleString()} تومان</strong>
                  </span>
                </div>

                {/* Method selector tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      paymentMethod === 'cash'
                        ? "border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-slate-900">پرداخت ۱۰۰٪ نقدی (پیش‌فاکتور)</span>
                      <DollarSign size={18} className="text-emerald-600" />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-black bg-emerald-100/70 px-2 py-0.5 rounded-md inline-block w-max">
                      {tierDiscountPercent > 0 ? `🎉 ${tierDiscountPercent}٪ تخفیف پلکانی تیراژ فعال` : `🎉 ${cashDiscountPercent}٪ تخفیف ویژه نقدی`}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={hasNonChequeProducts}
                    onClick={() => {
                      if (!hasNonChequeProducts) {
                        setPaymentMethod('cheque');
                      }
                    }}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      hasNonChequeProducts 
                        ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                        : paymentMethod === 'cheque'
                          ? "border-indigo-500 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20 cursor-pointer"
                          : "border-slate-200 bg-white hover:border-slate-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2 w-full">
                      <span className="text-xs font-black text-slate-900">تسویه چکی (۵۰٪ نقد + ۵۰٪ چک صیادی)</span>
                      <Receipt size={18} className={`${hasNonChequeProducts ? "text-slate-400" : "text-indigo-600"}`} />
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block w-max ${
                      hasNonChequeProducts 
                        ? "text-rose-700 bg-rose-50"
                        : "text-indigo-700 bg-indigo-100/70"
                    }`}>
                      {hasNonChequeProducts ? "🚫 غیرفعال: شامل اقلام غیرچکی" : "🛡️ مدل امن کارخانه (اعتبارسنجی اولیه)"}
                    </span>
                  </button>
                </div>

                {hasNonChequeProducts && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-950 space-y-1">
                    <p className="font-black">⚠️ امکان تسویه چکی برای این سفارش وجود ندارد:</p>
                    <p className="text-[11px] text-rose-800 leading-relaxed font-semibold">
                      محصولات زیر امکان فروش اعتباری/چکی ندارند و نقدی دست اول هستند:
                    </p>
                    <ul className="list-disc list-inside text-[10px] text-rose-700 font-mono mt-1 space-y-0.5">
                      {nonChequeProductsNames.map((name, idx) => (
                        <li key={`non-cheque-item-${idx}`}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cash Options Details */}
                {paymentMethod === 'cash' && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                    <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <Building size={16} className="text-emerald-600" />
                      اطلاعات حساب رسمی جهت واریز ۱۰۰٪ مبلغ فاکتور
                    </div>

                    <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200 space-y-2 text-xs font-bold">
                      <div className="flex justify-between text-slate-700">
                        <span>مبلغ قابل واریز نقدی:</span>
                        <span className="font-mono text-emerald-800 font-black text-sm">{cashPortionAmount.toLocaleString()} تومان</span>
                      </div>
                      <div className="flex justify-between text-slate-600 border-t border-emerald-100 pt-2">
                        <span>نام بانک و صاحب حساب:</span>
                        <span className="text-slate-900 font-black">{bankAccount.bankName} - {bankAccount.ownerName}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>شماره شبا:</span>
                        <span className="font-mono text-emerald-700 font-black" dir="ltr">{bankAccount.shabaNumber || bankAccount.sheba}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>شماره کارت:</span>
                        <span className="font-mono text-slate-900 font-black" dir="ltr">{bankAccount.cardNumber}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-700 mb-1.5">آپلود تصویر فیش واریزی نقدی (اختیاری)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          id="cash-receipt-input"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onloadend = () => setPaymentReceiptImage(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                        <label
                          htmlFor="cash-receipt-input"
                          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <Upload size={14} />
                          <span>{paymentReceiptImage ? "تغییر تصویر فیش" : "انتخاب و آپلود فیش واریزی"}</span>
                        </label>
                        {paymentReceiptImage && (
                          <span className="text-xs text-emerald-600 font-black flex items-center gap-1">
                            <CheckCircle2 size={15} /> تصویر فیش بارگذاری شد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cheque & Split Cash/Cheque Details */}
                {paymentMethod === 'cheque' && (
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-200 space-y-4 shadow-xs">
                    
                    {/* Policy & Risk Explanation Banner */}
                    <div className="p-3.5 bg-linear-to-r from-indigo-50/90 via-blue-50/60 to-indigo-50/90 border border-indigo-200 rounded-xl space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5">🛡️</span>
                          <div>
                            <span className="text-xs font-black text-indigo-950 block">سیاست اعتبارسنجی کارخانه و کاهش ریسک معوقات</span>
                            <p className="text-[11px] text-slate-700 font-bold leading-relaxed mt-0.5">
                              جهت تضمین تامین مواد اولیه و حداقل‌سازی ریسک عدم وصول، خرید چکی به صورت ترکیبی (حداقل ۵۰٪ نقد + الباقی چک صیادی بنفش) انجام می‌شود. پس از پاس‌شدن به‌موقع نخستین چک، سقف اعتبار و درصد چکی شما در سفارشات بعدی افزایش می‌یابد.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCharterModal(true)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 shadow-xs flex items-center gap-1 self-start sm:self-center"
                        >
                          <span>📜 اساس‌نامه چکی</span>
                        </button>
                      </div>
                    </div>

                    {/* Split Ratio Selector */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-800">
                          نسبت واریز نقد و چک صیادی (حداقل ۵۰٪ نقد الزامی است):
                        </label>
                        <span className="text-[11px] font-black text-indigo-700 font-mono">
                          {splitCashPercent}٪ نقد / {100 - splitCashPercent}٪ چک
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { cash: 50, label: "۵۰٪ نقد / ۵۰٪ چک (استاندارد)" },
                          { cash: 60, label: "۶۰٪ نقد / ۴۰٪ چک" },
                          { cash: 70, label: "۷۰٪ نقد / ۳۰٪ چک" },
                          { cash: 80, label: "۸۰٪ نقد / ۲۰٪ چک" }
                        ].map((opt, optIdx) => (
                          <button
                            key={`split-opt-${opt.cash}-${optIdx}`}
                            type="button"
                            onClick={() => setSplitCashPercent(opt.cash)}
                            className={`p-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                              splitCashPercent === opt.cash
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-500/20"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Cheque Duration & Maturity Selection */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-800">مدت زمان و سررسید چک صیادی:</span>
                        <span className="text-[10px] font-black text-indigo-600">
                          کارمزد {chequeMarkupPerMonth}٪ در ماه (فقط روی بخش چکی)
                        </span>
                      </div>

                      {/* Duration selector buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          { days: 30, months: 1, label: "۳۰ روزه (۱ ماه)" },
                          { days: 45, months: 1.5, label: "۴۵ روزه (۱.۵ ماه)" },
                          { days: 60, months: 2, label: "۶۰ روزه (۲ ماه)" },
                          { days: 90, months: 3, label: "۹۰ روزه (۳ ماه)" },
                          { days: 120, months: 4, label: "۱۲۰ روزه (۴ ماه)" }
                        ].map((dur, durIdx) => (
                          <button
                            key={`dur-opt-${dur.days}-${durIdx}`}
                            type="button"
                            onClick={() => {
                              setChequeDays(dur.days);
                              setChequeMonths(dur.months);
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                              chequeDays === dur.days
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {dur.label}
                            <span className="block text-[8px] opacity-80 mt-0.5">
                              {dur.months * chequeMarkupPerMonth > 0 ? `+${dur.months * chequeMarkupPerMonth}٪ کارمزد` : "بدون کارمزد"}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Computed Maturity Date Banner */}
                      <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-indigo-700" />
                          <span className="text-xs font-black text-indigo-950">تاریخ دقیق سررسید مندرج در چک:</span>
                        </div>
                        <span className="font-mono font-black text-indigo-900 text-xs bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-2xs">
                          {computedDueDateLong} ({computedDueDate})
                        </span>
                      </div>
                    </div>

                    {/* DUAL BREAKDOWN FINANCIAL CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      
                      {/* 1. Cash Deposit Card */}
                      <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                            <DollarSign size={15} className="text-emerald-700" />
                            ۱. مبلغ واریز نقدی (پیش‌پرداخت {effectiveCashPercent}٪)
                          </span>
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                            واریز به حساب
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-emerald-200/70 text-right space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block">مبلغ نقدی قابل پرداخت:</span>
                          <span className="text-base sm:text-lg font-mono font-black text-emerald-700 block">
                            {cashPortionAmount.toLocaleString()} تومان
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-600 font-bold space-y-1 bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                          <div>بانک: <strong className="text-slate-800">{bankAccount.bankName}</strong></div>
                          <div>شبا: <strong className="font-mono text-emerald-800" dir="ltr">{bankAccount.shabaNumber || bankAccount.sheba}</strong></div>
                          <div>کارت: <strong className="font-mono text-slate-800" dir="ltr">{bankAccount.cardNumber}</strong></div>
                        </div>

                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            id="cash-receipt-split-input"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const r = new FileReader();
                                r.onloadend = () => setPaymentReceiptImage(r.result as string);
                                r.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor="cash-receipt-split-input"
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Upload size={13} />
                            <span>{paymentReceiptImage ? "تغییر تصویر فیش نقدی" : "آپلود فیش واریز پیش‌پرداخت"}</span>
                          </label>
                          {paymentReceiptImage && (
                            <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1 mt-1.5 justify-center">
                              <CheckCircle2 size={13} /> فیش واریزی پیش‌پرداخت دریافت شد
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2. Cheque Card */}
                      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                            <Receipt size={15} className="text-indigo-700" />
                            ۲. مبلغ چک صیادی ({effectiveChequePercent}٪ فاکتور)
                          </span>
                          <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                            چک صیادی بنفش
                          </span>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-indigo-200/70 text-right space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold block">مبلغ مندرج روی چک صیادی:</span>
                          <span className="text-base sm:text-lg font-mono font-black text-indigo-700 block">
                            {chequePortionAmount.toLocaleString()} تومان
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-600 font-bold space-y-1 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                          <div>سررسید: <strong className="text-indigo-900 font-mono">{chequeDays} روزه ({computedDueDate})</strong></div>
                          <div>وضعیت کارمزد: <strong className="text-slate-800">+{chequeMarkupAmount.toLocaleString()} تومان ({chequeMonths * chequeMarkupPerMonth}٪)</strong></div>
                        </div>

                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            id="cheque-image-split-input"
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const r = new FileReader();
                                r.onloadend = () => setChequeImage(r.result as string);
                                r.readAsDataURL(file);
                              }
                            }}
                          />
                          <label
                            htmlFor="cheque-image-split-input"
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                          >
                            <Upload size={13} />
                            <span>{chequeImage ? "تغییر تصویر چک" : "آپلود تصویر چک صیادی"}</span>
                          </label>
                          {chequeImage && (
                            <span className="text-[10px] text-emerald-700 font-black flex items-center gap-1 mt-1.5 justify-center">
                              <CheckCircle2 size={13} /> تصویر روی چک صیادی دریافت شد
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cheque Info Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1.5">شماره صیادی ۱۶ رقمی چک *</label>
                        <input
                          type="text"
                          value={chequeSayadiNo}
                          onChange={e => setChequeSayadiNo(e.target.value)}
                          placeholder="مثال: 8839029102938102"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-black text-slate-700 mb-1.5">نام بانک صادرکننده</label>
                        <input
                          type="text"
                          value={chequeBankName}
                          onChange={e => setChequeBankName(e.target.value)}
                          placeholder="مثال: بانک صادرات"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: FINAL SUMMARY & SUBMIT */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200/90 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
                  <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <h3 className="text-xs font-black text-emerald-950">پیش‌فاکتور رسمی آماده صدور می‌باشد</h3>
                    <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                      پس از تایید، فایل پیش‌فاکتور مستقیم کارخانه صادر و امکان چاپ یا دانلود PDF بلافاصله فعال می‌شود.
                    </p>
                  </div>
                </div>

                {/* Items Thumbnails Summary */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                  <span className="text-[11px] font-black text-slate-600 block">اقلام نهایی سفارش ({cart.length} کالا):</span>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {cart.map((item, idx) => {
                      const img = getProductImage(item);
                      return (
                        <div key={`summary-cart-${item.productId || idx}-${idx}`} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
                          {img ? (
                            <img src={img} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center text-xs">📦</div>
                          )}
                          <div className="text-right">
                            <span className="text-[10px] font-black text-slate-800 block truncate max-w-[120px]">{item.name}</span>
                            <span className="text-[9px] text-emerald-700 font-mono font-bold block">{item.quantityCartons} کارتن</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Settlement & Financial Breakdown Summary Table */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 text-xs font-bold shadow-xs">
                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-2">
                    <span>مجموع قیمت ناخالص کالاها ({totalCartons} کارتن - {estimatedWeightKg} ک‌گ):</span>
                    <span className="font-mono text-slate-900 font-black">{totalAmount.toLocaleString()} تومان</span>
                  </div>

                  {tierDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-amber-700 bg-amber-50/70 px-2.5 py-1.5 rounded-xl border border-amber-200/80">
                      <span className="flex items-center gap-1 font-black">
                        <span>🎁</span>
                        <span>تخفیف پلکانی تیراژ سفارش ({tierDiscountPercent}٪):</span>
                      </span>
                      <span className="font-mono font-black">-{tierDiscountAmount.toLocaleString()} تومان</span>
                    </div>
                  )}

                  {badgeDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-purple-700 bg-purple-50/70 px-2.5 py-1.5 rounded-xl border border-purple-200/80">
                      <span className="font-black">تخفیف سطح همکاری و رتبه ({badgeDiscountPercent}٪):</span>
                      <span className="font-mono font-black">-{badgeDiscountAmount.toLocaleString()} تومان</span>
                    </div>
                  )}

                  {paymentMethod === 'cash' && cashDiscountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/70 px-2.5 py-1.5 rounded-xl border border-emerald-200/80">
                      <span className="font-black">تخفیف تسویه نقدی ({cashDiscountPercent}٪):</span>
                      <span className="font-mono font-black">-{cashDiscountAmount.toLocaleString()} تومان</span>
                    </div>
                  )}

                  {paymentMethod === 'cheque' && chequeMarkupAmount > 0 && (
                    <div className="flex justify-between items-center text-indigo-700 bg-indigo-50/70 px-2.5 py-1.5 rounded-xl border border-indigo-200/80">
                      <span className="font-black">کارمزد تسویه چکی ({chequeDays} روزه - +{chequeMarkupPercent}٪):</span>
                      <span className="font-mono font-black">+{chequeMarkupAmount.toLocaleString()} تومان</span>
                    </div>
                  )}

                  {totalDiscounts > 0 && (
                    <div className="flex justify-between text-emerald-800 font-black pt-1 border-t border-slate-100">
                      <span>مجموع کل تخفیفات اعمال شده:</span>
                      <span className="font-mono font-black text-emerald-600">-{totalDiscounts.toLocaleString()} تومان</span>
                    </div>
                  )}

                  {/* Dual Settlement Breakdown in Summary */}
                  {paymentMethod === 'cheque' && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <div className="text-[11px] font-black text-slate-800 pb-1 border-b border-slate-200 flex justify-between">
                        <span>تفکیک و جزئیات تسویه چکی کارخانه:</span>
                        <span className="text-indigo-700 font-mono font-black">{splitCashPercent}٪ نقد + {100 - splitCashPercent}٪ چک</span>
                      </div>

                      <div className="flex justify-between text-emerald-800 font-bold">
                        <span className="flex items-center gap-1">
                          <DollarSign size={14} className="text-emerald-600" />
                          مبلغ واریز نقدی (پیش‌پرداخت {effectiveCashPercent}٪):
                        </span>
                        <span className="font-mono font-black">{cashPortionAmount.toLocaleString()} تومان</span>
                      </div>

                      <div className="flex justify-between text-indigo-900 font-bold">
                        <span className="flex items-center gap-1">
                          <Receipt size={14} className="text-indigo-600" />
                          مبلغ مندرج در چک صیادی ({effectiveChequePercent}٪):
                        </span>
                        <span className="font-mono font-black">{chequePortionAmount.toLocaleString()} تومان</span>
                      </div>

                      <div className="flex justify-between text-slate-600 font-bold pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-500" />
                          سررسید چک صیادی:
                        </span>
                        <span className="font-mono font-black text-slate-900">{chequeDays} روزه ({computedDueDateLong})</span>
                      </div>

                      {chequeSayadiNo && (
                        <div className="flex justify-between text-slate-600 font-bold text-[11px]">
                          <span>شماره صیادی ۱۶ رقمی:</span>
                          <span className="font-mono font-black text-slate-800" dir="ltr">{chequeSayadiNo}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 border-b border-slate-100 pb-2">
                    <span>تحویل‌گیرنده و آدرس:</span>
                    <span className="text-slate-900 font-black truncate max-w-xs">{buyerName} ({buyerPhone})</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black pt-1">
                    <span className="text-slate-900">مجموع کل صورتحساب فاکتور:</span>
                    <span className="text-lg font-black text-emerald-600 font-mono">
                      {finalPayableAmount.toLocaleString()} تومان
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clean Pure White Footer Navigation Actions */}
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200/90 flex justify-between items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              >
                <ChevronRight size={16} />
                <span>قبلی</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight size={15} />
                <span>بازگشت و ادامه انتخاب کالا</span>
              </button>
            )}

            {step === 1 && (
              <div className="flex items-center gap-2">
                {isDeliveryInfoComplete && (
                  <button
                    type="button"
                    onClick={handleQuickCheckout}
                    className="px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-xl text-[10px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Zap size={14} className="fill-amber-700" />
                    <span>خرید سریع (تایید آدرس ذخیره شده)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <span>ادامه: مشخصات تحویل</span>
                  <ChevronLeft size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>ادامه: روش تسویه</span>
                <ChevronLeft size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNextFromStep3}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <span>ادامه: پیش‌فاکتور نهایی</span>
                <ChevronLeft size={16} />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>در حال صدور فاکتور...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>تایید نهایی و صدور فاکتور کارخانه</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Cheque Charter Modal inside Wizard */}
      <ChequeCharterModal
        isOpen={showCharterModal}
        onClose={() => setShowCharterModal(false)}
        userCredit={Number((user as any)?.buyerCredit ?? (b2bConfig?.buyerCredit ?? 50000000))}
      />
    </AnimatePresence>
  );
}
