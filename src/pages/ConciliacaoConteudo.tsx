import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { itemVariants } from './conciliacao-variants';

interface ConciliacaoConteudoProps {
  percentualConciliado: number;
  conciliadas: number;
  totalTransacoes: number;
  pendentes: number;
}

export function ConciliacaoConteudo({
  percentualConciliado,
  conciliadas,
  totalTransacoes,
  pendentes,
}: ConciliacaoConteudoProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="card-base border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progresso da Conciliação</span>
            <div className="flex items-center gap-3">
              <Badge
                variant={percentualConciliado === 100 ? 'default' : 'secondary'}
                className={cn(percentualConciliado === 100 && 'bg-success text-success-foreground')}
              >
                {percentualConciliado.toFixed(1)}%
              </Badge>
              <span className="text-xs text-muted-foreground">
                {conciliadas}/{totalTransacoes} transações · {pendentes} pendentes
              </span>
            </div>
          </div>
          <Progress value={percentualConciliado} className="h-2" />
        </CardContent>
      </Card>
    </motion.div>
  );
}
