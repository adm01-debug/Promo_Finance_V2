// Natureza da operação e CFOP de venda a partir da UF da empresa emissora e da UF do destinatário.
//
// Regra resgatada do Bitrix24 (SPA NF | Faturamento, robô da etapa de entrada e processo
// "Tipo de Faturamento"): mesma UF do emissor e do cliente → "VENDAS DE MERCADORIAS DENTRO DO
// ESTADO"; UF diferente → "VENDAS DE MERCADORIAS FORA DO ESTADO". Lá a UF do emissor era fixa por
// empresa (Brasil Marcas = SP, João Batista = RR) e a terceira empresa não tinha regra; aqui a UF
// do emissor vem do cadastro (`empresas.estado`), então vale para todas.
//
// Os nomes das naturezas são os cadastrados no Bling, usados pelo fluxo de emissão (busca por
// descrição). CFOP 5102/6102 = venda de mercadoria adquirida de terceiros, dentro/fora do estado.

import { ALIQUOTAS_UF } from './icms/tabelas';
import type { UF } from './icms/types';

export const NATUREZA_VENDA_DENTRO_ESTADO = 'VENDAS DE MERCADORIAS DENTRO DO ESTADO';
export const NATUREZA_VENDA_FORA_ESTADO = 'VENDAS DE MERCADORIAS FORA DO ESTADO';
export const CFOP_VENDA_DENTRO_ESTADO = '5102';
export const CFOP_VENDA_FORA_ESTADO = '6102';

export interface NaturezaOperacaoVenda {
  natureza: typeof NATUREZA_VENDA_DENTRO_ESTADO | typeof NATUREZA_VENDA_FORA_ESTADO;
  cfop: typeof CFOP_VENDA_DENTRO_ESTADO | typeof CFOP_VENDA_FORA_ESTADO;
  dentroDoEstado: boolean;
  ufEmitente: UF;
  ufDestinatario: UF;
}

const UFS = new Set(Object.keys(ALIQUOTAS_UF));

/** Sigla de UF normalizada (maiúscula, sem espaços) ou `null` quando não é uma das 27. */
export function normalizarUf(valor: string | null | undefined): UF | null {
  if (typeof valor !== 'string') return null;
  const sigla = valor.trim().toUpperCase();
  return UFS.has(sigla) ? (sigla as UF) : null;
}

/**
 * Resolve natureza da operação e CFOP de uma venda. Devolve `null` quando alguma das UFs está
 * vazia ou inválida: sem as duas UFs não há como decidir e a emissão não deve seguir com um
 * valor fixo.
 */
export function resolverNaturezaOperacaoVenda(params: {
  ufEmitente: string | null | undefined;
  ufDestinatario: string | null | undefined;
}): NaturezaOperacaoVenda | null {
  const ufEmitente = normalizarUf(params.ufEmitente);
  const ufDestinatario = normalizarUf(params.ufDestinatario);
  if (!ufEmitente || !ufDestinatario) return null;

  const dentroDoEstado = ufEmitente === ufDestinatario;
  return {
    natureza: dentroDoEstado ? NATUREZA_VENDA_DENTRO_ESTADO : NATUREZA_VENDA_FORA_ESTADO,
    cfop: dentroDoEstado ? CFOP_VENDA_DENTRO_ESTADO : CFOP_VENDA_FORA_ESTADO,
    dentroDoEstado,
    ufEmitente,
    ufDestinatario,
  };
}
