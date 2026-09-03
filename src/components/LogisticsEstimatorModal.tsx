import React, { useState } from "react";
import { 
  Truck, 
  X, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Calculator, 
  Building2, 
  Package, 
  HelpCircle,
  ArrowLeft,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LogisticsEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvince?: string;
  defaultCity?: string;
}

const PROVINCE_FREIGHT_RATES: { [key: string]: { basePerCarton: number; days: string; hub: string; carriers: string[] } } = {
  "تهران": { basePerCarton: 12000, days: "۲۴ ساعت", hub: "انبار مرکزی تهران / باربری شوش", carriers: ["باربری وطن", "پیشتاز", "باربری پیام شمس", "وانت اختصاصی"] },
  "البرز": { basePerCarton: 14000, days: "۲۴ الی ۴۸ ساعت", hub: "پایانه کرج", carriers: ["باربری وطن", "باربری پیام شمس", "تیپاکس عمده"] },
  "اصفهان": { basePerCarton: 18000, days: "۲۴ الی ۴۸ ساعت", hub: "پایانه باربری اصفهان (امیرکبیر)", carriers: ["باربری وطن", "باربری گیتی", "پیام شمس"] },
  "خراسان رضوی": { basePerCarton: 22000, days: "۴۸ ساعت", hub: "پایانه بار مشهد (طرق)", carriers: ["باربری وطن", "خراسان بار", "پیام شمس"] },
  "فارس": { basePerCarton: 24000, days: "۴۸ الی ۷۲ ساعت", hub: "پایانه باربری شیراز", carriers: ["باربری وطن", "فارس بار", "پیام شمس"] },
  "آذربایجان شرقی": { basePerCarton: 22000, days: "۴۸ ساعت", hub: "پایانه بار تبریز", carriers: ["باربری وطن", "آذربایجان بار", "پیام شمس"] },
  "آذربایجان غربی": { basePerCarton: 25000, days: "۴۸ الی ۷۲ ساعت", hub: "پایانه ارومیه", carriers: ["باربری وطن", "اروم بار"] },
  "مازندران": { basePerCarton: 16000, days: "۲۴ الی ۴۸ ساعت", hub: "پایانه ساری / بابل", carriers: ["باربری شمال", "باربری وطن", "پیشتاز"] },
  "گیلان": { basePerCarton: 17000, days: "۲۴ الی ۴۸ ساعت", hub: "پایانه رشت", carriers: ["گیلان بار", "باربری وطن"] },
  "خوزستان": { basePerCarton: 26000, days: "۴۸ الی ۷۲ ساعت", hub: "پایانه اهواز", carriers: ["باربری خوزستان", "باربری وطن", "پیام شمس"] },
  "کرمان": { basePerCarton: 25000, days: "۴۸ الی ۷۲ ساعت", hub: "پایانه کرمان", carriers: ["باربری وطن", "کرمان بار"] },
  "یزد": { basePerCarton: 19000, days: "۲۴ الی ۴۸ ساعت", hub: "پایانه یزد", carriers: ["باربری وطن", "یزد بار"] },
  "همدان": { basePerCarton: 17000, days: "۲۴ ساعت", hub: "پایانه همدان", carriers: ["باربری وطن", "الوند بار"] },
  "کرمانشاه": { basePerCarton: 20000, days: "۴۸ ساعت", hub: "پایانه کرمانشاه", carriers: ["باربری وطن", "زاگرس بار"] },
  "سیستان و بلوچستان": { basePerCarton: 32000, days: "۷۲ الی ۹۶ ساعت", hub: "پایانه زاهدان / چابهار", carriers: ["باربری وطن", "بلوچستان بار"] },
  "هرمزگان": { basePerCarton: 29000, days: "۴۸ الی ۷۲ ساعت", hub: "پایانه بندرعباس", carriers: ["باربری وطن", "خلیج بار"] }
};

const VEHICLE_TYPES = [
  { id: "barbari", name: "خرده‌بار پایانه باربری (وطن، شمس و...)", capacity: "از ۳ کارتن تا ۵۰ کارتن", desc: "اقتصادی‌ترین حالت برای خریدهای خرد و متوسط بنکداری", factor: 1.0 },
  { id: "khavar", name: "خاور دربستی مسقف (ایسوزو)", capacity: "تا ۳۵۰ کارتن (حدود ۳.۵ تن)", desc: "بارگیری مستقیم از درب انبار کارخانه تا انبار خریدار", factor: 0.75 },
  { id: "single", name: "کامیون تک / جفت (ده چرخ)", capacity: "تا ۱,۱۰۰ کارتن (۱۰ الی ۱۵ تن)", desc: "مناسب توزیع‌کنندگان استانی و عمده‌فروشان بزرگ", factor: 0.60 },
  { id: "trailer", name: "تریلی کفی / چادری ترانزیت", capacity: "تا ۲,۴۰۰ کارتن (۲۲ تن)", desc: "حداکثر تخفیف لجستیک ویژه سفارشات تیراژ مستقیم", factor: 0.45 }
];

