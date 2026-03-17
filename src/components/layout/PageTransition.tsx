import { motion, AnimatePresence, Transition, Variants } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode, forwardRef } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'anticipate' as const,
  duration: 0.35,
};

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// Variantes alternativas para diferentes tipos de transição
export const slideVariants: Variants = {
  initial: { opacity: 0, x: -30 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 30 },
};

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  in: { opacity: 1, scale: 1 },
  out: { opacity: 0, scale: 1.1 },
};

// Hook para usar variantes customizadas
export function usePageTransition(variant: 'default' | 'slide' | 'fade' | 'scale' = 'default') {
  const variants: Record<string, Variants> = {
    default: pageVariants,
    slide: slideVariants,
    fade: fadeVariants,
    scale: scaleVariants,
  };

  return {
    variants: variants[variant],
    transition: pageTransition,
  };
}
