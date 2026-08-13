/**
 * Parser de documentos DFe (procNFe, resNFe, procEventoNFe, resEvento).
 *
 * Extrai apenas os campos que o banco precisa para popular `nfe_recebidas`
 * e `nfe_eventos`. Nunca lança em campos ausentes — devolve `null` e deixa
 * a decisão de descartar/aceitar para o puxador.
 */

export type SchemaTipo = "procNFe" | "resNFe" | "procEventoNFe" | "resEvento";

export interface ParsedNFe {
  kind: "nfe";
  schemaTipo: "procNFe" | "resNFe";
  xmlCompleto: boolean;
  chaveAcesso: string;
  cnpjEmitente: string | null;
  razaoEmitente: string | null;
  ieEmitente: string | null;
  ufEmitente: string | null;
  cnpjDestinatario: string | null;
  numero: string | null;
  serie: string | null;
  modelo: string | null;
  dataEmissao: string | null;
  valorTotal: number | null;
  digestValue: string | null;
  tipoDocumento: "NFe";
}

export interface ParsedEvento {
  kind: "evento";
  schemaTipo: "procEventoNFe" | "resEvento";
  chaveAcesso: string;
  tipoEvento: string;
  codigoEvento: string | null;
  sequencial: number;
  dataEvento: string | null;
  protocolo: string | null;
  justificativa: string | null;
  statusRetorno: string | null;
  motivoRetorno: string | null;
}

export type ParsedDoc = ParsedNFe | ParsedEvento;

function firstTag(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : null;
}
function attr(xml: string, tag: string, attrName: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attrName}="([^"]+)"`));
  return m ? m[1] : null;
}
function chaveFromInfNFe(xml: string): string | null {
  return attr(xml, "infNFe", "Id")?.replace(/^NFe/, "") ?? null;
}
function chaveFromInfEvento(xml: string): string | null {
  const m = xml.match(/<infEvento[^>]*Id="ID(\d+)"/);
  return m ? m[1].slice(0, 44) : null;
}

export function detectSchema(xml: string): SchemaTipo | null {
  if (xml.includes("<procEventoNFe") || xml.includes(":procEventoNFe")) return "procEventoNFe";
  if (xml.includes("<resEvento") || xml.includes(":resEvento")) return "resEvento";
  if (xml.includes("<nfeProc") || xml.includes("<NFe")) return "procNFe";
  if (xml.includes("<resNFe") || xml.includes(":resNFe")) return "resNFe";
  return null;
}

export function parseDoc(xml: string): ParsedDoc | null {
  const schema = detectSchema(xml);
  if (!schema) return null;

  if (schema === "procNFe") {
    const chave = chaveFromInfNFe(xml);
    if (!chave || chave.length !== 44) return null;
    return {
      kind: "nfe",
      schemaTipo: "procNFe",
      xmlCompleto: true,
      chaveAcesso: chave,
      cnpjEmitente: firstTag(xml, "emit\\s*>[\\s\\S]*?<CNPJ")
        ? (xml.match(/<emit[^>]*>[\s\S]*?<CNPJ>(\d+)<\/CNPJ>/)?.[1] ?? null)
        : null,
      razaoEmitente: xml.match(/<emit[^>]*>[\s\S]*?<xNome>([^<]+)<\/xNome>/)?.[1] ?? null,
      ieEmitente: xml.match(/<emit[^>]*>[\s\S]*?<IE>([^<]+)<\/IE>/)?.[1] ?? null,
      ufEmitente: xml.match(/<enderEmit[^>]*>[\s\S]*?<UF>([^<]+)<\/UF>/)?.[1] ?? null,
      cnpjDestinatario: xml.match(/<dest[^>]*>[\s\S]*?<CNPJ>(\d+)<\/CNPJ>/)?.[1] ?? null,
      numero: firstTag(xml, "nNF"),
      serie: firstTag(xml, "serie"),
      modelo: firstTag(xml, "mod"),
      dataEmissao: firstTag(xml, "dhEmi") ?? firstTag(xml, "dEmi"),
      valorTotal: Number(xml.match(/<ICMSTot[^>]*>[\s\S]*?<vNF>([\d.]+)<\/vNF>/)?.[1] ?? "") || null,
      digestValue: firstTag(xml, "DigestValue"),
      tipoDocumento: "NFe",
    };
  }

  if (schema === "resNFe") {
    const chave = firstTag(xml, "chNFe");
    if (!chave || chave.length !== 44) return null;
    return {
      kind: "nfe",
      schemaTipo: "resNFe",
      xmlCompleto: false,
      chaveAcesso: chave,
      cnpjEmitente: firstTag(xml, "CNPJ"),
      razaoEmitente: firstTag(xml, "xNome"),
      ieEmitente: firstTag(xml, "IE"),
      ufEmitente: null,
      cnpjDestinatario: null,
      numero: null,
      serie: null,
      modelo: null,
      dataEmissao: firstTag(xml, "dhEmi"),
      valorTotal: Number(firstTag(xml, "vNF") ?? "") || null,
      digestValue: firstTag(xml, "digVal"),
      tipoDocumento: "NFe",
    };
  }

  // Eventos
  const chave = chaveFromInfEvento(xml) ?? firstTag(xml, "chNFe");
  if (!chave) return null;
  return {
    kind: "evento",
    schemaTipo: schema,
    chaveAcesso: chave,
    tipoEvento: firstTag(xml, "tpEvento") ?? "",
    codigoEvento: firstTag(xml, "cOrgao"),
    sequencial: Number(firstTag(xml, "nSeqEvento") ?? "1"),
    dataEvento: firstTag(xml, "dhEvento"),
    protocolo: firstTag(xml, "nProt"),
    justificativa: firstTag(xml, "xJust"),
    statusRetorno: firstTag(xml, "cStat"),
    motivoRetorno: firstTag(xml, "xMotivo"),
  };
}
