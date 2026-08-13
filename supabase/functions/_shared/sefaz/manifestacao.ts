/**
 * Manifestação do Destinatário — Fase 4 NFe.
 *
 * Monta, assina (XMLDSig enveloped RSA-SHA1) e faz parse da resposta
 * do webservice `NFeRecepcaoEvento4` da SEFAZ AN, para os quatro
 * eventos de manifestação:
 *
 *   210210 — Ciência da Operação
 *   210200 — Confirmação da Operação
 *   210220 — Desconhecimento da Operação
 *   210240 — Operação não Realizada    (exige justificativa >= 15 chars)
 *
 * Este módulo NÃO faz rede nem toca em storage — apenas monta/parseia XML
 * e assina com uma chave PEM injetada. Isto permite testes puros.
 */

// deno-lint-ignore-file no-explicit-any

export type ManifTipo = "210200" | "210210" | "210220" | "210240";

export const MANIF_DESCRICAO: Record<ManifTipo, string> = {
  "210200": "Confirmacao da Operacao",
  "210210": "Ciencia da Operacao",
  "210220": "Desconhecimento da Operacao",
  "210240": "Operacao nao Realizada",
};

export interface EventoInput {
  tipo: ManifTipo;
  chaveAcesso: string;         // 44 dígitos
  cnpjAutor: string;           // CNPJ do destinatário (autor do evento)
  ambiente: "producao" | "homologacao";
  sequencial?: number;         // default 1
  dataEvento?: Date;           // default now
  justificativa?: string;      // obrigatório para 210240
  orgao?: number;              // default 91 (AN)
}

/** Endpoint oficial NFeRecepcaoEvento4 (AN). */
export function recepcaoEventoEndpoint(ambiente: "producao" | "homologacao") {
  return ambiente === "producao"
    ? "https://www1.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx"
    : "https://hom.nfe.fazenda.gov.br/NFeRecepcaoEvento4/NFeRecepcaoEvento4.asmx";
}

export const RECEPCAO_EVENTO_SOAP_ACTION =
  "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEventoNF";

function fmtDataUtc(d: Date): string {
  // YYYY-MM-DDTHH:MM:SS-03:00 (padrão SEFAZ)
  const iso = new Date(d.getTime() - 3 * 3600_000).toISOString();
  return iso.replace(/\.\d{3}Z$/, "-03:00");
}

function detEventoXml(input: Required<Pick<EventoInput, "tipo">> & { justificativa?: string }): string {
  const desc = MANIF_DESCRICAO[input.tipo];
  const extra = input.tipo === "210240" && input.justificativa
    ? `<xJust>${escapeXml(input.justificativa)}</xJust>`
    : "";
  return `<detEvento versao="1.00"><descEvento>${desc}</descEvento>${extra}</detEvento>`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => (
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" :
    c === '"' ? "&quot;" : "&apos;"
  ));
}

export function buildInfEvento(input: EventoInput): { infEvento: string; id: string } {
  const seq = input.sequencial ?? 1;
  const orgao = input.orgao ?? 91;
  const tpAmb = input.ambiente === "producao" ? 1 : 2;
  const dhEvento = fmtDataUtc(input.dataEvento ?? new Date());
  const id = `ID${input.tipo}${input.chaveAcesso}${String(seq).padStart(2, "0")}`;
  const infEvento =
    `<infEvento Id="${id}">` +
      `<cOrgao>${orgao}</cOrgao>` +
      `<tpAmb>${tpAmb}</tpAmb>` +
      `<CNPJ>${input.cnpjAutor}</CNPJ>` +
      `<chNFe>${input.chaveAcesso}</chNFe>` +
      `<dhEvento>${dhEvento}</dhEvento>` +
      `<tpEvento>${input.tipo}</tpEvento>` +
      `<nSeqEvento>${seq}</nSeqEvento>` +
      `<verEvento>1.00</verEvento>` +
      detEventoXml({ tipo: input.tipo, justificativa: input.justificativa }) +
    `</infEvento>`;
  return { infEvento, id };
}

