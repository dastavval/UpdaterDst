import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  Tag,
  Save,
  Check,
  X,
  Sparkles,
  FolderPlus,
  Search,
  Filter,
  CheckCircle2,
  Boxes,
  HelpCircle,
  TrendingUp,
  RefreshCw,
  Hash
} from "lucide-react";
import { B2BConfig, Product } from "../types";

interface AdminCategoriesManagementProps {
  b2bConfig: B2BConfig;
  onUpdateB2bConfig: (updated: Partial<B2BConfig>) => Promise<void>;
  products?: Product[];
}

export interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  type: 'product' | 'raw_material' | 'equipment' | 'service' | 'barter' | 'general';
  description?: string;
  subcategories?: string[];
  isCustom?: boolean;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'cat-1', name: 'تنقلات و شکلات', emoji: '🍫', type: 'product', description: 'انواع شکلات، بیسکویت، ویفر، چیپس و تنقلات کارخانه‌ای', subcategories: ['بیسکویت', 'ویفر', 'چیپس', 'شکلات'] },
  { id: 'cat-2', name: 'شوینده و بهداشتی', emoji: '🧼', type: 'product', description: 'مواد شوینده، مایع دستشویی، پودر لباسشویی و بهداشتی', subcategories: ['مایع ظرفشویی', 'دستمال کاغذی', 'شامپو'] },
  { id: 'cat-3', name: 'کنسرو و مواد غذایی', emoji: '🥫', type: 'product', description: 'رب گوجه، کنسروجات، تن ماهی، خیارشور و ترشیجات', subcategories: ['رب گوجه', 'کنسرو ماهی', 'خیارشور'] },
  { id: 'cat-4', name: 'نوشیدنی و لبنیات', emoji: '🥛', type: 'product', description: 'آبمیوه، نوشابه، شیر، پنیر پیتزا و فرآورده‌های لبنی', subcategories: ['آبمیوه', 'شیر', 'پنیر پیتزا'] },
  { id: 'cat-5', name: 'مواد اولیه و شیمیایی', emoji: '🧪', type: 'raw_material', description: 'اسانس‌ها، رنگ خوراکی، افزودنی‌های غذایی، پلیمر و گلوکز', subcategories: ['شکر صنعتی', 'گلوکز', 'اسانس خوراکی'] },
  { id: 'cat-6', name: 'ماشین‌آلات و تجهیزات', emoji: '⚙️', type: 'equipment', description: 'دستگاه‌های بسته‌بندی، میکسر، سیل‌کن و خطوط تولید صنعتی', subcategories: ['دستگاه بسته‌بندی', 'سیل‌کن', 'میکسر'] },
  { id: 'cat-7', name: 'خدمات صنعتی و بسته بندی', emoji: '📦', type: 'service', description: 'خدمات چاپ، کارتن‌سازی، تزریق پلاستیک و آزمایشگاهی', subcategories: ['کارتن‌سازی', 'چاپ سلفون', 'نایلون'] },
  { id: 'cat-8', name: 'تهاتر کارخانه‌ای', emoji: '🔄', type: 'barter', description: 'معاوضه مازاد تولید کارخانجات با مواد اولیه، تجهیزات و خودرو', subcategories: ['تهاتر کالا', 'تهاتر مواد اولیه'] },
];

