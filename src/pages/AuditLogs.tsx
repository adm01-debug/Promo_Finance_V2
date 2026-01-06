import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InteractivePageWrapper } from '@/components/wrappers';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format, subDays, startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, FileText, Filter, Eye, RefreshCcw, Activity, Database, User, Clock, Download, FileSpreadsheet, ShieldAlert, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToPDF, ExportColumn } from '@/lib/export-utils';
import { TableShimmerSkeleton } from '@/components/ui/loading-skeleton';
import { formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import type { DateRange } from 'react-day-picker';

type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'REJECT';

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: AuditAction;
  table_name: string | null;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  details: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const actionConfig: Record<AuditAction, { label: string; color: string }> = {
  INSERT: { label: 'Criação', color: 'bg-success/10 text-success border-success/20' },
  UPDATE: { label: 'Atualização', color: 'bg-accent/10 text-accent border-accent/20' },
  DELETE: { label: 'Exclusão', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  LOGIN: { label: 'Login', color: 'bg-primary/10 text-primary border-primary/20' },
  LOGOUT: { label: 'Logout', color: 'bg-muted text-muted-foreground border-border' },
  EXPORT: { label: 'Exportação', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  APPROVE: { label: 'Aprovação', color: 'bg-success/10 text-success border-success/20' },
  REJECT: { label: 'Rejeição', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const tableNameLabels: Record<string, string> = {
  contas_pagar: 'Contas a Pagar',
  contas_receber: 'Contas a Receber',
  notas_fiscais: 'Notas Fiscais',
  empresas: 'Empresas',
  clientes: 'Clientes',
  fornecedores: 'Fornecedores',
  contas_bancarias: 'Contas Bancárias',
  centros_custo: 'Centros de Custo',
  user_roles: 'Perfis de Usuário',
  profiles: 'Perfis',
};

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [tableFilter, setTableFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', actionFilter, tableFilter, userFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter as AuditAction);
      }

      if (tableFilter !== 'all') {
        query = query.eq('table_name', tableFilter);
      }

      if (userFilter !== 'all') {
        query = query.eq('user_email', userFilter);
      }

      if (dateRange?.from) {
        query = query.gte('created_at', startOfDay(dateRange.from).toISOString());
      }

      if (dateRange?.to) {
        query = query.lte('created_at', endOfDay(dateRange.to).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  const filteredLogs = logs?.filter(log =>
    log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Detectar alertas de segurança
  const securityAlerts = useMemo(() => {
    if (!logs) return [];
    const alerts: Array<{ id: string; type: 'critical' | 'warning'; title: string; description: string; log: AuditLog }> = [];

    // 1. Múltiplas exclusões em curto período (possível ataque)
    const deletes = logs.filter(l => l.action === 'DELETE');
    const deletesLast30min = deletes.filter(l => 
      differenceInMinutes(new Date(), new Date(l.created_at)) <= 30
    );
    if (deletesLast30min.length >= 5) {
      alerts.push({
        id: 'mass-delete',
        type: 'critical',
        title: 'Exclusões em Massa Detectadas',
        description: `${deletesLast30min.length} registros excluídos nos últimos 30 minutos`,
        log: deletesLast30min[0],
      });
    }

    // 2. Login de mesmo usuário de IPs diferentes
    const logins = logs.filter(l => l.action === 'LOGIN' && l.ip_address);
    const loginsByUser = logins.reduce((acc, l) => {
      if (l.user_email) {
        if (!acc[l.user_email]) acc[l.user_email] = new Set();
        if (l.ip_address) acc[l.user_email].add(l.ip_address);
      }
      return acc;
    }, {} as Record<string, Set<string>>);
    
    Object.entries(loginsByUser).forEach(([email, ips]) => {
      if (ips.size >= 3) {
        alerts.push({
          id: `multi-ip-${email}`,
          type: 'warning',
          title: 'Múltiplos IPs Detectados',
          description: `Usuário ${email} acessou de ${ips.size} IPs diferentes`,
          log: logins.find(l => l.user_email === email)!,
        });
      }
    });

    // 3. Alteração de roles de usuário
    const roleChanges = logs.filter(l => l.table_name === 'user_roles' && (l.action === 'UPDATE' || l.action === 'INSERT'));
    roleChanges.forEach(log => {
      alerts.push({
        id: `role-change-${log.id}`,
        type: 'warning',
        title: 'Alteração de Permissões',
        description: `Permissões alteradas por ${log.user_email || 'Sistema'}`,
        log,
      });
    });

    // 4. Múltiplas falhas ou tentativas suspeitas (se registradas)
    const rejects = logs.filter(l => l.action === 'REJECT');
    if (rejects.length >= 3) {
      alerts.push({
        id: 'multiple-rejects',
        type: 'warning',
        title: 'Múltiplas Rejeições',
        description: `${rejects.length} solicitações rejeitadas no período`,
        log: rejects[0],
      });
    }

    return alerts.filter(a => !dismissedAlerts.has(a.id));
  }, [logs, dismissedAlerts]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const stats = {
    total: logs?.length || 0,
    inserts: logs?.filter(l => l.action === 'INSERT').length || 0,
    updates: logs?.filter(l => l.action === 'UPDATE').length || 0,
    deletes: logs?.filter(l => l.action === 'DELETE').length || 0,
  };

  const uniqueTables = [...new Set(logs?.map(l => l.table_name).filter(Boolean))];
  const uniqueUsers = [...new Set(logs?.map(l => l.user_email).filter(Boolean))];

  // Colunas para exportação
  const auditColumns: ExportColumn<AuditLog>[] = [
    { key: 'created_at', header: 'Data/Hora', formatter: (v) => formatDate(v) + ' ' + format(new Date(v), 'HH:mm:ss') },
    { key: 'user_email', header: 'Usuário', formatter: (v) => v || 'Sistema' },
    { key: 'action', header: 'Ação', formatter: (v) => actionConfig[v as AuditAction]?.label || v },
    { key: 'table_name', header: 'Tabela', formatter: (v) => tableNameLabels[v] || v || '-' },
    { key: 'details', header: 'Detalhes', formatter: (v) => v || '-' },
    { key: 'ip_address', header: 'IP', formatter: (v) => v || '-' },
  ];

  const handleExportCSV = () => {
    if (!filteredLogs?.length) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    exportToCSV(filteredLogs, auditColumns, 'logs_auditoria');
    toast.success('Exportado para CSV com sucesso!');
  };

  const handleExportPDF = () => {
    if (!filteredLogs?.length) {
      toast.error('Nenhum registro para exportar');
      return;
    }
    exportToPDF(filteredLogs, auditColumns, 'Logs de Auditoria');
    toast.success('PDF gerado para impressão!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setTableFilter('all');
    setUserFilter('all');
    setDateRange({ from: subDays(new Date(), 7), to: new Date() });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
          <p className="text-muted-foreground">Histórico completo de ações realizadas no sistema</p>
        </div>

        {/* Stats Cards */}
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
                  {uniqueTables.map((table) => (
                    <SelectItem key={table} value={table!}>
                      {tableNameLabels[table!] || table}
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
                  {uniqueUsers.map((user) => (
                    <SelectItem key={user} value={user!}>
                      {user}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                        </>
                      ) : (
                        format(dateRange.from, "dd/MM/yyyy")
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
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        {securityAlerts.length > 0 && (
          <div className="space-y-3">
            {securityAlerts.map((alert) => (
              <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'} className="relative">
                <div className="flex items-start gap-3">
                  {alert.type === 'critical' ? (
                    <ShieldAlert className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                  <div className="flex-1">
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleDismissAlert(alert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {/* Logs Table */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Registros de Auditoria
                </CardTitle>
                <CardDescription>
                  {filteredLogs?.length || 0} registros encontrados
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  CSV
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
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableShimmerSkeleton rows={8} columns={6} />
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Tabela</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead className="text-right">Visualizar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">
                                {format(new Date(log.created_at), "dd/MM/yyyy")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "HH:mm:ss")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{log.user_email || 'Sistema'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={actionConfig[log.action].color}>
                            {actionConfig[log.action].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {log.table_name ? (tableNameLabels[log.table_name] || log.table_name) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                            {log.details || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Log</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Data/Hora</p>
                                    <p className="text-sm">{format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Usuário</p>
                                    <p className="text-sm">{log.user_email || 'Sistema'}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Ação</p>
                                    <Badge variant="outline" className={actionConfig[log.action].color}>
                                      {actionConfig[log.action].label}
                                    </Badge>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Tabela</p>
                                    <p className="text-sm">{log.table_name ? (tableNameLabels[log.table_name] || log.table_name) : '-'}</p>
                                  </div>
                                  {log.record_id && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">ID do Registro</p>
                                      <p className="text-sm font-mono text-xs">{log.record_id}</p>
                                    </div>
                                  )}
                                  {log.ip_address && (
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">IP</p>
                                      <p className="text-sm font-mono">{log.ip_address}</p>
                                    </div>
                                  )}
                                </div>
                                {log.details && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Detalhes</p>
                                    <p className="text-sm bg-muted p-2 rounded">{log.details}</p>
                                  </div>
                                )}
                                {log.old_data && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Dados Anteriores</p>
                                    <ScrollArea className="h-32 rounded border bg-muted p-2">
                                      <pre className="text-xs">{JSON.stringify(log.old_data, null, 2)}</pre>
                                    </ScrollArea>
                                  </div>
                                )}
                                {log.new_data && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Dados Novos</p>
                                    <ScrollArea className="h-32 rounded border bg-muted p-2">
                                      <pre className="text-xs">{JSON.stringify(log.new_data, null, 2)}</pre>
                                    </ScrollArea>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredLogs?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
