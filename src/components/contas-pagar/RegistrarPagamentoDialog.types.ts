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
}

export type PagamentoFormData = z.infer<typeof pagamentoSchema>;
