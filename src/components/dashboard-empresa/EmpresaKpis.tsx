import { motion } from 'framer-motion';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { StatCard } from '@/components/motion/StatCard';

import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
};

interface EmpresaKpisProps {
  saldoTotal: number;
  saldoDisponivel: number;
  totalReceber: number;
  totalPagar: number;
  totalVencidasReceber: number;
  totalVencidasPagar: number;
  saldoProjetado: number;
  boletosAbertos?: number;
  divergenciasPendentes?: number;
}

export function EmpresaKpiCards({
  saldoTotal,
  saldoDisponivel,
  totalReceber,
  totalPagar,
  totalVencidasReceber,
  totalVencidasPagar,
  saldoProjetado,
  boletosAbertos = 0,
  divergenciasPendentes = 0,
}: EmpresaKpisProps) {
  return (
    <div className="space-y-4">
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Saldo Atual"
          value={formatCurrency(saldoTotal)}
          sub={`Disponível: ${formatCurrency(saldoDisponivel)}`}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label="A Receber"
          value={formatCurrency(totalReceber)}
          sub={`${formatCurrency(totalVencidasReceber)} vencido`}
          icon={<ArrowDownCircle className="h-5 w-5" />}
          iconColor="var(--ok)"
          iconBg="var(--ok-soft)"
        />
        <StatCard
          label="A Pagar"
          value={formatCurrency(totalPagar)}
          sub={`${formatCurrency(totalVencidasPagar)} vencido`}
          icon={<ArrowUpCircle className="h-5 w-5" />}
          iconColor="var(--bad)"
          iconBg="var(--bad-soft)"
        />
        <StatCard
          label="Saldo Projetado"
          value={formatCurrency(saldoProjetado)}
          valueClassName={saldoProjetado < 0 ? 'text-bad' : 'text-ok'}
          sub={saldoProjetado >= saldoTotal ? 'Projeção positiva' : 'Projeção negativa'}
          icon={
            saldoProjetado < 0 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <TrendingUp className="h-5 w-5" />
            )
          }
          iconColor={saldoProjetado < 0 ? 'var(--bad)' : 'var(--ok)'}
          iconBg={saldoProjetado < 0 ? 'var(--bad-soft)' : 'var(--ok-soft)'}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          label="Boletos em Aberto"
          value={boletosAbertos}
          sub="Aguardando pagamento"
          icon={<FileCheck className="h-5 w-5" />}
          iconColor="var(--warn)"
          iconBg="var(--warn-soft)"
        />
        <StatCard
          label="Divergências de Conciliação"
          value={divergenciasPendentes}
          sub={divergenciasPendentes > 0 ? 'Ação necessária' : 'Tudo conciliado'}
          icon={<ShieldAlert className="h-5 w-5" />}
          iconColor={divergenciasPendentes > 0 ? 'var(--bad)' : 'var(--ok)'}
          iconBg={divergenciasPendentes > 0 ? 'var(--bad-soft)' : 'var(--ok-soft)'}
          className={cn(divergenciasPendentes > 0 && 'border-bad/40')}
        />
      </motion.div>
    </div>
  );
}
