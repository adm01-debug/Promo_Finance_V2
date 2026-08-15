import { useState, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  CheckCircle2, AlertCircle, Brain, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { TransacaoOFX } from '@/lib/ofx-parser';
import { LancamentoSistema } from '@/lib/transaction-matcher';
import { useConciliacaoIA, MatchSugestaoIA } from '@/hooks/useConciliacaoIA';
import { useHistoricoConciliacaoIA } from '@/hooks/useHistoricoConciliacaoIA';

// Extracted sub-components
import { DetalhesExpandidosDialog } from './ia/DetalhesExpandidosDialog';
import { HistoricoConciliacaoDialog } from './ia/HistoricoConciliacaoDialog';
import { RejeicaoDialog, type RejeicaoPendente } from './ia/RejeicaoDialog';
import { SugestoesHeaderIA, SugestaoMatchCard } from './ia/SugestoesMatchSections';
import { AprovarTodosDialog } from './ia/AprovarTodosDialog';

interface SugestoesMatchIAProps {
  transacoes: TransacaoOFX[];
  lancamentos: LancamentoSistema[];
  onConfirmarMatch: (transacaoId: string, lancamentoId: string, tipo: 'pagar' | 'receber') => void;
  onRejeitarMatch: (transacaoId: string, lancamentoId: string) => void;
  onConciliarManual: (transacaoId: string) => void;
}

export function SugestoesMatchIA({
  transacoes, lancamentos, onConfirmarMatch, onRejeitarMatch, onConciliarManual,
}: SugestoesMatchIAProps) {
  const [expandedTransacao, setExpandedTransacao] = useState<string | null>(null);
  const [matchesConfirmados, setMatchesConfirmados] = useState<Set<string>>(new Set());
  const [matchesRejeitados, setMatchesRejeitados] = useState<Set<string>>(new Set());
  const [showAprovarTodosDialog, setShowAprovarTodosDialog] = useState(false);
  const [showHistoricoDialog, setShowHistoricoDialog] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [rejeicaoPendente, setRejeicaoPendente] = useState<RejeicaoPendente | null>(null);
  const [detalhesDialog, setDetalhesDialog] = useState<{
    open: boolean; transacao: TransacaoOFX | null; sugestao: MatchSugestaoIA | null;
  }>({ open: false, transacao: null, sugestao: null });
  
  const { isAnalyzing, matchesIA, lastAnalysis, analisarConciliacao } = useConciliacaoIA();
  const { historico, feedback, registrarHistorico, registrarFeedback, aprovarEmLote, estatisticasHistorico, isLoadingHistorico } = useHistoricoConciliacaoIA();

  // Mapa: transacao_bancaria_id -> motivo de rejeição mais recente (de feedback_conciliacao_ia)
  const motivosRejeicaoPorTransacao = useMemo(() => {
    const map = new Map<string, string>();
    feedback.forEach((f) => {
      if (f.acao !== 'rejeitado' || !f.transacao_bancaria_id) return;
      const motivo = (f.motivo_rejeicao || '').trim();
      if (!motivo) return;
      // feedback já vem ordenado desc por created_at — só registramos a primeira ocorrência
      if (!map.has(f.transacao_bancaria_id)) map.set(f.transacao_bancaria_id, motivo);
    });
    return map;
  }, [feedback]);

  // Bloqueia interações enquanto qualquer mutação de persistência está em andamento
  const mutationPending = registrarHistorico.isPending || registrarFeedback.isPending || aprovarEmLote.isPending;

  // Conjunto de matches rejeitados persistidos no histórico (transacao_bancaria_id + lancamento_id)
  const rejeicoesPersistidas = useMemo(() => {
    const set = new Set<string>();
    historico.forEach((h) => {
      if (h.acao !== 'rejeitado' || !h.transacao_bancaria_id) return;
      const lancId = h.conta_pagar_id || h.conta_receber_id;
      if (lancId) set.add(`${h.transacao_bancaria_id}-${lancId}`);
    });
    return set;
  }, [historico]);

  useEffect(() => {
    if (transacoes.length > 0 && lancamentos.length > 0 && !lastAnalysis && !isAnalyzing) {
      analisarConciliacao(transacoes, lancamentos);
    }
  }, [transacoes, lancamentos, lastAnalysis, isAnalyzing, analisarConciliacao]);

  const sugestoesValidasFor = useCallback((transacaoId: string): MatchSugestaoIA[] => {
    const sugestoes = matchesIA.get(transacaoId) || [];
    return sugestoes.filter((s) => {
      const key = `${transacaoId}-${s.lancamentoId}`;
      return !matchesRejeitados.has(key) && !rejeicoesPersistidas.has(key);
    });
  }, [matchesIA, matchesRejeitados, rejeicoesPersistidas]);

  const transacoesComSugestao = useMemo(() => {
    return transacoes.filter(t => {
      if (matchesConfirmados.has(t.id)) return false;
      return sugestoesValidasFor(t.id).length > 0;
    });
  }, [transacoes, matchesConfirmados, sugestoesValidasFor]);

  const matchesAltaConfianca = useMemo(() => {
    const matches: Array<{ transacaoId: string; transacaoDescricao: string; sugestao: MatchSugestaoIA }> = [];
    transacoesComSugestao.forEach(transacao => {
      const sugestoes = sugestoesValidasFor(transacao.id);
      if (sugestoes.length > 0 && sugestoes[0].confianca === 'alta') {
        matches.push({ transacaoId: transacao.id, transacaoDescricao: transacao.descricao, sugestao: sugestoes[0] });
      }
    });
    return matches;
  }, [transacoesComSugestao, sugestoesValidasFor]);


  const estatisticas = useMemo(() => {
    let total = 0, alta = 0, media = 0, baixa = 0, valorTotal = 0;
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
    return { comSugestao: total, confiancaAlta: alta, confiancaMedia: media, confiancaBaixa: baixa, semMatch: transacoes.length - matchesIA.size, valorTotalMatches: valorTotal };
  }, [matchesIA, matchesConfirmados, transacoes.length]);

  const triggerConfetti = useCallback((isFullCompletion = false) => {
    const count = isFullCompletion ? 200 : 100;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };
    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
    }
    const successColors = ['#22c55e', '#10b981'];
    const primaryColors = ['#3b82f6', '#6366f1'];
    const warningColors = ['#f59e0b', '#eab308'];
    if (isFullCompletion) {
      fire(0.25, { spread: 26, startVelocity: 55, colors: successColors });
      fire(0.2, { spread: 60, colors: primaryColors });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: warningColors });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ['#ec4899', '#f43f5e'] });
    } else {
      fire(0.25, { spread: 26, startVelocity: 55, colors: successColors });
      fire(0.2, { spread: 60, colors: ['#22c55e', '#16a34a'] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ['#4ade80', '#86efac'] });
    }
  }, []);

  const handleConfirmar = async (transacaoId: string, transacaoDescricao: string, sugestao: MatchSugestaoIA) => {
    const newConfirmed = new Set([...matchesConfirmados, transacaoId]);
    setMatchesConfirmados(newConfirmed);
    await registrarHistorico.mutateAsync({ transacaoId, lancamentoId: sugestao.lancamentoId, tipoLancamento: sugestao.lancamentoTipo, score: sugestao.score, confianca: sugestao.confianca, motivos: sugestao.motivos, analiseIA: sugestao.analiseIA, acao: 'aprovado' });
    await registrarFeedback.mutateAsync({ transacaoId, transacaoDescricao, lancamentoEntidade: sugestao.lancamento?.entidade || '', lancamentoDescricao: sugestao.lancamento?.descricao, tipoLancamento: sugestao.lancamentoTipo, scoreOriginal: sugestao.score, acao: 'aprovado' });
    onConfirmarMatch(transacaoId, sugestao.lancamentoId, sugestao.lancamentoTipo);
    const totalWithSuggestions = estatisticas.comSugestao + matchesConfirmados.size;
    if (newConfirmed.size >= totalWithSuggestions && totalWithSuggestions > 0) triggerConfetti(true);
  };

  const handleRejeitar = (transacaoId: string, transacaoDescricao: string, sugestao: MatchSugestaoIA) => {
    setRejeicaoPendente({ transacaoId, transacaoDescricao, sugestao });
    setMotivoRejeicao('');
  };

  const confirmarRejeicao = async () => {
    if (!rejeicaoPendente) return;
    const { transacaoId, transacaoDescricao, sugestao } = rejeicaoPendente;
    const motivo = motivoRejeicao;

    // Atualização otimista: remove a sugestão e fecha o diálogo imediatamente
    setMatchesRejeitados(prev => new Set([...prev, `${transacaoId}-${sugestao.lancamentoId}`]));
    onRejeitarMatch(transacaoId, sugestao.lancamentoId);
    setRejeicaoPendente(null);
    setMotivoRejeicao('');

    try {
      await registrarHistorico.mutateAsync({ transacaoId, lancamentoId: sugestao.lancamentoId, tipoLancamento: sugestao.lancamentoTipo, score: sugestao.score, confianca: sugestao.confianca, motivos: sugestao.motivos, analiseIA: sugestao.analiseIA, acao: 'rejeitado' });
      await registrarFeedback.mutateAsync({ transacaoId, transacaoDescricao, lancamentoEntidade: sugestao.lancamento?.entidade || '', lancamentoDescricao: sugestao.lancamento?.descricao, tipoLancamento: sugestao.lancamentoTipo, scoreOriginal: sugestao.score, acao: 'rejeitado', motivoRejeicao: motivo || undefined });
      if (motivo.trim()) {
        toast.success('Feedback registrado com sucesso', {
          description: `Motivo salvo no banco — a IA aprenderá com: "${motivo.trim().slice(0, 80)}${motivo.trim().length > 80 ? '...' : ''}"`,
        });
      } else {
        toast.success('Rejeição registrada com sucesso', {
          description: 'Sugestão removida e feedback salvo no banco para refinar a IA.',
        });
      }
    } catch {
      // Reverte a remoção otimista em caso de falha
      setMatchesRejeitados(prev => {
        const next = new Set(prev);
        next.delete(`${transacaoId}-${sugestao.lancamentoId}`);
        return next;
      });
      toast.error('Erro ao registrar rejeição');
    }
  };

  const handleAprovarTodos = async () => {
    const novosConfirmados = new Set(matchesConfirmados);
    matchesAltaConfianca.forEach(m => novosConfirmados.add(m.transacaoId));
    setMatchesConfirmados(novosConfirmados);
    await aprovarEmLote.mutateAsync(matchesAltaConfianca);
    matchesAltaConfianca.forEach(m => onConfirmarMatch(m.transacaoId, m.sugestao.lancamentoId, m.sugestao.lancamentoTipo));
    const totalWithSuggestions = estatisticas.comSugestao + matchesConfirmados.size;
    triggerConfetti(novosConfirmados.size >= totalWithSuggestions && totalWithSuggestions > 0);
    setShowAprovarTodosDialog(false);
  };

  const abrirDetalhes = (transacao: TransacaoOFX, sugestao: MatchSugestaoIA) => {
    setDetalhesDialog({ open: true, transacao, sugestao });
  };

  if (transacoes.length === 0) return null;

  return (
    <>
      <Card className="card-elevated border-accent/30">
        <CardHeader className="pb-3">
          <SugestoesHeaderIA
            matchesAltaConfiancaCount={matchesAltaConfianca.length}
            mutationPending={mutationPending}
            aprovarEmLotePending={aprovarEmLote.isPending}
            onAprovarTodos={() => setShowAprovarTodosDialog(true)}
            onHistorico={() => setShowHistoricoDialog(true)}
            onReanalisar={() => analisarConciliacao(transacoes, lancamentos)}
            isAnalyzing={isAnalyzing}
            estatisticas={estatisticas}
            matchesConfirmadosSize={matchesConfirmados.size}
            lastAnalysis={lastAnalysis}
          />
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
                <p className="text-sm text-muted-foreground">Comparando {transacoes.length} transações com {lancamentos.length} lançamentos</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {transacoesComSugestao.map((transacao) => {
                    const sugestoes = sugestoesValidasFor(transacao.id);
                    const melhorMatch = sugestoes[0];
                    const isExpanded = expandedTransacao === transacao.id;
                    if (!melhorMatch) return null;
                    
                    return (
                      <SugestaoMatchCard
                        key={transacao.id}
                        transacao={transacao}
                        sugestoes={sugestoes}
                        melhorMatch={melhorMatch}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedTransacao(isExpanded ? null : transacao.id)}
                        mutationPending={mutationPending}
                        motivosRejeicaoPorTransacao={motivosRejeicaoPorTransacao}
                        matchesRejeitados={matchesRejeitados}
                        onConfirmar={handleConfirmar}
                        onRejeitar={handleRejeitar}
                        abrirDetalhes={abrirDetalhes}
                        onConciliarManual={onConciliarManual}
                      />
                    );
                  })}
                </AnimatePresence>

                {transacoesComSugestao.length === 0 && matchesIA.size > 0 && (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-3" />
                    <p className="font-medium">Todas as sugestões foram processadas!</p>
                    <p className="text-sm text-muted-foreground">{matchesConfirmados.size} transações conciliadas</p>
                  </div>
                )}

                {matchesIA.size === 0 && !isAnalyzing && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">Nenhuma correspondência encontrada</p>
                    <p className="text-sm text-muted-foreground mb-4">A IA não encontrou matches automáticos</p>
                    <Button variant="outline" size="sm" onClick={() => analisarConciliacao(transacoes, lancamentos)}>
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

      <AprovarTodosDialog
        open={showAprovarTodosDialog}
        onOpenChange={setShowAprovarTodosDialog}
        matches={matchesAltaConfianca}
        onAprovar={handleAprovarTodos}
      />

      <RejeicaoDialog
        rejeicaoPendente={rejeicaoPendente}
        motivoRejeicao={motivoRejeicao}
        onMotivoChange={setMotivoRejeicao}
        onConfirmar={confirmarRejeicao}
        onCancelar={() => { setRejeicaoPendente(null); setMotivoRejeicao(''); }}
        isPending={registrarHistorico.isPending || registrarFeedback.isPending}
      />

      <HistoricoConciliacaoDialog
        open={showHistoricoDialog}
        onOpenChange={setShowHistoricoDialog}
        historico={historico}
        estatisticasHistorico={estatisticasHistorico}
        isLoadingHistorico={isLoadingHistorico}
      />

      <DetalhesExpandidosDialog
        open={detalhesDialog.open}
        onOpenChange={(open) => setDetalhesDialog(prev => ({ ...prev, open }))}
        transacao={detalhesDialog.transacao}
        sugestao={detalhesDialog.sugestao}
      />
    </>
  );
}
