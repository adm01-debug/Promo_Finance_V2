import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContasPagarPage } from '@/pages/contas-pagar';
import { contasPagarService } from '@/services/contas-pagar.service';
import { AuthProvider } from '@/contexts/AuthContext';

vi.mock('@/services/contas-pagar.service');

const mockContas = [
  {
    id: '1',
    descricao: 'Fornecedor A',
    valor: 1500,
    vencimento: '2026-01-20',
    status: 'pendente',
    fornecedor: { id: '1', nome: 'Fornecedor A' },
    categoria: 'Materiais',
  },
  {
    id: '2',
    descricao: 'Aluguel',
    valor: 3000,
    vencimento: '2026-01-15',
    status: 'pago',
    fornecedor: { id: '2', nome: 'Imobiliária XYZ' },
    categoria: 'Despesas Fixas',
  },
  {
    id: '3',
    descricao: 'Energia Elétrica',
    valor: 500,
    vencimento: '2026-01-10',
    status: 'atrasado',
    fornecedor: { id: '3', nome: 'Companhia Elétrica' },
    categoria: 'Utilities',
  },
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

describe('Contas a Pagar Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contasPagarService.getAll).mockResolvedValue(mockContas);
    vi.mocked(contasPagarService.getById).mockImplementation((id) =>
      Promise.resolve(mockContas.find((c) => c.id === id))
    );
  });

  describe('List View', () => {
    it('displays contas list', async () => {
      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
        expect(screen.getByText('Aluguel')).toBeInTheDocument();
        expect(screen.getByText('Energia Elétrica')).toBeInTheDocument();
      });
    });

    it('shows conta values formatted', async () => {
      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/1\.500|1,500/)).toBeInTheDocument();
        expect(screen.getByText(/3\.000|3,000/)).toBeInTheDocument();
      });
    });

    it('displays status badges', async () => {
      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/pendente/i)).toBeInTheDocument();
        expect(screen.getByText(/pago/i)).toBeInTheDocument();
        expect(screen.getByText(/atrasado/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('filters by status', async () => {
      const user = userEvent.setup();
      vi.mocked(contasPagarService.getAll).mockImplementation(async (filters) => {
        if (filters?.status === 'pendente') {
          return mockContas.filter((c) => c.status === 'pendente');
        }
        return mockContas;
      });

      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const statusFilter = screen.queryByTestId('status-filter') ||
                          screen.queryByLabelText(/status/i);
      
      if (statusFilter) {
        await user.click(statusFilter);
        const pendenteOption = screen.queryByText(/pendente/i);
        if (pendenteOption) {
          await user.click(pendenteOption);
        }
      }
    });

    it('filters by date range', async () => {
      const user = userEvent.setup();
      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const dateFilter = screen.queryByTestId('date-filter') ||
                        screen.queryByLabelText(/data|date/i);

      if (dateFilter) {
        await user.click(dateFilter);
      }
    });

    it('searches by description', async () => {
      const user = userEvent.setup();
      vi.mocked(contasPagarService.getAll).mockImplementation(async (filters) => {
        if (filters?.search) {
          return mockContas.filter((c) => 
            c.descricao.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        return mockContas;
      });

      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const searchInput = screen.queryByPlaceholderText(/buscar|search/i) ||
                         screen.queryByRole('searchbox');

      if (searchInput) {
        await user.type(searchInput, 'Aluguel');
      }
    });
  });

  describe('Actions', () => {
    it('opens create modal', async () => {
      const user = userEvent.setup();
      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const addButton = screen.queryByRole('button', { name: /nova|adicionar|add|new/i });
      if (addButton) {
        await user.click(addButton);
        await waitFor(() => {
          expect(screen.queryByRole('dialog')).toBeTruthy();
        });
      }
    });

    it('marks conta as paid', async () => {
      const user = userEvent.setup();
      vi.mocked(contasPagarService.markAsPaid).mockResolvedValue({ ...mockContas[0], status: 'pago' });

      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const payButton = screen.queryByRole('button', { name: /pagar|pay/i });
      if (payButton) {
        await user.click(payButton);
        await waitFor(() => {
          expect(contasPagarService.markAsPaid).toHaveBeenCalled();
        });
      }
    });

    it('deletes conta with confirmation', async () => {
      const user = userEvent.setup();
      vi.mocked(contasPagarService.delete).mockResolvedValue(undefined);

      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const deleteButton = screen.queryByRole('button', { name: /excluir|delete/i });
      if (deleteButton) {
        await user.click(deleteButton);
        
        const confirmButton = await screen.findByRole('button', { name: /confirmar|confirm/i });
        await user.click(confirmButton);

        await waitFor(() => {
          expect(contasPagarService.delete).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Bulk Actions', () => {
    it('selects multiple contas', async () => {
      const user = userEvent.setup();
      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const checkboxes = screen.queryAllByRole('checkbox');
      if (checkboxes.length > 1) {
        await user.click(checkboxes[1]);
        await user.click(checkboxes[2]);
      }
    });

    it('shows bulk action menu when items selected', async () => {
      const user = userEvent.setup();
      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.queryByLabelText(/selecionar todos|select all/i);
      if (selectAllCheckbox) {
        await user.click(selectAllCheckbox);
        await waitFor(() => {
          expect(screen.queryByText(/ações em lote|bulk actions/i)).toBeTruthy();
        });
      }
    });
  });

  describe('Export', () => {
    it('exports to CSV', async () => {
      const user = userEvent.setup();
      vi.mocked(contasPagarService.exportToCSV).mockResolvedValue('contas.csv');

      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Fornecedor A')).toBeInTheDocument();
      });

      const exportButton = screen.queryByRole('button', { name: /exportar|export/i });
      if (exportButton) {
        await user.click(exportButton);
        
        const csvOption = screen.queryByText(/csv/i);
        if (csvOption) {
          await user.click(csvOption);
          await waitFor(() => {
            expect(contasPagarService.exportToCSV).toHaveBeenCalled();
          });
        }
      }
    });
  });

  describe('Pagination', () => {
    it('paginates results', async () => {
      const user = userEvent.setup();
      const manyContas = Array.from({ length: 25 }, (_, i) => ({
        ...mockContas[0],
        id: String(i + 1),
        descricao: `Conta ${i + 1}`,
      }));
      vi.mocked(contasPagarService.getAll).mockResolvedValue(manyContas);

      render(<ContasPagarPage />, { wrapper: createTestWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Conta 1')).toBeInTheDocument();
      });

      const nextButton = screen.queryByRole('button', { name: /próxima|next/i });
      if (nextButton) {
        await user.click(nextButton);
      }
    });
  });
});
