import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/formatters';
import { ExportDemonstrativoPDF } from '@/components/demonstrativos/ExportDemonstrativoPDF';
import { ContasNaoClassificadasDialog } from '@/components/demonstrativos/ContasNaoClassificadasDialog';
import { useDemonstrativosContabeis, type FonteDemonstrativo } from '@/hooks/useDemonstrativosContabeis';

interface DREStatementProps {
  periodo: string;
  mes: number;
  ano: number;
  empresaId: string;
  fonte?: FonteDemonstrativo;
}

export const DREStatement = ({ periodo, mes, ano, empresaId, fonte = 'competencia' }: DREStatementProps) => {
  const { dre, origem, isLoading } = useDemonstrativosContabeis({ empresaId, ano, mes, fonte });
  const [naoClassOpen, setNaoClassOpen] = useState(false);
  const naoClassificadas = dre.naoClassificadas || [];
  const temNaoClass = naoClassificadas.length > 0;

  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Demonstração do Resultado do Exercício
            </CardTitle>
            <CardDescription>
              Período: {meses[mes]} de {ano}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              Regime: {origem === 'competencia' ? 'Competência' : 'Caixa'}
            </Badge>
            {temNaoClass && origem === 'competencia' && (
              <Badge variant="outline" className="text-xs border-warning/40 text-warning gap-1">
                <AlertTriangle className="h-3 w-3" />
                {naoClassificadas.length} não classificada{naoClassificadas.length !== 1 ? 's' : ''}
              </Badge>
            )}
            <Badge variant={dre.lucroLiquido >= 0 ? 'default' : 'destructive'} className="text-sm">
              {dre.lucroLiquido >= 0 ? 'Lucro' : 'Prejuízo'}: {formatCurrency(Math.abs(dre.lucroLiquido))}
            </Badge>
            {temNaoClass && origem === 'competencia' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNaoClassOpen(true)}
                className="gap-2 border-warning/40 text-warning hover:bg-warning/10"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Classificar contas
              </Button>
            )}
            <ExportDemonstrativoPDF
              tipo="dre"
              periodo={periodo}
              mes={mes}
              ano={ano}
              empresa="Promo Finance"
              linhas={dre.linhas}
              resumoDRE={{ lucroLiquido: dre.lucroLiquido }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {temNaoClass && origem === 'competencia' && (
          <Alert className="mb-4 border-warning/30 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-xs flex items-center justify-between gap-3 flex-wrap">
              <span>
                <strong>{naoClassificadas.length} conta{naoClassificadas.length !== 1 ? 's' : ''}</strong> com partidas no
                período não possuem <code>centro_resultado</code>. Os valores aparecem na linha "Não classificadas" da DRE
                até serem classificados.
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNaoClassOpen(true)}
                className="text-warning hover:bg-warning/10"
              >
                Revisar agora
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-semibold text-sm">Código</th>
                  <th className="text-left p-3 font-semibold text-sm">Descrição</th>
                  <th className="text-right p-3 font-semibold text-sm">Valor (R$)</th>
                  <th className="text-right p-3 font-semibold text-sm">AV (%)</th>
                </tr>
              </thead>
              <tbody>
                {dre.linhas.map((linha, index) => (
                  <motion.tr
                    key={linha.codigo}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`
                      border-t border-border/30 transition-colors hover:bg-muted/30
                      ${linha.nivel === 0 ? 'font-semibold bg-muted/20' : ''}
                      ${linha.codigo === '11' ? 'bg-primary/10 font-bold' : ''}
                      ${linha.codigo === '99' ? 'bg-warning/10 font-semibold border-l-2 border-l-warning' : ''}
                    `}
                  >
                    <td className="p-3 text-sm text-muted-foreground">{linha.codigo}</td>
                    <td className={`p-3 text-sm ${linha.nivel === 1 ? 'pl-8' : ''}`}>
                      {linha.descricao}
                    </td>
                    <td className={`p-3 text-sm text-right tabular-nums ${
                      linha.valor > 0 ? 'text-success' : linha.valor < 0 ? 'text-destructive' : ''
                    }`}>
                      {formatCurrency(Math.abs(linha.valor))}
                      {linha.valor > 0 && linha.tipo !== 'resultado' && (
                        <TrendingUp className="inline ml-1 h-3 w-3" />
                      )}
                      {linha.valor < 0 && (
                        <TrendingDown className="inline ml-1 h-3 w-3" />
                      )}
                    </td>
                    <td className="p-3 text-sm text-right tabular-nums text-muted-foreground">
                      {linha.percentual.toFixed(1)}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p>AV = Análise Vertical (% sobre Receita Bruta) — {origem === 'competencia' ? 'valores apurados a partir das partidas contábeis' : 'valores estimados a partir de contas pagas/recebidas no período'}.</p>
        </div>
      </CardContent>

      <ContasNaoClassificadasDialog
        open={naoClassOpen}
        onOpenChange={setNaoClassOpen}
        contas={naoClassificadas}
        isLoading={isLoading}
      />
    </Card>
  );
};
