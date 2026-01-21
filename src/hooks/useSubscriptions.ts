import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';

// Types
type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'trial' | 'expired';
type BillingCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface Subscription {
  id: string;
  name: string;
  description?: string;
  provider?: string;
  categoryId?: string;
  amount: number;
  currency?: string;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  startDate: string;
  nextBillingDate?: string;
  endDate?: string;
  trialEndDate?: string;
  cancelledAt?: string;
  paymentMethodId?: string;
  autoRenew: boolean;
  reminderDays?: number;
  logo?: string;
  color?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionSummary {
  total: number;
  active: number;
  paused: number;
  cancelled: number;
  trial: number;
  monthlyTotal: number;
  yearlyTotal: number;
  upcomingRenewals: Subscription[];
  expiringTrials: Subscription[];
}

interface UseSubscriptionsOptions {
  onRenewalReminder?: (subscription: Subscription, daysUntil: number) => void;
  onTrialExpiring?: (subscription: Subscription, daysUntil: number) => void;
}

// Helper functions
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextBillingDate(currentDate: Date, billingCycle: BillingCycle): Date {
  const result = new Date(currentDate);

  switch (billingCycle) {
    case 'daily':
      result.setDate(result.getDate() + 1);
      break;
    case 'weekly':
      result.setDate(result.getDate() + 7);
      break;
    case 'monthly':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'quarterly':
      result.setMonth(result.getMonth() + 3);
      break;
    case 'yearly':
      result.setFullYear(result.getFullYear() + 1);
      break;
  }

  return result;
}

function getMonthlyEquivalent(amount: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case 'daily':
      return amount * 30;
    case 'weekly':
      return amount * 4.33;
    case 'monthly':
      return amount;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
}

function getYearlyEquivalent(amount: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case 'daily':
      return amount * 365;
    case 'weekly':
      return amount * 52;
    case 'monthly':
      return amount * 12;
    case 'quarterly':
      return amount * 4;
    case 'yearly':
      return amount;
    default:
      return amount;
  }
}

