import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, FileText, Filter, RefreshCcw, Activity, Database, Download, FileSpreadsheet, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToPDF, ExportColumn } from '@/lib/export-utils';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';
import { AuditSecurityAlerts } from '@/components/audit/AuditSecurityAlerts';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { IpMaskToggle } from '@/components/admin/IpMaskToggle';
import { useIpMaskPreference } from '@/hooks/useIpMaskPreference';
import { maskIp } from '@/lib/ip-mask';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT';

interface AuditLog {
  id: string; user_id: string | null; user_email: string | null; action: AuditAction;
  table_name: string | null; record_id: string | null; old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null; details: string | null; ip_address: string | null;
  user_agent: string | null; created_at: string;
}

const actionConfig: Record<AuditAction, { label: string; color: string }> = {
  INSERT: { label: 'Criação', color: 'bg-success/10 text-success border-success/20' },
  UPDATE: { label: 'Atualização', color: 'bg-accent/10 text-accent border-accent/20' },
  DELETE: { label: 'Exclusão', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  LOGIN: { label: 'Login', color: 'bg-primary/10 text-primary border-primary/20' },
  LOGOUT: { label: 'Logout', color: 'bg-muted text-muted-foreground border-border' },
  EXPORT: { label: 'Exportação', color: 'bg-secondary/10 text-secondary border-secondary/20' },
  APPROVE: { label: 'Aprovação', color: 'bg-success/10 text-success border-success/20' },
  REJECT: { label: 'Rejeição', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 7), to: new Date() });

  const isSsoProfileSyncScope = tableFilter === 'sso_profile_sync';

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', actionFilter, tableFilter, userFilter, dateRange],
    queryFn: async () => {
      let query = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500);
      if (actionFilter !== 'all') query = query.eq('action', actionFilter as AuditAction);
      if (tableFilter !== 'all') query = query.eq('table_name', tableFilter);
      if (userFilter !== 'all') query = query.eq('user_email', userFilter);
      if (dateRange?.from) query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      if (dateRange?.to) query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter(log => {
    const term = searchTerm.toLowerCase();
    const matchesTerm = !term
      || log.user_email?.toLowerCase().includes(term)
      || log.details?.toLowerCase().includes(term)
      || log.table_name?.toLowerCase().includes(term);
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
    (logs ?? []).forEach(l => {
      if (l.table_name !== 'sso_profile_sync') return;
      const nd = (l.new_data ?? {}) as Record<string, unknown>;
      const pn = (nd.provider_nome as string | undefined) ?? '';
      if (pn) set.add(pn);
    });
    return [...set].sort();
  }, [logs]);

  const securityAlerts = useMemo(() => {
    if (!logs) return [];
    const alerts: Array<{ id: string; type: 'critical' | 'warning'; title: string; description: string }> = [];
    const deletes = logs.filter(l => l.action === 'DELETE');
    const deletesLast30min = deletes.filter(l => differenceInMinutes(new Date(), new Date(l.created_at)) <= 30);
    if (deletesLast30min.length >= 5) alerts.push({ id: 'mass-delete', type: 'critical', title: 'Exclusões em Massa Detectadas', description: `${deletesLast30min.length} registros excluídos nos últimos 30 minutos` });
    const logins = logs.filter(l => l.action === 'LOGIN' && l.ip_address);
    const loginsByUser = logins.reduce((acc, l) => { if (l.user_email) { if (!acc[l.user_email]) acc[l.user_email] = new Set(); if (l.ip_address) acc[l.user_email].add(l.ip_address); } return acc; }, {} as Record<string, Set<string>>);
    Object.entries(loginsByUser).forEach(([email, ips]) => { if (ips.size >= 3) alerts.push({ id: `multi-ip-${email}`, type: 'warning', title: 'Múltiplos IPs Detectados', description: `Usuário ${email} acessou de ${ips.size} IPs diferentes` }); });
    const roleChanges = logs.filter(l => l.table_name === 'user_roles' && (l.action === 'UPDATE' || l.action === 'INSERT'));
    roleChanges.forEach(log => alerts.push({ id: `role-change-${log.id}`, type: 'warning', title: 'Alteração de Permissões', description: `Permissões alteradas por ${log.user_email || 'Sistema'}` }));
    const rejects = logs.filter(l => l.action === 'REJECT');
    if (rejects.length >= 3) alerts.push({ id: 'multiple-rejects', type: 'warning', title: 'Múltiplas Rejeições', description: `${rejects.length} solicitações rejeitadas no período` });
    return alerts.filter(a => !dismissedAlerts.has(a.id));
  }, [logs, dismissedAlerts]);

  const stats = { total: logs?.length || 0, inserts: logs?.filter(l => l.action === 'INSERT').length || 0, updates: logs?.filter(l => l.action === 'UPDATE').length || 0, deletes: logs?.filter(l => l.action === 'DELETE').length || 0 };
  const uniqueTables = [...new Set(logs?.map(l => l.table_name).filter(Boolean))];
  const uniqueUsers = [...new Set(logs?.map(l => l.user_email).filter(Boolean))];

  const auditColumns: ExportColumn<AuditLog>[] = [
    { key: 'created_at', header: 'Data/Hora', formatter: (v) => typeof v === 'string' ? formatDate(v) + ' ' + format(new Date(v), 'HH:mm:ss') : '-' },
    { key: 'user_email', header: 'Usuário', formatter: (v) => (typeof v === 'string' ? v : null) || 'Sistema' },
    { key: 'action', header: 'Ação', formatter: (v) => typeof v === 'string' ? (actionConfig[v as AuditAction]?.label || v) : String(v) },
    { key: 'table_name', header: 'Tabela', formatter: (v) => typeof v === 'string' ? v : '-' },
    { key: 'details', header: 'Detalhes', formatter: (v) => typeof v === 'string' ? v : '-' },
    { key: 'ip_address', header: 'IP', formatter: (v) => maskIp(typeof v === 'string' ? v : null, maskIpsEnabled) },
  ];

  const handleExportCSV = () => { if (!filteredLogs?.length) { toast.error('Nenhum registro para exportar'); return; } exportToCSV(filteredLogs, auditColumns, 'logs_auditoria'); toast.success('Exportado para CSV com sucesso!'); };
  const handleExportPDF = () => { if (!filteredLogs?.length) { toast.error('Nenhum registro para exportar'); return; } exportToPDF(filteredLogs, auditColumns, 'Logs de Auditoria'); toast.success('PDF gerado para impressão!'); };
  const clearFilters = () => { setSearchTerm(''); setActionFilter('all'); setTableFilter('all'); setUserFilter('all'); setProviderFilter('all'); setSsoFieldFilter('all'); setDateRange({ from: subDays(new Date(), 7), to: new Date() }); };

  const filtersController = useManagedFilters({
    entityType: 'audit-logs',
    defaults: { search: '', action: 'all', table: 'all', user: 'all' },
    localStorageKey: 'audit-logs-filters',
  });
  // Sincroniza state local → controller (para snapshot/persistência)
  useEffect(() => {
    filtersController.setValues({ search: searchTerm, action: actionFilter, table: tableFilter, user: userFilter });
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
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2"><h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1><p className="text-muted-foreground">Histórico completo de ações realizadas no sistema</p></div>
          <Button asChild variant="outline" size="sm"><a href="/admin/sso-jit-events">Ver eventos JIT (SSO)</a></Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total de Registros</p></div></div></CardContent></Card>
          <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><Database className="h-5 w-5 text-success" /></div><div><p className="text-2xl font-bold">{stats.inserts}</p><p className="text-xs text-muted-foreground">Criações</p></div></div></CardContent></Card>
          <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-accent/10"><RefreshCcw className="h-5 w-5 text-accent" /></div><div><p className="text-2xl font-bold">{stats.updates}</p><p className="text-xs text-muted-foreground">Atualizações</p></div></div></CardContent></Card>
          <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><FileText className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.deletes}</p><p className="text-xs text-muted-foreground">Exclusões</p></div></div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50">
          <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2 text-lg"><Filter className="h-5 w-5" />Filtros</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por email, detalhes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
              <Select value={actionFilter} onValueChange={setActionFilter}><SelectTrigger><SelectValue placeholder="Tipo de Ação" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as Ações</SelectItem><SelectItem value="INSERT">Criação</SelectItem><SelectItem value="UPDATE">Atualização</SelectItem><SelectItem value="DELETE">Exclusão</SelectItem><SelectItem value="LOGIN">Login</SelectItem><SelectItem value="LOGOUT">Logout</SelectItem><SelectItem value="EXPORT">Exportação</SelectItem><SelectItem value="APPROVE">Aprovação</SelectItem><SelectItem value="REJECT">Rejeição</SelectItem></SelectContent></Select>
              <Select value={tableFilter} onValueChange={setTableFilter}><SelectTrigger><SelectValue placeholder="Tabela" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as Tabelas</SelectItem>{uniqueTables.map((t) => <SelectItem key={t} value={t!}>{t}</SelectItem>)}</SelectContent></Select>
              <Select value={userFilter} onValueChange={setUserFilter}><SelectTrigger><SelectValue placeholder="Usuário" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os Usuários</SelectItem>{uniqueUsers.map((u) => <SelectItem key={u} value={u!}>{u}</SelectItem>)}</SelectContent></Select>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateRange?.from ? (dateRange.to ? <>{format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}</> : format(dateRange.from, "dd/MM/yyyy")) : <span>Selecionar período</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2} locale={ptBR as unknown as Record<string, unknown>} /></PopoverContent></Popover>
            </div>
            {isSsoProfileSyncScope && (
              <div className="grid gap-4 md:grid-cols-2 mt-4 p-3 rounded-lg border border-primary/30 bg-primary/5">
                <div>
                  <label className="text-xs font-medium text-primary mb-1 block">Provider SSO</label>
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os providers</SelectItem>
                      {uniqueSsoProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-primary mb-1 block">Campo alterado</label>
                  <Select value={ssoFieldFilter} onValueChange={setSsoFieldFilter}>
                    <SelectTrigger><SelectValue placeholder="Campo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os campos</SelectItem>
                      <SelectItem value="full_name">Nome completo</SelectItem>
                      <SelectItem value="avatar_url">Foto de perfil</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
              <ClearFiltersButton
                controller={filtersController}
                entityLabel="logs de auditoria"
                variant="outline"
                describeFilters={(v) => [
                  { label: 'Busca', value: v.search, isActive: !!v.search },
                  { label: 'Ação', value: v.action, isActive: v.action !== 'all' },
                  { label: 'Tabela', value: v.table, isActive: v.table !== 'all' },
                  { label: 'Usuário', value: v.user, isActive: v.user !== 'all' },
                ]}
                label="Limpar Filtros"
              />
              <IpMaskToggle />
            </div>
          </CardContent>
        </Card>

        <AuditSecurityAlerts alerts={securityAlerts} onDismiss={(id) => setDismissedAlerts(prev => new Set([...prev, id]))} />

        {/* Table */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Registros ({filteredLogs?.length || 0})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}><FileSpreadsheet className="h-4 w-4 mr-2" />CSV</Button>
              <Button variant="outline" size="sm" onClick={handleExportPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCcw className="h-4 w-4 mr-2" />Atualizar</Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableShimmerSkeleton rows={10} columns={6} /> : !filteredLogs?.length ? (
              <div className="text-center py-12 text-muted-foreground"><Activity className="h-12 w-12 mx-auto mb-4 opacity-30" /><p>Nenhum registro de auditoria encontrado</p><p className="text-sm mt-1">Ajuste os filtros ou período de busca</p></div>
            ) : <AuditLogTable logs={filteredLogs} />}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
