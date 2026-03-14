import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarNavGroups } from './SidebarNavGroups';
import { Button } from '@/components/ui/button';

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebarDrawer = ({ isOpen, onClose }: MobileSidebarDrawerProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className={cn(
              'fixed left-0 top-0 z-50 h-full w-[280px] bg-sidebar border-r border-sidebar-border flex flex-col md:hidden'
            )}
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow-primary">
                  <CreditCard className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display font-bold text-lg text-foreground leading-tight">
                    Promo
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight uppercase tracking-wider">
                    Finance
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <SidebarNavGroups collapsed={false} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
