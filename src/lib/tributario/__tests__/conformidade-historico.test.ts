/**
 * Etapa K — Simulação massiva do histórico/tendência de conformidade fiscal.
 *
 * Cobre: agregação por competência, ordenação cronológica, média móvel,
 * monotonicidade da direção, snapshots e invariantes numéricas em centenas de
 * cenários combinatórios gerados deterministicamente.
 */
import { describe, expect, it } from 'vitest';
import {
  analisarTendencia,
  construirHistorico,
  competenciaValida,
  direcaoDe,
  LIMIAR_ESTAVEL,
  mediaMovel,
  paraSnapshot,
  type PontoHistorico,
} from '../obrigacoes/historico';
import type { RegistroEntrega } from '../obrigacoes/conformidade';
import type { ItemCalendario, Orgao, SituacaoObrigacao } from '../obrigacoes/types';

const ORGAOS: readonly Orgao[] = ['RFB', 'SEFAZ', 'CAIXA', 'MTE'];
const SITUACOES: readonly SituacaoObrigacao[] = [
  'entregue',
  'vencida',
  'vence_hoje',
  'proxima',
  'futura',
];

function item(
  obrigacaoId: string,
  competencia: string,
  situacao: SituacaoObrigacao,
  orgao: Orgao = 'RFB'
): ItemCalendario {
  return {
    obrigacaoId,
    nome: `Obrigação ${obrigacaoId}`,
    orgao,
    competencia,
    prazo: `${competencia}-15`,
    situacao,
    diasRestantes: situacao === 'vencida' ? -10 : situacao === 'vence_hoje' ? 0 : 10,
    baseLegal: 'teste',
  };
}

const comp = (ano: number, mes: number) => `${ano}-${String(mes).padStart(2, '0')}`;

describe('competenciaValida', () => {
  it('aceita apenas AAAA-MM válido', () => {
    expect(competenciaValida('2025-01')).toBe(true);
    expect(competenciaValida('2025-12')).toBe(true);
    expect(competenciaValida('2025-13')).toBe(false);
    expect(competenciaValida('2025-00')).toBe(false);
    expect(competenciaValida('25-01')).toBe(false);
    expect(competenciaValida('2025-1')).toBe(false);
  });
});

describe('construirHistorico', () => {
  it('retorna série vazia sem itens', () => {
    expect(construirHistorico([])).toEqual([]);
  });

  it('agrupa por competência e ordena cronologicamente mesmo com entrada embaralhada', () => {
    const itens = [
      item('efd', comp(2025, 3), 'futura'),
      item('dctf', comp(2025, 1), 'vencida'),
      item('efd', comp(2025, 2), 'vence_hoje'),
    ];
    const serie = construirHistorico(itens);
    expect(serie.map((p) => p.competencia)).toEqual(['2025-01', '2025-02', '2025-03']);
    expect(serie[0].score).toBe(0);
    expect(serie[1].score).toBe(80);
    expect(serie[2].score).toBe(100);
  });

  it('ignora competências com formato inválido', () => {
    const serie = construirHistorico([item('x', '2025-13', 'vencida'), item('y', '2025-05', 'vencida')]);
    expect(serie).toHaveLength(1);
    expect(serie[0].competencia).toBe('2025-05');
  });

  it('aplica registros de entrega ao mês correto', () => {
    const itens = [item('efd', '2025-01', 'vencida'), item('efd', '2025-02', 'vencida')];
    const registros: RegistroEntrega[] = [
      { obrigacaoId: 'efd', competencia: '2025-01', status: 'entregue', dataEntrega: '2025-01-10' },
    ];
    const serie = construirHistorico(itens, registros);
    expect(serie[0].score).toBe(100);
    expect(serie[1].score).toBe(0);
  });

  it('contabiliza atraso, multa e pontualidade por competência', () => {
    const itens = [item('efd', '2025-04', 'vencida')];
    const registros: RegistroEntrega[] = [
      {
        obrigacaoId: 'efd',
        competencia: '2025-04',
        status: 'entregue',
        dataEntrega: '2025-04-28',
        valorMulta: 1234.567,
      },
    ];
    const [ponto] = construirHistorico(itens, registros);
    expect(ponto.score).toBe(60);
    expect(ponto.entreguesComAtraso).toBe(1);
    expect(ponto.pontualidade).toBe(0);
    expect(ponto.multaRegistrada).toBe(1234.57);
  });
});

describe('mediaMovel', () => {
  it('usa janela parcial no início da série', () => {
    const pontos = construirHistorico([
      item('a', '2025-01', 'vencida'),
      item('a', '2025-02', 'futura'),
      item('a', '2025-03', 'futura'),
    ]);
    const mm = mediaMovel(pontos, 3);
    expect(mm.map((m) => m.media)).toEqual([0, 50, 66.7]);
  });

  it('janela <= 0 é normalizada para 1 (média = score)', () => {
    const pontos = construirHistorico([item('a', '2025-01', 'vence_hoje')]);
    expect(mediaMovel(pontos, 0)[0].media).toBe(80);
  });
});

