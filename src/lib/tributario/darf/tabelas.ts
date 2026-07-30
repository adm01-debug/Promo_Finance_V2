import type { CodigoReceita } from './types';

/**
 * Códigos de receita federais mais usados na apuração de PJ.
 * Fonte: Ato Declaratório Executivo Codac (tabela de códigos de receita da RFB).
 */
export const CODIGOS_RECEITA: readonly CodigoReceita[] = [
  {
    codigo: '0220',
    tributo: 'IRPJ',
    descricao: 'IRPJ — Lucro Real, apuração trimestral',
    regraVencimento: 'ultimo_dia_util_mes_seguinte',
    permiteQuotas: true,
    fundamento: 'Lei 9.430/96, art. 5º',
  },
  {
    codigo: '2362',
    tributo: 'IRPJ',
    descricao: 'IRPJ — Lucro Real, estimativa mensal',
    regraVencimento: 'ultimo_dia_util_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 9.430/96, art. 6º',
  },
  {
    codigo: '2089',
    tributo: 'IRPJ',
    descricao: 'IRPJ — Lucro Presumido',
    regraVencimento: 'ultimo_dia_util_mes_seguinte',
    permiteQuotas: true,
    fundamento: 'Lei 9.430/96, art. 5º',
  },
  {
    codigo: '6012',
    tributo: 'CSLL',
    descricao: 'CSLL — Lucro Real, apuração trimestral',
    regraVencimento: 'ultimo_dia_util_mes_seguinte',
    permiteQuotas: true,
    fundamento: 'Lei 9.430/96, art. 28',
  },
  {
    codigo: '2484',
    tributo: 'CSLL',
    descricao: 'CSLL — estimativa mensal',
    regraVencimento: 'ultimo_dia_util_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 9.430/96, art. 30',
  },
  {
    codigo: '2372',
    tributo: 'CSLL',
    descricao: 'CSLL — Lucro Presumido',
    regraVencimento: 'ultimo_dia_util_mes_seguinte',
    permiteQuotas: true,
    fundamento: 'Lei 9.430/96, art. 28',
  },
  {
    codigo: '8109',
    tributo: 'PIS',
    descricao: 'PIS/Pasep — faturamento (cumulativo)',
    regraVencimento: 'dia_25_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 10.637/2002, art. 10',
  },
  {
    codigo: '6912',
    tributo: 'PIS',
    descricao: 'PIS/Pasep — não cumulativo',
    regraVencimento: 'dia_25_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 10.637/2002, art. 10',
  },
  {
    codigo: '2172',
    tributo: 'COFINS',
    descricao: 'COFINS — faturamento (cumulativo)',
    regraVencimento: 'dia_25_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 10.833/2003, art. 11',
  },
  {
    codigo: '5856',
    tributo: 'COFINS',
    descricao: 'COFINS — não cumulativa',
    regraVencimento: 'dia_25_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 10.833/2003, art. 11',
  },
  {
    codigo: '5123',
    tributo: 'IPI',
    descricao: 'IPI — demais produtos',
    regraVencimento: 'dia_25_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 11.933/2009, art. 4º',
  },
  {
    codigo: '0561',
    tributo: 'IRRF',
    descricao: 'IRRF — rendimentos do trabalho assalariado',
    regraVencimento: 'dia_20_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 11.196/2005, art. 70, I, "e"',
  },
  {
    codigo: '1708',
    tributo: 'IRRF',
    descricao: 'IRRF — serviços prestados por pessoa jurídica',
    regraVencimento: 'dia_20_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 11.196/2005, art. 70, I, "e"',
  },
  {
    codigo: '5952',
    tributo: 'CSRF',
    descricao: 'CSRF — CSLL/PIS/COFINS retidos na fonte (4,65%)',
    regraVencimento: 'dia_20_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 10.833/2003, art. 35',
  },
  {
    codigo: '1141',
    tributo: 'INSS_RETENCAO',
    descricao: 'Retenção 11% sobre cessão de mão de obra',
    regraVencimento: 'dia_20_mes_seguinte',
    permiteQuotas: false,
    fundamento: 'Lei 8.212/91, art. 31',
  },
];

const MAPA = new Map(CODIGOS_RECEITA.map((c) => [c.codigo, c]));

/** Retorna os metadados de um código de receita, ou `undefined` se desconhecido. */
export function buscarCodigo(codigo: string): CodigoReceita | undefined {
  return MAPA.get(codigo.trim());
}

/** Valor mínimo para recolhimento de DARF (Lei 9.430/96, art. 68). */
export const VALOR_MINIMO_DARF = 10;

/** Valor mínimo de quota de IRPJ/CSLL trimestral (Lei 9.430/96, art. 5º, §2º). */
export const VALOR_MINIMO_QUOTA = 1000;

/** Multa de mora: 0,33% ao dia, limitada a 20% (Lei 9.430/96, art. 61). */
export const MULTA_MORA_DIARIA = 0.0033;
export const MULTA_MORA_TETO = 0.2;

/** SELIC mensal usada quando a competência não é informada (referência conservadora). */
export const SELIC_PADRAO_MENSAL = 0.0089;

/** Feriados nacionais fixos (MM-DD). */
const FERIADOS_FIXOS = new Set([
  '01-01',
  '04-21',
  '05-01',
  '09-07',
  '10-12',
  '11-02',
  '11-15',
  '11-20',
  '12-25',
]);

/** Calcula a Páscoa (algoritmo de Meeus/Jones/Butcher) em UTC. */
function pascoa(ano: number): Date {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}

const cacheMoveis = new Map<number, Set<string>>();

function feriadosMoveis(ano: number): Set<string> {
  const cached = cacheMoveis.get(ano);
  if (cached) return cached;
  const base = pascoa(ano);
  const offsets = [-48, -47, -2, 60]; // carnaval (seg/ter), sexta-feira santa, corpus christi
  const set = new Set<string>();
  for (const off of offsets) {
    const d = new Date(base.getTime() + off * 86_400_000);
    set.add(d.toISOString().slice(0, 10));
  }
  cacheMoveis.set(ano, set);
  return set;
}

/** Indica se a data (UTC) é dia útil bancário federal. */
export function isDiaUtil(data: Date): boolean {
  const dow = data.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  const iso = data.toISOString().slice(0, 10);
  if (FERIADOS_FIXOS.has(iso.slice(5))) return false;
  return !feriadosMoveis(data.getUTCFullYear()).has(iso);
}

/** Antecipa a data para o dia útil imediatamente anterior, se necessário. */
export function anteciparDiaUtil(data: Date): Date {
  const d = new Date(data.getTime());
  let guard = 0;
  while (!isDiaUtil(d) && guard < 30) {
    d.setUTCDate(d.getUTCDate() - 1);
    guard += 1;
  }
  return d;
}
