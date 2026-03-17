import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/formatters';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, History, ArrowRight } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

interface CentroCustoHistoricoProps {
  centroId: string;
  centroNome: string;
}

interface AuditRecord {
  id: string;
  created_at: string;
  operacao: string;
  dados_antigos: Json | null;
  dados_novos: Json | null;
  user_id: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  nome: 'Nome',
  codigo: 'Código',
  descricao: 'Descrição',
  responsavel: 'Responsável',
  orcamento_previsto: 'Orçamento Previsto',
  orcamento_realizado: 'Orçamento Realizado',
  ativo: 'Status',
  parent_id: 'Centro Pai',
};

function getChanges(oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) {
  if (!oldData || !newData) return [];
  const changes: { field: string; old: string; new: string }[] = [];
  const tracked = Object.keys(FIELD_LABELS);

  for (const key of tracked) {
    const oldVal = oldData[key];
    const newVal = newData[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({
        field: FIELD_LABELS[key] || key,
        old: oldVal === null || oldVal === undefined ? '-' : String(oldVal),
        new: newVal === null || newVal === undefined ? '-' : String(newVal),
      });
    }
  }
  return changes;
}

export function CentroCustoHistorico({ centroId, centroNome }: CentroCustoHistoricoProps) {
  const { data: historico = [], isLoading } = useQuery({
    queryKey: ['auditoria_centro_custo', centroId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auditoria_financeira')
        .select('id, created_at, operacao, dados_antigos, dados_novos, user_id')
        .eq('tabela', 'centros_custo')
        .eq('registro_id', centroId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AuditRecord[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum histórico encontrado para "{centroNome}"</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-4">
        {historico.map((item) => {
          const opLabel = item.operacao === 'INSERT' ? 'Criado' : item.operacao === 'UPDATE' ? 'Alterado' : 'Excluído';
          const opColor = item.operacao === 'INSERT' ? 'default' : item.operacao === 'DELETE' ? 'destructive' : 'secondary';
          const changes = item.operacao === 'UPDATE'
            ? getChanges(item.dados_antigos as Record<string, unknown> | null, item.dados_novos as Record<string, unknown> | null)
            : [];

          return (
            <div key={item.id} className="border-l-2 border-muted pl-4 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={opColor} className="text-xs">{opLabel}</Badge>
                <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
              </div>

              {item.operacao === 'INSERT' && (
                <p className="text-sm text-muted-foreground">Centro de custo criado</p>
              )}

              {item.operacao === 'DELETE' && (
                <p className="text-sm text-muted-foreground">Centro de custo removido</p>
              )}

              {changes.length > 0 && (
                <div className="space-y-1 mt-1">
                  {changes.map((c, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs">
                      <span className="font-medium text-foreground">{c.field}:</span>
                      <span className="text-muted-foreground truncate max-w-[100px]">{c.old}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate max-w-[100px]">{c.new}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
