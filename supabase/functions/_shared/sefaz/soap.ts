/**
 * Envelope SOAP `nfeDistDFeInteresse` da SEFAZ.
 *
 * Este módulo mantém apenas montagem/parse de XML — nada de rede, PFX
 * ou storage. Isso torna trivial escrever testes puros contra os
 * fixtures em `__fixtures__/` e reutilizar a mesma lógica no puxador
 * real e no mock (`__mocks__/soap-mock.ts`).
 */

import { ambienteToTpAmb, cUFAutor, type Ambiente } from "./endpoints.ts";

export const SOAP_ACTION =
  "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse";

export interface DistDFeRequest {
  ambiente: Ambiente;
  uf: string;
  cnpj: string;
  ultNSU: number;
}

export function buildDistDFeEnvelope(req: DistDFeRequest): string {
  const nsu = String(Math.max(0, Math.floor(req.ultNSU))).padStart(15, "0");
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
  <soap:Body>
    <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDadosMsg>
        <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>${ambienteToTpAmb(req.ambiente)}</tpAmb>
          <cUFAutor>${cUFAutor(req.uf)}</cUFAutor>
          <CNPJ>${req.cnpj}</CNPJ>
          <distNSU>
            <ultNSU>${nsu}</ultNSU>
          </distNSU>
        </distDFeInt>
      </nfeDadosMsg>
    </nfeDistDFeInteresse>
  </soap:Body>
</soap:Envelope>`;
}

export interface DistDFeDoc {
  nsu: number;
  schema: string;
  b64: string;
}

export interface DistDFeResponse {
  cStat: string;
  xMotivo: string;
  ultNSU: number;
  maxNSU: number;
  docs: DistDFeDoc[];
}

const DOC_RE = /<docZip\s+NSU="(\d+)"\s+schema="([^"]+)"[^>]*>([\s\S]*?)<\/docZip>/g;

function pick(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : null;
}

export function parseDistDFeResponse(xml: string): DistDFeResponse {
  if (!xml.includes("<retDistDFeInt")) {
    throw new Error("resposta SEFAZ malformada: retDistDFeInt ausente");
  }
  const cStat = pick(xml, "cStat") ?? "0";
  const xMotivo = pick(xml, "xMotivo") ?? "";
  const ultNSU = Number(pick(xml, "ultNSU") ?? "0");
  const maxNSU = Number(pick(xml, "maxNSU") ?? "0");
  const docs: DistDFeDoc[] = [];
  let m: RegExpExecArray | null;
  while ((m = DOC_RE.exec(xml)) !== null) {
    docs.push({ nsu: Number(m[1]), schema: m[2], b64: m[3].trim() });
  }
  return { cStat, xMotivo, ultNSU, maxNSU, docs };
}

/**
 * Classifica `cStat` em categorias operacionais.
 *
 * - 137: nenhum documento localizado (fim do pull, cursor permanece).
 * - 138: documentos localizados (processar lote).
 * - 108/109: serviço paralisado (retry com backoff).
 * - 656: consumo indevido (backoff longo + circuit breaker).
 * - resto: erro definitivo — não avança cursor.
 */
export function classifyCStat(cStat: string): "ok" | "empty" | "retry" | "rate_limit" | "fatal" {
  switch (cStat) {
    case "138": return "ok";
    case "137": return "empty";
    case "108":
    case "109": return "retry";
    case "656": return "rate_limit";
    default: return "fatal";
  }
}
