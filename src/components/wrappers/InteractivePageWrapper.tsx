/**
 * Interactive Page Wrapper
 * 
 * Wrapper para páginas que adiciona:
 * - Pull to refresh (mobile)
 * - Sound feedback
 * - Haptic feedback
 * - Confetti celebrations
 */

import { ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PullToRefresh, usePullToRefresh } from '@/components/ui/pull-to-refresh';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { sounds } from '@/lib/sound-feedback';

interface InteractivePageWrapperProps {
  children: ReactNode;
  queryKeys?: string[];
  onRefresh?: () => Promise<void>;
  className?: string;
}

export function InteractivePageWrapper({
  children,
  queryKeys = [],
  onRefresh,
  className,
}: InteractivePageWrapperProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    sounds.notification();
    
    if (onRefresh) {
      await onRefresh();
    } else if (queryKeys.length > 0) {
      await Promise.all(
        queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: [key] }))
      );
    } else {
      // Refresh all queries
      await queryClient.invalidateQueries();
    }
    
    sounds.success();
    toast.success('Dados atualizados!');
  }, [onRefresh, queryKeys, queryClient]);

  // On mobile, wrap with PullToRefresh
  if (isMobile) {
    return (
      <PullToRefresh onRefresh={handleRefresh} className={className}>
        {children}
      </PullToRefresh>
    );
  }

  // On desktop, just render children
  return <div className={className}>{children}</div>;
}

export default InteractivePageWrapper;
