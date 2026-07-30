/**
 * Zod schemas para validação runtime das views financeiras.
 * Falha de forma segura: em produção descarta linhas inválidas e loga; em dev/test lança.
 */
import { z } from 'zod';
import { logger } from '@/lib/logger';
import type { ContasReceberPainelRow, ContasPagarPainelRow } from './views.types';

const nStr = z.string().nullable().optional().default(null);
const nNum = z.number().nullable().optional().default(null);
const nBool = z.boolean().nullable().optional().default(null);
const nMeta = z.record(z.unknown()).nullable().optional().default(null);

export const contasReceberPainelRowSchema = z
  .object({
    id: nStr,
    descricao: nStr,
    valor: nNum,
    data_vencimento: nStr,
    data_recebimento: nStr,
    status: nStr,
    cliente_id: nStr,
    user_id: nStr,
    created_at: nStr,
    updated_at: nStr,
    empresa_id: nStr,
    categoria_id: nStr,
    centro_custo_id: nStr,
    forma_recebimento: nStr,
    conta_bancaria_id: nStr,
    numero_documento: nStr,
    observacoes: nStr,
    valor_recebido: nNum,
    juros: nNum,
    multa: nNum,
    desconto: nNum,
    recorrente: nBool,
    parcela_atual: nNum,
    total_parcelas: nNum,
    anexo_url: nStr,
    score: nNum,
    metadata: nMeta,
    cliente_nome: nStr,
    etapa_cobranca: nStr,
    tipo_cobranca: nStr,
    numero_parcela_atual: nNum,
    valor_desconto: nNum,
    chave_pix: nStr,
    data_emissao: nStr,
    categoria_nome: nStr,
    cliente_razao_social: nStr,
    cliente_nome_fantasia: nStr,
    cliente_nome_display: nStr,
    centro_custo_nome: nStr,
    conta_bancaria_nome: nStr,
    vendedor_id: nStr,
  })
  .passthrough();

export const contasPagarPainelRowSchema = z
  .object({
    id: nStr,
    descricao: nStr,
    valor: nNum,
    data_vencimento: nStr,
    data_pagamento: nStr,
    status: nStr,
    fornecedor_id: nStr,
    user_id: nStr,
    created_at: nStr,
    updated_at: nStr,
    empresa_id: nStr,
    categoria_id: nStr,
    centro_custo_id: nStr,
    forma_pagamento: nStr,
    conta_bancaria_id: nStr,
    numero_documento: nStr,
    observacoes: nStr,
    valor_pago: nNum,
    juros: nNum,
    multa: nNum,
    desconto: nNum,
    recorrente: nBool,
    parcela_atual: nNum,
    total_parcelas: nNum,
    anexo_url: nStr,
    metadata: nMeta,
    categoria: nStr,
    fornecedor_nome: nStr,
    categoria_nome: nStr,
    centro_resultado: nStr,
    aprovado_por: nStr,
    tipo_cobranca: nStr,
    fornecedor_razao_social: nStr,
    fornecedor_nome_fantasia: nStr,
    fornecedor_nome_display: nStr,
    centro_custo_nome: nStr,
    conta_bancaria_nome: nStr,
  })
  .passthrough();

const STRICT = import.meta.env.DEV || import.meta.env.MODE === 'test';

/**
 * Valida um array de linhas contra o schema informado.
 * - Em produção: descarta linhas inválidas, loga um resumo agregado e segue.
 * - Em dev/test: lança um erro descritivo para forçar correção do contrato.
 */
export function parseRows<T>(
  schema: z.ZodType<T>,
  rows: unknown[],
  view: string,
): T[] {
  const valid: T[] = [];
  const errors: Array<{ index: number; issues: string }> = [];

  for (let i = 0; i < rows.length; i++) {
    const result = schema.safeParse(rows[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({
        index: i,
        issues: result.error.issues
          .map((iss) => `${iss.path.join('.')}: ${iss.message}`)
          .join('; '),
      });
    }
  }

  if (errors.length > 0) {
    const summary = {
      view,
      totalRows: rows.length,
      invalidRows: errors.length,
      firstErrors: errors.slice(0, 3),
    };
    if (STRICT) {
      throw new Error(
        `[views.schemas] Contrato divergente em "${view}": ${errors.length}/${rows.length} linhas inválidas. ` +
          `Primeiras falhas: ${JSON.stringify(summary.firstErrors)}`,
      );
    }
    logger.error('[views.schemas] Linhas inválidas descartadas', summary);
  }

  return valid;
}

export function parseContasReceberRows(rows: unknown[]): ContasReceberPainelRow[] {
  return parseRows(contasReceberPainelRowSchema, rows, 'vw_contas_receber_painel') as ContasReceberPainelRow[];
}

export function parseContasPagarRows(rows: unknown[]): ContasPagarPainelRow[] {
  return parseRows(contasPagarPainelRowSchema, rows, 'vw_contas_pagar_painel') as ContasPagarPainelRow[];
}
