// Testes de orquestração: decidir-regime + ranqueamento + alertas
import { describe, it, expect } from 'vitest';
import { decidirRegime } from '../decidir-regime';
import type { ParametrosSimulacao } from '../types';

const baseParams: ParametrosSimulacao = {
  faturamentoAnual: 1_000_000,
  margemLucro: 15,
  percentualServicos: 30,
  folhaAnual: 200_000,
  comprasComCredito: 300_000,
  despesasOperacionais: 100_000,
};

describe('decidirRegime', () => {
  it('retorna 3 cenários (Simples, Presumido, Real)', () => {
    const r = decidirRegime(baseParams);
    expect(r.cenarios).toHaveLength(3);
    expect(r.cenarios.map((c) => c.regime).sort()).toEqual([
      'lucro_presumido',
      'lucro_real',
      'simples_nacional',
    ]);
  });

  it('recomenda o cenário de menor carga entre os elegíveis', () => {
    const r = decidirRegime(baseParams);
    const elegiveis = r.cenarios.filter((c) => c.elegivel);
    const menor = elegiveis.reduce((a, b) => (a.totalTributos <= b.totalTributos ? a : b));
    expect(r.recomendado.regime).toBe(menor.regime);
  });

  it('faturamento > R$ 4,8 mi torna Simples inelegível', () => {
    const r = decidirRegime({ ...baseParams, faturamentoAnual: 6_000_000 });
    const simples = r.cenarios.find((c) => c.regime === 'simples_nacional')!;
    expect(simples.elegivel).toBe(false);
    expect(r.recomendado.regime).not.toBe('simples_nacional');
  });

  it('calcula economia vs regime atual quando informado', () => {
    const r = decidirRegime(baseParams, { regimeAtual: 'lucro_real' });
    if (r.recomendado.regime !== 'lucro_real') {
      expect(r.economiaAnualVsAtual).toBeGreaterThanOrEqual(0);
    }
  });

  it('alerta quando RBT12 está perto do sublimite', () => {
    const r = decidirRegime({ ...baseParams, faturamentoAnual: 4_500_000 });
    const temAlerta = r.alertas.some((a) => a.toLowerCase().includes('limite'));
    if (r.recomendado.regime === 'simples_nacional') {
      expect(temAlerta).toBe(true);
    }
  });

  it('justificativa contém nome do regime recomendado', () => {
    const r = decidirRegime(baseParams);
    expect(r.justificativa).toContain(r.recomendado.nome);
  });

  it('empresa nova (sem histórico) usa estimativa anual', () => {
    const r = decidirRegime({ ...baseParams, faturamentoAnual: 500_000 });
    expect(r.recomendado).toBeDefined();
    expect(r.recomendado.totalTributos).toBeGreaterThan(0);
  });
});
