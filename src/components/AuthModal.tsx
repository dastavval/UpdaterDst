import React, { useState } from "react";
import { 
  X, Lock, Mail, User, Building, Phone, ArrowLeft, CheckCircle2, 
  ShieldAlert, Factory, Store, Megaphone, ShieldCheck, Sparkles, MapPin, 
  CreditCard, Briefcase, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "../lib/firebase-mock";
import { doc, setDoc, serverTimestamp } from "../lib/firebase-mock";
import { generateUserCode } from "../lib/id-utils";
import { addLeadFromRegistration } from "../lib/leads-store";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { 
    id?: string;
    name: string; 
    email: string; 
    role: 'customer' | 'agent' | 'marketer' | 'factory' | 'importer' | 'supplier' | 'representative' | 'leader' | 'admin' | 'user'; 
    company?: string; 
    city?: string;
    badge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
    userCode?: string;
    agencyCode?: string;
    customerCode?: string;
    factoryCode?: string;
    phone?: string;
    address?: string;
    iban?: string;
  }) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Selected Role for Registration: 'customer' | 'representative' | 'marketer' | 'factory'
  const [selectedRole, setSelectedRole] = useState<'customer' | 'representative' | 'marketer' | 'factory'>('customer');
  
  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  const [iban, setIban] = useState("");
  const [commercialLicense, setCommercialLicense] = useState("");
  const [teamSize, setTeamSize] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    let trimmedEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    // If shorthand login like "09..." is entered
    if (trimmedEmail && !trimmedEmail.includes("@") && trimmedEmail.length < 11 && !trimmedEmail.startsWith("09")) {
      // Keep some flexibility
    }

    try {
      if (authMode === 'login') {
        // Hardcoded Admin Check for development/demo purposes
        if ((trimmedEmail === '09914762406' || trimmedEmail === 'admin@dastaval.ir') && cleanPassword === '@Ali3360') {
          setSuccess("ورود به پنل مدیریت کل با موفقیت انجام شد.");
          setTimeout(() => {
            onAuthSuccess({
              name: "مدیریت کل سامانه",
              email: trimmedEmail,
              role: "admin",
              badge: "admin",
              userCode: "ADM-HQ-01"
            });
            onClose();
          }, 1000);
          return;
        }

        // Normal login flow
        let localUser: any = null;
        try {
          const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
          localUser = localUsers[trimmedEmail];
          if (!localUser) {
            // Find by email property or phone property (flexible login)
            localUser = Object.values(localUsers).find((u: any) => 
              u.email?.toLowerCase().trim() === trimmedEmail || 
              u.phone?.trim() === trimmedEmail
            );
          }
        } catch (localStorageErr) {
          console.warn("Could not read local users database:", localStorageErr);
        }

        if (localUser) {
          if (localUser.status === 'pending') {
            setError("حساب کاربری شما در انتظار تایید مدیریت است. لطفاً شکیبا باشید.");
            setLoading(false);
            return;
          }
          if (localUser.password === cleanPassword) {
            setSuccess(`ورود با نقش ${
              localUser.role === 'factory' ? "کارخانه تولیدی" :
              localUser.role === 'agent' ? "بازاریاب و نماینده" : "خریدار عمده"
            } با موفقیت انجام شد.`);
            setTimeout(() => {
              onAuthSuccess({
                name: localUser.name,
                email: localUser.email || trimmedEmail,
                role: localUser.role || "customer",
                userCode: localUser.userCode || generateUserCode(localUser.role || 'customer'),
                company: localUser.company || "مجموعه همکار",
                badge: localUser.role === 'factory' ? undefined : (localUser.badge || 'bronze'),
                agencyCode: localUser.agencyCode,
                customerCode: localUser.customerCode,
                factoryCode: localUser.factoryCode,
                city: localUser.city,
                phone: localUser.phone,
                address: localUser.address,
                iban: localUser.iban
              });
              onClose();
            }, 1000);
            return;
          } else {
            setError("رمز عبور وارد شده اشتباه است. لطفاً مجدداً بررسی کنید.");
            setLoading(false);
            return;
          }
        }

        // Fallback to Firebase Auth (or mock authentication validation)
        try {
          const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, cleanPassword);
          const firebaseUser = userCredential.user;
          
          setSuccess("ورود با موفقیت انجام شد.");
          setTimeout(() => {
            onAuthSuccess({
              name: firebaseUser.displayName || trimmedEmail.split('@')[0],
              email: firebaseUser.email!,
              role: (firebaseUser as any).role || "customer",
              company: "فروشگاه همکار",
              badge: "bronze"
            });
            onClose();
          }, 1000);
        } catch (firebaseErr: any) {
          console.warn("Firebase Auth login failed:", firebaseErr);
          setError(firebaseErr.message || "اطلاعات ورود نامعتبر است یا حساب کاربری یافت نشد.");
          setLoading(false);
          return;
        }

      } else {
        // === SIGN UP MODE ===
        if (!cleanPassword) {
          setError("لطفاً یک رمز عبور تعیین فرمایید.");
          setLoading(false);
          return;
        }

        const finalName = name.trim() || (selectedRole === 'factory' ? "مدیر کارخانه" : "همکار گرامی");
        const finalPhone = phone.trim();
        if (!finalPhone) {
          setError("لطفاً شماره همراه خود را وارد نمایید.");
          setLoading(false);
          return;
        }
        const finalCompany = company.trim() || (
          selectedRole === 'factory' ? "کارخانه تولیدی" : 
          selectedRole === 'marketer' ? "دفتر نمایندگی و بازاریابی" : "فروشگاه همکار"
        );
        const finalCity = city.trim() || "تهران";

        // Build valid unique auth identifier if email is not provided
        let userAuthKey = email.toLowerCase().trim();
        if (!userAuthKey) {
          const slug = finalPhone.replace(/\D/g, '') || finalCompany.replace(/\s+/g, '_');
          userAuthKey = `${slug}@dastavval.ir`;
        } else if (!userAuthKey.includes("@")) {
          userAuthKey = `${userAuthKey}@dastavval.ir`;
        }
        trimmedEmail = userAuthKey;

        const userRole = selectedRole;
        // Loyalty badges
        const badge = userRole === 'customer' ? 'bronze' : undefined;
        
        const uCode = generateUserCode(userRole);
        const fCode = userRole === 'factory' ? `FAC-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
        const aCode = (userRole === 'marketer' || userRole === 'representative') ? `AGN-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
        const cCode = userRole === 'customer' ? `CST-${Math.floor(1000 + Math.random() * 9000)}` : undefined;

        // Save to Local Backup FIRST to guarantee instant registration
        const newUserObj = {
          name: finalName,
          email: trimmedEmail,
          password: cleanPassword,
          company: finalCompany,
          city: finalCity,
          phone: finalPhone,
          address: address.trim(),
          category: userRole === 'factory' ? category : undefined,
          iban: iban.trim() || undefined,
          commercialLicense: commercialLicense.trim() || undefined,
          badge,
          role: userRole,
          userCode: uCode,
          customerCode: cCode,
          factoryCode: fCode,
          agencyCode: aCode,
          status: 'active',
          createdAt: new Date().toISOString()
        };

        try {
          const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
          localUsers[trimmedEmail] = newUserObj;
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
          
          if (newUserObj.status === 'active') {
            // Also set as active current user if not pending
            localStorage.setItem("dastavval_user", JSON.stringify(newUserObj));
          }

          // Automatically route new regional customer lead to regional representative
          if (userRole === 'customer') {
            addLeadFromRegistration(newUserObj);
          }
        } catch (localStorageErr) {
          console.warn("Could not write to local registry backup:", localStorageErr);
        }

        // Try Firebase Auth in background
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, cleanPassword);
          const user = userCredential.user;

          await updateProfile(user, { displayName: finalName });

          const collectionName = userRole === 'factory' ? "suppliers" : ((userRole === 'marketer' || userRole === 'representative') ? "representatives" : "crm_customers");
          await setDoc(doc(db, collectionName, user.uid), {
            ...newUserObj,
            status: 'active',
            createdAt: serverTimestamp()
          });
        } catch (firebaseErr: any) {
          console.warn("Firebase Auth signup background failed, saved locally:", firebaseErr);
        }

        const roleLabels: Record<string, string> = {
          marketer: "بازاریاب و ویزیتور (سطح ۱)",
          customer: "خریدار عمده و سوپرمارکت (سطح ۲)",
          representative: "نماینده استانی و عاملیت انحصاری (سطح ۳)",
          leader: "لیدر و مدیر شبکه توزیع (سطح ۴)",
          factory: "کارخانه و واحد تولیدی (سطح ۵)",
          importer: "واردکننده و تامین‌کننده ارزی (سطح ۶)"
        };

        if (newUserObj.status === 'pending') {
          setSuccess(`ثبت‌نام شما با نقش «${roleLabels[selectedRole] || selectedRole}» انجام شد. حساب شما پس از تایید مدیریت فعال خواهد شد.`);
          setTimeout(() => {
            onClose();
          }, 3000);
        } else {
          setSuccess(`ثبت‌نام شما با نقش «${roleLabels[selectedRole] || selectedRole}» با موفقیت انجام شد! ورود به پنل...`);
          setTimeout(() => {
            onAuthSuccess(newUserObj as any);
            onClose();
          }, 1200);
        }
        return;
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError("خطایی در احراز هویت رخ داد. لطفاً مجدداً تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-white/60 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header - Clean White Aesthetic */}
        <div className="bg-white p-5 sm:p-6 text-slate-900 text-right relative shrink-0 border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer z-20"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-200/80 text-2xl shrink-0 text-emerald-700">
              {authMode === 'login' ? '🔐' : (
                selectedRole === 'factory' ? '🏭' :
                selectedRole === 'representative' ? '🏢' :
                selectedRole === 'marketer' ? '📢' : '🛒'
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-black mb-1">
                <span>انتخاب نقش حرفه‌ای و ثبت‌نام آنلاین</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {authMode === 'login' ? "ورود به حساب کاربری" : "عضویت و ثبت‌نام آنلاین نقش‌ها"}
              </h3>
            </div>
          </div>
          
          <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
            {authMode === 'login' 
              ? "برای دسترسی به پنل اختصاصی نقش خود (مشتری، نماینده، بازاریاب، کارخانه) وارد شوید."
              : "لطفاً دقیقاً نقش خود را انتخاب کنید تا پنل اختصاصی مربوطه برای شما فعال گردد."
            }
          </p>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {error && (
            <div className="bg-rose-50 text-rose-700 p-3.5 rounded-2xl text-xs font-black flex items-center gap-2.5 border border-rose-200">
              <ShieldAlert size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-black flex items-center gap-2.5 border border-emerald-200">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 animate-bounce" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* --- SIGNUP MODE: 6-ROLE SELECTOR CARDS --- */}
            {authMode === 'signup' && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-800 block">
                  یکی از نقش‌های زیر را انتخاب کنید و فرم ثبت‌نام را تکمیل فرمایید:
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  
                  {/* Role 1: Customer */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('customer')}
                    className={`p-3.5 rounded-2xl text-right border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      selectedRole === 'customer'
                        ? "bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-base">
                        🛒
                      </div>
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">نقش ۱</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">خریدار عمده و سوپرمارکت</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                        خرید مستقیم با قیمت مصوب
                      </p>
                    </div>
                  </button>

                  {/* Role 2: Representative */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('representative')}
                    className={`p-3.5 rounded-2xl text-right border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      selectedRole === 'representative'
                        ? "bg-blue-50/90 border-blue-600 ring-2 ring-blue-600/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center text-base">
                        🏢
                      </div>
                      <span className="text-[9px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">نقش ۲</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">نماینده استانی و عاملیت</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                        سهمیه انحصاری استان و پالتی
                      </p>
                    </div>
                  </button>

                  {/* Role 3: Marketer */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('marketer')}
                    className={`p-3.5 rounded-2xl text-right border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      selectedRole === 'marketer'
                        ? "bg-amber-50/90 border-amber-600 ring-2 ring-amber-600/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-base">
                        📢
                      </div>
                      <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">نقش ۳</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">بازاریاب و ویزیتور</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                        کسب پورسانت از لینک اختصاصی
                      </p>
                    </div>
                  </button>

                  {/* Role 4: Factory */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('factory')}
                    className={`p-3.5 rounded-2xl text-right border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      selectedRole === 'factory'
                        ? "bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center text-base">
                        🏭
                      </div>
                      <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md">نقش ۴</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">کارخانه و تولیدکننده</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                        ثبت خط تولید و مدیریت فروش
                      </p>
                    </div>
                  </button>

                </div>

                {/* Role Confirmation Banner */}
                <div className={`p-2.5 rounded-2xl border text-xs font-black flex items-center gap-2 ${
                  selectedRole === 'factory' 
                    ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                    : selectedRole === 'representative'
                    ? "bg-blue-50 text-blue-900 border-blue-200"
                    : selectedRole === 'marketer'
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-emerald-50 text-emerald-900 border-emerald-200"
                }`}>
                  <Sparkles size={14} className="shrink-0" />
                  <span>
                    {selectedRole === 'factory' && "نقش انتخابی: کارخانه و تولیدکننده کالا (دسترسی به پنل ثبت کالا، پیگیری سفارشات عمده خط تولید و تنظیمات فروش)"}
                    {selectedRole === 'representative' && "نقش انتخابی: عاملیت انحصاری و نمایندگی استانی (دسترسی به گواهی نمایندگی انحصاری، نظارت بر سفارشات استان و سهمیه)"}
                    {selectedRole === 'marketer' && "نقش انتخابی: بازاریاب و نماینده فروش (دسترسی به لینک اختصاصی بازاریابی، محاسبه پورسانت و تسویه حساب شبا)"}
                    {selectedRole === 'customer' && "نقش انتخابی: خریدار عمده و سوپرمارکت (دسترسی به سبد خرید، تخفیفات پلکانی وفاداری، صدور فاکتور رسمی)"}
                  </span>
                </div>

                {/* ROLE SPECIFIC FIELDS */}
                {selectedRole === 'factory' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">نام کارخانه و برند تولیدی:</label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="مثال: صنایع غذایی مزمز یا لبنیات میهن"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-indigo-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">نام مدیر یا مسئول فروش کارخانه:</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: مهندس علیزاده"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-indigo-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">شهر و شهرک صنعتی محل کارخانه:</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="مثال: تهران - شهرک صنعتی شمس‌آباد"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-indigo-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">رسته اصلی تولیدات:</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-indigo-600 text-xs font-bold text-slate-800 text-right cursor-pointer"
                      >
                        <option value="تنقلات و چیپس">تنقلات، چیپس و پفک</option>
                        <option value="شکلات و بیسکویت">کیک، کلوچه و شکلات</option>
                        <option value="روغن و چاشنی">روغن‌های خوراکی و سس‌ها</option>
                        <option value="کنسرویجات و رب">کنسرویجات، رب و کمپوت</option>
                        <option value="نوشیدنی و آبمیوه">آبمیوه و نوشیدنی‌ها</option>
                        <option value="حبوبات و غلات">برنج، حبوبات و غلات</option>
                        <option value="شوینده و بهداشتی">شوینده و بهداشتی</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedRole === 'representative' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">نام مجموعه پخش / عاملیت:</label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="مثال: پخش انحصاری استانی توس"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-blue-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">نام مدیر عاملیت استانی:</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: مهندس کاظمی"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-blue-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">استان هدف جهت اخذ عاملیت انحصاری:</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="مثال: مشهد - استان خراسان رضوی"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-blue-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedRole === 'marketer' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">نام و نام خانوادگی بازاریاب:</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: علیرضا محمدی"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">استان و شهر تحت پوشش بازاریابی:</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="مثال: اصفهان و حومه"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">شماره شبا بانکی جهت واریز پورسانت (اختیاری):</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          value={iban}
                          onChange={(e) => setIban(e.target.value)}
                          placeholder="IR..."
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-amber-600 text-xs font-mono font-bold text-slate-800 text-left"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedRole === 'customer' && (
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">نام فروشگاه، سوپرمارکت یا مجموعه خریدار:</label>
                      <div className="relative">
                        <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="مثال: هایپرمارکت مهر البرز یا سوپرمارکت صدف"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">نام و نام خانوادگی صاحب فروشگاه:</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: حاج رضا حسینی"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-black text-slate-700 block">شهر محل تحویل سفارش:</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="مثال: کرج - عظیمیه"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-bold text-slate-800 text-right"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Field: Phone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">شماره همراه (نام کاربری ورود):</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (!email) setEmail(e.target.value);
                      }}
                      placeholder="09123456789"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 text-xs font-mono font-bold text-slate-800 text-left"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* --- LOGIN MODE FIELDS --- */}
            {authMode === 'login' && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 block">
                    شماره همراه، نام کاربری یا ایمیل:
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="مثال: 09123456789"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 transition-all text-xs font-mono font-bold text-slate-800 text-left"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-700">رمز عبور:</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:border-emerald-600 transition-all text-xs font-mono font-bold text-slate-800 text-left"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md shadow-emerald-600/20 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>
                {authMode === 'login' ? "ورود به پرتال اختصاصی" : "تکمیل ثبت‌نام و ورود به پنل"}
              </span>
              <ArrowLeft size={16} />
            </button>

            <div className="text-center pt-6">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">یا</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setError(null);
                  setSuccess(null);
                }}
                className="group w-full py-3.5 px-4 rounded-2xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/30 transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-emerald-600/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 relative py-1">
              <span className="text-[10px] sm:text-xs font-bold text-slate-500">
                {authMode === 'login' ? "هنوز عضو نشده‌اید؟" : "قبلاً ثبت‌نام کرده‌اید؟"}
              </span>
              <span className="text-xs font-black text-emerald-600 group-hover:text-emerald-500 transition-colors">
                {authMode === 'login' 
                  ? "ثبت‌نام و عضویت رایگان" 
                  : "ورود به حساب کاربری"}
              </span>
              <ChevronRight size={14} className="text-emerald-400 group-hover:translate-x-[-4px] transition-all" />
            </div>
          </button>
              
              <p className="mt-4 text-[10px] text-slate-400 font-medium leading-relaxed">
                با ورود یا ثبت‌نام در سامانه دست اول، شما تمامی <span className="text-slate-600 font-bold underline cursor-pointer">قوانین و مقررات</span> فعالیت در بازار B2B را می‌پذیرید.
              </p>
            </div>

          </form>
        </div>
      </motion.div>
    </div>
  );
}
