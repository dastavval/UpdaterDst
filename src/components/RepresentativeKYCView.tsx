import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Building2, 
  User, 
  CreditCard, 
  MapPin, 
  Calendar, 
  Phone, 
  Save, 
  Trash2, 
  Eye, 
  Clock, 
  Sparkles, 
  Award, 
  RotateCcw,
  Check,
  X,
  ExternalLink,
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  RepresentativeKycData, 
  getRepresentativeKyc, 
  saveRepresentativeKyc, 
  isValidIranianNationalCode,
  formatNationalCode
} from "../lib/kyc-helper";

interface RepresentativeKYCViewProps {
  user: any;
  onKycUpdated?: (kycData: RepresentativeKycData) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export default function RepresentativeKYCView({
  user,
  onKycUpdated,
  onClose,
  isModal = false
}: RepresentativeKYCViewProps) {
  const userIdentifier = user?.phone || user?.agencyCode || user?.id || "REP-USER";
  
  // Existing KYC record
  const [kycRecord, setKycRecord] = useState<RepresentativeKycData | null>(() => {
    return getRepresentativeKyc(userIdentifier);
  });

  // Form inputs
  const [fullName, setFullName] = useState(kycRecord?.fullName || user?.name || "");
  const [nationalCode, setNationalCode] = useState(kycRecord?.nationalCode || user?.nationalCode || "");
  const [fatherName, setFatherName] = useState(kycRecord?.fatherName || "");
  const [birthDate, setBirthDate] = useState(kycRecord?.birthDate || "1365/01/01");
  const [mobile, setMobile] = useState(kycRecord?.mobile || user?.phone || user?.mobile || "");
  const [phone, setPhone] = useState(kycRecord?.phone || user?.tel || "");
  const [companyName, setCompanyName] = useState(kycRecord?.companyName || user?.company || user?.agencyName || "");
  
  const [province, setProvince] = useState(kycRecord?.province || user?.province || "خراسان رضوی");
  const [city, setCity] = useState(kycRecord?.city || user?.city || "مشهد");
  const [postalCode, setPostalCode] = useState(kycRecord?.postalCode || "");
  const [warehouseAddress, setWarehouseAddress] = useState(kycRecord?.warehouseAddress || user?.address || "");
  const [warehouseAreaM2, setWarehouseAreaM2] = useState<string | number>(kycRecord?.warehouseAreaM2 || "250");
  const [distributionVehiclesCount, setDistributionVehiclesCount] = useState<string | number>(kycRecord?.distributionVehiclesCount || "2");

  // Document attachments (Base64)
  const [nationalCardFrontUrl, setNationalCardFrontUrl] = useState(kycRecord?.nationalCardFrontUrl || "");
  const [nationalCardBackUrl, setNationalCardBackUrl] = useState(kycRecord?.nationalCardBackUrl || "");
  const [businessLicenseUrl, setBusinessLicenseUrl] = useState(kycRecord?.businessLicenseUrl || "");
  const [warehouseDeedUrl, setWarehouseDeedUrl] = useState(kycRecord?.warehouseDeedUrl || "");
  const [promissoryOrChequeUrl, setPromissoryOrChequeUrl] = useState(kycRecord?.promissoryOrChequeUrl || "");
  const [selfieWithIdUrl, setSelfieWithIdUrl] = useState(kycRecord?.selfieWithIdUrl || "");

  // UI States
  const [activeSubSection, setActiveSubSection] = useState<'status' | 'identity' | 'warehouse' | 'documents'>('identity');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Live Camera Modal State
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamTargetField, setWebcamTargetField] = useState<'front' | 'back' | 'selfie' | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync state if user changes
  useEffect(() => {
    const existing = getRepresentativeKyc(userIdentifier);
    if (existing) {
      setKycRecord(existing);
      setFullName(existing.fullName || user?.name || "");
      setNationalCode(existing.nationalCode || "");
      setFatherName(existing.fatherName || "");
      setBirthDate(existing.birthDate || "");
      setMobile(existing.mobile || user?.phone || "");
      setPhone(existing.phone || "");
      setCompanyName(existing.companyName || user?.company || "");
      setProvince(existing.province || user?.province || "تهران");
      setCity(existing.city || user?.city || "تهران");
      setPostalCode(existing.postalCode || "");
      setWarehouseAddress(existing.warehouseAddress || user?.address || "");
      setWarehouseAreaM2(existing.warehouseAreaM2 || "200");
      setDistributionVehiclesCount(existing.distributionVehiclesCount || "2");
      setNationalCardFrontUrl(existing.nationalCardFrontUrl || "");
      setNationalCardBackUrl(existing.nationalCardBackUrl || "");
      setBusinessLicenseUrl(existing.businessLicenseUrl || "");
      setWarehouseDeedUrl(existing.warehouseDeedUrl || "");
      setPromissoryOrChequeUrl(existing.promissoryOrChequeUrl || "");
      setSelfieWithIdUrl(existing.selfieWithIdUrl || "");
    }
  }, [user, userIdentifier]);

