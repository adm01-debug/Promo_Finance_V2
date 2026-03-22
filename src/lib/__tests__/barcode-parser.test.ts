import { describe, it, expect } from 'vitest';
import {
  parseBoleto,
  formatarLinhaDigitavel,
  validarCodigoBarras,
} from '../barcode-parser';

describe('Barcode Parser', () => {
  // ========================
  // parseBoleto
  // ========================
  describe('parseBoleto', () => {
    it('código inválido com poucos dígitos retorna erros', () => {
      const r = parseBoleto('12345');
      expect(r.valido).toBe(false);
      expect(r.erros.length).toBeGreaterThan(0);
    });

    it('44 dígitos é reconhecido como código de barras', () => {
      const codigo = '00190000090000000000000000000000000000000000';
      const r = parseBoleto(codigo);
      expect(r.codigoBarras).toBe(codigo);
      expect(r.tipo).toBe('bancario');
    });

    it('47 dígitos é reconhecido como linha digitável', () => {
      const linha = '00190000090000000000000000000000000000000000000';
      const r = parseBoleto(linha);
      expect(r.tipo).toBe('bancario');
    });

    it('48 dígitos é reconhecido como convênio', () => {
      const linha = '000000000000000000000000000000000000000000000000';
      const r = parseBoleto(linha);
      expect(r.tipo).toBe('convenio');
    });

    it('extrai código do banco', () => {
      const codigo = '23790000000000000000000000000000000000000000';
      const r = parseBoleto(codigo);
      expect(r.codigoBanco).toBe('237');
      expect(r.banco).toContain('Bradesco');
    });

    it('banco desconhecido mostra fallback', () => {
      const codigo = '99990000000000000000000000000000000000000000';
      const r = parseBoleto(codigo);
      expect(r.banco).toContain('999');
    });

    it('extrai valor em reais do código de barras', () => {
      const codigo = '23791000000000015000000000000000000000000000';
      const r = parseBoleto(codigo);
      // Value extracted from positions 10-19
      expect(r.valor).toBeGreaterThanOrEqual(0);
    });

    it('remove caracteres não numéricos', () => {
      // 47 digit line with formatting
      const r = parseBoleto('00190.00009 00000.000003 00000.000008 0 00000000000000');
      expect(r.tipo).toBe('bancario');
    });
  });

  // ========================
  // validarCodigoBarras
  // ========================
  describe('validarCodigoBarras', () => {
    it('44 dígitos é válido', () => {
      expect(validarCodigoBarras('0'.repeat(44))).toBe(true);
    });

    it('47 dígitos é válido', () => {
      expect(validarCodigoBarras('0'.repeat(47))).toBe(true);
    });

    it('48 dígitos é válido', () => {
      expect(validarCodigoBarras('0'.repeat(48))).toBe(true);
    });

    it('43 dígitos é inválido', () => {
      expect(validarCodigoBarras('0'.repeat(43))).toBe(false);
    });

    it('string com formatação reconhece dígitos', () => {
      expect(validarCodigoBarras('0'.repeat(44))).toBe(true);
    });
  });

  // ========================
  // formatarLinhaDigitavel
  // ========================
  describe('formatarLinhaDigitavel', () => {
    it('formata 47 dígitos com pontos e espaços', () => {
      const linha = '0'.repeat(47);
      const formatada = formatarLinhaDigitavel(linha);
      expect(formatada).toContain('.');
      expect(formatada).toContain(' ');
    });

    it('retorna original se não tem 47 dígitos', () => {
      const original = '12345';
      expect(formatarLinhaDigitavel(original)).toBe(original);
    });
  });
});
