import type { TransacaoBancaria } from '@/components/contas-receber/BaixaAutomaticaDialog.types';

/** Divergência que ainda não virou alerta: guarda a empresa do lote de origem. */
export type DivergenciaPendente = { empresaId: string; transacao: TransacaoBancaria };

/**
 * Identidade bancária do crédito, quando o extrato e o lote a fornecem. O FITID é
 * único dentro da conta de origem e não muda entre arquivos sobrepostos, então
 * dois extratos do mesmo período apontam o mesmo crédito. A conta de origem é
 * parte da identidade: contas diferentes podem repetir a mesma referência, e sem
 * ela dois créditos distintos pareceriam um só. Sem referência (CSV, ou OFX sem
 * FITID) ou sem a conta do lote não há como provar que duas pendências são o
 * mesmo lançamento, e a função devolve `null` — aí as ocorrências são preservadas.
 */
export function chaveBancaria(pendente: DivergenciaPendente): string | null {
  const referencia = pendente.transacao.numeroReferencia?.trim();
  const conta = pendente.transacao.conta_bancaria_id?.trim();
  if (!referencia || !conta) return null;
  return `${pendente.empresaId}:${conta}:${referencia}`;
}

/**
 * Une a fila de alertas pendentes com as divergências do lote atual, mantendo uma
 * entrada por crédito. Uma pendência anterior só é substituída quando o lote atual
 * traz o mesmo crédito identificado pelo banco: se o alerta desta vez foi gravado
 * ela sai da fila, e se falhou de novo a entrada nova assume o lugar. Sem essa
 * identidade as ocorrências se somam — dois PIX iguais no mesmo CSV são dois
 * lançamentos e cada um precisa do seu alerta.
 */
export function mesclarPendentes(
  atuais: DivergenciaPendente[],
  novas: DivergenciaPendente[],
  tentadas: DivergenciaPendente[] = novas
): DivergenciaPendente[] {
  const substituidas = new Set(
    tentadas.map(chaveBancaria).filter((chave): chave is string => chave !== null)
  );
  const mantidas = atuais.filter((pendente) => {
    const chave = chaveBancaria(pendente);
    return chave === null || !substituidas.has(chave);
  });
  return [...mantidas, ...novas];
}
