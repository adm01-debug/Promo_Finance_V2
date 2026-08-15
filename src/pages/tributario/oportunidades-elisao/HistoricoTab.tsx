import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TabsContent } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/formatters';
import { STATUS_LABEL } from './constants';
import type { Database } from '@/integrations/supabase/types';

interface HistoricoTabProps {
  oportunidadesSalvas: Database['public']['Tables']['oportunidades_elisao']['Row'][];
  atualizarStatus: { mutate: (args: { id: string; status: string }) => void };
}

export function HistoricoTab({ oportunidadesSalvas, atualizarStatus }: HistoricoTabProps) {
  return (
    <TabsContent value="historico" className="space-y-3 mt-4">
      {oportunidadesSalvas.length === 0 ? (
        <Alert>
          <AlertDescription>
            Nenhuma oportunidade salva ainda. Use "Salvar análise" no topo.
          </AlertDescription>
        </Alert>
      ) : (
        oportunidadesSalvas.map((o) => (
          <Card key={o.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{o.categoria || o.estrategia}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Identificada em {new Date(o.data_identificacao).toLocaleDateString('pt-BR')} ·{' '}
                    Economia: {formatCurrency(Number(o.economia_estimada || 0))}
                  </CardDescription>
                </div>
                <Select
                  value={o.status}
                  onValueChange={(v) => atualizarStatus.mutate({ id: o.id, status: v })}
                >
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            {o.observacoes && (
              <CardContent>
                <p className="text-xs whitespace-pre-line text-muted-foreground">{o.observacoes}</p>
              </CardContent>
            )}
          </Card>
        ))
      )}
    </TabsContent>
  );
}
