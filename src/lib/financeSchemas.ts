import { z } from 'zod';

export const lancamentoSchema = z.object({
  descricao: z.string().min(1),
  tipo: z.enum(['receita', 'despesa', 'transferencia']),
  categoria_id: z.string().uuid().optional(),
  conta_id: z.string().uuid().optional(),
  valor: z.coerce.number().positive(),
  data_vencimento: z.string(),
  data_pagamento: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'atrasado', 'cancelado']).default('pendente'),
  centro_custo: z.string().optional(),
  fornecedor_cliente: z.string().optional(),
  documento: z.string().optional(),
  recorrente: z.coerce.boolean().default(false),
});

export const contaBancariaSchema = z.object({
  nome: z.string().min(1),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  numero: z.string().optional(),
  tipo: z.enum(['corrente', 'poupanca', 'investimento', 'caixa']),
  saldo_inicial: z.coerce.number().default(0),
  ativa: z.coerce.boolean().default(true),
});

export const financeImportTemplates = {
  lancamentos: [
    { key: 'descricao', label: 'Descrição', example: 'Pagamento fornecedor' },
    { key: 'tipo', label: 'Tipo', example: 'despesa' },
    { key: 'valor', label: 'Valor', example: '1500.00' },
    { key: 'data_vencimento', label: 'Vencimento', example: '2024-01-20' },
    { key: 'status', label: 'Status', example: 'pendente' },
  ],
};

export const financeFilterConfigs = {
  lancamentos: [
    { key: 'tipo', label: 'Tipo', type: 'select' as const, options: [
      { value: 'receita', label: 'Receita' },
      { value: 'despesa', label: 'Despesa' },
      { value: 'transferencia', label: 'Transferência' },
    ]},
    { key: 'status', label: 'Status', type: 'select' as const, options: [
      { value: 'pendente', label: 'Pendente' },
      { value: 'pago', label: 'Pago' },
      { value: 'atrasado', label: 'Atrasado' },
    ]},
    { key: 'data_vencimento', label: 'Vencimento', type: 'dateRange' as const },
  ],
};
