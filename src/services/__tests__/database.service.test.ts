import { describe, it, expect, vi, beforeEach } from 'vitest';
import { databaseService } from '../database.service';

// Mock Supabase
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}));

describe('databaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('returns healthy when database is reachable', async () => {
      mockRpc.mockResolvedValue({
        data: { version: 'PostgreSQL 15.0' },
        error: null,
      });

      const result = await databaseService.healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.latency).toBeDefined();
    });

    it('returns unhealthy when database is unreachable', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Connection refused' },
      });

      const result = await databaseService.healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Connection refused');
    });

    it('includes latency measurement', async () => {
      mockRpc.mockResolvedValue({
        data: { version: 'PostgreSQL 15.0' },
        error: null,
      });

      const result = await databaseService.healthCheck();

      expect(typeof result.latency).toBe('number');
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTableStats', () => {
    it('returns table statistics', async () => {
      mockRpc.mockResolvedValue({
        data: {
          contas_pagar: { count: 100, size: '1MB' },
          contas_receber: { count: 150, size: '1.5MB' },
          clientes: { count: 50, size: '500KB' },
          fornecedores: { count: 30, size: '300KB' },
        },
        error: null,
      });

      const result = await databaseService.getTableStats();

      expect(result.contas_pagar.count).toBe(100);
      expect(result.contas_receber.count).toBe(150);
    });

    it('throws error on failure', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Permission denied' },
      });

      await expect(databaseService.getTableStats())
        .rejects.toThrow('Permission denied');
    });
  });

  describe('backup', () => {
    it('creates backup successfully', async () => {
      mockRpc.mockResolvedValue({
        data: { 
          backup_id: 'backup_123',
          created_at: '2024-01-15T10:00:00Z',
          size: '10MB',
        },
        error: null,
      });

      const result = await databaseService.backup();

      expect(result.backup_id).toBe('backup_123');
      expect(result.size).toBe('10MB');
    });

    it('throws error on backup failure', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Backup failed' },
      });

      await expect(databaseService.backup())
        .rejects.toThrow('Backup failed');
    });
  });

  describe('restore', () => {
    it('restores from backup', async () => {
      mockRpc.mockResolvedValue({
        data: { 
          restored: true,
          backup_id: 'backup_123',
        },
        error: null,
      });

      const result = await databaseService.restore('backup_123');

      expect(result.restored).toBe(true);
    });

    it('throws error on restore failure', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Backup not found' },
      });

      await expect(databaseService.restore('invalid_backup'))
        .rejects.toThrow('Backup not found');
    });
  });

  describe('vacuum', () => {
    it('runs vacuum analyze', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await databaseService.vacuum();

      expect(result.success).toBe(true);
    });
  });

  describe('getConnectionPool', () => {
    it('returns connection pool info', async () => {
      mockRpc.mockResolvedValue({
        data: {
          active: 5,
          idle: 10,
          max: 20,
          waiting: 0,
        },
        error: null,
      });

      const result = await databaseService.getConnectionPool();

      expect(result.active).toBe(5);
      expect(result.idle).toBe(10);
      expect(result.max).toBe(20);
    });
  });

  describe('executeRawQuery', () => {
    it('executes raw SQL query', async () => {
      mockRpc.mockResolvedValue({
        data: [{ count: 100 }],
        error: null,
      });

      const result = await databaseService.executeRawQuery(
        'SELECT COUNT(*) FROM contas_pagar'
      );

      expect(result).toEqual([{ count: 100 }]);
    });

    it('prevents SQL injection', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Invalid query' },
      });

      await expect(
        databaseService.executeRawQuery("'; DROP TABLE users; --")
      ).rejects.toThrow();
    });
  });

  describe('getSlowQueries', () => {
    it('returns slow queries', async () => {
      mockRpc.mockResolvedValue({
        data: [
          { query: 'SELECT * FROM large_table', duration: 5000 },
          { query: 'SELECT * FROM another_table', duration: 3000 },
        ],
        error: null,
      });

      const result = await databaseService.getSlowQueries();

      expect(result).toHaveLength(2);
      expect(result[0].duration).toBe(5000);
    });
  });

  describe('getIndexStats', () => {
    it('returns index statistics', async () => {
      mockRpc.mockResolvedValue({
        data: [
          { name: 'idx_contas_pagar_status', size: '10KB', usage: 95 },
          { name: 'idx_contas_pagar_vencimento', size: '15KB', usage: 80 },
        ],
        error: null,
      });

      const result = await databaseService.getIndexStats();

      expect(result).toHaveLength(2);
      expect(result[0].usage).toBe(95);
    });
  });

  describe('truncateTable', () => {
    it('truncates table with cascade', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true },
        error: null,
      });

      const result = await databaseService.truncateTable('test_table');

      expect(result.success).toBe(true);
    });

    it('throws error for protected tables', async () => {
      await expect(
        databaseService.truncateTable('users')
      ).rejects.toThrow('Cannot truncate protected table');
    });
  });

  describe('getDatabaseSize', () => {
    it('returns database size', async () => {
      mockRpc.mockResolvedValue({
        data: { size: '500MB', formatted: '500 MB' },
        error: null,
      });

      const result = await databaseService.getDatabaseSize();

      expect(result.size).toBe('500MB');
    });
  });

  describe('optimizeTable', () => {
    it('optimizes specific table', async () => {
      mockRpc.mockResolvedValue({
        data: { 
          table: 'contas_pagar',
          before_size: '10MB',
          after_size: '8MB',
        },
        error: null,
      });

      const result = await databaseService.optimizeTable('contas_pagar');

      expect(result.before_size).toBe('10MB');
      expect(result.after_size).toBe('8MB');
    });
  });

  describe('createIndex', () => {
    it('creates index on table', async () => {
      mockRpc.mockResolvedValue({
        data: { 
          index_name: 'idx_new_index',
          created: true,
        },
        error: null,
      });

      const result = await databaseService.createIndex(
        'contas_pagar',
        ['status', 'data_vencimento']
      );

      expect(result.created).toBe(true);
    });

    it('throws error for duplicate index', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Index already exists' },
      });

      await expect(
        databaseService.createIndex('table', ['column'])
      ).rejects.toThrow('Index already exists');
    });
  });

  describe('dropIndex', () => {
    it('drops index from table', async () => {
      mockRpc.mockResolvedValue({
        data: { dropped: true },
        error: null,
      });

      const result = await databaseService.dropIndex('idx_old_index');

      expect(result.dropped).toBe(true);
    });
  });

  describe('migrate', () => {
    it('runs pending migrations', async () => {
      mockRpc.mockResolvedValue({
        data: {
          executed: ['001_create_tables', '002_add_indexes'],
          pending: [],
        },
        error: null,
      });

      const result = await databaseService.migrate();

      expect(result.executed).toHaveLength(2);
      expect(result.pending).toHaveLength(0);
    });

    it('reports pending migrations', async () => {
      mockRpc.mockResolvedValue({
        data: {
          executed: [],
          pending: ['003_add_columns'],
        },
        error: null,
      });

      const result = await databaseService.migrate();

      expect(result.pending).toContain('003_add_columns');
    });
  });

  describe('rollback', () => {
    it('rolls back last migration', async () => {
      mockRpc.mockResolvedValue({
        data: {
          rolled_back: '002_add_indexes',
        },
        error: null,
      });

      const result = await databaseService.rollback();

      expect(result.rolled_back).toBe('002_add_indexes');
    });
  });
});
