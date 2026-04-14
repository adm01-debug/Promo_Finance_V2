import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Receipt, FileText, Plus, AlertTriangle, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import useRetencoesFonte, { TipoRetencao } from '@/hooks/useRetencoesFonte';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { RetencoesTable } from './retencoes/RetencoesTable';
import { DARFsTable } from './retencoes/DARFsTable';
import { ResumoPorTipoGrid } from './retencoes/ResumoPorTipoGrid';

const TIPO_LABELS: Record<TipoRetencao, string> = {
  irrf: 'IRRF', csrf: 'CSRF', pis_cofins_csll: 'PIS/COFINS/CSLL',
  inss: 'INSS', iss: 'ISS', cbs: 'CBS', ibs: 'IBS',
};

export function RetencoesFonte() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [competencia, setCompetencia] = useState(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState('retencoes');
  const [selectedRetencoes, setSelectedRetencoes] = useState<string[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState<TipoRetencao | 'todos'>('todos');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: empresas = [] } = useAllEmpresas();
  const { retencoes, darfs, isLoading, resumoPorTipo, retencoesCriticas, criarRetencao, gerarDARF, pagarDARF, CODIGOS_RECEITA, ALIQUOTAS_RETENCAO } = useRetencoesFonte(empresaId || undefined, competencia);

  const retencoesFiltradas = useMemo(() => tipoFiltro === 'todos' ? retencoes : retencoes.filter(r => r.tipo_retencao === tipoFiltro), [retencoes, tipoFiltro]);

  const [novaRetencao, setNovaRetencao] = useState({ tipo_retencao: 'irrf' as TipoRetencao, tipo_operacao: 'pagamento' as 'pagamento' | 'recebimento', nome_participante: '', cnpj_participante: '', valor_base: 0, data_fato_gerador: format(new Date(), 'yyyy-MM-dd') });

  const handleCriarRetencao = () => {
    if (!empresaId) return;
    const aliquota = ALIQUOTAS_RETENCAO[novaRetencao.tipo_retencao];
    criarRetencao.mutate({ empresa_id: empresaId, tipo_retencao: novaRetencao.tipo_retencao, tipo_operacao: novaRetencao.tipo_operacao, nome_participante: novaRetencao.nome_participante, cnpj_participante: novaRetencao.cnpj_participante, valor_base: novaRetencao.valor_base, aliquota, valor_retido: novaRetencao.valor_base * aliquota, data_fato_gerador: novaRetencao.data_fato_gerador, data_retencao: novaRetencao.data_fato_gerador, data_vencimento: format(new Date(novaRetencao.data_fato_gerador), 'yyyy-MM-dd'), competencia, status: 'pendente' });
    setDialogOpen(false);
    setNovaRetencao({ tipo_retencao: 'irrf', tipo_operacao: 'pagamento', nome_participante: '', cnpj_participante: '', valor_base: 0, data_fato_gerador: format(new Date(), 'yyyy-MM-dd') });
  };

  const handleGerarDARF = (tipoRetencao: TipoRetencao) => {
    if (!empresaId) return;
    const retencoesDoTipo = retencoes.filter(r => r.tipo_retencao === tipoRetencao && r.status === 'pendente' && !r.darf_gerado);
    if (retencoesDoTipo.length === 0) return;
    gerarDARF.mutate({ empresaId, competencia, tipoRetencao, retencoesIds: retencoesDoTipo.map(r => r.id) });
  };

  const totalPendente = retencoes.filter(r => r.status === 'pendente').reduce((sum, r) => sum + r.valor_retido, 0);
  const totalRecolhido = retencoes.filter(r => r.status === 'recolhido').reduce((sum, r) => sum + r.valor_retido, 0);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Retenções na Fonte</CardTitle>
          <CardDescription>Controle de IRRF, CSRF, INSS, ISS e novos tributos CBS/IBS</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2"><Label>Empresa</Label><Select value={empresaId} onValueChange={setEmpresaId}><SelectTrigger className="w-64"><SelectValue placeholder="Selecione a empresa" /></SelectTrigger><SelectContent>{empresas.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.razao_social}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Competência</Label><Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} className="w-40" /></div>
            <div className="space-y-2"><Label>Tipo</Label><Select value={tipoFiltro} onValueChange={(v) => setTipoFiltro(v as TipoRetencao | 'todos')}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{Object.entries(TIPO_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button disabled={!empresaId}><Plus className="h-4 w-4 mr-2" />Nova Retenção</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Retenção</DialogTitle><DialogDescription>Adicione uma nova retenção na fonte</DialogDescription></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Tipo de Retenção</Label><Select value={novaRetencao.tipo_retencao} onValueChange={(v) => setNovaRetencao(prev => ({ ...prev, tipo_retencao: v as TipoRetencao }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(TIPO_LABELS).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
                    <div className="space-y-2"><Label>Tipo de Operação</Label><Select value={novaRetencao.tipo_operacao} onValueChange={(v) => setNovaRetencao(prev => ({ ...prev, tipo_operacao: v as 'pagamento' | 'recebimento' }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pagamento">Pagamento (retivemos)</SelectItem><SelectItem value="recebimento">Recebimento (retido de nós)</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="space-y-2"><Label>Participante</Label><Input value={novaRetencao.nome_participante} onChange={(e) => setNovaRetencao(prev => ({ ...prev, nome_participante: e.target.value }))} placeholder="Nome do fornecedor ou cliente" /></div>
                  <div className="space-y-2"><Label>CNPJ/CPF</Label><Input value={novaRetencao.cnpj_participante} onChange={(e) => setNovaRetencao(prev => ({ ...prev, cnpj_participante: e.target.value }))} placeholder="00.000.000/0001-00" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Valor Base</Label><Input type="number" value={novaRetencao.valor_base} onChange={(e) => setNovaRetencao(prev => ({ ...prev, valor_base: Number(e.target.value) }))} min={0} step={0.01} /></div>
                    <div className="space-y-2"><Label>Data Fato Gerador</Label><Input type="date" value={novaRetencao.data_fato_gerador} onChange={(e) => setNovaRetencao(prev => ({ ...prev, data_fato_gerador: e.target.value }))} /></div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between text-sm"><span>Alíquota:</span><span className="font-medium">{(ALIQUOTAS_RETENCAO[novaRetencao.tipo_retencao] * 100).toFixed(2)}%</span></div>
                    <div className="flex justify-between text-sm mt-1"><span>Valor Retido:</span><span className="font-bold text-primary">{formatCurrency(novaRetencao.valor_base * ALIQUOTAS_RETENCAO[novaRetencao.tipo_retencao])}</span></div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCriarRetencao} disabled={!novaRetencao.nome_participante || novaRetencao.valor_base <= 0}>Registrar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Resumo KPIs */}
      {empresaId && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-warning/10 rounded-lg"><AlertTriangle className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Pendente</p><p className="text-xl font-bold">{formatCurrency(totalPendente)}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-success/10 rounded-lg"><CheckCircle2 className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Recolhido</p><p className="text-xl font-bold">{formatCurrency(totalRecolhido)}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-primary/10 rounded-lg"><FileText className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">DARFs Gerados</p><p className="text-xl font-bold">{darfs.length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2 bg-destructive/10 rounded-lg"><Calendar className="h-5 w-5 text-destructive" /></div><div><p className="text-sm text-muted-foreground">Críticas (5 dias)</p><p className="text-xl font-bold">{retencoesCriticas.length}</p></div></div></CardContent></Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="retencoes">Retenções</TabsTrigger>
          <TabsTrigger value="darfs">DARFs</TabsTrigger>
          <TabsTrigger value="resumo">Resumo por Tipo</TabsTrigger>
        </TabsList>
        <TabsContent value="retencoes"><RetencoesTable retencoes={retencoesFiltradas} selectedRetencoes={selectedRetencoes} onSelectionChange={setSelectedRetencoes} /></TabsContent>
        <TabsContent value="darfs"><DARFsTable darfs={darfs} onPagar={(darfId, data) => pagarDARF.mutate({ darfId, dataPagamento: data })} /></TabsContent>
        <TabsContent value="resumo"><ResumoPorTipoGrid resumoPorTipo={resumoPorTipo} onGerarDARF={handleGerarDARF} /></TabsContent>
      </Tabs>
    </div>
  );
}

export default RetencoesFonte;
