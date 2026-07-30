/**
 * Edge Function `sefaz-manifestar`
 * ================================================================
 * Registra a manifestação do destinatário para uma NFe recebida.
 *
 * Contrato (POST JSON, requer JWT válido):
 *   { chave_acesso: string, tipo: "210200"|"210210"|"210220"|"210240", justificativa?: string }
 *
 * Fluxo:
 *  1. Autentica o usuário via JWT (Supabase).
 *  2. Localiza a NFe e certificado ativo do destinatário (mesmo CNPJ).
 *  3. Monta infEvento, assina (XMLDSig RSA-SHA1) via node-forge.
 *  4. Envia SOAP para NFeRecepcaoEvento4 com mTLS.
 *  5. Persiste via RPC `nfe_apply_manifestacao` (transacional, idempotente).
 *
 * Modo teste: `sefazFetch` injetável (facilita testes sem certificado real).
 */

// deno-lint-ignore-file no-explicit-any
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.49.4";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { validatePayload } from '../_shared/validation.ts';
import { loadCertificado, makeAdminClient, type CertificadoRow } from "../_shared/sefaz/pfx.ts";
import {
  buildEnvEvento,
  buildInfEvento,
  parseRetEnvEvento,
  recepcaoEventoEndpoint,
  RECEPCAO_EVENTO_SOAP_ACTION,
  signEvento,
  tipoToStatus,
  type EventoInput,
  type ManifTipo,
} from "../_shared/sefaz/manifestacao.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const VALID_TIPOS: ReadonlyArray<ManifTipo> = ["210200", "210210", "210220", "210240"];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slog(level: "INFO" | "WARN" | "ERROR", event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    fn: "sefaz-manifestar",
    event,
    ...fields,
  });
  if (level === "ERROR") console.error(line);
  else if (level === "WARN") console.warn(line);
  else console.log(line);
}

export type SefazFetch = (url: string, envelope: string) => Promise<string>;

async function defaultSefazFetch(
  url: string,
  envelope: string,
  certPem: string,
  keyPem: string,
): Promise<string> {
  const client = (Deno as any).createHttpClient({ cert: certPem, key: keyPem });
  try {
    const resp = await fetch(url, {
      method: "POST",
      // @ts-ignore Deno-only
      client,
      headers: {
        "Content-Type": `application/soap+xml; charset=utf-8; action="${RECEPCAO_EVENTO_SOAP_ACTION}"`,
        "SOAPAction": RECEPCAO_EVENTO_SOAP_ACTION,
      },
      body: envelope,
      signal: AbortSignal.timeout(30_000),
    });
    return await resp.text();
  } finally {
    try { client?.close?.(); } catch { /* noop */ }
  }
}

export interface ManifestarArgs {
  chave_acesso: string;
  tipo: ManifTipo;
  justificativa?: string;
}

export interface ManifestarResult {
  ok: boolean;
  cStat: string;
  xMotivo: string;
  nProt: string | null;
  status_novo: string;
  evento_inserido: boolean;
}

