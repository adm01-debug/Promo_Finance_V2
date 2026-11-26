import { supabaseDyn as supabase } from '@/lib/supabase-dynamic';
import type { FontesContabeis } from './simulacao-regimes';

/** Rótulos usados na UI para dizer de onde veio o faturamento apurado. */
export const ROTULO_FONTE: Record<FontesContabeis['fonteFaturamento'], string> = {
  notas_fiscais: 'Notas fiscais emitidas',
  contas_receber: 'Títulos a receber (sem notas fiscais no período)',
  sem_dados: 'Nenhuma receita encontrada no período',
};

/** Rótulos usados na UI para dizer de onde veio a folha usada no Fator R. */
export const ROTULO_FONTE_FOLHA: Record<FontesContabeis['fonteFolha'], string> = {
  folha_pagamento: 'Folha de Pagamento Mensal (Histórico Financeiro)',
  contas_pagar: 'Títulos de folha/encargos em contas a pagar',
  sem_dados: 'Nenhuma folha apurada no período',
};

/** Tamanho da página lida por requisição (teto do `max-rows` do PostgREST). */
const TAMANHO_PAGINA = 1000;
/** Trava de segurança: 100 páginas = 100 mil linhas por consulta. */
const MAX_PAGINAS = 100;

const arredondar = (v: number) => Math.round(v * 100) / 100;

/**
 * Competências do Fator R: os 12 meses **fechados** anteriores ao mês de
 * apuração. `folha_pagamento.mes_referencia` é o primeiro dia da competência, e um
 * corte por dia (mesmo dia do mês anterior) descartaria a competência de fronteira
 * e aceitaria competências futuras já cadastradas.
 *
 * A mesma janela vale para receita e compras: o Fator R é folha ÷ receita dos
 * **mesmos** meses — cortar a receita um dia antes (ou aceitar o mês corrente
 * ainda incompleto) infla ou derruba o ratio na fronteira dos 28%.
 */
export function janela12Competencias(agora: Date = new Date()): { inicio: string; fim: string } {
  const inicio = new Date(Date.UTC(agora.getFullYear(), agora.getMonth() - 12, 1));
  const fim = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), 1));
  return { inicio: inicio.toISOString().slice(0, 10), fim: fim.toISOString().slice(0, 10) };
}

type LinhaValor = { valor?: number | null; valor_total?: number | null };

function somar(linhas: LinhaValor[]): number {
  return linhas.reduce((acc, l) => acc + Number(l.valor_total ?? l.valor ?? 0), 0);
}

/** Página crua devolvida pelo PostgREST (o tipo real é ajustado no call site). */
type PaginaCrua = { data: unknown[] | null; error: unknown };

/**
 * Lê **todas** as linhas de uma consulta. O PostgREST corta em `max-rows`
 * (1.000 por padrão) e a tela somava só a primeira página — totais anuais
 * ficavam subestimados sem nenhum aviso. Paginamos até a primeira página
 * incompleta; se a trava de segurança for atingida, `truncado` avisa a UI.
 */
async function lerTudo<T>(
  buscarPagina: (de: number, ate: number) => PromiseLike<PaginaCrua>
): Promise<{ linhas: T[]; truncado: boolean }> {
  const linhas: T[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const de = pagina * TAMANHO_PAGINA;
    const { data, error } = await buscarPagina(de, de + TAMANHO_PAGINA - 1);
    if (error) throw error;
    const lote = (data ?? []) as T[];
    linhas.push(...lote);
    if (lote.length < TAMANHO_PAGINA) return { linhas, truncado: false };
  }
  return { linhas, truncado: true };
}

/** Remove acentos e caixa — a descrição do título é texto livre digitado pelo usuário. */
const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Termos de folha aceitos na categoria do lançamento (campo estruturado). */
const TERMOS_FOLHA_CATEGORIA = [
  'folha',
  'salar',
  'pro-labore',
  'prolabore',
  '13o',
  'decimo terceiro',
  'ferias',
  'inss',
  'fgts',
];

/**
 * Termos aceitos na descrição livre. Aqui `folha` sozinho não basta: "Folhas de
 * papel A4" é compra com fornecedor e gera crédito de CBS/IBS, não folha salarial.
 */
const TERMOS_FOLHA_DESCRICAO = [
  'folha de pagamento',
  'folha salarial',
  'folha mensal',
  'folha de salario',
  'folha de funcionario',
  'folha dos funcionarios',
  'pro-labore',
  'prolabore',
  'salario',
  'salarios',
  '13o salario',
  'decimo terceiro',
  'ferias',
  'inss',
  'fgts',
];

