import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Check, 
  X, 
  Sparkles, 
  Eraser, 
  PenTool, 
  Upload, 
  Sliders, 
  ShieldCheck, 
  AlertCircle, 
  Maximize2,
  FlipHorizontal,
  FileCheck
} from 'lucide-react';

interface SealSignatureCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imageDataUrl: string, target: 'seal' | 'signature') => void;
  defaultTarget?: 'seal' | 'signature';
  companyTitle?: string;
}

export default function SealSignatureCaptureModal({
  isOpen,
  onClose,
  onSave,
  defaultTarget = 'seal',
  companyTitle = 'صنایع غذایی و بازرگانی دست اول'
}: SealSignatureCaptureModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'draw' | 'upload'>('camera');
  const [targetType, setTargetType] = useState<'seal' | 'signature'>(defaultTarget);

  // Camera states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Image processing options
  const [removeBackground, setRemoveBackground] = useState(true);
  const [contrastBoost, setContrastBoost] = useState(30); // 0 to 100
  const [thresholdLevel, setThresholdLevel] = useState(210); // white cut-off threshold for background removal

  // Signature Pad states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#1e40af'); // Bank blue
  const [penWidth, setPenWidth] = useState(3);
  const [hasDrawn, setHasDrawn] = useState(false);
  const drawHistoryRef = useRef<ImageData[]>([]);

  // Start / Stop camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Video play warning:", e));
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "دسترسی به دوربین توسط مرورگر مسدود شده است. لطفاً دسترسی دوربین را فعال فرمایید یا از تب آپلود تصویر استفاده کنید."
          : "دوربین یا وبکم در دسترس نیست. لطفاً از تب بارگذاری تصویر یا رسم امضا استفاده نمایید."
      );
      setIsCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Lifecycle for camera tab
  useEffect(() => {
    if (isOpen && activeTab === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, capturedImage, startCamera, stopCamera]);

  // Handle Capture from Webcam
  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawDataUrl = canvas.toDataURL('image/png');
    
    stopCamera();
    processAndSetImage(rawDataUrl);
  };

  // Process image (Background removal & ink contrast enhancement)
  const processAndSetImage = (dataUrl: string) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCapturedImage(dataUrl);
        setIsProcessing(false);
        return;
      }

      ctx.drawImage(img, 0, 0);

      if (removeBackground) {
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i];
            const g = d[i + 1];
            const b = d[i + 2];
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114);

            // If the pixel is near white/paper color, make it transparent
            if (brightness > thresholdLevel && Math.max(r, g, b) - Math.min(r, g, b) < 40) {
              d[i + 3] = 0; // Transparent
            } else {
              // Enhance ink contrast
              if (contrastBoost > 0) {
                const factor = (259 * (contrastBoost + 255)) / (255 * (259 - contrastBoost));
                d[i] = Math.min(255, Math.max(0, factor * (r - 128) + 128));
                d[i + 1] = Math.min(255, Math.max(0, factor * (g - 128) + 128));
                d[i + 2] = Math.min(255, Math.max(0, factor * (b - 128) + 128));
              }
            }
          }
          ctx.putImageData(imgData, 0, 0);
        } catch (e) {
          console.warn("Canvas pixel processing warning:", e);
        }
      }

      setCapturedImage(canvas.toDataURL('image/png'));
      setIsProcessing(false);
    };
    img.src = dataUrl;
  };

  // Re-process if filters changed
  const reProcessCurrent = () => {
    if (capturedImage) {
      processAndSetImage(capturedImage);
    }
  };

  // Signature Pad Helpers
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Save initial blank state
        drawHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
      }
    }
  }, [activeTab]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawHistoryRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    drawHistoryRef.current = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
  };

  const undoCanvas = () => {
    if (drawHistoryRef.current.length > 1) {
      drawHistoryRef.current.pop();
      const lastState = drawHistoryRef.current[drawHistoryRef.current.length - 1];
      const canvas = canvasRef.current;
      if (!canvas || !lastState) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.putImageData(lastState, 0, 0);
      }
    } else {
      clearCanvas();
    }
  };

  // Upload handler with automatic background transparency
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        processAndSetImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Final Save
  const handleFinalSave = () => {
    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl, targetType);
      onClose();
    } else if (capturedImage) {
      onSave(capturedImage, targetType);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-purple-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Camera size={18} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">
                ثبت و عکاسی زنده مهر و امضای رسمی
              </h2>
              <span className="text-[10px] text-purple-200 font-medium">
                {companyTitle}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Target Destination & Tab Selector */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Target choice: Seal vs Signature */}
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs w-full sm:w-auto">
            <span className="text-[10.5px] font-black text-slate-500 px-2">مقصد ذخیره:</span>
            <button
              type="button"
              onClick={() => setTargetType('seal')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                targetType === 'seal'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              مهر رسمی فاکتور
            </button>
            <button
              type="button"
              onClick={() => setTargetType('signature')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                targetType === 'signature'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              امضای مدیریت
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-2xl w-full sm:w-auto justify-center">
            <button
              type="button"
              onClick={() => {
                setActiveTab('camera');
                setCapturedImage(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-white text-purple-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera size={13} />
              <span>عکاسی وبکم</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('draw');
                stopCamera();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'draw'
                  ? 'bg-white text-purple-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PenTool size={13} />
              <span>ترسیم دیجیتال</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-purple-950 font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload size={13} />
              <span>آپلود فایل</span>
            </button>
          </div>

        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: WEBCAM CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-3 text-center">
                  <AlertCircle className="mx-auto text-rose-500" size={32} />
                  <p className="text-xs font-bold leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw size={13} />
                    <span>تلاش مجدد اتصال به وبکم</span>
                  </button>
                </div>
              ) : !capturedImage ? (
                <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video flex items-center justify-center shadow-inner border border-slate-800">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Positioning Guide Grid Overlay */}
                  <div className="absolute inset-6 border-2 border-dashed border-purple-400/70 rounded-2xl pointer-events-none flex flex-col items-center justify-between p-3 bg-purple-950/10">
                    <span className="text-[10px] font-black bg-slate-900/80 text-purple-200 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      کاغذ مهر / امضا را داخل این کادر قرار دهید
                    </span>
                    <div className="w-12 h-12 border-2 border-purple-400/40 rounded-full flex items-center justify-center text-purple-300">
                      <Maximize2 size={20} className="animate-pulse" />
                    </div>
                    <span className="text-[9.5px] font-bold text-white/70 bg-slate-900/70 px-2 py-0.5 rounded-md">
                      نور محیط کافی باشد تا پس‌زمینه سفید کاغذ به راحتی شفاف شود
                    </span>
                  </div>

                  {/* Switch Camera Button (for mobile front/back) */}
                  <button
                    type="button"
                    onClick={() => {
                      setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
                    }}
                    className="absolute top-3 left-3 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl backdrop-blur-xs border border-white/10 transition-colors cursor-pointer"
                    title="تغییر دوربین"
                  >
                    <FlipHorizontal size={16} />
                  </button>
                </div>
              ) : (
                /* Captured Image Review & Filters */
                <div className="space-y-4">
                  <div className="relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100 p-6 rounded-2xl border border-slate-300 flex items-center justify-center min-h-[220px]">
                    <img
                      src={capturedImage}
                      alt="Captured Seal"
                      className="max-h-48 max-w-full object-contain filter drop-shadow-md"
                    />
                    <div className="absolute top-2 right-2 text-[9.5px] font-black bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md">
                      پیش‌نمایش با حذف پس‌زمینه سفید
                    </div>
                  </div>

                  {/* Processing Controls */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Sliders size={14} className="text-purple-600" />
                        تنظیمات شفافیت و کیفیت جوهر:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCapturedImage(null);
                          startCamera();
                        }}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        <span>عکاسی دوباره</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 flex justify-between mb-1">
                          <span>حساسیت حذف کاغذ سفید:</span>
                          <span className="font-mono text-purple-700">{thresholdLevel}</span>
                        </label>
                        <input
                          type="range"
                          min="150"
                          max="245"
                          value={thresholdLevel}
                          onChange={e => {
                            setThresholdLevel(Number(e.target.value));
                            reProcessCurrent();
                          }}
                          className="w-full accent-purple-600"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-600 flex justify-between mb-1">
                          <span>تقویت کنتراست جوهر:</span>
                          <span className="font-mono text-purple-700">+{contrastBoost}%</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={contrastBoost}
                          onChange={e => {
                            setContrastBoost(Number(e.target.value));
                            reProcessCurrent();
                          }}
                          className="w-full accent-purple-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Snap Button if camera is live */}
              {!capturedImage && !cameraError && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={handleSnapPhoto}
                    disabled={!isCameraActive}
                    className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={18} />
                    <span>عکاسی و پردازش تصویر</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DRAW DIGITAL SIGNATURE */}
          {activeTab === 'draw' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <PenTool size={14} className="text-purple-600" />
                  <span>امضای خود را با ماوس یا لمس انگشت/قلم در کادر زیر رسم نمایید:</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={undoCanvas}
                    className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="یک مرحله به عقب"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Eraser size={13} />
                    <span>پاک کردن</span>
                  </button>
                </div>
              </div>

              {/* Canvas Pad */}
              <div className="relative bg-white rounded-2xl border-2 border-dashed border-slate-300 shadow-inner overflow-hidden flex items-center justify-center touch-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                  className="w-full h-48 cursor-crosshair"
                />

                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 gap-1 select-none">
                    <PenTool size={28} className="opacity-40" />
                    <span className="text-xs font-bold">محل رسم امضا (با پس‌زمینه شفاف ذخیره خواهد شد)</span>
                  </div>
                )}
              </div>

              {/* Drawing Tools (Color & Pen Size) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">رنگ جوهر:</span>
                  {[
                    { hex: '#1e40af', label: 'آبی' },
                    { hex: '#0f172a', label: 'مشکی' },
                    { hex: '#0f766e', label: 'سبز' },
                    { hex: '#b91c1c', label: 'قرمز' },
                  ].map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setPenColor(c.hex)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        penColor === c.hex ? 'scale-110 border-slate-900 shadow-xs' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">ضخامت قلم:</span>
                  {[2, 3, 5].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPenWidth(w)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        penWidth === w ? 'bg-purple-600 text-white font-black' : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {w === 2 ? 'نازک' : w === 3 ? 'متوسط' : 'ضخیم'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {!capturedImage ? (
                <label className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 hover:bg-purple-50/70 transition-all rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] group">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 group-hover:bg-purple-200 text-purple-700 flex items-center justify-center mb-3 transition-colors">
                    <Upload size={26} />
                  </div>
                  <span className="text-xs font-black text-slate-900 mb-1">
                    کلیک جهت انتخاب فایل مهر یا امضا
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    پشتیبانی از فرمت‌های PNG، JPG و WEBP (کاغذ سفید به صورت خودکار شفاف می‌شود)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100 p-6 rounded-2xl border border-slate-300 flex items-center justify-center min-h-[220px]">
                    <img
                      src={capturedImage}
                      alt="Uploaded Seal"
                      className="max-h-48 max-w-full object-contain filter drop-shadow-md"
                    />
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600">تصویر با موفقیت بارگذاری و شفاف شد.</span>
                    <button
                      type="button"
                      onClick={() => setCapturedImage(null)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>انتخاب فایل دیگر</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>
              ذخیره در: <strong className="text-slate-800">{targetType === 'seal' ? 'مهر رسمی فاکتور' : 'امضای مدیریت'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-black border border-slate-200 transition-colors cursor-pointer"
            >
              انصراف
            </button>

            <button
              type="button"
              onClick={handleFinalSave}
              disabled={(activeTab !== 'draw' && !capturedImage) || (activeTab === 'draw' && !hasDrawn)}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
            >
              <FileCheck size={15} />
              <span>تایید و ذخیره در تنظیمات فاکتور</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
