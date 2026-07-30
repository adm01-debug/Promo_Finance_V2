import {
  MULTA_MORA_DIARIA,
  MULTA_MORA_TETO,
  SELIC_PADRAO_MENSAL,
  anteciparDiaUtil,
} from './tabelas';
import type { AcrescimosMoratorios, RegraVencimento } from './types';

const MS_DIA = 86_400_000;

/** Converte "AAAA-MM" em [ano, mês(1-12)]; lança em formato inválido. */
export function parsePeriodo(periodo: string): readonly [number, number] {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo.trim());
  if (!m) throw new Error(`Período de apuração inválido: "${periodo}" (esperado AAAA-MM)`);
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) throw new Error(`Mês inválido em "${periodo}"`);
  return [ano, mes] as const;
}

/** Soma meses a uma competência AAAA-MM. */
export function somarMeses(periodo: string, meses: number): string {
  const [ano, mes] = parsePeriodo(periodo);
  const total = ano * 12 + (mes - 1) + meses;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return `${String(novoAno).padStart(4, '0')}-${String(novoMes).padStart(2, '0')}`;
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Calcula o vencimento do DARF conforme a regra do código de receita. */
export function calcularVencimento(periodoApuracao: string, regra: RegraVencimento): string {
  const [ano, mes] = parsePeriodo(periodoApuracao);
  const proximo = new Date(Date.UTC(ano, mes, 1)); // mês seguinte (mes é 1-based)
  let alvo: Date;
  if (regra === 'ultimo_dia_util_mes_seguinte') {
    alvo = new Date(Date.UTC(proximo.getUTCFullYear(), proximo.getUTCMonth() + 1, 0));
  } else {
    const dia = regra === 'dia_25_mes_seguinte' ? 25 : 20;
    alvo = new Date(Date.UTC(proximo.getUTCFullYear(), proximo.getUTCMonth(), dia));
  }
  return toISO(anteciparDiaUtil(alvo));
}

/** Diferença em dias corridos entre duas datas ISO (pagamento - vencimento). */
export function diasAtraso(vencimento: string, dataPagamento: string): number {
  const v = Date.parse(`${vencimento}T00:00:00Z`);
  const p = Date.parse(`${dataPagamento}T00:00:00Z`);
  if (!Number.isFinite(v) || !Number.isFinite(p)) return 0;
  return Math.max(0, Math.round((p - v) / MS_DIA));
}

/**
 * Soma a SELIC acumulada entre o mês seguinte ao vencimento e o mês anterior
 * ao pagamento, acrescida de 1% no mês do pagamento (Lei 9.430/96, art. 61, §3º).
 */
export function selicAcumulada(
  vencimento: string,
  dataPagamento: string,
  selicMensal: Readonly<Record<string, number>> = {},
  padrao = SELIC_PADRAO_MENSAL,
): number {
  const compVenc = vencimento.slice(0, 7);
  const compPag = dataPagamento.slice(0, 7);
  if (compPag <= compVenc) return 0.01;
  let acumulado = 0;
  let cursor = somarMeses(compVenc, 1);
  let guard = 0;
  while (cursor < compPag && guard < 600) {
    acumulado += selicMensal[cursor] ?? padrao;
    cursor = somarMeses(cursor, 1);
    guard += 1;
  }
  return acumulado + 0.01;
}

/** Calcula multa de mora e juros SELIC de um débito pago em atraso. */
export function calcularAcrescimos(params: {
  readonly principal: number;
  readonly vencimento: string;
  readonly dataPagamento: string;
  readonly selicMensal?: Readonly<Record<string, number>>;
  readonly selicPadraoMensal?: number;
}): AcrescimosMoratorios {
  const { principal, vencimento, dataPagamento, selicMensal, selicPadraoMensal } = params;
  const dias = diasAtraso(vencimento, dataPagamento);
  const base = Math.max(0, principal);
  if (dias === 0 || base === 0) {
    return { diasAtraso: dias, multaMora: 0, percentualMulta: 0, juros: 0, percentualJuros: 0 };
  }
  const percentualMulta = Math.min(dias * MULTA_MORA_DIARIA, MULTA_MORA_TETO);
  const percentualJuros = selicAcumulada(
    vencimento,
    dataPagamento,
    selicMensal,
    selicPadraoMensal ?? SELIC_PADRAO_MENSAL,
  );
  return {
    diasAtraso: dias,
    percentualMulta,
    multaMora: round2(base * percentualMulta),
    percentualJuros,
    juros: round2(base * percentualJuros),
  };
}

export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
