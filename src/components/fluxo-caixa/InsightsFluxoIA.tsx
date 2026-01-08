import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface ProjecaoFluxo {
  data: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface InsightsFluxoIAProps {
  projecoes: ProjecaoFluxo[];
  saldoAtual: number;
  cenarioAtivo: string;
  diasCobertura: number;
  probabilidadeRuptura?: number;
}

interface Insight {
  tipo: 'alerta' | 'oportunidade' | 'recomendacao';
  titulo: string;
  descricao: string;
  impacto?: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

interface AnaliseIA {
  resumo: string;
  insights: Insight[];
  acoes_sugeridas: string[];
  score_saude: number;
}

export function InsightsFluxoIA({ 
  projecoes, 
  saldoAtual,
  cenarioAtivo,
  diasCobertura,
  probabilidadeRuptura = 0,
}: InsightsFluxoIAProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analise, setAnalise] = useState<AnaliseIA | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAnalisar = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Preparar dados para análise
      const totalReceitas = projecoes.reduce((sum, p) => sum + p.receitas, 0);
      const totalDespesas = projecoes.reduce((sum, p) => sum + p.despesas, 0);
      const saldoFinal = projecoes[projecoes.length - 1]?.saldo || saldoAtual;
      const diasNegativos = projecoes.filter(p => p.saldo < 0).length;

      const dadosAnalise = {
        saldo_atual: saldoAtual,
        saldo_final: saldoFinal,
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        dias_projecao: projecoes.length,
        dias_cobertura: diasCobertura,
        dias_negativos: diasNegativos,
        probabilidade_ruptura: probabilidadeRuptura,
        cenario: cenarioAtivo,
        variacao_saldo: saldoFinal - saldoAtual,
        margem_operacional: totalReceitas > 0 ? ((totalReceitas - totalDespesas) / totalReceitas) * 100 : 0,
      };

      const { data, error: fnError } = await supabase.functions.invoke('analise-fluxo-ia', {
        body: dadosAnalise,
      });

      if (fnError) throw fnError;

      setAnalise(data);
    } catch (err: unknown) {
      logger.error('Erro ao analisar fluxo:', err);
      setError('Não foi possível gerar a análise. Tente novamente.');
      toast.error('Erro ao gerar análise de IA');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getIconeTipo = (tipo: Insight['tipo']) => {
    switch (tipo) {
      case 'alerta': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'oportunidade': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'recomendacao': return <Lightbulb className="h-4 w-4 text-primary" />;
    }
  };

  const getCorPrioridade = (prioridade: Insight['prioridade']) => {
    switch (prioridade) {
      case 'alta': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'media': return 'bg-warning/10 text-warning border-warning/20';
      case 'baixa': return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="card-elevated overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Insights IA do Fluxo
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalisar}
                disabled={isAnalyzing || projecoes.length === 0}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : analise ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Re-analisar
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Gerar Análise
                  </>
                )}
              </Button>
              {analise && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Estado inicial */}
          {!analise && !isAnalyzing && !error && (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Clique em "Gerar Análise" para obter insights personalizados do seu fluxo de caixa.</p>
            </div>
          )}

          {/* Carregando */}
          {isAnalyzing && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analisando padrões e gerando recomendações...</p>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="text-center py-6 text-destructive">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Resultado da análise */}
          <AnimatePresence>
            {analise && isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                {/* Score e Resumo */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                  <div className="text-center">
                    <div className={cn(
                      "text-3xl font-bold font-display",
                      getScoreColor(analise.score_saude)
                    )}>
                      {analise.score_saude}
                    </div>
                    <p className="text-xs text-muted-foreground">Score Saúde</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{analise.resumo}</p>
                  </div>
                </div>

                {/* Insights */}
                {analise.insights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Insights Detectados
                    </h4>
                    <div className="space-y-2">
                      {analise.insights.map((insight, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={cn(
                            "p-3 rounded-lg border",
                            getCorPrioridade(insight.prioridade)
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {getIconeTipo(insight.tipo)}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{insight.titulo}</span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {insight.prioridade}
                                </Badge>
                              </div>
                              <p className="text-xs mt-1 opacity-80">{insight.descricao}</p>
                              {insight.impacto && (
                                <p className="text-xs mt-1 font-medium">
                                  Impacto: {insight.impacto}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ações Sugeridas */}
                {analise.acoes_sugeridas.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Ações Recomendadas
                    </h4>
                    <ul className="space-y-1.5">
                      {analise.acoes_sugeridas.map((acao, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-primary mt-0.5">→</span>
                          <span>{acao}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
