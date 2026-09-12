import { describe, expect, it } from 'vitest';
import { calcularMetricasPedidosCompra } from '../pedidos';

describe('calcularMetricasPedidosCompra', () => {
  it('considera somente pedidos persistidos no mês de referência', () => {
    const metricas = calcularMetricasPedidosCompra(
      [
        { dataEmissao: '2026-09-01', status: 'pendente_aprovacao', valorTotal: 100 },
        { dataEmissao: '2026-09-12', status: 'aprovado', valorTotal: 250.5 },
        { dataEmissao: '2026-08-31', status: 'pendente_aprovacao', valorTotal: 900 },
      ],
      new Date('2026-09-12T12:00:00')
    );

    expect(metricas).toEqual({
      pedidosNoMes: 2,
      pendentesAprovacao: 2,
      valorNoMes: 350.5,
    });
  });

  it('não inventa dados quando não há pedidos com data de emissão', () => {
    expect(
      calcularMetricasPedidosCompra(
        [{ dataEmissao: null, status: 'rascunho', valorTotal: 999 }],
        new Date('2026-09-12T12:00:00')
      )
    ).toEqual({ pedidosNoMes: 0, pendentesAprovacao: 0, valorNoMes: 0 });
  });
});
