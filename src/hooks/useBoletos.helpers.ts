import { supabase } from '@/integrations/supabase/client';
import type { EmissaoBoletoConfirmada } from './useBoletos.types';

/**
 * Aceita somente uma resposta que permita pagar o boleto de fato. Não é uma
 * validação de dígitos bancários: essa responsabilidade é do emissor, que
 * também precisa devolver um identificador externo rastreável.
 */
export function validarEmissaoBoletoConfirmada(resposta: unknown): EmissaoBoletoConfirmada {
  if (!resposta || typeof resposta !== 'object') {
    throw new Error('ASAAS não retornou confirmação da emissão.');
  }
  const dados = resposta as Record<string, unknown>;
  const id = dados.id;
  const linhaDigitavel = dados.identificationField;
  const codigoBarras = dados.barCode;
  if (typeof id !== 'string' || id.trim() === '') {
    const mensagem =
      typeof dados.error === 'string' && dados.error.trim()
        ? dados.error
        : 'ASAAS não retornou identificador';
    throw new Error(mensagem);
  }
  if (
    typeof linhaDigitavel !== 'string' ||
    linhaDigitavel.trim() === '' ||
    typeof codigoBarras !== 'string' ||
    codigoBarras.trim() === ''
  ) {
    throw new Error(
      'ASAAS não retornou linha digitável e código de barras válidos. Nenhum boleto foi criado.'
    );
  }
  return { id, linhaDigitavel, codigoBarras };
}

export async function getNextBoletoNumber(): Promise<string> {
  const { data, error } = await supabase
    .from('boletos')
    .select('numero')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    const lastNumber = parseInt(data[0].numero ?? '0', 10);
    return (lastNumber + 1).toString().padStart(5, '0');
  }

  return '00001';
}
