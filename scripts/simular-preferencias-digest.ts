/**
 * Etapa R — Simulação exaustiva do motor de preferências do digest.
 * Executa centenas de cenários pseudoaleatórios (LCG determinístico) e valida
 * invariantes estruturais. Uso: `bunx tsx scripts/simular-preferencias-digest.ts`.
 */
import {
  filtrarAlertas,
  hashAlertas,
  normalizarPreferencia,
  planejarEnvios,
  type ContextoEnvio,
  type PreferenciaDigestRaw,
} from '../src/lib/tributario/obrigacoes/preferencias-digest';
import type { AlertaDigest } from '../src/lib/tributario/obrigacoes/digest';

let seed = 20260726;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 0x100000000);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];

const SEVS = ['critica', 'alta', 'media', 'baixa', 'inexistente'];
const TIPOS = ['score_baixo', 'queda_abrupta', 'multa_acumulada', 'sem_snapshot'];
const EMPRESAS = ['e1', 'e2', 'e3', 'e4'];

const alerta = (i: number): AlertaDigest => ({
  empresaId: pick(EMPRESAS),
  empresaNome: `Empresa ${i % 4}`,
  tipo: pick(TIPOS),
  severidade: pick(SEVS),
  competencia: `2026-0${1 + (i % 9)}`,
  titulo: `Alerta ${i}`,
  mensagem: `Mensagem ${i}`,
  valor: rnd() > 0.5 ? Math.round(rnd() * 100000) / 100 : null,
});

const prefRaw = (i: number): PreferenciaDigestRaw => ({
  user_id: `u${i}`,
  email: rnd() > 0.15 ? `user${i}@empresa.com.br` : pick(['', 'invalido', null]),
  ativo: rnd() > 0.2,
  frequencia: pick(['diaria', 'semanal', 'mensal', 'quinzenal', undefined]),
  dia_semana: Math.floor(rnd() * 9) - 1,
  dia_mes: Math.floor(rnd() * 33),
  hora_envio: Math.floor(rnd() * 30) - 3,
  severidade_minima: pick(SEVS),
  tipos_ignorados: rnd() > 0.6 ? [pick(TIPOS)] : null,
  empresas_filtro: rnd() > 0.6 ? [pick(EMPRESAS)] : [],
  max_alertas: pick([1, 5, 50, 999, -3, NaN]),
  ultimo_hash: rnd() > 0.8 ? 'deadbeef' : null,
});

let falhas = 0;
const check = (cond: boolean, msg: string) => {
  if (!cond) {
    falhas += 1;
    console.error(`✗ ${msg}`);
  }
};

const CENARIOS = 400;
for (let c = 0; c < CENARIOS; c += 1) {
  const alertas = Array.from({ length: Math.floor(rnd() * 60) }, (_, i) => alerta(i));
  const prefs = Array.from({ length: Math.floor(rnd() * 12) }, (_, i) => prefRaw(i));
  const ctx: ContextoEnvio = {
    diaSemana: Math.floor(rnd() * 7),
    diaMes: 1 + Math.floor(rnd() * 31),
    hora: Math.floor(rnd() * 24),
    toleranciaHoras: Math.floor(rnd() * 4),
    ultimoDiaDoMes: pick([28, 29, 30, 31]),
  };

  const plano = planejarEnvios(prefs, alertas, ctx);

  // I1: nenhum envio duplicado por e-mail.
  const emails = plano.envios.map((e) => e.email);
  check(new Set(emails).size === emails.length, `C${c}: e-mails duplicados`);

  // I2: ordenação estável por e-mail.
  check(
    emails.every((e, i) => i === 0 || emails[i - 1] <= e),
    `C${c}: envios fora de ordem`,
  );

  // I3: nenhum envio vazio e teto respeitado.
  for (const envio of plano.envios) {
    check(envio.alertas.length > 0, `C${c}: envio vazio`);
    check(
      envio.alertas.length <= envio.preferencia.maxAlertas,
      `C${c}: teto de alertas violado`,
    );
    check(envio.hash === hashAlertas(envio.alertas), `C${c}: hash inconsistente`);
    check(envio.preferencia.ultimoHash !== envio.hash, `C${c}: reenvio duplicado`);
    // I4: filtros respeitados.
    const empresas = new Set(envio.preferencia.empresasFiltro);
    for (const a of envio.alertas) {
      if (empresas.size > 0) check(empresas.has(a.empresaId), `C${c}: empresa fora do filtro`);
      check(
        !envio.preferencia.tiposIgnorados.includes(String(a.tipo)),
        `C${c}: tipo ignorado incluído`,
      );
    }
  }

  // I5: total conservado (envios + ignorados = preferências).
  check(
    plano.envios.length + plano.ignorados.length === prefs.length,
    `C${c}: preferências perdidas no planejamento`,
  );

  // I6: determinismo — mesma entrada, mesma saída.
  const repetido = planejarEnvios(prefs, alertas, ctx);
  check(
    JSON.stringify(repetido) === JSON.stringify(plano),
    `C${c}: planejamento não determinístico`,
  );

  // I7: normalização nunca produz valores fora do domínio.
  for (const p of prefs.map(normalizarPreferencia)) {
    check(p.horaEnvio >= 0 && p.horaEnvio <= 23, `C${c}: hora fora do domínio`);
    check(p.diaSemana >= 0 && p.diaSemana <= 6, `C${c}: dia da semana fora do domínio`);
    check(p.diaMes >= 1 && p.diaMes <= 28, `C${c}: dia do mês fora do domínio`);
    check(p.maxAlertas >= 1 && p.maxAlertas <= 500, `C${c}: maxAlertas fora do domínio`);
  }

  // I8: monotonicidade da severidade — 'baixa' inclui tudo que 'critica' inclui.
  const base = normalizarPreferencia({ ...prefs[0], severidade_minima: 'critica', max_alertas: 500, tipos_ignorados: [], empresas_filtro: [] });
  const ampla = normalizarPreferencia({ ...prefs[0], severidade_minima: 'baixa', max_alertas: 500, tipos_ignorados: [], empresas_filtro: [] });
  check(
    filtrarAlertas(base, alertas).length <= filtrarAlertas(ampla, alertas).length,
    `C${c}: severidade não monotônica`,
  );
}

console.log(
  falhas === 0
    ? `✓ ${CENARIOS} cenários validados — 8 invariantes, 0 falhas.`
    : `✗ ${falhas} falhas em ${CENARIOS} cenários.`,
);
process.exit(falhas === 0 ? 0 : 1);
