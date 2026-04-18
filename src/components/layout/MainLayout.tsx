import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ResponsiveSidebar } from './ResponsiveSidebar';
import { Header } from './Header';
import { PageTransition } from './PageTransition';
import { cn } from '@/lib/utils';
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { GuidedTour } from '@/components/onboarding/GuidedTour';
import { ContextualBreadcrumbs } from '@/components/navigation/ContextualBreadcrumbs';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { InstallPWA } from '@/components/pwa/InstallPWA';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { SkipLinks } from '@/components/accessibility/SkipLinks';
import { MobileBottomNav } from './sidebar/MobileBottomNav';
import { MobileSidebarDrawer } from './sidebar/MobileSidebarDrawer';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { CopilotGlobalFloat } from '@/components/copilot/CopilotGlobalFloat';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Navigation enhancements
  useSwipeBack({ enabled: isMobile });
  useKeyboardNavigation();

  // Show onboarding checklist only on dashboard
  const showOnboarding = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      {/* Skip links para acessibilidade WCAG AA */}
      <SkipLinks />

      {/* Banner de instalação PWA (só aparece se beforeinstallprompt disparou) */}
      <PWAInstallBanner />

      {/* Guided Tour for new users */}
      <GuidedTour />

      {/* Onboarding Tour P14 (react-joyride) */}
      <OnboardingTour />
      
      {/* Offline Banner */}
      <OfflineBanner position="top" />
      
      {/* Responsive Sidebar - Desktop */}
      {!isMobile && <ResponsiveSidebar onCollapseChange={setSidebarCollapsed} />}
      
      {/* Mobile Sidebar Drawer */}
      {isMobile && (
        <MobileSidebarDrawer 
          isOpen={mobileMenuOpen} 
          onClose={() => setMobileMenuOpen(false)} 
        />
      )}
      
      {/* Header - only show on desktop */}
      {!isMobile && <Header sidebarCollapsed={sidebarCollapsed} />}
      
      {/* Network status indicator - fixed position */}
      <div className={cn(
        "fixed z-40 flex items-center gap-2",
        isMobile ? "bottom-20 right-4" : "bottom-4 right-4"
      )}>
        <InstallPWA />
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
          isMobile ? 'pt-4 pb-24' : 'pt-16'
        )}
        style={{
          width: isMobile ? '100%' : `calc(100% - ${sidebarCollapsed ? 72 : 280}px)`,
        }}
      >
        <div className="w-full max-w-full p-4 md:p-6 lg:p-8">
          {/* Contextual Breadcrumbs with Back Button */}
          <ContextualBreadcrumbs />
          
          {/* Onboarding Checklist - show on dashboard */}
          {showOnboarding && (
            <div className="mb-6 max-w-md">
              <OnboardingChecklist />
            </div>
          )}
          
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </motion.main>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav onMenuClick={() => setMobileMenuOpen(true)} />
      )}

      {/* Copilot Global IA P14 */}
      <CopilotGlobalFloat />
    </div>
  );
};