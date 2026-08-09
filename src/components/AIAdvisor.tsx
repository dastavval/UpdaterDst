import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Bot, Sparkles, User, ArrowLeft } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAdvisorProps {
  mascotUrl?: string;
}

export default function AIAdvisor({ mascotUrl }: AIAdvisorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Message[]>([
    { role: 'assistant', content: 'سلام! من مشاور هوشمند تجاری دست اول هستم. چطور می‌توانم در استراتژی تامین کالا و تحلیل بازار به شما کمک کنم؟' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ai-chat", handleOpen);
    return () => window.removeEventListener("open-ai-chat", handleOpen);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage("");
    setHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history: history.slice(-5) }),
      });

      if (!response.ok) throw new Error("AI call failed");
      
      const data = await response.json();
      setHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error(error);
      setHistory(prev => [...prev, { role: 'assistant', content: "متاسفانه در حال حاضر مشکلی در برقراری ارتباط با هوش مصنوعی وجود دارد. لطفا لحظاتی دیگر تلاش کنید." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-[90px] lg:bottom-32 right-4 lg:right-6 z-[9999] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[calc(100vw-32px)] sm:w-[350px] md:w-[400px] h-[450px] md:h-[500px] bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden ring-1 ring-black/5 pointer-events-auto"
          >
            {/* Header */}
            <div className="p-4 bg-white border-b border-slate-100 text-slate-950 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 shrink-0 rounded-full bg-slate-50 overflow-hidden border border-slate-200 flex items-center justify-center">
                  <img src={mascotUrl || "/assets/mascot_character.jpg"} alt="DastAvval Mascot" className="w-full h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-tight text-slate-900 flex items-center gap-1">
                    <span>مشاور هوشمند دست اول</span>
                    <Sparkles size={11} className="text-emerald-500 animate-pulse" />
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold text-slate-500">تحلیل هوشمند بازار B2B</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Content */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60 scroll-smooth"
              dir="rtl"
            >
              {history.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-3xs ${
                    msg.role === 'user' 
                      ? 'bg-slate-200 text-slate-600' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-[11px] leading-relaxed font-semibold shadow-2xs ${
                    msg.role === 'user' 
                      ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100/80' 
                      : 'bg-emerald-600 text-white rounded-tr-none'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-3xs border border-emerald-100">
                    <Bot size={12} />
                  </div>
                  <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-2xl rounded-tr-none">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-100" />
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3.5 bg-white border-t border-slate-100">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="سوال تجاری یا استعلام قیمت عمده بپرسید..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-right"
                  dir="rtl"
                />
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || isLoading}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={15} className="rotate-180" />
                </button>
              </div>
              
              {/* Quick Support Links inside AI Advisor */}
              <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-bold">
                <span className="text-slate-400">نیاز به تماس انسانی دارید؟</span>
                <div className="flex items-center gap-2">
                  <a href="https://wa.me/989044502900" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">واتساپ</a>
                  <span className="text-slate-300">•</span>
                  <a href="tel:09044502900" className="text-indigo-600 hover:underline">تماس تلفنی</a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-2 justify-center text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                <Sparkles size={8} className="text-emerald-500" />
                <span>قدرت گرفته از هوش مصنوعی Gemini</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Launcher Button (Replaces static support button) */}
      <div className="relative pointer-events-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative z-10 w-11 h-11 rounded-full bg-white hover:bg-slate-50 text-emerald-600 flex items-center justify-center shadow-lg shadow-slate-200 border border-emerald-100 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="مشاور هوشمند تجاری دست اول (پشتیبانی AI)"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X size={18} className="font-black text-slate-600" />
              </motion.div>
            ) : (
              <motion.div
                key="ai-icon"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative flex items-center justify-center"
              >
                <Sparkles size={18} className="text-emerald-500 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Floating Tooltip Label */}
        {!isOpen && (
          <div className="absolute right-13 top-1/2 -translate-y-1/2 bg-white text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md border border-slate-100 hidden sm:flex items-center gap-1 pointer-events-none">
            <Sparkles size={11} className="text-emerald-500" />
            <span>مشاور هوشمند دست اول</span>
          </div>
        )}
      </div>
    </div>
  );
}
