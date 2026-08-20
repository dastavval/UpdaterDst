import React, { useState, useRef } from "react";
import { 
  Image as ImageIcon, 
  CheckCircle2, 
  Trash2, 
  Loader2, 
  Camera,
  FolderOpen,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { uploadToParsPackStorage, formatBytes, ParsPackUploadResult } from "../utils/storage";

interface ParsPackImageUploaderProps {
  label: string;
  subLabel?: string;
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  aspectRatio?: "square" | "video" | "banner" | "logo";
  required?: boolean;
  className?: string;
}

export default function ParsPackImageUploader({
  label,
  subLabel,
  value,
  onChange,
  folder = "products",
  aspectRatio = "square",
  required = false,
  className = ""
}: ParsPackImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith("image/") && !file.name.endsWith(".svg") && !file.name.endsWith(".webp")) {
      setErrorMessage("لطفاً یک فایل تصویری معتبر (عکس JPG، PNG یا WEBP) انتخاب فرمایید.");
      return;
    }

    // Validate size (up to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("حجم عکس نباید بیش از ۲۰ مگابایت باشد.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(25);

    const progressTimer = setInterval(() => {
      setUploadProgress(prev => (prev < 90 ? prev + 15 : prev));
    }, 120);

    try {
      const result: ParsPackUploadResult = await uploadToParsPackStorage(file, folder);
      clearInterval(progressTimer);
      setUploadProgress(100);

      if (result.success && (result.url || result.proxyUrl)) {
        const finalUrl = result.proxyUrl || result.url || "";
        onChange(finalUrl);
      } else {
        setErrorMessage(result.error || "خطا در بارگذاری تصویر");
      }
    } catch (err: any) {
      clearInterval(progressTimer);
      setErrorMessage("خطا در ارسال تصویر: " + (err.message || err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getAspectStyle = () => {
    switch (aspectRatio) {
      case "video":
        return "aspect-video max-w-md";
      case "banner":
        return "aspect-[21/9] max-w-lg min-h-[120px]";
      case "logo":
        return "aspect-square w-28 h-28 mx-auto";
      case "square":
      default:
        return "aspect-square w-36 h-36";
    }
  };

  return (
    <div className={`space-y-1.5 text-right font-sans ${className}`} dir="rtl">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-slate-800 flex items-center gap-1">
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>
        {subLabel && <span className="text-[10px] text-slate-400 font-bold">{subLabel}</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.webp,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {value ? (
        /* Image Preview with easy change/delete */
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className={`relative ${getAspectStyle()} rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group`}>
            <img
              src={value}
              alt={label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600";
              }}
            />
            <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
              <CheckCircle2 size={13} />
            </div>
          </div>

          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-black">
              <CheckCircle2 size={15} />
              <span>عکس با موفقیت بارگذاری شد</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
              {value}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>تغییر عکس از گالری</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>حذف</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Clean and Simple Upload Trigger Button & Dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-indigo-600 bg-indigo-50/80 scale-[0.99]"
              : "border-slate-300 bg-white hover:bg-indigo-50/20 hover:border-indigo-400 shadow-2xs"
          } ${isUploading ? "pointer-events-none opacity-90" : ""}`}
        >
          {isUploading ? (
            <div className="space-y-2 py-2 w-full max-w-xs text-center">
              <Loader2 size={24} className="animate-spin text-indigo-600 mx-auto" />
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-black text-indigo-950">
                  <span>در حال بارگذاری در فضای ابری...</span>
                  <span>{uploadProgress}٪</span>
                </div>
                <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-1 text-center sm:text-right w-full">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Camera size={20} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black text-slate-800">
                  برای <span className="text-indigo-600 underline underline-offset-2">انتخاب عکس از گالری یا دستگاه</span> کلیک کنید
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  پشتیبانی از فرمت‌های تصویری JPG، PNG و WEBP (آپلود آنی و خودکار)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 text-rose-700 p-2.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border border-rose-200">
          <AlertCircle size={14} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
