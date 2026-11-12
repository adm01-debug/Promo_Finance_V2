import { motion } from 'framer-motion';
import { BulkActionsBar } from '@/components/ui/bulk-actions-bar';
import { PageHeader } from '@/components/layout/PageHeader';
import { ContaReceberForm } from '@/components/contas-receber/ContaReceberForm';
import { RegistrarRecebimentoDialog } from '@/components/contas-receber/RegistrarRecebimentoDialog';
import { EnviarCobrancaDialog } from '@/components/contas-receber/EnviarCobrancaDialog';
import { AplicarDescontoDialog } from '@/components/contas-receber/AplicarDescontoDialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ContasReceberKPIs } from '@/components/contas-receber/ContasReceberKPIs';
import { formatCurrency } from '@/lib/formatters';
import { BaixaAutomaticaDialog } from '@/components/contas-receber/BaixaAutomaticaDialog';
import { WebhookConfigDialog } from '@/components/contas-receber/WebhookConfigDialog';
import { containerVariants, itemVariants } from './ContasReceber.helpers';
import { ContasReceberConteudoConteudo } from './ContasReceberConteudoConteudo';
import { ContasReceberConteudoConteudo2 } from './ContasReceberConteudoConteudo2';
import { ContasReceberConteudoConteudo3 } from './ContasReceberConteudoConteudo3';

