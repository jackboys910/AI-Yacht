"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A number that counts up the first time it is seen. The final value is what
 * the server renders, so without script, or with reduced motion, the right
 * number is simply there.
 */
export function FamilyCount({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const element = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const node = element.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const watch = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      watch.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1600);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    watch.observe(node);
    return () => {
      watch.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={element} className="tabular-nums">
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}
