import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const containerVariants = { 
  hidden: { opacity: 0 }, 
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } } 
};

const itemVariants = { 
  hidden: { opacity: 0, y: 20 }, 
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } 
};

interface RelatoriosKpisProps {
  totalReceitas: number;
  totalDespesas: number;
  saldoPeriodo: number;
  crescimento: number;
  loadingKpis: boolean;
  loadingComparativo: boolean;
}

export function RelatoriosKpiCards({ 
  totalReceitas, 
  totalDespesas, 
  saldoPeriodo, 
  crescimento, 
  loadingKpis, 
  loadingComparativo 
}: RelatoriosKpisProps) {
  
  const cards = [
    { 
      label: 'TOTAL REVENUE', 
      value: totalReceitas, 
      icon: TrendingUp, 
      color: 'text-success', 
      bg: 'bg-success/10',
      border: 'border-success/20',
      glow: 'shadow-success/20',
      loading: loadingKpis 
    },
    { 
      label: 'TOTAL EXPENSES', 
      value: totalDespesas, 
      icon: TrendingDown, 
      color: 'text-destructive', 
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      glow: 'shadow-destructive/20',
      loading: loadingKpis 
    },
    { 
      label: 'NET MARGIN', 
      value: saldoPeriodo, 
      icon: DollarSign, 
      color: 'text-primary', 
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      glow: 'shadow-primary/20',
      loading: loadingKpis 
    },
    { 
      label: 'GROWTH INDEX', 
      value: crescimento, 
      icon: BarChart3, 
      color: 'text-accent', 
      bg: 'bg-accent/10',
      border: 'border-accent/20',
      glow: 'shadow-accent/20',
      isPercentage: true,
      loading: loadingComparativo 
    },
  ];

  return (
    <motion.div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const isNegative = !card.isPercentage && card.value < 0;
        
        return (
          <motion.div key={card.label} variants={itemVariants}>
            <Card className={cn(
              "relative overflow-hidden border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2rem] transition-all hover:scale-[1.02] active:scale-[0.98] group",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-10 before:pointer-events-none",
              card.label === 'TOTAL REVENUE' && "before:from-success before:to-transparent",
              card.label === 'TOTAL EXPENSES' && "before:from-destructive before:to-transparent",
              card.label === 'NET MARGIN' && "before:from-primary before:to-transparent",
              card.label === 'GROWTH INDEX' && "before:from-accent before:to-transparent",
            )}>
              <div className={cn("absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-20 -mr-16 -mt-16 rounded-full", card.bg)} />
              
              <CardContent className="p-7 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={cn("p-3 rounded-2xl shadow-lg", card.bg, card.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {!card.loading && card.isPercentage && (
                    <div className={cn(
                      "flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      crescimento >= 0 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                    )}>
                      {crescimento >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(crescimento).toFixed(1)}%
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{card.label}</p>
                  {card.loading ? (
                    <Skeleton className="h-10 w-32 bg-white/5" />
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <p className={cn(
                        "text-3xl font-black tracking-tighter tabular-nums",
                        card.isPercentage ? card.color : (isNegative ? 'text-destructive' : 'text-foreground')
                      )}>
                        {card.isPercentage ? `${card.value >= 0 ? '+' : ''}${card.value.toFixed(1)}%` : formatCurrency(card.value)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
