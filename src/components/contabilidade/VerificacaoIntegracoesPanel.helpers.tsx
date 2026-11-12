import { CheckCircle2, AlertTriangle, History, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { StatusConsistencia } from '@/hooks/useVerificacaoIntegracoes';

export const statusBadge = (s: StatusConsistencia) => {
  switch (s) {
    case 'ok':
      return (
        <Badge
          variant="outline"
          className="border-none bg-success/20 text-success font-black text-[10px] gap-1 px-3 py-1 rounded-full"
        >
          <CheckCircle2 className="h-3 w-3" />
          CONCILIADO
        </Badge>
      );
    case 'desbalanceado':
      return (
        <Badge
          variant="outline"
          className="border-none bg-destructive/20 text-destructive font-black text-[10px] gap-1 px-3 py-1 rounded-full"
        >
          <AlertTriangle className="h-3 w-3" />
          DIVERGENTE
        </Badge>
      );
    case 'sem_partidas':
      return (
        <Badge
          variant="outline"
          className="border-none bg-warning/20 text-warning font-black text-[10px] gap-1 px-3 py-1 rounded-full"
        >
          <ShieldAlert className="h-3 w-3" />
          SEM PARTIDAS
        </Badge>
      );
    case 'orfao':
      return (
        <Badge
          variant="outline"
          className="border-none bg-warning/20 text-warning font-black text-[10px] gap-1 px-3 py-1 rounded-full"
        >
          <History className="h-3 w-3" />
          ÓRFÃO
        </Badge>
      );
  }
};
