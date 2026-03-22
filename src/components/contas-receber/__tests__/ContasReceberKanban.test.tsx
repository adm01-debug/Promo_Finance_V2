import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContasReceberKanban } from '../ContasReceberKanban';
import type { ContaReceberWithRelations } from '../ContasReceberTableRow';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }: any) => <div {...props}>{children}</div> },
}));

vi.mock('@/lib/formatters', () => ({
  formatCurrency: (v: number) => `R$ ${v.toFixed(2)}`,
  formatDate: (d: string) => d,
  calculateOverdueDays: () => 5,
}));

const createConta = (overrides: Partial<ContaReceberWithRelations> = {}): ContaReceberWithRelations => ({
  id: `conta-${Math.random()}`,
  cliente_nome: 'Cliente Teste',
  descricao: 'Desc teste',
  valor: 1000,
  valor_recebido: 0,
  data_vencimento: '2025-03-15',
  data_emissao: '2025-03-01',
  status: 'pendente',
  empresa_id: 'emp-1',
  created_by: 'user-1',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  tipo_cobranca: 'boleto',
  etapa_cobranca: null,
  numero_documento: null,
  numero_parcela_atual: null,
  total_parcelas: null,
  valor_desconto: null,
  clientes: null,
  has_protesto: false,
  has_boleto: false,
  ...overrides,
} as any);

describe('ContasReceberKanban', () => {
  // ===== #21: Modo Kanban =====
  describe('Gap #21 - Modo Kanban', () => {
    it('renderiza 4 colunas: Pendente, Vencido, Parcial, Pago', () => {
      render(<ContasReceberKanban contas={[]} onSelectConta={vi.fn()} />);
      expect(screen.getByText('Pendente')).toBeInTheDocument();
      expect(screen.getByText('Vencido')).toBeInTheDocument();
      expect(screen.getByText('Parcial')).toBeInTheDocument();
      expect(screen.getByText('Pago')).toBeInTheDocument();
    });

    it('agrupa contas por status corretamente', () => {
      const contas = [
        createConta({ status: 'pendente', cliente_nome: 'Cliente Pendente' }),
        createConta({ status: 'vencido', cliente_nome: 'Cliente Vencido' }),
        createConta({ status: 'pago', cliente_nome: 'Cliente Pago' }),
        createConta({ status: 'parcial', cliente_nome: 'Cliente Parcial' }),
      ];
      render(<ContasReceberKanban contas={contas} onSelectConta={vi.fn()} />);
      expect(screen.getByText('Cliente Pendente')).toBeInTheDocument();
      expect(screen.getByText('Cliente Vencido')).toBeInTheDocument();
      expect(screen.getByText('Cliente Pago')).toBeInTheDocument();
      expect(screen.getByText('Cliente Parcial')).toBeInTheDocument();
    });

    it('exibe total de itens em cada coluna via badge', () => {
      const contas = [
        createConta({ status: 'pendente' }),
        createConta({ status: 'pendente' }),
        createConta({ status: 'vencido' }),
      ];
      render(<ContasReceberKanban contas={contas} onSelectConta={vi.fn()} />);
      // Badge "2" para pendente
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('exibe total monetário por coluna', () => {
      const contas = [
        createConta({ status: 'pendente', valor: 1000 }),
        createConta({ status: 'pendente', valor: 2000 }),
      ];
      render(<ContasReceberKanban contas={contas} onSelectConta={vi.fn()} />);
      expect(screen.getByText('R$ 3000.00')).toBeInTheDocument();
    });

    it('exibe "Nenhum título" em colunas vazias', () => {
      render(<ContasReceberKanban contas={[]} onSelectConta={vi.fn()} />);
      const emptyMessages = screen.getAllByText('Nenhum título');
      expect(emptyMessages.length).toBe(4);
    });

    it('chama onSelectConta ao clicar em um card', () => {
      const onSelect = vi.fn();
      const contas = [createConta({ status: 'pendente', cliente_nome: 'Click Me' })];
      render(<ContasReceberKanban contas={contas} onSelectConta={onSelect} />);
      fireEvent.click(screen.getByText('Click Me'));
      expect(onSelect).toHaveBeenCalledWith(contas[0]);
    });

    it('exibe descrição e valor no card', () => {
      const contas = [createConta({ status: 'pendente', descricao: 'Consultoria', valor: 5500 })];
      render(<ContasReceberKanban contas={contas} onSelectConta={vi.fn()} />);
      expect(screen.getByText('Consultoria')).toBeInTheDocument();
      // Value appears in card and in column total
      expect(screen.getAllByText('R$ 5500.00').length).toBeGreaterThanOrEqual(1);
    });

    it('exibe dias de atraso em cards vencidos', () => {
      const contas = [createConta({ status: 'vencido' })];
      render(<ContasReceberKanban contas={contas} onSelectConta={vi.fn()} />);
      expect(screen.getByText(/atraso/)).toBeInTheDocument();
    });

    it('não exibe atraso em cards pagos', () => {
      const contas = [createConta({ status: 'pago' })];
      render(<ContasReceberKanban contas={contas} onSelectConta={vi.fn()} />);
      expect(screen.queryByText(/atraso/)).not.toBeInTheDocument();
    });

    it('múltiplos cards em uma coluna renderizam corretamente', () => {
      const contas = Array.from({ length: 10 }, (_, i) =>
        createConta({ status: 'pendente', cliente_nome: `Cliente ${i}`, id: `c-${i}` })
      );
      render(<ContasReceberKanban contas={contas} onSelectConta={vi.fn()} />);
      expect(screen.getByText('10')).toBeInTheDocument(); // badge count
    });
  });
});
