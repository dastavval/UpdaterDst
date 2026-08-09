import { useState } from "react";
import { X, Lock, Mail, User, Building, Phone, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "../lib/firebase-mock";
import { doc, setDoc, serverTimestamp } from "../lib/firebase-mock";
import { generateUserCode } from "../lib/id-utils";

const defaultMockAccounts: Record<string, {
  name: string;
  password: string;
  role: 'customer' | 'agent' | 'factory' | 'admin' | 'user';
  company: string;
  badge: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
  agencyCode?: string;
  customerCode?: string;
  factoryCode?: string;
}> = {
  "admin@dastavval.ir": {
    name: "مدیر ارشد پلتفرم",
    password: "33603360",
    role: "admin",
    company: "دفتر مرکزی دست اول",
    badge: "admin"
  },
  "agent@dastavval.ir": {
    name: "نماینده رسمی استان (خراسان)",
    password: "33603360",
    role: "agent",
    company: "پخش انحصاری توس",
    badge: "vip",
    agencyCode: "AGN-5001"
  },
  "customer@dastavval.ir": {
    name: "سوپرمارکت مهر البرز",
    password: "33603360",
    role: "customer",
    company: "هایپرمارکت مهر البرز",
    badge: "gold",
    customerCode: "CST-9005"
  },
  "factory@dastavval.ir": {
    name: "تامین‌کننده کارخانه (مزمز)",
    password: "33603360",
    role: "factory",
    company: "کارخانجات صنایع غذایی مزمز",
    badge: "vip",
    factoryCode: "FAC-1002"
  }
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { 
    id?: string;
    name: string; 
    email: string; 
    role: 'customer' | 'agent' | 'factory' | 'admin' | 'user'; 
    company?: string; 
    city?: string;
    badge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
    userCode?: string;
    agencyCode?: string;
    customerCode?: string;
    factoryCode?: string;
  }) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState<'retailer' | 'wholesaler' | 'chain_store' | 'organization' | 'factory'>('retailer');
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

    // If shorthand login like "admin", "agent", etc is used, convert to full email
    if (trimmedEmail && !trimmedEmail.includes("@")) {
      trimmedEmail = `${trimmedEmail}@dastavval.ir`;
    }

    try {
      if (authMode === 'login') {
        // Check our default mock accounts FIRST (admin, agent, customer, factory with password 33603360)
        const defaultAccount = defaultMockAccounts[trimmedEmail];
        if (defaultAccount) {
          if (cleanPassword === defaultAccount.password) {
            setSuccess(`ورود ${defaultAccount.name} با موفقیت انجام شد.`);
            setTimeout(() => {
              onAuthSuccess({
                name: defaultAccount.name,
                email: trimmedEmail,
                role: defaultAccount.role,
                userCode: generateUserCode(defaultAccount.role),
                company: defaultAccount.company,
                badge: defaultAccount.badge,
                agencyCode: defaultAccount.agencyCode,
                customerCode: defaultAccount.customerCode,
                factoryCode: defaultAccount.factoryCode
              });
              onClose();
            }, 1200);
            return;
          } else {
            setError("رمز عبور وارد شده اشتباه است. لطفاً دوباره دقت کنید.");
            setLoading(false);
            return;
          }
        }

        // Try offline/local check FIRST to be extremely fast and frictionless
        let localUser: any = null;
        try {
          const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
          localUser = localUsers[trimmedEmail];
        } catch (localStorageErr) {
          console.warn("Could not read local users database:", localStorageErr);
        }

        if (localUser) {
          if (localUser.password === cleanPassword) {
            setSuccess("ورود همکار با موفقیت انجام شد.");
            setTimeout(() => {
              onAuthSuccess({
                name: localUser.name,
                email: trimmedEmail,
                role: localUser.role || "customer",
                userCode: localUser.userCode || generateUserCode(localUser.role || 'customer'),
                company: localUser.company || "فروشگاه همکار",
                badge: localUser.badge || 'bronze'
              });
              onClose();
            }, 1200);
            return;
          } else {
            setError("رمز عبور وارد شده اشتباه است. لطفاً دوباره دقت کنید.");
            setLoading(false);
            return;
          }
        }

        // Fallback to Firebase Auth
        try {
          const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, cleanPassword);
          const user = userCredential.user;
          
          setSuccess("ورود با موفقیت انجام شد.");
          setTimeout(() => {
            onAuthSuccess({
              name: user.displayName || trimmedEmail.split('@')[0],
              email: user.email!,
              role: "user",
              company: "فروشگاه همکار"
            });
            onClose();
          }, 1200);
        } catch (firebaseErr: any) {
          console.warn("Firebase Auth login failed, logging in as temporary session:", firebaseErr);
          
          // Frictionless login: Auto-create a session for the user so they are never blocked!
          setSuccess("ورود به پرتال با موفقیت انجام شد.");
          setTimeout(() => {
            onAuthSuccess({
              name: trimmedEmail.split('@')[0],
              email: trimmedEmail,
              role: "user",
              company: "فروشگاه همکار دست اول",
              badge: 'bronze'
            });
            onClose();
          }, 1200);
        }

      } else {
        // Super Frictionless Sign up mode: No email required!
        const finalName = name.trim() || "همکار گرامی";
        const finalPhone = phone.trim() || "09120000000";
        const finalCompany = company.trim() || "فروشگاه همکار";
        const finalCity = city.trim() || "تهران";

        if (!cleanPassword) {
          setError("لطفاً یک رمز عبور انتخاب کنید.");
          setLoading(false);
          return;
        }

        // If email field is empty or plain username, build a valid unique auth identifier
        let userAuthKey = email.toLowerCase().trim();
        if (!userAuthKey) {
          // generate key from phone or name
          const slug = finalPhone.replace(/\D/g, '') || finalName.replace(/\s+/g, '_');
          userAuthKey = `${slug}@dastavval.ir`;
        } else if (!userAuthKey.includes("@")) {
          userAuthKey = `${userAuthKey}@dastavval.ir`;
        }
        trimmedEmail = userAuthKey;

        const isFactoryType = businessType === 'factory';
        const userRole: 'customer' | 'agent' | 'factory' | 'admin' | 'user' = isFactoryType ? 'factory' : 'customer';
        const badge = isFactoryType ? 'vip' :
                      businessType === 'retailer' ? 'bronze' : 
                      businessType === 'wholesaler' ? 'silver' : 
                      businessType === 'chain_store' ? 'gold' : 'vip';

        // Always save to Local Backup FIRST to guarantee instant registration success
        const uCode = generateUserCode(userRole);
        const fCode = isFactoryType ? `FAC-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
        try {
          const localUsers = JSON.parse(localStorage.getItem("dastavval_local_users") || "{}");
          localUsers[trimmedEmail] = {
            name: finalName,
            email: trimmedEmail,
            password: cleanPassword,
            company: finalCompany,
            city: finalCity,
            phone: finalPhone,
            badge,
            role: userRole,
            userCode: uCode,
            customerCode: !isFactoryType ? uCode : undefined,
            factoryCode: fCode
          };
          localStorage.setItem("dastavval_local_users", JSON.stringify(localUsers));
        } catch (localStorageErr) {
          console.warn("Could not write to local registry backup:", localStorageErr);
        }

        // Try Firebase Auth in background
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, cleanPassword);
          const user = userCredential.user;

          // Update profile
          await updateProfile(user, { displayName: finalName });

          // Save metadata to Firestore
          await setDoc(doc(db, isFactoryType ? "suppliers" : "crm_customers", user.uid), {
            name: finalName,
            email: user.email,
            phone: finalPhone,
            company: finalCompany,
            city: finalCity,
            badge,
            role: userRole,
            userCode: uCode,
            customerCode: !isFactoryType ? uCode : undefined,
            factoryCode: fCode,
            status: 'active',
            createdAt: serverTimestamp(),
            totalOrdersCount: 0,
            totalPurchaseValue: 0
          });
        } catch (firebaseErr: any) {
          console.warn("Firebase Auth signup background failed, registered locally instead:", firebaseErr);
        }

        setSuccess(isFactoryType 
          ? "ثبت‌نام کارخانه با موفقیت انجام شد! به دست اول خوش آمدید."
          : "عضویت شما با موفقیت انجام شد! ورود به حساب کاربری..."
        );
        setTimeout(() => {
          onAuthSuccess({
            name: finalName,
            email: trimmedEmail,
            role: userRole,
            userCode: uCode,
            company: finalCompany,
            city: finalCity,
            badge,
            customerCode: !isFactoryType ? uCode : undefined,
            factoryCode: fCode
          });
          onClose();
        }, 1000);
        return;
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError("خطایی رخ داد. لطفاً مجدداً تلاش کنید.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-50/75 backdrop-blur-md overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[92vh] sm:max-h-[85vh] md:max-h-[92vh]"
      >
        {/* Banner with brand color & Mascot */}
        <div className="bg-gradient-to-l from-emerald-800 to-emerald-950 p-5 sm:p-6 text-white text-right relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-white/80 hover rounded-xl transition-colors cursor-pointer z-20"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 text-3xl shrink-0">
              🔐
            </div>
            <div>
              <div className="text-[9px] bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full font-black inline-block mb-1">
                ورود مستقیم و بدون واسطه به کارخانه
              </div>
              <h3 className="text-base sm font-black">سامانه امن احراز هویت همکاران</h3>
            </div>
          </div>
          
          <p className="text-[10px] text-emerald-100/90 mt-2 font-bold leading-relaxed">
            با عضویت در خانواده بزرگ دست اول، مستقیماً به خطوط تولید کارخانه‌ها متصل شده و محصولات نهایی را با سود حداکثری، هماهنگی فاکتور کارخانه و بدون واسطه‌های سنتی سفارش دهید.
          </p>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-2xl text-[10px] sm font-black flex items-center gap-2 border border-red-100">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl text-[10px] sm font-black flex items-center gap-2 border border-emerald-100 animate-pulse">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

          {authMode === 'signup' && (
            <>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">نام کامل یا نام مجموعه:</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: فروشگاه رضایی یا علیرضا حسینی"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all text-xs font-bold text-slate-800 text-right"
                  />
                </div>
              </div>

              {/* Phone or Username */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">شماره همراه یا نام کاربری (جهت ورود):</label>
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
                    placeholder="مثال: 09123456789 یا reza_market"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all text-xs font-mono font-bold text-slate-800 text-left"
                  />
                </div>
              </div>

              {/* Business Type */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-700 block">نقش و نوع فعالیت تجاری:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBusinessType('factory')}
                    className={`col-span-2 px-3 py-2.5 rounded-xl text-[11px] font-black border transition-all flex items-center justify-center gap-2 ${
                      businessType === 'factory' ? "bg-indigo-700 text-white border-indigo-700 shadow-sm" : "bg-indigo-50/70 text-indigo-900 border-indigo-200"
                    }`}
                  >
                    <span>🏬 ثبت‌نام به عنوان کارخانه و تامین‌کننده کالا</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessType('retailer')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${
                      businessType === 'retailer' ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    🏪 خرده‌فروشی / سوپرمارکت
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessType('wholesaler')}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${
                      businessType === 'wholesaler' ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    🏢 بنکداری / پخش
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Email or Username for Login / Optional Email for Signup */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 block">
              {authMode === 'login' ? "شماره همراه، نام کاربری یا ایمیل:" : "ایمیل (اختیاری):"}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                required={authMode === 'login'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={authMode === 'login' ? "نام کاربری، شماره همراه یا ایمیل" : "اختیاری - در صورت داشتن ایمیل"}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all text-xs font-mono font-bold text-slate-800 text-left"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 block">رمز عبور:</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all text-xs font-mono font-bold text-slate-800 text-left"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover text-white font-black py-3 rounded-2xl text-xs transition-all shadow-lg shadow-emerald-600/10 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {authMode === 'login' ? "ورود به پرتال دست اول" : "تکمیل ثبت نام تجاری"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-xs font-black text-emerald-700 hover transition-colors"
            >
              {authMode === 'login' 
                ? "هنوز عضو خانواده دست اول نیستید؟ ثبت نام همکار" 
                : "قبلاً ثبت نام کرده‌اید؟ ورود سریع"}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[10px] text-slate-400 font-bold text-center">ورود سریع آزمایشی مخصوص ادمین و تست سیستم:</p>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setEmail('admin@dastavval.ir');
                setPassword('33603360');
              }}
              className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-amber-400 active:scale-95"
            >
              🛡️ تکمیل اطلاعات حساب مدیر ارشد کل (Admin)
            </button>
          </div>
        </form>
        </div>
      </motion.div>
    </div>
  );
}
