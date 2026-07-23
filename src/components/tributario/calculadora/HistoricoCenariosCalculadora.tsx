import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { History } from 'lucide-react';

const BRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

interface Row {
  id: string;
  data_simulacao: string;
  regime_atual: string | null;
  regime_recomendado: string;
  economia_anual_estimada: number | null;
}

export function HistoricoCenariosCalculadora({ empresaId }: { empresaId?: string }) {
  const { data = [] } = useQuery({
    queryKey: ['calculadora-historico', empresaId],
    enabled: !!empresaId,
    queryFn: async (): Promise<Row[]> => {
      const { data } = await supabase
        .from('regimes_simulados')
        .select('id, data_simulacao, regime_atual, regime_recomendado, economia_anual_estimada, parametros')
        .eq('empresa_id', empresaId!)
        .contains('parametros', { tipo_calculo: 'calculadora' })
        .order('data_simulacao', { ascending: false })
        .limit(20);
      return (data ?? []) as Row[];
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="h-4 w-4" /> Histórico de cenários salvos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[260px]">
          {data.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">Nenhum cenário salvo ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((r) => (
                <li key={r.id} className="p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {new Date(r.data_simulacao).toLocaleString('pt-BR')}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {r.regime_recomendado}
                    </Badge>
                  </div>
                  <div className="text-muted-foreground">
                    Atual: {r.regime_atual ?? '—'} · Economia:{' '}
                    <span className="text-success font-medium">
                      {BRL(r.economia_anual_estimada ?? 0)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
