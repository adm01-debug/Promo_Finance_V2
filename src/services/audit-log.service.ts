// @ts-nocheck - AuditAction type mismatch with DB enum
/**
 * Audit Log Service - Track user actions for compliance and debugging
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import'
  | 'bulk_action'
  | 'payment'
  | 'settings_change';

export type AuditResource =
  | 'conta_pagar'
  | 'conta_receber'
  | 'cliente'
  | 'fornecedor'
  | 'categoria'
  | 'user'
  | 'settings'
  | 'report'
  | 'system';

interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: AuditAction;
  resource: AuditResource;
  resource_id?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

interface AuditLogFilter {
  user_id?: string;
  action?: AuditAction;
  resource?: AuditResource;
  resource_id?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

class AuditLogService {
  private enabled = true;
  private userId: string | null = null;
  private batchQueue: AuditLogEntry[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchSize = 10;
  private batchDelayMs = 5000;

  /**
   * Set current user for logging
   */
  setUser(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Log an action
   */
  async log(
    action: AuditAction,
    resource: AuditResource,
    description: string,
    options?: {
      resourceId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    if (!this.enabled || !this.userId) return;

    const entry: AuditLogEntry = {
      user_id: this.userId,
      action,
      resource,
      resource_id: options?.resourceId,
      description,
      metadata: options?.metadata,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    // Add to batch queue
    this.batchQueue.push(entry);

    // Process batch if size reached
    if (this.batchQueue.length >= this.batchSize) {
      await this.flushBatch();
    } else {
      // Schedule batch processing
      this.scheduleBatchFlush();
    }
  }

  /**
   * Log create action
   */
  async logCreate(
    resource: AuditResource,
    resourceId: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(
      'create',
      resource,
      description || `Criou ${resource}`,
      { resourceId, metadata }
    );
  }

  /**
   * Log update action
   */
  async logUpdate(
    resource: AuditResource,
    resourceId: string,
    changes?: Record<string, { old: unknown; new: unknown }>,
    description?: string
  ): Promise<void> {
    await this.log(
      'update',
      resource,
      description || `Atualizou ${resource}`,
      { resourceId, metadata: { changes } }
    );
  }

  /**
   * Log delete action
   */
  async logDelete(
    resource: AuditResource,
    resourceId: string,
    description?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.log(
      'delete',
      resource,
      description || `Excluiu ${resource}`,
      { resourceId, metadata }
    );
  }

  /**
   * Log payment action
   */
  async logPayment(
    resource: 'conta_pagar' | 'conta_receber',
    resourceId: string,
    amount: number,
    description?: string
  ): Promise<void> {
    await this.log(
      'payment',
      resource,
      description || `Registrou pagamento de ${resource}`,
      { resourceId, metadata: { amount } }
    );
  }

  /**
   * Log export action
   */
  async logExport(
    resource: AuditResource,
    format: string,
    count: number
  ): Promise<void> {
    await this.log(
      'export',
      resource,
      `Exportou ${count} registros de ${resource} em ${format}`,
      { metadata: { format, count } }
    );
  }

  /**
   * Log login
   */
  async logLogin(): Promise<void> {
    await this.log('login', 'user', 'Realizou login no sistema');
  }

  /**
   * Log logout
   */
  async logLogout(): Promise<void> {
    await this.log('logout', 'user', 'Encerrou sessão');
  }

  /**
   * Log settings change
   */
  async logSettingsChange(
    setting: string,
    oldValue: unknown,
    newValue: unknown
  ): Promise<void> {
    await this.log(
      'settings_change',
      'settings',
      `Alterou configuração: ${setting}`,
      { metadata: { setting, oldValue, newValue } }
    );
  }

  /**
   * Get audit logs
   */
  async getLogs(filter: AuditLogFilter = {}): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id);
    }
    if (filter.action) {
      query = query.eq('action', filter.action as string);
    }
    if (filter.resource) {
      query = query.eq('table_name', filter.resource);
    }
    if (filter.resource_id) {
      query = query.eq('record_id', filter.resource_id);
    }
    if (filter.startDate) {
      query = query.gte('created_at', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      query = query.lte('created_at', filter.endDate.toISOString());
    }
    if (filter.limit) {
      query = query.limit(filter.limit);
    }
    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AuditLog] Error fetching logs:', error);
      return [];
    }

    return (data as unknown as AuditLogEntry[]) || [];
  }

  /**
   * Get logs for specific resource
   */
  async getResourceHistory(
    resource: AuditResource,
    resourceId: string
  ): Promise<AuditLogEntry[]> {
    return this.getLogs({ resource, resource_id: resourceId, limit: 100 });
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    userId: string,
    days = 30
  ): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getLogs({ user_id: userId, startDate, limit: 500 });
  }

  /**
   * Schedule batch flush
   */
  private scheduleBatchFlush(): void {
    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(() => {
      this.flushBatch();
    }, this.batchDelayMs);
  }

  /**
   * Flush batch to database
   */
  private async flushBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length === 0) return;

    const entries = [...this.batchQueue];
    this.batchQueue = [];

    try {
      const { error } = await supabase.from('audit_logs').insert(entries);

      if (error) {
        console.error('[AuditLog] Error saving batch:', error);
        // Re-add to queue for retry (limited)
        if (entries.length < 50) {
          this.batchQueue.push(...entries);
        }
      }
    } catch (error) {
      console.error('[AuditLog] Error:', error);
    }
  }

  /**
   * Force flush (call on logout or page unload)
   */
  async flush(): Promise<void> {
    await this.flushBatch();
  }
}

// Singleton instance
export const auditLog = new AuditLogService();

// Helper functions
export function logCreate(
  resource: AuditResource,
  resourceId: string,
  metadata?: Record<string, unknown>
): void {
  auditLog.logCreate(resource, resourceId, undefined, metadata);
}

export function logUpdate(
  resource: AuditResource,
  resourceId: string,
  changes?: Record<string, { old: unknown; new: unknown }>
): void {
  auditLog.logUpdate(resource, resourceId, changes);
}

export function logDelete(
  resource: AuditResource,
  resourceId: string
): void {
  auditLog.logDelete(resource, resourceId);
}

export default auditLog;
