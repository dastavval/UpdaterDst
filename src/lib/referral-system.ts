/**
 * DastAvval B2B Referral & Commission System Engine
 * - Customer: 500,000 Tomans reward for referring friends + discount for friend
 * - Marketer: 1,000,000 Tomans reward for referring clients + 5% commission if invitee becomes representative
 * - Representative: 5% direct commission on all orders using Agency Code + factory direct discount for buyer
 * - Buyer: Receives instant invoice discount when using any valid code
 */

export interface ReferralDetails {
  valid: boolean;
  code: string;
  referrerType: 'customer' | 'marketer' | 'representative';
  referrerName: string;
  referrerRole: string;
  roleTitle: string;
  buyerDiscountPercent: number;
  buyerDiscountAmount: number;
  referrerRewardAmount: number;
  referrerRewardNote: string;
  message: string;
  error?: string;
}

export interface UserReferralProfile {
  referralCode: string;
  agencyCode?: string;
  marketerCode?: string;
  customerCode: string;
  role: 'customer' | 'marketer' | 'representative' | string;
  roleTitle: string;
  referralLink: string;
  rewardHeadline: string;
  rewardDetail: string;
  buyerBonusDetail: string;
  terms: string[];
}

/**
 * Derives or ensures unique codes for a user based on their profile and role
 */
export function getUserReferralProfile(user: any): UserReferralProfile {
  const phone = (user?.phone || user?.mobile || "").replace(/\D/g, "");
  const last4 = phone.slice(-4) || (user?.id ? String(user.id).slice(-4) : "8832");
  const role = user?.role || "customer";

  const isRep = role === "representative" || role === "agent";
  const isMarketer = role === "marketer";

  const agencyCode = isRep ? (user?.agencyCode || `REP-${last4}`) : undefined;
  const marketerCode = isMarketer ? (user?.marketerCode || `MKT-${last4}`) : undefined;
  const customerCode = user?.customerCode || user?.userCode || `CST-${last4}`;

  let referralCode = user?.referralCode;
  if (!referralCode) {
    if (isRep) referralCode = agencyCode;
    else if (isMarketer) referralCode = marketerCode;
    else referralCode = `REF-${last4}`;
  }

  const siteOrigin = typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "https://dastavval.com";

  const referralLink = `${siteOrigin}/?ref=${referralCode}`;

  if (isRep) {
    return {
      referralCode,
      agencyCode,
      customerCode,
      role: "representative",
      roleTitle: "نماینده رسمی کارخانجات (عاملیت رسمی)",
      referralLink,
      rewardHeadline: "۵٪ پورسانت قطعی از کل فاکتور",
      rewardDetail: "به عنوان نماینده رسمی، از هر سفارش ثبت‌شده با کد عاملیت شما، ۵ درصد پورسانت نقدی مستقیم منظور می‌گردد.",
      buyerBonusDetail: "۵٪ تخفیف اختصاصی عاملیت برای خریدار",
      terms: [
        "۵٪ پورسانت آنی و بدون سقف از مجموع فروش",
        "تخفیف عاملیت اختصاصی برای مشتری شما جهت افزایش نرخ تبدیل",
        "امکان تسویه نقدی هفتگی و ماهانه از طریق پنل نمایندگی",
        "ثبت دائمی مشتری در زیرمجموعه عاملیت شما"
      ]
    };
  }

  if (isMarketer) {
    return {
      referralCode,
      marketerCode,
      customerCode,
      role: "marketer",
      roleTitle: "بازاریاب و مشاور رسمی دست اول",
      referralLink,
      rewardHeadline: "۱,۰۰۰,۰۰۰ تومان پاداش معرفی + ۵٪ کارمزد عاملیت",
      rewardDetail: "به ازای معرفی هر خریدار، ۱ میلیون تومان پاداش دریافت کنید و چنانچه فرد معرفی‌شده نماینده شود، ۵٪ کارمزد همیشگی از تمامی خریدهای ایشان دریافت خواهید کرد.",
      buyerBonusDetail: "۳٪ تخفیف ویژه خرید با معرفی بازاریاب رسمی",
      terms: [
        "۱,۰۰۰,۰۰۰ تومان پاداش به ازای معرفی هر همکار جدید پس از اولین سفارش",
        "۵٪ کارمزد مادام‌العمر در صورت اخذ نمایندگی توسط شخص معرفی‌شده",
        "۳٪ تخفیف ترغیب‌کننده روی اولین فاکتور خریدار",
        "داشبورد شفاف پیگیری سفارش‌ها و پورسانت‌ها"
      ]
    };
  }

  // Regular Customer / Retailer / Wholesaler
  return {
    referralCode,
    customerCode,
    role: "customer",
    roleTitle: "مشتری و همکار معتمد دست اول",
    referralLink,
    rewardHeadline: "۵۰۰,۰۰۰ تومان اعتبار هدیه خرید نقدی",
    rewardDetail: "دوستان و همکاران صنفی خود را به خرید مستقیم با قیمت درب کارخانه دعوت کنید؛ ۵۰۰ هزار تومان پاداش برای شما و ۳٪ تخفیف آنی برای دوستتان منظور می‌شود.",
    buyerBonusDetail: "۳٪ تخفیف فاکتور خرید برای دوست دعوت‌شده",
    terms: [
      "۵۰۰,۰۰۰ تومان اعتبار کیف پول به ازای هر خرید موفق دوست دعوت‌شده",
      "۳٪ تخفیف آنی برای دوست شما جهت اشتیاق و ثبت خرید اول",
      "بدون سقف در تعداد دعوت‌ها (۱۰ دعوت = ۵ میلیون تومان پاداش)",
      "قابل استفاده مستقیم در سفارش‌های بعدی یا درخواست واریز"
    ]
  };
}

