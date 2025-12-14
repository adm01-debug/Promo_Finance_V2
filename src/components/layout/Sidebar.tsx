import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  children?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Contas a Receber', icon: ArrowDownCircle, href: '/contas-receber', badge: 3 },
  { label: 'Contas a Pagar', icon: ArrowUpCircle, href: '/contas-pagar', badge: 2 },
  { label: 'Cobrança', icon: Receipt, href: '/cobrancas' },
  { label: 'Boletos', icon: CreditCard, href: '/boletos' },
  { label: 'Notas Fiscais', icon: FileText, href: '/notas-fiscais' },
  { label: 'Conciliação', icon: RefreshCcw, href: '/conciliacao', badge: 12 },
  { label: 'Fluxo de Caixa', icon: BarChart3, href: '/fluxo-caixa' },
  { label: 'Centro de Custos', icon: PieChart, href: '/centro-custos' },
  { label: 'Relatórios', icon: FileText, href: '/relatorios' },
  { label: 'Contas Bancárias', icon: Landmark, href: '/contas-bancarias' },
  { label: 'Empresas (CNPJs)', icon: Building2, href: '/empresas' },
  { label: 'Usuários', icon: Users, href: '/usuarios' },
  { label: 'Bitrix24', icon: Zap, href: '/bitrix24' },
];

const bottomNavItems: NavItem[] = [
  { label: 'Alertas', icon: Bell, href: '/alertas', badge: 5 },
  { label: 'Configurações', icon: Settings, href: '/configuracoes' },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5 flex-shrink-0 transition-transform duration-200',
            !isActive && 'group-hover:scale-110'
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
