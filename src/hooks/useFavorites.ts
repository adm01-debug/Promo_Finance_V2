import { useState, useCallback, useEffect } from 'react';

interface FavoriteItem {
  id: string;
  type: 'page' | 'report' | 'filter' | 'search' | 'entity';
  title: string;
  url?: string;
  metadata?: Record<string, unknown>;
  addedAt: number;
}

interface UseFavoritesOptions {
  storageKey?: string;
  maxItems?: number;
  onAdd?: (item: FavoriteItem) => void;
  onRemove?: (item: FavoriteItem) => void;
}

/**
 * Hook for managing user favorites
 */
export function useFavorites(options: UseFavoritesOptions = {}) {
  const {
    storageKey = 'finance-hub-favorites',
    maxItems = 50,
    onAdd,
    onRemove,
  } = options;

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  }, [favorites, storageKey]);

  // Add favorite
  const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    const newItem: FavoriteItem = {
      ...item,
      addedAt: Date.now(),
    };

    setFavorites((prev) => {
      // Check if already exists
      if (prev.some((f) => f.id === item.id && f.type === item.type)) {
        return prev;
      }

      // Enforce max items
      const newFavorites = [newItem, ...prev].slice(0, maxItems);
      return newFavorites;
    });

    onAdd?.(newItem);
  }, [maxItems, onAdd]);

  // Remove favorite
  const removeFavorite = useCallback((id: string, type?: string) => {
    setFavorites((prev) => {
      const item = prev.find((f) => f.id === id && (!type || f.type === type));
      if (item) {
        onRemove?.(item);
      }
      return prev.filter((f) => !(f.id === id && (!type || f.type === type)));
    });
  }, [onRemove]);

  // Toggle favorite
  const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    const exists = favorites.some((f) => f.id === item.id && f.type === item.type);
    if (exists) {
      removeFavorite(item.id, item.type);
    } else {
      addFavorite(item);
    }
    return !exists;
  }, [favorites, addFavorite, removeFavorite]);

  // Check if is favorite
  const isFavorite = useCallback((id: string, type?: string) => {
    return favorites.some((f) => f.id === id && (!type || f.type === type));
  }, [favorites]);

  // Get favorites by type
  const getFavoritesByType = useCallback((type: FavoriteItem['type']) => {
    return favorites.filter((f) => f.type === type);
  }, [favorites]);

  // Clear all favorites
  const clearFavorites = useCallback((type?: FavoriteItem['type']) => {
    setFavorites((prev) => {
      if (type) {
        return prev.filter((f) => f.type !== type);
      }
      return [];
    });
  }, []);

  // Reorder favorites
  const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  // Update favorite metadata
  const updateFavorite = useCallback((id: string, updates: Partial<FavoriteItem>) => {
    setFavorites((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      )
    );
  }, []);

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
    clearFavorites,
    reorderFavorites,
    updateFavorite,
  };
}

/**
 * Hook for recent items (auto-managed favorites based on usage)
 */
export function useRecentItems(options: {
  storageKey?: string;
  maxItems?: number;
} = {}) {
  const { storageKey = 'finance-hub-recent', maxItems = 10 } = options;

  const [recentItems, setRecentItems] = useState<FavoriteItem[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(recentItems));
    } catch (error) {
      console.error('Failed to save recent items:', error);
    }
  }, [recentItems, storageKey]);

  // Add or update recent item
  const addRecent = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setRecentItems((prev) => {
      // Remove if exists (to move to top)
      const filtered = prev.filter((r) => !(r.id === item.id && r.type === item.type));
      
      // Add to top
      return [
        { ...item, addedAt: Date.now() },
        ...filtered,
      ].slice(0, maxItems);
    });
  }, [maxItems]);

  // Remove from recent
  const removeRecent = useCallback((id: string, type?: string) => {
    setRecentItems((prev) =>
      prev.filter((r) => !(r.id === id && (!type || r.type === type)))
    );
  }, []);

  // Clear all recent
  const clearRecent = useCallback(() => {
    setRecentItems([]);
  }, []);

  // Get recent by type
  const getRecentByType = useCallback((type: FavoriteItem['type']) => {
    return recentItems.filter((r) => r.type === type);
  }, [recentItems]);

  return {
    recentItems,
    addRecent,
    removeRecent,
    clearRecent,
    getRecentByType,
  };
}

/**
 * Hook for pinned items
 */
export function usePinnedItems(options: {
  storageKey?: string;
  maxPins?: number;
} = {}) {
  const { storageKey = 'finance-hub-pinned', maxPins = 10 } = options;

  const [pinnedItems, setPinnedItems] = useState<FavoriteItem[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(pinnedItems));
    } catch (error) {
      console.error('Failed to save pinned items:', error);
    }
  }, [pinnedItems, storageKey]);

  // Pin item
  const pin = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setPinnedItems((prev) => {
      // Check if already pinned
      if (prev.some((p) => p.id === item.id && p.type === item.type)) {
        return prev;
      }

      // Check max pins
      if (prev.length >= maxPins) {
        console.warn(`Maximum pins (${maxPins}) reached`);
        return prev;
      }

      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, [maxPins]);

  // Unpin item
  const unpin = useCallback((id: string, type?: string) => {
    setPinnedItems((prev) =>
      prev.filter((p) => !(p.id === id && (!type || p.type === type)))
    );
  }, []);

  // Toggle pin
  const togglePin = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    const isPinned = pinnedItems.some((p) => p.id === item.id && p.type === item.type);
    if (isPinned) {
      unpin(item.id, item.type);
    } else {
      pin(item);
    }
    return !isPinned;
  }, [pinnedItems, pin, unpin]);

  // Check if pinned
  const isPinned = useCallback((id: string, type?: string) => {
    return pinnedItems.some((p) => p.id === id && (!type || p.type === type));
  }, [pinnedItems]);

  // Reorder pins
  const reorderPins = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedItems((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  return {
    pinnedItems,
    pin,
    unpin,
    togglePin,
    isPinned,
    reorderPins,
    canPin: pinnedItems.length < maxPins,
  };
}

export type { FavoriteItem };
export default useFavorites;
