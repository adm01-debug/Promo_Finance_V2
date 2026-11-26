/**
 * Schemas Zod da análise de crédito da 1ª venda (Champions -> Finance -> Champions).
 * Separados de `_shared/validation.ts` para não tocar o arquivo compartilhado;
 * as funções continuam validando com `validatePayload` de lá.
 */
import { z } from '../zod.ts';

const uuid = z.string().uuid();

const CreditoClienteSchema = z
  .object({
    id: z.string().optional().nullable(),
    nome: z.string().max(200).optional().nullable(),
    empresa: z.string().max(200).optional().nullable(),
    email: z.string().max(200).optional().nullable(),
    telefone: z.string().max(40).optional().nullable(),
    cnpj: z.string().max(20).optional().nullable(),
  })
  .passthrough();

export const CreditoSolicitacaoSchema = z
  .object({
    event: z.literal('credito.solicitado'),
    correlation_key: z.string().min(1).max(128),
    payload: z
      .object({
        pedido_id: z.string().min(1).max(64),
        pedido_numero: z.string().max(64).optional().nullable(),
        valor_total: z.union([z.number(), z.string()]).optional().nullable(),
        cliente: CreditoClienteSchema,
        vendedor_email: z.string().max(200).optional().nullable(),
        origem: z.string().max(40).optional().nullable(),
        solicitado_em: z.string().optional().nullable(),
      })
      .passthrough(),
  })
  .strict();

export const CreditoAnaliseSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('listar'),
      status: z.enum(['pendente', 'em_analise', 'aprovado', 'reprovado', 'todos']).optional(),
      limite: z.number().int().min(1).max(200).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal('decidir'),
      analise_id: uuid,
      decisao: z.enum(['aprovado', 'reprovado']),
      limite_aprovado: z.number().nonnegative().optional().nullable(),
      parcelas_max: z.number().int().positive().max(60).optional().nullable(),
      parecer: z.string().max(2000).optional().nullable(),
    })
    .strict(),
  z
    .object({
      action: z.literal('atualizar_dados'),
      analise_id: uuid,
      cnpj: z.string().max(20).optional().nullable(),
      escavador: z.string().max(4000).optional().nullable(),
      consulta_financeira: z.string().max(4000).optional().nullable(),
    })
    .strict(),
  z
    .object({
      action: z.literal('reenviar_callback'),
      analise_id: uuid,
    })
    .strict(),
]);
