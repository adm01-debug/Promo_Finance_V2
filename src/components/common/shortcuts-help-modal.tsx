import { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcut, getRegisteredShortcuts, APP_SHORTCUTS } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{ keys: string; description: string }>;
}

const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Geral',
    shortcuts: [
      { keys: 'Ctrl+K', description: 'Abrir busca global' },
      { keys: 'Ctrl+S', description: 'Salvar' },
      { keys: 'Ctrl+N', description: 'Novo item' },
      { keys: 'Esc', description: 'Fechar modal/cancelar' },
      { keys: 'Shift+?', description: 'Mostrar atalhos' },
    ],
  },
  {
    title: 'Navegação',
    shortcuts: [
      { keys: 'G D', description: 'Ir para Dashboard' },
      { keys: 'G P', description: 'Ir para Contas a Pagar' },
      { keys: 'G R', description: 'Ir para Contas a Receber' },
      { keys: 'G C', description: 'Ir para Clientes' },
      { keys: 'G F', description: 'Ir para Fornecedores' },
      { keys: 'G S', description: 'Ir para Configurações' },
    ],
  },
  {
    title: 'Tabelas',
    shortcuts: [
      { keys: '↑ ↓', description: 'Navegar entre linhas' },
      { keys: 'Enter', description: 'Abrir item selecionado' },
      { keys: 'Space', description: 'Selecionar item' },
      { keys: 'Ctrl+A', description: 'Selecionar todos' },
      { keys: 'Delete', description: 'Excluir selecionados' },
    ],
  },
  {
    title: 'Filtros',
    shortcuts: [
      { keys: 'F', description: 'Focar no filtro' },
      { keys: 'Ctrl+Shift+F', description: 'Limpar filtros' },
      { keys: 'Ctrl+E', description: 'Exportar dados' },
    ],
  },
];

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  const [registeredShortcuts, setRegisteredShortcuts] = useState<Array<{ shortcut: string; description: string }>>([]);

  // Close on escape
  useKeyboardShortcut('escape', onClose, { enabled: isOpen });

  // Get registered shortcuts on mount
  useEffect(() => {
    if (isOpen) {
      setRegisteredShortcuts(getRegisteredShortcuts());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Keyboard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Atalhos de Teclado
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEFAULT_SHORTCUTS.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <ShortcutRow
                      key={shortcut.keys}
                      keys={shortcut.keys}
                      description={shortcut.description}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Dynamic registered shortcuts */}
            {registeredShortcuts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Contextuais
                </h3>
                <div className="space-y-2">
                  {registeredShortcuts.map((shortcut) => (
                    <ShortcutRow
                      key={shortcut.shortcut}
                      keys={shortcut.shortcut}
                      description={shortcut.description}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
              Dicas
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Use <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">G</kbd> seguido de uma letra para navegação rápida</li>
              <li>• No Mac, use <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">⌘</kbd> no lugar de <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">Ctrl</kbd></li>
              <li>• Pressione <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">?</kbd> a qualquer momento para ver esta ajuda</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shortcut row component
function ShortcutRow({ keys, description }: { keys: string; description: string }) {
  const keyParts = keys.split(/(?<=[+\s])|(?=[+\s])/g).filter((k) => k.trim() && k !== '+');

  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600 dark:text-gray-300">{description}</span>
      <div className="flex items-center gap-1">
        {keyParts.map((key, index) => (
          <kbd
            key={index}
            className={cn(
              'inline-flex items-center justify-center min-w-[24px] h-6 px-2',
              'text-xs font-medium text-gray-700 dark:text-gray-300',
              'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600',
              'rounded shadow-sm'
            )}
          >
            {key.trim()}
          </kbd>
        ))}
      </div>
    </div>
  );
}

// Hook to show/hide shortcuts modal
export function useShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  // Register global shortcut
  useKeyboardShortcut('shift+?', toggle, {
    description: 'Mostrar atalhos de teclado',
  });

  return {
    isOpen,
    open,
    close,
    toggle,
    ShortcutsModal: () => <ShortcutsHelpModal isOpen={isOpen} onClose={close} />,
  };
}

export default ShortcutsHelpModal;
