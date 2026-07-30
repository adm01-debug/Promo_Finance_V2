// Hook para envio de manifestação do destinatário via edge function `sefaz-manifestar`.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ManifestacaoTipo = '210200' | '210210' | '210220' | '210240';

export const MANIFESTACAO_LABEL: Record<ManifestacaoTipo, string> = {
  '210210': 'Ciência da Operação',
  '210200': 'Confirmar Operação',
  '210220': 'Desconhecer Operação',
  '210240': 'Operação Não Realizada',
};

export interface ManifestarPayload {
  chave_acesso: string;
  tipo: ManifestacaoTipo;
  justificativa?: string;
}

export interface ManifestarResponse {
  ok: boolean;
  cStat: string;
  xMotivo: string;
  nProt: string | null;
  status_novo: string;
  evento_inserido: boolean;
}

export function useManifestarNfe() {
  const qc = useQueryClient();

  return useMutation<ManifestarResponse, Error, ManifestarPayload>({
    mutationFn: async (payload) => {
      if (payload.tipo === '210240' && (!payload.justificativa || payload.justificativa.trim().length < 15)) {
        throw new Error('A justificativa deve ter no mínimo 15 caracteres para Operação Não Realizada.');
      }
      const { data, error } = await supabase.functions.invoke<ManifestarResponse>(
        'sefaz-manifestar',
        { body: payload },
      );
      if (error) throw error;
      if (!data) throw new Error('Resposta vazia da SEFAZ.');
      if (!data.ok) throw new Error(`SEFAZ recusou (cStat ${data.cStat}): ${data.xMotivo}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Manifestação registrada: ${data.xMotivo || data.status_novo}`, {
        description: data.nProt ? `Protocolo ${data.nProt}` : undefined,
      });
      qc.invalidateQueries({ queryKey: ['nfe-recebidas'] });
    },
    onError: (err) => {
      toast.error('Falha ao manifestar NFe', { description: err.message });
    },
  });
}
