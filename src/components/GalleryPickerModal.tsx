import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Image as ImageIcon, Check, Loader2, RefreshCw, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GalleryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  initialPublicUrl?: string;
}

export const GalleryPickerModal: React.FC<GalleryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "انتخاب فایل از گالری پارس‌پک",
  initialPublicUrl
}) => {
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Use the provided public URL, or fallback to the standard one
  const publicUrl = initialPublicUrl || localStorage.getItem("dastavval_storage_public_url") || "https://c102393.parspack.net/c102393";

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/storage/files");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          setFiles(data.files);
        }
      }
    } catch (e) {
      console.error("Error fetching gallery files:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
      setSelectedFile(null);
    }
  }, [isOpen]);

  const filteredFiles = useMemo(() => {
    return files.filter(f => 
      f.Key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const isImage = (key: string) => {
    const ext = key.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext || '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">{title}</h3>
              <p className="text-[10px] text-slate-500 font-bold">نمایش فایل‌های آپلود شده روی باکت پارس‌پک</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all cursor-pointer">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white">
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="جستجو در نام فایل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-emerald-600 transition-all text-right"
              dir="ltr"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchFiles}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer text-slate-600"
              title="بروزرسانی"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
          {isLoading && files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 size={40} className="text-emerald-600 animate-spin" />
              <p className="text-xs font-bold text-slate-500">در حال فراخوانی فایل‌ها از باکت...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-3 opacity-60">
              <ImageIcon size={48} className="text-slate-300" />
              <p className="text-xs font-bold text-slate-400">فایلی یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredFiles.map((file, idx) => {
                const fileUrl = `${publicUrl}/${file.Key}`;
                const isImg = isImage(file.Key);
                const isSelected = selectedFile === fileUrl;

                return (
                  <button
                    key={`gallery-item-${idx}`}
                    onClick={() => setSelectedFile(fileUrl)}
                    className={`relative aspect-square rounded-2xl border-2 transition-all overflow-hidden group cursor-pointer ${
                      isSelected 
                        ? "border-emerald-600 ring-4 ring-emerald-500/10 shadow-lg" 
                        : "border-slate-200 bg-white hover:border-emerald-400"
                    }`}
                  >
                    {isImg ? (
                      <img 
                        src={fileUrl} 
                        alt={file.Key}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-slate-100 text-slate-400">
                        <FileText size={32} />
                        <span className="text-[9px] mt-1 font-mono break-all">{file.Key.split('.').pop()}</span>
                      </div>
                    )}
                    
                    {/* Selection Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-600/20 flex items-center justify-center">
                        <div className="bg-emerald-600 text-white p-1 rounded-full shadow-lg">
                          <Check size={16} />
                        </div>
                      </div>
                    )}

                    {/* Label Overlay */}
                    <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 backdrop-blur-sm p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white font-mono truncate text-center" dir="ltr">{file.Key}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black transition-all cursor-pointer"
          >
            انصراف
          </button>
          <button
            onClick={() => selectedFile && onSelect(selectedFile)}
            disabled={!selectedFile}
            className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
          >
            <Check size={16} />
            تایید و انتخاب نهایی
          </button>
        </div>
      </motion.div>
    </div>
  );
};
