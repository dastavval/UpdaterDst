import { collection, getDocs, addDoc, serverTimestamp } from "./firebase-mock";
import { db } from "./firebase";
import { Product, NewsArticle, FactoryProfile } from "../types";

export const INITIAL_NEWS: NewsArticle[] = [
  {
    id: "news-1",
    title: "ابلاغیه جدید تخصیص سهمیه بنکداری و تخفیفات جاده‌ای کارخانجات",
    summary: "تعرفه حمل و جابه‌جایی بار مستقیم از درب کارخانجات با حذف واسطه‌ها تا ۱۸ درصد کاهش یافت.",
    content: "با هماهنگی انجمن بنکداران و مدیریت سامانه دست اول، نرخ حمل مستقیم سفارشات بالک و کارتن بالا از درب کارخانجات تا انبار بنکداران تحت پوشش تخفیف ویژه جاده‌ای قرار گرفت. تمامی همکارانی که سفارش خود را ثبت نمایند شامل پشتیبانی آنلاین باربری می‌باشند.",
    category: "تنظیم بازار",
    imageUrl: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=1000",
    source: "روابط عمومی سامانه دست اول",
    date: new Date().toLocaleDateString('fa-IR'),
  },
  {
    id: "news-2",
    title: "افتتاح خطوط جدید تولید اتوماتیک در کارخانجات رزطلا، نظری و باغبان",
    summary: "با بهره‌برداری از فاز توسعه اتوماتیک، زمان تامین و تحویل محموله‌های عمده به کمتر از ۴۸ ساعت رسید.",
    content: "گروه‌های صنعتی تولیدی رزطلا، کیک نظری و کنسروجات باغبان تحویل سفارشی خریداران عمده را با مکانیزاسیون بسته‌بندی سرعت بخشیدند. اکنون امکان استعلام آنلاین قیمت و ثبت سفارش مستقیم خط تولید فراهم گردیده است.",
    category: "خط تولید",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000",
    source: "اتاق خبر صنایع غذایی",
    date: new Date().toLocaleDateString('fa-IR'),
  },
  {
    id: "news-3",
    title: "طرح تضمین اصالت برند و سلامت بسته‌بندی محموله‌های بنکداری",
    summary: "ارسال کلیه بارهای کارخانجات با بارکد اصالت، بیمه جاده‌ای و هولوگرام تضمین کیفیت صورت می‌گیرد.",
    content: "به منظور ارتقای امنیت خریدهای بنکداری و عمده، تمامی کارخانجات طرف قرارداد سامانه موظف به صدور فاکتور یا پیش‌فاکتور معتبر و گواهی اصالت باربری شدند.",
    category: "توزیع",
    imageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80&w=1000",
    source: "بازرسی و نظارت بر توزیع",
    date: new Date().toLocaleDateString('fa-IR'),
  }
];

