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
        className={`stroke-red-600 fill-orange-500 stroke-[2.2] filter drop-shadow-[0_2px_4px_rgba(239,68,68,0.25)] ${className} ${animated ? 'animate-bounce scale-105' : ''}`}
      />
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center shrink-0 p-1.5 bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl shadow-2xs border border-orange-200">
      {animated && (
        <>
          <span className="absolute inset-0 rounded-xl bg-rose-500 opacity-20 blur-xs animate-pulse" />
          <span className="absolute -inset-1 rounded-xl bg-amber-500/20 opacity-30 blur-xs animate-ping pointer-events-none" />
        </>
      )}
      <div className="relative z-10 flex items-center justify-center">
        <Flame 
          size={size} 
          className={`stroke-red-600 fill-rose-500 transition-colors stroke-[2.2] filter drop-shadow-[0_1px_4px_rgba(239,68,68,0.4)] ${animated ? 'animate-fire-sway' : ''} ${className}`}
        />
        {/* Inner Core */}
        <div className="absolute inset-0 flex items-center justify-center opacity-85">
           <Flame size={size * 0.55} className="fill-amber-300 stroke-red-500 animate-pulse" />
         </div>
      </div>
    </div>
  );
};

export default SpecialPriceBagIcon;
