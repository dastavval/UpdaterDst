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
  // If plain mode, render just a beautiful high-contrast Flame icon that matches standard Lucide styles perfectly
  if (plain) {
    return (
      <Flame 
        size={size} 
        className={`stroke-[2.2] filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.1)] ${className} ${animated ? 'animate-pulse scale-105' : ''}`}
      />
    );
  }

  // Standard elegant mode (glowing and beautifully colored, but with correct padding and sizing)
  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      {animated && (
        <span className="absolute -inset-1 rounded-full bg-current opacity-20 blur-xs animate-pulse pointer-events-none" />
      )}
      <Flame 
        size={size} 
        className={`fill-current/10 transition-colors stroke-[2.2] filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.15)] ${animated ? 'animate-fire-sway' : ''} ${className}`}
      />
    </div>
  );
};

export default SpecialPriceBagIcon;
