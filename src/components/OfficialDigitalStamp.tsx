import React from "react";

// Official Unified Seal & Signature: Overlapping Square QR Stamp + Authentic Cursive Signature
export function OfficialUnifiedSealSignature({ className = "w-44 h-28" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      
      {/* 1. Base Layer: Official Square QR Digital Stamp (High-resolution SVG) */}
      <svg 
        viewBox="0 0 260 260" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-24 h-24 sm:w-26 sm:h-26 shrink-0 opacity-95 filter drop-shadow-xs"
        aria-label="مهر دیجیتال و کیوآرکد تایید اصالت بازرگانی دست اول"
      >
        {/* Outer Square Border */}
        <rect x="8" y="8" width="244" height="244" rx="8" fill="#ffffff" stroke="#1e40af" strokeWidth="3" />
        <rect x="14" y="14" width="232" height="232" rx="6" fill="none" stroke="#1e40af" strokeWidth="1" strokeDasharray="4 2" />

        {/* 3 Corner Positioning QR Markers */}
        <rect x="24" y="24" width="46" height="46" rx="4" fill="none" stroke="#1e40af" strokeWidth="6" />
        <rect x="36" y="36" width="22" height="22" rx="2" fill="#1e40af" />

        <rect x="190" y="24" width="46" height="46" rx="4" fill="none" stroke="#1e40af" strokeWidth="6" />
        <rect x="202" y="36" width="22" height="22" rx="2" fill="#1e40af" />

        <rect x="24" y="190" width="46" height="46" rx="4" fill="none" stroke="#1e40af" strokeWidth="6" />
        <rect x="36" y="202" width="22" height="22" rx="2" fill="#1e40af" />

        {/* QR Data Matrix Dots */}
        <g fill="#1e40af">
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
        <rect x="68" y="68" width="124" height="124" rx="8" fill="#ffffff" stroke="#1d4ed8" strokeWidth="2" />

        {/* Center Geometric Origami Ribbon Logo */}
        <g transform="translate(104, 78) scale(0.52)">
          <path d="M 50 0 L 100 30 L 50 60 L 0 30 Z" fill="#1e3a8a" />
          <path d="M 0 30 L 50 60 L 50 110 L 0 80 Z" fill="#2563eb" />
          <path d="M 50 60 L 100 30 L 100 80 L 50 110 Z" fill="#3b82f6" />
        </g>

        {/* Official Register Text */}
        <text 
          x="130" 
          y="156" 
          textAnchor="middle" 
          fill="#1e3a8a" 
          fontSize="11" 
          fontWeight="900" 
          fontFamily="system-ui, sans-serif" 
          letterSpacing="0.5"
        >
          DASTAVVAL.COM
        </text>

        <text 
          x="130" 
          y="173" 
          textAnchor="middle" 
          fill="#1e40af" 
          fontSize="9.5" 
          fontWeight="800" 
          fontFamily="system-ui, sans-serif"
        >
          REG. CODE: 3360
        </text>
      </svg>

      {/* 2. Top Layer: Overlapping Authentic Cursive Signature (Signed across and on top of the stamp) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none transform -rotate-3 translate-x-2">
        <svg 
          viewBox="0 0 400 350" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-36 h-28 sm:w-40 sm:h-30 text-[#142d68] filter drop-shadow-sm"
          aria-label="امضای رسمی و الکترونیکی مدیریت"
        >
          <g stroke="#142d68" strokeLinecap="round" strokeLinejoin="round">
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
            <circle cx="210" cy="115" r="3.5" fill="#142d68" />
          </g>
        </svg>
      </div>

    </div>
  );
}

// Export individual components if needed elsewhere
export function AuthenticSignature({ className = "w-32 h-20" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 400 350" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <g stroke="#1a3675" strokeLinecap="round" strokeLinejoin="round">
        <path 
          d="M 120 180 C 110 170, 95 160, 85 175 C 75 190, 85 205, 105 195 C 120 185, 130 160, 135 140 C 137 130, 140 180, 142 220" 
          strokeWidth="6" 
        />
        <path 
          d="M 142 210 C 150 170, 160 135, 180 120 C 190 115, 195 125, 190 140 C 180 165, 165 210, 155 250 C 145 285, 140 310, 150 315 C 155 315, 160 290, 175 240" 
          strokeWidth="6.5" 
        />
        <path 
          d="M 45 260 C 110 210, 180 165, 230 150 C 290 130, 355 150, 360 200 C 365 245, 310 275, 250 260 C 205 245, 215 185, 255 180 C 285 175, 305 210, 275 230 C 245 245, 200 230, 170 235 C 160 237, 180 250, 210 260 C 245 270, 290 270, 315 250" 
          strokeWidth="5.5" 
        />
        <circle cx="210" cy="115" r="4" fill="#1a3675" />
      </g>
    </svg>
  );
}
