/**
 * Extração dos itens (`det`) de XML de NF-e (etapa 55 do plano RT/RFB).
 *
 * O `extrairIbscbs` (etapa 49) lê só o grupo tributário. `notas_fiscais_itens`
 * exige `c_prod`, `ncm` e `cfop` NOT NULL, que não estão no grupo — daí este
 * parser separado, que percorre `<prod>` e devolve os campos de produto junto
 * com o grupo IBS/CBS/IS do mesmo `det`.
 *
 * Unidades: os `v*` são absolutos; os `p*` saem em FRAÇÃO decimal (0.1130),
 * que é o que as colunas `numeric(5,4)` esperam. O `extrairIbscbs` devolve
 * percentual cru (11.3) — quem misturar os dois grava 11.3000 e estoura o
 * numeric(5,4). Este módulo é o único que fala com o banco.
 *
 * Os totais devolvidos são SEMPRE a soma dos itens, nunca o `IBSCBSTot` do
 * XML: o trigger `verificar_totais_ibscbs_por_id` compara nota x Σ itens e
 * rejeita com 22023 se divergir, então derivar do mesmo dado elimina a chance
 * de gravar um total que o próprio banco recusa.
 */

export interface ItemNFeExtraido {
  nItem: number;
  cProd: string;
  xProd?: string;
  ncm: string;
  cfop: string;
  qCom?: number;
  vUnCom?: number;
  vProd?: number;
  // Grupo IBS/CBS — percentuais em fração
  cstIbsCbs?: string;
  cClassTrib?: string;
  vBcIbsCbs?: number;
  pIbsUf?: number;
  vIbsUf?: number;
  pIbsMun?: number;
  vIbsMun?: number;
  pCbs?: number;
  vCbs?: number;
  vIbs?: number;
  pRedAliq?: number;
  pAliqEfet?: number;
  // Grupo IS
  cstIs?: string;
  cClassTribIs?: string;
  vBcIs?: number;
  pIs?: number;
  adRemIs?: number;
  vIs?: number;
}

export interface TotaisItens {
  vBcIbsCbs: number;
  vIbs: number;
  vIbsUf: number;
  vIbsMun: number;
  vCbs: number;
  vIs: number;
}

export interface ItensNfe {
  itens: ItemNFeExtraido[];
  totais: TotaisItens;
}

function num(raw: string | undefined): number | undefined {
  if (raw == null) return undefined;
  const v = Number(raw.trim());
  return Number.isFinite(v) ? v : undefined;
}

/** Percentual do XML (11.30) para fração (0.113). */
function frac(raw: string | undefined): number | undefined {
  const v = num(raw);
  return v === undefined ? undefined : v / 100;
}

function txt(bloco: string, tag: string): string | undefined {
  const m = bloco.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  const v = m?.[1]?.trim();
  return v ? v : undefined;
}

function bloco(bloco: string, tag: string): string | undefined {
  const m = bloco.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  return m?.[1];
}

function blocosDet(xml: string): Array<{ nItem: number; corpo: string }> {
  const out: Array<{ nItem: number; corpo: string }> = [];
  const re = /<det\s[^>]*nItem="(\d+)"[^>]*>([\s\S]*?)<\/det>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push({ nItem: Number(m[1]), corpo: m[2] });
  }
  return out;
}

