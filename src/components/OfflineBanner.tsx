import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

interface OfflineBannerProps {
  onSyncPendingData?: () => void;
}

export default function OfflineBanner({ onSyncPendingData }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showRestoredToast, setShowRestoredToast] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredToast(true);
      setIsSyncing(true);

      if (onSyncPendingData) {
        onSyncPendingData();
      }

      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);

      setTimeout(() => {
        setShowRestoredToast(false);
      }, 5000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredToast(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onSyncPendingData]);

  return (
    <>
      {/* Offline Toast/Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 z-[999999] max-w-md bg-amber-900/95 text-amber-100 border border-amber-600/60 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-bold"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
                <WifiOff size={18} />
              </div>
              <div className="space-y-0.5">
                <p className="text-white font-black flex items-center gap-1.5">
                  <span>اتصال اینترنت قطع است</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">حالت آفلاین امن</span>
                </p>
                <p className="text-[11px] text-amber-200/90 leading-tight">
                  تغییرات شما در حافظه دستگاه ذخیره می‌شود و پس از اتصال به اینترنت همگام خواهد شد.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Restored Toast */}
      <AnimatePresence>
        {isOnline && showRestoredToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="fixed top-3 left-3 right-3 sm:left-auto sm:right-6 z-[999999] max-w-md bg-emerald-950/95 text-emerald-100 border border-emerald-500/60 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-bold"
            dir="rtl"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
              </div>
              <div className="space-y-0.5">
                <p className="text-white font-black flex items-center gap-1.5">
                  <span>اتصال اینترنت برقرار شد</span>
                  <ShieldCheck size={14} className="text-emerald-400" />
                </p>
                <p className="text-[11px] text-emerald-200/90 leading-tight">
                  {isSyncing ? "در حال همگام‌سازی اطلاعات با سرور مرکزی..." : "تمام اطلاعات آفلاین با موفقیت به سرور انتقال یافت."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
