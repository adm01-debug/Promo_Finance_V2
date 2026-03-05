// @ts-nocheck - Generic table access with dynamic table names
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/database';

// Generic types
type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

// Query options
interface QueryOptions<T> {
  select?: string;
  filter?: Partial<T>;
  orderBy?: { column: keyof T; ascending?: boolean };
  limit?: number;
  offset?: number;
  search?: { column: keyof T; query: string };
}

// Pagination result
interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Generic database service factory
 */
export function createDatabaseService<T extends Record<string, any>>(tableName: string) {
  return {
    /**
     * Get all records with optional filtering
     */
    async getAll(options: QueryOptions<T> = {}): Promise<T[]> {
      let query = supabase.from(tableName).select(options.select || '*');

      // Apply filters
      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply search
      if (options.search) {
        query = query.ilike(
          options.search.column as string,
          `%${options.search.query}%`
        );
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column as string, {
          ascending: options.orderBy.ascending ?? true,
        });
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },

    /**
     * Get paginated records
     */
    async getPaginated(
      page: number = 1,
      pageSize: number = 10,
      options: Omit<QueryOptions<T>, 'limit' | 'offset'> = {}
    ): Promise<PaginatedResult<T>> {
      // Get total count
      let countQuery = supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (options.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            countQuery = countQuery.eq(key, value);
          }
        });
      }

      const { count: totalCount } = await countQuery;

      // Get paginated data
      const offset = (page - 1) * pageSize;
      const data = await this.getAll({
        ...options,
        limit: pageSize,
        offset,
      });

      return {
        data,
        count: totalCount || 0,
        page,
        pageSize,
        totalPages: Math.ceil((totalCount || 0) / pageSize),
      };
    },

    /**
     * Get single record by ID
     */
    async getById(id: string, select?: string): Promise<T | null> {
      const { data, error } = await supabase
        .from(tableName)
        .select(select || '*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as T;
    },

    /**
     * Get single record by field
     */
    async getByField(field: keyof T, value: any, select?: string): Promise<T | null> {
      const { data, error } = await supabase
        .from(tableName)
        .select(select || '*')
        .eq(field as string, value)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as T;
    },

    /**
     * Create new record
     */
    async create(item: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
      const { data, error } = await supabase
        .from(tableName)
        .insert(item as any)
        .select()
        .single();

      if (error) throw error;
      return data as T;
    },

    /**
     * Create multiple records
     */
    async createMany(items: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
      const { data, error } = await supabase
        .from(tableName)
        .insert(items as any[])
        .select();

      if (error) throw error;
      return data as T[];
    },

    /**
     * Update record by ID
     */
    async update(id: string, updates: Partial<T>): Promise<T> {
      const { data, error } = await supabase
        .from(tableName)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as T;
    },

    /**
     * Update multiple records
     */
    async updateMany(filter: Partial<T>, updates: Partial<T>): Promise<T[]> {
      let query = supabase
        .from(tableName)
        .update({ ...updates, updated_at: new Date().toISOString() } as any);

      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error } = await query.select();
      if (error) throw error;
      return data as T[];
    },

    /**
     * Delete record by ID
     */
    async delete(id: string): Promise<void> {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },

    /**
     * Delete multiple records
     */
    async deleteMany(ids: string[]): Promise<void> {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);

      if (error) throw error;
    },

    /**
     * Soft delete (update status)
     */
    async softDelete(id: string): Promise<T> {
      return this.update(id, { status: 'deleted', deleted_at: new Date().toISOString() } as Partial<T>);
    },

    /**
     * Check if record exists
     */
    async exists(id: string): Promise<boolean> {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) throw error;
      return (count || 0) > 0;
    },

    /**
     * Count records
     */
    async count(filter?: Partial<T>): Promise<number> {
      let query = supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },

    /**
     * Upsert record
     */
    async upsert(item: T, onConflict?: string): Promise<T> {
      const { data, error } = await supabase
        .from(tableName)
        .upsert(item as any, { onConflict })
        .select()
        .single();

      if (error) throw error;
      return data as T;
    },

    /**
     * Subscribe to changes
     */
    subscribe(callback: (payload: { eventType: string; new: T; old: T }) => void) {
      const channel = supabase
        .channel(`${tableName}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          (payload) => {
            callback({
              eventType: payload.eventType,
              new: payload.new as T,
              old: payload.old as T,
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
  };
}

// Type-safe service instances (will be properly typed when database types are generated)
export const contasPagarService = createDatabaseService<any>('contas_pagar');
export const contasReceberService = createDatabaseService<any>('contas_receber');
export const clientesService = createDatabaseService<any>('clientes');
export const fornecedoresService = createDatabaseService<any>('fornecedores');
export const categoriasService = createDatabaseService<any>('categorias');
export const transacoesService = createDatabaseService<any>('transacoes');
