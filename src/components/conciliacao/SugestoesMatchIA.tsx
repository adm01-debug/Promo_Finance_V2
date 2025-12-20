import { useState, useMemo, useEffect } from 'react';
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
  Brain,
  RefreshCw,
  Loader2,
  CheckCheck,
  History,
  ThumbsDown,
  FileText,
  Calendar,
  User,
  DollarSign,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { TransacaoOFX } from '@/lib/ofx-parser';
import { LancamentoSistema } from '@/lib/transaction-matcher';
import { useConciliacaoIA, MatchSugestaoIA } from '@/hooks/useConciliacaoIA';
import { useHistoricoConciliacaoIA } from '@/hooks/useHistoricoConciliacaoIA';

interface SugestoesMatchIAProps {
  transacoes: TransacaoOFX[];
  lancamentos: LancamentoSistema[];
  onConfirmarMatch: (transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => void;
  onRejeitarMatch: (transacaoId: string, lancamentoId: string) => void;
  onConciliarManual: (transacaoId: string) => void;
}

function ScoreBadgeIA({ score, confianca, size = 'default' }: { 
  score: number; 
  confianca: 'alta' | 'media' | 'baixa';
  size?: 'default' | 'sm';
}) {
  const isSmall = size === 'sm';
  
  return (
    <div className={cn(
      "flex items-center gap-1 rounded-full font-mono font-bold",
      isSmall ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
      confianca === 'alta' && "bg-success/20 text-success border border-success/30",
      confianca === 'media' && "bg-warning/20 text-warning border border-warning/30",
      confianca === 'baixa' && "bg-muted text-muted-foreground border border-border",
    )}>
      <Brain className={cn(isSmall ? "h-3 w-3" : "h-4 w-4")} />
      {score}%
    </div>
  );
}

function DetalhesExpandidosDialog({
  open,
  onOpenChange,
  transacao,
  sugestao,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao: TransacaoOFX | null;
  sugestao: MatchSugestaoIA | null;
}) {
  if (!transacao || !sugestao) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Detalhes do Match IA
          </DialogTitle>
          <DialogDescription>
            Análise detalhada da correspondência sugerida
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Transação do Extrato */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Transação do Extrato
            </h4>
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-xs text-muted-foreground">Descrição</p>
                <p className="font-medium">{transacao.descricao}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(transacao.data)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className={cn(
                    "font-bold flex items-center gap-1",
                    transacao.tipo === 'credito' ? "text-success" : "text-destructive"
                  )}>
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(transacao.valor)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Badge variant={transacao.tipo === 'credito' ? 'default' : 'destructive'}>
                  {transacao.tipo === 'credito' ? 'Crédito' : 'Débito'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Lançamento Sugerido */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Lançamento Sugerido
            </h4>
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-xs text-muted-foreground">Entidade</p>
                <p className="font-medium flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {sugestao.lancamento?.entidade}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Descrição</p>
                <p className="text-sm">{sugestao.lancamento?.descricao || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {sugestao.lancamento?.dataVencimento ? formatDate(sugestao.lancamento.dataVencimento) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-bold flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {formatCurrency(sugestao.lancamento?.valor || 0)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <Badge variant={sugestao.lancamentoTipo === 'receber' ? 'default' : 'secondary'}>
                  {sugestao.lancamentoTipo === 'receber' ? 'A Receber' : 'A Pagar'}
                </Badge>
              </div>
              {sugestao.lancamento?.numeroDocumento && (
                <div>
                  <p className="text-xs text-muted-foreground">Documento</p>
                  <p className="text-sm font-mono">{sugestao.lancamento.numeroDocumento}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Análise IA */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Análise da IA</h4>
            <ScoreBadgeIA score={sugestao.score} confianca={sugestao.confianca} />
          </div>

          {sugestao.analiseIA && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 text-accent" />
                {sugestao.analiseIA}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {sugestao.motivos.map((motivo, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border"
              >
                <span className="text-sm">
                  {motivo.tipo === 'valor_exato' && '💰 Valor exato'}
                  {motivo.tipo === 'valor_proximo' && '≈ Valor próximo'}
                  {motivo.tipo === 'nome_exato' && '✓ Nome exato'}
                  {motivo.tipo === 'nome_parcial' && '○ Nome similar'}
                  {motivo.tipo === 'data_proxima' && '📅 Data próxima'}
                  {motivo.tipo === 'documento' && '📄 Documento'}
                  {motivo.tipo === 'tipo_compativel' && '🔄 Tipo OK'}
                </span>
                <Badge variant="outline" className="text-xs">
                  +{motivo.peso}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SugestoesMatchIA({
  transacoes,
  lancamentos,
  onConfirmarMatch,
  onRejeitarMatch,
  onConciliarManual,
}: SugestoesMatchIAProps) {
  const [expandedTransacao, setExpandedTransacao] = useState<string | null>(null);
  const [matchesConfirmados, setMatchesConfirmados] = useState<Set<string>>(new Set());
  const [matchesRejeitados, setMatchesRejeitados] = useState<Set<string>>(new Set());
  const [showAprovarTodosDialog, setShowAprovarTodosDialog] = useState(false);
  const [showHistoricoDialog, setShowHistoricoDialog] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [rejeicaoPendente, setRejeicaoPendente] = useState<{
    transacaoId: string;
    transacaoDescricao: string;
    sugestao: MatchSugestaoIA;
  } | null>(null);
  const [detalhesDialog, setDetalhesDialog] = useState<{
    open: boolean;
    transacao: TransacaoOFX | null;
    sugestao: MatchSugestaoIA | null;
  }>({ open: false, transacao: null, sugestao: null });
  
  const { isAnalyzing, matchesIA, lastAnalysis, analisarConciliacao } = useConciliacaoIA();
  const { 
    historico, 
    registrarHistorico, 
    registrarFeedback,
    aprovarEmLote,
    estatisticasHistorico,
    isLoadingHistorico 
  } = useHistoricoConciliacaoIA();

  // Auto-analyze when data changes
  useEffect(() => {
    if (transacoes.length > 0 && lancamentos.length > 0 && !lastAnalysis && !isAnalyzing) {
      analisarConciliacao(transacoes, lancamentos);
    }
  }, [transacoes, lancamentos, lastAnalysis, isAnalyzing, analisarConciliacao]);

  // Filter out confirmed transactions
  const transacoesComSugestao = useMemo(() => {
    return transacoes.filter(t => {
      const sugestoes = matchesIA.get(t.id);
      return sugestoes && sugestoes.length > 0 && !matchesConfirmados.has(t.id);
    });
  }, [transacoes, matchesIA, matchesConfirmados]);

  // Get high confidence matches for batch approval
  const matchesAltaConfianca = useMemo(() => {
    const matches: Array<{
      transacaoId: string;
      transacaoDescricao: string;
      sugestao: MatchSugestaoIA;
    }> = [];

    transacoesComSugestao.forEach(transacao => {
      const sugestoes = matchesIA.get(transacao.id);
      if (sugestoes && sugestoes.length > 0) {
        const melhor = sugestoes[0];
        if (melhor.confianca === 'alta') {
          matches.push({
            transacaoId: transacao.id,
            transacaoDescricao: transacao.descricao,
            sugestao: melhor,
          });
        }
      }
    });

    return matches;
  }, [transacoesComSugestao, matchesIA]);

  // Statistics
  const estatisticas = useMemo(() => {
    let total = 0;
    let alta = 0;
    let media = 0;
    let baixa = 0;
    let valorTotal = 0;

    matchesIA.forEach((sugestoes, transacaoId) => {
      if (sugestoes.length > 0 && !matchesConfirmados.has(transacaoId)) {
        total++;
        const melhor = sugestoes[0];
        if (melhor.confianca === 'alta') alta++;
        else if (melhor.confianca === 'media') media++;
        else baixa++;
        valorTotal += Math.abs(sugestoes[0].lancamento?.valor || 0);
      }
    });

    return {
      comSugestao: total,
      confiancaAlta: alta,
      confiancaMedia: media,
      confiancaBaixa: baixa,
      semMatch: transacoes.length - matchesIA.size,
      valorTotalMatches: valorTotal
    };
  }, [matchesIA, matchesConfirmados, transacoes.length]);

  const handleConfirmar = async (transacaoId: string, transacaoDescricao: string, sugestao: MatchSugestaoIA) => {
    setMatchesConfirmados(prev => new Set([...prev, transacaoId]));
    
    // Registrar histórico e feedback
    await registrarHistorico.mutateAsync({
      transacaoId,
      lancamentoId: sugestao.lancamentoId,
      tipoLancamento: sugestao.lancamentoTipo,
      score: sugestao.score,
      confianca: sugestao.confianca,
      motivos: sugestao.motivos,
      analiseIA: sugestao.analiseIA,
      acao: 'aprovado',
    });

    await registrarFeedback.mutateAsync({
      transacaoDescricao,
      lancamentoEntidade: sugestao.lancamento?.entidade || '',
      lancamentoDescricao: sugestao.lancamento?.descricao,
      tipoLancamento: sugestao.lancamentoTipo,
      scoreOriginal: sugestao.score,
      acao: 'aprovado',
    });

    onConfirmarMatch(transacaoId, sugestao.lancamentoId, sugestao.lancamentoTipo);
  };

  const handleRejeitar = (transacaoId: string, transacaoDescricao: string, sugestao: MatchSugestaoIA) => {
    setRejeicaoPendente({ transacaoId, transacaoDescricao, sugestao });
    setMotivoRejeicao('');
  };

  const confirmarRejeicao = async () => {
    if (!rejeicaoPendente) return;

    const { transacaoId, transacaoDescricao, sugestao } = rejeicaoPendente;
    
    setMatchesRejeitados(prev => new Set([...prev, `${transacaoId}-${sugestao.lancamentoId}`]));
    
    // Registrar histórico e feedback com motivo
    await registrarHistorico.mutateAsync({
      transacaoId,
      lancamentoId: sugestao.lancamentoId,
      tipoLancamento: sugestao.lancamentoTipo,
      score: sugestao.score,
      confianca: sugestao.confianca,
      motivos: sugestao.motivos,
      analiseIA: sugestao.analiseIA,
      acao: 'rejeitado',
    });

    await registrarFeedback.mutateAsync({
      transacaoDescricao,
      lancamentoEntidade: sugestao.lancamento?.entidade || '',
      lancamentoDescricao: sugestao.lancamento?.descricao,
      tipoLancamento: sugestao.lancamentoTipo,
      scoreOriginal: sugestao.score,
      acao: 'rejeitado',
      motivoRejeicao: motivoRejeicao || undefined,
    });

    onRejeitarMatch(transacaoId, sugestao.lancamentoId);
    setRejeicaoPendente(null);
    setMotivoRejeicao('');
  };

  const handleAprovarTodos = async () => {
    // Marcar todos como confirmados localmente
    const novosConfirmados = new Set(matchesConfirmados);
    matchesAltaConfianca.forEach(m => novosConfirmados.add(m.transacaoId));
    setMatchesConfirmados(novosConfirmados);

    // Registrar no banco e chamar callbacks
    await aprovarEmLote.mutateAsync(matchesAltaConfianca);
    
    matchesAltaConfianca.forEach(m => {
      onConfirmarMatch(m.transacaoId, m.sugestao.lancamentoId, m.sugestao.lancamentoTipo);
    });

    setShowAprovarTodosDialog(false);
  };

  const handleReanalisar = () => {
    analisarConciliacao(transacoes, lancamentos);
  };

  const abrirDetalhes = (transacao: TransacaoOFX, sugestao: MatchSugestaoIA) => {
    setDetalhesDialog({ open: true, transacao, sugestao });
  };

  if (transacoes.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="card-elevated border-accent/30">
        <CardHeader className="pb-3">
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
                    A IA analisa padrões de valor, descrição, data e tipo para sugerir 
                    correspondências com alta precisão entre transações e lançamentos.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {matchesAltaConfianca.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowAprovarTodosDialog(true)}
                  className="gap-2 bg-success hover:bg-success/90"
                >
                  <CheckCheck className="h-4 w-4" />
                  Aprovar todos ({matchesAltaConfianca.length})
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistoricoDialog(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                Histórico
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleReanalisar}
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
                variant={estatisticas.confiancaAlta > 0 ? "default" : "secondary"}
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
              <p className="text-sm font-bold text-primary">{formatCurrency(estatisticas.valorTotalMatches)}</p>
              <p className="text-xs text-muted-foreground">Valor total</p>
            </div>
          </div>

          {estatisticas.comSugestao > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso de conciliação</span>
                <span>{matchesConfirmados.size} de {estatisticas.comSugestao + matchesConfirmados.size} confirmados</span>
              </div>
              <Progress 
                value={(matchesConfirmados.size / (estatisticas.comSugestao + matchesConfirmados.size)) * 100} 
                className="h-2"
              />
            </div>
          )}

          {lastAnalysis && (
            <p className="text-xs text-muted-foreground mt-2">
              Última análise: {lastAnalysis.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-accent to-primary animate-pulse" />
                <Brain className="h-8 w-8 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center">
                <p className="font-medium">Analisando com Inteligência Artificial...</p>
                <p className="text-sm text-muted-foreground">
                  Comparando {transacoes.length} transações com {lancamentos.length} lançamentos
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {transacoesComSugestao.map((transacao) => {
                    const sugestoes = matchesIA.get(transacao.id) || [];
                    const melhorMatch = sugestoes[0];
                    const isExpanded = expandedTransacao === transacao.id;
                    
                    if (!melhorMatch) return null;
                    
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
                            melhorMatch.confianca === 'alta' && "border-success/50 bg-success/5",
                            melhorMatch.confianca === 'media' && "border-warning/50 bg-warning/5",
                            melhorMatch.confianca === 'baixa' && "border-border bg-card",
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

                                  {/* Actions */}
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
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmar(transacao.id, transacao.descricao, melhorMatch);
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
                                        handleRejeitar(transacao.id, transacao.descricao, melhorMatch);
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

                              {/* AI Analysis preview */}
                              {melhorMatch.analiseIA && (
                                <div className="mt-2 ml-13 p-2 rounded-lg bg-accent/10 border border-accent/20">
                                  <p className="text-xs text-accent-foreground flex items-center gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    {melhorMatch.analiseIA}
                                  </p>
                                </div>
                              )}

                              {/* Match reasons preview */}
                              <div className="flex flex-wrap items-center gap-1 mt-2 ml-13">
                                {melhorMatch.motivos.slice(0, 4).map((motivo, idx) => (
                                  <Tooltip key={idx}>
                                    <TooltipTrigger>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs h-5 px-1.5 cursor-help"
                                      >
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
                                            <ScoreBadgeIA 
                                              score={sugestao.score} 
                                              confianca={sugestao.confianca}
                                              size="sm"
                                            />
                                            <div>
                                              <p className="text-sm font-medium">
                                                {sugestao.lancamento?.entidade}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {sugestao.lancamento?.descricao} • {formatCurrency(sugestao.lancamento?.valor || 0)}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                Vence: {sugestao.lancamento?.dataVencimento ? formatDate(sugestao.lancamento.dataVencimento) : '-'}
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
                                              className="h-7 text-xs gap-1"
                                              onClick={() => handleConfirmar(transacao.id, transacao.descricao, sugestao)}
                                            >
                                              <Link2 className="h-3 w-3" />
                                              Vincular
                                            </Button>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-7 w-7"
                                              onClick={() => handleRejeitar(transacao.id, transacao.descricao, sugestao)}
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

                {transacoesComSugestao.length === 0 && matchesIA.size > 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                    <p className="font-medium">Todas as sugestões foram processadas!</p>
                    <p className="text-sm text-muted-foreground">
                      {matchesConfirmados.size} transações conciliadas
                    </p>
                  </div>
                )}

                {matchesIA.size === 0 && !isAnalyzing && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Nenhuma correspondência encontrada</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      A IA não encontrou matches automáticos
                    </p>
                    <Button variant="outline" size="sm" onClick={handleReanalisar}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tentar novamente
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Aprovar Todos Dialog */}
      <AlertDialog open={showAprovarTodosDialog} onOpenChange={setShowAprovarTodosDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-success" />
              Aprovar todas de alta confiança?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a aprovar <strong>{matchesAltaConfianca.length}</strong> conciliações 
              com score ≥80%. Esta ação conciliará automaticamente as transações selecionadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[200px] overflow-auto space-y-2 my-4">
            {matchesAltaConfianca.slice(0, 5).map(m => (
              <div key={m.transacaoId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                <span className="truncate flex-1">{m.transacaoDescricao}</span>
                <Badge variant="outline" className="ml-2">{m.sugestao.score}%</Badge>
              </div>
            ))}
            {matchesAltaConfianca.length > 5 && (
              <p className="text-sm text-muted-foreground text-center">
                + {matchesAltaConfianca.length - 5} outros...
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAprovarTodos}
              className="bg-success hover:bg-success/90"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Aprovar {matchesAltaConfianca.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejeição com Motivo Dialog */}
      <Dialog open={!!rejeicaoPendente} onOpenChange={() => setRejeicaoPendente(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-destructive" />
              Rejeitar sugestão
            </DialogTitle>
            <DialogDescription>
              Ajude a melhorar a IA informando o motivo da rejeição (opcional)
            </DialogDescription>
          </DialogHeader>
          
          {rejeicaoPendente && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium">{rejeicaoPendente.transacaoDescricao}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {rejeicaoPendente.sugestao.lancamento?.entidade}
                  </span>
                  <ScoreBadgeIA 
                    score={rejeicaoPendente.sugestao.score} 
                    confianca={rejeicaoPendente.sugestao.confianca}
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo da rejeição (opcional)</label>
                <Textarea
                  placeholder="Ex: O valor está errado, não é o mesmo cliente, etc..."
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Este feedback ajudará a IA a fazer melhores sugestões no futuro.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejeicaoPendente(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmarRejeicao}>
              <ThumbsDown className="h-4 w-4 mr-2" />
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Histórico Dialog */}
      <Dialog open={showHistoricoDialog} onOpenChange={setShowHistoricoDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Histórico de Conciliações IA
            </DialogTitle>
            <DialogDescription>
              Registro de todas as conciliações aprovadas e rejeitadas com IA
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="historico" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="historico">Histórico</TabsTrigger>
              <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
            </TabsList>

            <TabsContent value="historico" className="space-y-4">
              <ScrollArea className="h-[400px]">
                {isLoadingHistorico ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : historico.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum registro encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {historico.map((item) => (
                      <div 
                        key={item.id}
                        className={cn(
                          "p-3 rounded-lg border",
                          item.acao === 'aprovado' 
                            ? "bg-success/5 border-success/20" 
                            : "bg-destructive/5 border-destructive/20"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {item.acao === 'aprovado' ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <X className="h-5 w-5 text-destructive" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {item.tipo_lancamento === 'receber' ? 'Conta a Receber' : 'Conta a Pagar'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.created_at).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <ScoreBadgeIA 
                              score={item.score_ia} 
                              confianca={item.confianca}
                              size="sm"
                            />
                            <Badge variant={item.acao === 'aprovado' ? 'default' : 'destructive'}>
                              {item.acao}
                            </Badge>
                          </div>
                        </div>
                        {item.analise_ia && (
                          <p className="text-xs text-muted-foreground mt-2 ml-8">
                            IA: {item.analise_ia}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="estatisticas" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-success">{estatisticasHistorico.totalAprovados}</p>
                      <p className="text-sm text-muted-foreground">Aprovados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-destructive">{estatisticasHistorico.totalRejeitados}</p>
                      <p className="text-sm text-muted-foreground">Rejeitados</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{estatisticasHistorico.scoreMedia}%</p>
                      <p className="text-sm text-muted-foreground">Score Médio</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Distribuição por Confiança</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alta (≥80%)</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(estatisticasHistorico.altaConfianca / (historico.length || 1)) * 100} 
                          className="w-32 h-2"
                        />
                        <span className="text-sm font-mono w-8">{estatisticasHistorico.altaConfianca}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Média (60-79%)</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(estatisticasHistorico.mediaConfianca / (historico.length || 1)) * 100} 
                          className="w-32 h-2"
                        />
                        <span className="text-sm font-mono w-8">{estatisticasHistorico.mediaConfianca}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Baixa (&lt;60%)</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(estatisticasHistorico.baixaConfianca / (historico.length || 1)) * 100} 
                          className="w-32 h-2"
                        />
                        <span className="text-sm font-mono w-8">{estatisticasHistorico.baixaConfianca}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Detalhes Expandidos Dialog */}
      <DetalhesExpandidosDialog
        open={detalhesDialog.open}
        onOpenChange={(open) => setDetalhesDialog(prev => ({ ...prev, open }))}
        transacao={detalhesDialog.transacao}
        sugestao={detalhesDialog.sugestao}
      />
    </>
  );
}
