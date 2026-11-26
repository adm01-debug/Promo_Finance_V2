// Etapa 82: fundamentacao legal por cClassTrib/CST (LC 214/2025).
//
// `catalogo_cclasstrib` diz **quanto** cada classificacao reduz; esta tabela diz
// **por que**. A leitura e *best effort*, igual as etapas 79-81: catalogo vazio
// significa "sem norma para mostrar", nunca "item irregular" - o alerta fiscal
// continua valido, apenas sem o texto legal ao lado.
import { supabase } from '@/integrations/supabase/client';
import { hojeIso, normalizarReferencia } from './repositorio';

/** Linha vigente de `catalogo_fundamentacao`. */
export interface FundamentoLegal {
  cclasstrib: string;
  cst: string;
  conjuntoTributo: string;
  descricaoCClassTrib: string | null;
  descricaoCST: string | null;
  /** Texto integral publicado pela RFB (pode trazer mais de um artigo). */
  texto: string | null;
  /** Referencia curta da norma, ex.: "LC 214/2025". */
  textoCurto: string | null;
  referenciaNormativa: string | null;
}

/** Norma pronta para exibicao na tela e no PDF. */
export interface FundamentoLegalResumo {
  /** Referencia curta da norma. Ex.: "LC 214/2025". */
  referencia: string;
  /** Texto legal integral. */
  texto: string;
}

export interface FundamentosLegais {
  /** Chave `cclasstrib|cst` para a linha vigente. */
  porCst: Map<string, FundamentoLegal>;
  /** Todas as linhas vigentes do cClassTrib (um par por conjunto de tributos). */
  porCclasstrib: Map<string, FundamentoLegal[]>;
  /** Data usada no recorte de vigencia. */
  referencia: string;
  /** A tabela tem linha vigente? Mesma semantica de `cclasstribCarregado`. */
  carregado: boolean;
  /**
   * Menor `fim_vigencia` entre as linhas vigentes carregadas, ou `null` quando
   * nenhuma declara fim. A norma tambem vence: o pacote guardado offline nao
   * pode sobreviver ao fim da vigencia da fundamentacao.
   */
  fimVigencia: string | null;
  /**
   * A consulta falhou (rede, RLS, PostgREST), ao contrario de "a tabela nao
   * tem linha vigente". Quem grava cache precisa distinguir os dois: falha nao
   * pode apagar o que ja estava guardado.
   */
  falhou: boolean;
}

/**
 * Teto de codigos por consulta `.in()`, o mesmo de `catalogos/cclasstrib.ts`.
 *
 * O PostgREST corta a resposta em `db-max-rows` (1000 linhas no padrao) sem
 * avisar, e aqui cada cClassTrib rende mais de uma linha - uma por conjunto de
 * tributos. Sem o lote, a importacao de muitas notas perderia fundamentos em
 * silencio, que e exatamente o que a etapa 82 existe para mostrar.
 */
const LOTE_CODIGOS = 300;

const consultarFundamentos = (codigos: string[]) =>
  supabase
    .from('catalogo_fundamentacao')
    .select(
      'cclasstrib, cst, conjunto_tributo, descricao_cclasstrib, descricao_cst, texto, texto_curto, referencia_normativa, inicio_vigencia, fim_vigencia'
    )
    .in('cclasstrib', codigos);

type LinhaFundamento = NonNullable<
  Awaited<ReturnType<typeof consultarFundamentos>>['data']
>[number];

export const chaveFundamentoLegal = (cclasstrib: string, cst: string) => `${cclasstrib}|${cst}`;

/**
 * Conjunto que traz a fundamentacao do par CBS+IBS. A API repete o mesmo
 * cClassTrib/CST nos conjuntos de um tributo so, com texto proprio: quando as
 * duas linhas existem, a do conjunto amplo e a que se mostra - sem criterio, a
 * escolha dependeria da ordem em que o PostgREST devolveu as linhas.
 */
const CONJUNTO_AMPLO = 'CBS e IBS';

const ehConjuntoAmplo = (linha: FundamentoLegal): boolean =>
  linha.conjuntoTributo.trim().toLowerCase() === CONJUNTO_AMPLO.toLowerCase();

export const fundamentosVazios = (referencia: string): FundamentosLegais => ({
  porCst: new Map(),
  porCclasstrib: new Map(),
  referencia,
  carregado: false,
  fimVigencia: null,
  falhou: false,
});

// Mesma regra de vigencia de `catalogos/cclasstrib.ts`: linha vale quando
// comeca ate a data de referencia e ainda nao terminou.
const vigenteEm = (
  inicio: string | null | undefined,
  fim: string | null | undefined,
  referencia: string
): boolean => {
  if (!inicio || inicio > referencia) return false;
  if (fim && fim < referencia) return false;
  return true;
};

const primeiraLinha = (texto: string): string =>
  texto
    .split('\n')
    .map((linha) => linha.trim())
    .find(Boolean) ?? texto.trim();

