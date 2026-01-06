/**
 * Command Palette - Acesso rápido via CMD/Ctrl + K
 * 
 * Permite navegação, ações e busca global
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Home,
  Brain,
  Wallet,
  FileText,
  Users,
  Shield,
  Settings,
  Plus,
  Search,
  Moon,
  Sun,
  Bell,
  Download,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  BarChart3,
  Target,
  CreditCard,
  Building2,
  Receipt,
  Calculator,
  LucideIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileBarChart,
  Landmark,
  Scale,
  Sparkles,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  action: () => void;
  keywords?: string[];
  shortcut?: string[];
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface CommandGroup {
  heading: string;
  items: CommandItem[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Open on Ctrl/Cmd + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      // Quick Create shortcut - "N" key when no input focused
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isInput = activeElement instanceof HTMLInputElement || 
                       activeElement instanceof HTMLTextAreaElement ||
                       activeElement?.getAttribute('contenteditable') === 'true';
        if (!isInput) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('quick-create-open'));
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  const commandGroups: CommandGroup[] = useMemo(() => [
    {
      heading: 'Navegação Rápida',
      items: [
        { id: 'home', title: 'Dashboard', subtitle: 'Visão geral financeira', icon: Home, action: () => navigate('/'), keywords: ['inicio', 'home', 'dashboard'], shortcut: ['⌥', 'D'] },
        { id: 'expert', title: 'Expert IA', subtitle: 'Assistente inteligente', icon: Sparkles, action: () => navigate('/expert'), keywords: ['ia', 'ai', 'expert', 'assistente'], shortcut: ['⌥', 'E'], badge: 'IA', badgeVariant: 'default' },
        { id: 'bi', title: 'BI & Analytics', subtitle: 'Dashboards avançados', icon: BarChart3, action: () => navigate('/bi'), keywords: ['bi', 'analytics', 'graficos'], shortcut: ['⌥', 'B'] },
        { id: 'fluxo', title: 'Fluxo de Caixa', subtitle: 'Projeções e cenários', icon: TrendingUp, action: () => navigate('/fluxo-caixa'), keywords: ['fluxo', 'caixa', 'projecao'], shortcut: ['⌥', 'F'] },
      ],
    },
    {
      heading: 'Financeiro',
      items: [
        { id: 'receber', title: 'Contas a Receber', subtitle: 'Receitas e cobrancas', icon: ArrowDownCircle, action: () => navigate('/contas-receber'), keywords: ['receber', 'receitas', 'cobrar'], shortcut: ['⌥', 'R'] },
        { id: 'pagar', title: 'Contas a Pagar', subtitle: 'Despesas e pagamentos', icon: ArrowUpCircle, action: () => navigate('/contas-pagar'), keywords: ['pagar', 'despesas'], shortcut: ['⌥', 'P'] },
        { id: 'conciliacao', title: 'Conciliação Bancária', subtitle: 'Conciliar extratos', icon: CheckCircle, action: () => navigate('/conciliacao'), keywords: ['conciliacao', 'extrato', 'banco'], shortcut: ['⌥', 'C'] },
        { id: 'boletos', title: 'Boletos', subtitle: 'Emitir e gerenciar', icon: Receipt, action: () => navigate('/boletos'), keywords: ['boleto', 'cobranca'] },
        { id: 'cobrancas', title: 'Cobranças', subtitle: 'Inadimplência e régua', icon: AlertTriangle, action: () => navigate('/cobrancas'), keywords: ['cobranca', 'inadimplencia'] },
        { id: 'bancos', title: 'Contas Bancárias', subtitle: 'Saldos e movimentações', icon: Landmark, action: () => navigate('/contas-bancarias'), keywords: ['banco', 'conta', 'saldo'] },
      ],
    },
    {
      heading: 'Documentos',
      items: [
        { id: 'nfe', title: 'Notas Fiscais', subtitle: 'NF-e, NFS-e, CT-e', icon: FileText, action: () => navigate('/notas-fiscais'), keywords: ['nota', 'fiscal', 'nfe'], shortcut: ['⌥', 'N'] },
        { id: 'relatorios', title: 'Relatórios', subtitle: 'DRE, Balanço, Fluxo', icon: FileBarChart, action: () => navigate('/relatorios'), keywords: ['relatorio', 'dre', 'balanco'], shortcut: ['⌥', 'L'] },
        { id: 'demonstrativos', title: 'Demonstrativos', subtitle: 'Contabilidade', icon: Calculator, action: () => navigate('/demonstrativos'), keywords: ['demonstrativo', 'contabil'] },
      ],
    },
    {
      heading: 'Cadastros',
      items: [
        { id: 'clientes', title: 'Clientes', subtitle: 'Base de clientes', icon: Users, action: () => navigate('/clientes'), keywords: ['cliente', 'cadastro'], shortcut: ['⌥', 'I'] },
        { id: 'fornecedores', title: 'Fornecedores', subtitle: 'Parceiros comerciais', icon: Building2, action: () => navigate('/fornecedores'), keywords: ['fornecedor', 'parceiro'], shortcut: ['⌥', 'U'] },
        { id: 'empresas', title: 'Empresas', subtitle: 'CNPJs cadastrados', icon: Building2, action: () => navigate('/empresas'), keywords: ['empresa', 'cnpj'] },
        { id: 'centros', title: 'Centros de Custo', subtitle: 'Categorização', icon: Target, action: () => navigate('/centros-custo'), keywords: ['centro', 'custo', 'categoria'] },
      ],
    },
    {
      heading: 'Compliance',
      items: [
        { id: 'tributario', title: 'Reforma Tributária', subtitle: 'IBS, CBS, Split Payment', icon: Scale, action: () => navigate('/reforma-tributaria'), keywords: ['tributario', 'ibs', 'cbs', 'reforma'] },
        { id: 'aprovacoes', title: 'Aprovações', subtitle: 'Workflow de aprovação', icon: CheckCircle, action: () => navigate('/aprovacoes'), keywords: ['aprovacao', 'workflow'], shortcut: ['⌥', 'O'] },
        { id: 'audit', title: 'Logs de Auditoria', subtitle: 'Histórico de ações', icon: Shield, action: () => navigate('/audit-logs'), keywords: ['auditoria', 'log', 'historico'] },
        { id: 'seguranca', title: 'Segurança', subtitle: 'Configurações de segurança', icon: Shield, action: () => navigate('/seguranca'), keywords: ['seguranca', 'senha', 'mfa'] },
      ],
    },
    {
      heading: 'Ações Rápidas',
      items: [
        { 
          id: 'nova-receita', 
          title: 'Nova Conta a Receber', 
          icon: Plus, 
          action: () => { navigate('/contas-receber'); setTimeout(() => document.querySelector<HTMLButtonElement>('[data-add-new]')?.click(), 100); }, 
          keywords: ['nova', 'receita', 'criar'],
          shortcut: ['⌘', '⇧', 'R'],
        },
        { 
          id: 'nova-despesa', 
          title: 'Nova Conta a Pagar', 
          icon: Plus, 
          action: () => { navigate('/contas-pagar'); setTimeout(() => document.querySelector<HTMLButtonElement>('[data-add-new]')?.click(), 100); }, 
          keywords: ['nova', 'despesa', 'criar'],
          shortcut: ['⌘', '⇧', 'P'],
        },
        { 
          id: 'exportar', 
          title: 'Exportar Dados', 
          icon: Download, 
          action: () => { const btn = document.querySelector<HTMLButtonElement>('[data-export]'); if (btn) btn.click(); else toast.info('Navegue até a página desejada para exportar'); },
          keywords: ['exportar', 'download', 'excel', 'pdf'],
          shortcut: ['⌘', '⇧', 'E'],
        },
        { 
          id: 'atualizar', 
          title: 'Atualizar Dados', 
          icon: RefreshCw, 
          action: () => { window.dispatchEvent(new CustomEvent('refresh-data')); toast.success('Dados atualizados!'); }, 
          keywords: ['atualizar', 'refresh', 'sync'],
          shortcut: ['⌘', '⇧', 'R'],
        },
      ],
    },
    {
      heading: 'Preferências',
      items: [
        { 
          id: 'theme-light', 
          title: 'Tema Claro', 
          icon: Sun, 
          action: () => setTheme('light'), 
          keywords: ['tema', 'claro', 'light'],
        },
        { 
          id: 'theme-dark', 
          title: 'Tema Escuro', 
          icon: Moon, 
          action: () => setTheme('dark'), 
          keywords: ['tema', 'escuro', 'dark'],
        },
        { 
          id: 'alertas', 
          title: 'Alertas', 
          subtitle: 'Notificações do sistema', 
          icon: Bell, 
          action: () => navigate('/alertas'), 
          keywords: ['alerta', 'notificacao'],
          shortcut: ['⌥', 'A'],
        },
        { 
          id: 'config', 
          title: 'Configurações', 
          subtitle: 'Preferências do sistema', 
          icon: Settings, 
          action: () => navigate('/configuracoes'), 
          keywords: ['configuracao', 'settings', 'preferencias'],
        },
      ],
    },
  ], [navigate, setTheme]);

  // Filter items based on search
  const filteredGroups = useMemo(() => {
    if (!search) return commandGroups;

    const searchLower = search.toLowerCase();
    return commandGroups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.title.toLowerCase().includes(searchLower) ||
        item.subtitle?.toLowerCase().includes(searchLower) ||
        item.keywords?.some(k => k.includes(searchLower))
      ),
    })).filter(group => group.items.length > 0);
  }, [commandGroups, search]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-lg">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite um comando ou busque..."
            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
            ESC
          </kbd>
        </div>
        <CommandList className="max-h-[400px]">
          <CommandEmpty className="py-6 text-center text-sm">
            <div className="flex flex-col items-center gap-2">
              <Search className="h-10 w-10 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum resultado encontrado.</p>
              <p className="text-xs text-muted-foreground/70">Tente buscar por outra palavra-chave.</p>
            </div>
          </CommandEmpty>

          {filteredGroups.map((group, groupIndex) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.title} ${item.subtitle || ''} ${item.keywords?.join(' ') || ''}`}
                  onSelect={() => runCommand(item.action)}
                  className="flex items-center gap-3 py-3 cursor-pointer"
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    'bg-muted/50 text-muted-foreground',
                    'group-aria-selected:bg-primary/10 group-aria-selected:text-primary'
                  )}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge variant={item.badgeVariant || 'secondary'} className="text-[10px] px-1.5 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                    )}
                  </div>
                  {item.shortcut && (
                    <div className="hidden sm:flex items-center gap-0.5">
                      {item.shortcut.map((key, i) => (
                        <kbd
                          key={i}
                          className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground flex"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  )}
                </CommandItem>
              ))}
              {groupIndex < filteredGroups.length - 1 && <CommandSeparator />}
            </CommandGroup>
          ))}
        </CommandList>

        {/* Footer com dicas */}
        <div className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">↵</kbd>
              selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">esc</kbd>
              fechar
            </span>
          </div>
          <span className="text-muted-foreground/70">
            Powered by <span className="font-medium text-primary">Expert IA</span>
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}
