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

/**
 * Representações aceitáveis de um CPF/CNPJ na busca do cliente Asaas.
 *
 * O cadastro grava só dígitos (`NovaCobrancaDialog.tsx:126`,
 * `cpfCnpj.replace(/\D/g, '')`), mas o formulário de boleto manda o documento
 * como foi digitado — e o próprio placeholder sugere `00.000.000/0000-00`
 * (`NovoBoletoForm.tsx:151`). Comparar texto puro barrava a emissão com
 * "Sacado não cadastrado" mesmo existindo vínculo (achado do Devin e do Codex
 * na PR #424). O valor cru também entra na lista por causa de registros
 * antigos que possam ter sido gravados com pontuação.
 */
export function variacoesDocumento(documento: string | null | undefined): string[] {
  const bruto = (documento ?? '').trim();
  const digitos = bruto.replace(/\D/g, '');
  return Array.from(new Set([digitos, bruto].filter((valor) => valor.length > 0)));
}

/**
 * A cobrança criada no Asaas só vale como emissão se também tiver sido
 * registrada em `asaas_payments`: sem isso ela existe no provedor, cobra o
 * cliente e não aparece em nenhuma tela do financeiro. O proxy devolve esse
 * veredito em `registro_local` (asaas-proxy/index.ts, case criar_cobranca);
 * respostas antigas, sem o campo, não são tratadas como falha.
 */
export function exigirRegistroLocalDaCobranca(resposta: unknown): void {
  if (!resposta || typeof resposta !== 'object') return;
  const registro = (resposta as Record<string, unknown>).registro_local;
  if (!registro || typeof registro !== 'object') return;
  const { ok, erro } = registro as { ok?: unknown; erro?: unknown };
  if (ok === false) {
    const detalhe = typeof erro === 'string' && erro.trim() ? ` Detalhe: ${erro}` : '';
    throw new Error(
      `A cobrança foi criada no Asaas, mas não pôde ser registrada no sistema.${detalhe} ` +
        'Nenhum boleto local foi gerado — confira a cobrança no painel do Asaas antes de tentar de novo.'
    );
  }
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