const POPULAR_CATEGORY_TEMPLATES = [
  { name: 'لبنیات و فرآورده‌های شیری', emoji: '🥛', type: 'product' as const, description: 'شیر، پنیر پیتزا، کره صنعتی، خامه و دوغ کارخانه‌ای', subcategories: ['پنیر پیتزا', 'شیر تتراپک', 'کره حیوانی'] },
  { name: 'روغن‌های خوراکی و سرخ‌کردنی', emoji: '🛢️', type: 'product' as const, description: 'روغن مایع آفتابگردان، سرخ‌کردنی و روغن فله حلب صنعتی', subcategories: ['روغن مایع', 'روغن حلب ۱۶ لیتری', 'روغن سرخ‌کردنی'] },
  { name: 'خشکبار، پسته و زعفران', emoji: '🥜', type: 'product' as const, description: 'پسته صادراتی، مغز گردو، کشمش و زعفران کارخانه‌ای', subcategories: ['پسته فندقی', 'زعفران نگین', 'مغز گردو'] },
  { name: 'کارتن‌سازی و لفاف بسته‌بندی', emoji: '📦', type: 'service' as const, description: 'تولید کارتن ۳ لایه، ۵ لایه، سلفون opp و جعبه لمینتی', subcategories: ['کارتن ۵ لایه', 'سلفون متالایز', 'فیلم استرچ'] },
  { name: 'شیرین‌کننده‌ها و نشاسته صنعتی', emoji: '🌾', type: 'raw_material' as const, description: 'گلوکز مایع، نشاسته ذرت، شکر صنعتی و سوربیتول', subcategories: ['گلوکز مایع', 'نشاسته ذرت', 'دکستروز'] },
  { name: 'چاشنی، سس و ادویه‌جات', emoji: '🧂', type: 'product' as const, description: 'انواع سس کچاپ، مایونز گالنی، فلفل و ادویه‌جات فله رستورانی', subcategories: ['سس تک‌نفره', 'سس گالنی مایونز', 'ادویه فله'] },
  { name: 'پلاستیک، پریفرم و بطری پت', emoji: '🍾', type: 'raw_material' as const, description: 'پریفرم دهانه ۲۸ و ۳۸، بطری پت و ظروف یکبارمصرف pp', subcategories: ['بطری پت', 'درب بطری', 'پریفرم'] },
  { name: 'شوینده‌های صنعتی و بیمارستانی', emoji: '🧴', type: 'product' as const, description: 'مایع ظرفشویی ۲۰ لیتری، مایع دستشویی گالنی و جرم‌گیر صنعتی', subcategories: ['شوینده گالنی', 'ضدعفونی‌کننده', 'مایع دست ۲۰ لیتری'] },
];

const EMOJI_OPTIONS = [
  '🍫', '🧼', '🥫', '🥛', '🧪', '⚙️', '📦', '🔄', '🛢️', '🥜', '🌾', '🧂',
  '🍾', '🧴', '☕', '🍬', '🧃', '🥖', '🧻', '💊', '🎨', '⚡', '🚚', '🛠️',
  '🏭', '🏷️', '✨', '🔥', '🥩', '🧊', '🍯', '🍞', '🥤', '🍇', '☕', '🌟'
];

