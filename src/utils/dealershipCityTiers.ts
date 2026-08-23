// Iranian City Demographics & Progressive Dealership Tier / Carton Quota Calculator Engine

export interface DealershipGrowthStep {
  stepNumber: number;
  title: string;
  cartonRange: string;
  volumeTomanFormatted: string;
  marginPercent: string;
  description: string;
}

export interface CityTierData {
  cityName: string;
  provinceName: string;
  population: number; // Estimated population
  tier: 1 | 2 | 3 | 4;
  tierLabel: string;
  
  // Carton-based metrics
  starterMinCartons: string; // حداقل کارتن برای ورود آسان
  monthlyCartons: string; // ظرفیت توزیع کارتنی ماهانه
  growthTargetCartons: string; // هدف رشد کارتنی
  
  // Financial metrics (Realistic & Accessible)
  initialMinOrderToman: number; // حداقل سفارش ورود (تومان)
  initialMinOrderFormatted: string;
  monthlyQuotaCeilingToman: number; // سقف سهمیه پلکانی ماهانه (تومان)
  monthlyQuotaCeilingFormatted: string;
  guaranteeLimitToman: number; // سقف ضمانت صیادی آسان (تومان)
  guaranteeLimitFormatted: string;

  // Operational metrics
  recommendedWarehouseSpace: string;
  recommendedFleet: string;
  estimatedGrossMargin: string;
  growthSteps: DealershipGrowthStep[];
}

