import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VoiceSearchButtonProps {
  onResult: (text: string) => void;
  className?: string;
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({ onResult, className }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hidePermanently, setHidePermanently] = useState(false);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
      setIsSupported(false);
    }
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR'; // Persian
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListening(false);
      
      const isIframe = window.self !== window.top;
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        // If not allowed, especially in an iframe, hide permanently to avoid annoying the user
        setHidePermanently(true);
        if (!isIframe) {
          setError('دسترسی به میکروفون مسدود است.');
        }
      } else if (event.error === 'network') {
        setError('خطای شبکه. لطفاً اتصال اینترنت خود را بررسی کنید.');
      } else if (event.error === 'no-speech') {
        // Just stop listening, no need for scary error
      } else {
        setError('خطایی در تشخیص صدا رخ داد.');
      }
      setTimeout(() => setError(null), 4000);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Recognition start error:', e);
      setIsListening(false);
    }
  };

  if (!isSupported || hidePermanently) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={startListening}
        disabled={isListening}
        className={`p-2 rounded-xl transition-all relative overflow-hidden group cursor-pointer ${
          isListening ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-100'
        } ${className}`}
        title="جستجوی صوتی"
      >
        {isListening ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <Mic className="animate-pulse" size={18} />
          </motion.div>
        ) : (
          <Mic size={18} />
        )}
        
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm"
            />
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl z-50 text-right pointer-events-none"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
