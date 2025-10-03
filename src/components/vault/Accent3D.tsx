"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// Lazy load Spline component
const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-card/20 animate-pulse rounded-2xl" />,
});

interface Accent3DProps {
  size?: "banner" | "orb";
}

/**
 * Lightweight 3D accent using Spline
 * - Lazy loaded with next/dynamic
 * - Pauses when offscreen (IntersectionObserver)
 * - Pauses when tab hidden (visibilitychange)
 */
export function Accent3D({ size = "banner" }: Accent3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Pause when tab is hidden
  useEffect(() => {
    const onVisibilityChange = () => {
      setPaused(document.hidden);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  // Pause when offscreen
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (!entry.isIntersecting) {
          setPaused(true);
        } else if (!document.hidden) {
          setPaused(false);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Solana-themed Spline scene
  const splineSceneUrl = "https://prod.spline.design/w0ue5vlfRkKvRHrD/scene.splinecode";

  if (size === "orb") {
    return (
      <div
        ref={containerRef}
        className="absolute top-0 right-0 w-24 h-24 pointer-events-none z-0"
        aria-hidden="true"
      >
        {isVisible && (
          <Spline
            scene={splineSceneUrl}
            className="w-full h-full opacity-60"
          />
        )}
      </div>
    );
  }

  // Banner mode
  return (
    <div
      ref={containerRef}
      className="w-full h-14 overflow-hidden rounded-2xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-border/30 mb-6"
      aria-hidden="true"
    >
      {isVisible && (
        <Spline
          scene={splineSceneUrl}
          className="w-full h-full opacity-50"
        />
      )}
    </div>
  );
}
