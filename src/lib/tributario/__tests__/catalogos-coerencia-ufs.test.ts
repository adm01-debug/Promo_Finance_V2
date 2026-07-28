import { describe, expect, it } from 'vitest';
import { ALIQUOTAS_UF } from '../icms/tabelas';
import type { UF } from '../icms/types';
import { compararUfsComCatalogo, validarMarcadorFcp } from '../catalogos/coerencia-ufs';
import type { UfCatalogo } from '../catalogos/types';

function catalogoEspelhandoCodigo(): UfCatalogo[] {
  return (Object.keys(ALIQUOTAS_UF) as UF[]).map((sigla, i) => ({
    sigla,
    nome: ALIQUOTAS_UF[sigla].nome,
    codigo_ibge: 10 + i,
    regiao: 'SUDESTE' as const,
    aliquota_interna_padrao: ALIQUOTAS_UF[sigla].interna,
    possui_fcp: ALIQUOTAS_UF[sigla].fcp > 0,
    aliquota_fcp: ALIQUOTAS_UF[sigla].fcp,
    exige_antecipacao: false,
    difal_base_dupla: false,
    vigente_de: '2024-01-01',
    vigente_ate: null,
  }));
}

describe('coerência das UFs entre catálogo e motor ICMS', () => {
  it('cobre as 27 unidades federativas', () => {
    expect(catalogoEspelhandoCodigo()).toHaveLength(27);
  });

  it('não acusa divergência quando o catálogo espelha o motor', () => {
    expect(compararUfsComCatalogo(catalogoEspelhandoCodigo())).toEqual([]);
  });

  it('detecta alíquota interna divergente (regressão MA/PI/RN)', () => {
    const catalogo = catalogoEspelhandoCodigo().map((u) =>
      u.sigla === 'MA' ? { ...u, aliquota_interna_padrao: 0.22 } : u,
    );
    const divergencias = compararUfsComCatalogo(catalogo);
    expect(divergencias).toEqual([
      { uf: 'MA', campo: 'aliquota_interna', valorCodigo: 0.23, valorBanco: 0.22 },
    ]);
  });

  it('detecta FCP divergente', () => {
    const catalogo = catalogoEspelhandoCodigo().map((u) =>
      u.sigla === 'AL' ? { ...u, aliquota_fcp: 0.02 } : u,
    );
    const divergencias = compararUfsComCatalogo(catalogo);
    expect(divergencias).toHaveLength(1);
    expect(divergencias[0].campo).toBe('aliquota_fcp');
  });

  it('detecta UF ausente no banco', () => {
    const catalogo = catalogoEspelhandoCodigo().filter((u) => u.sigla !== 'SP');
    expect(compararUfsComCatalogo(catalogo)).toEqual([
      { uf: 'SP', campo: 'ausente', valorCodigo: 0.18, valorBanco: null },
    ]);
  });

  it('detecta UF excedente no banco', () => {
    const catalogo = catalogoEspelhandoCodigo();
    catalogo.push({ ...catalogo[0], sigla: 'XX' });
    const divergencias = compararUfsComCatalogo(catalogo);
    expect(divergencias).toEqual([
      { uf: 'XX', campo: 'excedente', valorCodigo: null, valorBanco: catalogo[0].aliquota_interna_padrao },
    ]);
  });

  it('tolera ruído de ponto flutuante', () => {
    const catalogo = catalogoEspelhandoCodigo().map((u) =>
      u.sigla === 'RJ' ? { ...u, aliquota_interna_padrao: u.aliquota_interna_padrao + 1e-12 } : u,
    );
    expect(compararUfsComCatalogo(catalogo)).toEqual([]);
  });

  it('acusa marcador de FCP inconsistente', () => {
    const catalogo = catalogoEspelhandoCodigo().map((u) =>
      u.sigla === 'PA' ? { ...u, possui_fcp: true } : u,
    );
    expect(validarMarcadorFcp(catalogo)).toEqual(['PA: possui_fcp=true mas aliquota_fcp=0']);
  });

  it('não acusa marcador inconsistente no catálogo correto', () => {
    expect(validarMarcadorFcp(catalogoEspelhandoCodigo())).toEqual([]);
  });
});
