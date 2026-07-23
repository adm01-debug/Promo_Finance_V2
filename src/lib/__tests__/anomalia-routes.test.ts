import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEntidadeUrl,
  getEntidadeListInfo,
  dispatchOpenAnomaliaDrawer,
  ANOMALIA_DRAWER_EVENT,
} from '../anomalia-routes';

describe('anomalia-routes', () => {
  describe('getEntidadeUrl', () => {
    it('fallback para drill-down quando faltam dados', () => {
      expect(getEntidadeUrl(null, null, 'A1')).toBe('/admin/insights-ia/anomalia/A1');
      expect(getEntidadeUrl('movimentacao', null, 'A1')).toBe('/admin/insights-ia/anomalia/A1');
      expect(getEntidadeUrl(undefined, 'x', 'A2')).toBe('/admin/insights-ia/anomalia/A2');
    });

    it.each([
      ['movimentacao', 'M1', '/movimentacoes?highlight=M1'],
      ['conta_pagar', 'P1', '/contas-pagar?highlight=P1'],
      ['conta_receber', 'R1', '/contas-receber?highlight=R1'],
      ['transacao_bancaria', 'T1', '/conciliacao?txId=T1'],
    ])('roteia %s → %s', (tipo, id, esperado) => {
      expect(getEntidadeUrl(tipo, id, 'A1')).toBe(esperado);
    });

    it('tipo desconhecido cai no drill-down', () => {
      expect(getEntidadeUrl('desconhecido', 'X', 'A9')).toBe('/admin/insights-ia/anomalia/A9');
    });
  });

  describe('getEntidadeListInfo', () => {
    it('retorna null para tipos desconhecidos ou nulos', () => {
      expect(getEntidadeListInfo(null)).toBeNull();
      expect(getEntidadeListInfo('outra_coisa')).toBeNull();
    });
    it('retorna label + url para tipos conhecidos', () => {
      expect(getEntidadeListInfo('movimentacao')).toEqual({ url: '/movimentacoes', label: 'Movimentações' });
      expect(getEntidadeListInfo('conta_pagar')).toEqual({ url: '/contas-pagar', label: 'Contas a pagar' });
      expect(getEntidadeListInfo('conta_receber')).toEqual({ url: '/contas-receber', label: 'Contas a receber' });
      expect(getEntidadeListInfo('transacao_bancaria')).toEqual({ url: '/conciliacao', label: 'Conciliação bancária' });
    });
  });

  describe('dispatchOpenAnomaliaDrawer', () => {
    beforeEach(() => vi.restoreAllMocks());
    it('emite CustomEvent com o id no detail', () => {
      const spy = vi.spyOn(window, 'dispatchEvent');
      dispatchOpenAnomaliaDrawer('anom-42');
      expect(spy).toHaveBeenCalledOnce();
      const ev = spy.mock.calls[0][0] as CustomEvent<{ id: string }>;
      expect(ev.type).toBe(ANOMALIA_DRAWER_EVENT);
      expect(ev.detail.id).toBe('anom-42');
    });
  });
});
