import { ContaReceberDetailDrawer } from '@/components/contas-receber/ContaReceberDetailDrawer';

interface ContasReceberConteudoConteudo3Props {
  detailConta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations;
  detailDrawerOpen: boolean;
  setDetailDrawerOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  setEditingConta: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
    >
  >;
  setFormOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  setSelectedConta: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
    >
  >;
  setRecebimentoDialogOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  handleEnviarCobranca: (
    conta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
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
