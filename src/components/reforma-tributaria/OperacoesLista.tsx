// ============================================
// COMPONENTE: LISTA DE OPERAÇÕES TRIBUTÁVEIS
// Visualização de operações com CBS/IBS/IS
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { FileText, Search, Download, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOperacoesTributaveis } from '@/hooks/useOperacoesTributaveis';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';

export function OperacoesLista() {
  const { data: empresas } = useAllEmpresas();
  const empresaId = empresas?.[0]?.id;
  const { operacoes, isLoading } = useOperacoesTributaveis(empresaId);
  const [busca, setBusca] = useState('');

  const operacoesFiltradas = operacoes?.filter(op => 
    op.nome_contraparte?.toLowerCase().includes(busca.toLowerCase()) ||
    op.documento_numero?.includes(busca)
  ) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Operações Tributáveis</CardTitle>
            <CardDescription>Vendas, compras e serviços com cálculo CBS/IBS</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-8 w-[200px]"
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon"><Download className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {operacoesFiltradas.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contraparte</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">CBS</TableHead>
                <TableHead className="text-right">IBS</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operacoesFiltradas.slice(0, 50).map(op => (
                <TableRow key={op.id}>
                  <TableCell>
                    <Badge variant={op.tipo_operacao.includes('venda') ? 'default' : 'secondary'}>
                      {op.tipo_operacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{op.documento_numero || '-'}</TableCell>
                  <TableCell>{op.nome_contraparte || '-'}</TableCell>
                  <TableCell>{format(parseISO(op.data_operacao), 'dd/MM/yy')}</TableCell>
                  <TableCell className="text-right">{formatCurrency(op.valor_operacao)}</TableCell>
                  <TableCell className="text-right text-blue-600">{formatCurrency(op.cbs_valor)}</TableCell>
                  <TableCell className="text-right text-emerald-600">{formatCurrency(op.ibs_valor)}</TableCell>
                  <TableCell>
                    <Badge variant={op.status === 'processado' ? 'outline' : 'destructive'}>
                      {op.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma operação registrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default OperacoesLista;
