// Hook: exportação SPED EFD-Contribuições
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useExportarSped() {
  return useMutation({
    mutationFn: async ({ empresaId, periodo }: { empresaId: string; periodo: string }) => {
      const { data, error } = await supabase.functions.invoke('exportar-sped-contribuicoes', {
        body: { empresa_id: empresaId, periodo },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { url: string; file_name: string; total_linhas: number; periodo: string; observacao: string };
    },
    onSuccess: (data) => {
      toast.success(`SPED gerado (${data.total_linhas} linhas)`);
      window.open(data.url, '_blank');
    },
    onError: (e: Error) => toast.error(`Falha ao gerar SPED: ${e.message}`),
  });
}
