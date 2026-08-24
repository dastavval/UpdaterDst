import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { 
  ShoppingCart, Plus, Minus, Package, Check, 
  Search, Filter, Phone, ArrowRight, Share2, 
  MapPin, User, ShieldCheck, Heart, Trash2, MessageSquare, ExternalLink
} from "lucide-react";

interface AgentCatalogViewProps {
  products: Product[];
  onClose?: () => void;
  b2bConfig?: any;
}

export default function AgentCatalogView({ products, onClose, b2bConfig }: AgentCatalogViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCartModal, setShowCartModal] = useState(false);
  const [clientPhone, setClientPhone] = useState("");
  const [clientName, setClientName] = useState("");
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Extract query parameters from URL
  const queryParams = useMemo(() => {
    if (typeof window === "undefined") return { agent: "REP-7012", margin: 15, name: "", phone: "" };
    const params = new URLSearchParams(window.location.search);
    return {
      agent: params.get("agent") || "REP-7012",
      margin: Number(params.get("margin")) || 15,
      name: params.get("name") || "پخش دست اول شبستر",
      phone: params.get("phone") || "09055883360"
    };
  }, []);

  const { agent, margin, name: agentName, phone: agentPhone } = queryParams;

  // Convert English numbers to Persian
  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
  };

  // Format currency with commas in Persian
  const formatPersianCurrency = (price: number) => {
    return toPersianNum(price.toLocaleString("fa-IR"));
  };

  // Categories list
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ["همه", ...Array.from(list)];
  }, [products]);

  // Filter and compute marked-up prices
  const markedUpProducts = useMemo(() => {
    return products.map(p => {
      // Apply markup margin to the bulk_price or price
      const originalPrice = p.bulk_price || p.price || 0;
      const finalPrice = Math.round(originalPrice * (1 + margin / 100));
      return {
        ...p,
        originalPrice,
        markedUpPrice: finalPrice
      };
    });
  }, [products, margin]);

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return markedUpProducts.filter(p => {
      const matchCategory = selectedCategory === "همه" || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [markedUpProducts, selectedCategory, searchQuery]);

  // Cart operations
  const addToCart = (productId: string, minOrder: number) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      return {
        ...prev,
        [productId]: current === 0 ? minOrder : current + 1
      };
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const current = prev[productId] || 0;
      if (current <= 0) return prev;
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const updateQuantity = (productId: string, val: number, minOrder: number) => {
    if (val < minOrder) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  // Cart totals calculation
  const cartSummary = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;
    const itemsList: Array<{ product: any; qty: number; rowTotal: number }> = [];

    Object.entries(cart).forEach(([id, qty]) => {
      const prod = markedUpProducts.find(p => p.id === id);
      if (prod) {
        totalItems += qty;
        const rowTotal = prod.markedUpPrice * qty;
        totalPrice += rowTotal;
        itemsList.push({
          product: prod,
          qty,
          rowTotal
        });
      }
    });

    return { totalItems, totalPrice, itemsList };
  }, [cart, markedUpProducts]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `کاتالوگ دیجیتال ${agentName}`,
        text: `کاتالوگ رسمی و لیست قیمت دست اول محصولات با مدیریت ${agentName}`,
        url: window.location.href
      }).catch(err => console.log(err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartSummary.itemsList.length === 0) return;

    // Build the WhatsApp/SMS order message text
    let messageText = `*سفارش جدید از کاتالوگ الکترونیک*\n`;
    messageText += `👤 خریدار: ${clientName || "همکار گرامی"}\n`;
    if (clientPhone) messageText += `📞 تلفن: ${clientPhone}\n`;
    messageText += `---------------------------------------\n`;
    
    cartSummary.itemsList.forEach((item, index) => {
      messageText += `${index + 1}. ${item.product.name} (${item.product.brand})\n`;
      messageText += `   تعداد: ${toPersianNum(item.qty)} کارتن × ${formatPersianCurrency(item.product.markedUpPrice)} تومان\n`;
      messageText += `   جمع ردیف: ${formatPersianCurrency(item.rowTotal)} تومان\n`;
    });
    
    messageText += `---------------------------------------\n`;
    messageText += `*جمع کل سفارش: ${formatPersianCurrency(cartSummary.totalPrice)} تومان*\n`;
    messageText += `\nلطفاً جهت هماهنگی ارسال و فاکتور اقدام فرمایید.`;

    const encodedText = encodeURIComponent(messageText);
    
    // Create direct links
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${agentPhone.replace(/^0/, "+98")}&text=${encodedText}`;
    const smsUrl = `sms:${agentPhone}?body=${encodedText}`;

    // Open WhatsApp as priority, or fallback
    window.open(whatsappUrl, "_blank");
    
    setOrderSubmitted(true);
    setTimeout(() => {
      setOrderSubmitted(false);
      setCart({});
      setShowCartModal(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-right pb-24" dir="rtl">
      {/* Agent Premium Header */}
      <div className="bg-gradient-to-b from-emerald-900 to-emerald-950 text-white pb-10 pt-6 px-4 rounded-b-[40px] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-black px-3.5 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              عاملیت رسمی و انحصاری توزیع استانی
            </span>
            
            {onClose && (
              <button 
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              >
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2 border-t border-emerald-800/60">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-emerald-800/50">
                  🏢
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">{agentName}</h1>
                  <p className="text-xs text-emerald-300 font-bold flex items-center gap-1 mt-1">
                    <User size={12} />
                    <span>نماینده رسمی توزیع و پخش مستقیم از کارخانجات</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a 
                href={`tel:${agentPhone}`}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <Phone size={15} />
                <span>تماس مستقیم: {toPersianNum(agentPhone)}</span>
              </a>

              <button
                onClick={handleShare}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Share2 size={15} />
                <span>{copiedLink ? "لینک کپی شد!" : "اشتراک‌گذاری کاتالوگ"}</span>
              </button>
            </div>
          </div>
          
          <div className="bg-emerald-900/50 border border-emerald-800/60 rounded-2xl p-4 text-xs sm:text-sm font-medium text-emerald-100 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <p className="leading-relaxed">
              به کاتالوگ اختصاصی ما خوش آمدید! کلیه قیمت‌های مندرج در این لیست با <strong>حاشیه سود قانونی مصوب ({toPersianNum(margin)}٪)</strong> محاسبه گردیده و سفارشات شما مستقیماً توسط این نمایندگی تامین، بارگیری و تحویل می‌گردد.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {/* Search & Categories */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام کالا یا برند سازنده در کاتالوگ..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pr-11 pl-4 text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
            {categories.map((cat, idx) => (
              <button
                key={`cat-btn-${idx}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer border ${
                  selectedCategory === cat 
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/10" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.map((p, pIdx) => {
            const inCartQty = cart[p.id] || 0;
            return (
              <div 
                key={`agent-cat-prod-${p.id || pIdx}-${pIdx}`}
                className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex gap-4 hover:border-emerald-500/30 hover:shadow-md transition-all relative overflow-hidden"
              >
                {/* Product Image */}
                <div className="w-24 sm:w-28 h-24 sm:h-28 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 relative">
                  <img 
                    src={p.image_url} 
                    alt={p.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {p.badge && (
                    <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md">
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400">{p.brand}</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {p.category}
                      </span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">{p.name}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-medium line-clamp-1">{p.pack_description}</p>
                  </div>

                  <div className="flex items-end justify-between border-t border-slate-50 pt-2 mt-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold block">قیمت همکار (هر کارتن)</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-black text-emerald-600">
                          {formatPersianCurrency(p.markedUpPrice)}
                        </span>
                        <span className="text-[10px] text-slate-500 font-black">تومان</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-bold block">حداقل سفارش: {toPersianNum(p.min_order_cartons)} کارتن</span>
                    </div>

                    {/* Order buttons */}
                    <div className="flex items-center">
                      {inCartQty > 0 ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(p.id, inCartQty - 1, p.min_order_cartons)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-emerald-100 flex items-center justify-center text-emerald-800 transition-all cursor-pointer border border-emerald-200/50"
                          >
                            {inCartQty <= p.min_order_cartons ? <Trash2 size={14} className="text-rose-500" /> : <Minus size={14} />}
                          </button>
                          <span className="text-xs font-black text-slate-800 px-1 font-mono min-w-[20px] text-center">
                            {toPersianNum(inCartQty)}
                          </span>
                          <button 
                            type="button"
                            onClick={() => addToCart(p.id, p.min_order_cartons)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center text-white transition-all cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => addToCart(p.id, p.min_order_cartons)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingCart size={13} />
                          <span>افزودن</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
              <span className="text-4xl">🔍</span>
              <h4 className="text-sm font-black text-slate-800">هیچ محصولی با مشخصات فوق یافت نشد</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                لطفاً کلیدواژه جستجوی خود را تغییر دهید یا دسته‌بندی دیگری را انتخاب نمایید.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartSummary.totalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-xl mx-auto">
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white relative">
                <ShoppingCart size={20} />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-slate-900 font-mono">
                  {toPersianNum(cartSummary.totalItems)}
                </span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[10px] text-slate-400 font-bold block">مجموع مبلغ فاکتور</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    {formatPersianCurrency(cartSummary.totalPrice)}
                  </span>
                  <span className="text-[10px] text-slate-300 font-black">تومان</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCartModal(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>مشاهده و ثبت نهایی سفارش</span>
              <ArrowRight size={15} className="rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Modal */}
      <AnimatePresence>
        {showCartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-5 text-right overflow-y-auto max-h-[90vh]"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                <h4 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <span>🛒 اقلام سفارش شما</span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                    {toPersianNum(cartSummary.totalItems)} کارتن
                  </span>
                </h4>
                <button 
                  onClick={() => setShowCartModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer font-bold text-sm"
                >
                  ✕ بستن
                </button>
              </div>

              {orderSubmitted ? (
                <div className="py-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-3xl mx-auto border border-emerald-200">
                    ✓
                  </div>
                  <h4 className="text-base font-black text-slate-800">سفارش شما با موفقیت آماده شد!</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    پیام سفارش با فرمت استاندارد برای ارسال به شماره عاملیت ({toPersianNum(agentPhone)}) بارگذاری گردید. در حال انتقال به پیام‌رسان...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-5">
                  {/* Selected Items list */}
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                    {cartSummary.itemsList.map((item) => (
                      <div 
                        key={`cart-item-${item.product.id}`}
                        className="bg-slate-50 p-3 rounded-2xl border border-slate-150 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <h5 className="text-xs font-black text-slate-900">{item.product.name}</h5>
                          <span className="text-[10px] text-slate-400 block font-bold">{item.product.brand}</span>
                          <span className="text-[10px] text-emerald-600 font-black">
                            {formatPersianCurrency(item.product.markedUpPrice)} تومان × {toPersianNum(item.qty)} کارتن
                          </span>
                        </div>

                        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shrink-0">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.qty - 1, item.product.min_order_cartons)}
                            className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600"
                          >
                            {item.qty <= item.product.min_order_cartons ? <Trash2 size={12} className="text-rose-500" /> : <Minus size={12} />}
                          </button>
                          <span className="text-xs font-black text-slate-800 px-1 font-mono w-6 text-center">
                            {toPersianNum(item.qty)}
                          </span>
                          <button 
                            type="button"
                            onClick={() => addToCart(item.product.id, item.product.min_order_cartons)}
                            className="w-6 h-6 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart Total Block */}
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-150 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700">مجموع کل اقلام سفارش:</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {formatPersianCurrency(cartSummary.totalPrice)} تومان
                    </span>
                  </div>

                  {/* Buyer details */}
                  <div className="space-y-3.5 border-t border-slate-150 pt-4">
                    <h5 className="text-xs font-black text-slate-800">✍ مشخصات شما جهت تحویل و صدور بارنامه</h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">نام و نام خانوادگی خریدار:</label>
                        <input 
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="مثال: علی رضایی"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">تلفن همراه تماس:</label>
                        <input 
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="مثال: 09123456789"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 text-left font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit Order action buttons */}
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black rounded-2xl shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare size={16} />
                    <span>ثبت سفارش و ارسال از طریق واتساپ / پیامک</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
