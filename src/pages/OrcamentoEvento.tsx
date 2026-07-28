import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Target, BarChart3, PieChart as PieChartIcon, Loader2, Filter, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InsightsIA } from '@/components/relatorios/InsightsIA';
import { OrcamentoKPIs } from '@/components/orcamento/OrcamentoKPIs';
import { OrcamentoCardsView, type CentroCustoComGastos } from '@/components/orcamento/OrcamentoCardsView';
import { OrcamentoChartsView } from '@/components/orcamento/OrcamentoChartsView';

export default function OrcamentoEvento() {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [ordenacao, setOrdenacao] = useState<string>('nome');

  const { data: centrosComGastos, isLoading } = useQuery({
    queryKey: ['orcamento-vs-realizado'],
    queryFn: async () => {
      const [centrosRes, pagarRes, receberRes] = await Promise.all([
        supabase.from('centros_custo').select('*').eq('ativo', true).order('nome'),
        supabase.from('contas_pagar').select('centro_custo_id, valor, valor_pago, status'),
        supabase.from('contas_receber').select('centro_custo_id, valor, valor_recebido, status'),
      ]);

      const centros = centrosRes.data || [];
      const pagar = pagarRes.data || [];
      const receber = receberRes.data || [];

      return centros.map((cc): CentroCustoComGastos => {
        const contasPagar = pagar.filter(p => p.centro_custo_id === cc.id);
        const contasReceber = receber.filter(r => r.centro_custo_id === cc.id);

        const gastoPagar = contasPagar.reduce((acc, c) => acc + (c.valor_pago || c.valor || 0), 0);
        const gastoReceber = contasReceber
          .filter(c => c.status === 'pago')
          .reduce((acc, c) => acc + (c.valor_recebido || c.valor || 0), 0);

        const totalGasto = gastoPagar;
        const orcamento = cc.orcamento_previsto || 0;
        const percentual = orcamento > 0 ? (totalGasto / orcamento) * 100 : 0;

        return {
          id: cc.id,
          codigo: cc.codigo,
          nome: cc.nome,
          tipo: cc.tipo,
          responsavel: cc.responsavel,
          orcamento_previsto: orcamento,
          orcamento_realizado: cc.orcamento_realizado || 0,
          gasto_real_pagar: gastoPagar,
          gasto_real_receber: gastoReceber,
          qtd_pagar: contasPagar.length,
          qtd_receber: contasReceber.length,
          margem: gastoReceber - gastoPagar,
          percentual_usado: percentual,
          status: percentual > 100 ? 'estouro' : percentual > 80 ? 'atencao' : 'ok',
        };
      });
    },
  });

  const kpis = useMemo(() => {
    if (!centrosComGastos) return null;
    const totalOrcamento = centrosComGastos.reduce((a, c) => a + c.orcamento_previsto, 0);
    const totalGasto = centrosComGastos.reduce((a, c) => a + c.gasto_real_pagar, 0);
    const totalReceita = centrosComGastos.reduce((a, c) => a + c.gasto_real_receber, 0);
    const estourados = centrosComGastos.filter(c => c.status === 'estouro').length;
    const atencao = centrosComGastos.filter(c => c.status === 'atencao').length;
    return { totalOrcamento, totalGasto, totalReceita, estourados, atencao, disponivel: totalOrcamento - totalGasto };
  }, [centrosComGastos]);

  const centrosFiltrados = useMemo(() => {
    if (!centrosComGastos) return [];
    let filtered = [...centrosComGastos];
    if (filtroStatus !== 'todos') {
      filtered = filtered.filter(c => c.status === filtroStatus);
    }
    filtered.sort((a, b) => {
      switch (ordenacao) {
        case 'percentual': return b.percentual_usado - a.percentual_usado;
        case 'orcamento': return b.orcamento_previsto - a.orcamento_previsto;
        case 'gasto': return b.gasto_real_pagar - a.gasto_real_pagar;
        default: return a.nome.localeCompare(b.nome);
      }
    });
    return filtered;
  }, [centrosComGastos, filtroStatus, ordenacao]);

  const chartData = useMemo(() => {
    return centrosFiltrados.map(c => ({
      nome: c.codigo,
      nomeCompleto: c.nome,
      orcamento: c.orcamento_previsto,
      realizado: c.gasto_real_pagar,
      receita: c.gasto_real_receber,
      disponivel: Math.max(0, c.orcamento_previsto - c.gasto_real_pagar),
    }));
  }, [centrosFiltrados]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              Orçamento vs Realizado
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Acompanhe a execução orçamentária por centro de custo/evento em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ok">No Orçamento</SelectItem>
                <SelectItem value="atencao">Atenção</SelectItem>
                <SelectItem value="estouro">Estourado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome">Por Nome</SelectItem>
                <SelectItem value="percentual">Por % Usado</SelectItem>
                <SelectItem value="orcamento">Por Orçamento</SelectItem>
                <SelectItem value="gasto">Por Gasto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {kpis && <OrcamentoKPIs kpis={kpis} />}

        {kpis && centrosComGastos && (
          <InsightsIA
            dados={{
              total_centros: centrosComGastos.length,
              orcamento_total: kpis.totalOrcamento,
              gasto_total: kpis.totalGasto,
              receita_total: kpis.totalReceita,
              saldo_disponivel: kpis.disponivel,
              centros_estourados: kpis.estourados,
              centros_atencao: kpis.atencao,
              detalhes: centrosComGastos.map(c => ({
                nome: c.nome,
                orcamento: c.orcamento_previsto,
                gasto: c.gasto_real_pagar,
                receita: c.gasto_real_receber,
                percentual: c.percentual_usado,
                margem: c.margem,
              })),
            }}
            contexto="Análise de orçamento vs realizado por centro de custo/evento. Empresa de eventos com prazos curtos."
          />
        )}

        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cards"><BarChart3 className="h-4 w-4 mr-2" />Cards</TabsTrigger>
            <TabsTrigger value="grafico"><PieChartIcon className="h-4 w-4 mr-2" />Gráficos</TabsTrigger>
          </TabsList>

          <TabsContent value="cards">
            <OrcamentoCardsView centros={centrosFiltrados} />
          </TabsContent>

          <TabsContent value="grafico" className="space-y-4">
            <OrcamentoChartsView chartData={chartData} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
