import { describe, expect, it } from 'vitest';
import {
  aplicarOverlayUfs,
  normalizarAliquota,
  ufsAusentesNoBanco,
  type RegistroUfBanco,
} from '../icms/overlay';
import { ALIQUOTAS_UF } from '../icms/tabelas';
import type { UF } from '../icms/types';

const catalogoIntegro: RegistroUfBanco[] = (Object.keys(ALIQUOTAS_UF) as UF[]).map((uf) => ({
  sigla: uf,
  aliquota_interna_padrao: ALIQUOTAS_UF[uf].interna,
  aliquota_fcp: ALIQUOTAS_UF[uf].fcp,
}));

describe('normalizarAliquota', () => {
  it('aceita fração, percentual e string com vírgula', () => {
    expect(normalizarAliquota(0.18)).toBe(0.18);
    expect(normalizarAliquota(18)).toBeCloseTo(0.18, 10);
    expect(normalizarAliquota('20,5')).toBeCloseTo(0.205, 10);
  });

  it('rejeita valores não numéricos ou negativos', () => {
    expect(normalizarAliquota(null)).toBeNull();
    expect(normalizarAliquota(undefined)).toBeNull();
    expect(normalizarAliquota('abc')).toBeNull();
    expect(normalizarAliquota(Number.NaN)).toBeNull();
    expect(normalizarAliquota(-1)).toBeNull();
  });
});

describe('aplicarOverlayUfs', () => {
  it('catálogo íntegro não gera divergência nem rejeição', () => {
    const r = aplicarOverlayUfs(catalogoIntegro);
    expect(r.aplicadas).toHaveLength(0);
    expect(r.rejeitadas).toHaveLength(0);
    expect(r.tabela).toEqual(ALIQUOTAS_UF);
  });

  it('não muta a constante canônica do motor', () => {
    const antes = JSON.stringify(ALIQUOTAS_UF);
    aplicarOverlayUfs([{ sigla: 'SP', aliquota_interna_padrao: 0.22 }]);
    expect(JSON.stringify(ALIQUOTAS_UF)).toBe(antes);
  });

  it('aplica atualização legítima vinda do banco', () => {
    const r = aplicarOverlayUfs([{ sigla: 'sp', aliquota_interna_padrao: '20' }]);
    expect(r.tabela.SP.interna).toBeCloseTo(0.2, 10);
    expect(r.aplicadas).toEqual([
      { uf: 'SP', campo: 'interna', valorCodigo: 0.18, valorBanco: 0.2 },
    ]);
  });

  it('rejeita UF inexistente, duplicidade e alíquotas absurdas', () => {
    const r = aplicarOverlayUfs([
      { sigla: 'XX', aliquota_interna_padrao: 0.18 },
      { sigla: 'RJ', aliquota_interna_padrao: 0.9 },
      { sigla: 'MG', aliquota_interna_padrao: 0 },
      { sigla: 'SP', aliquota_interna_padrao: 0.18 },
      { sigla: 'SP', aliquota_interna_padrao: 0.25 },
    ]);
    const motivos = r.rejeitadas.map((x) => `${x.sigla}:${x.motivo}`);
    expect(motivos).toContain('XX:uf_desconhecida');
    expect(motivos).toContain('RJ:interna_invalida');
    expect(motivos).toContain('MG:interna_invalida');
    expect(motivos).toContain('SP:duplicado');
    // valores canônicos preservados
    expect(r.tabela.RJ.interna).toBe(ALIQUOTAS_UF.RJ.interna);
    expect(r.tabela.MG.interna).toBe(ALIQUOTAS_UF.MG.interna);
    expect(r.tabela.SP.interna).toBe(0.18);
  });

  it('rejeita FCP fora do teto sem descartar a alíquota interna válida', () => {
    const r = aplicarOverlayUfs([
      { sigla: 'BA', aliquota_interna_padrao: 0.21, aliquota_fcp: 0.5 },
    ]);
    expect(r.tabela.BA.interna).toBeCloseTo(0.21, 10);
    expect(r.tabela.BA.fcp).toBe(ALIQUOTAS_UF.BA.fcp);
    expect(r.rejeitadas.map((x) => x.motivo)).toContain('fcp_invalido');
  });

  it('é idempotente: reaplicar o resultado não gera novas mudanças', () => {
    const primeiro = aplicarOverlayUfs([{ sigla: 'PI', aliquota_interna_padrao: 21 }]);
    const registros = (Object.keys(primeiro.tabela) as UF[]).map((uf) => ({
      sigla: uf,
      aliquota_interna_padrao: primeiro.tabela[uf].interna,
      aliquota_fcp: primeiro.tabela[uf].fcp,
    }));
    const segundo = aplicarOverlayUfs(registros, primeiro.tabela);
    expect(segundo.aplicadas).toHaveLength(0);
    expect(segundo.rejeitadas).toHaveLength(0);
  });

  it('tolera catálogo vazio mantendo as 27 UFs', () => {
    const r = aplicarOverlayUfs([]);
    expect(Object.keys(r.tabela)).toHaveLength(27);
    expect(ufsAusentesNoBanco([])).toHaveLength(27);
    expect(ufsAusentesNoBanco(catalogoIntegro)).toHaveLength(0);
  });
});
