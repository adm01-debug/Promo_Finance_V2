/**
 * Local Storage Hooks
 * Type-safe localStorage with React state synchronization
 */

import { useState, useCallback, useEffect, useRef } from 'react';

// ==========================================
// TYPES
// ==========================================

type Serializer<T> = {
  serialize: (value: T) => string;
  deserialize: (value: string) => T;
};

interface UseLocalStorageOptions<T> {
  serializer?: Serializer<T>;
  syncTabs?: boolean;
  onError?: (error: Error) => void;
}

// ==========================================
// DEFAULT SERIALIZER
// ==========================================

const defaultSerializer = <T>(): Serializer<T> => ({
  serialize: (value: T) => JSON.stringify(value),
  deserialize: (value: string) => JSON.parse(value) as T,
});

// ==========================================
// MAIN HOOK
// ==========================================

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = defaultSerializer<T>(),
    syncTabs = true,
    onError,
  } = options;

  const initialValueRef = useRef(initialValue);

  // Get initial value from localStorage or use default
  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        return serializer.deserialize(item);
      }
    } catch (error) {
      onError?.(error as Error);
      console.warn(`Error reading localStorage key "${key}":`, error);
    }

    return initialValueRef.current;
  }, [key, serializer, onError]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, serializer.serialize(valueToStore));
          
          // Dispatch custom event for cross-tab sync
          if (syncTabs) {
            window.dispatchEvent(
              new StorageEvent('storage', {
                key,
                newValue: serializer.serialize(valueToStore),
              })
            );
          }
        }
      } catch (error) {
        onError?.(error as Error);
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serializer, syncTabs, onError]
  );

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValueRef.current);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (error) {
      onError?.(error as Error);
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, onError]);

  // Listen for changes from other tabs
  useEffect(() => {
    if (!syncTabs || typeof window === 'undefined') return;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(serializer.deserialize(event.newValue));
        } catch (error) {
          onError?.(error as Error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, serializer, syncTabs, onError]);

  return [storedValue, setValue, removeValue];
}

// ==========================================
// SESSION STORAGE HOOK
// ==========================================

export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: Omit<UseLocalStorageOptions<T>, 'syncTabs'> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = defaultSerializer<T>(),
    onError,
  } = options;

  const initialValueRef = useRef(initialValue);

  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = sessionStorage.getItem(key);
      if (item !== null) {
        return serializer.deserialize(item);
      }
    } catch (error) {
      onError?.(error as Error);
    }

    return initialValueRef.current;
  }, [key, serializer, onError]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(key, serializer.serialize(valueToStore));
        }
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [key, storedValue, serializer, onError]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValueRef.current);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [key, onError]);

  return [storedValue, setValue, removeValue];
}

// ==========================================
// BOOLEAN TOGGLE HOOK
// ==========================================

export function useLocalStorageToggle(
  key: string,
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useLocalStorage(key, initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, [setValue]);

  return [value, toggle, setValue];
}

// ==========================================
// OBJECT STORAGE HOOK
// ==========================================

export function useLocalStorageObject<T extends Record<string, unknown>>(
  key: string,
  initialValue: T
): {
  value: T;
  setValue: (value: T) => void;
  updateField: <K extends keyof T>(field: K, fieldValue: T[K]) => void;
  removeField: (field: keyof T) => void;
  reset: () => void;
  clear: () => void;
} {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  const updateField = useCallback(<K extends keyof T>(field: K, fieldValue: T[K]) => {
    setValue(prev => ({ ...prev, [field]: fieldValue }));
  }, [setValue]);

  const removeField = useCallback((field: keyof T) => {
    setValue(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, [setValue]);

  const reset = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  return {
    value,
    setValue,
    updateField,
    removeField,
    reset,
    clear: removeValue,
  };
}

// ==========================================
// ARRAY STORAGE HOOK
// ==========================================

export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = []
): {
  items: T[];
  add: (item: T) => void;
  remove: (index: number) => void;
  update: (index: number, item: T) => void;
  clear: () => void;
  includes: (item: T, compareFn?: (a: T, b: T) => boolean) => boolean;
  find: (predicate: (item: T) => boolean) => T | undefined;
} {
  const [items, setItems, removeItems] = useLocalStorage(key, initialValue);

  const add = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, [setItems]);

  const remove = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, [setItems]);

  const update = useCallback((index: number, item: T) => {
    setItems(prev => prev.map((existing, i) => i === index ? item : existing));
  }, [setItems]);

  const includes = useCallback(
    (item: T, compareFn?: (a: T, b: T) => boolean) => {
      if (compareFn) {
        return items.some(existing => compareFn(existing, item));
      }
      return items.includes(item);
    },
    [items]
  );

  const find = useCallback(
    (predicate: (item: T) => boolean) => items.find(predicate),
    [items]
  );

  return {
    items,
    add,
    remove,
    update,
    clear: removeItems,
    includes,
    find,
  };
}

// ==========================================
// RECENT ITEMS HOOK (with max limit)
// ==========================================

export function useRecentItems<T>(
  key: string,
  maxItems = 10,
  compareFn?: (a: T, b: T) => boolean
): {
  items: T[];
  add: (item: T) => void;
  remove: (item: T) => void;
  clear: () => void;
} {
  const [items, setItems, clearItems] = useLocalStorage<T[]>(key, []);

  const add = useCallback((item: T) => {
    setItems(prev => {
      // Remove duplicates
      const filtered = compareFn
        ? prev.filter(existing => !compareFn(existing, item))
        : prev.filter(existing => existing !== item);
      
      // Add to start and limit
      return [item, ...filtered].slice(0, maxItems);
    });
  }, [setItems, maxItems, compareFn]);

  const remove = useCallback((item: T) => {
    setItems(prev => 
      compareFn
        ? prev.filter(existing => !compareFn(existing, item))
        : prev.filter(existing => existing !== item)
    );
  }, [setItems, compareFn]);

  return {
    items,
    add,
    remove,
    clear: clearItems,
  };
}

// ==========================================
// EXPIRING STORAGE HOOK
// ==========================================

interface ExpiringValue<T> {
  value: T;
  expiry: number;
}

export function useExpiringStorage<T>(
  key: string,
  initialValue: T,
  ttlMs: number
): [T, (value: T, customTtl?: number) => void, () => void] {
  const getStoredValue = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item) as ExpiringValue<T>;
        if (Date.now() < parsed.expiry) {
          return parsed.value;
        }
        // Expired, remove it
        localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }

    return initialValue;
  }, [key, initialValue]);

  const [value, setValueState] = useState<T>(getStoredValue);

  const setValue = useCallback((newValue: T, customTtl?: number) => {
    const expiry = Date.now() + (customTtl ?? ttlMs);
    const data: ExpiringValue<T> = { value: newValue, expiry };
    
    setValueState(newValue);
    localStorage.setItem(key, JSON.stringify(data));
  }, [key, ttlMs]);

  const removeValue = useCallback(() => {
    setValueState(initialValue);
    localStorage.removeItem(key);
  }, [key, initialValue]);

  // Check expiration periodically
  useEffect(() => {
    const checkExpiry = () => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item) as ExpiringValue<T>;
          if (Date.now() >= parsed.expiry) {
            localStorage.removeItem(key);
            setValueState(initialValue);
          }
        }
      } catch {
        // Ignore
      }
    };

    const interval = setInterval(checkExpiry, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [key, initialValue]);

  return [value, setValue, removeValue];
}
