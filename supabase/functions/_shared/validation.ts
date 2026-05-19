import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-platform-runtime, x-supabase-client-platform-runtime-version',
};

export function validatePayload<T>(schema: z.ZodSchema<T>, payload: unknown): { success: true; data: T } | { success: false; error: string; details: any } {
  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: "Invalid payload schema",
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

// Schemas
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
});

export const BlingWebhookSchema = z.object({
  event: z.string().optional(),
  module: z.string().optional(),
  data: z.record(z.any()).optional(),
  retries: z.number().optional()
});

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
});

export const AsaasProxySchema = z.object({
  action: z.string(),
  data: z.record(z.any()).optional()
});

export const AnalyzeDocumentSchema = z.object({
  documentUrl: z.string().url().optional(),
  base64: z.string().optional(),
  fileType: z.string().optional(),
  empresaId: z.string().uuid().optional()
});
