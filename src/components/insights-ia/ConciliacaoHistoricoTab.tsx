import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Search, History } from 'lucide-react';
import { useHistoricoConciliacaoIA } from '@/hooks/useHistoricoConciliacaoIA';
import { formatDate } from '@/lib/formatters';
import {
  ViewExportButton,
  type ViewExportColumn,
} from '@/components/shared/ViewExportButton';

export function ConciliacaoHistoricoTab() {
  const { feedback, isLoadingFeedback } = useHistoricoConciliacaoIA();
  const [filtro, setFiltro] = useState<'todos' | 'aprovado' | 'rejeitado'>('todos');
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    let lista = feedback;
    if (filtro !== 'todos') lista = lista.filter((f) => f.acao === filtro);
    if (busca.trim()) {
      const t = busca.toLowerCase();
      lista = lista.filter(
        (f) =>
          f.transacao_descricao?.toLowerCase().includes(t) ||
          f.lancamento_entidade?.toLowerCase().includes(t) ||
          f.lancamento_descricao?.toLowerCase().includes(t)
      );
    }
    return lista;
  }, [feedback, filtro, busca]);

  type Row = (typeof filtrados)[number];
  const exportColumns: ViewExportColumn<Row>[] = useMemo(
    () => [
      { key: 'created_at', header: 'Data', accessor: (r) => formatDate(r.created_at) },
      { key: 'acao', header: 'Decisão', accessor: (r) => r.acao },
      { key: 'score', header: 'Score', accessor: (r) => Math.round(r.score_original) },
      { key: 'tipo', header: 'Tipo', accessor: (r) => r.tipo_lancamento },
      { key: 'transacao', header: 'Transação', accessor: (r) => r.transacao_descricao ?? '' },
      { key: 'entidade', header: 'Entidade', accessor: (r) => r.lancamento_entidade ?? '' },
      { key: 'lancamento', header: 'Lançamento', accessor: (r) => r.lancamento_descricao ?? '' },
      { key: 'motivo', header: 'Motivo rejeição', accessor: (r) => r.motivo_rejeicao ?? '' },
    ],
    [],
  );

  const exportMeta = useMemo(
    () => ({
      ordenacao: 'Data (desc)',
      filtros: {
        Decisão: filtro,
        Busca: busca || '—',
      },
    }),
    [filtro, busca],
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Histórico de Conciliações por IA</CardTitle>
              <CardDescription>
                Decisões registradas de matches sugeridos pelo motor de IA
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-7 h-8 w-48"
              />
            </div>
            <Select value={filtro} onValueChange={(v) => setFiltro(v as typeof filtro)}>
              <SelectTrigger className="w-36 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="rejeitado">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <ViewExportButton
              filename="conciliacoes_ia_visualizacao"
              title="Conciliações IA — visualização atual"
              rows={filtrados}
              columns={exportColumns}
              meta={exportMeta}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingFeedback ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum feedback registrado neste filtro</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filtrados.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {f.acao === 'aprovado' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Aprovado
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" /> Rejeitado
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        Score: {Math.round(f.score_original)}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {f.tipo_lancamento}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(f.created_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mt-2">
                      <div className="rounded-md bg-muted/40 p-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Transação</p>
                        <p className="font-medium truncate">{f.transacao_descricao || '—'}</p>
                      </div>
                      <div className="rounded-md bg-muted/40 p-2">
                        <p className="text-xs text-muted-foreground mb-0.5">Lançamento</p>
                        <p className="font-medium truncate">
                          {f.lancamento_entidade}
                          {f.lancamento_descricao ? ` · ${f.lancamento_descricao}` : ''}
                        </p>
                      </div>
                    </div>
                    {f.motivo_rejeicao && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Motivo: {f.motivo_rejeicao}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
