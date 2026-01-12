import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { sounds } from '@/lib/sound-feedback';
import { Check, Sparkles, PartyPopper, Zap, Heart, Star, Trophy, Target } from 'lucide-react';

// ============================================
// HAPTIC FEEDBACK
// ============================================
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 20],
      error: [50, 30, 50],
    };
    navigator.vibrate(patterns[type]);
  }
}

// ============================================
// CONFETTI CELEBRATIONS
// ============================================
interface ConfettiOptions {
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
}

// Confetti color palette (hex required by canvas-confetti library)
const CONFETTI_COLORS = {
  success: ['#10b981', '#16a34a', '#22c55e', '#4ade80'],
  primary: ['#3b82f6', '#6366f1', '#8b5cf6'],
  warning: ['#fbbf24', '#f59e0b', '#d97706'],
  celebration: ['#ec4899', '#f43f5e', '#a855f7'],
  mixed: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'],
} as const;

export function celebrateSuccess(options: ConfettiOptions = {}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.6 },
    colors: CONFETTI_COLORS.mixed,
  };
  
  confetti({ ...defaults, ...options });
  sounds.goal();
  triggerHaptic('success');
}

export function celebratePayment() {
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = [CONFETTI_COLORS.success[0], CONFETTI_COLORS.primary[0]];

  (function frame() {
    confetti({ particleCount: 2, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 2, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  sounds.payment();
  triggerHaptic('success');
}

export function celebrateGoal() {
  confetti({
    particleCount: 150,
    spread: 180,
    origin: { y: 0.2 },
    colors: CONFETTI_COLORS.warning,
    shapes: ['star'],
    ticks: 200,
  });
  
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      origin: { y: 0.3 },
      colors: CONFETTI_COLORS.success.slice(0, 2),
    });
  }, 300);

  sounds.goal();
  triggerHaptic('heavy');
}

export function celebrateMilestone() {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });

  sounds.goal();
  triggerHaptic('heavy');
}

// ============================================
// ANIMATED COUNTER
// ============================================
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

export function AnimatedCounter({ 
  value, 
  duration = 1000, 
  className,
  formatter = (v) => v.toLocaleString('pt-BR'),
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const diff = value - startValue;
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + diff * eased));
      
      if (progress < 1) requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  return <span className={className}>{formatter(displayValue)}</span>;
}

// ============================================
// PULSE DOT
// ============================================
interface PulseDotProps {
  color?: 'success' | 'warning' | 'destructive' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulseDot({ color = 'success', size = 'md', className }: PulseDotProps) {
  const colors = {
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
    primary: 'bg-primary',
  };
  
  const sizes = { sm: 'h-2 w-2', md: 'h-3 w-3', lg: 'h-4 w-4' };
  
  return (
    <span className={cn("relative flex", sizes[size], className)}>
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", colors[color])} />
      <span className={cn("relative inline-flex rounded-full h-full w-full", colors[color])} />
    </span>
  );
}

// ============================================
// SHIMMER EFFECT
// ============================================
export function Shimmer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      {children}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// ============================================
// SUCCESS CHECKMARK
// ============================================
export function SuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="flex items-center justify-center"
        >
          <motion.svg
            className="h-16 w-16 text-success"
            viewBox="0 0 52 52"
            initial="hidden"
            animate="visible"
          >
            <motion.circle
              cx="26" cy="26" r="25"
              fill="none" stroke="currentColor" strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <motion.path
              fill="none" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// HOVER LIFT
// ============================================
export function HoverLift({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// STAGGER ANIMATION
// ============================================
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerContainer({ children, className, staggerDelay = 0.05 }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: staggerDelay } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.1 }}
        className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

// ============================================
// FLOATING CELEBRATION ICONS
// ============================================
const celebrationIcons = [Sparkles, PartyPopper, Zap, Heart, Star, Trophy, Target];

export function FloatingCelebration({ children, trigger }: { children: React.ReactNode; trigger: boolean }) {
  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {trigger && celebrationIcons.map((Icon, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.8],
              x: (Math.random() - 0.5) * 100,
              y: -50 - Math.random() * 50,
            }}
            transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
            className="absolute top-0 left-1/2 -translate-x-1/2 text-primary pointer-events-none"
          >
            <Icon className="h-4 w-4" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// LOADING DOTS
// ============================================
export function LoadingDots({ color = 'currentColor' }: { color?: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.4, delay: i * 0.15 }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      ))}
    </span>
  );
}

// ============================================
// RIPPLE EFFECT
// ============================================
export function Ripple({ className, color = 'rgba(255, 255, 255, 0.3)' }: { className?: string; color?: string }) {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 4, opacity: 0 }}
      transition={{ duration: 0.6 }}
      className={cn('absolute inset-0 rounded-full pointer-events-none', className)}
      style={{ backgroundColor: color }}
    />
  );
}

// ============================================
// INTERACTIVE BUTTON WRAPPER
// ============================================
interface InteractiveButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  feedbackType?: 'scale' | 'bounce' | 'glow';
  haptic?: 'light' | 'medium' | 'heavy';
  sound?: 'click' | 'success' | 'notification';
}

export function InteractiveButton({
  children,
  onClick,
  disabled,
  className,
  feedbackType = 'scale',
  haptic = 'light',
  sound = 'click',
}: InteractiveButtonProps) {
  const handleClick = React.useCallback(async () => {
    if (disabled) return;
    sounds[sound]();
    triggerHaptic(haptic);
    if (onClick) await onClick();
  }, [onClick, disabled, haptic, sound]);

  const animations = {
    scale: { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } },
    bounce: { whileHover: { y: -2 }, whileTap: { y: 1, scale: 0.98 } },
    glow: { whileHover: { scale: 1.02, boxShadow: '0 0 20px hsl(217 91% 60% / 0.5)' }, whileTap: { scale: 0.98 } },
  };

  return (
    <motion.div
      {...animations[feedbackType]}
      onClick={handleClick}
      className={cn('cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}
    >
      {children}
    </motion.div>
  );
}
