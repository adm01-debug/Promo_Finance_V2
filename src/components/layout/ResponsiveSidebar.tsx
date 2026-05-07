import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarNavGroups } from './sidebar/SidebarNavGroups';
import { MobileSidebarDrawer } from './sidebar/MobileSidebarDrawer';
import { RecentAndFavorites } from './sidebar/RecentAndFavorites';
import { QuickCreateButton } from './sidebar/QuickCreateButton';
import { MobileBottomNav } from './sidebar/MobileBottomNav';

interface ResponsiveSidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export const ResponsiveSidebar = forwardRef<HTMLElement, ResponsiveSidebarProps>(function ResponsiveSidebar({ onCollapseChange }, ref) {
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
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      </>
    );
  }

  // Desktop: Show full sidebar
  return (
    <motion.aside
      ref={ref}
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-background/40 backdrop-blur-3xl border-r border-white/10 flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] ring-1 ring-white/5'
      )}
      data-tour="sidebar"
    >
      {/* Logo Section */}
      <div className="h-24 flex items-center justify-between px-6 border-b border-white/5 relative overflow-hidden group/logo">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-1000" />
        
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 relative z-10"
            >
              <div className="h-11 w-11 rounded-[1.25rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 blur-sm -translate-x-full group-hover/logo:translate-x-full transition-transform duration-1000" />
                <CreditCard className="h-6 w-6 text-white relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-xl text-foreground tracking-tighter leading-none">
                  PROMO
                </span>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mt-1">
                  FINANCE
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="h-11 w-11 rounded-[1.25rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/30 mx-auto relative overflow-hidden"
            >
              <CreditCard className="h-6 w-6 text-white relative z-10" />
            </motion.div>
          )}
        </AnimatePresence>
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
});
ResponsiveSidebar.displayName = 'ResponsiveSidebar';
