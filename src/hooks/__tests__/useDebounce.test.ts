import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('returns debounced value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });
    
    // Value should still be initial
    expect(result.current).toBe('initial');

    // Fast forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  it('resets timer on rapid value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    // Multiple rapid updates
    rerender({ value: 'update1' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'update2' });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'update3' });
    
    // Value should still be initial (timer reset each time)
    expect(result.current).toBe('initial');

    // Wait for full delay
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Should have final value
    expect(result.current).toBe('update3');
  });

  it('handles different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    // After 500ms, should still be initial
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // After 1000ms total, should be updated
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });

  it('handles zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current).toBe('updated');
  });

  it('handles object values', () => {
    const initial = { name: 'John' };
    const updated = { name: 'Jane' };

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: initial } }
    );

    expect(result.current).toEqual(initial);

    rerender({ value: updated });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toEqual(updated);
  });

  it('handles array values', () => {
    const initial = [1, 2, 3];
    const updated = [4, 5, 6];

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: initial } }
    );

    expect(result.current).toEqual(initial);

    rerender({ value: updated });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toEqual(updated);
  });

  it('handles null and undefined', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: null as string | null } }
    );

    expect(result.current).toBeNull();

    rerender({ value: 'defined' });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe('defined');

    rerender({ value: null });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBeNull();
  });

  it('cleans up timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('handles number values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 0 } }
    );

    expect(result.current).toBe(0);

    rerender({ value: 100 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(100);
  });

  it('handles boolean values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: false } }
    );

    expect(result.current).toBe(false);

    rerender({ value: true });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(true);
  });

  it('handles changing delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    // After 500ms with new delay of 1000, should still be initial
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // After full 1000ms, should be updated
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });
});
