import type { TransacaoBancaria } from '@/components/contas-receber/BaixaAutomaticaDialog.types';

/** Divergência que ainda não virou alerta: guarda a empresa do lote de origem. */
export type DivergenciaPendente = { empresaId: string; transacao: TransacaoBancaria };

/**
 * Une pendências sem perder as de lotes/empresas anteriores. A chave é a empresa
 * mais o id da transação — o mesmo crédito pode voltar em dois lotes da mesma
 * empresa, e aí a segunda tentativa substitui a primeira em vez de duplicar.
 */
export function mesclarPendentes(
  atuais: DivergenciaPendente[],
  novas: DivergenciaPendente[]
): DivergenciaPendente[] {
  const porChave = new Map<string, DivergenciaPendente>();
  for (const pendente of [...atuais, ...novas]) {
    porChave.set(`${pendente.empresaId}:${pendente.transacao.id}`, pendente);
  }
  return [...porChave.values()];
}
