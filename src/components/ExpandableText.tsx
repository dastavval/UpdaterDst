import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxChars?: number;
  maxLines?: number;
  className?: string;
  scrollableIfLong?: boolean;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxChars = 140,
  className = "text-xs font-medium text-slate-600 leading-relaxed",
  scrollableIfLong = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const isLong = text.length > maxChars;

  if (!isLong) {
    return <p className={className}>{text}</p>;
  }

  const displayText = isExpanded ? text : text.slice(0, maxChars) + "...";

  return (
    <div className="space-y-1.5">
      <div className={`transition-all ${isExpanded && scrollableIfLong ? 'max-h-52 overflow-y-auto pr-1' : ''}`}>
        <p className={className}>{displayText}</p>
      </div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer border border-emerald-200/60"
      >
        <span>{isExpanded ? "بستن متن" : "مشاهده کامل متن"}</span>
        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>
    </div>
  );
};

export default ExpandableText;
