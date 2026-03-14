// ============================================
// COMPONENTE: PER/DCOMP DIGITAL
// Pedido de Restituição e Compensação
// ============================================

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Plus, 
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  ArrowLeftRight,
  Scale,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import usePerDcomp, { TipoPedido, TipoCreditoOrigem, StatusPedido } from '@/hooks/usePerDcomp';
import { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import { useAllEmpresas } from '@/hooks/useEmpresas';

const STATUS_CONFIG: Record<StatusPedido, { cor: string; icone: React.ReactNode }> = {
  rascunho: { cor: 'bg-muted text-muted-foreground', icone: <FileText className="h-4 w-4" /> },
  aguardando_transmissao: { cor: 'bg-warning/10 text-warning', icone: <Clock className="h-4 w-4" /> },
  transmitido: { cor: 'bg-primary/10 text-primary', icone: <Send className="h-4 w-4" /> },
  em_analise: { cor: 'bg-secondary text-secondary-foreground', icone: <Clock className="h-4 w-4" /> },
  deferido: { cor: 'bg-success/10 text-success', icone: <CheckCircle2 className="h-4 w-4" /> },
  indeferido: { cor: 'bg-destructive/10 text-destructive', icone: <XCircle className="h-4 w-4" /> },
  cancelado: { cor: 'bg-muted text-muted-foreground', icone: <XCircle className="h-4 w-4" /> },
};

export function PerDcompPanel() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('lista');

  // Form state
  const [formData, setFormData] = useState({
    tipo: 'dcomp' as TipoPedido,
    tipo_credito_origem: 'saldo_negativo' as TipoCreditoOrigem,
    tributo_origem: 'cbs',
    competencia_origem: format(new Date(), 'yyyy-MM'),
    valor_original: 0,
    tributo_destino: '',
    competencia_destino: '',
    justificativa: '',
  });

  const { data: empresas = [] } = useAllEmpresas();
  const {
    pedidos,
    isLoading,
    estatisticas,
    criarPedido,
    transmitirPedido,
    cancelarPedido,
    TRIBUTOS_VALIDOS,
    TIPOS_CREDITO_ORIGEM,
  } = usePerDcomp(empresaId || undefined);

  const { creditos } = useCreditosTributarios(empresaId || undefined);
  const creditosDisponiveis = creditos.filter(c => c.status === 'disponivel');

  const handleCriarPedido = () => {
    if (!empresaId) return;

    criarPedido.mutate({
      empresa_id: empresaId,
      tipo: formData.tipo,
      tipo_credito_origem: formData.tipo_credito_origem,
      tributo_origem: formData.tributo_origem,
      competencia_origem: formData.competencia_origem,
      valor_original: formData.valor_original,
      tributo_destino: formData.tipo === 'dcomp' ? formData.tributo_destino : undefined,
      competencia_destino: formData.tipo === 'dcomp' ? formData.competencia_destino : undefined,
      justificativa: formData.justificativa,
      creditos_ids: [],
      status: 'rascunho',
    });

    setDialogOpen(false);
    setFormData({
      tipo: 'dcomp',
      tipo_credito_origem: 'saldo_negativo',
      tributo_origem: 'cbs',
      competencia_origem: format(new Date(), 'yyyy-MM'),
      valor_original: 0,
      tributo_destino: '',
      competencia_destino: '',
      justificativa: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            PER/DCOMP Digital
          </CardTitle>
          <CardDescription>
            Pedido Eletrônico de Restituição e Declaração de Compensação
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
                  Novo Pedido
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo PER/DCOMP</DialogTitle>
                  <DialogDescription>
                    Crie um pedido de restituição ou compensação de créditos
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Tipo do pedido */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={formData.tipo === 'per' ? 'default' : 'outline'}
                      className="h-20 flex-col"
                      onClick={() => setFormData(prev => ({ ...prev, tipo: 'per' }))}
                    >
                      <DollarSign className="h-6 w-6 mb-1" />
                      <span>PER - Restituição</span>
                      <span className="text-xs opacity-70">Receber de volta</span>
                    </Button>
                    <Button
                      variant={formData.tipo === 'dcomp' ? 'default' : 'outline'}
                      className="h-20 flex-col"
                      onClick={() => setFormData(prev => ({ ...prev, tipo: 'dcomp' }))}
                    >
                      <ArrowLeftRight className="h-6 w-6 mb-1" />
                      <span>DCOMP - Compensação</span>
                      <span className="text-xs opacity-70">Abater de débitos</span>
                    </Button>
                  </div>

                  <Separator />

                  {/* Crédito Origem */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo do Crédito</Label>
                      <Select 
                        value={formData.tipo_credito_origem} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, tipo_credito_origem: v as TipoCreditoOrigem }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_CREDITO_ORIGEM.map((tipo) => (
                            <SelectItem key={tipo.codigo} value={tipo.codigo}>
                              {tipo.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tributo Origem</Label>
                      <Select 
                        value={formData.tributo_origem} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, tributo_origem: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIBUTOS_VALIDOS.map((tributo) => (
                            <SelectItem key={tributo.codigo} value={tributo.codigo}>
                              {tributo.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Competência Origem</Label>
                      <Input
                        type="month"
                        value={formData.competencia_origem}
                        onChange={(e) => setFormData(prev => ({ ...prev, competencia_origem: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor Original do Crédito</Label>
                      <Input
                        type="number"
                        value={formData.valor_original}
                        onChange={(e) => setFormData(prev => ({ ...prev, valor_original: Number(e.target.value) }))}
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>

                  {/* Débito Destino (apenas para DCOMP) */}
                  {formData.tipo === 'dcomp' && (
                    <>
                      <Separator />
                      <p className="text-sm font-medium">Débito a Compensar</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Tributo Destino</Label>
                          <Select 
                            value={formData.tributo_destino} 
                            onValueChange={(v) => setFormData(prev => ({ ...prev, tributo_destino: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {TRIBUTOS_VALIDOS.map((tributo) => (
                                <SelectItem key={tributo.codigo} value={tributo.codigo}>
                                  {tributo.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Competência Destino</Label>
                          <Input
                            type="month"
                            value={formData.competencia_destino}
                            onChange={(e) => setFormData(prev => ({ ...prev, competencia_destino: e.target.value }))}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Justificativa</Label>
                    <Textarea
                      value={formData.justificativa}
                      onChange={(e) => setFormData(prev => ({ ...prev, justificativa: e.target.value }))}
                      placeholder="Descreva o motivo do pedido..."
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCriarPedido}
                    disabled={formData.valor_original <= 0}
                  >
                    Criar Rascunho
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
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pedidos</p>
                    <p className="text-2xl font-bold">{estatisticas.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Em Análise</p>
                    <p className="text-2xl font-bold">{estatisticas.transmitidos + estatisticas.emAnalise}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Deferidos</p>
                    <p className="text-2xl font-bold">{estatisticas.deferidos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Compensado</p>
                    <p className="text-2xl font-bold">{formatCurrency(estatisticas.valorTotalCompensado)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Créditos Disponíveis */}
          {creditosDisponiveis.length > 0 && (
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Créditos Disponíveis para Compensação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {creditosDisponiveis.slice(0, 5).map((credito) => (
                    <div 
                      key={credito.id}
                      className="p-3 bg-white dark:bg-background rounded-lg border"
                    >
                      <p className="font-medium">{credito.tipo_tributo}</p>
                      <p className="text-sm text-muted-foreground">{credito.competencia_origem}</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(credito.saldo_disponivel || 0)}
                      </p>
                    </div>
                  ))}
                  {creditosDisponiveis.length > 5 && (
                    <div className="p-3 flex items-center text-muted-foreground">
                      +{creditosDisponiveis.length - 5} mais
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Pedidos */}
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
                                <Button
                                  size="sm"
                                  onClick={() => transmitirPedido.mutate(pedido.id)}
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                  Transmitir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelarPedido.mutate(pedido.id)}
                                >
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
        </>
      )}
    </div>
  );
}

export default PerDcompPanel;
