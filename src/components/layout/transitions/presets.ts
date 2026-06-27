import type { Transition, Variants } from 'framer-motion';
import type { EasingPreset, ResolvedPreset, TransitionConfig, TransitionName } from './types';

const DEFAULT_DURATION = 350;
const DEFAULT_DISTANCE = 24;

function resolveTransition(
  duration: number,
  easing: EasingPreset | number[] | undefined,
): Transition {
  if (Array.isArray(easing)) {
    return { duration: duration / 1000, ease: easing as [number, number, number, number] };
  }
  if (easing === 'spring') {
    return { type: 'spring', stiffness: 260, damping: 26 };
  }
  return {
    type: 'tween',
    duration: duration / 1000,
    ease: (easing ?? 'anticipate') as 'anticipate' | 'easeOut' | 'easeInOut',
  };
}

function buildVariants(name: TransitionName, distance: number, opFrom: number, opTo: number): Variants {
  switch (name) {
    case 'fade':
      return {
        initial: { opacity: opFrom },
        animate: { opacity: opTo },
        exit: { opacity: opFrom },
      };
    case 'blur-rise':
      return {
        initial: { opacity: 0, y: 20, scale: 0.99, filter: 'blur(4px)' },
        animate: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -20, scale: 0.99, filter: 'blur(4px)' },
      };
    case 'slide-left':
      return {
        initial: { opacity: opFrom, x: distance },
        animate: { opacity: opTo, x: 0 },
        exit: { opacity: opFrom, x: -distance },
      };
    case 'slide-right':
      return {
        initial: { opacity: opFrom, x: -distance },
        animate: { opacity: opTo, x: 0 },
        exit: { opacity: opFrom, x: distance },
      };
    case 'slide-up':
      return {
        initial: { opacity: opFrom, y: distance },
        animate: { opacity: opTo, y: 0 },
        exit: { opacity: opFrom, y: -distance },
      };
    case 'slide-down':
      return {
        initial: { opacity: opFrom, y: -distance },
        animate: { opacity: opTo, y: 0 },
        exit: { opacity: opFrom, y: distance },
      };
    case 'zoom-in':
      return {
        initial: { opacity: opFrom, scale: 0.92 },
        animate: { opacity: opTo, scale: 1 },
        exit: { opacity: opFrom, scale: 1.04 },
      };
    case 'zoom-out':
      return {
        initial: { opacity: opFrom, scale: 1.08 },
        animate: { opacity: opTo, scale: 1 },
        exit: { opacity: opFrom, scale: 0.96 },
      };
    case 'flip-x':
      return {
        initial: { opacity: opFrom, rotateX: 90 },
        animate: { opacity: opTo, rotateX: 0 },
        exit: { opacity: opFrom, rotateX: -90 },
      };
    case 'flip-y':
      return {
        initial: { opacity: opFrom, rotateY: 90 },
        animate: { opacity: opTo, rotateY: 0 },
        exit: { opacity: opFrom, rotateY: -90 },
      };
    case 'parallax':
      return {
        initial: { opacity: opFrom, y: distance * 2 },
        animate: { opacity: opTo, y: 0 },
        exit: { opacity: opFrom, y: -distance },
      };
    case 'scale':
      return {
        initial: { opacity: opFrom, scale: 0.9 },
        animate: { opacity: opTo, scale: 1 },
        exit: { opacity: opFrom, scale: 1.1 },
      };
    case 'none':
    default:
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      };
  }
}

export function resolvePreset(config: TransitionConfig = {}): ResolvedPreset {
  const effect = config.effect ?? 'blur-rise';
  const duration = config.duration ?? DEFAULT_DURATION;
  const distance = config.distance ?? DEFAULT_DISTANCE;
  const opFrom = config.opacityFrom ?? 0;
  const opTo = config.opacityTo ?? 1;

  return {
    variants: buildVariants(effect, distance, opFrom, opTo),
    transition: resolveTransition(duration, config.easing),
    needsPerspective: effect === 'flip-x' || effect === 'flip-y',
  };
}

export const REDUCED_MOTION_PRESET: ResolvedPreset = {
  variants: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  transition: { duration: 0.15, ease: 'easeOut' },
};
