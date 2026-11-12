import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarIcon,
  Search,
  FileText,
  Filter,
  RefreshCcw,
  Activity,
  Database,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import type { DateRange } from 'react-day-picker';
import { AuditSecurityAlerts } from '@/components/audit/AuditSecurityAlerts';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { IpMaskToggle } from '@/components/admin/IpMaskToggle';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import type { AuditLog } from './AuditLogs.types';
import { AuditLogsFiltrosConteudo } from './AuditLogsFiltrosConteudo';

interface AuditLogsFiltrosProps {
  stats: { total: number; inserts: number; updates: number; deletes: number };
  searchTerm: string;
  setSearchTerm: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  actionFilter: string;
  setActionFilter: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  tableFilter: string;
  setTableFilter: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  uniqueTables: string[];
  userFilter: string;
  setUserFilter: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  uniqueUsers: string[];
  dateRange: DateRange;
  setDateRange: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<DateRange>
  >;
  isSsoProfileSyncScope: boolean;
  providerFilter: string;
  setProviderFilter: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  uniqueSsoProviders: string[];
  ssoFieldFilter: string;
  setSsoFieldFilter: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  filtersController: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useManagedFilters').ManagedFiltersController<{
    search: string;
    action: string;
    table: string;
    user: string;
  }>;
  securityAlerts: {
    id: string;
    type: 'critical' | 'warning';
    title: string;
    description: string;
  }[];
  setDismissedAlerts: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      Set<string>
    >
  >;
  filteredLogs: AuditLog[];
  handleExportCSV: () => void;
  handleExportJSON: () => void;
  handleExportJSONFull: () => Promise<void>;
  isExportingFull: boolean;
  handleExportPDF: () => void;
  refetch: (
    options?: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@tanstack/query-core/build/modern/hydration-BlEVG2Lp').aq
  ) => Promise<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@tanstack/query-core/build/modern/hydration-BlEVG2Lp').aH<
      AuditLog[],
      Error
    >
  >;
  isLoading: boolean;
}

export function AuditLogsFiltros({
  stats,
  searchTerm,
  setSearchTerm,
  actionFilter,
  setActionFilter,
  tableFilter,
  setTableFilter,
  uniqueTables,
  userFilter,
  setUserFilter,
  uniqueUsers,
  dateRange,
  setDateRange,
  isSsoProfileSyncScope,
  providerFilter,
  setProviderFilter,
  uniqueSsoProviders,
  ssoFieldFilter,
  setSsoFieldFilter,
  filtersController,
  securityAlerts,
  setDismissedAlerts,
  filteredLogs,
  handleExportCSV,
  handleExportJSON,
  handleExportJSONFull,
  isExportingFull,
  handleExportPDF,
  refetch,
  isLoading,
}: AuditLogsFiltrosProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
          <p className="text-muted-foreground">Histórico completo de ações realizadas no sistema</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/admin/sso-jit-events">Ver eventos JIT (SSO)</a>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total de Registros</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Database className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inserts}</p>
                <p className="text-xs text-muted-foreground">Criações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <RefreshCcw className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.updates}</p>
                <p className="text-xs text-muted-foreground">Atualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deletes}</p>
                <p className="text-xs text-muted-foreground">Exclusões</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, detalhes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="INSERT">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="DELETE">Exclusão</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="EXPORT">Exportação</SelectItem>
                <SelectItem value="APPROVE">Aprovação</SelectItem>
                <SelectItem value="REJECT">Rejeição</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tabela" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Tabelas</SelectItem>
                {uniqueTables.map((t) => (
                  <SelectItem key={t} value={t!}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Usuários</SelectItem>
                {uniqueUsers.map((u) => (
                  <SelectItem key={u} value={u!}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                      </>
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
          {isSsoProfileSyncScope && (
            <AuditLogsFiltrosConteudo
              providerFilter={providerFilter}
              setProviderFilter={setProviderFilter}
              uniqueSsoProviders={uniqueSsoProviders}
              ssoFieldFilter={ssoFieldFilter}
              setSsoFieldFilter={setSsoFieldFilter}
            />
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

      <AuditSecurityAlerts
        alerts={securityAlerts}
        onDismiss={(id) => setDismissedAlerts((prev) => new Set([...prev, id]))}
      />

      {/* Table */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Registros ({filteredLogs?.length || 0})</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJSON}>
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJSONFull}
              disabled={isExportingFull}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExportingFull ? 'Exportando…' : 'JSON completo'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableShimmerSkeleton rows={10} columns={6} />
          ) : !filteredLogs?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum registro de auditoria encontrado</p>
              <p className="text-sm mt-1">Ajuste os filtros ou período de busca</p>
            </div>
          ) : (
            <AuditLogTable logs={filteredLogs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
