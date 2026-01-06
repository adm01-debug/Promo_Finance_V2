/**
 * Animated Tabs - Tabs com animações suaves
 */

import { useState, ReactNode, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

interface TabPanelProps {
  tabId: string;
  children: ReactNode;
  className?: string;
}

const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
} | null>(null);

export function AnimatedTabs({
  tabs,
  defaultTab,
  onTabChange,
  children,
  className,
  variant = 'default',
}: AnimatedTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={className}>
        {/* Tab list */}
        <div className={cn(
          'relative flex',
          variant === 'default' && 'gap-1 p-1 bg-muted rounded-lg',
          variant === 'pills' && 'gap-2',
          variant === 'underline' && 'gap-4 border-b'
        )}>
          {/* Animated background indicator */}
          {variant === 'default' && (
            <motion.div
              className="absolute inset-y-1 rounded-md bg-background shadow-sm"
              initial={false}
              animate={{
                x: `calc(${activeIndex * 100}% + ${activeIndex}px)`,
                width: `calc(${100 / tabs.length}% - ${(tabs.length - 1) / tabs.length}px)`,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
            />
          )}

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                'relative z-10 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                tab.disabled && 'opacity-50 cursor-not-allowed',
                variant === 'default' && 'flex-1 rounded-md',
                variant === 'pills' && 'rounded-full',
                variant === 'underline' && 'pb-3 -mb-px',
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted-foreground/20'
                )}>
                  {tab.badge}
                </span>
              )}
              
              {/* Pills active indicator */}
              {variant === 'pills' && activeTab === tab.id && (
                <motion.div
                  layoutId="pill-indicator"
                  className="absolute inset-0 bg-primary rounded-full -z-10"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
              
              {/* Underline indicator */}
              {variant === 'underline' && activeTab === tab.id && (
                <motion.div
                  layoutId="underline-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="mt-4">
          {children}
        </div>
      </div>
    </TabsContext.Provider>
  );
}

export function TabPanel({ tabId, children, className }: TabPanelProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within AnimatedTabs');

  const isActive = context.activeTab === tabId;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={tabId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnimatedTabs;
