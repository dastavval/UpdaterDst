import React, { useState, useRef } from "react";
import {
  Share2,
  Copy,
  Check,
  Smartphone,
  Send,
  Download,
  X,
  Award,
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  QrCode,
  Calendar,
  Sparkles,
  ExternalLink,
  Layers,
  FileCheck
} from "lucide-react";
import { toPng, toJpeg } from "html-to-image";
import { toPersianDigits } from "../lib/pricing";

export interface RepresentativeShareLicenseModalProps {
  rep: any;
  isOpen: boolean;
  onClose: () => void;
  b2bConfig?: any;
}

export const generateRepresentativeShareText = (rep: any, b2bConfig?: any) => {
  const appName = b2bConfig?.appName || "سامانه سراسری دست اول";
  const repName = rep?.fullName || rep?.name || "همکار گرامی";
  const companyName = rep?.companyName || rep?.company || "مجموعه بازرگانی و پخش";
  const province = rep?.province || "ایران";
  const city = rep?.city || province;
  const agencyCode = rep?.agencyCode || rep?.code || rep?.id || "AGN-1405-001";
  const phone = rep?.phone || rep?.mobile || "ثبت شده در سامانه";
  const badge = rep?.badge || "نماینده رسمی و مجاز";
  const tierLabel = rep?.tierLabel || "سطح توزیع کشوری";
  const address = rep?.address || `دفتر مرکزی ${city}`;
  
  let brandsText = "کلیه برندهای تایید شده سبد کالای کارخانجات";
  if (rep?.brands && Array.isArray(rep.brands) && rep.brands.length > 0) {
    brandsText = rep.brands.map((b: string) => `▫️ ${b}`).join("  ");
  }

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://dastavval.ir";
  const verifyUrl = `${originUrl}/?repCode=${encodeURIComponent(agencyCode)}`;

  return `🏛️ *پروانه عاملیت و نمایندگی رسمی توزیع سراسری* 🏛️
═══════════════════════════
📜 *${appName} (شبکه یکپارچه توزیع مستقیم کارخانجات)*

👤 *نام نماینده / مدیر:* ${repName}
🏢 *نام مجموعه / شرکت:* ${companyName}
📍 *محدوده جغرافیایی عاملیت:* استان ${province} - شهر ${city}
🎖️ *رتبه و نشان سازمانی:* ${badge} (${tierLabel})
🔢 *کد شناسه یکتای عاملیت:* \`${agencyCode}\`
📞 *شماره تماس مستقیم:* ${phone}
🏢 *آدرس دفتر / انبار:* ${address}

📦 *برندهای مجاز تحت عاملیت:*
${brandsText}

✅ *وضعیت اعتبار حقوقی:* دارای تاییدیه رسمی و سهمیه مستقیم از خطوط تولید کارخانجات کشور
📅 *تاریخ صدور و اعتبار:* معتبر تا پایان سال ۱۴۰۶
═══════════════════════════
🌐 *استعلام اصالت پروانه و ثبت سفارش کالا:*
${verifyUrl}`;
};

