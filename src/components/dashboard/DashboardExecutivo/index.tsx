// REFATORAÇÃO: DashboardExecutivo (46 KB) → Múltiplos arquivos

// src/components/dashboard/DashboardExecutivo/index.tsx
import { MetricsCards } from './MetricsCards';
import { ChartSection } from './ChartSection';
import { RecentTransactions } from './RecentTransactions';
import { AlertsPanel } from './AlertsPanel';
import { useDashboardData } from './hooks/useDashboardData';

export function DashboardExecutivo() {
  const { metrics, charts, transactions, alerts, loading } = useDashboardData();

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <MetricsCards metrics={metrics} />
      <ChartSection charts={charts} />
      <div className="grid md:grid-cols-2 gap-6">
        <RecentTransactions transactions={transactions} />
        <AlertsPanel alerts={alerts} />
      </div>
    </div>
  );
}
