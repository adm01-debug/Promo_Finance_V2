/**
 * Backup and Restore Service
 * Exportar e importar dados do sistema
 */

import { supabase } from '@/integrations/supabase/client';
import { downloadFile } from '@/lib/file';
import { formatDate } from '@/lib/formatters';

interface BackupData {
  version: string;
  createdAt: string;
  userId: string;
  data: {
    contas_pagar?: unknown[];
    contas_receber?: unknown[];
    clientes?: unknown[];
    fornecedores?: unknown[];
    categorias?: unknown[];
    configuracoes?: unknown;
  };
  metadata: {
    totalRecords: number;
    tables: string[];
  };
}

interface BackupOptions {
  includeTables?: string[];
  excludeTables?: string[];
  startDate?: Date;
  endDate?: Date;
}

interface RestoreOptions {
  merge?: boolean; // Merge with existing data or replace
  skipExisting?: boolean; // Skip records that already exist
  tables?: string[]; // Only restore specific tables
}

interface RestoreResult {
  success: boolean;
  restored: Record<string, number>;
  skipped: Record<string, number>;
  errors: Array<{ table: string; error: string }>;
}

const BACKUP_VERSION = '1.0.0';
const DEFAULT_TABLES = [
  'contas_pagar',
  'contas_receber',
  'clientes',
  'fornecedores',
  'categorias',
];

class BackupRestoreService {
  private userId: string | null = null;

  /**
   * Set current user
   */
  setUser(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Create backup of all data
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupData | null> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    const tables = options.includeTables || DEFAULT_TABLES;
    const excludeTables = options.excludeTables || [];
    const filteredTables = tables.filter((t) => !excludeTables.includes(t));

    const backupData: BackupData = {
      version: BACKUP_VERSION,
      createdAt: new Date().toISOString(),
      userId: this.userId,
      data: {},
      metadata: {
        totalRecords: 0,
        tables: filteredTables,
      },
    };

    try {
      for (const table of filteredTables) {
        const data = await this.fetchTableData(table, options);
        if (data) {
          (backupData.data as Record<string, unknown>)[table] = data;
          backupData.metadata.totalRecords += data.length;
        }
      }

      return backupData;
    } catch (error) {
      console.error('[Backup] Error creating backup:', error);
      return null;
    }
  }

