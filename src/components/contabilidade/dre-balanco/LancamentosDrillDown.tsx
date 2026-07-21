import { useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';

interface PartidaRaw {
  tipo?: 'D' | 'C';
  valor: number | string;
  conta?: {
    codigo?: string;
    descricao?: string;
    nome?: string;
    tipo?: string;
    centro_resultado?: string;
  };
}

interface LancamentoRaw {
  data_lancamento: string;
  historico?: string;
  numero_lancamento?: number | string;
  partidas?: PartidaRaw[];
}

interface PartidaFlat extends PartidaRaw {
  data_lancamento: string;
  historico?: string;
  numero_lancamento?: number | string;
}

export interface LancamentosDrillDownProps {
  empresaId: string;
  ano: number;
  mes: number;
  centroResultado?: string;
  tipoBp?: string;
}

export function LancamentosDrillDown({ empresaId, ano, mes, centroResultado, tipoBp }: LancamentosDrillDownProps) {
  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId === 'todas' ? undefined : empresaId, ano);

  const partidasFiltradas = useMemo<PartidaFlat[]>(() => {
    const dataRefInicio = new Date(ano, mes, 1);
    const dataRefFim = new Date(ano, mes + 1, 0);

    const todasPartidas: PartidaFlat[] = [];
    (lancs as unknown as LancamentoRaw[]).forEach((l) => {
      const dataL = new Date(l.data_lancamento + 'T00:00:00');
      const dataOk = tipoBp ? dataL <= dataRefFim : (dataL >= dataRefInicio && dataL <= dataRefFim);

      if (dataOk && l.partidas) {
        l.partidas.forEach((p) => {
          todasPartidas.push({
            ...p,
            data_lancamento: l.data_lancamento,
            historico: l.historico,
            numero_lancamento: l.numero_lancamento,
          });
        });
      }
    });

    return todasPartidas.filter((p) => {
      if (centroResultado) {
        return p.conta?.centro_resultado === centroResultado;
      }
      if (tipoBp) {
        const codigo = p.conta?.codigo || '';
        const tipo = p.conta?.tipo?.toLowerCase() || '';
        if (tipoBp === 'circulante_ativo') return (tipo === 'ativo' || codigo.startsWith('1')) && !codigo.startsWith('1.2');
        if (tipoBp === 'nao_circ_ativo') return (tipo === 'ativo' || codigo.startsWith('1')) && codigo.startsWith('1.2');
        if (tipoBp === 'circulante_pas') return (tipo === 'passivo' || codigo.startsWith('2')) && !codigo.startsWith('2.2') && !codigo.startsWith('2.3') && !codigo.startsWith('3');
        if (tipoBp === 'nao_circ_pas') return (tipo === 'passivo' || codigo.startsWith('2')) && codigo.startsWith('2.2');
        if (tipoBp === 'pl') return (tipo === 'passivo' || codigo.startsWith('2')) && (codigo.startsWith('2.3') || codigo.startsWith('3'));
      }
      return true;
    });
  }, [lancs, mes, centroResultado, tipoBp, ano]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const total = partidasFiltradas.reduce((a, b) => a + Number(b.valor), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-black">
          {partidasFiltradas.length} Partidas Encontradas
        </Badge>
        <span className="text-xs font-black uppercase opacity-40">Total: {formatCurrency(total)}</span>
      </div>

      <div className="rounded-2xl border border-white/5 overflow-hidden">
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader className="bg-card/5 sticky top-0 z-20">
              <TableRow className="border-white/5">
                <TableHead className="text-[9px] font-black uppercase tracking-widest">Data</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest">Lanç.</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest">Conta</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-widest">D/C</TableHead>
                <TableHead className="text-right text-[9px] font-black uppercase tracking-widest">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partidasFiltradas.map((p, i) => (
                <TableRow key={i} className="border-white/5 hover:bg-card/5 transition-colors">
                  <TableCell className="text-[10px] font-bold py-3">{format(new Date(p.data_lancamento + 'T00:00:00'), 'dd/MM/yy')}</TableCell>
                  <TableCell className="text-[10px] font-mono py-3">#{p.numero_lancamento}</TableCell>
                  <TableCell className="py-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black">{p.conta?.descricao || p.conta?.nome}</span>
                      <span className="text-[9px] opacity-40 font-mono">{p.conta?.codigo}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant="outline" className={cn(
                      'text-[8px] font-black px-1.5 py-0 border-none',
                      p.tipo === 'D' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive',
                    )}>
                      {p.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-[11px] font-black py-3">{formatCurrency(Number(p.valor))}</TableCell>
                </TableRow>
              ))}
              {partidasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 opacity-40 text-xs font-bold uppercase">Nenhum lançamento analítico encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
