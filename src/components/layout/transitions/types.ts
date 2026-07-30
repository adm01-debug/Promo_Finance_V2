import type { Variants, Transition } from 'framer-motion';

export type TransitionName =
  | 'fade'
  | 'blur-rise'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'flip-x'
  | 'flip-y'
  | 'parallax'
  | 'scale'
  | 'none';

export type EasingPreset = 'anticipate' | 'easeOut' | 'easeInOut' | 'spring';

export interface TransitionConfig {
  effect?: TransitionName;
  duration?: number; // ms
  easing?: EasingPreset | number[];
  distance?: number; // px for slide, scale delta for zoom
  opacityFrom?: number;
  opacityTo?: number;
}

export interface ResolvedPreset {
  variants: Variants;
  transition: Transition;
  /** When true, parent container must apply perspective */
  needsPerspective?: boolean;
}
