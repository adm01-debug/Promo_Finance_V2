import { forwardRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Receipt, CreditCard, Users, Building2,
  BarChart3, Settings, X, Star, Clock, Plus, ChevronDown,
  ChevronLeft, Landmark, FileText, Shield, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  open?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
  className?: string;
}

const navGroups = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { to: '/contas-pagar', icon: CreditCard, label: 'Contas a Pagar' },
      { to: '/contas-receber', icon: Receipt, label: 'Contas a Receber' },
      { to: '/contas-bancarias', icon: Landmark, label: 'Contas Bancárias' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { to: '/clientes', icon: Users, label: 'Clientes' },
      { to: '/fornecedores', icon: Building2, label: 'Fornecedores' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
      { to: '/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
];

function NavItem({ item, collapsed, isActive }: { 
  item: { to: string; icon: any; label: string }; 
  collapsed?: boolean; 
  isActive: boolean;
}) {
  const Icon = item.icon;
  
  const link = (
    <NavLink
      to={item.to}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg transition-all duration-200',
        collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5',
        'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent',
        isActive && [
          'bg-primary/10 text-primary font-medium',
          'shadow-[inset_3px_0_0_hsl(var(--primary))]',
        ],
      )}
    >
      <Icon className={cn(
        'h-[18px] w-[18px] shrink-0 transition-colors',
        isActive ? 'text-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80',
      )} />
      {!collapsed && (
        <span className="text-sm truncate">{item.label}</span>
      )}
      {/* Active glow */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-lg bg-primary/5 -z-10"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapse, className }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex flex-col',
        'bg-sidebar border-r border-sidebar-border',
        'transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        collapsed ? 'w-[68px]' : 'w-64',
        'lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
        className,
      )}
    >
      {/* Header / Brand */}
      <div className={cn(
        'flex items-center border-b border-sidebar-border h-14 shrink-0',
        collapsed ? 'justify-center px-2' : 'px-4 gap-3',
      )}>
        {!collapsed && (
          <>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow-primary shrink-0">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <div className="leading-none min-w-0">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight block">Promo</span>
              <span className="text-[10px] text-sidebar-foreground/50 font-medium uppercase tracking-widest">Financeiro</span>
            </div>
          </>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="lg:hidden ml-auto h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Create */}
      <div className={cn('px-3 py-3', collapsed && 'px-2')}>
        <Button
          variant="outline"
          className={cn(
            'w-full gap-2 h-9 border-dashed border-sidebar-border/80',
            'hover:border-primary/40 hover:bg-primary/5 hover:text-primary',
            'transition-all duration-200',
            collapsed && 'px-0 justify-center',
          )}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Novo</span>}
          {!collapsed && <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />}
        </Button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 pb-4 scrollbar-thin">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-2 px-3">
                {group.label}
              </p>
            )}
            {collapsed && <div className="h-px bg-sidebar-border/50 my-2" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  collapsed={collapsed}
                  isActive={location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/')}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Favorites & Recents */}
      {!collapsed && (
        <div className="border-t border-sidebar-border px-3 py-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-1.5 px-3 flex items-center gap-1.5">
              <Star className="h-3 w-3" /> Favoritos
            </p>
            <p className="text-xs text-sidebar-foreground/30 px-3">Nenhum favorito</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-1.5 px-3 flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> Recentes
            </p>
            <p className="text-xs text-sidebar-foreground/30 px-3">Nenhum item recente</p>
          </div>
        </div>
      )}

      {/* Collapse toggle - desktop only */}
      {onToggleCollapse && (
        <div className="hidden lg:flex border-t border-sidebar-border p-2 justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-sidebar-foreground/40 hover:text-sidebar-foreground"
          >
            <ChevronLeft className={cn(
              'h-4 w-4 transition-transform duration-300',
              collapsed && 'rotate-180',
            )} />
          </Button>
        </div>
      )}
    </aside>
  );
}

// Exports for backward compat
export function SidebarNavGroups({ collapsed }: { collapsed?: boolean }) {
  return null; // Now handled internally
}

export function MobileBottomNav() {
  const location = useLocation();
  const mobileItems = navGroups.flatMap(g => g.items).slice(0, 5);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-50 lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-1.5">
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to || (item.to === '/dashboard' && location.pathname === '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-0',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]')} />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileSidebarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />
          <Sidebar open={open} onClose={onClose} className="z-50" />
        </>
      )}
    </AnimatePresence>
  );
}

export function RecentAndFavorites({ collapsed }: { collapsed?: boolean }) {
  return null; // Now handled internally
}

export function QuickCreateButton({ collapsed }: { collapsed?: boolean }) {
  return null; // Now handled internally
}

export default Sidebar;
