import { motion } from 'framer-motion';
import { Scale, ArrowRight, AlertTriangle, CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useDemonstrativosContabeis, type FonteDemonstrativo, type BalancoLinha } from '@/hooks/useDemonstrativosContabeis';
import { ExportDemonstrativoPDF } from '@/components/demonstrativos/ExportDemonstrativoPDF';
import { BalancoDesequilibrioIndicator } from '@/components/demonstrativos/BalancoDesequilibrioIndicator';

interface BalancoPatrimonialProps {
  periodo: string;
  mes: number;
  ano: number;
  empresaId: string;
  fonte?: FonteDemonstrativo;
}

export const BalancoPatrimonial = ({ periodo, mes, ano, empresaId, fonte = 'competencia' }: BalancoPatrimonialProps) => {
  const { balanco, origem, isLoading } = useDemonstrativosContabeis({ empresaId, ano, mes, fonte });

  const linhasPDF = [
    ...balanco.ativo.map((c) => ({
      codigo: c.codigo,
      descricao: c.descricao,
      valor: c.valor,
      percentual: balanco.totalAtivo > 0 ? (c.valor / balanco.totalAtivo) * 100 : 0,
      nivel: c.nivel,
      tipo: 'ativo',
    })),
    ...balanco.passivo.map((c) => ({
      codigo: c.codigo,
      descricao: c.descricao,
      valor: c.valor,
      percentual: balanco.totalPassivo > 0 ? (c.valor / balanco.totalPassivo) * 100 : 0,
      nivel: c.nivel,
      tipo: 'passivo',
    })),
  ];

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const renderConta = (conta: BalancoLinha, index: number, total: number) => (
    <motion.tr
      key={conta.codigo}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.01,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1]
      }}
      className={cn(
        "group transition-all duration-300 hover:bg-white/[0.03]",
        conta.nivel === 0 ? "bg-white/[0.02] font-black" : "font-medium",
        conta.nivel === 1 ? "bg-white/[0.01]" : ""
      )}
    >
      <td className="p-6 text-[11px] font-mono text-muted-foreground/40 group-hover:text-primary transition-colors">
        {conta.codigo}
      </td>
      <td className={cn(
        "p-6 text-sm tracking-tight transition-all",
        conta.nivel === 2 ? "pl-14 opacity-80" : conta.nivel === 1 ? "pl-10" : "text-base",
        conta.nivel === 0 ? "text-foreground" : "text-muted-foreground"
      )}>
        {conta.descricao}
      </td>
      <td className="p-6 text-right tabular-nums font-bold text-base">
        {formatCurrency(conta.valor)}
      </td>
      <td className="p-6 text-right">
        <div className="flex items-center justify-end gap-3">
          <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? Math.min((conta.valor / total) * 100, 100) : 0}%` }}
              transition={{ duration: 1, delay: 0.5 + index * 0.01 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
          <span className="text-xs font-black tabular-nums text-muted-foreground/60 w-10">
            {total > 0 ? ((conta.valor / total) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </td>
    </motion.tr>
  );

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-10">
      <BalancoDesequilibrioIndicator
        empresaId={empresaId}
        mes={mes}
        ano={ano}
        totalAtivo={balanco.totalAtivo}
        totalPassivo={balanco.totalPassivo}
        equilibrado={balanco.equilibrado}
      />
      
      {origem === 'caixa' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-[2rem] border border-warning/20 bg-warning/5 p-6 backdrop-blur-md"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-warning/20 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-warning">Balanço Estimado (Modo Caixa)</h4>
              <p className="text-sm text-muted-foreground">
                Valores apurados via movimentações de caixa. Para conformidade legal e contábil, utilize o regime de <strong className="text-foreground">Competência</strong>.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-none bg-white/[0.02] backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden ring-1 ring-white/10 h-full group hover:ring-primary/40 transition-all duration-700">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 rounded-2xl bg-primary shadow-lg shadow-primary/20 text-primary-foreground">
                  <Wallet className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Asset Management</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Ativo Total</span>
                <div className="text-4xl font-black tracking-tight group-hover:text-primary transition-colors">{formatCurrency(balanco.totalAtivo)}</div>
              </div>
              <div className="mt-10 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                  <span>Liquidez Corrente</span>
                  <span className="text-primary">{balanco.totalAtivo > 0 ? ((balanco.ativoCirculante / balanco.totalAtivo) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${balanco.totalAtivo > 0 ? (balanco.ativoCirculante / balanco.totalAtivo) * 100 : 0}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={cn(
            "border-none backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden ring-1 h-full flex items-center justify-center transition-all duration-1000",
            balanco.equilibrado 
              ? "bg-success/5 ring-success/20 shadow-success/5 hover:ring-success/40" 
              : "bg-destructive/5 ring-destructive/20 shadow-destructive/5 hover:ring-destructive/40"
          )}>
            <CardContent className="p-10 text-center w-full relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
              <div className="relative z-10">
                {balanco.equilibrado ? (
                  <>
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="p-5 rounded-full bg-success/20 text-success shadow-[0_0_30px_rgba(var(--success),0.2)] animate-pulse">
                        <ShieldCheck className="h-10 w-10" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-success tracking-tight mb-2 uppercase italic">Equilíbrio Pleno</h3>
                    <p className="text-xs font-medium text-muted-foreground/70 px-4 leading-relaxed">
                      Conformidade técnica absoluta detectada entre Ativo e Passivo.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="p-5 rounded-full bg-destructive/20 text-destructive shadow-[0_0_30px_rgba(var(--destructive),0.2)] animate-bounce-subtle">
                        <AlertTriangle className="h-10 w-10" />
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-destructive tracking-tight mb-1 uppercase">Diferença de Balanço</h3>
                    <div className="text-4xl font-black font-mono tracking-tighter text-destructive mt-3 tabular-nums drop-shadow-sm">
                      {balanco.totalAtivo - balanco.totalPassivo >= 0 ? '+' : ''}
                      {formatCurrency(balanco.totalAtivo - balanco.totalPassivo)}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/60 mt-6 px-6 leading-tight uppercase tracking-widest">
                      {origem === 'competencia' ? 'Inconsistência nas Partidas Dobradas' : 'Variação Sujeita a Estimativa'}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-none bg-white/[0.02] backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden ring-1 ring-white/10 h-full group hover:ring-purple-500/40 transition-all duration-700">
            <CardContent className="p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="p-3 rounded-2xl bg-purple-600 shadow-lg shadow-purple-500/20 text-white">
                  <Scale className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Capital & Equity</span>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Passivo + PL</span>
                <div className="text-4xl font-black tracking-tight group-hover:text-purple-400 transition-colors">{formatCurrency(balanco.totalPassivo)}</div>
              </div>
              <div className="mt-10 space-y-4">
                <div className="flex justify-between text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                  <span>Solvência (Equity)</span>
                  <span className="text-purple-400">{balanco.totalPassivo > 0 ? ((balanco.patrimonioLiquido / balanco.totalPassivo) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${balanco.totalPassivo > 0 ? (balanco.patrimonioLiquido / balanco.totalPassivo) * 100 : 0}%` }}
                    transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-none bg-white/[0.02] backdrop-blur-3xl shadow-[0_48px_96px_rgba(0,0,0,0.4)] rounded-[3rem] overflow-hidden ring-1 ring-white/10 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="p-10 pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Scale className="h-6 w-6" />
                    </div>
                    Ativo
                  </CardTitle>
                  <CardDescription className="text-sm font-medium opacity-60">Bens e direitos sob custódia</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-xl py-1.5 px-4 bg-primary/10 border-primary/20 text-primary font-black text-[10px] tracking-widest uppercase">
                  {origem === 'competencia' ? 'Auditado' : 'Estimado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-4 relative z-10">
              <div className="rounded-[2.5rem] border border-white/10 overflow-hidden bg-black/40 shadow-inner backdrop-blur-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="text-left p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Cód.</th>
                        <th className="text-left p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Descrição</th>
                        <th className="text-right p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Valor</th>
                        <th className="text-right p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {balanco.ativo.map((conta, index) => renderConta(conta, index, balanco.totalAtivo))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-none bg-white/[0.02] backdrop-blur-3xl shadow-[0_48px_96px_rgba(0,0,0,0.4)] rounded-[3rem] overflow-hidden ring-1 ring-white/10 relative">
            <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 via-transparent to-transparent pointer-events-none" />
            <CardHeader className="p-10 pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black tracking-tight flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-purple-600/10 text-purple-400">
                      <Scale className="h-6 w-6" />
                    </div>
                    Passivo + PL
                  </CardTitle>
                  <CardDescription className="text-sm font-medium opacity-60">Origens de capital e obrigações</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-4 relative z-10">
              <div className="rounded-[2.5rem] border border-white/10 overflow-hidden bg-black/40 shadow-inner backdrop-blur-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/5">
                        <th className="text-left p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Cód.</th>
                        <th className="text-left p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Descrição</th>
                        <th className="text-right p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Valor</th>
                        <th className="text-right p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {balanco.passivo.map((conta, index) => renderConta(conta, index, balanco.totalPassivo))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
