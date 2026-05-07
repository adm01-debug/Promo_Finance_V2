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
        <Alert className="border-warning/20 bg-warning/5 rounded-2xl p-4">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertDescription className="text-sm ml-2">
            <strong className="text-warning">Balanço Estimado</strong> — Valores apurados via movimentações de caixa. Para conformidade legal, utilize o regime de Competência.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-none bg-background/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden ring-1 ring-white/10 h-full">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 text-muted-foreground mb-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider">Ativo Total</span>
              </div>
              <div className="text-4xl font-extrabold tracking-tight">{formatCurrency(balanco.totalAtivo)}</div>
              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Liquidez Corrente</span>
                  <span className="text-primary">{balanco.totalAtivo > 0 ? ((balanco.ativoCirculante / balanco.totalAtivo) * 100).toFixed(0) : 0}%</span>
                </div>
                <Progress value={balanco.totalAtivo > 0 ? (balanco.ativoCirculante / balanco.totalAtivo) * 100 : 0} className="h-2.5 bg-primary/10" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className={cn(
            "border-none backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden ring-1 h-full flex items-center justify-center transition-all duration-500",
            balanco.equilibrado ? "bg-success/5 ring-success/20" : "bg-destructive/5 ring-destructive/20"
          )}>
            <CardContent className="p-8 text-center w-full">
              {balanco.equilibrado ? (
                <>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-success/20 text-success">
                      <ShieldCheck className="h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-success mb-2">Equilíbrio Perfeito</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    Ativo e Passivo estão em total conformidade técnica.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="p-3 rounded-full bg-destructive/20 text-destructive animate-pulse">
                      <AlertTriangle className="h-8 w-8" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-destructive mb-1">Desequilíbrio</h3>
                  <div className="text-3xl font-mono font-extrabold tracking-tighter text-destructive mt-2">
                    {balanco.totalAtivo - balanco.totalPassivo >= 0 ? '+' : ''}
                    {formatCurrency(balanco.totalAtivo - balanco.totalPassivo)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 px-6">
                    {origem === 'competencia' ? 'Há inconsistências nas partidas dobradas.' : 'Estimativa sujeita a variações.'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-none bg-background/40 backdrop-blur-xl shadow-xl rounded-3xl overflow-hidden ring-1 ring-white/10 h-full">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 text-muted-foreground mb-4">
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                  <Scale className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-wider">Passivo + PL</span>
              </div>
              <div className="text-4xl font-extrabold tracking-tight">{formatCurrency(balanco.totalPassivo)}</div>
              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <span>Solvência (PL)</span>
                  <span className="text-destructive">{balanco.totalPassivo > 0 ? ((balanco.patrimonioLiquido / balanco.totalPassivo) * 100).toFixed(0) : 0}%</span>
                </div>
                <Progress value={balanco.totalPassivo > 0 ? (balanco.patrimonioLiquido / balanco.totalPassivo) * 100 : 0} className="h-2.5 bg-destructive/10" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Scale className="h-5 w-5" />
                    </div>
                    Ativo
                  </CardTitle>
                  <CardDescription>Bens e direitos da organização</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-lg py-1 px-3 bg-primary/5 border-primary/20 text-primary font-bold">
                  {origem === 'competencia' ? 'CONTÁBIL' : 'ESTIMADO'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="rounded-2xl border border-border/50 overflow-hidden bg-muted/10">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Cód.</th>
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Descrição</th>
                      <th className="text-right p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Valor</th>
                      <th className="text-right p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanco.ativo.map((conta, index) => renderConta(conta, index, balanco.totalAtivo))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-destructive/10 text-destructive">
                      <Scale className="h-5 w-5" />
                    </div>
                    Passivo + PL
                  </CardTitle>
                  <CardDescription>Obrigações e capital próprio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <div className="rounded-2xl border border-border/50 overflow-hidden bg-muted/10">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Cód.</th>
                      <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Descrição</th>
                      <th className="text-right p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Valor</th>
                      <th className="text-right p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balanco.passivo.map((conta, index) => renderConta(conta, index, balanco.totalPassivo))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
