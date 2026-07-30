import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Send, Scale, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { StatusPedido } from '@/hooks/usePerDcomp';
import type { ReactNode } from 'react';

const STATUS_CONFIG: Record<StatusPedido, { cor: string; icone: ReactNode }> = {
  rascunho: { cor: 'bg-muted text-muted-foreground', icone: <FileText className="h-4 w-4" /> },
  aguardando_transmissao: { cor: 'bg-warning/10 text-warning', icone: <Clock className="h-4 w-4" /> },
  transmitido: { cor: 'bg-primary/10 text-primary', icone: <Send className="h-4 w-4" /> },
  em_analise: { cor: 'bg-secondary text-secondary-foreground', icone: <Clock className="h-4 w-4" /> },
  deferido: { cor: 'bg-success/10 text-success', icone: <CheckCircle2 className="h-4 w-4" /> },
  indeferido: { cor: 'bg-destructive/10 text-destructive', icone: <XCircle className="h-4 w-4" /> },
  cancelado: { cor: 'bg-muted text-muted-foreground', icone: <XCircle className="h-4 w-4" /> },
};

interface Pedido {
  id: string;
  tipo: string;
  tributo_origem: string;
  competencia_origem: string;
  valor_original: number;
  numero_recibo?: string | null;
  status: StatusPedido;
}

interface Props {
  pedidos: Pedido[];
  onTransmitir: (id: string) => void;
  onCancelar: (id: string) => void;
}

export function PerDcompTable({ pedidos, onTransmitir, onCancelar }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pedidos PER/DCOMP</CardTitle>
      </CardHeader>
      <CardContent>
        {pedidos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum pedido registrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Tributo Origem</TableHead>
                <TableHead>Competência</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Recibo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => {
                const config = STATUS_CONFIG[pedido.status];
                return (
                  <TableRow key={pedido.id}>
                    <TableCell>
                      <Badge variant={pedido.tipo === 'per' ? 'default' : 'secondary'}>
                        {pedido.tipo.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{pedido.tributo_origem.toUpperCase()}</TableCell>
                    <TableCell>{pedido.competencia_origem}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(pedido.valor_original)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {pedido.numero_recibo || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={config.cor}>
                        {config.icone}
                        <span className="ml-1">{pedido.status.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {pedido.status === 'rascunho' && (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => onTransmitir(pedido.id)}>
                            <Send className="h-4 w-4 mr-1" />
                            Transmitir
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onCancelar(pedido.id)}>
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
