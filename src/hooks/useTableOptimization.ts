import { useMemo } from 'react';

interface TableOptimizationConfig {
  /** Whether to animate row entries */
  shouldAnimate: boolean;
  /** Whether to use virtualization for performance */
  shouldVirtualize: boolean;
  /** Delay between row animations */
  animationDelay: number;
  /** Get animation props for a specific row */
  getRowAnimation: (index: number) => {
    initial: { opacity: number; x: number };
    animate: { opacity: number; x: number };
    transition?: { delay: number };
  };
  /** Threshold for virtualization */
  virtualizationThreshold: number;
}

/**
 * Hook to optimize table rendering based on dataset size
 * Returns configuration for animations and virtualization
 * 
 * @param dataLength - Number of items in the dataset
 * @param options - Optional configuration overrides
 */
export function useTableOptimization(
  dataLength: number,
  options?: {
    animationThreshold?: number;
    virtualizationThreshold?: number;
  }
): TableOptimizationConfig {
  const animationThreshold = options?.animationThreshold ?? 20;
  const virtualizationThreshold = options?.virtualizationThreshold ?? 50;
  
  return useMemo(() => {
    const shouldAnimate = dataLength <= animationThreshold;
    const shouldVirtualize = dataLength > virtualizationThreshold;
    const animationDelay = shouldAnimate ? 0.05 : 0;

    return {
      shouldAnimate,
      shouldVirtualize,
      animationDelay,
      virtualizationThreshold,
      getRowAnimation: (index: number) =>
        shouldAnimate
          ? {
              initial: { opacity: 0, x: -20 },
              animate: { opacity: 1, x: 0 },
              transition: { delay: index * animationDelay },
            }
          : {
              initial: { opacity: 1, x: 0 },
              animate: { opacity: 1, x: 0 },
            },
    };
  }, [dataLength, animationThreshold, virtualizationThreshold]);
}
