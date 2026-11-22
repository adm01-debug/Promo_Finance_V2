/**
 * Valida??o de consist?ncia fiscal entre CST, cClassTrib e NCM.
 *
 * Etapa 46: a valida??o deixou de usar regras de exemplo embutidas (PIS/COFINS
 * monof?sico por prefixo de NCM, ST de eletr?nicos) e passou a conferir o
 * documento contra os cat?logos oficiais versionados ? `catalogo_cclasstrib` e
 * `catalogo_ncm`. Regra embutida envelhece em sil?ncio: uma lista de prefixos
 * de NCM nunca acompanha a NT vigente e penalizava produto correto.
 *
 * Toda fun??o aqui ? pura: recebe as refer?ncias j? carregadas (ver
 * `catalogos/cclasstrib.ts`) e devolve diverg?ncias. Cat?logo vazio n?o gera
 * diverg?ncia ? sem refer?ncia, n?o h? o que afirmar.
 */
import type { ReferenciasFiscais } from './catalogos/cclasstrib';

export interface DivergenciaFiscal {
  /** C?digo est?vel da regra, usado em log, badge e teste. */
  codigo: string;
  campo: string;
  mensagem: string;
}

export interface ValidacaoNCM {
  score: number;
  divergencias: DivergenciaFiscal[];
}

/** Item m?nimo para valida??o: o que a nota declarou. */
export interface ItemFiscalValidavel {
  ncm?: string | null;
  /** CST de IBS/CBS do grupo (3 d?gitos), n?o o CST de ICMS. */
  cstIbscbs?: string | null;
  cClassTrib?: string | null;
}

const soDigitos = (valor: string | null | undefined): string => (valor ?? '').replace(/\D/g, '');

/**
 * Confere um item contra os cat?logos vigentes.
 *
 * REG-011 ? a diverg?ncia de maior valor: o cClassTrib declarado existe, mas o
 * CST dele no cat?logo n?o ? o CST que o item declarou ? os dois campos se
 * contradizem dentro do pr?prio documento.
 */
export function validarItemFiscal(
  item: ItemFiscalValidavel,
  referencias: ReferenciasFiscais
): DivergenciaFiscal[] {
  const divergencias: DivergenciaFiscal[] = [];
  const ncm = soDigitos(item.ncm);
  const cst = soDigitos(item.cstIbscbs);
  const cClassTrib = soDigitos(item.cClassTrib);

  // Formato do NCM ? verific?vel sem cat?logo: a RFB usa 8 d?gitos.
  // '00' ? o c?digo do leiaute para item sem produto (servi?o, frete, seguro):
  // n?o ? erro de digita??o e n?o pode gerar alerta.
  if (ncm.length > 0 && ncm !== '00' && ncm.length !== 8) {
    divergencias.push({
      codigo: 'REG-010',
      campo: 'NCM',
      mensagem: `NCM ${item.ncm} com tamanho inv?lido (esperado 8 d?gitos).`,
    });
  }

  if (cClassTrib.length > 0) {
    const referencia = referencias.cclasstrib.get(cClassTrib);

    if (!referencia) {
      // S? acusa quando o cat?logo tem conte?do: vazio significa carga da RFB
      // ainda n?o executada (etapas 79-81), n?o c?digo inv?lido. A flag importa
      // porque o mapa ? recortado pelos c?digos do lote ? um mapa vazio n?o
      // prova cat?logo vazio.
      if (referencias.cclasstribCarregado) {
        divergencias.push({
          codigo: 'REG-013',
          campo: 'cClassTrib',
          mensagem: `cClassTrib ${cClassTrib} n?o consta do cat?logo vigente em ${referencias.referencia}.`,
        });
      }
    } else if (cst.length > 0 && soDigitos(referencia.cst) !== cst) {
      divergencias.push({
        codigo: 'REG-011',
        campo: 'cClassTrib',
        mensagem:
          `cClassTrib ${cClassTrib} (${referencia.descricao}) tem CST ${referencia.cst}, ` +
          `mas o item declarou CST ${cst}.`,
      });
    }
  }

  if (ncm.length === 8 && !referencias.ncm.has(ncm) && referencias.ncmCarregado) {
    divergencias.push({
      codigo: 'REG-012',
      campo: 'NCM',
      mensagem: `NCM ${ncm} n?o consta do cat?logo vigente em ${referencias.referencia}.`,
    });
  }

  return divergencias;
}

/**
 * Valida??o de uma nota inteira: agrega as diverg?ncias de cada item e converte
 * em score de confian?a (100 = nenhuma diverg?ncia).
 *
 * A diverg?ncia ? **alerta**, n?o bloqueio: a nota ? importada de qualquer
 * forma, com a lista anexada. Recusar a importa??o faria o contribuinte perder
 * o cr?dito por causa de um cat?logo desatualizado.
 */
export function validarItensFiscais(
  itens: ItemFiscalValidavel[],
  referencias: ReferenciasFiscais
): ValidacaoNCM {
  const divergencias = itens.flatMap((item) => validarItemFiscal(item, referencias));
  const penalidade = divergencias.reduce(
    (total, d) => total + (d.codigo === 'REG-010' ? 10 : 15),
    0
  );
  return { score: Math.max(0, 100 - penalidade), divergencias };
}

/**
 * Compatibilidade: valida??o de um par NCM ? CST sem cat?logo.
 *
 * As regras de exemplo de PIS/COFINS foram removidas na etapa 46. Sem as
 * refer?ncias oficiais sobra apenas o formato do NCM, que ? o ?nico crit?rio
 * verific?vel de forma isolada. Quem precisa da valida??o completa usa
 * `validarItensFiscais` com o retorno de `buscarReferenciasFiscais`.
 */
export function validarConsistenciaNcmCst(ncm: string, cst: string): ValidacaoNCM {
  const ncmLimpo = soDigitos(ncm);
  const divergencias: DivergenciaFiscal[] = [];

  if (ncmLimpo.length !== 8) {
    divergencias.push({
      codigo: 'REG-010',
      campo: 'NCM',
      mensagem: 'NCM com tamanho inv?lido (esperado 8 d?gitos).',
    });
  }

  // `cst` ? aceito por compatibilidade de assinatura e n?o pontua: sem o
  // cat?logo n?o existe CST de refer?ncia para comparar.
  void cst;

  return { score: divergencias.length > 0 ? 90 : 100, divergencias };
}
