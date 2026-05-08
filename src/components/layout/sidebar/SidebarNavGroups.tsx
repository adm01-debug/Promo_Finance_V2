import { useState } from 'react';
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
  Bell,
  Settings,
  ChevronDown,
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';
import { useAlertasNaoLidos } from '@/hooks/useAlertas';
import { useAlertasTributariosCount } from '@/hooks/useAlertasTributariosCount';
import { useRealtimeAlertas } from '@/hooks/useRealtimeAlertas';
import { useRealtimeAnomalias } from '@/hooks/useRealtimeAnomalias';

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
      { label: 'Dashboard Recebíveis', icon: ArrowDownCircle, href: '/dashboard-receber' },
      { label: 'Dashboard Pagáveis', icon: ArrowUpCircle, href: '/dashboard-pagar' },
      { label: 'Contas a Receber', icon: ArrowDownCircle, href: '/contas-receber' },
      { label: 'Contas a Pagar', icon: ArrowUpCircle, href: '/contas-pagar' },
      { label: 'Fluxo de Caixa', icon: BarChart3, href: '/fluxo-caixa' },
      { label: 'Conciliação Bancária', icon: RefreshCcw, href: '/conciliacao', highlight: true },
      { label: 'Tesouraria Multi-CNPJ', icon: Landmark, href: '/tesouraria' },
      { label: 'Cobrança & Aging', icon: Receipt, href: '/cobrancas', highlight: true },
      { label: 'Simulador Antecipação', icon: Calculator, href: '/simulador-antecipacao' },
      { label: 'PIX & ASAAS', icon: Zap, href: '/pix-hub' },
    ],
  },
  {
    id: 'fiscal',
    label: 'Fiscal & Documentos',
    icon: FileText,
    items: [
      { label: 'Dashboard Tributário', icon: Scale, href: '/tributario', highlight: true, badgeKey: 'tributario' },
      { label: 'Reforma Tributária', icon: Scale, href: '/reforma-tributaria' },
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
    ],
  },
  {
    id: 'records',
    label: 'Cadastros',
    icon: Users,
    items: [
      { label: 'Clientes', icon: User, href: '/clientes' },
      { label: 'Fornecedores', icon: Truck, href: '/fornecedores' },
      { label: 'Vendedores', icon: UserCog, href: '/vendedores' },
      { label: 'Empresas (CNPJs)', icon: Building2, href: '/empresas' },
      { label: 'Contas Bancárias', icon: Landmark, href: '/contas-bancarias' },
      { label: 'Centro de Custos', icon: PieChart, href: '/centro-custos' },
      { label: 'Orçamento x Realizado', icon: Scale, href: '/orcamento-evento', highlight: true },
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
      { label: 'Bitrix24', icon: Zap, href: '/bitrix24' },
      { label: 'Bling ERP', icon: Package, href: '/bling', highlight: true },
      { label: 'Configurações', icon: Settings, href: '/configuracoes' },
      { label: 'Meu Perfil', icon: User, href: '/meu-perfil' },
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
  useRealtimeAlertas();
  useRealtimeAnomalias();

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
    return undefined;
  };

  // Check if group has active item
  const groupHasActiveItem = (group: NavGroup): boolean => {
    return group.items.some(item => location.pathname === item.href);
  };

  // Render nav item
  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
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
