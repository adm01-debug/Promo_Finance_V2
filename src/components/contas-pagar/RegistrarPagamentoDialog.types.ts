import { z } from 'zod';
import { pagamentoSchema } from './RegistrarPagamentoDialog.helpers';

export interface ContaPagar {
  id: string;
  fornecedor_nome: string;
  descricao: string;
  valor: number;
  valor_pago: number | null;
  data_vencimento: string;
  status: string;
  aprovado_por?: string | null;
  aprovado_em?: string | null;
}

export interface RegistrarPagamentoDialogProps {
  conta: ContaPagar | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Empresa cuja alcada vale para este pagamento. Sem ela, a consulta devolve a
   * MENOR faixa entre todas as empresas acessiveis, e um titulo dispensado pela
   * alcada da propria empresa era bloqueado aqui -- divergindo da lista, que ja
   * filtra por empresa.
   */
  empresaId?: string;
}

export type PagamentoFormData = z.infer<typeof pagamentoSchema>;