describe('direcaoDe', () => {
  it('respeita o limiar de estabilidade', () => {
    expect(direcaoDe(LIMIAR_ESTAVEL)).toBe('estavel');
    expect(direcaoDe(-LIMIAR_ESTAVEL)).toBe('estavel');
    expect(direcaoDe(LIMIAR_ESTAVEL + 0.1)).toBe('alta');
    expect(direcaoDe(-LIMIAR_ESTAVEL - 0.1)).toBe('queda');
  });
});

describe('analisarTendencia', () => {
  it('série vazia devolve neutro conforme', () => {
    const t = analisarTendencia([]);
    expect(t.scoreAtual).toBe(100);
    expect(t.scoreAnterior).toBeNull();
    expect(t.direcao).toBe('estavel');
    expect(t.melhor).toBeNull();
  });

  it('série de um ponto não tem delta', () => {
    const t = analisarTendencia(construirHistorico([item('a', '2025-01', 'vencida')]));
    expect(t.delta).toBe(0);
    expect(t.direcao).toBe('estavel');
    expect(t.melhor?.competencia).toBe('2025-01');
    expect(t.pior?.competencia).toBe('2025-01');
  });

  it('detecta melhora e piora entre competências', () => {
    const melhora = analisarTendencia(
      construirHistorico([item('a', '2025-01', 'vencida'), item('a', '2025-02', 'futura')])
    );
    expect(melhora.delta).toBe(100);
    expect(melhora.direcao).toBe('alta');

    const piora = analisarTendencia(
      construirHistorico([item('a', '2025-01', 'futura'), item('a', '2025-02', 'vencida')])
    );
    expect(piora.delta).toBe(-100);
    expect(piora.direcao).toBe('queda');
  });

  it('conta a sequência perfeita a partir do fim', () => {
    const t = analisarTendencia(
      construirHistorico([
        item('a', '2025-01', 'futura'),
        item('a', '2025-02', 'vencida'),
        item('a', '2025-03', 'futura'),
        item('a', '2025-04', 'futura'),
      ])
    );
    expect(t.sequenciaPerfeita).toBe(2);
    expect(t.media).toBe(75);
  });

  it('acumula multas de toda a série', () => {
    const itens = [item('a', '2025-01', 'vencida'), item('a', '2025-02', 'vencida')];
    const registros: RegistroEntrega[] = [
      { obrigacaoId: 'a', competencia: '2025-01', status: 'entregue', dataEntrega: '2025-01-20', valorMulta: 100.5 },
      { obrigacaoId: 'a', competencia: '2025-02', status: 'entregue', dataEntrega: '2025-02-20', valorMulta: 200.25 },
    ];
    expect(analisarTendencia(construirHistorico(itens, registros)).multaAcumulada).toBe(300.75);
  });
});

describe('paraSnapshot', () => {
  it('produz payload persistível coerente com a tabela', () => {
    const [ponto] = construirHistorico([item('a', '2025-06', 'vence_hoje')]);
    const snap = paraSnapshot(ponto);
    expect(snap).toEqual({
      competencia: '2025-06',
      score: 80,
      nivel: 'critico',
      total_obrigacoes: 1,
      entregues: 0,
      vencidas_pendentes: 0,
      entregues_com_atraso: 0,
      pontualidade: 100,
      multa_registrada: 0,
    });
  });
});

