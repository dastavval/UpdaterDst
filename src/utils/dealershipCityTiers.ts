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

export interface ProvinceCitiesItem {
  province: string;
  capital: string;
  cities: string[];
}

export const IRAN_PROVINCES_AND_CITIES: ProvinceCitiesItem[] = [
  { province: "تهران", capital: "تهران", cities: ["تهران", "شهریار", "اسلامشهر", "ملارد", "قدس", "پاکدشت", "ری", "ورامین", "قرچک", "اندیشه", "رباط‌کریم", "بومهن", "پردیس", "دماوند", "فیروزکوه"] },
  { province: "خراسان رضوی", capital: "مشهد", cities: ["مشهد", "نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "کاشمر", "تربت جام", "تایباد", "سرخس", "گناباد", "چناران", "فریمان", "خواف"] },
  { province: "اصفهان", capital: "اصفهان", cities: ["اصفهان", "کاشان", "خمینی‌شهر", "نجف‌آباد", "شاهین‌شهر", "شهرضا", "فولادشهر", "مبارکه", "آران و بیدگل", "زرین‌شهر", "گلپایگان", "نائین", "نطنز"] },
  { province: "فارس", capital: "شیراز", cities: ["شیراز", "مرودشت", "جهرم", "فسا", "کازرون", "صدرا", "لارستان", "فیروزآباد", "داراب", "ممسنی", "آباده", "نی‌ریز", "اقلید", "استهبان"] },
  { province: "آذربایجان شرقی", capital: "تبریز", cities: ["تبریز", "مراغه", "مرند", "میانه", "اهر", "بناب", "شبستر", "جلفا", "ملکان", "سراب", "آذرشهر", "هادی‌شهر", "عجب‌شیر"] },
  { province: "البرز", capital: "کرج", cities: ["کرج", "فردیس", "کمال‌شهر", "نظرآباد", "محمدشهر", "هشتگرد", "طالقان", "اشتهارد", "ماهدشت"] },
  { province: "خوزستان", capital: "اهواز", cities: ["اهواز", "دزفول", "آبادان", "ماهشهر", "خرمشهر", "اندیمشک", "ایذه", "بهبهان", "شوشتر", "شوش", "مسجدسلیمان", "امیدیه", "شادگان", "رامهرمز"] },
  { province: "قم", capital: "قم", cities: ["قم", "قنوات", "جعفریه", "کهک", "سلفچگان"] },
  { province: "آذربایجان غربی", capital: "ارومیه", cities: ["ارومیه", "خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس", "پیرانشهر", "نقده", "تکاب", "سردشت", "ماکو", "شاهین‌دژ", "اشنویه"] },
  { province: "مازندران", capital: "ساری", cities: ["ساری", "بابل", "آمل", "قائم‌شهر", "بهشهر", "چالوس", "تنکابن", "بابلسر", "نوشهر", "رامسر", "محمودآباد", "نور", "نکا", "فریدونکنار"] },
  { province: "گیلان", capital: "رشت", cities: ["رشت", "بندر انزلی", "لاهیجان", "لنگرود", "تالش", "آستارا", "صومعه‌سرا", "رودسر", "فومن", "آستانه اشرفیه", "ماسال", "رودبار"] },
  { province: "کرمانشاه", capital: "کرمانشاه", cities: ["کرمانشاه", "اسلام‌آباد غرب", "کنگاور", "جوانرود", "سنقر", "هرسین", "سرپل ذهاب", "پاوه", "صحنه", "گیلانغرب"] },
  { province: "سیستان و بلوچستان", capital: "زاهدان", cities: ["زاهدان", "زابل", "ایرانشهر", "چابهار", "سراوان", "خاش", "نیک‌شهر", "بمپور", "کنارک", "راسک"] },
  { province: "همدان", capital: "همدان", cities: ["همدان", "ملایر", "نهاوند", "تویسرکان", "اسدآباد", "بهار", "کبودرآهنگ", "رزن", "فامنین"] },
  { province: "کرمان", capital: "کرمان", cities: ["کرمان", "سیرجان", "رفسنجان", "جیرفت", "بم", "زرند", "کهنوج", "شهربابک", "بافت", "بردسیر", "عنبرآباد"] },
  { province: "یزد", capital: "یزد", cities: ["یزد", "میبد", "اردکان", "بافق", "مهریز", "ابرکوه", "تفت", "اشکذر", "هرات"] },
  { province: "اردبیل", capital: "اردبیل", cities: ["اردبیل", "پارس‌آباد", "مشگین‌شهر", "خلخال", "گرمی", "بیله‌سوار", "نمین", "سرعین"] },
  { province: "هرمزگان", capital: "بندرعباس", cities: ["بندرعباس", "میناب", "دهبارز", "قشم", "کیش", "بندرلنگه", "حاجی‌آباد", "جاسک", "بندر خمیر", "پارسیان"] },
  { province: "مرکزی", capital: "اراک", cities: ["اراک", "ساوه", "خمین", "محلات", "دلیجان", "شازند", "تفرش", "آشتیان", "زرندیه"] },
  { province: "زنجان", capital: "زنجان", cities: ["زنجان", "ابهر", "خرمدره", "قیدار", "طارم", "ماهنشان", "سلطانیه"] },
  { province: "کردستان", capital: "سنندج", cities: ["سنندج", "سقز", "مریوان", "بانه", "قروه", "بیجار", "کامیاران", "دیواندره", "دهگلان"] },
  { province: "قزوین", capital: "قزوین", cities: ["قزوین", "الوند", "محمدیه", "تاکستان", "آبیک", "اقبالیه", "بویین‌زهرا"] },
  { province: "لرستان", capital: "خرم‌آباد", cities: ["خرم‌آباد", "بروجرد", "دورود", "کوهدشت", "دلفان", "الیگودرز", "الشتر", "پلدختر", "ازنا"] },
  { province: "گلستان", capital: "گرگان", cities: ["گرگان", "گنبد کاووس", "بندر ترکمن", "علی‌آباد کتول", "آزادشهر", "آق‌قلا", "کلاله", "مینودشت", "کردکوی"] },
  { province: "سمنان", capital: "سمنان", cities: ["سمنان", "شاهرود", "دامغان", "گرمسار", "مهدیشهر", "سرخه", "میامی"] },
  { province: "بوشهر", capital: "بوشهر", cities: ["بوشهر", "برازجان", "دشتستان", "کنگان", "گناوه", "عسلویه", "جم", "دیر", "خورموج", "دیلم"] },
  { province: "ایلام", capital: "ایلام", cities: ["ایلام", "دهلران", "ایوان", "آبدانان", "مهران", "دره‌شهر", "سرابله", "چرداول"] },
  { province: "چهارمحال و بختیاری", capital: "شهرکرد", cities: ["شهرکرد", "بروجن", "لردگان", "فرخ‌شهر", "فارسان", "سامان", "اردل"] },
  { province: "خراسان شمالی", capital: "بجنورد", cities: ["بجنورد", "شیروان", "اسفراین", "آشخانه", "جاجرم", "گرمه", "فاروج"] },
  { province: "خراسان جنوبی", capital: "بیرجند", cities: ["بیرجند", "قائن", "طبس", "فردوس", "نهبندان", "سرایان", "بشرویه", "درمیان"] },
  { province: "کهگیلویه و بویراحمد", capital: "یاسوج", cities: ["یاسوج", "دوگنبدان", "دهدشت", "لیکک", "چرام", "لنده"] }
];

// Normalized lookup map for Iranian cities and population estimates
const KNOWN_CITIES_DATA: Record<string, { province: string; population: number; tier: 1 | 2 | 3 | 4; tierLabel: string }> = {
  // Tier 1: کلان‌شهرهای بالای ۱.۵ میلیون نفر
  "تهران": { province: "تهران", population: 9250000, tier: 1, tierLabel: "کلان‌شهر ویژه پایتخت (سطح ۱ - توزیع منطقه‌ای)" },
  "مشهد": { province: "خراسان رضوی", population: 3300000, tier: 1, tierLabel: "کلان‌شهر کشور (سطح ۱ - توزیع منطقه‌ای)" },
  "اصفهان": { province: "اصفهان", population: 2200000, tier: 1, tierLabel: "کلان‌شهر کشور (سطح ۱ - توزیع منطقه‌ای)" },
  "کرج": { province: "البرز", population: 1900000, tier: 1, tierLabel: "کلان‌شهر کشور (سطح ۱ - توزیع منطقه‌ای)" },
  "شیراز": { province: "فارس", population: 1750000, tier: 1, tierLabel: "کلان‌شهر کشور (سطح ۱ - توزیع منطقه‌ای)" },
  "تبریز": { province: "آذربایجان شرقی", population: 1700000, tier: 1, tierLabel: "کلان‌شهر کشور (سطح ۱ - توزیع منطقه‌ای)" },
  "قم": { province: "قم", population: 1350000, tier: 1, tierLabel: "کلان‌شهر کشور (سطح ۱ - توزیع منطقه‌ای)" },
  "اهواز": { province: "خوزستان", population: 1300000, tier: 1, tierLabel: "کلان‌شهر کشور (سطح ۱ - توزیع منطقه‌ای)" },

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
  "مرند": { province: "آذربایجان شرقی", population: 160000, tier: 3, tierLabel: "شهرستان تجاری و ترانزیتی (سطح ۳)" },
  "شبستر": { province: "آذربایجان شرقی", population: 90000, tier: 3, tierLabel: "قطب تولید و صنایع غذایی (سطح ۳)" },
  "رفسنجان": { province: "کرمان", population: 180000, tier: 3, tierLabel: "شهرستان تجاری و کشاورزی (سطح ۳)" },
  "ساوه": { province: "مرکزی", population: 240000, tier: 3, tierLabel: "قطب صنعتی (سطح ۳)" },
  "خوی": { province: "آذربایجان غربی", population: 210000, tier: 3, tierLabel: "شهرستان مرزی و تجاری (سطح ۳)" },
  "ملایر": { province: "همدان", population: 190000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "شاهین‌شهر": { province: "اصفهان", population: 180000, tier: 3, tierLabel: "شهرستان حومه (سطح ۳)" },
  "نجف‌آباد": { province: "اصفهان", population: 240000, tier: 3, tierLabel: "شهرستان صنعتی و تجاری (سطح ۳)" },
  "قائم‌شهر": { province: "مازندران", population: 220000, tier: 3, tierLabel: "شهر تجاری (سطح ۳)" },
  "مهاباد": { province: "آذربایجان غربی", population: 180000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "بوکان": { province: "آذربایجان غربی", population: 195000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "سقز": { province: "کردستان", population: 175000, tier: 3, tierLabel: "شهرستان تجاری (سطح ۳)" },
  "بانه": { province: "کردستان", population: 120000, tier: 3, tierLabel: "قطب تجاری مرزی (سطح ۳)" },
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

/**
 * Accurately finds the official Iranian Province for any given City.
 */
export function getProvinceForCity(cityName?: string, fallbackProvince?: string): string {
  if (!cityName || !cityName.trim()) return fallbackProvince || "تهران";
  const normCity = normalizeName(cityName);
  if (!normCity) return fallbackProvince || "تهران";

  // 1. First Pass: Exact Match in IRAN_PROVINCES_AND_CITIES
  for (const item of IRAN_PROVINCES_AND_CITIES) {
    if (normalizeName(item.capital) === normCity) return item.province;
    if (normalizeName(item.province) === normCity) return item.province;
    if (item.cities.some(c => normalizeName(c) === normCity)) {
      return item.province;
    }
  }

  // 2. Exact Match in KNOWN_CITIES_DATA
  if (KNOWN_CITIES_DATA[cityName]) {
    return KNOWN_CITIES_DATA[cityName].province;
  }
  const matchedKey = Object.keys(KNOWN_CITIES_DATA).find(k => normalizeName(k) === normCity);
  if (matchedKey) {
    return KNOWN_CITIES_DATA[matchedKey].province;
  }

  // 3. Second Pass: Prefix / Word boundary match (e.g. "شهر اهواز", "اهواز مرکزی")
  for (const item of IRAN_PROVINCES_AND_CITIES) {
    for (const c of item.cities) {
      const normC = normalizeName(c);
      if (normC.length >= 3 && (normCity.startsWith(normC) || normC.startsWith(normCity))) {
        return item.province;
      }
    }
  }

  // 4. Substring Match only if string length is significant (>= 4 characters)
  if (normCity.length >= 4) {
    for (const item of IRAN_PROVINCES_AND_CITIES) {
      if (item.cities.some(c => {
        const normC = normalizeName(c);
        return normC.length >= 4 && (normCity.includes(normC) || normC.includes(normCity));
      })) {
        return item.province;
      }
    }
  }

  return fallbackProvince || "تهران";
}

/**
 * Returns a flat list of all Iranian cities with their respective province.
 */
export function getAllCitiesList(): { province: string; city: string; isCapital: boolean }[] {
  const list: { province: string; city: string; isCapital: boolean }[] = [];
  IRAN_PROVINCES_AND_CITIES.forEach(p => {
    p.cities.forEach(c => {
      list.push({
        province: p.province,
        city: c,
        isCapital: normalizeName(c) === normalizeName(p.capital)
      });
    });
  });
  return list;
}

/**
 * Robustly matches whether a representative covers a requested city or province.
 */
export function isRepresentativeForCity(rep: any, targetCity?: string, targetProvince?: string): boolean {
  if (!rep) return false;
  if (!targetCity && !targetProvince) return true;

  const normTargetCity = normalizeName(targetCity);
  const normTargetProv = normalizeName(targetProvince || (targetCity ? getProvinceForCity(targetCity) : ""));

  // 1. Direct city exact/normalized check
  if (rep.city && normTargetCity) {
    const normRepCity = normalizeName(rep.city);
    if (normRepCity === normTargetCity) {
      return true;
    }
    // Prefix / boundary match
    if (normRepCity.length >= 3 && normTargetCity.length >= 3) {
      if (normRepCity.startsWith(normTargetCity) || normTargetCity.startsWith(normRepCity)) {
        return true;
      }
    }
  }

  // 2. Check cities array if representative covers multiple cities (e.g., Ahvaz and Dezful)
  if (Array.isArray(rep.cities) && normTargetCity) {
    if (rep.cities.some((c: string) => {
      const normC = normalizeName(c);
      return normC === normTargetCity || (normC.length >= 3 && (normC.startsWith(normTargetCity) || normTargetCity.startsWith(normC)));
    })) {
      return true;
    }
  }

  // 3. Check coverageCities if array or string
  if (rep.coverageCities && normTargetCity) {
    if (Array.isArray(rep.coverageCities)) {
      if (rep.coverageCities.some((c: string) => normalizeName(c) === normTargetCity)) return true;
    } else if (typeof rep.coverageCities === "string") {
      const normCov = normalizeName(rep.coverageCities);
      if (normCov.includes(normTargetCity)) return true;
    }
  }

  // 4. Check address with word boundaries
  if (rep.address && normTargetCity && normTargetCity.length >= 4) {
    const normAddr = normalizeName(rep.address);
    if (normAddr.includes(normTargetCity)) return true;
  }

  // 5. Check company or name if city is in the title (min 4 chars)
  if (normTargetCity && normTargetCity.length >= 4) {
    if (rep.company && normalizeName(rep.company).includes(normTargetCity)) return true;
    if (rep.name && normalizeName(rep.name).includes(normTargetCity)) return true;
  }

  return false;
}

export function formatTomanCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    const milliards = amount / 1_000_000_000;
    const formatted = milliards % 1 === 0 ? milliards.toString() : milliards.toFixed(1);
    return `${toPersianDigits(formatted)} میلیارد تومان`;
  }
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1);
    return `${toPersianDigits(formatted)} میلیون تومان`;
  }
  return `${toPersianDigits(amount.toLocaleString("fa-IR"))} تومان`;
}

export function toPersianDigits(num: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d, 10)] || d);
}

