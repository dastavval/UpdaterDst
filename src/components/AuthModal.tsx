import React, { useState, useEffect, useRef } from "react";
import { 
  X, Phone, ArrowLeft, CheckCircle2, ShieldAlert, ShieldCheck, 
  Sparkles, Clock, RotateCw, Check, Smartphone, User, Building,
  Lock, ArrowRight, Award, Shield, CheckCircle, MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api-utils";
import { saveUserSession } from "../lib/auth-helper";
import { StrictCityProvinceSelector } from "./StrictCityProvinceSelector";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  b2bConfig?: any;
  initialRole?: 'customer' | 'representative' | 'marketer' | 'factory' | 'ad_poster' | 'leader';
  initialMode?: 'login' | 'signup';
  onAuthSuccess: (user: { 
    id?: string;
    name: string; 
    email: string; 
    role: 'customer' | 'agent' | 'marketer' | 'factory' | 'importer' | 'supplier' | 'representative' | 'leader' | 'admin' | 'user' | 'ad_poster'; 
    company?: string; 
    city?: string;
    badge?: 'bronze' | 'silver' | 'gold' | 'vip' | 'admin';
    userCode?: string;
    agencyCode?: string;
    customerCode?: string;
    factoryCode?: string;
    phone?: string;
    address?: string;
    nationalCode?: string;
    iban?: string;
  }) => void;
}

