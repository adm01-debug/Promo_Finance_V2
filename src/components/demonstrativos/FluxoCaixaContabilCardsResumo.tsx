import { motion } from 'framer-motion';
import { Wallet, TrendingUp, Building, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { FluxoLinha } from './FluxoCaixaContabil.types';

interface FluxoCaixaContabilCardsResumoProps {
  fluxo: {
    operacional: FluxoLinha[];
    investimento: FluxoLinha[];
    financiamento: FluxoLinha[];
    saldoInicial: number;
    saldoFinal: number;
    variacaoTotal: number;
    fluxoOperacional: number;
    fluxoInvestimento: number;
    fluxoFinanciamento: number;
  };
}

export function FluxoCaixaContabilCardsResumo({ fluxo }: FluxoCaixaContabilCardsResumoProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/10 group hover:ring-primary/30 transition-all duration-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-card/5 text-muted-foreground group-hover:text-primary transition-colors">
                <Wallet className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                Initial Balance
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                Saldo Inicial
              </p>
              <div className="text-2xl font-black tracking-tight">
                {formatCurrency(fluxo.saldoInicial)}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/10 group hover:ring-success/30 transition-all duration-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-success/10 text-success">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                Operational
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                Operacional
              </p>
              <div
                className={cn(
                  'text-2xl font-black tracking-tight',
                  fluxo.fluxoOperacional >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {formatCurrency(fluxo.fluxoOperacional)}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-[2rem] overflow-hidden ring-1 ring-white/10 group hover:ring-blue-500/30 transition-all duration-500">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <Building className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                Investment
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                Investimento
              </p>
              <div
                className={cn(
                  'text-2xl font-black tracking-tight',
                  fluxo.fluxoInvestimento >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {formatCurrency(fluxo.fluxoInvestimento)}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-primary/40 group transition-all duration-500 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Coins className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                Net Result
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                Saldo Final
              </p>
              <div className="text-2xl font-black tracking-tight">
                {formatCurrency(fluxo.saldoFinal)}
              </div>
            </div>
            <Badge
              variant={fluxo.variacaoTotal >= 0 ? 'default' : 'destructive'}
              className="mt-3 rounded-md px-3 font-black text-[10px] uppercase tracking-tighter"
            >
              {fluxo.variacaoTotal >= 0 ? '+' : ''}
              {formatCurrency(fluxo.variacaoTotal)} Var.
            </Badge>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
