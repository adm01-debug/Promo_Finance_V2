import { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Printer,
  Mail,
  ChevronDown,
  CreditCard,
  Users,
  ArrowUpDown,
  Clock,
} from 'lucide-react';
import { RelatoriosAgendados } from '@/components/relatorios/RelatoriosAgendados';
import { RelatorioDrillDown } from '@/components/relatorios/RelatorioDrillDown';
import { ExportRelatorioAvancadoPDF } from '@/components/relatorios/ExportRelatorioAvancadoPDF';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useEmpresas, useContasBancarias } from '@/hooks/useFinancialData';
import {
  useComparativoPeriodos,
  useFluxoMensal,
  useDespesasPorCategoria,
  useReceitasPorCliente,
  useInadimplenciaPorMes,
  useRelatorioKPIs,
} from '@/hooks/useRelatoriosData';
import { generateFluxoCaixaPDF, generateFluxoCaixaCSV } from '@/lib/pdf-generator';
import { RelatoriosKpiCards } from '@/components/relatorios/RelatoriosKpis';
import { RelatoriosVisaoGeral } from '@/components/relatorios/RelatoriosVisaoGeral';
import { RelatoriosFilters } from '@/components/relatorios/RelatoriosFilters';
import { RelatoriosComparativo } from '@/components/relatorios/RelatoriosComparativo';
import { RelatoriosDetalhado } from '@/components/relatorios/RelatoriosDetalhado';
import { RelatoriosModelos } from '@/components/relatorios/RelatoriosModelos';

const relatoriosDisponiveis = [
  { id: '1', nome: 'DRE - Demonstrativo de Resultados', categoria: 'Contábil', icon: FileText },
  { id: '2', nome: 'Fluxo de Caixa Realizado', categoria: 'Financeiro', icon: TrendingUp },
  { id: '3', nome: 'Contas a Receber por Vencimento', categoria: 'Financeiro', icon: Calendar },
  { id: '4', nome: 'Contas a Pagar por Fornecedor', categoria: 'Financeiro', icon: Users },
  { id: '5', nome: 'Análise de Inadimplência', categoria: 'Cobrança', icon: TrendingDown },
  { id: '6', nome: 'Centro de Custos Detalhado', categoria: 'Gerencial', icon: PieChartIcon },
  { id: '7', nome: 'Comparativo de Períodos', categoria: 'Gerencial', icon: BarChart3 },
  { id: '8', nome: 'Conciliação Bancária', categoria: 'Financeiro', icon: CreditCard },
];

