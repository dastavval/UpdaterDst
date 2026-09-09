import React, { useState, useMemo } from "react";
import { 
  X, 
  Search, 
  Package, 
  Link2, 
  Unlink, 
  Check, 
  Sparkles, 
  Building2, 
  Percent, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Product } from "../types";
import { ExtendedFactoryProfile } from "./AdminFactoriesManagement";
import { toPersianDigits } from "../lib/pricing";

export interface FactoryProductLinkModalProps {
  factory: ExtendedFactoryProfile;
  allProducts: Product[];
  onClose: () => void;
  onUpdateProduct?: (id: string, updatedFields: Partial<Product>) => Promise<any> | void;
  onRefreshProducts?: () => Promise<void> | void;
}

export default function FactoryProductLinkModal({
  factory,
  allProducts = [],
  onClose,
  onUpdateProduct,
  onRefreshProducts
}: FactoryProductLinkModalProps) {
  const [activeTab, setActiveTab] = useState<"linked" | "catalog" | "batch_price">("linked");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("all");
  const [linkedSearch, setLinkedSearch] = useState("");
  
  // Quick price editing inside modal
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [newPriceVal, setNewPriceVal] = useState<number | "">("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Batch price change states
  const [batchPercent, setBatchPercent] = useState<number>(5);
  const [batchMode, setBatchMode] = useState<"increase" | "decrease">("increase");
  const [isApplyingBatch, setIsApplyingBatch] = useState(false);
  
  // Notification banner state
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);
  const [isAutoLinking, setIsAutoLinking] = useState(false);

  const fId = (factory.id || "").toLowerCase().trim();
  const fCode = (factory.factoryCode || "").toLowerCase().trim();
  const fName = (factory.name || "").toLowerCase().trim();
  const fBrands = (factory.ownedBrands || []).map(b => b.toLowerCase().trim());

  // Check if a product is linked to this factory
  const isProductLinked = (p: Product) => {
    const pSeller = (p.sellerId || "").toLowerCase().trim();
    const pFactId = ((p as any).factoryId || "").toLowerCase().trim();
    const pFactName = (p.factoryName || (p as any).factory_name || "").toLowerCase().trim();
    const pBrand = (p.brand || "").toLowerCase().trim();

    if (fId && (pSeller === fId || pFactId === fId)) return true;
    if (fCode && (pSeller === fCode || pFactId === fCode)) return true;
    if (fName && (pFactName === fName || (pFactName.length >= 3 && fName.includes(pFactName)) || (fName.length >= 3 && pFactName.includes(fName)))) return true;
    if (fBrands.length > 0 && fBrands.some(b => b && (pBrand === b || (pBrand.length >= 3 && pBrand.includes(b)) || (b.length >= 3 && b.includes(pBrand))))) return true;
    return false;
  };

  // Currently linked products
  const linkedProducts = useMemo(() => {
    return allProducts.filter(p => isProductLinked(p));
  }, [allProducts, factory]);

  // Filtered linked products
  const filteredLinkedProducts = useMemo(() => {
    if (!linkedSearch.trim()) return linkedProducts;
    const q = linkedSearch.toLowerCase().trim();
    return linkedProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [linkedProducts, linkedSearch]);

  // Unlinked products available in catalog
  const unlinkedProducts = useMemo(() => {
    return allProducts.filter(p => !isProductLinked(p));
  }, [allProducts, linkedProducts]);

  // Filtered unlinked catalog
  const filteredCatalogProducts = useMemo(() => {
    return unlinkedProducts.filter(p => {
      const matchSearch = !catalogSearch.trim() || 
        p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(catalogSearch.toLowerCase())) ||
        (p.id && p.id.toLowerCase().includes(catalogSearch.toLowerCase()));
      
      const matchCat = catalogCategory === "all" || p.category === catalogCategory;
      return matchSearch && matchCat;
    });
  }, [unlinkedProducts, catalogSearch, catalogCategory]);

  // Smart suggestions: unlinked products whose brand or name matches the factory name
  const smartMatchingProducts = useMemo(() => {
    if (!fName || fName.length < 3) return [];
    return unlinkedProducts.filter(p => {
      const pBrand = (p.brand || "").toLowerCase().trim();
      const pName = p.name.toLowerCase().trim();
      return pBrand.includes(fName) || fName.includes(pBrand) || pName.includes(fName);
    });
  }, [unlinkedProducts, fName]);

  // Available categories in unlinked products
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [allProducts]);

  // Link single product to this factory
  const handleLinkProduct = async (product: Product) => {
    setIsProcessingId(product.id);
    try {
      // 1. Update on backend Express API
      try {
        await fetch(`/api/v1/factories/${factory.id}/link-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "link",
            productIds: [product.id],
            factoryName: factory.name
          })
        });
      } catch (err) {
        console.warn("Backend link-products API call failed:", err);
      }

      // 2. Update via client callback
      if (onUpdateProduct) {
        await onUpdateProduct(product.id, {
          sellerId: factory.id,
          factoryId: factory.id,
          factoryName: factory.name,
          brand: product.brand || factory.name
        });
      }

      if (onRefreshProducts) {
        await onRefreshProducts();
      }

      setNotice({
        type: "success",
        text: `کالای «${product.name}» با موفقیت به کارخانه «${factory.name}» متصل گردید.`
      });
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice({
        type: "error",
        text: "خطا در اتصال محصول: " + (err.message || "لطفاً مجدداً تلاش کنید.")
      });
    } finally {
      setIsProcessingId(null);
    }
  };

  // Unlink single product from factory
  const handleUnlinkProduct = async (product: Product) => {
    if (!window.confirm(`آیا از قطع اتصال کالای «${product.name}» از کارخانه «${factory.name}» اطمینان دارید؟`)) {
      return;
    }

    setIsProcessingId(product.id);
    try {
      // 1. Call Express API
      try {
        await fetch(`/api/v1/factories/${factory.id}/link-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "unlink",
            productIds: [product.id]
          })
        });
      } catch (err) {
        console.warn("Backend unlink call failed:", err);
      }

      // 2. Update via callback
      if (onUpdateProduct) {
        await onUpdateProduct(product.id, {
          sellerId: "",
          factoryId: "",
          factoryName: ""
        });
      }

      if (onRefreshProducts) {
        await onRefreshProducts();
      }

      setNotice({
        type: "success",
        text: `اتصال کالای «${product.name}» از کارخانه قطع شد.`
      });
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      setNotice({
        type: "error",
        text: "خطا در قطع اتصال: " + (err.message || "خطایی رخ داد.")
      });
    } finally {
      setIsProcessingId(null);
    }
  };

  // Smart auto link all matching products
  const handleSmartAutoLink = async () => {
    if (smartMatchingProducts.length === 0) return;
    setIsAutoLinking(true);
    try {
      const productIds = smartMatchingProducts.map(p => p.id);

      try {
        await fetch(`/api/v1/factories/${factory.id}/link-products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "link",
            productIds,
            factoryName: factory.name
          })
        });
      } catch (err) {
        console.warn("Auto link API error:", err);
      }

      // Update locally
      if (onUpdateProduct) {
        for (const p of smartMatchingProducts) {
          await onUpdateProduct(p.id, {
            sellerId: factory.id,
            factoryId: factory.id,
            factoryName: factory.name,
            brand: p.brand || factory.name
          });
        }
      }

      if (onRefreshProducts) {
        await onRefreshProducts();
      }

      setNotice({
        type: "success",
        text: `تعداد ${toPersianDigits(productIds.length)} محصول هم‌نام با موفقیت به کارخانه متصل شد.`
      });
      setTimeout(() => setNotice(null), 4000);
      setActiveTab("linked");
    } catch (err: any) {
      setNotice({
        type: "error",
        text: "خطا در اتصال خودکار: " + err.message
      });
    } finally {
      setIsAutoLinking(false);
    }
  };

  // Quick price save for a single product
  const handleSavePrice = async (productId: string) => {
    if (newPriceVal === "" || Number(newPriceVal) <= 0) {
      alert("لطفاً قیمت معتبر وارد کنید.");
      return;
    }

    setIsUpdatingPrice(true);
    try {
      const priceNum = Number(newPriceVal);
      if (onUpdateProduct) {
        await onUpdateProduct(productId, {
          bulk_price: priceNum,
          price: priceNum
        });
      }

      if (onRefreshProducts) {
        await onRefreshProducts();
      }

      setEditingPriceId(null);
      setNewPriceVal("");
      setNotice({
        type: "success",
        text: "قیمت جدید کالا با موفقیت ذخیره گردید."
      });
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert("خطا در ذخیره قیمت: " + err.message);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Batch price change across all linked products
  const handleApplyBatchPrice = async () => {
    if (linkedProducts.length === 0) return;
    const factor = batchMode === "increase" ? 1 + (batchPercent / 100) : 1 - (batchPercent / 100);
    const modeText = batchMode === "increase" ? "افزایش" : "کاهش";
    
    if (!window.confirm(`آیا از ${modeText} ${toPersianDigits(batchPercent)} درصدی قیمت تمام ${toPersianDigits(linkedProducts.length)} محصول متصل به «${factory.name}» اطمینان دارید؟`)) {
      return;
    }

    setIsApplyingBatch(true);
    try {
      if (onUpdateProduct) {
        for (const p of linkedProducts) {
          const currentPrice = p.bulk_price || p.price || 0;
          if (currentPrice > 0) {
            const updatedPrice = Math.round(currentPrice * factor);
            await onUpdateProduct(p.id, {
              bulk_price: updatedPrice,
              price: updatedPrice
            });
          }
        }
      }

      if (onRefreshProducts) {
        await onRefreshProducts();
      }

      setNotice({
        type: "success",
        text: `قیمت تمام محصولات متصل به کارخانه با موفقیت به میزان ${toPersianDigits(batchPercent)}٪ ${modeText} یافت.`
      });
      setTimeout(() => setNotice(null), 4000);
      setActiveTab("linked");
    } catch (err: any) {
      setNotice({
        type: "error",
        text: "خطا در اعمال تغییرات دسته‌جمعی قیمت: " + err.message
      });
    } finally {
      setIsApplyingBatch(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
              {factory.logoUrl ? (
                <img src={factory.logoUrl} alt={factory.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <Building2 size={24} className="text-slate-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-900 leading-tight">
                  مدیریت و اتصال محصولات: {factory.name}
                </h3>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                  {factory.factoryCode || "FAC"}
                </span>
                {factory.province && (
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                    استان {factory.province}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                تعداد {toPersianDigits(linkedProducts.length)} محصول فعال متصل به این واحد تولیدی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all self-end sm:self-center cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* NOTICE BANNER */}
        {notice && (
          <div className={`px-5 py-2.5 text-xs font-black flex items-center gap-2 border-b ${
            notice.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}>
            {notice.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notice.text}</span>
          </div>
        )}

        {/* TABS SWITCHER */}
        <div className="px-5 pt-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto bg-slate-50/50">
          <button
            onClick={() => setActiveTab("linked")}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "linked"
                ? "border-emerald-600 text-emerald-700 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Package size={15} />
            <span>محصولات متصل به کارخانه ({toPersianDigits(linkedProducts.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "catalog"
                ? "border-emerald-600 text-emerald-700 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Link2 size={15} />
            <span>+ اتصال محصول جدید از کاتالوگ ({toPersianDigits(unlinkedProducts.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab("batch_price")}
            className={`px-4 py-2.5 rounded-t-2xl text-xs font-black transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "batch_price"
                ? "border-amber-600 text-amber-700 bg-white shadow-2xs"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Percent size={15} />
            <span>تغییر دسته‌جمعی قیمت‌ها</span>
          </button>
        </div>

        {/* TAB CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* TAB 1: CURRENTLY LINKED PRODUCTS */}
          {activeTab === "linked" && (
            <div className="space-y-4">
              {/* Linked search & summary */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={14} className="absolute right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="جستجو در محصولات متصل..."
                    value={linkedSearch}
                    onChange={(e) => setLinkedSearch(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <span>نمایش {toPersianDigits(filteredLinkedProducts.length)} از {toPersianDigits(linkedProducts.length)} کالا</span>
                  {linkedProducts.length > 0 && (
                    <button
                      onClick={() => setActiveTab("batch_price")}
                      className="text-amber-700 hover:text-amber-800 font-black text-xs underline cursor-pointer"
                    >
                      تغییر درصدی قیمت‌ها
                    </button>
                  )}
                </div>
              </div>

              {/* Linked products list */}
              {filteredLinkedProducts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                  <Package size={40} className="mx-auto text-slate-300" />
                  <p className="text-xs font-black text-slate-600">
                    {linkedSearch ? "هیچ محصولی با این عبارت یافت نشد." : "هنوز هیچ کالایی به این کارخانه متصل نشده است."}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    از تب «+ اتصال محصول جدید از کاتالوگ» می‌توانید محصولات پلتفرم یا برند کارخانه را به این واحد متصل نمایید.
                  </p>
                  <button
                    onClick={() => setActiveTab("catalog")}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Link2 size={14} />
                    <span>اتصال محصولات از کاتالوگ</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredLinkedProducts.map(p => {
                    const currentPrice = p.bulk_price || p.price || 0;
                    const isEditing = editingPriceId === p.id;
                    const isProcessing = isProcessingId === p.id;

                    return (
                      <div
                        key={`linked-prod-${p.id}`}
                        className="bg-white rounded-2xl border border-slate-200/90 p-3.5 hover:border-slate-300 transition-all flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-150 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Package size={24} className="text-slate-300" />
                            )}
                          </div>

                          <div className="space-y-1 flex-1 min-w-0">
                            <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                              {p.name}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 font-bold">
                              {p.brand && (
                                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                  برند: {p.brand}
                                </span>
                              )}
                              <span>•</span>
                              <span>{p.category || "تنقلات"}</span>
                              {p.carton_pack_count && (
                                <>
                                  <span>•</span>
                                  <span>{toPersianDigits(p.carton_pack_count)} عددی</span>
                                </>
                              )}
                            </div>

                            {/* Price display & inline edit */}
                            <div className="pt-1">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    value={newPriceVal}
                                    onChange={(e) => setNewPriceVal(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="قیمت جدید (تومان)"
                                    className="w-32 px-2 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black text-slate-900 focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleSavePrice(p.id)}
                                    disabled={isUpdatingPrice}
                                    className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all cursor-pointer"
                                    title="ذخیره قیمت"
                                  >
                                    <Save size={13} />
                                  </button>
                                  <button
                                    onClick={() => setEditingPriceId(null)}
                                    className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                                    title="انصراف"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-black text-emerald-700">
                                    {toPersianDigits(currentPrice.toLocaleString("fa-IR"))} تومان
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingPriceId(p.id);
                                      setNewPriceVal(currentPrice);
                                    }}
                                    className="text-[10px] text-slate-500 hover:text-emerald-700 font-bold underline cursor-pointer"
                                  >
                                    ویرایش قیمت
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Unlink Action Button */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[9.5px] text-slate-400 font-bold">
                            کد کالا: {p.id.slice(0, 10)}
                          </span>
                          <button
                            onClick={() => handleUnlinkProduct(p)}
                            disabled={isProcessing}
                            className="text-[11px] font-black text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <Unlink size={12} />
                            <span>{isProcessing ? "در حال قطع..." : "قطع اتصال از کارخانه"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONNECT PRODUCTS FROM PLATFORM CATALOG */}
          {activeTab === "catalog" && (
            <div className="space-y-4">
              {/* SMART AUTO-LINK BANNER */}
              {smartMatchingProducts.length > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <Sparkles size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">
                        پیشنهاد هوشمند اتصال خودکار ({toPersianDigits(smartMatchingProducts.length)} محصول هم‌نام)
                      </h4>
                      <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                        کالاهایی با برند یا نام «{factory.name}» در سامانه یافت شدند. با یک کلیک می‌توانید تمام آن‌ها را به این کارخانه متصل کنید.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleSmartAutoLink}
                    disabled={isAutoLinking}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Check size={14} />
                    <span>{isAutoLinking ? "در حال اتصال..." : `اتصال همه (${toPersianDigits(smartMatchingProducts.length)})`}</span>
                  </button>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search size={14} className="absolute right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="جستجو در کل کاتالوگ پلتفرم (نام محصول، برند یا دسته‌بندی)..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <select
                  value={catalogCategory}
                  onChange={(e) => setCatalogCategory(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="all">همه دسته‌بندی‌ها</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Catalog list */}
              {filteredCatalogProducts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-3xl space-y-2 text-slate-400">
                  <Package size={36} className="mx-auto text-slate-300" />
                  <p className="text-xs font-bold">محصولی در کاتالوگ با این شرایط یافت نشد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCatalogProducts.slice(0, 30).map(p => {
                    const price = p.bulk_price || p.price || 0;
                    const isProcessing = isProcessingId === p.id;

                    return (
                      <div
                        key={`cat-prod-${p.id}`}
                        className="bg-white rounded-2xl border border-slate-200/90 p-3.5 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-150 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <Package size={20} className="text-slate-300" />
                            )}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-xs font-black text-slate-900 truncate">
                              {p.name}
                            </h4>
                            <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 flex-wrap">
                              {p.brand && <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-700">{p.brand}</span>}
                              <span>•</span>
                              <span className="text-emerald-700 font-black">{toPersianDigits(price.toLocaleString("fa-IR"))} تومان</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLinkProduct(p)}
                          disabled={isProcessing}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          <Link2 size={13} />
                          <span>{isProcessing ? "در حال اتصال..." : "+ اتصال"}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BATCH PRICE ADJUSTMENT */}
          {activeTab === "batch_price" && (
            <div className="max-w-xl mx-auto py-6 space-y-6">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto text-xl shadow-2xs">
                  <Percent size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  تغییر درصدی دسته‌جمعی قیمت‌های کارخانه
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  با این ابزار می‌توانید در زمان نوسان مواد اولیه یا تخفیف‌های فصلی، قیمت تمام {toPersianDigits(linkedProducts.length)} محصول این کارخانه را به صورت یکجا تغییر دهید.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBatchMode("increase")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      batchMode === "increase"
                        ? "bg-rose-50 text-rose-800 border-rose-300 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <TrendingUp size={15} />
                    <span>افزایش قیمت (تورم / مواد اولیه)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBatchMode("decrease")}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      batchMode === "decrease"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <TrendingDown size={15} />
                    <span>کاهش قیمت (تخفیف فصلی / جشنواره)</span>
                  </button>
                </div>

                {/* Percentage Presets */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block">درصد تغییر قیمت:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 10, 15].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setBatchPercent(pct)}
                        className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          batchPercent === pct
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {toPersianDigits(pct)}٪
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Percentage */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black text-slate-700 shrink-0">درصد دلخواه:</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={batchPercent}
                    onChange={(e) => setBatchPercent(Math.max(1, Number(e.target.value) || 1))}
                    className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-center text-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-500">درصد</span>
                </div>

                {/* Summary preview */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>تعداد کل کالاهای تحت تاثیر:</span>
                    <span className="font-black text-slate-900">{toPersianDigits(linkedProducts.length)} محصول</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>نوع عملیات:</span>
                    <span className={`font-black ${batchMode === "increase" ? "text-rose-600" : "text-emerald-700"}`}>
                      {batchMode === "increase" ? "افزایش" : "کاهش"} به میزان {toPersianDigits(batchPercent)} درصد
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyBatchPrice}
                  disabled={isApplyingBatch || linkedProducts.length === 0}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{isApplyingBatch ? "در حال اعمال تغییرات بر روی محصولات..." : "اعمال تغییرات قیمت بر روی تمام کالاها"}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 text-xs font-bold text-slate-500">
          <div className="flex items-center gap-1.5">
            <Package size={14} className="text-slate-400" />
            <span>محصولات متصل به این کارخانه در پنل اختصاصی کارخانه قابل مشاهده و مدیریت هستند.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
}
