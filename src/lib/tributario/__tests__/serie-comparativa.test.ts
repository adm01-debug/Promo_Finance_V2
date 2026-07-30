/**
 * Etapa Q — Simulação exaustiva do comparativo temporal (linhas sobrepostas).
 *
 * Valida alinhamento de eixo, tratamento de lacunas, média condicional,
 * unicidade de chaves, domínio do eixo Y e integridade do CSV em centenas de
 * cenários pseudoaleatórios reprodutíveis.
 */
import { describe, it, expect } from 'vitest';

import {
  montarComparativoTemporal,
  exportarComparativoTemporalCsv,
  chaveSerie,
  rotuloEixo,
  type SerieEmpresa,
  type PontoHistorico,
} from '@/lib/tributario/obrigacoes';

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ponto(competencia: string, score: number): PontoHistorico {
  return {
    competencia,
    score,
    nivel: score >= 90 ? 'excelente' : score >= 70 ? 'bom' : 'critico',
    total: 10,
    entregues: Math.round(score / 10),
    vencidasPendentes: score >= 90 ? 0 : 1,
    entreguesComAtraso: 0,
    pontualidade: score,
    multaRegistrada: 0,
  } as PontoHistorico;
}

function gerarSeries(seed: number): SerieEmpresa[] {
  const rand = rng(seed);
  const nEmpresas = 1 + Math.floor(rand() * 6);
  const series: SerieEmpresa[] = [];
  for (let e = 0; e < nEmpresas; e += 1) {
    const pontos: PontoHistorico[] = [];
    for (let m = 1; m <= 12; m += 1) {
      // ~30% de lacunas para exercitar o alinhamento do eixo.
      if (rand() < 0.3) continue;
      pontos.push(ponto(`2026-${String(m).padStart(2, '0')}`, Math.round(rand() * 1000) / 10));
    }
    series.push({ empresaId: `emp-${e}`, nome: `Empresa ${e}`, pontos });
  }
  return series;
}

describe('comparativo temporal — utilitários', () => {
  it('formata rótulos do eixo e tolera lixo', () => {
    expect(rotuloEixo('2026-07')).toBe('07/2026');
    expect(rotuloEixo('2026-13')).toBe('2026-13');
  });

  it('gera dataKeys válidas e únicas', () => {
    const usadas = new Set<string>();
    expect(chaveSerie('a.b-c', usadas)).toBe('e_a_b_c');
    expect(chaveSerie('a.b-c', usadas)).toBe('e_a_b_c_2');
    expect(chaveSerie('a.b.c', usadas)).toBe('e_a_b_c_3');
    expect(chaveSerie('', usadas)).toBe('e_sem_id');
  });
});

describe('comparativo temporal — casos de borda', () => {
  it('sem séries produz resultado vazio e seguro', () => {
    const r = montarComparativoTemporal([]);
    expect(r.vazio).toBe(true);
    expect(r.dados).toHaveLength(0);
    expect(r.dominioY[0]).toBeLessThan(r.dominioY[1]);
  });

  it('empresas sem pontos não quebram o dataset', () => {
    const r = montarComparativoTemporal([
      { empresaId: 'a', nome: 'A', pontos: [] },
      { empresaId: 'b', nome: 'B', pontos: [ponto('2026-01', 80)] },
    ]);
    expect(r.competencias).toEqual(['2026-01']);
    expect(r.series[0].ultimoScore).toBeNull();
    expect(r.series[0].media).toBeNull();
    expect(r.series[1].ultimoScore).toBe(80);
  });

  it('lacuna vira null, nunca zero', () => {
    const r = montarComparativoTemporal([
      { empresaId: 'a', nome: 'A', pontos: [ponto('2026-01', 90)] },
      { empresaId: 'b', nome: 'B', pontos: [ponto('2026-02', 50)] },
    ]);
    const jan = r.dados[0];
    expect(jan[r.series[1].chave]).toBeNull();
    expect(jan.media).toBe(90);
  });

  it('scores inválidos são descartados e fora de faixa são limitados', () => {
    const r = montarComparativoTemporal([
      {
        empresaId: 'a',
        nome: 'A',
        pontos: [
          ponto('2026-01', Number.NaN),
          ponto('2026-02', 140),
          ponto('2026-03', -20),
        ],
      },
    ]);
    expect(r.competencias).toEqual(['2026-02', '2026-03']);
    expect(r.dados[0][r.series[0].chave]).toBe(100);
    expect(r.dados[1][r.series[0].chave]).toBe(0);
  });

  it('competência duplicada mantém o último valor', () => {
    const r = montarComparativoTemporal([
      { empresaId: 'a', nome: 'A', pontos: [ponto('2026-01', 40), ponto('2026-01', 95)] },
    ]);
    expect(r.dados).toHaveLength(1);
    expect(r.dados[0][r.series[0].chave]).toBe(95);
  });

  it('janela limita às competências mais recentes', () => {
    const pontos = Array.from({ length: 12 }, (_, i) =>
      ponto(`2026-${String(i + 1).padStart(2, '0')}`, 80),
    );
    const r = montarComparativoTemporal([{ empresaId: 'a', nome: 'A', pontos }], 3);
    expect(r.competencias).toEqual(['2026-10', '2026-11', '2026-12']);
  });
});