export default function Relatorios() {
  const [periodoInicio, setPeriodoInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [periodoFim, setPeriodoFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('all');
  const [contaSelecionada, setContaSelecionada] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const { data: empresas } = useEmpresas();
  const { data: contasBancarias } = useContasBancarias();
  const { data: comparativoPeriodos, isLoading: loadingComparativo } = useComparativoPeriodos();
  const { data: fluxoMensal, isLoading: loadingFluxo } = useFluxoMensal();
  const { data: despesasPorCategoria, isLoading: loadingDespesas } = useDespesasPorCategoria();
  const { data: receitasPorCliente, isLoading: loadingReceitas } = useReceitasPorCliente();
  const { data: inadimplenciaPorMes, isLoading: loadingInadimplencia } = useInadimplenciaPorMes();
  const { data: kpis, isLoading: loadingKpis, refetch: refetchKpis } = useRelatorioKPIs(periodoInicio, periodoFim);

  const isLoading = loadingComparativo || loadingFluxo || loadingDespesas || loadingReceitas || loadingInadimplencia || loadingKpis;

  const handleExport = async (format: 'pdf' | 'excel') => {
    setIsGenerating(true);
    try {
      const fluxoData = (fluxoMensal || []).map(f => ({
        data: f.mes, receitas: f.receitas, despesas: f.despesas, saldo: f.saldo,
      }));
      if (format === 'pdf') generateFluxoCaixaPDF(fluxoData, 'Relatório Financeiro');
      else generateFluxoCaixaCSV(fluxoData);
      toast({ title: `Relatório exportado`, description: `O arquivo ${format.toUpperCase()} foi gerado com sucesso.` });
    } catch {
      toast({ title: 'Erro ao exportar', description: 'Não foi possível gerar o arquivo.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
    toast({ title: "Preparando impressão", description: "O relatório está sendo preparado para impressão." });
  };

  const handleEmail = () => {
    toast({ title: "Enviar por e-mail", description: "Configure os destinatários para enviar o relatório." });
  };

  const handleRefresh = () => {
    refetchKpis();
    toast({ title: "Atualizando dados", description: "Os relatórios estão sendo recarregados." });
  };

  const totalReceitas = kpis?.totalReceitas || 0;
  const totalDespesas = kpis?.totalDespesas || 0;
  const saldoPeriodo = kpis?.saldoPeriodo || 0;

  const crescimento = useMemo(() => {
    if (!comparativoPeriodos || comparativoPeriodos.length < 2) return 0;
    const ultimo = comparativoPeriodos[comparativoPeriodos.length - 1];
    if (ultimo.anterior === 0) return 0;
    return ((ultimo.atual - ultimo.anterior) / ultimo.anterior) * 100;
  }, [comparativoPeriodos]);

  const empresaNome = empresaSelecionada !== 'all'
    ? ((empresas || []).find(e => e.id === empresaSelecionada)?.nome_fantasia || (empresas || []).find(e => e.id === empresaSelecionada)?.razao_social || 'Empresa')
    : 'Todas as Empresas';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-md text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Análises financeiras e exportação de dados</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={isGenerating}>
                {isGenerating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Exportar
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer gap-2">
                <FileText className="h-4 w-4 text-destructive" />Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer gap-2">
                <FileSpreadsheet className="h-4 w-4 text-success" />Exportar Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ExportRelatorioAvancadoPDF
            tipo="fluxo"
            empresa={empresaNome}
            periodo={`${periodoInicio} a ${periodoFim}`}
            fluxoCaixa={(fluxoMensal || []).map(f => ({ data: f.mes, receitas: f.receitas, despesas: f.despesas, saldo: f.saldo }))}
          />
          <ExportRelatorioAvancadoPDF tipo="dre" empresa={empresaNome} periodo={`${periodoInicio} a ${periodoFim}`} />
          <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Imprimir</Button>
          <Button variant="outline" onClick={handleEmail}><Mail className="h-4 w-4 mr-2" />Enviar</Button>
        </div>
      </div>

      <RelatoriosFilters
        periodoInicio={periodoInicio}
        periodoFim={periodoFim}
        empresaSelecionada={empresaSelecionada}
        contaSelecionada={contaSelecionada}
        empresas={empresas || []}
        contasBancarias={contasBancarias || []}
        isLoading={isLoading}
        onPeriodoInicioChange={setPeriodoInicio}
        onPeriodoFimChange={setPeriodoFim}
        onEmpresaChange={setEmpresaSelecionada}
        onContaChange={setContaSelecionada}
        onRefresh={handleRefresh}
      />

      <RelatoriosKpiCards
        totalReceitas={totalReceitas}
        totalDespesas={totalDespesas}
        saldoPeriodo={saldoPeriodo}
        crescimento={crescimento}
        loadingKpis={loadingKpis}
        loadingComparativo={loadingComparativo}
      />

      <Tabs defaultValue="visao-geral" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visao-geral" className="gap-2"><BarChart3 className="h-4 w-4" />Visão Geral</TabsTrigger>
          <TabsTrigger value="drill-down" className="gap-2"><Filter className="h-4 w-4" />Drill-Down</TabsTrigger>
          <TabsTrigger value="comparativo" className="gap-2"><ArrowUpDown className="h-4 w-4" />Comparativo</TabsTrigger>
          <TabsTrigger value="detalhado" className="gap-2"><FileText className="h-4 w-4" />Detalhado</TabsTrigger>
          <TabsTrigger value="modelos" className="gap-2"><FileSpreadsheet className="h-4 w-4" />Modelos</TabsTrigger>
          <TabsTrigger value="agendados" className="gap-2"><Clock className="h-4 w-4" />Agendados</TabsTrigger>
        </TabsList>

        <TabsContent value="drill-down"><RelatorioDrillDown /></TabsContent>

        <TabsContent value="visao-geral">
          <RelatoriosVisaoGeral
            fluxoMensal={fluxoMensal}
            despesasPorCategoria={despesasPorCategoria}
            receitasPorCliente={receitasPorCliente}
            inadimplenciaPorMes={inadimplenciaPorMes}
            loadingFluxo={loadingFluxo}
            loadingDespesas={loadingDespesas}
          />
        </TabsContent>

        <TabsContent value="comparativo">
          <RelatoriosComparativo data={comparativoPeriodos} />
        </TabsContent>

        <TabsContent value="detalhado">
          <RelatoriosDetalhado />
        </TabsContent>

        <TabsContent value="modelos">
          <RelatoriosModelos modelos={relatoriosDisponiveis} />
        </TabsContent>

        <TabsContent value="agendados">
          <RelatoriosAgendados />
        </TabsContent>
      </Tabs>
    </div>
  );
}
