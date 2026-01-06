import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowDownCircle,
  ArrowUpCircle,
  Bot,
  Menu,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAprovacoesPendentesCount } from '@/hooks/useAprovacoesPendentesCount';

interface BottomNavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
}

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export const MobileBottomNav = ({ onMenuClick }: MobileBottomNavProps) => {
  const location = useLocation();
  const { count: aprovacoesPendentes } = useAprovacoesPendentesCount();

  const navItems: BottomNavItem[] = [
    { label: 'Home', icon: LayoutDashboard, href: '/' },
    { label: 'Receber', icon: ArrowDownCircle, href: '/contas-receber' },
    { label: 'Pagar', icon: ArrowUpCircle, href: '/contas-pagar' },
    { label: 'Expert', icon: Bot, href: '/expert' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-pb md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className="flex flex-col items-center justify-center flex-1 py-2 relative"
            >
              <motion.div
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                whileTap={{ scale: 0.95 }}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
            </NavLink>
          );
        })}

        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 py-2"
        >
          <motion.div
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-muted-foreground"
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <Menu className="h-5 w-5" />
              {aprovacoesPendentes > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive text-destructive-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                  {aprovacoesPendentes > 9 ? '9+' : aprovacoesPendentes}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Menu</span>
          </motion.div>
        </button>
      </div>
    </nav>
  );
};
