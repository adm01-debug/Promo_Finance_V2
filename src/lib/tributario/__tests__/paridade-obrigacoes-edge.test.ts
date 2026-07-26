/**
 * Etapa L — Testes de paridade entre o motor de obrigações usado no frontend
 * (`src/lib/tributario/obrigacoes`) e o espelho executado nas Edge Functions
 * (`supabase/functions/_shared/obrigacoes`).
 *
 * Qualquer divergência entre os dois produziria snapshots de conformidade
 * inconsistentes com a tela — por isso a paridade é verificada de forma
 * exaustiva (centenas de combinações competência × regime × status).
 */
import { describe, expect, it } from 'vitest';

import { gerarCalendario as gerarWeb, calcularPrazo as prazoWeb } from '@/lib/tributario/obrigacoes/calendario';
import { calcularConformidade as conformidadeWeb } from '@/lib/tributario/obrigacoes/conformidade';
import { OBRIGACOES as OBRIGACOES_WEB } from '@/lib/tributario/obrigacoes/catalogo';
import type { RegimeAplicavel } from '@/lib/tributario/obrigacoes/types';

import {
  gerarCalendario as gerarEdge,
  calcularPrazo as prazoEdge,
} from '../../../supabase/functions/_shared/obrigacoes/calendario.ts';
import { calcularConformidade as conformidadeEdge } from '../../../supabase/functions/_shared/obrigacoes/conformidade.ts';
import { OBRIGACOES as OBRIGACOES_EDGE } from '../../../supabase/functions/_shared/obrigacoes/catalogo.ts';

const REGIMES: RegimeAplicavel[] = ['simples', 'presumido', 'real', 'todos'];

function competencias(anoInicio: number, anos: number): string[] {
  const out: string[] = [];
  for (let a = anoInicio; a < anoInicio + anos; a += 1) {
    for (let m = 1; m <= 12; m += 1) out.push(`${a}-${String(m).padStart(2, '0')}`);
  }
  return out;
}

describe('paridade catálogo web × edge', () => {
  it('mantém o mesmo conjunto de obrigações', () => {
    expect(OBRIGACOES_EDGE.map((o) => o.id).sort()).toEqual(OBRIGACOES_WEB.map((o) => o.id).sort());
  });

  it('mantém regras, multas e órgãos idênticos', () => {
    for (const web of OBRIGACOES_WEB) {
      const edge = OBRIGACOES_EDGE.find((o) => o.id === web.id);
      expect(edge, `obrigação ausente no espelho: ${web.id}`).toBeDefined();
      expect(edge).toEqual(web);
    }
  });
});

describe('paridade de prazos (24 competências × todas as obrigações)', () => {
  it('produz exatamente o mesmo prazo legal', () => {
    const comps = competencias(2025, 2);
    let comparacoes = 0;
    for (const obrigacao of OBRIGACOES_WEB) {
      const edge = OBRIGACOES_EDGE.find((o) => o.id === obrigacao.id)!;
      for (const competencia of comps) {
        const chave = obrigacao.periodicidade === 'anual' ? competencia.slice(0, 4) : competencia;
        expect(prazoEdge(edge, chave)).toBe(prazoWeb(obrigacao, chave));
        comparacoes += 1;
      }
    }
    expect(comparacoes).toBeGreaterThan(200);
  });
});

describe('paridade do calendário e do score de conformidade', () => {
  it('gera itens e scores idênticos em centenas de cenários', () => {
    const comps = competencias(2026, 1);
    const datasRef = ['2026-01-15', '2026-04-30', '2026-07-26', '2026-12-31'];
    const statuses = ['pendente', 'entregue', 'dispensada', 'retificada'] as const;

    let cenarios = 0;

    for (const regime of REGIMES) {
      for (const hoje of datasRef) {
        for (const competencia of comps) {
          const itensWeb = gerarWeb({ competencias: [competencia], regime, hoje });
          const itensEdge = gerarEdge({ competencias: [competencia], regime, hoje });
          expect(itensEdge).toEqual(itensWeb);

          // Registros determinísticos derivados do índice do item.
          const registros = itensWeb.map((item, i) => ({
            obrigacaoId: item.obrigacaoId,
            competencia: item.competencia,
            status: statuses[i % statuses.length],
            dataEntrega: i % 3 === 0 ? item.prazo : i % 3 === 1 ? '2026-12-20' : null,
            valorMulta: i % 4 === 0 ? 250.5 : 0,
          }));

          const rWeb = conformidadeWeb(itensWeb, registros);
          const rEdge = conformidadeEdge(itensEdge, registros);
          expect(rEdge).toEqual(rWeb);
          expect(rWeb.score).toBeGreaterThanOrEqual(0);
          expect(rWeb.score).toBeLessThanOrEqual(100);
          cenarios += 1;
        }
      }
    }

    expect(cenarios).toBe(REGIMES.length * datasRef.length * comps.length);
    expect(cenarios).toBeGreaterThanOrEqual(192);
  });
});