  // National Code Live Validation
  const isNationalCodeValid = isValidIranianNationalCode(nationalCode);

  // File Upload Helper (Compresses to lightweight Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setErrorToast("لطفاً یک فایل تصویری (JPG یا PNG) انتخاب فرمایید.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        setter(compressedBase64);
        setSuccessToast("تصویر مدرک با موفقیت بارگذاری شد.");
        setTimeout(() => setSuccessToast(null), 3000);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Webcam Capture Handler
  const startWebcam = async (target: 'front' | 'back' | 'selfie') => {
    setWebcamTargetField(target);
    const facingMode = target === 'selfie' ? 'user' : cameraFacing;
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsWebcamActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorToast("دسترسی به وبکم / دوربین مقدور نشد. لطفاً از گزینه بارگذاری فایل استفاده فرمایید.");
      setTimeout(() => setErrorToast(null), 4000);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsWebcamActive(false);
    setWebcamTargetField(null);
  };

  const captureWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
      
      if (webcamTargetField === 'front') setNationalCardFrontUrl(dataUrl);
      else if (webcamTargetField === 'back') setNationalCardBackUrl(dataUrl);
      else if (webcamTargetField === 'selfie') setSelfieWithIdUrl(dataUrl);

      stopWebcam();
      setSuccessToast("تصویر با موفقیت از دوربین ثبت گردید.");
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Submit KYC for verification
  const handleSubmitKYC = () => {
    if (!fullName.trim()) {
      setErrorToast("لطفاً نام و نام خانوادگی خود را کامل وارد نمایید.");
      return;
    }
    if (!nationalCode.trim() || !isValidIranianNationalCode(nationalCode)) {
      setErrorToast("کد ملی وارد شده نامعتبر است (باید ۱۰ رقمی و دارای الگوریتم معتبر باشد).");
      return;
    }
    if (!mobile.trim()) {
      setErrorToast("لطفاً شماره موبایل خود را وارد نمایید.");
      return;
    }
    if (!nationalCardFrontUrl) {
      setErrorToast("بارگذاری تصویر روی کارت ملی هوشمند الزامی است.");
      setActiveSubSection('documents');
      return;
    }

    setIsSubmitting(true);
    setErrorToast(null);

    const kycData: RepresentativeKycData = {
      id: userIdentifier,
      userId: user?.id,
      repId: user?.id,
      agencyCode: user?.agencyCode || `AGN-1405-${Math.floor(1000 + Math.random() * 9000)}`,
      fullName: fullName.trim(),
      nationalCode: nationalCode.trim(),
      fatherName: fatherName.trim(),
      birthDate: birthDate.trim(),
      mobile: mobile.trim(),
      phone: phone.trim(),
      companyName: companyName.trim(),
      province: province.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      warehouseAddress: warehouseAddress.trim(),
      warehouseAreaM2: warehouseAreaM2,
      distributionVehiclesCount: distributionVehiclesCount,
      nationalCardFrontUrl,
      nationalCardBackUrl,
      businessLicenseUrl,
      warehouseDeedUrl,
      promissoryOrChequeUrl,
      selfieWithIdUrl,
      status: 'pending', // submitted, awaiting admin review
      submittedAt: new Date().toISOString()
    };

    const saved = saveRepresentativeKyc(kycData);
    setIsSubmitting(false);

    if (saved) {
      setKycRecord(kycData);
      if (onKycUpdated) onKycUpdated(kycData);
      setSuccessToast("مدارک هویتی شما با موفقیت ثبت شد و در صف بررسی کارشناسان قرار گرفت.");
      setTimeout(() => setSuccessToast(null), 5000);
    } else {
      setErrorToast("خطا در ذخیره‌سازی مدارک. لطفاً دوباره تلاش فرمایید.");
    }
  };

  const currentStatus = kycRecord?.status || 'unsubmitted';

