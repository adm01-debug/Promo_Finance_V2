import { sanitizarParametros, type ParametrosSimulacao } from './shared-logic';

/** Severidade do ajuste aplicado pela sanitização. */
export type SeveridadeAjuste = 'aviso' | 'critico';

export interface AjusteParametro {
  /** Campo de `ParametrosSimulacao` afetado. */
  campo: keyof ParametrosSimulacao;
  /** Rótulo legível para exibição na UI. */
  rotulo: string;
  /** Valor bruto informado pelo usuário (já em string formatada). */
  informado: string;
  /** Valor efetivamente utilizado pelo motor após sanitização. */
  aplicado: string;
  /** Explicação em linguagem de negócio do porquê do ajuste. */
  motivo: string;
  severidade: SeveridadeAjuste;
}

const ROTULOS: Partial<Record<keyof ParametrosSimulacao, string>> = {
  faturamentoAnual: 'Faturamento anual',
  margemLucro: 'Margem de lucro',
  percentualServicos: '% Serviços',
  percentualIndustria: '% Indústria',
  percentualRevenda: '% Revenda',
  folhaAnual: 'Folha anual',
  comprasComCredito: 'Compras com crédito',
  despesasOperacionais: 'Despesas operacionais',
  aliquotaICMS: 'Alíquota ICMS',
  aliquotaISS: 'Alíquota ISS',
  aliquotaRAT: 'Alíquota RAT/FAP',
  aliquotaTerceiros: 'Alíquota Terceiros',
  issRetidoFonte: 'ISS retido na fonte',
  sublimiteEstadual: 'Sublimite estadual',
};

const MOTIVOS: Partial<Record<keyof ParametrosSimulacao, string>> = {
  faturamentoAnual: 'Receita bruta não pode ser negativa nem indefinida.',
  margemLucro: 'Margem limitada ao intervalo de -100% a 100%.',
  percentualServicos: 'Composição de receita normalizada para somar no máximo 100%.',
  percentualIndustria: 'Composição de receita normalizada para somar no máximo 100%.',
  percentualRevenda: 'Composição de receita normalizada para somar no máximo 100%.',
  folhaAnual: 'Folha de pagamento não pode ser negativa.',
  comprasComCredito: 'Base de créditos não pode ser negativa.',
  despesasOperacionais: 'Despesas não podem ser negativas.',
  aliquotaICMS: 'Alíquota limitada ao intervalo de 0% a 100%.',
  aliquotaISS: 'Alíquota limitada ao intervalo de 0% a 100% (teto legal de 5% — LC 116/2003).',
  aliquotaRAT: 'RAT/FAP limitado a 6% (RAT 3% x FAP 2,0 — Lei 8.212/1991).',
  aliquotaTerceiros: 'Contribuições a terceiros limitadas a 10%.',
  issRetidoFonte: 'Retenção na fonte não pode ser negativa.',
  sublimiteEstadual: 'Sublimite estadual não pode ser negativo (LC 123/2006, art. 19).',
};

/** Campos numéricos monitorados pelo diagnóstico. */
const CAMPOS: Array<keyof ParametrosSimulacao> = [
  'faturamentoAnual',
  'margemLucro',
  'percentualServicos',
  'percentualIndustria',
  'percentualRevenda',
  'folhaAnual',
  'comprasComCredito',
  'despesasOperacionais',
  'aliquotaICMS',
  'aliquotaISS',
  'aliquotaRAT',
  'aliquotaTerceiros',
  'issRetidoFonte',
  'sublimiteEstadual',
];

const PERCENTUAIS_FRACIONARIOS: ReadonlySet<keyof ParametrosSimulacao> = new Set([
  'aliquotaICMS',
  'aliquotaISS',
  'aliquotaRAT',
  'aliquotaTerceiros',
]);

const PERCENTUAIS_INTEIROS: ReadonlySet<keyof ParametrosSimulacao> = new Set([
  'margemLucro',
  'percentualServicos',
  'percentualIndustria',
  'percentualRevenda',
]);

/** Formata o valor conforme a natureza do campo, tolerando entradas inválidas. */
function formatar(campo: keyof ParametrosSimulacao, valor: unknown): string {
  if (valor === undefined || valor === null) return 'não informado';
  const n = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(n)) return String(valor);
  if (PERCENTUAIS_FRACIONARIOS.has(campo)) return `${(n * 100).toFixed(2)}%`;
  if (PERCENTUAIS_INTEIROS.has(campo)) return `${n.toFixed(2)}%`;
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

/** Tolerância para evitar ruído por arredondamento de ponto flutuante. */
const EPSILON = 1e-9;

/**
 * Compara os parâmetros informados com os efetivamente usados pelo motor,
 * produzindo a lista de ajustes automáticos para exibição transparente na UI.
 *
 * A sanitização protege o cálculo, mas silenciá-la seria opaco para o contador:
 * este diagnóstico garante que todo ajuste seja visível e justificado.
 */
export function diagnosticarParametros(p: ParametrosSimulacao): AjusteParametro[] {
  const sanitizado = sanitizarParametros(p);
  const ajustes: AjusteParametro[] = [];

  for (const campo of CAMPOS) {
    const bruto = p[campo];
    const limpo = sanitizado[campo];

    // Campos não informados que ganham default no motor não são "ajustes".
    if (bruto === undefined || bruto === null) continue;

    const brutoNum = typeof bruto === 'number' ? bruto : Number(bruto);
    const limpoNum = typeof limpo === 'number' ? limpo : Number(limpo);

    const invalido = !Number.isFinite(brutoNum);
    if (!invalido && Math.abs(brutoNum - limpoNum) <= EPSILON) continue;

    ajustes.push({
      campo,
      rotulo: ROTULOS[campo] ?? String(campo),
      informado: formatar(campo, bruto),
      aplicado: formatar(campo, limpo),
      motivo: MOTIVOS[campo] ?? 'Valor ajustado para o domínio válido do motor tributário.',
      severidade: invalido || brutoNum < 0 ? 'critico' : 'aviso',
    });
  }

  return ajustes;
}
