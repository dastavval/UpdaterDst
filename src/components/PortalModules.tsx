import React, { useState } from "react";
import { 
  User, ShieldCheck, Key, MapPin, Plus, Trash2, 
  Send, HelpCircle, Bell, MessageSquare, AlertCircle, 
  Building2, Check, Clock, CheckCircle2, RefreshCw
} from "lucide-react";

interface ProfileManagementProps {
  user: any;
  onUpdateUser?: (updatedUser: any) => void;
  language: string;
  b2bConfig?: any;
  onUpdateB2bConfig?: (updatedConfig: any) => void;
}

// 1. Profile, Address & Password Management Module
export function ProfileManagement({ user, onUpdateUser, language, b2bConfig, onUpdateB2bConfig }: ProfileManagementProps) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [company, setCompany] = useState(user?.company || "");
  const [nationalId, setNationalId] = useState("");

  // Factory profile management states
  const [selectedFacId, setSelectedFacId] = useState<string>("");
  const [facName, setFacName] = useState("");
  const [facCategory, setFacCategory] = useState("");
  const [facCity, setFacCity] = useState("");
  const [facLocation, setFacLocation] = useState("");
  const [facProvince, setFacProvince] = useState("");
  const [facYear, setFacYear] = useState<number>(1380);
  const [facLogo, setFacLogo] = useState("");
  const [facCover, setFacCover] = useState("");
  const [facDescription, setFacDescription] = useState("");
  const [facGallery, setFacGallery] = useState(""); // Comma separated list of URLs
  const [facSuccess, setFacSuccess] = useState(false);

  const factoriesList = b2bConfig?.factories || [];
  
  React.useEffect(() => {
    if (factoriesList.length > 0) {
      // Try to find the factory matching user's company or brand
      const matched = factoriesList.find((f: any) => 
        f.id === user?.factoryId ||
        f.name === user?.company || 
        f.name === user?.brand || 
        f.name?.includes(user?.company || "___") || 
        f.name?.includes(user?.brand || "___")
      ) || factoriesList[0];
      
      if (matched) {
        setSelectedFacId(matched.id);
        setFacName(matched.name || "");
        setFacCategory(matched.category || "");
        setFacCity(matched.city || "");
        setFacLocation(matched.location || "");
        setFacProvince(matched.province || "");
        setFacYear(matched.establishedYear || 1380);
        setFacLogo(matched.logoUrl || "");
        setFacCover(matched.coverUrl || "");
        setFacDescription(matched.description || matched.biography || "");
        setFacGallery(Array.isArray(matched.gallery) ? matched.gallery.join(", ") : (matched.gallery || ""));
      }
    }
  }, [b2bConfig, user]);

  const handleSelectFactoryChange = (id: string) => {
    const matched = factoriesList.find((f: any) => f.id === id);
    if (matched) {
      setSelectedFacId(matched.id);
      setFacName(matched.name || "");
      setFacCategory(matched.category || "");
      setFacCity(matched.city || "");
      setFacLocation(matched.location || "");
      setFacProvince(matched.province || "");
      setFacYear(matched.establishedYear || 1380);
      setFacLogo(matched.logoUrl || "");
      setFacCover(matched.coverUrl || "");
      setFacDescription(matched.description || matched.biography || "");
      setFacGallery(Array.isArray(matched.gallery) ? matched.gallery.join(", ") : (matched.gallery || ""));
    }
  };

  const handleSaveFactoryProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateB2bConfig || !selectedFacId) return;

    const galleryArray = facGallery
      ? facGallery.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    const updatedFactories = factoriesList.map((f: any) => {
      if (f.id === selectedFacId) {
        return {
          ...f,
          name: facName,
          category: facCategory,
          city: facCity,
          location: facLocation,
          province: facProvince,
          establishedYear: Number(facYear),
          logoUrl: facLogo,
          coverUrl: facCover,
          description: facDescription,
          biography: facDescription,
          gallery: galleryArray
        };
      }
      return f;
    });

    onUpdateB2bConfig({
      ...b2bConfig,
      factories: updatedFactories
    });

    setFacSuccess(true);
    setTimeout(() => setFacSuccess(false), 3000);
  };
  
  // Warehouse Addresses list state
  const [addresses, setAddresses] = useState<Array<{ id: string; title: string; address: string; code: string }>>([]);
  
  const [newTitle, setNewTitle] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newCode, setNewCode] = useState("");
  const [showAddAddr, setShowAddAddr] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passStatus, setPassStatus] = useState<"idle" | "success" | "error">("idle");
  const [passErrorMsg, setPassErrorMsg] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(true);
    if (onUpdateUser) {
      onUpdateUser({ ...user, name, phone, company });
    }
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAddress) return;
    const newAddr = {
      id: Date.now().toString(),
      title: newTitle,
      address: newAddress,
      code: newCode || "---"
    };
    setAddresses([...addresses, newAddr]);
    setNewTitle("");
    setNewAddress("");
    setNewCode("");
    setShowAddAddr(false);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg("");
    setPassStatus("idle");

    if (newPassword.length < 6) {
      setPassStatus("error");
      setPassErrorMsg("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassStatus("error");
      setPassErrorMsg("تکرار رمز عبور جدید همخوانی ندارد.");
      return;
    }

    setPassStatus("success");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPassStatus("idle"), 4000);
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      
      {/* 1. Edit Profile Form */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
          <User className="text-emerald-600" size={18} />
          ویرایش مشخصات شخصی و بنکداری
        </h3>

        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-black">نام و نام خانوادگی:</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-black">شماره تلفن همراه:</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-black">نام فروشگاه / بنکداری:</label>
            <input 
              type="text" 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-500 font-black">شناسه ملی / کد ملی خریدار:</label>
            <input 
              type="text" 
              value={nationalId}
              disabled
              className="w-full bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="md:col-span-2 pt-2 flex items-center justify-between">
            {profileSuccess && (
              <span className="text-[10px] text-emerald-600 font-black">✓ اطلاعات کاربری شما به صورت آنی بروزرسانی شد.</span>
            )}
            <button 
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer mr-auto"
            >
              ذخیره تغییرات مشخصات
            </button>
          </div>
        </form>
      </div>

      {/* 2. Warehouse Addresses management */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <MapPin className="text-emerald-600" size={18} />
            مدیریت آدرس انبارها و تخلیه کالا
          </h3>
          <button 
            onClick={() => setShowAddAddr(!showAddAddr)}
            className="text-[10px] bg-emerald-50 text-emerald-600 font-black px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 hover transition-all cursor-pointer"
          >
            <Plus size={12} />
            افزودن انبار جدید
          </button>
        </div>

        {showAddAddr && (
          <form onSubmit={handleAddAddress} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">عنوان انبار / شعبه:</label>
                <input 
                  type="text"
                  placeholder="مثال: انبار غله خراسان"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">کد پستی ده رقمی:</label>
                <input 
                  type="text"
                  placeholder="۱۲۳۴۵۶۷۸۹۰"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold font-mono text-center"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">آدرس دقیق جهت رهگیری جاده‌ای باربری:</label>
                <textarea 
                  placeholder="خیابان، کوچه، پلاک، نام انبار تجاری..."
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 h-20"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                type="button"
                onClick={() => setShowAddAddr(false)}
                className="px-4 py-2 text-slate-500 text-[10px] font-black hover rounded-lg cursor-pointer"
              >
                انصراف
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover text-white text-[10px] font-black rounded-lg cursor-pointer"
              >
                ثبت انبار
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {addresses.map((addr, aIdx) => (
            <div key={`portal-addr-${addr.id || aIdx}-${aIdx}`} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-start gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-black text-slate-900">{addr.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-bold">{addr.address}</p>
                <span className="text-[10px] text-slate-400 font-mono block">کد پستی: {addr.code}</span>
              </div>
              <button 
                onClick={() => handleDeleteAddress(addr.id)}
                className="p-1.5 hover text-slate-400 hover rounded-lg transition-colors cursor-pointer"
                title="حذف آدرس"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Change Password */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
          <Key className="text-emerald-600" size={18} />
          تغییر رمز عبور حساب کاربری
        </h3>

        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 max-w-md">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 font-bold block">رمز عبور فعلی:</label>
            <input 
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-center"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold block">رمز عبور جدید:</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-center"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold block">تکرار رمز عبور جدید:</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-center"
                required
              />
            </div>
          </div>

          {passStatus === 'success' && (
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black text-center border border-emerald-100">
              ✓ رمز عبور جدید شما با موفقیت ثبت شد. در مراجعات بعدی با این رمز وارد شوید.
            </div>
          )}
          {passStatus === 'error' && (
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black text-center border border-rose-100">
              ⚠ {passErrorMsg}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-2.5 bg-white hover text-white rounded-xl text-xs font-black cursor-pointer text-center"
          >
            بروزرسانی رمز ورود نهایی
          </button>
        </form>
      </div>

      {/* 4. Edit Factory Profile (Only for Admins or Seller/Factory role users) */}
      {b2bConfig && factoriesList.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Building2 className="text-indigo-600" size={18} />
              مدیریت شناسنامه، تصاویر و بیوگرافی کارخانه تولیدی
            </h3>
            {/* If admin or multiple factories, let them select which factory to edit */}
            {factoriesList.length > 1 && (
              <select
                value={selectedFacId}
                onChange={(e) => handleSelectFactoryChange(e.target.value)}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
              >
                {factoriesList.map((f: any, fIdx: number) => (
                  <option key={`portal-fac-opt-${f.id || fIdx}-${fIdx}`} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
          </div>

          <form onSubmit={handleSaveFactoryProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">نام کارخانه / برند:</label>
                <input 
                  type="text" 
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">دسته‌بندی صنعت:</label>
                <input 
                  type="text" 
                  value={facCategory}
                  onChange={(e) => setFacCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">استان:</label>
                <input 
                  type="text" 
                  value={facProvince}
                  onChange={(e) => setFacProvince(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">شهرستان:</label>
                <input 
                  type="text" 
                  value={facCity}
                  onChange={(e) => setFacCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">سال تأسیس:</label>
                <input 
                  type="number" 
                  value={facYear}
                  onChange={(e) => setFacYear(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-850 text-center font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">لوگوی کارخانه (URL تصویر):</label>
                <input 
                  type="text" 
                  value={facLogo}
                  onChange={(e) => setFacLogo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-mono text-slate-800"
                  dir="ltr"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">تصویر بنر/کاور کارخانه (URL تصویر):</label>
                <input 
                  type="text" 
                  value={facCover}
                  onChange={(e) => setFacCover(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-mono text-slate-800"
                  dir="ltr"
                  required
                />
              </div>

              <div className="md:col-span-1 space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">آدرس دقیق کارخانه:</label>
                <input 
                  type="text" 
                  value={facLocation}
                  onChange={(e) => setFacLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">گالری تصاویر کارخانه (لینک‌ها را با کاما جدا کنید):</label>
                <textarea 
                  value={facGallery}
                  onChange={(e) => setFacGallery(e.target.value)}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-mono text-slate-800 h-16"
                  dir="ltr"
                />
              </div>

              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[11px] text-slate-500 font-black">بیوگرافی و معرفی کامل کارخانه:</label>
                <textarea 
                  value={facDescription}
                  onChange={(e) => setFacDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-800 h-28 leading-relaxed"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {facSuccess && (
                <span className="text-[10px] text-emerald-600 font-black animate-pulse">✓ مشخصات و تصاویر کارخانه با موفقیت ذخیره و بروزرسانی شد.</span>
              )}
              <button 
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md cursor-pointer mr-auto"
              >
                ذخیره تغییرات کارخانه
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

// 2. Support Ticket System Module
export function SupportTicketSystem() {
  const [tickets, setTickets] = useState<Array<{ id: string; title: string; category: string; status: "waiting" | "investigating" | "solved"; date: string; lastMessage: string; messages: Array<{ sender: "user" | "agent"; text: string; time: string }> }>>([]);

  const [activeTicket, setActiveTicket] = useState<any | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Commercial Contracts");
  const [newMsg, setNewMsg] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMsg) return;

    const ticketId = `TCK-${Math.floor(100 + Math.random() * 900)}`;
    const newTck = {
      id: ticketId,
      title: newTitle,
      category: newCategory,
      status: "waiting" as const,
      date: new Date().toLocaleDateString("fa-IR"),
      lastMessage: newMsg,
      messages: [
        { sender: "user" as const, text: newMsg, time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' }) }
      ]
    };

    setTickets([newTck, ...tickets]);
    setNewTitle("");
    setNewMsg("");
    setShowCreate(false);
    setActiveTicket(newTck);

    // Simulate Agent Auto-Reply after 3 seconds
    setTimeout(() => {
      const reply = {
        sender: "agent" as const,
        text: "تیکت شما ثبت گردید و جهت بررسی سریع به دپارتمان تخصصی مربوطه ارجاع شد. حداکثر تا ۲ ساعت کاری کارشناسان ما پاسخ خواهند داد.",
        time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })
      };
      
      setTickets(prevTickets => 
        prevTickets.map(t => {
          if (t.id === ticketId) {
            return {
              ...t,
              status: "investigating",
              lastMessage: reply.text,
              messages: [...t.messages, reply]
            };
          }
          return t;
        })
      );
    }, 3000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText || !activeTicket) return;

    const userMsg = {
      sender: "user" as const,
      text: replyText,
      time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })
    };

    const updatedTck = {
      ...activeTicket,
      lastMessage: replyText,
      messages: [...activeTicket.messages, userMsg]
    };

    setTickets(tickets.map(t => t.id === activeTicket.id ? updatedTck : t));
    setActiveTicket(updatedTck);
    setReplyText("");

    // Simulate agent typing feedback
    setTimeout(() => {
      const agentMsg = {
        sender: "agent" as const,
        text: `سپاس از ارسال جزئیات. پاسخ تیکت شما توسط کارشناس پشتیبانی بخش ${
          activeTicket.category === 'Financial' ? 'حسابداری مالی کارخانه' :
          activeTicket.category === 'Delivery & Logistics' ? 'واحد لجستیک جاده‌ای' : 'ارزیابی کیفیت بهداشتی سیب سلامت'
        } در حال بررسی و پیگیری است.`,
        time: new Date().toLocaleTimeString("fa-IR", { hour: '2-digit', minute: '2-digit' })
      };

      const finalTck = {
        ...updatedTck,
        lastMessage: agentMsg.text,
        messages: [...updatedTck.messages, agentMsg]
      };

      setTickets(prev => prev.map(t => t.id === activeTicket.id ? finalTck : t));
      if (activeTicket.id === finalTck.id) {
        setActiveTicket(finalTck);
      }
    }, 2500);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting': return <span className="bg-amber-50 text-amber-700 border border-amber-200/50 px-2.5 py-1 rounded-full text-[9px] font-black">در انتظار بررسی</span>;
      case 'investigating': return <span className="bg-blue-50 text-blue-700 border border-blue-200/50 px-2.5 py-1 rounded-full text-[9px] font-black animate-pulse">در حال پیگیری پشتیبانی</span>;
      default: return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-1 rounded-full text-[9px] font-black">حل شده</span>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Financial': return 'مالی و چک‌های صیاد';
      case 'Delivery & Logistics': return 'لجستیک و باربری جاده‌ای';
      case 'Product Quality': return 'کنترل کیفیت و مرجوعی بار';
      default: return 'قرارداد تجاری و نمایندگی';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right" dir="rtl">
      
      {/* Sidebar: Tickets list */}
      <div className="lg:col-span-1 bg-white border border-slate-100 p-5 rounded-3xl space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
            <MessageSquare className="text-emerald-600" size={16} />
            تیکت‌های پشتیبانی
          </h3>
          <button 
            onClick={() => { setShowCreate(!showCreate); setActiveTicket(null); }}
            className="text-[10px] bg-emerald-600 text-white font-black px-2.5 py-1.5 rounded-lg hover transition-all cursor-pointer"
          >
            ثبت تیکت جدید
          </button>
        </div>

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          {tickets.map((tck, tIdx) => {
            const isActive = activeTicket?.id === tck.id;
            return (
              <div 
                key={`portal-ticket-${tck.id || tIdx}-${tIdx}`}
                onClick={() => { setActiveTicket(tck); setShowCreate(false); }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-right space-y-2 ${
                  isActive 
                    ? 'bg-emerald-50/50 border-emerald-200' 
                    : 'bg-slate-50 border-slate-100 hover'
                }`}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] text-emerald-600 font-mono font-black">{tck.id}</span>
                  {getStatusLabel(tck.status)}
                </div>
                <h4 className="text-xs font-black text-slate-800 truncate">{tck.title}</h4>
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                  <span>{getCategoryLabel(tck.category)}</span>
                  <span>{tck.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Active Chat or Creation Form */}
      <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-3xl min-h-[350px] flex flex-col justify-between">
        
        {showCreate ? (
          <form onSubmit={handleCreateTicket} className="space-y-4 flex-1">
            <h3 className="font-black text-sm text-slate-900 pb-3 border-b border-slate-100">ثبت تیکت پشتیبانی تجاری جدید</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">موضوع تیکت:</label>
                <input 
                  type="text" 
                  placeholder="موضوع خلاصه تیکت شما..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">دپارتمان مربوطه:</label>
                <select 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black text-slate-700"
                >
                  <option value="Financial">بخش حسابداری و امور چک‌های صیاد</option>
                  <option value="Delivery & Logistics">لجستیک جاده‌ای و ناوگان ترابری</option>
                  <option value="Product Quality">کنترل بهداشتی کالا و آزمایشگاه سیب سلامت</option>
                  <option value="Commercial Contracts">قراردادهای تجاری نمایندگی توزیع</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold">شرح مشکل یا مغایرت فاکتور:</label>
              <textarea 
                placeholder="توضیحات کامل شامل شناسه سفارش، تعداد کارتن‌های مغایر، یا جزئیات چک..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold h-32"
                required
              />
            </div>

            <button 
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
            >
              <Send size={14} />
              ثبت نهایی و ابلاغ به کارشناس پشتیبانی
            </button>
          </form>
        ) : activeTicket ? (
          <div className="flex flex-col h-[400px] justify-between">
            {/* Chat Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-xs font-black text-slate-900">{activeTicket.title}</h4>
                <span className="text-[9px] text-slate-400 font-bold">{getCategoryLabel(activeTicket.category)}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono font-bold">شناسه: {activeTicket.id}</span>
            </div>

            {/* Chat Message Lists */}
            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              {activeTicket.messages.map((msg: any, idx: number) => {
                const isUser = msg.sender === 'user';
                return (
                  <div key={`portal-chat-msg-${msg.text?.slice(0, 5)}-${msg.time || ''}-${idx}`} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs space-y-1 text-right ${
                      isUser 
                        ? 'bg-slate-100 text-slate-800 rounded-tr-none' 
                        : 'bg-emerald-600 text-white rounded-tl-none shadow-md shadow-emerald-600/10'
                    }`}>
                      <p className="font-bold leading-relaxed">{msg.text}</p>
                      <span className={`text-[8px] font-bold block ${isUser ? 'text-slate-400 text-left' : 'text-emerald-200 text-left'}`}>{msg.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Reply Form */}
            <form onSubmit={handleSendReply} className="flex gap-2 border-t border-slate-100 pt-3">
              <input 
                type="text"
                placeholder="پاسخ خود را اینجا بنویسید..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold"
                required
              />
              <button 
                type="submit"
                className="bg-emerald-600 hover text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10 shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center border border-slate-100">
              <HelpCircle size={32} />
            </div>
            <div className="space-y-1">
              <h4 className="font-black text-sm text-slate-800">تیکت جهت گفتگو انتخاب نشده است</h4>
              <p className="text-[10px] text-slate-400 font-bold max-w-xs mx-auto leading-relaxed">یکی از تیکت‌های پشتیبانی را از منوی سمت راست انتخاب کنید و یا دکمه «ثبت تیکت جدید» را کلیک نمایید.</p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

// 3. System Notifications Module
export function SystemNotifications() {
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; desc: string; date: string; read: boolean; badge: "financial" | "system" | "delivery" }>>([]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'financial': return <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg"><Bell size={14} /></span>;
      case 'delivery': return <span className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg"><Bell size={14} /></span>;
      default: return <span className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg"><Bell size={14} /></span>;
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6 text-right" dir="rtl">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
          <Bell className="text-emerald-600" size={18} />
          مرکز اعلان‌ها و مانیتورینگ سیستم
        </h3>
        <button 
          onClick={handleMarkAllRead}
          className="text-[10px] text-slate-400 hover font-black transition-colors cursor-pointer"
        >
          علامت‌گذاری همه به عنوان خوانده شده
        </button>
      </div>

      <div className="space-y-4 max-w-4xl">
        {notifications.map((ntf, nIdx) => (
          <div 
            key={`portal-ntf-${ntf.id || nIdx}-${nIdx}`}
            className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
              ntf.read 
                ? 'bg-slate-50 border-slate-100' 
                : 'bg-emerald-50/20 border-emerald-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {getBadgeIcon(ntf.badge)}
            </div>
            <div className="flex-1 space-y-1 text-right">
              <div className="flex justify-between items-center gap-3">
                <h4 className={`text-xs font-black ${ntf.read ? 'text-slate-700' : 'text-slate-900'}`}>
                  {ntf.title}
                </h4>
                <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap">{ntf.date}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-bold">{ntf.desc}</p>
            </div>
            {!ntf.read && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 self-center" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
