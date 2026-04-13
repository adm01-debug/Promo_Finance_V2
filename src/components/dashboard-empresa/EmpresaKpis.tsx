import { motion } from 'framer-motion';
import { Wallet, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } } };

interface EmpresaKpisProps {
  saldoTotal: number;
  saldoDisponivel: number;
  totalReceber: number;
  totalPagar: number;
  totalVencidasReceber: number;
  totalVencidasPagar: number;
  saldoProjetado: number;
}

export function EmpresaKpiCards({ saldoTotal, saldoDisponivel, totalReceber, totalPagar, totalVencidasReceber, totalVencidasPagar, saldoProjetado }: EmpresaKpisProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
              <p className="text-2xl font-bold">{formatCurrency(saldoTotal)}</p>
              <p className="text-xs text-muted-foreground">Disponível: {formatCurrency(saldoDisponivel)}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Wallet className="h-6 w-6" /></div>
          </div>
        </CardContent>
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/50" />
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">A Receber</p>
              <p className="text-2xl font-bold">{formatCurrency(totalReceber)}</p>
              <p className="text-xs text-destructive">{formatCurrency(totalVencidasReceber)} vencido</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-success/10 text-success flex items-center justify-center"><ArrowDownCircle className="h-6 w-6" /></div>
          </div>
        </CardContent>
        <div className="h-1 w-full bg-gradient-to-r from-success to-success/50" />
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">A Pagar</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPagar)}</p>
              <p className="text-xs text-destructive">{formatCurrency(totalVencidasPagar)} vencido</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center"><ArrowUpCircle className="h-6 w-6" /></div>
          </div>
        </CardContent>
        <div className="h-1 w-full bg-gradient-to-r from-destructive to-destructive/50" />
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Saldo Projetado</p>
              <p className={cn('text-2xl font-bold', saldoProjetado < 0 ? 'text-destructive' : 'text-success')}>{formatCurrency(saldoProjetado)}</p>
              <p className="text-xs text-muted-foreground">
                {saldoProjetado >= saldoTotal ? (
                  <span className="text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Positivo</span>
                ) : (
                  <span className="text-destructive flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Negativo</span>
                )}
              </p>
            </div>
            <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', saldoProjetado < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
              {saldoProjetado < 0 ? <AlertTriangle className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
            </div>
          </div>
        </CardContent>
        <div className={cn('h-1 w-full', saldoProjetado < 0 ? 'bg-gradient-to-r from-destructive to-destructive/50' : 'bg-gradient-to-r from-success to-success/50')} />
      </Card>
    </motion.div>
  );
}
