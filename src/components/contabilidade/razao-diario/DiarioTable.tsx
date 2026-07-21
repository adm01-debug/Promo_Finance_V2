import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import type { PartidaFlat } from './types';

interface Props {
  diario: PartidaFlat[];
  totais: { debito: number; credito: number };
}

export function DiarioTable({ diario, totais }: Props) {
  if (diario.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-[2.5rem] bg-card/[0.02]">
        <Activity className="h-10 w-10 opacity-20 mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest">Nenhuma partida no período</p>
      </div>
    );
  }
  const diff = totais.debito - totais.credito;
  const ok = Math.abs(diff) < 0.01;
  return (
    <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-card/[0.01] shadow-inner">
      <Table>
        <TableHeader className="bg-card/5">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-[10px] font-black uppercase tracking-widest p-6">Data</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Nº</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Histórico</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Conta Contábil</TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Débito</TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Crédito</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {diario.slice(0, 1000).map((p, i) => (
              <motion.tr key={i}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 20) * 0.005 }}
                className="border-white/5 hover:bg-card/5 transition-colors group/row"
              >
                <TableCell className="p-6 text-[10px] font-black uppercase tracking-widest opacity-60">
                  {format(new Date(`${p.data}T00:00:00`), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono font-black text-[10px] border-none bg-primary/10 text-primary px-2 rounded-lg">
                    {p.numero ?? '—'}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[300px] truncate font-bold text-foreground/80" title={p.historico}>{p.historico}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] font-black text-primary">{p.conta_codigo}</span>
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest truncate max-w-[200px]">{p.conta_nome}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono font-black text-xs tabular-nums text-success">
                  {p.debito ? formatCurrency(p.debito) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono font-black text-xs tabular-nums text-destructive">
                  {p.credito ? formatCurrency(p.credito) : '—'}
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="font-semibold">Totais</TableCell>
            <TableCell className="text-right font-mono font-semibold">{formatCurrency(totais.debito)}</TableCell>
            <TableCell className="text-right font-mono font-semibold">{formatCurrency(totais.credito)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell colSpan={6} className="py-2">
              <div
                className={`flex flex-wrap items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                  ok ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                }`}
                role="status" aria-live="polite"
              >
                <span aria-hidden>{ok ? '✓' : '⚠'}</span>
                {ok ? (
                  <span>Validação OK · Débitos = Créditos = {formatCurrency(totais.debito)}</span>
                ) : (
                  <span>Partidas dobradas não fecham · Diferença: {formatCurrency(Math.abs(diff))}</span>
                )}
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
