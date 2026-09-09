import React, { useState, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Award, 
  Tag, 
  Save, 
  Check, 
  X, 
  Sparkles, 
  Search, 
  Building2, 
  Package, 
  Globe, 
  ExternalLink,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";
import { B2BConfig, BrandItem, Product } from "../types";
import { toPersianDigits } from "../lib/pricing";
import ParsPackImageUploader from "./ParsPackImageUploader";
import { GalleryPickerModal } from "./GalleryPickerModal";

interface AdminBrandsManagementProps {
  b2bConfig: B2BConfig;
  products?: Product[];
  onUpdateB2bConfig: (updated: Partial<B2BConfig>) => Promise<void>;
  onBulkUpdateProducts?: (ids: string[], updates: Partial<Product>) => Promise<any> | void;
  onRefreshProducts?: () => Promise<void> | void;
}

export const DEFAULT_BRANDS: BrandItem[] = [
  { id: "brand-1", name: "مانا", type: "کنسرو و مواد غذایی", icon: "🥫", bg: "bg-red-50", text: "text-red-700", logoUrl: "" },
  { id: "brand-2", name: "شیرین عسل", type: "تنقلات و شکلات", icon: "🍫", bg: "bg-amber-50", text: "text-amber-700", logoUrl: "" },
  { id: "brand-3", name: "پگاه", type: "نوشیدنی و لبنیات", icon: "🥛", bg: "bg-blue-50", text: "text-blue-700", logoUrl: "" },
  { id: "brand-4", name: "اکتیو", type: "شوینده و بهداشتی", icon: "🧼", bg: "bg-emerald-50", text: "text-emerald-700", logoUrl: "" },
  { id: "brand-5", name: "طبیعت", type: "روغن و برنج", icon: "🌾", bg: "bg-green-50", text: "text-green-700", logoUrl: "" },
  { id: "brand-6", name: "زر ماکارون", type: "غلات و ماکارونی", icon: "🍝", bg: "bg-yellow-50", text: "text-yellow-700", logoUrl: "" },
  { id: "brand-7", name: "فرمند", type: "شکلات و پودر ژله", icon: "🍮", bg: "bg-purple-50", text: "text-purple-700", logoUrl: "" },
  { id: "brand-8", name: "دست اول", type: "انبار مرکزی و تامین مستقیم", icon: "👑", bg: "bg-emerald-50", text: "text-emerald-800", logoUrl: "" }
];

const PRESET_ICONS = ["👑", "🥫", "🍫", "🥛", "🧼", "🌾", "🍝", "🍮", "🍬", "☕", "🧃", "🍪", "🧂", "📦", "🏭", "🌟", "🔥", "💎"];

export default function AdminBrandsManagement({
  b2bConfig,
  products = [],
  onUpdateB2bConfig,
  onBulkUpdateProducts,
  onRefreshProducts
}: AdminBrandsManagementProps) {
  // Load brands list from b2bConfig, local storage or default
  const [brands, setBrands] = useState<BrandItem[]>(() => {
    if (b2bConfig?.brands && Array.isArray(b2bConfig.brands) && b2bConfig.brands.length > 0) {
      return b2bConfig.brands;
    }
    try {
      const saved = localStorage.getItem("dastavval_custom_brands_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_BRANDS;
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState("کنسرو و مواد غذایی");
  const [icon, setIcon] = useState("🥫");
  const [logoUrl, setLogoUrl] = useState("");
  const [province, setProvince] = useState("تهران");
  const [badge, setBadge] = useState("تولیدکننده رسمی");
  const [description, setDescription] = useState("");
  const [factoryId, setFactoryId] = useState<string>("");
  const [factoryName, setFactoryName] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [oldNameForEdit, setOldNameForEdit] = useState<string>("");
  const [syncProductsOnRename, setSyncProductsOnRename] = useState(true);

  // Status messages
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const storagePublicUrl = localStorage.getItem("dastavval_storage_public_url") || "https://c102393.parspack.net/c102393";

  // Calculate product counts per brand
  const brandProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.brand) {
        const bKey = p.brand.trim();
        counts[bKey] = (counts[bKey] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Unique types from current brands
  const brandTypes = useMemo(() => {
    const set = new Set<string>();
    brands.forEach(b => {
      if (b.type) set.add(b.type);
    });
    return Array.from(set);
  }, [brands]);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter(b => {
      const matchSearch = !searchQuery.trim() || 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.type && b.type.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = selectedTypeFilter === "all" || b.type === selectedTypeFilter;
      return matchSearch && matchType;
    });
  }, [brands, searchQuery, selectedTypeFilter]);

  const handleSaveBrands = async (updatedList: BrandItem[]) => {
    setSaving(true);
    try {
      setBrands(updatedList);
      await onUpdateB2bConfig({
        ...b2bConfig,
        brands: updatedList
      });
      localStorage.setItem("dastavval_custom_brands_v2", JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent("dastavval_brands_updated", { detail: updatedList }));
      setSuccessMsg("تغییرات برندها با موفقیت ذخیره و در سامانه اعمال گردید.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره‌سازی برندها: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetForm = () => {
    setName("");
    setType("کنسرو و مواد غذایی");
    setIcon("🥫");
    setLogoUrl("");
    setProvince("تهران");
    setBadge("تولیدکننده رسمی");
    setDescription("");
    setFactoryId("");
    setFactoryName("");
    setEditingId(null);
    setOldNameForEdit("");
    setErrorMsg(null);
  };

  const handleEdit = (b: BrandItem) => {
    setEditingId(b.id);
    setName(b.name);
    setOldNameForEdit(b.name);
    setType(b.type || "کنسرو و مواد غذایی");
    setIcon(b.icon || "🥫");
    setLogoUrl(b.logoUrl || "");
    setDescription((b as any).description || "");
    setProvince((b as any).province || "تهران");
    setBadge((b as any).badge || "تولیدکننده رسمی");
    setFactoryId(b.factoryId || "");
    setFactoryName(b.factoryName || "");
    window.scrollTo({ top: 200, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    const target = brands.find(b => b.id === id);
    if (!target) return;

    const count = brandProductCounts[target.name] || 0;
    const confirmMsg = count > 0 
      ? `برند «${target.name}» دارای ${toPersianDigits(count)} محصول در انبار است. آیا از حذف آن مطمئن هستید؟`
      : `آیا از حذف برند «${target.name}» اطمینان دارید؟`;

    if (window.confirm(confirmMsg)) {
      const updated = brands.filter(b => b.id !== id);
      await handleSaveBrands(updated);
      if (editingId === id) handleResetForm();
    }
  };

  const handleApproveBrand = async (brandId: string) => {
    const updated = brands.map((b) => {
      if (b.id === brandId) {
        return {
          ...b,
          badge: "تولیدکننده رسمی",
          status: "approved"
        };
      }
      return b;
    });
    await handleSaveBrands(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("لطفاً نام برند را وارد نمایید.");
      return;
    }

    setSaving(true);
    try {
      const cleanName = name.trim();
      let updatedBrands: BrandItem[];

      if (editingId) {
        // Edit existing
        updatedBrands = brands.map(b => {
          if (b.id === editingId) {
            return {
              ...b,
              name: cleanName,
              type: type.trim(),
              icon,
              logoUrl: logoUrl.trim(),
              description: description.trim(),
              province: province.trim(),
              badge: badge.trim(),
              factoryId: factoryId || undefined,
              factoryName: factoryName || undefined
            };
          }
          return b;
        });

        // If name changed and user wants to sync products
        if (syncProductsOnRename && oldNameForEdit && oldNameForEdit !== cleanName && onBulkUpdateProducts) {
          const matchingProductIds = products
            .filter(p => p.brand === oldNameForEdit)
            .map(p => p.id);
          
          if (matchingProductIds.length > 0) {
            await onBulkUpdateProducts(matchingProductIds, {
              brand: cleanName,
              brandLogoUrl: logoUrl.trim() || undefined
            });
            if (onRefreshProducts) await onRefreshProducts();
          }
        }
      } else {
        // Create new
        const newBrand: BrandItem = {
          id: `brand-${Date.now()}`,
          name: cleanName,
          type: type.trim(),
          icon,
          logoUrl: logoUrl.trim(),
          bg: "bg-slate-50",
          text: "text-slate-800",
          factoryId: factoryId || undefined,
          factoryName: factoryName || undefined,
          ...({ description: description.trim(), province: province.trim(), badge: badge.trim() } as any)
        };
        updatedBrands = [newBrand, ...brands];
      }

      // Sync brand with the selected factory's ownedBrands list
      let updatedFactories = b2bConfig?.factories;
      if (factoryId && updatedFactories && Array.isArray(updatedFactories)) {
        updatedFactories = updatedFactories.map(fac => {
          if (fac.id === factoryId) {
            const currentOwned = fac.ownedBrands || [];
            if (!currentOwned.includes(cleanName)) {
              return { ...fac, ownedBrands: [...currentOwned, cleanName] };
            }
          }
          return fac;
        });
      }

      setBrands(updatedBrands);
      try {
        localStorage.setItem("dastavval_custom_brands_v2", JSON.stringify(updatedBrands));
      } catch (e) {}

      await onUpdateB2bConfig({
        ...b2bConfig,
        brands: updatedBrands,
        ...(updatedFactories ? { factories: updatedFactories } : {})
      });

      // Dispatch global event so other components refresh brands
      window.dispatchEvent(new CustomEvent("dastavval_brands_updated", { detail: { brands: updatedBrands } }));

      setSuccessMsg("برند با موفقیت و اتصال به کارخانه ثبت و بروزرسانی شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
      handleResetForm();
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره برند: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black">
            <Award size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">مدیریت، ویرایش و ثبت برندهای کارخانه‌ای</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                {toPersianDigits(brands.length)} برند فعال
              </span>
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              مدیریت اسامی تجاری، لوگو، دسته‌بندی و همگام‌سازی خودکار با کاتالوگ کالاها
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی سریع برند یا گروه..."
            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Main Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Add/Edit Brand Form */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              {editingId ? <Edit2 size={16} className="text-emerald-600" /> : <Plus size={16} className="text-emerald-600" />}
              <span>{editingId ? "ویرایش مشخصات برند" : "افزودن برند تجاری جدید"}</span>
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                لغو ویرایش
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">نام رسمی برند *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: صنایع غذایی مانا، زر ماکارون..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">گروه تخصصی کالا</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="مثال: تنقلات و شکلات"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">استان / قطب تولید</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="مثال: تبریز، تهران، مشهد..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Factory Connection */}
            <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/80 space-y-1.5">
              <label className="block text-[11px] font-black text-blue-950 flex items-center gap-1.5">
                <Building2 size={13} className="text-blue-600" />
                <span>اتصال برند به کارخانه تولیدکننده / واحد مادر</span>
              </label>
              <select
                value={factoryId}
                onChange={(e) => {
                  const selId = e.target.value;
                  setFactoryId(selId);
                  const found = (b2bConfig?.factories || []).find(f => f.id === selId);
                  setFactoryName(found ? found.name : "");
                }}
                className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-black text-slate-800 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">-- بدون اتصال به کارخانه خاص (برند مستقل یا چندکارخانه‌ای) --</option>
                {(b2bConfig?.factories || []).map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} {fac.industrialPark ? `(${fac.industrialPark})` : (fac.province ? `(${fac.province})` : '')}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-blue-800 font-bold">
                {factoryId 
                  ? `این برند به عنوان برند رسمی «${factoryName}» ثبت می‌شود و در شناسنامه کارخانه قرار می‌گیرد.` 
                  : "می‌توانید برند را به یکی از کارخانجات ثبت‌شده در سامانه متصل فرمایید."}
              </p>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">آیکون / نماد تصویری</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-12 h-10 text-center bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold"
                />
                <span className="text-[11px] text-slate-500 font-bold">انتخاب نماد سریع:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200/80 max-h-24 overflow-y-auto">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                      icon === emoji ? "bg-emerald-600 text-white shadow-xs" : "hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Logo Uploader & Gallery */}
            <div className="space-y-2">
              <ParsPackImageUploader
                label="لوگو یا نشان رسمی برند"
                subLabel="تصویر PNG شفاف پیشنهاد می‌شود"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                folder="brands"
                aspectRatio="logo"
              />

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">آدرس مستقیم لوگو (URL اینترنتی)</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">نشان یا برچسب کیفیت</label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="مثال: صادرکننده نمونه، ۱۰۰٪ استاندارد..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-700 mb-1">توضیحات و معرفی برند</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="خلاصه‌ای از خطوط تولید، پیشینه یا ظرفیت تولید..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            {editingId && (
              <label className="flex items-center gap-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] font-black text-emerald-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncProductsOnRename}
                  onChange={(e) => setSyncProductsOnRename(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>بروزرسانی خودکار نام برند در تمام کالاهای این برند در انبار</span>
              </label>
            )}

            {errorMsg && (
              <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-700 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                {successMsg}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save size={15} />
                <span>{saving ? "در حال ثبت..." : editingId ? "ذخیره تغییرات برند" : "ثبت برند در سامانه"}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  انصراف
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Brands Catalog List */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedTypeFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                selectedTypeFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              همه گروه‌ها ({toPersianDigits(brands.length)})
            </button>
            {brandTypes.map((tName) => (
              <button
                key={tName}
                onClick={() => setSelectedTypeFilter(tName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  selectedTypeFilter === tName
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tName}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredBrands.length === 0 ? (
              <div className="col-span-2 py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
                <Award size={32} className="mx-auto text-slate-300" />
                <h4 className="text-xs font-black text-slate-700">برندی با این مشخصات یافت نشد</h4>
                <p className="text-[11px] text-slate-400 font-bold">می‌توانید از ستون کناری برند جدیدی را ثبت فرمایید.</p>
              </div>
            ) : (
              filteredBrands.map((b) => {
                const prodCount = brandProductCounts[b.name] || 0;
                return (
                  <div
                    key={b.id}
                    className="bg-white hover:bg-emerald-50/30 p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                          {b.logoUrl ? (
                            <img src={b.logoUrl} alt={b.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <span>{b.icon || "🏭"}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                              {b.name}
                            </h4>
                            {(b as any).badge && (
                              <span className="text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded-md">
                                {(b as any).badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-1">
                            <span>{b.type}</span>
                            {(b as any).province && (
                              <span className="flex items-center gap-0.5 text-slate-400 font-normal">
                                <MapPin size={10} />
                                <span>{(b as any).province}</span>
                              </span>
                            )}
                          </div>
                          {b.factoryName && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-black text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-lg w-fit">
                              <Building2 size={11} className="text-blue-600" />
                              <span>کارخانه: {b.factoryName}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {((b as any).status === "pending" || (b as any).badge?.includes("انتظار")) && (
                          <button
                            type="button"
                            onClick={() => handleApproveBrand(b.id)}
                            className="px-2.5 py-1 text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all cursor-pointer shadow-xs whitespace-nowrap ml-1 shrink-0 animate-pulse"
                            title="تایید و فعال‌سازی فوری برند"
                          >
                            ✓ تایید فوری
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEdit(b)}
                          className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                          title="ویرایش برند"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="حذف برند"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Status bar */}
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 font-bold">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Package size={12} className="text-slate-400" />
                        <span>کالاهای موجود در انبار:</span>
                        <span className={`px-1.5 py-0.2 rounded-full font-black text-[10px] ${
                          prodCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                        }`}>
                          {toPersianDigits(prodCount)} کالا
                        </span>
                      </div>

                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle2 size={12} />
                        <span>تاییدشده دست اول</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
      <GalleryPickerModal
        isOpen={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onSelect={(url) => {
          setLogoUrl(url);
          setShowGalleryPicker(false);
        }}
        initialPublicUrl={storagePublicUrl}
      />
    </div>
  );
}
