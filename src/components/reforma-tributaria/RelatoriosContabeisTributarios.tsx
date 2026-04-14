import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Printer, BarChart3, TrendingUp, TrendingDown, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { useApuracoesTributarias } from '@/hooks/useApuracoesTributarias';
import { useCreditosTributarios } from '@/hooks/useCreditosTributarios';
import { useOperacoesTributaveis } from '@/hooks/useOperacoesTributaveis';
import { DRETributarioTab } from './relatorios-tributarios/DRETributarioTab';
import { CargaEfetivaTab } from './relatorios-tributarios/CargaEfetivaTab';

const CORES_GRAFICO = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(220, 70%, 50%)', 'hsl(160, 70%, 40%)', 'hsl(280, 70%, 50%)', 'hsl(30, 80%, 50%)'];
type TipoRelatorio = 'dre-tributario' | 'balancete' | 'comparativo' | 'creditos' | 'carga-efetiva';

export function RelatoriosContabeisTributarios() {
  const [empresaId, setEmpresaId] = useState<string>('');
  const [periodoInicio, setPeriodoInicio] = useState(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM'));
  const [periodoFim, setPeriodoFim] = useState(format(new Date(), 'yyyy-MM'));
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('dre-tributario');

  const { data: empresas = [] } = useAllEmpresas();
  const { apuracoes } = useApuracoesTributarias(empresaId || undefined);
  const { creditos } = useCreditosTributarios(empresaId || undefined);
  const { operacoes } = useOperacoesTributaveis(empresaId || undefined);
  const empresaSelecionada = empresas.find(e => e.id === empresaId);

  const apuracoesPeriodo = useMemo(() => apuracoes.filter(a => a.competencia >= periodoInicio && a.competencia <= periodoFim), [apuracoes, periodoInicio, periodoFim]);

  const totais = useMemo(() => apuracoesPeriodo.reduce((acc, ap) => ({
    cbsDebitos: acc.cbsDebitos + (ap.cbs_debitos || 0), cbsCreditos: acc.cbsCreditos + (ap.cbs_creditos || 0), cbsAPagar: acc.cbsAPagar + (ap.cbs_a_pagar || 0),
    ibsDebitos: acc.ibsDebitos + (ap.ibs_debitos || 0), ibsCreditos: acc.ibsCreditos + (ap.ibs_creditos || 0), ibsAPagar: acc.ibsAPagar + (ap.ibs_a_pagar || 0),
    isAPagar: acc.isAPagar + (ap.is_a_pagar || 0), pisResidual: acc.pisResidual + (ap.pis_residual || 0), cofinsResidual: acc.cofinsResidual + (ap.cofins_residual || 0),
    icmsResidual: acc.icmsResidual + (ap.icms_residual || 0), issResidual: acc.issResidual + (ap.iss_residual || 0),
  }), { cbsDebitos: 0, cbsCreditos: 0, cbsAPagar: 0, ibsDebitos: 0, ibsCreditos: 0, ibsAPagar: 0, isAPagar: 0, pisResidual: 0, cofinsResidual: 0, icmsResidual: 0, issResidual: 0 }), [apuracoesPeriodo]);

  const faturamentoPeriodo = useMemo(() => operacoes.filter(o => ['venda', 'servico_prestado', 'exportacao'].includes(o.tipo_operacao)).filter(o => o.data_operacao.substring(0, 7) >= periodoInicio && o.data_operacao.substring(0, 7) <= periodoFim).reduce((sum, o) => sum + o.valor_operacao, 0), [operacoes, periodoInicio, periodoFim]);

  const cargaTributariaEfetiva = faturamentoPeriodo > 0 ? ((totais.cbsAPagar + totais.ibsAPagar + totais.isAPagar + totais.pisResidual + totais.cofinsResidual + totais.icmsResidual + totais.issResidual) / faturamentoPeriodo) * 100 : 0;

  const dadosDistribuicao = [{ name: 'CBS', value: totais.cbsAPagar }, { name: 'IBS', value: totais.ibsAPagar }, { name: 'IS', value: totais.isAPagar }, { name: 'PIS Res.', value: totais.pisResidual }, { name: 'COFINS Res.', value: totais.cofinsResidual }, { name: 'ICMS Res.', value: totais.icmsResidual }].filter(d => d.value > 0);

  const dadosEvolucao = apuracoesPeriodo.map(ap => ({ competencia: ap.competencia, cbs: ap.cbs_a_pagar || 0, ibs: ap.ibs_a_pagar || 0, residuais: (ap.pis_residual || 0) + (ap.cofins_residual || 0) + (ap.icms_residual || 0), total: (ap.cbs_a_pagar || 0) + (ap.ibs_a_pagar || 0) + (ap.is_a_pagar || 0) + (ap.pis_residual || 0) + (ap.cofins_residual || 0) + (ap.icms_residual || 0) }));

  const linhasDRE = [
    { grupo: 'RECEITAS', nivel: 0, bold: true }, { grupo: 'Faturamento Bruto', nivel: 1, valor: faturamentoPeriodo }, { grupo: '', nivel: 0, separador: true },
    { grupo: 'TRIBUTOS SOBRE VENDAS', nivel: 0, bold: true }, { grupo: 'CBS - Débitos', nivel: 1, valor: -totais.cbsDebitos }, { grupo: 'IBS - Débitos', nivel: 1, valor: -totais.ibsDebitos },
    { grupo: 'IS - Imposto Seletivo', nivel: 1, valor: -totais.isAPagar }, { grupo: 'PIS (Residual)', nivel: 1, valor: -totais.pisResidual }, { grupo: 'COFINS (Residual)', nivel: 1, valor: -totais.cofinsResidual },
    { grupo: 'ICMS (Residual)', nivel: 1, valor: -totais.icmsResidual }, { grupo: 'ISS (Residual)', nivel: 1, valor: -totais.issResidual }, { grupo: '', nivel: 0, separador: true },
    { grupo: 'CRÉDITOS RECUPERADOS', nivel: 0, bold: true }, { grupo: 'CBS - Créditos', nivel: 1, valor: totais.cbsCreditos }, { grupo: 'IBS - Créditos', nivel: 1, valor: totais.ibsCreditos },
    { grupo: '', nivel: 0, separador: true }, { grupo: 'TRIBUTOS LÍQUIDOS A RECOLHER', nivel: 0, bold: true, destaque: true },
    { grupo: 'CBS a Recolher', nivel: 1, valor: -totais.cbsAPagar }, { grupo: 'IBS a Recolher', nivel: 1, valor: -totais.ibsAPagar }, { grupo: 'IS a Recolher', nivel: 1, valor: -totais.isAPagar },
    { grupo: 'Tributos Residuais', nivel: 1, valor: -(totais.pisResidual + totais.cofinsResidual + totais.icmsResidual + totais.issResidual) }, { grupo: '', nivel: 0, separador: true },
    { grupo: 'TOTAL TRIBUTOS', nivel: 0, bold: true, destaque: true, valor: -(totais.cbsAPagar + totais.ibsAPagar + totais.isAPagar + totais.pisResidual + totais.cofinsResidual + totais.icmsResidual + totais.issResidual) },
    { grupo: 'Carga Tributária Efetiva', nivel: 0, percentual: cargaTributariaEfetiva },
  ];

  const handleExportar = (formato: 'pdf' | 'excel') => toast.info(`Exportando relatório em formato ${formato.toUpperCase()}...`);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-4"><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Relatórios Contábeis Tributários</CardTitle><CardDescription>DRE Tributário, Balancete e Análises de Carga Tributária</CardDescription></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2 min-w-48"><Label>Empresa</Label><Select value={empresaId} onValueChange={setEmpresaId}><SelectTrigger><SelectValue placeholder="Selecione a empresa" /></SelectTrigger><SelectContent>{empresas.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.razao_social}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Período Inicial</Label><Input type="month" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} className="w-36" /></div>
            <div className="space-y-2"><Label>Período Final</Label><Input type="month" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} className="w-36" /></div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => handleExportar('excel')}><Download className="h-4 w-4 mr-2" />Excel</Button><Button variant="outline" onClick={() => handleExportar('pdf')}><Printer className="h-4 w-4 mr-2" />PDF</Button></div>
          </div>
        </CardContent>
      </Card>

      {empresaId && (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Calculator className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Carga Efetiva</p><p className="text-2xl font-bold">{cargaTributariaEfetiva.toFixed(2)}%</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingDown className="h-8 w-8 text-destructive" /><div><p className="text-sm text-muted-foreground">Total Tributos</p><p className="text-2xl font-bold">{formatCurrency(totais.cbsAPagar + totais.ibsAPagar + totais.isAPagar)}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><TrendingUp className="h-8 w-8 text-success" /><div><p className="text-sm text-muted-foreground">Créditos Período</p><p className="text-2xl font-bold">{formatCurrency(totais.cbsCreditos + totais.ibsCreditos)}</p></div></div></CardContent></Card>
            <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><BarChart3 className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Faturamento</p><p className="text-2xl font-bold">{formatCurrency(faturamentoPeriodo)}</p></div></div></CardContent></Card>
          </div>

          {/* Tabs */}
          <Tabs value={tipoRelatorio} onValueChange={(v) => setTipoRelatorio(v as TipoRelatorio)}>
            <TabsList><TabsTrigger value="dre-tributario">DRE Tributário</TabsTrigger><TabsTrigger value="balancete">Balancete</TabsTrigger><TabsTrigger value="comparativo">Evolução</TabsTrigger><TabsTrigger value="creditos">Créditos</TabsTrigger><TabsTrigger value="carga-efetiva">Carga Efetiva</TabsTrigger></TabsList>

            <TabsContent value="dre-tributario"><DRETributarioTab linhasDRE={linhasDRE} empresaNome={empresaSelecionada?.razao_social || ''} periodoInicio={periodoInicio} periodoFim={periodoFim} faturamentoPeriodo={faturamentoPeriodo} /></TabsContent>

            {/* Balancete */}
            <TabsContent value="balancete">
              <div className="grid gap-6 md:grid-cols-2">
                <Card><CardHeader><CardTitle className="text-lg">Débitos e Créditos</CardTitle></CardHeader><CardContent>
                  <Table><TableHeader><TableRow><TableHead>Tributo</TableHead><TableHead className="text-right">Débitos</TableHead><TableHead className="text-right">Créditos</TableHead><TableHead className="text-right">Saldo</TableHead></TableRow></TableHeader>
                    <TableBody>
                      <TableRow><TableCell className="font-medium">CBS</TableCell><TableCell className="text-right text-red-600">{formatCurrency(totais.cbsDebitos)}</TableCell><TableCell className="text-right text-green-600">{formatCurrency(totais.cbsCreditos)}</TableCell><TableCell className="text-right font-medium">{formatCurrency(totais.cbsAPagar)}</TableCell></TableRow>
                      <TableRow><TableCell className="font-medium">IBS</TableCell><TableCell className="text-right text-red-600">{formatCurrency(totais.ibsDebitos)}</TableCell><TableCell className="text-right text-green-600">{formatCurrency(totais.ibsCreditos)}</TableCell><TableCell className="text-right font-medium">{formatCurrency(totais.ibsAPagar)}</TableCell></TableRow>
                      <TableRow><TableCell className="font-medium">IS</TableCell><TableCell className="text-right text-red-600">{formatCurrency(totais.isAPagar)}</TableCell><TableCell className="text-right">-</TableCell><TableCell className="text-right font-medium">{formatCurrency(totais.isAPagar)}</TableCell></TableRow>
                      <TableRow className="bg-muted/50"><TableCell className="font-bold">TOTAL</TableCell><TableCell className="text-right font-bold text-red-600">{formatCurrency(totais.cbsDebitos + totais.ibsDebitos + totais.isAPagar)}</TableCell><TableCell className="text-right font-bold text-green-600">{formatCurrency(totais.cbsCreditos + totais.ibsCreditos)}</TableCell><TableCell className="text-right font-bold">{formatCurrency(totais.cbsAPagar + totais.ibsAPagar + totais.isAPagar)}</TableCell></TableRow>
                    </TableBody></Table>
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-lg">Distribuição por Tributo</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={300}><RePieChart><Pie data={dadosDistribuicao} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} dataKey="value">{dadosDistribuicao.map((_, index) => <Cell key={`cell-${index}`} fill={CORES_GRAFICO[index % CORES_GRAFICO.length]} />)}</Pie><Tooltip formatter={(value: number) => formatCurrency(value)} /></RePieChart></ResponsiveContainer>
                </CardContent></Card>
              </div>
            </TabsContent>

            {/* Evolução */}
            <TabsContent value="comparativo"><Card><CardHeader><CardTitle className="text-lg">Evolução Mensal</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={400}><BarChart data={dadosEvolucao}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="competencia" /><YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(value: number) => formatCurrency(value)} /><Legend /><Bar dataKey="cbs" name="CBS" stackId="a" fill={CORES_GRAFICO[0]} /><Bar dataKey="ibs" name="IBS" stackId="a" fill={CORES_GRAFICO[1]} /><Bar dataKey="residuais" name="Residuais" stackId="a" fill={CORES_GRAFICO[2]} /></BarChart></ResponsiveContainer>
            </CardContent></Card></TabsContent>

            {/* Créditos */}
            <TabsContent value="creditos"><Card><CardHeader><CardTitle className="text-lg">Análise de Créditos Tributários</CardTitle></CardHeader><CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="p-4 bg-success/10 rounded-lg"><p className="text-sm text-muted-foreground">Créditos Gerados</p><p className="text-2xl font-bold text-success">{formatCurrency(totais.cbsCreditos + totais.ibsCreditos)}</p></div>
                <div className="p-4 bg-primary/10 rounded-lg"><p className="text-sm text-muted-foreground">Créditos Utilizados</p><p className="text-2xl font-bold text-primary">{formatCurrency(totais.cbsCreditos + totais.ibsCreditos)}</p></div>
                <div className="p-4 bg-secondary/10 rounded-lg"><p className="text-sm text-muted-foreground">Saldo Disponível</p><p className="text-2xl font-bold text-secondary">{formatCurrency(creditos.filter(c => c.status === 'disponivel').reduce((s, c) => s + (c.saldo_disponivel || 0), 0))}</p></div>
              </div>
              <Table><TableHeader><TableRow><TableHead>Tributo</TableHead><TableHead>Tipo</TableHead><TableHead>Competência</TableHead><TableHead className="text-right">Valor Original</TableHead><TableHead className="text-right">Saldo</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{creditos.slice(0, 10).map((credito) => (
                  <TableRow key={credito.id}><TableCell><Badge variant="outline">{credito.tipo_tributo}</Badge></TableCell><TableCell>{credito.tipo_credito}</TableCell><TableCell>{credito.competencia_origem}</TableCell><TableCell className="text-right">{formatCurrency(credito.valor_credito)}</TableCell><TableCell className="text-right font-medium">{formatCurrency(credito.saldo_disponivel || 0)}</TableCell><TableCell><Badge variant={credito.status === 'disponivel' ? 'default' : 'secondary'}>{credito.status}</Badge></TableCell></TableRow>
                ))}</TableBody></Table>
            </CardContent></Card></TabsContent>

            <TabsContent value="carga-efetiva"><CargaEfetivaTab totais={totais} faturamentoPeriodo={faturamentoPeriodo} cargaTributariaEfetiva={cargaTributariaEfetiva} /></TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

export default RelatoriosContabeisTributarios;
