/**
 * Mock do transporte SOAP `NFeDistribuicaoDFe` da SEFAZ.
 *
 * Reutiliza a filosofia do `sso-test-login/mocks.ts`: substitui
 * `globalThis.fetch` por um matcher determinístico. A cada CNPJ está
 * associada uma FILA de respostas — chamadas sucessivas do puxador
 * consomem a fila na ordem, permitindo simular paginação e transições
 * de estado (ok → rate limit → recuperação).
 *
 * Todas as URLs SEFAZ reais (AN, SVRS, SVAN — produção e homologação)
 * são interceptadas por padrão. Qualquer requisição para host SEFAZ
 * sem resposta enfileirada LANÇA — nenhuma chamada real vaza.
 *
 * Fonte única de verdade para os fixtures usados também pelo harness
 * de cenários (`src/test/scenarios/fixtures/nfe.ts`).
 */

import { corruptedGzipBase64, gzipBase64 } from "../gunzip.ts";

/** Hosts oficiais do webservice de Distribuição de DFe. */
const SEFAZ_HOSTS = [
  "www1.nfe.fazenda.gov.br",         // AN produção
  "hom.nfe.fazenda.gov.br",          // AN homologação
  "nfe.svrs.rs.gov.br",              // SVRS produção
  "nfe-homologacao.svrs.rs.gov.br",  // SVRS homologação
  "www.sefazvirtual.fazenda.gov.br", // SVAN produção
  "hom.sefazvirtual.fazenda.gov.br", // SVAN homologação
];

export type SefazResponseKind =
  | "batch"
  | "empty"
  | "rate_limit"
  | "service_down"
  | "timeout"
  | "network_error"
  | "gzip_corrupt"
  | "xml_corrupt"
  | "malformed_envelope"
  | "nsu_gap"
  | "duplicate";

export interface SefazDoc {
  /** XML bruto do documento (procNFe, resNFe, procEventoNFe, etc). */
  xml: string;
  /** NSU associado — se omitido, é atribuído sequencialmente. */
  nsu?: number;
  /** Se true, o docZip é intencionalmente corrompido. */
  corrupt?: "gzip" | "xml";
}

export interface SefazResponseSpec {
  kind: SefazResponseKind;
  docs?: SefazDoc[];
  ultNSU?: number;
  maxNSU?: number;
  /** Somente para `timeout` — quantos ms segurar antes de abortar. */
  timeoutMs?: number;
}

export interface SefazScenario {
  cnpj: string;
  responses: SefazResponseSpec[];
}

export interface SefazMockCall {
  url: string;
  cnpj: string | null;
  ultNSUEnviado: number | null;
  ts: number;
}

export interface SefazMockHandle {
  calls: SefazMockCall[];
  remaining(cnpj: string): number;
  restore(): void;
  /** Registra respostas adicionais para um CNPJ em runtime. */
  enqueue(cnpj: string, responses: SefazResponseSpec[]): void;
}

// ---------------------------------------------------------------- helpers

function extractCnpj(body: string | null): string | null {
  if (!body) return null;
  const m = body.match(/<CNPJ>(\d{14})<\/CNPJ>/);
  return m ? m[1] : null;
}

function extractUltNSU(body: string | null): number | null {
  if (!body) return null;
  const m = body.match(/<ultNSU>(\d+)<\/ultNSU>/);
  return m ? Number(m[1]) : null;
}

function isSefazHost(url: string): boolean {
  try {
    const u = new URL(url);
    return SEFAZ_HOSTS.some((h) => u.hostname.endsWith(h));
  } catch {
    return false;
  }
}

