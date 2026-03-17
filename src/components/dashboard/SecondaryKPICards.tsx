import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, CreditCard, CheckCircle2, Clock, ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';
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
  accentGradient?: string;
}

function MiniKPICard({ icon: Icon, label, value, iconBg, iconColor, href, alertLevel = 'none', tooltip, index, accentGradient }: MiniCardProps) {
  const animatedValue = useCountUp(value, { duration: 800, decimals: 0 });

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
      whileHover={{ y: -3, scale: 1.02 }}
      className="h-full"
    >
      <div className={cn(
        'relative h-full p-3 sm:p-4 rounded-xl border border-border/50 bg-card transition-all duration-300 group cursor-pointer overflow-hidden',
        'hover:shadow-[var(--shadow-md)] hover:border-primary/20',
        alertLevel === 'warning' && value > 0 && 'border-warning/40 shadow-[0_0_16px_hsl(var(--warning)/0.1)]',
        alertLevel === 'danger' && value > 0 && 'border-destructive/30 shadow-[0_0_16px_hsl(var(--destructive)/0.08)]',
      )}>
        {/* Top accent line */}
        <div className={cn(
          'absolute top-0 left-3 right-3 h-[2px] rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          accentGradient || 'bg-primary'
        )} />

        {/* Subtle glow bg */}
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none',
          'bg-gradient-to-br',
          iconBg.replace('/10', '/[0.03]'),
        )} />

        <div className="flex items-center gap-2.5 sm:gap-3 relative">
          <motion.div
            className={cn(
              'p-2 rounded-xl transition-all duration-300 border border-transparent',
              iconBg,
              'group-hover:shadow-sm group-hover:border-border/20'
            )}
            whileHover={{ scale: 1.12, rotate: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            <Icon className={cn('h-4 w-4 transition-all duration-300', iconColor)} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate font-medium">{label}</p>
            <p className={cn(
              'text-lg sm:text-xl font-bold font-display tabular-nums tracking-tight',
              alertLevel === 'warning' && value > 0 && 'text-warning',
              alertLevel === 'danger' && value > 0 && 'text-destructive',
            )}>
              {Math.round(animatedValue)}
            </p>
          </div>
          {href && (
            <motion.div
              className="opacity-0 group-hover:opacity-50 transition-all duration-300"
              initial={false}
            >
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const wrappedContent = tooltip ? (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  ) : cardContent;

  if (href) return <Link to={href} className="h-full">{wrappedContent}</Link>;
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
    <div className="col-span-1 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <MiniKPICard
        icon={Building2} label="Empresas" value={empresasCount}
        iconBg="bg-primary/10" iconColor="text-primary"
        accentGradient="bg-gradient-to-r from-primary to-primary/60"
        href="/empresas" tooltip="Total de empresas cadastradas" index={0}
      />
      <MiniKPICard
        icon={CreditCard} label="Contas Bancárias" value={contasBancariasCount}
        iconBg="bg-secondary/10" iconColor="text-secondary"
        accentGradient="bg-gradient-to-r from-secondary to-secondary/60"
        href="/contas-bancarias" tooltip="Contas bancárias ativas" index={1}
      />
      <MiniKPICard
        icon={CheckCircle2} label="Receber Hoje" value={venceHojeReceberCount}
        iconBg="bg-success/10" iconColor="text-success"
        accentGradient="bg-gradient-to-r from-success to-success/60"
        href="/contas-receber" tooltip="Contas a receber com vencimento hoje" index={2}
      />
      <MiniKPICard
        icon={Clock} label="Pagar Hoje" value={venceHojePagarCount}
        iconBg="bg-warning/10" iconColor="text-warning"
        accentGradient="bg-gradient-to-r from-warning to-warning/60"
        href="/contas-pagar" tooltip="Contas a pagar com vencimento hoje" index={3}
      />
      <MiniKPICard
        icon={ShieldAlert} label="Aprovações" value={aprovacoesPendentes}
        iconBg={aprovacoesPendentes > 0 ? "bg-warning/10" : "bg-muted/50"}
        iconColor={aprovacoesPendentes > 0 ? "text-warning" : "text-muted-foreground"}
        accentGradient="bg-gradient-to-r from-warning to-warning/60"
        href="/aprovacoes" alertLevel="warning" tooltip="Aprovações pendentes" index={4}
      />
      <MiniKPICard
        icon={AlertTriangle} label="Vencidas" value={vencidasTotal}
        iconBg={vencidasTotal > 0 ? "bg-destructive/10" : "bg-muted/50"}
        iconColor={vencidasTotal > 0 ? "text-destructive" : "text-muted-foreground"}
        accentGradient="bg-gradient-to-r from-destructive to-destructive/60"
        alertLevel="danger" tooltip="Total de contas vencidas" index={5}
      />
    </div>
  );
}
