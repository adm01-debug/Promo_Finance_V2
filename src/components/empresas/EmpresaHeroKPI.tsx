import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { EmpresaHeroKPIProps } from './EmpresaCardView.types';
import { AnimatedCounter } from './AnimatedCounter';

export function EmpresaHeroKPI({ consolidado, saldoLiquido, totalEmpresas }: EmpresaHeroKPIProps) {
  return (
    <Card className="relative overflow-hidden border-0" style={{ boxShadow: 'var(--shadow-lg)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/5 to-secondary/8 dark:from-primary/20 dark:via-primary/8 dark:to-secondary/12" />
      <div className="absolute inset-0 backdrop-blur-[2px] bg-card/60 dark:bg-card/40" />
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-secondary/8 blur-3xl" />
      <CardContent className="relative p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <Wallet className="h-4 w-4 text-primary-foreground" />
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em]">
                Saldo Consolidado
              </p>
            </div>
            <p className="text-3xl lg:text-4xl font-extrabold font-display text-foreground tracking-tight leading-none">
              <AnimatedCounter value={consolidado.saldoTotal} />
            </p>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full',
                  saldoLiquido >= 0
                    ? 'bg-success/15 text-success'
                    : 'bg-destructive/15 text-destructive'
                )}
              >
                {saldoLiquido >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                Líquido: {formatCurrency(saldoLiquido)}
              </span>
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-0">
            <div className="w-px h-20 mx-auto" style={{ background: 'var(--divider-gradient)' }} />
          </div>
          <div className="lg:col-span-3 grid grid-cols-3 gap-4">
            <motion.div
              className="p-4 rounded-2xl bg-success/8 dark:bg-success/12 border border-success/15 relative overflow-hidden group cursor-default"
              whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(150 70% 32% / 0.15)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-success/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-4 w-4 text-success transition-transform group-hover:scale-110 group-hover:rotate-6" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  A Receber
                </span>
              </div>
              <p className="text-lg font-extrabold text-success font-display">
                <AnimatedCounter value={consolidado.totalReceber} duration={1400} />
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                {consolidado.titulosPendentesReceber} pendente
                {consolidado.titulosPendentesReceber !== 1 ? 's' : ''}
              </p>
            </motion.div>
            <motion.div
              className="p-4 rounded-2xl bg-destructive/8 dark:bg-destructive/12 border border-destructive/15 relative overflow-hidden group cursor-default"
              whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(0 78% 45% / 0.15)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-destructive/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="h-4 w-4 text-destructive transition-transform group-hover:scale-110 group-hover:-rotate-6" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  A Pagar
                </span>
              </div>
              <p className="text-lg font-extrabold text-destructive font-display">
                <AnimatedCounter value={consolidado.totalPagar} duration={1400} />
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                {consolidado.titulosPendentesPagar} pendente
                {consolidado.titulosPendentesPagar !== 1 ? 's' : ''}
              </p>
            </motion.div>
            <motion.div
              className="p-4 rounded-2xl bg-secondary/8 dark:bg-secondary/12 border border-secondary/15 relative overflow-hidden group cursor-default"
              whileHover={{ y: -2, boxShadow: '0 8px 30px hsl(215 90% 42% / 0.15)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-1.5 mb-2">
                <Users className="h-4 w-4 text-secondary transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Ativas
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-extrabold text-foreground font-display">
                  {consolidado.empresasAtivas}
                </p>
                <span className="text-sm text-muted-foreground font-semibold">
                  / {totalEmpresas}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 font-medium">cadastradas</p>
            </motion.div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
