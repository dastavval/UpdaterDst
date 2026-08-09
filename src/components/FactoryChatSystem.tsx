import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  MessageSquare, 
  Phone, 
  CheckCheck, 
  Sparkles, 
  DollarSign, 
  FileText, 
  Paperclip, 
  Mic, 
  Clock, 
  ShieldCheck, 
  Building2, 
  ShoppingBag, 
  Check, 
  AlertCircle, 
  User, 
  Zap,
  TrendingDown,
  ArrowRight,
  Download,
  FileCheck,
  ChevronDown
} from "lucide-react";
import { FactoryProfile, Product } from "../types";

export interface ChatMessage {
  id: string;
  sender: 'user' | 'factory';
  senderName: string;
  text?: string;
  timestamp: string;
  type?: 'text' | 'price_offer' | 'voice' | 'file' | 'system';
  offerDetails?: {
    productName: string;
    quantityCartons: number;
    offeredPricePerCarton: number;
    originalPricePerCarton: number;
    paymentTerm: string;
    status: 'pending' | 'accepted' | 'countered' | 'rejected';
    counterPrice?: number;
  };
  fileDetails?: {
    name: string;
    size: string;
    type: string;
  };
  audioDuration?: string;
}

interface FactoryChatSystemProps {
  factory: FactoryProfile;
  products?: Product[];
  onSelectProductForOrder?: (product: Product) => void;
  onDirectOrderFactory?: (factoryName: string) => void;
  userBadge?: string;
  user?: any;
}

