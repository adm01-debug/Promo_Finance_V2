import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Home,
  FileText,
  Users,
  Building2,
  BarChart3,
  Settings,
  Plus,
  HelpCircle,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useTheme } from '@/contexts/theme-context';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  customCommands?: CommandItem[];
}

export function CommandPalette({ isOpen, onClose, customCommands = [] }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Default commands
  const defaultCommands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      subtitle: 'Visão geral das finanças',
      icon: <Home className="w-4 h-4" />,
      shortcut: 'G D',
      action: () => navigate('/dashboard'),
      category: 'Navegação',
      keywords: ['home', 'início', 'painel'],
    },
    {
      id: 'nav-contas-pagar',
      title: 'Contas a Pagar',
      subtitle: 'Gerenciar despesas',
      icon: <FileText className="w-4 h-4" />,
      shortcut: 'G P',
      action: () => navigate('/contas-pagar'),
      category: 'Navegação',
      keywords: ['despesas', 'pagamentos', 'bills'],
    },
    {
      id: 'nav-contas-receber',
      title: 'Contas a Receber',
      subtitle: 'Gerenciar receitas',
      icon: <FileText className="w-4 h-4" />,
      shortcut: 'G R',
      action: () => navigate('/contas-receber'),
      category: 'Navegação',
      keywords: ['receitas', 'recebimentos', 'income'],
    },
    {
      id: 'nav-clientes',
      title: 'Clientes',
      subtitle: 'Cadastro de clientes',
      icon: <Users className="w-4 h-4" />,
      shortcut: 'G C',
      action: () => navigate('/clientes'),
      category: 'Navegação',
      keywords: ['customers', 'cadastro'],
    },
    {
      id: 'nav-fornecedores',
      title: 'Fornecedores',
      subtitle: 'Cadastro de fornecedores',
      icon: <Building2 className="w-4 h-4" />,
      shortcut: 'G F',
      action: () => navigate('/fornecedores'),
      category: 'Navegação',
      keywords: ['suppliers', 'vendors'],
    },
    {
      id: 'nav-relatorios',
      title: 'Relatórios',
      subtitle: 'Análises e relatórios',
      icon: <BarChart3 className="w-4 h-4" />,
      action: () => navigate('/relatorios'),
      category: 'Navegação',
      keywords: ['reports', 'análise', 'charts'],
    },
    {
      id: 'nav-configuracoes',
      title: 'Configurações',
      subtitle: 'Preferências do sistema',
      icon: <Settings className="w-4 h-4" />,
      shortcut: 'G S',
      action: () => navigate('/configuracoes'),
      category: 'Navegação',
      keywords: ['settings', 'preferências', 'config'],
    },

    // Actions
    {
      id: 'action-new-conta-pagar',
      title: 'Nova Conta a Pagar',
      subtitle: 'Criar nova despesa',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        navigate('/contas-pagar');
        // Trigger modal via event or state
      },
      category: 'Ações',
      keywords: ['criar', 'adicionar', 'nova despesa'],
    },
    {
      id: 'action-new-conta-receber',
      title: 'Nova Conta a Receber',
      subtitle: 'Criar nova receita',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        navigate('/contas-receber');
      },
      category: 'Ações',
      keywords: ['criar', 'adicionar', 'nova receita'],
    },
    {
      id: 'action-new-cliente',
      title: 'Novo Cliente',
      subtitle: 'Cadastrar cliente',
      icon: <Plus className="w-4 h-4" />,
      action: () => navigate('/clientes?action=new'),
      category: 'Ações',
      keywords: ['criar', 'adicionar', 'cadastrar'],
    },
    {
      id: 'action-new-fornecedor',
      title: 'Novo Fornecedor',
      subtitle: 'Cadastrar fornecedor',
      icon: <Plus className="w-4 h-4" />,
      action: () => navigate('/fornecedores?action=new'),
      category: 'Ações',
      keywords: ['criar', 'adicionar', 'cadastrar'],
    },

    // System
    {
      id: 'system-theme',
      title: theme === 'dark' ? 'Tema Claro' : 'Tema Escuro',
      subtitle: 'Alternar tema',
      icon: theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
      action: toggleTheme,
      category: 'Sistema',
      keywords: ['dark', 'light', 'mode', 'aparência'],
    },
    {
      id: 'system-help',
      title: 'Ajuda',
      subtitle: 'Atalhos de teclado',
      icon: <HelpCircle className="w-4 h-4" />,
      shortcut: '?',
      action: () => {
        // Trigger help modal
        document.dispatchEvent(new CustomEvent('open-shortcuts-help'));
      },
      category: 'Sistema',
      keywords: ['shortcuts', 'atalhos', 'help'],
    },
    {
      id: 'system-logout',
      title: 'Sair',
      subtitle: 'Encerrar sessão',
      icon: <LogOut className="w-4 h-4" />,
      action: () => {
        // Trigger logout
        navigate('/login');
      },
      category: 'Sistema',
      keywords: ['logout', 'deslogar', 'sair'],
    },
  ], [navigate, theme, toggleTheme]);

  // Combine default and custom commands
  const allCommands = useMemo(() => {
    return [...defaultCommands, ...customCommands];
  }, [defaultCommands, customCommands]);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return allCommands;

    const searchLower = search.toLowerCase();
    return allCommands.filter((command) => {
      const matchTitle = command.title.toLowerCase().includes(searchLower);
      const matchSubtitle = command.subtitle?.toLowerCase().includes(searchLower);
      const matchKeywords = command.keywords?.some((k) => k.toLowerCase().includes(searchLower));
      return matchTitle || matchSubtitle || matchKeywords;
    });
  }, [allCommands, search]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((command) => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });
    return groups;
  }, [filteredCommands]);

  // Flatten for navigation
  const flatCommands = useMemo(() => {
    return Object.values(groupedCommands).flat();
  }, [groupedCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < flatCommands.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : flatCommands.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [flatCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selected = listRef.current?.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite um comando ou busque..."
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          />
          <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands list */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          {Object.entries(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              Nenhum comando encontrado
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {category}
                </div>
                {commands.map((command) => {
                  const index = flatCommands.indexOf(command);
                  const isSelected = index === selectedIndex;

                  return (
                    <button
                      key={command.id}
                      data-selected={isSelected}
                      onClick={() => {
                        command.action();
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        isSelected
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                    >
                      <span className="flex-shrink-0 text-gray-400">
                        {command.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{command.title}</div>
                        {command.subtitle && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {command.subtitle}
                          </div>
                        )}
                      </div>
                      {command.shortcut && (
                        <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                          {command.shortcut}
                        </kbd>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded ml-1">↓</kbd>
              {' '}navegar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Enter</kbd>
              {' '}selecionar
            </span>
          </div>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">Ctrl+K</kbd>
            {' '}para abrir
          </span>
        </div>
      </div>
    </div>
  );
}

// Hook to manage command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Register global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  return {
    isOpen,
    open,
    close,
    toggle,
    CommandPaletteComponent: ({ customCommands }: { customCommands?: CommandItem[] }) => (
      <CommandPalette isOpen={isOpen} onClose={close} customCommands={customCommands} />
    ),
  };
}

export default CommandPalette;
