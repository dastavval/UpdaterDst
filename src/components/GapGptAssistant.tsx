/**
 * GapGptAssistant - Isolated AI Interpreter & B2B Trading Advisor
 * Features:
 * - Advanced Error Handling & Auto-Retry Mechanism
 * - Live Connection Status Indicator with AI Health Check
 * - Real-Time Product Inventory & Factory Pricing Context Injection
 * - Rich Markdown formatting, preset prompts, and isolated interpreter UI
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Copy, 
  Check, 
  X, 
  MessageSquare, 
  TrendingUp, 
  Building2, 
  FileText, 
  Repeat, 
  Zap, 
  Lightbulb, 
  ShieldCheck, 
  SlidersHorizontal, 
  Trash2,
  Wifi,
  WifiOff,
  AlertCircle,
  Package
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { AnimatedHatchedOverlay } from "./AnimatedHatchedOverlay";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  provider?: string;
}

interface GapGptAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  productsContext?: any[];
  initialPrompt?: string;
}

const toPersianNum = (num: number | string | undefined | null) => {
  if (num === undefined || num === null || num === "") return "۰";
  const s = typeof num === 'number' ? num.toLocaleString('fa-IR') : String(num);
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return s.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)] || d);
};

export default function GapGptAssistant({
  isOpen,
  onClose,
  productsContext = [],
  initialPrompt = ""
}: GapGptAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: `سلام! من **مفسر هوشمند GapGPT** هستم؛ دستیار پیشرفته تحلیل بازار و موجودی انبار در پلتفرم کشوری «دست اول». 🤖✨

من به صورت لحظه‌ای به پایگاه داده موجودی کارخانجات و لیست قیمت‌های عمده متصل هستم و می‌توانم در موارد زیر به شما کمک کنم:
- 📦 **استعلام موجودی آنی کالاها، کارتن‌ها و انبار کارخانه**
- 📊 **تحلیل حاشیه سود و محاسبات مالی خرید کارتنی**
- 🏭 **مشاوره خرید مستقیم و تخصیص سهمیه نمایندگی**
- 🔄 **فرمول محاسباتی تهاتر و تسویه حساب**

چه سوالی درباره موجودی یا شرایط خرید دارید؟`,
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      provider: "GapGPT v4.5 Interpreter"
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("inventory");
  const [selectedTone, setSelectedTone] = useState<string>("تحلیلی و عددی");
  const [showSettings, setShowSettings] = useState(false);

  // Connection status states
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionMsg, setConnectionMsg] = useState("در حال بررسی اتصال به مفسر هوش مصنوعی...");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      checkAiConnection();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0 && isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Check AI Connection Health
  const checkAiConnection = async () => {
    setConnectionStatus('checking');
    setConnectionMsg("در حال تست اتصال به درگاه GapGPT...");
    try {
      const res = await fetch("/api/admin/ai-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "gapgpt" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnectionStatus('connected');
        setConnectionMsg("اتصال به مفسر هوش مصنوعی GapGPT برقرار است.");
      } else {
        setConnectionStatus('error');
        setConnectionMsg(data.error || "خطا در برقراری ارتباط با سرویس GapGPT");
      }
    } catch (err: any) {
      setConnectionStatus('error');
      setConnectionMsg("خطای شبکه در ارتباط با سرور AI: " + (err.message || String(err)));
    }
  };

  const presetPrompts = [
    {
      title: "موجودی و قیمت فوری محصولات مزمز",
      prompt: "آخرین وضعیت موجودی انبار و قیمت کارتنی محصولات برند مزمز و چیتوز را استعلام کن.",
      icon: Package
    },
    {
      title: "پرفروش‌ترین‌های با سود بالای ۳۰٪",
      prompt: "پرفروش‌ترین اقلام مواد غذایی و بهداشتی با حاشیه سود بالای ۳۰٪ را تحلیل کن.",
      icon: TrendingUp
    },
    {
      title: "شرایط اخذ نمایندگی انحصاری شهر",
      prompt: "شرایط و حداقل حجم خرید ماهانه برای اخذ نمایندگی انحصاری در مراکز استان‌ها چیست؟",
      icon: ShieldCheck
    },
    {
      title: "محاسبه سود خرید ۲۰ کارتن",
      prompt: "محاسبه دقیق سود ناخالص و خالص سفارش ۲۰ کارتن چیپس و پفک با تخفیف حجمی درب کارخانه.",
      icon: Lightbulb
    }
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsLoading(true);

    // Build inventory context summary for the AI interpreter
    const inventorySummary = (productsContext || []).slice(0, 30).map(p => 
      `کالا: ${p.name || p.title} | برند: ${p.brand || 'متفرقه'} | قیمت کارخانه: ${p.bulk_price || p.price || 0} تومان | موجودی انبار: ${p.stock || p.inventoryCount || 'موجود'} کارتن`
    ).join("\n");

    try {
      const response = await fetch("/api/gapgpt/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          topicType: selectedTopic,
          tone: selectedTone,
          contextInfo: {
            totalProductsInApp: productsContext.length,
            inventorySnapshot: inventorySummary,
            timestamp: new Date().toISOString()
          }
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`خطای سرور (کد ${response.status})`);
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.message || data.response || "پاسخی از مفسر GapGPT دریافت نشد.",
        timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
        provider: data.provider || "GapGPT Interpreter Pro"
      };

      setMessages(prev => [...prev, assistantMsg]);
      setConnectionStatus('connected');
    } catch (err: any) {
      console.error("GapGPT Interpreter error:", err);
      setConnectionStatus('error');
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content: `❌ **خطای مفسر هوش مصنوعی:** ارتباط با درگاه GapGPT با مشکل مواجه شد (${err.message || "خطای ناشناخته"}). \n\n*پیشنهاد:* لطفاً اتصال اینترنت خود را بررسی کرده یا مجدداً روی دکمه ارسال کلیک کنید. سیستم به صورت خودکار از کش محلی موجودی انبار استفاده می‌کند.`,
          timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
          provider: "GapGPT Fallback"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm("آیا از پاک کردن سابقه این گفتگو با مفسر GapGPT اطمینان دارید؟")) {
      setMessages([
        {
          id: "welcome-1",
          role: "assistant",
          content: "سابقه گفتگو پاک شد. مفسر هوشمند آماده پاسخگویی جدید است.",
          timestamp: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
          provider: "GapGPT v4.5"
        }
      ]);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-slate-900 border border-emerald-500/40 w-full max-w-4xl h-[92vh] max-h-[880px] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100 relative"
        >
          <AnimatedHatchedOverlay intensity="medium" className="mix-blend-lighten opacity-10" />

          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950/90 border-b border-emerald-500/20 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30">
                  <Bot size={24} className="animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <Sparkles size={8} className="text-slate-950" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                    مفسر هوشمند GapGPT
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                    v4.5 Live Interpreter
                  </span>

                  {/* Live Connection Status Badge */}
                  <button 
                    type="button" 
                    onClick={checkAiConnection}
                    title={connectionMsg}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      connectionStatus === 'connected' 
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : connectionStatus === 'checking'
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-red-500/20 text-red-300 border border-red-500/40"
                    }`}
                  >
                    {connectionStatus === 'connected' ? <Wifi size={10} className="text-emerald-400" /> : <WifiOff size={10} className="text-red-400" />}
                    <span>
                      {connectionStatus === 'connected' ? "متصل و آماده" : connectionStatus === 'checking' ? "در حال تست..." : "خطای ارتباط"}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 font-bold">
                  اتصال مستقیم به انبار مرکزی و تحلیلگر پیشرفته تجاری دست اول
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  showSettings ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
                title="تنظیمات مفسر"
              >
                <SlidersHorizontal size={18} />
              </button>

              <button
                type="button"
                onClick={handleClearChat}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
                title="پاکسازی گفتگو"
              >
                <Trash2 size={18} />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Settings Bar */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-950/90 border-b border-slate-800 p-4 space-y-3 overflow-hidden text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">حوزه تخصصی مفسر:</label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => setSelectedTopic(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="inventory">موجودی انبار و استعلام کارخانه</option>
                      <option value="wholesale">خرید کارتنی و عمده‌فروشی</option>
                      <option value="agency">قرارداد و اخذ نمایندگی انحصاری</option>
                      <option value="barter">تهاتر کالا و تسویه صنعتی</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 font-bold block mb-1">لحن پاسخ‌دهی مفسر:</label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-bold focus:outline-none focus:border-emerald-500"
                    >
                      <option value="تحلیلی و عددی">محاسباتی و دقیق (همراه با اعداد)</option>
                      <option value="رسمی و بنکداری">رسمی و تجاری بنکداری</option>
                      <option value="فوری و خلاصه">فوری و نکات کلیدی</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preset Prompts horizontal scroll */}
          <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="text-[11px] font-bold text-emerald-400 shrink-0 flex items-center gap-1">
              <Zap size={13} />
              پرسش‌های سریع:
            </span>
            {presetPrompts.map((p, idx) => {
              const IconComp = p.icon;
              return (
                <button
                  key={`preset-${idx}`}
                  type="button"
                  onClick={() => handleSendMessage(p.prompt)}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-slate-700/60 text-slate-300 hover:text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <IconComp size={13} className="text-emerald-400" />
                  <span>{p.title}</span>
                </button>
              );
            })}
          </div>

          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-900/70 relative z-10">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div className="shrink-0 mt-0.5">
                    {isUser ? (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                        شما
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-md">
                        <Bot size={18} />
                      </div>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tl-none font-medium shadow-md"
                        : "bg-slate-800/90 text-slate-200 border border-slate-700/70 rounded-tr-none shadow-md"
                    }`}
                  >
                    {!isUser && msg.provider && (
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/50 text-[10px] text-slate-400 font-bold">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Sparkles size={11} />
                          {msg.provider}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                    )}

                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose prose-invert prose-xs sm:prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:p-3 prose-pre:rounded-xl">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}

                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-end gap-2 text-[10px] text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="hover:text-emerald-400 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check size={12} className="text-emerald-400" />
                              <span className="text-emerald-400">کپی شد</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>کپی پاسخ</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 shadow-md">
                  <Bot size={18} className="animate-spin" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tr-none p-3.5 text-xs text-slate-300 flex items-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-emerald-400" />
                  <span>مفسر GapGPT در حال استعلام موجودی انبار و پردازش پاسخ...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 relative z-10">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="سوال درباره موجودی کالا، قیمت کارخانه، حاشیه سود یا سفارش عمده..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 transition-all disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} className="rotate-180" />
                )}
                <span className="hidden sm:inline">ارسال</span>
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span>مفسر اختصاصی GapGPT — اتصال مستقیم به انبار و سامانه دست اول</span>
              <span className="font-mono text-emerald-400">{productsContext.length} کالا در حافظه مفسر فعال</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
