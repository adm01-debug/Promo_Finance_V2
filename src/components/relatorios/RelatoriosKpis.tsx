import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

interface RelatoriosKpisProps {
  totalReceitas: number;
  totalDespesas: number;
  saldoPeriodo: number;
  crescimento: number;
  loadingKpis: boolean;
  loadingComparativo: boolean;
}

export function RelatoriosKpiCards({ totalReceitas, totalDespesas, saldoPeriodo, crescimento, loadingKpis, loadingComparativo }: RelatoriosKpisProps) {
  const cards = [
    { label: 'Receitas do Período', value: formatCurrency(totalReceitas), icon: TrendingUp, gradient: 'from-success/10 to-success/5', border: 'border-success/20', color: 'text-success', iconColor: 'text-success/50', loading: loadingKpis },
    { label: 'Despesas do Período', value: formatCurrency(totalDespesas), icon: TrendingDown, gradient: 'from-destructive/10 to-destructive/5', border: 'border-destructive/20', color: 'text-destructive', iconColor: 'text-destructive/50', loading: loadingKpis },
    { label: 'Saldo do Período', value: formatCurrency(saldoPeriodo), icon: DollarSign, gradient: 'from-primary/10 to-primary/5', border: 'border-primary/20', color: 'text-primary', iconColor: 'text-primary/50', loading: loadingKpis },
    { label: 'Crescimento', value: `${crescimento >= 0 ? '+' : ''}${crescimento.toFixed(1)}%`, icon: BarChart3, gradient: 'from-accent/10 to-accent/5', border: 'border-accent/20', color: 'text-accent', iconColor: 'text-accent/50', loading: loadingComparativo },
  ];

  return (
    <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={containerVariants} initial="hidden" animate="visible">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.label} variants={itemVariants}>
            <Card className={`bg-gradient-to-br ${card.gradient} ${card.border}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    {card.loading ? <Skeleton className="h-8 w-24 mt-1" /> : <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>}
                  </div>
                  <Icon className={`h-8 w-8 ${card.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
