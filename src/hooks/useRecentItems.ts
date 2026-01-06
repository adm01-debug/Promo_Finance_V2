/**
 * Hook para gerenciar itens recentes e favoritos
 * Armazena navegação do usuário para acesso rápido
 */

import { useState, useEffect, useCallback } from 'react';

interface RecentItem {
  path: string;
  label: string;
  timestamp: number;
}

interface FavoriteItem {
  path: string;
  label: string;
}

const RECENT_KEY = 'promo-recent-items';
const FAVORITES_KEY = 'promo-favorite-items';
const MAX_RECENT = 5;

export function useRecentItems() {
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedRecent = localStorage.getItem(RECENT_KEY);
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    
    if (savedRecent) {
      try {
        setRecentItems(JSON.parse(savedRecent));
      } catch (e) {
        console.error('Error parsing recent items:', e);
      }
    }
    
    if (savedFavorites) {
      try {
        setFavoriteItems(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error parsing favorites:', e);
      }
    }
  }, []);

  // Add item to recent
  const addRecentItem = useCallback((path: string, label: string) => {
    // Skip dashboard and common routes
    if (path === '/' || path === '/auth') return;
    
    setRecentItems(prev => {
      // Remove if already exists
      const filtered = prev.filter(item => item.path !== path);
      
      // Add to front
      const updated = [
        { path, label, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback((path: string, label: string) => {
    setFavoriteItems(prev => {
      const exists = prev.some(item => item.path === path);
      
      let updated: FavoriteItem[];
      if (exists) {
        updated = prev.filter(item => item.path !== path);
      } else {
        updated = [...prev, { path, label }];
      }
      
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Check if item is favorite
  const isFavorite = useCallback((path: string) => {
    return favoriteItems.some(item => item.path === path);
  }, [favoriteItems]);

  // Clear recent items
  const clearRecent = useCallback(() => {
    setRecentItems([]);
    localStorage.removeItem(RECENT_KEY);
  }, []);

  return {
    recentItems,
    favoriteItems,
    addRecentItem,
    toggleFavorite,
    isFavorite,
    clearRecent,
  };
}