import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Users, FileText, ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ActivityType = 'conta_pagar_criada' | 'conta_pagar_paga' | 'conta_pagar_vencida' | 'conta_receber_criada' | 'conta_receber_recebida' | 'conta_receber_vencida' | 'cliente_criado' | 'fornecedor_criado' | 'relatorio_gerado' | 'custom';

export interface Activity {
  id: string; type: ActivityType; title: string; description?: string; timestamp: Date;
  icon?: LucideIcon; iconColor?: string; metadata?: Record<string, any>; link?: string;
}

interface RecentActivityProps { activities: Activity[]; maxItems?: number; onViewAll?: () => void; onActivityClick?: (activity: Activity) => void; className?: string; loading?: boolean; }

const activityTypeConfig: Record<ActivityType, { icon: LucideIcon; iconBg: string; iconColor: string }> = {
  conta_pagar_criada: { icon: FileText, iconBg: 'bg-secondary/10', iconColor: 'text-secondary' },
  conta_pagar_paga: { icon: CheckCircle, iconBg: 'bg-success/10', iconColor: 'text-success' },
  conta_pagar_vencida: { icon: AlertCircle, iconBg: 'bg-destructive/10', iconColor: 'text-destructive' },
  conta_receber_criada: { icon: FileText, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  conta_receber_recebida: { icon: ArrowDownRight, iconBg: 'bg-success/10', iconColor: 'text-success' },
  conta_receber_vencida: { icon: AlertCircle, iconBg: 'bg-warning/10', iconColor: 'text-warning' },
  cliente_criado: { icon: Users, iconBg: 'bg-secondary/10', iconColor: 'text-secondary' },
  fornecedor_criado: { icon: Users, iconBg: 'bg-primary/10', iconColor: 'text-primary' },
  relatorio_gerado: { icon: FileText, iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
  custom: { icon: Clock, iconBg: 'bg-muted', iconColor: 'text-muted-foreground' },
};

function ActivityItem({ activity, onClick }: { activity: Activity; onClick?: (activity: Activity) => void }) {
  const config = activityTypeConfig[activity.type];
  const Icon = activity.icon ?? config.icon;
  const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ptBR });

  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg transition-colors', onClick && 'cursor-pointer hover:bg-muted/50')} onClick={() => onClick?.(activity)} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className={cn('flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full', config.iconBg)}>
        <Icon className={cn('h-4 w-4', config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
        {activity.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>}
        <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo}</p>
      </div>
      {onClick && <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-muted" />
      <div className="flex-1 space-y-2"><div className="h-4 bg-muted rounded w-3/4" /><div className="h-3 bg-muted rounded w-1/2" /><div className="h-3 bg-muted rounded w-1/4" /></div>
    </div>
  );
}

export function RecentActivity({ activities, maxItems = 5, onViewAll, onActivityClick, className, loading = false }: RecentActivityProps) {
  const displayedActivities = activities.slice(0, maxItems);
  const hasMore = activities.length > maxItems;

  return (
    <div className={cn('bg-card rounded-lg border border-border', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Atividade Recente</h3>
        {onViewAll && hasMore && (<button onClick={onViewAll} className="text-xs text-primary hover:underline">Ver todas</button>)}
      </div>
      <div className="divide-y divide-border/50">
        {loading ? Array.from({ length: maxItems }).map((_, i) => <ActivitySkeleton key={i} />) :
          displayedActivities.length > 0 ? displayedActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} onClick={onActivityClick} />
          )) : (
            <div className="p-8 text-center"><Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Nenhuma atividade recente</p></div>
          )}
      </div>
      {onViewAll && hasMore && (
        <div className="px-4 py-3 border-t border-border">
          <button onClick={onViewAll} className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors">
            Ver mais {activities.length - maxItems} atividades
          </button>
        </div>
      )}
    </div>
  );
}

export function ActivityTimeline({ activities, onActivityClick, className }: { activities: Activity[]; onActivityClick?: (activity: Activity) => void; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-4">
        {activities.map((activity) => {
          const config = activityTypeConfig[activity.type];
          const Icon = activity.icon ?? config.icon;
          const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true, locale: ptBR });
          return (
            <div key={activity.id} className={cn('relative flex items-start gap-4 pl-10', onActivityClick && 'cursor-pointer')} onClick={() => onActivityClick?.(activity)}>
              <div className={cn('absolute left-0 flex items-center justify-center w-8 h-8 rounded-full border-2 border-background', config.iconBg)}>
                <Icon className={cn('h-4 w-4', config.iconColor)} />
              </div>
              <div className={cn('flex-1 bg-card rounded-lg border border-border p-4', onActivityClick && 'hover:bg-muted/50')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
