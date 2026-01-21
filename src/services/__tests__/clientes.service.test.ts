import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientesService } from '../clientes.service';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          data: [
            {
              id: '1',
              nome: 'Cliente Teste',
              email: 'cliente@teste.com',
              telefone: '11999999999',
              documento: '12345678900',
              ativo: true,
            },
          ],
          error: null,
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '1',
              nome: 'Cliente Teste',
              email: 'cliente@teste.com',
              telefone: '11999999999',
              documento: '12345678900',
              ativo: true,
            },
            error: null,
          })),
          data: [
            {
              id: '1',
              nome: 'Cliente Teste',
              email: 'cliente@teste.com',
              ativo: true,
            },
          ],
          error: null,
        })),
        ilike: vi.fn(() => ({
          data: [
            {
              id: '1',
              nome: 'Cliente Teste',
              email: 'cliente@teste.com',
              ativo: true,
            },
          ],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '2',
              nome: 'Novo Cliente',
              email: 'novo@cliente.com',
              telefone: '11888888888',
              documento: '98765432100',
              ativo: true,
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
                nome: 'Cliente Atualizado',
                email: 'atualizado@cliente.com',
                ativo: true,
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

describe('clientesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all clientes', async () => {
      const result = await clientesService.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Cliente Teste');
    });
  });

  describe('getById', () => {
    it('should return a cliente by id', async () => {
      const result = await clientesService.getById('1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.email).toBe('cliente@teste.com');
    });
  });

  describe('create', () => {
    it('should create a new cliente', async () => {
      const newCliente = {
        nome: 'Novo Cliente',
        email: 'novo@cliente.com',
        telefone: '11888888888',
        documento: '98765432100',
      };
      const result = await clientesService.create(newCliente);
      expect(result).toBeDefined();
      expect(result.nome).toBe('Novo Cliente');
    });
  });

  describe('update', () => {
    it('should update an existing cliente', async () => {
      const updates = {
        nome: 'Cliente Atualizado',
        email: 'atualizado@cliente.com',
      };
      const result = await clientesService.update('1', updates);
      expect(result).toBeDefined();
      expect(result?.nome).toBe('Cliente Atualizado');
    });
  });

  describe('delete', () => {
    it('should delete a cliente', async () => {
      await expect(clientesService.delete('1')).resolves.not.toThrow();
    });
  });

  describe('getAtivos', () => {
    it('should return only active clientes', async () => {
      const result = await clientesService.getAtivos();
      expect(result).toHaveLength(1);
      expect(result[0].ativo).toBe(true);
    });
  });

  describe('search', () => {
    it('should search clientes by term', async () => {
      const result = await clientesService.search('Teste');
      expect(result).toHaveLength(1);
      expect(result[0].nome).toContain('Teste');
    });
  });
});