/**
 * Returns dynamic customized distribution zones for any city or metropolis.
 */
function getDynamicZonesForCity(cityName: string, provinceName?: string): string[] {
  const norm = normalizeName(cityName);
  
  if (norm.includes("تهران")) {
    return [
      "منطقه ۱ - شمال (شمیرانات، نیاوران، سعادت‌آباد و ولنجک)",
      "منطقه ۲ - غرب (پونک، صادقیه، چیتگر، تهران‌سر و منطقه ۲۲)",
      "منطقه ۳ - مرکز (بازار بزرگ، خیام، ۱۵ خرداد و راسته بنکداران مولوی)",
      "منطقه ۴ - شرق (تهرانپارس، نارمک، رسالت و حکیمیه)",
      "منطقه ۵ - جنوب (ری، فدائیان اسلام، شوش، نازی‌آباد و کهریزک)"
    ];
  }
  if (norm.includes("مشهد")) {
    return [
      "منطقه ۱ - غرب و بالاشهر (احمدآباد، سجاد، وکیل‌آباد و ملک‌آباد)",
      "منطقه ۲ - مرکز و حرم (مصلی، راسته بنکداران خیام و هفده شهریور)",
      "منطقه ۳ - شرق و شمال (طبرسی، طلاب، رسالت و بلوار گاز)",
      "منطقه ۴ - قطب‌های صنعتی و پخش (شهرک صنعتی توس و جاده کلات)",
      "منطقه ۵ - طرقبه، شاندیز و حومه گردشگری و ییلاقی"
    ];
  }
  if (norm.includes("اصفهان")) {
    return [
      "منطقه ۱ - مرکز و بازار (چهارباغ، میدان امام و راسته بنکداران سبزه میدان)",
      "منطقه ۲ - جنوب (مرداویج، خاقانی، دروازه شیراز و سپاهان‌شهر)",
      "منطقه ۳ - غرب (آتشگاه، ناژوان و شهرک صنعتی امیرکبیر)",
      "منطقه ۴ - شرق (بزرگمهر، پروین، پل خواجو و جی)",
      "منطقه ۵ - بهارستان، شاهین‌شهر و مناطق تابعه اصفهان"
    ];
  }
  if (norm.includes("تبریز")) {
    return [
      "منطقه ۱ - شمال و شرق (ولیعصر، رشدیه، ایل‌گلی، زعفرانیه و باغمیشه)",
      "منطقه ۲ - مرکز و بازار کهن (بازار سرپوشیده، راسته کفاشان و دارایی)",
      "منطقه ۳ - غرب و صنعتی (جاده سنتو، قراملک و شهرک‌های صنعتی شهید رجایی)",
      "منطقه ۴ - جنوب و شهر جدید سهند (منظریه، مارالان، ابوریحان و سهند)"
    ];
  }
  if (norm.includes("شیراز")) {
    return [
      "منطقه ۱ - شمال و غرب (معالی‌آباد، فرهنگ‌شهر، قصردشت، ارم و تاچارا)",
      "منطقه ۲ - مرکز و بافت تجاری (بازار وکیل، لطفعلی‌خان زند و دروازه کازرون)",
      "منطقه ۳ - شرق و جنوب (مدرس، پودنک، بلوار نصر و شهرک صنعتی بزرگ)",
      "منطقه ۴ - شهر جدید صدرا و حومه توزیع استانی"
    ];
  }
  if (norm.includes("کرج")) {
    return [
      "منطقه ۱ - شمال (عظیمیه، جهانشهر، گوهردشت و کوهسار)",
      "منطقه ۲ - غرب و مرکز (مهرشهر، مهرویلا، گلشهر، طالقانی و حصارک)",
      "منطقه ۳ - جنوب و قطب صنعتی (فردیس، محمدشهر، سیمین‌دشت و ماهدشت)"
    ];
  }
  if (norm.includes("اهواز")) {
    return [
      "منطقه ۱ - شمال و غرب (کیانپارس، کیان‌آباد، وهابی و امانیه)",
      "منطقه ۲ - مرکز و شرق (زیتون کارمندی، پادادشهر، باهنر و بازار امام)",
      "منطقه ۳ - جنوب و قطب‌های صنعتی و بندری (کوت عبدالله و شهرک‌های صنعتی)"
    ];
  }
  if (norm.includes("قم")) {
    return [
      "منطقه ۱ - جنوب و غرب (زنبیل‌آباد، صفائیه، سالاریه و بلوار امین)",
      "منطقه ۲ - مرکز و بازار (راسته بازار کهنه، میدان آستانه و نیروگاه)",
      "منطقه ۳ - پردیسان، شهرک قدس و قطب صنعتی شکوهیه"
    ];
  }

  // Tier 2 & Tier 3 customized zones
  return [
    `منطقه ۱ - حوزه شهری و بازار مرکزی ${cityName} (فروشگاه‌ها و بنکداران مستقر)`,
    `منطقه ۲ - حوزه پخش مویرگی حومه، شهرک‌های صنعتی و شهرستان‌های همجوار ${cityName}`
  ];
}

