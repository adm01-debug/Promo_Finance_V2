import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Clock, AlertCircle, User, Calendar, DollarSign, 
  FileText, MessageSquare, Send, ShieldCheck, Info 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  useSolicitacoesPendentes, 
  useAprovarSolicitacao, 
  useRejeitarSolicitacao, 
  useComentariosAprovacao,
  useAdicionarComentario,
  SolicitacaoAprovacao 
} from '@/hooks/useAprovacoes';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import { EmptyState } from '@/components/ui/micro-interactions';
import { useCelebrations } from '@/components/wrappers/CelebrationActions';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { ScrollArea } from '@/components/ui/scroll-area';

export const AprovacoesPendentes = () => {
  const { data: solicitacoes, isLoading } = useSolicitacoesPendentes();
  const aprovarMutation = useAprovarSolicitacao();
  const rejeitarMutation = useRejeitarSolicitacao();
  const addComentarioMutation = useAdicionarComentario();
  const { celebrateApproval } = useCelebrations();
  
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; solicitacao: SolicitacaoAprovacao | null }>({
    open: false,
    solicitacao: null,
  });
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; solicitacao: SolicitacaoAprovacao | null }>({
    open: false,
    solicitacao: null,
  });
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [novoComentario, setNovoComentario] = useState('');

  const { data: comentarios } = useComentariosAprovacao(detailsDialog.solicitacao?.id || '');

  const handleAprovar = (solicitacaoId: string, descricao?: string) => {
    aprovarMutation.mutate(solicitacaoId, {
      onSuccess: () => {
        celebrateApproval(descricao);
        if (detailsDialog.open) setDetailsDialog({ open: false, solicitacao: null });
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
        if (detailsDialog.open) setDetailsDialog({ open: false, solicitacao: null });
      },
    });
  };

  const handleAddComentario = () => {
    if (!detailsDialog.solicitacao || !novoComentario.trim()) return;
    addComentarioMutation.mutate({
      solicitacaoId: detailsDialog.solicitacao.id,
      texto: novoComentario,
    }, {
      onSuccess: () => setNovoComentario(''),
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
      <Card className="border-border/50 shadow-md">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Clock className="h-5 w-5 text-warning animate-pulse" />
                Painel de Aprovações Elite
              </CardTitle>
              <CardDescription>
                {solicitacoes.length} solicitações aguardando sua governança
              </CardDescription>
            </div>
            <Badge variant="warning" className="text-lg px-4 py-1.5 shadow-sm">
              {solicitacoes.length} PENDENTES
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {solicitacoes.map((solicitacao, index) => (
                <motion.div
                  key={solicitacao.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group border border-border/50 rounded-xl p-5 hover:bg-muted/20 hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Gradiente sutil lateral */}
                  <div className="absolute left-0 top-0 h-full w-1 bg-warning/40 group-hover:bg-warning group-hover:w-1.5 transition-all" />

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                          <AlertCircle className="h-6 w-6 text-warning" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-bold text-lg leading-none">
                              {solicitacao.conta_pagar?.descricao || 'Pagamento'}
                            </h4>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              ID: {solicitacao.id.split('-')[0]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {solicitacao.conta_pagar?.fornecedor_nome}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-background/50 p-3 rounded-lg border border-border/30">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Valor</p>
                          <div className="flex items-center gap-1.5 text-primary font-bold">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(solicitacao.conta_pagar?.valor || 0)}
                          </div>
                        </div>
                        <div className="space-y-1 border-l pl-4 border-border/30">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Vencimento</p>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {solicitacao.conta_pagar?.data_vencimento 
                                ? formatDate(solicitacao.conta_pagar.data_vencimento)
                                : '-'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 border-l pl-4 border-border/30">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Solicitante</p>
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm truncate">
                              {solicitacao.solicitante?.full_name || solicitacao.solicitante?.email || 'Usuário'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1 border-l pl-4 border-border/30">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Aguardando há</p>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatDateTime(solicitacao.solicitado_em)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 lg:flex-col shrink-0 lg:w-40">
                      <Button
                        onClick={() => setDetailsDialog({ open: true, solicitacao })}
                        variant="secondary"
                        className="flex-1 gap-2 border border-border/50 hover:bg-muted"
                      >
                        <Info className="h-4 w-4" />
                        Detalhes
                      </Button>
                      <Button
                        onClick={() => handleAprovar(solicitacao.id, solicitacao.conta_pagar?.descricao)}
                        disabled={aprovarMutation.isPending}
                        className="flex-1 gap-2 bg-success hover:bg-success/90"
                      >
                        <Check className="h-4 w-4" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes e Workflow */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => {
        if (!open) setDetailsDialog({ open: false, solicitacao: null });
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Governança de Aprovação
            </DialogTitle>
            <DialogDescription>
              Análise completa do fluxo de aprovação para este desembolso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {/* Visualizador de Workflow */}
            <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
              <h5 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Progresso do Workflow</h5>
              <WorkflowVisualizer 
                steps={[
                  { id: '1', nome: 'Solicitação', status: 'completo', aprovador: detailsDialog.solicitacao?.solicitante?.full_name || 'Usuário' },
                  { id: '2', nome: 'Gestor Direto', status: 'atual' },
                  { id: '3', nome: 'Diretoria Financeira', status: 'pendente' },
                  { id: '4', nome: 'Finalizado', status: 'pendente' },
                ]}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Informações Gerais */}
              <div className="space-y-4">
                <h5 className="font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Dados do Título
                </h5>
                <div className="space-y-3 p-4 rounded-lg border bg-background/50">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Descrição:</span>
                    <span className="text-sm font-bold">{detailsDialog.solicitacao?.conta_pagar?.descricao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Fornecedor:</span>
                    <span className="text-sm font-bold">{detailsDialog.solicitacao?.conta_pagar?.fornecedor_nome}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Valor Total:</span>
                    <span className="text-lg font-black text-primary">{formatCurrency(detailsDialog.solicitacao?.conta_pagar?.valor || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Discussão / Comentários */}
              <div className="space-y-4 flex flex-col h-[300px]">
                <h5 className="font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Trilha de Auditoria & Chat
                </h5>
                <ScrollArea className="flex-1 p-3 rounded-lg border bg-muted/10">
                  <div className="space-y-4">
                    {comentarios?.length ? comentarios.map((coment) => (
                      <div key={coment.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase">{coment.usuario?.full_name || coment.usuario?.email}</span>
                          <span className="text-[10px] text-muted-foreground">{formatDateTime(coment.created_at)}</span>
                        </div>
                        <p className="text-xs bg-background p-2 rounded border border-border/30">
                          {coment.texto}
                        </p>
                      </div>
                    )) : (
                      <p className="text-center text-xs text-muted-foreground py-10 italic">Nenhum comentário registrado</p>
                    )}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Adicionar nota..." 
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    className="text-xs h-9"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComentario()}
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddComentario}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: true, solicitacao: detailsDialog.solicitacao })}
              className="text-destructive hover:bg-destructive hover:text-white"
            >
              Rejeitar Título
            </Button>
            <Button
              onClick={() => handleAprovar(detailsDialog.solicitacao?.id || '', detailsDialog.solicitacao?.conta_pagar?.descricao)}
              disabled={aprovarMutation.isPending}
              className="bg-success hover:bg-success/90"
            >
              Confirmar Aprovação (Hash SHA-256)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
