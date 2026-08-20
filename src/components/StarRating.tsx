import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating?: number;
  onRate?: (newRating: number) => void;
  size?: number;
  interactive?: boolean;
  showScore?: boolean;
  count?: number;
  showCount?: boolean;
  className?: string;
}

export default function StarRating({
  rating = 5,
  onRate,
  size = 15,
  interactive = true,
  showScore = true,
  count,
  showCount = false,
  className = ""
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userRated, setUserRated] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);

  const displayRating = hoverRating !== null ? hoverRating : (userRated !== null ? userRated : rating);

  const handleStarClick = (starValue: number) => {
    if (!interactive) return;
    setUserRated(starValue);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    if (onRate) {
      onRate(starValue);
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star, idx) => {
          const isFilled = star <= Math.round(displayRating);
          return (
            <button
              key={`star-rating-btn-${star}-${idx}`}
              type="button"
              disabled={!interactive}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(null)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
              title={`امتیاز ${star} از ۵`}
            >
              <Star
                size={size}
                className={`${
                  isFilled 
                    ? "fill-amber-400 text-amber-400 drop-shadow-xs" 
                    : "text-slate-300 fill-slate-100"
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>

      {showScore && (
        <span className="text-[10px] font-black font-mono text-slate-700">
          {(displayRating).toFixed(1)}
        </span>
      )}

      {showCount && count !== undefined && (
        <span className="text-[9px] font-bold text-slate-400">
          ({count.toLocaleString("fa-IR")})
        </span>
      )}

      {showToast && (
        <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md animate-bounce">
          امتیاز ثبت شد! ⭐
        </span>
      )}
    </div>
  );
}
