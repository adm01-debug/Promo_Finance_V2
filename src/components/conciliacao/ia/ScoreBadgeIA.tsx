import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScoreBadgeIA({ score, confianca, size = 'default' }: { 
  score: number; 
  confianca: 'alta' | 'media' | 'baixa';
  size?: 'default' | 'sm';
}) {
  const isSmall = size === 'sm';
  
  return (
    <div className={cn(
      "flex items-center gap-1 rounded-full font-mono font-bold",
      isSmall ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
      confianca === 'alta' && "bg-success/20 text-success border border-success/30",
      confianca === 'media' && "bg-warning/20 text-warning border border-warning/30",
      confianca === 'baixa' && "bg-muted text-muted-foreground border border-border",
    )}>
      <Brain className={cn(isSmall ? "h-3 w-3" : "h-4 w-4")} />
      {score}%
    </div>
  );
}
