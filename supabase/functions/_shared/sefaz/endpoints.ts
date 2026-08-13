/**
 * URLs oficiais do webservice NFeDistribuicaoDFe (SVAN / AN).
 *
 * Para o serviço de Distribuição de DFe, a SEFAZ mantém *dois* pontos
 * de acesso nacionais — AN (Ambiente Nacional, servido pela Receita
 * Federal) e SVRS (contingência). Ambos aceitam consultas de qualquer
 * UF. A escolha entre eles é indiferente para efeitos de negócio; o
 * puxador usa AN por padrão e cai para SVRS quando AN devolve 108/109.
 */

export type Ambiente = "producao" | "homologacao";

export interface DistDFeEndpoint {
  url: string;
  label: "AN" | "SVRS";
}

export function distDFeEndpoint(
  ambiente: Ambiente,
  provider: "AN" | "SVRS" = "AN",
): DistDFeEndpoint {
  if (provider === "AN") {
    return ambiente === "producao"
      ? { url: "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx", label: "AN" }
      : { url: "https://hom.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx", label: "AN" };
  }
  return ambiente === "producao"
    ? { url: "https://nfe.svrs.rs.gov.br/ws/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx", label: "SVRS" }
    : { url: "https://nfe-homologacao.svrs.rs.gov.br/ws/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx", label: "SVRS" };
}

/** Código IBGE da UF (usado no elemento <cUFAutor>). */
export const UF_IBGE: Record<string, number> = {
  AC: 12, AL: 27, AM: 13, AP: 16, BA: 29, CE: 23, DF: 53, ES: 32, GO: 52,
  MA: 21, MG: 31, MS: 50, MT: 51, PA: 15, PB: 25, PE: 26, PI: 22, PR: 41,
  RJ: 33, RN: 24, RO: 11, RR: 14, RS: 43, SC: 42, SE: 28, SP: 35, TO: 17,
};

export function cUFAutor(uf: string): number {
  const code = UF_IBGE[uf.toUpperCase()];
  if (!code) throw new Error(`UF inválida: ${uf}`);
  return code;
}

export function ambienteToTpAmb(a: Ambiente): 1 | 2 {
  return a === "producao" ? 1 : 2;
}
