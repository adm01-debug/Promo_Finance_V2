import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  KeyRound, 
  Check, 
  X, 
  Clock, 
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface PasswordResetRequest {
  id: string;
  user_email: string;
  status: string;
  motivo_rejeicao: string | null;
  solicitado_em: string;
  aprovado_por: string | null;
  aprovado_em: string | null;
}

export function PasswordResetApprovals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['password-reset-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('password_reset_requests')
        .select('*')
        .eq('status', 'pendente')
        .order('solicitado_em', { ascending: false });

      if (error) throw error;
      return data as PasswordResetRequest[];
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (request: PasswordResetRequest) => {
      // 1. Atualizar status para aprovado
      const { error: updateError } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'aprovado',
          aprovado_por: user?.id,
          aprovado_em: new Date().toISOString()
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      // 2. Enviar email de reset via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        request.user_email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (resetError) throw resetError;
    },
    onSuccess: () => {
      toast.success('Reset de senha aprovado! Email enviado ao usuário.');
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
    },
    onError: (error: unknown) => {
      logger.error('Erro ao aprovar reset de senha:', error);
      toast.error('Erro ao aprovar reset de senha');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ request, reason }: { request: PasswordResetRequest; reason: string }) => {
      const { error } = await supabase
        .from('password_reset_requests')
        .update({
          status: 'rejeitado',
          motivo_rejeicao: reason,
          aprovado_por: user?.id,
          aprovado_em: new Date().toISOString()
        })
        .eq('id', request.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Solicitação rejeitada');
      queryClient.invalidateQueries({ queryKey: ['password-reset-requests'] });
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedRequest(null);
    },
    onError: (error: unknown) => {
      logger.error('Erro ao rejeitar solicitação:', error);
      toast.error('Erro ao rejeitar solicitação');
    }
  });

  const handleReject = (request: PasswordResetRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (!selectedRequest || !rejectReason.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    rejectMutation.mutate({ request: selectedRequest, reason: rejectReason });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Reset de Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Solicitações de Reset de Senha
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {requests.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{request.user_email}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitado em {format(new Date(request.solicitado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(request)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Aprovar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Rejeição */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Rejeitar Solicitação
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Informe o motivo da rejeição para o email <strong>{selectedRequest?.user_email}</strong>
            </p>
            <Input
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
