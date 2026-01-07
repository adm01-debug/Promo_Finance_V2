import { Flame, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StreakData {
  dias: number;
  nivel: string;
  proximoNivel: number;
  progresso: number;
  temInadimplencia: boolean;
}

interface StreakCardProps {
  streakData: StreakData;
}

export function StreakCard({ streakData }: StreakCardProps) {
  return (
    <Card className={cn(
      "p-3 sm:p-4 col-span-2 lg:col-span-1 overflow-hidden relative",
      streakData.temInadimplencia 
        ? "bg-gradient-to-br from-destructive/10 to-background border-destructive/30"
        : streakData.nivel === 'gold' 
          ? "bg-gradient-to-br from-coins/20 to-coins/5 border-coins/30"
          : streakData.nivel === 'silver'
            ? "bg-gradient-to-br from-muted to-background"
            : "bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/30"
    )}>
      {/* Background animation */}
      {!streakData.temInadimplencia && streakData.dias > 0 && (
        <div className="absolute inset-0 opacity-10">
          <div className={cn(
            "absolute top-2 right-2 h-12 w-12 sm:h-16 sm:w-16 rounded-full blur-xl",
            streakData.nivel === 'gold' && "bg-coins animate-pulse",
            streakData.nivel === 'silver' && "bg-foreground/50",
            streakData.nivel === 'bronze' && "bg-orange-500"
          )} />
        </div>
      )}
      
      <div className="relative z-10 space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn(
              "p-1.5 sm:p-2 rounded-lg shrink-0",
              streakData.temInadimplencia 
                ? "bg-destructive/20"
                : streakData.nivel === 'gold' 
                  ? "bg-coins/20"
                  : streakData.nivel === 'silver'
                    ? "bg-foreground/10"
                    : "bg-orange-500/20"
            )}>
              <Flame className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                streakData.temInadimplencia 
                  ? "text-destructive"
                  : streakData.nivel === 'gold' 
                    ? "text-coins animate-fire-pulse"
                    : streakData.nivel === 'silver'
                      ? "text-foreground"
                      : "text-orange-500"
              )} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Streak Adimplência</p>
              <p className={cn(
                "text-lg sm:text-xl md:text-2xl font-bold font-display",
                streakData.temInadimplencia 
                  ? "text-destructive"
                  : streakData.nivel === 'gold' 
                    ? "text-coins glow-coins"
                    : streakData.nivel === 'silver'
                      ? "text-foreground"
                      : "text-orange-500"
              )}>
                {streakData.dias} dias
              </p>
            </div>
          </div>
          
          {!streakData.temInadimplencia && streakData.dias > 0 && (
            <div className={cn(
              "flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shrink-0",
              streakData.nivel === 'gold' && "bg-coins/20 text-coins",
              streakData.nivel === 'silver' && "bg-foreground/10 text-foreground",
              streakData.nivel === 'bronze' && "bg-orange-500/20 text-orange-500"
            )}>
              <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              <span className="hidden sm:inline">{streakData.nivel === 'gold' ? 'Ouro' : streakData.nivel === 'silver' ? 'Prata' : 'Bronze'}</span>
              <span className="sm:hidden">{streakData.nivel === 'gold' ? 'Au' : streakData.nivel === 'silver' ? 'Ag' : 'Br'}</span>
            </div>
          )}
        </div>
        
        {!streakData.temInadimplencia && streakData.nivel !== 'gold' && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>Próximo nível</span>
              <span>{streakData.proximoNivel} dias</span>
            </div>
            <Progress 
              value={streakData.progresso} 
              className={cn(
                "h-1.5 sm:h-2",
                streakData.nivel === 'silver' && "[&>div]:bg-coins",
                streakData.nivel === 'bronze' && "[&>div]:bg-foreground/60"
              )}
            />
          </div>
        )}
        
        {streakData.temInadimplencia && (
          <p className="text-[10px] sm:text-xs text-destructive">
            Streak interrompido! Regularize pendências.
          </p>
        )}
      </div>
    </Card>
  );
}
