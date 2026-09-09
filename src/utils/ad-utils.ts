export interface AdItem {
  id: string;
  title: string;
  description: string;
  factoryName: string;
  contactPerson: string;
  contactPhone: string;
  badgeText: string;
  category: "under_market" | "liquid" | "direct_supply" | "materials" | "services" | "equipment";
  quantity: string;
  wholesalePrice: string;
  marketPrice: string;
  buyerProfit: string;
  isSponsored?: boolean;
  date: string;
  imageUrl?: string;
  imageUrls?: string[];
  status: "approved" | "pending" | "rejected";
  rejectionReason?: string;
  specialRequest?: boolean;
  specialRequestMessage?: string;
  isHotFireDeal?: boolean;
  publisherType?: "factory" | "individual" | "broker";
  creatorPhone?: string; // Links ad to a user account
  creatorAvatar?: string; // Optional custom avatar of the advertiser
  creatorName?: string; // Optional custom name of the advertiser
  specialPaymentStatus?: "none" | "pending" | "approved" | "rejected";
  specialReceiptUrl?: string;
  adminNote?: string;
  productCategory?: string;
  city?: string;
  province?: string;
  ladderTimestamp?: number;
  sponsoredUntil?: number;
  isFloorMarket?: boolean;
  user_id?: string;
  isBarterAllowed?: boolean;
  minOrderQty?: string;
}

export const getAdFallbackImage = (title: string, category: string): string => {
  const norm = title.toLowerCase();
  if (category === "equipment" || norm.includes("دستگاه") || norm.includes("تجهیزات") || norm.includes("ماشین")) {
    return "http://c102393.parspack.net/c102393/products/prd_100.webp";
  }
  if (norm.includes("روغن")) {
    return "http://c102393.parspack.net/c102393/products/prd_101.webp";
  }
  if (norm.includes("شکر") || norm.includes("قند")) {
    return "http://c102393.parspack.net/c102393/products/prd_102.webp";
  }
  if (norm.includes("نشاسته") || norm.includes("آرد") || norm.includes("گلوتن")) {
    return "http://c102393.parspack.net/c102393/products/prd_103.webp";
  }
  if (norm.includes("رب") || norm.includes("گوجه")) {
    return "http://c102393.parspack.net/c102393/products/prd_104.webp";
  }
  if (norm.includes("نوشمک") || norm.includes("یخی") || norm.includes("شربت")) {
    return "http://c102393.parspack.net/c102393/products/prd_105.webp";
  }
  return "http://c102393.parspack.net/c102393/products/prd_1.webp";
};
