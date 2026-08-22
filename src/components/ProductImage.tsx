import React, { useState, useEffect } from "react";
import { getDisplayImageUrl } from "../lib/image-utils";

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = "محصول صنایع غذایی",
  className = "",
  loading = "lazy",
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    // Reset state for new src
    setIsLoading(true);
    setHasError(false);

    if (!src || src.trim() === "") {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const proxiedUrl = getDisplayImageUrl(src);
    setImgSrc(proxiedUrl);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  // Food Industry stylized SVG Placeholder
  const FoodPlaceholder = () => (
    <div className={`w-full h-full bg-slate-50 flex flex-col items-center justify-center p-4 border border-slate-100 rounded-2xl relative overflow-hidden select-none ${className}`}>
      {/* Decorative subtle background waves */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="currentColor" className="text-slate-800" />
        </svg>
      </div>

      <div className="w-16 h-16 rounded-2xl bg-slate-100/80 flex items-center justify-center mb-2.5 shadow-2xs border border-slate-200/50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-8 h-8 text-slate-400"
        >
          {/* A stylized food can or box / container symbol */}
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className="text-[10px] font-bold text-slate-400 text-center tracking-wide leading-relaxed">
        پیش‌نمایش کالا
      </span>
      <span className="text-[8px] font-medium text-slate-300 mt-1">
        صنایع غذایی دست اول
      </span>
    </div>
  );

  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
      {/* Skeleton Shimmer Loading State */}
      {isLoading && !hasError && (
        <div className={`absolute inset-0 bg-slate-50 animate-pulse flex flex-col items-center justify-center p-4 rounded-2xl border border-slate-100/50 ${className}`}>
          <div className="w-12 h-12 bg-slate-200/60 rounded-full mb-2" />
          <div className="w-20 h-2 bg-slate-200/60 rounded mb-1" />
          <div className="w-12 h-1.5 bg-slate-200/40 rounded" />
        </div>
      )}

      {hasError ? (
        <FoodPlaceholder />
      ) : imgSrc ? (
        <img
          src={imgSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          referrerPolicy="no-referrer"
          className={`${className} transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          {...props}
        />
      ) : null}
    </div>
  );
};
