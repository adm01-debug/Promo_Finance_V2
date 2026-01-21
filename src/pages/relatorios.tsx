import { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Users,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn, formatCurrency } from '@/lib/utils';

type ReportPeriod = 'week' | 'month' | 'quarter' | 'year';

interface ReportCardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

function ReportCard({ title, value, change, changeLabel, icon, trend }: ReportCardProps) {
  const isPositive = trend === 'up';
  const isNeutral = trend === 'neutral';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>
        {!isNeutral && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-4 w-4" />
            ) : (
              <ArrowDownRight className="h-4 w-4" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{changeLabel}</p>
      </div>
    </div>
  );
}

interface ChartPlaceholderProps {
  title: string;
  subtitle?: string;
  height?: string;
}

function ChartPlaceholder({ title, subtitle, height = 'h-64' }: ChartPlaceholderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      <div
        className={cn(
          height,
          'bg-gray-100 dark:bg-gray-700/50 rounded-lg flex items-center justify-center'
        )}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Gráfico será renderizado aqui</p>
          <p className="text-xs mt-1">Integração com Recharts pendente</p>
        </div>
      </div>
    </div>
  );
}

export function RelatoriosPage() {
  const [period, setPeriod] = useState<ReportPeriod>('month');

  // Mock data - será substituído por dados reais
  const mockData = {
    receitas: 125000,
    despesas: 87500,
    lucro: 37500,
    margemLucro: 30,
    contasReceber: 45000,
    contasPagar: 32000,
    clientesAtivos: 156,
    fornecedoresAtivos: 42,
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    // TODO: Implementar exportação
    console.log(`Exportando relatório em ${format}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Análise financeira e indicadores de desempenho
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: 'week', label: 'Esta Semana' },
              { value: 'month', label: 'Este Mês' },
              { value: 'quarter', label: 'Este Trimestre' },
              { value: 'year', label: 'Este Ano' },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="w-40"
            leftElement={<Calendar className="h-4 w-4" />}
          />
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          title="Receitas"
          value={formatCurrency(mockData.receitas)}
          change={12.5}
          changeLabel="vs. período anterior"
          icon={<TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />}
          trend="up"
        />
        <ReportCard
          title="Despesas"
          value={formatCurrency(mockData.despesas)}
          change={-8.3}
          changeLabel="vs. período anterior"
          icon={<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
          trend="down"
        />
        <ReportCard
          title="Lucro Líquido"
          value={formatCurrency(mockData.lucro)}
          change={18.2}
          changeLabel="vs. período anterior"
          icon={<DollarSign className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
          trend="up"
        />
        <ReportCard
          title="Margem de Lucro"
          value={`${mockData.margemLucro}%`}
          change={5.1}
          changeLabel="vs. período anterior"
          icon={<PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
          trend="up"
        />
      </div>

      {/* Tabs for different report views */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" icon={<BarChart3 className="h-4 w-4" />}>
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="receivables" icon={<ArrowUpRight className="h-4 w-4" />}>
            Contas a Receber
          </TabsTrigger>
          <TabsTrigger value="payables" icon={<ArrowDownRight className="h-4 w-4" />}>
            Contas a Pagar
          </TabsTrigger>
          <TabsTrigger value="cashflow" icon={<TrendingUp className="h-4 w-4" />}>
            Fluxo de Caixa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPlaceholder
              title="Receitas vs Despesas"
              subtitle="Comparativo mensal"
              height="h-80"
            />
            <ChartPlaceholder
              title="Distribuição de Despesas"
              subtitle="Por categoria"
              height="h-80"
            />
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">A Receber</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(mockData.contasReceber)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">A Pagar</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(mockData.contasPagar)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Clientes Ativos</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {mockData.clientesAtivos}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fornecedores</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {mockData.fornecedoresAtivos}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="receivables">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPlaceholder
              title="Contas a Receber por Vencimento"
              subtitle="Distribuição por período"
            />
            <ChartPlaceholder
              title="Top 10 Clientes"
              subtitle="Por valor em aberto"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Aging de Recebíveis
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">A vencer</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(28000)}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">1-30 dias</p>
                <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                  {formatCurrency(12000)}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">31-60 dias</p>
                <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(3500)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">&gt;60 dias</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(1500)}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payables">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartPlaceholder
              title="Contas a Pagar por Categoria"
              subtitle="Distribuição de despesas"
            />
            <ChartPlaceholder
              title="Top 10 Fornecedores"
              subtitle="Por valor em aberto"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Próximos Vencimentos
            </h3>
            <div className="space-y-3">
              {[
                { desc: 'Aluguel - Escritório', valor: 5500, venc: '25/01/2026' },
                { desc: 'Energia Elétrica', valor: 1200, venc: '28/01/2026' },
                { desc: 'Internet e Telefonia', valor: 450, venc: '30/01/2026' },
                { desc: 'Fornecedor ABC Ltda', valor: 8500, venc: '05/02/2026' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.desc}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Vence em {item.venc}</p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.valor)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cashflow">
          <ChartPlaceholder
            title="Fluxo de Caixa Projetado"
            subtitle="Próximos 6 meses"
            height="h-96"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Atual</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(85000)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Entradas Previstas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCurrency(45000)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Saídas Previstas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
                {formatCurrency(32000)}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
