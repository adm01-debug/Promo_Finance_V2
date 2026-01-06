/**
 * Animated Counter - Contador animado com efeito de incremento
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform, useInView } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  animateOnView?: boolean;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  formatter = (v) => v.toLocaleString('pt-BR'),
  prefix = '',
  suffix = '',
  animateOnView = true,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(animateOnView ? 0 : value);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!animateOnView || (isInView && !hasAnimated)) {
      const startTime = Date.now();
      const startValue = displayValue;
      const endValue = value;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out-expo)
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const currentValue = startValue + (endValue - startValue) * eased;
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setHasAnimated(true);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, isInView, animateOnView, hasAnimated]);

  // Update when value changes after initial animation
  useEffect(() => {
    if (hasAnimated) {
      const startTime = Date.now();
      const startValue = displayValue;
      const endValue = value;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration / 2), 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setDisplayValue(startValue + (endValue - startValue) * eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, hasAnimated]);

  return (
    <motion.span
      ref={ref}
      className={cn('tabular-nums', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      {formatter(Math.round(displayValue))}
      {suffix}
    </motion.span>
  );
}

// Currency counter with special formatting
interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
}

export function AnimatedCurrency({
  value,
  duration = 1000,
  className,
  showSign = false,
}: AnimatedCurrencyProps) {
  const sign = showSign && value > 0 ? '+' : '';
  
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      className={className}
      prefix={sign}
      formatter={(v) => 
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(v)
      }
    />
  );
}

// Percentage counter
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
}

export function AnimatedPercentage({
  value,
  duration = 1000,
  className,
  decimals = 1,
}: AnimatedPercentageProps) {
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      className={className}
      suffix="%"
      formatter={(v) => v.toFixed(decimals)}
    />
  );
}

export default AnimatedCounter;
