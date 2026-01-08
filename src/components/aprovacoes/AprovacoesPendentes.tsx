import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, AlertCircle, User, Calendar, DollarSign, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSolicitacoesPendentes, useAprovarSolicitacao, useRejeitarSolicitacao, SolicitacaoAprovacao } from '@/hooks/useAprovacoes';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { EmptyState } from '@/components/ui/micro-interactions';
import { useCelebrations } from '@/components/wrappers/CelebrationActions';

export const AprovacoesPendentes = () => {
  const { data: solicitacoes, isLoading } = useSolicitacoesPendentes();
  const aprovarMutation = useAprovarSolicitacao();
  const rejeitarMutation = useRejeitarSolicitacao();
  const { celebrateApproval, warning } = useCelebrations();
  
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; solicitacao: SolicitacaoAprovacao | null }>({
    open: false,
    solicitacao: null,
  });
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  const handleAprovar = (solicitacaoId: string, descricao?: string) => {
    aprovarMutation.mutate(solicitacaoId, {
      onSuccess: () => {
        celebrateApproval(descricao);
      },
    });
  };

  const handleRejeitar = () => {
    if (!rejectDialog.solicitacao || !motivoRejeicao.trim()) return;
    
    rejeitarMutation.mutate({
      solicitacaoId: rejectDialog.solicitacao.id,
      motivo: motivoRejeicao,
    }, {
      onSuccess: () => {
        setRejectDialog({ open: false, solicitacao: null });
        setMotivoRejeicao('');
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!solicitacoes?.length) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <EmptyState
            icon={<Check className="h-8 w-8 text-success" />}
            title="Nenhuma aprovação pendente"
            description="Todos os pagamentos estão em dia"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                Aprovações Pendentes
              </CardTitle>
              <CardDescription>
                {solicitacoes.length} pagamento{solicitacoes.length !== 1 ? 's' : ''} aguardando aprovação
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {solicitacoes.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {solicitacoes.map((solicitacao, index) => (
                <motion.div
                  key={solicitacao.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-border/50 rounded-lg p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="h-5 w-5 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">
                            {solicitacao.conta_pagar?.descricao || 'Pagamento'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {solicitacao.conta_pagar?.fornecedor_nome}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-primary">
                            {formatCurrency(solicitacao.conta_pagar?.valor || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {solicitacao.conta_pagar?.data_vencimento 
                              ? formatDate(solicitacao.conta_pagar.data_vencimento)
                              : '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {solicitacao.solicitante?.full_name || solicitacao.solicitante?.email || 'Usuário'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {formatDateTime(solicitacao.solicitado_em)}
                          </span>
                        </div>
                      </div>

                      {solicitacao.observacoes && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-muted/50 rounded text-sm">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{solicitacao.observacoes}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 lg:flex-col">
                      <Button
                        onClick={() => handleAprovar(solicitacao.id, solicitacao.conta_pagar?.descricao)}
                        disabled={aprovarMutation.isPending}
                        className="flex-1 gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setRejectDialog({ open: true, solicitacao })}
                        disabled={rejeitarMutation.isPending}
                        className="flex-1 gap-2 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Rejeição */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => {
        if (!open) {
          setRejectDialog({ open: false, solicitacao: null });
          setMotivoRejeicao('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <X className="h-5 w-5 text-destructive" />
              Rejeitar Pagamento
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do pagamento de{' '}
              <strong>{formatCurrency(rejectDialog.solicitacao?.conta_pagar?.valor || 0)}</strong>{' '}
              para <strong>{rejectDialog.solicitacao?.conta_pagar?.fornecedor_nome}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo da Rejeição *</Label>
              <Textarea
                id="motivo"
                placeholder="Descreva o motivo da rejeição..."
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, solicitacao: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejeitar}
              disabled={!motivoRejeicao.trim() || rejeitarMutation.isPending}
            >
              {rejeitarMutation.isPending ? 'Rejeitando...' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
