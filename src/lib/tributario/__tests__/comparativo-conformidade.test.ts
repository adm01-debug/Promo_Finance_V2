/**
 * Etapa O — Simulação exaustiva do comparativo multiempresa de conformidade.
 *
 * Cobre invariantes estruturais do ranking, empates, defasagem de competência,
 * empresas sem dados, séries desordenadas/duplicadas e agregados do grupo.
 */
import { describe, expect, it } from 'vitest';
import {
  compararConformidade,
  competenciaReferenciaDe,
  exportarComparativoCsv,
  type SerieEmpresa,
} from '@/lib/tributario/obrigacoes/comparativo';
import { classificarConformidade } from '@/lib/tributario/obrigacoes/conformidade';
import type { PontoHistorico } from '@/lib/tributario/obrigacoes/historico';

const ponto = (
  competencia: string,
  score: number,
  extra: Partial<PontoHistorico> = {}
): PontoHistorico => ({
  competencia,
  score,
  nivel: classificarConformidade(score),
  total: 10,
  entregues: Math.round((score / 100) * 10),
  vencidasPendentes: Math.round(((100 - score) / 100) * 10),
  entreguesComAtraso: 0,
  pontualidade: score,
  multaRegistrada: 0,
  ...extra,
});

const serie = (id: string, nome: string, pontos: PontoHistorico[]): SerieEmpresa => ({
  empresaId: id,
  nome,
  pontos,
});

