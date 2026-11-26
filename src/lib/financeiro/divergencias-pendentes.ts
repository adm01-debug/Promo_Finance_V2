import type { TransacaoBancaria } from '@/components/contas-receber/BaixaAutomaticaDialog.types';
import { identidadeConta } from '@/lib/ofx-parser/ofx-sgml';
import type { ExtratoOFX } from '@/lib/ofx-parser';

/**
 * Divergência que ainda não virou alerta: guarda a empresa e a conta de origem
 * do lote em que o crédito entrou.
 */
export type DivergenciaPendente = {
  empresaId: string;
  origemConta: string | null;
  transacao: TransacaoBancaria;
};

/**
 * Conta de origem declarada pelo arquivo (BANKID/BRANCHID/ACCTID). É a identidade
 * do crédito, e não a conta de destino escolhida no lote: o operador pode trocar
 * o destino entre importações sem que o crédito mude. CSV e Excel não trazem o
 * número da conta (o "banco" deles é fixo, de rótulo), então devolvem `null` e as
 * ocorrências ficam sem identidade.
 */
export function origemDoExtrato(extrato: ExtratoOFX): string | null {
  return identidadeConta(extrato.conta);
}

/**
 * Conta que emitiu a transação, segundo o próprio extrato. Vale mais que a conta
 * do arquivo inteiro: um OFX pode trazer vários blocos e cada crédito pertence à
 * conta do seu bloco.
 */
export function origemDaTransacao(transacao: TransacaoBancaria): string | null {
  const origem = transacao.origemConta?.trim();
  return origem ? origem : null;
}

/**
 * Identidade bancária do crédito, quando o extrato a fornece. O FITID é único
 * dentro da conta de origem e não muda entre arquivos sobrepostos, então dois
 * extratos do mesmo período apontam o mesmo crédito; a conta de origem entra na
 * chave porque bancos diferentes podem repetir a mesma referência. Sem referência
 * (CSV, ou OFX sem FITID) ou sem a conta de origem não há como provar que duas
 * pendências são o mesmo lançamento, e a função devolve `null` — aí as
 * ocorrências são preservadas.
 */
export function chaveBancaria(pendente: DivergenciaPendente): string | null {
  const referencia = pendente.transacao.numeroReferencia?.trim();
  if (!referencia || !pendente.origemConta) return null;
  return `${pendente.empresaId}:${pendente.origemConta}:${referencia}`;
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
