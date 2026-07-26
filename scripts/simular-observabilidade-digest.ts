/**
 * Etapa T — Simulação massiva do motor de observabilidade do digest.
 *
 * Gera centenas de cenários pseudoaleatórios (determinísticos via LCG) e
 * valida invariantes estruturais dos agregados. Execução:
 *   npx tsx scripts/simular-observabilidade-digest.ts
 */
import {
  agruparDestinatarios,
  agruparMotivos,
  resumirEnvios,
  serieDiaria,
  ultimasFalhas,
  type RegistroEnvioDigest,
  type SituacaoEnvioDigest,
} from '../src/lib/tributario/obrigacoes/observabilidade-digest';

let seed = 20260726;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length) % arr.length];

const SITUACOES: SituacaoEnvioDigest[] = ['enviado', 'ignorado', 'falhou', 'simulado'];
const MOTIVOS = ['fora da janela', 'conteúdo duplicado', 'sem e-mail', 'severidade abaixo do mínimo'];

function gerarCenario(n: number): RegistroEnvioDigest[] {
  const execucoes = ['e1', 'e2', 'e3'].slice(0, 1 + Math.floor(rnd() * 3));
  return Array.from({ length: n }, (_, i) => {
    const situacao = pick(SITUACOES);
    const dia = 1 + Math.floor(rnd() * 28);
    return {
      id: `r${i}`,
      execucaoId: pick(execucoes),
      userId: rnd() > 0.5 ? `u${Math.floor(rnd() * 5)}` : null,
      email: `dest${Math.floor(rnd() * 7)}@exemplo.com`,
      situacao,
      motivo: situacao === 'ignorado' ? pick(MOTIVOS) : null,
      erro: situacao === 'falhou' ? 'HTTP 422' : null,
      totalAlertas: Math.floor(rnd() * 30),
      totalEmpresas: Math.floor(rnd() * 5),
      severidadeMaxima: pick(['baixa', 'media', 'alta', 'critica', null] as const),
      multaTotal: Number((rnd() * 5000).toFixed(2)),
      hashConteudo: `h${Math.floor(rnd() * 10)}`,
      duplicado: rnd() > 0.85,
      simulado: situacao === 'simulado',
      criadoEm: `2026-06-${String(dia).padStart(2, '0')}T${String(Math.floor(rnd() * 24)).padStart(2, '0')}:00:00.000Z`,
    } satisfies RegistroEnvioDigest;
  });
}

let falhas = 0;
const check = (ok: boolean, msg: string) => {
  if (!ok) {
    falhas += 1;
    console.error(`❌ ${msg}`);
  }
};

const CENARIOS = 600;
for (let c = 0; c < CENARIOS; c += 1) {
  const registros = gerarCenario(Math.floor(rnd() * 120));
  const resumo = resumirEnvios(registros);
  const serie = serieDiaria(registros);
  const motivos = agruparMotivos(registros);
  const destinos = agruparDestinatarios(registros);
  const falhasLista = ultimasFalhas(registros, 20);

  check(
    resumo.enviados + resumo.falhas + resumo.ignorados + resumo.simulados === resumo.total,
    `#${c}: soma de situações difere do total`,
  );
  check(resumo.taxaEntrega >= 0 && resumo.taxaEntrega <= 100, `#${c}: taxa de entrega fora de [0,100]`);
  check(
    Math.abs(resumo.taxaEntrega + resumo.taxaFalha - (resumo.enviados + resumo.falhas > 0 ? 100 : 0)) < 0.05,
    `#${c}: taxas não somam 100`,
  );
  check(resumo.multaTotal >= 0, `#${c}: multa negativa`);
  check(resumo.destinatariosUnicos <= resumo.total, `#${c}: destinatários únicos > total`);
  check(
    serie.reduce((s, d) => s + d.enviados + d.falhas + d.ignorados + d.simulados, 0) === resumo.total,
    `#${c}: série diária não fecha com o total`,
  );
  check(
    serie.every((d, i) => i === 0 || serie[i - 1].dia < d.dia),
    `#${c}: série diária fora de ordem`,
  );
  check(
    motivos.reduce((s, m) => s + m.quantidade, 0) === resumo.ignorados,
    `#${c}: motivos não fecham com ignorados`,
  );
  check(
    motivos.every((m, i) => i === 0 || motivos[i - 1].quantidade >= m.quantidade),
    `#${c}: motivos fora de ordem decrescente`,
  );
  check(
    destinos.reduce((s, d) => s + d.enviados + d.falhas, 0) === resumo.total - resumo.ignorados,
    `#${c}: destinatários não fecham`,
  );
  check(falhasLista.length === Math.min(20, resumo.falhas), `#${c}: quantidade de falhas listadas incorreta`);
  check(
    falhasLista.every((f, i) => i === 0 || falhasLista[i - 1].criadoEm >= f.criadoEm),
    `#${c}: falhas fora de ordem decrescente`,
  );
  check(
    JSON.stringify(resumirEnvios(registros)) === JSON.stringify(resumo),
    `#${c}: motor não é determinístico`,
  );
}

const vazio = resumirEnvios([]);
check(vazio.total === 0 && vazio.taxaEntrega === 0 && vazio.ultimaExecucaoEm === null, 'vazio: resumo inválido');

console.log(
  falhas === 0
    ? `✅ ${CENARIOS} cenários validados, 0 falhas.`
    : `❌ ${falhas} invariantes violadas em ${CENARIOS} cenários.`,
);
process.exit(falhas === 0 ? 0 : 1);
