import { motion } from 'framer-motion';
import { Building2, CheckCircle2, XCircle, Loader2, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Institution {
  id: string;
  name: string;
  logo?: string | null;
  status: string;
}

interface OpenFinanceConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutions: Institution[] | undefined;
  loading: boolean;
  creating: boolean;
  onConnect: (institutionId: string) => void;
}

export function OpenFinanceConnectDialog({
  open,
  onOpenChange,
  institutions,
  loading,
  creating,
  onConnect,
}: OpenFinanceConnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar Instituição Financeira</DialogTitle>
          <DialogDescription>
            Selecione o banco que deseja conectar via Open Finance
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              institutions?.map((institution) => (
                <motion.button
                  key={institution.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onConnect(institution.id)}
                  disabled={creating}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-left"
                >
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {institution.logo ? (
                      <img
                        src={institution.logo}
                        alt={institution.name}
                        className="h-8 w-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{institution.name}</span>
                    <p className="text-xs text-muted-foreground">
                      {institution.status === 'active' ? 'Disponível' : 'Indisponível'}
                    </p>
                  </div>
                  {institution.status === 'active' ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </motion.button>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t">
          <Shield className="h-4 w-4" />
          Conexão segura via Open Finance Brasil. Seus dados são protegidos.
        </div>
      </DialogContent>
    </Dialog>
  );
}
