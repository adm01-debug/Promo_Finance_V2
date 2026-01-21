import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contasReceberService } from '../contas-receber.service';
import type { ContaReceber, ContaReceberInput } from '@/types';

// Mock Supabase
const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

const mockContaReceber: ContaReceber = {
  id: '1',
  descricao: 'Venda de Produtos',
  valor: 1500.00,
  data_vencimento: '2024-01-20',
  data_recebimento: null,
  status: 'pendente',
  cliente_id: 'c1',
  categoria: 'vendas',
  forma_pagamento: 'boleto',
  observacoes: 'Venda para cliente João',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('contasReceberService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches all contas a receber', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockContaReceber],
          error: null,
        }),
      });
      
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await contasReceberService.getAll();

      expect(mockFrom).toHaveBeenCalledWith('contas_receber');
      expect(result).toEqual([mockContaReceber]);
    });

    it('fetches with status filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockContaReceber],
          error: null,
        }),
      };
      
      mockFrom.mockReturnValue(mockQuery);

      await contasReceberService.getAll({ status: 'pendente' });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pendente');
    });

    it('fetches with date range filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockContaReceber],
          error: null,
        }),
      };
      
      mockFrom.mockReturnValue(mockQuery);

      await contasReceberService.getAll({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('data_vencimento', '2024-01-01');
      expect(mockQuery.lte).toHaveBeenCalledWith('data_vencimento', '2024-01-31');
    });

    it('fetches by cliente', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockContaReceber],
          error: null,
        }),
      };
      
      mockFrom.mockReturnValue(mockQuery);

      await contasReceberService.getAll({ clienteId: 'c1' });

      expect(mockQuery.eq).toHaveBeenCalledWith('cliente_id', 'c1');
    });

    it('throws error on fetch failure', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      await expect(contasReceberService.getAll())
        .rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('fetches conta by id', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockContaReceber,
              error: null,
            }),
          }),
        }),
      });

      const result = await contasReceberService.getById('1');

      expect(result).toEqual(mockContaReceber);
    });

    it('returns null for non-existent conta', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const result = await contasReceberService.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates new conta a receber', async () => {
      const input: ContaReceberInput = {
        descricao: 'Nova Venda',
        valor: 2000.00,
        data_vencimento: '2024-02-01',
        cliente_id: 'c1',
      };

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '2', ...input, status: 'pendente' },
              error: null,
            }),
          }),
        }),
      });

      const result = await contasReceberService.create(input);

      expect(result.descricao).toBe('Nova Venda');
      expect(result.valor).toBe(2000.00);
    });

    it('throws error on validation failure', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Validation failed' },
            }),
          }),
        }),
      });

      await expect(contasReceberService.create({} as ContaReceberInput))
        .rejects.toThrow('Validation failed');
    });
  });

  describe('update', () => {
    it('updates existing conta', async () => {
      const updates = { valor: 1800.00 };

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockContaReceber, ...updates },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await contasReceberService.update('1', updates);

      expect(result.valor).toBe(1800.00);
    });
  });

  describe('delete', () => {
    it('deletes conta by id', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      await expect(contasReceberService.delete('1')).resolves.not.toThrow();
    });
  });

  describe('markAsReceived', () => {
    it('marks conta as received', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockContaReceber,
                  status: 'recebido',
                  data_recebimento: today,
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await contasReceberService.markAsReceived('1');

      expect(result.status).toBe('recebido');
      expect(result.data_recebimento).toBe(today);
    });

    it('marks conta as received with custom date', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  ...mockContaReceber,
                  status: 'recebido',
                  data_recebimento: '2024-01-15',
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await contasReceberService.markAsReceived('1', '2024-01-15');

      expect(result.data_recebimento).toBe('2024-01-15');
    });
  });

  describe('getOverdue', () => {
    it('fetches overdue contas', async () => {
      const overdueContas = [
        { ...mockContaReceber, status: 'atrasado' },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            lt: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: overdueContas,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await contasReceberService.getOverdue();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('atrasado');
    });
  });

  describe('getByCliente', () => {
    it('fetches contas by cliente', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [mockContaReceber],
              error: null,
            }),
          }),
        }),
      });

      const result = await contasReceberService.getByCliente('c1');

      expect(result).toHaveLength(1);
    });
  });

  describe('getTotalByStatus', () => {
    it('calculates total by status', async () => {
      const contas = [
        { ...mockContaReceber, valor: 1000, status: 'pendente' },
        { ...mockContaReceber, id: '2', valor: 2000, status: 'pendente' },
        { ...mockContaReceber, id: '3', valor: 1500, status: 'recebido' },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: contas,
            error: null,
          }),
        }),
      });

      const result = await contasReceberService.getTotalByStatus();

      expect(result.pendente).toBe(3000);
      expect(result.recebido).toBe(1500);
    });
  });

  describe('getDueToday', () => {
    it('fetches contas due today', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [mockContaReceber],
              error: null,
            }),
          }),
        }),
      });

      const result = await contasReceberService.getDueToday();

      expect(result).toHaveLength(1);
    });
  });

  describe('getDueThisWeek', () => {
    it('fetches contas due this week', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [mockContaReceber],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await contasReceberService.getDueThisWeek();

      expect(result).toHaveLength(1);
    });
  });

  describe('bulkUpdate', () => {
    it('updates multiple contas', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      await expect(
        contasReceberService.bulkUpdate(['1', '2'], { status: 'recebido' })
      ).resolves.not.toThrow();
    });
  });

  describe('bulkDelete', () => {
    it('deletes multiple contas', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      await expect(
        contasReceberService.bulkDelete(['1', '2'])
      ).resolves.not.toThrow();
    });
  });

  describe('getSummary', () => {
    it('returns summary statistics', async () => {
      const contas = [
        { valor: 1000, status: 'pendente' },
        { valor: 2000, status: 'recebido' },
        { valor: 500, status: 'atrasado' },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: contas,
          error: null,
        }),
      });

      const result = await contasReceberService.getSummary();

      expect(result.total).toBe(3500);
      expect(result.pendente).toBe(1000);
      expect(result.recebido).toBe(2000);
      expect(result.atrasado).toBe(500);
    });
  });
});
