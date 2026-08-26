import { useState } from "react";
import { 
  Newspaper, X, PlusCircle, Sparkles, RefreshCw, Wand2, 
  Bot, Calendar, Edit3, Trash2, Zap 
} from "lucide-react";
import { motion } from "motion/react";
import { toPersianNum } from "../utils/persian-utils";
import { db, updateDoc, doc, collection, addDoc, serverTimestamp, deleteDoc } from "../lib/data-layer";

interface AdminArticlesProps {
  articles: any[];
  products: any[];
  b2bConfig: any;
  setLoading: (val: boolean) => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
  onUpdateArticles?: () => Promise<void>;
}

export default function AdminArticles({
  articles,
  products,
  b2bConfig,
  setLoading,
  setSuccessMsg,
  setErrorMsg,
  confirmAction,
  onUpdateArticles,
}: AdminArticlesProps) {
  // Local News States
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsContent, setNewsContent] = useState("");
  const [newsImage, setNewsImage] = useState("");
  const [newsCategory, setNewsCategory] = useState("تنظیم بازار");
  const [newsSource, setNewsSource] = useState("روابط عمومی دست اول");

  // GapGPT News States
  const [gapGptTopicType, setGapGptTopicType] = useState<string>('wholesale');
  const [gapGptProductId, setGapGptProductId] = useState<string>("");
  const [gapGptFactoryId, setGapGptFactoryId] = useState<string>("");
  const [gapGptCustomPrompt, setGapGptCustomPrompt] = useState<string>("");
  const [gapGptCategory, setGapGptCategory] = useState<string>("راهنمای خرید عمده");
  const [gapGptStatusMsg, setGapGptStatusMsg] = useState<string | null>(null);
  const [isGeneratingWithGapGpt, setIsGeneratingWithGapGpt] = useState(false);
  const [gapGptTone, setGapGptTone] = useState<string>('رسمی و بنکداری');

  const handleCreateOrUpdateNews = async () => {
    if (!newsTitle || !newsContent) {
      setErrorMsg("لطفاً عنوان و متن خبر را وارد کنید.");
      return;
    }

    setLoading(true);
    try {
      const newId = editingNewsId || `news-${Date.now()}`;
      const payload = {
        id: newId,
        title: newsTitle,
        summary: newsSummary,
        content: newsContent,
        category: newsCategory,
        imageUrl: newsImage || "https://images.unsplash.com/photo-1504711432869-efd5973e8a48?auto=format&fit=crop&q=80&w=1000",
        source: newsSource,
        date: new Date().toLocaleDateString('fa-IR'),
        createdAt: new Date().toISOString()
      };

      try {
        if (editingNewsId) {
          await updateDoc(doc(db, "news", editingNewsId), payload);
        } else {
          await addDoc(collection(db, "news"), {
            ...payload,
            createdAt: serverTimestamp()
          });
        }
      } catch (e) {
        console.warn("Firestore news update failed, saving locally:", e);
      }

      // Update local storage articles
      const saved = localStorage.getItem("dastavval_news_articles");
      let currentArticles: any[] = saved !== null ? JSON.parse(saved) : (articles || []);
      if (editingNewsId) {
        currentArticles = currentArticles.map(a => a.id === editingNewsId ? { ...a, ...payload } : a);
      } else {
        currentArticles.unshift(payload);
      }
      localStorage.setItem("dastavval_news_articles", JSON.stringify(currentArticles));

      setSuccessMsg(editingNewsId ? "خبر با موفقیت بروزرسانی شد." : "خبر جدید با موفقیت منتشر شد.");
      setIsAddingNews(false);
      setEditingNewsId(null);
      setNewsTitle("");
      setNewsSummary("");
      setNewsContent("");
      setNewsImage("");
      
      if (onUpdateArticles) await onUpdateArticles();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در انتشار خبر: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNewsClick = (article: any) => {
    setIsAddingNews(true);
    setEditingNewsId(article.id);
    setNewsTitle(article.title || "");
    setNewsSummary(article.summary || "");
    setNewsContent(article.content || "");
    setNewsCategory(article.category || "اطلاعیه تامین");
    setNewsImage(article.imageUrl || "");
    setNewsSource(article.source || "مدیریت سامانه");
  };

  const handleDeleteNews = async (id: string, index?: number) => {
    confirmAction(
      "حذف خبر",
      "آیا از حذف این خبر اطمینان دارید؟",
      async () => {
        setLoading(true);
        try {
          if (id) {
            try {
              await deleteDoc(doc(db, "news", id));
            } catch (e) {
              console.warn("Firestore delete failed, deleting locally:", e);
            }
          }

          const saved = localStorage.getItem("dastavval_news_articles");
          let currentArticles: any[] = saved !== null ? JSON.parse(saved) : (articles || []);
          currentArticles = currentArticles.filter((a, idx) => a.id ? a.id !== id : idx !== index);
          localStorage.setItem("dastavval_news_articles", JSON.stringify(currentArticles));

          setSuccessMsg("خبر با موفقیت حذف شد.");
          if (onUpdateArticles) await onUpdateArticles();
          setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err: any) {
          setErrorMsg("خطا در حذف خبر.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleGenerateSingleGapGptArticle = async () => {
    setIsGeneratingWithGapGpt(true);
    setGapGptStatusMsg("در حال تولید و نگارش مقاله تخصصی با هوش مصنوعی GapGPT و لینک‌دهی سئو...");
    try {
      const res = await fetch("/api/ai/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicType: gapGptTopicType,
          targetId: gapGptTopicType === 'product' ? gapGptProductId : (gapGptTopicType === 'factory' ? gapGptFactoryId : undefined),
          customPrompt: gapGptCustomPrompt,
          category: gapGptCategory,
          tone: gapGptTone
        })
      });
      const data = await res.json();
      if (data.success && data.article) {
        setNewsTitle(data.article.title || "");
        setNewsSummary(data.article.summary || "");
        setNewsContent(data.article.content || "");
        setNewsCategory(data.article.category || gapGptCategory);
        setNewsImage(data.article.imageUrl || "");
        setNewsSource(data.article.source || "تحریریه هوش مصنوعی GapGPT");
        setGapGptStatusMsg("✅ مقاله هوشمند با موفقیت تولید گردید! اطلاعات فرم زیر تکمیل شد؛ می‌توانید بررسی و منتشر کنید.");
        setIsAddingNews(true);
        if (onUpdateArticles) await onUpdateArticles();
      } else {
        setGapGptStatusMsg("❌ خطا در دریافت پاسخ از سرویس GapGPT: " + (data.error || "خطای ناشناخته"));
      }
    } catch (err: any) {
      setGapGptStatusMsg("❌ خطا در ارتباط با سرویس GapGPT: " + err.message);
    } finally {
      setIsGeneratingWithGapGpt(false);
    }
  };

  const handleGenerateDailyBatchGapGpt = async () => {
    setIsGeneratingWithGapGpt(true);
    setGapGptStatusMsg("در حال تولید گروهی ۴ مقاله تخصصی برای مجله خبری با GapGPT...");
    try {
      const res = await fetch("/api/ai/generate-daily-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 4 })
      });
      const data = await res.json();
      if (data.success) {
        setGapGptStatusMsg(`✅ تعداد ${data.generatedCount || 4} مقاله جدید با موفقیت تولید و به مجله افزوده شد.`);
        if (onUpdateArticles) await onUpdateArticles();
      } else {
        setGapGptStatusMsg("❌ خطا در تولید روزانه مقالات: " + (data.error || "خطا"));
      }
    } catch (err: any) {
      setGapGptStatusMsg("❌ خطا در ساخت گروهی مقالات.");
    } finally {
      setIsGeneratingWithGapGpt(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-500 rounded-3xl text-white shadow-material-lg">
            <Newspaper size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 font-sans tracking-tight">مدیریت اخبار و مقالات سامانه</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">انتشار اطلاعیه‌ها، اخبار بازار، راهنماهای آموزشی با دستیار GapGPT</p>
          </div>
        </div>
        
        <button 
          onClick={() => { setIsAddingNews(!isAddingNews); setEditingNewsId(null); }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black transition-all shadow-material-md hover active:scale-95 cursor-pointer"
        >
          {isAddingNews ? <X size={16} /> : <PlusCircle size={16} />}
          {isAddingNews ? "انصراف از ثبت" : "ثبت/ویرایش دستی مقاله"}
        </button>
      </div>

      {/* GapGPT Intelligent Content Generation Control Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-tr from-amber-400 to-emerald-400 text-slate-950 rounded-2xl shadow-lg">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>تولید محتوای هوشمند مجله با GapGPT</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">موتور نویسنده B2B</span>
                </h4>
                <p className="text-xs text-slate-300 font-medium mt-1">نگارش خودکار مقاله تحلیلی، استعلام قیمت، راهنمای خرید عمده و اخبار خط تولید با لینک‌دهی تعاملی سئو</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleGenerateDailyBatchGapGpt}
                disabled={isGeneratingWithGapGpt}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isGeneratingWithGapGpt ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                <span>تولید روزانه ۴ مقاله (دسته‌ای)</span>
              </button>
            </div>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Topic Type Selector */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">نوع مقاله / موضوع تولیدی:</label>
              <select
                value={gapGptTopicType}
                onChange={(e: any) => setGapGptTopicType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-400 outline-none"
              >
                <option value="wholesale">📦 راهنمای خرید عمده و تحلیل حاشیه سود</option>
                <option value="product">🛍️ بررسی تخصصی محصول ویژه</option>
                <option value="factory">🏭 معرفی خط تولید کارخانه</option>
                <option value="billboard">⚡ فرصت‌های حراج کف بازار</option>
                <option value="custom">✍️ موضوع سفارشی با پرامپت دلخواه</option>
              </select>
            </div>

            {/* Target Product Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">کالای مرتبط (جهت لینک‌دهی سئو):</label>
              <select
                value={gapGptProductId}
                onChange={(e) => setGapGptProductId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-400 outline-none"
              >
                <option value="">انتخاب خودکار توسط GapGPT</option>
                {products.map((p, pIdx) => (
                  <option key={`gapgpt-prd-${p.id || pIdx}-${pIdx}`} value={p.id}>
                    {p.name} ({p.brand || 'معتبر'})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Factory Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">کارخانه مرتبط (جهت لینک‌دهی سئو):</label>
              <select
                value={gapGptFactoryId}
                onChange={(e) => setGapGptFactoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-400 outline-none"
              >
                <option value="">انتخاب خودکار توسط GapGPT</option>
                {(b2bConfig?.factories || []).map((f: any, fIdx: number) => (
                  <option key={`gapgpt-fac-${f.id || fIdx}-${fIdx}`} value={f.id}>
                    {f.name} ({f.city || 'ایران'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Custom Prompt & Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">پرامپت اختصاصی / کلمات کلیدی مد نظر سئو:</label>
              <input
                type="text"
                value={gapGptCustomPrompt}
                onChange={(e) => setGapGptCustomPrompt(e.target.value)}
                placeholder="مثال: وضعیت حاشیه سود پخش عمده تن ماهی ۱۸۰ گرمی در بنکداری‌های تهران و اصفهان..."
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-400 focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">دسته‌بندی موضوعی:</label>
              <select
                value={gapGptCategory}
                onChange={(e) => setGapGptCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs font-bold text-white focus:border-amber-400 outline-none"
              >
                <option value="راهنمای خرید عمده">راهنمای خرید عمده</option>
                <option value="تحلیل خط تولید">تحلیل خط تولید</option>
                <option value="اخبار کف بازار">اخبار کف بازار</option>
                <option value="تنظیم بازار">تنظیم بازار و سهمیه</option>
                <option value="تامین مواد اولیه">تامین مواد اولیه</option>
              </select>
            </div>
          </div>

          {/* Status Message */}
          {gapGptStatusMsg && (
            <div className="p-3.5 rounded-xl bg-indigo-900/80 border border-indigo-400/30 text-emerald-300 text-xs font-bold flex items-center justify-between">
              <span>{gapGptStatusMsg}</span>
              <button onClick={() => setGapGptStatusMsg(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleGenerateSingleGapGptArticle}
              disabled={isGeneratingWithGapGpt}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isGeneratingWithGapGpt ? <RefreshCw size={16} className="animate-spin" /> : <Bot size={16} />}
              <span>تولید و نگارش مقاله کامل با GapGPT</span>
            </button>

            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">موتور فعال: GapGPT (هوش مصنوعی تحلیلی مجله دست اول)</span>
          </div>
        </div>
      </div>

      {isAddingNews && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-material-xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
            <div className="w-2 h-8 bg-rose-500 rounded-full" />
            <h4 className="text-base font-black text-slate-800">
              {editingNewsId ? "ویرایش مقاله / خبر" : "ایجاد محتوای جدید"}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 text-right">
              <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">عنوان اصلی خبر</label>
              <input 
                type="text"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="تیتر جذاب خبری..."
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
              />
            </div>
            
            <div className="space-y-2 text-right">
              <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">دسته موضوعی</label>
              <select 
                value={newsCategory}
                onChange={(e) => setNewsCategory(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold"
              >
                <option value="تنظیم بازار">تنظیم بازار و سهمیه</option>
                <option value="خط تولید">اخبار خط تولید</option>
                <option value="توزیع">لجستیک و توزیع</option>
                <option value="گزارش مالی">گزارشات مالی و سود</option>
                <option value="تخفیف ویژه">جشنواره و تخفیفات</option>
              </select>
            </div>

            <div className="space-y-2 text-right md:col-span-2">
              <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">خلاصه کوتاه (جهت نمایش در کارت)</label>
              <input 
                type="text"
                value={newsSummary}
                onChange={(e) => setNewsSummary(e.target.value)}
                placeholder="یک یا دو جمله توضیح کوتاه..."
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">تصویر شاخص (URL)</label>
              <input 
                type="text"
                value={newsImage}
                onChange={(e) => setNewsImage(e.target.value)}
                placeholder="https://..."
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">منبع خبر</label>
              <input 
                type="text"
                value={newsSource}
                onChange={(e) => setNewsSource(e.target.value)}
                placeholder="مثال: روابط عمومی دست اول"
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold placeholder"
              />
            </div>
          </div>

          <div className="mt-8 space-y-2 text-right">
            <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">متن کامل مقاله / خبر</label>
            <textarea 
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="محتوای اصلی را اینجا بنویسید..."
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold h-64 placeholder"
            />
          </div>

          <div className="mt-10 flex justify-start">
            <button 
              onClick={handleCreateOrUpdateNews}
              className="px-10 py-4 bg-rose-600 hover text-white rounded-2xl text-sm font-black transition-all shadow-material-lg hover:-translate-y-1"
            >
              {editingNewsId ? "بروزرسانی نهایی مطلب" : "انتشار و نمایش"}
            </button>
          </div>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <Newspaper className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-sm font-black text-slate-700">هیچ خبری یا مقاله‌ای ثبت نشده است</p>
          <p className="text-xs text-slate-400 font-bold mt-1">جهت افزودن خبر جدید روی دکمه «افزودن خبر جدید» کلیک کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {articles.map((article, idx) => (
            <div 
              key={article.id || `news-${idx}`} 
              className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-material-md hover transition-all duration-500 group flex gap-6"
            >
              <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 shadow-inner border border-slate-50">
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
              </div>
              
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-tighter">
                      {article.category}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Calendar size={10} />
                      {article.date}
                    </p>
                  </div>
                  <h5 className="text-sm font-black text-slate-900 mb-2 line-clamp-1">{article.title}</h5>
                  <p className="text-[11px] text-slate-500 font-bold line-clamp-2 leading-relaxed">{article.summary}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditNewsClick(article)}
                      className="p-2.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="ویرایش مطلب"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteNews(article.id, idx)}
                      className="p-2.5 bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="حذف مطلب"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400">منبع: {article.source}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex gap-4 items-start shadow-material-sm">
        <div className="p-2 bg-white rounded-xl text-rose-600 shadow-sm">
          <Zap size={20} />
        </div>
        <div>
          <p className="text-xs font-black text-rose-900 mb-1">راهنمای تولید محتوا:</p>
          <p className="text-[11px] text-rose-800/80 font-bold leading-relaxed">
            انتشار اخبار و مقالات آموزشی باعث افزایش درگیری بنکداران با سامانه می‌شود. مطالبی در مورد تغییرات قیمت، تخفیفات دوره‌ای کارخانجات و راهنماهای سودآوری بیشترین بازدید را دارند.
          </p>
        </div>
      </div>
    </div>
  );
}
