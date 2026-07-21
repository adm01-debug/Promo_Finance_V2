import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Activity, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import type { RazaoGrupo } from './types';

interface Props { razao: RazaoGrupo[] }

export function RazaoList({ razao }: Props) {
  if (razao.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed border-white/10 rounded-[2.5rem] bg-card/[0.02]">
        <Activity className="h-10 w-10 opacity-20 mb-4" />
        <p className="text-sm font-bold uppercase tracking-widest">Nenhuma conta com movimento</p>
      </div>
    );
  }

  let gSaldoInicial = 0;
  let gDebitos = 0;
  let gCreditos = 0;
  let gSaldoFinal = 0;

  const cards = razao.map((g, idx) => {
    let saldo = g.saldo_inicial;
    let dTotal = 0;
    let cTotal = 0;
    const linhas = g.movs.map((m) => {
      saldo += m.debito - m.credito;
      dTotal += m.debito;
      cTotal += m.credito;
      return { ...m, saldoAcumulado: saldo };
    });
    const saldoFinal = saldo;
    const saldoCalculado = g.saldo_inicial + dTotal - cTotal;
    const diff = saldoFinal - saldoCalculado;
    const ok = Math.abs(diff) < 0.01;

    gSaldoInicial += g.saldo_inicial;
    gDebitos += dTotal;
    gCreditos += cTotal;
    gSaldoFinal += saldoFinal;

    return (
      <motion.div key={g.conta_id}
        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: (idx % 10) * 0.05 }}
        className="border-none bg-card/[0.02] shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-white/5 group/card"
      >
        <div className="bg-card/5 p-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-2xl group-hover/card:scale-110 transition-transform">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-mono text-xs font-black text-primary tracking-tighter">{g.codigo}</p>
              <p className="text-sm font-black uppercase tracking-widest opacity-80">{g.nome}</p>
            </div>
          </div>
          <Badge variant="outline" className="h-10 rounded-xl font-mono font-black border-none bg-card/5 px-4 text-xs">
            Saldo Inicial: {formatCurrency(g.saldo_inicial)}
          </Badge>
        </div>
        <div className="overflow-hidden">
          <Table>
            <TableHeader className="bg-card/[0.01]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[9px] font-black uppercase tracking-widest p-4 pl-6">Data</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest">Histórico</TableHead>
                <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Débito</TableHead>
                <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Crédito</TableHead>
                <TableHead className="text-right text-[9px] font-black uppercase tracking-widest pr-6">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((m, i) => (
                <TableRow key={i}>
                  <TableCell className="whitespace-nowrap">{format(new Date(`${m.data}T00:00:00`), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="max-w-[300px] truncate" title={m.historico}>{m.historico}</TableCell>
                  <TableCell className="text-right font-mono">{m.debito ? formatCurrency(m.debito) : '—'}</TableCell>
                  <TableCell className="text-right font-mono">{m.credito ? formatCurrency(m.credito) : '—'}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(m.saldoAcumulado)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Totais do período</TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatCurrency(dTotal)}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatCurrency(cTotal)}</TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatCurrency(saldoFinal)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={5} className="py-2">
                  <div
                    className={`flex flex-wrap items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium ${
                      ok ? 'bg-success/10 text-success border border-success/20' : 'bg-warning/10 text-warning border border-warning/20'
                    }`}
                    role="status" aria-live="polite"
                  >
                    <span aria-hidden>{ok ? '✓' : '⚠'}</span>
                    <span className="font-mono">
                      {formatCurrency(g.saldo_inicial)} + {formatCurrency(dTotal)} − {formatCurrency(cTotal)} = {formatCurrency(saldoCalculado)}
                    </span>
                    {ok ? <span>· bate com o saldo final</span> : <span>· divergência de {formatCurrency(Math.abs(diff))} no saldo final</span>}
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </motion.div>
    );
  });

  const gSaldoCalc = gSaldoInicial + gDebitos - gCreditos;
  const gDiff = gSaldoFinal - gSaldoCalc;
  const gOk = Math.abs(gDiff) < 0.01 && Math.abs(gDebitos - gCreditos) < 0.01;

  return (
    <div className="space-y-10">
      {cards}
      <div
        className={`rounded-md border px-4 py-3 ${gOk ? 'bg-success/5 border-success/30' : 'bg-warning/5 border-warning/30'}`}
        role="status" aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span aria-hidden>{gOk ? '✓' : '⚠'}</span>
            <span className={gOk ? 'text-success' : 'text-warning'}>
              {gOk ? 'Razão consistente' : 'Razão com divergência'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs">
            <div><span className="text-muted-foreground">Saldo inicial:</span> <span className="font-mono font-semibold">{formatCurrency(gSaldoInicial)}</span></div>
            <div><span className="text-muted-foreground">Débitos:</span> <span className="font-mono font-semibold">{formatCurrency(gDebitos)}</span></div>
            <div><span className="text-muted-foreground">Créditos:</span> <span className="font-mono font-semibold">{formatCurrency(gCreditos)}</span></div>
            <div><span className="text-muted-foreground">Saldo final:</span> <span className="font-mono font-semibold">{formatCurrency(gSaldoFinal)}</span></div>
          </div>
        </div>
        {!gOk && (
          <p className="mt-2 text-xs text-warning">
            Diferença total: {formatCurrency(Math.abs(gDiff))} · Débitos − Créditos = {formatCurrency(gDebitos - gCreditos)}
          </p>
        )}
      </div>
    </div>
  );
}
