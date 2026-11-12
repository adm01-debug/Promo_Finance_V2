import { Link2, Unlink } from 'lucide-react';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';

interface ConciliacaoBulkActionsBarProps {
  selectedIds: Set<string>;
  handleBulkConciliar: () => void;
  handleBulkIgnorar: () => void;
  setSelectedIds: import('react').Dispatch<import('react').SetStateAction<Set<string>>>;
}

export function ConciliacaoBulkActionsBar({
  selectedIds,
  handleBulkConciliar,
  handleBulkIgnorar,
  setSelectedIds,
}: ConciliacaoBulkActionsBarProps) {
  return (
    <BulkActionsBar
      selectedCount={selectedIds.size}
      actions={[
        {
          id: 'conciliar',
          label: 'Conciliar Selecionadas',
          icon: <Link2 className="h-4 w-4" />,
          onClick: handleBulkConciliar,
        },
        {
          id: 'ignorar',
          label: 'Ignorar Selecionadas',
          icon: <Unlink className="h-4 w-4" />,
          variant: 'destructive',
          onClick: handleBulkIgnorar,
        },
      ]}
      onClear={() => setSelectedIds(new Set())}
    />
  );
}
