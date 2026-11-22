/**
 * Extração do grupo IBS/CBS de XML de NF-e recebida (etapa 49 do plano RT/RFB).
 *
 * O puxador SEFAZ recebe dois formatos:
 *   - `resNFe`  (resumo): só chave/emitente/total, SEM itens e SEM impostos.
 *   - `procNFe` (completo): XML inteiro, com `det/imposto/IBSCBS` por item.
 *
 * Regra de negócio: crédito só nasce de `procNFe`. Resumo não tem o valor
 * destacado, então qualquer crédito derivado dele seria estimativa — e a
 * etapa 43 proíbe estimativa (`origem='xml_destacado'` exige valor do XML).
 *
 * O parser daqui é deliberadamente independente do parser DOM do front
 * (`src/lib/nfe/parse-ibscbs.ts`): Edge Function em Deno não tem DOM e o
 * `_shared/sefaz/parser.ts` do repo já resolve XML por regex para manter
 * o bundle pequeno. Os nomes de elemento seguem o leiaute oficial.
 */

export interface IbscbsItem {
  nItem: number;
  cst?: string;
  cClassTrib?: string;
  vBC?: number;
  pIBSUF?: number;
  vIBSUF?: number;
  pIBSMun?: number;
  vIBSMun?: number;
  vIBS?: number;
  pCBS?: number;
  vCBS?: number;
  cstIs?: string;
  cClassTribIs?: string;
  vIS?: number;
}

export interface IbscbsTotais {
  vBCIBSCBS?: number;
  vIBSUF?: number;
  vIBSMun?: number;
  vIBS?: number;
  vCBS?: number;
  vIS?: number;
  vTotIBSMono?: number;
  vTotCBSMono?: number;
}

export interface IbscbsNota {
  itens: IbscbsItem[];
  totais: IbscbsTotais;
}

function num(raw: string | null | undefined): number | undefined {
  if (raw == null) return undefined;
  const v = Number(raw.trim());
  return Number.isFinite(v) ? v : undefined;
}

/**
 * Tag estrita (`<vIBS>`, não `<vIBSUF>`): o leiaute tem pares de nomes onde
 * um é prefixo do outro (`vIBS`/`vIBSUF`, `vCBS`/`vCBSMono`, `gIBS`/`gIBSCBS`).
 * Com `<tag[^>]*>` o `vIBS` casaria o `vIBSUF` e o total sairia errado.
 */
function txt(bloco: string, tag: string): string | undefined {
  const m = bloco.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  const v = m?.[1]?.trim();
  return v ? v : undefined;
}

function bloco(bloco: string, tag: string): string | undefined {
  const m = bloco.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return m?.[1];
}

/** `det` de uma nota completa, na ordem do XML. */
function blocosDet(xml: string): Array<{ nItem: number; corpo: string }> {
  const out: Array<{ nItem: number; corpo: string }> = [];
  const re = /<det\s[^>]*nItem="(\d+)"[^>]*>([\s\S]*?)<\/det>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push({ nItem: Number(m[1]), corpo: m[2] });
  }
  return out;
}

/**
 * Lê o grupo IBS/CBS por item e os totais da nota.
 * Devolve `null` quando o XML não é uma NF-e completa (`procNFe`).
 */
export function extrairIbscbs(xml: string): IbscbsNota | null {
  if (!/<infNFe[\s>]/.test(xml)) return null;

  const itens: IbscbsItem[] = [];
  for (const det of blocosDet(xml)) {
    const imposto = bloco(det.corpo, 'imposto');
    if (!imposto) continue;

    const ibscbs = bloco(imposto, 'IBSCBS');
    const is = bloco(imposto, 'IS');
    if (!ibscbs && !is) continue;

    const item: IbscbsItem = { nItem: det.nItem };

    if (ibscbs) {
      item.cst = txt(ibscbs, 'CST');
      item.cClassTrib = txt(ibscbs, 'cClassTrib');
      const g = bloco(ibscbs, 'gIBSCBS');
      if (g) {
        item.vBC = num(txt(g, 'vBC'));
        item.vIBS = num(txt(g, 'vIBS'));
        const uf = bloco(g, 'gIBSUF');
        if (uf) {
          item.pIBSUF = num(txt(uf, 'pIBSUF'));
          item.vIBSUF = num(txt(uf, 'vIBSUF'));
        }
        const mun = bloco(g, 'gIBSMun');
        if (mun) {
          item.pIBSMun = num(txt(mun, 'pIBSMun'));
          item.vIBSMun = num(txt(mun, 'vIBSMun'));
        }
        const cbs = bloco(g, 'gCBS');
        if (cbs) {
          item.pCBS = num(txt(cbs, 'pCBS'));
          item.vCBS = num(txt(cbs, 'vCBS'));
        }
      }
    }

    if (is) {
      item.cstIs = txt(is, 'CSTIS');
      item.cClassTribIs = txt(is, 'cClassTribIS');
      item.vIS = num(txt(is, 'vIS'));
    }

    itens.push(item);
  }

  const total = bloco(xml, 'IBSCBSTot');
  const gIBS = total ? bloco(total, 'gIBS') : undefined;
  const gCBS = total ? bloco(total, 'gCBS') : undefined;
  const gMono = total ? bloco(total, 'gMono') : undefined;
  const istTot = bloco(xml, 'ISTot');

  const totais: IbscbsTotais = {
    vBCIBSCBS: total ? num(txt(total, 'vBCIBSCBS')) : undefined,
    vIBS: gIBS
      ? (num(txt(gIBS, 'vIBS')) ?? num(txt(bloco(gIBS, 'gIBSUF') ?? '', 'vIBSUF')))
      : undefined,
    vIBSUF: gIBS ? num(txt(bloco(gIBS, 'gIBSUF') ?? '', 'vIBSUF')) : undefined,
    vIBSMun: gIBS ? num(txt(bloco(gIBS, 'gIBSMun') ?? '', 'vIBSMun')) : undefined,
    vCBS: gCBS ? num(txt(gCBS, 'vCBS')) : undefined,
    vIS: istTot ? num(txt(istTot, 'vIS')) : undefined,
    vTotIBSMono: gMono ? num(txt(gMono, 'vIBSMono')) : undefined,
    vTotCBSMono: gMono ? num(txt(gMono, 'vCBSMono')) : undefined,
  };

  return { itens, totais };
}
