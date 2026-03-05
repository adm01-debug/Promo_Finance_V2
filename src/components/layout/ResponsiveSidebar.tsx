import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarNavGroups, MobileBottomNav, MobileSidebarDrawer, RecentAndFavorites, QuickCreateButton } from './sidebar';

interface ResponsiveSidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export const ResponsiveSidebar = ({ onCollapseChange }: ResponsiveSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleCollapse = (value: boolean) => {
    setCollapsed(value);
    onCollapseChange?.(value);
  };

  // Mobile: Show bottom nav + drawer
  if (isMobile) {
    return (
      <>
        <MobileBottomNav onMenuClick={() => setMobileDrawerOpen(true)} />
        <MobileSidebarDrawer
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      </>
    );
  }

  // Desktop: Show full sidebar
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
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

      {/* Quick Create Button */}
      <QuickCreateButton collapsed={collapsed} />

      {/* Recent & Favorites */}
      <RecentAndFavorites collapsed={collapsed} />

      {/* Navigation Groups */}
      <SidebarNavGroups collapsed={collapsed} />

      {/* Collapse Button */}
      <button
        onClick={() => handleCollapse(!collapsed)}
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
