import React from "react";
import { motion } from "motion/react";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
}

/**
 * Basic Shimmer & Pulse Skeleton Primitive
 */
export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  return (
    <div 
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800/60 backdrop-blur-xs ${
        variant === "circle" ? "rounded-full" : variant === "text" ? "rounded-md h-3.5 w-3/4" : "rounded-2xl"
      } ${className}`}
    >
      {/* Pulse Animation */}
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
        }}
        className="absolute inset-0 bg-slate-200/50 dark:bg-slate-700/30"
      />
      
      {/* Shimmer Animation */}
      <motion.div
        animate={{
          x: ["-100%", "250%"],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.8,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 dark:via-slate-600/20 to-transparent skew-x-[-25deg] z-10"
      />
    </div>
  );
}

/**
 * Advanced Product Card Skeleton matching ProductCard.tsx
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-[1.75rem] border border-slate-200/60 p-0 flex flex-col h-full overflow-hidden shadow-sm" dir="rtl">
      {/* Image Skeleton */}
      <div className="relative aspect-square w-full bg-slate-50/50 flex items-center justify-center">
        <Skeleton className="w-2/3 h-2/3 rounded-3xl" />
        {/* Floating badge skeleton */}
        <div className="absolute top-2.5 right-2.5">
          <Skeleton className="w-16 h-5 rounded-lg" />
        </div>
      </div>

      {/* Info Section Skeleton */}
      <div className="p-3.5 flex flex-col gap-2.5 flex-1">
        <div className="space-y-2">
          {/* Category tag */}
          <Skeleton className="w-16 h-4 rounded" />
          
          {/* Title - 2 lines */}
          <div className="space-y-1.5">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-4/5 h-4" />
          </div>
          
          {/* Profit badge */}
          <Skeleton className="w-32 h-3 mt-1" />
        </div>

        {/* Pricing Box Skeleton */}
        <div className="mt-auto space-y-2.5">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100/80 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="w-12 h-3" />
              <Skeleton className="w-24 h-5" />
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/50">
              <div className="space-y-1">
                <Skeleton className="w-10 h-2" />
                <Skeleton className="w-14 h-3" />
              </div>
              <div className="text-left space-y-1">
                <Skeleton className="w-12 h-2 mr-auto" />
                <Skeleton className="w-16 h-4 mr-auto" />
              </div>
            </div>
          </div>

          {/* Controls Skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="w-24 h-9 rounded-xl" />
            <Skeleton className="flex-1 h-9 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of Product Card Skeletons
 */
/**
 * Grid of Product Card Skeletons
 */
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={`prod-skel-${i}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <ProductCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Advanced Bento-style Product Grid Skeleton
 */
export function BentoProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" dir="rtl">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={`bento-skel-${i}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.04 }}
          className="bg-white rounded-[2.5rem] border border-slate-100 p-5 shadow-xs space-y-4"
        >
          <Skeleton className="aspect-square w-full rounded-[2rem]" />
          <div className="space-y-3 px-2">
            <Skeleton className="w-20 h-4 rounded-lg" />
            <Skeleton className="w-full h-6 rounded-xl" />
            <div className="flex justify-between items-center pt-2">
              <Skeleton className="w-24 h-8 rounded-xl" />
              <Skeleton className="w-12 h-12 rounded-full" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * Advanced Full-page Loading State
 */
export function PageLoaderSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-8" dir="rtl">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <BentoProductGridSkeleton count={8} />
    </div>
  );
}

/**
 * Smooth Fade-in Container for Lazy Loaded Components
 */
export function FadeInContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Skeleton for Section Views
 */
export function SectionSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6 p-4 sm:p-6 bg-white/80 rounded-3xl border border-slate-100 shadow-sm"
      dir="rtl"
    >
      {/* Top Banner Skeleton */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-100/80">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="w-48 h-5" />
            <Skeleton className="w-72 h-3" />
          </div>
        </div>
        <Skeleton className="w-28 h-9 rounded-xl shrink-0" />
      </div>

      {/* Grid of Skeleton Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ProductCardSkeleton key={`skel-card-item-${i}`} />
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Skeleton for Catalog & Product Grids
 */
export function CatalogSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6 py-6 px-2 sm:px-4" 
      dir="rtl"
    >
      {/* Search & Filter Bar Skeleton */}
      <div className="bg-white/80 p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
        <Skeleton className="w-full sm:w-72 h-10 rounded-2xl" />
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Skeleton className="w-20 h-9 rounded-xl shrink-0" />
          <Skeleton className="w-24 h-9 rounded-xl shrink-0" />
          <Skeleton className="w-20 h-9 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Grid Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <ProductCardSkeleton key={`skel-cat-item-${i}`} />
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Skeleton for Tables & Invoices
 */
export function TableSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-4 p-4 sm:p-6 bg-white/80 rounded-3xl border border-slate-100 shadow-sm" 
      dir="rtl"
    >
      <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
        <Skeleton className="w-40 h-9 rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="w-28 h-9 rounded-xl" />
          <Skeleton className="w-28 h-9 rounded-xl" />
        </div>
      </div>
      
      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-2xs">
        <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex justify-between items-center">
          <Skeleton className="w-32 h-4" />
          <Skeleton className="w-48 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={`skel-tbl-row-${i}`} className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-2/3 h-4" />
              <Skeleton className="w-1/3 h-3" />
            </div>
            <Skeleton className="w-20 h-7 rounded-lg shrink-0" />
            <Skeleton className="w-24 h-8 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Skeleton for Dashboards & Admin Panels
 */
export function DashboardSkeleton() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full space-y-6 p-4 sm:p-6 bg-white/90 rounded-3xl border border-slate-100 shadow-xs" 
      dir="rtl"
    >
      {/* Top Banner */}
      <div className="flex justify-between items-center bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/60">
        <div className="space-y-2">
          <Skeleton className="w-56 h-6" />
          <Skeleton className="w-80 h-3.5" />
        </div>
        <Skeleton className="w-32 h-10 rounded-2xl" />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={`skel-dash-metric-${i}`} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-2.5">
            <Skeleton className="w-8 h-8 rounded-xl" />
            <Skeleton className="w-24 h-3.5" />
            <Skeleton className="w-20 h-6" />
          </div>
        ))}
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 bg-white border border-slate-100 rounded-3xl space-y-4">
          <Skeleton className="w-40 h-5" />
          <Skeleton className="w-full h-48 rounded-2xl" />
        </div>
        <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-4">
          <Skeleton className="w-36 h-5" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={`skel-dash-side-${i}`} className="flex gap-3 items-center p-2 border-b border-slate-50">
                <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="w-full h-3.5" />
                  <Skeleton className="w-1/2 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Skeleton for Modals / Wizards (Checkout, cPanel, Invoice)
 */
export function ModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-400/50 backdrop-blur-sm" dir="rtl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-3xl p-6 border border-slate-100 shadow-2xl space-y-6"
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-2xl" />
            <Skeleton className="w-48 h-5" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>

        <div className="space-y-4">
          <Skeleton className="w-full h-12 rounded-2xl" />
          <Skeleton className="w-full h-28 rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="w-full h-10 rounded-xl" />
            <Skeleton className="w-full h-10 rounded-xl" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Skeleton className="w-24 h-10 rounded-xl" />
          <Skeleton className="w-32 h-10 rounded-xl" />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Skeleton for Calculator / B2B Profit Simulator
 */
export function CalculatorSkeleton() {
  return (
    <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-100 space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <Skeleton className="w-48 h-5" />
        <Skeleton className="w-20 h-7 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
    </div>
  );
}
