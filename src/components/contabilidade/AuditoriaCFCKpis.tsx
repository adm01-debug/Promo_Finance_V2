import { motion } from 'framer-motion';
import { Copy, CheckCircle2, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function KPI({ label, value, tone, icon: Icon, trend }: { label: string; value: number; tone?: 'success' | 'warning'; icon?: LucideIcon; trend?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.02 }}
      className={cn(
        'rounded-[1.5rem] border bg-card/[0.03] p-5 shadow-sm transition-all group/kpi relative overflow-hidden',
        tone === 'success' && 'border-success/20 bg-success/5 shadow-success/10',
        tone === 'warning' && 'border-warning/20 bg-warning/5 shadow-warning/10',
        !tone && 'border-white/5'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground opacity-40">{label}</p>
        {Icon && <Icon className="h-3 w-3 opacity-20 group-hover/kpi:scale-110 transition-transform" />}
      </div>
      <div className="flex items-baseline gap-2">
        <p className={cn(
          'font-mono font-black text-2xl tracking-tighter tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
        )}>
          {value.toLocaleString('pt-BR')}
        </p>
        {trend && <span className="text-[10px] font-bold opacity-40">{trend}</span>}
      </div>
    </motion.div>
  );
}

export function ProblemKPI({
  icon: Icon,
  label,
  value,
  description,
  critical,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  description?: string;
  critical?: boolean;
}) {
  const ok = value === 0;
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={cn(
        'rounded-[1.5rem] border p-6 flex items-center gap-5 transition-all shadow-xl backdrop-blur-md relative overflow-hidden group',
        ok && 'border-success/20 bg-success/5 shadow-success/10',
        !ok && critical && 'border-destructive/20 bg-destructive/5 shadow-destructive/10',
        !ok && !critical && 'border-warning/20 bg-warning/5 shadow-warning/10',
      )}
    >
      <div className={cn(
        'p-3.5 rounded-2xl transition-all shadow-lg transform group-hover:rotate-12',
        ok && 'bg-success/20 text-success',
        !ok && critical && 'bg-destructive/20 text-destructive',
        !ok && !critical && 'bg-warning/20 text-warning',
      )}>
        <Icon className="h-6 w-6 shrink-0" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground opacity-40 mb-0.5">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className={cn(
            'font-mono font-black text-2xl tracking-tighter tabular-nums',
            ok && 'text-success',
            !ok && critical && 'text-destructive',
            !ok && !critical && 'text-warning',
          )}>
            {value.toLocaleString('pt-BR')}
          </p>
          {description && <span className="text-[9px] font-bold opacity-30 uppercase">{description}</span>}
        </div>
      </div>
    </motion.div>
  );
}

export function Row({
  severity,
  codigo,
  descricao,
  atual,
  msg,
  onCopy,
}: {
  severity: 'error' | 'warning';
  codigo: string;
  descricao: string;
  atual: string;
  msg: string;
  onCopy?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01, x: 5 }}
      className={cn(
        'flex items-start gap-4 rounded-2xl border p-4 text-xs transition-all shadow-sm group/row',
        severity === 'error' && 'border-destructive/20 bg-destructive/5 hover:border-destructive/40 hover:bg-destructive/10',
        severity === 'warning' && 'border-warning/20 bg-warning/5 hover:border-warning/40 hover:bg-warning/10',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className={cn(
            "font-mono font-black border-none",
            severity === 'error' ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
          )}>
            {codigo}
          </Badge>
          <span className="font-bold text-foreground opacity-80 truncate">{descricao}</span>
          <code
            className={cn(
              'font-mono ml-auto px-2.5 py-1 rounded-xl text-[10px] font-black tracking-tighter shadow-inner',
              severity === 'error' && 'bg-destructive/10 text-destructive',
              severity === 'warning' && 'bg-warning/10 text-warning',
            )}
          >
            {atual}
          </code>
        </div>
        <p className="text-muted-foreground mt-2 font-medium leading-relaxed">{msg}</p>
      </div>
      {onCopy && (
        <Button 
          size="icon" 
          variant="ghost" 
          className="h-8 w-8 shrink-0 rounded-xl hover:bg-current/10 transition-colors" 
          onClick={onCopy} 
          aria-label="Copiar"
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </motion.div>
  );
}

export function EmptyOk({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-success py-2 px-2">
      <CheckCircle2 className="h-4 w-4" /> {msg}
    </div>
  );
}
