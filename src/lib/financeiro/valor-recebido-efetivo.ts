// valor_recebido tem DEFAULT 0 em contas_receber — um 0 não diferencia
// "quitado sem valor gravado" (legado, recebeu o nominal) de "recebeu 0
// de fato" (cota zero do rateio de acordo com 100% de desconto ou
// centavos residuais). O marcador metadata.acordo_rateio só existe em
// contas quitadas pelo rateio de acordo: com ele o valor_recebido é
// autoritativo mesmo zerado; sem ele, 0 é tratado como não-registrado
// e o KPI cai no valor nominal (comportamento histórico dos painéis).
export function valorRecebidoEfetivo(c: {
  valor_recebido?: number | null;
  valor?: number | null;
  metadata?: unknown;
}): number {
  if (c.valor_recebido == null) return c.valor ?? 0;
  if (c.valor_recebido === 0) {
    const meta =
      c.metadata && typeof c.metadata === 'object' && !Array.isArray(c.metadata)
        ? (c.metadata as Record<string, unknown>)
        : null;
    if (meta?.acordo_rateio == null) return c.valor ?? 0;
  }
  return c.valor_recebido;
}
