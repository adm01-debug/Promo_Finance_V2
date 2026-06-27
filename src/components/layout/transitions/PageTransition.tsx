import { AnimatePresence, motion } from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTransition } from './useTransition';
import type { TransitionConfig } from './types';

export interface PageTransitionProps extends TransitionConfig {
  children: ReactNode;
  className?: string;
}

export const PageTransition = forwardRef<HTMLDivElement, PageTransitionProps>(
  function PageTransition({ children, className, ...override }, ref) {
    const location = useLocation();
    const preset = useTransition(override);

    const content = (
      <AnimatePresence mode="wait">
        <motion.div
          ref={ref}
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={preset.variants}
          transition={preset.transition}
          className={className ?? 'w-full'}
          style={{ willChange: 'transform, opacity, filter' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );

    if (preset.needsPerspective) {
      return <div style={{ perspective: 1200 }}>{content}</div>;
    }
    return content;
  },
);
