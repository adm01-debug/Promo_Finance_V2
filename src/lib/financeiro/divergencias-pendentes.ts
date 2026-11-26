import type { TransacaoBancaria } from '@/components/contas-receber/BaixaAutomaticaDialog.types';

/** Divergência que ainda não virou alerta: guarda a empresa do lote de origem. */
export type DivergenciaPendente = { empresaId: string; transacao: TransacaoBancaria };

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

/**
 * Identidade do crédito entre lotes. O `id` da transação carrega a posição no
 * arquivo (e, no CSV, o horário da leitura), então extratos sobrepostos trariam o
 * mesmo PIX com ids diferentes e a fila gravaria dois alertas. A referência do
 * banco (FITID) é estável; sem ela caímos em data + valor + descrição, que também
 * não mudam entre arquivos do mesmo período.
 */
export function chaveDaDivergencia(pendente: DivergenciaPendente): string {
  const { empresaId, transacao } = pendente;
  const identidade = transacao.numeroReferencia?.trim() || normalizar(transacao.descricao ?? '');
  const data = transacao.data instanceof Date ? transacao.data.toISOString().slice(0, 10) : '';
  return `${empresaId}:${identidade}:${data}:${Math.round((transacao.valor ?? 0) * 100)}`;
}

/**
 * Une a fila de alertas pendentes com as divergências do lote atual. Entradas
 * antigas cujo crédito voltou a aparecer são descartadas: se o alerta desta vez
 * foi gravado, a pendência deixou de existir; se falhou de novo, a entrada nova
 * assume o lugar — sem duplicar o alerta na próxima tentativa.
 */
export function mesclarPendentes(
  atuais: DivergenciaPendente[],
  novas: DivergenciaPendente[],
  tentadas: DivergenciaPendente[] = novas
): DivergenciaPendente[] {
  const substituidas = new Set(tentadas.map(chaveDaDivergencia));
  const porChave = new Map<string, DivergenciaPendente>();
  for (const pendente of atuais) {
    if (substituidas.has(chaveDaDivergencia(pendente))) continue;
    porChave.set(chaveDaDivergencia(pendente), pendente);
  }
  for (const pendente of novas) {
    porChave.set(chaveDaDivergencia(pendente), pendente);
  }
  return [...porChave.values()];
}
