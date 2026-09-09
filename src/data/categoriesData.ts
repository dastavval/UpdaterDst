// Comprehensive Category Hierarchy for Food, Agriculture, Raw Materials, Equipment, Services & Barter
export interface CategoryDefinition {
  id: string;
  name: string;
  label?: string;
  emoji: string;
  type: 'product' | 'agriculture' | 'raw_material' | 'equipment' | 'capacity' | 'service' | 'barter';
  sector: string; // Farsi sector name e.g. "مواد غذایی", "کشاورزی", "مواد اولیه", "تجهیزات صنعتی", "ظرفیت و خدمات", "تهاتر"
  description: string;
  subcategories: string[];
  image?: string;
  isPopular?: boolean;
}

export const MASTER_CATEGORIES: CategoryDefinition[] = [
  // ==================== 1. مواد غذایی و محصولات سوپرمارکتی بسته‌بندی شده ====================
  {
    id: "cat-food-1",
    name: "تنقلات، شکلات و شیرینی",
    label: "تنقلات و شکلات",
    emoji: "🍫",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "انواع شکلات تخته‌ای، تابلت، کادویی، آبنبات، تافی، پاستیل، اسمارتیز، آلوچه، لواشک، دراژه و آدامس",
    subcategories: ["شکلات و تابلت", "آلوچه و لواشک", "پاستیل و ژله", "آبنبات و تافی", "دراژه و اسمارتیز", "آدامس و خشبوکننده دهان"],
    image: "https://c102393.parspack.net/c102393/products/prd_84.webp",
    isPopular: true
  },
  {
    id: "cat-food-2",
    name: "کیک، کلوچه، بیسکویت و ویفر",
    label: "کیک و بیسکویت",
    emoji: "🍪",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "انواع کیک لایه‌ای، کاپ‌کیک، کلوچه سنتی، بیسکویت کرم‌دار و ساده، ویفر شکلاتی و میوه‌ای، دونات و کروسان",
    subcategories: ["بیسکویت پذیرایی و ساده", "ویفر شکلاتی و میوه‌ای", "کیک و تی‌تاپ", "کلوچه خرمایی و گردویی", "کروسان و پیراشکی"],
    image: "https://c102393.parspack.net/c102393/products/prd_1.webp",
    isPopular: true
  },
  {
    id: "cat-food-3",
    name: "چیپس، پفک، پاپ‌کورن و اسنک",
    label: "چیپس و اسنک",
    emoji: "🍿",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "انواع چیپس سیب‌زمینی، اسنک ذرت، پفک، پاپ‌کورن، چیپس ترتیلا، خلال بادام‌زمینی و پلت سرخ‌شده",
    subcategories: ["چیپس سیب‌زمینی", "اسنک و پفک", "پاپ‌کورن و چس‌فیل", "پلت و ترتیلا"],
    image: "https://c102393.parspack.net/c102393/products/prd_20.webp",
    isPopular: true
  },
  {
    id: "cat-food-4",
    name: "لبنیات و فرآورده‌های شیری",
    label: "لبنیات",
    emoji: "🥛",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "شیر استریل و تتراپک، انواع پنیر فتا، پنیر پیتزا موزارلا، کره حیوانی، خامه صبحانه، دوغ بطری و ماست",
    subcategories: ["پنیر پیتزا و تاپینگ", "شیر استریل تتراپک", "کره حیوانی و گیاهی", "پنیر صبحانه و خامه‌ای", "دوغ و ماست", "خامه صبحانه و قنادی"],
    image: "https://c102393.parspack.net/c102393/products/prd_10.webp",
    isPopular: true
  },
  {
    id: "cat-food-5",
    name: "نوشیدنی‌ها، آبمیوه و انرژی‌زا",
    label: "نوشیدنی‌ها",
    emoji: "🥤",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "آبمیوه پاکتی و پت، نوشابه گازدار، ماءالشعیر و مالت، نوشابه انرژی‌زا، آب معدنی، عرقیات گیاهی و شربت",
    subcategories: ["آبمیوه ۲۰۰ سی‌سی و ۱ لیتری", "نوشابه گازدار", "نوشیدنی انرژی‌زا", "ماءالشعیر و مالت", "آب‌معدنی و آب آشامیدنی", "شربت و آبغوره"],
    image: "https://c102393.parspack.net/c102393/products/prd_4.webp",
    isPopular: true
  },
  {
    id: "cat-food-6",
    name: "چای، قهوه، کاپوچینو و دمنوش",
    label: "چای و قهوه",
    emoji: "☕",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "چای سیاه ایرانی و خارجی، چای عطری، قهوه فوری، پودر کاپوچینو ساشه‌ای، هات‌چاکلت، کافی‌میکس و دمنوش",
    subcategories: ["چای فله و بسته‌بندی", "کاپوچینو و هات‌چاکلت ساشه‌ای", "قهوه فوری و گلد", "چای کیسه‌ای (تی‌بگ)", "دمنوش‌های گیاهی"],
    image: "https://c102393.parspack.net/c102393/products/prd_15.webp",
    isPopular: true
  },
  {
    id: "cat-food-7",
    name: "کنسروجات، رب، ترشی و کمپوت",
    label: "کنسروجات و رب",
    emoji: "🥫",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "رب گوجه‌فرنگی قوطی و حلب، کنسرو ماهی تن، کنسرو لوبیا و خوراک، کنسرو قارچ، خیارشور شیشه‌ای و دبه، ترشیجات و زیتون",
    subcategories: ["رب گوجه‌فرنگی", "کنسرو ماهی تن", "کنسرو خوراک و لوبیا", "خیارشور و ترشیجات", "کمپوت میوه", "زیتون پرورده و شور"],
    image: "https://c102393.parspack.net/c102393/products/prd_3.webp",
    isPopular: true
  },
  {
    id: "cat-food-8",
    name: "روغن‌های خوراکی و سرخ‌کردنی",
    label: "روغن خوراکی",
    emoji: "🛢️",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "روغن مایع آفتابگردان و پخت‌وپز، روغن سرخ‌کردنی شفاف، روغن حلب ۱۶ لیتری صنعتی و صنفی، روغن زیتون، کنجد و ذرت",
    subcategories: ["روغن سرخ‌کردنی بطری", "روغن آفتابگردان پخت‌وپز", "روغن حلب ۱۶ لیتری صنفی", "روغن زیتون و کنجد"],
    image: "https://c102393.parspack.net/c102393/products/prd_5.webp",
    isPopular: true
  },
  {
    id: "cat-food-9",
    name: "غلات، برنج، حبوبات و ماکارونی",
    label: "برنج و ماکارونی",
    emoji: "🌾",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "برنج ایرانی طارم و هاشمی، برنج هندی و پاکستانی، انواع ماکارونی اسپاگتی و فرمی، رشته آش، حبوبات سورت و بسته‌بندی",
    subcategories: ["برنج ایرانی و وارداتی", "ماکارونی و لازانیا", "حبوبات بسته‌بندی (عدس، لوبیا، نخود)", "رشته آش و پلویی", "جو پرک و آرد سوخاری"],
    image: "https://c102393.parspack.net/c102393/products/prd_8.webp",
    isPopular: true
  },
  {
    id: "cat-food-10",
    name: "سس، چاشنی، ادویه و زعفران",
    label: "سس و ادویه",
    emoji: "🧂",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "سس مایونز، کچاپ، فرانسوی، سس‌های رستورانی گالنی و تک‌نفره، سرکه، آبلیمو، ادویه‌جات قلم و پودر، زعفران و نمک تصفیه",
    subcategories: ["سس مایونز و کچاپ", "سس‌های تک‌نفره و ساشه‌ای", "ادویه‌جات و چاشنی‌ها", "زعفران و زرشک", "آبلیمو، سرکه و گلاب"],
    image: "https://c102393.parspack.net/c102393/products/prd_12.webp",
    isPopular: true
  },
  {
    id: "cat-food-11",
    name: "خشکبار، پسته، خرما و مغزیجات",
    label: "خشکبار و مغزیجات",
    emoji: "🥜",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "پسته اکبری و احمدآقایی، بادام درختی و هندی، مغز گردو، کشمش و مویز، انواع خرما مضافتی و پیارم، تخمه آفتابگردان و ژاپنی",
    subcategories: ["پسته و مغز پسته", "انواع خرما و شیره خرما", "مغز گردو و بادام", "کشمش، مویز و توت خشک", "انواع تخمه بو داده"],
    image: "https://c102393.parspack.net/c102393/products/prd_18.webp",
    isPopular: true
  },
  {
    id: "cat-food-12",
    name: "شوینده، بهداشتی و سلولزی",
    label: "شوینده و بهداشتی",
    emoji: "🧼",
    type: "product",
    sector: "مواد غذایی بسته‌بندی شده",
    description: "مایع ظرفشویی و دستشویی خانگی و گالنی، پودر و ژل ماشین لباسشویی، دستمال کاغذی جعبه‌ای و توالت، شامپو، صابون، سفیدکننده و جرم‌گیر",
    subcategories: ["مایع ظرفشویی و دستشویی", "پودر و مایع لباسشویی", "محصولات سلولزی و دستمال کاغذی", "شامپو و صابون", "شوینده‌های گالنی ۲۰ لیتری"],
    image: "https://c102393.parspack.net/c102393/products/prd_2.webp",
    isPopular: true
  },

  // ==================== 2. کشاورزی، باغبانی، دام و طیور ====================
  {
    id: "cat-agri-1",
    name: "غلات و دانه‌های روغنی مزرعه",
    label: "غلات و دانه‌های روغنی",
    emoji: "🌾",
    type: "agriculture",
    sector: "کشاورزی و باغبانی",
    description: "گندم مرغوب، جو دامی و خوراکی، ذرت دانه‌ای، دانه سویا، کلزا، آفتابگردان روغنی، کنجد و تخم پنبه",
    subcategories: ["گندم و آرد گندم", "جو دامی و خوراکی", "ذرت دانه‌ای", "دانه کلزا و سویا", "کنجد خام مزرعه"],
    image: "https://c102393.parspack.net/c102393/products/prd_25.webp",
    isPopular: true
  },
  {
    id: "cat-agri-2",
    name: "میوه، صیفی‌جات و سبزیجات عمده",
    label: "میوه و صیفی عمده",
    emoji: "🍎",
    type: "agriculture",
    sector: "کشاورزی و باغبانی",
    description: "سیب درختی صادراتی، پرتقال و مرکبات جنوب و شمال، گوجه‌فرنگی ربی و سبدی، پیاز، سیب‌زمینی، خیار و فلفل دلمه‌ای",
    subcategories: ["سیب درختی سردخانه‌ای", "مرکبات (پرتقال، نارنگی، لیمو)", "گوجه‌فرنگی ربی و صادراتی", "سیب‌زمینی و پیاز عمده", "فلفل دلمه‌ای و صیفی گلخانه‌ای"],
    image: "https://c102393.parspack.net/c102393/products/prd_30.webp",
    isPopular: true
  },
  {
    id: "cat-agri-3",
    name: "بذر، کود کشاورزی و سموم دفع آفات",
    label: "بذر و کود کشاورزی",
    emoji: "🌱",
    type: "agriculture",
    sector: "کشاورزی و باغبانی",
    description: "انواع بذر هیبرید و استاندارد، کودهای NPK، اوره، فسفات، هیومیک اسید، سموم قارچ‌کش، علف‌کش و آفت‌کش‌های ارگانیک و شیمیایی",
    subcategories: ["بذر سبزی، صیفی و غلات", "کودهای شیمیایی و NPK", "کودهای ارگانیک و هیومیک", "سموم و آفت‌کش‌های کشاورزی", "محرک‌های رشد و اسید آمینه"],
    image: "https://c102393.parspack.net/c102393/products/prd_35.webp",
    isPopular: true
  },
  {
    id: "cat-agri-4",
    name: "خوراک دام، طیور و آبزیان",
    label: "خوراک دام و طیور",
    emoji: "🐄",
    type: "agriculture",
    sector: "کشاورزی و باغبانی",
    description: "کنجاله سویا، کنجاله پنبه، سبوس گندم و برنج، یونجه و کاه، کنسانتره دامی و طیوری، مکمل‌های ویتامینه و دان پلت مرغداری",
    subcategories: ["کنجاله سویا و کلزا", "سبوس و یونجه فشرده", "کنسانتره و دان آماده طیور", "مکمل‌ها و پرمیکس دامی", "خوراک ماهی و میگو"],
    image: "https://c102393.parspack.net/c102393/products/prd_40.webp",
    isPopular: true
  },
  {
    id: "cat-agri-5",
    name: "تجهیزات آبیاری، گلخانه و ماشین‌آلات کشاورزی",
    label: "تجهیزات کشاورزی و آبیاری",
    emoji: "🚜",
    type: "agriculture",
    sector: "کشاورزی و باغبانی",
    description: "نوار تیپ آبیاری، لوله‌های پلی‌اتیلن، قطره‌چکان، پمپ و موتور آب کشاورزی، سازه گلخانه و نایلون UV، تراکتور و ادوات خاک‌ورزی",
    subcategories: ["نوار تیپ و قطره‌چکان آبیاری", "لوله‌ها و اتصالات پلی‌اتیلن", "پمپ و الکتروپمپ آب", "سازه‌ها و نایلون گلخانه", "تراکتور، سمپاش و ادوات کشت"],
    image: "https://c102393.parspack.net/c102393/products/prd_45.webp"
  },

  // ==================== 3. مواد اولیه، اسانس و شیمیایی خوراکی ====================
  {
    id: "cat-mat-1",
    name: "شیرین‌کننده‌ها و نشاسته صنعتی",
    label: "شیرین‌کننده‌ها و نشاسته",
    emoji: "🍯",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "گلوکز مایع DE 42 شفاف، شکر سفید کریستال کیسه ۵۰ کیلویی، نشاسته ذرت، دکستروز، مالتودکسترین، شربت اینورت و سوربیتول",
    subcategories: ["گلوکز مایع صنعتی", "شکر سفید تصفیه شده کیسه‌ای", "نشاسته ذرت و گندم", "دکستروز و مالتودکسترین", "سوربیتول و شیرین‌کننده‌های رژیمی"],
    image: "https://c102393.parspack.net/c102393/products/prd_100.webp",
    isPopular: true
  },
  {
    id: "cat-mat-2",
    name: "آرد و غلات صنعتی",
    label: "آرد و غلات صنعتی",
    emoji: "🌾",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "انواع آرد صنف و صنعت، آرد ستاره، آرد نانوایی، گلوتن گندم صنعتی، مالت، سبوس و بلغور با آنالیز آزمایشگاهی",
    subcategories: ["آرد صنف و صنعت", "آرد ستاره و نولی", "گلوتن گندم صنعتی", "عصاره مالت و آرد سویا"],
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
    isPopular: true
  },
  {
    id: "cat-mat-3",
    name: "روغن و چربی‌های تخصصی",
    label: "روغن‌های صنعتی و لسیتین",
    emoji: "🛢️",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "لسیتین سویا مایع، روغن پالم اولئین، شورتنینگ قنادی و روغنی، کره کاکائو CBS و جانشین‌های کره کاکائو (CBR)",
    subcategories: ["لسیتین سویا مایع", "روغن جانشین کره کاکائو (CBS)", "شورتنینگ قنادی و ویفر", "روغن پالم و اسید چرب صنعتی"],
    image: "https://c102393.parspack.net/c102393/products/prd_120.webp"
  },
  {
    id: "cat-mat-4",
    name: "پودر کاکائو، شیرخشک و پودرهای لبنی",
    label: "کاکائو، شیرخشک و پودر پروتئین",
    emoji: "🍫",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "پودر کاکائو ۱۰-۱۲ آلکالایز ترک و هلندی، شیرخشک بدون چربی صنعتی، پودر آب پنیر (WPC و دمینرال)، پروتئین ایزوله سویا و ژلاتین حلال خوراکی",
    subcategories: ["پودر کاکائو صنعتی", "شیرخشک صنعتی بدون چربی", "پودر آب پنیر و WPC", "ژلاتین خوراکی با بلوم بالا", "پروتئین ایزوله سویا"],
    image: "https://c102393.parspack.net/c102393/products/prd_110.webp",
    isPopular: true
  },
  {
    id: "cat-mat-5",
    name: "اسانس، طعم‌دهنده و رنگ‌های خوراکی",
    label: "اسانس و طعم‌دهنده",
    emoji: "🧪",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "اسانس‌های مایع و پودری خوراکی (وانیل، توت‌فرنگی، پرتقال، موز، قهوه)، رنگ‌های طبیعی و سنتتیک خوراکی مجاز، وانیلین و طعم‌دهنده‌های چیپس و اسنک",
    subcategories: ["اسانس‌های مایع و پودری", "رنگ‌های طبیعی خوراکی (کارامل، پاپریکا، بتاکاروتن)", "طعم‌دهنده‌های اسنک و چیپس", "وانیلین و پودر کاکائو آلکالایز"],
    image: "https://c102393.parspack.net/c102393/products/prd_105.webp",
    isPopular: true
  },
  {
    id: "cat-mat-6",
    name: "افزودنی‌ها، استابیلایزر و نگهدارنده‌ها",
    label: "افزودنی‌ها و نگهدارنده‌ها",
    emoji: "🔬",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "اسید سیتریک آبدار و خشک، بنزوات سدیم، سوربات پتاسیم، اسید اسکوربیک (ویتامین C)، صمغ زانتان‌گام، گوارگام، کاراگینان و پکتین",
    subcategories: ["اسید سیتریک خشک و آبدار", "نگهدارنده‌ها (سوربات، بنزوات)", "استابیلایزرها (زانتان، گوار، پکتین)", "بکینگ‌پودر و بهبوددهنده‌های نان و کیک"],
    image: "https://c102393.parspack.net/c102393/products/prd_115.webp"
  },
  {
    id: "cat-mat-7",
    name: "کنسروجات، رب اسپتیک و عصاره صنعتی",
    label: "کنسروجات و عصاره‌های صنعتی",
    emoji: "🥫",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "رب گوجه فرنگی فله اسپتیک بریکس ۳۶-۳۸، پوره میوه‌جات، کنسانتره میوه، پودر گوجه فرنگی و عصاره‌های صنعتی",
    subcategories: ["رب گوجه اسپتیک بریکس ۳۶-۳۸", "پوره میوه‌جات و پودر گوجه", "کنسانتره میوه و رب خرما", "عصاره گوشت و مرغ صنعتی"],
    image: "https://c102393.parspack.net/c102393/products/prd_105.webp"
  },
  {
    id: "cat-mat-8",
    name: "سلفون، لفاف و فیلم‌های بسته‌بندی",
    label: "سلفون و لفاف بسته‌بندی",
    emoji: "📦",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "فیلم‌های OPP، BOPP، CPP، سلفون متالایز و پرلایت، فیلم استرچ پالت‌بند، نایلون شیرینگ حرارتی و فویل آلومینیوم بلیستر",
    subcategories: ["فیلم OPP و BOPP متالایز", "نایلون و فیلم شیرینگ حرارتی", "فیلم استرچ پالت‌بند", "فویل آلومینیوم و بلیستر"],
    image: "https://c102393.parspack.net/c102393/products/prd_130.webp",
    isPopular: true
  },
  {
    id: "cat-mat-9",
    name: "پریفرم، بطری پت و ملزومات پلاستیک",
    label: "پریفرم و ملزومات پلاستیک",
    emoji: "🍾",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "پریفرم پت دهانه ۲۸، ۳۰، ۳۸ و ۴۵ در اوزان مختلف، انواع درب بطری گازبند و مایع‌بند، گرانول پت نساجی و بطری، ظروف IML و پلی‌پروپیلن",
    subcategories: ["پریفرم بطری پت", "درب بطری ۲۸ و ۳۸ میلی‌متر", "گرانول پت و PP تزریقی", "ظروف پلاستیکی IML و سطل ماستی"],
    image: "https://c102393.parspack.net/c102393/products/prd_125.webp",
    isPopular: true
  },
  {
    id: "cat-mat-10",
    name: "کارتن، جعبه و ملزومات چاپ",
    label: "کارتن و ملزومات چاپ",
    emoji: "📦",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "کارتن ۳ لایه و ۵ لایه صادراتی، جعبه لمینتی، ورق کنگره‌ای، لیبل چسبدار رول و شیرینگ پی‌وی‌سی",
    subcategories: ["کارتن ۳ لایه و ۵ لایه", "جعبه لمینتی و مقوایی", "ورق سینگل و کارتن", "لیبل چسبدار و شیرینگ پی‌وی‌سی"],
    image: "https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "cat-mat-11",
    name: "گوشت، خمیر مرغ و مواد پروتئینی",
    label: "مواد پروتئینی صنعتی",
    emoji: "🥩",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "خمیر مرغ صنعتی تازه و منجمد، گوشت منجمد وارداتی، پودر گوشت و طیور، ایزوله سویا و پروتئین بافت‌دار",
    subcategories: ["خمیر مرغ صنعتی با مجوز بهداشت", "گوشت منجمد صنعتی گوساله", "پودر گوشت و طیور", "سویا بافت‌دار صنعتی"],
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "cat-mat-12",
    name: "ادویه‌جات، نمک صنعتی و سبزیجات خشک",
    label: "ادویه و سبزیجات خشک",
    emoji: "🧂",
    type: "raw_material",
    sector: "مواد اولیه و شیمیایی",
    description: "ادویه‌جات فله قلم و آسیابی (فلفل، زردچوبه، دارچین)، نمک تصفیه شده بدون ید صنعتی، پودر سیر و پیاز، و سبزیجات خشک گرانول",
    subcategories: ["ادویه فله آسیابی و قلم", "نمک تصفیه صنعتی بدون ید", "پودر سیر، پیاز و گوجه", "سبزیجات خشک گرانول صنعتی"],
    image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=400&q=80"
  },

  // ==================== 4. ماشین‌آلات و تجهیزات خطوط تولید ====================
  {
    id: "cat-eq-1",
    name: "دستگاه‌های بسته‌بندی و ساشه‌زن صنعتی",
    label: "دستگاه‌های بسته‌بندی",
    emoji: "⚙️",
    type: "equipment",
    sector: "تجهیزات و ماشین‌آلات",
    description: "دستگاه‌های توزین‌دار حبوبات و خشکبار، دستگاه پیلوپک افقی کیک و بیسکویت، ساشه‌زن پودر و مایع، سیل وکیوم، اسکین‌پک و ترموفرمینگ",
    subcategories: ["دستگاه پرکن و توزین‌دار عمودی", "دستگاه پیلوپک افقی بیسکویت و شکلات", "دستگاه ساشه‌زن تک‌نفره مایع و پودر", "دستگاه سیل وکیوم و فرم‌فیل‌سیل"],
    image: "https://c102393.parspack.net/c102393/products/prd_50.webp",
    isPopular: true
  },
  {
    id: "cat-eq-2",
    name: "خطوط تولید، فر، میکسر و اکسترودر صنایع غذایی",
    label: "خطوط تولید و فرآوری",
    emoji: "🏭",
    type: "equipment",
    sector: "تجهیزات و ماشین‌آلات",
    description: "فر تونلی و دوار پخت کیک و بیسکویت، اکسترودر اسنک و پفک، مخازن استیل ۳۰۴ و ۳۱۶، دیگ پخت تحت خلا، بلندر، هموژنایزر و کانوایرهای انتقال",
    subcategories: ["فر تونلی و دوار پخت", "اکسترودر و خط پفک و چیپس", "مخازن استیل و دیگ پخت دوجداره", "میکسر، بلندر و هموژنایزر صنعتی", "نوارهای نقاله و کانوایر"],
    image: "https://c102393.parspack.net/c102393/products/prd_55.webp",
    isPopular: true
  },
  {
    id: "cat-eq-3",
    name: "پرکن، درب‌بند، بطری‌شوی و تری‌بلوک",
    label: "خطوط پرکن مایعات و بطری",
    emoji: "🍼",
    type: "equipment",
    sector: "تجهیزات و ماشین‌آلات",
    description: "تری‌بلوک و منوبلوک پرکن آبمیوه و نوشابه، پرکن مایعات غلیظ پیستونی (سس، عسل، روغن)، دستگاه‌های درب‌بند اتومات و بادکن پت",
    subcategories: ["دستگاه تری‌بلوک و پرکن روتاری مایعات", "پرکن پیستونی مایعات غلیظ", "دستگاه بادکن اتوماتیک بطری پت", "درب‌بند اتوماتیک ۴ و ۶ هد"],
    image: "https://c102393.parspack.net/c102393/products/prd_60.webp"
  },
  {
    id: "cat-eq-4",
    name: "جت‌پرینتر، تاریخ‌زن، لیبل‌چسبان و شیرینگ‌پک",
    label: "جت‌پرینتر و شیرینگ‌پک",
    emoji: "🏷️",
    type: "equipment",
    sector: "تجهیزات و ماشین‌آلات",
    description: "جت‌پرینترهای جوهرافشان و لیزری صنعتی، لیبل‌چسبان اتوماتیک ظروف گرد و تخت، دستگاه‌های شیرینگ‌پک تونلی نیمه‌اتومات و فول‌اتومات",
    subcategories: ["جت‌پرینتر صنعتی CIJ و لیزری", "دستگاه لیبل‌چسبان روتاری و خطی", "دستگاه شیرینگ‌پک تونلی و پدالی", "کارتن چسب‌زن اتوماتیک"],
    image: "https://c102393.parspack.net/c102393/products/prd_65.webp",
    isPopular: true
  },
  {
    id: "cat-eq-5",
    name: "سیستم‌های برودتی، سردخانه، چیلر و تونل انجماد",
    label: "سردخانه و چیلر صنعتی",
    emoji: "❄️",
    type: "equipment",
    sector: "تجهیزات و ماشین‌آلات",
    description: "کمپرسورهای برودتی بیتزر و بوک، اواپراتور و کندانسور سردخانه‌ای، چیلرهای تراکمی و جذبی صنعتی، تونل انجماد سریع IQF و آیس‌بانک",
    subcategories: ["تجهیزات سردخانه زیر صفر و بالای صفر", "چیلر و برج خنک‌کننده صنعتی", "تونل انجماد سریع IQF", "آیس‌بانک و مخازن ذخیره سرما"],
    image: "https://c102393.parspack.net/c102393/products/prd_70.webp"
  },
  {
    id: "cat-eq-6",
    name: "تجهیزات آزمایشگاهی، کنترل کیفی و آب‌شیرین‌کن صنعتی",
    label: "آزمایشگاهی و تصفیه آب صنعتی",
    emoji: "⚡",
    type: "equipment",
    sector: "تجهیزات و ماشین‌آلات",
    description: "رفراکتومتر بریکس‌سنج، ویسکومتر، انکوباتور، اتوکلاو، اسپکتروفتومتر، سیستم‌های تصفیه آب صنعتی اسمز معکوس (RO) و کمپرسور باد اسکرو",
    subcategories: ["دستگاه‌های آزمایشگاهی کنترل کیفیت", "سیستم‌های تصفیه آب صنعتی RO", "کمپرسور اسکرو و مخزن هوای فشرده", "دیزل ژنراتور برق اضطراری"],
    image: "https://c102393.parspack.net/c102393/products/prd_75.webp"
  },

  // ==================== 5. ظرفیت خالی و تولید کارمزدی (Private Label / OEM) ====================
  {
    id: "cat-cap-1",
    name: "ظرفیت خالی تولید شکلات، بیسکویت و کیک",
    label: "ظرفیت تولید شیرینی و شکلات",
    emoji: "🏭",
    type: "capacity",
    sector: "ظرفیت خالی و خدمات",
    description: "واگذاری ظرفیت خطوط تولید پیلوپک و فر کیک و بیسکویت جهت تولید قراردادی با برند اختصاصی شما (Private Label) همراه با استانداردهای بهداشتی",
    subcategories: ["تولید کارمزدی کیک و کلوچه", "تولید کارمزدی بیسکویت و ویفر", "تولید کارمزدی شکلات و تافی", "تولید پاستیل و ژله با برند مشتری"],
    image: "https://c102393.parspack.net/c102393/products/prd_80.webp",
    isPopular: true
  },
  {
    id: "cat-cap-2",
    name: "ظرفیت خالی تولید نوشیدنی، آبمیوه و قوطی",
    label: "ظرفیت تولید نوشیدنی و قوطی",
    emoji: "🥤",
    type: "capacity",
    sector: "ظرفیت خالی و خدمات",
    description: "خطوط قوطی پرکنی ۲۰۰ و ۳۳۰ سی‌سی، پرکن تتراپک، بطری پت و شیشه گازدار جهت پرکنی و تولید کارمزدی انواع آبمیوه، انرژی‌زا و ماءالشعیر",
    subcategories: ["پرکنی قوطی اسلیم و استاندارد", "پرکنی آبمیوه تتراپک", "تولید نوشیدنی پت و شیشه", "تولید کارمزدی آب‌معدنی و نوشابه"],
    image: "https://c102393.parspack.net/c102393/products/prd_85.webp",
    isPopular: true
  },
  {
    id: "cat-cap-3",
    name: "ظرفیت خالی کنسروجات، رب، ترشی و سس",
    label: "ظرفیت تولید کنسرو و سس",
    emoji: "🥫",
    type: "capacity",
    sector: "ظرفیت خالی و خدمات",
    description: "تولید کارمزدی رب گوجه در اوزان مختلف قوطی و شیشه، کنسرو ماهی تن، کنسروهای غیرگوشتی و سس‌های تک‌نفره و بطری با برند متقاضی",
    subcategories: ["تولید کارمزدی رب گوجه‌فرنگی", "تولید کارمزدی تن ماهی", "تولید کارمزدی خیارشور و ترشی", "تولید سس مایونز و کچاپ"],
    image: "https://c102393.parspack.net/c102393/products/prd_90.webp"
  },
  {
    id: "cat-cap-4",
    name: "ظرفیت خالی سورتینگ، بوجاری و بسته‌بندی حبوبات و ادویه",
    label: "ظرفیت سورتینگ و بسته‌بندی",
    emoji: "📦",
    type: "capacity",
    sector: "ظرفیت خالی و خدمات",
    description: "خطوط مدرن کالرسورتر و بوجاری حبوبات، غلات، برنج، شکر، قند شکسته‌شده و بسته‌بندی توزین‌دار با پروانه بهداشتی ساخت",
    subcategories: ["بوجاری و سورت حبوبات و برنج", "بسته‌بندی قند و شکر", "سورت و بسته‌بندی خشکبار و پسته", "آسیاب و بسته‌بندی ادویه‌جات"],
    image: "https://c102393.parspack.net/c102393/products/prd_95.webp"
  },

  // ==================== 6. خدمات صنعتی، چاپ، بسته‌بندی و ترابری ====================
  {
    id: "cat-serv-1",
    name: "خدمات چاپ سلفون، کارتن‌سازی و جعبه لمینتی",
    label: "کارتن‌سازی و چاپ سلفون",
    emoji: "🖨️",
    type: "service",
    sector: "ظرفیت و خدمات صنعتی",
    description: "چاپ فلکسو، هلیوگراور و افست سلفون‌های ۸ رنگ، کارتن‌های ۳ لایه و ۵ لایه ایفلوت و سیفلوت صادراتی، جعبه‌های لمینتی و مقوایی ایندربرد",
    subcategories: ["تولید کارتن ۳ و ۵ لایه صنعتی", "چاپ هلیوگراور و فلکسو سلفون", "تولید جعبه مقوایی و هاردباکس", "طراحی و کلیشه‌سازی بسته‌بندی"],
    image: "https://c102393.parspack.net/c102393/products/prd_140.webp",
    isPopular: true
  },
  {
    id: "cat-serv-2",
    name: "خدمات سردخانه‌ای، نگهداری و انبارداری استاندارد",
    label: "خدمات سردخانه و انبارداری",
    emoji: "❄️",
    type: "service",
    sector: "ظرفیت و خدمات صنعتی",
    description: "اجاره پالت و سالن‌های سردخانه‌ای زیر صفر (گوشت، مرغ، کره) و بالای صفر (میوه، صیفی، کنسانتره) و انبارهای عمومی سرپوشیده کالا",
    subcategories: ["اجاره فضای سردخانه زیر صفر", "اجاره سردخانه بالای صفر", "انبارداری تخصصی مواد غذایی", "خدمات پالت‌بندی و بارانداز"],
    image: "https://c102393.parspack.net/c102393/products/prd_145.webp"
  },
  {
    id: "cat-serv-3",
    name: "خدمات ترابری تخصصی یخچال‌دار و باربری صنعتی",
    label: "حمل و ترابری یخچال‌دار",
    emoji: "🚚",
    type: "service",
    sector: "ظرفیت و خدمات صنعتی",
    description: "ناوگان کامیونت و تریلی‌های ترموکینگ‌دار یخچال‌دار جهت حمل مطمئن لبنیات، پروتئین، شکلات و مواد غذایی فاسدشدنی در سراسر کشور با بیمه بار",
    subcategories: ["کامیونت یخچال‌دار شهری و بین‌شهری", "تریلی و کفی یخچال‌دار ترموکینگ", "باربری سنگین کانتینری و چادری", "خدمات بیمه بار و صدور بارنامه رسمی"],
    image: "https://c102393.parspack.net/c102393/products/prd_150.webp",
    isPopular: true
  },
  {
    id: "cat-serv-4",
    name: "خدمات آزمایشگاهی اکرودیته، فرمولاسیون و سیب سلامت",
    label: "مشاوره استاندارد و فرمولاسیون",
    emoji: "📜",
    type: "service",
    sector: "ظرفیت و خدمات صنعتی",
    description: "مشاوره اخذ پروانه بهداشتی ساخت، نشان سیب سلامت غذا و دارو، استاندارد ملی، فرمولاسیون تخصصی مواد غذایی و آزمون‌های میکروبی و شیمیایی",
    subcategories: ["فرمولاسیون و اصلاح طعم و بافت محصول", "اخذ پروانه سیب سلامت و بهداشت", "آزمون‌های شیمیایی و میکروبیولوژی", "مشاوره گواهی‌های ایزو و صادرات"],
    image: "https://c102393.parspack.net/c102393/products/prd_155.webp"
  },

  // ==================== 7. تهاتر کارخانه‌ای و ضایعات و مازاد خط ====================
  {
    id: "cat-barter-1",
    name: "تهاتر کالا و محصول نهایی با مواد اولیه",
    label: "تهاتر کالا با مواد اولیه",
    emoji: "🔄",
    type: "barter",
    sector: "تهاتر و معاوضه کارخانه‌ای",
    description: "معاوضه محصولات نهایی غذایی و شوینده با شکر صنعتی، گلوکز، کارتن، بطری، پریفرم و مواد اولیه شیمیایی",
    subcategories: ["تهاتر کیک و شکلات با شکر و گلوکز", "تهاتر رب و کنسرو با قوطی و کارتن", "تهاتر شوینده با مواد اولیه پلیمری", "تهاتر نوشیدنی با پریفرم و اسانس"],
    image: "https://c102393.parspack.net/c102393/products/prd_160.webp",
    isPopular: true
  },
  {
    id: "cat-barter-2",
    name: "تهاتر محصول و موجودی انبار با تجهیزات و ماشین‌آلات",
    label: "تهاتر کالا با ماشین‌آلات",
    emoji: "🔁",
    type: "barter",
    sector: "تهاتر و معاوضه کارخانه‌ای",
    description: "معاوضه بارهای عمده با خطوط تولید دست دوم، دستگاه‌های بسته‌بندی، خودروهای پخش و تجهیزات انبارداری",
    subcategories: ["تهاتر محصول با ماشین‌آلات صنعتی", "تهاتر موجودی انبار با ناوگان ترابری", "تهاتر تجهیزات مازاد با مواد اولیه"],
    image: "https://c102393.parspack.net/c102393/products/prd_165.webp"
  }
];

