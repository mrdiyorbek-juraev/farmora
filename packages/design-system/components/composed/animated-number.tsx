"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  delay?: number;
  duration?: number;
  format?: (v: number) => string;
  value: number;
}

export function AnimatedNumber({
  value,
  duration = 1200,
  delay = 0,
  format = (v) => Math.round(v).toString(),
}: Props) {
  const [v, setV] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf = 0;
    startRef.current = null;
    const tick = (ts: number) => {
      if (startRef.current === null) {
        startRef.current = ts + delay;
      }
      const t = Math.max(0, ts - startRef.current);
      const p = Math.min(1, t / duration);
      const eased = 1 - (1 - p) ** 3;
      setV(value * eased);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setV(value);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);

  return <>{format(v)}</>;
}
