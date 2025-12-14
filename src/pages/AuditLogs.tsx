import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Search, FileText, Filter, Eye, RefreshCcw, Activity, Database, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', actionFilter, tableFilter, dateRange],
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

  const stats = {
    total: logs?.length || 0,
    inserts: logs?.filter(l => l.action === 'INSERT').length || 0,
    updates: logs?.filter(l => l.action === 'UPDATE').length || 0,
    deletes: logs?.filter(l => l.action === 'DELETE').length || 0,
  };

  const uniqueTables = [...new Set(logs?.map(l => l.table_name).filter(Boolean))];

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
          </CardContent>
        </Card>

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
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
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
