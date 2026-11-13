import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PlanoContasTabConteudoProps {
  filtered: import('@/hooks/usePlanoContas').PlanoContaRow[];
}

export function PlanoContasTabConteudo({ filtered }: PlanoContasTabConteudoProps) {
  return (
    <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-card/[0.01] shadow-inner">
      <Table>
        <TableHeader className="bg-card/5">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="w-40 text-[10px] font-black uppercase tracking-widest p-6">
              Código
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">
              Descrição
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">
              Natureza
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">Tipo</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest">
              Cód. Referencial
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence>
            {filtered.slice(0, 200).map((c, idx) => (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.005 }}
                className="border-white/5 hover:bg-card/5 transition-colors group/row"
              >
                <TableCell className="p-6">
                  <Badge
                    variant="outline"
                    className="font-mono font-black text-xs border-none bg-primary/10 text-primary px-3 py-1 rounded-lg"
                  >
                    {c.codigo}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-foreground/80">
                  <div className="flex flex-col">
                    <span className="text-sm font-black tracking-tight">{c.descricao}</span>
                    <span className="text-[9px] font-bold uppercase opacity-30 tracking-widest">
                      {c.natureza}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'uppercase text-[9px] font-black tracking-widest border-none px-3 py-1 rounded-full flex items-center gap-1.5 w-fit',
                      c.natureza === 'ativo'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : c.natureza === 'passivo'
                          ? 'bg-rose-500/10 text-rose-400'
                          : c.natureza === 'patrimonio'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-primary/10 text-primary'
                    )}
                  >
                    <div
                      className={cn(
                        'h-1 w-1 rounded-full animate-pulse',
                        c.natureza === 'ativo'
                          ? 'bg-emerald-400'
                          : c.natureza === 'passivo'
                            ? 'bg-rose-400'
                            : 'bg-primary-400'
                      )}
                    />
                    {c.natureza}
                  </Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full cursor-help',
                            c.tipo === 'analitica'
                              ? 'bg-purple-500/10 text-purple-400'
                              : 'bg-blue-500/10 text-blue-400'
                          )}
                        >
                          {c.tipo}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background/95 backdrop-blur-xl border-white/10 p-2 rounded-xl">
                        <p className="text-[10px] font-bold">
                          Conta{' '}
                          {c.tipo === 'analitica' ? 'que recebe lançamentos' : 'que soma saldos'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="font-mono text-xs font-black tracking-tighter">
                  {c.codigo_referencial ? (
                    <div className="flex items-center gap-2 text-primary">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{c.codigo_referencial}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground/30">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-[10px] font-black uppercase">Não vinculado</span>
                    </div>
                  )}
                </TableCell>
              </motion.tr>
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
