import { FileText, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useExtratoBancario } from '@/hooks/useExtratoWebhooks';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface Props {
  contaBancariaId?: string;
}

export function ExtratoBancarioPanel({ contaBancariaId }: Props) {
  const { data: extrato, isLoading } = useExtratoBancario(contaBancariaId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Extrato Bancário</CardTitle>
            <CardDescription>Lançamentos importados via OFX/CSV</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : !extrato || extrato.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum lançamento importado</p>
            <p className="text-xs mt-1">Importe um extrato OFX ou CSV para visualizar</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {extrato.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${item.tipo === 'credito' ? 'bg-success' : 'bg-destructive'}`} />
                  <div>
                    <p className="font-medium text-sm">{item.descricao}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.data)}
                      {item.documento && <span>• Doc: {item.documento}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${item.tipo === 'credito' ? 'text-success' : 'text-destructive'}`}>
                    {item.tipo === 'credito' ? '+' : '-'}{formatCurrency(Math.abs(item.valor))}
                  </span>
                  <Badge variant={item.conciliado ? 'default' : 'outline'} className="text-xs">
                    {item.conciliado ? 'Conciliado' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
