/**
 * Parser do grupo IBS/CBS/IS da NF-e (etapa 41 do plano RT/RFB).
 *
 * Lê `det/imposto/IBSCBS`, `det/imposto/IS` e os totais `total/IBSCBSTot` e
 * `total/ISTot` do XML. O leiaute segue os modelos JAXB da calculadora RFB
 * (TTribNFe, TCIBS, TRed, TIS, TIBSCBSMonoTot, TISTot) e o schema oficial
 * `leiauteNFe_v4.00.xsd` + `DFeTiposBasicos_v1.00.xsd`.
 *
 * Nomes dos elementos conforme o schema (não os campos do banco):
 *   - det/imposto/IBSCBS  (TTribNFe): CST, cClassTrib, gIBSCBS, gIBSCBSMono, ...
 *   - gIBSCBS             (TCIBS): vBC, gIBSUF, gIBSMun, vIBS, gCBS
 *   - gIBSUF              (GIBSUF): pIBSUF, gRed, vIBSUF
 *   - gIBSMun             (GIBSMun): pIBSMun, gRed, vIBSMun
 *   - gCBS                (GCBS): pCBS, gRed, vCBS
 *   - gRed                (TRed): pRedAliq, pAliqEfet
 *   - det/imposto/IS      (TIS): CSTIS, cClassTribIS, vBCIS, pIS, pISEspec, vIS
 *   - total/IBSCBSTot     (TIBSCBSMonoTot): vBCIBSCBS, gIBS, gCBS, gMono
 *   - total/ISTot         (TISTot): vIS
 *
 * Os percentuais `p*` vêm do XML em percentual (ex.: 11.3 para 11,3%). A
 * tabela `notas_fiscais_itens` guarda fração decimal (0-1), então o parser
 * converte dividindo por 100.
 */

export interface NFeIbscbsRed {
  pRedAliq?: number;
  pAliqEfet?: number;
}

export interface NFeIbscbsGrupo {
  /** CST do IBS/CBS (código situação tributária). */
  cst?: string;
  /** Classificação tributária (cClassTrib). */
  cClassTrib?: string;
  /** Base de cálculo do grupo (gIBSCBS/vBC). */
  vBC?: number;
  /** Alíquota IBS UF (percentual no XML, ex.: 11.3). */
  pIBSUF?: number;
  vIBSUF?: number;
  pIBSMun?: number;
  vIBSMun?: number;
  pCBS?: number;
  vCBS?: number;
  /** Total de IBS do item (gIBSCBS/vIBS). */
  vIBS?: number;
  /**
   * Redução de alíquota do IBS UF (`gIBSUF/gRed`). Cada tributo tem o seu
   * próprio grupo no leiaute (gIBSUF, gIBSMun, gCBS), com valores distintos.
   */
  gRedUF?: NFeIbscbsRed;
  /** Redução de alíquota do IBS Municipal (`gIBSMun/gRed`). */
  gRedMun?: NFeIbscbsRed;
  /** Redução de alíquota da CBS (`gCBS/gRed`). */
  gRedCBS?: NFeIbscbsRed;
}

export interface NFeIsGrupo {
  cstIs?: string;
  cClassTribIs?: string;
  vBCIs?: number;
  /** Alíquota do IS em percentual (`pIS`). */
  pIs?: number;
  /**
   * Alíquota específica do IS **por valor** (`pISEspec`, ex.: R$/unidade).
   * Não é percentual — fica como veio no XML, sem divisão por 100.
   */
  pIsEspec?: number;
  /** Unidade tributável (`uTrib`), exigida quando há `pISEspec`. */
  uTrib?: string;
  /** Quantidade tributável (`qTrib`), exigida quando há `pISEspec`. */
  qTrib?: number;
  vIs?: number;
}

export interface NFeIbscbsTotais {
  vBCIBSCBS?: number;
  vIBS?: number;
  vCBS?: number;
  vIBS_UF?: number;
  vIBS_Mun?: number;
  vIS?: number;
}

/**
 * Lê um valor numérico de um elemento XML. Retorna `undefined` se o elemento
 * não existir ou o valor não for numérico.
 */
