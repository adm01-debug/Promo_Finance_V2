import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contasPagarService } from '../contas-pagar.service';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            {
              id: '1',
              descricao: 'Conta Teste',
              valor: 100,
              data_vencimento: '2024-01-15',
              status: 'pendente',
            },
          ],
          error: null,
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '1',
              descricao: 'Conta Teste',
              valor: 100,
              data_vencimento: '2024-01-15',
              status: 'pendente',
            },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '2',
              descricao: 'Nova Conta',
              valor: 200,
              data_vencimento: '2024-02-15',
              status: 'pendente',
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: '1',
                descricao: 'Conta Atualizada',
                valor: 150,
                data_vencimento: '2024-01-20',
                status: 'pago',
              },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null,
        })),
      })),
    })),
  },
}));

describe('contasPagarService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all contas a pagar', async () => {
      const result = await contasPagarService.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].descricao).toBe('Conta Teste');
    });
  });

  describe('getById', () => {
    it('should return a conta by id', async () => {
      const result = await contasPagarService.getById('1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });
  });

  describe('create', () => {
    it('should create a new conta', async () => {
      const newConta = {
        descricao: 'Nova Conta',
        valor: 200,
        data_vencimento: '2024-02-15',
        status: 'pendente' as const,
      };
      const result = await contasPagarService.create(newConta);
      expect(result).toBeDefined();
      expect(result.descricao).toBe('Nova Conta');
    });
  });

  describe('update', () => {
    it('should update an existing conta', async () => {
      const updates = {
        descricao: 'Conta Atualizada',
        valor: 150,
        status: 'pago' as const,
      };
      const result = await contasPagarService.update('1', updates);
      expect(result).toBeDefined();
      expect(result?.status).toBe('pago');
    });
  });

  describe('delete', () => {
    it('should delete a conta', async () => {
      await expect(contasPagarService.delete('1')).resolves.not.toThrow();
    });
  });
});
