import type { Dispatch, SetStateAction } from 'react';
import type { ContaReceberWithRelations } from '@/components/contas-receber/row/rowConfig';
export interface ContasReceberConteudoProps {
  headerActions: import('react/jsx-runtime').JSX.Element;
  kpis: {
    totalReceber: number;
    totalVencido: number;
    totalRecebidoMes: number;
    taxaInadimplencia: number;
    venceHoje: number;
    venceSemana: number;
    // number | undefined: sem fonte real do período anterior o cálculo devolve
    // undefined, e ContasReceberKPIs esconde o selo de variação (calcVariation
    // :35 retorna null). Antes vinha um número fabricado a partir do atual.
    totalReceberAnterior: number | undefined;
    totalRecebidoMesAnterior: number;
    totalVencidoAnterior: number | undefined;
  };
  handleKpiClick: (filter: string) => void;
  filterType: import('@/components/ui/quick-date-filters').DateFilterOption;
  handleFilterChange: (
    type: import('@/components/ui/quick-date-filters').DateFilterOption,
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
  contasBancarias: import('@/hooks/financial/types').ContaBancariaComRegras[];
  advancedFilters: import('@/components/ui/advanced-filters').AdvancedFilters;
  setAdvancedFilters: import('react').Dispatch<
    import('react').SetStateAction<import('@/components/ui/advanced-filters').AdvancedFilters>
  >;
  viewMode: 'table' | 'kanban';
  sortedContas: ReturnType<
    typeof import('@/hooks/useContasReceberLogic').useContasReceberLogic
  >['sortedContas'];
  handleViewConta: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  isLoading: boolean;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  setCurrentPage: import('react').Dispatch<import('react').SetStateAction<number>>;
  handlePageSizeChange: (size: number) => void;
  isAllSelected: boolean;
  selectAll: () => void;
  sortKey: string | null;
  sortDirection: import('@/components/ui/sortable-header').SortDirection;
  handleSort: (key: string) => void;
  colCount: number;
  contas: ReturnType<
    typeof import('@/hooks/useContasReceberLogic').useContasReceberLogic
  >['contas'];
  setFormOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  setEditingConta: Dispatch<SetStateAction<ContaReceberWithRelations | null>>;
  handleOpenDeleteDialog: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  setSelectedConta: Dispatch<SetStateAction<ContaReceberWithRelations | null>>;
  setRecebimentoDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  handleEnviarCobranca: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  handleAplicarDesconto: (
    conta: import('@/components/contas-receber/ContasReceberTableRow').ContaReceberWithRelations
  ) => void;
  formOpen: boolean;
  editingConta: ContaReceberWithRelations | null;
  selectedConta: ContaReceberWithRelations | null;
  recebimentoDialogOpen: boolean;
  detailConta: ContaReceberWithRelations | null;
  detailDrawerOpen: boolean;
  setDetailDrawerOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  cobrancaConta: ContaReceberWithRelations | null;
  cobrancaDialogOpen: boolean;
  setCobrancaDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  descontoConta: ContaReceberWithRelations | null;
  descontoDialogOpen: boolean;
  setDescontoDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  deletingConta: ContaReceberWithRelations | null;
  isDeleting: boolean;
  handleDeleteConta: () => Promise<void>;
  baixaDialogOpen: boolean;
  setBaixaDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  webhookDialogOpen: boolean;
  setWebhookDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
  selectedCount: number;
  isProcessing: boolean;
  progress: number;
  bulkActions: (
    | {
        id: string;
        label: string;
        icon: import('react/jsx-runtime').JSX.Element;
        variant: 'default';
        onClick: () => void;
        confirm?: undefined;
      }
    | {
        id: string;
        label: string;
        icon: import('react/jsx-runtime').JSX.Element;
        variant: 'destructive';
        onClick: () => void;
        confirm: { title: string; description: string; confirmLabel: string };
      }
  )[];
  clearSelection: () => void;
}