  return (
    <div className={`text-right font-sans ${isModal ? 'p-1' : 'space-y-6'}`} dir="rtl">
      {/* Top Banner & Status Indicator */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-indigo-800/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
              currentStatus === 'verified'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-900/30'
                : currentStatus === 'pending'
                ? 'bg-gradient-to-br from-emerald-500 to-orange-600 shadow-amber-900/30'
                : currentStatus === 'rejected'
                ? 'bg-gradient-to-br from-emerald-500 to-red-700 shadow-red-900/30'
                : 'bg-gradient-to-br from-emerald-600 to-purple-700 shadow-indigo-900/30'
            }`}>
              {currentStatus === 'verified' ? (
                <ShieldCheck size={28} className="text-white animate-pulse" />
              ) : currentStatus === 'pending' ? (
                <Clock size={28} className="text-white animate-spin" style={{ animationDuration: '6s' }} />
              ) : currentStatus === 'rejected' ? (
                <ShieldAlert size={28} className="text-white" />
              ) : (
                <Award size={28} className="text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">
                  احراز هویت و تأیید مدارک رسمی نماینده
                </h2>
                
                {/* Status Badge */}
                {currentStatus === 'verified' && (
                  <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    احراز هویت تأیید شده (رسمی)
                  </span>
                )}
                {currentStatus === 'pending' && (
                  <span className="bg-emerald-500/30 text-amber-300 border border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock size={12} />
                    در حال بررسی توسط کارشناسان
                  </span>
                )}
                {currentStatus === 'rejected' && (
                  <span className="bg-emerald-500/30 text-rose-300 border border-rose-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle size={12} />
                    نیاز به ویرایش و ارسال مجدد
                  </span>
                )}
                {currentStatus === 'unsubmitted' && (
                  <span className="bg-emerald-500/30 text-indigo-300 border border-indigo-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                    مدارک هنوز ارسال نشده
                  </span>
                )}
              </div>

              <p className="text-xs text-emerald-200/80 font-medium mt-1 leading-relaxed max-w-2xl">
                با بارگذاری کارت ملی و اطلاعات ثبتی انبار، هویت رسمی عاملیت شما تایید شده و گواهینامه معتبر بازرگانی و سهمیه‌های خرید کارخانه فعال می‌گردد.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="self-start md:self-center p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Rejection Alert if applicable */}
        {currentStatus === 'rejected' && kycRecord?.rejectionReason && (
          <div className="mt-4 p-3.5 bg-emerald-500/20 border border-rose-400/30 rounded-2xl flex items-center gap-3 text-emerald-200 text-xs">
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-rose-300">علت عدم تأیید کارشناس: </span>
              <span>{kycRecord.rejectionReason}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs / Sub-Sections */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubSection('identity')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubSection === 'identity'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User size={15} className={activeSubSection === 'identity' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>۱. مشخصات هویتی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('warehouse')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubSection === 'warehouse'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 size={15} className={activeSubSection === 'warehouse' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>۲. انبار و لجستیک</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubSection('documents')}
          className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubSection === 'documents'
              ? 'bg-white text-indigo-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload size={15} className={activeSubSection === 'documents' ? 'text-emerald-600' : 'text-slate-400'} />
          <span>۳. آپلود کارت ملی و مدارک</span>
          {nationalCardFrontUrl && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {/* Main Form Content */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
        {/* SUBSECTION 1: PERSONAL & IDENTITY */}
        {activeSubSection === 'identity' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <User size={17} className="text-emerald-600" />
                <span>اطلاعات شناسنامه‌ای و کد ملی نماینده</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                اطلاعات زیر مستقیماً با پایگاه داده ثبت احوال و سامانه اصناف تطبیق داده خواهد شد.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  نام و نام خانوادگی کامل (مطابق کارت ملی): <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: علی رضایی طباطبایی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>

              {/* National Code with check algorithm */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 block">
                    کد ملی (۱۰ رقم): <span className="text-emerald-500">*</span>
                  </label>
                  {nationalCode && (
                    <span className={`text-[10px] font-bold flex items-center gap-1 ${
                      isNationalCodeValid ? 'text-emerald-600' : 'text-emerald-500'
                    }`}>
                      {isNationalCodeValid ? (
                        <>
                          <CheckCircle2 size={11} />
                          کد ملی معتبر است
                        </>
                      ) : (
                        <>
                          <AlertCircle size={11} />
                          کد ملی نامعتبر
                        </>
                      )}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={nationalCode}
                  onChange={(e) => setNationalCode(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="مثال: 0941234567"
                  dir="ltr"
                  className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs font-mono text-center font-bold outline-none transition-all ${
                    nationalCode && !isNationalCodeValid
                      ? 'border-rose-300 text-emerald-700 focus:ring-emerald-100'
                      : 'border-slate-200 text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  }`}
                />
              </div>

