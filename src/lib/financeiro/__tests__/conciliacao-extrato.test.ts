import { describe, it, expect } from 'vitest';
import {
  conciliarCreditos,
  ehMesmoPagador,
  titulosCompativeis,
  type TituloCandidato,
} from '../conciliacao-extrato';

const titulo = (
  id: string,
  cliente: string,
  valor: number,
  vencimento: string
): TituloCandidato => ({ id, cliente_nome: cliente, valor, data_vencimento: vencimento });

const credito = (valor: number, descricao: string, data = '2026-04-10') => ({
  valor,
  descricao,
  data: new Date(`${data}T00:00:00`),
});

describe('titulosCompativeis', () => {
  it('aceita diferença de até R$ 0,05 e 5 dias', () => {
    const compativeis = titulosCompativeis(credito(1500, 'TED'), [
      titulo('a', 'Alfa', 1500.05, '2026-04-15'),
      titulo('b', 'Beta', 1500.5, '2026-04-10'),
      titulo('c', 'Gama', 1500, '2026-04-16'),
    ]);

    expect(compativeis.map((t) => t.id)).toEqual(['a']);
  });
});

describe('ehMesmoPagador', () => {
  it('reconhece o cliente escrito na descrição do crédito', () => {
    const t = titulo('a', 'João Silva ME', 1500, '2026-04-10');
    expect(ehMesmoPagador(credito(1500, 'PIX RECEBIDO JOAO SILVA'), t)).toBe(true);
    expect(ehMesmoPagador(credito(1500, 'TED RECEBIDA BETA'), t)).toBe(false);
  });

  it('não afirma pagador quando o título não tem cliente', () => {
    expect(
      ehMesmoPagador(credito(1500, 'PIX JOAO SILVA'), titulo('a', '', 1500, '2026-04-10'))
    ).toBe(false);
  });
});

describe('conciliarCreditos', () => {
  it('casa o crédito único com o título compatível', () => {
    const resultado = conciliarCreditos(
      [credito(1500, 'TED RECEBIDA')],
      [titulo('a', 'Beta ME', 1500, '2026-04-10')]
    );

    expect(resultado.map((t) => t?.id)).toEqual(['a']);
  });

  it('não quita o título de outro cliente quando dois créditos iguais disputam', () => {
    // Reproduz a divergência: o segundo crédito não pode cair no título da
    // Gama só porque valor e vencimento batem.
    const resultado = conciliarCreditos(
      [credito(1500, 'TED RECEBIDA 1'), credito(1500, 'TED RECEBIDA 2')],
      [
        titulo('beta', 'Beta ME', 1500, '2026-04-10'),
        titulo('gama', 'Gama LTDA', 1500, '2026-04-12'),
      ]
    );

    expect(resultado).toEqual([null, null]);
  });

  it('distribui os créditos pelos títulos do próprio pagador', () => {
    const resultado = conciliarCreditos(
      [credito(1500, 'PIX BETA'), credito(1500, 'PIX BETA')],
      [
        titulo('beta-1', 'Beta ME', 1500, '2026-04-10'),
        titulo('beta-2', 'Beta ME', 1500, '2026-04-12'),
      ]
    );

    expect(resultado.map((t) => t?.id)).toEqual(['beta-1', 'beta-2']);
  });

  it('prefere o pagador identificado ao título de outro cliente', () => {
    const resultado = conciliarCreditos(
      [credito(1500, 'PIX RECEBIDO GAMA LTDA')],
      [
        titulo('beta', 'Beta ME', 1500, '2026-04-10'),
        titulo('gama', 'Gama LTDA', 1500, '2026-04-12'),
      ]
    );

    expect(resultado.map((t) => t?.id)).toEqual(['gama']);
  });

  it('cada título quita um único crédito', () => {
    const resultado = conciliarCreditos(
      [credito(900, 'PIX BETA'), credito(900, 'PIX BETA')],
      [titulo('beta', 'Beta ME', 900, '2026-04-10')]
    );

    expect(resultado.map((t) => t?.id)).toEqual(['beta', undefined]);
  });

  it('devolve null quando nenhum título é compatível', () => {
    const resultado = conciliarCreditos(
      [credito(900, 'PIX')],
      [titulo('a', 'Beta ME', 1500, '2026-04-10')]
    );

    expect(resultado).toEqual([null]);
  });
});