describe('simulação massiva — invariantes', () => {
  it('mantém invariantes em 720 séries combinatórias', () => {
    let cenarios = 0;

    for (let s1 = 0; s1 < SITUACOES.length; s1 += 1) {
      for (let s2 = 0; s2 < SITUACOES.length; s2 += 1) {
        for (let s3 = 0; s3 < SITUACOES.length; s3 += 1) {
          for (const orgao of ORGAOS) {
            for (const comEntrega of [false, true]) {
              for (const comAtraso of [false, true]) {
                cenarios += 1;

                const itens = [
                  item('efd', comp(2025, 1), SITUACOES[s1], orgao),
                  item('efd', comp(2025, 2), SITUACOES[s2], orgao),
                  item('dctf', comp(2025, 3), SITUACOES[s3], orgao),
                ];
                const registros: RegistroEntrega[] = comEntrega
                  ? [
                      {
                        obrigacaoId: 'efd',
                        competencia: comp(2025, 2),
                        status: 'entregue',
                        dataEntrega: comAtraso ? '2025-02-28' : '2025-02-01',
                        valorMulta: comAtraso ? 50 : 0,
                      },
                    ]
                  : [];

                const serie = construirHistorico(itens, registros);
                const t = analisarTendencia(serie);

                // 1. Uma competência por mês distinto, em ordem crescente.
                expect(serie).toHaveLength(3);
                expect(serie.map((p) => p.competencia)).toEqual(['2025-01', '2025-02', '2025-03']);

                for (const p of serie) {
                  // 2. Score sempre no domínio [0, 100] com 1 casa decimal.
                  expect(p.score).toBeGreaterThanOrEqual(0);
                  expect(p.score).toBeLessThanOrEqual(100);
                  expect(Math.round(p.score * 10)).toBe(p.score * 10);
                  // 3. Contagens nunca excedem o total do mês.
                  expect(p.entregues + p.vencidasPendentes).toBeLessThanOrEqual(p.total);
                  expect(p.entreguesComAtraso).toBeLessThanOrEqual(p.entregues);
                  expect(p.multaRegistrada).toBeGreaterThanOrEqual(0);
                  // 4. Snapshot é fiel ao ponto.
                  const snap = paraSnapshot(p);
                  expect(snap.score).toBe(p.score);
                  expect(snap.total_obrigacoes).toBe(p.total);
                }

                // 5. Coerência das estatísticas agregadas.
                expect(t.scoreAtual).toBe(serie[2].score);
                expect(t.scoreAnterior).toBe(serie[1].score);
                expect(t.delta).toBeCloseTo(serie[2].score - serie[1].score, 1);
                expect(t.direcao).toBe(direcaoDe(t.delta));
                expect(t.media).toBeGreaterThanOrEqual(t.pior!.score - 0.05);
                expect(t.media).toBeLessThanOrEqual(t.melhor!.score + 0.05);

                // 6. Média móvel de janela 1 replica o score.
                expect(mediaMovel(serie, 1).map((m) => m.media)).toEqual(serie.map((p) => p.score));
              }
            }
          }
        }
      }
    }

    expect(cenarios).toBe(720);
  });

  it('monotonicidade: entregar uma obrigação vencida nunca reduz o score (36 cenários)', () => {
    let cenarios = 0;
    for (let mes = 1; mes <= 12; mes += 1) {
      for (const orgao of ORGAOS.slice(0, 3)) {
        cenarios += 1;
        const competencia = comp(2025, mes);
        const itens = [item('efd', competencia, 'vencida', orgao), item('dctf', competencia, 'vencida', orgao)];
        const semEntrega = construirHistorico(itens)[0].score;
        const comEntrega = construirHistorico(itens, [
          { obrigacaoId: 'efd', competencia, status: 'entregue', dataEntrega: `${competencia}-20` },
        ])[0].score;
        expect(comEntrega).toBeGreaterThanOrEqual(semEntrega);
      }
    }
    expect(cenarios).toBe(36);
  });

  it('série longa de 24 competências produz média móvel suavizada e estável', () => {
    const itens: ItemCalendario[] = [];
    for (let i = 0; i < 24; i += 1) {
      const ano = 2024 + Math.floor(i / 12);
      const competencia = comp(ano, (i % 12) + 1);
      itens.push(item('efd', competencia, i % 2 === 0 ? 'vencida' : 'futura'));
    }
    const serie = construirHistorico(itens);
    expect(serie).toHaveLength(24);

    const mm = mediaMovel(serie, 4);
    expect(mm).toHaveLength(24);
    for (const m of mm) {
      expect(m.media).toBeGreaterThanOrEqual(0);
      expect(m.media).toBeLessThanOrEqual(100);
    }
    // Alternância perfeita → média móvel de 4 estabiliza em 50 a partir do 4º ponto.
    for (let i = 3; i < mm.length; i += 1) expect(mm[i].media).toBe(50);

    const t = analisarTendencia(serie);
    expect(t.media).toBe(50);
    expect(t.melhor!.score).toBe(100);
    expect(t.pior!.score).toBe(0);
  });

  it('pontos duplicados de registro: o último registro prevalece', () => {
    const registros: RegistroEntrega[] = [
      { obrigacaoId: 'a', competencia: '2025-01', status: 'pendente' },
      { obrigacaoId: 'a', competencia: '2025-01', status: 'dispensada' },
    ];
    const [ponto] = construirHistorico([item('a', '2025-01', 'vencida')], registros);
    expect(ponto.score).toBe(100);
  });

  it('série é pura: chamadas repetidas retornam resultados idênticos', () => {
    const itens: ItemCalendario[] = [];
    for (let mes = 1; mes <= 12; mes += 1) {
      itens.push(item('efd', comp(2025, mes), SITUACOES[mes % SITUACOES.length]));
    }
    const a = construirHistorico(itens);
    const b = construirHistorico([...itens].reverse());
    expect(a).toEqual(b);
  });
});

describe('classificação de níveis ao longo da série', () => {
  it('nível acompanha as faixas do score', () => {
    const casos: readonly [number, PontoHistorico['nivel']][] = [
      [100, 'excelente'],
      [95, 'excelente'],
      [94.9, 'bom'],
      [85, 'bom'],
      [84.9, 'atencao'],
      [60, 'atencao'],
      [59.9, 'critico'],
      [0, 'critico'],
    ];
    for (const [score, nivel] of casos) {
      expect(
        paraSnapshot({
          competencia: '2025-01',
          score,
          nivel: 'critico',
          total: 1,
          entregues: 0,
          vencidasPendentes: 0,
          entreguesComAtraso: 0,
          pontualidade: 100,
          multaRegistrada: 0,
        }).nivel
      ).toBe(nivel);
    }
  });
});
