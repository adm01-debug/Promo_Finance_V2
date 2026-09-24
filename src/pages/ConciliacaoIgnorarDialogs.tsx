import { ConfirmDialog } from '@/components/ui/confirm-dialog';

/**
 * Confirmações da ação destrutiva "Ignorar Transação" (individual e em
 * lote) da tela de Conciliação — extraídas de Conciliacao.tsx para manter
 * esse arquivo sob o limite de tamanho do projeto (max-lines). Ver E-022.
 */
export function ConciliacaoIgnorarDialogs({
  ignorarDialogOpen,
  setIgnorarDialogOpen,
  isIgnorando,
  confirmarIgnorar,
  bulkIgnorarDialogOpen,
  setBulkIgnorarDialogOpen,
  isBulkIgnorando,
  confirmarBulkIgnorar,
  selectedCount,
}: {
  ignorarDialogOpen: boolean;
  setIgnorarDialogOpen: (open: boolean) => void;
  isIgnorando: boolean;
  confirmarIgnorar: () => void | Promise<void>;
  bulkIgnorarDialogOpen: boolean;
  setBulkIgnorarDialogOpen: (open: boolean) => void;
  isBulkIgnorando: boolean;
  confirmarBulkIgnorar: () => void | Promise<void>;
  selectedCount: number;
}) {
  return (
    <>
      <ConfirmDialog
        open={ignorarDialogOpen}
        onOpenChange={setIgnorarDialogOpen}
        title="Ignorar transação"
        description="A transação será marcada como conciliada (ignorada) e sairá da fila de pendentes. Esta ação pode ser desfeita depois em Estornar."
        confirmLabel="Ignorar transação"
        variant="danger"
        isLoading={isIgnorando}
        onConfirm={confirmarIgnorar}
      />
      <ConfirmDialog
        open={bulkIgnorarDialogOpen}
        onOpenChange={setBulkIgnorarDialogOpen}
        title={`Ignorar ${selectedCount} transações`}
        description={`${selectedCount} transações selecionadas serão marcadas como ignoradas e sairão da fila de pendentes. Esta ação pode ser desfeita individualmente depois em Estornar.`}
        confirmLabel="Ignorar selecionadas"
        variant="danger"
        isLoading={isBulkIgnorando}
        onConfirm={confirmarBulkIgnorar}
      />
    </>
  );
}
