import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createLogger, LogLevel } from "./logger.ts";

/**
 * Default CORS headers used by edge functions.
 *
 * `Access-Control-Allow-Origin` is taken from the `ALLOWED_ORIGINS` env var
 * (comma-separated list), falling back to '*' only when not set. For
 * authenticated endpoints, configure ALLOWED_ORIGINS so credentials can't
 * be sent from arbitrary origins. Webhooks from third parties (Asaas,
 * Bling, Bitrix) should keep the wildcard — they're authenticated by
 * shared-secret tokens, not by Origin.
 *
 * Pass the request to `buildCorsHeaders(req)` to echo back the matched
 * allowed origin (required when Allow-Credentials is true).
 */
const RAW_ALLOWED = (globalThis as { Deno?: { env: { get(k: string): string | undefined } } })
  .Deno?.env.get('ALLOWED_ORIGINS') ?? '';
const ALLOWED_ORIGIN_LIST = RAW_ALLOWED
  ? RAW_ALLOWED.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN_LIST.length === 1 ? ALLOWED_ORIGIN_LIST[0] : '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, asaas-access-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-platform-runtime, x-supabase-client-platform-runtime-version',
};

export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  if (!origin || ALLOWED_ORIGIN_LIST.length === 0) return corsHeaders;
  if (ALLOWED_ORIGIN_LIST.includes('*') || ALLOWED_ORIGIN_LIST.includes(origin)) {
    return { ...corsHeaders, 'Access-Control-Allow-Origin': origin };
  }
  return { ...corsHeaders, 'Access-Control-Allow-Origin': ALLOWED_ORIGIN_LIST[0] };
}

const logger = createLogger("Validation");

export function validatePayload<T>(schema: z.ZodSchema<T>, payload: unknown, functionName = "unknown"): { success: true; data: T } | { success: false; error: string; details: any } {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  logger.warn(`Contract Violation in ${functionName}`, {
    errors: result.error.errors,
    payload_preview: typeof payload === 'object' ? JSON.stringify(payload).slice(0, 500) : payload
  });

  return {
    success: false,
    error: "Invalid payload schema (Contract Violation)",
    details: result.error.format(),
  };
}

export function createErrorResponse(message: string, status = 400, details?: any) {
  return new Response(
    JSON.stringify({
      error: message,
      details,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}


/**
 * Deduplica webhooks baseados em ID do provedor para evitar processamento duplo.
 */
export async function isWebhookProcessed(
  supabase: ReturnType<typeof createClient>,
  tableName: string,
  providerIdColumn: string,
  providerId: string,
  provider: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(tableName)
    .select("id")
    .eq(providerIdColumn, providerId)
    .eq("processed", true)
    .limit(1);

  if (error) {
    console.warn(`[webhook-dedup] Falha ao verificar idempotência para ${provider}:`, error);
    return false;
  }
  
  return !!(data && data.length > 0);
}

// Schemas

export const WebhookIdempotencySchema = z.object({
  id: z.string().optional(),
  provider: z.string().optional(),
  processed: z.boolean().default(false),
  error_message: z.string().optional().nullable(),
});

export const AsaasWebhookSchema = z.object({

  event: z.string(),
  payment: z.object({
    id: z.string(),
    status: z.string().optional(),
  }).optional(),
  transfer: z.object({
    id: z.string(),
    status: z.string().optional(),
    transactionReceiptUrl: z.string().optional(),
  }).optional(),
  id: z.string().optional(),
}).strict();

export const BlingWebhookSchema = z.object({
  event: z.string(),
  module: z.string().optional(),
  data: z.record(z.any()),
  retries: z.number().optional()
}).strict();

export const Bitrix24WebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    FIELDS: z.record(z.any())
  }),
  ts: z.string().optional(),
  auth: z.object({
    domain: z.string().optional(),
    client_endpoint: z.string().optional(),
    server_endpoint: z.string().optional(),
    member_id: z.string().optional(),
    application_token: z.string().optional(),
  }).optional()
}).strict();

export const AsaasProxySchema = z.object({
  action: z.string(),
  data: z.record(z.any()).optional()
}).strict();

export const BlingProxySchema = z.object({
  action: z.string(),
}).passthrough();


export const AnalyzeDocumentSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  fileContent: z.string(), // base64
}).strict();

export const WhatsappWebhookSchema = z.object({
  event: z.string(),
  messageId: z.string().optional(),
  status: z.string().optional(),
  from: z.string(),
  text: z.string().optional(),
}).strict();

export const CnpjaLookupSchema = z.object({
  cnpj: z.string().min(14),
}).strict();

export const EnviarAlertaEmailSchema = z.object({
  tipo: z.enum(['vencimento', 'inadimplencia', 'aprovacao', 'ruptura', 'asaas_failure']),
  destinatario: z.string().email(),
  dados: z.object({
    titulo: z.string(),
    mensagem: z.string(),
    valor: z.number().optional(),
    dataVencimento: z.string().optional(),
    urlAcao: z.string().optional(),
  }),
}).strict();

export const OptionalEmpresaIdSchema = z.object({
  empresa_id: z.string().uuid().optional().nullable(),
}).strict();

export const BenchmarkingSetorialSchema = z.object({
  metricas: z.record(z.any()),
  setor: z.string().optional(),
}).strict();

export const Bitrix24SyncSchema = z.object({
  action: z.enum([
    "sync_deals", 
    "sync_deals_all",
    "sync_contacts", 
    "sync_companies", 
    "export_payment_status", 
    "test_connection", 
    "refresh_token", 
    "sync_elisao_task", 
    "sync_boleto"
  ]),
  params: z.record(z.any()).optional(),
}).strict();

export const ContabilizarEventoSchema = z.object({
  empresa_id: z.string().uuid(),
  tipo_evento: z.enum(['conta_pagar', 'conta_receber', 'movimentacao']),
  evento_id: z.string().uuid(),
  valor: z.number().positive(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descricao: z.string().optional(),
  categoria_id: z.string().uuid().optional().nullable(),
  dry_run: z.boolean().optional(),
  ignore_rules: z.boolean().optional(),
}).strict();

export const ExecutarRelatoriosSchema = z.object({
  relatorio_id: z.string().uuid().optional().nullable(),
}).strict();

export const WhatsappIaProativoSchema = z.object({
  action: z.enum(['analisar-alertas', 'enviar-mensagem', 'gerar-resposta-ia']),
  data: z.record(z.any()).optional(),
}).strict();

export const ExpertAgentSchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })),
  context: z.string().optional().nullable(),
  conversationSummary: z.string().optional().nullable(),
}).strict();

export const CalculoIvaSchema = z.object({
  faturamentoAnual: z.number(),
  ano: z.number().optional(),
  setor: z.string().optional(),
}).strict();

export const CategorizarDespesaSchema = z.object({
  despesas: z.array(z.object({
    id: z.string().optional(),
    descricao: z.string(),
    valor: z.number(),
    fornecedor_nome: z.string().optional(),
    data_vencimento: z.string().optional(),
  })),
}).strict();
