import { describe, it, expect } from 'vitest';
import { calcularLucroPresumido } from '../lucro-presumido';
import type { AtividadePresumido, InputLucroPresumido } from '../types';

/**
 * Regressão: a parcela de receita de serviços era sempre presumida a 32%,
 * mesmo quando a atividade preponderante possuía percentual legal próprio
 * (transporte de cargas 8%/12%, passageiros 16%/12%, hospitalares 8%/12% —
 * Lei 9.249/95, arts. 15 e 20). Isso inflava IRPJ/CSLL de transportadoras
 * e clínicas em até 4x sobre a base presumida.
 */

function montar(
  atividade: AtividadePresumido,
  percentualServicos: number,
  receitaBrutaAnual = 3_000_000,
): InputLucroPresumido {
  return {
    receitas: { receitaBrutaAnual, percentualServicos },
    atividade,
    folha: { folhaAnual: 0 },
    estadualMunicipal: {},
  };
}

const ATIVIDADES: AtividadePresumido[] = [
  'comercio', 'industria', 'servicos_geral', 'servicos_profissionais',
  'transporte_cargas', 'transporte_passageiros', 'servicos_hospitalares',
];

// [presuncaoIrpj, presuncaoCsll] esperada sobre 100% de serviços
const ESPERADO: Record<AtividadePresumido, [number, number]> = {
  comercio: [0.32, 0.32],
  industria: [0.32, 0.32],
  servicos_geral: [0.32, 0.32],
  servicos_profissionais: [0.32, 0.32],
  transporte_cargas: [0.08, 0.12],
  transporte_passageiros: [0.16, 0.12],
  servicos_hospitalares: [0.08, 0.12],
};

function irpjEsperado(base: number) {
  const excedente = Math.max(0, base / 4 - 60_000) * 4;
  return base * 0.15 + excedente * 0.1;
}

describe('presunção da parcela de serviços por atividade', () => {
  it.each(ATIVIDADES)('aplica o percentual legal de %s com 100%% de serviços', (atividade) => {
    const receita = 3_000_000;
    const r = calcularLucroPresumido(montar(atividade, 100, receita));
    const [pIrpj, pCsll] = ESPERADO[atividade];

    const irpj = r.tributos.find((t) => t.nome === 'IRPJ');
    const csll = r.tributos.find((t) => t.nome === 'CSLL');
    expect(irpj).toBeDefined();
    expect(csll).toBeDefined();

    expect(irpj!.valor).toBeCloseTo(irpjEsperado(receita * pIrpj), 2);
    expect(csll!.valor).toBeCloseTo(receita * pCsll * 0.09, 2);
  });

  it('mantém 32% na parcela de serviços quando a atividade é mercantil', () => {
    const receita = 2_000_000;
    const r = calcularLucroPresumido(montar('comercio', 50, receita));
    const baseIrpj = receita * 0.5 * 0.08 + receita * 0.5 * 0.32;
    const irpj = r.tributos.find((t) => t.nome === 'IRPJ');
    expect(irpj!.valor).toBeCloseTo(irpjEsperado(baseIrpj), 2);
  });

  it('respeita overrides explícitos acima da derivação por atividade', () => {
    const receita = 1_000_000;
    const r = calcularLucroPresumido({
      ...montar('transporte_cargas', 100, receita),
      aliquotaIrpjPresuncao: 0.32,
      aliquotaCsllPresuncao: 0.32,
    });
    expect(r.tributos.find((t) => t.nome === 'IRPJ')!.valor)
      .toBeCloseTo(irpjEsperado(receita * 0.32), 2);
  });

  it('não superestima transporte de cargas frente a serviços gerais', () => {
    const cargas = calcularLucroPresumido(montar('transporte_cargas', 100));
    const geral = calcularLucroPresumido(montar('servicos_geral', 100));
    expect(cargas.totalTributos).toBeLessThan(geral.totalTributos);
  });

  // ---- Fuzzing determinístico: centenas de cenários ----
  it('mantém invariantes numéricas em 700 cenários', () => {
    let seed = 20260728;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let i = 0; i < 700; i++) {
      const atividade = ATIVIDADES[Math.floor(rnd() * ATIVIDADES.length)];
      const receitaBrutaAnual = Math.round(rnd() * 70_000_000);
      const percentualServicos = Math.round(rnd() * 100);
      const input = montar(atividade, percentualServicos, receitaBrutaAnual);
      input.receitas.devolucoes = Math.round(rnd() * receitaBrutaAnual * 0.05);
      input.folha.folhaAnual = Math.round(rnd() * receitaBrutaAnual * 0.3);

      const r = calcularLucroPresumido(input);
      expect(Number.isFinite(r.totalTributos)).toBe(true);
      expect(Number.isFinite(r.totalAPagar)).toBe(true);
      expect(r.totalTributos).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(r.cargaEfetiva)).toBe(true);
      // A presunção efetiva jamais pode exceder a receita líquida
      const irpj = r.tributos.find((t) => t.nome === 'IRPJ');
      if (irpj) expect(irpj.base).toBeLessThanOrEqual(receitaBrutaAnual + 1);
    }
  });
});