export default function FactoryChatSystem({
  factory,
  products = [],
  onSelectProductForOrder,
  onDirectOrderFactory,
  userBadge,
  user
}: FactoryChatSystemProps) {
  const chatStorageKey = `dastavval_factory_chat_${factory.id}`;

  // Initial messages if no history
  const defaultMessages: ChatMessage[] = [
    {
      id: "msg-system-1",
      sender: "factory",
      senderName: `مدیریت فروش ${factory.name}`,
      text: `سلام! به کانال گفتگو و چانه‌زنی مستقیم ${factory.name} خوش آمدید. من مهندس رضایی، مدیر فروش عمده هستم. می‌توانید پیشنهادات قیمت، شرایط تسویه اعتباری و استعلام موجودی خود را مستقیماً ارسال کنید.`,
      timestamp: "۱۰:۳۰",
      type: "text"
    }
  ];

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(chatStorageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    return defaultMessages;
  });

  const [inputText, setInputText] = useState("");
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);

  // Offer Form state
  const factoryProducts = products.filter(p => 
    p.sellerName?.toLowerCase().includes(factory.name.toLowerCase()) ||
    factory.name?.toLowerCase().includes(p.brand?.toLowerCase() || '') ||
    factory.mainProducts?.some(mp => p.name.includes(mp) || mp.includes(p.name))
  );

  const selectedProductDef = factoryProducts[0] || (products[0] ? products[0] : null);

  const [selectedProductId, setSelectedProductId] = useState<string>(selectedProductDef?.id || "");
  const [offerQuantity, setOfferQuantity] = useState<number>(50);
  const [offerPrice, setOfferPrice] = useState<number>(
    selectedProductDef ? Math.round(selectedProductDef.price * 0.93) : 100000
  );
  const [paymentTerm, setPaymentTerm] = useState<string>("تسویه نقدی (تخفیف ویژه)");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(chatStorageKey, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  }, [messages, chatStorageKey]);

  // Update offer price when product selection changes
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setOfferPrice(Math.round(prod.price * 0.93));
    }
  };

  // Send Text Message
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      senderName: "خریدار عمده (شما)",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      type: "text"
    };

    setMessages(prev => [...prev, newMsg]);
    if (!textToSend) setInputText("");

    // Simulate factory response
    triggerFactoryReply(text);
  };

  // Trigger automated/smart factory rep reply
  const triggerFactoryReply = (userQuery: string) => {
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let replyText = "پیام شما دریافت شد. واحد حسابداری و ثبت سفارشات کارخانه در حال بررسی درخواستی شما هستند.";

      const lower = userQuery.toLowerCase();
      if (lower.includes("تخفیف") || lower.includes("قیمت")) {
        replyText = "برای خریدهای نقدی بالای ۵۰ کارتن، امکان اعمال تخفیف تا ۵٪ و ارسال رایگان تا باربری مقصد وجود دارد. پیشنهاد رسمی قیمت خود را از دکمه «ثبت پیشنهاد چانه‌زنی» بفرستید تا فوراً تایید کنم.";
      } else if (lower.includes("تحویل") || lower.includes("زمان") || lower.includes("بار")) {
        replyText = "تمامی کالاهای خط تولید آماده بارگیری ریلی و جاده‌ای هستند. پس از تایید فاکتور، حداکثر ظرف ۲۴ الی ۴۸ ساعت بارگیری انجام می‌شود.";
      } else if (lower.includes("نمونه") || lower.includes("سمپل")) {
        replyText = "امکان ارسال پکیج نمونه (سمپل کالا) با پست پیشتاز برای بنکداران و فروشگاه‌های سراسر کشور فراهم است. آدرس و کد پستی خود را ارسال فرمایید.";
      } else if (lower.includes("چک") || lower.includes("اعتباری")) {
        replyText = "برای بنکداران دارای پروانه کسب معتبر، شرایط پرداخت ۵۰٪ نقدی و ۵۰٪ چک صیادی ۳۰ روزه پس از اعتبارسنجی مقدور می‌باشد.";
      }

      const factoryMsg: ChatMessage = {
        id: `msg-factory-${Date.now()}`,
        sender: "factory",
        senderName: `مهندس رضایی (مدیر فروش ${factory.name})`,
        text: replyText,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        type: "text"
      };

      setMessages(prev => [...prev, factoryMsg]);
    }, 1800);
  };

  // Send Formal B2B Offer
  const handleSendOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId) || selectedProductDef;
    if (!prod) return;

    const offerMsg: ChatMessage = {
      id: `offer-${Date.now()}`,
      sender: "user",
      senderName: "خریدار عمده (شما)",
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      type: "price_offer",
      offerDetails: {
        productName: prod.name,
        quantityCartons: Number(offerQuantity),
        offeredPricePerCarton: Number(offerPrice),
        originalPricePerCarton: prod.price,
        paymentTerm: paymentTerm,
        status: "pending"
      }
    };

    setMessages(prev => [...prev, offerMsg]);
    setShowOfferModal(false);

    // Factory auto response to offer
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const isAccepted = Number(offerPrice) >= prod.price * 0.90;
      const counterPrice = Math.round(prod.price * 0.94);

      if (isAccepted) {
        // Update the offer status in state
        setMessages(prev => prev.map(m => {
          if (m.id === offerMsg.id && m.offerDetails) {
            return {
              ...m,
              offerDetails: { ...m.offerDetails, status: 'accepted' }
            };
          }
          return m;
        }));

        const acceptMsg: ChatMessage = {
          id: `msg-factory-${Date.now()}`,
          sender: "factory",
          senderName: `مدیریت فروش ${factory.name}`,
          text: `🎉 پیشنهاد شما تایید شد! قیمت پیشنهادی ${Number(offerPrice).toLocaleString('fa-IR')} تومان برای ${offerQuantity} کارتن محصول «${prod.name}» مورد موافقت قرار گرفت. پیش‌فاکتور رسمی برای شما صادر شد.`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          type: "text"
        };
        setMessages(prev => [...prev, acceptMsg]);
      } else {
        setMessages(prev => prev.map(m => {
          if (m.id === offerMsg.id && m.offerDetails) {
            return {
              ...m,
              offerDetails: { ...m.offerDetails, status: 'countered', counterPrice: counterPrice }
            };
          }
          return m;
        }));

        const counterMsg: ChatMessage = {
          id: `msg-factory-${Date.now()}`,
          sender: "factory",
          senderName: `مهندس رضایی (مدیر فروش ${factory.name})`,
          text: `با تشکر از پیشنهاد شما. قیمت پیشنهادی شما کمی پایین‌تر از حاشیه سود کارخانه است. اما با توجه به حجم ${offerQuantity} کارتنی، قیمت پیشنهادی متقابل کارخانه برابر با ${counterPrice.toLocaleString('fa-IR')} تومان به ازای هر کارتن می‌باشد.`,
          timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          type: "text"
        };
        setMessages(prev => [...prev, counterMsg]);
      }
    }, 2200);
  };

  // Send Simulated Voice Message
  const handleSendVoiceNote = () => {
    const voiceMsg: ChatMessage = {
      id: `voice-${Date.now()}`,
      sender: "user",
      senderName: "خریدار عمده (شما)",
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      type: "voice",
      audioDuration: "۰:۲۴"
    };

    setMessages(prev => [...prev, voiceMsg]);

    setTimeout(() => {
      triggerFactoryReply("صوتی درباره درخواست ثبت سفارش کلان");
    }, 1000);
  };

  // Quick Action Buttons
  const quickActions = [
    { label: "درخواست تخفیف خرید حجمی", query: "درخواست تخفیف خرید حجمی برای سفارش بالای ۱۰۰ کارتن دارم." },
    { label: "استعلام زمان تحویل و ارسال بار", query: "زمان دقیق بارگیری و تحویل کالا به شهرستان چقدر است؟" },
    { label: "درخواست ارسال نمونه کالا (سمپل)", query: "شرایط ارسال نمونه کالا (سمپل) برای بررسی کیفیت چیست؟" },
    { label: "پرداخت چک صیادی ۳۰ تا ۶۰ روزه", query: "امکان خرید اعتباری با ارائه چک صیادی وجود دارد؟" }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[680px] font-sans text-right" dir="rtl">
      {/* CHAT HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-500/20">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg overflow-hidden border border-emerald-400">
              <img 
                src={factory.logoUrl || factory.logo || "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=100&q=80"} 
                alt={factory.name} 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" title="آنلاین" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">{factory.name}</h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                <ShieldCheck size={12} />
                <span>واحد فروش تاییدشده</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
              <User size={12} className="text-emerald-400" />
              <span>مهندس رضایی (مدیر فروش عمده)</span>
              <span className="text-emerald-400 font-bold">• پاسخگویی سریع</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOfferModal(true)}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingDown size={15} />
            <span className="hidden sm:inline">ثبت پیشنهاد چانه‌زنی</span>
            <span className="sm:hidden">پیشنهاد</span>
          </button>

          {(() => {
            const isVIP = userBadge === 'vip' || userBadge === 'admin';
            if (isVIP) {
              return (
                <a
                  href={`tel:${factory.contactPhone || "۰۹۱۲۱۱۱۱۱۱۱"}`}
                  className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl backdrop-blur-md transition-all flex items-center justify-center"
                  title={`تماس مستقیم با مدیر فروش (${factory.contactPhone || "۰۹۱۲۱۱۱۱۱۱۱"})`}
                >
                  <Phone size={16} className="text-emerald-400" />
                </a>
              );
            } else {
              return (
                <button
                  type="button"
                  onClick={() => {
                    alert("🔒 همکار گرامی، اطلاعات تماس مستقیم کارخانجات جهت حفظ امنیت اطلاعات تجاری، منحصراً برای اعضای VIP فعال می‌باشد. شما می‌توانید رتبه کاربری خود را در پنل مدیریت به VIP تغییر دهید تا شماره‌ها فعال شوند.");
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl backdrop-blur-md transition-all flex items-center justify-center cursor-pointer"
                  title="نیاز به عضویت VIP"
                >
                  <Phone size={16} className="text-purple-400 blur-[1.5px]" />
                </button>
              );
            }
          })()}
        </div>
      </div>

      {/* QUICK NEGOTIATION CHIPS BAR */}
      <div className="bg-slate-50 p-2.5 border-b border-slate-200 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
        <span className="text-[11px] font-black text-slate-400 whitespace-nowrap pl-1 shrink-0 flex items-center gap-1">
          <Zap size={13} className="text-amber-500" />
          <span>موضوعات سریع:</span>
        </span>
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(action.query)}
            className="bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 text-[11px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* MESSAGES THREAD */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-bold text-slate-400">
                <span>{msg.senderName}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Standard Text Message */}
              {msg.type === 'text' && (
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-emerald-600 text-white rounded-tl-none"
                      : "bg-white text-slate-800 border border-slate-200/90 rounded-tr-none"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
              )}

              {/* B2B Price Offer Card */}
              {msg.type === 'price_offer' && msg.offerDetails && (
                <div className={`max-w-[90%] sm:max-w-[80%] bg-white rounded-3xl p-4 border-2 ${
                  msg.offerDetails.status === 'accepted'
                    ? "border-emerald-500 shadow-emerald-100 shadow-lg"
                    : msg.offerDetails.status === 'countered'
                    ? "border-amber-500 shadow-amber-100 shadow-lg"
                    : "border-slate-300 shadow-md"
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                        <TrendingDown size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">پیشنهاد رسمی چانه‌زنی قیمت</h4>
                        <span className="text-[10px] font-bold text-slate-400">درخواست تخفیف عمده</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      msg.offerDetails.status === 'accepted'
                        ? "bg-emerald-100 text-emerald-800"
                        : msg.offerDetails.status === 'countered'
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {msg.offerDetails.status === 'accepted' && '✓ پذیرفته شد'}
                      {msg.offerDetails.status === 'countered' && '⚡ پیشنهاد متقابل کارخانه'}
                      {msg.offerDetails.status === 'pending' && '⏳ در حال بررسی واحد فروش'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <p className="flex justify-between">
                      <span className="text-slate-500">نام کالا:</span>
                      <strong className="text-slate-900 font-black">{msg.offerDetails.productName}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">حجم سفارش:</span>
                      <strong className="text-emerald-700 font-black">{msg.offerDetails.quantityCartons} کارتن</strong>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-500">قیمت اصلی خط تولید:</span>
                      <span className="line-through text-slate-400">{msg.offerDetails.originalPricePerCarton.toLocaleString('fa-IR')} تومان</span>
                    </p>
                    <p className="flex justify-between text-sm">
                      <span className="text-slate-700 font-bold">قیمت پیشنهادی شما:</span>
                      <strong className="text-emerald-800 font-black">{msg.offerDetails.offeredPricePerCarton.toLocaleString('fa-IR')} تومان</strong>
                    </p>
                    {msg.offerDetails.counterPrice && (
                      <p className="flex justify-between text-sm bg-amber-100/70 p-2 rounded-xl text-amber-950 font-black mt-1">
                        <span>قیمت متقابل کارخانه:</span>
                        <span>{msg.offerDetails.counterPrice.toLocaleString('fa-IR')} تومان</span>
                      </p>
                    )}
                    <p className="flex justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500">شرایط تسویه:</span>
                      <span className="text-slate-800 font-bold">{msg.offerDetails.paymentTerm}</span>
                    </p>
                  </div>

                  {msg.offerDetails.status === 'accepted' && onDirectOrderFactory && (
                    <button
                      onClick={() => onDirectOrderFactory(factory.name)}
                      className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag size={15} />
                      <span>ثبت سفارش نهایی بر اساس این توافق</span>
                    </button>
                  )}
                </div>
              )}

              {/* Voice Message Bubble */}
              {msg.type === 'voice' && (
                <div className={`p-3 rounded-2xl border ${isUser ? 'bg-emerald-600 text-white' : 'bg-white text-slate-800 border-slate-200'} flex items-center gap-3 w-56 shadow-sm`}>
                  <button 
                    onClick={() => setIsPlayingAudio(isPlayingAudio === msg.id ? null : msg.id)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer font-black ${isUser ? 'bg-white text-emerald-700' : 'bg-emerald-600 text-white'}`}
                  >
                    {isPlayingAudio === msg.id ? "❚❚" : "▶"}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className={`h-full bg-emerald-400 ${isPlayingAudio === msg.id ? 'w-2/3 animate-pulse' : 'w-0'}`} />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold opacity-80">
                      <span>پیام صوتی</span>
                      <span>{msg.audioDuration || "۰:۱۸"}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-slate-400 text-xs font-bold p-2 bg-white rounded-2xl w-fit border border-slate-200 shadow-2xs">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-100" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce delay-200" />
            <span className="text-[11px] text-slate-500">مدیر فروش در حال نوشتن پاسخ...</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* CHAT INPUT FORM */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleSendVoiceNote}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all cursor-pointer"
            title="ارسال پیام صوتی"
          >
            <Mic size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowOfferModal(true)}
            className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-2xl transition-all cursor-pointer flex items-center gap-1 font-black text-xs shrink-0"
            title="ثبت فرم پیشنهاد قیمت"
          >
            <TrendingDown size={16} />
            <span className="hidden sm:inline">فرم چانه‌زنی</span>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="پیام یا استعلام خود را بنویسید..."
            className="flex-1 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-md cursor-pointer shrink-0"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </form>
      </div>

      {/* MODAL FOR B2B NEGOTIATION FORM */}
      <AnimatePresence>
        {showOfferModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full text-right space-y-5 shadow-2xl border border-slate-100 relative"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">فرم چانه‌زنی و پیشنهاد رسمی قیمت</h3>
                    <p className="text-[11px] text-slate-500 font-bold">ارسال مستقیم به کارخانه {factory.name}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowOfferModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendOffer} className="space-y-4">
                {/* Select Product */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">انتخاب کالا:</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - قیمت اصلی: {p.price.toLocaleString('fa-IR')} تومان
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">حجم سفارش (کارتن):</label>
                    <input
                      type="number"
                      min={10}
                      value={offerQuantity}
                      onChange={(e) => setOfferQuantity(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1">قیمت پیشنهادی هر کارتن (تومان):</label>
                    <input
                      type="number"
                      step={5000}
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Payment Term */}
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">شرایط پرداخت پیشنهادی:</label>
                  <select
                    value={paymentTerm}
                    onChange={(e) => setPaymentTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="تسویه نقدی (تخفیف ویژه)">تسویه کاملاً نقدی پیش از بارگیری (حداکثر تخفیف)</option>
                    <option value="۵۰٪ نقدی / ۵۰٪ چک صیادی ۳۰ روزه">۵۰٪ نقدی / ۵۰٪ چک صیادی ۳۰ روزه</option>
                    <option value="چک صیادی ۴۵ روزه">چک صیادی ۴۵ روزه با ضمانت بنکداری</option>
                  </select>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 font-medium space-y-1">
                  <p className="font-black flex items-center gap-1">
                    <Zap size={14} className="text-amber-600" />
                    <span>نکته چانه‌زنی:</span>
                  </p>
                  <p>پیشنهاد شما مستقیم روی دسکتاپ مدیر فروش کارخانه ارسال می‌شود و پس از بررسی، پاسخ تایید یا قیمت متقابل ثبت خواهد شد.</p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    ارسال پیشنهاد به کارخانه
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOfferModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