export const INITIAL_FACTORIES: FactoryProfile[] = [
  {
    id: "fac-1",
    factoryCode: "FAC-1001",
    name: "صنایع غذایی به‌آرا (چی‌توز)",
    city: "مشهد",
    location: "مشهد، شهرک صنعتی توس",
    province: "خراسان رضوی",
    establishedYear: 1372,
    badge: "gold",
    isVerified: true,
    logoUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=300&q=80",
    coverUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
    category: "تنقلات و شکلات",
    mainProducts: ["چیپس سیب‌زمینی چی‌توز", "پفک چی‌توز طلایی", "کرانچی چی‌توز آتشین"],
    minOrderAmount: "۱۵,۰۰۰,۰۰۰ تومان",
    address: "شهرک صنعتی توس، فاز یک، اندیشه ۵",
    phone: "۰۵۱-۳۵۴۱۰۰۰۰",
    managerName: "مهندس احمدی",
    rating: 4.9,
    reviewsCount: 142,
    capacityPerMonth: "۸۰۰ تن در ماه",
    description: "گروه صنایع غذایی به آرا با نام تجاری چی‌توز، پیشرو در تولید انواع چیپس، اسنک، پفک و فرآورده‌های حجیم شده بر پایه سیب‌زمینی و ذرت با بالاترین استانداردهای جهانی.",
    profileDesignMode: "simple"
  },
  {
    id: "fac-2",
    factoryCode: "FAC-1002",
    name: "گروه کارخانجات مزمز",
    city: "تهران",
    location: "تهران، شهرک صنعتی شمس‌آباد",
    province: "تهران",
    establishedYear: 1374,
    badge: "vip",
    isVerified: true,
    logoUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=300&q=80",
    coverUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
    category: "تنقلات و شکلات",
    mainProducts: ["تخمه آفتابگردان مزمز", "چیپس کتلت مزمز", "مغز بادام‌زمینی مزمز"],
    minOrderAmount: "۲۰,۰۰۰,۰۰۰ تومان",
    address: "شهرک صنعتی شمس‌آباد، بلوار بوستان",
    phone: "۰۲۱-۵۶۲۳۰۰۰۰",
    managerName: "مهندس رضایی",
    rating: 4.8,
    reviewsCount: 118,
    capacityPerMonth: "۶۵۰ تن در ماه",
    description: "مجموعه مزمز اولین تولیدکننده تخمه و آجیل بسته‌بندی بهداشتی و چیپس‌های ترد فرآوری‌شده در ایران با ارسال مستقیم به سراسر کشور.",
    profileDesignMode: "simple"
  },
  {
    id: "fac-3",
    factoryCode: "FAC-1003",
    name: "صنایع غذایی شیرین عسل",
    city: "تبریز",
    location: "تبریز، شهرک صنعتی سلیمی",
    province: "آذربایجان شرقی",
    establishedYear: 1371,
    badge: "gold",
    isVerified: true,
    logoUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80",
    coverUrl: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=1200&q=80",
    category: "کیک، کلوچه و بیسکویت",
    mainProducts: ["بیسکویت بیسکولات", "کیک هیت شیرین عسل", "شکلات تلخ شیرین عسل"],
    minOrderAmount: "۲۵,۰۰۰,۰۰۰ تومان",
    address: "شهرک صنعتی سلیمی، تبریز",
    phone: "۰۴۱-۳۴۳۲۰۰۰۰",
    managerName: "مهندس ژائله",
    rating: 4.95,
    reviewsCount: 230,
    capacityPerMonth: "۱۲۰۰ تن در ماه",
    description: "بزرگترین گروه شیرینی و شکلات کشور با بیش از ۶۰ خط تولید پیشرفته کاملاً اتوماتیک و صادرات به بیش از ۶۰ کشور جهان.",
    profileDesignMode: "simple"
  },
  {
    id: "fac-4",
    factoryCode: "FAC-1004",
    name: "صنایع غذایی کاله (گروه سولیکو)",
    city: "آمل",
    location: "آمل، جاده بابل",
    province: "مازندران",
    establishedYear: 1370,
    badge: "vip",
    isVerified: true,
    logoUrl: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=300&q=80",
    coverUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80",
    category: "نوشیدنی‌ها",
    mainProducts: ["نوشیدنی شمس", "پنیر آمل", "دوغ کاله"],
    minOrderAmount: "۳۰,۰۰۰,۰۰۰ تومان",
    address: "آمل، کیلومتر ۳ جاده بابل",
    phone: "۰۱۱-۴۴۲۱۰۰۰۰",
    managerName: "مهندس سلیمانی",
    rating: 4.9,
    reviewsCount: 310,
    capacityPerMonth: "۲۰۰۰۰ تن در ماه",
    description: "از پیشگامان صنعت لبنیات و نوشیدنی ایران با تکنولوژی نوین بسته‌بندی استریل و توزیع مویرگی کشوری.",
    profileDesignMode: "simple"
  }
];