/** Reduz a linha do catalogo ao par norma + texto que a tela exibe. */
export function resumoFundamento(
  linha: FundamentoLegal | undefined | null
): FundamentoLegalResumo | undefined {
  if (!linha) return undefined;
  const texto = (linha.texto ?? '').trim() || (linha.referenciaNormativa ?? '').trim();
  if (!texto) return undefined;
  const referencia = (linha.textoCurto ?? '').trim() || primeiraLinha(texto);
  return { referencia, texto };
}

/**
 * Fundamento do par cClassTrib/CST declarado.
 *
 * O par exato e o caso normal; quando a RFB publica o cClassTrib com outro CST
 * (a divergencia do REG-011, justamente), devolve a primeira linha do
 * cClassTrib - sem isso o alerta de CST trocado ficaria sem norma. A lista ja
 * vem com o conjunto amplo na frente (ver `buscarFundamentosLegais`).
 */
export function escolherFundamento(
  fundamentos: FundamentosLegais,
  cclasstrib: string,
  cst: string
): FundamentoLegal | undefined {
  const codigo = cclasstrib.trim();
  if (!codigo) return undefined;
  const exato = fundamentos.porCst.get(chaveFundamentoLegal(codigo, cst.trim()));
  if (exato) return exato;
  return fundamentos.porCclasstrib.get(codigo)?.[0];
}

/**
 * Carrega os fundamentos vigentes apenas dos cClassTrib que a importacao tocou.
 *
 * Nao lanca: erro de consulta devolve o vazio, como as demais leituras de
 * catalogo. Quem chama nunca precisa tratar excecao para seguir com a
 * validacao.
 */
export async function buscarFundamentosLegais(
  cclasstribs: string[],
  dataReferencia?: string | Date | null
): Promise<FundamentosLegais> {
  const referencia = normalizarReferencia(dataReferencia ?? hojeIso());
  const codigos = [...new Set(cclasstribs.map((c) => c.trim()).filter(Boolean))];
  const resultado = fundamentosVazios(referencia);
  if (codigos.length === 0) return resultado;

  const linhas: LinhaFundamento[] = [];
  for (let i = 0; i < codigos.length; i += LOTE_CODIGOS) {
    const { data, error } = await consultarFundamentos(codigos.slice(i, i + LOTE_CODIGOS));
    if (error) {
      resultado.falhou = true;
      return resultado;
    }
    linhas.push(...(data ?? []));
  }

  for (const bruto of linhas) {
    const linha: FundamentoLegal = {
      cclasstrib: String(bruto.cclasstrib ?? '').trim(),
      cst: String(bruto.cst ?? '').trim(),
      conjuntoTributo: String(bruto.conjunto_tributo ?? '').trim(),
      descricaoCClassTrib: bruto.descricao_cclasstrib ?? null,
      descricaoCST: bruto.descricao_cst ?? null,
      texto: bruto.texto ?? null,
      textoCurto: bruto.texto_curto ?? null,
      referenciaNormativa: bruto.referencia_normativa ?? null,
    };
    if (!linha.cclasstrib) continue;
    if (!vigenteEm(bruto.inicio_vigencia, bruto.fim_vigencia, referencia)) continue;
    resultado.carregado = true;
    const fimVigencia = (bruto.fim_vigencia ?? '').trim().slice(0, 10);
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(fimVigencia) &&
      (resultado.fimVigencia === null || fimVigencia < resultado.fimVigencia)
    ) {
      resultado.fimVigencia = fimVigencia;
    }
    // Mesmo cClassTrib/CST em dois conjuntos: o amplo vence. Guardar o ultimo
    // da resposta faria o item sem fundamento nenhum quando o tributo isolado
    // chegasse depois do conjunto CBS e IBS.
    const chave = chaveFundamentoLegal(linha.cclasstrib, linha.cst);
    const anterior = resultado.porCst.get(chave);
    if (!anterior || (!ehConjuntoAmplo(anterior) && ehConjuntoAmplo(linha))) {
      resultado.porCst.set(chave, linha);
    }
    const lista = resultado.porCclasstrib.get(linha.cclasstrib);
    if (lista) lista.push(linha);
    else resultado.porCclasstrib.set(linha.cclasstrib, [linha]);
  }

  // Ordem estavel das listas: conjunto amplo primeiro, depois conjunto e CST em
  // ordem alfabetica. `escolherFundamento` le a posicao zero quando o par
  // cClassTrib/CST nao existe, e sem o desempate por CST duas linhas do mesmo
  // conjunto dependeriam da ordem que o PostgREST devolveu.
  for (const lista of resultado.porCclasstrib.values()) {
    lista.sort((a, b) => {
      const amplo = Number(ehConjuntoAmplo(b)) - Number(ehConjuntoAmplo(a));
      if (amplo !== 0) return amplo;
      const conjunto = a.conjuntoTributo.localeCompare(b.conjuntoTributo);
      return conjunto !== 0 ? conjunto : a.cst.localeCompare(b.cst);
    });
  }

  return resultado;
}
