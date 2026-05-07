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
      animate={{ width: collapsed ? 80 : 300 }}
      transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-[#0A0D14]/80 backdrop-blur-3xl border-r border-white/5 flex flex-col shadow-[20px_0_60px_-20px_rgba(0,0,0,0.5)] transition-all duration-700'
      )}
      data-tour="sidebar"
    >
      {/* Dynamic Background Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Logo Section */}
      <div className="h-24 flex items-center justify-between px-7 border-b border-white/5 relative overflow-hidden group/logo">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-600/10 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-1000" />
        
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, x: -15, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -15, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
              className="flex items-center gap-4 relative z-10"
            >
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)] relative overflow-hidden group-hover/logo:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-white/30 blur-md -translate-x-full group-hover/logo:translate-x-full transition-transform duration-1000" />
                <CreditCard className="h-6 w-6 text-white relative z-10" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-black text-2xl text-white tracking-tighter leading-none">
                  PROMO
                </span>
                <span className="text-[10px] font-black text-primary/80 uppercase tracking-[0.4em] leading-none mt-1.5">
                  FINANCE
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, filter: 'blur(5px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.5, filter: 'blur(5px)' }}
              className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.2)] mx-auto relative overflow-hidden"
            >
              <CreditCard className="h-6 w-6 text-white relative z-10" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-6 space-y-6">
        {/* Quick Create Button */}
        <div className="px-4">
          <QuickCreateButton collapsed={collapsed} />
        </div>

        {/* Recent & Favorites */}
        <RecentAndFavorites collapsed={collapsed} />

        {/* Navigation Groups */}
        <SidebarNavGroups collapsed={collapsed} />
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => handleCollapse(!collapsed)}
        className="absolute -right-4 top-24 h-9 w-9 rounded-full bg-[#0A0D14] border border-white/10 flex items-center justify-center shadow-2xl hover:bg-primary hover:text-white transition-all duration-500 group/btn hover:scale-110 active:scale-95 z-50 ring-1 ring-white/5"
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-0.5 transition-transform" />
        ) : (
          <ChevronLeft className="h-5 w-5 group-hover/btn:-translate-x-0.5 transition-transform" />
        )}
      </button>

      {/* Footer / Support */}
      {!collapsed && (
        <div className="p-6 border-t border-white/5">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 group/support cursor-pointer hover:bg-primary/10 transition-colors">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Enterprise Support</p>
            <p className="text-xs text-white/60 font-medium group-hover:text-white transition-colors">Consulência Estratégica</p>
          </div>
        </div>
      )}
    </motion.aside>
  );
});
ResponsiveSidebar.displayName = 'ResponsiveSidebar';
