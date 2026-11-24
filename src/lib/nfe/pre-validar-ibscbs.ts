/**
 * Pré-validação do grupo IBS/CBS/IS antes de enviar a NF-e ao Bling/SEFAZ
 * (etapa 54 do plano RT/RFB).
 *
 * Cobre as rejeições que o leiaute da NT 2025.002 devolve depois do envio, mas
 * aqui com mensagem em PT-BR e antes de gastar uma tentativa na SEFAZ:
 *
 *   - UB12-10: CRT 3 (regime regular) exige o grupo IBSCBS a partir de
 *     03/08/2026 — nota sem grupo é rejeitada.
 *   - rejeição 1091: o total da nota tem de ser exatamente a soma dos itens.
 *   - CST × cClassTrib: os dois andam juntos; item com um e sem o outro é
 *     inválido no leiaute.
 *   - `vIBS = vIBSUF + vIBSMun`: o total de IBS do item é a soma das parcelas.
 *
 * Funções puras, sem acesso a banco: quem chama passa os itens e, quando
 * tiver, o catálogo de cClassTrib vigente (etapa 37). Catálogo vazio não
 * bloqueia nada — sem referência, não há o que afirmar (mesma política de
 * `catalogos/cclasstrib.ts`).
 */

/** Data a partir da qual o grupo IBSCBS é obrigatório para o CRT 3. */
export const INICIO_OBRIGATORIEDADE_IBSCBS = '2026-08-03';

export type Severidade = 'erro' | 'aviso';

export interface ItemNFeIbscbs {
  /** Número do item na nota (1-based), como sai no XML. */
  nItem: number;
  cst?: string;
  cClassTrib?: string;
  vBC?: number;
  /** Percentual no XML (11.3), não fração. */
  pIBSUF?: number;
  vIBSUF?: number;
  pIBSMun?: number;
  vIBSMun?: number;
  pCBS?: number;
  vCBS?: number;
  /** Total de IBS do item. Se ausente, é calculado como UF + Mun. */
  vIBS?: number;
}

export interface TotaisNFeIbscbs {
  vBCIBSCBS?: number;
  vIBS?: number;
  vCBS?: number;
}

export interface ContextoValidacao {
  /** CRT da empresa emitente (1 = Simples, 2 = Simples excesso, 3 = Regime Normal). */
  crt?: number;
  /** Data de emissão no formato `YYYY-MM-DD`. */
  dataEmissao: string;
  itens: ItemNFeIbscbs[];
  totais?: TotaisNFeIbscbs;
  /** cClassTrib vigentes conhecidos. Vazio/ausente = sem referência para comparar. */
  cclasstribVigentes?: ReadonlySet<string>;
}

export interface AchadoValidacao {
  regra: string;
  severidade: Severidade;
  /** Mensagem pronta para exibir ao usuário, em PT-BR. */
  mensagem: string;
  nItem?: number;
}

export interface ResultadoPreValidacao {
  /** `true` só quando não há nenhum achado de severidade `erro`. */
  podeEnviar: boolean;
  achados: AchadoValidacao[];
}

const CENTAVOS = 100;

/** Comparação monetária em centavos, para não depender de igualdade de float. */
const emCentavos = (v: number): number => Math.round(v * CENTAVOS);

const fmt = (v: number): string =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Soma valores monetários sem arrastar erro de ponto flutuante. */
const somar = (valores: Array<number | undefined>): number =>
  valores.reduce<number>((acc, v) => acc + (v ? emCentavos(v) : 0), 0) / CENTAVOS;

/** Item da nota como o formulário/importador monta (etapa 52). */
export interface ItemNotaComGrupo {
  nItem: number;
  cstIbsCbs?: string;
  cClassTrib?: string;
  vBCIbsCbs?: number;
  pIBSUF?: number;
  vIBSUF?: number;
  pIBSMun?: number;
  vIBSMun?: number;
  pCBS?: number;
  vCBS?: number;
  vIBS?: number;
}

/**
 * Adapta um item de nota (camelCase com sufixo `IbsCbs`, como o formulário
 * guarda) para o formato aceito por `preValidarIbscbs`.
 */
export function adaptarItem(item: ItemNotaComGrupo): ItemNFeIbscbs {
  return {
    nItem: item.nItem,
    cst: item.cstIbsCbs,
    cClassTrib: item.cClassTrib,
    vBC: item.vBCIbsCbs,
    pIBSUF: item.pIBSUF,
    vIBSUF: item.vIBSUF,
    pIBSMun: item.pIBSMun,
    vIBSMun: item.vIBSMun,
    pCBS: item.pCBS,
    vCBS: item.vCBS,
    vIBS: item.vIBS,
  };
}

/**
 * Valida o grupo IBS/CBS/IS de uma NF-e.
 *
 * Devolve todos os achados encontrados (não para no primeiro) para que a UI
 * consiga listar tudo de uma vez em vez de exigir uma tentativa por erro.
 */