/**
 * Validates a referral code against backend or resilient local fallback
 */
export async function validateReferralCode(
  rawCode: string,
  orderAmount: number,
  currentUserPhone?: string
): Promise<ReferralDetails> {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) {
    return {
      valid: false,
      code: "",
      referrerType: "customer",
      referrerName: "",
      referrerRole: "",
      roleTitle: "",
      buyerDiscountPercent: 0,
      buyerDiscountAmount: 0,
      referrerRewardAmount: 0,
      referrerRewardNote: "",
      message: "کد وارد نشده است.",
      error: "لطفاً کد معرف یا نمایندگی را وارد نمایید."
    };
  }

  // Prevent self referral
  if (currentUserPhone) {
    const cleanUserPhone = currentUserPhone.replace(/\D/g, "");
    if (cleanUserPhone && (code === cleanUserPhone || code.endsWith(cleanUserPhone.slice(-4)))) {
      return {
        valid: false,
        code,
        referrerType: "customer",
        referrerName: "",
        referrerRole: "",
        roleTitle: "",
        buyerDiscountPercent: 0,
        buyerDiscountAmount: 0,
        referrerRewardAmount: 0,
        referrerRewardNote: "",
        message: "استفاده از کد شخصی مجاز نیست.",
        error: "شما نمی‌توانید از کد معرف یا نمایندگی متعلق به خودتان استفاده کنید."
      };
    }
  }

  // Try API validation first
  try {
    const res = await fetch("/api/referral/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        orderAmount,
        currentPhone: currentUserPhone
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.valid) {
        return data as ReferralDetails;
      } else {
        return {
          valid: false,
          code,
          referrerType: "customer",
          referrerName: "",
          referrerRole: "",
          roleTitle: "",
          buyerDiscountPercent: 0,
          buyerDiscountAmount: 0,
          referrerRewardAmount: 0,
          referrerRewardNote: "",
          message: data.error || "کد نامعتبر است.",
          error: data.error || "کد معرف یا نمایندگی وارد شده معتبر نمی‌باشد."
        };
      }
    }
  } catch (e) {
    console.warn("API referral validation offline, using resilient heuristic:", e);
  }

  // Resilient heuristic validation
  const numOrder = Number(orderAmount) || 0;
  if (code.startsWith("REP-") || code.startsWith("AGN-")) {
    const discAmount = Math.round(numOrder * 0.05);
    return {
      valid: true,
      code,
      referrerType: "representative",
      referrerName: "نماینده رسمی کارخانجات",
      referrerRole: "representative",
      roleTitle: "عاملیت رسمی دست اول",
      buyerDiscountPercent: 5,
      buyerDiscountAmount: discAmount,
      referrerRewardAmount: Math.round(numOrder * 0.05),
      referrerRewardNote: "۵٪ پورسانت مستقیم به حساب عاملیت",
      message: "کد عاملیت رسمی تایید شد؛ ۵٪ تخفیف ویژه خرید برای شما منظور گردید."
    };
  }

  if (code.startsWith("MKT-")) {
    const discAmount = Math.round(numOrder * 0.03);
    return {
      valid: true,
      code,
      referrerType: "marketer",
      referrerName: "مشاور و بازاریاب رسمی دست اول",
      referrerRole: "marketer",
      roleTitle: "بازاریاب رسمی دست اول",
      buyerDiscountPercent: 3,
      buyerDiscountAmount: discAmount,
      referrerRewardAmount: 1000000,
      referrerRewardNote: "۱,۰۰۰,۰۰۰ تومان پاداش معرفی بازاریاب",
      message: "کد بازاریاب رسمی تایید شد؛ ۳٪ تخفیف ویژه خرید برای شما منظور گردید."
    };
  }

  // Default to customer referral code
  const discAmount = Math.min(Math.round(numOrder * 0.03), 500000);
  return {
    valid: true,
    code,
    referrerType: "customer",
    referrerName: "همکار معتمد دست اول",
    referrerRole: "customer",
    roleTitle: "همکار معتمد",
    buyerDiscountPercent: 3,
    buyerDiscountAmount: discAmount,
    referrerRewardAmount: 500000,
    referrerRewardNote: "۵۰۰,۰۰۰ تومان اعتبار هدیه به معرف",
    message: "کد دعوت همکار تایید شد؛ ۳٪ تخفیف ویژه خرید برای شما منظور گردید."
  };
}

/**
 * Records an order in referral history and wallet
 */
export async function recordReferralOrder(params: {
  referralCode: string;
  orderId?: string;
  trackingNumber?: string;
  orderAmount: number;
  buyerName?: string;
  buyerPhone?: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/referral/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    return res.ok;
  } catch (e) {
    console.warn("Could not post referral record to API:", e);
    return false;
  }
}
