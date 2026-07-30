import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, AlertTriangle, Lightbulb, Target, 
  Loader2, ChevronDown, ChevronUp, TrendingUp,
  Shield, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Insight {
  tipo: 'alerta' | 'oportunidade' | 'recomendacao';
  titulo: string;
  descricao: string;
  impacto: string;
  acao: string;
}

interface InsightsResponse {
  resumo: string;
  score: number;
  insights: Insight[];
  comparativo: string;
  projecao: string;
}

interface InsightsIAProps {
  dados: Record<string, unknown>;
  contexto: string;
}

const tipoConfig = {
  alerta: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', badge: 'destructive' as const },
  oportunidade: { icon: Lightbulb, color: 'text-warning', bg: 'bg-warning/10', badge: 'secondary' as const },
  recomendacao: { icon: Target, color: 'text-primary', bg: 'bg-primary/10', badge: 'default' as const },
};

const impactoColors: Record<string, string> = {
  alto: 'bg-destructive text-destructive-foreground',
  medio: 'bg-warning text-warning-foreground',
  baixo: 'bg-muted text-muted-foreground',
};

export function InsightsIA({ dados, contexto }: InsightsIAProps) {
  const [expanded, setExpanded] = useState(false);
  const [result, setResult] = useState<InsightsResponse | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('insights-relatorio', {
        body: { dados, contexto },
      });
      if (error) throw error;
      return data as InsightsResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      setExpanded(true);
    },
    onError: (err) => {
      toast.error('Erro ao gerar insights: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    },
  });

  const scoreColor = (score: number) => {
    if (score >= 70) return 'text-success';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const scoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bom';
    if (score >= 40) return 'Atenção';
    return 'Crítico';
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            Insights com IA
          </CardTitle>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {mutation.isPending ? 'Analisando...' : result ? 'Reanalisar' : 'Analisar com IA'}
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {result && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-4">
              {/* Score + Resumo */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-background/80 border">
                <div className="flex flex-col items-center gap-1 min-w-[80px]">
                  <div className={cn('text-3xl font-bold', scoreColor(result.score))}>
                    {result.score}
                  </div>
                  <Progress value={result.score} className="h-2 w-16" />
                  <span className={cn('text-xs font-medium', scoreColor(result.score))}>
                    {scoreLabel(result.score)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">{result.resumo}</p>
                  {result.projecao && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {result.projecao}
                    </p>
                  )}
                </div>
              </div>

              {/* Insights */}
              <div className="space-y-2">
                {result.insights.map((insight, i) => {
                  const config = tipoConfig[insight.tipo] || tipoConfig.recomendacao;
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn('p-3 rounded-lg border', config.bg)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', config.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{insight.titulo}</span>
                            <Badge className={cn('text-[10px] px-1.5 py-0', impactoColors[insight.impacto] || '')}>
                              {insight.impacto}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{insight.descricao}</p>
                          {insight.acao && (
                            <p className="text-xs font-medium text-primary mt-1 flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {insight.acao}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Comparativo */}
              {result.comparativo && (
                <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  📊 {result.comparativo}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>

      {result && (
        <div className="px-6 pb-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
            {expanded ? 'Recolher insights' : 'Expandir insights'}
          </Button>
        </div>
      )}
    </Card>
  );
}
