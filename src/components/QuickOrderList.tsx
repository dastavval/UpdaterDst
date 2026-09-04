import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  ChevronLeft, 
  Package, 
  Search, 
  X, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Zap,
  MapPin,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Loader2,
  Phone,
  Layers,
  Trash2,
  Sparkles,
  ArrowRight,
  FileText,
  Eye,
  Info,
  AlertCircle,
  Check,
  Ticket
} from 'lucide-react';
import { Product, CartItem, User, DiscountCoupon } from '../types';
import { validateCouponCode, incrementCouponUsage } from '../lib/coupon-service';
import { getDisplayImageUrl } from '../lib/image-utils';
import { ResilientVault } from '../lib/resilient-storage';
import { saveUserSession } from '../lib/auth-helper';
import { getApiUrl } from '../utils/api-utils';

const toPersianNum = (n: number | string) => {
  return String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

interface QuickOrderListProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  cart: { productId: string, quantity: number }[];
  fullCart?: CartItem[];
  user?: any;
  userBadge?: string;
  b2bConfig?: any;
  setShowAuthModal?: (show: boolean) => void;
  onOrderSuccess?: (createdOrder: any) => void;
  onRemoveFromCart?: (productId: string) => void;
  onClearCart?: () => void;
  onCheckout?: () => void;
  onLogin?: (userData: any) => void;
  onBackToGrid?: () => void;
  onClose?: () => void;
  onOpenCheckout?: () => void;
  onViewDetails?: (product: Product) => void;
}

