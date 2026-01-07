/**
 * Sistema de Atalhos de Teclado
 * Gerenciamento centralizado de keyboard shortcuts
 */

import { useEffect, useCallback, useRef } from 'react';

// ============================================
// TIPOS
// ============================================

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  enabled?: boolean;
  scope?: string;
  preventDefault?: boolean;
}

export interface ShortcutConfig {
  id: string;
  shortcut: KeyboardShortcut;
}

// ============================================
// PARSER DE TECLAS
// ============================================

export function parseKeyCombo(combo: string): Partial<KeyboardShortcut> {
  const parts = combo.toLowerCase().split('+').map(p => p.trim());
  
  return {
    ctrlKey: parts.includes('ctrl') || parts.includes('control'),
    shiftKey: parts.includes('shift'),
    altKey: parts.includes('alt'),
    metaKey: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
    key: parts.filter(p => !['ctrl', 'control', 'shift', 'alt', 'meta', 'cmd', 'command'].includes(p))[0] || '',
  };
}

export function formatKeyCombo(shortcut: Partial<KeyboardShortcut>): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.metaKey) parts.push('⌘');
  if (shortcut.key) parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}

// ============================================
// SHORTCUT MANAGER
// ============================================

class ShortcutManager {
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private listeners: Set<(shortcuts: ShortcutConfig[]) => void> = new Set();
  private activeScopes: Set<string> = new Set(['global']);
  
  register(id: string, shortcut: KeyboardShortcut): () => void {
    this.shortcuts.set(id, { id, shortcut });
    this.notifyListeners();
    
    return () => {
      this.shortcuts.delete(id);
      this.notifyListeners();
    };
  }
  
  unregister(id: string): void {
    this.shortcuts.delete(id);
    this.notifyListeners();
  }
  
  setScope(scope: string, active: boolean): void {
    if (active) {
      this.activeScopes.add(scope);
    } else {
      this.activeScopes.delete(scope);
    }
  }
  
  getAll(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }
  
  getByScope(scope: string): ShortcutConfig[] {
    return this.getAll().filter(s => s.shortcut.scope === scope || !s.shortcut.scope);
  }
  
  handleKeyDown(event: KeyboardEvent): boolean {
    for (const config of this.shortcuts.values()) {
      const { shortcut } = config;
      
      // Check if shortcut is enabled
      if (shortcut.enabled === false) continue;
      
      // Check scope
      if (shortcut.scope && !this.activeScopes.has(shortcut.scope)) continue;
      
      // Match key combination
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrlKey === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      
      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        return true;
      }
    }
    
    return false;
  }
  
  subscribe(listener: (shortcuts: ShortcutConfig[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    const shortcuts = this.getAll();
    this.listeners.forEach(listener => listener(shortcuts));
  }
}

export const shortcutManager = new ShortcutManager();

// ============================================
// HOOKS
// ============================================

/**
 * Hook para registrar um atalho de teclado
 */
export function useKeyboardShortcut(
  id: string,
  shortcut: KeyboardShortcut | null,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    if (!shortcut) return;
    
    return shortcutManager.register(id, shortcut);
  }, [id, ...deps]);
}

/**
 * Hook para registrar múltiplos atalhos
 */
export function useKeyboardShortcuts(
  shortcuts: Record<string, KeyboardShortcut>,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    const unsubscribers = Object.entries(shortcuts).map(([id, shortcut]) => 
      shortcutManager.register(id, shortcut)
    );
    
    return () => unsubscribers.forEach(unsub => unsub());
  }, deps);
}

/**
 * Hook para escutar eventos de teclado globais
 */
export function useGlobalKeyboardHandler(): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      shortcutManager.handleKeyDown(event);
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}

/**
 * Hook para atalho de escape
 */
export function useEscapeKey(callback: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback();
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callback, enabled]);
}

/**
 * Hook para atalho de Enter
 */
