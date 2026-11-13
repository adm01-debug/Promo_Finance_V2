import { z } from 'zod';
import { DollarSign, Wallet } from 'lucide-react';

export const pagamentoSchema = z.object({
  valor_pago: z.number().positive('Valor deve ser maior que zero'),
  data_pagamento: z.string().min(1, 'Data é obrigatória'),
  conta_bancaria_id: z.string().optional(),
  observacoes: z.string().max(500, 'Observações muito longas').optional(),
});

export const tiposPagamento = [
  { value: 'total', label: 'Pagamento Total', icon: DollarSign },
  { value: 'parcial', label: 'Pagamento Parcial', icon: Wallet },
];
