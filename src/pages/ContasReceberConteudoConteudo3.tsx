import { ContaReceberDetailDrawer } from '@/components/contas-receber/ContaReceberDetailDrawer';

interface ContasReceberConteudoConteudo3Props {
  detailConta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations;
  detailDrawerOpen: boolean;
  setDetailDrawerOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setEditingConta: import('react').Dispatch<
    import('react').SetStateAction<
      import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
    >
  >;
  setFormOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setSelectedConta: import('react').Dispatch<
    import('react').SetStateAction<
      import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
    >
  >;
  setRecebimentoDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  handleEnviarCobranca: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
}

export function ContasReceberConteudoConteudo3({
  detailConta,
  detailDrawerOpen,
  setDetailDrawerOpen,
  setEditingConta,
  setFormOpen,
  setSelectedConta,
  setRecebimentoDialogOpen,
  handleEnviarCobranca,
}: ContasReceberConteudoConteudo3Props) {
  return (
    <ContaReceberDetailDrawer
      conta={detailConta}
      open={detailDrawerOpen}
      onOpenChange={setDetailDrawerOpen}
      onEdit={(c) => {
        setEditingConta(c);
        setFormOpen(true);
      }}
      onRegistrarRecebimento={(c) => {
        setSelectedConta(c);
        setRecebimentoDialogOpen(true);
      }}
      onEnviarCobranca={handleEnviarCobranca}
    />
  );
}
