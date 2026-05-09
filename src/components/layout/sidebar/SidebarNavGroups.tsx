import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  Landmark,
  FileText,
  PieChart,
  Palette,
  Bell,
  Settings,
  ChevronDown,
  Key,
  Building2,
  CreditCard,
  BarChart3,
  Receipt,
  RefreshCcw,
  Users,
  Zap,
  ScrollText,
  User,
  Truck,
  FileSpreadsheet,
  ShieldCheck,
  Bot,
  Shield,
  Scale,
  Sparkles,
  Wallet,
  FolderOpen,
  UserCog,
  Wrench,
  FileSignature,
  Calculator,
  Camera,
  ArrowLeftRight,
  FileCheck,
  BookOpen,
  CheckCircle,
  EyeOff,
  History,
  Target,
  Brain,
  BrainCircuit,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';
import { useAlertasNaoLidos } from '@/hooks/useAlertas';
import { useAlertasTributariosCount } from '@/hooks/useAlertasTributariosCount';
import { useRealtimeAlertas } from '@/hooks/useRealtimeAlertas';
import { useRealtimeAnomalias } from '@/hooks/useRealtimeAnomalias';
import { useWhatsAppUnreadCount } from '@/hooks/useWhatsAppUnreadCount';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  badgeKey?: string;
  highlight?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}

// Define navigation groups - Consolidado para 5 grupos (melhor UX)
const navGroups: NavGroup[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { label: 'BI Gestão', icon: BarChart3, href: '/bi', highlight: true },
      { label: 'Inteligência Operacional 360°', icon: BrainCircuit, href: '/inteligencia', highlight: true },
      { label: 'Dashboard Empresa', icon: Building2, href: '/dashboard-empresa' },
      { label: 'Benchmarking', icon: Scale, href: '/benchmarking', highlight: true },
      { label: 'EXPERT (IA)', icon: Bot, href: '/expert', highlight: true },
      { label: 'Alertas', icon: Bell, href: '/alertas', badgeKey: 'alertas' },
    ],
  },
  {
    id: 'financial',
    label: 'Financeiro',
    icon: Wallet,
    defaultOpen: true,
    items: [
      { label: 'Visão Geral Financeira', icon: LayoutDashboard, href: '/financeiro', highlight: true },
      { label: 'Dash Contas a Pagar', icon: ArrowUpCircle, href: '/dashboard-pagar', highlight: true },
      { label: 'Dash Contas a Receber', icon: ArrowDownCircle, href: '/dashboard-receber', highlight: true },
      { label: 'Dash Conciliação', icon: RefreshCcw, href: '/dashboard-conciliacao', highlight: true },
      { label: 'Dash Aging & Cobrança', icon: Receipt, href: '/dashboard-aging', highlight: true },
      { label: 'Fluxo de Caixa', icon: BarChart3, href: '/fluxo-caixa' },
      { label: 'Tesouraria Multi-CNPJ', icon: Landmark, href: '/tesouraria' },
      { label: 'Simulador Antecipação', icon: Calculator, href: '/simulador-antecipacao' },
      { label: 'Asaas Pagamentos', icon: CreditCard, href: '/asaas', highlight: true },
      { label: 'Auditoria de Duplicidade', icon: ShieldAlert, href: '/contas-pagar/bloqueios', highlight: true },
      { label: 'Metas Financeiras', icon: Target, href: '/metas', highlight: true },
      { label: 'Quantum-Sentinel: Riscos', icon: Brain, href: '/inteligencia#alertas-preditivos', highlight: true },
    ],
  },
  {
    id: 'fiscal',
    label: 'Fiscal & Documentos',
    icon: FileText,
    items: [
      { label: 'Dashboard Tributário', icon: Scale, href: '/tributario/dashboard', highlight: true, badgeKey: 'tributario' },
      { label: 'Reforma Tributária', icon: Scale, href: '/reforma-tributaria/visao-geral' },
      { label: 'Split Payment', icon: ArrowLeftRight, href: '/reforma-tributaria/split-payment' },
      { label: 'Conciliação Tributária', icon: RefreshCcw, href: '/reforma-tributaria/conciliacao' },
      { label: 'Incentivos Fiscais', icon: Zap, href: '/reforma-tributaria/incentivos' },
      { label: 'Compliance & Auditoria', icon: ShieldCheck, href: '/reforma-tributaria/auditoria' },
      { label: 'Comparativo Regimes', icon: Scale, href: '/reforma-tributaria/comparativo' },
      { label: 'Cashback Simulador', icon: Wallet, href: '/reforma-tributaria/cashback' },
      { label: 'Importação XML', icon: FileSpreadsheet, href: '/reforma-tributaria/importacao-xml' },
      { label: 'Exportação SPED', icon: BookOpen, href: '/reforma-tributaria/exportacao' },
      { label: 'Relatórios Contábeis', icon: FileSpreadsheet, href: '/reforma-tributaria/relatorios' },
      { label: 'PER/DCOMP', icon: FileText, href: '/reforma-tributaria/per-dcomp' },
      { label: 'Retenções na Fonte', icon: Receipt, href: '/reforma-tributaria/retencoes' },
      { label: 'Fechamento Mensal', icon: FileCheck, href: '/reforma-tributaria/fechamento-mensal', highlight: true },
      { label: 'Simulação de Regimes', icon: Calculator, href: '/tributario/simulacao-regimes', highlight: true },
      { label: 'Oportunidades de Elisão', icon: Sparkles, href: '/tributario/oportunidades-elisao', highlight: true },
      { label: 'Projeção 2026-2033', icon: BarChart3, href: '/tributario/projecao-reforma', highlight: true },
      { label: 'Histórico Tributário', icon: FileSpreadsheet, href: '/tributario/historico-financeiro' },
      { label: 'Notas Fiscais', icon: FileText, href: '/notas-fiscais' },
      { label: 'Demonstrativos', icon: FileSpreadsheet, href: '/demonstrativos' },
      { label: 'Contabilidade & SPED', icon: BookOpen, href: '/contabilidade' },
      { label: 'Contratos', icon: FileCheck, href: '/contratos' },
      { label: 'Assinatura Digital', icon: FileSignature, href: '/assinatura-digital' },
      { label: 'Comprovante OCR', icon: Camera, href: '/comprovante-ocr' },
      { label: 'Relatórios', icon: FileText, href: '/relatorios' },
      { label: 'Cofre de Integridade', icon: ShieldCheck, href: '/contas-pagar/bloqueios', highlight: true },
    ],
  },
  {
    id: 'records',
    label: 'Cadastros',
    icon: Users,
    items: [
      { label: 'Clientes', icon: User, href: '/clientes' },
      { label: 'Chat & Histórico (WA)', icon: MessageSquare, href: '/cobrancas#whatsapp', badgeKey: 'whatsapp', highlight: true },
      { label: 'Scoring & Risco', icon: Target, href: '/clientes/scoring', highlight: true },
      { label: 'Portal de Tokens', icon: Key, href: '/clientes/portal-tokens' },
      { label: 'Fornecedores', icon: Truck, href: '/fornecedores' },
      { label: 'Vendedores', icon: UserCog, href: '/vendedores' },
      { label: 'Empresas (CNPJs)', icon: Building2, href: '/empresas' },
      { label: 'Gestão de Contas', icon: Landmark, href: '/contas-bancarias' },
      { label: 'Centro de Custos', icon: PieChart, href: '/centro-custos' },
      { label: 'Orçamento x Realizado', icon: Scale, href: '/orcamento-evento', highlight: true },
      { label: 'Gestão de Boletos', icon: FileText, href: '/boletos', highlight: true },
    ],
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: ShieldCheck,
    items: [
      { label: 'Aprovações', icon: ShieldCheck, href: '/aprovacoes', badgeKey: 'aprovacoes' },
      { label: 'Segurança', icon: Shield, href: '/seguranca', highlight: true },
      { label: 'Logs de Auditoria', icon: ScrollText, href: '/audit-logs' },
      { label: 'Eventos JIT (SSO)', icon: ShieldCheck, href: '/admin/sso-jit-events' },
      { label: 'Privacidade & LGPD', icon: Shield, href: '/configuracoes/privacidade', highlight: true },
      { label: 'Usuários', icon: UserCog, href: '/usuarios' },
      { label: 'Bitrix24 CRM', icon: Zap, href: '/bitrix24', highlight: true },
      { label: 'Bling ERP', icon: Package, href: '/bling', highlight: true },
      { label: 'Configurações', icon: Settings, href: '/configuracoes' },
      { label: 'Meu Perfil', icon: User, href: '/meu-perfil' },
      { label: 'Guia de Estilo', icon: Palette, href: '/style-guide', highlight: true },
    ],
  },
];