export function preValidarIbscbs(ctx: ContextoValidacao): ResultadoPreValidacao {
  const achados: AchadoValidacao[] = [];
  const { itens, totais, crt, dataEmissao } = ctx;
  const temGrupo = itens.some((i) => i.cst !== undefined && i.cst !== '');
  const semGrupo = itens.filter((i) => i.cst === undefined || i.cst === '');

  // UB12-10: CRT 3 a partir de 03/08/2026 não pode emitir nota sem o grupo.
  // A obrigatoriedade é por item: um item sem CST já basta para a rejeição.
  if (crt === 3 && dataEmissao >= INICIO_OBRIGATORIEDADE_IBSCBS && semGrupo.length > 0) {
    const todos = semGrupo.length === itens.length;
    achados.push({
      regra: 'UB12-10',
      severidade: 'erro',
      mensagem: todos
        ? `Nota de regime regular (CRT 3) emitida a partir de 03/08/2026 precisa do grupo IBS/CBS. ` +
          `Informe CST e cClassTrib em todos os itens.`
        : `Nota de regime regular (CRT 3) emitida a partir de 03/08/2026 precisa do grupo IBS/CBS ` +
          `em todos os itens. Sem grupo: ${semGrupo.map((i) => `item ${i.nItem}`).join(', ')}.`,
      nItem: todos ? undefined : semGrupo[0].nItem,
    });
  }

  for (const item of itens) {
    const temCst = item.cst !== undefined && item.cst !== '';
    const temCClassTrib = item.cClassTrib !== undefined && item.cClassTrib !== '';

    // CST e cClassTrib são obrigatórios juntos no leiaute.
    if (temCst !== temCClassTrib) {
      achados.push({
        regra: 'CST_CLASSTRIB',
        severidade: 'erro',
        mensagem: temCst
          ? `Item ${item.nItem}: CST ${item.cst} informado sem cClassTrib. Os dois campos andam juntos.`
          : `Item ${item.nItem}: cClassTrib ${item.cClassTrib} informado sem CST. Os dois campos andam juntos.`,
        nItem: item.nItem,
      });
    }

    if (temCst && item.cst && !/^\d{3}$/.test(item.cst)) {
      achados.push({
        regra: 'CST_FORMATO',
        severidade: 'erro',
        mensagem: `Item ${item.nItem}: CST "${item.cst}" deve ter exatamente 3 dígitos.`,
        nItem: item.nItem,
      });
    }

    if (temCClassTrib && item.cClassTrib && !/^\d{6}$/.test(item.cClassTrib)) {
      achados.push({
        regra: 'CCLASSTRIB_FORMATO',
        severidade: 'erro',
        mensagem: `Item ${item.nItem}: cClassTrib "${item.cClassTrib}" deve ter exatamente 6 dígitos.`,
        nItem: item.nItem,
      });
    }

    // Só compara com o catálogo quando ele tem conteúdo (etapa 37).
    if (
      temCClassTrib &&
      item.cClassTrib &&
      ctx.cclasstribVigentes &&
      ctx.cclasstribVigentes.size > 0
    ) {
      if (!ctx.cclasstribVigentes.has(item.cClassTrib)) {
        achados.push({
          regra: 'CCLASSTRIB_INEXISTENTE',
          severidade: 'erro',
          mensagem:
            `Item ${item.nItem}: cClassTrib ${item.cClassTrib} não existe no catálogo vigente da RFB. ` +
            `Escolha um código da lista.`,
          nItem: item.nItem,
        });
      }
    }

    // vIBS do item = vIBSUF + vIBSMun.
    const somaParcelas = somar([item.vIBSUF, item.vIBSMun]);
    if (item.vIBS !== undefined && emCentavos(item.vIBS) !== emCentavos(somaParcelas)) {
      achados.push({
        regra: 'VIBS_SOMA',
        severidade: 'erro',
        mensagem:
          `Item ${item.nItem}: vIBS ${fmt(item.vIBS)} não é a soma de vIBSUF ${fmt(item.vIBSUF ?? 0)} ` +
          `+ vIBSMun ${fmt(item.vIBSMun ?? 0)} (${fmt(somaParcelas)}).`,
        nItem: item.nItem,
      });
    }

    // Valor destacado sem base de cálculo indica payload incompleto.
    if ((item.vCBS ?? 0) > 0 && (item.vBC ?? 0) <= 0) {
      achados.push({
        regra: 'BASE_AUSENTE',
        severidade: 'erro',
        mensagem: `Item ${item.nItem}: vCBS ${fmt(item.vCBS!)} informado com base de cálculo zerada.`,
        nItem: item.nItem,
      });
    }
  }

  // Rejeição 1091: o total da nota tem de ser a soma dos itens.
  if (totais) {
    const somas = {
      vIBS: somar(itens.map((i) => i.vIBS ?? somar([i.vIBSUF, i.vIBSMun]))),
      vCBS: somar(itens.map((i) => i.vCBS)),
    };

    if (totais.vIBS !== undefined && emCentavos(totais.vIBS) !== emCentavos(somas.vIBS)) {
      achados.push({
        regra: '1091_VALOR',
        severidade: 'erro',
        mensagem:
          `Total de IBS da nota (${fmt(totais.vIBS)}) difere da soma dos itens ` +
          `(${fmt(somas.vIBS)}). A SEFAZ rejeita com o código 1091.`,
      });
    }

    if (totais.vCBS !== undefined && emCentavos(totais.vCBS) !== emCentavos(somas.vCBS)) {
      achados.push({
        regra: '1091_VALOR',
        severidade: 'erro',
        mensagem:
          `Total de CBS da nota (${fmt(totais.vCBS)}) difere da soma dos itens ` +
          `(${fmt(somas.vCBS)}). A SEFAZ rejeita com o código 1091.`,
      });
    }
  }

  // Nota com grupo mas sem totais: o leiaute exige total/IBSCBSTot.
  if (temGrupo && !totais) {
    achados.push({
      regra: 'TOTAL_AUSENTE',
      severidade: 'aviso',
      mensagem:
        'A nota tem grupo IBS/CBS nos itens mas não informa os totais. ' +
        'O leiaute exige o grupo total/IBSCBSTot.',
    });
  }

  return {
    podeEnviar: !achados.some((a) => a.severidade === 'erro'),
    achados,
  };
}
