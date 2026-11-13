import { Wallet, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { HeroKPICard, HeroKPIGrid } from './HeroKPICards';

interface DashboardExecutivoConteudoProps {
  metrics: ReturnType<typeof import('@/hooks/useDashboardMetrics').useDashboardMetrics>;
  inadimplenciaBadge: string | undefined;
  inadimplenciaBadgeVariant: 'destructive' | 'secondary';
}

export function DashboardExecutivoConteudo({
  metrics,
  inadimplenciaBadge,
  inadimplenciaBadgeVariant,
}: DashboardExecutivoConteudoProps) {
  return (
    <HeroKPIGrid layout="hero-first">
      <HeroKPICard
        title="Saldo Consolidado"
        value={metrics.saldoTotal}
        icon={Wallet}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
        accentColor="hsl(221 100% 50%)"
        href="/contas-bancarias"
        size="hero"
        badge={`${metrics.contasBancariasFiltradas.length} contas ativas`}
        tooltip="Saldo total disponível em todas as contas conectadas"
      />
      <HeroKPICard
        title="Previsão de Recebimento"
        value={metrics.totalReceber}
        previousValue={metrics.totalReceber - metrics.receitasMes}
        icon={ArrowDownCircle}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
        accentColor="hsl(150, 70%, 42%)"
        href="/contas-receber"
        size="primary"
        badge={
          metrics.receitasMes > 0 ? formatCurrency(metrics.receitasMes) + ' recebido' : undefined
        }
      />
      <HeroKPICard
        title="Compromissos a Pagar"
        value={metrics.totalPagar}
        previousValue={metrics.totalPagar - metrics.despesasMes}
        icon={ArrowUpCircle}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
        accentColor="hsl(0, 78%, 55%)"
        href="/contas-pagar"
        size="primary"
        badge={metrics.despesasMes > 0 ? formatCurrency(metrics.despesasMes) + ' pago' : undefined}
      />
      <HeroKPICard
        title="Índice de Inadimplência"
        value={metrics.inadimplencia}
        icon={AlertTriangle}
        iconColor={
          metrics.inadimplencia > 10
            ? 'text-rose-600'
            : metrics.inadimplencia > 5
              ? 'text-amber-600'
              : 'text-emerald-600'
        }
        iconBg={
          metrics.inadimplencia > 10
            ? 'bg-rose-50'
            : metrics.inadimplencia > 5
              ? 'bg-amber-50'
              : 'bg-emerald-50'
        }
        accentColor={
          metrics.inadimplencia > 10
            ? 'hsl(0, 78%, 55%)'
            : metrics.inadimplencia > 5
              ? 'hsl(42, 95%, 48%)'
              : 'hsl(150, 70%, 42%)'
        }
        href="/cobrancas"
        size="primary"
        isPercentage
        isCurrency={false}
        badge={inadimplenciaBadge}
        badgeVariant={inadimplenciaBadgeVariant}
        riskLevel={
          metrics.inadimplencia > 15
            ? 'critical'
            : metrics.inadimplencia > 10
              ? 'high'
              : metrics.inadimplencia > 5
                ? 'medium'
                : 'none'
        }
      />
    </HeroKPIGrid>
  );
}
