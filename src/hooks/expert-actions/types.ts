import type { Database } from '@/integrations/supabase/types';

export type TipoCobranca = Database['public']['Enums']['tipo_cobranca'];
export type EtapaCobranca = Database['public']['Enums']['etapa_cobranca'];

export type ExpertActionType = 
  | 'criar_alerta'
  | 'gerar_relatorio'
  | 'listar_aprovacoes'
  | 'aprovar_pagamento'
  | 'navegar'
  | 'consultar_saldos'
  | 'criar_conta_pagar'
  | 'criar_conta_receber'
  | 'consultar_cliente'
  | 'consultar_fornecedor'
  | 'analisar_fluxo'
  | 'agendar_cobranca'
  | 'consultar_vencimentos'
  | 'gerar_boleto'
  | 'atualizar_score_cliente';

export interface ExpertAction {
  type: ExpertActionType;
  titulo?: string;
  mensagem?: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  relatorio?: string;
  id?: string;
  pagina?: string;
  valor?: number;
  cliente_nome?: string;
  fornecedor_nome?: string;
  descricao?: string;
  data_vencimento?: string;
  tipo_cobranca?: string;
  periodo?: string;
  novo_score?: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: unknown;
}
