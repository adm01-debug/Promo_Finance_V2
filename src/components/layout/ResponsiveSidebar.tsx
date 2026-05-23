import { forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
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
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col shadow-none transition-all duration-200'
      )}
      data-tour="sidebar"
    >
      <div className="h-14 flex items-center px-6 border-b border-sidebar-border">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shadow-none">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-base text-foreground tracking-tight">
                Promo Finance
              </span>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-7 w-7 rounded bg-primary flex items-center justify-center shadow-none mx-auto"
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
        <div className="p-4 border-t border-border">
          <div className="p-3 rounded-lg bg-[#f1f3f9] border border-border group/support cursor-pointer hover:bg-[#e2e8f0] transition-colors">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Suporte</p>
            <p className="text-[11px] text-[#64748b] font-medium group-hover:text-[#1a1c21] transition-colors">Falar com especialista</p>
          </div>
        </div>
      )}
    </motion.aside>
  );
});
ResponsiveSidebar.displayName = 'ResponsiveSidebar';