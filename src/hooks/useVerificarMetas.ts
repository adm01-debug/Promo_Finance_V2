import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { toastGoalAchieved, toastWithConfetti } from '@/lib/toast-confetti';

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
      
      // Verifica se há metas atingidas
      if (data?.metas_atingidas && data.metas_atingidas.length > 0) {
        // Dispara celebração para cada meta atingida
        data.metas_atingidas.forEach((meta: { titulo: string }, index: number) => {
          setTimeout(() => {
            toastGoalAchieved(meta.titulo);
          }, index * 1500); // Staggers celebrations
        });
      } else if (data?.alertas_metas > 0) {
        toast.warning(`${data.alertas_metas} meta(s) em risco identificada(s)`, {
          description: 'Verifique seus alertas para mais detalhes.',
        });
      } else if (data?.todas_metas_ok) {
        toastWithConfetti({
          title: 'Excelente!',
          description: 'Todas as metas estão no caminho certo!',
          level: 'subtle',
          theme: 'success',
        });
      } else {
        toast.success('Metas verificadas com sucesso!');
      }
    },
    onError: (error) => {
      console.error('Erro ao verificar metas:', error);
      toast.error('Erro ao verificar metas');
    },
  });
}
