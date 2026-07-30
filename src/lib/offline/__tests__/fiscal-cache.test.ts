import { describe, it, expect } from 'vitest';
import {
  chaveConsulta,
  lerConsulta,
  limparCacheFiscal,
  salvarConsulta,
} from '@/lib/offline/fiscal-cache';

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
});
