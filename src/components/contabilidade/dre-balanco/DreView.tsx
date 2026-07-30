import { AlertTriangle, ArrowUpRight, ChevronRight, Layers, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { DRELinha, DemonstrativosResult } from '@/hooks/useDemonstrativosContabeis';
import { inferCentroResultado, type DrillDownState } from './types';

export interface DreViewProps {
  dre: DemonstrativosResult['dre'];
  empresaTitulo: string;
  ano: number;
  mes: number;
  onOpenDrill: (state: DrillDownState) => void;
}

interface LinhaRowProps {
  linha: DRELinha;
  index: number;
  tone: 'success' | 'destructive';
  tooltip: string;
  onClick: () => void;
}

function LinhaRow({ linha, index, tone, tooltip, onClick }: LinhaRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="flex items-center justify-between py-4 px-5 rounded-2xl hover:bg-card/10 transition-all group/row cursor-pointer border border-transparent hover:border-white/5"
      style={{ marginLeft: `${(linha.nivel - 1) * 1.5}rem` }}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          'w-2 h-2 rounded-full transition-all group-hover/row:scale-125',
          tone === 'success' ? (linha.nivel === 1 ? 'bg-success' : 'bg-success/40') : (linha.nivel === 1 ? 'bg-destructive' : 'bg-destructive/40'),
        )} />
        <div className="flex flex-col">
          <span className={cn('text-xs font-black transition-colors group-hover/row:text-primary', linha.nivel === 1 ? 'text-foreground' : 'text-foreground/70')}>{linha.descricao}</span>
          <span className="font-mono text-[9px] opacity-40 uppercase tracking-tighter">{linha.codigo}</span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[10px] font-black opacity-30 tracking-tighter group-hover/row:opacity-60 transition-opacity">{linha.percentual.toFixed(1)}%</span>
            </TooltipTrigger>
            <TooltipContent className="bg-background/95 backdrop-blur-xl border-white/10 p-2 rounded-xl">
              <p className="text-[10px] font-bold">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className={cn('font-mono text-sm font-black tabular-nums group-hover/row:scale-105 transition-transform', tone === 'success' ? 'text-success' : 'text-destructive')}>
          {formatCurrency(linha.valor)}
        </span>
      </div>
    </motion.div>
  );
}

export function DreView({ dre, empresaTitulo, ano, mes, onOpenDrill }: DreViewProps) {
  const receitas = dre.linhas.filter((l) => l.tipo === 'receita' && l.nivel > 0);
  const despesas = dre.linhas.filter((l) => l.tipo === 'despesa');
  const custosTotais = dre.receitaBruta - dre.lucroLiquido;
  const margemLiq = ((dre.lucroLiquido / (dre.receitaBruta || 1)) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/5 border-white/5 p-4 rounded-3xl relative overflow-hidden group/kpi">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/kpi:scale-110 transition-transform">
            <TrendingUp className="h-12 w-12 text-success" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Receita Bruta</p>
          <p className="text-2xl font-black mt-2 font-mono text-success tabular-nums">{formatCurrency(dre.receitaBruta)}</p>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="h-3 w-3 text-success" />
            <span className="text-[10px] font-bold text-success/60">Faturamento Mensal</span>
          </div>
        </Card>

        <Card className="bg-card/5 border-white/5 p-4 rounded-3xl relative overflow-hidden group/kpi">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/kpi:scale-110 transition-transform">
            <TrendingDown className="h-12 w-12 text-destructive" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Custos & Despesas</p>
          <p className="text-2xl font-black mt-2 font-mono text-destructive tabular-nums">{formatCurrency(custosTotais)}</p>
          <div className="flex items-center gap-1 mt-2">
            <Layers className="h-3 w-3 text-destructive" />
            <span className="text-[10px] font-bold text-destructive/60">Operacional Total</span>
          </div>
        </Card>

        <Card className={cn(
          'border-none p-4 rounded-3xl relative overflow-hidden group/kpi',
          dre.lucroLiquido >= 0 ? 'bg-success/20 shadow-lg shadow-success/10' : 'bg-destructive/20 shadow-lg shadow-destructive/10',
        )}>
          <div className="absolute top-0 right-0 p-3 opacity-20 group-hover/kpi:scale-110 transition-transform">
            <Zap className="h-12 w-12" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Lucro Líquido</p>
          <p className="text-2xl font-black mt-2 font-mono tabular-nums">{formatCurrency(dre.lucroLiquido)}</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-tighter">Margem Líquida: {margemLiq}%</span>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <section className="bg-card/[0.02] rounded-3xl border border-white/5 overflow-hidden">
          <div className="bg-card/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" /> (+) Receitas Operacionais
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] border-success/20 bg-success/10 text-success">
              {formatCurrency(dre.receitaBruta)}
            </Badge>
          </div>
          <div className="p-2">
            <AnimatePresence>
              {receitas.length === 0 ? (
                <div className="py-8 text-center opacity-40 text-xs font-bold uppercase tracking-widest">Nenhuma receita detalhada</div>
              ) : receitas.map((l, i) => (
                <LinhaRow
                  key={i}
                  linha={l}
                  index={i}
                  tone="success"
                  tooltip="Representatividade na Receita Bruta"
                  onClick={() => onOpenDrill({
                    open: true,
                    titulo: `Partidas: ${l.descricao}`,
                    subtitulo: `${empresaTitulo} · Mês ${mes + 1}/${ano}`,
                    centro_resultado: inferCentroResultado(l.codigo),
                  })}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section className="bg-card/[0.02] rounded-3xl border border-white/5 overflow-hidden">
          <div className="bg-card/5 px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" /> (−) Custos e Despesas
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] border-destructive/20 bg-destructive/10 text-destructive">
              {formatCurrency(custosTotais)}
            </Badge>
          </div>
          <div className="p-2">
            <AnimatePresence>
              {despesas.map((l, i) => (
                <LinhaRow
                  key={i}
                  linha={l}
                  index={i}
                  tone="destructive"
                  tooltip="Impacto sobre a Receita Bruta"
                  onClick={() => onOpenDrill({
                    open: true,
                    titulo: `Partidas: ${l.descricao}`,
                    subtitulo: `${empresaTitulo} · Mês ${mes + 1}/${ano}`,
                    centro_resultado: inferCentroResultado(l.codigo),
                  })}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {dre.naoClassificadas.length > 0 && (
          <Alert className="bg-warning/10 border-warning/20 rounded-3xl p-6">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <div className="ml-4">
              <AlertTitle className="text-sm font-black uppercase tracking-widest text-warning">Divergência de Classificação</AlertTitle>
              <AlertDescription className="text-xs font-medium opacity-70 mt-1">
                Existem {dre.naoClassificadas.length} contas sem centro de resultado definido impactando o lucro em {formatCurrency(dre.totalNaoClassificado)}.
              </AlertDescription>
              <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-black uppercase tracking-widest text-warning mt-2 flex items-center gap-1">
                Corrigir no Plano de Contas <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </Alert>
        )}
      </div>
    </div>
  );
}
