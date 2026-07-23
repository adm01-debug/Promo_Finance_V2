/**
 * Edge Function `sefaz-dfe-puxar`
 * ================================================================
 * Consome o webservice NFeDistribuicaoDFe (SEFAZ AN) via mTLS,
 * processa lotes de eventos DFe e persiste em `nfe_recebidas` /
 * `nfe_eventos`, avançando o cursor de NSU por CNPJ+ambiente.
 *
 * Segurança:
 *   - `verify_jwt = false`; autenticação por header `x-cron-secret`
 *     comparado a `SEFAZ_CRON_SECRET`.
 *   - Cursor avança apenas via RPC `sefaz_cursor_advance`, que impede
 *     regressão de NSU no banco (defesa em profundidade).
 *
 * Limites:
 *   - Máximo 10 lotes por execução por CNPJ (≈500 docs) para respeitar
 *     o timeout de 150s da edge function.
 */

// deno-lint-ignore-file no-explicit-any
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform",
};

import { loadCertificado, makeAdminClient, type CertificadoRow } from "../_shared/sefaz/pfx.ts";
import { distDFeEndpoint } from "../_shared/sefaz/endpoints.ts";
import {
  buildDistDFeEnvelope,
  classifyCStat,
  parseDistDFeResponse,
  SOAP_ACTION,
  type DistDFeResponse,
} from "../_shared/sefaz/soap.ts";
import { gunzipBase64 } from "../_shared/sefaz/gunzip.ts";
import { parseDoc, type ParsedDoc } from "../_shared/sefaz/parser.ts";
import { buildXmlPath, uploadNfeXml } from "../_shared/nfe/xml-storage.ts";

const MAX_BATCHES_PER_CNPJ = 10;

interface PullSummary {
  cnpj: string;
  ambiente: "homologacao" | "producao";
  batches: number;
  docs: number;
  novos: number;
  eventos: number;
  cursorAntes: number;
  cursorDepois: number;
  cStatFinal: string;
  erro: string | null;
  durationMs: number;
}

// ------------------------------------------------------- helpers
function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchCertificados(
  admin: SupabaseClient,
  empresaId?: string,
): Promise<CertificadoRow[]> {
  let query = admin.from("empresas_certificados")
    .select("id, empresa_id, cnpj, razao_social, uf, ambiente, valido_de, valido_ate, pfx_storage_path")
    .eq("ativo", true)
    .gte("valido_ate", new Date().toISOString());
  if (empresaId) query = query.eq("empresa_id", empresaId);
  const { data, error } = await query;
  if (error) throw new Error(`fetch_certificados_failed: ${error.message}`);
  return (data ?? []) as CertificadoRow[];
}

async function getCursor(
  admin: SupabaseClient,
  cnpj: string,
  ambiente: "homologacao" | "producao",
): Promise<number> {
  const { data } = await admin.from("sefaz_dfe_cursor")
    .select("ultimo_nsu, circuit_open, next_run_at")
    .eq("cnpj", cnpj).eq("ambiente", ambiente).maybeSingle();
  if (data?.circuit_open) throw new Error("circuit_open");
  if (data?.next_run_at && new Date(data.next_run_at) > new Date()) {
    throw new Error("backoff_pending");
  }
  return Number(data?.ultimo_nsu ?? 0);
}

async function advanceCursor(
  admin: SupabaseClient,
  cnpj: string,
  ambiente: "homologacao" | "producao",
  novoNsu: number,
  maxNsu: number,
  status: string,
  erro: string | null,
) {
  await admin.rpc("sefaz_cursor_advance", {
    p_cnpj: cnpj,
    p_ambiente: ambiente,
    p_novo_nsu: novoNsu,
    p_max_nsu: maxNsu,
    p_status: status,
    p_erro: erro,
  });
}

// Chamada SEFAZ com mTLS. Isolada para permitir stub em teste.
export type SefazFetch = (url: string, envelope: string) => Promise<string>;

async function defaultSefazFetch(
  url: string,
  envelope: string,
  certPem: string,
  keyPem: string,
): Promise<string> {
  // Deno.createHttpClient com cert + key
  const client = (Deno as any).createHttpClient({ cert: certPem, key: keyPem });
  try {
    const resp = await fetch(url, {
      method: "POST",
      // @ts-ignore Deno-only
      client,
      headers: {
        "Content-Type": `application/soap+xml; charset=utf-8; action="${SOAP_ACTION}"`,
        "SOAPAction": SOAP_ACTION,
      },
      body: envelope,
      signal: AbortSignal.timeout(30_000),
    });
    return await resp.text();
  } finally {
    try { client?.close?.(); } catch { /* noop */ }
  }
}

