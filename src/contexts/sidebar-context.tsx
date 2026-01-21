import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// ============================================================================
// Types
// ============================================================================

export interface SidebarContextValue {
  isOpen: boolean;
  isCollapsed: boolean;
  isMobile: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  collapse: () => void;
  expand: () => void;
  toggleCollapse: () => void;
}

// ============================================================================
// Context
// ============================================================================

const SidebarContext = createContext<SidebarContextValue | null>(null);

// ============================================================================
// Storage key
// ============================================================================

const SIDEBAR_COLLAPSED_KEY = 'finance-hub:sidebar-collapsed';

// ============================================================================
// Provider
// ============================================================================

interface SidebarProviderProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: SidebarProviderProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // On mobile, sidebar is a drawer (open/close)
  // On desktop, sidebar is always visible but can be collapsed
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return defaultCollapsed;
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    return stored !== null ? stored === 'true' : defaultCollapsed;
  });

  // Handle mobile changes
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // Toggle sidebar (for mobile drawer)
  const toggle = useCallback(() => {
    if (isMobile) {
      setIsOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  }, [isMobile]);

  // Open sidebar
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close sidebar
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Collapse sidebar (desktop only)
  const collapse = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  // Expand sidebar (desktop only)
  const expand = useCallback(() => {
    setIsCollapsed(false);
  }, []);

  // Toggle collapse (desktop only)
  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const value: SidebarContextValue = {
    isOpen,
    isCollapsed,
    isMobile,
    toggle,
    open,
    close,
    collapse,
    expand,
    toggleCollapse,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
