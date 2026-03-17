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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';

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
      { label: 'EXPERT (IA)', icon: Bot, href: '/expert', highlight: true },
      { label: 'Alertas', icon: Bell, href: '/alertas' },
    ],
  },
  {
    id: 'financial',
    label: 'Financeiro',
    icon: Wallet,
    defaultOpen: true,
    items: [
      { label: 'Dashboard Recebíveis', icon: ArrowDownCircle, href: '/dashboard-receber', highlight: true },
      { label: 'Contas a Receber', icon: ArrowDownCircle, href: '/contas-receber' },
      { label: 'Contas a Pagar', icon: ArrowUpCircle, href: '/contas-pagar' },
      { label: 'Cobrança', icon: Receipt, href: '/cobrancas' },
      { label: 'Boletos', icon: CreditCard, href: '/boletos' },
      { label: 'Fluxo de Caixa', icon: BarChart3, href: '/fluxo-caixa' },
      { label: 'Conciliação', icon: RefreshCcw, href: '/conciliacao' },
      { label: 'ASAAS', icon: CreditCard, href: '/asaas', highlight: true },
    ],
  },
  {
    id: 'fiscal',
    label: 'Fiscal & Documentos',
    icon: FileText,
    items: [
      { label: 'Reforma Tributária', icon: Scale, href: '/reforma-tributaria', highlight: true },
      { label: 'Notas Fiscais', icon: FileText, href: '/notas-fiscais' },
      { label: 'Demonstrativos', icon: FileSpreadsheet, href: '/demonstrativos' },
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
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative',
          isActive
            ? 'bg-primary/10 text-primary font-semibold shadow-[inset_3px_0_0_hsl(var(--primary))]'
            : item.highlight
              ? 'bg-gradient-to-r from-accent/10 to-primary/10 text-foreground hover:from-accent/20 hover:to-primary/20 border border-accent/20'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-transform duration-200',
            !isActive && 'group-hover:scale-110',
            item.highlight && !isActive && 'text-accent'
          )}
        />
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="font-medium text-sm whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
        {badge && !collapsed && (
          <Badge
            variant="secondary"
            className={cn(
              'ml-auto text-xs',
              isActive ? 'bg-primary-foreground/20 text-primary-foreground' : ''
            )}
          >
            {badge}
          </Badge>
        )}
        {badge && collapsed && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
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
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group',
                  hasActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <GroupIcon className="h-4 w-4 flex-shrink-0" />
                <span className="font-semibold text-sm flex-1 text-left">{group.label}</span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
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
                    <div className="pl-4 space-y-0.5 border-l-2 border-border ml-4 mt-1">
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
