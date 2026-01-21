import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ContasReceberPage } from '@/pages/contas-receber';

// Mock services
vi.mock('@/services/contas-receber.service', () => ({
  contasReceberService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    markAsReceived: vi.fn(),
    cancel: vi.fn(),
    getTotalByStatus: vi.fn(),
    bulkMarkAsReceived: vi.fn(),
    bulkDelete: vi.fn(),
    exportToCSV: vi.fn(),
  },
}));

vi.mock('@/services/clientes.service', () => ({
  clientesService: {
    getAll: vi.fn(),
    search: vi.fn(),
  },
}));

import { contasReceberService } from '@/services/contas-receber.service';
import { clientesService } from '@/services/clientes.service';

const mockContas = [
  {
    id: '1',
    descricao: 'Venda produto A',
    valor: 5000,
    data_vencimento: '2024-01-15',
    data_recebimento: null,
    status: 'pendente',
    cliente_id: 'c1',
    cliente: { id: 'c1', nome: 'Cliente ABC' },
    categoria: 'Vendas',
    observacoes: 'NF 1234',
    created_at: '2024-01-01',
  },
  {
    id: '2',
    descricao: 'Serviço consultoria',
    valor: 15000,
    data_vencimento: '2024-01-10',
    data_recebimento: '2024-01-10',
    status: 'recebido',
    cliente_id: 'c2',
    cliente: { id: 'c2', nome: 'Empresa XYZ' },
    categoria: 'Serviços',
    observacoes: '',
    created_at: '2024-01-02',
  },
  {
    id: '3',
    descricao: 'Venda produto B',
    valor: 3000,
    data_vencimento: '2024-01-05',
    data_recebimento: null,
    status: 'atrasado',
    cliente_id: 'c1',
    cliente: { id: 'c1', nome: 'Cliente ABC' },
    categoria: 'Vendas',
    observacoes: 'Aguardando pagamento',
    created_at: '2024-01-03',
  },
];

