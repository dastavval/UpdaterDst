import React from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  message: string;
}

export default function ProgressIndicator({ current, total, message }: ProgressIndicatorProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-3xl shadow-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <div>
          <p className="text-xs font-black">{message}</p>
          <p className="text-[10px] text-blue-100">
            پیشرفت: {current} از {total}
          </p>
        </div>
      </div>
      <div className="w-40 bg-white/20 h-2.5 rounded-full overflow-hidden">
        <div 
          className="bg-white h-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
