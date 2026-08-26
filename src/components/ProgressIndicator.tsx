import React from 'react';

interface ProgressIndicatorProps {
  current: number;
  total: number;
  message: string;
}

export default function ProgressIndicator({ current, total, message }: ProgressIndicatorProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;
  
  return (
    <div className="bg-white border border-slate-200 text-slate-900 p-5 rounded-3xl shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
        <div>
          <p className="text-xs font-black text-slate-900">{message}</p>
          <p className="text-[10px] text-slate-500 font-bold">
            پیشرفت: {current} از {total}
          </p>
        </div>
      </div>
      <div className="w-40 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
        <div 
          className="bg-emerald-600 h-full transition-all duration-300 rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
