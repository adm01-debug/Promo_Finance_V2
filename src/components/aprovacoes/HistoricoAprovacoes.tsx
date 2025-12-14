import { motion } from 'framer-motion';
import { Check, X, Clock, History, User, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSolicitacoesAprovacao, SolicitacaoAprovacao } from '@/hooks/useAprovacoes';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';

const getStatusConfig = (status: SolicitacaoAprovacao['status']) => {
  switch (status) {
    case 'aprovado':
      return { label: 'Aprovado', icon: Check, color: 'bg-success/10 text-success border-success/30' };
    case 'rejeitado':
      return { label: 'Rejeitado', icon: X, color: 'bg-destructive/10 text-destructive border-destructive/30' };
    default:
      return { label: 'Pendente', icon: Clock, color: 'bg-warning/10 text-warning border-warning/30' };
  }
};

export const HistoricoAprovacoes = () => {
  const { data: solicitacoes, isLoading } = useSolicitacoesAprovacao();

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

  const historico = solicitacoes?.filter(s => s.status !== 'pendente') || [];

  if (!historico.length) {
    return (
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <History className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Nenhum histórico</h3>
            <p className="text-muted-foreground text-sm mt-1">
              As aprovações e rejeições aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Histórico de Aprovações
        </CardTitle>
        <CardDescription>
          Últimas decisões de aprovação de pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {historico.slice(0, 20).map((solicitacao, index) => {
            const statusConfig = getStatusConfig(solicitacao.status);
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={solicitacao.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${statusConfig.color.split(' ')[0]}`}>
                  <StatusIcon className={`h-5 w-5 ${statusConfig.color.split(' ')[1]}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {solicitacao.conta_pagar?.descricao || 'Pagamento'}
                    </span>
                    <Badge variant="outline" className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatCurrency(solicitacao.conta_pagar?.valor || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {solicitacao.aprovador?.full_name || solicitacao.aprovador?.email || 'Sistema'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {solicitacao.aprovado_em ? formatDateTime(solicitacao.aprovado_em) : '-'}
                    </span>
                  </div>
                  {solicitacao.motivo_rejeicao && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-xs text-destructive mt-1 truncate cursor-help">
                          Motivo: {solicitacao.motivo_rejeicao}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{solicitacao.motivo_rejeicao}</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