const mockClientes = [
  { id: 'c1', nome: 'Cliente ABC' },
  { id: 'c2', nome: 'Empresa XYZ' },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Contas Receber Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(contasReceberService.getAll).mockResolvedValue(mockContas);
    vi.mocked(contasReceberService.getTotalByStatus).mockResolvedValue({
      pendente: { count: 1, total: 5000 },
      recebido: { count: 1, total: 15000 },
      atrasado: { count: 1, total: 3000 },
      cancelado: { count: 0, total: 0 },
    });
    vi.mocked(clientesService.getAll).mockResolvedValue(mockClientes);
    vi.mocked(clientesService.search).mockResolvedValue(mockClientes);
  });

  it('displays contas receber list after loading', async () => {
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    expect(screen.getByText('Serviço consultoria')).toBeInTheDocument();
    expect(screen.getByText('Venda produto B')).toBeInTheDocument();
  });

  it('shows conta values formatted correctly', async () => {
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument();
    });

    expect(screen.getByText('R$ 15.000,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 3.000,00')).toBeInTheDocument();
  });

  it('displays status badges', async () => {
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    expect(screen.getByText('Recebido')).toBeInTheDocument();
    expect(screen.getByText('Atrasado')).toBeInTheDocument();
  });

  it('shows cliente name for each conta', async () => {
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('Cliente ABC')).toHaveLength(2);
    });

    expect(screen.getByText('Empresa XYZ')).toBeInTheDocument();
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    await user.click(statusFilter);
    await user.click(screen.getByText('Recebido'));

    expect(contasReceberService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'recebido' })
    );
  });

  it('filters by cliente', async () => {
    const user = userEvent.setup();
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const clienteFilter = screen.getByRole('combobox', { name: /cliente/i });
    await user.click(clienteFilter);
    await user.click(screen.getByText('Cliente ABC'));

    expect(contasReceberService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ cliente_id: 'c1' })
    );
  });

  it('filters by date range', async () => {
    const user = userEvent.setup();
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const startDateInput = screen.getByLabelText(/data início/i);
    const endDateInput = screen.getByLabelText(/data fim/i);

    await user.type(startDateInput, '2024-01-01');
    await user.type(endDateInput, '2024-01-31');

    await waitFor(() => {
      expect(contasReceberService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
      );
    });
  });

  it('searches by description', async () => {
    const user = userEvent.setup();
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await user.type(searchInput, 'consultoria');

    await waitFor(() => {
      expect(contasReceberService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'consultoria' })
      );
    });
  });

  it('opens create modal', async () => {
    const user = userEvent.setup();
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /nova conta/i });
    await user.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/cadastrar conta a receber/i)).toBeInTheDocument();
  });

  it('creates new conta a receber', async () => {
    const user = userEvent.setup();
    vi.mocked(contasReceberService.create).mockResolvedValue({
      id: '4',
      descricao: 'Nova venda',
      valor: 8000,
    });

    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /nova conta/i });
    await user.click(addButton);

    await user.type(screen.getByLabelText(/descrição/i), 'Nova venda');
    await user.type(screen.getByLabelText(/valor/i), '8000');
    await user.type(screen.getByLabelText(/vencimento/i), '2024-02-15');

    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(contasReceberService.create).toHaveBeenCalled();
    });
  });

  it('marks conta as received', async () => {
    const user = userEvent.setup();
    vi.mocked(contasReceberService.markAsReceived).mockResolvedValue({
      ...mockContas[0],
      status: 'recebido',
      data_recebimento: '2024-01-15',
    });

    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const receiveButtons = screen.getAllByRole('button', { name: /receber/i });
    await user.click(receiveButtons[0]);

    await waitFor(() => {
      expect(contasReceberService.markAsReceived).toHaveBeenCalledWith('1', expect.any(String));
    });
  });

  it('deletes conta with confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(contasReceberService.delete).mockResolvedValue({ success: true });

    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
    await user.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(contasReceberService.delete).toHaveBeenCalledWith('1');
    });
  });

  it('selects multiple contas', async () => {
    const user = userEvent.setup();
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // First row
    await user.click(checkboxes[2]); // Second row

    expect(screen.getByText('2 selecionados')).toBeInTheDocument();
  });

  it('bulk marks as received', async () => {
    const user = userEvent.setup();
    vi.mocked(contasReceberService.bulkMarkAsReceived).mockResolvedValue({ count: 2 });

    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    await user.click(checkboxes[3]); // Select 2 pending contas

    const bulkReceiveButton = screen.getByRole('button', { name: /receber selecionados/i });
    await user.click(bulkReceiveButton);

    await waitFor(() => {
      expect(contasReceberService.bulkMarkAsReceived).toHaveBeenCalled();
    });
  });

  it('exports to CSV', async () => {
    const user = userEvent.setup();
    vi.mocked(contasReceberService.exportToCSV).mockResolvedValue('/exports/contas-receber.csv');

    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto A')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /exportar/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(contasReceberService.exportToCSV).toHaveBeenCalled();
    });
  });

  it('displays summary stats', async () => {
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument(); // Pendente
    });

    expect(screen.getByText('R$ 15.000,00')).toBeInTheDocument(); // Recebido
    expect(screen.getByText('R$ 3.000,00')).toBeInTheDocument(); // Atrasado
  });

  it('paginates results', async () => {
    const user = userEvent.setup();
    const manyContas = Array.from({ length: 25 }, (_, i) => ({
      ...mockContas[0],
      id: String(i + 1),
      descricao: `Conta ${i + 1}`,
    }));

    vi.mocked(contasReceberService.getAll).mockResolvedValue(manyContas);

    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Conta 1')).toBeInTheDocument();
    });

    const nextPageButton = screen.getByRole('button', { name: /próxima/i });
    await user.click(nextPageButton);

    expect(screen.getByText('Página 2')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(contasReceberService.getAll).mockRejectedValue(new Error('Network error'));

    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    });
  });

  it('highlights overdue contas', async () => {
    render(<ContasReceberPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Venda produto B')).toBeInTheDocument();
    });

    const atrasadoBadge = screen.getByText('Atrasado');
    expect(atrasadoBadge).toHaveClass('bg-red-100');
  });
});
