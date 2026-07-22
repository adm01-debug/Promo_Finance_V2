// @ts-nocheck
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';

export function AlertasTab({ alertas }: { alertas: any[] }) {
  return (
    <TabsContent value="alertas" className="space-y-4 mt-4">
      {alertas.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
          Nenhum alerta de divergência para o período selecionado.
        </div>
      ) : (
        alertas.map((a: any) => (
          <Alert key={a.id} variant={a.severidade === 'alta' ? 'error' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between">
              <span>{a.tipo_divergencia.replace('_', ' ').toUpperCase()}</span>
              <Badge variant="outline" className="text-[10px] uppercase">{a.severidade}</Badge>
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="text-sm">{a.descricao}</p>
              <div className="mt-2 text-[10px] opacity-70">
                Detectado em {new Date(a.created_at).toLocaleString()}
              </div>
            </AlertDescription>
          </Alert>
        ))
      )}
    </TabsContent>
  );
}
