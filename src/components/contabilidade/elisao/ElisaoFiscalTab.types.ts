export type SimulacaoElisao = { id: string; ano_base: number; updated_at: string; nome: string };

export type AuditoriaLogElisao = {
  id: string;
  nota_fiscal_id: string;
  created_at: string;
  ncm?: string;
  elisao_regras_creditos?: { tipo_credito?: string } | null;
  metodologia_applied?: string;
  valor_credito_calculado: number;
  status_validacao?: string;
};

export type TarefaElisao = {
  id: string;
  status?: string;
  tipo_oportunidade?: string;
  prazo: string;
  titulo?: string;
  descricao?: string;
  checklist?: Array<{ done?: boolean }>;
  valor_envolvido?: number;
};

export interface ElisaoTabProps {
  empresaId: string;
}
