import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Zap, ShieldAlert, CheckCircle2, RefreshCw, Signal, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NetworkStatusWidgetProps {
  currentViewMode: 'list' | 'grid' | 'table' | 'high_margin' | string;
  onSwitchToListMode: () => void;
  onUpgradeToFullMode?: () => void;
}

export default function NetworkStatusWidget({
  currentViewMode,
  onSwitchToListMode,
  onUpgradeToFullMode
}: NetworkStatusWidgetProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [rtt, setRtt] = useState<number | null>(null);
  const [effectiveType, setEffectiveType] = useState<string>("4g");
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'moderate' | 'slow' | 'offline'>('excellent');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [dismissedPrompt, setDismissedPrompt] = useState<boolean>(false);
  const [hasAutoUpgraded, setHasAutoUpgraded] = useState<boolean>(false);

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

  const getStatusBadge = () => {
    switch (networkQuality) {
      case 'excellent':
        return {
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100",
          dot: "bg-emerald-500",
          icon: Wifi,
          label: rtt ? `${rtt}ms (سرعت عالی)` : "سرعت عالی",
          desc: "اتصال پرسرعت - ارتقای خودکار نمای گرافیکی"
        };
      case 'moderate':
        return {
          bg: "bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100",
          dot: "bg-amber-500",
          icon: Signal,
          label: rtt ? `${rtt}ms (سرعت معمولی)` : "سرعت معمولی",
          desc: "اتصال متوسط"
        };
      case 'slow':
        return {
          bg: "bg-rose-50 text-rose-800 border-rose-200/80 animate-pulse hover:bg-rose-100",
          dot: "bg-rose-500",
          icon: ShieldAlert,
          label: "نت ضعیف (حالت کم‌حجم)",
          desc: "کندی سرعت - فعال‌سازی خودکار حالت کم‌حجم"
        };
      case 'offline':
      default:
        return {
          bg: "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200",
          dot: "bg-slate-500",
          icon: WifiOff,
          label: "آفلاین (حالت کم‌حجم)",
          desc: "ارتباط قطع است"
        };
    }
  };

  const badge = getStatusBadge();
  const IconComp = badge.icon;

  return (
    <div className="relative inline-block text-right select-none">
      {/* Trigger Button in Footer */}
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        className={`h-8 px-3 rounded-full border text-[10px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${badge.bg}`}
        title={`وضعیت شبکه: ${badge.desc} (${badge.label})`}
      >
        <span className={`w-2 h-2 rounded-full ${badge.dot} animate-pulse`} />
        <IconComp size={12} />
        <span>کیفیت اتصال:</span>
        <span className="font-mono font-black">{badge.label}</span>
      </button>

      {/* Popover Card for Network Quality & Upgrade / Low-Data Info */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-10 right-0 z-[120] w-72 bg-white rounded-2xl p-4 shadow-2xl border border-slate-200/90 space-y-3 text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${badge.bg}`}>
                  <IconComp size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">پایش هوشمند سرعت شبکه</h4>
                  <p className="text-[10px] font-bold text-slate-500">کنترل خودکار حجم و سرعت کاتالوگ</p>
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
                <span className="text-slate-600">وضعیت ارتباط:</span>
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

            {/* Smart Actions & Recommendations */}
            <div className="space-y-2">
              {networkQuality === 'excellent' && onUpgradeToFullMode && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 text-[11px] font-bold space-y-2">
                  <p>کیفیت شبکه شما فوق‌العاده است. کاتالوگ به نمایش گرید پویا ارتقا یافته است.</p>
                  {currentViewMode !== 'grid' && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpgradeToFullMode();
                        setShowTooltip(false);
                      }}
                      className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>تغییر به نمایش گرید (تصویری)</span>
                    </button>
                  )}
                </div>
              )}

              {(networkQuality === 'slow' || networkQuality === 'offline') && (
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 text-[11px] font-bold space-y-2">
                  <p>سرعت شبکه پایین است. حالت «لیست کم‌حجم» جهت بارگذاری آنی فعال گردید.</p>
                  {currentViewMode !== 'list' && (
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchToListMode();
                        setShowTooltip(false);
                      }}
                      className="w-full py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Zap size={13} />
                      <span>سوییچ به حالت کم‌حجم (لود فوری)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
