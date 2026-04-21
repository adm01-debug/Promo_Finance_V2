import { ThumbsDown, ArrowRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MatchSugestaoIA } from '@/hooks/useConciliacaoIA';
import { ScoreBadgeIA } from './ScoreBadgeIA';

interface RejeicaoPendente {
  transacaoId: string;
  transacaoDescricao: string;
  sugestao: MatchSugestaoIA;
}

interface RejeicaoDialogProps {
  rejeicaoPendente: RejeicaoPendente | null;
  motivoRejeicao: string;
  onMotivoChange: (motivo: string) => void;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function RejeicaoDialog({ rejeicaoPendente, motivoRejeicao, onMotivoChange, onConfirmar, onCancelar }: RejeicaoDialogProps) {
  return (
    <Dialog open={!!rejeicaoPendente} onOpenChange={() => onCancelar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ThumbsDown className="h-5 w-5 text-destructive" />
            Rejeitar sugestão
          </DialogTitle>
          <DialogDescription>
            Ajude a melhorar a IA informando o motivo da rejeição (opcional)
          </DialogDescription>
        </DialogHeader>
        
        {rejeicaoPendente && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm font-medium">{rejeicaoPendente.transacaoDescricao}</p>
              <div className="flex items-center gap-2 mt-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {rejeicaoPendente.sugestao.lancamento?.entidade}
                </span>
                <ScoreBadgeIA 
                  score={rejeicaoPendente.sugestao.score} 
                  confianca={rejeicaoPendente.sugestao.confianca}
                  size="sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da rejeição (opcional)</label>
              <Textarea
                placeholder="Ex: O valor está errado, não é o mesmo cliente, etc..."
                value={motivoRejeicao}
                onChange={(e) => onMotivoChange(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Este feedback ajudará a IA a fazer melhores sugestões no futuro.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirmar}>
            <ThumbsDown className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type { RejeicaoPendente };
