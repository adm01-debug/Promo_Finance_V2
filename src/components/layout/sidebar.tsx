import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Users, 
  Building2,
  BarChart3,
  Settings,
  X
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
            <item.icon className="h-5 w-5" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
