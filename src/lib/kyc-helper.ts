/**
 * Dastavval National B2B Platform - Representative KYC & Identity Verification Helper
 */

export interface RepresentativeKycData {
  id: string; // matches user phone or rep agencyCode
  userId?: string;
  repId?: string;
  agencyCode?: string;
  
  // Personal & Legal Identity
  fullName: string;
  nationalCode: string;
  fatherName: string;
  birthDate: string;
  mobile: string;
  phone?: string;
  email?: string;
  
  // Business & Facility Details
  companyName?: string;
  province: string;
  city: string;
  postalCode: string;
  warehouseAddress: string;
  warehouseAreaM2?: number | string;
  distributionVehiclesCount?: number | string;
  
  // Uploaded Verification Documents (Base64 data URLs or links)
  nationalCardFrontUrl: string;
  nationalCardBackUrl?: string;
  businessLicenseUrl?: string; // جواز کسب / پروانه فعالیت
  warehouseDeedUrl?: string;    // سند یا اجاره‌نامه انبار
  promissoryOrChequeUrl?: string; // چک یا سفته صیادی ضمانت
  selfieWithIdUrl?: string;     // عکس سلفی یا وبکم چهره با کارت ملی
  
  // Status & Timestamps
  status: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewerNotes?: string;
  rejectionReason?: string;
  
  // Auto verification confidence score
  verificationScore?: number;
}

const KYC_STORAGE_KEY = "dastavval_representatives_kyc";

/**
 * Standard Iranian National ID (کد ملی) Check Digit Verification Algorithm
 * 10 digits, checks modulus 11 checksum
 */
export function isValidIranianNationalCode(code: string): boolean {
  if (!code) return false;
  const clean = code.trim().replace(/[^\d]/g, '');
  if (clean.length !== 10) return false;
  
  // Check for repetitive invalid patterns like '0000000000', '1111111111', etc.
  if (/^(\d)\1{9}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }

  const remainder = sum % 11;
  const checkDigit = parseInt(clean.charAt(9), 10);

  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === (11 - remainder);
  }
}

/**
 * Format National Code to standard 000-000000-0 or clean digits
 */
export function formatNationalCode(code: string): string {
  const clean = (code || "").replace(/[^\d]/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 9)}-${clean.slice(9, 10)}`;
  }
  return clean;
}

/**
 * Get all KYC records from localStorage
 */
export function getAllRepresentativeKycs(): Record<string, RepresentativeKycData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KYC_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse KYC data:", e);
    return {};
  }
}

/**
 * Get KYC data for a specific user / representative (by phone, agencyCode, or ID)
 */
export function getRepresentativeKyc(identifier: string): RepresentativeKycData | null {
  if (!identifier) return null;
  const all = getAllRepresentativeKycs();
  
  // Direct match
  if (all[identifier]) return all[identifier];

  // Lookup by phone or agencyCode in values
  const list = Object.values(all);
  const found = list.find(k => 
    k.id === identifier || 
    k.mobile === identifier || 
    k.agencyCode === identifier || 
    k.userId === identifier ||
    k.nationalCode === identifier
  );

  return found || null;
}

/**
 * Save / Submit KYC application
 */
export function saveRepresentativeKyc(data: RepresentativeKycData): boolean {
  if (typeof window === "undefined") return false;
  try {
    const all = getAllRepresentativeKycs();
    const key = data.id || data.mobile || data.agencyCode || `KYC-${Date.now()}`;
    
    const updatedRecord: RepresentativeKycData = {
      ...data,
      id: key,
      submittedAt: data.submittedAt || new Date().toISOString()
    };

    all[key] = updatedRecord;
    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(all));

    // Also sync status into dastavval_representatives list
    try {
      const repsRaw = localStorage.getItem("dastavval_representatives");
      if (repsRaw) {
        const reps = JSON.parse(repsRaw);
        const idx = reps.findIndex((r: any) => 
          r.phone === data.mobile || 
          r.agencyCode === data.agencyCode || 
          r.id === data.id
        );
        if (idx !== -1) {
          reps[idx].kycStatus = updatedRecord.status;
          reps[idx].nationalCode = updatedRecord.nationalCode;
          reps[idx].nationalCardFrontUrl = updatedRecord.nationalCardFrontUrl;
          if (updatedRecord.status === 'verified') {
            reps[idx].isApproved = true;
            reps[idx].isRepresentativeApproved = true;
          }
          localStorage.setItem("dastavval_representatives", JSON.stringify(reps));
        }
      }
    } catch (err) {
      console.warn("Syncing KYC to reps list:", err);
    }

    // Also sync status into current active user if matches
    try {
      const activeUserRaw = localStorage.getItem("dastavval_user");
      if (activeUserRaw) {
        const activeUser = JSON.parse(activeUserRaw);
        if (activeUser.phone === data.mobile || activeUser.id === data.userId || activeUser.agencyCode === data.agencyCode) {
          activeUser.kycStatus = updatedRecord.status;
          activeUser.nationalCode = updatedRecord.nationalCode;
          if (updatedRecord.status === 'verified') {
            activeUser.isRepresentativeApproved = true;
            activeUser.agencyApproved = true;
          }
          localStorage.setItem("dastavval_user", JSON.stringify(activeUser));
        }
      }
    } catch (e) {}

    // Dispatch event so UI instantly updates
    window.dispatchEvent(new CustomEvent("representative-kyc-updated", { detail: updatedRecord }));

    return true;
  } catch (e) {
    console.error("Failed to save KYC record:", e);
    return false;
  }
}

/**
 * Admin action: Approve or Reject Representative KYC
 */
export function updateRepresentativeKycStatus(
  identifier: string,
  newStatus: 'verified' | 'rejected' | 'pending',
  reviewerNotes?: string,
  rejectionReason?: string
): boolean {
  const current = getRepresentativeKyc(identifier);
  if (!current) return false;

  const updated: RepresentativeKycData = {
    ...current,
    status: newStatus,
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'مدیریت بازرگانی دست اول',
    reviewerNotes: reviewerNotes || current.reviewerNotes,
    rejectionReason: newStatus === 'rejected' ? (rejectionReason || 'نقص در وضوح مدارک ارسالی') : undefined
  };

  return saveRepresentativeKyc(updated);
}
