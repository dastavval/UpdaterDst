export interface Product {
  id: string;
  productCode?: string; // e.g., "PRD-1234"
  sku?: string;
  name: string;
  brand: string;
  brandLogoUrl?: string; // URL for the brand logo
  description: string;
  purchase_price?: number; // Price the seller buys it for
  price: number; // Selling price per unit (wholesale)
  bulk_price: number; // Price per unit when buying full cartons
  consumer_price?: number; // Retail consumer price
  badge?: string; // Custom badge label (e.g. "ویژه", "جدید")
  rating?: number; // 1-5 star rating
  isFavorite?: boolean;
  pack_description?: string; // Packaging info, e.g. "هر کارتن 10 بسته 16 عددی"
  shipping_origin?: string; // e.g. "ارسال از انبار تامین کننده"
  carton_pack_count: number; // e.g., 24 packs per carton
  min_order_cartons: number; // MOQ in cartons
  category: string;
  stock_quantity_cartons: number; // Stock tracked in cartons
  min_stock_alert?: number; // آستانه هشدار موجودی ایمن برای ادمین
  image_url: string;
  unit: string; // e.g., "بسته", "قوطی", "پاکت"
  sellerId: string;
  sellerName: string;
  production_lead_time_days: number; // Days to manufacture/supply if out of stock
  factory_name?: string;
  factoryName?: string;
  tags?: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  isSponsored?: boolean;
  boostScore?: number;
  disabled?: boolean; // New: to disable product from being listed
  isKafBazaar?: boolean; // New: to show product in Kaf-e-Bazaar under-market section
  commissionPercent?: number; // New: custom commission rate for DastAvval
  updated_at?: string; // Last sync timestamp
  hasHealthApple?: boolean; // نشان سیب سلامت (سازمان غذا و دارو)
  isOrganic?: boolean; // ۱۰۰٪ ارگانیک
  isNatural?: boolean; // ۱۰۰٪ طبیعی
  healthCertCode?: string; // کد پروانه سیب سلامت (e.g., "۱۶/۱۲۴۵۸")
  healthBadges?: string[]; // e.g. ["سیب سلامت", "بدون افزودنی", "ارگانیک"]
  nutritionalTrafficLight?: {
    sugar?: 'green' | 'yellow' | 'red';
    fat?: 'green' | 'yellow' | 'red';
    salt?: 'green' | 'yellow' | 'red';
    transFat?: 'green' | 'yellow' | 'red';
  };
}

export interface Category {
  id: string;
  categoryCode?: string; // e.g., "CAT-1234"
  name: string;
  imageUrl?: string;
  description?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  date: string;
  author?: string;
  source?: string;
  category?: 'industry' | 'market' | 'announcement' | 'analysis' | string;
}

export interface FactoryReview {
  id: string;
  userName: string;
  userCity?: string;
  rating: number; // 1-5
  qualityRating?: number;
  packagingRating?: number;
  deliveryRating?: number;
  comment: string;
  createdAt: string;
  isVerifiedBuyer?: boolean;
}

export interface FactoryProfile {
  id: string;
  factoryCode?: string; // e.g., "FAC-1234"
  name: string;
  badge?: string;
  isVerified?: boolean;
  logoUrl?: string;
  logo?: string;
  coverUrl?: string;
  description?: string;
  desc?: string;
  rating: number; // 1-5
  location: string;
  city?: string;
  province?: string;
  address?: string;
  establishedYear?: number | string;
  established?: string;
  category?: string;
  mainProducts?: string[];
  minOrderAmount?: string;
  phone?: string;
  managerName?: string;
  capacityPerMonth?: string;
  specs?: string[];
  capacity?: string;
  contact?: string;
  contactPhone?: string;
  website?: string;
  email?: string;
  instagram?: string;
  videoUrl?: string;
  slug?: string;
  galleryImages?: { url: string; title: string; category?: 'production' | 'machinery' | 'warehouse' | 'lab' | 'exterior' }[];
  certificates?: { name: string; issuer?: string; year?: string; iconUrl?: string }[];
  isPremium?: boolean;
  isFeatured?: boolean;
  isPinned?: boolean;
  totalDeals?: number;
  viewsCount?: number;
  qualityScore?: number;
  packagingScore?: number;
  deliverySpeedScore?: number;
  reviewsCount?: number;
  reviews?: FactoryReview[];
  catalogs?: { name: string; url: string }[];
  // Advanced Design Support
  profileDesignMode?: 'simple' | 'advanced';
  customHtml?: string;
  customCss?: string;
  customJs?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantityCartons: number;
  pricePerCarton: number;
  totalItems: number;
  unitsPerCarton?: number;
  image_url?: string;
}