              {/* Father Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  نام پدر:
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="مثال: محمد"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  تاریخ تولد (سال/ماه/روز):
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  placeholder="مثال: 1365/04/18"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Mobile Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  شماره تلفن همراه (احراز پیامکی): <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="09123456789"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Landline Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  تلفن ثابت دفتر یا انبار:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="051-38400000"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setActiveSubSection('warehouse')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>مرحله بعد: مشخصات انبار و توزیع</span>
                <ChevronLeft size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* SUBSECTION 2: WAREHOUSE & LOGISTICS */}
        {activeSubSection === 'warehouse' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Building2 size={17} className="text-emerald-600" />
                <span>مشخصات مرکز توزیع، انبار و ناوگان لجستیکی</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                این اطلاعات برای تخصیص بار کارخانجات و محاسبه سهمیه ارسال مستقیم استفاده می‌شود.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Company / Business Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  نام موسسه، شرکت یا بنکداری:
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="مثال: بازرگانی و پخش رضایی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Province */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  استان محل فعالیت:
                </label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="مثال: خراسان رضوی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  شهرستان محل فعالیت:
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: مشهد / نیشابور"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Postal Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  کد پستی ۱۰ رقمی انبار:
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="مثال: 9173512345"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Warehouse Space */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  متراژ تقریبی انبار مسقف (مترمربع):
                </label>
                <input
                  type="text"
                  value={warehouseAreaM2}
                  onChange={(e) => setWarehouseAreaM2(e.target.value)}
                  placeholder="مثال: 300"
                  dir="ltr"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-center text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Vehicles */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">
                  تعداد خودروهای فعال توزیع و پخش:
                </label>
                <input
                  type="text"
                  value={distributionVehiclesCount}
                  onChange={(e) => setDistributionVehiclesCount(e.target.value)}
                  placeholder="مثال: 2 دستگاه وانت / ایسوزو"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-bold focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            {/* Warehouse Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 block">
                نشانی دقیق پستی انبار مرکزی جهت تخلیه بار کارخانه:
              </label>
              <textarea
                rows={2}
                value={warehouseAddress}
                onChange={(e) => setWarehouseAddress(e.target.value)}
                placeholder="مثال: خیابان مصلی، کوچه مصلی ۷، پلاک ۱۲، مجتمع انبارداری رضایی"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:bg-white focus:border-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setActiveSubSection('identity')}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                <span>مرحله قبل</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSubSection('documents')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>مرحله بعد: آپلود مدارک و کارت ملی</span>
                <ChevronLeft size={15} />
              </button>
            </div>
          </motion.div>
        )}

        {/* SUBSECTION 3: DOCUMENTS UPLOADER & WEBCAM */}
        {activeSubSection === 'documents' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Upload size={17} className="text-emerald-600" />
                <span>بارگذاری مدارک هویتی، کارت ملی و پروانه فعالیت</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                می‌توانید عکس کارت ملی را آپلود کنید یا مستقیماً با وبکم / دوربین عکاسی فرمایید.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. National Card Front (MANDATORY) */}
              <div className="p-4.5 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={17} className="text-emerald-600" />
                    <span className="text-xs font-black text-slate-800">
                      روی کارت ملی هوشمند <span className="text-emerald-500">* الزامی</span>
                    </span>
                  </div>
                  {nationalCardFrontUrl && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Check size={11} /> بارگذاری شده
                    </span>
                  )}
                </div>

