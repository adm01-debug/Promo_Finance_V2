import { describe, it, expect } from 'vitest';
import { calcularTributosReforma } from '../reforma-tributaria/calcular-tributos';
import { calcularReformaTributaria } from '../tributario/calculadora/reforma-tributaria';
import { projetarReforma } from '../tributario/projecao-reforma';
import type { DadosOperacao } from '../reforma-tributaria/types';

/**
 * Baseline histórica (ADR-003, 21/11/2026): captura o que os 3 motores de
 * Reforma Tributária retornavam ANTES da correção da Fase 2 do plano
 * (docs/receitafederal/PLANO_CONFORMIDADE_RT_RECEITAFEDERAL_100_ETAPAS.md).
 * Inclui valores sabidamente errados (8,8% hardcoded, soma indevida em 2026,
 * split 75/25). Mantido como referência de "antes x depois"; não roda em CI.
 */
describe.skip('baseline histórica pré-correção', () => {
  const ANOS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

  it('motor 1: calcularTributosReforma (src/lib/reforma-tributaria)', () => {
    const dadosBase: Omit<DadosOperacao, 'valorOperacao'> = {
      tipoOperacao: 'venda',
      ufOrigem: 'SP',
      ufDestino: 'SP',
      cfop: '5102',
    };
    const resultados = ANOS.map((ano) =>
      calcularTributosReforma({ ...dadosBase, valorOperacao: 1000 }, ano)
    );
    expect(resultados).toMatchSnapshot();
  });

  it('motor 2: calcularReformaTributaria (src/lib/tributario/calculadora)', () => {
    const resultados = ANOS.map((ano) =>
      calcularReformaTributaria({
        receitas: { receitaBrutaAnual: 1_000_000, percentualServicos: 50 },
        anoReferencia: ano,
      })
    );
    expect(resultados).toMatchSnapshot();
  });

  it('motor 3: projetarReforma (src/lib/tributario/projecao-reforma)', () => {
    const resultado = projetarReforma({
      faturamentoAnual: 1_000_000,
      percentualServicos: 50,
      pisCofinsAtual: 9.25,
      icmsAtual: 18,
      issAtual: 5,
    });
    expect(resultado.projecoes).toMatchSnapshot();
  });
});
