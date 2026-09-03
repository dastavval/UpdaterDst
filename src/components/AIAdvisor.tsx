import React, { useState, useEffect } from "react";
import { Phone, Sparkles, X, MessageSquare, Headphones, Lock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import GapGptAssistant from "./GapGptAssistant";
import UserTicketModal from "./UserTicketModal";

interface AIAdvisorProps {
  mascotUrl?: string; // Kept to prevent TypeScript prop mismatch in App.tsx
  productsContext?: any[];
  user?: any;
}

export default function AIAdvisor({ mascotUrl, productsContext = [], user }: AIAdvisorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGapGptOpen, setIsGapGptOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const supportPhone = "09999123001";

  // Global event listener to open ticket modal from any component
  useEffect(() => {
    const handleOpenTicketEvent = (e: any) => {
      setIsTicketModalOpen(true);
      setIsMenuOpen(false);
    };
    window.addEventListener("dastavval-open-ticket-modal", handleOpenTicketEvent);
    return () => window.removeEventListener("dastavval-open-ticket-modal", handleOpenTicketEvent);
  }, []);

  const handleCall = () => {
    window.location.href = `tel:${supportPhone}`;
    setIsMenuOpen(false);
  };

  const handleOpenGapGpt = () => {
    setIsGapGptOpen(true);
    setIsMenuOpen(false);
  };

  const handleOpenTicket = () => {
    setIsTicketModalOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Floating Creative Widget Container */}
      <div className="fixed bottom-22 right-4 sm:bottom-24 sm:right-6 lg:bottom-8 lg:right-8 z-50 flex flex-col items-end pointer-events-none" dir="rtl">
        
        {/* Expanded Options Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="mb-3 w-80 bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-4 shadow-2xl border border-emerald-500/30 pointer-events-auto flex flex-col gap-2.5 relative overflow-hidden"
            >
              {/* Decorative cybernetic background lines */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/5 pointer-events-none" />
              
              <div className="flex items-center justify-between pb-2 border-b border-white/10 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Headphones size={14} className="text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-black text-emerald-400">مرکز ارتباط، تیکت و مشاور هوشمند</span>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 hover:bg-white/10 text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Path 1: Ticket & Live Chat with Admin */}
              <button
                onClick={handleOpenTicket}
                className="relative z-10 w-full p-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 text-white transition-all text-right cursor-pointer flex items-center justify-between gap-3 border border-emerald-400/40 shadow-lg group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/20">
                    <MessageSquare size={18} className="text-white group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black">چت و ارسال تیکت به ادمین</span>
                      <span className="bg-amber-400 text-slate-950 text-[8.5px] font-black px-1.5 py-0.2 rounded-full">جدید</span>
                    </div>
                    <span className="text-[9.5px] text-emerald-100 mt-0.5">استعلام قیمت، مذاکره محرمانه و پیگیری بار</span>
                  </div>
                </div>
                <ShieldCheck size={16} className="text-emerald-300" />
              </button>

              {/* Path 2: GapGPT AI */}
              <button
                onClick={handleOpenGapGpt}
                className="relative z-10 w-full p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white transition-all text-right cursor-pointer flex items-center justify-between gap-3 border border-white/10 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <Headphones size={18} className="text-emerald-400 group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black">گفتگو با ربات هوشمند GapGPT</span>
                    <span className="text-[9.5px] text-slate-300 mt-0.5">مشاوره هوشمند حاشیه سود و سبد پخش</span>
                  </div>
                </div>
                <Sparkles size={14} className="text-amber-300 animate-pulse" />
              </button>

              {/* Path 3: Direct Phone Support */}
              <button
                onClick={handleCall}
                className="relative z-10 w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all text-right cursor-pointer flex items-center justify-between gap-3 border border-white/5 group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <Phone size={16} className="text-amber-400 group-hover:animate-bounce" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black">تماس با پشتیبانی تلفنی</span>
                    <span className="text-[9.5px] text-slate-400 mt-0.5">خط ویژه بازرگانی کارخانجات</span>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold bg-white/10 text-amber-300 px-2 py-0.5 rounded-md border border-white/5">
                  {supportPhone}
                </span>
              </button>

              {/* Nudge Footer */}
              <div className="text-center text-[8.5px] text-slate-400 font-bold mt-0.5 flex items-center justify-center gap-1">
                <Lock size={10} className="text-amber-400" />
                <span>اطلاعات تماس تامین‌کنندگان و خریداران کاملاً محرمانه است.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Floating Trigger Orb */}
        <div className="relative pointer-events-auto">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`relative z-10 w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer border ${
              isMenuOpen 
                ? "bg-slate-800 border-slate-700" 
                : "bg-emerald-600 hover:bg-emerald-700 border-emerald-500 hover:scale-105 active:scale-95"
            }`}
            title="پشتیبانی، تیکت و دستیار هوشمند"
          >
            {isMenuOpen ? (
              <X size={20} className="text-white" />
            ) : (
              <Headphones size={22} className="text-white" />
            )}
          </button>

          {/* Simple Hover Tooltip when menu is NOT open */}
          {!isMenuOpen && (
            <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md border border-slate-800 hidden sm:flex items-center gap-1.5 pointer-events-none">
              <span>پشتیبانی، تیکت و دستیار هوشمند</span>
            </div>
          )}
        </div>
      </div>

      {/* GapGPT Modal */}
      <GapGptAssistant
        isOpen={isGapGptOpen}
        onClose={() => setIsGapGptOpen(false)}
        productsContext={productsContext}
      />

      {/* User Support Ticket & Chat with Admin Modal */}
      <UserTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        currentUserPhone={user?.phone || user?.mobile}
        currentUserName={user?.name}
      />
    </>
  );
}
