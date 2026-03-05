// ============================================
// COMPONENTE: CONTROLE DE RETENÇÕES NA FONTE
// IRRF, CSRF, INSS, ISS, CBS, IBS
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Receipt, 
  FileText, 
  Plus, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Building2,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';
import useRetencoesFonte, { TipoRetencao, RetencaoFonte, DARF } from '@/hooks/useRetencoesFonte';
import { useAllEmpresas } from '@/hooks/useEmpresas';

const TIPO_LABELS: Record<TipoRetencao, string> = {
  irrf: 'IRRF',
  csrf: 'CSRF',
  pis_cofins_csll: 'PIS/COFINS/CSLL',
  inss: 'INSS',
  iss: 'ISS',
  cbs: 'CBS',
  ibs: 'IBS',
};

const STATUS_COLORS = {
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  recolhido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  compensado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function RetencoesFonte() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [competencia, setCompetencia] = useState(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState('retencoes');
  const [selectedRetencoes, setSelectedRetencoes] = useState<string[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<TipoRetencao | 'todos'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: empresas = [] } = useAllEmpresas();
  const {
    retencoes,
    darfs,
    isLoading,
    resumoPorTipo,
    retencoesCriticas,
    criarRetencao,
    gerarDARF,
    pagarDARF,
    CODIGOS_RECEITA,
    ALIQUOTAS_RETENCAO,
  } = useRetencoesFonte(empresaId || undefined, competencia);

  // Filtrar retenções
  const retencoesFiltradas = useMemo(() => {
    if (tipoFiltro === 'todos') return retencoes;
    return retencoes.filter(r => r.tipo_retencao === tipoFiltro);
  }, [retencoes, tipoFiltro]);

  // Form state para nova retenção
  const [novaRetencao, setNovaRetencao] = useState({
    tipo_retencao: 'irrf' as TipoRetencao,
    tipo_operacao: 'pagamento' as 'pagamento' | 'recebimento',
    nome_participante: '',
    cnpj_participante: '',
    valor_base: 0,
    data_fato_gerador: format(new Date(), 'yyyy-MM-dd'),
  });

  const handleCriarRetencao = () => {
    if (!empresaId) {
      return;
    }

    const aliquota = ALIQUOTAS_RETENCAO[novaRetencao.tipo_retencao];
    const valorRetido = novaRetencao.valor_base * aliquota;

    criarRetencao.mutate({
      empresa_id: empresaId,
      tipo_retencao: novaRetencao.tipo_retencao,
      tipo_operacao: novaRetencao.tipo_operacao,
      nome_participante: novaRetencao.nome_participante,
      cnpj_participante: novaRetencao.cnpj_participante,
      valor_base: novaRetencao.valor_base,
      aliquota,
      valor_retido: valorRetido,
      data_fato_gerador: novaRetencao.data_fato_gerador,
      data_retencao: novaRetencao.data_fato_gerador,
      data_vencimento: format(new Date(novaRetencao.data_fato_gerador), 'yyyy-MM-dd'),
      competencia,
      status: 'pendente',
    });

    setDialogOpen(false);
    setNovaRetencao({
      tipo_retencao: 'irrf',
      tipo_operacao: 'pagamento',
      nome_participante: '',
      cnpj_participante: '',
      valor_base: 0,
      data_fato_gerador: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleGerarDARF = (tipoRetencao: TipoRetencao) => {
    if (!empresaId) return;

    const retencoesDoTipo = retencoes.filter(
      r => r.tipo_retencao === tipoRetencao && r.status === 'pendente' && !r.darf_gerado
    );

    if (retencoesDoTipo.length === 0) return;

    gerarDARF.mutate({
      empresaId,
      competencia,
      tipoRetencao,
      retencoesIds: retencoesDoTipo.map(r => r.id),
    });
  };

  const totalPendente = retencoes
    .filter(r => r.status === 'pendente')
    .reduce((sum, r) => sum + r.valor_retido, 0);

  const totalRecolhido = retencoes
    .filter(r => r.status === 'recolhido')
    .reduce((sum, r) => sum + r.valor_retido, 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Retenções na Fonte
          </CardTitle>
          <CardDescription>
            Controle de IRRF, CSRF, INSS, ISS e novos tributos CBS/IBS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="w-64">
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

            <div className="space-y-2">
              <Label>Competência</Label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
                className="w-40"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as TipoRetencao | 'todos')}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Object.entries(TIPO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={!empresaId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Retenção
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Retenção</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova retenção na fonte
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Retenção</Label>
                      <Select 
                        value={novaRetencao.tipo_retencao} 
                        onValueChange={(v) => setNovaRetencao(prev => ({ ...prev, tipo_retencao: v as TipoRetencao }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TIPO_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Operação</Label>
                      <Select 
                        value={novaRetencao.tipo_operacao} 
                        onValueChange={(v) => setNovaRetencao(prev => ({ ...prev, tipo_operacao: v as 'pagamento' | 'recebimento' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pagamento">Pagamento (retivemos)</SelectItem>
                          <SelectItem value="recebimento">Recebimento (retido de nós)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Participante (Nome/Razão Social)</Label>
                    <Input
                      value={novaRetencao.nome_participante}
                      onChange={(e) => setNovaRetencao(prev => ({ ...prev, nome_participante: e.target.value }))}
                      placeholder="Nome do fornecedor ou cliente"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CNPJ/CPF</Label>
                    <Input
                      value={novaRetencao.cnpj_participante}
                      onChange={(e) => setNovaRetencao(prev => ({ ...prev, cnpj_participante: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Valor Base</Label>
                      <Input
                        type="number"
                        value={novaRetencao.valor_base}
                        onChange={(e) => setNovaRetencao(prev => ({ ...prev, valor_base: Number(e.target.value) }))}
                        min={0}
                        step={0.01}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data Fato Gerador</Label>
                      <Input
                        type="date"
                        value={novaRetencao.data_fato_gerador}
                        onChange={(e) => setNovaRetencao(prev => ({ ...prev, data_fato_gerador: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Alíquota:</span>
                      <span className="font-medium">
                        {(ALIQUOTAS_RETENCAO[novaRetencao.tipo_retencao] * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>Valor Retido:</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(novaRetencao.valor_base * ALIQUOTAS_RETENCAO[novaRetencao.tipo_retencao])}
                      </span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCriarRetencao}
                    disabled={!novaRetencao.nome_participante || novaRetencao.valor_base <= 0}
                  >
                    Registrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {empresaId && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pendente</p>
                  <p className="text-xl font-bold">{formatCurrency(totalPendente)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recolhido</p>
                  <p className="text-xl font-bold">{formatCurrency(totalRecolhido)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DARFs Gerados</p>
                  <p className="text-xl font-bold">{darfs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Críticas (5 dias)</p>
                  <p className="text-xl font-bold">{retencoesCriticas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="retencoes">Retenções</TabsTrigger>
          <TabsTrigger value="darfs">DARFs</TabsTrigger>
          <TabsTrigger value="resumo">Resumo por Tipo</TabsTrigger>
        </TabsList>

        <TabsContent value="retencoes">
          <Card>
            <CardContent className="pt-6">
              {retencoesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma retenção registrada</p>
                  <p className="text-sm">Selecione uma empresa e adicione retenções</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox />
                      </TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Participante</TableHead>
                      <TableHead>Operação</TableHead>
                      <TableHead className="text-right">Base</TableHead>
                      <TableHead className="text-right">Alíquota</TableHead>
                      <TableHead className="text-right">Retido</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {retencoesFiltradas.map((retencao) => (
                      <TableRow key={retencao.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRetencoes.includes(retencao.id)}
                            onChange={(e) => {
                              const checked = (e.target as HTMLInputElement).checked;
                              if (checked) {
                                setSelectedRetencoes(prev => [...prev, retencao.id]);
                              } else {
                                setSelectedRetencoes(prev => prev.filter(id => id !== retencao.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TIPO_LABELS[retencao.tipo_retencao]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{retencao.nome_participante}</p>
                            {retencao.cnpj_participante && (
                              <p className="text-xs text-muted-foreground">
                                {retencao.cnpj_participante}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={retencao.tipo_operacao === 'pagamento' ? 'default' : 'secondary'}>
                            {retencao.tipo_operacao === 'pagamento' ? 'Retivemos' : 'Retido de nós'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(retencao.valor_base)}
                        </TableCell>
                        <TableCell className="text-right">
                          {(retencao.aliquota * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(retencao.valor_retido)}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(retencao.data_vencimento), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_COLORS[retencao.status]}>
                            {retencao.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="darfs">
          <Card>
            <CardContent className="pt-6">
              {darfs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum DARF gerado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {darfs.map((darf) => (
                      <TableRow key={darf.id}>
                        <TableCell className="font-mono">{darf.codigo_receita}</TableCell>
                        <TableCell>{darf.descricao_receita}</TableCell>
                        <TableCell>{darf.competencia}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(darf.valor_total)}
                        </TableCell>
                        <TableCell>
                          {format(parseISO(darf.data_vencimento), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            darf.status === 'pago' ? STATUS_COLORS.recolhido :
                            darf.status === 'vencido' ? 'bg-red-100 text-red-800' :
                            STATUS_COLORS.pendente
                          }>
                            {darf.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {darf.status === 'gerado' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => pagarDARF.mutate({ 
                                darfId: darf.id, 
                                dataPagamento: format(new Date(), 'yyyy-MM-dd') 
                              })}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Pagar
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
        </TabsContent>

        <TabsContent value="resumo">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(resumoPorTipo).map(([tipo, dados]) => (
              <Card key={tipo}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{TIPO_LABELS[tipo as TipoRetencao]}</span>
                    <Badge variant="outline">{dados.count} retenções</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">{formatCurrency(dados.total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600">Pendente:</span>
                    <span>{formatCurrency(dados.pendente)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Recolhido:</span>
                    <span>{formatCurrency(dados.recolhido)}</span>
                  </div>
                  <Separator />
                  <Button
                    size="sm"
                    className="w-full"
                    variant="outline"
                    onClick={() => handleGerarDARF(tipo as TipoRetencao)}
                    disabled={dados.pendente === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar DARF
                  </Button>
                </CardContent>
              </Card>
            ))}

            {Object.keys(resumoPorTipo).length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma retenção registrada na competência</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RetencoesFonte;
