import { useState } from 'react';
import type { ReactNode } from 'react';

// Hook for triggering quick create from anywhere
export function useQuickCreate() {
  const [open, setOpen] = useState(false);

  return {
    open,
    setOpen,
    QuickCreateTrigger: ({ children }: { children: ReactNode }) => (
      <button onClick={() => setOpen(true)}>{children}</button>
    ),
  };
}
