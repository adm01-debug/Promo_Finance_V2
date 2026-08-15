import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { Database } from '@/integrations/supabase/types';

interface AcoesTabProps {
  tarefasAcionaveis: Database['public']['Tables']['elisao_tarefas_acionaveis']['Row'][];
  sincronizarBitrix: { mutate: (id: string) => void; isPending: boolean };
}

export function AcoesTab({ tarefasAcionaveis, sincronizarBitrix }: AcoesTabProps) {
  return (
    <TabsContent value="acoes" className="space-y-4 mt-4">
      {tarefasAcionaveis.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
          Nenhuma tarefa de recuperação ativa.
        </div>
      ) : (
        tarefasAcionaveis.map((t) => (
          <Card key={t.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{t.titulo}</CardTitle>
                <Badge variant={(t.bitrix_sync_status ?? 'pendente') === 'sincronizado' ? 'success' : 'outline'} className="gap-1">
                  {(t.bitrix_sync_status ?? 'pendente') === 'sincronizado' && <CheckCircle2 className="h-3 w-3" />}
                  Bitrix: {(t.bitrix_sync_status ?? 'pendente').replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.descricao}</p>
              <div className="flex items-center justify-between mt-4">
                <div className="text-xs">
                  <span className="text-muted-foreground">Valor em jogo: </span>
                  <span className="font-semibold text-primary">{formatCurrency(t.valor_envolvido)}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2"
                  onClick={() => sincronizarBitrix.mutate(t.id)}
                  disabled={sincronizarBitrix.isPending}
                >
                  <RefreshCw className={`h-4 w-4 ${sincronizarBitrix.isPending && 'animate-spin'}`} />
                  {t.bitrix_task_id ? 'Atualizar no Bitrix24' : 'Criar Tarefa no Bitrix24'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </TabsContent>
  );
}
