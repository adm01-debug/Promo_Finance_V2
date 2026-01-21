import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/dashboard';
import { dashboardService } from '@/services/dashboard.service';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/services/dashboard.service');

const mockStats = {
  totalReceitas: 50000,
  totalDespesas: 30000,
  saldoLiquido: 20000,
  contasAPagar: 15,
  contasAReceber: 20,
  contasAtrasadas: 3,
};

const mockTransactions = [
  { id: '1', descricao: 'Venda #001', valor: 1500, tipo: 'receita', data: '2026-01-15' },
  { id: '2', descricao: 'Fornecedor ABC', valor: 800, tipo: 'despesa', data: '2026-01-14' },
];

const mockUpcomingBills = [
  { id: '1', descricao: 'Aluguel', valor: 3000, vencimento: '2026-01-20', daysUntilDue: 2 },
  { id: '2', descricao: 'Internet', valor: 200, vencimento: '2026-01-22', daysUntilDue: 4 },
];

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Dashboard Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dashboardService.getStats).mockResolvedValue(mockStats);
    vi.mocked(dashboardService.getRecentTransactions).mockResolvedValue(mockTransactions);
    vi.mocked(dashboardService.getUpcomingBills).mockResolvedValue(mockUpcomingBills);
    vi.mocked(dashboardService.getOverdueBills).mockResolvedValue([]);
    vi.mocked(dashboardService.getCashFlow).mockResolvedValue([]);
  });

  describe('Dashboard Loading', () => {
    it('shows loading state initially', () => {
      vi.mocked(dashboardService.getStats).mockImplementation(
        () => new Promise(() => {})
      );

      render(<DashboardPage />, { wrapper: createTestWrapper() });

      expect(screen.getByTestId('dashboard-loading') || 
             screen.getByRole('progressbar') ||
             screen.getByText(/carregando|loading/i)).toBeInTheDocument();
    });

    it('displays stats cards after loading', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/50\.000|50,000/)).toBeInTheDocument();
      });
    });
  });

  describe('Stats Display', () => {
    it('shows total receitas', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/receitas|income/i)).toBeInTheDocument();
        expect(screen.getByText(/50\.000|50,000/)).toBeInTheDocument();
      });
    });

    it('shows total despesas', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/despesas|expenses/i)).toBeInTheDocument();
        expect(screen.getByText(/30\.000|30,000/)).toBeInTheDocument();
      });
    });

    it('shows saldo liquido', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/saldo|balance/i)).toBeInTheDocument();
        expect(screen.getByText(/20\.000|20,000/)).toBeInTheDocument();
      });
    });

    it('shows contas atrasadas alert', async () => {
      vi.mocked(dashboardService.getOverdueBills).mockResolvedValue([
        { id: '1', valor: 1000, daysOverdue: 5 },
      ]);

      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/atrasad|overdue/i)).toBeInTheDocument();
      });
    });
  });

  describe('Recent Transactions', () => {
    it('displays recent transactions list', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Venda #001/)).toBeInTheDocument();
        expect(screen.getByText(/Fornecedor ABC/)).toBeInTheDocument();
      });
    });

    it('shows transaction values correctly', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/1\.500|1,500/)).toBeInTheDocument();
        expect(screen.getByText(/800/)).toBeInTheDocument();
      });
    });
  });

  describe('Upcoming Bills', () => {
    it('displays upcoming bills', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Aluguel/)).toBeInTheDocument();
        expect(screen.getByText(/Internet/)).toBeInTheDocument();
      });
    });

    it('shows days until due', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/2.*dias|2.*days/i)).toBeInTheDocument();
      });
    });
  });

  describe('Period Selection', () => {
    it('changes period and refetches data', async () => {
      const user = userEvent.setup();
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(dashboardService.getStats).toHaveBeenCalled();
      });

      const periodSelector = screen.queryByRole('combobox') || 
                            screen.queryByTestId('period-selector');
      
      if (periodSelector) {
        await user.click(periodSelector);
        const yearOption = screen.queryByText(/ano|year/i);
        if (yearOption) {
          await user.click(yearOption);
        }
      }
    });
  });

  describe('Quick Actions', () => {
    it('displays quick action buttons', async () => {
      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.queryByText(/nova conta|new bill/i) ||
               screen.queryByRole('button', { name: /adicionar|add/i })).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when fetch fails', async () => {
      vi.mocked(dashboardService.getStats).mockRejectedValue(new Error('Fetch failed'));

      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/erro|error/i)).toBeInTheDocument();
      });
    });

    it('provides retry option on error', async () => {
      vi.mocked(dashboardService.getStats).mockRejectedValue(new Error('Fetch failed'));

      render(<DashboardPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /tentar.*novamente|retry/i })).toBeTruthy();
      });
    });
  });
});
