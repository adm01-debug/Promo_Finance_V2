import { describe, expect, it } from 'vitest';
import { calcularSaudeCatalogos } from '@/lib/tributario/catalogos/saude';
import type { ResumoAlertasCatalogos } from '@/lib/tributario/catalogos/alertas';

const semAlertas: ResumoAlertasCatalogos = {
  alertas: [],
  total: 0,
  criticos: 0,
  atencoes: 0,
  catalogosAfetados: [],
};

describe('calcularSaudeCatalogos', () => {
  it('retorna saudável e score 100 sem divergências nem rejeições', () => {
    const s = calcularSaudeCatalogos({ alertas: semAlertas });
    expect(s.status).toBe('saudavel');
    expect(s.score).toBe(100);
    expect(s.totalProblemas).toBe(0);
  });

  it('classifica como crítico quando há divergência crítica', () => {
    const s = calcularSaudeCatalogos({
      alertas: { ...semAlertas, total: 2, criticos: 1, atencoes: 1, catalogosAfetados: ['ufs'] },
    });
    expect(s.status).toBe('critico');
    expect(s.score).toBe(84);
    expect(s.catalogosAfetadosTitulos[0]).toContain('Unidades Federativas');
  });

  it('conta rejeições de overlay como atenção mesmo sem divergências', () => {
    const s = calcularSaudeCatalogos({
      alertas: semAlertas,
      rejeicoes: { ncm: ['NCM 1234: código inválido'], iss: [] },
    });
    expect(s.status).toBe('atencao');
    expect(s.rejeicoes).toBe(1);
    expect(s.rejeicoesPorOverlay).toHaveLength(1);
    expect(s.resumo).toContain('rejeitado');
  });

  it('nunca deixa o score sair da faixa 0-100', () => {
    const s = calcularSaudeCatalogos({
      alertas: { ...semAlertas, total: 100, criticos: 100 },
    });
    expect(s.score).toBe(0);
  });
});
