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

/** Grupos de dígitos do número da conta, já sem zeros à esquerda. */
function numeroDaConta(valor: string | null | undefined): {
  principal: string;
  digitoVerificador: string;
  grupos: string[];
} {
  const grupos = (valor ?? '')
    .split(/\D+/)
    .map((grupo) => grupo.replace(/^0+/, ''))
    .filter(Boolean);
  return {
    principal: grupos[0] ?? '',
    // Só grupo curto depois do número pode ser dígito verificador; "1234 5678"
    // é agência e conta no mesmo campo, não verificador.
    digitoVerificador: grupos
      .slice(1)
      .filter((grupo) => grupo.length <= 2)
      .join(''),
    grupos,
  };
}

/**
 * Diz se a conta de origem do extrato é a conta cadastrada escolhida como destino.
 * O cadastro é digitado à mão ("00005678-9") e o arquivo traz o número puro, então a
 * comparação é por igualdade do número — aceitando o dígito verificador de apenas um
 * dos lados, porque ele só aparece quando o formatador o separa. Prefixo comum com
 * dígitos extras é outra conta. Devolve `null` quando falta número e código de banco
 * para comparar: aí o chamador não pode afirmar que o destino está errado.
 */
export function origemCompativelComCadastro(
  origem: string | null,
  cadastro: ContaCadastrada | undefined
): boolean | null {
  if (!origem || !cadastro) return null;
  const segmentos = origem.split('/');
  const contaOrigem = numeroDaConta(segmentos[segmentos.length - 1]);
  const banco = segmentos.length > 1 ? segmentos[0].replace(/\D/g, '') : '';
  const cadastradas = [cadastro.conta, cadastro.numero_conta]
    .map(numeroDaConta)
    .filter((conta) => conta.principal);

  if (contaOrigem.principal.length >= 4 && cadastradas.length > 0) {
    return cadastradas.some((conta) => {
      // Cadastro com agência e conta no mesmo campo: o número inteiro basta.
      if (conta.grupos.includes(contaOrigem.principal)) return true;
      if (conta.principal !== contaOrigem.principal) {
        // "00005678-9" contra "56789": o verificador existe só no cadastro.
        return (
          Boolean(conta.digitoVerificador) &&
          conta.principal + conta.digitoVerificador === contaOrigem.principal
        );
      }
      return (
        !conta.digitoVerificador ||
        !contaOrigem.digitoVerificador ||
        conta.digitoVerificador === contaOrigem.digitoVerificador
      );
    });
  }
  // Código de banco é comparado como digitado (3 dígitos, zeros à esquerda valem).
  const codigoBanco = (cadastro.codigo_banco ?? '').replace(/\D/g, '');
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
