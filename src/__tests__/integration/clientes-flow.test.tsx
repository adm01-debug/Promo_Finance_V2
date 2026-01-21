import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientesPage } from '@/pages/clientes';

// Mock services
vi.mock('@/services/clientes.service', () => ({
  clientesService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
    search: vi.fn(),
    exportToCSV: vi.fn(),
  },
}));

import { clientesService } from '@/services/clientes.service';

const mockClientes = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '11999998888',
    cpf_cnpj: '123.456.789-00',
    tipo: 'PF',
    endereco: 'Rua A, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    ativo: true,
    limite_credito: 10000,
    created_at: '2024-01-01',
  },
  {
    id: '2',
    nome: 'Empresa ABC Ltda',
    email: 'contato@abc.com',
    telefone: '11888887777',
    cpf_cnpj: '12.345.678/0001-90',
    tipo: 'PJ',
    endereco: 'Av B, 456',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '20000-000',
    ativo: true,
    limite_credito: 50000,
    created_at: '2024-01-02',
  },
  {
    id: '3',
    nome: 'Maria Santos',
    email: 'maria@email.com',
    telefone: '11777776666',
    cpf_cnpj: '987.654.321-00',
    tipo: 'PF',
    endereco: 'Rua C, 789',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cep: '30000-000',
    ativo: false,
    limite_credito: 5000,
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

describe('Clientes Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientesService.getAll).mockResolvedValue(mockClientes);
    vi.mocked(clientesService.getStats).mockResolvedValue({
      totalClientes: 3,
      clientesAtivos: 2,
      clientesInativos: 1,
      totalCredito: 65000,
    });
  });

  it('displays clientes list after loading', async () => {
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    expect(screen.getByText('Empresa ABC Ltda')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('shows cliente details formatted correctly', async () => {
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('joao@email.com')).toBeInTheDocument();
    });

    expect(screen.getByText('São Paulo')).toBeInTheDocument();
    expect(screen.getByText('123.456.789-00')).toBeInTheDocument();
  });

  it('filters by status (ativo/inativo)', async () => {
    const user = userEvent.setup();
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const statusFilter = screen.getByRole('combobox', { name: /status/i });
    await user.click(statusFilter);
    await user.click(screen.getByText('Inativos'));

    expect(clientesService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ ativo: false })
    );
  });

  it('filters by tipo (PF/PJ)', async () => {
    const user = userEvent.setup();
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const tipoFilter = screen.getByRole('combobox', { name: /tipo/i });
    await user.click(tipoFilter);
    await user.click(screen.getByText('Pessoa Física'));

    expect(clientesService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'PF' })
    );
  });

  it('searches by name or email', async () => {
    const user = userEvent.setup();
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await user.type(searchInput, 'João');

    await waitFor(() => {
      expect(clientesService.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'João' })
      );
    });
  });

  it('opens create modal when clicking add button', async () => {
    const user = userEvent.setup();
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /novo cliente/i });
    await user.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/cadastrar cliente/i)).toBeInTheDocument();
  });

  it('creates new cliente successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(clientesService.create).mockResolvedValue({
      id: '4',
      nome: 'Novo Cliente',
      email: 'novo@email.com',
    });

    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    // Open modal
    const addButton = screen.getByRole('button', { name: /novo cliente/i });
    await user.click(addButton);

    // Fill form
    await user.type(screen.getByLabelText(/nome/i), 'Novo Cliente');
    await user.type(screen.getByLabelText(/email/i), 'novo@email.com');
    await user.type(screen.getByLabelText(/telefone/i), '11999990000');

    // Submit
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(clientesService.create).toHaveBeenCalled();
    });
  });

  it('opens edit modal for existing cliente', async () => {
    const user = userEvent.setup();
    vi.mocked(clientesService.getById).mockResolvedValue(mockClientes[0]);

    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('deletes cliente with confirmation', async () => {
    const user = userEvent.setup();
    vi.mocked(clientesService.delete).mockResolvedValue({ success: true });

    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
    await user.click(deleteButtons[0]);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(clientesService.delete).toHaveBeenCalledWith('1');
    });
  });

  it('toggles cliente status (activate/deactivate)', async () => {
    const user = userEvent.setup();
    vi.mocked(clientesService.update).mockResolvedValue({
      ...mockClientes[0],
      ativo: false,
    });

    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const toggleButtons = screen.getAllByRole('button', { name: /desativar/i });
    await user.click(toggleButtons[0]);

    await waitFor(() => {
      expect(clientesService.update).toHaveBeenCalledWith('1', { ativo: false });
    });
  });

  it('exports clientes to CSV', async () => {
    const user = userEvent.setup();
    vi.mocked(clientesService.exportToCSV).mockResolvedValue('/exports/clientes.csv');

    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /exportar/i });
    await user.click(exportButton);

    await waitFor(() => {
      expect(clientesService.exportToCSV).toHaveBeenCalled();
    });
  });

  it('validates CPF format for PF', async () => {
    const user = userEvent.setup();
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /novo cliente/i });
    await user.click(addButton);

    await user.type(screen.getByLabelText(/cpf/i), '123');
    
    const submitButton = screen.getByRole('button', { name: /salvar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cpf inválido/i)).toBeInTheDocument();
    });
  });

  it('shows limite de crédito info', async () => {
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
    });

    expect(screen.getByText('R$ 10.000,00')).toBeInTheDocument();
    expect(screen.getByText('R$ 50.000,00')).toBeInTheDocument();
  });

  it('paginates results correctly', async () => {
    const user = userEvent.setup();
    const manyClientes = Array.from({ length: 25 }, (_, i) => ({
      ...mockClientes[0],
      id: String(i + 1),
      nome: `Cliente ${i + 1}`,
    }));

    vi.mocked(clientesService.getAll).mockResolvedValue(manyClientes);

    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Cliente 1')).toBeInTheDocument();
    });

    const nextPageButton = screen.getByRole('button', { name: /próxima/i });
    await user.click(nextPageButton);

    expect(screen.getByText('Página 2')).toBeInTheDocument();
  });

  it('displays stats cards', async () => {
    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // Total clientes
    });

    expect(screen.getByText('2')).toBeInTheDocument(); // Ativos
    expect(screen.getByText('R$ 65.000,00')).toBeInTheDocument(); // Total crédito
  });

  it('shows error message when fetch fails', async () => {
    vi.mocked(clientesService.getAll).mockRejectedValue(new Error('Network error'));

    render(<ClientesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar/i)).toBeInTheDocument();
    });
  });
});
