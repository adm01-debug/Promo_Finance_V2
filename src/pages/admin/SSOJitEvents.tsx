import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, Filter, RefreshCcw, Activity, Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { exportToCSV, exportToPDF, ExportColumn } from '@/lib/export-utils';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { useSSOJitEvents, JitAuditEvent } from '@/hooks/useSSOJitEvents';
import { useSSOProviders } from '@/hooks/useSSO';
import { SSOJitEventsKPIs } from '@/components/audit/jit/SSOJitEventsKPIs';
import { SSOJitEventsTable } from '@/components/audit/jit/SSOJitEventsTable';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';

interface SSOJitFilters extends Record<string, unknown> {
  fromIso: string;
  toIso: string;
  search: string;
  providerFilter: string;
  roleFilter: string;
  viaFilter: string;
  originFilter: string;
}

const SSO_DEFAULTS: SSOJitFilters = {
  fromIso: subDays(new Date(), 30).toISOString(),
  toIso: new Date().toISOString(),
  search: '',
  providerFilter: 'all',
  roleFilter: 'all',
  viaFilter: 'all',
  originFilter: 'all',
};

export default function SSOJitEvents() {
  const filtersController = useManagedFilters<SSOJitFilters>({
    entityType: 'sso-jit-events',
    defaults: SSO_DEFAULTS,
    localStorageKey: 'app-sso-jit-filters',
  });
  const { fromIso, toIso, search, providerFilter, roleFilter, viaFilter, originFilter } = filtersController.values;
  const dateRange: DateRange | undefined = fromIso || toIso
    ? { from: fromIso ? new Date(fromIso) : undefined, to: toIso ? new Date(toIso) : undefined }
    : undefined;
  const setDateRange = (r: DateRange | undefined) => {
    filtersController.setValues({
      ...filtersController.values,
      fromIso: r?.from ? r.from.toISOString() : '',
      toIso: r?.to ? r.to.toISOString() : '',
    });
  };
  const setSearch = (v: string) => filtersController.setField('search', v);
  const setProviderFilter = (v: string) => filtersController.setField('providerFilter', v);
  const setRoleFilter = (v: string) => filtersController.setField('roleFilter', v);
  const setViaFilter = (v: string) => filtersController.setField('viaFilter', v);
  const setOriginFilter = (v: string) => filtersController.setField('originFilter', v);

  const { data: events, isLoading, refetch } = useSSOJitEvents({
    from: dateRange?.from,
    to: dateRange?.to,
  });
  const { data: providers } = useSSOProviders();

  const filtered = useMemo<JitAuditEvent[]>(() => {
    if (!events) return [];
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      const nd = e.new_data ?? {};
      if (providerFilter !== 'all' && nd.provider_id !== providerFilter) return false;
      if (roleFilter !== 'all' && nd.role !== roleFilter) return false;
      if (viaFilter !== 'all' && nd.via !== viaFilter) return false;
      if (originFilter === 'group' && !nd.matched_group) return false;
      if (originFilter === 'default' && nd.matched_group) return false;
      if (term) {
        const hay = [
          e.user_email,
          e.details,
          nd.provider_nome,
          nd.provider_id,
          nd.provider_tipo,
          nd.matched_group,
          nd.role,
          nd.default_role,
          nd.via,
          nd.empresa_id,
          ...(nd.groups_received ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [events, search, providerFilter, roleFilter, viaFilter, originFilter]);

  const columns: ExportColumn<JitAuditEvent>[] = [
    {
      key: 'created_at',
      header: 'Data/Hora',
      formatter: (v) => (typeof v === 'string' ? `${formatDate(v)} ${format(new Date(v), 'HH:mm:ss')}` : '-'),
    },
    { key: 'user_email', header: 'Usuário', formatter: (v) => (typeof v === 'string' ? v : '-') },
    { key: 'new_data.provider_nome', header: 'Provider', formatter: (v) => (typeof v === 'string' ? v : '-') },
    { key: 'new_data.provider_tipo', header: 'Tipo', formatter: (v) => (typeof v === 'string' ? v.toUpperCase() : '-') },
    { key: 'new_data.role', header: 'Role', formatter: (v) => (typeof v === 'string' ? v : '-') },
    { key: 'new_data.matched_group', header: 'Grupo Casado', formatter: (v) => (typeof v === 'string' ? v : '(default)') },
    { key: 'new_data.via', header: 'Via', formatter: (v) => (typeof v === 'string' ? v : '-') },
    {
      key: 'new_data.groups_received',
      header: 'Grupos Recebidos',
      formatter: (v) => (Array.isArray(v) ? v.join('; ') : '-'),
    },
    { key: 'ip_address', header: 'IP', formatter: (v) => (typeof v === 'string' ? v : '-') },
  ];

  const handleCSV = () => {
    if (!filtered.length) return toast.error('Nenhum evento para exportar');
    exportToCSV(filtered, columns, 'eventos_jit_sso');
    toast.success('Exportado para CSV');
  };
  const handlePDF = () => {
    if (!filtered.length) return toast.error('Nenhum evento para exportar');
    exportToPDF(filtered, columns, 'Eventos JIT de Provisionamento SSO');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Eventos JIT de Provisionamento SSO</h1>
          </div>
          <p className="text-muted-foreground">
            Auditoria de usuários criados automaticamente via SSO (Just-In-Time), com role aplicada e grupo casado.
          </p>
        </div>

        <SSOJitEventsKPIs events={filtered} />

        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário, provider, ID, role, grupo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os providers</SelectItem>
                  {(providers ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as roles</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="financeiro">financeiro</SelectItem>
                  <SelectItem value="operacional">operacional</SelectItem>
                  <SelectItem value="visualizador">visualizador</SelectItem>
                </SelectContent>
              </Select>
              <Select value={viaFilter} onValueChange={setViaFilter}>
                <SelectTrigger><SelectValue placeholder="Via" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas vias</SelectItem>
                  <SelectItem value="oidc-jit">OIDC</SelectItem>
                  <SelectItem value="saml-broker-jit">SAML</SelectItem>
                </SelectContent>
              </Select>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger><SelectValue placeholder="Origem da role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas origens</SelectItem>
                  <SelectItem value="group">Via grupo mapeado</SelectItem>
                  <SelectItem value="default">Default role</SelectItem>
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal md:col-span-2',
                      !dateRange && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>{format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}</>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      <span>Selecionar período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR as unknown as Record<string, unknown>}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center justify-end mt-4">
              <ClearFiltersButton
                controller={filtersController}
                entityLabel="eventos JIT SSO"
                variant="outline"
                describeFilters={(v) => [
                  { label: 'Busca', value: v.search, isActive: !!v.search },
                  { label: 'Provider', value: v.providerFilter, isActive: v.providerFilter !== 'all' },
                  { label: 'Role', value: v.roleFilter, isActive: v.roleFilter !== 'all' },
                  { label: 'Via', value: v.viaFilter, isActive: v.viaFilter !== 'all' },
                  { label: 'Origem', value: v.originFilter, isActive: v.originFilter !== 'all' },
                  { label: 'Período', value: 'personalizado', isActive: v.fromIso !== SSO_DEFAULTS.fromIso || v.toIso !== SSO_DEFAULTS.toIso },
                ]}
                label="Limpar Filtros"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Eventos ({filtered.length})</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCSV}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handlePDF}>
                <Download className="h-4 w-4 mr-2" />PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCcw className="h-4 w-4 mr-2" />Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableShimmerSkeleton rows={8} columns={8} />
            ) : !filtered.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Nenhum evento JIT encontrado no período</p>
                <p className="text-sm mt-1">
                  JIT só dispara quando <code>auto_provision_users</code> está ativo no provider.
                </p>
              </div>
            ) : (
              <SSOJitEventsTable events={filtered} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
