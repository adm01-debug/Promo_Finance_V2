import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ResponsiveSidebar } from './ResponsiveSidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator';
import { usePrefetchRoutes } from '@/hooks/usePrefetchRoutes';
import { useIsMobile } from '@/hooks/use-mobile';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { GuidedTour } from '@/components/onboarding/GuidedTour';
import { ContextualBreadcrumbs } from '@/components/navigation/ContextualBreadcrumbs';
import { OfflineBanner } from '@/components/offline/OfflineBanner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Initialize route prefetching
  usePrefetchRoutes();

  // Show onboarding checklist only on dashboard
  const showOnboarding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      {/* Guided Tour for new users */}
      <GuidedTour />
      
      {/* Offline Banner */}
      <OfflineBanner position="top" />
      
      {/* Responsive Sidebar */}
      <ResponsiveSidebar onCollapseChange={setSidebarCollapsed} />
      
      {/* Header - only show on desktop */}
      {!isMobile && <Header sidebarCollapsed={sidebarCollapsed} />}
      
      {/* Network status indicator - fixed position */}
      <div className={cn(
        "fixed z-50",
        isMobile ? "bottom-20 right-4" : "bottom-4 right-4"
      )}>
        <NetworkStatusIndicator showDetails />
      </div>
      
      <motion.main
        id="main-content"
        initial={false}
        animate={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 280),
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'min-h-screen w-full transition-all duration-300',
          isMobile ? 'pt-4 pb-20' : 'pt-16'
        )}
        style={{
          width: isMobile ? '100%' : `calc(100% - ${sidebarCollapsed ? 72 : 280}px)`,
        }}
      >
        <div className="w-full max-w-full p-4 md:p-6 lg:p-8">
          {/* Contextual Breadcrumbs */}
          <ContextualBreadcrumbs />
          
          {/* Onboarding Checklist - show on dashboard */}
          {showOnboarding && (
            <div className="mb-6 max-w-md">
              <OnboardingChecklist />
            </div>
          )}
          
          {children}
        </div>
      </motion.main>
    </div>
  );
};