import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReports, useSummaryReport, useCashFlowReport } from '../useReports';
import { reportService } from '@/services/report.service';

vi.mock('@/services/report.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useReports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useReports hook', () => {
    it('fetches all report data', async () => {
      const mockSummary = { totalReceitas: 10000, totalDespesas: 5000 };
      const mockCashFlow = [{ date: '2026-01-01', entradas: 1000, saidas: 500 }];
      
      vi.mocked(reportService.getSummary).mockResolvedValue(mockSummary);
      vi.mocked(reportService.getCashFlow).mockResolvedValue(mockCashFlow);
      vi.mocked(reportService.getDespesasByCategoria).mockResolvedValue([]);
      vi.mocked(reportService.getReceitasByCategoria).mockResolvedValue([]);
      vi.mocked(reportService.getByCliente).mockResolvedValue([]);
      vi.mocked(reportService.getByFornecedor).mockResolvedValue([]);
      vi.mocked(reportService.getAging).mockResolvedValue({ aVencer: [], vencido: [] });

      const { result } = renderHook(() => useReports(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.summary).toEqual(mockSummary);
      });

      expect(reportService.getSummary).toHaveBeenCalled();
    });

    it('applies filters to queries', async () => {
      const filters = { startDate: '2026-01-01', endDate: '2026-01-31' };
      vi.mocked(reportService.getSummary).mockResolvedValue({});

      renderHook(() => useReports(filters), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(reportService.getSummary).toHaveBeenCalledWith(filters);
      });
    });

    it('exports summary to CSV', async () => {
      vi.mocked(reportService.getSummary).mockResolvedValue({ total: 1000 });
      vi.mocked(reportService.exportToCSV).mockResolvedValue('summary.csv');

      const { result } = renderHook(() => useReports(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.summary).toBeDefined());

      await result.current.exportSummary();
      expect(reportService.exportToCSV).toHaveBeenCalled();
    });
  });

  describe('useSummaryReport hook', () => {
    it('fetches summary report only', async () => {
      const mockSummary = { totalReceitas: 5000, totalDespesas: 2000 };
      vi.mocked(reportService.getSummary).mockResolvedValue(mockSummary);

      const { result } = renderHook(() => useSummaryReport(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockSummary);
      });
    });

    it('handles loading state', () => {
      vi.mocked(reportService.getSummary).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useSummaryReport(), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useCashFlowReport hook', () => {
    it('fetches cash flow data', async () => {
      const mockCashFlow = [
        { date: '2026-01-01', entradas: 1000, saidas: 500, saldo: 500 },
        { date: '2026-01-02', entradas: 2000, saidas: 800, saldo: 1200 },
      ];
      vi.mocked(reportService.getCashFlow).mockResolvedValue(mockCashFlow);

      const { result } = renderHook(() => useCashFlowReport(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.data).toEqual(mockCashFlow);
      });
    });
  });
});
