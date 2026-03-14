import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, CreditCard, CheckCircle2, Clock, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SecondaryKPICardsProps {
  empresasCount: number;
  contasBancariasCount: number;
  venceHojeReceberCount: number;
  venceHojePagarCount: number;
  aprovacoesPendentes: number;
  vencidasTotal: number;
}

interface MiniCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  iconBg: string;
  iconColor: string;
  href?: string;
  alertLevel?: 'none' | 'warning' | 'danger';
  tooltip?: string;
  index: number;
}

function MiniKPICard({ icon: Icon, label, value, iconBg, iconColor, href, alertLevel = 'none', tooltip, index }: MiniCardProps) {
  const animatedValue = useCountUp(value, { duration: 800, decimals: 0 });

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
    >
      <Card className={cn(
        'p-3 sm:p-4 transition-all duration-300 group cursor-pointer relative overflow-hidden',
        'hover:shadow-md hover:-translate-y-1',
        alertLevel === 'warning' && value > 0 && 'ring-2 ring-warning/40 shadow-[0_0_12px_hsl(var(--warning)/0.15)]',
        alertLevel === 'danger' && value > 0 && 'ring-1 ring-destructive/30',
      )}>
        {/* Subtle glow on hover */}
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none',
          iconBg.replace('/10', '/[0.03]'),
        )} />

        <div className="flex items-center gap-2.5 sm:gap-3 relative">
          <motion.div
            className={cn('p-1.5 sm:p-2 rounded-lg transition-all duration-300', iconBg)}
            whileHover={{ scale: 1.15, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300', iconColor)} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{label}</p>
            <p className={cn(
              'text-base sm:text-lg font-bold font-display tabular-nums',
              alertLevel === 'warning' && value > 0 && 'text-warning',
              alertLevel === 'danger' && value > 0 && 'text-destructive',
            )}>
              {Math.round(animatedValue)}
            </p>
          </div>
          {/* Arrow on hover */}
          {href && (
            <motion.div
              className="opacity-0 group-hover:opacity-40 transition-opacity"
              initial={false}
              animate={{ x: 0 }}
              whileHover={{ x: 2 }}
            >
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );

  const wrappedContent = tooltip ? (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  ) : cardContent;

  if (href) return <Link to={href}>{wrappedContent}</Link>;
  return wrappedContent;
}

export function SecondaryKPICards({
  empresasCount,
  contasBancariasCount,
  venceHojeReceberCount,
  venceHojePagarCount,
  aprovacoesPendentes,
  vencidasTotal,
}: SecondaryKPICardsProps) {
  return (
    <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      <MiniKPICard
        icon={Building2}
        label="Empresas"
        value={empresasCount}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        href="/empresas"
        tooltip="Total de empresas cadastradas"
        index={0}
      />
      <MiniKPICard
        icon={CreditCard}
        label="Contas Bancárias"
        value={contasBancariasCount}
        iconBg="bg-secondary/10"
        iconColor="text-secondary"
        href="/contas-bancarias"
        tooltip="Contas bancárias ativas"
        index={1}
      />
      <MiniKPICard
        icon={CheckCircle2}
        label="Receber Hoje"
        value={venceHojeReceberCount}
        iconBg="bg-success/10"
        iconColor="text-success"
        href="/contas-receber"
        tooltip="Contas a receber com vencimento hoje"
        index={2}
      />
      <MiniKPICard
        icon={Clock}
        label="Pagar Hoje"
        value={venceHojePagarCount}
        iconBg="bg-warning/10"
        iconColor="text-warning"
        href="/contas-pagar"
        tooltip="Contas a pagar com vencimento hoje"
        index={3}
      />
      <MiniKPICard
        icon={ShieldAlert}
        label="Aprovações"
        value={aprovacoesPendentes}
        iconBg={aprovacoesPendentes > 0 ? "bg-warning/10" : "bg-muted"}
        iconColor={aprovacoesPendentes > 0 ? "text-warning" : "text-muted-foreground"}
        href="/aprovacoes"
        alertLevel="warning"
        tooltip="Aprovações pendentes de revisão"
        index={4}
      />
      <MiniKPICard
        icon={AlertTriangle}
        label="Vencidas"
        value={vencidasTotal}
        iconBg={vencidasTotal > 0 ? "bg-destructive/10" : "bg-muted"}
        iconColor={vencidasTotal > 0 ? "text-destructive" : "text-muted-foreground"}
        alertLevel="danger"
        tooltip="Total de contas vencidas (a pagar + a receber)"
        index={5}
      />
    </div>
  );
}