export default function RepresentativeShareLicenseModal({
  rep,
  isOpen,
  onClose,
  b2bConfig
}: RepresentativeShareLicenseModalProps) {
  const [copiedText, setCopiedText] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !rep) return null;

  const appName = b2bConfig?.appName || "سامانه سراسری دست اول";
  const repName = rep?.fullName || rep?.name || "همکار گرامی";
  const companyName = rep?.companyName || rep?.company || "مجموعه بازرگانی و پخش";
  const province = rep?.province || "تهران";
  const city = rep?.city || province;
  const agencyCode = rep?.agencyCode || rep?.code || rep?.id || "AGN-1405-2041";
  const phone = rep?.phone || rep?.mobile || "۰۹۱۲۰۰۰۰۰۰۰";
  const badge = rep?.badge || "نماینده رسمی و انحصاری";
  const tierLabel = rep?.tierLabel || "سطح توزیع کشوری";
  const address = rep?.address || `دفتر مرکزی استان ${province}، شهرستان ${city}`;
  
  const brandsList: string[] = rep?.brands && Array.isArray(rep.brands) && rep.brands.length > 0 
    ? rep.brands 
    : ["چی‌توز", "کاله", "تبرک", "طبیعت", "میهن"];

  const shareText = generateRepresentativeShareText(rep, b2bConfig);
  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://dastavval.ir";
  const verifyUrl = `${originUrl}/?repCode=${encodeURIComponent(agencyCode)}`;

  const handleCopyFormattedText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleShareToWhatsApp = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  };

  const handleShareToTelegram = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(verifyUrl)}&text=${encoded}`, "_blank");
  };

  const handleDownloadCardImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExportingImage(true);
      await new Promise((res) => setTimeout(res, 100));

      const imgData = await toPng(cardRef.current, {
        pixelRatio: 2.5,
        backgroundColor: "#0f172a",
        cacheBust: true
      });

      const link = document.createElement("a");
      link.href = imgData;
      link.download = `پروانه_عاملیت_${agencyCode}_${repName.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error exporting graphic card image:", err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleCopyCardImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExportingImage(true);
      await new Promise((res) => setTimeout(res, 100));

      const blob = await new Promise<Blob | null>((resolve) => {
        if (!cardRef.current) return resolve(null);
        toPng(cardRef.current, { pixelRatio: 2, backgroundColor: "#0f172a" }).then((dataUrl) => {
          fetch(dataUrl).then(res => res.blob()).then(resolve);
        });
      });

      if (blob && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ "image/png": blob })
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3000);
      } else {
        handleDownloadCardImage();
      }
    } catch (err) {
      console.error("Error copying graphic card image to clipboard:", err);
      handleDownloadCardImage();
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden text-right" dir="rtl">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 p-0.5 shadow-lg shadow-teal-500/30 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                <Share2 size={22} className="text-teal-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  اشتراک‌گذاری پروانه عاملیت و مشخصات نماینده
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  قالب شبکه‌های اجتماعی
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                تولید محتوای رسمی و کادربندی شده مناسب تلگرام، واتساپ، ایتا، بله و استوری اینستاگرام
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs bg-slate-50/50">
          
          {/* Action Hub Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Copy Formatted Text */}
            <button
              type="button"
              onClick={handleCopyFormattedText}
              className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95 ${
                copiedText
                  ? "bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400"
                  : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200"
              }`}
            >
              {copiedText ? (
                <>
                  <Check size={18} className="text-white" />
                  <span>متن رسمی کپی شد!</span>
                </>
              ) : (
                <>
                  <Copy size={18} className="text-teal-600" />
                  <span>📋 کپی متن رسمی تلگرام و واتساپ</span>
                </>
              )}
            </button>

            {/* Direct WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareToWhatsApp}
              className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center justify-center gap-2.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Smartphone size={18} />
              <span>📱 ارسال مستقیم به واتساپ (WhatsApp)</span>
            </button>

            {/* Direct Telegram Share */}
            <button
              type="button"
              onClick={handleShareToTelegram}
              className="p-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black flex items-center justify-center gap-2.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Send size={18} />
              <span>✈️ ارسال به تلگرام (Telegram)</span>
            </button>
          </div>

          {/* Grid Layout: Visual Card Preview & Raw Text Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            
            {/* Left Column: Premium Graphic License Card (Exportable to Image) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <Award size={16} className="text-teal-600" />
                  <span>پیش‌نمایش کارت پروانه گرافیکی (Graphic Card)</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isExportingImage}
                    onClick={handleCopyCardImage}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] flex items-center gap-1 border border-teal-200 cursor-pointer"
                    title="کپی تصویر کارت به حافظه"
                  >
                    {copiedImage ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedImage ? "تصویر کپی شد" : "کپی تصویر"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isExportingImage}
                    onClick={handleDownloadCardImage}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Download size={13} />
                    <span>{isExportingImage ? "در حال آماده‌سازی..." : "دانلود عکس PNG"}</span>
                  </button>
                </div>
              </div>

              {/* Graphic Card Element */}
              <div
                ref={cardRef}
                className="w-full bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 text-white p-6 sm:p-7 rounded-3xl border-2 border-amber-500/40 shadow-2xl relative overflow-hidden space-y-5"
              >
                {/* Gold Glow Accents */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
                
                {/* Decorative Top Border */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-teal-400 to-amber-500" />

                {/* Card Header */}
                <div className="flex items-start justify-between border-b border-white/10 pb-4 relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-black text-amber-400 tracking-wider uppercase">
                        گواهی اعطای عاملیت توزیع سراسری
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-black text-white">{appName}</h4>
                    <p className="text-[10px] text-slate-300 font-medium">شبکه ملی اتصال مستقیم خریداران به کارخانجات کشور</p>
                  </div>

                  <div className="text-left font-mono">
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[11px] font-black">
                      {agencyCode}
                    </div>
                    <span className="text-[9px] text-slate-400 block mt-1">شناسه یکتای ملی</span>
                  </div>
                </div>

                {/* Card Content Details */}
                <div className="space-y-3 relative z-10">
                  <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <Building2 size={14} className="text-teal-400" />
                        <span>نام مجموعه / شرکت:</span>
                      </span>
                      <span className="font-black text-white">{companyName}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <Award size={14} className="text-amber-400" />
                        <span>مدیر دفتر نمایندگی:</span>
                      </span>
                      <span className="font-black text-amber-300 text-sm">{repName}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <MapPin size={14} className="text-emerald-400" />
                        <span>محدوده تحت پوشش:</span>
                      </span>
                      <span className="font-bold text-slate-200">استان {province} - شهر {city}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold flex items-center gap-1.5">
                        <Phone size={14} className="text-sky-400" />
                        <span>شماره تماس هماهنگی:</span>
                      </span>
                      <span className="font-mono font-bold text-slate-200">{phone}</span>
                    </div>
                  </div>

                  {/* Brands List Tags */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-300 font-bold block">برندهای مجاز و تحت پوشش عاملیت:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {brandsList.map((brand, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-lg bg-teal-500/20 border border-teal-400/30 text-teal-200 text-[10px] font-black"
                        >
                          ✓ {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Official Badge & Verification */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between relative z-10 text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-black">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <span className="font-black text-amber-300 block">{badge}</span>
                      <span className="text-slate-400">دارای تاییدیه صیانت بازار و اصالت کالا</span>
                    </div>
                  </div>

                  <div className="text-left font-mono text-slate-400 text-[9px]">
                    <div>اعتبار: ۱۴۰۶/۱۲/۲۹</div>
                    <div className="text-teal-300 font-bold">dastavval.ir</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Copyable Text Container */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900 text-xs flex items-center gap-1.5">
                  <FileCheck size={16} className="text-teal-600" />
                  <span>متن بهینه‌سازی شده برای ارسال در پیام‌رسان‌ها</span>
                </span>
                
                <span className="text-[11px] text-slate-400 font-mono">
                  {shareText.length} کاراکتر
                </span>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  rows={14}
                  value={shareText}
                  className="w-full p-4 bg-white rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed focus:outline-none select-all shadow-xs"
                />

                <button
                  type="button"
                  onClick={handleCopyFormattedText}
                  className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-black flex items-center gap-1 shadow-md shadow-teal-600/20 transition-all cursor-pointer active:scale-95"
                >
                  {copiedText ? (
                    <>
                      <Check size={14} />
                      <span>کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>کپی متن</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
                <div className="font-black text-teal-950 flex items-center gap-2 text-xs">
                  <Sparkles size={15} className="text-teal-700" />
                  <span>نکات انتشار پروانه عاملیت در گروه‌ها و کانال‌ها:</span>
                </div>
                <ul className="text-[11px] text-teal-900 space-y-1 list-disc list-inside font-medium leading-relaxed">
                  <li>متن کپی شده با علامت‌های ستاره و بولت، در تلگرام و واتساپ به صورت ضخیم (Bold) و خوانا نمایش داده می‌شود.</li>
                  <li>مشتریان با کلیک بر روی لینک استعلام، وارد صفحه تایید هویت و سبد محصولات این نماینده خواهند شد.</li>
                  <li>می‌توانید عکس خروجی PNG را به همراه متن بالا به عنوان کپشن در کانال‌های صنفی منتشر کنید.</li>
                </ul>
              </div>

            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            پروانه الکترونیک عاملیت • سامانه یکپارچه کشوری دست اول
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
}
