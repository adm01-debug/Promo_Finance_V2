import { describe, it, expect } from 'vitest';
import {
  chaveConsulta,
  entradaExpirada,
  lerConsulta,
  limparCacheFiscal,
  salvarConsulta,
  TTL_PADRAO_MS,
} from '@/lib/offline/fiscal-cache';

const DIA_MS = 24 * 60 * 60 * 1000;
const AGORA = Date.parse('2026-11-26T12:00:00.000Z');

describe('fiscal-cache', () => {
  it('gera chave determinística e independente da ordem das propriedades', () => {
    const a = chaveConsulta({ recurso: 'ncm', codigo: '22021000' });
    const b = chaveConsulta({ codigo: '22021000', recurso: 'ncm' });
    expect(a).toBe(b);
    expect(a).not.toBe(chaveConsulta({ recurso: 'ncm', codigo: '22021001' }));
  });

  it('degrada com segurança quando IndexedDB não está disponível (jsdom)', async () => {
    await expect(salvarConsulta('k', { ok: true })).resolves.toBeUndefined();
    await expect(lerConsulta('k')).resolves.toBeNull();
    await expect(limparCacheFiscal()).resolves.toBeUndefined();
  });
  describe('vigencia do dado (etapa 85)', () => {
    it('descarta a entrada no dia seguinte ao fim da vigencia, mesmo dentro do TTL', () => {
      expect(entradaExpirada({ gravadoEm: AGORA - DIA_MS, fimVigencia: '2026-11-25' }, AGORA)).toBe(
        true
      );
    });

    it('mantem a entrada no ultimo dia de vigencia', () => {
      expect(entradaExpirada({ gravadoEm: AGORA - DIA_MS, fimVigencia: '2026-11-26' }, AGORA)).toBe(
        false
      );
    });

    it('aceita timestamp completo em fimVigencia comparando so o dia', () => {
      expect(
        entradaExpirada({ gravadoEm: AGORA, fimVigencia: '2026-11-26T23:59:59Z' }, AGORA)
      ).toBe(false);
      expect(
        entradaExpirada({ gravadoEm: AGORA, fimVigencia: '2026-11-25T23:59:59Z' }, AGORA)
      ).toBe(true);
    });

    it('sem vigencia declarada, vale apenas o TTL', () => {
      expect(entradaExpirada({ gravadoEm: AGORA - DIA_MS, fimVigencia: null }, AGORA)).toBe(false);
      expect(
        entradaExpirada({ gravadoEm: AGORA - TTL_PADRAO_MS - 1, fimVigencia: null }, AGORA)
      ).toBe(true);
    });

    it('valor de vigencia invalido nao expira a entrada por engano', () => {
      expect(entradaExpirada({ gravadoEm: AGORA, fimVigencia: 'sem data' }, AGORA)).toBe(false);
    });
  });
});
