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

/** Dados cadastrais da conta bancária que bastam para reconhecer a origem. */
export type ContaCadastrada = {
  conta?: string | null;
  numero_conta?: string | null;
  codigo_banco?: string | null;
};

/** Só os dígitos relevantes: "001" e "1" são o mesmo código. */
function digitos(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * Diz se a conta de origem do extrato é a conta cadastrada escolhida como destino.
 * O cadastro é digitado à mão ("1234-5", "00005678-9") e o arquivo traz só o número,
 * então a identidade é confirmada pelo número da conta — aceitando que um seja o
 * começo do outro, porque o dígito verificador costuma existir apenas de um lado.
 * Devolve `null` quando não há número nem código de banco para comparar: aí o
 * chamador não pode afirmar que o destino está errado.
 */
export function origemCompativelComCadastro(
  origem: string | null,
  cadastro: ContaCadastrada | undefined
): boolean | null {
  if (!origem || !cadastro) return null;
  const segmentos = origem.split('/').map(digitos).filter(Boolean);
  const numero = segmentos[segmentos.length - 1] ?? '';
  const banco = segmentos.length > 1 ? segmentos[0] : '';
  const numerosCadastrados = [digitos(cadastro.conta), digitos(cadastro.numero_conta)].filter(
    Boolean
  );

  if (numero.length >= 4 && numerosCadastrados.length > 0) {
    return numerosCadastrados.some(
      (cadastrado) => numero.startsWith(cadastrado) || cadastrado.startsWith(numero)
    );
  }
  const codigoBanco = digitos(cadastro.codigo_banco);
  if (banco && codigoBanco) return banco === codigoBanco;
  return null;
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