interface ContasReceberConteudoProps {
  headerActions: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/jsx-runtime').JSX.Element;
  kpis: {
    totalReceber: number;
    totalVencido: number;
    totalRecebidoMes: number;
    taxaInadimplencia: number;
    venceHoje: number;
    venceSemana: number;
    totalReceberAnterior: number;
    totalRecebidoMesAnterior: number;
    totalVencidoAnterior: number;
  };
  handleKpiClick: (filter: string) => void;
  filterType: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/ui/quick-date-filters').DateFilterOption;
  handleFilterChange: (
    type: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/ui/quick-date-filters').DateFilterOption,
    range: { start: Date; end: Date } | null
  ) => void;
  searchTerm: string;
  handleSearchChange: (value: string) => void;
  statusFilter: string;
  handleStatusChange: (value: string) => void;
  centroCustoFilter: string;
  handleCentroCustoChange: (value: string) => void;
  centrosCusto: {
    ativo: boolean | null;
    codigo: string | null;
    created_at: string | null;
    descricao: string | null;
    empresa_id: string | null;
    id: string;
    nome: string;
    orcamento_previsto: number | null;
    orcamento_realizado: number | null;
    parent_id: string | null;
    responsavel: string | null;
    tipo: string | null;
    updated_at: string | null;
    user_id: string | null;
  }[];
  empresaFilter: string;
  handleEmpresaChange: (value: string) => void;
  empresas: {
    aliquota_rat: number | null;
    aliquota_terceiros: number | null;
    ativo: boolean;
    bairro: string | null;
    cep: string | null;
    cidade: string | null;
    cnae_principal: string | null;
    cnpj: string | null;
    codigo_fpas: string | null;
    cor_hex: string | null;
    created_at: string;
    email: string | null;
    endereco: string | null;
    estado: string | null;
    id: string;
    inscricao_estadual: string | null;
    is_padrao: boolean;
    logo_url: string | null;
    nome_fantasia: string | null;
    razao_social: string;
    regime_tributario: string | null;
    sigla: string | null;
    telefone: string | null;
    user_id: string;
  }[];
  formaFilter: string;
  handleFormaChange: (value: string) => void;
  contaBancariaFilter: string;
  handleContaBancariaChange: (value: string) => void;
  contasBancarias: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/financial/types').ContaBancariaComRegras[];
  advancedFilters: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/ui/advanced-filters').AdvancedFilters;
  setAdvancedFilters: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/ui/advanced-filters').AdvancedFilters
    >
  >;
  viewMode: 'table' | 'kanban';
  sortedContas: {
    anexo_url: string | null;
    bitrix_deal_id: string | null;
    categoria_id: string | null;
    categoria_nome: string | null;
    centro_custo_id: string | null;
    chave_pix: string | null;
    cliente_id: string | null;
    cliente_nome: string | null;
    conta_bancaria_id: string | null;
    created_at: string | null;
    data_emissao: string | null;
    data_recebimento: string | null;
    data_vencimento: string;
    deleted_at: string | null;
    desconto: number | null;
    descricao: string;
    empresa_id: string | null;
    etapa_cobranca: string | null;
    forma_recebimento: string | null;
    id: string;
    juros: number | null;
    metadata:
      | import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/integrations/supabase/types').Json
      | null;
    multa: number | null;
    numero_documento: string | null;
    numero_parcela_atual: number | null;
    observacoes: string | null;
    parcela_atual: number | null;
    recorrente: boolean | null;
    score: number | null;
    status: string | null;
    tipo_cobranca: string | null;
    total_parcelas: number | null;
    transacao_conciliada_id: string | null;
    updated_at: string | null;
    user_id: string | null;
    valor: number;
    valor_desconto: number | null;
    valor_recebido: number | null;
    vendedor_id: string | null;
    centros_custo: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@supabase/postgrest-js/dist/cjs/select-query-parser/utils').SelectQueryError<'could not find the relation between contas_receber and centro_custo_id'>;
    contas_bancarias: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@supabase/postgrest-js/dist/cjs/select-query-parser/utils').SelectQueryError<'could not find the relation between contas_receber and conta_bancaria_id'>;
    clientes: { razao_social: string; nome_fantasia: string; score: number };
  }[];
  handleViewConta: (
    conta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  isLoading: boolean;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  setCurrentPage: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<number>
  >;
  handlePageSizeChange: (size: number) => void;
  isAllSelected: boolean;
  selectAll: () => void;
  sortKey: string;
  sortDirection: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/ui/sortable-header').SortDirection;
  handleSort: (key: string) => void;
  colCount: number;
  contas: {
    anexo_url: string | null;
    bitrix_deal_id: string | null;
    categoria_id: string | null;
    categoria_nome: string | null;
    centro_custo_id: string | null;
    chave_pix: string | null;
    cliente_id: string | null;
    cliente_nome: string | null;
    conta_bancaria_id: string | null;
    created_at: string | null;
    data_emissao: string | null;
    data_recebimento: string | null;
    data_vencimento: string;
    deleted_at: string | null;
    desconto: number | null;
    descricao: string;
    empresa_id: string | null;
    etapa_cobranca: string | null;
    forma_recebimento: string | null;
    id: string;
    juros: number | null;
    metadata:
      | import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/integrations/supabase/types').Json
      | null;
    multa: number | null;
    numero_documento: string | null;
    numero_parcela_atual: number | null;
    observacoes: string | null;
    parcela_atual: number | null;
    recorrente: boolean | null;
    score: number | null;
    status: string | null;
    tipo_cobranca: string | null;
    total_parcelas: number | null;
    transacao_conciliada_id: string | null;
    updated_at: string | null;
    user_id: string | null;
    valor: number;
    valor_desconto: number | null;
    valor_recebido: number | null;
    vendedor_id: string | null;
    centros_custo: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@supabase/postgrest-js/dist/cjs/select-query-parser/utils').SelectQueryError<'could not find the relation between contas_receber and centro_custo_id'>;
    contas_bancarias: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@supabase/postgrest-js/dist/cjs/select-query-parser/utils').SelectQueryError<'could not find the relation between contas_receber and conta_bancaria_id'>;
    clientes: { razao_social: string; nome_fantasia: string; score: number };
  }[];
  setFormOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  setEditingConta: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<
      import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
    >
  >;
  handleOpenDeleteDialog: (
    conta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
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
  handleAplicarDesconto: (
    conta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  formOpen: boolean;
  editingConta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations;
  selectedConta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations;
  recebimentoDialogOpen: boolean;
  detailConta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations;
  detailDrawerOpen: boolean;
  setDetailDrawerOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  cobrancaConta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations;
  cobrancaDialogOpen: boolean;
  setCobrancaDialogOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  descontoConta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations;
  descontoDialogOpen: boolean;
  setDescontoDialogOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  deletingConta: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations;
  isDeleting: boolean;
  handleDeleteConta: () => Promise<void>;
  baixaDialogOpen: boolean;
  setBaixaDialogOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  webhookDialogOpen: boolean;
  setWebhookDialogOpen: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<boolean>
  >;
  selectedCount: number;
  isProcessing: boolean;
  progress: number;
  bulkActions: (
    | {
        id: string;
        label: string;
        icon: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/jsx-runtime').JSX.Element;
        variant: 'default';
        onClick: () => void;
        confirm?: undefined;
      }
    | {
        id: string;
        label: string;
        icon: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/jsx-runtime').JSX.Element;
        variant: 'destructive';
        onClick: () => void;
        confirm: { title: string; description: string; confirmLabel: string };
      }
  )[];
  clearSelection: () => void;
}

export function ContasReceberConteudo({
  headerActions,
  kpis,
  handleKpiClick,
  filterType,
  handleFilterChange,
  searchTerm,
  handleSearchChange,
  statusFilter,
  handleStatusChange,
  centroCustoFilter,
  handleCentroCustoChange,
  centrosCusto,
  empresaFilter,
  handleEmpresaChange,
  empresas,
  formaFilter,
  handleFormaChange,
  contaBancariaFilter,
  handleContaBancariaChange,
  contasBancarias,
  advancedFilters,
  setAdvancedFilters,
  viewMode,
  sortedContas,
  handleViewConta,
  isLoading,
  pageSize,
  currentPage,
  totalPages,
  totalCount,
  setCurrentPage,
  handlePageSizeChange,
  isAllSelected,
  selectAll,
  sortKey,
  sortDirection,
  handleSort,
  colCount,
  contas,
  setFormOpen,
  isSelected,
  toggleSelect,
  setEditingConta,
  handleOpenDeleteDialog,
  setSelectedConta,
  setRecebimentoDialogOpen,
  handleEnviarCobranca,
  handleAplicarDesconto,
  formOpen,
  editingConta,
  selectedConta,
  recebimentoDialogOpen,
  detailConta,
  detailDrawerOpen,
  setDetailDrawerOpen,
  cobrancaConta,
  cobrancaDialogOpen,
  setCobrancaDialogOpen,
  descontoConta,
  descontoDialogOpen,
  setDescontoDialogOpen,
  deleteDialogOpen,
  setDeleteDialogOpen,
  deletingConta,
  isDeleting,
  handleDeleteConta,
  baixaDialogOpen,
  setBaixaDialogOpen,
  webhookDialogOpen,
  setWebhookDialogOpen,
  selectedCount,
  isProcessing,
  progress,
  bulkActions,
  clearSelection,
}: ContasReceberConteudoProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative z-10 space-y-12 pb-32"
    >
      <PageHeader
        title="Contas a Receber"
        subtitle="Monitore ativos financeiros e maximize a eficiência do capital de giro."
        badge="Receivables Governance"
        showEmpresaSwitcher
        actions={headerActions}
        showUxValidator
      />

      <motion.div variants={itemVariants}>
        <ContasReceberKPIs {...kpis} onKpiClick={handleKpiClick} />
      </motion.div>

      <ContasReceberConteudoConteudo2
        filterType={filterType}
        handleFilterChange={handleFilterChange}
        searchTerm={searchTerm}
        handleSearchChange={handleSearchChange}
        statusFilter={statusFilter}
        handleStatusChange={handleStatusChange}
        centroCustoFilter={centroCustoFilter}
        handleCentroCustoChange={handleCentroCustoChange}
        centrosCusto={centrosCusto}
        empresaFilter={empresaFilter}
        handleEmpresaChange={handleEmpresaChange}
        empresas={empresas}
        formaFilter={formaFilter}
        handleFormaChange={handleFormaChange}
        contaBancariaFilter={contaBancariaFilter}
        handleContaBancariaChange={handleContaBancariaChange}
        contasBancarias={contasBancarias}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
      />

      <ContasReceberConteudoConteudo
        viewMode={viewMode}
        sortedContas={sortedContas}
        handleViewConta={handleViewConta}
        isLoading={isLoading}
        pageSize={pageSize}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        setCurrentPage={setCurrentPage}
        handlePageSizeChange={handlePageSizeChange}
        isAllSelected={isAllSelected}
        selectAll={selectAll}
        sortKey={sortKey}
        sortDirection={sortDirection}
        handleSort={handleSort}
        empresas={empresas}
        colCount={colCount}
        contas={contas}
        setFormOpen={setFormOpen}
        isSelected={isSelected}
        toggleSelect={toggleSelect}
        setEditingConta={setEditingConta}
        handleOpenDeleteDialog={handleOpenDeleteDialog}
        setSelectedConta={setSelectedConta}
        setRecebimentoDialogOpen={setRecebimentoDialogOpen}
        handleEnviarCobranca={handleEnviarCobranca}
        handleAplicarDesconto={handleAplicarDesconto}
      />

      <ContaReceberForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingConta(null);
        }}
        conta={editingConta as unknown as React.ComponentProps<typeof ContaReceberForm>['conta']}
      />
      <RegistrarRecebimentoDialog
        conta={
          selectedConta && {
            ...selectedConta,
            cliente_nome: selectedConta.cliente_nome ?? '',
            status: selectedConta.status ?? '',
          }
        }
        open={recebimentoDialogOpen}
        onOpenChange={setRecebimentoDialogOpen}
      />
      <ContasReceberConteudoConteudo3
        detailConta={detailConta}
        detailDrawerOpen={detailDrawerOpen}
        setDetailDrawerOpen={setDetailDrawerOpen}
        setEditingConta={setEditingConta}
        setFormOpen={setFormOpen}
        setSelectedConta={setSelectedConta}
        setRecebimentoDialogOpen={setRecebimentoDialogOpen}
        handleEnviarCobranca={handleEnviarCobranca}
      />
      <EnviarCobrancaDialog
        conta={
          cobrancaConta && {
            ...cobrancaConta,
            cliente_nome: cobrancaConta.cliente_nome ?? '',
            status: cobrancaConta.status ?? '',
          }
        }
        open={cobrancaDialogOpen}
        onOpenChange={setCobrancaDialogOpen}
      />
      <AplicarDescontoDialog
        conta={
          descontoConta && { ...descontoConta, cliente_nome: descontoConta.cliente_nome ?? '' }
        }
        open={descontoDialogOpen}
        onOpenChange={setDescontoDialogOpen}
      />
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Exclusão Irreversível"
        description={`Confirmar a remoção definitiva do título "${deletingConta?.descricao}" (${deletingConta?.valor ? formatCurrency(deletingConta.valor) : ''}) do repositório?`}
        confirmLabel="Confirmar Exclusão"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConta}
      />
      <BaixaAutomaticaDialog
        open={baixaDialogOpen}
        onOpenChange={setBaixaDialogOpen}
        empresaId={empresaFilter !== 'all' ? empresaFilter : ''}
      />
      <WebhookConfigDialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen} />
      <BulkActionsBar
        selectedCount={selectedCount}
        isProcessing={isProcessing}
        progress={progress}
        actions={bulkActions}
        onClear={clearSelection}
      />
    </motion.div>
  );
}
