import React, { useState } from "react";
import { Printer, X, Download, Loader2, Award, ShieldCheck, Check } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { runWithOklchPolyfill, cleanClonedDocForPdf } from "../utils/pdfPolyfill";

interface RepresentativeCertificateViewProps {
  repName: string;
  companyName: string;
  city: string;
  agencyCode: string;
  badge?: string;
  onClose: () => void;
  b2bConfig?: any;
}

const toPersianNum = (num: number | string) => {
  if (num === undefined || num === null) return "";
  const persian = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
  };
  return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
};

export default function RepresentativeCertificateView({
  repName,
  companyName,
  city,
  agencyCode,
  badge = "نماینده انحصاری توزیع",
  onClose,
  b2bConfig
}: RepresentativeCertificateViewProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const appName = b2bConfig?.appName || "سامانه سراسری دست اول";
  const logoUrl = b2bConfig?.logoUrl;
  const issueDate = "۱۴۰۵/۰۵/۱۷";
  const expireDate = "۱۴۰۶/۰۵/۱۷";

  const handleDownloadPdf = async () => {
    const certElem = document.getElementById("printable-certificate");
    if (!certElem) return;

    try {
      setIsDownloading(true);

      // Yield execution to allow UI loading spinner to render smoothly
      await new Promise((resolve) => setTimeout(resolve, 60));

      const downloadPromise = runWithOklchPolyfill(async () => {
        const canvas = await html2canvas(certElem, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          allowTaint: false,
          onclone: (clonedDoc: Document) => {
            cleanClonedDocForPdf(clonedDoc);
          }
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4"
        });

        const pdfWidth = 297;
        const pdfHeight = 210;
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, Math.min(imgHeight, pdfHeight));
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        const pdfOutput = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfOutput);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `حکم_نمایندگی_رسمی_${agencyCode}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      });

      // 3.5-second safety timeout race
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3500));
      await Promise.race([downloadPromise, timeoutPromise]);
    } catch (error) {
      console.warn("PDF generation timeout or error, falling back to print window:", error);
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const certElem = document.getElementById("printable-certificate");
    if (!certElem) {
      window.print();
      return;
    }

    const printContent = certElem.innerHTML;
    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8">
        <title>حکم_نمایندگی_${agencyCode}</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/Vazirmatn-font-face.css">
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: 'Vazirmatn', Tahoma, sans-serif; 
            padding: 0; 
            margin: 0; 
            background: #ffffff; 
            color: #1e293b; 
            direction: rtl; 
            text-align: right; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          @media print {
            @page { size: A4 landscape; margin: 4mm; }
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; height: 100vh; overflow: hidden; display: flex; align-items: center; justify-content: center;">
          ${printContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 250);
          };
        </script>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      } catch (e) {
        // ignore
      }
    }, 5000);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-print">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[96vh] font-sans text-right border border-slate-200">
        
        {/* Top bar (Hidden when printing) */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2.5rem] no-print">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-600/20 hover:bg-amber-700 disabled:opacity-70 transition-all cursor-pointer"
            >
              {isDownloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>{isDownloading ? 'در حال صدور PDF...' : 'دانلود فایل گواهی رسمی (PDF)'}</span>
            </button>
            <button 
              onClick={handlePrint}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Printer size={16} />
              چاپ مستقیم گواهی اعطای نمایندگی
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 font-black animate-fade-in">
              ✓ سند رسمی و دارای تاییدیه کارگزاری دست اول کشور
            </span>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200/60 rounded-full transition-all text-slate-500 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Landscape Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex items-center justify-center">
          
          <div 
            id="printable-certificate"
            className="w-full max-w-[297mm] aspect-[1.414/1] bg-white relative p-12 sm:p-16 border-[16px] border-amber-800 shadow-xl overflow-hidden flex flex-col justify-between"
            style={{ 
              boxSizing: "border-box",
              backgroundImage: "radial-gradient(#fdfbf7 1.5px, transparent 1.5px), radial-gradient(#fdfbf7 1.5px, #faf7f2 1.5px)",
              backgroundSize: "40px 40px",
              backgroundPosition: "0 0, 20px 20px"
            }}
          >
            {/* Ornate Inner Border Line */}
            <div className="absolute inset-2 border-[2px] border-double border-amber-600 rounded" style={{ pointerEvents: "none" }} />
            {/* Corner Ornate Accents */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-600 rounded-tl" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-600 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-600 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-600 rounded-br" />

            {/* Background Emblem Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]" style={{ pointerEvents: "none" }}>
              <Award size={400} className="text-amber-900" />
            </div>

            {/* Top metadata header */}
            <div className="flex justify-between items-start border-b border-amber-100 pb-4 relative z-10 text-xs text-amber-950 font-black">
              <div className="text-right space-y-1">
                <div>تاریخ صدور: <span className="font-mono">{toPersianNum(issueDate)}</span></div>
                <div>کد نمایندگی: <span className="font-mono text-indigo-700 font-black tracking-wider">{toPersianNum(agencyCode)}</span></div>
                <div>تاییدیه اصالت: <span className="text-emerald-700 font-black">معتبر و فعال</span></div>
              </div>

              {/* Central Top Emblem */}
              <div className="text-center">
                <div className="text-[10px] text-slate-400 font-normal tracking-[0.2em] mb-1">گواهی فعالیت</div>
                <h2 className="text-base font-black text-amber-900 tracking-wider">پلتفرم مستقل دست اول</h2>
                <p className="text-[9px] text-slate-400 font-bold">بستر هوشمند توزیع مستقیم کالا و خطوط تولید کارخانجات</p>
              </div>

              <div className="text-left space-y-1">
                <div>مدت اعتبار: <span className="font-mono">{toPersianNum(expireDate)}</span></div>
                <div>پیوست: <span className="font-mono">دارد</span></div>
                <div>بایگانی: <span className="font-mono">۱۴۰۵/ب/۹۲</span></div>
              </div>
            </div>

            {/* Main content body */}
            <div className="text-center space-y-6 sm:space-y-8 my-6 relative z-10">
              
              {/* App logo & name */}
              <div className="flex justify-center items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain mix-blend-multiply" />
                ) : (
                  <div className="w-12 h-12 bg-amber-900 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-inner">
                    د
                  </div>
                )}
                <div className="text-right">
                  <h3 className="text-base font-black text-slate-800 tracking-tight">{appName}</h3>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">زنجیره توزیع امن و مستقیم کارخانجات کشور</span>
                </div>
              </div>

              {/* Title of Certificate */}
              <div className="space-y-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-amber-900 tracking-wide font-sans pb-1.5 inline-block border-b-2 border-double border-amber-600 px-12">
                  گواهی‌نامه رسمی اعطای نمایندگی انحصاری توزیع
                </h1>
                <p className="text-[10px] sm:text-xs text-amber-800 font-black block mt-2 tracking-wide uppercase">
                  حکم رسمی ابلاغ نمایندگی کل توزیع استانی و توزیع‌کننده معتمد بنکداری
                </p>
              </div>

              {/* Certificate content text - fully descriptive, professional and authentic */}
              <div className="max-w-3xl mx-auto text-xs sm:text-sm text-slate-800 leading-loose text-center font-semibold px-4 space-y-4">
                <p>
                  بدین‌وسیله و به موجب این حکم رسمی، همکار گرامی جناب آقای / سرکار خانم <strong className="text-amber-900 text-sm sm:text-base font-black border-b border-amber-600 pb-0.5 px-2">{repName}</strong> مدیریت محترم مجموعه تجاری و پخش بازرگانی <strong className="text-slate-900 text-sm sm:text-base font-black border-b border-amber-600 pb-0.5 px-2">{companyName}</strong> پس از احراز شایستگی تجاری، تامین امکانات لجستیکی، انبارداری و تایید مراجع نظارتی پلتفرم دست اول کشور، به سمت:
                </p>
                <p className="py-2.5">
                  <strong className="text-base sm:text-lg text-emerald-800 font-black bg-emerald-50 border border-emerald-150 px-8 py-2 rounded-2xl tracking-wide shadow-sm">
                    « {badge} در منطقه رسمی {city} »
                  </strong>
                </p>
                <p>
                  منصوب و معرفی می‌گردند. طبق ضوابط، تمامی کارخانجات همکار و تامین‌کنندگان زنجیره تامین دست اول موظف به تامین سهمیه درخواستی این دفتر در خطوط تولید خود بوده و کلیه خریداران محلی و بنکداران آن منطقه جهت هماهنگی ترانزیت ترجیحی بار به این مدیریت ارجاع داده می‌شوند. امید است با همت جهادی در راستای تعدیل قیمت‌ها گام بردارید.
                </p>
              </div>
            </div>

            {/* Bottom layout containing seals, signatures, QR verification and stickers */}
            <div className="flex justify-between items-end relative z-10 pt-4 border-t border-amber-100">
              
              {/* Left Side: Verification QR Code simulation & details */}
              <div className="flex items-center gap-4 text-right">
                <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-inner">
                  {/* Beautiful mock QR code representation */}
                  <div className="w-14 h-14 bg-slate-100 flex flex-col items-center justify-center p-1 border border-dashed border-slate-300">
                    <div className="grid grid-cols-4 gap-0.5 w-11 h-11">
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-200 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-200 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-200 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-200 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                      <div className="bg-slate-200 rounded-sm"></div>
                      <div className="bg-slate-900 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold space-y-1">
                  <div>شناسه اصالت گواهینامه:</div>
                  <div className="font-mono text-slate-900 font-black">{toPersianNum(agencyCode)}</div>
                  <div className="text-[8.5px] text-emerald-700 flex items-center gap-0.5">
                    <ShieldCheck size={10} />
                    <span>تایید اصالت آنلاین در سامانه مرکزی</span>
                  </div>
                </div>
              </div>

              {/* Center: Golden seal sticker graphic */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-lg relative border-2 border-double border-white rotate-[-6deg]">
                  <div className="absolute inset-0.5 rounded-full border border-dashed border-amber-900/40" />
                  <Award className="text-white drop-shadow" size={28} />
                </div>
                <span className="text-[8px] text-amber-800 font-black mt-1">تاییدیه تضمین کیفیت لجستیک</span>
              </div>

              {/* Right Side: Authority stamp and signature */}
              <div className="text-center space-y-1 w-52">
                <span className="text-[10px] font-black text-slate-600 block">مهر و امضای رییس هیات‌مدیره پلتفرم</span>
                <span className="text-[9px] text-slate-400 block font-bold">سازمان توزیع کشوری صنایع غذایی دست اول</span>
                
                {/* Visual signature/seal */}
                <div className="h-16 relative flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-4 border-double border-indigo-600 flex flex-col items-center justify-center text-[7px] text-indigo-600 font-black rotate-[-12deg] p-0.5 bg-white shadow-inner absolute translate-x-2 translate-y-[-10px] opacity-80 mix-blend-multiply">
                    <span className="border-b border-indigo-600 tracking-wider font-mono text-[6px]">DAST AVVAL</span>
                    <span>شرکت توسعه بازرگانی</span>
                    <span className="text-[5px] text-slate-400 font-mono font-bold">REG: 88492</span>
                  </div>
                  <div className="font-mono text-xs italic text-indigo-700 tracking-wider rotate-[-5deg] font-black z-10 translate-y-[-4px]">
                    Alireza Rezayi
                  </div>
                </div>
              </div>

            </div>

            {/* Official tiny footer note */}
            <div className="text-center text-[8px] text-slate-400 font-bold border-t border-slate-100 pt-3 mt-4 relative z-10">
              این گواهی‌نامه رسمی از زمان صدور به مدت یک‌سال کامل خورشیدی معتبر بوده و انحصار پخش جغرافیایی نماینده تحت حمایت بیمه و صندوق تضمین دست اول کشور قرار دارد.
            </div>

          </div>
        </div>
      </div>

      {/* Embedded print styles for Landscape A4 rendering */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #printable-certificate { 
            width: 100% !important; 
            height: 100vh !important; 
            box-shadow: none !important; 
            border: 12px solid #92400e !important; 
            padding: 20px !important; 
            margin: 0 !important;
          }
          @page { 
            size: A4 landscape; 
            margin: 0; 
          }
        }
      `}} />
    </div>
  );
}
