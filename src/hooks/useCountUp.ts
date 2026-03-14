import { useEffect, useRef, useState } from 'react';

/**
 * Animated count-up hook for numeric values.
 * Smoothly interpolates from 0 (or previous) to target value.
 */
export function useCountUp(
  target: number,
  options: {
    duration?: number;
    decimals?: number;
    enabled?: boolean;
  } = {}
) {
  const { duration = 1200, decimals = 2, enabled = true } = options;
  const [value, setValue] = useState(enabled ? 0 : target);
  const prevTarget = useRef(target);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }

    const startValue = prevTarget.current !== target ? prevTarget.current : 0;
    prevTarget.current = target;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * eased;

      setValue(Number(current.toFixed(decimals)));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, decimals, enabled]);

  return value;
}
