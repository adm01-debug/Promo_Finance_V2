import { motion } from 'framer-motion';
import {
  Building2,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BIMainKpis, BISecondaryKpis } from '@/components/bi/BIKpis';
import { BIEvolucaoChart, BIAgingChart, BICentrosChart } from '@/components/bi/BICharts';
import { BIEmpresasTab } from '@/components/bi/BIEmpresasTab';
import { FuturisticDashboard } from '@/components/bi/FuturisticDashboard';
import { InadimplenciaSegmentada } from '@/components/analytics/InadimplenciaSegmentada';
import { BenchmarkingSetorial } from '@/components/analytics/BenchmarkingSetorial';
import { HistoricoAnalisesPreditivasPanel } from '@/components/analytics/HistoricoAnalisesPreditivasPanel';
import { BIDrillDown } from '@/components/bi/BIDrillDown';
import { containerVariants, itemVariants } from './BI.helpers';
import { BIFuturistaConteudo } from './BIFuturistaConteudo';

interface BIFuturistaProps {
  futuristicMode: boolean;
  empresaId: string;
  empresas: {
    aliquota_rat: number | null;
    aliquota_terceiros: number | null;
    ativo: boolean;
    bairro: string | null;
    cep: string | null;
    cidade: string | null;
    cnae_principal: string | null;
    cnpj: string | null;
    codigo_fpas: string | null;
    cor_hex: string | null;
    created_at: string;
    email: string | null;
    endereco: string | null;
    estado: string | null;
    id: string;
    inscricao_estadual: string | null;
    is_padrao: boolean;
    logo_url: string | null;
    nome_fantasia: string | null;
    razao_social: string;
    regime_tributario: string | null;
    sigla: string | null;
    telefone: string | null;
    user_id: string;
  }[];
  setFuturisticMode: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setEmpresaId: import('react').Dispatch<import('react').SetStateAction<string>>;
  filters: { centroCustoId: string; contaBancariaId: string };
  setFilters: import('react').Dispatch<
    import('react').SetStateAction<{
      centroCustoId: string;
      contaBancariaId: string;
    }>
  >;
  centrosCusto: {
    ativo: boolean | null;
    codigo: string | null;
    created_at: string | null;
    descricao: string | null;
    empresa_id: string | null;
    id: string;
    nome: string;
    orcamento_previsto: number | null;
    orcamento_realizado: number | null;
    parent_id: string | null;
    responsavel: string | null;
    tipo: string | null;
    updated_at: string | null;
    user_id: string | null;
  }[];
  contasBancarias: import('@/hooks/financial/types').ContaBancariaComRegras[];
  usarPeriodoCustom: boolean;
  periodo: string;
  setUsarPeriodoCustom: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setPeriodo: import('react').Dispatch<import('react').SetStateAction<string>>;
  setDataInicio: import('react').Dispatch<import('react').SetStateAction<Date>>;
  setDataFim: import('react').Dispatch<import('react').SetStateAction<Date>>;
  dataInicio: Date;
  dataFim: Date;
  kpis: {
    saldoTotal: number;
    totalReceber: number;
    totalPagar: number;
    totalVencidasReceber: number;
    inadimplencia: number;
    receitaMes: number;
    despesaMes: number;
    lucroMes: number;
    margemLucro: number;
    variacaoReceita: number;
    liquidez: number;
    clientesAtivos: number;
    contasAtivas: number;
  };
  evolucaoMensal: {
    mes: string;
    receitas: number;
    despesas: number;
    lucro: number;
    margem: number;
  }[];
  setDrillDownItem: import('react').Dispatch<import('react').SetStateAction<string>>;
  statusReceber: { name: string; value: number; color: string }[];
  agingReceber: { faixa: string; valor: number; fill: string }[];
  topClientes: { nome: string; valor: number }[];
  distribuicaoCentros: { nome: string; valor: number }[];
  comparativoEmpresas: {
    id: string;
    nome: string;
    cnpj: string;
    receitas: number;
    despesas: number;
    lucro: number;
    margem: number;
    saldo: number;
    aReceber: number;
    aPagar: number;
    inadimplencia: number;
    liquidez: number;
    contasCount: number;
    ticketMedio: number;
    saldoProjetado: number;
  }[];
  drillDownItem: string;
  drillDownData:
    | {
        id: string;
        fornecedor_nome: string;
        descricao: string;
        data_vencimento: string;
        data_pagamento: string;
        created_at: string;
        status: string;
        valor: number;
      }[]
    | {
        id: string;
        cliente_nome: string;
        descricao: string;
        data_vencimento: string;
        created_at: string;
        status: string;
        valor: number;
      }[];
}

