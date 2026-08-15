import { z } from 'zod';
import type { FrequenciaPagamento } from '@/hooks/usePagamentosRecorrentes';

export const formSchema = z.object({
  descricao: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  fornecedor_nome: z.string().min(2, 'Fornecedor é obrigatório'),
  valor: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dia_vencimento: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'),
  frequencia: z.enum(['semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual']),
  data_inicio: z.date(),
  data_fim: z.date().optional().nullable(),
  empresa_id: z.string().uuid('Selecione uma empresa'),
  centro_custo_id: z.string().optional().nullable(),
  tipo_cobranca: z.string().default('transferencia'),
  observacoes: z.string().optional().nullable(),
});

export type FormValues = z.infer<typeof formSchema>;

export const frequenciaOptions: { value: FrequenciaPagamento; label: string }[] = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quinzenal', label: 'Quinzenal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

export type TipoCobranca = 'boleto' | 'pix' | 'transferencia' | 'cartao' | 'dinheiro';

export const tipoCobrancaOptions: { value: TipoCobranca; label: string }[] = [
  { value: 'boleto', label: 'Boleto' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
];
