/**
 * Utilitários de dias úteis bancários federais (BR) para o runtime Deno.
 *
 * Espelho fiel de `src/lib/tributario/darf/tabelas.ts` e
 * `src/lib/tributario/darf/vencimento.ts`, mantido separado porque Edge
 * Functions não podem importar o código de `src/`. Qualquer alteração de
 * regra deve ser replicada nos dois lados (coberto por testes de paridade).
 */

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

/** Converte "AAAA-MM" em [ano, mes]; lança em formato inválido. */
export function parsePeriodo(periodo: string): readonly [number, number] {
  const m = /^(\d{4})-(\d{2})$/.exec(periodo.trim());
  if (!m) throw new Error(`Período de apuração inválido: "${periodo}" (esperado AAAA-MM)`);
  const ano = Number(m[1]);
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) throw new Error(`Mês inválido em "${periodo}"`);
  return [ano, mes] as const;
}

/** Arredonda para 2 casas com correção de epsilon. */
export function round2(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}
