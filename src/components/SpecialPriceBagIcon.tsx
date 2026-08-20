import React from 'react';
import { Flame } from 'lucide-react';

interface SpecialPriceBagIconProps {
  size?: number;
  className?: string;
  animated?: boolean;
  plain?: boolean;
  showBadge?: boolean;
  badgeSize?: number;
}

export const SpecialPriceBagIcon: React.FC<SpecialPriceBagIconProps> = ({
  size = 18,
  className = '',
  animated = true,
  plain = false,
}) => {
  if (plain) {
    return (
      <Flame 
        size={size} 
        className={`stroke-red-600 fill-amber-400 stroke-[2.2] filter drop-shadow-[0_2px_4px_rgba(239,68,68,0.2)] ${className} ${animated ? 'animate-bounce scale-105' : ''}`}
      />
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center shrink-0 p-1 bg-gradient-to-br from-rose-50 to-amber-50 rounded-xl shadow-xs border border-rose-200/80">
      {animated && (
        <>
          <span className="absolute inset-0 rounded-xl bg-rose-400 opacity-20 blur-xs animate-pulse" />
          <span className="absolute -inset-1 rounded-xl bg-amber-400/30 opacity-30 blur-xs animate-ping pointer-events-none" />
        </>
      )}
      <div className="relative z-10 flex items-center justify-center">
        <Flame 
          size={size} 
          className={`stroke-red-600 fill-amber-500 transition-colors stroke-[2.2] filter drop-shadow-[0_1px_3px_rgba(239,68,68,0.4)] ${animated ? 'animate-fire-sway' : ''} ${className}`}
        />
        {/* Inner Core */}
        <div className="absolute inset-0 flex items-center justify-center opacity-70">
           <Flame size={size * 0.55} className="fill-amber-300 stroke-red-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default SpecialPriceBagIcon;
