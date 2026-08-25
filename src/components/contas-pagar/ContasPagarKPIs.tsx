import { motion } from 'framer-motion';
import { DollarSign, CheckCircle2, AlertTriangle, Calendar, ShieldAlert } from 'lucide-react';
import { StatCard } from '@/components/motion/StatCard';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ContasPagarKPIsProps {
  totalPagar: number;
  totalPagoMes: number;
  totalVencido: number;
  venceHoje: number;
  totalPagoMesAnterior?: number;
  countAprovacoesUrgentes: number;
  valorAprovacoesUrgentes: number;
  onAprovacaoClick: () => void;
}

export function ContasPagarKPIs({
  totalPagar,
  totalPagoMes,
  totalVencido,
  venceHoje,
  totalPagoMesAnterior,
  countAprovacoesUrgentes,
  valorAprovacoesUrgentes,
  onAprovacaoClick,
}: ContasPagarKPIsProps) {
  // Delta apenas com dado real do mês anterior (sem simulação decorativa)
  const variationPago =
    totalPagoMesAnterior && totalPagoMesAnterior > 0
      ? {
          value: `${(((totalPagoMes - totalPagoMesAnterior) / totalPagoMesAnterior) * 100).toFixed(1)}%`,
          positive: totalPagoMes >= totalPagoMesAnterior,
        }
      : undefined;

  const cards: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    value: string | number;
    sub?: string;
    iconColor: string;
    iconBg: string;
    delta?: { value: string; positive: boolean };
    valueClassName?: string;
  }> = [
    {
      key: 'totalPagar',
      label: 'Total a Pagar',
      icon: <DollarSign className="h-5 w-5" />,
      value: formatCurrency(totalPagar),
      iconColor: 'var(--bad)',
      iconBg: 'var(--bad-soft)',
    },
    {
      key: 'totalPagoMes',
      label: 'Pago no Mês',
      icon: <CheckCircle2 className="h-5 w-5" />,
      value: formatCurrency(totalPagoMes),
      iconColor: 'var(--ok)',
      iconBg: 'var(--ok-soft)',
      delta: variationPago,
    },
    {
      key: 'totalVencido',
      label: 'Vencido',
      icon: <AlertTriangle className="h-5 w-5" />,
      value: formatCurrency(totalVencido),
      iconColor: 'var(--bad)',
      iconBg: 'var(--bad-soft)',
      valueClassName: totalVencido > 0 ? 'text-bad' : undefined,
    },
    {
      key: 'venceHoje',
      label: 'Vence Hoje',
      icon: <Calendar className="h-5 w-5" />,
      value: venceHoje,
      sub: 'contas',
      iconColor: 'var(--warn)',
      iconBg: 'var(--warn-soft)',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6"
    >
      {cards.map((kpi, index) => (
        <motion.div
          key={kpi.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
        >
          <StatCard
            label={kpi.label}
            value={kpi.value}
            sub={kpi.sub}
            icon={kpi.icon}
            iconColor={kpi.iconColor}
            iconBg={kpi.iconBg}
            delta={kpi.delta}
            valueClassName={kpi.valueClassName}
            className="h-full"
          />
        </motion.div>
      ))}

      {/* Aprovações Urgentes — clicável (deep-link para centro de aprovações) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <StatCard
          label="Aprovações Urgentes"
          value={countAprovacoesUrgentes}
          sub={
            countAprovacoesUrgentes > 0
              ? `Risco: ${formatCurrency(valorAprovacoesUrgentes)}`
              : 'Estado estável'
          }
          icon={<ShieldAlert className="h-5 w-5" />}
          iconColor="var(--warn)"
          iconBg="var(--warn-soft)"
          onClick={onAprovacaoClick}
          className={cn('h-full', countAprovacoesUrgentes > 0 && 'border-warn/40')}
        />
      </motion.div>
    </motion.div>
  );
}