/**
 * Rescisão só é folha com contexto trabalhista: `rescisao` sozinho pegaria
 * "rescisão de contrato de fornecimento", que é compra com fornecedor e gera
 * crédito de CBS/IBS. "Rescisão do funcionário" chega sem categoria de folha,
 * então o termo não pode depender da preposição usada na descrição.
 */
const CONTEXTO_RESCISAO_TRABALHISTA =
  /(rescis.*(funcionari|empregad|colaborador|trabalhista)|verbas rescis)/;

interface LinhaPagar {
  valor: number | null;
  status: string | null;
  fornecedor_id: string | null;
  fornecedor_nome: string | null;
  categoria: string | null;
  categoria_nome: string | null;
  descricao: string | null;
}

function ehFolha(linha: LinhaPagar): boolean {
  const categoria = semAcento(`${linha.categoria ?? ''} ${linha.categoria_nome ?? ''}`);
  if (TERMOS_FOLHA_CATEGORIA.some((termo) => categoria.includes(termo))) return true;
  const descricao = semAcento(linha.descricao ?? '');
  if (CONTEXTO_RESCISAO_TRABALHISTA.test(descricao)) return true;
  return TERMOS_FOLHA_DESCRICAO.some((termo) => descricao.includes(termo));
}

interface LinhaNota {
  valor_total: number | null;
  status: string | null;
  cliente_nome: string | null;
  cliente_cnpj: string | null;
}

/** Linha de `folha_pagamento` — o Histórico Financeiro grava o total em `valor_total`. */
interface LinhaFolha {
  mes_referencia?: string | null;
  valor_total: number | null;
  total_folha: number | null;
  salarios: number | null;
  encargos: number | null;
  beneficios: number | null;
  pro_labore: number | null;
}

/**
 * Remuneração da linha (salários + pró-labore), que é a base da CPP patronal.
 * Sem detalhamento, presume o total da competência menos encargos e benefícios —
 * antes a linha valia zero e só o somatório geral caía no fallback, então uma
 * competência sem detalhe zerava a própria fatia do Fator R.
 */
function remuneracaoDaLinhaFolha(l: LinhaFolha): number {
  const salarios = Number(l.salarios ?? 0);
  const proLabore = Number(l.pro_labore ?? 0);
  if (salarios > 0 || proLabore > 0) return salarios + proLabore;
  const total = valorDaLinhaFolha(l);
  if (total <= 0) return 0;
  return Math.max(0, total - Number(l.encargos ?? 0) - Number(l.beneficios ?? 0));
}

function valorDaLinhaFolha(l: LinhaFolha): number {
  const total = Number(l.valor_total ?? l.total_folha ?? 0);
  if (total > 0) return total;
  return (
    Number(l.salarios ?? 0) +
    Number(l.encargos ?? 0) +
    Number(l.beneficios ?? 0) +
    Number(l.pro_labore ?? 0)
  );
}

/**
 * Apura faturamento, compras e folha dos últimos 12 meses no próprio sistema.
 *
 * - Faturamento: notas fiscais não canceladas; quando nenhuma nota do período
 *   tem cliente identificado, todas contam como venda. `notas_fiscais` não
 *   guarda a direção da operação (não existe coluna `tipo`/`fornecedor`), então
 *   a presença do cliente é o único sinal de venda disponível — sem ele as
 *   notas de compra inflariam a receita. Sem nota alguma, cai para os títulos
 *   a receber.
 * - Compras: só lançamentos de `contas_pagar` com fornecedor identificado e que
 *   não sejam folha/encargos (o formulário exige fornecedor também na folha, e
 *   a folha não gera crédito de CBS/IBS).
 * - Folha: `folha_pagamento` (Histórico Financeiro) tem precedência; na
 *   ausência dela, lançamentos de `contas_pagar` classificados como
 *   folha/encargos. Alimenta o Fator R do Simples Nacional.
 */
