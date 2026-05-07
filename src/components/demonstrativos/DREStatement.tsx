import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
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
    <Card className="border-none bg-background/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden ring-1 ring-white/10">
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              Demonstração do Resultado
            </CardTitle>
            <CardDescription className="text-lg mt-1">
              Análise de performance para {meses[mes]} de {ano}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 flex-wrap bg-muted/30 p-2 rounded-2xl border border-border/50">
            <Badge variant="outline" className="text-xs font-semibold py-1 px-3 rounded-lg border-primary/20 bg-primary/5 text-primary">
              Regime: {origem === 'competencia' ? 'Competência' : 'Caixa'}
            </Badge>
            {temNaoClass && origem === 'competencia' && (
              <Badge variant="outline" className="text-xs border-warning/40 text-warning gap-1.5 py-1 px-3 rounded-lg bg-warning/5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {naoClassificadas.length} pendentes
              </Badge>
            )}
            <div className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-sm shadow-sm",
              dre.lucroLiquido >= 0 ? "bg-success/10 text-success border border-success/20" : "bg-destructive/10 text-destructive border border-destructive/20"
            )}>
              <span className="opacity-70 font-medium">{dre.lucroLiquido >= 0 ? 'Lucro Líquido' : 'Prejuízo'}:</span>
              {formatCurrency(Math.abs(dre.lucroLiquido))}
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              {temNaoClass && origem === 'competencia' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNaoClassOpen(true)}
                  className="h-9 gap-2 text-warning hover:bg-warning/10 rounded-lg px-4"
                >
                  <Settings2 className="h-4 w-4" />
                  Classificar
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
                fonte={origem}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 pt-0">
        {temNaoClass && origem === 'competencia' && (
          <Alert className="mb-6 border-warning/20 bg-warning/5 rounded-2xl p-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDescription className="text-sm flex items-center justify-between gap-4 flex-wrap ml-2">
              <span className="text-muted-foreground">
                <strong className="text-warning">{naoClassificadas.length} contas</strong> pendentes de classificação no período.
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNaoClassOpen(true)}
                className="bg-warning/10 border-warning/20 text-warning hover:bg-warning/20 rounded-xl"
              >
                Revisar agora
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-3xl" />
        ) : (
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-muted/10">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Código</th>
                  <th className="text-left p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Descrição</th>
                  <th className="text-right p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">Valor</th>
                  <th className="text-right p-4 font-bold text-xs uppercase tracking-wider text-muted-foreground">AV</th>
                </tr>
              </thead>
              <tbody>
                {dre.linhas.map((linha, index) => (
                  <motion.tr
                    key={linha.codigo}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.02,
                      duration: 0.4,
                      ease: [0.25, 0.1, 0.25, 1]
                    }}
                    className={`
                      border-t border-border/40 transition-all duration-300 hover:bg-primary/5
                      ${linha.nivel === 0 ? 'font-bold bg-muted/20' : ''}
                      ${linha.codigo === '11' ? 'bg-primary/5 font-extrabold' : ''}
                      ${linha.codigo === '99' ? 'bg-warning/5 font-semibold border-l-4 border-l-warning' : ''}
                    `}
                  >
                    <td className="p-4 text-xs font-mono text-muted-foreground opacity-60">{linha.codigo}</td>
                    <td className={`p-4 text-sm ${linha.nivel === 1 ? 'pl-10' : ''}`}>
                      {linha.descricao}
                    </td>
                    <td className={`p-4 text-sm text-right tabular-nums font-medium ${
                      linha.valor > 0 ? 'text-success' : linha.valor < 0 ? 'text-destructive' : ''
                    }`}>
                      <span className="flex items-center justify-end gap-1.5">
                        {formatCurrency(Math.abs(linha.valor))}
                        {linha.valor > 0 && linha.tipo !== 'resultado' && (
                          <TrendingUp className="h-3.5 w-3.5 opacity-50" />
                        )}
                        {linha.valor < 0 && (
                          <TrendingDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-right tabular-nums font-semibold text-muted-foreground">
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
