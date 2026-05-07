import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, DollarSign, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency, formatDate, calculateOverdueDays } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ContaReceberWithRelations } from './ContasReceberTableRow';

interface ContasReceberKanbanProps {
  contas: ContaReceberWithRelations[];
  onSelectConta: (conta: ContaReceberWithRelations) => void;
}

const columns = [
  { id: 'pendente', label: 'Hold / Pending', icon: Clock, color: 'text-warning', bg: 'bg-warning/5', ring: 'ring-warning/20' },
  { id: 'vencido', label: 'Critical / Overdue', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/5', ring: 'ring-destructive/20' },
  { id: 'parcial', label: 'Partial Settle', icon: Wallet, color: 'text-secondary', bg: 'bg-secondary/5', ring: 'ring-secondary/20' },
  { id: 'pago', label: 'Cleared / Settled', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5', ring: 'ring-success/20' },
];

export function ContasReceberKanban({ contas, onSelectConta }: ContasReceberKanbanProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, ContaReceberWithRelations[]> = {
      pendente: [], vencido: [], parcial: [], pago: [],
    };
    contas.forEach(c => {
      const status = c.status as string;
      if (groups[status]) groups[status].push(c);
    });
    return groups;
  }, [contas]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {columns.map(col => {
        const items = grouped[col.id] || [];
        const total = items.reduce((sum, c) => sum + c.valor, 0);
        const Icon = col.icon;

        return (
          <div key={col.id} className="space-y-4">
            <Card className={cn(
              "border-none bg-background/20 backdrop-blur-3xl shadow-xl rounded-2xl overflow-hidden ring-1 ring-white/10",
              col.ring
            )}>
              <CardHeader className="p-5 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg bg-current/10", col.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                      {col.label}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black border-white/10 bg-white/5 rounded-md px-2 py-0.5">
                    {items.length}
                  </Badge>
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-xl font-black tabular-nums tracking-tighter text-foreground">{formatCurrency(total)}</span>
                  <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">Net Vol</span>
                </div>
              </CardHeader>
            </Card>

            <ScrollArea className="h-[600px] rounded-[1.5rem] pr-2">
              <div className="space-y-3 p-1">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/5 p-8 text-center bg-black/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/20 italic">No Command Records</p>
                  </div>
                ) : items.map((conta, i) => {
                  const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
                  return (
                    <motion.div
                      key={conta.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => onSelectConta(conta)}
                      className={cn(
                        "p-4 rounded-[1.25rem] border border-white/5 bg-background/30 backdrop-blur-md cursor-pointer hover:shadow-2xl transition-all duration-500 group relative overflow-hidden ring-1 ring-white/5 hover:ring-white/20",
                        col.bg
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-black tracking-tight text-foreground truncate">{conta.cliente_nome}</p>
                          {overdueDays > 0 && col.id !== 'pago' && (
                            <Badge variant="destructive" className="text-[8px] font-black px-1.5 py-0 rounded-md border-none bg-destructive/20 text-destructive animate-pulse">
                              {overdueDays}D
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] font-semibold text-muted-foreground/60 truncate mt-1 leading-none">{conta.descricao}</p>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-base font-black tabular-nums tracking-tighter text-foreground">{formatCurrency(conta.valor)}</span>
                          <div className="flex items-center gap-1 opacity-40">
                            <span className="text-[9px] font-bold tabular-nums">{formatDate(conta.data_vencimento)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
}