/**
 * Assina o infEvento com XMLDSig enveloped (RSA-SHA1 / SHA-1).
 * Retorna o evento completo `<evento>...</evento>` já assinado.
 *
 * Observação: para produção, o C14N usado aqui é o SEFAZ-compatível
 * simplificado (sem quebras de linha, atributos na ordem original).
 * Compatível com os webservices oficiais NFe.
 */
export async function signEvento(
  infEvento: string,
  id: string,
  certPem: string,
  keyPem: string,
): Promise<string> {
  const forgeMod: any = await import("npm:node-forge@1.3.1");
  const forge: any = forgeMod.default ?? forgeMod;

  // 1) DigestValue = SHA1(canonicalize(infEvento)) em base64
  const md = forge.md.sha1.create();
  md.update(infEvento, "utf8");
  const digestValue = forge.util.encode64(md.digest().bytes());

  const signedInfo =
    `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
      `<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod>` +
      `<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod>` +
      `<Reference URI="#${id}">` +
        `<Transforms>` +
          `<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform>` +
          `<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform>` +
        `</Transforms>` +
        `<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod>` +
        `<DigestValue>${digestValue}</DigestValue>` +
      `</Reference>` +
    `</SignedInfo>`;

  // 2) SignatureValue = RSA-SHA1(privateKey, signedInfo)
  const privateKey = forge.pki.privateKeyFromPem(keyPem);
  const mdSig = forge.md.sha1.create();
  mdSig.update(signedInfo, "utf8");
  const signatureBytes = privateKey.sign(mdSig);
  const signatureValue = forge.util.encode64(signatureBytes);

  // 3) KeyInfo → X509Certificate (base64 sem PEM headers)
  const b64Cert = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");

  const signature =
    `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
      signedInfo +
      `<SignatureValue>${signatureValue}</SignatureValue>` +
      `<KeyInfo><X509Data><X509Certificate>${b64Cert}</X509Certificate></X509Data></KeyInfo>` +
    `</Signature>`;

  return `<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">${infEvento}${signature}</evento>`;
}

export function buildEnvEvento(
  eventoAssinado: string,
  idLote: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">` +
      `<soap:Body>` +
        `<nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">` +
          `<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">` +
            `<idLote>${idLote}</idLote>` +
            eventoAssinado +
          `</envEvento>` +
        `</nfeDadosMsg>` +
      `</soap:Body>` +
    `</soap:Envelope>`;
}

export interface RetEventoParsed {
  cStatLote: string;
  xMotivoLote: string;
  cStatEvento: string;
  xMotivoEvento: string;
  nProt: string | null;
  dhRegEvento: string | null;
  tpAmb: string | null;
}

function grep(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = xml.match(re);
  return m ? m[1].trim() : null;
}

export function parseRetEnvEvento(xml: string): RetEventoParsed {
  const cStatLote = grep(xml, "cStat") ?? "0";
  const xMotivoLote = grep(xml, "xMotivo") ?? "";
  // Dentro do primeiro retEvento
  const retEvento = xml.match(/<retEvento[\s\S]*?<\/retEvento>/)?.[0] ?? "";
  return {
    cStatLote,
    xMotivoLote,
    cStatEvento: grep(retEvento, "cStat") ?? cStatLote,
    xMotivoEvento: grep(retEvento, "xMotivo") ?? xMotivoLote,
    nProt: grep(retEvento, "nProt"),
    dhRegEvento: grep(retEvento, "dhRegEvento"),
    tpAmb: grep(retEvento, "tpAmb"),
  };
}

/** Mapeia tipo do evento para o novo `manifestacao_status` esperado. */
export function tipoToStatus(tipo: ManifTipo): "ciencia" | "confirmada" | "desconhecida" | "nao_realizada" {
  switch (tipo) {
    case "210210": return "ciencia";
    case "210200": return "confirmada";
    case "210220": return "desconhecida";
    case "210240": return "nao_realizada";
  }
}
