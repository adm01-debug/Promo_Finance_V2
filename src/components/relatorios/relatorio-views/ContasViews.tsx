import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';

function ContasResumo({ total, valorTotal, valorPago, label, porStatus }: { total: number; valorTotal: number; valorPago: number; label: string; porStatus?: Record<string, number> }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-sm text-muted-foreground">Total de Contas</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{formatCurrency(valorTotal)}</p><p className="text-sm text-muted-foreground">Valor Total</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-success">{formatCurrency(valorPago)}</p><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card>
      </div>
      {porStatus && <div className="flex gap-2 flex-wrap">{Object.entries(porStatus).map(([status, count]) => <Badge key={status} variant="outline">{status}: {count}</Badge>)}</div>}
    </>
  );
}

export function ContasPagarView({ data }: { data: Record<string, unknown> }) {
  const resumo = data.resumo as { total: number; valor_total: number; valor_pago: number; por_status: Record<string, number> } | undefined;
  const contas = data.contas as Array<{ id: string; descricao: string; fornecedor_nome: string; valor: number; status: string; data_vencimento: string }> | undefined;

  return (
    <div className="space-y-6">
      <ContasResumo total={resumo?.total || 0} valorTotal={resumo?.valor_total || 0} valorPago={resumo?.valor_pago || 0} label="Valor Pago" porStatus={resumo?.por_status} />
      {contas && contas.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Fornecedor</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{contas.slice(0, 20).map((conta) => (
            <TableRow key={conta.id}><TableCell className="font-medium">{conta.descricao}</TableCell><TableCell>{conta.fornecedor_nome}</TableCell><TableCell>{format(new Date(conta.data_vencimento), 'dd/MM/yyyy')}</TableCell><TableCell className="text-right">{formatCurrency(conta.valor)}</TableCell><TableCell><Badge variant="outline">{conta.status}</Badge></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}

export function ContasReceberView({ data }: { data: Record<string, unknown> }) {
  const resumo = data.resumo as { total: number; valor_total: number; valor_recebido: number; por_status: Record<string, number> } | undefined;
  const contas = data.contas as Array<{ id: string; descricao: string; cliente_nome: string; valor: number; status: string; data_vencimento: string }> | undefined;

  return (
    <div className="space-y-6">
      <ContasResumo total={resumo?.total || 0} valorTotal={resumo?.valor_total || 0} valorPago={resumo?.valor_recebido || 0} label="Valor Recebido" porStatus={resumo?.por_status} />
      {contas && contas.length > 0 && (
        <Table>
          <TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Cliente</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>{contas.slice(0, 20).map((conta) => (
            <TableRow key={conta.id}><TableCell className="font-medium">{conta.descricao}</TableCell><TableCell>{conta.cliente_nome}</TableCell><TableCell>{format(new Date(conta.data_vencimento), 'dd/MM/yyyy')}</TableCell><TableCell className="text-right">{formatCurrency(conta.valor)}</TableCell><TableCell><Badge variant="outline">{conta.status}</Badge></TableCell></TableRow>
          ))}</TableBody>
        </Table>
      )}
    </div>
  );
}