  /**
   * Fetch data from a table
   */
  private async fetchTableData(
    table: string,
    options: BackupOptions
  ): Promise<unknown[] | null> {
    let query = supabase
      .from(table)
      .select('*')
      .eq('user_id', this.userId);

    if (options.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[Backup] Error fetching ${table}:`, error);
      return null;
    }

    return data;
  }

  /**
   * Export backup to file
   */
  async exportBackup(options: BackupOptions = {}): Promise<boolean> {
    const backup = await this.createBackup(options);
    if (!backup) return false;

    const filename = `finance-hub-backup-${formatDate(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    const content = JSON.stringify(backup, null, 2);
    
    downloadFile(content, filename, 'application/json');
    return true;
  }

  /**
   * Export backup as encrypted file
   */
  async exportEncryptedBackup(
    password: string,
    options: BackupOptions = {}
  ): Promise<boolean> {
    const backup = await this.createBackup(options);
    if (!backup) return false;

    try {
      const encrypted = await this.encrypt(JSON.stringify(backup), password);
      const filename = `finance-hub-backup-${formatDate(new Date(), 'yyyy-MM-dd-HHmm')}.enc`;
      
      downloadFile(encrypted, filename, 'application/octet-stream');
      return true;
    } catch (error) {
      console.error('[Backup] Encryption error:', error);
      return false;
    }
  }

  /**
   * Restore from backup data
   */
  async restoreBackup(
    backup: BackupData,
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }

    // Validate backup
    if (!this.validateBackup(backup)) {
      return {
        success: false,
        restored: {},
        skipped: {},
        errors: [{ table: 'all', error: 'Invalid backup format' }],
      };
    }

    const result: RestoreResult = {
      success: true,
      restored: {},
      skipped: {},
      errors: [],
    };

    const tablesToRestore = options.tables || Object.keys(backup.data);

    for (const table of tablesToRestore) {
      const tableData = (backup.data as Record<string, unknown[]>)[table];
      if (!tableData || tableData.length === 0) continue;

      try {
        const { restored, skipped, error } = await this.restoreTable(
          table,
          tableData,
          options
        );

        result.restored[table] = restored;
        result.skipped[table] = skipped;

        if (error) {
          result.errors.push({ table, error });
          result.success = false;
        }
      } catch (error) {
        result.errors.push({
          table,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Restore a single table
   */
  private async restoreTable(
    table: string,
    data: unknown[],
    options: RestoreOptions
  ): Promise<{ restored: number; skipped: number; error?: string }> {
    let restored = 0;
    let skipped = 0;

    // Prepare data - update user_id and remove id for new inserts
    const preparedData = data.map((record: Record<string, unknown>) => {
      const { id, ...rest } = record;
      return {
        ...rest,
        user_id: this.userId,
        // Keep original created_at if merge mode
        created_at: options.merge ? record.created_at : new Date().toISOString(),
      };
    });

    if (!options.merge) {
      // Delete existing data first
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('user_id', this.userId);

      if (deleteError) {
        return { restored: 0, skipped: 0, error: deleteError.message };
      }
    }

    // Insert data in batches
    const batchSize = 100;
    for (let i = 0; i < preparedData.length; i += batchSize) {
      const batch = preparedData.slice(i, i + batchSize);
      
      if (options.skipExisting && options.merge) {
        // Use upsert
        const { data: inserted, error } = await supabase
          .from(table)
          .upsert(batch, { onConflict: 'id' })
          .select();

        if (error) {
          return { restored, skipped, error: error.message };
        }
        restored += inserted?.length || 0;
      } else {
        // Simple insert
        const { data: inserted, error } = await supabase
          .from(table)
          .insert(batch)
          .select();

        if (error) {
          return { restored, skipped, error: error.message };
        }
        restored += inserted?.length || 0;
      }
    }

    return { restored, skipped };
  }

  /**
   * Import backup from file
   */
  async importBackup(
    file: File,
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    try {
      const content = await file.text();
      const backup = JSON.parse(content) as BackupData;
      return this.restoreBackup(backup, options);
    } catch (error) {
      return {
        success: false,
        restored: {},
        skipped: {},
        errors: [{ table: 'all', error: 'Failed to parse backup file' }],
      };
    }
  }

  /**
   * Import encrypted backup
   */
  async importEncryptedBackup(
    file: File,
    password: string,
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    try {
      const encrypted = await file.text();
      const decrypted = await this.decrypt(encrypted, password);
      const backup = JSON.parse(decrypted) as BackupData;
      return this.restoreBackup(backup, options);
    } catch (error) {
      return {
        success: false,
        restored: {},
        skipped: {},
        errors: [{ table: 'all', error: 'Failed to decrypt or parse backup' }],
      };
    }
  }

  /**
   * Validate backup structure
   */
  validateBackup(backup: BackupData): boolean {
    if (!backup.version || !backup.createdAt || !backup.data) {
      return false;
    }

    // Check version compatibility
    const [major] = backup.version.split('.');
    const [currentMajor] = BACKUP_VERSION.split('.');
    if (major !== currentMajor) {
      console.warn('[Backup] Version mismatch:', backup.version, 'vs', BACKUP_VERSION);
    }

    return true;
  }

  /**
   * Simple encryption (for demonstration - use proper encryption in production)
   */
  private async encrypt(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate key from password
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );

    // Combine salt + iv + encrypted
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Simple decryption
   */
  private async decrypt(encrypted: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const combined = new Uint8Array(
      atob(encrypted).split('').map((c) => c.charCodeAt(0))
    );

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }
}

// Singleton instance
export const backupService = new BackupRestoreService();

export default backupService;
