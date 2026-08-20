import React, { useState, useEffect, useRef } from "react";

interface LazyViewportProps {
  children: React.ReactNode;
  height?: number | string;
  className?: string;
  rootMargin?: string;
}

export default function LazyViewport({
  children,
  height = "320px",
  className = "",
  rootMargin = "1200px" // Increased significantly to prevent white flickering
}: LazyViewportProps) {
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Slight delay to ensure layout is ready
          setHasIntersected(true);
        }
      },
      {
        rootMargin,
        threshold: 0.001 // More sensitive
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [hasIntersected, rootMargin]);

  return (
    <div
      ref={ref}
      className={`${className} transition-opacity duration-700 ${hasIntersected ? 'opacity-100' : 'opacity-0'}`}
      style={{ 
        minHeight: !hasIntersected ? (typeof height === "number" ? `${height}px` : height) : undefined,
        containIntrinsicSize: typeof height === "number" ? `auto ${height}px` : `auto 320px`,
        contentVisibility: "auto"
      }}
    >
      {hasIntersected ? children : null}
    </div>
  );
}