                {nationalCardFrontUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[16/10] flex items-center justify-center">
                    <img
                      src={nationalCardFrontUrl}
                      alt="National Card Front"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(nationalCardFrontUrl)}
                        className="p-2 bg-white/90 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-white cursor-pointer"
                      >
                        <Eye size={13} /> مشاهده
                      </button>
                      <button
                        type="button"
                        onClick={() => setNationalCardFrontUrl("")}
                        className="p-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Trash2 size={13} /> حذف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                        <Upload size={14} className="text-emerald-600" />
                        <span>انتخاب فایل عکس</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setNationalCardFrontUrl)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => startWebcam('front')}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                      >
                        <Camera size={14} />
                        <span>عکاسی وبکم</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 text-center">
                      تصویر باید خوانا، واضح و بدون بازتاب نور شدید باشد.
                    </p>
                  </div>
                )}
              </div>

              {/* 2. National Card Back */}
              <div className="p-4.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={17} className="text-slate-600" />
                    <span className="text-xs font-black text-slate-800">
                      پشت کارت ملی هوشمند (اختیاری)
                    </span>
                  </div>
                  {nationalCardBackUrl && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Check size={11} /> بارگذاری شده
                    </span>
                  )}
                </div>

                {nationalCardBackUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[16/10] flex items-center justify-center">
                    <img
                      src={nationalCardBackUrl}
                      alt="National Card Back"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(nationalCardBackUrl)}
                        className="p-2 bg-white/90 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-white cursor-pointer"
                      >
                        <Eye size={13} /> مشاهده
                      </button>
                      <button
                        type="button"
                        onClick={() => setNationalCardBackUrl("")}
                        className="p-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Trash2 size={13} /> حذف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <label className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                      <Upload size={14} className="text-slate-600" />
                      <span>انتخاب فایل</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setNationalCardBackUrl)}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => startWebcam('back')}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Camera size={14} />
                      <span>عکاسی</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Business License / Trade Permit */}
              <div className="p-4.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={17} className="text-slate-600" />
                    <span className="text-xs font-black text-slate-800">
                      پروانه کسب یا جواز فعالیت بنکداری
                    </span>
                  </div>
                  {businessLicenseUrl && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Check size={11} /> بارگذاری شده
                    </span>
                  )}
                </div>

                {businessLicenseUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[16/10] flex items-center justify-center">
                    <img
                      src={businessLicenseUrl}
                      alt="Business License"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(businessLicenseUrl)}
                        className="p-2 bg-white/90 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-white cursor-pointer"
                      >
                        <Eye size={13} /> مشاهده
                      </button>
                      <button
                        type="button"
                        onClick={() => setBusinessLicenseUrl("")}
                        className="p-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Trash2 size={13} /> حذف
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                    <Upload size={14} className="text-slate-600" />
                    <span>آپلود تصویر پروانه کسب یا کارت بازرگانی</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setBusinessLicenseUrl)}
                    />
                  </label>
                )}
              </div>

              {/* 4. Selfie with National ID (Biometric Verification) */}
              <div className="p-4.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera size={17} className="text-purple-600" />
                    <span className="text-xs font-black text-slate-800">
                      تصویر چهره نماینده با کارت ملی (تطبیق فوری)
                    </span>
                  </div>
                  {selfieWithIdUrl && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                      <Check size={11} /> ثبت شده
                    </span>
                  )}
                </div>

                {selfieWithIdUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white aspect-[16/10] flex items-center justify-center">
                    <img
                      src={selfieWithIdUrl}
                      alt="Selfie with ID"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewImage(selfieWithIdUrl)}
                        className="p-2 bg-white/90 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-white cursor-pointer"
                      >
                        <Eye size={13} /> مشاهده
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelfieWithIdUrl("")}
                        className="p-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 cursor-pointer"
                      >
                        <Trash2 size={13} /> حذف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startWebcam('selfie')}
                      className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                    >
                      <Camera size={14} />
                      <span>عکاسی سلفی با کارت ملی</span>
                    </button>
                    <label className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all">
                      <Upload size={14} className="text-slate-600" />
                      <span>آپلود</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setSelfieWithIdUrl)}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Toasts */}
            {errorToast && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorToast}</span>
              </div>
            )}
            {successToast && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-700 text-xs font-bold">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successToast}</span>
              </div>
            )}

            {/* Submission Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSubSection('warehouse')}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                <span>مرحله قبل</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitKYC}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                <span>{isSubmitting ? "در حال ثبت اطلاعات..." : "ثبت نهایی و ارسال مدارک جهت احراز هویت"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Live Webcam Modal */}
      {isWebcamActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-5 max-w-lg w-full text-white border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                <Camera size={18} className="text-emerald-400" />
                <span>
                  {webcamTargetField === 'front'
                    ? "عکاسی روی کارت ملی هوشمند"
                    : webcamTargetField === 'back'
                    ? "عکاسی پشت کارت ملی"
                    : "عکاسی چهره با کارت ملی"}
                </span>
              </h4>
              <button
                onClick={stopWebcam}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-700">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Guide Overlay Frame */}
              <div className="absolute inset-4 border-2 border-emerald-400/60 rounded-xl border-dashed pointer-events-none flex items-center justify-center">
                <span className="text-[11px] text-emerald-200 bg-black/60 px-2 py-1 rounded-lg backdrop-blur-xs">
                  کارت ملی را داخل این کادر قرار دهید
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
                  setCameraFacing(newFacing);
                  if (webcamTargetField) startWebcam(webcamTargetField);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>تغییر دوربین</span>
              </button>

              <button
                type="button"
                onClick={captureWebcamSnapshot}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                <Camera size={16} />
                <span>ثبت عکس مدرک</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] p-2 bg-slate-900 rounded-2xl border border-slate-800">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 left-3 p-2 rounded-xl bg-black/70 text-white hover:bg-black cursor-pointer z-10"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Document Preview"
              className="max-h-[80vh] w-auto rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
