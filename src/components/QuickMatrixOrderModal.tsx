import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Sparkles, 
  Package, 
  CheckCircle2, 
  FileText, 
  Filter,
  Layers,
  Building2,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import { getProductRolePricing } from "../lib/pricing";

interface QuickMatrixOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onApplyToCart: (items: { product: Product; quantityCartons: number }[]) => void;
  userBadge?: string;
}

export default function QuickMatrixOrderModal({
  isOpen,
  onClose,
  products,
  onApplyToCart,
  userBadge = "bronze"
}: QuickMatrixOrderModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه");
  const [orderQuantities, setOrderQuantities] = useState<{ [productId: string]: number }>({});

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ["همه", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === "همه" || p.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleSetQuantity = (productId: string, qty: number) => {
    setOrderQuantities(prev => {
      const copy = { ...prev };
      if (qty <= 0) {
        delete copy[productId];
      } else {
        copy[productId] = qty;
      }
      return copy;
    });
  };

  const handleIncrement = (productId: string) => {
    const current = orderQuantities[productId] || 0;
    handleSetQuantity(productId, current + 1);
  };

  const handleDecrement = (productId: string) => {
    const current = orderQuantities[productId] || 0;
    handleSetQuantity(productId, Math.max(0, current - 1));
  };

  const handleClearAll = () => {
    setOrderQuantities({});
  };

  // Calculation of total order values
  const { totalCartons, totalGrossAmount, selectedCount } = useMemo(() => {
    let cartons = 0;
    let amount = 0;
    let count = 0;

    Object.entries(orderQuantities).forEach(([productId, qty]) => {
      if (qty > 0) {
        const prod = products.find(p => p.id === productId);
        if (prod) {
          const pricing = getProductRolePricing(prod, userBadge);
          cartons += qty;
          amount += pricing.pricePerCarton * qty;
          count++;
        }
      }
    });

    return { totalCartons: cartons, totalGrossAmount: amount, selectedCount: count };
  }, [orderQuantities, products, userBadge]);

  const handleConfirmAndAddToCart = () => {
    try {
      const itemsToAdd: { product: Product; quantityCartons: number }[] = [];
      Object.entries(orderQuantities).forEach(([productId, qty]) => {
        if (qty > 0) {
          const prod = products.find(p => p.id === productId);
          if (prod) {
            itemsToAdd.push({ product: prod, quantityCartons: qty });
          }
        }
      });

      if (itemsToAdd.length > 0) {
        onApplyToCart(itemsToAdd);
        onClose();
      }
    } catch (err) {
      console.error("Matrix order cart transfer error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="relative w-full max-w-5xl h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-slate-800"
        >
          {/* Header */}
          <div className="bg-white text-slate-900 p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-base font-black flex items-center gap-2 text-slate-900">
                  <span>ثبت سفارش سریع ردیفی و ماتریسی عمده</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    ویژه بنکداران و سوپرمارکت‌ها
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">انتخاب آسان تعداد کارتن از کاتالوگ با قیمت کف بازار و انتقال یکجا به پیش‌فاکتور</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filters and Search Bar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="جستجوی سریع نام کالا، برند یا کد SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pr-10 pl-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-600 shadow-2xs"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Table / Matrix List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Package size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">کالایی با این مشخصات یافت نشد.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {filteredProducts.map(prod => {
                  const pricing = getProductRolePricing(prod, userBadge);
                  const qty = orderQuantities[prod.id] || 0;
                  const itemTotal = pricing.pricePerCarton * qty;

                  return (
                    <div 
                      key={prod.id} 
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                        qty > 0 ? 'bg-amber-50/50 border-r-4 border-r-amber-500' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Product Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <img 
                          src={getDisplayImageUrl(prod.image_url)} 
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-white flex-shrink-0 shadow-2xs"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-normal">{prod.name}</h4>
                            {prod.brand && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                {prod.brand}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium mt-1 flex-wrap">
                            <span>کد کالا: <strong className="font-mono text-slate-800">{prod.sku || prod.id}</strong></span>
                            <span>•</span>
                            <span>بسته‌بندی: <strong className="text-slate-800">{prod.carton_pack_count || 24} عددی در کارتن</strong></span>
                            <span>•</span>
                            <span>دسته: <strong className="text-indigo-700">{prod.category}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing and Stepper (Only ONE single control per row) */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-2.5 sm:pt-0">
                        <div className="text-right sm:text-left">
                          <span className="text-[11px] text-slate-500 block font-normal">قیمت هر کارتن:</span>
                          <span className="text-xs sm:text-sm font-black text-slate-900 font-sans">
                            {pricing.pricePerCarton.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-600 font-normal">تومان</span>
                          </span>
                        </div>

                        {/* Single Stepper Control */}
                        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                          <button
                            onClick={() => handleDecrement(prod.id)}
                            disabled={qty === 0}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              qty > 0 ? 'bg-white text-slate-800 hover:bg-red-50 hover:text-red-600 shadow-2xs border border-slate-200' : 'text-slate-300 bg-slate-100'
                            }`}
                            title="کاهش تعداد"
                          >
                            <Minus size={14} />
                          </button>
                          
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={qty || ""}
                            placeholder="۰"
                            onChange={(e) => handleSetQuantity(prod.id, Math.max(0, Number(e.target.value)))}
                            className="w-12 text-center text-xs font-black font-sans bg-white border border-slate-200 rounded-lg py-1 focus:outline-none focus:border-indigo-600 text-slate-900 shadow-2xs"
                          />

                          <button
                            onClick={() => handleIncrement(prod.id)}
                            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                            title="افزایش تعداد کارتن"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Item Total Subtotal */}
                        <div className="w-28 text-left hidden md:block">
                          {qty > 0 ? (
                            <div>
                              <span className="text-[10px] text-slate-500 block">جمع ردیف:</span>
                              <span className="text-xs font-black text-emerald-700 font-sans">
                                {itemTotal.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-slate-600">تومان</span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-light">بدون سفارش</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Bar with Totals & Submission */}
          <div className="bg-slate-900 text-white p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <Package size={16} className="text-amber-400" />
                <span>تنوع اقلام انتخابی: <strong className="text-white font-sans font-black">{selectedCount}</strong> قلم</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Layers size={16} className="text-indigo-400" />
                <span>مجموع کارتن‌ها: <strong className="text-amber-300 font-sans font-black">{totalCartons}</strong> کارتن</span>
              </div>
              {selectedCount > 0 && (
                <button 
                  onClick={handleClearAll}
                  className="text-[11px] text-red-300 hover:text-red-200 underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>پاکسازی همه</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right sm:text-left">
                <span className="text-[10px] text-slate-400 block">مبلغ کل سفارش ردیفی:</span>
                <span className="text-base font-black text-emerald-400 font-sans">
                  {totalGrossAmount.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-300">تومان</span>
                </span>
              </div>

              <button
                onClick={handleConfirmAndAddToCart}
                disabled={selectedCount === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all ${
                  selectedCount > 0
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={16} />
                <span>انتقال به پیش‌فاکتور و تسویه ({selectedCount} کالا)</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
