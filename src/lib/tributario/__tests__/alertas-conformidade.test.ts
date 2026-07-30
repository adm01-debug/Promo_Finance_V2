/**
 * Etapa N — Simulação exaustiva do motor de alertas de conformidade.
 *
 * Cobre: limiares, deduplicação por chave, ordenação por severidade, robustez
 * a configuração inválida, séries desordenadas e paridade com o espelho usado
 * pelas Edge Functions (centenas de séries geradas deterministicamente).
 */
import { describe, expect, it } from 'vitest';
import {
  avaliarAlertasConformidade,
  CONFIG_ALERTAS_PADRAO,
  severidadeMaxima,
  type AlertaConformidade,
} from '@/lib/tributario/obrigacoes/alertas';
import type { PontoHistorico } from '@/lib/tributario/obrigacoes/historico';
import { classificarConformidade } from '@/lib/tributario/obrigacoes/conformidade';
import { avaliarAlertasConformidade as avaliarEdge } from '../../../../supabase/functions/_shared/obrigacoes/alertas.ts';

function ponto(competencia: string, score: number, extra: Partial<PontoHistorico> = {}): PontoHistorico {
  return {
    competencia,
    score,
    nivel: classificarConformidade(score),
    total: 10,
    entregues: Math.round((score / 100) * 10),
    vencidasPendentes: 0,
    entreguesComAtraso: 0,
    pontualidade: score,
    multaRegistrada: 0,
    ...extra,
  };
}

const comp = (i: number) => `2026-${String((i % 12) + 1).padStart(2, '0')}`;

describe('avaliarAlertasConformidade — regras isoladas', () => {
  it('não emite alertas para série vazia', () => {
    expect(avaliarAlertasConformidade([])).toEqual([]);
    expect(severidadeMaxima([])).toBeNull();
  });

  it('não emite alertas quando o score está saudável e estável', () => {
    const serie = [ponto('2026-01', 98), ponto('2026-02', 99), ponto('2026-03', 100)];
    expect(avaliarAlertasConformidade(serie)).toEqual([]);
  });

  it('emite score_baixo abaixo do mínimo e escala para crítica', () => {
    const alta = avaliarAlertasConformidade([ponto('2026-03', 80)]);
    expect(alta.map((a) => a.tipo)).toContain('score_baixo');
    expect(alta.find((a) => a.tipo === 'score_baixo')?.severidade).toBe('alta');

    const critica = avaliarAlertasConformidade([ponto('2026-03', 40)]);
    expect(critica.find((a) => a.tipo === 'score_baixo')?.severidade).toBe('critica');
  });

  it('respeita a fronteira exata do limiar (85 não alerta, 84.9 alerta)', () => {
    expect(avaliarAlertasConformidade([ponto('2026-03', 85)])).toEqual([]);
    expect(avaliarAlertasConformidade([ponto('2026-03', 84.9)]).map((a) => a.tipo)).toEqual(['score_baixo']);
  });

  it('detecta queda abrupta apenas a partir do limiar', () => {
    const semQueda = avaliarAlertasConformidade([ponto('2026-01', 100), ponto('2026-02', 91)]);
    expect(semQueda.map((a) => a.tipo)).not.toContain('queda_abrupta');

    const comQueda = avaliarAlertasConformidade([ponto('2026-01', 100), ponto('2026-02', 90)]);
    expect(comQueda.map((a) => a.tipo)).toContain('queda_abrupta');

    const severa = avaliarAlertasConformidade([ponto('2026-01', 100), ponto('2026-02', 70)]);
    expect(severa.find((a) => a.tipo === 'queda_abrupta')?.severidade).toBe('alta');
  });

  it('detecta tendência negativa com 3 quedas consecutivas', () => {
    const serie = [ponto('2026-01', 100), ponto('2026-02', 99), ponto('2026-03', 98), ponto('2026-04', 97)];
    expect(avaliarAlertasConformidade(serie).map((a) => a.tipo)).toContain('tendencia_negativa');

    const comRepique = [ponto('2026-01', 100), ponto('2026-02', 99), ponto('2026-03', 99), ponto('2026-04', 98)];
    expect(avaliarAlertasConformidade(comRepique).map((a) => a.tipo)).not.toContain('tendencia_negativa');
  });

  it('alerta obrigações vencidas e escala em 3+', () => {
    const uma = avaliarAlertasConformidade([ponto('2026-03', 95, { vencidasPendentes: 1 })]);
    expect(uma.find((a) => a.tipo === 'obrigacoes_vencidas')?.severidade).toBe('alta');

    const tres = avaliarAlertasConformidade([ponto('2026-03', 95, { vencidasPendentes: 3 })]);
    expect(tres.find((a) => a.tipo === 'obrigacoes_vencidas')?.severidade).toBe('critica');
  });

  it('acumula multas somente na janela configurada', () => {
    const serie = Array.from({ length: 10 }, (_, i) =>
      ponto(`2026-${String(i + 1).padStart(2, '0')}`, 100, { multaRegistrada: i < 4 ? 900 : 0 }),
    );
    // As multas estão fora da janela dos 6 últimos meses.
    expect(avaliarAlertasConformidade(serie).map((a) => a.tipo)).not.toContain('multa_acumulada');

    const recente = avaliarAlertasConformidade(serie, { janelaMulta: 12 });
    expect(recente.find((a) => a.tipo === 'multa_acumulada')?.valor).toBe(3600);
  });

  it('normaliza configuração incoerente sem lançar', () => {
    const serie = [ponto('2026-01', 50)];
    const r = avaliarAlertasConformidade(serie, {
      scoreMinimo: 500,
      scoreCritico: -20,
      quedaMinima: -5,
      quedasConsecutivas: 0,
      janelaMulta: 0,
      multaLimite: -1,
    });
    expect(Array.isArray(r)).toBe(true);
    expect(r.find((a) => a.tipo === 'score_baixo')).toBeDefined();
  });

  it('é indiferente à ordem de entrada da série', () => {
    const cresc = [ponto('2026-01', 100), ponto('2026-02', 80)];
    const desc = [...cresc].reverse();
    expect(avaliarAlertasConformidade(desc)).toEqual(avaliarAlertasConformidade(cresc));
  });
});

