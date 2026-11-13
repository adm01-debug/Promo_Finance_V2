import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Link2,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Loader2,
  FileText,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { ScoreBadgeIA } from './ScoreBadgeIA';
import type { CardProps } from './SugestoesMatchSections.types';

export function SugestaoMatchCard({
  transacao,
  sugestoes,
  melhorMatch,
  isExpanded,
  onToggle,
  mutationPending,
  motivosRejeicaoPorTransacao,
  matchesRejeitados,
  onConfirmar,
  onRejeitar,
  abrirDetalhes,
  onConciliarManual,
}: CardProps) {
  return (
    <motion.div
      key={transacao.id}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div
          className={cn(
            'rounded-lg border transition-all',
            melhorMatch.confianca === 'alta' && 'border-success/50 bg-success/5',
            melhorMatch.confianca === 'media' && 'border-warning/50 bg-warning/5',
            melhorMatch.confianca === 'baixa' && 'border-border bg-card'
          )}
        >
          <div className="p-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  transacao.tipo === 'credito'
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive'
                )}
              >
                {transacao.tipo === 'credito' ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{transacao.descricao}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(transacao.data)}</span>
                  <span
                    className={cn(
                      'font-semibold',
                      transacao.tipo === 'credito' ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {formatCurrency(transacao.valor)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  <ScoreBadgeIA score={melhorMatch.score} confianca={melhorMatch.confianca} />
                  <div className="text-right">
                    <p className="text-sm font-medium truncate max-w-[150px]">
                      {melhorMatch.lancamento?.entidade}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(melhorMatch.lancamento?.valor || 0)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirDetalhes(transacao, melhorMatch);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver detalhes</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={mutationPending}
                        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onConfirmar(transacao.id, transacao.descricao, melhorMatch);
                        }}
                      >
                        {mutationPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ThumbsUp className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Aprovar Match (IA Aprende)</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={mutationPending}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRejeitar(transacao.id, transacao.descricao, melhorMatch);
                        }}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rejeitar / Sugerir outro</TooltipContent>
                  </Tooltip>
                  <CollapsibleTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
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
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Todas as sugestões ({sugestoes.length})
                </p>
                <div className="space-y-2">
                  {sugestoes.map((sugestao, idx) => {
                    const isRejeitado = matchesRejeitados.has(
                      `${transacao.id}-${sugestao.lancamentoId}`
                    );
                    if (isRejeitado) return null;
                    return (
                      <div
                        key={sugestao.lancamentoId}
                        className={cn(
                          'flex items-center justify-between p-2 rounded-lg border',
                          idx === 0 ? 'bg-accent/20 border-accent/30' : 'bg-card'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <ScoreBadgeIA
                            score={sugestao.score}
                            confianca={sugestao.confianca}
                            size="sm"
                          />
                          <div>
                            <p className="text-sm font-medium">{sugestao.lancamento?.entidade}</p>
                            <p className="text-xs text-muted-foreground">
                              {sugestao.lancamento?.descricao} •{' '}
                              {formatCurrency(sugestao.lancamento?.valor || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vence:{' '}
                              {sugestao.lancamento?.dataVencimento
                                ? formatDate(sugestao.lancamento.dataVencimento)
                                : '-'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => abrirDetalhes(transacao, sugestao)}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={mutationPending}
                            className="h-7 text-xs gap-1"
                            onClick={() => onConfirmar(transacao.id, transacao.descricao, sugestao)}
                          >
                            {mutationPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Link2 className="h-3 w-3" />
                            )}
                            Vincular
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={mutationPending}
                            className="h-7 w-7"
                            onClick={() => onRejeitar(transacao.id, transacao.descricao, sugestao)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onConciliarManual(transacao.id)}
              >
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
