import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DadosExtraidosNF {
  cnpj_emissor?: string;
  razao_social_emissor?: string;
  cnpj_tomador?: string;
  razao_social_tomador?: string;
  numero_nf?: string;
  data_emissao?: string;
  valor_total?: number;
  descricao?: string;
  cfop?: string;
  impostos?: Record<string, number>;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Mutation-only hook: sends a file to the OCR edge function and returns the
 * extracted data. Does NOT trigger any list query — safe to call from forms
 * that only need the upload capability.
 */
export function useProcessarNFMutation(empresaId?: string) {
  return useMutation({
    mutationFn: async (file: File) => {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke('processar-nf-ocr', {
        body: {
          arquivo_base64: base64,
          arquivo_tipo: file.type,
          arquivo_nome: file.name,
          empresa_id: empresaId,
        },
      });
      if (error) throw error;
      return data as { success: boolean; id: string; dados_extraidos: DadosExtraidosNF };
    },
    onSuccess: () => {
      toast.success('Nota fiscal processada com sucesso');
    },
    onError: (e: Error) => toast.error(`Erro ao processar NF: ${e.message}`),
  });
}

/**
 * Legacy alias kept for backwards-compat. Returns ONLY the mutation so the
 * caller doesn't accidentally fire a query to a non-existent table.
 */
export function useProcessarNFOCR(empresaId?: string) {
  return { processar: useProcessarNFMutation(empresaId) };
}

/**
 * Lista as últimas NFs processadas. Disabled until a real table/view is wired
 * up — the original `notas_fiscais_ocr` table no longer exists, so the OCR
 * results are returned inline from the mutation only.
 */
export function useListaNotasFiscaisOCR(_empresaId?: string) {
  return useQuery({
    queryKey: ['notas-fiscais-ocr', _empresaId],
    queryFn: async () => [] as Array<Record<string, unknown>>,
    enabled: false,
    staleTime: 30_000,
  });
}