export async function executeManifestacao(
  admin: SupabaseClient,
  args: ManifestarArgs,
  sefazFetch?: SefazFetch,
): Promise<ManifestarResult> {
  if (!VALID_TIPOS.includes(args.tipo)) {
    throw new Error(`tipo_invalido: ${args.tipo}`);
  }
  if (args.tipo === "210240" && (!args.justificativa || args.justificativa.trim().length < 15)) {
    throw new Error("justificativa_obrigatoria_min_15");
  }
  if (!/^\d{44}$/.test(args.chave_acesso)) {
    throw new Error("chave_acesso_invalida");
  }

  // 1) Localizar NFe
  const { data: nfe, error: nfeErr } = await admin
    .from("nfe_recebidas")
    .select("id, empresa_id, cnpj_destinatario, ambiente")
    .eq("chave_acesso", args.chave_acesso)
    .maybeSingle();
  if (nfeErr || !nfe) throw new Error("nfe_nao_encontrada");

  // 2) Localizar certificado do destinatário
  const { data: cert, error: certErr } = await admin
    .from("empresas_certificados")
    .select("id, empresa_id, cnpj, razao_social, uf, ambiente, valido_de, valido_ate, pfx_storage_path")
    .eq("cnpj", nfe.cnpj_destinatario)
    .eq("ambiente", nfe.ambiente)
    .eq("ativo", true)
    .gte("valido_ate", new Date().toISOString())
    .maybeSingle();
  if (certErr || !cert) throw new Error("certificado_ativo_ausente");

  const certRow = cert as CertificadoRow;

  // 3) Próximo sequencial (para permitir reciclagem 210240 após 210220 etc.)
  const { data: eventosPrev } = await admin
    .from("nfe_eventos")
    .select("sequencial")
    .eq("chave_acesso", args.chave_acesso)
    .eq("tipo_evento", args.tipo)
    .order("sequencial", { ascending: false })
    .limit(1);
  const sequencial = ((eventosPrev?.[0]?.sequencial as number | undefined) ?? 0) + 1;

  const dataEvento = new Date();

  // 4) Assinar + montar envelope
  const eventoIn: EventoInput = {
    tipo: args.tipo,
    chaveAcesso: args.chave_acesso,
    cnpjAutor: certRow.cnpj,
    ambiente: certRow.ambiente,
    sequencial,
    dataEvento,
    justificativa: args.justificativa,
  };
  const { infEvento, id } = buildInfEvento(eventoIn);

  const pem = sefazFetch
    ? { certPem: "TEST", keyPem: "TEST" }
    : await loadCertificado(admin, certRow);

  const eventoAssinado = sefazFetch
    ? `<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">${infEvento}<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignatureValue>TEST</SignatureValue></Signature></evento>`
    : await signEvento(infEvento, id, pem.certPem, pem.keyPem);

  const idLote = String(Date.now()).slice(-15);
  const envelope = buildEnvEvento(eventoAssinado, idLote);
  const endpoint = recepcaoEventoEndpoint(certRow.ambiente);

  slog("INFO", "manifestar_send", {
    chave: args.chave_acesso, tipo: args.tipo, sequencial,
    cnpj: certRow.cnpj, ambiente: certRow.ambiente,
  });

  const raw = sefazFetch
    ? await sefazFetch(endpoint, envelope)
    : await defaultSefazFetch(endpoint, envelope, pem.certPem, pem.keyPem);

  const ret = parseRetEnvEvento(raw);

  slog(ret.cStatEvento === "135" || ret.cStatEvento === "136" ? "INFO" : "WARN", "manifestar_response", {
    chave: args.chave_acesso, tipo: args.tipo,
    cStat_lote: ret.cStatLote, cStat_evento: ret.cStatEvento,
    xMotivo_evento: ret.xMotivoEvento, nProt: ret.nProt,
  });

  // 5) Persistir via RPC transacional
  const { data: applied, error: applyErr } = await admin.rpc("nfe_apply_manifestacao", {
    p_chave: args.chave_acesso,
    p_tipo_evento: args.tipo,
    p_codigo_evento: args.tipo,
    p_sequencial: sequencial,
    p_data_evento: dataEvento.toISOString(),
    p_protocolo: ret.nProt,
    p_justificativa: args.justificativa ?? null,
    p_status_retorno: ret.cStatEvento,
    p_motivo_retorno: ret.xMotivoEvento,
    p_novo_status: tipoToStatus(args.tipo),
    p_raw: { cStat_lote: ret.cStatLote, xMotivo_lote: ret.xMotivoLote },
  });
  if (applyErr) throw new Error(`apply_manifestacao_failed: ${applyErr.message}`);
  const applyRes = (applied ?? {}) as { status_novo: string; evento_inserido: boolean };

  return {
    ok: ret.cStatEvento === "135" || ret.cStatEvento === "136" || ret.cStatEvento === "155",
    cStat: ret.cStatEvento,
    xMotivo: ret.xMotivoEvento,
    nProt: ret.nProt,
    status_novo: applyRes.status_novo,
    evento_inserido: Boolean(applyRes.evento_inserido),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "missing_jwt" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json(401, { error: "invalid_jwt" });

  let body: ManifestarArgs;
  try {
    const raw = await req.json();
    const ManifSchema = z.object({
      chave_acesso: z.string().length(44),
      tipo: z.enum(['210200','210210','210220','210240']),
      justificativa: z.string().optional(),
    });
    const __c = validatePayload(ManifSchema, raw, 'sefaz-manifestar');
    if (!__c.success) return json(400, { error: __c.error, details: __c.details });
    body = __c.data as ManifestarArgs;
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const admin = makeAdminClient();
  try {
    const result = await executeManifestacao(admin, body);
    return json(200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    slog("ERROR", "manifestar_failed", {
      chave: body?.chave_acesso, tipo: body?.tipo, error: message,
    });
    return json(400, { error: message });
  }
});
