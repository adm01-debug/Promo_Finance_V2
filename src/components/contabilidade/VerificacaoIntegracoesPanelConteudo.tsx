import { format } from 'date-fns';
import { Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface VerificacaoIntegracoesPanelConteudoProps {
  resumos: import('@/hooks/useVerificacaoIntegracoes').ResumoIntegracao[];
}

export function VerificacaoIntegracoesPanelConteudo({
  resumos,
}: VerificacaoIntegracoesPanelConteudoProps) {
  return (
    <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-card/[0.01] shadow-inner">
      <Table>
        <TableHeader className="bg-card/5">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-[10px] font-black uppercase tracking-widest p-6">
              Origem de Dados
            </TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
              Registros
            </TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
              Conformes
            </TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
              Divergências
            </TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
              Sem Partidas
            </TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
              Montante
            </TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">
              Data Última
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest pr-8">
              Saúde Fiscal
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {resumos.map((r, idx) => {
              const taxa = r.total > 0 ? Math.round((r.ok / r.total) * 100) : 100;
              const saudavel = taxa >= 95 && r.desbalanceados === 0;
              return (
                <motion.tr
                  key={r.origem}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-white/5 hover:bg-card/5 transition-colors group/row"
                >
                  <TableCell className="p-6">
                    <Badge
                      variant="outline"
                      className="capitalize border-none bg-primary/10 text-primary font-black text-[10px] px-3 py-1 rounded-xl flex items-center gap-2 w-fit"
                    >
                      <Zap className="h-3 w-3" />
                      {r.origem}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold tabular-nums">
                    {r.total.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-success font-black tabular-nums">
                    {r.ok.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-mono text-xs tabular-nums',
                      r.desbalanceados > 0 ? 'text-destructive font-black' : 'opacity-20'
                    )}
                  >
                    {r.desbalanceados || '0'}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-mono text-xs tabular-nums',
                      r.sem_partidas > 0 ? 'text-warning font-black' : 'opacity-20'
                    )}
                  >
                    {r.sem_partidas || '0'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-black text-foreground/80 tabular-nums">
                    {formatCurrency(r.valor_total)}
                  </TableCell>
                  <TableCell className="text-right text-[10px] font-black uppercase tracking-widest opacity-40">
                    {r.ultima_importacao
                      ? format(new Date(r.ultima_importacao + 'T00:00:00'), 'dd/MM/yyyy')
                      : '—'}
                  </TableCell>
                  <TableCell className="pr-8">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-card/5 rounded-full overflow-hidden w-16">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${taxa}%` }}
                          className={cn('h-full', saudavel ? 'bg-success' : 'bg-destructive')}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-black tabular-nums',
                          saudavel ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {taxa}%
                      </span>
                    </div>
                  </TableCell>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
