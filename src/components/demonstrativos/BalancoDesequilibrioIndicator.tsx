import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, ExternalLink, ChevronRight } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/formatters';
import { useLancamentosContabeis } from '@/hooks/useLancamentosContabeis';

interface Props {
  empresaId: string;
  mes: number;
  ano: number;
  totalAtivo: number;
  totalPassivo: number;
  equilibrado: boolean;
}

interface PartidaRow { tipo: string; valor: number; conta?: { codigo?: string; descricao?: string | null; nome?: string | null } | null }
interface LancRow {
  id: string;
  data_lancamento: string;
  historico: string;
  numero_lancamento: number | null;
  valor_total: number;
  partidas?: PartidaRow[] | null;
}

export function BalancoDesequilibrioIndicator({ empresaId, mes, ano, totalAtivo, totalPassivo, equilibrado }: Props) {
  const navigate = useNavigate();
  const { data: lancs = [], isLoading } = useLancamentosContabeis(empresaId, ano);

  const diferenca = totalAtivo - totalPassivo;
  const diferencaAbs = Math.abs(diferenca);

  // Top lançamentos do mês ordenados por valor (heurística "mais impactam")
  const topLancamentos = useMemo(() => {
    const inicio = new Date(ano, mes, 1);
    const fim = new Date(ano, mes + 1, 0, 23, 59, 59);
    return (lancs as LancRow[])
      .filter((l) => {
        const d = new Date(l.data_lancamento + 'T00:00:00');
        return d >= inicio && d <= fim;
      })
      .sort((a, b) => Number(b.valor_total) - Number(a.valor_total))
      .slice(0, 5);
  }, [lancs, mes, ano]);

  const irParaLancamentos = () => {
    navigate(`/contabilidade?tab=lancamentos&empresa=${empresaId}&ano=${ano}&mes=${mes + 1}`);
  };

  if (equilibrado) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-2.5 flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <span className="text-sm font-medium text-success">Balanço equilibrado em tempo real</span>
        <span className="text-xs text-muted-foreground ml-auto">
          Ativo {formatCurrency(totalAtivo)} = Passivo+PL {formatCurrency(totalPassivo)}
        </span>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.005 }}
          className="w-full text-left rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 flex items-center gap-3 hover:bg-destructive/10 transition-colors group"
          aria-label="Investigar desequilíbrio do balanço"
        >
          <div className="relative">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-ping" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-destructive">Balanço desequilibrado</span>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide border-destructive/40 text-destructive">
                Tempo real
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Diferença de <span className="font-mono font-semibold text-destructive">{diferenca >= 0 ? '+' : ''}{formatCurrency(diferenca)}</span> entre Ativo e Passivo+PL
            </div>
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">Investigar</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] p-0" sideOffset={8}>
        <div className="p-4 border-b border-border/60 bg-destructive/5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h4 className="text-sm font-semibold">Lançamentos com maior impacto no período</h4>
          </div>
          <p className="text-xs text-muted-foreground">
            Diferença atual: <span className="font-mono font-bold text-destructive">{formatCurrency(diferencaAbs)}</span> — revise os lançamentos abaixo, em ordem do maior valor.
          </p>
        </div>

        <div className="max-h-[320px] overflow-auto">
          <AnimatePresence>
            {isLoading ? (
              <div className="p-6 text-center text-xs text-muted-foreground">Carregando lançamentos…</div>
            ) : topLancamentos.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Nenhum lançamento no período. O desequilíbrio pode vir de saldos anteriores ao mês.
              </div>
            ) : (
              topLancamentos.map((l, idx) => (
                <motion.button
                  key={l.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={irParaLancamentos}
                  className="w-full text-left px-4 py-2.5 border-b border-border/40 hover:bg-muted/40 transition-colors flex items-start gap-3"
                >
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5 w-8 shrink-0">
                    #{l.numero_lancamento ?? '—'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{l.historico || 'Sem histórico'}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(l.data_lancamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-sm font-mono font-semibold tabular-nums shrink-0">
                    {formatCurrency(Number(l.valor_total))}
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground mt-1 shrink-0" />
                </motion.button>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-3 border-t border-border/60 bg-muted/20">
          <Button onClick={irParaLancamentos} className="w-full gap-2" size="sm">
            Ver todos os lançamentos do período
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
