import { useMemo } from 'react';
import { ShieldCheck, Search, Brain, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { useManagedFilters } from '@/hooks/useManagedFilters';
import { ClearFiltersButton } from '@/components/filters/ClearFiltersButton';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExportMenu } from '@/components/ui/export-menu';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useAuditoriaIA, type AuditoriaIARow } from '@/hooks/useAuditoriaIA';

function formatCnpj(cnpj: string | null): string {
  if (!cnpj) return '—';
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14) return cnpj;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export default function AuditoriaIA() {
  const { data: rows = [], isLoading } = useAuditoriaIA();
  const filtersController = useManagedFilters<{
    userFilter: string;
    cnpjFilter: string;
    transacaoFilter: string;
    acaoFilter: 'all' | 'aprovado' | 'rejeitado';
  }>({
    entityType: 'auditoria-ia',
    defaults: { userFilter: '', cnpjFilter: '', transacaoFilter: '', acaoFilter: 'all' },
    localStorageKey: 'app-auditoria-ia-filters',
  });
  const { userFilter, cnpjFilter, transacaoFilter, acaoFilter } = filtersController.values;
  const setUserFilter = (v: string) => filtersController.setField('userFilter', v);
  const setCnpjFilter = (v: string) => filtersController.setField('cnpjFilter', v);
  const setTransacaoFilter = (v: string) => filtersController.setField('transacaoFilter', v);
  const setAcaoFilter = (v: 'all' | 'aprovado' | 'rejeitado') => filtersController.setField('acaoFilter', v);

  const usuarios = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.aprovado_por) {
        map.set(r.aprovado_por, r.user_full_name || r.user_email || r.aprovado_por.slice(0, 8));
      }
    });
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [rows]);

  const filtered = useMemo(() => {
    const userTerm = userFilter.trim().toLowerCase();
    const cnpjTerm = cnpjFilter.replace(/\D/g, '');
    const txTerm = transacaoFilter.trim().toLowerCase();
    return rows.filter((r) => {
      if (acaoFilter !== 'all' && r.acao !== acaoFilter) return false;
      if (userTerm) {
        const haystack = [r.aprovado_por, r.user_email, r.user_full_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(userTerm)) return false;
      }
      if (cnpjTerm) {
        const cnpjDigits = (r.empresa_cnpj || '').replace(/\D/g, '');
        if (!cnpjDigits.includes(cnpjTerm)) return false;
      }
      if (txTerm) {
        const haystack = [r.transacao_bancaria_id, r.transacao_descricao]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(txTerm)) return false;
      }
      return true;
    });
  }, [rows, userFilter, cnpjFilter, transacaoFilter, acaoFilter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const aprovados = filtered.filter((r) => r.acao === 'aprovado').length;
    const rejeitados = total - aprovados;
    const comMotivo = filtered.filter((r) => r.acao === 'rejeitado' && (r.motivo_rejeicao || '').trim()).length;
    return { total, aprovados, rejeitados, comMotivo };
  }, [filtered]);

  const exportData = filtered.map((r) => ({
    data: formatDate(r.created_at),
    usuario: r.user_full_name || r.user_email || r.aprovado_por || '—',
    cnpj: formatCnpj(r.empresa_cnpj),
    empresa: r.empresa_razao_social || '—',
    transacao_id: r.transacao_bancaria_id || '—',
    transacao_descricao: r.transacao_descricao || '—',
    valor: r.transacao_valor != null ? formatCurrency(r.transacao_valor) : '—',
    acao: r.acao,
    score: Math.round(r.score_ia),
    confianca: r.confianca,
    tipo: r.tipo_lancamento,
    motivo_rejeicao: r.motivo_rejeicao || '',
  }));

  const hasFilters = filtersController.hasActive;

  return (
    <ProtectedRoute requiredRoles={['admin', 'financeiro']}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">Auditoria da IA</h1>
              <p className="text-sm text-muted-foreground">
                Trilha de decisões de Conciliação Inteligente — filtre por usuário, CNPJ ou transação
              </p>
            </div>
          </div>
          {filtered.length > 0 && (
            <ExportMenu
              data={exportData}
              columns={[
                { header: 'Data', key: 'data' },
                { header: 'Usuário', key: 'usuario' },
                { header: 'CNPJ', key: 'cnpj' },
                { header: 'Empresa', key: 'empresa' },
                { header: 'Transação ID', key: 'transacao_id' },
                { header: 'Descrição', key: 'transacao_descricao' },
                { header: 'Valor', key: 'valor' },
                { header: 'Ação', key: 'acao' },
                { header: 'Score', key: 'score' },
                { header: 'Confiança', key: 'confianca' },
                { header: 'Tipo', key: 'tipo' },
                { header: 'Motivo Rejeição', key: 'motivo_rejeicao' },
              ]}
              filename="auditoria-ia"
              title="Auditoria IA"
            />
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total decisões</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Aprovadas</p>
              <p className="text-2xl font-bold text-success">{stats.aprovados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Rejeitadas</p>
              <p className="text-2xl font-bold text-destructive">{stats.rejeitados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Rejeições com motivo</p>
              <p className="text-2xl font-bold text-primary">{stats.comMotivo}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            <CardDescription>Combine os filtros para refinar a busca</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="f-user">Usuário</Label>
                {usuarios.length > 0 ? (
                  <Select
                    value={userFilter || 'all'}
                    onValueChange={(v) => setUserFilter(v === 'all' ? '' : v)}
                  >
                    <SelectTrigger id="f-user">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {usuarios.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="f-user"
                    placeholder="Email, nome ou ID"
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-cnpj">CNPJ</Label>
                <Input
                  id="f-cnpj"
                  placeholder="00.000.000/0000-00"
                  value={cnpjFilter}
                  onChange={(e) => setCnpjFilter(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-tx">Transação</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                  <Input
                    id="f-tx"
                    className="pl-8"
                    placeholder="ID ou descrição"
                    value={transacaoFilter}
                    onChange={(e) => setTransacaoFilter(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="f-acao">Ação</Label>
                <Select value={acaoFilter} onValueChange={(v) => setAcaoFilter(v as typeof acaoFilter)}>
                  <SelectTrigger id="f-acao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="aprovado">Aprovadas</SelectItem>
                    <SelectItem value="rejeitado">Rejeitadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {hasFilters && (
              <div className="mt-3 flex justify-end">
                <ClearFiltersButton
                  controller={filtersController}
                  entityLabel="auditoria da IA"
                  describeFilters={(v) => [
                    { label: 'Usuário', value: v.userFilter, isActive: !!v.userFilter },
                    { label: 'CNPJ', value: v.cnpjFilter, isActive: !!v.cnpjFilter },
                    { label: 'Transação', value: v.transacaoFilter, isActive: !!v.transacaoFilter },
                    { label: 'Ação', value: v.acaoFilter, isActive: v.acaoFilter !== 'all' },
                  ]}
                  label="Limpar filtros"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trilha de decisões</CardTitle>
            <CardDescription>
              {isLoading ? 'Carregando…' : `${filtered.length} de ${rows.length} registros`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Nenhum registro encontrado</p>
                <p className="text-sm">Ajuste os filtros para ampliar a busca.</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px] pr-2">
                <div className="space-y-3">
                  {filtered.map((r) => (
                    <AuditRow key={r.id} row={r} />
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}

function AuditRow({ row }: { row: AuditoriaIARow }) {
  const isReject = row.acao === 'rejeitado';
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Badge variant={isReject ? 'destructive' : 'default'} className="gap-1">
          {isReject ? <XCircle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {row.acao}
        </Badge>
        <Badge variant="outline" className="text-xs">Score: {Math.round(row.score_ia)}</Badge>
        <Badge variant="outline" className="text-xs">Confiança: {row.confianca}</Badge>
        <Badge variant="outline" className="text-xs capitalize">{row.tipo_lancamento}</Badge>
        <span className="text-xs text-muted-foreground ml-auto">{formatDate(row.created_at)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Usuário</p>
          <p className="font-medium truncate">{row.user_full_name || row.user_email || '—'}</p>
          {row.user_email && row.user_full_name && (
            <p className="text-xs text-muted-foreground truncate">{row.user_email}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Empresa / CNPJ</p>
          <p className="font-medium truncate">{row.empresa_razao_social || '—'}</p>
          <p className="text-xs text-muted-foreground">{formatCnpj(row.empresa_cnpj)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Transação bancária</p>
          <p className="font-medium truncate" title={row.transacao_descricao || ''}>
            {row.transacao_descricao || '—'}
          </p>
          <p className="text-xs text-muted-foreground font-mono truncate" title={row.transacao_bancaria_id || ''}>
            {row.transacao_bancaria_id || 'sem ID'}
            {row.transacao_valor != null && ` • ${formatCurrency(row.transacao_valor)}`}
          </p>
        </div>
      </div>

      {isReject && row.motivo_rejeicao && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-2">
          <p className="text-xs font-medium text-destructive mb-1">Motivo da rejeição</p>
          <p className="text-sm">{row.motivo_rejeicao}</p>
        </div>
      )}

      {row.analise_ia && (
        <div className="mt-2 rounded bg-muted/40 p-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Análise IA</p>
          <p className="text-xs">{row.analise_ia}</p>
        </div>
      )}
    </div>
  );
}
