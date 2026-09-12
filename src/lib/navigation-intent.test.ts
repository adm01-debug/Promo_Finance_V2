import { describe, expect, it } from 'vitest';
import { deveAbrirNovoRegistro, navegarParaNovoRegistro } from './navigation-intent';

describe('intenção de navegação para novo registro', () => {
  it('aceita somente a intenção explícita', () => {
    expect(deveAbrirNovoRegistro(navegarParaNovoRegistro())).toBe(true);
    expect(deveAbrirNovoRegistro({ openNewRecord: false })).toBe(false);
    expect(deveAbrirNovoRegistro(null)).toBe(false);
    expect(deveAbrirNovoRegistro(undefined)).toBe(false);
  });
});
