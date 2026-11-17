import { z } from 'zod';

export const contaPagarSchema = z.object({
  fornecedor_id: z.string().optional(),
  fornecedor_nome: z
    .string()
    .min(2, 'Nome do fornecedor é obrigatório')
    .max(200, 'Nome muito longo'),
  descricao: z.string().min(3, 'Descrição é obrigatória').max(500, 'Descrição muito longa'),
  valor: z.number().positive('Valor deve ser maior que zero').max(999999999, 'Valor muito alto'),
  data_vencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  data_emissao: z.string().optional(),
  empresa_id: z.string().min(1, 'Empresa é obrigatória'),
  centro_custo_id: z.string().optional(),
  categoria_id: z.string().optional(),
  conta_bancaria_id: z.string().optional(),
  tipo_cobranca: z.enum([
    'boleto',
    'pix',
    'cartao_credito',
    'cartao_debito',
    'transferencia',
    'dinheiro',
  ]),
  numero_documento: z.string().max(50, 'Número muito longo').optional(),
  codigo_barras: z.string().max(100, 'Código muito longo').optional(),
  observacoes: z.string().max(1000, 'Observações muito longas').optional(),
  recorrente: z.boolean().default(false),
});