async function processarDoc(
  admin: SupabaseClient,
  empresaId: string,
  ambiente: "homologacao" | "producao",
  nsu: number,
  xml: string,
): Promise<{ novo: boolean; evento: boolean }> {
  const parsed: ParsedDoc | null = parseDoc(xml);
  if (!parsed) return { novo: false, evento: false };

  if (parsed.kind === "nfe") {
    const xmlPath = buildXmlPath(empresaId, parsed.chaveAcesso);
    // Storage upsert primeiro (idempotente)
    await uploadNfeXml(admin as any, {
      empresaId,
      chave: parsed.chaveAcesso,
      xml,
    });
    const { data, error } = await admin.from("nfe_recebidas").upsert(
      {
        empresa_id: empresaId,
        chave_acesso: parsed.chaveAcesso,
        cnpj_emitente: parsed.cnpjEmitente,
        razao_emitente: parsed.razaoEmitente,
        ie_emitente: parsed.ieEmitente,
        uf_emitente: parsed.ufEmitente,
        cnpj_destinatario: parsed.cnpjDestinatario,
        numero: parsed.numero,
        serie: parsed.serie,
        modelo: parsed.modelo,
        data_emissao: parsed.dataEmissao,
        valor_total: parsed.valorTotal,
        digest_value: parsed.digestValue,
        tipo_documento: parsed.tipoDocumento,
        schema_tipo: parsed.schemaTipo,
        nsu,
        ambiente,
        xml_path: xmlPath,
        xml_completo: parsed.xmlCompleto,
      },
      { onConflict: "chave_acesso", ignoreDuplicates: false },
    ).select("id").maybeSingle();
    if (error) throw new Error(`upsert_nfe_failed: ${error.message}`);
    return { novo: !!data, evento: false };
  }

  // Evento
  await admin.from("nfe_eventos").insert({
    chave_acesso: parsed.chaveAcesso,
    tipo_evento: parsed.tipoEvento,
    codigo_evento: parsed.codigoEvento,
    sequencial: parsed.sequencial,
    data_evento: parsed.dataEvento,
    protocolo: parsed.protocolo,
    justificativa: parsed.justificativa,
    status_retorno: parsed.statusRetorno,
    motivo_retorno: parsed.motivoRetorno,
  });
  return { novo: false, evento: true };
}

// ------------------------------------------------------- pull loop
export async function runPuxador(
  admin: SupabaseClient,
  cert: CertificadoRow,
  sefazFetch?: SefazFetch,
): Promise<PullSummary> {
  const started = performance.now();
  const summary: PullSummary = {
    cnpj: cert.cnpj,
    ambiente: cert.ambiente,
    batches: 0,
    docs: 0,
    novos: 0,
    eventos: 0,
    cursorAntes: 0,
    cursorDepois: 0,
    cStatFinal: "",
    erro: null,
    durationMs: 0,
  };

  try {
    const cursorInicial = await getCursor(admin, cert.cnpj, cert.ambiente);
    summary.cursorAntes = cursorInicial;
    summary.cursorDepois = cursorInicial;

    const pem = await loadCertificado(admin, cert);
    const endpoint = distDFeEndpoint(cert.ambiente, "AN");

    let ultNSU = cursorInicial;
    let response: DistDFeResponse | null = null;

    for (let batch = 0; batch < MAX_BATCHES_PER_CNPJ; batch++) {
      const envelope = buildDistDFeEnvelope({
        ambiente: cert.ambiente,
        uf: cert.uf,
        cnpj: cert.cnpj,
        ultNSU,
      });
      const raw = sefazFetch
        ? await sefazFetch(endpoint.url, envelope)
        : await defaultSefazFetch(endpoint.url, envelope, pem.certPem, pem.keyPem);
      response = parseDistDFeResponse(raw);
      summary.batches++;
      summary.cStatFinal = response.cStat;

      const cls = classifyCStat(response.cStat);
      if (cls === "empty") break;
      if (cls === "retry" || cls === "rate_limit" || cls === "fatal") {
        summary.erro = `cStat=${response.cStat} ${response.xMotivo}`;
        break;
      }

      // Processar docs do lote
      for (const doc of response.docs) {
        summary.docs++;
        try {
          const xml = await gunzipBase64(doc.b64);
          const { novo, evento } = await processarDoc(
            admin, cert.empresa_id, cert.ambiente, doc.nsu, xml,
          );
          if (novo) summary.novos++;
          if (evento) summary.eventos++;
        } catch (err) {
          // Doc inválido não bloqueia o lote — log e segue
          console.error(JSON.stringify({
            level: "WARN", fn: "sefaz-dfe-puxar",
            cnpj: cert.cnpj, nsu: doc.nsu,
            error: err instanceof Error ? err.message : String(err),
          }));
        }
      }

      // Avança cursor após batch bem-sucedido
      await advanceCursor(
        admin, cert.cnpj, cert.ambiente,
        response.ultNSU, response.maxNSU, response.cStat, null,
      );
      ultNSU = response.ultNSU;
      summary.cursorDepois = ultNSU;

      // Chegou no fim
      if (response.ultNSU >= response.maxNSU) break;
    }

    // Registrar erro no cursor se houve falha
    if (summary.erro && response) {
      await advanceCursor(
        admin, cert.cnpj, cert.ambiente,
        summary.cursorDepois, response.maxNSU, response.cStat, summary.erro,
      );
    }
  } catch (err) {
    summary.erro = err instanceof Error ? err.message : String(err);
  }

  summary.durationMs = Math.round(performance.now() - started);

  // Telemetria
  await admin.from("query_telemetry").insert({
    operation: "sefaz_dfe_puxar",
    table_name: "nfe_recebidas",
    duration_ms: summary.durationMs,
    severity: summary.erro ? "warning" : "info",
    error_message: JSON.stringify(summary),
  }).then(() => {}, () => {});

  return summary;
}

// ------------------------------------------------------- HTTP handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const cronSecret = Deno.env.get("SEFAZ_CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (!cronSecret || provided !== cronSecret) {
    console.warn(JSON.stringify({
      level: "WARN", fn: "sefaz-dfe-puxar",
      message: "unauthorized dispatch attempt",
    }));
    return json(401, { error: "unauthorized" });
  }

  let payload: { empresa_id?: string } = {};
  try {
    const text = await req.text();
    if (text) payload = JSON.parse(text);
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const admin = makeAdminClient();
  const certs = await fetchCertificados(admin, payload.empresa_id);
  const summaries: PullSummary[] = [];

  // Sequencial para evitar sobrecarga de sockets mTLS.
  for (const cert of certs) {
    summaries.push(await runPuxador(admin, cert));
  }

  return json(200, {
    ok: true,
    processed: summaries.length,
    summaries,
  });
});
