import { afterEach, describe, expect, it } from 'vitest';
import { aplicarOverlayUfs } from '../icms/overlay';
import {
  ALIQUOTAS_UF,
  aliquotaInternaDe,
  definirTabelaUfsEfetiva,
  fcpDe,
  obterTabelaUfsEfetiva,
  resetarTabelaUfsEfetiva,
  resolverAliquotaInterestadual,
} from '../icms/tabelas';
import { calcularIcmsSt } from '../icms/st';

afterEach(() => {
  resetarTabelaUfsEfetiva();
});

describe('tabela efetiva do motor com overlay', () => {
  it('por padrão usa as constantes canônicas', () => {
    expect(obterTabelaUfsEfetiva()).toBe(ALIQUOTAS_UF);
    expect(aliquotaInternaDe('SP')).toBe(ALIQUOTAS_UF.SP.interna);
  });

  it('passa a usar o valor do banco após aplicar o overlay', () => {
    const { tabela } = aplicarOverlayUfs([{ sigla: 'SP', aliquota_interna_padrao: 0.2 }]);
    definirTabelaUfsEfetiva(tabela);
    expect(aliquotaInternaDe('SP')).toBeCloseTo(0.2, 10);
    resetarTabelaUfsEfetiva();
    expect(aliquotaInternaDe('SP')).toBe(0.18);
  });

  it('propaga a alíquota do banco para o cálculo de ICMS-ST', () => {
    const entrada = {
      ufOrigem: 'SP' as const,
      ufDestino: 'MG' as const,
      valorProduto: 1000,
      mvaOriginal: 0.4,
    };
    const base = calcularIcmsSt(entrada);

    const { tabela } = aplicarOverlayUfs([{ sigla: 'MG', aliquota_interna_padrao: 0.22 }]);
    definirTabelaUfsEfetiva(tabela);
    const comOverlay = calcularIcmsSt(entrada);

    expect(comOverlay.icmsSt).toBeGreaterThan(base.icmsSt);
  });

  it('overlay inválido não contamina o motor', () => {
    const { tabela } = aplicarOverlayUfs([{ sigla: 'RJ', aliquota_interna_padrao: 0.95 }]);
    definirTabelaUfsEfetiva(tabela);
    expect(aliquotaInternaDe('RJ')).toBe(ALIQUOTAS_UF.RJ.interna);
    expect(fcpDe('RJ')).toBe(ALIQUOTAS_UF.RJ.fcp);
  });

  it('alíquota interestadual continua governada pela regra constitucional', () => {
    const { tabela } = aplicarOverlayUfs([{ sigla: 'MG', aliquota_interna_padrao: 0.22 }]);
    definirTabelaUfsEfetiva(tabela);
    expect(resolverAliquotaInterestadual('SP', 'MG')).toBe(0.12);
    expect(resolverAliquotaInterestadual('SP', 'BA')).toBe(0.07);
    // Operação interna reflete o overlay.
    expect(resolverAliquotaInterestadual('MG', 'MG')).toBeCloseTo(0.22, 10);
  });
});