export default function AuthModal({ isOpen, onClose, b2bConfig, onAuthSuccess }: AuthModalProps) {
  // Mobile & OTP States
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [nationalCode, setNationalCode] = useState("");
  const [province, setProvince] = useState("تهران");
  const [city, setCity] = useState("تهران");
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [verifiedUser, setVerifiedUser] = useState<any>(null);
  
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Clean and normalize Iranian mobile numbers
  const normalizePhone = (input: string) => {
    let clean = input
      .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
      .replace(/[^0-9+]/g, "");
    if (clean.startsWith("+98")) {
      clean = "0" + clean.slice(3);
    } else if (clean.startsWith("98")) {
      clean = "0" + clean.slice(2);
    } else if (clean.length === 10 && clean.startsWith("9")) {
      clean = "0" + clean;
    }
    return clean;
  };

  // Reset state when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setStep('phone');
      setVerifiedUser(null);
      setOtpDigits(["", "", "", "", ""]);
      setOtpTimer(0);
    }
  }, [isOpen]);

  // OTP Timer Countdown Effect
  useEffect(() => {
    let interval: any;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  const cleanCurrentPhone = normalizePhone(phone);
  const configuredAdminPhone = b2bConfig?.smsAdminPhone ? normalizePhone(b2bConfig.smsAdminPhone) : null;
  const isAdminNumber = cleanCurrentPhone === "09914762406" || cleanCurrentPhone === configuredAdminPhone;

  // Step 1: Send SMS OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetPhone = normalizePhone(phone.trim());
    
    if (!targetPhone || targetPhone.length < 10 || !targetPhone.startsWith("09")) {
      setError("لطفاً شماره تلفن همراه معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) را وارد فرمایید.");
      return;
    }
    
    setOtpLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(getApiUrl("/api/sms/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone })
      });
      const data = await response.json();
      
      if (data.success || response.ok) {
        setStep('otp');
        setOtpTimer(120); // 2 minutes countdown
        setOtpDigits(["", "", "", "", ""]);
        setSuccess(null);

        setTimeout(() => {
          otpInputRefs[0].current?.focus();
        }, 150);
      } else {
        setError(data.message || "خطا در ارسال پیامک کد تأیید. لطفاً مجدداً امتحان فرمایید.");
      }
    } catch (err: any) {
      if (targetPhone === "09914762406" || targetPhone === configuredAdminPhone) {
        setStep('otp');
        setOtpTimer(120);
        setOtpDigits(["", "", "", "", ""]);
        setSuccess(null);
        setTimeout(() => {
          otpInputRefs[0].current?.focus();
        }, 150);
      } else {
        setError("خطا در برقراری ارتباط با سرور پیامک: " + err.message);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const completeLogin = (userObj: any) => {
    try {
      saveUserSession(userObj);
      if (userObj.phone || userObj.mobile) {
        localStorage.setItem('dastavval_buyer_phone', userObj.phone || userObj.mobile);
      }
      if (userObj.name) {
        localStorage.setItem('dastavval_buyer_name', userObj.name);
      }
      if (userObj.address) {
        localStorage.setItem('dastavval_buyer_address', userObj.address);
      }
    } catch (storageErr) {
      console.warn("Storage session sync failed:", storageErr);
    }

    setTimeout(() => {
      onAuthSuccess({
        id: userObj.id || userObj.userCode || userObj.phone,
        name: userObj.name || "کاربر گرامی",
        email: userObj.email || `${userObj.phone}@dastavval.com`,
        role: userObj.role || "customer",
        userCode: userObj.userCode,
        company: userObj.company || "مجموعه همکار",
        badge: userObj.role === 'admin' ? 'admin' : (userObj.badge || 'bronze'),
        agencyCode: userObj.agencyCode,
        customerCode: userObj.customerCode,
        factoryCode: userObj.factoryCode,
        city: userObj.city || "تهران",
        phone: userObj.phone,
        address: userObj.address,
        nationalCode: userObj.nationalCode,
        iban: userObj.iban
      });
      onClose();
    }, 800);
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("وارد کردن نام و نام خانوادگی الزامی است.");
      return;
    }
    if (!address.trim()) {
      setError("وارد کردن استان، شهر و نشانی دقیق تحویل سفارش الزامی است.");
      return;
    }
    
    setOtpLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const targetPhone = normalizePhone(phone.trim());
      let updatedUserObj: any = null;
      try {
        const response = await fetch(getApiUrl("/api/sms/update-profile"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: targetPhone,
            name: name.trim(),
            company: company.trim() || undefined,
            nationalCode: nationalCode.trim() || undefined,
            address: address.trim()
          })
        });
        const data = await response.json().catch(() => ({}));
        if (data && data.user) {
          updatedUserObj = data.user;
        }
      } catch (e) {}

      const finalUser = {
        ...(verifiedUser || {}),
        ...(updatedUserObj || {}),
        id: updatedUserObj?.id || verifiedUser?.id || "usr-" + targetPhone,
        phone: targetPhone,
        mobile: targetPhone,
        name: name.trim(),
        province,
        city,
        address: address.trim() || `استان ${province} - شهر ${city}`,
        company: company.trim() || verifiedUser?.company || "",
        nationalCode: nationalCode.trim() || verifiedUser?.nationalCode || "",
        role: verifiedUser?.role || 'customer',
        badge: verifiedUser?.badge || 'bronze'
      };

      saveUserSession(finalUser);
      setSuccess("پروفایل شما با موفقیت تکمیل شد.");
      completeLogin(finalUser);
    } catch (err: any) {
      setError("خطا در تکمیل اطلاعات: " + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Step 2: Verify SMS OTP
  const executeVerifyOtp = async (codeToVerify: string) => {
    const targetPhone = normalizePhone(phone.trim());
    if (!targetPhone) {
      setError("شماره همراه نامعتبر است.");
      return;
    }
    const cleanCode = (codeToVerify || "").trim();
    if (!cleanCode || cleanCode.length < 4) {
      setError("لطفاً کد تایید دریافتی را کامل وارد فرمایید.");
      return;
    }

    setOtpLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(getApiUrl("/api/sms/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: targetPhone, 
          code: cleanCode
        })
      });
      const data = await response.json();
      
      if (data.success && data.user) {
        const userObj = data.user;
        const isAdmin = userObj.role === 'admin' || targetPhone === "09914762406" || targetPhone === configuredAdminPhone;
        const needsProfileCompletion = !isAdmin && (data.isNew || !userObj.name || userObj.name.includes("خریدار عمده") || !userObj.address);
        
        if (needsProfileCompletion) {
          setVerifiedUser(userObj);
          setName(userObj.name || "");
          setCompany(userObj.company || "");
          setNationalCode(userObj.nationalCode || "");
          setAddress(userObj.address || "");
          setStep('profile');
          setSuccess("کد تأیید تأیید شد. لطفاً نام و نشانی تحویل سفارش را وارد نمایید.");
        } else {
          setSuccess(isAdmin ? "ورود مدیریت کل با موفقیت انجام شد." : "ورود با موفقیت انجام شد.");
          completeLogin(userObj);
        }
      } else {
        setError(data.error || data.message || "کد تأیید وارد شده نامعتبر یا منقضی است.");
      }
    } catch (err: any) {
      setError("خطا در تایید کد پیامک: " + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const cleanVal = val.replace(/[^0-9۰-۹]/g, "").slice(-1);
    const normalized = cleanVal.replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)]);
    
    const newDigits = [...otpDigits];
    newDigits[index] = normalized;
    setOtpDigits(newDigits);

    if (normalized && index < 4) {
      otpInputRefs[index + 1].current?.focus();
    }

    const fullCode = newDigits.join("");
    // Auto submit if 5 digits are entered
    if (fullCode.length === 5 && !newDigits.includes("")) {
      executeVerifyOtp(fullCode);
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handlePasteDigits = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    const cleanDigits = pasted
      .replace(/[۰-۹]/g, (d) => "0123456789"["۰۱۲۳۴۵۶۷۸۹".indexOf(d)])
      .replace(/[^0-9]/g, "")
      .slice(0, 5);

    if (cleanDigits.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 5; i++) {
        newDigits[i] = cleanDigits[i] || "";
      }
      setOtpDigits(newDigits);
      
      const targetFocus = Math.min(cleanDigits.length, 4);
      otpInputRefs[targetFocus].current?.focus();

      if (cleanDigits.length >= 4) {
        executeVerifyOtp(cleanDigits);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-white/60 backdrop-blur-3xl overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-white shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] overflow-hidden my-auto flex flex-col"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 flex items-center justify-center transition-all shadow-xs cursor-pointer border border-slate-200 active:scale-90"
          title="بستن"
          type="button"
        >
          <X size={16} />
        </button>

        {/* Clean Modern Header */}
        <div className="p-6 bg-gradient-to-b from-emerald-50/70 via-white to-white border-b border-slate-100 text-center relative">
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-3.5">
            <Smartphone size={28} />
          </div>
          
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            ورود و عضویت یکپارچه پیامکی
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            سامانه ملّی دست اول • ورود تمام کاربران و مدیران با کد پیامکی (OTP)
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 text-rose-800 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border border-rose-200 shadow-2xs">
              <ShieldAlert size={18} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-emerald-600 text-white p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 border border-emerald-500 shadow-xs">
              <CheckCircle2 size={18} className="shrink-0 text-white" />
              <span>{success}</span>
            </div>
          )}

          {step === 'phone' ? (
            /* STEP 1: ENTER PHONE NUMBER */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-900 block text-right">
                  شماره تلفن همراه خود را وارد فرمایید:
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    required
                    autoFocus
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 text-base font-mono font-black text-slate-900 text-left outline-none transition-all"
                    dir="ltr"
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-right">
                  کد تأیید ۵ رقمی از طریق پیامک برای این شماره ارسال خواهد شد.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl text-sm transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {otpLoading ? (
                    <RotateCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>دریافت کد تأیید پیامکی</span>
                      <ArrowLeft size={18} />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-400">
                  ورود به منزله پذیرش قوانین و مقررات مبادلات عمده دست اول است.
                </p>
              </div>
            </form>
          ) : step === 'otp' ? (
            /* STEP 2: VERIFY OTP CODE - OPTIMIZED UX WITH PIN BOXES ON TOP */
            <div className="space-y-4">
              {/* 5-Digit PIN Boxes - Placed at the top for instant thumb & eye focus */}
              <div className="space-y-2.5">
                <div className="text-center space-y-1">
                  <label className="text-xs font-black text-slate-900 block">
                    کد تأیید ۵ رقمی پیامک‌شده را وارد کنید:
                  </label>
                  <p className="text-[11px] text-slate-400 font-bold">
                    کد یک‌بار مصرف ارسالی به تلفن همراه شما
                  </p>
                </div>
                
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1" dir="ltr">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={`authmodal-pin-${idx}`}
                      ref={otpInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={handlePasteDigits}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-mono font-black rounded-2xl border transition-all outline-none ${
                        digit 
                          ? "bg-white border-emerald-600 text-emerald-950 ring-4 ring-emerald-500/20 shadow-sm" 
                          : "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Phone indicator & Edit Number - Placed below OTP boxes as requested */}
              <div className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl flex items-center justify-between text-xs transition-colors">
                <div className="flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span className="text-slate-600 font-bold truncate">شماره تماس:</span>
                  <span className="font-mono font-black text-slate-900 px-2 py-0.5 bg-white rounded-lg border border-slate-200" dir="ltr">
                    {phone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtpDigits(["", "", "", "", ""]);
                  }}
                  className="text-[11px] font-black text-emerald-700 hover:text-emerald-900 bg-white hover:bg-emerald-50 border border-slate-200 px-2.5 py-1 rounded-xl cursor-pointer shrink-0 transition-all"
                >
                  ویرایش شماره
                </button>
              </div>

              {/* Countdown & Resend Button */}
              <div className="flex items-center justify-between text-xs pt-1">
                {otpTimer > 0 ? (
                  <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                    <Clock size={15} className="text-emerald-600" />
                    <span>ارسال مجدد پیامک تا:</span>
                    <span className="font-mono font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200" dir="ltr">
                      {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="text-xs font-black text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
                  >
                    <RotateCw size={13} />
                    <span>ارسال مجدد پیامک</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => executeVerifyOtp(otpDigits.join(""))}
                  disabled={otpLoading || otpDigits.join("").length < 4}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 shadow-sm hover:shadow-md flex items-center gap-1.5"
                >
                  {otpLoading && <RotateCw size={14} className="animate-spin" />}
                  <span>تأیید و ورود</span>
                  <Check size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 3: COMPLETE PROFILE INFORMATION */
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center mb-2 shadow-xs">
                  <User size={22} />
                </div>
                <h4 className="text-sm font-black text-slate-900">تکمیل پروفایل همکار</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">لطفاً مشخصات خود را جهت ثبت نهایی در سامانه وارد فرمایید.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-800 block text-right">
                    نام و نام خانوادگی خریدار <span className="text-rose-500">* (الزامی)</span>:
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: علی احمدی"
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-800 block text-right">
                    انتخاب استان و شهر محل سکونت / فعالیت <span className="text-rose-500">* (الزامی)</span>:
                  </label>
                  <StrictCityProvinceSelector
                    selectedCity={city}
                    selectedProvince={province}
                    onSelect={(c, p) => {
                      setCity(c);
                      setProvince(p);
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-800 block text-right">
                    نشانی دقیق پستی / تحویل سفارش <span className="text-rose-500">* (الزامی)</span>:
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                    <textarea
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="مثال: خیابان پیروزی، میدان شهدا، پلاک... (جهت ثبت رسمی در فاکتور و ارسال بار)"
                      rows={2}
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all text-right resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-800 block text-right">نام فروشگاه / شرکت (اختیاری):</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="مثال: بازرگانی پارس"
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all text-right"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-800 block text-right">کد ملی خریدار (اختیاری):</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={nationalCode}
                      onChange={(e) => setNationalCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                      placeholder="مثال: ۱۲۳۴۵۶۷۸۹۰ (اختیاری)"
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl text-xs transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  {otpLoading ? (
                    <RotateCw size={16} className="animate-spin" />
                  ) : (
                    <>
                      <span>تأیید نهایی مشخصات و ورود</span>
                      <Check size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>احراز هویت امن با درگاه ملی پیامک</span>
          </div>
          <span className="font-mono font-bold text-slate-400">dastavval.com</span>
        </div>
      </motion.div>
    </div>
  );
}
