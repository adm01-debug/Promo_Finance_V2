import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Link2,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  HelpCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { TransacaoOFX } from '@/lib/ofx-parser';
import { 
  MatchSugestao, 
  EstatisticasMatch,
  encontrarTodosMatches,
  calcularEstatisticasMatch,
  LancamentoSistema,
} from '@/lib/transaction-matcher';

interface SugestoesMatchProps {
  transacoes: TransacaoOFX[];
  lancamentos: LancamentoSistema[];
  onConfirmarMatch: (transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => void;
  onRejeitarMatch: (transacaoId: string, lancamentoId: string) => void;
  onConciliarManual: (transacaoId: string) => void;
}

export function SugestoesMatch({
  transacoes,
  lancamentos,
  onConfirmarMatch,
  onRejeitarMatch,
  onConciliarManual,
}: SugestoesMatchProps) {
  const [expandedTransacao, setExpandedTransacao] = useState<string | null>(null);
  const [matchesConfirmados, setMatchesConfirmados] = useState<Set<string>>(new Set());
  const [matchesRejeitados, setMatchesRejeitados] = useState<Set<string>>(new Set());

  // Calculate matches
  const matches = useMemo(() => {
    return encontrarTodosMatches(transacoes, lancamentos);
  }, [transacoes, lancamentos]);

  // Filter out confirmed/rejected
  const transacoesComSugestao = useMemo(() => {
    return transacoes.filter(t => {
      const sugestoes = matches.get(t.id);
      return sugestoes && sugestoes.length > 0 && !matchesConfirmados.has(t.id);
    });
  }, [transacoes, matches, matchesConfirmados]);

  // Statistics
  const estatisticas = useMemo(() => {
    return calcularEstatisticasMatch(transacoes, matches);
  }, [transacoes, matches]);

  const handleConfirmar = (transacaoId: string, sugestao: MatchSugestao) => {
    setMatchesConfirmados(prev => new Set([...prev, transacaoId]));
    onConfirmarMatch(transacaoId, sugestao.lancamentoId, sugestao.lancamentoTipo);
  };

  const handleRejeitar = (transacaoId: string, lancamentoId: string) => {
    setMatchesRejeitados(prev => new Set([...prev, `${transacaoId}-${lancamentoId}`]));
    onRejeitarMatch(transacaoId, lancamentoId);
  };

  if (transacoes.length === 0) {
    return null;
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Match Inteligente
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <p className="text-sm">
                  O algoritmo analisa valor, nome, data e documento para sugerir correspondências 
                  entre transações do extrato e lançamentos do sistema.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
          <Badge 
            variant={estatisticas.confiancaAlta > 0 ? "default" : "secondary"}
            className="gap-1"
          >
            <Zap className="h-3 w-3" />
            {estatisticas.comSugestao} sugestões
          </Badge>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center p-2 rounded-lg bg-success/10">
            <p className="text-lg font-bold text-success">{estatisticas.confiancaAlta}</p>
            <p className="text-xs text-muted-foreground">Alta confiança</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-warning/10">
            <p className="text-lg font-bold text-warning">{estatisticas.confiancaMedia}</p>
            <p className="text-xs text-muted-foreground">Média confiança</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-accent/20">
            <p className="text-lg font-bold text-accent-foreground">{estatisticas.confiancaBaixa}</p>
            <p className="text-xs text-muted-foreground">Baixa confiança</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted">
            <p className="text-lg font-bold text-muted-foreground">{estatisticas.semMatch}</p>
            <p className="text-xs text-muted-foreground">Sem match</p>
          </div>
        </div>

        {estatisticas.comSugestao > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso de conciliação</span>
              <span>{matchesConfirmados.size} de {estatisticas.comSugestao} confirmados</span>
            </div>
            <Progress 
              value={(matchesConfirmados.size / estatisticas.comSugestao) * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-2">
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {transacoesComSugestao.map((transacao) => {
                const sugestoes = matches.get(transacao.id) || [];
                const melhorMatch = sugestoes[0];
                const isExpanded = expandedTransacao === transacao.id;
                
                return (
                  <motion.div
                    key={transacao.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <Collapsible 
                      open={isExpanded} 
                      onOpenChange={() => setExpandedTransacao(isExpanded ? null : transacao.id)}
                    >
                      <div className={cn(
                        "rounded-lg border transition-all",
                        melhorMatch?.confianca === 'alta' && "border-success/50 bg-success/5",
                        melhorMatch?.confianca === 'media' && "border-warning/50 bg-warning/5",
                        melhorMatch?.confianca === 'baixa' && "border-border bg-card",
                      )}>
                        {/* Main row */}
                        <div className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Transaction info */}
                            <div className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                              transacao.tipo === 'credito' 
                                ? "bg-success/10 text-success" 
                                : "bg-destructive/10 text-destructive"
                            )}>
                              {transacao.tipo === 'credito' 
                                ? <TrendingUp className="h-5 w-5" /> 
                                : <TrendingDown className="h-5 w-5" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{transacao.descricao}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatDate(transacao.data)}</span>
                                <span className={cn(
                                  "font-semibold",
                                  transacao.tipo === 'credito' ? "text-success" : "text-destructive"
                                )}>
                                  {formatCurrency(transacao.valor)}
                                </span>
                              </div>
                            </div>

                            {/* Match indicator */}
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              
                              <div className="flex items-center gap-2">
                                <ScoreBadge score={melhorMatch.score} confianca={melhorMatch.confianca} />
                                
                                <div className="text-right">
                                  <p className="text-sm font-medium truncate max-w-[150px]">
                                    {melhorMatch.lancamento.entidade}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(melhorMatch.lancamento.valor)}
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 ml-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleConfirmar(transacao.id, melhorMatch);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejeitar(transacao.id, melhorMatch.lancamentoId);
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <CollapsibleTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </CollapsibleTrigger>
                              </div>
                            </div>
                          </div>

                          {/* Match reasons preview */}
                          <div className="flex items-center gap-1 mt-2 ml-13">
                            {melhorMatch.motivos.slice(0, 3).map((motivo, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="text-xs h-5 px-1.5"
                              >
                                {motivo.tipo === 'valor_exato' && '💰 Valor exato'}
                                {motivo.tipo === 'valor_proximo' && '≈ Valor próximo'}
                                {motivo.tipo === 'nome_exato' && '✓ Nome exato'}
                                {motivo.tipo === 'nome_parcial' && '○ Nome similar'}
                                {motivo.tipo === 'data_proxima' && '📅 Data próxima'}
                                {motivo.tipo === 'documento' && '📄 Documento'}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Expanded content */}
                        <CollapsibleContent>
                          <div className="border-t px-3 py-3 space-y-3 bg-background/50">
                            {/* All suggestions */}
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
                                        "flex items-center justify-between p-2 rounded-lg border",
                                        idx === 0 ? "bg-accent/20 border-accent/30" : "bg-card"
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <ScoreBadge 
                                          score={sugestao.score} 
                                          confianca={sugestao.confianca}
                                          size="sm"
                                        />
                                        <div>
                                          <p className="text-sm font-medium">
                                            {sugestao.lancamento.entidade}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {sugestao.lancamento.descricao} • {formatCurrency(sugestao.lancamento.valor)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            Vence: {formatDate(sugestao.lancamento.dataVencimento)}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs gap-1"
                                          onClick={() => handleConfirmar(transacao.id, sugestao)}
                                        >
                                          <Link2 className="h-3 w-3" />
                                          Vincular
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7"
                                          onClick={() => handleRejeitar(transacao.id, sugestao.lancamentoId)}
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
              })}
            </AnimatePresence>

            {transacoesComSugestao.length === 0 && estatisticas.comSugestao > 0 && (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                <p className="font-medium">Todas as sugestões foram processadas!</p>
                <p className="text-sm text-muted-foreground">
                  {matchesConfirmados.size} transações conciliadas
                </p>
              </div>
            )}

            {estatisticas.comSugestao === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">Nenhuma correspondência encontrada</p>
                <p className="text-sm text-muted-foreground">
                  Verifique se existem lançamentos pendentes no sistema
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Score badge component
interface ScoreBadgeProps {
  score: number;
  confianca: 'alta' | 'media' | 'baixa';
  size?: 'sm' | 'md';
}

function ScoreBadge({ score, confianca, size = 'md' }: ScoreBadgeProps) {
  const sizeClass = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm';
  
  return (
    <div className={cn(
      "rounded-full font-bold flex items-center justify-center",
      sizeClass,
      confianca === 'alta' && "bg-success text-success-foreground",
      confianca === 'media' && "bg-warning text-warning-foreground",
      confianca === 'baixa' && "bg-muted text-muted-foreground",
    )}>
      {score}
    </div>
  );
}
