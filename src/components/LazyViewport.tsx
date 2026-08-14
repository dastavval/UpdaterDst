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
  rootMargin = "250px"
}: LazyViewportProps) {
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasIntersected) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasIntersected(true);
        }
      },
      {
        rootMargin,
        threshold: 0.01
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
      className={className}
      style={!hasIntersected ? { minHeight: typeof height === "number" ? `${height}px` : height } : undefined}
    >
      {hasIntersected ? children : null}
    </div>
  );
}
