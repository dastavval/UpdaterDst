import React, { useState } from 'react';
import { Product } from '../types';
import { Box, Plus, Edit2, Trash2, Search, Check, X, Image as ImageIcon, Sparkles, Zap, RotateCcw, Percent, Calculator, Tag, Eye, EyeOff, AlertCircle, Package, Flame, PackageX, PackageCheck, RefreshCw, FileJson, Layers } from 'lucide-react';
import ParsPackImageUploader from './ParsPackImageUploader';
import { SmartJsonCatalogModal } from './SmartJsonCatalogModal';

interface Props {
  products: Product[];
  onRefreshProducts?: () => Promise<void>;
  onUpdateProduct?: (id: string, fields: Partial<Product>) => Promise<any> | void;
  onApplyJsonImportedProducts?: (items: any[], mode: 'merge' | 'replace') => Promise<void> | void;
}

const initialFormState = {
  name: "", brand: "مینو", category: "تنقلات و شکلات", price: 0, bulk_price: 0, marketPrice: 0, dealerPrice: 0,
  stockQuantityCartons: 100, unit: "کارتن", itemsPerCarton: 24, weight: "۵۰۰ گرم",
  imageUrl: "http://c102393.parspack.net/c102393/products/prd_1.webp", description: "", isSpecial: false, isFloorMarket: false
};