export function BIFuturista({
  futuristicMode,
  empresaId,
  empresas,
  setFuturisticMode,
  setEmpresaId,
  filters,
  setFilters,
  centrosCusto,
  contasBancarias,
  usarPeriodoCustom,
  periodo,
  setUsarPeriodoCustom,
  setPeriodo,
  setDataInicio,
  setDataFim,
  dataInicio,
  dataFim,
  kpis,
  evolucaoMensal,
  setDrillDownItem,
  statusReceber,
  agingReceber,
  topClientes,
  distribuicaoCentros,
  comparativoEmpresas,
  drillDownItem,
  drillDownData,
}: BIFuturistaProps) {
  return (
    <motion.div
      className={cn(
        'space-y-6 p-6 min-h-screen transition-all duration-1000 relative',
        futuristicMode ? 'bg-background text-foreground' : 'bg-background'
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {futuristicMode && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-success/5 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--line)_1px,transparent_1px),linear-gradient(to_bottom,var(--line)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
      )}

      <BIFuturistaConteudo
        futuristicMode={futuristicMode}
        empresaId={empresaId}
        empresas={empresas}
        setFuturisticMode={setFuturisticMode}
        setEmpresaId={setEmpresaId}
        filters={filters}
        setFilters={setFilters}
        centrosCusto={centrosCusto}
        contasBancarias={contasBancarias}
        usarPeriodoCustom={usarPeriodoCustom}
        periodo={periodo}
        setUsarPeriodoCustom={setUsarPeriodoCustom}
        setPeriodo={setPeriodo}
        setDataInicio={setDataInicio}
        setDataFim={setDataFim}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />

      {futuristicMode ? (
        <FuturisticDashboard
          kpis={kpis}
          evolucaoMensal={evolucaoMensal}
          onMetricClick={(metric: string) => setDrillDownItem(metric)}
        />
      ) : (
        <>
          <BIMainKpis kpis={kpis} />
          <BISecondaryKpis kpis={kpis} />

          <Tabs defaultValue="evolucao" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full max-w-lg">
              <TabsTrigger value="evolucao" className="flex items-center gap-2">
                <LineChartIcon className="w-4 h-4" />
                Evolução
              </TabsTrigger>
              <TabsTrigger value="aging" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Aging
              </TabsTrigger>
              <TabsTrigger value="centros" className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" />
                Custos
              </TabsTrigger>
              <TabsTrigger value="empresas" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Empresas
              </TabsTrigger>
            </TabsList>
            <TabsContent value="evolucao">
              <BIEvolucaoChart evolucaoMensal={evolucaoMensal} statusReceber={statusReceber} />
            </TabsContent>
            <TabsContent value="aging">
              <BIAgingChart agingReceber={agingReceber} topClientes={topClientes} />
            </TabsContent>
            <TabsContent value="centros">
              <BICentrosChart distribuicaoCentros={distribuicaoCentros} />
            </TabsContent>
            <TabsContent value="empresas">
              <BIEmpresasTab comparativoEmpresas={comparativoEmpresas} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <motion.div variants={itemVariants} className="mt-6 relative z-10">
        <Card
          className={cn(
            'transition-all duration-500',
            futuristicMode ? 'premium-card border-border bg-card/40 backdrop-blur-xl' : ''
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Inadimplência Segmentada
            </CardTitle>
            <CardDescription>
              Análise de inadimplência por ramo de atividade e vendedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InadimplenciaSegmentada />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6 relative z-10">
        <div
          className={cn(
            'transition-all duration-500',
            futuristicMode
              ? 'premium-card p-0 border-border overflow-hidden bg-card/40 backdrop-blur-xl'
              : ''
          )}
        >
          <BenchmarkingSetorial />
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-6 relative z-10">
        <div
          className={cn(
            'transition-all duration-500',
            futuristicMode
              ? 'premium-card p-0 border-border overflow-hidden bg-card/40 backdrop-blur-xl'
              : ''
          )}
        >
          <HistoricoAnalisesPreditivasPanel />
        </div>
      </motion.div>
      <BIDrillDown
        isOpen={!!drillDownItem}
        onClose={() => setDrillDownItem(null)}
        title={
          drillDownItem === 'receber'
            ? 'Detalhamento: Contas a Receber'
            : drillDownItem === 'pagar'
              ? 'Detalhamento: Contas a Pagar'
              : drillDownItem === 'atraso'
                ? 'Detalhamento: Pagamentos em Atraso'
                : 'Detalhamento de Lançamentos'
        }
        type={drillDownItem === 'receber' || drillDownItem === 'atraso' ? 'receber' : 'pagar'}
        data={drillDownData}
      />
    </motion.div>
  );
}
