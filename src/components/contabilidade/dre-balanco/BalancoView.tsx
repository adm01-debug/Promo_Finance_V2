import { AlertTriangle, ArrowUpRight, CheckCircle2, Info as InfoIcon, Scale, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import type { BalancoLinha, DemonstrativosResult } from '@/hooks/useDemonstrativosContabeis';
import { inferTipoBpAtivo, inferTipoBpPassivo, type DrillDownState } from './types';

export interface BalancoViewProps {
  balanco: DemonstrativosResult['balanco'];
  empresaTitulo: string;
  ano: number;
  mes: number;
  onOpenDrill: (state: DrillDownState) => void;
}

interface BalancoRowProps {
  linha: BalancoLinha;
  index: number;
  tone: 'primary' | 'secondary';
  animateFrom: 'left' | 'right';
  onClick: () => void;
}

function BalancoRow({ linha, index, tone, animateFrom, onClick }: BalancoRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: animateFrom === 'left' ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={onClick}
      className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-card/5 transition-colors group/row cursor-pointer"
      style={{ marginLeft: `${linha.nivel * 1.5}rem` }}
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-1.5 h-1.5 rounded-full opacity-40', linha.nivel === 0 ? (tone === 'primary' ? 'bg-primary' : 'bg-secondary') : 'bg-card/40')} />
        <div className="flex flex-col">
          <span className={cn('text-xs font-bold', linha.nivel === 0 ? 'text-foreground' : 'text-foreground/70')}>{linha.descricao}</span>
          <span className="font-mono text-[9px] opacity-40 uppercase tracking-tighter">{linha.codigo}</span>
        </div>
      </div>
      <span className={cn('font-mono text-xs font-black tabular-nums', linha.nivel === 0 ? (tone === 'primary' ? 'text-primary' : 'text-secondary') : 'text-foreground/60')}>
        {formatCurrency(linha.valor)}
      </span>
    </motion.div>
  );
}

export function BalancoView({ balanco, empresaTitulo, ano, mes, onOpenDrill }: BalancoViewProps) {
  const equilibrado = balanco.equilibrado;
  const sectionClass = 'border-none bg-card/[0.02] shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-white/5 group/card';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className={sectionClass}>
          <div className="bg-card/5 px-8 py-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <ArrowUpRight className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest opacity-80">Ativo Total</h3>
                <p className="text-[10px] font-bold text-primary uppercase">Bens e Direitos</p>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs border-none bg-card/5 px-4 h-10 rounded-xl">
              {balanco.ativo.length} Contas
            </Badge>
          </div>
          <div className="p-4 space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {balanco.ativo.map((l, i) => (
                <BalancoRow
                  key={i}
                  linha={l}
                  index={i}
                  tone="primary"
                  animateFrom="left"
                  onClick={() => onOpenDrill({
                    open: true,
                    titulo: `Analítico: ${l.descricao}`,
                    subtitulo: `${empresaTitulo} · Acumulado até ${mes + 1}/${ano}`,
                    tipo_bp: inferTipoBpAtivo(l.codigo),
                  })}
                />
              ))}
            </AnimatePresence>
          </div>
          <div className="bg-card/5 p-6 border-t border-white/5 flex items-center justify-between font-black">
            <span className="text-xs uppercase tracking-widest opacity-60">Total do Ativo</span>
            <span className="font-mono text-lg text-primary tabular-nums">{formatCurrency(balanco.totalAtivo)}</span>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="bg-card/5 px-8 py-6 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary/20 rounded-2xl">
                <Scale className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest opacity-80">Passivo + PL</h3>
                <p className="text-[10px] font-bold text-secondary uppercase">Dívidas e Capital</p>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs border-none bg-card/5 px-4 h-10 rounded-xl">
              {balanco.passivo.length} Contas
            </Badge>
          </div>
          <div className="p-4 space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {balanco.passivo.map((l, i) => (
                <BalancoRow
                  key={i}
                  linha={l}
                  index={i}
                  tone="secondary"
                  animateFrom="right"
                  onClick={() => onOpenDrill({
                    open: true,
                    titulo: `Analítico: ${l.descricao}`,
                    subtitulo: `${empresaTitulo} · Acumulado até ${mes + 1}/${ano}`,
                    tipo_bp: inferTipoBpPassivo(l.codigo),
                  })}
                />
              ))}
            </AnimatePresence>
          </div>
          <div className="bg-card/5 p-6 border-t border-white/5 flex items-center justify-between font-black">
            <span className="text-xs uppercase tracking-widest opacity-60">Total Passivo + PL</span>
            <span className="font-mono text-lg text-secondary tabular-nums">{formatCurrency(balanco.totalPassivo)}</span>
          </div>
        </section>
      </div>

      <Card className={cn(
        'rounded-[2.5rem] border-none p-8 transition-all shadow-3xl relative overflow-hidden group',
        equilibrado ? 'bg-success/20 ring-1 ring-success/30' : 'bg-destructive/20 ring-1 ring-destructive/30',
      )}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-50" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className={cn(
              'p-5 rounded-[2rem] shadow-xl transform group-hover:scale-110 transition-transform duration-500',
              equilibrado ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground',
            )}>
              {equilibrado ? <CheckCircle2 className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8 animate-bounce" />}
            </div>
            <div>
              <h2 className={cn('text-2xl font-black tracking-tighter', equilibrado ? 'text-success' : 'text-destructive')}>
                {equilibrado ? 'BALANÇO CONSOLIDADO' : 'ERRO DE EQUILÍBRIO PATRIMONIAL'}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <InfoIcon className="h-3 w-3 opacity-40" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Verificação de Integridade Contábil (Ativo = Passivo + PL)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-12">
            {!equilibrado && (
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive opacity-60">Diferença Residual</p>
                <p className="text-4xl font-mono font-black text-destructive tabular-nums mt-1 tracking-tighter">
                  {formatCurrency(balanco.totalAtivo - balanco.totalPassivo)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Liquidez', val: balanco.ativoCirculante, icon: <Zap className="h-3 w-3" />, color: 'text-primary' },
                { label: 'Equity', val: balanco.patrimonioLiquido, icon: <Scale className="h-3 w-3" />, color: 'text-secondary' },
              ].map((item, i) => (
                <div key={i} className="bg-card/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 min-w-[140px]">
                  <div className="flex items-center gap-2 opacity-40">
                    {item.icon}
                    <p className="text-[9px] font-black uppercase tracking-widest">{item.label}</p>
                  </div>
                  <p className={cn('text-sm font-mono font-black mt-2 tabular-nums', item.color)}>{formatCurrency(item.val)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
