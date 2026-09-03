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
  status?: string;
  rejectionReason?: string;
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
    id: "mat-1",
    name: "شکر سفید تصفیه شده صنعتی و دارویی (کیسه ۵۰ کیلویی)",
    category: "مواد اولیه شیرینی و شکلات",
    supplierName: "توسعه نیشکر و صنایع جانبی خوزستان",
    supplierLocation: "اهواز - کارون",
    unit: "تن (کیسه ۵۰ کیلوگرمی)",
    minOrder: "۵ تن",
    priceEstimate: "۴۸,۵۰۰ تومان / کیلوگرم",
    deliveryDays: "۲ روز کاری",
    specs: ["خلوص ۹۹.۸٪", "رطوبت زیر ۰.۰۴٪", "دارای برگه آنالیز COA و پروانه استاندارد"],
    description: "تامین مستقیم شکر سفید کریستال صنعتی ممتاز ویژه کارخانجات شکلات، نوشیدنی و کنسروجات با تحویل مستقیم از درب کارخانه.",
    imageUrl: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&q=80&w=600",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-2",
    name: "گلوکز مایع شفاف خوراکی DE 42 درجه یک",
    category: "مواد اولیه شیرینی و شکلات",
    supplierName: "صنایع نشاسته و گلوکز زرین گلوکز",
    supplierLocation: "قزوین - شهرک صنعتی لیا",
    unit: "بشکه ۲۲۰ لیتری / تانکر فله",
    minOrder: "۲ تن",
    priceEstimate: "۳۴,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۳ روز کاری",
    specs: ["شفافیت صد در صدی", "DE 42-44", "بریکس ۸۴٪", "سیب سلامت فعال"],
    description: "گلوکز مرغوب ذرت بدون رنگ و بدون بو، با غلظت استاندارد مناسب خطوط تولید کیک، بیسکویت، شکلات، گز و انواع تافی و کارامل.",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-3",
    name: "پودر کاکائو آلکالایز تیره چربی ۱۰-۱۲٪ وارداتی",
    category: "مواد اولیه شیرینی و شکلات",
    supplierName: "بازرگانی بین‌المللی ارس تجارت نوین",
    supplierLocation: "منطقه آزاد ارس (جلفا)",
    unit: "کیسه ۲۵ کیلویی کرافت",
    minOrder: "۵۰۰ کیلوگرم",
    priceEstimate: "۳۸۰,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۱ روز کاری",
    specs: ["چربی ۱۰ تا ۱۲ درصد", "رنگ قهوه‌ای تیره جذاب", "عطر و طعم خالص هلندی"],
    description: "پودر کاکائو فراوری شده آلکالایز با حلالیت بسیار بالا در آب و شیر، مخصوص روکش شکلات، کیک و بستنی صنعتی با ضمانت آنالیز آزمایشگاهی.",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&q=80&w=600",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-4",
    name: "روغن جانشین کره کاکائو (CBS) قالبی و روغن شورتنینگ",
    category: "روغن و چربی‌های تخصصی",
    supplierName: "صنایع روغن‌کشی و تصفیه بهارستان",
    supplierLocation: "کرج - شهرک صنعتی اشتهارد",
    unit: "کارتن ۲۰ کیلوگرمی قالبی",
    minOrder: "۱ تن",
    priceEstimate: "۱۴۵,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۲ روز کاری",
    specs: ["نقطه ذوب ۳۴-۳۶ درجه", "بافت شکننده و براق", "بدون اسید چرب ترانس مضر"],
    description: "روغن CBS مرغوب ویژه قالب‌ریزی و روکش‌دهی شکلات، کرم وافل و بیسکویت بدون نیاز به فرآیند تمپرینگ با مقاومت حرارتی بالا.",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-5",
    name: "لفاف سلفون OPP و متالایز چاپی ۸ رنگ فلکسوگرافی",
    category: "بسته‌بندی و ملزومات چاپ",
    supplierName: "مجتمع چاپ و بسته‌بندی نگین پویا",
    supplierLocation: "تبریز - شهرک صنعتی شهید سلیمی",
    unit: "کیلوگرم / رول ماشینی",
    minOrder: "۳۰۰ کیلوگرم",
    priceEstimate: "۱۹۵,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۵ روز کاری",
    specs: ["دوخت‌پذیری عالی", "نفوذناپذیری در برابر رطوبت و اکسیژن", "چاپ عکاسی با کیفیت HD"],
    description: "تولید و چاپ تخصصی انواع رول‌های بسته‌بندی سلفون مات، صدفی، متالایز و شفاف با سیل‌حرارتی مناسب کلیه دستگاه‌های پیلوپک افقی و عمودی.",
    imageUrl: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=600",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-6",
    name: "رب گوجه فرنگی فله بریکس ۳۶-۳۸ اسپتیک صادراتی",
    category: "کنسروجات و عصاره‌های صنعتی",
    supplierName: "کشت و صنعت دشت طلایی خراسان",
    supplierLocation: "مشهد - شهرک صنعتی چناران",
    unit: "بشکه ۲۲۰ کیلوگرمی اسپتیک",
    minOrder: "۲ تن",
    priceEstimate: "۷۲,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۲ روز کاری",
    specs: ["بریکس ۳۶ تا ۳۸ درصد", "رنگ بوستویک بالای ۲.۱", "بسته‌بندی اسپتیک استاندارد جهانی"],
    description: "رب گوجه فرنگی غلیظ و بدون نمک اسپتیک جهت استفاده در کارخانجات سس، کنسرو و چیپس با بهترین کیفیت رنگ و بریکس تضمینی.",
    imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  }
];

export const INITIAL_RAW_SUPPLIERS: RawMaterialSupplier[] = [
  {
    id: "sup-1",
    companyName: "توسعه نیشکر و صنایع جانبی خوزستان",
    category: "تولیدکننده شکر و مشتقات نیشکر",
    location: "اهواز",
    contactPhone: "۰۶۱۳۳۳۳۴۴۵۵",
    establishedYear: 1378,
    mainProducts: ["شکر سفید", "شکر قهوه‌ای", "الکل طبی", "ملاس"],
    description: "بزرگترین تامین‌کننده قند و شکر تصفیه شده واحدهای صنایع غذایی کشور با تضمین آزمایشگاهی.",
    isVerified: true,
    rating: 5,
    logoUrl: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: "sup-2",
    companyName: "صنایع نشاسته و گلوکز زرین گلوکز",
    category: "تولیدکننده نشاسته، گلوکز و گلوتن",
    location: "قزوین",
    contactPhone: "۰۲۸۳۳۲۲۱۱۰۰",
    establishedYear: 1385,
    mainProducts: ["گلوکز DE42", "نشاسته ذرت تصفیه شده", "گلوتن گندم", "فروکتوز"],
    description: "خط تولید پیشرفته فرآوری مشتقات نشاسته و قندهای صنعتی با ظرفیت ماهانه ۳۰۰۰ تن.",
    isVerified: true,
    rating: 4.9,
    logoUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=200"
  }
];
