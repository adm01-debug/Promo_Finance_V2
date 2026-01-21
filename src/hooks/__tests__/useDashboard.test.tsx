import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboard, useDashboardStats, useDashboardAlerts } from '../useDashboard';
import { dashboardService } from '@/services/dashboard.service';

vi.mock('@/services/dashboard.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useDashboard hook', () => {
    it('fetches dashboard data for default period', async () => {
      const mockStats = {
        totalReceitas: 10000,
        totalDespesas: 5000,
        saldoLiquido: 5000,
        contasAPagar: 3,
        contasAReceber: 5,
      };
      vi.mocked(dashboardService.getStats).mockResolvedValue(mockStats);
      vi.mocked(dashboardService.getRecentTransactions).mockResolvedValue([]);
      vi.mocked(dashboardService.getUpcomingBills).mockResolvedValue([]);
      vi.mocked(dashboardService.getOverdueBills).mockResolvedValue([]);
      vi.mocked(dashboardService.getCashFlow).mockResolvedValue([]);

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.stats).toEqual(mockStats);
      });
    });

    it('changes period and refetches', async () => {
      vi.mocked(dashboardService.getStats).mockResolvedValue({});

      const { result, rerender } = renderHook(
        ({ period }) => useDashboard(period),
        { wrapper: createWrapper(), initialProps: { period: 'month' as const } }
      );

      await waitFor(() => expect(dashboardService.getStats).toHaveBeenCalled());

      rerender({ period: 'year' });

      await waitFor(() => {
        expect(dashboardService.getStats).toHaveBeenCalledTimes(2);
      });
    });

    it('calculates date range based on period', async () => {
      vi.mocked(dashboardService.getStats).mockResolvedValue({});

      const { result } = renderHook(() => useDashboard('week'), { wrapper: createWrapper() });

      expect(result.current.dateRange).toBeDefined();
      expect(result.current.dateRange.startDate).toBeDefined();
      expect(result.current.dateRange.endDate).toBeDefined();
    });

    it('provides refresh function', async () => {
      vi.mocked(dashboardService.getStats).mockResolvedValue({});

      const { result } = renderHook(() => useDashboard(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.stats).toBeDefined());

      await result.current.refresh();
      expect(dashboardService.getStats).toHaveBeenCalledTimes(2);
    });
  });

  describe('useDashboardStats hook', () => {
    it('fetches stats only', async () => {
      const mockStats = { totalReceitas: 8000, totalDespesas: 3000 };
      vi.mocked(dashboardService.getStats).mockResolvedValue(mockStats);

      const { result } = renderHook(() => useDashboardStats(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockStats);
      });
    });
  });

  describe('useDashboardAlerts hook', () => {
    it('returns alerts for overdue bills', async () => {
      vi.mocked(dashboardService.getOverdueBills).mockResolvedValue([
        { id: '1', valor: 500, daysOverdue: 5 },
        { id: '2', valor: 300, daysOverdue: 10 },
      ]);
      vi.mocked(dashboardService.getDueToday).mockResolvedValue([]);
      vi.mocked(dashboardService.getDueTomorrow).mockResolvedValue([]);

      const { result } = renderHook(() => useDashboardAlerts(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.alerts).toContainEqual(
          expect.objectContaining({ type: 'error' })
        );
      });
    });

    it('returns warning for bills due today', async () => {
      vi.mocked(dashboardService.getOverdueBills).mockResolvedValue([]);
      vi.mocked(dashboardService.getDueToday).mockResolvedValue([
        { id: '1', valor: 1000 },
      ]);
      vi.mocked(dashboardService.getDueTomorrow).mockResolvedValue([]);

      const { result } = renderHook(() => useDashboardAlerts(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.alerts).toContainEqual(
          expect.objectContaining({ type: 'warning' })
        );
      });
    });
  });
});
