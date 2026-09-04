import React, { useState, useMemo, useEffect, useRef } from "react";
import { 
  Building2, 
  Award, 
  ShieldCheck, 
  CheckCircle2, 
  MapPin, 
  FileText, 
  Phone, 
  User, 
  ArrowLeft, 
  Sparkles, 
  Truck, 
  Send, 
  Check, 
  HelpCircle,
  Clock,
  DollarSign,
  Briefcase,
  AlertCircle,
  Coins,
  TrendingUp,
  Users,
  Calculator,
  Package,
  Copy,
  CheckCheck,
  RotateCw,
  Smartphone,
  ShieldAlert,
  X,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import RepresentativeCertificateView from "./RepresentativeCertificateView";
import { addCallbackRequest } from "../lib/callback-helper";
import { calculateDealershipTier } from "../utils/dealershipCityTiers";
import { ResilientVault } from "../lib/resilient-storage";
import { getApiUrl } from "../utils/api-utils";
import { saveUserSession, getUserSession } from "../lib/auth-helper";

interface DealershipRequestViewProps {
  b2bConfig?: any;
  user?: any;
  userCity?: string;
  userProvince?: string;
  onNavigateHome: () => void;
  onOpenCertificate?: () => void;
}

export default function DealershipRequestView({
  b2bConfig,
  user,
  userCity,
  userProvince,
  onNavigateHome,
  onOpenCertificate
}: DealershipRequestViewProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'benefits' | 'calculator' | 'certificate' | 'tracking'>('form');
  
  // Application Form States
  const [fullName, setFullName] = useState(user?.name || "");
  const [mobile, setMobile] = useState(user?.phone || user?.mobile || "");
  const [companyName, setCompanyName] = useState(user?.company || "");

  // Initialize province and city with intelligent fallback from user prop, userCity prop, or localStorage
  const [province, setProvince] = useState<string>(() => {
    if (user?.province) return user.province;
    if (userProvince) return userProvince;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dastavval_user_province");
      if (saved) return saved;
    }
    return "خراسان رضوی";
  });

  const [city, setCity] = useState<string>(() => {
    if (user?.city) return user.city;
    if (userCity) return userCity;
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dastavval_user_city");
      if (saved) return saved;
    }
    return "قوچان";
  });

  const [warehouseSpace, setWarehouseSpace] = useState("۱۰۰ تا ۳۰۰ متر مربع");
  const [distributionVehicles, setDistributionVehicles] = useState("۱ تا ۲ دستگاه وانت/کامیونت");
  const [experienceYears, setExperienceYears] = useState("۲ تا ۵ سال");
  const [capitalRange, setCapitalRange] = useState("۵۰۰ میلیون تا ۱ میلیارد تومان");
  const [selectedZone, setSelectedZone] = useState("منطقه ۱ - شمال (شمیرانات و شمال کلان‌شهر)");
  const [selectedLevel, setSelectedLevel] = useState<"diamond" | "gold" | "silver">("gold");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  // SMS OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // Creative Floating Toast States
  const [showToast, setShowToast] = useState(false);
  const [toastCopied, setToastCopied] = useState(false);
  const [toastProgress, setToastProgress] = useState(100);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // Clean and normalize Iranian mobile numbers
  const normalizePhone = (input: string) => {
    let clean = (input || "")
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

  // Sync state if user prop changes
  useEffect(() => {
    if (user?.name && !fullName) setFullName(user.name);
    if ((user?.phone || user?.mobile) && !mobile) setMobile(user.phone || user.mobile);
    if (user?.company && !companyName) setCompanyName(user.company);
  }, [user]);

  // Sync state if userCity or userProvince prop changes
  useEffect(() => {
    if (userCity) setCity(userCity);
    if (userProvince) setProvince(userProvince);
  }, [userCity, userProvince]);

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

  // Toast Progress Countdown Effect
  useEffect(() => {
    let progressInterval: any;
    if (showToast) {
      setToastProgress(100);
      progressInterval = setInterval(() => {
        setToastProgress((prev) => {
          if (prev <= 0) {
            clearInterval(progressInterval);
            setShowToast(false);
            return 0;
          }
          return prev - 1;
        });
      }, 100); // 10 seconds total
    }
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [showToast]);

  // Listen to events for city prefill and header location selector changes
  useEffect(() => {
    const handleOpenEvent = (e: any) => {
      if (e.detail?.city) {
        setCity(e.detail.city);
      }
      if (e.detail?.province) {
        setProvince(e.detail.province);
      }
      setActiveTab('form');
    };

    const handleCityChangeEvent = (e: any) => {
      if (e.detail?.city) {
        setCity(e.detail.city);
      }
      if (e.detail?.province) {
        setProvince(e.detail.province);
      }
    };

    window.addEventListener("open-dealership-request", handleOpenEvent);
    window.addEventListener("dastavval-city-changed", handleCityChangeEvent);
    return () => {
      window.removeEventListener("open-dealership-request", handleOpenEvent);
      window.removeEventListener("dastavval-city-changed", handleCityChangeEvent);
    };
  }, []);

  // Dynamic Demographic Quota Calculation for selected city
  const cityTierData = useMemo(() => {
    return calculateDealershipTier(city || "قوچان", province);
  }, [city, province]);

  // Check if current user is already authenticated with the entered phone number
  const currentSessionUser = useMemo(() => {
    return getUserSession() || user;
  }, [user]);

  const isCurrentPhoneVerified = useMemo(() => {
    if (!currentSessionUser?.phone && !currentSessionUser?.mobile) return false;
    const sessionPhone = normalizePhone(currentSessionUser.phone || currentSessionUser.mobile || "");
    const enteredPhone = normalizePhone(mobile);
    return Boolean(sessionPhone && enteredPhone && sessionPhone === enteredPhone);
  }, [currentSessionUser, mobile]);

  // Provinces List
  const provinces = [
    "آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", 
    "تهران", "چهارمحال و بختیاری", "خراسان جنوبی", "خراسان رضوی", "خراسان شمالی", 
    "خوزستان", "زنجان", "سمنان", "سیستان و بلوچستان", "فارس", "قزوین", "قم", "کردستان", 
    "کرمان", "کرمانشاه", "کهگیلویه و بویراحمد", "گلستان", "گیلان", "لرستان", "مازندران", 
    "مرکزی", "هرمزگان", "همدان", "یزد"
  ];

  const quickCities = [
    { name: "قوچان", prov: "خراسان رضوی" },
    { name: "سبزوار", prov: "خراسان رضوی" },
    { name: "نیشابور", prov: "خراسان رضوی" },
    { name: "مشهد", prov: "خراسان رضوی" },
    { name: "تهران", prov: "تهران" },
    { name: "اصفهان", prov: "اصفهان" },
    { name: "کرج", prov: "البرز" },
    { name: "شیراز", prov: "فارس" },
    { name: "تبریز", prov: "آذربایجان شرقی" },
    { name: "کاشان", prov: "اصفهان" },
    { name: "دزفول", prov: "خوزستان" },
    { name: "آمل", prov: "مازندران" },
    { name: "کرمانشاه", prov: "کرمانشاه" },
    { name: "همدان", prov: "همدان" },
    { name: "بندرعباس", prov: "هرمزگان" }
  ];

  // Send SMS OTP code to mobile for verification
  const handleSendDealershipOtp = async () => {
    const targetPhone = normalizePhone(mobile.trim());
    if (!targetPhone || targetPhone.length < 10 || !targetPhone.startsWith("09")) {
      alert("لطفاً شماره تلفن همراه معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) را وارد فرمایید.");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const response = await fetch(getApiUrl("/api/sms/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone })
      });
      const data = await response.json();

      if (data.success || response.ok) {
        setShowOtpModal(true);
        setOtpTimer(120);
        setOtpDigits(["", "", "", "", ""]);
        setOtpSuccess("کد ۵ رقمی تأیید هویت پیامکی به شماره شما ارسال شد.");

        setTimeout(() => {
          otpInputRefs[0].current?.focus();
        }, 200);
      } else {
        setOtpError(data.message || "خطا در ارسال پیامک. لطفاً شماره را بررسی فرمایید.");
      }
    } catch (err: any) {
      setOtpError("خطا در برقراری ارتباط با سرور پیامک: " + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify OTP and complete Dealership Request Submission
  const handleVerifyDealershipOtp = async (codeToVerify: string) => {
    const targetPhone = normalizePhone(mobile.trim());
    if (!targetPhone) {
      setOtpError("شماره همراه نامعتبر است.");
      return;
    }
    if (!codeToVerify || codeToVerify.length < 5) {
      setOtpError("لطفاً کد تایید ۵ رقمی را کامل وارد نمایید.");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const response = await fetch(getApiUrl("/api/sms/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: targetPhone,
          code: codeToVerify,
          name: fullName.trim(),
          company: companyName.trim()
        })
      });
      const data = await response.json();

      if (data.success && data.user) {
        const verifiedUser = data.user;
        verifiedUser.name = fullName.trim() || verifiedUser.name;
        verifiedUser.company = companyName.trim() || verifiedUser.company;
        verifiedUser.province = province;
        verifiedUser.city = city;

        // Save session locally and in cookie
        saveUserSession(verifiedUser);
        window.dispatchEvent(new CustomEvent('dastavval_users_updated', { detail: verifiedUser }));

        setOtpSuccess("✅ شماره همراه شما با موفقیت تأیید شد!");
        setShowOtpModal(false);

        // Directly execute dealership request creation
        await executeFinalSubmission(targetPhone, verifiedUser);
      } else {
        setOtpError(data.error || data.message || "کد تأیید وارد شده نامعتبر است.");
      }
    } catch (err: any) {
      setOtpError("خطا در تایید کد پیامک: " + err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = normalizePhone(mobile.trim());

    if (!fullName.trim() || !cleanMobile) {
      alert("لطفاً نام کامل و شماره تماس خود را وارد نمایید.");
      return;
    }

    if (cleanMobile.length < 10 || !cleanMobile.startsWith("09")) {
      alert("لطفاً شماره تلفن همراه معتبر ۱۱ رقمی (مانند ۰۹۱۲۳۴۵۶۷۸۹) را وارد فرمایید.");
      return;
    }

    // If phone is already verified in current session, submit directly!
    if (isCurrentPhoneVerified) {
      await executeFinalSubmission(cleanMobile, currentSessionUser);
    } else {
      // Step 1: Enforce SMS OTP Phone Verification
      await handleSendDealershipOtp();
    }
  };

  // Execute Final Dealership Request Storage and Toast trigger
  const executeFinalSubmission = async (targetPhone: string, authUser?: any) => {
    setIsSubmitting(true);
    try {
      const generatedCode = "REP-" + Math.floor(100000 + Math.random() * 900000);
      const requestDetails = `[درخواست نمایندگی رسمی] کد: ${generatedCode} | متقاضی: ${fullName} | شرکت: ${companyName || 'شخصی'} | استان: ${province} - شهر: ${city} (سطح: ${cityTierData.tierLabel} - سقف سهمیه: ${cityTierData.monthlyQuotaCeilingFormatted}) | متراژ انبار: ${warehouseSpace} | ناوگان: ${distributionVehicles} | سابقه: ${experienceYears} | توضیحات: ${notes || '-'}`;

      await addCallbackRequest(targetPhone, requestDetails);
      
      const dealershipPayload = {
        id: generatedCode,
        code: generatedCode,
        date: new Date().toLocaleDateString("fa-IR"),
        createdAt: new Date().toISOString(),
        status: "pending",
        statusLabel: "در حال بررسی کمیسیون اعطای نمایندگی",
        fullName,
        name: fullName,
        phone: targetPhone,
        mobile: targetPhone,
        companyName,
        company: companyName,
        province,
        city,
        warehouseSpace,
        distributionVehicles,
        experienceYears,
        capitalRange,
        selectedZone: cityTierData.isMetropolis ? selectedZone : undefined,
        selectedLevel: cityTierData.isMetropolis ? selectedLevel : undefined,
        notes,
        tierLabel: cityTierData.tierLabel,
        monthlyQuotaCeilingFormatted: cityTierData.monthlyQuotaCeilingFormatted,
        requestedAt: new Date().toISOString()
      };

      // Resilient Multi-layer Save
      await ResilientVault.saveDealershipRequest(dealershipPayload);

      // Create / Update User Account
      const users = JSON.parse(localStorage.getItem('dastavval_local_users') || '[]');
      let userIndex = users.findIndex((u: any) => u.phone === targetPhone || u.mobile === targetPhone);
      const userObj = {
        ...(authUser || {}),
        id: userIndex >= 0 ? users[userIndex].id : (authUser?.id || `usr_${Date.now()}`),
        name: fullName,
        phone: targetPhone,
        mobile: targetPhone,
        company: companyName || 'عاملیت توزیع',
        province,
        city,
        role: 'pending_representative',
        dealershipStatus: 'pending',
        repPending: true,
        dealershipCode: generatedCode,
        createdAt: userIndex >= 0 ? users[userIndex].createdAt : new Date().toISOString()
      };

      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...userObj };
      } else {
        users.unshift(userObj);
      }
      localStorage.setItem('dastavval_local_users', JSON.stringify(users));
      saveUserSession(userObj);
      window.dispatchEvent(new CustomEvent('dastavval_users_updated', { detail: userObj }));

      // Dispatch SMS confirmation to applicant and alert to admin
      try {
        fetch(getApiUrl("/api/sms/send-dealership-sms"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: targetPhone,
            fullName,
            trackingCode: generatedCode,
            companyName: companyName || "عاملیت توزیع",
            province,
            city
          })
        }).catch(err => console.warn("Dealership SMS dispatch warning:", err));
      } catch (smsErr) {
        console.warn("Dealership SMS catch:", smsErr);
      }

      setTrackingCode(generatedCode);
      setSubmitSuccess(true);
      setShowToast(true); // Trigger Creative Toast Notification
    } catch (error: any) {
      alert("خطا در ثبت درخواست: " + (error?.message || "لطفاً دوباره تلاش فرمایید."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyTrackingCode = () => {
    if (!trackingCode) return;
    navigator.clipboard.writeText(trackingCode);
    setToastCopied(true);
    setTimeout(() => setToastCopied(false), 2500);
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
    if (fullCode.length === 5 && !newDigits.includes("")) {
      handleVerifyDealershipOtp(fullCode);
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

      if (cleanDigits.length === 5) {
        handleVerifyDealershipOtp(cleanDigits);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 text-right font-sans my-4" dir="rtl">
      
      {/* Header Banner - Clean, Creative, Pure White */}
      <div className="relative bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-xs overflow-hidden border border-slate-200">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
              <Award size={30} className="text-emerald-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-200 text-[10.5px] font-black">
                  اعطای عاملیت و نمایندگی رسمی پلتفرم
                </span>
                <span className="text-[10px] text-slate-500 font-bold">شروع آسان از ۳۰ کارتن با ارتقای خودکار پلکانی</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                پورتال درخواست نمایندگی استانی و شهرستانی دست اول
              </h1>
              <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-2xl">
                توزیع مستقیم محصولات کارخانجات با سهمیه کارتنی منعطف، شروع کم‌ریسک و رشد پلکانی اتوماتیک بر اساس کشش بازار هر منطقه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
            >
              <span>صفحه اصلی</span>
              <ArrowLeft size={14} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-5 pt-3.5 border-t border-slate-100 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'form' 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <FileText size={14} />
            <span>تکمیل فرم درخواست نمایندگی</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'calculator' 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Calculator size={14} />
            <span>محاسبه‌گر هوشمند سقف و سهمیه شهرها</span>
          </button>

          <button
            onClick={() => setActiveTab('benefits')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'benefits' 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Sparkles size={14} />
            <span>مزایا، سود و شرایط اعطا</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'tracking' 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
            }`}
          >
            <Clock size={14} />
            <span>پیگیری پرونده‌های ثبت‌شده</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Form Side */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              {submitSuccess ? (
                <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/30">
                    <CheckCircle2 size={36} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-slate-900">حساب کاربری شما ایجاد شد و درخواست نمایندگی ثبت گردید</h3>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed max-w-lg mx-auto">
                      نام کاربری شما شماره موبایل <span className="font-mono font-black text-emerald-800">{mobile}</span> و رمز عبور ساده شما تعیین شد. حساب شما به صورت خودکار ذخیره گردید و نیازی به ورود مجدد ندارید.
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-emerald-200 rounded-2xl text-right space-y-2 max-w-md mx-auto text-xs font-bold text-slate-700">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">کد رهگیری پرونده:</span>
                      <span className="font-mono font-black text-emerald-700">{trackingCode}</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">منطقه و سهمیه:</span>
                      <span className="font-black text-slate-900">{province} - {city} ({cityTierData.monthlyQuotaCeilingFormatted})</span>
                    </div>
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-bold leading-relaxed">
                      ⏳ درخواست شما در حال بررسی توسط مدیر است. پس از تأیید نهایی، قیمت‌های کف کارخانه و نمایندگی برای شما فعال شده و با خرید تا سقف سهمیه منطقه، پروفایل شما در صفحه اصلی نمایش داده می‌شود.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-center gap-3">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('dastavval_open_user_panel'));
                        onNavigateHome();
                      }}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <User size={16} />
                      <span>رفتن به حساب کاربری و مشاهده وضعیت</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Briefcase className="text-emerald-600" size={18} />
                      <span>مشخصات متقاضی و منطقه تحت پوشش</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                      سقف خرید، سهمیه ماهانه و تسهیلات اعتباری به صورت کاملاً اتوماتیک بر اساس جمعیت شهرستان تعیین می‌گردد.
                    </p>
                  </div>

                  {/* Dynamic City Population Alert Banner */}
                  <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Coins size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">سقف سهمیه مصوب برای {city}:</span>
                          <span className="text-xs font-black text-emerald-700 font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-200">{cityTierData.monthlyQuotaCeilingFormatted}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          سطح جمعیتی: {cityTierData.tierLabel} • ظرفیت بار: {cityTierData.monthlyCartons}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">نام و نام خانوادگی مسئول:</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: علیرضا محمدی"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700">شماره موبایل جهت تماس و پیامک:</label>
                        {isCurrentPhoneVerified ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>تأیید شده پیامکی</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <ShieldCheck size={12} className="text-emerald-700" />
                            <span>تأیید با پیامک یکبارمصرف</span>
                          </span>
                        )}
                      </div>
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 outline-hidden"
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">نام فروشگاه، بنکداری یا شرکت پخش:</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="مثال: بازرگانی پخش پیشرو البرز"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">استان مورد تقاضا:</label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      >
                        {provinces.map((p, pIdx) => (
                          <option key={`dealer-prov-opt-${p}-${pIdx}`} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">شهرستان / منطقه توزیع:</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="مثال: تهران، مشهد، اصفهان، کاشان..."
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      />
                    </div>

                    {/* Regional Zone & Multi-level Tier Selection for Metropolises */}
                    {cityTierData.isMetropolis && (
                      <>
                        <div className="space-y-1.5 sm:col-span-2 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                          <label className="text-xs font-black text-emerald-950 flex items-center justify-between">
                            <span>📍 انتخاب منطقه و ناحیه فعالیت در کلان‌شهر ({city}):</span>
                            <span className="text-[10px] text-emerald-700 font-bold">جلوگیری از انحصار و حفظ رقابت سالم</span>
                          </label>
                          <select
                            value={selectedZone}
                            onChange={(e) => setSelectedZone(e.target.value)}
                            className="w-full bg-white border border-emerald-300 focus:border-emerald-600 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-hidden mt-1"
                          >
                            {(cityTierData.availableZones || [
                              "منطقه ۱ - شمال کلان‌شهر",
                              "منطقه ۲ - غرب کلان‌شهر",
                              "منطقه ۳ - مرکز کلان‌شهر",
                              "منطقه ۴ - شرق کلان‌شهر",
                              "منطقه ۵ - جنوب کلان‌شهر"
                            ]).map((z, zIdx) => (
                              <option key={`zone-opt-${zIdx}`} value={z}>{z}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5 sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                          <label className="text-xs font-black text-slate-900 block">
                            🏆 سطح‌بندی عاملیت در کلان‌شهر:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                            {(cityTierData.representativeLevels || [
                              { level: "diamond", title: "💎 سطح ۱: الماس", description: "بنکداری و مدیریت منطقه‌ای", minMonthlyVolumeFormatted: "۱.۵ میلیارد تومان" },
                              { level: "gold", title: "🥇 سطح ۲: طلایی", description: "پخش مویرگی محلی", minMonthlyVolumeFormatted: "۶۰۰ میلیون تومان" },
                              { level: "silver", title: "🥈 سطح ۳: نقره‌ای", description: "تحویل و توزیع سریع", minMonthlyVolumeFormatted: "۳۰۰ میلیون تومان" }
                            ]).map((lvl) => (
                              <button
                                type="button"
                                key={`lvl-btn-${lvl.level}`}
                                onClick={() => setSelectedLevel(lvl.level as any)}
                                className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                                  selectedLevel === lvl.level
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
                                }`}
                              >
                                <div className="text-xs font-black">{lvl.title}</div>
                                <div className={`text-[10px] mt-0.5 ${selectedLevel === lvl.level ? "text-emerald-100" : "text-slate-500"}`}>{lvl.description}</div>
                                <div className={`text-[10px] font-mono mt-1 font-bold ${selectedLevel === lvl.level ? "text-amber-200" : "text-emerald-700"}`}>سقف: {lvl.minMonthlyVolumeFormatted}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">متراژ انبار یا سوله نگهداری کالا:</label>
                      <select
                        value={warehouseSpace}
                        onChange={(e) => setWarehouseSpace(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      >
                        <option value="کمتر از ۱۰۰ متر">کمتر از ۱۰۰ متر مربع</option>
                        <option value="۱۰۰ تا ۳۰۰ متر مربع">۱۰۰ تا ۳۰۰ متر مربع</option>
                        <option value="۳۰۰ تا ۱۰۰۰ متر مربع">۳۰۰ تا ۱۰۰۰ متر مربع</option>
                        <option value="بیش از ۱۰۰۰ متر مربع (سوله استاندارد)">بیش از ۱۰۰۰ متر مربع (سوله استاندارد)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">تعداد ناوگان و خودروهای پخش:</label>
                      <select
                        value={distributionVehicles}
                        onChange={(e) => setDistributionVehicles(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      >
                        <option value="۱ دستگاه">۱ دستگاه وانت/کامیونت</option>
                        <option value="۲ تا ۴ دستگاه">۲ تا ۴ دستگاه</option>
                        <option value="۵ تا ۱۰ دستگاه">۵ تا ۱۰ دستگاه</option>
                        <option value="بیش از ۱۰ دستگاه (ناوگان کامل)">بیش از ۱۰ دستگاه (ناوگان کامل)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-700">سابقه فعالیت در حوزه مواد غذایی:</label>
                      <select
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-hidden"
                      >
                        <option value="تازه‌کار (کمتر از ۲ سال)">تازه‌کار (کمتر از ۲ سال)</option>
                        <option value="۲ تا ۵ سال">۲ تا ۵ سال</option>
                        <option value="۵ تا ۱۰ سال">۵ تا ۱۰ سال</option>
                        <option value="بیش از ۱۰ سال سابقه معتبر">بیش از ۱۰ سال سابقه معتبر</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700">توضیحات تکمیلی یا درخواست برندهای خاص:</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="در صورت تمایل به دریافت نمایندگی کارخانه خاص، یا داشتن شرایط ویژه توزیع ذکر فرمایید..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs font-bold text-slate-800 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>در حال ارسال اطلاعات و ثبت پرونده...</span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>ثبت نهایی درخواست و بررسی سهمیه شهری</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Side Highlights & Live Demographic Progressive Quota Card */}
            <div className="space-y-4">
              {/* Creative White/Emerald Compact Quota Card (No Blue Box) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 space-y-4 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Package size={18} className="text-emerald-600" />
                    <h3 className="text-xs sm:text-sm font-black">تحلیل سهمیه کارتنی {city}</h3>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-200/60">
                    {cityTierData.tierLabel}
                  </span>
                </div>

                {/* Progressive 3 Steps (Creative & Short) */}
                <div className="space-y-2 text-xs">
                  <div className="text-[11px] font-extrabold text-slate-700 mb-1 flex items-center justify-between">
                    <span>مراحل پیشرفت و ارتقای سهمیه:</span>
                    <span className="text-emerald-600 font-bold text-[10px]">ارتقای خودکار</span>
                  </div>

                  {cityTierData.growthSteps ? (
                    cityTierData.growthSteps.map((step, idx) => (
                      <div 
                        key={`growth-step-${step.stepNumber}-${idx}`}
                        className={`p-2.5 rounded-2xl border transition-all ${
                          idx === 0 
                            ? "bg-emerald-50/70 border-emerald-200/80 text-slate-800" 
                            : "bg-slate-50/80 border-slate-150 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between font-black text-[11px] mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono ${idx === 0 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                              {step.stepNumber}
                            </span>
                            <span>{step.title}</span>
                          </span>
                          <span className="text-emerald-700 font-mono text-[10.5px]">
                            {step.cartonRange}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium pr-5">
                          <span>سقف ارزش: {step.volumeTomanFormatted}</span>
                          <span className="text-slate-400 font-normal">{step.description} ({step.marginPercent})</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600 text-xs">
                      شروع از ۳۰ کارتن
                    </div>
                  )}
                </div>

                {/* Easy Guarantee Note */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-slate-500">ضمانت صیادی اولیه:</span>
                  <span className="font-mono text-slate-900 text-[11px]">{cityTierData.guaranteeLimitFormatted}</span>
                </div>

                <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">
                  💡 شروع آسان در {cityTierData.cityName} با حداقل {cityTierData.starterMinCartons} ({cityTierData.initialMinOrderFormatted}) بدون ریسک انبارداری؛ سهمیه و تخفیف‌ها پس از هر دوره سفارش به صورت اتوماتیک افزایش می‌یابد.
                </p>
              </div>

              {/* Exclusive Benefits Card */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-3xl p-5 sm:p-6 space-y-3.5 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-900">
                  <ShieldCheck size={20} className="text-emerald-700" />
                  <h3 className="text-xs sm:text-sm font-black">مزایای انحصاری عاملیت</h3>
                </div>
                <ul className="space-y-2 text-xs font-bold text-slate-700">
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>قیمت دست اول درب کارخانه با بالاترین حاشیه سود</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>عدم فروش مستقیم کارخانه به سایر فروشگاه‌های شهر شما</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>تسهیلات خرید چکی با اعتبار‌سنجی بانکی صیاد</span>
                  </li>
                </ul>
              </div>

              {/* Direct Support Contact */}
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                  <Phone size={15} className="text-emerald-600" />
                  <span>واحد هماهنگی نمایندگی‌های سراسر کشور</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">تلفن مستقیم:</span>
                  <a href="tel:09999123001" className="font-mono font-black text-emerald-700 text-xs sm:text-sm" dir="ltr">
                    ۰۹۹۹ ۹۱۲ ۳۰۰۱
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Interactive Automated City Tier Calculator Tab */}
        {activeTab === 'calculator' && (
          <motion.div
            key="calculator"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                  <Calculator size={14} className="text-emerald-600" />
                  سامانه محاسبات هوشمند سهمیه و رتبه‌بندی جمعیتی شهرها
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  استعلام آنلاین سقف نمایندگی، تعداد کارتن و شرایط ضمانت بر اساس کشش شهر
                </h2>
                <p className="text-xs font-bold text-slate-500 leading-relaxed max-w-3xl">
                  در پلتفرم دست اول، سهمیه سفارشات بر اساس ظرفیت واقعی شهر <span className="text-emerald-700 font-black">{cityTierData.cityName}</span> ({cityTierData.tierLabel}) تنظیم می‌شود. برای شهرهای کوچک و متوسط مانند {cityTierData.cityName}، شرایط ورود تسهیل‌شده با حداقل سفارش <span className="text-emerald-700 font-black">{cityTierData.starterMinCartons} ({cityTierData.initialMinOrderFormatted})</span> در نظر گرفته شده تا تمامی همکاران محلی بتوانند به‌راحتی فعالیت خود را آغاز کنند.
                </p>
              </div>

              {/* Quick City Selector Chips */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-black text-slate-700">انتخاب سریع کلان‌شهرها و مراکز استان:</span>
                <div className="flex flex-wrap gap-2">
                  {quickCities.map((qc, qcIdx) => {
                    const isSelected = city === qc.name;
                    return (
                      <button
                        key={`qc-${qc.name}-${qcIdx}`}
                        onClick={() => {
                          setCity(qc.name);
                          setProvince(qc.prov);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                          isSelected 
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20" 
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                        }`}
                      >
                        {qc.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Calculator Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-90">شروع آسان (ورود)</span>
                    <Package size={20} className="text-emerald-100" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black font-mono">
                    {cityTierData.starterMinCartons}
                  </h4>
                  <p className="text-[10px] text-emerald-100 font-bold">
                    حداقل سفارش شروع عاملیت ({cityTierData.initialMinOrderFormatted})
                  </p>
                </div>

                <div className="bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-90">توزیع ماهانه تثبیت</span>
                    <TrendingUp size={20} className="text-slate-200" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black font-mono">
                    {cityTierData.monthlyCartons}
                  </h4>
                  <p className="text-[10px] text-slate-300 font-bold">
                    ظرفیت تأمین پیوسته ماهانه در فاز دوم
                  </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-amber-700 text-white rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-90">سقف سهمیه پلکانی</span>
                    <Coins size={20} className="text-emerald-100" />
                  </div>
                  <h4 className="text-lg sm:text-xl font-black font-mono">
                    {cityTierData.monthlyQuotaCeilingFormatted}
                  </h4>
                  <p className="text-[10px] text-emerald-100 font-bold">
                    سقف خرید ماهانه با نرخ مصوب مستقیم کارخانه
                  </p>
                </div>

                <div className="bg-gradient-to-br from-teal-700 to-slate-800 text-white rounded-2xl p-5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold opacity-90">ضمانت صیادی اولیه</span>
                    <ShieldCheck size={20} className="text-teal-200" />
                  </div>
                  <h4 className="text-base sm:text-lg font-black font-mono">
                    {cityTierData.guaranteeLimitFormatted}
                  </h4>
                  <p className="text-[10px] text-teal-200 font-bold">
                    تسهیلات چکی پس از ثبت اولین دوره سفارش
                  </p>
                </div>
              </div>

              {/* Demographic Tier Breakdown Comparison Table */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-black text-slate-900">جدول رتبه‌بندی جمعیتی شهرها، تعداد کارتن و سقف‌های مصوب</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-black">
                      <tr>
                        <th className="p-3">رده جمعیتی</th>
                        <th className="p-3">نمونه شهرها</th>
                        <th className="p-3">شروع آسان اولیه</th>
                        <th className="p-3">ظرفیت تثبیت ماهانه</th>
                        <th className="p-3">سقف سهمیه پلکانی</th>
                        <th className="p-3">ضمانت صیادی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                      <tr className={cityTierData.tier === 1 ? "bg-emerald-50/80 text-slate-900 font-black" : ""}>
                        <td className="p-3">سطح ۱: کلان‌شهرهای بالای ۱.۵ میلیون</td>
                        <td className="p-3">تهران، مشهد، اصفهان، کرج، شیراز، تبریز، قم، اهواز</td>
                        <td className="p-3 font-mono text-emerald-700 font-black">۳۰ تا ۶۰ کارتن (۳۰-۶۰ م)</td>
                        <td className="p-3 font-mono">۱۲۰ تا ۲۵۰ کارتن</td>
                        <td className="p-3 font-mono">۴۰۰ تا ۶۵۰ میلیون</td>
                        <td className="p-3 font-mono">۱۰۰ تا ۱۵۰ میلیون</td>
                      </tr>
                      <tr className={cityTierData.tier === 2 ? "bg-emerald-50/80 text-slate-900 font-black" : ""}>
                        <td className="p-3">سطح ۲: مراکز استان پرجمعیت (۳۵۰ هزار تا ۱.۲ م)</td>
                        <td className="p-3">کرمانشاه، ارومیه، رشت، زاهدان، همدان، کرمان، یزد، بندرعباس، اراک...</td>
                        <td className="p-3 font-mono text-emerald-700 font-black">۲۵ تا ۵۰ کارتن (۲۵-۵۰ م)</td>
                        <td className="p-3 font-mono">۸۰ تا ۱۵۰ کارتن</td>
                        <td className="p-3 font-mono">۳۰۰ تا ۴۵۰ میلیون</td>
                        <td className="p-3 font-mono">۷۰ تا ۱۰۰ میلیون</td>
                      </tr>
                      <tr className={cityTierData.tier === 3 ? "bg-emerald-50/80 text-slate-900 font-black" : ""}>
                        <td className="p-3">سطح ۳: شهرهای متوسط و صنعتی (۱۰۰ تا ۳۵۰ هزار)</td>
                        <td className="p-3">کاشان، دزفول، بابل، آمل، ساوه، سیرجان، مراغه، رفسنجان، ملایر...</td>
                        <td className="p-3 font-mono text-emerald-700 font-black">۲۰ تا ۴۰ کارتن (۲۰-۴۰ م)</td>
                        <td className="p-3 font-mono">۵۰ تا ۱۰۰ کارتن</td>
                        <td className="p-3 font-mono">۱۸۰ تا ۲۸۰ میلیون</td>
                        <td className="p-3 font-mono">۴۰ تا ۷۰ میلیون</td>
                      </tr>
                      <tr className={cityTierData.tier === 4 ? "bg-emerald-50/80 text-slate-900 font-black" : ""}>
                        <td className="p-3">سطح ۴: شهرستان‌ها و توزیع منطقه‌ای (زیر ۱۰۰ هزار)</td>
                        <td className="p-3">سایر شهرستان‌ها و مناطق تابعه استانی</td>
                        <td className="p-3 font-mono text-emerald-700 font-black">۱۵ تا ۳۰ کارتن (۱۵-۳۰ م)</td>
                        <td className="p-3 font-mono">۳۰ تا ۶۰ کارتن</td>
                        <td className="p-3 font-mono">۱۰۰ تا ۱۶۰ میلیون</td>
                        <td className="p-3 font-mono">۲۵ تا ۴۰ میلیون</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('form')}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <span>ثبت درخواست برای {city}</span>
                  <ArrowLeft size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'benefits' && (
          <motion.div
            key="benefits"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <DollarSign size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-900">سود تضمین‌شده ۱۸٪ تا ۳۲٪</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  با خرید مستقیم تناژی از خط تولید کارخانه، مابه‌التفاوت قیمت مصرف‌کننده و قیمت توزیع عمده مستقیماً به حساب نماینده اختصاص می‌یابد.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <Truck size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-900">لجستیک و باربری بدون دغدغه</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  ارسال مستقیم با ناوگان باربری بیمه شده از درب کارخانه به انبار نماینده همراه با بارنامه رسمی و پلمپ سربی.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-900">حمایت بازاریابی و مشتریان منطقه‌ای</h3>
                <p className="text-xs font-bold text-slate-500 leading-relaxed">
                  تمام سفارش‌های خرد و سوپرمارکت‌های استان ثبت‌شده در سامانه، به نماینده رسمی همان منطقه ارجاع داده خواهد شد.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tracking' && (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
              <h3 className="text-base font-black text-slate-900">پیگیری پرونده‌های ثبت‌شده</h3>
              {(() => {
                const requests = JSON.parse(localStorage.getItem("dastavval_agency_requests") || "[]");
                if (requests.length === 0) {
                  return (
                    <div className="text-center py-10 text-slate-400 font-bold text-xs space-y-2">
                      <Clock className="mx-auto text-slate-300" size={32} />
                      <p>هنوز درخواستی توسط شما ثبت نشده است.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {requests.map((r: any, idx: number) => (
                      <div key={`req-trace-${idx}`} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-emerald-700 text-sm">{r.code}</span>
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-md">{r.status}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">متقاضی: {r.fullName} ({r.companyName || 'شخصی'}) - منطقه: {r.province} ({r.city})</p>
                          {r.monthlyQuotaCeilingFormatted && (
                            <p className="text-[11px] font-black text-emerald-700">سقف سهمیه مصوب: {r.monthlyQuotaCeilingFormatted}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{r.date}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATIVE FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {showToast && trackingCode && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-lg"
          >
            <div className="relative overflow-hidden rounded-3xl bg-slate-900/95 backdrop-blur-xl text-white p-4 sm:p-5 border border-emerald-500/40 shadow-2xl shadow-emerald-950/40">
              {/* Top Accent Gradient Glow */}
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-inner">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-white">درخواست نمایندگی با موفقیت ارسال شد</h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        پرونده جدید
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-bold leading-relaxed">
                      پرونده منطقه <span className="text-emerald-300 font-black">{province} ({city})</span> ثبت گردید و حساب کاربری شما فعال شد.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowToast(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Interactive Tracking Code & Action Strip */}
              <div className="mt-3.5 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  <span className="text-[11px] text-slate-400">کد رهگیری:</span>
                  <span className="font-mono font-black text-emerald-400 text-xs" dir="ltr">{trackingCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyTrackingCode}
                    className="mr-auto px-2 py-0.5 rounded-md bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-emerald-500/30"
                  >
                    {toastCopied ? (
                      <>
                        <CheckCheck size={11} className="text-emerald-300" />
                        <span>کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={11} />
                        <span>کپی کد</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowToast(false);
                    window.dispatchEvent(new CustomEvent('dastavval_open_user_panel'));
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  <span>مشاهده در پنل</span>
                  <ExternalLink size={12} />
                </button>
              </div>

              {/* Progress countdown bar */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-100 ease-linear"
                  style={{ width: `${toastProgress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SMS OTP PHONE VERIFICATION MODAL */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-emerald-200 space-y-5 text-right relative overflow-hidden"
              dir="rtl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">تأیید پیامکی شماره همراه</h3>
                    <p className="text-[10.5px] text-slate-500 font-bold">الزام امنیتی جهت ثبت درخواست رسمی عاملیت</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Explanation & Phone display */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>کد ۵ رقمی به این شماره پیامک شد:</span>
                  <span className="font-mono font-black text-emerald-800 text-sm" dir="ltr">{mobile}</span>
                </div>
                <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                  با تایید پیامک، حساب کاربری شما ایجاد شده و پرونده نمایندگی شما مستقیماً در کارتابل مدیریت ثبت می‌گردد.
                </p>
              </div>

              {/* Alerts & Messages */}
              {otpSuccess && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  <span>{otpSuccess}</span>
                </div>
              )}

              {otpError && (
                <div className="p-2.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 flex items-center gap-1.5">
                  <ShieldAlert size={15} className="shrink-0 text-rose-600" />
                  <span>{otpError}</span>
                </div>
              )}

              {/* 5-Digit OTP Input Grid */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-700 text-center">
                  کد ۵ رقمی دریافتی را وارد فرمایید:
                </label>
                <div className="flex justify-center gap-2 sm:gap-3" dir="ltr">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={`dealer-otp-${idx}`}
                      ref={otpInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePasteDigits : undefined}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-mono font-black bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl outline-hidden transition-all shadow-2xs"
                    />
                  ))}
                </div>
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
                {otpTimer > 0 ? (
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock size={13} />
                    <span>ارسال مجدد تا:</span>
                    <span className="font-mono font-black text-emerald-700">
                      {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={otpLoading}
                    onClick={handleSendDealershipOtp}
                    className="text-emerald-700 hover:text-emerald-800 font-black flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw size={13} />
                    <span>ارسال مجدد کد پیامکی</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={otpLoading || otpDigits.join("").length < 5}
                  onClick={() => handleVerifyDealershipOtp(otpDigits.join(""))}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {otpLoading ? (
                    <span>در حال بررسی و ثبت...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>تأیید پیامک و ثبت نهایی درخواست</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ویرایش شماره و بازگشت به فرم
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
