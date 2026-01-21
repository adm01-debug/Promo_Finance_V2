import { useState, useEffect } from 'react';
import { X, Command, Search, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { keys: ['g', 'd'], description: 'Ir para Dashboard', category: 'Navegação' },
  { keys: ['g', 'p'], description: 'Ir para Contas a Pagar', category: 'Navegação' },
  { keys: ['g', 'r'], description: 'Ir para Contas a Receber', category: 'Navegação' },
  { keys: ['g', 'c'], description: 'Ir para Clientes', category: 'Navegação' },
  { keys: ['g', 'f'], description: 'Ir para Fornecedores', category: 'Navegação' },
  { keys: ['g', 's'], description: 'Ir para Configurações', category: 'Navegação' },
  
  // Actions
  { keys: ['⌘', 'k'], description: 'Abrir busca rápida', category: 'Ações' },
  { keys: ['⌘', 'n'], description: 'Novo item', category: 'Ações' },
  { keys: ['⌘', 's'], description: 'Salvar', category: 'Ações' },
  { keys: ['⌘', 'Enter'], description: 'Enviar formulário', category: 'Ações' },
  { keys: ['Esc'], description: 'Fechar modal/cancelar', category: 'Ações' },
  
  // Table
  { keys: ['⌘', 'a'], description: 'Selecionar todos', category: 'Tabela' },
  { keys: ['↑', '↓'], description: 'Navegar entre linhas', category: 'Tabela' },
  { keys: ['Enter'], description: 'Abrir item selecionado', category: 'Tabela' },
  { keys: ['Delete'], description: 'Excluir selecionados', category: 'Tabela' },
  
  // Help
  { keys: ['?'], description: 'Mostrar atalhos', category: 'Ajuda' },
  { keys: ['⌘', '/'], description: 'Focar campo de busca', category: 'Ajuda' },
];

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter shortcuts
  const filteredShortcuts = SHORTCUTS.filter(
    (shortcut) =>
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.keys.some((key) => key.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group by category
  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atalhos de Teclado
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar atalhos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Nenhum atalho encontrado
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <span className="text-gray-700 dark:text-gray-300">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIndex) => (
                            <span key={keyIndex} className="flex items-center gap-1">
                              <KeyBadge>{key}</KeyBadge>
                              {keyIndex < shortcut.keys.length - 1 && (
                                <span className="text-gray-400 text-xs mx-0.5">+</span>
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Pressione <KeyBadge>?</KeyBadge> a qualquer momento para ver os atalhos
          </p>
        </div>
      </div>
    </div>
  );
}

// Key badge component
function KeyBadge({ children }: { children: string }) {
  const isSpecialKey = ['⌘', '⌃', '⌥', '⇧', 'Esc', 'Enter', 'Delete', '↑', '↓', '←', '→'].includes(children);
  
  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-medium rounded border',
        'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
        'text-gray-700 dark:text-gray-300',
        isSpecialKey && 'font-sans'
      )}
    >
      {children === '⌘' && <Command className="w-3 h-3" />}
      {children !== '⌘' && children}
    </kbd>
  );
}

// Hook to show shortcuts modal
export function useShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Open on '?' key
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

// Quick command palette
interface CommandItem {
  id: string;
  name: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter commands
  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cmd.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset selection on filter change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Digite um comando..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-0 focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <p className="p-4 text-center text-gray-500 dark:text-gray-400">
              Nenhum comando encontrado
            </p>
          ) : (
            <div className="py-2">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  )}
                >
                  {cmd.icon && (
                    <span className="text-gray-400">{cmd.icon}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {cmd.name}
                    </p>
                    {cmd.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {cmd.description}
                      </p>
                    )}
                  </div>
                  {cmd.shortcut && (
                    <div className="flex items-center gap-1">
                      {cmd.shortcut.map((key, i) => (
                        <KeyBadge key={i}>{key}</KeyBadge>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShortcutsModal;
