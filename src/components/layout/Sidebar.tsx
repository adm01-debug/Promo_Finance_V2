import { useState, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  FileText,
  PieChart,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
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
  children?: { label: string; href: string }[];
}

const baseNavItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'BI Gestão', icon: BarChart3, href: '/bi', highlight: true },
  { label: 'Dashboard Empresa', icon: Building2, href: '/dashboard-empresa' },
  { label: 'Dashboard Recebíveis', icon: ArrowDownCircle, href: '/dashboard-receber', highlight: true },
  { label: 'EXPERT (IA)', icon: Bot, href: '/expert', highlight: true },
  { label: 'Contas a Receber', icon: ArrowDownCircle, href: '/contas-receber' },
  { label: 'Contas a Pagar', icon: ArrowUpCircle, href: '/contas-pagar' },
  { label: 'Cobrança', icon: Receipt, href: '/cobrancas' },
  { label: 'Boletos', icon: CreditCard, href: '/boletos' },
  { label: 'Notas Fiscais', icon: FileText, href: '/notas-fiscais' },
  { label: 'Clientes', icon: User, href: '/clientes' },
  { label: 'Fornecedores', icon: Truck, href: '/fornecedores' },
  { label: 'Conciliação', icon: RefreshCcw, href: '/conciliacao' },
  { label: 'Fluxo de Caixa', icon: BarChart3, href: '/fluxo-caixa' },
  { label: 'Demonstrativos', icon: FileSpreadsheet, href: '/demonstrativos' },
  { label: 'Aprovações', icon: ShieldCheck, href: '/aprovacoes', badgeKey: 'aprovacoes' },
  { label: 'Centro de Custos', icon: PieChart, href: '/centro-custos' },
  { label: 'Relatórios', icon: FileText, href: '/relatorios' },
  { label: 'Contas Bancárias', icon: Landmark, href: '/contas-bancarias' },
  { label: 'Empresas (CNPJs)', icon: Building2, href: '/empresas' },
  { label: 'Usuários', icon: Users, href: '/usuarios' },
  { label: 'Logs de Auditoria', icon: ScrollText, href: '/audit-logs' },
  { label: 'Bitrix24', icon: Zap, href: '/bitrix24' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Alertas', icon: Bell, href: '/alertas' },
  { label: 'Configurações', icon: Settings, href: '/configuracoes' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { count: aprovacoesPendentes } = useAprovacoesPendentesCount();

  // Merge dynamic badge counts into nav items
  const navItems = useMemo(() => {
    return baseNavItems.map(item => {
      if (item.badgeKey === 'aprovacoes' && aprovacoesPendentes > 0) {
        return { ...item, badge: aprovacoesPendentes };
      }
      return item;
    });
  }, [aprovacoesPendentes]);

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    const content = (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
          isActive
            ? 'bg-primary text-primary-foreground shadow-glow-primary'
            : item.highlight
              ? 'bg-gradient-to-r from-accent/20 to-primary/20 text-accent-foreground hover:from-accent/30 hover:to-primary/30 border border-accent/30'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
        {...(item.href === '/expert' ? { 'data-tour': 'expert' } : {})}
      >
        <Icon
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-transform duration-200',
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
        {item.badge && !collapsed && (
          <Badge
            variant="secondary"
            className={cn(
              'ml-auto text-xs',
              isActive ? 'bg-primary-foreground/20 text-primary-foreground' : ''
            )}
          >
            {item.badge}
          </Badge>
        )}
        {item.badge && collapsed && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
            {item.badge > 9 ? '9+' : item.badge}
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
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col'
      )}
      data-tour="sidebar"
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow-primary">
                <CreditCard className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg text-foreground leading-tight">
                  Promo
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight uppercase tracking-wider">
                  Financeiro
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow-primary mx-auto">
            <CreditCard className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
        {navItems.map((item) => (
          <NavItemComponent key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="py-4 px-3 space-y-1 border-t border-sidebar-border">
        {bottomNavItems.map((item) => (
          <NavItemComponent key={item.href} item={item} />
        ))}
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center shadow-md hover:bg-muted transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
    </motion.aside>
  );
};
