import { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({
  value,
  duration = 600,
  className,
  formatter,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = 0;
    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };
    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return (
    <span className={cn("tabular-nums", className)}>
      {formatter ? formatter(display) : display.toLocaleString()}
    </span>
  );
}