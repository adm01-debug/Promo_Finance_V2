export interface ContaPagarView {
  id: string;
  status: string | null;
  tipo_cobranca: string | null;
  data_vencimento: string;
  descricao: string;
  fornecedor_nome: string | null;
  categoria: string | null;
  numero_documento: string | null;
  valor: number;
  recorrente: boolean | null;
  centro_custo_nome?: string | null;
  centros_custo?: { nome?: string | null } | null;
  aprovado_por: string | null;
  aprovado_em?: string | null;
}

export interface SolicitacaoAprovacaoHistorico {
  id: string;
  status: string;
  solicitado_em: string | null;
  solicitado_por: string | null;
  aprovado_em?: string | null;
  aprovado_por?: string | null;
  motivo_rejeicao?: string | null;
  observacoes?: string | null;
}

export interface ProfileMapItem {
  id: string;
  full_name: string | null;
  email: string | null;
}

export interface ContasPagarTableRowProps {
  conta: ContaPagarView;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: (data?: ContaPagarView) => void;
  onDelete: () => void;
  onRegistrarPagamento: () => void;
  onSolicitarAprovacao: () => void;
  estaAprovado: boolean;
  temSolicitacaoPendente: boolean;
  foiRejeitado: boolean;
  aguardandoSolicitacao: boolean;
  historico: SolicitacaoAprovacaoHistorico[];
  profilesMap: Map<string, ProfileMapItem>;
  valorMinimoAprovacao: number;
  getRowAnimation: (index: number) => Record<string, unknown>;
  isVirtual?: boolean;
}
