import { RefreshCw, Database, Play, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';

interface Deal {
  id: string; bitrix_deal_id: string | null; descricao: string; cliente_nome: string;
  valor: number; data_vencimento: string; status: string;
}

interface BitrixDealsTabProps {
  deals: Deal[] | undefined;
  isLoading: boolean;
  onSync: () => void;
}

export function BitrixDealsTab({ deals, isLoading, onSync }: BitrixDealsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div><CardTitle>Deals do Bitrix24</CardTitle><CardDescription>Negócios sincronizados como contas a receber</CardDescription></div>
          <Button variant="outline" size="sm" onClick={onSync}><RefreshCw className="h-4 w-4 mr-2" />Sincronizar Deals</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : deals && deals.length > 0 ? (
          <Table>
            <TableHeader><TableRow><TableHead>ID Bitrix</TableHead><TableHead>Descrição</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell><Badge variant="outline" className="font-mono">{deal.bitrix_deal_id}</Badge></TableCell>
                  <TableCell className="font-medium">{deal.descricao}</TableCell>
                  <TableCell>{deal.cliente_nome}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(deal.valor)}</TableCell>
                  <TableCell>{new Date(deal.data_vencimento).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell><Badge variant={deal.status === 'pago' ? 'default' : 'secondary'} className={deal.status === 'pago' ? 'bg-success' : ''}>{deal.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhum deal sincronizado ainda</p>
            <Button variant="outline" className="mt-4" onClick={onSync}><Play className="h-4 w-4 mr-2" />Importar Deals</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
