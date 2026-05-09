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
  totalDivergencias?: number;
  boletosAbertos?: number;
  taxaRecuperacao?: number;
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
      whileHover={{ y: -5, scale: 1.02 }}
      className="h-full"
    >
      <div className={cn(
        'relative h-full p-4 rounded-[1.5rem] border border-white/10 bg-background/30 backdrop-blur-xl transition-all duration-500 group cursor-pointer overflow-hidden ring-1 ring-white/5',
        'hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.25)] hover:ring-white/20',
        alertLevel === 'warning' && value > 0 && 'border-warning/40 shadow-[0_0_20px_hsl(var(--warning)/0.15)]',
        alertLevel === 'danger' && value > 0 && 'border-destructive/30 shadow-[0_0_20px_hsl(var(--destructive)/0.12)]',
      )}>
        {/* Animated Glow */}
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 rounded-[1.5rem] pointer-events-none',
          'bg-gradient-to-br',
          iconBg.replace('/10', '/[0.05]'),
        )} />

        <div className="flex items-center gap-2.5 sm:gap-3 relative">
          <motion.div
            className={cn(
              'p-3 rounded-2xl transition-all duration-500 border border-white/5',
              iconBg,
              'group-hover:shadow-lg group-hover:border-white/10'
            )}
            whileHover={{ scale: 1.15, rotate: 12 }}
            transition={{ type: 'spring', stiffness: 400, damping: 12 }}
          >
            <Icon className={cn('h-5 w-5 transition-all duration-300', iconColor)} />
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 truncate mb-1">{label}</p>
            <p className={cn(
              'text-2xl font-black font-display tabular-nums tracking-tighter',
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
  totalDivergencias = 0,
  boletosAbertos = 0,
  taxaRecuperacao = 0,
}: SecondaryKPICardsProps) {
  return (
    <div className="col-span-1 lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3">
      <MiniKPICard
        icon={Building2} label="Business Units" value={empresasCount}
        iconBg="bg-primary/10" iconColor="text-primary"
        accentGradient="bg-gradient-to-r from-primary to-primary/60"
        href="/empresas" tooltip="Total de CNPJs sob governança ativa" index={0}
      />
      <MiniKPICard
        icon={CreditCard} label="Neural Nodes" value={contasBancariasCount}
        iconBg="bg-secondary/10" iconColor="text-secondary"
        accentGradient="bg-gradient-to-r from-secondary to-secondary/60"
        href="/contas-bancarias" tooltip="Integrações bancárias em tempo real" index={1}
      />
      <MiniKPICard
        icon={CheckCircle2} label="Inbound Liquidity" value={venceHojeReceberCount}
        iconBg="bg-success/10" iconColor="text-success"
        accentGradient="bg-gradient-to-r from-success to-success/60"
        href="/contas-receber" tooltip="Créditos previstos para liquidação D+0" index={2}
      />
      <MiniKPICard
        icon={Clock} label="Outbound Flow" value={venceHojePagarCount}
        iconBg="bg-warning/10" iconColor="text-warning"
        accentGradient="bg-gradient-to-r from-warning to-warning/60"
        href="/contas-pagar" tooltip="Débitos agendados para liquidação D+0" index={3}
      />
      <MiniKPICard
        icon={ShieldAlert} label="Governance Pendencies" value={aprovacoesPendentes}
        iconBg={aprovacoesPendentes > 0 ? "bg-warning/10" : "bg-muted/50"}
        iconColor={aprovacoesPendentes > 0 ? "text-warning" : "text-muted-foreground"}
        accentGradient="bg-gradient-to-r from-warning to-warning/60"
        href="/aprovacoes" alertLevel="warning" tooltip="Aprovações críticas pendentes" index={4}
      />
      <MiniKPICard
        icon={AlertTriangle} label="Risk Exposure" value={vencidasTotal}
        iconBg={vencidasTotal > 0 ? "bg-destructive/10" : "bg-muted/50"}
        iconColor={vencidasTotal > 0 ? "text-destructive" : "text-muted-foreground"}
        accentGradient="bg-gradient-to-r from-destructive to-destructive/60"
        alertLevel="danger" tooltip="Anomalias de fluxo detectadas" index={5}
      />
      <MiniKPICard
        icon={ShieldAlert} label="Divergências" value={totalDivergencias}
        iconBg={totalDivergencias > 0 ? "bg-destructive/10" : "bg-muted/50"}
        iconColor={totalDivergencias > 0 ? "text-destructive" : "text-muted-foreground"}
        accentGradient="bg-gradient-to-r from-destructive to-destructive/60"
        href="/conciliacao#divergencias" alertLevel={totalDivergencias > 0 ? "danger" : "none"} tooltip="Divergências de conciliação pendentes" index={6}
      />
      <MiniKPICard
        icon={FileText} label="Active Billing" value={boletosAbertos}
        iconBg={boletosAbertos > 0 ? "bg-blue-500/10" : "bg-muted/50"}
        iconColor={boletosAbertos > 0 ? "text-blue-500" : "text-muted-foreground"}
        accentGradient="bg-gradient-to-r from-blue-500 to-blue-500/60"
        href="/boletos" tooltip="Boletos bancários em aberto" index={7}
      />
      <MiniKPICard
        icon={Target} label="Recovery Rate" value={taxaRecuperacao}
        iconBg={taxaRecuperacao > 50 ? "bg-emerald-500/10" : "bg-orange-500/10"}
        iconColor={taxaRecuperacao > 50 ? "text-emerald-500" : "text-orange-500"}
        accentGradient="bg-gradient-to-r from-emerald-500 to-emerald-500/60"
        href="/cobrancas" tooltip="Eficiência na recuperação de títulos vencidos" index={8}
      />
    </div>
  );
}
