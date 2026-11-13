import { z } from 'zod';
import { contaPagarSchema } from './ContaPagarForm.helpers';

export type ContaPagarFormData = z.infer<typeof contaPagarSchema>;

export interface ContaPagar {
  id: string;
  fornecedor_id: string | null;
  fornecedor_nome: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_emissao: string;
  empresa_id: string;
  centro_custo_id: string | null;
  categoria_id: string | null;
  conta_bancaria_id: string | null;
  tipo_cobranca: 'boleto' | 'pix' | 'cartao' | 'transferencia' | 'dinheiro';
  numero_documento: string | null;
  codigo_barras: string | null;
  observacoes: string | null;
  recorrente: boolean;
  updated_at: string;
}

export interface ContaPagarFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta?: ContaPagar | null;
}
