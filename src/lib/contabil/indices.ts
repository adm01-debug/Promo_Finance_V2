/**
 * Índices econômico-financeiros — núcleo puro.
 *
 * A agregação por grupo é feita no Postgres (`fn_indices_contabeis`); aqui só
 * ocorrem divisões determinísticas sobre os agregados. Nenhuma função lança
 * exceção: divisor nulo/zero resulta em `valor: null` com `motivo` explícito.
 */

import type { AgregadosContabeis, Indicador } from './indices.types';
import { DEFS, round2 } from './indices.helpers';

/** Calcula todos os indicadores a partir dos agregados já consolidados. */
export function calcularIndices(a: AgregadosContabeis): Indicador[] {
  return DEFS.map((d) => {
    const { valor, motivo } = d.calc(a);
    const seguro = valor === null || !Number.isFinite(valor) ? null : round2(valor);
    return {
      chave: d.chave,
      rotulo: d.rotulo,
      categoria: d.categoria,
      formato: d.formato,
      valor: seguro,
      faixa: seguro === null ? 'indefinido' : (d.faixa?.(seguro) ?? 'neutro'),
      formula: d.formula,
      interpretacao: d.interpretacao,
      ...(seguro === null ? { motivo: motivo ?? 'Base contábil insuficiente' } : {}),
    };
  });
}
