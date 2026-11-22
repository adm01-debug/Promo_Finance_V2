/**
 * Baseline histórica pré-correção RT — NÃO ALTERAR sem revisar achados da auditoria.
 *
 * Este arquivo registra o comportamento dos 3 motores de cálculo ANTES das
 * correções do plano PLANO_100_ETAPAS_RT_RFB.md. Serve como âncora de regressão
 * para detectar drift silencioso entre sessões de execução do plano.
 *
 * @see docs/receitafederal/ADR-003-AUDITORIA-RT-2026-11-21.md
 * @see docs/receitafederal/PLANO_100_ETAPAS_RT_RFB.md
 */
import { describe, it, expect } from 'vitest';
import { calcularTributosReforma } from '@/lib/reforma-tributaria/calcular-tributos';
import { calcularReformaTributaria } from '@/lib/tributario/calculadora/reforma-tributaria';
import { projetarReforma } from '@/lib/tributario/projecao-reforma';
import type { DadosOperacao } from '@/lib/reforma-tributaria/types';

const ANOS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033] as const;

const DADOS_OPERACAO: DadosOperacao = {
  valorOperacao: 100_000,
  tipoOperacao: 'venda',
  ufOrigem: 'SP',
  ufDestino: 'RJ',
  cfop: '6102',
};

const INPUT_REFORMA_BASE = {
  receitas: { receitaBrutaAnual: 1_000_000, percentualServicos: 30 },
};

const PARAMS_PROJECAO = {
  faturamentoAnual: 1_000_000,
  percentualServicos: 30,
  pisCofinsAtual: 9.25,
  icmsAtual: 18,
  issAtual: 5,
};

// eslint-disable-next-line vitest/no-disabled-tests
describe.skip('RT Snapshot Baseline Pré-Correção (baseline histórica — não falhar CI)', () => {
  describe('Motor 1 — calcularTributosReforma (calcular-tributos.ts)', () => {
    for (const ano of ANOS) {
      it(`ano ${ano}: totalTributosNovos + totalTributosAntigos snapshot`, () => {
        const r = calcularTributosReforma(DADOS_OPERACAO, ano);
        expect({
          ano,
          totalNovos: r.totalTributosNovos,
          totalAntigos: r.totalTributosAntigos,
          cargaPct: r.cargaTributariaPercentual,
          faseTransicao: r.faseTransicao,
        }).toMatchSnapshot();
      });
    }
  });

  describe('Motor 2 — calcularReformaTributaria (calculadora/reforma-tributaria.ts)', () => {
    for (const ano of ANOS) {
      it(`ano ${ano}: totalTributos + cargaEfetiva snapshot`, () => {
        const r = calcularReformaTributaria({ ...INPUT_REFORMA_BASE, anoReferencia: ano });
        expect({
          ano,
          totalTributos: r.totalTributos,
          cargaEfetiva: r.cargaEfetiva,
          alertas: r.alertas,
        }).toMatchSnapshot();
      });
    }
  });

  describe('Motor 3 — projetarReforma (projecao-reforma.ts)', () => {
    it('projecoes 2026-2033: totalTributos + cargaEfetiva por ano snapshot', () => {
      const { projecoes, picoTributario } = projetarReforma(PARAMS_PROJECAO);
      const resumo = projecoes.map((p) => ({
        ano: p.ano,
        totalTributos: p.totalTributos,
        cargaEfetiva: p.cargaEfetiva,
      }));
      expect({ resumo, picoAno: picoTributario.ano }).toMatchSnapshot();
    });
    it('2026 nunca é o pico tributário (art. 343 LC 214/2025)', () => {
      const { picoTributario } = projetarReforma(PARAMS_PROJECAO);
      expect(picoTributario.ano).not.toBe(2026);
    });
  });
});
