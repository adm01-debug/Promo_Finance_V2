/**
 * Etapa S — Simulação exaustiva do motor de projeção de conformidade.
 *
 * Gera séries pseudoaleatórias (PRNG determinístico) cobrindo tendências de
 * alta, queda, ruído puro, séries constantes, lacunas e horizontes extremos,
 * validando invariantes estruturais e numéricas do modelo.
 *
 *   bunx tsx scripts/simular-projecao-conformidade.ts
 */
import {
  ajustarTendencia,
  contarLacunas,
  distanciaCompetencias,
  LIMIAR_ALERTA,
  montarSerieProjecao,
  MIN_OBSERVACOES,
  projetarConformidade,
  somarCompetencia,
} from '../src/lib/tributario/obrigacoes/projecao';
import { classificarConformidade } from '../src/lib/tributario/obrigacoes/conformidade';
import type { PontoHistorico } from '../src/lib/tributario/obrigacoes/historico';

/** PRNG mulberry32 — reprodutível entre execuções. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (v: number) => Math.round(v * 10) / 10;

type Perfil = 'alta' | 'queda' | 'ruido' | 'constante' | 'degrau';

function gerarSerie(rand: () => number, perfil: Perfil, n: number, lacunas: boolean): PontoHistorico[] {
  const pontos: PontoHistorico[] = [];
  let competencia = `20${20 + Math.floor(rand() * 5)}-0${1 + Math.floor(rand() * 9)}`;
  let base = 40 + rand() * 55;

  for (let i = 0; i < n; i += 1) {
    let score: number;
    switch (perfil) {
      case 'alta':
        score = base + i * (0.5 + rand() * 3) + (rand() - 0.5) * 4;
        break;
      case 'queda':
        score = base - i * (0.5 + rand() * 4) + (rand() - 0.5) * 4;
        break;
      case 'ruido':
        score = 50 + (rand() - 0.5) * 90;
        break;
      case 'constante':
        score = base;
        break;
      case 'degrau':
        score = i < n / 2 ? base : Math.max(0, base - 35);
        break;
    }
    score = round1(Math.min(100, Math.max(0, score)));

    const total = 1 + Math.floor(rand() * 12);
    const entregues = Math.floor((score / 100) * total);
    pontos.push({
      competencia,
      score,
      nivel: classificarConformidade(score),
      total,
      entregues,
      vencidasPendentes: total - entregues,
      entreguesComAtraso: Math.floor(rand() * entregues),
      pontualidade: score,
      multaRegistrada: round1(rand() * 500),
    });

    const salto = lacunas && rand() < 0.25 ? 2 + Math.floor(rand() * 3) : 1;
    competencia = somarCompetencia(competencia, salto);
  }

  return pontos;
}

const falhas: string[] = [];
const check = (cond: boolean, msg: string) => {
  if (!cond) falhas.push(msg);
};

const perfis: Perfil[] = ['alta', 'queda', 'ruido', 'constante', 'degrau'];
const CENARIOS = 600;

for (let c = 0; c < CENARIOS; c += 1) {
  const rand = prng(1337 + c * 7919);
  const perfil = perfis[c % perfis.length];
  const n = Math.floor(rand() * 26); // 0..25 competências (inclui vazio e n=1,2)
  const comLacunas = rand() < 0.4;
  const horizonte = 1 + Math.floor(rand() * 14); // inclui valores fora de 1..12
  const serie = gerarSerie(rand, perfil, n, comLacunas);
  const p = projetarConformidade(serie, horizonte);
  const id = `#${c} perfil=${perfil} n=${n} h=${horizonte}`;

  // I1 — horizonte é sempre truncado em [1, 12] e respeitado quando há série.
  const hEsperado = n === 0 ? 0 : Math.min(12, Math.max(1, horizonte));
  check(p.pontos.length === hEsperado, `${id}: horizonte projetado ${p.pontos.length} ≠ ${hEsperado}`);

  // I2 — todo score projetado e sua banda ficam em [0, 100].
  for (const pt of p.pontos) {
    check(pt.score >= 0 && pt.score <= 100, `${id}: score fora de [0,100] (${pt.score})`);
    check(pt.minimo >= 0 && pt.minimo <= 100, `${id}: mínimo fora de [0,100]`);
    check(pt.maximo >= 0 && pt.maximo <= 100, `${id}: máximo fora de [0,100]`);
    check(pt.minimo <= pt.maximo, `${id}: banda invertida`);
    check(pt.nivel === classificarConformidade(pt.score), `${id}: nível incoerente`);
  }

  // I3 — competências projetadas são estritamente consecutivas e futuras.
  if (n > 0 && p.pontos.length > 0) {
    const ultima = serie[serie.length - 1].competencia;
    p.pontos.forEach((pt, i) => {
      check(
        distanciaCompetencias(ultima, pt.competencia) === i + 1,
        `${id}: competência projetada fora de sequência (${pt.competencia})`
      );
    });
  }

  // I4 — banda não encolhe com o horizonte (incerteza monotônica).
  for (let i = 1; i < p.pontos.length; i += 1) {
    const anterior = p.pontos[i - 1].maximo - p.pontos[i - 1].minimo;
    const atual = p.pontos[i].maximo - p.pontos[i].minimo;
    const saturado =
      p.pontos[i].minimo === 0 || p.pontos[i].maximo === 100 ||
      p.pontos[i - 1].minimo === 0 || p.pontos[i - 1].maximo === 100;
    check(saturado || atual + 1e-6 >= anterior, `${id}: banda encolheu no passo ${i}`);
  }

  // I5 — confiabilidade segue exatamente MIN_OBSERVACOES.
  check(p.confiavel === n >= MIN_OBSERVACOES, `${id}: flag de confiabilidade incoerente`);

  // I6 — R² sempre em [0,1] e n do ajuste igual ao tamanho da série.
  check(p.ajuste.r2 >= 0 && p.ajuste.r2 <= 1, `${id}: R² fora de [0,1] (${p.ajuste.r2})`);
  check(p.ajuste.n === n, `${id}: n do ajuste ≠ tamanho da série`);
  check(Number.isFinite(p.ajuste.inclinacao), `${id}: inclinação não finita`);
  check(Number.isFinite(p.ajuste.erroPadrao) && p.ajuste.erroPadrao >= 0, `${id}: erro-padrão inválido`);

  // I7 — série constante ⇒ inclinação nula e R² definido.
  if (perfil === 'constante' && n >= 2) {
    check(Math.abs(p.ajuste.inclinacao) < 1e-6, `${id}: inclinação não nula em série constante`);
    check(p.variacao === 0, `${id}: variação não nula em série constante`);
  }

  // I8 — coerência entre variação, scoreFinal e scoreAtual.
  check(
    Math.abs(p.variacao - round1(p.scoreFinal - p.scoreAtual)) < 1e-9,
    `${id}: variação inconsistente`
  );

  // I9 — competenciaCritica é a PRIMEIRA abaixo do limiar, se houver.
  const esperadoCritico = p.pontos.find((pt) => pt.score < LIMIAR_ALERTA)?.competencia ?? null;
  check(p.competenciaCritica === esperadoCritico, `${id}: competência crítica incorreta`);
  if (p.competenciaCritica === null) {
    check(p.pontos.every((pt) => pt.score >= LIMIAR_ALERTA), `${id}: crítico não sinalizado`);
  }

  // I10 — risco crítico ⟺ score final abaixo do limiar.
  check(
    (p.risco === 'critico') === p.scoreFinal < LIMIAR_ALERTA,
    `${id}: classificação de risco incoerente com o limiar`
  );

  // I11 — lacunas contadas corretamente (nunca negativas).
  check(p.lacunas === contarLacunas(serie) && p.lacunas >= 0, `${id}: contagem de lacunas incorreta`);

  // I12 — determinismo: reexecutar produz JSON idêntico.
  check(
    JSON.stringify(projetarConformidade(serie, horizonte)) === JSON.stringify(p),
    `${id}: resultado não determinístico`
  );

  // I13 — série de gráfico preserva histórico e emenda no último observado.
  const grafico = montarSerieProjecao(serie, p);
  check(grafico.length === n + p.pontos.length, `${id}: série do gráfico com tamanho errado`);
  if (n > 0) {
    check(
      grafico[n - 1].projetado === serie[n - 1].score,
      `${id}: série do gráfico não ancora no último observado`
    );
    check(
      grafico.slice(0, n).every((g, i) => g.observado === serie[i].score),
      `${id}: série do gráfico alterou o histórico`
    );
    check(
      grafico.slice(n).every((g) => g.observado === null),
      `${id}: projeção contaminou a linha observada`
    );
  }

  // I14 — ajuste isolado bate com o ajuste embutido na projeção.
  check(
    JSON.stringify(ajustarTendencia(serie)) === JSON.stringify(p.ajuste),
    `${id}: ajuste divergente entre APIs`
  );

  // I15 — resumo textual sempre presente e não vazio.
  check(p.resumo.trim().length > 0, `${id}: resumo vazio`);
}

// Casos-limite explícitos.
const vazio = projetarConformidade([], 5);
check(vazio.pontos.length === 0 && vazio.scoreAtual === 100, 'vazio: fallback incorreto');
check(somarCompetencia('2025-12', 1) === '2026-01', 'somarCompetencia: virada de ano incorreta');
check(somarCompetencia('2025-01', -1) === '2024-12', 'somarCompetencia: retrocesso incorreto');
check(somarCompetencia('abc', 3) === 'abc', 'somarCompetencia: entrada inválida não preservada');
check(distanciaCompetencias('2025-01', '2025-01') === 0, 'distancia: identidade incorreta');

if (falhas.length > 0) {
  console.error(`✗ ${falhas.length} falhas detectadas:`);
  for (const f of falhas.slice(0, 25)) console.error(`  - ${f}`);
  process.exit(1);
}

console.log(`✓ ${CENARIOS} cenários validados — 15 invariantes + 5 casos-limite, 0 falhas.`);
