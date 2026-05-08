import { History, MessageCircle, FileText, CheckCircle2, Zap, ArrowRightLeft } from 'lucide-react';
import { formatDateTime, formatCurrency } from '@/lib/formatters';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const operacaoLabels: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
};

const eventConfig: Record<string, { icon: any, color: string, label: string }> = {
  criacao: { icon: FileText, color: 'text-blue-400', label: 'Criação' },
  status_change: { icon: ArrowRightLeft, color: 'text-warning', label: 'Mudança de Status' },
  baixa_automatica: { icon: Zap, color: 'text-primary', label: 'Baixa Automática' },
  envio_boleto: { icon: MessageCircle, color: 'text-success', label: 'Envio de Boleto' },
  conciliacao: { icon: CheckCircle2, color: 'text-success', label: 'Conciliação' },
};

interface AuditItem {
  id: string;
  operacao: string;
  created_at: string;
  dados_novos?: Record<string, unknown> | null;
}

interface EventItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  metadata?: any;
}

export function DrawerTimelineTab({ auditHistory, events = [] }: { auditHistory: AuditItem[], events?: EventItem[] }) {
  const allItems = [
    ...auditHistory.map(a => ({ ...a, type: 'audit', sortDate: new Date(a.created_at) })),
    ...events.map(e => ({ ...e, type: 'event', sortDate: new Date(e.timestamp) })),
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  if (allItems.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum histórico encontrado</p>
      </div>
    );
  }

  return (
    <div className="relative pt-2">
      <div className="absolute left-[27px] top-0 bottom-0 w-px bg-white/10" />
      <div className="space-y-6">
        {allItems.map((item: any) => {
          if (item.type === 'audit') {
            return (
              <div key={item.id} className="relative pl-14 pb-1">
                <div className="absolute left-6 top-1 h-2 w-2 rounded-full bg-white/20 border border-background z-10" />
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-muted-foreground/60 text-[10px] uppercase tracking-widest">{operacaoLabels[item.operacao] || item.operacao}</p>
                    <span className="text-[10px] text-muted-foreground/40">• {formatDateTime(item.created_at)}</span>
                  </div>
                  {item.dados_novos && item.operacao === 'UPDATE' && (
                    <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/5 text-[10px] space-y-0.5">
                      {Object.entries(item.dados_novos).slice(0, 3).map(([key, val]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-muted-foreground uppercase font-black opacity-40">{key}:</span>
                          <span className="truncate">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          const config = eventConfig[item.type] || { icon: History, color: 'text-muted-foreground', label: item.type };
          const Icon = config.icon;

          return (
            <div key={item.id} className="relative pl-14">
              <div className={cn("absolute left-4 top-0 h-7 w-7 rounded-lg border border-white/10 flex items-center justify-center bg-background z-10 shadow-xl", config.color)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <p className={cn("font-black text-[10px] uppercase tracking-[0.15em]", config.color)}>{config.label}</p>
                  <span className="text-[10px] text-muted-foreground/40">• {formatDateTime(item.timestamp)}</span>
                </div>
                <p className="text-white/80 font-medium mt-1 leading-relaxed">{item.message}</p>
                {item.metadata?.transacao_banco && (
                  <div className="mt-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-[10px] space-y-1">
                    <p className="font-black text-primary uppercase tracking-widest opacity-60">Evidência Bancária</p>
                    <div className="flex justify-between">
                      <span className="text-white/60">{item.metadata.transacao_banco.descricao}</span>
                      <span className="font-black text-white">{formatCurrency(item.metadata.transacao_banco.valor)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
