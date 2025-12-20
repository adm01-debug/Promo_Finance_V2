import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useVerificarMetas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.functions.invoke('gerar-alertas', {
        body: { 
          incluirMetas: true,
          userId: user?.id 
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-nao-lidos-count'] });
      
      if (data?.alertas_metas > 0) {
        toast.warning(`${data.alertas_metas} meta(s) em risco identificada(s)`, {
          description: 'Verifique seus alertas para mais detalhes.',
        });
      } else {
        toast.success('Todas as metas estão no caminho certo!');
      }
    },
    onError: (error) => {
      console.error('Erro ao verificar metas:', error);
      toast.error('Erro ao verificar metas');
    },
  });
}
