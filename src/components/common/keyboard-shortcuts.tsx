import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { Command, Search, Plus, Home, FileText, Users, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Shortcut {
  id: string;
  keys: string[];
  description: string;
  category: string;
  action: () => void;
  enabled?: boolean;
}

interface ShortcutsContextValue {
  shortcuts: Shortcut[];
  registerShortcut: (shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
}

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

// Format key for display
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    meta: '⌘',
    ctrl: 'Ctrl',
    alt: 'Alt',
    shift: '⇧',
    enter: '↵',
    escape: 'Esc',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    backspace: '⌫',
    delete: 'Del',
    tab: 'Tab',
    space: 'Space',
  };

  return keyMap[key.toLowerCase()] || key.toUpperCase();
}

// Check if shortcut matches event
function matchesShortcut(event: KeyboardEvent, keys: string[]): boolean {
  const pressedKeys = new Set<string>();

  if (event.metaKey) pressedKeys.add('meta');
  if (event.ctrlKey) pressedKeys.add('ctrl');
  if (event.altKey) pressedKeys.add('alt');
  if (event.shiftKey) pressedKeys.add('shift');
  pressedKeys.add(event.key.toLowerCase());

  if (pressedKeys.size !== keys.length) return false;

  return keys.every((key) => pressedKeys.has(key.toLowerCase()));
}

// Shortcuts Provider
interface ShortcutsProviderProps {
  children: ReactNode;
}

export function ShortcutsProvider({ children }: ShortcutsProviderProps) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Register shortcut
  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts((prev) => {
      const existing = prev.find((s) => s.id === shortcut.id);
      if (existing) {
        return prev.map((s) => (s.id === shortcut.id ? shortcut : s));
      }
      return [...prev, shortcut];
    });
  }, []);

  // Unregister shortcut
  const unregisterShortcut = useCallback((id: string) => {
    setShortcuts((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Open/close help
  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const toggleHelp = useCallback(() => setIsHelpOpen((prev) => !prev), []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to close modals
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Check for help shortcut (? or Shift+/)
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        toggleHelp();
        return;
      }

      // Check registered shortcuts
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        if (matchesShortcut(event, shortcut.keys)) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, toggleHelp]);

  return (
    <ShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcut,
        unregisterShortcut,
        isHelpOpen,
        openHelp,
        closeHelp,
        toggleHelp,
      }}
    >
      {children}
      {isHelpOpen && <ShortcutsHelp />}
    </ShortcutsContext.Provider>
  );
}

// Hook to use shortcuts
export function useShortcuts() {
  const context = useContext(ShortcutsContext);
  if (!context) {
    throw new Error('useShortcuts must be used within a ShortcutsProvider');
  }
  return context;
}

// Hook to register a shortcut
export function useShortcut(
  id: string,
  keys: string[],
  action: () => void,
  options: { description?: string; category?: string; enabled?: boolean } = {}
) {
  const { registerShortcut, unregisterShortcut } = useShortcuts();

  useEffect(() => {
    registerShortcut({
      id,
      keys,
      description: options.description || id,
      category: options.category || 'Geral',
      action,
      enabled: options.enabled ?? true,
    });

    return () => unregisterShortcut(id);
  }, [id, keys, action, options.description, options.category, options.enabled, registerShortcut, unregisterShortcut]);
}

// Shortcuts Help Modal
function ShortcutsHelp() {
  const { shortcuts, closeHelp } = useShortcuts();
  const [searchQuery, setSearchQuery] = useState('');

  // Group shortcuts by category
  const categories = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  // Filter shortcuts
  const filteredCategories = Object.entries(categories).reduce(
    (acc, [category, items]) => {
      const filtered = items.filter(
        (s) =>
          s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.keys.join(' ').toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[category] = filtered;
      }
      return acc;
    },
    {} as Record<string, Shortcut[]>
  );

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeHelp();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeHelp]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeHelp}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Command className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Atalhos de Teclado
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pressione <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">?</kbd> para abrir/fechar
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar atalhos..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {Object.entries(filteredCategories).length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhum atalho encontrado
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredCategories).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {items.map((shortcut) => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, index) => (
                            <span key={index}>
                              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-mono">
                                {formatKey(key)}
                              </kbd>
                              {index < shortcut.keys.length - 1 && (
                                <span className="mx-1 text-gray-400">+</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Key Badge Component
interface KeyBadgeProps {
  keys: string[];
  size?: 'sm' | 'md';
  className?: string;
}

export function KeyBadge({ keys, size = 'sm', className }: KeyBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {keys.map((key, index) => (
        <span key={index} className="flex items-center">
          <kbd
            className={cn(
              'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded font-mono',
              sizeClasses[size]
            )}
          >
            {formatKey(key)}
          </kbd>
          {index < keys.length - 1 && (
            <span className="mx-0.5 text-gray-400 text-xs">+</span>
          )}
        </span>
      ))}
    </div>
  );
}

// Default shortcuts for Finance Hub
export const defaultShortcuts: Omit<Shortcut, 'action'>[] = [
  // Navigation
  { id: 'go-home', keys: ['g', 'h'], description: 'Ir para Dashboard', category: 'Navegação' },
  { id: 'go-accounts', keys: ['g', 'a'], description: 'Ir para Contas', category: 'Navegação' },
  { id: 'go-suppliers', keys: ['g', 's'], description: 'Ir para Fornecedores', category: 'Navegação' },
  { id: 'go-reports', keys: ['g', 'r'], description: 'Ir para Relatórios', category: 'Navegação' },
  { id: 'go-settings', keys: ['g', ','], description: 'Ir para Configurações', category: 'Navegação' },

  // Actions
  { id: 'new-account', keys: ['n'], description: 'Nova conta', category: 'Ações' },
  { id: 'search', keys: ['ctrl', 'k'], description: 'Buscar', category: 'Ações' },
  { id: 'save', keys: ['ctrl', 's'], description: 'Salvar', category: 'Ações' },
  { id: 'refresh', keys: ['ctrl', 'r'], description: 'Atualizar dados', category: 'Ações' },

  // General
  { id: 'help', keys: ['?'], description: 'Mostrar atalhos', category: 'Geral' },
  { id: 'close', keys: ['escape'], description: 'Fechar modal/menu', category: 'Geral' },
  { id: 'toggle-theme', keys: ['ctrl', 't'], description: 'Alternar tema', category: 'Geral' },
];

export type { Shortcut };
export default ShortcutsProvider;
