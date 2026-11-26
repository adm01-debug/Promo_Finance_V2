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

  it('nome completo vence o sobrenome em comum mesmo com vencimento mais próximo', () => {
    // "PIX ANA SILVA": Ana pontua 0,69 (nome inteiro na descrição) e Maria
    // apenas 0,40 (só o "Silva"). Antes o vencimento decidia e quitava Maria.
    const resultado = conciliarCreditos(
      [credito(100, 'PIX ANA SILVA')],
      [
        titulo('ana', 'Ana Silva', 100, '2026-04-11'),
        titulo('maria', 'Maria Silva', 100, '2026-04-10'),
      ]
    );

    expect(resultado.map((t) => t?.id)).toEqual(['ana']);
  });

  it('manda para o vínculo manual quando só o sobrenome aponta clientes diferentes', () => {
    // Evidência fraca e ambígua: compartilhar "Silva" não diz qual cliente
    // pagou — nenhum dos dois pode ser baixado automaticamente.
    const resultado = conciliarCreditos(
      [credito(100, 'PIX SILVA')],
      [
        titulo('ana', 'Ana Silva', 100, '2026-04-11'),
        titulo('maria', 'Maria Silva', 100, '2026-04-10'),
      ]
    );

    expect(resultado).toEqual([null]);
  });

  it('prioriza o valor exato sobre o valor apenas tolerado', () => {
    // R$ 100,04 está dentro da tolerância, mas quitar esse título recebendo
    // R$ 100,00 deixaria o título de valor exato em aberto.
    const resultado = conciliarCreditos(
      [credito(100, 'PIX BETA')],
      [titulo('tolerado', 'Beta', 100.04, '2026-04-10'), titulo('exato', 'Beta', 100, '2026-04-11')]
    );

    expect(resultado.map((t) => t?.id)).toEqual(['exato']);
  });

  it('desempata em centavos antes do vencimento, sem deixar o float decidir', () => {
    // R$ 100,00 e R$ 100,02 estão os dois a 1 centavo do crédito de R$ 100,01:
    // a diferença em double é 0,010000000000005 contra 0,009999999999991, o
    // que elegia o título que vence no dia seguinte.
    const resultado = conciliarCreditos(
      [credito(100.01, 'PIX BETA')],
      [
        titulo('seguinte', 'Beta', 100.02, '2026-04-11'),
        titulo('mesmo-dia', 'Beta', 100, '2026-04-10'),
      ]
    );

    expect(resultado.map((t) => t?.id)).toEqual(['mesmo-dia']);
  });

  it('tolera cinco centavos comparando inteiros, mesmo quando o float passa do limite', () => {
    // R$ 99,99 contra R$ 100,04: em double a diferença é 0,05000000000000071 e
    // estourava o limite de 0,05, recusando um título cinco centavos distante.
    const compativeis = titulosCompativeis(credito(99.99, 'TED'), [
      titulo('a', 'Alfa', 100.04, '2026-04-10'),
    ]);

    expect(compativeis.map((t) => t.id)).toEqual(['a']);
  });

  it('desempata pelo dia do crédito, sem a hora do extrato decidir', () => {
    // Crédito às 14h do dia do vencimento: sem truncar a hora, o vencimento do
    // próprio dia ficava a 0,58 dia e o do dia seguinte a 0,42 — vencia o errado.
    const resultado = conciliarCreditos(
      [{ valor: 1500, descricao: 'PIX BETA', data: new Date('2026-04-10T14:00:00') }],
      [
        titulo('seguinte', 'Beta ME', 1500, '2026-04-11'),
        titulo('mesmo-dia', 'Beta ME', 1500, '2026-04-10'),
      ]
    );

    expect(resultado.map((t) => t?.id)).toEqual(['mesmo-dia']);
  });

  it('mantém a janela de cinco dias no limite ao contar dias cheios', () => {
    // Crédito em 20/04: 25/04 fica a 5 dias (elegível) e 26/04 a 6 (fora). A
    // contagem por dia de calendário não pode alargar a janela original.
    // 14h do dia 20: pela hora do extrato o vencimento de 25/04 ficaria a 5,42
    // dias e seria recusado; por dia de calendário são exatamente 5.
    const creditoDoDia = {
      valor: 1500,
      descricao: 'PIX BETA',
      data: new Date('2026-04-20T14:00:00'),
    };
    const elegivel = conciliarCreditos(
      [creditoDoDia],
      [titulo('limite', 'Beta ME', 1500, '2026-04-25')]
    );
    const fora = conciliarCreditos(
      [creditoDoDia],
      [titulo('seis-dias', 'Beta ME', 1500, '2026-04-26')]
    );

    expect(elegivel.map((t) => t?.id)).toEqual(['limite']);
    expect(fora).toEqual([null]);
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
