import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface AgendarConciliacaoParams {
  contaBancariaId: string;
  dataInicio: string;
  dataFim: string;
}

export function useConciliacaoRetroativa() {
  const queryClient = useQueryClient();

  const agendar = useMutation({
    mutationFn: async ({ contaBancariaId, dataInicio, dataFim }: AgendarConciliacaoParams) => {
      const { data, error } = await supabase
        .from('logs_conciliacao_retroativa')
        .insert({
          conta_bancaria_id: contaBancariaId,
          data_inicio: dataInicio,
          data_fim: dataFim,
          status: 'processando'
        })
        .select()
        .single();

      if (error) throw error;
      
      // Simulação de gatilho de processamento (em produção seria um Edge Function via Trigger)
      toast.info('Conciliação retroativa agendada e em processamento');
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logs-conciliacao-retroativa'] });
    }
  });

  return { agendar };
}
