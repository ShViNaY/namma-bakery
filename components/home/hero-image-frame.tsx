"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface HeroImageFrameProps {
  src: string;
  alt: string;
}

/**
 * HeroImageFrame:
 * - Entrance: Smooth fade-in + subtle 1.04 -> 1.00 scale settling.
 * - Desktop-only subtle parallax: Very small (max 12-14px) translateY shift linked to scroll.
 * - Disabled completely on mobile / screens under 1024px.
 * - Respects prefers-reduced-motion.
 */
export function HeroImageFrame({ src, alt }: HeroImageFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    // Check screen width and reduced-motion preference
    if (typeof window === "undefined") return;

    const isDesktop = window.innerWidth >= 1024;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!isDesktop || prefersReducedMotion) {
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Only calculate within hero scroll range (< 600px)
          if (scrollY < 600) {
            // Very subtle shift: 0.04 factor, clamped between 0 and 14px
            const offset = Math.min(scrollY * 0.04, 14);
            setParallaxY(offset);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        transform: parallaxY > 0 ? `translate3d(0, ${parallaxY}px, 0)` : undefined,
        willChange: parallaxY > 0 ? "transform" : "auto",
      }}
      className="group relative mx-auto w-full max-w-md lg:max-w-none transition-transform duration-200 ease-out"
    >
      {/* Outer editorial frame */}
      <div className="relative aspect-4/3 sm:aspect-5/4 lg:aspect-4/3 w-full overflow-hidden rounded-sm border border-border bg-secondary/50 shadow-xs">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
          className="object-cover object-top animate-hero-image transition-transform duration-700 ease-out sm:group-hover:scale-[1.025]"
        />

        {/* Subtle gradient vignette at bottom for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/40 via-transparent to-transparent pointer-events-none" />

        {/* Editorial Storefront Badge */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 rounded-xs border border-cream/20 bg-cocoa/85 px-3 py-1.5 backdrop-blur-xs text-xs text-cream shadow-xs transition-opacity duration-300">
          <span className="font-kannada font-semibold text-caramel">ನಮ್ಮ ಬೇಕರಿ</span>
          <span className="text-cream/40">•</span>
          <span className="text-cream/90 text-[11px]">BEML Layout 3rd Stage</span>
        </div>
      </div>
    </div>
  );
}