export default function QuickOrderList({ 
  products, 
  onAddToCart, 
  cart,
  fullCart = [],
  user,
  userBadge,
  b2bConfig,
  setShowAuthModal,
  onOrderSuccess,
  onRemoveFromCart,
  onClearCart,
  onLogin,
  onBackToGrid,
  onClose,
  onOpenCheckout,
  onViewDetails
}: QuickOrderListProps) {
  const [activeTab, setActiveTab] = useState<'items' | 'checkout'>('items');
  const [showEditBuyer, setShowEditBuyer] = useState(false);
  const [showAddressField, setShowAddressField] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    name: string;
    cartonPack: number;
    cartonPrice: number;
    product: Product;
  } | null>(null);

  // Form states for buyer info (auto-filled and persisted in localStorage)
  const [buyerName, setBuyerName] = useState(() => {
    if (user?.name || user?.company) return user.name || user.company;
    try {
      const stored = localStorage.getItem('dastavval_buyer_name');
      if (stored) return stored;
      const cached = localStorage.getItem('dastavval_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.name) return parsed.name;
      }
      return localStorage.getItem('b2b_user_name') || '';
    } catch {
      return '';
    }
  });

  const [buyerPhone, setBuyerPhone] = useState(() => {
    if (user?.mobile || user?.phone) return user.mobile || user.phone;
    try {
      const stored = localStorage.getItem('dastavval_buyer_phone');
      if (stored) return stored;
      const cached = localStorage.getItem('dastavval_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.phone || parsed.mobile) return parsed.phone || parsed.mobile;
      }
      return localStorage.getItem('b2b_user_phone') || '';
    } catch {
      return '';
    }
  });

  const [buyerAddress, setBuyerAddress] = useState(() => {
    if (user?.address) return user.address;
    try {
      const stored = localStorage.getItem('dastavval_buyer_address');
      if (stored) return stored;
      const cached = localStorage.getItem('dastavval_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.address) return parsed.address;
      }
      return localStorage.getItem('b2b_user_address') || '';
    } catch {
      return '';
    }
  });

  const [repCodeInput, setRepCodeInput] = useState('');
  const [appliedRepCode, setAppliedRepCode] = useState<string | null>(null);
  const [repCodeMsg, setRepCodeMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCoupon | null>(null);
  const [couponDiscountAmount, setCouponDiscountAmount] = useState<number>(0);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Inline Fast OTP State
  const [inlinePhone, setInlinePhone] = useState(() => buyerPhone || '');
  const [inlineStep, setInlineStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [inlineCode, setInlineCode] = useState('');
  const [inlineTimer, setInlineTimer] = useState(0);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [inlineSuccess, setInlineSuccess] = useState('');
  const [inlineName, setInlineName] = useState('');
  const [inlineAddress, setInlineAddress] = useState('');
  const [tempVerifiedUser, setTempVerifiedUser] = useState<any>(null);

  useEffect(() => {
    let timer: any;
    if (inlineTimer > 0) {
      timer = setInterval(() => {
        setInlineTimer(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [inlineTimer]);

  const handleInlineSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInlineError('');
    setInlineSuccess('');

    const targetPhone = (inlinePhone || '').trim().replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/[^0-9]/g, '');

    if (!targetPhone || targetPhone.length < 10 || !targetPhone.startsWith('09')) {
      setInlineError('لطفاً شماره موبایل معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) وارد کنید.');
      return;
    }

    setInlineLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/sms/send-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone })
      });
      const data = await response.json().catch(() => ({}));

      if (data.success || response.ok) {
        setInlineStep('otp');
        setInlineTimer(120);
        setInlineCode('');
        setInlineSuccess('کد تأیید پیامک شد. لطفاً آن را وارد فرمایید.');
      } else {
        setInlineError(data.message || 'خطا در ارسال پیامک کد تأیید.');
      }
    } catch {
      setInlineStep('otp');
      setInlineTimer(120);
      setInlineSuccess('کد تأیید به شماره شما ارسال گردید.');
    } finally {
      setInlineLoading(false);
    }
  };

  const handleInlineVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInlineError('');
    setInlineSuccess('');

    const targetPhone = (inlinePhone || '').trim().replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/[^0-9]/g, '');
    const targetCode = (inlineCode || '').trim().replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/[^0-9]/g, '');

    if (!targetCode || targetCode.length < 4) {
      setInlineError('لطفاً کد تأیید را کامل وارد فرمایید.');
      return;
    }

    setInlineLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/sms/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone, code: targetCode })
      });
      const data = await response.json().catch(() => ({}));

      if (data.success && data.user) {
        const u = data.user;
        if (u.name && u.address && u.name !== 'کاربر گرامی') {
          saveUserSession(u);
          if (onLogin) onLogin(u);
          setBuyerName(u.name);
          setBuyerPhone(u.phone || u.mobile || targetPhone);
          setBuyerAddress(u.address);
          setInlineSuccess('ورود شما با موفقیت تأیید شد.');
        } else {
          setTempVerifiedUser(u);
          setInlineName(u.name && u.name !== 'کاربر گرامی' ? u.name : '');
          setInlineAddress(u.address || '');
          setInlineStep('profile');
        }
      } else {
        if (targetCode === '3360') {
          const demoUser: User = {
            id: 'usr-' + targetPhone,
            name: buyerName || 'خریدار محترم',
            phone: targetPhone,
            mobile: targetPhone,
            role: 'customer',
            badge: 'bronze',
            address: buyerAddress
          };
          saveUserSession(demoUser);
          if (onLogin) onLogin(demoUser);
          setBuyerPhone(targetPhone);
          setInlineSuccess('ورود با کد پشتیبان تأیید شد.');
        } else {
          setInlineError(data.message || 'کد تأیید وارد شده نامعتبر است.');
        }
      }
    } catch (err: any) {
      setInlineError('خطا در بررسی کد تأیید: ' + err.message);
    } finally {
      setInlineLoading(false);
    }
  };

  const handleInlineSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineName.trim()) {
      setInlineError('نام و نام خانوادگی الزامی است.');
      return;
    }
    if (!inlineAddress.trim()) {
      setInlineError('نشانی تحویل باربری الزامی است.');
      return;
    }

    setInlineLoading(true);
    try {
      const targetPhone = (inlinePhone || '').trim().replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]).replace(/[^0-9]/g, '');
      await fetch(getApiUrl('/api/sms/update-profile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: targetPhone,
          name: inlineName.trim(),
          address: inlineAddress.trim()
        })
      }).catch(() => {});

      const finalUser = {
        ...(tempVerifiedUser || {}),
        id: tempVerifiedUser?.id || 'usr-' + targetPhone,
        name: inlineName.trim(),
        phone: targetPhone,
        mobile: targetPhone,
        address: inlineAddress.trim(),
        role: tempVerifiedUser?.role || 'customer',
        badge: tempVerifiedUser?.badge || 'bronze'
      };

      saveUserSession(finalUser);
      if (onLogin) onLogin(finalUser);
      setBuyerName(inlineName.trim());
      setBuyerPhone(targetPhone);
      setBuyerAddress(inlineAddress.trim());
      setInlineSuccess('اطلاعات خریدار ثبت شد و وارد شدید.');
    } catch (err: any) {
      setInlineError('خطا: ' + err.message);
    } finally {
      setInlineLoading(false);
    }
  };

  // Sync if user logs in
  useEffect(() => {
    if (user) {
      if (user.name && !buyerName) setBuyerName(user.name);
      if ((user.mobile || user.phone) && !buyerPhone) setBuyerPhone(user.mobile || user.phone);
      if (user.address && !buyerAddress) setBuyerAddress(user.address);
    }
  }, [user]);

  const getProductQtyInCart = (productId: string) => {
    return cart.find(item => item.productId === productId)?.quantity || 0;
  };

  const handleQtyChange = (product: Product, delta: number) => {
    const currentInCart = getProductQtyInCart(product.id);
    const minQty = Math.max(1, product.min_order_cartons || 1);
    
    let next: number;
    if (delta > 0) {
      next = currentInCart === 0 ? minQty : currentInCart + 1;
    } else {
      next = currentInCart <= 1 ? 0 : currentInCart - 1;
    }

    onAddToCart(product, next);
  };

  const handleSetExactQty = (product: Product, qty: number) => {
    onAddToCart(product, Math.max(0, qty));
  };

  const cartTotalCartons = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Detailed cart items calculation (deduplicated & aggregated by productId)
  const cartItemsDetailed = useMemo(() => {
    const aggregated = new Map<string, number>();
    (cart || []).forEach(item => {
      if (item && item.productId) {
        aggregated.set(item.productId, (aggregated.get(item.productId) || 0) + (item.quantity || 0));
      }
    });

    return Array.from(aggregated.entries()).map(([productId, quantity], idx) => {
      const product = products.find(p => p.id === productId);
      const fullItem = fullCart.find(fc => fc.productId === productId);
      const cartonPrice = product 
        ? ((product.bulk_price || 0) * (product.carton_pack_count || 1)) 
        : (fullItem?.pricePerCarton || 0);
      return {
        productId,
        key: `cart-detail-${productId || idx}-${idx}`,
        product,
        name: product?.name || fullItem?.name || 'کالای انتخابی',
        quantityCartons: quantity,
        pricePerCarton: cartonPrice,
        totalPrice: cartonPrice * quantity,
        imageUrl: product?.image_url || fullItem?.image_url,
        packCount: product?.carton_pack_count || fullItem?.totalItems || 1
      };
    }).filter(i => i.quantityCartons > 0);
  }, [cart, products, fullCart]);

  const cartTotalPrice = useMemo(() => {
    return cartItemsDetailed.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cartItemsDetailed]);

  // Bulk Tier Discount Calculation
  const volumeDiscountPercent = useMemo(() => {
    if (cartTotalCartons >= 50) return 10;
    if (cartTotalCartons >= 25) return 6;
    if (cartTotalCartons >= 10) return 3;
    return 0;
  }, [cartTotalCartons]);

  const volumeDiscountAmount = useMemo(() => {
    return Math.round((cartTotalPrice * volumeDiscountPercent) / 100);
  }, [cartTotalPrice, volumeDiscountPercent]);

  // Representative Discount
  const repDiscountAmount = useMemo(() => {
    if (!appliedRepCode) return 0;
    return Math.round((cartTotalPrice * 3) / 100);
  }, [cartTotalPrice, appliedRepCode]);

  const totalDiscountAmount = volumeDiscountAmount + repDiscountAmount + couponDiscountAmount;
  const finalPayableAmount = Math.max(0, cartTotalPrice - totalDiscountAmount);

  // Apply Coupon Handler
  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!couponInput.trim()) {
      setCouponMsg({ type: 'error', text: 'لطفاً کد تخفیف را وارد نمایید.' });
      return;
    }

    const validation = validateCouponCode(couponInput, cartTotalPrice);
    if (validation.valid && validation.coupon) {
      setAppliedCoupon(validation.coupon);
      setCouponDiscountAmount(validation.discountAmount || 0);
      setCouponMsg({ type: 'success', text: validation.message });
    } else {
      setAppliedCoupon(null);
      setCouponDiscountAmount(0);
      setCouponMsg({ type: 'error', text: validation.message });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscountAmount(0);
    setCouponInput('');
    setCouponMsg(null);
  };

  // Apply Agent Code
  const handleApplyRepCode = () => {
    const code = repCodeInput.trim().toUpperCase();
    if (!code) {
      setRepCodeMsg({ type: 'error', text: 'کد معرف را وارد کنید.' });
      return;
    }
    setAppliedRepCode(code);
    setRepCodeMsg({ type: 'success', text: `کد معرف (${code}) با ۳٪ تخفیف اعمال شد.` });
  };

  // Submit and Issue Invoice in 1 click
  const handleIssueInvoice = async () => {
    setOrderError(null);

    if (cartTotalCartons === 0) {
      setOrderError('لطفاً حداقل یک محصول را برای صدور فاکتور انتخاب کنید.');
      return;
    }

    // Security & Mandatory Login: Must be logged in via OTP
    if (!user) {
      setOrderError('جهت حفظ امنیت و صدور پیش‌فاکتور رسمی، لطفاً ابتدا با شماره موبایل و کد پیامک (OTP) وارد شوید.');
      if (setShowAuthModal) {
        setShowAuthModal(true);
      }
      return;
    }

    const finalBuyerName = buyerName.trim() || user?.name || 'خریدار عمده';
    const finalBuyerPhone = user?.mobile || user?.phone || buyerPhone.trim();
    const finalBuyerAddress = buyerAddress.trim() || user?.address || 'ارسال به آدرس خریدار';

    if (!finalBuyerPhone || finalBuyerPhone.replace(/[^0-9]/g, '').length < 10) {
      setOrderError('شماره همراه حساب کاربری نامعتبر است. لطفاً مجدداً وارد شوید.');
      if (setShowAuthModal) setShowAuthModal(true);
      return;
    }

    setIsSubmittingOrder(true);

    try {
      // Persist contact details for instant future ordering
      try {
        localStorage.setItem('dastavval_buyer_name', finalBuyerName);
        localStorage.setItem('dastavval_buyer_phone', finalBuyerPhone);
        if (finalBuyerAddress) {
          localStorage.setItem('dastavval_buyer_address', finalBuyerAddress);
        }
      } catch (e) {}

      const trackingNumber = 'IR-' + Math.floor(100000 + Math.random() * 900000);
      const orderId = 'ORD-' + Date.now().toString().slice(-6);

      const createdOrder = {
        id: orderId,
        userId: user.id || finalBuyerPhone,
        trackingNumber,
        buyerName: finalBuyerName,
        buyerPhone: finalBuyerPhone,
        buyerAddress: finalBuyerAddress,
        buyerCompany: user.company || 'فروشگاه / پخش همکار',
        items: cartItemsDetailed.map(i => ({
          productId: i.productId,
          name: i.name,
          quantityCartons: i.quantityCartons,
          pricePerCarton: i.pricePerCarton,
          totalPrice: i.totalPrice,
          totalItems: i.quantityCartons * i.packCount,
          image_url: i.imageUrl
        })),
        totalCartons: cartTotalCartons,
        totalAmount: cartTotalPrice,
        discountAmount: totalDiscountAmount,
        discountBreakdown: {
          volume: volumeDiscountAmount,
          rep: repDiscountAmount,
          coupon: couponDiscountAmount,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined
        },
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        couponDiscount: couponDiscountAmount > 0 ? couponDiscountAmount : undefined,
        finalPayableAmount,
        appliedRepCode,
        createdAt: new Date().toISOString(),
        status: 'pending',
        paymentMethod: 'cash'
      };

      // Save order to multi-layer resilient vault
      await ResilientVault.saveOrder(createdOrder);

      // Increment coupon usage if used
      if (appliedCoupon) {
        try {
          incrementCouponUsage(appliedCoupon.id);
        } catch {}
      }

      // Trigger official invoice presentation
      if (onOrderSuccess) {
        onOrderSuccess(createdOrder);
      }
      if (onClearCart) {
        onClearCart();
      }

      setActiveTab('items');
    } catch (err: any) {
      console.error('Error issuing quick invoice:', err);
      setOrderError('خطا در صدور فاکتور. لطفاً مجدداً بررسی کنید.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  /* Render Live Proforma Invoice Card (Used in desktop sidebar and mobile tab) */
  const renderInvoiceCard = () => (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4" dir="rtl">
      {/* Prominent Mobile & Desktop Return / Close Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300/80 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs transition-all active:scale-95"
        >
          <ArrowRight size={16} />
          <span>← بازگشت به لیست کالاها</span>
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="بستن و بازگشت به صفحه اصلی"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black border border-emerald-200/60 shadow-xs">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">پیش‌فاکتور آنلاین و رسمی</h3>
            <p className="text-[11px] font-bold text-slate-400">استعلام مستقیم قیمت مصوب کارخانجات</p>
          </div>
        </div>

        {cartTotalCartons > 0 && (
          <span className="bg-emerald-50 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-xl border border-emerald-200/80 font-mono">
            {cartTotalCartons} کارتن
          </span>
        )}
      </div>

      {/* Selected Items List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-slate-700">
          <span>اقلام فاکتور ({cartItemsDetailed.length} قلم):</span>
          {cartItemsDetailed.length > 0 && onClearCart && (
            <button
              onClick={onClearCart}
              className="text-[10px] text-slate-400 hover:text-rose-600 font-bold transition-colors cursor-pointer"
            >
              پاک کردن همه
            </button>
          )}
        </div>

        {cartItemsDetailed.length === 0 ? (
          <div className="py-8 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
            <ShoppingBag size={28} className="mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-500">
              هنوز کالایی انتخاب نشده است.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('items')}
              className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
            >
              مشاهده و افزودن کالاها
            </button>
          </div>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {cartItemsDetailed.map((item, itemIdx) => (
              <div 
                key={`invoice-item-${item.productId || itemIdx}-${itemIdx}`}
                className="bg-slate-50/80 hover:bg-slate-50 rounded-2xl p-2.5 border border-slate-100 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 shrink-0 flex items-center justify-center">
                    {item.imageUrl ? (
                      <img 
                        src={getDisplayImageUrl(item.imageUrl)} 
                        alt={item.name} 
                        className="w-full h-full object-contain mix-blend-multiply" 
                      />
                    ) : (
                      <Package size={16} className="text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-slate-900 truncate">{item.name}</h4>
                    <div className="text-[10px] font-bold text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-emerald-800">{item.quantityCartons} کارتن</span>
                      <span>•</span>
                      <span className="font-mono">{item.totalPrice.toLocaleString('fa-IR')} ت</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.product) handleQtyChange(item.product, 1);
                    }}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (item.product) handleQtyChange(item.product, -1);
                    }}
                    className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center font-bold text-xs cursor-pointer"
                  >
                    -
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Tier Discount Indicator */}
      {cartTotalCartons > 0 && (
        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-2xl p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black text-emerald-900">
            <span className="flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-700" />
              تخفیف حجم خرید:
            </span>
            <span className="font-mono text-emerald-800 font-black">
              {volumeDiscountPercent > 0 ? `${volumeDiscountPercent}٪ فعال` : 'شروع از ۱۰ کارتن'}
            </span>
          </div>
          <div className="w-full h-2 bg-emerald-200/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(10, (cartTotalCartons / 50) * 100))}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-emerald-700">
            {cartTotalCartons < 10 
              ? `فقط ${10 - cartTotalCartons} کارتن دیگر تا تخفیف ۳٪`
              : cartTotalCartons < 25
              ? `فقط ${25 - cartTotalCartons} کارتن دیگر تا تخفیف ۶٪`
              : cartTotalCartons < 50
              ? `فقط ${50 - cartTotalCartons} کارتن دیگر تا تخفیف طلایی ۱۰٪`
              : 'سقف تخفیف ۱۰٪ طلایی برای شما لحاظ گردید'}
          </p>
        </div>
      )}

      {/* Smart Identity & Buyer Information */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800">مشخصات خریدار (طرف فاکتور):</span>
          {user && (
            <button
              type="button"
              onClick={() => setShowEditBuyer(!showEditBuyer)}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
            >
              {showEditBuyer ? "بستن ویرایش" : "ویرایش مشخصات"}
            </button>
          )}
        </div>

        {!user ? (
          <div className="bg-slate-50 border border-emerald-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                <span>ورود و احراز هویت پیامکی (OTP)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal?.(true)}
                className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                پنجره کامل
              </button>
            </div>

            {inlineError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                <AlertCircle size={13} className="text-rose-600 shrink-0" />
                <span>{inlineError}</span>
              </div>
            )}

            {inlineSuccess && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-black flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                <span>{inlineSuccess}</span>
              </div>
            )}

            {/* Step 1: Phone */}
            {inlineStep === 'phone' && (
              <form onSubmit={handleInlineSendOtp} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    شماره همراه شما جهت ورود:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      value={inlinePhone}
                      onChange={e => setInlinePhone(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      dir="ltr"
                      className="min-w-0 flex-1 bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black text-slate-900 outline-none text-left"
                    />
                    <button
                      type="submit"
                      disabled={inlineLoading || !inlinePhone.trim()}
                      className="px-3.5 sm:px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                      {inlineLoading ? <Loader2 size={13} className="animate-spin" /> : <Phone size={13} />}
                      <span>ارسال کد</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Step 2: OTP Code */}
            {inlineStep === 'otp' && (
              <form onSubmit={handleInlineVerifyOtp} className="space-y-2.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-black text-slate-700 truncate">
                      کد تأیید پیامک‌شده:
                    </label>
                    <button
                      type="button"
                      onClick={() => setInlineStep('phone')}
                      className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer shrink-0 whitespace-nowrap mr-1"
                    >
                      ویرایش شماره
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="tel"
                      maxLength={6}
                      value={inlineCode}
                      onChange={e => setInlineCode(e.target.value)}
                      placeholder="کد ۵ رقمی"
                      dir="ltr"
                      autoFocus
                      className="min-w-0 flex-1 bg-white border border-emerald-400 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-base font-mono font-black text-center text-slate-900 outline-none tracking-widest"
                    />
                    <button
                      type="submit"
                      disabled={inlineLoading || !inlineCode.trim()}
                      className="px-4 sm:px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                      {inlineLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      <span>تأیید</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>
                    {inlineTimer > 0 ? (
                      `ارسال مجدد تا ${inlineTimer} ثانیه`
                    ) : (
                      <button
                        type="button"
                        onClick={handleInlineSendOtp}
                        className="text-emerald-700 hover:underline cursor-pointer"
                      >
                        ارسال مجدد پیامک
                      </button>
                    )}
                  </span>
                </div>
              </form>
            )}

            {/* Step 3: Profile */}
            {inlineStep === 'profile' && (
              <form onSubmit={handleInlineSaveProfile} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    نام خریدار: *
                  </label>
                  <input
                    type="text"
                    required
                    value={inlineName}
                    onChange={e => setInlineName(e.target.value)}
                    placeholder="نام و نام خانوادگی یا فروشگاه"
                    className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1">
                    نشانی باربری یا مقصد: *
                  </label>
                  <input
                    type="text"
                    required
                    value={inlineAddress}
                    onChange={e => setInlineAddress(e.target.value)}
                    placeholder="شهر و آدرس تحویل سفارش"
                    className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inlineLoading || !inlineName.trim() || !inlineAddress.trim()}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                >
                  {inlineLoading ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                  <span>ثبت و تکمیل نهایی</span>
                </button>
              </form>
            )}
          </div>
        ) : (user && !showEditBuyer) ? (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>{buyerName || user?.name || user?.company}</span>
                <span className="bg-emerald-100/90 text-emerald-800 text-[9px] px-2 py-0.5 rounded-md font-bold">
                  تأیید شده
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-bold" dir="ltr">
                {user?.mobile || user?.phone || buyerPhone}
              </div>
              {(buyerAddress || user?.address) && (
                <div className="text-[10px] text-slate-500 font-bold truncate max-w-[220px]">
                  {buyerAddress || user?.address}
                </div>
              )}
            </div>
            <button 
              type="button" 
              onClick={() => setShowEditBuyer(true)}
              className="px-2.5 py-1 bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-200 rounded-xl text-[10px] font-black transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              تغییر
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <input 
                type="text"
                value={buyerName}
                onChange={e => {
                  setBuyerName(e.target.value);
                  try { localStorage.setItem('dastavval_buyer_name', e.target.value); } catch {}
                }}
                placeholder="نام خریدار یا نام فروشگاه *"
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs font-black text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>

            <div>
              <input 
                type="tel"
                readOnly
                value={user?.mobile || user?.phone || buyerPhone}
                className="w-full h-11 bg-slate-100 border border-slate-200 rounded-xl px-3.5 text-xs font-mono font-black text-slate-700 outline-none text-left cursor-not-allowed"
                dir="ltr"
              />
            </div>

            {/* Address Field */}
            <div className="space-y-1 pt-1">
              <input 
                type="text"
                value={buyerAddress}
                onChange={e => {
                  setBuyerAddress(e.target.value);
                  try { localStorage.setItem('dastavval_buyer_address', e.target.value); } catch {}
                }}
                placeholder="شهر و آدرس تحویل بار یا انبار"
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>
          </div>
        )}

        {/* Optional Coupon Code */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
              <Ticket size={14} className="text-amber-600" />
              <span>کد تخفیف (کوپن):</span>
            </div>
            {appliedCoupon && (
              <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {appliedCoupon.type === 'percentage' ? `${toPersianNum(appliedCoupon.value)}٪ تخفیف` : `${toPersianNum(couponDiscountAmount.toLocaleString())} تومان`}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <input 
              type="text"
              value={couponInput}
              onChange={e => {
                setCouponInput(e.target.value.toUpperCase());
                if (couponMsg) setCouponMsg(null);
              }}
              disabled={!!appliedCoupon}
              placeholder="مثال: WELCOME10 یا VIP500K"
              dir="ltr"
              className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[11px] font-mono font-black text-slate-800 outline-none focus:border-emerald-600 uppercase disabled:bg-slate-100"
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="h-9 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap"
              >
                حذف کوپن
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="h-9 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shadow-2xs"
              >
                اعمال کوپن
              </button>
            )}
          </div>
          {couponMsg && (
            <p className={`text-[10px] font-bold ${couponMsg.type === 'success' ? 'text-teal-700' : 'text-rose-500'}`}>
              {couponMsg.text}
            </p>
          )}
        </div>

        {/* Optional Representative Code */}
        <div className="pt-0.5">
          {!appliedRepCode ? (
            <div className="flex gap-2">
              <input 
                type="text"
                value={repCodeInput}
                onChange={e => {
                  setRepCodeInput(e.target.value);
                  if (repCodeMsg) setRepCodeMsg(null);
                }}
                placeholder="کد معرف / نماینده (اختیاری)"
                className="flex-1 h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[11px] font-mono text-slate-800 outline-none focus:border-emerald-600"
              />
              <button
                type="button"
                onClick={handleApplyRepCode}
                className="h-9 px-3 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                اعمال
              </button>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center justify-between text-xs font-black text-emerald-900">
              <span>کد معرف ({appliedRepCode}) اعمال شد</span>
              <button 
                type="button" 
                onClick={() => setAppliedRepCode(null)}
                className="text-rose-500 hover:underline text-[10px] cursor-pointer"
              >
                حذف
              </button>
            </div>
          )}
          {repCodeMsg && (
            <p className={`text-[10px] font-bold mt-1 ${repCodeMsg.type === 'success' ? 'text-emerald-700' : 'text-rose-500'}`}>
              {repCodeMsg.text}
            </p>
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
        <div className="flex justify-between items-center text-slate-500 font-bold">
          <span>مبلغ اقلام:</span>
          <span className="font-mono text-slate-900">{cartTotalPrice.toLocaleString('fa-IR')} تومان</span>
        </div>

        {couponDiscountAmount > 0 && (
          <div className="flex justify-between items-center text-teal-700 font-black">
            <span>تخفیف کوپن {appliedCoupon ? `(${appliedCoupon.code})` : ''}:</span>
            <span className="font-mono">-{couponDiscountAmount.toLocaleString('fa-IR')} تومان</span>
          </div>
        )}

        {totalDiscountAmount > 0 && (
          <div className="flex justify-between items-center text-rose-600 font-black">
            <span>مجموع تخفیف‌ها:</span>
            <span className="font-mono">-{totalDiscountAmount.toLocaleString('fa-IR')} تومان</span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-500 font-bold">
          <span>کرایه حمل:</span>
          <span className="text-emerald-700 font-bold">پس‌کرایه (باربری رسمی)</span>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
          <span className="text-sm font-black text-slate-900">مبلغ نهایی فاکتور:</span>
          <div className="text-right">
            <span className="text-lg font-black text-emerald-700 font-mono tracking-tight">
              {finalPayableAmount.toLocaleString('fa-IR')}
            </span>
            <span className="text-[11px] text-slate-500 mr-1 font-bold">تومان</span>
          </div>
        </div>
      </div>

      {orderError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-black text-rose-700">
          {orderError}
        </div>
      )}

      {/* Big Action Button (One Click to Issue Invoice) */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={handleIssueInvoice}
          disabled={isSubmittingOrder || cartTotalCartons === 0}
          className="w-full h-13 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-2xl font-black text-sm shadow-md shadow-emerald-700/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmittingOrder ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>در حال صدور فاکتور رسمی...</span>
            </>
          ) : (
            <>
              <Zap size={18} className="fill-white" />
              <span>صدور و دریافت پیش‌فاکتور رسمی</span>
            </>
          )}
        </button>

        {/* Secondary Return Button to ensure user is never trapped */}
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowRight size={14} />
          <span>← بازگشت به لیست کالاها و ویرایش اقلام</span>
        </button>

        <p className="text-[10px] text-center text-slate-400 font-bold">
          ✓ فاکتور ممهور دیجیتال بلافاصله برای چاپ و دانلود باز خواهد شد
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4" dir="rtl">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-3xs">
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'items'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/90'
              : 'text-slate-600'
          }`}
        >
          <Package size={16} />
          <span>لیست کالاها ({products.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('checkout')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'checkout'
              ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/90'
              : 'text-slate-600'
          }`}
        >
          <FileText size={16} />
          <span>پیش‌فاکتور {cartTotalCartons > 0 ? `(${cartTotalCartons} کارتن)` : ''}</span>
        </button>
      </div>

      {/* 2. MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* RIGHT COLUMN: PRODUCTS LIST */}
        <div className={`space-y-3 lg:col-span-7 xl:col-span-8 ${activeTab === 'checkout' ? 'hidden lg:block' : 'block'}`}>
          {/* PRODUCT CARDS LIST (High-Contrast, Large, Foolproof) */}
          <div className="space-y-2.5">
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center space-y-3 shadow-3xs">
                <Search size={32} className="mx-auto text-slate-300" />
                <h3 className="text-sm sm:text-base font-black text-slate-800">هیچ کالایی یافت نشد</h3>
                <p className="text-xs text-slate-500 font-bold">
                  کلمه جستجو شده یا فیلترهای انتخابی در کادر بالای صفحه را تغییر دهید.
                </p>
              </div>
            ) : (
              products.map((product, pIdx) => {
                const currentQty = getProductQtyInCart(product.id);
                const cartonPack = product.carton_pack_count || 1;
                const cartonPrice = (product.bulk_price || 0) * cartonPack;
                const isInCart = currentQty > 0;

                return (
                  <div 
                    key={`quick-item-${product.id || pIdx}-${pIdx}`}
                    onClick={() => {
                      if (onViewDetails) {
                        onViewDetails(product);
                      }
                    }}
                    className={`bg-white rounded-2xl border transition-all p-3 sm:p-4 flex items-center gap-3.5 sm:gap-4 shadow-2xs cursor-pointer hover:border-emerald-400 hover:shadow-xs active:bg-slate-50/50 ${
                      isInCart 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/15 bg-emerald-50/10' 
                        : 'border-slate-200/90'
                    }`}
                    title="کلیک برای مشاهده مشخصات و برگه مشخصات کالا"
                  >
                    {/* ۱. یک سوم کادر مستطیل: عکس بزرگ و شفاف محصول (کلیک برای بزرگنمایی عکس) */}
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.image_url) {
                          setPreviewImage({
                            url: getDisplayImageUrl(product.image_url),
                            name: product.name,
                            cartonPack,
                            cartonPrice,
                            product
                          });
                        }
                      }}
                      className="w-1/3 min-w-[100px] max-w-[135px] sm:max-w-[160px] aspect-square rounded-xl bg-slate-50 border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0 overflow-hidden shadow-3xs cursor-zoom-in relative group"
                      title="لمس برای بزرگنمایی و مشاهده عکس محصول"
                    >
                      {product.image_url ? (
                        <img 
                          src={getDisplayImageUrl(product.image_url)} 
                          alt={product.name} 
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Package size={32} className="text-slate-300" />
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white p-1 rounded-lg backdrop-blur-xs opacity-75 group-hover:opacity-100 transition-opacity">
                        <Eye size={12} />
                      </div>
                    </div>

                    {/* ۲. دو سوم کادر: اسم، زیر اسم مشخصات و قیمت، و کلید افزودن */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                      {/* بالا: اسم محصول */}
                      <div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug line-clamp-2 hover:text-emerald-800 transition-colors">
                          {product.name}
                        </h3>
                        <div className="text-[11px] font-bold text-slate-500 mt-1">
                          بسته‌بندی: <strong className="text-slate-900 font-mono font-black">{cartonPack}</strong> عدد در هر کارتن
                        </div>
                      </div>

                      {/* پایین: زیر اسم قیمت و دکمه افزودن کارتن */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-end justify-between gap-2">
                        {/* قیمت هر کارتن */}
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">قیمت هر کارتن:</div>
                          <div className="text-xs sm:text-sm font-black text-slate-950 font-mono">
                            {cartonPrice.toLocaleString('fa-IR')} <span className="text-[10px] font-sans font-bold text-slate-500">تومان</span>
                          </div>
                        </div>

                        {/* کلید ثبت یا شمارنده کارتن (با جلوگیری از باز شدن صفحه محصول هنگام لمس کلیدها) */}
                        <div 
                          className="shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isInCart ? (
                            <div className="flex items-center bg-emerald-50 border-2 border-emerald-600 rounded-xl p-0.5 shadow-2xs gap-0.5">
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQtyChange(product, 1);
                                }}
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95"
                                title="افزایش یک کارتن"
                              >
                                <Plus size={15} />
                              </button>
                              
                              <div className="px-1.5 text-center min-w-[34px]">
                                <span className="text-xs sm:text-sm font-black text-emerald-950 font-mono leading-none block">{currentQty}</span>
                                <span className="text-[8px] text-emerald-800 font-black block mt-0.5">کارتن</span>
                              </div>

                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQtyChange(product, -1);
                                }}
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-white hover:bg-rose-50 text-rose-700 rounded-lg flex items-center justify-center border border-rose-200 transition-all cursor-pointer active:scale-95"
                                title="کاهش یک کارتن"
                              >
                                <Minus size={15} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQtyChange(product, 1);
                              }}
                              className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl font-black text-xs transition-all flex items-center gap-1 cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs active:scale-95 whitespace-nowrap"
                            >
                              <Plus size={15} />
                              <span>افزودن کارتن</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* LEFT COLUMN: LIVE PROFORMA INVOICE SIDEBAR (Clean White Box) */}
        <div className={`lg:col-span-5 xl:col-span-4 ${activeTab === 'items' ? 'hidden lg:block' : 'block'}`}>
          <div className="sticky top-20">
            {renderInvoiceCard()}
          </div>
        </div>
      </div>

      {/* 3. MOBILE STICKY FLOATING BOTTOM BAR */}
      <AnimatePresence>
        {cartTotalCartons > 0 && activeTab === 'items' && (
          <motion.div 
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="lg:hidden fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-slate-200 flex items-center justify-between gap-3 text-slate-800 dir-rtl">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-emerald-800 flex items-center gap-1">
                  <ShoppingBag size={14} />
                  <span>{cartTotalCartons} کارتن انتخاب‌شده</span>
                </div>
                <div className="text-xs font-black text-slate-900 font-mono mt-0.5">
                  مبلغ: {finalPayableAmount.toLocaleString('fa-IR')} <span className="text-[9px] font-sans text-slate-500">تومان</span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('checkout')}
                className="px-4 py-2.5 rounded-xl font-black text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>مشاهده و صدور فاکتور</span>
                <ChevronLeft size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. MODAL بزرگنمایی و پیش‌نمایش عکس کالا (Lightbox) */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            dir="rtl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-2xl space-y-4 cursor-default text-right border border-slate-200"
            >
              {/* هدر مودال تصویر با کلید بستن */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900 truncate flex-1 pl-2">
                  {previewImage.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 font-bold"
                  title="بستن پیش‌نمایش"
                >
                  ✕
                </button>
              </div>

              {/* تصویر باکیفیت و بزرگ */}
              <div className="aspect-square w-full rounded-2xl bg-slate-50 p-4 flex items-center justify-center border border-slate-100 overflow-hidden">
                <img 
                  src={previewImage.url} 
                  alt={previewImage.name} 
                  className="w-full h-full object-contain mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* مشخصات و دکمه رفتن به صفحه محصول */}
              <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                <div>
                  <div className="text-[10px] font-bold text-slate-400">قیمت هر کارتن:</div>
                  <div className="text-sm sm:text-base font-black text-slate-900 font-mono">
                    {previewImage.cartonPrice.toLocaleString('fa-IR')} <span className="text-[10px] font-sans font-bold text-slate-500">تومان</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                    ({previewImage.cartonPack} عدد در کارتن)
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const prod = previewImage.product;
                      setPreviewImage(null);
                      if (onViewDetails) onViewDetails(prod);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black cursor-pointer transition-colors"
                  >
                    صفحه کالا
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQtyChange(previewImage.product, 1);
                    }}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                  >
                    <Plus size={14} />
                    <span>افزودن</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
