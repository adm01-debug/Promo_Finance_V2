/**
 * Regras de risco, testadas direto (funcoes puras). Cada caso aqui nasceu de um
 * achado da revisao da PR #404.
 */
import { describe, it, expect } from 'vitest';
import {
  calcularProbabilidadeAtraso,
  gerarFatoresRisco,
  teveAtraso,
  type ClienteRiscoEntrada,
  type ContaPendenteEntrada,
} from '../risco';

const emDias = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const pendente = (valor: number): ContaPendenteEntrada => ({
  valor,
  valor_recebido: null,
  status: 'pendente',
  data_vencimento: emDias(20),
});

const cli = (p: Partial<ClienteRiscoEntrada> = {}): ClienteRiscoEntrada => ({
  score: 900,
  limite_credito: 1_000_000,
  ...p,
});

describe('teveAtraso', () => {
  it('titulo ABERTO e ja vencido conta como atraso', () => {
    // achado P1 do Codex: o historico filtra data_vencimento < hoje, e um
    // titulo ainda `pendente` nessa janela esta em atraso -- useCobrancas.ts:73
    // trata assim. Antes devolvia false e a taxa de atraso saia menor.
    expect(
      teveAtraso({ status: 'pendente', data_vencimento: '2026-01-10', data_recebimento: null })
    ).toBe(true);
    expect(
      teveAtraso({ status: 'parcial', data_vencimento: '2026-01-10', data_recebimento: null })
    ).toBe(true);
  });

  it('vencido conta, cancelado nao conta', () => {
    expect(
      teveAtraso({ status: 'vencido', data_vencimento: '2026-01-10', data_recebimento: null })
    ).toBe(true);
    expect(
      teveAtraso({ status: 'cancelado', data_vencimento: '2026-01-10', data_recebimento: null })
    ).toBe(false);
  });

  it('pago depois do vencimento conta; pago antes, nao', () => {
    expect(
      teveAtraso({
        status: 'pago',
        data_vencimento: '2026-01-10',
        data_recebimento: '2026-01-30',
      })
    ).toBe(true);
    expect(
      teveAtraso({
        status: 'pago',
        data_vencimento: '2026-01-10',
        data_recebimento: '2026-01-05',
      })
    ).toBe(false);
  });
});

describe('limite de credito', () => {
  it('limite ZERO nao vira 10.000: qualquer pendencia excede', () => {
    // achado P1 do Codex: `|| 10000` apagava o zero do default do formulario, e
    // R$ 5.000 pendentes viravam "50% de utilizacao".
    const comZero = calcularProbabilidadeAtraso(cli({ limite_credito: 0 }), [pendente(5000)], []);
    const comFolga = calcularProbabilidadeAtraso(
      cli({ limite_credito: 1_000_000 }),
      [pendente(5000)],
      []
    );
    expect(comZero).toBeGreaterThan(comFolga);
    expect(gerarFatoresRisco(cli({ limite_credito: 0 }), [pendente(5000)], [])).toContain(
      'Sem limite de crédito autorizado'
    );
  });

  it('limite nulo (nao informado) nao pontua nem inventa teto', () => {
    expect(calcularProbabilidadeAtraso(cli({ limite_credito: null }), [pendente(5000)], [])).toBe(
      0
    );
    expect(gerarFatoresRisco(cli({ limite_credito: null }), [pendente(5000)], [])).toEqual([]);
  });

  it('limite excedido de verdade continua pontuando', () => {
    expect(gerarFatoresRisco(cli({ limite_credito: 1000 }), [pendente(5000)], [])).toContain(
      'Limite de crédito excedido'
    );
  });
});