describe('simulação combinatória (centenas de séries)', () => {
  const scores = [0, 25, 55, 70, 84.9, 85, 92, 100];
  const vencidas = [0, 1, 3];
  const multas = [0, 400, 2500];

  it('mantém invariantes estruturais e paridade web × edge', () => {
    let cenarios = 0;
    const chavesVistas: string[] = [];

    for (const s0 of scores) {
      for (const s1 of scores) {
        for (const s2 of scores) {
          for (const v of vencidas) {
            for (const m of multas) {
              const serie = [
                ponto(comp(0), s0),
                ponto(comp(1), s1, { multaRegistrada: m }),
                ponto(comp(2), s2, { vencidasPendentes: v, multaRegistrada: m }),
              ];
              const web = avaliarAlertasConformidade(serie);
              const edge = avaliarEdge(serie);

              expect(edge).toEqual(web);

              // Invariantes: chaves únicas, competência sempre a mais recente,
              // severidade válida e ordenação por gravidade.
              const chaves = web.map((a) => a.chave);
              expect(new Set(chaves).size).toBe(chaves.length);
              for (const a of web) {
                expect(a.competencia).toBe(comp(2));
                expect(a.chave).toBe(`${a.tipo}:${a.competencia}`);
                expect(['baixa', 'media', 'alta', 'critica']).toContain(a.severidade);
                expect(a.titulo.length).toBeGreaterThan(5);
                expect(a.mensagem.length).toBeGreaterThan(10);
              }
              const peso: Record<AlertaConformidade['severidade'], number> = {
                critica: 0,
                alta: 1,
                media: 2,
                baixa: 3,
              };
              const pesos = web.map((a) => peso[a.severidade]);
              expect([...pesos].sort((a, b) => a - b)).toEqual(pesos);

              // Coerência com o limiar de score.
              const temScoreBaixo = web.some((a) => a.tipo === 'score_baixo');
              expect(temScoreBaixo).toBe(s2 < CONFIG_ALERTAS_PADRAO.scoreMinimo);

              chavesVistas.push(...chaves);
              cenarios += 1;
            }
          }
        }
      }
    }

    expect(cenarios).toBe(scores.length ** 3 * vencidas.length * multas.length);
    expect(cenarios).toBeGreaterThanOrEqual(4608);
    expect(chavesVistas.length).toBeGreaterThan(1000);
  });

  it('é idempotente: reavaliar a mesma série produz chaves idênticas', () => {
    for (let i = 0; i < 200; i += 1) {
      const serie = Array.from({ length: 6 }, (_, k) =>
        ponto(comp(k), (i * 7 + k * 13) % 101, { vencidasPendentes: (i + k) % 4, multaRegistrada: (i % 5) * 300 }),
      );
      const a = avaliarAlertasConformidade(serie).map((x) => x.chave);
      const b = avaliarAlertasConformidade(serie).map((x) => x.chave);
      expect(b).toEqual(a);
    }
  });
});