// Normalized lookup map for Iranian cities and population estimates
const KNOWN_CITIES_DATA: Record<string, { province: string; population: number; tier: 1 | 2 | 3 | 4; tierLabel: string }> = {
  // Tier 1: کلان‌شهرهای بالای ۱.۵ میلیون نفر
  "تهران": { province: "تهران", population: 9250000, tier: 1, tierLabel: "کلان‌شهر ویژه پایتخت (سطح ۱)" },
  "مشهد": { province: "خراسان رضوی", population: 3300000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱)" },
  "اصفهان": { province: "اصفهان", population: 2200000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱)" },
  "کرج": { province: "البرز", population: 1900000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱)" },
  "شیراز": { province: "فارس", population: 1750000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱)" },
  "تبریز": { province: "آذربایجان شرقی", population: 1700000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱)" },
  "قم": { province: "قم", population: 1350000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱)" },
  "اهواز": { province: "خوزستان", population: 1300000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱)" },

  // Tier 2: کلان‌شهرهای منطقه‌ای و مراکز استان پرجمعیت (۳۵۰ هزار تا ۱.۲ میلیون)
  "کرمانشاه": { province: "کرمانشاه", population: 1020000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "ارومیه": { province: "آذربایجان غربی", population: 820000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "رشت": { province: "گیلان", population: 750000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "زاهدان": { province: "سیستان و بلوچستان", population: 650000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "همدان": { province: "همدان", population: 620000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "کرمان": { province: "کرمان", population: 600000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "یزد": { province: "یزد", population: 580000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "اردبیل": { province: "اردبیل", population: 560000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "بندرعباس": { province: "هرمزگان", population: 550000, tier: 2, tierLabel: "مرکز استان و قطب تجاری (سطح ۲)" },
  "اراک": { province: "مرکزی", population: 540000, tier: 2, tierLabel: "مرکز استان و قطب صنعتی (سطح ۲)" },
  "اسلامشهر": { province: "تهران", population: 520000, tier: 2, tierLabel: "شهر پرجمعیت حومه (سطح ۲)" },
  "زنجان": { province: "زنجان", population: 460000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "سنندج": { province: "کردستان", population: 440000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "قزوین": { province: "قزوین", population: 430000, tier: 2, tierLabel: "مرکز استان و قطب صنعتی (سطح ۲)" },
  "خرم‌آباد": { province: "لرستان", population: 410000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "گرگان": { province: "گلستان", population: 390000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "ساری": { province: "مازندران", population: 350000, tier: 2, tierLabel: "مرکز استان و قطب منطقه‌ای (سطح ۲)" },
  "شهریار": { province: "تهران", population: 340000, tier: 2, tierLabel: "شهر پرجمعیت حومه (سطح ۲)" },
  "قدس": { province: "تهران", population: 330000, tier: 2, tierLabel: "شهر پرجمعیت حومه (سطح ۲)" },
  "کاشان": { province: "اصفهان", population: 340000, tier: 2, tierLabel: "شهرستان بزرگ تجاری (سطح ۲)" },
  "نیشابور": { province: "خراسان رضوی", population: 310000, tier: 2, tierLabel: "شهرستان بزرگ تجاری (سطح ۲)" },
  "دزفول": { province: "خوزستان", population: 300000, tier: 2, tierLabel: "شهرستان بزرگ تجاری (سطح ۲)" },
  "بابل": { province: "مازندران", population: 290000, tier: 2, tierLabel: "قطب تجاری شمال (سطح ۲)" },
  "آبادان": { province: "خوزستان", population: 270000, tier: 2, tierLabel: "شهرستان بزرگ تجاری (سطح ۲)" },
  "بجنورد": { province: "خراسان شمالی", population: 250000, tier: 2, tierLabel: "مرکز استان (سطح ۲)" },
  "بوشهر": { province: "بوشهر", population: 240000, tier: 2, tierLabel: "مرکز استان و بندر تجاری (سطح ۲)" },
  "ایلام": { province: "ایلام", population: 210000, tier: 2, tierLabel: "مرکز استان (سطح ۲)" },
  "سمنان": { province: "سمنان", population: 200000, tier: 2, tierLabel: "مرکز استان (سطح ۲)" },
  "شهرکرد": { province: "چهارمحال و بختیاری", population: 200000, tier: 2, tierLabel: "مرکز استان (سطح ۲)" },
  "یاسوج": { province: "کهگیلویه و بویراحمد", population: 150000, tier: 2, tierLabel: "مرکز استان (سطح ۲)" },
  "بیرجند": { province: "خراسان جنوبی", population: 220000, tier: 2, tierLabel: "مرکز استان (سطح ۲)" },

  // Tier 3: شهرهای متوسط و مراکز شهرستان‌های صنعتی و تجاری (۱۰۰ تا ۳۰۰ هزار)
  "آمل": { province: "مازندران", population: 280000, tier: 3, tierLabel: "شهر صنعتی و تجاری (سطح ۳)" },
  "بروجرد": { province: "لرستان", population: 250000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "سیرجان": { province: "کرمان", population: 220000, tier: 3, tierLabel: "شهر صنعتی و معدنی (سطح ۳)" },
  "مراغه": { province: "آذربایجان شرقی", population: 190000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "رفسنجان": { province: "کرمان", population: 180000, tier: 3, tierLabel: "شهرستان تجاری و کشاورزی (سطح ۳)" },
  "ساوه": { province: "مرکزی", population: 240000, tier: 3, tierLabel: "قطب صنعتی (سطح ۳)" },
  "خوی": { province: "آذربایجان غربی", population: 210000, tier: 3, tierLabel: "شهرستان مرزی و تجاری (سطح ۳)" },
  "ملایر": { province: "همدان", population: 190000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "شاهین‌شهر": { province: "اصفهان", population: 180000, tier: 3, tierLabel: "شهرستان حومه (سطح ۳)" },
  "قائم‌شهر": { province: "مازندران", population: 220000, tier: 3, tierLabel: "شهر تجاری (سطح ۳)" },
  "مهاباد": { province: "آذربایجان غربی", population: 180000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "سقز": { province: "کردستان", population: 175000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "مرودشت": { province: "فارس", population: 160000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "شاهرود": { province: "سمنان", population: 160000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "زابل": { province: "سیستان و بلوچستان", population: 140000, tier: 3, tierLabel: "شهرستان مرزی (سطح ۳)" },
  "جهرم": { province: "فارس", population: 150000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "تربت حیدریه": { province: "خراسان رضوی", population: 150000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "کیش": { province: "هرمزگان", population: 45000, tier: 3, tierLabel: "منطقه آزاد تجاری (سطح ۳)" },
  "قشم": { province: "هرمزگان", population: 50000, tier: 3, tierLabel: "منطقه آزاد تجاری (سطح ۳)" },
  "چابهار": { province: "سیستان و بلوچستان", population: 120000, tier: 3, tierLabel: "بندر استراتژیک تجاری (سطح ۳)" }
};

function normalizeName(str?: string): string {
  if (!str) return "";
  return str
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[‌\s-]+/g, "")
    .trim()
    .toLowerCase();
}

export function formatTomanCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    const milliards = amount / 1_000_000_000;
    const formatted = milliards % 1 === 0 ? milliards.toString() : milliards.toFixed(1);
    return `${toPersianDigits(formatted)} میلیارد تومان`;
  }
  if (amount >= 1_000_000) {
    const millions = Math.round(amount / 1_000_000);
    return `${toPersianDigits(millions.toLocaleString("fa-IR"))} میلیون تومان`;
  }
  return `${toPersianDigits(amount.toLocaleString("fa-IR"))} تومان`;
}

export function toPersianDigits(num: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d, 10)] || d);
}

/**
 * Calculates Dealership Carton Quota, Progressive Growth Tiers, and Accessible Guarantees
 * dynamically based on city demographic scale with an encouraging, low-barrier starting point.
 */
export function calculateDealershipTier(city: string, province?: string): CityTierData {
  const normCity = normalizeName(city);
  
  // 1. Direct or partial lookup
  let matchedKey = Object.keys(KNOWN_CITIES_DATA).find((k) => normalizeName(k) === normCity);
  
  if (!matchedKey) {
    matchedKey = Object.keys(KNOWN_CITIES_DATA).find((k) => normCity.includes(normalizeName(k)) || normalizeName(k).includes(normCity));
  }

  let baseData = matchedKey ? KNOWN_CITIES_DATA[matchedKey] : null;

  // 2. Fallback heuristic based on province or default
  if (!baseData) {
    const normProv = normalizeName(province);
    if (normProv.includes("تهران")) {
      baseData = { province: "تهران", population: 250000, tier: 2, tierLabel: "شهرستان تابعه تهران (سطح ۲)" };
    } else if (normProv.includes("خراسان") || normProv.includes("اصفهان") || normProv.includes("فارس") || normProv.includes("خوزستان") || normProv.includes("البرز") || normProv.includes("گیلان") || normProv.includes("مازندران")) {
      baseData = { province: province || "ایران", population: 120000, tier: 3, tierLabel: "شهرستان متوسط استانی (سطح ۳)" };
    } else {
      baseData = { province: province || "ایران", population: 65000, tier: 4, tierLabel: "شهرستان و توزیع منطقه‌ای (سطح ۴)" };
    }
  }

  const pop = baseData.population;
  let starterMinCartons: string;
  let monthlyCartons: string;
  let growthTargetCartons: string;
  let initialMinOrderToman: number;
  let monthlyQuotaCeilingToman: number;
  let guaranteeLimitToman: number;
  let recommendedWarehouseSpace: string;
  let recommendedFleet: string;
  let estimatedGrossMargin: string;
  let growthSteps: DealershipGrowthStep[];

  // Accessible, Progressive Growth Model (All in Cartons):
  if (baseData.tier === 1) {
    // Tier 1: Metropolises
    starterMinCartons = "۳۰ تا ۶۰ کارتن";
    monthlyCartons = "۱۵۰ تا ۵۰۰ کارتن";
    growthTargetCartons = "تا ۸۰۰ کارتن در ماه";
    initialMinOrderToman = 45_000_000;
    monthlyQuotaCeilingToman = 650_000_000;
    guaranteeLimitToman = 80_000_000;
    recommendedWarehouseSpace = "از ۱۰۰ تا ۳۰۰ متر مربع";
    recommendedFleet = "۱ الی ۳ دستگاه وانت یا وانت‌بار";
    estimatedGrossMargin = "۲۲٪ تا ۲۸٪ سود خالص";

    growthSteps = [
      {
        stepNumber: 1,
        title: "گام ۱: شروع آسان و تست اولیه",
        cartonRange: "۳۰ تا ۶۰ کارتن",
        volumeTomanFormatted: "۴۵ میلیون تومان",
        marginPercent: "۱۸٪ تا ۲۲٪",
        description: "تست بازار محلی با حداقل سرمایه و ضمانت آسان چک صیادی"
      },
      {
        stepNumber: 2,
        title: "گام ۲: تثبیت و توسعه توزیع",
        cartonRange: "۱۵۰ تا ۳۰۰ کارتن",
        volumeTomanFormatted: "۲۰۰ تا ۳۵۰ میلیون تومان",
        marginPercent: "۲۲٪ تا ۲۵٪",
        description: "افزایش خودکار سهمیه با ارجاع سوپرمارکت‌های ثبتی منطقه به شما"
      },
      {
        stepNumber: 3,
        title: "گام ۳: عاملیت انحصاری کلان‌شهر",
        cartonRange: "۵۰۰ تا ۸۰۰ کارتن",
        volumeTomanFormatted: "۶۵۰ میلیون تومان",
        marginPercent: "۲۸٪ ماکزیمم",
        description: "انحصار کامل توزیع منطقه همراه با بیشترین تخفیف پله‌ای کارخانه"
      }
    ];
  } else if (baseData.tier === 2) {
    // Tier 2: Provincial Hubs
    starterMinCartons = "۲۵ تا ۵۰ کارتن";
    monthlyCartons = "۱۰۰ تا ۳۵۰ کارتن";
    growthTargetCartons = "تا ۵۰۰ کارتن در ماه";
    initialMinOrderToman = 35_000_000;
    monthlyQuotaCeilingToman = 450_000_000;
    guaranteeLimitToman = 60_000_000;
    recommendedWarehouseSpace = "۸۰ تا ۲۰۰ متر مربع";
    recommendedFleet = "۱ الی ۲ دستگاه وانت بار";
    estimatedGrossMargin = "۲۰٪ تا ۲۶٪ سود خالص";

    growthSteps = [
      {
        stepNumber: 1,
        title: "گام ۱: ورود منعطف",
        cartonRange: "۲۵ تا ۵۰ کارتن",
        volumeTomanFormatted: "۳۵ میلیون تومان",
        marginPercent: "۱۸٪ تا ۲۰٪",
        description: "آغاز همکاری سریع بدون نیاز به انبارهای بزرگ یا سرمایه‌گذاری سنگین"
      },
      {
        stepNumber: 2,
        title: "گام ۲: رشد ماهانه",
        cartonRange: "۱۰۰ تا ۲۵۰ کارتن",
        volumeTomanFormatted: "۱۵۰ تا ۳۰۰ میلیون تومان",
        marginPercent: "۲۱٪ تا ۲۴٪",
        description: "پوشش فروشگاه‌ها و سوپرمارکت‌های فعال در شهرستان"
      },
      {
        stepNumber: 3,
        title: "گام ۳: عاملیت رسمی استان",
        cartonRange: "۳۵۰ تا ۵۰۰ کارتن",
        volumeTomanFormatted: "۴۵۰ میلیون تومان",
        marginPercent: "۲۶٪ ماکزیمم",
        description: "توزیع انحصاری و تحویل مستقیم باربری درب مغازه"
      }
    ];
  } else if (baseData.tier === 3) {
    // Tier 3: Medium Cities
    starterMinCartons = "۲۰ تا ۴۰ کارتن";
    monthlyCartons = "۶۰ تا ۲۰۰ کارتن";
    growthTargetCartons = "تا ۳۰۰ کارتن در ماه";
    initialMinOrderToman = 25_000_000;
    monthlyQuotaCeilingToman = 280_000_000;
    guaranteeLimitToman = 40_000_000;
    recommendedWarehouseSpace = "۵۰ تا ۱۲۰ متر مربع (مغازه یا انبار)";
    recommendedFleet = "۱ دستگاه وانت پخش یا خودرو مناسب";
    estimatedGrossMargin = "۱۸٪ تا ۲۴٪ سود خالص";

    growthSteps = [
      {
        stepNumber: 1,
        title: "گام ۱: تست و شروع",
        cartonRange: "۲۰ تا ۴۰ کارتن",
        volumeTomanFormatted: "۲۵ میلیون تومان",
        marginPercent: "۱۸٪",
        description: "سفارش خرد کارتنی به قیمت کف تولیدی کارخانه"
      },
      {
        stepNumber: 2,
        title: "گام ۲: توسعه محلی",
        cartonRange: "۶۰ تا ۱۵۰ کارتن",
        volumeTomanFormatted: "۸۰ تا ۱۸۰ میلیون تومان",
        marginPercent: "۲۱٪",
        description: "افزایش پلکانی سهمیه متناسب با فروش ماهانه"
      },
      {
        stepNumber: 3,
        title: "گام ۳: نمایندگی انحصاری شهر",
        cartonRange: "۲۰۰ تا ۳۰۰ کارتن",
        volumeTomanFormatted: "۲۸۰ میلیون تومان",
        marginPercent: "۲۴٪",
        description: "عاملیت اصلی شهر با ارجاع تمامی خریداران بومی"
      }
    ];
  } else {
    // Tier 4: Small Towns (< 100k)
    starterMinCartons = "۱۵ تا ۳۰ کارتن";
    monthlyCartons = "۴۰ تا ۱۲۰ کارتن";
    growthTargetCartons = "تا ۱۸۰ کارتن در ماه";
    initialMinOrderToman = 18_000_000;
    monthlyQuotaCeilingToman = 160_000_000;
    guaranteeLimitToman = 25_000_000;
    recommendedWarehouseSpace = "۳۰ تا ۸۰ متر مربع (فروشگاه یا انبار)";
    recommendedFleet = "۱ دستگاه وانت یا خودرو سواری باربری";
    estimatedGrossMargin = "۱۸٪ تا ۲۲٪ سود خالص";

    growthSteps = [
      {
        stepNumber: 1,
        title: "گام ۱: ثبت و شروع سریع",
        cartonRange: "۱۵ تا ۳۰ کارتن",
        volumeTomanFormatted: "۱۸ میلیون تومان",
        marginPercent: "۱۸٪",
        description: "شروع فوق‌العاده آسان با حداقل سرمایه اولیه"
      },
      {
        stepNumber: 2,
        title: "گام ۲: ارتقای سهمیه",
        cartonRange: "۴۰ تا ۸۰ کارتن",
        volumeTomanFormatted: "۵۰ تا ۱۰۰ میلیون تومان",
        marginPercent: "۲۰٪",
        description: "رشد تدریجی سفارش‌ها متناسب با کشش منطقه"
      },
      {
        stepNumber: 3,
        title: "گام ۳: عاملیت معتبر شهرستان",
        cartonRange: "۱۰۰ تا ۱۸۰ کارتن",
        volumeTomanFormatted: "۱۶۰ میلیون تومان",
        marginPercent: "۲۲٪",
        description: "نماینده رسمی ثبت‌شده با اولویت ارسال کالا"
      }
    ];
  }

  return {
    cityName: city || "شهر نامشخص",
    provinceName: baseData.province || province || "ایران",
    population: pop,
    tier: baseData.tier,
    tierLabel: baseData.tierLabel,
    starterMinCartons,
    monthlyCartons,
    growthTargetCartons,
    monthlyQuotaCeilingToman,
    monthlyQuotaCeilingFormatted: formatTomanCurrency(monthlyQuotaCeilingToman),
    initialMinOrderToman,
    initialMinOrderFormatted: formatTomanCurrency(initialMinOrderToman),
    guaranteeLimitToman,
    guaranteeLimitFormatted: formatTomanCurrency(guaranteeLimitToman),
    recommendedWarehouseSpace,
    recommendedFleet,
    estimatedGrossMargin,
    growthSteps
  };
}
