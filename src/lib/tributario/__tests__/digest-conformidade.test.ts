/**
 * Etapa P — Simulação exaustiva do digest de conformidade fiscal.
 *
 * Cobre invariantes estruturais (agrupamento, ordenação, totais), segurança
 * (escapamento de HTML) e determinismo (hash estável) sobre centenas de
 * cenários pseudoaleatórios reprodutíveis.
 */
import { describe, it, expect } from 'vitest';

import {
  construirDigest,
  agruparPorEmpresa,
  escaparHtml,
  hashConteudo,
  montarAssunto,
  normalizarSeveridade,
  rotuloCompetencia,
  type AlertaDigest,
} from '@/lib/tributario/obrigacoes/digest';

/** PRNG determinístico (mulberry32) — cenários reprodutíveis entre execuções. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEVERIDADES = ['critica', 'alta', 'media', 'baixa'] as const;
const PESO: Record<string, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

function gerarAlertas(seed: number): AlertaDigest[] {
  const rand = rng(seed);
  const nEmpresas = 1 + Math.floor(rand() * 5);
  const alertas: AlertaDigest[] = [];
  for (let e = 0; e < nEmpresas; e += 1) {
    const nAlertas = 1 + Math.floor(rand() * 6);
    for (let a = 0; a < nAlertas; a += 1) {
      const mes = String(1 + Math.floor(rand() * 12)).padStart(2, '0');
      alertas.push({
        empresaId: `empresa-${e}`,
        empresaNome: `Empresa <${e}> & Cia`,
        tipo: ['score_baixo', 'queda_abrupta', 'multa_acumulada'][Math.floor(rand() * 3)],
        severidade: SEVERIDADES[Math.floor(rand() * 4)],
        competencia: `2026-${mes}`,
        titulo: `Alerta "${a}" <script>x</script>`,
        mensagem: `Mensagem & detalhe ${a}`,
        valor: rand() > 0.6 ? Math.round(rand() * 500000) / 100 : null,
      });
    }
  }
  return alertas;
}

describe('digest de conformidade — utilitários', () => {
  it('escapa os cinco caracteres perigosos', () => {
    expect(escaparHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });

  it('normaliza severidades desconhecidas para baixa', () => {
    expect(normalizarSeveridade('CRITICA')).toBe('critica');
    expect(normalizarSeveridade('urgentíssimo')).toBe('baixa');
    expect(normalizarSeveridade(undefined)).toBe('baixa');
    expect(normalizarSeveridade(42)).toBe('baixa');
  });

  it('formata competência e tolera formatos inesperados', () => {
    expect(rotuloCompetencia('2026-03')).toBe('03/2026');
    expect(rotuloCompetencia('março')).toBe('março');
    expect(rotuloCompetencia('')).toBe('');
  });

  it('hash é estável e sensível ao conteúdo', () => {
    expect(hashConteudo('abc')).toBe(hashConteudo('abc'));
    expect(hashConteudo('abc')).not.toBe(hashConteudo('abd'));
  });
});

describe('digest de conformidade — casos de borda', () => {
  it('lista vazia produz digest neutro e sem blocos', () => {
    const d = construirDigest([]);
    expect(d.totalAlertas).toBe(0);
    expect(d.totalEmpresas).toBe(0);
    expect(d.severidadeMaxima).toBeNull();
    expect(d.assunto).toContain('nenhum alerta');
    expect(d.html).toContain('Nenhum alerta de conformidade em aberto');
  });

  it('valores inválidos não contaminam os totais', () => {
    const d = construirDigest([
      {
        empresaId: 'x',
        empresaNome: 'X',
        tipo: 'multa_acumulada',
        severidade: 'alta',
        competencia: '2026-01',
        titulo: 't',
        mensagem: 'm',
        valor: Number.NaN,
      },
      {
        empresaId: 'x',
        empresaNome: 'X',
        tipo: 'multa_acumulada',
        severidade: 'alta',
        competencia: '2026-02',
        titulo: 't',
        mensagem: 'm',
        valor: 100.005,
      },
    ]);
    expect(Number.isFinite(d.valorTotal)).toBe(true);
    expect(d.valorTotal).toBeCloseTo(100.01, 2);
  });

  it('alerta sem empresaId ainda é agrupado', () => {
    const d = construirDigest([
      {
        empresaId: '',
        empresaNome: '',
        tipo: 'score_baixo',
        severidade: 'critica',
        competencia: '2026-01',
        titulo: 't',
        mensagem: 'm',
      },
    ]);
    expect(d.totalEmpresas).toBe(1);
    expect(d.blocos[0].empresaNome).toBe('Empresa sem nome');
  });
});

describe('digest de conformidade — 400 cenários pseudoaleatórios', () => {
  it('mantém todas as invariantes', () => {
    for (let seed = 1; seed <= 400; seed += 1) {
      const alertas = gerarAlertas(seed);
      const d = construirDigest(alertas, {
        urlBase: 'https://app.exemplo.com/tributario',
        competenciaReferencia: '2026-06',
      });

      // 1) Conservação: nenhum alerta é perdido ou duplicado.
      expect(d.totalAlertas).toBe(alertas.length);

      // 2) Agrupamento: um bloco por empresa distinta.
      const distintas = new Set(alertas.map((a) => a.empresaId)).size;
      expect(d.totalEmpresas).toBe(distintas);

      // 3) Ordenação entre blocos: severidade máxima não regride.
      for (let i = 1; i < d.blocos.length; i += 1) {
        expect(PESO[d.blocos[i - 1].severidadeMaxima]).toBeLessThanOrEqual(
          PESO[d.blocos[i].severidadeMaxima],
        );
      }

      // 4) Ordenação interna: alertas do bloco em gravidade decrescente.
      for (const bloco of d.blocos) {
        for (let i = 1; i < bloco.alertas.length; i += 1) {
          expect(PESO[normalizarSeveridade(bloco.alertas[i - 1].severidade)]).toBeLessThanOrEqual(
            PESO[normalizarSeveridade(bloco.alertas[i].severidade)],
          );
        }
        // 5) Total monetário do bloco é a soma dos valores finitos.
        const esperado =
          Math.round(
            bloco.alertas.reduce((acc, a) => acc + (Number.isFinite(a.valor ?? 0) ? a.valor ?? 0 : 0), 0) * 100,
          ) / 100;
        expect(bloco.valorTotal).toBeCloseTo(esperado, 2);
      }

      // 6) Segurança: nenhuma marcação injetada sobrevive no HTML.
      expect(d.html).not.toContain('<script>');
      expect(d.html).toContain('&lt;script&gt;');

      // 7) Determinismo: mesma entrada → mesmo hash e mesmo corpo.
      const repetido = construirDigest(alertas, {
        urlBase: 'https://app.exemplo.com/tributario',
        competenciaReferencia: '2026-06',
      });
      expect(repetido.hash).toBe(d.hash);
      expect(repetido.html).toBe(d.html);

      // 8) Assunto sempre informativo e não vazio.
      expect(d.assunto.length).toBeGreaterThan(10);
      expect(d.assunto).toContain('conformidade');

      // 9) Severidade máxima global coincide com a pior severidade presente.
      const pior = alertas.reduce(
        (p, a) => Math.min(p, PESO[normalizarSeveridade(a.severidade)]),
        3,
      );
      expect(PESO[d.severidadeMaxima ?? 'baixa']).toBe(pior);

      // 10) Texto alternativo cita todas as empresas.
      for (const bloco of d.blocos) expect(d.texto).toContain(bloco.empresaNome);
    }
  });

  it('ordem de entrada não altera o resultado (comutatividade)', () => {
    for (let seed = 500; seed <= 560; seed += 1) {
      const alertas = gerarAlertas(seed);
      const invertido = [...alertas].reverse();
      expect(construirDigest(invertido).hash).toBe(construirDigest(alertas).hash);
    }
  });

  it('assunto reflete a pior severidade do conjunto', () => {
    const blocos = agruparPorEmpresa([
      {
        empresaId: 'a',
        empresaNome: 'A',
        tipo: 'score_baixo',
        severidade: 'media',
        competencia: '2026-01',
        titulo: 't',
        mensagem: 'm',
      },
      {
        empresaId: 'b',
        empresaNome: 'B',
        tipo: 'score_baixo',
        severidade: 'critica',
        competencia: '2026-01',
        titulo: 't',
        mensagem: 'm',
      },
    ]);
    expect(montarAssunto(blocos, '2026-01')).toContain('crítica');
    expect(montarAssunto(blocos, '2026-01')).toContain('01/2026');
  });
});
