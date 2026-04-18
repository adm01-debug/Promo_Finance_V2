import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useProcessarNFOCR(empresaId?: string) {
  const qc = useQueryClient();

  const processar = useMutation({
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
      qc.invalidateQueries({ queryKey: ['notas-fiscais-ocr'] });
    },
    onError: (e: Error) => toast.error(`Erro ao processar NF: ${e.message}`),
  });

  const lista = useQuery({
    queryKey: ['notas-fiscais-ocr', empresaId],
    queryFn: async () => {
      let q = supabase.from('notas_fiscais_ocr' as never)
        .select('*').order('created_at', { ascending: false }).limit(10);
      if (empresaId) q = (q as any).eq('empresa_id', empresaId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 30_000,
  });

  return { processar, lista };
}