function arredondar(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Lê os itens de uma NF-e completa. Devolve `null` quando o XML não é
 * `procNFe` (resumo não tem `det`) ou quando o primeiro item não traz
 * `cProd`/`NCM`/`CFOP`, que o banco exige NOT NULL.
 */
export function extrairItens(xml: string): ItensNfe | null {
  if (!/<infNFe[\s>]/.test(xml)) return null;

  const itens: ItemNFeExtraido[] = [];
  for (const det of blocosDet(xml)) {
    const prod = bloco(det.corpo, 'prod');
    if (!prod) continue;

    const cProd = txt(prod, 'cProd');
    const ncm = txt(prod, 'NCM');
    const cfop = txt(prod, 'CFOP');
    if (!cProd || !ncm || !cfop) continue;

    const item: ItemNFeExtraido = {
      nItem: det.nItem,
      cProd,
      xProd: txt(prod, 'xProd'),
      ncm,
      cfop,
      qCom: num(txt(prod, 'qCom')),
      vUnCom: num(txt(prod, 'vUnCom')),
      vProd: num(txt(prod, 'vProd')),
    };

    const imposto = bloco(det.corpo, 'imposto');
    const ibscbs = imposto ? bloco(imposto, 'IBSCBS') : undefined;
    if (ibscbs) {
      item.cstIbsCbs = txt(ibscbs, 'CST');
      item.cClassTrib = txt(ibscbs, 'cClassTrib');
      const g = bloco(ibscbs, 'gIBSCBS');
      if (g) {
        item.vBcIbsCbs = num(txt(g, 'vBC'));
        item.vIbs = num(txt(g, 'vIBS'));
        const uf = bloco(g, 'gIBSUF');
        if (uf) {
          item.pIbsUf = frac(txt(uf, 'pIBSUF'));
          item.vIbsUf = num(txt(uf, 'vIBSUF'));
          const gRed = bloco(uf, 'gRed');
          if (gRed) {
            item.pRedAliq = frac(txt(gRed, 'pRedAliq'));
            item.pAliqEfet = frac(txt(gRed, 'pAliqEfet'));
          }
        }
        const mun = bloco(g, 'gIBSMun');
        if (mun) {
          item.pIbsMun = frac(txt(mun, 'pIBSMun'));
          item.vIbsMun = num(txt(mun, 'vIBSMun'));
        }
        const cbs = bloco(g, 'gCBS');
        if (cbs) {
          item.pCbs = frac(txt(cbs, 'pCBS'));
          item.vCbs = num(txt(cbs, 'vCBS'));
        }
      }
    }

    const is = imposto ? bloco(imposto, 'IS') : undefined;
    if (is) {
      item.cstIs = txt(is, 'CSTIS');
      item.cClassTribIs = txt(is, 'cClassTribIS');
      item.vBcIs = num(txt(is, 'vBCIS'));
      item.pIs = frac(txt(is, 'pIS'));
      item.adRemIs = num(txt(is, 'pISEspec'));
      item.vIs = num(txt(is, 'vIS'));
    }

    itens.push(item);
  }

  if (itens.length === 0) return null;

  return { itens, totais: calcularTotais(itens) };
}

/** Soma dos itens — é o valor que o trigger do banco exige no cabeçalho. */
export function calcularTotais(itens: ItemNFeExtraido[]): TotaisItens {
  const soma = (f: (i: ItemNFeExtraido) => number | undefined) =>
    arredondar(itens.reduce((acc, i) => acc + (f(i) ?? 0), 0));
  return {
    vBcIbsCbs: soma((i) => i.vBcIbsCbs),
    vIbs: soma((i) => i.vIbs),
    vIbsUf: soma((i) => i.vIbsUf),
    vIbsMun: soma((i) => i.vIbsMun),
    vCbs: soma((i) => i.vCbs),
    vIs: soma((i) => i.vIs),
  };
}

/**
 * Converte os itens para o formato que a RPC `salvar_nfe_autorizada` lê em
 * `jsonb_to_recordset`. As chaves do recordset são snake_case; mandar o objeto
 * do parser direto (camelCase) faz o `jsonb_to_recordset` devolver NULL em
 * `c_prod`/`ncm`/`cfop` e derrubar o INSERT inteiro por NOT NULL.
 */
export function itensParaRpc(itens: ItemNFeExtraido[]): Array<Record<string, unknown>> {
  return itens.map((i) => ({
    n_item: i.nItem,
    c_prod: i.cProd,
    x_prod: i.xProd ?? null,
    ncm: i.ncm,
    cfop: i.cfop,
    q_com: i.qCom ?? null,
    v_un_com: i.vUnCom ?? null,
    v_prod: i.vProd ?? null,
    cst_ibscbs: i.cstIbsCbs ?? null,
    cclasstrib: i.cClassTrib ?? null,
    v_bc_ibscbs: i.vBcIbsCbs ?? null,
    p_ibs_uf: i.pIbsUf ?? null,
    v_ibs_uf: i.vIbsUf ?? null,
    p_ibs_mun: i.pIbsMun ?? null,
    v_ibs_mun: i.vIbsMun ?? null,
    p_cbs: i.pCbs ?? null,
    v_cbs: i.vCbs ?? null,
    v_ibs: i.vIbs ?? null,
    p_red_aliq: i.pRedAliq ?? null,
    p_aliq_efet: i.pAliqEfet ?? null,
    cst_is: i.cstIs ?? null,
    cclasstrib_is: i.cClassTribIs ?? null,
    v_bc_is: i.vBcIs ?? null,
    p_is: i.pIs ?? null,
    ad_rem_is: i.adRemIs ?? null,
    v_is: i.vIs ?? null,
  }));
}
