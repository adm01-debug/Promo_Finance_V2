import { describe, it, expect } from 'vitest';
import * as api from '@/types/reforma-tributaria';

describe('types/reforma-tributaria — regressão de API pública', () => {
  it('preserva constantes e catálogos exportados', () => {
    expect(api.ALIQUOTA_CBS_REFERENCIA).toBe(8.8);
    expect(api.ALIQUOTA_IBS_REFERENCIA).toBe(17.7);
    expect(api.ALIQUOTA_REFERENCIA_IVA_DUAL).toBe(26.5);
    expect(api.ALIQUOTAS_TRANSICAO.length).toBe(8);
    expect(api.CONFIGURACOES_IS.length).toBe(8);
    expect(api.REGIMES_ESPECIAIS.length).toBeGreaterThan(0);
    expect(api.OBRIGACOES_ACESSORIAS_REFORMA.length).toBeGreaterThan(0);
    expect(api.PLANO_CONTAS_REFORMA.length).toBeGreaterThan(0);
    expect(api.CASHBACK_PERCENTUAIS.percentualCBSCesta).toBe(100);
  });
});
