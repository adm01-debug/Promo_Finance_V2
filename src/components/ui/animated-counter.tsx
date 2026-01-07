/**
 * Animated Counter - Contador animado com efeitos visuais aprimorados
 * 
 * Features: flip animation, color transitions, sparkle effects, trend indicators
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
  prefix?: string;
  suffix?: string;
  animateOnView?: boolean;
  showTrend?: boolean;
  previousValue?: number;
  variant?: 'default' | 'flip' | 'slide' | 'glow';
}

// Flip digit component for slot machine effect
function FlipDigit({ digit, className }: { digit: string; className?: string }) {
  return (
    <div className={cn('relative h-[1em] w-[0.6em] overflow-hidden', className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: '-100%', opacity: 0, rotateX: -90 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: '100%', opacity: 0, rotateX: 90 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Slide digit for smooth transitions
function SlideDigit({ digit, className }: { digit: string; className?: string }) {
  return (
    <div className={cn('relative h-[1em] w-[0.6em] overflow-hidden', className)}>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function AnimatedCounter({
  value,
  duration = 1000,
  className,
  formatter = (v) => v.toLocaleString('pt-BR'),
  prefix = '',
  suffix = '',
  animateOnView = true,
  showTrend = false,
  previousValue,
  variant = 'default',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(animateOnView ? 0 : value);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  // Calculate trend
  const trend = useMemo(() => {
    if (previousValue === undefined) return null;
    if (value > previousValue) return 'up';
    if (value < previousValue) return 'down';
    return 'neutral';
  }, [value, previousValue]);

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
          // Show sparkle on completion for significant increases
          if (previousValue !== undefined && value > previousValue * 1.1) {
            setShowSparkle(true);
            setTimeout(() => setShowSparkle(false), 1000);
          }
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

  const formattedValue = formatter(Math.round(displayValue));

  // Render based on variant
  if (variant === 'flip' || variant === 'slide') {
    const DigitComponent = variant === 'flip' ? FlipDigit : SlideDigit;
    const digits = formattedValue.split('');

    return (
      <motion.span
        ref={ref}
        className={cn('inline-flex items-center tabular-nums', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {prefix && <span>{prefix}</span>}
        <span className="inline-flex">
          {digits.map((digit, i) => (
            digit.match(/[0-9]/) ? (
              <DigitComponent key={`${i}-${digit}`} digit={digit} />
            ) : (
              <span key={i} className="w-auto">{digit}</span>
            )
          ))}
        </span>
        {suffix && <span>{suffix}</span>}
        {showTrend && trend && <TrendIndicator trend={trend} />}
        {showSparkle && <SparkleEffect />}
      </motion.span>
    );
  }

  if (variant === 'glow') {
    return (
      <motion.span
        ref={ref}
        className={cn('relative tabular-nums', className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="relative z-10">
          {prefix}
          {formattedValue}
          {suffix}
        </span>
        <motion.span
          className="absolute inset-0 blur-lg opacity-50"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {prefix}
          {formattedValue}
          {suffix}
        </motion.span>
        {showTrend && trend && <TrendIndicator trend={trend} />}
        {showSparkle && <SparkleEffect />}
      </motion.span>
    );
  }

  return (
    <motion.span
      ref={ref}
      className={cn('inline-flex items-center gap-1 tabular-nums', className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {prefix}
      <motion.span
        key={Math.round(displayValue)}
        initial={hasAnimated ? { scale: 1.1 } : {}}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {formattedValue}
      </motion.span>
      {suffix}
      {showTrend && trend && <TrendIndicator trend={trend} />}
      {showSparkle && <SparkleEffect />}
    </motion.span>
  );
}

// Trend indicator component
function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  const config = {
    up: { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
    down: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    neutral: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted' },
  };

  const { icon: Icon, color, bg } = config[trend];

  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn('inline-flex items-center justify-center p-0.5 rounded', bg, color)}
    >
      <Icon className="h-3 w-3" />
    </motion.span>
  );
}

// Sparkle effect for celebrations
function SparkleEffect() {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: [0, 1.2, 1],
        opacity: [0, 1, 0],
        rotate: [0, 180]
      }}
      transition={{ duration: 1 }}
      className="absolute -top-1 -right-1"
    >
      <Sparkles className="h-4 w-4 text-yellow-500" />
    </motion.span>
  );
}

// Currency counter with special formatting
interface AnimatedCurrencyProps {
  value: number;
  duration?: number;
  className?: string;
  showSign?: boolean;
  previousValue?: number;
  showTrend?: boolean;
  variant?: 'default' | 'flip' | 'slide' | 'glow';
}

export function AnimatedCurrency({
  value,
  duration = 1000,
  className,
  showSign = false,
  previousValue,
  showTrend = false,
  variant = 'default',
}: AnimatedCurrencyProps) {
  const sign = showSign && value > 0 ? '+' : '';
  
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      className={className}
      prefix={sign}
      previousValue={previousValue}
      showTrend={showTrend}
      variant={variant}
      formatter={(v) => 
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(v)
      }
    />
  );
}

// Percentage counter with color coding
interface AnimatedPercentageProps {
  value: number;
  duration?: number;
  className?: string;
  decimals?: number;
  colorCode?: boolean;
  showTrend?: boolean;
  previousValue?: number;
}

export function AnimatedPercentage({
  value,
  duration = 1000,
  className,
  decimals = 1,
  colorCode = false,
  showTrend = false,
  previousValue,
}: AnimatedPercentageProps) {
  const colorClass = colorCode
    ? value > 0
      ? 'text-green-600 dark:text-green-400'
      : value < 0
      ? 'text-red-600 dark:text-red-400'
      : ''
    : '';

  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      className={cn(colorClass, className)}
      suffix="%"
      showTrend={showTrend}
      previousValue={previousValue}
      formatter={(v) => v.toFixed(decimals)}
    />
  );
}

// Compact stat display with animation
interface AnimatedStatProps {
  label: string;
  value: number;
  previousValue?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export function AnimatedStat({
  label,
  value,
  previousValue,
  formatter,
  className
}: AnimatedStatProps) {
  const change = previousValue !== undefined
    ? ((value - previousValue) / previousValue) * 100
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-1', className)}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-baseline gap-2">
        <AnimatedCounter
          value={value}
          formatter={formatter}
          showTrend={change !== null}
          previousValue={previousValue}
          className="text-2xl font-bold"
        />
        {change !== null && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'text-sm font-medium',
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
            )}
          >
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

export default AnimatedCounter;