interface SidebarNavGroupsProps {
  collapsed: boolean;
}

export const SidebarNavGroups = ({ collapsed }: SidebarNavGroupsProps) => {
  const location = useLocation();
  const { count: aprovacoesPendentes } = useAprovacoesPendentesCount();
  const { data: alertasNaoLidos = 0 } = useAlertasNaoLidos();
  const { data: alertasTributarios = 0 } = useAlertasTributariosCount();
  const { data: whatsappUnread = 0 } = useWhatsAppUnreadCount();
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<Record<string, boolean>>({});
  
  useRealtimeAlertas();
  useRealtimeAnomalias();

  // Monitora filtros sincronizados para a empresa ativa
  useEffect(() => {
    const checkSync = () => {
      const keys = ['contas-receber-filters', 'contas-pagar-filters', 'conciliacao_filters', 'aging_filters', 'app-dashboard-receber-filters'];
      const status: Record<string, boolean> = {};
      keys.forEach(k => {
        const val = localStorage.getItem(k);
        if (val) status[k] = true;
      });
      setSyncStatus(status);
    };

    checkSync();
    window.addEventListener('current-empresa-changed', checkSync);
    window.addEventListener('storage', checkSync);
    return () => {
      window.removeEventListener('current-empresa-changed', checkSync);
      window.removeEventListener('storage', checkSync);
    };
  }, []);

  // Track which groups are open
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach(group => {
      // Open group if it contains current route or is defaultOpen
      const hasActiveItem = group.items.some(item => item.href === location.pathname);
      initial[group.id] = hasActiveItem || !!group.defaultOpen;
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    if (collapsed) return; // Don't toggle when collapsed
    setOpenGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Get badge count for item
  const getBadgeCount = (badgeKey?: string): number | undefined => {
    if (badgeKey === 'aprovacoes' && aprovacoesPendentes > 0) {
      return aprovacoesPendentes;
    }
    if (badgeKey === 'alertas' && alertasNaoLidos > 0) {
      return alertasNaoLidos;
    }
    if (badgeKey === 'tributario' && alertasTributarios > 0) {
      return alertasTributarios;
    }
    if (badgeKey === 'whatsapp' && (whatsappUnread > 0 || localStorage.getItem(`whatsapp-unread-manual-${user?.id}`) === 'true')) {
      return whatsappUnread || 1;
    }
    return undefined;
  };

  // Helper to determine if an item is synced
  const isItemSynced = (href: string) => {
    if (href === '/contas-receber' || href === '/dashboard-receber') return syncStatus['contas-receber-filters'] || syncStatus['app-dashboard-receber-filters'];
    if (href === '/contas-pagar' || href === '/dashboard-pagar') return syncStatus['contas-pagar-filters'];
    if (href === '/conciliacao' || href === '/dashboard-conciliacao') return syncStatus['conciliacao_filters'];
    if (href === '/cobrancas' || href === '/dashboard-aging') return syncStatus['aging_filters'];
    return false;
  };

  // Check if group has active item
  const groupHasActiveItem = (group: NavGroup): boolean => {
    return group.items.some(item => location.pathname === item.href);
  };

  // Render nav item
  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const isSynced = isItemSynced(item.href);
    const Icon = item.icon;
    const badge = getBadgeCount(item.badgeKey);

    const content = (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-700 group relative overflow-hidden',
          isActive
            ? 'bg-primary text-primary-foreground font-black shadow-[0_12px_32px_-8px_rgba(var(--primary),0.6)] scale-[1.02] ring-1 ring-white/10'
            : item.highlight
              ? 'bg-primary/5 text-foreground hover:bg-primary/10 border border-primary/10'
              : 'text-white/40 hover:bg-white/5 hover:text-white hover:translate-x-1.5'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="active-pill"
            className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-blue-600 -z-10"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.6 }}
          />
        )}
        <Icon
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-all duration-700 ease-apple',
            !isActive && 'group-hover:scale-110 group-hover:rotate-3',
            isActive && 'drop-shadow-lg',
            item.highlight && !isActive && 'text-primary'
          )}
        />
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={cn(
                "text-sm whitespace-nowrap overflow-hidden tracking-tight transition-all duration-500",
                isActive ? "font-black" : "font-semibold"
              )}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {isSynced && !collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="ml-auto flex items-center">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse mr-2" />
                <CheckCircle className="h-3 w-3 text-success shrink-0" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-bold text-[10px] uppercase tracking-widest">
              Filtros Sincronizados
            </TooltipContent>
          </Tooltip>
        )}

        {badge && !collapsed && (
          <Badge
            variant="secondary"
            className={cn(
              'ml-auto text-[10px] font-black px-2 py-0.5 rounded-md border-none',
              isActive ? 'bg-white/20 text-white shadow-sm' : 'bg-primary/10 text-primary'
            )}
          >
            {badge}
          </Badge>
        )}
        {badge && collapsed && (
          <span className="absolute top-2 right-2 h-4.5 w-4.5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center font-black shadow-lg ring-2 ring-background">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.label}
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
      {navGroups.map(group => {
        const GroupIcon = group.icon;
        const isOpen = openGroups[group.id];
        const hasActive = groupHasActiveItem(group);

        return (
          <div key={group.id} className="space-y-1">
            {/* Group Header */}
            {collapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'w-full flex items-center justify-center p-2 rounded-lg transition-colors',
                      hasActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <GroupIcon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {group.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-700 group mt-6 first:mt-0',
                  hasActive
                    ? 'text-white font-black'
                    : 'text-white/20 hover:bg-white/5 hover:text-white'
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-xl transition-all duration-700 ease-apple shadow-inner",
                  hasActive ? "bg-primary/20 text-primary ring-1 ring-primary/20" : "bg-white/5 text-white/20"
                )}>
                  <GroupIcon className="h-4.5 w-4.5 shrink-0" />
                </div>
                <span className="font-black text-[11px] uppercase tracking-[0.3em] flex-1 text-left">{group.label}</span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                  className="opacity-40 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </button>
            )}

            {/* Group Items */}
            {!collapsed && (
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 space-y-1 border-l border-primary/10 ml-5 mt-2 transition-all">
                      {group.items.map(item => (
                        <NavItemComponent key={item.href} item={item} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Collapsed state - show items in tooltip */}
            {collapsed && (
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavItemComponent key={item.href} item={item} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};
