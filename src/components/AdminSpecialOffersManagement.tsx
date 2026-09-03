import React, { useState, useMemo } from "react";
import {
  Flame,
  Percent,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Save,
  Search,
  Gift,
  CreditCard,
  Zap,
  TrendingDown,
  Layers,
  X,
  Clock,
  Building2,
  Package,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, B2BConfig, SpecialOfferItem, SpecialOffersConfig } from "../types";
import { getDisplayImageUrl } from "../lib/image-utils";
import { postSpecialOfferToChannel, postKafBazaarToChannel } from "../utils/channel-utils";

interface AdminSpecialOffersManagementProps {
  products: Product[];
  b2bConfig: B2BConfig;
  onUpdateB2bConfig: (updated: Partial<B2BConfig>) => Promise<void>;
  onUpdateProduct?: (id: string, product: Partial<Product>) => Promise<any> | void;
}

const toPersianNum = (n: number | string | undefined | null): string => {
  if (n === undefined || n === null) return "";
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return n.toString().replace(/\d/g, x => farsiDigits[parseInt(x, 10)]);
};

export default function AdminSpecialOffersManagement({
  products,
  b2bConfig,
  onUpdateB2bConfig,
  onUpdateProduct,
}: AdminSpecialOffersManagementProps) {
  // Read existing configuration or initialize with safe defaults
  const savedConfig = b2bConfig?.specialOffersConfig;

  // Initialize initial items from config or explicitly marked products
  const initialItems: SpecialOfferItem[] = useMemo(() => {
    if (savedConfig?.items && savedConfig.items.length > 0) {
      return savedConfig.items;
    }
    // Fallback: only include products that already have explicit discount_percent > 0 or specialOfferActive
    const explicitActive = products.filter(p => (p.discount_percent && p.discount_percent > 0) || p.specialOfferActive || p.isHotFireDeal);
    if (explicitActive.length > 0) {
      return explicitActive.map((p, idx) => ({
        id: `offer-${p.id}`,
        productId: p.id,
        productName: p.name,
        brand: p.brand,
        imageUrl: p.image_url || p.imageUrl,
        category: p.category,
        bulkPrice: p.bulk_price || p.price,
        purchasePrice: p.purchase_price || Math.round((p.bulk_price || p.price) * 0.85),
        discountPercent: p.discount_percent || p.discountPercent || (p.isHotFireDeal ? 12 : 8),
        minOrderCartons: p.min_order_cartons || p.minOrderCartons || 5,
        bonusGiftCartons: 0,
        bonusDescription: "",
        campaignQuotaCartons: 50,
        soldQuotaCartons: 0,
        chequeAllowed: p.chequeAllowed !== false,
        isKafBazaar: !!p.isKafBazaar,
        active: true,
        maxDiscountCapPercent: 18,
      }));
    }
    // If none exist, pick 2-3 sample products to help admin start easily, but with conservative 5-8% safe discounts
    return products.slice(0, 3).map((p, idx) => ({
      id: `offer-${p.id}-${idx}`,
      productId: p.id,
      productName: p.name,
      brand: p.brand,
      imageUrl: p.image_url || p.imageUrl,
      category: p.category,
      bulkPrice: p.bulk_price || p.price,
      purchasePrice: p.purchase_price || Math.round((p.bulk_price || p.price) * 0.88),
      discountPercent: 8,
      minOrderCartons: 10,
      bonusGiftCartons: 1,
      bonusDescription: "۱۰ کارتن + ۱ کارتن هدیه",
      campaignQuotaCartons: 60,
      soldQuotaCartons: 0,
      chequeAllowed: true,
      isKafBazaar: true,
      active: true,
      maxDiscountCapPercent: 15,
    }));
  }, [savedConfig, products]);

  const [campaignActive, setCampaignActive] = useState<boolean>(savedConfig?.campaignActive !== false);
  const [campaignTitle, setCampaignTitle] = useState<string>(savedConfig?.campaignTitle || "جشنواره فروش مستقیم و آفرهای تناژ کارخانجات");
  const [campaignSubtitle, setCampaignSubtitle] = useState<string>(savedConfig?.campaignSubtitle || "تخفیفات مصوب خط تولید، اشانتیون‌های تضمینی و شرایط تسویه چکی صیادی");
  const [campaignBadge, setCampaignBadge] = useState<string>(savedConfig?.campaignBadge || "آفرهای ویژه بنکداری");
  const [preventLossMaxDiscount, setPreventLossMaxDiscount] = useState<number>(savedConfig?.preventLossMaxDiscountPercent || 20);
  const [items, setItems] = useState<SpecialOfferItem[]>(initialItems);

  // Modal / Form state to add / edit offer
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formDiscount, setFormDiscount] = useState<number>(10);
  const [formMinCartons, setFormMinCartons] = useState<number>(5);
  const [formBonusText, setFormBonusText] = useState<string>("");
  const [formQuota, setFormQuota] = useState<number>(50);
  const [formCheque, setFormCheque] = useState<boolean>(true);
  const [formKafBazaar, setFormKafBazaar] = useState<boolean>(true);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Messages
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter products for modal selection
  const filteredCatalog = useMemo(() => {
    if (!searchProductQuery.trim()) return products.slice(0, 15);
    const q = searchProductQuery.toLowerCase();
    return products.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [products, searchProductQuery]);

  // Open modal for new item
  const handleOpenAddModal = () => {
    setEditingItemId(null);
    setSelectedProduct(null);
    setSearchProductQuery("");
    setFormDiscount(8);
    setFormMinCartons(5);
    setFormBonusText("");
    setFormQuota(50);
    setFormCheque(true);
    setFormKafBazaar(true);
    setShowAddModal(true);
  };

  // Open modal for editing existing offer item
  const handleOpenEditModal = (item: SpecialOfferItem) => {
    setEditingItemId(item.id);
    const prod = products.find(p => p.id === item.productId) || {
      id: item.productId,
      name: item.productName || "",
      brand: item.brand || "",
      bulk_price: item.bulkPrice || 0,
      price: item.bulkPrice || 0,
      image_url: item.imageUrl || "",
      category: item.category || "",
    } as Product;
    setSelectedProduct(prod);
    setFormDiscount(item.discountPercent);
    setFormMinCartons(item.minOrderCartons);
    setFormBonusText(item.bonusDescription || "");
    setFormQuota(item.campaignQuotaCartons || 50);
    setFormCheque(item.chequeAllowed !== false);
    setFormKafBazaar(!!item.isKafBazaar);
    setShowAddModal(true);
  };

  // Save item in list
  const handleSaveModalItem = () => {
    if (!selectedProduct) return;

    const baseBulkPrice = selectedProduct.bulk_price || selectedProduct.price || 0;
    const purchasePrice = selectedProduct.purchase_price || Math.round(baseBulkPrice * 0.85);

    if (editingItemId) {
      setItems(prev => prev.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            brand: selectedProduct.brand,
            imageUrl: selectedProduct.image_url || selectedProduct.imageUrl,
            category: selectedProduct.category,
            bulkPrice: baseBulkPrice,
            purchasePrice,
            discountPercent: formDiscount,
            minOrderCartons: formMinCartons,
            bonusDescription: formBonusText.trim(),
            campaignQuotaCartons: formQuota,
            chequeAllowed: formCheque,
            isKafBazaar: formKafBazaar,
          };
        }
        return item;
      }));
    } else {
      const newItem: SpecialOfferItem = {
        id: `offer-${Date.now()}-${selectedProduct.id}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        brand: selectedProduct.brand,
        imageUrl: selectedProduct.image_url || selectedProduct.imageUrl,
        category: selectedProduct.category,
        bulkPrice: baseBulkPrice,
        purchasePrice,
        discountPercent: formDiscount,
        minOrderCartons: formMinCartons,
        bonusDescription: formBonusText.trim(),
        campaignQuotaCartons: formQuota,
        soldQuotaCartons: 0,
        chequeAllowed: formCheque,
        isKafBazaar: formKafBazaar,
        active: true,
        maxDiscountCapPercent: preventLossMaxDiscount,
      };
      setItems(prev => [newItem, ...prev]);

      // Automatically broadcast to the notification channel
      if (formKafBazaar) {
        postKafBazaarToChannel({
          id: selectedProduct.id,
          name: selectedProduct.name,
          brand: selectedProduct.brand,
          category: selectedProduct.category,
          bulk_price: baseBulkPrice,
          price: baseBulkPrice,
          unit: selectedProduct.unit,
          carton_pack_count: selectedProduct.carton_pack_count,
          min_order_cartons: formMinCartons
        });
      } else {
        postSpecialOfferToChannel({
          id: selectedProduct.id,
          name: selectedProduct.name,
          brand: selectedProduct.brand,
          category: selectedProduct.category,
          bulk_price: baseBulkPrice,
          price: baseBulkPrice,
          unit: selectedProduct.unit,
          carton_pack_count: selectedProduct.carton_pack_count,
          min_order_cartons: formMinCartons
        });
      }
    }

    setShowAddModal(false);
  };

  // Toggle active status for item
  const handleToggleItemActive = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, active: !item.active } : item));
  };

  // Delete item from offers
  const handleDeleteItem = (id: string) => {
    if (window.confirm("آیا این محصول از جشنواره آفرهای ویژه حذف شود؟")) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Save all to b2bConfig and sync
  const handleSaveAllConfig = async () => {
    setSaving(true);
    try {
      const configPayload: SpecialOffersConfig = {
        campaignActive,
        campaignTitle: campaignTitle.trim(),
        campaignSubtitle: campaignSubtitle.trim(),
        campaignBadge: campaignBadge.trim(),
        preventLossMaxDiscountPercent: preventLossMaxDiscount,
        items,
      };

      await onUpdateB2bConfig({
        ...b2bConfig,
        specialOffersConfig: configPayload,
      });

      // Also persist to localStorage for instant local reactivity
      localStorage.setItem("dastavval_special_offers_config", JSON.stringify(configPayload));
      window.dispatchEvent(new CustomEvent("dastavval_special_offers_updated", { detail: configPayload }));

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (e) {
      console.error("Error saving special offers:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-xs shrink-0">
            <Flame size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                مدیریت جشنواره و آفرهای ویژه (سیستم کنترل حاشیه سود)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                جلوگیری از ضرر مالی سازمان
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-1">
              تنظیم دقیق محصولات مشمول تخفیف مصوب، کنترل سقف تخفیف، اشانتیون‌های اعطایی و شرایط تسویه
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleSaveAllConfig}
            disabled={saving}
            className="w-full md:w-auto px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? "در حال ذخیره‌سازی..." : "ذخیره تغییرات آفرها"}</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-black flex items-center gap-2 animate-fade-in shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>تنظیمات جشنواره و آفرهای ویژه با موفقیت ذخیره و در سامانه اعمال گردید.</span>
        </div>
      )}

      {/* Campaign Main Parameters & Anti-Loss Guard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Anti-Loss Safe Margins Card */}
        <div className="bg-amber-50/70 rounded-3xl p-6 border border-amber-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-amber-900">
            <ShieldCheck size={20} className="text-amber-600 shrink-0" />
            <h3 className="text-xs sm:text-sm font-black">سوئیچ امنیتی و مهار ضرر مالی</h3>
          </div>
          <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
            جهت جلوگیری از اعمال ناخواسته تخفیف‌های سنگین یا ضرر به کارخانه، سقف مجاز تخفیف و سوئیچ فعال‌سازی سراسری در این بخش اعمال می‌شود.
          </p>

          <div className="space-y-3 pt-2">
            {/* Global Campaign Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-amber-200/80">
              <div>
                <div className="text-xs font-black text-slate-900">وضعیت نمایش سراسری جشنواره:</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                  {campaignActive ? "فعال و در دسترس مشتریان" : "غیرفعال (مخفی در صفحه اصلی)"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCampaignActive(!campaignActive)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  campaignActive ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    campaignActive ? "-translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Maximum Discount Ceiling */}
            <div className="p-3.5 rounded-2xl bg-white border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900">حداکثر سقف مجاز تخفیف سازمانی:</span>
                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                  {toPersianNum(preventLossMaxDiscount)}٪
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                value={preventLossMaxDiscount}
                onChange={(e) => setPreventLossMaxDiscount(Number(e.target.value))}
                className="w-full accent-rose-600 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                <span>حداقل ۳٪ (محتاطانه)</span>
                <span>سقف ایمن ۲۰٪</span>
                <span>حداکثر ۳۰٪</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Texts & Headings */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
            <Sparkles size={18} className="text-rose-600" />
            <h3 className="text-xs sm:text-sm font-black">عناوین و متن‌های تبلیغاتی جشنواره</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700">عنوان جشنواره:</label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                placeholder="مثلاً: جشنواره تخفیف‌های ویژه تناژ کارخانجات"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-700">برچسب بالای جشنواره:</label>
              <input
                type="text"
                value={campaignBadge}
                onChange={(e) => setCampaignBadge(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                placeholder="مثلاً: آفرهای داغ خط تولید 🔥"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[11px] font-black text-slate-700">توضیح کوتاه و ترغیب‌کننده:</label>
              <input
                type="text"
                value={campaignSubtitle}
                onChange={(e) => setCampaignSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white transition-all"
                placeholder="شرح شرایط تخفیف، اشانتیون و ارسال مستقیم..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Offer Items Table & Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
              <Package size={17} className="text-rose-600" />
              <span>لیست محصولات برگزیده در جشنواره ({toPersianNum(items.length)} کالا)</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              فقط کالاهایی که در این لیست فعال باشند با برچسب آفر و تخفیف مصوب نمایش داده می‌شوند
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus size={15} />
            <span>افزودن کالا به جشنواره</span>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Flame className="mx-auto text-slate-300" size={32} />
            <h4 className="text-xs font-black text-slate-700">هیچ کالایی به آفر اضافه نشده است</h4>
            <p className="text-[11px] text-slate-400 font-bold">
              برای افزودن اولین کالای مشمول آفر، روی دکمه «افزودن کالا به جشنواره» کلیک کنید.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-black">
                  <th className="p-3">کالا / تصویر</th>
                  <th className="p-3">قیمت پایه عمده</th>
                  <th className="p-3">درصد تخفیف</th>
                  <th className="p-3">قیمت نهایی آفر</th>
                  <th className="p-3">حداقل سفارش</th>
                  <th className="p-3">اشانتیون / هدیه</th>
                  <th className="p-3">سقف سهمیه</th>
                  <th className="p-3">حاشیه سود و هشدار</th>
                  <th className="p-3 text-center">وضعیت</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const bulk = item.bulkPrice || 10000;
                  const purchase = item.purchasePrice || Math.round(bulk * 0.85);
                  const discountedPrice = Math.round(bulk * (1 - item.discountPercent / 100));
                  const grossProfitPerUnit = discountedPrice - purchase;
                  const profitMarginPercent = Math.round((grossProfitPerUnit / discountedPrice) * 100);
                  const isDangerousLoss = grossProfitPerUnit <= 0;
                  const isLowMargin = profitMarginPercent < 5;

                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${!item.active ? 'opacity-50 bg-slate-50/30' : ''}`}>
                      <td className="p-3 flex items-center gap-2.5">
                        <img
                          src={getDisplayImageUrl(item.imageUrl)}
                          alt={item.productName}
                          className="w-10 h-10 object-cover rounded-xl border border-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-black text-slate-900 line-clamp-1">{item.productName}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{item.brand || "دست اول"}</div>
                        </div>
                      </td>

                      <td className="p-3 font-bold text-slate-600">
                        {toPersianNum(bulk.toLocaleString())} تومان
                      </td>

                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-black rounded-lg border border-rose-200">
                          {toPersianNum(item.discountPercent)}٪
                        </span>
                      </td>

                      <td className="p-3 font-black text-emerald-700">
                        {toPersianNum(discountedPrice.toLocaleString())} تومان
                      </td>

                      <td className="p-3 font-bold text-slate-700">
                        {toPersianNum(item.minOrderCartons)} کارتن
                      </td>

                      <td className="p-3">
                        {item.bonusDescription ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
                            🎁 {item.bonusDescription}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">ندارد</span>
                        )}
                      </td>

                      <td className="p-3 font-bold text-slate-600">
                        {toPersianNum(item.campaignQuotaCartons || 50)} کارتن
                      </td>

                      {/* Profit Margin Guard Column */}
                      <td className="p-3">
                        {isDangerousLoss ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-black animate-pulse">
                            <AlertTriangle size={12} />
                            <span>ضرر مالی (-{toPersianNum(Math.abs(profitMarginPercent))}٪)</span>
                          </div>
                        ) : isLowMargin ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black">
                            <Info size={12} />
                            <span>سود لب‌مرزی ({toPersianNum(profitMarginPercent)}٪)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                            <CheckCircle2 size={12} />
                            <span>سود ایمن ({toPersianNum(profitMarginPercent)}٪)</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleItemActive(item.id)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer transition-all ${
                            item.active
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-200 text-slate-600 border border-slate-300"
                          }`}
                        >
                          {item.active ? "فعال در سایت" : "غیرفعال"}
                        </button>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="ویرایش شرایط آفر"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف از جشنواره"
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
        )}
      </div>

      {/* Add / Edit Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden text-right"
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Flame size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {editingItemId ? "ویرایش شرایط آفر کالا" : "افزودن کالای جدید به جشنواره"}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold">
                      تعیین دقیق درصد تخفیف، اشانتیون و حداقل خرید کارتن
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Product Selector */}
                {!editingItemId && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-800">انتخاب کالا از کاتالوگ:</label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input
                        type="text"
                        value={searchProductQuery}
                        onChange={(e) => setSearchProductQuery(e.target.value)}
                        placeholder="جستجوی نام محصول، برند یا دسته‌بندی..."
                        className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500 focus:bg-white"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                      {filteredCatalog.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => setSelectedProduct(prod)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-all ${
                            selectedProduct?.id === prod.id
                              ? "bg-rose-50 border-r-4 border-rose-600 text-rose-950 font-black"
                              : "hover:bg-white text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={getDisplayImageUrl(prod.image_url || prod.imageUrl)}
                              alt={prod.name}
                              className="w-7 h-7 object-cover rounded-lg border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-xs font-bold">{prod.name}</div>
                          </div>
                          <div className="text-[11px] font-bold text-slate-500">
                            {toPersianNum((prod.bulk_price || prod.price || 0).toLocaleString())} ت
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Product Summary */}
                {selectedProduct && (
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={getDisplayImageUrl(selectedProduct.image_url || selectedProduct.imageUrl)}
                        alt={selectedProduct.name}
                        className="w-11 h-11 object-cover rounded-xl border border-rose-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-black text-rose-950">{selectedProduct.name}</div>
                        <div className="text-[10px] text-rose-700 font-bold">
                          قیمت عمده مصوب: {toPersianNum((selectedProduct.bulk_price || selectedProduct.price || 0).toLocaleString())} تومان
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Discount & Carton Settings */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700">درصد تخفیف آفر (٪):</label>
                    <input
                      type="number"
                      min={1}
                      max={preventLossMaxDiscount}
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(Math.min(preventLossMaxDiscount, Number(e.target.value)))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                    />
                    <span className="text-[9px] text-slate-400 font-bold">حداکثر سقف مجاز: {toPersianNum(preventLossMaxDiscount)}٪</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700">حداقل سفارش آفر (کارتن):</label>
                    <input
                      type="number"
                      min={1}
                      value={formMinCartons}
                      onChange={(e) => setFormMinCartons(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                    />
                    <span className="text-[9px] text-slate-400 font-bold">مثلاً ۵ یا ۱۰ کارتن</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700">سقف سهمیه کل آفر (کارتن):</label>
                    <input
                      type="number"
                      min={5}
                      value={formQuota}
                      onChange={(e) => setFormQuota(Number(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-black text-slate-700">اشانتیون / هدیه (اختیاری):</label>
                    <input
                      type="text"
                      value={formBonusText}
                      onChange={(e) => setFormBonusText(e.target.value)}
                      placeholder="مثلاً: ۱۰ کارتن + ۱ کارتن هدیه"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCheque}
                      onChange={(e) => setFormCheque(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700">مجاز به تسویه چکی صیادی</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formKafBazaar}
                      onChange={(e) => setFormKafBazaar(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-xs font-bold text-slate-700">نشان کف قیمت بازار 🔥</span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalItem}
                  disabled={!selectedProduct}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
                >
                  ثبت و تایید شرایط کالا
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
