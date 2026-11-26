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

/**
 * Leitura do campo "conta" de cada lado. O número vem com o dígito verificador
 * separado ou colado ("56789-1", "567891", "1234 5678"), então cada lado precisa
 * expor a sequência inteira, o número sem o verificador e o verificador declarado.
 */
type NumeroConta = {
  /** Todos os dígitos do campo, sem zeros de preenchimento. */
  sequencia: string;
  /** Número da conta, sem o dígito verificador. */
  base: string;
  /** Dígito verificador separado no campo, ou `null` quando não há. */
  digitoVerificador: string | null;
  /** Grupos de dígitos, para o cadastro digitado como "1234 5678" (agência e conta). */
  grupos: string[];
};

function numeroDaConta(valor: string | null | undefined): NumeroConta {
  const grupos = (valor ?? '').split(/\D+/).filter(Boolean);
  const ultimo = grupos[grupos.length - 1] ?? '';
  // Só grupo curto depois do número pode ser dígito verificador: "1234 5678" é
  // agência e conta no mesmo campo, não verificador.
  const separaDigito = grupos.length > 1 && ultimo.length <= 2;
  return {
    sequencia: grupos.join('').replace(/^0+/, ''),
    base: (separaDigito ? grupos.slice(0, -1) : grupos).join('').replace(/^0+/, ''),
    // Zeros à esquerda do verificador são preenchimento, mas o verificador `0`
    // continua sendo um dígito e não pode virar campo vazio.
    digitoVerificador: separaDigito ? ultimo.replace(/^0+/, '') || '0' : null,
    grupos: grupos.map((grupo) => grupo.replace(/^0+/, '') || '0'),
  };
}

/** Compara o número do crédito com o número cadastrado, sem aceitar prefixo. */
function contasCompativeis(origem: NumeroConta, cadastro: NumeroConta): boolean {
  // Mesma sequência de dígitos: "56789-1" e "567891" são a mesma conta.
  if (origem.sequencia === cadastro.sequencia) return true;
  if (origem.digitoVerificador && cadastro.digitoVerificador) {
    // Os dois lados dizem qual é o dígito verificador: ele tem de bater.
    return origem.base === cadastro.base && origem.digitoVerificador === cadastro.digitoVerificador;
  }
  if (origem.digitoVerificador || cadastro.digitoVerificador) {
    // Um lado só acrescenta o verificador ("00005678-9" contra "5678"): aí vale o número.
    const comDigito = origem.digitoVerificador ? origem : cadastro;
    const semDigito = origem.digitoVerificador ? cadastro : origem;
    return comDigito.base === semDigito.sequencia;
  }
  // Nenhum lado separa o verificador: o número tem de ser o mesmo — inclusive quando
  // o cadastro guarda agência e conta num campo só ("1234 5678").
  return cadastro.grupos.includes(origem.sequencia) || origem.grupos.includes(cadastro.sequencia);
}

/**
 * Diz se a conta de origem do extrato é a conta cadastrada escolhida como destino.
 * O cadastro é digitado à mão ("00005678-9", "1234 5678") e o arquivo traz banco,
 * agência e conta separados por barra, então a comparação é por igualdade de dígitos:
 * mesma sequência, número com o verificador só de um lado, ou número e verificador
 * iguais. Prefixo comum com dígitos extras é outra conta. Devolve `null` quando falta
 * número e código de banco para comparar: aí o chamador não pode afirmar que o destino
 * está errado.
 */
export function origemCompativelComCadastro(
  origem: string | null,
  cadastro: ContaCadastrada | undefined
): boolean | null {
  if (!origem || !cadastro) return null;
  const segmentos = origem.split('/');
  const contaOrigem = numeroDaConta(segmentos[segmentos.length - 1]);
  const cadastradas = [cadastro.conta, cadastro.numero_conta]
    .map(numeroDaConta)
    .filter((conta) => conta.sequencia);

  if (contaOrigem.sequencia.length >= 4 && cadastradas.length > 0) {
    return cadastradas.some((conta) => contasCompativeis(contaOrigem, conta));
  }

  // Banco e agência vêm separados por barra; zeros de preenchimento não distinguem
  // bancos, e o código padrão "000" do cadastro quer dizer "não informado".
  const banco = segmentos.length > 1 ? normalizarCodigo(segmentos[0]) : '';
  const codigoBanco = normalizarCodigo(cadastro.codigo_banco);
  if (banco && codigoBanco) return banco === codigoBanco;
  return null;
}

/** Só os dígitos do código de banco, sem zeros à esquerda de preenchimento. */
function normalizarCodigo(valor: string | null | undefined): string {
  return (valor ?? '').replace(/\D/g, '').replace(/^0+/, '');
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
