import { motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, TrendingUp, TrendingDown,
  Link2, X, ChevronDown, ChevronUp, Target, HelpCircle, Brain,
  RefreshCw, Loader2, CheckCheck, History, FileText, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { TransacaoOFX } from '@/lib/ofx-parser';
import type { MatchSugestaoIA } from '@/hooks/useConciliacaoIA';
import { ScoreBadgeIA } from './ScoreBadgeIA';
import { CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

export interface EstatisticasIA {
  comSugestao: number;
  confiancaAlta: number;
  confiancaMedia: number;
  confiancaBaixa: number;
  semMatch: number;
  valorTotalMatches: number;
}

interface HeaderProps {
  matchesAltaConfiancaCount: number;
  mutationPending: boolean;
  aprovarEmLotePending: boolean;
  onAprovarTodos: () => void;
  onHistorico: () => void;
  onReanalisar: () => void;
  isAnalyzing: boolean;
  estatisticas: EstatisticasIA;
  matchesConfirmadosSize: number;
  lastAnalysis: Date | null;
}

export function SugestoesHeaderIA({
  matchesAltaConfiancaCount, mutationPending, aprovarEmLotePending,
  onAprovarTodos, onHistorico, onReanalisar, isAnalyzing,
  estatisticas, matchesConfirmadosSize, lastAnalysis,
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
              <p className="text-sm">A IA analisa padrões de valor, descrição, data e tipo para sugerir correspondências com alta precisão.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>

        <div className="flex items-center gap-2">
          {matchesAltaConfiancaCount > 0 && (
            <Button variant="default" size="sm" onClick={onAprovarTodos} disabled={mutationPending} className="gap-2 bg-success hover:bg-success/90">
              {aprovarEmLotePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Aprovar todos ({matchesAltaConfiancaCount})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onHistorico} className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </Button>
          <Button variant="outline" size="sm" onClick={onReanalisar} disabled={isAnalyzing} className="gap-2">
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {isAnalyzing ? 'Analisando...' : 'Reanalisar'}
          </Button>
          <Badge variant={estatisticas.confiancaAlta > 0 ? "default" : "secondary"} className="gap-1">
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
          <p className="text-sm font-bold text-primary">{formatCurrency(estatisticas.valorTotalMatches)}</p>
          <p className="text-xs text-muted-foreground">Valor total</p>
        </div>
      </div>

      {estatisticas.comSugestao > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progresso de conciliação</span>
            <span>{matchesConfirmadosSize} de {estatisticas.comSugestao + matchesConfirmadosSize} confirmados</span>
          </div>
          <Progress value={(matchesConfirmadosSize / (estatisticas.comSugestao + matchesConfirmadosSize)) * 100} className="h-2" />
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

interface CardProps {
  transacao: TransacaoOFX;
  sugestoes: MatchSugestaoIA[];
  melhorMatch: MatchSugestaoIA;
  isExpanded: boolean;
  onToggle: () => void;
  mutationPending: boolean;
  motivosRejeicaoPorTransacao: Map<string, string>;
  matchesRejeitados: Set<string>;
  onConfirmar: (transacaoId: string, transacaoDescricao: string, sugestao: MatchSugestaoIA) => void;
  onRejeitar: (transacaoId: string, transacaoDescricao: string, sugestao: MatchSugestaoIA) => void;
  abrirDetalhes: (transacao: TransacaoOFX, sugestao: MatchSugestaoIA) => void;
  onConciliarManual: (transacaoId: string) => void;
}

export function SugestaoMatchCard({
  transacao, sugestoes, melhorMatch, isExpanded, onToggle, mutationPending,
  motivosRejeicaoPorTransacao, matchesRejeitados,
  onConfirmar, onRejeitar, abrirDetalhes, onConciliarManual,
}: CardProps) {
  return (
    <motion.div key={transacao.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className={cn(
          "rounded-lg border transition-all",
          melhorMatch.confianca === 'alta' && "border-success/50 bg-success/5",
          melhorMatch.confianca === 'media' && "border-warning/50 bg-warning/5",
          melhorMatch.confianca === 'baixa' && "border-border bg-card",
        )}>
          <div className="p-3">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0", transacao.tipo === 'credito' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                {transacao.tipo === 'credito' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{transacao.descricao}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(transacao.data)}</span>
                  <span className={cn("font-semibold", transacao.tipo === 'credito' ? "text-success" : "text-destructive")}>{formatCurrency(transacao.valor)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <ScoreBadgeIA score={melhorMatch.score} confianca={melhorMatch.confianca} />
                  <div className="text-right">
                    <p className="text-sm font-medium truncate max-w-[150px]">{melhorMatch.lancamento?.entidade}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(melhorMatch.lancamento?.valor || 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); abrirDetalhes(transacao, melhorMatch); }}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver detalhes</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" disabled={mutationPending} className="h-8 w-8 text-success hover:text-success hover:bg-success/10" onClick={(e) => { e.stopPropagation(); onConfirmar(transacao.id, transacao.descricao, melhorMatch); }}>
                        {mutationPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Aprovar Match (IA Aprende)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="ghost" disabled={mutationPending} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onRejeitar(transacao.id, transacao.descricao, melhorMatch); }}>
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rejeitar / Sugerir outro</TooltipContent>
                  </Tooltip>
                  <CollapsibleTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </div>

            {melhorMatch.analiseIA && (
              <div className="mt-2 ml-13 p-2 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-xs text-accent-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {melhorMatch.analiseIA}
                </p>
              </div>
            )}

            {motivosRejeicaoPorTransacao.has(transacao.id) && (
              <div className="mt-2 ml-13 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-xs text-destructive flex items-start gap-1.5">
                  <X className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-semibold">Motivo da rejeição anterior:</span>{' '}
                    {motivosRejeicaoPorTransacao.get(transacao.id)}
                  </span>
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-1 mt-2 ml-13">
              {melhorMatch.motivos.slice(0, 4).map((motivo, idx) => (
                <Tooltip key={idx}>
                  <TooltipTrigger>
                    <Badge variant="outline" className="text-xs h-5 px-1.5 cursor-help">
                      {motivo.tipo === 'valor_exato' && '💰 Valor exato'}
                      {motivo.tipo === 'valor_proximo' && '≈ Valor próximo'}
                      {motivo.tipo === 'nome_exato' && '✓ Nome exato'}
                      {motivo.tipo === 'nome_parcial' && '○ Nome similar'}
                      {motivo.tipo === 'data_proxima' && '📅 Data próxima'}
                      {motivo.tipo === 'documento' && '📄 Documento'}
                      {motivo.tipo === 'tipo_compativel' && '🔄 Tipo OK'}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{motivo.detalhe}</p>
                    <p className="text-xs text-muted-foreground">Peso: {motivo.peso}%</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <CollapsibleContent>
            <div className="border-t px-3 py-3 space-y-3 bg-background/50">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Todas as sugestões ({sugestoes.length})</p>
                <div className="space-y-2">
                  {sugestoes.map((sugestao, idx) => {
                    const isRejeitado = matchesRejeitados.has(`${transacao.id}-${sugestao.lancamentoId}`);
                    if (isRejeitado) return null;
                    return (
                      <div key={sugestao.lancamentoId} className={cn("flex items-center justify-between p-2 rounded-lg border", idx === 0 ? "bg-accent/20 border-accent/30" : "bg-card")}>
                        <div className="flex items-center gap-3">
                          <ScoreBadgeIA score={sugestao.score} confianca={sugestao.confianca} size="sm" />
                          <div>
                            <p className="text-sm font-medium">{sugestao.lancamento?.entidade}</p>
                            <p className="text-xs text-muted-foreground">{sugestao.lancamento?.descricao} • {formatCurrency(sugestao.lancamento?.valor || 0)}</p>
                            <p className="text-xs text-muted-foreground">Vence: {sugestao.lancamento?.dataVencimento ? formatDate(sugestao.lancamento.dataVencimento) : '-'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => abrirDetalhes(transacao, sugestao)}>
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" disabled={mutationPending} className="h-7 text-xs gap-1" onClick={() => onConfirmar(transacao.id, transacao.descricao, sugestao)}>
                            {mutationPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2 className="h-3 w-3" />}
                            Vincular
                          </Button>
                          <Button size="icon" variant="ghost" disabled={mutationPending} className="h-7 w-7" onClick={() => onRejeitar(transacao.id, transacao.descricao, sugestao)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onConciliarManual(transacao.id)}>
                <Target className="h-3 w-3 mr-1" />
                Conciliar manualmente
              </Button>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </motion.div>
  );
}
