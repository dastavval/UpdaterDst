import { useState } from "react";
import { Sparkles, MapPin, Building, ShieldCheck, ChevronRight, Zap, ShoppingBag, Info } from "lucide-react";

interface HubDetail {
  id: string;
  name: string;
  englishName: string;
  x: number;
  y: number;
  type: 'central' | 'representative';
  factories: string[];
  representatives: string[];
  activeDeliveries: string;
  hotProduct: {
    name: string;
    brand: string;
    price: string;
    badge: string;
    image: string;
  };
}

const HUBS: HubDetail[] = [
  {
    id: "central-shabestar",
    name: "دفتر مرکزی و انبار توزیع سراسری (شبستر)",
    englishName: "Shabestar Central Hub & HQ",
    x: 75,
    y: 85,
    type: 'central',
    factories: ["قطب تامین استراتژیک شمال‌غرب", "مرکز دپوی محصولات نظری و شیرین‌عسل"],
    representatives: ["واحد ترابری مرکزی دست اول", "ناوگان توزیع مسقف استانی"],
    activeDeliveries: "۸۵۰ کارتن آماده بارگیری",
    hotProduct: {
      name: "کیک دوقلو نظری (کارتن ۴۰ عددی)",
      brand: "نظری",
      price: "قیمت عمده درب انبار",
      badge: "موجودی ویژه انبار مرکزی",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "tehran-alborz",
    name: "نمایندگی دست اول (تهران)",
    englishName: "Tehran Representative",
    x: 190,
    y: 140,
    type: 'representative',
    factories: ["گروه صنعتی مزمز (تامین‌کننده قیمت)", "صنایع دینا (تامین‌کننده قیمت)", "شکلات فرمند (تامین‌کننده قیمت)"],
    representatives: ["بازرگانی علیزاده (تحویل‌دهنده)", "پخش مویرگی البرز سرافراز (تحویل‌دهنده)"],
    activeDeliveries: "۲۴۰ کارتن امروز",
    hotProduct: {
      name: "چیپس سیب‌زمینی نمکی مزمز",
      brand: "مزمز",
      price: "۲۱,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "saveh",
    name: "نمایندگی دست اول (ساوه)",
    englishName: "Saveh Representative",
    x: 160,
    y: 180,
    type: 'representative',
    factories: ["صنایع عالیفرد - سن‌ایچ (تامین‌کننده قیمت)", "صنایع ترشیجات جنگلی (تامین‌کننده قیمت)"],
    representatives: ["پخش سراسری ساوه پخش (تحویل‌دهنده)", "بازرگانی نوشیدنی پایتخت (تحویل‌دهنده)"],
    activeDeliveries: "۱۸۰ کارتن امروز",
    hotProduct: {
      name: "شربت پرتقال غلیظ سن‌ایچ",
      brand: "سن‌ایچ",
      price: "۱۶۲,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "tabriz",
    name: "نمایندگی دست اول (تبریز)",
    englishName: "Tabriz Representative",
    x: 90,
    y: 100,
    type: 'representative',
    factories: ["گروه صنایع نظری - کیک نظری (تامین‌کننده قیمت)", "صنایع غذایی شیرین عسل (تامین‌کننده قیمت)"],
    representatives: ["پخش آذربایجان تبریز (تحویل‌دهنده)", "بازرگانی رضایی شمالغرب (تحویل‌دهنده)"],
    activeDeliveries: "۱۵۰ کارتن امروز",
    hotProduct: {
      name: "کیک صبحانه ۸۰ گرمی متالایز",
      brand: "نظری",
      price: "۲۵,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "isfahan",
    name: "نمایندگی دست اول (اصفهان)",
    englishName: "Isfahan Representative",
    x: 210,
    y: 240,
    type: 'representative',
    factories: ["توزیع کلاهدوز (تامین‌کننده قیمت)", "کوکاکولا اصفهان (تامین‌کننده قیمت)"],
    representatives: ["بازرگانی سپاهان پخش اصفهان (تحویل‌دهنده)"],
    activeDeliveries: "۳۱۰ کارتن امروز",
    hotProduct: {
      name: "ماءالشعیر کلاسیک هوفنبرگ",
      brand: "هوفنبرگ",
      price: "۲۹,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "mashhad",
    name: "نمایندگی دست اول (مشهد)",
    englishName: "Mashhad Representative",
    x: 380,
    y: 130,
    type: 'representative',
    factories: ["شرکت خوشگوار - کوکاکولا (تامین‌کننده قیمت)", "هلدینگ تبرک (تامین‌کننده قیمت)"],
    representatives: ["پخش توس مشهد (تحویل‌دهنده)", "بازرگانی خاوران شرق (تحویل‌دهنده)"],
    activeDeliveries: "۴۲۰ کارتن امروز",
    hotProduct: {
      name: "نوشابه گازدار قوطی کوکاکولا",
      brand: "خوشگوار",
      price: "۱۸,۵۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "shiraz",
    name: "نمایندگی دست اول (شیراز)",
    englishName: "Shiraz Representative",
    x: 230,
    y: 320,
    type: 'representative',
    factories: ["صنایع بسته‌بندی جنوب (تامین‌کننده قیمت)", "صنایع غذایی یک‌و‌یک (تامین‌کننده قیمت)"],
    representatives: ["پخش سراسری فارس مهر (تحویل‌دهنده)", "بازرگانی قشقایی جنوب (تحویل‌دهنده)"],
    activeDeliveries: "۹۰ کارتن امروز",
    hotProduct: {
      name: "کنسرو تن ماهی ۱۸۰ گرمی شیلتون",
      brand: "شیلتون",
      price: "۸۱,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1622484211148-717088f170e9?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "rasht",
    name: "نمایندگی دست اول (رشت)",
    englishName: "Rasht Representative",
    x: 150,
    y: 110,
    type: 'representative',
    factories: ["کلوچه نوشین لاهیجان (تامین‌کننده قیمت)", "چای گلستان شمال (تامین‌کننده قیمت)"],
    representatives: ["پخش سراسری گیلان کالا (تحویل‌دهنده)", "بازرگانی شمال سبز (تحویل‌دهنده)"],
    activeDeliveries: "۱۳۰ کارتن امروز",
    hotProduct: {
      name: "کلوچه لاهیجان گردویی نوشین",
      brand: "نوشین",
      price: "۱۵,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1558961309-dbdf0003107c?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "ahvaz",
    name: "نمایندگی دست اول (اهواز)",
    englishName: "Ahvaz Representative",
    x: 120,
    y: 240,
    type: 'representative',
    factories: ["کارخانه تصفیه روغن لادن (تامین‌کننده قیمت)", "پتروشیمی و پلاستیک اروند (تامین‌کننده قیمت)"],
    representatives: ["پخش مویرگی اهواز توزیع (تحویل‌دهنده)", "شرکت پخش کارون (تحویل‌دهنده)"],
    activeDeliveries: "۱۶۰ کارتن امروز",
    hotProduct: {
      name: "روغن مایع خوراکی لادن ۱.۵ لیتری",
      brand: "لادن",
      price: "۷۸,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "bandar-abbas",
    name: "نمایندگی دست اول (بندرعباس)",
    englishName: "Bandar Abbas Representative",
    x: 270,
    y: 360,
    type: 'representative',
    factories: ["صنایع شیلات بندرعباس (تامین‌کننده قیمت)", "تامین کالای دریا (تامین‌کننده قیمت)"],
    representatives: ["بازرگانی دریایی هرمز (تحویل‌دهنده)", "پخش سراسری بنادر جنوب (تحویل‌دهنده)"],
    activeDeliveries: "۵۱۰ کارتن امروز",
    hotProduct: {
      name: "کنسرو ماهی ساردین در روغن زیتون",
      brand: "شیلتون",
      price: "۶۵,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=400"
    }
  },
  {
    id: "kerman",
    name: "نمایندگی دست اول (کرمان)",
    englishName: "Kerman Representative",
    x: 320,
    y: 290,
    type: 'representative',
    factories: ["صنایع پسته رفسنجان (تامین‌کننده قیمت)", "صنایع پلاستیک کویر (تامین‌کننده قیمت)"],
    representatives: ["بازرگانی پسته شرق (تحویل‌دهنده)", "پخش محلی کرمان زمرد (تحویل‌دهنده)"],
    activeDeliveries: "۱۱۰ کارتن امروز",
    hotProduct: {
      name: "پسته اکبری بوداده زعفرانی ۵۰۰ گرمی",
      brand: "مزمز",
      price: "۳۹۰,۰۰۰ تومان",
      badge: "تامین مستقیم",
      image: "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&q=80&w=400"
    }
  }
];

export default function IranMap({ theme, onSelectProduct }: { theme: 'light' | 'dark' | 'classic', onSelectProduct?: (productName: string) => void }) {
  const [selectedHub, setSelectedHub] = useState<HubDetail>(HUBS[0]);
  const [hoveredHub, setHoveredHub] = useState<HubDetail | null>(null);

  return (
    <div className={`rounded-3xl border p-6 sm:p-8 transition-all relative overflow-hidden ${
      theme === 'dark'
        ? 'bg-slate-50/60 border-slate-800 text-white shadow-2xl'
        : 'bg-white border-slate-100 text-slate-900 shadow-xl'
    }`}>
      
      {/* Background radial highlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10 text-right">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Zap size={12} className="animate-pulse" />
            سامانه رصد برخط کارخانجات و نمایندگان رسمی
          </div>
          <h2 className="text-xl sm font-black">نقشه تعاملی قطب‌های تولید و نمایندگی‌های کشور</h2>
          <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            با انتخاب هر یک از هاب‌های اصلی روی نقشه، کارخانه‌ها، نمایندگان رسمی و باکیفیت‌ترین بارهای فعال بازار را رصد کنید.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0 justify-end">
          <div className="flex items-center gap-1 text-[11px] font-black text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-ping" />
            <span className="text-emerald-600">۱۰ قطب فعال تولید</span>
          </div>
          <div className="text-slate-300">|</div>
          <div className="text-[11px] font-black text-slate-500">
            ۸۰ نماینده توزیع تایید شده
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Map Container - SVG Map of Iran (Stylized Interactive WebGL-look) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
          
          <div className="relative w-full max-w-[460px] aspect-[1.1/1] rounded-2xl p-4 bg-white/5 border border-slate-200/40 shadow-inner flex items-center justify-center">
            
            {/* Compass / Orientation indicator */}
            <div className="absolute bottom-4 right-4 text-left pointer-events-none opacity-40">
              <span className="text-[9px] font-mono block text-slate-400 font-bold">GRID ORIENTATION</span>
              <span className="text-[11px] font-mono block font-black text-slate-500">IRAN INDUSTRIAL HUBS</span>
            </div>

            {/* Interactive SVG */}
            <svg 
              viewBox="0 0 500 450" 
              className="w-full h-full select-none"
            >
              {/* Decorative Tech Grid */}
              <defs>
                <pattern id="grid-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill={theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-dots)" />

              {/* Stylical geographical boundary of Iran - high-fidelity curve map */}
              <path 
                d="M 80,60
                   C 75,75 72,90 75,100
                   C 78,115 80,125 80,130
                   C 80,145 85,160 90,175
                   C 95,190 100,205 105,215
                   C 112,230 120,245 125,255
                   C 128,265 130,270 130,275
                   C 140,285 155,295 165,305
                   C 175,315 180,320 185,325
                   C 195,335 202,340 210,345
                   C 225,352 240,356 255,360
                   C 265,362 275,360 280,355
                   C 295,348 310,360 325,368
                   C 340,375 355,385 375,395
                   C 390,400 405,400 415,395
                   C 425,375 428,350 430,330
                   C 432,310 435,290 435,270
                   C 435,250 428,230 425,210
                   C 422,190 421,170 420,150
                   C 418,130 415,115 410,100
                   C 400,105 392,110 385,115
                   C 370,110 358,102 345,95
                   C 330,88 312,83 295,80
                   C 280,90 262,100 245,105
                   C 228,108 210,110 195,110
                   C 180,108 165,106 150,105
                   C 135,95 125,85 115,75
                   C 110,65 108,58 105,50
                   C 95,53 85,55 80,60 Z" 
                fill={theme === 'dark' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(16, 185, 129, 0.02)'}
                stroke={theme === 'dark' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)'}
                strokeWidth="1.8"
                className="transition-all duration-700"
              />

              {/* Lake Urmia (دریاچه ارومیه) */}
              <path 
                d="M 76,95 C 73,98 75,106 78,104 C 81,102 79,97 76,95 Z" 
                fill={theme === 'dark' ? 'rgba(14, 165, 233, 0.4)' : 'rgba(14, 165, 233, 0.3)'}
                stroke={theme === 'dark' ? 'rgba(14, 165, 233, 0.6)' : 'rgba(14, 165, 233, 0.5)'}
                strokeWidth="1"
              />

              {/* Qeshm and Kish Islands */}
              <rect x="278" y="360" width="10" height="3" rx="1.5" fill="#10b981" opacity="0.8" />
              <circle cx="232" cy="366" r="2.5" fill="#10b981" opacity="0.8" />

              {/* Central Salt Lake (Kavir) stylized graphic */}
              <ellipse 
                cx="270" 
                cy="200" 
                rx="35" 
                ry="15" 
                fill={theme === 'dark' ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.01)'}
                stroke={theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'}
                strokeWidth="1"
              />

              {/* Caspian Sea stylized graphic */}
              <path 
                d="M 115,75
                   C 125,85 135,95 150,105
                   C 165,106 180,108 195,110
                   C 210,110 228,108 245,105
                   C 262,100 280,90 295,80
                   C 290,50 260,20 195,20
                   C 135,20 120,45 115,75 Z" 
                fill={theme === 'dark' ? 'rgba(30,58,138,0.1)' : 'rgba(191,219,254,0.3)'}
              />
              {HUBS.map(hub => {
                const isSelected = selectedHub?.id === hub.id;
                const isHovered = hoveredHub?.id === hub.id;
                const isCentral = hub.type === 'central';
                const markerColor = isCentral ? "#f59e0b" : isSelected ? "#10b981" : "#3b82f6";
                const markerSize = isCentral ? (isSelected ? 22 : isHovered ? 18 : 14) : (isSelected ? 16 : isHovered ? 12 : 8);
                
                return (
                  <g 
                    key={hub.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedHub(hub)}
                    onMouseEnter={() => setHoveredHub(hub)}
                    onMouseLeave={() => setHoveredHub(null)}
                  >
                    {/* Glowing pulse ring */}
                    <circle 
                      cx={hub.x} 
                      cy={hub.y} 
                      r={markerSize * 2} 
                      fill={markerColor}
                      opacity={isSelected ? 0.25 : isHovered ? 0.2 : 0.1}
                      className={isSelected ? "animate-ping" : "transition-all duration-300"}
                      style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}
                    />
                    
                    {/* Outer border ring */}
                    <circle 
                      cx={hub.x} 
                      cy={hub.y} 
                      r={markerSize * 1.25} 
                      fill="none"
                      stroke={markerColor}
                      strokeWidth={isCentral ? 3 : isSelected ? 2 : 1.5}
                      className="transition-all duration-300"
                    />

                    {/* Core dot */}
                    <circle 
                      cx={hub.x} 
                      cy={hub.y} 
                      r={isCentral ? 8 : (isSelected ? 5 : 4)} 
                      fill={markerColor}
                      className="transition-all duration-300"
                    />

                    {/* Text label for major cities */}
                    <text
                      x={hub.x}
                      y={hub.y - (markerSize + 8)}
                      textAnchor="middle"
                      className="text-[10px] font-black pointer-events-none transition-all duration-300"
                      fill={isCentral ? "#f59e0b" : isSelected ? "#10b981" : theme === 'dark' ? '#f8fafc' : '#0f172a'}
                      style={{
                        textShadow: theme === 'dark' ? '0 1px 2px rgba(0,0,0,0.8)' : '0 1px 2px rgba(255,255,255,0.8)',
                        fontWeight: isSelected || isCentral ? '900' : '700'
                      }}
                    >
                      {hub.name.includes("شبستر") ? "مرکز شبستر" : hub.name.split(" ")[1]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex gap-4 mt-3 flex-wrap justify-center text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> قطب اصلی انتخاب شده
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> سایر قطب‌های توزیع فعال
            </span>
          </div>
        </div>

        {/* Selected Hub Details Panel - Desktop sidebar / mobile content */}
        <div className="lg:col-span-5 text-right flex flex-col justify-between h-full space-y-6">
          
          <div className={`rounded-2xl p-5 border transition-all ${
            theme === 'dark' ? 'bg-white/60 border-slate-800' : 'bg-emerald-50/50 border-emerald-100'
          }`}>
            <div className="flex justify-between items-start gap-2 mb-4 pb-3 border-b border-slate-200/40">
              <div className="text-left font-mono">
                <span className="text-[9px] text-slate-400 font-bold block">HUB INFRASTRUCTURE</span>
                <span className="text-xs text-emerald-500 font-extrabold block">{selectedHub.englishName}</span>
              </div>
              <div className="text-right">
                <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5 justify-end">
                  <MapPin size={16} className="text-emerald-500 shrink-0" />
                  {selectedHub.name.split(" ")[0]}
                </h3>
                <span className="text-[10px] font-bold text-slate-400">{selectedHub.name}</span>
              </div>
            </div>

            {/* List of active factories */}
            <div className="space-y-3 mb-4">
              <h4 className="text-xs font-black text-slate-500 flex items-center gap-1 justify-end">
                <span>کارخانجات تولیدی متصل</span>
                <Building size={14} className="text-blue-500" />
              </h4>
              <div className="grid grid-cols-1 gap-1.5">
                {selectedHub.factories.map((factory, i) => (
                  <div 
                    key={i} 
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between border ${
                      theme === 'dark' ? 'bg-slate-50/40 border-slate-850' : 'bg-white border-slate-200/40'
                    }`}
                  >
                    <span className="text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.5 rounded-full font-black">
                      تامین مستقیم
                    </span>
                    <span className="text-slate-800">{factory}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List of representatives */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-500 flex items-center gap-1 justify-end">
                <span>نماینده معتمد دست اول (کف توزیع فعال: ۳۰۰ میلیون تومان در ماه)</span>
                <ShieldCheck size={14} className="text-emerald-500" />
              </h4>
              <div className="bg-sky-50/50 p-2.5 rounded-xl border border-sky-150/50 text-[9px] text-sky-800 leading-relaxed font-bold text-right">
                ✍️ نمایندگان رسمی، تحویل‌دهندگان قانونی بار و معتمدین پلتفرم «دست اول» در استان مقصد می‌باشند و متعهد به حفظ تارگت توزیع فعال بالای ۳۰۰ میلیون تومانی در ماه هستند.
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {selectedHub.representatives.map((rep, i) => (
                  <div 
                    key={i} 
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center justify-between border ${
                      theme === 'dark' ? 'bg-slate-50/40 border-slate-850' : 'bg-white border-slate-200/40'
                    }`}
                  >
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-black">
                      نماینده معتمد دست اول
                    </span>
                    <span className="text-slate-800">{rep}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hot Product Direct-Order Feature */}
          <div className={`rounded-2xl p-4 border relative overflow-hidden transition-all ${
            theme === 'dark' 
              ? 'bg-gradient-to-r from-emerald-950/30 to-indigo-950/30 border-emerald-500/25' 
              : 'bg-emerald-50/30 border-emerald-500/20'
          }`}>
            <div className="absolute top-0 left-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl" />
            
            <div className="flex gap-3 items-center">
              
              {/* Product Thumbnail with premium absolute aspect */}
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-emerald-500/20 shrink-0 shadow-md relative">
                <img 
                  src={selectedHub.hotProduct.image} 
                  alt={selectedHub.hotProduct.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Product Specs */}
              <div className="flex-1 text-right">
                <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black inline-block mb-1">
                  {selectedHub.hotProduct.badge}
                </span>
                <h4 className="text-xs font-black text-slate-900 leading-tight">{selectedHub.hotProduct.name}</h4>
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="text-[10px] text-slate-400 font-bold">برند {selectedHub.hotProduct.brand}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-xs font-black text-emerald-600">{selectedHub.hotProduct.price}</span>
                </div>
              </div>
            </div>

            {/* Quick checkout CTA button */}
            <button 
              onClick={() => {
                if (onSelectProduct) {
                  onSelectProduct(selectedHub.hotProduct.name);
                } else {
                  // Fallback dispatcher
                  window.dispatchEvent(new CustomEvent("search-and-focus-product", { 
                    detail: { productName: selectedHub.hotProduct.name } 
                  }));
                }
              }}
              className="w-full mt-3 py-2 px-4 bg-emerald-600 hover text-white font-black text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10 cursor-pointer"
            >
              <ShoppingBag size={13} />
              <span>خرید مستقیم و سریع با دو کلیک</span>
              <ChevronRight size={12} />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
