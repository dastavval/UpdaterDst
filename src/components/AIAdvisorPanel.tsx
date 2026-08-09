import { useState, useEffect } from "react";
import { Sparkles, MessageSquare, Calculator, TrendingUp, HelpCircle, Send, ArrowLeftRight, CheckCircle2, ShieldCheck, DollarSign, Percent, ArrowUpRight, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product } from "../types";

interface AIAdvisorPanelProps {
  products: Product[];
  onAddToCart: (product: Product, quantityCartons: number) => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIAdvisorPanel({ products, onAddToCart }: AIAdvisorPanelProps) {
  // State for AI Chat
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "سلام! من کارشناس هوشمند تجاری دست اول هستم. چطور می‌توانم در زمینه برآورد سود، پیشنهاد سبد محصولات پرفروش و یا تحلیل نرخ‌های کارخانه‌ای به شما کمک کنم؟"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // State for Profit Calculator
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [calcCartons, setCalcCartons] = useState<number>(10);
  const [calcRetailPrice, setCalcRetailPrice] = useState<number>(0);
  const [customAdvice, setCustomAdvice] = useState<string>("");
  const [adviceLoading, setAdviceLoading] = useState(false);

  // Get selected product details
  const selectedProduct = products.find(p => p.id === selectedProductId) || products[0];

  // Initialize selected retail price when product changes
  useEffect(() => {
    if (selectedProduct) {
      setCalcRetailPrice(selectedProduct.consumer_price || selectedProduct.price * 1.3);
      setCalcCartons(selectedProduct.min_order_cartons || 10);
      setCustomAdvice("");
    }
  }, [selectedProductId, selectedProduct]);

  // Handle Send Message to AI
  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setAiLoading(true);

    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6) // Send recent history for context
        })
      });
      const data = await response.json();
      if (data.response) {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "متاسفانه در حال حاضر با مشکلی روبرو شدم. لطفا دوباره تلاش کنید." }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "خطا در اتصال به کارشناس هوش مصنوعی. لطفا اینترنت خود را بررسی کنید." }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Get Custom AI Advice for the selected product and pricing
  const handleGetCustomAdvice = async () => {
    if (!selectedProduct) return;
    setAdviceLoading(true);
    setCustomAdvice("");

    const pricePerCarton = selectedProduct.bulk_price * selectedProduct.carton_pack_count;
    const totalCost = pricePerCarton * calcCartons;
    const totalRevenue = (calcRetailPrice * selectedProduct.carton_pack_count) * calcCartons;
    const profit = totalRevenue - totalCost;
    const roi = (profit / totalCost) * 100;

    const prompt = `من می‌خواهم تعداد ${calcCartons} کارتن از محصول "${selectedProduct.name}" برند "${selectedProduct.brand}" را با قیمت خرید هر کارتن ${pricePerCarton.toLocaleString()} تومان تهیه کنم و هر دانه را به قیمت مصرف‌کننده ${calcRetailPrice.toLocaleString()} تومان بفروشم. کل هزینه خرید من ${totalCost.toLocaleString()} تومان و کل فروش من ${totalRevenue.toLocaleString()} تومان است که سود ناخالص آن ${profit.toLocaleString()} تومان (معادل ROI ٪${roi.toFixed(1)}) می‌شود. لطفا به عنوان یک کارشناس خبره بنکداری ایران، به من پیشنهاد و توصیه اقتصادی بدهید که آیا این سود و سرمایه‌گذاری مناسب است و چطور می‌توانم فروش و بازاریابی بهتری برای این برند داشته باشم؟ پاسخ کوتاه و در قالب ۳ الی ۴ نکته جذاب بنویس.`;

    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, history: [] })
      });
      const data = await response.json();
      if (data.response) {
        setCustomAdvice(data.response);
      } else {
        setCustomAdvice("مشکلی در دریافت پیشنهاد به وجود آمد.");
      }
    } catch (err) {
      console.error(err);
      setCustomAdvice("عدم امکان دریافت پیشنهاد در این لحظه.");
    } finally {
      setAdviceLoading(false);
    }
  };

  // Calculations
  const packCount = selectedProduct ? selectedProduct.carton_pack_count : 0;
  const costPerSingle = selectedProduct ? selectedProduct.bulk_price : 0;
  const costPerCarton = costPerSingle * packCount;
  const totalCost = costPerCarton * calcCartons;
  const totalRevenue = (calcRetailPrice * packCount) * calcCartons;
  const grossProfit = totalRevenue - totalCost;
  const roiPercent = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;

  // Investment Rating
  const getRating = (roi: number) => {
    if (roi >= 35) return { label: "سوددهی فوق‌العاده (طلا)", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
    if (roi >= 20) return { label: "سوددهی عالی (نقره)", color: "text-emerald-600 bg-emerald-600/10 border-emerald-600/20" };
    if (roi >= 10) return { label: "سوددهی خوب (برنز)", color: "text-blue-600 bg-blue-600/10 border-blue-600/20" };
    return { label: "سوددهی کم", color: "text-red-500 bg-red-500/10 border-red-500/20" };
  };

  const rating = getRating(roiPercent);

  // Conversion for Persian numbers
  const toPersianNum = (num: number | string) => {
    if (num === undefined || num === null) return "";
    const persian = {
      "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴", "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹"
    };
    return num.toString().replace(/[0-9]/g, (w) => (persian as any)[w]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-right" dir="rtl">
      {/* 1. Profit Margin & Investment Simulator */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 border-b border-gray-50 pb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Calculator size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">شبیه‌ساز خرید و سود ناخالص</h3>
              <p className="text-xs text-gray-400 font-bold">برآورد دقیق سود خرده‌فروشی بر اساس فاکتور خرید کارتنی درب کارخانه</p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-400">در حال بارگذاری کالاها...</div>
          ) : (
            <div className="space-y-6">
              {/* Product Selector */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500">انتخاب کالای هدف جهت شبیه‌سازی:</label>
                <select 
                  value={selectedProductId} 
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-800 focus focus focus transition-all outline-none"
                >
                  <option value="" disabled>کالایی را انتخاب کنید...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.brand} - {p.name} (درب کارخانه: {p.bulk_price.toLocaleString()} تومان)
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cartons inputs */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 flex justify-between">
                      <span>تعداد کارتن سفارشی:</span>
                      <span className="text-emerald-600 font-mono text-[10px]">حداقل سفارش: {selectedProduct.min_order_cartons}</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setCalcCartons(prev => Math.max(selectedProduct.min_order_cartons, prev - 5))}
                        className="px-3 py-2 bg-gray-100 hover active:scale-95 text-gray-700 rounded-xl font-bold transition-all"
                      >
                        -۵
                      </button>
                      <input 
                        type="number" 
                        min={selectedProduct.min_order_cartons}
                        value={calcCartons}
                        onChange={e => setCalcCartons(Math.max(selectedProduct.min_order_cartons, Number(e.target.value)))}
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-center font-black font-mono text-gray-800 focus focus focus outline-none transition-all"
                      />
                      <button 
                        onClick={() => setCalcCartons(prev => prev + 5)}
                        className="px-3 py-2 bg-gray-100 hover active:scale-95 text-gray-700 rounded-xl font-bold transition-all"
                      >
                        +۵
                      </button>
                    </div>
                  </div>

                  {/* Target Consumer Retail Price */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 flex justify-between">
                      <span>قیمت فروش تکی مصرف‌کننده (تومان):</span>
                      <span className="text-slate-500 text-[10px]">درب کارخانه: {selectedProduct.bulk_price.toLocaleString()}</span>
                    </label>
                    <input 
                      type="number" 
                      value={calcRetailPrice}
                      onChange={e => setCalcRetailPrice(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-center font-black font-mono text-gray-800 focus focus focus outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Simulation Result Block */}
              {selectedProduct && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200/50 pb-3">
                    <span className="text-xs font-black text-gray-400">کارتن سفارش داده شده</span>
                    <span className="text-sm font-black text-gray-900 font-mono">{toPersianNum(calcCartons)} کارتن</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] text-gray-400 font-bold">هزینه کل فاکتور</span>
                      <div className="mt-1 flex items-baseline gap-0.5">
                        <span className="text-base font-black text-gray-900 font-mono">{totalCost.toLocaleString()}</span>
                        <span className="text-[8px] text-gray-400">تومان</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] text-gray-400 font-bold">ارزش کل فروش</span>
                      <div className="mt-1 flex items-baseline gap-0.5">
                        <span className="text-base font-black text-gray-900 font-mono">{totalRevenue.toLocaleString()}</span>
                        <span className="text-[8px] text-gray-400">تومان</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] text-emerald-700 font-bold">سود ناخالص شما</span>
                      <div className="mt-1 flex items-baseline gap-0.5">
                        <span className="text-base font-black text-emerald-700 font-mono">{(grossProfit).toLocaleString()}</span>
                        <span className="text-[8px] text-emerald-600">تومان</span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
                      <span className="text-[10px] text-emerald-700 font-bold">بازگشت سرمایه (ROI)</span>
                      <div className="mt-1 flex items-baseline gap-0.5">
                        <span className="text-base font-black text-emerald-600 font-mono">٪{toPersianNum(roiPercent.toFixed(1))}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-2 border-t border-gray-200/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-400">ارزیابی سرمایه‌گذاری:</span>
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border ${rating.color}`}>
                        {rating.label}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onAddToCart(selectedProduct, calcCartons)}
                        className="bg-emerald-600 hover active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/10"
                      >
                        <CheckCircle2 size={14} />
                        افزودن این سبد شبیه‌سازی به پیش‌فاکتور
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Get Custom AI Advice for Selected Pair */}
              {selectedProduct && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="text-emerald-600" size={14} />
                      تحلیل و پیشنهاد بهینه‌سازی سود اختصاصی (هوش مصنوعی)
                    </h4>
                    <button
                      onClick={handleGetCustomAdvice}
                      disabled={adviceLoading}
                      className="text-[11px] font-black text-emerald-700 hover bg-emerald-100 hover px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                    >
                      {adviceLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                      {customAdvice ? "بروزرسانی تحلیل" : "شروع تحلیل هوشمند"}
                    </button>
                  </div>

                  {adviceLoading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-emerald-700">
                      <Loader2 size={16} className="animate-spin" />
                      هوش مصنوعی در حال بررسی بازار بنکداری و محاسبه کشش قیمت مصرف‌کننده است...
                    </div>
                  ) : customAdvice ? (
                    <div className="text-xs text-gray-700 leading-relaxed font-bold space-y-2 whitespace-pre-line bg-white p-4 rounded-xl border border-emerald-200/30">
                      {customAdvice}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 font-bold">با کلیک روی دکمه بالا، هوش مصنوعی سوددهی این کالا را در بازار محلی شبیه‌سازی کرده و راهکارهای افزایش حاشیه سود را به شما ارائه می‌دهد.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Interactive AI B2B Advisor Chat */}
      <div className="lg:col-span-5 flex flex-col h-[650px] bg-white rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
        <div className="p-5 border-b border-slate-800 bg-slate-50/80 backdrop-blur-sm flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500/25 rounded-xl flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <MessageSquare size={16} className="animate-pulse" />
            </div>
            <div className="text-right">
              <h4 className="font-black text-xs text-white">کارشناس هوشمند تجاری دست اول</h4>
              <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">پشتیبانی و مشاوره تخصصی کسب‌وکار ۲۴ ساعته</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-800 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-[8px] text-gray-400 font-bold">برخط (متصل به Gemini)</span>
          </div>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-right">
          {messages.map((m, idx) => (
            <div 
              key={idx} 
              className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'mr-auto items-start' : 'ml-auto items-end'}`}
            >
              <div 
                className={`p-3.5 rounded-2xl text-xs font-bold leading-relaxed shadow-sm whitespace-pre-line ${
                  m.role === 'user' 
                    ? "bg-emerald-600 text-white rounded-tl-none" 
                    : "bg-slate-100 text-slate-100 border border-slate-700/50 rounded-tr-none"
                }`}
              >
                {m.content}
              </div>
              <span className="text-[8px] text-slate-500 mt-1 font-mono">
                {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          {aiLoading && (
            <div className="flex items-center gap-2 bg-slate-100/50 border border-slate-800 text-slate-400 p-3 rounded-2xl text-xs font-bold w-48 mr-auto">
              <Loader2 size={14} className="animate-spin text-emerald-400" />
              در حال نگارش پاسخ...
            </div>
          )}
        </div>

        {/* Suggested Quick Questions */}
        <div className="p-3 bg-slate-50/40 border-t border-slate-800/80 flex gap-2 overflow-x-auto no-scrollbar scrollbar-none">
          {[
            "چه سبدی برای بقالی پرفروش تره؟",
            "تحلیل حاشیه سود مزمز چیپس چیه؟",
            "چگونه خرید مستقیم از کارخانه سود را زیاد میکند؟"
          ].map((q, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1.5 bg-slate-100 hover text-[10px] text-slate-300 border border-slate-700 hover rounded-xl whitespace-nowrap transition-all font-bold"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-800">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex gap-2"
          >
            <input 
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="سوال خود در مورد حاشیه سود یا بازار بنکداری بپرسید..."
              className="flex-1 bg-white border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus focus"
            />
            <button 
              type="submit"
              disabled={aiLoading}
              className="p-2.5 bg-emerald-600 hover active:scale-95 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-emerald-600/10"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