export const INITIAL_PRODUCTS: Omit<Product, "id">[] = [
  {
    productCode: "PRD-1001",
    name: "چیپس سیب‌زمینی نمکی چی‌توز (کارتن ۴۰ عددی)",
    category: "تنقلات و شکلات",
    price: 25000,
    bulk_price: 18500,
    consumer_price: 25000,
    carton_pack_count: 40,
    min_order_cartons: 3,
    stock_quantity_cartons: 450,
    brand: "چی‌توز (به‌آرا)",
    factoryName: "صنایع غذایی به‌آرا (چی‌توز)",
    image_url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=800",
    description: "چیپس سیب‌زمینی ورشه‌ای تازه با نمک دریایی تصفیه شده. کیفیت فوق‌العاده و ترد با ضمانت ماندگاری ۶ ماه.",
    isFeatured: true,
    unit: "بسته",
    sellerId: "fac-1",
    sellerName: "صنایع غذایی به‌آرا (چی‌توز)",
    production_lead_time_days: 1
  },
  {
    productCode: "PRD-1002",
    name: "تخمه آفتابگردان نمکی مزمز (کارتن ۲۴ عددی)",
    category: "تنقلات و شکلات",
    price: 30000,
    bulk_price: 22000,
    consumer_price: 30000,
    carton_pack_count: 24,
    min_order_cartons: 2,
    stock_quantity_cartons: 320,
    brand: "مزمز",
    factoryName: "گروه کارخانجات مزمز",
    image_url: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=800",
    description: "تخمه آفتابگردان ایرانی برشته شده با نمک تصفیه شده، بویایی عطرآگین و طعم ماندگار بدون پوکی.",
    isFeatured: true,
    unit: "بسته",
    sellerId: "fac-2",
    sellerName: "گروه کارخانجات مزمز",
    production_lead_time_days: 1
  },
  {
    productCode: "PRD-1003",
    name: "بیسکویت شکلاتی بیسکولات شیرین عسل (کارتن ۳۶ عددی)",
    category: "کیک، کلوچه و بیسکویت",
    price: 45000,
    bulk_price: 34000,
    consumer_price: 45000,
    carton_pack_count: 36,
    min_order_cartons: 3,
    stock_quantity_cartons: 280,
    brand: "شیرین عسل",
    factoryName: "صنایع غذایی شیرین عسل",
    image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=800",
    description: "بیسکویت ترد دوقلو با روکش شکلات تلخ ۶۰ درصد واقعی شیرین عسل. محبوب‌ترین گزینه سوپرمارکت‌ها.",
    isFeatured: true,
    unit: "بسته",
    sellerId: "fac-3",
    sellerName: "صنایع غذایی شیرین عسل",
    production_lead_time_days: 2
  },
  {
    productCode: "PRD-1004",
    name: "نوشیدنی میوه‌ای آلبالو رانی (باکس ۱۲ عددی قوطی)",
    category: "نوشیدنی‌ها",
    price: 38000,
    bulk_price: 28000,
    consumer_price: 38000,
    carton_pack_count: 12,
    min_order_cartons: 5,
    stock_quantity_cartons: 600,
    brand: "رانی",
    factoryName: "صنایع نوشیدنی العوجان (رانی)",
    image_url: "https://images.unsplash.com/photo-1622597467827-43f0553ad9fe?auto=format&fit=crop&q=80&w=800",
    description: "نوشیدنی حاوی تکه‌های واقعی میوه آلبالو ۲۴۰ میلی‌لیتر. صادراتی با استاندارد استریل بالا.",
    isFeatured: false,
    unit: "قوطی",
    sellerId: "fac-4",
    sellerName: "صنایع غذایی کاله (گروه سولیکو)",
    production_lead_time_days: 1
  },
  {
    productCode: "PRD-1005",
    name: "رب گوجه فرنگی ۸۰۰ گرمی روژین تاک (شیرینک ۱۲ عددی)",
    category: "مواد غذایی و کنسروجات",
    price: 68000,
    bulk_price: 52000,
    consumer_price: 68000,
    carton_pack_count: 12,
    min_order_cartons: 4,
    stock_quantity_cartons: 500,
    brand: "روژین تاک",
    factoryName: "کنسروجات روژین تاک",
    image_url: "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&q=80&w=800",
    description: "رب گوجه فرنگی با غلظت بریکس ۲۷-۲۹ درجه، کاملاً طبیعی بدون مواد نگهدارنده یا رنگ مصنوعی.",
    isFeatured: true,
    unit: "قوطی",
    sellerId: "fac-5",
    sellerName: "کنسروجات روژین تاک",
    production_lead_time_days: 2
  },
  {
    productCode: "PRD-1006",
    name: "مایع ظرفشویی ۴ لیتر پریل (کارتن ۴ عددی)",
    category: "شوینده و بهداشتی",
    price: 175000,
    bulk_price: 135000,
    consumer_price: 175000,
    carton_pack_count: 4,
    min_order_cartons: 2,
    stock_quantity_cartons: 180,
    brand: "پریل (هنکل)",
    factoryName: "صنایع بهداشتی هنکل پاکوش",
    image_url: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=800",
    description: "مایع ظرفشویی چربی‌زدای قدرتمند با رایحه لیمو و فرمول ضدحساسیت پوستی.",
    isFeatured: false,
    unit: "گالن",
    sellerId: "fac-6",
    sellerName: "صنایع بهداشتی هنکل پاکوش",
    production_lead_time_days: 1
  }
];

export const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "تنقلات و شکلات", label: "🔖 تنقلات و شکلات", image: "https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=600" },
  { id: "cat-2", name: "کیک، کلوچه و بیسکویت", label: "🔖 کیک، کلوچه و بیسکویت", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=600" },
  { id: "cat-3", name: "مواد غذایی و کنسروجات", label: "🔖 مواد غذایی و کنسروجات", image: "https://images.unsplash.com/photo-1534483509719-3feaee7c30da?auto=format&fit=crop&q=80&w=600" },
  { id: "cat-4", name: "نوشیدنی‌ها", label: "🔖 نوشیدنی‌ها", image: "https://images.unsplash.com/photo-1622597467827-43f0553ad9fe?auto=format&fit=crop&q=80&w=600" },
  { id: "cat-5", name: "شوینده و بهداشتی", label: "🔖 شوینده و بهداشتی", image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&q=80&w=600" }
];

export async function seedProductsIfEmpty() {
  try {
    const q = collection(db, "products");
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log("Seeding products...");
      for (const p of INITIAL_PRODUCTS) {
        await addDoc(collection(db, "products"), {
          ...p,
          createdAt: serverTimestamp()
        });
      }
    }
  } catch (err) {
    console.warn("Seeding products encountered issue:", err);
  }
}
