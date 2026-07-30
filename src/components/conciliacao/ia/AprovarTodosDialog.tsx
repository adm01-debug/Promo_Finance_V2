import { CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MatchSugestaoIA } from '@/hooks/useConciliacaoIA';

interface MatchAltaConfianca {
  transacaoId: string;
  transacaoDescricao: string;
  sugestao: MatchSugestaoIA;
}

interface AprovarTodosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: MatchAltaConfianca[];
  onAprovar: () => void;
}

export function AprovarTodosDialog({ open, onOpenChange, matches, onAprovar }: AprovarTodosDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <CheckCheck className="h-5 w-5 text-success" />
            Aprovar todas de alta confiança?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a aprovar <strong>{matches.length}</strong> conciliações 
            com score ≥80%. Esta ação conciliará automaticamente as transações selecionadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="max-h-[200px] overflow-auto space-y-2 my-4">
          {matches.slice(0, 5).map(m => (
            <div key={m.transacaoId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
              <span className="truncate flex-1">{m.transacaoDescricao}</span>
              <Badge variant="outline" className="ml-2">{m.sugestao.score}%</Badge>
            </div>
          ))}
          {matches.length > 5 && (
            <p className="text-sm text-muted-foreground text-center">
              + {matches.length - 5} outros...
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onAprovar}
            className="bg-success hover:bg-success/90"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Aprovar {matches.length}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type { MatchAltaConfianca };
