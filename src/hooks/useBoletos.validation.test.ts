import { describe, expect, it } from 'vitest';
import { validarEmissaoBoletoConfirmada } from './useBoletos';

describe('validarEmissaoBoletoConfirmada', () => {
  const confirmacao = {
    id: 'pay_123',
    identificationField: '00190500954014481606906809350314337370000000100',
    barCode: '00193373700000001000500940144816060680935031',
  };

  it('aceita uma confirmação completa do provedor', () => {
    expect(validarEmissaoBoletoConfirmada(confirmacao)).toEqual({
      id: 'pay_123',
      linhaDigitavel: confirmacao.identificationField,
      codigoBarras: confirmacao.barCode,
    });
  });

  it('impede criar boleto sem identificador externo', () => {
    expect(() => validarEmissaoBoletoConfirmada({ ...confirmacao, id: '' })).toThrow(/identificador/i);
  });

  it('impede criar boleto sem instrumentos de pagamento', () => {
    expect(() => validarEmissaoBoletoConfirmada({ id: 'pay_123' })).toThrow(/código de barras/i);
  });
});
