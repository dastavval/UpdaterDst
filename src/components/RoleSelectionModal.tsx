import React, { useState, useMemo } from "react";
import { 
  Building2, Factory, Store, Megaphone, Package, 
  Sparkles, CheckCircle2, ArrowLeft, ShieldCheck, 
  Award, TrendingUp, ChevronLeft, Star, Gift, Check,
  X, UserCheck, Lock, Clock, AlertTriangle, FileCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { saveUserSession } from "../lib/auth-helper";
import { IRAN_PROVINCES_AND_CITIES } from "../utils/dealershipCityTiers";

export interface RoleOption {
  id: 'customer' | 'factory' | 'representative' | 'marketer' | 'ad_poster';
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  bgGradient: string;
  badge: string;
  perks: string[];
  startingBadge: 'bronze' | 'silver' | 'gold' | 'vip';
  pointsReward: number;
  requiresAdminApproval: boolean;
  approvalRequirements?: string;
}

const ROLES: RoleOption[] = [
  {
    id: 'customer',
    title: 'خریدار عمده، فروشگاه و هایپرمارکت',
    subtitle: 'خرید مستقیم از کارخانجات سراسر کشور با قیمت دست اول و فاکتور رسمی',
    icon: Store,
    color: 'text-emerald-700',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200 hover:border-emerald-500',
    badge: 'فعال‌سازی آنی',
    perks: ['تخفیف پلکانی حجم خرید تا ۱۲٪', 'امکان پرداخت امن امانی یا چکی', 'باربری و ارسال به باربری شهر مقصد'],
    startingBadge: 'silver',
    pointsReward: 30,
    requiresAdminApproval: false
  },
  {
    id: 'marketer',
    title: 'بازاریاب، سفیر فروش و کارگزار کالا',
    subtitle: 'معرفی خریداران و کارخانجات و دریافت کمیسیون ۲.۵٪ آنی از هر فاکتور',
    icon: Megaphone,
    color: 'text-amber-700',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 hover:border-amber-500',
    badge: 'فعال‌سازی آنی',
    perks: ['لینک اختصاصی دعوت و بازاریابی', 'واریز خودکار پورسانت ظرف ۲۴ ساعت', 'میز کار اختصاصی پیگیری سفارشات'],
    startingBadge: 'silver',
    pointsReward: 35,
    requiresAdminApproval: false
  },
  {
    id: 'ad_poster',
    title: 'عرضه‌کننده تالار کف بازار و حراج فوری',
    subtitle: 'درج آگهی فروش کالای مازاد زیر قیمت بازار، ضایعات کارتن و تجهیزات',
    icon: Package,
    color: 'text-rose-700',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-200 hover:border-rose-500',
    badge: 'فعال‌سازی آنی',
    perks: ['نمایش آگهی به هزاران فعال اقتصادی', 'واسطه‌گری امن و ضدکلاهبرداری', 'مدیریت فوری تماس و سفارشات'],
    startingBadge: 'bronze',
    pointsReward: 25,
    requiresAdminApproval: false
  },
  {
    id: 'factory',
    title: 'کارخانه، تولیدکننده و برند صنایع غذایی',
    subtitle: 'عرضه مستقیم محصولات خط تولید، جذب نمایندگی و فروش عمده تناژ بالا',
    icon: Factory,
    color: 'text-blue-700',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-200 hover:border-blue-500',
    badge: 'نیازمند تأیید مدیر',
    perks: ['معرفی محصولات در ویترین بنکداران کشور', 'تسویه تضمین‌شده در حساب اختصاصی', 'حذف هزینه‌های بازاریابی حضوری'],
    startingBadge: 'vip',
    pointsReward: 50,
    requiresAdminApproval: true,
    approvalRequirements: 'استعلام پروانه بهره‌برداری وزارت صمت، شناسه ملی شرکت یا پروانه جهاد کشاورزی'
  },
  {
    id: 'representative',
    title: 'عاملیت و نمایندگی انحصاری استانی / شهرستانی',
    subtitle: 'اخذ امتیاز توزیع انحصاری و سهمیه ماهیانه برندهای معتبر در منطقه',
    icon: Building2,
    color: 'text-purple-700',
    bgGradient: 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-200 hover:border-purple-500',
    badge: 'نیازمند تأیید مدیر',
    perks: ['حاشیه سود توزیع تضمینی ۲۰ تا ۳۵٪', 'ارجاع خریداران شهر مقصد به نماینده', 'صدور گواهی رسمی نمایندگی الکترونیکی'],
    startingBadge: 'gold',
    pointsReward: 40,
    requiresAdminApproval: true,
    approvalRequirements: 'احراز سابقه پخش مویرگی، پروانه کسب عمده‌فروشی، انبار و استعلام اعتبار بانکی'
  }
];

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onRoleSelected: (updatedUser: any) => void;
  isInitialSetup?: boolean;
  b2bConfig?: any;
}

