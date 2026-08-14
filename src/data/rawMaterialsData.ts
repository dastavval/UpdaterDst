export interface RawMaterial {
  id: string;
  name: string;
  category: string;
  supplierName: string;
  supplierLocation: string;
  unit: string;
  minOrder: string;
  priceEstimate: string;
  deliveryDays: string;
  specs: string[];
  description: string;
  imageUrl: string;
  isVerified: boolean;
  escrowGuaranteed?: boolean;
  isPendingApproval?: boolean;
}

export interface RawMaterialSupplier {
  id: string;
  companyName: string;
  category: string;
  location: string;
  contactPhone: string;
  email?: string;
  establishedYear: number;
  mainProducts: string[];
  description: string;
  isVerified: boolean;
  rating: number;
  logoUrl?: string;
}

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [
  {
    id: "raw-1",
    name: "شکر سفید تصفیه شده کشت و صنعت دهخدا (گرید A کیسه ۵۰ ک)",
    category: "مواد اولیه شیرینی و شکلات",
    supplierName: "کشت و صنعت نیشکر دهخدا",
    supplierLocation: "خوزستان - اهواز",
    unit: "تن",
    minOrder: "۱۰ تن",
    priceEstimate: "۴۲,۵۰۰ تومان",
    deliveryDays: "۳ روز کاری",
    specs: ["پولاریزاسیون ۹۹.۸٪", "رطوبت کمتر از ۰.۰۴٪", "سیب سلامت فعال", "آنالیز کارخانه‌ای استاندارد"],
    description: "شکر تصفیه شده سفید درجه یک ممتاز مناسب برای کارخانجات تولید کیک، کلوچه، نوشیدنی و صنایع قنادی سراسر کشور. تحویل مستقیم جاده‌ای با فاکتور رسمی.",
    imageUrl: "https://images.unsplash.com/photo-1622484211148-716598e09141?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    escrowGuaranteed: true
  },
  {
    id: "raw-2",
    name: "آرد گندم ستاره نول صنعتی ۲۱٪ صنف و صنعت سبوس‌دار",
    category: "آرد و غلات صنعتی",
    supplierName: "آرد غلات تهران",
    supplierLocation: "تهران - جاده قدیم کرج",
    unit: "تن",
    minOrder: "۱۵ تن",
    priceEstimate: "۲۸,۹۰۰ تومان",
    deliveryDays: "۲ روز کاری",
    specs: ["گلوتن مرطوب حداقل ۲۷٪", "خاکستر حداکثر ۰.۴۵٪", "سبوس‌گیری شده ۲۱٪", "پروانه ساخت بهداشتی"],
    description: "آرد گندم صنعتی نول ۲۱٪ ویژه صنایع بیسکویت، ماکارونی، کیک و کلوچه و محصولات نان صنعتی با کیفیت پخت فوق‌العاده و تست آزمایشگاهی مجهز.",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    escrowGuaranteed: true
  },
  {
    id: "raw-3",
    name: "روغن جانشین کره کاکائو (CBS) فله برند لوریکا مالزی",
    category: "روغن و چربی‌های تخصصی",
    supplierName: "بازرگانی اقیانوس طلایی واردات",
    supplierLocation: "تهران - نیاوران",
    unit: "کارتن ۲۰ ک",
    minOrder: "۵ تن",
    priceEstimate: "۱۱۵,۰۰۰ تومان",
    deliveryDays: "۴ روز کاری",
    specs: ["نقطه ذوب ۳۴.۵ درجه", "اسید چرب آزاد زیر ۰.۱٪", "بدون ترانس زاید", "سازگار با پودر کاکائو طبیعی"],
    description: "روغن جانشین کره کاکائو تخصصی هیدروژنه و تصفیه شده با کیفیت فرم‌دهی عالی جهت صنایع شکلات‌سازی، روکش کیک و بیسکویت و انواع فرآورده‌های کاکائویی.",
    imageUrl: "https://images.unsplash.com/photo-1548907040-4d42b52125ca?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    escrowGuaranteed: true
  },
  {
    id: "raw-4",
    name: "فیلم سلفون شفاف BOPP عرض ۸۰ سانت مخصوص بسته‌بندی",
    category: "بسته‌بندی و ملزومات چاپ",
    supplierName: "صنایع پلاستیک البرز",
    supplierLocation: "قزوین - شهرک صنعتی البرز",
    unit: "کیلوگرم",
    minOrder: "۵۰۰ کیلوگرم",
    priceEstimate: "۸۸,۰۰۰ تومان",
    deliveryDays: "۵ روز کاری",
    specs: ["ضخامت ۳۰ میکرون", "قابلیت دوخت حرارتی بالا", "مقاومت کششی عالی", "شفافیت فوق‌العاده کریستالی"],
    description: "رول سلفون BOPP درجه یک ویژه بسته‌بندی‌های اتوماتیک پیلوپک کیک، کلوچه، بیسکویت و ماکارونی با قابلیت چاپ‌پذیری بالا هماهنگ با دستگاه‌های بسته‌بندی پرسرعت.",
    imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    escrowGuaranteed: true
  }
];

export const INITIAL_RAW_SUPPLIERS: RawMaterialSupplier[] = [
  {
    id: "sup-1",
    companyName: "کشت و صنعت نیشکر دهخدا",
    category: "مواد اولیه شیرینی و شکلات",
    location: "خوزستان - اهواز",
    contactPhone: "۰۶۱۳۳۱۳۴۰۰۰",
    establishedYear: 1382,
    mainProducts: ["شکر سفید تصفیه شده", "شکر قهوه‌ای صنعتی", "ملاس نیشکر"],
    description: "بزرگترین مجتمع کشت و صنعت نیشکر جنوب کشور، تولیدکننده شکر با کیفیت عالی و خط تولید کاملاً مکانیزه تصفیه و غنی‌سازی شکر.",
    isVerified: true,
    rating: 4.9,
    logoUrl: "https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=200&q=80"
  },
  {
    id: "sup-2",
    companyName: "بازرگانی اقیانوس طلایی واردات",
    category: "روغن و چربی‌های تخصصی",
    location: "تهران - نیاوران",
    contactPhone: "۰۲۱۲۲۸۳۴۴۵۵",
    establishedYear: 1395,
    mainProducts: ["روغن CBS کره کاکائو", "پودر کاکائو فوتو ترک", "نشاسته ذرت صنعتی"],
    description: "واردکننده انحصاری افزودنی‌های صنایع غذایی، پودرهای لبنی، نشاسته‌ها و چربی‌های تخصصی قنادی و شیرینی‌سازی از مالزی و ترکیه.",
    isVerified: true,
    rating: 4.8,
    logoUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=200&q=80"
  }
];
