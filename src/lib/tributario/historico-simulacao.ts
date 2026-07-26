/**
 * Normalização defensiva e agregação de auditoria do histórico de simulações.
 *
 * Os campos `parametros` e `ajustes_aplicados` da tabela `regimes_simulados`
 * são colunas `jsonb` — o banco não garante forma alguma. Registros legados
 * (anteriores às colunas) e payloads corrompidos precisam degradar de forma
 * previsível, jamais lançar exceção durante a renderização.
 */
import type { AjusteParametro } from './diagnostico-parametros';
import type { ParametrosSimulacao } from './types';

/** Snapshot é utilizável apenas se trouxer, no mínimo, o faturamento anual. */
export function normalizarParametrosSnapshot(
  bruto: unknown,
): Partial<ParametrosSimulacao> | null {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null;
  const registro = bruto as Record<string, unknown>;
  if (typeof registro.faturamentoAnual !== 'number') return null;
  if (!Number.isFinite(registro.faturamentoAnual)) return null;
  return registro as Partial<ParametrosSimulacao>;
}

/** Filtra apenas os itens que satisfazem integralmente o contrato de ajuste. */
export function normalizarAjustesAplicados(bruto: unknown): AjusteParametro[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.filter((item): item is AjusteParametro => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const registro = item as Record<string, unknown>;
    return (
      typeof registro.campo === 'string' &&
      typeof registro.rotulo === 'string' &&
      typeof registro.informado === 'string' &&
      typeof registro.aplicado === 'string' &&
      (registro.severidade === 'aviso' || registro.severidade === 'critico')
    );
  });
}

export interface ResumoAuditoriaHistorico {
  total: number;
  divergentes: number;
  motorDesatualizado: number;
  comAjustes: number;
  comAjustesCriticos: number;
  /** True quando nenhum snapshot apresenta divergência, ajuste ou versão antiga. */
  saudavel: boolean;
}

interface ItemAuditavel {
  divergente: boolean;
  motorDesatualizado: boolean;
  ajustesAplicados: AjusteParametro[];
}

/** Agrega os indicadores de qualidade do histórico para exibição resumida. */
export function resumirAuditoriaHistorico(
  itens: readonly ItemAuditavel[],
): ResumoAuditoriaHistorico {
  const divergentes = itens.filter((i) => i.divergente).length;
  const motorDesatualizado = itens.filter((i) => i.motorDesatualizado).length;
  const comAjustes = itens.filter((i) => i.ajustesAplicados.length > 0).length;
  const comAjustesCriticos = itens.filter((i) =>
    i.ajustesAplicados.some((a) => a.severidade === 'critico'),
  ).length;

  return {
    total: itens.length,
    divergentes,
    motorDesatualizado,
    comAjustes,
    comAjustesCriticos,
    saudavel: divergentes === 0 && motorDesatualizado === 0 && comAjustes === 0,
  };
}
