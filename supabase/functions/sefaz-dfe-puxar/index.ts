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
  cbOpen: boolean;
  backoffPending: boolean;
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

/**
 * Log estruturado (JSON de linha única) — consumido por Logflare/Explorer.
 * Sempre inclui `fn`, `ts`, `level` para permitir filtros consistentes,
 * e chaves canônicas do domínio SEFAZ (`cnpj`, `ambiente`, `cStat`,
 * `cb_open`, `durationMs`) para agregações e alertas.
 */
type LogLevel = "INFO" | "WARN" | "ERROR";
function slog(level: LogLevel, event: string, fields: Record<string, unknown> = {}) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      fn: "sefaz-dfe-puxar",
      event,
      ...fields,
    });
    if (level === "ERROR") console.error(line);
    else if (level === "WARN") console.warn(line);
    else console.log(line);
  } catch {
    // Nunca deixar log estruturado quebrar o fluxo.
  }
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

interface CursorState {
  nsu: number;
  cbOpen: boolean;
  backoffPending: boolean;
  nextRunAt: string | null;
}
async function getCursor(
  admin: SupabaseClient,
  cnpj: string,
  ambiente: "homologacao" | "producao",
): Promise<CursorState> {
  const { data } = await admin.from("sefaz_dfe_cursor")
    .select("ultimo_nsu, circuit_open, next_run_at")
    .eq("cnpj", cnpj).eq("ambiente", ambiente).maybeSingle();
  const nextRunAt = data?.next_run_at ?? null;
  return {
    nsu: Number(data?.ultimo_nsu ?? 0),
    cbOpen: Boolean(data?.circuit_open),
    backoffPending: nextRunAt ? new Date(nextRunAt) > new Date() : false,
    nextRunAt,
  };
}

/**
 * Aplica um lote completo (docs + avanço de cursor) numa única transação
 * via RPC `sefaz_process_batch`. Garante:
 *   - atomicidade (tudo ou nada);
 *   - idempotência (ON CONFLICT DO NOTHING em chave/evento);
 *   - monotonicidade do cursor (SELECT FOR UPDATE + guard `p_novo_nsu > atual`).
 */
async function applyBatchTransactional(
  admin: SupabaseClient,
  cert: CertificadoRow,
  novoNsu: number,
  maxNsu: number,
  status: string,
  erro: string | null,
  docs: Array<{ kind: "nfe" | "evento"; nsu: number; payload: Record<string, unknown> }>,
): Promise<{ novos: number; eventos: number; ignorados: number; cursor_depois: number }> {
  const { data, error } = await admin.rpc("sefaz_process_batch", {
    p_cnpj: cert.cnpj,
    p_ambiente: cert.ambiente,
    p_empresa_id: cert.empresa_id,
    p_novo_nsu: novoNsu,
    p_max_nsu: maxNsu,
    p_status: status,
    p_erro: erro,
    p_docs: docs,
  });
  if (error) throw new Error(`sefaz_process_batch_failed: ${error.message}`);
  const r = (data ?? {}) as any;
  return {
    novos: Number(r.novos ?? 0),
    eventos: Number(r.eventos ?? 0),
    ignorados: Number(r.ignorados ?? 0),
    cursor_depois: Number(r.cursor_depois ?? novoNsu),
  };
}

// Chamada SEFAZ com mTLS. Isolada para permitir stub em teste.
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

/**
 * Materializa um docZip (NFe ou evento) em:
 *   - upload de XML no bucket (idempotente — path determinístico por chave);
 *   - descriptor de payload que será entregue ao RPC transacional.
 * Se o XML for inválido, devolve null (não bloqueia o lote).
 */
async function stageDoc(
  admin: SupabaseClient,
  empresaId: string,
  nsu: number,
  xml: string,
): Promise<
  | { kind: "nfe" | "evento"; nsu: number; payload: Record<string, unknown> }
  | null
