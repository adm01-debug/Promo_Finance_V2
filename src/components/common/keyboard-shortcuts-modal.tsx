import { useState, useEffect, useCallback } from 'react';
import { X, Keyboard, Command, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutCategory {
  name: string;
  shortcuts: {
    keys: string[];
    description: string;
    action?: () => void;
  }[];
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: ShortcutCategory[];
}

const DEFAULT_SHORTCUTS: ShortcutCategory[] = [
  {
    name: 'Navegação',
    shortcuts: [
      { keys: ['g', 'd'], description: 'Ir para Dashboard' },
      { keys: ['g', 'p'], description: 'Ir para Contas a Pagar' },
      { keys: ['g', 'r'], description: 'Ir para Contas a Receber' },
      { keys: ['g', 'c'], description: 'Ir para Clientes' },
      { keys: ['g', 'f'], description: 'Ir para Fornecedores' },
      { keys: ['g', 's'], description: 'Ir para Configurações' },
    ],
  },
  {
    name: 'Ações',
    shortcuts: [
      { keys: ['Ctrl', 'k'], description: 'Abrir busca rápida' },
      { keys: ['Ctrl', 'n'], description: 'Criar novo registro' },
      { keys: ['Ctrl', 's'], description: 'Salvar' },
      { keys: ['Ctrl', 'Enter'], description: 'Salvar e fechar' },
      { keys: ['Escape'], description: 'Fechar modal/cancelar' },
    ],
  },
  {
    name: 'Tabelas',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navegar entre linhas' },
      { keys: ['Enter'], description: 'Abrir item selecionado' },
      { keys: ['Ctrl', 'a'], description: 'Selecionar todos' },
      { keys: ['Delete'], description: 'Excluir selecionados' },
      { keys: ['Ctrl', 'e'], description: 'Exportar' },
    ],
  },
  {
    name: 'Filtros',
    shortcuts: [
      { keys: ['f'], description: 'Abrir painel de filtros' },
      { keys: ['Ctrl', 'f'], description: 'Focar no campo de busca' },
      { keys: ['Escape'], description: 'Limpar filtros' },
    ],
  },
  {
    name: 'Ajuda',
    shortcuts: [
      { keys: ['?'], description: 'Mostrar atalhos de teclado' },
      { keys: ['Ctrl', '/'], description: 'Abrir ajuda' },
    ],
  },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  categories = DEFAULT_SHORTCUTS,
}: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(categories);

  // Filter shortcuts based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = categories
      .map((category) => ({
        ...category,
        shortcuts: category.shortcuts.filter((shortcut) =>
          shortcut.description.toLowerCase().includes(query) ||
          shortcut.keys.some((key) => key.toLowerCase().includes(query))
        ),
      }))
      .filter((category) => category.shortcuts.length > 0);

    setFilteredCategories(filtered);
  }, [searchQuery, categories]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Atalhos de Teclado
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Navegue mais rápido usando o teclado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar atalhos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-200px)] p-4">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <Keyboard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum atalho encontrado para "{searchQuery}"
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <div key={category.name}>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    {category.name}
                  </h3>
                  <div className="space-y-2">
                    {category.shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <KeyCombo keys={shortcut.keys} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Pressione <KeyCombo keys={['?']} /> a qualquer momento para ver esta lista
          </p>
        </div>
      </div>
    </div>
  );
}

// Key combination display
interface KeyComboProps {
  keys: string[];
  className?: string;
}

export function KeyCombo({ keys, className }: KeyComboProps) {
  const isMac = typeof navigator !== 'undefined' && 
    navigator.platform.toLowerCase().includes('mac');

  const formatKey = (key: string) => {
    const keyMap: Record<string, { mac: string; other: string }> = {
      'Ctrl': { mac: '⌘', other: 'Ctrl' },
      'Alt': { mac: '⌥', other: 'Alt' },
      'Shift': { mac: '⇧', other: 'Shift' },
      'Enter': { mac: '↵', other: 'Enter' },
      'Escape': { mac: 'Esc', other: 'Esc' },
      'Delete': { mac: '⌫', other: 'Del' },
      'Backspace': { mac: '⌫', other: '⌫' },
      '↑': { mac: '↑', other: '↑' },
      '↓': { mac: '↓', other: '↓' },
      '←': { mac: '←', other: '←' },
      '→': { mac: '→', other: '→' },
    };

    const mapped = keyMap[key];
    if (mapped) {
      return isMac ? mapped.mac : mapped.other;
    }
    return key.toUpperCase();
  };

  return (
    <span className={cn('flex items-center gap-1', className)}>
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          <kbd className="px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm text-gray-600 dark:text-gray-300">
            {formatKey(key)}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-gray-400 text-xs">+</span>
          )}
        </span>
      ))}
    </span>
  );
}

// Hook to register global shortcuts
export function useGlobalShortcuts() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // ? key to show shortcuts modal
    if (e.key === '?' && e.shiftKey) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    isModalOpen,
    openModal: () => setIsModalOpen(true),
    closeModal: () => setIsModalOpen(false),
  };
}

// Provider component that adds global shortcuts modal
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const { isModalOpen, closeModal } = useGlobalShortcuts();

  return (
    <>
      {children}
      <KeyboardShortcutsModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}

export type { ShortcutCategory };
export default KeyboardShortcutsModal;
