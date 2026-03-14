import { motion } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';
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
      <Card className="h-[450px] overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-coins/10 flex items-center justify-center">
              <Trophy className="h-4 w-4 text-coins" />
            </div>
            Top 10 Clientes
          </CardTitle>
          <CardDescription>Por receita gerada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5 overflow-y-auto max-h-[360px] pr-2">
          {topClientesReceita.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhum dado disponível</p>
            </div>
          ) : (
            topClientesReceita.map((cliente, index) => (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl transition-all hover:scale-[1.01] cursor-default",
                  index === 0 && "bg-gradient-to-r from-coins/15 to-coins/5 border border-coins/20",
                  index === 1 && "bg-gradient-to-r from-muted/60 to-transparent border border-border/50",
                  index === 2 && "bg-gradient-to-r from-streak/10 to-transparent border border-streak/20",
                  index > 2 && "hover:bg-muted/40"
                )}
              >
                <PositionBadge position={cliente.posicao} size="sm" showIcon={index < 3} />
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {cliente.nomeFantasia || cliente.nome}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
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
                
                <div className="text-right shrink-0">
                  <p className={cn(
                    "font-bold text-sm tabular-nums",
                    index === 0 && "text-coins",
                    index === 1 && "text-foreground",
                    index === 2 && "text-streak",
                    index > 2 && "text-muted-foreground"
                  )}>
                    {formatCurrency(cliente.receita)}
                  </p>
                  {cliente.pendentes > 0 && (
                    <p className="text-[10px] text-warning font-medium">
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
