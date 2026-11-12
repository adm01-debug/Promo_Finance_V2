import { HelpCircle, Brain, RefreshCw, Loader2, CheckCheck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/formatters';
import { CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import type { HeaderProps } from './SugestoesMatchSections.types';

export function SugestoesHeaderIA({
  matchesAltaConfiancaCount,
  mutationPending,
  aprovarEmLotePending,
  onAprovarTodos,
  onHistorico,
  onReanalisar,
  isAnalyzing,
  estatisticas,
  matchesConfirmadosSize,
  lastAnalysis,
}: HeaderProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          Conciliação Inteligente (IA)
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-sm">
                A IA analisa padrões de valor, descrição, data e tipo para sugerir correspondências
                com alta precisão.
              </p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>

        <div className="flex items-center gap-2">
          {matchesAltaConfiancaCount > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={onAprovarTodos}
              disabled={mutationPending}
              className="gap-2 bg-success hover:bg-success/90"
            >
              {aprovarEmLotePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Aprovar todos ({matchesAltaConfiancaCount})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onHistorico} className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReanalisar}
            disabled={isAnalyzing}
            className="gap-2"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isAnalyzing ? 'Analisando...' : 'Reanalisar'}
          </Button>
          <Badge
            variant={estatisticas.confiancaAlta > 0 ? 'default' : 'secondary'}
            className="gap-1"
          >
            <Zap className="h-3 w-3" />
            {estatisticas.comSugestao} sugestões
          </Badge>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-5 gap-3 mt-4">
        <div className="text-center p-2 rounded-lg bg-success/10 border border-success/20">
          <p className="text-lg font-bold text-success">{estatisticas.confiancaAlta}</p>
          <p className="text-xs text-muted-foreground">Alta (≥80%)</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-lg font-bold text-warning">{estatisticas.confiancaMedia}</p>
          <p className="text-xs text-muted-foreground">Média (60-79%)</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-lg font-bold text-accent-foreground">{estatisticas.confiancaBaixa}</p>
          <p className="text-xs text-muted-foreground">Baixa (&lt;60%)</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted">
          <p className="text-lg font-bold text-muted-foreground">{estatisticas.semMatch}</p>
          <p className="text-xs text-muted-foreground">Sem match</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-bold text-primary">
            {formatCurrency(estatisticas.valorTotalMatches)}
          </p>
          <p className="text-xs text-muted-foreground">Valor total</p>
        </div>
      </div>

      {estatisticas.comSugestao > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progresso de conciliação</span>
            <span>
              {matchesConfirmadosSize} de {estatisticas.comSugestao + matchesConfirmadosSize}{' '}
              confirmados
            </span>
          </div>
          <Progress
            value={
              (matchesConfirmadosSize / (estatisticas.comSugestao + matchesConfirmadosSize)) * 100
            }
            className="h-2"
          />
        </div>
      )}

      {lastAnalysis && (
        <p className="text-xs text-muted-foreground mt-2">
          Última análise: {lastAnalysis.toLocaleTimeString('pt-BR')}
        </p>
      )}
    </>
  );
}
