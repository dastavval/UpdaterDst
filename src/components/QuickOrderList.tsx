import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, Package, Search, Filter, X, Plus, Minus, PhoneCall } from 'lucide-react';
import { Product } from '../types';

interface QuickOrderListProps {
  products: Product[];
  onAddToCart: (product: Product, quantity: number) => void;
  onCheckout: () => void;
  cart: { productId: string, quantity: number }[];
  onRemoveFromCart?: (productId: string) => void;
}

export default function QuickOrderList({ 
  products, 
  onAddToCart, 
  onCheckout, 
  cart
}: QuickOrderListProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats).filter(Boolean);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.includes(searchQuery) || p.brand.includes(searchQuery);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleQtyChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 0;
      const product = products.find(p => p.id === productId);
      const minQty = product ? product.min_order_cartons : 1;
      let next;
      if (delta > 0) {
        next = current === 0 ? minQty : current + 1;
      } else {
        next = current <= minQty ? 0 : current - 1;
      }
      return { ...prev, [productId]: next };
    });
  };

  const getProductQtyInCart = (productId: string) => {
    return cart.find(item => item.productId === productId)?.quantity || 0;
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Cart Summary */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">🛍️ فرم ساده سفارش‌گیری مستقیم کالاها</h2>
          <p className="text-[11px] text-slate-500 font-bold mt-1">تعداد کارتن مورد نظر را مشخص نموده و دکمه افزودن را بزنید.</p>
        </div>
        <button 
          onClick={onCheckout}
          disabled={cartTotalItems === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled cursor-pointer w-full md:w-auto bg-purple-700 text-white hover"
        >
          <span>تکمیل و ثبت سفارش</span>
          <div className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px]">{cartTotalItems} کارتن</div>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* SEARCH & FILTER AREA */}
      <div className="space-y-4">
        {/* Simple Material Search */}
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within transition-colors" size={20} />
          <input 
            type="text"
            placeholder="جستجوی سریع کالا یا برند..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3.5 pr-12 pl-4 rounded-2xl border border-slate-200 transition-all outline-none text-xs font-bold bg-white focus shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover rounded-full transition-all"
            >
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-2 rounded-xl flex items-center gap-2 text-[10px] font-black bg-slate-100 text-slate-600">
            <Filter size={14} />
            <span>گروه کالا:</span>
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer border ${
              !selectedCategory 
                ? 'bg-purple-700 text-white border-transparent' 
                : 'bg-white text-slate-600 border-slate-200 hover'
            }`}
          >
            همه
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? 'bg-purple-700 text-white border-transparent shadow-md shadow-purple-600/10' 
                  : 'bg-white text-slate-600 border-slate-200 hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCT TABLE */}
      <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50">
          <div className="col-span-6">نام محصول و برند</div>
          <div className="col-span-3 text-center">قیمت عمده (هر کارتن)</div>
          <div className="col-span-3 text-center">تعداد سفارش</div>
        </div>

        <div className="divide-y divide-slate-100 min-h-[200px]">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center space-y-3"
              >
                <div className="text-3xl">🔍</div>
                <p className="text-xs font-black text-slate-400">محصولی پیدا نشد.</p>
              </motion.div>
            ) : (
              filteredProducts.map(product => {
                const inCart = getProductQtyInCart(product.id);
                const pendingQty = quantities[product.id] || 0;
                const cartonPrice = product.bulk_price * product.carton_pack_count;

                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={product.id} 
                    className={`flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 px-4 sm:px-6 py-3.5 items-center transition-colors ${
                      inCart > 0 ? 'bg-purple-50/50' : ''
                    } hover`}
                  >
                    {/* Left Product Info */}
                    <div className="w-full md:col-span-6 flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 overflow-hidden text-emerald-700">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { e.currentTarget.style.display = "none"; }} 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Package size={20} className="stroke-[1.75]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-black text-slate-900 truncate">{product.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-400 font-bold">{product.brand}</span>
                          <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">{product.category}</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-black border border-emerald-200/60">
                            کارخانه: {product.factory_name || (product as any).factoryName || product.brand}
                          </span>
                          <span className="text-[9px] text-purple-700 font-black md:hidden">
                            {cartonPrice.toLocaleString('fa-IR')} تومان/کارتن
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price Column */}
                    <div className="hidden md:block md:col-span-3 text-center">
                      <div className="text-xs font-black text-slate-900">
                        {cartonPrice.toLocaleString('fa-IR')} تومان
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">{product.carton_pack_count} عددی</div>
                    </div>

                    {/* Actions & Quantity Controls */}
                    <div className="w-full md:col-span-3 flex items-center justify-between md:justify-center gap-2 pt-2 md:pt-0 border-t md border-slate-100">
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button 
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded hover transition-colors text-purple-700 font-black cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                        <input 
                          type="number"
                          value={pendingQty}
                          onChange={(e) => setQuantities(prev => ({ ...prev, [product.id]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-8 text-center text-xs font-black bg-transparent border-none focus text-slate-900"
                        />
                        <button 
                          onClick={() => handleQtyChange(product.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded hover transition-colors text-purple-700 font-black cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          const qtyToAdd = pendingQty > 0 ? pendingQty : (product.min_order_cartons || 1);
                          onAddToCart(product, qtyToAdd);
                          setQuantities(prev => ({ ...prev, [product.id]: 0 }));
                        }}
                        className="px-4 py-2 rounded-lg font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer bg-purple-700 text-white hover shadow-sm"
                      >
                        <ShoppingBag size={12} />
                        افزودن
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {cartTotalItems > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-purple-200 bg-purple-50/60"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-700 text-white rounded-xl flex items-center justify-center shadow-sm">
                <Package size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">اقلام آماده ثبت در فاکتور</h4>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">{cartTotalItems} کارتن محصول در سبد خرید قرار دارد.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-left hidden sm:block">
                <span className="text-[9px] text-slate-400 font-bold block">مجموع فاکتور:</span>
                <span className="text-sm font-black text-purple-800">
                  {(cart.reduce((sum, item) => {
                    const product = products.find(p => p.id === item.productId);
                    return sum + (product ? (product.bulk_price * product.carton_pack_count) : 0) * item.quantity;
                  }, 0)).toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <a 
                href="tel:09999123001"
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-3.5 py-2 rounded-full font-black text-xs transition-all cursor-pointer shadow-xs flex items-center gap-2 group"
                title="تماس مستقیم با پشتیبانی تلفنی"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <PhoneCall size={13} className="animate-pulse" />
                </div>
                <span>پشتیبانی تلفنی</span>
              </a>
              <button 
                onClick={onCheckout}
                className="bg-purple-700 hover:bg-purple-800 text-white px-5 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer shadow-sm"
              >
                ادامه و ثبت سفارش
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

