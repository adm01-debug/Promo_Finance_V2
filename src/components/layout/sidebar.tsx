import { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Users, 
  Building2,
  BarChart3,
  Settings,
  X,
  Star,
  Clock,
  Plus,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  open?: boolean;
  collapsed?: boolean;
  onClose?: () => void;
  className?: string;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contas-pagar', icon: CreditCard, label: 'Contas a Pagar' },
  { to: '/contas-receber', icon: Receipt, label: 'Contas a Receber' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/fornecedores', icon: Building2, label: 'Fornecedores' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export function Sidebar({ open, collapsed, onClose, className }: SidebarProps) {
  return (
    <aside 
      className={cn(
        'bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700',
        'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200',
        'lg:relative lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
        collapsed && 'lg:w-16',
        className
      )}
    >
      <div className="flex items-center justify-between p-4 lg:hidden">
        <span className="text-lg font-semibold">Menu</span>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
                isActive && 'bg-primary/10 text-primary'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

// Componentes adicionais para ResponsiveSidebar
interface NavGroupProps {
  collapsed?: boolean;
}

export const SidebarNavGroups = forwardRef<HTMLElement, NavGroupProps>(function SidebarNavGroups({ collapsed }, ref) {
  return (
    <nav ref={ref} className="p-2 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
              'text-muted-foreground hover:bg-muted',
              isActive && 'bg-primary/10 text-primary'
            )
          }
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );
});
SidebarNavGroups.displayName = 'SidebarNavGroups';

export function MobileBottomNav() {
  const mobileNavItems = navItems.slice(0, 5);
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 lg:hidden">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-lg',
                'text-gray-600 dark:text-gray-400',
                isActive && 'text-primary'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebarDrawer({ open, onClose }: MobileSidebarDrawerProps) {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <aside className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="text-lg font-semibold">Menu</span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SidebarNavGroups collapsed={false} />
      </aside>
    </div>
  );
}

interface RecentAndFavoritesProps {
  collapsed?: boolean;
}

export const RecentAndFavorites = forwardRef<HTMLDivElement, RecentAndFavoritesProps>(function RecentAndFavorites({ collapsed }, ref) {
  if (collapsed) return null;
  
  return (
    <div ref={ref} className="p-4 border-t border-border">
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Star className="h-4 w-4" />
            <span>Favoritos</span>
          </div>
          <p className="text-xs text-muted-foreground">Nenhum favorito</p>
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span>Recentes</span>
          </div>
          <p className="text-xs text-muted-foreground">Nenhum item recente</p>
        </div>
      </div>
    </div>
  );
});
RecentAndFavorites.displayName = 'RecentAndFavorites';

interface QuickCreateButtonProps {
  collapsed?: boolean;
}

export const QuickCreateButton = forwardRef<HTMLDivElement, QuickCreateButtonProps>(function QuickCreateButton({ collapsed }, ref) {
  const [open, setOpen] = useState(false);
  
  return (
    <div ref={ref} className="p-4">
      <Button 
        className="w-full justify-start gap-2" 
        variant="outline"
        onClick={() => setOpen(!open)}
      >
        <Plus className="h-4 w-4" />
        {!collapsed && (
          <>
            <span>Novo</span>
            <ChevronDown className={cn("h-4 w-4 ml-auto transition-transform", open && "rotate-180")} />
          </>
        )}
      </Button>
    </div>
  );
});
QuickCreateButton.displayName = 'QuickCreateButton';

export default Sidebar;
