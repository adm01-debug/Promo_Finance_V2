import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, CreditCard, CheckCircle2, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SecondaryKPICardsProps {
  empresasCount: number;
  contasBancariasCount: number;
  venceHojeReceberCount: number;
  venceHojePagarCount: number;
  aprovacoesPendentes: number;
  vencidasTotal: number;
}

const items = [
  { key: 'empresas', icon: Building2, label: 'Empresas', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  { key: 'contas', icon: CreditCard, label: 'Contas Bancárias', iconBg: 'bg-secondary/10', iconColor: 'text-secondary' },
  { key: 'receber', icon: CheckCircle2, label: 'Receber Hoje', iconBg: 'bg-success/10', iconColor: 'text-success' },
  { key: 'pagar', icon: Clock, label: 'Pagar Hoje', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
] as const;

export function SecondaryKPICards({
  empresasCount,
  contasBancariasCount,
  venceHojeReceberCount,
  venceHojePagarCount,
  aprovacoesPendentes,
  vencidasTotal,
}: SecondaryKPICardsProps) {
  const values: Record<string, number> = {
    empresas: empresasCount,
    contas: contasBancariasCount,
    receber: venceHojeReceberCount,
    pagar: venceHojePagarCount,
  };

  return (
    <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
          >
            <Card className="p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-default">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className={cn('p-1.5 sm:p-2 rounded-lg transition-transform group-hover:scale-110', item.iconBg)}>
                  <Icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', item.iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.label}</p>
                  <p className="text-base sm:text-lg font-bold font-display">{values[item.key]}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}

      {/* Aprovações */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <Link to="/aprovacoes">
          <Card className={cn(
            "p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group h-full",
            aprovacoesPendentes > 0 && "ring-2 ring-warning/40 shadow-[0_0_12px_hsl(var(--warning)/0.15)]"
          )}>
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className={cn("p-1.5 sm:p-2 rounded-lg transition-transform group-hover:scale-110", aprovacoesPendentes > 0 ? "bg-warning/10" : "bg-muted")}>
                <ShieldAlert className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", aprovacoesPendentes > 0 ? "text-warning" : "text-muted-foreground")} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs text-muted-foreground">Aprovações</p>
                <p className={cn("text-base sm:text-lg font-bold font-display", aprovacoesPendentes > 0 && "text-warning")}>{aprovacoesPendentes}</p>
              </div>
            </div>
          </Card>
        </Link>
      </motion.div>

      {/* Vencidas */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 24 }}
      >
        <Card className={cn(
          "p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-default",
          vencidasTotal > 0 && "ring-1 ring-destructive/30"
        )}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={cn("p-1.5 sm:p-2 rounded-lg transition-transform group-hover:scale-110", vencidasTotal > 0 ? "bg-destructive/10" : "bg-muted")}>
              <AlertTriangle className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", vencidasTotal > 0 ? "text-destructive" : "text-muted-foreground")} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Vencidas</p>
              <p className={cn("text-base sm:text-lg font-bold font-display", vencidasTotal > 0 && "text-destructive")}>{vencidasTotal}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
