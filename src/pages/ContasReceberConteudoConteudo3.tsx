import { ContaReceberDetailDrawer } from '@/components/contas-receber/ContaReceberDetailDrawer';

import type { Dispatch, SetStateAction } from 'react';
import type { ContaReceberWithRelations } from '@/components/contas-receber/row/rowConfig';
interface ContasReceberConteudoConteudo3Props {
  detailConta: ContaReceberWithRelations | null;
  detailDrawerOpen: boolean;
  setDetailDrawerOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setEditingConta: Dispatch<SetStateAction<ContaReceberWithRelations | null>>;
  setFormOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  setSelectedConta: Dispatch<SetStateAction<ContaReceberWithRelations | null>>;
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
