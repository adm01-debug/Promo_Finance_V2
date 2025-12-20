import { memo, ReactNode, ComponentType } from 'react';

/**
 * Hook to optimize table rendering based on dataset size
 * Returns configuration for animations and virtualization
 */
export function useTableOptimization(dataLength: number) {
  const shouldAnimate = dataLength <= 20;
  const shouldVirtualize = dataLength > 50;
  const animationDelay = shouldAnimate ? 0.05 : 0;

  return {
    shouldAnimate,
    shouldVirtualize,
    animationDelay,
    // Return animation props or empty object for performance
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
}

/**
 * Higher-order component to memoize table rows with proper comparison
 * Prevents unnecessary re-renders when parent component updates
 */
export function createMemoizedRow<T extends { id: string }>(
  RowComponent: ComponentType<{ item: T; index: number }>
) {
  return memo(RowComponent, (prevProps, nextProps) => {
    // Only re-render if the item data actually changed
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.index === nextProps.index &&
      JSON.stringify(prevProps.item) === JSON.stringify(nextProps.item)
    );
  });
}

interface MemoizedCellProps {
  children: ReactNode;
}

/**
 * Memoized table cell component for complex cell content
 */
function MemoizedCellComponent({ children }: MemoizedCellProps) {
  return children;
}

export const MemoizedCell = memo(MemoizedCellComponent);
