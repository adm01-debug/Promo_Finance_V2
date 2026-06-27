import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface Options {
  count: number;
  estimateSize?: number;
  overscan?: number;
  /** Disable virtualization below this row count (returns nulls). */
  threshold?: number;
}

/**
 * Lightweight wrapper around @tanstack/react-virtual for table rows.
 * Returns null `virtualizer` when row count is below `threshold` so callers
 * can fall back to plain rendering for small datasets.
 */
export function useVirtualRows({ count, estimateSize = 56, overscan = 8, threshold = 50 }: Options) {
  const parentRef = useRef<HTMLDivElement>(null);
  const enabled = count > threshold;

  const virtualizer = useVirtualizer({
    count: enabled ? count : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  return { parentRef, virtualizer, enabled };
}
