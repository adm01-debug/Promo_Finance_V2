// Testes do orquestrador de elisão fiscal
import { describe, it, expect } from 'vitest';
import { analisarOportunidadesElisao } from '../elisao/orquestrador-elisao';
import type { ContextoEmpresa } from '../elisao/types';

const ctxBase: ContextoEmpresa = {
  empresa_id: 'empresa-test',
  regime_atual: 'real',
  rbt12: 50_000_000,
  faturamento_anual: 50_000_000,
  patrimonio_liquido: 10_000_000,
  lucro_liquido: 5_000_000,
  folha_total_anual: 8_000_000,
  receita_exportacao: 5_000_000,
  beneficio_icms_anual: 500_000,
  dividendos_pf_anual: 1_200_000,
  carga_tributaria_atual: 0.32,
  cnae: '2829',
};

describe('analisarOportunidadesElisao', () => {
  it('roda 9 estratégias e retorna relatório consolidado', () => {
    const r = analisarOportunidadesElisao(ctxBase);
    expect(r.total_oportunidades).toBe(9);
    expect(r.oportunidades).toHaveLength(9);
  });

  it('ranqueia oportunidades por economia decrescente', () => {
    const r = analisarOportunidadesElisao(ctxBase);
    for (let i = 1; i < r.oportunidades.length; i++) {
      expect(r.oportunidades[i - 1].economia_estimada).toBeGreaterThanOrEqual(
        r.oportunidades[i].economia_estimada,
      );
    }
  });

  it('soma economia somente das aplicáveis', () => {
    const r = analisarOportunidadesElisao(ctxBase);
    const somaManual = r.oportunidades
      .filter((o) => o.aplicavel)
      .reduce((acc, o) => acc + o.economia_estimada, 0);
    expect(r.economia_total_estimada).toBe(somaManual);
    expect(r.total_aplicaveis).toBeLessThanOrEqual(r.total_oportunidades);
  });

  it('Simples Nacional limita aplicabilidade de várias estratégias', () => {
    const r = analisarOportunidadesElisao({ ...ctxBase, regime_atual: 'simples', rbt12: 1_000_000 });
    expect(r.total_aplicaveis).toBeLessThan(r.total_oportunidades);
  });

  it('cada oportunidade contém base_legal e risco definidos', () => {
    const r = analisarOportunidadesElisao(ctxBase);
    r.oportunidades.forEach((o) => {
      expect(o.base_legal).toBeTruthy();
      expect(['baixo', 'medio', 'alto']).toContain(o.risco);
      expect(o.proximos_passos).toBeInstanceOf(Array);
    });
  });
});
