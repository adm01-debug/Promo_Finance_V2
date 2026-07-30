import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react';
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

  return (
    <motion.aside
      ref={ref}
      initial={false}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shadow-none transition-all duration-200 glass-effect bg-card/70 dark:bg-zinc-950/70 backdrop-blur-2xl'
      )}
      data-tour="sidebar"
    >
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-lg">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-foreground tracking-tighter uppercase leading-none font-heading">
                  Promo Finance
                </span>
                <span className="text-caption text-primary/60 mt-0.5">
                  Enterprise
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20 mx-auto"
            >
              <Shield className="h-5 w-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-4">
        <div className="px-4">
          <QuickCreateButton collapsed={collapsed} />
        </div>
        <RecentAndFavorites collapsed={collapsed} />
        <SidebarNavGroups collapsed={collapsed} />
      </div>

      <button
        onClick={() => handleCollapse(!collapsed)}
        className="absolute -right-3 top-16 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center shadow-sm hover:bg-accent transition-all z-50"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="p-3 rounded bg-muted border border-sidebar-border group/support cursor-pointer hover:bg-accent transition-colors">
            <p className="text-caption text-primary mb-0.5">Suporte</p>
            <p className="text-[11px] text-muted-foreground font-medium group-hover:text-foreground transition-colors">Falar com especialista</p>
          </div>
        </div>
      )}
    </motion.aside>
  );
});
ResponsiveSidebar.displayName = 'ResponsiveSidebar';