/** PRNG determinístico (mulberry32) para reprodutibilidade das simulações. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COMPETENCIAS = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

describe('comparativo multiempresa — invariantes estruturais', () => {
  it('mantém invariantes em 400 grupos pseudoaleatórios', () => {
    const rand = prng(20260726);

    for (let caso = 0; caso < 400; caso += 1) {
      const totalEmpresas = 1 + Math.floor(rand() * 8);
      const series: SerieEmpresa[] = [];

      for (let e = 0; e < totalEmpresas; e += 1) {
        const quantidade = Math.floor(rand() * (COMPETENCIAS.length + 1)); // pode ser 0
        const pontos = COMPETENCIAS.slice(0, quantidade).map((c) =>
          ponto(c, Math.round(rand() * 1000) / 10, { multaRegistrada: Math.round(rand() * 500) })
        );
        series.push(serie(`emp-${e}`, `Empresa ${e}`, pontos));
      }

      const { linhas, resumo } = compararConformidade(series);

      // 1. Toda empresa aparece exatamente uma vez.
      expect(linhas).toHaveLength(totalEmpresas);
      expect(new Set(linhas.map((l) => l.empresaId)).size).toBe(totalEmpresas);

      // 2. Posições são monotônicas e começam em 1.
      expect(linhas[0].posicao).toBe(1);
      for (let i = 1; i < linhas.length; i += 1) {
        expect(linhas[i].posicao).toBeGreaterThanOrEqual(linhas[i - 1].posicao);
        expect(linhas[i].posicao).toBeLessThanOrEqual(i + 1);
      }

      // 3. Score decrescente entre empresas avaliadas; "sem dados" sempre ao fim.
      const avaliadas = linhas.filter((l) => !l.semDados);
      for (let i = 1; i < avaliadas.length; i += 1) {
        expect(avaliadas[i - 1].score).toBeGreaterThanOrEqual(avaliadas[i].score);
      }
      const primeiroSemDados = linhas.findIndex((l) => l.semDados);
      if (primeiroSemDados >= 0) {
        expect(linhas.slice(primeiroSemDados).every((l) => l.semDados)).toBe(true);
      }

      // 4. Agregados consistentes.
      expect(resumo.empresas).toBe(totalEmpresas);
      expect(resumo.avaliadas).toBe(avaliadas.length);
      expect(resumo.scoreMedio).toBeGreaterThanOrEqual(0);
      expect(resumo.scoreMedio).toBeLessThanOrEqual(100);
      expect(resumo.scorePonderado).toBeGreaterThanOrEqual(0);
      expect(resumo.scorePonderado).toBeLessThanOrEqual(100);
      expect(
        resumo.distribuicao.critico +
          resumo.distribuicao.atencao +
          resumo.distribuicao.bom +
          resumo.distribuicao.excelente
      ).toBe(avaliadas.length);
      expect(resumo.amplitude).toBeGreaterThanOrEqual(0);

      // 5. Referência é a maior competência de todas as séries.
      expect(resumo.competenciaReferencia).toBe(competenciaReferenciaDe(series));

      // 6. Nenhuma empresa avaliada aponta competência > referência.
      for (const linha of avaliadas) {
        expect(linha.competenciaAvaliada).not.toBeNull();
        if (resumo.competenciaReferencia) {
          expect(linha.competenciaAvaliada! <= resumo.competenciaReferencia).toBe(true);
        }
      }

      // 7. CSV tem uma linha por empresa + cabeçalho.
      expect(exportarComparativoCsv({ linhas, resumo }).split('\n')).toHaveLength(
        totalEmpresas + 1
      );
    }
  });

  it('é determinístico: mesma entrada ⇒ mesma saída', () => {
    const entrada = [
      serie('a', 'Alfa', [ponto('2026-05', 90), ponto('2026-06', 95)]),
      serie('b', 'Beta', [ponto('2026-06', 95)]),
      serie('c', 'Gama', []),
    ];
    expect(compararConformidade(entrada)).toEqual(compararConformidade(entrada));
  });
});

describe('comparativo multiempresa — regras de negócio', () => {
  it('empates de score compartilham posição e saltam a próxima (1,1,3)', () => {
    const { linhas } = compararConformidade([
      serie('a', 'Alfa', [ponto('2026-06', 90)]),
      serie('b', 'Beta', [ponto('2026-06', 90)]),
      serie('c', 'Gama', [ponto('2026-06', 70)]),
    ]);
    expect(linhas.map((l) => l.posicao)).toEqual([1, 1, 3]);
  });

  it('desempata por multa acumulada e depois por nome', () => {
    const { linhas } = compararConformidade([
      serie('z', 'Zeta', [ponto('2026-06', 90, { multaRegistrada: 100 })]),
      serie('a', 'Alfa', [ponto('2026-06', 90, { multaRegistrada: 500 })]),
      serie('b', 'Beta', [ponto('2026-06', 90, { multaRegistrada: 100 })]),
    ]);
    expect(linhas.map((l) => l.nome)).toEqual(['Beta', 'Zeta', 'Alfa']);
  });

  it('avalia empresa defasada pelo último ponto disponível e sinaliza a defasagem', () => {
    const { linhas, resumo } = compararConformidade([
      serie('a', 'Alfa', [ponto('2026-06', 80)]),
      serie('b', 'Beta', [ponto('2026-03', 99)]),
    ]);
    const beta = linhas.find((l) => l.empresaId === 'b')!;
    expect(beta.competenciaAvaliada).toBe('2026-03');
    expect(beta.defasada).toBe(true);
    expect(beta.score).toBe(99);
    expect(resumo.defasadas).toBe(1);
    expect(linhas[0].empresaId).toBe('b'); // ranking usa o score disponível
  });

  it('empresa sem nenhum ponto fica por último, com score 0 e fora das médias', () => {
    const { linhas, resumo } = compararConformidade([
      serie('a', 'Alfa', [ponto('2026-06', 60)]),
      serie('vazia', 'Vazia', []),
    ]);
    const vazia = linhas.at(-1)!;
    expect(vazia.semDados).toBe(true);
    expect(vazia.score).toBe(0);
    expect(vazia.media).toBe(0);
    expect(vazia.competenciaAvaliada).toBeNull();
    expect(resumo.avaliadas).toBe(1);
    expect(resumo.scoreMedio).toBe(60); // a empresa sem dados não puxa a média
  });

  it('respeita competência de referência informada, truncando o futuro', () => {
    const { linhas, resumo } = compararConformidade(
      [serie('a', 'Alfa', [ponto('2026-04', 50), ponto('2026-05', 70), ponto('2026-06', 100)])],
      '2026-05'
    );
    expect(resumo.competenciaReferencia).toBe('2026-05');
    expect(linhas[0].score).toBe(70);
    expect(linhas[0].scoreAnterior).toBe(50);
    expect(linhas[0].delta).toBe(20);
    expect(linhas[0].direcao).toBe('alta');
  });

  it('ignora competência de referência inválida e cai no padrão', () => {
    const entrada = [serie('a', 'Alfa', [ponto('2026-06', 88)])];
    expect(compararConformidade(entrada, '2026-13')).toEqual(compararConformidade(entrada));
    expect(compararConformidade(entrada, 'lixo').resumo.competenciaReferencia).toBe('2026-06');
  });

  it('normaliza séries desordenadas, duplicadas e com competência inválida', () => {
    const { linhas } = compararConformidade([
      serie('a', 'Alfa', [
        ponto('2026-06', 40),
        ponto('2026-04', 10),
        ponto('2026-99', 0),
        ponto('2026-06', 90), // duplicata vence
        ponto('2026-05', 50),
      ]),
    ]);
    expect(linhas[0].score).toBe(90);
    expect(linhas[0].scoreAnterior).toBe(50);
    expect(linhas[0].tendencia.pontos.map((p) => p.competencia)).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
  });

  it('deduplica empresas repetidas mantendo a primeira ocorrência', () => {
    const { linhas } = compararConformidade([
      serie('a', 'Alfa', [ponto('2026-06', 90)]),
      serie('a', 'Alfa (duplicada)', [ponto('2026-06', 10)]),
    ]);
    expect(linhas).toHaveLength(1);
    expect(linhas[0].score).toBe(90);
  });

  it('grupo totalmente vazio devolve resumo neutro sem lançar', () => {
    const { linhas, resumo } = compararConformidade([]);
    expect(linhas).toEqual([]);
    expect(resumo.competenciaReferencia).toBeNull();
    expect(resumo.avaliadas).toBe(0);
    expect(resumo.melhor).toBeNull();
    expect(resumo.pior).toBeNull();
    expect(resumo.amplitude).toBe(0);
  });

  it('score ponderado difere da média simples conforme o volume de obrigações', () => {
    const { resumo } = compararConformidade([
      serie('grande', 'Grande', [ponto('2026-06', 50, { total: 90 })]),
      serie('pequena', 'Pequena', [ponto('2026-06', 100, { total: 10 })]),
    ]);
    expect(resumo.scoreMedio).toBe(75);
    expect(resumo.scorePonderado).toBe(55); // (50*90 + 100*10) / 100
  });

  it('consolida multas e vencidas apenas das empresas avaliadas', () => {
    const { resumo } = compararConformidade([
      serie('a', 'Alfa', [ponto('2026-06', 50, { multaRegistrada: 200, vencidasPendentes: 3 })]),
      serie('b', 'Beta', [ponto('2026-06', 80, { multaRegistrada: 50, vencidasPendentes: 1 })]),
      serie('c', 'Vazia', []),
    ]);
    expect(resumo.multaTotal).toBe(250);
    expect(resumo.vencidasTotal).toBe(4);
  });
});