export default function RoleSelectionModal({
  isOpen,
  onClose,
  user,
  onRoleSelected,
  isInitialSetup = false,
  b2bConfig
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'customer');
  const [companyName, setCompanyName] = useState(user?.company || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.licenseNumber || user?.companyRegistrationNumber || '');
  const [province, setProvince] = useState<string>(
    user?.province || IRAN_PROVINCES_AND_CITIES.find(p => p.cities.includes(user?.city))?.province || "تهران"
  );
  const [city, setCity] = useState<string>(user?.city || 'تهران');
  const [step, setStep] = useState<'select_role' | 'quick_info' | 'pending_confirmation'>('select_role');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const roleCitiesList = useMemo(() => {
    const match = IRAN_PROVINCES_AND_CITIES.find(p => p.province === province);
    return match ? match.cities : [city || "تهران"];
  }, [province, city]);

  if (!isOpen) return null;

  const currentRoleObj = ROLES.find(r => r.id === selectedRole) || ROLES[0];

  // Determine if user has already been approved for this role by Admin
  const isAlreadyApprovedByAdmin = 
    user?.role === 'admin' ||
    (selectedRole === 'factory' && user?.isFactoryApproved) ||
    (selectedRole === 'representative' && user?.isRepresentativeApproved) ||
    (user?.approvedRoles && user?.approvedRoles.includes(selectedRole));

  const handleConfirmRole = () => {
    if (step === 'select_role') {
      setStep('quick_info');
    } else {
      executeSave();
    }
  };

  const executeSave = () => {
    setIsSubmitting(true);
    
    // Calculate bonus profile points
    const currentScore = user?.profileScore || 20;
    const addedRoleScore = currentRoleObj.pointsReward;
    const finalScore = Math.min(100, currentScore + addedRoleScore + (companyName ? 15 : 0) + (city ? 15 : 0));

    const needsApproval = currentRoleObj.requiresAdminApproval && !isAlreadyApprovedByAdmin;

    // Build the request or direct update
    const effectiveRole = needsApproval 
      ? (user?.role && !['factory', 'representative'].includes(user?.role) ? user.role : 'customer')
      : selectedRole;

    const updatedUser = {
      ...user,
      role: effectiveRole,
      company: companyName.trim() || user?.company || (selectedRole === 'factory' ? 'کارخانه تولیدی' : selectedRole === 'representative' ? 'دفتر نمایندگی' : 'فروشگاه پخش'),
      province: province.trim() || user?.province || 'تهران',
      city: city.trim() || user?.city || 'تهران',
      licenseNumber: licenseNumber.trim() || user?.licenseNumber || '',
      badge: needsApproval ? (user?.badge || 'silver') : currentRoleObj.startingBadge,
      profileScore: finalScore,
      roleSelectedAt: new Date().toISOString(),
      status: 'active',
      
      // Role Approval Tracking
      pendingRole: needsApproval ? selectedRole : undefined,
      pendingRoleTitle: needsApproval ? currentRoleObj.title : undefined,
      pendingRoleRequestDate: needsApproval ? new Date().toISOString() : undefined,
      isPendingRoleApproval: needsApproval,
      roleApprovalStatus: needsApproval ? 'pending_admin_approval' : 'approved',
      
      // Keep existing approvals intact
      isFactoryApproved: selectedRole === 'factory' ? !needsApproval : user?.isFactoryApproved,
      isRepresentativeApproved: selectedRole === 'representative' ? !needsApproval : user?.isRepresentativeApproved
    };

    // If approved factory or representative, ensure code
    if (effectiveRole === 'factory' && !updatedUser.factoryCode) {
      updatedUser.factoryCode = `FAC-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (effectiveRole === 'representative' && !updatedUser.agencyCode) {
      updatedUser.agencyCode = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    if (effectiveRole === 'marketer' && !updatedUser.agencyCode) {
      updatedUser.agencyCode = `AGN-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Save pending request to global list for Admin approval
    if (needsApproval) {
      try {
        const existingRequests = JSON.parse(localStorage.getItem('dastavval_role_requests') || '[]');
        const newReq = {
          id: `req-${Date.now()}`,
          userId: user?.id || user?.phone || 'usr-temp',
          phone: user?.phone || '۰۹۱۲۳۴۵۶۷۸۹',
          userName: user?.name || 'کاربر گرامی',
          company: companyName.trim() || 'نامشخص',
          requestedRole: selectedRole,
          requestedRoleTitle: currentRoleObj.title,
          province,
          city,
          licenseNumber: licenseNumber.trim(),
          submittedAt: new Date().toISOString(),
          status: 'pending'
        };
        const filtered = existingRequests.filter((r: any) => r.phone !== user?.phone || r.requestedRole !== selectedRole);
        filtered.unshift(newReq);
        localStorage.setItem('dastavval_role_requests', JSON.stringify(filtered));
      } catch (e) {
        console.warn("Failed to store role request:", e);
      }
    }

    saveUserSession(updatedUser);

    setTimeout(() => {
      setIsSubmitting(false);
      if (needsApproval) {
        setSubmissionResult({
          user: updatedUser,
          roleTitle: currentRoleObj.title,
          requirements: currentRoleObj.approvalRequirements
        });
        setStep('pending_confirmation');
      } else {
        onRoleSelected(updatedUser);
        onClose();
      }
    }, 450);
  };

  const handleFinishPendingStep = () => {
    if (submissionResult?.user) {
      onRoleSelected(submissionResult.user);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col"
      >
        {/* Close Button */}
        {!isInitialSetup && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer border border-slate-200"
            type="button"
          >
            <X size={16} />
          </button>
        )}

        {/* Top Header */}
        <div className="p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-black">
                <Sparkles size={13} className="text-emerald-400" />
                <span>تعیین سطح تجاری و احراز نقش</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {step === 'select_role' ? 'نوع فعالیت تجاری خود را مشخص فرمایید' : step === 'quick_info' ? 'تکمیل مشخصات و پروانه کسب‌وکار' : 'ثبت درخواست ارتقا و ممیزی مدیریت'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {step === 'select_role' 
                  ? 'نقش‌های عمده‌فروشی و بازاریابی به‌صورت آنی فعال می‌شوند؛ نقش‌های کارخانجات و نمایندگی پس از تأیید مدیر فعال می‌گردند.' 
                  : step === 'quick_info'
                  ? 'جهت اعتبارسنجی معاملات و دسترسی به فاکتورهای رسمی، اطلاعات زیر را وارد نمایید.'
                  : 'درخواست شما با کد پیگیری اختصاصی ثبت و در کارتابل مدیریت قرار گرفت.'}
              </p>
            </div>

            {/* Score Pill */}
            {step !== 'pending_confirmation' && (
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                  <Gift size={16} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-300 font-bold">پاداش ثبت نقش:</p>
                  <p className="text-xs font-black text-amber-300">+{currentRoleObj.pointsReward} امتیاز زرین</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[70vh] overflow-y-auto">
          {step === 'select_role' ? (
            <div className="space-y-3.5">
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 font-bold leading-relaxed">
                <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>سیاست امنیتی دست‌اول:</strong> نقش‌های خریدار عمده و بازاریاب فوراً فعال می‌شوند. جهت حفظ امنیت خریداران، نقش‌های کارخانه تولیدی و نمایندگی رسمی منوط به بررسی پروانه توسط مدیریت است.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {ROLES.map((role) => {
                  const isSelected = selectedRole === role.id;
                  const Icon = role.icon;
                  return (
                    <motion.div
                      key={role.id}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.995 }}
                      onClick={() => setSelectedRole(role.id)}
                      className={`relative p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer bg-gradient-to-r ${role.bgGradient} ${
                        isSelected 
                          ? 'border-emerald-600 ring-4 ring-emerald-500/10 shadow-md bg-emerald-50/40' 
                          : 'border-slate-200 hover:border-slate-300 bg-white shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                            isSelected ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            <Icon size={22} />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900">{role.title}</h4>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                role.requiresAdminApproval
                                  ? 'bg-amber-50 text-amber-900 border-amber-300 flex items-center gap-1'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1'
                              }`}>
                                {role.requiresAdminApproval ? <Lock size={10} /> : <Check size={10} />}
                                <span>{role.badge}</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                              {role.subtitle}
                            </p>

                            {/* Perks Checklist */}
                            <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-slate-600">
                              {role.perks.map((p, idx) => (
                                <span key={idx} className="flex items-center gap-1">
                                  <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                                  <span>{p}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Radio Checkbox */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : step === 'quick_info' ? (
            /* STEP 2: QUICK INFO (NAME & CITY & LICENSE) */
            <div className="space-y-5">
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                currentRoleObj.requiresAdminApproval && !isAlreadyApprovedByAdmin
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-950'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-white ${
                  currentRoleObj.requiresAdminApproval && !isAlreadyApprovedByAdmin ? 'bg-amber-600' : 'bg-emerald-600'
                }`}>
                  {currentRoleObj.requiresAdminApproval && !isAlreadyApprovedByAdmin ? <Lock size={20} /> : <UserCheck size={20} />}
                </div>
                <div>
                  <h4 className="text-xs font-black">نقش انتخابی: {currentRoleObj.title}</h4>
                  <p className="text-[11px] font-medium mt-1 leading-relaxed">
                    {currentRoleObj.requiresAdminApproval && !isAlreadyApprovedByAdmin
                      ? `این نقش نیازمند احراز هویت حقوقی و بررسی توسط مدیریت است (${currentRoleObj.approvalRequirements}). پس از ثبت، درخواست شما در کمتر از ۲۴ ساعت بررسی می‌شود.`
                      : `این نقش فوراً بدون نیاز به معطلی با نشان ${currentRoleObj.startingBadge === 'vip' ? 'VIP الماس' : currentRoleObj.startingBadge === 'gold' ? 'طلایی' : 'نقره‌ای همکار'} فعال می‌گردد.`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-black text-slate-800 block">
                    نام مجموعه / واحد تولیدی / برند تجاری: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: صنایع غذایی البرز / بازرگانی توزیع کوروش"
                    className="w-full px-3.5 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                {currentRoleObj.requiresAdminApproval && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-black text-slate-800 block">
                      شماره پروانه بهره‌برداری / شناسه ثبت شرکت / جواز کسب: <span className="text-amber-700 text-[10px]">(جهت تایید سریع ادمین)</span>
                    </label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="مثال: پروانه بهره‌برداری صمت شماره ۱۲۳۴۵۶ یا شناسه ملی ۱۴۰۰..."
                      className="w-full px-3.5 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    استان محل فعالیت:
                  </label>
                  <select
                    value={province}
                    onChange={(e) => {
                      const newProv = e.target.value;
                      setProvince(newProv);
                      const match = IRAN_PROVINCES_AND_CITIES.find(p => p.province === newProv);
                      if (match && match.cities.length > 0) {
                        setCity(match.capital || match.cities[0]);
                      }
                    }}
                    className="w-full px-3.5 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
                  >
                    {IRAN_PROVINCES_AND_CITIES.map((p, pIdx) => (
                      <option key={`role-prov-${p.province}-${pIdx}`} value={p.province}>{p.province}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    شهرستان اصلی:
                  </label>
                  <select
                    value={roleCitiesList.includes(city) ? city : (roleCitiesList[0] || city)}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer"
                  >
                    {roleCitiesList.map((c, cIdx) => (
                      <option key={`role-city-${c}-${cIdx}`} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>شماره تاییدشده پیامکی: <strong>{user?.phone || '۰۹۹۱۴۷۶۲۴۰۶'}</strong></span>
                </span>
                <span className="text-emerald-700 font-black">احراز هویت شده ✓</span>
              </div>
            </div>
          ) : (
            /* STEP 3: PENDING APPROVAL CONFIRMATION */
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border-2 border-amber-300 shadow-sm animate-pulse">
                <Clock size={32} />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  درخواست ارتقا به «{submissionResult?.roleTitle}» با موفقیت ثبت شد
                </h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  طبق ضوابط ایمنی شبکه دست‌اول، نقش‌های تولیدی و نمایندگی پس از استعلام پروانه توسط واحد بازرسی و ممیزی مدیریت فعال می‌شوند.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right space-y-2 text-xs font-bold text-slate-700">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">وضعیت فعلی دسترسی:</span>
                  <span className="text-emerald-700 font-black">فعال (خریدار عمده و استعلام قیمت)</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">نقش درخواستی:</span>
                  <span className="text-amber-800 font-black">{submissionResult?.roleTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">زمان بررسی ممیزی:</span>
                  <span className="text-slate-800 font-black">حداکثر ۲۴ ساعت کاری</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold text-right flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>می‌توانید هم‌اکنون از کلیه امکانات خرید عمده، قیمت‌های تناژ و ارتباط با بنکداران استفاده فرمایید.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          {step === 'quick_info' ? (
            <button
              type="button"
              onClick={() => setStep('select_role')}
              className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} className="rotate-180" />
              <span>مرحله قبل</span>
            </button>
          ) : step === 'pending_confirmation' ? (
            <div />
          ) : (
            <div className="text-[11px] text-slate-400 font-bold">
              امکان پیگیری وضعیت نقش در پنل کاربری فراهم است.
            </div>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {step === 'select_role' ? (
              <button
                type="button"
                onClick={handleConfirmRole}
                className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/25 active:scale-95"
              >
                <span>ادامه و تکمیل مشخصات</span>
                <ArrowLeft size={16} />
              </button>
            ) : step === 'quick_info' ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeSave}
                className={`px-8 py-3.5 text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
                  currentRoleObj.requiresAdminApproval && !isAlreadyApprovedByAdmin
                    ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-600/25'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-600/25'
                }`}
              >
                {isSubmitting ? (
                  <span>در حال ذخیره و پردازش...</span>
                ) : currentRoleObj.requiresAdminApproval && !isAlreadyApprovedByAdmin ? (
                  <>
                    <FileCheck size={16} />
                    <span>ثبت درخواست و ارسال به ممیزی مدیر</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>تکمیل حساب و فعال‌سازی فوری</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishPendingStep}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/25 active:scale-95"
              >
                <Check size={16} />
                <span>متوجه شدم - ورود به میز کار</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
