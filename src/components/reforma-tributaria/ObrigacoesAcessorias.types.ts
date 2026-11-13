export type StatusObrigacao =
  | 'pendente'
  | 'em_andamento'
  | 'transmitida'
  | 'atrasada'
  | 'nao_aplicavel';

export interface ObrigacaoStatus {
  codigo: string;
  nome: string;
  esfera: string;
  competencia: string;
  vencimento: Date;
  status: StatusObrigacao;
  diasRestantes: number;
  transmitidaEm?: Date;
  protocolo?: string;
}
