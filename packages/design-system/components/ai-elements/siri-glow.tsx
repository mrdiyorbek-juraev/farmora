"use client";
import { cn } from "@repo/design-system/lib/utils";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Apple Intelligence / Siri-style animated edge glow.
 *
 * Uses a sharp conic-gradient border stroke (mask-composite) for
 * the crisp colored line, plus animated box-shadows for the actual
 * soft luminous glow halo that bleeds from the edges.
 *
 * Place inside a `position: relative; overflow: hidden` container.
 */

const GLOW_COLORS = [
  "#BC82F3",
  "#F5B9EA",
  "#8D9FFF",
  "#AA6EEE",
  "#FF6778",
  "#FFBA71",
  "#C686FF",
];

/** Pick 4 random colors from the palette for the glow shadows. */
function pickGlowColors(): string[] {
  const shuffled = [...GLOW_COLORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

/** Build box-shadow string: inset + outset glow from 4 colors. */
function generateBoxShadow(colors: string[]): string {
  const shadows = [
    // Inset glow — visible light inside the container edges
    `inset 0 0 30px 8px ${colors[0]}66`,
    `inset 0 0 60px 15px ${colors[1]}44`,
    // Outset glow — light bleeding outward
    `0 0 20px 4px ${colors[2]}55`,
    `0 0 50px 10px ${colors[3]}33`,
  ];
  return shadows.join(", ");
}

interface SiriGlowProps {
  active?: boolean;
  borderRadius?: number | string;
  className?: string;
}

export function SiriGlow({
  active = false,
  borderRadius = "inherit",
  className,
}: SiriGlowProps) {
  const [boxShadow, setBoxShadow] = useState(() =>
    generateBoxShadow(pickGlowColors())
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAnimation = useCallback(() => {
    if (intervalRef.current) {
      return;
    }
    intervalRef.current = setInterval(() => {
      setBoxShadow(generateBoxShadow(pickGlowColors()));
    }, 250);
  }, []);

  const stopAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (active) {
      startAnimation();
    } else {
      stopAnimation();
    }
    return stopAnimation;
  }, [active, startAnimation, stopAnimation]);

  if (!active) {
    return null;
  }

  const radius =
    typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-50", className)}
      data-slot="siri-glow"
      style={{ borderRadius: radius }}
    >
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          boxShadow,
          transition: "box-shadow 0.5s ease-in-out",
        }}
      />
    </div>
  );
}

SiriGlow.displayName = "StriveUI.SiriGlow";
