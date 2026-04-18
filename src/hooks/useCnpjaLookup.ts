import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CnpjaCnae {
  codigo: string;
  descricao: string;
}

export interface CnpjaEndereco {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export interface CnpjaData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string | null;
  dataAbertura: string | null;
  capitalSocial: number | null;
  naturezaJuridica: string | null;
  porte: string | null;
  regimeAtual: 'simples' | 'mei' | 'presumido_real';
  simplesOptante: boolean;
  meiOptante: boolean;
  cnaePrincipal: CnpjaCnae | null;
  cnaesSecundarios: CnpjaCnae[];
  endereco: CnpjaEndereco;
  raw: unknown;
}

export interface CnpjaLookupResult {
  data: CnpjaData;
  cached: boolean;
  cachedAt?: string;
}

export function useCnpjaLookup() {
  return useMutation<CnpjaLookupResult, Error, string>({
    mutationFn: async (cnpj: string) => {
      const cleaned = (cnpj || '').replace(/\D/g, '');
      if (cleaned.length !== 14) {
        throw new Error('CNPJ deve conter 14 dígitos');
      }

      const { data, error } = await supabase.functions.invoke('cnpja-lookup', {
        body: { cnpj: cleaned },
      });

      if (error) {
        // Tentar extrair detalhe (rate limit etc.) do contexto da resposta
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const payload = await ctx.json();
            if (ctx.status === 429) {
              throw new Error(payload?.error || 'Limite de consultas atingido. Tente mais tarde.');
            }
            if (payload?.error) throw new Error(payload.error);
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message) throw parseErr;
          }
        }
        throw new Error(error.message || 'Falha ao consultar CNPJ');
      }

      if (!data?.data) throw new Error('CNPJá não retornou dados');

      return {
        data: data.data as CnpjaData,
        cached: !!data.cached,
        cachedAt: data.cached_at,
      };
    },
    onSuccess: (result) => {
      if (result.cached) {
        toast.success(`Dados em cache: ${result.data.razaoSocial || result.data.cnpj}`);
      } else {
        toast.success(`Dados encontrados: ${result.data.razaoSocial || result.data.cnpj}`);
      }
    },
    onError: (error) => {
      logger.error('[useCnpjaLookup] erro:', error);
      toast.error(error.message || 'Erro ao consultar CNPJ');
    },
  });
}