> {
  const parsed: ParsedDoc | null = parseDoc(xml);
  if (!parsed) return null;

  if (parsed.kind === "nfe") {
    const xmlPath = buildXmlPath(empresaId, parsed.chaveAcesso);
    // Storage é fora da transação, mas o path é determinístico:
    // um retry re-envia para o mesmo caminho (upsert=true). Nunca gera órfão inconsistente.
    await uploadNfeXml(admin as any, {
      empresaId,
      chave: parsed.chaveAcesso,
      xml,
    });
    return {
      kind: "nfe",
      nsu,
      payload: {
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
        xml_path: xmlPath,
        xml_completo: parsed.xmlCompleto,
      },
    };
  }

  return {
    kind: "evento",
    nsu,
    payload: {
      chave_acesso: parsed.chaveAcesso,
      tipo_evento: parsed.tipoEvento,
      codigo_evento: parsed.codigoEvento,
      sequencial: parsed.sequencial,
      data_evento: parsed.dataEvento,
      protocolo: parsed.protocolo,
      justificativa: parsed.justificativa,
      status_retorno: parsed.statusRetorno,
      motivo_retorno: parsed.motivoRetorno,
    },
  };
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
    cbOpen: false,
    backoffPending: false,
    erro: null,
    durationMs: 0,
  };

  slog("INFO", "puxador_start", {
    cnpj: cert.cnpj,
    ambiente: cert.ambiente,
    uf: cert.uf,
    empresa_id: cert.empresa_id,
  });

  try {
    const cursorState = await getCursor(admin, cert.cnpj, cert.ambiente);
    summary.cursorAntes = cursorState.nsu;
    summary.cursorDepois = cursorState.nsu;
    summary.cbOpen = cursorState.cbOpen;
    summary.backoffPending = cursorState.backoffPending;

    if (cursorState.cbOpen) {
      summary.erro = "circuit_open";
      slog("WARN", "puxador_skipped", {
        cnpj: cert.cnpj, ambiente: cert.ambiente,
        cb_open: true, reason: "circuit_open",
        cursor_antes: cursorState.nsu,
      });
      throw new Error("circuit_open");
    }
    if (cursorState.backoffPending) {
      summary.erro = "backoff_pending";
      slog("WARN", "puxador_skipped", {
        cnpj: cert.cnpj, ambiente: cert.ambiente,
        cb_open: false, backoff_pending: true,
        next_run_at: cursorState.nextRunAt,
        reason: "backoff_pending",
      });
      throw new Error("backoff_pending");
    }

    // Só carrega o PFX quando vamos falar de verdade com a SEFAZ.
    // Em testes injetamos `sefazFetch` e o loadCertificado é dispensado.
    const pem = sefazFetch
      ? { certPem: "", keyPem: "" }
      : await loadCertificado(admin, cert);
    const endpoint = distDFeEndpoint(cert.ambiente, "AN");


    let ultNSU = cursorState.nsu;
    let response: DistDFeResponse | null = null;

    for (let batch = 0; batch < MAX_BATCHES_PER_CNPJ; batch++) {
      const batchStarted = performance.now();
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
      const batchDurationMs = Math.round(performance.now() - batchStarted);

      slog("INFO", "puxador_batch", {
        cnpj: cert.cnpj,
        ambiente: cert.ambiente,
        batch: batch + 1,
        cStat: response.cStat,
        xMotivo: response.xMotivo,
        classify: cls,
        ult_nsu_enviado: ultNSU,
        ult_nsu_resposta: response.ultNSU,
        max_nsu: response.maxNSU,
        docs: response.docs?.length ?? 0,
        duration_ms: batchDurationMs,
      });

      // Cenários sem docs: apenas atualizar status/erro no cursor (sem regredir NSU).
      if (cls === "empty") {
        await applyBatchTransactional(
          admin, cert, ultNSU, response.maxNSU, response.cStat, null, [],
        );
        break;
      }
      if (cls === "retry" || cls === "rate_limit" || cls === "fatal") {
        summary.erro = `cStat=${response.cStat} ${response.xMotivo}`;
        slog("WARN", "puxador_cstat_stop", {
          cnpj: cert.cnpj, ambiente: cert.ambiente,
          cStat: response.cStat, classify: cls,
          xMotivo: response.xMotivo,
        });
        await applyBatchTransactional(
          admin, cert, ultNSU, response.maxNSU, response.cStat, summary.erro, [],
        );
        break;
      }

      // Materializa docs (parse + upload XML) fora da transação DB.
      // O RPC transacional consolida tudo num único COMMIT: se ele falhar,
      // NENHUM registro é inserido e o cursor NÃO avança — próxima execução
      // retoma do mesmo ultNSU e reprocessa idempotentemente (ON CONFLICT DO NOTHING).
      const staged: Array<{ kind: "nfe" | "evento"; nsu: number; payload: Record<string, unknown> }> = [];
      let docsIgnorados = 0;
      for (const doc of response.docs) {
        summary.docs++;
        try {
          const xml = await gunzipBase64(doc.b64);
          const s = await stageDoc(admin, cert.empresa_id, doc.nsu, xml);
          if (s) staged.push(s);
          else docsIgnorados++;
        } catch (err) {
          // Doc inválido não bloqueia o lote — log e segue (é ignorado pelo RPC).
          docsIgnorados++;
          slog("WARN", "puxador_doc_invalido", {
            cnpj: cert.cnpj, ambiente: cert.ambiente,
            nsu: doc.nsu,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const applied = await applyBatchTransactional(
        admin, cert,
        response.ultNSU, response.maxNSU, response.cStat, null,
        staged,
      );
      summary.novos     += applied.novos;
      summary.eventos   += applied.eventos;
      summary.cursorDepois = applied.cursor_depois;
      ultNSU = applied.cursor_depois;

      slog("INFO", "puxador_batch_persisted", {
        cnpj: cert.cnpj, ambiente: cert.ambiente,
        batch: batch + 1,
        novos: applied.novos,
        eventos: applied.eventos,
        ignorados: docsIgnorados,
        cursor_depois: applied.cursor_depois,
      });

      // Chegou no fim
      if (response.ultNSU >= response.maxNSU) break;
    }

  } catch (err) {
    summary.erro = err instanceof Error ? err.message : String(err);
  }

  summary.durationMs = Math.round(performance.now() - started);

  // Log final por CNPJ (agrega métrica de tempo total).
  slog(summary.erro ? "WARN" : "INFO", "puxador_finish", {
    cnpj: cert.cnpj,
    ambiente: cert.ambiente,
    empresa_id: cert.empresa_id,
    batches: summary.batches,
    docs: summary.docs,
    novos: summary.novos,
    eventos: summary.eventos,
    cursor_antes: summary.cursorAntes,
    cursor_depois: summary.cursorDepois,
    cStat_final: summary.cStatFinal,
    cb_open: summary.cbOpen,
    backoff_pending: summary.backoffPending,
    duration_ms: summary.durationMs,
    erro: summary.erro,
  });

  // Telemetria persistida (dashboard de queries).
  // `error_message` carrega o JSON completo do summary — parseável por
  // `SELECT error_message::jsonb ->> 'cStat_final'` etc.
  await admin.from("query_telemetry").insert({
    operation: "sefaz_dfe_puxar",
    table_name: "nfe_recebidas",
    duration_ms: summary.durationMs,
    severity: summary.erro ? "warning" : "info",
    error_message: JSON.stringify({
      cnpj: cert.cnpj,
      ambiente: cert.ambiente,
      empresa_id: cert.empresa_id,
      cStat_final: summary.cStatFinal,
      cb_open: summary.cbOpen,
      backoff_pending: summary.backoffPending,
      batches: summary.batches,
      docs: summary.docs,
      novos: summary.novos,
      eventos: summary.eventos,
      cursor_antes: summary.cursorAntes,
      cursor_depois: summary.cursorDepois,
      erro: summary.erro,
    }),
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
