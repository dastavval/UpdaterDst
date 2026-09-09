import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { getDisplayImageUrl, getProductFallbackSvg } from "../lib/image-utils";
import { 
  ShoppingCart, Plus, Minus, Package, Check, 
  Search, Filter, Phone, ArrowRight, Share2, 
  MapPin, User, ShieldCheck, Heart, Trash2, MessageSquare, ExternalLink,
  Download, FileText, Printer, ChevronLeft, CheckCircle2, MessageCircle
} from "lucide-react";
import { addDoc, collection, serverTimestamp, db } from "../lib/data-layer";

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
  const [lastOrderTrack, setLastOrderTrack] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // Extract query parameters from URL
  const queryParams = useMemo(() => {
    if (typeof window === "undefined") return { agent: "REP-7012", margin: 15, name: "", phone: "", city: "", province: "" };
    const params = new URLSearchParams(window.location.search);
    return {
      agent: params.get("agent") || "REP-7012",
      margin: Number(params.get("margin")) || 15,
      name: params.get("name") || "پخش دست اول شبستر",
      phone: params.get("phone") || "09055883360",
      city: params.get("city") || "",
      province: params.get("province") || ""
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

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartSummary.itemsList.length === 0) return;

    // 1. Prepare Order Object for Database
    const trackingNumber = `CAT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      trackingNumber,
      customerName: clientName || "مشتری کاتالوگ",
      customerPhone: clientPhone,
      buyerName: clientName,
      buyerPhone: clientPhone,
      phone: clientPhone,
      items: cartSummary.itemsList.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        brand: item.product.brand,
        quantityCartons: item.qty,
        pricePerCarton: item.product.markedUpPrice,
        totalItems: item.qty * (item.product.carton_pack_count || 1),
        image_url: item.product.image_url
      })),
      totalAmount: cartSummary.totalPrice,
      status: 'pending',
      createdAt: serverTimestamp(),
      affiliateRepId: agent, // Track the representative who shared the link
      paymentMethod: 'catalog_request',
      type: 'catalog_order',
      isCatalogOrder: true,
      city: queryParams.city || "",
      province: queryParams.province || ""
    };

    try {
      // 2. Save to Firestore/Database so rep and admin see it
      await addDoc(collection(db, "orders"), newOrder);
      console.log("Order saved to database:", trackingNumber);
    } catch (err) {
      console.error("Failed to save order to DB:", err);
    }

    // 3. Build the WhatsApp/SMS order message text
    let messageText = `*سفارش جدید از کاتالوگ الکترونیک*\n`;
    messageText += `🔖 شماره پیگیری: ${trackingNumber}\n`;
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
    
    // Open WhatsApp
    window.open(whatsappUrl, "_blank");
    
    setLastOrderTrack(trackingNumber);
    setOrderSubmitted(true);
    // Don't auto-close cart so user can see tracking
  };

  const handleCloseSuccess = () => {
    setOrderSubmitted(false);
    setCart({});
    setShowCartModal(false);
  };

  const handleDownloadCatalog = () => {
    const downloadUrl = `/api/catalog/download?agent=${encodeURIComponent(agent)}&margin=${margin}&title=${encodeURIComponent(agentName)}&phone=${encodeURIComponent(agentPhone)}`;
    window.location.href = downloadUrl;
  };

  const handlePrintCatalog = () => {
    try {
      window.print();
    } catch (err) {
      handleDownloadCatalog();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-right pb-24 print:bg-white print:pb-0" dir="rtl">
      {/* Print-only Catalog Header */}
      <div className="hidden print:block mb-8 border-b-2 border-emerald-600 pb-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-emerald-950">لیست قیمت و کاتالوگ محصولات</h1>
            <p className="text-sm font-bold text-slate-500">تامین‌کننده: {agentName}</p>
            <p className="text-sm font-bold text-slate-500">شماره تماس: {toPersianNum(agentPhone)}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-emerald-600 mb-2">دست اول</div>
            <p className="text-xs text-slate-400">تاریخ چاپ: {toPersianNum(new Date().toLocaleDateString('fa-IR'))}</p>
          </div>
        </div>
      </div>

      {/* Agent Premium Header (Creative White Theme) */}
      <div className="bg-white text-slate-900 pb-10 pt-6 px-4 rounded-b-[40px] shadow-sm relative overflow-hidden border-b border-slate-200 print:hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
        
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="flex items-center justify-between">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] sm:text-xs font-black px-4 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck size={14} className="text-emerald-500" />
              عاملیت رسمی و انحصاری توزیع استانی
            </span>
            
            {onClose && (
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer shadow-xs"
              >
                <ArrowRight size={20} />
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2 border-t border-slate-100">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-sm border border-slate-200 rotate-3">
                  🏢
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">{agentName}</h1>
                  <p className="text-xs sm:text-sm text-emerald-600 font-bold flex items-center gap-1.5 mt-1.5">
                    <MapPin size={14} />
                    <span>نماینده رسمی توزیع مستقیم از کارخانجات</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a 
                href={`tel:${agentPhone}`}
                className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
              >
                <Phone size={16} />
                <span>تماس مستقیم: {toPersianNum(agentPhone)}</span>
              </a>

              <button
                onClick={handleDownloadCatalog}
                className="px-5 py-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                title="دانلود فایل اختصاصی کاتالوگ"
              >
                <Download size={16} className="text-emerald-700" />
                <span>دانلود کاتالوگ</span>
              </button>

              <button
                onClick={handlePrintCatalog}
                className="px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer size={16} className="text-slate-500" />
                <span>نسخه چاپی / PDF</span>
              </button>
              
              <button
                onClick={handleShare}
                className="w-12 h-12 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-xs"
                title="اشتراک‌گذاری"
              >
                <Share2 size={18} className={copiedLink ? "text-emerald-500" : "text-slate-500"} />
              </button>
            </div>
          </div>
          
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-4 shadow-2xs">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xs shrink-0 text-xl border border-emerald-100">💡</div>
            <p className="leading-relaxed">
              به کاتالوگ اختصاصی ما خوش آمدید! کلیه قیمت‌های مندرج در این لیست با <strong>حاشیه سود قانونی مصوب ({toPersianNum(margin)}٪)</strong> محاسبه گردیده و سفارشات شما مستقیماً توسط این نمایندگی تامین، بارگیری و تحویل می‌گردد.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
        {/* Search & Categories */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 print:hidden">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-6">
          {filteredProducts.map((p, pIdx) => {
            const inCartQty = cart[p.id] || 0;
            return (
              <div 
                key={`agent-cat-prod-${p.id || pIdx}-${pIdx}`}
                className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex gap-4 hover:border-emerald-500/30 hover:shadow-md transition-all relative overflow-hidden print:shadow-none print:border-slate-300 print:break-inside-avoid"
              >
                {/* Product Image */}
                <div className="w-24 sm:w-28 h-24 sm:h-28 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 relative flex items-center justify-center p-1 print:border-slate-200">
                  <img 
                    src={getDisplayImageUrl(p.image_url || p.imageUrl, p.name, p.brand)} 
                    alt={p.name}
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                    onError={(e) => { (e.target as HTMLImageElement).src = getProductFallbackSvg(p.name, p.brand); }}
                  />
                  {p.badge && (
                    <span className="absolute top-1 right-1 bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md shadow-xs print:hidden">
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400">{p.brand}</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full print:bg-white print:border print:border-emerald-100">
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

                    {/* Order buttons - Hidden on print */}
                    <div className="flex items-center print:hidden">
                      {inCartQty > 0 ? (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                          <button 
                            type="button"
                            onClick={() => updateQuantity(p.id, inCartQty - 1, p.min_order_cartons)}
                            className="w-7 h-7 rounded-lg bg-white hover:bg-emerald-100 flex items-center justify-center text-emerald-800 transition-all cursor-pointer border border-emerald-200/50"
                          >
                            {inCartQty <= p.min_order_cartons ? <Trash2 size={14} className="text-emerald-500" /> : <Minus size={14} />}
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
      {cartSummary.totalItems > 0 && !showCartModal && (
        <div className="fixed bottom-24 sm:bottom-8 left-4 right-4 z-[9999] max-w-xl mx-auto">
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white/95 backdrop-blur-xl text-slate-900 p-4 sm:p-5 rounded-[2.5rem] border border-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.2)] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center relative shadow-lg shadow-emerald-600/20">
                <ShoppingCart size={22} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm font-mono">
                  {toPersianNum(cartSummary.totalItems)}
                </span>
              </div>
              <div className="space-y-0.5 text-right">
                <span className="text-[9px] text-slate-400 font-black block uppercase tracking-tighter">سفارش مستقیم از: {agentName}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-xl font-black text-slate-900">
                    {formatPersianCurrency(cartSummary.totalPrice)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">تومان</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCartModal(true)}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95"
            >
              <span>مشاهده و ثبت نهایی</span>
              <ArrowRight size={16} className="rotate-180" />
            </button>
          </motion.div>
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
                /* SUCCESS SCREEN */
                <div className="p-8 sm:p-10 text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                    <CheckCircle2 size={48} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black text-slate-900">سفارش شما با موفقیت ثبت شد!</h4>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                      شماره پیگیری سفارش: <span className="text-emerald-700 font-mono font-black text-sm">{lastOrderTrack}</span>
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-right space-y-3">
                    <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                      ✅ سفارش شما در سیستم بازرگانی ثبت شد و هم‌اکنون برای مدیریت {agentName} قابل مشاهده است.
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                      ✅ جهت تسریع در فرآیند بارگیری و ارسال، می‌توانید جزئیات سفارش را از طریق واتساپ نیز برای ایشان ارسال فرمایید.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 pt-4">
                    <button
                      onClick={handleCloseSuccess}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl transition-all cursor-pointer shadow-lg shadow-emerald-600/10"
                    >
                      بستن و بازگشت به کاتالوگ
                    </button>
                    <button
                      onClick={(e) => handleSubmitOrder(e as any)}
                      className="w-full py-3.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-black rounded-2xl transition-all hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={14} className="text-emerald-500" />
                      ارسال مجدد در واتساپ
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-5">
                  {/* Selected Items list */}
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                    {cartSummary.itemsList.map((item, itemIdx) => (
                      <div 
                        key={`agent-cart-item-${item.product.id || itemIdx}-${itemIdx}`}
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
                            {item.qty <= item.product.min_order_cartons ? <Trash2 size={12} className="text-emerald-500" /> : <Minus size={12} />}
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
