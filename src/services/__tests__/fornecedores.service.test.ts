import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fornecedoresService } from '../fornecedores.service';
import type { Fornecedor, FornecedorInput } from '@/types';

// Mock Supabase
const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

const mockFornecedor: Fornecedor = {
  id: '1',
  razao_social: 'Fornecedor ABC Ltda',
  nome_fantasia: 'ABC Materiais',
  cnpj: '12.345.678/0001-90',
  email: 'contato@abc.com',
  telefone: '(11) 3333-3333',
  endereco: {
    cep: '04543-000',
    logradouro: 'Rua Funchal',
    numero: '500',
    bairro: 'Vila Olímpia',
    cidade: 'São Paulo',
    estado: 'SP',
  },
  contato_nome: 'Carlos Silva',
  contato_telefone: '(11) 99999-8888',
  categoria: 'materiais',
  ativo: true,
  observacoes: 'Fornecedor principal',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('fornecedoresService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches all fornecedores', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [mockFornecedor],
          error: null,
        }),
      });
      
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await fornecedoresService.getAll();

      expect(mockFrom).toHaveBeenCalledWith('fornecedores');
      expect(result).toEqual([mockFornecedor]);
    });

    it('fetches with search query', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockFornecedor],
          error: null,
        }),
      };
      
      mockFrom.mockReturnValue(mockQuery);

      await fornecedoresService.getAll({ search: 'ABC' });

      expect(mockQuery.or).toHaveBeenCalled();
    });

    it('fetches only active fornecedores', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockFornecedor],
          error: null,
        }),
      };
      
      mockFrom.mockReturnValue(mockQuery);

      await fornecedoresService.getAll({ ativo: true });

      expect(mockQuery.eq).toHaveBeenCalledWith('ativo', true);
    });

    it('fetches by categoria', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [mockFornecedor],
          error: null,
        }),
      };
      
      mockFrom.mockReturnValue(mockQuery);

      await fornecedoresService.getAll({ categoria: 'materiais' });

      expect(mockQuery.eq).toHaveBeenCalledWith('categoria', 'materiais');
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

      await expect(fornecedoresService.getAll())
        .rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('fetches fornecedor by id', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFornecedor,
              error: null,
            }),
          }),
        }),
      });

      const result = await fornecedoresService.getById('1');

      expect(result).toEqual(mockFornecedor);
    });

    it('returns null for non-existent fornecedor', async () => {
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

      const result = await fornecedoresService.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getByCnpj', () => {
    it('fetches fornecedor by CNPJ', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockFornecedor,
              error: null,
            }),
          }),
        }),
      });

      const result = await fornecedoresService.getByCnpj('12.345.678/0001-90');

      expect(result).toEqual(mockFornecedor);
    });
  });

  describe('create', () => {
    it('creates new fornecedor', async () => {
      const input: FornecedorInput = {
        razao_social: 'Novo Fornecedor Ltda',
        nome_fantasia: 'Novo Fornecedor',
        cnpj: '98.765.432/0001-10',
        email: 'novo@fornecedor.com',
        telefone: '(11) 2222-2222',
      };

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '2', ...input, ativo: true },
              error: null,
            }),
          }),
        }),
      });

      const result = await fornecedoresService.create(input);

      expect(result.razao_social).toBe('Novo Fornecedor Ltda');
      expect(result.ativo).toBe(true);
    });

    it('throws error on duplicate CNPJ', async () => {
      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'duplicate key value violates unique constraint' },
            }),
          }),
        }),
      });

      await expect(fornecedoresService.create({} as FornecedorInput))
        .rejects.toThrow();
    });
  });

  describe('update', () => {
    it('updates existing fornecedor', async () => {
      const updates = { nome_fantasia: 'ABC Novo Nome' };

      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockFornecedor, ...updates },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fornecedoresService.update('1', updates);

      expect(result.nome_fantasia).toBe('ABC Novo Nome');
    });
  });

  describe('delete', () => {
    it('deletes fornecedor by id', async () => {
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      await expect(fornecedoresService.delete('1')).resolves.not.toThrow();
    });
  });

  describe('deactivate', () => {
    it('deactivates fornecedor', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockFornecedor, ativo: false },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await fornecedoresService.deactivate('1');

      expect(result.ativo).toBe(false);
    });
  });

  describe('getContasPagar', () => {
    it('fetches contas a pagar for fornecedor', async () => {
      const mockContas = [
        { id: '1', fornecedor_id: '1', valor: 500, status: 'pendente' },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockContas,
              error: null,
            }),
          }),
        }),
      });

      const result = await fornecedoresService.getContasPagar('1');

      expect(result).toHaveLength(1);
    });
  });

  describe('getStats', () => {
    it('calculates fornecedor statistics', async () => {
      const mockContas = [
        { valor: 500, status: 'pago' },
        { valor: 300, status: 'pago' },
        { valor: 200, status: 'pendente' },
      ];

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: mockContas,
            error: null,
          }),
        }),
      });

      const result = await fornecedoresService.getStats('1');

      expect(result.totalPago).toBe(800);
      expect(result.totalPendente).toBe(200);
    });
  });

  describe('search', () => {
    it('searches fornecedores by term', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [mockFornecedor],
              error: null,
            }),
          }),
        }),
      });

      const result = await fornecedoresService.search('ABC');

      expect(result).toHaveLength(1);
    });
  });

  describe('getCategorias', () => {
    it('returns distinct categorias', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { categoria: 'materiais' },
            { categoria: 'serviços' },
            { categoria: 'equipamentos' },
          ],
          error: null,
        }),
      });

      const result = await fornecedoresService.getCategorias();

      expect(result).toContain('materiais');
      expect(result).toContain('serviços');
    });
  });
});
