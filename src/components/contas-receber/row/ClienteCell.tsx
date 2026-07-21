import { Building2, Gavel } from 'lucide-react';
import { TableCell } from '@/components/ui/table';
import type { ContaReceberWithRelations } from './rowConfig';

export function ClienteCell({ conta }: { conta: ContaReceberWithRelations }) {
  return (
    <TableCell className="p-6">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-card/[0.03] border border-white/10 flex items-center justify-center relative shadow-2xl transition-all group-hover:scale-110 duration-700 group-hover:rotate-3 group-hover:border-primary/30">
          <Building2 className="h-7 w-7 text-primary/40 group-hover:text-primary transition-colors" />
          {conta.has_protesto && (
            <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive flex items-center justify-center shadow-lg ring-2 ring-background">
              <Gavel className="h-3 w-3 text-foreground" />
            </div>
          )}
        </div>
        <div>
          <p className="font-black text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
            {conta.cliente_nome}
          </p>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/20 mt-1">
            {conta.clientes?.nome_fantasia || '-'}
          </p>
        </div>
      </div>
    </TableCell>
  );
}
