// ============================================
// COMPONENTE: CONCILIAÇÃO TRIBUTÁRIA AUTOMÁTICA
// ============================================

import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useConciliacaoTributaria } from '@/hooks/useConciliacaoTributaria';
import { formatCurrency } from '@/lib/formatters';

interface Props {
  empresaId: string;
}

export function ConciliacaoTributariaPanel({ empresaId }: Props) {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);

  const { divergencias, resumo, isAnalisando, executarConciliacao } = useConciliacaoTributaria(empresaId);

  const meses = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleDateString('pt-BR', { month: 'long' })
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Conciliação Tributária</h2>
          <p className="text-sm text-muted-foreground">Cruzamento NF-e vs cálculos tributários</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(mes)} onValueChange={v => setMes(Number(v))}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {meses.map(m => (
                <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(ano)} onValueChange={v => setAno(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => executarConciliacao.mutate({ ano, mes })} disabled={isAnalisando}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isAnalisando ? 'animate-spin' : ''}`} />
            Executar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total NF-e</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo.totalNFesEmitidas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Divergências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{resumo.divergenciasEncontradas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Valor Divergências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(resumo.valorTotalDivergencias)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Acurácia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resumo.percentualAcuracia.toFixed(0)}%</div>
            <Progress value={resumo.percentualAcuracia} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {divergencias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Divergências Encontradas</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Documento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Esperado</TableHead>
                  <TableHead className="text-right">Encontrado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead>Gravidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {divergencias.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono">{d.documento}</TableCell>
                    <TableCell>{d.descricao}</TableCell>
                    <TableCell className="text-right">{formatCurrency(d.valorEsperado)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(d.valorEncontrado)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(d.diferenca)}</TableCell>
                    <TableCell>
                      <Badge variant={d.gravidade === 'critica' ? 'destructive' : 'outline'}>
                        {d.gravidade}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {divergencias.length === 0 && resumo.totalNFesEmitidas > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6 flex items-center gap-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div>
              <h3 className="font-semibold text-green-700">Conciliação OK!</h3>
              <p className="text-sm text-green-600">Sem divergências encontradas.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ConciliacaoTributariaPanel;
