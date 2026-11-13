import { z } from 'zod';

export const formSchema = z.object({
  cliente_nome: z.string().min(2, 'Nome do cliente é obrigatório'),
  cliente_email: z.string().email().optional().or(z.literal('')),
  cliente_telefone: z.string().optional(),
  valor_original: z.number().positive('Valor deve ser maior que zero'),
  desconto_percentual: z.number().min(0).max(100).default(0),
  juros_percentual: z.number().min(0).max(100).default(0),
  numero_parcelas: z.number().min(1).max(60),
  data_primeiro_vencimento: z.date(),
  dia_vencimento: z.number().min(1).max(31),
  observacoes: z.string().optional(),
});
