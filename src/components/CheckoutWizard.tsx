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
  Package
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from '../lib/firebase-mock';
import { db } from '../lib/firebase';
import { recordCRMOrder } from '../lib/crm-helper';
import { CartItem, Product, User } from '../types';

interface CheckoutWizardProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, newCartons: number) => void;
  onRemoveItem: (productId: string) => void;
  totalAmount: number;
  user: User | null;
  userBadge: string;
  b2bConfig: any;
  onOrderSuccess: (orderData: any) => void;
  setShowAuthModal: (show: boolean) => void;
  products: Product[];
}

export default function CheckoutWizard({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  totalAmount,
  user,
  userBadge,
  b2bConfig,
  onOrderSuccess,
  setShowAuthModal,
  products
}: CheckoutWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);


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
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'cheque'>('cash');
  const [paymentReceiptImage, setPaymentReceiptImage] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");

  // Cheque Details State
  const [chequeSayadiNo, setChequeSayadiNo] = useState("");
  const [chequeBankName, setChequeBankName] = useState("بانک ملی");
  const [chequeMonths, setChequeMonths] = useState<number>(2); // Default 2 months
  const [chequeDueDate, setChequeDueDate] = useState("");
  const [chequeImage, setChequeImage] = useState("");

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Helper to resolve REAL product image safely
  const getProductImage = (item: CartItem) => {
    const prod = products.find(p => p.id === item.productId || p.name === item.name);
    if (prod?.image_url && prod.image_url.trim() !== '') {
      return prod.image_url;
    }
    if (item.image_url && item.image_url.trim() !== '' && !item.image_url.includes('unsplash.com/photo-1558961363')) {
      return item.image_url;
    }
    return prod?.image_url || item.image_url || "";
  };

  // Config values
  const invSettings = b2bConfig?.invoiceSettings || {};
  const cashDiscountPercent = invSettings.cashDiscountPercent !== undefined ? invSettings.cashDiscountPercent : 5;
  const chequeMarkupPerMonth = invSettings.chequeMarkupPerMonthPercent !== undefined ? invSettings.chequeMarkupPerMonthPercent : 6;
  const minOrderAmount = b2bConfig?.minOrderAmount || 3000000;
  const minOrderCartons = b2bConfig?.minOrderCartons || 3;

  const totalCartons = cart.reduce((sum, item) => sum + item.quantityCartons, 0);
  const totalUnits = cart.reduce((sum, item) => sum + item.totalItems, 0);
  
  // Weight estimation: average 10-14kg per carton
  const estimatedWeightKg = totalCartons * 12;

  // Calculations
  const cashDiscountAmount = paymentMethod === 'cash' ? Math.round(totalAmount * (cashDiscountPercent / 100)) : 0;
  const couponDiscountAmount = 0;
  const chequeMarkupPercent = paymentMethod === 'cheque' ? chequeMonths * chequeMarkupPerMonth : 0;
  const chequeMarkupAmount = paymentMethod === 'cheque' ? Math.round(totalAmount * (chequeMarkupPercent / 100)) : 0;
  
  const totalDiscounts = cashDiscountAmount;
  const finalPayableAmount = Math.max(0, totalAmount - totalDiscounts + chequeMarkupAmount);

  const bankAccount = (invSettings.bankAccounts && invSettings.bankAccounts.length > 0)
    ? invSettings.bankAccounts[0]
    : {
        bankName: "بانک ملی ایران",
        accountNumber: "۰۱۰۲۹۳۸۴۷۵۰۰۱",
        cardNumber: "۶۰۳۷-۹۹۷۵-۸۸۳۴-۱۲۹۰",
        shabaNumber: "IR620170000000102938475001",
        ownerName: "پلتفرم بازرگانی دست اول"
      };

  const handleNextFromStep1 = () => {
    setErrorMessage("");
    if (cart.length === 0) {
      setErrorMessage("سبد خرید شما خالی است.");
      return;
    }
    if (totalAmount < minOrderAmount) {
      setErrorMessage(`حداقل مبلغ سفارش ${minOrderAmount.toLocaleString()} تومان می‌باشد. (مبلغ فعلی: ${totalAmount.toLocaleString()} تومان)`);
      return;
    }
    if (totalCartons < minOrderCartons) {
      setErrorMessage(`حداقل تعداد سفارش ${minOrderCartons} کارتن می‌باشد. (تعداد فعلی: ${totalCartons} کارتن)`);
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
      if (!chequeSayadiNo.trim() && !chequeImage) {
        setErrorMessage("لطفاً شماره صیادی یا تصویر چک را وارد/آپلود نمایید.");
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
        discountAmount: cashDiscountAmount,
        discountBreakdown: {
          badge: 0,
          bulk: 0,
          cash: cashDiscountAmount,
          chequeMarkup: chequeMarkupAmount,
          chequeMonths: paymentMethod === 'cheque' ? chequeMonths : 0,
          chequeMarkupPercent
        },
        paymentMethod,
        receiptUrl: paymentMethod === 'cash' ? (paymentReceiptImage || null) : null,
        receiptNumber: paymentMethod === 'cash' ? (receiptNumber || null) : null,
        chequeDetails: paymentMethod === 'cheque' ? {
          sayadiNumber: chequeSayadiNo,
          bankName: chequeBankName,
          months: chequeMonths,
          dueDate: chequeDueDate,
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden text-right flex flex-col max-h-[90vh] font-sans border border-slate-100"
        >
          {/* Header & Step Indicator */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-base font-black">صدور پیش‌فاکتور و ثبت سفارش عمده</h2>
                  <p className="text-[10px] text-slate-400 font-bold">فرآیند ۴ مرحله‌ای شفاف و مستقیم با خط تولید</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="tel:09999123001"
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black transition-all shadow-xs group"
                  title="تماس تلفنی با پشتیبانی مشتریان"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                    <PhoneCall size={12} className="animate-pulse" />
                  </div>
                  <span>پشتیبانی مشتریان</span>
                </a>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Step Wizard Bar */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
              {[
                { id: 1, label: "۱. سبد خرید" },
                { id: 2, label: "۲. تحویل و آدرس" },
                { id: 3, label: "۳. تسویه و مدارک" },
                { id: 4, label: "۴. تایید نهایی" }
              ].map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    if (s.id < step) setStep(s.id as any);
                  }}
                  className={`py-2 px-1 text-center rounded-xl text-[10px] sm:text-xs font-black transition-all ${
                    step === s.id
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : step > s.id
                      ? "bg-slate-800 text-emerald-400 cursor-pointer"
                      : "bg-slate-800/50 text-slate-500"
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: CART REVIEW */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800">بررسی و ویرایش اقلام سفارش</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span>مجموع: <span className="text-slate-900 font-mono font-black">{totalCartons}</span> کارتن</span>
                    <span className="text-slate-300">|</span>
                    <span>وزن تخمینی: <span className="text-emerald-700 font-mono font-black">{estimatedWeightKg}</span> ک‌گ</span>
                  </div>
                </div>

                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3">
                    <ShoppingBag size={48} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold">سبد خرید شما خالی است.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {cart.map((item) => {
                      const realImage = getProductImage(item);
                      const matchedProd = products.find(p => p.id === item.productId || p.name === item.name);
                      const packCount = matchedProd?.carton_pack_count || item.unitsPerCarton || 24;
                      const unitPrice = Math.round(item.pricePerCarton / packCount);

                      return (
                        <div
                          key={item.productId}
                          className="bg-slate-50 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {realImage ? (
                              <img
                                src={realImage}
                                alt={item.name}
                                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 bg-white shadow-xs"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-2xl bg-slate-200/70 border border-slate-300/60 flex flex-col items-center justify-center shrink-0 text-slate-500">
                                <Package size={18} className="text-slate-400 stroke-[1.5]" />
                                <span className="text-[8px] font-black text-slate-400 mt-0.5">بدون تصویر</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-1">
                                <span className="bg-emerald-100/70 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                                  {item.pricePerCarton.toLocaleString()} تومان/کارتن
                                </span>
                                <span>({packCount} عدد در کارتن - عددی {unitPrice.toLocaleString()} ت)</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                              <button
                                onClick={() => onUpdateQuantity(item.productId, item.quantityCartons + 1)}
                                className="p-1 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
                                title="افزایش یک کارتن"
                              >
                                <Plus size={14} />
                              </button>
                              <span className="px-2 text-xs font-black font-mono text-slate-900">
                                {item.quantityCartons} کارتن
                              </span>
                              <button
                                onClick={() => {
                                  if (item.quantityCartons > 1) {
                                    onUpdateQuantity(item.productId, item.quantityCartons - 1);
                                  } else {
                                    onRemoveItem(item.productId);
                                  }
                                }}
                                className="p-1 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer"
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

                {/* Weight Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between text-xs font-bold text-slate-700">
                    <div className="flex justify-between items-center">
                      <span>تاییدیه قیمت پایه کارخانه:</span>
                      <span className="font-black text-indigo-600">صددرصد واقعی</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      تمامی نرخ‌ها بر اساس مصوبه رسمی خط تولید بدون واسطه اعمال گردیده‌اند.
                    </div>
                  </div>

                  <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-200/50 flex flex-col justify-between text-xs font-bold text-indigo-900">
                    <div className="flex justify-between items-center">
                      <span>تخمین خودرو ترابری:</span>
                      <span className="font-black text-indigo-700">
                        {estimatedWeightKg < 1500 ? "وانت / نیسان بار" : estimatedWeightKg < 5000 ? "کامیونت خاور ۶ تنی" : "کامیون تک / جفت ۲۰ تنی"}
                      </span>
                    </div>
                    <div className="text-[10px] text-indigo-700 font-normal">
                      وزن ناخالص مرسوله: حدود <strong className="font-mono font-black">{estimatedWeightKg}</strong> کیلوگرم ({totalUnits} واحد کالا)
                    </div>
                  </div>
                </div>

                {/* Min Order Notice */}
                <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-2xl text-[11px] text-amber-800 font-bold flex justify-between items-center">
                  <span>شرایط حداقل سفارش:</span>
                  <span>حداقل ۳ کارتن / ۳,۰۰۰,۰۰۰ تومان</span>
                </div>
              </div>
            )}

            {/* STEP 2: DELIVERY & SHIPPING INFO */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-600" />
                    مشخصات خریدار و آدرس تخلیه بار
                  </h3>
                  { (user?.name || user?.phone || user?.address) && (
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      اطلاعات از حساب شما فراخوانی شد
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">نام و نام خانوادگی تحویل‌گیرنده *</label>
                    <input
                      type="text"
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      placeholder="مثال: علی رضایی"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 mb-1">شماره تماس (جهت هماهنگی باربری) *</label>
                    <input
                      type="text"
                      value={buyerPhone}
                      onChange={e => setBuyerPhone(e.target.value)}
                      placeholder="مثال: 09121111111"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-slate-800 outline-none focus:border-emerald-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">نام بنکداری / فروشگاه / شرکت</label>
                  <input
                    type="text"
                    value={buyerCompany}
                    onChange={e => setBuyerCompany(e.target.value)}
                    placeholder="مثال: بازرگانی البرز"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1">آدرس دقیق تخلیه بار *</label>
                  <textarea
                    rows={2}
                    value={buyerAddress}
                    onChange={e => setBuyerAddress(e.target.value)}
                    placeholder="مثال: تهران، خیابان خیام، انبار مرکزی توزیع..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                  />
                  {/* Quick-fill address selectors */}
                  <div className="flex gap-1.5 flex-wrap mt-1.5 justify-start">
                    {[
                      { label: "🏢 انبار مرکزی تهران (شوش)", val: "تهران، میدان شوش، خیابان صابونیان، انبار مرکزی بازرگانی" },
                      { label: "🚛 باربری پایانه اصفهان", val: "اصفهان، بزرگراه امیرکبیر، پایانه ترابری شرق، غرفه باربری همکار" },
                      { label: "🚚 انبار پخش مشهد", val: "مشهد، بلوار مصلی، بین مصلی ۳۰ و ۳۲، مجتمع اداری پخش پارس" }
                    ].map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setBuyerAddress(opt.val);
                          if (!buyerCompany) setBuyerCompany(opt.label.substring(2));
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-black cursor-pointer transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="block text-[10px] font-black text-slate-500">روش ارسال و ترابری جاده‌ای</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'barbari', name: 'باربری جاده‌ای', icon: '🚛' },
                      { id: 'khavar', name: 'کامیونت / خاور', icon: '🚚' },
                      { id: 'deka', name: 'اکسپرس (دکا)', icon: '📦' },
                      { id: 'personal', name: 'تحویل حضوری', icon: '🏭' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setShippingMethod(m.id)}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          shippingMethod === m.id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-xl block mb-1">{m.icon}</span>
                        <span className="text-[10px] font-black">{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PAYMENT & DOCUMENTS */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-emerald-600" />
                  انتخاب روش تسویه و مدارک پرداخت
                </h3>

                {/* Method selector tabs */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      paymentMethod === 'cash'
                        ? "border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-slate-900">پرداخت نقدی (پیش‌فاکتور)</span>
                      <DollarSign size={18} className="text-emerald-600" />
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md inline-block w-max">
                      🎉 {cashDiscountPercent}٪ تخفیف ویژه نقدی
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cheque')}
                    className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      paymentMethod === 'cheque'
                        ? "border-indigo-500 bg-indigo-50/80 shadow-md ring-2 ring-indigo-500/20"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-slate-900">پرداخت چکی (اقساط صیادی)</span>
                      <Receipt size={18} className="text-indigo-600" />
                    </div>
                    <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100/80 px-2 py-0.5 rounded-md inline-block w-max">
                      کارتن عمده چکی صیادی
                    </span>
                  </button>
                </div>

                {/* Cash Options Details */}
                {paymentMethod === 'cash' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <Building size={16} className="text-emerald-600" />
                      اطلاعات حساب جهت واریز وجه
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs font-bold">
                      <div className="flex justify-between text-slate-600">
                        <span>نام بانک و صاحب حساب:</span>
                        <span className="text-slate-900 font-black">{bankAccount.bankName} - {bankAccount.ownerName}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>شماره شبا:</span>
                        <span className="font-mono text-emerald-700 font-black" dir="ltr">{bankAccount.shabaNumber}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>شماره کارت:</span>
                        <span className="font-mono text-slate-900 font-black" dir="ltr">{bankAccount.cardNumber}</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">آپلود فیش واریزی (اختیاری)</label>
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
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <Upload size={14} />
                          <span>{paymentReceiptImage ? "تغییر تصویر فیش" : "انتخاب فیش واریزی"}</span>
                        </label>
                        {paymentReceiptImage && (
                          <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1">
                            <CheckCircle2 size={14} /> آپلود شد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cheque Options Details */}
                {paymentMethod === 'cheque' && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800">تعیین مدت چک (ماه):</span>
                      <span className="text-[10px] font-black text-indigo-600">
                        افزایش {chequeMarkupPerMonth}٪ به ازای هر ماه
                      </span>
                    </div>

                    {/* Month selector pills */}
                    <div className="grid grid-cols-6 gap-1.5">
                      {[1, 2, 3, 4, 5, 6].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setChequeMonths(m)}
                          className={`py-2 rounded-xl text-xs font-black transition-all ${
                            chequeMonths === m
                              ? "bg-indigo-600 text-white shadow-md"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {m} ماهه
                          <span className="block text-[8px] opacity-80">+{m * chequeMarkupPerMonth}٪</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1">شماره صیادی ۱۶ رقمی چک</label>
                        <input
                          type="text"
                          value={chequeSayadiNo}
                          onChange={e => setChequeSayadiNo(e.target.value)}
                          placeholder="مثال: 8839029102938102"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 mb-1">نام بانک صادرکننده</label>
                        <input
                          type="text"
                          value={chequeBankName}
                          onChange={e => setChequeBankName(e.target.value)}
                          placeholder="مثال: بانک صادرات"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-500 mb-1">آپلود تصویر روی چک صیادی</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          id="cheque-image-input"
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
                          htmlFor="cheque-image-input"
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                          <Upload size={14} />
                          <span>{chequeImage ? "تغییر تصویر چک" : "آپلود تصویر چک صیادی"}</span>
                        </label>
                        {chequeImage && (
                          <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1">
                            <CheckCircle2 size={14} /> آپلود شد
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: FINAL SUMMARY & SUBMIT */}
            {step === 4 && (
              <div className="space-y-5">
                <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex items-center gap-3">
                  <ShieldCheck className="text-emerald-600 shrink-0" size={24} />
                  <div>
                    <h3 className="text-xs font-black text-emerald-900">پیش‌فاکتور نهایی آماده صدور می‌باشد</h3>
                    <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                      پس از ثبت، فایل پیش‌فاکتور مستقیم کارخانه صادر و امکان چاپ یا دانلود PDF بلافاصله فعال می‌شود.
                    </p>
                  </div>
                </div>

                {/* Items Thumbnails Summary */}
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                  <span className="text-[10px] font-black text-slate-500 block">اقلام نهایی سفارش ({cart.length} کالا):</span>
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {cart.map((item) => {
                      const img = getProductImage(item);
                      return (
                        <div key={item.productId} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shrink-0">
                          <img src={img} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
                          <div className="text-right">
                            <span className="text-[10px] font-black text-slate-800 block truncate max-w-[120px]">{item.name}</span>
                            <span className="text-[9px] text-emerald-700 font-mono font-bold block">{item.quantityCartons} کارتن</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Breakdown Summary Table */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs font-bold">
                  <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-2">
                    <span>مجموع قیمت ناخالص کالاها ({totalCartons} کارتن - {estimatedWeightKg} ک‌گ):</span>
                    <span className="font-mono text-slate-900">{totalAmount.toLocaleString()} تومان</span>
                  </div>

                  {paymentMethod === 'cash' && cashDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>تخفیف تسویه نقدی ({cashDiscountPercent}٪):</span>
                      <span className="font-mono">-{cashDiscountAmount.toLocaleString()} تومان</span>
                    </div>
                  )}


                  {paymentMethod === 'cheque' && chequeMarkupAmount > 0 && (
                    <div className="flex justify-between text-indigo-600">
                      <span>کارمزد تسویه چکی ({chequeMonths} ماهه - +{chequeMarkupPercent}٪):</span>
                      <span className="font-mono">+{chequeMarkupAmount.toLocaleString()} تومان</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-2">
                    <span>تحویل‌گیرنده و آدرس:</span>
                    <span className="text-slate-900 font-black truncate max-w-xs">{buyerName} ({buyerPhone})</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black pt-1">
                    <span className="text-slate-800">مبلغ خالص نهایی فاکتور:</span>
                    <span className="text-lg font-black text-emerald-600 font-mono">
                      {finalPayableAmount.toLocaleString()} تومان
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Navigation Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as any)}
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
              >
                <ChevronRight size={16} />
                <span>قبلی</span>
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-colors"
              >
                <span>ادامه: مشخصات تحویل</span>
                <ChevronLeft size={16} />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-colors"
              >
                <span>ادامه: روش تسویه</span>
                <ChevronLeft size={16} />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleNextFromStep3}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-colors"
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
    </AnimatePresence>
  );
}
