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
  { id: 'pendente', label: 'Pendente', icon: Clock, color: 'border-t-warning text-warning', bg: 'bg-warning/5' },
  { id: 'vencido', label: 'Vencido', icon: AlertTriangle, color: 'border-t-destructive text-destructive', bg: 'bg-destructive/5' },
  { id: 'parcial', label: 'Parcial', icon: Wallet, color: 'border-t-secondary text-secondary', bg: 'bg-secondary/5' },
  { id: 'pago', label: 'Pago', icon: CheckCircle2, color: 'border-t-success text-success', bg: 'bg-success/5' },
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map(col => {
        const items = grouped[col.id] || [];
        const total = items.reduce((sum, c) => sum + c.valor, 0);
        const Icon = col.icon;

        return (
          <Card key={col.id} className={cn("border-t-4", col.color)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {col.label}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {items.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-medium tabular-nums">{formatCurrency(total)}</p>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 p-1">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">Nenhum título</p>
                  ) : items.map((conta, i) => {
                    const overdueDays = calculateOverdueDays(new Date(conta.data_vencimento));
                    return (
                      <motion.div
                        key={conta.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => onSelectConta(conta)}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all hover:-translate-y-0.5",
                          col.bg
                        )}
                      >
                        <p className="text-sm font-medium truncate">{conta.cliente_nome}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conta.descricao}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold tabular-nums">{formatCurrency(conta.valor)}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(conta.data_vencimento)}</span>
                        </div>
                        {overdueDays > 0 && col.id !== 'pago' && (
                          <p className="text-xs text-destructive font-medium mt-1">{overdueDays}d atraso</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
