import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { PositionBadge, RankBadge, getRankFromScore } from '@/components/ui/rank-badge';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface Cliente {
  id: string;
  nome: string;
  nomeFantasia: string | null;
  receita: number;
  pagos: number;
  pendentes: number;
  posicao: number;
  adimplencia: number;
}

interface TopClientesLeaderboardProps {
  topClientesReceita: Cliente[];
}

export function TopClientesLeaderboard({ topClientesReceita }: TopClientesLeaderboardProps) {
  return (
    <motion.div variants={itemVariants} className="lg:col-span-1">
      <Card className="h-[450px]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-coins" />
            Top 10 Clientes
          </CardTitle>
          <CardDescription>Por receita gerada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 overflow-y-auto max-h-[360px] pr-2">
          {topClientesReceita.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
          ) : (
            topClientesReceita.map((cliente, index) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]",
                  index === 0 && "bg-gradient-to-r from-coins/20 to-coins/5 border border-coins/30",
                  index === 1 && "bg-gradient-to-r from-muted/80 to-muted/30 border border-border",
                  index === 2 && "bg-gradient-to-r from-orange-500/20 to-orange-500/5 border border-orange-500/30",
                  index > 2 && "bg-muted/30 hover:bg-muted/50"
                )}
              >
                <PositionBadge position={cliente.posicao} size="sm" showIcon={index < 3} />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {cliente.nomeFantasia || cliente.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">
                      Adimplência: 
                    </span>
                    <RankBadge
                      rank={getRankFromScore(cliente.adimplencia, { gold: 90, silver: 70, bronze: 50 })}
                      size="sm"
                      label={`${cliente.adimplencia.toFixed(0)}%`}
                      showIcon={false}
                      animate={false}
                    />
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={cn(
                    "font-bold text-sm",
                    index === 0 && "text-coins glow-coins",
                    index === 1 && "text-foreground",
                    index === 2 && "text-orange-500",
                    index > 2 && "text-muted-foreground"
                  )}>
                    {formatCurrency(cliente.receita)}
                  </p>
                  {cliente.pendentes > 0 && (
                    <p className="text-xs text-warning">
                      {formatCurrency(cliente.pendentes)} pendente
                    </p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
