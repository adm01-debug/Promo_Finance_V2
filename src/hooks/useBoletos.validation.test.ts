import { describe, expect, it } from 'vitest';
import {
  exigirRegistroLocalDaCobranca,
  validarEmissaoBoletoConfirmada,
} from './useBoletos.helpers';

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
    expect(() => validarEmissaoBoletoConfirmada({ ...confirmacao, id: '' })).toThrow(
      /identificador/i
    );
  });

  it('impede criar boleto sem instrumentos de pagamento', () => {
    expect(() => validarEmissaoBoletoConfirmada({ id: 'pay_123' })).toThrow(/código de barras/i);
  });
});

describe('exigirRegistroLocalDaCobranca', () => {
  it('passa quando o proxy confirma o registro no banco', () => {
    expect(() =>
      exigirRegistroLocalDaCobranca({ id: 'pay_1', registro_local: { ok: true } })
    ).not.toThrow();
  });

  it('impede dar emissão por concluída quando a cobrança não foi registrada', () => {
    expect(() =>
      exigirRegistroLocalDaCobranca({
        id: 'pay_1',
        registro_local: { ok: false, erro: 'invalid input syntax for type uuid' },
      })
    ).toThrow(/não pôde ser registrada no sistema/i);
  });

  it('inclui o motivo devolvido pelo proxy na mensagem', () => {
    expect(() =>
      exigirRegistroLocalDaCobranca({ registro_local: { ok: false, erro: 'FK violada' } })
    ).toThrow(/FK violada/);
  });

  it('não trata resposta sem o campo como falha', () => {
    expect(() => exigirRegistroLocalDaCobranca({ id: 'pay_1' })).not.toThrow();
    expect(() => exigirRegistroLocalDaCobranca(null)).not.toThrow();
  });
});
