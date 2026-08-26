import React from "react";

export interface OfficialSealProps {
  className?: string;
  sealUrl?: string;
  signatureUrl?: string;
  sealType?: "dynamic_vector" | "custom_image" | "split_stamp_sign" | "signature_only" | "stamp_only";
  companyTitle?: string;
  regNumber?: string;
  trackingCode?: string;
  sealColor?: string;
  signerName?: string;
  signerTitle?: string;
  showSignerText?: boolean;
}

// Persian number helper
const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "";
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)]);
};

// Official Unified Seal & Signature: Overlapping QR Stamp + Authentic Cursive Signature
export function OfficialUnifiedSealSignature({
  className = "w-44 h-28",
  sealUrl,
  signatureUrl,
  sealType = "dynamic_vector",
  companyTitle,
  regNumber,
  trackingCode,
  sealColor = "#1e40af",
  signerName,
  signerTitle = "مدیریت بازرگانی و ترابری",
  showSignerText = true,
}: OfficialSealProps) {
  // If the admin uploaded a custom seal/signature image and chosen custom_image or sealUrl exists without explicit dynamic_vector
  const hasCustomSealImage = Boolean(sealUrl && sealUrl.trim().length > 5);
  const hasCustomSignImage = Boolean(signatureUrl && signatureUrl.trim().length > 5);

  // If mode is explicitly custom_image or custom sealUrl is provided and sealType is not forcing dynamic_vector
  const isImageMode = sealType === "custom_image" || (hasCustomSealImage && sealType !== "dynamic_vector");

  const effectiveColor = sealColor || "#1e40af";
  const displayCompany = companyTitle || "صنایع غذایی و بازرگانی دست اول";
  const displayReg = regNumber ? `ثبت: ${toPersianNum(regNumber)}` : "REG. CODE: 3360";

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      
      {/* 1. Custom Image Mode */}
      {isImageMode && hasCustomSealImage ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={sealUrl}
            alt="مهر و امضای رسمی"
            className="max-h-24 max-w-full object-contain mix-blend-multiply filter drop-shadow-xs"
          />
          {hasCustomSignImage && (
            <img
              src={signatureUrl}
              alt="امضای رسمی"
              className="absolute inset-0 m-auto max-h-20 max-w-full object-contain mix-blend-multiply transform -rotate-3"
            />
          )}
        </div>
      ) : sealType === "signature_only" ? (
        /* 2. Signature Only Mode */
        <div className="relative w-full h-full flex items-center justify-center">
          {hasCustomSignImage ? (
            <img
              src={signatureUrl}
              alt="امضای رسمی"
              className="max-h-20 max-w-full object-contain mix-blend-multiply"
            />
          ) : (
            <AuthenticSignature color={effectiveColor} className="w-36 h-24 text-[#142d68]" />
          )}
        </div>
      ) : (
        /* 3. Dynamic High-Resolution Vector Stamp + Signature */
        <div className="relative flex items-center justify-center">
          {/* Base Layer: Official Square QR Digital Stamp */}
          <svg 
            viewBox="0 0 260 260" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-24 h-24 sm:w-26 sm:h-26 shrink-0 opacity-95 filter drop-shadow-xs"
            aria-label="مهر دیجیتال و کیوآرکد تایید اصالت بازرگانی دست اول"
          >
            {/* Outer Square Border */}
            <rect x="8" y="8" width="244" height="244" rx="8" fill="#ffffff" stroke={effectiveColor} strokeWidth="3" />
            <rect x="14" y="14" width="232" height="232" rx="6" fill="none" stroke={effectiveColor} strokeWidth="1" strokeDasharray="4 2" />

            {/* 3 Corner Positioning QR Markers */}
            <rect x="24" y="24" width="46" height="46" rx="4" fill="none" stroke={effectiveColor} strokeWidth="6" />
            <rect x="36" y="36" width="22" height="22" rx="2" fill={effectiveColor} />

            <rect x="190" y="24" width="46" height="46" rx="4" fill="none" stroke={effectiveColor} strokeWidth="6" />
            <rect x="202" y="36" width="22" height="22" rx="2" fill={effectiveColor} />

            <rect x="24" y="190" width="46" height="46" rx="4" fill="none" stroke={effectiveColor} strokeWidth="6" />
            <rect x="36" y="202" width="22" height="22" rx="2" fill={effectiveColor} />

            {/* QR Data Matrix Dots */}
            <g fill={effectiveColor}>
              <rect x="82" y="26" width="8" height="8" />
              <rect x="98" y="26" width="8" height="8" />
              <rect x="114" y="26" width="8" height="8" />
              <rect x="138" y="26" width="8" height="8" />
              <rect x="154" y="26" width="8" height="8" />
              <rect x="170" y="26" width="8" height="8" />

              <rect x="82" y="42" width="8" height="8" />
              <rect x="114" y="42" width="8" height="8" />
              <rect x="138" y="42" width="8" height="8" />
              <rect x="170" y="42" width="8" height="8" />

              <rect x="26" y="82" width="8" height="8" />
              <rect x="42" y="82" width="8" height="8" />
              <rect x="58" y="82" width="8" height="8" />
              <rect x="194" y="82" width="8" height="8" />
              <rect x="210" y="82" width="8" height="8" />
              <rect x="226" y="82" width="8" height="8" />

              <rect x="26" y="110" width="8" height="8" />
              <rect x="54" y="126" width="8" height="8" />
              <rect x="26" y="142" width="8" height="8" />
              <rect x="42" y="158" width="8" height="8" />

              <rect x="226" y="110" width="8" height="8" />
              <rect x="198" y="126" width="8" height="8" />
              <rect x="226" y="142" width="8" height="8" />
              <rect x="210" y="158" width="8" height="8" />

              <rect x="82" y="210" width="8" height="8" />
              <rect x="106" y="210" width="8" height="8" />
              <rect x="130" y="210" width="8" height="8" />
              <rect x="154" y="210" width="8" height="8" />
              <rect x="178" y="210" width="8" height="8" />

              <rect x="82" y="226" width="8" height="8" />
              <rect x="122" y="226" width="8" height="8" />
              <rect x="162" y="226" width="8" height="8" />
            </g>

            {/* Central Shield Box */}
            <rect x="68" y="68" width="124" height="124" rx="8" fill="#ffffff" stroke={effectiveColor} strokeWidth="2" />

            {/* Center Geometric Origami Ribbon Logo */}
            <g transform="translate(104, 76) scale(0.52)">
              <path d="M 50 0 L 100 30 L 50 60 L 0 30 Z" fill={effectiveColor} />
              <path d="M 0 30 L 50 60 L 50 110 L 0 80 Z" fill={effectiveColor} opacity="0.85" />
              <path d="M 50 60 L 100 30 L 100 80 L 50 110 Z" fill={effectiveColor} opacity="0.7" />
            </g>

            {/* Official Register Text */}
            <text 
              x="130" 
              y="154" 
              textAnchor="middle" 
              fill={effectiveColor} 
              fontSize="10" 
              fontWeight="900" 
              fontFamily="system-ui, sans-serif" 
              letterSpacing="0.3"
            >
              {displayCompany.length > 20 ? displayCompany.substring(0, 18) + "..." : displayCompany}
            </text>

            <text 
              x="130" 
              y="172" 
              textAnchor="middle" 
              fill={effectiveColor} 
              fontSize="9" 
              fontWeight="800" 
              fontFamily="system-ui, sans-serif"
            >
              {displayReg}
            </text>
          </svg>

          {/* Top Layer: Overlapping Authentic Cursive Signature */}
          {sealType !== "stamp_only" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none transform -rotate-3 translate-x-2">
              {hasCustomSignImage ? (
                <img
                  src={signatureUrl}
                  alt="امضای رسمی"
                  className="max-h-22 max-w-full object-contain mix-blend-multiply"
                />
              ) : (
                <AuthenticSignature color={effectiveColor} className="w-36 h-28 sm:w-40 sm:h-30 filter drop-shadow-xs" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Optional Signer Designation Label under the stamp */}
      {showSignerText && (signerName || signerTitle) && (
        <div className="mt-1 text-center pointer-events-none">
          {signerName && (
            <span className="text-[8.5px] font-black text-slate-800 block leading-tight">
              {signerName}
            </span>
          )}
          {signerTitle && (
            <span className="text-[7.5px] font-bold text-slate-500 block leading-tight">
              {signerTitle}
            </span>
          )}
        </div>
      )}

    </div>
  );
}

// Export individual components
export function AuthenticSignature({ 
  className = "w-32 h-20", 
  color = "#142d68" 
}: { 
  className?: string; 
  color?: string;
}) {
  return (
    <svg 
      viewBox="0 0 400 350" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="امضای رسمی و الکترونیکی مدیریت"
    >
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
        {/* 'a' & 'y' stroke */}
        <path 
          d="M 120 180 C 110 170, 95 160, 85 175 C 75 190, 85 205, 105 195 C 120 185, 130 160, 135 140 C 137 130, 140 180, 142 220" 
          strokeWidth="5.5" 
        />
        {/* 'l' ascender and descending tail */}
        <path 
          d="M 142 210 C 150 170, 160 135, 180 120 C 190 115, 195 125, 190 140 C 180 165, 165 210, 155 250 C 145 285, 140 310, 150 315 C 155 315, 160 290, 175 240" 
          strokeWidth="6" 
        />
        {/* Wide sweeping spiral swirl crossing over the stamp */}
        <path 
          d="M 45 260 C 110 210, 180 165, 230 150 C 290 130, 355 150, 360 200 C 365 245, 310 275, 250 260 C 205 245, 215 185, 255 180 C 285 175, 305 210, 275 230 C 245 245, 200 230, 170 235 C 160 237, 180 250, 210 260 C 245 270, 290 270, 315 250" 
          strokeWidth="5" 
        />
        {/* Dot mark */}
        <circle cx="210" cy="115" r="3.5" fill={color} />
      </g>
    </svg>
  );
}