export const ALL_SECTORS = [
  { id: "all", name: "همه بخش‌ها", emoji: "✨" },
  { id: "product", name: "مواد غذایی بسته‌بندی شده", emoji: "🍫" },
  { id: "agriculture", name: "کشاورزی و باغبانی", emoji: "🌾" },
  { id: "raw_material", name: "مواد اولیه و شیمیایی", emoji: "🧪" },
  { id: "equipment", name: "تجهیزات و ماشین‌آلات", emoji: "⚙️" },
  { id: "capacity", name: "ظرفیت خالی کارخانجات", emoji: "🏭" },
  { id: "service", name: "خدمات صنعتی و ترابری", emoji: "📦" },
  { id: "barter", name: "تهاتر کارخانه‌ای", emoji: "🔄" }
];

/**
 * Merges saved/dynamic categories from localStorage or b2bConfig with all MASTER_CATEGORIES.
 * Ensures that all 27+ comprehensive categories across Food, Agriculture, Raw Materials,
 * Equipment, Capacities, Services, and Barter are ALWAYS available, while preserving any
 * custom user-created categories.
 */
export function getAllCategoriesMerged(savedCategories?: any[]): CategoryDefinition[] {
  const mergedMap = new Map<string, CategoryDefinition>();

  // 1. First insert all MASTER_CATEGORIES
  for (const cat of MASTER_CATEGORIES) {
    const key = cat.name.trim().toLowerCase();
    mergedMap.set(key, cat);
    if (cat.label) {
      mergedMap.set(cat.label.trim().toLowerCase(), cat);
    }
  }

  // 2. Append/merge any saved custom categories from b2bConfig or localStorage
  if (Array.isArray(savedCategories) && savedCategories.length > 0) {
    savedCategories.forEach((c: any, index: number) => {
      const name = typeof c === 'string' ? c.trim() : (c.name || c.label || '').trim();
      if (!name) return;
      const key = name.toLowerCase();

      if (!mergedMap.has(key)) {
        mergedMap.set(key, {
          id: typeof c === 'object' && c.id ? c.id : `cat-custom-${index + 1}`,
          name: name,
          label: typeof c === 'object' && c.label ? c.label : name,
          emoji: typeof c === 'object' && (c.emoji || c.icon) ? (c.emoji || c.icon) : '🏷️',
          type: typeof c === 'object' && c.type ? c.type : 'product',
          sector: typeof c === 'object' && c.sector ? c.sector : 'مواد غذایی بسته‌بندی شده',
          description: typeof c === 'object' && c.description ? c.description : `دسته‌بندی تخصصی ${name}`,
          subcategories: typeof c === 'object' && Array.isArray(c.subcategories) ? c.subcategories : [],
          image: typeof c === 'object' && c.image ? c.image : undefined
        });
      }
    });
  }

  // Deduplicate array values
  const uniqueList: CategoryDefinition[] = [];
  const seenIds = new Set<string>();

  for (const cat of mergedMap.values()) {
    if (!seenIds.has(cat.id)) {
      seenIds.add(cat.id);
      uniqueList.push(cat);
    }
  }

  return uniqueList;
}

export function getCategoriesBySector(sectorId: string, savedCategories?: any[]): CategoryDefinition[] {
  const all = getAllCategoriesMerged(savedCategories);
  if (!sectorId || sectorId === 'all') return all;
  return all.filter(c => c.type === sectorId || c.sector === sectorId);
}

