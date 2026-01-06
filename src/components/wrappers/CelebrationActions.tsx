/**
 * Celebration Actions - Hooks and utilities for success celebrations
 * 
 * Integrates confetti, sounds, and haptic feedback for key actions
 */

import { useCallback } from 'react';
import { useConfetti } from '@/hooks/useConfetti';
import { useSoundFeedback } from '@/hooks/useSoundFeedback';
import { haptic } from '@/lib/haptic-feedback';
import { toast } from 'sonner';

export function useCelebrations() {
  const confetti = useConfetti();
  const sounds = useSoundFeedback();

  // Payment registered successfully
  const celebratePayment = useCallback((value?: string) => {
    confetti.celebratePayment(value);
    haptic('success');
  }, [confetti]);

  // Receipt registered successfully
  const celebrateReceipt = useCallback((value?: string) => {
    confetti.celebrateReceipt(value);
    haptic('success');
  }, [confetti]);

  // Approval completed
  const celebrateApproval = useCallback((description?: string) => {
    confetti.celebrateApproval(description);
    haptic('success');
  }, [confetti]);

  // Goal achieved
  const celebrateGoal = useCallback((goalName: string) => {
    confetti.celebrateGoal(goalName);
    haptic('heavy');
  }, [confetti]);

  // Reconciliation completed
  const celebrateReconciliation = useCallback((count: number) => {
    confetti.celebrateReconciliation(count);
    haptic('success');
  }, [confetti]);

  // Bulk action completed
  const celebrateBulk = useCallback((count: number, action: string) => {
    confetti.celebrateBulk(count, action);
    haptic('medium');
  }, [confetti]);

  // Import completed
  const celebrateImport = useCallback((count: number, type: string) => {
    confetti.celebrateImport(count, type);
    haptic('success');
  }, [confetti]);

  // Generic success with sound
  const success = useCallback((message?: string) => {
    sounds.playSuccess();
    haptic('light');
    if (message) {
      toast.success(message);
    }
  }, [sounds]);

  // Generic error with feedback
  const error = useCallback((message?: string) => {
    sounds.playError();
    haptic('error');
    if (message) {
      toast.error(message);
    }
  }, [sounds]);

  // Warning feedback
  const warning = useCallback((message?: string) => {
    sounds.playWarning();
    haptic('warning');
    if (message) {
      toast.warning(message);
    }
  }, [sounds]);

  // Click feedback (for buttons)
  const click = useCallback(() => {
    sounds.playClick();
    haptic('light');
  }, [sounds]);

  return {
    // Specific celebrations
    celebratePayment,
    celebrateReceipt,
    celebrateApproval,
    celebrateGoal,
    celebrateReconciliation,
    celebrateBulk,
    celebrateImport,
    
    // Generic feedback
    success,
    error,
    warning,
    click,
  };
}

export default useCelebrations;
