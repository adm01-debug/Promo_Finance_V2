import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { format, subDays, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import { exportToCSV, exportToPDF, exportToJSON, ExportColumn } from '@/lib/export-utils';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { useIpMaskPreference } from '@/hooks/useIpMaskPreference';
import { maskIp } from '@/lib/ip-mask';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import type { AuditLog, AuditAction } from './AuditLogs.types';
import { actionConfig } from './AuditLogs.helpers';
import { AuditLogsFiltros } from './AuditLogsFiltros';

export default function AuditLogs() {
  const { enabled: maskIpsEnabled } = useIpMaskPreference();
  const [searchParams] = useSearchParams();
  const initialAction = searchParams.get('action') ?? 'all';
  const initialTable = searchParams.get('table') ?? 'all';
  const initialRecord = searchParams.get('record') ?? '';
  const [searchTerm, setSearchTerm] = useState(initialRecord);
  const [actionFilter, setActionFilter] = useState<string>(initialAction);
  const [tableFilter, setTableFilter] = useState<string>(initialTable);
  const [userFilter, setUserFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [ssoFieldFilter, setSsoFieldFilter] = useState<string>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const isSsoProfileSyncScope = tableFilter === 'sso_profile_sync';

  const {
    data: logs,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['audit-logs', actionFilter, tableFilter, userFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (actionFilter !== 'all') query = query.eq('action', actionFilter);
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter);
      if (userFilter !== 'all') query = query.eq('user_email', userFilter);
      if (dateRange?.from)
        query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      if (dateRange?.to) query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter((log) => {
    const term = searchTerm.toLowerCase();
    const matchesTerm =
      !term ||
      log.user_email?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term) ||
      log.table_name?.toLowerCase().includes(term);
    if (!matchesTerm) return false;
    if (isSsoProfileSyncScope) {
      const nd = (log.new_data ?? {}) as Record<string, unknown>;
      if (providerFilter !== 'all') {
        const pn = (nd.provider_nome as string | undefined) ?? '';
        if (pn !== providerFilter) return false;
      }
      if (ssoFieldFilter !== 'all') {
        const fields = Array.isArray(nd.fields_changed) ? (nd.fields_changed as string[]) : [];
        if (!fields.includes(ssoFieldFilter)) return false;
      }
    }
    return true;
  });

  // Lista de providers derivada apenas dos logs sso_profile_sync já carregados
  const uniqueSsoProviders = useMemo(() => {
    const set = new Set<string>();
    (logs ?? []).forEach((l) => {
      if (l.table_name !== 'sso_profile_sync') return;
      const nd = (l.new_data ?? {}) as Record<string, unknown>;
      const pn = (nd.provider_nome as string | undefined) ?? '';
      if (pn) set.add(pn);
    });
    return [...set].sort();
  }, [logs]);

  const securityAlerts = useMemo(() => {
    if (!logs) return [];
    const alerts: Array<{
      id: string;
      type: 'critical' | 'warning';
      title: string;
      description: string;
    }> = [];
    const deletes = logs.filter((l) => l.action === 'DELETE');
    const deletesLast30min = deletes.filter(
      (l) => differenceInMinutes(new Date(), new Date(l.created_at)) <= 30
    );
    if (deletesLast30min.length >= 5)
      alerts.push({
        id: 'mass-delete',
        type: 'critical',
        title: 'Exclusões em Massa Detectadas',
        description: `${deletesLast30min.length} registros excluídos nos últimos 30 minutos`,
      });
    const logins = logs.filter((l) => l.action === 'LOGIN' && l.ip_address);
    const loginsByUser = logins.reduce(
      (acc, l) => {
        if (l.user_email) {
          if (!acc[l.user_email]) acc[l.user_email] = new Set();
          if (l.ip_address) acc[l.user_email].add(l.ip_address);
        }
        return acc;
      },
      {} as Record<string, Set<string>>
    );
    Object.entries(loginsByUser).forEach(([email, ips]) => {
      if (ips.size >= 3)
        alerts.push({
          id: `multi-ip-${email}`,
          type: 'warning',
          title: 'Múltiplos IPs Detectados',
          description: `Usuário ${email} acessou de ${ips.size} IPs diferentes`,
        });
    });
    const roleChanges = logs.filter(
      (l) => l.table_name === 'user_roles' && (l.action === 'UPDATE' || l.action === 'INSERT')
    );
    roleChanges.forEach((log) =>
      alerts.push({
        id: `role-change-${log.id}`,
        type: 'warning',
        title: 'Alteração de Permissões',
        description: `Permissões alteradas por ${log.user_email || 'Sistema'}`,
      })
    );
    const rejects = logs.filter((l) => l.action === 'REJECT');
    if (rejects.length >= 3)
      alerts.push({
        id: 'multiple-rejects',
        type: 'warning',
        title: 'Múltiplas Rejeições',
        description: `${rejects.length} solicitações rejeitadas no período`,
      });
    return alerts.filter((a) => !dismissedAlerts.has(a.id));
  }, [logs, dismissedAlerts]);

  const stats = {
    total: logs?.length || 0,
    inserts: logs?.filter((l) => l.action === 'INSERT').length || 0,
    updates: logs?.filter((l) => l.action === 'UPDATE').length || 0,
    deletes: logs?.filter((l) => l.action === 'DELETE').length || 0,
  };
  const uniqueTables = [...new Set(logs?.map((l) => l.table_name).filter(Boolean))];
  const uniqueUsers = [...new Set(logs?.map((l) => l.user_email).filter(Boolean))];

  const auditColumns: ExportColumn<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Data/Hora',
      formatter: (v) =>
        typeof v === 'string' ? formatDate(v) + ' ' + format(new Date(v), 'HH:mm:ss') : '-',
    },
    {
      key: 'user_email',
      header: 'Usuário',
      formatter: (v) => (typeof v === 'string' ? v : null) || 'Sistema',
    },
    {
      key: 'action',
      header: 'Ação',
      formatter: (v) =>
        typeof v === 'string' ? actionConfig[v as AuditAction]?.label || v : String(v),
    },
    { key: 'table_name', header: 'Tabela', formatter: (v) => (typeof v === 'string' ? v : '-') },
    { key: 'details', header: 'Detalhes', formatter: (v) => (typeof v === 'string' ? v : '-') },
    {
      key: 'ip_address',
      header: 'IP',
      formatter: (v) => maskIp(typeof v === 'string' ? v : null, maskIpsEnabled),
    },
  ];

  const buildExportMetadata = () => ({
    filtros: {
      busca: searchTerm || null,
      acao: actionFilter,
      tabela: tableFilter,
      usuario: userFilter,
      periodo: {
        de: dateRange?.from ? startOfDay(dateRange.from).toISOString() : null,
        ate: dateRange?.to ? endOfDay(dateRange.to).toISOString() : null,
      },
      ...(isSsoProfileSyncScope ? { provider: providerFilter, campo_sso: ssoFieldFilter } : {}),
    },
    mascarar_ips: maskIpsEnabled,
    gerado_em: new Date().toISOString(),
  });

  const logExportAction = async (
    formato: 'CSV' | 'JSON' | 'PDF' | 'JSON_COMPLETO',
    total: number
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // eslint-disable-next-line local/no-floating-supabase-write -- débito de integridade de escrita, herdado do inventário da Etapa 15
      await supabase.from('audit_logs').insert({
        user_id: user?.id ?? null,
        user_email: user?.email ?? null,
        action: 'EXPORT',
        table_name: 'audit_logs',
        details: `Exportação de trilha de auditoria (${formato}) — ${total} registros`,
        new_data: buildExportMetadata() as never,
      });
    } catch {
      // Falha em log de auditoria não deve bloquear a exportação
    }
  };

  const handleExportCSV = () => {
    if (!filteredLogs?.length) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    exportToCSV(filteredLogs, auditColumns, 'logs_auditoria');
    void logExportAction('CSV', filteredLogs.length);
    toast.success('Exportado para CSV com sucesso!');
  };
  const handleExportPDF = () => {
    if (!filteredLogs?.length) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    exportToPDF(filteredLogs, auditColumns, 'Logs de Auditoria');
    void logExportAction('PDF', filteredLogs.length);
    toast.success('PDF gerado para impressão!');
  };
  const handleExportJSON = () => {
    if (!filteredLogs?.length) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    const sanitized = maskIpsEnabled
      ? filteredLogs.map((l) => ({ ...l, ip_address: maskIp(l.ip_address, true) }))
      : filteredLogs;
    exportToJSON(sanitized, 'logs_auditoria', buildExportMetadata());
    void logExportAction('JSON', sanitized.length);
    toast.success('Exportado para JSON com sucesso!');
  };

  const [isExportingFull, setIsExportingFull] = useState(false);
  const handleExportJSONFull = async () => {
    setIsExportingFull(true);
    const HARD_CAP = 50000;
    const PAGE = 1000;
    const collected: AuditLog[] = [];
    try {
      for (let from = 0; from < HARD_CAP; from += PAGE) {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + PAGE - 1);
        if (actionFilter !== 'all') query = query.eq('action', actionFilter);
        if (tableFilter !== 'all') query = query.eq('table_name', tableFilter);
        if (userFilter !== 'all') query = query.eq('user_email', userFilter);
        if (dateRange?.from)
          query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
        if (dateRange?.to) query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
        const { data, error } = await query;
        if (error) throw error;
        const batch = (data ?? []) as unknown as AuditLog[];
        collected.push(...batch);
        if (batch.length < PAGE) break;
      }
      if (!collected.length) {
        toast.error('Nenhum registro encontrado para o período/filtros');
        return;
      }
      const sanitized = maskIpsEnabled
        ? collected.map((l) => ({ ...l, ip_address: maskIp(l.ip_address, true) }))
        : collected;
      exportToJSON(sanitized, 'logs_auditoria_completo', {
        ...buildExportMetadata(),
        truncado: collected.length >= HARD_CAP,
        limite: HARD_CAP,
      });
      void logExportAction('JSON_COMPLETO', sanitized.length);
      toast.success(`Exportação completa concluída (${sanitized.length} registros)`);
    } catch (e) {
      toast.error(`Falha ao exportar: ${(e as Error).message}`);
    } finally {
      setIsExportingFull(false);
    }
  };

  const filtersController = useManagedFilters({
    entityType: 'audit-logs',
    defaults: { search: '', action: 'all', table: 'all', user: 'all' },
    localStorageKey: 'audit-logs-filters',
  });
  // Sincroniza state local → controller (para snapshot/persistência)
  useEffect(() => {
    filtersController.setValues({
      search: searchTerm,
      action: actionFilter,
      table: tableFilter,
      user: userFilter,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, actionFilter, tableFilter, userFilter]);
  // Sincroniza controller → state local (após clear/undo/hidratação)
  useEffect(() => {
    if (!filtersController.isHydrated) return;
    const v = filtersController.values as Record<string, string>;
    if (v.search !== searchTerm) setSearchTerm(v.search ?? '');
    if (v.action !== actionFilter) setActionFilter(v.action ?? 'all');
    if (v.table !== tableFilter) setTableFilter(v.table ?? 'all');
    if (v.user !== userFilter) setUserFilter(v.user ?? 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersController.values, filtersController.isHydrated]);

  return (
    <MainLayout>
      <AuditLogsFiltros
        stats={stats}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        actionFilter={actionFilter}
        setActionFilter={setActionFilter}
        tableFilter={tableFilter}
        setTableFilter={setTableFilter}
        uniqueTables={uniqueTables}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        uniqueUsers={uniqueUsers}
        dateRange={dateRange}
        setDateRange={setDateRange}
        isSsoProfileSyncScope={isSsoProfileSyncScope}
        providerFilter={providerFilter}
        setProviderFilter={setProviderFilter}
        uniqueSsoProviders={uniqueSsoProviders}
        ssoFieldFilter={ssoFieldFilter}
        setSsoFieldFilter={setSsoFieldFilter}
        filtersController={filtersController}
        securityAlerts={securityAlerts}
        setDismissedAlerts={setDismissedAlerts}
        filteredLogs={filteredLogs}
        handleExportCSV={handleExportCSV}
        handleExportJSON={handleExportJSON}
        handleExportJSONFull={handleExportJSONFull}
        isExportingFull={isExportingFull}
        handleExportPDF={handleExportPDF}
        refetch={refetch}
        isLoading={isLoading}
      />
    </MainLayout>
  );
}
