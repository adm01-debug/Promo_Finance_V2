/**
 * Hook para gerenciar celebrações com confetti
 * Integra o sistema de confetti existente com React
 */

import { useCallback } from 'react';
import {
  toastWithConfetti,
  toastPaymentSuccess,
  toastReceiptSuccess,
  toastGoalAchieved,
  toastApprovalSuccess,
  toastReconciliationSuccess,
  toastImportSuccess,
  toastBulkSuccess,
  toastEpicCelebration,
  toastWelcome,
} from '@/lib/toast-confetti';

export function useConfetti() {
  const celebratePayment = useCallback((value?: string) => {
    toastPaymentSuccess(value);
  }, []);

  const celebrateReceipt = useCallback((value?: string) => {
    toastReceiptSuccess(value);
  }, []);

  const celebrateGoal = useCallback((goalName: string) => {
    toastGoalAchieved(goalName);
  }, []);

  const celebrateApproval = useCallback((description?: string) => {
    toastApprovalSuccess(description);
  }, []);

  const celebrateReconciliation = useCallback((count: number) => {
    toastReconciliationSuccess(count);
  }, []);

  const celebrateImport = useCallback((count: number, type: string) => {
    toastImportSuccess(count, type);
  }, []);

  const celebrateBulk = useCallback((count: number, action: string) => {
    toastBulkSuccess(count, action);
  }, []);

  const celebrateEpic = useCallback((title: string, description?: string) => {
    toastEpicCelebration(title, description);
  }, []);

  const welcomeUser = useCallback((userName?: string) => {
    toastWelcome(userName);
  }, []);

  const customCelebration = useCallback((options: Parameters<typeof toastWithConfetti>[0]) => {
    toastWithConfetti(options);
  }, []);

  return {
    celebratePayment,
    celebrateReceipt,
    celebrateGoal,
    celebrateApproval,
    celebrateReconciliation,
    celebrateImport,
    celebrateBulk,
    celebrateEpic,
    welcomeUser,
    customCelebration,
  };
}

export default useConfetti;
