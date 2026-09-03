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
  isMetropolis: boolean;
  
  // Regional Zones & Multi-level tiers to prevent monopoly
  availableZones?: string[];
  representativeLevels?: {
    level: "diamond" | "gold" | "silver";
    title: string;
    description: string;
    minMonthlyVolumeToman: number;
    minMonthlyVolumeFormatted: string;
  }[];

  // Carton-based metrics
  starterMinCartons: string; // حداقل کارتن برای ورود
  monthlyCartons: string; // ظرفیت توزیع کارتنی ماهانه
  growthTargetCartons: string; // هدف رشد کارتنی
  
  // Financial metrics
  initialMinOrderToman: number; // حداقل سفارش ورود (تومان)
  initialMinOrderFormatted: string;
  monthlyQuotaCeilingToman: number; // سقف سهمیه ماهانه (تومان)
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
  "تهران": { province: "تهران", population: 9250000, tier: 1, tierLabel: "کلان‌شهر ویژه پایتخت (سطح ۱ - توزیع منطقه‌ای)" },
  "مشهد": { province: "خراسان رضوی", population: 3300000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱ - توزیع منطقه‌ای)" },
  "اصفهان": { province: "اصفهان", population: 2200000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱ - توزیع منطقه‌ای)" },
  "کرج": { province: "البرز", population: 1900000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱ - توزیع منطقه‌ای)" },
  "شیراز": { province: "فارس", population: 1750000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱ - توزیع منطقه‌ای)" },
  "تبریز": { province: "آذربایجان شرقی", population: 1700000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱ - توزیع منطقه‌ای)" },
  "قم": { province: "قم", population: 1350000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱ - توزیع منطقه‌ای)" },
  "اهواز": { province: "خوزستان", population: 1300000, tier: 1, tierLabel: "کلان‌شهر ملی (سطح ۱ - توزیع منطقه‌ای)" },

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

  // Tier 3: شهرهای متوسط و مراکز شهرستان‌های صنعتی، تجاری و مرزی (۱۰۰ تا ۳۰۰ هزار)
  "قوچان": { province: "خراسان رضوی", population: 140000, tier: 3, tierLabel: "شهرستان تجاری و مرزی (سطح ۳)" },
  "سبزوار": { province: "خراسان رضوی", population: 250000, tier: 3, tierLabel: "شهرستان تجاری و دانشگاهی (سطح ۳)" },
  "تربت حیدریه": { province: "خراسان رضوی", population: 150000, tier: 3, tierLabel: "شهرستان تجاری و کشاورزی (سطح ۳)" },
  "کاشمر": { province: "خراسان رضوی", population: 110000, tier: 3, tierLabel: "شهرستان تجاری منطقه‌ای (سطح ۳)" },
  "تربت جام": { province: "خراسان رضوی", population: 110000, tier: 3, tierLabel: "شهرستان مرزی و تجاری (سطح ۳)" },
  "گناباد": { province: "خراسان رضوی", population: 90000, tier: 3, tierLabel: "شهرستان منطقه‌ای (سطح ۳)" },
  "چناران": { province: "خراسان رضوی", population: 70000, tier: 3, tierLabel: "شهرستان صنعتی (سطح ۳)" },
  "اسفراین": { province: "خراسان شمالی", population: 70000, tier: 3, tierLabel: "شهرستان صنعتی (سطح ۳)" },
  "شیروان": { province: "خراسان شمالی", population: 90000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
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
  "کیش": { province: "هرمزگان", population: 45000, tier: 3, tierLabel: "منطقه آزاد تجاری (سطح ۳)" },
  "قشم": { province: "هرمزگان", population: 50000, tier: 3, tierLabel: "منطقه آزاد تجاری (سطح ۳)" },
  "چابهار": { province: "سیستان و بلوچستان", population: 120000, tier: 3, tierLabel: "بندر استراتژیک تجاری (سطح ۳)" }
};

