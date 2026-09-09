import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, MapPin, Check, ChevronDown, ChevronLeft, X, Building2, Sparkles } from "lucide-react";
import { IRAN_PROVINCES_AND_CITIES, getProvinceForCity, normalizeName } from "../utils/dealershipCityTiers";

export interface StrictCityProvinceSelectorProps {
  selectedCity?: string;
  selectedProvince?: string;
  onSelect?: (city: string, province: string) => void;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
  variant?: "button" | "input" | "inline" | "header";
  compact?: boolean;
  showIcon?: boolean;
  dropdownAlign?: "right" | "left" | "center";
}

const POPULAR_CITIES = [
  { city: "تهران", province: "تهران" },
  { city: "مشهد", province: "خراسان رضوی" },
  { city: "اصفهان", province: "اصفهان" },
  { city: "شیراز", province: "فارس" },
  { city: "تبریز", province: "آذربایجان شرقی" },
  { city: "اهواز", province: "خوزستان" },
  { city: "دزفول", province: "خوزستان" },
  { city: "کرج", province: "البرز" },
  { city: "قم", province: "قم" },
  { city: "رشت", province: "گیلان" },
  { city: "کرمان", province: "کرمان" },
  { city: "ارومیه", province: "آذربایجان غربی" },
  { city: "یزد", province: "یزد" },
  { city: "زاهدان", province: "سیستان و بلوچستان" },
  { city: "بندرعباس", province: "هرمزگان" },
  { city: "همدان", province: "همدان" }
];

