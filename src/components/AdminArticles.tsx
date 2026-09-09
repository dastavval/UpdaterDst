import { useState, useEffect } from "react";
import { 
  Newspaper, X, PlusCircle, Sparkles, RefreshCw, Wand2, 
  Bot, Calendar, Edit3, Trash2, Zap, Settings2, KeyRound, 
  Clock, CheckCircle2, AlertCircle, PlayCircle, Eye, EyeOff,
  Sliders, Link2, FileText, Activity, Layers, ShieldCheck, Upload, Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toPersianNum } from "../utils/persian-utils";
import { db, updateDoc, doc, collection, addDoc, serverTimestamp, deleteDoc } from "../lib/data-layer";
import { uploadToParsPackStorage } from "../utils/storage";
import { autoInjectProductShortcodes } from "../utils/autoLinker";

interface AdminArticlesProps {
  articles: any[];
  products: any[];
  b2bConfig: any;
  setLoading: (val: boolean) => void;
  setSuccessMsg: (msg: string | null) => void;
  setErrorMsg: (msg: string | null) => void;
  confirmAction: (title: string, message: string, onConfirm: () => void) => void;
  onUpdateArticles?: () => Promise<void>;
  onUpdateB2bConfig?: (newCfg: any) => Promise<void>;
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
  onUpdateB2bConfig
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
  const [newsPublished, setNewsPublished] = useState<boolean>(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // SEO Pillar & Keywords States
  const [newsArticleType, setNewsArticleType] = useState<'pillar' | 'cluster'>('cluster');
  const [newsFocusKeyword, setNewsFocusKeyword] = useState("");
  const [newsSecondaryKeywords, setNewsSecondaryKeywords] = useState("");
  const [newsMetaTitle, setNewsMetaTitle] = useState("");
  const [newsMetaDescription, setNewsMetaDescription] = useState("");
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false);
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);

  const handleGenerateAiArticleImage = () => {
    setIsGeneratingAiImage(true);
    try {
      const keyword = newsFocusKeyword || newsTitle || "خرید عمده مواد غذایی کارخانه";
      const cleanKeyword = keyword.replace(/[^\u0600-\u06FF\s0-9a-zA-Z]/g, ' ').trim();
      const promptText = `Iranian wholesale B2B food factory distribution, ${cleanKeyword}, high resolution photo`;
      const aiImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(promptText)}?width=1200&height=630&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
      
      setNewsImage(aiImageUrl);
      setSuccessMsg("🤖 تصویر اختصاصی با هوش مصنوعی برای مقاله تولید شد.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (e: any) {
      setErrorMsg("خطا در ساخت تصویر با هوش مصنوعی.");
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  const handleAutoGenerateSeoKeywords = async () => {
    if (!newsTitle) {
      setErrorMsg("لطفاً ابتدا عنوان مقاله را وارد کنید.");
      return;
    }
    setIsGeneratingSeo(true);
    try {
      const res = await fetch("/api/ai/generate-seo-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newsTitle,
          content: newsContent || newsSummary,
          category: newsCategory
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setNewsFocusKeyword(data.data.focusKeyword || "");
        setNewsSecondaryKeywords(Array.isArray(data.data.secondaryKeywords) ? data.data.secondaryKeywords.join("، ") : "");
        setNewsMetaTitle(data.data.metaTitle || "");
        setNewsMetaDescription(data.data.metaDescription || "");
        setNewsArticleType(data.data.articleType === 'pillar' ? 'pillar' : 'cluster');
        setSuccessMsg("⚡ اطلاعات سئو، کلیدواژه‌ها و متاتگ‌های گوگل با هوش مصنوعی استخراج و فرم تکمیل گردید.");
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        setErrorMsg("خطا در استخراج سئو با AI");
      }
    } catch (e: any) {
      setErrorMsg("خطا در ارتباط با سرور سئو: " + e.message);
    } finally {
      setIsGeneratingSeo(false);
    }
  };

  const handleAutoLinkProducts = () => {
    if (!newsContent) {
      setErrorMsg("لطفاً ابتدا متن مقاله را وارد کنید.");
      return;
    }
    const result = autoInjectProductShortcodes(newsContent, products || [], 2);
    if (result.linksCount > 0) {
      setNewsContent(result.updatedContent);
      const productNames = result.linkedProducts.map(p => p.name).slice(0, 3).join('، ');
      const extraCount = result.linkedProducts.length > 3 ? ` و ${result.linkedProducts.length - 3} کالا دیگر` : '';
      setSuccessMsg(`⚡ لینک‌دهی خودکار سئو با موفقیت انجام شد: تعداد ${result.linksCount} لینک هوشمند محصول (${productNames}${extraCount}) در متن مقاله درج گردید.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setSuccessMsg("کلمه کلیدی منطبق با محصولات موجود در سیستم در متن پیدا نشد یا همه کلمات قبلاً لینک شده‌اند.");
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadToParsPackStorage(file, "articles");
      if (res.success && res.url) {
        setNewsImage(res.url);
        setSuccessMsg("تصویر مقاله با موفقیت بارگذاری گردید.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg("خطا در بارگذاری تصویر مقاله: " + (res.error || "مشکل ناشناخته"));
      }
    } catch (err: any) {
      setErrorMsg("خطا در بارگذاری تصویر: " + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // GapGPT News States
  const [gapGptTopicType, setGapGptTopicType] = useState<string>('wholesale');
  const [gapGptProductId, setGapGptProductId] = useState<string>("");
  const [gapGptFactoryId, setGapGptFactoryId] = useState<string>("");
  const [gapGptCustomPrompt, setGapGptCustomPrompt] = useState<string>("");
  const [gapGptCategory, setGapGptCategory] = useState<string>("راهنمای خرید عمده");
  const [gapGptStatusMsg, setGapGptStatusMsg] = useState<string | null>(null);
  const [isGeneratingWithGapGpt, setIsGeneratingWithGapGpt] = useState(false);
  const [gapGptTone, setGapGptTone] = useState<string>('رسمی و بنکداری');

  const handleProductChange = (prodId: string) => {
    setGapGptProductId(prodId);
    if (!prodId) {
      setGapGptFactoryId("");
      return;
    }
    const selectedProd = products.find(p => String(p.id) === String(prodId));
    if (selectedProd) {
      const factories = b2bConfig?.factories || [];
      const matchedFactory = factories.find((f: any) => 
        String(f.id) === String(selectedProd.factoryId) || 
        String(f.id) === String(selectedProd.factory_id) || 
        String(f.name).toLowerCase().includes(String(selectedProd.brand || '').toLowerCase()) ||
        String(selectedProd.brand || '').toLowerCase().includes(String(f.name).toLowerCase()) ||
        String(f.name).toLowerCase().includes(String(selectedProd.sellerName || '').toLowerCase())
      );
      if (matchedFactory) {
        setGapGptFactoryId(matchedFactory.id);
        setGapGptStatusMsg(`کارخانه مرتبط شناسایی و قفل شد: ${matchedFactory.name}`);
      } else {
        setGapGptStatusMsg(`توجه: کارخانه‌ای مرتبط با برند "${selectedProd.brand || 'نامشخص'}" پیدا نشد. لطفاً دستی کارخانه مرتبط را انتخاب کنید.`);
      }
    }
  };

  // GapGPT Settings Modal & Config
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; reply?: string } | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Settings Form State
  const [aiProvider, setAiProvider] = useState<string>("gapgpt");
  const [aiApiKey, setAiApiKey] = useState<string>("");
  const [aiEndpointUrl, setAiEndpointUrl] = useState<string>("https://api.gapgpt.app/v1");
  const [aiModel, setAiModel] = useState<string>("gpt-4o-mini");
  
  // Timing & Schedule Settings
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(true);
  const [scheduleIntervalHours, setScheduleIntervalHours] = useState<number>(24);
  const [scheduleTimeOfDay, setScheduleTimeOfDay] = useState<string>("08:00");
  const [articlesPerBatch, setArticlesPerBatch] = useState<number>(3);
  const [defaultWordCount, setDefaultWordCount] = useState<number>(1200);
  const [autoPublish, setAutoPublish] = useState<boolean>(true);
  const [autoLinkInternal, setAutoLinkInternal] = useState<boolean>(true);
  const [defaultTone, setDefaultTone] = useState<string>("رسمی و بنکداری");

  // Load current AI Config from backend
  useEffect(() => {
    fetch("/api/admin/ai-config")
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.provider) setAiProvider(data.provider);
          if (data.endpointUrl) setAiEndpointUrl(data.endpointUrl);
          if (data.model) setAiModel(data.model);
          if (data.scheduleEnabled !== undefined) setScheduleEnabled(data.scheduleEnabled);
          if (data.scheduleIntervalHours) setScheduleIntervalHours(data.scheduleIntervalHours);
          if (data.scheduleTimeOfDay) setScheduleTimeOfDay(data.scheduleTimeOfDay);
          if (data.articlesPerBatch) setArticlesPerBatch(data.articlesPerBatch);
          if (data.defaultWordCount) setDefaultWordCount(data.defaultWordCount);
          if (data.autoPublish !== undefined) setAutoPublish(data.autoPublish);
          if (data.autoLinkInternal !== undefined) setAutoLinkInternal(data.autoLinkInternal);
          if (data.defaultTone) setDefaultTone(data.defaultTone);
        }
      })
      .catch(() => {});
  }, []);

  const handleTestAiConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: aiApiKey,
          endpointUrl: aiEndpointUrl,
          model: aiModel
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || "اتصال با موفقیت برقرار شد!",
          reply: data.reply
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || "خطا در تست اتصال"
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "خطا در اتصال به سرور: " + err.message
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const payload = {
        provider: aiProvider,
        apiKey: aiApiKey,
        endpointUrl: aiEndpointUrl,
        model: aiModel,
        scheduleEnabled,
        scheduleIntervalHours,
        scheduleTimeOfDay,
        articlesPerBatch,
        defaultWordCount,
        autoPublish,
        autoLinkInternal,
        defaultTone
      };

      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("تنظیمات و راه‌اندازی GapGPT با موفقیت ذخیره و فعال شد.");
        setShowSettingsModal(false);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg("خطا در ذخیره تنظیمات: " + (data.error || "خطای ناشناخته"));
      }
    } catch (err: any) {
      setErrorMsg("خطا در ذخیره تنظیمات: " + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

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
        articleType: newsArticleType,
        focusKeyword: newsFocusKeyword,
        secondaryKeywords: newsSecondaryKeywords.split("،").map(s => s.trim()).filter(Boolean),
        metaTitle: newsMetaTitle || newsTitle,
        metaDescription: newsMetaDescription || newsSummary,
        imageUrl: newsImage || "https://images.unsplash.com/photo-1504711432869-efd5973e8a48?auto=format&fit=crop&q=80&w=1000",
        source: newsSource,
        published: newsPublished,
        status: newsPublished ? "published" : "draft",
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

      // Sync with server API (articles.json)
      try {
        await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn("Server API sync failed:", e);
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

      setSuccessMsg(editingNewsId ? "خبر با موفقیت بروزرسانی شد." : (newsPublished ? "خبر جدید با موفقیت منتشر شد." : "مقاله به صورت پیش‌نویس ذخیره گردید."));
      setIsAddingNews(false);
      setEditingNewsId(null);
      setNewsTitle("");
      setNewsSummary("");
      setNewsContent("");
      setNewsImage("");
      setNewsFocusKeyword("");
      setNewsSecondaryKeywords("");
      setNewsMetaTitle("");
      setNewsMetaDescription("");
      setNewsPublished(true);
      
      if (onUpdateArticles) await onUpdateArticles();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در انتشار خبر: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveArticle = async (articleToApprove: any) => {
    setLoading(true);
    try {
      const updated = {
        ...articleToApprove,
        published: true,
        status: "published"
      };

      try {
        if (articleToApprove.id) {
          await updateDoc(doc(db, "news", articleToApprove.id), { published: true, status: "published" });
        }
      } catch (e) {}

      try {
        await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
      } catch (e) {}

      const saved = localStorage.getItem("dastavval_news_articles");
      let currentArticles: any[] = saved !== null ? JSON.parse(saved) : (articles || []);
      currentArticles = currentArticles.map(a => a.id === articleToApprove.id ? updated : a);
      localStorage.setItem("dastavval_news_articles", JSON.stringify(currentArticles));

      setSuccessMsg("✅ مقاله با موفقیت بررسی و در مجله عمومی منتشر گردید.");
      if (onUpdateArticles) await onUpdateArticles();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg("خطا در تایید مقاله: " + err.message);
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
    setNewsArticleType(article.articleType || "cluster");
    setNewsFocusKeyword(article.focusKeyword || "");
    setNewsSecondaryKeywords(Array.isArray(article.secondaryKeywords) ? article.secondaryKeywords.join("، ") : (article.secondaryKeywords || ""));
    setNewsMetaTitle(article.metaTitle || article.title || "");
    setNewsMetaDescription(article.metaDescription || article.summary || "");
    setNewsImage(article.imageUrl || "");
    setNewsSource(article.source || "مدیریت سامانه");
    setNewsPublished(article.published !== false && article.status !== 'draft');
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
            try {
              await fetch(`/api/articles/${id}`, { method: "DELETE" });
            } catch (e) {
              console.warn("Server API delete failed:", e);
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
    setGapGptStatusMsg("در حال نگارش مقاله دقیق بر اساس اطلاعات واقعی دیتابیس با هوش مصنوعی GapGPT...");
    try {
      const res = await fetch("/api/ai/generate-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicType: gapGptTopicType,
          targetId: gapGptTopicType === 'product' ? gapGptProductId : (gapGptTopicType === 'factory' ? gapGptFactoryId : undefined),
          productId: gapGptProductId,
          factoryId: gapGptFactoryId,
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
        setNewsFocusKeyword(data.article.focusKeyword || "");
        setNewsSecondaryKeywords(Array.isArray(data.article.secondaryKeywords) ? data.article.secondaryKeywords.join("، ") : "");
        setNewsMetaTitle(data.article.metaTitle || "");
        setNewsMetaDescription(data.article.metaDescription || "");
        setNewsPublished(false); // REQUIRES ADMIN APPROVAL BEFORE PUBLISHING!
        setGapGptStatusMsg("📝 پیش‌نویس مقاله با موفقیت تولید شد! اطلاعات در فرم زیر آماده است؛ لطفاً بررسی نموده و پس از تایید روی «ذخیره و انتشار مقاله» کلیک فرمایید.");
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
    setGapGptStatusMsg(`در حال تولید گروهی ${toPersianNum(articlesPerBatch)} مقاله تخصصی برای مجله خبری با GapGPT...`);
    try {
      const res = await fetch("/api/ai/generate-daily-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: articlesPerBatch })
      });
      const data = await res.json();
      if (data.success) {
        setGapGptStatusMsg(`✅ تعداد ${toPersianNum(data.generatedCount || articlesPerBatch)} مقاله جدید با موفقیت تولید و به مجله افزوده شد.`);
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
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600 rounded-3xl text-white shadow-material-lg">
            <Newspaper size={28} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 font-sans tracking-tight">مجله بازرگانی و هوش مصنوعی GapGPT</h3>
            <p className="text-xs text-slate-500 font-bold mt-1">تولید خودکار مقالات، تحلیل بازار بنکداری، اتصال به API و زمان‌بندی انتشار</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-2xl text-xs font-black transition-all border border-indigo-200 shadow-xs cursor-pointer active:scale-95"
          >
            <Settings2 size={16} />
            <span>تنظیمات و راه‌اندازی GapGPT</span>
          </button>

          <button 
            onClick={() => { setIsAddingNews(!isAddingNews); setEditingNewsId(null); }}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all shadow-material-md hover active:scale-95 cursor-pointer"
          >
            {isAddingNews ? <X size={16} /> : <PlusCircle size={16} />}
            {isAddingNews ? "انصراف از ثبت" : "ثبت دستی مقاله"}
          </button>
        </div>
      </div>

      {/* GapGPT Intelligent Content Generation Control Panel */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-tr from-amber-400 to-emerald-400 text-slate-950 rounded-2xl shadow-lg">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-black text-white">تولید محتوای هوشمند مجله با GapGPT</h4>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5 shadow-inner">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>اتصال مستقیم هوشمند (Gemini 3.7 / GapGPT)</span>
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  نگارش خودکار مقاله تحلیلی، استعلام قیمت، راهنمای خرید عمده و اخبار خط تولید با لینک‌دهی تعاملی سئو
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
              >
                <Sliders size={14} />
                <span>کانفیگ API و زمان‌بندی</span>
              </button>

              <button
                onClick={handleGenerateDailyBatchGapGpt}
                disabled={isGeneratingWithGapGpt}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isGeneratingWithGapGpt ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                <span>تولید گروهی ({toPersianNum(articlesPerBatch)} مقاله)</span>
              </button>
            </div>
          </div>

          {/* Quick Schedule Status Bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Clock className="text-emerald-400" size={16} />
              <span className="text-slate-300 font-bold">
                وضعیت زمان‌بندی خودکار: {scheduleEnabled ? <span className="text-emerald-400 font-black">فعال (هر {toPersianNum(scheduleIntervalHours)} ساعت در ساعت {toPersianNum(scheduleTimeOfDay)})</span> : <span className="text-rose-400 font-black">غیرفعال</span>}
              </span>
            </div>

            <div className="flex items-center gap-3 text-slate-400 font-bold">
              <span>تعداد هر نوبت: {toPersianNum(articlesPerBatch)} مقاله</span>
              <span>•</span>
              <span>انتشار: {autoPublish ? "مستقیم در مجله" : "پیش‌نویس"}</span>
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
                onChange={(e) => handleProductChange(e.target.value)}
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
              <span>تولید و نگارش تک مقاله فوری با GapGPT</span>
            </button>

            <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">
              لینک‌دهی هوشمند داخلی به کالاها و کارخانجات فعال است
            </span>
          </div>
        </div>
      </div>

      {/* Settings Modal: GapGPT API Config & Automation */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-right" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 overflow-y-auto max-h-[92vh] space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl">
                    <KeyRound size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      تنظیمات و راه‌اندازی درگاه هوش مصنوعی GapGPT
                    </h3>
                    <p className="text-xs text-slate-500 font-bold mt-0.5">
                      پیکربندی کلید API، آدرس سرور، مدل نویسنده و زمان‌بندی تولید خودکار مقالات
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAiConfig} className="space-y-5">
                {/* SECTION 1: API Configuration */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <span>پیکربندی اتصال API هوش مصنوعی</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Provider */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ارائه‌دهنده سرویس (Provider):</label>
                      <select
                        value={aiProvider}
                        onChange={(e) => setAiProvider(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="gapgpt">موتور اختصاصی GapGPT (بدون تحریم، فوق‌سریع به فارسی)</option>
                        <option value="custom">درگاه سفارشی GapGPT Pro</option>
                      </select>
                    </div>

                    {/* AI Model */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">مدل هوش مصنوعی (GapGPT Model):</label>
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="gpt-4o-mini">gpt-4o-mini (مدل هوشمند پیش‌فرض GapGPT - فوق‌سریع و دقیق)</option>
                        <option value="gpt-4o">gpt-4o (جامع‌ترین تحلیل بازار بنکداری و تولید سئو)</option>
                        <option value="gapgpt-4o">gapgpt-4o (مدل بومی هجین و تخصصی تجاری)</option>
                        <option value="gpt-3.5-turbo">gpt-3.5-turbo (مدل اقتصادی و سبک)</option>
                      </select>
                    </div>
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">کلید دسترسی (API Key):</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        placeholder="sk-gapgpt-xxxxxxxxxxxxxxxxxxxx"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dir-ltr text-left"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 block">
                      کلید دریافتی از پنل GapGPT یا سرور مقصد را اینجا قرار دهید.
                    </span>
                  </div>

                  {/* Base URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">آدرس سرور پایه (Base Endpoint URL):</label>
                    <input
                      type="text"
                      value={aiEndpointUrl}
                      onChange={(e) => setAiEndpointUrl(e.target.value)}
                      placeholder="https://api.gapgpt.app/v1"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dir-ltr text-left"
                    />
                  </div>

                  {/* Test Connection Button */}
                  <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleTestAiConnection}
                      disabled={isTestingConnection}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isTestingConnection ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                      <span>تست اتصال و سنجش سرعت پاسخ</span>
                    </button>

                    {testResult && (
                      <div className={`text-xs font-bold flex items-center gap-1.5 ${testResult.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {testResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        <span>{testResult.message}</span>
                      </div>
                    )}
                  </div>

                  {testResult?.reply && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold">
                      <span className="text-[10px] text-emerald-600 block mb-1">پاسخ دریافتی از هوش مصنوعی:</span>
                      "{testResult.reply}"
                    </div>
                  )}
                </div>

                {/* SECTION 2: Automated Timing & Scheduling */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <Clock size={16} className="text-indigo-600" />
                      <span>تنظیمات زمان‌بندی و تولید خودکار مقالات</span>
                    </h4>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleEnabled}
                        onChange={(e) => setScheduleEnabled(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-800">فعال‌سازی تولید خودکار</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Interval */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">بازه زمانی تولید خودکار:</label>
                      <select
                        value={scheduleIntervalHours}
                        onChange={(e) => setScheduleIntervalHours(Number(e.target.value))}
                        disabled={!scheduleEnabled}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                      >
                        <option value={6}>هر ۶ ساعت یک‌بار</option>
                        <option value={12}>هر ۱۲ ساعت یک‌بار</option>
                        <option value={24}>روزانه یک‌بار (۲۴ ساعت)</option>
                        <option value={168}>هفتگی یک‌بار</option>
                      </select>
                    </div>

                    {/* Time of Day */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">ساعت شروع تولید روزانه:</label>
                      <input
                        type="time"
                        value={scheduleTimeOfDay}
                        onChange={(e) => setScheduleTimeOfDay(e.target.value)}
                        disabled={!scheduleEnabled}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Articles Per Batch */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">تعداد مقالات در هر بار:</label>
                      <select
                        value={articlesPerBatch}
                        onChange={(e) => setArticlesPerBatch(Number(e.target.value))}
                        disabled={!scheduleEnabled}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                      >
                        <option value={1}>۱ مقاله</option>
                        <option value={2}>۲ مقاله</option>
                        <option value={3}>۳ مقاله تخصصی</option>
                        <option value={4}>۴ مقاله جامع</option>
                        <option value={5}>۵ مقاله کامل</option>
                      </select>
                    </div>

                    {/* Word Count */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">حجم و طول محتوا:</label>
                      <select
                        value={defaultWordCount}
                        onChange={(e) => setDefaultWordCount(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={600}>کوتاه و خبری (۶۰۰ کلمه)</option>
                        <option value={1200}>استاندارد تحلیلی (۱۲۰۰ کلمه)</option>
                        <option value={2000}>جامع و سئو شده عمیق (۲۰۰۰+ کلمه)</option>
                      </select>
                    </div>

                    {/* Tone */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">لحن نگارش مطالب:</label>
                      <select
                        value={defaultTone}
                        onChange={(e) => setDefaultTone(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="رسمی و بنکداری">رسمی و بنکداری</option>
                        <option value="تحلیلی و اقتصادی">تحلیلی و اقتصادی</option>
                        <option value="آموزشی و راهنمای تجاری">آموزشی و راهنمای تجاری</option>
                        <option value="خبری و اطلاعیه">خبری و اطلاعیه</option>
                      </select>
                    </div>

                    {/* Auto-publish */}
                    <div className="flex flex-col justify-center">
                      <label className="flex items-center gap-2 cursor-pointer mt-3">
                        <input
                          type="checkbox"
                          checked={autoPublish}
                          onChange={(e) => setAutoPublish(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-800">انتشار خودکار مستقیم در مجله</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal mt-0.5">
                        (در صورت غیرفعال بودن در پیش‌نویس ذخیره می‌شود)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition-all shadow-material-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingConfig ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    <span>ذخیره و فعال‌سازی تنظیمات</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Article Form */}
      {isAddingNews && (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-material-xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
            <div className="w-2 h-8 bg-emerald-500 rounded-full" />
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
                <option value="راهنمای خرید عمده">راهنمای خرید عمده</option>
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
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">تصویر شاخص (آدرس لینک بیرونی، آپلود رایگان یا ساخت هوشمند)</label>
                <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  💡 قرار دادن لینک بیرونی کاملاً رایگان است
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <input 
                    type="text"
                    value={newsImage}
                    onChange={(e) => setNewsImage(e.target.value)}
                    placeholder="آدرس تصویر از اینترنت (https://...) یا آپلود رایگان"
                    className="flex-1 min-w-[200px] px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold"
                  />
                  <label className="px-5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black cursor-pointer flex items-center gap-2 transition-all shrink-0 shadow-sm">
                    {isUploadingImage ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span>{isUploadingImage ? "در حال آپلود..." : "آپلود رایگان تصویر"}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAiArticleImage}
                    disabled={isGeneratingAiImage}
                    className="px-4 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-black cursor-pointer flex items-center gap-1.5 transition-all shrink-0 shadow-sm disabled:opacity-50"
                    title="تولید اختیاری تصویر شاخص با AI"
                  >
                    {isGeneratingAiImage ? <RefreshCw size={16} className="animate-spin" /> : <Bot size={16} />}
                    <span>تولید اختیاری با AI</span>
                  </button>
                </div>

                {/* Quick Free Stock Images Presets (No Cost) */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold ml-1">تصاویر آماده رایگان (یک‌کلیک):</span>
                  <button
                    type="button"
                    onClick={() => setNewsImage("https://images.unsplash.com/photo-1578916171728-46686eac8d58?q=80&w=1200&auto=format&fit=crop")}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    🏬 انبار و صنایع غذایی
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsImage("https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1200&auto=format&fit=crop")}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    🏭 خط تولید کارخانه
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsImage("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop")}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    🚚 باربری و لوجستیک
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsImage("https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop")}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    🛒 بنکداری و عمده‌فروشی
                  </button>
                </div>

                {newsImage && (
                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 mt-1">
                    <img src={newsImage} alt="پیش‌نمایش مقاله" className="w-16 h-12 rounded-xl object-cover border border-slate-200" />
                    <div className="text-xs font-bold text-slate-600 truncate flex-1 dir-ltr text-left">{newsImage}</div>
                    <button 
                      type="button" 
                      onClick={() => setNewsImage("")} 
                      className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
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

          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-600" />
                <h5 className="text-xs font-black text-slate-900">تنظیمات سئو گوگل و ساختار پیلار (SEO Pillar Framework)</h5>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateSeoKeywords}
                disabled={isGeneratingSeo}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingSeo ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                <span>⚡ استخراج اتوماتیک کلیدواژه و متاتگ با AI</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">نوع ساختار مقاله:</label>
                <select
                  value={newsArticleType}
                  onChange={(e) => setNewsArticleType(e.target.value as 'pillar' | 'cluster')}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="cluster">مقاله خوشه‌ای (Cluster Content)</option>
                  <option value="pillar">📌 مقاله مادر/پیلار (Pillar Page - مرجع اصلی سئو)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">کلیدواژه اصلی سئو (Focus Keyword):</label>
                <input
                  type="text"
                  value={newsFocusKeyword}
                  onChange={(e) => setNewsFocusKeyword(e.target.value)}
                  placeholder="مثال: خرید عمده چیپس"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">کلیدواژه‌های فرعی (LSI با کاما):</label>
                <input
                  type="text"
                  value={newsSecondaryKeywords}
                  onChange={(e) => setNewsSecondaryKeywords(e.target.value)}
                  placeholder="مثال: قیمت کارخانه، بنکداری تهران، پخش عمده"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">عنوان سئو گوگل (Meta Title - زیر ۶۰ کاراکتر):</label>
                <input
                  type="text"
                  value={newsMetaTitle}
                  onChange={(e) => setNewsMetaTitle(e.target.value)}
                  placeholder="عنوان ترغیب‌کننده برای گوگل..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1">توضیحات متای گوگل (Meta Description - زیر ۱۵0 کاراکتر):</label>
                <input
                  type="text"
                  value={newsMetaDescription}
                  onChange={(e) => setNewsMetaDescription(e.target.value)}
                  placeholder="توضیحات کوتاه جذب‌کننده کلیک در گوگل..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-2 text-right">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <label className="block text-[11px] font-black text-slate-400 mr-2 uppercase tracking-widest">متن کامل مقاله / خبر</label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoLinkProducts}
                  className="px-3 py-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="شناسایی کلمات کلیدی محصولات در متن و تبدیل خودکار به لینک داخلی فروشگاه"
                >
                  <Link2 size={13} className="text-teal-200" />
                  <span>⚡ لینک‌دهی خودکار به محصولات فروشگاه</span>
                </button>

                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 hidden sm:inline-block">
                  شورت‌کدها: [[product:ID|نام]], [[factory:ID|نام]], [[toc]]
                </span>
              </div>
            </div>
            <textarea 
              value={newsContent}
              onChange={(e) => setNewsContent(e.target.value)}
              placeholder="محتوای اصلی را اینجا بنویسید..."
              className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-sm focus focus transition-all font-bold h-64 placeholder leading-relaxed"
            />
          </div>

          <div className="mt-6 p-4 bg-amber-50/80 rounded-2xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">وضعیت انتشار مقاله در مجله عمومی:</p>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">جهت حفظ کیفیت، مقالات هوش مصنوعی ابتدا پیش‌نویس می‌شوند تا پس از تایید ادمین منتشر شوند.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewsPublished(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${!newsPublished ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                🟡 پیش‌نویس (نیاز به تایید)
              </button>
              <button
                type="button"
                onClick={() => setNewsPublished(true)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${newsPublished ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                🟢 تایید و انتشار عمومی
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-start">
            <button 
              onClick={handleCreateOrUpdateNews}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black transition-all shadow-material-lg hover:-translate-y-1 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              <span>{editingNewsId ? "بروزرسانی نهایی مطلب" : (newsPublished ? "ذخیره و انتشار عمومی" : "ذخیره به صورت پیش‌نویس")}</span>
            </button>
          </div>
        </div>
      )}

      {/* Article Cards Grid */}
      {articles.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <Newspaper className="mx-auto text-slate-300 mb-3" size={40} />
          <p className="text-sm font-black text-slate-700">هیچ خبری یا مقاله‌ای ثبت نشده است</p>
          <p className="text-xs text-slate-400 font-bold mt-1">جهت افزودن خبر جدید روی دکمه «ثبت دستی مقاله» یا «تولید با GapGPT» کلیک کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {articles.map((article, idx) => {
            const isApproved = article.published !== false && article.status !== 'draft';
            return (
              <div 
                key={`news-item-${article.id || idx}-${idx}`} 
                className={`bg-white rounded-[2rem] border p-6 shadow-material-md hover transition-all duration-500 group flex gap-6 ${isApproved ? 'border-slate-100' : 'border-amber-200 bg-amber-50/20'}`}
              >
                <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 shadow-inner border border-slate-50 relative">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  {!isApproved && (
                    <div className="absolute inset-0 bg-amber-950/40 backdrop-blur-xs flex items-center justify-center p-1 text-center">
                      <span className="text-[9px] font-black text-amber-200 bg-amber-900/90 px-2 py-1 rounded-md border border-amber-400/50">
                        پیش‌نویس
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-[9px] font-black uppercase tracking-tighter">
                          {article.category}
                        </span>
                        {isApproved ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 size={10} />
                            منتشرشده
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[9px] font-black flex items-center gap-1">
                            🟡 نیازمند تایید ادمین
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Calendar size={10} />
                        {article.date}
                      </p>
                    </div>
                    <h5 className="text-sm font-black text-slate-900 mb-2 line-clamp-1">{article.title}</h5>
                    <p className="text-[11px] text-slate-500 font-bold line-clamp-2 leading-relaxed">{article.summary}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {!isApproved && (
                        <button
                          type="button"
                          onClick={() => handleApproveArticle(article)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="تایید محتوا و انتشار مستقیم در سایت"
                        >
                          <CheckCircle2 size={13} />
                          <span>تایید و انتشار</span>
                        </button>
                      )}
                      <button 
                        onClick={() => handleEditNewsClick(article)}
                        className="p-2.5 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="ویرایش مطلب"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteNews(article.id, idx)}
                        className="p-2.5 bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
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
            );
          })}
        </div>
      )}

      {/* Guide Card */}
      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex gap-4 items-start shadow-material-sm">
        <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
          <Zap size={20} />
        </div>
        <div>
          <p className="text-xs font-black text-slate-900 mb-1">راهنمای هوشمند GapGPT و سئو مجله:</p>
          <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
            موتور هوش مصنوعی GapGPT به طور خودکار مقالات را با محصولات کارخانجات و تخفیفات حراج کف بازار لینک‌دهی می‌کند. این امر باعث افزایش نرخ تبدیل خریداران، جذب ترافیک ارگانیک گوگل و رونق سفارشات مستقیم می‌شود.
          </p>
        </div>
      </div>
    </div>
  );
}
