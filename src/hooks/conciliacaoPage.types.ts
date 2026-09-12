export interface TransacaoExtrato {
  id: string;
  data: Date;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  conciliada: boolean;
  compensacao_valor?: number;
  compensacao_motivo?: string;
  compensacao_classificacao?: string;
  compensacao_regra?: string;
  compensacao_evidencia_url?: string;
}
