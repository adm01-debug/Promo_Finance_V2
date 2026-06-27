/**
 * Re-export compatível com a API legada.
 * A implementação real vive em `./transitions/`.
 */
import type { Variants } from 'framer-motion';
export { PageTransition } from './transitions';
export type { PageTransitionProps } from './transitions';

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.99, filter: 'blur(4px)' },
  in: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  out: { opacity: 0, y: -20, scale: 0.99, filter: 'blur(4px)' },
};

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

/** @deprecated Use `useTransition` de `./transitions` para resolver presets dinamicamente. */
export function usePageTransition(variant: 'default' | 'slide' | 'fade' | 'scale' = 'default') {
  const variants: Record<string, Variants> = {
    default: pageVariants,
    slide: slideVariants,
    fade: fadeVariants,
    scale: scaleVariants,
  };
  return {
    variants: variants[variant],
    transition: { type: 'tween' as const, ease: 'anticipate' as const, duration: 0.35 },
  };
}
