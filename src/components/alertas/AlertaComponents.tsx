import { motion } from 'framer-motion';
import { AlertCircle, XCircle, AlertTriangle, Info, Bell, Calendar, Users, TrendingDown, DollarSign, CheckCircle2, Clock, Eye, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type PrioridadeAlerta, type Alerta } from '@/hooks/useAlertas';

// ─── Config Maps ──────────────────────────────────────────
export const prioridadeConfig: Record<PrioridadeAlerta, { 
  label: string; color: string; bgColor: string; borderColor: string; 
  glowColor: string; icon: typeof AlertCircle; gradient: string;
}> = {
  critica: { label: 'Crítica', color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/30', glowColor: 'shadow-destructive/20', icon: XCircle, gradient: 'from-destructive/20 to-destructive/5' },
  alta: { label: 'Alta', color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30', glowColor: 'shadow-warning/20', icon: AlertTriangle, gradient: 'from-warning/20 to-warning/5' },
  media: { label: 'Média', color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/30', glowColor: 'shadow-primary/20', icon: AlertCircle, gradient: 'from-primary/20 to-primary/5' },
  baixa: { label: 'Baixa', color: 'text-muted-foreground', bgColor: 'bg-muted', borderColor: 'border-border', glowColor: 'shadow-muted/20', icon: Info, gradient: 'from-muted to-muted/50' },
};

export const tipoConfig: Record<string, { label: string; icon: typeof Calendar; color: string }> = {
  vencimento: { label: 'Vencimento', icon: Calendar, color: 'text-warning' },
  fluxo_caixa: { label: 'Fluxo de Caixa', icon: TrendingDown, color: 'text-destructive' },
  inadimplencia: { label: 'Inadimplência', icon: Users, color: 'text-accent-foreground' },
  conciliacao: { label: 'Conciliação', icon: CheckCircle2, color: 'text-secondary-foreground' },
  meta: { label: 'Meta', icon: DollarSign, color: 'text-success' },
  sistema: { label: 'Sistema', icon: Bell, color: 'text-muted-foreground' },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// ─── KPI Card ─────────────────────────────────────────────
export function AlertaKPICard({ prioridade, count, config }: { 
  prioridade: PrioridadeAlerta; count: number; config: typeof prioridadeConfig.critica;
}) {
  const Icon = config.icon;
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -2, scale: 1.02 }} transition={{ type: 'spring', stiffness: 400 }}>
      <div className={cn(
        "relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all duration-300",
        "bg-gradient-to-br", config.gradient, config.borderColor,
        count > 0 && `shadow-lg ${config.glowColor}`, "hover:shadow-xl group"
      )}>
        {count > 0 && (
          <div className={cn(
            "absolute -top-6 -right-6 h-16 w-16 rounded-full blur-2xl opacity-30",
            prioridade === 'critica' && "bg-destructive",
            prioridade === 'alta' && "bg-warning",
            prioridade === 'media' && "bg-primary",
            prioridade === 'baixa' && "bg-muted-foreground",
          )} />
        )}
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{config.label}</p>
            <p className="text-3xl font-bold font-display">
              <motion.span key={count} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums">{count}</motion.span>
            </p>
          </div>
          <motion.div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", config.bgColor, "group-hover:scale-110 transition-transform duration-300")} whileHover={{ rotate: 5 }}>
            <Icon className={cn("h-6 w-6", config.color)} />
          </motion.div>
        </div>
        <div className="mt-3 h-1 w-full rounded-full bg-background/50 overflow-hidden">
          <motion.div className={cn("h-full rounded-full",
            prioridade === 'critica' && "bg-destructive", prioridade === 'alta' && "bg-warning",
            prioridade === 'media' && "bg-primary", prioridade === 'baixa' && "bg-muted-foreground",
          )} initial={{ width: '0%' }} animate={{ width: count > 0 ? `${Math.min(count * 20, 100)}%` : '0%' }} transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Alert Row Item ───────────────────────────────────────
export function AlertaRow({ alerta, isSelected, onToggle, onMarkRead, onNavigate, isPending }: {
  alerta: Alerta; isSelected: boolean; onToggle: () => void; onMarkRead: () => void; onNavigate: () => void; isPending: boolean;
}) {
  const tipoInfo = tipoConfig[alerta.tipo] || tipoConfig.sistema;
  const prioridadeInfo = prioridadeConfig[alerta.prioridade];
  const TipoIcon = tipoInfo.icon;

  const formatDate = (dateStr: string) => {
    try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR }); }
    catch { return dateStr; }
  };

  return (
    <motion.div variants={itemVariants} layout className={cn(
      "group relative p-4 sm:p-5 transition-all duration-200 border-b border-border/50 last:border-b-0",
      !alerta.lido && "bg-primary/[0.03]", "hover:bg-muted/50"
    )}>
      {!alerta.lido && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-primary to-primary/50 rounded-r" />}
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="pt-0.5"><Checkbox checked={isSelected} onChange={onToggle} /></div>
        <motion.div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", prioridadeInfo.bgColor, prioridadeInfo.borderColor, "border")} whileHover={{ scale: 1.1, rotate: 5 }}>
          <TipoIcon className={cn("h-5 w-5", tipoInfo.color)} />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn("text-sm truncate", !alerta.lido ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>{alerta.titulo}</h4>
            {!alerta.lido && <motion.span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2.5 leading-relaxed">{alerta.mensagem}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("gap-1 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5", prioridadeInfo.color, prioridadeInfo.borderColor)}>{prioridadeInfo.label}</Badge>
            <Badge variant="secondary" className="gap-1 text-[10px] px-2 py-0.5"><TipoIcon className="h-3 w-3" />{tipoInfo.label}</Badge>
            <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(alerta.created_at)}</span>
          </div>
          {(alerta.acao_url || alerta.entidade_tipo) && (
            <Button variant="link" size="sm" className="px-0 mt-2 h-auto text-xs gap-1" onClick={onNavigate}>Ver detalhes<ArrowRight className="h-3 w-3" /></Button>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!alerta.lido && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMarkRead} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Premium Empty State ──────────────────────────────────
export function AlertaEmptyState({ type }: { type: 'all' | 'category' }) {
  const { ShieldCheck, BellOff, Activity } = require('lucide-react');
  return (
    <motion.div className="flex flex-col items-center justify-center py-16 px-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
      <div className="relative mb-6">
        <motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-success/20 to-primary/10 blur-xl" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 3, repeat: Infinity }} />
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-success/20 to-success/5 border border-success/20 flex items-center justify-center">
          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            {type === 'all' ? <ShieldCheck className="h-10 w-10 text-success" /> : <BellOff className="h-10 w-10 text-muted-foreground" />}
          </motion.div>
        </div>
      </div>
      <h3 className="text-xl font-display font-semibold mb-2">{type === 'all' ? 'Tudo sob controle!' : 'Nenhum alerta nesta categoria'}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
        {type === 'all' ? 'Seu financeiro está saudável. Alertas automáticos aparecerão aqui quando detectarmos vencimentos próximos, inadimplências ou riscos no fluxo de caixa.' : 'Quando houver alertas relevantes nesta categoria, eles aparecerão aqui com ações recomendadas.'}
      </p>
      {type === 'all' && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
          {[
            { icon: Calendar, label: 'Vencimentos', desc: 'Contas próximas do prazo' },
            { icon: Users, label: 'Inadimplência', desc: 'Clientes em atraso' },
            { icon: Activity, label: 'Fluxo de Caixa', desc: 'Riscos de liquidez' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-muted/30">
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs font-medium">{item.label}</span>
              <span className="text-[10px] text-muted-foreground text-center">{item.desc}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
