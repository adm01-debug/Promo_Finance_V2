import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  Clock,
  RefreshCw,
  Loader2,
  ChevronRight,
  Zap,
  Target,
  Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';


import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';
import { useAlertasPreditivos } from '@/hooks/useAlertasPreditivos';

interface AlertasPreditivosPanelProps {
  saldoAtual: number;
  receitasPrevistas: Array<{ valor: number; dataVencimento: Date; entidade: string }>;
  despesasPrevistas: Array<{ valor: number; dataVencimento: Date; entidade: string }>;
  historicoInadimplencia?: Array<{ clienteId: string; diasAtraso: number }>;
  defaultExpanded?: boolean;
}

const ALERTA_ICONS = {
  ruptura: AlertTriangle,
  inadimplencia_provavel: ShieldAlert,
  oportunidade_antecipacao: Lightbulb,
  concentracao_risco: Target,
};

const ALERTA_COLORS = {
  alta: 'border-destructive/50 bg-destructive/5',
  media: 'border-warning/50 bg-warning/5',
  baixa: 'border-accent/50 bg-accent/5',
};

export function AlertasPreditivosPanel({
  saldoAtual,
  receitasPrevistas,
  despesasPrevistas,
  historicoInadimplencia = [],
  defaultExpanded = false,
}: AlertasPreditivosPanelProps) {
  const { isAnalyzing, alertas, lastAnalysis, analisarFluxoCaixa } = useAlertasPreditivos();

  // Referencia com os dados mais recentes para a auto-analise one-shot:
  // os arrays de props podem ser recriados a cada render do pai (deps instaveis),
  // entao o efeito le via ref para nao disparar analises repetidas.
  const dadosAnaliseRef = useRef({ receitasPrevistas, despesasPrevistas, historicoInadimplencia });
  dadosAnaliseRef.current = { receitasPrevistas, despesasPrevistas, historicoInadimplencia };

  // Auto-analisar na montagem e quando dados mudam significativamente
  useEffect(() => {
    if (!lastAnalysis && saldoAtual > 0) {
      analisarFluxoCaixa({
        saldoAtual,
        ...dadosAnaliseRef.current,
      });
    }
  }, [saldoAtual, lastAnalysis, analisarFluxoCaixa]);

  const handleReanalisar = () => {
    analisarFluxoCaixa({
      saldoAtual,
      receitasPrevistas,
      despesasPrevistas,
      historicoInadimplencia,
    });
  };

  const alertasOrdenados = useMemo(() => {
    return [...alertas].sort((a, b) => {
      const prioridadeOrder = { alta: 0, media: 1, baixa: 2 };
      return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
    });
  }, [alertas]);

  const resumo = useMemo(() => ({
    total: alertas.length,
    alta: alertas.filter(a => a.prioridade === 'alta').length,
    media: alertas.filter(a => a.prioridade === 'media').length,
    baixa: alertas.filter(a => a.prioridade === 'baixa').length,
    impactoTotal: alertas.reduce((acc, a) => acc + a.impactoEstimado, 0),
  }), [alertas]);

  return (
    <Card className="border-none bg-background/20 backdrop-blur-3xl shadow-xl ring-1 ring-white/10 rounded-[2.5rem] overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-warning to-destructive flex items-center justify-center shadow-lg shadow-destructive/20">
                <Brain className="h-4 w-4 text-white" />
              </div>
              Matriz de Riscos Preditivos
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Previsões baseadas em padrões neurais</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReanalisar}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Resumo */}
        {resumo.total > 0 && (
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {resumo.alta}
              </Badge>
              <Badge variant="outline" className="gap-1 border-warning text-warning">
                {resumo.media}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                {resumo.baixa}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Impacto: <span className="font-medium text-foreground">{formatCurrency(resumo.impactoTotal)}</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-warning to-destructive animate-pulse" />
              <Brain className="h-6 w-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-muted-foreground">Analisando padrões...</p>
          </div>
        ) : alertasOrdenados.length === 0 ? (
          <div className="text-center py-8">
            <Zap className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="font-medium">Tudo em ordem!</p>
            <p className="text-sm text-muted-foreground">
              Nenhum alerta preditivo no momento
            </p>
          </div>
        ) : (
          <ScrollArea className={cn("pr-2", defaultExpanded ? "h-[500px]" : "h-[300px]")}>
            <div className="space-y-3">
              <AnimatePresence>
                {alertasOrdenados.map((alerta, index) => {
                  const Icon = ALERTA_ICONS[alerta.tipo];
                  
                  return (
                    <motion.div
                      key={alerta.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className={cn(
                        "p-4 rounded-lg border transition-all hover:shadow-md",
                        ALERTA_COLORS[alerta.prioridade]
                      )}>
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                            alerta.prioridade === 'alta' && "bg-destructive/20 text-destructive",
                            alerta.prioridade === 'media' && "bg-warning/20 text-warning",
                            alerta.prioridade === 'baixa' && "bg-accent/20 text-accent-foreground",
                          )}>
                            <Icon className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-medium text-sm">{alerta.titulo}</h4>
                              <Badge 
                                variant={alerta.prioridade === 'alta' ? 'destructive' : 'outline'}
                                className="text-xs"
                              >
                                {alerta.probabilidade}% prob.
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1">
                              {alerta.descricao}
                            </p>
                            
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {alerta.dataPrevisao.toLocaleDateString('pt-BR')}
                              </span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(alerta.impactoEstimado)}
                              </span>
                            </div>

                            {/* Sugestões */}
                            <div className="mt-3 space-y-1">
                              {alerta.sugestoes.slice(0, 2).map((sugestao, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                  <ChevronRight className="h-3 w-3" />
                                  {sugestao}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}

        {lastAnalysis && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Última análise: {lastAnalysis.toLocaleTimeString('pt-BR')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
