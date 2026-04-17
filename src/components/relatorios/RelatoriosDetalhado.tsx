import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const mockTransacoes = [
  { data: '2024-12-15', descricao: 'Pagamento Cliente ABC', categoria: 'Vendas', tipo: 'Receita', valor: 15000, status: 'Conciliado' },
  { data: '2024-12-14', descricao: 'Fornecedor XYZ', categoria: 'Fornecedores', tipo: 'Despesa', valor: 8500, status: 'Conciliado' },
  { data: '2024-12-13', descricao: 'Serviços Tech Solutions', categoria: 'Vendas', tipo: 'Receita', valor: 22000, status: 'Pendente' },
  { data: '2024-12-12', descricao: 'Folha de Pagamento', categoria: 'Pessoal', tipo: 'Despesa', valor: 45000, status: 'Conciliado' },
  { data: '2024-12-11', descricao: 'Marketing Digital', categoria: 'Marketing', tipo: 'Despesa', valor: 3500, status: 'Conciliado' },
];

export function RelatoriosDetalhado() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatório Detalhado</CardTitle>
        <CardDescription>Transações do período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"><Checkbox /></TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTransacoes.map((item, i) => (
              <TableRow key={i}>
                <TableCell><Checkbox /></TableCell>
                <TableCell>{new Date(item.data).toLocaleDateString('pt-BR')}</TableCell>
                <TableCell className="font-medium">{item.descricao}</TableCell>
                <TableCell><Badge variant="outline">{item.categoria}</Badge></TableCell>
                <TableCell>
                  <Badge variant={item.tipo === 'Receita' ? 'default' : 'secondary'} className={item.tipo === 'Receita' ? 'bg-success' : 'bg-destructive'}>
                    {item.tipo}
                  </Badge>
                </TableCell>
                <TableCell className={cn("text-right font-medium", item.tipo === 'Receita' ? "text-success" : "text-destructive")}>
                  {item.tipo === 'Receita' ? '+' : '-'}{formatCurrency(item.valor)}
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === 'Conciliado' ? 'default' : 'outline'}>{item.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
