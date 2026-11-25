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
}

export const chaveFundamentoLegal = (cclasstrib: string, cst: string) => `${cclasstrib}|${cst}`;

export const fundamentosVazios = (referencia: string): FundamentosLegais => ({
  porCst: new Map(),
  porCclasstrib: new Map(),
  referencia,
  carregado: false,
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
 * cClassTrib - sem isso o alerta de CST trocado ficaria sem norma.
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

  const { data, error } = await supabase
    .from('catalogo_fundamentacao')
    .select(
      'cclasstrib, cst, conjunto_tributo, descricao_cclasstrib, descricao_cst, texto, texto_curto, referencia_normativa, inicio_vigencia, fim_vigencia'
    )
    .in('cclasstrib', codigos);

  if (error) return resultado;

  for (const bruto of data ?? []) {
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
    resultado.porCst.set(chaveFundamentoLegal(linha.cclasstrib, linha.cst), linha);
    const lista = resultado.porCclasstrib.get(linha.cclasstrib);
    if (lista) lista.push(linha);
    else resultado.porCclasstrib.set(linha.cclasstrib, [linha]);
  }

  return resultado;
}
