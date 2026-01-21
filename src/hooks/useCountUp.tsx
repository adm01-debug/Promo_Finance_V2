import { useState, useEffect, useRef, useCallback } from 'react';

type EasingFunction = (t: number) => number;

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  easing?: EasingFunction | 'linear' | 'easeOut' | 'easeIn' | 'easeInOut';
  separator?: string;
  prefix?: string;
  suffix?: string;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseCountUpReturn {
  value: number;
  formattedValue: string;
  isAnimating: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  update: (newEnd: number) => void;
}

// Easing functions
const easings: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeIn: (t) => Math.pow(t, 3),
  easeInOut: (t) => t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

export function useCountUp(options: UseCountUpOptions): UseCountUpReturn {
  const {
    start = 0,
    end,
    duration = 2000,
    delay = 0,
    decimals = 0,
    easing = 'easeOut',
    separator = '.',
    prefix = '',
    suffix = '',
    onComplete,
    autoStart = true,
  } = options;

  const [value, setValue] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pauseTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(start);
  const endValueRef = useRef(end);
  const isCompletedRef = useRef(false);

  // Get easing function
  const easingFn: EasingFunction = typeof easing === 'function' 
    ? easing 
    : easings[easing] || easings.easeOut;

  // Format value
  const formatValue = useCallback((val: number): string => {
    const fixed = val.toFixed(decimals);
    const [integer, decimal] = fixed.split('.');
    
    // Add thousand separators
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    
    const formatted = decimal 
      ? `${formattedInteger},${decimal}`
      : formattedInteger;
    
    return `${prefix}${formatted}${suffix}`;
  }, [decimals, separator, prefix, suffix]);

  // Animation frame
  const animate = useCallback((timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFn(progress);
    
    const currentValue = startValueRef.current + 
      (endValueRef.current - startValueRef.current) * easedProgress;
    
    setValue(currentValue);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setValue(endValueRef.current);
      setIsAnimating(false);
      isCompletedRef.current = true;
      onComplete?.();
    }
  }, [duration, easingFn, onComplete]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    startTimeRef.current = null;
    pauseTimeRef.current = null;
    isCompletedRef.current = false;
    setIsAnimating(true);
    
    if (delay > 0) {
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, delay);
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [animate, delay]);

  // Pause animation
  const pause = useCallback(() => {
    if (animationRef.current && isAnimating) {
      cancelAnimationFrame(animationRef.current);
      pauseTimeRef.current = performance.now();
      setIsAnimating(false);
    }
  }, [isAnimating]);

  // Resume animation
  const resume = useCallback(() => {
    if (pauseTimeRef.current && !isAnimating && !isCompletedRef.current) {
      const pauseDuration = performance.now() - pauseTimeRef.current;
      if (startTimeRef.current) {
        startTimeRef.current += pauseDuration;
      }
      pauseTimeRef.current = null;
      setIsAnimating(true);
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [animate, isAnimating]);

  // Reset animation
  const reset = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setValue(startValueRef.current);
    startTimeRef.current = null;
    pauseTimeRef.current = null;
    isCompletedRef.current = false;
    setIsAnimating(false);
  }, []);

  // Update end value
  const update = useCallback((newEnd: number) => {
    startValueRef.current = value;
    endValueRef.current = newEnd;
    startAnimation();
  }, [value, startAnimation]);

  // Auto start
  useEffect(() => {
    endValueRef.current = end;
    
    if (autoStart) {
      startAnimation();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [end, autoStart, startAnimation]);

  return {
    value,
    formattedValue: formatValue(value),
    isAnimating,
    start: startAnimation,
    pause,
    resume,
    reset,
    update,
  };
}

// Hook for animating between any two numbers
export function useAnimatedNumber(
  targetValue: number,
  options: Omit<UseCountUpOptions, 'end'> = {}
) {
  const [currentTarget, setCurrentTarget] = useState(targetValue);
  const previousValue = useRef(options.start ?? 0);

  const countUp = useCountUp({
    ...options,
    start: previousValue.current,
    end: currentTarget,
  });

  useEffect(() => {
    if (targetValue !== currentTarget) {
      previousValue.current = countUp.value;
      setCurrentTarget(targetValue);
      countUp.update(targetValue);
    }
  }, [targetValue, currentTarget, countUp]);

  return countUp;
}

// Hook for currency animation
export function useAnimatedCurrency(
  value: number,
  currency: string = 'BRL',
  options: Omit<UseCountUpOptions, 'end' | 'prefix' | 'decimals'> = {}
) {
  const currencySymbols: Record<string, string> = {
    BRL: 'R$ ',
    USD: '$ ',
    EUR: '€ ',
    GBP: '£ ',
  };

  return useAnimatedNumber(value, {
    ...options,
    decimals: 2,
    prefix: currencySymbols[currency] || '',
  });
}

// Hook for percentage animation
export function useAnimatedPercentage(
  value: number,
  options: Omit<UseCountUpOptions, 'end' | 'suffix' | 'decimals'> = {}
) {
  return useAnimatedNumber(value, {
    ...options,
    decimals: 1,
    suffix: '%',
  });
}

// Component wrapper for easy use
interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1500,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedNumberProps) {
  const { formattedValue } = useAnimatedNumber(value, {
    duration,
    decimals,
    prefix,
    suffix,
  });

  return <span className={className}>{formattedValue}</span>;
}

// Animated currency component
interface AnimatedCurrencyProps {
  value: number;
  currency?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCurrency({
  value,
  currency = 'BRL',
  duration = 1500,
  className,
}: AnimatedCurrencyProps) {
  const { formattedValue } = useAnimatedCurrency(value, currency, { duration });

  return <span className={className}>{formattedValue}</span>;
}

// Animated percentage component
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
}

export function AnimatedPercentage({
  value,
  duration = 1500,
  className,
}: AnimatedPercentageProps) {
  const { formattedValue } = useAnimatedPercentage(value, { duration });

  return <span className={className}>{formattedValue}</span>;
}

export default useCountUp;
