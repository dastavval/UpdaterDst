
export interface AdItem {
  id: string;
  title: string;
  description: string;
  factoryName: string;
  contactPerson: string;
  contactPhone: string;
  badgeText: string;
  category: "under_market" | "liquid" | "direct_supply";
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
}

export const getAdFallbackImage = (title: string, category: string): string => {
  const norm = title.toLowerCase();
  if (norm.includes("روغن")) {
    return "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600";
  }
  if (norm.includes("شکر") || norm.includes("قند")) {
    return "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?auto=format&fit=crop&q=80&w=600";
  }
  if (norm.includes("نشاسته") || norm.includes("آرد") || norm.includes("گلوتن")) {
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600";
  }
  if (norm.includes("رب") || norm.includes("گوجه")) {
    return "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=600";
  }
  if (norm.includes("نوشمک") || norm.includes("یخی") || norm.includes("شربت")) {
    return "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=600";
  }
  return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600";
};
