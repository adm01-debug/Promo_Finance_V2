import { supabaseDyn as supabase } from '@/lib/supabase-dynamic';
import type { FontesContabeis } from './simulacao-regimes';

/** Rótulos usados na UI para dizer de onde veio o faturamento apurado. */
export const ROTULO_FONTE: Record<FontesContabeis['fonteFaturamento'], string> = {
  notas_fiscais: 'Notas fiscais emitidas',
  contas_receber: 'Títulos a receber (sem notas fiscais no período)',
  sem_dados: 'Nenhuma receita encontrada no período',
};

/** Tamanho da página lida por requisição (teto do `max-rows` do PostgREST). */
const TAMANHO_PAGINA = 1000;
/** Trava de segurança: 100 páginas = 100 mil linhas por consulta. */
const MAX_PAGINAS = 100;

const arredondar = (v: number) => Math.round(v * 100) / 100;

export function janela12m(agora: Date = new Date()): string {
  const d = new Date(agora.getTime());
  d.setFullYear(d.getFullYear() - 1);
  return d.toISOString().slice(0, 10);
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

const TERMOS_FOLHA = [
  'folha',
  'salar',
  'pro-labore',
  'prolabore',
  'pró-labore',
  '13o',
  'decimo terceiro',
  'décimo terceiro',
  'ferias',
  'férias',
  'inss',
  'fgts',
];

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
  const texto =
    `${linha.categoria ?? ''} ${linha.categoria_nome ?? ''} ${linha.descricao ?? ''}`.toLowerCase();
  return TERMOS_FOLHA.some((termo) => texto.includes(termo));
}

interface LinhaNota {
  valor_total: number | null;
  status: string | null;
  cliente_nome: string | null;
  cliente_cnpj: string | null;
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
 * - Compras: só lançamentos de `contas_pagar` com fornecedor identificado.
 *   Folha, impostos e demais despesas internas não geram crédito de CBS/IBS.
 * - Folha: lançamentos de `contas_pagar` classificados como folha/encargos,
 *   usados no Fator R do Simples Nacional.
 */
export async function buscarFontesContabeis(empresaId: string): Promise<FontesContabeis> {
  const inicio = janela12m();

  const notasConsulta = await lerTudo<LinhaNota>((de, ate) =>
    supabase
      .from('notas_fiscais')
      .select('valor_total, status, cliente_nome, cliente_cnpj')
      .eq('empresa_id', empresaId)
      .gte('data_emissao', inicio)
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
        .gte('data_emissao', inicio)
        .order('id', { ascending: true })
        .range(de, ate)
    );
    truncado = truncado || titulos.truncado;
    titulosConsiderados = titulos.linhas.length;
    faturamento = somar(titulos.linhas);
    fonteFaturamento = faturamento > 0 ? 'contas_receber' : 'sem_dados';
  }

  const pagar = await lerTudo<LinhaPagar>((de, ate) =>
    supabase
      .from('contas_pagar')
      .select('valor, status, fornecedor_id, fornecedor_nome, categoria, categoria_nome, descricao')
      .eq('empresa_id', empresaId)
      .is('deleted_at', null)
      .neq('status', 'cancelado')
      .gte('data_emissao', inicio)
      .order('id', { ascending: true })
      .range(de, ate)
  );
  truncado = truncado || pagar.truncado;

  const comFornecedor = pagar.linhas.filter(
    (l) => (l.fornecedor_id ?? '').trim() !== '' || (l.fornecedor_nome ?? '').trim() !== ''
  );
  const folha = pagar.linhas.filter(ehFolha);

  return {
    faturamento12m: arredondar(faturamento),
    comprasServicos12m: arredondar(somar(comFornecedor)),
    folha12m: arredondar(somar(folha)),
    notasConsideradas: notasReceita.length,
    titulosConsiderados,
    fonteFaturamento,
    janelaInicio: inicio,
    truncado,
  };
}