export type CartItem = OrderItem;

export interface User {
  id?: string;
  userCode?: string; // e.g., "USR-1234"
  agencyCode?: string; // e.g., "AGN-1234" (for agents)
  customerCode?: string; // e.g., "CST-1234" (for customers)
  name?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  company?: string;
  address?: string;
  city?: string;
  badge?: string;
  userBadge?: string;
  role?: 'admin' | 'factory' | 'agent' | 'customer' | 'user';
}

export type SupplyChainStage = 
  | 'order_received' 
  | 'raw_material_supply' 
  | 'production_line' 
  | 'factory_packaging' 
  | 'quality_assurance' 
  | 'logistic_shipping' 
  | 'delivered'
  | 'payment_verified'
  | 'warehouse_packing'
  | 'loading_freight'
  | 'in_transit'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'half_check' | 'full_check' | 'on_delivery' | 'cheque';

export type ShippingMethod = 'barbari' | 'darbasti' | 'deka_post' | 'peyk' | 'collect';

export interface Order {
  id?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  buyerCompany?: string;
  buyerInfo?: {
    name?: string;
    phone?: string;
    company?: string;
    address?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  originalAmount?: number; // Amount before discounts
  discountAmount?: number;
  status?: SupplyChainStage | string;
  paymentStatus?: 'pending' | 'paid' | 'unpaid' | 'partial';
  paymentMethod?: PaymentMethod;
  shippingMethod?: ShippingMethod;
  shippingCost?: number;
  sellerId?: string;
  sellerName?: string;
  createdAt?: any;
  trackingNumber?: string;
  hasSeal?: boolean; // For official invoices
  notes?: string;
  receiptUrl?: string; // Uploaded payment receipt or bank slip
  receiptNumber?: string;
  checkImageUrl?: string; // Uploaded check image
  chequeDetails?: {
    bankName?: string;
    sayadNumber?: string;
    chequeNumber?: string;
    chequeDate?: string;
    months?: number;
    amount?: number;
  };
  chequeMonths?: number;
  discountBreakdown?: {
    rawDiscount: number;
    badgeBonus: number;
    checkMarkup: number;
    chequeMarkup?: number;
    chequeMarkupPercent?: number;
    totalDiscount: number;
  };
}

export interface AccountingTransaction {
  id: string;
  type: 'income' | 'expense' | 'refund';
  amount: number;
  description: string;
  date: any;
  category: string;
  referenceId?: string; // Order ID
  status: 'completed' | 'pending' | 'cancelled';
}

export interface UserLevel {
  id: string;
  name: string;
  discountRate: number;
}

export interface BrandItem {
  id: string;
  name: string;
  type: string;
  icon?: string;
  bg?: string;
  text?: string;
  logoUrl?: string;
}

export interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  imageUrl: string;
  ctaText?: string;
  ctaAction?: string; // 'order' | 'catalog' | 'explore' | 'advisor' | 'contact'
  accentColor?: string;
}

export interface B2BConfig {
  primaryColor: string;
  appName?: string;
  appSub?: string;
  catalogPdfUrl?: string;
  factories?: FactoryProfile[];
  brands?: BrandItem[];
  logoUrl?: string;
  zarinpalMerchantCode?: string;
  brandImages?: string[];
  commissionRate?: number;
  userLevels?: UserLevel[];
  categories?: Category[];
  hqAddress?: string;
  supportPhone?: string;
  officialSealUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  gallery?: string[];
  minOrderAmount?: number;
  minOrderCartons?: number;
  topAnnouncement?: string;
  showTopAnnouncement?: boolean;
  topAnnouncementPopupTitle?: string;
  topAnnouncementPopupContent?: string;
  slides?: SlideItem[];
  // ParsPack / S3 Object Storage Credentials & Settings
  storageEndpoint?: string;
  storageAccessKey?: string;
  storageSecretKey?: string;
  storageBucket?: string;
  storageRegion?: string;
  storagePublicUrl?: string;
  storageEnabled?: boolean;
  // Social Media & Messaging Channels
  rubikaChannelUrl?: string;
  telegramChannelUrl?: string;
  whatsappGroupUrl?: string;
  instagramPageUrl?: string;
  socialChannelsTitle?: string;
  socialChannelsSubtitle?: string;
  pwaPromptDelaySeconds?: number;
  showTopSocialBar?: boolean;
  githubRepoUrl?: string;
  githubToken?: string;
  lastGithubUpdate?: number | null;
}

export interface InventoryLog {
  id?: string;
  productId: string;
  changeAmountCartons: number;
  reason: string;
  timestamp: any;
}

export interface Review {
  id?: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  qualityRating?: number;
  packagingRating?: number;
  createdAt: any;
}