describe('comparativo temporal — 300 cenários pseudoaleatórios', () => {
  it('mantém todas as invariantes', () => {
    for (let seed = 1; seed <= 300; seed += 1) {
      const series = gerarSeries(seed);
      const r = montarComparativoTemporal(series, 12);

      // 1) Eixo é a união ordenada das competências.
      const uniao = [
        ...new Set(series.flatMap((s) => s.pontos.map((p) => p.competencia))),
      ].sort();
      expect(r.competencias).toEqual(uniao);

      // 2) Uma linha por competência; chaves únicas por série.
      expect(r.dados).toHaveLength(uniao.length);
      expect(new Set(r.series.map((s) => s.chave)).size).toBe(r.series.length);

      for (const linha of r.dados) {
        const presentes: number[] = [];
        for (const s of r.series) {
          const v = linha[s.chave];
          // 3) Todo valor é número finito ou null — jamais undefined.
          expect(v === null || typeof v === 'number').toBe(true);
          if (typeof v === 'number') {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(100);
            presentes.push(v);
          }
        }
        // 4) Média condicional: só sobre as empresas com dado.
        if (presentes.length === 0) expect(linha.media).toBeNull();
        else
          expect(linha.media as number).toBeCloseTo(
            Math.round((presentes.reduce((a, b) => a + b, 0) / presentes.length) * 10) / 10,
            1,
          );
      }

      // 5) Estatísticas por série batem com os dados renderizados.
      for (const s of r.series) {
        const valores = r.dados
          .map((l) => l[s.chave])
          .filter((v): v is number => typeof v === 'number');
        expect(s.pontos).toBe(valores.length);
        if (valores.length === 0) {
          expect(s.media).toBeNull();
          expect(s.ultimoScore).toBeNull();
        } else {
          expect(s.ultimoScore).toBe(valores[valores.length - 1]);
          expect(s.media as number).toBeCloseTo(
            Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10,
            1,
          );
        }
      }

      // 6) Domínio Y é crescente, dentro de [0,100] e cobre os extremos.
      const [piso, teto] = r.dominioY;
      expect(piso).toBeGreaterThanOrEqual(0);
      expect(teto).toBeLessThanOrEqual(100);
      expect(piso).toBeLessThan(teto);
      if (!r.vazio) {
        expect(piso).toBeLessThanOrEqual(r.minimo);
        expect(teto).toBeGreaterThanOrEqual(r.maximo);
      }

      // 7) CSV: 1 cabeçalho + 1 linha por competência, colunas consistentes.
      const csv = exportarComparativoTemporalCsv(r);
      const linhas = csv.replace(/^\uFEFF/, '').split('\n');
      expect(linhas).toHaveLength(r.dados.length + 1);
      const colunas = linhas[0].split(';').length;
      expect(colunas).toBe(r.series.length + 2);
      for (const l of linhas) expect(l.split(';').length).toBe(colunas);

      // 8) Determinismo: mesma entrada → mesmo dataset.
      expect(JSON.stringify(montarComparativoTemporal(series, 12))).toBe(JSON.stringify(r));
    }
  });
});