function daysBetween(date1: Date, date2: Date): number {
  const timeDiff = date2.getTime() - date1.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

// Main hook
export function useSubscriptions(
  initialSubscriptions: Subscription[] = [],
  options: UseSubscriptionsOptions = {}
) {
  const [subscriptions, setSubscriptions] = useLocalStorage<Subscription[]>(
    'subscriptions',
    initialSubscriptions
  );

  // Create subscription
  const createSubscription = useCallback(
    (
      data: Omit<Subscription, 'id' | 'createdAt' | 'updatedAt' | 'nextBillingDate'>
    ): Subscription => {
      const now = new Date().toISOString();
      const startDate = new Date(data.startDate);
      const nextBillingDate = getNextBillingDate(startDate, data.billingCycle);

      const newSubscription: Subscription = {
        ...data,
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
        createdAt: now,
        updatedAt: now,
      };

      setSubscriptions((prev) => [...prev, newSubscription]);
      return newSubscription;
    },
    [setSubscriptions]
  );

  // Update subscription
  const updateSubscription = useCallback(
    (id: string, updates: Partial<Subscription>): void => {
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === id
            ? { ...sub, ...updates, updatedAt: new Date().toISOString() }
            : sub
        )
      );
    },
    [setSubscriptions]
  );

  // Delete subscription
  const deleteSubscription = useCallback(
    (id: string): void => {
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
    },
    [setSubscriptions]
  );

  // Pause subscription
  const pauseSubscription = useCallback(
    (id: string): void => {
      updateSubscription(id, { status: 'paused' });
    },
    [updateSubscription]
  );

  // Resume subscription
  const resumeSubscription = useCallback(
    (id: string): void => {
      const subscription = subscriptions.find((s) => s.id === id);
      if (!subscription) return;

      const today = new Date();
      const nextBillingDate = getNextBillingDate(today, subscription.billingCycle);

      updateSubscription(id, {
        status: 'active',
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
      });
    },
    [subscriptions, updateSubscription]
  );

  // Cancel subscription
  const cancelSubscription = useCallback(
    (id: string, endDate?: string): void => {
      const now = new Date().toISOString();
      updateSubscription(id, {
        status: 'cancelled',
        cancelledAt: now,
        endDate: endDate || now.split('T')[0],
        autoRenew: false,
      });
    },
    [updateSubscription]
  );

  // Renew subscription (after billing)
  const renewSubscription = useCallback(
    (id: string): void => {
      const subscription = subscriptions.find((s) => s.id === id);
      if (!subscription || !subscription.nextBillingDate) return;

      const currentBillingDate = new Date(subscription.nextBillingDate);
      const nextBillingDate = getNextBillingDate(
        currentBillingDate,
        subscription.billingCycle
      );

      updateSubscription(id, {
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
      });
    },
    [subscriptions, updateSubscription]
  );

  // Get subscriptions by status
  const getByStatus = useCallback(
    (status: SubscriptionStatus): Subscription[] => {
      return subscriptions.filter((s) => s.status === status);
    },
    [subscriptions]
  );

  // Get subscriptions by category
  const getByCategory = useCallback(
    (categoryId: string): Subscription[] => {
      return subscriptions.filter((s) => s.categoryId === categoryId);
    },
    [subscriptions]
  );

  // Get upcoming renewals
  const getUpcomingRenewals = useCallback(
    (days: number = 7): Subscription[] => {
      const today = new Date();
      const futureDate = addDays(today, days);

      return subscriptions
        .filter((s) => {
          if (s.status !== 'active' || !s.nextBillingDate) return false;
          const billingDate = new Date(s.nextBillingDate);
          return billingDate >= today && billingDate <= futureDate;
        })
        .sort(
          (a, b) =>
            new Date(a.nextBillingDate!).getTime() -
            new Date(b.nextBillingDate!).getTime()
        );
    },
    [subscriptions]
  );

  // Get expiring trials
  const getExpiringTrials = useCallback(
    (days: number = 3): Subscription[] => {
      const today = new Date();
      const futureDate = addDays(today, days);

      return subscriptions
        .filter((s) => {
          if (s.status !== 'trial' || !s.trialEndDate) return false;
          const trialEnd = new Date(s.trialEndDate);
          return trialEnd >= today && trialEnd <= futureDate;
        })
        .sort(
          (a, b) =>
            new Date(a.trialEndDate!).getTime() -
            new Date(b.trialEndDate!).getTime()
        );
    },
    [subscriptions]
  );

  // Summary
  const summary = useMemo((): SubscriptionSummary => {
    const active = subscriptions.filter((s) => s.status === 'active');
    const paused = subscriptions.filter((s) => s.status === 'paused');
    const cancelled = subscriptions.filter((s) => s.status === 'cancelled');
    const trial = subscriptions.filter((s) => s.status === 'trial');

    const activeAndTrial = [...active, ...trial];

    const monthlyTotal = activeAndTrial.reduce(
      (sum, s) => sum + getMonthlyEquivalent(s.amount, s.billingCycle),
      0
    );

    const yearlyTotal = activeAndTrial.reduce(
      (sum, s) => sum + getYearlyEquivalent(s.amount, s.billingCycle),
      0
    );

    return {
      total: subscriptions.length,
      active: active.length,
      paused: paused.length,
      cancelled: cancelled.length,
      trial: trial.length,
      monthlyTotal,
      yearlyTotal,
      upcomingRenewals: getUpcomingRenewals(7),
      expiringTrials: getExpiringTrials(3),
    };
  }, [subscriptions, getUpcomingRenewals, getExpiringTrials]);

  // Group by category
  const groupByCategory = useMemo(() => {
    const groups: Record<string, Subscription[]> = {};
    subscriptions.forEach((sub) => {
      const key = sub.categoryId || 'uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(sub);
    });
    return groups;
  }, [subscriptions]);

  // Check for reminders (call this periodically)
  const checkReminders = useCallback(() => {
    const today = new Date();

    subscriptions.forEach((sub) => {
      if (sub.status !== 'active' || !sub.nextBillingDate) return;

      const billingDate = new Date(sub.nextBillingDate);
      const daysUntil = daysBetween(today, billingDate);
      const reminderDays = sub.reminderDays ?? 3;

      if (daysUntil > 0 && daysUntil <= reminderDays) {
        options.onRenewalReminder?.(sub, daysUntil);
      }
    });

    subscriptions.forEach((sub) => {
      if (sub.status !== 'trial' || !sub.trialEndDate) return;

      const trialEnd = new Date(sub.trialEndDate);
      const daysUntil = daysBetween(today, trialEnd);

      if (daysUntil > 0 && daysUntil <= 3) {
        options.onTrialExpiring?.(sub, daysUntil);
      }
    });
  }, [subscriptions, options]);

  return {
    subscriptions,
    summary,
    groupByCategory,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    renewSubscription,
    getByStatus,
    getByCategory,
    getUpcomingRenewals,
    getExpiringTrials,
    checkReminders,
  };
}

