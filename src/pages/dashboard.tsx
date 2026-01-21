import { useContasPagarTotals, useContasPagarOverdue } from '@/hooks/useContasPagar';
import { useContasReceberTotals, useContasReceberOverdue } from '@/hooks/useContasReceber';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/common/page-header';
import { StatCard } from '@/components/common/stat-card';
import { Card } from '@/components/common/card';
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/router/routes';

export default function Dashboard() {
  const { data: totaisPagar, isLoading: loadingPagar } = useContasPagarTotals();
  const { data: totaisReceber, isLoading: loadingReceber } = useContasReceberTotals();
  const { data: vencidasPagar } = useContasPagarOverdue();
  const { data: vencidasReceber } = useContasReceberOverdue();

  const saldo = (totaisReceber?.recebido ?? 0) - (totaisPagar?.pago ?? 0);
  const isLoading = loadingPagar || loadingReceber;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Visão geral das suas finanças"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="A Receber"
          value={formatCurrency(totaisReceber?.pendente ?? 0)}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 12, isPositive: true }}
          loading={isLoading}
          variant="success"
        />
        <StatCard
          title="A Pagar"
          value={formatCurrency(totaisPagar?.pendente ?? 0)}
          icon={<TrendingDown className="h-5 w-5" />}
          trend={{ value: 8, isPositive: false }}
          loading={isLoading}
          variant="danger"
        />
        <StatCard
          title="Saldo"
          value={formatCurrency(saldo)}
          icon={<DollarSign className="h-5 w-5" />}
          loading={isLoading}
          variant={saldo >= 0 ? 'success' : 'danger'}
        />
        <StatCard
          title="Vencidas"
          value={String((vencidasPagar?.length ?? 0) + (vencidasReceber?.length ?? 0))}
          icon={<AlertTriangle className="h-5 w-5" />}
          loading={isLoading}
          variant="warning"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Contas a Pagar" className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totaisPagar?.pendente ?? 0)}
                </p>
                <p className="text-sm text-gray-500">Pendentes</p>
              </div>
              <Link
                to={ROUTES.CONTAS_PAGAR}
                className="flex items-center text-sm font-medium text-primary hover:underline"
              >
                Ver todas
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            {vencidasPagar && vencidasPagar.length > 0 && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  <AlertTriangle className="mr-1 inline h-4 w-4" />
                  {vencidasPagar.length} conta(s) vencida(s)
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card title="Contas a Receber" className="p-0">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totaisReceber?.pendente ?? 0)}
                </p>
                <p className="text-sm text-gray-500">Pendentes</p>
              </div>
              <Link
                to={ROUTES.CONTAS_RECEBER}
                className="flex items-center text-sm font-medium text-primary hover:underline"
              >
                Ver todas
                <ArrowDownRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            {vencidasReceber && vencidasReceber.length > 0 && (
              <div className="mt-4 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  <AlertTriangle className="mr-1 inline h-4 w-4" />
                  {vencidasReceber.length} conta(s) vencida(s)
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card title="Atividade Recente">
        <div className="text-center py-8 text-gray-500">
          <p>Nenhuma atividade recente</p>
        </div>
      </Card>
    </div>
  );
}
