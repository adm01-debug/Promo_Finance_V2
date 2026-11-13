// Função utilitária para simular parcelamento
export function simularParcelamento(params: {
  valorOriginal: number;
  descontoPercentual?: number;
  jurosPercentual?: number;
  numeroParcelas: number;
}) {
  const desconto = params.valorOriginal * ((params.descontoPercentual || 0) / 100);
  const valorComDesconto = params.valorOriginal - desconto;
  const juros = valorComDesconto * ((params.jurosPercentual || 0) / 100);
  const valorTotal = valorComDesconto + juros;
  const valorParcela = Math.ceil((valorTotal / params.numeroParcelas) * 100) / 100;

  return {
    valorOriginal: params.valorOriginal,
    desconto,
    juros,
    valorTotal,
    valorParcela,
    numeroParcelas: params.numeroParcelas,
  };
}
