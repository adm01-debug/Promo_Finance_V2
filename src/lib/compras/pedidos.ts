export interface PedidoCompraResumo {
  dataEmissao: string | null;
  status: string;
  valorTotal: number;
}

export interface MetricasPedidosCompra {
  pedidosNoMes: number;
  pendentesAprovacao: number;
  valorNoMes: number;
}

/**
 * Calcula apenas métricas sustentadas pelos pedidos persistidos. Lead time e
 * recebimento não são inferidos porque o schema atual não possui data de
 * recebimento do pedido.
 */
export function calcularMetricasPedidosCompra(
  pedidos: readonly PedidoCompraResumo[],
  referencia = new Date()
): MetricasPedidosCompra {
  const inicioDoMes = new Date(referencia.getFullYear(), referencia.getMonth(), 1);

  const pedidosNoMes = pedidos.filter((pedido) => {
    if (!pedido.dataEmissao) return false;
    return new Date(`${pedido.dataEmissao}T00:00:00`) >= inicioDoMes;
  });

  return {
    pedidosNoMes: pedidosNoMes.length,
    pendentesAprovacao: pedidos.filter((pedido) => pedido.status === 'pendente_aprovacao').length,
    valorNoMes: pedidosNoMes.reduce((total, pedido) => total + pedido.valorTotal, 0),
  };
}
