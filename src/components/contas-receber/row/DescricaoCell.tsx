import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import type { ContaReceberWithRelations } from './rowConfig';

export function DescricaoCell({ conta }: { conta: ContaReceberWithRelations }) {
  return (
    <TableCell className="p-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
          <span className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[200px] leading-none">
            {conta.descricao}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {conta.numero_documento && (
            <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0 rounded-md border-white/5 bg-card/5 text-muted-foreground/60 tracking-wider">
              DOC: {conta.numero_documento}
            </Badge>
          )}
          {conta.numero_parcela_atual && conta.total_parcelas && (
            <Badge variant="outline" className="text-[9px] font-black uppercase px-1.5 py-0 rounded-md border-primary/20 bg-primary/5 text-primary tracking-wider">
              {conta.numero_parcela_atual}/{conta.total_parcelas}
            </Badge>
          )}
        </div>
      </div>
    </TableCell>
  );
}