/**
 * Calculates Dealership Carton Quota, Progressive Growth Tiers, and Multi-level Zones
 * tailored dynamically for ANY Iranian City or Small Town.
 */
export function calculateDealershipTier(cityInput?: string, provinceInput?: string): CityTierData {
  let rawCity = (cityInput || "").trim();
  let rawProvince = (provinceInput || "").trim();

  // If province is given and city is empty, pick province's capital
  if (!rawCity && rawProvince) {
    const provMatch = IRAN_PROVINCES_AND_CITIES.find(p => normalizeName(p.province) === normalizeName(rawProvince));
    if (provMatch) {
      rawCity = provMatch.capital;
    }
  }

  // Default fallback if both are empty
  if (!rawCity) {
    rawCity = "تهران";
    rawProvince = "تهران";
  }

  const normCity = normalizeName(rawCity);
  
  // 1. Direct match in KNOWN_CITIES_DATA
  let matchedKey = Object.keys(KNOWN_CITIES_DATA).find((k) => normalizeName(k) === normCity);
  if (!matchedKey) {
    matchedKey = Object.keys(KNOWN_CITIES_DATA).find((k) => normCity.includes(normalizeName(k)) || normalizeName(k).includes(normCity));
  }

  let baseData = matchedKey ? KNOWN_CITIES_DATA[matchedKey] : null;

  // 2. If not directly in known data, search in IRAN_PROVINCES_AND_CITIES
  if (!baseData) {
    let foundProvItem: ProvinceCitiesItem | undefined;
    for (const pItem of IRAN_PROVINCES_AND_CITIES) {
      if (pItem.cities.some(c => normalizeName(c) === normCity)) {
        foundProvItem = pItem;
        break;
      }
    }

    if (foundProvItem) {
      const isCapital = normalizeName(foundProvItem.capital) === normCity;
      if (isCapital) {
        baseData = {
          province: foundProvItem.province,
          population: 400000,
          tier: 2,
          tierLabel: `مرکز استان ${foundProvItem.province} (سطح ۲)`
        };
      } else {
        baseData = {
          province: foundProvItem.province,
          population: 120000,
          tier: 3,
          tierLabel: `شهرستان تجاری ${foundProvItem.province} (سطح ۳)`
        };
      }
    }
  }

  // 3. Fallback inference by Province
  if (!baseData) {
    const inferredProvince = rawProvince || "سایر مناطق کشور";
    const normProv = normalizeName(inferredProvince);
    if (normProv.includes("تهران")) {
      baseData = { province: "تهران", population: 250000, tier: 2, tierLabel: "شهرستان تابعه تهران (سطح ۲)" };
    } else if (normProv.includes("خراسان") || normProv.includes("اصفهان") || normProv.includes("فارس") || normProv.includes("خوزستان") || normProv.includes("البرز") || normProv.includes("گیلان") || normProv.includes("مازندران") || normProv.includes("آذربایجان")) {
      baseData = { province: inferredProvince, population: 120000, tier: 3, tierLabel: "شهرستان متوسط استانی (سطح ۳)" };
    } else {
      baseData = { province: inferredProvince, population: 65000, tier: 4, tierLabel: "شهرستان و توزیع منطقه‌ای (سطح ۴)" };
    }
  }

  const effectiveProvince = rawProvince || baseData.province;
  const isMetropolis = baseData.tier === 1;
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
  let representativeLevels: CityTierData['representativeLevels'] | undefined;

  const availableZones = getDynamicZonesForCity(rawCity, effectiveProvince);

  if (baseData.tier === 1) {
    // Tier 1: Metropolises
    starterMinCartons = "۱۵۰ تا ۳۰۰ کارتن";
    monthlyCartons = "۸۰۰ تا ۲,۵۰۰ کارتن";
    growthTargetCartons = "تا ۴,۰۰۰ کارتن در ماه";
    initialMinOrderToman = 180_000_000;
    monthlyQuotaCeilingToman = 2_000_000_000;
    guaranteeLimitToman = 350_000_000;
    recommendedWarehouseSpace = "از ۱۵۰ تا ۵۰۰ متر مربع انبار مکانیزه";
    recommendedFleet = "۲ الی ۴ دستگاه وانت یا خاور پخش مویرگی";
    estimatedGrossMargin = "۲۴٪ تا ۳۰٪ سود خالص";

    representativeLevels = [
      {
        level: "diamond",
        title: `💎 سطح ۱: نماینده الماس (${rawCity})`,
        description: `توزیع انحصاری در منطقه مشخص ${rawCity} و ارجاع کلیه خریداران عمده و هایپرمارکت‌ها`,
        minMonthlyVolumeToman: 1_500_000_000,
        minMonthlyVolumeFormatted: "۱.۵ میلیارد تومان"
      },
      {
        level: "gold",
        title: `🥇 سطح ۲: نماینده طلایی (${rawCity})`,
        description: `پخش مویرگی محلی و سوپرمارکت‌های زنجیره‌ای حوزه اختصاصی ${rawCity}`,
        minMonthlyVolumeToman: 600_000_000,
        minMonthlyVolumeFormatted: "۶۰۰ میلیون تومان"
      },
      {
        level: "silver",
        title: `🥈 سطح ۳: نماینده نقره‌ای (${rawCity})`,
        description: `توزیع سریع و تأمین سوپرمارکت‌ها با ورود آسان و بدون ریسک انبارداری در ${rawCity}`,
        minMonthlyVolumeToman: 300_000_000,
        minMonthlyVolumeFormatted: "۳۰۰ میلیون تومان"
      }
    ];

    growthSteps = [
      {
        stepNumber: 1,
        title: `گام ۱: ورود کم‌ریسک به بازار ${rawCity}`,
        cartonRange: "۱۵۰ تا ۳۰۰ کارتن",
        volumeTomanFormatted: "۱۸۰ میلیون تومان",
        marginPercent: "۲۲٪ تا ۲۴٪",
        description: `آغاز عاملیت رسمی در ${rawCity} با حداقل سرمایه در گردش و ارسال مستقیم کارخانه`
      },
      {
        stepNumber: 2,
        title: `گام ۲: تثبیت توزیع منطقه‌ای در ${rawCity}`,
        cartonRange: "۸۰۰ تا ۱,۵۰۰ کارتن",
        volumeTomanFormatted: "۸۰۰ میلیون تا ۱.۲ میلیارد تومان",
        marginPercent: "۲۵٪ تا ۲۷٪",
        description: `ارجاع سفارشات پلتفرم در منطقه انتخابی شما در ${rawCity}`
      },
      {
        stepNumber: 3,
        title: `گام ۳: عاملیت ارشد و بنکداری کلان‌شهر`,
        cartonRange: "۲,۰۰۰ تا ۳,۰۰۰ کارتن",
        volumeTomanFormatted: "۲ میلیارد تومان",
        marginPercent: "۳۰٪ ماکزیمم",
        description: `حداکثر سهمیه، اعتبار اسنادی صیادی و ارزان‌ترین نرخ خط تولید مستقیم`
      }
    ];
  } else if (baseData.tier === 2) {
    // Tier 2: Provincial Centers & Large Hubs (e.g. Rasht, Kermanshah, Kashan, Dezful)
    starterMinCartons = "۴۰ تا ۸۰ کارتن";
    monthlyCartons = "۲۰۰ تا ۵۰۰ کارتن";
    growthTargetCartons = "تا ۱,۰۰۰ کارتن در ماه";
    initialMinOrderToman = 48_000_000;
    monthlyQuotaCeilingToman = 600_000_000;
    guaranteeLimitToman = 120_000_000;
    recommendedWarehouseSpace = "۵۰ تا ۱۵۰ متر مربع (فروشگاه یا انبار)";
    recommendedFleet = "۱ الی ۲ دستگاه وانت پخش";
    estimatedGrossMargin = "۲۲٪ تا ۲۸٪ سود خالص";

    representativeLevels = [
      {
        level: "diamond",
        title: `💎 عاملیت انحصاری مرکز استان (${rawCity})`,
        description: `پوشش کامل بازار بنکداران و سوپرمارکت‌های ${rawCity} و مناطق تابعه`,
        minMonthlyVolumeToman: 500_000_000,
        minMonthlyVolumeFormatted: "۵۰۰ میلیون تومان"
      },
      {
        level: "gold",
        title: `🥇 عاملیت توزیع مویرگی (${rawCity})`,
        description: `پخش منظم در سطح شهرستان و شهرک‌های اطراف با تخفیف مستقیم`,
        minMonthlyVolumeToman: 250_000_000,
        minMonthlyVolumeFormatted: "۲۵۰ میلیون تومان"
      },
      {
        level: "silver",
        title: `🥈 عامل توزیع سریع (${rawCity})`,
        description: `ورود چابک با شروع از ۴۰ کارتن و ارتقای سهمیه متناسب با فروش`,
        minMonthlyVolumeToman: 100_000_000,
        minMonthlyVolumeFormatted: "۱۰۰ میلیون تومان"
      }
    ];

    growthSteps = [
      {
        stepNumber: 1,
        title: `گام ۱: ورود چابک به بازار ${rawCity}`,
        cartonRange: "۴۰ تا ۸۰ کارتن",
        volumeTomanFormatted: "۴۸ میلیون تومان",
        marginPercent: "۲۱٪ تا ۲۳٪",
        description: `شروع توزیع در ${rawCity} با تسهیلات باربری و تضمین بازخرید کارخانه`
      },
      {
        stepNumber: 2,
        title: `گام ۲: گسترش شبکه فروش در ${effectiveProvince}`,
        cartonRange: "۲۰۰ تا ۵۰۰ کارتن",
        volumeTomanFormatted: "۲۰۰ تا ۴۵۰ میلیون تومان",
        marginPercent: "۲۴٪ تا ۲۶٪",
        description: `توزیع گسترده در فروشگاه‌های ${rawCity} و شهرهای همجوار`
      },
      {
        stepNumber: 3,
        title: `گام ۳: نماینده ارشد ${rawCity}`,
        cartonRange: "۸۰۰ تا ۱,۲۰۰ کارتن",
        volumeTomanFormatted: "۶۰۰ میلیون تومان",
        marginPercent: "۲۸٪ ماکزیمم",
        description: `بالاترین رتبه نمایندگی با تخفیف طلایی و اولویت تخصیص خط تولید`
      }
    ];
  } else if (baseData.tier === 3) {
    // Tier 3: Medium Cities (100k to 300k, e.g. Quchan, Sabzevar, Maragheh, Amol, Saveh)
    starterMinCartons = "۲۰ تا ۴۰ کارتن";
    monthlyCartons = "۶۰ تا ۱۸۰ کارتن";
    growthTargetCartons = "تا ۴۰۰ کارتن در ماه";
    initialMinOrderToman = 22_000_000;
    monthlyQuotaCeilingToman = 220_000_000;
    guaranteeLimitToman = 45_000_000;
    recommendedWarehouseSpace = "۳۰ تا ۸۰ متر مربع (مغازه، انبار یا فروشگاه)";
    recommendedFleet = "۱ دستگاه وانت یا خودرو سواری باربری";
    estimatedGrossMargin = "۲۱٪ تا ۲۶٪ سود خالص";

    growthSteps = [
      {
        stepNumber: 1,
        title: `گام ۱: شروع آسان در ${rawCity}`,
        cartonRange: "۲۰ تا ۴۰ کارتن",
        volumeTomanFormatted: "۲۲ میلیون تومان",
        marginPercent: "۲۰٪",
        description: `شروع کار در ${rawCity} بدون نیاز به انبار بزرگ یا تعهدات سنگین`
      },
      {
        stepNumber: 2,
        title: `گام ۲: توسعه فروش شهرستان ${rawCity}`,
        cartonRange: "۶۰ تا ۱۸۰ کارتن",
        volumeTomanFormatted: "۶۰ تا ۱۲۰ میلیون تومان",
        marginPercent: "۲۳٪",
        description: `افزایش خودکار سهمیه متناسب با کشش بازار شهرستان ${rawCity}`
      },
      {
        stepNumber: 3,
        title: `گام ۳: عاملیت انحصاری ${rawCity}`,
        cartonRange: "۲۵۰ تا ۴۰۰ کارتن",
        volumeTomanFormatted: "۲۲۰ میلیون تومان",
        marginPercent: "۲۶٪ ماکزیمم",
        description: `عاملیت رسمی با ارجاع کلیه خریداران عمده و سوپرمارکت‌های بومی`
      }
    ];
  } else {
    // Tier 4: Small Towns (< 100k) - VERY ACCESSIBLE
    starterMinCartons = "۱۰ تا ۲۰ کارتن";
    monthlyCartons = "۳۰ تا ۶۰ کارتن";
    growthTargetCartons = "تا ۱۲۰ کارتن در ماه";
    initialMinOrderToman = 12_000_000;
    monthlyQuotaCeilingToman = 90_000_000;
    guaranteeLimitToman = 20_000_000;
    recommendedWarehouseSpace = "۲۰ تا ۵۰ متر مربع (مغازه یا انبار محلی)";
    recommendedFleet = "۱ دستگاه وانت یا خودرو شخصی";
    estimatedGrossMargin = "۲۰٪ تا ۲۴٪ سود خالص";

    growthSteps = [
      {
        stepNumber: 1,
        title: `گام ۱: ثبت و شروع در ${rawCity}`,
        cartonRange: "۱۰ تا ۲۰ کارتن",
        volumeTomanFormatted: "۱۲ میلیون تومان",
        marginPercent: "۱۹٪",
        description: `ورود با حداقل سرمایه اولیه برای همه متقاضیان ${rawCity}`
      },
      {
        stepNumber: 2,
        title: `گام ۲: رشد تدریجی توزیع محلی`,
        cartonRange: "۳۰ تا ۶۰ کارتن",
        volumeTomanFormatted: "۳۰ تا ۶۰ میلیون تومان",
        marginPercent: "۲۱٪",
        description: `رشد پلکانی متناسب با نیاز سوپرمارکت‌ها و فروشگاه‌های منطقه`
      },
      {
        stepNumber: 3,
        title: `گام ۳: نماینده معتمد منطقه ${rawCity}`,
        cartonRange: "۷۰ تا ۱۲۰ کارتن",
        volumeTomanFormatted: "۹۰ میلیون تومان",
        marginPercent: "۲۴٪",
        description: `ارسال مستقیم باربری بدون واسطه با تعرفه مصوب کارخانه`
      }
    ];
  }

  return {
    cityName: rawCity,
    provinceName: effectiveProvince,
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

export interface DealershipSimulationResult {
  estimatedMonthlyProfitToman: number;
  estimatedMonthlyProfitFormatted: string;
  estimatedMonthlyRevenueToman: number;
  estimatedMonthlyRevenueFormatted: string;
  requiredGuaranteeToman: number;
  requiredGuaranteeFormatted: string;
  profitMarginPercent: string;
  paybackPeriodMonths: string;
  cartonVolume: number;
  tierRank: "الماس" | "طلایی" | "نقره‌ای" | "برنزی";
}

/**
 * Interactive Financial Simulation Engine for Dealership Applicants.
 */
export function simulateDealershipFinancials(
  cartonCount: number,
  tier: 1 | 2 | 3 | 4
): DealershipSimulationResult {
  // Average carton factory price approx 1,150,000 Tomans
  const cartonPriceToman = 1_150_000;
  const revenueToman = cartonCount * cartonPriceToman;

  let marginRate = 0.22;
  let tierRank: "الماس" | "طلایی" | "نقره‌ای" | "برنزی" = "برنزی";

  if (cartonCount >= 500 || tier === 1) {
    marginRate = 0.28;
    tierRank = "الماس";
  } else if (cartonCount >= 200 || tier === 2) {
    marginRate = 0.25;
    tierRank = "طلایی";
  } else if (cartonCount >= 80 || tier === 3) {
    marginRate = 0.23;
    tierRank = "نقره‌ای";
  } else {
    marginRate = 0.21;
    tierRank = "برنزی";
  }

  const profitToman = Math.round(revenueToman * marginRate);
  const guaranteeToman = Math.round(revenueToman * 0.25); // 25% cheque guarantee
  const paybackMonths = cartonCount > 250 ? "۱ تا ۲ ماه" : "کمتر از ۱ ماه";

  return {
    estimatedMonthlyProfitToman: profitToman,
    estimatedMonthlyProfitFormatted: formatTomanCurrency(profitToman),
    estimatedMonthlyRevenueToman: revenueToman,
    estimatedMonthlyRevenueFormatted: formatTomanCurrency(revenueToman),
    requiredGuaranteeToman: guaranteeToman,
    requiredGuaranteeFormatted: formatTomanCurrency(guaranteeToman),
    profitMarginPercent: `${Math.round(marginRate * 100)}٪`,
    paybackPeriodMonths: paybackMonths,
    cartonVolume: cartonCount,
    tierRank
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
