import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { NetworkStatusIndicator } from '@/components/ui/network-status-indicator';
import { usePrefetchRoutes } from '@/hooks/usePrefetchRoutes';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Initialize route prefetching
  usePrefetchRoutes();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header sidebarCollapsed={sidebarCollapsed} />
      
      {/* Network status indicator - fixed position */}
      <div className="fixed bottom-4 right-4 z-50">
        <NetworkStatusIndicator showDetails />
      </div>
      
      <motion.main
        id="main-content"
        initial={false}
        animate={{
          marginLeft: sidebarCollapsed ? 72 : 260,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn('pt-16 min-h-screen transition-all duration-300')}
      >
        <div className="p-6">{children}</div>
      </motion.main>
    </div>
  );
};