function num(el: Element | null | undefined): number | undefined {
  const raw = el?.textContent?.trim();
  if (!raw || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** Converte percentual do XML (11.3) para fração decimal (0.113). */
function toFrac(pct: number | undefined): number | undefined {
  if (pct === undefined) return undefined;
  return pct / 100;
}

/**
 * Lê um grupo `gRed` (TRed): `pRedAliq` é percentual de redução,
 * `pAliqEfet` é a alíquota efetiva já calculada — ambos percentuais.
 */
function lerRed(gRed: Element | null | undefined): NFeIbscbsRed | undefined {
  if (!gRed) return undefined;
  const red: NFeIbscbsRed = {
    pRedAliq: toFrac(num(gRed.querySelector('pRedAliq'))),
    pAliqEfet: toFrac(num(gRed.querySelector('pAliqEfet'))),
  };
  return red.pRedAliq === undefined && red.pAliqEfet === undefined ? undefined : red;
}

/**
 * Lê o grupo IBS/CBS de um item (`det`).
 */
export function parseItemIbscbs(det: Element): NFeIbscbsGrupo | undefined {
  const ibscbs = det.querySelector('IBSCBS');
  if (!ibscbs) return undefined;

  const gIBSCBS = ibscbs.querySelector('gIBSCBS');
  const gIBSUF = gIBSCBS?.querySelector('gIBSUF');
  const gIBSMun = gIBSCBS?.querySelector('gIBSMun');
  const gCBS = gIBSCBS?.querySelector('gCBS');

  const pIBSUF = num(gIBSUF?.querySelector('pIBSUF'));
  const pIBSMun = num(gIBSMun?.querySelector('pIBSMun'));
  const pCBS = num(gCBS?.querySelector('pCBS'));

  const grupo: NFeIbscbsGrupo = {
    cst: ibscbs.querySelector('CST')?.textContent?.trim() || undefined,
    cClassTrib: ibscbs.querySelector('cClassTrib')?.textContent?.trim() || undefined,
    vBC: num(gIBSCBS?.querySelector('vBC')),
    pIBSUF: toFrac(pIBSUF),
    vIBSUF: num(gIBSUF?.querySelector('vIBSUF')),
    pIBSMun: toFrac(pIBSMun),
    vIBSMun: num(gIBSMun?.querySelector('vIBSMun')),
    pCBS: toFrac(pCBS),
    vCBS: num(gCBS?.querySelector('vCBS')),
    vIBS: num(gIBSCBS?.querySelector('vIBS')),
  };

  // Cada tributo tem o seu próprio gRed: ler só o primeiro descartaria as
  // reduções dos outros dois (o leiaute TCIBS os define separadamente).
  const redUF = lerRed(gIBSUF?.querySelector('gRed'));
  const redMun = lerRed(gIBSMun?.querySelector('gRed'));
  const redCBS = lerRed(gCBS?.querySelector('gRed'));
  if (redUF) grupo.gRedUF = redUF;
  if (redMun) grupo.gRedMun = redMun;
  if (redCBS) grupo.gRedCBS = redCBS;

  // Sem nenhum campo preenchido, o grupo não existe no XML.
  const temCampo = Object.values(grupo).some((v) => v !== undefined);
  if (!temCampo) return undefined;
  return grupo;
}

/**
 * Lê o grupo IS (Imposto Seletivo) de um item (`det`).
 */
export function parseItemIs(det: Element): NFeIsGrupo | undefined {
  const is = det.querySelector('IS');
  if (!is) return undefined;

  const grupo: NFeIsGrupo = {
    cstIs: is.querySelector('CSTIS')?.textContent?.trim() || undefined,
    cClassTribIs: is.querySelector('cClassTribIS')?.textContent?.trim() || undefined,
    vBCIs: num(is.querySelector('vBCIS')),
    pIs: toFrac(num(is.querySelector('pIS'))),
    // pISEspec é alíquota por valor (R$/unidade), não percentual: nunca /100.
    pIsEspec: num(is.querySelector('pISEspec')),
    uTrib: is.querySelector('uTrib')?.textContent?.trim() || undefined,
    qTrib: num(is.querySelector('qTrib')),
    vIs: num(is.querySelector('vIS')),
  };

  const temCampo = Object.values(grupo).some((v) => v !== undefined);
  if (!temCampo) return undefined;
  return grupo;
}

/**
 * Lê os totais de IBS/CBS/IS da nota (`total/IBSCBSTot` e `total/ISTot`).
 */
export function parseIbscbsTotais(infNFe: Element): NFeIbscbsTotais {
  const ibscbsTot = infNFe.querySelector('total IBSCBSTot');
  const istTot = infNFe.querySelector('total ISTot');

  const gIBS = ibscbsTot?.querySelector('gIBS');
  const gCBS = ibscbsTot?.querySelector('gCBS');
  const gIBSUF = gIBS?.querySelector('gIBSUF');
  const gIBSMun = gIBS?.querySelector('gIBSMun');

  return {
    vBCIBSCBS: num(ibscbsTot?.querySelector('vBCIBSCBS')),
    vIBS: num(gIBS?.querySelector('vIBS')) ?? num(gIBSUF?.querySelector('vIBSUF')) ?? undefined,
    vCBS: num(gCBS?.querySelector('vCBS')),
    vIBS_UF: num(gIBSUF?.querySelector('vIBSUF')),
    vIBS_Mun: num(gIBSMun?.querySelector('vIBSMun')),
    vIS: num(istTot?.querySelector('vIS')),
  };
}