export default function AdminProductsManagement({ products, onRefreshProducts, onUpdateProduct, onApplyJsonImportedProducts }: Props) {
  const [search, setSearch] = useState("");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>(initialFormState);

  const handleApplyImportedJson = async (importedItems: any[], mode: 'merge' | 'replace') => {
    try {
      if (onApplyJsonImportedProducts) {
        await onApplyJsonImportedProducts(importedItems, mode);
        setShowJsonModal(false);
        setMsg(`✅ کاتالوگ با موفقیت همگام‌سازی شد (تعداد ${importedItems.length} محصول پردازش شد).`);
      } else if (onRefreshProducts) {
        await onRefreshProducts();
        setShowJsonModal(false);
        setMsg(`✅ کاتالوگ بروزرسانی شد.`);
      }
    } catch (err: any) {
      console.error(err);
      setMsg(`خطا در همگام‌سازی کاتالوگ: ${err.message || err}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `/api/v1/dev/products/${isEditing}` : `/api/v1/dev/products`;
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: isEditing || undefined })
      });
      if (res.ok) {
        setShowForm(false);
        setIsEditing(null);
        setMsg(isEditing ? "تغییرات محصول با موفقیت ثبت شد." : "محصول جدید با موفقیت اضافه شد.");
        if (onRefreshProducts) await onRefreshProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSpecial = async (product: Product) => {
    try {
      const nextSpecial = !((product as any).isSpecial || (product as any).isFeatured);
      const updatedProduct = {
        ...product,
        isSpecial: nextSpecial,
        isFeatured: nextSpecial,
        updatedAt: new Date().toISOString()
      };

      // Send update
      const res = await fetch(`/api/v1/dev/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      if (!res.ok) {
        // Fallback POST
        await fetch(`/api/v1/dev/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });
      }

      setMsg(`محصول "${product.name}" ${nextSpecial ? 'ویژه شد 🌟' : 'از حالت ویژه خارج شد.'}`);
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFloorMarket = async (product: Product) => {
    try {
      const nextFloor = !((product as any).isFloorMarket || (product as any).isKafBazar);
      const updatedProduct = {
        ...product,
        isFloorMarket: nextFloor,
        isKafBazar: nextFloor,
        updatedAt: new Date().toISOString()
      };

      if (onUpdateProduct) {
        onUpdateProduct(product.id, { isKafBazaar: nextFloor, isFloorMarket: nextFloor } as any);
      }

      // Send update
      const res = await fetch(`/api/v1/dev/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      if (!res.ok) {
        // Fallback POST
        await fetch(`/api/v1/dev/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });
      }

      setMsg(`محصول "${product.name}" ${nextFloor ? 'به کف بازار 🔥 اضافه شد.' : 'از کف بازار حذف شد.'}`);
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSediment = async (product: Product) => {
    try {
      const nextSediment = !product.isSediment;
      const discount = product.sedimentDiscountPercent || 20;
      const calcPrice = Math.round((product.bulk_price || product.price || 0) * (1 - discount / 100));
      const updatedProduct: Product = {
        ...product,
        isSediment: nextSediment,
        sedimentStatus: nextSediment ? 'approved' : 'none',
        sedimentDiscountPercent: discount,
        sedimentPrice: calcPrice,
        sedimentQuantityCartons: product.sedimentQuantityCartons || product.stock_quantity_cartons || 50,
        sedimentDuration: product.sedimentDuration || '۲ ماه دپو در انبار',
        sedimentDescription: product.sedimentDescription || `کالای رسوب‌کرده انبار با تخفیف ویژه ${discount}٪ جهت تسویه نقدی فوری`,
        updated_at: new Date().toISOString()
      };

      if (onUpdateProduct) {
        onUpdateProduct(product.id, updatedProduct);
      }

      const res = await fetch(`/api/v1/dev/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      if (!res.ok) {
        await fetch(`/api/v1/dev/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });
      }

      // Also trigger global sync event for any open views
      window.dispatchEvent(new CustomEvent('dastavval_products_updated', { detail: { productId: product.id, isSediment: nextSediment } }));

      setMsg(`محصول "${product.name}" ${nextSediment ? 'به لیست کالاهای رسوب‌کرده 📦 اضافه شد.' : 'از لیست رسوب خارج شد.'}`);
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSurplus = async (product: Product) => {
    try {
      const nextSurplus = !product.isSurplus;
      const discount = product.surplusDiscountPercent || 22;
      const calcPrice = Math.round((product.bulk_price || product.price || 0) * (1 - discount / 100));
      const updatedProduct: Product = {
        ...product,
        isSurplus: nextSurplus,
        surplusStatus: nextSurplus ? 'approved' : 'none',
        surplusDiscountPercent: discount,
        surplusPrice: calcPrice,
        surplusQuantityCartons: product.surplusQuantityCartons || product.stock_quantity_cartons || 80,
        surplusDescription: product.surplusDescription || `مازاد خط تولید با بارگیری فوری و تخفیف ${discount}٪ مستقیم از کارخانه`,
        updated_at: new Date().toISOString()
      };

      if (onUpdateProduct) {
        onUpdateProduct(product.id, updatedProduct);
      }

      const res = await fetch(`/api/v1/dev/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      if (!res.ok) {
        await fetch(`/api/v1/dev/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProduct)
        });
      }

      // Also trigger global sync event for any open views
      window.dispatchEvent(new CustomEvent('dastavval_products_updated', { detail: { productId: product.id, isSurplus: nextSurplus } }));

      setMsg(`محصول "${product.name}" ${nextSurplus ? 'به لیست مازاد تولید کارخانجات 🏭 اضافه شد.' : 'از لیست مازاد خارج شد.'}`);
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuickStatusChange = async (product: Product, action: 'activate' | 'deactivate' | 'out_of_stock' | 'in_stock' | 'charge_50' | 'charge_200') => {
    try {
      let fields: any = {};
      let actionLabel = "بروزرسانی گردید";
      if (action === 'activate') {
        fields = { disabled: false, isApproved: true, approvalStatus: 'approved' };
        actionLabel = "فعال و در ویترین منتشر شد";
      } else if (action === 'deactivate') {
        fields = { disabled: true };
        actionLabel = "غیرفعال و موقتاً مخفی شد";
      } else if (action === 'out_of_stock') {
        fields = { stock_quantity_cartons: 0, stock: 0 };
        actionLabel = "ناموجود شد (انبار صفر)";
      } else if (action === 'in_stock') {
        fields = { stock_quantity_cartons: 100, stock: 100, disabled: false, isApproved: true, approvalStatus: 'approved' };
        actionLabel = "موجود شد (۱۰۰ کارتن شارژ گردید)";
      } else if (action === 'charge_50') {
        fields = { stock_quantity_cartons: 50, stock: 50, disabled: false };
        actionLabel = "با ۵۰ کارتن شارژ گردید";
      } else if (action === 'charge_200') {
        fields = { stock_quantity_cartons: 200, stock: 200, disabled: false };
        actionLabel = "با ۲۰۰ کارتن شارژ گردید";
      }

      // Optimistic instant state update
      if (onUpdateProduct) {
        onUpdateProduct(product.id, fields);
      }

      const updatedProduct = {
        ...product,
        ...fields,
        updatedAt: new Date().toISOString()
      };

      setMsg(`محصول "${product.name}" ${actionLabel}.`);

      // Execute network syncing in background without awaiting/blocking UI
      fetch(`/api/v1/dev/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      }).then(async (res) => {
        if (!res.ok) {
          await fetch(`/api/v1/dev/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct)
          });
        }
        if (onRefreshProducts) onRefreshProducts();
      }).catch(err => {
        console.error("Background sync failed:", err);
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBumpProduct = async (product: Product) => {
    try {
      const nowIso = new Date().toISOString();
      const updatedProduct = {
        ...product,
        updatedAt: nowIso,
        bumpedAt: nowIso
      };

      await fetch(`/api/v1/dev/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      setMsg(`محصول "${product.name}" بروزرسانی گردید.`);
      if (onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("آیا از حذف این محصول اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/v1/dev/products/${id}`, { method: 'DELETE' });
      if (res.ok && onRefreshProducts) await onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = products.filter(p => p.name?.includes(search) || p.brand?.includes(search) || p.category?.includes(search));

  return (
    <div className="space-y-6 text-right font-iranyekan" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Box className="text-indigo-600" /> مدیریت کاتالوگ و محصولات
          </h2>
          <p className="text-xs text-slate-500 font-bold mt-1">
            تعیین وضعیت ویژه، کف بازار، بروزرسانی و ویرایش محصولات
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={() => setShowJsonModal(true)} 
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            title="افزودن و همگام‌سازی محصولات از لینک کاتالوگ JSON یا فایل آفلاین"
          >
            <FileJson size={16} className="text-amber-600" />
            <span>⚡ ورود کاتالوگ JSON</span>
          </button>

          <button 
            type="button"
            onClick={() => { setShowForm(true); setIsEditing(null); setFormData(initialFormState); }} 
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95"
          >
            <Plus size={16} /> محصول جدید
          </button>
        </div>
      </div>

      {/* Notification Message */}
      {msg && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black flex items-center justify-between animate-fade-in shadow-xs">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-emerald-600 font-bold p-1">✕</button>
        </div>
      )}

      {/* Form modal or inline edit */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">نام محصول *</label>
            <input type="text" required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">برند *</label>
            <select value={formData.brand || 'مینو'} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs font-bold bg-white">
              {["مینو", "چی‌توز", "گرجی", "شیرین‌عسل", "فرمند", "ویتانا", "سن‌ایچ", "گلستان", "طبیعت", "پگاه", "دامداران", "زرین‌گلوکز", "بهارستان", "سایر برندهای معتبر"].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">دسته‌بندی *</label>
            <select value={formData.category || 'تنقلات و شکلات'} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs font-bold bg-white">
              {["تنقلات و شکلات", "کیک، کلوچه و بیسکویت", "مواد غذایی و کنسروجات", "نوشیدنی‌ها", "شوینده و بهداشتی", "لبنیات و فرآورده‌ها", "مواد اولیه کارخانجات", "تجهیزات صنعتی"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">نوع بسته‌بندی *</label>
            <select value={formData.unit || 'کارتن'} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs font-bold bg-white">
              {["کارتن", "کیسه", "باکس", "بشکه", "پالت", "قوطی", "شیشه", "پت", "حلب", "سلفون", "گونی", "بسته", "دبه", "شل"].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">وزن محصول (مثال: ۵۰۰ گرم یا ۱۰ کیلوگرم) *</label>
            <input type="text" required placeholder="مثال: ۲۵۰ گرم، ۲۰ کیلوگرم" value={formData.weight || ''} onChange={e => setFormData({...formData, weight: e.target.value})} className="w-full p-2.5 border rounded-xl text-xs font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تعداد در بسته‌بندی / کارتن *</label>
            <input type="number" min={1} required value={formData.itemsPerCarton || 24} onChange={e => setFormData({...formData, itemsPerCarton: Number(e.target.value)})} className="w-full p-2.5 border rounded-xl text-xs font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">قیمت پایه کارخانه (تومان)</label>
            <input type="number" min={0} value={formData.price || 0} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full p-2.5 border rounded-xl text-xs font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">قیمت نمایندگی / بنکدار (تومان)</label>
            <input type="number" min={0} value={formData.dealerPrice || 0} onChange={e => setFormData({...formData, dealerPrice: Number(e.target.value)})} className="w-full p-2.5 border rounded-xl text-xs font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">قیمت فروش سایت / مصرف‌کننده (تومان)</label>
            <input type="number" min={0} value={formData.marketPrice || 0} onChange={e => setFormData({...formData, marketPrice: Number(e.target.value)})} className="w-full p-2.5 border rounded-xl text-xs font-bold" />
          </div>

          {/* Live Profit Calculation Card */}
          <div className="md:col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-emerald-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Calculator size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black">تحلیل سود و حاشیه سود تجاری</h4>
                <p className="text-[11px] text-emerald-700 font-medium">محاسبه اتوماتیک سود نمایندگی و سود فروشگاه بر اساس قیمت‌ها</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-left">
              <div>
                <span className="text-[10px] text-slate-500 block">سود بنکداری / نمایندگی:</span>
                <span className="text-xs font-black text-emerald-700">
                  {formData.price && formData.dealerPrice && formData.dealerPrice > formData.price 
                    ? `${(formData.dealerPrice - formData.price).toLocaleString()} تومان (${(((formData.dealerPrice - formData.price) / formData.price) * 100).toFixed(1)}%)`
                    : 'محاسبه نشده'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">سود خرده‌فروشی سایت:</span>
                <span className="text-xs font-black text-emerald-800">
                  {formData.dealerPrice && formData.marketPrice && formData.marketPrice > formData.dealerPrice 
                    ? `${(formData.marketPrice - formData.dealerPrice).toLocaleString()} تومان (${(((formData.marketPrice - formData.dealerPrice) / formData.dealerPrice) * 100).toFixed(1)}%)`
                    : 'محاسبه نشده'}
                </span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <ParsPackImageUploader
              label="تصویر محصول (آپلود از گالری یا انتخاب فایل)"
              subLabel="فرمت‌های مجاز JPG، PNG، WEBP تا حجم ۲۰ مگابایت"
              value={formData.imageUrl || ''}
              onChange={(url) => setFormData({...formData, imageUrl: url})}
              folder="products"
              aspectRatio="square"
            />
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 md:col-span-2">
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 cursor-pointer">
              <input type="checkbox" checked={formData.isSpecial || false} onChange={e => setFormData({...formData, isSpecial: e.target.checked})} className="w-4 h-4 accent-amber-500 rounded" />
              <span>ویژه کردن 🌟</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 cursor-pointer">
              <input type="checkbox" checked={formData.isFloorMarket || false} onChange={e => setFormData({...formData, isFloorMarket: e.target.checked})} className="w-4 h-4 accent-rose-500 rounded" />
              <span>کف بازار 🔥</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs font-black text-amber-800 cursor-pointer bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
              <input type="checkbox" checked={formData.isSediment || false} onChange={e => setFormData({...formData, isSediment: e.target.checked})} className="w-4 h-4 accent-amber-600 rounded" />
              <span>کالای رسوب‌کرده انبار 📦</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs font-black text-blue-800 cursor-pointer bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
              <input type="checkbox" checked={formData.isSurplus || false} onChange={e => setFormData({...formData, isSurplus: e.target.checked})} className="w-4 h-4 accent-blue-600 rounded" />
              <span>مازاد تولید کارخانه 🏭</span>
            </label>
          </div>

          {/* Customization Section for Sediment & Surplus Metadata (% تخفیف, مدت دپو, زمان تا انقضا) */}
          <div className="md:col-span-2 bg-amber-50/70 p-4.5 rounded-2xl border border-amber-200/90 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-200/70 pb-2.5">
              <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Layers size={15} className="text-amber-600" />
                <span>سفارشی‌سازی مشخصات و متای کالای رسوب‌کرده و مازاد انبار</span>
              </h4>
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-lg border border-amber-300">
                قابل نمایش روی کارت محصولات رسوبی
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. درصد تخفیف انبار */}
              <div>
                <label className="block text-xs font-black text-amber-950 mb-1">
                  ۱. درصد تخفیف انبار (%)
                </label>
                <div className="flex items-center gap-1.5">
                  <input 
                    type="number" 
                    min={0} 
                    max={70} 
                    step={0.5}
                    value={formData.sedimentDiscountPercent ?? 20} 
                    onChange={e => {
                      const discount = Number(e.target.value);
                      const calcPrice = Math.round((formData.price || formData.bulk_price || 0) * (1 - discount / 100));
                      setFormData({
                        ...formData, 
                        sedimentDiscountPercent: discount,
                        sedimentPrice: calcPrice
                      });
                    }} 
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-black font-mono text-amber-900 outline-none focus:ring-2 focus:ring-amber-400" 
                  />
                  <span className="text-xs font-bold text-amber-800">%</span>
                </div>
                <p className="text-[9.5px] text-amber-800 font-bold mt-1">پیش‌نمایش: %۲0 تخفیف انبار</p>
              </div>

              {/* 2. مدت زمان دپو در انبار */}
              <div>
                <label className="block text-xs font-black text-amber-950 mb-1">
                  ۲. مدت زمان دپو در انبار
                </label>
                <input 
                  type="text" 
                  placeholder="مثال: ۲ ماه دپو در انبار"
                  value={formData.sedimentDuration ?? "۲ ماه دپو در انبار"} 
                  onChange={e => setFormData({ ...formData, sedimentDuration: e.target.value })} 
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-400" 
                />
                <p className="text-[9.5px] text-amber-800 font-bold mt-1">پیش‌نمایش: دپو: ۲ ماه دپو در انبار</p>
              </div>

              {/* 3. زمان باقی‌مانده تا انقضا */}
              <div>
                <label className="block text-xs font-black text-amber-950 mb-1">
                  ۳. زمان باقی‌مانده تا انقضا
                </label>
                <input 
                  type="text" 
                  placeholder="مثال: ۶ ماه تا انقضا"
                  value={formData.shelfLifeRemaining ?? "۶ ماه تا انقضا"} 
                  onChange={e => setFormData({ ...formData, shelfLifeRemaining: e.target.value })} 
                  className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-400" 
                />
                <p className="text-[9.5px] text-amber-800 font-bold mt-1">پیش‌نمایش: ۶ ماه تا انقضا</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex gap-2 pt-2">
            <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs cursor-pointer shadow-sm transition-colors">ذخیره محصول</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs cursor-pointer transition-colors">انصراف</button>
          </div>
        </form>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-2 bg-slate-50/50">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="جستجوی سریع محصول با نام، برند یا دسته‌بندی..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full outline-none text-xs font-bold bg-transparent text-slate-800 placeholder-slate-400" 
          />
        </div>

        {/* 1. Mobile Cards Layout (< lg screens) */}
        <div className="block lg:hidden divide-y divide-slate-100">
          {filtered.map(p => {
            const isSpec = (p as any).isSpecial || (p as any).isFeatured;
            const isFloor = (p as any).isFloorMarket || (p as any).isKafBazar;
            const isSed = p.isSediment;
            const isSurp = p.isSurplus;

            return (
              <div key={p.id} className="p-4 space-y-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <img 
                    src={p.imageUrl || '/placeholder.png'} 
                    alt={p.name} 
                    className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-black text-sm text-slate-900 truncate">{p.name}</h4>
                      {isSpec && <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-black border border-amber-300">ویژه 🌟</span>}
                      {isFloor && <span className="bg-rose-100 text-rose-900 text-[10px] px-2 py-0.5 rounded-md font-black border border-rose-300">کف بازار 🔥</span>}
                      {isSed && <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-black border border-amber-400">رسوب‌کرده 📦</span>}
                      {isSurp && <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-md font-black border border-blue-400">مازاد خط 🏭</span>}
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">{p.brand || 'بدون برند'} - {p.category || 'بدون دسته‌بندی'}</p>
                    <p className="text-xs font-black text-emerald-700 font-mono mt-1">{(p.price || 0).toLocaleString()} تومان</p>
                  </div>
                </div>

                {/* Mobile Responsive Status Toggles (5 Quick Action Icons) */}
                <div className="flex items-center justify-between bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 gap-1 mt-1">
                  <span className="text-[10px] font-black text-slate-500 mr-1 whitespace-nowrap">تنظیم سریع:</span>
                  <div className="flex items-center gap-1">
                    {/* 1. Activate */}
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(p, 'activate')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        !p.disabled && (p.isApproved || p.approvalStatus === 'approved')
                          ? "bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400"
                          : "bg-white text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200"
                      }`}
                      title="فعال‌سازی کالا و انتشار در ویترین فروشگاه"
                    >
                      <Eye size={13} />
                    </button>

                    {/* 2. Deactivate */}
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(p, 'deactivate')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        p.disabled
                          ? "bg-rose-600 text-white shadow-xs ring-1 ring-rose-400"
                          : "bg-white text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200"
                      }`}
                      title="غیرفعال‌سازی و تعلیق کالا (مخفی از دید خریداران)"
                    >
                      <EyeOff size={13} />
                    </button>

                    {/* 3. Out of stock */}
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(p, 'out_of_stock')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        p.stock_quantity_cartons === 0 || p.stock === 0
                          ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400"
                          : "bg-white text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-slate-200"
                      }`}
                      title="ناموجود کردن کالا (صفر کردن موجودی انبار)"
                    >
                      <PackageX size={13} />
                    </button>

                    {/* 4. In Stock / Quick Charge 100 */}
                    <button
                      type="button"
                      onClick={() => handleQuickStatusChange(p, 'in_stock')}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        (p.stock_quantity_cartons || p.stock || 0) > 0 && !p.disabled
                          ? "bg-teal-600 text-white shadow-xs"
                          : "bg-white text-slate-400 hover:text-teal-700 hover:bg-teal-50 border border-slate-200"
                      }`}
                      title="موجود کردن فوری و شارژ ۱۰۰ کارتن در انبار"
                    >
                      <PackageCheck size={13} />
                    </button>

                    {/* 5. Floor Market Quick Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleFloorMarket(p)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isFloor
                          ? "bg-rose-600 text-white shadow-xs ring-1 ring-rose-400 animate-pulse"
                          : "bg-white text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200"
                      }`}
                      title="کف بازار کارخانجات 🔥"
                    >
                      <Flame size={13} />
                    </button>
                  </div>
                </div>

                {/* Mobile Responsive Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Sediment Button */}
                  <button
                    onClick={() => handleToggleSediment(p)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
                      isSed ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs" : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                    }`}
                  >
                    <Layers size={13} />
                    <span>{isSed ? "📦 رسوب‌کرده (فعال)" : "📦 رسوب‌کرده"}</span>
                  </button>

                  {/* Surplus Button */}
                  <button
                    onClick={() => handleToggleSurplus(p)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
                      isSurp ? "bg-blue-600 text-white border-blue-500 shadow-xs" : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    <Package size={13} />
                    <span>{isSurp ? "🏭 مازاد تولید (فعال)" : "🏭 مازاد تولید"}</span>
                  </button>

                  {/* Special Button */}
                  <button
                    onClick={() => handleToggleSpecial(p)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
                      isSpec ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs" : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>{isSpec ? "🌟 ویژه" : "ویژه کردن"}</span>
                  </button>

                  {/* Floor Market Button */}
                  <button
                    onClick={() => handleToggleFloorMarket(p)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border cursor-pointer active:scale-95 ${
                      isFloor ? "bg-rose-600 text-white border-rose-500 shadow-xs" : "bg-rose-50 text-rose-900 border-rose-200 hover:bg-rose-100"
                    }`}
                  >
                    <Zap size={13} />
                    <span>{isFloor ? "🔥 کف بازار" : "کف بازار"}</span>
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  {/* Bump Button */}
                  <button
                    onClick={() => handleBumpProduct(p)}
                    className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl cursor-pointer"
                    title="بروزرسانی محصول"
                  >
                    <RotateCcw size={15} />
                  </button>

                  {/* Edit Button */}
                  <button 
                    onClick={() => { setIsEditing(p.id); setFormData(p); setShowForm(true); }} 
                    className="p-2 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl cursor-pointer"
                    title="ویرایش"
                  >
                    <Edit2 size={15} />
                  </button>

                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(p.id)} 
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Desktop Table Layout (>= lg screens) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-black border-b border-slate-200">
              <tr>
                <th className="p-3.5">تصویر</th>
                <th className="p-3.5">نام محصول</th>
                <th className="p-3.5">برند / دسته‌بندی</th>
                <th className="p-3.5">قیمت پایه</th>
                <th className="p-3.5">وضعیت</th>
                <th className="p-3.5 text-center">تنظیم سریع وضعیت / انبار</th>
                <th className="p-3.5 text-center">عملیات ساد و ریسپانسیو</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {filtered.map(p => {
                const isSpec = (p as any).isSpecial || (p as any).isFeatured;
                const isFloor = (p as any).isFloorMarket || (p as any).isKafBazar;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <img src={p.imageUrl || '/placeholder.png'} alt={p.name} className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200" />
                    </td>
                    <td className="p-3.5 font-black text-slate-900">
                      {p.name}
                      {p.disabled && <span className="bg-rose-100 text-rose-800 text-[9px] px-1.5 py-0.5 rounded-md mr-1.5 font-bold">غیرفعال 👁️‍🌫️</span>}
                    </td>
                    <td className="p-3.5 text-slate-600">{p.brand || '—'} / {p.category || '—'}</td>
                    <td className="p-3.5 font-mono text-emerald-700 font-black">{(p.price || 0).toLocaleString()} تومان</td>
                    <td className="p-3.5">
                      <div className="flex gap-1 flex-wrap">
                        {isSpec && <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-black border border-amber-300">ویژه 🌟</span>}
                        {isFloor && <span className="bg-rose-100 text-rose-900 text-[10px] px-2 py-0.5 rounded-md font-black border border-rose-300">کف بازار 🔥</span>}
                        {p.isSediment && <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-md font-black border border-amber-400">رسوب‌کرده 📦</span>}
                        {p.isSurplus && <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-md font-black border border-blue-400">مازاد خط 🏭</span>}
                        {!isSpec && !isFloor && !p.isSediment && !p.isSurplus && <span className="text-slate-400 text-[10px]">عادی</span>}
                      </div>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200">
                        {/* 1. Activate */}
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(p, 'activate')}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            !p.disabled && (p.isApproved || p.approvalStatus === 'approved')
                              ? "bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-400"
                              : "bg-white text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200"
                          }`}
                          title="فعال‌سازی کالا و انتشار در ویترین فروشگاه"
                        >
                          <Eye size={12} />
                        </button>

                        {/* 2. Deactivate */}
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(p, 'deactivate')}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            p.disabled
                              ? "bg-rose-600 text-white shadow-xs ring-1 ring-rose-400"
                              : "bg-white text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200"
                          }`}
                          title="غیرفعال‌سازی و تعلیق کالا (مخفی از دید خریداران)"
                        >
                          <EyeOff size={12} />
                        </button>

                        {/* 3. Out of stock */}
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(p, 'out_of_stock')}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            p.stock_quantity_cartons === 0 || p.stock === 0
                              ? "bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-400"
                              : "bg-white text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-slate-200"
                          }`}
                          title="ناموجود کردن کالا (صفر کردن موجودی انبار)"
                        >
                          <PackageX size={12} />
                        </button>

                        {/* 4. In Stock / Quick Charge 100 */}
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(p, 'in_stock')}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            (p.stock_quantity_cartons || p.stock || 0) > 0 && !p.disabled
                              ? "bg-teal-600 text-white shadow-xs"
                              : "bg-white text-slate-400 hover:text-teal-700 hover:bg-teal-50 border border-slate-200"
                          }`}
                          title="موجود کردن فوری و شارژ ۱۰۰ کارتن در انبار"
                        >
                          <PackageCheck size={12} />
                        </button>

                        {/* 5. Floor Market Quick Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleFloorMarket(p)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            isFloor
                              ? "bg-rose-600 text-white shadow-xs ring-1 ring-rose-400 animate-pulse"
                              : "bg-white text-slate-400 hover:text-rose-700 hover:bg-rose-50 border border-slate-200"
                          }`}
                          title="کف بازار کارخانجات 🔥"
                        >
                          <Flame size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* Sediment Button */}
                        <button
                          onClick={() => handleToggleSediment(p)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border cursor-pointer active:scale-95 ${
                            p.isSediment ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs" : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                          }`}
                          title="فعال‌سازی / غیرفعال‌سازی رسوب کالا"
                        >
                          <Layers size={13} />
                          <span>{p.isSediment ? "📦 رسوب" : "رسوب"}</span>
                        </button>

                        {/* Surplus Button */}
                        <button
                          onClick={() => handleToggleSurplus(p)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border cursor-pointer active:scale-95 ${
                            p.isSurplus ? "bg-blue-600 text-white border-blue-500 shadow-xs" : "bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200"
                          }`}
                          title="فعال‌سازی / غیرفعال‌سازی مازاد تولید"
                        >
                          <Package size={13} />
                          <span>{p.isSurplus ? "🏭 مازاد" : "مازاد"}</span>
                        </button>

                        {/* Special Button */}
                        <button
                          onClick={() => handleToggleSpecial(p)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border cursor-pointer active:scale-95 ${
                            isSpec ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs" : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                          title="ویژه کردن محصول"
                        >
                          <Sparkles size={13} />
                          <span>{isSpec ? "🌟 ویژه" : "ویژه"}</span>
                        </button>

                        {/* Floor Market Button */}
                        <button
                          onClick={() => handleToggleFloorMarket(p)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 border cursor-pointer active:scale-95 ${
                            isFloor ? "bg-rose-600 text-white border-rose-500 shadow-xs" : "bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-200"
                          }`}
                          title="افزودن به کف بازار"
                        >
                          <Zap size={13} />
                          <span>{isFloor ? "🔥 کف بازار" : "کف بازار"}</span>
                        </button>

                        {/* Bump Button */}
                        <button
                          onClick={() => handleBumpProduct(p)}
                          className="p-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl cursor-pointer"
                          title="بروزرسانی زمان محصول"
                        >
                          <RotateCcw size={14} />
                        </button>

                        {/* Edit */}
                        <button 
                          onClick={() => { setIsEditing(p.id); setFormData(p); setShowForm(true); }} 
                          className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-xl cursor-pointer"
                          title="ویرایش محصول"
                        >
                          <Edit2 size={14} />
                        </button>

                        {/* Delete */}
                        <button 
                          onClick={() => handleDelete(p.id)} 
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl cursor-pointer"
                          title="حذف محصول"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin JSON Catalog Import & Sync Modal */}
      <SmartJsonCatalogModal
        isOpen={showJsonModal}
        onClose={() => setShowJsonModal(false)}
        onApplyProducts={handleApplyImportedJson}
      />
    </div>
  );
}
