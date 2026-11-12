import type { HistoricoRow } from './types';

export interface Props {
  isLoading: boolean;
  historicoFiltrado: HistoricoRow[];
  expandedAudit: Set<string>;
  onToggleAudit: (id: string) => void;
  onCopyHash: (hash: string | null) => void;
  onOpenValidacoes: (h: HistoricoRow) => void;
  onOpenTransmissao: (h: HistoricoRow) => void;
  onClearFilters: () => void;
}
