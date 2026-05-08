import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDivergenciasConciliacao } from '@/hooks/useDivergenciasConciliacao';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';

export function DivergenciasConciliacaoPanel() {
  const { divergencias, isLoading, resolverDivergencia } = useDivergenciasConciliacao();

  if (isLoading) return <div className="p-8 text-center">Carregando divergências...</div>;

  const pendentes = divergencias.filter(d => d.status === 'pendente');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Pendentes</p>
              <p className="text-2xl font-bold">{pendentes.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Audit de Divergências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {divergencias.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Nenhuma divergência encontrada.</div>
          ) : (
            divergencias.map((d) => (
              <div key={d.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={d.status === 'pendente' ? 'destructive' : 'default'}>
                      {d.tipo_divergencia === 'saldo_final' ? 'Saldo de Extrato' : d.tipo_divergencia}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{formatDate(d.created_at)}</span>
                  </div>
                  <p className="font-medium">{d.descricao}</p>
                  <p className="text-sm text-muted-foreground">{d.recomendacao}</p>
                  {d.valor_divergencia !== 0 && (
                    <p className="text-sm font-semibold">
                      Diferença: <span className={d.valor_divergencia > 0 ? "text-success" : "text-destructive"}>
                        {formatCurrency(d.valor_divergencia)}
                      </span>
                    </p>
                  )}
                </div>
                {d.status === 'pendente' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => resolverDivergencia.mutate({ id: d.id, status: 'aceito' })}>
                      Aceitar
                    </Button>
                    <Button size="sm" onClick={() => resolverDivergencia.mutate({ id: d.id, status: 'corrigido' })}>
                      Revisar
                    </Button>
                  </div>
                )}
                {d.status !== 'pendente' && (
                  <Badge variant="outline" className="gap-1">
                    <CheckCircle className="h-3 w-3" /> {d.status === 'aceito' ? 'Aceito' : 'Corrigido'}
                  </Badge>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
