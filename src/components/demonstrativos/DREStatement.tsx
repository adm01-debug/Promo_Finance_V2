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
    <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10 relative">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
      
      <CardHeader className="p-10 pb-6 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] text-primary-foreground">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <CardTitle className="text-4xl font-black tracking-tight">
                  Demonstração do Resultado
                </CardTitle>
                <CardDescription className="text-lg font-medium opacity-70">
                  Performance Financeira Analítica • {meses[mes]} {ano}
                </CardDescription>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap bg-white/5 p-2.5 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-3 px-6 py-2 rounded-[1.5rem] bg-white/5 border border-white/10">
              <span className="text-xs font-bold uppercase tracking-widest opacity-50">Regime</span>
              <Badge variant="outline" className="text-[10px] font-black py-0.5 px-2 rounded-md border-primary/40 bg-primary/10 text-primary uppercase">
                {origem === 'competencia' ? 'Competência' : 'Caixa'}
              </Badge>
            </div>

            <div className={cn(
              "flex flex-col px-8 py-2 rounded-[1.5rem] border transition-all duration-500 shadow-lg",
              dre.lucroLiquido >= 0 
                ? "bg-success/10 border-success/20 text-success shadow-success/5" 
                : "bg-destructive/10 border-destructive/20 text-destructive shadow-destructive/5"
            )}>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">
                {dre.lucroLiquido >= 0 ? 'Resultado Líquido (Lucro)' : 'Resultado Líquido (Prejuízo)'}
              </span>
              <span className="text-2xl font-black tabular-nums tracking-tighter">
                {formatCurrency(Math.abs(dre.lucroLiquido))}
              </span>
            </div>
            
            <div className="flex items-center gap-2 pl-2">
              {temNaoClass && origem === 'competencia' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNaoClassOpen(true)}
                  className="h-12 w-12 text-warning hover:bg-warning/10 rounded-2xl transition-transform hover:scale-105"
                >
                  <Settings2 className="h-6 w-6" />
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

      <CardContent className="p-10 pt-2 relative z-10">
        {temNaoClass && origem === 'competencia' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 overflow-hidden rounded-[2rem] border border-warning/20 bg-warning/5 p-6 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/20 text-warning">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-warning">Contas Pendentes</h4>
                  <p className="text-sm text-muted-foreground">
                    Existem <strong className="text-warning">{naoClassificadas.length} contas</strong> aguardando classificação para maior precisão.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNaoClassOpen(true)}
                className="bg-warning/10 border-warning/20 text-warning hover:bg-warning/20 rounded-xl px-6 h-10 font-bold"
              >
                Revisar Classificações
              </Button>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl bg-white/5" />
            <Skeleton className="h-96 w-full rounded-2xl bg-white/5" />
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-black/20 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/5">
                    <th className="text-left p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Ref.</th>
                    <th className="text-left p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Descrição Detalhada</th>
                    <th className="text-right p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Valor Realizado</th>
                    <th className="text-right p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Análise (AV)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {dre.linhas.map((linha, index) => (
                    <motion.tr
                      key={linha.codigo}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.01,
                        duration: 0.5,
                        ease: [0.23, 1, 0.32, 1]
                      }}
                      className={cn(
                        "group transition-all duration-300 hover:bg-white/[0.03]",
                        linha.nivel === 0 ? "bg-white/[0.02] font-black" : "font-medium",
                        linha.codigo === '11' ? "bg-primary/5 border-l-4 border-l-primary" : "",
                        linha.codigo === '99' ? "bg-warning/5 border-l-4 border-l-warning" : ""
                      )}
                    >
                      <td className="p-6 text-[11px] font-mono text-muted-foreground/40 group-hover:text-primary transition-colors">
                        {linha.codigo}
                      </td>
                      <td className={cn(
                        "p-6 text-sm tracking-tight transition-all",
                        linha.nivel === 1 ? "pl-14 opacity-80" : "text-base",
                        linha.nivel === 0 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {linha.descricao}
                      </td>
                      <td className={cn(
                        "p-6 text-right tabular-nums font-bold text-base",
                        linha.valor > 0 ? "text-success" : linha.valor < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        <div className="flex items-center justify-end gap-3">
                          {formatCurrency(Math.abs(linha.valor))}
                          {linha.valor !== 0 && (
                            <div className={cn(
                              "p-1 rounded-md bg-current/10 transition-transform group-hover:scale-110",
                              linha.valor > 0 ? "text-success" : "text-destructive"
                            )}>
                              {linha.valor > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(linha.percentual, 100)}%` }}
                              transition={{ duration: 1, delay: 0.5 + index * 0.01 }}
                              className={cn(
                                "h-full rounded-full",
                                linha.valor >= 0 ? "bg-primary" : "bg-destructive"
                              )}
                            />
                          </div>
                          <span className="text-xs font-black tabular-nums text-muted-foreground/60 w-10">
                            {linha.percentual.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="p-2 rounded-lg bg-white/5">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Nota Metodológica:</strong> AV (Análise Vertical) representa o peso relativo de cada linha sobre a Receita Bruta. 
            {origem === 'competencia' ? ' Dados baseados em lançamentos contábeis oficiais.' : ' Valores estimados via fluxo de caixa operacional.'}
          </p>
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
