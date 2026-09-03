import React from 'react';

export const AnimatedHatchedOverlay: React.FC<{ className?: string, intensity?: 'light' | 'medium' | 'strong' }> = ({ className = '', intensity = 'light' }) => {
  const opacity = intensity === 'light' ? 'opacity-[0.03]' : intensity === 'medium' ? 'opacity-[0.06]' : 'opacity-10';

  return (
    <div 
      className={`absolute inset-0 z-0 pointer-events-none rounded-[inherit] overflow-hidden ${className}`}
    >
      <div 
        className={`absolute inset-0 w-[200%] h-[200%] ${opacity} mix-blend-overlay`}
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 10px)',
          animation: 'hatchSlide 20s linear infinite',
        }}
      />
      {/* Light gradient mask to make it look a bit more polished/subtle towards edges if needed, though raw diagonal is requested */}
      <style>{`
        @keyframes hatchSlide {
          from {
            transform: translate(0, 0);
          }
          to {
            transform: translate(-50px, -50px);
          }
        }
      `}</style>
    </div>
  );
};
