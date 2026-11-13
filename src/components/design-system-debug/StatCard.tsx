import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { StatCardProps } from './DesignSystemAudit.types';

export const StatCard = ({ label, value, icon: Icon, color }: StatCardProps) => (
  <Card className="bg-card/5 border-border rounded-3xl premium-card">
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20 mb-1">
          {label}
        </p>
        <p className="text-2xl font-black text-foreground">{value}</p>
      </div>
      <div
        className={cn(
          'p-3 rounded-2xl',
          color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </CardContent>
  </Card>
);
