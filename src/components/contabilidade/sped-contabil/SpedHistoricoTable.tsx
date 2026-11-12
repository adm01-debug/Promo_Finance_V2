import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody } from '@/components/ui/table';
import type { Props } from './SpedHistoricoTable.types';
import { SpedHistoricoTableConteudo } from './SpedHistoricoTableConteudo';
import { SpedHistoricoRow } from './SpedHistoricoRow';

export function SpedHistoricoTable({
  isLoading,
  historicoFiltrado,
  expandedAudit,
  onToggleAudit,
  onCopyHash,
  onOpenValidacoes,
  onOpenTransmissao,
  onClearFilters,
}: Props) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }
  if (historicoFiltrado.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="inline-flex p-4 rounded-full bg-card/5 text-muted-foreground/30">
          <Filter className="h-8 w-8" />
        </div>
        <p className="text-muted-foreground font-medium">
          Nenhum registro encontrado para os filtros aplicados.
        </p>
        <Button variant="link" onClick={onClearFilters}>
          Limpar todos os filtros
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/5 overflow-hidden bg-black/20 shadow-inner">
      <div className="overflow-x-auto custom-scrollbar">
        <Table>
          <SpedHistoricoTableConteudo />
          <TableBody>
            {historicoFiltrado.map((h) => (
              <SpedHistoricoRow
                key={h.id}
                h={h}
                expandedAudit={expandedAudit}
                onToggleAudit={onToggleAudit}
                onCopyHash={onCopyHash}
                onOpenValidacoes={onOpenValidacoes}
                onOpenTransmissao={onOpenTransmissao}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
