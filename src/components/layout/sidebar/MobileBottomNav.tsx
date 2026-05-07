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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-3xl border-t border-white/10 md:hidden pb-[env(safe-area-inset-bottom)] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] ring-1 ring-white/5">
      <div className="flex items-center justify-around h-24 px-4">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className="flex flex-col items-center justify-center flex-1 py-2 relative min-w-0"
            >
              <motion.div
                className={cn(
                  'flex flex-col items-center gap-2 px-5 py-3 rounded-2xl transition-all duration-500 relative overflow-hidden',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground/60 hover:text-foreground'
                )}
                whileTap={{ scale: 0.85, y: -4 }}
              >
                {isActive && (
                  <motion.div 
                    layoutId="mobileNavActiveBg"
                    className="absolute inset-0 bg-primary/10 -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative">
                  <Icon className={cn("h-6 w-6 transition-transform duration-500", isActive && "scale-110")} />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] uppercase tracking-widest transition-all duration-500",
                  isActive ? "font-black" : "font-bold opacity-60"
                )}>
                  {item.label}
                </span>
              </motion.div>
            </NavLink>
          );
        })}

        {/* Dynamic Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 py-2 min-w-0"
        >
          <motion.div
            className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl text-muted-foreground/60 hover:bg-white/5 transition-all duration-500"
            whileTap={{ scale: 0.85, y: -4 }}
          >
            <div className="relative">
              <Menu className="h-6 w-6" />
              {aprovacoesPendentes > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-destructive text-white rounded-full text-[10px] flex items-center justify-center font-black shadow-lg ring-2 ring-background">
                  {aprovacoesPendentes > 9 ? '9+' : aprovacoesPendentes}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Menu</span>
          </motion.div>
        </button>
      </div>
    </nav>
  );
};
