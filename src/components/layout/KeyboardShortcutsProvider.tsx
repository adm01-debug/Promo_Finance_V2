import { forwardRef, ReactNode } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutsProvider = forwardRef<HTMLDivElement, KeyboardShortcutsProviderProps>(
  ({ children }, _ref) => {
    // Initialize keyboard shortcuts
    useKeyboardShortcuts();
    
    return <>{children}</>;
  }
);
KeyboardShortcutsProvider.displayName = 'KeyboardShortcutsProvider';
