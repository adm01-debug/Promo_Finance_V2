import { motion } from 'framer-motion';
import {
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ContasPagarKPIsProps {
  totalPagar: number;
  totalPagoMes: number;
  totalVencido: number;
  venceHoje: number;
  countAprovacoesUrgentes: number;
  valorAprovacoesUrgentes: number;
  onAprovacaoClick: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export function ContasPagarKPIs({
  totalPagar,
  totalPagoMes,
  totalVencido,
  venceHoje,
  countAprovacoesUrgentes,
  valorAprovacoesUrgentes,
  onAprovacaoClick,
}: ContasPagarKPIsProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card className="stat-card group">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total a Pagar</p>
              <p className="text-lg sm:text-2xl font-bold font-display mt-1 truncate">{formatCurrency(totalPagar)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Pago no Mês</p>
              <p className="text-lg sm:text-2xl font-bold font-display mt-1 truncate">{formatCurrency(totalPagoMes)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-success/10 text-success flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Vencido</p>
              <p className="text-lg sm:text-2xl font-bold font-display mt-1 text-destructive truncate">{formatCurrency(totalVencido)}</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="stat-card group">
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Vence Hoje</p>
              <p className="text-lg sm:text-2xl font-bold font-display mt-1">{venceHoje}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Contas</p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center transition-transform group-hover:scale-110 shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className={cn(
          "stat-card group cursor-pointer transition-all col-span-2 sm:col-span-1",
          countAprovacoesUrgentes > 0 && "ring-2 ring-warning/50 animate-pulse"
        )} 
        onClick={onAprovacaoClick}
      >
        <CardContent className="p-3 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Aprovações Urgentes</p>
              <p className={cn(
                "text-lg sm:text-2xl font-bold font-display mt-1",
                countAprovacoesUrgentes > 0 ? "text-warning" : ""
              )}>{countAprovacoesUrgentes}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {countAprovacoesUrgentes > 0 ? formatCurrency(valorAprovacoesUrgentes) : 'Nenhuma pendente'}
              </p>
            </div>
            <div className={cn(
              "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shrink-0",
              countAprovacoesUrgentes > 0 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
            )}>
              <ShieldAlert className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
