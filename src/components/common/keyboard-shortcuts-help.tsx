import { useState, useEffect } from 'react';
import { X, Keyboard, Command, Search, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShortcutGroup {
  name: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
    icon?: typeof Keyboard;
  }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    name: 'Navegação',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Ir para Dashboard' },
      { keys: ['G', 'P'], description: 'Ir para Contas a Pagar' },
      { keys: ['G', 'R'], description: 'Ir para Contas a Receber' },
      { keys: ['G', 'C'], description: 'Ir para Clientes' },
      { keys: ['G', 'F'], description: 'Ir para Fornecedores' },
      { keys: ['G', 'S'], description: 'Ir para Configurações' },
    ],
  },
  {
    name: 'Ações',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Abrir busca rápida', icon: Search },
      { keys: ['⌘', 'N'], description: 'Novo item', icon: Plus },
      { keys: ['⌘', 'S'], description: 'Salvar', icon: Save },
      { keys: ['⌘', 'Enter'], description: 'Confirmar ação' },
      { keys: ['Esc'], description: 'Fechar modal/Cancelar' },
    ],
  },
  {
    name: 'Tabelas',
    shortcuts: [
      { keys: ['↑', '↓'], description: 'Navegar entre linhas' },
      { keys: ['Enter'], description: 'Abrir item selecionado' },
      { keys: ['Space'], description: 'Selecionar/Desselecionar' },
      { keys: ['⌘', 'A'], description: 'Selecionar todos' },
      { keys: ['Delete'], description: 'Excluir selecionados' },
    ],
  },
  {
    name: 'Filtros',
    shortcuts: [
      { keys: ['F'], description: 'Abrir filtros' },
      { keys: ['⌘', 'Shift', 'F'], description: 'Limpar filtros' },
      { keys: ['/'], description: 'Focar no campo de busca' },
    ],
  },
  {
    name: 'Sistema',
    shortcuts: [
      { keys: ['?'], description: 'Mostrar atalhos (esta tela)' },
      { keys: ['⌘', ','], description: 'Abrir configurações' },
      { keys: ['⌘', 'Shift', 'D'], description: 'Alternar tema claro/escuro' },
    ],
  },
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes('mac'));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatKey = (key: string): string => {
    if (!isMac) {
      return key
        .replace('⌘', 'Ctrl')
        .replace('⌥', 'Alt')
        .replace('⇧', 'Shift');
    }
    return key;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[80vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Atalhos de Teclado
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Navegue mais rápido com atalhos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group.name}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  {group.name}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        {shortcut.icon && (
                          <shortcut.icon className="w-4 h-4 text-gray-400" />
                        )}
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <span key={keyIndex}>
                            <kbd
                              className={cn(
                                'inline-flex items-center justify-center min-w-[28px] h-7 px-2',
                                'text-xs font-medium text-gray-700 dark:text-gray-300',
                                'bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500',
                                'rounded shadow-sm'
                              )}
                            >
                              {formatKey(key)}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
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
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Pressione <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">?</kbd> a qualquer momento para ver esta ajuda
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              {isMac ? 'macOS' : 'Windows/Linux'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to open keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Shift + ?
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
    toggle: () => setIsOpen((prev) => !prev),
  };
}

export default KeyboardShortcutsHelp;
