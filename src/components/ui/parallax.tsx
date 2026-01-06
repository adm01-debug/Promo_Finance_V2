import { cn } from '@/lib/utils';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useRef, useEffect } from 'react';

interface ParallaxContainerProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function ParallaxContainer({ 
  children, 
  className,
  intensity = 10
}: ParallaxContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [intensity, -intensity]));
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-intensity, intensity]));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      mouseX.set((e.clientX - centerX) / (rect.width / 2));
      mouseY.set((e.clientY - centerY) / (rect.height / 2));
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    const container = containerRef.current;
    container?.addEventListener('mousemove', handleMouseMove);
    container?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container?.removeEventListener('mousemove', handleMouseMove);
      container?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={containerRef}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      className={cn('relative', className)}
    >
      {children}
    </motion.div>
  );
}

// Parallax layer for depth effect
interface ParallaxLayerProps {
  children: React.ReactNode;
  depth?: number; // 0 = background, 1 = foreground
  className?: string;
}

export function ParallaxLayer({ children, depth = 0.5, className }: ParallaxLayerProps) {
  return (
    <motion.div
      style={{
        transform: `translateZ(${depth * 50}px)`,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scroll-based parallax
interface ScrollParallaxProps {
  children: React.ReactNode;
  speed?: number; // -1 to 1, negative = slower, positive = faster
  className?: string;
}

export function ScrollParallax({ children, speed = 0.5, className }: ScrollParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrollProgress = -rect.top / window.innerHeight;
      y.set(scrollProgress * speed * 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, y]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

// Mouse follower
interface MouseFollowerProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function MouseFollower({ children, delay = 0.2, className }: MouseFollowerProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 20, stiffness: 300 * (1 / delay) });
  const springY = useSpring(y, { damping: 20, stiffness: 300 * (1 / delay) });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y]);

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: springX,
        top: springY,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Floating animation
interface FloatingProps {
  children: React.ReactNode;
  duration?: number;
  distance?: number;
  className?: string;
}

export function Floating({ children, duration = 3, distance = 10, className }: FloatingProps) {
  return (
    <motion.div
      animate={{
        y: [-distance, distance, -distance],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Rotating element
interface RotatingProps {
  children: React.ReactNode;
  duration?: number;
  direction?: 'clockwise' | 'counterclockwise';
  className?: string;
}

export function Rotating({ 
  children, 
  duration = 10, 
  direction = 'clockwise',
  className 
}: RotatingProps) {
  return (
    <motion.div
      animate={{
        rotate: direction === 'clockwise' ? 360 : -360,
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Bounce on scroll into view
interface BounceInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function BounceIn({ children, delay = 0, className }: BounceInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, y: 50 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 15,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Reveal from direction
interface RevealProps {
  children: React.ReactNode;
  from?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  className?: string;
}

export function Reveal({ children, from = 'bottom', delay = 0, className }: RevealProps) {
  const directions = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    top: { x: 0, y: -100 },
    bottom: { x: 0, y: 100 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[from] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