export async function buscarFontesContabeis(empresaId: string): Promise<FontesContabeis> {
  const { inicio: inicioJanela, fim: fimJanela } = janela12Competencias();

  const notasConsulta = await lerTudo<LinhaNota>((de, ate) =>
    supabase
      .from('notas_fiscais')
      .select('valor_total, status, cliente_nome, cliente_cnpj')
      .eq('empresa_id', empresaId)
      .gte('data_emissao', inicioJanela)
      .lt('data_emissao', fimJanela)
      .order('id', { ascending: true })
      .range(de, ate)
  );

  const notasValidas = notasConsulta.linhas.filter(
    (n) => (n.status ?? '').toLowerCase() !== 'cancelada'
  );
  const notasComCliente = notasValidas.filter(
    (n) => (n.cliente_cnpj ?? '').trim() !== '' || (n.cliente_nome ?? '').trim() !== ''
  );
  const notasReceita = notasComCliente.length > 0 ? notasComCliente : notasValidas;

  let faturamento = somar(notasReceita);
  let titulosConsiderados = 0;
  let fonteFaturamento: FontesContabeis['fonteFaturamento'] = 'notas_fiscais';
  let truncado = notasConsulta.truncado;

  if (faturamento <= 0) {
    const titulos = await lerTudo<LinhaValor>((de, ate) =>
      supabase
        .from('contas_receber')
        .select('valor, status')
        .eq('empresa_id', empresaId)
        .is('deleted_at', null)
        .neq('status', 'cancelado')
        .gte('data_emissao', inicioJanela)
        .lt('data_emissao', fimJanela)
        .order('id', { ascending: true })
        .range(de, ate)
    );
    truncado = truncado || titulos.truncado;
    titulosConsiderados = titulos.linhas.length;
    faturamento = somar(titulos.linhas);
    fonteFaturamento = faturamento > 0 ? 'contas_receber' : 'sem_dados';
  }

  const folhaMensal = await lerTudo<LinhaFolha>((de, ate) =>
    supabase
      .from('folha_pagamento')
      .select(
        'mes_referencia, valor_total, total_folha, salarios, encargos, beneficios, pro_labore'
      )
      .eq('empresa_id', empresaId)
      .gte('mes_referencia', inicioJanela)
      .lt('mes_referencia', fimJanela)
      .order('id', { ascending: true })
      .range(de, ate)
  );
  truncado = truncado || folhaMensal.truncado;
  const totalFolhaMensal = arredondar(
    folhaMensal.linhas.reduce((acc, l) => acc + valorDaLinhaFolha(l), 0)
  );
  // CPP patronal (20% + RAT) incide sobre a remuneração paga — salários e pró-labore —,
  // não sobre os encargos lançados na mesma competência. A soma é por competência:
  // um mês gravado só com `valor_total` ainda entra pelo fallback da linha.
  const remuneracaoPorCompetencia = new Map<string, number>();
  for (const linha of folhaMensal.linhas) {
    const competencia = linha.mes_referencia ?? '';
    remuneracaoPorCompetencia.set(
      competencia,
      (remuneracaoPorCompetencia.get(competencia) ?? 0) + remuneracaoDaLinhaFolha(linha)
    );
  }
  const remuneracaoMensal = arredondar(
    [...remuneracaoPorCompetencia.values()].reduce((acc, v) => acc + v, 0)
  );

  const pagar = await lerTudo<LinhaPagar>((de, ate) =>
    supabase
      .from('contas_pagar')
      .select('valor, status, fornecedor_id, fornecedor_nome, categoria, categoria_nome, descricao')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .neq('status', 'cancelado')
      .gte('data_emissao', inicioJanela)
      .lt('data_emissao', fimJanela)
      .order('id', { ascending: true })
      .range(de, ate)
  );
  truncado = truncado || pagar.truncado;

  const comFornecedor = pagar.linhas.filter(
    (l) =>
      ((l.fornecedor_id ?? '').trim() !== '' || (l.fornecedor_nome ?? '').trim() !== '') &&
      !ehFolha(l)
  );
  const folhaTitulos = arredondar(somar(pagar.linhas.filter(ehFolha)));

  // A folha mensal do Histórico Financeiro é a fonte primária do Fator R; os
  // títulos de `contas_pagar` só entram quando não há folha lançada no período,
  // para não somar a mesma despesa duas vezes.
  const folha12m = totalFolhaMensal > 0 ? totalFolhaMensal : folhaTitulos;
  const fonteFolha: FontesContabeis['fonteFolha'] =
    totalFolhaMensal > 0 ? 'folha_pagamento' : folhaTitulos > 0 ? 'contas_pagar' : 'sem_dados';
  // Base da CPP patronal. Sem detalhamento (lançamentos de folha em contas a pagar
  // ou folha sem salários/Pró-labore separados) cai na folha total, como antes.
  const remuneracao12m = arredondar(
    totalFolhaMensal > 0 && remuneracaoMensal > 0 ? remuneracaoMensal : folha12m
  );

  return {
    faturamento12m: arredondar(faturamento),
    comprasServicos12m: arredondar(somar(comFornecedor)),
    folha12m,
    remuneracao12m,
    notasConsideradas: notasReceita.length,
    titulosConsiderados,
    fonteFaturamento,
    fonteFolha,
    janelaInicio: inicioJanela,
    truncado,
  };
}
