import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Zap, ShieldAlert, CheckCircle2, RefreshCw, Signal, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NetworkStatusWidgetProps {
  currentViewMode: 'list' | 'grid' | 'table' | 'high_margin' | string;
  onSwitchToListMode: () => void;
}

export default function NetworkStatusWidget({
  currentViewMode,
  onSwitchToListMode
}: NetworkStatusWidgetProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [rtt, setRtt] = useState<number | null>(null);
  const [effectiveType, setEffectiveType] = useState<string>("4g");
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'moderate' | 'slow' | 'offline'>('excellent');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [dismissedPrompt, setDismissedPrompt] = useState<boolean>(false);

  // Measure latency and connection state
  const checkConnection = async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      setNetworkQuality('offline');
      return;
    }

    setIsOnline(true);
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      if (conn.effectiveType) {
        setEffectiveType(conn.effectiveType);
      }
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const ping = Date.now() - start;
        setRtt(ping);
        if (ping < 200 && effectiveType !== '2g') {
          setNetworkQuality('excellent');
        } else if (ping < 500 && effectiveType !== '2g') {
          setNetworkQuality('moderate');
        } else {
          setNetworkQuality('slow');
        }
      } else {
        setNetworkQuality('slow');
      }
    } catch (e) {
      // If ping fails or times out, consider connection slow or offline
      if (!navigator.onLine) {
        setNetworkQuality('offline');
      } else {
        setNetworkQuality('slow');
      }
    }
  };

  useEffect(() => {
    checkConnection();

    const handleOnline = () => {
      setIsOnline(true);
      checkConnection();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkQuality('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(checkConnection, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Auto-show recommendation popup if speed is slow and user is not in 'list' mode
  useEffect(() => {
    if ((networkQuality === 'slow' || networkQuality === 'offline') && currentViewMode !== 'list' && !dismissedPrompt) {
      setShowTooltip(true);
    }
  }, [networkQuality, currentViewMode, dismissedPrompt]);

  const getStatusBadge = () => {
    switch (networkQuality) {
      case 'excellent':
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
          dot: "bg-emerald-500",
          icon: Wifi,
          label: rtt ? `${rtt}ms` : "سرعت عالی",
          desc: "اتصال پرسرعت"
        };
      case 'moderate':
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200",
          dot: "bg-amber-500",
          icon: Signal,
          label: rtt ? `${rtt}ms` : "سرعت متوسط",
          desc: "اتصال معمول"
        };
      case 'slow':
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200 animate-pulse",
          dot: "bg-rose-500",
          icon: ShieldAlert,
          label: "اینترنت ضعیف",
          desc: "کندی سرعت شبکه"
        };
      case 'offline':
      default:
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-300",
          dot: "bg-slate-500",
          icon: WifiOff,
          label: "آفلاین (کش)",
          desc: "ارتباط قطع است"
        };
    }
  };

  const badge = getStatusBadge();
  const IconComp = badge.icon;

  return (
    <div className="relative inline-block text-right select-none">
      {/* Trigger Button inside catalog toolbar */}
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className={`h-10 px-2.5 sm:px-3 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-3xs ${badge.bg}`}
        title={`وضعیت شبکه: ${badge.desc} (${badge.label})`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
        <IconComp size={13} />
        <span className="hidden sm:inline font-mono">{badge.label}</span>
        <span className="sm:hidden text-[10px]">{networkQuality === 'slow' ? 'ضعیف' : badge.label}</span>
      </button>

      {/* Popover Card for Network Quality & Low-Data Mode Recommendation */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 sm:right-auto top-12 z-[120] w-72 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 space-y-3 text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${badge.bg}`}>
                  <IconComp size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">پایش وضعیت ارتباط</h4>
                  <p className="text-[10px] font-bold text-slate-500">کیفیت لحظه‌ای اتصال به شبکه</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTooltip(false);
                  setDismissedPrompt(true);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Network Metrics */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 space-y-1 text-xs">
              <div className="flex justify-between items-center font-bold">
                <span className="text-slate-600">وضعیت اتصال:</span>
                <span className={`font-black ${isOnline ? "text-emerald-700" : "text-rose-600"}`}>
                  {isOnline ? "وصل به شبکه" : "قطع ارتباط (آفلاین)"}
                </span>
              </div>
              {rtt !== null && (
                <div className="flex justify-between items-center font-bold text-[11px]">
                  <span className="text-slate-500">تاخیر سرور (Ping):</span>
                  <span className="font-mono text-slate-800">{rtt} میلی‌ثانیه</span>
                </div>
              )}
            </div>

            {/* Smart Recommendation for Low-Speed / Offline */}
            {(networkQuality === 'slow' || networkQuality === 'offline' || currentViewMode !== 'list') && (
              <div className="p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-start gap-2">
                  <Zap size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold leading-relaxed">
                    {networkQuality === 'slow' || networkQuality === 'offline'
                      ? "به علت کندی سرعت شبکه، پیشنهاد می‌شود کاتالوگ را به حالت «خرید سریع / لیست کم‌حجم» تغییر دهید تا محصولات فوراً لود شوند."
                      : "جهت صرفه‌جویی در مصرف اینترنت و لود آنی، حالت «خرید سریع» پیشنهاد می‌شود."}
                  </p>
                </div>

                {currentViewMode !== 'list' ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchToListMode();
                      setShowTooltip(false);
                      setDismissedPrompt(true);
                    }}
                    className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Zap size={14} />
                    <span>سوییچ به حالت لیست کم‌حجم (لود آنی)</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-800 bg-emerald-100/80 px-2.5 py-1.5 rounded-lg border border-emerald-300/60">
                    <CheckCircle2 size={14} className="text-emerald-700" />
                    <span>حالت کم‌حجم فعال است (حداکثر سرعت)</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
