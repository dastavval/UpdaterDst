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

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [];

export const INITIAL_RAW_SUPPLIERS: RawMaterialSupplier[] = [];