// Common subscriptions templates
export const commonSubscriptions: Array<{
  name: string;
  provider: string;
  category: string;
  defaultAmount: number;
  billingCycle: BillingCycle;
  logo?: string;
  color: string;
}> = [
  { name: 'Netflix', provider: 'Netflix', category: 'entertainment', defaultAmount: 55.90, billingCycle: 'monthly', color: '#E50914' },
  { name: 'Spotify', provider: 'Spotify', category: 'entertainment', defaultAmount: 21.90, billingCycle: 'monthly', color: '#1DB954' },
  { name: 'Amazon Prime', provider: 'Amazon', category: 'entertainment', defaultAmount: 14.90, billingCycle: 'monthly', color: '#FF9900' },
  { name: 'Disney+', provider: 'Disney', category: 'entertainment', defaultAmount: 33.90, billingCycle: 'monthly', color: '#113CCF' },
  { name: 'HBO Max', provider: 'Warner', category: 'entertainment', defaultAmount: 34.90, billingCycle: 'monthly', color: '#5C1F99' },
  { name: 'YouTube Premium', provider: 'Google', category: 'entertainment', defaultAmount: 24.90, billingCycle: 'monthly', color: '#FF0000' },
  { name: 'iCloud', provider: 'Apple', category: 'storage', defaultAmount: 3.50, billingCycle: 'monthly', color: '#007AFF' },
  { name: 'Google One', provider: 'Google', category: 'storage', defaultAmount: 6.99, billingCycle: 'monthly', color: '#4285F4' },
  { name: 'Dropbox', provider: 'Dropbox', category: 'storage', defaultAmount: 59.99, billingCycle: 'monthly', color: '#0061FF' },
  { name: 'Microsoft 365', provider: 'Microsoft', category: 'productivity', defaultAmount: 36.00, billingCycle: 'monthly', color: '#00A4EF' },
  { name: 'Adobe Creative Cloud', provider: 'Adobe', category: 'productivity', defaultAmount: 224.00, billingCycle: 'monthly', color: '#FF0000' },
  { name: 'Notion', provider: 'Notion', category: 'productivity', defaultAmount: 40.00, billingCycle: 'monthly', color: '#000000' },
  { name: 'GitHub Pro', provider: 'GitHub', category: 'development', defaultAmount: 4.00, billingCycle: 'monthly', color: '#24292E' },
  { name: 'Vercel Pro', provider: 'Vercel', category: 'development', defaultAmount: 20.00, billingCycle: 'monthly', color: '#000000' },
];

// Billing cycle labels
export const billingCycleLabels: Record<BillingCycle, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

// Status labels
export const subscriptionStatusLabels: Record<SubscriptionStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  cancelled: 'Cancelada',
  trial: 'Em teste',
  expired: 'Expirada',
};

export type { Subscription, SubscriptionStatus, BillingCycle, SubscriptionSummary };
export { getMonthlyEquivalent, getYearlyEquivalent };
export default useSubscriptions;
