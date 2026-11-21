import { describe, it, expect } from 'vitest';
import * as api from '@/types/reforma-tributaria';
import { REF_CBS_2027, REF_IBS } from '@/config/reforma-tributaria';

describe('types/reforma-tributaria — regressão de API pública', () => {
  // ADR-003 (PR #490): ALIQUOTA_CBS_REFERENCIA/ALIQUOTA_IBS_REFERENCIA/
  // ALIQUOTA_REFERENCIA_IVA_DUAL foram removidas — eram 8.8/17.7/26.5
  // hardcoded sem fonte legal (ADCT art. 128 trata da transição, não dessas
  // constantes). A fonte única agora é CRONOGRAMA_OFICIAL/REF_CBS_2027/REF_IBS.
  it('preserva catálogos exportados', () => {
    expect(api.ALIQUOTAS_TRANSICAO.length).toBe(8);
    expect(api.CONFIGURACOES_IS.length).toBe(8);
    expect(api.REGIMES_ESPECIAIS.length).toBeGreaterThan(0);
    expect(api.OBRIGACOES_ACESSORIAS_REFORMA.length).toBeGreaterThan(0);
    expect(api.PLANO_CONTAS_REFORMA.length).toBeGreaterThan(0);
    expect(api.CASHBACK_PERCENTUAIS.percentualCBSCesta).toBe(100);
  });

  it('ALIQUOTAS_TRANSICAO deriva de REF_CBS_2027/REF_IBS, não de constantes fixas', () => {
    const linha2033 = api.ALIQUOTAS_TRANSICAO.find((a) => a.ano === 2033);
    expect(linha2033?.cbs).toBe(REF_CBS_2027);
    expect(linha2033?.ibs).toBeCloseTo(REF_IBS, 5);
  });
});
