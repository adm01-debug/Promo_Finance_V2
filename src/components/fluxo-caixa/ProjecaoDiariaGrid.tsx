import { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ProjecaoDia {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface ProjecaoDiariaGridProps {
  dados: ProjecaoDia[];
  cenarioAtivo: string;
  isLoading: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

export const ProjecaoDiariaGrid = memo(function ProjecaoDiariaGrid({
  dados,
  cenarioAtivo,
  isLoading,
}: ProjecaoDiariaGridProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Projeção Diária - Cenário {cenarioAtivo.charAt(0).toUpperCase() + cenarioAtivo.slice(1)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : dados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Nenhuma projeção disponível para o período</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {dados.slice(0, 15).map((dia, index) => {
                const liquido = dia.receitas - dia.despesas;
                const isPositivo = liquido >= 0;
                const isCritico = dia.saldo < 100000;
                const isRuptura = dia.saldo <= 0;
                
                return (
                  <motion.div
                    key={dia.data}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "p-3 rounded-xl border transition-all hover:shadow-md",
                      isRuptura ? "bg-destructive/10 border-destructive/40" :
                      isCritico ? "bg-warning/10 border-warning/30" :
                      isPositivo ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground font-medium">
                        {new Date(dia.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                      </span>
                      <Badge variant="outline" className={cn(
                        "text-xs h-5 px-1.5", 
                        isPositivo ? "text-success" : "text-destructive"
                      )}>
                        {isPositivo ? '+' : ''}{formatCurrency(liquido).replace('R$', '')}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-success">+ {formatCurrency(dia.receitas).replace('R$', '')}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-destructive">- {formatCurrency(dia.despesas).replace('R$', '')}</span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className={cn(
                        "text-sm font-semibold",
                        isRuptura ? "text-destructive" :
                        isCritico ? "text-warning" : "text-foreground"
                      )}>
                        {formatCurrency(dia.saldo)}
                      </p>
                    </div>
                    {isRuptura && (
                      <Badge variant="destructive" className="mt-2 w-full justify-center text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Ruptura
                      </Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});