async function buildBatchEnvelope(
  spec: SefazResponseSpec,
  fallbackStartNsu: number,
): Promise<{ body: string; ultNSU: number; maxNSU: number }> {
  const docs = spec.docs ?? [];
  let nsuCounter = fallbackStartNsu;
  const encoded: string[] = [];
  for (const doc of docs) {
    const nsu = doc.nsu ?? ++nsuCounter;
    if (doc.nsu != null) nsuCounter = Math.max(nsuCounter, doc.nsu);
    let b64: string;
    if (doc.corrupt === "gzip") {
      b64 = corruptedGzipBase64();
    } else if (doc.corrupt === "xml") {
      // gzip válido, XML truncado
      const truncated = doc.xml.slice(0, Math.floor(doc.xml.length / 2));
      b64 = await gzipBase64(truncated);
    } else {
      b64 = await gzipBase64(doc.xml);
    }
    // schema="procNFe_v4.00.xsd" é apenas informativo aqui
    encoded.push(
      `<docZip NSU="${nsu}" schema="procNFe_v4.00.xsd">${b64}</docZip>`,
    );
  }

  const ultNSU = spec.ultNSU ?? nsuCounter;
  const maxNSU = spec.maxNSU ?? ultNSU;

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <nfeDistDFeInteresseResponse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDistDFeInteresseResult>
        <retDistDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>2</tpAmb>
          <verAplic>SEFAZ-MOCK</verAplic>
          <cStat>138</cStat>
          <xMotivo>Documento(s) localizado(s)</xMotivo>
          <dhResp>2026-07-22T10:00:00-03:00</dhResp>
          <ultNSU>${String(ultNSU).padStart(15, "0")}</ultNSU>
          <maxNSU>${String(maxNSU).padStart(15, "0")}</maxNSU>
          <loteDistDFeInt>
            ${encoded.join("\n            ")}
          </loteDistDFeInt>
        </retDistDFeInt>
      </nfeDistDFeInteresseResult>
    </nfeDistDFeInteresseResponse>
  </soap:Body>
</soap:Envelope>`;

  return { body, ultNSU, maxNSU };
}

const STATIC_ENVELOPES: Partial<Record<SefazResponseKind, string>> = {
  empty: /* xml */ `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body><nfeDistDFeInteresseResponse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
    <nfeDistDFeInteresseResult>
      <retDistDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
        <tpAmb>2</tpAmb><cStat>137</cStat><xMotivo>Nenhum documento localizado</xMotivo>
        <ultNSU>000000000000000</ultNSU><maxNSU>000000000000000</maxNSU>
      </retDistDFeInt>
    </nfeDistDFeInteresseResult>
  </nfeDistDFeInteresseResponse></soap:Body>
</soap:Envelope>`,
  rate_limit: /* xml */ `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body><nfeDistDFeInteresseResponse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
    <nfeDistDFeInteresseResult>
      <retDistDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
        <tpAmb>2</tpAmb><cStat>656</cStat><xMotivo>Consumo Indevido</xMotivo>
      </retDistDFeInt>
    </nfeDistDFeInteresseResult>
  </nfeDistDFeInteresseResponse></soap:Body>
</soap:Envelope>`,
  service_down: /* xml */ `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body><nfeDistDFeInteresseResponse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
    <nfeDistDFeInteresseResult>
      <retDistDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
        <tpAmb>2</tpAmb><cStat>108</cStat><xMotivo>Servico Paralisado Momentaneamente</xMotivo>
      </retDistDFeInt>
    </nfeDistDFeInteresseResult>
  </nfeDistDFeInteresseResponse></soap:Body>
</soap:Envelope>`,
  malformed_envelope: /* xml */ `<?xml version="1.0"?><soap:Envelope><soap:Body><retDistDFeInt><tpAmb>2<cStat>138</cStat><ultNSU>100`,
};

// ---------------------------------------------------------------- install

export function installSefazSoapMock(
  scenarios: SefazScenario[],
): SefazMockHandle {
  const original = globalThis.fetch;
  const queues = new Map<string, SefazResponseSpec[]>();
  for (const s of scenarios) {
    queues.set(s.cnpj, [...s.responses]);
  }
  const calls: SefazMockCall[] = [];
  const lastUltNsuByCnpj = new Map<string, number>();

  globalThis.fetch = (async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const req = input instanceof Request ? input : new Request(input, init);
    const url = req.url;

    if (!isSefazHost(url)) {
      // Deixa passar fetches não-SEFAZ (ex: Supabase REST, testes que mockam à parte).
      return await original(input, init);
    }

    const body = await req.clone().text().catch(() => null);
    const cnpj = extractCnpj(body);
    const ultNSUEnviado = extractUltNSU(body);
    calls.push({ url, cnpj, ultNSUEnviado, ts: Date.now() });

    if (!cnpj) {
      throw new Error(
        `[sefaz-mock] Requisição SEFAZ sem <CNPJ> no envelope: ${url}`,
      );
    }
    const queue = queues.get(cnpj);
    if (!queue || queue.length === 0) {
      throw new Error(
        `[sefaz-mock] Fila esgotada para CNPJ ${cnpj} (chamada #${calls.length}). ` +
          `Registre respostas adicionais com handle.enqueue().`,
      );
    }
    const spec = queue.shift()!;

    const lastNsu = lastUltNsuByCnpj.get(cnpj) ?? 0;

    switch (spec.kind) {
      case "empty":
      case "rate_limit":
      case "service_down":
      case "malformed_envelope":
        return new Response(STATIC_ENVELOPES[spec.kind]!, {
          status: 200,
          headers: { "Content-Type": "application/soap+xml; charset=utf-8" },
        });

      case "network_error":
        throw new TypeError("network error");

      case "timeout": {
        const ms = spec.timeoutMs ?? 30_000;
        const signal = init?.signal ?? req.signal;
        return await new Promise<Response>((_, reject) => {
          const timer = setTimeout(() => {
            reject(new DOMException("Timed out", "TimeoutError"));
          }, ms);
          if (signal) {
            signal.addEventListener("abort", () => {
              clearTimeout(timer);
              reject(new DOMException("Aborted", "AbortError"));
            });
          }
        });
      }

      case "gzip_corrupt": {
        const docs = (spec.docs ?? [{ xml: "<x/>" }]).map((d) => ({
          ...d,
          corrupt: "gzip" as const,
        }));
        const built = await buildBatchEnvelope({ ...spec, docs }, lastNsu);
        lastUltNsuByCnpj.set(cnpj, built.ultNSU);
        return new Response(built.body, { status: 200 });
      }

      case "xml_corrupt": {
        const docs = (spec.docs ?? []).map((d) => ({ ...d, corrupt: "xml" as const }));
        const built = await buildBatchEnvelope({ ...spec, docs }, lastNsu);
        lastUltNsuByCnpj.set(cnpj, built.ultNSU);
        return new Response(built.body, { status: 200 });
      }

      case "nsu_gap": {
        const gapStart = (spec.ultNSU ?? lastNsu + 500);
        const built = await buildBatchEnvelope(
          { ...spec, ultNSU: gapStart, maxNSU: spec.maxNSU ?? gapStart },
          gapStart - (spec.docs?.length ?? 0),
        );
        lastUltNsuByCnpj.set(cnpj, built.ultNSU);
        return new Response(built.body, { status: 200 });
      }

      case "duplicate":
      case "batch": {
        const built = await buildBatchEnvelope(spec, lastNsu);
        lastUltNsuByCnpj.set(cnpj, built.ultNSU);
        return new Response(built.body, { status: 200 });
      }
    }
  }) as typeof fetch;

  return {
    calls,
    remaining: (cnpj) => queues.get(cnpj)?.length ?? 0,
    restore: () => {
      globalThis.fetch = original;
    },
    enqueue: (cnpj, responses) => {
      const q = queues.get(cnpj) ?? [];
      q.push(...responses);
      queues.set(cnpj, q);
    },
  };
}
