import { calcularSimilaridadeTexto, normalizarTexto } from '@/lib/transaction-matcher/similarity';

export interface TituloCandidato {
  id: string;
  valor: number | null;
  data_vencimento: string;
  cliente_nome: string | null;
}

export interface CreditoExtrato {
  valor: number;
  data: Date;
  descricao: string;
  memo?: string | null;
}

/** Mesma tolerância já usada na baixa automática: R$ 0,05 e 5 dias. */
export const TOLERANCIA_VALOR = 0.05;
export const TOLERANCIA_DIAS = 5;

/** Similaridade mínima para afirmar que o crédito é do cliente do título. */
const SIMILARIDADE_PAGADOR = 0.3;

/**
 * Acima disso a descrição identifica o cliente pelo nome. Um sobrenome em
 * comum (`PIX ANA SILVA` x `Maria Silva` pontua 0,40) fica abaixo: sozinho ele
 * não pode disputar com quem teve o nome inteiro reconhecido nem decidir a
 * baixa entre clientes diferentes.
 */
const SIMILARIDADE_IDENTIFICACAO = 0.6;

const MILISSEGUNDOS_POR_DIA = 86_400_000;

function diferencaEmDias(dataCredito: Date, vencimento: string): number {
  return Math.abs(dataCredito.getTime() - new Date(vencimento).getTime()) / MILISSEGUNDOS_POR_DIA;
}

function textoDoCredito(credito: CreditoExtrato): string {
  return [credito.descricao, credito.memo ?? ''].filter(Boolean).join(' ');
}

function scorePagador(credito: CreditoExtrato, titulo: TituloCandidato): number {
  const cliente = (titulo.cliente_nome ?? '').trim();
  if (!cliente) return 0;
  return calcularSimilaridadeTexto(textoDoCredito(credito), cliente).score;
}

function chaveDoCliente(titulo: TituloCandidato): string {
  return normalizarTexto(titulo.cliente_nome ?? '');
}

/**
 * O extrato bancário não traz o id do título: a única prova de quem pagou é o
 * nome do cliente que o banco escreve na descrição do crédito.
 */
export function ehMesmoPagador(credito: CreditoExtrato, titulo: TituloCandidato): boolean {
  return scorePagador(credito, titulo) >= SIMILARIDADE_PAGADOR;
}

/**
 * Compara em centavos inteiros: valores monetários guardados como double
 * produzem diferenças do mesmo número de centavos ligeiramente distintas
 * (R$ 100,00 e R$ 100,02 estão ambos a 1 centavo de R$ 100,01, mas viram
 * 0,010000000000005 e 0,009999999999991), e essa diferença artificial fazia o
 * título mais distante da data do crédito vencer.
 */
function emCentavos(valor: number | null | undefined): number {
  return Math.round(Number(valor ?? 0) * 100);
}

/**
 * Entre candidatos com a mesma evidência de pagador, o valor exato vence o
 * valor apenas tolerado: quitar o título de R$ 100,04 recebendo R$ 100 e
 * deixar o de R$ 100 em aberto é o pagamento errado. O vencimento desempata.
 */
function ordemDeEscolha<T extends TituloCandidato>(credito: CreditoExtrato, a: T, b: T): number {
  const centavosDoCredito = emCentavos(credito.valor);
  const porValor =
    Math.abs(emCentavos(a.valor) - centavosDoCredito) -
    Math.abs(emCentavos(b.valor) - centavosDoCredito);
  if (porValor !== 0) return porValor;

  const porVencimento =
    diferencaEmDias(credito.data, a.data_vencimento) -
    diferencaEmDias(credito.data, b.data_vencimento);
  return porVencimento !== 0 ? porVencimento : a.id.localeCompare(b.id);
}

export function titulosCompativeis<T extends TituloCandidato>(
  credito: CreditoExtrato,
  titulos: T[]
): T[] {
  return titulos.filter(
    (titulo) =>
      Math.abs(Number(titulo.valor ?? 0) - credito.valor) <= TOLERANCIA_VALOR &&
      diferencaEmDias(credito.data, titulo.data_vencimento) <= TOLERANCIA_DIAS
  );
}

/**
 * Decide, para cada crédito do extrato, qual título ele quita — e devolve
 * `null` quando a decisão não é segura.
 *
 * Valor e vencimento sozinhos não identificam o pagador: dois créditos do
 * mesmo valor faziam o segundo quitar o título de OUTRO cliente que só tinha
 * valor e data parecidos. A regra é: quando a descrição do crédito aponta o
 * cliente, só os títulos desse cliente são elegíveis; quando não aponta e há
 * mais de um título compatível, o crédito vira divergência para vínculo
 * manual em vez de baixar um título que não foi pago. Cada título quita no
 * máximo um crédito.
 *
 * A evidência do nome é graduada: quem teve o nome completo reconhecido vence
 * quem só compartilha um sobrenome, e sobrenome em comum apontando para
 * clientes diferentes não decide nada (vai para o vínculo manual).
 */
export function conciliarCreditos<T extends TituloCandidato>(
  creditos: CreditoExtrato[],
  titulos: T[]
): Array<T | null> {
  const disponiveis = [...titulos];

  return creditos.map((credito) => {
    const compativeis = titulosCompativeis(credito, disponiveis);
    if (compativeis.length === 0) return null;

    const pontuados = compativeis
      .map((titulo) => ({ titulo, score: scorePagador(credito, titulo) }))
      .filter(({ score }) => score >= SIMILARIDADE_PAGADOR);

    if (pontuados.length === 0) {
      // Nenhuma prova de quem pagou: só um único título compatível é aceito.
      if (compativeis.length > 1) return null;
      const [escolhido] = [...compativeis].sort((a, b) => ordemDeEscolha(credito, a, b));
      disponiveis.splice(disponiveis.indexOf(escolhido), 1);
      return escolhido;
    }

    // Só a melhor evidência concorre: o nome inteiro reconhecido não disputa
    // com um sobrenome em comum.
    const melhor = Math.max(...pontuados.map(({ score }) => score));
    const melhores = pontuados.filter(({ score }) => score >= melhor);
    const clientes = new Set(melhores.map(({ titulo }) => chaveDoCliente(titulo)));
    if (clientes.size > 1 && melhor < SIMILARIDADE_IDENTIFICACAO) return null;

    const [escolhido] = melhores
      .map(({ titulo }) => titulo)
      .sort((a, b) => ordemDeEscolha(credito, a, b));

    disponiveis.splice(disponiveis.indexOf(escolhido), 1);
    return escolhido;
  });
}
