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

export function useCnpjaLookup() {
  return useMutation<CnpjaData, Error, string>({
    mutationFn: async (cnpj: string) => {
      const cleaned = (cnpj || '').replace(/\D/g, '');
      if (cleaned.length !== 14) {
        throw new Error('CNPJ deve conter 14 dígitos');
      }

      const { data, error } = await supabase.functions.invoke('cnpja-lookup', {
        body: { cnpj: cleaned },
      });

      if (error) throw new Error(error.message || 'Falha ao consultar CNPJ');
      if (!data?.data) throw new Error('CNPJá não retornou dados');

      return data.data as CnpjaData;
    },
    onSuccess: (data) => {
      toast.success(`Dados encontrados: ${data.razaoSocial || data.cnpj}`);
    },
    onError: (error) => {
      logger.error('[useCnpjaLookup] erro:', error);
      toast.error(`Erro ao consultar CNPJ: ${error.message}`);
    },
  });
}