export function useEnterKey(
  callback: () => void,
  options: { ctrlKey?: boolean; enabled?: boolean } = {}
): void {
  const { ctrlKey = false, enabled = true } = options;
  
  useEffect(() => {
    if (!enabled) return;
    
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (!ctrlKey || event.ctrlKey)) {
        callback();
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callback, ctrlKey, enabled]);
}

/**
 * Hook para navegação com setas
 */
export function useArrowNavigation<T>(
  items: T[],
  options: {
    onSelect?: (item: T, index: number) => void;
    loop?: boolean;
    enabled?: boolean;
  } = {}
): {
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  selectedItem: T | undefined;
} {
  const { onSelect, loop = true, enabled = true } = options;
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  useEffect(() => {
    if (!enabled || items.length === 0) return;
    
    const handler = (event: KeyboardEvent) => {
      let newIndex = selectedIndex;
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        newIndex = selectedIndex + 1;
        if (newIndex >= items.length) {
          newIndex = loop ? 0 : items.length - 1;
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        newIndex = selectedIndex - 1;
        if (newIndex < 0) {
          newIndex = loop ? items.length - 1 : 0;
        }
      } else if (event.key === 'Enter' && onSelect) {
        event.preventDefault();
        onSelect(items[selectedIndex], selectedIndex);
        return;
      }
      
      if (newIndex !== selectedIndex) {
        setSelectedIndex(newIndex);
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items, selectedIndex, onSelect, loop, enabled]);
  
  return {
    selectedIndex,
    setSelectedIndex,
    selectedItem: items[selectedIndex],
  };
}

/**
 * Hook para detectar combinação de teclas
 */
export function useKeyCombo(
  combo: string,
  callback: () => void,
  enabled = true
): void {
  const parsed = parseKeyCombo(combo);
  
  useEffect(() => {
    if (!enabled) return;
    
    const handler = (event: KeyboardEvent) => {
      const keyMatch = event.key.toLowerCase() === parsed.key?.toLowerCase();
      const ctrlMatch = !!parsed.ctrlKey === (event.ctrlKey || event.metaKey);
      const shiftMatch = !!parsed.shiftKey === event.shiftKey;
      const altMatch = !!parsed.altKey === event.altKey;
      
      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        callback();
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [combo, callback, enabled]);
}

/**
 * Hook para listar todos os atalhos registrados
 */
export function useShortcutsList(): ShortcutConfig[] {
  const [shortcuts, setShortcuts] = React.useState<ShortcutConfig[]>([]);
  
  useEffect(() => {
    setShortcuts(shortcutManager.getAll());
    return shortcutManager.subscribe(setShortcuts);
  }, []);
  
  return shortcuts;
}

// Import React for hooks
import * as React from 'react';

// ============================================
// ATALHOS PADRÃO DA APLICAÇÃO
// ============================================

export const DEFAULT_SHORTCUTS = {
  // Navegação
  SEARCH: { key: 'k', ctrlKey: true, description: 'Abrir busca' },
  HOME: { key: 'h', ctrlKey: true, description: 'Ir para home' },
  BACK: { key: 'ArrowLeft', altKey: true, description: 'Voltar' },
  FORWARD: { key: 'ArrowRight', altKey: true, description: 'Avançar' },
  
  // Ações
  SAVE: { key: 's', ctrlKey: true, description: 'Salvar' },
  NEW: { key: 'n', ctrlKey: true, description: 'Novo item' },
  DELETE: { key: 'Delete', description: 'Excluir selecionado' },
  EDIT: { key: 'e', ctrlKey: true, description: 'Editar selecionado' },
  REFRESH: { key: 'r', ctrlKey: true, description: 'Atualizar' },
  
  // Interface
  TOGGLE_SIDEBAR: { key: 'b', ctrlKey: true, description: 'Alternar sidebar' },
  TOGGLE_THEME: { key: 't', ctrlKey: true, shiftKey: true, description: 'Alternar tema' },
  HELP: { key: '?', shiftKey: true, description: 'Ajuda' },
  ESCAPE: { key: 'Escape', description: 'Fechar/Cancelar' },
} as const;
