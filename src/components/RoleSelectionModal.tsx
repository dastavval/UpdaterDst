import React, { useState } from "react";
import { 
  Building2, Factory, Store, Megaphone, Package, 
  Sparkles, CheckCircle2, ArrowLeft, ShieldCheck, 
  Award, TrendingUp, ChevronLeft, Star, Gift, Check,
  X, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { saveUserSession } from "../lib/auth-helper";

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
}

const ROLES: RoleOption[] = [
  {
    id: 'customer',
    title: 'خریدار عمده، فروشگاه و هایپرمارکت',
    subtitle: 'خرید مستقیم از کارخانجات سراسر کشور با قیمت دست اول و فاکتور رسمی',
    icon: Store,
    color: 'text-emerald-700',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-200 hover:border-emerald-500',
    badge: 'خرید بی‌واسطه',
    perks: ['تخفیف پلکانی حجم خرید تا ۱۲٪', 'امکان پرداخت امن امانی یا چکی', 'باربری و ارسال به باربری شهر مقصد'],
    startingBadge: 'silver',
    pointsReward: 30
  },
  {
    id: 'factory',
    title: 'کارخانه، تولیدکننده و برند صنایع غذایی',
    subtitle: 'عرضه مستقیم محصولات خط تولید، جذب نمایندگی و فروش عمده تناژ بالا',
    icon: Factory,
    color: 'text-blue-700',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent border-blue-200 hover:border-blue-500',
    badge: 'تامین‌کننده تایید شده',
    perks: ['معرفی محصولات در ویترین بنکداران کشور', 'تسویه تضمین‌شده در حساب اختصاصی', 'حذف هزینه‌های بازاریابی حضوری'],
    startingBadge: 'vip',
    pointsReward: 50
  },
  {
    id: 'representative',
    title: 'عاملیت و نمایندگی انحصاری استانی / شهرستانی',
    subtitle: 'اخذ امتیاز توزیع انحصاری و سهمیه ماهیانه برندهای معتبر در منطقه',
    icon: Building2,
    color: 'text-purple-700',
    bgGradient: 'from-purple-500/10 via-purple-500/5 to-transparent border-purple-200 hover:border-purple-500',
    badge: 'سهمیه انحصاری',
    perks: ['حاشیه سود توزیع تضمینی ۲۰ تا ۳۵٪', 'ارجاع خریداران شهر مقصد به نماینده', 'صدور گواهی رسمی نمایندگی الکترونیکی'],
    startingBadge: 'gold',
    pointsReward: 40
  },
  {
    id: 'marketer',
    title: 'بازاریاب، سفیر فروش و کارگزار کالا',
    subtitle: 'معرفی خریداران و کارخانجات و دریافت کمیسیون ۲.۵٪ آنی از هر فاکتور',
    icon: Megaphone,
    color: 'text-amber-700',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 hover:border-amber-500',
    badge: 'پورسانت نقدی ۲.۵٪',
    perks: ['لینک اختصاصی دعوت و بازاریابی', 'واریز خودکار پورسانت ظرف ۲۴ ساعت', 'میز کار اختصاصی پیگیری سفارشات'],
    startingBadge: 'silver',
    pointsReward: 35
  },
  {
    id: 'ad_poster',
    title: 'عرضه‌کننده تالار کف بازار و حراج فوری',
    subtitle: 'درج آگهی فروش کالای مازاد زیر قیمت بازار، ضایعات کارتن و تجهیزات',
    icon: Package,
    color: 'text-rose-700',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-200 hover:border-rose-500',
    badge: 'معامله سریع',
    perks: ['نمایش آگهی به هزاران فعال اقتصادی', 'واسطه‌گری امن و ضدکلاهبرداری', 'مدیریت فوری تماس و سفارشات'],
    startingBadge: 'bronze',
    pointsReward: 25
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
  const [city, setCity] = useState(user?.city || 'تهران');
  const [step, setStep] = useState<'select_role' | 'quick_info'>('select_role');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentRoleObj = ROLES.find(r => r.id === selectedRole) || ROLES[0];

  const handleConfirmRole = () => {
    // If user selected role, go to quick info to complete profile or save directly
    if (step === 'select_role') {
      setStep('quick_info');
    } else {
      executeSave();
    }
  };

  const executeSave = () => {
    setIsSubmitting(true);
    
    // Calculate bonus profile points
    const currentScore = user?.profileScore || 20; // 20 for phone verified
    const addedRoleScore = currentRoleObj.pointsReward;
    const finalScore = Math.min(100, currentScore + addedRoleScore + (companyName ? 15 : 0) + (city ? 15 : 0));

    const PENDING_ROLES = ['factory', 'producer', 'representative', 'agent', 'supplier', 'importer', 'seller', 'dealer', 'ad_poster'];
    const isAutoApprovedRole = !PENDING_ROLES.includes(selectedRole);

    const updatedUser = {
      ...user,
      role: selectedRole,
      company: companyName.trim() || user?.company || (selectedRole === 'factory' ? 'کارخانه تولیدی' : selectedRole === 'representative' ? 'دفتر نمایندگی' : 'فروشگاه پخش'),
      city: city.trim() || user?.city || 'تهران',
      badge: currentRoleObj.startingBadge,
      profileScore: finalScore,
      roleSelectedAt: new Date().toISOString(),
      status: isAutoApprovedRole ? 'active' : 'pending_verification',
      isApproved: isAutoApprovedRole,
      isFactoryApproved: isAutoApprovedRole,
      isRepresentativeApproved: isAutoApprovedRole,
      approvalRequestedAt: isAutoApprovedRole ? undefined : new Date().toISOString()
    };

    // If factory, ensure factoryCode
    if (selectedRole === 'factory' && !updatedUser.factoryCode) {
      updatedUser.factoryCode = `FAC-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    // If representative, ensure agencyCode
    if (selectedRole === 'representative' && !updatedUser.agencyCode) {
      updatedUser.agencyCode = `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    // If marketer, ensure agencyCode
    if (selectedRole === 'marketer' && !updatedUser.agencyCode) {
      updatedUser.agencyCode = `AGN-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    saveUserSession(updatedUser);

    setTimeout(() => {
      setIsSubmitting(false);
      onRoleSelected(updatedUser);
      onClose();
    }, 400);
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
        {/* Close Button (only if not mandatory first time) */}
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
                <span>شخصی‌سازی آنی حساب کاربری</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {step === 'select_role' ? 'نوع فعالیت تجاری خود را انتخاب فرمایید' : 'تکمیل سریع نام و شهر فعالیت'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {step === 'select_role' 
                  ? 'جهت دسترسی به قیمت‌های ویژه، امکانات اختصاصی و پاداش‌های فاکتور، نقش خود را مشخص نمایید.' 
                  : 'با تکمیل این ۲ مورد، پروفایل شما فعال و امتیاز هدیه بلافاصله منظور می‌گردد.'}
              </p>
            </div>

            {/* Score Pill */}
            <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                <Gift size={16} />
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-300 font-bold">پاداش این مرحله:</p>
                <p className="text-xs font-black text-amber-300">+{currentRoleObj.pointsReward} امتیاز زرین</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[70vh] overflow-y-auto">
          {step === 'select_role' ? (
            <div className="space-y-3.5">
              <p className="text-xs font-black text-slate-800">
                یکی از دسته‌های زیر متناسب با کسب‌وکار خود را انتخاب فرمایید:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {ROLES.map((role) => {
                  const isSelected = selectedRole === role.id;
                  const Icon = role.icon;
                  return (
                    <motion.div
                      key={role.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
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
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {role.badge}
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
          ) : (
            /* STEP 2: QUICK INFO (NAME & CITY) */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 font-black">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">نقش انتخابی: {currentRoleObj.title}</h4>
                  <p className="text-[11px] text-emerald-800 font-medium mt-0.5">
                    با ثبت نام مجموعه و شهر، حساب کاربری شما فوراً به سطح {currentRoleObj.startingBadge === 'vip' ? 'VIP الماس' : currentRoleObj.startingBadge === 'gold' ? 'طلایی ممتاز' : 'نقره‌ای همکار'} ارتقا می‌یابد.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    نام فروشگاه، شرکت یا برند تجاری:
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="مثال: بازرگانی البرز / فروشگاه کوروش"
                    className="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 block">
                    استان و شهر اصلی فعالیت:
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="مثال: تبریز / مشهد / تهران"
                    className="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
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
          ) : (
            <div className="text-[11px] text-slate-400 font-bold">
              امکان تغییر مجدد نقش در هر زمان از بخش تنظیمات پروفایل وجود دارد.
            </div>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {step === 'select_role' ? (
              <button
                type="button"
                onClick={handleConfirmRole}
                className="px-7 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/25 active:scale-95"
              >
                <span>تایید نقش و ادامه</span>
                <ArrowLeft size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeSave}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/25 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>در حال ذخیره و فعال‌سازی...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>تکمیل حساب و ورود به میز کار</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
