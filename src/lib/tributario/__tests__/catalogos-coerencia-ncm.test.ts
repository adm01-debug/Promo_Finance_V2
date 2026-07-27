// Guarda de coerência entre o catálogo `ncms` do banco e as tabelas do motor.
import { describe, expect, it } from 'vitest';
import {
  MVA_MAXIMO,
  compararNcmsComCatalogo,
  descreverDivergenciasNcm,
  ncmsForaDaTipi,
  type NcmBanco,
} from '@/lib/tributario/catalogos/coerencia-ncm';
import { TIPI } from '@/lib/tributario/ipi-iss/tabelas';
import { classificarNcmMonofasico, normalizarNcm } from '@/lib/tributario/monofasico/classificar';

/** Constrói o espelho perfeito da TIPI, como o banco deveria estar. */
function catalogoEspelho(): NcmBanco[] {
  return TIPI.map((i) => {
    const codigo = normalizarNcm(i.ncm);
    return {
      codigo,
      descricao: i.descricao,
      aliquota_ipi: i.aliquota,
      monofasico_pis_cofins: classificarNcmMonofasico(codigo) !== null,
      sujeito_st: false,
      mva_padrao: null,
    };
  });
}

describe('coerência NCM — catálogo espelho', () => {
  it('não acusa divergência quando o banco espelha a TIPI', () => {
    expect(compararNcmsComCatalogo(catalogoEspelho())).toEqual([]);
  });

  it('catálogo vazio acusa todos os NCMs da TIPI como ausentes', () => {
    const d = compararNcmsComCatalogo([]);
    expect(d).toHaveLength(TIPI.length);
    expect(d.every((x) => x.campo === 'ausente')).toBe(true);
  });
});

describe('coerência NCM — detecção de drift', () => {
  it('detecta divergência de alíquota de IPI', () => {
    const base = catalogoEspelho();
    base[0] = { ...base[0], aliquota_ipi: base[0].aliquota_ipi + 0.05 };
    const d = compararNcmsComCatalogo(base);
    expect(d).toHaveLength(1);
    expect(d[0].campo).toBe('aliquota_ipi');
  });

  it('detecta marcador monofásico invertido', () => {
    const base = catalogoEspelho();
    const alvo = base.findIndex((n) => n.monofasico_pis_cofins);
    const idx = alvo >= 0 ? alvo : 0;
    base[idx] = { ...base[idx], monofasico_pis_cofins: !base[idx].monofasico_pis_cofins };
    const d = compararNcmsComCatalogo(base);
    expect(d.some((x) => x.campo === 'monofasico')).toBe(true);
  });

  it('detecta código duplicado após normalização', () => {
    const base = catalogoEspelho();
    base.push({ ...base[0], codigo: `${base[0].codigo.slice(0, 4)}.${base[0].codigo.slice(4)}` });
    const d = compararNcmsComCatalogo(base);
    expect(d.filter((x) => x.campo === 'duplicado')).toHaveLength(1);
  });

  it('detecta código fora do formato de 8 dígitos', () => {
    const d = compararNcmsComCatalogo([
      { codigo: '123', descricao: 'x', aliquota_ipi: 0, monofasico_pis_cofins: false, sujeito_st: false, mva_padrao: null },
    ]);
    expect(d.some((x) => x.campo === 'codigo_invalido')).toBe(true);
  });

  it('exige MVA válido quando o NCM está sujeito à ST', () => {
    const base = catalogoEspelho();
    base[0] = { ...base[0], sujeito_st: true, mva_padrao: null };
    expect(compararNcmsComCatalogo(base).some((x) => x.campo === 'mva_padrao')).toBe(true);

    base[0] = { ...base[0], mva_padrao: MVA_MAXIMO + 1 };
    expect(compararNcmsComCatalogo(base).some((x) => x.campo === 'mva_padrao')).toBe(true);

    base[0] = { ...base[0], mva_padrao: 0.71 };
    expect(compararNcmsComCatalogo(base).some((x) => x.campo === 'mva_padrao')).toBe(false);
  });

  it('não trata NCM extra fora da TIPI como divergência', () => {
    const base = catalogoEspelho();
    base.push({
      codigo: '01012100',
      descricao: 'Cavalos reprodutores',
      aliquota_ipi: 0,
      monofasico_pis_cofins: false,
      sujeito_st: false,
      mva_padrao: null,
    });
    expect(compararNcmsComCatalogo(base)).toEqual([]);
    expect(ncmsForaDaTipi(base)).toContain('01012100');
  });
});

describe('coerência NCM — fuzzing de 300 catálogos adversos', () => {
  it('nunca lança e sempre descreve toda divergência', () => {
    let seed = 20260727;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let i = 0; i < 300; i++) {
      const base = catalogoEspelho().filter(() => rnd() > 0.15);
      for (const n of base) {
        if (rnd() > 0.8) n.aliquota_ipi = Math.round(rnd() * 100) / 100;
        if (rnd() > 0.85) n.monofasico_pis_cofins = rnd() > 0.5;
        if (rnd() > 0.9) {
          n.sujeito_st = true;
          n.mva_padrao = rnd() > 0.5 ? null : rnd() * 5 - 1;
        }
      }
      const d = compararNcmsComCatalogo(base);
      const msgs = descreverDivergenciasNcm(d);
      expect(msgs).toHaveLength(d.length);
      expect(msgs.every((m) => typeof m === 'string' && m.length > 0)).toBe(true);
    }
  });
});
