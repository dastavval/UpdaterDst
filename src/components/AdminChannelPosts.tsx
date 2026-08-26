import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Megaphone, Settings, Save, Edit2, Trash2, Pin, 
  Send, AlertCircle, CheckCircle2, X, Plus, Info, 
  Flame, Bell, ExternalLink
} from "lucide-react";
import { toPersianNum } from "../utils/persian-utils";

interface AdminChannelPostsProps {
  setSuccessMsg: (msg: string | null) => void;
  autoPostSettings: {
    new_product: boolean;
    new_discount: boolean;
    new_ad: boolean;
    new_factory: boolean;
  };
  setAutoPostSettings: React.Dispatch<React.SetStateAction<{
    new_product: boolean;
    new_discount: boolean;
    new_ad: boolean;
    new_factory: boolean;
  }>>;
}

export default function AdminChannelPosts({ 
  setSuccessMsg,
  autoPostSettings,
  setAutoPostSettings
}: AdminChannelPostsProps) {
  const [editingChannelPostId, setEditingChannelPostId] = useState<string | null>(null);
  const [channelPostTitle, setChannelPostTitle] = useState("");
  const [channelPostContent, setChannelPostContent] = useState("");
  const [channelPostCategory, setChannelPostCategory] = useState("info");
  const [channelPostActionLabel, setChannelPostActionLabel] = useState("");
  const [channelPostActionUrl, setChannelPostActionUrl] = useState("");

  // announcements state and load logic stays...

  const [announcements, setAnnouncements] = useState<any[]>([]);

  const loadAnnouncements = () => {
    const saved = localStorage.getItem("dastavval_announcements");
    if (saved) {
      try {
        setAnnouncements(JSON.parse(saved));
      } catch (e) {
        setAnnouncements([]);
      }
    } else {
      const defaultPosts = [
        {
          id: "ann-1",
          title: "📣 راه‌اندازی کانال رسمی اطلاع‌رسانی دست اول",
          content: "به کانال رسمی دست اول خوش آمدید! از این پس کلیه حراج‌های کف بازار، جشنواره‌های تخفیف خط تولید کارخانجات، شرایط اعطای نمایندگی استانی و اطلاعیه‌های مهم صنف مواد غذایی و بهداشتی را به صورت مستقیم و آنی در این کانال دریافت خواهید کرد.",
          category: "info",
          createdAt: "۱۴۰۵/۰۵/۲۸"
        },
        {
          id: "ann-2",
          title: "🔥 جشنواره تخفیف ۲۲٪ ویژه محصولات شوینده",
          content: "جشنواره استثنایی فروش مستقیم از درب کارخانه برای انواع مایع دستشویی، ظرفشویی و پودرهای لباسشویی کلید خورد. تمامی بنکداران با سطح نقره‌ای به بالا می‌توانند سفارشات خود را با تخفیف مضاعف در سبد خرید ثبت نمایند.",
          category: "festival",
          createdAt: "۱۴۰۵/۰۵/۲۷"
        }
      ];
      setAnnouncements(defaultPosts);
      localStorage.setItem("dastavval_announcements", JSON.stringify(defaultPosts));
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handlePublish = () => {
    if (!channelPostTitle.trim() || !channelPostContent.trim()) {
      return;
    }

    let currentPosts = [...announcements];

    if (editingChannelPostId) {
      currentPosts = currentPosts.map((p: any) => p.id === editingChannelPostId ? {
        ...p,
        title: channelPostTitle.trim(),
        content: channelPostContent.trim(),
        category: channelPostCategory,
        actionLabel: channelPostActionLabel.trim(),
        actionUrl: channelPostActionUrl.trim()
      } : p);
      setSuccessMsg("پست کانال با موفقیت ویرایش شد.");
    } else {
      const newPost = {
        id: "post-" + Date.now(),
        title: channelPostTitle.trim(),
        content: channelPostContent.trim(),
        category: channelPostCategory,
        actionLabel: channelPostActionLabel.trim(),
        actionUrl: channelPostActionUrl.trim(),
        createdAt: new Intl.DateTimeFormat('fa-IR').format(new Date())
      };
      currentPosts = [newPost, ...currentPosts];
      setSuccessMsg("پست جدید با موفقیت در کانال منتشر شد.");
    }

    setAnnouncements(currentPosts);
    localStorage.setItem("dastavval_announcements", JSON.stringify(currentPosts));
    window.dispatchEvent(new Event("dastavval_announcements_updated"));

    // Reset Form
    setEditingChannelPostId(null);
    setChannelPostTitle("");
    setChannelPostContent("");
    setChannelPostCategory("info");
    setChannelPostActionLabel("");
    setChannelPostActionUrl("");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDelete = (id: string) => {
    const filtered = announcements.filter(p => p.id !== id);
    setAnnouncements(filtered);
    localStorage.setItem("dastavval_announcements", JSON.stringify(filtered));
    window.dispatchEvent(new Event("dastavval_announcements_updated"));
    setSuccessMsg("پست مورد نظر از کانال حذف شد.");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleEdit = (post: any) => {
    setEditingChannelPostId(post.id);
    setChannelPostTitle(post.title);
    setChannelPostContent(post.content);
    setChannelPostCategory(post.category || "info");
    setChannelPostActionLabel(post.actionLabel || "");
    setChannelPostActionUrl(post.actionUrl || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-8 pb-20" dir="rtl">
      {/* Top Banner / Stats */}
      <div className="bg-gradient-to-l from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-right">
            <h3 className="text-xl font-black flex items-center gap-3 justify-end md:justify-start">
              مرکز کنترل کانال اطلاع‌رسانی هوشمند
              <Megaphone className="w-6 h-6 animate-bounce" />
            </h3>
            <p className="text-xs text-indigo-100 font-bold opacity-80 leading-relaxed max-w-xl">
              اطلاعیه‌های مهم، حراج‌های لحظه‌ای و اخبار کارخانه را به صورت مستقیم در اپلیکیشن و کانال عمومی منتشر کنید.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
                <span className="block text-[10px] font-black opacity-60">پست‌های منتشر شده</span>
                <span className="text-lg font-black">{toPersianNum(announcements.length)}</span>
             </div>
             <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
                <span className="block text-[10px] font-black opacity-60">بازدید تقریبی کل</span>
                <span className="text-lg font-black">{toPersianNum(1400)}k+</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden sticky top-8">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" />
                {editingChannelPostId ? "ویرایش پست موجود" : "ایجاد پست جدید در کانال"}
              </h4>
              {editingChannelPostId && (
                <button 
                  onClick={() => {
                    setEditingChannelPostId(null);
                    setChannelPostTitle("");
                    setChannelPostContent("");
                  }}
                  className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-3 py-1 rounded-lg transition-all"
                >
                  انصراف از ویرایش
                </button>
              )}
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1">عنوان جذاب پست</label>
                <input 
                  value={channelPostTitle}
                  onChange={e => setChannelPostTitle(e.target.value)}
                  placeholder="مثال: 🔥 حراج ۵۰ درصدی محصولات کیک و کلوچه"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-black text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1">دسته‌بندی محتوا</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {id: 'info', label: 'اطلاع‌رسانی', icon: <Info size={14}/>, color: 'text-blue-600 bg-blue-50'},
                    {id: 'festival', label: 'جشنواره فروش', icon: <Flame size={14}/>, color: 'text-orange-600 bg-orange-50'},
                    {id: 'urgent', label: 'فوری/مهم', icon: <Bell size={14}/>, color: 'text-rose-600 bg-rose-50'},
                    {id: 'system', label: 'سیستمی', icon: <Settings size={14}/>, color: 'text-slate-600 bg-slate-50'}
                  ].map((cat, catIdx) => (
                    <button 
                      key={`admin-ch-cat-${cat.id}-${catIdx}`}
                      onClick={() => setChannelPostCategory(cat.id)}
                      className={`flex items-center gap-2 p-3 rounded-2xl border transition-all text-[10px] font-black ${
                        channelPostCategory === cat.id 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                          : 'border-slate-100 bg-white text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1">متن کامل اطلاعیه</label>
                <textarea 
                  rows={6}
                  value={channelPostContent}
                  onChange={e => setChannelPostContent(e.target.value)}
                  placeholder="توضیحات کامل پست را اینجا بنویسید..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1">متن دکمه (اختیاری)</label>
                  <input 
                    value={channelPostActionLabel}
                    onChange={e => setChannelPostActionLabel(e.target.value)}
                    placeholder="مشاهده لیست قیمت"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 mb-1.5 mr-1">لینک دکمه (URL)</label>
                  <input 
                    value={channelPostActionUrl}
                    onChange={e => setChannelPostActionUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button 
                onClick={handlePublish}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send size={18} />
                {editingChannelPostId ? "ذخیره تغییرات پست" : "انتشار در کانال اطلاع‌رسانی"}
              </button>
            </div>
          </div>

          {/* Auto-post Settings */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-lg p-6 space-y-4">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <Settings size={18} className="text-slate-400" />
              تنظیمات انتشار خودکار (Auto-Post)
            </h4>
            <div className="space-y-2">
              {[
                {id: 'new_product', label: 'انتشار پست هنگام افزودن کالا جدید', key: 'new_product'},
                {id: 'new_discount', label: 'انتشار پست هنگام تخفیف‌دار شدن کالا', key: 'new_discount'},
                {id: 'new_ad', label: 'اطلاع‌رسانی تبلیغات بنری بنکداران', key: 'new_ad'},
                {id: 'new_factory', label: 'تغییرات قیمت درب کارخانه', key: 'new_factory'}
              ].map((opt, optIdx) => (
                <div key={`auto-post-opt-${opt.id}-${optIdx}`} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-600">{opt.label}</span>
                  <button 
                    onClick={() => setAutoPostSettings(prev => ({...prev, [opt.key]: !prev[opt.key as keyof typeof prev]}))}
                    className={`w-10 h-6 rounded-full transition-all relative ${autoPostSettings[opt.key as keyof typeof autoPostSettings] ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoPostSettings[opt.key as keyof typeof autoPostSettings] ? 'right-5' : 'right-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feed Preview */}
        <div className="lg:col-span-7 space-y-6">
           <div className="flex items-center justify-between px-2">
              <h4 className="text-sm font-black text-slate-800">پیش‌نمایش زنده فید کانال</h4>
              <span className="text-[10px] font-black text-slate-400">بر اساس آخرین تغییرات</span>
           </div>

           <div className="space-y-4">
             <AnimatePresence>
               {announcements.map((post, pIdx) => (
                 <motion.div 
                   key={`announcement-post-${post.id || pIdx}-${pIdx}`}
                   layout
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9 }}
                   className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all overflow-hidden group"
                 >
                   <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                         post.category === 'festival' ? 'bg-orange-50 text-orange-600' :
                         post.category === 'urgent' ? 'bg-rose-50 text-rose-600' :
                         post.category === 'info' ? 'bg-blue-50 text-blue-600' :
                         'bg-slate-50 text-slate-600'
                       }`}>
                         {post.category === 'festival' ? <Flame size={20}/> :
                          post.category === 'urgent' ? <AlertCircle size={20}/> :
                          post.category === 'info' ? <Info size={20}/> :
                          <Settings size={20}/>}
                       </div>
                       <div>
                         <h5 className="text-xs font-black text-slate-900 leading-tight">{post.title}</h5>
                         <span className="text-[10px] text-slate-400 font-bold">{toPersianNum(post.createdAt)}</span>
                       </div>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(post)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                   </div>

                   <div className="p-6 space-y-4">
                     <p className="text-xs text-slate-600 font-bold leading-relaxed text-justify whitespace-pre-wrap">
                       {post.content}
                     </p>
                     
                     {post.actionLabel && post.actionUrl && (
                       <a 
                         href={post.actionUrl}
                         target="_blank"
                         rel="noreferrer"
                         className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black hover:bg-indigo-600 transition-all shadow-md shadow-slate-900/10"
                       >
                         {post.actionLabel}
                         <ExternalLink size={14} />
                       </a>
                     )}
                   </div>

                   <div className="px-6 py-3 bg-slate-50 flex items-center justify-between border-t border-gray-50">
                     <div className="flex -space-x-1 space-x-reverse">
                       {[1, 2, 3].map((num, i) => (
                         <div key={`avatar-fake-${post.id || pIdx}-${num}-${i}`} className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 overflow-hidden ring-1 ring-slate-100">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.id}${i}`} />
                         </div>
                       ))}
                       <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">
                         +{toPersianNum(12)}
                       </div>
                     </div>
                     <span className="text-[9px] font-black text-slate-400 flex items-center gap-1">
                        توسط مدیریت کل
                        <CheckCircle2 size={12} className="text-emerald-500" />
                     </span>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>

             {announcements.length === 0 && (
                <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-200 text-center space-y-4">
                   <Megaphone className="w-16 h-16 text-slate-200 mx-auto opacity-20" />
                   <p className="text-xs font-black text-slate-400 italic">هیچ پستی در فید کانال منتشر نشده است.</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
