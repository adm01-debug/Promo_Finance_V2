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
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg font-display flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="truncate">
              <span className="hidden sm:inline">Projeção Diária - Cenário {cenarioAtivo.charAt(0).toUpperCase() + cenarioAtivo.slice(1)}</span>
              <span className="sm:hidden">Projeção Diária</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-3">
              {Array.from({ length: 14 }).map((_, i) => (
                <Skeleton key={i} className="h-24 sm:h-32" />
              ))}
            </div>
          ) : dados.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm sm:text-base">Nenhuma projeção disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-3">
              {dados.slice(0, 14).map((dia, index) => {
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
                      "p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all hover:shadow-md",
                      isRuptura ? "bg-destructive/10 border-destructive/40" :
                      isCritico ? "bg-warning/10 border-warning/30" :
                      isPositivo ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                        {new Date(dia.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                      </span>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] sm:text-xs h-4 sm:h-5 px-1 sm:px-1.5 w-full justify-center mb-1 sm:mb-2", 
                      isPositivo ? "text-success" : "text-destructive"
                    )}>
                      {isPositivo ? '+' : ''}{formatCurrency(liquido).replace('R$', '').trim()}
                    </Badge>
                    <div className="space-y-0.5 sm:space-y-1 hidden sm:block">
                      <div className="flex justify-between text-[10px] sm:text-xs">
                        <span className="text-success truncate">+{formatCurrency(dia.receitas).replace('R$', '').trim()}</span>
                      </div>
                      <div className="flex justify-between text-[10px] sm:text-xs">
                        <span className="text-destructive truncate">-{formatCurrency(dia.despesas).replace('R$', '').trim()}</span>
                      </div>
                    </div>
                    <div className="mt-1 sm:mt-2 pt-1 sm:pt-2 border-t border-border/50">
                      <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">Saldo</p>
                      <p className={cn(
                        "text-[10px] sm:text-sm font-semibold truncate",
                        isRuptura ? "text-destructive" :
                        isCritico ? "text-warning" : "text-foreground"
                      )}>
                        {formatCurrency(dia.saldo)}
                      </p>
                    </div>
                    {isRuptura && (
                      <Badge variant="destructive" className="mt-1 sm:mt-2 w-full justify-center text-[9px] sm:text-xs h-4 sm:h-5">
                        <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                        <span className="hidden sm:inline">Ruptura</span>
                        <span className="sm:hidden">!</span>
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
