"use client";

import React, { useEffect, useRef } from "react";
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
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node) return;

    // Respect user's reduced-motion preference: keep visible with no entrance animations
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    // Fallback if IntersectionObserver is unsupported: keep visible
    if (!("IntersectionObserver" in window)) {
      return;
    }

    // Check if element is already within (or above) the viewport
    const rect = node.getBoundingClientRect();
    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;

    // If element is already in the viewport (or scrolled past), keep visible
    if (rect.top <= windowHeight - 30 || rect.bottom <= 0) {
      return;
    }

    // Element is genuinely off-screen below the viewport: arm for entrance animation
    node.setAttribute("data-reveal", "hidden");

    // Fallback safety timeout: ensure content becomes visible even if observer fails or stalls
    const fallbackTimer = setTimeout(() => {
      node.setAttribute("data-reveal", "visible");
    }, 3500);

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          clearTimeout(fallbackTimer);
          if (delayMs > 0) {
            node.style.transitionDelay = `${delayMs}ms`;
          }
          node.setAttribute("data-reveal", "visible");
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
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [delayMs, threshold]);

  return (
    <Component
      ref={elementRef}
      className={cn("scroll-reveal", className)}
    >
      {children}
    </Component>
  );
}