export default function AdminCategoriesManagement({
  b2bConfig,
  onUpdateB2bConfig,
  products = []
}: AdminCategoriesManagementProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    if (b2bConfig?.categories && Array.isArray(b2bConfig.categories) && b2bConfig.categories.length > 0) {
      return b2bConfig.categories.map((c: any, index: number) => {
        if (typeof c === 'string') {
          return {
            id: `cat-${index + 1}`,
            name: c,
            emoji: '🏷️',
            type: 'product',
            description: '',
            subcategories: []
          };
        }
        return {
          id: c.id || `cat-${index + 1}`,
          name: c.name || '',
          emoji: c.emoji || '🏷️',
          type: c.type || 'product',
          description: c.description || '',
          subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
          isCustom: !!c.isCustom
        };
      });
    }
    return DEFAULT_CATEGORIES;
  });

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🏷️");
  const [type, setType] = useState<CategoryItem['type']>("product");
  const [description, setDescription] = useState("");
  const [subcategoriesStr, setSubcategoriesStr] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Calculate Product count per category
  const categoryProductCounts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        map[p.category] = (map[p.category] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  const handleSaveCategories = async (updatedList: CategoryItem[]) => {
    setSaving(true);
    try {
      setCategories(updatedList);
      await onUpdateB2bConfig({
        ...b2bConfig,
        categories: updatedList as any
      });
      localStorage.setItem("dastavval_custom_categories", JSON.stringify(updatedList));
      setSuccessMsg("تغییرات دسته‌بندی‌ها با موفقیت در تنظیمات سیستم ذخیره و منتشر شد.");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره‌سازی دسته‌بندی‌ها: " + err.message);
      setTimeout(() => setErrorMsg(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("لطفاً عنوان دسته‌بندی را وارد کنید.");
      return;
    }

    const subcats = subcategoriesStr
      .split(/[،,]/)
      .map(s => s.trim())
      .filter(Boolean);

    let newList: CategoryItem[];
    if (editingId) {
      newList = categories.map(c => 
        c.id === editingId 
          ? { 
              ...c, 
              name: name.trim(), 
              emoji, 
              type, 
              description: description.trim(),
              subcategories: subcats,
              isCustom: true
            } 
          : c
      );
    } else {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}`,
        name: name.trim(),
        emoji,
        type,
        description: description.trim(),
        subcategories: subcats,
        isCustom: true
      };
      newList = [...categories, newCat];
    }

    await handleSaveCategories(newList);
    handleResetForm();
  };

  const handleAddTemplateCategory = async (tpl: typeof POPULAR_CATEGORY_TEMPLATES[0]) => {
    const exists = categories.some(c => c.name.toLowerCase() === tpl.name.toLowerCase());
    if (exists) {
      setErrorMsg(`دسته‌بندی «${tpl.name}» قبلاً در سیستم ثبت شده است.`);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      name: tpl.name,
      emoji: tpl.emoji,
      type: tpl.type,
      description: tpl.description,
      subcategories: tpl.subcategories,
      isCustom: true
    };

    const newList = [...categories, newCat];
    await handleSaveCategories(newList);
  };

  const handleEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setEmoji(cat.emoji || "🏷️");
    setType(cat.type || "product");
    setDescription(cat.description || "");
    setSubcategoriesStr(cat.subcategories ? cat.subcategories.join("، ") : "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, catName: string) => {
    const count = categoryProductCounts[catName] || 0;
    const warning = count > 0 
      ? `توجه: در حال حاضر ${count} کالا به این دسته‌بندی متصل هستند. آیا از حذف «${catName}» اطمینان دارید؟`
      : `آیا از حذف دسته‌بندی «${catName}» اطمینان دارید؟`;

    if (!window.confirm(warning)) return;
    const newList = categories.filter(c => c.id !== id);
    await handleSaveCategories(newList);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setName("");
    setEmoji("🏷️");
    setType("product");
    setDescription("");
    setSubcategoriesStr("");
  };

  const getTypeLabel = (t: CategoryItem['type']) => {
    switch(t) {
      case 'product': return 'کالاهای کارخانه‌ای';
      case 'raw_material': return 'مواد اولیه و شیمیایی';
      case 'equipment': return 'ماشین‌آلات و تجهیزات';
      case 'service': return 'خدمات و بسته‌بندی';
      case 'barter': return 'کالاهای تهاتری';
      default: return 'عمومی و متفرقه';
    }
  };

  const getTypeBadgeColor = (t: CategoryItem['type']) => {
    switch(t) {
      case 'product': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'raw_material': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'equipment': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'service': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'barter': return 'bg-rose-50 text-rose-800 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Filtered Categories List
  const filteredCategories = useMemo(() => {
    return categories.filter(c => {
      if (selectedTypeFilter !== "all" && c.type !== selectedTypeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name && c.name.toLowerCase().includes(q);
        const matchDesc = c.description && c.description.toLowerCase().includes(q);
        const matchSub = c.subcategories && c.subcategories.some(s => s.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchSub) return false;
      }
      return true;
    });
  }, [categories, selectedTypeFilter, searchQuery]);

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-emerald-600/20">
            <Layers size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>مدیریت پویا و سفارشی دسته‌بندی‌ها</span>
              <Sparkles size={16} className="text-amber-500" />
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              تعریف نامحدود دسته‌بندی‌های سفارشی، آیکون اختصاصی، زیردسته‌ها و اتصال خودکار به فرم محصولات و فیلترها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-black border border-emerald-200">
            {categories.length} دسته‌بندی فعال
          </span>
          <button
            type="button"
            onClick={() => handleSaveCategories(DEFAULT_CATEGORIES)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
            title="بازنشانی به ۸ دسته‌بندی استاندارد کارخانه‌ای"
          >
            <RefreshCw size={13} />
            <span>بازنشانی پیش‌فرض</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Templates Bar */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 rounded-3xl border border-emerald-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" />
            <span>پیشنهادهای آماده برای افزودن با یک کلیک:</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">کلیک کنید تا فوراً به سیستم اضافه شود</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_CATEGORY_TEMPLATES.map((tpl, tIdx) => {
            const alreadyAdded = categories.some(c => c.name.toLowerCase() === tpl.name.toLowerCase());
            return (
              <button
                key={`tpl-cat-${tIdx}`}
                type="button"
                onClick={() => handleAddTemplateCategory(tpl)}
                disabled={alreadyAdded}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  alreadyAdded
                    ? "bg-white/60 text-slate-400 border-slate-200 cursor-not-allowed"
                    : "bg-white hover:bg-emerald-600 hover:text-white text-emerald-900 border-emerald-300 hover:border-emerald-600"
                }`}
              >
                <span>{tpl.emoji}</span>
                <span>{tpl.name}</span>
                {alreadyAdded ? (
                  <Check size={12} className="text-emerald-600" />
                ) : (
                  <Plus size={12} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-5 h-fit">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FolderPlus size={18} className="text-emerald-600" />
            <span>{editingId ? "ویرایش دسته‌بندی سفارشی" : "ایجاد دسته‌بندی پویا / سفارشی جدید"}</span>
          </h3>

          <form onSubmit={handleAddOrUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">عنوان دسته‌بندی سفارشی *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: تنقلات و ویفر یا لبنیات صادراتی"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">انتخاب نماد / ایموجی دسته</label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-16 text-center px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-500 font-bold">پیش‌نمایش: <span className="text-2xl">{emoji}</span></span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60 max-h-32 overflow-y-auto custom-scrollbar">
                {EMOJI_OPTIONS.map((eStr, eIdx) => (
                  <button
                    key={`emoji-opt-${eStr}-${eIdx}`}
                    type="button"
                    onClick={() => setEmoji(eStr)}
                    className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                      emoji === eStr ? "bg-emerald-600 text-white shadow-xs" : "hover:bg-slate-200"
                    }`}
                  >
                    {eStr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">بخش و نوع صنعت</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="product">کالاها و محصولات کارخانه‌ای (محصول نهایی)</option>
                <option value="raw_material">مواد اولیه و شیمیایی (تولیدی)</option>
                <option value="equipment">ماشین‌آلات و تجهیزات خطوط تولید</option>
                <option value="service">خدمات صنعتی، چاپ و بسته‌بندی</option>
                <option value="barter">تهاتر و معاوضه کارخانه‌ای</option>
                <option value="general">عمومی و سایر صنایع</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                زیردسته‌ها (با ویرگول «،» جدا کنید)
              </label>
              <input
                type="text"
                value={subcategoriesStr}
                onChange={(e) => setSubcategoriesStr(e.target.value)}
                placeholder="مثلاً: بیسکویت، ویفر، کیک، کلوچه"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">توضیحات کوتاه (جهت راهنمای خریداران)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="توضیحات خلاصه جهت نمایش در سربرگ دسته‌بندی..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white h-18 resize-none"
              />
            </div>

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

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={16} />
                <span>{saving ? "در حال ثبت..." : editingId ? "بروزرسانی دسته‌بندی" : "ایجاد و انتشار دسته"}</span>
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  انصراف
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Tag size={18} className="text-emerald-600" />
                <span>دسته‌بندی‌های موجود ({filteredCategories.length})</span>
              </h3>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="جستجو در دسته‌ها..."
                    className="pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
                  />
                </div>

                <select
                  value={selectedTypeFilter}
                  onChange={e => setSelectedTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">همه بخش‌ها</option>
                  <option value="product">کالاهای کارخانه‌ای</option>
                  <option value="raw_material">مواد اولیه</option>
                  <option value="equipment">ماشین‌آلات</option>
                  <option value="service">خدمات</option>
                  <option value="barter">تهاتر</option>
                </select>
              </div>
            </div>

            {filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs space-y-2">
                <Layers size={32} className="mx-auto text-slate-300" />
                <p>هیچ دسته‌بندی با این مشخصات یافت نشد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCategories.map((cat, idx) => {
                  const prodCount = categoryProductCounts[cat.name] || 0;
                  return (
                    <div
                      key={`admin-cat-mgmt-${cat.id || idx}-${idx}`}
                      className="p-4 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 rounded-2xl transition-all flex flex-col justify-between gap-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-3">
                          <span className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-2xl flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            {cat.emoji || '🏷️'}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                                {cat.name}
                              </h4>
                              {cat.isCustom && (
                                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-black rounded">
                                  سفارشی
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTypeBadgeColor(cat.type)}`}>
                                {getTypeLabel(cat.type)}
                              </span>
                              {prodCount > 0 && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black flex items-center gap-0.5">
                                  <Boxes size={10} />
                                  <span>{prodCount} کالا</span>
                                </span>
                              )}
                            </div>
                            {cat.description && (
                              <p className="text-[11px] text-slate-500 font-medium mt-1.5 line-clamp-2">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEdit(cat)}
                            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat.id, cat.name)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories preview */}
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-bold">زیردسته‌ها:</span>
                          {cat.subcategories.map((sub, sIdx) => (
                            <span
                              key={`sub-${sIdx}`}
                              className="px-2 py-0.5 bg-white text-slate-600 rounded text-[10px] font-bold border border-slate-200"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
