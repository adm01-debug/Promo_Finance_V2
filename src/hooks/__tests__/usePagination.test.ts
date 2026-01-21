import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => usePagination({ totalItems: 100 }));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.totalPages).toBe(10);
  });

  it('calculates total pages correctly', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 25, pageSize: 10 })
    );

    expect(result.current.totalPages).toBe(3);
  });

  it('navigates to next page', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 50, pageSize: 10 })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('navigates to previous page', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 50, initialPage: 3 })
    );

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('does not go below page 1', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 50 })
    );

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('does not exceed total pages', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 30, pageSize: 10, initialPage: 3 })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(3);
  });

  it('goes to specific page', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 100 })
    );

    act(() => {
      result.current.goToPage(5);
    });

    expect(result.current.currentPage).toBe(5);
  });

  it('clamps page to valid range', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 50 })
    );

    act(() => {
      result.current.goToPage(100);
    });

    expect(result.current.currentPage).toBe(5);

    act(() => {
      result.current.goToPage(-5);
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('calculates start and end indices', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 100, pageSize: 10, initialPage: 2 })
    );

    expect(result.current.startIndex).toBe(10);
    expect(result.current.endIndex).toBe(19);
  });

  it('handles last page end index correctly', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 25, pageSize: 10, initialPage: 3 })
    );

    expect(result.current.startIndex).toBe(20);
    expect(result.current.endIndex).toBe(24);
  });

  it('provides hasNextPage and hasPrevPage', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 30, pageSize: 10 })
    );

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPrevPage).toBe(false);

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPrevPage).toBe(true);
  });

  it('provides first and last page functions', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 100, initialPage: 5 })
    );

    act(() => {
      result.current.firstPage();
    });

    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.lastPage();
    });

    expect(result.current.currentPage).toBe(10);
  });

  it('changes page size and adjusts current page', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 100, pageSize: 10, initialPage: 10 })
    );

    act(() => {
      result.current.setPageSize(20);
    });

    expect(result.current.pageSize).toBe(20);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.currentPage).toBe(5);
  });

  it('calls onChange callback', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => 
      usePagination({ totalItems: 50, onChange })
    );

    act(() => {
      result.current.nextPage();
    });

    expect(onChange).toHaveBeenCalledWith({ page: 2, pageSize: 10 });
  });

  it('provides page numbers for pagination UI', () => {
    const { result } = renderHook(() => 
      usePagination({ totalItems: 100, initialPage: 5 })
    );

    const pages = result.current.getPageNumbers(5);
    expect(pages).toContain(5);
    expect(pages.length).toBeLessThanOrEqual(5);
  });

  it('resets to page 1 when total items changes', () => {
    const { result, rerender } = renderHook(
      ({ totalItems }) => usePagination({ totalItems, resetOnTotalChange: true }),
      { initialProps: { totalItems: 100 } }
    );

    act(() => {
      result.current.goToPage(10);
    });

    rerender({ totalItems: 50 });

    expect(result.current.currentPage).toBe(1);
  });
});
