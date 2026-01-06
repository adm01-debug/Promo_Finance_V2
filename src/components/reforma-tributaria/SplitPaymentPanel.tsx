// ============================================
// COMPONENTE: SPLIT PAYMENT
// Recolhimento fracionado LC 214/2025
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Split, 
  CheckCircle2, 
  Clock,
  DollarSign,
  ArrowRight,
  Calculator,
  Plus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import useSplitPayment from '@/hooks/useSplitPayment';
import { useAllEmpresas } from '@/hooks/useEmpresas';

const STATUS_COLORS = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  processado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  repassado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  erro: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function SplitPaymentPanel() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [valorSimulacao, setValorSimulacao] = useState(10000);

  const { data: empresas = [] } = useAllEmpresas();
  const {
    transacoes,
    isLoading,
    estatisticas,
    calcularSplit,
    registrarTransacao,
    confirmarProcessamento,
  } = useSplitPayment(empresaId || undefined);

  // Simulação em tempo real
  const simulacao = calcularSplit(valorSimulacao);

  const handleRegistrar = () => {
    if (!empresaId) return;
    
    registrarTransacao.mutate({
      empresaId,
      valorTotal: valorSimulacao,
    });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Split Payment - LC 214/2025
          </CardTitle>
          <CardDescription>
            Recolhimento fracionado automático de IBS/CBS no momento do pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-48">
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!empresaId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Simular Split Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Simular Split Payment</DialogTitle>
                  <DialogDescription>
                    Calcule a divisão de tributos para uma transação
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Valor da Operação</Label>
                    <Input
                      type="number"
                      value={valorSimulacao}
                      onChange={(e) => setValorSimulacao(Number(e.target.value))}
                      min={0}
                      step={100}
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span className="font-bold">{formatCurrency(simulacao.valorTotal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span>CBS Retido ({(simulacao.aliquotas.cbs * 100).toFixed(2)}%):</span>
                      <span className="text-blue-600">{formatCurrency(simulacao.cbsRetido)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>IBS Retido ({(simulacao.aliquotas.ibs * 100).toFixed(2)}%):</span>
                      <span className="text-green-600">{formatCurrency(simulacao.ibsRetido)}</span>
                    </div>
                    {simulacao.isRetido > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>IS Retido:</span>
                        <span className="text-orange-600">{formatCurrency(simulacao.isRetido)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total Retido:</span>
                      <span className="text-red-600">{formatCurrency(simulacao.totalRetido)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Valor Líquido Vendedor:</span>
                      <span className="text-primary">{formatCurrency(simulacao.valorLiquido)}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                    <p className="font-medium">Como funciona:</p>
                    <ul className="mt-2 space-y-1 text-muted-foreground">
                      <li>• O adquirente (pagador) retém os tributos</li>
                      <li>• CBS vai direto para a conta do Tesouro Federal</li>
                      <li>• IBS vai para a conta do Comitê Gestor</li>
                      <li>• Vendedor recebe o valor líquido</li>
                    </ul>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Fechar
                  </Button>
                  <Button onClick={handleRegistrar}>
                    Registrar Transação
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {empresaId && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transações</p>
                    <p className="text-2xl font-bold">{estatisticas.totalTransacoes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Volume Operado</p>
                    <p className="text-2xl font-bold">{formatCurrency(estatisticas.valorTotalOperacoes)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Calculator className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tributos Retidos</p>
                    <p className="text-2xl font-bold">{formatCurrency(estatisticas.totalTributosRetidos)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold">{estatisticas.pendentes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transações Split Payment</CardTitle>
            </CardHeader>
            <CardContent>
              {transacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Split className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma transação registrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Documento</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead className="text-right">CBS</TableHead>
                      <TableHead className="text-right">IBS</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoes.map((transacao) => (
                      <TableRow key={transacao.id}>
                        <TableCell className="font-mono text-sm">
                          {transacao.documento_numero || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(transacao.valor_operacao)}
                        </TableCell>
                        <TableCell className="text-right text-blue-600">
                          {formatCurrency(transacao.cbs_retido)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(transacao.ibs_retido)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(transacao.valor_liquido)}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(transacao.created_at), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[transacao.status as keyof typeof STATUS_COLORS]}>
                            {transacao.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {transacao.status === 'pendente' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => confirmarProcessamento.mutate(transacao.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Processar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default SplitPaymentPanel;