export default function LogisticsEstimatorModal({
  isOpen,
  onClose,
  defaultProvince = "تهران",
  defaultCity = "تهران"
}: LogisticsEstimatorModalProps) {
  const [selectedProvince, setSelectedProvince] = useState(defaultProvince);
  const [cartonCount, setCartonCount] = useState<number>(20);
  const [vehicleType, setVehicleType] = useState("barbari");

  if (!isOpen) return null;

  const provinceData = PROVINCE_FREIGHT_RATES[selectedProvince] || {
    basePerCarton: 20000,
    days: "۴۸ الی ۷۲ ساعت",
    hub: "پایانه باربری مرکز استان",
    carriers: ["باربری وطن", "باربری پیام شمس", "پیشتاز بار"]
  };

  const selectedVehicle = VEHICLE_TYPES.find(v => v.id === vehicleType) || VEHICLE_TYPES[0];
  const effectivePerCarton = Math.round(provinceData.basePerCarton * selectedVehicle.factor);
  const totalFreightCost = effectivePerCarton * cartonCount;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 sm:p-6 relative">
            <button 
              onClick={onClose}
              className="absolute top-5 left-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/30 border border-indigo-400/40 flex items-center justify-center text-amber-300 shadow-inner">
                <Truck size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">استعلام هوشمند کرایه باربری و لجستیک</h3>
                <p className="text-xs text-emerald-200 mt-0.5">محاسبه آنلاین نرخ حمل بار از خط تولید کارخانه به سراسر کشور</p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Input Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Province Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-emerald-600" />
                  <span>استان مقصد تحویل بار:</span>
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                >
                  {Object.keys(PROVINCE_FREIGHT_RATES).map((prov, idx) => (
                    <option key={`prov-${prov}-${idx}`} value={prov}>{prov}</option>
                  ))}
                  <option value="سایر استان‌ها">سایر استان‌ها و شهرستان‌ها</option>
                </select>
              </div>

              {/* Carton Count Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Package size={14} className="text-emerald-600" />
                  <span>تعداد کل کارتن‌های سفارش:</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="3"
                    max="3000"
                    value={cartonCount}
                    onChange={(e) => setCartonCount(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-black text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                  />
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">کارتن</span>
                </div>
              </div>
            </div>

            {/* Vehicle Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">نوع ناوگان باربری و نحوه ارسال:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {VEHICLE_TYPES.map((veh, vIdx) => (
                  <button
                    key={`veh-${veh.id}-${vIdx}`}
                    onClick={() => setVehicleType(veh.id)}
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between gap-1.5 ${
                      vehicleType === veh.id
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black ${vehicleType === veh.id ? 'text-indigo-950' : 'text-slate-800'}`}>
                        {veh.name}
                      </span>
                      {vehicleType === veh.id && <CheckCircle2 size={16} className="text-emerald-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{veh.desc}</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md self-start">
                      ظرفیت: {veh.capacity}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculation Summary Result Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                <span className="text-xs text-emerald-200">برآورد سرانه کرایه هر کارتن:</span>
                <span className="text-base font-black text-amber-300 font-sans">
                  {effectivePerCarton.toLocaleString('fa-IR')} تومان / کارتن
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">جمع کل کرایه تخمینی برای {cartonCount.toLocaleString('fa-IR')} کارتن:</span>
                  <span className="text-[11px] text-indigo-300">تسویه کرایه طبق بارنامه رسمی در محل باربری یا تخلیه</span>
                </div>
                <div className="text-left">
                  <span className="text-xl font-black text-white font-sans">
                    {totalFreightCost.toLocaleString('fa-IR')}
                  </span>
                  <span className="text-xs text-amber-400 font-bold mr-1">تومان</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-500/30 text-xs">
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-amber-400" />
                  <span className="text-slate-300">مدت زمان تحویل: <strong className="text-white">{provinceData.days}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  <span className="text-slate-300">بیمه بار: <strong className="text-emerald-300">۱۰۰٪ پوشش بیمه‌ای</strong></span>
                </div>
              </div>
            </div>

            {/* Carriers info */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">باربری‌های همکار مجاز در این مسیر:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {provinceData.carriers.map((car, idx) => (
                  <span key={`logisticsestimatormodal-idx-${idx}`} className="bg-white border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg text-[11px] font-bold shadow-2xs">
                    {car}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 sm:px-6 flex items-center justify-end">
            <button
              onClick={onClose}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              متوجه شدم، بستن پنجره
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
