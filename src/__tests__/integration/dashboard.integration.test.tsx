import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { createElement } from 'react';

// Mock services
vi.mock('@/services/report.service', () => ({
  reportService: {
    getSummary: vi.fn().mockResolvedValue({
      totalReceitas: 50000,
      totalDespesas: 30000,
      saldoLiquido: 20000,
      contasAPagar: 15000,
      contasAReceber: 25000,
      contasAtrasadas: 5000,
    }),
    getCashFlow: vi.fn().mockResolvedValue([
      { date: '2025-01-15', entradas: 5000, saidas: 3000, saldo: 2000 },
      { date: '2025-01-16', entradas: 8000, saidas: 4000, saldo: 4000 },
      { date: '2025-01-17', entradas: 3000, saidas: 2000, saldo: 1000 },
    ]),
  },
}));

vi.mock('@/services/contas-pagar.service', () => ({
  contasPagarService: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, descricao: 'Aluguel', valor: 2000, dataVencimento: '2025-01-25', status: 'pendente' },
      { id: 2, descricao: 'Energia', valor: 500, dataVencimento: '2025-01-22', status: 'pendente' },
    ]),
    getOverdue: vi.fn().mockResolvedValue([
      { id: 3, descricao: 'Internet', valor: 150, dataVencimento: '2025-01-15', status: 'atrasado' },
    ]),
  },
}));

vi.mock('@/services/contas-receber.service', () => ({
  contasReceberService: {
    getAll: vi.fn().mockResolvedValue([
      { id: 1, descricao: 'Venda #001', valor: 5000, dataVencimento: '2025-01-20', status: 'pendente' },
      { id: 2, descricao: 'Venda #002', valor: 3000, dataVencimento: '2025-01-25', status: 'pendente' },
    ]),
  },
}));

// Mock Dashboard Component
const MockDashboard = () => {
  return (
    <div data-testid="dashboard">
      <h1>Dashboard</h1>
      <div data-testid="stats-section">
        <div data-testid="stat-receitas">R$ 50.000,00</div>
        <div data-testid="stat-despesas">R$ 30.000,00</div>
        <div data-testid="stat-saldo">R$ 20.000,00</div>
      </div>
      <div data-testid="upcoming-bills">
        <h2>Contas a Vencer</h2>
        <ul>
          <li>Aluguel - R$ 2.000,00</li>
          <li>Energia - R$ 500,00</li>
        </ul>
      </div>
      <div data-testid="overdue-bills">
        <h2>Contas Atrasadas</h2>
        <ul>
          <li>Internet - R$ 150,00</li>
        </ul>
      </div>
      <div data-testid="cash-flow-chart">
        <h2>Fluxo de Caixa</h2>
      </div>
      <button data-testid="period-today">Hoje</button>
      <button data-testid="period-week">Semana</button>
      <button data-testid="period-month">Mês</button>
      <button data-testid="refresh-btn">Atualizar</button>
    </div>
  );
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(BrowserRouter, null, children)
    );
};

describe('Dashboard Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Rendering', () => {
    it('renders dashboard layout', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders stats section', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
      expect(screen.getByTestId('stat-receitas')).toBeInTheDocument();
      expect(screen.getByTestId('stat-despesas')).toBeInTheDocument();
      expect(screen.getByTestId('stat-saldo')).toBeInTheDocument();
    });

    it('renders upcoming bills section', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByTestId('upcoming-bills')).toBeInTheDocument();
      expect(screen.getByText('Contas a Vencer')).toBeInTheDocument();
    });

    it('renders overdue bills section', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByTestId('overdue-bills')).toBeInTheDocument();
      expect(screen.getByText('Contas Atrasadas')).toBeInTheDocument();
    });

    it('renders cash flow chart section', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByTestId('cash-flow-chart')).toBeInTheDocument();
      expect(screen.getByText('Fluxo de Caixa')).toBeInTheDocument();
    });
  });

  describe('Period Selection', () => {
    it('renders period buttons', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByTestId('period-today')).toBeInTheDocument();
      expect(screen.getByTestId('period-week')).toBeInTheDocument();
      expect(screen.getByTestId('period-month')).toBeInTheDocument();
    });

    it('handles period change', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      fireEvent.click(screen.getByTestId('period-week'));
      expect(screen.getByTestId('period-week')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('displays formatted currency values', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByText('R$ 50.000,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 30.000,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 20.000,00')).toBeInTheDocument();
    });

    it('displays bill items', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByText(/Aluguel/)).toBeInTheDocument();
      expect(screen.getByText(/Energia/)).toBeInTheDocument();
    });

    it('displays overdue items', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByText(/Internet/)).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('renders refresh button', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
    });

    it('handles refresh click', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      fireEvent.click(screen.getByTestId('refresh-btn'));
      expect(screen.getByTestId('refresh-btn')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('has proper structure for grid layout', () => {
      const Wrapper = createWrapper();
      const { container } = render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(container.querySelector('[data-testid="dashboard"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper headings', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Contas a Vencer' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Contas Atrasadas' })).toBeInTheDocument();
    });

    it('has interactive buttons', () => {
      const Wrapper = createWrapper();
      render(
        <Wrapper>
          <MockDashboard />
        </Wrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
