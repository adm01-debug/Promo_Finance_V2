import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../sefaz-event-logger', () => ({
  getEventos: vi.fn(() => []),
}));

import { getEventos } from '../sefaz-event-logger';
import {
  verificarRejeicoesConsecutivas,
  registrarAlerta,
  getAlertas,
  getAlertasNaoLidos,
  marcarAlertaComoLido,
  marcarTodosComoLidos,
  removerAlerta,
  limparAlertas,
  analisarPadroesRejeicao,
  adicionarListenerAlerta,
  type AlertaRejeicao,
} from '../sefaz-rejection-monitor';

const mockedGetEventos = vi.mocked(getEventos);

const mkEvento = (
  tipo: string,
  offsetMs = 0,
  extras: Record<string, unknown> = {},
): any => ({
  id: `E-${Math.random()}`,
  timestamp: new Date(Date.now() - offsetMs),
  tipo,
  cStat: '999',
  xMotivo: 'Motivo teste',
  ambiente: 'homologacao',
  ...extras,
});

const mkAlerta = (over: Partial<AlertaRejeicao> = {}): AlertaRejeicao => ({
  id: `A-${Math.random()}`,
  tipo: 'aviso',
  titulo: 'Teste',
  mensagem: 'Msg',
  rejeicoesConsecutivas: 3,
  ultimasRejeicoes: [],
  dataDetectado: new Date(),
  lido: false,
  acaoRecomendada: 'Ação',
  ...over,
});

describe('sefaz-rejection-monitor', () => {
  beforeEach(() => {
    limparAlertas();
    mockedGetEventos.mockReset();
    mockedGetEventos.mockReturnValue([]);
  });

  it('retorna null quando não há rejeições suficientes', () => {
    mockedGetEventos.mockReturnValue([mkEvento('REJEICAO')]);
    expect(verificarRejeicoesConsecutivas(3, 5)).toBeNull();
  });

  it('gera alerta tipo aviso ao atingir limite mínimo', () => {
    mockedGetEventos.mockReturnValue([
      mkEvento('REJEICAO'),
      mkEvento('REJEICAO', 1000),
      mkEvento('REJEICAO', 2000),
    ]);
    const alerta = verificarRejeicoesConsecutivas(3, 5);
    expect(alerta?.tipo).toBe('aviso');
    expect(alerta?.rejeicoesConsecutivas).toBe(3);
  });

  it('gera alerta crítico ao atingir limite superior', () => {
    mockedGetEventos.mockReturnValue([
      mkEvento('REJEICAO'),
      mkEvento('REJEICAO', 1000),
      mkEvento('REJEICAO', 2000),
      mkEvento('REJEICAO', 3000),
      mkEvento('REJEICAO', 4000),
    ]);
    const alerta = verificarRejeicoesConsecutivas(3, 5);
    expect(alerta?.tipo).toBe('critico');
  });

  it('para de contar rejeições ao encontrar autorização', () => {
    mockedGetEventos.mockReturnValue([
      mkEvento('REJEICAO'),
      mkEvento('REJEICAO', 1000),
      mkEvento('AUTORIZACAO', 2000),
      mkEvento('REJEICAO', 3000),
    ]);
    expect(verificarRejeicoesConsecutivas(3, 5)).toBeNull();
  });

  it('ignora eventos com mais de 2 horas', () => {
    mockedGetEventos.mockReturnValue([
      mkEvento('REJEICAO', 3 * 60 * 60 * 1000),
      mkEvento('REJEICAO', 3 * 60 * 60 * 1000 + 1000),
      mkEvento('REJEICAO', 3 * 60 * 60 * 1000 + 2000),
    ]);
    expect(verificarRejeicoesConsecutivas(3, 5)).toBeNull();
  });

  it('registra alerta e notifica listeners', () => {
    const listener = vi.fn();
    const unsub = adicionarListenerAlerta(listener);
    const alerta = mkAlerta({ rejeicoesConsecutivas: 4 });
    registrarAlerta(alerta);
    expect(listener).toHaveBeenCalledWith(alerta);
    expect(getAlertas()).toHaveLength(1);
    unsub();
  });

  it('evita duplicatas dentro de 5 minutos', () => {
    registrarAlerta(mkAlerta({ rejeicoesConsecutivas: 5 }));
    registrarAlerta(mkAlerta({ rejeicoesConsecutivas: 5 }));
    expect(getAlertas()).toHaveLength(1);
  });

  it('marca como lido individual e em massa', () => {
    registrarAlerta(mkAlerta({ id: 'X1', rejeicoesConsecutivas: 3 }));
    registrarAlerta(mkAlerta({ id: 'X2', rejeicoesConsecutivas: 4 }));
    expect(getAlertasNaoLidos()).toHaveLength(2);
    marcarAlertaComoLido('X1');
    expect(getAlertasNaoLidos()).toHaveLength(1);
    marcarTodosComoLidos();
    expect(getAlertasNaoLidos()).toHaveLength(0);
  });

  it('remove alerta específico', () => {
    registrarAlerta(mkAlerta({ id: 'DEL', rejeicoesConsecutivas: 7 }));
    removerAlerta('DEL');
    expect(getAlertas().find((a) => a.id === 'DEL')).toBeUndefined();
  });

  it('analisa códigos mais frequentes', () => {
    mockedGetEventos.mockReturnValue([
      mkEvento('REJEICAO', 0, { cStat: '204', xMotivo: 'Duplicidade' }),
      mkEvento('REJEICAO', 1000, { cStat: '204', xMotivo: 'Duplicidade' }),
      mkEvento('REJEICAO', 2000, { cStat: '539', xMotivo: 'Rejeição outra' }),
      mkEvento('AUTORIZACAO', 3000, { cStat: '100', xMotivo: 'OK' }),
    ]);
    const analise = analisarPadroesRejeicao();
    expect(analise.codigosFrequentes[0].codigo).toBe('204');
    expect(analise.codigosFrequentes[0].count).toBe(2);
  });

  it('detecta tendência aumentando', () => {
    const agora = Date.now();
    mockedGetEventos.mockReturnValue([
      mkEvento('REJEICAO', 5 * 60 * 1000),
      mkEvento('REJEICAO', 10 * 60 * 1000),
      mkEvento('REJEICAO', 15 * 60 * 1000),
      mkEvento('REJEICAO', 20 * 60 * 1000),
      mkEvento('REJEICAO', 90 * 60 * 1000),
    ]);
    const analise = analisarPadroesRejeicao();
    expect(analise.tendencia).toBe('aumentando');
    void agora;
  });
});
