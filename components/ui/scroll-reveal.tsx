"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  threshold?: number;
  as?: React.ElementType;
}

/**
 * ScrollReveal: Lightweight viewport-triggered entrance component.
 * Uses IntersectionObserver to trigger once when entering viewport.
 * Uses CSS motion-reduce:opacity-100 motion-reduce:translate-y-0 to support reduced motion instantly.
 * Disconnects observer once triggered to prevent unnecessary background recalculations.
 */
export function ScrollReveal({
  children,
  className,
  delayMs = 0,
  threshold = 0.1,
  as: Component = "div",
}: ScrollRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If reduced motion is preferred, CSS already displays the element fully; no observer needed
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    const node = elementRef.current;
    if (!node) return;

    if (!("IntersectionObserver" in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <Component
      ref={elementRef}
      style={{
        transitionDelay: isRevealed && delayMs > 0 ? `${delayMs}ms` : undefined,
      }}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        isRevealed
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 motion-reduce:opacity-100 motion-reduce:translate-y-0",
        className
      )}
    >
      {children}
    </Component>
  );
}
