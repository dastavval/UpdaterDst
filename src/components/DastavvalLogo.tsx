import React from 'react';

interface DastavvalLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textColor?: string;
  variant?: 'full' | 'icon';
  logoUrl?: string;
}

export default function DastavvalLogo({
  className = "h-10",
  size = 40,
  showText = true,
  textColor = "text-slate-900",
  variant = 'full',
  logoUrl
}: DastavvalLogoProps) {
  const [imgFailed, setImgFailed] = React.useState(false);

  const isDefaultLogo = logoUrl === "https://raw.githubusercontent.com/antigravity-agent/media/main/dastavval_logo.png" || !logoUrl || logoUrl === "/assets/logo.svg" || logoUrl.includes("dastavval_logo.png");

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {!isDefaultLogo && logoUrl && !imgFailed ? (
        <div className="flex items-center justify-center shrink-0">
          <img
            src={logoUrl}
            alt="Logo"
            style={{ height: size, width: 'auto' }}
            className="object-contain max-w-[130px]"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        /* Dynamic Professional Vector Logo Emblem */
        <svg
          width={size}
          height={size}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-sm"
        >
        <defs>
          <linearGradient id="dastG1" x1="20" y1="20" x2="180" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="dastG2" x1="100" y1="20" x2="180" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="dastGlass" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer Shield / Hex Factory Frame */}
        <path
          d="M100 12 L176 56 V144 L100 188 L24 144 V56 Z"
          fill="url(#dastG1)"
          rx="16"
        />

        {/* Golden Direct Trade Ribbon / Arrow fold */}
        <path
          d="M100 32 L160 68 V132 L100 168 L100 100 L132 82 L100 64 Z"
          fill="url(#dastG2)"
        />

        {/* Left Emerald Facet */}
        <path
          d="M100 32 L40 68 V132 L100 168 L100 100 L68 82 L100 64 Z"
          fill="#34d399"
          opacity="0.95"
        />

        {/* Center Golden Star/Diamond 'Handshake & Factory Direct' Token */}
        <polygon
          points="100,52 114,80 144,80 120,98 128,126 100,108 72,126 80,98 56,80 86,80"
          fill="#ffffff"
          opacity="0.98"
        />

        {/* Inner Core Arrow pointing forward */}
        <path
          d="M88 88 L112 88 L100 70 Z"
          fill="#047857"
        />
      </svg>
      )}

      {/* Persian Text Branding "دست اول" */}
      {showText && variant === 'full' && (
        <div className="flex flex-col justify-center">
          <span className={`font-black tracking-tight text-base md:text-lg leading-none ${textColor}`} style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
            دست اول
          </span>
          <span className="text-[9px] font-black text-emerald-600 tracking-tight mt-0.5">
            سامانه بنکداری و تامین مستقیم
          </span>
        </div>
      )}
    </div>
  );
}

