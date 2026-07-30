import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/formatters';

interface PagamentoApprovalAlertProps {
  estaAprovado: boolean;
  temSolicitacaoPendente: boolean;
  solicitacaoRejeitada: boolean;
  motivoRejeicao?: string | null;
  valorMinimoAprovacao?: number;
}

export function PagamentoApprovalAlert({
  estaAprovado,
  temSolicitacaoPendente,
  solicitacaoRejeitada,
  motivoRejeicao,
  valorMinimoAprovacao,
}: PagamentoApprovalAlertProps) {
  if (estaAprovado) {
    return (
      <Alert className="border-success/50 bg-success/10">
        <ShieldCheck className="h-4 w-4 text-success" />
        <AlertTitle className="text-success">Pagamento Aprovado</AlertTitle>
        <AlertDescription>Este pagamento foi aprovado e pode ser efetuado.</AlertDescription>
      </Alert>
    );
  }

  if (temSolicitacaoPendente) {
    return (
      <Alert className="border-warning/50 bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertTitle className="text-warning">Aguardando Aprovação</AlertTitle>
        <AlertDescription>
          Uma solicitação de aprovação foi enviada e está pendente de análise.
        </AlertDescription>
      </Alert>
    );
  }

  if (solicitacaoRejeitada) {
    return (
      <Alert variant="error">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Aprovação Rejeitada</AlertTitle>
        <AlertDescription>
          A solicitação anterior foi rejeitada: {motivoRejeicao || 'Sem motivo informado'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="error">
      <ShieldAlert className="h-4 w-4" />
      <AlertTitle>Aprovação Necessária</AlertTitle>
      <AlertDescription>
        Pagamentos acima de {formatCurrency(valorMinimoAprovacao || 0)} requerem aprovação prévia.
      </AlertDescription>
    </Alert>
  );
}
