import { motion } from 'framer-motion';
import { Scale, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/formatters';
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`
        border-t border-border/30 transition-colors hover:bg-muted/30
        ${conta.nivel === 0 ? 'font-bold bg-muted/30' : ''}
        ${conta.nivel === 1 ? 'font-semibold bg-muted/10' : ''}
      `}
    >
      <td className="p-3 text-sm text-muted-foreground">{conta.codigo}</td>
      <td className={`p-3 text-sm ${conta.nivel === 2 ? 'pl-10' : conta.nivel === 1 ? 'pl-6' : ''}`}>
        {conta.descricao}
      </td>
      <td className="p-3 text-sm text-right tabular-nums">
        {formatCurrency(conta.valor)}
      </td>
      <td className="p-3 text-sm text-right tabular-nums text-muted-foreground">
        {total > 0 ? ((conta.valor / total) * 100).toFixed(1) : 0}%
      </td>
    </motion.tr>
  );

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-6">
      <BalancoDesequilibrioIndicator
        empresaId={empresaId}
        mes={mes}
        ano={ano}
        totalAtivo={balanco.totalAtivo}
        totalPassivo={balanco.totalPassivo}
        equilibrado={balanco.equilibrado}
      />
      <div className="flex justify-end">
        <ExportDemonstrativoPDF
          tipo="balanco"
          periodo={periodo}
          mes={mes}
          ano={ano}
          empresa="Promo Finance"
          linhas={linhasPDF}
          resumoBalanco={{
            totalAtivo: balanco.totalAtivo,
            totalPassivo: balanco.totalPassivo,
            equilibrado: balanco.equilibrado,
          }}
        />
      </div>
      {origem === 'caixa' && (
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertDescription className="text-xs">
            <strong>Balanço estimado a partir de movimentações de caixa</strong> — não substitui escrituração contábil. Use o regime de Competência para um balanço fiel.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Ativo Total</div>
            <div className="text-2xl font-bold">{formatCurrency(balanco.totalAtivo)}</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Circulante</span>
                <span>{balanco.totalAtivo > 0 ? ((balanco.ativoCirculante / balanco.totalAtivo) * 100).toFixed(0) : 0}%</span>
              </div>
              <Progress value={balanco.totalAtivo > 0 ? (balanco.ativoCirculante / balanco.totalAtivo) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-border/50 flex items-center justify-center ${balanco.equilibrado ? '' : 'border-destructive/50 bg-destructive/5'}`}>
          <CardContent className="pt-6 text-center w-full">
            {balanco.equilibrado ? (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span className="font-semibold text-success">Equilibrado</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>Ativo</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>Passivo + PL</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                  <span className="font-semibold text-destructive">Desequilibrado</span>
                </div>
                <div className="text-xs text-muted-foreground">Diferença</div>
                <div className="font-mono text-lg font-bold tabular-nums text-destructive">
                  {balanco.totalAtivo - balanco.totalPassivo >= 0 ? '+' : ''}
                  {formatCurrency(balanco.totalAtivo - balanco.totalPassivo)}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {origem === 'competencia' ? 'Há partidas desbalanceadas — revisar lançamentos' : 'Valores estimados — não substitui escrituração'}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">Passivo + PL</div>
            <div className="text-2xl font-bold">{formatCurrency(balanco.totalPassivo)}</div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Patrimônio Líquido</span>
                <span>{balanco.totalPassivo > 0 ? ((balanco.patrimonioLiquido / balanco.totalPassivo) * 100).toFixed(0) : 0}%</span>
              </div>
              <Progress value={balanco.totalPassivo > 0 ? (balanco.patrimonioLiquido / balanco.totalPassivo) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-primary" />
              Ativo
              <Badge variant="outline" className="ml-auto text-xs">
                {origem === 'competencia' ? 'Competência' : 'Caixa'}
              </Badge>
            </CardTitle>
            <CardDescription>Posição em {meses[mes]} de {ano}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold text-xs">Cód.</th>
                    <th className="text-left p-3 font-semibold text-xs">Descrição</th>
                    <th className="text-right p-3 font-semibold text-xs">Valor</th>
                    <th className="text-right p-3 font-semibold text-xs">%</th>
                  </tr>
                </thead>
                <tbody>
                  {balanco.ativo.map((conta, index) => renderConta(conta, index, balanco.totalAtivo))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Scale className="h-5 w-5 text-destructive" />
              Passivo e Patrimônio Líquido
            </CardTitle>
            <CardDescription>Posição em {meses[mes]} de {ano}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold text-xs">Cód.</th>
                    <th className="text-left p-3 font-semibold text-xs">Descrição</th>
                    <th className="text-right p-3 font-semibold text-xs">Valor</th>
                    <th className="text-right p-3 font-semibold text-xs">%</th>
                  </tr>
                </thead>
                <tbody>
                  {balanco.passivo.map((conta, index) => renderConta(conta, index, balanco.totalPassivo))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
