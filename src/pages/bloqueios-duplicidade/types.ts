export interface BloqueioRow {
  id: string;
  created_at: string;
  tabela: string;
  motivo_bloqueio: string;
  valor_bloqueado: number | null;
  match_type: string | null;
  campos_conflitantes: unknown;
  dados_tentativa: {
    fornecedor_nome?: string;
    cnpj_fornecedor?: string;
    numero_documento?: string;
    idempotency_key?: string;
    mes_vencimento?: string;
    [k: string]: unknown;
  } | null;
  perfil?: { display_name?: string; avatar_url?: string } | null;
  usuario_id?: string | null;
  empresa_id?: string | null;
}

export interface BloqueiosFilters {
  fornecedor: string;
  documento: string;
  valor: string;
  periodo: string;
  empresa_id: string;
  competencia: string;
}

export const emptyFilters: BloqueiosFilters = {
  fornecedor: "",
  documento: "",
  valor: "",
  periodo: "all",
  empresa_id: "all",
  competencia: "",
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