export const StrictCityProvinceSelector: React.FC<StrictCityProvinceSelectorProps> = ({
  selectedCity = "تهران",
  selectedProvince,
  onSelect,
  className = "",
  buttonClassName = "",
  placeholder = "انتخاب استان و شهر...",
  variant = "button",
  compact = false,
  showIcon = true,
  dropdownAlign = "right"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeProvinceTab, setActiveProvinceTab] = useState<string | null>(() => {
    return selectedProvince || getProvinceForCity(selectedCity) || "تهران";
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const effectiveProvince = useMemo(() => {
    return selectedProvince || getProvinceForCity(selectedCity);
  }, [selectedCity, selectedProvince]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filtered cities & provinces based on search query
  const searchResults = useMemo(() => {
    const query = normalizeName(searchQuery);
    if (!query) return null;

    const results: { province: string; city: string; isCapital: boolean }[] = [];

    IRAN_PROVINCES_AND_CITIES.forEach((provItem) => {
      const normProv = normalizeName(provItem.province);
      const isProvMatch = normProv.includes(query);

      provItem.cities.forEach((cityName) => {
        const normCity = normalizeName(cityName);
        if (isProvMatch || normCity.includes(query) || query.includes(normCity)) {
          results.push({
            province: provItem.province,
            city: cityName,
            isCapital: normalizeName(cityName) === normalizeName(provItem.capital)
          });
        }
      });
    });

    return results;
  }, [searchQuery]);

  const handleSelectCity = (city: string, province: string) => {
    // Update local storage for global persistent state
    try {
      localStorage.setItem("dastavval_user_city", city);
      localStorage.setItem("dastavval_user_province", province);
      window.dispatchEvent(
        new CustomEvent("dastavval-city-changed", {
          detail: { city, province }
        })
      );
    } catch (e) {}

    if (onSelect) {
      onSelect(city, province);
    }

    setIsOpen(false);
    setSearchQuery("");
  };

  const currentProvinceCities = useMemo(() => {
    if (!activeProvinceTab) return [];
    const prov = IRAN_PROVINCES_AND_CITIES.find((p) => p.province === activeProvinceTab);
    return prov ? prov.cities : [];
  }, [activeProvinceTab]);

  return (
    <div className={`relative inline-block text-right font-sans ${className}`} ref={containerRef} dir="rtl">
      {/* Trigger Button */}
      {variant === "button" && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl sm:rounded-2xl border text-xs font-black transition-all cursor-pointer select-none active:scale-95 shadow-3xs hover:shadow-xs ${
            isOpen
              ? "bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
          } ${buttonClassName}`}
          title="انتخاب استان و شهر مجاز سراسر کشور"
        >
          {showIcon && <MapPin size={14} className="text-emerald-700 shrink-0" />}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-slate-500 text-[10.5px] font-bold hidden sm:inline">شهر مقصد:</span>
            <span className="text-slate-900 font-black">{selectedCity}</span>
            <span className="text-slate-400 font-bold text-[10px]">({effectiveProvince})</span>
          </div>
          <ChevronDown size={13} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-emerald-700" : ""}`} />
        </button>
      )}

      {variant === "header" && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11.5px] font-black transition-all cursor-pointer select-none active:scale-95 ${
            isOpen
              ? "bg-emerald-50 border-emerald-500 text-emerald-950"
              : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
          } ${buttonClassName}`}
        >
          <MapPin size={13} className="text-emerald-600 shrink-0" />
          <span className="text-slate-900">{selectedCity}</span>
          <span className="text-slate-500 font-normal text-[10px]">({effectiveProvince})</span>
          <ChevronDown size={12} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {/* Strict Searchable Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-[310px] sm:w-[380px] bg-white rounded-3xl border border-slate-200/90 shadow-2xl z-50 overflow-hidden text-right animate-in fade-in zoom-in-95 duration-150 ${
            dropdownAlign === "left"
              ? "left-0"
              : dropdownAlign === "center"
              ? "left-1/2 -translate-x-1/2"
              : "right-0"
          }`}
          style={{ maxHeight: "490px" }}
        >
          {/* Header & Live Search Bar */}
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-3xs">
                  📍
                </div>
                <span className="text-xs font-black text-slate-900">انتخاب رسمی استان و شهر</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center text-xs cursor-pointer transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی سریع شهر یا استان (مثال: اهواز، دزفول، تبریز، خوزستان...)"
                className="w-full pr-9 pl-8 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-3xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto max-h-[350px] p-3 space-y-3.5 divide-y divide-slate-100/80">
            {/* Case 1: Search Query active */}
            {searchQuery.trim() ? (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between">
                  <span>نتایج جستجو برای «{searchQuery}»:</span>
                  <span className="font-mono text-emerald-700 font-bold">{searchResults?.length || 0} مورد</span>
                </div>

                {searchResults && searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {searchResults.map((item, idx) => {
                      const isCurrent = item.city === selectedCity;
                      return (
                        <button
                          key={`search-res-${item.province}-${item.city}-${idx}`}
                          type="button"
                          onClick={() => handleSelectCity(item.city, item.province)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-right cursor-pointer ${
                            isCurrent
                              ? "bg-emerald-600 text-white font-black shadow-3xs"
                              : "bg-slate-50/60 hover:bg-emerald-50 text-slate-800 hover:text-emerald-950"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? "bg-white" : "bg-emerald-600"}`} />
                            <span className="font-black">{item.city}</span>
                            <span className={`text-[10.5px] ${isCurrent ? "text-emerald-100" : "text-slate-400"}`}>
                              ({item.province})
                            </span>
                            {item.isCapital && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-md ${isCurrent ? "bg-emerald-800 text-white" : "bg-slate-200/80 text-slate-600"}`}>
                                مرکز استان
                              </span>
                            )}
                          </div>
                          {isCurrent && <Check size={14} className="text-white" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-500">شهری با این نام یافت نشد.</p>
                    <p className="text-[10.5px] text-slate-400">لطفاً املای شهر یا استان را بررسی نمایید.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Popular Hub Cities Quick Strip */}
                <div className="space-y-1.5">
                  <div className="text-[10.5px] font-black text-slate-400 flex items-center gap-1">
                    <Sparkles size={11} className="text-amber-500" />
                    <span>مراکز توزیع پرمراجعه و کلان‌شهرها:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_CITIES.map((pop, pIdx) => {
                      const isSelected = pop.city === selectedCity;
                      return (
                        <button
                          key={`pop-city-${pop.city}-${pIdx}`}
                          type="button"
                          onClick={() => handleSelectCity(pop.city, pop.province)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-3xs"
                              : "bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900"
                          }`}
                        >
                          {pop.city}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2-Column Province & City Explorer */}
                <div className="pt-3 space-y-2">
                  <div className="text-[10.5px] font-black text-slate-400">فهرست رسمی تمام ۳۱ استان و شهرستان‌ها:</div>

                  {/* Province Horizontal Selector */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none" style={{ scrollbarWidth: "none" }}>
                    {IRAN_PROVINCES_AND_CITIES.map((provItem) => {
                      const isProvActive = provItem.province === activeProvinceTab;
                      return (
                        <button
                          key={`prov-tab-${provItem.province}`}
                          type="button"
                          onClick={() => setActiveProvinceTab(provItem.province)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                            isProvActive
                              ? "bg-slate-900 text-white border-slate-900 font-black shadow-3xs"
                              : "bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50"
                          }`}
                        >
                          {provItem.province}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cities of Selected Province */}
                  {activeProvinceTab && (
                    <div className="bg-slate-50/80 rounded-2xl p-2.5 border border-slate-200/70 space-y-1.5">
                      <div className="text-[10px] font-bold text-slate-500 flex items-center justify-between px-1">
                        <span>شهرستان‌های استان {activeProvinceTab}:</span>
                        <span className="text-[9.5px] text-slate-400">{currentProvinceCities.length} شهر</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {currentProvinceCities.map((cityName, cIdx) => {
                          const isCurrent = cityName === selectedCity && activeProvinceTab === effectiveProvince;
                          return (
                            <button
                              key={`city-item-${cityName}-${cIdx}`}
                              type="button"
                              onClick={() => handleSelectCity(cityName, activeProvinceTab)}
                              className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all text-right cursor-pointer flex items-center justify-between border ${
                                isCurrent
                                  ? "bg-emerald-600 text-white border-emerald-600 font-black shadow-3xs"
                                  : "bg-white text-slate-800 border-slate-200/70 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-950"
                              }`}
                            >
                              <span className="truncate">{cityName}</span>
                              {isCurrent && <Check size={12} className="text-white shrink-0 ml-0.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer note */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
            <span>🛡️ متصل به پایگاه سراسری عاملیت‌های توزیع</span>
            <span className="text-emerald-700 font-black">دست اول</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrictCityProvinceSelector;
