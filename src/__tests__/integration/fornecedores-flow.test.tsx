import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FornecedoresPage } from '@/pages/fornecedores';

// Mock services
vi.mock('@/services/fornecedores.service', () => ({
  fornecedoresService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
    search: vi.fn(),
    getCategorias: vi.fn(),
    exportToCSV: vi.fn(),
  },
}));

import { fornecedoresService } from '@/services/fornecedores.service';

const mockFornecedores = [
  {
    id: '1',
    razao_social: 'Fornecedor ABC Ltda',
    nome_fantasia: 'ABC Suprimentos',
    cnpj: '12.345.678/0001-90',
    email: 'contato@abc.com',
    telefone: '11999998888',
    endereco: 'Rua Industrial, 100',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-000',
    categoria: 'Matéria Prima',
    ativo: true,
    banco: 'Banco do Brasil',
    agencia: '1234',
    conta: '56789-0',
    pix: '12345678000190',
    created_at: '2024-01-01',
  },
  {
    id: '2',
    razao_social: 'XYZ Tecnologia SA',
    nome_fantasia: 'XYZ Tech',
    cnpj: '98.765.432/0001-10',
    email: 'contato@xyz.com',
    telefone: '11888887777',
    endereco: 'Av Tecnologia, 500',
    cidade: 'Campinas',
    estado: 'SP',
    cep: '13000-000',
    categoria: 'Tecnologia',
    ativo: true,
    banco: 'Itaú',
    agencia: '4321',
    conta: '98765-4',
    pix: 'contato@xyz.com',
    created_at: '2024-01-02',
  },
  {
    id: '3',
    razao_social: 'Serviços Gerais ME',
    nome_fantasia: 'ServiGeral',
    cnpj: '11.222.333/0001-44',
    email: 'servigeral@email.com',
    telefone: '11777776666',
    endereco: 'Rua Serviços, 200',
    cidade: 'Guarulhos',
    estado: 'SP',
    cep: '07000-000',
    categoria: 'Serviços',
    ativo: false,
    created_at: '2024-01-03',
  },
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

describe('Fornecedores Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fornecedoresService.getAll).mockResolvedValue(mockFornecedores);
    vi.mocked(fornecedoresService.getStats).mockResolvedValue({
      totalFornecedores: 3,
      fornecedoresAtivos: 2,
      fornecedoresInativos: 1,
      totalPago: 150000,
      totalPendente: 25000,
    });
    vi.mocked(fornecedoresService.getCategorias).mockResolvedValue([
      'Matéria Prima',
      'Tecnologia',
      'Serviços',
    ]);
  });

  it('displays fornecedores list after loading', async () => {
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    expect(screen.getByText('XYZ Tecnologia SA')).toBeInTheDocument();
    expect(screen.getByText('Serviços Gerais ME')).toBeInTheDocument();
  });

  it('shows fornecedor details formatted correctly', async () => {
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('contato@abc.com')).toBeInTheDocument();
    });

    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument();
    expect(screen.getByText('Matéria Prima')).toBeInTheDocument();
  });

  it('filters by status (ativo/inativo)', async () => {
    const user = userEvent.setup();
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    await user.click(statusFilter);
    await user.click(screen.getByText('Inativos'));

    expect(fornecedoresService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ ativo: false })
    );
  });

  it('filters by categoria', async () => {
    const user = userEvent.setup();
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    const categoriaFilter = screen.getByRole('combobox', { name: /categoria/i });
    await user.click(categoriaFilter);
    await user.click(screen.getByText('Tecnologia'));

    expect(fornecedoresService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ categoria: 'Tecnologia' })
    );
  });

  it('searches by name or CNPJ', async () => {
    const user = userEvent.setup();
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await user.type(searchInput, 'ABC');

    await waitFor(() => {
      expect(fornecedoresService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'ABC' })
      );
    });
  });

  it('opens create modal when clicking add button', async () => {
    const user = userEvent.setup();
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /novo fornecedor/i });
    await user.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/cadastrar fornecedor/i)).toBeInTheDocument();
  });

  it('creates new fornecedor successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(fornecedoresService.create).mockResolvedValue({
      id: '4',
      razao_social: 'Novo Fornecedor Ltda',
    });

    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    // Open modal
    const addButton = screen.getByRole('button', { name: /novo fornecedor/i });
    await user.click(addButton);

    // Fill form
    await user.type(screen.getByLabelText(/razão social/i), 'Novo Fornecedor Ltda');
    await user.type(screen.getByLabelText(/cnpj/i), '11.111.111/0001-11');
    await user.type(screen.getByLabelText(/email/i), 'novo@fornecedor.com');

    // Submit
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fornecedoresService.create).toHaveBeenCalled();
    });
  });

  it('validates CNPJ format', async () => {
    const user = userEvent.setup();
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /novo fornecedor/i });
    await user.click(addButton);

    await user.type(screen.getByLabelText(/cnpj/i), '123');

    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cnpj inválido/i)).toBeInTheDocument();
    });
  });

  it('deletes fornecedor with confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(fornecedoresService.delete).mockResolvedValue({ success: true });

    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
    await user.click(deleteButtons[0]);

    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(fornecedoresService.delete).toHaveBeenCalledWith('1');
    });
  });

  it('shows banking info for fornecedor', async () => {
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    expect(screen.getByText('Banco do Brasil')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument(); // Agência
  });

  it('exports fornecedores to CSV', async () => {
    const user = userEvent.setup();
    vi.mocked(fornecedoresService.exportToCSV).mockResolvedValue('/exports/fornecedores.csv');

    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /exportar/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(fornecedoresService.exportToCSV).toHaveBeenCalled();
    });
  });

  it('displays stats cards', async () => {
    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // Ativos
    expect(screen.getByText('R$ 150.000,00')).toBeInTheDocument(); // Total pago
  });

  it('shows contas a pagar for fornecedor', async () => {
    const user = userEvent.setup();
    vi.mocked(fornecedoresService.getById).mockResolvedValue({
      ...mockFornecedores[0],
      contas_pagar: [
        { id: '1', descricao: 'Compra matéria prima', valor: 5000, status: 'pendente' },
      ],
    });

    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor ABC Ltda')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('button', { name: /ver/i });
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Compra matéria prima')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    vi.mocked(fornecedoresService.getAll).mockRejectedValue(new Error('Network error'));

    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    });
  });

  it('paginates results', async () => {
    const user = userEvent.setup();
    const manyFornecedores = Array.from({ length: 25 }, (_, i) => ({
      ...mockFornecedores[0],
      id: String(i + 1),
      razao_social: `Fornecedor ${i + 1}`,
    }));

    vi.mocked(fornecedoresService.getAll).mockResolvedValue(manyFornecedores);

    render(<FornecedoresPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Fornecedor 1')).toBeInTheDocument();
    });

    const nextPageButton = screen.getByRole('button', { name: /próxima/i });
    await user.click(nextPageButton);

    expect(screen.getByText('Página 2')).toBeInTheDocument();
  });
});
