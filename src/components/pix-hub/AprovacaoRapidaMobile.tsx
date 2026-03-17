import { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { Check, X, ChevronLeft, ChevronRight, AlertCircle, Clock, Building2 } from 'lucide-react';
import { useSolicitacoesPendentes, useAprovarSolicitacao, useRejeitarSolicitacao, SolicitacaoAprovacao } from '@/hooks/useAprovacoes';
import { useCelebrations } from '@/components/wrappers/CelebrationActions';

const SWIPE_THRESHOLD = 100;

export function AprovacaoRapidaMobile() {
  const { data: solicitacoes = [], isLoading } = useSolicitacoesPendentes();
  const aprovarMutation = useAprovarSolicitacao();
  const rejeitarMutation = useRejeitarSolicitacao();
  const { celebrateApproval } = useCelebrations();

  const [rejectDialog, setRejectDialog] = useState<SolicitacaoAprovacao | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [swipeDirection, setSwipeDirection] = useState<Record<string, number>>({});

  const pendentes = solicitacoes.filter(s => !processedIds.has(s.id));

  const handleAprovar = useCallback((sol: SolicitacaoAprovacao) => {
    setProcessedIds(prev => new Set(prev).add(sol.id));
    aprovarMutation.mutate(sol.id, {
      onSuccess: () => celebrateApproval(sol.conta_pagar?.descricao),
    });
  }, [aprovarMutation, celebrateApproval]);

  const handleRejeitar = () => {
    if (!rejectDialog || !motivoRejeicao.trim()) return;
    const solId = rejectDialog.id;
    rejeitarMutation.mutate({ solicitacaoId: solId, motivo: motivoRejeicao }, {
      onSuccess: () => {
        setProcessedIds(prev => new Set(prev).add(solId));
        setRejectDialog(null);
        setMotivoRejeicao('');
      },
    });
  };

  const handleDragEnd = useCallback((sol: SolicitacaoAprovacao, _: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      handleAprovar(sol);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      setRejectDialog(sol);
    }
    setSwipeDirection(prev => ({ ...prev, [sol.id]: 0 }));
  }, [handleAprovar]);

  const handleDrag = useCallback((solId: string, _: any, info: PanInfo) => {
    setSwipeDirection(prev => ({ ...prev, [solId]: info.offset.x }));
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{pendentes.length} pendente(s)</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-emerald-600" /> Deslize → Aprovar
          </span>
          <span className="flex items-center gap-1">
            <ChevronLeft className="h-3 w-3 text-destructive" /> ← Rejeitar
          </span>
        </div>
      </div>

      {pendentes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Check className="h-10 w-10 mx-auto mb-3 text-emerald-500 opacity-50" />
            <p className="text-sm font-medium">Todas as aprovações em dia!</p>
            <p className="text-xs mt-1">Não há pagamentos pendentes de aprovação</p>
          </CardContent>
        </Card>
      ) : (
        <AnimatePresence mode="popLayout">
          {pendentes.map((sol) => {
            const offsetX = swipeDirection[sol.id] || 0;
            const isApproving = offsetX > SWIPE_THRESHOLD * 0.5;
            const isRejecting = offsetX < -SWIPE_THRESHOLD * 0.5;

            return (
              <motion.div
                key={sol.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: offsetX > 0 ? 300 : -300, transition: { duration: 0.3 } }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDrag={(_, info) => handleDrag(sol.id, _, info)}
                onDragEnd={(_, info) => handleDragEnd(sol, _, info)}
                className="cursor-grab active:cursor-grabbing touch-pan-y"
              >
                <Card className={cn(
                  'relative overflow-hidden transition-colors',
                  isApproving && 'border-emerald-500/50 bg-emerald-500/5',
                  isRejecting && 'border-destructive/50 bg-destructive/5',
                )}>
                  {/* Swipe indicators */}
                  <div className={cn('absolute inset-y-0 left-0 w-16 flex items-center justify-center transition-opacity',
                    isRejecting ? 'opacity-100' : 'opacity-0')}>
                    <X className="h-6 w-6 text-destructive" />
                  </div>
                  <div className={cn('absolute inset-y-0 right-0 w-16 flex items-center justify-center transition-opacity',
                    isApproving ? 'opacity-100' : 'opacity-0')}>
                    <Check className="h-6 w-6 text-emerald-600" />
                  </div>

                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{sol.conta_pagar?.descricao || 'Pagamento'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {sol.conta_pagar?.fornecedor_nome || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            Venc: {sol.conta_pagar?.data_vencimento ? formatDate(sol.conta_pagar.data_vencimento) : 'N/A'}
                          </Badge>
                          {sol.solicitante && (
                            <Badge variant="secondary" className="text-[10px]">
                              Por: {sol.solicitante.full_name || sol.solicitante.email}
                            </Badge>
                          )}
                        </div>
                        {sol.observacoes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">"{sol.observacoes}"</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold tabular-nums text-foreground">
                          {formatCurrency(sol.conta_pagar?.valor || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons (for non-touch devices) */}
                    <div className="flex gap-2 mt-3 md:flex">
                      <Button size="sm" variant="outline" className="flex-1 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setRejectDialog(sol)}>
                        <X className="h-3.5 w-3.5" /> Rejeitar
                      </Button>
                      <Button size="sm" className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleAprovar(sol)} disabled={aprovarMutation.isPending}>
                        <Check className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={v => !v && setRejectDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Rejeitar Pagamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium">{rejectDialog?.conta_pagar?.descricao}</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(rejectDialog?.conta_pagar?.valor || 0)}</p>
            </div>
            <Textarea
              placeholder="Motivo da rejeição (obrigatório)"
              value={motivoRejeicao}
              onChange={e => setMotivoRejeicao(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setMotivoRejeicao(''); }}>Cancelar</Button>
            <Button variant="destructive" onClick={handleRejeitar} disabled={!motivoRejeicao.trim() || rejeitarMutation.isPending}>
              {rejeitarMutation.isPending ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
