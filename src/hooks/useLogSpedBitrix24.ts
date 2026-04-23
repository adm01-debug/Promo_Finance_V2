import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LogSpedBitrixParams {
  empresaId: string;
  empresaNome: string;
  cnpj: string;
  tipo: 'ECF' | 'ECD';
  anoCalendario: number;
  status: 'gerado' | 'bloqueado' | 'transmitido';
  totalErros: number;
  totalAvisos: number;
  totalLinhas?: number;
  totalLancamentos?: number;
  hashSha256?: string | null;
  signedUrl?: string | null;
  arquivoId?: string | null;
  dealId?: string | null;
}

interface LogSpedBitrixResponse {
  success: boolean;
  dealId: string;
  dealUrl: string;
}

/**
 * Envia ao Bitrix24 um log/atualização de status para cada geração SPED,
 * incluindo se foi bloqueada e a contagem de erros/avisos.
 */
export function useLogSpedBitrix24() {
  return useMutation<LogSpedBitrixResponse, Error, LogSpedBitrixParams>({
    mutationFn: async (params) => {
      const { data, error } = await supabase.functions.invoke<LogSpedBitrixResponse>(
        'log-sped-bitrix24',
        { body: params },
      );
      if (error) throw error;
      if (!data?.success) throw new Error('Falha ao registrar log no Bitrix24');
      return data;
    },
    onSuccess: (data, vars) => {
      toast.success(`Bitrix24 atualizado · SPED ${vars.tipo} (${vars.status})`, {
        description: `Deal #${data.dealId} · ${vars.totalErros} erro(s) · ${vars.totalAvisos} aviso(s)`,
        action: { label: 'Abrir CRM', onClick: () => window.open(data.dealUrl, '_blank') },
      });
    },
    onError: (e) => toast.error(`Falha ao logar no Bitrix24: ${e.message}`),
  });
}
