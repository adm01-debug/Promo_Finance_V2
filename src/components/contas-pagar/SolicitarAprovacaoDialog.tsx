import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface ContaParaAprovacao {
  id: string;
  fornecedor_nome: string;
  valor: number;
  data_vencimento: string;
  descricao: string;
  numero_documento?: string;
}

interface SolicitarAprovacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: ContaParaAprovacao | null;
  observacoes: string;
  onObservacoesChange: (value: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function SolicitarAprovacaoDialog({
  open,
  onOpenChange,
  conta,
  observacoes,
  onObservacoesChange,
  onConfirm,
  isLoading,
}: SolicitarAprovacaoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-warning" />
            Solicitar Aprovação
          </DialogTitle>
          <DialogDescription>
            Confirme os detalhes da conta antes de enviar para aprovação.
          </DialogDescription>
        </DialogHeader>
        
        {conta && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{conta.fornecedor_nome}</p>
                </div>
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                  Requer Aprovação
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-semibold text-lg">{formatCurrency(conta.valor)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{formatDate(new Date(conta.data_vencimento))}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm">{conta.descricao}</p>
              </div>
              
              {conta.numero_documento && (
                <div>
                  <p className="text-sm text-muted-foreground">Documento</p>
                  <p className="text-sm">{conta.numero_documento}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações (opcional)</label>
              <Input
                placeholder="Adicione uma justificativa ou observação..."
                value={observacoes}
                onChange={(e) => onObservacoesChange(e.target.value)}
              />
            </div>
          </div>
        )}
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <ShieldAlert className="h-4 w-4" />
                Confirmar Solicitação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
