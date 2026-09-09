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
  phone?: string;
  contactPhone?: string;
  createdAt?: string;
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
    category: "شیرین‌کننده‌ها و نشاسته صنعتی",
    supplierName: "توسعه نیشکر و صنایع جانبی خوزستان",
    supplierLocation: "اهواز - کارون",
    unit: "تن (کیسه ۵۰ کیلوگرمی)",
    minOrder: "۵ تن",
    priceEstimate: "۴۸,۵۰۰ تومان / کیلوگرم",
    deliveryDays: "۲ روز کاری",
    specs: ["خلوص ۹۹.۸٪", "رطوبت زیر ۰.۰۴٪", "دارای برگه آنالیز COA و پروانه استاندارد"],
    description: "تامین مستقیم شکر سفید کریستال صنعتی ممتاز ویژه کارخانجات شکلات، نوشیدنی و کنسروجات با تحویل مستقیم از درب کارخانه.",
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_100.webp",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-2",
    name: "گلوکز مایع شفاف خوراکی DE 42 درجه یک",
    category: "شیرین‌کننده‌ها و نشاسته صنعتی",
    supplierName: "صنایع نشاسته و گلوکز زرین گلوکز",
    supplierLocation: "قزوین - شهرک صنعتی لیا",
    unit: "بشکه ۲۲۰ لیتری / تانکر فله",
    minOrder: "۲ تن",
    priceEstimate: "۳۴,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۳ روز کاری",
    specs: ["شفافیت صد در صدی", "DE 42-44", "بریکس ۸۴٪", "سیب سلامت فعال"],
    description: "گلوکز مرغوب ذرت بدون رنگ و بدون بو، با غلظت استاندارد مناسب خطوط تولید کیک، بیسکویت، شکلات، گز و انواع تافی و کارامل.",
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_101.webp",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-3",
    name: "پودر کاکائو آلکالایز تیره چربی ۱۰-۱۲٪ وارداتی",
    category: "پودر کاکائو، شیرخشک و پودرهای لبنی",
    supplierName: "بازرگانی بین‌المللی ارس تجارت نوین",
    supplierLocation: "منطقه آزاد ارس (جلفا)",
    unit: "کیسه ۲۵ کیلویی کرافت",
    minOrder: "۵۰۰ کیلوگرم",
    priceEstimate: "۳۸۰,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۱ روز کاری",
    specs: ["چربی ۱۰ تا ۱۲ درصد", "رنگ قهوه‌ای تیره جذاب", "عطر و طعم خالص هلندی"],
    description: "پودر کاکائو فراوری شده آلکالایز با حلالیت بسیار بالا در آب و شیر، مخصوص روکش شکلات، کیک و بستنی صنعتی با ضمانت آنالیز آزمایشگاهی.",
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_102.webp",
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
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_103.webp",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-5",
    name: "لفاف سلفون OPP و متالایز چاپی ۸ رنگ فلکسوگرافی",
    category: "سلفون، لفاف و فیلم‌های بسته‌بندی",
    supplierName: "مجتمع چاپ و بسته‌بندی نگین پویا",
    supplierLocation: "تبریز - شهرک صنعتی شهید سلیمی",
    unit: "کیلوگرم / رول ماشینی",
    minOrder: "۳۰۰ کیلوگرم",
    priceEstimate: "۱۹۵,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۵ روز کاری",
    specs: ["دوخت‌پذیری عالی", "نفوذناپذیری در برابر رطوبت و اکسیژن", "چاپ عکاسی با کیفیت HD"],
    description: "تولید و چاپ تخصصی انواع رول‌های بسته‌بندی سلفون مات، صدفی، متالایز و شفاف با سیل‌حرارتی مناسب کلیه دستگاه‌های پیلوپک افقی و عمودی.",
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_104.webp",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-6",
    name: "رب گوجه فرنگی فله بریکس ۳۶-۳۸ اسپتیک صادراتی",
    category: "کنسروجات، رب اسپتیک و عصاره صنعتی",
    supplierName: "کشت و صنعت دشت طلایی خراسان",
    supplierLocation: "مشهد - شهرک صنعتی چناران",
    unit: "بشکه ۲۲۰ کیلوگرمی اسپتیک",
    minOrder: "۲ تن",
    priceEstimate: "۷۲,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۲ روز کاری",
    specs: ["بریکس ۳۶ تا ۳۸ درصد", "رنگ بوستویک بالای ۲.۱", "بسته‌بندی اسپتیک استاندارد جهانی"],
    description: "رب گوجه فرنگی غلیظ و بدون نمک اسپتیک جهت استفاده در کارخانجات سس، کنسرو و چیپس با بهترین کیفیت رنگ و بریکس تضمینی.",
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_105.webp",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-7",
    name: "آرد صنف و صنعت درجه یک کیسه ۴۰ کیلویی (سبوس‌گیری شده)",
    category: "آرد و غلات صنعتی",
    supplierName: "آرد داران آفتاب زرین",
    supplierLocation: "البرز - نظرآباد",
    unit: "تن (کیسه ۴۰ کیلوگرمی)",
    minOrder: "۳ تن",
    priceEstimate: "۲۸,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۱ روز کاری",
    specs: ["گلوتن مرطوب بالای ۳۰٪", "رنگ روشن و یکدست", "مناسب فرآوری کیک، ویفر و ماکارونی"],
    description: "آرد صنف و صنعت با کیفیت ثابت و انباشت گلوتن بالا مخصوص واحدهای صنعتی و تولیدکنندگان صنایع آردی.",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-8",
    name: "اسانس خوراکی وانیل و پرتقال پودری و مایع المانی",
    category: "اسانس، طعم‌دهنده و رنگ‌های خوراکی",
    supplierName: "بازرگانی شیمی طعم آریا",
    supplierLocation: "تهران - بازار بزرگ",
    unit: "کیلوگرم / گالن ۲۰ لیتری",
    minOrder: "۲۵ کیلوگرم",
    priceEstimate: "۸۵۰,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۱ روز کاری",
    specs: ["مقاوم در برابر حرارت پخت", "دوز مصرف بسیار پایین", "دارای گواهی Halal و COA"],
    description: "اسانس‌های تخصصی پودری و مایع با ماندگاری عطر فوق‌العاده ویژه خطوط تولید بیسکویت، کیک، نوشیدنی و شکلات.",
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_105.webp",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-9",
    name: "اسید سیتریک خشک انهایدروس (کیسه ۲۵ کیلویی)",
    category: "افزودنی‌ها، استابیلایزر و نگهدارنده‌ها",
    supplierName: "کیمیاگران صنایع خوراکی البرز",
    supplierLocation: "تهران - شهرک صنعتی کاوه",
    unit: "کیسه ۲۵ کیلوگرمی",
    minOrder: "۲۵۰ کیلوگرم",
    priceEstimate: "۶۴,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۲ روز کاری",
    specs: ["خلوص ۹۹.۵٪", "گرید خوراکی و دارویی", "حلالیت سریع در آب"],
    description: "اسید سیتریک انهایدروس (خشک) ویژه تنظیم pH و طعم‌دهندگی در صنایع نوشیدنی، آبمیوه، لواشک، مربا و رب گوجه فرنگی.",
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_115.webp",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-10",
    name: "پریفرم پت دهانه ۲۸ میلی‌متر وزن ۲۴ و ۳۲ گرم",
    category: "پریفرم، بطری پت و ملزومات پلاستیک",
    supplierName: "صنایع پلاستیک تک‌پولیمر",
    supplierLocation: "قم - شهرک صنعتی شکوهیه",
    unit: "هزار عدد / کارتن",
    minOrder: "۱۰,۰۰۰ عدد",
    priceEstimate: "۲,۴۰۰ تومان / عدد",
    deliveryDays: "۲ روز کاری",
    specs: ["شفافیت بالا بدون حباب", "دهانه ۲۸ استاندارد PCO", "مقاومت بالا در بادکردن"],
    description: "تولید پریفرم پت شفاف با مواد درجه یک پتروشیمی مخصوص بطری آبمیوه، دوغ، نوشابه و مایعات خوراکی.",
    imageUrl: "http://c102393.parspack.net/c102393/products/prd_125.webp",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-11",
    name: "کارتن ۵ لایه لمینتی صادراتی چاپ ۴ رنگ و سلفون‌دار",
    category: "کارتن، جعبه و ملزومات چاپ",
    supplierName: "مجتمع کارتن‌سازی و بسته‌بندی آذرپک",
    supplierLocation: "تبریز - شهرک صنعتی عالی‌نسب",
    unit: "عدد",
    minOrder: "۱,۰۰۰ عدد",
    priceEstimate: "۳۵,۰۰۰ تومان / عدد",
    deliveryDays: "۴ روز کاری",
    specs: ["ورق ۵ لایه کنگره C و B", "تحمل وزن بالای ۲۰ کیلوگرم", "چاپ لمینتی افست"],
    description: "طراحی و تولید انواع کارتن‌های ۵ لایه مقاوم صادراتی ویژه بسته‌بندی چیپس، پفک، بیسکویت، کنسرو و شوینده‌ها.",
    imageUrl: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-12",
    name: "خمیر مرغ صنعتی تازه و منجمد با مجوز نظارت بهداشتی",
    category: "گوشت، خمیر مرغ و مواد اولیه پروتئینی",
    supplierName: "فرآوری پروتئین دشت پارس",
    supplierLocation: "قزوین - بویین‌زهرا",
    unit: "کیلوگرم / شمش منجمد",
    minOrder: "۵۰۰ کیلوگرم",
    priceEstimate: "۶۸,۰۰۰ تومان / کیلوگرم",
    deliveryDays: "۱ روز کاری",
    specs: ["استخوان‌گیری اتوماتیک MDM", "انجماد سریع IQF", "کاهش بار میکروبی"],
    description: "تامین خمیر مرغ صنعتی باکیفیت و استاندارد زیر نظر دامپزشکی ویژه کارخانجات سوسیس، کالباس و ناگت.",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80",
    isVerified: true,
    escrowGuaranteed: true,
    status: "approved"
  },
  {
    id: "mat-13",
    name: "نمک تصفیه شده بدون ید صنعتی (کیسه ۲۵ کیلویی)",
    category: "ادویه‌جات، نمک صنعتی و سبزیجات خشک",
    supplierName: "بلور نمک سپید سمنان",
    supplierLocation: "سمنان - شهرک صنعتی سرخه",
    unit: "تن (کیسه ۲۵ کیلوگرمی)",
    minOrder: "۲ تن",
    priceEstimate: "۵,۵۰۰ تومان / کیلوگرم",
    deliveryDays: "۲ روز کاری",
    specs: ["خلوص ۹۹.۶٪ NaCl", "بدون ید اضافه‌شده", "دانه کریستال یکدست"],
    description: "نمک صنعتی تصفیه شده ممتاز ویژه کارخانجات رب، کنسرو، پنیر و شورجات بدون تغییر رنگ و کدر کردن محتویات.",
    imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80",
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
    logoUrl: "http://c102393.parspack.net/c102393/products/prd_100.webp"
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
    logoUrl: "http://c102393.parspack.net/c102393/products/prd_101.webp"
  }
];
