import { Building2, Wallet, ArrowRightLeft, Download, Unlink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface OpenFinanceConsent {
  id: string;
  institution_id: string;
  status: string;
  created_at: string;
}

interface Institution {
  id: string;
  name: string;
}

interface OpenFinanceConsentListProps {
  consents: OpenFinanceConsent[];
  institutions?: Institution[];
  loading: boolean;
  revoking: boolean;
  onImport: (consent: OpenFinanceConsent) => void;
  onRevoke: (consentId: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'authorized':
      return <Badge className="bg-success/10 text-success border-success/20">Autorizado</Badge>;
    case 'awaiting_authorization':
      return <Badge className="bg-warning/10 text-warning border-warning/20">Aguardando</Badge>;
    case 'revoked':
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Revogado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function OpenFinanceConsentList({
  consents,
  institutions,
  loading,
  revoking,
  onImport,
  onRevoke,
}: OpenFinanceConsentListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!consents || consents.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma conta conectada</p>
        <p className="text-sm">Clique em "Conectar Banco" para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {consents.map((consent) => {
        const institution = institutions?.find((i) => i.id === consent.institution_id);
        return (
          <div
            key={consent.id}
            className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{institution?.name || consent.institution_id}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(consent.status)}
                  <span className="text-xs text-muted-foreground">
                    Conectado em {new Date(consent.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {consent.status === 'authorized' && (
                <>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Wallet className="h-4 w-4" />
                    Saldos
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ArrowRightLeft className="h-4 w-4" />
                    Extrato
                  </Button>
                  <Button variant="default" size="sm" className="gap-1" onClick={() => onImport(consent)}>
                    <Download className="h-4 w-4" />
                    Importar
                  </Button>
                </>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive gap-1">
                    <Unlink className="h-4 w-4" />
                    Desconectar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revogar Consentimento</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja desconectar esta conta? Você precisará autorizar novamente para
                      acessar os dados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onRevoke(consent.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {revoking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Revogar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
