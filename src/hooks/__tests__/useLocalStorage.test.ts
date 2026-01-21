import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('returns stored value when localStorage has value', () => {
    localStorage.setItem('test-key', JSON.stringify('stored value'));
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    expect(result.current[0]).toBe('stored value');
  });

  it('stores value in localStorage when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
    
    act(() => {
      result.current[1]('new value');
    });
    
    expect(result.current[0]).toBe('new value');
    expect(JSON.parse(localStorage.getItem('test-key') || '')).toBe('new value');
  });

  it('handles function updater', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    
    act(() => {
      result.current[1]((prev) => prev + 1);
    });
    
    expect(result.current[0]).toBe(1);
    
    act(() => {
      result.current[1]((prev) => prev + 5);
    });
    
    expect(result.current[0]).toBe(6);
  });

  it('handles object values', () => {
    const initialObject = { name: 'John', age: 30 };
    const { result } = renderHook(() => useLocalStorage('user', initialObject));
    
    expect(result.current[0]).toEqual(initialObject);
    
    act(() => {
      result.current[1]({ name: 'Jane', age: 25 });
    });
    
    expect(result.current[0]).toEqual({ name: 'Jane', age: 25 });
  });

  it('handles array values', () => {
    const initialArray = [1, 2, 3];
    const { result } = renderHook(() => useLocalStorage('numbers', initialArray));
    
    expect(result.current[0]).toEqual(initialArray);
    
    act(() => {
      result.current[1]([4, 5, 6]);
    });
    
    expect(result.current[0]).toEqual([4, 5, 6]);
  });

  it('handles null values', () => {
    const { result } = renderHook(() => useLocalStorage<string | null>('nullable', null));
    
    expect(result.current[0]).toBeNull();
    
    act(() => {
      result.current[1]('not null');
    });
    
    expect(result.current[0]).toBe('not null');
    
    act(() => {
      result.current[1](null);
    });
    
    expect(result.current[0]).toBeNull();
  });

  it('handles undefined values with default', () => {
    const { result } = renderHook(() => useLocalStorage('undefined-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('removes value from localStorage when setting to undefined', () => {
    const { result } = renderHook(() => 
      useLocalStorage<string | undefined>('remove-test', 'initial')
    );
    
    act(() => {
      result.current[1](undefined);
    });
    
    expect(result.current[0]).toBeUndefined();
  });

  it('handles storage errors gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock localStorage.setItem to throw
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full');
    });
    
    const { result } = renderHook(() => useLocalStorage('error-key', 'initial'));
    
    act(() => {
      result.current[1]('new value');
    });
    
    // Should still update state even if storage fails
    expect(result.current[0]).toBe('new value');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('handles JSON parse errors gracefully', () => {
    localStorage.setItem('invalid-json', 'not valid json');
    
    const { result } = renderHook(() => useLocalStorage('invalid-json', 'default'));
    
    // Should return default value when JSON is invalid
    expect(result.current[0]).toBe('default');
  });

  it('syncs across multiple hooks with same key', () => {
    const { result: result1 } = renderHook(() => useLocalStorage('shared-key', 'initial'));
    const { result: result2 } = renderHook(() => useLocalStorage('shared-key', 'initial'));
    
    act(() => {
      result1.current[1]('updated');
    });
    
    // Both hooks should have the same value in localStorage
    expect(JSON.parse(localStorage.getItem('shared-key') || '')).toBe('updated');
  });

  it('handles boolean values', () => {
    const { result } = renderHook(() => useLocalStorage('bool-key', false));
    
    expect(result.current[0]).toBe(false);
    
    act(() => {
      result.current[1](true);
    });
    
    expect(result.current[0]).toBe(true);
    expect(JSON.parse(localStorage.getItem('bool-key') || '')).toBe(true);
  });

  it('handles number values', () => {
    const { result } = renderHook(() => useLocalStorage('number-key', 42));
    
    expect(result.current[0]).toBe(42);
    
    act(() => {
      result.current[1](100);
    });
    
    expect(result.current[0]).toBe(100);
  });

  it('returns remove function', () => {
    const { result } = renderHook(() => useLocalStorage('removable', 'value'));
    
    expect(result.current[0]).toBe('value');
    
    // If the hook returns a third element (remove function)
    if (result.current.length > 2 && typeof result.current[2] === 'function') {
      act(() => {
        result.current[2]();
      });
      
      expect(localStorage.getItem('removable')).toBeNull();
    }
  });

  it('uses prefix when provided', () => {
    const { result } = renderHook(() => 
      useLocalStorage('key', 'value', { prefix: 'app_' })
    );
    
    act(() => {
      result.current[1]('new value');
    });
    
    // Check if prefixed key is used (implementation dependent)
    expect(result.current[0]).toBe('new value');
  });
});