export function normalizeName(str?: string): string {
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
 * Calculates Dealership Carton Quota, Progressive Growth Tiers, and Multi-level Zones
 * tailored dynamically for Iranian Metropolises vs Small Towns.
 */
export function calculateDealershipTier(city: string, province?: string): CityTierData {
  const normCity = normalizeName(city);
  
  let matchedKey = Object.keys(KNOWN_CITIES_DATA).find((k) => normalizeName(k) === normCity);
  
  if (!matchedKey) {
    matchedKey = Object.keys(KNOWN_CITIES_DATA).find((k) => normCity.includes(normalizeName(k)) || normalizeName(k).includes(normCity));
  }

  let baseData = matchedKey ? KNOWN_CITIES_DATA[matchedKey] : null;

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
  const isMetropolis = baseData.tier === 1;

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
  let availableZones: string[] | undefined;
  let representativeLevels: CityTierData['representativeLevels'] | undefined;

  if (baseData.tier === 1) {
    // Tier 1: Metropolises - HIGH VOLUME & MULTI-LEVEL ZONES TO PREVENT MONOPOLY
    starterMinCartons = "۲۰۰ تا ۵۰۰ کارتن";
    monthlyCartons = "۱,۰۰۰ تا ۳,۰۰۰ کارتن";
    growthTargetCartons = "تا ۵,۰۰۰ کارتن در ماه";
    initialMinOrderToman = 300_000_000; // 300 Million Tomans
    monthlyQuotaCeilingToman = 2_500_000_000; // 2.5 Billion Tomans
    guaranteeLimitToman = 400_000_000;
    recommendedWarehouseSpace = "از ۲۰۰ تا ۸۰۰ متر مربع انبار مکانیزه";
    recommendedFleet = "۲ الی ۵ دستگاه وانت یا خاور پخش مویرگی";
    estimatedGrossMargin = "۲۵٪ تا ۳۲٪ سود خالص";

    availableZones = [
      "منطقه ۱ - شمال (شمیرانات و شمال کلان‌شهر)",
      "منطقه ۲ - غرب (قطب صنعتی و پخش مویرگی)",
      "منطقه ۳ - مرکز (بازار اصلی و بنکداری)",
      "منطقه ۴ - شرق (مراکز توزیع و هایپرمارکت‌ها)",
      "منطقه ۵ - جنوب و حومه (انبارداری و لجستیک سنگین)"
    ];

    representativeLevels = [
      {
        level: "diamond",
        title: "💎 سطح ۱: نماینده الماس (بنکداری و مدیریت منطقه‌ای)",
        description: "توزیع انحصاری در منطقه مشخص کلان‌شهر و ارجاع کلیه خریداران عمده و هایپرمارکت‌ها",
        minMonthlyVolumeToman: 1_500_000_000,
        minMonthlyVolumeFormatted: "۱.۵ میلیارد تومان"
      },
      {
        level: "gold",
        title: "🥇 سطح ۲: نماینده طلایی (پخش مویرگی محلی)",
        description: "عاملیت توزیع در ناحیه مشخص با پشتیبانی مویرگی سوپرمارکت‌ها",
        minMonthlyVolumeToman: 600_000_000,
        minMonthlyVolumeFormatted: "۶۰۰ میلیون تومان"
      },
      {
        level: "silver",
        title: "🥈 سطح ۳: نماینده نقره‌ای (عامل تحویل و توزیع سریع)",
        description: "تحویل مستقیم سفارشات و عاملیت فروشگاه‌های زنجیره‌ای منطقه",
        minMonthlyVolumeToman: 300_000_000,
        minMonthlyVolumeFormatted: "۳۰۰ میلیون تومان"
      }
    ];

    growthSteps = [
      {
        stepNumber: 1,
        title: "گام ۱: ورود کلان‌شهری و اخذ عاملیت منطقه",
        cartonRange: "۲۰۰ تا ۵۰۰ کارتن",
        volumeTomanFormatted: "۳۰۰ میلیون تومان",
        marginPercent: "۲۲٪ تا ۲۵٪",
        description: "شروع عاملیت رسمی در یکی از مناطق پنج‌گانه کلان‌شهر بدون انحصار تک‌نفره"
      },
      {
        stepNumber: 2,
        title: "گام ۲: توسعه شبکه مویرگی منطقه",
        cartonRange: "۱,۰۰۰ تا ۲,۰۰۰ کارتن",
        volumeTomanFormatted: "۱ الی ۱.۵ میلیارد تومان",
        marginPercent: "۲۶٪ تا ۲۹٪",
        description: "پوشش مویرگی سوپرمارکت‌ها و فروشگاه‌های منطقه با ارجاع مستقیم سیستمی"
      },
      {
        stepNumber: 3,
        title: "گام ۳: نماینده ارشد الماس کلان‌شهر",
        cartonRange: "۳,۰۰۰ تا ۵,۰۰۰ کارتن",
        volumeTomanFormatted: "۲.۵ میلیارد تومان",
        marginPercent: "۳۲٪ ماکزیمم",
        description: "بنکداری و پشتیبانی تجاری کلان‌شهر همراه با بالاترین درصد حاشیه سود کارخانه‌ای"
      }
    ];
  } else if (baseData.tier === 2) {
    // Tier 2: Provincial Hubs
    starterMinCartons = "۶۰ تا ۱۲۰ کارتن";
    monthlyCartons = "۳۰۰ تا ۸۰۰ کارتن";
    growthTargetCartons = "تا ۱,۵۰۰ کارتن در ماه";
    initialMinOrderToman = 85_000_000;
    monthlyQuotaCeilingToman = 850_000_000;
    guaranteeLimitToman = 120_000_000;
    recommendedWarehouseSpace = "۱۰۰ تا ۲۵۰ متر مربع";
    recommendedFleet = "۱ الی ۳ دستگاه وانت بار";
    estimatedGrossMargin = "۲۲٪ تا ۲۸٪ سود خالص";

    representativeLevels = [
      {
        level: "gold",
        title: "🥇 سطح ۱: نماینده طلایی استانی",
        description: "توزیع انحصاری مرکز استان و ارجاع کلیه خریداران عمده استان",
        minMonthlyVolumeToman: 400_000_000,
        minMonthlyVolumeFormatted: "۴۰۰ میلیون تومان"
      },
      {
        level: "silver",
        title: "🥈 سطح ۲: نماینده نقره‌ای توزیع",
        description: "عاملیت فروش مویرگی در سطح شهر و حومه",
        minMonthlyVolumeToman: 150_000_000,
        minMonthlyVolumeFormatted: "۱۵۰ میلیون تومان"
      }
    ];

    growthSteps = [
      {
        stepNumber: 1,
        title: "گام ۱: ورود مرکز استان",
        cartonRange: "۶۰ تا ۱۲۰ کارتن",
        volumeTomanFormatted: "۸۵ میلیون تومان",
        marginPercent: "۲۰٪ تا ۲۲٪",
        description: "شروع توزیع در مرکز استان با پشتیبانی باربری کارخانه"
      },
      {
        stepNumber: 2,
        title: "گام ۲: گسترش سهمیه استانی",
        cartonRange: "۳۰۰ تا ۸۰۰ کارتن",
        volumeTomanFormatted: "۴۰۰ تا ۶۰۰ میلیون تومان",
        marginPercent: "۲۴٪ تا ۲۶٪",
        description: "توزیع گسترده در فروشگاه‌های استان و ارجاع سفارشات بومی"
      },
      {
        stepNumber: 3,
        title: "گام ۳: عاملیت ارشد استان",
        cartonRange: "۱,۰۰۰ تا ۱,۵۰۰ کارتن",
        volumeTomanFormatted: "۸۵۰ میلیون تومان",
        marginPercent: "۲۸٪ ماکزیمم",
        description: "نماینده اصلی توزیع استان با بالاترین تخفیف پلکانی"
      }
    ];
  } else if (baseData.tier === 3) {
    // Tier 3: Medium Cities (100k to 300k, e.g. Quchan, Sabzevar, Kashan, Amol) - ACCESSIBLE FOR SMALL TOWNS
    starterMinCartons = "۱۵ تا ۳۰ کارتن";
    monthlyCartons = "۵۰ تا ۱۵۰ کارتن";
    growthTargetCartons = "تا ۳۰۰ کارتن در ماه";
    initialMinOrderToman = 18_000_000; // 18 Million Tomans - Accessible
    monthlyQuotaCeilingToman = 180_000_000;
    guaranteeLimitToman = 30_000_000;
    recommendedWarehouseSpace = "۳۰ تا ۸۰ متر مربع (مغازه، انبار یا فروشگاه)";
    recommendedFleet = "۱ دستگاه وانت یا خودرو سواری باربری";
    estimatedGrossMargin = "۲۰٪ تا ۲۵٪ سود خالص";

    growthSteps = [
      {
        stepNumber: 1,
        title: "گام ۱: شروع بسیار آسان شهرستان",
        cartonRange: "۱۵ تا ۳۰ کارتن",
        volumeTomanFormatted: "۱۸ میلیون تومان",
        marginPercent: "۱۹٪",
        description: "شروع کار بدون نیاز به چک سنگین یا انبار تجاری بزرگ"
      },
      {
        stepNumber: 2,
        title: "گام ۲: توسعه توزیع محلی",
        cartonRange: "۵۰ تا ۱۵۰ کارتن",
        volumeTomanFormatted: "۵۰ تا ۱۰۰ میلیون تومان",
        marginPercent: "۲۲٪",
        description: "افزایش خودکار سهمیه متناسب با کشش بازار شهرستان"
      },
      {
        stepNumber: 3,
        title: "گام ۳: عاملیت انحصاری شهرستان",
        cartonRange: "۲۰۰ تا ۳۰۰ کارتن",
        volumeTomanFormatted: "۱۸۰ میلیون تومان",
        marginPercent: "۲۵٪ ماکزیمم",
        description: "عاملیت اصلی شهر با ارجاع کلیه خریداران عمده بومی"
      }
    ];
  } else {
    // Tier 4: Small Towns (< 100k) - VERY LOW BARRIER FOR SMALL CITIES
    starterMinCartons = "۸ تا ۱۵ کارتن";
    monthlyCartons = "۲۰ تا ۵۰ کارتن";
    growthTargetCartons = "تا ۱۰۰ کارتن در ماه";
    initialMinOrderToman = 10_000_000; // 10 Million Tomans - Ultra Accessible
    monthlyQuotaCeilingToman = 80_000_000;
    guaranteeLimitToman = 15_000_000;
    recommendedWarehouseSpace = "۲۰ تا ۵۰ متر مربع (مغازه یا انبار محلی)";
    recommendedFleet = "۱ دستگاه وانت یا خودرو شخصی";
    estimatedGrossMargin = "۲۰٪ تا ۲۴٪ سود خالص";

    growthSteps = [
      {
        stepNumber: 1,
        title: "گام ۱: ثبت و ورود سریع شهر کوچک",
        cartonRange: "۸ تا ۱۵ کارتن",
        volumeTomanFormatted: "۱۰ میلیون تومان",
        marginPercent: "۱۹٪",
        description: "حداقل سرمایه اولیه برای همه متقاضیان شهرهای کوچک"
      },
      {
        stepNumber: 2,
        title: "گام ۲: رشد تدریجی",
        cartonRange: "۲۰ تا ۵0 کارتن",
        volumeTomanFormatted: "۲۰ تا ۵۰ میلیون تومان",
        marginPercent: "۲۱٪",
        description: "رشد پلکانی سهمیه متناسب با فروش ماهانه مغازه"
      },
      {
        stepNumber: 3,
        title: "گام ۳: عاملیت رسمی منطقه",
        cartonRange: "۶۰ تا ۱۰۰ کارتن",
        volumeTomanFormatted: "۸۰ میلیون تومان",
        marginPercent: "۲۴٪",
        description: "نماینده رسمی ثبت‌شده با ارسال مستقیم باربری"
      }
    ];
  }

  return {
    cityName: city || "شهر نامشخص",
    provinceName: baseData.province || province || "ایران",
    population: pop,
    tier: baseData.tier,
    tierLabel: baseData.tierLabel,
    isMetropolis,
    availableZones,
    representativeLevels,
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

/**
 * Finds exact representative in city OR nearest representative in the same province/region.
 */
export function findNearestRepresentative(targetCity: string, targetProvince: string, allReps: any[]): {
  exactMatches: any[];
  nearestMatches: any[];
  nearestCityName?: string;
  isProvinceFallback: boolean;
} {
  if (!Array.isArray(allReps) || allReps.length === 0) {
    return { exactMatches: [], nearestMatches: [], isProvinceFallback: false };
  }

  const normCity = normalizeName(targetCity);
  const normProv = normalizeName(targetProvince);

  // 1. Exact city matches
  const exact = allReps.filter(r => {
    const rCity = normalizeName(r.city);
    return rCity && (rCity === normCity || rCity.includes(normCity) || normCity.includes(rCity));
  });

  if (exact.length > 0) {
    return { exactMatches: exact, nearestMatches: [], isProvinceFallback: false };
  }

  // 2. Nearest in same province
  const sameProvinceReps = allReps.filter(r => {
    const rProv = normalizeName(r.province);
    return rProv && (rProv === normProv || rProv.includes(normProv) || normProv.includes(rProv));
  });

  if (sameProvinceReps.length > 0) {
    const nearestCity = sameProvinceReps[0]?.city || "مرکز استان";
    return {
      exactMatches: [],
      nearestMatches: sameProvinceReps,
      nearestCityName: nearestCity,
      isProvinceFallback: true
    };
  }

  // 3. Fallback to all approved reps if province doesn't match
  return {
    exactMatches: [],
    nearestMatches: allReps.slice(0, 3),
    nearestCityName: allReps[0]?.city || "کلان‌شهر همجوار",
    isProvinceFallback: true
  };
}

