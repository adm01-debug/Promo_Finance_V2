import { calcularSimilaridadeTexto } from '@/lib/transaction-matcher/similarity';

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

const MILISSEGUNDOS_POR_DIA = 86_400_000;

function diferencaEmDias(dataCredito: Date, vencimento: string): number {
  return Math.abs(dataCredito.getTime() - new Date(vencimento).getTime()) / MILISSEGUNDOS_POR_DIA;
}

function textoDoCredito(credito: CreditoExtrato): string {
  return [credito.descricao, credito.memo ?? ''].filter(Boolean).join(' ');
}

/**
 * O extrato bancário não traz o id do título: a única prova de quem pagou é o
 * nome do cliente que o banco escreve na descrição do crédito.
 */
export function ehMesmoPagador(credito: CreditoExtrato, titulo: TituloCandidato): boolean {
  const cliente = (titulo.cliente_nome ?? '').trim();
  if (!cliente) return false;
  return calcularSimilaridadeTexto(textoDoCredito(credito), cliente).score >= SIMILARIDADE_PAGADOR;
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
 */
export function conciliarCreditos<T extends TituloCandidato>(
  creditos: CreditoExtrato[],
  titulos: T[]
): Array<T | null> {
  const disponiveis = [...titulos];

  return creditos.map((credito) => {
    const compativeis = titulosCompativeis(credito, disponiveis);
    if (compativeis.length === 0) return null;

    const doPagador = compativeis.filter((titulo) => ehMesmoPagador(credito, titulo));
    if (doPagador.length === 0 && compativeis.length > 1) return null;

    const elegiveis = doPagador.length > 0 ? doPagador : compativeis;
    const [escolhido] = [...elegiveis].sort((a, b) => {
      const porVencimento =
        diferencaEmDias(credito.data, a.data_vencimento) -
        diferencaEmDias(credito.data, b.data_vencimento);
      return porVencimento !== 0 ? porVencimento : a.id.localeCompare(b.id);
    });

    disponiveis.splice(disponiveis.indexOf(escolhido), 1);
    return escolhido;
  });
}
