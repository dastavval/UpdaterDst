import React, { useState, useEffect, useRef } from "react";
import { getDisplayImageUrl } from "../lib/image-utils";
import { s3PreloadService } from "../lib/s3PreloadService";
import { X, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Global cache of successfully loaded image URLs to eliminate repeat shimmer / layout jumps
const GLOBAL_LOADED_IMAGES = new Set<string>();

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  className?: string;
  allowFullScreen?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = "محصول صنایع غذایی",
  className = "",
  loading = "lazy",
  allowFullScreen = true,
  ...props
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isIntersected, setIsIntersected] = useState<boolean>(() => loading === "eager");
  const [imgSrc, setImgSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState<boolean>(false);

  // Setup Intersection Observer for highly optimized lazy loading and background prefetching
  useEffect(() => {
    if (loading === "eager") {
      setIsIntersected(true);
      return;
    }

    if (typeof window === "undefined" || !window.IntersectionObserver) {
      setIsIntersected(true);
      return;
    }

    // Register with s3PreloadService for high-anticipation background prefetching
    if (containerRef.current && src) {
      s3PreloadService.observeForPrefetch(containerRef.current, src);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersected(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "800px 0px", // High anticipation prefetching: load well before scrolling into viewport
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, loading]);

  useEffect(() => {
    if (!isIntersected) return;

    if (!src || src.trim() === "") {
      setHasError(true);
      setIsLoading(false);
      setShowProgress(false);
      return;
    }

    const proxiedUrl = getDisplayImageUrl(src);
    const isAlreadyCached = GLOBAL_LOADED_IMAGES.has(proxiedUrl);

    // If already loaded in memory session, show instantly with no shimmer delay
    if (isAlreadyCached) {
      setImgSrc(proxiedUrl);
      setIsLoading(false);
      setShowProgress(false);
      setHasError(false);
      return;
    }

    // Active loading progress
    setShowProgress(true);
    setProgress(25);

    // If we don't have an image source yet (initial load), show the skeleton shimmer
    if (!imgSrc) {
      setIsLoading(true);
      setHasError(false);
      setImgSrc(proxiedUrl);
    } else {
      // It is a source update (e.g. switching products).
      // We preload the new image in the background to prevent any white flash or layout jump.
      setHasError(false);
      
      const img = new Image();
      img.src = proxiedUrl;
      img.referrerPolicy = "no-referrer";
      img.decoding = "async";
      
      img.onload = () => {
        GLOBAL_LOADED_IMAGES.add(proxiedUrl);
        setProgress(100);
        setImgSrc(proxiedUrl);
        setIsLoading(false);
        setShowProgress(false);
      };
      
      img.onerror = () => {
        // Fallback gracefully: update source and handle error
        setProgress(100);
        setImgSrc(proxiedUrl);
        setHasError(true);
        setIsLoading(false);
        setShowProgress(false);
      };
    }
  }, [src, isIntersected]);

  // Simulated progressive timer for beautiful loading feed
  useEffect(() => {
    if (!showProgress || progress >= 100) return;

    const timer = setTimeout(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        // Logarithmic formula to slow down near 95%
        const diff = (95 - prev) * 0.15;
        return Math.min(95, prev + Math.max(1.2, diff));
      });
    }, 120);

    return () => clearTimeout(timer);
  }, [showProgress, progress]);

  const handleLoad = () => {
    if (imgSrc) GLOBAL_LOADED_IMAGES.add(imgSrc);
    setIsLoading(false);
    setProgress(100);
    setTimeout(() => {
      setShowProgress(false);
    }, 200);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    setProgress(100);
    setTimeout(() => {
      setShowProgress(false);
    }, 400);
  };

  const toggleFullScreen = (e: React.MouseEvent) => {
    if (!allowFullScreen || hasError || isLoading) return;
    e.stopPropagation();
    setIsFullScreen(!isFullScreen);
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
    <>
      <div 
        ref={containerRef}
        className={`relative w-full h-full overflow-hidden flex items-center justify-center ${allowFullScreen && !hasError && !isLoading ? "cursor-zoom-in" : ""}`}
        onClick={toggleFullScreen}
      >
        {/* Sparkling Green & White Progress Bar */}
        {showProgress && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200/20 z-20 overflow-visible" dir="ltr">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={progress === 100 ? { type: "spring", stiffness: 85, damping: 16 } : { type: "spring", stiffness: 60, damping: 15 }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-emerald-400 to-white rounded-r-full"
              style={{
                boxShadow: "0 1px 10px rgba(16, 185, 129, 0.6), 0 0 3px rgba(255, 255, 255, 0.8)"
              }}
            />
            {/* Sparkling Star Spark trailing the progress edge - Smooth Spring Interpolated Position */}
            {progress < 100 && (
              <motion.div
                key="sparkle-spark"
                animate={{ left: `${progress}%` }}
                transition={{ type: "spring", stiffness: 70, damping: 18, mass: 0.6 }}
                className="absolute top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 pointer-events-none flex items-center justify-center z-30"
              >
                {/* Layered Glowing Aura */}
                <span className="absolute w-6 h-6 rounded-full bg-emerald-400/40 blur-[4px] animate-pulse" />
                <span className="absolute w-4 h-4 rounded-full bg-white/80 blur-[1px] animate-ping" style={{ animationDuration: '1.4s' }} />
                
                {/* Secondary Offset Smaller Star */}
                <motion.div 
                  className="absolute text-emerald-300"
                  animate={{ rotate: -360, scale: [0.8, 1.1, 0.8] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  style={{ transform: "translate(4px, -4px)" }}
                >
                  <svg className="w-2 h-2 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
                  </svg>
                </motion.div>

                {/* Primary 4-pointed Sparkle Star SVG with smooth spin */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                  className="text-white drop-shadow-[0_0_4px_rgba(16,185,129,0.8)]"
                >
                  <svg 
                    className="w-4 h-4" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 0l2.8 9.2 9.2 2.8-9.2 2.8-2.8 9.2-2.8-9.2-9.2-2.8 9.2-2.8z" />
                  </svg>
                </motion.div>
                
                {/* Floating Micro-Sparks with smooth offset trails */}
                <motion.span 
                  animate={{ y: [-4, 4], opacity: [0, 0.8, 0] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                  className="absolute -top-1 left-2 w-1 h-1 bg-white rounded-full" 
                />
                <motion.span 
                  animate={{ x: [-3, 3], opacity: [0, 0.7, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                  className="absolute bottom-2 -left-1 w-1 h-1 bg-emerald-200 rounded-full" 
                />
              </motion.div>
            )}

            {/* Premium organic particle release burst at 100% completion */}
            {progress === 100 && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none z-30 flex items-center justify-center">
                {/* Main Burst Aura */}
                <motion.div
                  initial={{ scale: 0.2, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="absolute w-8 h-8 rounded-full bg-emerald-400/30 blur-[2px]"
                />
                {/* Dynamic exploding sparkle stars */}
                {[0, 72, 144, 216, 288].map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  const targetX = Math.cos(rad) * 24;
                  const targetY = Math.sin(rad) * 24;
                  return (
                    <motion.div
                      key={`burst-spark-${idx}`}
                      initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
                      animate={{ x: targetX, y: targetY, scale: 0.8, opacity: 0 }}
                      transition={{ duration: 0.55, ease: "easeOut" }}
                      className="absolute text-emerald-300"
                    >
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" />
                      </svg>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
          <>
            <img
              src={imgSrc}
              alt={alt}
              onLoad={handleLoad}
              onError={handleError}
              loading={loading}
              decoding="async"
              referrerPolicy="no-referrer"
              className={`${className} transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
              {...props}
            />
            {allowFullScreen && !isLoading && (
              <div className="absolute top-2 right-2 p-1.5 bg-white/60 backdrop-blur-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-slate-600">
                <Maximize2 size={12} />
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Full Screen Image Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <div 
            className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/95 p-4 sm:p-10 backdrop-blur-md"
            onClick={toggleFullScreen}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-full flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={toggleFullScreen}
                className="absolute -top-12 right-0 text-white hover:text-emerald-400 transition-colors p-2 flex items-center gap-2 font-bold text-sm cursor-pointer"
              >
                <span>بستن</span>
                <X size={24} />
              </button>
              
              <div className="bg-white rounded-3xl p-2 sm:p-4 shadow-2xl overflow-hidden">
                <img 
                  src={imgSrc} 
                  alt={alt} 
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                />
              </div>
              
              <div className="mt-4 text-center">
                <h3 className="text-white font-black text-base">{alt}</h3>
                <p className="text-slate-400 text-xs mt-1">پیش‌نمایش تصویر با کیفیت اصلی</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
