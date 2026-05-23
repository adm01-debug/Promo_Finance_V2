import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, CreditCard, CheckCircle2, Clock, ShieldAlert, AlertTriangle, ArrowRight, FileText, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/hooks/useCountUp';

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
  index: number;
}

function MiniKPICard({ icon: Icon, label, value, iconBg, iconColor, href, alertLevel = 'none', index }: MiniCardProps) {
  const animatedValue = useCountUp(value, { duration: 600, decimals: 0 });

  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="h-full"
    >
      <div className={cn(
        'relative h-full p-4 rounded-xl border transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden',
        alertLevel === 'warning' && value > 0 
          ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-900/10' 
          : alertLevel === 'danger' && value > 0 
            ? 'border-rose-200 bg-rose-50/50 dark:bg-rose-900/10' 
            : 'border-black/5 bg-white dark:bg-zinc-900/50 dark:border-white/5'
      )}>
        <div className="flex items-center gap-3 relative z-10">
          <div className={cn(
            'p-2.5 rounded-xl border border-white/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm',
            iconBg,
          )}>
            <Icon className={cn('h-4 w-4 transition-all duration-300', iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 truncate mb-0.5">{label}</p>
            <p className={cn(
              'text-xl font-black tabular-nums tracking-tighter transition-all duration-300 group-hover:translate-x-0.5 font-heading',
              alertLevel === 'warning' && value > 0 ? 'text-amber-700' : alertLevel === 'danger' && value > 0 ? 'text-rose-700' : 'text-foreground',
            )}>
              {Math.round(animatedValue)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (href) return <Link to={href} className="h-full no-underline">{cardContent}</Link>;
  return cardContent;
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9 gap-4">
      <MiniKPICard
        icon={Building2} label="Empresas" value={empresasCount}
        iconBg="bg-blue-50" iconColor="text-blue-600"
        href="/empresas" index={0}
      />
      <MiniKPICard
        icon={CreditCard} label="Contas" value={contasBancariasCount}
        iconBg="bg-slate-50" iconColor="text-slate-600"
        href="/contas-bancarias" index={1}
      />
      <MiniKPICard
        icon={CheckCircle2} label="Entradas Hoje" value={venceHojeReceberCount}
        iconBg="bg-emerald-50" iconColor="text-emerald-600"
        href="/contas-receber" index={2}
      />
      <MiniKPICard
        icon={Clock} label="Saídas Hoje" value={venceHojePagarCount}
        iconBg="bg-amber-50" iconColor="text-amber-600"
        href="/contas-pagar" index={3}
      />
      <MiniKPICard
        icon={ShieldAlert} label="Aprovações" value={aprovacoesPendentes}
        iconBg={aprovacoesPendentes > 0 ? "bg-amber-50" : "bg-slate-50"}
        iconColor={aprovacoesPendentes > 0 ? "text-amber-600" : "text-slate-400"}
        href="/aprovacoes" alertLevel="warning" index={4}
      />
      <MiniKPICard
        icon={AlertTriangle} label="Atrasados" value={vencidasTotal}
        iconBg={vencidasTotal > 0 ? "bg-rose-50" : "bg-slate-50"}
        iconColor={vencidasTotal > 0 ? "text-rose-600" : "text-slate-400"}
        alertLevel="danger" index={5}
      />
      <MiniKPICard
        icon={ShieldAlert} label="Divergências" value={totalDivergencias}
        iconBg={totalDivergencias > 0 ? "bg-rose-50" : "bg-slate-50"}
        iconColor={totalDivergencias > 0 ? "text-rose-600" : "text-slate-400"}
        href="/conciliacao#divergencias" alertLevel={totalDivergencias > 0 ? "danger" : "none"} index={6}
      />
      <MiniKPICard
        icon={FileText} label="Boletos Abertos" value={boletosAbertos}
        iconBg="bg-blue-50" iconColor="text-blue-500"
        href="/boletos" index={7}
      />
      <MiniKPICard
        icon={Target} label="Taxa Recup." value={taxaRecuperacao}
        iconBg="bg-emerald-50" iconColor="text-emerald-500"
        href="/cobrancas" index={8}
      />
    </div>
  );
}