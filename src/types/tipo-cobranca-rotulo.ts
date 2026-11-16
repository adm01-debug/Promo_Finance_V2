import type { TipoCobranca } from '@/types/financial';

/**
 * Rótulo de tela para a forma de cobrança. Existe porque a tela mostrava o
 * valor cru (`tipo_cobranca.toUpperCase()`), e ao alinhar o vocabulário ao
 * banco isso passaria a exibir "CARTAO_CREDITO" para o usuário.
 */
const ROTULOS: Record<TipoCobranca, string> = {
  boleto: 'Boleto',
  pix: 'PIX',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  transferencia: 'Transferência',
  dinheiro: 'Dinheiro',
};

export function rotuloTipoCobranca(valor?: string | null): string {
  if (!valor) return ROTULOS.boleto;
  return ROTULOS[valor as TipoCobranca] ?? valor;
}
