"use client";

import { useRef, useEffect, useState, ReactNode } from "react";

interface AutoScrollProps {
  children: ReactNode;
  maxHeight: string;
  duration?: number; // Total scroll cycle duration in seconds
  className?: string;
}

export function AutoScroll({
  children,
  maxHeight,
  duration = 20, // Default 20 second cycle
  className = "",
}: AutoScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsScroll, setNeedsScroll] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  // Check if scrolling is needed
  useEffect(() => {
    const checkOverflow = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      const containerHeight = container.clientHeight;
      const contentHeight = content.scrollHeight;

      setNeedsScroll(contentHeight > containerHeight + 20);

      // Calculate scroll percentage needed
      if (contentHeight > containerHeight) {
        const scrollNeeded = contentHeight - containerHeight;
        setScrollPercent((scrollNeeded / contentHeight) * 100);
      }
    };

    // Check after render
    const timeout = setTimeout(checkOverflow, 500);

    // Observe size changes
    const observer = new ResizeObserver(checkOverflow);
    if (contentRef.current) {
      observer.observe(contentRef.current);
    }

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [children]);

  // Generate unique animation name
  const animationName = `autoScroll-${Math.round(scrollPercent)}`;

  return (
    <div
      ref={containerRef}
      className={`${className} overflow-hidden relative`}
      style={{ maxHeight }}
    >
      <style>
        {needsScroll ? `
          @keyframes ${animationName} {
            0%, 15% { transform: translateY(0); }
            45%, 55% { transform: translateY(-${scrollPercent}%); }
            85%, 100% { transform: translateY(0); }
          }
        ` : ''}
      </style>
      <div
        ref={contentRef}
        style={needsScroll ? {
          animation: `${animationName} ${duration}s ease-in-out infinite`,
        } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
